import React, { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { MOCK_USERS } from '../../lib/mock-data';
import { UserProfile } from '../../types';
import { 
  Users, 
  Clock, 
  Calendar, 
  ArrowLeft, 
  Briefcase, 
  Mail, 
  Shield, 
  CheckCircle2, 
  AlertCircle,
  TrendingUp
} from 'lucide-react';

// --- MOCK DATA GENERATOR FOR TIME LOGS ---
const generateTimeLogs = (userId: string) => {
  const logs = [];
  const today = new Date();
  
  // Generate logs for the last 5 days
  for (let i = 0; i < 5; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
    
    // Randomize hours slightly
    const entryHour = 9 + Math.floor(Math.random() * 2); // 9 or 10
    const exitHour = 17 + Math.floor(Math.random() * 3); // 17, 18 or 19
    const totalHours = exitHour - entryHour;
    
    logs.push({
      id: `log-${i}`,
      date: dateStr,
      entry: `${entryHour}:00`,
      exit: `${exitHour}:00`,
      total: `${totalHours}h`,
      status: totalHours >= 8 ? 'CUMPLIDO' : 'PARCIAL',
      project: i % 2 === 0 ? 'Gestión Interna' : 'Cliente TechSolutions'
    });
  }
  return logs;
};

export const TeamPage = () => {
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  // --- VISTA: DETALLE DE EMPLEADO (FICHA) ---
  if (selectedUser) {
    const timeLogs = generateTimeLogs(selectedUser.id);
    
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
        {/* Navigation Header */}
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => setSelectedUser(null)}
            className="p-2 hover:bg-white rounded-full transition-colors text-slate-500 shadow-sm border border-transparent hover:border-slate-200"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
             <h1 className="text-2xl font-bold text-slate-900">Ficha de Empleado</h1>
             <p className="text-slate-500 text-sm">Detalles operativos y control de presencia.</p>
          </div>
        </div>

        {/* Profile Header Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
           <div className="flex items-center space-x-6">
              <div className="w-20 h-20 rounded-full bg-elio-black text-white flex items-center justify-center text-3xl font-bold shadow-lg shadow-slate-200">
                 {selectedUser.name.charAt(0)}
              </div>
              <div>
                 <h2 className="text-2xl font-bold text-slate-900">{selectedUser.name}</h2>
                 <div className="flex flex-wrap gap-2 mt-2">
                    <Badge variant="blue">{selectedUser.position}</Badge>
                    <Badge variant="neutral">{selectedUser.role}</Badge>
                 </div>
                 <div className="flex items-center gap-4 mt-3 text-sm text-slate-500">
                    <span className="flex items-center"><Mail size={14} className="mr-1"/> {selectedUser.email}</span>
                    <span className="flex items-center"><Calendar size={14} className="mr-1"/> Alta: {selectedUser.joinDate}</span>
                 </div>
              </div>
           </div>
           
           <div className="flex gap-4 w-full md:w-auto">
              <div className="flex-1 md:flex-none bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
                 <p className="text-xs text-slate-500 uppercase font-bold">Horas Mes</p>
                 <p className="text-xl font-bold text-slate-900">142h</p>
              </div>
              <div className="flex-1 md:flex-none bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
                 <p className="text-xs text-slate-500 uppercase font-bold">Productividad</p>
                 <p className="text-xl font-bold text-green-600">94%</p>
              </div>
           </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           
           {/* Left Column: Time Logs */}
           <div className="lg:col-span-2 space-y-6">
              <Card title="Registro Horario (Últimos 5 días)" className="overflow-hidden">
                 <div className="overflow-x-auto">
                   <table className="w-full text-sm text-left">
                     <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
                       <tr>
                         <th className="px-6 py-3">Fecha</th>
                         <th className="px-6 py-3">Entrada / Salida</th>
                         <th className="px-6 py-3">Proyecto Principal</th>
                         <th className="px-6 py-3 text-right">Total</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                       {timeLogs.map(log => (
                         <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                           <td className="px-6 py-4 font-medium text-slate-700">
                             <div className="flex items-center">
                               <Calendar size={14} className="mr-2 text-slate-400"/>
                               {log.date}
                             </div>
                           </td>
                           <td className="px-6 py-4">
                             <div className="flex items-center gap-2 text-slate-600">
                               <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-xs">{log.entry}</span>
                               <span className="text-slate-300">➜</span>
                               <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-xs">{log.exit}</span>
                             </div>
                           </td>
                           <td className="px-6 py-4 text-slate-600">
                              <span className="flex items-center"><Briefcase size={14} className="mr-2 text-slate-400"/> {log.project}</span>
                           </td>
                           <td className="px-6 py-4 text-right">
                             <div className="flex flex-col items-end">
                               <span className="font-bold text-slate-900">{log.total}</span>
                               {log.status === 'CUMPLIDO' ? (
                                  <span className="text-[10px] text-green-600 font-bold flex items-center"><CheckCircle2 size={10} className="mr-1"/> Completo</span>
                               ) : (
                                  <span className="text-[10px] text-orange-500 font-bold flex items-center"><AlertCircle size={10} className="mr-1"/> Parcial</span>
                               )}
                             </div>
                           </td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                 </div>
              </Card>
           </div>

           {/* Right Column: KPIs & Actions */}
           <div className="space-y-6">
              <Card title="Estado Actual">
                 <div className="flex items-center space-x-3 mb-4 p-3 bg-green-50 border border-green-100 rounded-lg">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-bold text-green-800">Activo Ahora</span>
                 </div>
                 <div className="space-y-4">
                    <div>
                       <p className="text-xs text-slate-400 uppercase font-bold mb-1">Última Actividad</p>
                       <p className="text-sm font-medium text-slate-700">Hace 12 minutos en <span className="text-slate-900 font-bold">Proyecto Webflow</span></p>
                    </div>
                    <div>
                       <p className="text-xs text-slate-400 uppercase font-bold mb-1">Dispositivo</p>
                       <p className="text-sm font-medium text-slate-700">MacBook Pro 16" (Oficina)</p>
                    </div>
                 </div>
              </Card>

              <Card title="Acciones Rápidas">
                 <div className="space-y-2">
                    <button className="w-full text-left px-4 py-3 bg-slate-50 hover:bg-white border border-slate-100 hover:border-slate-300 rounded-lg text-sm font-medium transition-all text-slate-700 flex items-center">
                       <Shield size={16} className="mr-3 text-slate-400"/> Editar Permisos
                    </button>
                    <button className="w-full text-left px-4 py-3 bg-slate-50 hover:bg-white border border-slate-100 hover:border-slate-300 rounded-lg text-sm font-medium transition-all text-slate-700 flex items-center">
                       <TrendingUp size={16} className="mr-3 text-slate-400"/> Ver Informe de Rendimiento
                    </button>
                 </div>
              </Card>
           </div>

        </div>
      </div>
    );
  }

  // --- VISTA: LISTA DE EQUIPO (DEFAULT) ---
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
       <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Directorio de Equipo</h1>
          <p className="text-slate-500 text-sm">Gestión de personal y auditoría de tiempos.</p>
        </div>
        <button className="bg-elio-black text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors flex items-center space-x-2 text-sm font-bold shadow-sm">
           <Users size={16} />
           <span>Añadir Miembro</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {MOCK_USERS.map(user => (
           <div 
             key={user.id} 
             onClick={() => setSelectedUser(user)}
             className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg hover:border-elio-yellow/50 transition-all cursor-pointer group relative overflow-hidden"
           >
              <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                 <ArrowLeft size={16} className="rotate-180 text-elio-yellow" />
              </div>

              <div className="flex items-center space-x-4 mb-4">
                 <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-xl font-bold text-slate-600 group-hover:bg-elio-black group-hover:text-white transition-colors">
                    {user.name.charAt(0)}
                 </div>
                 <div>
                    <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{user.name}</h3>
                    <p className="text-xs text-slate-500 uppercase font-medium">{user.role}</p>
                 </div>
              </div>

              <div className="space-y-2 border-t border-slate-50 pt-4">
                 <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Cargo</span>
                    <span className="font-medium text-slate-900">{user.position}</span>
                 </div>
                 <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Email</span>
                    <span className="font-medium text-slate-900 truncate max-w-[150px]">{user.email}</span>
                 </div>
              </div>
              
              <div className="mt-4 pt-3 flex items-center justify-between text-xs font-bold text-slate-400 bg-slate-50 rounded-lg px-3 py-2">
                 <span className="flex items-center"><Clock size={12} className="mr-1"/> 8h Hoy</span>
                 <span className="text-green-600">Activo</span>
              </div>
           </div>
         ))}
      </div>
    </div>
  );
};