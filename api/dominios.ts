import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export default async function handler(req: any, res: any) {
  try {
    // GET - Obtener dominios
    if (req.method === 'GET') {
      const { id, clienteId, hostingId, estado, proximosVencer, sslProximoVencer } = req.query;
      
      if (id) {
        const dominio = await prisma.dominio.findUnique({
          where: { id },
          include: {
            cliente: true,
            proveedor: true,
            hosting: true
          }
        });
        return res.status(200).json(dominio);
      }
      
      const where: any = {};
      
      if (clienteId) where.clienteId = clienteId;
      if (hostingId) where.hostingId = hostingId;
      if (estado) where.estado = estado;
      
      // Filtrar por próximos a vencer (30 días)
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
      
      // Filtrar por SSL próximo a vencer
      if (sslProximoVencer === 'true') {
        const hoy = new Date();
        const en30Dias = new Date();
        en30Dias.setDate(en30Dias.getDate() + 30);
        
        where.tieneSSL = true;
        where.fechaVencimientoSSL = {
          gte: hoy,
          lte: en30Dias
        };
      }
      
      const dominios = await prisma.dominio.findMany({
        where,
        include: {
          cliente: { select: { id: true, name: true } },
          proveedor: { select: { id: true, nombre: true } },
          hosting: { select: { id: true, nombre: true } }
        },
        orderBy: { fechaVencimiento: 'asc' }
      });
      
      return res.status(200).json(dominios);
    }

    // POST - Crear dominio
    if (req.method === 'POST') {
      const data = req.body;
      
      const dominio = await prisma.dominio.create({
        data: {
          clienteId: data.clienteId,
          hostingId: data.hostingId || null,
          proveedorId: data.proveedorId,
          nombre: data.nombre,
          extension: data.extension,
          tieneSSL: data.tieneSSL ?? false,
          tipoSSL: data.tipoSSL,
          fechaVencimientoSSL: data.fechaVencimientoSSL ? new Date(data.fechaVencimientoSSL) : null,
          nameservers: data.nameservers,
          registroDNS: data.registroDNS,
          importeCoste: parseFloat(data.importeCoste),
          importeVenta: parseFloat(data.importeVenta),
          periodicidad: data.periodicidad || 'ANUAL',
          fechaRegistro: new Date(data.fechaRegistro),
          fechaVencimiento: new Date(data.fechaVencimiento),
          autoRenovar: data.autoRenovar ?? true,
          notas: data.notas
        },
        include: {
          cliente: true,
          proveedor: true,
          hosting: true
        }
      });
      
      return res.status(201).json(dominio);
    }

    // PUT - Actualizar dominio
    if (req.method === 'PUT') {
      const { id, ...data } = req.body;
      
      // Parsear fechas y números si vienen
      if (data.fechaRegistro) data.fechaRegistro = new Date(data.fechaRegistro);
      if (data.fechaVencimiento) data.fechaVencimiento = new Date(data.fechaVencimiento);
      if (data.fechaUltimaRenovacion) data.fechaUltimaRenovacion = new Date(data.fechaUltimaRenovacion);
      if (data.fechaVencimientoSSL) data.fechaVencimientoSSL = new Date(data.fechaVencimientoSSL);
      if (data.importeCoste) data.importeCoste = parseFloat(data.importeCoste);
      if (data.importeVenta) data.importeVenta = parseFloat(data.importeVenta);
      
      const dominio = await prisma.dominio.update({
        where: { id },
        data,
        include: {
          cliente: true,
          proveedor: true,
          hosting: true
        }
      });
      
      return res.status(200).json(dominio);
    }

    // DELETE - Eliminar dominio
    if (req.method === 'DELETE') {
      const { id } = req.body;
      
      await prisma.dominio.delete({ where: { id } });
      
      return res.status(200).json({ message: 'Dominio eliminado' });
    }

    return res.status(405).json({ error: 'Método no permitido' });
  } catch (error: any) {
    console.error('Error en API dominios:', error);
    return res.status(500).json({ error: 'Error en la API', details: error.message });
  } finally {
    await prisma.$disconnect();
  }
}
