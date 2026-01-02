'use client';
import React, { useState, useEffect } from 'react';
import { 
  Clock, TrendingUp, Calendar, ChevronLeft, ChevronRight,
  ArrowUpRight, ArrowDownRight, FileDown, FileSpreadsheet
} from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { useAuth } from '../../context/AuthContext';
import { exportToPDF, exportToExcel } from '../../utils/exportUtils';

const HORAS_COMPLETA = 37.5;
const HORAS_MEDIA = 20;

interface Jornada {
  id: string;
  fecha: string;
  horaInicio: string;
  horaPausaAlmuerzo: string | null;
  horaReinicioAlmuerzo: string | null;
  horaFin: string | null;
  totalMinutos: number | null;
  estado: string;
  usuario: {
    id: string;
    name: string;
    email?: string;
    position: string | null;
    tipoContrato?: string;
  };
}

interface ResumenSemanal {
  totalMinutos: number;
  diasTrabajados: number;
  promedioMinutosDia: number;
  cumplimiento: number;
}

interface TimeEntry {
  id: string;
  userId: string;
  tareaId: string | null;
  startTime: string;
  endTime: string | null;
  description: string | null;
  tarea: {
    id: string;
    title: string;
    proyecto: {
      id: string;
      title: string;
      cliente?: {
        id: string;
        name: string;
      };
    };
  } | null;
}

