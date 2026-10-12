import React from 'react';
import { Product } from '../../types';
import { D3PriceTrendChart } from '../common/D3PriceTrendChart';
import { RechartsPriceSparkline } from './RechartsPriceSparkline';
import { ThemeId, THEMES } from '../../types/theme';
import {
  X,
  Sparkles,
  Star,
  Zap,
  ShieldCheck,
  Truck,
  Store,
  Layers,
  CheckCircle2,
  Tag,
  ArrowRight,
  TrendingDown,
} from 'lucide-react';

interface ProductDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onSelectToNegotiate: (product: Product) => void;
  onAddToCompare?: (product: Product) => void;
  isInCompare?: boolean;
  userBudget?: number;
  currentThemeId?: ThemeId;
}

export const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({
  isOpen,
  onClose,
  product,
  onSelectToNegotiate,
  onAddToCompare,
  isInCompare = false,
  userBudget,
  currentThemeId = 'pure-white',
}) => {
  if (!isOpen || !product) return null;

  const currentTheme = THEMES[currentThemeId] || THEMES['pure-white'];
  const isLight = currentTheme.isLight;

  const targetPriceAsk = Math.round(product.listPrice * 0.85);
  const discountPct = Math.round(
    ((product.marketPrice - product.listPrice) / product.marketPrice) * 100
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-4xl rounded-3xl border p-6 shadow-2xl max-h-[92vh] overflow-y-auto space-y-6"
        style={{
          backgroundColor: isLight ? '#FFFFFF' : '#090D16',
          borderColor: isLight ? '#D1D5DB' : 'rgba(6, 182, 212, 0.4)',
          color: isLight ? '#1F2937' : '#F1F5F9',
        }}
      >
        {/* Top Header */}
        <div
          className="flex items-center justify-between border-b pb-4"
          style={{ borderColor: isLight ? '#E5E7EB' : '#1E293B' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{
                backgroundColor: isLight ? '#EFF6FF' : '#082F49',
                border: isLight ? '1px solid #BFDBFE' : '1px solid rgba(14, 165, 233, 0.6)',
                color: isLight ? '#1D4ED8' : '#38BDF8',
              }}
            >
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span
                  className="text-xs font-mono font-bold uppercase tracking-wider"
                  style={{ color: isLight ? '#2563EB' : '#38BDF8' }}
                >
                  {product.brand}
                </span>
                <span style={{ color: isLight ? '#9CA3AF' : '#475569' }}>·</span>
                <span
                  className="text-xs font-mono font-medium"
                  style={{ color: isLight ? '#4B5563' : '#94A3B8' }}
                >
                  {product.category}
                </span>
              </div>
              <h2
                className="font-display font-extrabold text-lg sm:text-xl"
                style={{ color: isLight ? '#111827' : '#FFFFFF' }}
              >
                {product.name}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl transition-colors cursor-pointer"
            style={{
              color: isLight ? '#4B5563' : '#94A3B8',
              backgroundColor: isLight ? '#F3F4F6' : '#1E293B',
            }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Product Visual & Key Overview Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* Left Column: Image & Stock */}
          <div className="md:col-span-5 space-y-3">
            <div
              className="relative aspect-square w-full rounded-2xl overflow-hidden border group shadow-lg"
              style={{
                backgroundColor: isLight ? '#F9FAFB' : '#0F172A',
                borderColor: isLight ? '#E5E7EB' : '#1E293B',
              }}
            >
              <img
                src={product.image}
                alt={product.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-cyan-950/90 border border-cyan-800/70 text-xs font-mono text-cyan-300 flex items-center gap-1.5 shadow-md">
                <Zap className="w-3 h-3 text-cyan-400" />
                <span>AI Negotiable</span>
              </div>

              {discountPct > 0 && (
                <div className="absolute top-3 right-3 px-2 py-0.5 rounded-md bg-emerald-600 text-white font-mono text-xs font-bold shadow-md">
                  {discountPct}% OFF
                </div>
              )}

              <div
                className="absolute bottom-3 left-3 px-2.5 py-1 rounded-lg border text-xs font-mono font-bold"
                style={{
                  backgroundColor: isLight ? 'rgba(255, 255, 255, 0.95)' : 'rgba(2, 6, 23, 0.9)',
                  borderColor: isLight ? '#D1D5DB' : '#334155',
                  color: isLight ? '#15803D' : '#34D399',
                }}
              >
                {product.stock} units available
              </div>
            </div>

            {/* Quick Trust Badges */}
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div
                className="p-2.5 rounded-xl border flex items-center gap-2"
                style={{
                  backgroundColor: isLight ? '#F9FAFB' : 'rgba(15, 23, 42, 0.6)',
                  borderColor: isLight ? '#E5E7EB' : '#1E293B',
                  color: isLight ? '#374151' : '#CBD5E1',
                }}
              >
                <Truck className="w-4 h-4 text-cyan-500 shrink-0" />
                <span>{product.deliveryDays ? `${product.deliveryDays}d Delivery` : 'Fast Dispatch'}</span>
              </div>
              <div
                className="p-2.5 rounded-xl border flex items-center gap-2"
                style={{
                  backgroundColor: isLight ? '#F9FAFB' : 'rgba(15, 23, 42, 0.6)',
                  borderColor: isLight ? '#E5E7EB' : '#1E293B',
                  color: isLight ? '#374151' : '#CBD5E1',
                }}
              >
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Verified Seller</span>
              </div>
            </div>
          </div>

          {/* Right Column: Pricing, Specs & Actions */}
          <div className="md:col-span-7 space-y-4">
            {/* Price Box */}
            <div
              className="p-4 rounded-2xl border flex items-center justify-between flex-wrap gap-3"
              style={{
                backgroundColor: isLight ? '#F9FAFB' : 'rgba(15, 23, 42, 0.8)',
                borderColor: isLight ? '#E5E7EB' : '#1E293B',
              }}
            >
              <div>
                <div
                  className="text-[11px] font-mono font-bold uppercase"
                  style={{ color: isLight ? '#4B5563' : '#94A3B8' }}
                >
                  Current List Price
                </div>
                <div className="flex items-baseline gap-2.5 mt-0.5">
                  <span
                    className="text-2xl font-black font-mono"
                    style={{ color: isLight ? '#111827' : '#FFFFFF' }}
                  >
                    ₹{product.listPrice.toLocaleString('en-IN')}
                  </span>
                  <span
                    className="text-sm font-mono line-through"
                    style={{ color: isLight ? '#6B7280' : '#64748B' }}
                  >
                    ₹{product.marketPrice.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <div
                  className="text-[11px] font-mono font-bold uppercase"
                  style={{ color: isLight ? '#2563EB' : '#38BDF8' }}
                >
                  AI Target Room
                </div>
                <div
                  className="text-sm font-mono font-extrabold mt-0.5"
                  style={{ color: isLight ? '#1D4ED8' : '#67E8F9' }}
                >
                  Up to ₹{targetPriceAsk.toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            {/* Historical Price Trend Sparkline using Recharts */}
            <RechartsPriceSparkline
              product={product}
              isLight={isLight}
            />

            {/* Seller & Rating Bar */}
            <div
              className="flex items-center justify-between text-xs py-2 border-y"
              style={{ borderColor: isLight ? '#E5E7EB' : 'rgba(30, 41, 59, 0.8)' }}
            >
              <div
                className="flex items-center gap-2"
                style={{ color: isLight ? '#374151' : '#CBD5E1' }}
              >
                <Store className="w-4 h-4 text-indigo-500" />
                <span>
                  Sold by:{' '}
                  <strong style={{ color: isLight ? '#111827' : '#FFFFFF' }}>
                    {product.sellerName}
                  </strong>
                </span>
              </div>
              <div className="flex items-center gap-1 text-amber-500 font-bold">
                <Star className="w-4 h-4 fill-current" />
                <span>{product.rating}</span>
                <span
                  className="font-normal"
                  style={{ color: isLight ? '#6B7280' : '#64748B' }}
                >
                  ({product.reviewsCount} reviews)
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <h4
                className="text-xs font-mono font-bold uppercase"
                style={{ color: isLight ? '#4B5563' : '#94A3B8' }}
              >
                Description
              </h4>
              <p
                className="text-xs leading-relaxed font-sans"
                style={{ color: isLight ? '#374151' : '#CBD5E1' }}
              >
                {product.description}
              </p>
            </div>

            {/* Technical Specs Tags */}
            <div className="space-y-2">
              <h4
                className="text-xs font-mono font-bold uppercase"
                style={{ color: isLight ? '#4B5563' : '#94A3B8' }}
              >
                Specifications
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                {Object.entries(product.specs).map(([key, val]) => (
                  <div
                    key={key}
                    className="p-2 rounded-xl border flex items-center justify-between"
                    style={{
                      backgroundColor: isLight ? '#F9FAFB' : 'rgba(15, 23, 42, 0.6)',
                      borderColor: isLight ? '#E5E7EB' : 'rgba(30, 41, 59, 0.8)',
                    }}
                  >
                    <span style={{ color: isLight ? '#4B5563' : '#94A3B8' }}>{key}</span>
                    <span
                      className="font-medium truncate ml-2"
                      style={{ color: isLight ? '#111827' : '#FFFFFF' }}
                    >
                      {val}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Call to Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => {
                  onClose();
                  onSelectToNegotiate(product);
                }}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 cursor-pointer transition-all transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <Zap className="w-4 h-4 text-cyan-200" />
                <span>Negotiate Deal with AI</span>
                <ArrowRight className="w-4 h-4 text-cyan-200" />
              </button>

              {onAddToCompare && (
                <button
                  onClick={() => onAddToCompare(product)}
                  className="py-3 px-4 rounded-xl border text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors"
                  style={{
                    backgroundColor: isInCompare
                      ? isLight
                        ? '#DCFCE7'
                        : 'rgba(6, 78, 59, 0.4)'
                      : isLight
                      ? '#F3F4F6'
                      : '#0F172A',
                    borderColor: isInCompare
                      ? isLight
                        ? '#86EFAC'
                        : 'rgba(4, 120, 87, 0.6)'
                      : isLight
                      ? '#D1D5DB'
                      : '#334155',
                    color: isInCompare
                      ? isLight
                        ? '#15803D'
                        : '#34D399'
                      : isLight
                      ? '#1F2937'
                      : '#E2E8F0',
                  }}
                >
                  <Layers className="w-4 h-4" />
                  <span>{isInCompare ? 'In Compare' : 'Add to Compare'}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* D3-based Detailed Interactive Timeline Chart */}
        <div
          className="pt-4 border-t space-y-3"
          style={{ borderColor: isLight ? '#E5E7EB' : '#1E293B' }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-cyan-500" />
              <h3
                className="font-display font-bold text-sm"
                style={{ color: isLight ? '#111827' : '#FFFFFF' }}
              >
                Historical Price Trends (Interactive Timeline)
              </h3>
            </div>
            <span
              className="text-xs font-mono"
              style={{ color: isLight ? '#4B5563' : '#94A3B8' }}
            >
              Interactive timeline & negotiation floor
            </span>
          </div>

          <D3PriceTrendChart
            products={[product]}
            targetPrice={targetPriceAsk}
            userBudget={userBudget}
            height={260}
            showTimeRangeSelector={true}
            initialDays={30}
          />
        </div>
      </div>
    </div>
  );
};
