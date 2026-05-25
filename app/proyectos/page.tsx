'use client';
import React, { useState, useEffect } from 'react';
import { authFetch } from '../../lib/auth-fetch';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui/Card';
import {
  Plus, Search, LayoutGrid, List, ChevronDown, ChevronRight,
  Calendar, Clock, AlertTriangle, Briefcase,
  Edit, Trash2, TrendingUp, TrendingDown, Minus, Timer
} from 'lucide-react';

interface Cliente { id: string; name: string; }
interface Usuario { id: string; name: string; }
interface Tarea { id: string; status: string; estimatedHours?: number | null; }
interface Proyecto {
  id: string;
  title: string;
  clienteId: string;
  responsibleId: string | null;
  status: string;
  budget: number | null;
  deadline: string | null;
  isArchived: boolean;
  cliente?: Cliente;
  responsable?: Usuario;
  tareas?: Tarea[];
}
interface TimeEntryProj {
  startTime: string;
  endTime: string | null;
  tarea: { proyecto: { id: string } | null } | null;
}

const ESTADOS = [
  { id: 'PENDING',   nombre: 'Pendiente',  color: 'bg-slate-100 text-slate-700',  dotColor: 'bg-slate-400' },
  { id: 'ACTIVE',    nombre: 'En Curso',   color: 'bg-blue-100 text-blue-700',    dotColor: 'bg-blue-500'  },
  { id: 'COMPLETED', nombre: 'Completado', color: 'bg-green-100 text-green-700',  dotColor: 'bg-green-500' },
  { id: 'BLOCKED',   nombre: 'Bloqueado',  color: 'bg-red-100 text-red-700',      dotColor: 'bg-red-500'   },
];

const TARIFA_HORA = 40; // €/h por defecto

