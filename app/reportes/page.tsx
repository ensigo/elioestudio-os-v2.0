'use client';
import React, { useState, useEffect } from 'react';
import { 
  Clock, CheckCircle, AlertTriangle, X, TrendingUp, User, Briefcase, 
  Calendar, Download, ChevronDown, Activity, UserX, AlertCircle as AlertIcon,
  ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';

interface UsuarioReporte {
  usuario: {
    id: string;
    name: string;
    role: string;
    position: string | null;
  };
  metricas: {
    horasTrabajadas: number;
    horasEsperadas: number;
    porcentajeCumplimiento: number;
    tareasAsignadas: number;
    tareasCompletadas: number;
    tareasPendientes: number;
    tareasVencidas: number;
    tasaCompletado: number;
  };
  alertas: {
    bajaCarga: boolean;
    tareasRetrasadas: boolean;
    sinActividad: boolean;
  };
  ultimaActividad: string | null;
}

interface ResumenGeneral {
  totalHorasTrabajadas: number;
  totalTareasCompletadas: number;
  totalTareasPendientes: number;
  totalTareasVencidas: number;
  usuariosConAlertas: number;
  promedioRendimiento: number;
}

interface ActividadReciente {
  id: string;
  userId: string;
  tarea: string;
  proyecto: string;
  inicio: string;
  fin: string | null;
  duracion: number | null;
}

interface ReporteData {
  periodo: { desde: string; hasta: string };
  resumenGeneral: ResumenGeneral;
  reportePorUsuario: UsuarioReporte[];
  actividadReciente: ActividadReciente[];
}

export default function ReportesPage() {
  const [data, setData] = useState<ReporteData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [periodo, setPeriodo] = useState<'semana' | 'mes'>('semana');
  const [selectedKpi, setSelectedKpi] = useState<'hours' | 'tasks' | 'risk' | null>(null);
  const [selectedUser, setSelectedUser] = useState<UsuarioReporte | null>(null);

  // Cargar datos
  useEffect(() => {
    const fetchReportes = async () => {
      setIsLoading(true);
      try {
        const hasta = new Date();
        const desde = new Date();
        if (periodo === 'semana') {
          desde.setDate(hasta.getDate() - 7);
        } else {
          desde.setDate(hasta.getDate() - 30);
        }

        const response = await fetch(`/api/reportes?desde=${desde.toISOString()}&hasta=${hasta.toISOString()}`);
        if (!response.ok) throw new Error('Error al cargar reportes');
        
        const reporteData = await response.json();
        setData(reporteData);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReportes();
  }, [periodo]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (porcentaje: number) => {
    if (porcentaje >= 90) return 'bg-green-500';
    if (porcentaje >= 70) return 'bg-yellow-500';
    if (porcentaje >= 50) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getAlertCount = (usuario: UsuarioReporte) => {
    let count = 0;
    if (usuario.alertas.bajaCarga) count++;
    if (usuario.alertas.tareasRetrasadas) count++;
    if (usuario.alertas.sinActividad) count++;
    return count;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <p className="text-xl text-elio-yellow animate-pulse">Cargando reportes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-96 bg-red-50 p-6 rounded-lg border border-red-200">
        <AlertTriangle size={24} className="text-red-500 mr-3" />
        <p className="text-red-700 font-medium">Error: {error}</p>
      </div>
    );
  }

  const usuariosConProblemas = data?.reportePorUsuario.filter(u => 
    u.alertas.bajaCarga || u.alertas.tareasRetrasadas || u.alertas.sinActividad
  ) || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Control de Rendimiento</h1>
          <p className="text-gray-500 text-sm">Supervisión de jornadas y productividad del equipo remoto</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 rounded-lg p-1">
            <button 
              onClick={() => setPeriodo('semana')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                periodo === 'semana' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Última Semana
            </button>
            <button 
              onClick={() => setPeriodo('mes')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                periodo === 'mes' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Último Mes
            </button>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800">
            <Download size={16} /> Exportar
          </button>
        </div>
      </div>

      {/* KPIs Principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card 
          className="cursor-pointer hover:border-blue-400 hover:shadow-md transition-all"
          onClick={() => setSelectedKpi('hours')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                <Clock size={14} /> Horas Totales
              </p>
              <p className="text-3xl font-bold text-slate-900 mt-1">
                {Math.round(data?.resumenGeneral.totalHorasTrabajadas || 0)}h
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Promedio: {data?.resumenGeneral.promedioRendimiento || 0}% cumplimiento
              </p>
            </div>
            <div className={`p-3 rounded-xl ${(data?.resumenGeneral.promedioRendimiento || 0) >= 80 ? 'bg-green-100' : 'bg-red-100'}`}>
              {(data?.resumenGeneral.promedioRendimiento || 0) >= 80 
                ? <ArrowUpRight size={24} className="text-green-600" />
                : <ArrowDownRight size={24} className="text-red-600" />
              }
            </div>
          </div>
        </Card>

        <Card 
          className="cursor-pointer hover:border-green-400 hover:shadow-md transition-all"
          onClick={() => setSelectedKpi('tasks')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                <CheckCircle size={14} /> Tareas Completadas
              </p>
              <p className="text-3xl font-bold text-slate-900 mt-1">
                {data?.resumenGeneral.totalTareasCompletadas || 0}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {data?.resumenGeneral.totalTareasPendientes || 0} pendientes
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-xl">
              <CheckCircle size={24} className="text-green-600" />
            </div>
          </div>
        </Card>

        <Card 
          className="cursor-pointer hover:border-orange-400 hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                <AlertIcon size={14} /> Tareas Vencidas
              </p>
              <p className={`text-3xl font-bold mt-1 ${(data?.resumenGeneral.totalTareasVencidas || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {data?.resumenGeneral.totalTareasVencidas || 0}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Requieren atención
              </p>
            </div>
            <div className={`p-3 rounded-xl ${(data?.resumenGeneral.totalTareasVencidas || 0) > 0 ? 'bg-red-100' : 'bg-green-100'}`}>
              <AlertTriangle size={24} className={(data?.resumenGeneral.totalTareasVencidas || 0) > 0 ? 'text-red-600' : 'text-green-600'} />
            </div>
          </div>
        </Card>

        <Card 
          className="cursor-pointer hover:border-red-400 hover:shadow-md transition-all"
          onClick={() => setSelectedKpi('risk')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                <UserX size={14} /> Alertas Equipo
              </p>
              <p className={`text-3xl font-bold mt-1 ${(data?.resumenGeneral.usuariosConAlertas || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {data?.resumenGeneral.usuariosConAlertas || 0}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Usuarios con incidencias
              </p>
            </div>
            <div className={`p-3 rounded-xl ${(data?.resumenGeneral.usuariosConAlertas || 0) > 0 ? 'bg-red-100' : 'bg-green-100'}`}>
              <UserX size={24} className={(data?.resumenGeneral.usuariosConAlertas || 0) > 0 ? 'text-red-600' : 'text-green-600'} />
            </div>
          </div>
        </Card>
      </div>

      {/* Tabla de Rendimiento por Usuario */}
      <Card title="Rendimiento Individual del Equipo" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left font-bold text-slate-600">Miembro</th>
                <th className="px-4 py-3 text-center font-bold text-slate-600">Horas</th>
                <th className="px-4 py-3 text-center font-bold text-slate-600">Cumplimiento</th>
                <th className="px-4 py-3 text-center font-bold text-slate-600">Tareas</th>
                <th className="px-4 py-3 text-center font-bold text-slate-600">Vencidas</th>
                <th className="px-4 py-3 text-center font-bold text-slate-600">Alertas</th>
                <th className="px-4 py-3 text-left font-bold text-slate-600">Última Actividad</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data?.reportePorUsuario.map(reporte => {
                const alertCount = getAlertCount(reporte);
                return (
                  <tr 
                    key={reporte.usuario.id} 
                    className={`hover:bg-slate-50 cursor-pointer transition-colors ${alertCount > 0 ? 'bg-red-50/30' : ''}`}
                    onClick={() => setSelectedUser(reporte)}
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600">
                          {reporte.usuario.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{reporte.usuario.name}</p>
                          <p className="text-xs text-slate-500">{reporte.usuario.position || reporte.usuario.role}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="font-mono font-bold">{reporte.metricas.horasTrabajadas}h</span>
                      <span className="text-xs text-slate-400 block">/ {reporte.metricas.horasEsperadas}h</span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-20 bg-slate-200 rounded-full h-2 overflow-hidden">
                          <div 
                            className={`h-full ${getStatusColor(reporte.metricas.porcentajeCumplimiento)}`}
                            style={{ width: `${Math.min(reporte.metricas.porcentajeCumplimiento, 100)}%` }}
                          />
                        </div>
                        <span className={`text-sm font-bold ${
                          reporte.metricas.porcentajeCumplimiento >= 80 ? 'text-green-600' : 
                          reporte.metricas.porcentajeCumplimiento >= 50 ? 'text-orange-600' : 'text-red-600'
                        }`}>
                          {reporte.metricas.porcentajeCumplimiento}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="text-green-600 font-bold">{reporte.metricas.tareasCompletadas}</span>
                      <span className="text-slate-400"> / {reporte.metricas.tareasAsignadas}</span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      {reporte.metricas.tareasVencidas > 0 ? (
                        <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold">
                          {reporte.metricas.tareasVencidas}
                        </span>
                      ) : (
                        <span className="text-green-600">0</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-center">
                      {alertCount > 0 ? (
                        <div className="flex items-center justify-center gap-1">
                          <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold flex items-center gap-1">
                            <AlertTriangle size={12} /> {alertCount}
                          </span>
                        </div>
                      ) : (
                        <span className="text-green-600 text-xs">✓ OK</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-500">
                      {reporte.ultimaActividad 
                        ? formatDate(reporte.ultimaActividad)
                        : <span className="text-red-500 font-medium">Sin actividad</span>
                      }
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Actividad Reciente */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Timeline */}
        <Card title="Actividad Reciente" className="max-h-[400px] overflow-y-auto">
          {data?.actividadReciente.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <Activity size={32} className="mx-auto mb-2 opacity-30" />
              <p>No hay actividad registrada</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data?.actividadReciente.map(act => (
                <div key={act.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <Clock size={14} className="text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-900 text-sm">{act.tarea}</p>
                    <p className="text-xs text-slate-500">{act.proyecto}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                      <span>{formatDate(act.inicio)}</span>
                      {act.duracion && (
                        <span className="bg-slate-200 px-2 py-0.5 rounded">{act.duracion} min</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Usuarios con Alertas */}
        <Card title="⚠️ Usuarios que Requieren Atención" className="max-h-[400px] overflow-y-auto">
          {usuariosConProblemas.length === 0 ? (
            <div className="text-center py-8 text-green-600">
              <CheckCircle size={32} className="mx-auto mb-2" />
              <p className="font-medium">Todo el equipo está en orden</p>
            </div>
          ) : (
            <div className="space-y-3">
              {usuariosConProblemas.map(u => (
                <div 
                  key={u.usuario.id} 
                  className="p-4 bg-red-50 border border-red-100 rounded-lg cursor-pointer hover:bg-red-100 transition-colors"
                  onClick={() => setSelectedUser(u)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-red-200 flex items-center justify-center font-bold text-red-700 text-sm">
                        {u.usuario.name.charAt(0)}
                      </div>
                      <span className="font-bold text-red-900">{u.usuario.name}</span>
                    </div>
                    <Badge variant="danger">{getAlertCount(u)} alertas</Badge>
                  </div>
                  <div className="space-y-1 text-xs text-red-700">
                    {u.alertas.bajaCarga && (
                      <p className="flex items-center gap-1">
                        <AlertTriangle size={12} /> Baja carga de trabajo ({u.metricas.porcentajeCumplimiento}% cumplimiento)
                      </p>
                    )}
                    {u.alertas.tareasRetrasadas && (
                      <p className="flex items-center gap-1">
                        <AlertTriangle size={12} /> {u.metricas.tareasVencidas} tareas vencidas
                      </p>
                    )}
                    {u.alertas.sinActividad && (
                      <p className="flex items-center gap-1">
                        <AlertTriangle size={12} /> Sin actividad registrada
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Modal Detalle Usuario */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setSelectedUser(null)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600 text-xl">
                  {selectedUser.usuario.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900">{selectedUser.usuario.name}</h3>
                  <p className="text-sm text-slate-500">{selectedUser.usuario.position || selectedUser.usuario.role}</p>
                </div>
              </div>
              <button onClick={() => setSelectedUser(null)} className="text-slate-400 hover:text-slate-600">
                <X size={20}/>
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Métricas */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-lg">
                  <p className="text-xs text-slate-500 uppercase font-bold">Horas Trabajadas</p>
                  <p className="text-2xl font-bold text-slate-900">{selectedUser.metricas.horasTrabajadas}h</p>
                  <p className="text-xs text-slate-400">de {selectedUser.metricas.horasEsperadas}h esperadas</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg">
                  <p className="text-xs text-slate-500 uppercase font-bold">Cumplimiento</p>
                  <p className={`text-2xl font-bold ${
                    selectedUser.metricas.porcentajeCumplimiento >= 80 ? 'text-green-600' : 
                    selectedUser.metricas.porcentajeCumplimiento >= 50 ? 'text-orange-600' : 'text-red-600'
                  }`}>{selectedUser.metricas.porcentajeCumplimiento}%</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg">
                  <p className="text-xs text-slate-500 uppercase font-bold">Tareas Completadas</p>
                  <p className="text-2xl font-bold text-green-600">{selectedUser.metricas.tareasCompletadas}</p>
                  <p className="text-xs text-slate-400">de {selectedUser.metricas.tareasAsignadas} asignadas</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg">
                  <p className="text-xs text-slate-500 uppercase font-bold">Tareas Vencidas</p>
                  <p className={`text-2xl font-bold ${selectedUser.metricas.tareasVencidas > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {selectedUser.metricas.tareasVencidas}
                  </p>
                </div>
              </div>

              {/* Alertas */}
              {getAlertCount(selectedUser) > 0 && (
                <div className="bg-red-50 border border-red-100 rounded-lg p-4">
                  <p className="font-bold text-red-800 mb-2 flex items-center gap-2">
                    <AlertTriangle size={16} /> Alertas Activas
                  </p>
                  <ul className="space-y-1 text-sm text-red-700">
                    {selectedUser.alertas.bajaCarga && (
                      <li>• Carga de trabajo inferior al 50% esperado</li>
                    )}
                    {selectedUser.alertas.tareasRetrasadas && (
                      <li>• Tiene {selectedUser.metricas.tareasVencidas} tareas vencidas sin completar</li>
                    )}
                    {selectedUser.alertas.sinActividad && (
                      <li>• No ha registrado actividad en el periodo</li>
                    )}
                  </ul>
                </div>
              )}

              {/* Última actividad */}
              <div className="text-sm text-slate-500">
                <span className="font-medium">Última actividad: </span>
                {selectedUser.ultimaActividad 
                  ? formatDate(selectedUser.ultimaActividad)
                  : <span className="text-red-500">Sin registros</span>
                }
              </div>
            </div>
            
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button onClick={() => setSelectedUser(null)} className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}