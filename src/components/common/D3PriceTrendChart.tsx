import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { Product } from '../../types';
import { TrendingDown, TrendingUp, Calendar, Zap, Info } from 'lucide-react';

export interface D3PricePoint {
  date: Date;
  dateStr: string;
  price: number;
}

export interface ProductPriceSeries {
  product: Product;
  color: string;
  data: D3PricePoint[];
  minPrice: number;
  maxPrice: number;
  avgPrice: number;
  currentPrice: number;
  dropFromPeakPct: number;
}

interface D3PriceTrendChartProps {
  products: Product[];
  activeProductId?: string;
  targetPrice?: number;
  userBudget?: number;
  height?: number;
  showTimeRangeSelector?: boolean;
  initialDays?: number;
  className?: string;
  onProductClick?: (product: Product) => void;
}

const PALETTE = [
  '#06b6d4', // Cyan
  '#818cf8', // Indigo
  '#34d399', // Emerald
  '#fbbf24', // Amber
  '#f43f5e', // Rose
  '#a855f7', // Purple
];

/**
 * Generate deterministic daily price history for a product matching catalog trends
 */
export function generateProductPriceHistory(product: Product, totalDays: number = 60): D3PricePoint[] {
  if (product.priceHistory && product.priceHistory.length >= totalDays) {
    return product.priceHistory.slice(-totalDays).map((pt, idx) => {
      const d = pt.date ? new Date(pt.date) : new Date(Date.now() - (totalDays - 1 - idx) * 86400000);
      return {
        date: d,
        dateStr: d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
        price: pt.price,
      };
    });
  }

  const current = product.listPrice;
  const peak = Math.max(product.marketPrice, Math.round(current * 1.18));
  const floor = Math.max(
    product.minAcceptablePrice || Math.round(current * 0.88),
    Math.round(current * 0.92)
  );

  const hash = product.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const points: D3PricePoint[] = [];
  const now = new Date();

  for (let i = 0; i < totalDays; i++) {
    const daysAgo = totalDays - 1 - i;
    const d = new Date(now.getTime() - daysAgo * 86400000);
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
      // Downward trend with deterministic undulating waves
      const baseTrend = peak - (peak - current) * Math.pow(progress, 0.75);
      const wave1 = Math.sin(progress * Math.PI * 3.5 + (hash % 7)) * (current * 0.035);
      const wave2 = Math.cos(progress * Math.PI * 5 + (hash % 11)) * (current * 0.02);
      const rawPrice = Math.round(baseTrend + wave1 + wave2);
      price = Math.max(floor, Math.min(peak, rawPrice));
    }

    points.push({
      date: d,
      dateStr,
      price,
    });
  }

  return points;
}

