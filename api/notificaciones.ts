import { PrismaClient } from '@prisma/client';
import { enviarEmailRegistroFaltante } from '../lib/email';

const prisma = new PrismaClient();

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { resource } = req.query;

  if (resource === 'registros-faltantes') {
    return handleRegistrosFaltantes(res);
  }

  return res.status(404).json({ error: 'Recurso no encontrado' });
}

async function handleRegistrosFaltantes(res: any) {
  try {
    const hoy = new Date();
    // Solo ejecutar en días laborables (lunes-viernes)
    const diaSemana = hoy.getDay();
    if (diaSemana === 0 || diaSemana === 6) {
      return res.status(200).json({ message: 'Fin de semana, sin notificaciones' });
    }

    const ayer = new Date(hoy);
    ayer.setDate(ayer.getDate() - 1);
    // Si hoy es lunes, revisar el viernes anterior
    if (diaSemana === 1) ayer.setDate(ayer.getDate() - 2);
    ayer.setHours(0, 0, 0, 0);

    // Obtener todos los usuarios activos con email
    const usuarios = await prisma.usuario.findMany({
      where: {
        email: { not: null },
        role: { not: 'SUPERADMIN' },
      },
      select: { id: true, name: true, email: true }
    });

    // Obtener jornadas registradas para ayer
    const jornadasAyer = await prisma.jornadas.findMany({
      where: { fecha: ayer },
      select: { usuarioId: true }
    });

    const conRegistro = new Set(jornadasAyer.map(j => j.usuarioId));
    const sinRegistro = usuarios.filter(u => !conRegistro.has(u.id) && u.email);

    const fechaFormateada = ayer.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

    const resultados = await Promise.allSettled(
      sinRegistro.map(u =>
        enviarEmailRegistroFaltante({
          email: u.email!,
          nombre: u.name,
          fecha: fechaFormateada,
        })
      )
    );

    const enviados = resultados.filter(r => r.status === 'fulfilled').length;
    const fallidos = resultados.filter(r => r.status === 'rejected').length;

    return res.status(200).json({
      message: `Notificaciones enviadas: ${enviados}, fallidas: ${fallidos}`,
      sinRegistro: sinRegistro.map(u => u.name),
    });

  } catch (error: any) {
    console.error('Error en cron registros faltantes:', error);
    return res.status(500).json({ error: 'Error en la notificación', details: error.message });
  } finally {
    await prisma.$disconnect();
  }
}
