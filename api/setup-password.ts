import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export default async function handler(req: any, res: any) {
  // Solo permitir en desarrollo o con clave secreta
  const { secret, email, password } = req.body;

  // Clave secreta para proteger este endpoint (cámbiala)
  if (secret !== 'elio-setup-2024') {
    return res.status(403).json({ error: 'No autorizado' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son obligatorios' });
    }

    const usuario = await prisma.usuario.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    await prisma.usuario.update({
      where: { email: email.toLowerCase() },
      data: { password: hashPassword(password) }
    });

    return res.status(200).json({ 
      success: true, 
      message: `Contraseña establecida para ${usuario.name}` 
    });

  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  } finally {
    await prisma.$disconnect();
  }
}