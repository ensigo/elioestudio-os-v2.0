import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export default async function handler(req: any, res: any) {
  try {
    if (req.method === 'GET') {
      const { userId, userRole } = req.query;
      
      const isAdmin = userRole === 'ADMIN' || userRole === 'SUPERADMIN';
      
      // Obtener fecha actual
      const today = new Date();
      const endOfWeek = new Date(today);
      endOfWeek.setDate(today.getDate() + 7);

      // Filtros base según rol
      const proyectoFilter = isAdmin ? {} : { responsibleId: userId };
      const tareaFilter = isAdmin ? {} : { assigneeId: userId };
      
      // Filtro de tickets: no leídos por el usuario
      const ticketFilter = isAdmin 
        ? { status: { in: ['OPEN', 'IN_PROGRESS'] } }
        : {
            status: { in: ['OPEN', 'IN_PROGRESS'] },
            OR: [
              { recipientId: userId },
              { recipientId: null } // Para todo el equipo
            ],
            NOT: {
              readBy: { has: userId }
            }
          };

      // Consultas en paralelo
      const [
        totalClientes,
        clientesActivos,
        totalProyectos,
        proyectosActivos,
        totalTareas,
        tareasPendientes,
        tareasUrgentes,
        ticketsNoLeidos,
        eventosProximos,
        tareasRecientes
      ] = await Promise.all([
        // Clientes (todos ven todos los clientes)
        prisma.cliente.count(),
        prisma.cliente.count({ where: { status: 'ACTIVE' } }),
        
        // Proyectos (filtrado por responsable si no es admin)
        prisma.proyecto.count({ where: proyectoFilter }),
        prisma.proyecto.count({ where: { ...proyectoFilter, status: 'ACTIVE' } }),
        
        // Tareas (filtrado por asignado si no es admin)
        prisma.tarea.count({ where: tareaFilter }),
        prisma.tarea.count({ where: { ...tareaFilter, status: { not: 'CLOSED' } } }),
        prisma.tarea.count({ where: { ...tareaFilter, priority: 'URGENT', status: { not: 'CLOSED' } } }),
        
        // Tickets no leídos
        prisma.ticket.count({ where: ticketFilter }),
        
        // Eventos próximos (próximos 7 días)
        prisma.evento.findMany({
          where: {
            startDate: {
              gte: today,
              lte: endOfWeek
            }
          },
          orderBy: { startDate: 'asc' },
          take: 5
        }),
        
        // Tareas prioritarias (filtradas por usuario si no es admin)
        prisma.tarea.findMany({
          where: {
            ...tareaFilter,
            status: { not: 'CLOSED' },
            priority: { in: ['URGENT', 'HIGH'] }
          },
          include: {
            proyecto: true,
            assignee: true
          },
          orderBy: [
            { priority: 'desc' },
            { dueDate: 'asc' }
          ],
          take: 5
        })
      ]);

      return res.status(200).json({
        stats: {
          clientes: { total: totalClientes, activos: clientesActivos },
          proyectos: { total: totalProyectos, activos: proyectosActivos },
          tareas: { total: totalTareas, pendientes: tareasPendientes, urgentes: tareasUrgentes },
          tickets: { abiertos: ticketsNoLeidos }
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