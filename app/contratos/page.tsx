'use client';
import React, { useState, useEffect } from 'react';
import {
  FileText, Plus, Search, TrendingUp, Calendar, AlertTriangle,
  Edit, DollarSign, Repeat, Building2, Pause, Play, X, Package
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../context/AuthContext';

interface Servicio {
  id: string;
  codigo: string;
  nombre: string;
  categoria: string;
  precioBase: number | null;
}

interface Contrato {
  id: string;
  clienteId: string;
  servicioId: string;
  nombre: string | null;
  importeMensual: number;
  periodicidad: string;
  fechaInicio: string;
  fechaFin: string | null;
  fechaRenovacion: string | null;
  autoRenovar: boolean;
  estado: string;
  notas: string | null;
  cliente: { id: string; name: string };
  servicio: { id: string; nombre: string; categoria: string };
}

interface Dashboard {
  totalContratos: number;
  contratosPausados: number;
  mrrTotal: number;
  arrTotal: number;
  proximosVencer: Contrato[];
  porCategoria: Record<string, { count: number; mrr: number }>;
}

interface Cliente { id: string; name: string; }

const CATEGORIAS = [
  { id: 'SEO', nombre: 'SEO', color: 'bg-green-100 text-green-700' },
  { id: 'SOCIAL_MEDIA', nombre: 'Social Media', color: 'bg-blue-100 text-blue-700' },
  { id: 'MANTENIMIENTO', nombre: 'Mantenimiento', color: 'bg-orange-100 text-orange-700' },
  { id: 'DISENO', nombre: 'Diseño', color: 'bg-purple-100 text-purple-700' },
  { id: 'PUBLICIDAD', nombre: 'Publicidad', color: 'bg-red-100 text-red-700' },
  { id: 'OTROS', nombre: 'Otros', color: 'bg-slate-100 text-slate-700' }
];

export default function ContratosPage() {
  const { usuario } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'contratos' | 'servicios'>('dashboard');
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCliente, setFilterCliente] = useState('todos');
  const [filterEstado, setFilterEstado] = useState('ACTIVO');
  const [showModalContrato, setShowModalContrato] = useState(false);
  const [showModalServicio, setShowModalServicio] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  const isAdmin = usuario?.role === 'ADMIN' || usuario?.role === 'SUPERADMIN';

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [dashRes, contRes, servRes, cliRes] = await Promise.all([
        fetch('/api/clientes?resource=contratos&dashboard=true'),
        fetch('/api/clientes?resource=contratos'),
        fetch('/api/clientes?resource=servicios'),
        fetch('/api/clientes')
      ]);
      if (dashRes.ok) setDashboard(await dashRes.json());
      if (contRes.ok) setContratos(await contRes.json());
      if (servRes.ok) setServicios(await servRes.json());
      if (cliRes.ok) setClientes(await cliRes.json());
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);
  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  const getDaysUntil = (dateStr: string) => Math.ceil((new Date(dateStr).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  const getCategoriaStyle = (cat: string) => CATEGORIAS.find(c => c.id === cat)?.color || 'bg-slate-100 text-slate-700';
  const getCategoriaNombre = (cat: string) => CATEGORIAS.find(c => c.id === cat)?.nombre || cat;

  const getEstadoBadge = (estado: string) => {
    const badges: Record<string, JSX.Element> = {
      'ACTIVO': <Badge variant="success">Activo</Badge>,
      'PAUSADO': <Badge variant="warning">Pausado</Badge>,
      'CANCELADO': <Badge variant="error">Cancelado</Badge>,
      'FINALIZADO': <Badge variant="neutral">Finalizado</Badge>
    };
    return badges[estado] || <Badge variant="neutral">{estado}</Badge>;
  };

  const filteredContratos = contratos.filter(c => {
    const matchSearch = c.cliente.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        c.servicio.nombre.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCliente = filterCliente === 'todos' || c.clienteId === filterCliente;
    const matchEstado = filterEstado === 'todos' || c.estado === filterEstado;
    return matchSearch && matchCliente && matchEstado;
  });

  if (loading) {
    return <div className="flex justify-center items-center h-96"><p className="text-xl text-blue-500 animate-pulse">Cargando contratos...</p></div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Contratos y Servicios</h1>
          <p className="text-gray-500 text-sm">Gestión de servicios recurrentes</p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <button onClick={() => { setEditingItem(null); setShowModalServicio(true); }} className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200">
              <Package size={18} /> Servicio
            </button>
            <button onClick={() => { setEditingItem(null); setShowModalContrato(true); }} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <Plus size={18} /> Contrato
            </button>
          </div>
        )}
      </div>

      <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
          { id: 'contratos', label: 'Contratos', icon: FileText },
          { id: 'servicios', label: 'Servicios', icon: Package }
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === tab.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            <tab.icon size={16} /> {tab.label}
          </button>
        ))}
      </div>

      {/* DASHBOARD */}
      {activeTab === 'dashboard' && dashboard && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase">MRR</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">{formatCurrency(dashboard.mrrTotal)}</p>
                  <p className="text-xs text-slate-400">Ingresos mensuales</p>
                </div>
                <div className="p-3 bg-green-100 rounded-xl"><DollarSign size={24} className="text-green-600" /></div>
              </div>
            </Card>
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase">ARR</p>
                  <p className="text-2xl font-bold text-blue-600 mt-1">{formatCurrency(dashboard.arrTotal)}</p>
                  <p className="text-xs text-slate-400">Ingresos anuales</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-xl"><TrendingUp size={24} className="text-blue-600" /></div>
              </div>
            </Card>
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase">Contratos Activos</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{dashboard.totalContratos}</p>
                  <p className="text-xs text-slate-400">{dashboard.contratosPausados} pausados</p>
                </div>
                <div className="p-3 bg-slate-100 rounded-xl"><FileText size={24} className="text-slate-600" /></div>
              </div>
            </Card>
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase">Por Renovar</p>
                  <p className={`text-2xl font-bold mt-1 ${dashboard.proximosVencer.length > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                    {dashboard.proximosVencer.length}
                  </p>
                  <p className="text-xs text-slate-400">Próximos 30 días</p>
                </div>
                <div className={`p-3 rounded-xl ${dashboard.proximosVencer.length > 0 ? 'bg-orange-100' : 'bg-green-100'}`}>
                  <Calendar size={24} className={dashboard.proximosVencer.length > 0 ? 'text-orange-600' : 'text-green-600'} />
                </div>
              </div>
            </Card>
          </div>

          {/* MRR por categoría */}
          <Card title="Ingresos por Categoría">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {CATEGORIAS.map(cat => {
                const data = dashboard.porCategoria[cat.id] || { count: 0, mrr: 0 };
                return (
                  <div key={cat.id} className="p-4 rounded-lg border border-slate-200">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${cat.color}`}>{cat.nombre}</span>
                    <p className="text-2xl font-bold text-slate-900 mt-2">{formatCurrency(data.mrr)}</p>
                    <p className="text-xs text-slate-500">{data.count} contratos</p>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Próximos a renovar */}
          {dashboard.proximosVencer.length > 0 && (
            <Card title="⚠️ Contratos por Renovar (30 días)" className="border-l-4 border-orange-500">
              <div className="space-y-2">
                {dashboard.proximosVencer.map((c: any) => (
                  <div key={c.id} className="flex justify-between items-center bg-orange-50 p-3 rounded-lg">
                    <div>
                      <p className="font-medium text-slate-900">{c.cliente.name}</p>
                      <p className="text-sm text-slate-500">{c.servicio.nombre}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-orange-600">{formatCurrency(c.importeMensual)}/mes</p>
                      <p className="text-xs text-slate-500">
                        {c.fechaRenovacion ? formatDate(c.fechaRenovacion) : formatDate(c.fechaFin)} 
                        ({getDaysUntil(c.fechaRenovacion || c.fechaFin)} días)
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* CONTRATOS */}
      {activeTab === 'contratos' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm" />
            </div>
            <select value={filterCliente} onChange={(e) => setFilterCliente(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
              <option value="todos">Todos los clientes</option>
              {clientes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select value={filterEstado} onChange={(e) => setFilterEstado(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
              <option value="todos">Todos los estados</option>
              <option value="ACTIVO">Activos</option>
              <option value="PAUSADO">Pausados</option>
              <option value="CANCELADO">Cancelados</option>
            </select>
          </div>
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-bold text-slate-600">Cliente</th>
                    <th className="px-4 py-3 text-left font-bold text-slate-600">Servicio</th>
                    <th className="px-4 py-3 text-center font-bold text-slate-600">Categoría</th>
                    <th className="px-4 py-3 text-right font-bold text-slate-600">Importe</th>
                    <th className="px-4 py-3 text-center font-bold text-slate-600">Periodicidad</th>
                    <th className="px-4 py-3 text-center font-bold text-slate-600">Inicio</th>
                    <th className="px-4 py-3 text-center font-bold text-slate-600">Estado</th>
                    <th className="px-4 py-3 text-center font-bold text-slate-600">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredContratos.length === 0 ? (
                    <tr><td colSpan={8} className="px-4 py-12 text-center text-slate-400"><FileText size={32} className="mx-auto mb-2 opacity-30" />No hay contratos</td></tr>
                  ) : filteredContratos.map(c => (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium">{c.cliente.name}</td>
                      <td className="px-4 py-3">{c.servicio.nombre}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getCategoriaStyle(c.servicio.categoria)}`}>
                          {getCategoriaNombre(c.servicio.categoria)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-green-600">{formatCurrency(c.importeMensual)}</td>
                      <td className="px-4 py-3 text-center">{c.periodicidad}</td>
                      <td className="px-4 py-3 text-center">{formatDate(c.fechaInicio)}</td>
                      <td className="px-4 py-3 text-center">{getEstadoBadge(c.estado)}</td>
                      <td className="px-4 py-3 text-center">
                        <button onClick={() => { setEditingItem(c); setShowModalContrato(true); }} className="p-1 text-slate-400 hover:text-blue-600"><Edit size={16} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* SERVICIOS */}
      {activeTab === 'servicios' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {servicios.length === 0 ? (
            <div className="col-span-full text-center py-12 text-slate-400">
              <Package size={32} className="mx-auto mb-2 opacity-30" />
              <p>No hay servicios</p>
            </div>
          ) : servicios.map(s => (
            <Card key={s.id}>
              <div className="flex justify-between items-start">
                <div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getCategoriaStyle(s.categoria)}`}>
                    {getCategoriaNombre(s.categoria)}
                  </span>
                  <h3 className="font-bold text-slate-900 mt-2">{s.nombre}</h3>
                  <p className="text-xs text-slate-500">Código: {s.codigo}</p>
                </div>
                <button onClick={() => { setEditingItem(s); setShowModalServicio(true); }} className="p-1 text-slate-400 hover:text-blue-600"><Edit size={16} /></button>
              </div>
              {s.precioBase && (
                <p className="mt-3 text-lg font-bold text-blue-600">{formatCurrency(s.precioBase)}<span className="text-sm text-slate-400 font-normal">/mes base</span></p>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* MODALES */}
      {showModalServicio && <ModalServicio servicio={editingItem} onClose={() => setShowModalServicio(false)} onSave={() => { fetchData(); setShowModalServicio(false); }} />}
      {showModalContrato && <ModalContrato contrato={editingItem} clientes={clientes} servicios={servicios} onClose={() => setShowModalContrato(false)} onSave={() => { fetchData(); setShowModalContrato(false); }} />}
    </div>
  );
}

// MODAL SERVICIO
function ModalServicio({ servicio, onClose, onSave }: { servicio: any; onClose: () => void; onSave: () => void }) {
  const [form, setForm] = useState({
    codigo: servicio?.codigo || '',
    nombre: servicio?.nombre || '',
    categoria: servicio?.categoria || 'OTROS',
    precioBase: servicio?.precioBase?.toString() || ''
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await fetch('/api/clientes?resource=servicios', {
      method: servicio ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(servicio ? { id: servicio.id, ...form } : form)
    });
    setSaving(false);
    onSave();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="p-6 border-b"><h2 className="text-xl font-bold">{servicio ? 'Editar' : 'Nuevo'} Servicio</h2></div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Código *</label>
              <input type="text" value={form.codigo} onChange={e => setForm({ ...form, codigo: e.target.value.toUpperCase() })} className="w-full px-3 py-2 border rounded-lg" placeholder="SEO-BASICO" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Categoría *</label>
              <select value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                {CATEGORIAS.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Nombre *</label>
            <input type="text" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Precio Base €/mes</label>
            <input type="number" step="0.01" value={form.precioBase} onChange={e => setForm({ ...form, precioBase: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="Opcional" />
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

// MODAL CONTRATO
function ModalContrato({ contrato, clientes, servicios, onClose, onSave }: { contrato: any; clientes: any[]; servicios: any[]; onClose: () => void; onSave: () => void }) {
  const [form, setForm] = useState({
    clienteId: contrato?.clienteId || '',
    servicioId: contrato?.servicioId || '',
    importeMensual: contrato?.importeMensual?.toString() || '',
    periodicidad: contrato?.periodicidad || 'MENSUAL',
    fechaInicio: contrato?.fechaInicio?.split('T')[0] || new Date().toISOString().split('T')[0],
    fechaRenovacion: contrato?.fechaRenovacion?.split('T')[0] || '',
    autoRenovar: contrato?.autoRenovar ?? true,
    estado: contrato?.estado || 'ACTIVO',
    notas: contrato?.notas || ''
  });
  const [saving, setSaving] = useState(false);

  const handleServicioChange = (servicioId: string) => {
    const servicio = servicios.find(s => s.id === servicioId);
    setForm({
      ...form,
      servicioId,
      importeMensual: servicio?.precioBase?.toString() || form.importeMensual
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await fetch('/api/clientes?resource=contratos', {
      method: contrato ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(contrato ? { id: contrato.id, ...form } : form)
    });
    setSaving(false);
    onSave();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
        <div className="p-6 border-b"><h2 className="text-xl font-bold">{contrato ? 'Editar' : 'Nuevo'} Contrato</h2></div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Cliente *</label>
              <select value={form.clienteId} onChange={e => setForm({ ...form, clienteId: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required>
                <option value="">Seleccionar...</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Servicio *</label>
              <select value={form.servicioId} onChange={e => handleServicioChange(e.target.value)} className="w-full px-3 py-2 border rounded-lg" required>
                <option value="">Seleccionar...</option>
                {servicios.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Importe €*</label>
              <input type="number" step="0.01" value={form.importeMensual} onChange={e => setForm({ ...form, importeMensual: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Periodicidad</label>
              <select value={form.periodicidad} onChange={e => setForm({ ...form, periodicidad: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                <option value="MENSUAL">Mensual</option>
                <option value="TRIMESTRAL">Trimestral</option>
                <option value="SEMESTRAL">Semestral</option>
                <option value="ANUAL">Anual</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Fecha Inicio *</label>
              <input type="date" value={form.fechaInicio} onChange={e => setForm({ ...form, fechaInicio: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Fecha Renovación</label>
              <input type="date" value={form.fechaRenovacion} onChange={e => setForm({ ...form, fechaRenovacion: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
            </div>
          </div>
          {contrato && (
            <div>
              <label className="block text-sm font-medium mb-1">Estado</label>
              <select value={form.estado} onChange={e => setForm({ ...form, estado: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                <option value="ACTIVO">Activo</option>
                <option value="PAUSADO">Pausado</option>
                <option value="CANCELADO">Cancelado</option>
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1">Notas</label>
            <textarea value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })} className="w-full px-3 py-2 border rounded-lg" rows={2} />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={form.autoRenovar} onChange={e => setForm({ ...form, autoRenovar: e.target.checked })} id="autoRenovar" />
            <label htmlFor="autoRenovar" className="text-sm">Auto-renovar contrato</label>
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