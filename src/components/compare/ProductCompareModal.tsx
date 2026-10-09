import React, { useState } from 'react';
import { Product } from '../../types';
import { RecommendationEngine } from '../../services/recommendationEngine';
import { D3PriceTrendChart } from '../common/D3PriceTrendChart';
import { X, Sparkles, Star, Zap, Check, ArrowRight, LineChart } from 'lucide-react';

interface ProductCompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  userBudget: number;
  onSelectToNegotiate: (product: Product) => void;
  onRemoveFromCompare: (productId: string) => void;
}

export const ProductCompareModal: React.FC<ProductCompareModalProps> = ({
  isOpen,
  onClose,
  products,
  userBudget,
  onSelectToNegotiate,
  onRemoveFromCompare,
}) => {
  const [aiAdvice, setAiAdvice] = useState<string>('');

  if (!isOpen) return null;

  const handleAskAI = () => {
    const analysis = RecommendationEngine.getComparisonAnalysis(products, userBudget);
    setAiAdvice(analysis);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl rounded-3xl bg-[#0A0E18] border border-cyan-500/40 p-6 shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto space-y-6">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-700/60 flex items-center justify-center text-cyan-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg text-white">
                Side-by-Side Product Comparison
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Evaluated against your ₹{userBudget.toLocaleString('en-IN')} target budget
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {products.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            No products selected for comparison. Click "+ Compare" on any recommendation card to compare up to 3 items.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono border-collapse">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="py-3 px-3 text-slate-400 uppercase text-[10px] w-32">
                    Attribute
                  </th>
                  {products.map((p) => (
                    <th key={p.id} className="py-3 px-3 min-w-[200px]">
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-sans font-bold text-white text-xs truncate">
                          {p.name}
                        </span>
                        <button
                          onClick={() => onRemoveFromCompare(p.id)}
                          className="text-slate-500 hover:text-rose-400 p-0.5"
                          title="Remove from compare"
                        >
                          ✕
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {/* Image */}
                <tr>
                  <td className="py-3 px-3 text-slate-400 font-sans">Preview</td>
                  {products.map((p) => (
                    <td key={p.id} className="py-3 px-3">
                      <img
                        src={p.image}
                        alt={p.name}
                        referrerPolicy="no-referrer"
                        className="w-20 h-20 rounded-xl object-cover border border-slate-700 bg-slate-900"
                      />
                    </td>
                  ))}
                </tr>

                {/* Price */}
                <tr>
                  <td className="py-3 px-3 text-slate-400 font-sans">Price</td>
                  {products.map((p) => (
                    <td key={p.id} className="py-3 px-3">
                      <span className="text-base font-extrabold text-white">
                        ₹{p.listPrice.toLocaleString('en-IN')}
                      </span>
                      <span className="text-[10px] text-slate-500 line-through ml-2">
                        ₹{p.marketPrice.toLocaleString('en-IN')}
                      </span>
                    </td>
                  ))}
                </tr>

                {/* Rating */}
                <tr>
                  <td className="py-3 px-3 text-slate-400 font-sans">Rating</td>
                  {products.map((p) => (
                    <td key={p.id} className="py-3 px-3">
                      <span className="flex items-center gap-1 text-amber-400 font-bold">
                        <Star className="w-3.5 h-3.5 fill-current" /> {p.rating}
                        <span className="text-slate-500 text-[10px]">({p.reviewsCount})</span>
                      </span>
                    </td>
                  ))}
                </tr>

                {/* Brand */}
                <tr>
                  <td className="py-3 px-3 text-slate-400 font-sans">Brand</td>
                  {products.map((p) => (
                    <td key={p.id} className="py-3 px-3 text-slate-200">
                      {p.brand}
                    </td>
                  ))}
                </tr>

                {/* Budget Match */}
                <tr>
                  <td className="py-3 px-3 text-slate-400 font-sans">Budget Fit</td>
                  {products.map((p) => {
                    const isWithin = p.listPrice <= userBudget;
                    return (
                      <td key={p.id} className="py-3 px-3">
                        {isWithin ? (
                          <span className="text-emerald-400 font-bold flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Perfectly Within
                          </span>
                        ) : (
                          <span className="text-amber-400 font-semibold">
                            +₹{p.listPrice - userBudget} Above
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>

                {/* Store Name */}
                <tr>
                  <td className="py-3 px-3 text-slate-400 font-sans">Store</td>
                  {products.map((p) => (
                    <td key={p.id} className="py-3 px-3 text-slate-300">
                      {p.sellerName}
                    </td>
                  ))}
                </tr>

                {/* Action Row */}
                <tr>
                  <td className="py-3 px-3 text-slate-400 font-sans">Action</td>
                  {products.map((p) => (
                    <td key={p.id} className="py-3 px-3">
                      <button
                        onClick={() => {
                          onClose();
                          onSelectToNegotiate(p);
                        }}
                        className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Zap className="w-3 h-3 text-slate-950" />
                        <span>Negotiate</span>
                      </button>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* D3-based Price Trends Visualization */}
        {products.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <LineChart className="w-4 h-4 text-cyan-400" />
              <h3 className="font-display font-bold text-sm text-white">
                Historical Price Comparison (D3.js)
              </h3>
            </div>
            <D3PriceTrendChart
              products={products}
              userBudget={userBudget}
              height={260}
              showTimeRangeSelector={true}
              initialDays={30}
            />
          </div>
        )}

        {/* Ask AI Which One Section */}
        {products.length >= 2 && (
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-display font-bold text-xs uppercase text-slate-200 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>AI Recommendation Assistant</span>
              </span>
              <button
                onClick={handleAskAI}
                className="px-3.5 py-1.5 bg-gradient-to-r from-cyan-400 to-indigo-500 text-slate-950 font-bold text-xs rounded-xl shadow-md cursor-pointer"
              >
                Ask AI: Which One Should I Choose?
              </button>
            </div>

            {aiAdvice && (
              <p className="text-xs text-slate-300 leading-relaxed font-sans bg-[#080B12] p-3 rounded-xl border border-slate-800">
                {aiAdvice}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
