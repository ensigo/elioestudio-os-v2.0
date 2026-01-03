import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export default async function handler(req: any, res: any) {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Método no permitido' });
    }

    const hoy = new Date();
    const en30Dias = new Date();
    en30Dias.setDate(en30Dias.getDate() + 30);

    // Obtener todos los hostings activos
    const hostings = await prisma.hosting.findMany({
      where: { estado: 'ACTIVO' },
      select: {
        importeCoste: true,
        importeVenta: true,
        periodicidad: true,
        fechaVencimiento: true
      }
    });

    // Obtener todos los dominios activos
    const dominios = await prisma.dominio.findMany({
      where: { estado: 'ACTIVO' },
      select: {
        importeCoste: true,
        importeVenta: true,
        periodicidad: true,
        fechaVencimiento: true,
        tieneSSL: true,
        fechaVencimientoSSL: true
      }
    });

    // Función para anualizar importes
    const anualizar = (importe: number, periodicidad: string) => {
      switch (periodicidad) {
        case 'MENSUAL': return importe * 12;
        case 'TRIMESTRAL': return importe * 4;
        case 'SEMESTRAL': return importe * 2;
        case 'ANUAL': return importe;
        default: return importe;
      }
    };

    // Calcular totales anualizados
    let totalCosteHostings = 0;
    let totalVentaHostings = 0;
    let hostingsProximosVencer = 0;

    hostings.forEach(h => {
      totalCosteHostings += anualizar(h.importeCoste, h.periodicidad);
      totalVentaHostings += anualizar(h.importeVenta, h.periodicidad);
      if (h.fechaVencimiento >= hoy && h.fechaVencimiento <= en30Dias) {
        hostingsProximosVencer++;
      }
    });

    let totalCosteDominios = 0;
    let totalVentaDominios = 0;
    let dominiosProximosVencer = 0;
    let sslProximosVencer = 0;

    dominios.forEach(d => {
      totalCosteDominios += anualizar(d.importeCoste, d.periodicidad);
      totalVentaDominios += anualizar(d.importeVenta, d.periodicidad);
      if (d.fechaVencimiento >= hoy && d.fechaVencimiento <= en30Dias) {
        dominiosProximosVencer++;
      }
      if (d.tieneSSL && d.fechaVencimientoSSL && d.fechaVencimientoSSL >= hoy && d.fechaVencimientoSSL <= en30Dias) {
        sslProximosVencer++;
      }
    });

    // Alertas próximos vencimientos
    const alertasHostings = await prisma.hosting.findMany({
      where: {
        estado: 'ACTIVO',
        fechaVencimiento: { gte: hoy, lte: en30Dias }
      },
      include: {
        cliente: { select: { name: true } }
      },
      orderBy: { fechaVencimiento: 'asc' }
    });

    const alertasDominios = await prisma.dominio.findMany({
      where: {
        estado: 'ACTIVO',
        fechaVencimiento: { gte: hoy, lte: en30Dias }
      },
      include: {
        cliente: { select: { name: true } }
      },
      orderBy: { fechaVencimiento: 'asc' }
    });

    const alertasSSL = await prisma.dominio.findMany({
      where: {
        tieneSSL: true,
        fechaVencimientoSSL: { gte: hoy, lte: en30Dias }
      },
      include: {
        cliente: { select: { name: true } }
      },
      orderBy: { fechaVencimientoSSL: 'asc' }
    });

    const resumen = {
      // Totales
      totalHostings: hostings.length,
      totalDominios: dominios.length,
      
      // Financiero (anualizado)
      ingresoAnualHostings: totalVentaHostings,
      costeAnualHostings: totalCosteHostings,
      margenHostings: totalVentaHostings - totalCosteHostings,
      
      ingresoAnualDominios: totalVentaDominios,
      costeAnualDominios: totalCosteDominios,
      margenDominios: totalVentaDominios - totalCosteDominios,
      
      ingresoAnualTotal: totalVentaHostings + totalVentaDominios,
      costeAnualTotal: totalCosteHostings + totalCosteDominios,
      margenTotal: (totalVentaHostings + totalVentaDominios) - (totalCosteHostings + totalCosteDominios),
      
      // Alertas
      hostingsProximosVencer,
      dominiosProximosVencer,
      sslProximosVencer,
      totalAlertas: hostingsProximosVencer + dominiosProximosVencer + sslProximosVencer,
      
      // Detalle alertas
      alertas: {
        hostings: alertasHostings,
        dominios: alertasDominios,
        ssl: alertasSSL
      }
    };

    return res.status(200).json(resumen);
  } catch (error: any) {
    console.error('Error en API hosting-dashboard:', error);
    return res.status(500).json({ error: 'Error en la API', details: error.message });
  } finally {
    await prisma.$disconnect();
  }
}
