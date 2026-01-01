import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: any, res: any) {
  try {
    // GET - Obtener credenciales de un cliente (agrupadas por categoría)
    if (req.method === 'GET') {
      const { clienteId, category } = req.query;
      
      if (!clienteId) {
        return res.status(400).json({ error: 'clienteId es requerido' });
      }

      const whereClause: any = { clienteId };
      if (category) {
        whereClause.category = category;
      }

      const credentials = await prisma.credential.findMany({
        where: whereClause,
        orderBy: [
          { category: 'asc' },
          { platform: 'asc' },
          { createdAt: 'desc' }
        ]
      });
      
      return res.status(200).json(credentials);
    }

    // POST - Crear nueva credencial
    if (req.method === 'POST') {
      const { 
        clienteId,
        category,
        platform, 
        url, 
        username, 
        passwordEncrypted,
        email,
        isEmailAccount,
        emailProvider,
        parentId,
        notes,
        createdById,
        createdByName 
      } = req.body;

      if (!clienteId || !category || !platform || !username || !passwordEncrypted) {
        return res.status(400).json({ 
          error: 'clienteId, category, platform, username y passwordEncrypted son requeridos' 
        });
      }

      const credential = await prisma.credential.create({
        data: {
          clienteId,
          category,
          platform,
          url: url || null,
          username,
          passwordEncrypted,
          email: email || null,
          isEmailAccount: isEmailAccount || false,
          emailProvider: emailProvider || null,
          parentId: parentId || null,
          notes: notes || null,
          isActive: true,
          createdById: createdById || null,
          createdByName: createdByName || 'Sistema',
          lastModifiedById: createdById || null,
          lastModifiedByName: createdByName || 'Sistema'
        }
      });

      return res.status(201).json(credential);
    }

    // PUT - Actualizar credencial
    if (req.method === 'PUT') {
      const { 
        id,
        category,
        platform, 
        url, 
        username, 
        passwordEncrypted,
        email,
        isEmailAccount,
        emailProvider,
        notes,
        isActive,
        modifiedById,
        modifiedByName 
      } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'id es requerido' });
      }

      const updateData: any = {
        lastModifiedById: modifiedById || null,
        lastModifiedByName: modifiedByName || 'Sistema'
      };

      if (category !== undefined) updateData.category = category;
      if (platform !== undefined) updateData.platform = platform;
      if (url !== undefined) updateData.url = url;
      if (username !== undefined) updateData.username = username;
      if (passwordEncrypted !== undefined) updateData.passwordEncrypted = passwordEncrypted;
      if (email !== undefined) updateData.email = email;
      if (isEmailAccount !== undefined) updateData.isEmailAccount = isEmailAccount;
      if (emailProvider !== undefined) updateData.emailProvider = emailProvider;
      if (notes !== undefined) updateData.notes = notes;
      if (isActive !== undefined) updateData.isActive = isActive;

      const credential = await prisma.credential.update({
        where: { id },
        data: updateData
      });

      return res.status(200).json(credential);
    }

    // DELETE - Eliminar credencial
    if (req.method === 'DELETE') {
      const { id } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'id es requerido' });
      }

      await prisma.credential.delete({
        where: { id }
      });

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Método no permitido' });

  } catch (error: any) {
    console.error('Error en API credentials:', error);
    return res.status(500).json({ error: 'Error en la API', details: error.message });
  } finally {
    await prisma.$disconnect();
  }
}
