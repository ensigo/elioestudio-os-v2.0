import React, { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { MOCK_USERS } from '../../lib/mock-data';
import { CURRENT_USER_ROLE } from '../../constants';
import { Send, MessageSquare, AlertTriangle, Clock, Search, Filter, Inbox } from 'lucide-react';

interface Ticket {
  id: string;
  sender: { name: string; role: string };
  recipientId: string;
  subject: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  message: string;
  date: string;
  status: 'OPEN' | 'CLOSED';
}

const INITIAL_TICKETS: Ticket[] = [
  {
    id: 'tk-101',
    sender: { name: 'Elena Nito', role: 'MANAGER' },
    recipientId: 'u1',
    subject: 'Solicitud de acceso a Servidor Staging',
    priority: 'HIGH',
    message: 'Necesito credenciales para desplegar la versión v2.0 del cliente TechSolutions.',
    date: 'Hace 2 horas',
    status: 'OPEN'
  },
  {
    id: 'tk-102',
    sender: { name: 'Aitor Tilla', role: 'DEV' },
    recipientId: 'u1',
    subject: 'Error en API de Stripe',
    priority: 'URGENT',
    message: 'Los pagos están fallando en producción. He revertido el último commit pero necesitamos investigar.',
    date: 'Ayer',
    status: 'OPEN'
  },
  {
    id: 'tk-103',
    sender: { name: 'Ana Tomía', role: 'DESIGNER' },
    recipientId: 'u1',
    subject: 'Nuevos assets para la web corporativa',
    priority: 'NORMAL',
    message: 'He subido los iconos actualizados a la carpeta compartida. Por favor revisar.',
    date: 'Hace 2 días',
    status: 'CLOSED'
  }
];

export const TicketsPage = () => {
  const [tickets, setTickets] = useState<Ticket[]>(INITIAL_TICKETS);
  
  // Form State
  const [recipient, setRecipient] = useState('');
  const [subject, setSubject] = useState('');
  const [priority, setPriority] = useState('NORMAL');
  const [message, setMessage] = useState('');

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient || !subject || !message) return;

    const newTicket: Ticket = {
      id: `tk-${Date.now()}`,
      sender: { name: CURRENT_USER_ROLE.name, role: CURRENT_USER_ROLE.role },
      recipientId: recipient,
      subject: subject,
      priority: priority as any,
      message: message,
      date: 'Justo ahora',
      status: 'OPEN'
    };

    setTickets([newTicket, ...tickets]);
    
    // Reset form
    setRecipient('');
    setSubject('');
    setPriority('NORMAL');
    setMessage('');
  };

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case 'URGENT': return <Badge variant="danger">URGENTE</Badge>;
      case 'HIGH': return <Badge variant="warning">Alta</Badge>;
      case 'NORMAL': return <Badge variant="blue">Normal</Badge>;
      default: return <Badge variant="neutral">Baja</Badge>;
    }
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col animate-in fade-in duration-300">
      <div className="mb-6">
         <h1 className="text-2xl font-bold text-gray-900">Centro de Tickets</h1>
         <p className="text-gray-500 text-sm">Comunicaciones internas y soporte técnico.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 h-full min-h-0">
        
        {/* COLUMNA IZQUIERDA: FORMULARIO (30%) */}
        <div className="w-full lg:w-[35%] flex flex-col">
          <Card title="Redactar Mensaje" className="flex-1 overflow-y-auto">
            <form onSubmit={handleSend} className="space-y-4">
              
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Destinatario</label>
                <select 
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-elio-yellow/50 bg-white"
                  value={recipient}
                  onChange={e => setRecipient(e.target.value)}
                  required
                >
                  <option value="">Seleccionar destinatario...</option>
                  <option value="ALL">Todo el Equipo</option>
                  {MOCK_USERS.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Asunto</label>
                <input 
                  type="text" 
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-elio-yellow/50"
                  placeholder="Resumen breve del problema..."
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  required
                />
              </div>

              <div>
                 <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Prioridad</label>
                 <div className="grid grid-cols-4 gap-2">
                    {['LOW', 'NORMAL', 'HIGH', 'URGENT'].map(p => (
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
                         {p === 'LOW' ? 'Baja' : p === 'NORMAL' ? 'Media' : p === 'HIGH' ? 'Alta' : '!!!'}
                       </button>
                    ))}
                 </div>
              </div>

              <div className="flex-1">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Mensaje Detallado</label>
                <textarea 
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-elio-yellow/50 min-h-[150px] resize-none"
                  placeholder="Describe el requerimiento..."
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  required
                />
              </div>

              <button 
                type="submit"
                className="w-full py-3 bg-elio-yellow text-white font-bold rounded-lg hover:bg-elio-yellow-hover shadow-lg shadow-elio-yellow/20 flex items-center justify-center transition-all active:scale-95"
              >
                <Send size={18} className="mr-2" /> Enviar Ticket
              </button>
            </form>
          </Card>
        </div>

        {/* COLUMNA DERECHA: HISTORIAL (70%) */}
        <div className="w-full lg:w-[65%] flex flex-col">
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm flex-1 flex flex-col overflow-hidden">
             
             {/* Toolbar */}
             <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                <h3 className="font-bold text-gray-700 flex items-center">
                  <Inbox size={18} className="mr-2" /> Bandeja de Entrada / Salida
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
                {tickets.map(ticket => (
                  <div key={ticket.id} className="bg-white p-4 rounded-xl border border-gray-200 hover:shadow-md transition-all cursor-pointer group">
                     <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center space-x-3">
                           <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold border border-white shadow-sm">
                              {ticket.sender.name.charAt(0)}
                           </div>
                           <div>
                              <p className="text-sm font-bold text-gray-900 group-hover:text-elio-yellow-hover transition-colors">{ticket.subject}</p>
                              <div className="flex items-center text-xs text-gray-500 mt-0.5">
                                 <span className="font-medium text-gray-700 mr-2">{ticket.sender.name}</span>
                                 <span className="bg-gray-100 px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wide">{ticket.sender.role}</span>
                              </div>
                           </div>
                        </div>
                        <div className="flex flex-col items-end space-y-1">
                           {getPriorityBadge(ticket.priority)}
                           <div className="flex items-center text-[10px] text-gray-400">
                             <Clock size={10} className="mr-1" /> {ticket.date}
                           </div>
                        </div>
                     </div>
                     
                     <div className="ml-14 bg-gray-50 p-3 rounded-lg border border-gray-100 text-sm text-gray-600 leading-relaxed">
                        {ticket.message}
                     </div>
                  </div>
                ))}
             </div>
          </div>
        </div>

      </div>
    </div>
  );
};