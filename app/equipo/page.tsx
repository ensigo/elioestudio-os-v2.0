import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { 
  Users, 
  Clock, 
  Calendar, 
  ArrowLeft, 
  Briefcase, 
  Mail, 
  Shield, 
  CheckCircle2, 
  AlertCircle,
  TrendingUp,
  Plus,
  X,
  Key,
  Eye,
  EyeOff,
  Trash2,
  Edit3
} from 'lucide-react';

interface Usuario {
  id: string;
  name: string;
  email: string;
  role: string;
  position: string | null;
  avatarUrl: string | null;
  joinDate: string;
}

export const TeamPage = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<Usuario | null>(null);
  
  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'DEV',
    position: ''
  });
  
  // Password states
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });
  const [isSettingPassword, setIsSettingPassword] = useState(false);

  // Cargar usuarios
  useEffect(() => {
    fetchUsuarios();
  }, []);

  const fetchUsuarios = async () => {
    try {
      const response = await fetch('/api/usuarios');
      if (response.ok) {
        const data = await response.json();
        setUsuarios(data);
      }
    } catch (err) {
      console.error('Error cargando usuarios:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Crear usuario
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const nuevoUsuario = await response.json();
        setUsuarios([...usuarios, nuevoUsuario]);
        setIsCreateModalOpen(false);
        setFormData({ name: '', email: '', role: 'DEV', position: '' });
      }
    } catch (err) {
      console.error('Error creando usuario:', err);
    }
  };

  // Actualizar usuario
  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      const response = await fetch('/api/usuarios', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedUser.id, ...formData })
      });

      if (response.ok) {
        const usuarioActualizado = await response.json();
        setUsuarios(usuarios.map(u => u.id === usuarioActualizado.id ? usuarioActualizado : u));
        setSelectedUser(usuarioActualizado);
        setIsEditModalOpen(false);
      }
    } catch (err) {
      console.error('Error actualizando usuario:', err);
    }
  };

  // Eliminar usuario
  const handleDeleteUser = async (userId: string) => {
    if (!confirm('¿Estás seguro de eliminar este usuario?')) return;

    try {
      const response = await fetch('/api/usuarios', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId })
      });

      if (response.ok) {
        setUsuarios(usuarios.filter(u => u.id !== userId));
        setSelectedUser(null);
      }
    } catch (err) {
      console.error('Error eliminando usuario:', err);
    }
  };

  // Establecer contraseña
  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !newPassword) return;

    setIsSettingPassword(true);
    setPasswordMessage({ type: '', text: '' });

    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'set-password',
          targetUserId: selectedUser.id,
          targetPassword: newPassword,
          adminRole: 'SUPERADMIN' // Asumimos que quien accede es admin
        })
      });

      const data = await response.json();

      if (response.ok) {
        setPasswordMessage({ type: 'success', text: 'Contraseña establecida correctamente' });
        setNewPassword('');
        setTimeout(() => {
          setIsPasswordModalOpen(false);
          setPasswordMessage({ type: '', text: '' });
        }, 2000);
      } else {
        setPasswordMessage({ type: 'error', text: data.error || 'Error al establecer contraseña' });
      }
    } catch (err) {
      setPasswordMessage({ type: 'error', text: 'Error de conexión' });
    }

    setIsSettingPassword(false);
  };

  const openEditModal = (user: Usuario) => {
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      position: user.position || ''
    });
    setIsEditModalOpen(true);
  };

  const openPasswordModal = (user: Usuario) => {
    setSelectedUser(user);
    setNewPassword('');
    setPasswordMessage({ type: '', text: '' });
    setIsPasswordModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <p className="text-xl text-elio-yellow animate-pulse">Cargando equipo...</p>
      </div>
    );
  }

  // --- VISTA: DETALLE DE EMPLEADO ---
  if (selectedUser && !isEditModalOpen && !isPasswordModalOpen) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
        {/* Navigation Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setSelectedUser(null)}
              className="p-2 hover:bg-white rounded-full transition-colors text-slate-500 shadow-sm border border-transparent hover:border-slate-200"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Ficha de Empleado</h1>
              <p className="text-slate-500 text-sm">Detalles y gestión de acceso.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => openEditModal(selectedUser)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
            >
              <Edit3 size={16} /> Editar
            </button>
            <button
              onClick={() => handleDeleteUser(selectedUser.id)}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
            >
              <Trash2 size={16} /> Eliminar
            </button>
          </div>
        </div>

        {/* Profile Header Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center space-x-6">
              <div className="w-20 h-20 rounded-full bg-elio-yellow text-white flex items-center justify-center text-3xl font-bold shadow-lg">
                {selectedUser.name.charAt(0)}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">{selectedUser.name}</h2>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge variant="blue">{selectedUser.position || 'Sin cargo'}</Badge>
                  <Badge variant="neutral">{selectedUser.role}</Badge>
                </div>
                <div className="flex items-center gap-4 mt-3 text-sm text-slate-500">
                  <span className="flex items-center"><Mail size={14} className="mr-1"/> {selectedUser.email}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Acciones */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card title="Gestión de Acceso">
            <div className="space-y-3">
              <button 
                onClick={() => openPasswordModal(selectedUser)}
                className="w-full text-left px-4 py-3 bg-elio-yellow/10 hover:bg-elio-yellow/20 border border-elio-yellow/30 rounded-lg text-sm font-medium transition-all text-slate-700 flex items-center"
              >
                <Key size={16} className="mr-3 text-elio-yellow"/> Establecer / Cambiar Contraseña
              </button>
              <button className="w-full text-left px-4 py-3 bg-slate-50 hover:bg-white border border-slate-100 hover:border-slate-300 rounded-lg text-sm font-medium transition-all text-slate-700 flex items-center">
                <Shield size={16} className="mr-3 text-slate-400"/> Editar Permisos
              </button>
            </div>
          </Card>

          <Card title="Información">
            <div className="space-y-4">
              <div>
                <p className="text-xs text-slate-400 uppercase font-bold mb-1">Email</p>
                <p className="text-sm font-medium text-slate-700">{selectedUser.email}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase font-bold mb-1">Rol</p>
                <p className="text-sm font-medium text-slate-700">{selectedUser.role}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase font-bold mb-1">Cargo</p>
                <p className="text-sm font-medium text-slate-700">{selectedUser.position || 'No definido'}</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // --- VISTA: LISTA DE EQUIPO ---
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Directorio de Equipo</h1>
          <p className="text-slate-500 text-sm">Gestión de personal y accesos.</p>
        </div>
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-elio-black text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors flex items-center space-x-2 text-sm font-bold shadow-sm"
        >
          <Plus size={16} />
          <span>Añadir Miembro</span>
        </button>
      </div>

      {usuarios.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
          <Users size={48} className="mx-auto mb-4 text-slate-300" />
          <p className="text-slate-500">No hay miembros en el equipo</p>
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="mt-4 text-elio-yellow font-medium hover:underline"
          >
            Añadir el primero
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {usuarios.map(user => (
            <div 
              key={user.id} 
              className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg hover:border-elio-yellow/50 transition-all cursor-pointer group relative overflow-hidden"
            >
              <div 
                className="absolute inset-0"
                onClick={() => setSelectedUser(user)}
              ></div>

              <div className="flex items-center space-x-4 mb-4">
                <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-xl font-bold text-slate-600 group-hover:bg-elio-yellow group-hover:text-white transition-colors">
                  {user.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{user.name}</h3>
                  <p className="text-xs text-slate-500 uppercase font-medium">{user.role}</p>
                </div>
              </div>

              <div className="space-y-2 border-t border-slate-50 pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Cargo</span>
                  <span className="font-medium text-slate-900">{user.position || '-'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Email</span>
                  <span className="font-medium text-slate-900 truncate max-w-[150px]">{user.email}</span>
                </div>
              </div>
              
              <div className="mt-4 pt-3 relative z-10">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openPasswordModal(user);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-slate-100 hover:bg-elio-yellow hover:text-white rounded-lg text-xs font-bold text-slate-600 transition-colors"
                >
                  <Key size={14} /> Establecer Contraseña
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Crear Usuario */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-gray-50">
              <h3 className="font-bold text-lg text-gray-900">Nuevo Miembro</h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20}/>
              </button>
            </div>
            
            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Nombre *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-elio-yellow/50"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-elio-yellow/50"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Rol *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-elio-yellow/50"
                >
                  <option value="DEV">Desarrollador</option>
                  <option value="DESIGNER">Diseñador</option>
                  <option value="PM">Project Manager</option>
                  <option value="ADMIN">Administrador</option>
                  <option value="SUPERADMIN">Super Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Cargo</label>
                <input
                  type="text"
                  value={formData.position}
                  onChange={(e) => setFormData({...formData, position: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-elio-yellow/50"
                  placeholder="Ej: Frontend Developer"
                />
              </div>

              <div className="pt-4 flex justify-end gap-2">
                <button 
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-elio-yellow text-white rounded-lg text-sm font-bold hover:bg-elio-yellow-hover"
                >
                  Crear Usuario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar Usuario */}
      {isEditModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-gray-50">
              <h3 className="font-bold text-lg text-gray-900">Editar Miembro</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20}/>
              </button>
            </div>
            
            <form onSubmit={handleUpdateUser} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Nombre *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-elio-yellow/50"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-elio-yellow/50"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Rol *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-elio-yellow/50"
                >
                  <option value="DEV">Desarrollador</option>
                  <option value="DESIGNER">Diseñador</option>
                  <option value="PM">Project Manager</option>
                  <option value="ADMIN">Administrador</option>
                  <option value="SUPERADMIN">Super Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Cargo</label>
                <input
                  type="text"
                  value={formData.position}
                  onChange={(e) => setFormData({...formData, position: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-elio-yellow/50"
                  placeholder="Ej: Frontend Developer"
                />
              </div>

              <div className="pt-4 flex justify-end gap-2">
                <button 
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-elio-yellow text-white rounded-lg text-sm font-bold hover:bg-elio-yellow-hover"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Establecer Contraseña */}
      {isPasswordModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-gray-50">
              <h3 className="font-bold text-lg text-gray-900">Establecer Contraseña</h3>
              <button onClick={() => setIsPasswordModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20}/>
              </button>
            </div>
            
            <form onSubmit={handleSetPassword} className="p-6 space-y-4">
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  Estableciendo contraseña para: <strong>{selectedUser.name}</strong>
                </p>
                <p className="text-xs text-blue-600 mt-1">{selectedUser.email}</p>
              </div>

              {passwordMessage.text && (
                <div className={`p-3 rounded-lg flex items-center gap-2 text-sm ${
                  passwordMessage.type === 'success' 
                    ? 'bg-green-50 border border-green-100 text-green-700' 
                    : 'bg-red-50 border border-red-100 text-red-700'
                }`}>
                  {passwordMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                  {passwordMessage.text}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Nueva Contraseña *</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-elio-yellow/50 pr-12"
                    required
                    minLength={6}
                    placeholder="Mínimo 6 caracteres"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-2">
                <button 
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={isSettingPassword}
                  className="px-4 py-2 bg-elio-yellow text-white rounded-lg text-sm font-bold hover:bg-elio-yellow-hover disabled:opacity-50"
                >
                  {isSettingPassword ? 'Guardando...' : 'Establecer Contraseña'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};