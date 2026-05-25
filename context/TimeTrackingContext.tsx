import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Task } from '../types';
import { authFetch } from '../lib/auth-fetch';

interface Jornada {
  id: string;
  usuarioId: string;
  fecha: string;
  horaInicio: string;
  horaPausaAlmuerzo: string | null;
  horaReinicioAlmuerzo: string | null;
  horaFin: string | null;
  totalMinutos: number | null;
  estado: 'EN_CURSO' | 'PAUSADA' | 'FINALIZADA';
}

interface TaskEntry {
  id: string;
  tareaId: string;
  taskTitle: string;
  proyectoTitle?: string;
  startTime: Date;
}

interface TimeTrackingContextType {
  // Jornada
  isClockedIn: boolean;
  isPaused: boolean;
  clockInTime: Date | null;
  jornadaActual: Jornada | null;
  elapsedSeconds: number;
  iniciarJornada: (usuarioId: string) => Promise<void>;
  pausarJornada: (usuarioId: string) => Promise<void>;
  reanudarJornada: (usuarioId: string) => Promise<void>;
  finalizarJornada: (usuarioId: string) => Promise<void>;
  cargarJornadaHoy: (usuarioId: string) => Promise<void>;
  // Task timer
  activeTaskEntry: TaskEntry | null;
  taskElapsedSeconds: number;
  startTaskTimer: (task: { id: string; title: string; proyectoTitle?: string }, userId: string) => Promise<void>;
  stopTaskTimer: () => Promise<void>;
  // Utils
  formatTime: (seconds: number) => string;
  // Legacy (mantener compatibilidad)
  activeTask: Task | null;
  startTimer: (task: Task) => void;
  stopTimer: () => void;
}

const TimeTrackingContext = createContext<TimeTrackingContextType | undefined>(undefined);

