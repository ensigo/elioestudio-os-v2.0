'use client';
import React, { useState, useEffect } from 'react';
import { authFetch } from '../../lib/auth-fetch';
import { Card } from '../../components/ui/Card';
import { Sheet } from '../../components/ui/Sheet';
import { useToast } from '../../components/ui/Toast';
import { useConfirm } from '../../components/ui/ConfirmDialog';
import { FaGoogle, FaFacebookF, FaTiktok, FaLinkedinIn } from 'react-icons/fa';
import {
  Megaphone, Search, Plus, TrendingUp, DollarSign,
  Target, BarChart2,
  ExternalLink, Edit, Trash2, Eye, ArrowUpRight, ArrowDownRight,
  Zap, Activity
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
  { id: 'GOOGLE', nombre: 'Google Ads', color: 'bg-blue-100 text-blue-700', iconColor: 'text-blue-600' },
  { id: 'META', nombre: 'Meta Ads', color: 'bg-indigo-100 text-indigo-700', iconColor: 'text-indigo-600' },
  { id: 'TIKTOK', nombre: 'TikTok Ads', color: 'bg-pink-100 text-pink-700', iconColor: 'text-pink-600' },
  { id: 'LINKEDIN', nombre: 'LinkedIn Ads', color: 'bg-sky-100 text-sky-700', iconColor: 'text-sky-600' }
];

const ESTADOS = [
  { id: 'ACTIVA', nombre: 'Activa', color: 'bg-green-100 text-green-700' },
  { id: 'PAUSADA', nombre: 'Pausada', color: 'bg-yellow-100 text-yellow-700' },
  { id: 'FINALIZADA', nombre: 'Finalizada', color: 'bg-slate-100 text-slate-700' },
  { id: 'PLANIFICADA', nombre: 'Planificada', color: 'bg-purple-100 text-purple-700' }
];

function PlatformIcon({ platform, size = 14 }: { platform: string; size?: number }) {
  switch (platform) {
    case 'GOOGLE': return <FaGoogle size={size} />;
    case 'META': return <FaFacebookF size={size} />;
    case 'TIKTOK': return <FaTiktok size={size} />;
    case 'LINKEDIN': return <FaLinkedinIn size={size} />;
    default: return null;
  }
}

const getRoasColor = (roas: number) => {
  if (roas >= 4) return 'text-green-600';
  if (roas >= 2) return 'text-blue-600';
  if (roas >= 1) return 'text-yellow-600';
  return 'text-red-600';
};

const getCtrColor = (ctr: number) => {
  if (ctr >= 3) return 'text-green-600';
  if (ctr >= 1) return 'text-blue-600';
  return 'text-orange-500';
};

const getBudgetBarColor = (pct: number) => {
  if (pct >= 90) return 'bg-red-500';
  if (pct >= 70) return 'bg-yellow-500';
  return 'bg-green-500';
};

const getBudgetTextColor = (pct: number) => {
  if (pct >= 90) return 'text-red-600';
  if (pct >= 70) return 'text-yellow-600';
  return 'text-green-600';
};

