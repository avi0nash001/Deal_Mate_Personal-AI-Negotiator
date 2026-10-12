import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { Product } from '../../types';
import { generateProductPriceHistory } from '../common/D3PriceTrendChart';
import { TrendingDown, TrendingUp, Calendar, Activity } from 'lucide-react';

interface RechartsPriceSparklineProps {
  product: Product;
  isLight?: boolean;
  className?: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    payload: {
      dateStr: string;
      price: number;
    };
  }>;
  isLight?: boolean;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, isLight }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div
        className="px-3 py-1.5 rounded-lg text-xs font-mono shadow-lg border"
        style={{
          backgroundColor: isLight ? '#FFFFFF' : '#0B0F19',
          borderColor: isLight ? '#D1D5DB' : '#334155',
          color: isLight ? '#111827' : '#F8FAFC',
        }}
      >
        <div style={{ color: isLight ? '#4B5563' : '#94A3B8' }} className="text-[10px]">
          {data.dateStr}
        </div>
        <div className="font-bold text-sm" style={{ color: isLight ? '#1F2937' : '#38BDF8' }}>
          ₹{data.price.toLocaleString('en-IN')}
        </div>
      </div>
    );
  }
  return null;
};

export const RechartsPriceSparkline: React.FC<RechartsPriceSparklineProps> = ({
  product,
  isLight = false,
  className = '',
}) => {
  const chartData = useMemo(() => {
    const raw = generateProductPriceHistory(product, 30);
    return raw.map((pt, idx) => ({
      index: idx,
      dateStr: pt.dateStr,
      price: pt.price,
    }));
  }, [product]);

  const { minPrice, maxPrice, startPrice, endPrice, changePct } = useMemo(() => {
    if (!chartData.length) {
      return { minPrice: 0, maxPrice: 0, startPrice: 0, endPrice: 0, changePct: 0 };
    }
    const prices = chartData.map((d) => d.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const start = chartData[0].price;
    const end = chartData[chartData.length - 1].price;
    const pct = Math.round(((end - start) / start) * 100);
    return {
      minPrice: min,
      maxPrice: max,
      startPrice: start,
      endPrice: end,
      changePct: pct,
    };
  }, [chartData]);

  const strokeColor = changePct <= 0 ? '#10B981' : '#F59E0B';
  const fillColor = changePct <= 0 ? '#10B981' : '#F59E0B';

  return (
    <div
      className={`rounded-2xl border p-4 transition-all shadow-sm ${className}`}
      style={{
        backgroundColor: isLight ? '#FFFFFF' : 'rgba(15, 22, 38, 0.75)',
        borderColor: isLight ? '#D1D5DB' : '#1E293B',
      }}
    >
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-500" />
          <h4
            className="text-xs font-mono font-bold uppercase tracking-wider"
            style={{ color: isLight ? '#111827' : '#F8FAFC' }}
          >
            30-Day Price Trend (Recharts)
          </h4>
        </div>

        <div className="flex items-center gap-2">
          <span
            className="inline-flex items-center gap-1 text-[11px] font-mono font-bold px-2 py-0.5 rounded-md"
            style={{
              backgroundColor:
                changePct <= 0
                  ? isLight
                    ? '#DCFCE7'
                    : 'rgba(16, 185, 129, 0.15)'
                  : isLight
                  ? '#FEF3C7'
                  : 'rgba(245, 158, 11, 0.15)',
              color:
                changePct <= 0
                  ? isLight
                    ? '#166534'
                    : '#34D399'
                  : isLight
                  ? '#92400E'
                  : '#FBBF24',
            }}
          >
            {changePct <= 0 ? (
              <TrendingDown className="w-3 h-3" />
            ) : (
              <TrendingUp className="w-3 h-3" />
            )}
            <span>
              {changePct <= 0 ? `${changePct}% Drop` : `+${changePct}% Increase`}
            </span>
          </span>

          <span
            className="text-[10px] font-mono flex items-center gap-1"
            style={{ color: isLight ? '#4B5563' : '#94A3B8' }}
          >
            <Calendar className="w-3 h-3" />
            <span>30d Range</span>
          </span>
        </div>
      </div>

      {/* Sparkline Canvas using Recharts */}
      <div className="w-full h-28 -mx-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 8, right: 10, left: 10, bottom: 0 }}
          >
            <defs>
              <linearGradient id="rechartsSparklineGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={fillColor} stopOpacity={0.35} />
                <stop offset="100%" stopColor={fillColor} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <XAxis dataKey="dateStr" hide />
            <YAxis domain={['dataMin - 50', 'dataMax + 50']} hide />
            <Tooltip
              content={<CustomTooltip isLight={isLight} />}
              cursor={{ stroke: isLight ? '#9CA3AF' : '#475569', strokeWidth: 1, strokeDasharray: '3 3' }}
            />
            <Area
              type="monotone"
              dataKey="price"
              stroke={strokeColor}
              strokeWidth={2.2}
              fill="url(#rechartsSparklineGrad)"
              isAnimationActive={true}
              animationDuration={800}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* 30-Day Statistics Bar */}
      <div
        className="grid grid-cols-3 gap-2 pt-3 border-t text-center text-xs font-mono"
        style={{ borderColor: isLight ? '#E5E7EB' : '#1E293B' }}
      >
        <div>
          <span
            className="text-[10px] block uppercase"
            style={{ color: isLight ? '#6B7280' : '#94A3B8' }}
          >
            30d Low
          </span>
          <strong
            className="font-bold"
            style={{ color: isLight ? '#15803D' : '#34D399' }}
          >
            ₹{minPrice.toLocaleString('en-IN')}
          </strong>
        </div>

        <div>
          <span
            className="text-[10px] block uppercase"
            style={{ color: isLight ? '#6B7280' : '#94A3B8' }}
          >
            30d Peak
          </span>
          <strong
            className="font-bold"
            style={{ color: isLight ? '#B45309' : '#FBBF24' }}
          >
            ₹{maxPrice.toLocaleString('en-IN')}
          </strong>
        </div>

        <div>
          <span
            className="text-[10px] block uppercase"
            style={{ color: isLight ? '#6B7280' : '#94A3B8' }}
          >
            Current Price
          </span>
          <strong
            className="font-bold"
            style={{ color: isLight ? '#1F2937' : '#F8FAFC' }}
          >
            ₹{endPrice.toLocaleString('en-IN')}
          </strong>
        </div>
      </div>
    </div>
  );
};
