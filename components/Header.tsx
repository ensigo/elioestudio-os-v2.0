'use client';

import React, { useState } from 'react';
import { Search, Plus, Menu, LogOut, User, Key, X, Eye, EyeOff, Check, AlertCircle } from 'lucide-react';
import { NotificationBell } from './NotificationBell';
import { TicketModal } from './TicketModal';

interface Usuario {
  id: string;
  name: string;
  email: string;
  role: string;
  position: string | null;
  avatarUrl: string | null;
}

interface HeaderProps {
  usuario?: Usuario | null;
  onLogout?: () => void;
  onNavigate?: (page: string) => void;
  onMenuClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ usuario, onLogout, onNavigate, onMenuClick }) => {
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  
  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess(false);

    if (newPassword !== confirmPassword) {
      setPasswordError('Las contraseñas no coinciden');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setIsChangingPassword(true);

    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'change-password',
          userId: usuario?.id,
          password: currentPassword,
          newPassword: newPassword
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setPasswordError(data.error || 'Error al cambiar contraseña');
      } else {
        setPasswordSuccess(true);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => {
          setIsPasswordModalOpen(false);
          setPasswordSuccess(false);
        }, 2000);
      }
    } catch (err) {
      setPasswordError('Error de conexión');
    }

    setIsChangingPassword(false);
  };

  const closePasswordModal = () => {
    setIsPasswordModalOpen(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
    setPasswordSuccess(false);
  };

  return (
    <>
      <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-20 shadow-sm">
        
        {/* Left: Brand / Mobile Toggle */}
        <div className="flex items-center gap-4">
          <button className="md:hidden p-2" onClick={onMenuClick}>
            <Menu size={24} className="text-gray-500" />
          </button>
          <h1 className="text-xl font-bold text-gray-900 hidden md:block">
            Dashboard
          </h1>
          <span className="md:hidden font-bold text-lg text-gray-900">ElioOS</span>
        </div>

        {/* Right Side: Search + Actions */}
        <div className="flex items-center gap-4">
          
          {/* Barra de Búsqueda */}
          <div className="relative hidden md:block w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Buscar..." 
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-transparent focus:bg-white focus:border-elio-yellow rounded-lg text-sm outline-none transition-all"
            />
          </div>

          {/* Botón Nuevo Ticket */}
          <button 
            onClick={() => setIsTicketModalOpen(true)}
            className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-all font-medium text-sm shadow-sm"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Nuevo Ticket</span>
          </button>

          <div className="h-6 w-px bg-gray-200 hidden sm:block"></div>

          {/* Campana */}
          <NotificationBell onNavigate={onNavigate} />
          
          {/* Perfil de Usuario */}
          <div className="relative">
            <div 
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            >
              <div className="h-9 w-9 rounded-full bg-elio-yellow text-white flex items-center justify-center font-bold text-sm border border-yellow-500 shadow-sm">
                {usuario ? getInitials(usuario.name) : 'U'}
              </div>
              <div className="hidden lg:flex flex-col items-end">
                <span className="text-xs font-bold text-gray-900 leading-none">
                  {usuario?.name || 'Usuario'}
                </span>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                  {usuario?.role || 'GUEST'}
                </span>
              </div>
            </div>

            {/* Dropdown Menu */}
            {isProfileMenuOpen && (
              <>
                <div 
                  className="fixed inset-0 z-30" 
                  onClick={() => setIsProfileMenuOpen(false)}
                ></div>
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-40">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="font-bold text-gray-900">{usuario?.name}</p>
                    <p className="text-xs text-gray-500">{usuario?.email}</p>
                  </div>
                  
                  <div className="py-1">
                    <button 
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        setIsProfileModalOpen(true);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <User size={16} className="text-gray-400" />
                      Mi Perfil
                    </button>
                    <button 
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        setIsPasswordModalOpen(true);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Key size={16} className="text-gray-400" />
                      Cambiar Contraseña
                    </button>
                  </div>

                  <div className="border-t border-gray-100 pt-1">
                    <button 
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        onLogout?.();
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <LogOut size={16} />
                      Cerrar Sesión
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

        </div>
      </header>

      <TicketModal 
        isOpen={isTicketModalOpen} 
        onClose={() => setIsTicketModalOpen(false)} 
      />

      {/* Modal Mi Perfil */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-gray-50">
              <h3 className="font-bold text-lg text-gray-900">Mi Perfil</h3>
              <button onClick={() => setIsProfileModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20}/>
              </button>
            </div>
            
            <div className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-16 w-16 rounded-full bg-elio-yellow text-white flex items-center justify-center font-bold text-2xl">
                  {usuario ? getInitials(usuario.name) : 'U'}
                </div>
                <div>
                  <h4 className="font-bold text-xl text-gray-900">{usuario?.name}</h4>
                  <p className="text-gray-500">{usuario?.email}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-xs text-gray-500 uppercase font-bold mb-1">Rol</p>
                  <p className="font-medium text-gray-900">{usuario?.role}</p>
                </div>
                {usuario?.position && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-xs text-gray-500 uppercase font-bold mb-1">Cargo</p>
                    <p className="font-medium text-gray-900">{usuario.position}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button 
                onClick={() => setIsProfileModalOpen(false)}
                className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cambiar Contraseña */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-gray-50">
              <h3 className="font-bold text-lg text-gray-900">Cambiar Contraseña</h3>
              <button onClick={closePasswordModal} className="text-gray-400 hover:text-gray-600">
                <X size={20}/>
              </button>
            </div>
            
            <form onSubmit={handleChangePassword} className="p-6 space-y-4">
              {passwordError && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2 text-red-700 text-sm">
                  <AlertCircle size={16} />
                  {passwordError}
                </div>
              )}

              {passwordSuccess && (
                <div className="p-3 bg-green-50 border border-green-100 rounded-lg flex items-center gap-2 text-green-700 text-sm">
                  <Check size={16} />
                  ¡Contraseña actualizada correctamente!
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                  Contraseña Actual
                </label>
                <div className="relative">
                  <input
                    type={showPasswords ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-elio-yellow/50"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                  Nueva Contraseña
                </label>
                <input
                  type={showPasswords ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-elio-yellow/50"
                  required
                  minLength={6}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                  Confirmar Nueva Contraseña
                </label>
                <input
                  type={showPasswords ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-elio-yellow/50"
                  required
                  minLength={6}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="showPasswords"
                  checked={showPasswords}
                  onChange={(e) => setShowPasswords(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="showPasswords" className="text-sm text-gray-600">
                  Mostrar contraseñas
                </label>
              </div>

              <div className="pt-4 flex justify-end gap-2">
                <button 
                  type="button"
                  onClick={closePasswordModal}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={isChangingPassword}
                  className="px-4 py-2 bg-elio-yellow text-white rounded-lg text-sm font-bold hover:bg-elio-yellow-hover disabled:opacity-50"
                >
                  {isChangingPassword ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};