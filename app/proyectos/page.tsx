import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Plus, Briefcase, Lock, Clock, CheckCircle, AlertTriangle } from 'lucide-react';

interface Cliente {
  id: string;
  name: string;
}

interface Usuario {
  id: string;
  name: string;
}

interface Proyecto {
  id: string;
  title: string;
  clienteId: string;
  responsibleId: string | null;
  status: string;
  budget: number | null;
  deadline: string | null;
  isArchived: boolean;
  cliente?: Cliente;
  responsable?: Usuario;
}

export const ProjectsPage = () => {
  const [projects, setProjects] = useState<Proyecto[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    clienteId: '',
    responsibleId: '',
    budget: '',
    status: 'ACTIVE',
    deadline: ''
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // --- CARGAR DATOS ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [proyectosRes, clientesRes, usuariosRes] = await Promise.all([
          fetch('/api/proyectos'),
          fetch('/api/clientes'),
          fetch('/api/usuarios')
        ]);

        if (!proyectosRes.ok || !clientesRes.ok || !usuariosRes.ok) {
          throw new Error('Error al cargar datos');
        }

        const [proyectosData, clientesData, usuariosData] = await Promise.all([
          proyectosRes.json(),
          clientesRes.json(),
          usuariosRes.json()
        ]);

        setProjects(proyectosData);
        setClientes(clientesData);
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

  // --- VALIDACIÓN ---
  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) newErrors.title = "El título es obligatorio";
    if (!formData.clienteId) newErrors.clienteId = "Debes seleccionar un cliente";
    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // --- CREAR PROYECTO ---
  const handleCreate = async () => {
    if (!validate()) return;

    try {
      const response = await fetch('/api/proyectos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          clienteId: formData.clienteId,
          responsibleId: formData.responsibleId || null,
          status: formData.status,
          budget: formData.budget || null,
          deadline: formData.deadline || null
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al crear proyecto');
      }

      const nuevoProyecto = await response.json();
      setProjects([nuevoProyecto, ...projects]);
      setIsModalOpen(false);
      setFormData({ title: '', clienteId: '', responsibleId: '', budget: '', status: 'ACTIVE', deadline: '' });
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  // --- LOADING ---
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <p className="text-xl text-elio-yellow animate-pulse">Cargando proyectos...</p>
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

  // --- AGRUPAR PROYECTOS POR ESTADO ---
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
        {items.map((project: Proyecto) => (
          <div key={project.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow group relative">
            <div className="flex justify-between items-start mb-2">
              <Badge variant="blue">{project.cliente?.name || 'Sin cliente'}</Badge>
              <span className="text-xs text-gray-400 font-mono">
                {project.deadline ? new Date(project.deadline).toLocaleDateString('es-ES') : 'Sin fecha'}
              </span>
            </div>
            <h4 className="font-bold text-gray-900 mb-2 group-hover:text-elio-yellow transition-colors">{project.title}</h4>
            
            {project.responsable && (
              <p className="text-xs text-gray-500 mb-2">Responsable: {project.responsable.name}</p>
            )}
            
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50">
              <span className="text-sm font-medium text-gray-600">
                {project.budget 
                  ? new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(project.budget)
                  : 'Sin presupuesto'
                }
              </span>
            </div>
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
        <StatusColumn title="Pendiente Inicio" status="PENDING" icon={Clock} colorClass="border-blue-400 text-blue-500" items={groupedProjects.PENDING} />
        <StatusColumn title="En Curso" status="ACTIVE" icon={Briefcase} colorClass="border-emerald-500 text-emerald-600" items={groupedProjects.ACTIVE} />
        <StatusColumn title="Completados" status="COMPLETED" icon={CheckCircle} colorClass="border-gray-400 text-gray-500" items={groupedProjects.COMPLETED} />
        <StatusColumn title="Bloqueados" status="BLOCKED" icon={Lock} colorClass="border-red-400 text-red-500" items={groupedProjects.BLOCKED} />
      </div>

      {/* Modal de Creación */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nuevo Proyecto">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cliente *</label>
            <select 
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-elio-yellow/50 outline-none"
              value={formData.clienteId}
              onChange={(e) => setFormData({...formData, clienteId: e.target.value})}
            >
              <option value="">Selecciona un cliente...</option>
              {clientes.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            {formErrors.clienteId && <p className="text-xs text-red-500 mt-1">{formErrors.clienteId}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Proyecto *</label>
            <input 
              type="text" 
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-elio-yellow/50 outline-none"
              placeholder="Ej: Rediseño Web 2024"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
            />
            {formErrors.title && <p className="text-xs text-red-500 mt-1">{formErrors.title}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Responsable</label>
            <select 
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-elio-yellow/50 outline-none"
              value={formData.responsibleId}
              onChange={(e) => setFormData({...formData, responsibleId: e.target.value})}
            >
              <option value="">Sin asignar</option>
              {usuarios.map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
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
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
              <input 
                type="date" 
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-elio-yellow/50 outline-none"
                value={formData.deadline}
                onChange={(e) => setFormData({...formData, deadline: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado Inicial</label>
            <select 
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-elio-yellow/50 outline-none"
              value={formData.status}
              onChange={(e) => setFormData({...formData, status: e.target.value})}
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