'use client';

import React, { useState } from 'react';
import { Search, Plus, Menu, LogOut, User, Key } from 'lucide-react';
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
}

export const Header: React.FC<HeaderProps> = ({ usuario, onLogout }) => {
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <>
      <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-20 shadow-sm">
        
        {/* Left: Brand / Mobile Toggle */}
        <div className="flex items-center gap-4">
          <div className="md:hidden">
            <Menu size={24} className="text-gray-500" />
          </div>
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
          <NotificationBell />
          
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
                    <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                      <User size={16} className="text-gray-400" />
                      Mi Perfil
                    </button>
                    <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
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
    </>
  );
};