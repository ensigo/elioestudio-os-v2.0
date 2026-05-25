import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../lib/api-middleware';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userId = requireAuth(req, res);
  if (!userId) return;

  try {
    const { resource } = req.query;
    if (resource === 'respuestas') return handleRespuestas(req, res);

    if (req.method === 'GET') {
      const { id } = req.query;
      if (id) {
        const ticket = await prisma.ticket.findUnique({
          where: { id: id as string },
          include: { sender: true, recipient: true, respuestas: { include: { usuarios: true }, orderBy: { createdAt: 'asc' } } },
        });
        return res.status(200).json(ticket);
      }
      const tickets = await prisma.ticket.findMany({
        include: { sender: true, recipient: true, respuestas: { include: { usuarios: true }, orderBy: { createdAt: 'asc' } } },
        orderBy: { createdAt: 'desc' },
      });
      return res.status(200).json(tickets);
    }

    if (req.method === 'POST') {
      const { title, description, priority, senderId, recipientId } = req.body;
      if (!title || !senderId) return res.status(400).json({ error: 'Título y remitente son obligatorios' });
      const nuevoTicket = await prisma.ticket.create({
        data: { title, description: description || null, priority: priority || 'MEDIUM', status: 'OPEN', senderId, recipientId: recipientId || null, readBy: [senderId] },
        include: { sender: true, recipient: true, respuestas: true },
      });
      return res.status(201).json(nuevoTicket);
    }

    if (req.method === 'PUT') {
      const { id, title, description, status, priority, recipientId, readBy } = req.body;
      if (!id) return res.status(400).json({ error: 'ID es obligatorio' });
      const ticketActualizado = await prisma.ticket.update({
        where: { id },
        data: { title, description, status, priority, recipientId, readBy },
        include: { sender: true, recipient: true, respuestas: { include: { usuarios: true }, orderBy: { createdAt: 'asc' } } },
      });
      return res.status(200).json(ticketActualizado);
    }

    if (req.method === 'DELETE') {
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: 'ID es obligatorio' });
      await prisma.ticket.delete({ where: { id } });
      return res.status(200).json({ message: 'Ticket eliminado' });
    }

    return res.status(405).json({ error: 'Método no permitido' });
  } catch (error) {
    console.error('Error en API tickets:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

async function handleRespuestas(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    const { ticketId } = req.query;
    if (!ticketId) return res.status(400).json({ error: 'ticketId es obligatorio' });
    const respuestas = await prisma.ticket_respuestas.findMany({
      where: { ticketId: ticketId as string },
      include: { usuarios: true },
      orderBy: { createdAt: 'asc' },
    });
    return res.status(200).json(respuestas);
  }

  if (req.method === 'POST') {
    const { ticketId, userId, mensaje } = req.body;
    if (!ticketId || !userId || !mensaje) return res.status(400).json({ error: 'ticketId, userId y mensaje son obligatorios' });
    const nuevaRespuesta = await prisma.ticket_respuestas.create({
      data: { id: `resp_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`, ticketId, userId, mensaje },
      include: { usuarios: true },
    });
    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId }, select: { senderId: true, recipientId: true } });
    if (!ticket) return res.status(404).json({ error: 'Ticket no encontrado' });
    await prisma.ticket.update({ where: { id: ticketId }, data: { updatedAt: new Date(), readBy: [userId] } });
    return res.status(201).json(nuevaRespuesta);
  }

  if (req.method === 'DELETE') {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'ID es obligatorio' });
    await prisma.ticket_respuestas.delete({ where: { id } });
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Método no permitido' });
}
