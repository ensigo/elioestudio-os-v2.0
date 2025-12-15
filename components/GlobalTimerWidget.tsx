import React from 'react';
import { useTimeTracking } from '../context/TimeTrackingContext';
import { Pause, Square, Play } from 'lucide-react';
import { getProjectName } from '../lib/mock-data';

export const GlobalTimerWidget = () => {
  const { activeTask, elapsedSeconds, stopTimer, formatTime } = useTimeTracking();

  if (!activeTask) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 duration-300">
      <div className="bg-elio-black text-white p-4 rounded-xl shadow-2xl border border-gray-800 flex items-center space-x-4 min-w-[300px]">
        {/* Pulsing Dot */}
        <div className="relative">
           <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
           <div className="absolute top-0 left-0 w-3 h-3 bg-red-500 rounded-full animate-ping opacity-75"></div>
        </div>

        <div className="flex-1">
          <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider truncate max-w-[150px]">
             {getProjectName(activeTask.projectId)}
          </p>
          <p className="text-sm font-bold text-white truncate max-w-[180px]">
             {activeTask.title}
          </p>
          <p className="text-xl font-mono text-elio-yellow font-medium mt-1">
             {formatTime(elapsedSeconds)}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button 
            onClick={stopTimer}
            className="p-2 bg-gray-800 hover:bg-red-900/50 hover:text-red-400 rounded-lg transition-colors"
            title="Detener y Guardar"
          >
            <Square size={18} fill="currentColor" />
          </button>
        </div>
      </div>
    </div>
  );
};