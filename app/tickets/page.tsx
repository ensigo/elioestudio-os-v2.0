import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../context/AuthContext';
import { Send, Clock, Search, Filter, Inbox, Trash2, Loader2 } from 'lucide-react';

interface Usuario {
  id: string;
  name: string;
  role: string;
}

interface Ticket {
  id: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  createdAt: string;
  readBy?: string[];
  sender: Usuario;
  recipient: Usuario | null;
}

export const TicketsPage = () => {
  const { usuario: currentUser } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form State
  const [recipientId, setRecipientId] = useState('');
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPERADMIN';

  // Cargar datos y marcar como leídos
  useEffect(() => {
    const loadAndMarkAsRead = async () => {
      await fetchData();
      
      if (currentUser?.id) {
        markTicketsAsRead();
      }
    };
    
    if (currentUser) {
      loadAndMarkAsRead();
    }
  }, [currentUser]);

  const fetchData = async () => {
    try {
      const [ticketsRes, usuariosRes] = await Promise.all([
        fetch('/api/tickets'),
        fetch('/api/usuarios')
      ]);

      if (ticketsRes.ok) {
        const ticketsData = await ticketsRes.json();
        setTickets(ticketsData);
      }

      if (usuariosRes.ok) {
        const usuariosData = await usuariosRes.json();
        setUsuarios(usuariosData);
      }
    } catch (err) {
      console.error('Error cargando datos:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Marcar tickets como leídos
  const markTicketsAsRead = async () => {
    if (!currentUser?.id) return;
    
    try {
      const response = await fetch('/api/tickets');
      if (response.ok) {
        const allTickets = await response.json();
        
        // Filtrar tickets que este usuario debería ver y no ha leído
        const ticketsToMark = allTickets.filter((t: Ticket) => {
          const isForMe = t.recipient?.id === currentUser.id || t.recipient === null;
          const notSentByMe = t.sender.id !== currentUser.id;
          const notReadByMe = !t.readBy?.includes(currentUser.id);
          return isForMe && notSentByMe && notReadByMe;
        });
        
        // Marcar cada ticket como leído
        for (const ticket of ticketsToMark) {
          await fetch('/api/tickets', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: ticket.id,
              markReadBy: currentUser.id
            })
          });
        }
      }
    } catch (err) {
      console.error('Error marcando tickets como leídos:', err);
    }
  };

  // Filtrar tickets según rol del usuario
  const getFilteredTickets = () => {
    let filtered = tickets;

    // Si NO es admin, filtrar tickets
    if (!isAdmin && currentUser) {
      filtered = tickets.filter(t => 
        t.sender.id === currentUser.id || // Enviados por mí
        t.recipient?.id === currentUser.id || // Recibidos directamente
        t.recipient === null // Para todo el equipo
      );
    }

    // Aplicar búsqueda
    if (searchTerm) {
      filtered = filtered.filter(t => 
        t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.sender.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  };

  // Enviar ticket
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message || !currentUser) return;

    setIsSending(true);

    try {
      const response = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description: message,
          priority,
          senderId: currentUser.id,
          recipientId: recipientId || null
        })
      });

      if (response.ok) {
        const nuevoTicket = await response.json();
        setTickets([nuevoTicket, ...tickets]);
        
        setRecipientId('');
        setTitle('');
        setPriority('MEDIUM');
        setMessage('');
      }
    } catch (err) {
      console.error('Error enviando ticket:', err);
    } finally {
      setIsSending(false);
    }
  };

  // Cambiar estado del ticket
  const handleChangeStatus = async (ticketId: string, newStatus: string) => {
    try {
      const response = await fetch('/api/tickets', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: ticketId, status: newStatus })
      });

      if (response.ok) {
        const ticketActualizado = await response.json();
        setTickets(tickets.map(t => t.id === ticketActualizado.id ? ticketActualizado : t));
      }
    } catch (err) {
      console.error('Error actualizando ticket:', err);
    }
  };

  // Eliminar ticket
  const handleDelete = async (ticketId: string) => {
    if (!confirm('¿Eliminar este ticket?')) return;

    try {
      const response = await fetch('/api/tickets', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: ticketId })
      });

      if (response.ok) {
        setTickets(tickets.filter(t => t.id !== ticketId));
      }
    } catch (err) {
      console.error('Error eliminando ticket:', err);
    }
  };

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case 'URGENT': return <Badge variant="danger">!!!</Badge>;
      case 'HIGH': return <Badge variant="warning">Alta</Badge>;
      case 'MEDIUM': return <Badge variant="blue">Media</Badge>;
      default: return <Badge variant="neutral">Baja</Badge>;
    }
  };

  const getStatusBadge = (s: string) => {
    switch (s) {
      case 'OPEN': return <Badge variant="success">Abierto</Badge>;
      case 'IN_PROGRESS': return <Badge variant="warning">En Progreso</Badge>;
      case 'RESOLVED': return <Badge variant="blue">Resuelto</Badge>;
      case 'CLOSED': return <Badge variant="neutral">Cerrado</Badge>;
      default: return <Badge variant="neutral">{s}</Badge>;
    }
  };

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

  const filteredTickets = getFilteredTickets();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="w-8 h-8 text-elio-yellow animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col animate-in fade-in duration-300">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Centro de Tickets</h1>
        <p className="text-gray-500 text-sm">Comunicación interna del equipo.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 h-full min-h-0">
        
        {/* COLUMNA IZQUIERDA: FORMULARIO */}
        <div className="w-full lg:w-[35%] flex flex-col">
          <Card title="Nuevo Mensaje" className="flex-1 overflow-y-auto">
            <form onSubmit={handleSend} className="space-y-4">
              
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">De (Remitente) *</label>
                <select 
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none bg-gray-50 text-gray-700"
                  value={currentUser?.id || ''}
                  disabled
                >
                  <option>{currentUser?.name} ({currentUser?.role})</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Para (Destinatario) *</label>
                <select 
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-elio-yellow/50 bg-white"
                  value={recipientId}
                  onChange={e => setRecipientId(e.target.value)}
                >
                  <option value="">Todo el equipo</option>
                  {usuarios.filter(u => u.id !== currentUser?.id).map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Asunto *</label>
                <input 
                  type="text" 
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-elio-yellow/50"
                  placeholder="Resumen breve..."
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Prioridad</label>
                <div className="grid grid-cols-4 gap-2">
                  {['LOW', 'MEDIUM', 'HIGH', 'URGENT'].map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={`py-1.5 text-[10px] font-bold rounded border transition-all uppercase ${
                        priority === p 
                          ? 'bg-elio-black text-white border-elio-black' 
                          : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {p === 'LOW' ? 'Baja' : p === 'MEDIUM' ? 'Media' : p === 'HIGH' ? 'Alta' : '!!!'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Mensaje *</label>
                <textarea 
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-elio-yellow/50 min-h-[120px] resize-none"
                  placeholder="Detalla tu mensaje..."
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  required
                />
              </div>

              <button 
                type="submit"
                disabled={isSending}
                className="w-full py-3 bg-elio-yellow text-white font-bold rounded-lg hover:bg-elio-yellow-hover shadow-lg shadow-elio-yellow/20 flex items-center justify-center transition-all active:scale-95 disabled:opacity-50"
              >
                {isSending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Send size={18} className="mr-2" /> Enviar
                  </>
                )}
              </button>
            </form>
          </Card>
        </div>

        {/* COLUMNA DERECHA: BANDEJA */}
        <div className="w-full lg:w-[65%] flex flex-col">
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm flex-1 flex flex-col overflow-hidden">
             
            {/* Toolbar */}
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <h3 className="font-bold text-gray-700 flex items-center">
                <Inbox size={18} className="mr-2" /> Bandeja ({filteredTickets.length})
              </h3>
              <div className="flex space-x-2">
                <div className="relative">
                  <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="Buscar..." 
                    className="pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg outline-none focus:border-elio-yellow w-40"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                </div>
                <button className="p-1.5 bg-white border border-gray-200 rounded-lg text-gray-500 hover:text-elio-black">
                  <Filter size={14} />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/30">
              {filteredTickets.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Inbox size={48} className="mx-auto mb-4 opacity-50" />
                  <p>No hay tickets</p>
                </div>
              ) : (
                filteredTickets.map(ticket => (
                  <div key={ticket.id} className="bg-white p-4 rounded-xl border border-gray-200 hover:shadow-md transition-all">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-elio-yellow text-white flex items-center justify-center font-bold border border-white shadow-sm">
                          {ticket.sender.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{ticket.title}</p>
                          <div className="flex items-center text-xs text-gray-500 mt-0.5">
                            <span className="font-medium text-gray-700">{ticket.sender.name}</span>
                            <span className="mx-1">→</span>
                            <span>{ticket.recipient?.name || 'Todo el equipo'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-1">
                        <div className="flex gap-1">
                          {getPriorityBadge(ticket.priority)}
                          {getStatusBadge(ticket.status)}
                        </div>
                        <div className="flex items-center text-[10px] text-gray-400">
                          <Clock size={10} className="mr-1" /> {formatTime(ticket.createdAt)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="ml-13 bg-gray-50 p-3 rounded-lg border border-gray-100 text-sm text-gray-600 leading-relaxed mb-3">
                      {ticket.description}
                    </div>

                    {/* Acciones */}
                    <div className="ml-13 flex items-center gap-2 text-xs">
                      <span className="text-gray-400">Estado:</span>
                      {['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].map(status => (
                        <button
                          key={status}
                          onClick={() => handleChangeStatus(ticket.id, status)}
                          className={`px-2 py-1 rounded border transition-all ${
                            ticket.status === status
                              ? 'bg-elio-yellow text-white border-elio-yellow'
                              : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {status === 'OPEN' ? 'Abierto' : 
                           status === 'IN_PROGRESS' ? 'En Progreso' : 
                           status === 'RESOLVED' ? 'Resuelto' : 'Cerrado'}
                        </button>
                      ))}
                      <button
                        onClick={() => handleDelete(ticket.id)}
                        className="ml-auto p-1 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};