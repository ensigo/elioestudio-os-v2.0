import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { TaskCreationModal } from '../../components/TaskCreationModal';
import { TaskDetailSheet } from '../../components/TaskDetailSheet';
import { 
  Plus, Search, Filter, Play, Square, Flag, AlertCircle, Clock, AlertTriangle,
  CheckCircle2, Archive, FolderOpen
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

interface ActiveTimer {
  id: string;
  tareaId: string;
  startTime: Date;
}

export const TasksPage = () => {
  const { usuario } = useAuth();
  const [tasks, setTasks] = useState<Tarea[]>([]);
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Tarea | null>(null);
  const [viewMode, setViewMode] = useState<'activas' | 'archivadas'>('activas');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Timer state
  const [activeTimer, setActiveTimer] = useState<ActiveTimer | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Cargar datos
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tareasRes, proyectosRes, usuariosRes] = await Promise.all([
          fetch('/api/tareas'),
          fetch('/api/proyectos'),
          fetch('/api/usuarios')
        ]);

        if (!tareasRes.ok || !proyectosRes.ok || !usuariosRes.ok) {
          throw new Error('Error al cargar datos');
        }

        const [tareasData, proyectosData, usuariosData] = await Promise.all([
          tareasRes.json(),
          proyectosRes.json(),
          usuariosRes.json()
        ]);

        setTasks(tareasData);
        setProyectos(proyectosData);
        setUsuarios(usuariosData);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Timer contador
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (activeTimer) {
      interval = setInterval(() => {
        const now = new Date();
        const diff = Math.floor((now.getTime() - activeTimer.startTime.getTime()) / 1000);
        setElapsedTime(diff);
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [activeTimer]);

  // Iniciar timer
  const handleStartTimer = async (tareaId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (activeTimer && activeTimer.tareaId !== tareaId) {
      await handleStopTimer(e);
    }

    try {
      const response = await fetch('/api/control-horario?entity=time-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: usuario?.id,
          tareaId
        })
      });

      if (!response.ok) throw new Error('Error al iniciar timer');

      const entry = await response.json();
      setActiveTimer({
        id: entry.id,
        tareaId,
        startTime: new Date(entry.startTime)
      });
      setElapsedTime(0);
    } catch (err: any) {
      console.error('Error timer:', err);
      alert('Error al iniciar timer: ' + (err.message || err));
    }
  };

  // Parar timer
  const handleStopTimer = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!activeTimer) return;

    try {
      const response = await fetch('/api/control-horario?entity=time-entries', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: activeTimer.id,
          endTime: new Date().toISOString()
        })
      });

      if (!response.ok) throw new Error('Error al detener timer');

      if (selectedTask && selectedTask.id === activeTimer.tareaId) {
        setSelectedTask({ ...selectedTask });
      }

      setActiveTimer(null);
      setElapsedTime(0);
    } catch (err) {
      alert('Error al detener timer');
    }
  };

  // Formatear tiempo
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleCreateTask = async (data: any) => {
    try {
      const response = await fetch('/api/tareas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: data.description || null,
          isRecurring: data.isRecurring || false,
          recurrenceFrequency: data.recurrenceFrequency || null,
          leadTime: data.leadTime || 3,
          title: data.title,
          proyectoId: data.proyectoId,
          type: data.type,
          priority: data.priority,
          assigneeId: data.assigneeId || null,
          estimatedHours: data.estimatedHours || null,
          dueDate: data.dueDate || null
        })
      });

      if (!response.ok) throw new Error('Error al crear tarea');

      const nuevaTarea = await response.json();
      setTasks([nuevaTarea, ...tasks]);
      setIsCreateModalOpen(false);
    } catch (err: any) {
      alert('Error: ' + err.message);
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <p className="text-xl text-elio-yellow animate-pulse">Cargando tareas...</p>
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

  // Filtrar tareas según vista y búsqueda
  const activeTasks = tasks.filter(t => t.status !== 'CLOSED');
  const archivedTasks = tasks.filter(t => t.status === 'CLOSED');

  const filterBySearch = (taskList: Tarea[]) => {
    if (!searchTerm) return taskList;
    const term = searchTerm.toLowerCase();
    return taskList.filter(t => 
      t.title.toLowerCase().includes(term) ||
      t.proyecto?.title?.toLowerCase().includes(term) ||
      t.assignee?.name?.toLowerCase().includes(term)
    );
  };

  const sortedActiveTasks = filterBySearch([...activeTasks]).sort((a, b) => {
    if (a.priority === 'URGENT' && b.priority !== 'URGENT') return -1;
    if (b.priority === 'URGENT' && a.priority !== 'URGENT') return 1;
    return 0;
  });

  // Agrupar tareas archivadas por proyecto
  const groupedArchivedTasks = filterBySearch(archivedTasks).reduce((acc, task) => {
    const projectName = task.proyecto?.title || 'Sin proyecto';
    if (!acc[projectName]) {
      acc[projectName] = [];
    }
    acc[projectName].push(task);
    return acc;
  }, {} as Record<string, Tarea[]>);

  const isOverdue = (dateStr: string | null) => {
    if (!dateStr) return false;
    return new Date(dateStr) < new Date();
  };

  const isToday = (dateStr: string | null) => {
    if (!dateStr) return false;
    return new Date(dateStr).toDateString() === new Date().toDateString();
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Sin fecha';
    return new Date(dateStr).toLocaleDateString('es-ES');
  };

  const PriorityIcon = ({ p }: { p: string }) => {
    switch(p) {
      case 'URGENT': return <Flag size={16} className="text-red-600 fill-current" />;
      case 'HIGH': return <Flag size={16} className="text-orange-500 fill-current" />;
      case 'MEDIUM': return <Flag size={16} className="text-blue-500" />;
      default: return <Flag size={16} className="text-gray-300" />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Timer activo banner */}
      {activeTimer && (
        <div className="bg-elio-yellow text-white px-4 py-3 rounded-lg flex items-center justify-between shadow-lg">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
            <span className="font-medium">
              Timer activo: {tasks.find(t => t.id === activeTimer.tareaId)?.title}
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-xl font-bold">{formatTime(elapsedTime)}</span>
            <button 
              onClick={handleStopTimer}
              className="bg-white text-elio-yellow px-3 py-1 rounded-lg font-medium flex items-center hover:bg-gray-100"
            >
              <Square size={14} className="mr-1 fill-current" /> Detener
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Tareas</h1>
          <p className="text-gray-500 text-sm">Listado operativo centralizado.</p>
        </div>
        <div className="flex space-x-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Filtrar..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-full outline-none focus:border-elio-yellow" 
            />
          </div>
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-elio-yellow text-white px-4 py-2 rounded-lg hover:bg-elio-yellow-hover transition-colors flex items-center space-x-2 font-medium whitespace-nowrap shadow-sm"
          >
            <Plus size={18} />
            <span>Nueva Tarea</span>
          </button>
        </div>
      </div>

      {/* Tabs Activas / Archivadas */}
      <div className="flex items-center gap-2 border-b border-gray-200">
        <button
          onClick={() => setViewMode('activas')}
          className={`flex items-center gap-2 px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
            viewMode === 'activas'
              ? 'border-elio-yellow text-elio-yellow'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Clock size={16} />
          Activas
          <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${
            viewMode === 'activas' ? 'bg-elio-yellow text-white' : 'bg-gray-100 text-gray-600'
          }`}>
            {activeTasks.length}
          </span>
        </button>
        <button
          onClick={() => setViewMode('archivadas')}
          className={`flex items-center gap-2 px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
            viewMode === 'archivadas'
              ? 'border-green-600 text-green-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Archive size={16} />
          Archivadas
          <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${
            viewMode === 'archivadas' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'
          }`}>
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
                  <th className="px-6 py-4 w-12 text-center">Timer</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4 w-1/3">Tarea / Proyecto</th>
                  <th className="px-6 py-4 text-center">Prio</th>
                  <th className="px-6 py-4">Asignado</th>
                  <th className="px-6 py-4">Deadline</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sortedActiveTasks.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      <CheckCircle2 size={32} className="mx-auto mb-2 text-green-400" />
                      ¡No hay tareas pendientes!
                    </td>
                  </tr>
                ) : (
                  sortedActiveTasks.map(task => {
                    const overdue = isOverdue(task.dueDate) && task.status !== 'CLOSED';
                    const today = isToday(task.dueDate) && task.status !== 'CLOSED';
                    const isTimerActive = activeTimer?.tareaId === task.id;
                    
                    return (
                      <tr 
                        key={task.id} 
                        onClick={() => setSelectedTask(task)}
                        className={`group hover:bg-gray-50 transition-colors cursor-pointer ${isTimerActive ? 'bg-yellow-50' : ''}`}
                      >
                        <td className="px-6 py-4 text-center">
                          {isTimerActive ? (
                            <button 
                              onClick={(e) => handleStopTimer(e)}
                              className="w-8 h-8 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-all shadow-sm"
                            >
                              <Square size={12} className="fill-current" />
                            </button>
                          ) : (
                            <button 
                              onClick={(e) => handleStartTimer(task.id, e)}
                              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-elio-yellow hover:text-white flex items-center justify-center text-gray-400 transition-all shadow-sm"
                            >
                              <Play size={14} className="ml-0.5 fill-current" />
                            </button>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={
                            task.status === 'IN_PROGRESS' ? 'blue' :
                            task.status === 'CORRECTION' ? 'warning' :
                            task.status === 'IN_REVIEW' ? 'info' : 'neutral'
                          }>
                            {task.status.replace('_', ' ')}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-900 group-hover:text-elio-yellow-hover transition-colors truncate max-w-xs">
                              {task.title}
                              {isTimerActive && (
                                <span className="ml-2 text-xs text-elio-yellow">
                                  {formatTime(elapsedTime)}
                                </span>
                              )}
                            </span>
                            <span className="text-[10px] text-gray-500 uppercase tracking-wide mt-1">
                              {task.proyecto?.title || 'Sin proyecto'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex justify-center">
                            <PriorityIcon p={task.priority} />
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-[10px] font-bold text-gray-600">
                              {task.assignee?.name?.charAt(0) || '?'}
                            </div>
                            <span className="text-gray-600 text-xs">{task.assignee?.name?.split(' ')[0] || 'Sin asignar'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className={`flex items-center ${overdue || today ? 'text-red-600 font-bold bg-red-50 px-2 py-1 rounded-lg w-fit' : 'text-gray-500'}`}>
                            {overdue || today ? <AlertCircle size={14} className="mr-2" /> : <Clock size={14} className="mr-2 text-gray-400" />}
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

      {/* Vista Archivadas - Agrupadas por Proyecto */}
      {viewMode === 'archivadas' && (
        <div className="space-y-6">
          {Object.keys(groupedArchivedTasks).length === 0 ? (
            <Card className="text-center py-12">
              <Archive size={32} className="mx-auto mb-2 text-gray-300" />
              <p className="text-gray-500">No hay tareas archivadas</p>
            </Card>
          ) : (
            Object.entries(groupedArchivedTasks).map(([projectName, projectTasks]) => (
              <Card key={projectName} noPadding className="overflow-hidden">
                <div className="bg-green-50 px-6 py-3 border-b border-green-100 flex items-center gap-2">
                  <FolderOpen size={18} className="text-green-600" />
                  <h3 className="font-bold text-green-800">{projectName}</h3>
                  <span className="ml-auto text-xs bg-green-600 text-white px-2 py-0.5 rounded-full">
                    {projectTasks.length} tareas
                  </span>
                </div>
                <div className="divide-y divide-gray-100">
                  {projectTasks.map(task => (
                    <div 
                      key={task.id}
                      onClick={() => setSelectedTask(task)}
                      className="px-6 py-4 hover:bg-gray-50 cursor-pointer flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <CheckCircle2 size={18} className="text-green-500" />
                        <div>
                          <p className="font-medium text-gray-700">{task.title}</p>
                          <p className="text-xs text-gray-400">
                            {task.assignee?.name || 'Sin asignar'} • Completada
                          </p>
                        </div>
                      </div>
                      <div className="text-xs text-gray-400">
                        {task.dueDate ? formatDate(task.dueDate) : ''}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            ))
          )}
        </div>
      )}

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
        activeTimer={activeTimer}
        onStartTimer={(tareaId) => handleStartTimer(tareaId, { stopPropagation: () => {} } as React.MouseEvent)}
        onStopTimer={() => handleStopTimer({ stopPropagation: () => {} } as React.MouseEvent)}
        elapsedTime={elapsedTime}
      />
    </div>
  );
};