import React, { useState, useEffect } from 'react';
import { Send, X, AlertTriangle } from 'lucide-react';

interface Usuario {
  id: string;
  name: string;
  role: string;
}

interface TicketModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TicketModal: React.FC<TicketModalProps> = ({ isOpen, onClose }) => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [priority, setPriority] = useState('MEDIUM');
  const [senderId, setSenderId] = useState('');
  const [recipientId, setRecipientId] = useState('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');

  // Cargar usuarios cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      const fetchUsuarios = async () => {
        try {
          const response = await fetch('/api/usuarios');
          if (response.ok) {
            const data = await response.json();
            setUsuarios(data);
            if (data.length > 0) {
              setSenderId(data[0].id);
            }
          }
        } catch (err) {
          console.error('Error cargando usuarios:', err);
        } finally {
          setIsLoading(false);
        }
      };
      fetchUsuarios();
    }
  }, [isOpen]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setPriority('MEDIUM');
      setRecipientId('');
      setTitle('');
      setMessage('');
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !senderId) return;

    try {
      const response = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description: message || null,
          priority,
          senderId,
          recipientId: recipientId || null
        })
      });

      if (!response.ok) throw new Error('Error al crear ticket');

      alert('✅ Ticket enviado correctamente');
      onClose();
    } catch (err) {
      alert('Error al enviar ticket');
    }
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
          
          {isLoading ? (
            <p className="text-center text-gray-500">Cargando...</p>
          ) : (
            <>
              {/* Sender */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">De (Remitente)</label>
                <select 
                  required
                  value={senderId}
                  onChange={(e) => setSenderId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-elio-yellow/50 bg-white"
                >
                  <option value="">Selecciona...</option>
                  {usuarios.map(user => (
                    <option key={user.id} value={user.id}>{user.name} ({user.role})</option>
                  ))}
                </select>
              </div>

              {/* Recipient */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Para (Destinatario)</label>
                <select 
                  value={recipientId}
                  onChange={(e) => setRecipientId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-elio-yellow/50 bg-white"
                >
                  <option value="">Todo el Equipo</option>
                  {usuarios.map(user => (
                    <option key={user.id} value={user.id}>{user.name} ({user.role})</option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Asunto *</label>
                <input 
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Resumen breve..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-elio-yellow/50"
                />
              </div>

              {/* Priority */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Prioridad</label>
                <div className="flex space-x-3">
                  <label className={`flex-1 flex items-center justify-center space-x-2 p-2 rounded-lg border cursor-pointer transition-all ${priority === 'MEDIUM' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'border-gray-200 hover:bg-gray-50'}`}>
                    <input 
                      type="radio" 
                      name="priority" 
                      value="MEDIUM"
                      checked={priority === 'MEDIUM'}
                      onChange={() => setPriority('MEDIUM')}
                      className="hidden"
                    />
                    <span className="text-sm font-medium">Normal</span>
                  </label>
                  
                  <label className={`flex-1 flex items-center justify-center space-x-2 p-2 rounded-lg border cursor-pointer transition-all ${priority === 'HIGH' ? 'bg-orange-50 border-orange-200 text-orange-700' : 'border-gray-200 hover:bg-gray-50'}`}>
                    <input 
                      type="radio" 
                      name="priority" 
                      value="HIGH"
                      checked={priority === 'HIGH'}
                      onChange={() => setPriority('HIGH')}
                      className="hidden"
                    />
                    <span className="text-sm font-medium">Alta</span>
                  </label>
                  
                  <label className={`flex-1 flex items-center justify-center space-x-2 p-2 rounded-lg border cursor-pointer transition-all ${priority === 'URGENT' ? 'bg-red-50 border-red-200 text-red-700' : 'border-gray-200 hover:bg-gray-50'}`}>
                    <input 
                      type="radio" 
                      name="priority" 
                      value="URGENT"
                      checked={priority === 'URGENT'}
                      onChange={() => setPriority('URGENT')}
                      className="hidden"
                    />
                    <AlertTriangle size={14} />
                    <span className="text-sm font-bold">!!!</span>
                  </label>
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Mensaje</label>
                <textarea 
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
            </>
          )}
        </form>
      </div>
    </div>
  );
};