export const ProjectsPage = () => {
  const { usuario } = useAuth();
  const isAdmin = usuario?.role === 'ADMIN' || usuario?.role === 'SUPERADMIN';
  const [projects, setProjects]     = useState<Proyecto[]>([]);
  const [clientes, setClientes]     = useState<Cliente[]>([]);
  const [usuarios, setUsuarios]     = useState<Usuario[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntryProj[]>([]);
  const [isLoading, setIsLoading]   = useState(true);
  const [viewMode, setViewMode]     = useState<'list' | 'kanban'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado]   = useState('todos');
  const [filterCliente, setFilterCliente] = useState('todos');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showModal, setShowModal]   = useState(false);
  const [editingProject, setEditingProject] = useState<Proyecto | null>(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const now = new Date();
      const mes = now.getMonth() + 1;
      const año = now.getFullYear();
      const requests: Promise<Response>[] = [
        fetch('/api/proyectos'),
        fetch('/api/clientes'),
        fetch('/api/usuarios'),
      ];
      if (isAdmin) {
        requests.push(fetch(`/api/control-horario?entity=time-entries&mes=${mes}&año=${año}`));
      }
      const [projRes, cliRes, usrRes, teRes] = await Promise.all(requests);
      if (projRes.ok) setProjects(await projRes.json());
      if (cliRes.ok)  setClientes(await cliRes.json());
      if (usrRes.ok)  setUsuarios(await usrRes.json());
      if (teRes?.ok)  setTimeEntries(await teRes.json());
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Archivar este proyecto?')) return;
    await authFetch('/api/proyectos', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, isArchived: true }),
    });
    fetchData();
  };

  const formatCurrency = (v: number | null) =>
    v ? new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(v) : '-';
  const formatDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }) : '-';

  const getDaysUntilDeadline = (deadline: string | null) => {
    if (!deadline) return null;
    return Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000);
  };

  const getDeadlineStatus = (deadline: string | null) => {
    const days = getDaysUntilDeadline(deadline);
    if (days === null) return 'neutral';
    if (days < 0) return 'overdue';
    if (days <= 7) return 'warning';
    return 'ok';
  };

  const getEstado = (status: string) => ESTADOS.find(e => e.id === status) || ESTADOS[0];

  const getTaskProgress = (tareas: Tarea[] | undefined) => {
    if (!tareas || tareas.length === 0) return { completed: 0, total: 0, percent: 0 };
    const completed = tareas.filter(t => t.status === 'CLOSED').length;
    return { completed, total: tareas.length, percent: Math.round((completed / tareas.length) * 100) };
  };

  const getProjectHours = (projectId: string) => {
    return timeEntries
      .filter(e => e.tarea?.proyecto?.id === projectId && e.endTime)
      .reduce((sum, e) => {
        return sum + (new Date(e.endTime!).getTime() - new Date(e.startTime).getTime()) / 3600000;
      }, 0);
  };

  const getRentabilidad = (project: Proyecto) => {
    const budget = project.budget || 0;
    if (budget === 0) return null;
    const horasReales = getProjectHours(project.id);
    const costeReal   = horasReales * TARIFA_HORA;
    const margen      = budget - costeReal;
    const pct         = Math.round((margen / budget) * 100);
    return { horasReales: Math.round(horasReales * 10) / 10, costeReal: Math.round(costeReal), margen: Math.round(margen), pct };
  };

  const filteredProjects = projects.filter(p => {
    if (p.isArchived) return false;
    const matchSearch  = p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         p.cliente?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchEstado  = filterEstado  === 'todos' || p.status    === filterEstado;
    const matchCliente = filterCliente === 'todos' || p.clienteId === filterCliente;
    return matchSearch && matchEstado && matchCliente;
  });

  const stats = {
    total:     filteredProjects.length,
    pending:   filteredProjects.filter(p => p.status === 'PENDING').length,
    active:    filteredProjects.filter(p => p.status === 'ACTIVE').length,
    completed: filteredProjects.filter(p => p.status === 'COMPLETED').length,
    blocked:   filteredProjects.filter(p => p.status === 'BLOCKED').length,
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-96"><p className="text-xl text-blue-500 animate-pulse">Cargando proyectos...</p></div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Proyectos</h1>
          <p className="text-gray-500 text-sm">{isAdmin ? 'Progreso, horas registradas y rentabilidad' : 'Estado y progreso de proyectos'}</p>
        </div>
        <button
          onClick={() => { setEditingProject(null); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-elio-yellow text-black font-bold rounded-lg hover:bg-yellow-400"
        >
          <Plus size={18} /> Alta de Proyecto
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Total',       value: stats.total,     color: 'text-slate-900', bg: 'bg-slate-50' },
          { label: 'Pendientes',  value: stats.pending,   color: 'text-slate-600', bg: 'bg-slate-50' },
          { label: 'En Curso',    value: stats.active,    color: 'text-blue-600',  bg: 'bg-blue-50'  },
          { label: 'Completados', value: stats.completed, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Bloqueados',  value: stats.blocked,   color: 'text-red-600',   bg: 'bg-red-50'   },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-xl p-4`}>
            <p className="text-xs font-medium text-slate-500 uppercase">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-3 justify-between">
        <div className="flex flex-wrap gap-3 flex-1">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text" placeholder="Buscar proyecto o cliente..."
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm"
            />
          </div>
          <select value={filterEstado}  onChange={e => setFilterEstado(e.target.value)}  className="px-3 py-2 border rounded-lg text-sm">
            <option value="todos">Todos los estados</option>
            {ESTADOS.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
          </select>
          <select value={filterCliente} onChange={e => setFilterCliente(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
            <option value="todos">Todos los clientes</option>
            {clientes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="hidden md:flex bg-slate-100 p-1 rounded-lg">
          <button onClick={() => setViewMode('list')}   className={`p-2 rounded ${viewMode === 'list'   ? 'bg-white shadow-sm' : 'text-slate-500'}`}><List size={18} /></button>
          <button onClick={() => setViewMode('kanban')} className={`p-2 rounded ${viewMode === 'kanban' ? 'bg-white shadow-sm' : 'text-slate-500'}`}><LayoutGrid size={18} /></button>
        </div>
      </div>

      {/* Vista Lista */}
      {viewMode === 'list' && (
        <div className="space-y-2">
          {filteredProjects.length === 0 ? (
            <Card>
              <div className="text-center py-12 text-slate-400">
                <Briefcase size={48} className="mx-auto mb-4 opacity-30" />
                <p className="text-lg">No hay proyectos</p>
              </div>
            </Card>
          ) : filteredProjects.map(project => {
            const estado         = getEstado(project.status);
            const progress       = getTaskProgress(project.tareas);
            const deadlineStatus = getDeadlineStatus(project.deadline);
            const rent           = getRentabilidad(project);
            const horas          = getProjectHours(project.id);
            const isExpanded     = expandedId === project.id;

            return (
              <div
                key={project.id}
                className={`bg-white rounded-xl border transition-all ${isExpanded ? 'shadow-lg border-blue-200' : 'border-slate-200 hover:border-slate-300'}`}
              >
                {/* Fila Principal */}
                <div className="flex items-center gap-4 p-4 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : project.id)}>
                  <div className="text-slate-400">{isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}</div>
                  <div className={`w-3 h-3 rounded-full ${estado.dotColor} flex-shrink-0`} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 truncate">{project.title}</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${estado.color} hidden sm:inline`}>{estado.nombre}</span>
                    </div>
                    <p className="text-sm text-slate-500 truncate">{project.cliente?.name || 'Sin cliente'}</p>
                  </div>

                  {/* Progress */}
                  <div className="hidden md:flex items-center gap-2 w-32">
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 transition-all" style={{ width: `${progress.percent}%` }} />
                    </div>
                    <span className="text-xs text-slate-500 w-12 text-right">{progress.completed}/{progress.total}</span>
                  </div>

                  {/* Horas este mes — solo admin */}
                  {isAdmin && (
                    <div className="hidden lg:flex items-center gap-1 text-sm text-slate-600 w-20">
                      <Timer size={14} className="text-slate-400" />
                      <span className="font-medium">{horas > 0 ? `${Math.round(horas * 10) / 10}h` : '-'}</span>
                    </div>
                  )}

                  {/* Rentabilidad — solo admin */}
                  {isAdmin && rent && (
                    <div className={`hidden lg:flex items-center gap-1 text-sm font-bold w-16 ${
                      rent.pct >= 20 ? 'text-green-600' : rent.pct >= 0 ? 'text-orange-500' : 'text-red-600'
                    }`}>
                      {rent.pct >= 20 ? <TrendingUp size={14} /> : rent.pct >= 0 ? <Minus size={14} /> : <TrendingDown size={14} />}
                      {rent.pct}%
                    </div>
                  )}

                  {/* Deadline */}
                  <div className={`hidden lg:flex items-center gap-1 text-sm w-20 ${
                    deadlineStatus === 'overdue' ? 'text-red-600' : deadlineStatus === 'warning' ? 'text-orange-500' : 'text-slate-500'
                  }`}>
                    <Calendar size={14} />
                    <span>{formatDate(project.deadline)}</span>
                  </div>

                  <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 flex-shrink-0">
                    {project.responsable?.name?.charAt(0) || '?'}
                  </div>

                  <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                    <button onClick={() => { setEditingProject(project); setShowModal(true); }} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Edit size={16} /></button>
                    <button onClick={() => handleDelete(project.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                  </div>
                </div>

                {/* Detalle Expandido */}
                {isExpanded && (
                  <div className="px-4 pb-5 border-t border-slate-100">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                      <div>
                        <p className="text-xs text-slate-500 uppercase font-medium mb-1">Responsable</p>
                        <p className="text-sm font-semibold">{project.responsable?.name || 'Sin asignar'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase font-medium mb-1">Deadline</p>
                        <p className={`text-sm font-semibold ${deadlineStatus === 'overdue' ? 'text-red-600' : deadlineStatus === 'warning' ? 'text-orange-500' : ''}`}>
                          {formatDate(project.deadline)}{deadlineStatus === 'overdue' && ' · Vencido'}
                        </p>
                      </div>
                      {isAdmin && (
                        <div>
                          <p className="text-xs text-slate-500 uppercase font-medium mb-1">Presupuesto</p>
                          <p className="text-sm font-semibold">{formatCurrency(project.budget)}</p>
                        </div>
                      )}
                      {isAdmin && (
                        <div>
                          <p className="text-xs text-slate-500 uppercase font-medium mb-1">Horas este mes</p>
                          <p className="text-sm font-semibold flex items-center gap-1">
                            <Timer size={14} className="text-slate-400" />
                            {horas > 0 ? `${Math.round(horas * 10) / 10}h registradas` : 'Sin registros'}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Progress bar tareas */}
                    <div className="mt-4">
                      <div className="flex justify-between text-xs text-slate-500 mb-1">
                        <span>Progreso de tareas</span>
                        <span>{progress.completed} de {progress.total} cerradas ({progress.percent}%)</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 transition-all" style={{ width: `${progress.percent}%` }} />
                      </div>
                    </div>

                    {/* Rentabilidad detalle — solo admin */}
                    {isAdmin && rent && (
                      <div className="mt-4 grid grid-cols-3 gap-3">
                        <div className="bg-slate-50 rounded-lg p-3">
                          <p className="text-xs text-slate-500 mb-1">Coste real (mes)</p>
                          <p className="text-sm font-bold text-slate-800">{formatCurrency(rent.costeReal)}</p>
                          <p className="text-xs text-slate-400">{rent.horasReales}h × {TARIFA_HORA}€</p>
                        </div>
                        <div className="bg-slate-50 rounded-lg p-3">
                          <p className="text-xs text-slate-500 mb-1">Presupuesto</p>
                          <p className="text-sm font-bold text-slate-800">{formatCurrency(project.budget)}</p>
                        </div>
                        <div className={`rounded-lg p-3 ${rent.pct >= 20 ? 'bg-green-50' : rent.pct >= 0 ? 'bg-orange-50' : 'bg-red-50'}`}>
                          <p className="text-xs text-slate-500 mb-1">Margen</p>
                          <p className={`text-sm font-bold ${rent.pct >= 20 ? 'text-green-700' : rent.pct >= 0 ? 'text-orange-700' : 'text-red-700'}`}>
                            {formatCurrency(rent.margen)} ({rent.pct}%)
                          </p>
                          <p className="text-xs text-slate-400">{rent.pct >= 20 ? 'Rentable' : rent.pct >= 0 ? 'En riesgo' : 'Deficitario'}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Vista Kanban */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {ESTADOS.map(estado => {
            const proyectosEstado = filteredProjects.filter(p => p.status === estado.id);
            return (
              <div key={estado.id} className="bg-slate-50 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-3 h-3 rounded-full ${estado.dotColor}`} />
                  <span className="font-bold text-slate-700 text-sm uppercase">{estado.nombre}</span>
                  <span className="text-xs text-slate-400 ml-auto">{proyectosEstado.length}</span>
                </div>
                <div className="space-y-2">
                  {proyectosEstado.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-8">Sin proyectos</p>
                  ) : proyectosEstado.map(project => {
                    const progress       = getTaskProgress(project.tareas);
                    const deadlineStatus = getDeadlineStatus(project.deadline);
                    const horas          = getProjectHours(project.id);
                    const rent           = getRentabilidad(project);
                    return (
                      <div
                        key={project.id}
                        className="bg-white rounded-lg p-3 shadow-sm border border-slate-200 hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => { setEditingProject(project); setShowModal(true); }}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded truncate max-w-[80%]">{project.cliente?.name}</span>
                          {deadlineStatus === 'overdue' && <AlertTriangle size={14} className="text-red-500 flex-shrink-0" />}
                          {deadlineStatus === 'warning'  && <Clock size={14} className="text-orange-500 flex-shrink-0" />}
                        </div>
                        <h3 className="font-bold text-slate-900 text-sm mb-2 line-clamp-2">{project.title}</h3>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-2">
                          <div className="h-full bg-green-500" style={{ width: `${progress.percent}%` }} />
                        </div>
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span>{progress.completed}/{progress.total} tareas</span>
                          {isAdmin && horas > 0 && <span className="flex items-center gap-0.5"><Timer size={11} />{Math.round(horas * 10) / 10}h</span>}
                        </div>
                        {isAdmin && rent && (
                          <div className={`mt-2 text-xs font-bold flex items-center gap-1 ${rent.pct >= 20 ? 'text-green-600' : rent.pct >= 0 ? 'text-orange-500' : 'text-red-600'}`}>
                            {rent.pct >= 20 ? <TrendingUp size={12} /> : rent.pct >= 0 ? <Minus size={12} /> : <TrendingDown size={12} />}
                            {rent.pct}% margen
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <ModalProyecto
          proyecto={editingProject}
          clientes={clientes}
          usuarios={usuarios}
          isAdmin={isAdmin}
          onClose={() => setShowModal(false)}
          onSave={() => { fetchData(); setShowModal(false); }}
        />
      )}
    </div>
  );
};

function ModalProyecto({ proyecto, clientes, usuarios, isAdmin, onClose, onSave }: {
  proyecto: Proyecto | null;
  clientes: Cliente[];
  usuarios: Usuario[];
  isAdmin: boolean;
  onClose: () => void;
  onSave: () => void;
}) {
  const [form, setForm] = useState({
    title:           proyecto?.title || '',
    clienteId:       proyecto?.clienteId || '',
    responsibleId:   proyecto?.responsibleId || '',
    status:          proyecto?.status || 'ACTIVE',
    budget:          proyecto?.budget?.toString() || '',
    deadline:        proyecto?.deadline?.split('T')[0] || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.clienteId) return;
    setSaving(true);
    await authFetch('/api/proyectos', {
      method:  proyecto ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(proyecto ? { id: proyecto.id, ...form } : form),
    });
    setSaving(false);
    onSave();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold">{proyecto ? 'Editar' : 'Nuevo'} Proyecto</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nombre del Proyecto *</label>
            <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg" placeholder="Ej: Rediseño Web Corporativa" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Cliente *</label>
            <select value={form.clienteId} onChange={e => setForm({ ...form, clienteId: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg" required>
              <option value="">Seleccionar cliente...</option>
              {clientes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Responsable</label>
              <select value={form.responsibleId} onChange={e => setForm({ ...form, responsibleId: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg">
                <option value="">Sin asignar</option>
                {usuarios.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Estado</label>
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg">
                {ESTADOS.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {isAdmin && (
              <div>
                <label className="block text-sm font-medium mb-1">Presupuesto €</label>
                <input type="number" step="0.01" value={form.budget} onChange={e => setForm({ ...form, budget: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg" placeholder="0.00" />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-1">Deadline</label>
              <input type="date" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg" />
            </div>
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

export default ProjectsPage;
