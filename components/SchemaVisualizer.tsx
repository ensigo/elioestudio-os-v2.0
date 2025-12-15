import React from 'react';
import { SCHEMA_DEFINITIONS } from '../constants';
import { Database, Lock, Key, AlertTriangle } from 'lucide-react';

export const SchemaVisualizer = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Phase 1: Bulletproof Data Model</h2>
        <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-xs font-mono border border-blue-500/30">
          PostgreSQL 15+ STRICT
        </span>
      </div>
      <p className="text-slate-400 max-w-3xl">
        This schema is designed to enforce business logic at the database level. 
        We rely on foreign keys, check constraints, and triggers to prevent data corruption 
        regardless of frontend validation failures.
      </p>

      <div className="grid grid-cols-1 gap-8 mt-8">
        {SCHEMA_DEFINITIONS.map((entity) => (
          <div key={entity.name} className="bg-[#1e293b] rounded-xl border border-slate-700 overflow-hidden shadow-xl">
            <div className="bg-[#0f172a] px-6 py-4 border-b border-slate-700 flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <Database size={16} className="text-emerald-400" />
                <h3 className="text-lg font-mono font-bold text-emerald-400">{entity.name}</h3>
                <span className="text-xs text-slate-500 uppercase px-2 bg-slate-800 rounded">{entity.type}</span>
              </div>
            </div>
            
            <div className="p-0">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-[#162032] text-slate-400">
                    <th className="px-6 py-3 font-medium">Field</th>
                    <th className="px-6 py-3 font-medium">Type</th>
                    <th className="px-6 py-3 font-medium">Constraints (The Law)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {entity.fields.map((field) => (
                    <tr key={field.name} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-3 font-mono text-slate-300">{field.name}</td>
                      <td className="px-6 py-3 text-blue-300 font-mono text-xs">{field.type}</td>
                      <td className="px-6 py-3">
                        <div className="flex flex-wrap gap-2">
                          {field.constraints.map((c, i) => (
                            <span key={i} className={`flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-mono border ${
                              c.includes('PK') ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                              c.includes('FK') ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                              c.includes('CHECK') ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                              'bg-slate-700 text-slate-300 border-slate-600'
                            }`}>
                              {c.includes('PK') && <Key size={10} />}
                              {c.includes('CHECK') && <Lock size={10} />}
                              <span>{c}</span>
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="bg-red-950/20 px-6 py-4 border-t border-red-900/20">
              <h4 className="text-xs font-bold text-red-400 uppercase tracking-wider mb-2 flex items-center">
                <AlertTriangle size={12} className="mr-1" /> enforced Policies
              </h4>
              <ul className="space-y-1">
                {entity.policies.map((p, i) => (
                  <li key={i} className="text-xs text-red-200/70 font-mono pl-4 border-l-2 border-red-800">
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};