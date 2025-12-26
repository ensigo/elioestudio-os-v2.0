import React, { useState, useMemo, useEffect } from 'react';
import { Modal } from '../../components/ui/Modal';
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
  Briefcase,
  Trash2,
  Edit3,
  AlertTriangle,
  Clock
} from 'lucide-react';

type EventType = 'MEETING' | 'DEADLINE' | 'VACATION' | 'REMINDER';

interface Evento {
  id: string;
  title: string;
  description: string | null;
  type: string;
  startDate: string;
  endDate: string | null;
  startTime: string | null;
  endTime: string | null;
  allDay: boolean;
  color: string | null;
}

export const CalendarPage = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedEvento, setSelectedEvento] = useState<Evento | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'MEETING',
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: '',
    allDay: false
  });

  // Drag state
  const [draggedEvento, setDraggedEvento] = useState<Evento | null>(null);

  const TODAY_ISO = new Date().toISOString().split('T')[0];

  // Cargar eventos
  useEffect(() => {
    const fetchEventos = async () => {
      try {
        const response = await fetch('/api/eventos');
        if (!response.ok) throw new Error('Error al cargar eventos');
        const data = await response.json();
        setEventos(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchEventos();
  }, []);

  // Grid Generation
  const gridDays = useMemo(() => generateCalendarGrid(currentDate), [currentDate]);

  // Visual Helpers
  const getEventStyle = (type: string) => {
    switch (type) {
      case 'MEETING': return 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200';
      case 'VACATION': return 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200';
      case 'DEADLINE': return 'bg-red-100 text-red-700 border-red-200 hover:bg-red-200';
      case 'REMINDER': return 'bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-200';
      default: return 'bg-gray-100 hover:bg-gray-200';
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'MEETING': return <Users size={12} />;
      case 'VACATION': return <Sun size={12} />;
      case 'DEADLINE': return <CheckCircle2 size={12} />;
      case 'REMINDER': return <Clock size={12} />;
      default: return <Briefcase size={12} />;
    }
  };

  // Abrir modal de crear
  const handleDayClick = (dateStr: string) => {
    setSelectedDate(dateStr);
    setFormData({
      title: '',
      description: '',
      type: 'MEETING',
      startDate: dateStr,
      endDate: '',
      startTime: '',
      endTime: '',
      allDay: false
    });
    setIsCreateModalOpen(true);
  };

  // Abrir modal de editar
  const handleEventClick = (evento: Evento, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedEvento(evento);
    setFormData({
      title: evento.title,
      description: evento.description || '',
      type: evento.type,
      startDate: evento.startDate.split('T')[0],
      endDate: evento.endDate ? evento.endDate.split('T')[0] : '',
      startTime: evento.startTime || '',
      endTime: evento.endTime || '',
      allDay: evento.allDay
    });
    setIsEditModalOpen(true);
  };

  // Crear evento
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.startDate) return;

    try {
      const response = await fetch('/api/eventos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description || null,
          type: formData.type,
          startDate: formData.startDate,
          endDate: formData.endDate || null,
          startTime: formData.startTime || null,
          endTime: formData.endTime || null,
          allDay: formData.allDay
        })
      });

      if (!response.ok) throw new Error('Error al crear evento');

      const nuevoEvento = await response.json();
      setEventos([...eventos, nuevoEvento]);
      setIsCreateModalOpen(false);
    } catch (err) {
      alert('Error al crear evento');
    }
  };

  // Actualizar evento
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvento || !formData.title) return;

    try {
      const response = await fetch('/api/eventos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedEvento.id,
          title: formData.title,
          description: formData.description || null,
          type: formData.type,
          startDate: formData.startDate,
          endDate: formData.endDate || null,
          startTime: formData.startTime || null,
          endTime: formData.endTime || null,
          allDay: formData.allDay
        })
      });

      if (!response.ok) throw new Error('Error al actualizar');

      const eventoActualizado = await response.json();
      setEventos(eventos.map(ev => ev.id === eventoActualizado.id ? eventoActualizado : ev));
      setIsEditModalOpen(false);
      setSelectedEvento(null);
    } catch (err) {
      alert('Error al actualizar evento');
    }
  };

  // Eliminar evento
  const handleDelete = async () => {
    if (!selectedEvento || !confirm('¿Eliminar este evento?')) return;

    try {
      const response = await fetch('/api/eventos', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedEvento.id })
      });

      if (!response.ok) throw new Error('Error al eliminar');

      setEventos(eventos.filter(ev => ev.id !== selectedEvento.id));
      setIsEditModalOpen(false);
      setSelectedEvento(null);
    } catch (err) {
      alert('Error al eliminar evento');
    }
  };

  // Drag & Drop handlers
  const handleDragStart = (evento: Evento, e: React.DragEvent) => {
    setDraggedEvento(evento);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (dateStr: string, e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedEvento) return;

    try {
      const response = await fetch('/api/eventos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: draggedEvento.id,
          startDate: dateStr
        })
      });

      if (!response.ok) throw new Error('Error al mover evento');

      const eventoActualizado = await response.json();
      setEventos(eventos.map(ev => ev.id === eventoActualizado.id ? eventoActualizado : ev));
    } catch (err) {
      alert('Error al mover evento');
    }

    setDraggedEvento(null);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <p className="text-xl text-elio-yellow animate-pulse">Cargando calendario...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-96 bg-red-50 p-6 rounded-lg border border-red-200">
        <AlertTriangle size={24} className="text-red-500 mr-3" />
        <p className="text-red-700 font-medium">Error: {error}</p>
      </div>
    );
  }

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
          onClick={() => handleDayClick(TODAY_ISO)}
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
            const dayEvents = eventos.filter(ev => {
              const evDate = ev.startDate.split('T')[0];
              if (ev.endDate) {
                return isDateInRange(cell.date, evDate, ev.endDate.split('T')[0]);
              }
              return evDate === dateStr;
            });

            return (
              <div 
                key={idx} 
                className={`relative bg-white p-2 min-h-[120px] hover:bg-blue-50 transition-colors cursor-pointer group flex flex-col gap-1 ${!cell.isCurrentMonth ? 'bg-gray-50/50' : ''} ${draggedEvento ? 'hover:bg-green-50' : ''}`}
                onClick={() => handleDayClick(dateStr)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(dateStr, e)}
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
                <div className="flex-1 flex flex-col gap-1 mt-1 overflow-hidden">
                  {dayEvents.slice(0, 3).map(evt => (
                    <div 
                      key={evt.id} 
                      draggable
                      onDragStart={(e) => handleDragStart(evt, e)}
                      className={`px-2 py-1 rounded text-[10px] font-bold border truncate flex items-center gap-1 cursor-grab active:cursor-grabbing transition-all ${getEventStyle(evt.type)}`}
                      title={evt.title}
                      onClick={(e) => handleEventClick(evt, e)}
                    >
                      {getEventIcon(evt.type)}
                      <span className="truncate">{evt.title}</span>
                      {evt.startTime && <span className="ml-auto opacity-70">{evt.startTime}</span>}
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <span className="text-[10px] text-gray-500 font-medium">+{dayEvents.length - 3} más</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CREATE MODAL */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Nuevo Evento">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Título *</label>
            <input 
              autoFocus
              type="text" 
              className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-elio-yellow/50"
              placeholder="Ej: Reunión con Cliente..."
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Descripción</label>
            <textarea 
              className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-elio-yellow/50"
              placeholder="Detalles del evento..."
              rows={2}
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tipo</label>
              <select 
                className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none"
                value={formData.type}
                onChange={e => setFormData({...formData, type: e.target.value})}
              >
                <option value="MEETING">Reunión</option>
                <option value="DEADLINE">Entrega / Hito</option>
                <option value="VACATION">Vacaciones</option>
                <option value="REMINDER">Recordatorio</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Fecha *</label>
              <input 
                type="date" 
                className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none"
                value={formData.startDate}
                onChange={e => setFormData({...formData, startDate: e.target.value})}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Hora inicio</label>
              <input 
                type="time" 
                className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none"
                value={formData.startTime}
                onChange={e => setFormData({...formData, startTime: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Hora fin</label>
              <input 
                type="time" 
                className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none"
                value={formData.endTime}
                onChange={e => setFormData({...formData, endTime: e.target.value})}
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end space-x-2">
            <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-lg">Cancelar</button>
            <button type="submit" className="px-4 py-2 text-sm bg-elio-yellow text-white font-bold rounded-lg hover:bg-elio-yellow-hover">Crear Evento</button>
          </div>
        </form>
      </Modal>

      {/* EDIT MODAL */}
      <Modal isOpen={isEditModalOpen} onClose={() => { setIsEditModalOpen(false); setSelectedEvento(null); }} title="Editar Evento">
        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Título *</label>
            <input 
              type="text" 
              className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-elio-yellow/50"
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Descripción</label>
            <textarea 
              className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-elio-yellow/50"
              rows={2}
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tipo</label>
              <select 
                className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none"
                value={formData.type}
                onChange={e => setFormData({...formData, type: e.target.value})}
              >
                <option value="MEETING">Reunión</option>
                <option value="DEADLINE">Entrega / Hito</option>
                <option value="VACATION">Vacaciones</option>
                <option value="REMINDER">Recordatorio</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Fecha *</label>
              <input 
                type="date" 
                className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none"
                value={formData.startDate}
                onChange={e => setFormData({...formData, startDate: e.target.value})}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Hora inicio</label>
              <input 
                type="time" 
                className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none"
                value={formData.startTime}
                onChange={e => setFormData({...formData, startTime: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Hora fin</label>
              <input 
                type="time" 
                className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none"
                value={formData.endTime}
                onChange={e => setFormData({...formData, endTime: e.target.value})}
              />
            </div>
          </div>

          <div className="pt-4 flex justify-between">
            <button 
              type="button" 
              onClick={handleDelete}
              className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg flex items-center"
            >
              <Trash2 size={16} className="mr-1" /> Eliminar
            </button>
            <div className="flex space-x-2">
              <button type="button" onClick={() => { setIsEditModalOpen(false); setSelectedEvento(null); }} className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-lg">Cancelar</button>
              <button type="submit" className="px-4 py-2 text-sm bg-elio-yellow text-white font-bold rounded-lg hover:bg-elio-yellow-hover">Guardar</button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};