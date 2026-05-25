import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from './prisma';

export async function requireAuth(req: VercelRequest, res: VercelResponse): Promise<string | null> {
  const userId = req.headers['x-user-id'] as string | undefined;

  if (!userId) {
    res.status(401).json({ error: 'No autenticado' });
    return null;
  }

  const usuario = await prisma.usuario.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  if (!usuario) {
    res.status(401).json({ error: 'Sesión inválida' });
    return null;
  }

  return userId;
}
