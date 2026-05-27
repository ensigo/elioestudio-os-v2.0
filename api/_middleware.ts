export function requireAuth(req: any, res: any): string | null {
  const userId = req.headers?.['x-user-id'] as string | undefined;
  if (!userId) {
    res.status(401).json({ error: 'No autenticado' });
    return null;
  }
  return userId;
}

export async function getUserRole(prisma: any, userId: string): Promise<string | null> {
  const user = await prisma.usuario.findUnique({ where: { id: userId }, select: { role: true } });
  return user?.role ?? null;
}

export function isAdminRole(role: string | null): boolean {
  return role === 'ADMIN' || role === 'SUPERADMIN';
}
