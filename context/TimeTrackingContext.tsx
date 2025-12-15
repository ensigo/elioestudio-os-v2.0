import React, { createContext, useContext, useState, useEffect } from 'react';
import { Task } from '../types';

interface TimeTrackingContextType {
  activeTask: Task | null;
  elapsedSeconds: number;
  isClockedIn: boolean;
  clockInTime: Date | null;
  startTimer: (task: Task) => void;
  stopTimer: () => void;
  toggleClockIn: () => void;
  formatTime: (seconds: number) => string;
}

const TimeTrackingContext = createContext<TimeTrackingContextType | undefined>(undefined);

export const TimeTrackingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [clockInTime, setClockInTime] = useState<Date | null>(null);

  // Interval Logic
  useEffect(() => {
    let interval: any;
    if (activeTask) {
      interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeTask]);

  const startTimer = (task: Task) => {
    // 1. MUTUAL EXCLUSION: If there's an active task, stop it first.
    if (activeTask) {
      // In a real app, we would save the TimeEntry to DB here
      console.log(`Auto-stopping task ${activeTask.id} before starting ${task.id}`);
    }
    
    // 2. Start new task
    setActiveTask(task);
    setElapsedSeconds(0); // Reset or load previous duration from DB
  };

  const stopTimer = () => {
    if (activeTask) {
       // Save to DB
       console.log(`Stopping task ${activeTask.id}. Total: ${elapsedSeconds}s`);
       setActiveTask(null);
       setElapsedSeconds(0);
    }
  };

  const toggleClockIn = () => {
    if (isClockedIn) {
      setIsClockedIn(false);
      setClockInTime(null);
    } else {
      setIsClockedIn(true);
      setClockInTime(new Date());
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
      clockInTime,
      startTimer,
      stopTimer,
      toggleClockIn,
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