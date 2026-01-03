import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: any, res: any) {
  try {
    // GET - Obtener todos los proyectos con relaciones
    if (req.method === 'GET') {
      const proyectos = await prisma.proyecto.findMany({
        include: {
          cliente: true,
          responsable: true
        },
        orderBy: { createdAt: 'desc' }
      });
      return res.status(200).json(proyectos);
    }

    // POST - Crear un nuevo proyecto
    if (req.method === 'POST') {
      const { title, clienteId, responsibleId: responsibleId || null, status, budget, deadline } = req.body;

      if (!title || !clienteId) {
        return res.status(400).json({ error: 'Título y cliente son obligatorios' });
      }

      const nuevoProyecto = await prisma.proyecto.create({
        data: {
          title,
          clienteId,
          responsibleId: responsibleId || null,
          status: status || 'ACTIVE',
          budget: budget && budget !== "" ? parseFloat(budget) : null,
          deadline: deadline ? new Date(deadline) : null
        },
        include: {
          cliente: true,
          responsable: true
        }
      });

      return res.status(201).json(nuevoProyecto);
    }

    // PUT - Actualizar proyecto
    if (req.method === 'PUT') {
      const { id, title, clienteId, responsibleId: responsibleId || null, status, budget, deadline, isArchived } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'ID es obligatorio' });
      }

      const proyectoActualizado = await prisma.proyecto.update({
        where: { id },
        data: {
          title,
          clienteId,
          responsibleId: responsibleId || null,
          status,
          budget: budget && budget !== "" ? parseFloat(budget) : null,
          deadline: deadline ? new Date(deadline) : null,
          isArchived
        },
        include: {
          cliente: true,
          responsable: true
        }
      });

      return res.status(200).json(proyectoActualizado);
    }

    // DELETE - Eliminar proyecto
    if (req.method === 'DELETE') {
      const { id } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'ID es obligatorio' });
      }

      await prisma.proyecto.delete({
        where: { id }
      });

      return res.status(200).json({ message: 'Proyecto eliminado' });
    }

    return res.status(405).json({ error: 'Método no permitido' });

  } catch (error: any) {
    console.error('Error en API proyectos:', error);
    return res.status(500).json({ error: 'Error en la API', details: error.message });
  } finally {
    await prisma.$disconnect();
  }
}