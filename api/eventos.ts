import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: any, res: any) {
  try {
    // GET - Obtener todos los eventos
    if (req.method === 'GET') {
      const eventos = await prisma.evento.findMany({
        include: {
          createdBy: true
        },
        orderBy: { startDate: 'asc' }
      });
      return res.status(200).json(eventos);
    }

    // POST - Crear un nuevo evento
    if (req.method === 'POST') {
      const { title, description, type, startDate, endDate, startTime, endTime, allDay, color, createdById } = req.body;

      if (!title || !startDate) {
        return res.status(400).json({ error: 'Título y fecha son obligatorios' });
      }

      const nuevoEvento = await prisma.evento.create({
        data: {
          title,
          description: description || null,
          type: type || 'MEETING',
          startDate: new Date(startDate),
          endDate: endDate ? new Date(endDate) : null,
          startTime: startTime || null,
          endTime: endTime || null,
          allDay: allDay || false,
          color: color || null,
          createdById: createdById || null
        },
        include: {
          createdBy: true
        }
      });

      return res.status(201).json(nuevoEvento);
    }

    // PUT - Actualizar evento
    if (req.method === 'PUT') {
      const { id, title, description, type, startDate, endDate, startTime, endTime, allDay, color } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'ID es obligatorio' });
      }

      const eventoActualizado = await prisma.evento.update({
        where: { id },
        data: {
          title,
          description,
          type,
          startDate: startDate ? new Date(startDate) : undefined,
          endDate: endDate ? new Date(endDate) : null,
          startTime,
          endTime,
          allDay,
          color
        },
        include: {
          createdBy: true
        }
      });

      return res.status(200).json(eventoActualizado);
    }

    // DELETE - Eliminar evento
    if (req.method === 'DELETE') {
      const { id } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'ID es obligatorio' });
      }

      await prisma.evento.delete({
        where: { id }
      });

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