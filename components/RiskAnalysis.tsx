import React from 'react';
import { CRITICAL_RISKS } from '../constants';
import { ShieldCheck, AlertOctagon, Zap } from 'lucide-react';

export const RiskAnalysis = () => {
  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Phase 3: Edge Case Anticipation</h2>
        <p className="text-slate-400">
          A proactive report on inevitable system failures. We do not hope these don't happen; 
          we engineer the system to handle them when they do.
        </p>
      </div>

      <div className="grid gap-6">
        {CRITICAL_RISKS.map((risk) => (
          <div key={risk.id} className="relative group bg-[#1e293b] border border-slate-700 rounded-lg p-6 hover:border-red-500/50 transition-all duration-300">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-100 transition-opacity">
               <ShieldCheck size={48} className="text-emerald-500" />
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="mt-1">
                <span className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                  risk.impactLevel === 'Critical' ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' :
                  risk.impactLevel === 'High' ? 'bg-orange-500 text-white' : 'bg-yellow-500 text-black'
                }`}>
                  {risk.id}
                </span>
              </div>
              
              <div className="flex-1 space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center">
                    {risk.title}
                    {risk.impactLevel === 'Critical' && (
                      <span className="ml-3 px-2 py-0.5 bg-red-500/20 text-red-400 text-[10px] uppercase border border-red-500/30 rounded">Critical</span>
                    )}
                  </h3>
                </div>

                <div className="bg-slate-900/50 p-4 rounded-md border border-slate-800">
                  <h4 className="text-xs font-bold text-slate-500 uppercase mb-1 flex items-center">
                    <AlertOctagon size={12} className="mr-1" /> The Fail Scenario
                  </h4>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    {risk.scenario}
                  </p>
                </div>

                <div className="bg-emerald-950/20 p-4 rounded-md border border-emerald-900/30">
                  <h4 className="text-xs font-bold text-emerald-500 uppercase mb-1 flex items-center">
                    <Zap size={12} className="mr-1" /> The Technical Solution
                  </h4>
                  <p className="text-emerald-100/80 text-sm font-mono leading-relaxed">
                    {risk.technicalSolution}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};