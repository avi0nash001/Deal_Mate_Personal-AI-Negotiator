import React, { useMemo } from 'react';
import { Product } from '../../types';
import { TrendingDown, Sparkles } from 'lucide-react';

interface PriceSparklineProps {
  product: Product;
  className?: string;
  height?: number;
  showLabels?: boolean;
}

export const PriceSparkline: React.FC<PriceSparklineProps> = ({
  product,
  className = '',
  height = 28,
  showLabels = true,
}) => {
  // Generate or use deterministic 30-day price history based on product id, listPrice & marketPrice
  const historyPoints = useMemo(() => {
    if (product.priceHistory && product.priceHistory.length >= 5) {
      return product.priceHistory.map((p) => p.price);
    }

    const current = product.listPrice;
    const peak = Math.max(product.marketPrice, Math.round(current * 1.18));
    const lowest = Math.max(product.minAcceptablePrice || Math.round(current * 0.9), Math.round(current * 0.94));

    // Deterministic pseudo-random fluctuation based on product id hash
    const hash = product.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const steps = 14;
    const points: number[] = [];

    for (let i = 0; i < steps; i++) {
      if (i === 0) {
        points.push(peak);
      } else if (i === steps - 1) {
        points.push(current);
      } else {
        const progress = i / (steps - 1);
        const base = peak - progress * (peak - current);
        const jitter = Math.sin((hash + i) * 1.5) * (peak - lowest) * 0.15;
        const val = Math.round(Math.max(lowest, Math.min(peak * 1.05, base + jitter)));
        points.push(val);
      }
    }
    return points;
  }, [product]);

  const minPrice = Math.min(...historyPoints);
  const maxPrice = Math.max(...historyPoints);
  const avgPrice = Math.round(
    historyPoints.reduce((acc, curr) => acc + curr, 0) / historyPoints.length
  );
  const isNearAllTimeLow = product.listPrice <= minPrice * 1.03;
  const savingsFromAvg = Math.max(0, avgPrice - product.listPrice);

  // SVG dimensions
  const width = 160;
  const paddingY = 4;
  const innerHeight = height - paddingY * 2;
  const range = maxPrice - minPrice || 1;

  const pointsSvg = useMemo(() => {
    const stepX = width / (historyPoints.length - 1);
    return historyPoints.map((val, idx) => {
      const x = idx * stepX;
      // Invert Y so highest price is at top
      const y = paddingY + innerHeight - ((val - minPrice) / range) * innerHeight;
      return { x, y, val };
    });
  }, [historyPoints, minPrice, range, innerHeight, paddingY]);

  const pathD = useMemo(() => {
    if (pointsSvg.length === 0) return '';
    return pointsSvg.reduce((acc, pt, idx) => {
      if (idx === 0) return `M ${pt.x} ${pt.y}`;
      // Smooth cubic curve approximation
      const prev = pointsSvg[idx - 1];
      const midX = (prev.x + pt.x) / 2;
      return `${acc} C ${midX} ${prev.y}, ${midX} ${pt.y}, ${pt.x} ${pt.y}`;
    }, '');
  }, [pointsSvg]);

  const areaD = useMemo(() => {
    if (!pathD || pointsSvg.length === 0) return '';
    const lastX = pointsSvg[pointsSvg.length - 1].x;
    return `${pathD} L ${lastX} ${height} L 0 ${height} Z`;
  }, [pathD, pointsSvg, height]);

  const uniqueId = `sparkline-${product.id}`;

  return (
    <div className={`space-y-1 ${className}`}>
      <div className="flex items-center justify-between text-[10px] font-mono">
        <span className="text-slate-500 flex items-center gap-1">
          <TrendingDown className="w-3 h-3 text-emerald-500" />
          <span>30-Day Trend</span>
        </span>
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
          <span className="text-slate-400">Avg ₹{avgPrice.toLocaleString('en-IN')}</span>
        )}
      </div>

      <div className="relative w-full overflow-hidden rounded-md bg-slate-50/70 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/80 px-1 py-0.5">
        <svg
          viewBox={`0 0 ${width} ${height}`}
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
          <path d={areaD} fill={`url(#${uniqueId}-grad)`} />

          {/* Sparkline curve */}
          <path
            d={pathD}
            fill="none"
            stroke={`url(#${uniqueId}-stroke)`}
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Current price marker dot */}
          {pointsSvg.length > 0 && (
            <circle
              cx={pointsSvg[pointsSvg.length - 1].x}
              cy={pointsSvg[pointsSvg.length - 1].y}
              r="2.5"
              className="fill-emerald-500 stroke-white dark:stroke-slate-950"
              strokeWidth="1"
            />
          )}
        </svg>
      </div>

      {showLabels && (
        <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 dark:text-slate-500 px-0.5">
          <span>Low ₹{minPrice.toLocaleString('en-IN')}</span>
          <span>Peak ₹{maxPrice.toLocaleString('en-IN')}</span>
        </div>
      )}
    </div>
  );
};
