import React from 'react';
import { Users, TrendingDown, Sparkles, CheckCircle2 } from 'lucide-react';
import { CollectiveDealPool } from '../../types';

interface CollectiveDealIndicatorProps {
  pool: CollectiveDealPool;
  compact?: boolean;
  onJoinPool?: (pool: CollectiveDealPool) => void;
  className?: string;
}

export const CollectiveDealIndicator: React.FC<CollectiveDealIndicatorProps> = ({
  pool,
  compact = false,
  onJoinPool,
  className = '',
}) => {
  const currentQty = pool.currentQuantity;
  const targetQty = pool.targetQuantity;
  const progressPct = Math.min(100, Math.round((currentQty / targetQty) * 100));
  const remainingQty = Math.max(0, targetQty - currentQty);
  const potentialSavings = pool.listPrice - pool.collectiveTargetPrice;
  const savingsPct = Math.round((potentialSavings / pool.listPrice) * 100);

  if (compact) {
    return (
      <div
        className={`p-2 rounded-xl border bg-purple-500/10 border-purple-500/25 text-purple-900 dark:text-purple-200 space-y-1.5 ${className}`}
      >
        <div className="flex items-center justify-between text-[11px] font-mono">
          <div className="flex items-center gap-1.5 font-bold text-purple-700 dark:text-purple-300">
            <Users className="w-3.5 h-3.5 shrink-0" />
            <span>Group Deal Active</span>
          </div>
          <span className="font-semibold text-purple-600 dark:text-purple-400">
            {pool.participantsCount} buyers ({currentQty}/{targetQty} units)
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1.5 rounded-full bg-purple-200/50 dark:bg-purple-950/60 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Price Drop Insight */}
        <div className="flex items-center justify-between text-[10px] font-mono pt-0.5">
          <span className="text-slate-600 dark:text-slate-400">
            {remainingQty > 0 ? `${remainingQty} units left to unlock` : 'Target reached!'}
          </span>
          <span className="font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
            <TrendingDown className="w-3 h-3" />
            <span>₹{pool.collectiveTargetPrice.toLocaleString('en-IN')} (-{savingsPct}%)</span>
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`p-3 rounded-2xl border transition-all ${
        pool.status === 'UNLOCKED'
          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-200'
          : 'bg-purple-500/10 border-purple-500/30 text-purple-950 dark:text-purple-200'
      } ${className}`}
    >
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5 font-bold text-xs text-purple-700 dark:text-purple-300">
          <div className="p-1 rounded-lg bg-purple-500/20 text-purple-600 dark:text-purple-300">
            <Users className="w-3.5 h-3.5" />
          </div>
          <span>Active Collective Deal Opportunity</span>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-bold">
          {pool.participantsCount} Shoppers Pledged
        </span>
      </div>

      {/* Progress & Units */}
      <div className="space-y-1 my-2">
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-700 dark:text-slate-300">
          <span>
            Pledged: <strong>{currentQty}</strong> / {targetQty} units
          </span>
          <span className="font-bold text-purple-600 dark:text-purple-400">
            {progressPct}% target ({pool.probabilityScore}% unlock chance)
          </span>
        </div>
        <div className="w-full h-2 rounded-full bg-purple-200/50 dark:bg-purple-950/60 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Potential Price-Drop Insight */}
      <div className="flex items-start sm:items-center justify-between gap-2 pt-2 border-t border-purple-200/40 dark:border-purple-800/40 text-xs">
        <div className="flex items-center gap-1 text-[11px] text-slate-600 dark:text-slate-400">
          <Sparkles className="w-3 h-3 text-purple-500 shrink-0" />
          <span>
            {remainingQty > 0
              ? `Only ${remainingQty} more units needed for group unlock`
              : 'Wholesale batch tier unlocked!'}
          </span>
        </div>
        <div className="text-right shrink-0">
          <div className="text-[10px] font-mono text-slate-500 line-through">
            MRP ₹{pool.listPrice.toLocaleString('en-IN')}
          </div>
          <div className="text-xs font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
            Group Target: ₹{pool.collectiveTargetPrice.toLocaleString('en-IN')}
          </div>
        </div>
      </div>

      {onJoinPool && (
        <button
          type="button"
          onClick={() => onJoinPool(pool)}
          className="mt-2.5 w-full py-1.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-mono text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Join Group Deal & Lock In ₹{pool.collectiveTargetPrice.toLocaleString('en-IN')}</span>
        </button>
      )}
    </div>
  );
};
