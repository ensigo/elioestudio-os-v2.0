import type { VercelRequest, VercelResponse } from '@vercel/node';

export function requireAuth(req: VercelRequest, res: VercelResponse): string | null {
  const userId = req.headers['x-user-id'] as string | undefined;
  if (!userId) {
    res.status(401).json({ error: 'No autenticado' });
    return null;
  }
  return userId;
}
