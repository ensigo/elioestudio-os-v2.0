import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: any, res: any) {
  try {
    const { resource } = req.query;

    // Rutas para tareas recurrentes
    if (resource === 'recurrentes') {
      return handleRecurrentes(req, res);
    }

    // Ruta para generar tareas desde recurrentes (cron)
    if (resource === 'generar-recurrentes') {
      return handleGenerarRecurrentes(req, res);
    }

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
      const { title, description, status, priority, type, proyectoId, assigneeId, estimatedHours, dueDate, isRecurring, recurrenceFrequency, leadTime } = req.body;

      if (!title || !proyectoId) {
        return res.status(400).json({ error: 'Título y proyecto son obligatorios' });
      }

      // Si es recurrente, crear TareaRecurrente en lugar de Tarea normal
      if (isRecurring) {
        const proximaGeneracion = calcularProximaGeneracion(recurrenceFrequency, null);
        
        const tareaRecurrente = await prisma.tareaRecurrente.create({
          data: {
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
            activa: true
          },
          include: {
            proyecto: { include: { cliente: true } }
          }
        });

        // También crear la primera tarea inmediatamente
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
            dueDate: dueDate ? new Date(dueDate) : proximaGeneracion
          },
          include: {
            proyecto: { include: { cliente: true } },
            assignee: true
          }
        });

        return res.status(201).json({ ...primeraTarea, tareaRecurrenteId: tareaRecurrente.id });
      }

      // Tarea normal (no recurrente)
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
          proyecto: { include: { cliente: true } },
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
          proyecto: { include: { cliente: true } },
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

      await prisma.tarea.delete({ where: { id } });
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

// ============ HANDLER TAREAS RECURRENTES ============
async function handleRecurrentes(req: any, res: any) {
  // GET - Listar tareas recurrentes
  if (req.method === 'GET') {
    const tareasRecurrentes = await prisma.tareaRecurrente.findMany({
      where: { activa: true },
      include: {
        proyecto: { include: { cliente: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    return res.status(200).json(tareasRecurrentes);
  }

  // PUT - Actualizar tarea recurrente
  if (req.method === 'PUT') {
    const { id, ...data } = req.body;
    if (!id) return res.status(400).json({ error: 'ID requerido' });

    if (data.frecuencia) {
      data.proximaGeneracion = calcularProximaGeneracion(data.frecuencia, data.diaEjecucion);
    }

    const actualizada = await prisma.tareaRecurrente.update({
      where: { id },
      data
    });
    return res.status(200).json(actualizada);
  }

  // DELETE - Desactivar tarea recurrente
  if (req.method === 'DELETE') {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'ID requerido' });

    await prisma.tareaRecurrente.update({
      where: { id },
      data: { activa: false }
    });
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Método no permitido' });
}

// ============ GENERACIÓN AUTOMÁTICA DE TAREAS ============
async function handleGenerarRecurrentes(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Usar POST' });
  }

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  // Buscar tareas recurrentes activas que necesitan generarse
  const tareasRecurrentes = await prisma.tareaRecurrente.findMany({
    where: {
      activa: true,
      proximaGeneracion: { lte: new Date(hoy.getTime() + 7 * 24 * 60 * 60 * 1000) } // Próximos 7 días
    }
  });

  const tareasCreadas = [];

  for (const tr of tareasRecurrentes) {
    // Verificar si ya existe una tarea pendiente para esta recurrente
    const tareaExistente = await prisma.tarea.findFirst({
      where: {
        title: tr.titulo,
        proyectoId: tr.proyectoId,
        status: { in: ['PENDING', 'IN_PROGRESS'] },
        dueDate: tr.proximaGeneracion
      }
    });

    if (!tareaExistente && tr.proximaGeneracion) {
      // Calcular fecha considerando días de antelación
      const fechaCreacion = new Date(tr.proximaGeneracion);
      fechaCreacion.setDate(fechaCreacion.getDate() - tr.diasAntelacion);

      if (hoy >= fechaCreacion) {
        // Crear la tarea
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
            dueDate: tr.proximaGeneracion
          }
        });

        tareasCreadas.push(nuevaTarea);

        // Actualizar próxima generación
        const siguienteGeneracion = calcularProximaGeneracion(tr.frecuencia, tr.diaEjecucion);
        await prisma.tareaRecurrente.update({
          where: { id: tr.id },
          data: {
            ultimaGeneracion: new Date(),
            proximaGeneracion: siguienteGeneracion
          }
        });
      }
    }
  }

  return res.status(200).json({
    message: `Generadas ${tareasCreadas.length} tareas`,
    tareas: tareasCreadas
  });
}

// ============ UTILIDADES ============
function calcularProximaGeneracion(frecuencia: string, diaEjecucion?: number | null): Date {
  const hoy = new Date();
  const resultado = new Date(hoy);

  switch (frecuencia) {
    case 'DAILY':
      resultado.setDate(resultado.getDate() + 1);
      break;

    case 'WEEKLY':
      const diaObjetivo = diaEjecucion || 1; // 1=lunes por defecto
      const diaActual = resultado.getDay() || 7;
      let diasHastaObjetivo = diaObjetivo - diaActual;
      if (diasHastaObjetivo <= 0) diasHastaObjetivo += 7;
      resultado.setDate(resultado.getDate() + diasHastaObjetivo);
      break;

    case 'MONTHLY':
      const diaMes = diaEjecucion || 1;
      resultado.setMonth(resultado.getMonth() + 1);
      resultado.setDate(diaMes);
      break;

    case 'QUARTERLY':
      resultado.setMonth(resultado.getMonth() + 3);
      resultado.setDate(1);
      break;
  }

  resultado.setHours(9, 0, 0, 0); // 9:00 AM
  return resultado;
}
