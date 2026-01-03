'use client';
import React, { useState, useEffect } from 'react';
import {
  Server, Globe, Shield, Plus, Search, Filter, AlertTriangle,
  ChevronDown, ChevronRight, Edit, Trash2, Eye, EyeOff,
  TrendingUp, TrendingDown, Calendar, DollarSign, Building2,
  RefreshCw, ExternalLink, Copy, Check
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
}

interface Hosting {
  id: string;
  clienteId: string;
  proveedorId: string;
  nombre: string;
  tipoHosting: string;
  especificaciones?: string;
  ipServidor?: string;
  panelControl?: string;
  urlPanel?: string;
  usuarioPanel?: string;
  passwordPanel?: string;
  importeCoste: number;
  importeVenta: number;
  periodicidad: string;
  fechaContratacion: string;
  fechaVencimiento: string;
  estado: string;
  autoRenovar: boolean;
  notas?: string;
  cliente: { id: string; name: string };
  proveedor: { id: string; nombre: string };
  dominios: { id: string; nombre: string; extension: string }[];
}

interface Dominio {
  id: string;
  clienteId: string;
  hostingId?: string;
  proveedorId: string;
  nombre: string;
  extension: string;
  tieneSSL: boolean;
  tipoSSL?: string;
  fechaVencimientoSSL?: string;
  nameservers?: string;
  importeCoste: number;
  importeVenta: number;
  periodicidad: string;
  fechaRegistro: string;
  fechaVencimiento: string;
  estado: string;
  autoRenovar: boolean;
  notas?: string;
  cliente: { id: string; name: string };
  proveedor: { id: string; nombre: string };
  hosting?: { id: string; nombre: string };
}

interface Dashboard {
  totalHostings: number;
  totalDominios: number;
  ingresoAnualTotal: number;
  costeAnualTotal: number;
  margenTotal: number;
  totalAlertas: number;
  alertas: {
    hostings: any[];
    dominios: any[];
    ssl: any[];
  };
}

interface Cliente {
  id: string;
  name: string;
}

