import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const METRICOOL_API_KEY = process.env.METRICOOL_API_KEY;
const METRICOOL_USER_ID = '2646657';
const METRICOOL_BASE_URL = 'https://app.metricool.com/api';

export default async function handler(req: any, res: any) {
  const { resource } = req.query;
  try {
    // CREDENTIALS: /api/clientes?resource=credentials
    if (resource === 'credentials') {
      return handleCredentials(req, res);
    }
    
    // TEAM: /api/clientes?resource=team
    if (resource === 'team') {
      return handleTeam(req, res);
    }

    // METRICOOL: /api/clientes?resource=metricool
    if (resource === 'metricool') {
      return handleMetricool(req, res);
    }

    // SERVICIOS RECURRENTES: /api/clientes?resource=servicios
    if (resource === 'servicios') {
      return handleServicios(req, res);
    }
    
    // CONTRATOS: /api/clientes?resource=contratos
    if (resource === 'contratos') {
      return handleContratos(req, res);
    }

    // CLIENTES (default)
    return handleClientes(req, res);
  } catch (error: any) {
    console.error('Error en API clientes:', error);
    return res.status(500).json({ error: 'Error en la API', details: error.message });
  } finally {
    await prisma.$disconnect();
  }
}

// ============ CLIENTES ============
async function handleClientes(req: any, res: any) {
  if (req.method === 'GET') {
    const { id } = req.query;
    
    if (id) {
      const cliente = await prisma.cliente.findUnique({
        where: { id },
        include: {
          credentials: true,
          proyectos: { include: { tareas: { include: { assignee: true } } } },
          usuariosAsignados: { include: { usuario: true } }
        }
      });
      if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado' });
      return res.status(200).json(cliente);
    }
    const clientes = await prisma.cliente.findMany({ orderBy: { createdAt: 'desc' } });
    return res.status(200).json(clientes);
  }

  if (req.method === 'POST') {
    const { name, email, phone, taxId, address, contactPerson, status, responsibleId, metricoolBrandId } = req.body;
    if (!name) return res.status(400).json({ error: 'name es requerido' });
    const cliente = await prisma.cliente.create({
      data: { name, email, phone, taxId, address, contactPerson, status: status || 'ACTIVE', responsibleId, metricoolBrandId, lastActivity: new Date().toISOString() }
    });
    return res.status(201).json(cliente);
  }

  if (req.method === 'PUT') {
    const { id, name, email, phone, taxId, address, contactPerson, status, responsibleId, metricoolBrandId } = req.body;
    if (!id) return res.status(400).json({ error: 'id es requerido' });
    const cliente = await prisma.cliente.update({
      where: { id },
      data: { name, email, phone, taxId, address, contactPerson, status, responsibleId, metricoolBrandId, lastActivity: new Date().toISOString() }
    });
    return res.status(200).json(cliente);
  }

  if (req.method === 'DELETE') {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'id es requerido' });
    await prisma.cliente.delete({ where: { id } });
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Método no permitido' });
}

// ============ CREDENTIALS ============
async function handleCredentials(req: any, res: any) {
  if (req.method === 'GET') {
    const { clienteId } = req.query;
    if (!clienteId) return res.status(400).json({ error: 'clienteId es requerido' });
    const credentials = await prisma.credential.findMany({
      where: { clienteId },
      orderBy: [{ category: 'asc' }, { platform: 'asc' }]
    });
    return res.status(200).json(credentials);
  }

  if (req.method === 'POST') {
    const { clienteId, category, platform, url, username, passwordEncrypted, email, isEmailAccount, emailProvider, parentId, notes, createdById, createdByName } = req.body;
    if (!clienteId || !category || !platform || !username || !passwordEncrypted) {
      return res.status(400).json({ error: 'Campos requeridos faltantes' });
    }
    const credential = await prisma.credential.create({
      data: { clienteId, category, platform, url, username, passwordEncrypted, email, isEmailAccount: isEmailAccount || false, emailProvider, parentId, notes, isActive: true, createdById, createdByName: createdByName || 'Sistema', lastModifiedById: createdById, lastModifiedByName: createdByName || 'Sistema' }
    });
    return res.status(201).json(credential);
  }

  if (req.method === 'PUT') {
    const { id, category, platform, url, username, passwordEncrypted, email, isEmailAccount, emailProvider, notes, isActive, modifiedById, modifiedByName } = req.body;
    if (!id) return res.status(400).json({ error: 'id es requerido' });
    const credential = await prisma.credential.update({
      where: { id },
      data: { category, platform, url, username, passwordEncrypted, email, isEmailAccount, emailProvider, notes, isActive, lastModifiedById: modifiedById, lastModifiedByName: modifiedByName || 'Sistema' }
    });
    return res.status(200).json(credential);
  }

  if (req.method === 'DELETE') {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'id es requerido' });
    await prisma.credential.delete({ where: { id } });
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Método no permitido' });
}

