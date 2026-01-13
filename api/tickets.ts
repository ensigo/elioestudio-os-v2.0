import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: any, res: any) {
  try {
    const { resource } = req.query;

    // Rutas para respuestas
    if (resource === 'respuestas') {
      return handleRespuestas(req, res);
    }

    // GET - Obtener tickets
    if (req.method === 'GET') {
      const { id } = req.query;
      
      if (id) {
        // Obtener un ticket específico con sus respuestas
        const ticket = await prisma.ticket.findUnique({
          where: { id },
          include: {
            sender: true,
            recipient: true,
            respuestas: {
              include: { usuarios: true },
              orderBy: { createdAt: 'asc' }
            }
          }
        });
        return res.status(200).json(ticket);
      }
      
      const tickets = await prisma.ticket.findMany({
        include: {
          sender: true,
          recipient: true,
          respuestas: {
            include: { usuarios: true },
            orderBy: { createdAt: 'asc' }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
      return res.status(200).json(tickets);
    }

    // POST - Crear ticket
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
          status: 'OPEN',
          senderId,
          recipientId: recipientId || null,
          readBy: [senderId]
        },
        include: {
          sender: true,
          recipient: true,
          respuestas: true
        }
      });

      return res.status(201).json(nuevoTicket);
    }

    // PUT - Actualizar ticket
    if (req.method === 'PUT') {
      const { id, title, description, status, priority, recipientId, readBy } = req.body;
      
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
          recipientId,
          readBy
        },
        include: {
          sender: true,
          recipient: true,
          respuestas: {
            include: { usuarios: true },
            orderBy: { createdAt: 'asc' }
          }
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

      await prisma.ticket.delete({ where: { id } });
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

// ============ HANDLER RESPUESTAS ============
async function handleRespuestas(req: any, res: any) {
  // GET - Obtener respuestas de un ticket
  if (req.method === 'GET') {
    const { ticketId } = req.query;
    
    if (!ticketId) {
      return res.status(400).json({ error: 'ticketId es obligatorio' });
    }

    const respuestas = await prisma.ticket_respuestas.findMany({
      where: { ticketId },
      include: { usuarios: true },
      orderBy: { createdAt: 'asc' }
    });

    return res.status(200).json(respuestas);
  }

  // POST - Crear respuesta
  if (req.method === 'POST') {
    const { ticketId, userId, mensaje } = req.body;

    if (!ticketId || !userId || !mensaje) {
      return res.status(400).json({ error: 'ticketId, userId y mensaje son obligatorios' });
    }

    const nuevaRespuesta = await prisma.ticket_respuestas.create({
      data: {
        ticketId,
        userId,
        mensaje
      },
      include: { usuarios: true }
    });

    // Actualizar el ticket para marcarlo como actualizado
    await prisma.ticket.update({
      where: { id: ticketId },
      data: { updatedAt: new Date() }
    });

    return res.status(201).json(nuevaRespuesta);
  }

  // DELETE - Eliminar respuesta
  if (req.method === 'DELETE') {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'ID es obligatorio' });
    }

    await prisma.ticket_respuestas.delete({ where: { id } });
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Método no permitido' });
}
