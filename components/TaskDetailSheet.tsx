import React, { useState } from 'react';
import { Task, SubTask } from '../types';
import { getProjectName, getResponsibleName } from '../lib/mock-data';
import { Sheet } from './ui/Sheet';
import { Badge } from './ui/Badge';
import { CheckSquare, MessageSquare, Clock, Calendar, User, Play, AlertTriangle } from 'lucide-react';

interface TaskDetailSheetProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedTask: Task) => void;
}

export const TaskDetailSheet: React.FC<TaskDetailSheetProps> = ({ task, isOpen, onClose, onUpdate }) => {
  const [activeTab, setActiveTab] = useState<'details' | 'comments'>('details');

  if (!task) return null;

  const totalSubtasks = task.subtasks?.length || 0;
  const completedSubtasks = task.subtasks?.filter(st => st.isCompleted).length || 0;
  // BUSINESS RULE: Cannot close task if subtasks are pending
  const isCompletionBlocked = totalSubtasks > 0 && completedSubtasks < totalSubtasks;

  const handleToggleSubtask = (subtaskId: string) => {
    const updatedSubtasks = task.subtasks?.map(st => 
      st.id === subtaskId ? { ...st, isCompleted: !st.isCompleted } : st
    );
    onUpdate({ ...task, subtasks: updatedSubtasks });
  };

  const handleAddSubtask = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const title = e.currentTarget.value.trim();
      if (title) {
        const newSubtask: SubTask = {
          id: `st${Date.now()}`,
          title,
          isCompleted: false
        };
        onUpdate({ 
          ...task, 
          subtasks: [...(task.subtasks || []), newSubtask] 
        });
        e.currentTarget.value = '';
      }
    }
  };

  return (
    <Sheet isOpen={isOpen} onClose={onClose} title={`#${task.id.toUpperCase()}`}>
      <div className="space-y-6">
        
        {/* Header Info */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{getProjectName(task.projectId)}</span>
            <div className="flex space-x-2">
               {task.priority === 'URGENT' && <Badge variant="danger">URGENTE</Badge>}
               <Badge variant={task.status === 'CLOSED' ? 'success' : 'blue'}>{task.status.replace('_', ' ')}</Badge>
            </div>
          </div>
          <h2 className="text-xl font-bold text-gray-900 leading-snug">{task.title}</h2>
        </div>

        {/* Quick Actions */}
        <div className="flex space-x-3">
          <button className="flex-1 bg-elio-yellow hover:bg-elio-yellow-hover text-white py-2 rounded-lg font-medium flex items-center justify-center transition-colors shadow-sm">
            <Play size={16} className="mr-2 fill-current" /> Iniciar Timer
          </button>
          
          <div className="flex-1 relative group">
            <button 
               disabled={isCompletionBlocked}
               className={`w-full h-full py-2 rounded-lg font-medium border transition-colors flex items-center justify-center ${
                 isCompletionBlocked 
                   ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' 
                   : 'bg-white text-green-700 border-green-200 hover:bg-green-50'
               }`}
            >
              Marcar Completada
            </button>
            {isCompletionBlocked && (
              <div className="absolute top-full mt-2 left-0 w-full bg-red-50 text-red-600 text-xs p-2 rounded border border-red-100 shadow-lg z-10 hidden group-hover:block text-center">
                <div className="flex items-center justify-center font-bold mb-1"><AlertTriangle size={10} className="mr-1"/> Bloqueo de Calidad</div>
                Completa el checklist primero.
              </div>
            )}
          </div>
        </div>

        {/* Meta Grid */}
        <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
           <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                {getResponsibleName(task.assigneeId || '').charAt(0)}
              </div>
              <div className="overflow-hidden">
                <p className="text-[10px] text-gray-500 uppercase font-bold">Responsable</p>
                <p className="text-sm font-medium text-gray-900 truncate">{getResponsibleName(task.assigneeId || '')}</p>
              </div>
           </div>
           
           <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400">
                 <Clock size={16} />
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase font-bold">Estimación</p>
                <p className="text-sm font-medium text-gray-900">{task.estimatedHours}h</p>
              </div>
           </div>

           <div className="flex items-center space-x-2 col-span-2 border-t border-gray-200 pt-3">
              <Calendar size={16} className="text-gray-400 ml-1" />
              <div className="flex-1 ml-2">
                <p className="text-[10px] text-gray-500 uppercase font-bold">Deadline</p>
                <p className="text-sm font-medium text-gray-900">{task.dueDate}</p>
              </div>
           </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex space-x-6">
            <button 
              onClick={() => setActiveTab('details')}
              className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'details' ? 'border-elio-black text-elio-black' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center"><CheckSquare size={16} className="mr-2"/> Checklist ({completedSubtasks}/{totalSubtasks})</div>
            </button>
            <button 
              onClick={() => setActiveTab('comments')}
              className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'comments' ? 'border-elio-black text-elio-black' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
               <div className="flex items-center"><MessageSquare size={16} className="mr-2"/> Comentarios</div>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="min-h-[200px]">
          {activeTab === 'details' && (
            <div className="space-y-4">
               {task.description && (
                 <div className="text-sm text-gray-600 italic bg-yellow-50 p-3 rounded-lg border border-yellow-100">
                   "{task.description}"
                 </div>
               )}

               <div className="space-y-2">
                 {task.subtasks?.map(st => (
                   <div key={st.id} className="flex items-start group p-2 hover:bg-gray-50 rounded cursor-pointer" onClick={() => handleToggleSubtask(st.id)}>
                     <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center transition-colors ${st.isCompleted ? 'bg-elio-yellow border-elio-yellow' : 'border-gray-300 bg-white'}`}>
                        {st.isCompleted && <CheckSquare size={12} className="text-white" />}
                     </div>
                     <span className={`ml-3 text-sm transition-all select-none ${st.isCompleted ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                       {st.title}
                     </span>
                   </div>
                 ))}
               </div>
               
               <input 
                 type="text" 
                 placeholder="+ Añadir subtarea..."
                 onKeyDown={handleAddSubtask}
                 className="w-full mt-2 text-sm px-3 py-2 bg-white border border-dashed border-gray-300 rounded-lg focus:border-elio-yellow outline-none transition-colors"
               />
            </div>
          )}

          {activeTab === 'comments' && (
            <div className="text-center py-10 text-gray-400">
               <MessageSquare size={32} className="mx-auto mb-2 opacity-20" />
               <p className="text-sm">No hay comentarios en este hilo.</p>
            </div>
          )}
        </div>

      </div>
    </Sheet>
  );
};