import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export default async function handler(req: any, res: any) {
  try {
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
        include: { usuario: { select: { id: true, name: true, email: true, position: true } } },
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

    return res.status(405).json({ error: 'Método no permitido' });
  } catch (error: any) {
    console.error('Error en API jornadas:', error);
    return res.status(500).json({ error: 'Error en la API', details: error.message });
  } finally {
    await prisma.$disconnect();
  }
}