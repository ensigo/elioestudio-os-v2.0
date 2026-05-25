import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export default async function handler(req: any, res: any) {
  try {
    // GET - Obtener todos los usuarios
    if (req.method === 'GET') {
      const usuarios = await prisma.usuario.findMany({
        orderBy: { createdAt: 'desc' }
      });
      return res.status(200).json(usuarios);
    }

    // POST - Crear un nuevo usuario
    if (req.method === 'POST') {
      const { name, email, role, position, avatarUrl, tipoContrato } = req.body;
      
      if (!name || !email) {
        return res.status(400).json({ error: 'Nombre y email son obligatorios' });
      }

      const nuevoUsuario = await prisma.usuario.create({
        data: {
          name,
          email,
          role: role || 'DEV',
          position: position || null,
          avatarUrl: avatarUrl || null,
          tipoContrato: tipoContrato || 'COMPLETA',
          joinDate: new Date()
        }
      });

      return res.status(201).json(nuevoUsuario);
    }

    // PUT - Actualizar usuario
    if (req.method === 'PUT') {
      const { 
        id, 
        name, 
        email, 
        role, 
        position, 
        avatarUrl,
        tipoContrato,
        // Datos personales
        dni,
        fechaNacimiento,
        telefono,
        telefonoEmergencia,
        direccion,
        ciudad,
        codigoPostal,
        // Datos bancarios
        iban,
        titularCuenta,
        // Seguridad social
        numSeguridadSocial,
        tipoContratacion,
        fechaAltaSS
      } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'ID es obligatorio' });
      }

      const dataToUpdate: any = {};
      
      // Datos básicos
      if (name !== undefined) dataToUpdate.name = name;
      if (email !== undefined) dataToUpdate.email = email;
      if (role !== undefined) dataToUpdate.role = role;
      if (position !== undefined) dataToUpdate.position = position;
      if (avatarUrl !== undefined) dataToUpdate.avatarUrl = avatarUrl;
      if (tipoContrato !== undefined) dataToUpdate.tipoContrato = tipoContrato;
      
      // Datos personales
      if (dni !== undefined) dataToUpdate.dni = dni || null;
      if (fechaNacimiento !== undefined) dataToUpdate.fechaNacimiento = fechaNacimiento ? new Date(fechaNacimiento) : null;
      if (telefono !== undefined) dataToUpdate.telefono = telefono || null;
      if (telefonoEmergencia !== undefined) dataToUpdate.telefonoEmergencia = telefonoEmergencia || null;
      if (direccion !== undefined) dataToUpdate.direccion = direccion || null;
      if (ciudad !== undefined) dataToUpdate.ciudad = ciudad || null;
      if (codigoPostal !== undefined) dataToUpdate.codigoPostal = codigoPostal || null;
      
      // Datos bancarios
      if (iban !== undefined) dataToUpdate.iban = iban || null;
      if (titularCuenta !== undefined) dataToUpdate.titularCuenta = titularCuenta || null;
      
      // Seguridad social
      if (numSeguridadSocial !== undefined) dataToUpdate.numSeguridadSocial = numSeguridadSocial || null;
      if (tipoContratacion !== undefined) dataToUpdate.tipoContratacion = tipoContratacion || null;
      if (fechaAltaSS !== undefined) dataToUpdate.fechaAltaSS = fechaAltaSS ? new Date(fechaAltaSS) : null;

      const usuarioActualizado = await prisma.usuario.update({
        where: { id },
        data: dataToUpdate
      });

      return res.status(200).json(usuarioActualizado);
    }

    // DELETE - Eliminar usuario
    if (req.method === 'DELETE') {
      const { id } = req.body;
      
      if (!id) {
        return res.status(400).json({ error: 'ID es obligatorio' });
      }

      await prisma.usuario.delete({
        where: { id }
      });

      return res.status(200).json({ message: 'Usuario eliminado' });
    }

    return res.status(405).json({ error: 'Método no permitido' });

  } catch (error: any) {
    console.error('Error en API usuarios:', error);
    return res.status(500).json({ error: 'Error en la API', details: error.message });
  } finally {
    await prisma.$disconnect();
  }
}