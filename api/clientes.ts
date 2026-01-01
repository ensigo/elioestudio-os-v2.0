import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: any, res: any) {
  try {
    // GET - Obtener todos los clientes o uno específico
    if (req.method === 'GET') {
      const { id } = req.query;
      
      if (id) {
        // Obtener cliente específico con relaciones
        const cliente = await prisma.cliente.findUnique({
          where: { id },
          include: {
            credentials: true,
            proyectos: {
              include: {
                tareas: {
                  include: {
                    assignee: true
                  },
                  take: 10,
                  orderBy: { createdAt: 'desc' }
                }
              }
            },
            usuariosAsignados: {
              include: {
                usuario: true
              }
            }
          }
        });
        
        if (!cliente) {
          return res.status(404).json({ error: 'Cliente no encontrado' });
        }
        
        return res.status(200).json(cliente);
      }
      
      // Obtener todos los clientes
      const clientes = await prisma.cliente.findMany({
        orderBy: { createdAt: 'desc' }
      });
      return res.status(200).json(clientes);
    }

    // POST - Crear un nuevo cliente
    if (req.method === 'POST') {
      const { name, email, phone, taxId, status, responsibleId, address, contactPerson } = req.body;

      if (!name) {
        return res.status(400).json({ error: 'El nombre es obligatorio' });
      }

      const nuevoCliente = await prisma.cliente.create({
        data: {
          name,
          email: email || null,
          phone: phone || null,
          taxId: taxId || null,
          address: address || null,
          contactPerson: contactPerson || null,
          status: status || 'ACTIVE',
          responsibleId: responsibleId || null,
          lastActivity: 'Ahora mismo'
        }
      });

      return res.status(201).json(nuevoCliente);
    }

    // PUT - Actualizar cliente
    if (req.method === 'PUT') {
      const { id, name, email, phone, taxId, status, responsibleId, address, contactPerson } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'id es requerido' });
      }

      const updateData: any = {
        lastActivity: 'Editado hace un momento'
      };

      if (name !== undefined) updateData.name = name;
      if (email !== undefined) updateData.email = email || null;
      if (phone !== undefined) updateData.phone = phone || null;
      if (taxId !== undefined) updateData.taxId = taxId || null;
      if (address !== undefined) updateData.address = address || null;
      if (contactPerson !== undefined) updateData.contactPerson = contactPerson || null;
      if (status !== undefined) updateData.status = status;
      if (responsibleId !== undefined) updateData.responsibleId = responsibleId || null;

      const clienteActualizado = await prisma.cliente.update({
        where: { id },
        data: updateData
      });

      return res.status(200).json(clienteActualizado);
    }

    // DELETE - Eliminar cliente
    if (req.method === 'DELETE') {
      const { id } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'id es requerido' });
      }

      await prisma.cliente.delete({
        where: { id }
      });

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Método no permitido' });

  } catch (error: any) {
    console.error('Error en API clientes:', error);
    return res.status(500).json({ error: 'Error en la API', details: error.message });
  } finally {
    await prisma.$disconnect();
  }
}