import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { prisma } from '../lib/prisma';

const BCRYPT_ROUNDS = 12;

function sha256Hash(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

async function verifyPassword(password: string, stored: string): Promise<{ valid: boolean; needsRehash: boolean }> {
  // Try bcrypt first
  const isBcrypt = stored.startsWith('$2');
  if (isBcrypt) {
    const valid = await bcrypt.compare(password, stored);
    return { valid, needsRehash: false };
  }
  // Fallback: legacy SHA-256 — migrate to bcrypt on success
  const valid = sha256Hash(password) === stored;
  return { valid, needsRehash: valid };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'POST') {
      const { action, email, password, newPassword, userId } = req.body as Record<string, string>;

      // LOGIN
      if (action === 'login') {
        if (!email || !password) {
          return res.status(400).json({ error: 'Email y contraseña son obligatorios' });
        }

        const usuario = await prisma.usuario.findFirst({
          where: { email: email.toLowerCase() },
        });

        if (!usuario || !usuario.password) {
          return res.status(401).json({ error: 'Credenciales incorrectas' });
        }

        const { valid, needsRehash } = await verifyPassword(password, usuario.password);

        if (!valid) {
          return res.status(401).json({ error: 'Credenciales incorrectas' });
        }

        // Migrate SHA-256 hash to bcrypt transparently
        if (needsRehash) {
          const newHash = await hashPassword(password);
          await prisma.usuario.update({
            where: { id: usuario.id },
            data: { password: newHash },
          });
        }

        const { password: _, ...usuarioSinPassword } = usuario;
        return res.status(200).json({ success: true, usuario: usuarioSinPassword });
      }

      // CAMBIAR CONTRASEÑA (usuario autenticado cambia la suya)
      if (action === 'change-password') {
        if (!userId || !password || !newPassword) {
          return res.status(400).json({ error: 'Datos incompletos' });
        }

        const usuario = await prisma.usuario.findUnique({ where: { id: userId } });

        if (!usuario) {
          return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        if (usuario.password) {
          const { valid } = await verifyPassword(password, usuario.password);
          if (!valid) {
            return res.status(401).json({ error: 'Contraseña actual incorrecta' });
          }
        }

        await prisma.usuario.update({
          where: { id: userId },
          data: { password: await hashPassword(newPassword) },
        });

        return res.status(200).json({ success: true, message: 'Contraseña actualizada' });
      }

      // ESTABLECER CONTRASEÑA (solo admin — verifica rol desde BD, no desde body)
      if (action === 'set-password') {
        const adminId = req.headers['x-user-id'] as string | undefined;
        const { targetUserId, targetPassword } = req.body as Record<string, string>;

        if (!adminId) {
          return res.status(401).json({ error: 'No autenticado' });
        }

        const adminUser = await prisma.usuario.findUnique({
          where: { id: adminId },
          select: { role: true },
        });

        if (!adminUser || !['ADMIN', 'SUPERADMIN'].includes(adminUser.role)) {
          return res.status(403).json({ error: 'No tienes permisos para esta acción' });
        }

        if (!targetUserId || !targetPassword) {
          return res.status(400).json({ error: 'Datos incompletos' });
        }

        await prisma.usuario.update({
          where: { id: targetUserId },
          data: { password: await hashPassword(targetPassword) },
        });

        return res.status(200).json({ success: true, message: 'Contraseña establecida' });
      }

      return res.status(400).json({ error: 'Acción no válida' });
    }

    // GET — Verificar sesión por userId
    if (req.method === 'GET') {
      const { userId } = req.query;

      if (!userId) {
        return res.status(400).json({ error: 'ID de usuario requerido' });
      }

      const usuario = await prisma.usuario.findUnique({
        where: { id: userId as string },
      });

      if (!usuario) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      const { password: _, ...usuarioSinPassword } = usuario;
      return res.status(200).json({ usuario: usuarioSinPassword });
    }

    return res.status(405).json({ error: 'Método no permitido' });
  } catch (error) {
    console.error('Error en API auth:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}
