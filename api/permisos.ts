import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: any, res: any) {
  try {
    // GET - Obtener permisos
    if (req.method === 'GET') {
      const { solicitanteId, estado, todos } = req.query;

      let where: any = {};

      // Si se pide un usuario específico
      if (solicitanteId) {
        where.solicitanteId = solicitanteId;
      }

      // Filtrar por estado
      if (estado) {
        where.estado = estado;
      }

      const permisos = await prisma.permiso.findMany({
        where,
        include: {
          solicitante: {
            select: { id: true, name: true, email: true, position: true }
          },
          aprobador: {
            select: { id: true, name: true }
          }
        },
        orderBy: { fechaSolicitud: 'desc' }
      });

      return res.status(200).json(permisos);
    }

    // POST - Crear solicitud de permiso
    if (req.method === 'POST') {
      const { tipo, motivo, fechaInicio, fechaFin, solicitanteId } = req.body;

      if (!tipo || !fechaInicio || !fechaFin || !solicitanteId) {
        return res.status(400).json({ error: 'Datos incompletos' });
      }

      const nuevoPermiso = await prisma.permiso.create({
        data: {
          tipo,
          motivo: motivo || null,
          fechaInicio: new Date(fechaInicio),
          fechaFin: new Date(fechaFin),
          solicitanteId,
          estado: 'PENDIENTE'
        },
        include: {
          solicitante: {
            select: { id: true, name: true, email: true }
          }
        }
      });

      return res.status(201).json(nuevoPermiso);
    }

    // PUT - Actualizar permiso (aprobar/rechazar)
    if (req.method === 'PUT') {
      const { id, estado, comentarioAdmin, aprobadorId } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'ID es obligatorio' });
      }

      const dataToUpdate: any = {};

      if (estado) {
        dataToUpdate.estado = estado;
        dataToUpdate.fechaResolucion = new Date();
      }

      if (comentarioAdmin !== undefined) {
        dataToUpdate.comentarioAdmin = comentarioAdmin;
      }

      if (aprobadorId) {
        dataToUpdate.aprobadorId = aprobadorId;
      }

      const permisoActualizado = await prisma.permiso.update({
        where: { id },
        data: dataToUpdate,
        include: {
          solicitante: {
            select: { id: true, name: true, email: true }
          },
          aprobador: {
            select: { id: true, name: true }
          }
        }
      });

      return res.status(200).json(permisoActualizado);
    }

    // DELETE - Eliminar permiso (solo si está pendiente)
    if (req.method === 'DELETE') {
      const { id } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'ID es obligatorio' });
      }

      const permiso = await prisma.permiso.findUnique({ where: { id } });

      if (!permiso) {
        return res.status(404).json({ error: 'Permiso no encontrado' });
      }

      if (permiso.estado !== 'PENDIENTE') {
        return res.status(400).json({ error: 'Solo se pueden eliminar solicitudes pendientes' });
      }

      await prisma.permiso.delete({ where: { id } });

      return res.status(200).json({ message: 'Solicitud eliminada' });
    }

    return res.status(405).json({ error: 'Método no permitido' });

  } catch (error: any) {
    console.error('Error en API permisos:', error);
    return res.status(500).json({ error: 'Error en la API', details: error.message });
  } finally {
    await prisma.$disconnect();
  }
}