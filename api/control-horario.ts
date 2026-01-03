import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export default async function handler(req: any, res: any) {
  const { entity } = req.query;

  try {
    // ============ JORNADAS ============
    if (entity === 'jornadas' || !entity) {
      if (req.method === 'GET') {
        const { usuarioId, fecha, mes, año } = req.query;
        let where: any = {};
        if (usuarioId) where.usuarioId = usuarioId;
        if (fecha) where.fecha = new Date(fecha);
        if (mes && año) {
          const inicioMes = new Date(parseInt(año), parseInt(mes) - 1, 1);
          const finMes = new Date(parseInt(año), parseInt(mes), 0);
          where.fecha = { gte: inicioMes, lte: finMes };
        }
        const jornadas = await prisma.jornadas.findMany({
          where,
          include: { usuario: { select: { id: true, name: true, email: true, position: true, tipoContrato: true } } },
          orderBy: [{ fecha: 'desc' }, { horaInicio: 'desc' }]
        });
        return res.status(200).json(jornadas);
      }
      if (req.method === 'POST') {
        const { action, usuarioId } = req.body;
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        if (action === 'iniciar') {
          const jornadaExistente = await prisma.jornadas.findUnique({
            where: { usuarioId_fecha: { usuarioId, fecha: hoy } }
          });
          if (jornadaExistente) return res.status(400).json({ error: 'Ya existe una jornada para hoy' });
          const nuevaJornada = await prisma.jornadas.create({
            data: {
              id: require('crypto').randomUUID(),
              usuarioId, fecha: hoy, horaInicio: new Date(), estado: 'EN_CURSO', updatedAt: new Date()
            },
            include: { usuario: { select: { id: true, name: true, email: true, position: true } } }
          });
          return res.status(201).json(nuevaJornada);
        }
        if (action === 'pausar') {
          const jornada = await prisma.jornadas.findUnique({ where: { usuarioId_fecha: { usuarioId, fecha: hoy } } });
          if (!jornada) return res.status(404).json({ error: 'No hay jornada activa' });
          const jornadaActualizada = await prisma.jornadas.update({
            where: { id: jornada.id },
            data: { horaPausaAlmuerzo: new Date(), estado: 'PAUSADA', updatedAt: new Date() },
            include: { usuario: { select: { id: true, name: true, email: true, position: true } } }
          });
          return res.status(200).json(jornadaActualizada);
        }
        if (action === 'reanudar') {
          const jornada = await prisma.jornadas.findUnique({ where: { usuarioId_fecha: { usuarioId, fecha: hoy } } });
          if (!jornada) return res.status(404).json({ error: 'No hay jornada para reanudar' });
          const jornadaActualizada = await prisma.jornadas.update({
            where: { id: jornada.id },
            data: { horaReinicioAlmuerzo: new Date(), estado: 'EN_CURSO', updatedAt: new Date() },
            include: { usuario: { select: { id: true, name: true, email: true, position: true } } }
          });
          return res.status(200).json(jornadaActualizada);
        }
        if (action === 'finalizar') {
          const jornada = await prisma.jornadas.findUnique({ where: { usuarioId_fecha: { usuarioId, fecha: hoy } } });
          if (!jornada) return res.status(404).json({ error: 'No hay jornada activa' });
          const ahora = new Date();
          let totalMinutos = 0;
          if (jornada.horaPausaAlmuerzo && jornada.horaReinicioAlmuerzo) {
            const minutosManana = Math.floor((jornada.horaPausaAlmuerzo.getTime() - jornada.horaInicio.getTime()) / 60000);
            const minutosTarde = Math.floor((ahora.getTime() - jornada.horaReinicioAlmuerzo.getTime()) / 60000);
            totalMinutos = minutosManana + minutosTarde;
          } else {
            totalMinutos = Math.floor((ahora.getTime() - jornada.horaInicio.getTime()) / 60000);
          }
          const jornadaFinalizada = await prisma.jornadas.update({
            where: { id: jornada.id },
            data: { horaFin: ahora, totalMinutos, estado: 'FINALIZADA', updatedAt: new Date() },
            include: { usuario: { select: { id: true, name: true, email: true, position: true } } }
          });
          return res.status(200).json(jornadaFinalizada);
        }
        return res.status(400).json({ error: 'Acción no válida' });
      }
      if (req.method === 'PUT') {
        const { id, horaInicio, horaPausaAlmuerzo, horaReinicioAlmuerzo, horaFin } = req.body;
        if (!id) return res.status(400).json({ error: 'ID es obligatorio' });
        const dataToUpdate: any = { updatedAt: new Date() };
        if (horaInicio) dataToUpdate.horaInicio = new Date(horaInicio);
        if (horaPausaAlmuerzo) dataToUpdate.horaPausaAlmuerzo = new Date(horaPausaAlmuerzo);
        if (horaReinicioAlmuerzo) dataToUpdate.horaReinicioAlmuerzo = new Date(horaReinicioAlmuerzo);
        if (horaFin) {
          dataToUpdate.horaFin = new Date(horaFin);
          dataToUpdate.estado = 'FINALIZADA';
          const jornada = await prisma.jornadas.findUnique({ where: { id } });
          if (jornada) {
            const inicio = dataToUpdate.horaInicio || jornada.horaInicio;
            const pausa = dataToUpdate.horaPausaAlmuerzo || jornada.horaPausaAlmuerzo;
            const reinicio = dataToUpdate.horaReinicioAlmuerzo || jornada.horaReinicioAlmuerzo;
            const fin = dataToUpdate.horaFin;
            if (pausa && reinicio) {
              dataToUpdate.totalMinutos = Math.floor((pausa.getTime() - inicio.getTime()) / 60000) + Math.floor((fin.getTime() - reinicio.getTime()) / 60000);
            } else {
              dataToUpdate.totalMinutos = Math.floor((fin.getTime() - inicio.getTime()) / 60000);
            }
          }
        }
        const jornadaActualizada = await prisma.jornadas.update({
          where: { id }, data: dataToUpdate,
          include: { usuario: { select: { id: true, name: true, email: true, position: true } } }
        });
        return res.status(200).json(jornadaActualizada);
      }
      if (req.method === 'DELETE') {
        const { id } = req.body;
        if (!id) return res.status(400).json({ error: 'ID es obligatorio' });
        await prisma.jornadas.delete({ where: { id } });
        return res.status(200).json({ message: 'Jornada eliminada' });
      }
    }

    // ============ TIME ENTRIES ============
    if (entity === 'time-entries') {
      if (req.method === 'GET') {
        const { tareaId, userId, mes, año, fechaInicio, fechaFin } = req.query;
        const where: any = {};
        if (tareaId) where.tareaId = tareaId;
        if (userId) where.userId = userId;
        if (fechaInicio && fechaFin) {
          where.startTime = { gte: new Date(fechaInicio), lte: new Date(fechaFin) };
        } else if (mes && año) {
          const mesNum = parseInt(mes);
          const añoNum = parseInt(año);
          const inicioMes = new Date(añoNum, mesNum - 1, 1);
          const finMes = new Date(añoNum, mesNum, 0, 23, 59, 59);
          where.startTime = { gte: inicioMes, lte: finMes };
        }
        const entries = await prisma.timeEntry.findMany({
          where,
          include: {
            usuario: { select: { id: true, name: true } },
            tarea: { include: { proyecto: { include: { cliente: true } } } }
          },
          orderBy: { startTime: 'desc' }
        });
        return res.status(200).json(entries);
      }
      if (req.method === 'POST') {
        const { userId, tareaId, description } = req.body;
        if (!userId) return res.status(400).json({ error: 'userId es obligatorio' });
        const newEntry = await prisma.timeEntry.create({
          data: { userId, tareaId: tareaId || null, startTime: new Date(), description: description || null },
          include: {
            usuario: { select: { id: true, name: true } },
            tarea: { include: { proyecto: { include: { cliente: true } } } }
          }
        });
        return res.status(201).json(newEntry);
      }
      if (req.method === 'PUT') {
        const { id, endTime, description } = req.body;
        if (!id) return res.status(400).json({ error: 'ID es obligatorio' });
        const updatedEntry = await prisma.timeEntry.update({
          where: { id },
          data: { endTime: endTime ? new Date(endTime) : new Date(), description },
          include: {
            usuario: { select: { id: true, name: true } },
            tarea: { include: { proyecto: { include: { cliente: true } } } }
          }
        });
        return res.status(200).json(updatedEntry);
      }
      if (req.method === 'DELETE') {
        const { id } = req.body;
        if (!id) return res.status(400).json({ error: 'ID es obligatorio' });
        await prisma.timeEntry.delete({ where: { id } });
        return res.status(200).json({ message: 'Time entry eliminado' });
      }
    }

    return res.status(400).json({ error: 'Entity no válida. Usa: jornadas, time-entries' });
  } catch (error: any) {
    console.error('Error en API control-horario:', error);
    return res.status(500).json({ error: 'Error en la API', details: error.message });
  } finally {
    await prisma.$disconnect();
  }
}
