'use client';
import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { authFetch } from '../../../lib/auth-fetch';
import { Upload, Download, CheckCircle, XCircle, AlertTriangle, Loader2, FileSpreadsheet } from 'lucide-react';

interface ImportRow {
  clienteNombre: string;
  category: string;
  platform: string;
  url?: string;
  username: string;
  password: string;
  email?: string;
  notes?: string;
}

interface ImportResult {
  row: number;
  clienteNombre: string;
  platform: string;
  status: 'ok' | 'error';
  error?: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  WEB_CMS: 'Webs / CMS',
  HOSTING: 'Hosting / Dominios',
  EMAIL: 'Cuentas de Email',
  SOCIAL: 'Redes Sociales',
  ANALYTICS: 'Analytics / SEO',
  ADS: 'Publicidad (Ads)',
  OTHER: 'Otros',
};

const TEMPLATE_COLUMNS = ['clienteNombre', 'category', 'platform', 'url', 'username', 'password', 'email', 'notes'];

const EXAMPLE_ROWS = [
  ['Empresa Ejemplo S.L.', 'WEB_CMS', 'WordPress', 'https://empresaejemplo.com/wp-admin', 'admin', 'password123', 'admin@empresaejemplo.com', 'Acceso panel principal'],
  ['Empresa Ejemplo S.L.', 'HOSTING', 'GoDaddy', 'https://godaddy.com', 'usuario@email.com', 'pass456', '', ''],
  ['Otro Cliente', 'SOCIAL', 'Facebook', 'https://business.facebook.com', 'usuario@email.com', 'pass789', '', 'Página principal'],
  ['Otro Cliente', 'ADS', 'Google Ads', 'https://ads.google.com', 'usuario@email.com', 'pass000', '', ''],
];

function downloadTemplate() {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([TEMPLATE_COLUMNS, ...EXAMPLE_ROWS]);
  ws['!cols'] = TEMPLATE_COLUMNS.map((_, i) => ({ wch: i === 3 ? 40 : i === 0 ? 25 : 20 }));
  XLSX.utils.book_append_sheet(wb, ws, 'Credenciales');
  XLSX.writeFile(wb, 'plantilla_credenciales.xlsx');
}

function parseFile(file: File): Promise<ImportRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { defval: '' });
        resolve(
          rows.map((r) => ({
            clienteNombre: r['clienteNombre'] ?? r['Cliente'] ?? r['cliente'] ?? '',
            category: r['category'] ?? r['Categoria'] ?? r['Categoría'] ?? r['categoria'] ?? '',
            platform: r['platform'] ?? r['Plataforma'] ?? r['plataforma'] ?? '',
            url: r['url'] ?? r['URL'] ?? '',
            username: r['username'] ?? r['Usuario'] ?? r['usuario'] ?? '',
            password: r['password'] ?? r['Contraseña'] ?? r['Password'] ?? r['contraseña'] ?? '',
            email: r['email'] ?? r['Email'] ?? '',
            notes: r['notes'] ?? r['Notas'] ?? r['notas'] ?? '',
          }))
        );
      } catch (err) {
        reject(err);
      }
    };
    reader.readAsArrayBuffer(file);
  });
}

