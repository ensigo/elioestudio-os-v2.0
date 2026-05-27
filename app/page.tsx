import React, { useState, useEffect } from 'react';
import { authFetch } from '../lib/auth-fetch';
import { Card } from '../components/ui/Card';
import { PageLoader } from '../components/ui/PageLoader';
import {
  Play, Calendar, CheckSquare, ChevronLeft, ChevronRight,
  Clock, Briefcase, X, CheckCircle2, Flag, Users,
  FolderOpen, Ticket, Coffee, Square,
  Zap, Activity
} from 'lucide-react';
import { useTimeTracking } from '../context/TimeTrackingContext';
import { useAuth } from '../context/AuthContext';

interface DashboardStats {
  clientes: { total: number; activos: number };
  proyectos: { total: number; activos: number };
  tareas: { total: number; pendientes: number; urgentes: number };
  tickets: { abiertos: number };
}

interface Evento {
  id: string;
  title: string;
  type: string;
  startDate: string;
  startTime: string | null;
  description: string | null;
}

interface Tarea {
  id: string;
  title: string;
  priority: string;
  status: string;
  dueDate: string | null;
  proyecto?: { title: string };
  assignee?: { id?: string; name: string };
}

interface EquipoMiembro {
  usuario: { id: string; name: string; position: string | null };
  jornada: { estado: string; horaInicio: string };
  tareaActiva: { title: string; proyecto: string; cliente: string; minutos: number | null } | null;
}

interface DetailItem {
  title: string;
  type: string;
  category?: string;
  info: string;
  meta: string;
  subMeta?: string;
}

