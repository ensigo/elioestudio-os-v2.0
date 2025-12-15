'use client';
import React, { useState } from 'react';
import { Clock, CheckCircle, AlertTriangle, X, TrendingUp, User, Briefcase, Calendar } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';

// --- MOCK DATA ESTRUCTURADA ---
const SUMMARY_DATA = {
  Semana: {
    kpis: { hours: 142, tasks: 48, risk: 1 },
    chart: [
      { name: 'Alejandro Magno', hours: 38, percentage: 95 },
      { name: 'Elena Nito', hours: 42, percentage: 100 },
      { name: 'Aitor Tilla', hours: 15, percentage: 35 },
    ]
  },
  Mes: {
    kpis: { hours: 580, tasks: 195, risk: 2 },
    chart: [
      { name: 'Alejandro Magno', hours: 160, percentage: 100 },
      { name: 'Elena Nito', hours: 165, percentage: 100 },
      { name: 'Aitor Tilla', hours: 140, percentage: 85 },
    ]
  }
};

const DRILL_DOWN_DATA = {
  hours: [
    { id: 1, member: 'Alejandro Magno', logged: 38, compliance: 95, mainProject: 'E-commerce Nike' },
    { id: 2, member: 'Elena Nito', logged: 42, compliance: 105, mainProject: 'Gestión Interna' },
    { id: 3, member: 'Aitor Tilla', logged: 15, compliance: 35, mainProject: 'API Integración' },
    { id: 4, member: 'Ana Tomía', logged: 40, compliance: 100, mainProject: 'Rebranding Web' },
  ],
  tasks: [
    { id: 1, title: 'Wireframes Home v2', assignee: 'Ana Tomía', status: 'ON_TIME', endDate: '12/12/2023' },
    { id: 2, title: 'Fix Bug Pasarela Pago', assignee: 'Aitor Tilla', status: 'LATE', endDate: '10/12/2023' },
    { id: 3, title: 'Reunión Kickoff', assignee: 'Elena Nito', status: 'ON_TIME', endDate: '13/12/2023' },
    { id: 4, title: 'Despliegue Producción', assignee: 'Alejandro Magno', status: 'ON_TIME', endDate: '14/12/2023' },
  ],
  risk: [
    { id: 1, project: 'Restaurante La Abuela', issue: 'Presupuesto excedido (110%)', severity: 'HIGH' },
    { id: 2, project: 'Startup Unicornio', issue: 'Deadline en riesgo por falta de assets', severity: 'MEDIUM' },
  ]
};

