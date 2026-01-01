import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const METRICOOL_API_KEY = process.env.METRICOOL_API_KEY;
const METRICOOL_BASE_URL = 'https://app.metricool.com/api/v1';

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

  try {
    // OBTENER MARCAS: /api/clientes?resource=metricool&action=brands
    if (action === 'brands') {
      const response = await fetch(`${METRICOOL_BASE_URL}/brands`, {
        headers: {
          'X-API-KEY': METRICOOL_API_KEY || '',
          'Content-Type': 'application/json'
        }
      });

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
      const response = await fetch(`${METRICOOL_BASE_URL}/brands/${brandId}/posts/scheduled`, {
        headers: {
          'X-API-KEY': METRICOOL_API_KEY || '',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error Metricool scheduled:', response.status, errorText);
        return res.status(response.status).json({ error: 'Error obteniendo posts programados', details: errorText });
      }

      const data = await response.json();
      return res.status(200).json(data);
    }

    // OBTENER HISTORIAL DE POSTS: /api/clientes?resource=metricool&action=history&brandId=xxx
    if (action === 'history' && brandId) {
      const now = new Date();
      const startDate = new Date(now);
      startDate.setMonth(startDate.getMonth() - 1);
      
      const response = await fetch(
        `${METRICOOL_BASE_URL}/brands/${brandId}/posts?startDate=${startDate.toISOString().split('T')[0]}&endDate=${now.toISOString().split('T')[0]}`,
        {
          headers: {
            'X-API-KEY': METRICOOL_API_KEY || '',
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error Metricool history:', response.status, errorText);
        return res.status(response.status).json({ error: 'Error obteniendo historial', details: errorText });
      }

      const data = await response.json();
      return res.status(200).json(data);
    }

    return res.status(400).json({ error: 'Acción requerida: brands, scheduled, o history' });

  } catch (error: any) {
    console.error('Error Metricool:', error);
    return res.status(500).json({ error: 'Error de conexión con Metricool', details: error.message });
  }
}