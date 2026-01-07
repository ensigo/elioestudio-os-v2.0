import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export default async function handler(req: any, res: any) {
  try {
    if (req.method === 'GET') {
      const eventos = await prisma.eventos.findMany({
        include: { createdBy: true },
        orderBy: { startDate: 'asc' }
      });
      return res.status(200).json(eventos);
    }

    if (req.method === 'POST') {
      const { title, description, type, startDate, endDate, startTime, endTime, allDay, color, createdById } = req.body;
      if (!title || !startDate) return res.status(400).json({ error: 'Título y fecha son obligatorios' });

      const nuevoEvento = await prisma.eventos.create({
        data: {
          id: 'evt_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 9),
          title, description: description || null, type: type || 'MEETING',
          startDate: new Date(startDate), endDate: endDate ? new Date(endDate) : null,
          startTime: startTime || null, endTime: endTime || null,
          allDay: allDay || false, color: color || null, createdById: createdById || null,
          updatedAt: new Date()
        },
        include: { createdBy: true }
      });
      return res.status(201).json(nuevoEvento);
    }

    if (req.method === 'PUT') {
      const { id, title, description, type, startDate, endDate, startTime, endTime, allDay, color } = req.body;
      if (!id) return res.status(400).json({ error: 'ID es obligatorio' });

      const eventoActualizado = await prisma.eventos.update({
        where: { id },
        data: {
          title, description, type,
          startDate: startDate ? new Date(startDate) : undefined,
          endDate: endDate ? new Date(endDate) : null,
          startTime, endTime, allDay, color, updatedAt: new Date()
        },
        include: { createdBy: true }
      });
      return res.status(200).json(eventoActualizado);
    }

    if (req.method === 'DELETE') {
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: 'ID es obligatorio' });
      await prisma.eventos.delete({ where: { id } });
      return res.status(200).json({ message: 'Evento eliminado' });
    }

    return res.status(405).json({ error: 'Método no permitido' });
  } catch (error: any) {
    console.error('Error en API eventos:', error);
    return res.status(500).json({ error: 'Error en la API', details: error.message });
  } finally {
    await prisma.$disconnect();
  }
}