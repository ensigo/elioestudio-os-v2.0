import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: any, res: any) {
  try {
    // GET - Obtener todos los usuarios
    if (req.method === 'GET') {
      const usuarios = await prisma.usuario.findMany({
        orderBy: { createdAt: 'desc' }
      });
      return res.status(200).json(usuarios);
    }

    // POST - Crear un nuevo usuario
    if (req.method === 'POST') {
      const { name, email, role, position, avatarUrl } = req.body;

      if (!name || !email) {
        return res.status(400).json({ error: 'Nombre y email son obligatorios' });
      }

      const nuevoUsuario = await prisma.usuario.create({
        data: {
          name,
          email,
          role: role || 'DEV',
          position: position || null,
          avatarUrl: avatarUrl || null,
          joinDate: new Date()
        }
      });

      return res.status(201).json(nuevoUsuario);
    }

    // PUT - Actualizar usuario
    if (req.method === 'PUT') {
      const { id, name, email, role, position, avatarUrl } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'ID es obligatorio' });
      }

      const usuarioActualizado = await prisma.usuario.update({
        where: { id },
        data: {
          name,
          email,
          role,
          position,
          avatarUrl
        }
      });

      return res.status(200).json(usuarioActualizado);
    }

    // DELETE - Eliminar usuario
    if (req.method === 'DELETE') {
      const { id } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'ID es obligatorio' });
      }

      await prisma.usuario.delete({
        where: { id }
      });

      return res.status(200).json({ message: 'Usuario eliminado' });
    }

    return res.status(405).json({ error: 'Método no permitido' });

  } catch (error: any) {
    console.error('Error en API usuarios:', error);
    return res.status(500).json({ error: 'Error en la API', details: error.message });
  } finally {
    await prisma.$disconnect();
  }
}