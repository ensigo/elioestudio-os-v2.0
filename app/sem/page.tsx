'use client';
import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { 
  Megaphone, Search, Plus, TrendingUp, DollarSign, 
  MousePointer2, Target, BarChart2, Calendar,
  ExternalLink, X, Edit, Trash2, Eye, ChevronDown, ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface Campana {
  id: string;
  clienteId: string;
  proyectoId: string | null;
  nombre: string;
  plataforma: string;
  estado: string;
  fechaInicio: string;
  fechaFin: string | null;
  presupuesto: number;
  objetivo: string | null;
  notas: string | null;
  urlPlataforma: string | null;
  cliente: { id: string; name: string };
  proyecto?: { id: string; title: string } | null;
  gastoTotal?: number;
  reportesDiarios?: ReporteDiario[];
}

interface ReporteDiario {
  id: string;
  campanaId: string;
  fecha: string;
  impresiones: number;
  clics: number;
  ctr: number;
  conversiones: number;
  cpa: number;
  gastoDia: number;
  roas: number;
  notas: string | null;
}

interface Cliente { id: string; name: string; }
interface Proyecto { id: string; title: string; clienteId: string; }

const PLATAFORMAS = [
  { id: 'GOOGLE', nombre: 'Google Ads', color: 'bg-blue-100 text-blue-700' },
  { id: 'META', nombre: 'Meta Ads', color: 'bg-indigo-100 text-indigo-700' },
  { id: 'TIKTOK', nombre: 'TikTok Ads', color: 'bg-pink-100 text-pink-700' },
  { id: 'LINKEDIN', nombre: 'LinkedIn Ads', color: 'bg-sky-100 text-sky-700' }
];

const ESTADOS = [
  { id: 'ACTIVA', nombre: 'Activa', color: 'bg-green-100 text-green-700' },
  { id: 'PAUSADA', nombre: 'Pausada', color: 'bg-yellow-100 text-yellow-700' },
  { id: 'FINALIZADA', nombre: 'Finalizada', color: 'bg-slate-100 text-slate-700' },
  { id: 'PLANIFICADA', nombre: 'Planificada', color: 'bg-purple-100 text-purple-700' }
];

const OBJETIVOS = ['CONVERSIONES', 'TRAFICO', 'RECONOCIMIENTO', 'LEADS', 'VENTAS'];

export default function SEMPage() {
  const { usuario } = useAuth();
  const [campanas, setCampanas] = useState<Campana[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlataforma, setFilterPlataforma] = useState('todas');
  const [filterEstado, setFilterEstado] = useState('todas');
  const [showModal, setShowModal] = useState(false);
  const [showModalReporte, setShowModalReporte] = useState(false);
  const [editingCampana, setEditingCampana] = useState<Campana | null>(null);
  const [selectedCampana, setSelectedCampana] = useState<Campana | null>(null);
  const [reportes, setReportes] = useState<ReporteDiario[]>([]);

  const isAdmin = usuario?.role === 'ADMIN' || usuario?.role === 'SUPERADMIN';

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [campRes, cliRes, proyRes] = await Promise.all([
        fetch('/api/dashboard?tipo=sem-campanas'),
        fetch('/api/clientes'),
        fetch('/api/proyectos')
      ]);
      if (campRes.ok) {
        const data = await campRes.json();
        setCampanas(Array.isArray(data) ? data : []);
      }
      if (cliRes.ok) {
        const data = await cliRes.json();
        setClientes(Array.isArray(data) ? data : []);
      }
      if (proyRes.ok) {
        const data = await proyRes.json();
        setProyectos(Array.isArray(data) ? data : []);
      }
      
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReportes = async (campanaId: string) => {
    const res = await fetch(`/api/dashboard?tipo=sem-reportes&campanaId=${campanaId}`);
    if (res.ok) setReportes(await res.json());
  };

  const handleSelectCampana = async (campana: Campana) => {
    setSelectedCampana(campana);
    await fetchReportes(campana.id);
  };

  const formatCurrency = (amount: number) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);
  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  const formatNumber = (num: number) => new Intl.NumberFormat('es-ES').format(num);

  const getPlataformaStyle = (plat: string) => PLATAFORMAS.find(p => p.id === plat)?.color || 'bg-slate-100 text-slate-700';
  const getPlataformaNombre = (plat: string) => PLATAFORMAS.find(p => p.id === plat)?.nombre || plat;
  const getEstadoStyle = (est: string) => ESTADOS.find(e => e.id === est)?.color || 'bg-slate-100 text-slate-700';
  const getEstadoNombre = (est: string) => ESTADOS.find(e => e.id === est)?.nombre || est;

  const getDuracionDias = (inicio: string, fin: string | null) => {
    const start = new Date(inicio);
    const end = fin ? new Date(fin) : new Date();
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  };

  const calcularTotales = (reportes: ReporteDiario[]) => {
    return reportes.reduce((acc, r) => ({
      impresiones: acc.impresiones + r.impresiones,
      clics: acc.clics + r.clics,
      conversiones: acc.conversiones + r.conversiones,
      gasto: acc.gasto + r.gastoDia
    }), { impresiones: 0, clics: 0, conversiones: 0, gasto: 0 });
  };

  const filteredCampanas = campanas.filter(c => {
    const matchSearch = c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        c.cliente.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchPlataforma = filterPlataforma === 'todas' || c.plataforma === filterPlataforma;
    const matchEstado = filterEstado === 'todas' || c.estado === filterEstado;
    return matchSearch && matchPlataforma && matchEstado;
  });

  // Calcular resumen dashboard
  const campanasActivas = campanas.filter(c => c.estado === 'ACTIVA');
  const presupuestoTotal = campanasActivas.reduce((sum, c) => sum + c.presupuesto, 0);
  const gastoTotal = campanasActivas.reduce((sum, c) => sum + (c.gastoTotal || 0), 0);

  if (loading) {
    return <div className="flex justify-center items-center h-96"><p className="text-xl text-blue-500 animate-pulse">Cargando campañas...</p></div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Megaphone className="text-yellow-500" /> Gestión SEM & Social Ads
          </h1>
          <p className="text-gray-500 text-sm">Control unificado de campañas de pago (PPC)</p>
        </div>
        <button onClick={() => { setEditingCampana(null); setShowModal(true); }} className="flex items-center gap-2 px-4 py-2 bg-elio-yellow text-black font-bold rounded-lg hover:bg-yellow-400">
          <Plus size={18} /> Nueva Campaña
        </button>
      </div>

      {/* Dashboard Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase">Campañas Activas</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{campanasActivas.length}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-xl"><Target size={24} className="text-green-600" /></div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase">Presupuesto Total</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{formatCurrency(presupuestoTotal)}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-xl"><DollarSign size={24} className="text-blue-600" /></div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase">Gastado</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">{formatCurrency(gastoTotal)}</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-xl"><TrendingUp size={24} className="text-orange-600" /></div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase">% Consumido</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{presupuestoTotal > 0 ? Math.round((gastoTotal / presupuestoTotal) * 100) : 0}%</p>
            </div>
            <div className="p-3 bg-slate-100 rounded-xl"><BarChart2 size={24} className="text-slate-600" /></div>
          </div>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Buscar campaña..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm" />
        </div>
        <select value={filterPlataforma} onChange={(e) => setFilterPlataforma(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
          <option value="todas">Todas las plataformas</option>
          {PLATAFORMAS.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
        </select>
        <select value={filterEstado} onChange={(e) => setFilterEstado(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
          <option value="todas">Todos los estados</option>
          {ESTADOS.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
        </select>
      </div>

      {/* Lista de Campañas */}
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left font-bold text-slate-600">Estado</th>
              <th className="px-4 py-3 text-left font-bold text-slate-600">Plataforma</th>
              <th className="px-4 py-3 text-left font-bold text-slate-600">Cliente / Campaña</th>
              <th className="px-4 py-3 text-center font-bold text-slate-600">Duración</th>
              <th className="px-4 py-3 text-right font-bold text-slate-600">Inversión</th>
              <th className="px-4 py-3 text-center font-bold text-slate-600">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredCampanas.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-400"><Megaphone size={32} className="mx-auto mb-2 opacity-30" />No hay campañas</td></tr>
            ) : filteredCampanas.map(c => (
              <tr key={c.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => handleSelectCampana(c)}>
                <td className="px-4 py-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getEstadoStyle(c.estado)}`}>{getEstadoNombre(c.estado)}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPlataformaStyle(c.plataforma)}`}>● {getPlataformaNombre(c.plataforma)}</span>
                </td>
                <td className="px-4 py-3">
                  <p className="font-bold text-slate-900">{c.nombre}</p>
                  <p className="text-xs text-slate-500">{c.cliente.name}</p>
                </td>
                <td className="px-4 py-3 text-center">
                  <p className="font-medium">{getDuracionDias(c.fechaInicio, c.fechaFin)} días</p>
                  <p className="text-xs text-slate-400">{formatDate(c.fechaInicio)} - {c.fechaFin ? formatDate(c.fechaFin) : 'Activa'}</p>
                </td>
                <td className="px-4 py-3 text-right">
                  <p className="font-bold text-slate-900">{formatCurrency(c.gastoTotal || 0)}</p>
                  <p className="text-xs text-slate-400">de {formatCurrency(c.presupuesto)}</p>
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex justify-center gap-1">
                    <button onClick={(e) => { e.stopPropagation(); handleSelectCampana(c); }} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"><Eye size={16} /></button>
                    <button onClick={(e) => { e.stopPropagation(); setEditingCampana(c); setShowModal(true); }} className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded"><Edit size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Panel Detalle Campaña */}
      {selectedCampana && (
        <CampanaDetail 
          campana={selectedCampana} 
          reportes={reportes}
          onClose={() => setSelectedCampana(null)}
          onAddReporte={() => setShowModalReporte(true)}
          onRefresh={() => fetchReportes(selectedCampana.id)}
        />
      )}

      {/* Modales */}
      {showModal && (
        <ModalCampana 
          campana={editingCampana} 
          clientes={clientes} 
          proyectos={proyectos}
          onClose={() => setShowModal(false)} 
          onSave={() => { fetchData(); setShowModal(false); }} 
        />
      )}
      {showModalReporte && selectedCampana && (
        <ModalReporte 
          campanaId={selectedCampana.id}
          onClose={() => setShowModalReporte(false)} 
          onSave={() => { fetchReportes(selectedCampana.id); setShowModalReporte(false); }} 
        />
      )}
    </div>
  );
}

// Componente Detalle de Campaña
function CampanaDetail({ campana, reportes, onClose, onAddReporte, onRefresh }: { 
  campana: Campana; 
  reportes: ReporteDiario[];
  onClose: () => void;
  onAddReporte: () => void;
  onRefresh: () => void;
}) {
  const formatCurrency = (amount: number) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);
  const formatNumber = (num: number) => new Intl.NumberFormat('es-ES').format(num);
  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });

  const totales = reportes.reduce((acc, r) => ({
    impresiones: acc.impresiones + r.impresiones,
    clics: acc.clics + r.clics,
    conversiones: acc.conversiones + r.conversiones,
    gasto: acc.gasto + r.gastoDia
  }), { impresiones: 0, clics: 0, conversiones: 0, gasto: 0 });

  const ctrTotal = totales.impresiones > 0 ? ((totales.clics / totales.impresiones) * 100).toFixed(2) : '0';
  const cpaTotal = totales.conversiones > 0 ? (totales.gasto / totales.conversiones).toFixed(2) : '0';
  const roasPromedio = reportes.length > 0 ? (reportes.reduce((sum, r) => sum + r.roas, 0) / reportes.length).toFixed(1) : '0';
  const porcentajeConsumido = campana.presupuesto > 0 ? ((totales.gasto / campana.presupuesto) * 100).toFixed(1) : '0';

  const getPlataformaNombre = (plat: string) => {
    const plats: Record<string, string> = { GOOGLE: 'Google Ads', META: 'Meta Ads', TIKTOK: 'TikTok Ads', LINKEDIN: 'LinkedIn Ads' };
    return plats[plat] || plat;
  };
  const getEstadoStyle = (est: string) => {
    const styles: Record<string, string> = { ACTIVA: 'bg-green-100 text-green-700', PAUSADA: 'bg-yellow-100 text-yellow-700', FINALIZADA: 'bg-slate-100 text-slate-700', PLANIFICADA: 'bg-purple-100 text-purple-700' };
    return styles[est] || 'bg-slate-100 text-slate-700';
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getEstadoStyle(campana.estado)}`}>{campana.estado}</span>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">● {getPlataformaNombre(campana.plataforma)}</span>
              <span className="text-xs text-slate-400">ID: {campana.id.slice(-8).toUpperCase()}</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">{campana.nombre}</h2>
            <p className="text-slate-500">{campana.cliente.name}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onAddReporte} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
              <Plus size={16} /> Añadir Reporte
            </button>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600"><X size={20} /></button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)] space-y-6">
          {/* Resumen de Inversión */}
          <Card title="💰 Inversión & Presupuesto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-slate-500">Gastado / Presupuesto</p>
                <p className="text-2xl font-bold">{formatCurrency(totales.gasto)} <span className="text-slate-400 font-normal">/ {formatCurrency(campana.presupuesto)}</span></p>
              </div>
              <p className="text-lg font-bold">{porcentajeConsumido}% Consumido</p>
            </div>
            <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full bg-yellow-500 transition-all" style={{ width: `${Math.min(100, parseFloat(porcentajeConsumido))}%` }} />
            </div>
          </Card>

          {/* KPIs Totales */}
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <p className="text-xs font-bold text-slate-500 uppercase">Impresiones</p>
              <p className="text-2xl font-bold text-slate-900">{formatNumber(totales.impresiones)}</p>
              <p className="text-xs text-slate-400">Alcance Total</p>
            </Card>
            <Card>
              <p className="text-xs font-bold text-slate-500 uppercase">Clics & CTR</p>
              <p className="text-2xl font-bold text-slate-900">{formatNumber(totales.clics)} <span className="text-sm text-green-600">{ctrTotal}%</span></p>
              <p className="text-xs text-slate-400">Calidad del Anuncio</p>
            </Card>
            <Card>
              <p className="text-xs font-bold text-slate-500 uppercase">Conversiones</p>
              <p className="text-2xl font-bold text-slate-900">{formatNumber(totales.conversiones)} <span className="text-sm text-slate-500">{cpaTotal}€</span></p>
              <p className="text-xs text-slate-400">CPA (Auto)</p>
            </Card>
            <Card>
              <p className="text-xs font-bold text-slate-500 uppercase">ROAS</p>
              <p className="text-2xl font-bold text-green-600">{roasPromedio}x</p>
              <p className="text-xs text-slate-400">Retorno de Inversión</p>
            </Card>
          </div>

          {/* Tabla de Reportes Diarios */}
          <Card title={`📊 Evolución Diaria (${reportes.length} reportes)`}>
            {reportes.length === 0 ? (
              <p className="text-center text-slate-400 py-8">No hay reportes diarios. Añade el primero.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b">
                    <tr>
                      <th className="px-3 py-2 text-left font-bold text-slate-600">Fecha</th>
                      <th className="px-3 py-2 text-right font-bold text-slate-600">Impresiones</th>
                      <th className="px-3 py-2 text-right font-bold text-slate-600">Clics</th>
                      <th className="px-3 py-2 text-right font-bold text-slate-600">CTR</th>
                      <th className="px-3 py-2 text-right font-bold text-slate-600">Conv.</th>
                      <th className="px-3 py-2 text-right font-bold text-slate-600">CPA</th>
                      <th className="px-3 py-2 text-right font-bold text-slate-600">Gasto</th>
                      <th className="px-3 py-2 text-right font-bold text-slate-600">ROAS</th>
                      <th className="px-3 py-2 text-left font-bold text-slate-600">Notas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {reportes.map(r => (
                      <tr key={r.id} className="hover:bg-slate-50">
                        <td className="px-3 py-2 font-medium">{formatDate(r.fecha)}</td>
                        <td className="px-3 py-2 text-right">{formatNumber(r.impresiones)}</td>
                        <td className="px-3 py-2 text-right">{formatNumber(r.clics)}</td>
                        <td className="px-3 py-2 text-right text-green-600">{r.ctr.toFixed(2)}%</td>
                        <td className="px-3 py-2 text-right">{r.conversiones}</td>
                        <td className="px-3 py-2 text-right">{formatCurrency(r.cpa)}</td>
                        <td className="px-3 py-2 text-right font-medium">{formatCurrency(r.gastoDia)}</td>
                        <td className="px-3 py-2 text-right text-green-600 font-bold">{r.roas.toFixed(1)}x</td>
                        <td className="px-3 py-2 text-xs text-slate-500 max-w-[150px] truncate">{r.notas || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {campana.urlPlataforma && (
            <a href={campana.urlPlataforma} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 text-blue-600 hover:underline">
              Ver reporte detallado en {getPlataformaNombre(campana.plataforma)} <ExternalLink size={14} />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// Modal Campaña
function ModalCampana({ campana, clientes, proyectos, onClose, onSave }: { 
  campana: Campana | null; 
  clientes: Cliente[]; 
  proyectos: Proyecto[];
  onClose: () => void; 
  onSave: () => void; 
}) {
  const [form, setForm] = useState({
    clienteId: campana?.clienteId || '',
    proyectoId: campana?.proyectoId || '',
    nombre: campana?.nombre || '',
    plataforma: campana?.plataforma || 'GOOGLE',
    estado: campana?.estado || 'PLANIFICADA',
    fechaInicio: campana?.fechaInicio?.split('T')[0] || new Date().toISOString().split('T')[0],
    fechaFin: campana?.fechaFin?.split('T')[0] || '',
    presupuesto: campana?.presupuesto?.toString() || '',
    objetivo: campana?.objetivo || '',
    urlPlataforma: campana?.urlPlataforma || '',
    notas: campana?.notas || ''
  });
  const [saving, setSaving] = useState(false);

  const proyectosFiltrados = proyectos.filter(p => p.clienteId === form.clienteId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await fetch('/api/dashboard?tipo=sem-campanas', {
      method: campana ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(campana ? { id: campana.id, ...form } : form)
    });
    setSaving(false);
    onSave();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
        <div className="p-6 border-b"><h2 className="text-xl font-bold">{campana ? 'Editar' : 'Nueva'} Campaña</h2></div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Cliente *</label>
              <select value={form.clienteId} onChange={e => setForm({ ...form, clienteId: e.target.value, proyectoId: '' })} className="w-full px-3 py-2 border rounded-lg" required>
                <option value="">Seleccionar...</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Proyecto</label>
              <select value={form.proyectoId} onChange={e => setForm({ ...form, proyectoId: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                <option value="">Sin proyecto</option>
                {proyectosFiltrados.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Nombre de la Campaña *</label>
            <input type="text" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Plataforma *</label>
              <select value={form.plataforma} onChange={e => setForm({ ...form, plataforma: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                <option value="GOOGLE">Google Ads</option>
                <option value="META">Meta Ads</option>
                <option value="TIKTOK">TikTok Ads</option>
                <option value="LINKEDIN">LinkedIn Ads</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Estado</label>
              <select value={form.estado} onChange={e => setForm({ ...form, estado: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                <option value="PLANIFICADA">Planificada</option>
                <option value="ACTIVA">Activa</option>
                <option value="PAUSADA">Pausada</option>
                <option value="FINALIZADA">Finalizada</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Fecha Inicio *</label>
              <input type="date" value={form.fechaInicio} onChange={e => setForm({ ...form, fechaInicio: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Fecha Fin</label>
              <input type="date" value={form.fechaFin} onChange={e => setForm({ ...form, fechaFin: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Presupuesto € *</label>
              <input type="number" step="0.01" value={form.presupuesto} onChange={e => setForm({ ...form, presupuesto: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Objetivo</label>
              <select value={form.objetivo} onChange={e => setForm({ ...form, objetivo: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                <option value="">Seleccionar...</option>
                <option value="CONVERSIONES">Conversiones</option>
                <option value="TRAFICO">Tráfico</option>
                <option value="RECONOCIMIENTO">Reconocimiento</option>
                <option value="LEADS">Leads</option>
                <option value="VENTAS">Ventas</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">URL Plataforma</label>
            <input type="url" value={form.urlPlataforma} onChange={e => setForm({ ...form, urlPlataforma: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="https://ads.google.com/..." />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Notas</label>
            <textarea value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })} className="w-full px-3 py-2 border rounded-lg" rows={2} />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
            <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">{saving ? 'Guardando...' : 'Guardar'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Modal Reporte Diario
function ModalReporte({ campanaId, onClose, onSave }: { campanaId: string; onClose: () => void; onSave: () => void; }) {
  const [form, setForm] = useState({
    fecha: new Date().toISOString().split('T')[0],
    impresiones: '',
    clics: '',
    ctr: '',
    conversiones: '',
    cpa: '',
    gastoDia: '',
    roas: '',
    notas: ''
  });
  const [saving, setSaving] = useState(false);

  // Auto-calcular CTR
  useEffect(() => {
    const imp = parseInt(form.impresiones) || 0;
    const cli = parseInt(form.clics) || 0;
    if (imp > 0) {
      setForm(f => ({ ...f, ctr: ((cli / imp) * 100).toFixed(2) }));
    }
  }, [form.impresiones, form.clics]);

  // Auto-calcular CPA
  useEffect(() => {
    const conv = parseInt(form.conversiones) || 0;
    const gasto = parseFloat(form.gastoDia) || 0;
    if (conv > 0) {
      setForm(f => ({ ...f, cpa: (gasto / conv).toFixed(2) }));
    }
  }, [form.conversiones, form.gastoDia]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await fetch('/api/dashboard?tipo=sem-reportes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ campanaId, ...form })
    });
    setSaving(false);
    onSave();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="p-6 border-b"><h2 className="text-xl font-bold">Añadir Reporte Diario</h2></div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Fecha *</label>
            <input type="date" value={form.fecha} onChange={e => setForm({ ...form, fecha: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Impresiones</label>
              <input type="number" value={form.impresiones} onChange={e => setForm({ ...form, impresiones: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Clics</label>
              <input type="number" value={form.clics} onChange={e => setForm({ ...form, clics: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">CTR % <span className="text-xs text-slate-400">(auto)</span></label>
              <input type="number" step="0.01" value={form.ctr} onChange={e => setForm({ ...form, ctr: e.target.value })} className="w-full px-3 py-2 border rounded-lg bg-slate-50" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Conversiones</label>
              <input type="number" value={form.conversiones} onChange={e => setForm({ ...form, conversiones: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Gasto del Día €</label>
              <input type="number" step="0.01" value={form.gastoDia} onChange={e => setForm({ ...form, gastoDia: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">CPA € <span className="text-xs text-slate-400">(auto)</span></label>
              <input type="number" step="0.01" value={form.cpa} onChange={e => setForm({ ...form, cpa: e.target.value })} className="w-full px-3 py-2 border rounded-lg bg-slate-50" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">ROAS</label>
            <input type="number" step="0.1" value={form.roas} onChange={e => setForm({ ...form, roas: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="ej: 4.5" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Notas / Cambios realizados</label>
            <textarea value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })} className="w-full px-3 py-2 border rounded-lg" rows={2} placeholder="Ej: Subida de pujas, nuevo copy, etc." />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
            <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">{saving ? 'Guardando...' : 'Guardar'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
