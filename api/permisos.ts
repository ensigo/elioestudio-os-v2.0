import type { VercelRequest, VercelResponse } from '@vercel/node';
import { randomUUID } from 'crypto';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../lib/api-middleware';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userId = requireAuth(req, res);
  if (!userId) return;

  try {
    if (req.method === 'GET') {
      const { solicitanteId, estado } = req.query;
      const where: Record<string, unknown> = {};
      if (solicitanteId) where.solicitanteId = solicitanteId;
      if (estado) where.estado = estado;
      const permisos = await prisma.permisos.findMany({
        where,
        include: { solicitante: { select: { id: true, name: true, email: true, position: true } }, aprobador: { select: { id: true, name: true } } },
        orderBy: { fechaSolicitud: 'desc' },
      });
      return res.status(200).json(permisos);
    }

    if (req.method === 'POST') {
      const { tipo, motivo, fechaInicio, fechaFin, solicitanteId } = req.body;
      if (!tipo || !fechaInicio || !fechaFin || !solicitanteId) return res.status(400).json({ error: 'Datos incompletos' });
      const nuevoPermiso = await prisma.permisos.create({
        data: { id: randomUUID(), tipo, motivo: motivo || null, fechaInicio: new Date(fechaInicio), fechaFin: new Date(fechaFin), solicitanteId, estado: 'PENDIENTE', updatedAt: new Date() },
        include: { solicitante: { select: { id: true, name: true, email: true } } },
      });
      return res.status(201).json(nuevoPermiso);
    }

    if (req.method === 'PUT') {
      const { id, estado, comentarioAdmin, aprobadorId } = req.body;
      if (!id) return res.status(400).json({ error: 'ID es obligatorio' });
      const dataToUpdate: Record<string, unknown> = { updatedAt: new Date() };
      if (estado) { dataToUpdate.estado = estado; dataToUpdate.fechaResolucion = new Date(); }
      if (comentarioAdmin !== undefined) dataToUpdate.comentarioAdmin = comentarioAdmin;
      if (aprobadorId) dataToUpdate.aprobadorId = aprobadorId;
      const permisoActualizado = await prisma.permisos.update({
        where: { id }, data: dataToUpdate,
        include: { solicitante: { select: { id: true, name: true, email: true } }, aprobador: { select: { id: true, name: true } } },
      });
      return res.status(200).json(permisoActualizado);
    }

    if (req.method === 'DELETE') {
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: 'ID es obligatorio' });
      const permiso = await prisma.permisos.findUnique({ where: { id } });
      if (!permiso) return res.status(404).json({ error: 'Permiso no encontrado' });
      if (permiso.estado !== 'PENDIENTE') return res.status(400).json({ error: 'Solo se pueden eliminar solicitudes pendientes' });
      await prisma.permisos.delete({ where: { id } });
      return res.status(200).json({ message: 'Solicitud eliminada' });
    }

    return res.status(405).json({ error: 'Método no permitido' });
  } catch (error) {
    console.error('Error en API permisos:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}
