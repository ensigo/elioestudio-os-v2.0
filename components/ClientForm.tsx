import React, { useState, useEffect } from 'react';
import { ClientStatus } from '../types';
import { AlertCircle } from 'lucide-react';

interface ClientFormProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
  usuarios?: any[];
  initialData?: {
    name: string;
    email: string;
    phone: string;
    taxId: string;
    address: string;
    contactPerson: string;
    status: string;
    responsibleId: string;
  };
}

export const ClientForm: React.FC<ClientFormProps> = ({ onSubmit, onCancel, usuarios = [], initialData }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    taxId: '',
    address: '',
    contactPerson: '',
    responsibleId: '',
    status: 'ACTIVE' as ClientStatus
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const isEditing = !!initialData;

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        email: initialData.email || '',
        phone: initialData.phone || '',
        taxId: initialData.taxId || '',
        address: initialData.address || '',
        contactPerson: initialData.contactPerson || '',
        responsibleId: initialData.responsibleId || '',
        status: (initialData.status as ClientStatus) || 'ACTIVE'
      });
    }
  }, [initialData]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'El Nombre Fiscal es obligatorio.';
    
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
          CIF / NIF
        </label>
        <input
          type="text"
          value={formData.taxId}
          onChange={(e) => setFormData({...formData, taxId: e.target.value})}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-elio-yellow/50 outline-none transition-all"
          placeholder="B-12345678"
        />
      </div>

      {/* Email & Phone in 2 columns */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-elio-yellow/50 outline-none"
            placeholder="contacto@empresa.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Teléfono
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({...formData, phone: e.target.value})}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-elio-yellow/50 outline-none"
            placeholder="+34 900 000 000"
          />
        </div>
      </div>

      {/* Address */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Dirección Fiscal
        </label>
        <input
          type="text"
          value={formData.address}
          onChange={(e) => setFormData({...formData, address: e.target.value})}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-elio-yellow/50 outline-none"
          placeholder="Calle Principal 123, 28001 Madrid"
        />
      </div>

      {/* Contact Person */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Persona de Contacto
        </label>
        <input
          type="text"
          value={formData.contactPerson}
          onChange={(e) => setFormData({...formData, contactPerson: e.target.value})}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-elio-yellow/50 outline-none"
          placeholder="Juan García"
        />
      </div>

      {/* Responsible Select */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Responsable Interno
        </label>
        <select
          value={formData.responsibleId}
          onChange={(e) => setFormData({...formData, responsibleId: e.target.value})}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-elio-yellow/50 outline-none"
        >
          <option value="">Seleccionar empleado...</option>
          {usuarios.map(user => (
            <option key={user.id} value={user.id}>{user.name} ({user.role})</option>
          ))}
        </select>
      </div>

      {/* Status Select */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
        <select
          value={formData.status}
          onChange={(e) => setFormData({...formData, status: e.target.value as ClientStatus})}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-elio-yellow/50 outline-none"
        >
          <option value="ACTIVE">Activo (Normal)</option>
          <option value="RISK">En Riesgo (Atención Prioritaria)</option>
          <option value="PAUSED">En Pausa</option>
          <option value="CHURNED">Baja</option>
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
          {isEditing ? 'Guardar Cambios' : 'Crear Cliente'}
        </button>
      </div>
    </form>
  );
};