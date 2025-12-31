'use client';
import React, { useState } from 'react';
import { Users, Briefcase, Plus, X, Trash2, Edit2, Shield, Mail, User } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';

// --- MOCK INICIAL ---
interface UserData {
  id: number;
  name: string;
  email: string;
  role: string;
}

const INITIAL_USERS: UserData[] = [
  { id: 1, name: 'Alejandro Magno', email: 'alex@elio.com', role: 'SuperAdmin' },
  { id: 2, name: 'Elena Nito', email: 'elena@elio.com', role: 'Admin' },
  { id: 3, name: 'Aitor Tilla', email: 'aitor@elio.com', role: 'Usuario' },
];

const INITIAL_SERVICES = [
  { id: 1, name: 'Consultoría SEO', price: '65.00' },
  { id: 2, name: 'Desarrollo Web', price: '55.00' },
];

export default function ConfiguracionPage() {
  const [activeTab, setActiveTab] = useState<'equipo' | 'servicios'>('equipo');
  
  // Data State
  const [users, setUsers] = useState<UserData[]>(INITIAL_USERS);
  const [services, setServices] = useState(INITIAL_SERVICES);

  // Modal State
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);

  // Form State (Editing)
  const [editingUserId, setEditingUserId] = useState<number | null>(null); // Null means Creating
  const [userForm, setUserForm] = useState({ name: '', email: '', role: 'Usuario' });
  const [serviceForm, setServiceForm] = useState({ name: '', price: '' });

  // --- USER HANDLERS ---
  
  const openCreateUserModal = () => {
    setEditingUserId(null); // Create Mode
    setUserForm({ name: '', email: '', role: 'Usuario' }); // Reset
    setIsUserModalOpen(true);
  };

  const openEditUserModal = (user: UserData) => {
    setEditingUserId(user.id); // Edit Mode
    setUserForm({ name: user.name, email: user.email, role: user.role });
    setIsUserModalOpen(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userForm.name || !userForm.email) return;
    
    if (editingUserId) {
        // UPDATE EXISTING
        setUsers(users.map(u => u.id === editingUserId ? { ...u, ...userForm } : u));
    } else {
        // CREATE NEW
        const newUser = { id: Date.now(), ...userForm };
        setUsers([...users, newUser]);
    }
    
    setIsUserModalOpen(false);
  };

  const handleDeleteUser = (id: number) => {
    const confirmDelete = window.confirm('¿Estás seguro de que deseas eliminar este usuario?');
    if (confirmDelete) {
      setUsers(users.filter(u => u.id !== id));
    }
  };

  // --- SERVICE HANDLERS ---

  const handleAddService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceForm.name || !serviceForm.price) return;
    
    setServices([...services, { id: Date.now(), ...serviceForm }]);
    setServiceForm({ name: '', price: '' });
    setIsServiceModalOpen(false);
  };

  const handleDeleteService = (id: number) => {
      setServices(services.filter(s => s.id !== id));
  };

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
        </div>
      )}

      {/* TAB SERVICIOS */}
      {activeTab === 'servicios' && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 animate-in fade-in slide-in-from-bottom-2">
           <div className="flex justify-between mb-6">
            <h3 className="font-bold text-lg text-slate-800">Tarifas Vigentes</h3>
            <button 
              onClick={() => setIsServiceModalOpen(true)}
              className="text-sm bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 flex items-center gap-2 font-medium transition-all shadow-md"
            >
              <Plus size={16} /> Crear Servicio
            </button>
          </div>
           
           <div className="overflow-x-auto">
             <table className="w-full text-left">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-y border-slate-100">
                   <tr>
                      <th className="px-4 py-3">Concepto</th>
                      <th className="px-4 py-3">Tarifa / Hora</th>
                      <th className="px-4 py-3 text-right">Acciones</th>
                   </tr>
                </thead>
                <tbody>
                   {services.map(svc => (
                      <tr key={svc.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                         <td className="px-4 py-3 font-medium text-slate-900">{svc.name}</td>
                         <td className="px-4 py-3 font-mono text-slate-600 font-bold">{svc.price} €</td>
                         <td className="px-4 py-3 text-right">
                            <button onClick={() => handleDeleteService(svc.id)} className="text-slate-300 hover:text-red-500 p-1.5 hover:bg-red-50 rounded transition-all">
                              <Trash2 size={16} />
                            </button>
                         </td>
                      </tr>
                   ))}
                </tbody>
             </table>
           </div>
        </div>
      )}

      {/* MODAL: USUARIO (CREATE/EDIT) */}
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
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nombre Completo <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <User className="absolute left-3 top-2.5 text-slate-400" size={16}/>
                      <input 
                        autoFocus 
                        type="text" 
                        className="w-full border border-slate-200 pl-10 p-2.5 rounded-lg focus:outline-none focus:border-slate-400 transition-all text-sm" 
                        required 
                        value={userForm.name} 
                        onChange={e => setUserForm({...userForm, name: e.target.value})} 
                        placeholder="Ej: Juan Pérez"
                      />
                    </div>
                 </div>
                 
                 <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email Corporativo <span className="text-red-500">*</span></label>
                    <div className="relative">
                       <Mail className="absolute left-3 top-2.5 text-slate-400" size={16}/>
                       <input 
                         type="email" 
                         className="w-full border border-slate-200 pl-10 p-2.5 rounded-lg focus:outline-none focus:border-slate-400 transition-all text-sm" 
                         required 
                         value={userForm.email} 
                         onChange={e => setUserForm({...userForm, email: e.target.value})} 
                         placeholder="nombre@elio.com"
                       />
                    </div>
                 </div>
                 
                 <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Rol de Acceso</label>
                    <div className="relative">
                       <Shield className="absolute left-3 top-2.5 text-slate-400" size={16}/>
                       <select 
                         className="w-full border border-slate-200 pl-10 p-2.5 rounded-lg focus:outline-none focus:border-slate-400 transition-all text-sm bg-white appearance-none" 
                         value={userForm.role} 
                         onChange={e => setUserForm({...userForm, role: e.target.value})}
                       >
                          <option value="Usuario">Usuario</option>
                          <option value="Admin">Admin</option>
                          <option value="SuperAdmin">SuperAdmin</option>
                       </select>
                    </div>
                 </div>
                 
                 <div className="pt-4 flex gap-3">
                     <button type="button" onClick={() => setIsUserModalOpen(false)} className="flex-1 py-2 text-slate-500 font-bold hover:bg-slate-100 rounded-lg text-sm">Cancelar</button>
                     <button type="submit" className="flex-1 py-2 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800 text-sm shadow-lg shadow-slate-900/20">
                       {editingUserId ? 'Guardar Cambios' : 'Crear Usuario'}
                     </button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {/* MODAL: SERVICIO */}
      {isServiceModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
           <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md animate-in zoom-in-95">
              <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                 <h3 className="font-bold text-lg text-slate-800">Nuevo Servicio</h3>
                 <button onClick={() => setIsServiceModalOpen(false)}><X size={20} className="text-slate-400 hover:text-slate-600"/></button>
              </div>
              <form onSubmit={handleAddService} className="space-y-4">
                 <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nombre del Servicio</label>
                    <input autoFocus type="text" className="w-full border border-slate-200 p-2.5 rounded-lg text-sm" required value={serviceForm.name} onChange={e => setServiceForm({...serviceForm, name: e.target.value})} placeholder="Ej: Mantenimiento Wordpress" />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Precio Hora (€)</label>
                    <input type="number" className="w-full border border-slate-200 p-2.5 rounded-lg text-sm" required value={serviceForm.price} onChange={e => setServiceForm({...serviceForm, price: e.target.value})} placeholder="0.00" />
                 </div>
                 <button type="submit" className="w-full bg-slate-900 text-white py-2.5 rounded-lg font-bold hover:bg-slate-800 mt-4 text-sm">Guardar Servicio</button>
              </form>
           </div>
        </div>
      )}

    </div>
  );
}