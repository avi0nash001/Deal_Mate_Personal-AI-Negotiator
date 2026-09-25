import React from 'react';
import { Target, ShieldAlert, CheckCircle2, TrendingDown } from 'lucide-react';

interface BudgetMeterProps {
  target: number;
  maxBudget: number;
  currentOffer: number;
  originalPrice: number;
}

export const BudgetMeter: React.FC<BudgetMeterProps> = ({
  target,
  maxBudget,
  currentOffer,
  originalPrice,
}) => {
  // Normalize scale from 90% of target to originalPrice
  const minScale = Math.round(target * 0.85);
  const maxScale = Math.max(originalPrice, maxBudget * 1.15);

  const getPercent = (val: number) => {
    const clamped = Math.max(minScale, Math.min(maxScale, val));
    return ((clamped - minScale) / (maxScale - minScale)) * 100;
  };

  const currentPercent = getPercent(currentOffer);
  const targetPercent = getPercent(target);
  const maxBudgetPercent = getPercent(maxBudget);

  const isUnderTarget = currentOffer <= target;
  const isUnderMax = currentOffer <= maxBudget;
  const savings = Math.max(0, originalPrice - currentOffer);

  return (
    <div className="rounded-xl border border-slate-800/80 bg-[#0A0E18]/90 p-4 shadow-xl">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-bold text-white tracking-wide uppercase">
            Your Budget Discipline
          </span>
        </div>
        <div className="text-[11px] font-mono text-slate-400">
          Ceiling: <span className="text-amber-400 font-bold">₹{maxBudget.toLocaleString('en-IN')}</span>
        </div>
      </div>

      {/* Primary Figures Grid */}
      <div className="grid grid-cols-3 gap-2 text-center py-2 px-1 bg-slate-900/60 rounded-lg border border-slate-800/60 mb-3">
        <div>
          <span className="text-[10px] font-mono text-slate-400 uppercase">Target</span>
          <p className="text-xs font-bold font-mono text-cyan-300 mt-0.5">
            ₹{target.toLocaleString('en-IN')}
          </p>
        </div>
        <div className="border-x border-slate-800/80">
          <span className="text-[10px] font-mono text-slate-400 uppercase">Current Bid</span>
          <p
            className={`text-xs font-bold font-mono mt-0.5 ${
              isUnderTarget
                ? 'text-emerald-400'
                : isUnderMax
                ? 'text-cyan-300'
                : 'text-rose-400'
            }`}
          >
            ₹{currentOffer.toLocaleString('en-IN')}
          </p>
        </div>
        <div>
          <span className="text-[10px] font-mono text-slate-400 uppercase">Max Limit</span>
          <p className="text-xs font-bold font-mono text-amber-400 mt-0.5">
            ₹{maxBudget.toLocaleString('en-IN')}
          </p>
        </div>
      </div>

      {/* Progress Track */}
      <div className="relative pt-6 pb-2">
        {/* Track bar */}
        <div className="relative h-2 w-full rounded-full bg-slate-800 overflow-hidden">
          {/* Active fill */}
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              isUnderTarget
                ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-md shadow-emerald-500/50'
                : isUnderMax
                ? 'bg-gradient-to-r from-cyan-500 to-sky-400 shadow-md shadow-cyan-500/50'
                : 'bg-gradient-to-r from-amber-500 to-rose-500 shadow-md shadow-rose-500/50'
            }`}
            style={{ width: `${Math.min(100, Math.max(4, currentPercent))}%` }}
          />
        </div>

        {/* Target Marker Flag */}
        <div
          className="absolute top-1 transform -translate-x-1/2 flex flex-col items-center pointer-events-none transition-all duration-300"
          style={{ left: `${targetPercent}%` }}
        >
          <span className="text-[9px] font-mono text-cyan-400 font-bold">Target</span>
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 ring-2 ring-[#080B11]" />
        </div>

        {/* Max Budget Marker Flag */}
        <div
          className="absolute top-1 transform -translate-x-1/2 flex flex-col items-center pointer-events-none transition-all duration-300"
          style={{ left: `${maxBudgetPercent}%` }}
        >
          <span className="text-[9px] font-mono text-amber-400 font-bold">Ceiling</span>
          <div className="w-1.5 h-1.5 rounded-full bg-amber-400 ring-2 ring-[#080B11]" />
        </div>
      </div>

      {/* Bottom Summary Bar */}
      <div className="mt-2 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 font-mono text-[11px]">
          {isUnderTarget ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-300 font-semibold">At or below target!</span>
            </>
          ) : isUnderMax ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-cyan-300 font-medium">Within acceptable budget</span>
            </>
          ) : (
            <>
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              <span className="text-rose-300 font-medium">Exceeds ceiling limit</span>
            </>
          )}
        </div>

        {savings > 0 && (
          <div className="flex items-center gap-1 font-mono text-[11px] text-emerald-400 font-semibold">
            <TrendingDown className="w-3 h-3" />
            <span>₹{savings.toLocaleString('en-IN')} below list</span>
          </div>
        )}
      </div>
    </div>
  );
};
