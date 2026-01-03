import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export default async function handler(req: any, res: any) {
  try {
    if (req.method === 'GET') {
      const { userId, userRole, tipo } = req.query;
      const isAdmin = userRole === 'ADMIN' || userRole === 'SUPERADMIN';

      // ============ CARGA DE TRABAJO ============
      if (tipo === 'carga-trabajo') {
        const usuarios = await prisma.usuario.findMany({
          where: { activo: true },
          select: { id: true, name: true, position: true, tipoContrato: true }
        });

        const tareas = await prisma.tarea.findMany({
          where: { status: { notIn: ['CLOSED', 'CANCELLED'] } },
          include: {
            proyecto: { select: { title: true, cliente: { select: { name: true } } } },
            timeEntries: { select: { startTime: true, endTime: true } }
          }
        });

        const cargaPorUsuario = usuarios.map(user => {
          const tareasUsuario = tareas.filter(t => t.assigneeId === user.id);
          const tareasPendientes = tareasUsuario.filter(t => t.status === 'PENDING').length;
          const tareasEnProgreso = tareasUsuario.filter(t => t.status === 'IN_PROGRESS').length;
          const tareasUrgentes = tareasUsuario.filter(t => t.priority === 'URGENT' || t.priority === 'HIGH').length;
          
          const horasEstimadas = tareasUsuario.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
          const horasReales = tareasUsuario.reduce((sum, t) => {
            return sum + t.timeEntries.reduce((s, te) => {
              if (te.endTime) {
                return s + (new Date(te.endTime).getTime() - new Date(te.startTime).getTime()) / 3600000;
              }
              return s;
            }, 0);
          }, 0);

          // Calcular nivel de carga (0-100)
          const horasSemanales = user.tipoContrato === 'MEDIA' ? 20 : 37.5;
          const cargaPorcentaje = Math.min(100, Math.round((horasEstimadas / horasSemanales) * 100));

          return {
            id: user.id,
            nombre: user.name,
            position: user.position,
            tipoContrato: user.tipoContrato,
            tareas: {
              total: tareasUsuario.length,
              pendientes: tareasPendientes,
              enProgreso: tareasEnProgreso,
              urgentes: tareasUrgentes
            },
            horas: {
              estimadas: Math.round(horasEstimadas * 10) / 10,
              reales: Math.round(horasReales * 10) / 10,
              semanales: horasSemanales
            },
            cargaPorcentaje,
            tareasDetalle: tareasUsuario.map(t => ({
              id: t.id,
              title: t.title,
              status: t.status,
              priority: t.priority,
              proyecto: t.proyecto.title,
              cliente: t.proyecto.cliente?.name,
              estimatedHours: t.estimatedHours,
              dueDate: t.dueDate
            }))
          };
        });

        // Tareas sin asignar
        const tareasSinAsignar = tareas.filter(t => !t.assigneeId).map(t => ({
          id: t.id,
          title: t.title,
          status: t.status,
          priority: t.priority,
          proyecto: t.proyecto.title,
          cliente: t.proyecto.cliente?.name,
          estimatedHours: t.estimatedHours,
          dueDate: t.dueDate
        }));

        return res.status(200).json({
          usuarios: cargaPorUsuario.sort((a, b) => b.cargaPorcentaje - a.cargaPorcentaje),
          tareasSinAsignar,
          resumen: {
            totalTareas: tareas.length,
            tareasSinAsignar: tareasSinAsignar.length,
            tareasUrgentes: tareas.filter(t => t.priority === 'URGENT' || t.priority === 'HIGH').length
          }
        });
      }

      // ============ RENTABILIDAD ============
      if (tipo === 'rentabilidad') {
        const proyectos = await prisma.proyecto.findMany({
          where: { isArchived: false },
          include: {
            cliente: { select: { name: true } },
            responsable: { select: { name: true } },
            tareas: {
              include: {
                timeEntries: { select: { startTime: true, endTime: true } },
                assignee: { select: { name: true } }
              }
            }
          }
        });

        const rentabilidadProyectos = proyectos.map(p => {
          const horasEstimadas = p.tareas.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
          const horasReales = p.tareas.reduce((sum, t) => {
            return sum + t.timeEntries.reduce((s, te) => {
              if (te.endTime) {
                return s + (new Date(te.endTime).getTime() - new Date(te.startTime).getTime()) / 3600000;
              }
              return s;
            }, 0);
          }, 0);

          const tareasTotal = p.tareas.length;
          const tareasCompletadas = p.tareas.filter(t => t.status === 'CLOSED').length;
          const progreso = tareasTotal > 0 ? Math.round((tareasCompletadas / tareasTotal) * 100) : 0;

          // Coste estimado (horas * tarifa media de 40€/hora)
          const tarifaHora = 40;
          const costeEstimado = horasEstimadas * tarifaHora;
          const costeReal = horasReales * tarifaHora;
          const presupuesto = p.budget || 0;
          
          // Rentabilidad = (Presupuesto - Coste Real) / Presupuesto * 100
          const rentabilidad = presupuesto > 0 
            ? Math.round(((presupuesto - costeReal) / presupuesto) * 100) 
            : 0;

          // Desviación de horas
          const desviacionHoras = horasEstimadas > 0 
            ? Math.round(((horasReales - horasEstimadas) / horasEstimadas) * 100) 
            : 0;

          return {
            id: p.id,
            titulo: p.title,
            cliente: p.cliente.name,
            responsable: p.responsable?.name || 'Sin asignar',
            status: p.status,
            presupuesto,
            horas: {
              estimadas: Math.round(horasEstimadas * 10) / 10,
              reales: Math.round(horasReales * 10) / 10,
              desviacion: desviacionHoras
            },
            costes: {
              estimado: Math.round(costeEstimado),
              real: Math.round(costeReal)
            },
            rentabilidad,
            progreso,
            tareas: {
              total: tareasTotal,
              completadas: tareasCompletadas
            },
            deadline: p.deadline
          };
        });

        // Resumen general
        const totalPresupuesto = rentabilidadProyectos.reduce((sum, p) => sum + p.presupuesto, 0);
        const totalCosteReal = rentabilidadProyectos.reduce((sum, p) => sum + p.costes.real, 0);
        const totalHorasEstimadas = rentabilidadProyectos.reduce((sum, p) => sum + p.horas.estimadas, 0);
        const totalHorasReales = rentabilidadProyectos.reduce((sum, p) => sum + p.horas.reales, 0);

        return res.status(200).json({
          proyectos: rentabilidadProyectos.sort((a, b) => a.rentabilidad - b.rentabilidad),
          resumen: {
            totalProyectos: proyectos.length,
            totalPresupuesto,
            totalCosteReal,
            margenTotal: totalPresupuesto - totalCosteReal,
            rentabilidadMedia: totalPresupuesto > 0 ? Math.round(((totalPresupuesto - totalCosteReal) / totalPresupuesto) * 100) : 0,
            horasEstimadas: Math.round(totalHorasEstimadas),
            horasReales: Math.round(totalHorasReales),
            desviacionHoras: totalHorasEstimadas > 0 ? Math.round(((totalHorasReales - totalHorasEstimadas) / totalHorasEstimadas) * 100) : 0
          }
        });
      }

      // ============ DASHBOARD GENERAL (existente) ============
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