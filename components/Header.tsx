'use client';

import React, { useState } from 'react';
import { Search, ChevronDown, Plus, Menu } from 'lucide-react';
import { CURRENT_USER_ROLE } from '../constants';
import { NotificationBell } from './NotificationBell';
import { TicketModal } from './TicketModal';

export const Header: React.FC = () => {
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);

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
          
          {/* 1. Barra de Búsqueda */}
          <div className="relative hidden md:block w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Buscar..." 
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-transparent focus:bg-white focus:border-elio-yellow rounded-lg text-sm outline-none transition-all"
            />
          </div>

          {/* 2. EL BOTÓN FANTASMA (Ahora Visible) */}
          <button 
            onClick={() => setIsTicketModalOpen(true)}
            className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-all font-medium text-sm shadow-sm"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Nuevo Ticket</span>
          </button>

          <div className="h-6 w-px bg-gray-200 hidden sm:block"></div>

          {/* 3. Campana y Perfil */}
          <NotificationBell />
          
          <div className="flex items-center gap-2 cursor-pointer">
            <div className="h-9 w-9 rounded-full bg-elio-yellow text-white flex items-center justify-center font-bold text-sm border border-yellow-500 shadow-sm">
              {CURRENT_USER_ROLE.name.substring(0, 2).toUpperCase()}
            </div>
            <div className="hidden lg:flex flex-col items-end">
               <span className="text-xs font-bold text-gray-900 leading-none">{CURRENT_USER_ROLE.name}</span>
               <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{CURRENT_USER_ROLE.role}</span>
            </div>
          </div>

        </div>
      </header>

      {/* Modal Component Logic */}
      <TicketModal 
        isOpen={isTicketModalOpen} 
        onClose={() => setIsTicketModalOpen(false)} 
      />
    </>
  );
};