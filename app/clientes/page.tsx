import React, { useState, useEffect, useRef } from 'react';
import { getResponsibleName } from '../../lib/mock-data';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { ClientForm } from '../../components/ClientForm';
import { ClientDetailPage } from './ClientDetailPage';
import { Plus, Search, MoreVertical, AlertTriangle, Edit, Trash2, Eye } from 'lucide-react';
import { Client } from '../../types';

export const ClientsPage = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [clientToEdit, setClientToEdit] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Simular usuario actual (en producción vendría del contexto de auth)
  const currentUser = { id: '1', role: 'ADMIN', name: 'Admin' };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [clientesRes, usuariosRes] = await Promise.all([
          fetch('/api/clientes'),
          fetch('/api/usuarios')
        ]);
        
        if (!clientesRes.ok) {
          throw new Error(`Error en la API: ${clientesRes.statusText}`);
        }
        
        const [clientesData, usuariosData] = await Promise.all([
          clientesRes.json(),
          usuariosRes.ok ? usuariosRes.json() : []
        ]);
        
        const clientesFormateados: Client[] = clientesData.map((cliente: any) => ({
          id: cliente.id,
          name: cliente.name,
          fiscalData: { taxId: cliente.taxId || '' },
          status: cliente.status || 'ACTIVE',
          responsibleId: cliente.responsibleId || '',
          lastActivity: cliente.lastActivity || 'Sin actividad',
          email: cliente.email,
          phone: cliente.phone,
          address: cliente.address,
          contactPerson: cliente.contactPerson,
          credentials: []
        }));
        
        setClients(clientesFormateados);
        setUsuarios(usuariosData);
      } catch (err: any) {
        setError(err.message || 'Error desconocido al cargar clientes.');
        console.error("Fallo al obtener clientes reales:", err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCreateClient = async (data: any) => {
    try {
      const response = await fetch('/api/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          email: data.email || null,
          phone: data.phone || null,
          taxId: data.taxId || null,
          address: data.address || null,
          contactPerson: data.contactPerson || null,
          status: data.status || 'ACTIVE',
          responsibleId: data.responsibleId || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al crear cliente');
      }

      const nuevoCliente = await response.json();
      
      const clienteFormateado: Client = {
        id: nuevoCliente.id,
        name: nuevoCliente.name,
        fiscalData: { taxId: nuevoCliente.taxId },
        status: nuevoCliente.status,
        responsibleId: nuevoCliente.responsibleId || '',
        lastActivity: nuevoCliente.lastActivity || 'Ahora mismo',
        email: nuevoCliente.email,
        phone: nuevoCliente.phone,
        address: nuevoCliente.address,
        contactPerson: nuevoCliente.contactPerson,
        credentials: []
      };
      
      setClients([clienteFormateado, ...clients]);
      setIsModalOpen(false);
    } catch (err: any) {
      console.error('Error al crear cliente:', err);
      alert('Error al crear cliente: ' + err.message);
    }
  };

  const handleEditClient = async (data: any) => {
    if (!clientToEdit) return;
    
    try {
      const response = await fetch('/api/clientes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: clientToEdit.id,
          name: data.name,
          email: data.email || null,
          phone: data.phone || null,
          taxId: data.taxId || null,
          address: data.address || null,
          contactPerson: data.contactPerson || null,
          status: data.status || 'ACTIVE',
          responsibleId: data.responsibleId || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al editar cliente');
      }

      const clienteActualizado = await response.json();
      
      const clienteFormateado: Client = {
        id: clienteActualizado.id,
        name: clienteActualizado.name,
        fiscalData: { taxId: clienteActualizado.taxId },
        status: clienteActualizado.status,
        responsibleId: clienteActualizado.responsibleId || '',
        lastActivity: clienteActualizado.lastActivity || 'Editado hace un momento',
        email: clienteActualizado.email,
        phone: clienteActualizado.phone,
        address: clienteActualizado.address,
        contactPerson: clienteActualizado.contactPerson,
        credentials: []
      };
      
      setClients(clients.map(c => c.id === clienteFormateado.id ? clienteFormateado : c));
      setIsEditModalOpen(false);
      setClientToEdit(null);
    } catch (err: any) {
      console.error('Error al editar cliente:', err);
      alert('Error al editar cliente: ' + err.message);
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    if (!confirm('¿Estás seguro de eliminar este cliente? Esta acción no se puede deshacer.')) return;
    
    try {
      const response = await fetch('/api/clientes', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: clientId }),
      });

      if (!response.ok) {
        throw new Error('Error al eliminar cliente');
      }

      setClients(clients.filter(c => c.id !== clientId));
      setOpenMenuId(null);
    } catch (err: any) {
      console.error('Error al eliminar cliente:', err);
      alert('Error al eliminar cliente: ' + err.message);
    }
  };

  const openEditModal = (client: Client) => {
    setClientToEdit(client);
    setIsEditModalOpen(true);
    setOpenMenuId(null);
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
        usuarios={usuarios}
        currentUser={currentUser}
        onClientUpdate={(updatedClient) => {
          setClients(clients.map(c => c.id === updatedClient.id ? updatedClient : c));
        }}
      />
    );
  }

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
      <Card noPadding className="overflow-visible">
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
            {clients.length === 0 && !isLoading ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  <p>No se encontraron clientes. ¡Crea el primero!</p>
                </td>
              </tr>
            ) : (
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
                    <div className="relative" ref={openMenuId === client.id ? menuRef : null}>
                      <button 
                        className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(openMenuId === client.id ? null : client.id);
                        }}
                      >
                        <MoreVertical size={18} />
                      </button>
                      
                      {/* Dropdown Menu */}
                      {openMenuId === client.id && (
                        <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedClientId(client.id);
                              setOpenMenuId(null);
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                          >
                            <Eye size={16} className="mr-2 text-gray-400" />
                            Ver Detalles
                          </button>
                          
                          {/* Solo mostrar editar si es admin */}
                          {currentUser.role === 'ADMIN' && (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEditModal(client);
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                              >
                                <Edit size={16} className="mr-2 text-blue-500" />
                                Editar Cliente
                              </button>
                              <hr className="my-1 border-gray-100" />
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteClient(client.id);
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center"
                              >
                                <Trash2 size={16} className="mr-2" />
                                Eliminar Cliente
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
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
          usuarios={usuarios}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal 
        isOpen={isEditModalOpen} 
        onClose={() => {
          setIsEditModalOpen(false);
          setClientToEdit(null);
        }} 
        title="Editar Cliente"
      >
        <ClientForm 
          onSubmit={handleEditClient} 
          onCancel={() => {
            setIsEditModalOpen(false);
            setClientToEdit(null);
          }}
          usuarios={usuarios}
          initialData={clientToEdit ? {
            name: clientToEdit.name,
            email: clientToEdit.email || '',
            phone: clientToEdit.phone || '',
            taxId: clientToEdit.fiscalData?.taxId || '',
            address: clientToEdit.address || '',
            contactPerson: clientToEdit.contactPerson || '',
            status: clientToEdit.status,
            responsibleId: clientToEdit.responsibleId || ''
          } : undefined}
        />
      </Modal>
    </div>
  );
};