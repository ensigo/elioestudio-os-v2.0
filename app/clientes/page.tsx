import React, { useState, useEffect } from 'react';
import { getResponsibleName } from '../../lib/mock-data';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { ClientForm } from '../../components/ClientForm';
import { ClientDetailPage } from './ClientDetailPage';
import { Plus, Search, MoreVertical, AlertTriangle } from 'lucide-react';
import { Client } from '../../types';

export const ClientsPage = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null); // <-- CORREGIDO Y COMPLETO
  // View State for "Routing"
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  // --- NUEVA LÓGICA: CARGAR DATOS DE LA API REAL ---
  useEffect(() => {
    const fetchClients = async () => {
      try {
        // Llama a la API serverless que creamos en api/clientes.ts
        const response = await fetch('/api/clientes'); 
        
        if (!response.ok) {
          throw new Error(`Error en la API: ${response.statusText}`);
        }
        
        const data: Client[] = await response.json();
        setClients(data);
      } catch (err: any) {
        setError(err.message || 'Error desconocido al cargar clientes.');
        console.error("Fallo al obtener clientes reales:", err);
      } finally {
        setIsLoading(false); // La carga terminó (falle o tenga éxito)
      }
    };
    
    fetchClients();
  }, []); 
  // --- FIN LÓGICA DE CARGA ---

  const handleCreateClient = (data: any) => {
    const newClient: Client = {
      id: `c${Date.now()}`,
      name: data.name,
      fiscalData: { taxId: data.taxId },
      status: data.status,
      responsibleId: data.responsibleId,
      lastActivity: 'Ahora mismo',
      // Default empty arrays for new client
      contract: undefined,
      credentials: []
    };
    setClients([...clients, newClient]);
    setIsModalOpen(false);
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'ACTIVE': return <Badge variant="success">Activo</Badge>;
      case 'RISK': return <Badge variant="warning">Riesgo</Badge>;
      case 'PAUSED': return <Badge variant="neutral">Pausa</Badge>;
      case 'CHURNED': return <Badge variant="danger">Baja</Badge>;
      default: return <Badge>Desconocido</Badge>;
    }
  };

  // --- RENDER DETAIL VIEW ---
  if (selectedClientId) {
    const selectedClient = clients.find(c => c.id === selectedClientId);
    if (!selectedClient) return <div>Error: Cliente no encontrado</div>;
    
    return (
      <ClientDetailPage 
        client={selectedClient} 
        onBack={() => setSelectedClientId(null)} 
      />
    );
  }
// --- AÑADIR CONDICIONES DE CARGA Y ERROR AQUÍ ---
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <p className="text-xl text-elio-yellow animate-pulse">Cargando clientes reales de Neon...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-96 bg-red-50 p-6 rounded-lg border border-red-200">
        <AlertTriangle size={24} className="text-red-500 mr-3" />
        <p className="text-red-700 font-medium">Error al conectar con la base de datos: {error}</p>
      </div>
    );
  }
  // --- FIN DE CONDICIONES DE CARGA Y ERROR ---
  // --- RENDER LIST VIEW ---
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
           <h1 className="text-2xl font-bold text-gray-900">Cartera de Clientes</h1>
           <p className="text-gray-500 text-sm">Gestión de relaciones comerciales y estado de cuentas.</p>
        </div>
        <div className="flex space-x-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Buscar cliente..." 
              className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-elio-yellow w-full sm:w-64"
            />
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-2 bg-elio-yellow text-white px-4 py-2 rounded-lg hover:bg-elio-yellow-hover transition-colors font-medium shadow-sm"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">Nuevo Cliente</span>
          </button>
        </div>
      </div>

      {/* Clients Table */}
      <Card noPadding className="overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
             <tr>
               <th className="px-6 py-4 font-semibold text-gray-600">Cliente / Razón Social</th>
               <th className="px-6 py-4 font-semibold text-gray-600">Responsable</th>
               <th className="px-6 py-4 font-semibold text-gray-600">Estado</th>
               <th className="px-6 py-4 font-semibold text-gray-600">Última Actividad</th>
               <th className="px-6 py-4 font-semibold text-gray-600 text-right">Acciones</th>
             </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {/* Si no hay clientes reales, muestra un mensaje */}
            {clients.length === 0 && !isLoading ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  <p>No se encontraron clientes. ¡Crea el primero!</p>
                </td>
              </tr>
            ) : (
              // Mapea los clientes reales si los hay
              clients.map(client => (
                <tr 
                  key={client.id} 
                  onClick={() => setSelectedClientId(client.id)}
                  className={`group hover:bg-gray-50 transition-colors cursor-pointer ${
                    client.status === 'RISK' ? 'bg-orange-50/50 border-l-4 border-l-orange-400' : 'border-l-4 border-l-transparent'
                  }`}
                >
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-gray-900 group-hover:text-elio-yellow-hover transition-colors">{client.name}</span>
                      <span className="text-xs text-gray-400">{client.fiscalData.taxId}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-600 border border-white shadow-sm">
                        {getResponsibleName(client.responsibleId).charAt(0)}
                      </div>
                      <span className="text-gray-700">{getResponsibleName(client.responsibleId)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(client.status)}
                    {client.status === 'RISK' && (
                      <span className="ml-2 text-[10px] font-medium text-orange-600 flex items-center inline-flex animate-pulse">
                        <AlertTriangle size={10} className="mr-1" /> Revisar Contrato
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {client.lastActivity}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors" onClick={(e) => e.stopPropagation()}>
                      <MoreVertical size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>

      {/* Creation Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Dar de Alta Nuevo Cliente"
      >
        <ClientForm 
          onSubmit={handleCreateClient} 
          onCancel={() => setIsModalOpen(false)} 
        />
      </Modal>
    </div>
  );
};