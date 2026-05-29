import React, { useState, useEffect, useRef } from 'react';
import { authFetch } from '../../lib/auth-fetch';
import { useToast } from '../../components/ui/Toast';
import { useAuth } from '../../context/AuthContext';
import { useTimeTracking } from '../../context/TimeTrackingContext';
import { Card } from '../../components/ui/Card';
import { PageLoader } from '../../components/ui/PageLoader';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { TaskCreationModal } from '../../components/TaskCreationModal';
import { TaskDetailSheet } from '../../components/TaskDetailSheet';
import {
  Plus, Search, Play, Square, Flag, AlertCircle, Clock, AlertTriangle,
  CheckCircle2, Archive, FolderOpen, ChevronDown, ChevronRight, Building2,
  User, Zap, CalendarClock, Timer
} from 'lucide-react';

interface Proyecto {
  id: string;
  title: string;
  cliente?: { id: string; name: string };
}

interface Usuario {
  id: string;
  name: string;
  role: string;
}

interface Tarea {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  priority: string;
  type: string;
  proyectoId: string;
  assigneeId: string | null;
  estimatedHours: number | null;
  dueDate: string | null;
  proyecto?: Proyecto;
  assignee?: Usuario;
}

type QuickFilter = 'all' | 'mine' | 'urgent' | 'today' | 'in-progress';

const STATUS_OPTIONS = [
  { value: 'PENDING',     label: 'Pendiente',    variant: 'neutral' as const },
  { value: 'IN_PROGRESS', label: 'En progreso',  variant: 'blue' as const },
  { value: 'IN_REVIEW',   label: 'En revisión',  variant: 'blue' as const },
  { value: 'CORRECTION',  label: 'Corrección',   variant: 'warning' as const },
  { value: 'CLOSED',      label: 'Cerrada',      variant: 'success' as const },
];

