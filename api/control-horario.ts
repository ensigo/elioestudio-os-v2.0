import type { VercelRequest, VercelResponse } from '@vercel/node';
import { randomUUID } from 'crypto';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../lib/api-middleware';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const { entity } = req.query;

  try {
    if (entity === 'jornadas' || !entity) {
      if (req.method === 'GET') {
        const { usuarioId, fecha, mes, año } = req.query;
        const where: Record<string, unknown> = {};
        if (usuarioId) where.usuarioId = usuarioId;
        if (fecha) where.fecha = new Date(fecha as string);
        if (mes && año) { const inicioMes = new Date(parseInt(año as string), parseInt(mes as string) - 1, 1); const finMes = new Date(parseInt(año as string), parseInt(mes as string), 0); where.fecha = { gte: inicioMes, lte: finMes }; }
        const jornadas = await prisma.jornadas.findMany({ where, include: { usuario: { select: { id: true, name: true, email: true, position: true, tipoContrato: true } } }, orderBy: [{ fecha: 'desc' }, { horaInicio: 'desc' }] });
        return res.status(200).json(jornadas);
      }
      if (req.method === 'POST') {
        const { action, usuarioId } = req.body;
        const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
        if (action === 'iniciar') {
          const jornadaExistente = await prisma.jornadas.findUnique({ where: { usuarioId_fecha: { usuarioId, fecha: hoy } } });
          if (jornadaExistente) return res.status(400).json({ error: 'Ya existe una jornada para hoy' });
          return res.status(201).json(await prisma.jornadas.create({ data: { id: randomUUID(), usuarioId, fecha: hoy, horaInicio: new Date(), estado: 'EN_CURSO', updatedAt: new Date() }, include: { usuario: { select: { id: true, name: true, email: true, position: true } } } }));
        }
        if (action === 'pausar') {
          const jornada = await prisma.jornadas.findUnique({ where: { usuarioId_fecha: { usuarioId, fecha: hoy } } });
          if (!jornada) return res.status(404).json({ error: 'No hay jornada activa' });
          return res.status(200).json(await prisma.jornadas.update({ where: { id: jornada.id }, data: { horaPausaAlmuerzo: new Date(), estado: 'PAUSADA', updatedAt: new Date() }, include: { usuario: { select: { id: true, name: true, email: true, position: true } } } }));
        }
        if (action === 'reanudar') {
          const jornada = await prisma.jornadas.findUnique({ where: { usuarioId_fecha: { usuarioId, fecha: hoy } } });
          if (!jornada) return res.status(404).json({ error: 'No hay jornada para reanudar' });
          return res.status(200).json(await prisma.jornadas.update({ where: { id: jornada.id }, data: { horaReinicioAlmuerzo: new Date(), estado: 'EN_CURSO', updatedAt: new Date() }, include: { usuario: { select: { id: true, name: true, email: true, position: true } } } }));
        }
        if (action === 'finalizar') {
          const jornada = await prisma.jornadas.findUnique({ where: { usuarioId_fecha: { usuarioId, fecha: hoy } } });
          if (!jornada) return res.status(404).json({ error: 'No hay jornada activa' });
          const ahora = new Date();
          let totalMinutos = 0;
          if (jornada.horaPausaAlmuerzo && jornada.horaReinicioAlmuerzo) {
            totalMinutos = Math.floor((jornada.horaPausaAlmuerzo.getTime() - jornada.horaInicio.getTime()) / 60000) + Math.floor((ahora.getTime() - jornada.horaReinicioAlmuerzo.getTime()) / 60000);
          } else {
            totalMinutos = Math.floor((ahora.getTime() - jornada.horaInicio.getTime()) / 60000);
          }
          return res.status(200).json(await prisma.jornadas.update({ where: { id: jornada.id }, data: { horaFin: ahora, totalMinutos, estado: 'FINALIZADA', updatedAt: new Date() }, include: { usuario: { select: { id: true, name: true, email: true, position: true } } } }));
        }
        return res.status(400).json({ error: 'Acción no válida' });
      }
      if (req.method === 'PUT') {
        const { id, horaInicio, horaPausaAlmuerzo, horaReinicioAlmuerzo, horaFin } = req.body;
        if (!id) return res.status(400).json({ error: 'ID es obligatorio' });
        const dataToUpdate: Record<string, unknown> = { updatedAt: new Date() };
        if (horaInicio) dataToUpdate.horaInicio = new Date(horaInicio);
        if (horaPausaAlmuerzo) dataToUpdate.horaPausaAlmuerzo = new Date(horaPausaAlmuerzo);
        if (horaReinicioAlmuerzo) dataToUpdate.horaReinicioAlmuerzo = new Date(horaReinicioAlmuerzo);
        if (horaFin) {
          dataToUpdate.horaFin = new Date(horaFin); dataToUpdate.estado = 'FINALIZADA';
          const jornada = await prisma.jornadas.findUnique({ where: { id } });
          if (jornada) {
            const inicio = (dataToUpdate.horaInicio || jornada.horaInicio) as Date;
            const pausa = (dataToUpdate.horaPausaAlmuerzo || jornada.horaPausaAlmuerzo) as Date | null;
            const reinicio = (dataToUpdate.horaReinicioAlmuerzo || jornada.horaReinicioAlmuerzo) as Date | null;
            const fin = dataToUpdate.horaFin as Date;
            dataToUpdate.totalMinutos = pausa && reinicio ? Math.floor((pausa.getTime() - inicio.getTime()) / 60000) + Math.floor((fin.getTime() - reinicio.getTime()) / 60000) : Math.floor((fin.getTime() - inicio.getTime()) / 60000);
          }
        }
        return res.status(200).json(await prisma.jornadas.update({ where: { id }, data: dataToUpdate, include: { usuario: { select: { id: true, name: true, email: true, position: true } } } }));
      }
      if (req.method === 'DELETE') {
        const { id } = req.body;
        if (!id) return res.status(400).json({ error: 'ID es obligatorio' });
        await prisma.jornadas.delete({ where: { id } });
        return res.status(200).json({ message: 'Jornada eliminada' });
      }
    }

    if (entity === 'time-entries') {
      if (req.method === 'GET') {
        const { tareaId, userId: queryUserId, mes, año, fechaInicio, fechaFin } = req.query;
        const where: Record<string, unknown> = {};
        if (tareaId) where.tareaId = tareaId;
        if (queryUserId) where.userId = queryUserId;
        if (fechaInicio && fechaFin) { where.startTime = { gte: new Date(fechaInicio as string), lte: new Date(fechaFin as string) }; }
        else if (mes && año) { const m = parseInt(mes as string); const a = parseInt(año as string); where.startTime = { gte: new Date(a, m - 1, 1), lte: new Date(a, m, 0, 23, 59, 59) }; }
        return res.status(200).json(await prisma.timeEntry.findMany({ where, include: { usuario: { select: { id: true, name: true } }, tarea: { include: { proyecto: { include: { cliente: true } } } } }, orderBy: { startTime: 'desc' } }));
      }
      if (req.method === 'POST') {
        const { userId: entryUserId, tareaId, description } = req.body;
        if (!entryUserId) return res.status(400).json({ error: 'userId es obligatorio' });
        return res.status(201).json(await prisma.timeEntry.create({ data: { userId: entryUserId, tareaId: tareaId || null, startTime: new Date(), description: description || null }, include: { usuario: { select: { id: true, name: true } }, tarea: { include: { proyecto: { include: { cliente: true } } } } } }));
      }
      if (req.method === 'PUT') {
        const { id, endTime, description } = req.body;
        if (!id) return res.status(400).json({ error: 'ID es obligatorio' });
        return res.status(200).json(await prisma.timeEntry.update({ where: { id }, data: { endTime: endTime ? new Date(endTime) : new Date(), description }, include: { usuario: { select: { id: true, name: true } }, tarea: { include: { proyecto: { include: { cliente: true } } } } } }));
      }
      if (req.method === 'DELETE') {
        const { id } = req.body;
        if (!id) return res.status(400).json({ error: 'ID es obligatorio' });
        await prisma.timeEntry.delete({ where: { id } });
        return res.status(200).json({ message: 'Time entry eliminado' });
      }
    }

    if (entity === 'equipo-activo') {
      if (req.method !== 'GET') return res.status(405).json({ error: 'Método no permitido' });
      const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
      const [jornadas, entriesActivos] = await Promise.all([
        prisma.jornadas.findMany({
          where: { fecha: hoy },
          include: { usuario: { select: { id: true, name: true, position: true } } },
          orderBy: { horaInicio: 'asc' }
        }),
        prisma.timeEntry.findMany({
          where: { endTime: null },
          include: { tarea: { select: { title: true, proyecto: { select: { title: true, cliente: { select: { name: true } } } } } }, usuario: { select: { id: true } } }
        })
      ]);
      const resultado = jornadas.map(j => {
        const entry = entriesActivos.find(e => e.userId === j.usuarioId);
        const minutosEnTarea = entry ? Math.floor((Date.now() - new Date(entry.startTime).getTime()) / 60000) : null;
        return {
          usuario: j.usuario,
          jornada: { estado: j.estado, horaInicio: j.horaInicio },
          tareaActiva: entry ? {
            title: entry.tarea?.title || 'Trabajando',
            proyecto: entry.tarea?.proyecto?.title || '',
            cliente: entry.tarea?.proyecto?.cliente?.name || '',
            minutos: minutosEnTarea
          } : null
        };
      });
      return res.status(200).json(resultado);
    }

    return res.status(400).json({ error: 'Entity no válida. Usa: jornadas, time-entries, equipo-activo' });
  } catch (error) {
    console.error('Error en API control-horario:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}
