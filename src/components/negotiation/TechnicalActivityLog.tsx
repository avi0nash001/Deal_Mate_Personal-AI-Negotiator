import React, { useState } from 'react';
import { ActivityLogEntry } from '../../types';
import { Terminal, ChevronDown, ChevronUp, ShieldCheck, Check, AlertTriangle } from 'lucide-react';

interface TechnicalActivityLogProps {
  logs: ActivityLogEntry[];
  sessionId?: string;
}

export const TechnicalActivityLog: React.FC<TechnicalActivityLogProps> = ({
  logs,
  sessionId,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="rounded-xl border border-slate-800 bg-[#080B12] overflow-hidden shadow-lg">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 bg-slate-900/60 hover:bg-slate-900 flex items-center justify-between transition-colors text-left focus:outline-none"
      >
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-bold font-mono uppercase text-slate-200">
            Technical Multi-Agent Audit Log
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
            {logs.length} Events
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <span className="hidden sm:inline text-[11px]">
            {sessionId ? `Session: ${sessionId}` : 'Inspect Internal Decision Tree'}
          </span>
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {isExpanded && (
        <div className="p-3 border-t border-slate-800 max-h-72 overflow-y-auto font-mono text-[11px] space-y-2 bg-[#06080E]">
          {logs.length === 0 ? (
            <div className="text-slate-500 py-3 text-center">
              Awaiting first agent interaction...
            </div>
          ) : (
            logs.map((log) => {
              const isBuyer = log.agent === 'BUYER_AGENT';
              const isSuccess = log.type === 'success';
              const isWarning = log.type === 'warning';

              return (
                <div
                  key={log.id}
                  className="p-2 rounded bg-slate-900/40 border border-slate-800/80 flex items-start gap-2.5"
                >
                  <span className="text-slate-500 text-[10px] shrink-0 mt-0.5">
                    [{log.timestamp}]
                  </span>

                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                          isBuyer
                            ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/60'
                            : 'bg-amber-950 text-amber-300 border border-amber-800/60'
                        }`}
                      >
                        {log.agent}
                      </span>
                      <span className="text-white font-semibold">{log.step}</span>
                      {isSuccess && (
                        <Check className="w-3 h-3 text-emerald-400 ml-auto" />
                      )}
                      {isWarning && (
                        <AlertTriangle className="w-3 h-3 text-rose-400 ml-auto" />
                      )}
                    </div>
                    <p className="text-slate-400 text-[11px] mt-1 leading-normal font-sans">
                      {log.detail}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
