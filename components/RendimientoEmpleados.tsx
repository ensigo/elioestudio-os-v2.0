import React, { useState, useEffect } from 'react';
import { 
  Clock, CheckCircle, AlertTriangle, TrendingUp, TrendingDown,
  Calendar, Target, Loader2, ChevronLeft, ChevronRight
} from 'lucide-react';
import { Badge } from './ui/Badge';

interface RendimientoEmpleadoProps {
  usuarioId: string;
  tipoContrato?: string; // 'COMPLETA' o 'MEDIA'
}

interface Jornada {
  id: string;
  fecha: string;
  horaInicio: string;
  horaFin: string | null;
  totalMinutos: number | null;
  estado: string;
}

interface Tarea {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string | null;
  estimatedHours: number | null;
  createdAt: string;
}

interface Metricas {
  horasTrabajadas: number;
  horasObjetivo: number;
  cumplimientoHorario: number;
  diasTrabajados: number;
  diasLaborables: number;
  promedioHorasDia: number;
  tareasAsignadas: number;
  tareasCompletadas: number;
  tareasPendientes: number;
  tareasVencidas: number;
  tasaExito: number;
  diasConRetraso: number;
  horasExtra: number;
}

export const RendimientoEmpleado: React.FC<RendimientoEmpleadoProps> = ({ 
  usuarioId, 
  tipoContrato = 'COMPLETA' 
}) => {
  const [periodo, setPeriodo] = useState<'1mes' | '3meses'>('1mes');
  const [loading, setLoading] = useState(true);
  const [jornadas, setJornadas] = useState<Jornada[]>([]);
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [metricas, setMetricas] = useState<Metricas | null>(null);

  const horasSemanales = tipoContrato === 'MEDIA' ? 20 : 37.5;
  const horasDiarias = horasSemanales / 5;

  // Calcular fechas del periodo
  const getFechasPeriodo = () => {
    const hoy = new Date();
    const fin = new Date(hoy);
    const inicio = new Date(hoy);
    
    if (periodo === '1mes') {
      inicio.setMonth(inicio.getMonth() - 1);
    } else {
      inicio.setMonth(inicio.getMonth() - 3);
    }
    
    return {
      inicio: inicio.toISOString().split('T')[0],
      fin: fin.toISOString().split('T')[0]
    };
  };

  // Cargar datos
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { inicio, fin } = getFechasPeriodo();

      try {
        // Cargar jornadas
        const jornadasRes = await fetch(
          `/api/control-horario?entity=jornadas?usuarioId=${usuarioId}&fechaInicio=${inicio}&fechaFin=${fin}`
        );
        const jornadasData = jornadasRes.ok ? await jornadasRes.json() : [];

        // Cargar tareas
        const tareasRes = await fetch(`/api/tareas?assigneeId=${usuarioId}`);
        const tareasData = tareasRes.ok ? await tareasRes.json() : [];

        setJornadas(Array.isArray(jornadasData) ? jornadasData : []);
        setTareas(Array.isArray(tareasData) ? tareasData : []);

        // Calcular métricas
        calcularMetricas(
          Array.isArray(jornadasData) ? jornadasData : [], 
          Array.isArray(tareasData) ? tareasData : [],
          inicio,
          fin
        );
      } catch (error) {
        console.error('Error cargando datos de rendimiento:', error);
        setJornadas([]);
        setTareas([]);
      } finally {
        setLoading(false);
      }
    };

    if (usuarioId) {
      fetchData();
    }
  }, [usuarioId, periodo]);

  const calcularMetricas = (
    jornadasData: Jornada[], 
    tareasData: Tarea[],
    fechaInicio: string,
    fechaFin: string
  ) => {
    // Filtrar jornadas finalizadas
    const jornadasFinalizadas = jornadasData.filter(j => j.estado === 'FINALIZADA');
    
    // Calcular horas trabajadas
    const totalMinutos = jornadasFinalizadas.reduce((acc, j) => acc + (j.totalMinutos || 0), 0);
    const horasTrabajadas = totalMinutos / 60;

    // Calcular días laborables en el periodo
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    let diasLaborables = 0;
    const current = new Date(inicio);
    while (current <= fin) {
      const dia = current.getDay();
      if (dia !== 0 && dia !== 6) diasLaborables++;
      current.setDate(current.getDate() + 1);
    }

    // Calcular semanas en el periodo
    const semanas = Math.ceil(diasLaborables / 5);
    const horasObjetivo = horasSemanales * semanas;

    // Días trabajados
    const diasTrabajados = jornadasFinalizadas.length;

    // Promedio horas por día
    const promedioHorasDia = diasTrabajados > 0 ? horasTrabajadas / diasTrabajados : 0;

    // Cumplimiento horario
    const cumplimientoHorario = horasObjetivo > 0 ? (horasTrabajadas / horasObjetivo) * 100 : 0;

    // Días con retraso (entrada después de las 9:30)
    const diasConRetraso = jornadasFinalizadas.filter(j => {
      const horaInicio = new Date(j.horaInicio);
      const hora = horaInicio.getHours();
      const minutos = horaInicio.getMinutes();
      return hora > 9 || (hora === 9 && minutos > 30);
    }).length;

    // Horas extra (días con más de las horas diarias objetivo)
    let horasExtra = 0;
    jornadasFinalizadas.forEach(j => {
      const horasDia = (j.totalMinutos || 0) / 60;
      if (horasDia > horasDiarias) {
        horasExtra += horasDia - horasDiarias;
      }
    });

    // Métricas de tareas
    const tareasCompletadas = tareasData.filter(t => t.status === 'CLOSED' || t.status === 'APPROVED').length;
    const tareasPendientes = tareasData.filter(t => !['CLOSED', 'APPROVED'].includes(t.status)).length;
    const tareasVencidas = tareasData.filter(t => {
      if (!t.dueDate || ['CLOSED', 'APPROVED'].includes(t.status)) return false;
      return new Date(t.dueDate) < new Date();
    }).length;

    const tasaExito = tareasData.length > 0 ? (tareasCompletadas / tareasData.length) * 100 : 0;

    setMetricas({
      horasTrabajadas: Math.round(horasTrabajadas * 10) / 10,
      horasObjetivo: Math.round(horasObjetivo * 10) / 10,
      cumplimientoHorario: Math.round(cumplimientoHorario),
      diasTrabajados,
      diasLaborables,
      promedioHorasDia: Math.round(promedioHorasDia * 10) / 10,
      tareasAsignadas: tareasData.length,
      tareasCompletadas,
      tareasPendientes,
      tareasVencidas,
      tasaExito: Math.round(tasaExito),
      diasConRetraso,
      horasExtra: Math.round(horasExtra * 10) / 10
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="animate-spin text-elio-yellow" size={32} />
      </div>
    );
  }

  if (!metricas) {
    return (
      <div className="text-center py-8 text-slate-400">
        No hay datos de rendimiento disponibles
      </div>
    );
  }

  const getColorCumplimiento = (valor: number) => {
    if (valor >= 95) return 'text-green-600';
    if (valor >= 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getBgColorCumplimiento = (valor: number) => {
    if (valor >= 95) return 'bg-green-100';
    if (valor >= 80) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  return (
    <div className="space-y-6">
      {/* Selector de periodo */}
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-slate-800">Informe de Rendimiento</h3>
        <div className="flex gap-2 bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setPeriodo('1mes')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              periodo === '1mes' 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Último mes
          </button>
          <button
            onClick={() => setPeriodo('3meses')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              periodo === '3meses' 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            3 meses
          </button>
        </div>
      </div>

      {/* KPIs principales */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Horas trabajadas */}
        <div className="bg-blue-50 p-4 rounded-xl">
          <div className="flex items-center gap-2 text-blue-600 mb-2">
            <Clock size={18} />
            <span className="text-xs font-bold uppercase">Horas Trabajadas</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{metricas.horasTrabajadas}h</p>
          <p className="text-xs text-slate-500">de {metricas.horasObjetivo}h objetivo</p>
        </div>

        {/* Cumplimiento */}
        <div className={`p-4 rounded-xl ${getBgColorCumplimiento(metricas.cumplimientoHorario)}`}>
          <div className="flex items-center gap-2 mb-2">
            <Target size={18} className={getColorCumplimiento(metricas.cumplimientoHorario)} />
            <span className="text-xs font-bold uppercase text-slate-600">Cumplimiento</span>
          </div>
          <p className={`text-2xl font-bold ${getColorCumplimiento(metricas.cumplimientoHorario)}`}>
            {metricas.cumplimientoHorario}%
          </p>
          <p className="text-xs text-slate-500">de la jornada</p>
        </div>

        {/* Tareas completadas */}
        <div className="bg-green-50 p-4 rounded-xl">
          <div className="flex items-center gap-2 text-green-600 mb-2">
            <CheckCircle size={18} />
            <span className="text-xs font-bold uppercase">Tareas Completadas</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{metricas.tareasCompletadas}</p>
          <p className="text-xs text-slate-500">de {metricas.tareasAsignadas} asignadas</p>
        </div>

        {/* Tasa de éxito */}
        <div className={`p-4 rounded-xl ${metricas.tasaExito >= 70 ? 'bg-green-50' : 'bg-orange-50'}`}>
          <div className="flex items-center gap-2 mb-2">
            {metricas.tasaExito >= 70 ? (
              <TrendingUp size={18} className="text-green-600" />
            ) : (
              <TrendingDown size={18} className="text-orange-600" />
            )}
            <span className="text-xs font-bold uppercase text-slate-600">Tasa de Éxito</span>
          </div>
          <p className={`text-2xl font-bold ${metricas.tasaExito >= 70 ? 'text-green-600' : 'text-orange-600'}`}>
            {metricas.tasaExito}%
          </p>
          <p className="text-xs text-slate-500">tareas cerradas</p>
        </div>
      </div>

      {/* Métricas detalladas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Asistencia */}
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <h4 className="font-bold text-sm text-slate-700 mb-3 flex items-center gap-2">
            <Calendar size={16} className="text-slate-400" />
            Asistencia
          </h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Días trabajados</span>
              <span className="font-bold text-slate-900">{metricas.diasTrabajados} / {metricas.diasLaborables}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Promedio diario</span>
              <span className="font-bold text-slate-900">{metricas.promedioHorasDia}h</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Días con retraso</span>
              <span className={`font-bold ${metricas.diasConRetraso > 3 ? 'text-red-600' : 'text-slate-900'}`}>
                {metricas.diasConRetraso}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Horas extra</span>
              <span className="font-bold text-blue-600">+{metricas.horasExtra}h</span>
            </div>
          </div>
        </div>

        {/* Tareas */}
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <h4 className="font-bold text-sm text-slate-700 mb-3 flex items-center gap-2">
            <CheckCircle size={16} className="text-slate-400" />
            Productividad
          </h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Tareas asignadas</span>
              <span className="font-bold text-slate-900">{metricas.tareasAsignadas}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Completadas</span>
              <span className="font-bold text-green-600">{metricas.tareasCompletadas}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Pendientes</span>
              <span className="font-bold text-slate-900">{metricas.tareasPendientes}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Vencidas</span>
              <span className={`font-bold ${metricas.tareasVencidas > 0 ? 'text-red-600' : 'text-slate-900'}`}>
                {metricas.tareasVencidas}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Alertas si las hay */}
      {(metricas.cumplimientoHorario < 80 || metricas.tareasVencidas > 0 || metricas.diasConRetraso > 5) && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <h4 className="font-bold text-sm text-orange-800 mb-2 flex items-center gap-2">
            <AlertTriangle size={16} />
            Alertas
          </h4>
          <ul className="text-sm text-orange-700 space-y-1">
            {metricas.cumplimientoHorario < 80 && (
              <li>• Cumplimiento horario por debajo del 80%</li>
            )}
            {metricas.tareasVencidas > 0 && (
              <li>• Tiene {metricas.tareasVencidas} tarea(s) vencida(s)</li>
            )}
            {metricas.diasConRetraso > 5 && (
              <li>• Más de 5 días con entrada tardía</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};