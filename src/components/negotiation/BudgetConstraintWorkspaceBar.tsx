import React, { useState, useEffect, useRef } from 'react';
import {
  Target,
  Wallet,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  TrendingDown,
  Plus,
  Minus,
  Check,
} from 'lucide-react';

export interface BudgetConstraintWorkspaceBarProps {
  targetPrice: number;
  maxBudget: number;
  currentPrice?: number;
  originalPrice?: number;
  floorPrice?: number;
  onUpdateBudget?: (newBudget: number) => void;
  onUpdateTarget?: (newTarget: number) => void;
  isLight?: boolean;
  compact?: boolean;
  label?: string;
  showQuickPresets?: boolean;
}

export const BudgetConstraintWorkspaceBar: React.FC<BudgetConstraintWorkspaceBarProps> = ({
  targetPrice,
  maxBudget,
  currentPrice,
  originalPrice,
  floorPrice,
  onUpdateBudget,
  onUpdateTarget,
  isLight = false,
  compact = false,
  label = 'Active Budget Constraint',
  showQuickPresets = true,
}) => {
  // Automatic visual highlight state when user modifies budget constraint
  const [isHighlighted, setIsHighlighted] = useState(false);
  const [highlightDelta, setHighlightDelta] = useState<number | null>(null);
  const [isCustomEditing, setIsCustomEditing] = useState(false);
  const [customInputValue, setCustomInputValue] = useState(String(maxBudget));

  const prevBudgetRef = useRef(maxBudget);
  const initialMountRef = useRef(true);

  // Trigger visual highlight automatically whenever maxBudget changes
  useEffect(() => {
    if (initialMountRef.current) {
      initialMountRef.current = false;
      return;
    }

    if (prevBudgetRef.current !== maxBudget) {
      const delta = maxBudget - prevBudgetRef.current;
      prevBudgetRef.current = maxBudget;
      setHighlightDelta(delta);
      setIsHighlighted(true);
      setCustomInputValue(String(maxBudget));

      const timer = setTimeout(() => {
        setIsHighlighted(false);
      }, 4500);

      return () => clearTimeout(timer);
    }
  }, [maxBudget]);

  // Compute ratio of target price to maximum budget
  const safeBudget = Math.max(1, maxBudget);
  const ratio = targetPrice / safeBudget;
  const percentage = Math.min(100, Math.max(3, Math.round(ratio * 100)));
  const headroom = maxBudget - targetPrice;

  // Dynamic color shift based on proximity of target price to maximum budget
  let colorTheme: {
    barGradient: string;
    barShadow: string;
    textPrimary: string;
    badgeBg: string;
    badgeText: string;
    badgeBorder: string;
    statusLabel: string;
    statusIcon: React.ReactNode;
  };

  if (ratio <= 0.70) {
    // Stage 1: Target is well below budget ceiling (>30% headroom)
    colorTheme = {
      barGradient: 'from-emerald-500 via-teal-400 to-emerald-400',
      barShadow: 'shadow-emerald-500/50',
      textPrimary: 'text-emerald-400',
      badgeBg: 'bg-emerald-500/15',
      badgeText: 'text-emerald-400',
      badgeBorder: 'border-emerald-500/30',
      statusLabel: 'Safe Margin — Target well under budget',
      statusIcon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />,
    };
  } else if (ratio <= 0.85) {
    // Stage 2: Target comfortably under budget (15-30% headroom)
    colorTheme = {
      barGradient: 'from-teal-400 via-cyan-400 to-sky-400',
      barShadow: 'shadow-cyan-500/50',
      textPrimary: 'text-cyan-400',
      badgeBg: 'bg-cyan-500/15',
      badgeText: 'text-cyan-400',
      badgeBorder: 'border-cyan-500/30',
      statusLabel: 'Moderate Cushion — Within budget comfort zone',
      statusIcon: <Target className="w-3.5 h-3.5 text-cyan-400" />,
    };
  } else if (ratio <= 0.95) {
    // Stage 3: Approaching budget ceiling (5-15% headroom)
    colorTheme = {
      barGradient: 'from-yellow-400 via-amber-400 to-amber-500',
      barShadow: 'shadow-amber-500/50',
      textPrimary: 'text-amber-400',
      badgeBg: 'bg-amber-500/15',
      badgeText: 'text-amber-400',
      badgeBorder: 'border-amber-500/30',
      statusLabel: 'Approaching Ceiling — Target near max budget',
      statusIcon: <AlertCircle className="w-3.5 h-3.5 text-amber-400" />,
    };
  } else if (ratio <= 1.00) {
    // Stage 4: At ceiling (0-5% headroom)
    colorTheme = {
      barGradient: 'from-amber-500 via-orange-500 to-rose-400',
      barShadow: 'shadow-orange-500/60',
      textPrimary: 'text-orange-400',
      badgeBg: 'bg-orange-500/15',
      badgeText: 'text-orange-400',
      badgeBorder: 'border-orange-500/30',
      statusLabel: 'At Budget Ceiling — Maximum headroom utilized',
      statusIcon: <AlertTriangle className="w-3.5 h-3.5 text-orange-400" />,
    };
  } else {
    // Stage 5: Exceeds budget (>100%)
    colorTheme = {
      barGradient: 'from-orange-600 via-rose-500 to-red-600',
      barShadow: 'shadow-rose-500/60',
      textPrimary: 'text-rose-400',
      badgeBg: 'bg-rose-500/15',
      badgeText: 'text-rose-400',
      badgeBorder: 'border-rose-500/30',
      statusLabel: 'Exceeds Maximum Budget Limit',
      statusIcon: <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />,
    };
  }

  const handleAdjustBudget = (delta: number) => {
    if (!onUpdateBudget) return;
    const newBudget = Math.max(500, maxBudget + delta);
    onUpdateBudget(newBudget);
  };

  const handleSaveCustomBudget = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(customInputValue.replace(/[^0-9]/g, ''), 10);
    if (!isNaN(val) && val >= 500 && onUpdateBudget) {
      onUpdateBudget(val);
      setIsCustomEditing(false);
    }
  };

  return (
    <div
      className={`rounded-2xl border transition-all duration-300 relative overflow-hidden ${
        isHighlighted
          ? 'ring-2 ring-amber-400 shadow-xl shadow-amber-500/20 ' +
            (isLight
              ? 'bg-amber-50/70 border-amber-400'
              : 'bg-gradient-to-b from-[#131b2e] to-[#0d1220] border-amber-400/80')
          : isLight
          ? 'bg-slate-50/80 border-slate-200 shadow-xs'
          : 'bg-[#0B0F19]/90 border-slate-800 shadow-sm'
      } ${compact ? 'p-3 space-y-2' : 'p-3.5 sm:p-4 space-y-3'}`}
    >
      {/* Animated Highlight Banner when budget is modified */}
      {isHighlighted && (
        <div className="flex items-center justify-between gap-2 px-2.5 py-1 rounded-xl bg-amber-500/20 border border-amber-400/40 text-[11px] font-mono text-amber-300 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="flex items-center gap-1.5 font-bold">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin shrink-0" style={{ animationDuration: '3s' }} />
            <span>Budget Constraint Updated: ₹{maxBudget.toLocaleString('en-IN')}</span>
          </div>
          {highlightDelta !== null && highlightDelta !== 0 && (
            <span
              className={`px-1.5 py-0.2 rounded font-bold text-[10px] ${
                highlightDelta > 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
              }`}
            >
              {highlightDelta > 0 ? `+₹${highlightDelta.toLocaleString('en-IN')}` : `-₹${Math.abs(highlightDelta).toLocaleString('en-IN')}`}
            </span>
          )}
        </div>
      )}

      {/* Header Row: Label & Current Status Badge */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5">
          <Wallet
            className={`w-4 h-4 transition-colors ${
              isHighlighted ? 'text-amber-400 animate-bounce' : isLight ? 'text-blue-600' : 'text-cyan-400'
            }`}
          />
          <span
            className={`text-xs font-display font-bold uppercase tracking-wider ${
              isHighlighted
                ? 'text-amber-400'
                : isLight
                ? 'text-slate-800'
                : 'text-slate-200'
            }`}
          >
            {label}
          </span>
          {isHighlighted && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-400 text-slate-950 uppercase tracking-wider animate-pulse">
              Active Focus
            </span>
          )}
        </div>

        {/* Current Color-Shifted Proximity Badge */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold border transition-all ${colorTheme.badgeBg} ${colorTheme.badgeText} ${colorTheme.badgeBorder}`}
        >
          {colorTheme.statusIcon}
          <span className="truncate">{colorTheme.statusLabel}</span>
        </div>
      </div>

      {/* Comparison Metrics Grid: Target Price vs Ceiling Limit vs Buffer */}
      <div
        className={`grid grid-cols-3 gap-2 text-center p-2 rounded-xl border font-mono transition-colors ${
          isLight ? 'bg-white border-slate-200' : 'bg-slate-900/60 border-slate-800/80'
        }`}
      >
        <div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">
            Target Ask
          </span>
          <p className="text-xs sm:text-sm font-bold text-blue-600 dark:text-cyan-300 mt-0.5">
            ₹{targetPrice.toLocaleString('en-IN')}
          </p>
        </div>

        <div className="border-x border-slate-200 dark:border-slate-800 px-1">
          <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">
            Max Ceiling
          </span>
          <p
            className={`text-xs sm:text-sm font-bold mt-0.5 transition-colors ${
              isHighlighted
                ? 'text-amber-400 font-extrabold scale-105 inline-block'
                : isLight
                ? 'text-slate-800'
                : 'text-amber-400'
            }`}
          >
            ₹{maxBudget.toLocaleString('en-IN')}
          </p>
        </div>

        <div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">
            {headroom >= 0 ? 'Headroom' : 'Over Limit'}
          </span>
          <p className={`text-xs sm:text-sm font-bold mt-0.5 ${colorTheme.textPrimary}`}>
            {headroom >= 0 ? (
              <span>₹{headroom.toLocaleString('en-IN')}</span>
            ) : (
              <span>-₹{Math.abs(headroom).toLocaleString('en-IN')}</span>
            )}
          </p>
        </div>
      </div>

      {/* Dynamic Color-Shifting Progress Track */}
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 dark:text-slate-400">
          <span>Target vs. Maximum Ceiling Proximity</span>
          <span className={`font-bold ${colorTheme.textPrimary}`}>{percentage}% of ceiling</span>
        </div>

        {/* Outer Bar */}
        <div
          className={`relative h-3 w-full rounded-full overflow-hidden transition-all ${
            isLight ? 'bg-slate-200' : 'bg-slate-800/90'
          }`}
        >
          {/* Active Fill that shifts color as target approaches maximum budget */}
          <div
            className={`h-full transition-all duration-700 ease-out rounded-full bg-gradient-to-r ${colorTheme.barGradient} ${colorTheme.barShadow} shadow-sm relative`}
            style={{ width: `${Math.min(100, percentage)}%` }}
          >
            {/* Subtle animated shimmer line on the bar */}
            <div className="absolute inset-0 bg-white/20 opacity-30 animate-pulse rounded-full" />
          </div>

          {/* 100% Ceiling Reference Marker Line */}
          <div className="absolute top-0 bottom-0 right-0 w-0.5 bg-rose-500/80 z-10" title="100% Maximum Budget Ceiling" />
        </div>

        {/* Legend Scale Markers */}
        <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 pt-0.5">
          <span className="text-emerald-500 font-semibold">0% (Ample Room)</span>
          <span className="text-amber-500 font-semibold">85% (Approaching)</span>
          <span className="text-rose-500 font-semibold">100% (Ceiling)</span>
        </div>
      </div>

      {/* Interactive Quick Budget Adjuster in Workspace (Requirement: user modifies budget constraint) */}
      {showQuickPresets && onUpdateBudget && (
        <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400">
            <span>Adjust Budget Constraint:</span>
            {!isCustomEditing ? (
              <button
                type="button"
                onClick={() => setIsCustomEditing(true)}
                className="text-[10px] text-blue-600 dark:text-cyan-400 hover:underline cursor-pointer"
              >
                Custom Value
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsCustomEditing(false)}
                className="text-[10px] text-slate-400 hover:underline cursor-pointer"
              >
                Cancel
              </button>
            )}
          </div>

          {!isCustomEditing ? (
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleAdjustBudget(-500)}
                disabled={maxBudget <= 500}
                className={`px-2 py-1 rounded-lg border text-[11px] font-mono font-semibold flex items-center gap-1 cursor-pointer transition-colors disabled:opacity-40 ${
                  isLight
                    ? 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
                    : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300'
                }`}
                title="Decrease budget ceiling by ₹500"
              >
                <Minus className="w-3 h-3 text-rose-400" />
                <span>-₹500</span>
              </button>

              <button
                type="button"
                onClick={() => handleAdjustBudget(200)}
                className={`px-2 py-1 rounded-lg border text-[11px] font-mono font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
                  isLight
                    ? 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
                    : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300'
                }`}
                title="Increase budget ceiling by ₹200"
              >
                <Plus className="w-3 h-3 text-emerald-400" />
                <span>+₹200</span>
              </button>

              <button
                type="button"
                onClick={() => handleAdjustBudget(500)}
                className={`px-2 py-1 rounded-lg border text-[11px] font-mono font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
                  isLight
                    ? 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
                    : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300'
                }`}
                title="Increase budget ceiling by ₹500"
              >
                <Plus className="w-3 h-3 text-emerald-400" />
                <span>+₹500</span>
              </button>

              <button
                type="button"
                onClick={() => handleAdjustBudget(1000)}
                className={`px-2 py-1 rounded-lg border text-[11px] font-mono font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
                  isLight
                    ? 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
                    : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300'
                }`}
                title="Increase budget ceiling by ₹1,000"
              >
                <Plus className="w-3 h-3 text-emerald-400" />
                <span>+₹1,000</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleSaveCustomBudget} className="flex items-center gap-1.5">
              <div className="relative flex-1">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-500">
                  ₹
                </span>
                <input
                  type="number"
                  min="500"
                  step="100"
                  value={customInputValue}
                  onChange={(e) => setCustomInputValue(e.target.value)}
                  placeholder="Enter budget..."
                  className={`w-full pl-6 pr-2 py-1 rounded-lg border text-xs font-mono outline-none transition-colors ${
                    isLight
                      ? 'bg-white border-slate-300 text-slate-800 focus:border-blue-500'
                      : 'bg-slate-900 border-slate-700 text-slate-200 focus:border-cyan-400'
                  }`}
                  autoFocus
                />
              </div>
              <button
                type="submit"
                className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-1 cursor-pointer"
              >
                <Check className="w-3 h-3" />
                <span>Apply</span>
              </button>
            </form>
          )}
        </div>
      )}

      {/* Target Price Notice if below seller floor */}
      {floorPrice && targetPrice < floorPrice && (
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-amber-500 dark:text-amber-400 pt-1">
          <AlertTriangle className="w-3 h-3 shrink-0" />
          <span>Note: Target is below seller base floor of ₹{floorPrice.toLocaleString('en-IN')}.</span>
        </div>
      )}
    </div>
  );
};
