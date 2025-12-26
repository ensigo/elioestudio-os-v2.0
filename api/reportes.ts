import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: any, res: any) {
  try {
    if (req.method === 'GET') {
      const { desde, hasta } = req.query;
      
      // Fechas por defecto: último mes
      const fechaHasta = hasta ? new Date(hasta) : new Date();
      const fechaDesde = desde ? new Date(desde) : new Date(fechaHasta.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Obtener todos los usuarios del equipo
      const usuarios = await prisma.usuario.findMany({
        orderBy: { name: 'asc' }
      });

      // Obtener time entries en el rango
      const timeEntries = await prisma.timeEntry.findMany({
        where: {
          startTime: {
            gte: fechaDesde,
            lte: fechaHasta
          }
        },
        include: {
          tarea: {
            include: {
              proyecto: true
            }
          }
        },
        orderBy: { startTime: 'desc' }
      });

      // Obtener tareas por usuario
      const tareas = await prisma.tarea.findMany({
        where: {
          createdAt: {
            gte: fechaDesde,
            lte: fechaHasta
          }
        },
        include: {
          assignee: true,
          proyecto: true
        }
      });

      // Calcular métricas por usuario
      const reportePorUsuario = usuarios.map(usuario => {
        // Time entries del usuario
        const entriesUsuario = timeEntries.filter(te => te.userId === usuario.id);
        
        // Calcular horas totales trabajadas
        let horasTotales = 0;
        entriesUsuario.forEach(entry => {
          if (entry.endTime) {
            const diff = new Date(entry.endTime).getTime() - new Date(entry.startTime).getTime();
            horasTotales += diff / (1000 * 60 * 60);
          }
        });

        // Tareas del usuario
        const tareasUsuario = tareas.filter(t => t.assigneeId === usuario.id);
        const tareasCompletadas = tareasUsuario.filter(t => t.status === 'CLOSED').length;
        const tareasPendientes = tareasUsuario.filter(t => t.status !== 'CLOSED').length;
        const tareasVencidas = tareasUsuario.filter(t => {
          if (!t.dueDate || t.status === 'CLOSED') return false;
          return new Date(t.dueDate) < new Date();
        }).length;

        // Calcular días laborables en el rango
        const diasLaborables = calcularDiasLaborables(fechaDesde, fechaHasta);
        const horasEsperadas = diasLaborables * 8;
        const porcentajeCumplimiento = horasEsperadas > 0 ? Math.round((horasTotales / horasEsperadas) * 100) : 0;

        return {
          usuario: {
            id: usuario.id,
            name: usuario.name,
            role: usuario.role,
            position: usuario.position
          },
          metricas: {
            horasTrabajadas: Math.round(horasTotales * 100) / 100,
            horasEsperadas,
            porcentajeCumplimiento,
            tareasAsignadas: tareasUsuario.length,
            tareasCompletadas,
            tareasPendientes,
            tareasVencidas,
            tasaCompletado: tareasUsuario.length > 0 
              ? Math.round((tareasCompletadas / tareasUsuario.length) * 100) 
              : 0
          },
          alertas: {
            bajaCarga: horasTotales < (horasEsperadas * 0.5),
            tareasRetrasadas: tareasVencidas > 0,
            sinActividad: entriesUsuario.length === 0
          },
          ultimaActividad: entriesUsuario[0]?.startTime || null
        };
      });

      // Resumen general
      const resumenGeneral = {
        totalHorasTrabajadas: reportePorUsuario.reduce((acc, r) => acc + r.metricas.horasTrabajadas, 0),
        totalTareasCompletadas: reportePorUsuario.reduce((acc, r) => acc + r.metricas.tareasCompletadas, 0),
        totalTareasPendientes: reportePorUsuario.reduce((acc, r) => acc + r.metricas.tareasPendientes, 0),
        totalTareasVencidas: reportePorUsuario.reduce((acc, r) => acc + r.metricas.tareasVencidas, 0),
        usuariosConAlertas: reportePorUsuario.filter(r => 
          r.alertas.bajaCarga || r.alertas.tareasRetrasadas || r.alertas.sinActividad
        ).length,
        promedioRendimiento: Math.round(
          reportePorUsuario.reduce((acc, r) => acc + r.metricas.porcentajeCumplimiento, 0) / usuarios.length
        )
      };

      // Timeline de actividad reciente
      const actividadReciente = timeEntries.slice(0, 20).map(entry => ({
        id: entry.id,
        userId: entry.userId,
        tarea: entry.tarea?.title || 'Sin tarea',
        proyecto: entry.tarea?.proyecto?.title || 'Sin proyecto',
        inicio: entry.startTime,
        fin: entry.endTime,
        duracion: entry.endTime 
          ? Math.round((new Date(entry.endTime).getTime() - new Date(entry.startTime).getTime()) / (1000 * 60)) 
          : null
      }));

      return res.status(200).json({
        periodo: {
          desde: fechaDesde,
          hasta: fechaHasta
        },
        resumenGeneral,
        reportePorUsuario,
        actividadReciente
      });
    }

    return res.status(405).json({ error: 'Método no permitido' });

  } catch (error: any) {
    console.error('Error en API reportes:', error);
    return res.status(500).json({ error: 'Error en la API', details: error.message });
  } finally {
    await prisma.$disconnect();
  }
}

// Función auxiliar para calcular días laborables
function calcularDiasLaborables(desde: Date, hasta: Date): number {
  let count = 0;
  const current = new Date(desde);
  
  while (current <= hasta) {
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  
  return count;
}