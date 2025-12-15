import React, { useState } from 'react';
import { ClientStatus } from '../types';
import { MOCK_USERS } from '../lib/mock-data';
import { AlertCircle } from 'lucide-react';

interface ClientFormProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

export const ClientForm: React.FC<ClientFormProps> = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    taxId: '',
    responsibleId: '',
    status: 'ACTIVE' as ClientStatus
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'El Nombre Fiscal es obligatorio.';
    if (!formData.taxId.trim()) newErrors.taxId = 'El CIF/NIF es obligatorio.';
    if (!formData.responsibleId) newErrors.responsibleId = 'Debes asignar un responsable interno.';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nombre Fiscal <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-elio-yellow/50 outline-none transition-all ${
            errors.name ? 'border-red-300 bg-red-50' : 'border-gray-200'
          }`}
          placeholder="Ej: TechSolutions S.L."
        />
        {errors.name && <p className="text-xs text-red-500 mt-1 flex items-center"><AlertCircle size={10} className="mr-1"/> {errors.name}</p>}
      </div>

      {/* Tax ID */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          CIF / NIF <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.taxId}
          onChange={(e) => setFormData({...formData, taxId: e.target.value})}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-elio-yellow/50 outline-none transition-all ${
            errors.taxId ? 'border-red-300 bg-red-50' : 'border-gray-200'
          }`}
          placeholder="B-12345678"
        />
        {errors.taxId && <p className="text-xs text-red-500 mt-1">{errors.taxId}</p>}
      </div>

      {/* Responsible Select */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Responsable Interno <span className="text-red-500">*</span>
        </label>
        <select
          value={formData.responsibleId}
          onChange={(e) => setFormData({...formData, responsibleId: e.target.value})}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-elio-yellow/50 outline-none transition-all ${
            errors.responsibleId ? 'border-red-300 bg-red-50' : 'border-gray-200'
          }`}
        >
          <option value="">Seleccionar empleado...</option>
          {MOCK_USERS.map(user => (
            <option key={user.id} value={user.id}>{user.name} ({user.role})</option>
          ))}
        </select>
        {errors.responsibleId && <p className="text-xs text-red-500 mt-1">{errors.responsibleId}</p>}
      </div>

      {/* Status Select */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Estado Inicial</label>
        <select
          value={formData.status}
          onChange={(e) => setFormData({...formData, status: e.target.value as ClientStatus})}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-elio-yellow/50 outline-none"
        >
          <option value="ACTIVE">Activo (Normal)</option>
          <option value="RISK">En Riesgo (Atención Prioritaria)</option>
          <option value="PAUSED">En Pausa</option>
        </select>
      </div>

      <div className="pt-4 flex items-center justify-end space-x-3">
        <button 
          type="button" 
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          Cancelar
        </button>
        <button 
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-elio-black hover:bg-gray-900 rounded-lg transition-colors shadow-sm"
        >
          Crear Cliente
        </button>
      </div>
    </form>
  );
};