export default function HostingPage() {
  const { usuario } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'hostings' | 'dominios' | 'proveedores'>('dashboard');
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [hostings, setHostings] = useState<Hosting[]>([]);
  const [dominios, setDominios] = useState<Dominio[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCliente, setFilterCliente] = useState('todos');
  const [filterEstado, setFilterEstado] = useState('todos');
  
  // Modales
  const [showModalHosting, setShowModalHosting] = useState(false);
  const [showModalDominio, setShowModalDominio] = useState(false);
  const [showModalProveedor, setShowModalProveedor] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  
  // Visibilidad passwords
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const isAdmin = usuario?.role === 'ADMIN' || usuario?.role === 'SUPERADMIN';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [dashRes, hostRes, domRes, provRes, cliRes] = await Promise.all([
        fetch('/api/hosting?entity=dashboard'),
        fetch('/api/hosting?entity=hostings'),
        fetch('/api/hosting?entity=dominios'),
        fetch('/api/hosting?entity=proveedores'),
        fetch('/api/clientes')
      ]);

      if (dashRes.ok) setDashboard(await dashRes.json());
      if (hostRes.ok) setHostings(await hostRes.json());
      if (domRes.ok) setDominios(await domRes.json());
      if (provRes.ok) setProveedores(await provRes.json());
      if (cliRes.ok) setClientes(await cliRes.json());
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const getDaysUntil = (dateStr: string) => {
    const today = new Date();
    const target = new Date(dateStr);
    const diff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'ACTIVO': return <Badge variant="success">Activo</Badge>;
      case 'PENDIENTE_RENOVACION': return <Badge variant="warning">Pendiente Renovación</Badge>;
      case 'SUSPENDIDO': return <Badge variant="error">Suspendido</Badge>;
      case 'CANCELADO': return <Badge variant="neutral">Cancelado</Badge>;
      case 'EXPIRADO': return <Badge variant="error">Expirado</Badge>;
      default: return <Badge variant="neutral">{estado}</Badge>;
    }
  };

  const togglePassword = (id: string) => {
    const newSet = new Set(visiblePasswords);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setVisiblePasswords(newSet);
  };

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredHostings = hostings.filter(h => {
    const matchSearch = h.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       h.cliente.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCliente = filterCliente === 'todos' || h.clienteId === filterCliente;
    const matchEstado = filterEstado === 'todos' || h.estado === filterEstado;
    return matchSearch && matchCliente && matchEstado;
  });

  const filteredDominios = dominios.filter(d => {
    const matchSearch = d.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       d.cliente.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCliente = filterCliente === 'todos' || d.clienteId === filterCliente;
    const matchEstado = filterEstado === 'todos' || d.estado === filterEstado;
    return matchSearch && matchCliente && matchEstado;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <p className="text-xl text-blue-500 animate-pulse">Cargando hosting y dominios...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Hosting y Dominios</h1>
          <p className="text-gray-500 text-sm">Gestión centralizada de servicios de hosting y dominios</p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <button
              onClick={() => { setEditingItem(null); setShowModalProveedor(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
            >
cat > app/hosting/page.tsx << 'ENDOFFILE'
'use client';
import React, { useState, useEffect } from 'react';
import {
  Server, Globe, Shield, Plus, Search, Filter, AlertTriangle,
  ChevronDown, ChevronRight, Edit, Trash2, Eye, EyeOff,
  TrendingUp, TrendingDown, Calendar, DollarSign, Building2,
  RefreshCw, ExternalLink, Copy, Check
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
}

interface Hosting {
  id: string;
  clienteId: string;
  proveedorId: string;
  nombre: string;
  tipoHosting: string;
  especificaciones?: string;
  ipServidor?: string;
  panelControl?: string;
  urlPanel?: string;
  usuarioPanel?: string;
  passwordPanel?: string;
  importeCoste: number;
  importeVenta: number;
  periodicidad: string;
  fechaContratacion: string;
  fechaVencimiento: string;
  estado: string;
  autoRenovar: boolean;
  notas?: string;
  cliente: { id: string; name: string };
  proveedor: { id: string; nombre: string };
  dominios: { id: string; nombre: string; extension: string }[];
}

interface Dominio {
  id: string;
  clienteId: string;
  hostingId?: string;
  proveedorId: string;
  nombre: string;
  extension: string;
  tieneSSL: boolean;
  tipoSSL?: string;
  fechaVencimientoSSL?: string;
  nameservers?: string;
  importeCoste: number;
  importeVenta: number;
  periodicidad: string;
  fechaRegistro: string;
  fechaVencimiento: string;
  estado: string;
  autoRenovar: boolean;
  notas?: string;
  cliente: { id: string; name: string };
  proveedor: { id: string; nombre: string };
  hosting?: { id: string; nombre: string };
}

interface Dashboard {
  totalHostings: number;
  totalDominios: number;
  ingresoAnualTotal: number;
  costeAnualTotal: number;
  margenTotal: number;
  totalAlertas: number;
  alertas: {
    hostings: any[];
    dominios: any[];
    ssl: any[];
  };
}

interface Cliente {
  id: string;
  name: string;
}

export default function HostingPage() {
  const { usuario } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'hostings' | 'dominios' | 'proveedores'>('dashboard');
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [hostings, setHostings] = useState<Hosting[]>([]);
  const [dominios, setDominios] = useState<Dominio[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCliente, setFilterCliente] = useState('todos');
  const [filterEstado, setFilterEstado] = useState('todos');
  
  // Modales
  const [showModalHosting, setShowModalHosting] = useState(false);
  const [showModalDominio, setShowModalDominio] = useState(false);
  const [showModalProveedor, setShowModalProveedor] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  
  // Visibilidad passwords
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const isAdmin = usuario?.role === 'ADMIN' || usuario?.role === 'SUPERADMIN';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [dashRes, hostRes, domRes, provRes, cliRes] = await Promise.all([
        fetch('/api/hosting?entity=dashboard'),
        fetch('/api/hosting?entity=hostings'),
        fetch('/api/hosting?entity=dominios'),
        fetch('/api/hosting?entity=proveedores'),
        fetch('/api/clientes')
      ]);

      if (dashRes.ok) setDashboard(await dashRes.json());
      if (hostRes.ok) setHostings(await hostRes.json());
      if (domRes.ok) setDominios(await domRes.json());
      if (provRes.ok) setProveedores(await provRes.json());
      if (cliRes.ok) setClientes(await cliRes.json());
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const getDaysUntil = (dateStr: string) => {
    const today = new Date();
    const target = new Date(dateStr);
    const diff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'ACTIVO': return <Badge variant="success">Activo</Badge>;
      case 'PENDIENTE_RENOVACION': return <Badge variant="warning">Pendiente Renovación</Badge>;
      case 'SUSPENDIDO': return <Badge variant="error">Suspendido</Badge>;
      case 'CANCELADO': return <Badge variant="neutral">Cancelado</Badge>;
      case 'EXPIRADO': return <Badge variant="error">Expirado</Badge>;
      default: return <Badge variant="neutral">{estado}</Badge>;
    }
  };

  const togglePassword = (id: string) => {
    const newSet = new Set(visiblePasswords);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setVisiblePasswords(newSet);
  };

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredHostings = hostings.filter(h => {
    const matchSearch = h.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       h.cliente.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCliente = filterCliente === 'todos' || h.clienteId === filterCliente;
    const matchEstado = filterEstado === 'todos' || h.estado === filterEstado;
    return matchSearch && matchCliente && matchEstado;
  });

  const filteredDominios = dominios.filter(d => {
    const matchSearch = d.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       d.cliente.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCliente = filterCliente === 'todos' || d.clienteId === filterCliente;
    const matchEstado = filterEstado === 'todos' || d.estado === filterEstado;
    return matchSearch && matchCliente && matchEstado;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <p className="text-xl text-blue-500 animate-pulse">Cargando hosting y dominios...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Hosting y Dominios</h1>
          <p className="text-gray-500 text-sm">Gestión centralizada de servicios de hosting y dominios</p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <button
              onClick={() => { setEditingItem(null); setShowModalProveedor(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
            >
              <Building2 size={18} />
              Proveedor
            </button>
            <button
              onClick={() => { setEditingItem(null); setShowModalHosting(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Server size={18} />
              Hosting
            </button>
            <button
              onClick={() => { setEditingItem(null); setShowModalDominio(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Globe size={18} />
              Dominio
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
          { id: 'hostings', label: 'Hostings', icon: Server },
          { id: 'dominios', label: 'Dominios', icon: Globe },
          { id: 'proveedores', label: 'Proveedores', icon: Building2 }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && dashboard && (
        <div className="space-y-6">
          {/* Cards Resumen Financiero */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase">Ingresos Anuales</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">
                    {formatCurrency(dashboard.ingresoAnualTotal)}
                  </p>
                  <p className="text-xs text-slate-400">{dashboard.totalHostings} hostings + {dashboard.totalDominios} dominios</p>
                </div>
                <div className="p-3 bg-green-100 rounded-xl">
                  <TrendingUp size={24} className="text-green-600" />
                </div>
              </div>
            </Card>
            
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase">Costes Anuales</p>
                  <p className="text-2xl font-bold text-red-600 mt-1">
                    {formatCurrency(dashboard.costeAnualTotal)}
                  </p>
                  <p className="text-xs text-slate-400">Pagado a proveedores</p>
                </div>
                <div className="p-3 bg-red-100 rounded-xl">
                  <TrendingDown size={24} className="text-red-600" />
                </div>
              </div>
            </Card>
            
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase">Margen Anual</p>
                  <p className={`text-2xl font-bold mt-1 ${dashboard.margenTotal >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                    {formatCurrency(dashboard.margenTotal)}
                  </p>
                  <p className="text-xs text-slate-400">
                    {dashboard.ingresoAnualTotal > 0 
                      ? `${Math.round((dashboard.margenTotal / dashboard.ingresoAnualTotal) * 100)}% margen`
                      : '0% margen'}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-xl">
                  <DollarSign size={24} className="text-blue-600" />
                </div>
              </div>
            </Card>
            
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase">Alertas</p>
                  <p className={`text-2xl font-bold mt-1 ${dashboard.totalAlertas > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                    {dashboard.totalAlertas}
                  </p>
                  <p className="text-xs text-slate-400">Vencimientos próximos 30 días</p>
                </div>
                <div className={`p-3 rounded-xl ${dashboard.totalAlertas > 0 ? 'bg-orange-100' : 'bg-green-100'}`}>
                  <AlertTriangle size={24} className={dashboard.totalAlertas > 0 ? 'text-orange-600' : 'text-green-600'} />
                </div>
              </div>
            </Card>
          </div>

          {/* Alertas de Vencimiento */}
          {dashboard.totalAlertas > 0 && (
            <Card title="⚠️ Próximos Vencimientos (30 días)" className="border-l-4 border-orange-500">
              <div className="space-y-4">
                {dashboard.alertas.hostings.length > 0 && (
                  <div>
                    <h4 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                      <Server size={16} /> Hostings
                    </h4>
                    <div className="space-y-2">
                      {dashboard.alertas.hostings.map((h: any) => (
                        <div key={h.id} className="flex justify-between items-center bg-orange-50 p-3 rounded-lg">
                          <div>
                            <span className="font-medium">{h.nombre}</span>
                            <span className="text-sm text-slate-500 ml-2">({h.cliente.name})</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-orange-600 font-medium">
                              Vence: {formatDate(h.fechaVencimiento)}
                            </span>
                            <Badge variant="warning">{getDaysUntil(h.fechaVencimiento)} días</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {dashboard.alertas.dominios.length > 0 && (
                  <div>
                    <h4 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                      <Globe size={16} /> Dominios
                    </h4>
                    <div className="space-y-2">
                      {dashboard.alertas.dominios.map((d: any) => (
                        <div key={d.id} className="flex justify-between items-center bg-orange-50 p-3 rounded-lg">
                          <div>
                            <span className="font-medium">{d.nombre}{d.extension}</span>
                            <span className="text-sm text-slate-500 ml-2">({d.cliente.name})</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-orange-600 font-medium">
                              Vence: {formatDate(d.fechaVencimiento)}
                            </span>
                            <Badge variant="warning">{getDaysUntil(d.fechaVencimiento)} días</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {dashboard.alertas.ssl.length > 0 && (
                  <div>
                    <h4 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                      <Shield size={16} /> Certificados SSL
                    </h4>
                    <div className="space-y-2">
                      {dashboard.alertas.ssl.map((s: any) => (
                        <div key={s.id} className="flex justify-between items-center bg-red-50 p-3 rounded-lg">
                          <div>
                            <span className="font-medium">{s.nombre}{s.extension}</span>
                            <span className="text-sm text-slate-500 ml-2">({s.cliente.name})</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-red-600 font-medium">
                              SSL Vence: {formatDate(s.fechaVencimientoSSL)}
                            </span>
                            <Badge variant="error">{getDaysUntil(s.fechaVencimientoSSL)} días</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Hostings Tab */}
      {activeTab === 'hostings' && (
        <div className="space-y-4">
          {/* Filtros */}
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar hosting..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm"
              />
            </div>
            <select
              value={filterCliente}
              onChange={(e) => setFilterCliente(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
            >
              <option value="todos">Todos los clientes</option>
              {clientes.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <select
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
            >
              <option value="todos">Todos los estados</option>
              <option value="ACTIVO">Activo</option>
              <option value="PENDIENTE_RENOVACION">Pendiente Renovación</option>
              <option value="SUSPENDIDO">Suspendido</option>
              <option value="CANCELADO">Cancelado</option>
            </select>
          </div>

          {/* Tabla Hostings */}
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left font-bold text-slate-600">Cliente</th>
                    <th className="px-4 py-3 text-left font-bold text-slate-600">Hosting</th>
                    <th className="px-4 py-3 text-left font-bold text-slate-600">Tipo</th>
                    <th className="px-4 py-3 text-left font-bold text-slate-600">Proveedor</th>
                    <th className="px-4 py-3 text-center font-bold text-slate-600">Vencimiento</th>
                    <th className="px-4 py-3 text-right font-bold text-slate-600">Coste</th>
                    <th className="px-4 py-3 text-right font-bold text-slate-600">Venta</th>
                    <th className="px-4 py-3 text-center font-bold text-slate-600">Estado</th>
                    <th className="px-4 py-3 text-center font-bold text-slate-600">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredHostings.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-12 text-center text-slate-400">
                        <Server size={32} className="mx-auto mb-2 opacity-30" />
                        <p>No hay hostings registrados</p>
                      </td>
                    </tr>
                  ) : (
                    filteredHostings.map(hosting => {
                      const diasRestantes = getDaysUntil(hosting.fechaVencimiento);
                      return (
                        <tr key={hosting.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3">
                            <span className="font-medium">{hosting.cliente.name}</span>
                          </td>
                          <td className="px-4 py-3">
                            <div>
                              <span className="font-medium text-slate-900">{hosting.nombre}</span>
                              {hosting.dominios.length > 0 && (
                                <span className="block text-xs text-slate-500">
                                  {hosting.dominios.length} dominio(s) asociado(s)
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="blue">{hosting.tipoHosting}</Badge>
                          </td>
                          <td className="px-4 py-3 text-slate-600">{hosting.proveedor.nombre}</td>
                          <td className="px-4 py-3 text-center">
                            <div>
                              <span className={`font-medium ${diasRestantes <= 30 ? 'text-orange-600' : 'text-slate-900'}`}>
                                {formatDate(hosting.fechaVencimiento)}
                              </span>
                              {diasRestantes <= 30 && diasRestantes > 0 && (
                                <span className="block text-xs text-orange-500">{diasRestantes} días</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right text-red-600">{formatCurrency(hosting.importeCoste)}</td>
                          <td className="px-4 py-3 text-right text-green-600">{formatCurrency(hosting.importeVenta)}</td>
                          <td className="px-4 py-3 text-center">{getEstadoBadge(hosting.estado)}</td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex justify-center gap-1">
                              <button
                                onClick={() => { setEditingItem(hosting); setShowModalHosting(true); }}
                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                              >
                                <Edit size={16} />
                              </button>
                              {hosting.urlPanel && (
                                
                                  href={hosting.urlPanel}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded"
                                >
                                  <ExternalLink size={16} />
                                </a>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Dominios Tab */}
      {activeTab === 'dominios' && (
        <div className="space-y-4">
          {/* Filtros */}
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar dominio..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm"
              />
            </div>
            <select
              value={filterCliente}
              onChange={(e) => setFilterCliente(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
            >
              <option value="todos">Todos los clientes</option>
              {clientes.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <select
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
            >
              <option value="todos">Todos los estados</option>
              <option value="ACTIVO">Activo</option>
              <option value="PENDIENTE_RENOVACION">Pendiente Renovación</option>
              <option value="EXPIRADO">Expirado</option>
              <option value="TRANSFERIDO">Transferido</option>
            </select>
          </div>

          {/* Tabla Dominios */}
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left font-bold text-slate-600">Cliente</th>
                    <th className="px-4 py-3 text-left font-bold text-slate-600">Dominio</th>
                    <th className="px-4 py-3 text-center font-bold text-slate-600">SSL</th>
                    <th className="px-4 py-3 text-left font-bold text-slate-600">Proveedor</th>
                    <th className="px-4 py-3 text-center font-bold text-slate-600">Vencimiento</th>
                    <th className="px-4 py-3 text-right font-bold text-slate-600">Coste</th>
                    <th className="px-4 py-3 text-right font-bold text-slate-600">Venta</th>
                    <th className="px-4 py-3 text-center font-bold text-slate-600">Estado</th>
                    <th className="px-4 py-3 text-center font-bold text-slate-600">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDominios.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-12 text-center text-slate-400">
                        <Globe size={32} className="mx-auto mb-2 opacity-30" />
                        <p>No hay dominios registrados</p>
                      </td>
                    </tr>
                  ) : (
                    filteredDominios.map(dominio => {
                      const diasRestantes = getDaysUntil(dominio.fechaVencimiento);
                      const diasSSL = dominio.fechaVencimientoSSL ? getDaysUntil(dominio.fechaVencimientoSSL) : null;
                      return (
                        <tr key={dominio.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3">
                            <span className="font-medium">{dominio.cliente.name}</span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-slate-900">{dominio.nombre}</span>
                              <span className="text-blue-600">{dominio.extension}</span>
                            </div>
                            {dominio.hosting && (
                              <span className="text-xs text-slate-500">→ {dominio.hosting.nombre}</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {dominio.tieneSSL ? (
                              <div className="flex flex-col items-center">
                                <Shield size={16} className={diasSSL && diasSSL <= 30 ? 'text-orange-500' : 'text-green-500'} />
                                {diasSSL !== null && diasSSL <= 30 && (
                                  <span className="text-xs text-orange-500">{diasSSL}d</span>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-slate-600">{dominio.proveedor.nombre}</td>
                          <td className="px-4 py-3 text-center">
                            <div>
                              <span className={`font-medium ${diasRestantes <= 30 ? 'text-orange-600' : 'text-slate-900'}`}>
                                {formatDate(dominio.fechaVencimiento)}
                              </span>
                              {diasRestantes <= 30 && diasRestantes > 0 && (
                                <span className="block text-xs text-orange-500">{diasRestantes} días</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right text-red-600">{formatCurrency(dominio.importeCoste)}</td>
                          <td className="px-4 py-3 text-right text-green-600">{formatCurrency(dominio.importeVenta)}</td>
                          <td className="px-4 py-3 text-center">{getEstadoBadge(dominio.estado)}</td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => { setEditingItem(dominio); setShowModalDominio(true); }}
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                            >
                              <Edit size={16} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Proveedores Tab */}
      {activeTab === 'proveedores' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {proveedores.map(prov => (
            <Card key={prov.id} className="hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-slate-900">{prov.nombre}</h3>
                  <Badge variant={prov.tipo === 'AMBOS' ? 'blue' : prov.tipo === 'HOSTING' ? 'success' : 'warning'}>
                    {prov.tipo}
                  </Badge>
                </div>
                <button
                  onClick={() => { setEditingItem(prov); setShowModalProveedor(true); }}
                  className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                >
                  <Edit size={16} />
                </button>
              </div>
              {prov.website && (
                
                  href={prov.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline flex items-center gap-1 mt-2"
                >
                  <ExternalLink size={14} />
                  {prov.website}
                </a>
              )}
              <div className="mt-3 pt-3 border-t border-slate-100 flex gap-4 text-sm text-slate-500">
                <span>{(prov as any)._count?.hostings || 0} hostings</span>
                <span>{(prov as any)._count?.dominios || 0} dominios</span>
              </div>
            </Card>
          ))}
          
          {proveedores.length === 0 && (
            <div className="col-span-full text-center py-12 text-slate-400">
              <Building2 size={32} className="mx-auto mb-2 opacity-30" />
              <p>No hay proveedores registrados</p>
              <button
                onClick={() => { setEditingItem(null); setShowModalProveedor(true); }}
                className="mt-4 text-blue-600 hover:underline"
              >
                Añadir primer proveedor
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modal Proveedor */}
      {showModalProveedor && (
        <ModalProveedor
          proveedor={editingItem}
          onClose={() => { setShowModalProveedor(false); setEditingItem(null); }}
          onSave={() => { fetchData(); setShowModalProveedor(false); setEditingItem(null); }}
        />
      )}

      {/* Modal Hosting */}
      {showModalHosting && (
        <ModalHosting
          hosting={editingItem}
          clientes={clientes}
          proveedores={proveedores.filter(p => p.tipo === 'HOSTING' || p.tipo === 'AMBOS')}
          onClose={() => { setShowModalHosting(false); setEditingItem(null); }}
          onSave={() => { fetchData(); setShowModalHosting(false); setEditingItem(null); }}
        />
      )}

      {/* Modal Dominio */}
      {showModalDominio && (
        <ModalDominio
          dominio={editingItem}
          clientes={clientes}
          proveedores={proveedores.filter(p => p.tipo === 'DOMINIOS' || p.tipo === 'AMBOS')}
          hostings={hostings}
          onClose={() => { setShowModalDominio(false); setEditingItem(null); }}
          onSave={() => { fetchData(); setShowModalDominio(false); setEditingItem(null); }}
        />
      )}
    </div>
  );
}

// ===================== MODALES =====================

function ModalProveedor({ proveedor, onClose, onSave }: { proveedor: Proveedor | null; onClose: () => void; onSave: () => void }) {
  const [form, setForm] = useState({
    nombre: proveedor?.nombre || '',
    tipo: proveedor?.tipo || 'AMBOS',
    website: proveedor?.website || '',
    activo: proveedor?.activo ?? true
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const method = proveedor ? 'PUT' : 'POST';
      const body = proveedor ? { id: proveedor.id, ...form } : form;
      
      const res = await fetch('/api/hosting?entity=proveedores', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      if (res.ok) onSave();
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-xl font-bold">{proveedor ? 'Editar' : 'Nuevo'} Proveedor</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre *</label>
            <input
              type="text"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tipo *</label>
            <select
              value={form.tipo}
              onChange={(e) => setForm({ ...form, tipo: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg"
            >
              <option value="HOSTING">Solo Hosting</option>
              <option value="DOMINIOS">Solo Dominios</option>
              <option value="AMBOS">Hosting y Dominios</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Website</label>
            <input
              type="url"
              value={form.website}
              onChange={(e) => setForm({ ...form, website: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              placeholder="https://"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ModalHosting({ hosting, clientes, proveedores, onClose, onSave }: {
  hosting: Hosting | null;
  clientes: Cliente[];
  proveedores: Proveedor[];
  onClose: () => void;
  onSave: () => void;
}) {
  const [form, setForm] = useState({
    clienteId: hosting?.clienteId || '',
    proveedorId: hosting?.proveedorId || '',
    nombre: hosting?.nombre || '',
    tipoHosting: hosting?.tipoHosting || 'COMPARTIDO',
    especificaciones: hosting?.especificaciones || '',
    ipServidor: hosting?.ipServidor || '',
    panelControl: hosting?.panelControl || '',
    urlPanel: hosting?.urlPanel || '',
    usuarioPanel: hosting?.usuarioPanel || '',
    passwordPanel: hosting?.passwordPanel || '',
    importeCoste: hosting?.importeCoste?.toString() || '',
    importeVenta: hosting?.importeVenta?.toString() || '',
    periodicidad: hosting?.periodicidad || 'ANUAL',
    fechaContratacion: hosting?.fechaContratacion?.split('T')[0] || new Date().toISOString().split('T')[0],
    fechaVencimiento: hosting?.fechaVencimiento?.split('T')[0] || '',
    estado: hosting?.estado || 'ACTIVO',
    autoRenovar: hosting?.autoRenovar ?? true,
    notas: hosting?.notas || ''
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const method = hosting ? 'PUT' : 'POST';
      const body = hosting ? { id: hosting.id, ...form } : form;
      
      const res = await fetch('/api/hosting?entity=hostings', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      if (res.ok) onSave();
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl my-8">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-xl font-bold">{hosting ? 'Editar' : 'Nuevo'} Hosting</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Cliente *</label>
              <select
                value={form.clienteId}
                onChange={(e) => setForm({ ...form, clienteId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                required
              >
                <option value="">Seleccionar...</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Proveedor *</label>
              <select
                value={form.proveedorId}
                onChange={(e) => setForm({ ...form, proveedorId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                required
              >
                <option value="">Seleccionar...</option>
                {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nombre Hosting *</label>
              <input
                type="text"
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                placeholder="Ej: Hosting Principal"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tipo *</label>
              <select
                value={form.tipoHosting}
                onChange={(e) => setForm({ ...form, tipoHosting: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              >
                <option value="COMPARTIDO">Compartido</option>
                <option value="VPS">VPS</option>
                <option value="DEDICADO">Dedicado</option>
                <option value="CLOUD">Cloud</option>
                <option value="RESELLER">Reseller</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Especificaciones</label>
            <input
              type="text"
              value={form.especificaciones}
              onChange={(e) => setForm({ ...form, especificaciones: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              placeholder="Ej: 4GB RAM, 2 CPU, 50GB SSD"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">IP Servidor</label>
              <input
                type="text"
                value={form.ipServidor}
                onChange={(e) => setForm({ ...form, ipServidor: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Panel Control</label>
              <input
                type="text"
                value={form.panelControl}
                onChange={(e) => setForm({ ...form, panelControl: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                placeholder="cPanel, Plesk..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">URL Panel</label>
              <input
                type="url"
                value={form.urlPanel}
                onChange={(e) => setForm({ ...form, urlPanel: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Usuario Panel</label>
              <input
                type="text"
                value={form.usuarioPanel}
                onChange={(e) => setForm({ ...form, usuarioPanel: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password Panel</label>
              <input
                type="text"
                value={form.passwordPanel}
                onChange={(e) => setForm({ ...form, passwordPanel: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Coste (€) *</label>
              <input
                type="number"
                step="0.01"
                value={form.importeCoste}
                onChange={(e) => setForm({ ...form, importeCoste: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Venta (€) *</label>
              <input
                type="number"
                step="0.01"
                value={form.importeVenta}
                onChange={(e) => setForm({ ...form, importeVenta: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Periodicidad</label>
              <select
                value={form.periodicidad}
                onChange={(e) => setForm({ ...form, periodicidad: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              >
                <option value="MENSUAL">Mensual</option>
                <option value="TRIMESTRAL">Trimestral</option>
                <option value="SEMESTRAL">Semestral</option>
                <option value="ANUAL">Anual</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Fecha Contratación *</label>
              <input
                type="date"
                value={form.fechaContratacion}
                onChange={(e) => setForm({ ...form, fechaContratacion: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Fecha Vencimiento *</label>
              <input
                type="date"
                value={form.fechaVencimiento}
                onChange={(e) => setForm({ ...form, fechaVencimiento: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Estado</label>
              <select
                value={form.estado}
                onChange={(e) => setForm({ ...form, estado: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              >
                <option value="ACTIVO">Activo</option>
                <option value="PENDIENTE_RENOVACION">Pendiente Renovación</option>
                <option value="SUSPENDIDO">Suspendido</option>
                <option value="CANCELADO">Cancelado</option>
              </select>
            </div>
            <div className="flex items-center pt-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.autoRenovar}
                  onChange={(e) => setForm({ ...form, autoRenovar: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-300"
                />
                <span className="text-sm text-slate-700">Auto-renovar</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Notas</label>
            <textarea
              value={form.notas}
              onChange={(e) => setForm({ ...form, notas: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button type="button" onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ModalDominio({ dominio, clientes, proveedores, hostings, onClose, onSave }: {
  dominio: Dominio | null;
  clientes: Cliente[];
  proveedores: Proveedor[];
  hostings: Hosting[];
  onClose: () => void;
  onSave: () => void;
}) {
  const [form, setForm] = useState({
    clienteId: dominio?.clienteId || '',
    hostingId: dominio?.hostingId || '',
    proveedorId: dominio?.proveedorId || '',
    nombre: dominio?.nombre || '',
    extension: dominio?.extension || '.com',
    tieneSSL: dominio?.tieneSSL ?? false,
    tipoSSL: dominio?.tipoSSL || '',
    fechaVencimientoSSL: dominio?.fechaVencimientoSSL?.split('T')[0] || '',
    nameservers: dominio?.nameservers || '',
    importeCoste: dominio?.importeCoste?.toString() || '',
    importeVenta: dominio?.importeVenta?.toString() || '',
    periodicidad: dominio?.periodicidad || 'ANUAL',
    fechaRegistro: dominio?.fechaRegistro?.split('T')[0] || new Date().toISOString().split('T')[0],
    fechaVencimiento: dominio?.fechaVencimiento?.split('T')[0] || '',
    estado: dominio?.estado || 'ACTIVO',
    autoRenovar: dominio?.autoRenovar ?? true,
    notas: dominio?.notas || ''
  });
  const [saving, setSaving] = useState(false);

  const hostingsCliente = hostings.filter(h => h.clienteId === form.clienteId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const method = dominio ? 'PUT' : 'POST';
      const body = dominio ? { id: dominio.id, ...form } : form;
      
      const res = await fetch('/api/hosting?entity=dominios', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      if (res.ok) onSave();
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl my-8">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-xl font-bold">{dominio ? 'Editar' : 'Nuevo'} Dominio</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Cliente *</label>
              <select
                value={form.clienteId}
                onChange={(e) => setForm({ ...form, clienteId: e.target.value, hostingId: '' })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                required
              >
                <option value="">Seleccionar...</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Proveedor *</label>
              <select
                value={form.proveedorId}
                onChange={(e) => setForm({ ...form, proveedorId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                required
              >
                <option value="">Seleccionar...</option>
                {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Hosting Asociado</label>
            <select
              value={form.hostingId}
              onChange={(e) => setForm({ ...form, hostingId: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              disabled={!form.clienteId}
            >
              <option value="">Sin hosting asociado</option>
              {hostingsCliente.map(h => <option key={h.id} value={h.id}>{h.nombre}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Nombre Dominio *</label>
              <input
                type="text"
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                placeholder="ejemplo"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Extensión *</label>
              <select
                value={form.extension}
                onChange={(e) => setForm({ ...form, extension: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              >
                <option value=".com">.com</option>
                <option value=".es">.es</option>
                <option value=".net">.net</option>
                <option value=".org">.org</option>
                <option value=".eu">.eu</option>
                <option value=".info">.info</option>
                <option value=".io">.io</option>
              </select>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-lg space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.tieneSSL}
                onChange={(e) => setForm({ ...form, tieneSSL: e.target.checked })}
                className="w-4 h-4 rounded border-slate-300"
              />
              <span className="text-sm font-medium text-slate-700">Tiene SSL</span>
            </label>
            {form.tieneSSL && (
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tipo SSL</label>
                  <select
                    value={form.tipoSSL}
                    onChange={(e) => setForm({ ...form, tipoSSL: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  >
                    <option value="">Seleccionar...</option>
                    <option value="LETS_ENCRYPT">Let's Encrypt</option>
                    <option value="COMODO">Comodo</option>
                    <option value="GEOTRUST">GeoTrust</option>
                    <option value="DIGICERT">DigiCert</option>
                    <option value="OTRO">Otro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Vencimiento SSL</label>
                  <input
                    type="date"
                    value={form.fechaVencimientoSSL}
                    onChange={(e) => setForm({ ...form, fechaVencimientoSSL: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nameservers</label>
            <input
              type="text"
              value={form.nameservers}
              onChange={(e) => setForm({ ...form, nameservers: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              placeholder="ns1.ejemplo.com, ns2.ejemplo.com"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Coste (€) *</label>
              <input
                type="number"
                step="0.01"
                value={form.importeCoste}
                onChange={(e) => setForm({ ...form, importeCoste: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Venta (€) *</label>
              <input
                type="number"
                step="0.01"
                value={form.importeVenta}
                onChange={(e) => setForm({ ...form, importeVenta: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Periodicidad</label>
              <select
                value={form.periodicidad}
                onChange={(e) => setForm({ ...form, periodicidad: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              >
                <option value="ANUAL">Anual</option>
                <option value="BIANUAL">Bianual</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Fecha Registro *</label>
              <input
                type="date"
                value={form.fechaRegistro}
                onChange={(e) => setForm({ ...form, fechaRegistro: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Fecha Vencimiento *</label>
              <input
                type="date"
                value={form.fechaVencimiento}
                onChange={(e) => setForm({ ...form, fechaVencimiento: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Estado</label>
              <select
                value={form.estado}
                onChange={(e) => setForm({ ...form, estado: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              >
                <option value="ACTIVO">Activo</option>
                <option value="PENDIENTE_RENOVACION">Pendiente Renovación</option>
                <option value="EXPIRADO">Expirado</option>
                <option value="TRANSFERIDO">Transferido</option>
              </select>
            </div>
            <div className="flex items-center pt-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.autoRenovar}
                  onChange={(e) => setForm({ ...form, autoRenovar: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-300"
                />
                <span className="text-sm text-slate-700">Auto-renovar</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Notas</label>
            <textarea
              value={form.notas}
              onChange={(e) => setForm({ ...form, notas: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button type="button" onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
