import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { 
  Play, Calendar, CheckSquare, ChevronLeft, ChevronRight, 
  Clock, Briefcase, MapPin, X, CheckCircle2, Flag, Users, 
  FolderOpen, Ticket, AlertTriangle, TrendingUp, Coffee, Square
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
  assignee?: { name: string };
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
    cargarJornadaHoy
  } = useTimeTracking();
  
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDetail, setSelectedDetail] = useState<DetailItem | null>(null);
  
  // Calendario State
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  });

  // Cargar datos del dashboard
  useEffect(() => {
    const fetchDashboard = async () => {
      if (!usuario?.id) return;
      
      // Cargar jornada de hoy
      cargarJornadaHoy(usuario.id);
      
      try {
        const [dashRes, eventosRes] = await Promise.all([
          fetch(`/api/dashboard?userId=${usuario.id}&userRole=${usuario.role}`),
          fetch('/api/eventos')
        ]);

        if (dashRes.ok) {
          const dashData = await dashRes.json();
          setStats(dashData.stats);
          setTareas(dashData.tareasRecientes || []);
        }

        if (eventosRes.ok) {
          const eventosData = await eventosRes.json();
          setEventos(eventosData);
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <p className="text-xl text-elio-yellow animate-pulse">Cargando dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* FILA 1: Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div 
          className="cursor-pointer hover:scale-105 transition-transform"
          onClick={() => onNavigate?.('clientes')}
        >
          <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-blue-600 uppercase">Clientes</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.clientes.activos || 0}</p>
                <p className="text-xs text-gray-500">de {stats?.clientes.total || 0} totales</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <Users size={24} className="text-blue-600" />
              </div>
            </div>
          </Card>
        </div>

        <div 
          className="cursor-pointer hover:scale-105 transition-transform"
          onClick={() => onNavigate?.('proyectos')}
        >
          <Card className="bg-gradient-to-br from-green-50 to-white border-green-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-green-600 uppercase">Proyectos</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.proyectos.activos || 0}</p>
                <p className="text-xs text-gray-500">activos</p>
              </div>
              <div className="p-3 bg-green-100 rounded-xl">
                <FolderOpen size={24} className="text-green-600" />
              </div>
            </div>
          </Card>
        </div>

        <div 
          className="cursor-pointer hover:scale-105 transition-transform"
          onClick={() => onNavigate?.('tareas')}
        >
          <Card className="bg-gradient-to-br from-orange-50 to-white border-orange-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-orange-600 uppercase">Tareas</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.tareas.pendientes || 0}</p>
                <p className="text-xs text-gray-500">{stats?.tareas.urgentes || 0} urgentes</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-xl">
                <CheckSquare size={24} className="text-orange-600" />
              </div>
            </div>
          </Card>
        </div>

        <div 
          className="cursor-pointer hover:scale-105 transition-transform"
          onClick={() => onNavigate?.('tickets')}
        >
          <Card className="bg-gradient-to-br from-purple-50 to-white border-purple-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-purple-600 uppercase">Tickets</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.tickets.abiertos || 0}</p>
                <p className="text-xs text-gray-500">abiertos</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-xl">
                <Ticket size={24} className="text-purple-600" />
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* FILA 2: Timer + Semana */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Timer Widget */}
        <div className="col-span-1 md:col-span-4">
          <Card className="h-full">
            <div className="text-center py-4">
              <p className="text-xs font-bold text-gray-500 uppercase mb-2">Control de Jornada</p>
              <div className={`text-5xl font-mono font-bold mb-4 ${
                isClockedIn 
                  ? isPaused 
                    ? 'text-orange-500' 
                    : 'text-green-600' 
                  : jornadaActual?.estado === 'FINALIZADA'
                    ? 'text-blue-600'
                    : 'text-gray-400'
              }`}>
                {formatTime(elapsedSeconds)}
              </div>
              
              {/* Estado actual */}
              {jornadaActual && (
                <p className="text-xs text-gray-500 mb-3">
                  {jornadaActual.estado === 'EN_CURSO' && '🟢 Jornada en curso'}
                  {jornadaActual.estado === 'PAUSADA' && '🟠 En pausa (almuerzo)'}
                  {jornadaActual.estado === 'FINALIZADA' && '✅ Jornada finalizada'}
                </p>
              )}
              
              {/* Botones según estado */}
              <div className="flex flex-col gap-2">
                {!jornadaActual || jornadaActual.estado === 'FINALIZADA' ? (
                  <button
                    onClick={() => usuario?.id && iniciarJornada(usuario.id)}
                    disabled={jornadaActual?.estado === 'FINALIZADA'}
                    className={`px-6 py-3 rounded-xl font-bold text-white transition-all shadow-lg ${
                      jornadaActual?.estado === 'FINALIZADA'
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-green-500 hover:bg-green-600 shadow-green-200'
                    }`}
                  >
                    <Play size={18} className="inline mr-2" />
                    {jornadaActual?.estado === 'FINALIZADA' ? 'Jornada completada' : 'Iniciar Jornada'}
                  </button>
                ) : jornadaActual.estado === 'EN_CURSO' ? (
                  <div className="flex gap-2 justify-center">
                    {!jornadaActual.horaPausaAlmuerzo && (
                      <button
                        onClick={() => usuario?.id && pausarJornada(usuario.id)}
                        className="px-4 py-3 rounded-xl font-bold text-white bg-orange-500 hover:bg-orange-600 transition-all shadow-lg shadow-orange-200"
                      >
                        <Coffee size={18} className="inline mr-2" />
                        Pausa
                      </button>
                    )}
                    <button
                      onClick={() => usuario?.id && finalizarJornada(usuario.id)}
                      className="px-4 py-3 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 transition-all shadow-lg shadow-red-200"
                    >
                      <Square size={18} className="inline mr-2" />
                      Finalizar
                    </button>
                  </div>
                ) : jornadaActual.estado === 'PAUSADA' ? (
                  <button
                    onClick={() => usuario?.id && reanudarJornada(usuario.id)}
                    className="px-6 py-3 rounded-xl font-bold text-white bg-green-500 hover:bg-green-600 transition-all shadow-lg shadow-green-200"
                  >
                    <Play size={18} className="inline mr-2" />
                    Reanudar Jornada
                  </button>
                ) : null}
              </div>
            </div>
          </Card>
        </div>

        {/* Semana Widget */}
        <div className="col-span-1 md:col-span-8">
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm h-full">
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
                        <div className="h-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                          <span className="text-xs text-slate-300 select-none">+</span>
                        </div>
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
        </div>
      </div>

      {/* FILA 3: Tareas + Agenda */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Tareas Prioritarias */}
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
                      <div className={`p-2 rounded-full bg-white border border-slate-200 text-slate-400 group-hover:text-elio-yellow group-hover:border-elio-yellow transition-colors`}>
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

        {/* Agenda Rápida */}
        <div className="col-span-1 md:col-span-4">
          <Card title="Próximos Eventos" className="h-full">
            {eventos.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar size={32} className="mx-auto mb-2 opacity-30" />
                <p>No hay eventos próximos</p>
              </div>
            ) : (
              <div className="space-y-2">
                {eventos.slice(0, 4).map(evt => (
                  <div 
                    key={evt.id} 
                    className="flex items-start p-3 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors group border border-transparent hover:border-slate-100"
                    onClick={() => openEventDetail(evt)}
                  >
                    <div className="min-w-[50px] text-center border-r border-slate-100 pr-3 mr-3">
                      <span className="block text-lg font-bold text-slate-900 leading-none">{new Date(evt.startDate).getDate()}</span>
                      <span className="block text-[10px] uppercase font-bold text-slate-400">{new Intl.DateTimeFormat('es-ES', { month: 'short' }).format(new Date(evt.startDate))}</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-1">{evt.title}</h4>
                      <div className="flex items-center mt-1 text-xs text-slate-500">
                        <Clock size={12} className="mr-1" /> {evt.startTime || 'Todo el día'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

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
              <h2 className="text-xl font-bold text-slate-900 mb-4 leading-snug">
                {selectedDetail.title}
              </h2>

              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle2 className="text-slate-400 mt-0.5 flex-shrink-0" size={18} />
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {selectedDetail.info}
                  </p>
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

    </div>
  );
};