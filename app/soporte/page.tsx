'use client';
import React, { useState, useEffect } from 'react';
import { Search, FileText, Download, Upload, Trash2, FolderOpen, File, X, Eye } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../context/AuthContext';

interface Documento {
  id: string;
  nombre: string;
  descripcion: string | null;
  familia: string;
  subfamilia: string | null;
  archivoUrl: string | null;
  archivoNombre: string | null;
  tamano: number | null;
  tipo: string | null;
  creadoPorNombre: string | null;
  createdAt: string;
}

const FAMILIAS = [
  { id: 'DISENO', nombre: 'Diseño', color: 'bg-pink-100 text-pink-700' },
  { id: 'SEO', nombre: 'SEO', color: 'bg-green-100 text-green-700' },
  { id: 'RRHH', nombre: 'RRHH', color: 'bg-blue-100 text-blue-700' },
  { id: 'ADMINISTRACION', nombre: 'Administración', color: 'bg-orange-100 text-orange-700' },
  { id: 'DESARROLLO', nombre: 'Desarrollo', color: 'bg-purple-100 text-purple-700' },
  { id: 'LEGAL', nombre: 'Legal', color: 'bg-slate-100 text-slate-700' },
  { id: 'MARKETING', nombre: 'Marketing', color: 'bg-yellow-100 text-yellow-700' }
];

const SUBFAMILIAS: Record<string, string[]> = {
  DISENO: ['Branding', 'UI/UX', 'Plantillas', 'Recursos'],
  SEO: ['On-page', 'Off-page', 'Técnico', 'Auditorías'],
  RRHH: ['Procesos', 'Onboarding', 'Políticas', 'Formación'],
  ADMINISTRACION: ['Finanzas', 'Contratos', 'Facturas', 'Presupuestos'],
  DESARROLLO: ['Frontend', 'Backend', 'Documentación', 'Guías'],
  LEGAL: ['RGPD', 'Contratos', 'Políticas', 'Licencias'],
  MARKETING: ['Social Media', 'Email', 'Contenidos', 'Estrategia']
};

