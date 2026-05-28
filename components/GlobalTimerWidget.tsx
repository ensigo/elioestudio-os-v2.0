import { useTimeTracking } from '../context/TimeTrackingContext';
import { Square, Timer } from 'lucide-react';

export const GlobalTimerWidget = () => {
  const { activeTaskEntry, taskElapsedSeconds, stopTaskTimer, formatTime } = useTimeTracking();

  if (!activeTaskEntry) return null;

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 animate-in slide-in-from-bottom-5 duration-300 max-w-[calc(100vw-2rem)] sm:max-w-none">
      <div className="bg-elio-black text-white px-3 py-2.5 sm:px-4 sm:py-3 rounded-xl shadow-2xl border border-gray-700 flex items-center gap-3 sm:gap-4 sm:min-w-[280px]">
        <div className="relative flex-shrink-0">
          <div className="w-2.5 h-2.5 bg-elio-yellow rounded-full animate-pulse" />
          <div className="absolute top-0 left-0 w-2.5 h-2.5 bg-elio-yellow rounded-full animate-ping opacity-60" />
        </div>
        <div className="flex-1 min-w-0">
          {activeTaskEntry.proyectoTitle && (
            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider truncate">
              {activeTaskEntry.proyectoTitle}
            </p>
          )}
          <p className="text-sm font-semibold text-white truncate leading-tight">
            {activeTaskEntry.taskTitle}
          </p>
          <p className="text-lg font-mono text-elio-yellow font-bold mt-0.5 tabular-nums">
            {formatTime(taskElapsedSeconds)}
          </p>
        </div>
        <button
          onClick={stopTaskTimer}
          className="flex-shrink-0 p-2 bg-gray-800 hover:bg-red-900/60 hover:text-red-400 rounded-lg transition-colors"
          title="Detener timer"
        >
          <Square size={16} className="fill-current" />
        </button>
      </div>
      {/* Pulse ring */}
      <div className="absolute -bottom-1 -right-1">
        <Timer size={14} className="text-elio-yellow opacity-60" />
      </div>
    </div>
  );
};
