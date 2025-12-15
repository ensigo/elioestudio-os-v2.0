import React, { useState } from 'react';
import { MOCK_TASKS, getProjectName, getResponsibleName } from '../../lib/mock-data';
import { Task } from '../../types';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { TaskCreationModal } from '../../components/TaskCreationModal';
import { TaskDetailSheet } from '../../components/TaskDetailSheet';
import { 
  Plus, Search, Filter, Play, Flag, CheckCircle2, AlertCircle, Clock 
} from 'lucide-react';

export const TasksPage = () => {
  const [tasks, setTasks] = useState<Task[]>(MOCK_TASKS);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Sorting: Put urgent/overdue first
  const sortedTasks = [...tasks].sort((a, b) => {
    // Logic: Urgent priority first, then Overdue dates
    if (a.priority === 'URGENT' && b.priority !== 'URGENT') return -1;
    if (b.priority === 'URGENT' && a.priority !== 'URGENT') return 1;
    return new Date(a.dueDate || '').getTime() - new Date(b.dueDate || '').getTime();
  });

  const handleCreateTask = (data: any) => {
    const newTask: Task = {
      id: `t${Date.now()}`,
      ...data,
      status: 'PENDING',
      subtasks: []
    };
    setTasks([...tasks, newTask]);
    setIsCreateModalOpen(false);
  };

  const handleUpdateTask = (updatedTask: Task) => {
    setTasks(tasks.map(t => t.id === updatedTask.id ? updatedTask : t));
    setSelectedTask(updatedTask); // Keep sheet updated
  };

  const isOverdue = (dateStr?: string) => {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0,0,0,0);
    return date < today;
  };
  
  const isToday = (dateStr?: string) => {
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

      {/* Advanced Data Table */}
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
              {sortedTasks.map(task => {
                const overdue = isOverdue(task.dueDate) && task.status !== 'CLOSED' && task.status !== 'APPROVED';
                const today = isToday(task.dueDate) && task.status !== 'CLOSED' && task.status !== 'APPROVED';
                
                return (
                  <tr 
                    key={task.id} 
                    onClick={() => setSelectedTask(task)}
                    className="group hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    {/* Timer Column */}
                    <td className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                       <button className="w-8 h-8 rounded-full bg-gray-100 hover:bg-elio-yellow hover:text-white flex items-center justify-center text-gray-400 transition-all shadow-sm">
                         <Play size={14} className="ml-0.5 fill-current" />
                       </button>
                    </td>

                    {/* Status Column */}
                    <td className="px-6 py-4">
                      <Badge variant={
                        task.status === 'CLOSED' ? 'success' :
                        task.status === 'IN_PROGRESS' ? 'blue' :
                        task.status === 'CORRECTION' ? 'warning' : 'neutral'
                      }>
                        {task.status.replace('_', ' ')}
                      </Badge>
                    </td>

                    {/* Task Info Column */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-900 group-hover:text-elio-yellow-hover transition-colors truncate max-w-xs">{task.title}</span>
                        <span className="text-[10px] text-gray-500 uppercase tracking-wide flex items-center mt-1">
                          {getProjectName(task.projectId)}
                          {task.subtasks && task.subtasks.length > 0 && (
                            <span className="ml-2 flex items-center bg-gray-100 px-1.5 rounded text-gray-600">
                              <CheckCircle2 size={10} className="mr-1" />
                              {task.subtasks.filter(t => t.isCompleted).length}/{task.subtasks.length}
                            </span>
                          )}
                        </span>
                      </div>
                    </td>

                    {/* Priority Column */}
                    <td className="px-6 py-4 text-center">
                       <div className="flex justify-center" title={task.priority}>
                         <PriorityIcon p={task.priority} />
                       </div>
                    </td>

                    {/* Assignee Column */}
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-[10px] font-bold text-gray-600 border border-white shadow-sm">
                          {getResponsibleName(task.assigneeId || '').charAt(0)}
                        </div>
                        <span className="text-gray-600 text-xs">{getResponsibleName(task.assigneeId || '').split(' ')[0]}</span>
                      </div>
                    </td>

                    {/* Deadline Column (The Red Alert Logic) */}
                    <td className="px-6 py-4">
                       <div className={`flex items-center ${
                         overdue || today 
                           ? 'text-red-600 font-bold bg-red-50 px-2 py-1 rounded-lg w-fit border border-red-100' 
                           : 'text-gray-500'
                       }`}>
                         {overdue || today ? <AlertCircle size={14} className="mr-2" /> : <Clock size={14} className="mr-2 text-gray-400" />}
                         <span className="text-xs">
                            {today ? 'HOY' : task.dueDate}
                         </span>
                       </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modals & Sheets */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Nueva Tarea">
        <TaskCreationModal onSubmit={handleCreateTask} onCancel={() => setIsCreateModalOpen(false)} />
      </Modal>

      <TaskDetailSheet 
        isOpen={!!selectedTask} 
        onClose={() => setSelectedTask(null)} 
        task={selectedTask}
        onUpdate={handleUpdateTask}
      />
    </div>
  );
};