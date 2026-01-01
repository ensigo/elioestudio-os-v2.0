import React, { useState, useEffect } from 'react';
import { TaskType, TaskPriority } from '../types';
import { Calendar, Clock, Briefcase, RefreshCw, BookOpen, Search, X, ChevronDown } from 'lucide-react';

interface Proyecto {
  id: string;
  title: string;
}

interface Usuario {
  id: string;
  name: string;
  role: string;
}

interface PlantillaTarea {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  categoriaId: string;
  categoria?: {
    id: string;
    codigo: string;
    nombre: string;
    color: string;
  };
  rolSugeridoTipo: string | null;
  tiempoEstimado: number;
  esRecurrente: boolean;
  frecuencia: string | null;
}

interface CategoriaServicio {
  id: string;
  codigo: string;
  nombre: string;
  color: string;
  plantillas: PlantillaTarea[];
}

interface TaskCreationModalProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
  proyectos: Proyecto[];
  usuarios: Usuario[];
}

export const TaskCreationModal: React.FC<TaskCreationModalProps> = ({ onSubmit, onCancel, proyectos, usuarios }) => {
  const [isRecurring, setIsRecurring] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    proyectoId: '',
    type: 'OPERATIONAL' as TaskType,
    priority: 'MEDIUM' as TaskPriority,
    assigneeId: '',
    estimatedHours: '',
    dueDate: '',
    recurrenceFrequency: 'MONTHLY',
    leadTime: 7
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Estado para el catálogo
  const [showCatalogo, setShowCatalogo] = useState(false);
  const [categorias, setCategorias] = useState<CategoriaServicio[]>([]);
  const [loadingCatalogo, setLoadingCatalogo] = useState(false);
  const [busquedaCatalogo, setBusquedaCatalogo] = useState('');
  const [categoriaExpandida, setCategoriaExpandida] = useState<string | null>(null);
  const [plantillaSeleccionada, setPlantillaSeleccionada] = useState<PlantillaTarea | null>(null);

  // Cargar catálogo cuando se abre
  useEffect(() => {
    if (showCatalogo && categorias.length === 0) {
      fetchCatalogo();
    }
  }, [showCatalogo]);

  const fetchCatalogo = async () => {
    setLoadingCatalogo(true);
    try {
      const res = await fetch('/api/catalogo?tipo=categorias');
      if (res.ok) {
        const data = await res.json();
        // Mapear plantillas_tarea a plantillas para el frontend
        const categoriasConPlantillas = data.map((cat: any) => ({
          ...cat,
          plantillas: cat.plantillas_tarea || cat.plantillas || []
        }));
        setCategorias(categoriasConPlantillas);
      }
    } catch (error) {
      console.error('Error cargando catálogo:', error);
    } finally {
      setLoadingCatalogo(false);
    }
  };

  // Aplicar plantilla seleccionada
  const aplicarPlantilla = (plantilla: PlantillaTarea) => {
    setPlantillaSeleccionada(plantilla);
    setFormData({
      ...formData,
      title: plantilla.nombre,
      description: plantilla.descripcion || '',
      estimatedHours: plantilla.tiempoEstimado.toString(),
    });
    
    // Si la plantilla es recurrente, activar el toggle
    if (plantilla.esRecurrente) {
      setIsRecurring(true);
      setFormData(prev => ({
        ...prev,
        recurrenceFrequency: plantilla.frecuencia || 'MONTHLY'
      }));
    }

    // Buscar usuario con el rol sugerido
    if (plantilla.rolSugeridoTipo) {
      const usuarioSugerido = usuarios.find(u => u.role === plantilla.rolSugeridoTipo);
      if (usuarioSugerido) {
        setFormData(prev => ({
          ...prev,
          assigneeId: usuarioSugerido.id
        }));
      }
    }

    setShowCatalogo(false);
    setBusquedaCatalogo('');
  };

  // Filtrar plantillas por búsqueda
  const filtrarPlantillas = (plantillas: PlantillaTarea[]) => {
    if (!busquedaCatalogo) return plantillas;
    const query = busquedaCatalogo.toLowerCase();
    return plantillas.filter(p =>
      p.nombre.toLowerCase().includes(query) ||
      p.codigo.toLowerCase().includes(query) ||
      p.descripcion?.toLowerCase().includes(query)
    );
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) newErrors.title = "El título es obligatorio.";
    if (!formData.proyectoId) newErrors.proyectoId = "Proyecto requerido.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit({ ...formData, isRecurring, description: formData.description });
    }
  };

  const quitarPlantilla = () => {
    setPlantillaSeleccionada(null);
    setFormData({
      ...formData,
      title: '',
      description: '',
      estimatedHours: '',
      assigneeId: ''
    });
    setIsRecurring(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      
      {/* SELECTOR DE PLANTILLA */}
      <div className="space-y-3">
        {plantillaSeleccionada ? (
          <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: plantillaSeleccionada.categoria?.color || '#6B7280' }}
              />
              <div>
                <span className="font-mono text-xs text-green-600 bg-green-100 px-1.5 py-0.5 rounded mr-2">
                  {plantillaSeleccionada.codigo}
                </span>
                <span className="text-sm font-medium text-green-800">
                  {plantillaSeleccionada.nombre}
                </span>
              </div>
            </div>
            <button 
              type="button"
              onClick={quitarPlantilla}
              className="text-green-600 hover:text-green-800 p-1"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowCatalogo(true)}
            className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-elio-yellow hover:text-elio-yellow transition-colors"
          >
            <BookOpen size={18} />
            <span className="text-sm font-medium">Usar plantilla del catálogo</span>
          </button>
        )}
      </div>

      {/* MODAL DEL CATÁLOGO */}
      {showCatalogo && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-bold text-lg text-gray-800">Seleccionar Plantilla</h3>
              <button 
                type="button"
                onClick={() => { setShowCatalogo(false); setBusquedaCatalogo(''); }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            {/* Buscador */}
            <div className="p-4 border-b border-gray-100">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar tarea..."
                  value={busquedaCatalogo}
                  onChange={(e) => setBusquedaCatalogo(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-elio-yellow"
                  autoFocus
                />
              </div>
            </div>

            {/* Lista de categorías y plantillas */}
            <div className="flex-1 overflow-y-auto p-4">
              {loadingCatalogo ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-elio-yellow"></div>
                </div>
              ) : (
                <div className="space-y-2">
                  {categorias.map(categoria => {
                    const plantillasFiltradas = filtrarPlantillas(categoria.plantillas || []);
                    const isExpanded = categoriaExpandida === categoria.id || busquedaCatalogo.length > 0;
                    
                    if (busquedaCatalogo && plantillasFiltradas.length === 0) return null;

                    return (
                      <div key={categoria.id} className="border border-gray-200 rounded-lg overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setCategoriaExpandida(isExpanded && !busquedaCatalogo ? null : categoria.id)}
                          className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: categoria.color }}
                            />
                            <span className="font-medium text-gray-800">{categoria.nombre}</span>
                            <span className="text-xs text-gray-400">({plantillasFiltradas.length})</span>
                          </div>
                          <ChevronDown 
                            size={18} 
                            className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                          />
                        </button>

                        {isExpanded && plantillasFiltradas.length > 0 && (
                          <div className="border-t border-gray-100 divide-y divide-gray-50">
                            {plantillasFiltradas.map(plantilla => (
                              <button
                                key={plantilla.id}
                                type="button"
                                onClick={() => aplicarPlantilla(plantilla)}
                                className="w-full text-left p-3 hover:bg-yellow-50 transition-colors"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                                    {plantilla.codigo}
                                  </span>
                                  <span className="font-medium text-gray-700">{plantilla.nombre}</span>
                                  {plantilla.esRecurrente && (
                                    <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">
                                      Recurrente
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                  <span className="flex items-center gap-1">
                                    <Clock size={10} /> {plantilla.tiempoEstimado}h
                                  </span>
                                  {plantilla.rolSugeridoTipo && (
                                    <span>Rol: {plantilla.rolSugeridoTipo}</span>
                                  )}
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => { setShowCatalogo(false); setBusquedaCatalogo(''); }}
                className="w-full py-2 text-gray-500 hover:bg-gray-100 rounded-lg text-sm font-medium"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1. Context */}
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
             <span className="flex items-center"><Briefcase size={12} className="mr-1"/> Proyecto <span className="text-red-500 ml-1">*</span></span>
          </label>
          <select
            value={formData.proyectoId}
            onChange={(e) => setFormData({...formData, proyectoId: e.target.value})}
            className={`w-full px-3 py-2 border rounded-lg bg-gray-50 focus:bg-white transition-all outline-none ${errors.proyectoId ? 'border-red-300' : 'border-gray-200'}`}
          >
            <option value="">Selecciona proyecto...</option>
            {proyectos.map(p => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </select>
          {errors.proyectoId && <p className="text-xs text-red-500 mt-1">{errors.proyectoId}</p>}
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
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Descripción</label>
          <textarea
            placeholder="Descripción de la tarea..."
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            rows={2}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-elio-yellow resize-none"
          />
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
        
        {isRecurring && (
          <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-yellow-200/50 animate-in fade-in slide-in-from-top-1">
             <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Frecuencia</label>
                <select 
                  className="w-full px-3 py-2 border border-yellow-200 rounded-lg outline-none bg-white"
                  value={formData.recurrenceFrequency}
                  onChange={(e) => setFormData({...formData, recurrenceFrequency: e.target.value})}
                >
                  <option value="DAILY">Diario</option>
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
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Asignado a</label>
          <select
            value={formData.assigneeId}
            onChange={(e) => setFormData({...formData, assigneeId: e.target.value})}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none"
          >
            <option value="">Sin asignar</option>
            {usuarios.map(u => (
              <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
            ))}
          </select>
        </div>
        <div className="col-span-2">
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
            <span className="flex items-center"><Calendar size={12} className="mr-1"/> Deadline</span>
          </label>
          <input
            type="date"
            value={formData.dueDate}
            onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none"
          />
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