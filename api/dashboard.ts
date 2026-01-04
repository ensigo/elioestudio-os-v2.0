import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export default async function handler(req: any, res: any) {
  try {
    if (req.method === 'GET') {
      const { userId, userRole, tipo } = req.query;
      const isAdmin = userRole === 'ADMIN' || userRole === 'SUPERADMIN';

       // ============ CARGA DE TRABAJO ============
      if (tipo === 'carga-trabajo') {
        const { periodo } = req.query; // 'semana', 'mes', 'todo'
        
        const usuarios = await prisma.usuario.findMany({
          select: { id: true, name: true, position: true, tipoContrato: true }
        });

        // Calcular fechas según período
        const hoy = new Date();
        let fechaLimite: Date | null = null;
        let horasDivisor = 37.5; // Por defecto semanal
        
        if (periodo === 'semana') {
          fechaLimite = new Date(hoy);
          fechaLimite.setDate(hoy.getDate() + 7);
          horasDivisor = 37.5; // Horas semanales jornada completa
        } else if (periodo === 'mes') {
          fechaLimite = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0); // Último día del mes
          horasDivisor = 150; // Aprox horas mensuales (37.5 * 4)
        }
        // Si es 'todo', fechaLimite queda null y no filtramos

        const whereClause: any = { status: { notIn: ['CLOSED', 'CANCELLED'] } };
        if (fechaLimite) {
          whereClause.dueDate = { gte: hoy, lte: fechaLimite };
        }

        const tareas = await prisma.tarea.findMany({
          where: whereClause,
          include: {
            proyecto: { select: { title: true, cliente: { select: { name: true } } } },
            timeEntries: { select: { startTime: true, endTime: true } }
          }
        });

        let totalHorasEstimadas = 0;

        const cargaPorUsuario = usuarios.map(user => {
          const tareasUsuario = tareas.filter(t => t.assigneeId === user.id);
          const tareasPendientes = tareasUsuario.filter(t => t.status === 'PENDING').length;
          const tareasEnProgreso = tareasUsuario.filter(t => t.status === 'IN_PROGRESS').length;
          const tareasUrgentes = tareasUsuario.filter(t => t.priority === 'URGENT' || t.priority === 'HIGH').length;
          
          const horasEstimadas = tareasUsuario.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
          totalHorasEstimadas += horasEstimadas;
          
          const horasReales = tareasUsuario.reduce((sum, t) => {
            return sum + t.timeEntries.reduce((s, te) => {
              if (te.endTime) {
                return s + (new Date(te.endTime).getTime() - new Date(te.startTime).getTime()) / 3600000;
              }
              return s;
            }, 0);
          }, 0);

          // Ajustar horas según tipo de contrato
          const horasDisponibles = user.tipoContrato === 'MEDIA' 
            ? (periodo === 'mes' ? 80 : 20) 
            : (periodo === 'mes' ? 150 : 37.5);
          
          const cargaPorcentaje = horasDisponibles > 0 
            ? Math.round((horasEstimadas / horasDisponibles) * 100) 
            : 0;

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
              disponibles: horasDisponibles
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
            tareasUrgentes: tareas.filter(t => t.priority === 'URGENT' || t.priority === 'HIGH').length,
            horasEstimadas: Math.round(totalHorasEstimadas * 10) / 10
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
      if (!tipo) {
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

    // ============ SEM & SOCIAL ADS ============
      if (tipo === 'sem-campanas') {
        if (req.method === 'GET') {
          const { id, clienteId } = req.query;
          
          if (id) {
            const campana = await prisma.campanaSEM.findUnique({
              where: { id: id as string },
              include: {
                cliente: { select: { id: true, name: true } },
                proyecto: { select: { id: true, title: true } },
                reportesDiarios: { orderBy: { fecha: 'desc' } }
              }
            });
            return res.status(200).json(campana);
          }
          
          const where: any = {};
          if (clienteId) where.clienteId = clienteId;
          
          const campanas = await prisma.campanaSEM.findMany({
            where,
            include: {
              cliente: { select: { id: true, name: true } },
              proyecto: { select: { id: true, title: true } },
              reportesDiarios: { orderBy: { fecha: 'desc' }, take: 1 }
            },
            orderBy: { createdAt: 'desc' }
          });
          
          // Calcular totales gastados
          const campanasConTotales = campanas.map(c => {
            const gastoTotal = c.reportesDiarios.reduce((sum, r) => sum + r.gastoDia, 0);
            const ultimoReporte = c.reportesDiarios[0] || null;
            return { ...c, gastoTotal, ultimoReporte };
          });
          
          return res.status(200).json(campanasConTotales);
        }
        
        if (req.method === 'POST') {
          const data = req.body;
          const campana = await prisma.campanaSEM.create({
            data: {
              clienteId: data.clienteId,
              proyectoId: data.proyectoId || null,
              nombre: data.nombre,
              plataforma: data.plataforma,
              estado: data.estado || 'PLANIFICADA',
              fechaInicio: new Date(data.fechaInicio),
              fechaFin: data.fechaFin ? new Date(data.fechaFin) : null,
              presupuesto: parseFloat(data.presupuesto),
              objetivo: data.objetivo,
              notas: data.notas,
              urlPlataforma: data.urlPlataforma
            },
            include: { cliente: { select: { id: true, name: true } } }
          });
          return res.status(201).json(campana);
        }
        
        if (req.method === 'PUT') {
          const { id, ...data } = req.body;
          if (data.presupuesto) data.presupuesto = parseFloat(data.presupuesto);
          if (data.fechaInicio) data.fechaInicio = new Date(data.fechaInicio);
          if (data.fechaFin) data.fechaFin = new Date(data.fechaFin);
          
          const campana = await prisma.campanaSEM.update({
            where: { id },
            data,
            include: { cliente: { select: { id: true, name: true } } }
          });
          return res.status(200).json(campana);
        }
        
        if (req.method === 'DELETE') {
          const { id } = req.body;
          await prisma.campanaSEM.delete({ where: { id } });
          return res.status(200).json({ message: 'Campaña eliminada' });
        }
      }
      
      // ============ REPORTES SEM (DIARIOS) ============
      if (tipo === 'sem-reportes') {
        if (req.method === 'GET') {
          const { campanaId } = req.query;
          const reportes = await prisma.reporteSEM.findMany({
            where: { campanaId: campanaId as string },
            orderBy: { fecha: 'asc' }
          });
          return res.status(200).json(reportes);
        }
        
        if (req.method === 'POST') {
          const data = req.body;
          const reporte = await prisma.reporteSEM.create({
            data: {
              campanaId: data.campanaId,
              fecha: new Date(data.fecha),
              impresiones: parseInt(data.impresiones) || 0,
              clics: parseInt(data.clics) || 0,
              ctr: parseFloat(data.ctr) || 0,
              conversiones: parseInt(data.conversiones) || 0,
              cpa: parseFloat(data.cpa) || 0,
              gastoDia: parseFloat(data.gastoDia) || 0,
              roas: parseFloat(data.roas) || 0,
              notas: data.notas
            }
          });
          return res.status(201).json(reporte);
        }
        
        if (req.method === 'PUT') {
          const { id, ...data } = req.body;
          if (data.fecha) data.fecha = new Date(data.fecha);
          if (data.impresiones) data.impresiones = parseInt(data.impresiones);
          if (data.clics) data.clics = parseInt(data.clics);
          if (data.ctr) data.ctr = parseFloat(data.ctr);
          if (data.conversiones) data.conversiones = parseInt(data.conversiones);
          if (data.cpa) data.cpa = parseFloat(data.cpa);
          if (data.gastoDia) data.gastoDia = parseFloat(data.gastoDia);
          if (data.roas) data.roas = parseFloat(data.roas);
          
          const reporte = await prisma.reporteSEM.update({ where: { id }, data });
          return res.status(200).json(reporte);
        }
        
        if (req.method === 'DELETE') {
          const { id } = req.body;
          await prisma.reporteSEM.delete({ where: { id } });
          return res.status(200).json({ message: 'Reporte eliminado' });
        }
      }
      
      // ============ EMAIL MARKETING ============
      if (tipo === 'mailing') {
        if (req.method === 'GET') {
          const { id, clienteId } = req.query;
          
          if (id) {
            const campana = await prisma.campanaMailing.findUnique({
              where: { id: id as string },
              include: { cliente: { select: { id: true, name: true } } }
            });
            return res.status(200).json(campana);
          }
          
          const where: any = {};
          if (clienteId) where.clienteId = clienteId;
          
          const campanas = await prisma.campanaMailing.findMany({
            where,
            include: { cliente: { select: { id: true, name: true } } },
            orderBy: { createdAt: 'desc' }
          });
          return res.status(200).json(campanas);
        }
        
        if (req.method === 'POST') {
          const data = req.body;
          const campana = await prisma.campanaMailing.create({
            data: {
              clienteId: data.clienteId,
              nombreInterno: data.nombreInterno,
              asunto: data.asunto,
              plataforma: data.plataforma,
              estado: data.estado || 'BORRADOR',
              fechaEnvio: data.fechaEnvio ? new Date(data.fechaEnvio) : null,
              tamanoAudiencia: parseInt(data.tamanoAudiencia) || 0,
              notas: data.notas
            },
            include: { cliente: { select: { id: true, name: true } } }
          });
          return res.status(201).json(campana);
        }
        
        if (req.method === 'PUT') {
          const { id, ...data } = req.body;
          if (data.fechaEnvio) data.fechaEnvio = new Date(data.fechaEnvio);
          if (data.tamanoAudiencia) data.tamanoAudiencia = parseInt(data.tamanoAudiencia);
          if (data.entregados) data.entregados = parseInt(data.entregados);
          if (data.aperturas) data.aperturas = parseInt(data.aperturas);
          if (data.clics) data.clics = parseInt(data.clics);
          if (data.rebotes) data.rebotes = parseInt(data.rebotes);
          if (data.bajas) data.bajas = parseInt(data.bajas);
          if (data.spam) data.spam = parseInt(data.spam);
          
          const campana = await prisma.campanaMailing.update({
            where: { id },
            data,
            include: { cliente: { select: { id: true, name: true } } }
          });
          return res.status(200).json(campana);
        }
        
        if (req.method === 'DELETE') {
          const { id } = req.body;
          await prisma.campanaMailing.delete({ where: { id } });
          return res.status(200).json({ message: 'Campaña eliminada' });
        }
      }
    // ============ DOCUMENTOS SOPORTE ============
      if (tipo === 'documentos') {
        if (req.method === 'GET') {
          const { familia } = req.query;
          const where: any = { activo: true };
          if (familia) where.familia = familia;
          
          const documentos = await prisma.documentoSoporte.findMany({
            where,
            orderBy: { createdAt: 'desc' }
          });
          return res.status(200).json(documentos);
        }
        
        if (req.method === 'POST') {
          const data = req.body;
          const documento = await prisma.documentoSoporte.create({
            data: {
              nombre: data.nombre,
              descripcion: data.descripcion,
              familia: data.familia,
              subfamilia: data.subfamilia,
              archivoUrl: data.archivoUrl,
              archivoNombre: data.archivoNombre,
              tamano: data.tamano ? parseInt(data.tamano) : null,
              tipo: data.tipo,
              creadoPorId: data.creadoPorId,
              creadoPorNombre: data.creadoPorNombre
            }
          });
          return res.status(201).json(documento);
        }
        
        if (req.method === 'PUT') {
          const { id, ...data } = req.body;
          const documento = await prisma.documentoSoporte.update({
            where: { id },
            data
          });
          return res.status(200).json(documento);
        }
        
        if (req.method === 'DELETE') {
          const { id } = req.body;
          await prisma.documentoSoporte.update({
            where: { id },
            data: { activo: false }
          });
          return res.status(200).json({ message: 'Documento eliminado' });
        }
      }
        
    return res.status(405).json({ error: 'Método no permitido' });
  } catch (error: any) {
    console.error('Error en API dashboard:', error);
    return res.status(500).json({ error: 'Error en la API', details: error.message });
  } finally {
    await prisma.$disconnect();
  }
}