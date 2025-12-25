import { PrismaClient } from '@prisma/client';

// Conexión directa para garantizar que funcione en Vercel sin dependencias externas
const prisma = new PrismaClient();

export default async function handler(req: any, res: any) {
  // Solo permitimos el método GET para listar
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    // Usamos el modelo 'Cliente' tal cual está en tu schema.prisma
    const clientes = await prisma.cliente.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    return res.status(200).json(clientes);
  } catch (error: any) {
    // Si hay un error de base de datos, lo veremos aquí
    return res.status(500).json({ 
      error: "Error de conexión con la base de datos", 
      details: error.message 
    });
  } finally {
    // Cerramos la conexión para liberar recursos en Vercel
    await prisma.$disconnect();
  }
}