export default function SoportePage() {
  const { usuario } = useAuth();
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterFamilia, setFilterFamilia] = useState('todas');
  const [showModal, setShowModal] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<Documento | null>(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/dashboard?tipo=documentos');
      if (res.ok) setDocumentos(await res.json());
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este documento?')) return;
    await fetch('/api/dashboard?tipo=documentos', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    fetchData();
  };

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  const formatSize = (bytes: number | null) => {
    if (!bytes) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFamiliaStyle = (fam: string) => FAMILIAS.find(f => f.id === fam)?.color || 'bg-slate-100 text-slate-700';
  const getFamiliaNombre = (fam: string) => FAMILIAS.find(f => f.id === fam)?.nombre || fam;

  const getFileIcon = (tipo: string | null) => {
    if (!tipo) return <File size={20} className="text-slate-400" />;
    if (tipo.includes('pdf')) return <FileText size={20} className="text-red-500" />;
    if (tipo.includes('doc')) return <FileText size={20} className="text-blue-500" />;
    if (tipo.includes('xls')) return <FileText size={20} className="text-green-500" />;
    return <File size={20} className="text-slate-400" />;
  };

  const filteredDocs = documentos.filter(d => {
    const matchSearch = d.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (d.descripcion?.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchFamilia = filterFamilia === 'todas' || d.familia === filterFamilia;
    return matchSearch && matchFamilia;
  });

  // Agrupar por familia
  const docsPorFamilia = FAMILIAS.map(f => ({
    ...f,
    docs: filteredDocs.filter(d => d.familia === f.id)
  })).filter(f => f.docs.length > 0);

  if (loading) {
    return <div className="flex justify-center items-center h-96"><p className="text-xl text-blue-500 animate-pulse">Cargando documentos...</p></div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FolderOpen className="text-yellow-500" /> Centro de Documentación
          </h1>
          <p className="text-gray-500 text-sm">Guías, plantillas y recursos del equipo</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700">
          <Upload size={18} /> Subir Documento
        </button>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {FAMILIAS.map(f => {
          const count = documentos.filter(d => d.familia === f.id).length;
          return (
            <button
              key={f.id}
              onClick={() => setFilterFamilia(filterFamilia === f.id ? 'todas' : f.id)}
              className={`p-3 rounded-lg border text-left transition-all ${filterFamilia === f.id ? 'ring-2 ring-blue-500 border-blue-500' : 'border-slate-200 hover:border-slate-300'}`}
            >
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${f.color}`}>{f.nombre}</span>
              <p className="text-2xl font-bold text-slate-900 mt-1">{count}</p>
            </button>
          );
        })}
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[250px]">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar documento..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm" 
          />
        </div>
        {filterFamilia !== 'todas' && (
          <button onClick={() => setFilterFamilia('todas')} className="px-3 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm flex items-center gap-1">
            <X size={14} /> Limpiar filtro
          </button>
        )}
      </div>

      {/* Lista de Documentos */}
      {filteredDocs.length === 0 ? (
        <Card>
          <div className="text-center py-12 text-slate-400">
            <FolderOpen size={48} className="mx-auto mb-4 opacity-30" />
            <p className="text-lg">No hay documentos</p>
            <p className="text-sm">Sube el primer documento para empezar</p>
          </div>
        </Card>
      ) : filterFamilia === 'todas' ? (
        // Vista agrupada por familia
        <div className="space-y-6">
          {docsPorFamilia.map(familia => (
            <Card key={familia.id} title={`${familia.nombre} (${familia.docs.length})`}>
              <div className="divide-y">
                {familia.docs.map(doc => (
                  <DocumentoRow key={doc.id} doc={doc} onDelete={handleDelete} onView={setSelectedDoc} formatDate={formatDate} formatSize={formatSize} getFileIcon={getFileIcon} />
                ))}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        // Vista lista simple
        <Card>
          <div className="divide-y">
            {filteredDocs.map(doc => (
              <DocumentoRow key={doc.id} doc={doc} onDelete={handleDelete} onView={setSelectedDoc} formatDate={formatDate} formatSize={formatSize} getFileIcon={getFileIcon} />
            ))}
          </div>
        </Card>
      )}

      {/* Modal Subir */}
      {showModal && (
        <ModalSubir 
          usuario={usuario}
          onClose={() => setShowModal(false)} 
          onSave={() => { fetchData(); setShowModal(false); }} 
        />
      )}

      {/* Modal Ver Detalle */}
      {selectedDoc && (
        <ModalDetalle doc={selectedDoc} onClose={() => setSelectedDoc(null)} />
      )}
    </div>
  );
}

// Componente fila de documento
function DocumentoRow({ doc, onDelete, onView, formatDate, formatSize, getFileIcon }: {
  doc: Documento;
  onDelete: (id: string) => void;
  onView: (doc: Documento) => void;
  formatDate: (d: string) => string;
  formatSize: (b: number | null) => string;
  getFileIcon: (t: string | null) => JSX.Element;
}) {
  return (
    <div className="flex items-center justify-between py-3 px-2 hover:bg-slate-50 rounded-lg group">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {getFileIcon(doc.tipo)}
        <div className="min-w-0">
          <p className="font-medium text-slate-900 truncate">{doc.nombre}</p>
          <p className="text-xs text-slate-500">
            {doc.subfamilia && <span className="mr-2">{doc.subfamilia}</span>}
            <span>{formatDate(doc.createdAt)}</span>
            {doc.tamano && <span className="ml-2">{formatSize(doc.tamano)}</span>}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => onView(doc)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
          <Eye size={16} />
        </button>
        {doc.archivoUrl && (
          <a href={doc.archivoUrl} target="_blank" rel="noopener noreferrer" className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg">
            <Download size={16} />
          </a>
        )}
        <button onClick={() => onDelete(doc.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}

// Modal Subir Documento
function ModalSubir({ usuario, onClose, onSave }: { usuario: any; onClose: () => void; onSave: () => void }) {
  const [form, setForm] = useState({
    nombre: '',
    descripcion: '',
    familia: 'DISENO',
    subfamilia: '',
    archivoUrl: '',
    tipo: ''
  });
  const [saving, setSaving] = useState(false);

  const subfamilias = SUBFAMILIAS[form.familia] || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    // Detectar tipo de archivo de la URL
    let tipo = form.tipo;
    if (form.archivoUrl) {
      const ext = form.archivoUrl.split('.').pop()?.toLowerCase();
      if (ext) tipo = ext;
    }

    await fetch('/api/dashboard?tipo=documentos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        tipo,
        archivoNombre: form.nombre,
        creadoPorId: usuario?.id,
        creadoPorNombre: usuario?.name
      })
    });
    setSaving(false);
    onSave();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold">Subir Documento</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nombre del Documento *</label>
            <input 
              type="text" 
              value={form.nombre} 
              onChange={e => setForm({ ...form, nombre: e.target.value })} 
              className="w-full px-3 py-2 border rounded-lg" 
              placeholder="Ej: Guía de Estilo 2024"
              required 
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Descripción</label>
            <textarea 
              value={form.descripcion} 
              onChange={e => setForm({ ...form, descripcion: e.target.value })} 
              className="w-full px-3 py-2 border rounded-lg" 
              rows={2}
              placeholder="Breve descripción del documento"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Familia *</label>
              <select 
                value={form.familia} 
                onChange={e => setForm({ ...form, familia: e.target.value, subfamilia: '' })} 
                className="w-full px-3 py-2 border rounded-lg"
              >
                {FAMILIAS.map(f => <option key={f.id} value={f.id}>{f.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Subfamilia</label>
              <select 
                value={form.subfamilia} 
                onChange={e => setForm({ ...form, subfamilia: e.target.value })} 
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="">Sin subfamilia</option>
                {subfamilias.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">URL del Archivo</label>
            <input 
              type="url" 
              value={form.archivoUrl} 
              onChange={e => setForm({ ...form, archivoUrl: e.target.value })} 
              className="w-full px-3 py-2 border rounded-lg" 
              placeholder="https://drive.google.com/... o URL directa"
            />
            <p className="text-xs text-slate-400 mt-1">Pega el enlace de Google Drive, Dropbox o cualquier URL</p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
            <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Modal Detalle
function ModalDetalle({ doc, onClose }: { doc: Documento; onClose: () => void }) {
  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
  const getFamiliaNombre = (fam: string) => FAMILIAS.find(f => f.id === fam)?.nombre || fam;
  const getFamiliaStyle = (fam: string) => FAMILIAS.find(f => f.id === fam)?.color || 'bg-slate-100 text-slate-700';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="p-6 border-b flex justify-between items-start">
          <div>
            <span className={`px-2 py-1 rounded text-xs font-medium ${getFamiliaStyle(doc.familia)}`}>{getFamiliaNombre(doc.familia)}</span>
            {doc.subfamilia && <span className="ml-2 text-xs text-slate-500">{doc.subfamilia}</span>}
            <h2 className="text-xl font-bold text-slate-900 mt-2">{doc.nombre}</h2>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>
        <div className="p-6 space-y-4">
          {doc.descripcion && (
            <div>
              <p className="text-sm font-medium text-slate-500">Descripción</p>
              <p className="text-slate-700">{doc.descripcion}</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-500">Fecha de subida</p>
              <p className="font-medium">{formatDate(doc.createdAt)}</p>
            </div>
            {doc.creadoPorNombre && (
          <div>
                <p className="text-slate-500">Subido por</p>
                <p className="font-medium">{doc.creadoPorNombre}</p>
              </div>
            )}
          </div>
          {doc.archivoUrl && (
            <a 
              href={doc.archivoUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Download size={18} /> Descargar / Abrir Archivo
            </a>
          )}
        </div>
      </div>
    </div>
  );
}