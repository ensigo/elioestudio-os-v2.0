import React, { useState } from 'react';
import { MOCK_PROJECTS, MOCK_USERS } from '../lib/mock-data';
import { TaskType, TaskPriority } from '../types';
import { Calendar, Clock, Briefcase, RefreshCw } from 'lucide-react';

interface TaskCreationModalProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

export const TaskCreationModal: React.FC<TaskCreationModalProps> = ({ onSubmit, onCancel }) => {
  // Local state for form fields
  const [isRecurring, setIsRecurring] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    projectId: '',
    type: 'OPERATIONAL' as TaskType,
    priority: 'MEDIUM' as TaskPriority,
    assigneeId: '',
    estimatedHours: '',
    dueDate: '',
    // Recurrence specific
    recurrenceFrequency: 'MONTHLY',
    leadTime: 7
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) newErrors.title = "El título es obligatorio.";
    if (!formData.projectId) newErrors.projectId = "Proyecto requerido.";
    if (!formData.assigneeId) newErrors.assigneeId = "Asigna un responsable.";
    if (!formData.dueDate) newErrors.dueDate = "Fecha límite requerida.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit({ ...formData, isRecurring });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      
      {/* 1. Context */}
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
             <span className="flex items-center"><Briefcase size={12} className="mr-1"/> Proyecto <span className="text-red-500 ml-1">*</span></span>
          </label>
          <select
            value={formData.projectId}
            onChange={(e) => setFormData({...formData, projectId: e.target.value})}
            className={`w-full px-3 py-2 border rounded-lg bg-gray-50 focus:bg-white transition-all outline-none ${errors.projectId ? 'border-red-300' : 'border-gray-200'}`}
          >
            <option value="">Selecciona proyecto...</option>
            {MOCK_PROJECTS.filter(p => !p.isArchived).map(p => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </select>
          {errors.projectId && <p className="text-xs text-red-500 mt-1">{errors.projectId}</p>}
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tarea <span className="text-red-500">*</span></label>
          <input
            type="text"
            placeholder="Título descriptivo..."
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            className={`w-full px-3 py-2 border rounded-lg outline-none ${errors.title ? 'border-red-300' : 'border-gray-200 focus:border-elio-yellow'}`}
          />
          {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
        </div>
      </div>

      <div className="h-px bg-gray-100 my-4"></div>

      {/* 2. RECURRENCE TOGGLE SECTION */}
      <div className={`p-4 rounded-xl border transition-all duration-300 ${isRecurring ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-gray-200'}`}>
        <div className="flex items-center justify-between">
           <div className="flex items-center space-x-2">
             <RefreshCw size={18} className={isRecurring ? 'text-elio-yellow' : 'text-gray-400'} />
             <div>
               <span className={`text-sm font-bold ${isRecurring ? 'text-gray-900' : 'text-gray-600'}`}>¿Es una tarea recurrente?</span>
               <p className="text-[10px] text-gray-500">Automatiza la creación periódica.</p>
             </div>
           </div>
           
           {/* Custom CSS Toggle Switch */}
           <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-elio-yellow"></div>
           </label>
        </div>
        
        {/* Conditional Fields */}
        {isRecurring && (
          <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-yellow-200/50 animate-in fade-in slide-in-from-top-1">
             <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Frecuencia</label>
                <select 
                  className="w-full px-3 py-2 border border-yellow-200 rounded-lg outline-none bg-white"
                  value={formData.recurrenceFrequency}
                  onChange={(e) => setFormData({...formData, recurrenceFrequency: e.target.value})}
                >
                  <option value="WEEKLY">Semanal (Cada lunes)</option>
                  <option value="MONTHLY">Mensual (Día 1)</option>
                  <option value="QUARTERLY">Trimestral</option>
                </select>
             </div>
             <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Crear con Antelación</label>
                <div className="relative">
                  <input 
                    type="number"
                    className="w-full px-3 py-2 border border-yellow-200 rounded-lg outline-none bg-white pr-10"
                    value={formData.leadTime}
                    onChange={(e) => setFormData({...formData, leadTime: Number(e.target.value)})}
                  />
                  <span className="absolute right-3 top-2 text-xs text-gray-400">días</span>
                </div>
             </div>
          </div>
        )}
      </div>

      {/* 3. Standard Fields */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Prioridad</label>
          <select
            value={formData.priority}
            onChange={(e) => setFormData({...formData, priority: e.target.value as TaskPriority})}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none"
          >
            <option value="LOW">Baja</option>
            <option value="MEDIUM">Media</option>
            <option value="HIGH">Alta</option>
            <option value="URGENT">¡Crítica!</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
             <span className="flex items-center"><Clock size={12} className="mr-1"/> Estimación (h)</span>
          </label>
          <input
            type="number"
            step="0.5"
            placeholder="Ej: 2.5"
            value={formData.estimatedHours}
            onChange={(e) => setFormData({...formData, estimatedHours: e.target.value})}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none"
          />
        </div>

        <div className="col-span-2">
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Asignado a <span className="text-red-500">*</span></label>
          <select
            value={formData.assigneeId}
            onChange={(e) => setFormData({...formData, assigneeId: e.target.value})}
            className={`w-full px-3 py-2 border rounded-lg outline-none ${errors.assigneeId ? 'border-red-300' : 'border-gray-200'}`}
          >
            <option value="">Selecciona responsable...</option>
            {MOCK_USERS.map(u => (
              <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
            ))}
          </select>
          {errors.assigneeId && <p className="text-xs text-red-500 mt-1">{errors.assigneeId}</p>}
        </div>

        <div className="col-span-2">
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
            <span className="flex items-center"><Calendar size={12} className="mr-1"/> Deadline</span>
          </label>
          <input
            type="date"
            value={formData.dueDate}
            onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
            className={`w-full px-3 py-2 border rounded-lg outline-none ${errors.dueDate ? 'border-red-300' : 'border-gray-200'}`}
          />
          {errors.dueDate && <p className="text-xs text-red-500 mt-1">{errors.dueDate}</p>}
        </div>
      </div>

      <div className="pt-4 flex justify-end space-x-3 border-t border-gray-100 mt-6">
        <button 
          type="button" 
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
        >
          Cancelar
        </button>
        <button 
          type="submit"
          className="px-6 py-2 text-sm font-medium text-white bg-elio-yellow hover:bg-elio-yellow-hover rounded-lg transition-colors shadow-sm"
        >
          Crear Tarea
        </button>
      </div>

    </form>
  );
};