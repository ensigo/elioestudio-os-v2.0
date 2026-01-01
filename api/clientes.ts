import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
    const { name, email, phone, taxId, address, contactPerson, status, responsibleId } = req.body;
    if (!name) return res.status(400).json({ error: 'name es requerido' });

    const cliente = await prisma.cliente.create({
      data: { name, email, phone, taxId, address, contactPerson, status: status || 'ACTIVE', responsibleId, lastActivity: new Date().toISOString() }
    });
    return res.status(201).json(cliente);
  }

  if (req.method === 'PUT') {
    const { id, name, email, phone, taxId, address, contactPerson, status, responsibleId } = req.body;
    if (!id) return res.status(400).json({ error: 'id es requerido' });

    const cliente = await prisma.cliente.update({
      where: { id },
      data: { name, email, phone, taxId, address, contactPerson, status, responsibleId, lastActivity: new Date().toISOString() }
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