interface DashboardPageProps {
  onNavigate?: (page: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const { usuario } = useAuth();
  const {
    isClockedIn,
    isPaused,
    formatTime,
    elapsedSeconds,
    jornadaActual,
    iniciarJornada,
    pausarJornada,
    reanudarJornada,
    finalizarJornada,
    cargarJornadaHoy,
    activeTaskEntry,
    taskElapsedSeconds,
    startTaskTimer,
    stopTaskTimer,
  } = useTimeTracking();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [misTareas, setMisTareas] = useState<Tarea[]>([]);
  const [equipoActivo, setEquipoActivo] = useState<EquipoMiembro[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDetail, setSelectedDetail] = useState<DetailItem | null>(null);
  const [isQuickEventModalOpen, setIsQuickEventModalOpen] = useState(false);
  const [quickEventDate, setQuickEventDate] = useState<Date | null>(null);
  const [quickEventForm, setQuickEventForm] = useState({
    title: '',
    type: 'MEETING',
    startTime: '09:00',
    description: ''
  });

  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  });

  const isAdmin = usuario?.role === 'ADMIN' || usuario?.role === 'SUPERADMIN';

  useEffect(() => {
    const fetchDashboard = async () => {
      if (!usuario?.id) return;

      cargarJornadaHoy(usuario.id);

      try {
        const requests: Promise<Response>[] = [
          authFetch(`/api/dashboard?userId=${usuario.id}&userRole=${usuario.role}`),
          authFetch('/api/eventos'),
          authFetch('/api/tareas'),
        ];
        if (isAdmin) {
          requests.push(authFetch('/api/control-horario?entity=equipo-activo'));
        }

        const results = await Promise.all(requests);
        const [dashRes, eventosRes, tareasRes, equipoRes] = results;

        if (dashRes.ok) {
          const dashData = await dashRes.json();
          setStats(dashData.stats);
          setTareas(dashData.tareasRecientes || []);
        }

        if (eventosRes.ok) {
          const eventosData = await eventosRes.json();
          setEventos(eventosData);
        }

        if (tareasRes.ok) {
          const todasTareas: Tarea[] = await tareasRes.json();
          const propias = todasTareas.filter(t =>
            t.assignee?.id === usuario.id &&
            t.status !== 'CLOSED'
          );
          setMisTareas(propias.slice(0, 8));
        }

        if (equipoRes?.ok) {
          const equipoData = await equipoRes.json();
          setEquipoActivo(equipoData);
        }
      } catch (err) {
        console.error('Error cargando dashboard:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboard();
  }, [usuario]);

  const TODAY = new Date();

  const changeWeek = (offset: number) => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + (offset * 7));
    setCurrentWeekStart(newDate);
  };

  const weekDays = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(currentWeekStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  const getEventsForDay = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return eventos.filter(e => e.startDate.split('T')[0] === dateStr);
  };

  const openTaskDetail = (task: Tarea) => {
    setSelectedDetail({
      title: task.title,
      type: 'Tarea',
      category: task.priority,
      info: `Estado: ${task.status}`,
      meta: `Proyecto: ${task.proyecto?.title || 'Sin proyecto'}`,
      subMeta: task.dueDate ? `Vencimiento: ${new Date(task.dueDate).toLocaleDateString('es-ES')}` : 'Sin fecha límite'
    });
  };

  const openEventDetail = (evt: Evento) => {
    setSelectedDetail({
      title: evt.title,
      type: evt.type,
      category: evt.type,
      info: evt.description || 'Sin descripción',
      meta: `Hora: ${evt.startTime || 'Todo el día'}`,
      subMeta: new Date(evt.startDate).toLocaleDateString('es-ES')
    });
  };

  const openQuickEventModal = (date: Date) => {
    setQuickEventDate(date);
    setQuickEventForm({ title: '', type: 'MEETING', startTime: '09:00', description: '' });
    setIsQuickEventModalOpen(true);
  };

  const handleCreateQuickEvent = async () => {
    if (!quickEventForm.title.trim() || !quickEventDate || !usuario) return;
    try {
      const response = await authFetch('/api/eventos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: quickEventForm.title,
          type: quickEventForm.type,
          startDate: quickEventDate.toISOString().split('T')[0],
          startTime: quickEventForm.startTime,
          description: quickEventForm.description || null,
          createdById: usuario.id
        })
      });
      if (response.ok) {
        const nuevoEvento = await response.json();
        setEventos([...eventos, nuevoEvento]);
        setIsQuickEventModalOpen(false);
      }
    } catch (error) {
      console.error('Error creando evento:', error);
    }
  };

  const handlePlayTask = async (task: Tarea) => {
    if (!usuario?.id) return;
    if (activeTaskEntry?.tareaId === task.id) {
      await stopTaskTimer();
    } else {
      await startTaskTimer(
        { id: task.id, title: task.title, proyectoTitle: task.proyecto?.title },
        usuario.id
      );
    }
  };

  const getEventColor = (type: string) => {
    switch(type) {
      case 'MEETING': return 'bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100';
      case 'DEADLINE': return 'bg-red-50 text-red-700 border-red-100 hover:bg-red-100';
      case 'VACATION': return 'bg-yellow-50 text-yellow-700 border-yellow-100 hover:bg-yellow-100';
      case 'REMINDER': return 'bg-purple-50 text-purple-700 border-purple-100 hover:bg-purple-100';
      default: return 'bg-gray-50 text-gray-600 border-gray-100';
    }
  };

  const getPriorityColor = (prio: string) => {
    switch(prio) {
      case 'URGENT': return 'text-red-600 bg-red-50 border-red-100';
      case 'HIGH': return 'text-orange-600 bg-orange-50 border-orange-100';
      default: return 'text-blue-600 bg-blue-50 border-blue-100';
    }
  };

  const getDueLabel = (dueDate: string | null) => {
    if (!dueDate) return 'Sin fecha';
    const due = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return 'Vencida';
    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Mañana';
    return `${diffDays} días`;
  };

  const getStatusLabel = (status: string) => {
    switch(status) {
      case 'PENDING':     return 'Pendiente';
      case 'IN_PROGRESS': return 'En progreso';
      case 'IN_REVIEW':   return 'Revisión';
      case 'CORRECTION':  return 'Corrección';
      default: return status;
    }
  };

  const getStatusDot = (status: string) => {
    switch(status) {
      case 'IN_PROGRESS': return 'bg-blue-500';
      case 'IN_REVIEW':   return 'bg-purple-500';
      case 'CORRECTION':  return 'bg-orange-500';
      default: return 'bg-gray-300';
    }
  };

  const getEquipoStateColor = (estado: string) => {
    switch(estado) {
      case 'EN_CURSO': return 'bg-green-500';
      case 'PAUSADA': return 'bg-orange-500';
      case 'FINALIZADA': return 'bg-gray-400';
      default: return 'bg-gray-300';
    }
  };

  if (isLoading) {
    return <PageLoader label="Cargando dashboard..." />;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">

      {/* MI DÍA — sección operativa */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

        {/* Jornada + Tarea activa */}
        <div className="col-span-1 md:col-span-5">
          <div className="bg-elio-black text-white rounded-xl p-6 h-full flex flex-col gap-5 shadow-xl">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Mi Jornada Hoy</p>
              {jornadaActual && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  jornadaActual.estado === 'EN_CURSO' ? 'bg-green-500/20 text-green-400' :
                  jornadaActual.estado === 'PAUSADA' ? 'bg-orange-500/20 text-orange-400' :
                  'bg-gray-500/20 text-gray-400'
                }`}>
                  {jornadaActual.estado === 'EN_CURSO' ? 'En curso' :
                   jornadaActual.estado === 'PAUSADA' ? 'Pausada' : 'Finalizada'}
                </span>
              )}
            </div>

            {/* Jornada timer */}
            <div className="text-center">
              <p className={`text-5xl font-mono font-bold tabular-nums ${
                isClockedIn
                  ? isPaused ? 'text-orange-400' : 'text-green-400'
                  : jornadaActual?.estado === 'FINALIZADA' ? 'text-blue-400' : 'text-gray-500'
              }`}>
                {formatTime(elapsedSeconds)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {jornadaActual?.horaInicio
                  ? `Inicio: ${new Date(jornadaActual.horaInicio).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`
                  : 'Jornada no iniciada'}
              </p>
            </div>

            {/* Botones de jornada */}
            <div className="flex gap-2 justify-center">
              {!jornadaActual || jornadaActual.estado === 'FINALIZADA' ? (
                <button
                  onClick={() => usuario?.id && iniciarJornada(usuario.id)}
                  disabled={jornadaActual?.estado === 'FINALIZADA'}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
                    jornadaActual?.estado === 'FINALIZADA'
                      ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                      : 'bg-green-500 hover:bg-green-400 text-white shadow-lg shadow-green-900/30'
                  }`}
                >
                  <Play size={16} />
                  {jornadaActual?.estado === 'FINALIZADA' ? 'Completada' : 'Iniciar Jornada'}
                </button>
              ) : jornadaActual.estado === 'EN_CURSO' ? (
                <>
                  {!jornadaActual.horaPausaAlmuerzo && (
                    <button
                      onClick={() => usuario?.id && pausarJornada(usuario.id)}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm bg-orange-500 hover:bg-orange-400 text-white transition-all"
                    >
                      <Coffee size={16} />
                      Pausa
                    </button>
                  )}
                  <button
                    onClick={() => usuario?.id && finalizarJornada(usuario.id)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm bg-red-500 hover:bg-red-400 text-white transition-all"
                  >
                    <Square size={16} />
                    Finalizar
                  </button>
                </>
              ) : jornadaActual.estado === 'PAUSADA' ? (
                <button
                  onClick={() => usuario?.id && reanudarJornada(usuario.id)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-green-500 hover:bg-green-400 text-white transition-all"
                >
                  <Play size={16} />
                  Reanudar
                </button>
              ) : null}
            </div>

            {/* Tarea activa */}
            {activeTaskEntry && (
              <div className="border-t border-gray-700 pt-4">
                <p className="text-[10px] text-gray-500 uppercase font-bold mb-2 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-elio-yellow animate-pulse inline-block" />
                  Tarea activa
                </p>
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    {activeTaskEntry.proyectoTitle && (
                      <p className="text-[10px] text-gray-400 truncate">{activeTaskEntry.proyectoTitle}</p>
                    )}
                    <p className="text-sm font-semibold text-white truncate">{activeTaskEntry.taskTitle}</p>
                    <p className="text-xl font-mono text-elio-yellow font-bold tabular-nums mt-0.5">
                      {formatTime(taskElapsedSeconds)}
                    </p>
                  </div>
                  <button
                    onClick={stopTaskTimer}
                    className="flex-shrink-0 p-2.5 bg-gray-800 hover:bg-red-900/60 hover:text-red-400 rounded-xl transition-colors"
                    title="Detener timer"
                  >
                    <Square size={16} className="fill-current" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mis Tareas (list con play buttons) */}
        <div className="col-span-1 md:col-span-7">
          <div className="bg-white border border-gray-200 rounded-xl p-5 h-full shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Zap size={18} className="text-elio-yellow" />
                Mis Tareas
              </h3>
              <button
                onClick={() => onNavigate?.('tareas')}
                className="text-xs font-bold text-elio-yellow hover:underline"
              >
                Ver todas
              </button>
            </div>

            {misTareas.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                <CheckSquare size={28} className="mb-2 opacity-30" />
                <p className="text-sm">No tienes tareas asignadas pendientes</p>
              </div>
            ) : (
              <div className="space-y-1.5 overflow-y-auto max-h-[300px] pr-1">
                {misTareas.map(task => {
                  const isActive = activeTaskEntry?.tareaId === task.id;
                  return (
                    <div
                      key={task.id}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group ${
                        isActive
                          ? 'bg-yellow-50 border border-elio-yellow/30'
                          : 'hover:bg-slate-50 border border-transparent hover:border-slate-100'
                      }`}
                    >
                      <button
                        onClick={() => handlePlayTask(task)}
                        disabled={!isClockedIn}
                        className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                          isActive
                            ? 'bg-elio-yellow text-white shadow-sm'
                            : isClockedIn
                              ? 'bg-gray-100 text-gray-400 hover:bg-elio-yellow hover:text-white group-hover:opacity-100'
                              : 'bg-gray-100 text-gray-300 cursor-not-allowed'
                        }`}
                        title={isActive ? 'Detener timer' : (isClockedIn ? 'Iniciar timer' : 'Inicia la jornada primero')}
                      >
                        {isActive ? <Square size={13} className="fill-current" /> : <Play size={13} className="fill-current" />}
                      </button>

                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold truncate ${isActive ? 'text-amber-900' : 'text-slate-800'}`}>
                          {task.title}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          {task.proyecto?.title || 'Sin proyecto'}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {isActive && (
                          <span className="text-xs font-mono font-bold text-elio-yellow tabular-nums">
                            {formatTime(taskElapsedSeconds)}
                          </span>
                        )}
                        {task.priority === 'URGENT' && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-50 text-red-500 border border-red-100">
                            URG
                          </span>
                        )}
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${getStatusDot(task.status)}`} title={getStatusLabel(task.status)} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {!isClockedIn && jornadaActual?.estado !== 'FINALIZADA' && (
              <p className="text-xs text-gray-400 text-center mt-3 flex items-center justify-center gap-1">
                <Clock size={11} />
                Inicia la jornada para registrar tiempo en tareas
              </p>
            )}
          </div>
        </div>
      </div>

      {/* FILA 2: Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="cursor-pointer hover:scale-105 transition-transform" onClick={() => onNavigate?.('clientes')}>
          <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-blue-600 uppercase">Clientes</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.clientes.activos || 0}</p>
                <p className="text-xs text-gray-500">de {stats?.clientes.total || 0} totales</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl"><Users size={24} className="text-blue-600" /></div>
            </div>
          </Card>
        </div>

        <div className="cursor-pointer hover:scale-105 transition-transform" onClick={() => onNavigate?.('proyectos')}>
          <Card className="bg-gradient-to-br from-green-50 to-white border-green-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-green-600 uppercase">Proyectos</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.proyectos.activos || 0}</p>
                <p className="text-xs text-gray-500">activos</p>
              </div>
              <div className="p-3 bg-green-100 rounded-xl"><FolderOpen size={24} className="text-green-600" /></div>
            </div>
          </Card>
        </div>

        <div className="cursor-pointer hover:scale-105 transition-transform" onClick={() => onNavigate?.('tareas')}>
          <Card className="bg-gradient-to-br from-orange-50 to-white border-orange-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-orange-600 uppercase">Tareas</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.tareas.pendientes || 0}</p>
                <p className="text-xs text-gray-500">{stats?.tareas.urgentes || 0} urgentes</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-xl"><CheckSquare size={24} className="text-orange-600" /></div>
            </div>
          </Card>
        </div>

        <div className="cursor-pointer hover:scale-105 transition-transform" onClick={() => onNavigate?.('tickets')}>
          <Card className="bg-gradient-to-br from-purple-50 to-white border-purple-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-purple-600 uppercase">Tickets</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.tickets.abiertos || 0}</p>
                <p className="text-xs text-gray-500">abiertos</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-xl"><Ticket size={24} className="text-purple-600" /></div>
            </div>
          </Card>
        </div>
      </div>

      {/* FILA 3: Semana */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
          <h3 className="font-bold text-slate-900 text-lg flex items-center">
            <Briefcase className="mr-2 text-slate-400" size={20} /> Mi Semana
          </h3>
          <div className="flex items-center space-x-2 bg-slate-50 rounded-lg p-1 border border-slate-100">
            <button onClick={() => changeWeek(-1)} className="p-2 hover:bg-white rounded-md shadow-sm transition-all text-slate-500 hover:text-slate-900"><ChevronLeft size={18} /></button>
            <span className="text-sm font-semibold text-slate-700 min-w-[140px] text-center select-none">
              {weekDays[0].getDate()} - {weekDays[6].getDate()} {new Intl.DateTimeFormat('es-ES', { month: 'short' }).format(weekDays[6])}
            </span>
            <button onClick={() => changeWeek(1)} className="p-2 hover:bg-white rounded-md shadow-sm transition-all text-slate-500 hover:text-slate-900"><ChevronRight size={18} /></button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
          {weekDays.map((day, idx) => {
            const dayEvents = getEventsForDay(day);
            const isToday = day.getDate() === TODAY.getDate() && day.getMonth() === TODAY.getMonth();
            return (
              <div key={idx} className={`min-h-[140px] border rounded-xl p-2 flex flex-col transition-colors ${isToday ? 'bg-blue-50/30 border-blue-200 shadow-sm' : 'bg-white border-slate-100'}`}>
                <div className="text-center mb-2 border-b border-slate-50 pb-2">
                  <span className="block text-[10px] uppercase text-slate-400 font-bold mb-1">{new Intl.DateTimeFormat('es-ES', { weekday: 'short' }).format(day)}</span>
                  <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold ${isToday ? 'bg-slate-900 text-white' : 'text-slate-700'}`}>
                    {day.getDate()}
                  </span>
                </div>
                <div className="space-y-1.5 flex-1">
                  {dayEvents.length > 0 ? dayEvents.slice(0, 2).map(evt => (
                    <div
                      key={evt.id}
                      className={`text-[10px] px-2 py-1.5 rounded-lg border cursor-pointer transition-all active:scale-95 ${getEventColor(evt.type)}`}
                      onClick={() => openEventDetail(evt)}
                    >
                      <span className="font-bold block opacity-80 mb-0.5">{evt.startTime || '•'}</span>
                      <span className="font-semibold leading-tight line-clamp-2">{evt.title}</span>
                    </div>
                  )) : (
                    <button
                      onClick={() => openQuickEventModal(day)}
                      className="h-full w-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                    >
                      <span className="text-xl text-slate-400 hover:text-elio-yellow select-none">+</span>
                    </button>
                  )}
                  {dayEvents.length > 2 && (
                    <span className="text-[10px] text-gray-400">+{dayEvents.length - 2} más</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* FILA 4: Tareas prioritarias + Próximos eventos */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="col-span-1 md:col-span-8">
          <Card
            title="Tareas Prioritarias"
            action={<button onClick={() => onNavigate?.('tareas')} className="text-xs font-bold text-elio-yellow hover:underline">Ver todas</button>}
            className="h-full"
          >
            {tareas.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CheckSquare size={32} className="mx-auto mb-2 opacity-30" />
                <p>No hay tareas urgentes. ¡Buen trabajo!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {tareas.map(task => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-white hover:shadow-md border border-transparent hover:border-slate-100 cursor-pointer transition-all group"
                    onClick={() => openTaskDetail(task)}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="p-2 rounded-full bg-white border border-slate-200 text-slate-400 group-hover:text-elio-yellow group-hover:border-elio-yellow transition-colors">
                        <CheckSquare size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{task.title}</p>
                        <p className="text-xs text-slate-500 font-medium">{task.proyecto?.title || 'Sin proyecto'}</p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-3 py-1 rounded-full border ${getPriorityColor(task.priority)}`}>
                      {getDueLabel(task.dueDate).toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="col-span-1 md:col-span-4">
          <Card title="Próximos Eventos" className="h-full">
            {(() => {
              const todayStr = new Date().toISOString().split('T')[0];
              const upcoming = eventos
                .filter(e => e.startDate.split('T')[0] >= todayStr)
                .sort((a, b) => a.startDate.localeCompare(b.startDate))
                .slice(0, 5);
              return upcoming.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Calendar size={32} className="mx-auto mb-2 opacity-30" />
                  <p>No hay eventos próximos</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {upcoming.map(evt => {
                    const evtDate = new Date(evt.startDate);
                    const isToday = evt.startDate.split('T')[0] === todayStr;
                    return (
                      <div
                        key={evt.id}
                        className={`flex items-start p-3 rounded-xl cursor-pointer transition-colors group border ${
                          isToday
                            ? 'bg-blue-50/50 border-blue-100 hover:bg-blue-50'
                            : 'hover:bg-slate-50 border-transparent hover:border-slate-100'
                        }`}
                        onClick={() => openEventDetail(evt)}
                      >
                        <div className="min-w-[50px] text-center border-r border-slate-100 pr-3 mr-3">
                          <span className={`block text-lg font-bold leading-none ${isToday ? 'text-blue-600' : 'text-slate-900'}`}>
                            {evtDate.getDate()}
                          </span>
                          <span className="block text-[10px] uppercase font-bold text-slate-400">
                            {new Intl.DateTimeFormat('es-ES', { month: 'short' }).format(evtDate)}
                          </span>
                          {isToday && <span className="block text-[9px] font-bold text-blue-500 uppercase">Hoy</span>}
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-1">{evt.title}</h4>
                          <div className="flex items-center mt-1 text-xs text-slate-500">
                            <Clock size={12} className="mr-1" /> {evt.startTime || 'Todo el día'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </Card>
        </div>
      </div>

      {/* FILA 5: Equipo Activo (admin only) */}
      {isAdmin && equipoActivo.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
              <Activity size={20} className="text-green-500" />
              Equipo Activo Hoy
            </h3>
            <span className="text-xs text-gray-400 font-medium">
              {equipoActivo.filter(m => m.jornada.estado === 'EN_CURSO').length} en curso · {equipoActivo.length} con jornada
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {equipoActivo.map((miembro) => (
              <div
                key={miembro.usuario.id}
                className={`rounded-xl border p-4 transition-all ${
                  miembro.jornada.estado === 'EN_CURSO'
                    ? 'border-green-100 bg-green-50/50'
                    : miembro.jornada.estado === 'PAUSADA'
                      ? 'border-orange-100 bg-orange-50/30'
                      : 'border-gray-100 bg-gray-50/50'
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="relative flex-shrink-0">
                    <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-sm">
                      {miembro.usuario.name.charAt(0).toUpperCase()}
                    </div>
                    <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${getEquipoStateColor(miembro.jornada.estado)}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">{miembro.usuario.name}</p>
                    <p className="text-[10px] text-slate-400 truncate">{miembro.usuario.position || 'Sin cargo'}</p>
                  </div>
                </div>

                {miembro.tareaActiva ? (
                  <div className="bg-white rounded-lg p-2.5 border border-slate-100">
                    <p className="text-[10px] text-slate-400 font-bold uppercase mb-1 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block" />
                      Trabajando en
                    </p>
                    <p className="text-xs font-semibold text-slate-800 line-clamp-2 leading-tight">{miembro.tareaActiva.title}</p>
                    {miembro.tareaActiva.proyecto && (
                      <p className="text-[10px] text-slate-400 mt-1 truncate">{miembro.tareaActiva.proyecto}</p>
                    )}
                    {miembro.tareaActiva.minutos !== null && (
                      <p className="text-[11px] font-mono font-bold text-green-600 mt-1.5">
                        {Math.floor(miembro.tareaActiva.minutos / 60) > 0
                          ? `${Math.floor(miembro.tareaActiva.minutos / 60)}h ${miembro.tareaActiva.minutos % 60}m`
                          : `${miembro.tareaActiva.minutos}m`
                        }
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="bg-white rounded-lg p-2.5 border border-slate-100 text-center">
                    <p className="text-xs text-slate-400">
                      {miembro.jornada.estado === 'PAUSADA' ? '☕ En pausa' :
                       miembro.jornada.estado === 'FINALIZADA' ? '✅ Jornada finalizada' :
                       'Sin tarea activa'}
                    </p>
                  </div>
                )}

                <p className="text-[10px] text-slate-400 mt-2 text-right">
                  Desde {new Date(miembro.jornada.horaInicio).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal de Detalle */}
      {selectedDetail && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
            onClick={() => setSelectedDetail(null)}
          />
          <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                  selectedDetail.type === 'Tarea' ? 'bg-orange-50 text-orange-600 border-orange-100' : 'bg-blue-50 text-blue-600 border-blue-100'
                }`}>
                  {selectedDetail.type}
                </span>
              </div>
              <button
                onClick={() => setSelectedDetail(null)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4 leading-snug">{selectedDetail.title}</h2>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle2 className="text-slate-400 mt-0.5 flex-shrink-0" size={18} />
                  <p className="text-sm text-slate-600 leading-relaxed">{selectedDetail.info}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-2">
                  <div className="flex items-center text-sm text-slate-700">
                    <Briefcase size={16} className="mr-3 text-slate-400" />
                    <span className="font-medium">{selectedDetail.meta}</span>
                  </div>
                  {selectedDetail.subMeta && (
                    <div className="flex items-center text-sm text-slate-700">
                      <Flag size={16} className="mr-3 text-slate-400" />
                      <span>{selectedDetail.subMeta}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedDetail(null)}
                className="px-4 py-2 bg-slate-900 text-white text-sm font-bold rounded-lg hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/10"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Crear Evento Rápido */}
      {isQuickEventModalOpen && quickEventDate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md animate-in zoom-in-95">
            <div className="p-6 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg text-slate-800">Nuevo Evento</h3>
                <button onClick={() => setIsQuickEventModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={20} />
                </button>
              </div>
              <p className="text-sm text-slate-500 mt-1">
                {quickEventDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Título *</label>
                <input
                  type="text"
                  placeholder="Ej: Reunión con cliente"
                  value={quickEventForm.title}
                  onChange={(e) => setQuickEventForm({...quickEventForm, title: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-elio-yellow"
                  autoFocus
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tipo</label>
                  <select
                    value={quickEventForm.type}
                    onChange={(e) => setQuickEventForm({...quickEventForm, type: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none bg-white"
                  >
                    <option value="MEETING">Reunión</option>
                    <option value="DEADLINE">Deadline</option>
                    <option value="REMINDER">Recordatorio</option>
                    <option value="OTHER">Otro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Hora</label>
                  <input
                    type="time"
                    value={quickEventForm.startTime}
                    onChange={(e) => setQuickEventForm({...quickEventForm, startTime: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Descripción</label>
                <textarea
                  placeholder="Notas adicionales..."
                  value={quickEventForm.description}
                  onChange={(e) => setQuickEventForm({...quickEventForm, description: e.target.value})}
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none resize-none"
                />
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 flex gap-3">
              <button
                onClick={() => setIsQuickEventModalOpen(false)}
                className="flex-1 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateQuickEvent}
                disabled={!quickEventForm.title.trim()}
                className="flex-1 py-2 bg-elio-yellow text-white font-medium rounded-lg hover:bg-elio-yellow-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Crear Evento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