// ============ TEAM (ClienteUsuario) ============
async function handleTeam(req: any, res: any) {
  if (req.method === 'GET') {
    const { clienteId } = req.query;
    if (!clienteId) return res.status(400).json({ error: 'clienteId es requerido' });
    const team = await prisma.clienteUsuario.findMany({
      where: { clienteId },
      include: { usuario: true }
    });
    return res.status(200).json(team);
  }

  if (req.method === 'POST') {
    const { clienteId, usuarioId, role } = req.body;
    if (!clienteId || !usuarioId) return res.status(400).json({ error: 'clienteId y usuarioId requeridos' });
    const existe = await prisma.clienteUsuario.findUnique({ where: { clienteId_usuarioId: { clienteId, usuarioId } } });
    if (existe) return res.status(400).json({ error: 'Usuario ya asignado' });
    const assignment = await prisma.clienteUsuario.create({
      data: { clienteId, usuarioId, role: role || 'MEMBER' },
      include: { usuario: true }
    });
    return res.status(201).json(assignment);
  }

  if (req.method === 'DELETE') {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'id es requerido' });
    await prisma.clienteUsuario.delete({ where: { id } });
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Método no permitido' });
}

// ============ METRICOOL ============
async function handleMetricool(req: any, res: any) {
  if (!METRICOOL_API_KEY) {
    return res.status(500).json({ error: 'API Key de Metricool no configurada' });
  }

  const { action, brandId } = req.query;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const headers = {
    'X-Mc-Auth': METRICOOL_API_KEY
  };

  try {
    // OBTENER MARCAS: /api/clientes?resource=metricool&action=brands
    if (action === 'brands') {
      const response = await fetch(
        `${METRICOOL_BASE_URL}/admin/simpleProfiles?userId=${METRICOOL_USER_ID}`,
        { headers }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error Metricool brands:', response.status, errorText);
        return res.status(response.status).json({ error: 'Error obteniendo marcas', details: errorText });
      }

      const data = await response.json();
      return res.status(200).json(data);
    }

    // OBTENER POSTS PROGRAMADOS: /api/clientes?resource=metricool&action=scheduled&brandId=xxx
    if (action === 'scheduled' && brandId) {
      // Calcular rango de fechas: 1 mes atrás hasta 3 meses en el futuro
      const now = new Date();
      const pastDate = new Date(now);
      pastDate.setMonth(pastDate.getMonth() - 1);
      const futureDate = new Date(now);
      futureDate.setMonth(futureDate.getMonth() + 3);
      
      const startDate = pastDate.toISOString().split('.')[0]; // formato: yyyy-MM-ddTHH:mm:ss
      const endDate = futureDate.toISOString().split('.')[0];
      
      const response = await fetch(
        `${METRICOOL_BASE_URL}/v2/scheduler/posts?userId=${METRICOOL_USER_ID}&blogId=${brandId}&start=${startDate}&end=${endDate}`,
        { headers }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error Metricool scheduled:', response.status, errorText);
        return res.status(response.status).json({ error: 'Error obteniendo posts programados', details: errorText });
      }

      const data = await response.json();
      return res.status(200).json(data);
    }

    return res.status(400).json({ error: 'Acción requerida: brands o scheduled' });

  } catch (error: any) {
    console.error('Error Metricool:', error);
    return res.status(500).json({ error: 'Error de conexión con Metricool', details: error.message });
  }
}

