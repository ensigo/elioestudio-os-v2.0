import React, { useState, useMemo } from 'react';
import { Card } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { MOCK_USERS } from '../../lib/mock-data';
import { 
  addMonths, 
  formatDateISO, 
  generateCalendarGrid, 
  getMonthName, 
  isSameDay, 
  daysOfWeek,
  isDateInRange
} from '../../lib/date-utils';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus,
  Users,
  CheckCircle2,
  Sun,
  Clock,
  Briefcase
} from 'lucide-react';

// --- LOCAL TYPES & MOCK ---
type EventType = 'MEETING' | 'DEADLINE' | 'VACATION';

interface LocalEvent {
  id: string;
  title: string;
  type: EventType;
  date: string; // YYYY-MM-DD
  endDate?: string; // For ranges
}

// Injected Mock Data to ensure visibility
const TODAY_ISO = new Date().toISOString().split('T')[0];
const TOMORROW_ISO = new Date(Date.now() + 86400000).toISOString().split('T')[0];
const NEXT_WEEK_ISO = new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0];

const INITIAL_EVENTS: LocalEvent[] = [
  { id: '1', title: 'Entrega Web E-commerce', type: 'DEADLINE', date: NEXT_WEEK_ISO },
  { id: '2', title: 'Daily Team Meeting', type: 'MEETING', date: TODAY_ISO },
  { id: '3', title: 'Ana Tomía - Vacaciones', type: 'VACATION', date: TODAY_ISO, endDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0] },
  { id: '4', title: 'Revisión Cliente Q3', type: 'MEETING', date: TOMORROW_ISO }
];

export const CalendarPage = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<LocalEvent[]>(INITIAL_EVENTS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newEvent, setNewEvent] = useState<Partial<LocalEvent>>({ type: 'MEETING', date: TODAY_ISO });

  // Grid Generation
  const gridDays = useMemo(() => generateCalendarGrid(currentDate), [currentDate]);

  // Visual Helpers
  const getEventStyle = (type: EventType) => {
    switch (type) {
      case 'MEETING': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'VACATION': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'DEADLINE': return 'bg-white text-gray-600 border-gray-200 shadow-sm';
      default: return 'bg-gray-100';
    }
  };

  const getEventIcon = (type: EventType) => {
    switch (type) {
      case 'MEETING': return <Users size={12} />;
      case 'VACATION': return <Sun size={12} />;
      case 'DEADLINE': return <CheckCircle2 size={12} />;
      default: return <Briefcase size={12} />;
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.title) return;
    
    setEvents([...events, {
      id: `new-${Date.now()}`,
      title: newEvent.title,
      type: newEvent.type as EventType,
      date: newEvent.date || TODAY_ISO
    }]);
    setIsModalOpen(false);
    setNewEvent({ type: 'MEETING', date: TODAY_ISO, title: '' });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] space-y-4">
      {/* HEADER */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center space-x-4">
           <div className="flex bg-gray-100 p-1 rounded-lg">
             <button onClick={() => setCurrentDate(addMonths(currentDate, -1))} className="p-1 hover:bg-white rounded shadow-sm transition-all"><ChevronLeft size={20} /></button>
             <button onClick={() => setCurrentDate(new Date())} className="px-3 text-sm font-bold text-gray-600">Hoy</button>
             <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="p-1 hover:bg-white rounded shadow-sm transition-all"><ChevronRight size={20} /></button>
           </div>
           <h2 className="text-2xl font-bold text-gray-800 capitalize">
             {getMonthName(currentDate)} <span className="text-gray-400">{currentDate.getFullYear()}</span>
           </h2>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-elio-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors flex items-center shadow-lg shadow-gray-200"
        >
          <Plus size={16} className="mr-2" /> Nuevo Evento
        </button>
      </div>

      {/* CALENDAR GRID */}
      <div className="flex-1 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm flex flex-col">
        {/* Weekday Headers */}
        <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
          {daysOfWeek.map(day => (
            <div key={day} className="py-3 text-center text-xs font-bold text-gray-400 uppercase tracking-widest">
              {day}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 flex-1 auto-rows-fr bg-gray-200 gap-px border-b border-gray-200">
          {gridDays.map((cell, idx) => {
            const dateStr = formatDateISO(cell.date);
            const isToday = isSameDay(cell.date, new Date());
            
            // Filter events for this day
            const dayEvents = events.filter(e => {
               if (e.type === 'VACATION' && e.endDate) {
                 return isDateInRange(cell.date, e.date, e.endDate);
               }
               return e.date === dateStr;
            });

            return (
              <div 
                key={idx} 
                className={`relative bg-white p-2 min-h-[120px] hover:bg-gray-50 transition-colors cursor-pointer group flex flex-col gap-1 ${!cell.isCurrentMonth ? 'bg-gray-50/50' : ''}`}
                onClick={() => {
                  setNewEvent({ ...newEvent, date: dateStr });
                  setIsModalOpen(true);
                }}
              >
                {/* Day Number */}
                <div className="flex justify-between items-start">
                   {isToday && <span className="text-[10px] font-bold text-red-500 uppercase">Hoy</span>}
                   <span className={`ml-auto w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium ${
                     isToday ? 'bg-elio-black text-white' : 
                     cell.isCurrentMonth ? 'text-gray-700 group-hover:bg-gray-200' : 'text-gray-300'
                   }`}>
                     {cell.date.getDate()}
                   </span>
                </div>

                {/* Events Container */}
                <div className="flex-1 flex flex-col gap-1 mt-1">
                  {dayEvents.map(evt => (
                    <div 
                      key={evt.id} 
                      className={`px-2 py-1.5 rounded text-[10px] font-bold border truncate flex items-center gap-2 ${getEventStyle(evt.type)}`}
                      title={evt.title}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {getEventIcon(evt.type)}
                      <span className="truncate">{evt.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CREATE MODAL */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Crear Evento en Calendario">
         <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Título del Evento</label>
              <input 
                autoFocus
                type="text" 
                className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-elio-yellow/50"
                placeholder="Ej: Reunión con Cliente..."
                value={newEvent.title || ''}
                onChange={e => setNewEvent({...newEvent, title: e.target.value})}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tipo</label>
                  <select 
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none"
                    value={newEvent.type}
                    onChange={e => setNewEvent({...newEvent, type: e.target.value as EventType})}
                  >
                    <option value="MEETING">Reunión</option>
                    <option value="DEADLINE">Entrega / Hito</option>
                    <option value="VACATION">Vacaciones</option>
                  </select>
               </div>
               <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Fecha</label>
                  <input 
                    type="date" 
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none"
                    value={newEvent.date}
                    onChange={e => setNewEvent({...newEvent, date: e.target.value})}
                  />
               </div>
            </div>

            <div className="pt-4 flex justify-end space-x-2">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-lg">Cancelar</button>
              <button type="submit" className="px-4 py-2 text-sm bg-elio-yellow text-white font-bold rounded-lg hover:bg-elio-yellow-hover">Guardar</button>
            </div>
         </form>
      </Modal>
    </div>
  );
};