export default function ImportarCredencialesPage() {
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [results, setResults] = useState<ImportResult[]>([]);
  const [previewStats, setPreviewStats] = useState<{ ok: number; errors: number } | null>(null);
  const [step, setStep] = useState<'upload' | 'preview' | 'done'>('upload');
  const [loading, setLoading] = useState(false);
  const [importedCount, setImportedCount] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setLoading(true);
    try {
      const parsed = await parseFile(file);
      if (parsed.length === 0) { alert('El archivo no tiene filas de datos.'); return; }
      setRows(parsed);
      await runPreview(parsed);
    } catch {
      alert('Error al leer el archivo. Asegúrate de que es un .xlsx o .csv válido.');
    } finally {
      setLoading(false);
    }
  };

  const runPreview = async (data: ImportRow[]) => {
    setLoading(true);
    const res = await authFetch('/api/import-credentials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'preview', rows: data }),
    });
    const json = await res.json();
    setResults(json.results);
    setPreviewStats({ ok: json.ok, errors: json.errors });
    setStep('preview');
    setLoading(false);
  };

  const handleImport = async () => {
    if (!confirm(`¿Confirmar la importación de ${previewStats?.ok} credenciales? Las filas con error serán omitidas.`)) return;
    setLoading(true);
    const res = await authFetch('/api/import-credentials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'import', rows }),
    });
    const json = await res.json();
    setImportedCount(json.imported);
    setStep('done');
    setLoading(false);
  };

  const reset = () => {
    setRows([]); setResults([]); setPreviewStats(null); setStep('upload'); setImportedCount(0);
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Importación masiva de credenciales</h1>
        <p className="text-sm text-gray-500 mt-1">Sube un Excel o CSV con las credenciales de tus clientes. El sistema validará todos los datos antes de crear ningún registro.</p>
      </div>

      {/* Steps indicator */}
      <div className="flex items-center gap-2 text-sm">
        {(['upload', 'preview', 'done'] as const).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === s ? 'bg-blue-600 text-white' : step === 'done' || (step === 'preview' && i === 0) ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}>{i + 1}</div>
            <span className={step === s ? 'font-medium text-gray-900' : 'text-gray-400'}>{['Subir archivo', 'Revisar datos', 'Importado'][i]}</span>
            {i < 2 && <div className="w-8 h-px bg-gray-200" />}
          </div>
        ))}
      </div>

      {/* STEP 1: Upload */}
      {step === 'upload' && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
            <h2 className="font-semibold text-blue-800 flex items-center gap-2"><FileSpreadsheet size={16} /> Formato requerido</h2>
            <p className="text-sm text-blue-700">El archivo debe tener estas columnas (en cualquier orden):</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                { col: 'clienteNombre', req: true, desc: 'Nombre exacto del cliente' },
                { col: 'category', req: true, desc: 'WEB_CMS, HOSTING, EMAIL, SOCIAL, ANALYTICS, ADS, OTHER' },
                { col: 'platform', req: true, desc: 'Ej: WordPress, GoDaddy…' },
                { col: 'username', req: true, desc: 'Usuario o email de acceso' },
                { col: 'password', req: true, desc: 'Contraseña' },
                { col: 'url', req: false, desc: 'URL de acceso' },
                { col: 'email', req: false, desc: 'Email asociado' },
                { col: 'notes', req: false, desc: 'Notas adicionales' },
              ].map(({ col, req, desc }) => (
                <div key={col} className="bg-white rounded-lg p-2 border border-blue-100">
                  <div className="flex items-center gap-1">
                    <code className="text-xs font-bold text-blue-700">{col}</code>
                    {req && <span className="text-red-500 text-xs">*</span>}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                </div>
              ))}
            </div>
            <button onClick={downloadTemplate} className="flex items-center gap-2 text-sm text-blue-700 hover:text-blue-900 font-medium">
              <Download size={14} /> Descargar plantilla de ejemplo (.xlsx)
            </button>
          </div>

          <div
            className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-blue-400 transition-colors cursor-pointer"
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
          >
            {loading ? (
              <Loader2 className="mx-auto animate-spin text-blue-500" size={32} />
            ) : (
              <>
                <Upload className="mx-auto text-gray-400 mb-3" size={32} />
                <p className="font-medium text-gray-700">Arrastra tu archivo aquí o haz clic para seleccionar</p>
                <p className="text-sm text-gray-400 mt-1">Formatos: .xlsx, .xls, .csv</p>
              </>
            )}
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
          </div>
        </div>
      )}

      {/* STEP 2: Preview */}
      {step === 'preview' && previewStats && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-gray-900">{rows.length}</div>
              <div className="text-sm text-gray-500">Filas totales</div>
            </div>
            <div className="bg-green-50 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-green-700">{previewStats.ok}</div>
              <div className="text-sm text-green-600">Válidas — listas para importar</div>
            </div>
            <div className="bg-red-50 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-red-700">{previewStats.errors}</div>
              <div className="text-sm text-red-600">Con errores — serán omitidas</div>
            </div>
          </div>

          {previewStats.errors > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
              <AlertTriangle size={16} className="text-amber-600 mt-0.5 shrink-0" />
              <p className="text-sm text-amber-800">Las filas con error <strong>no se importarán</strong>. Corrígelas en tu Excel y vuelve a subir el archivo si quieres incluirlas.</p>
            </div>
          )}

          <div className="overflow-auto rounded-xl border border-gray-200">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                <tr>
                  <th className="px-3 py-2 text-left">#</th>
                  <th className="px-3 py-2 text-left">Estado</th>
                  <th className="px-3 py-2 text-left">Cliente</th>
                  <th className="px-3 py-2 text-left">Categoría</th>
                  <th className="px-3 py-2 text-left">Plataforma</th>
                  <th className="px-3 py-2 text-left">Usuario</th>
                  <th className="px-3 py-2 text-left">Error</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {results.map((r, i) => (
                  <tr key={i} className={r.status === 'error' ? 'bg-red-50' : ''}>
                    <td className="px-3 py-2 text-gray-400">{r.row}</td>
                    <td className="px-3 py-2">
                      {r.status === 'ok'
                        ? <CheckCircle size={16} className="text-green-500" />
                        : <XCircle size={16} className="text-red-500" />}
                    </td>
                    <td className="px-3 py-2 font-medium text-gray-900">{r.clienteNombre}</td>
                    <td className="px-3 py-2 text-gray-500">{CATEGORY_LABELS[rows[i]?.category?.toUpperCase()] ?? rows[i]?.category}</td>
                    <td className="px-3 py-2 text-gray-700">{r.platform}</td>
                    <td className="px-3 py-2 text-gray-500 font-mono text-xs">{rows[i]?.username}</td>
                    <td className="px-3 py-2 text-red-600 text-xs">{r.error ?? ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={reset} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
              Cancelar y subir otro archivo
            </button>
            <button
              onClick={handleImport}
              disabled={previewStats.ok === 0 || loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-40 flex items-center gap-2"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              Importar {previewStats.ok} credencial{previewStats.ok !== 1 ? 'es' : ''}
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Done */}
      {step === 'done' && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center space-y-4">
          <CheckCircle className="mx-auto text-green-500" size={48} />
          <div>
            <h2 className="text-xl font-bold text-green-800">¡Importación completada!</h2>
            <p className="text-green-700 mt-1">Se crearon <strong>{importedCount}</strong> credenciales correctamente.</p>
            {previewStats && previewStats.errors > 0 && (
              <p className="text-amber-600 text-sm mt-1">{previewStats.errors} filas fueron omitidas por errores.</p>
            )}
          </div>
          <div className="flex gap-3 justify-center">
            <button onClick={reset} className="px-5 py-2 border border-green-400 text-green-800 rounded-lg text-sm hover:bg-green-100">
              Importar otro archivo
            </button>
            <a href="/clientes" className="px-5 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">
              Ver clientes
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