// ============ SERVICIOS RECURRENTES ============
async function handleServicios(req: any, res: any) {
  if (req.method === 'GET') {
    const servicios = await prisma.servicioRecurrente.findMany({
      where: { activo: true },
      orderBy: [{ tipo: 'desc' }, { nombre: 'asc' }]
    });
    return res.status(200).json(servicios);
  }

  if (req.method === 'POST') {
    const data = req.body;
    const servicio = await prisma.servicioRecurrente.create({
      data: {
        codigo: data.codigo,
        nombre: data.nombre,
        descripcion: data.descripcion,
        categoria: data.categoria,
        tipo: data.tipo || 'INDIVIDUAL',
        serviciosIncluidos: data.serviciosIncluidos || null,
        precioBase: data.precioBase ? parseFloat(data.precioBase) : null,
        cuotaActivacion: data.cuotaActivacion ? parseFloat(data.cuotaActivacion) : null,
        activo: data.activo ?? true
      }
    });
    return res.status(201).json(servicio);
  }

  if (req.method === 'PUT') {
    const { id, ...data } = req.body;
    if (data.precioBase !== undefined) data.precioBase = data.precioBase ? parseFloat(data.precioBase) : null;
    if (data.cuotaActivacion !== undefined) data.cuotaActivacion = data.cuotaActivacion ? parseFloat(data.cuotaActivacion) : null;
    const servicio = await prisma.servicioRecurrente.update({ where: { id }, data });
    return res.status(200).json(servicio);
  }

  if (req.method === 'DELETE') {
    const { id } = req.body;
    await prisma.servicioRecurrente.update({ where: { id }, data: { activo: false } });
    return res.status(200).json({ message: 'Servicio desactivado' });
  }

  return res.status(405).json({ error: 'Método no permitido' });
}

