import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export default async function handler(req: any, res: any) {
  try {
    if (req.method === 'GET') {
      const { userId, userRole } = req.query;
      const isAdmin = userRole === 'ADMIN' || userRole === 'SUPERADMIN';

      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfWeek = new Date(today);
      endOfWeek.setDate(today.getDate() + 7);

      const [
        totalClientes,
        clientesActivos,
        proyectosData,
        tareasData,
        ticketsDelMes,
        eventosProximos,
        tareasRecientes
      ] = await Promise.all([
        prisma.cliente.count(),
        prisma.cliente.count({ where: { status: 'ACTIVE' } }),

        isAdmin
          ? prisma.proyecto.findMany({ where: { status: 'ACTIVE' } })
          : prisma.proyecto.findMany({
              where: {
                OR: [
                  { responsibleId: userId },
                  { tareas: { some: { assigneeId: userId } } }
                ],
                status: 'ACTIVE'
              }
            }),

        isAdmin
          ? prisma.tarea.findMany({ where: { status: { not: 'CLOSED' } } })
          : prisma.tarea.findMany({ where: { assigneeId: userId, status: { not: 'CLOSED' } } }),

        isAdmin
          ? prisma.ticket.count({
              where: { createdAt: { gte: startOfMonth }, status: { in: ['OPEN', 'IN_PROGRESS'] } }
            })
          : prisma.ticket.count({
              where: {
                createdAt: { gte: startOfMonth },
                status: { in: ['OPEN', 'IN_PROGRESS'] },
                OR: [{ recipientId: userId }, { recipientId: null }],
                NOT: { senderId: userId }
              }
            }),

        prisma.eventos.findMany({
          where: { startDate: { gte: today, lte: endOfWeek } },
          orderBy: { startDate: 'asc' },
          take: 5
        }),

        isAdmin
          ? prisma.tarea.findMany({
              where: { status: { not: 'CLOSED' }, priority: { in: ['URGENT', 'HIGH'] } },
              include: { proyecto: true, assignee: true },
              orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
              take: 5
            })
          : prisma.tarea.findMany({
              where: { assigneeId: userId, status: { not: 'CLOSED' }, priority: { in: ['URGENT', 'HIGH'] } },
              include: { proyecto: true, assignee: true },
              orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
              take: 5
            })
      ]);

      const tareasUrgentes = tareasData.filter(t => t.priority === 'URGENT').length;

      return res.status(200).json({
        stats: {
          clientes: { total: totalClientes, activos: clientesActivos },
          proyectos: { total: proyectosData.length, activos: proyectosData.length },
          tareas: { total: tareasData.length, pendientes: tareasData.length, urgentes: tareasUrgentes },
          tickets: { abiertos: ticketsDelMes }
        },
        eventosProximos,
        tareasRecientes
      });
    }

    return res.status(405).json({ error: 'Método no permitido' });
  } catch (error: any) {
    console.error('Error en API dashboard:', error);
    return res.status(500).json({ error: 'Error en la API', details: error.message });
  } finally {
    await prisma.$disconnect();
  }
}