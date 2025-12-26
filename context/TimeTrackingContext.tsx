import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Task } from '../types';

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

interface TimeTrackingContextType {
  activeTask: Task | null;
  elapsedSeconds: number;
  isClockedIn: boolean;
  isPaused: boolean;
  clockInTime: Date | null;
  jornadaActual: Jornada | null;
  startTimer: (task: Task) => void;
  stopTimer: () => void;
  iniciarJornada: (usuarioId: string) => Promise<void>;
  pausarJornada: (usuarioId: string) => Promise<void>;
  reanudarJornada: (usuarioId: string) => Promise<void>;
  finalizarJornada: (usuarioId: string) => Promise<void>;
  cargarJornadaHoy: (usuarioId: string) => Promise<void>;
  formatTime: (seconds: number) => string;
}

const TimeTrackingContext = createContext<TimeTrackingContextType | undefined>(undefined);

export const TimeTrackingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [clockInTime, setClockInTime] = useState<Date | null>(null);
  const [jornadaActual, setJornadaActual] = useState<Jornada | null>(null);

  // Calcular segundos transcurridos basado en la jornada actual
  const calcularSegundos = useCallback((jornada: Jornada) => {
    const ahora = new Date();
    const inicio = new Date(jornada.horaInicio);
    
    if (jornada.estado === 'FINALIZADA' && jornada.totalMinutos) {
      return jornada.totalMinutos * 60;
    }
    
    if (jornada.estado === 'PAUSADA' && jornada.horaPausaAlmuerzo) {
      const pausa = new Date(jornada.horaPausaAlmuerzo);
      return Math.floor((pausa.getTime() - inicio.getTime()) / 1000);
    }
    
    if (jornada.estado === 'EN_CURSO') {
      if (jornada.horaReinicioAlmuerzo && jornada.horaPausaAlmuerzo) {
        // Ya tuvo pausa, calcular mañana + tarde
        const pausa = new Date(jornada.horaPausaAlmuerzo);
        const reinicio = new Date(jornada.horaReinicioAlmuerzo);
        const segundosManana = Math.floor((pausa.getTime() - inicio.getTime()) / 1000);
        const segundosTarde = Math.floor((ahora.getTime() - reinicio.getTime()) / 1000);
        return segundosManana + segundosTarde;
      } else {
        // Sin pausa aún
        return Math.floor((ahora.getTime() - inicio.getTime()) / 1000);
      }
    }
    
    return 0;
  }, []);

  // Interval para actualizar el contador
  useEffect(() => {
    let interval: any;
    
    if (isClockedIn && !isPaused && jornadaActual) {
      interval = setInterval(() => {
        setElapsedSeconds(calcularSegundos(jornadaActual));
      }, 1000);
    }
    
    return () => clearInterval(interval);
  }, [isClockedIn, isPaused, jornadaActual, calcularSegundos]);

  // Cargar jornada de hoy
  const cargarJornadaHoy = async (usuarioId: string) => {
    try {
      const hoy = new Date().toISOString().split('T')[0];
      const response = await fetch(`/api/jornadas?usuarioId=${usuarioId}&fecha=${hoy}`);
      
      if (response.ok) {
        const jornadas = await response.json();
        
        if (jornadas.length > 0) {
          const jornada = jornadas[0];
          setJornadaActual(jornada);
          setElapsedSeconds(calcularSegundos(jornada));
          
          if (jornada.estado === 'EN_CURSO') {
            setIsClockedIn(true);
            setIsPaused(false);
            setClockInTime(new Date(jornada.horaInicio));
          } else if (jornada.estado === 'PAUSADA') {
            setIsClockedIn(true);
            setIsPaused(true);
            setClockInTime(new Date(jornada.horaInicio));
          } else {
            setIsClockedIn(false);
            setIsPaused(false);
          }
        } else {
          setJornadaActual(null);
          setIsClockedIn(false);
          setIsPaused(false);
          setElapsedSeconds(0);
        }
      }
    } catch (err) {
      console.error('Error cargando jornada:', err);
    }
  };

  // Iniciar jornada
  const iniciarJornada = async (usuarioId: string) => {
    try {
      const response = await fetch('/api/jornadas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'iniciar', usuarioId })
      });
      
      if (response.ok) {
        const jornada = await response.json();
        setJornadaActual(jornada);
        setIsClockedIn(true);
        setIsPaused(false);
        setClockInTime(new Date(jornada.horaInicio));
        setElapsedSeconds(0);
      } else {
        const error = await response.json();
        console.error('Error:', error.error);
      }
    } catch (err) {
      console.error('Error iniciando jornada:', err);
    }
  };

  // Pausar jornada (almuerzo)
  const pausarJornada = async (usuarioId: string) => {
    try {
      const response = await fetch('/api/jornadas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'pausar', usuarioId })
      });
      
      if (response.ok) {
        const jornada = await response.json();
        setJornadaActual(jornada);
        setIsPaused(true);
      }
    } catch (err) {
      console.error('Error pausando jornada:', err);
    }
  };

  // Reanudar jornada
  const reanudarJornada = async (usuarioId: string) => {
    try {
      const response = await fetch('/api/jornadas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reanudar', usuarioId })
      });
      
      if (response.ok) {
        const jornada = await response.json();
        setJornadaActual(jornada);
        setIsPaused(false);
      }
    } catch (err) {
      console.error('Error reanudando jornada:', err);
    }
  };

  // Finalizar jornada
  const finalizarJornada = async (usuarioId: string) => {
    try {
      const response = await fetch('/api/jornadas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'finalizar', usuarioId })
      });
      
      if (response.ok) {
        const jornada = await response.json();
        setJornadaActual(jornada);
        setIsClockedIn(false);
        setIsPaused(false);
        if (jornada.totalMinutos) {
          setElapsedSeconds(jornada.totalMinutos * 60);
        }
      }
    } catch (err) {
      console.error('Error finalizando jornada:', err);
    }
  };

  // Task timer functions (sin cambios)
  const startTimer = (task: Task) => {
    if (activeTask) {
      console.log(`Auto-stopping task ${activeTask.id} before starting ${task.id}`);
    }
    setActiveTask(task);
  };

  const stopTimer = () => {
    if (activeTask) {
      console.log(`Stopping task ${activeTask.id}. Total: ${elapsedSeconds}s`);
      setActiveTask(null);
    }
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <TimeTrackingContext.Provider value={{
      activeTask,
      elapsedSeconds,
      isClockedIn,
      isPaused,
      clockInTime,
      jornadaActual,
      startTimer,
      stopTimer,
      iniciarJornada,
      pausarJornada,
      reanudarJornada,
      finalizarJornada,
      cargarJornadaHoy,
      formatTime
    }}>
      {children}
    </TimeTrackingContext.Provider>
  );
};

export const useTimeTracking = () => {
  const context = useContext(TimeTrackingContext);
  if (context === undefined) {
    throw new Error('useTimeTracking must be used within a TimeTrackingProvider');
  }
  return context;
};