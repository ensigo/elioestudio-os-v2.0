'use client';
import React, { useState, useEffect } from 'react';
import {
  Users, TrendingUp, TrendingDown, Clock, AlertTriangle,
  BarChart3, DollarSign, Target, CheckCircle2,
  ChevronDown, ChevronRight, Calendar
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../context/AuthContext';

interface CargaUsuario {
  id: string;
  nombre: string;
  position: string | null;
  tipoContrato: string;
  tareas: { total: number; pendientes: number; enProgreso: number; urgentes: number };
  horas: { estimadas: number; reales: number; semanales: number };
  cargaPorcentaje: number;
  tareasDetalle: any[];
}

interface RentabilidadProyecto {
  id: string;
  titulo: string;
  cliente: string;
  responsable: string;
  status: string;
  presupuesto: number;
  horas: { estimadas: number; reales: number; desviacion: number };
  costes: { estimado: number; real: number };
  rentabilidad: number;
  progreso: number;
  tareas: { total: number; completadas: number };
  deadline: string | null;
}

export default function AnalisisPage() {
  const { usuario } = useAuth();
  const [activeTab, setActiveTab] = useState<'carga' | 'rentabilidad'>('carga');
  const [periodoCarga, setPeriodoCarga] = useState<'semana' | 'mes' | 'todo'>('semana');
  const [cargaData, setCargaData] = useState<any>(null);
  const [rentabilidadData, setRentabilidadData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [activeTab, periodoCarga]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'carga') {
        const res = await fetch(`/api/dashboard?tipo=carga-trabajo&periodo=${periodoCarga}`);
        if (res.ok) setCargaData(await res.json());
      } else {
        const res = await fetch('/api/dashboard?tipo=rentabilidad');
        if (res.ok) setRentabilidadData(await res.json());
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);

  const getCargaColor = (porcentaje: number) => {
    if (porcentaje >= 100) return 'bg-red-500';
    if (porcentaje >= 80) return 'bg-orange-500';
    if (porcentaje >= 50) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getCargaLabel = (porcentaje: number) => {
    if (porcentaje >= 100) return { text: 'Sobrecargado', color: 'text-red-600 bg-red-50' };
    if (porcentaje >= 80) return { text: 'Alta carga', color: 'text-orange-600 bg-orange-50' };
    if (porcentaje >= 50) return { text: 'Carga media', color: 'text-yellow-600 bg-yellow-50' };
    if (porcentaje > 0) return { text: 'Disponible', color: 'text-green-600 bg-green-50' };
    return { text: 'Sin tareas', color: 'text-slate-500 bg-slate-50' };
  };

  const getRentabilidadColor = (rentabilidad: number) => {
    if (rentabilidad >= 30) return 'text-green-600';
    if (rentabilidad >= 10) return 'text-yellow-600';
    if (rentabilidad >= 0) return 'text-orange-600';
    return 'text-red-600';
  };

  const getPeriodoLabel = () => {
    switch (periodoCarga) {
      case 'semana': return 'próximos 7 días';
      case 'mes': return 'este mes';
      default: return 'todas las tareas';
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-96"><p className="text-xl text-blue-500 animate-pulse">Cargando análisis...</p></div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Análisis y Métricas</h1>
          <p className="text-gray-500 text-sm">Control de carga de trabajo y rentabilidad</p>
        </div>
      </div>

      <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('carga')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'carga' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <Users size={16} /> Carga de Trabajo
        </button>
        <button
          onClick={() => setActiveTab('rentabilidad')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'rentabilidad' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <BarChart3 size={16} /> Rentabilidad
        </button>
      </div>

      {/* CARGA DE TRABAJO */}
      {activeTab === 'carga' && cargaData && (
        <div className="space-y-6">
          {/* Selector de período */}
          <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <Calendar size={20} className="text-blue-600" />
            <span className="text-sm font-medium text-blue-900">Mostrar tareas que vencen en:</span>
            <div className="flex gap-2">
              {[
                { id: 'semana', label: 'Esta semana' },
                { id: 'mes', label: 'Este mes' },
                { id: 'todo', label: 'Todo' }
              ].map(p => (
                <button
                  key={p.id}
                  onClick={() => setPeriodoCarga(p.id as any)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    periodoCarga === p.id 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-white text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Resumen */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase">Tareas ({getPeriodoLabel()})</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{cargaData.resumen.totalTareas}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-xl"><Target size={24} className="text-blue-600" /></div>
              </div>
            </Card>
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase">Sin Asignar</p>
                  <p className="text-2xl font-bold text-orange-600 mt-1">{cargaData.resumen.tareasSinAsignar}</p>
                </div>
                <div className="p-3 bg-orange-100 rounded-xl"><AlertTriangle size={24} className="text-orange-600" /></div>
              </div>
            </Card>
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase">Urgentes</p>
                  <p className="text-2xl font-bold text-red-600 mt-1">{cargaData.resumen.tareasUrgentes}</p>
                </div>
                <div className="p-3 bg-red-100 rounded-xl"><AlertTriangle size={24} className="text-red-600" /></div>
              </div>
            </Card>
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase">Horas Estimadas</p>
                  <p className="text-2xl font-bold text-purple-600 mt-1">{cargaData.resumen.horasEstimadas || 0}h</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-xl"><Clock size={24} className="text-purple-600" /></div>
              </div>
            </Card>
          </div>

          {/* Carga por empleado */}
          <Card title="Carga por Empleado">
            <div className="space-y-4">
              {cargaData.usuarios.length === 0 ? (
                <p className="text-center text-slate-400 py-8">No hay empleados con tareas en este período</p>
              ) : (
                cargaData.usuarios.map((user: CargaUsuario) => {
                  const cargaLabel = getCargaLabel(user.cargaPorcentaje);
                  const isExpanded = expandedUser === user.id;
                  return (
                    <div key={user.id} className="border border-slate-200 rounded-lg overflow-hidden">
                      <div
                        className="p-4 cursor-pointer hover:bg-slate-50 transition-colors"
                        onClick={() => setExpandedUser(isExpanded ? null : user.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                            <div>
                              <h3 className="font-bold text-slate-900">{user.nombre}</h3>
                              <p className="text-sm text-slate-500">{user.position || 'Sin puesto'} · {user.tipoContrato === 'MEDIA' ? '20h/semana' : '37.5h/semana'}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="text-sm text-slate-600">{user.tareas.total} tareas</p>
                              <p className="text-xs text-slate-400">{user.horas.estimadas}h estimadas</p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${cargaLabel.color}`}>
                              {cargaLabel.text}
                            </span>
                          </div>
                        </div>
                        {/* Barra de progreso */}
                        <div className="mt-3">
                          <div className="flex justify-between text-xs text-slate-500 mb-1">
                            <span>Carga {periodoCarga === 'semana' ? 'semanal' : periodoCarga === 'mes' ? 'mensual' : 'total'}</span>
                            <span>{user.cargaPorcentaje}%</span>
                          </div>
                          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${getCargaColor(user.cargaPorcentaje)} transition-all duration-300`}
                              style={{ width: `${Math.min(100, user.cargaPorcentaje)}%` }}
                            />
                          </div>
                        </div>
                        {/* Indicadores rápidos */}
                        {(user.tareas.urgentes > 0 || user.tareas.enProgreso > 0 || user.tareas.pendientes > 0) && (
                          <div className="mt-3 flex gap-2">
                            {user.tareas.urgentes > 0 && <Badge variant="error">{user.tareas.urgentes} urgentes</Badge>}
                            {user.tareas.enProgreso > 0 && <Badge variant="warning">{user.tareas.enProgreso} en progreso</Badge>}
                            {user.tareas.pendientes > 0 && <Badge variant="neutral">{user.tareas.pendientes} pendientes</Badge>}
                          </div>
                        )}
                      </div>
                      {/* Detalle expandido */}
                      {isExpanded && user.tareasDetalle.length > 0 && (
                        <div className="border-t border-slate-200 bg-slate-50 p-4">
                          <h4 className="text-sm font-bold text-slate-700 mb-2">Tareas asignadas:</h4>
                          <div className="space-y-2">
                            {user.tareasDetalle.map((t: any) => (
                              <div key={t.id} className="flex justify-between items-center bg-white p-2 rounded border border-slate-100">
                                <div>
                                  <p className="font-medium text-slate-900">{t.title}</p>
                                  <p className="text-xs text-slate-500">{t.cliente} → {t.proyecto}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  {t.dueDate && (
                                    <span className="text-xs text-slate-500">
                                      {new Date(t.dueDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                                    </span>
                                  )}
                                  {t.estimatedHours && <span className="text-xs text-slate-500">{t.estimatedHours}h</span>}
                                  <Badge variant={t.priority === 'URGENT' ? 'error' : t.priority === 'HIGH' ? 'warning' : 'neutral'}>
                                    {t.priority}
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </Card>

          {/* Tareas sin asignar */}
          {cargaData.tareasSinAsignar.length > 0 && (
            <Card title={`⚠️ Tareas sin asignar (${cargaData.tareasSinAsignar.length})`} className="border-l-4 border-orange-500">
              <div className="space-y-2">
                {cargaData.tareasSinAsignar.map((t: any) => (
                  <div key={t.id} className="flex justify-between items-center bg-orange-50 p-3 rounded-lg">
                    <div>
                      <p className="font-medium text-slate-900">{t.title}</p>
                      <p className="text-xs text-slate-500">{t.cliente} → {t.proyecto}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {t.dueDate && (
                        <span className="text-xs text-slate-500">
                          {new Date(t.dueDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                        </span>
                      )}
                      <Badge variant={t.priority === 'URGENT' ? 'error' : t.priority === 'HIGH' ? 'warning' : 'neutral'}>
                        {t.priority}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* RENTABILIDAD */}
      {activeTab === 'rentabilidad' && rentabilidadData && (
        <div className="space-y-6">
          {/* Resumen */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase">Presupuesto Total</p>
                  <p className="text-2xl font-bold text-blue-600 mt-1">{formatCurrency(rentabilidadData.resumen.totalPresupuesto)}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-xl"><DollarSign size={24} className="text-blue-600" /></div>
              </div>
            </Card>
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase">Coste Real</p>
                  <p className="text-2xl font-bold text-red-600 mt-1">{formatCurrency(rentabilidadData.resumen.totalCosteReal)}</p>
                </div>
                <div className="p-3 bg-red-100 rounded-xl"><TrendingDown size={24} className="text-red-600" /></div>
              </div>
            </Card>
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase">Margen</p>
                  <p className={`text-2xl font-bold mt-1 ${rentabilidadData.resumen.margenTotal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(rentabilidadData.resumen.margenTotal)}
                  </p>
                </div>
                <div className={`p-3 rounded-xl ${rentabilidadData.resumen.margenTotal >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                  <TrendingUp size={24} className={rentabilidadData.resumen.margenTotal >= 0 ? 'text-green-600' : 'text-red-600'} />
                </div>
              </div>
            </Card>
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase">Rentabilidad Media</p>
                  <p className={`text-2xl font-bold mt-1 ${getRentabilidadColor(rentabilidadData.resumen.rentabilidadMedia)}`}>
                    {rentabilidadData.resumen.rentabilidadMedia}%
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-xl"><BarChart3 size={24} className="text-purple-600" /></div>
              </div>
            </Card>
          </div>

          {/* Desviación de horas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <p className="text-xs font-bold text-slate-500 uppercase mb-2">Horas Estimadas</p>
              <p className="text-3xl font-bold text-slate-900">{rentabilidadData.resumen.horasEstimadas}h</p>
            </Card>
            <Card>
              <p className="text-xs font-bold text-slate-500 uppercase mb-2">Horas Reales</p>
              <p className="text-3xl font-bold text-slate-900">{rentabilidadData.resumen.horasReales}h</p>
            </Card>
            <Card>
              <p className="text-xs font-bold text-slate-500 uppercase mb-2">Desviación</p>
              <p className={`text-3xl font-bold ${rentabilidadData.resumen.desviacionHoras > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {rentabilidadData.resumen.desviacionHoras > 0 ? '+' : ''}{rentabilidadData.resumen.desviacionHoras}%
              </p>
            </Card>
          </div>

          {/* Tabla de proyectos */}
          <Card title="Rentabilidad por Proyecto">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-bold text-slate-600">Proyecto</th>
                    <th className="px-4 py-3 text-left font-bold text-slate-600">Cliente</th>
                    <th className="px-4 py-3 text-right font-bold text-slate-600">Presupuesto</th>
                    <th className="px-4 py-3 text-center font-bold text-slate-600">Horas Est.</th>
                    <th className="px-4 py-3 text-center font-bold text-slate-600">Horas Real</th>
                    <th className="px-4 py-3 text-center font-bold text-slate-600">Desviación</th>
                    <th className="px-4 py-3 text-center font-bold text-slate-600">Progreso</th>
                    <th className="px-4 py-3 text-center font-bold text-slate-600">Rentabilidad</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {rentabilidadData.proyectos.map((p: RentabilidadProyecto) => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900">{p.titulo}</p>
                        <p className="text-xs text-slate-500">{p.responsable}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{p.cliente}</td>
                      <td className="px-4 py-3 text-right font-medium">{formatCurrency(p.presupuesto)}</td>
                      <td className="px-4 py-3 text-center">{p.horas.estimadas}h</td>
                      <td className="px-4 py-3 text-center">{p.horas.reales}h</td>
                      <td className="px-4 py-3 text-center">
                        <span className={p.horas.desviacion > 0 ? 'text-red-600' : 'text-green-600'}>
                          {p.horas.desviacion > 0 ? '+' : ''}{p.horas.desviacion}%
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500" style={{ width: `${p.progreso}%` }} />
                          </div>
                          <span className="text-xs text-slate-500 w-10">{p.progreso}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`font-bold ${getRentabilidadColor(p.rentabilidad)}`}>
                          {p.rentabilidad}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}