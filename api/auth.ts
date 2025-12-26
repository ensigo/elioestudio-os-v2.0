import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

// Función para hashear contraseñas
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Función para verificar contraseña
function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

export default async function handler(req: any, res: any) {
  try {
    // POST /api/auth - Login
    if (req.method === 'POST') {
      const { action, email, password, newPassword, userId } = req.body;

      // LOGIN
      if (action === 'login') {
        if (!email || !password) {
          return res.status(400).json({ error: 'Email y contraseña son obligatorios' });
        }

        const usuario = await prisma.usuario.findUnique({
          where: { email: email.toLowerCase() }
        });

        if (!usuario) {
          return res.status(401).json({ error: 'Credenciales incorrectas' });
        }

        if (!usuario.password) {
          return res.status(401).json({ error: 'Usuario sin contraseña configurada. Contacta al administrador.' });
        }

        if (!verifyPassword(password, usuario.password)) {
          return res.status(401).json({ error: 'Credenciales incorrectas' });
        }

        // Login exitoso - devolver usuario sin password
        const { password: _, ...usuarioSinPassword } = usuario;
        return res.status(200).json({ 
          success: true, 
          usuario: usuarioSinPassword 
        });
      }

      // CAMBIAR CONTRASEÑA
      if (action === 'change-password') {
        if (!userId || !password || !newPassword) {
          return res.status(400).json({ error: 'Datos incompletos' });
        }

        const usuario = await prisma.usuario.findUnique({
          where: { id: userId }
        });

        if (!usuario) {
          return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        // Verificar contraseña actual
        if (usuario.password && !verifyPassword(password, usuario.password)) {
          return res.status(401).json({ error: 'Contraseña actual incorrecta' });
        }

        // Actualizar contraseña
        await prisma.usuario.update({
          where: { id: userId },
          data: { password: hashPassword(newPassword) }
        });

        return res.status(200).json({ success: true, message: 'Contraseña actualizada' });
      }

      // ESTABLECER CONTRASEÑA (solo admin)
      if (action === 'set-password') {
        const { targetUserId, targetPassword, adminRole } = req.body;

        if (!['ADMIN', 'SUPERADMIN'].includes(adminRole)) {
          return res.status(403).json({ error: 'No tienes permisos para esta acción' });
        }

        if (!targetUserId || !targetPassword) {
          return res.status(400).json({ error: 'Datos incompletos' });
        }

        await prisma.usuario.update({
          where: { id: targetUserId },
          data: { password: hashPassword(targetPassword) }
        });

        return res.status(200).json({ success: true, message: 'Contraseña establecida' });
      }

      return res.status(400).json({ error: 'Acción no válida' });
    }

    // GET /api/auth - Verificar sesión (obtener usuario por ID)
    if (req.method === 'GET') {
      const { userId } = req.query;

      if (!userId) {
        return res.status(400).json({ error: 'ID de usuario requerido' });
      }

      const usuario = await prisma.usuario.findUnique({
        where: { id: userId as string }
      });

      if (!usuario) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      const { password: _, ...usuarioSinPassword } = usuario;
      return res.status(200).json({ usuario: usuarioSinPassword });
    }

    return res.status(405).json({ error: 'Método no permitido' });

  } catch (error: any) {
    console.error('Error en API auth:', error);
    return res.status(500).json({ error: 'Error en la API', details: error.message });
  } finally {
    await prisma.$disconnect();
  }
}