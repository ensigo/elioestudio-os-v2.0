'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Bell, MessageSquare, AlertTriangle, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface Ticket {
  id: string;
  title: string;
  priority: string;
  status: string;
  createdAt: string;
  readBy?: string[];
  sender: { id: string; name: string };
  recipient: { id: string; name: string } | null;
}

interface NotificationBellProps {
  onNavigate?: (page: string) => void;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ onNavigate }) => {
  const { usuario } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const isAdmin = usuario?.role === 'ADMIN' || usuario?.role === 'SUPERADMIN';

  // Cargar tickets
  useEffect(() => {
    const fetchTickets = async () => {
      if (!usuario) return;
      
      try {
        const response = await fetch('/api/tickets');
        if (response.ok) {
          const data = await response.json();
          
          // Filtrar tickets según rol
          let ticketsFiltrados = data;
          if (!isAdmin) {
            ticketsFiltrados = data.filter((t: Ticket) => 
              t.recipient?.id === usuario.id ||
              t.recipient === null // Para todo el equipo
            );
          }
          
          // Solo mostrar tickets abiertos o en progreso que NO han sido leídos por el usuario
          const ticketsPendientes = ticketsFiltrados.filter((t: Ticket) => {
            const isOpenOrInProgress = t.status === 'OPEN' || t.status === 'IN_PROGRESS';
            const notReadByUser = !t.readBy?.includes(usuario?.id || '');
            const notSentByUser = t.sender.id !== usuario?.id;
            return isOpenOrInProgress && notReadByUser && notSentByUser;
          });
          
          setTickets(ticketsPendientes);
        }
      } catch (err) {
        console.error('Error cargando tickets:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTickets();
    
    const interval = setInterval(fetchTickets, 30000);
    return () => clearInterval(interval);
  }, [usuario, isAdmin]);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const hasUnread = tickets.length > 0;

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays === 1) return 'Ayer';
    return `Hace ${diffDays} días`;
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'URGENT': return <AlertTriangle size={16} className="text-red-500" />;
      case 'HIGH': return <AlertTriangle size={16} className="text-orange-500" />;
      default: return <MessageSquare size={16} className="text-blue-500" />;
    }
  };

  const handleTicketClick = () => {
    setIsOpen(false);
    onNavigate?.('tickets');
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-full transition-colors outline-none ${
          isOpen ? 'bg-yellow-50 text-elio-yellow' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'
        }`}
      >
        <Bell 
          size={20} 
          className={hasUnread ? 'animate-[ring_1s_ease-in-out_infinite]' : ''}
        />
        {hasUnread && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 rounded-full border-2 border-white flex items-center justify-center">
            <span className="text-[10px] font-bold text-white">{tickets.length}</span>
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Notificaciones {tickets.length > 0 && `(${tickets.length})`}
            </h3>
          </div>
          
          <div className="max-h-[350px] overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-gray-400 text-sm">Cargando...</div>
            ) : tickets.length === 0 ? (
              <div className="p-6 text-center">
                <CheckCircle size={32} className="mx-auto mb-2 text-green-400" />
                <p className="text-sm text-gray-500">No hay notificaciones pendientes</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {tickets.map(ticket => (
                  <div 
                    key={ticket.id} 
                    onClick={handleTicketClick}
                    className="p-3 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start gap-3">
                      {getPriorityIcon(ticket.priority)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {ticket.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {ticket.sender.name} → {ticket.recipient?.name || 'Todo el equipo'}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-1">
                          {formatTime(ticket.createdAt)}
                        </p>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        ticket.priority === 'URGENT' ? 'bg-red-100 text-red-700' :
                        ticket.priority === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {ticket.status === 'OPEN' ? 'Abierto' : 'En progreso'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {tickets.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
              <button 
                onClick={handleTicketClick}
                className="text-xs text-blue-600 font-medium hover:underline w-full text-center"
              >
                Ver todos los tickets
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};