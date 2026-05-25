import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../lib/api-middleware';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userId = requireAuth(req, res);
  if (!userId) return;

  try {
    if (req.method === 'GET') {
      const usuarios = await prisma.usuario.findMany({ orderBy: { createdAt: 'desc' } });
      return res.status(200).json(usuarios);
    }

    if (req.method === 'POST') {
      const { name, email, role, position, avatarUrl, tipoContrato } = req.body;
      if (!name || !email) return res.status(400).json({ error: 'Nombre y email son obligatorios' });
      const nuevoUsuario = await prisma.usuario.create({
        data: { name, email, role: role || 'DEV', position: position || null, avatarUrl: avatarUrl || null, tipoContrato: tipoContrato || 'COMPLETA', joinDate: new Date() },
      });
      return res.status(201).json(nuevoUsuario);
    }

    if (req.method === 'PUT') {
      const { id, name, email, role, position, avatarUrl, tipoContrato, dni, fechaNacimiento, telefono, telefonoEmergencia, direccion, ciudad, codigoPostal, iban, titularCuenta, numSeguridadSocial, tipoContratacion, fechaAltaSS } = req.body;
      if (!id) return res.status(400).json({ error: 'ID es obligatorio' });

      const dataToUpdate: Record<string, unknown> = {};
      if (name !== undefined) dataToUpdate.name = name;
      if (email !== undefined) dataToUpdate.email = email;
      if (role !== undefined) dataToUpdate.role = role;
      if (position !== undefined) dataToUpdate.position = position;
      if (avatarUrl !== undefined) dataToUpdate.avatarUrl = avatarUrl;
      if (tipoContrato !== undefined) dataToUpdate.tipoContrato = tipoContrato;
      if (dni !== undefined) dataToUpdate.dni = dni || null;
      if (fechaNacimiento !== undefined) dataToUpdate.fechaNacimiento = fechaNacimiento ? new Date(fechaNacimiento) : null;
      if (telefono !== undefined) dataToUpdate.telefono = telefono || null;
      if (telefonoEmergencia !== undefined) dataToUpdate.telefonoEmergencia = telefonoEmergencia || null;
      if (direccion !== undefined) dataToUpdate.direccion = direccion || null;
      if (ciudad !== undefined) dataToUpdate.ciudad = ciudad || null;
      if (codigoPostal !== undefined) dataToUpdate.codigoPostal = codigoPostal || null;
      if (iban !== undefined) dataToUpdate.iban = iban || null;
      if (titularCuenta !== undefined) dataToUpdate.titularCuenta = titularCuenta || null;
      if (numSeguridadSocial !== undefined) dataToUpdate.numSeguridadSocial = numSeguridadSocial || null;
      if (tipoContratacion !== undefined) dataToUpdate.tipoContratacion = tipoContratacion || null;
      if (fechaAltaSS !== undefined) dataToUpdate.fechaAltaSS = fechaAltaSS ? new Date(fechaAltaSS) : null;

      const usuarioActualizado = await prisma.usuario.update({ where: { id }, data: dataToUpdate });
      return res.status(200).json(usuarioActualizado);
    }

    if (req.method === 'DELETE') {
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: 'ID es obligatorio' });
      await prisma.usuario.delete({ where: { id } });
      return res.status(200).json({ message: 'Usuario eliminado' });
    }

    return res.status(405).json({ error: 'Método no permitido' });
  } catch (error) {
    console.error('Error en API usuarios:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}
