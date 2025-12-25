import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Send, Clock, Search, Filter, Inbox, AlertTriangle, Trash2 } from 'lucide-react';

interface Usuario {
  id: string;
  name: string;
  role: string;
}

interface Ticket {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  senderId: string;
  recipientId: string | null;
  createdAt: string;
  sender?: Usuario;
  recipient?: Usuario;
}

export const TicketsPage = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [senderId, setSenderId] = useState('');
  const [recipientId, setRecipientId] = useState('');

  // Cargar datos
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ticketsRes, usuariosRes] = await Promise.all([
          fetch('/api/tickets'),
          fetch('/api/usuarios')
        ]);

        if (!ticketsRes.ok || !usuariosRes.ok) {
          throw new Error('Error al cargar datos');
        }

        const [ticketsData, usuariosData] = await Promise.all([
          ticketsRes.json(),
          usuariosRes.json()
        ]);

        setTickets(ticketsData);
        setUsuarios(usuariosData);
        
        // Seleccionar primer usuario como remitente por defecto
        if (usuariosData.length > 0) {
          setSenderId(usuariosData[0].id);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Crear ticket
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !senderId) return;

    try {
      const response = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description: description || null,
          priority,
          senderId,
          recipientId: recipientId || null
        })
      });

      if (!response.ok) throw new Error('Error al crear ticket');

      const nuevoTicket = await response.json();
      setTickets([nuevoTicket, ...tickets]);
      
      // Reset form (mantener senderId)
      setTitle('');
      setDescription('');
      setPriority('MEDIUM');
      setRecipientId('');
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  // Cambiar estado
  const handleChangeStatus = async (ticketId: string, newStatus: string) => {
    try {
      const response = await fetch('/api/tickets', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: ticketId, status: newStatus })
      });

      if (!response.ok) throw new Error('Error al actualizar');

      const ticketActualizado = await response.json();
      setTickets(tickets.map(t => t.id === ticketId ? ticketActualizado : t));
    } catch (err) {
      alert('Error al cambiar estado');
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

      if (!response.ok) throw new Error('Error al eliminar');

      setTickets(tickets.filter(t => t.id !== ticketId));
    } catch (err) {
      alert('Error al eliminar');
    }
  };

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case 'URGENT': return <Badge variant="danger">URGENTE</Badge>;
      case 'HIGH': return <Badge variant="warning">Alta</Badge>;
      case 'MEDIUM': return <Badge variant="blue">Media</Badge>;
      default: return <Badge variant="neutral">Baja</Badge>;
    }
  };

  const getStatusBadge = (s: string) => {
    switch (s) {
      case 'OPEN': return <Badge variant="blue">Abierto</Badge>;
      case 'IN_PROGRESS': return <Badge variant="warning">En Progreso</Badge>;
      case 'RESOLVED': return <Badge variant="success">Resuelto</Badge>;
      case 'CLOSED': return <Badge variant="neutral">Cerrado</Badge>;
      default: return <Badge variant="neutral">{s}</Badge>;
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Hace unos minutos';
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays === 1) return 'Ayer';
    return `Hace ${diffDays} días`;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <p className="text-xl text-elio-yellow animate-pulse">Cargando tickets...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-96 bg-red-50 p-6 rounded-lg border border-red-200">
        <AlertTriangle size={24} className="text-red-500 mr-3" />
        <p className="text-red-700 font-medium">Error: {error}</p>
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
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-elio-yellow/50 bg-white"
                  value={senderId}
                  onChange={e => setSenderId(e.target.value)}
                  required
                >
                  <option value="">Seleccionar...</option>
                  {usuarios.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Para (Destinatario)</label>
                <select 
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-elio-yellow/50 bg-white"
                  value={recipientId}
                  onChange={e => setRecipientId(e.target.value)}
                >
                  <option value="">Todo el equipo</option>
                  {usuarios.map(u => (
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
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Mensaje</label>
                <textarea 
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-elio-yellow/50 min-h-[120px] resize-none"
                  placeholder="Detalla tu mensaje..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
              </div>

              <button 
                type="submit"
                className="w-full py-3 bg-elio-yellow text-white font-bold rounded-lg hover:bg-elio-yellow-hover shadow-lg shadow-elio-yellow/20 flex items-center justify-center transition-all active:scale-95"
              >
                <Send size={18} className="mr-2" /> Enviar
              </button>
            </form>
          </Card>
        </div>

        {/* COLUMNA DERECHA: LISTADO */}
        <div className="w-full lg:w-[65%] flex flex-col">
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm flex-1 flex flex-col overflow-hidden">
            
            {/* Toolbar */}
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <h3 className="font-bold text-gray-700 flex items-center">
                <Inbox size={18} className="mr-2" /> Bandeja ({tickets.length})
              </h3>
              <div className="flex space-x-2">
                <div className="relative">
                  <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="text" placeholder="Buscar..." className="pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg outline-none focus:border-elio-yellow w-40" />
                </div>
                <button className="p-1.5 bg-white border border-gray-200 rounded-lg text-gray-500 hover:text-elio-black">
                  <Filter size={14} />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/30">
              {tickets.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  No hay mensajes. ¡Envía el primero!
                </div>
              ) : (
                tickets.map(ticket => (
                  <div key={ticket.id} className="bg-white p-4 rounded-xl border border-gray-200 hover:shadow-md transition-all group">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-elio-yellow text-white flex items-center justify-center font-bold border border-white shadow-sm">
                          {ticket.sender?.name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900 group-hover:text-elio-yellow-hover transition-colors">{ticket.title}</p>
                          <div className="flex items-center text-xs text-gray-500 mt-0.5 space-x-2">
                            <span className="font-medium text-gray-700">{ticket.sender?.name}</span>
                            <span className="text-gray-300">→</span>
                            <span className="bg-gray-100 px-1.5 py-0.5 rounded text-[10px]">
                              {ticket.recipient?.name || 'Todo el equipo'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-1">
                        <div className="flex space-x-1">
                          {getPriorityBadge(ticket.priority)}
                          {getStatusBadge(ticket.status)}
                        </div>
                        <div className="flex items-center text-[10px] text-gray-400">
                          <Clock size={10} className="mr-1" /> {formatDate(ticket.createdAt)}
                        </div>
                      </div>
                    </div>
                    
                    {ticket.description && (
                      <div className="ml-14 bg-gray-50 p-3 rounded-lg border border-gray-100 text-sm text-gray-600 leading-relaxed">
                        {ticket.description}
                      </div>
                    )}

                    {/* Acciones */}
                    <div className="ml-14 mt-3 flex items-center space-x-2">
                      <span className="text-xs text-gray-400">Estado:</span>
                      {['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].map(s => (
                        <button
                          key={s}
                          onClick={() => handleChangeStatus(ticket.id, s)}
                          className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
                            ticket.status === s
                              ? 'bg-elio-yellow text-white border-elio-yellow'
                              : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
                          }`}
                        >
                          {s === 'OPEN' ? 'Abierto' : s === 'IN_PROGRESS' ? 'En Progreso' : s === 'RESOLVED' ? 'Resuelto' : 'Cerrado'}
                        </button>
                      ))}
                      <button
                        onClick={() => handleDelete(ticket.id)}
                        className="ml-auto p-1 text-gray-400 hover:text-red-500 transition-colors"
                        title="Eliminar"
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