// ============ CONTRATOS ============
async function handleContratos(req: any, res: any) {
  if (req.method === 'GET') {
    const { clienteId, estado, dashboard } = req.query;

    // Dashboard de contratos
    if (dashboard === 'true') {
      const contratos = await prisma.contrato.findMany({
        where: { estado: { in: ['ACTIVO', 'PAUSADO'] } },
        include: {
          cliente: { select: { id: true, name: true } },
          servicio: { select: { id: true, nombre: true, categoria: true } }
        }
      });

      const hoy = new Date();
      const en30Dias = new Date(hoy);
      en30Dias.setDate(hoy.getDate() + 30);

      // Calcular MRR (Monthly Recurring Revenue)
      const mrrTotal = contratos.reduce((sum, c) => {
        if (c.estado !== 'ACTIVO') return sum;
        switch (c.periodicidad) {
          case 'MENSUAL': return sum + c.importeMensual;
          case 'TRIMESTRAL': return sum + (c.importeMensual / 3);
          case 'SEMESTRAL': return sum + (c.importeMensual / 6);
          case 'ANUAL': return sum + (c.importeMensual / 12);
          default: return sum + c.importeMensual;
        }
      }, 0);

      // Contratos próximos a vencer
      const proximosVencer = contratos.filter(c => {
        if (!c.fechaRenovacion && !c.fechaFin) return false;
        const fechaLimite = c.fechaRenovacion || c.fechaFin;
        return fechaLimite && new Date(fechaLimite) <= en30Dias && new Date(fechaLimite) >= hoy;
      });

      // Agrupar por categoría
      const porCategoria = contratos.reduce((acc: any, c) => {
        if (c.estado !== 'ACTIVO') return acc;
        const cat = c.servicio.categoria;
        if (!acc[cat]) acc[cat] = { count: 0, mrr: 0 };
        acc[cat].count++;
        switch (c.periodicidad) {
          case 'MENSUAL': acc[cat].mrr += c.importeMensual; break;
          case 'TRIMESTRAL': acc[cat].mrr += c.importeMensual / 3; break;
          case 'SEMESTRAL': acc[cat].mrr += c.importeMensual / 6; break;
          case 'ANUAL': acc[cat].mrr += c.importeMensual / 12; break;
          default: acc[cat].mrr += c.importeMensual;
        }
        return acc;
      }, {});

      return res.status(200).json({
        totalContratos: contratos.filter(c => c.estado === 'ACTIVO').length,
        contratosPausados: contratos.filter(c => c.estado === 'PAUSADO').length,
        mrrTotal: Math.round(mrrTotal * 100) / 100,
        arrTotal: Math.round(mrrTotal * 12 * 100) / 100,
        proximosVencer,
        porCategoria
      });
    }

    // Lista de contratos
    const where: any = {};
    if (clienteId) where.clienteId = clienteId;
    if (estado) where.estado = estado;

    const contratos = await prisma.contrato.findMany({
      where,
      include: {
        cliente: { select: { id: true, name: true } },
        servicio: { select: { id: true, nombre: true, categoria: true } }
      },
      orderBy: { fechaInicio: 'desc' }
    });
    return res.status(200).json(contratos);
  }

  if (req.method === 'POST') {
    const data = req.body;
    const contrato = await prisma.contrato.create({
      data: {
        clienteId: data.clienteId,
        servicioId: data.servicioId,
        nombre: data.nombre,
        descripcion: data.descripcion,
        importeMensual: parseFloat(data.importeMensual),
        periodicidad: data.periodicidad || 'MENSUAL',
        fechaInicio: new Date(data.fechaInicio),
        fechaFin: data.fechaFin ? new Date(data.fechaFin) : null,
        fechaRenovacion: data.fechaRenovacion ? new Date(data.fechaRenovacion) : null,
        autoRenovar: data.autoRenovar ?? true,
        estado: data.estado || 'ACTIVO',
        notas: data.notas
      },
      include: {
        cliente: { select: { id: true, name: true } },
        servicio: { select: { id: true, nombre: true, categoria: true } }
      }
    });

    // Registrar en historial
    await prisma.historialContrato.create({
      data: {
        contratoId: contrato.id,
        tipo: 'CREACION',
        descripcion: `Contrato creado: ${contrato.servicio.nombre} para ${contrato.cliente.name}`,
        valorNuevo: contrato.importeMensual
      }
    });

    return res.status(201).json(contrato);
  }

  if (req.method === 'PUT') {
    const { id, ...data } = req.body;
    
    // Obtener contrato actual para historial
    const contratoActual = await prisma.contrato.findUnique({ where: { id } });
    
    if (data.importeMensual) data.importeMensual = parseFloat(data.importeMensual);
    if (data.fechaInicio) data.fechaInicio = new Date(data.fechaInicio);
    if (data.fechaFin) data.fechaFin = new Date(data.fechaFin);
    if (data.fechaRenovacion) data.fechaRenovacion = new Date(data.fechaRenovacion);

    const contrato = await prisma.contrato.update({
      where: { id },
      data,
      include: {
        cliente: { select: { id: true, name: true } },
        servicio: { select: { id: true, nombre: true, categoria: true } }
      }
    });

    // Registrar cambios en historial
    if (contratoActual && data.importeMensual && contratoActual.importeMensual !== data.importeMensual) {
      await prisma.historialContrato.create({
        data: {
          contratoId: id,
          tipo: 'CAMBIO_PRECIO',
          descripcion: 'Cambio de precio',
          valorAnterior: contratoActual.importeMensual,
          valorNuevo: data.importeMensual
        }
      });
    }

    if (contratoActual && data.estado && contratoActual.estado !== data.estado) {
      await prisma.historialContrato.create({
        data: {
          contratoId: id,
          tipo: data.estado === 'PAUSADO' ? 'PAUSA' : data.estado === 'CANCELADO' ? 'CANCELACION' : 'REACTIVACION',
          descripcion: `Estado cambiado a ${data.estado}`
        }
      });
    }

    return res.status(200).json(contrato);
  }

  if (req.method === 'DELETE') {
    const { id } = req.body;
    await prisma.contrato.update({
      where: { id },
      data: { estado: 'CANCELADO' }
    });
    
    await prisma.historialContrato.create({
      data: {
        contratoId: id,
        tipo: 'CANCELACION',
        descripcion: 'Contrato cancelado'
      }
    });

    return res.status(200).json({ message: 'Contrato cancelado' });
  }

  return res.status(405).json({ error: 'Método no permitido' });
}