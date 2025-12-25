import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { TaskCreationModal } from '../../components/TaskCreationModal';
import { 
  Plus, Search, Filter, Play, Flag, CheckCircle2, AlertCircle, Clock, AlertTriangle 
} from 'lucide-react';

interface Proyecto {
  id: string;
  title: string;
  cliente?: { name: string };
}

interface Usuario {
  id: string;
  name: string;
  role: string;
}

interface Tarea {
  id: string;
  title: string;
  description: string | null;
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

export const TasksPage = () => {
  const [tasks, setTasks] = useState<Tarea[]>([]);
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // --- CARGAR DATOS ---
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
        console.error('Error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // --- CREAR TAREA ---
  const handleCreateTask = async (data: any) => {
    try {
      const response = await fetch('/api/tareas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: data.title,
          proyectoId: data.proyectoId,
          type: data.type,
          priority: data.priority,
          assigneeId: data.assigneeId || null,
          estimatedHours: data.estimatedHours || null,
          dueDate: data.dueDate || null
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al crear tarea');
      }

      const nuevaTarea = await response.json();
      setTasks([nuevaTarea, ...tasks]);
      setIsCreateModalOpen(false);
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  // --- LOADING ---
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <p className="text-xl text-elio-yellow animate-pulse">Cargando tareas...</p>
      </div>
    );
  }

  // --- ERROR ---
  if (error) {
    return (
      <div className="flex justify-center items-center h-96 bg-red-50 p-6 rounded-lg border border-red-200">
        <AlertTriangle size={24} className="text-red-500 mr-3" />
        <p className="text-red-700 font-medium">Error: {error}</p>
      </div>
    );
  }

  // Sorting: Put urgent/overdue first
  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.priority === 'URGENT' && b.priority !== 'URGENT') return -1;
    if (b.priority === 'URGENT' && a.priority !== 'URGENT') return 1;
    return new Date(a.dueDate || '').getTime() - new Date(b.dueDate || '').getTime();
  });

  const isOverdue = (dateStr?: string | null) => {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0,0,0,0);
    return date < today;
  };
  
  const isToday = (dateStr?: string | null) => {
    if (!dateStr) return false;
    const date = new Date(dateStr).toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];
    return date === today;
  };

  const PriorityIcon = ({ p }: { p: string }) => {
    switch(p) {
      case 'URGENT': return <Flag size={16} className="text-red-600 fill-current" />;
      case 'HIGH': return <Flag size={16} className="text-orange-500 fill-current" />;
      case 'MEDIUM': return <Flag size={16} className="text-blue-500" />;
      default: return <Flag size={16} className="text-gray-300" />;
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Sin fecha';
    return new Date(dateStr).toLocaleDateString('es-ES');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Tareas</h1>
          <p className="text-gray-500 text-sm">Listado operativo centralizado.</p>
        </div>
        <div className="flex space-x-3 w-full sm:w-auto">
           <div className="relative flex-1 sm:flex-none">
             <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
             <input type="text" placeholder="Filtrar..." className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-full outline-none focus:border-elio-yellow" />
           </div>
           <button className="bg-white border border-gray-200 p-2 rounded-lg text-gray-600 hover:bg-gray-50">
              <Filter size={18} />
           </button>
           <button 
             onClick={() => setIsCreateModalOpen(true)}
             className="bg-elio-yellow text-white px-4 py-2 rounded-lg hover:bg-elio-yellow-hover transition-colors flex items-center space-x-2 font-medium whitespace-nowrap shadow-sm"
           >
             <Plus size={18} />
             <span>Nueva Tarea</span>
           </button>
        </div>
      </div>

      {/* Data Table */}
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
              {sortedTasks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No hay tareas. ¡Crea la primera!
                  </td>
                </tr>
              ) : (
                sortedTasks.map(task => {
                  const overdue = isOverdue(task.dueDate) && task.status !== 'CLOSED' && task.status !== 'APPROVED';
                  const today = isToday(task.dueDate) && task.status !== 'CLOSED' && task.status !== 'APPROVED';
                  
                  return (
                    <tr 
                      key={task.id} 
                      className="group hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      {/* Timer Column */}
                      <td className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                         <button className="w-8 h-8 rounded-full bg-gray-100 hover:bg-elio-yellow hover:text-white flex items-center justify-center text-gray-400 transition-all shadow-sm">
                           <Play size={14} className="ml-0.5 fill-current" />
                         </button>
                      </td>

                      {/* Status Column */</tr>