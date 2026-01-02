import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export default async function handler(req: any, res: any) {
  try {
    // GET - Obtener time entries (con filtros)
    if (req.method === 'GET') {
      const { tareaId, userId, mes, año, fechaInicio, fechaFin } = req.query;
      
      const where: any = {};
      
      if (tareaId) {
        where.tareaId = tareaId;
      }
      
      if (userId) {
        where.userId = userId;
      }
      
      // Filtrar por rango de fechas (semana)
      if (fechaInicio && fechaFin) {
        where.startTime = {
          gte: new Date(fechaInicio),
          lte: new Date(fechaFin)
        };
      }
      // Filtrar por mes y año
      else if (mes && año) {
        const mesNum = parseInt(mes);
        const añoNum = parseInt(año);
        const inicioMes = new Date(añoNum, mesNum - 1, 1);
        const finMes = new Date(añoNum, mesNum, 0, 23, 59, 59);
        
        where.startTime = {
          gte: inicioMes,
          lte: finMes
        };
      }
      
      const entries = await prisma.timeEntry.findMany({
        where,
        include: {
          tarea: {
            include: {
              proyecto: {
                include: {
                  cliente: true
                }
              }
            }
          }
        },
        orderBy: { startTime: 'desc' }
      });
      
      return res.status(200).json(entries);
    }

    // POST - Iniciar un nuevo timer
    if (req.method === 'POST') {
      const { userId, tareaId, description } = req.body;

      if (!userId) {
        return res.status(400).json({ error: 'userId es obligatorio' });
      }

      const newEntry = await prisma.timeEntry.create({
        data: {
          userId,
          tareaId: tareaId || null,
          startTime: new Date(),
          description: description || null
        },
        include: {
          tarea: {
            include: {
              proyecto: {
                include: {
                  cliente: true
                }
              }
            }
          }
        }
      });

      return res.status(201).json(newEntry);
    }

    // PUT - Detener timer (actualizar endTime)
    if (req.method === 'PUT') {
      const { id, endTime, description } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'ID es obligatorio' });
      }

      const updatedEntry = await prisma.timeEntry.update({
        where: { id },
        data: {
          endTime: endTime ? new Date(endTime) : new Date(),
          description
        },
        include: {
          tarea: {
            include: {
              proyecto: {
                include: {
                  cliente: true
                }
              }
            }
          }
        }
      });

      return res.status(200).json(updatedEntry);
    }

    // DELETE - Eliminar time entry
    if (req.method === 'DELETE') {
      const { id } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'ID es obligatorio' });
      }

      await prisma.timeEntry.delete({
        where: { id }
      });

      return res.status(200).json({ message: 'Time entry eliminado' });
    }

    return res.status(405).json({ error: 'Método no permitido' });

  } catch (error: any) {
    console.error('Error en API time-entries:', error);
    return res.status(500).json({ error: 'Error en la API', details: error.message });
  } finally {
    await prisma.$disconnect();
  }
}