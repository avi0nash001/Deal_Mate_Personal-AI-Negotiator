import React from 'react';
import { Product } from '../../types';
import { D3PriceTrendChart } from '../common/D3PriceTrendChart';
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
}

export const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({
  isOpen,
  onClose,
  product,
  onSelectToNegotiate,
  onAddToCompare,
  isInCompare = false,
  userBudget,
}) => {
  if (!isOpen || !product) return null;

  const targetPriceAsk = Math.round(product.listPrice * 0.85);
  const discountPct = Math.round(
    ((product.marketPrice - product.listPrice) / product.marketPrice) * 100
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl rounded-3xl bg-[#090D16] border border-cyan-500/40 p-6 shadow-2xl text-slate-100 max-h-[92vh] overflow-y-auto space-y-6">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-950 border border-cyan-700/60 flex items-center justify-center text-cyan-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-semibold uppercase tracking-wider text-cyan-400">
                  {product.brand}
                </span>
                <span className="text-slate-600">·</span>
                <span className="text-xs font-mono text-slate-400">
                  {product.category}
                </span>
              </div>
              <h2 className="font-display font-bold text-lg sm:text-xl text-white">
                {product.name}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Product Visual & Key Overview Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* Left Column: Image & Stock */}
          <div className="md:col-span-5 space-y-3">
            <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 group shadow-lg">
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

              <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-lg bg-slate-950/90 border border-slate-700/60 text-xs font-mono text-emerald-400">
                {product.stock} units available
              </div>
            </div>

            {/* Quick Trust Badges */}
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-2 text-slate-300">
                <Truck className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>{product.deliveryDays ? `${product.deliveryDays}d Delivery` : 'Fast Dispatch'}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-2 text-slate-300">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Verified Seller</span>
              </div>
            </div>
          </div>

          {/* Right Column: Pricing, Specs & Actions */}
          <div className="md:col-span-7 space-y-5">
            {/* Price Box */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between flex-wrap gap-3">
              <div>
                <div className="text-[11px] font-mono text-slate-400 uppercase">Current List Price</div>
                <div className="flex items-baseline gap-2.5 mt-0.5">
                  <span className="text-2xl font-extrabold font-mono text-white">
                    ₹{product.listPrice.toLocaleString('en-IN')}
                  </span>
                  <span className="text-sm font-mono text-slate-500 line-through">
                    ₹{product.marketPrice.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <div className="text-[11px] font-mono text-cyan-400 uppercase">AI Target Room</div>
                <div className="text-sm font-mono font-bold text-cyan-300 mt-0.5">
                  Up to ₹{targetPriceAsk.toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            {/* Seller & Rating Bar */}
            <div className="flex items-center justify-between text-xs py-2 border-y border-slate-800/80">
              <div className="flex items-center gap-2 text-slate-300">
                <Store className="w-4 h-4 text-indigo-400" />
                <span>Sold by: <strong className="text-white">{product.sellerName}</strong></span>
              </div>
              <div className="flex items-center gap-1 text-amber-400 font-bold">
                <Star className="w-4 h-4 fill-current" />
                <span>{product.rating}</span>
                <span className="text-slate-500 font-normal">({product.reviewsCount} reviews)</span>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-mono font-semibold uppercase text-slate-400">Description</h4>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                {product.description}
              </p>
            </div>

            {/* Technical Specs Tags */}
            <div className="space-y-2">
              <h4 className="text-xs font-mono font-semibold uppercase text-slate-400">Specifications</h4>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                {Object.entries(product.specs).map(([key, val]) => (
                  <div
                    key={key}
                    className="p-2 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between"
                  >
                    <span className="text-slate-400">{key}</span>
                    <span className="text-white font-medium truncate ml-2">{val}</span>
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
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 cursor-pointer transition-all transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <Zap className="w-4 h-4 text-cyan-200" />
                <span>Negotiate Deal with AI</span>
                <ArrowRight className="w-4 h-4 text-cyan-200" />
              </button>

              {onAddToCompare && (
                <button
                  onClick={() => onAddToCompare(product)}
                  className={`py-3 px-4 rounded-xl border text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors ${
                    isInCompare
                      ? 'bg-emerald-950/40 border-emerald-700/60 text-emerald-400'
                      : 'bg-slate-900 border-slate-700 hover:bg-slate-800 text-slate-200'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  <span>{isInCompare ? 'In Compare' : 'Add to Compare'}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* D3-based Historical Price Trend Section */}
        <div className="pt-2 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-cyan-400" />
              <h3 className="font-display font-bold text-sm text-white">
                Historical Price Trends (D3.js Visualization)
              </h3>
            </div>
            <span className="text-xs font-mono text-slate-400">
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
