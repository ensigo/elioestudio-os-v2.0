import { prisma } from '../lib/prisma';

export default async function handler(req: any, res: any) {
  try {
    const clientes = await prisma.cliente.findMany();
    return res.status(200).json(clientes);
  } catch (error: any) {
    // Esto forzará a que el error aparezca sí o sí en el mensaje
    return res.status(500).json({ 
      error: "Fallo de conexión", 
      details: error.message || "Error desconocido" 
    });
  }
}