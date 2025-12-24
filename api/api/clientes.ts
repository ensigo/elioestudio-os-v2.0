import { prisma } from '../../lib/prisma';

/**
 * Handler para la API de clientes.
 * Este archivo debe estar en: /api/api/clientes.ts
 */
export default async function handler(req: any, res: any) {
  // Solo permitimos el método GET para obtener datos
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    // 1. Buscamos todos los clientes en la tabla 'clientes' usando el modelo 'Cliente'
    const clientes = await prisma.cliente.findMany({
      orderBy: {
        createdAt: 'desc', // Los más nuevos primero
      },
    });

    // 2. Devolvemos la lista de clientes al frontend
    return res.status(200).json(clientes);
  } catch (error: any) {
    // Log detallado del error para ver en Vercel
    console.error("Error detallado en la base de datos:", error.message);
    
    return res.status(500).json({ 
      error: "Error al conectar con la base de datos",
      details: error.message 
    });
  }
}