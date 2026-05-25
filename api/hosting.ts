import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../lib/api-middleware';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const { entity } = req.query;

  try {
    if (entity === 'proveedores') {
      if (req.method === 'GET') {
        const { id } = req.query;
        if (id) { const p = await prisma.proveedor.findUnique({ where: { id: id as string }, include: { hostings: true, dominios: true } }); return res.status(200).json(p); }
        const proveedores = await prisma.proveedor.findMany({ include: { _count: { select: { hostings: true, dominios: true } } }, orderBy: { nombre: 'asc' } });
        return res.status(200).json(proveedores);
      }
      if (req.method === 'POST') { const { nombre, tipo, website, notas } = req.body; return res.status(201).json(await prisma.proveedor.create({ data: { nombre, tipo, website, notas } })); }
      if (req.method === 'PUT') { const { id, ...data } = req.body; return res.status(200).json(await prisma.proveedor.update({ where: { id }, data })); }
      if (req.method === 'DELETE') { const { id } = req.body; await prisma.proveedor.delete({ where: { id } }); return res.status(200).json({ message: 'Proveedor eliminado' }); }
    }

    if (entity === 'hostings') {
      if (req.method === 'GET') {
        const { id, clienteId, estado, proximosVencer } = req.query;
        if (id) { return res.status(200).json(await prisma.hosting.findUnique({ where: { id: id as string }, include: { cliente: true, proveedor: true, dominios: true } })); }
        const where: Record<string, unknown> = {};
        if (clienteId) where.clienteId = clienteId;
        if (estado) where.estado = estado;
        if (proximosVencer === 'true') { const hoy = new Date(); const en30 = new Date(); en30.setDate(en30.getDate() + 30); where.fechaVencimiento = { gte: hoy, lte: en30 }; where.estado = 'ACTIVO'; }
        return res.status(200).json(await prisma.hosting.findMany({ where, include: { cliente: { select: { id: true, name: true } }, proveedor: { select: { id: true, nombre: true } }, dominios: { select: { id: true, nombre: true, extension: true } } }, orderBy: { fechaVencimiento: 'asc' } }));
      }
      if (req.method === 'POST') {
        const d = req.body;
        return res.status(201).json(await prisma.hosting.create({ data: { clienteId: d.clienteId, proveedorId: d.proveedorId, nombre: d.nombre, webAsociada: d.webAsociada || null, tipoHosting: d.tipoHosting, especificaciones: d.especificaciones, ipServidor: d.ipServidor, panelControl: d.panelControl, urlPanel: d.urlPanel, usuarioPanel: d.usuarioPanel, passwordPanel: d.passwordPanel, importeCoste: parseFloat(d.importeCoste), importeVenta: parseFloat(d.importeVenta), periodicidad: d.periodicidad || 'ANUAL', fechaContratacion: new Date(d.fechaContratacion), fechaVencimiento: new Date(d.fechaVencimiento), autoRenovar: d.autoRenovar ?? true, notas: d.notas }, include: { cliente: true, proveedor: true } }));
      }
      if (req.method === 'PUT') {
        const { id, clienteId, proveedorId, tieneSSL, tipoSSL, fechaVencimientoSSL, ...restData } = req.body;
        const data: Record<string, unknown> = { ...restData };
        if (data.fechaContratacion) data.fechaContratacion = new Date(data.fechaContratacion as string);
        if (data.fechaVencimiento) data.fechaVencimiento = new Date(data.fechaVencimiento as string);
        if (data.fechaUltimaRenovacion) data.fechaUltimaRenovacion = new Date(data.fechaUltimaRenovacion as string);
        if (data.importeCoste) data.importeCoste = parseFloat(data.importeCoste as string);
        if (data.importeVenta) data.importeVenta = parseFloat(data.importeVenta as string);
        delete data.cliente; delete data.proveedor; delete data.dominios; delete data.createdAt; delete data.updatedAt;
        return res.status(200).json(await prisma.hosting.update({ where: { id }, data, include: { cliente: true, proveedor: true, dominios: true } }));
      }
      if (req.method === 'DELETE') { const { id } = req.body; await prisma.hosting.delete({ where: { id } }); return res.status(200).json({ message: 'Hosting eliminado' }); }
    }

    if (entity === 'dominios') {
      if (req.method === 'GET') {
        const { id, clienteId, hostingId, estado, proximosVencer, sslProximoVencer } = req.query;
        if (id) { return res.status(200).json(await prisma.dominio.findUnique({ where: { id: id as string }, include: { cliente: true, proveedor: true, hosting: true } })); }
        const where: Record<string, unknown> = {};
        if (clienteId) where.clienteId = clienteId;
        if (hostingId) where.hostingId = hostingId;
        if (estado) where.estado = estado;
        if (proximosVencer === 'true') { const hoy = new Date(); const en30 = new Date(); en30.setDate(en30.getDate() + 30); where.fechaVencimiento = { gte: hoy, lte: en30 }; where.estado = 'ACTIVO'; }
        if (sslProximoVencer === 'true') { const hoy = new Date(); const en30 = new Date(); en30.setDate(en30.getDate() + 30); where.tieneSSL = true; where.fechaVencimientoSSL = { gte: hoy, lte: en30 }; }
        return res.status(200).json(await prisma.dominio.findMany({ where, include: { cliente: { select: { id: true, name: true } }, proveedor: { select: { id: true, nombre: true } }, hosting: { select: { id: true, nombre: true } } }, orderBy: { fechaVencimiento: 'asc' } }));
      }
      if (req.method === 'POST') {
        const d = req.body;
        return res.status(201).json(await prisma.dominio.create({ data: { clienteId: d.clienteId, hostingId: d.hostingId || null, proveedorId: d.proveedorId, nombre: d.nombre, extension: d.extension, tieneSSL: d.tieneSSL ?? false, tipoSSL: d.tipoSSL, fechaVencimientoSSL: d.fechaVencimientoSSL ? new Date(d.fechaVencimientoSSL) : null, nameservers: d.nameservers, registroDNS: d.registroDNS, importeCoste: parseFloat(d.importeCoste), importeVenta: parseFloat(d.importeVenta), periodicidad: d.periodicidad || 'ANUAL', fechaRegistro: new Date(d.fechaRegistro), fechaVencimiento: new Date(d.fechaVencimiento), autoRenovar: d.autoRenovar ?? true, notas: d.notas }, include: { cliente: true, proveedor: true, hosting: true } }));
      }
      if (req.method === 'PUT') {
        const { id, ...data } = req.body;
        if (data.fechaRegistro) data.fechaRegistro = new Date(data.fechaRegistro);
        if (data.fechaVencimiento) data.fechaVencimiento = new Date(data.fechaVencimiento);
        if (data.fechaUltimaRenovacion) data.fechaUltimaRenovacion = new Date(data.fechaUltimaRenovacion);
        if (data.fechaVencimientoSSL) data.fechaVencimientoSSL = new Date(data.fechaVencimientoSSL);
        if (data.importeCoste) data.importeCoste = parseFloat(data.importeCoste);
        if (data.importeVenta) data.importeVenta = parseFloat(data.importeVenta);
        return res.status(200).json(await prisma.dominio.update({ where: { id }, data, include: { cliente: true, proveedor: true, hosting: true } }));
      }
      if (req.method === 'DELETE') { const { id } = req.body; await prisma.dominio.delete({ where: { id } }); return res.status(200).json({ message: 'Dominio eliminado' }); }
    }

    if (entity === 'emails') {
      if (req.method === 'GET') {
        const { clienteId } = req.query;
        const where: Record<string, unknown> = { category: 'EMAIL', isActive: true };
        if (clienteId) where.clienteId = clienteId;
        const emailCredentials = await prisma.credential.findMany({ where, include: { cliente: { select: { id: true, name: true } } }, orderBy: [{ cliente: { name: 'asc' } }, { username: 'asc' }] });
        return res.status(200).json(emailCredentials.map(c => ({ id: c.id, clienteId: c.clienteId, cliente: c.cliente, platform: c.platform, username: c.username, passwordEncrypted: c.passwordEncrypted, email: c.email, url: c.url, notes: c.notes, dominioAsociado: c.emailProvider || (c.username.includes('@') ? c.username.split('@')[1] : null), isActive: c.isActive, createdAt: c.createdAt, updatedAt: c.updatedAt })));
      }
      if (req.method === 'POST') {
        const d = req.body;
        const cred = await prisma.credential.create({ data: { clienteId: d.clienteId, category: 'EMAIL', platform: d.platform || 'cPanel Email', username: d.username, passwordEncrypted: d.passwordEncrypted, url: d.url || null, email: d.username, emailProvider: d.dominioAsociado || null, isEmailAccount: true, notes: d.notes || null, isActive: true, createdById: d.createdById || null, createdByName: d.createdByName || 'Sistema' }, include: { cliente: { select: { id: true, name: true } } } });
        return res.status(201).json({ id: cred.id, clienteId: cred.clienteId, cliente: cred.cliente, platform: cred.platform, username: cred.username, passwordEncrypted: cred.passwordEncrypted, url: cred.url, notes: cred.notes, dominioAsociado: cred.emailProvider, isActive: cred.isActive, createdAt: cred.createdAt, updatedAt: cred.updatedAt });
      }
      if (req.method === 'PUT') {
        const { id, ...d } = req.body;
        const updated = await prisma.credential.update({ where: { id }, data: { platform: d.platform, username: d.username, passwordEncrypted: d.passwordEncrypted, url: d.url || null, email: d.username, emailProvider: d.dominioAsociado || null, notes: d.notes || null, lastModifiedById: d.modifiedById || null, lastModifiedByName: d.modifiedByName || 'Sistema' }, include: { cliente: { select: { id: true, name: true } } } });
        return res.status(200).json({ id: updated.id, clienteId: updated.clienteId, cliente: updated.cliente, platform: updated.platform, username: updated.username, passwordEncrypted: updated.passwordEncrypted, url: updated.url, notes: updated.notes, dominioAsociado: updated.emailProvider, isActive: updated.isActive, createdAt: updated.createdAt, updatedAt: updated.updatedAt });
      }
      if (req.method === 'DELETE') { const { id } = req.body; await prisma.credential.update({ where: { id }, data: { isActive: false } }); return res.status(200).json({ message: 'Email desactivado' }); }
    }

    if (entity === 'dashboard') {
      const hoy = new Date(); const en30 = new Date(); en30.setDate(en30.getDate() + 30);
      const [hostings, dominios, totalEmails] = await Promise.all([
        prisma.hosting.findMany({ where: { estado: 'ACTIVO' }, select: { importeCoste: true, importeVenta: true, periodicidad: true, fechaVencimiento: true } }),
        prisma.dominio.findMany({ where: { estado: 'ACTIVO' }, select: { importeCoste: true, importeVenta: true, periodicidad: true, fechaVencimiento: true } }),
        prisma.credential.count({ where: { platform: 'cPanel Email', isActive: true } }),
      ]);
      const anualizar = (i: number, p: string) => ({ MENSUAL: i * 12, TRIMESTRAL: i * 4, SEMESTRAL: i * 2 }[p] ?? i);
      let tCH = 0, tVH = 0, hPV = 0;
      hostings.forEach(h => { tCH += anualizar(h.importeCoste, h.periodicidad); tVH += anualizar(h.importeVenta, h.periodicidad); if (h.fechaVencimiento >= hoy && h.fechaVencimiento <= en30) hPV++; });
      let tCD = 0, tVD = 0, dPV = 0;
      dominios.forEach(d => { tCD += anualizar(d.importeCoste, d.periodicidad); tVD += anualizar(d.importeVenta, d.periodicidad); if (d.fechaVencimiento >= hoy && d.fechaVencimiento <= en30) dPV++; });
      const [alertasHostings, alertasDominios] = await Promise.all([
        prisma.hosting.findMany({ where: { estado: 'ACTIVO', fechaVencimiento: { gte: hoy, lte: en30 } }, include: { cliente: { select: { name: true } } }, orderBy: { fechaVencimiento: 'asc' } }),
        prisma.dominio.findMany({ where: { estado: 'ACTIVO', fechaVencimiento: { gte: hoy, lte: en30 } }, include: { cliente: { select: { name: true } } }, orderBy: { fechaVencimiento: 'asc' } }),
      ]);
      return res.status(200).json({ totalHostings: hostings.length, totalDominios: dominios.length, totalEmails, ingresoAnualHostings: tVH, costeAnualHostings: tCH, margenHostings: tVH - tCH, ingresoAnualDominios: tVD, costeAnualDominios: tCD, margenDominios: tVD - tCD, ingresoAnualTotal: tVH + tVD, costeAnualTotal: tCH + tCD, margenTotal: (tVH + tVD) - (tCH + tCD), hostingsProximosVencer: hPV, dominiosProximosVencer: dPV, sslProximosVencer: 0, totalAlertas: hPV + dPV, alertas: { hostings: alertasHostings, dominios: alertasDominios, ssl: [] } });
    }

    if (entity === 'planes') {
      if (req.method === 'GET') { const { tipo, activo } = req.query; const where: Record<string, unknown> = {}; if (tipo) where.tipo = tipo; if (activo !== undefined) where.activo = activo === 'true'; return res.status(200).json(await prisma.planHosting.findMany({ where, orderBy: [{ tipo: 'asc' }, { orden: 'asc' }, { precioCoste: 'asc' }] })); }
      if (req.method === 'POST') { const d = req.body; return res.status(201).json(await prisma.planHosting.create({ data: { nombre: d.nombre, tipo: d.tipo, descripcion: d.descripcion, espacio: d.espacio, emails: d.emails ? parseInt(d.emails) : null, incluyeDominio: d.incluyeDominio ?? false, precioCoste: parseFloat(d.precioCoste), precioSugerido: d.precioSugerido ? parseFloat(d.precioSugerido) : null, activo: d.activo ?? true, orden: d.orden ? parseInt(d.orden) : 0 } })); }
      if (req.method === 'PUT') { const { id, ...d } = req.body; if (d.emails !== undefined) d.emails = d.emails ? parseInt(d.emails) : null; if (d.precioCoste !== undefined) d.precioCoste = parseFloat(d.precioCoste); if (d.precioSugerido !== undefined) d.precioSugerido = d.precioSugerido ? parseFloat(d.precioSugerido) : null; if (d.orden !== undefined) d.orden = parseInt(d.orden); if (d.incluyeDominio !== undefined) d.incluyeDominio = Boolean(d.incluyeDominio); if (d.activo !== undefined) d.activo = Boolean(d.activo); return res.status(200).json(await prisma.planHosting.update({ where: { id }, data: d })); }
      if (req.method === 'DELETE') { const { id } = req.body; await prisma.planHosting.delete({ where: { id } }); return res.status(200).json({ message: 'Plan eliminado' }); }
    }

    return res.status(400).json({ error: 'Entity no válida' });
  } catch (error) {
    console.error('Error en API hosting:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}
