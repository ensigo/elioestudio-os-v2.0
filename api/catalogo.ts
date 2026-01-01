import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: any, res: any) {
  const { tipo, id, categoriaId } = req.query;

  try {
    // ============================================
    // CATEGORÍAS: /api/catalogo?tipo=categorias
    // ============================================
    if (tipo === 'categorias') {
      
      if (req.method === 'GET') {
        if (id) {
          const categoria = await prisma.categorias_servicio.findUnique({
            where: { id: id as string },
            include: { plantillas_tarea: { where: { activo: true }, orderBy: { orden: 'asc' } } }
          });
          return res.status(200).json(categoria);
        }
        
        const categorias = await prisma.categorias_servicio.findMany({
          where: { activo: true },
          orderBy: { orden: 'asc' },
          include: {
            plantillas_tarea: {
              where: { activo: true },
              orderBy: { codigo: 'asc' }
            }
          }
        });
        return res.status(200).json(categorias);
      }

      if (req.method === 'POST') {
        const { codigo, nombre, descripcion, color, icono, orden } = req.body;
        const categoria = await prisma.categorias_servicio.create({
          data: { 
            id: require('crypto').randomUUID(),
            codigo, nombre, descripcion, color, icono, orden: orden || 0,
            updatedAt: new Date()
          }
        });
        return res.status(201).json(categoria);
      }

      if (req.method === 'PATCH') {
        if (!id) return res.status(400).json({ error: 'ID requerido' });
        const { nombre, descripcion, color, icono, orden, activo } = req.body;
        const categoria = await prisma.categorias_servicio.update({
          where: { id: id as string },
          data: { nombre, descripcion, color, icono, orden, activo, updatedAt: new Date() }
        });
        return res.status(200).json(categoria);
      }

      if (req.method === 'DELETE') {
        if (!id) return res.status(400).json({ error: 'ID requerido' });
        const categoria = await prisma.categorias_servicio.update({
          where: { id: id as string },
          data: { activo: false, updatedAt: new Date() }
        });
        return res.status(200).json(categoria);
      }
    }

    // ============================================
    // PLANTILLAS: /api/catalogo?tipo=plantillas
    // ============================================
    if (tipo === 'plantillas') {
      
      if (req.method === 'GET') {
        if (id) {
          const plantilla = await prisma.plantillas_tarea.findUnique({
            where: { id: id as string },
            include: { categoria: true }
          });
          return res.status(200).json(plantilla);
        }
        
        const where: any = { activo: true };
        if (categoriaId) where.categoriaId = categoriaId;
        
        const plantillas = await prisma.plantillas_tarea.findMany({
          where,
          orderBy: [{ categoria: { orden: 'asc' } }, { codigo: 'asc' }],
          include: { categoria: true }
        });
        return res.status(200).json(plantillas);
      }

      if (req.method === 'POST') {
        const { codigo, nombre, descripcion, categoriaId, rolSugeridoTipo, tiempoEstimado, esRecurrente, frecuencia } = req.body;
        const plantilla = await prisma.plantillas_tarea.create({
          data: { 
            id: require('crypto').randomUUID(),
            codigo, nombre, descripcion, categoriaId, 
            rolSugeridoTipo, 
            tiempoEstimado: tiempoEstimado || 1, 
            esRecurrente: esRecurrente || false, 
            frecuencia,
            updatedAt: new Date()
          },
          include: { categoria: true }
        });
        return res.status(201).json(plantilla);
      }

      if (req.method === 'PATCH') {
        if (!id) return res.status(400).json({ error: 'ID requerido' });
        const { nombre, descripcion, categoriaId, rolSugeridoTipo, tiempoEstimado, esRecurrente, frecuencia, activo, orden } = req.body;
        const plantilla = await prisma.plantillas_tarea.update({
          where: { id: id as string },
          data: { nombre, descripcion, categoriaId, rolSugeridoTipo, tiempoEstimado, esRecurrente, frecuencia, activo, orden, updatedAt: new Date() },
          include: { categoria: true }
        });
        return res.status(200).json(plantilla);
      }

      if (req.method === 'DELETE') {
        if (!id) return res.status(400).json({ error: 'ID requerido' });
        const plantilla = await prisma.plantillas_tarea.update({
          where: { id: id as string },
          data: { activo: false, updatedAt: new Date() }
        });
        return res.status(200).json(plantilla);
      }
    }

    return res.status(400).json({ error: 'Parámetro tipo requerido: categorias o plantillas' });

  } catch (error) {
    console.error('Error en API catálogo:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}