import React, { useState } from 'react';
import { MOCK_PROJECTS, MOCK_CLIENTS, getClientName } from '../../lib/mock-data';
import { Project, ProjectStatus } from '../../types';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Plus, Briefcase, Lock, Clock, CheckCircle } from 'lucide-react';

export const ProjectsPage = () => {
  const [projects, setProjects] = useState<Project[]>(MOCK_PROJECTS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Creation Form State
  const [formData, setFormData] = useState({
    title: '',
    clientId: '',
    budget: '',
    status: 'ACTIVE' as ProjectStatus,
    deadline: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) newErrors.title = "El título es obligatorio";
    if (!formData.clientId) newErrors.clientId = "Debes vincular un cliente existente (Referential Integrity)";
    if (!formData.budget || Number(formData.budget) <= 0) newErrors.budget = "El presupuesto debe ser positivo";
    if (!formData.deadline) newErrors.deadline = "Define una fecha límite";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreate = () => {
    if (validate()) {
      const newProject: Project = {
        id: `p${Date.now()}`,
        title: formData.title,
        clientId: formData.clientId,
        status: formData.status,
        budget: Number(formData.budget),
        deadline: formData.deadline,
        isArchived: false,
        tags: ['Nuevo']
      };
      setProjects([...projects, newProject]);
      setIsModalOpen(false);
      setFormData({ title: '', clientId: '', budget: '', status: 'ACTIVE', deadline: '' });
    }
  };

  // Group projects by status
  const groupedProjects = {
    ACTIVE: projects.filter(p => p.status === 'ACTIVE'),
    PENDING: projects.filter(p => p.status === 'PENDING'),
    BLOCKED: projects.filter(p => p.status === 'BLOCKED'),
    COMPLETED: projects.filter(p => p.status === 'COMPLETED'),
  };

  const StatusColumn = ({ title, status, icon: Icon, colorClass, items }: any) => (
    <div className="flex-1 min-w-[300px]">
      <div className={`flex items-center space-x-2 mb-4 pb-2 border-b-2 ${colorClass}`}>
        <Icon size={18} />
        <h3 className="font-bold text-gray-700 uppercase text-xs tracking-wider">{title} ({items.length})</h3>
      </div>
      <div className="space-y-4">
        {items.map((project: Project) => (
          <div key={project.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow group relative">
            <div className="flex justify-between items-start mb-2">
              <Badge variant="blue">{getClientName(project.clientId)}</Badge>
              <span className="text-xs text-gray-400 font-mono">{project.deadline}</span>
            </div>
            <h4 className="font-bold text-gray-900 mb-2 group-hover:text-elio-yellow transition-colors">{project.title}</h4>
            
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50">
               <span className="text-sm font-medium text-gray-600">{new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(project.budget)}</span>
               {project.tags && (
                 <div className="flex space-x-1">
                   {project.tags.map(tag => (
                     <span key={tag} className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{tag}</span>
                   ))}
                 </div>
               )}
            </div>
            {/* Conditional Border for Blocked */}
            {status === 'BLOCKED' && (
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-400 rounded-l-xl"></div>
            )}
          </div>
        ))}
        {items.length === 0 && (
          <div className="h-24 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center text-gray-400 text-xs">
            Sin proyectos
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6 overflow-x-auto">
      <div className="flex justify-between items-center">
        <div>
           <h1 className="text-2xl font-bold text-gray-900">Proyectos Activos</h1>
           <p className="text-gray-500 text-sm">Tablero Kanban de seguimiento operativo.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-elio-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors flex items-center space-x-2 font-medium"
        >
          <Plus size={18} />
          <span>Alta de Proyecto</span>
        </button>
      </div>

      <div className="flex space-x-6 pb-4">
        <StatusColumn title="En Curso" status="ACTIVE" icon={Briefcase} colorClass="border-emerald-500 text-emerald-600" items={groupedProjects.ACTIVE} />
        <StatusColumn title="Pendiente Inicio" status="PENDING" icon={Clock} colorClass="border-blue-400 text-blue-500" items={groupedProjects.PENDING} />
        <StatusColumn title="Bloqueados" status="BLOCKED" icon={Lock} colorClass="border-red-400 text-red-500" items={groupedProjects.BLOCKED} />
        <StatusColumn title="Completados" status="COMPLETED" icon={CheckCircle} colorClass="border-gray-400 text-gray-500" items={groupedProjects.COMPLETED} />
      </div>

      {/* Project Creation Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nuevo Proyecto">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cliente (Vinculación Obligatoria)</label>
            <select 
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-elio-yellow/50 outline-none"
              value={formData.clientId}
              onChange={(e) => setFormData({...formData, clientId: e.target.value})}
            >
              <option value="">Selecciona un cliente...</option>
              {MOCK_CLIENTS.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            {errors.clientId && <p className="text-xs text-red-500 mt-1">{errors.clientId}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Proyecto</label>
            <input 
              type="text" 
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-elio-yellow/50 outline-none"
              placeholder="Ej: Rediseño Web 2024"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
            />
            {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Presupuesto (€)</label>
              <input 
                type="number" 
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-elio-yellow/50 outline-none"
                placeholder="0.00"
                value={formData.budget}
                onChange={(e) => setFormData({...formData, budget: e.target.value})}
              />
              {errors.budget && <p className="text-xs text-red-500 mt-1">{errors.budget}</p>}
            </div>
             <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
              <input 
                type="date" 
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-elio-yellow/50 outline-none"
                value={formData.deadline}
                onChange={(e) => setFormData({...formData, deadline: e.target.value})}
              />
              {errors.deadline && <p className="text-xs text-red-500 mt-1">{errors.deadline}</p>}
            </div>
          </div>

           <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado Inicial</label>
            <select 
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-elio-yellow/50 outline-none"
              value={formData.status}
              onChange={(e) => setFormData({...formData, status: e.target.value as ProjectStatus})}
            >
              <option value="ACTIVE">Activo</option>
              <option value="PENDING">Pendiente</option>
              <option value="BLOCKED">Bloqueado</option>
            </select>
          </div>

          <div className="pt-4 flex justify-end space-x-3">
             <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
             <button onClick={handleCreate} className="px-4 py-2 text-sm text-white bg-elio-black hover:bg-gray-800 rounded-lg">Crear Proyecto</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};