import React, { useState, useEffect } from 'react';
import { authFetch } from '../lib/auth-fetch';
import { useToast } from './ui/Toast';
import { useAuth } from '../context/AuthContext';
import { Sheet } from './ui/Sheet';
import { Badge } from './ui/Badge';
import { Clock, Calendar, Play, Square, Trash2, Edit3, Save, X, Timer, ChevronDown, ChevronUp } from 'lucide-react';

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

interface ActiveTimer {
  id: string;
  tareaId: string;
  startTime: Date;
}

interface TaskDetailSheetProps {
  task: Tarea | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedTask: Tarea) => void;
  onDelete: (taskId: string) => void;
  proyectos: Proyecto[];
  usuarios: Usuario[];
  activeTimer?: ActiveTimer | null;
  onStartTimer?: (tareaId: string) => void;
  onStopTimer?: () => void;
  elapsedTime?: number;
}

export const TaskDetailSheet: React.FC<TaskDetailSheetProps> = ({
  task,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
  proyectos,
  usuarios,
  activeTimer,
  onStartTimer,
  onStopTimer,
  elapsedTime = 0
}) => {
  const { error, success } = useToast();
  const { canAdjustSchedules } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [totalTime, setTotalTime] = useState(0);
  const [loadingTime, setLoadingTime] = useState(false);
  const [timeEntries, setTimeEntries] = useState<any[]>([]);
  const [showTimeEntries, setShowTimeEntries] = useState(false);
  const [editingEntry, setEditingEntry] = useState<any | null>(null);
  const [entryEditForm, setEntryEditForm] = useState({ startTime: '', endTime: '' });
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

  // Reset editing state when task changes
  useEffect(() => {
    setIsEditing(false);
  }, [task?.id]);

  // Cargar tiempo acumulado y time entries de la tarea
  useEffect(() => {
    const fetchTimeData = async () => {
      if (!task?.id) return;
      setLoadingTime(true);
      try {
        const response = await authFetch(`/api/control-horario?entity=time-entries&tareaId=${task.id}`);
        if (response.ok) {
          const entries = await response.json();
          setTimeEntries(entries);
          const total = entries.reduce((acc: number, entry: any) => {
            if (entry.startTime && entry.endTime) {
              return acc + Math.floor((new Date(entry.endTime).getTime() - new Date(entry.startTime).getTime()) / 1000);
            }
            return acc;
          }, 0);
          setTotalTime(total);
        }
      } catch (err) {
        console.error('Error cargando tiempo:', err);
      } finally {
        setLoadingTime(false);
      }
    };

    if (isOpen && task?.id) {
      fetchTimeData();
    }
  }, [isOpen, task?.id]);

  const handleEditEntry = (entry: any) => {
    setEditingEntry(entry);
    const toLocalInput = (d: string) => {
      const date = new Date(d);
      date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
      return date.toISOString().slice(0, 16);
    };
    setEntryEditForm({
      startTime: toLocalInput(entry.startTime),
      endTime: entry.endTime ? toLocalInput(entry.endTime) : ''
    });
  };

  const handleSaveEntry = async () => {
    if (!editingEntry) return;
    try {
      const response = await authFetch('/api/control-horario?entity=time-entries', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingEntry.id,
          startTime: entryEditForm.startTime,
          endTime: entryEditForm.endTime || null
        })
      });
      if (!response.ok) throw new Error();
      const updated = await response.json();
      setTimeEntries(prev => prev.map(e => e.id === updated.id ? updated : e));
      const total = timeEntries.map(e => e.id === updated.id ? updated : e).reduce((acc: number, e: any) => {
        if (e.startTime && e.endTime) return acc + Math.floor((new Date(e.endTime).getTime() - new Date(e.startTime).getTime()) / 1000);
        return acc;
      }, 0);
      setTotalTime(total);
      setEditingEntry(null);
      success('Registro actualizado');
    } catch {
      error('Error al guardar el registro');
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (!confirm('¿Eliminar este registro de tiempo?')) return;
    try {
      const response = await authFetch('/api/control-horario?entity=time-entries', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: entryId })
      });
      if (!response.ok) throw new Error();
      const updated = timeEntries.filter(e => e.id !== entryId);
      setTimeEntries(updated);
      setTotalTime(updated.reduce((acc: number, e: any) => {
        if (e.startTime && e.endTime) return acc + Math.floor((new Date(e.endTime).getTime() - new Date(e.startTime).getTime()) / 1000);
        return acc;
      }, 0));
      success('Registro eliminado');
    } catch {
      error('Error al eliminar el registro');
    }
  };

  if (!task) return null;

  const isTimerActive = activeTimer?.tareaId === task.id;

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
      const response = await authFetch('/api/tareas', {
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
      error('Error al guardar cambios');
    }
  };

  const handleDelete = async () => {
    if (!confirm('¿Estás seguro de eliminar esta tarea?')) return;

    try {
      const response = await authFetch('/api/tareas', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: task.id })
      });

      if (!response.ok) throw new Error('Error al eliminar');

      onDelete(task.id);
      onClose();
    } catch (err) {
      error('Error al eliminar tarea');
    }
  };

  const handleChangeStatus = async (newStatus: string) => {
    try {
      const response = await authFetch('/api/tareas', {
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
      error('Error al cambiar estado');
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Sin fecha';
    return new Date(dateStr).toLocaleDateString('es-ES');
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formatHoursMinutes = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h === 0) return `${m}m`;
    return `${h}h ${m}m`;
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

            {/* Timer activo en panel */}
            {isTimerActive && (
              <div className="bg-elio-yellow text-white p-4 rounded-xl flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                  <span className="font-medium">Timer activo</span>
                </div>
                <span className="text-2xl font-bold">{formatTime(elapsedTime)}</span>
              </div>
            )}

            {/* Tiempo acumulado */}
            {!isTimerActive && (totalTime > 0 || loadingTime) && (
              <div className="bg-blue-50 text-blue-800 p-4 rounded-xl flex items-center justify-between border border-blue-100">
                <div className="flex items-center space-x-2">
                  <Timer size={18} className="text-blue-600" />
                  <span className="font-medium">Tiempo dedicado</span>
                </div>
                <span className="font-mono text-xl font-bold">
                  {loadingTime ? '...' : formatHoursMinutes(totalTime)}
                </span>
              </div>
            )}

            {/* Botones de acción rápida */}
            <div className="flex space-x-3">
              {isTimerActive ? (
                <button 
                  onClick={onStopTimer}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg font-medium flex items-center justify-center transition-colors shadow-sm"
                >
                  <Square size={16} className="mr-2 fill-current" /> Detener Timer
                </button>
              ) : (
                <button 
                  onClick={() => onStartTimer?.(task.id)}
                  className="flex-1 bg-elio-yellow hover:bg-elio-yellow-hover text-white py-2 rounded-lg font-medium flex items-center justify-center transition-colors shadow-sm"
                >
                  <Play size={16} className="mr-2 fill-current" /> Iniciar Timer
                </button>
              )}
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

            {/* Gestión de registros de tiempo — solo admins */}
            {canAdjustSchedules && (
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setShowTimeEntries(v => !v)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 text-sm font-bold text-gray-700 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Timer size={15} />
                    Registros de tiempo ({timeEntries.length})
                  </span>
                  {showTimeEntries ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                </button>

                {showTimeEntries && (
                  <div className="divide-y divide-gray-100">
                    {timeEntries.length === 0 ? (
                      <p className="text-center text-gray-400 py-6 text-sm">Sin registros</p>
                    ) : timeEntries.map((entry: any) => (
                      <div key={entry.id} className="px-4 py-3">
                        {editingEntry?.id === entry.id ? (
                          <div className="space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-[10px] font-bold text-gray-500 uppercase">Inicio</label>
                                <input
                                  type="datetime-local"
                                  value={entryEditForm.startTime}
                                  onChange={e => setEntryEditForm(f => ({ ...f, startTime: e.target.value }))}
                                  className="w-full text-xs px-2 py-1 border border-gray-300 rounded-lg outline-none focus:border-elio-yellow"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-bold text-gray-500 uppercase">Fin</label>
                                <input
                                  type="datetime-local"
                                  value={entryEditForm.endTime}
                                  onChange={e => setEntryEditForm(f => ({ ...f, endTime: e.target.value }))}
                                  className="w-full text-xs px-2 py-1 border border-gray-300 rounded-lg outline-none focus:border-elio-yellow"
                                />
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button onClick={handleSaveEntry} className="flex-1 text-xs bg-elio-yellow text-white py-1.5 rounded-lg font-medium hover:bg-elio-yellow-hover">
                                Guardar
                              </button>
                              <button onClick={() => setEditingEntry(null)} className="flex-1 text-xs bg-gray-100 text-gray-700 py-1.5 rounded-lg font-medium hover:bg-gray-200">
                                Cancelar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <div className="text-xs text-gray-600 space-y-0.5">
                              <div className="font-medium text-gray-800">{entry.usuario?.name}</div>
                              <div className="font-mono">
                                <span className="text-green-700">{new Date(entry.startTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
                                {' → '}
                                {entry.endTime
                                  ? <span className="text-red-700">{new Date(entry.endTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
                                  : <span className="text-orange-500 animate-pulse">en curso</span>}
                                {' '}
                                <span className="text-gray-400">{new Date(entry.startTime).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })}</span>
                              </div>
                              {entry.startTime && entry.endTime && (
                                <div className="text-gray-400">
                                  {formatHoursMinutes(Math.floor((new Date(entry.endTime).getTime() - new Date(entry.startTime).getTime()) / 1000))}
                                </div>
                              )}
                            </div>
                            <div className="flex gap-1 ml-2">
                              <button onClick={() => handleEditEntry(entry)} className="p-1.5 hover:bg-blue-50 rounded-lg text-gray-400 hover:text-blue-600">
                                <Edit3 size={13} />
                              </button>
                              <button onClick={() => handleDeleteEntry(entry.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600">
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </Sheet>
  );
};