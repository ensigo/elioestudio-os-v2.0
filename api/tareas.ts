import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: any, res: any) {
  try {
    // GET - Obtener todas las tareas con relaciones
    if (req.method === 'GET') {
      const tareas = await prisma.tarea.findMany({
        include: {
          proyecto: {
            include: {
              cliente: true
            }
          },
          assignee: true
        },
        orderBy: { createdAt: 'desc' }
      });
      return res.status(200).json(tareas);
    }

    // POST - Crear una nueva tarea
    if (req.method === 'POST') {
      const { title, description, status, priority, type, proyectoId, assigneeId, estimatedHours, dueDate } = req.body;

      if (!title || !proyectoId) {
        return res.status(400).json({ error: 'Título y proyecto son obligatorios' });
      }

      const nuevaTarea = await prisma.tarea.create({
        data: {
          title,
          description: description || null,
          status: status || 'PENDING',
          priority: priority || 'MEDIUM',
          type: type || 'OPERATIONAL',
          proyectoId,
          assigneeId: assigneeId || null,
          estimatedHours: estimatedHours ? parseFloat(estimatedHours) : null,
          dueDate: dueDate ? new Date(dueDate) : null
        },
        include: {
          proyecto: {
            include: {
              cliente: true
            }
          },
          assignee: true
        }
      });

      return res.status(201).json(nuevaTarea);
    }

    // PUT - Actualizar tarea
    if (req.method === 'PUT') {
      const { id, title, description, status, priority, type, proyectoId, assigneeId, estimatedHours, dueDate } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'ID es obligatorio' });
      }

      const tareaActualizada = await prisma.tarea.update({
        where: { id },
        data: {
          title,
          description,
          status,
          priority,
          type,
          proyectoId,
          assigneeId,
          estimatedHours: estimatedHours ? parseFloat(estimatedHours) : null,
          dueDate: dueDate ? new Date(dueDate) : null
        },
        include: {
          proyecto: {
            include: {
              cliente: true
            }
          },
          assignee: true
        }
      });

      return res.status(200).json(tareaActualizada);
    }

    // DELETE - Eliminar tarea
    if (req.method === 'DELETE') {
      const { id } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'ID es obligatorio' });
      }

      await prisma.tarea.delete({
        where: { id }
      });

      return res.status(200).json({ message: 'Tarea eliminada' });
    }

    return res.status(405).json({ error: 'Método no permitido' });

  } catch (error: any) {
    console.error('Error en API tareas:', error);
    return res.status(500).json({ error: 'Error en la API', details: error.message });
  } finally {
    await prisma.$disconnect();
  }
}