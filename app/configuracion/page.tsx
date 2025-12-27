'use client';
import React, { useState, useEffect } from 'react';
import { 
  Users, Briefcase, Plus, X, Trash2, Edit2, Shield, Mail, User,
  Clock, Search, ChevronDown, ChevronRight, Save, Loader2
} from 'lucide-react';
import { Badge } from '../../components/ui/Badge';

// --- INTERFACES ---
interface CategoriaServicio {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  color: string;
  icono: string | null;
  orden: number;
  activo: boolean;
  plantillas?: PlantillaTarea[];
}

interface PlantillaTarea {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  categoriaId: string;
  categoria?: CategoriaServicio;
  rolSugeridoTipo: string | null;
  tiempoEstimado: number;
  esRecurrente: boolean;
  frecuencia: string | null;
  activo: boolean;
  orden: number;
}

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
}

const ROLES_DISPONIBLES = [
  { value: 'ADMIN', label: 'Administrador' },
  { value: 'MANAGER', label: 'Responsable' },
  { value: 'SEO', label: 'SEO/SEM' },
  { value: 'DESIGNER', label: 'Diseñador' },
  { value: 'DEV', label: 'Desarrollador' },
  { value: 'COPY', label: 'Redactor' },
  { value: 'AV', label: 'Audiovisual' },
];

