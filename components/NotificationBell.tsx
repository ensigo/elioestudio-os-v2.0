'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Bell, AlertTriangle, Info, CheckCircle, X } from 'lucide-react';

export const NotificationBell: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (hasUnread) setHasUnread(false);
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <button 
        onClick={handleToggle}
        className={`relative p-2 rounded-full transition-colors outline-none ${
          isOpen ? 'bg-yellow-50 text-elio-yellow' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'
        }`}
      >
        <Bell size={20} />
        {hasUnread && (
          <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Notificaciones</h3>
            <span className="text-[10px] text-blue-600 cursor-pointer">Marcar leídas</span>
          </div>
          
          <div className="max-h-[300px] overflow-y-auto">
            {/* Mock Notifications */}
            <div className="divide-y divide-gray-50">
              <div className="p-3 hover:bg-gray-50 transition-colors cursor-pointer">
                <div className="flex items-start gap-3">
                  <AlertTriangle size={16} className="text-orange-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Revisar entrega urgente</p>
                    <p className="text-xs text-gray-500 mt-1">Elena Nito • Hace 30 min</p>
                  </div>
                </div>
              </div>

              <div className="p-3 hover:bg-gray-50 transition-colors cursor-pointer">
                <div className="flex items-start gap-3">
                  <Info size={16} className="text-blue-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Bienvenido a ElioOS 2.0</p>
                    <p className="text-xs text-gray-500 mt-1">Sistema • Hace 2 horas</p>
                  </div>
                </div>
              </div>

              <div className="p-3 hover:bg-gray-50 transition-colors cursor-pointer">
                <div className="flex items-start gap-3">
                  <CheckCircle size={16} className="text-green-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Tarea completada: #T-342</p>
                    <p className="text-xs text-gray-500 mt-1">Aitor Tilla • Ayer</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};