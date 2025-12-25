import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: any, res: any) {
  try {
    const clientes = await prisma.cliente.findMany();
    return res.status(200).json(clientes);
  } catch (error: any) {
    return res.status(500).json({ error: "Error en la API", details: error.message });
  } finally {
    await prisma.$disconnect();
  }
}