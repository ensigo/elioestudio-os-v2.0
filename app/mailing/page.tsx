'use client';
import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { 
  Mail, Plus, Search, Send, MousePointer2, 
  Users, AlertOctagon, X, Edit, Eye,
  BarChart2, Calendar, CheckCircle2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface CampanaMailing {
  id: string;
  clienteId: string;
  nombreInterno: string;
  asunto: string | null;
  plataforma: string;
  estado: string;
  fechaEnvio: string | null;
  tamanoAudiencia: number;
  entregados: number;
  aperturas: number;
  clics: number;
  rebotes: number;
  bajas: number;
  spam: number;
  notas: string | null;
  cliente: { id: string; name: string };
}

interface Cliente { id: string; name: string; }

const PLATAFORMAS = [
  { id: 'MAILCHIMP', nombre: 'Mailchimp', color: 'bg-yellow-100 text-yellow-700' },
  { id: 'ACTIVECAMPAIGN', nombre: 'ActiveCampaign', color: 'bg-blue-100 text-blue-700' },
  { id: 'KLAVIYO', nombre: 'Klaviyo', color: 'bg-green-100 text-green-700' },
  { id: 'BREVO', nombre: 'Brevo', color: 'bg-indigo-100 text-indigo-700' }
];

const ESTADOS = [
  { id: 'ENVIADA', nombre: 'Enviada', color: 'bg-green-100 text-green-700' },
  { id: 'PROGRAMADA', nombre: 'Programada', color: 'bg-blue-100 text-blue-700' },
  { id: 'BORRADOR', nombre: 'Borrador', color: 'bg-slate-100 text-slate-700' }
];

export default function MailingPage() {
  const { usuario } = useAuth();
  const [campanas, setCampanas] = useState<CampanaMailing[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlataforma, setFilterPlataforma] = useState('todas');
  const [filterEstado, setFilterEstado] = useState('todas');
  const [showModal, setShowModal] = useState(false);
  const [editingCampana, setEditingCampana] = useState<CampanaMailing | null>(null);
  const [selectedCampana, setSelectedCampana] = useState<CampanaMailing | null>(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [campRes, cliRes] = await Promise.all([
        fetch('/api/dashboard?tipo=mailing'),
        fetch('/api/clientes')
      ]);
      if (campRes.ok) setCampanas(await campRes.json());
      if (cliRes.ok) setClientes(await cliRes.json());
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => new Intl.NumberFormat('es-ES').format(num);
  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  const formatPercent = (value: number, total: number) => total > 0 ? ((value / total) * 100).toFixed(1) : '0';

  const getPlataformaStyle = (plat: string) => PLATAFORMAS.find(p => p.id === plat)?.color || 'bg-slate-100 text-slate-700';
  const getPlataformaNombre = (plat: string) => PLATAFORMAS.find(p => p.id === plat)?.nombre || plat;
  const getEstadoStyle = (est: string) => ESTADOS.find(e => e.id === est)?.color || 'bg-slate-100 text-slate-700';
  const getEstadoNombre = (est: string) => ESTADOS.find(e => e.id === est)?.nombre || est;

  const filteredCampanas = campanas.filter(c => {
    const matchSearch = c.nombreInterno.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        c.cliente.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchPlataforma = filterPlataforma === 'todas' || c.plataforma === filterPlataforma;
    const matchEstado = filterEstado === 'todas' || c.estado === filterEstado;
    return matchSearch && matchPlataforma && matchEstado;
  });

  // Calcular totales
  const campanasEnviadas = campanas.filter(c => c.estado === 'ENVIADA');
  const totalEnviados = campanasEnviadas.reduce((sum, c) => sum + c.entregados, 0);
  const totalAperturas = campanasEnviadas.reduce((sum, c) => sum + c.aperturas, 0);
  const totalClics = campanasEnviadas.reduce((sum, c) => sum + c.clics, 0);
  const tasaApertura = totalEnviados > 0 ? ((totalAperturas / totalEnviados) * 100).toFixed(1) : '0';
  const tasaClics = totalAperturas > 0 ? ((totalClics / totalAperturas) * 100).toFixed(1) : '0';

  if (loading) {
    return <div className="flex justify-center items-center h-96"><p className="text-xl text-blue-500 animate-pulse">Cargando campañas...</p></div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Mail className="text-blue-500" /> Email Marketing
          </h1>
          <p className="text-gray-500 text-sm">Gestión de campañas de correo electrónico</p>
        </div>
        <button onClick={() => { setEditingCampana(null); setShowModal(true); }} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700">
          <Plus size={18} /> Nueva Campaña
        </button>
      </div>

      {/* Dashboard Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase">Campañas</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{campanas.length}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-xl"><Mail size={24} className="text-blue-600" /></div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase">Enviadas</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{campanasEnviadas.length}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-xl"><Send size={24} className="text-green-600" /></div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase">Emails Enviados</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{formatNumber(totalEnviados)}</p>
            </div>
            <div className="p-3 bg-slate-100 rounded-xl"><Users size={24} className="text-slate-600" /></div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase">Tasa Apertura</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">{tasaApertura}%</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-xl"><Eye size={24} className="text-purple-600" /></div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase">Tasa Clics</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">{tasaClics}%</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-xl"><MousePointer2 size={24} className="text-orange-600" /></div>
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
              <th className="px-4 py-3 text-center font-bold text-slate-600">Audiencia</th>
              <th className="px-4 py-3 text-center font-bold text-slate-600">Aperturas</th>
              <th className="px-4 py-3 text-center font-bold text-slate-600">Clics</th>
              <th className="px-4 py-3 text-center font-bold text-slate-600">Fecha</th>
              <th className="px-4 py-3 text-center font-bold text-slate-600">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredCampanas.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-12 text-center text-slate-400"><Mail size={32} className="mx-auto mb-2 opacity-30" />No hay campañas</td></tr>
            ) : filteredCampanas.map(c => (
              <tr key={c.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => setSelectedCampana(c)}>
                <td className="px-4 py-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getEstadoStyle(c.estado)}`}>{getEstadoNombre(c.estado)}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPlataformaStyle(c.plataforma)}`}>{getPlataformaNombre(c.plataforma)}</span>
                </td>
                <td className="px-4 py-3">
                  <p className="font-bold text-slate-900">{c.nombreInterno}</p>
                  <p className="text-xs text-slate-500">{c.cliente.name}</p>
                </td>
                <td className="px-4 py-3 text-center">
                  <p className="font-medium">{formatNumber(c.tamanoAudiencia)}</p>
                </td>
                <td className="px-4 py-3 text-center">
                  {c.estado === 'ENVIADA' ? (
                    <p className="font-medium text-purple-600">{formatPercent(c.aperturas, c.entregados)}%</p>
                  ) : '-'}
                </td>
                <td className="px-4 py-3 text-center">
                  {c.estado === 'ENVIADA' ? (
                    <p className="font-medium text-orange-600">{formatPercent(c.clics, c.aperturas)}%</p>
                  ) : '-'}
                </td>
                <td className="px-4 py-3 text-center text-sm text-slate-500">
                  {c.fechaEnvio ? formatDate(c.fechaEnvio) : '-'}
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex justify-center gap-1">
                    <button onClick={(e) => { e.stopPropagation(); setSelectedCampana(c); }} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"><Eye size={16} /></button>
                    <button onClick={(e) => { e.stopPropagation(); setEditingCampana(c); setShowModal(true); }} className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded"><Edit size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Modal Detalle */}
      {selectedCampana && (
        <ModalDetalle campana={selectedCampana} onClose={() => setSelectedCampana(null)} />
      )}

      {/* Modal Crear/Editar */}
      {showModal && (
        <ModalCampana 
          campana={editingCampana} 
          clientes={clientes} 
          onClose={() => setShowModal(false)} 
          onSave={() => { fetchData(); setShowModal(false); }} 
        />
      )}
    </div>
  );
}

// Modal Detalle
function ModalDetalle({ campana, onClose }: { campana: CampanaMailing; onClose: () => void }) {
  const formatNumber = (num: number) => new Intl.NumberFormat('es-ES').format(num);
  const formatPercent = (value: number, total: number) => total > 0 ? ((value / total) * 100).toFixed(1) : '0';
  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });

  const getPlataformaNombre = (plat: string) => {
    const plats: Record<string, string> = { MAILCHIMP: 'Mailchimp', ACTIVECAMPAIGN: 'ActiveCampaign', KLAVIYO: 'Klaviyo', BREVO: 'Brevo' };
    return plats[plat] || plat;
  };
  const getEstadoStyle = (est: string) => {
    const styles: Record<string, string> = { ENVIADA: 'bg-green-100 text-green-700', PROGRAMADA: 'bg-blue-100 text-blue-700', BORRADOR: 'bg-slate-100 text-slate-700' };
    return styles[est] || 'bg-slate-100 text-slate-700';
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl">
        <div className="p-6 border-b flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getEstadoStyle(campana.estado)}`}>{campana.estado}</span>
              <span className="text-xs text-slate-400">{getPlataformaNombre(campana.plataforma)}</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">{campana.nombreInterno}</h2>
            <p className="text-slate-500">{campana.cliente.name}</p>
            {campana.asunto && <p className="text-sm text-slate-600 mt-1">📧 {campana.asunto}</p>}
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>

        <div className="p-6 space-y-6">
          {campana.estado === 'ENVIADA' ? (
            <>
              {/* Métricas principales */}
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <p className="text-xs font-bold text-slate-500 uppercase">Entregados</p>
                  <p className="text-2xl font-bold text-green-600">{formatNumber(campana.entregados)}</p>
                  <p className="text-xs text-slate-400">de {formatNumber(campana.tamanoAudiencia)}</p>
                </Card>
                <Card>
                  <p className="text-xs font-bold text-slate-500 uppercase">Aperturas</p>
                  <p className="text-2xl font-bold text-purple-600">{formatPercent(campana.aperturas, campana.entregados)}%</p>
                  <p className="text-xs text-slate-400">{formatNumber(campana.aperturas)} emails</p>
                </Card>
                <Card>
                  <p className="text-xs font-bold text-slate-500 uppercase">Clics</p>
                  <p className="text-2xl font-bold text-orange-600">{formatPercent(campana.clics, campana.aperturas)}%</p>
                  <p className="text-xs text-slate-400">{formatNumber(campana.clics)} clics</p>
                </Card>
              </div>

              {/* Métricas negativas */}
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <p className="text-xs font-bold text-slate-500 uppercase">Rebotes</p>
                  <p className="text-xl font-bold text-red-600">{formatNumber(campana.rebotes)}</p>
                  <p className="text-xs text-slate-400">{formatPercent(campana.rebotes, campana.tamanoAudiencia)}%</p>
                </Card>
                <Card>
                  <p className="text-xs font-bold text-slate-500 uppercase">Bajas</p>
                  <p className="text-xl font-bold text-orange-600">{formatNumber(campana.bajas)}</p>
                  <p className="text-xs text-slate-400">{formatPercent(campana.bajas, campana.entregados)}%</p>
                </Card>
                <Card>
                  <p className="text-xs font-bold text-slate-500 uppercase">Spam</p>
                  <p className="text-xl font-bold text-red-600">{formatNumber(campana.spam)}</p>
                  <p className="text-xs text-slate-400">{formatPercent(campana.spam, campana.entregados)}%</p>
                </Card>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-slate-400">
              <Mail size={48} className="mx-auto mb-4 opacity-30" />
              <p>Las métricas estarán disponibles cuando la campaña sea enviada</p>
            </div>
          )}

          {campana.fechaEnvio && (
            <p className="text-sm text-slate-500 text-center">
              📅 {campana.estado === 'PROGRAMADA' ? 'Programada para' : 'Enviada el'}: {formatDate(campana.fechaEnvio)}
            </p>
          )}

          {campana.notas && (
            <div className="p-3 bg-slate-50 rounded-lg">
              <p className="text-xs font-bold text-slate-500 mb-1">Notas:</p>
              <p className="text-sm text-slate-600">{campana.notas}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Modal Crear/Editar
function ModalCampana({ campana, clientes, onClose, onSave }: { 
  campana: CampanaMailing | null; 
  clientes: Cliente[]; 
  onClose: () => void; 
  onSave: () => void; 
}) {
  const [form, setForm] = useState({
    clienteId: campana?.clienteId || '',
    nombreInterno: campana?.nombreInterno || '',
    asunto: campana?.asunto || '',
    plataforma: campana?.plataforma || 'MAILCHIMP',
    estado: campana?.estado || 'BORRADOR',
    fechaEnvio: campana?.fechaEnvio?.split('T')[0] || '',
    tamanoAudiencia: campana?.tamanoAudiencia?.toString() || '',
    entregados: campana?.entregados?.toString() || '0',
    aperturas: campana?.aperturas?.toString() || '0',
    clics: campana?.clics?.toString() || '0',
    rebotes: campana?.rebotes?.toString() || '0',
    bajas: campana?.bajas?.toString() || '0',
    spam: campana?.spam?.toString() || '0',
    notas: campana?.notas || ''
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await fetch('/api/dashboard?tipo=mailing', {
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
          <div>
            <label className="block text-sm font-medium mb-1">Cliente *</label>
            <select value={form.clienteId} onChange={e => setForm({ ...form, clienteId: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required>
              <option value="">Seleccionar...</option>
              {clientes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Nombre Interno *</label>
            <input type="text" value={form.nombreInterno} onChange={e => setForm({ ...form, nombreInterno: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Asunto del Email</label>
            <input type="text" value={form.asunto} onChange={e => setForm({ ...form, asunto: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Plataforma *</label>
              <select value={form.plataforma} onChange={e => setForm({ ...form, plataforma: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                <option value="MAILCHIMP">Mailchimp</option>
                <option value="ACTIVECAMPAIGN">ActiveCampaign</option>
                <option value="KLAVIYO">Klaviyo</option>
                <option value="BREVO">Brevo</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Estado</label>
              <select value={form.estado} onChange={e => setForm({ ...form, estado: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                <option value="BORRADOR">Borrador</option>
                <option value="PROGRAMADA">Programada</option>
                <option value="ENVIADA">Enviada</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Fecha Envío</label>
              <input type="date" value={form.fechaEnvio} onChange={e => setForm({ ...form, fechaEnvio: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Tamaño Audiencia</label>
              <input type="number" value={form.tamanoAudiencia} onChange={e => setForm({ ...form, tamanoAudiencia: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
            </div>
          </div>

          {form.estado === 'ENVIADA' && (
            <>
              <p className="text-sm font-bold text-slate-700 mt-4">Métricas de la campaña:</p>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">Entregados</label>
                  <input type="number" value={form.entregados} onChange={e => setForm({ ...form, entregados: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Aperturas</label>
                  <input type="number" value={form.aperturas} onChange={e => setForm({ ...form, aperturas: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Clics</label>
                  <input type="number" value={form.clics} onChange={e => setForm({ ...form, clics: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Rebotes</label>
                  <input type="number" value={form.rebotes} onChange={e => setForm({ ...form, rebotes: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Bajas</label>
                  <input type="number" value={form.bajas} onChange={e => setForm({ ...form, bajas: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Spam</label>
                  <input type="number" value={form.spam} onChange={e => setForm({ ...form, spam: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
                </div>
              </div>
            </>
          )}

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