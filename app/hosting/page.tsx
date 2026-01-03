'use client';
import React, { useState, useEffect } from 'react';
import {
  Server, Globe, Shield, Search, AlertTriangle,
  TrendingUp, TrendingDown, DollarSign, Building2,
  ExternalLink, Edit, Package
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../context/AuthContext';

interface Proveedor {
  id: string;
  nombre: string;
  tipo: string;
  website?: string;
  activo: boolean;
  _count?: { hostings: number; dominios: number };
}

interface PlanHosting {
  id: string;
  nombre: string;
  tipo: string;
  descripcion?: string;
  espacio?: string;
  emails?: number;
  incluyeDominio: boolean;
  precioCoste: number;
  precioSugerido?: number;
  activo: boolean;
  orden: number;
}

interface Hosting {
  id: string;
  clienteId: string;
  proveedorId: string;
  nombre: string;
  tipoHosting: string;
  importeCoste: number;
  importeVenta: number;
  periodicidad: string;
  fechaContratacion: string;
  fechaVencimiento: string;
  estado: string;
  cliente: { id: string; name: string };
  proveedor: { id: string; nombre: string };
  dominios: { id: string; nombre: string; extension: string }[];
}

interface Dominio {
  id: string;
  clienteId: string;
  proveedorId: string;
  nombre: string;
  extension: string;
  tieneSSL: boolean;
  importeCoste: number;
  importeVenta: number;
  fechaVencimiento: string;
  estado: string;
  cliente: { id: string; name: string };
  proveedor: { id: string; nombre: string };
}

interface Dashboard {
  totalHostings: number;
  totalDominios: number;
  ingresoAnualTotal: number;
  costeAnualTotal: number;
  margenTotal: number;
  totalAlertas: number;
  alertas: { hostings: any[]; dominios: any[]; ssl: any[] };
}

interface Cliente { id: string; name: string; }

export default function HostingPage() {
  const { usuario } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'hostings' | 'dominios' | 'proveedores' | 'planes'>('dashboard');
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [hostings, setHostings] = useState<Hosting[]>([]);
  const [dominios, setDominios] = useState<Dominio[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [planes, setPlanes] = useState<PlanHosting[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCliente, setFilterCliente] = useState('todos');
  const [showModalHosting, setShowModalHosting] = useState(false);
  const [showModalDominio, setShowModalDominio] = useState(false);
  const [showModalProveedor, setShowModalProveedor] = useState(false);
  const [showModalPlan, setShowModalPlan] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  const isAdmin = usuario?.role === 'ADMIN' || usuario?.role === 'SUPERADMIN';

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [dashRes, hostRes, domRes, provRes, cliRes, planRes] = await Promise.all([
        fetch('/api/hosting?entity=dashboard'),
        fetch('/api/hosting?entity=hostings'),
        fetch('/api/hosting?entity=dominios'),
        fetch('/api/hosting?entity=proveedores'),
        fetch('/api/clientes'),
        fetch('/api/hosting?entity=planes')
      ]);
      if (dashRes.ok) setDashboard(await dashRes.json());
      if (hostRes.ok) setHostings(await hostRes.json());
      if (domRes.ok) setDominios(await domRes.json());
      if (provRes.ok) setProveedores(await provRes.json());
      if (cliRes.ok) setClientes(await cliRes.json());
      if (planRes.ok) setPlanes(await planRes.json());
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);
  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  const getDaysUntil = (dateStr: string) => Math.ceil((new Date(dateStr).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  const getEstadoBadge = (estado: string) => {
    const badges: Record<string, JSX.Element> = {
      'ACTIVO': <Badge variant="success">Activo</Badge>,
      'PENDIENTE_RENOVACION': <Badge variant="warning">Pendiente</Badge>,
      'SUSPENDIDO': <Badge variant="error">Suspendido</Badge>,
      'CANCELADO': <Badge variant="neutral">Cancelado</Badge>,
      'EXPIRADO': <Badge variant="error">Expirado</Badge>
    };
    return badges[estado] || <Badge variant="neutral">{estado}</Badge>;
  };

  const filteredHostings = hostings.filter(h => {
    const matchSearch = h.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || h.cliente.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCliente = filterCliente === 'todos' || h.clienteId === filterCliente;
    return matchSearch && matchCliente;
  });

  const filteredDominios = dominios.filter(d => {
    const matchSearch = d.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || d.cliente.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCliente = filterCliente === 'todos' || d.clienteId === filterCliente;
    return matchSearch && matchCliente;
  });

  const planesHosting = planes.filter(p => p.tipo === 'HOSTING' && p.activo);
  const planesDominio = planes.filter(p => p.tipo === 'DOMINIO' && p.activo);

  if (loading) {
    return <div className="flex justify-center items-center h-96"><p className="text-xl text-blue-500 animate-pulse">Cargando...</p></div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Hosting y Dominios</h1>
          <p className="text-gray-500 text-sm">Gestión centralizada de servicios</p>
        </div>
        {isAdmin && (
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => { setEditingItem(null); setShowModalPlan(true); }} className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
              <Package size={18} /> Plan
            </button>
            <button onClick={() => { setEditingItem(null); setShowModalProveedor(true); }} className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200">
              <Building2 size={18} /> Proveedor
            </button>
            <button onClick={() => { setEditingItem(null); setShowModalHosting(true); }} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <Server size={18} /> Hosting
            </button>
            <button onClick={() => { setEditingItem(null); setShowModalDominio(true); }} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
              <Globe size={18} /> Dominio
            </button>
          </div>
        )}
      </div>

      <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
          { id: 'hostings', label: 'Hostings', icon: Server },
          { id: 'dominios', label: 'Dominios', icon: Globe },
          { id: 'proveedores', label: 'Proveedores', icon: Building2 },
          { id: 'planes', label: 'Planes', icon: Package }
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
                  <p className="text-xs font-bold text-slate-500 uppercase">Ingresos Anuales</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">{formatCurrency(dashboard.ingresoAnualTotal)}</p>
                  <p className="text-xs text-slate-400">{dashboard.totalHostings} hostings + {dashboard.totalDominios} dominios</p>
                </div>
                <div className="p-3 bg-green-100 rounded-xl"><TrendingUp size={24} className="text-green-600" /></div>
              </div>
            </Card>
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase">Costes Anuales</p>
                  <p className="text-2xl font-bold text-red-600 mt-1">{formatCurrency(dashboard.costeAnualTotal)}</p>
                  <p className="text-xs text-slate-400">Pagado a proveedores</p>
                </div>
                <div className="p-3 bg-red-100 rounded-xl"><TrendingDown size={24} className="text-red-600" /></div>
              </div>
            </Card>
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase">Margen Anual</p>
                  <p className={`text-2xl font-bold mt-1 ${dashboard.margenTotal >= 0 ? 'text-blue-600' : 'text-red-600'}`}>{formatCurrency(dashboard.margenTotal)}</p>
                  <p className="text-xs text-slate-400">{dashboard.ingresoAnualTotal > 0 ? `${Math.round((dashboard.margenTotal / dashboard.ingresoAnualTotal) * 100)}% margen` : '0%'}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-xl"><DollarSign size={24} className="text-blue-600" /></div>
              </div>
            </Card>
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase">Alertas</p>
                  <p className={`text-2xl font-bold mt-1 ${dashboard.totalAlertas > 0 ? 'text-orange-600' : 'text-green-600'}`}>{dashboard.totalAlertas}</p>
                  <p className="text-xs text-slate-400">Vencimientos próx. 30 días</p>
                </div>
                <div className={`p-3 rounded-xl ${dashboard.totalAlertas > 0 ? 'bg-orange-100' : 'bg-green-100'}`}>
                  <AlertTriangle size={24} className={dashboard.totalAlertas > 0 ? 'text-orange-600' : 'text-green-600'} />
                </div>
              </div>
            </Card>
          </div>
          {dashboard.totalAlertas > 0 && (
            <Card title="⚠️ Próximos Vencimientos (30 días)" className="border-l-4 border-orange-500">
              <div className="space-y-4">
                {dashboard.alertas.hostings.length > 0 && (
                  <div>
                    <h4 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2"><Server size={16} /> Hostings</h4>
                    {dashboard.alertas.hostings.map((h: any) => (
                      <div key={h.id} className="flex justify-between items-center bg-orange-50 p-3 rounded-lg mb-2">
                        <span className="font-medium">{h.nombre} <span className="text-slate-500">({h.cliente.name})</span></span>
                        <span className="text-orange-600 text-sm">{formatDate(h.fechaVencimiento)} - {getDaysUntil(h.fechaVencimiento)} días</span>
                      </div>
                    ))}
                  </div>
                )}
                {dashboard.alertas.dominios.length > 0 && (
                  <div>
                    <h4 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2"><Globe size={16} /> Dominios</h4>
                    {dashboard.alertas.dominios.map((d: any) => (
                      <div key={d.id} className="flex justify-between items-center bg-orange-50 p-3 rounded-lg mb-2">
                        <span className="font-medium">{d.nombre}{d.extension} <span className="text-slate-500">({d.cliente.name})</span></span>
                        <span className="text-orange-600 text-sm">{formatDate(d.fechaVencimiento)} - {getDaysUntil(d.fechaVencimiento)} días</span>
                      </div>
                    ))}
                  </div>
                )}
                {dashboard.alertas.ssl.length > 0 && (
                  <div>
                    <h4 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2"><Shield size={16} /> SSL</h4>
                    {dashboard.alertas.ssl.map((s: any) => (
                      <div key={s.id} className="flex justify-between items-center bg-red-50 p-3 rounded-lg mb-2">
                        <span className="font-medium">{s.nombre}{s.extension}</span>
                        <span className="text-red-600 text-sm">SSL: {formatDate(s.fechaVencimientoSSL)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* HOSTINGS */}
      {activeTab === 'hostings' && (
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
          </div>
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-bold text-slate-600">Cliente</th>
                    <th className="px-4 py-3 text-left font-bold text-slate-600">Hosting</th>
                    <th className="px-4 py-3 text-left font-bold text-slate-600">Tipo</th>
                    <th className="px-4 py-3 text-center font-bold text-slate-600">Vencimiento</th>
                    <th className="px-4 py-3 text-right font-bold text-slate-600">Coste</th>
                    <th className="px-4 py-3 text-right font-bold text-slate-600">Venta</th>
                    <th className="px-4 py-3 text-center font-bold text-slate-600">Estado</th>
                    <th className="px-4 py-3 text-center font-bold text-slate-600">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredHostings.length === 0 ? (
                    <tr><td colSpan={8} className="px-4 py-12 text-center text-slate-400"><Server size={32} className="mx-auto mb-2 opacity-30" />No hay hostings</td></tr>
                  ) : filteredHostings.map(h => (
                    <tr key={h.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium">{h.cliente.name}</td>
                      <td className="px-4 py-3">{h.nombre}</td>
                      <td className="px-4 py-3"><Badge variant="blue">{h.tipoHosting}</Badge></td>
                      <td className="px-4 py-3 text-center">{formatDate(h.fechaVencimiento)}</td>
                      <td className="px-4 py-3 text-right text-red-600">{formatCurrency(h.importeCoste)}</td>
                      <td className="px-4 py-3 text-right text-green-600">{formatCurrency(h.importeVenta)}</td>
                      <td className="px-4 py-3 text-center">{getEstadoBadge(h.estado)}</td>
                      <td className="px-4 py-3 text-center">
                        <button onClick={() => { setEditingItem(h); setShowModalHosting(true); }} className="p-1 text-slate-400 hover:text-blue-600"><Edit size={16} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* DOMINIOS */}
      {activeTab === 'dominios' && (
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
          </div>
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-bold text-slate-600">Cliente</th>
                    <th className="px-4 py-3 text-left font-bold text-slate-600">Dominio</th>
                    <th className="px-4 py-3 text-center font-bold text-slate-600">SSL</th>
                    <th className="px-4 py-3 text-center font-bold text-slate-600">Vencimiento</th>
                    <th className="px-4 py-3 text-right font-bold text-slate-600">Coste</th>
                    <th className="px-4 py-3 text-right font-bold text-slate-600">Venta</th>
                    <th className="px-4 py-3 text-center font-bold text-slate-600">Estado</th>
                    <th className="px-4 py-3 text-center font-bold text-slate-600">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredDominios.length === 0 ? (
                    <tr><td colSpan={8} className="px-4 py-12 text-center text-slate-400"><Globe size={32} className="mx-auto mb-2 opacity-30" />No hay dominios</td></tr>
                  ) : filteredDominios.map(d => (
                    <tr key={d.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium">{d.cliente.name}</td>
                      <td className="px-4 py-3">{d.nombre}<span className="text-blue-600">{d.extension}</span></td>
                      <td className="px-4 py-3 text-center">{d.tieneSSL ? <Shield size={16} className="mx-auto text-green-500" /> : '-'}</td>
                      <td className="px-4 py-3 text-center">{formatDate(d.fechaVencimiento)}</td>
                      <td className="px-4 py-3 text-right text-red-600">{formatCurrency(d.importeCoste)}</td>
                      <td className="px-4 py-3 text-right text-green-600">{formatCurrency(d.importeVenta)}</td>
                      <td className="px-4 py-3 text-center">{getEstadoBadge(d.estado)}</td>
                      <td className="px-4 py-3 text-center">
                        <button onClick={() => { setEditingItem(d); setShowModalDominio(true); }} className="p-1 text-slate-400 hover:text-blue-600"><Edit size={16} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* PROVEEDORES */}
      {activeTab === 'proveedores' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {proveedores.length === 0 ? (
            <div className="col-span-full text-center py-12 text-slate-400">
              <Building2 size={32} className="mx-auto mb-2 opacity-30" />
              <p>No hay proveedores</p>
            </div>
          ) : proveedores.map(p => (
            <Card key={p.id}>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-slate-900">{p.nombre}</h3>
                  <Badge variant={p.tipo === 'AMBOS' ? 'blue' : p.tipo === 'HOSTING' ? 'success' : 'warning'}>{p.tipo}</Badge>
                </div>
                <button onClick={() => { setEditingItem(p); setShowModalProveedor(true); }} className="p-1 text-slate-400 hover:text-blue-600"><Edit size={16} /></button>
              </div>
              {p.website && <a href={p.website} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline flex items-center gap-1 mt-2"><ExternalLink size={14} />{p.website}</a>}
              <div className="mt-3 pt-3 border-t text-sm text-slate-500">{p._count?.hostings || 0} hostings · {p._count?.dominios || 0} dominios</div>
            </Card>
          ))}
        </div>
      )}

      {/* PLANES */}
      {activeTab === 'planes' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2"><Server size={20} /> Planes de Hosting</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {planes.filter(p => p.tipo === 'HOSTING').length === 0 ? (
                <p className="text-slate-400 col-span-full">No hay planes de hosting</p>
              ) : planes.filter(p => p.tipo === 'HOSTING').map(plan => (
                <Card key={plan.id} className={!plan.activo ? 'opacity-50' : ''}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-slate-900">{plan.nombre}</h4>
                      {plan.espacio && <p className="text-sm text-slate-500">{plan.espacio}</p>}
                    </div>
                    <button onClick={() => { setEditingItem(plan); setShowModalPlan(true); }} className="p-1 text-slate-400 hover:text-blue-600"><Edit size={16} /></button>
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-blue-600">{formatCurrency(plan.precioCoste)}</span>
                    <span className="text-sm text-slate-400">/año</span>
                  </div>
                  {plan.precioSugerido && <p className="text-sm text-green-600">Sugerido: {formatCurrency(plan.precioSugerido)}</p>}
                  <div className="mt-2 flex flex-wrap gap-1">
                    {plan.emails && <Badge variant="neutral">{plan.emails} emails</Badge>}
                    {plan.incluyeDominio && <Badge variant="success">+Dominio</Badge>}
                    {!plan.activo && <Badge variant="error">Inactivo</Badge>}
                  </div>
                </Card>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2"><Globe size={20} /> Planes de Dominio</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {planes.filter(p => p.tipo === 'DOMINIO').length === 0 ? (
                <p className="text-slate-400 col-span-full">No hay planes de dominio</p>
              ) : planes.filter(p => p.tipo === 'DOMINIO').map(plan => (
                <Card key={plan.id} className={!plan.activo ? 'opacity-50' : ''}>
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-slate-900">{plan.nombre}</h4>
                    <button onClick={() => { setEditingItem(plan); setShowModalPlan(true); }} className="p-1 text-slate-400 hover:text-blue-600"><Edit size={16} /></button>
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-green-600">{formatCurrency(plan.precioCoste)}</span>
                    <span className="text-sm text-slate-400">/año</span>
                  </div>
                  {plan.precioSugerido && <p className="text-sm text-green-600">Sugerido: {formatCurrency(plan.precioSugerido)}</p>}
                  {!plan.activo && <Badge variant="error">Inactivo</Badge>}
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODALES */}
      {showModalProveedor && <ModalProveedor proveedor={editingItem} onClose={() => setShowModalProveedor(false)} onSave={() => { fetchData(); setShowModalProveedor(false); }} />}
      {showModalPlan && <ModalPlan plan={editingItem} onClose={() => setShowModalPlan(false)} onSave={() => { fetchData(); setShowModalPlan(false); }} />}
      {showModalHosting && <ModalHosting hosting={editingItem} clientes={clientes} proveedores={proveedores.filter(p => p.tipo !== 'DOMINIOS')} planes={planesHosting} onClose={() => setShowModalHosting(false)} onSave={() => { fetchData(); setShowModalHosting(false); }} />}
      {showModalDominio && <ModalDominio dominio={editingItem} clientes={clientes} proveedores={proveedores.filter(p => p.tipo !== 'HOSTING')} planes={planesDominio} onClose={() => setShowModalDominio(false)} onSave={() => { fetchData(); setShowModalDominio(false); }} />}
    </div>
  );
}

// MODAL PROVEEDOR
function ModalProveedor({ proveedor, onClose, onSave }: { proveedor: any; onClose: () => void; onSave: () => void }) {
  const [form, setForm] = useState({ nombre: proveedor?.nombre || '', tipo: proveedor?.tipo || 'AMBOS', website: proveedor?.website || '' });
  const [saving, setSaving] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await fetch('/api/hosting?entity=proveedores', { method: proveedor ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(proveedor ? { id: proveedor.id, ...form } : form) });
    setSaving(false);
    onSave();
  };
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="p-6 border-b"><h2 className="text-xl font-bold">{proveedor ? 'Editar' : 'Nuevo'} Proveedor</h2></div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div><label className="block text-sm font-medium mb-1">Nombre *</label><input type="text" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required /></div>
          <div><label className="block text-sm font-medium mb-1">Tipo *</label><select value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })} className="w-full px-3 py-2 border rounded-lg"><option value="HOSTING">Solo Hosting</option><option value="DOMINIOS">Solo Dominios</option><option value="AMBOS">Ambos</option></select></div>
          <div><label className="block text-sm font-medium mb-1">Website</label><input type="url" value={form.website} onChange={e => setForm({ ...form, website: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="https://" /></div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
            <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">{saving ? 'Guardando...' : 'Guardar'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// MODAL PLAN
function ModalPlan({ plan, onClose, onSave }: { plan: any; onClose: () => void; onSave: () => void }) {
  const [form, setForm] = useState({
    nombre: plan?.nombre || '', tipo: plan?.tipo || 'HOSTING', descripcion: plan?.descripcion || '',
    espacio: plan?.espacio || '', emails: plan?.emails?.toString() || '', incluyeDominio: plan?.incluyeDominio || false,
    precioCoste: plan?.precioCoste?.toString() || '', precioSugerido: plan?.precioSugerido?.toString() || '',
    activo: plan?.activo ?? true, orden: plan?.orden?.toString() || '0'
  });
  const [saving, setSaving] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await fetch('/api/hosting?entity=planes', { method: plan ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(plan ? { id: plan.id, ...form } : form) });
    setSaving(false);
    onSave();
  };
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
        <div className="p-6 border-b"><h2 className="text-xl font-bold">{plan ? 'Editar' : 'Nuevo'} Plan</h2></div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-1">Nombre *</label><input type="text" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required /></div>
            <div><label className="block text-sm font-medium mb-1">Tipo *</label><select value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })} className="w-full px-3 py-2 border rounded-lg"><option value="HOSTING">Hosting</option><option value="DOMINIO">Dominio</option></select></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-1">Espacio</label><input type="text" value={form.espacio} onChange={e => setForm({ ...form, espacio: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="1GB, 2+16GB..." /></div>
            <div><label className="block text-sm font-medium mb-1">Nº Emails</label><input type="number" value={form.emails} onChange={e => setForm({ ...form, emails: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-1">Precio Coste € *</label><input type="number" step="0.01" value={form.precioCoste} onChange={e => setForm({ ...form, precioCoste: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required /></div>
            <div><label className="block text-sm font-medium mb-1">Precio Sugerido €</label><input type="number" step="0.01" value={form.precioSugerido} onChange={e => setForm({ ...form, precioSugerido: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
          </div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2"><input type="checkbox" checked={form.incluyeDominio} onChange={e => setForm({ ...form, incluyeDominio: e.target.checked })} /> Incluye dominio</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={form.activo} onChange={e => setForm({ ...form, activo: e.target.checked })} /> Activo</label>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
            <button type="submit" disabled={saving} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50">{saving ? 'Guardando...' : 'Guardar'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// MODAL HOSTING
function ModalHosting({ hosting, clientes, proveedores, planes, onClose, onSave }: { hosting: any; clientes: Cliente[]; proveedores: Proveedor[]; planes: PlanHosting[]; onClose: () => void; onSave: () => void }) {
  const [form, setForm] = useState({
    clienteId: hosting?.clienteId || '', proveedorId: hosting?.proveedorId || '', nombre: hosting?.nombre || '',
    tipoHosting: hosting?.tipoHosting || 'COMPARTIDO', importeCoste: hosting?.importeCoste?.toString() || '',
    importeVenta: hosting?.importeVenta?.toString() || '', periodicidad: hosting?.periodicidad || 'ANUAL',
    fechaContratacion: hosting?.fechaContratacion?.split('T')[0] || new Date().toISOString().split('T')[0],
    fechaVencimiento: hosting?.fechaVencimiento?.split('T')[0] || '', estado: hosting?.estado || 'ACTIVO'
  });
  const [saving, setSaving] = useState(false);

  const handlePlanSelect = (planId: string) => {
    const plan = planes.find(p => p.id === planId);
    if (plan) {
      setForm({ ...form, nombre: plan.nombre, tipoHosting: 'COMPARTIDO', importeCoste: plan.precioCoste.toString(), importeVenta: plan.precioSugerido?.toString() || '' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await fetch('/api/hosting?entity=hostings', { method: hosting ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(hosting ? { id: hosting.id, ...form } : form) });
    setSaving(false);
    onSave();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl my-8">
        <div className="p-6 border-b"><h2 className="text-xl font-bold">{hosting ? 'Editar' : 'Nuevo'} Hosting</h2></div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {!hosting && planes.length > 0 && (
            <div className="p-4 bg-purple-50 rounded-lg">
              <label className="block text-sm font-medium mb-2 text-purple-700">Seleccionar Plan (opcional)</label>
              <select onChange={e => handlePlanSelect(e.target.value)} className="w-full px-3 py-2 border border-purple-200 rounded-lg">
                <option value="">-- Elegir plan para autocompletar --</option>
                {planes.map(p => <option key={p.id} value={p.id}>{p.nombre} - {p.precioCoste}€</option>)}
              </select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-1">Cliente *</label><select value={form.clienteId} onChange={e => setForm({ ...form, clienteId: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required><option value="">Seleccionar...</option>{clientes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
            <div><label className="block text-sm font-medium mb-1">Proveedor *</label><select value={form.proveedorId} onChange={e => setForm({ ...form, proveedorId: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required><option value="">Seleccionar...</option>{proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}</select></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-1">Nombre *</label><input type="text" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required /></div>
            <div><label className="block text-sm font-medium mb-1">Tipo</label><select value={form.tipoHosting} onChange={e => setForm({ ...form, tipoHosting: e.target.value })} className="w-full px-3 py-2 border rounded-lg"><option value="COMPARTIDO">Compartido</option><option value="VPS">VPS</option><option value="DEDICADO">Dedicado</option><option value="CLOUD">Cloud</option></select></div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div><label className="block text-sm font-medium mb-1">Coste € *</label><input type="number" step="0.01" value={form.importeCoste} onChange={e => setForm({ ...form, importeCoste: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required /></div>
            <div><label className="block text-sm font-medium mb-1">Venta € *</label><input type="number" step="0.01" value={form.importeVenta} onChange={e => setForm({ ...form, importeVenta: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required /></div>
            <div><label className="block text-sm font-medium mb-1">Periodicidad</label><select value={form.periodicidad} onChange={e => setForm({ ...form, periodicidad: e.target.value })} className="w-full px-3 py-2 border rounded-lg"><option value="MENSUAL">Mensual</option><option value="ANUAL">Anual</option></select></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-1">Fecha Contratación *</label><input type="date" value={form.fechaContratacion} onChange={e => setForm({ ...form, fechaContratacion: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required /></div>
            <div><label className="block text-sm font-medium mb-1">Fecha Vencimiento *</label><input type="date" value={form.fechaVencimiento} onChange={e => setForm({ ...form, fechaVencimiento: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required /></div>
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

// MODAL DOMINIO
function ModalDominio({ dominio, clientes, proveedores, planes, onClose, onSave }: { dominio: any; clientes: Cliente[]; proveedores: Proveedor[]; planes: PlanHosting[]; onClose: () => void; onSave: () => void }) {
  const [form, setForm] = useState({
    clienteId: dominio?.clienteId || '', proveedorId: dominio?.proveedorId || '',
    nombre: dominio?.nombre || '', extension: dominio?.extension || '.com', tieneSSL: dominio?.tieneSSL || false,
    importeCoste: dominio?.importeCoste?.toString() || '', importeVenta: dominio?.importeVenta?.toString() || '',
    periodicidad: dominio?.periodicidad || 'ANUAL',
    fechaRegistro: dominio?.fechaRegistro?.split('T')[0] || new Date().toISOString().split('T')[0],
    fechaVencimiento: dominio?.fechaVencimiento?.split('T')[0] || '', estado: dominio?.estado || 'ACTIVO'
  });
  const [saving, setSaving] = useState(false);

  const handlePlanSelect = (planId: string) => {
    const plan = planes.find(p => p.id === planId);
    if (plan) {
      setForm({ ...form, importeCoste: plan.precioCoste.toString(), importeVenta: plan.precioSugerido?.toString() || '' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await fetch('/api/hosting?entity=dominios', { method: dominio ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dominio ? { id: dominio.id, ...form } : form) });
    setSaving(false);
    onSave();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl my-8">
        <div className="p-6 border-b"><h2 className="text-xl font-bold">{dominio ? 'Editar' : 'Nuevo'} Dominio</h2></div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {!dominio && planes.length > 0 && (
            <div className="p-4 bg-green-50 rounded-lg">
              <label className="block text-sm font-medium mb-2 text-green-700">Seleccionar Plan (opcional)</label>
              <select onChange={e => handlePlanSelect(e.target.value)} className="w-full px-3 py-2 border border-green-200 rounded-lg">
                <option value="">-- Elegir plan para autocompletar --</option>
                {planes.map(p => <option key={p.id} value={p.id}>{p.nombre} - {p.precioCoste}€</option>)}
              </select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-1">Cliente *</label><select value={form.clienteId} onChange={e => setForm({ ...form, clienteId: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required><option value="">Seleccionar...</option>{clientes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
            <div><label className="block text-sm font-medium mb-1">Proveedor *</label><select value={form.proveedorId} onChange={e => setForm({ ...form, proveedorId: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required><option value="">Seleccionar...</option>{proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}</select></div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2"><label className="block text-sm font-medium mb-1">Nombre *</label><input type="text" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="ejemplo" required /></div>
            <div><label className="block text-sm font-medium mb-1">Extensión</label><select value={form.extension} onChange={e => setForm({ ...form, extension: e.target.value })} className="w-full px-3 py-2 border rounded-lg"><option value=".com">.com</option><option value=".es">.es</option><option value=".net">.net</option><option value=".org">.org</option></select></div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div><label className="block text-sm font-medium mb-1">Coste € *</label><input type="number" step="0.01" value={form.importeCoste} onChange={e => setForm({ ...form, importeCoste: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required /></div>
            <div><label className="block text-sm font-medium mb-1">Venta € *</label><input type="number" step="0.01" value={form.importeVenta} onChange={e => setForm({ ...form, importeVenta: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required /></div>
            <div className="flex items-center pt-6"><label className="flex items-center gap-2"><input type="checkbox" checked={form.tieneSSL} onChange={e => setForm({ ...form, tieneSSL: e.target.checked })} /> Tiene SSL</label></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-1">Fecha Registro *</label><input type="date" value={form.fechaRegistro} onChange={e => setForm({ ...form, fechaRegistro: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required /></div>
            <div><label className="block text-sm font-medium mb-1">Fecha Vencimiento *</label><input type="date" value={form.fechaVencimiento} onChange={e => setForm({ ...form, fechaVencimiento: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required /></div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
            <button type="submit" disabled={saving} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">{saving ? 'Guardando...' : 'Guardar'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}