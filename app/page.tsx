import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { CURRENT_USER_ROLE } from '../constants';
import { 
  Play, Calendar, CheckSquare, Square, ChevronLeft, ChevronRight, 
  Clock, User, Briefcase, MapPin, X, AlertCircle, CheckCircle2, Flag
} from 'lucide-react';
import { useTimeTracking } from '../context/TimeTrackingContext';

// --- UTILS & HELPERS ---
const getToday = () => new Date();
const addDays = (d: Date, days: number) => {
  const newDate = new Date(d);
  newDate.setDate(d.getDate() + days);
  return newDate;
};

// --- MOCK DATA DINÁMICA ---
// Generamos datos relativos a la fecha actual para que siempre se vea "vivo"
const TODAY = getToday();

// Encontrar el Domingo de esta semana para cumplir con el requisito de datos
const getSundayOfCurrentWeek = () => {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + 7; // Próximo domingo (o hoy si es domingo)
  return new Date(d.setDate(diff));
};

const SUNDAY_EVENT_DATE = getSundayOfCurrentWeek();

const MOCK_EVENTS = [
  { 
    id: 1, 
    title: 'Daily Standup', 
    type: 'Reunión', 
    category: 'MEETING',
    date: TODAY, 
    time: '09:30', 
    desc: 'Sincronización diaria con el equipo de desarrollo y diseño.',
    location: 'Sala de Juntas Virtual'
  },
  { 
    id: 2, 
    title: 'Revisión Cliente Q3', 
    type: 'Reunión', 
    category: 'MEETING',
    date: addDays(TODAY, 1), 
    time: '16:00',
    desc: 'Presentación de resultados trimestrales y propuesta de renovación.',
    location: 'Oficinas del Cliente (Madrid)'
  },
  { 
    id: 3, 
    title: 'Entrega Fase 1', 
    type: 'Deadline', 
    category: 'DEADLINE',
    date: addDays(TODAY, 2), 
    time: '12:00',
    desc: 'Entrega de wireframes y prototipo funcional.',
    location: 'Asana / Figma'
  },
  { 
    id: 99, 
    title: 'Mantenimiento Servidores', 
    type: 'Soporte', 
    category: 'TECH',
    date: SUNDAY_EVENT_DATE, // Domingo
    time: '02:00 AM',
    desc: 'Ventana de mantenimiento programada. Posible downtime de 15 mins.',
    location: 'AWS Console'
  }
];

const MOCK_TASKS = [
  { 
    id: 't1', 
    title: 'Entrega final wireframes', 
    project: 'Rebranding La Abuela', 
    due: 'Ayer', 
    priority: 'URGENT',
    desc: 'Finalizar vistas mobile y desktop. Exportar assets.'
  },
  { 
    id: 't2', 
    title: 'Revisión Analytics', 
    project: 'Mantenimiento Web', 
    due: 'Hoy', 
    priority: 'HIGH',
    desc: 'Generar reporte mensual de tráfico y conversiones.'
  },
  { 
    id: 't3', 
    title: 'Integración Stripe', 
    project: 'E-commerce Nike', 
    due: 'Mañana', 
    priority: 'MEDIUM',
    desc: 'Configurar webhooks para pagos recurrentes.'
  },
];

// --- TYPES ---
interface DetailItem {
  title: string;
  type: string; // "Tarea", "Evento", etc.
  category?: string; // Para colores
  info: string;
  meta: string; // Hora, Proyecto, etc.
  subMeta?: string; // Ubicación, estado, etc.
}