export default function SEMPage() {
  const { usuario } = useAuth();
  const { success: toastSuccess, error: toastError } = useToast();
  const { confirm } = useConfirm();
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
        authFetch('/api/dashboard?tipo=sem-campanas'),
        authFetch('/api/clientes'),
        authFetch('/api/proyectos')
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
    const res = await authFetch(`/api/dashboard?tipo=sem-reportes&campanaId=${campanaId}`);
    if (res.ok) setReportes(await res.json());
  };

  const handleSelectCampana = async (campana: Campana) => {
    setSelectedCampana(campana);
    await fetchReportes(campana.id);
  };

  const handleDeleteCampana = async () => {
    if (!selectedCampana) return;
    const ok = await confirm({
      title: 'Eliminar campaña',
      message: `¿Eliminar "${selectedCampana.nombre}"? Esta acción no se puede deshacer.`,
      confirmLabel: 'Eliminar',
      danger: true
    });
    if (!ok) return;
    try {
      const res = await authFetch('/api/dashboard?tipo=sem-campanas', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedCampana.id })
      });
      if (res.ok) {
        toastSuccess('Campaña eliminada correctamente');
        setSelectedCampana(null);
        fetchData();
      } else {
        toastError('No se pudo eliminar la campaña');
      }
    } catch {
      toastError('Error al eliminar la campaña');
    }
  };

  const formatCurrency = (amount: number) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);
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

  const filteredCampanas = campanas.filter(c => {
    const matchSearch = c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        c.cliente.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchPlataforma = filterPlataforma === 'todas' || c.plataforma === filterPlataforma;
    const matchEstado = filterEstado === 'todas' || c.estado === filterEstado;
    return matchSearch && matchPlataforma && matchEstado;
  });

  const campanasActivas = campanas.filter(c => c.estado === 'ACTIVA');
  const presupuestoTotal = campanasActivas.reduce((sum, c) => sum + c.presupuesto, 0);
  const gastoTotal = campanasActivas.reduce((sum, c) => sum + (c.gastoTotal || 0), 0);
  const pctConsumido = presupuestoTotal > 0 ? Math.round((gastoTotal / presupuestoTotal) * 100) : 0;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-center space-y-3">
          <Activity size={32} className="mx-auto text-yellow-500 animate-pulse" />
          <p className="text-slate-500 text-sm">Cargando campañas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Megaphone className="text-yellow-500" /> Gestión SEM & Social Ads
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">Control unificado de campañas de pago (PPC)</p>
        </div>
        <button
          onClick={() => { setEditingCampana(null); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-elio-yellow text-black font-bold rounded-xl hover:bg-yellow-400 transition-colors shadow-sm"
        >
          <Plus size={18} /> Nueva Campaña
        </button>
      </div>

      {/* Dashboard KPIs */}
      <div className={`grid grid-cols-2 gap-4 ${isAdmin ? 'md:grid-cols-4' : 'md:grid-cols-2'}`}>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Campañas Activas</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{campanasActivas.length}</p>
              <p className="text-xs text-slate-400 mt-0.5">{campanas.length} total</p>
            </div>
            <div className="p-3 bg-green-100 rounded-xl"><Target size={22} className="text-green-600" /></div>
          </div>
        </Card>

        {isAdmin && (
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Presupuesto Total</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{formatCurrency(presupuestoTotal)}</p>
                <p className="text-xs text-slate-400 mt-0.5">campañas activas</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl"><DollarSign size={22} className="text-blue-600" /></div>
            </div>
          </Card>
        )}

        {isAdmin && (
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Gasto Acumulado</p>
                <p className="text-2xl font-bold text-orange-600 mt-1">{formatCurrency(gastoTotal)}</p>
                <p className="text-xs text-slate-400 mt-0.5">sobre presupuesto</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-xl"><TrendingUp size={22} className="text-orange-600" /></div>
            </div>
          </Card>
        )}

        {isAdmin && (
          <Card>
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">% Consumido</p>
                <p className={`text-2xl font-bold mt-1 ${pctConsumido >= 90 ? 'text-red-600' : pctConsumido >= 70 ? 'text-yellow-600' : 'text-slate-900'}`}>
                  {pctConsumido}%
                </p>
              </div>
              <div className="p-3 bg-slate-100 rounded-xl"><BarChart2 size={22} className="text-slate-600" /></div>
            </div>
            <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${getBudgetBarColor(pctConsumido)}`}
                style={{ width: `${Math.min(100, pctConsumido)}%` }}
              />
            </div>
          </Card>
        )}
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar campaña o cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-300"
          />
        </div>
        <select
          value={filterPlataforma}
          onChange={(e) => setFilterPlataforma(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-300"
        >
          <option value="todas">Todas las plataformas</option>
          {PLATAFORMAS.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
        </select>
        <select
          value={filterEstado}
          onChange={(e) => setFilterEstado(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-300"
        >
          <option value="todas">Todos los estados</option>
          {ESTADOS.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
        </select>
      </div>

      {/* Tabla de Campañas */}
      <Card className="overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-slate-500 text-xs uppercase tracking-wide">Estado</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-500 text-xs uppercase tracking-wide">Plataforma</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-500 text-xs uppercase tracking-wide">Cliente / Campaña</th>
              <th className="px-4 py-3 text-center font-semibold text-slate-500 text-xs uppercase tracking-wide">Duración</th>
              <th className="px-4 py-3 text-right font-semibold text-slate-500 text-xs uppercase tracking-wide">Inversión</th>
              <th className="px-4 py-3 text-center font-semibold text-slate-500 text-xs uppercase tracking-wide w-24">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredCampanas.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-16 text-center">
                  <Megaphone size={36} className="mx-auto mb-3 text-slate-200" />
                  <p className="text-slate-400 font-medium">No hay campañas</p>
                  <p className="text-slate-300 text-xs mt-1">
                    {searchTerm || filterPlataforma !== 'todas' || filterEstado !== 'todas'
                      ? 'Prueba con otros filtros'
                      : 'Crea tu primera campaña con el botón de arriba'}
                  </p>
                </td>
              </tr>
            ) : filteredCampanas.map(c => {
              const pct = c.presupuesto > 0 ? (c.gastoTotal || 0) / c.presupuesto * 100 : 0;
              return (
                <tr
                  key={c.id}
                  className="hover:bg-slate-50 cursor-pointer transition-colors"
                  onClick={() => handleSelectCampana(c)}
                >
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getEstadoStyle(c.estado)}`}>
                      {getEstadoNombre(c.estado)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getPlataformaStyle(c.plataforma)}`}>
                      <PlatformIcon platform={c.plataforma} size={11} />
                      {getPlataformaNombre(c.plataforma)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-900">{c.nombre}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{c.cliente.name}</p>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <p className="font-medium text-slate-700">{getDuracionDias(c.fechaInicio, c.fechaFin)} días</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {new Date(c.fechaInicio).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                      {' — '}
                      {c.fechaFin ? new Date(c.fechaFin).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }) : 'Activa'}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <p className="font-bold text-slate-900">{formatCurrency(c.gastoTotal || 0)}</p>
                    {isAdmin && (
                      <>
                        <p className="text-xs text-slate-400 mt-0.5">de {formatCurrency(c.presupuesto)}</p>
                        <div className="mt-1.5 h-1.5 bg-slate-200 rounded-full overflow-hidden w-20 ml-auto">
                          <div
                            className={`h-full rounded-full transition-all ${getBudgetBarColor(pct)}`}
                            style={{ width: `${Math.min(100, pct)}%` }}
                          />
                        </div>
                      </>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex justify-center gap-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleSelectCampana(c); }}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Ver detalle"
                      >
                        <Eye size={15} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditingCampana(c); setShowModal(true); }}
                        className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      {/* Sheet: Detalle Campaña */}
      <Sheet
        isOpen={!!selectedCampana}
        onClose={() => setSelectedCampana(null)}
        title={selectedCampana?.nombre || ''}
        width="w-full max-w-3xl"
      >
        {selectedCampana && (
          <CampanaDetailContent
            campana={selectedCampana}
            reportes={reportes}
            isAdmin={isAdmin}
            onAddReporte={() => setShowModalReporte(true)}
            onEdit={() => { setEditingCampana(selectedCampana); setShowModal(true); }}
            onDelete={handleDeleteCampana}
            formatCurrency={formatCurrency}
            formatNumber={formatNumber}
          />
        )}
      </Sheet>

      {/* Modal Campaña */}
      {showModal && (
        <ModalCampana
          campana={editingCampana}
          clientes={clientes}
          proyectos={proyectos}
          isAdmin={isAdmin}
          onClose={() => setShowModal(false)}
          onSave={(msg) => {
            toastSuccess(msg);
            fetchData();
            setShowModal(false);
          }}
          onError={(msg) => toastError(msg)}
        />
      )}

      {/* Modal Reporte Diario */}
      {showModalReporte && selectedCampana && (
        <ModalReporte
          campanaId={selectedCampana.id}
          onClose={() => setShowModalReporte(false)}
          onSave={() => {
            toastSuccess('Reporte añadido correctamente');
            fetchReportes(selectedCampana.id);
            setShowModalReporte(false);
          }}
          onError={(msg) => toastError(msg)}
        />
      )}
    </div>
  );
}

// Contenido del panel lateral de detalle
function CampanaDetailContent({ campana, reportes, isAdmin, onAddReporte, onEdit, onDelete, formatCurrency, formatNumber }: {
  campana: Campana;
  reportes: ReporteDiario[];
  isAdmin: boolean;
  onAddReporte: () => void;
  onEdit: () => void;
  onDelete: () => void;
  formatCurrency: (n: number) => string;
  formatNumber: (n: number) => string;
}) {
  const getEstadoStyle = (est: string) => ESTADOS.find(e => e.id === est)?.color || 'bg-slate-100 text-slate-700';
  const getEstadoNombre = (est: string) => ESTADOS.find(e => e.id === est)?.nombre || est;
  const getPlataformaStyle = (plat: string) => PLATAFORMAS.find(p => p.id === plat)?.color || 'bg-slate-100 text-slate-700';
  const getPlataformaNombre = (plat: string) => PLATAFORMAS.find(p => p.id === plat)?.nombre || plat;

  const totales = reportes.reduce((acc, r) => ({
    impresiones: acc.impresiones + r.impresiones,
    clics: acc.clics + r.clics,
    conversiones: acc.conversiones + r.conversiones,
    gasto: acc.gasto + r.gastoDia
  }), { impresiones: 0, clics: 0, conversiones: 0, gasto: 0 });

  const ctrTotal = totales.impresiones > 0 ? (totales.clics / totales.impresiones) * 100 : 0;
  const cpaTotal = totales.conversiones > 0 ? totales.gasto / totales.conversiones : 0;
  const roasPromedio = reportes.length > 0 ? reportes.reduce((s, r) => s + r.roas, 0) / reportes.length : 0;
  const porcentajeConsumido = campana.presupuesto > 0 ? (totales.gasto / campana.presupuesto) * 100 : 0;

  return (
    <div className="space-y-5">
      {/* Badges + acciones */}
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getEstadoStyle(campana.estado)}`}>
            {getEstadoNombre(campana.estado)}
          </span>
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getPlataformaStyle(campana.plataforma)}`}>
            <PlatformIcon platform={campana.plataforma} size={11} />
            {getPlataformaNombre(campana.plataforma)}
          </span>
          {campana.objetivo && (
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
              {campana.objetivo}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={onAddReporte} className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 flex items-center gap-1.5 transition-colors">
            <Plus size={13} /> Reporte
          </button>
          <button onClick={onEdit} className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Editar">
            <Edit size={15} />
          </button>
          <button onClick={onDelete} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar">
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* Subtítulo */}
      <div className="pb-1 border-b border-slate-100">
        <p className="text-sm text-slate-500">
          {campana.cliente.name}
          {campana.proyecto && <span className="text-slate-400"> · {campana.proyecto.title}</span>}
        </p>
        {campana.notas && <p className="text-xs text-slate-400 mt-1 italic">{campana.notas}</p>}
      </div>

      {/* Inversión & presupuesto (admin) */}
      {isAdmin && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Inversión</p>
              <p className="text-xl font-bold text-slate-900 mt-0.5">
                {formatCurrency(totales.gasto)}
                <span className="text-slate-400 font-normal text-base"> / {formatCurrency(campana.presupuesto)}</span>
              </p>
            </div>
            <span className={`text-lg font-bold ${getBudgetTextColor(porcentajeConsumido)}`}>
              {porcentajeConsumido.toFixed(1)}%
            </span>
          </div>
          <div className="h-2.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${getBudgetBarColor(porcentajeConsumido)}`}
              style={{ width: `${Math.min(100, porcentajeConsumido)}%` }}
            />
          </div>
          {porcentajeConsumido >= 90 && (
            <p className="text-xs text-red-600 font-medium flex items-center gap-1">
              <Zap size={12} /> Presupuesto casi agotado
            </p>
          )}
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-slate-200 p-3 space-y-0.5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Impresiones</p>
          <p className="text-xl font-bold text-slate-900">{formatNumber(totales.impresiones)}</p>
          <p className="text-xs text-slate-400">Alcance total</p>
        </div>
        <div className="rounded-xl border border-slate-200 p-3 space-y-0.5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Clics & CTR</p>
          <div className="flex items-baseline gap-2">
            <p className="text-xl font-bold text-slate-900">{formatNumber(totales.clics)}</p>
            <p className={`text-sm font-bold ${getCtrColor(ctrTotal)}`}>{ctrTotal.toFixed(2)}%</p>
          </div>
          <p className="text-xs text-slate-400">Tasa de clic</p>
        </div>
        <div className="rounded-xl border border-slate-200 p-3 space-y-0.5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Conversiones</p>
          <div className="flex items-baseline gap-2">
            <p className="text-xl font-bold text-slate-900">{formatNumber(totales.conversiones)}</p>
            {cpaTotal > 0 && <p className="text-sm text-slate-500">{formatCurrency(cpaTotal)} CPA</p>}
          </div>
          <p className="text-xs text-slate-400">Objetivos cumplidos</p>
        </div>
        <div className="rounded-xl border border-slate-200 p-3 space-y-0.5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">ROAS</p>
          <p className={`text-xl font-bold ${getRoasColor(roasPromedio)}`}>{roasPromedio.toFixed(1)}x</p>
          <p className="text-xs text-slate-400">
            {roasPromedio >= 4 ? 'Excelente rendimiento' : roasPromedio >= 2 ? 'Buen rendimiento' : roasPromedio >= 1 ? 'Rendimiento justo' : 'Por debajo del umbral'}
          </p>
        </div>
      </div>

      {/* Reportes diarios */}
      <div className="rounded-xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
          <p className="text-sm font-semibold text-slate-700">Evolución Diaria</p>
          <span className="text-xs text-slate-400">{reportes.length} reportes</span>
        </div>
        {reportes.length === 0 ? (
          <div className="py-10 text-center">
            <BarChart2 size={28} className="mx-auto mb-2 text-slate-200" />
            <p className="text-slate-400 text-sm">Sin reportes diarios aún</p>
            <button onClick={onAddReporte} className="mt-3 text-xs text-blue-600 hover:underline flex items-center gap-1 mx-auto">
              <Plus size={12} /> Añadir el primer reporte
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-3 py-2.5 text-left font-semibold text-slate-500">Fecha</th>
                  <th className="px-3 py-2.5 text-right font-semibold text-slate-500">Impr.</th>
                  <th className="px-3 py-2.5 text-right font-semibold text-slate-500">Clics</th>
                  <th className="px-3 py-2.5 text-right font-semibold text-slate-500">CTR</th>
                  <th className="px-3 py-2.5 text-right font-semibold text-slate-500">Conv.</th>
                  <th className="px-3 py-2.5 text-right font-semibold text-slate-500">Gasto</th>
                  <th className="px-3 py-2.5 text-right font-semibold text-slate-500">ROAS</th>
                  <th className="px-3 py-2.5 text-left font-semibold text-slate-500">Notas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reportes.map((r, idx) => {
                  const prev = reportes[idx + 1];
                  const roasTrend = prev ? (r.roas > prev.roas ? 'up' : r.roas < prev.roas ? 'down' : 'flat') : null;
                  return (
                    <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-3 py-2.5 font-medium text-slate-700">
                        {new Date(r.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                      </td>
                      <td className="px-3 py-2.5 text-right text-slate-600">{formatNumber(r.impresiones)}</td>
                      <td className="px-3 py-2.5 text-right text-slate-600">{formatNumber(r.clics)}</td>
                      <td className={`px-3 py-2.5 text-right font-medium ${getCtrColor(r.ctr)}`}>{r.ctr.toFixed(2)}%</td>
                      <td className="px-3 py-2.5 text-right text-slate-600">{r.conversiones}</td>
                      <td className="px-3 py-2.5 text-right font-medium text-slate-700">{formatCurrency(r.gastoDia)}</td>
                      <td className="px-3 py-2.5 text-right">
                        <span className={`font-bold ${getRoasColor(r.roas)}`}>{r.roas.toFixed(1)}x</span>
                        {roasTrend === 'up' && <ArrowUpRight size={10} className="inline ml-0.5 text-green-500" />}
                        {roasTrend === 'down' && <ArrowDownRight size={10} className="inline ml-0.5 text-red-500" />}
                      </td>
                      <td className="px-3 py-2.5 text-slate-400 max-w-[100px] truncate">{r.notas || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Link externo */}
      {campana.urlPlataforma && (
        <a
          href={campana.urlPlataforma}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 text-sm text-blue-600 hover:text-blue-800 hover:underline py-2"
        >
          Ver en {getPlataformaNombre(campana.plataforma)} <ExternalLink size={14} />
        </a>
      )}
    </div>
  );
}

// Modal Crear/Editar Campaña
function ModalCampana({ campana, clientes, proyectos, isAdmin, onClose, onSave, onError }: {
  campana: Campana | null;
  clientes: Cliente[];
  proyectos: Proyecto[];
  isAdmin: boolean;
  onClose: () => void;
  onSave: (msg: string) => void;
  onError: (msg: string) => void;
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
    try {
      const res = await authFetch('/api/dashboard?tipo=sem-campanas', {
        method: campana ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(campana ? { id: campana.id, ...form } : form)
      });
      if (res.ok) {
        onSave(campana ? 'Campaña actualizada' : 'Campaña creada correctamente');
      } else {
        onError('No se pudo guardar la campaña');
      }
    } catch {
      onError('Error al guardar la campaña');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">{campana ? 'Editar' : 'Nueva'} Campaña</h2>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[72vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Cliente *</label>
              <select
                value={form.clienteId}
                onChange={e => setForm({ ...form, clienteId: e.target.value, proyectoId: '' })}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-300"
                required
              >
                <option value="">Seleccionar...</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Proyecto</label>
              <select
                value={form.proyectoId}
                onChange={e => setForm({ ...form, proyectoId: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-300"
                disabled={!form.clienteId}
              >
                <option value="">Sin proyecto</option>
                {proyectosFiltrados.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Nombre de la Campaña *</label>
            <input
              type="text"
              value={form.nombre}
              onChange={e => setForm({ ...form, nombre: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-300"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Plataforma *</label>
              <select
                value={form.plataforma}
                onChange={e => setForm({ ...form, plataforma: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-300"
              >
                {PLATAFORMAS.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Estado</label>
              <select
                value={form.estado}
                onChange={e => setForm({ ...form, estado: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-300"
              >
                {ESTADOS.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Fecha Inicio *</label>
              <input
                type="date"
                value={form.fechaInicio}
                onChange={e => setForm({ ...form, fechaInicio: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-300"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Fecha Fin</label>
              <input
                type="date"
                value={form.fechaFin}
                onChange={e => setForm({ ...form, fechaFin: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-300"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {isAdmin && (
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Presupuesto €</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.presupuesto}
                  onChange={e => setForm({ ...form, presupuesto: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-300"
                />
              </div>
            )}
            <div className={isAdmin ? '' : 'col-span-2'}>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Objetivo</label>
              <select
                value={form.objetivo}
                onChange={e => setForm({ ...form, objetivo: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-300"
              >
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
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">URL Plataforma</label>
            <input
              type="url"
              value={form.urlPlataforma}
              onChange={e => setForm({ ...form, urlPlataforma: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-300"
              placeholder="https://ads.google.com/..."
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Notas</label>
            <textarea
              value={form.notas}
              onChange={e => setForm({ ...form, notas: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-300"
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="px-5 py-2 text-sm bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Modal Reporte Diario
function ModalReporte({ campanaId, onClose, onSave, onError }: {
  campanaId: string;
  onClose: () => void;
  onSave: () => void;
  onError: (msg: string) => void;
}) {
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

  useEffect(() => {
    const imp = parseInt(form.impresiones) || 0;
    const cli = parseInt(form.clics) || 0;
    if (imp > 0) setForm(f => ({ ...f, ctr: ((cli / imp) * 100).toFixed(2) }));
  }, [form.impresiones, form.clics]);

  useEffect(() => {
    const conv = parseInt(form.conversiones) || 0;
    const gasto = parseFloat(form.gastoDia) || 0;
    if (conv > 0) setForm(f => ({ ...f, cpa: (gasto / conv).toFixed(2) }));
  }, [form.conversiones, form.gastoDia]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await authFetch('/api/dashboard?tipo=sem-reportes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campanaId, ...form })
      });
      if (res.ok) {
        onSave();
      } else {
        onError('No se pudo guardar el reporte');
      }
    } catch {
      onError('Error al guardar el reporte');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Añadir Reporte Diario</h2>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Fecha *</label>
            <input
              type="date"
              value={form.fecha}
              onChange={e => setForm({ ...form, fecha: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-300"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Impresiones</label>
              <input
                type="number"
                value={form.impresiones}
                onChange={e => setForm({ ...form, impresiones: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-300"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Clics</label>
              <input
                type="number"
                value={form.clics}
                onChange={e => setForm({ ...form, clics: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-300"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                CTR % <span className="text-slate-400 font-normal">(auto)</span>
              </label>
              <input
                type="number"
                step="0.01"
                value={form.ctr}
                onChange={e => setForm({ ...form, ctr: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-yellow-300"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Conversiones</label>
              <input
                type="number"
                value={form.conversiones}
                onChange={e => setForm({ ...form, conversiones: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-300"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Gasto del Día €</label>
              <input
                type="number"
                step="0.01"
                value={form.gastoDia}
                onChange={e => setForm({ ...form, gastoDia: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-300"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                CPA € <span className="text-slate-400 font-normal">(auto)</span>
              </label>
              <input
                type="number"
                step="0.01"
                value={form.cpa}
                onChange={e => setForm({ ...form, cpa: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-yellow-300"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">ROAS</label>
            <input
              type="number"
              step="0.1"
              value={form.roas}
              onChange={e => setForm({ ...form, roas: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-300"
              placeholder="ej: 4.5"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Notas / Cambios realizados</label>
            <textarea
              value={form.notas}
              onChange={e => setForm({ ...form, notas: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-300"
              rows={2}
              placeholder="Ej: Subida de pujas, nuevo copy..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="px-5 py-2 text-sm bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
