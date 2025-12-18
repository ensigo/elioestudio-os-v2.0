// api/clientes.ts (Este código SÍ se puede conectar a la BD en Vercel)
import { prisma } from '../../lib/prisma';

// Esta función se ejecuta cuando el navegador pide datos a /api/clientes
export default async function handler(req: any, res: any) {
  try {
    // 1. Buscamos todos los clientes en la base de datos de Neon
    // OJO: Asegúrate que tu modelo en schema.prisma se llama 'Cliente' (singular)
    // o cámbialo a 'User' si es el caso.
    const clientes = await prisma.cliente.findMany();

    // 2. Devolvemos los clientes al navegador
    res.status(200).json(clientes);
  } catch (error) {
    console.error("Error al obtener clientes:", error);
    res.status(500).json({ error: "No se pudo conectar a la base de datos." });
  }
}