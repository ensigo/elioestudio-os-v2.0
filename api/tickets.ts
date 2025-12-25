import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: any, res: any) {
  try {
    // GET - Obtener todos los tickets
    if (req.method === 'GET') {
      const tickets = await prisma.ticket.findMany({
        include: {
          cliente: true,
          assignee: true
        },
        orderBy: { createdAt: 'desc' }
      });
      return res.status(200).json(tickets);
    }

    // POST - Crear un nuevo ticket
    if (req.method === 'POST') {
      const { title, description, status, priority, clienteId, assigneeId } = req.body;

      if (!title) {
        return res.status(400).json({ error: 'El título es obligatorio' });
      }

      const nuevoTicket = await prisma.ticket.create({
        data: {
          title,
          description: description || null,
          status: status || 'OPEN',
          priority: priority || 'MEDIUM',
          clienteId: clienteId || null,
          assigneeId: assigneeId || null
        },
        include: {
          cliente: true,
          assignee: true
        }
      });

      return res.status(201).json(nuevoTicket);
    }

    // PUT - Actualizar ticket
    if (req.method === 'PUT') {
      const { id, title, description, status, priority, clienteId, assigneeId } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'ID es obligatorio' });
      }

      const ticketActualizado = await prisma.ticket.update({
        where: { id },
        data: {
          title,
          description,
          status,
          priority,
          clienteId,
          assigneeId
        },
        include: {
          cliente: true,
          assignee: true
        }
      });

      return res.status(200).json(ticketActualizado);
    }

    // DELETE - Eliminar ticket
    if (req.method === 'DELETE') {
      const { id } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'ID es obligatorio' });
      }

      await prisma.ticket.delete({
        where: { id }
      });

      return res.status(200).json({ message: 'Ticket eliminado' });
    }

    return res.status(405).json({ error: 'Método no permitido' });

  } catch (error: any) {
    console.error('Error en API tickets:', error);
    return res.status(500).json({ error: 'Error en la API', details: error.message });
  } finally {
    await prisma.$disconnect();
  }
}