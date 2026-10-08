import React, { useMemo, useState, useRef } from 'react';
import { Product } from '../../types';
import { TrendingDown, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';

interface PriceSparklineProps {
  product: Product;
  className?: string;
  height?: number;
  showLabels?: boolean;
  targetPrice?: number;
}

export const PriceSparkline: React.FC<PriceSparklineProps> = ({
  product,
  className = '',
  height = 28,
  showLabels = true,
  targetPrice,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const chartRef = useRef<SVGSVGElement | null>(null);

  // Generate deterministic 30-day price history with daily date strings
  const historyData = useMemo(() => {
    if (product.priceHistory && product.priceHistory.length >= 20) {
      return product.priceHistory.map((p, idx) => ({
        day: idx + 1,
        dateStr: p.date || `Day ${idx + 1}`,
        price: p.price,
      }));
    }

    const current = product.listPrice;
    const peak = Math.max(product.marketPrice, Math.round(current * 1.18));
    const lowest = Math.max(
      product.minAcceptablePrice || Math.round(current * 0.9),
      Math.round(current * 0.94)
    );

    const hash = product.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const totalDays = 30;
    const data: Array<{ day: number; dateStr: string; price: number }> = [];

    const now = new Date();

    for (let i = 0; i < totalDays; i++) {
      const daysAgo = totalDays - 1 - i;
      const d = new Date(now);
      d.setDate(d.getDate() - daysAgo);
      const dateStr =
        daysAgo === 0
          ? 'Today'
          : d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });

      let price: number;
      if (i === 0) {
        price = peak;
      } else if (i === totalDays - 1) {
        price = current;
      } else {
        const progress = i / (totalDays - 1);
        const base = peak - progress * (peak - current);
        const jitter = Math.sin((hash + i) * 1.35) * (peak - lowest) * 0.16;
        price = Math.round(Math.max(lowest, Math.min(peak * 1.05, base + jitter)));
      }
      data.push({ day: i + 1, dateStr, price });
    }
    return data;
  }, [product]);

  const prices = useMemo(() => historyData.map((d) => d.price), [historyData]);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const avgPrice = Math.round(
    prices.reduce((acc, curr) => acc + curr, 0) / prices.length
  );
  const currentPrice = product.listPrice;
  const isNearAllTimeLow = currentPrice <= minPrice * 1.03;
  const savingsFromAvg = Math.max(0, avgPrice - currentPrice);

  const resolvedTargetPrice =
    targetPrice ||
    product.minAcceptablePrice ||
    Math.round(currentPrice * 0.85);

  const pctFromHigh = Math.max(
    0,
    Math.round(((maxPrice - currentPrice) / maxPrice) * 100)
  );

  const negotiationRoom = Math.max(0, currentPrice - resolvedTargetPrice);

  // AI Price Insight / Recommendation
  const aiInsight = useMemo(() => {
    if (negotiationRoom > 0) {
      return `Price is trending downward. Current price is ₹${currentPrice.toLocaleString(
        'en-IN'
      )}, while the AI target is ₹${resolvedTargetPrice.toLocaleString(
        'en-IN'
      )}. This gives you approximately ₹${negotiationRoom.toLocaleString(
        'en-IN'
      )} of negotiation room.`;
    }
    return `Current price is ₹${currentPrice.toLocaleString(
      'en-IN'
    )}, which matches optimal AI valuation of ₹${resolvedTargetPrice.toLocaleString(
      'en-IN'
    )}. Direct deal locks are recommended.`;
  }, [currentPrice, resolvedTargetPrice, negotiationRoom]);

  // Mini sparkline dimensions
  const miniWidth = 160;
  const miniPaddingY = 4;
  const miniInnerHeight = height - miniPaddingY * 2;
  const range = maxPrice - minPrice || 1;

  const miniPointsSvg = useMemo(() => {
    const stepX = miniWidth / (historyData.length - 1);
    return historyData.map((d, idx) => {
      const x = idx * stepX;
      const y = miniPaddingY + miniInnerHeight - ((d.price - minPrice) / range) * miniInnerHeight;
      return { x, y, val: d.price };
    });
  }, [historyData, minPrice, range, miniInnerHeight, miniPaddingY]);

  const miniPathD = useMemo(() => {
    if (miniPointsSvg.length === 0) return '';
    return miniPointsSvg.reduce((acc, pt, idx) => {
      if (idx === 0) return `M ${pt.x} ${pt.y}`;
      const prev = miniPointsSvg[idx - 1];
      const midX = (prev.x + pt.x) / 2;
      return `${acc} C ${midX} ${prev.y}, ${midX} ${pt.y}, ${pt.x} ${pt.y}`;
    }, '');
  }, [miniPointsSvg]);

  const miniAreaD = useMemo(() => {
    if (!miniPathD || miniPointsSvg.length === 0) return '';
    const lastX = miniPointsSvg[miniPointsSvg.length - 1].x;
    return `${miniPathD} L ${lastX} ${height} L 0 ${height} Z`;
  }, [miniPathD, miniPointsSvg, height]);

  // Expanded chart dimensions
  const expandedWidth = 320;
  const expandedHeight = 90;
  const expPadX = 10;
  const expPadY = 12;
  const expInnerWidth = expandedWidth - expPadX * 2;
  const expInnerHeight = expandedHeight - expPadY * 2;

  const expandedPointsSvg = useMemo(() => {
    const stepX = expInnerWidth / (historyData.length - 1);
    return historyData.map((d, idx) => {
      const x = expPadX + idx * stepX;
      const y = expPadY + expInnerHeight - ((d.price - minPrice) / range) * expInnerHeight;
      return { x, y, price: d.price, dateStr: d.dateStr };
    });
  }, [historyData, minPrice, range, expInnerWidth, expInnerHeight, expPadX, expPadY]);

  const expandedPathD = useMemo(() => {
    if (expandedPointsSvg.length === 0) return '';
    return expandedPointsSvg.reduce((acc, pt, idx) => {
      if (idx === 0) return `M ${pt.x} ${pt.y}`;
      const prev = expandedPointsSvg[idx - 1];
      const midX = (prev.x + pt.x) / 2;
      return `${acc} C ${midX} ${prev.y}, ${midX} ${pt.y}, ${pt.x} ${pt.y}`;
    }, '');
  }, [expandedPointsSvg]);

  const expandedAreaD = useMemo(() => {
    if (!expandedPathD || expandedPointsSvg.length === 0) return '';
    const lastX = expandedPointsSvg[expandedPointsSvg.length - 1].x;
    const firstX = expandedPointsSvg[0].x;
    return `${expandedPathD} L ${lastX} ${expandedHeight - 4} L ${firstX} ${expandedHeight - 4} Z`;
  }, [expandedPathD, expandedPointsSvg, expandedHeight]);

  // Target price Y on expanded chart
  const targetPriceY = useMemo(() => {
    if (resolvedTargetPrice < minPrice) {
      return expPadY + expInnerHeight - 2;
    }
    if (resolvedTargetPrice > maxPrice) {
      return expPadY + 2;
    }
    return expPadY + expInnerHeight - ((resolvedTargetPrice - minPrice) / range) * expInnerHeight;
  }, [resolvedTargetPrice, minPrice, maxPrice, range, expPadY, expInnerHeight]);

  const handleChartMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!chartRef.current) return;
    const rect = chartRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clientX / rect.width));
    const idx = Math.min(historyData.length - 1, Math.round(ratio * (historyData.length - 1)));
    setHoveredIndex(idx);
  };

  const handleChartTouchMove = (e: React.TouchEvent<SVGSVGElement>) => {
    if (!chartRef.current || e.touches.length === 0) return;
    const rect = chartRef.current.getBoundingClientRect();
    const clientX = e.touches[0].clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clientX / rect.width));
    const idx = Math.min(historyData.length - 1, Math.round(ratio * (historyData.length - 1)));
    setHoveredIndex(idx);
  };

  const activeHoverPoint = hoveredIndex !== null ? expandedPointsSvg[hoveredIndex] : null;
  const uniqueId = `sparkline-${product.id}`;

  return (
    <div className={`space-y-1 ${className}`}>
      {/* 30-Day Trend Header & Toggle Button */}
      <div className="flex items-center justify-between text-[10px] font-mono">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded((prev) => !prev);
          }}
          aria-expanded={isExpanded}
          aria-label="Toggle 30-day price trend details"
          className="flex items-center gap-1 cursor-pointer font-semibold group rounded focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 py-0.5"
          style={{ color: 'var(--text-secondary)' }}
        >
          <TrendingDown className="w-3 h-3 text-emerald-500 shrink-0" />
          <span>30-Day Trend</span>
          <span
            className="inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.2 rounded font-sans border ml-1 transition-colors group-hover:border-blue-400"
            style={{
              backgroundColor: 'var(--surface-elevated)',
              borderColor: 'var(--border)',
              color: 'var(--text-muted)',
            }}
          >
            <span>{isExpanded ? 'Collapse' : 'Expand'}</span>
            {isExpanded ? (
              <ChevronUp className="w-2.5 h-2.5" />
            ) : (
              <ChevronDown className="w-2.5 h-2.5" />
            )}
          </span>
        </button>

        {isNearAllTimeLow ? (
          <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-0.5">
            <Sparkles className="w-2.5 h-2.5" />
            30-day low!
          </span>
        ) : savingsFromAvg > 0 ? (
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
            ₹{savingsFromAvg.toLocaleString('en-IN')} below avg
          </span>
        ) : (
          <span style={{ color: 'var(--text-muted)' }}>Avg ₹{avgPrice.toLocaleString('en-IN')}</span>
        )}
      </div>

      {/* Compact Mini Sparkline (Clickable to Expand) */}
      {!isExpanded && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(true);
          }}
          title="Click to view detailed 30-day price trend"
          aria-label="Expand 30-day price trend graph"
          className="w-full text-left cursor-pointer group focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 rounded-md"
        >
          <div className="relative w-full overflow-hidden rounded-md bg-slate-50/70 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/80 px-1 py-0.5 group-hover:border-blue-300 dark:group-hover:border-blue-600 transition-colors">
            <svg
              viewBox={`0 0 ${miniWidth} ${height}`}
              className="w-full overflow-visible"
              style={{ height: `${height}px` }}
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id={`${uniqueId}-grad`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" stopOpacity="0.28" />
                  <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id={`${uniqueId}-stroke`} x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#3B82F6" />
                  <stop offset="100%" stopColor="#10B981" />
                </linearGradient>
              </defs>

              {/* Area fill */}
              <path d={miniAreaD} fill={`url(#${uniqueId}-grad)`} />

              {/* Sparkline curve */}
              <path
                d={miniPathD}
                fill="none"
                stroke={`url(#${uniqueId}-stroke)`}
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Current price marker dot */}
              {miniPointsSvg.length > 0 && (
                <circle
                  cx={miniPointsSvg[miniPointsSvg.length - 1].x}
                  cy={miniPointsSvg[miniPointsSvg.length - 1].y}
                  r="2.5"
                  className="fill-emerald-500 stroke-white dark:stroke-slate-950"
                  strokeWidth="1"
                />
              )}
            </svg>
          </div>

          {showLabels && (
            <div
              className="flex items-center justify-between text-[9px] font-mono px-0.5 mt-0.5"
              style={{ color: 'var(--text-muted)' }}
            >
              <span>Low ₹{minPrice.toLocaleString('en-IN')}</span>
              <span>Peak ₹{maxPrice.toLocaleString('en-IN')}</span>
            </div>
          )}
        </button>
      )}

      {/* Expanded Interactive 30-Day Trend Section (Smoothly within same card) */}
      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          isExpanded ? 'max-h-[520px] opacity-100 mt-2' : 'max-h-0 opacity-0'
        }`}
      >
        <div
          className="p-2.5 rounded-xl border space-y-2.5"
          style={{
            backgroundColor: 'var(--surface-elevated)',
            borderColor: 'var(--border)',
          }}
        >
          {/* Header of Expanded Section with Active Hover Tooltip */}
          <div className="flex items-center justify-between text-[11px] font-mono border-b pb-1.5" style={{ borderColor: 'var(--border)' }}>
            <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>
              30-Day Price Trend
            </span>
            {activeHoverPoint ? (
              <span className="font-bold text-blue-600 dark:text-cyan-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                {activeHoverPoint.dateStr}: ₹{activeHoverPoint.price.toLocaleString('en-IN')}
              </span>
            ) : (
              <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                Hover graph to inspect
              </span>
            )}
          </div>

          {/* Interactive SVG Chart */}
          <div className="relative w-full rounded-lg bg-white dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800 p-1.5 overflow-hidden">
            <svg
              ref={chartRef}
              viewBox={`0 0 ${expandedWidth} ${expandedHeight}`}
              className="w-full overflow-visible cursor-crosshair touch-none"
              style={{ height: '95px' }}
              preserveAspectRatio="none"
              onMouseMove={handleChartMouseMove}
              onMouseLeave={() => setHoveredIndex(null)}
              onTouchMove={handleChartTouchMove}
              onTouchEnd={() => setHoveredIndex(null)}
            >
              <defs>
                <linearGradient id={`${uniqueId}-exp-grad`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" stopOpacity="0.32" />
                  <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id={`${uniqueId}-exp-stroke`} x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#3B82F6" />
                  <stop offset="100%" stopColor="#10B981" />
                </linearGradient>
              </defs>

              {/* AI Target Price Reference Line */}
              <line
                x1={expPadX}
                y1={targetPriceY}
                x2={expandedWidth - expPadX}
                y2={targetPriceY}
                stroke="#8B5CF6"
                strokeWidth="1"
                strokeDasharray="3 3"
                opacity="0.65"
              />
              <text
                x={expPadX + 4}
                y={Math.max(10, targetPriceY - 3)}
                fill="#8B5CF6"
                fontSize="7.5"
                fontFamily="monospace"
                fontWeight="bold"
              >
                AI Target: ₹{resolvedTargetPrice.toLocaleString('en-IN')}
              </text>

              {/* Area fill */}
              <path d={expandedAreaD} fill={`url(#${uniqueId}-exp-grad)`} />

              {/* Smooth trend curve */}
              <path
                d={expandedPathD}
                fill="none"
                stroke={`url(#${uniqueId}-exp-stroke)`}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Active hover indicator cursor and point */}
              {activeHoverPoint && (
                <>
                  <line
                    x1={activeHoverPoint.x}
                    y1={expPadY}
                    x2={activeHoverPoint.x}
                    y2={expandedHeight - 4}
                    stroke="#2563EB"
                    strokeWidth="1.25"
                    strokeDasharray="2 2"
                    opacity="0.8"
                  />
                  <circle
                    cx={activeHoverPoint.x}
                    cy={activeHoverPoint.y}
                    r="4.5"
                    className="fill-blue-600 stroke-white dark:stroke-slate-900"
                    strokeWidth="2"
                  />
                </>
              )}

              {/* Endpoint dot when not hovering */}
              {!activeHoverPoint && expandedPointsSvg.length > 0 && (
                <circle
                  cx={expandedPointsSvg[expandedPointsSvg.length - 1].x}
                  cy={expandedPointsSvg[expandedPointsSvg.length - 1].y}
                  r="3.5"
                  className="fill-emerald-500 stroke-white dark:stroke-slate-900"
                  strokeWidth="1.5"
                />
              )}
            </svg>

            {/* Bottom X-axis Date Markers */}
            <div
              className="flex items-center justify-between text-[9px] font-mono px-1 pt-1 border-t border-slate-100 dark:border-slate-800/80"
              style={{ color: 'var(--text-muted)' }}
            >
              <span>30 Days Ago</span>
              <span>15 Days Ago</span>
              <span className="font-bold" style={{ color: 'var(--text-primary)' }}>Today</span>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-[11px] font-mono">
            <div
              className="p-1.5 rounded-lg border flex flex-col justify-between"
              style={{
                backgroundColor: 'var(--surface)',
                borderColor: 'var(--border)',
              }}
            >
              <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                Current Price
              </span>
              <span className="font-bold text-xs" style={{ color: 'var(--text-primary)' }}>
                ₹{currentPrice.toLocaleString('en-IN')}
              </span>
            </div>

            <div
              className="p-1.5 rounded-lg border flex flex-col justify-between"
              style={{
                backgroundColor: 'var(--surface)',
                borderColor: 'var(--border)',
              }}
            >
              <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                AI Target Price
              </span>
              <span className="font-bold text-xs text-blue-600 dark:text-cyan-400">
                ₹{resolvedTargetPrice.toLocaleString('en-IN')}
              </span>
            </div>

            <div
              className="p-1.5 rounded-lg border flex flex-col justify-between"
              style={{
                backgroundColor: 'var(--surface)',
                borderColor: 'var(--border)',
              }}
            >
              <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                From 30d High
              </span>
              <span className="font-bold text-xs text-emerald-600 dark:text-emerald-400">
                -{pctFromHigh}%
              </span>
            </div>

            <div
              className="p-1.5 rounded-lg border flex flex-col justify-between"
              style={{
                backgroundColor: 'var(--surface)',
                borderColor: 'var(--border)',
              }}
            >
              <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                30-Day High
              </span>
              <span className="font-semibold text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                ₹{maxPrice.toLocaleString('en-IN')}
              </span>
            </div>

            <div
              className="p-1.5 rounded-lg border flex flex-col justify-between"
              style={{
                backgroundColor: 'var(--surface)',
                borderColor: 'var(--border)',
              }}
            >
              <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                30-Day Low
              </span>
              <span className="font-semibold text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                ₹{minPrice.toLocaleString('en-IN')}
              </span>
            </div>

            <div
              className="p-1.5 rounded-lg border flex flex-col justify-between"
              style={{
                backgroundColor: 'var(--surface)',
                borderColor: 'var(--border)',
              }}
            >
              <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                Negotiation Room
              </span>
              <span className="font-bold text-[11px] text-emerald-600 dark:text-emerald-400">
                ₹{negotiationRoom.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* AI Price Insight / Recommendation Box */}
          <div
            className="p-2.5 rounded-lg border text-xs leading-relaxed"
            style={{
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--border)',
            }}
          >
            <div className="flex items-center gap-1.5 font-bold mb-1" style={{ color: 'var(--accent)' }}>
              <Sparkles className="w-3.5 h-3.5" />
              <span className="font-mono text-[10px] uppercase tracking-wider">
                AI Price Recommendation
              </span>
            </div>
            <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {aiInsight}
            </p>
          </div>

          {/* Collapse Button inside expanded section */}
          <div className="pt-1 flex justify-end">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(false);
              }}
              className="text-[10px] font-mono font-semibold flex items-center gap-1 cursor-pointer transition-colors px-2 py-1 rounded border"
              style={{
                backgroundColor: 'var(--surface)',
                borderColor: 'var(--border)',
                color: 'var(--text-secondary)',
              }}
            >
              <span>Collapse Trend</span>
              <ChevronUp className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
