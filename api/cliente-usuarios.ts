import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: any, res: any) {
  try {
    // GET - Obtener usuarios asignados a un cliente
    if (req.method === 'GET') {
      const { clienteId } = req.query;
      
      if (!clienteId) {
        return res.status(400).json({ error: 'clienteId es requerido' });
      }

      const asignaciones = await prisma.clienteUsuario.findMany({
        where: { clienteId },
        include: {
          usuario: true
        },
        orderBy: { createdAt: 'desc' }
      });
      
      return res.status(200).json(asignaciones);
    }

    // POST - Asignar usuario a cliente
    if (req.method === 'POST') {
      const { clienteId, usuarioId, role } = req.body;

      if (!clienteId || !usuarioId) {
        return res.status(400).json({ error: 'clienteId y usuarioId son requeridos' });
      }

      // Verificar si ya existe la asignación
      const existente = await prisma.clienteUsuario.findUnique({
        where: {
          clienteId_usuarioId: { clienteId, usuarioId }
        }
      });

      if (existente) {
        return res.status(400).json({ error: 'El usuario ya está asignado a este cliente' });
      }

      const asignacion = await prisma.clienteUsuario.create({
        data: {
          clienteId,
          usuarioId,
          role: role || 'MEMBER'
        },
        include: {
          usuario: true
        }
      });

      return res.status(201).json(asignacion);
    }

    // PUT - Actualizar rol del usuario en cliente
    if (req.method === 'PUT') {
      const { id, role } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'id es requerido' });
      }

      const asignacion = await prisma.clienteUsuario.update({
        where: { id },
        data: { role },
        include: {
          usuario: true
        }
      });

      return res.status(200).json(asignacion);
    }

    // DELETE - Eliminar asignación
    if (req.method === 'DELETE') {
      const { id } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'id es requerido' });
      }

      await prisma.clienteUsuario.delete({
        where: { id }
      });

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Método no permitido' });

  } catch (error: any) {
    console.error('Error en API cliente-usuarios:', error);
    return res.status(500).json({ error: 'Error en la API', details: error.message });
  } finally {
    await prisma.$disconnect();
  }
}
