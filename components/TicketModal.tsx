import React, { useState, useEffect } from 'react';
import { Send, X, AlertTriangle } from 'lucide-react';
import { MOCK_USERS } from '../lib/mock-data';

interface TicketModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TicketModal: React.FC<TicketModalProps> = ({ isOpen, onClose }) => {
  const [priority, setPriority] = useState('NORMAL');
  const [recipient, setRecipient] = useState('');
  const [message, setMessage] = useState('');

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setPriority('NORMAL');
      setRecipient('');
      setMessage('');
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !recipient) return;

    // Simulate sending
    const recipientName = recipient === 'ALL' ? 'Todo el Equipo' : MOCK_USERS.find(u => u.id === recipient)?.name || 'Desconocido';
    
    // Use setTimeout to allow UI to update before alert blocks thread
    setTimeout(() => {
        window.alert(`✅ TICKET ENVIADO\n\nDestinatario: ${recipientName}\nPrioridad: ${priority}\nMensaje: ${message}`);
        onClose();
    }, 100);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
          <h3 className="text-lg font-bold text-gray-900 flex items-center">
            <Send size={18} className="mr-2 text-elio-yellow" /> 
            Nuevo Ticket
          </h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-200"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Recipient */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Destinatario</label>
            <select 
              required
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-elio-yellow/50 bg-white"
            >
              <option value="">Selecciona...</option>
              <option value="ALL">Todo el Equipo</option>
              {MOCK_USERS.map(user => (
                <option key={user.id} value={user.id}>{user.name} ({user.role})</option>
              ))}
            </select>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Prioridad</label>
            <div className="flex space-x-3">
              <label className={`flex-1 flex items-center justify-center space-x-2 p-2 rounded-lg border cursor-pointer transition-all ${priority === 'NORMAL' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'border-gray-200 hover:bg-gray-50'}`}>
                <input 
                  type="radio" 
                  name="priority" 
                  value="NORMAL"
                  checked={priority === 'NORMAL'}
                  onChange={() => setPriority('NORMAL')}
                  className="hidden"
                />
                <span className="text-sm font-medium">Normal</span>
              </label>
              
              <label className={`flex-1 flex items-center justify-center space-x-2 p-2 rounded-lg border cursor-pointer transition-all ${priority === 'HIGH' ? 'bg-red-50 border-red-200 text-red-700' : 'border-gray-200 hover:bg-gray-50'}`}>
                <input 
                  type="radio" 
                  name="priority" 
                  value="HIGH"
                  checked={priority === 'HIGH'}
                  onChange={() => setPriority('HIGH')}
                  className="hidden"
                />
                <AlertTriangle size={14} />
                <span className="text-sm font-bold">Alta</span>
              </label>
            </div>
          </div>

          {/* Message */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Mensaje</label>
            <textarea 
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Escribe tu mensaje aquí..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-elio-yellow/50 min-h-[120px] resize-none"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex justify-end">
            <button 
              type="submit"
              className="bg-elio-black text-white px-6 py-2 rounded-lg font-bold hover:bg-gray-800 transition-all shadow-lg flex items-center"
            >
              <Send size={16} className="mr-2" />
              Enviar
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};