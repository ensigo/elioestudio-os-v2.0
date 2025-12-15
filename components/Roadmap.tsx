import React from 'react';
import { ROADMAP } from '../constants';
import { CheckCircle2, ArrowRight } from 'lucide-react';

export const Roadmap = () => {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Phase 4: Implementation Roadmap</h2>
        <p className="text-slate-400">
          Sequential execution strategy. No module is built until the underlying dependencies are validated.
        </p>
      </div>

      <div className="relative border-l-2 border-slate-800 ml-4 space-y-12">
        {ROADMAP.map((phase, index) => (
          <div key={index} className="relative pl-8">
            <span className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-slate-800 border-2 border-emerald-500"></span>
            
            <div className="bg-[#1e293b] p-6 rounded-lg border border-slate-700 shadow-lg">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                <div>
                  <span className="text-xs font-mono text-emerald-400 font-bold uppercase tracking-widest">
                    Phase 0{phase.phase}
                  </span>
                  <h3 className="text-xl font-bold text-white mt-1">{phase.name}</h3>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">Modules to Build</h4>
                  <ul className="space-y-2">
                    {phase.modules.map((mod, i) => (
                      <li key={i} className="flex items-center text-sm text-slate-300">
                        <CheckCircle2 size={14} className="text-slate-600 mr-2" />
                        {mod}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="bg-slate-900 p-4 rounded border border-slate-800 flex flex-col justify-center">
                  <h4 className="text-xs font-bold text-blue-400 uppercase mb-2">Validation Goal</h4>
                  <p className="text-sm text-slate-300 italic">
                    "{phase.validationGoal}"
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
        
        <div className="relative pl-8">
           <div className="flex items-center text-slate-500">
              <ArrowRight size={16} className="mr-2" />
              <span className="text-sm font-mono">Future Scalability (API, Multitenancy)</span>
           </div>
        </div>
      </div>
    </div>
  );
};