export default function ReportesPage() {
  const { usuario } = useAuth();
  const [jornadas, setJornadas] = useState<Jornada[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState<string>('todos');
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [mesActual, setMesActual] = useState(new Date());
  const [resumenSemanal, setResumenSemanal] = useState<ResumenSemanal | null>(null);
  const [exportando, setExportando] = useState<'pdf' | 'excel' | null>(null);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [loadingTimeEntries, setLoadingTimeEntries] = useState(false);

  const isAdmin = usuario?.role === 'ADMIN' || usuario?.role === 'SUPERADMIN';
  const horasEsperadas = usuario?.tipoContrato === 'MEDIA' ? HORAS_MEDIA : HORAS_COMPLETA;
  const minutosEsperados = horasEsperadas * 60;

  // Cargar usuarios (solo admin)
  useEffect(() => {
    if (isAdmin) {
      fetch('/api/usuarios')
        .then(res => res.json())
        .then(data => setUsuarios(data))
        .catch(err => console.error(err));
    }
  }, [isAdmin]);

  // Cargar jornadas
  useEffect(() => {
    const fetchJornadas = async () => {
      setIsLoading(true);
      try {
        const mes = mesActual.getMonth() + 1;
        const año = mesActual.getFullYear();
        
        let url = `/api/jornadas?mes=${mes}&año=${año}`;
        
        if (!isAdmin && usuario?.id) {
          url += `&usuarioId=${usuario.id}`;
        } else if (isAdmin && selectedUserId !== 'todos') {
          url += `&usuarioId=${selectedUserId}`;
        }

        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          setJornadas(data);
          calcularResumenSemanal(data);
        }
      } catch (err) {
        console.error('Error cargando jornadas:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (usuario?.id) {
      fetchJornadas();
    }
  }, [mesActual, selectedUserId, usuario, isAdmin]);

  // Cargar time entries
  useEffect(() => {
    const fetchTimeEntries = async () => {
      if (!isAdmin) return;
      setLoadingTimeEntries(true);
      try {
        const mes = mesActual.getMonth() + 1;
        const año = mesActual.getFullYear();
        
        let url = `/api/time-entries?mes=${mes}&año=${año}`;
        if (selectedUserId !== 'todos') {
          url += `&userId=${selectedUserId}`;
        }
        
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          setTimeEntries(data);
        }
      } catch (err) {
        console.error('Error cargando time entries:', err);
      } finally {
        setLoadingTimeEntries(false);
      }
    };
    
    fetchTimeEntries();
  }, [mesActual, selectedUserId, isAdmin]);


  const calcularResumenSemanal = (jornadasData: Jornada[]) => {
    const hoy = new Date();
    const inicioSemana = new Date(hoy);
    inicioSemana.setDate(hoy.getDate() - hoy.getDay() + 1);
    inicioSemana.setHours(0, 0, 0, 0);

    const jornadasSemana = jornadasData.filter(j => {
      const fecha = new Date(j.fecha);
      return fecha >= inicioSemana && j.estado === 'FINALIZADA';
    });

    const totalMinutos = jornadasSemana.reduce((acc, j) => acc + (j.totalMinutos || 0), 0);
    const diasTrabajados = jornadasSemana.length;
    const promedioMinutosDia = diasTrabajados > 0 ? Math.round(totalMinutos / diasTrabajados) : 0;
    const cumplimiento = Math.round((totalMinutos / minutosEsperados) * 100);

    setResumenSemanal({
      totalMinutos,
      diasTrabajados,
      promedioMinutosDia,
      cumplimiento
    });
  };

  const formatHora = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  };

  const formatMinutosAHoras = (minutos: number | null) => {
    if (!minutos) return '-';
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    return `${horas}h ${mins}m`;
  };

  const formatFecha = (dateStr: string) => {
    const fecha = new Date(dateStr);
    return fecha.toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit', month: 'short' });
  };

  const cambiarMes = (offset: number) => {
    const nuevoMes = new Date(mesActual);
    nuevoMes.setMonth(nuevoMes.getMonth() + offset);
    setMesActual(nuevoMes);
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'EN_CURSO': return <Badge variant="success">En curso</Badge>;
      case 'PAUSADA': return <Badge variant="warning">Pausada</Badge>;
      case 'FINALIZADA': return <Badge variant="blue">Finalizada</Badge>;
      default: return <Badge variant="neutral">{estado}</Badge>;
    }
  };

  // ============================================
  // FUNCIONES DE EXPORTACIÓN
  // ============================================
  const getUsuarioParaExportar = () => {
    if (isAdmin && selectedUserId !== 'todos') {
      const user = usuarios.find(u => u.id === selectedUserId);
      return user || usuario;
    }
    return usuario;
  };

  const handleExportPDF = async () => {
    if (jornadas.length === 0) return;
    setExportando('pdf');
    
    try {
      const userExport = getUsuarioParaExportar();
      const jornadasFinalizadas = jornadas.filter(j => j.estado === 'FINALIZADA');
      const totalMinutos = jornadasFinalizadas.reduce((acc, j) => acc + (j.totalMinutos || 0), 0);
      const diasTrabajados = jornadasFinalizadas.length;
      
      const primerDiaMes = new Date(mesActual.getFullYear(), mesActual.getMonth(), 1);
      const ultimoDiaMes = new Date(mesActual.getFullYear(), mesActual.getMonth() + 1, 0);
      
      // Calcular días laborables del mes
      let diasLaborables = 0;
      for (let d = new Date(primerDiaMes); d <= ultimoDiaMes; d.setDate(d.getDate() + 1)) {
        const dia = d.getDay();
        if (dia !== 0 && dia !== 6) diasLaborables++;
      }
      
      const horasUsuario = userExport?.tipoContrato === 'MEDIA' ? HORAS_MEDIA : HORAS_COMPLETA;
      const horasObjetivo = (horasUsuario / 5) * diasLaborables;

      await exportToPDF({
        jornadas: jornadas.map(j => ({
          id: j.id,
          fecha: j.fecha,
          horaInicio: j.horaInicio,
          horaPausaAlmuerzo: j.horaPausaAlmuerzo || undefined,
          horaReinicioAlmuerzo: j.horaReinicioAlmuerzo || undefined,
          horaFin: j.horaFin || undefined,
          totalMinutos: j.totalMinutos || undefined,
          estado: j.estado
        })),
        usuario: {
          id: userExport?.id || '',
          name: userExport?.name || 'Usuario',
          email: userExport?.email || '',
          position: userExport?.position || undefined,
          tipoContrato: userExport?.tipoContrato || 'COMPLETA'
        },
        periodo: {
          inicio: primerDiaMes.toLocaleDateString('es-ES'),
          fin: ultimoDiaMes.toLocaleDateString('es-ES')
        },
        resumen: {
          totalHoras: totalMinutos / 60,
          horasObjetivo,
          diasTrabajados,
          promedioDiario: diasTrabajados > 0 ? (totalMinutos / diasTrabajados) / 60 : 0
        }
      });
    } catch (error) {
      console.error('Error exportando PDF:', error);
      alert('Error al exportar PDF. Por favor, inténtalo de nuevo.');
    } finally {
      setExportando(null);
    }
  };

  const handleExportExcel = async () => {
    if (jornadas.length === 0) return;
    setExportando('excel');
    
    try {
      const userExport = getUsuarioParaExportar();
      const jornadasFinalizadas = jornadas.filter(j => j.estado === 'FINALIZADA');
      const totalMinutos = jornadasFinalizadas.reduce((acc, j) => acc + (j.totalMinutos || 0), 0);
      const diasTrabajados = jornadasFinalizadas.length;
      
      const primerDiaMes = new Date(mesActual.getFullYear(), mesActual.getMonth(), 1);
      const ultimoDiaMes = new Date(mesActual.getFullYear(), mesActual.getMonth() + 1, 0);
      
      let diasLaborables = 0;
      for (let d = new Date(primerDiaMes); d <= ultimoDiaMes; d.setDate(d.getDate() + 1)) {
        const dia = d.getDay();
        if (dia !== 0 && dia !== 6) diasLaborables++;
      }
      
      const horasUsuario = userExport?.tipoContrato === 'MEDIA' ? HORAS_MEDIA : HORAS_COMPLETA;
      const horasObjetivo = (horasUsuario / 5) * diasLaborables;

      await exportToExcel({
        jornadas: jornadas.map(j => ({
          id: j.id,
          fecha: j.fecha,
          horaInicio: j.horaInicio,
          horaPausaAlmuerzo: j.horaPausaAlmuerzo || undefined,
          horaReinicioAlmuerzo: j.horaReinicioAlmuerzo || undefined,
          horaFin: j.horaFin || undefined,
          totalMinutos: j.totalMinutos || undefined,
          estado: j.estado
        })),
        usuario: {
          id: userExport?.id || '',
          name: userExport?.name || 'Usuario',
          email: userExport?.email || '',
          position: userExport?.position || undefined,
          tipoContrato: userExport?.tipoContrato || 'COMPLETA'
        },
        periodo: {
          inicio: primerDiaMes.toLocaleDateString('es-ES'),
          fin: ultimoDiaMes.toLocaleDateString('es-ES')
        },
        resumen: {
          totalHoras: totalMinutos / 60,
          horasObjetivo,
          diasTrabajados,
          promedioDiario: diasTrabajados > 0 ? (totalMinutos / diasTrabajados) / 60 : 0
        }
      });
    } catch (error) {
      console.error('Error exportando Excel:', error);
      alert('Error al exportar Excel. Por favor, inténtalo de nuevo.');
    } finally {
      setExportando(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <p className="text-xl text-elio-yellow animate-pulse">Cargando reportes...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Registro Horario</h1>
          <p className="text-gray-500 text-sm">
            Control de jornadas laborales · {horasEsperadas}h semanales
            {usuario?.tipoContrato === 'MEDIA' && <span className="text-orange-500 ml-1">(Media jornada)</span>}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Botones de Exportación */}
          <button
            onClick={handleExportPDF}
            disabled={exportando !== null || jornadas.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <FileDown size={18} />
            {exportando === 'pdf' ? 'Exportando...' : 'PDF'}
          </button>
          <button
            onClick={handleExportExcel}
            disabled={exportando !== null || jornadas.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <FileSpreadsheet size={18} />
            {exportando === 'excel' ? 'Exportando...' : 'Excel'}
          </button>

          {/* Filtro por usuario (solo admin) */}
          {isAdmin && (
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-elio-yellow/50"
            >
              <option value="todos">Todos los usuarios</option>
              {usuarios.map(u => (
                <option key={u.id} value={u.id}>
                  {u.name} {u.tipoContrato === 'MEDIA' ? '(Media)' : ''}
                </option>
              ))}
            </select>
          )}
          
          {/* Selector de mes */}
          <div className="flex items-center gap-2 bg-slate-100 rounded-lg p-1">
            <button onClick={() => cambiarMes(-1)} className="p-2 hover:bg-white rounded-md">
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm font-semibold min-w-[120px] text-center capitalize">
              {mesActual.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
            </span>
            <button onClick={() => cambiarMes(1)} className="p-2 hover:bg-white rounded-md">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Resumen Semanal */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase">Horas esta semana</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">
                {formatMinutosAHoras(resumenSemanal?.totalMinutos || 0)}
              </p>
              <p className="text-xs text-slate-400">de {horasEsperadas}h esperadas</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-xl">
              <Clock size={24} className="text-blue-600" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase">Días trabajados</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">
                {resumenSemanal?.diasTrabajados || 0}
              </p>
              <p className="text-xs text-slate-400">de 5 días laborables</p>
            </div>
            <div className="p-3 bg-green-100 rounded-xl">
              <Calendar size={24} className="text-green-600" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase">Promedio diario</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">
                {formatMinutosAHoras(resumenSemanal?.promedioMinutosDia || 0)}
              </p>
              <p className="text-xs text-slate-400">por día trabajado</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-xl">
              <TrendingUp size={24} className="text-orange-600" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase">Cumplimiento</p>
              <p className={`text-3xl font-bold mt-1 ${
                (resumenSemanal?.cumplimiento || 0) >= 100 ? 'text-green-600' :
                (resumenSemanal?.cumplimiento || 0) >= 80 ? 'text-orange-600' : 'text-red-600'
              }`}>
                {resumenSemanal?.cumplimiento || 0}%
              </p>
              <p className="text-xs text-slate-400">de la jornada semanal</p>
            </div>
            <div className={`p-3 rounded-xl ${
              (resumenSemanal?.cumplimiento || 0) >= 100 ? 'bg-green-100' :
              (resumenSemanal?.cumplimiento || 0) >= 80 ? 'bg-orange-100' : 'bg-red-100'
            }`}>
              {(resumenSemanal?.cumplimiento || 0) >= 80 
                ? <ArrowUpRight size={24} className="text-green-600" />
                : <ArrowDownRight size={24} className="text-red-600" />
              }
            </div>
          </div>
        </Card>
      </div>

      {/* Tabla de Jornadas */}
      <Card title="Registro de Jornadas" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {isAdmin && selectedUserId === 'todos' && (
                  <th className="px-4 py-3 text-left font-bold text-slate-600">Usuario</th>
                )}
                <th className="px-4 py-3 text-left font-bold text-slate-600">Fecha</th>
                <th className="px-4 py-3 text-center font-bold text-slate-600">Entrada</th>
                <th className="px-4 py-3 text-center font-bold text-slate-600">Pausa</th>
                <th className="px-4 py-3 text-center font-bold text-slate-600">Regreso</th>
                <th className="px-4 py-3 text-center font-bold text-slate-600">Salida</th>
                <th className="px-4 py-3 text-center font-bold text-slate-600">Total</th>
                <th className="px-4 py-3 text-center font-bold text-slate-600">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {jornadas.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin && selectedUserId === 'todos' ? 8 : 7} className="px-4 py-12 text-center text-slate-400">
                    <Clock size={32} className="mx-auto mb-2 opacity-30" />
                    <p>No hay registros de jornadas para este período</p>
                  </td>
                </tr>
              ) : (
                jornadas.map(jornada => (
                  <tr key={jornada.id} className="hover:bg-slate-50 transition-colors">
                    {isAdmin && selectedUserId === 'todos' && (
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-elio-yellow text-white flex items-center justify-center font-bold text-sm">
                            {jornada.usuario.name.charAt(0)}
                          </div>
                          <div>
                            <span className="font-medium">{jornada.usuario.name}</span>
                            {jornada.usuario.tipoContrato === 'MEDIA' && (
                              <span className="text-xs text-orange-500 block">Media jornada</span>
                            )}
                          </div>
                        </div>
                      </td>
                    )}
                    <td className="px-4 py-4">
                      <span className="font-medium capitalize">{formatFecha(jornada.fecha)}</span>
                    </td>
                    <td className="px-4 py-4 text-center font-mono">
                      <span className="bg-green-50 text-green-700 px-2 py-1 rounded">
                        {formatHora(jornada.horaInicio)}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center font-mono">
                      {jornada.horaPausaAlmuerzo ? (
                        <span className="bg-orange-50 text-orange-700 px-2 py-1 rounded">
                          {formatHora(jornada.horaPausaAlmuerzo)}
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-center font-mono">
                      {jornada.horaReinicioAlmuerzo ? (
                        <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded">
                          {formatHora(jornada.horaReinicioAlmuerzo)}
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-center font-mono">
                      {jornada.horaFin ? (
                        <span className="bg-red-50 text-red-700 px-2 py-1 rounded">
                          {formatHora(jornada.horaFin)}
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`font-bold ${
                        jornada.totalMinutos && jornada.totalMinutos >= 450 ? 'text-green-600' :
                        jornada.totalMinutos && jornada.totalMinutos >= 360 ? 'text-orange-600' : 'text-slate-600'
                      }`}>
                        {formatMinutosAHoras(jornada.totalMinutos)}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      {getEstadoBadge(jornada.estado)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Parte de Trabajo - Solo Admin */}
      {isAdmin && (
        <Card title="Parte de Trabajo" className="overflow-hidden">
          <div className="mb-4 text-sm text-slate-500">
            Desglose de tiempo por tarea y cliente
          </div>
          
          {loadingTimeEntries ? (
            <div className="text-center py-8 text-slate-400">Cargando...</div>
          ) : timeEntries.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              No hay registros de tiempo para este periodo
            </div>
          ) : (
            <>
              {/* Resumen por Cliente */}
              <div className="mb-6">
                <h4 className="text-sm font-bold text-slate-700 mb-3">Tiempo por Cliente</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.entries(
                    timeEntries.reduce((acc: Record<string, number>, entry) => {
                      const clienteName = entry.tarea?.proyecto?.cliente?.name || 'Sin cliente';
                      const minutos = entry.endTime 
                        ? Math.round((new Date(entry.endTime).getTime() - new Date(entry.startTime).getTime()) / 60000)
                        : 0;
                      acc[clienteName] = (acc[clienteName] || 0) + minutos;
                      return acc;
                    }, {})
                  ).sort((a, b) => b[1] - a[1]).map(([cliente, minutos]) => (
                    <div key={cliente} className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-xs text-blue-600 font-medium truncate">{cliente}</p>
                      <p className="text-lg font-bold text-slate-900">
                        {Math.floor(minutos / 60)}h {minutos % 60}m
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tabla de Registros */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 text-left font-bold text-slate-600">Fecha</th>
                      <th className="px-4 py-3 text-left font-bold text-slate-600">Tarea</th>
                      <th className="px-4 py-3 text-left font-bold text-slate-600">Cliente</th>
                      <th className="px-4 py-3 text-center font-bold text-slate-600">Inicio</th>
                      <th className="px-4 py-3 text-center font-bold text-slate-600">Fin</th>
                      <th className="px-4 py-3 text-center font-bold text-slate-600">Duración</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {timeEntries.map(entry => {
                      const inicio = new Date(entry.startTime);
                      const fin = entry.endTime ? new Date(entry.endTime) : null;
                      const minutos = fin ? Math.round((fin.getTime() - inicio.getTime()) / 60000) : 0;
                      
                      return (
                        <tr key={entry.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-medium">
                            {inicio.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-medium text-slate-900">
                              {entry.tarea?.title || 'Sin tarea'}
                            </span>
                            <span className="block text-xs text-slate-500">
                              {entry.tarea?.proyecto?.title || ''}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-medium">
                              {entry.tarea?.proyecto?.cliente?.name || 'Sin cliente'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center font-mono">
                            {inicio.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="px-4 py-3 text-center font-mono">
                            {fin ? fin.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '-'}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`font-bold ${minutos >= 60 ? 'text-green-600' : 'text-slate-600'}`}>
                              {Math.floor(minutos / 60)}h {minutos % 60}m
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </Card>
      )}

      {/* Resumen Mensual */}
      {jornadas.length > 0 && (
        <Card title="Resumen del Mes">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-50 p-4 rounded-lg text-center">
              <p className="text-xs text-slate-500 uppercase font-bold">Total Horas</p>
              <p className="text-2xl font-bold text-slate-900">
                {formatMinutosAHoras(jornadas.reduce((acc, j) => acc + (j.totalMinutos || 0), 0))}
              </p>
            </div>
            <div className="bg-slate-50 p-4 rounded-lg text-center">
              <p className="text-xs text-slate-500 uppercase font-bold">Días Registrados</p>
              <p className="text-2xl font-bold text-slate-900">
                {jornadas.filter(j => j.estado === 'FINALIZADA').length}
              </p>
            </div>
            <div className="bg-slate-50 p-4 rounded-lg text-center">
              <p className="text-xs text-slate-500 uppercase font-bold">Promedio Diario</p>
              <p className="text-2xl font-bold text-slate-900">
                {formatMinutosAHoras(
                  jornadas.filter(j => j.estado === 'FINALIZADA').length > 0
                    ? Math.round(jornadas.reduce((acc, j) => acc + (j.totalMinutos || 0), 0) / jornadas.filter(j => j.estado === 'FINALIZADA').length)
                    : 0
                )}
              </p>
            </div>
            <div className="bg-slate-50 p-4 rounded-lg text-center">
              <p className="text-xs text-slate-500 uppercase font-bold">Horas Esperadas</p>
              <p className="text-2xl font-bold text-slate-900">
                {Math.round((horasEsperadas / 5) * jornadas.filter(j => j.estado === 'FINALIZADA').length)}h
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}