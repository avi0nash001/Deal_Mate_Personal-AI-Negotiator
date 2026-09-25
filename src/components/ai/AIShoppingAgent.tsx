import React, { useState, useEffect } from 'react';
import { Product, UserRequirement, LocalStore } from '../../types';
import { RecommendationEngine } from '../../services/recommendationEngine';
import {
  Bot,
  Send,
  Sparkles,
  Search,
  CheckCircle,
  HelpCircle,
  TrendingDown,
  Store,
  Layers,
  Heart,
  Eye,
  SlidersHorizontal,
  MapPin,
  Star,
  Zap,
  ArrowRight,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';

interface AIShoppingAgentProps {
  products: Product[];
  localStores: LocalStore[];
  initialQuery?: string;
  initialBudget?: number;
  onNegotiateProduct: (product: Product, targetPrice: number, maxBudget: number) => void;
  onCompareToggle: (product: Product) => void;
  comparedProductIds: string[];
  onSaveToggle: (product: Product) => void;
  savedProductIds: string[];
  onViewStore: (store: LocalStore) => void;
}

export const AIShoppingAgent: React.FC<AIShoppingAgentProps> = ({
  products,
  localStores,
  initialQuery = '',
  initialBudget,
  onNegotiateProduct,
  onCompareToggle,
  comparedProductIds,
  onSaveToggle,
  savedProductIds,
  onViewStore,
}) => {
  const [inputText, setInputText] = useState(initialQuery);
  const [currentRequirement, setCurrentRequirement] = useState<UserRequirement>(() => {
    if (initialQuery) {
      return RecommendationEngine.parseUserQuery(initialQuery);
    }
    return {
      budget: initialBudget || 2000,
      category: 'Fashion',
      purpose: 'College',
      preference: 'Casual',
    };
  });

  const [selectedProductDetail, setSelectedProductDetail] = useState<Product | null>(null);

  // Sync if initialQuery changes
  useEffect(() => {
    if (initialQuery) {
      const parsed = RecommendationEngine.parseUserQuery(initialQuery);
      setCurrentRequirement(parsed);
      setInputText(initialQuery);
    }
  }, [initialQuery]);

  const budgetOptions = [500, 1000, 2000, 5000, 10000];
  const categoryOptions = [
    'Clothes',
    'Shoes',
    'Electronics',
    'Grocery',
    'Beauty',
    'Home',
    'Gifts',
    'Accessories',
  ];

  const handleBudgetSelect = (amount: number) => {
    setCurrentRequirement((prev) => ({
      ...prev,
      budget: amount,
    }));
  };

  const handleCategorySelect = (catName: string) => {
    let cat = 'Fashion';
    if (catName === 'Clothes') cat = 'Fashion';
    else if (catName === 'Shoes') cat = 'Footwear';
    else if (catName === 'Electronics') cat = 'Electronics';
    else if (catName === 'Grocery') cat = 'Grocery';
    else if (catName === 'Beauty') cat = 'Beauty';
    else if (catName === 'Home') cat = 'Home';
    else if (catName === 'Gifts') cat = 'Gifts';
    else if (catName === 'Accessories') cat = 'Accessories';

    setCurrentRequirement((prev) => ({
      ...prev,
      category: cat,
    }));
  };

  const handleRefine = (refinementText: string) => {
    const updated = { ...currentRequirement };
    const lower = refinementText.toLowerCase();

    if (lower.includes('cheaper') || lower.includes('under 2,000') || lower.includes('under 2000')) {
      updated.budget = Math.max(1000, updated.budget - 500);
    } else if (lower.includes('better quality') || lower.includes('increase budget')) {
      updated.budget = updated.budget + 1000;
      updated.preference = 'High Quality';
    } else if (lower.includes('black')) {
      updated.color = 'Black';
    } else if (lower.includes('near me') || lower.includes('stores')) {
      updated.deliveryPreference = 'pickup';
    }

    setCurrentRequirement(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    const parsed = RecommendationEngine.parseUserQuery(inputText);
    setCurrentRequirement(parsed);
  };

  // Get 3-tier classified recommendations
  const { perfectWithinBudget, bestValue, slightlyAboveBudget } =
    RecommendationEngine.getCategorizedRecommendations(currentRequirement, products);

  const hasAnyResults =
    perfectWithinBudget.length > 0 || bestValue.length > 0 || slightlyAboveBudget.length > 0;

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* 1. CONVERSATIONAL AI SHOPPING AGENT INTERACTION HEADER */}
      <div className="p-6 rounded-3xl bg-gradient-to-b from-[#0F1626] via-[#0B101C] to-[#080B14] border border-cyan-500/30 shadow-2xl space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-700/60 text-cyan-400 flex items-center justify-center">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-display font-bold text-lg text-white">
              What are you looking for?
            </h2>
            <p className="text-xs text-slate-400">
              Tell me your budget and item in plain words, or select quick preferences below.
            </p>
          </div>
        </div>

        {/* Step A: Ask Budget */}
        <div className="space-y-2">
          <label className="text-xs font-mono uppercase text-slate-400 tracking-wider block">
            1. Select Your Budget:
          </label>
          <div className="flex items-center gap-2 flex-wrap">
            {budgetOptions.map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => handleBudgetSelect(amt)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                  currentRequirement.budget === amt
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30 scale-105'
                    : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
                }`}
              >
                ₹{amt.toLocaleString('en-IN')}
              </button>
            ))}

            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1">
              <span className="text-[11px] font-mono text-slate-400">Custom ₹:</span>
              <input
                type="number"
                value={currentRequirement.budget}
                onChange={(e) => handleBudgetSelect(Number(e.target.value))}
                className="w-20 bg-transparent text-xs font-mono text-white focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Step B: Ask Category */}
        <div className="space-y-2">
          <label className="text-xs font-mono uppercase text-slate-400 tracking-wider block">
            2. What are you looking for?
          </label>
          <div className="flex items-center gap-2 flex-wrap">
            {categoryOptions.map((cat) => {
              const isSelected =
                (cat === 'Clothes' && currentRequirement.category === 'Fashion') ||
                (cat === 'Shoes' && currentRequirement.category === 'Footwear') ||
                currentRequirement.category === cat;

              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => handleCategorySelect(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-semibold'
                      : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Step C: Natural Language Conversational Input */}
        <form onSubmit={handleSubmit} className="relative pt-2">
          <div className="relative flex items-center bg-[#090D17] border border-slate-800 focus-within:border-cyan-400 rounded-2xl p-2 shadow-inner">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="e.g. 'I have ₹2,000 and I need a casual shirt for college'..."
              className="w-full px-3 py-2 bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none font-sans"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Update AI Intent</span>
            </button>
          </div>
        </form>
      </div>

      {/* 2. PERSONALIZED AI RESULT SUMMARY BAR */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-[#0B121E] to-[#0A0E18] border border-cyan-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>AI Understanding Your Requirement</span>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className="text-white font-bold">
              Budget: <span className="text-emerald-400 font-mono">₹{currentRequirement.budget.toLocaleString('en-IN')}</span>
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-white">
              Category: <span className="text-slate-300 font-semibold">{currentRequirement.category}</span>
            </span>
            {currentRequirement.purpose && (
              <>
                <span className="text-slate-600">·</span>
                <span className="text-white">
                  Purpose: <span className="text-slate-300">{currentRequirement.purpose}</span>
                </span>
              </>
            )}
            {currentRequirement.recipient && (
              <>
                <span className="text-slate-600">·</span>
                <span className="text-white">
                  Recipient: <span className="text-slate-300">{currentRequirement.recipient}</span>
                </span>
              </>
            )}
          </div>
        </div>

        {/* Refine My Search Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-mono uppercase text-slate-500 mr-1">Refine:</span>
          {['Show cheaper options', 'Show better quality', 'Show stores near me'].map((ref, idx) => (
            <button
              key={idx}
              onClick={() => handleRefine(ref)}
              className="px-2.5 py-1 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-[11px] font-mono text-slate-300 hover:text-cyan-300 border border-slate-800 transition-colors cursor-pointer"
            >
              {ref}
            </button>
          ))}
        </div>
      </div>

      {/* 3. THREE BUDGET INTELLIGENCE RECOMMENDATION GROUPS */}
      {!hasAnyResults ? (
        /* Section 18: ERROR AND EMPTY STATE HANDLING */
        <div className="p-8 rounded-3xl bg-[#0B0F19] border border-amber-500/30 text-center space-y-4 max-w-xl mx-auto shadow-xl">
          <HelpCircle className="w-10 h-10 text-amber-400 mx-auto" />
          <h3 className="font-display font-bold text-base text-white">
            I couldn't find an exact match within ₹{currentRequirement.budget.toLocaleString('en-IN')}.
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Would you like me to try options up to ₹{(currentRequirement.budget + 800).toLocaleString('en-IN')}, or show nearby stores that offer student discounts?
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => handleRefine('increase budget')}
              className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs shadow-md cursor-pointer"
            >
              Increase Budget (+₹1,000)
            </button>
            <button
              onClick={() => handleCategorySelect('Clothes')}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs border border-slate-700 cursor-pointer"
            >
              Change Requirement
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-12">
          {/* GROUP 1: PERFECTLY WITHIN BUDGET */}
          {perfectWithinBudget.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  <h3 className="font-display font-bold text-base text-white">
                    Perfectly Within Budget
                  </h3>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                    ≤ ₹{currentRequirement.budget.toLocaleString('en-IN')}
                  </span>
                </div>
                <span className="text-xs text-slate-400 font-mono">
                  {perfectWithinBudget.length} Items
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {perfectWithinBudget.map((prod) => (
                  <ProductRecommendationCard
                    key={prod.id}
                    product={prod}
                    userBudget={currentRequirement.budget}
                    onNegotiate={() =>
                      onNegotiateProduct(
                        prod,
                        Math.round(prod.listPrice * 0.8),
                        Math.min(currentRequirement.budget, prod.listPrice)
                      )
                    }
                    onCompare={() => onCompareToggle(prod)}
                    isCompared={comparedProductIds.includes(prod.id)}
                    onSave={() => onSaveToggle(prod)}
                    isSaved={savedProductIds.includes(prod.id)}
                    onViewDetail={() => setSelectedProductDetail(prod)}
                    onViewStore={() => {
                      const matchedStore = localStores.find((s) => s.name.includes(prod.sellerName.split(' ')[0]));
                      if (matchedStore) onViewStore(matchedStore);
                      else if (localStores[0]) onViewStore(localStores[0]);
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* GROUP 2: BEST VALUE */}
          {bestValue.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                  <h3 className="font-display font-bold text-base text-white">
                    Best Value Picks
                  </h3>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                    High Rating + Best Concession
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {bestValue.map((prod) => (
                  <ProductRecommendationCard
                    key={prod.id}
                    product={prod}
                    userBudget={currentRequirement.budget}
                    onNegotiate={() =>
                      onNegotiateProduct(
                        prod,
                        Math.round(prod.listPrice * 0.8),
                        currentRequirement.budget
                      )
                    }
                    onCompare={() => onCompareToggle(prod)}
                    isCompared={comparedProductIds.includes(prod.id)}
                    onSave={() => onSaveToggle(prod)}
                    isSaved={savedProductIds.includes(prod.id)}
                    onViewDetail={() => setSelectedProductDetail(prod)}
                    onViewStore={() => {
                      const matchedStore = localStores.find((s) => s.name.includes(prod.sellerName.split(' ')[0]));
                      if (matchedStore) onViewStore(matchedStore);
                      else if (localStores[0]) onViewStore(localStores[0]);
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* GROUP 3: SLIGHTLY ABOVE BUDGET */}
          {slightlyAboveBudget.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <h3 className="font-display font-bold text-base text-white">
                    Slightly Above Budget
                  </h3>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                    Close Match
                  </span>
                </div>
                <span className="text-xs text-amber-400/90 font-mono text-right">
                  Clearly labeled — Never falsely claimed within budget
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {slightlyAboveBudget.map((prod) => (
                  <ProductRecommendationCard
                    key={prod.id}
                    product={prod}
                    userBudget={currentRequirement.budget}
                    onNegotiate={() =>
                      onNegotiateProduct(
                        prod,
                        currentRequirement.budget,
                        Math.round(currentRequirement.budget * 1.05)
                      )
                    }
                    onCompare={() => onCompareToggle(prod)}
                    isCompared={comparedProductIds.includes(prod.id)}
                    onSave={() => onSaveToggle(prod)}
                    isSaved={savedProductIds.includes(prod.id)}
                    onViewDetail={() => setSelectedProductDetail(prod)}
                    onViewStore={() => {
                      const matchedStore = localStores.find((s) => s.name.includes(prod.sellerName.split(' ')[0]));
                      if (matchedStore) onViewStore(matchedStore);
                      else if (localStores[0]) onViewStore(localStores[0]);
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Product Detail Modal */}
      {selectedProductDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-lg rounded-3xl bg-[#0C121F] border border-cyan-500/40 p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase text-cyan-400">{selectedProductDetail.brand}</span>
                <h3 className="font-display font-bold text-lg text-white">{selectedProductDetail.name}</h3>
              </div>
              <button
                onClick={() => setSelectedProductDetail(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <img
              src={selectedProductDetail.image}
              alt={selectedProductDetail.name}
              referrerPolicy="no-referrer"
              className="w-full aspect-[4/3] rounded-xl object-cover border border-slate-700"
            />

            <p className="text-xs text-slate-300 leading-relaxed">
              {selectedProductDetail.description}
            </p>

            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1 text-xs font-mono">
              {Object.entries(selectedProductDetail.specs).map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span className="text-slate-400">{k}:</span>
                  <span className="text-white font-semibold">{v}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2">
              <div>
                <span className="text-xs text-slate-400 font-mono">List Price:</span>
                <div className="text-xl font-bold font-mono text-white">
                  ₹{selectedProductDetail.listPrice.toLocaleString('en-IN')}
                </div>
              </div>

              <button
                onClick={() => {
                  setSelectedProductDetail(null);
                  onNegotiateProduct(
                    selectedProductDetail,
                    Math.round(selectedProductDetail.listPrice * 0.8),
                    currentRequirement.budget
                  );
                }}
                className="px-5 py-2.5 bg-gradient-to-r from-cyan-400 to-indigo-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg flex items-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Negotiate with AI</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* Individual Recommendation Card with Budget Intelligence */
interface ProductCardProps {
  product: Product;
  userBudget: number;
  onNegotiate: () => void;
  onCompare: () => void;
  isCompared: boolean;
  onSave: () => void;
  isSaved: boolean;
  onViewDetail: () => void;
  onViewStore: () => void;
}

const ProductRecommendationCard: React.FC<ProductCardProps> = ({
  product,
  userBudget,
  onNegotiate,
  onCompare,
  isCompared,
  onSave,
  isSaved,
  onViewDetail,
  onViewStore,
}) => {
  const isAbove = product.listPrice > userBudget;
  const delta = Math.abs(product.listPrice - userBudget);

  return (
    <div className="p-5 rounded-2xl bg-gradient-to-b from-[#0F1422] to-[#0A0D15] border border-slate-800 hover:border-cyan-500/40 transition-all shadow-xl flex flex-col justify-between group">
      <div>
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-[11px] font-semibold font-mono uppercase text-slate-400">
            {product.brand}
          </span>

          <div className="flex items-center gap-1.5">
            {/* AI Match % indicator */}
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800/80">
              AI Match: {product.aiMatchScore || 94}%
            </span>

            {/* Save Button */}
            <button
              onClick={onSave}
              title="Save item"
              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                isSaved
                  ? 'bg-rose-950 border-rose-800 text-rose-400'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
            </button>
          </div>
        </div>

        {/* Product Image */}
        <div
          onClick={onViewDetail}
          className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-slate-900 border border-slate-800 mb-3 cursor-pointer"
        >
          <img
            src={product.image}
            alt={product.name}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />

          {product.isLocalStore && product.storeDistance && (
            <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-slate-900/90 backdrop-blur-md border border-slate-700 text-[10px] font-mono text-cyan-300 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-cyan-400" />
              <span>{product.storeDistance}</span>
            </div>
          )}
        </div>

        {/* Rating and Store */}
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
          <div className="flex items-center gap-1 text-amber-400">
            <Star className="w-3.5 h-3.5 fill-current" />
            <span className="font-bold text-white">{product.rating}</span>
            <span className="text-slate-500">({product.reviewsCount})</span>
          </div>

          <button
            onClick={onViewStore}
            className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <Store className="w-3 h-3" />
            <span>{product.sellerName}</span>
          </button>
        </div>

        {/* Product Name */}
        <h4
          onClick={onViewDetail}
          className="font-display font-bold text-sm text-white line-clamp-1 group-hover:text-cyan-300 transition-colors cursor-pointer"
        >
          {product.name}
        </h4>

        {/* Transparent "Why AI Recommended It" Callout */}
        <div className="mt-2.5 p-2 rounded-lg bg-slate-900/70 border border-slate-800 text-[11px] text-slate-300 leading-normal">
          <span className="text-cyan-400 font-bold block mb-0.5">Why Recommended:</span>
          <p>{product.whyRecommended}</p>
        </div>
      </div>

      {/* Pricing & Actions */}
      <div className="mt-4 pt-3 border-t border-slate-800">
        <div className="flex items-baseline justify-between mb-3">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-extrabold font-mono text-white">
                ₹{product.listPrice.toLocaleString('en-IN')}
              </span>
              <span className="text-xs font-mono text-slate-500 line-through">
                ₹{product.marketPrice.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="text-[10px] font-mono text-slate-400">
              {isAbove ? (
                <span className="text-amber-400 font-semibold">+₹{delta} above budget</span>
              ) : (
                <span className="text-emerald-400 font-semibold">₹{delta} comfortably under budget</span>
              )}
            </div>
          </div>

          {/* Compare toggle */}
          <button
            onClick={onCompare}
            className={`px-2 py-1 rounded-md text-[10px] font-mono border transition-colors cursor-pointer ${
              isCompared
                ? 'bg-cyan-950 border-cyan-700 text-cyan-300 font-bold'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {isCompared ? '✓ Compared' : '+ Compare'}
          </button>
        </div>

        {/* Primary Action Button: Negotiate with AI */}
        <button
          onClick={onNegotiate}
          className="w-full py-2.5 bg-gradient-to-r from-cyan-500 via-teal-400 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-slate-950 font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 cursor-pointer transition-all transform hover:-translate-y-0.5 active:translate-y-0"
        >
          <Zap className="w-3.5 h-3.5 text-slate-950 font-bold" />
          <span>Negotiate with Store AI</span>
          <ArrowRight className="w-3 h-3 text-slate-950 font-bold" />
        </button>
      </div>
    </div>
  );
};
