import { PrismaClient } from '@prisma/client';

// Forzamos la instancia aquí para evitar errores de módulos no encontrados
const prisma = new PrismaClient();

export default async function handler(req: any, res: any) {
  try {
    // El modelo en tu schema es 'Cliente' (mayúscula), Prisma genera 'cliente' (minúscula)
    const clientes = await prisma.cliente.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return res.status(200).json(clientes);
  } catch (error: any) {
    // Esto nos dirá el fallo exacto si la base de datos rechaza la conexión
    return res.status(500).json({ 
      error: "Fallo de conexión real", 
      details: error.message 
    });
  } finally {
    await prisma.$disconnect();
  }
}