import React, { useState } from 'react';
import { FEATURED_BUNDLES, BundleDeal } from '../../data/catalog';
import { Product } from '../../types';
import { Layers, Sparkles, ArrowRight, ShieldCheck, Check } from 'lucide-react';

interface BundleNegotiatorProps {
  onStartBundleNegotiation: (bundleProduct: Product, target: number, max: number) => void;
}

export const BundleNegotiator: React.FC<BundleNegotiatorProps> = ({
  onStartBundleNegotiation,
}) => {
  const [selectedBundle, setSelectedBundle] = useState<BundleDeal>(FEATURED_BUNDLES[0]);
  const [customTarget, setCustomTarget] = useState(selectedBundle.defaultTarget);
  const [customMax, setCustomMax] = useState(selectedBundle.defaultMax);

  const handleSelectBundle = (bundle: BundleDeal) => {
    setSelectedBundle(bundle);
    setCustomTarget(bundle.defaultTarget);
    setCustomMax(bundle.defaultMax);
  };

  const handleLaunch = () => {
    // Synthesize a bundled product model
    const bundleProduct: Product = {
      id: selectedBundle.id,
      name: selectedBundle.name,
      brand: 'Dual-Brand Alliance',
      category: 'Bundle Pack',
      rating: 4.9,
      reviewsCount: 380,
      listPrice: selectedBundle.combinedListPrice,
      marketPrice: selectedBundle.combinedListPrice + 800,
      minAcceptablePrice: selectedBundle.minBundlePrice,
      maxDiscountPercent: 22,
      stock: 14,
      sellerId: selectedBundle.items[0].sellerId,
      sellerName: 'Multi-Seller Unified Consortium',
      sellerRating: 4.9,
      image: selectedBundle.items[0].image,
      description: selectedBundle.description,
      specs: {
        'Pack Contents': `${selectedBundle.items.map((i) => i.name).join(' + ')}`,
        'Unified Warranty': 'Comprehensive 1-Year Coverage',
        'Fulfillment': 'Single Combined Express Parcel',
      },
      isNegotiable: true,
      bundleEligible: true,
      deliveryDays: 2,
    };

    onStartBundleNegotiation(bundleProduct, customTarget, customMax);
  };

  return (
    <div className="space-y-8">
      {/* Header Explainer */}
      <div className="bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-[#0A0E18] border border-indigo-500/30 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-2.5 mb-2">
          <Layers className="w-5 h-5 text-indigo-400" />
          <h2 className="font-display font-bold text-lg text-white">
            Multi-Item Bundle AI Bargaining
          </h2>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800">
            Cross-Merchant Compression
          </span>
        </div>
        <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
          Order multiple items together to unlock volume elasticity. Your Buyer Agent negotiates combined bulk margins with unified seller fulfillment.
        </p>
      </div>

      {/* Featured Bundles Selector */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {FEATURED_BUNDLES.map((bundle) => {
          const isSelected = selectedBundle.id === bundle.id;
          const maxPossibleSavings = bundle.combinedListPrice - bundle.minBundlePrice;

          return (
            <div
              key={bundle.id}
              onClick={() => handleSelectBundle(bundle)}
              className={`p-5 rounded-2xl border cursor-pointer transition-all duration-200 transform-style-3d ${
                isSelected
                  ? 'border-indigo-400/80 bg-[#101426] shadow-xl shadow-indigo-950/40'
                  : 'border-slate-800 bg-[#0B0F19] hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-xs font-bold font-mono text-indigo-400">
                  Bundle Pack
                </span>
                {isSelected && (
                  <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-400">
                    <Check className="w-3.5 h-3.5" /> Selected
                  </span>
                )}
              </div>

              <h3 className="font-display font-bold text-base text-white mb-2">
                {bundle.name}
              </h3>
              <p className="text-xs text-slate-400 mb-4">{bundle.description}</p>

              {/* Items in bundle preview */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                {bundle.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-2 p-2 rounded-xl bg-slate-900/80 border border-slate-800"
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-lg object-cover bg-slate-800"
                    />
                    <div className="overflow-hidden">
                      <p className="text-[11px] font-bold text-slate-200 truncate">{item.name}</p>
                      <p className="text-[10px] font-mono text-slate-400">₹{item.listPrice.toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Price Row */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase">Combined List</span>
                  <div className="text-sm font-bold font-mono text-slate-300">
                    ₹{bundle.combinedListPrice.toLocaleString('en-IN')}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-mono text-emerald-400 uppercase">Save Up To</span>
                  <div className="text-sm font-bold font-mono text-emerald-400">
                    ₹{maxPossibleSavings.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Negotiation Constraints Configurator */}
      <div className="bg-[#0A0E18] border border-slate-800 rounded-2xl p-6">
        <h3 className="font-display font-bold text-sm text-white mb-4">
          Configure Your Bundle Budget Limits
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-xs font-mono text-slate-300 mb-2">
              Target Price (Ideal Deal)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">₹</span>
              <input
                type="number"
                value={customTarget}
                onChange={(e) => setCustomTarget(Number(e.target.value))}
                className="w-full pl-7 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm font-mono text-white focus:outline-none focus:border-cyan-400"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1 font-mono">
              Suggested baseline: ₹{selectedBundle.defaultTarget.toLocaleString('en-IN')}
            </p>
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-300 mb-2">
              Absolute Maximum Ceiling
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">₹</span>
              <input
                type="number"
                value={customMax}
                onChange={(e) => setCustomMax(Number(e.target.value))}
                className="w-full pl-7 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm font-mono text-white focus:outline-none focus:border-amber-400"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1 font-mono">
              Buyer Agent will terminate negotiation if exceeded
            </p>
          </div>
        </div>

        <button
          onClick={handleLaunch}
          className="w-full py-3.5 bg-gradient-to-r from-indigo-500 via-cyan-500 to-teal-400 hover:from-indigo-400 hover:to-teal-300 text-slate-950 font-bold text-sm rounded-xl shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all transform hover:-translate-y-0.5 active:translate-y-0"
        >
          <Sparkles className="w-4 h-4 text-slate-950" />
          <span>Start Autonomous Bundle Negotiation</span>
          <ArrowRight className="w-4 h-4 font-bold" />
        </button>
      </div>
    </div>
  );
};
