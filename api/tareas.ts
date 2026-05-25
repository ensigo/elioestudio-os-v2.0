import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../lib/api-middleware';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { resource } = req.query;

    if (resource === 'generar-recurrentes') {
      return handleGenerarRecurrentes(req, res);
    }

    const userId = await requireAuth(req, res);
    if (!userId) return;

    if (resource === 'recurrentes') {
      return handleRecurrentes(req, res);
    }

    if (req.method === 'GET') {
      const tareas = await prisma.tarea.findMany({
        include: {
          proyecto: { include: { cliente: true } },
          assignee: true,
        },
        orderBy: { createdAt: 'desc' },
      });
      return res.status(200).json(tareas);
    }

    if (req.method === 'POST') {
      const { title, description, status, priority, type, proyectoId, assigneeId, estimatedHours, dueDate, isRecurring, recurrenceFrequency, leadTime } = req.body;

      if (!title || !proyectoId) {
        return res.status(400).json({ error: 'Título y proyecto son obligatorios' });
      }

      if (isRecurring) {
        const proximaGeneracion = calcularProximaGeneracion(recurrenceFrequency, null);

        const tareaRecurrente = await prisma.tareas_recurrentes.create({
          data: {
            id: `tr_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`,
            titulo: title,
            descripcion: description || null,
            proyectoId,
            assigneeId: assigneeId || null,
            prioridad: priority || 'MEDIUM',
            tipo: type || 'OPERATIONAL',
            horasEstimadas: estimatedHours ? parseFloat(estimatedHours) : null,
            frecuencia: recurrenceFrequency || 'WEEKLY',
            diasAntelacion: leadTime || 3,
            proximaGeneracion,
            activa: true,
            updatedAt: new Date(),
          },
          include: { proyectos: { include: { cliente: true } } },
        });

        const primeraTarea = await prisma.tarea.create({
          data: {
            title,
            description: description || null,
            status: 'PENDING',
            priority: priority || 'MEDIUM',
            type: type || 'OPERATIONAL',
            proyectoId,
            assigneeId: assigneeId || null,
            estimatedHours: estimatedHours ? parseFloat(estimatedHours) : null,
            dueDate: dueDate ? new Date(dueDate) : proximaGeneracion,
          },
          include: { proyecto: { include: { cliente: true } }, assignee: true },
        });

        return res.status(201).json({ ...primeraTarea, tareaRecurrenteId: tareaRecurrente.id });
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
          dueDate: dueDate ? new Date(dueDate) : null,
        },
        include: { proyecto: { include: { cliente: true } }, assignee: true },
      });

      return res.status(201).json(nuevaTarea);
    }

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
          dueDate: dueDate ? new Date(dueDate) : null,
        },
        include: { proyecto: { include: { cliente: true } }, assignee: true },
      });

      return res.status(200).json(tareaActualizada);
    }

    if (req.method === 'DELETE') {
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: 'ID es obligatorio' });
      await prisma.tarea.delete({ where: { id } });
      return res.status(200).json({ message: 'Tarea eliminada' });
    }

    return res.status(405).json({ error: 'Método no permitido' });
  } catch (error) {
    console.error('Error en API tareas:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

async function handleRecurrentes(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    const tareasRecurrentes = await prisma.tareas_recurrentes.findMany({
      where: { activa: true },
      include: { proyectos: { include: { cliente: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return res.status(200).json(tareasRecurrentes);
  }

  if (req.method === 'PUT') {
    const { id, ...data } = req.body;
    if (!id) return res.status(400).json({ error: 'ID requerido' });
    if (data.frecuencia) {
      data.proximaGeneracion = calcularProximaGeneracion(data.frecuencia, data.diaEjecucion);
    }
    const actualizada = await prisma.tareas_recurrentes.update({ where: { id }, data: { ...data, updatedAt: new Date() } });
    return res.status(200).json(actualizada);
  }

  if (req.method === 'DELETE') {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'ID requerido' });
    await prisma.tareas_recurrentes.update({ where: { id }, data: { activa: false, updatedAt: new Date() } });
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Método no permitido' });
}

async function handleGenerarRecurrentes(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Usar POST' });
  }

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const tareasRecurrentes = await prisma.tareas_recurrentes.findMany({
    where: {
      activa: true,
      proximaGeneracion: { lte: new Date(hoy.getTime() + 7 * 24 * 60 * 60 * 1000) },
    },
  });

  const tareasCreadas = [];

  for (const tr of tareasRecurrentes) {
    const tareaExistente = await prisma.tarea.findFirst({
      where: {
        title: tr.titulo,
        proyectoId: tr.proyectoId,
        status: { in: ['PENDING', 'IN_PROGRESS'] },
        dueDate: tr.proximaGeneracion,
      },
    });

    if (!tareaExistente && tr.proximaGeneracion) {
      const fechaCreacion = new Date(tr.proximaGeneracion);
      fechaCreacion.setDate(fechaCreacion.getDate() - tr.diasAntelacion);

      if (hoy >= fechaCreacion) {
        const nuevaTarea = await prisma.tarea.create({
          data: {
            title: tr.titulo,
            description: tr.descripcion,
            status: 'PENDING',
            priority: tr.prioridad,
            type: tr.tipo,
            proyectoId: tr.proyectoId,
            assigneeId: tr.assigneeId,
            estimatedHours: tr.horasEstimadas,
            dueDate: tr.proximaGeneracion,
          },
        });

        tareasCreadas.push(nuevaTarea);

        const siguienteGeneracion = calcularProximaGeneracion(tr.frecuencia, tr.diaEjecucion);
        await prisma.tareas_recurrentes.update({
          where: { id: tr.id },
          data: { ultimaGeneracion: new Date(), proximaGeneracion: siguienteGeneracion, updatedAt: new Date() },
        });
      }
    }
  }

  return res.status(200).json({ message: `Generadas ${tareasCreadas.length} tareas`, tareas: tareasCreadas });
}

function calcularProximaGeneracion(frecuencia: string, diaEjecucion?: number | null): Date {
  const resultado = new Date();

  switch (frecuencia) {
    case 'DAILY':
      resultado.setDate(resultado.getDate() + 1);
      break;
    case 'WEEKLY': {
      const diaObjetivo = diaEjecucion || 1;
      const diaActual = resultado.getDay() || 7;
      let diasHasta = diaObjetivo - diaActual;
      if (diasHasta <= 0) diasHasta += 7;
      resultado.setDate(resultado.getDate() + diasHasta);
      break;
    }
    case 'MONTHLY':
      resultado.setMonth(resultado.getMonth() + 1);
      resultado.setDate(diaEjecucion || 1);
      break;
    case 'QUARTERLY':
      resultado.setMonth(resultado.getMonth() + 3);
      resultado.setDate(1);
      break;
  }

  resultado.setHours(9, 0, 0, 0);
  return resultado;
}
