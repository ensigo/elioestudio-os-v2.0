import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { useAuth } from '../../context/AuthContext';
import { Send, Clock, Search, Filter, Inbox, Trash2, Loader2, MessageCircle, X } from 'lucide-react';

interface Usuario {
  id: string;
  name: string;
  role: string;
}

interface Respuesta {
  id: string;
  mensaje: string;
  createdAt: string;
  usuario: Usuario;
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
  respuestas?: Respuesta[];
}

interface TicketsPageProps {
  ticketIdToOpen?: string | null;
  onTicketOpened?: () => void;
}

export const TicketsPage = ({ ticketIdToOpen, onTicketOpened }: TicketsPageProps) => {
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

  // Estado para ver ticket y responder
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [respuestaTexto, setRespuestaTexto] = useState('');
  const [isSendingRespuesta, setIsSendingRespuesta] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPERADMIN';

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

  // Abrir ticket específico si viene de notificación
  useEffect(() => {
    if (ticketIdToOpen && tickets.length > 0) {
      const ticketToOpen = tickets.find(t => t.id === ticketIdToOpen);
      if (ticketToOpen) {
        setSelectedTicket(ticketToOpen);
        onTicketOpened?.();
      }
    }
  }, [ticketIdToOpen, tickets]);

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

  const markTicketsAsRead = async () => {
    if (!currentUser?.id) return;
    try {
      const response = await fetch('/api/tickets');
      if (response.ok) {
        const allTickets = await response.json();
        const ticketsToMark = allTickets.filter((t: Ticket) => {
          const isForMe = t.recipient?.id === currentUser.id || t.recipient === null;
          const notSentByMe = t.sender.id !== currentUser.id;
          const notReadByMe = !t.readBy?.includes(currentUser.id);
          return isForMe && notSentByMe && notReadByMe;
        });
        for (const ticket of ticketsToMark) {
          await fetch('/api/tickets', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: ticket.id, markReadBy: currentUser.id })
          });
        }
      }
    } catch (err) {
      console.error('Error marcando tickets como leídos:', err);
    }
  };

  const getFilteredTickets = () => {
    let filtered = tickets;
    if (!isAdmin && currentUser) {
      filtered = tickets.filter(t => 
        t.sender.id === currentUser.id ||
        t.recipient?.id === currentUser.id ||
        t.recipient === null
      );
    }
    // Filtrar por archivados o activos
    if (showArchived) {
      filtered = filtered.filter(t => t.status === 'CLOSED');
    } else {
      filtered = filtered.filter(t => t.status !== 'CLOSED');
    }
    if (searchTerm) {
      filtered = filtered.filter(t => 
        t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.sender.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return filtered;
  };

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
        if (selectedTicket?.id === ticketActualizado.id) {
          setSelectedTicket(ticketActualizado);
        }
      }
    } catch (err) {
      console.error('Error actualizando ticket:', err);
    }
  };

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
        if (selectedTicket?.id === ticketId) {
          setSelectedTicket(null);
        }
      }
    } catch (err) {
      console.error('Error eliminando ticket:', err);
    }
  };

  // Enviar respuesta
  const handleSendRespuesta = async () => {
    if (!respuestaTexto.trim() || !selectedTicket || !currentUser) return;
    setIsSendingRespuesta(true);
    try {
      const response = await fetch('/api/tickets?resource=respuestas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId: selectedTicket.id,
          userId: currentUser.id,
          mensaje: respuestaTexto
        })
      });
      if (response.ok) {
        const nuevaRespuesta = await response.json();
        // Actualizar el ticket con la nueva respuesta
        const ticketActualizado = {
          ...selectedTicket,
          respuestas: [...(selectedTicket.respuestas || []), nuevaRespuesta]
        };
        setSelectedTicket(ticketActualizado);
        setTickets(tickets.map(t => t.id === ticketActualizado.id ? ticketActualizado : t));
        setRespuestaTexto('');
      }
    } catch (err) {
      console.error('Error enviando respuesta:', err);
    } finally {
      setIsSendingRespuesta(false);
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

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('es-ES', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
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
              <div className="flex items-center space-x-4">
              <button 
               onClick={() => setShowArchived(false)}
               className={`font-bold flex items-center px-3 py-1 rounded-lg transition-colors ${!showArchived ? 'bg-elio-yellow text-white' : 'text-gray-500 hover:bg-gray-100'}`}
               >
              <Inbox size={16} className="mr-2" /> Activos ({tickets.filter(t => t.status !== 'CLOSED').length})
              </button>
              <button 
              onClick={() => setShowArchived(true)}
              className={`font-bold flex items-center px-3 py-1 rounded-lg transition-colors ${showArchived ? 'bg-gray-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
               >
              <Clock size={16} className="mr-2" /> Archivados ({tickets.filter(t => t.status === 'CLOSED').length})
              </button>
              </div>
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
                  <div 
                    key={ticket.id} 
                    className="bg-white p-4 rounded-xl border border-gray-200 hover:shadow-md transition-all cursor-pointer"
                    onClick={() => setSelectedTicket(ticket)}
                  >
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
                          {(ticket.respuestas?.length || 0) > 0 && (
                            <span className="ml-2 flex items-center text-blue-500">
                              <MessageCircle size={10} className="mr-1" /> {ticket.respuestas?.length}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="ml-13 bg-gray-50 p-3 rounded-lg border border-gray-100 text-sm text-gray-600 leading-relaxed">
                      {ticket.description.length > 150 
                        ? ticket.description.substring(0, 150) + '...' 
                        : ticket.description}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: Detalle del Ticket con Respuestas */}
      <Modal 
        isOpen={!!selectedTicket} 
        onClose={() => setSelectedTicket(null)} 
        title=""
        size="lg"
      >
        {selectedTicket && (
          <div className="flex flex-col h-[70vh]">
            {/* Header del Ticket */}
            <div className="pb-4 border-b border-gray-200">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedTicket.title}</h2>
                  <div className="flex items-center text-sm text-gray-500 mt-1">
                    <span className="font-medium text-gray-700">{selectedTicket.sender.name}</span>
                    <span className="mx-2">→</span>
                    <span>{selectedTicket.recipient?.name || 'Todo el equipo'}</span>
                    <span className="mx-2">•</span>
                    <span>{formatDateTime(selectedTicket.createdAt)}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  {getPriorityBadge(selectedTicket.priority)}
                  {getStatusBadge(selectedTicket.status)}
                </div>
              </div>
              
              {/* Cambiar Estado */}
              <div className="flex items-center gap-2 mt-4">
                <span className="text-xs text-gray-500">Estado:</span>
                {['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].map(status => (
                  <button
                    key={status}
                    onClick={() => handleChangeStatus(selectedTicket.id, status)}
                    className={`px-2 py-1 text-xs rounded border transition-all ${
                      selectedTicket.status === status
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
                  onClick={() => handleDelete(selectedTicket.id)}
                  className="ml-auto p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            {/* Conversación */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              {/* Mensaje Original */}
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-elio-yellow text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                  {selectedTicket.sender.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{selectedTicket.sender.name}</span>
                    <span className="text-xs text-gray-400">{formatDateTime(selectedTicket.createdAt)}</span>
                  </div>
                  <div className="bg-gray-100 p-3 rounded-lg rounded-tl-none text-sm text-gray-700 whitespace-pre-wrap">
                    {selectedTicket.description}
                  </div>
                </div>
              </div>

              {/* Respuestas */}
              {selectedTicket.respuestas?.map((respuesta) => (
                <div key={respuesta.id} className="flex gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                    respuesta.usuarios.id === selectedTicket.sender.id 
                      ? 'bg-elio-yellow text-white' 
                      : 'bg-blue-500 text-white'
                  }`}>
                    {respuesta.usuarios.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{respuesta.usuarios.name}</span>
                      <span className="text-xs text-gray-400">{formatDateTime(respuesta.createdAt)}</span>
                    </div>
                    <div className={`p-3 rounded-lg rounded-tl-none text-sm whitespace-pre-wrap ${
                      respuesta.usuarios.id === currentUser?.id 
                        ? 'bg-blue-100 text-blue-900' 
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {respuesta.mensaje}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Input para Responder */}
            {selectedTicket.status !== 'CLOSED' && (
              <div className="pt-4 border-t border-gray-200">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                    {currentUser?.name?.charAt(0) || '?'}
                  </div>
                  <div className="flex-1 flex gap-2">
                    <textarea
                      value={respuestaTexto}
                      onChange={(e) => setRespuestaTexto(e.target.value)}
                      placeholder="Escribe tu respuesta..."
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-elio-yellow/50 resize-none text-sm"
                      rows={2}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendRespuesta();
                        }
                      }}
                    />
                    <button
                      onClick={handleSendRespuesta}
                      disabled={!respuestaTexto.trim() || isSendingRespuesta}
                      className="px-4 bg-elio-yellow text-white rounded-lg hover:bg-elio-yellow-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {isSendingRespuesta ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Send size={18} />
                      )}
                    </button>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-2 ml-11">Presiona Enter para enviar, Shift+Enter para nueva línea</p>
              </div>
            )}

            {selectedTicket.status === 'CLOSED' && (
              <div className="pt-4 border-t border-gray-200 text-center text-sm text-gray-500">
                Este ticket está cerrado. Cambia el estado para poder responder.
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};