export const TimeTrackingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // ── Jornada state ──
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [clockInTime, setClockInTime] = useState<Date | null>(null);
  const [jornadaActual, setJornadaActual] = useState<Jornada | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // ── Task timer state ──
  const [activeTaskEntry, setActiveTaskEntry] = useState<TaskEntry | null>(null);
  const [taskElapsedSeconds, setTaskElapsedSeconds] = useState(0);

  // ── Legacy ──
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // ── Jornada elapsed calculator ──
  const calcularSegundos = useCallback((jornada: Jornada) => {
    const ahora = new Date();
    const inicio = new Date(jornada.horaInicio);
    if (jornada.estado === 'FINALIZADA' && jornada.totalMinutos) return jornada.totalMinutos * 60;
    if (jornada.estado === 'PAUSADA' && jornada.horaPausaAlmuerzo) {
      return Math.floor((new Date(jornada.horaPausaAlmuerzo).getTime() - inicio.getTime()) / 1000);
    }
    if (jornada.estado === 'EN_CURSO') {
      if (jornada.horaReinicioAlmuerzo && jornada.horaPausaAlmuerzo) {
        const pausa = new Date(jornada.horaPausaAlmuerzo);
        const reinicio = new Date(jornada.horaReinicioAlmuerzo);
        return Math.floor((pausa.getTime() - inicio.getTime()) / 1000) + Math.floor((ahora.getTime() - reinicio.getTime()) / 1000);
      }
      return Math.floor((ahora.getTime() - inicio.getTime()) / 1000);
    }
    return 0;
  }, []);

  // ── Jornada interval ──
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isClockedIn && !isPaused && jornadaActual) {
      interval = setInterval(() => setElapsedSeconds(calcularSegundos(jornadaActual)), 1000);
    }
    return () => clearInterval(interval);
  }, [isClockedIn, isPaused, jornadaActual, calcularSegundos]);

  // ── Task timer interval ──
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (activeTaskEntry) {
      interval = setInterval(() => {
        setTaskElapsedSeconds(Math.floor((Date.now() - activeTaskEntry.startTime.getTime()) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeTaskEntry]);

  // ── Jornada methods ──
  const cargarJornadaHoy = async (usuarioId: string) => {
    try {
      const hoy = new Date().toISOString().split('T')[0];
      const response = await authFetch(`/api/control-horario?entity=jornadas&usuarioId=${usuarioId}&fecha=${hoy}`);
      if (response.ok) {
        const jornadas = await response.json();
        if (jornadas.length > 0) {
          const jornada = jornadas[0];
          setJornadaActual(jornada);
          setElapsedSeconds(calcularSegundos(jornada));
          if (jornada.estado === 'EN_CURSO') { setIsClockedIn(true); setIsPaused(false); setClockInTime(new Date(jornada.horaInicio)); }
          else if (jornada.estado === 'PAUSADA') { setIsClockedIn(true); setIsPaused(true); setClockInTime(new Date(jornada.horaInicio)); }
          else { setIsClockedIn(false); setIsPaused(false); }
        } else {
          setJornadaActual(null); setIsClockedIn(false); setIsPaused(false); setElapsedSeconds(0);
        }
      }
    } catch (err) { console.error('Error cargando jornada:', err); }
  };

  const iniciarJornada = async (usuarioId: string) => {
    try {
      const response = await authFetch('/api/control-horario?entity=jornadas', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'iniciar', usuarioId })
      });
      if (response.ok) {
        const jornada = await response.json();
        setJornadaActual(jornada); setIsClockedIn(true); setIsPaused(false);
        setClockInTime(new Date(jornada.horaInicio)); setElapsedSeconds(0);
      }
    } catch (err) { console.error('Error iniciando jornada:', err); }
  };

  const pausarJornada = async (usuarioId: string) => {
    try {
      const response = await authFetch('/api/control-horario?entity=jornadas', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'pausar', usuarioId })
      });
      if (response.ok) { const jornada = await response.json(); setJornadaActual(jornada); setIsPaused(true); }
    } catch (err) { console.error('Error pausando jornada:', err); }
  };

  const reanudarJornada = async (usuarioId: string) => {
    try {
      const response = await authFetch('/api/control-horario?entity=jornadas', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reanudar', usuarioId })
      });
      if (response.ok) { const jornada = await response.json(); setJornadaActual(jornada); setIsPaused(false); }
    } catch (err) { console.error('Error reanudando jornada:', err); }
  };

  const finalizarJornada = async (usuarioId: string) => {
    try {
      // Parar cualquier tarea activa primero
      if (activeTaskEntry) await stopTaskTimer();
      const response = await authFetch('/api/control-horario?entity=jornadas', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'finalizar', usuarioId })
      });
      if (response.ok) {
        const jornada = await response.json();
        setJornadaActual(jornada); setIsClockedIn(false); setIsPaused(false);
        if (jornada.totalMinutos) setElapsedSeconds(jornada.totalMinutos * 60);
      }
    } catch (err) { console.error('Error finalizando jornada:', err); }
  };

  // ── Task timer methods ──
  const startTaskTimer = async (task: { id: string; title: string; proyectoTitle?: string }, userId: string) => {
    // Parar el timer anterior si es diferente
    if (activeTaskEntry && activeTaskEntry.tareaId !== task.id) {
      await stopTaskTimer();
    }
    // No iniciar si ya está corriendo para esta tarea
    if (activeTaskEntry?.tareaId === task.id) return;

    try {
      const response = await authFetch('/api/control-horario?entity=time-entries', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, tareaId: task.id })
      });
      if (!response.ok) throw new Error('Error al iniciar timer');
      const entry = await response.json();
      setActiveTaskEntry({
        id: entry.id,
        tareaId: task.id,
        taskTitle: task.title,
        proyectoTitle: task.proyectoTitle,
        startTime: new Date(entry.startTime)
      });
      setTaskElapsedSeconds(0);
      // Sync legacy activeTask
      setActiveTask({ id: task.id, title: task.title } as Task);
    } catch (err) { console.error('Error iniciando timer de tarea:', err); }
  };

  const stopTaskTimer = async () => {
    if (!activeTaskEntry) return;
    try {
      await authFetch('/api/control-horario?entity=time-entries', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: activeTaskEntry.id, endTime: new Date().toISOString() })
      });
    } catch (err) { console.error('Error deteniendo timer de tarea:', err); }
    finally {
      setActiveTaskEntry(null);
      setTaskElapsedSeconds(0);
      setActiveTask(null);
    }
  };

  // ── Legacy methods ──
  const startTimer = (task: Task) => { setActiveTask(task); };
  const stopTimer = () => { setActiveTask(null); };

  return (
    <TimeTrackingContext.Provider value={{
      isClockedIn, isPaused, clockInTime, jornadaActual, elapsedSeconds,
      iniciarJornada, pausarJornada, reanudarJornada, finalizarJornada, cargarJornadaHoy,
      activeTaskEntry, taskElapsedSeconds, startTaskTimer, stopTaskTimer,
      formatTime,
      activeTask, startTimer, stopTimer,
    }}>
      {children}
    </TimeTrackingContext.Provider>
  );
};

export const useTimeTracking = () => {
  const context = useContext(TimeTrackingContext);
  if (context === undefined) throw new Error('useTimeTracking must be used within a TimeTrackingProvider');
  return context;
};
