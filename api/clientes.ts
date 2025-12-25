import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: any, res: any) {
  try {
    // GET - Obtener todos los clientes
    if (req.method === 'GET') {
      const clientes = await prisma.cliente.findMany({
        orderBy: { createdAt: 'desc' }
      });
      return res.status(200).json(clientes);
    }

    // POST - Crear un nuevo cliente
    if (req.method === 'POST') {
      const { name, email, phone, taxId, status, responsibleId } = req.body;

      // Validación básica
      if (!name) {
        return res.status(400).json({ error: 'El nombre es obligatorio' });
      }

      const nuevoCliente = await prisma.cliente.create({
        data: {
          name,
          email: email || null,
          phone: phone || null,
          taxId: taxId || null,
          status: status || 'ACTIVE',
          responsibleId: responsibleId || null,
          lastActivity: 'Ahora mismo'
        }
      });

      return res.status(201).json(nuevoCliente);
    }

    // Método no permitido
    return res.status(405).json({ error: 'Método no permitido' });

  } catch (error: any) {
    console.error('Error en API clientes:', error);
    return res.status(500).json({ error: 'Error en la API', details: error.message });
  } finally {
    await prisma.$disconnect();
  }
}