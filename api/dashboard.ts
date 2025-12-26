import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export default async function handler(req: any, res: any) {
  try {
    if (req.method === 'GET') {
      const { userId, userRole } = req.query;
      
      const isAdmin = userRole === 'ADMIN' || userRole === 'SUPERADMIN';
      
      // Obtener fecha actual y inicio del mes
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfWeek = new Date(today);
      endOfWeek.setDate(today.getDate() + 7);

      // Consultas en paralelo
      const [
        totalClientes,
        clientesActivos,
        proyectosData,
        tareasData,
        ticketsDelMes,
        eventosProximos,
        tareasRecientes
      ] = await Promise.all([
        // Clientes (todos ven todos los clientes)
        prisma.cliente.count(),
        prisma.cliente.count({ where: { status: 'ACTIVE' } }),
        
        // Proyectos - para no admins, buscar proyectos donde tienen tareas asignadas
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
        
        // Tareas asignadas al usuario (o todas si es admin)
        isAdmin
          ? prisma.tarea.findMany({ where: { status: { not: 'CLOSED' } } })
          : prisma.tarea.findMany({ 
              where: { 
                assigneeId: userId,
                status: { not: 'CLOSED' }
              }
            }),
        
        // Tickets del mes para el usuario (recibidos, no enviados)
        isAdmin
          ? prisma.ticket.count({
              where: {
                createdAt: { gte: startOfMonth },
                status: { in: ['OPEN', 'IN_PROGRESS'] }
              }
            })
          : prisma.ticket.count({
              where: {
                createdAt: { gte: startOfMonth },
                status: { in: ['OPEN', 'IN_PROGRESS'] },
                OR: [
                  { recipientId: userId },
                  { recipientId: null } // Para todo el equipo
                ],
                NOT: { senderId: userId } // Excluir los que envió el propio usuario
              }
            }),
        
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
        
        // Tareas prioritarias
        isAdmin
          ? prisma.tarea.findMany({
              where: {
                status: { not: 'CLOSED' },
                priority: { in: ['URGENT', 'HIGH'] }
              },
              include: { proyecto: true, assignee: true },
              orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
              take: 5
            })
          : prisma.tarea.findMany({
              where: {
                assigneeId: userId,
                status: { not: 'CLOSED' },
                priority: { in: ['URGENT', 'HIGH'] }
              },
              include: { proyecto: true, assignee: true },
              orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
              take: 5
            })
      ]);

      // Contar tareas urgentes
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