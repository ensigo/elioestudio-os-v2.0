import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export default async function handler(req: any, res: any) {
  try {
    if (req.method === 'GET') {
      const { id, clienteId, estado, proximosVencer } = req.query;
      
      if (id) {
        const hosting = await prisma.hosting.findUnique({
          where: { id },
          include: {
            cliente: true,
            proveedor: true,
            dominios: true
          }
        });
        return res.status(200).json(hosting);
      }
      
      const where: any = {};
      
      if (clienteId) where.clienteId = clienteId;
      if (estado) where.estado = estado;
      
      if (proximosVencer === 'true') {
        const hoy = new Date();
        const en30Dias = new Date();
        en30Dias.setDate(en30Dias.getDate() + 30);
        
        where.fechaVencimiento = {
          gte: hoy,
          lte: en30Dias
        };
        where.estado = 'ACTIVO';
      }
      
      const hostings = await prisma.hosting.findMany({
        where,
        include: {
          cliente: { select: { id: true, name: true } },
          proveedor: { select: { id: true, nombre: true } },
          dominios: { select: { id: true, nombre: true, extension: true } }
        },
        orderBy: { fechaVencimiento: 'asc' }
      });
      
      return res.status(200).json(hostings);
    }

    if (req.method === 'POST') {
      const data = req.body;
      
      const hosting = await prisma.hosting.create({
        data: {
          clienteId: data.clienteId,
          proveedorId: data.proveedorId,
          nombre: data.nombre,
          tipoHosting: data.tipoHosting,
          especificaciones: data.especificaciones,
          ipServidor: data.ipServidor,
          panelControl: data.panelControl,
          urlPanel: data.urlPanel,
          usuarioPanel: data.usuarioPanel,
          passwordPanel: data.passwordPanel,
          importeCoste: parseFloat(data.importeCoste),
          importeVenta: parseFloat(data.importeVenta),
          periodicidad: data.periodicidad || 'ANUAL',
          fechaContratacion: new Date(data.fechaContratacion),
          fechaVencimiento: new Date(data.fechaVencimiento),
          autoRenovar: data.autoRenovar ?? true,
          notas: data.notas
        },
        include: {
          cliente: true,
          proveedor: true
        }
      });
      
      return res.status(201).json(hosting);
    }

    if (req.method === 'PUT') {
      const { id, ...data } = req.body;
      
      if (data.fechaContratacion) data.fechaContratacion = new Date(data.fechaContratacion);
      if (data.fechaVencimiento) data.fechaVencimiento = new Date(data.fechaVencimiento);
      if (data.fechaUltimaRenovacion) data.fechaUltimaRenovacion = new Date(data.fechaUltimaRenovacion);
      if (data.importeCoste) data.importeCoste = parseFloat(data.importeCoste);
      if (data.importeVenta) data.importeVenta = parseFloat(data.importeVenta);
      
      const hosting = await prisma.hosting.update({
        where: { id },
        data,
        include: {
          cliente: true,
          proveedor: true,
          dominios: true
        }
      });
      
      return res.status(200).json(hosting);
    }

    if (req.method === 'DELETE') {
      const { id } = req.body;
      await prisma.hosting.delete({ where: { id } });
      return res.status(200).json({ message: 'Hosting eliminado' });
    }

    return res.status(405).json({ error: 'Método no permitido' });
  } catch (error: any) {
    console.error('Error en API hostings:', error);
    return res.status(500).json({ error: 'Error en la API', details: error.message });
  } finally {
    await prisma.$disconnect();
  }
}
