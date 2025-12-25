import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: any, res: any) {
  try {
    // GET - Obtener todos los tickets
    if (req.method === 'GET') {
      const tickets = await prisma.ticket.findMany({
        include: {
          sender: true,
          recipient: true
        },
        orderBy: { createdAt: 'desc' }
      });
      return res.status(200).json(tickets);
    }

    // POST - Crear un nuevo ticket
    if (req.method === 'POST') {
      const { title, description, priority, senderId, recipientId } = req.body;

      if (!title || !senderId) {
        return res.status(400).json({ error: 'Título y remitente son obligatorios' });
      }

      const nuevoTicket = await prisma.ticket.create({
        data: {
          title,
          description: description || null,
          priority: priority || 'MEDIUM',
          senderId,
          recipientId: recipientId || null
        },
        include: {
          sender: true,
          recipient: true
        }
      });

      return res.status(201).json(nuevoTicket);
    }

    // PUT - Actualizar ticket
    if (req.method === 'PUT') {
      const { id, title, description, status, priority, recipientId } = req.body;

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
          recipientId
        },
        include: {
          sender: true,
          recipient: true
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