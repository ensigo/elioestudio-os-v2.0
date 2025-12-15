import React, { useState } from 'react';
import { TaskStatus } from '../types';
import { ArrowRight, AlertTriangle, RefreshCcw, Lock } from 'lucide-react';

export const StateMachineDemo = () => {
  const [currentState, setCurrentState] = useState<TaskStatus>('PENDING');
  const [timeTracked, setTimeTracked] = useState(0);
  const [revisionCount, setRevisionCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // The Logic Matrix (Phase 2 Requirement)
  const transitions: Record<TaskStatus, TaskStatus[]> = {
    PENDING: ['IN_PROGRESS'],
    IN_PROGRESS: ['IN_REVIEW', 'PENDING'],
    IN_REVIEW: ['APPROVED', 'CORRECTION'],
    CORRECTION: ['IN_PROGRESS'], // Back to progress to fix
    APPROVED: ['CLOSED'],
    CLOSED: [], // Terminal state
    BREACHED: ['CLOSED'],
  };

  const handleTransition = (nextState: TaskStatus) => {
    setError(null);

    // Business Logic Constraints (Phase 3 Requirement)
    if (nextState === 'CLOSED' && timeTracked === 0) {
      setError("CONSTRAINT VIOLATION: Cannot close task with 0 time tracked.");
      return;
    }

    if (nextState === 'CORRECTION') {
      const newCount = revisionCount + 1;
      setRevisionCount(newCount);
      if (newCount > 3) {
        setError("ALERT: Excessive revisions detected. Triggering Quality Audit.");
        // We still allow transition, but we'd fire a backend event here
      }
    }

    setCurrentState(nextState);
  };

  const reset = () => {
    setCurrentState('PENDING');
    setTimeTracked(0);
    setRevisionCount(0);
    setError(null);
  };

  return (
    <div className="space-y-8">
       <div>
        <h2 className="text-2xl font-bold text-white mb-2">Phase 2: State Machine Simulator</h2>
        <p className="text-slate-400">
          Interactive prototype of the immutable logic governing task lifecycles. 
          Try to break it.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Visualizer */}
        <div className="bg-[#1e293b] p-8 rounded-xl border border-slate-700 flex flex-col items-center justify-center relative min-h-[400px]">
          <div className="text-xs font-mono text-slate-500 absolute top-4 left-4">CURRENT_STATE</div>
          
          <div className={`text-3xl font-black font-mono tracking-wider px-8 py-4 rounded-lg border-2 mb-8 ${
            currentState === 'CLOSED' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' :
            currentState === 'CORRECTION' ? 'bg-amber-500/20 border-amber-500 text-amber-400' :
            currentState === 'BREACHED' ? 'bg-red-500/20 border-red-500 text-red-400' :
            'bg-slate-800 border-slate-600 text-white'
          }`}>
            {currentState}
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500 text-red-400 rounded text-sm flex items-center max-w-sm animate-pulse">
              <AlertTriangle size={16} className="mr-2 shrink-0" />
              {error}
            </div>
          )}

          <div className="flex flex-wrap gap-3 justify-center">
            {transitions[currentState].length > 0 ? (
              transitions[currentState].map((state) => (
                <button
                  key={state}
                  onClick={() => handleTransition(state)}
                  className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md font-mono text-xs font-bold transition-all transform active:scale-95"
                >
                  {state} <ArrowRight size={14} className="ml-2" />
                </button>
              ))
            ) : (
               <div className="text-slate-500 flex items-center text-sm">
                  <Lock size={14} className="mr-2" /> Terminal State
               </div>
            )}
          </div>
          
          {currentState === 'CLOSED' && (
            <button onClick={reset} className="mt-8 text-slate-500 hover:text-white flex items-center text-xs uppercase tracking-widest">
              <RefreshCcw size={14} className="mr-2" /> Reset Simulation
            </button>
          )}
        </div>

        {/* Controls / Variables */}
        <div className="space-y-6">
          <div className="bg-[#0f172a] p-6 rounded-xl border border-slate-800">
            <h3 className="text-sm font-bold text-slate-400 uppercase mb-4">Task Variables</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Time Tracked (Seconds)</label>
                <div className="flex items-center space-x-4">
                  <input 
                    type="range" 
                    min="0" 
                    max="3600" 
                    value={timeTracked} 
                    onChange={(e) => setTimeTracked(parseInt(e.target.value))}
                    className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                  <span className="font-mono text-white w-12 text-right">{timeTracked}s</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Must be &gt; 0 to Close task.</p>
              </div>

              <div>
                <label className="block text-xs text-slate-500 mb-1">Revision Count</label>
                 <div className="flex items-center justify-between bg-slate-800 p-2 rounded">
                    <span className="font-mono text-white">{revisionCount}</span>
                    <span className="text-[10px] text-slate-500">Triggers Alert at &gt; 3</span>
                 </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
             <h3 className="text-sm font-bold text-slate-400 uppercase mb-2">Active Policies</h3>
             <ul className="space-y-2">
                <li className="text-xs text-emerald-400/70 font-mono flex items-center">
                   <Lock size={10} className="mr-2" /> 
                   NO_SKIP: Cannot skip 'IN_REVIEW'
                </li>
                <li className="text-xs text-emerald-400/70 font-mono flex items-center">
                   <Lock size={10} className="mr-2" /> 
                   REQ_TIME: Close requires time_log
                </li>
                <li className="text-xs text-emerald-400/70 font-mono flex items-center">
                   <Lock size={10} className="mr-2" /> 
                   DAG_FLOW: Backward steps limited
                </li>
             </ul>
          </div>
        </div>
      </div>
    </div>
  );
};