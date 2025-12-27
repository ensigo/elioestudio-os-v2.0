import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: any, res: any) {
  const { tipo, id } = req.query; // tipo = 'categorias' o 'plantillas'

  try {
    // ============================================
    // CATEGORÍAS: /api/catalogo?tipo=categorias
    // ============================================
    if (tipo === 'categorias') {
      
      // GET - Obtener categorías
      if (req.method === 'GET') {
        if (id) {
          const categoria = await prisma.categoriaServicio.findUnique({
            where: { id: id as string },
            include: { plantillas: { where: { activo: true }, orderBy: { orden: 'asc' } } }
          });
          return res.status(200).json(categoria);
        }
        
        const categorias = await prisma.categoriaServicio.findMany({
          where: { activo: true },
          orderBy: { orden: 'asc' },
          include: {
            plantillas: {
              where: { activo: true },
              orderBy: { orden: 'asc' }
            }
          }
        });
        return res.status(200).json(categorias);
      }

      // POST - Crear categoría
      if (req.method === 'POST') {
        const { codigo, nombre, descripcion, color, icono, orden } = req.body;
        const categoria = await prisma.categoriaServicio.create({
          data: { codigo, nombre, descripcion, color, icono, orden: orden || 0 }
        });
        return res.status(201).json(categoria);
      }

      // PATCH - Actualizar categoría
      if (req.method === 'PATCH') {
        if (!id) return res.status(400).json({ error: 'ID requerido' });
        const { nombre, descripcion, color, icono, orden, activo } = req.body;
        const categoria = await prisma.categoriaServicio.update({
          where: { id: id as string },
          data: { nombre, descripcion, color, icono, orden, activo }
        });
        return res.status(200).json(categoria);
      }

      // DELETE - Desactivar categoría
      if (req.method === 'DELETE') {
        if (!id) return res.status(400).json({ error: 'ID requerido' });
        const categoria = await prisma.categoriaServicio.update({
          where: { id: id as string },
          data: { activo: false }
        });
        return res.status(200).json(categoria);
      }
    }

    // ============================================
    // PLANTILLAS: /api/catalogo?tipo=plantillas
    // ============================================
    if (tipo === 'plantillas') {
      
      // GET - Obtener plantillas
      if (req.method === 'GET') {
        if (id) {
          const plantilla = await prisma.plantillaTarea.findUnique({
            where: { id: id as string },
            include: { categoria: true }
          });
          return res.status(200).json(plantilla);
        }
        
        const { categoriaId } = req.query;
        const where: any = { activo: true };
        if (categoriaId) where.categoriaId = categoriaId;
        
        const plantillas = await prisma.plantillaTarea.findMany({
          where,
          orderBy: [{ categoria: { orden: 'asc' } }, { codigo: 'asc' }],
          include: { categoria: true }
        });
        return res.status(200).json(plantillas);
      }

      // POST - Crear plantilla
      if (req.method === 'POST') {
        const { codigo, nombre, descripcion, categoriaId, rolSugeridoTipo, tiempoEstimado, esRecurrente, frecuencia } = req.body;
        const plantilla = await prisma.plantillaTarea.create({
          data: { 
            codigo, 
            nombre, 
            descripcion, 
            categoriaId, 
            rolSugeridoTipo, 
            tiempoEstimado: tiempoEstimado || 1, 
            esRecurrente: esRecurrente || false, 
            frecuencia 
          },
          include: { categoria: true }
        });
        return res.status(201).json(plantilla);
      }

      // PATCH - Actualizar plantilla
      if (req.method === 'PATCH') {
        if (!id) return res.status(400).json({ error: 'ID requerido' });
        const { nombre, descripcion, categoriaId, rolSugeridoTipo, tiempoEstimado, esRecurrente, frecuencia, activo, orden } = req.body;
        const plantilla = await prisma.plantillaTarea.update({
          where: { id: id as string },
          data: { nombre, descripcion, categoriaId, rolSugeridoTipo, tiempoEstimado, esRecurrente, frecuencia, activo, orden },
          include: { categoria: true }
        });
        return res.status(200).json(plantilla);
      }

      // DELETE - Desactivar plantilla
      if (req.method === 'DELETE') {
        if (!id) return res.status(400).json({ error: 'ID requerido' });
        const plantilla = await prisma.plantillaTarea.update({
          where: { id: id as string },
          data: { activo: false }
        });
        return res.status(200).json(plantilla);
      }
    }

    // Si no se especifica tipo válido
    return res.status(400).json({ error: 'Parámetro tipo requerido: categorias o plantillas' });

  } catch (error) {
    console.error('Error en API catálogo:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}