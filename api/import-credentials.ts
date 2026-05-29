import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function requireAdmin(req: any, res: any): string | null {
  const userId = req.headers?.['x-user-id'] as string | undefined;
  if (!userId) { res.status(401).json({ error: 'No autenticado' }); return null; }
  return userId;
}

export interface ImportRow {
  clienteNombre: string;
  category: string;
  platform: string;
  url?: string;
  username: string;
  password: string;
  email?: string;
  notes?: string;
}

export interface ImportResult {
  row: number;
  clienteNombre: string;
  platform: string;
  status: 'ok' | 'error';
  error?: string;
  clienteId?: string;
}

export default async function handler(req: any, res: any) {
  const userId = requireAdmin(req, res);
  if (!userId) return;

  if (req.method === 'POST') {
    const { action, rows } = req.body as { action: 'preview' | 'import'; rows: ImportRow[] };

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ error: 'No hay filas para procesar' });
    }

    // Get all clients for name matching
    const clientes = await prisma.cliente.findMany({
      select: { id: true, name: true, nombreComercial: true },
    });

    const findCliente = (nombre: string) => {
      const norm = (s: string) => s?.toLowerCase().trim() ?? '';
      const n = norm(nombre);
      return clientes.find(
        (c) => norm(c.name) === n || norm(c.nombreComercial ?? '') === n
      );
    };

    const VALID_CATEGORIES = [
      'WEB_CMS', 'HOSTING', 'DOMAIN', 'EMAIL', 'SOCIAL', 'ADS',
      'ANALYTICS', 'DESIGN', 'SEO', 'OTHER',
    ];

    const results: ImportResult[] = rows.map((row, i) => {
      const rowNum = i + 1;
      if (!row.clienteNombre?.trim())
        return { row: rowNum, clienteNombre: row.clienteNombre, platform: row.platform, status: 'error', error: 'Nombre de cliente vacío' };
      if (!row.platform?.trim())
        return { row: rowNum, clienteNombre: row.clienteNombre, platform: row.platform, status: 'error', error: 'Plataforma vacía' };
      if (!row.username?.trim())
        return { row: rowNum, clienteNombre: row.clienteNombre, platform: row.platform, status: 'error', error: 'Usuario vacío' };
      if (!row.password?.trim())
        return { row: rowNum, clienteNombre: row.clienteNombre, platform: row.platform, status: 'error', error: 'Contraseña vacía' };

      const cat = row.category?.trim().toUpperCase();
      if (!VALID_CATEGORIES.includes(cat))
        return { row: rowNum, clienteNombre: row.clienteNombre, platform: row.platform, status: 'error', error: `Categoría inválida: "${row.category}". Válidas: ${VALID_CATEGORIES.join(', ')}` };

      const cliente = findCliente(row.clienteNombre);
      if (!cliente)
        return { row: rowNum, clienteNombre: row.clienteNombre, platform: row.platform, status: 'error', error: `Cliente no encontrado: "${row.clienteNombre}"` };

      return { row: rowNum, clienteNombre: row.clienteNombre, platform: row.platform, status: 'ok', clienteId: cliente.id };
    });

    if (action === 'preview') {
      return res.status(200).json({ results, total: rows.length, ok: results.filter(r => r.status === 'ok').length, errors: results.filter(r => r.status === 'error').length });
    }

    if (action === 'import') {
      const validRows = rows.filter((_, i) => results[i].status === 'ok');
      const validResults = results.filter(r => r.status === 'ok');

      if (validRows.length === 0) {
        return res.status(400).json({ error: 'No hay filas válidas para importar' });
      }

      await prisma.$transaction(
        validRows.map((row, i) =>
          prisma.credential.create({
            data: {
              clienteId: validResults[i].clienteId!,
              category: row.category.trim().toUpperCase(),
              platform: row.platform.trim(),
              url: row.url?.trim() || null,
              username: row.username.trim(),
              passwordEncrypted: row.password.trim(),
              email: row.email?.trim() || null,
              isEmailAccount: false,
              notes: row.notes?.trim() || null,
              isActive: true,
              createdById: userId,
              createdByName: 'Importación masiva',
              lastModifiedById: userId,
              lastModifiedByName: 'Importación masiva',
            },
          })
        )
      );

      return res.status(200).json({ imported: validRows.length, skipped: results.filter(r => r.status === 'error').length });
    }

    return res.status(400).json({ error: 'action debe ser "preview" o "import"' });
  }

  return res.status(405).json({ error: 'Método no permitido' });
}