export default function ReportesPage() {
  const [periodo, setPeriodo] = useState<'Semana' | 'Mes'>('Semana');
  const [selectedKpi, setSelectedKpi] = useState<'hours' | 'tasks' | 'risk' | null>(null);

  const currentSummary = SUMMARY_DATA[periodo];

  // Renderizado condicional del contenido del modal
  const renderModalContent = () => {
    switch(selectedKpi) {
      case 'hours':
        return (
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-medium">
              <tr>
                <th className="px-4 py-3">Miembro</th>
                <th className="px-4 py-3 text-center">Horas</th>
                <th className="px-4 py-3 text-center">% Cumplimiento</th>
                <th className="px-4 py-3">Proyecto Principal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {DRILL_DOWN_DATA.hours.map(row => (
                <tr key={row.id}>
                  <td className="px-4 py-3 font-medium text-slate-900">{row.member}</td>
                  <td className="px-4 py-3 text-center font-mono">{row.logged}h</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${row.compliance < 80 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                      {row.compliance}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600 truncate">{row.mainProject}</td>
                </tr>
              ))}
            </tbody>
          </table>
        );
      case 'tasks':
        return (
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-medium">
              <tr>
                <th className="px-4 py-3">Tarea</th>
                <th className="px-4 py-3">Responsable</th>
                <th className="px-4 py-3 text-center">Estado</th>
                <th className="px-4 py-3 text-right">Fecha Fin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {DRILL_DOWN_DATA.tasks.map(row => (
                <tr key={row.id}>
                  <td className="px-4 py-3 font-medium text-slate-900 truncate max-w-[150px]">{row.title}</td>
                  <td className="px-4 py-3 text-slate-600 flex items-center gap-2">
                    <User size={14} className="text-slate-400"/> {row.assignee}
                  </td>
                  <td className="px-4 py-3 text-center">
                     {row.status === 'LATE' ? (
                       <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded border border-red-100">Retrasada</span>
                     ) : (
                       <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded border border-green-100">A tiempo</span>
                     )}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-xs text-slate-500">{row.endDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        );
      case 'risk':
        return (
          <div className="space-y-4 p-2">
            {DRILL_DOWN_DATA.risk.map(row => (
              <div key={row.id} className="bg-red-50 border border-red-100 p-4 rounded-lg flex items-start gap-3">
                <AlertTriangle className="text-red-500 mt-1 flex-shrink-0" size={20} />
                <div>
                  <h4 className="font-bold text-red-800">{row.project}</h4>
                  <p className="text-sm text-red-600 mt-1">{row.issue}</p>
                  <div className="mt-2">
                    <Badge variant="danger">{row.severity}</Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );
      default: return null;
    }
  };

  const getModalTitle = () => {
    switch(selectedKpi) {
      case 'hours': return 'Desglose de Horas por Equipo';
      case 'tasks': return 'Detalle de Tareas Entregadas';
      case 'risk': return 'Alertas de Riesgo Activas';
      default: return '';
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto relative">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
         <h1 className="text-2xl font-bold text-slate-900">Auditoría de Rendimiento</h1>
         <div className="flex bg-slate-100 rounded-lg p-1">
            <button 
              onClick={() => setPeriodo('Semana')}
              className={`px-3 py-1 text-sm font-medium rounded transition-all ${periodo === 'Semana' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Semana
            </button>
            <button 
              onClick={() => setPeriodo('Mes')}
              className={`px-3 py-1 text-sm font-medium rounded transition-all ${periodo === 'Mes' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Mes
            </button>
         </div>
      </div>

      {/* KPIs Interactivos (Drill-down) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
         <div 
            onClick={() => setSelectedKpi('hours')}
            className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm cursor-pointer hover:border-blue-400 hover:shadow-md transition-all group relative overflow-hidden"
         >
            <div className="flex items-center gap-3 mb-2 text-slate-500 group-hover:text-blue-600"><Clock size={18} /> Horas Totales</div>
            <p className="text-3xl font-bold text-slate-900">{currentSummary.kpis.hours}h <span className="text-sm font-normal text-green-500">+12%</span></p>
            <div className="absolute bottom-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Briefcase size={40} /></div>
            <p className="text-xs text-slate-400 mt-2 flex items-center gap-1 group-hover:text-blue-500">Ver detalle <TrendingUp size={12}/></p>
         </div>
         
         <div 
            onClick={() => setSelectedKpi('tasks')}
            className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm cursor-pointer hover:border-yellow-400 hover:shadow-md transition-all group relative overflow-hidden"
         >
            <div className="flex items-center gap-3 mb-2 text-slate-500 group-hover:text-yellow-600"><CheckCircle size={18} /> Tareas Completadas</div>
            <p className="text-3xl font-bold text-slate-900">{currentSummary.kpis.tasks} <span className="text-sm font-normal text-slate-400">/ asignadas</span></p>
            <div className="absolute bottom-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><CheckCircle size={40} /></div>
            <p className="text-xs text-slate-400 mt-2 flex items-center gap-1 group-hover:text-yellow-600">Ver listado <TrendingUp size={12}/></p>
         </div>
         
         <div 
            onClick={() => setSelectedKpi('risk')}
            className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm cursor-pointer hover:border-red-400 hover:shadow-md transition-all group relative overflow-hidden"
         >
            <div className="flex items-center gap-3 mb-2 text-slate-500 group-hover:text-red-500"><AlertTriangle size={18} /> Riesgo Productividad</div>
            <p className={`text-3xl font-bold ${currentSummary.kpis.risk > 0 ? 'text-red-500' : 'text-green-500'}`}>
               {currentSummary.kpis.risk} <span className="text-sm font-normal text-slate-500">Alertas</span>
            </p>
            <div className="absolute bottom-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><AlertTriangle size={40} /></div>
            <p className="text-xs text-slate-400 mt-2 flex items-center gap-1 group-hover:text-red-500">Analizar causas <TrendingUp size={12}/></p>
         </div>
      </div>

      {/* Gráficas Dinámicas */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
         <h3 className="font-bold mb-6 flex items-center gap-2">
            <TrendingUp size={18} className="text-slate-400" />
            Rendimiento Visual ({periodo})
         </h3>
         <div className="space-y-6">
            {currentSummary.chart.map((item, idx) => (
              <div key={idx}>
                 <div className="flex justify-between text-sm mb-1 font-medium text-slate-700">
                    <span>{item.name}</span> 
                    <span>{item.hours}h</span>
                 </div>
                 <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ease-out ${
                        item.percentage < 50 ? 'bg-red-400' : 
                        item.percentage > 100 ? 'bg-yellow-400' : 'bg-slate-900'
                      }`} 
                      style={{width: `${Math.min(item.percentage, 100)}%`}}
                    ></div>
                 </div>
              </div>
            ))}
         </div>
      </div>

      {/* Modal Genérico para KPIs */}
      {selectedKpi && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setSelectedKpi(null)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-lg text-slate-800">{getModalTitle()}</h3>
              <button onClick={() => setSelectedKpi(null)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto">
               {renderModalContent()}
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
               <button onClick={() => setSelectedKpi(null)} className="px-4 py-2 bg-slate-900 text-white rounded text-sm font-medium hover:bg-slate-800">Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}