export default function ConfiguracionPage() {
  const [activeTab, setActiveTab] = useState<'equipo' | 'servicios'>('equipo');
  
  // Estado Equipo
  const [users, setUsers] = useState<UserData[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  
  // Estado Catálogo
  const [categorias, setCategorias] = useState<CategoriaServicio[]>([]);
  const [loadingCatalogo, setLoadingCatalogo] = useState(true);
  const [categoriaExpandida, setCategoriaExpandida] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');
  
  // Modales
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isPlantillaModalOpen, setIsPlantillaModalOpen] = useState(false);
  const [isCategoriaModalOpen, setIsCategoriaModalOpen] = useState(false);
  
  // Formularios
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [userForm, setUserForm] = useState({ name: '', email: '', role: 'DEV' });
  
  const [editingPlantilla, setEditingPlantilla] = useState<PlantillaTarea | null>(null);
  const [plantillaForm, setPlantillaForm] = useState({
    codigo: '',
    nombre: '',
    descripcion: '',
    categoriaId: '',
    rolSugeridoTipo: 'DEV',
    tiempoEstimado: 1,
    esRecurrente: false,
    frecuencia: ''
  });

  const [saving, setSaving] = useState(false);

  // --- CARGAR DATOS ---
  useEffect(() => {
    fetchUsers();
    fetchCatalogo();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/usuarios');
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Error cargando usuarios:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchCatalogo = async () => {
    try {
      const res = await fetch('/api/catalogo?tipo=categorias');
      if (res.ok) {
        const data = await res.json();
        setCategorias(data);
      }
    } catch (error) {
      console.error('Error cargando catálogo:', error);
    } finally {
      setLoadingCatalogo(false);
    }
  };

  // --- HANDLERS USUARIOS ---
  const openCreateUserModal = () => {
    setEditingUserId(null);
    setUserForm({ name: '', email: '', role: 'DEV' });
    setIsUserModalOpen(true);
  };

  const openEditUserModal = (user: UserData) => {
    setEditingUserId(user.id);
    setUserForm({ name: user.name, email: user.email, role: user.role });
    setIsUserModalOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userForm.name || !userForm.email) return;
    setSaving(true);

    try {
      if (editingUserId) {
        await fetch(`/api/usuarios/${editingUserId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(userForm)
        });
      } else {
        await fetch('/api/usuarios', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(userForm)
        });
      }
      await fetchUsers();
      setIsUserModalOpen(false);
    } catch (error) {
      console.error('Error guardando usuario:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!window.confirm('¿Estás seguro de eliminar este usuario?')) return;
    try {
      await fetch(`/api/usuarios/${id}`, { method: 'DELETE' });
      await fetchUsers();
    } catch (error) {
      console.error('Error eliminando usuario:', error);
    }
  };

  // --- HANDLERS PLANTILLAS ---
  const openCreatePlantillaModal = (categoriaId?: string) => {
    setEditingPlantilla(null);
    setPlantillaForm({
      codigo: '',
      nombre: '',
      descripcion: '',
      categoriaId: categoriaId || (categorias[0]?.id || ''),
      rolSugeridoTipo: 'DEV',
      tiempoEstimado: 1,
      esRecurrente: false,
      frecuencia: ''
    });
    setIsPlantillaModalOpen(true);
  };

  const openEditPlantillaModal = (plantilla: PlantillaTarea) => {
    setEditingPlantilla(plantilla);
    setPlantillaForm({
      codigo: plantilla.codigo,
      nombre: plantilla.nombre,
      descripcion: plantilla.descripcion || '',
      categoriaId: plantilla.categoriaId,
      rolSugeridoTipo: plantilla.rolSugeridoTipo || 'DEV',
      tiempoEstimado: plantilla.tiempoEstimado,
      esRecurrente: plantilla.esRecurrente,
      frecuencia: plantilla.frecuencia || ''
    });
    setIsPlantillaModalOpen(true);
  };

  const handleSavePlantilla = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plantillaForm.nombre || !plantillaForm.categoriaId) return;
    setSaving(true);

    try {
      if (editingPlantilla) {
        await fetch(`/api/catalogo?tipo=plantillas&id=${editingPlantilla.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(plantillaForm)
        });
      } else {
        await fetch('/api/catalogo?tipo=plantillas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(plantillaForm)
        });
      }
      await fetchCatalogo();
      setIsPlantillaModalOpen(false);
    } catch (error) {
      console.error('Error guardando plantilla:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePlantilla = async (id: string) => {
    if (!window.confirm('¿Desactivar esta plantilla de tarea?')) return;
    try {
      await fetch(`/api/catalogo?tipo=plantillas&id=${id}`, { method: 'DELETE' });
      await fetchCatalogo();
    } catch (error) {
      console.error('Error eliminando plantilla:', error);
    }
  };

  // --- FILTRAR PLANTILLAS ---
  const filtrarPlantillas = (plantillas: PlantillaTarea[] | undefined) => {
    if (!plantillas) return [];
    if (!busqueda) return plantillas;
    const query = busqueda.toLowerCase();
    return plantillas.filter(p => 
      p.nombre.toLowerCase().includes(query) || 
      p.codigo.toLowerCase().includes(query) ||
      p.descripcion?.toLowerCase().includes(query)
    );
  };

  const totalPlantillas = categorias.reduce((acc, cat) => acc + (cat.plantillas?.length || 0), 0);

  // --- RENDER ---
  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Configuración del Sistema</h1>
      
      {/* TABS */}
      <div className="flex gap-6 border-b border-slate-200 mb-8">
        <button 
          onClick={() => setActiveTab('equipo')} 
          className={`pb-4 px-2 font-medium flex items-center gap-2 transition-colors ${activeTab === 'equipo' ? 'text-slate-900 border-b-2 border-yellow-400' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <Users size={18} /> Miembros del Equipo
        </button>
        <button 
          onClick={() => setActiveTab('servicios')} 
          className={`pb-4 px-2 font-medium flex items-center gap-2 transition-colors ${activeTab === 'servicios' ? 'text-slate-900 border-b-2 border-yellow-400' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <Briefcase size={18} /> Catálogo Servicios
        </button>
      </div>

      {/* TAB EQUIPO */}
      {activeTab === 'equipo' && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex justify-between mb-6">
            <h3 className="font-bold text-lg text-slate-800">Usuarios Activos ({users.length})</h3>
            <button 
              onClick={openCreateUserModal}
              className="text-sm bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 flex items-center gap-2 font-medium transition-all shadow-md active:scale-95"
            >
              <Plus size={16} /> Crear Usuario
            </button>
          </div>
          
          {loadingUsers ? (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin text-yellow-500" size={32} />
            </div>
          ) : (
            <div className="space-y-3">
              {users.length > 0 ? users.map(user => (
                <div key={user.id} className="flex flex-col sm:flex-row justify-between sm:items-center p-4 bg-slate-50 rounded-lg border border-slate-100 hover:border-slate-300 transition-colors group">
                  <div className="flex items-center gap-4 mb-3 sm:mb-0">
                    <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center font-bold text-sm text-slate-900 border-2 border-white shadow-sm">
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-slate-900 group-hover:text-blue-700 transition-colors">{user.name}</p>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                        <span className="flex items-center gap-1"><Shield size={10} /> {user.role}</span>
                        <span className="flex items-center gap-1"><Mail size={10} /> {user.email}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button 
                      onClick={() => openEditUserModal(user)} 
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                      title="Editar Usuario"
                    >
                      <Edit2 size={18}/>
                    </button>
                    <button 
                      onClick={() => handleDeleteUser(user.id)} 
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      title="Eliminar Usuario"
                    >
                      <Trash2 size={18}/>
                    </button>
                  </div>
                </div>
              )) : (
                <div className="text-center py-10 text-slate-400 italic">No hay usuarios registrados.</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB CATÁLOGO SERVICIOS */}
      {activeTab === 'servicios' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
          {/* Header con búsqueda y botón */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <div>
                <h3 className="font-bold text-lg text-slate-800">Catálogo de Tareas</h3>
                <p className="text-sm text-slate-500">{categorias.length} categorías · {totalPlantillas} plantillas</p>
              </div>
              <div className="flex gap-3">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar tarea..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm w-64 focus:outline-none focus:border-slate-400"
                  />
                </div>
                <button 
                  onClick={() => openCreatePlantillaModal()}
                  className="text-sm bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 flex items-center gap-2 font-medium"
                >
                  <Plus size={16} /> Nueva Tarea
                </button>
              </div>
            </div>
          </div>

          {/* Lista de categorías con plantillas */}
          {loadingCatalogo ? (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin text-yellow-500" size={32} />
            </div>
          ) : (
            <div className="space-y-4">
              {categorias.map(categoria => {
                const plantillasFiltradas = filtrarPlantillas(categoria.plantillas);
                const isExpanded = categoriaExpandida === categoria.id || busqueda.length > 0;
                
                if (busqueda && plantillasFiltradas.length === 0) return null;
                
                return (
                  <div key={categoria.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    {/* Cabecera de categoría */}
                    <button
                      onClick={() => setCategoriaExpandida(isExpanded && !busqueda ? null : categoria.id)}
                      className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: categoria.color }}
                        />
                        <div className="text-left">
                          <span className="font-bold text-slate-800">{categoria.nombre}</span>
                          <span className="text-xs text-slate-400 ml-2">({categoria.codigo})</span>
                        </div>
                        <Badge variant="neutral">{plantillasFiltradas.length} tareas</Badge>
                      </div>
                      {isExpanded ? <ChevronDown size={20} className="text-slate-400" /> : <ChevronRight size={20} className="text-slate-400" />}
                    </button>

                    {/* Lista de plantillas */}
                    {isExpanded && (
                      <div className="border-t border-slate-100">
                        {plantillasFiltradas.length === 0 ? (
                          <p className="text-center py-6 text-slate-400 text-sm">No hay tareas en esta categoría</p>
                        ) : (
                          <div className="divide-y divide-slate-50">
                            {plantillasFiltradas.map(plantilla => (
                              <div key={plantilla.id} className="flex items-center justify-between p-4 hover:bg-slate-50 group">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                                      {plantilla.codigo}
                                    </span>
                                    <span className="font-medium text-slate-800">{plantilla.nombre}</span>
                                    {plantilla.esRecurrente && (
                                      <Badge variant="blue">Recurrente</Badge>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-4 mt-1 text-xs text-slate-500">
                                    <span className="flex items-center gap-1">
                                      <Clock size={12} /> {plantilla.tiempoEstimado}h
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <User size={12} /> {plantilla.rolSugeridoTipo || 'Sin asignar'}
                                    </span>
                                    {plantilla.descripcion && (
                                      <span className="text-slate-400 truncate max-w-md">
                                        {plantilla.descripcion}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button 
                                    onClick={() => openEditPlantillaModal(plantilla)}
                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                                  >
                                    <Edit2 size={16} />
                                  </button>
                                  <button 
                                    onClick={() => handleDeletePlantilla(plantilla.id)}
                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        {/* Botón añadir tarea a esta categoría */}
                        <button
                          onClick={() => openCreatePlantillaModal(categoria.id)}
                          className="w-full p-3 text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-2 border-t border-slate-100"
                        >
                          <Plus size={16} /> Añadir tarea a {categoria.nombre}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* MODAL: USUARIO */}
      {isUserModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
              <h3 className="font-bold text-lg text-slate-800">
                {editingUserId ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
              </h3>
              <button onClick={() => setIsUserModalOpen(false)}><X size={20} className="text-slate-400 hover:text-slate-600"/></button>
            </div>
            
            <form onSubmit={handleSaveUser} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nombre Completo *</label>
                <input 
                  autoFocus 
                  type="text" 
                  className="w-full border border-slate-200 p-2.5 rounded-lg text-sm" 
                  required 
                  value={userForm.name} 
                  onChange={e => setUserForm({...userForm, name: e.target.value})} 
                  placeholder="Ej: Juan Pérez"
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email *</label>
                <input 
                  type="email" 
                  className="w-full border border-slate-200 p-2.5 rounded-lg text-sm" 
                  required 
                  value={userForm.email} 
                  onChange={e => setUserForm({...userForm, email: e.target.value})} 
                  placeholder="nombre@elio.com"
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Rol</label>
                <select 
                  className="w-full border border-slate-200 p-2.5 rounded-lg text-sm bg-white" 
                  value={userForm.role} 
                  onChange={e => setUserForm({...userForm, role: e.target.value})}
                >
                  {ROLES_DISPONIBLES.map(rol => (
                    <option key={rol.value} value={rol.value}>{rol.label}</option>
                  ))}
                </select>
              </div>
              
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsUserModalOpen(false)} className="flex-1 py-2 text-slate-500 font-bold hover:bg-slate-100 rounded-lg text-sm">
                  Cancelar
                </button>
                <button type="submit" disabled={saving} className="flex-1 py-2 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800 text-sm flex items-center justify-center gap-2">
                  {saving && <Loader2 size={16} className="animate-spin" />}
                  {editingUserId ? 'Guardar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: PLANTILLA DE TAREA */}
      {isPlantillaModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
              <h3 className="font-bold text-lg text-slate-800">
                {editingPlantilla ? 'Editar Tarea' : 'Nueva Tarea'}
              </h3>
              <button onClick={() => setIsPlantillaModalOpen(false)}><X size={20} className="text-slate-400 hover:text-slate-600"/></button>
            </div>
            
            <form onSubmit={handleSavePlantilla} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Código *</label>
                  <input 
                    type="text" 
                    className="w-full border border-slate-200 p-2.5 rounded-lg text-sm font-mono" 
                    required 
                    value={plantillaForm.codigo} 
                    onChange={e => setPlantillaForm({...plantillaForm, codigo: e.target.value.toUpperCase()})} 
                    placeholder="SEO-011"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Categoría *</label>
                  <select 
                    className="w-full border border-slate-200 p-2.5 rounded-lg text-sm bg-white" 
                    required
                    value={plantillaForm.categoriaId} 
                    onChange={e => setPlantillaForm({...plantillaForm, categoriaId: e.target.value})}
                  >
                    <option value="">Seleccionar...</option>
                    {categorias.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nombre de la Tarea *</label>
                <input 
                  type="text" 
                  className="w-full border border-slate-200 p-2.5 rounded-lg text-sm" 
                  required 
                  value={plantillaForm.nombre} 
                  onChange={e => setPlantillaForm({...plantillaForm, nombre: e.target.value})} 
                  placeholder="Ej: Auditoría SEO Completa"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Descripción</label>
                <textarea 
                  className="w-full border border-slate-200 p-2.5 rounded-lg text-sm resize-none" 
                  rows={2}
                  value={plantillaForm.descripcion} 
                  onChange={e => setPlantillaForm({...plantillaForm, descripcion: e.target.value})} 
                  placeholder="Descripción breve de la tarea..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Rol Sugerido</label>
                  <select 
                    className="w-full border border-slate-200 p-2.5 rounded-lg text-sm bg-white" 
                    value={plantillaForm.rolSugeridoTipo} 
                    onChange={e => setPlantillaForm({...plantillaForm, rolSugeridoTipo: e.target.value})}
                  >
                    {ROLES_DISPONIBLES.map(rol => (
                      <option key={rol.value} value={rol.value}>{rol.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tiempo Estimado (h)</label>
                  <input 
                    type="number" 
                    step="0.5"
                    min="0.5"
                    className="w-full border border-slate-200 p-2.5 rounded-lg text-sm" 
                    value={plantillaForm.tiempoEstimado} 
                    onChange={e => setPlantillaForm({...plantillaForm, tiempoEstimado: parseFloat(e.target.value) || 1})} 
                  />
                </div>
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={plantillaForm.esRecurrente}
                    onChange={e => setPlantillaForm({...plantillaForm, esRecurrente: e.target.checked})}
                    className="rounded border-slate-300"
                  />
                  <span className="text-sm text-slate-700">Tarea recurrente</span>
                </label>
                {plantillaForm.esRecurrente && (
                  <select 
                    className="border border-slate-200 p-2 rounded-lg text-sm bg-white" 
                    value={plantillaForm.frecuencia} 
                    onChange={e => setPlantillaForm({...plantillaForm, frecuencia: e.target.value})}
                  >
                    <option value="">Frecuencia...</option>
                    <option value="DIARIO">Diario</option>
                    <option value="SEMANAL">Semanal</option>
                    <option value="MENSUAL">Mensual</option>
                    <option value="TRIMESTRAL">Trimestral</option>
                  </select>
                )}
              </div>
              
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsPlantillaModalOpen(false)} className="flex-1 py-2 text-slate-500 font-bold hover:bg-slate-100 rounded-lg text-sm">
                  Cancelar
                </button>
                <button type="submit" disabled={saving} className="flex-1 py-2 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800 text-sm flex items-center justify-center gap-2">
                  {saving && <Loader2 size={16} className="animate-spin" />}
                  {editingPlantilla ? 'Guardar Cambios' : 'Crear Tarea'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}