export const DashboardPage = () => {
  const { isClockedIn, toggleClockIn, clockInTime, formatTime, elapsedSeconds, activeTask } = useTimeTracking();
  
  // --- STATE ---
  const [selectedDetail, setSelectedDetail] = useState<DetailItem | null>(null);
  
  // Calendario State
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Lunes
    return new Date(d.setDate(diff));
  });

  // --- LOGIC ---
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
    return MOCK_EVENTS.filter(e => 
      e.date.getDate() === date.getDate() && 
      e.date.getMonth() === date.getMonth() &&
      e.date.getFullYear() === date.getFullYear()
    );
  };

  // --- HANDLERS ---
  const openTaskDetail = (task: typeof MOCK_TASKS[0]) => {
    setSelectedDetail({
      title: task.title,
      type: 'Tarea',
      category: task.priority,
      info: task.desc,
      meta: `Proyecto: ${task.project}`,
      subMeta: `Vencimiento: ${task.due}`
    });
  };

  const openEventDetail = (evt: typeof MOCK_EVENTS[0]) => {
    setSelectedDetail({
      title: evt.title,
      type: evt.type,
      category: evt.category,
      info: evt.desc,
      meta: `Hora: ${evt.time}`,
      subMeta: evt.location
    });
  };

  const formatDateTitle = (date: Date) => {
    return new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }).format(date);
  };

  // --- RENDER HELPERS ---
  const getEventColor = (category: string) => {
    switch(category) {
      case 'MEETING': return 'bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100';
      case 'DEADLINE': return 'bg-red-50 text-red-700 border-red-100 hover:bg-red-100';
      case 'TECH': return 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200';
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

  return (
    <div className="space-y-6 relative">
      
      {/* 1. HEADER & FECHA */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Panel de Control</h1>
          <p className="text-slate-500 text-sm mt-1">
            Resumen operativo del día para <span className="font-semibold">{CURRENT_USER_ROLE.name}</span>.
          </p>
        </div>
        
        <div className="flex items-center space-x-3 bg-white px-5 py-3 rounded-xl shadow-sm border border-slate-200">
           <Calendar className="text-elio-yellow" size={24} />
           <span className="text-2xl font-bold text-slate-700 capitalize">
            {formatDateTitle(new Date())}
           </span>
        </div>
      </div>

      {/* GRID PRINCIPAL */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* WIDGET 1: Control Horario */}
        <div className="col-span-1 md:col-span-12">
          <Card title="Control Horario" className="h-full border-l-4 border-l-elio-yellow">
             <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="text-center sm:text-left">
                <div className="text-sm text-gray-500 font-medium mb-1">
                   {isClockedIn ? 'Sesión activa desde:' : 'Jornada pausada'}
                </div>
                <div className="text-4xl font-mono font-bold text-slate-900 tracking-tight">
                  {isClockedIn && clockInTime 
                    ? clockInTime.toLocaleTimeString('es-ES', {hour: '2-digit', minute:'2-digit'}) 
                    : '--:--'}
                </div>
                {activeTask ? (
                  <div className="text-xs text-green-600 mt-2 flex items-center justify-center sm:justify-start font-medium">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                    {activeTask.title} ({formatTime(elapsedSeconds)})
                  </div>
                ) : (
                  <div className="text-xs text-gray-400 mt-2 flex items-center justify-center sm:justify-start">
                    <span className="w-2 h-2 bg-gray-300 rounded-full mr-2"></span>
                    Sin tarea cronometrada
                  </div>
                )}
              </div>
              <div className="flex space-x-3 w-full sm:w-auto">
                <button 
                  onClick={toggleClockIn}
                  className={`flex-1 sm:flex-none flex items-center justify-center px-8 py-3 rounded-xl font-bold transition-all transform active:scale-95 shadow-md ${
                    isClockedIn 
                      ? 'bg-white border-2 border-gray-200 text-gray-700 hover:bg-gray-50' 
                      : 'bg-slate-900 hover:bg-slate-800 text-white shadow-slate-900/20'
                  }`}
                >
                  {isClockedIn ? (
                    <>
                      <Square size={18} className="mr-2 fill-current" /> Pausar
                    </>
                  ) : (
                    <>
                      <Play size={18} className="mr-2 fill-current" /> Fichar Entrada
                    </>
                  )}
                </button>
              </div>
            </div>
          </Card>
        </div>

        {/* WIDGET 2: Calendario Semanal Interactivo */}
        <div className="col-span-1 md:col-span-12">
           <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
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
                            {dayEvents.length > 0 ? dayEvents.map(evt => (
                               <div 
                                 key={evt.id} 
                                 className={`text-[10px] px-2 py-1.5 rounded-lg border cursor-pointer transition-all active:scale-95 ${getEventColor(evt.category)}`}
                                 onClick={() => openEventDetail(evt)}
                               >
                                  <span className="font-bold block opacity-80 mb-0.5">{evt.time}</span>
                                  <span className="font-semibold leading-tight line-clamp-2">{evt.title}</span>
                               </div>
                            )) : (
                                <div className="h-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                    <span className="text-xs text-slate-300 select-none">+</span>
                                </div>
                            )}
                         </div>
                      </div>
                    );
                 })}
              </div>
           </div>
        </div>

        {/* WIDGET 3: Tareas Prioritarias */}
        <div className="col-span-1 md:col-span-8">
          <Card 
            title="Tareas Prioritarias" 
            action={<span className="text-xs font-bold text-elio-yellow hover:underline cursor-pointer">Ver tablero completo</span>}
            className="h-full"
          >
             <div className="space-y-3">
                {MOCK_TASKS.map(task => (
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
                            <p className="text-xs text-slate-500 font-medium">{task.project}</p>
                         </div>
                      </div>
                      <span className={`text-[10px] font-bold px-3 py-1 rounded-full border ${getPriorityColor(task.priority)}`}>
                        {task.due.toUpperCase()}
                      </span>
                   </div>
                ))}
             </div>
          </Card>
        </div>

        {/* WIDGET 4: Agenda Rápida */}
        <div className="col-span-1 md:col-span-4">
          <Card title="Agenda Rápida" className="h-full">
            <div className="space-y-2">
              {MOCK_EVENTS.slice(0, 3).map(evt => (
                <div 
                  key={evt.id} 
                  className="flex items-start p-3 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors group border border-transparent hover:border-slate-100"
                  onClick={() => openEventDetail(evt)}
                >
                  <div className="min-w-[50px] text-center border-r border-slate-100 pr-3 mr-3">
                    <span className="block text-lg font-bold text-slate-900 leading-none">{evt.date.getDate()}</span>
                    <span className="block text-[10px] uppercase font-bold text-slate-400">{new Intl.DateTimeFormat('es-ES', { month: 'short' }).format(evt.date)}</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-1">{evt.title}</h4>
                    <div className="flex items-center mt-1 text-xs text-slate-500">
                       <Clock size={12} className="mr-1" /> {evt.time}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* --- MODAL DE DETALLE LOCAL (SIN ALERTS) --- */}
      {selectedDetail && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
           {/* Backdrop con blur */}
           <div 
             className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" 
             onClick={() => setSelectedDetail(null)}
           />
           
           {/* Modal Card */}
           <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              
              {/* Header Visual */}
              <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex justify-between items-center">
                 <div className="flex items-center space-x-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                       selectedDetail.type === 'Tarea' ? 'bg-orange-50 text-orange-600 border-orange-100' : 'bg-blue-50 text-blue-600 border-blue-100'
                    }`}>
                      {selectedDetail.type}
                    </span>
                    {selectedDetail.category && (
                       <span className="text-[10px] font-mono text-slate-400">
                         {selectedDetail.category}
                       </span>
                    )}
                 </div>
                 <button 
                   onClick={() => setSelectedDetail(null)}
                   className="p-1 rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors"
                 >
                   <X size={20} />
                 </button>
              </div>

              {/* Contenido */}
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
                            {selectedDetail.type === 'Tarea' ? <Flag size={16} className="mr-3 text-slate-400" /> : <MapPin size={16} className="mr-3 text-slate-400" />}
                            <span>{selectedDetail.subMeta}</span>
                         </div>
                       )}
                    </div>
                 </div>
              </div>

              {/* Footer Actions */}
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