export const D3PriceTrendChart: React.FC<D3PriceTrendChartProps> = ({
  products,
  activeProductId,
  targetPrice,
  userBudget,
  height = 280,
  showTimeRangeSelector = true,
  initialDays = 30,
  className = '',
  onProductClick,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);

  const [daysRange, setDaysRange] = useState<number>(initialDays);
  const [hoveredData, setHoveredData] = useState<{
    dateStr: string;
    items: Array<{ name: string; price: number; color: string; id: string }>;
  } | null>(null);
  const [visibleProductIds, setVisibleProductIds] = useState<Set<string>>(
    () => new Set(products.map((p) => p.id))
  );

  // Sync visible product IDs if products list changes
  useEffect(() => {
    setVisibleProductIds(new Set(products.map((p) => p.id)));
  }, [products]);

  const toggleProductVisibility = (id: string) => {
    setVisibleProductIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        if (next.size > 1) next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Prepare series data for visible products
  const seriesList = useMemo<ProductPriceSeries[]>(() => {
    return products.map((prod, idx) => {
      const allHistory = generateProductPriceHistory(prod, 60);
      const sliced = allHistory.slice(-daysRange);
      const prices = sliced.map((p) => p.price);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      const avgPrice = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
      const currentPrice = prices[prices.length - 1];
      const dropFromPeakPct = maxPrice > 0 ? Math.round(((maxPrice - currentPrice) / maxPrice) * 100) : 0;

      return {
        product: prod,
        color: PALETTE[idx % PALETTE.length],
        data: sliced,
        minPrice,
        maxPrice,
        avgPrice,
        currentPrice,
        dropFromPeakPct,
      };
    });
  }, [products, daysRange]);

  const activeSeries = useMemo(() => {
    return seriesList.filter((s) => visibleProductIds.has(s.product.id));
  }, [seriesList, visibleProductIds]);

  // Render D3 chart inside SVG
  useEffect(() => {
    if (!svgRef.current || !containerRef.current || activeSeries.length === 0) return;

    const svgElement = d3.select(svgRef.current);
    svgElement.selectAll('*').remove();

    const containerWidth = containerRef.current.clientWidth || 600;
    const margin = { top: 25, right: 30, bottom: 35, left: 60 };
    const width = Math.max(300, containerWidth - margin.left - margin.right);
    const innerHeight = Math.max(160, height - margin.top - margin.bottom);

    svgElement
      .attr('width', containerWidth)
      .attr('height', height)
      .attr('viewBox', `0 0 ${containerWidth} ${height}`);

    const g = svgElement
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Global X Extent across all series
    const allDates = activeSeries.flatMap((s) => s.data.map((d) => d.date));
    const xExtent = d3.extent(allDates) as [Date, Date];

    // Global Y Extent (with padding for visual clarity and target lines)
    const allPrices = activeSeries.flatMap((s) => s.data.map((d) => d.price));
    if (targetPrice) allPrices.push(targetPrice);
    if (userBudget) allPrices.push(userBudget);

    const minPrice = Math.min(...allPrices);
    const maxPrice = Math.max(...allPrices);
    const yPadding = (maxPrice - minPrice) * 0.1 || 50;

    const xScale = d3
      .scaleTime()
      .domain(xExtent)
      .range([0, width]);

    const yScale = d3
      .scaleLinear()
      .domain([Math.max(0, minPrice - yPadding), maxPrice + yPadding])
      .nice()
      .range([innerHeight, 0]);

    // Defs for gradients
    const defs = svgElement.append('defs');

    // Horizontal Grid Lines
    const yTicks = yScale.ticks(5);
    g.append('g')
      .attr('class', 'grid')
      .selectAll('line')
      .data(yTicks)
      .enter()
      .append('line')
      .attr('x1', 0)
      .attr('x2', width)
      .attr('y1', (d) => yScale(d))
      .attr('y2', (d) => yScale(d))
      .attr('stroke', '#334155')
      .attr('stroke-opacity', 0.25)
      .attr('stroke-dasharray', '3,3');

    // Y Axis
    const yAxis = d3
      .axisLeft(yScale)
      .ticks(5)
      .tickFormat((d) => `₹${Number(d).toLocaleString('en-IN')}`);

    g.append('g')
      .attr('class', 'y-axis text-[10px] font-mono')
      .call(yAxis)
      .call((gAxis) => gAxis.select('.domain').remove())
      .call((gAxis) =>
        gAxis
          .selectAll('.tick text')
          .attr('fill', '#94A3B8')
          .attr('dx', '-4')
      )
      .call((gAxis) => gAxis.selectAll('.tick line').attr('stroke', '#334155'));

    // X Axis
    const xAxis = d3
      .axisBottom(xScale)
      .ticks(Math.min(daysRange <= 14 ? daysRange : 6, 7))
      .tickFormat((d) => {
        const dateObj = d as Date;
        return d3.timeFormat('%b %d')(dateObj);
      });

    g.append('g')
      .attr('class', 'x-axis text-[10px] font-mono')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis)
      .call((gAxis) => gAxis.select('.domain').attr('stroke', '#334155'))
      .call((gAxis) =>
        gAxis
          .selectAll('.tick text')
          .attr('fill', '#94A3B8')
          .attr('dy', '10')
      )
      .call((gAxis) => gAxis.selectAll('.tick line').attr('stroke', '#334155'));

    // Reference Target Price Line (if applicable)
    if (targetPrice && targetPrice >= yScale.domain()[0] && targetPrice <= yScale.domain()[1]) {
      const targetY = yScale(targetPrice);
      g.append('line')
        .attr('x1', 0)
        .attr('x2', width)
        .attr('y1', targetY)
        .attr('y2', targetY)
        .attr('stroke', '#38bdf8')
        .attr('stroke-width', 1.5)
        .attr('stroke-dasharray', '4,4')
        .attr('opacity', 0.85);

      g.append('text')
        .attr('x', width - 6)
        .attr('y', targetY - 6)
        .attr('text-anchor', 'end')
        .attr('fill', '#38bdf8')
        .attr('font-size', '10px')
        .attr('font-family', 'monospace')
        .attr('font-weight', '600')
        .text(`Target: ₹${targetPrice.toLocaleString('en-IN')}`);
    }

    // Reference Budget Line (if provided and different)
    if (userBudget && userBudget !== targetPrice && userBudget >= yScale.domain()[0] && userBudget <= yScale.domain()[1]) {
      const budgetY = yScale(userBudget);
      g.append('line')
        .attr('x1', 0)
        .attr('x2', width)
        .attr('y1', budgetY)
        .attr('y2', budgetY)
        .attr('stroke', '#f59e0b')
        .attr('stroke-width', 1.5)
        .attr('stroke-dasharray', '3,3')
        .attr('opacity', 0.7);

      g.append('text')
        .attr('x', 6)
        .attr('y', budgetY - 6)
        .attr('fill', '#f59e0b')
        .attr('font-size', '10px')
        .attr('font-family', 'monospace')
        .attr('font-weight', '600')
        .text(`Budget: ₹${userBudget.toLocaleString('en-IN')}`);
    }

    // Line Generator
    const lineGenerator = d3
      .line<D3PricePoint>()
      .x((d) => xScale(d.date))
      .y((d) => yScale(d.price))
      .curve(d3.curveMonotoneX);

    // Area Generator (for single product glow)
    if (activeSeries.length === 1) {
      const single = activeSeries[0];
      const gradientId = `area-gradient-${single.product.id}`;
      const grad = defs
        .append('linearGradient')
        .attr('id', gradientId)
        .attr('x1', '0%')
        .attr('y1', '0%')
        .attr('x2', '0%')
        .attr('y2', '100%');

      grad.append('stop').attr('offset', '0%').attr('stop-color', single.color).attr('stop-opacity', 0.28);
      grad.append('stop').attr('offset', '100%').attr('stop-color', single.color).attr('stop-opacity', 0.0);

      const areaGenerator = d3
        .area<D3PricePoint>()
        .x((d) => xScale(d.date))
        .y0(innerHeight)
        .y1((d) => yScale(d.price))
        .curve(d3.curveMonotoneX);

      g.append('path')
        .datum(single.data)
        .attr('fill', `url(#${gradientId})`)
        .attr('d', areaGenerator);
    }

    // Render Product Lines
    activeSeries.forEach((series) => {
      const isHighlighted = !activeProductId || activeProductId === series.product.id;
      const strokeWidth = activeSeries.length === 1 || isHighlighted ? 2.5 : 1.75;
      const strokeOpacity = isHighlighted ? 1 : 0.6;

      // Glow shadow filter for highlighted line
      g.append('path')
        .datum(series.data)
        .attr('fill', 'none')
        .attr('stroke', series.color)
        .attr('stroke-width', strokeWidth + 3)
        .attr('stroke-opacity', 0.15)
        .attr('d', lineGenerator);

      // Main line
      g.append('path')
        .datum(series.data)
        .attr('fill', 'none')
        .attr('stroke', series.color)
        .attr('stroke-width', strokeWidth)
        .attr('stroke-opacity', strokeOpacity)
        .attr('stroke-linecap', 'round')
        .attr('stroke-linejoin', 'round')
        .attr('d', lineGenerator);

      // Latest Point Dot
      const lastPoint = series.data[series.data.length - 1];
      if (lastPoint) {
        g.append('circle')
          .attr('cx', xScale(lastPoint.date))
          .attr('cy', yScale(lastPoint.price))
          .attr('r', 4.5)
          .attr('fill', series.color)
          .attr('stroke', '#0B0F19')
          .attr('stroke-width', 2);
      }
    });

    // Crosshair and Interactive Hover Overlay
    const crosshair = g
      .append('line')
      .attr('class', 'crosshair')
      .attr('y1', 0)
      .attr('y2', innerHeight)
      .attr('stroke', '#64748B')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '3,3')
      .style('opacity', 0)
      .style('pointer-events', 'none');

    const hoverDotsGroup = g.append('g').attr('class', 'hover-dots').style('pointer-events', 'none');

    const overlay = g
      .append('rect')
      .attr('width', width)
      .attr('height', innerHeight)
      .attr('fill', 'transparent')
      .attr('cursor', 'crosshair');

    // Bisector for finding closest data point
    const bisectDate = d3.bisector<D3PricePoint, Date>((d) => d.date).left;

    overlay
      .on('mousemove', function (event) {
        const [mouseX] = d3.pointer(event, this);
        const hoveredDate = xScale.invert(mouseX);

        const hoverItems: Array<{ name: string; price: number; color: string; id: string }> = [];
        hoverDotsGroup.selectAll('*').remove();

        let refDateStr = '';

        activeSeries.forEach((series) => {
          const idx = bisectDate(series.data, hoveredDate, 1);
          const d0 = series.data[idx - 1];
          const d1 = series.data[idx];
          let chosen = d0;
          if (d0 && d1) {
            chosen =
              hoveredDate.getTime() - d0.date.getTime() > d1.date.getTime() - hoveredDate.getTime()
                ? d1
                : d0;
          } else if (d1) {
            chosen = d1;
          }

          if (chosen) {
            refDateStr = chosen.dateStr;
            hoverItems.push({
              name: series.product.name,
              price: chosen.price,
              color: series.color,
              id: series.product.id,
            });

            // Dot on line
            hoverDotsGroup
              .append('circle')
              .attr('cx', xScale(chosen.date))
              .attr('cy', yScale(chosen.price))
              .attr('r', 5)
              .attr('fill', series.color)
              .attr('stroke', '#FFFFFF')
              .attr('stroke-width', 2);
          }
        });

        crosshair
          .attr('x1', mouseX)
          .attr('x2', mouseX)
          .style('opacity', 1);

        setHoveredData({
          dateStr: refDateStr,
          items: hoverItems,
        });
      })
      .on('mouseleave', function () {
        crosshair.style('opacity', 0);
        hoverDotsGroup.selectAll('*').remove();
        setHoveredData(null);
      });
  }, [activeSeries, activeProductId, targetPrice, userBudget, height, daysRange]);

  return (
    <div
      ref={containerRef}
      className={`rounded-2xl bg-[#090D16] border border-slate-800 p-4 shadow-xl space-y-4 text-slate-100 ${className}`}
    >
      {/* Header Bar with Time Range & Live Hover readout */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-cyan-950/80 border border-cyan-700/60 flex items-center justify-center text-cyan-400">
            <TrendingDown className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-xs uppercase tracking-wider text-slate-200">
                D3.js Price Trajectory & Volatility
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                {daysRange}D Trend
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Interactive historical pricing analysis for negotiation intelligence
            </p>
          </div>
        </div>

        {/* Timeframe Selector */}
        {showTimeRangeSelector && (
          <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-800 rounded-xl p-1 text-xs font-mono">
            {[7, 14, 30, 60].map((days) => (
              <button
                key={days}
                type="button"
                onClick={() => setDaysRange(days)}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer text-[11px] ${
                  daysRange === days
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {days}D
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Product Legend Pills (for comparing multiple products) */}
      {seriesList.length > 1 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-mono text-slate-400 mr-1">Products:</span>
          {seriesList.map((series) => {
            const isVisible = visibleProductIds.has(series.product.id);
            return (
              <button
                key={series.product.id}
                type="button"
                onClick={() => toggleProductVisibility(series.product.id)}
                className={`px-2.5 py-1 rounded-xl text-xs font-medium flex items-center gap-2 border transition-all cursor-pointer ${
                  isVisible
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-950/40 text-slate-500 border-dashed border-slate-800 opacity-60'
                }`}
                style={{
                  borderColor: isVisible ? series.color : 'rgb(51 65 85 / 0.4)',
                }}
                title={isVisible ? 'Click to hide from chart' : 'Click to show in chart'}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: series.color }}
                />
                <span className="truncate max-w-[140px] text-left">{series.product.name}</span>
                <span className="font-mono font-bold text-[11px]">
                  ₹{series.currentPrice.toLocaleString('en-IN')}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* SVG Canvas Container with D3 rendering */}
      <div className="relative w-full overflow-hidden select-none">
        <svg ref={svgRef} className="w-full overflow-visible" />

        {/* Floating Tooltip readout on Hover */}
        {hoveredData && (
          <div
            ref={tooltipRef}
            className="absolute top-2 right-4 pointer-events-none z-10 bg-slate-950/95 border border-slate-700/80 rounded-xl p-2.5 shadow-2xl backdrop-blur-md max-w-xs space-y-1.5 animate-in fade-in duration-150"
          >
            <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1.5 border-b border-slate-800 pb-1">
              <Calendar className="w-3 h-3 text-cyan-400" />
              <span>{hoveredData.dateStr}</span>
            </div>
            {hoveredData.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-1.5 truncate">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="truncate text-slate-200 text-[11px]">{item.name}</span>
                </div>
                <span className="font-mono font-bold text-white shrink-0">
                  ₹{item.price.toLocaleString('en-IN')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Key Metric Insights Summary Footer */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-slate-800/80 text-xs font-mono">
        {activeSeries.map((s) => (
          <div
            key={s.product.id}
            className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 truncate max-w-[100px]">{s.product.name}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-400 font-bold">
                -{s.dropFromPeakPct}% Peak
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-white font-bold text-sm">
                ₹{s.currentPrice.toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] text-slate-500">
                Low: ₹{s.minPrice.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