export const TasksPage = () => {
  const { usuario } = useAuth();
  const { startTaskTimer, stopTaskTimer, activeTaskEntry, taskElapsedSeconds, formatTime } = useTimeTracking();
  const { error: toastError } = useToast();

  const [tasks, setTasks] = useState<Tarea[]>([]);
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Tarea | null>(null);
  const [viewMode, setViewMode] = useState<'activas' | 'archivadas'>('activas');
  const [searchTerm, setSearchTerm] = useState('');
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('all');
  const [expandedClients, setExpandedClients] = useState<Set<string>>(new Set());
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [statusDropdownId, setStatusDropdownId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cargar datos
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tareasRes, proyectosRes, usuariosRes] = await Promise.all([
          authFetch('/api/tareas'),
          authFetch('/api/proyectos'),
          authFetch('/api/usuarios')
        ]);
        if (!tareasRes.ok || !proyectosRes.ok || !usuariosRes.ok) throw new Error('Error al cargar datos');
        const [tareasData, proyectosData, usuariosData] = await Promise.all([
          tareasRes.json(), proyectosRes.json(), usuariosRes.json()
        ]);
        setTasks(tareasData);
        setProyectos(proyectosData);
        setUsuarios(usuariosData);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setIsLoading(false);
      }
    };
    if (usuario?.id) fetchData();
  }, [usuario?.id]);

  // Cerrar dropdown de estado al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setStatusDropdownId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ── Timer handlers ──
  const handleStartTimer = async (task: Tarea, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!usuario?.id) return;
    await startTaskTimer(
      { id: task.id, title: task.title, proyectoTitle: task.proyecto?.title },
      usuario.id
    );
  };

  const handleStopTimer = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await stopTaskTimer();
  };

  // ── Task CRUD ──
  const handleCreateTask = async (data: Record<string, unknown>) => {
    try {
      const response = await authFetch('/api/tareas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: data.title, description: data.description || null,
          proyectoId: data.proyectoId, type: data.type, priority: data.priority,
          assigneeId: data.assigneeId || null, estimatedHours: data.estimatedHours || null,
          dueDate: data.dueDate || null, isRecurring: data.isRecurring || false,
          recurrenceFrequency: data.recurrenceFrequency || null, leadTime: data.leadTime || 3
        })
      });
      if (!response.ok) throw new Error();
      const nuevaTarea = await response.json();
      setTasks([nuevaTarea, ...tasks]);
      setIsCreateModalOpen(false);
    } catch {
      toastError('Error al crear la tarea');
    }
  };

  const handleUpdateTask = (updatedTask: Tarea) => {
    setTasks(tasks.map(t => t.id === updatedTask.id ? updatedTask : t));
    setSelectedTask(updatedTask);
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks(tasks.filter(t => t.id !== taskId));
    setSelectedTask(null);
  };

  // Cambio de estado inline
  const handleChangeStatusInline = async (taskId: string, newStatus: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setStatusDropdownId(null);
    const prevTasks = tasks;
    setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    try {
      const res = await authFetch('/api/tareas', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: taskId, status: newStatus })
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setTasks(prev => prev.map(t => t.id === taskId ? updated : t));
    } catch {
      setTasks(prevTasks);
      toastError('Error al cambiar estado');
    }
  };

  // ── Grouping / filtering helpers ──
  const toggleClient = (name: string) => {
    const s = new Set(expandedClients);
    s.has(name) ? s.delete(name) : s.add(name);
    setExpandedClients(s);
  };
  const toggleProject = (id: string) => {
    const s = new Set(expandedProjects);
    s.has(id) ? s.delete(id) : s.add(id);
    setExpandedProjects(s);
  };

  if (isLoading) {
    return <PageLoader label="Cargando tareas..." />;
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-96 bg-red-50 p-6 rounded-lg border border-red-200">
        <AlertTriangle size={24} className="text-red-500 mr-3" />
        <p className="text-red-700 font-medium">Error: {error}</p>
      </div>
    );
  }

  const activeTasks = tasks.filter(t => t.status !== 'CLOSED');
  const archivedTasks = tasks.filter(t => t.status === 'CLOSED');

  const isOverdue = (d: string | null) => d ? new Date(d) < new Date() : false;
  const isToday = (d: string | null) => d ? new Date(d).toDateString() === new Date().toDateString() : false;
  const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString('es-ES') : 'Sin fecha';

  // Quick filter + search combinados
  const applyFilters = (list: Tarea[]) => {
    let filtered = list;
    if (quickFilter === 'mine') filtered = filtered.filter(t => t.assigneeId === usuario?.id);
    else if (quickFilter === 'urgent') filtered = filtered.filter(t => t.priority === 'URGENT' || t.priority === 'HIGH');
    else if (quickFilter === 'today') filtered = filtered.filter(t => isToday(t.dueDate) || isOverdue(t.dueDate));
    else if (quickFilter === 'in-progress') filtered = filtered.filter(t => t.status === 'IN_PROGRESS');
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(t =>
        t.title.toLowerCase().includes(term) ||
        t.proyecto?.title?.toLowerCase().includes(term) ||
        t.proyecto?.cliente?.name?.toLowerCase().includes(term) ||
        t.assignee?.name?.toLowerCase().includes(term)
      );
    }
    return filtered;
  };

  const sortedActiveTasks = applyFilters([...activeTasks]).sort((a, b) => {
    if (a.priority === 'URGENT' && b.priority !== 'URGENT') return -1;
    if (b.priority === 'URGENT' && a.priority !== 'URGENT') return 1;
    return 0;
  });

  const groupedByClient = applyFilters(archivedTasks).reduce((acc, task) => {
    const clientName = task.proyecto?.cliente?.name || 'Sin cliente';
    const projectName = task.proyecto?.title || 'Sin proyecto';
    const projectId = task.proyecto?.id || 'no-project';
    if (!acc[clientName]) acc[clientName] = {};
    if (!acc[clientName][projectId]) acc[clientName][projectId] = { name: projectName, tasks: [] };
    acc[clientName][projectId].tasks.push(task);
    return acc;
  }, {} as Record<string, Record<string, { name: string; tasks: Tarea[] }>>);

  const getClientTaskCount = (projects: Record<string, { name: string; tasks: Tarea[] }>) =>
    Object.values(projects).reduce((sum, p) => sum + p.tasks.length, 0);

  const PriorityIcon = ({ p }: { p: string }) => {
    switch (p) {
      case 'URGENT': return <Flag size={16} className="text-red-600 fill-current" />;
      case 'HIGH':   return <Flag size={16} className="text-orange-500 fill-current" />;
      case 'MEDIUM': return <Flag size={16} className="text-blue-500" />;
      default:       return <Flag size={16} className="text-gray-300" />;
    }
  };

  const QUICK_FILTERS: { key: QuickFilter; label: string; icon: React.ReactNode; count: number }[] = [
    { key: 'all',         label: 'Todas',       icon: <Clock size={13} />,        count: activeTasks.length },
    { key: 'mine',        label: 'Mis tareas',  icon: <User size={13} />,         count: activeTasks.filter(t => t.assigneeId === usuario?.id).length },
    { key: 'urgent',      label: 'Urgentes',    icon: <Zap size={13} />,          count: activeTasks.filter(t => t.priority === 'URGENT' || t.priority === 'HIGH').length },
    { key: 'today',       label: 'Vence hoy',   icon: <CalendarClock size={13} />, count: activeTasks.filter(t => isToday(t.dueDate) || isOverdue(t.dueDate)).length },
    { key: 'in-progress', label: 'En progreso', icon: <Timer size={13} />,        count: activeTasks.filter(t => t.status === 'IN_PROGRESS').length },
  ];

  // Convertir activeTaskEntry al formato que espera TaskDetailSheet
  const activeTimerForSheet = activeTaskEntry
    ? { id: activeTaskEntry.id, tareaId: activeTaskEntry.tareaId, startTime: activeTaskEntry.startTime }
    : null;

  return (
    <div className="space-y-4 animate-in fade-in duration-300">

      {/* Banner timer activo */}
      {activeTaskEntry && (
        <div className="bg-elio-black text-white px-4 py-3 rounded-xl flex flex-wrap items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-2.5 h-2.5 bg-elio-yellow rounded-full animate-pulse flex-shrink-0" />
            <div className="min-w-0">
              <span className="text-xs text-gray-400 block leading-none mb-0.5 truncate">
                {activeTaskEntry.proyectoTitle || 'Timer activo'}
              </span>
              <span className="font-semibold text-sm truncate block">{activeTaskEntry.taskTitle}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xl font-mono font-bold text-elio-yellow tabular-nums">
              {formatTime(taskElapsedSeconds)}
            </span>
            <button
              onClick={handleStopTimer}
              className="bg-gray-800 hover:bg-red-900/60 text-white hover:text-red-400 px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 text-sm transition-colors"
            >
              <Square size={13} className="fill-current" /> Detener
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Tareas</h1>
          <p className="text-gray-500 text-sm">Listado operativo centralizado.</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-8 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-full sm:w-56 outline-none focus:border-elio-yellow"
            />
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-elio-yellow text-white px-4 py-2 rounded-lg hover:bg-elio-yellow-hover transition-colors flex items-center gap-2 font-medium whitespace-nowrap shadow-sm"
          >
            <Plus size={17} />
            <span className="hidden sm:inline">Nueva Tarea</span>
            <span className="sm:hidden">Nueva</span>
          </button>
        </div>
      </div>

      {/* Quick filters */}
      {viewMode === 'activas' && (
        <div className="flex items-center gap-2 flex-wrap">
          {QUICK_FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setQuickFilter(f.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
                quickFilter === f.key
                  ? 'bg-elio-yellow text-white border-elio-yellow shadow-sm'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-elio-yellow hover:text-elio-yellow'
              }`}
            >
              {f.icon}
              {f.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                quickFilter === f.key ? 'bg-white/30 text-white' : 'bg-gray-100 text-gray-500'
              }`}>
                {f.count}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200">
        <button
          onClick={() => setViewMode('activas')}
          className={`flex items-center gap-2 px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
            viewMode === 'activas' ? 'border-elio-yellow text-elio-yellow' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Clock size={15} />
          Activas
          <span className={`px-2 py-0.5 rounded-full text-xs ${viewMode === 'activas' ? 'bg-elio-yellow text-white' : 'bg-gray-100 text-gray-600'}`}>
            {activeTasks.length}
          </span>
        </button>
        <button
          onClick={() => setViewMode('archivadas')}
          className={`flex items-center gap-2 px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
            viewMode === 'archivadas' ? 'border-green-600 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Archive size={15} />
          Archivadas
          <span className={`px-2 py-0.5 rounded-full text-xs ${viewMode === 'archivadas' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
            {archivedTasks.length}
          </span>
        </button>
      </div>

      {/* Vista Activas */}
      {viewMode === 'activas' && (
        <Card noPadding className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-500 font-bold tracking-wider">
                <tr>
                  <th className="px-4 py-3 w-12 text-center">Timer</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 w-2/5">Tarea / Proyecto</th>
                  <th className="px-4 py-3 text-center">Prio</th>
                  <th className="px-4 py-3">Asignado</th>
                  <th className="px-4 py-3">Deadline</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sortedActiveTasks.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-14 text-center text-gray-500">
                      <CheckCircle2 size={36} className="mx-auto mb-3 text-green-400 opacity-60" />
                      <p className="font-medium">
                        {quickFilter !== 'all' ? 'No hay tareas con este filtro' : '¡Sin tareas pendientes!'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  sortedActiveTasks.map(task => {
                    const overdue = isOverdue(task.dueDate) && task.status !== 'CLOSED';
                    const today = isToday(task.dueDate) && task.status !== 'CLOSED';
                    const isTimerActive = activeTaskEntry?.tareaId === task.id;
                    const currentStatus = STATUS_OPTIONS.find(s => s.value === task.status);

                    return (
                      <tr
                        key={task.id}
                        onClick={() => setSelectedTask(task)}
                        className={`group hover:bg-gray-50 transition-colors cursor-pointer ${
                          isTimerActive ? 'bg-yellow-50/60' : ''
                        } ${task.priority === 'URGENT' ? 'bg-red-50/40' : ''}`}
                      >
                        {/* Timer button */}
                        <td className="px-4 py-3 text-center">
                          {isTimerActive ? (
                            <button
                              onClick={handleStopTimer}
                              className="w-8 h-8 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center mx-auto transition-all shadow-sm"
                            >
                              <Square size={11} className="fill-current" />
                            </button>
                          ) : (
                            <button
                              onClick={e => handleStartTimer(task, e)}
                              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-elio-yellow hover:text-white flex items-center justify-center text-gray-400 mx-auto transition-all shadow-sm opacity-0 group-hover:opacity-100"
                            >
                              <Play size={12} className="ml-0.5 fill-current" />
                            </button>
                          )}
                        </td>

                        {/* Estado con dropdown inline */}
                        <td className="px-4 py-3 relative" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={e => { e.stopPropagation(); setStatusDropdownId(statusDropdownId === task.id ? null : task.id); }}
                            className="hover:opacity-80 transition-opacity"
                          >
                            <Badge variant={currentStatus?.variant || 'neutral'}>
                              {currentStatus?.label || task.status.replace('_', ' ')}
                            </Badge>
                          </button>
                          {statusDropdownId === task.id && (
                            <div
                              ref={dropdownRef}
                              className="absolute left-0 top-full mt-1 z-30 bg-white rounded-xl shadow-xl border border-gray-100 py-1 min-w-[150px]"
                            >
                              {STATUS_OPTIONS.filter(s => s.value !== 'CLOSED').map(s => (
                                <button
                                  key={s.value}
                                  onClick={e => handleChangeStatusInline(task.id, s.value, e)}
                                  className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 transition-colors ${task.status === s.value ? 'font-bold text-elio-yellow' : 'text-gray-700'}`}
                                >
                                  <Badge variant={s.variant}>{s.label}</Badge>
                                </button>
                              ))}
                            </div>
                          )}
                        </td>

                        {/* Tarea / Proyecto */}
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className="font-semibold text-gray-900 group-hover:text-elio-yellow-hover transition-colors truncate max-w-xs">
                              {task.title}
                              {isTimerActive && (
                                <span className="ml-2 text-xs font-mono font-bold text-elio-yellow tabular-nums">
                                  {formatTime(taskElapsedSeconds)}
                                </span>
                              )}
                            </span>
                            <span className="text-[11px] text-gray-400 uppercase tracking-wide mt-0.5">
                              {task.proyecto?.title || 'Sin proyecto'}
                              {task.proyecto?.cliente?.name && (
                                <span className="text-gray-300"> · {task.proyecto.cliente.name}</span>
                              )}
                            </span>
                          </div>
                        </td>

                        {/* Prioridad */}
                        <td className="px-4 py-3 text-center">
                          <div className="flex justify-center"><PriorityIcon p={task.priority} /></div>
                        </td>

                        {/* Asignado */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-[10px] font-bold text-gray-600 flex-shrink-0">
                              {task.assignee?.name?.charAt(0) || '?'}
                            </div>
                            <span className="text-gray-600 text-xs truncate max-w-[80px]">
                              {task.assignee?.name?.split(' ')[0] || 'Sin asignar'}
                            </span>
                          </div>
                        </td>

                        {/* Deadline */}
                        <td className="px-4 py-3">
                          <div className={`flex items-center gap-1.5 ${overdue || today ? 'text-red-600 font-bold' : 'text-gray-500'}`}>
                            {overdue || today
                              ? <AlertCircle size={13} />
                              : <Clock size={13} className="text-gray-400" />
                            }
                            <span className="text-xs">{today ? 'HOY' : formatDate(task.dueDate)}</span>
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
      )}

      {/* Vista Archivadas */}
      {viewMode === 'archivadas' && (
        <div className="space-y-4">
          {/* Quick search para archivadas */}
          <div className="relative max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar en archivadas..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-8 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-full outline-none focus:border-elio-yellow"
            />
          </div>

          {Object.keys(groupedByClient).length === 0 ? (
            <Card className="text-center py-12">
              <Archive size={36} className="mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500">No hay tareas archivadas</p>
            </Card>
          ) : (
            Object.entries(groupedByClient).map(([clientName, projects]) => {
              const isClientExpanded = expandedClients.has(clientName);
              const count = getClientTaskCount(projects);
              return (
                <Card key={clientName} noPadding className="overflow-hidden">
                  <button
                    onClick={() => toggleClient(clientName)}
                    className="w-full bg-slate-50 px-5 py-3.5 border-b border-slate-100 flex items-center gap-3 hover:bg-slate-100 transition-colors"
                  >
                    {isClientExpanded ? <ChevronDown size={18} className="text-slate-500" /> : <ChevronRight size={18} className="text-slate-500" />}
                    <Building2 size={17} className="text-slate-500" />
                    <h3 className="font-bold text-slate-700 flex-1 text-left">{clientName}</h3>
                    <span className="text-xs bg-slate-600 text-white px-2.5 py-0.5 rounded-full">
                      {count} {count === 1 ? 'tarea' : 'tareas'}
                    </span>
                  </button>
                  {isClientExpanded && (
                    <div className="divide-y divide-gray-50">
                      {Object.entries(projects).map(([projectId, projectData]) => {
                        const isExpanded = expandedProjects.has(projectId);
                        return (
                          <div key={projectId}>
                            <button
                              onClick={() => toggleProject(projectId)}
                              className="w-full bg-green-50/50 px-5 py-2.5 flex items-center gap-3 hover:bg-green-50 transition-colors"
                            >
                              {isExpanded ? <ChevronDown size={14} className="text-green-600 ml-5" /> : <ChevronRight size={14} className="text-green-600 ml-5" />}
                              <FolderOpen size={14} className="text-green-600" />
                              <span className="font-medium text-green-800 flex-1 text-left text-sm">{projectData.name}</span>
                              <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded-full">{projectData.tasks.length}</span>
                            </button>
                            {isExpanded && (
                              <div>
                                {projectData.tasks.map(task => (
                                  <div
                                    key={task.id}
                                    onClick={() => setSelectedTask(task)}
                                    className="px-5 py-2.5 pl-16 hover:bg-gray-50 cursor-pointer flex items-center justify-between border-t border-gray-50 group"
                                  >
                                    <div className="flex items-center gap-3">
                                      <CheckCircle2 size={14} className="text-green-400 flex-shrink-0" />
                                      <div>
                                        <p className="font-medium text-gray-600 text-sm group-hover:text-gray-900 transition-colors">{task.title}</p>
                                        <p className="text-xs text-gray-400">{task.assignee?.name || 'Sin asignar'}</p>
                                      </div>
                                    </div>
                                    <span className="text-xs text-gray-400">{task.dueDate ? formatDate(task.dueDate) : ''}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Card>
              );
            })
          )}
        </div>
      )}

      {/* Modales */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Nueva Tarea">
        <TaskCreationModal
          onSubmit={handleCreateTask}
          onCancel={() => setIsCreateModalOpen(false)}
          proyectos={proyectos}
          usuarios={usuarios}
        />
      </Modal>

      <TaskDetailSheet
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        task={selectedTask}
        onUpdate={handleUpdateTask}
        onDelete={handleDeleteTask}
        proyectos={proyectos}
        usuarios={usuarios}
        activeTimer={activeTimerForSheet}
        onStartTimer={tareaId => {
          const task = tasks.find(t => t.id === tareaId);
          if (task && usuario?.id) startTaskTimer({ id: task.id, title: task.title, proyectoTitle: task.proyecto?.title }, usuario.id);
        }}
        onStopTimer={stopTaskTimer}
        elapsedTime={taskElapsedSeconds}
      />
    </div>
  );
};
