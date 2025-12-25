import { PrismaClient } from '@prisma/client';

// Instancia directa para asegurar que Vercel siempre encuentre el cliente
const prisma = new PrismaClient();

export default async function handler(req: any, res: any) {
  // Solo permitimos GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    // Nombre del modelo exacto según tu schema: Cliente
    const clientes = await prisma.cliente.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    return res.status(200).json(clientes);
  } catch (error: any) {
    return res.status(500).json({ 
      error: "Error de conexión directa a base de datos",
      details: error.message 
    });
  } finally {
    // Cerramos la conexión al terminar la función
    await prisma.$disconnect();
  }
}