import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: any, res: any) {
  try {
    if (req.method === 'GET') {
      // Obtener fecha actual y rango de la semana
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Lunes
      startOfWeek.setHours(0, 0, 0, 0);
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6); // Domingo
      endOfWeek.setHours(23, 59, 59, 999);

      // Consultas en paralelo
      const [
        totalClientes,
        clientesActivos,
        totalProyectos,
        proyectosActivos,
        totalTareas,
        tareasPendientes,
        tareasUrgentes,
        ticketsAbiertos,
        eventosProximos,
        tareasRecientes
      ] = await Promise.all([
        // Clientes
        prisma.cliente.count(),
        prisma.cliente.count({ where: { status: 'ACTIVE' } }),
        
        // Proyectos
        prisma.proyecto.count(),
        prisma.proyecto.count({ where: { status: 'ACTIVE' } }),
        
        // Tareas
        prisma.tarea.count(),
        prisma.tarea.count({ where: { status: { not: 'CLOSED' } } }),
        prisma.tarea.count({ where: { priority: 'URGENT', status: { not: 'CLOSED' } } }),
        
        // Tickets abiertos
        prisma.ticket.count({ where: { status: 'OPEN' } }),
        
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
        
        // Tareas prioritarias (urgentes + alta prioridad)
        prisma.tarea.findMany({
          where: {
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
          tickets: { abiertos: ticketsAbiertos }
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