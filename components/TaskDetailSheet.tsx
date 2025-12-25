import React, { useState } from 'react';
import { Sheet } from './ui/Sheet';
import { Badge } from './ui/Badge';
import { Clock, Calendar, Play, Trash2, Edit3, Save, X } from 'lucide-react';

interface Proyecto {
  id: string;
  title: string;
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

interface TaskDetailSheetProps {
  task: Tarea | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedTask: Tarea) => void;
  onDelete: (taskId: string) => void;
  proyectos: Proyecto[];
  usuarios: Usuario[];
}

export const TaskDetailSheet: React.FC<TaskDetailSheetProps> = ({ 
  task, 
  isOpen, 
  onClose, 
  onUpdate, 
  onDelete,
  proyectos,
  usuarios 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    status: '',
    priority: '',
    proyectoId: '',
    assigneeId: '',
    estimatedHours: '',
    dueDate: ''
  });

  if (!task) return null;

  const handleStartEdit = () => {
    setEditForm({
      title: task.title,
      description: task.description || '',
      status: task.status,
      priority: task.priority,
      proyectoId: task.proyectoId,
      assigneeId: task.assigneeId || '',
      estimatedHours: task.estimatedHours?.toString() || '',
      dueDate: task.dueDate ? task.dueDate.split('T')[0] : ''
    });
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    try {
      const response = await fetch('/api/tareas', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: task.id,
          title: editForm.title,
          description: editForm.description || null,
          status: editForm.status,
          priority: editForm.priority,
          proyectoId: editForm.proyectoId,
          assigneeId: editForm.assigneeId || null,
          estimatedHours: editForm.estimatedHours || null,
          dueDate: editForm.dueDate || null
        })
      });

      if (!response.ok) throw new Error('Error al actualizar');

      const tareaActualizada = await response.json();
      onUpdate(tareaActualizada);
      setIsEditing(false);
    } catch (err) {
      alert('Error al guardar cambios');
    }
  };

  const handleDelete = async () => {
    if (!confirm('¿Estás seguro de eliminar esta tarea?')) return;

    try {
      const response = await fetch('/api/tareas', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: task.id })
      });

      if (!response.ok) throw new Error('Error al eliminar');

      onDelete(task.id);
      onClose();
    } catch (err) {
      alert('Error al eliminar tarea');
    }
  };

  const handleChangeStatus = async (newStatus: string) => {
    try {
      const response = await fetch('/api/tareas', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: task.id,
          status: newStatus
        })
      });

      if (!response.ok) throw new Error('Error al actualizar');

      const tareaActualizada = await response.json();
      onUpdate(tareaActualizada);
    } catch (err) {
      alert('Error al cambiar estado');
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Sin fecha';
    return new Date(dateStr).toLocaleDateString('es-ES');
  };

  return (
    <Sheet isOpen={isOpen} onClose={onClose} title={`Tarea #${task.id.slice(-6).toUpperCase()}`}>
      <div className="space-y-6">
        
        {/* Header con acciones */}
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              {task.proyecto?.title || 'Sin proyecto'}
            </span>
            <h2 className="text-xl font-bold text-gray-900 leading-snug mt-1">{task.title}</h2>
          </div>
          <div className="flex space-x-2 ml-4">
            {!isEditing ? (
              <>
                <button onClick={handleStartEdit} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-blue-600" title="Editar">
                  <Edit3 size={18} />
                </button>
                <button onClick={handleDelete} className="p-2 hover:bg-red-50 rounded-lg text-gray-500 hover:text-red-600" title="Eliminar">
                  <Trash2 size={18} />
                </button>
              </>
            ) : (
              <>
                <button onClick={handleSaveEdit} className="p-2 hover:bg-green-50 rounded-lg text-gray-500 hover:text-green-600" title="Guardar">
                  <Save size={18} />
                </button>
                <button onClick={() => setIsEditing(false)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-600" title="Cancelar">
                  <X size={18} />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Modo edición */}
        {isEditing ? (
          <div className="space-y-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Título *</label>
              <input
                type="text"
                value={editForm.title}
                onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:border-elio-yellow"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Descripción</label>
              <textarea
                value={editForm.description}
                onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:border-elio-yellow"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Estado</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:border-elio-yellow"
                >
                  <option value="PENDING">Pendiente</option>
                  <option value="IN_PROGRESS">En Progreso</option>
                  <option value="IN_REVIEW">En Revisión</option>
                  <option value="CORRECTION">Corrección</option>
                  <option value="CLOSED">Cerrada</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Prioridad</label>
                <select
                  value={editForm.priority}
                  onChange={(e) => setEditForm({...editForm, priority: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:border-elio-yellow"
                >
                  <option value="LOW">Baja</option>
                  <option value="MEDIUM">Media</option>
                  <option value="HIGH">Alta</option>
                  <option value="URGENT">Urgente</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Proyecto</label>
                <select
                  value={editForm.proyectoId}
                  onChange={(e) => setEditForm({...editForm, proyectoId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:border-elio-yellow"
                >
                  {proyectos.map(p => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Asignado a</label>
                <select
                  value={editForm.assigneeId}
                  onChange={(e) => setEditForm({...editForm, assigneeId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:border-elio-yellow"
                >
                  <option value="">Sin asignar</option>
                  {usuarios.map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Horas estimadas</label>
                <input
                  type="number"
                  step="0.5"
                  value={editForm.estimatedHours}
                  onChange={(e) => setEditForm({...editForm, estimatedHours: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:border-elio-yellow"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Deadline</label>
                <input
                  type="date"
                  value={editForm.dueDate}
                  onChange={(e) => setEditForm({...editForm, dueDate: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:border-elio-yellow"
                />
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Badges de estado */}
            <div className="flex space-x-2">
              {task.priority === 'URGENT' && <Badge variant="danger">URGENTE</Badge>}
              {task.priority === 'HIGH' && <Badge variant="warning">ALTA</Badge>}
              <Badge variant={task.status === 'CLOSED' ? 'success' : task.status === 'IN_PROGRESS' ? 'blue' : 'neutral'}>
                {task.status.replace('_', ' ')}
              </Badge>
            </div>

            {/* Botones de acción rápida */}
            <div className="flex space-x-3">
              <button className="flex-1 bg-elio-yellow hover:bg-elio-yellow-hover text-white py-2 rounded-lg font-medium flex items-center justify-center transition-colors shadow-sm">
                <Play size={16} className="mr-2 fill-current" /> Iniciar Timer
              </button>
              {task.status !== 'CLOSED' && (
                <button 
                  onClick={() => handleChangeStatus('CLOSED')}
                  className="flex-1 bg-white text-green-700 border border-green-200 hover:bg-green-50 py-2 rounded-lg font-medium"
                >
                  Completar
                </button>
              )}
            </div>

            {/* Cambiar estado rápido */}
            <div className="flex flex-wrap gap-2">
              <span className="text-xs text-gray-500 w-full mb-1">Cambiar estado:</span>
              {['PENDING', 'IN_PROGRESS', 'IN_REVIEW', 'CLOSED'].map(status => (
                <button
                  key={status}
                  onClick={() => handleChangeStatus(status)}
                  className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                    task.status === status 
                      ? 'bg-elio-yellow text-white border-elio-yellow' 
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                  }`}
                >
                  {status.replace('_', ' ')}
                </button>
              ))}
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                  {task.assignee?.name?.charAt(0) || '?'}
                </div>
                <div className="overflow-hidden">
                  <p className="text-[10px] text-gray-500 uppercase font-bold">Responsable</p>
                  <p className="text-sm font-medium text-gray-900 truncate">{task.assignee?.name || 'Sin asignar'}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400">
                  <Clock size={16} />
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase font-bold">Estimación</p>
                  <p className="text-sm font-medium text-gray-900">{task.estimatedHours || '-'}h</p>
                </div>
              </div>

              <div className="flex items-center space-x-2 col-span-2 border-t border-gray-200 pt-3">
                <Calendar size={16} className="text-gray-400 ml-1" />
                <div className="flex-1 ml-2">
                  <p className="text-[10px] text-gray-500 uppercase font-bold">Deadline</p>
                  <p className="text-sm font-medium text-gray-900">{formatDate(task.dueDate)}</p>
                </div>
              </div>
            </div>

            {/* Descripción */}
            {task.description && (
              <div className="text-sm text-gray-600 italic bg-yellow-50 p-3 rounded-lg border border-yellow-100">
                "{task.description}"
              </div>
            )}
          </>
        )}
      </div>
    </Sheet>
  );
};