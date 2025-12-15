import React, { useState } from 'react';
import { Client, Project, Task, UserProfile } from '../../types';
import { MOCK_PROJECTS, MOCK_TASKS, MOCK_USERS, getResponsibleName } from '../../lib/mock-data';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Tabs } from '../../components/ui/Tabs';
import { 
  ArrowLeft, Edit, Mail, Phone, MapPin, 
  Search, Megaphone, Share2, Globe, Wrench, 
  Briefcase, CheckSquare, Shield, Lock, Eye, EyeOff, Users,
  AlertTriangle
} from 'lucide-react';

interface ClientDetailPageProps {
  client: Client;
  onBack: () => void;
}

export const ClientDetailPage: React.FC<ClientDetailPageProps> = ({ client, onBack }) => {
  const [activeTab, setActiveTab] = useState('overview');

  // --- DERIVED DATA ---
  const clientProjects = MOCK_PROJECTS.filter(p => p.clientId === client.id);
  const clientProjectIds = clientProjects.map(p => p.id);
  const clientTasks = MOCK_TASKS.filter(t => clientProjectIds.includes(t.projectId));
  
  // Find team members associated with these projects (via tasks or direct assignment if we had it)
  // Logic: Find users who have tasks in client projects or are the client responsible
  const teamMemberIds = new Set<string>();
  teamMemberIds.add(client.responsibleId);
  clientTasks.forEach(t => { if(t.assigneeId) teamMemberIds.add(t.assigneeId) });
  const teamMembers = MOCK_USERS.filter(u => teamMemberIds.has(u.id));

  // --- SUB-COMPONENTS ---

  const ServiceIcon = ({ type }: { type: string }) => {
    switch(type) {
      case 'SEO': return <Search size={16} />;
      case 'SEM': return <Megaphone size={16} />;
      case 'SOCIAL': return <Share2 size={16} />;
      case 'WEB': return <Globe size={16} />;
      case 'MAINTENANCE': return <Wrench size={16} />;
      default: return <Briefcase size={16} />;
    }
  };

  const OverviewTab = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <Card title="Datos de Contacto" className="h-full">
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <MapPin className="text-gray-400 mt-1" size={18} />
            <div>
              <p className="text-sm font-medium text-gray-900">{client.address || 'Sin dirección'}</p>
              <p className="text-xs text-gray-500">Sede Fiscal</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Mail className="text-gray-400" size={18} />
            <a href={`mailto:${client.email}`} className="text-sm text-blue-600 hover:underline">{client.email || 'Sin email'}</a>
          </div>
          <div className="flex items-center space-x-3">
            <Phone className="text-gray-400" size={18} />
            <p className="text-sm text-gray-700">{client.phone || 'Sin teléfono'}</p>
          </div>
          <div className="pt-4 border-t border-gray-50 mt-4">
            <p className="text-xs text-gray-500 uppercase font-bold mb-1">Persona de Contacto</p>
            <p className="text-sm font-medium text-gray-900">{client.contactPerson || 'No especificado'}</p>
          </div>
        </div>
      </Card>

      <Card title="Contrato Vigente" className="h-full">
        {client.contract ? (
           <div className="space-y-6">
             <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                <div>
                   <p className="text-xs text-gray-500 uppercase">Periodo</p>
                   <p className="text-sm font-bold text-gray-800">{client.contract.startDate} - {client.contract.endDate}</p>
                </div>
                <Badge variant={client.status === 'ACTIVE' ? 'success' : 'warning'}>{client.status}</Badge>
             </div>

             <div>
               <p className="text-xs text-gray-500 uppercase font-bold mb-3">Servicios Contratados</p>
               <div className="flex flex-wrap gap-2">
                 {client.contract.services.map(svc => (
                   <span key={svc} className="flex items-center px-3 py-1 bg-elio-smoke text-gray-700 rounded-full text-xs font-medium border border-gray-200">
                     <span className="mr-2 text-elio-yellow"><ServiceIcon type={svc} /></span>
                     {svc}
                   </span>
                 ))}
               </div>
             </div>

             <div>
                <div className="flex justify-between text-sm mb-1">
                   <span className="text-gray-600">Consumo de Horas (Mes)</span>
                   <span className="font-bold text-gray-900">22 / {client.contract.monthlyHours} h</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5">
                  <div className="bg-elio-yellow h-2.5 rounded-full" style={{ width: '55%' }}></div>
                </div>
                <p className="text-xs text-gray-400 mt-1 text-right">55% consumido</p>
             </div>
           </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-40 text-gray-400">
             <AlertTriangle size={32} className="mb-2 opacity-50"/>
             <p>Sin contrato activo vinculado.</p>
          </div>
        )}
      </Card>
    </div>
  );

  const ProjectsTab = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {clientProjects.map(project => (
          <div key={project.id} className="bg-white p-4 rounded-xl border border-gray-200 hover:shadow-md transition-all">
             <div className="flex justify-between items-start mb-2">
                <Badge variant="blue">{project.status}</Badge>
                <span className="text-xs text-gray-400">{project.deadline}</span>
             </div>
             <h4 className="font-bold text-gray-900">{project.title}</h4>
             <p className="text-sm text-gray-500 mt-1">{project.tags?.join(', ')}</p>
          </div>
        ))}
        {clientProjects.length === 0 && <p className="text-gray-400 italic">No hay proyectos activos.</p>}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
         <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 font-bold text-gray-700 text-sm">
           Últimas Tareas
         </div>
         <table className="w-full text-sm text-left">
           <thead className="bg-gray-50/50 text-gray-500">
             <tr>
               <th className="px-6 py-3 font-medium">Tarea</th>
               <th className="px-6 py-3 font-medium">Estado</th>
               <th className="px-6 py-3 font-medium">Responsable</th>
             </tr>
           </thead>
           <tbody className="divide-y divide-gray-100">
             {clientTasks.slice(0, 5).map(task => (
               <tr key={task.id}>
                 <td className="px-6 py-3 font-medium text-gray-900">{task.title}</td>
                 <td className="px-6 py-3"><Badge>{task.status}</Badge></td>
                 <td className="px-6 py-3 text-gray-600">{getResponsibleName(task.assigneeId || '')}</td>
               </tr>
             ))}
             {clientTasks.length === 0 && (
               <tr><td colSpan={3} className="px-6 py-4 text-center text-gray-400">Sin tareas recientes.</td></tr>
             )}
           </tbody>
         </table>
      </div>
    </div>
  );

  const CredentialsTab = () => {
    // Local state for visibility toggle per credential row
    const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

    const toggleVisibility = (id: string) => {
      setVisiblePasswords(prev => ({ ...prev, [id]: !prev[id] }));
    };

    return (
      <Card title="Bóveda de Credenciales" action={<button className="text-xs bg-elio-black text-white px-3 py-1 rounded">Añadir</button>}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-gray-500 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 font-medium">Plataforma</th>
                <th className="px-4 py-3 font-medium">Usuario / Login</th>
                <th className="px-4 py-3 font-medium">Contraseña</th>
                <th className="px-4 py-3 font-medium">Notas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {client.credentials?.map(cred => (
                <tr key={cred.id} className="group hover:bg-gray-50">
                  <td className="px-4 py-3 flex items-center font-medium text-gray-900">
                    <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center mr-3 text-gray-500">
                       <Lock size={14} />
                    </div>
                    {cred.platform}
                  </td>
                  <td className="px-4 py-3 text-gray-600 font-mono select-all">{cred.username}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-2">
                       <code className="bg-gray-100 px-2 py-1 rounded text-xs text-gray-700 font-mono">
                         {visiblePasswords[cred.id] ? cred.passwordEncrypted : '••••••••••••'}
                       </code>
                       <button 
                         onClick={() => toggleVisibility(cred.id)}
                         className="text-gray-400 hover:text-gray-600 transition-colors"
                       >
                         {visiblePasswords[cred.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                       </button>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 italic text-xs">{cred.notes}</td>
                </tr>
              ))}
              {(!client.credentials || client.credentials.length === 0) && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                    <Shield size={24} className="mx-auto mb-2 opacity-20" />
                    No hay credenciales guardadas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    );
  };

  const TeamTab = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
       {teamMembers.map(user => (
         <div key={user.id} className="bg-white p-6 rounded-xl border border-gray-200 flex items-center space-x-4">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-600 text-lg border border-white shadow-sm">
               {user.name.charAt(0)}
            </div>
            <div>
               <p className="font-bold text-gray-900">{user.name}</p>
               <p className="text-xs text-gray-500 uppercase">{user.role}</p>
               {user.id === client.responsibleId && (
                 <span className="inline-block mt-1 px-2 py-0.5 bg-yellow-100 text-yellow-800 text-[10px] font-bold rounded-full">Account Manager</span>
               )}
            </div>
         </div>
       ))}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-4">
          <button onClick={onBack} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500">
             <ArrowLeft size={20} />
          </button>
          <div>
             <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
               {client.name}
               {client.status === 'RISK' && <Badge variant="warning">RIESGO</Badge>}
               {client.status === 'ACTIVE' && <Badge variant="success">ACTIVO</Badge>}
             </h1>
             <div className="flex items-center text-gray-500 text-sm mt-1 space-x-3">
               <span>{client.fiscalData.taxId}</span>
               <span>•</span>
               <span className="flex items-center"><Users size={12} className="mr-1"/> Lead: {getResponsibleName(client.responsibleId)}</span>
             </div>
          </div>
        </div>
        
        <button className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center space-x-2 shadow-sm">
          <Edit size={16} />
          <span>Editar Cliente</span>
        </button>
      </div>

      {/* Tabs Navigation */}
      <Tabs 
        activeTab={activeTab} 
        onChange={setActiveTab}
        tabs={[
          { id: 'overview', label: 'Visión General', icon: Briefcase },
          { id: 'projects', label: 'Tareas y Proyectos', icon: CheckSquare },
          { id: 'credentials', label: 'Accesos y Claves', icon: Shield },
          { id: 'team', label: 'Equipo Asignado', icon: Users },
        ]}
      />

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'projects' && <ProjectsTab />}
        {activeTab === 'credentials' && <CredentialsTab />}
        {activeTab === 'team' && <TeamTab />}
      </div>
    </div>
  );
};