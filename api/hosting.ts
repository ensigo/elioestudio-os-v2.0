import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: any, res: any) {
  const { entity } = req.query;

  try {
    // ============ PROVEEDORES ============
    if (entity === 'proveedores') {
      if (req.method === 'GET') {
        const { id } = req.query;
        if (id) {
          const proveedor = await prisma.proveedor.findUnique({
            where: { id },
            include: { hostings: true, dominios: true }
          });
          return res.status(200).json(proveedor);
        }
        const proveedores = await prisma.proveedor.findMany({
          include: { _count: { select: { hostings: true, dominios: true } } },
          orderBy: { nombre: 'asc' }
        });
        return res.status(200).json(proveedores);
      }

      if (req.method === 'POST') {
        const { nombre, tipo, website, notas } = req.body;
        const proveedor = await prisma.proveedor.create({
          data: { nombre, tipo, website, notas }
        });
        return res.status(201).json(proveedor);
      }

      if (req.method === 'PUT') {
        const { id, ...data } = req.body;
        const proveedor = await prisma.proveedor.update({ where: { id }, data });
        return res.status(200).json(proveedor);
      }

      if (req.method === 'DELETE') {
        const { id } = req.body;
        await prisma.proveedor.delete({ where: { id } });
        return res.status(200).json({ message: 'Proveedor eliminado' });
      }
    }

    // ============ HOSTINGS ============
    if (entity === 'hostings') {
      if (req.method === 'GET') {
        const { id, clienteId, estado, proximosVencer } = req.query;

        if (id) {
          const hosting = await prisma.hosting.findUnique({
            where: { id },
            include: { cliente: true, proveedor: true, dominios: true }
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
          where.fechaVencimiento = { gte: hoy, lte: en30Dias };
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
            webAsociada: data.webAsociada || null,
            tieneSSL: data.tieneSSL ?? false,
            tipoSSL: data.tipoSSL || null,
            fechaVencimientoSSL: data.fechaVencimientoSSL ? new Date(data.fechaVencimientoSSL) : null,
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
          include: { cliente: true, proveedor: true }
        });
        return res.status(201).json(hosting);
      }

      if (req.method === 'PUT') {
        const { id, ...data } = req.body;
        if (data.fechaContratacion) data.fechaContratacion = new Date(data.fechaContratacion);
        if (data.fechaVencimiento) data.fechaVencimiento = new Date(data.fechaVencimiento);
        if (data.fechaUltimaRenovacion) data.fechaUltimaRenovacion = new Date(data.fechaUltimaRenovacion);
        if (data.fechaVencimientoSSL) data.fechaVencimientoSSL = new Date(data.fechaVencimientoSSL);
        if (data.importeCoste) data.importeCoste = parseFloat(data.importeCoste);
        if (data.importeVenta) data.importeVenta = parseFloat(data.importeVenta);

        const hosting = await prisma.hosting.update({
          where: { id },
          data,
          include: { cliente: true, proveedor: true, dominios: true }
        });
        return res.status(200).json(hosting);
      }

      if (req.method === 'DELETE') {
        const { id } = req.body;
        await prisma.hosting.delete({ where: { id } });
        return res.status(200).json({ message: 'Hosting eliminado' });
      }
    }

    // ============ DOMINIOS ============
    if (entity === 'dominios') {
      if (req.method === 'GET') {
        const { id, clienteId, hostingId, estado, proximosVencer, sslProximoVencer } = req.query;

        if (id) {
          const dominio = await prisma.dominio.findUnique({
            where: { id },
            include: { cliente: true, proveedor: true, hosting: true }
          });
          return res.status(200).json(dominio);
        }

        const where: any = {};
        if (clienteId) where.clienteId = clienteId;
        if (hostingId) where.hostingId = hostingId;
        if (estado) where.estado = estado;

        if (proximosVencer === 'true') {
          const hoy = new Date();
          const en30Dias = new Date();
          en30Dias.setDate(en30Dias.getDate() + 30);
          where.fechaVencimiento = { gte: hoy, lte: en30Dias };
          where.estado = 'ACTIVO';
        }

        if (sslProximoVencer === 'true') {
          const hoy = new Date();
          const en30Dias = new Date();
          en30Dias.setDate(en30Dias.getDate() + 30);
          where.tieneSSL = true;
          where.fechaVencimientoSSL = { gte: hoy, lte: en30Dias };
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
          include: { cliente: true, proveedor: true, hosting: true }
        });
        return res.status(201).json(dominio);
      }

      if (req.method === 'PUT') {
        const { id, ...data } = req.body;
        if (data.fechaRegistro) data.fechaRegistro = new Date(data.fechaRegistro);
        if (data.fechaVencimiento) data.fechaVencimiento = new Date(data.fechaVencimiento);
        if (data.fechaUltimaRenovacion) data.fechaUltimaRenovacion = new Date(data.fechaUltimaRenovacion);
        if (data.fechaVencimientoSSL) data.fechaVencimientoSSL = new Date(data.fechaVencimientoSSL);
        if (data.importeCoste) data.importeCoste = parseFloat(data.importeCoste);
        if (data.importeVenta) data.importeVenta = parseFloat(data.importeVenta);

        const dominio = await prisma.dominio.update({
          where: { id },
          data,
          include: { cliente: true, proveedor: true, hosting: true }
        });
        return res.status(200).json(dominio);
      }

      if (req.method === 'DELETE') {
        const { id } = req.body;
        await prisma.dominio.delete({ where: { id } });
        return res.status(200).json({ message: 'Dominio eliminado' });
      }
    }

    // ============ EMAILS ============
    if (entity === 'emails') {
      if (req.method === 'GET') {
        const { clienteId } = req.query;
        
        const where: any = {
          category: 'EMAIL',
          isActive: true
        };
        if (clienteId) where.clienteId = clienteId;

        const emailCredentials = await prisma.credential.findMany({
          where,
          include: {
            cliente: { select: { id: true, name: true } }
          },
          orderBy: [
            { cliente: { name: 'asc' } },
            { username: 'asc' }
          ]
        });

        const emails = emailCredentials.map(cred => ({
          id: cred.id,
          clienteId: cred.clienteId,
          cliente: cred.cliente,
          platform: cred.platform,
          username: cred.username,
          passwordEncrypted: cred.passwordEncrypted,
          email: cred.email,
          url: cred.url,
          notes: cred.notes,
          dominioAsociado: cred.emailProvider || (cred.username.includes('@') ? cred.username.split('@')[1] : null),
          isActive: cred.isActive,
          createdAt: cred.createdAt,
          updatedAt: cred.updatedAt
        }));

        return res.status(200).json(emails);
      }

      if (req.method === 'POST') {
        const data = req.body;
        
        const newEmailCredential = await prisma.credential.create({
          data: {
            clienteId: data.clienteId,
            category: 'EMAIL',
            platform: data.platform || 'cPanel Email',
            username: data.username,
            passwordEncrypted: data.passwordEncrypted,
            url: data.url || null,
            email: data.username,
            emailProvider: data.dominioAsociado || null,
            isEmailAccount: true,
            notes: data.notes || null,
            isActive: true,
            createdById: data.createdById || null,
            createdByName: data.createdByName || 'Sistema'
          },
          include: {
            cliente: { select: { id: true, name: true } }
          }
        });

        return res.status(201).json({
          id: newEmailCredential.id,
          clienteId: newEmailCredential.clienteId,
          cliente: newEmailCredential.cliente,
          platform: newEmailCredential.platform,
          username: newEmailCredential.username,
          passwordEncrypted: newEmailCredential.passwordEncrypted,
          url: newEmailCredential.url,
          notes: newEmailCredential.notes,
          dominioAsociado: newEmailCredential.emailProvider,
          isActive: newEmailCredential.isActive,
          createdAt: newEmailCredential.createdAt,
          updatedAt: newEmailCredential.updatedAt
        });
      }

      if (req.method === 'PUT') {
        const { id, ...data } = req.body;
        
        const updatedEmailCredential = await prisma.credential.update({
          where: { id },
          data: {
            platform: data.platform,
            username: data.username,
            passwordEncrypted: data.passwordEncrypted,
            url: data.url || null,
            email: data.username,
            emailProvider: data.dominioAsociado || null,
            notes: data.notes || null,
            lastModifiedById: data.modifiedById || null,
            lastModifiedByName: data.modifiedByName || 'Sistema'
          },
          include: {
            cliente: { select: { id: true, name: true } }
          }
        });

        return res.status(200).json({
          id: updatedEmailCredential.id,
          clienteId: updatedEmailCredential.clienteId,
          cliente: updatedEmailCredential.cliente,
          platform: updatedEmailCredential.platform,
          username: updatedEmailCredential.username,
          passwordEncrypted: updatedEmailCredential.passwordEncrypted,
          url: updatedEmailCredential.url,
          notes: updatedEmailCredential.notes,
          dominioAsociado: updatedEmailCredential.emailProvider,
          isActive: updatedEmailCredential.isActive,
          createdAt: updatedEmailCredential.createdAt,
          updatedAt: updatedEmailCredential.updatedAt
        });
      }

      if (req.method === 'DELETE') {
        const { id } = req.body;
        await prisma.credential.update({
          where: { id },
          data: { isActive: false }
        });
        return res.status(200).json({ message: 'Email desactivado' });
      }
    }

    // ============ DASHBOARD ============
    if (entity === 'dashboard') {
      const hoy = new Date();
      const en30Dias = new Date();
      en30Dias.setDate(en30Dias.getDate() + 30);

      const hostings = await prisma.hosting.findMany({
        where: { estado: 'ACTIVO' },
        select: { importeCoste: true, importeVenta: true, periodicidad: true, fechaVencimiento: true }
      });

      const dominios = await prisma.dominio.findMany({
        where: { estado: 'ACTIVO' },
        select: { importeCoste: true, importeVenta: true, periodicidad: true, fechaVencimiento: true }
      });

      const totalEmails = await prisma.credential.count({
        where: { platform: 'cPanel Email', isActive: true }
      });

      const anualizar = (importe: number, periodicidad: string) => {
        switch (periodicidad) {
          case 'MENSUAL': return importe * 12;
          case 'TRIMESTRAL': return importe * 4;
          case 'SEMESTRAL': return importe * 2;
          default: return importe;
        }
      };

      let totalCosteHostings = 0, totalVentaHostings = 0, hostingsProximosVencer = 0;
      hostings.forEach(h => {
        totalCosteHostings += anualizar(h.importeCoste, h.periodicidad);
        totalVentaHostings += anualizar(h.importeVenta, h.periodicidad);
        if (h.fechaVencimiento >= hoy && h.fechaVencimiento <= en30Dias) hostingsProximosVencer++;
      });

      let totalCosteDominios = 0, totalVentaDominios = 0, dominiosProximosVencer = 0;
      dominios.forEach(d => {
        totalCosteDominios += anualizar(d.importeCoste, d.periodicidad);
        totalVentaDominios += anualizar(d.importeVenta, d.periodicidad);
        if (d.fechaVencimiento >= hoy && d.fechaVencimiento <= en30Dias) dominiosProximosVencer++;
      });

      const alertasHostings = await prisma.hosting.findMany({
        where: { estado: 'ACTIVO', fechaVencimiento: { gte: hoy, lte: en30Dias } },
        include: { cliente: { select: { name: true } } },
        orderBy: { fechaVencimiento: 'asc' }
      });

      const alertasDominios = await prisma.dominio.findMany({
        where: { estado: 'ACTIVO', fechaVencimiento: { gte: hoy, lte: en30Dias } },
        include: { cliente: { select: { name: true } } },
        orderBy: { fechaVencimiento: 'asc' }
      });

      return res.status(200).json({
        totalHostings: hostings.length,
        totalDominios: dominios.length,
        totalEmails,
        ingresoAnualHostings: totalVentaHostings,
        costeAnualHostings: totalCosteHostings,
        margenHostings: totalVentaHostings - totalCosteHostings,
        ingresoAnualDominios: totalVentaDominios,
        costeAnualDominios: totalCosteDominios,
        margenDominios: totalVentaDominios - totalCosteDominios,
        ingresoAnualTotal: totalVentaHostings + totalVentaDominios,
        costeAnualTotal: totalCosteHostings + totalCosteDominios,
        margenTotal: (totalVentaHostings + totalVentaDominios) - (totalCosteHostings + totalCosteDominios),
        hostingsProximosVencer,
        dominiosProximosVencer,
        sslProximosVencer: 0,
        totalAlertas: hostingsProximosVencer + dominiosProximosVencer,
        alertas: { 
          hostings: alertasHostings, 
          dominios: alertasDominios, 
          ssl: []
        }
      });
    }

    // ============ PLANES ============
    if (entity === 'planes') {
      if (req.method === 'GET') {
        const { tipo, activo } = req.query;
        const where: any = {};
        if (tipo) where.tipo = tipo;
        if (activo !== undefined) where.activo = activo === 'true';

        const planes = await prisma.planHosting.findMany({
          where,
          orderBy: [{ tipo: 'asc' }, { orden: 'asc' }, { precioCoste: 'asc' }]
        });
        return res.status(200).json(planes);
      }

      if (req.method === 'POST') {
        const data = req.body;
        const plan = await prisma.planHosting.create({
          data: {
            nombre: data.nombre,
            tipo: data.tipo,
            descripcion: data.descripcion,
            espacio: data.espacio,
            emails: data.emails ? parseInt(data.emails) : null,
            incluyeDominio: data.incluyeDominio ?? false,
            precioCoste: parseFloat(data.precioCoste),
            precioSugerido: data.precioSugerido ? parseFloat(data.precioSugerido) : null,
            activo: data.activo ?? true,
            orden: data.orden ? parseInt(data.orden) : 0
          }
        });
        return res.status(201).json(plan);
      }

      if (req.method === 'PUT') {
        const { id, ...data } = req.body;
        if (data.emails !== undefined) data.emails = data.emails ? parseInt(data.emails) : null;
        if (data.precioCoste !== undefined) data.precioCoste = parseFloat(data.precioCoste);
        if (data.precioSugerido !== undefined) data.precioSugerido = data.precioSugerido ? parseFloat(data.precioSugerido) : null;
        if (data.orden !== undefined) data.orden = parseInt(data.orden);
        if (data.incluyeDominio !== undefined) data.incluyeDominio = Boolean(data.incluyeDominio);
        if (data.activo !== undefined) data.activo = Boolean(data.activo);

        const plan = await prisma.planHosting.update({ where: { id }, data });
        return res.status(200).json(plan);
      }

      if (req.method === 'DELETE') {
        const { id } = req.body;
        await prisma.planHosting.delete({ where: { id } });
        return res.status(200).json({ message: 'Plan eliminado' });
      }
    }

    return res.status(400).json({ error: 'Entity no válida. Usa: proveedores, hostings, dominios, emails, dashboard, planes' });

  } catch (error: any) {
    console.error('Error en API hosting:', error);
    return res.status(500).json({ error: 'Error en la API', details: error.message });
  } finally {
    await prisma.$disconnect();
  }
}