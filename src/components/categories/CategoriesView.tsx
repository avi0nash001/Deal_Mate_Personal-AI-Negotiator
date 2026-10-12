import React, { useState } from 'react';
import { CATEGORIES_LIST, PRODUCTS } from '../../data/catalog';
import { Product } from '../../types';
import { rankProductsByRatingAndReviews } from '../../services/negotiationEngine';
import {
  Shirt,
  Footprints,
  ShoppingBasket,
  Cpu,
  Sparkles,
  Home,
  Gift,
  Watch,
  ArrowRight,
  TrendingUp,
  Star,
  CheckCircle2,
  Zap,
} from 'lucide-react';
import { ThemeId, THEMES } from '../../types/theme';

interface CategoriesViewProps {
  products?: Product[];
  onSelectCategory: (categoryId: string) => void;
  onSelectProduct?: (product: Product) => void;
  currentThemeId?: ThemeId;
}

export const CategoriesView: React.FC<CategoriesViewProps> = ({
  products = PRODUCTS,
  onSelectCategory,
  onSelectProduct,
  currentThemeId = 'pure-white',
}) => {
  const currentTheme = THEMES[currentThemeId] || THEMES['pure-white'];
  const isLight = currentTheme.isLight;

  // Selected category filter tab: 'all' to show trending across categories, or specific categoryId
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<string>('all');

  const getCategoryTheme = (iconName: string) => {
    switch (iconName) {
      case 'Shirt':
        return {
          lightBg: 'bg-sky-50 border-sky-100 text-sky-600',
          darkBg: 'bg-[var(--dm-surface-3)] border-[var(--border)] text-cyan-400',
          icon: <Shirt className="w-6 h-6" />,
        };
      case 'Footprints':
        return {
          lightBg: 'bg-indigo-50 border-indigo-100 text-indigo-600',
          darkBg: 'bg-[var(--dm-surface-3)] border-[var(--border)] text-indigo-400',
          icon: <Footprints className="w-6 h-6" />,
        };
      case 'ShoppingBasket':
        return {
          lightBg: 'bg-emerald-50 border-emerald-100 text-emerald-600',
          darkBg: 'bg-[var(--dm-surface-3)] border-[var(--border)] text-emerald-400',
          icon: <ShoppingBasket className="w-6 h-6" />,
        };
      case 'Cpu':
        return {
          lightBg: 'bg-blue-50 border-blue-100 text-blue-600',
          darkBg: 'bg-[var(--dm-surface-3)] border-[var(--border)] text-cyan-400',
          icon: <Cpu className="w-6 h-6" />,
        };
      case 'Sparkles':
        return {
          lightBg: 'bg-pink-50 border-pink-100 text-pink-600',
          darkBg: 'bg-[var(--dm-surface-3)] border-[var(--border)] text-pink-400',
          icon: <Sparkles className="w-6 h-6" />,
        };
      case 'Home':
        return {
          lightBg: 'bg-amber-50 border-amber-100 text-amber-600',
          darkBg: 'bg-[var(--dm-surface-3)] border-[var(--border)] text-amber-400',
          icon: <Home className="w-6 h-6" />,
        };
      case 'Gift':
        return {
          lightBg: 'bg-purple-50 border-purple-100 text-purple-600',
          darkBg: 'bg-[var(--dm-surface-3)] border-[var(--border)] text-purple-400',
          icon: <Gift className="w-6 h-6" />,
        };
      case 'Watch':
        return {
          lightBg: 'bg-teal-50 border-teal-100 text-teal-600',
          darkBg: 'bg-[var(--dm-surface-3)] border-[var(--border)] text-sky-400',
          icon: <Watch className="w-6 h-6" />,
        };
      default:
        return {
          lightBg: 'bg-blue-50 border-blue-100 text-blue-600',
          darkBg: 'bg-[var(--dm-surface-3)] border-[var(--border)] text-cyan-400',
          icon: <Shirt className="w-6 h-6" />,
        };
    }
  };

  /**
   * Helper to normalize category matching across catalog variations
   */
  const matchCategory = (prod: Product, targetCategory: string) => {
    const pCat = (prod.category || '').toLowerCase();
    const pSub = (prod.subcategory || '').toLowerCase();
    const t = targetCategory.toLowerCase();

    if (pCat === t || pSub === t) return true;
    if (t === 'fashion' && (pCat.includes('fashion') || pCat.includes('apparel') || pCat.includes('shirt') || pCat.includes('dress'))) return true;
    if (t === 'footwear' && (pCat.includes('footwear') || pCat.includes('shoe') || pCat.includes('sneaker') || pCat.includes('streetwear'))) return true;
    if (t === 'grocery' && (pCat.includes('grocery') || pCat.includes('supermarket') || pCat.includes('food') || pCat.includes('organic'))) return true;
    if (t === 'electronics' && (pCat.includes('electronics') || pCat.includes('audio') || pCat.includes('gadget') || pCat.includes('earbud') || pCat.includes('laptop') || pCat.includes('smartwatch'))) return true;
    if (t === 'accessories' && (pCat.includes('accessories') || pCat.includes('watch') || pCat.includes('wearable'))) return true;
    return false;
  };

  /**
   * Filter and rank products for each category view using the rankProductsByRatingAndReviews utility
   */
  const getTrendingProductsForCategory = (categoryId: string, limit = 4): Product[] => {
    const categoryProducts = products.filter((p) => matchCategory(p, categoryId));
    const ranked = rankProductsByRatingAndReviews(categoryProducts);
    return ranked.slice(0, limit);
  };

  // Categories to render in the 'Trending in this category' section
  const activeTrendingCategories = selectedCategoryTab === 'all'
    ? CATEGORIES_LIST.filter((cat) => getTrendingProductsForCategory(cat.id).length > 0)
    : CATEGORIES_LIST.filter((cat) => cat.id === selectedCategoryTab);

  return (
    <div className="space-y-10 max-w-6xl mx-auto pb-12">
      {/* Header section with semantic theme variables */}
      <div className="pb-4 border-b border-[var(--border)] transition-colors duration-300">
        <h1 className="font-display font-extrabold text-2xl sm:text-3xl tracking-tight text-[var(--text-primary)] transition-colors duration-300">
          Explore Shopping Categories
        </h1>
        <p className="text-xs sm:text-sm mt-1.5 leading-relaxed text-[var(--text-secondary)] transition-colors duration-300">
          Pick any retail department and let DealMate AI negotiate verified deals matching your exact budget.
        </p>
      </div>

      {/* 8 Product Category Cards in Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {CATEGORIES_LIST.map((cat) => {
          const themeStyle = getCategoryTheme(cat.icon);
          const isSelected = selectedCategoryTab === cat.id;

          return (
            <div
              key={cat.id}
              onClick={() => {
                // Clicking sets the filter tab to explore category trends or navigates directly
                setSelectedCategoryTab((prev) => (prev === cat.id ? 'all' : cat.id));
              }}
              className={`p-6 rounded-2xl transition-all duration-200 cursor-pointer group flex flex-col justify-between h-full min-h-[230px] border ${
                isSelected
                  ? isLight
                    ? 'bg-blue-50/70 border-blue-500 ring-2 ring-blue-500/30 shadow-md'
                    : 'bg-cyan-950/30 border-cyan-400 ring-2 ring-cyan-500/30 shadow-md'
                  : isLight
                  ? 'bg-surface border-slate-200/90 hover:border-blue-400 hover:shadow-lg hover:shadow-blue-500/5 hover:-translate-y-1'
                  : 'bg-[var(--dm-surface)] border-[var(--border)] hover:border-cyan-500/50 hover:shadow-xl hover:shadow-cyan-950/20 hover:-translate-y-1'
              }`}
            >
              <div>
                {/* Soft pastel icon container in light mode, subtle dark surface in dark mode */}
                <div
                  className={`w-12 h-12 rounded-2xl border flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-200 ${
                    isLight ? themeStyle.lightBg : themeStyle.darkBg
                  }`}
                >
                  {themeStyle.icon}
                </div>

                {/* Category title using text-primary */}
                <h3 className="font-display font-bold text-base text-[var(--text-primary)] group-hover:text-blue-500 transition-colors duration-200">
                  {cat.name}
                </h3>

                {/* Description using text-secondary */}
                <p className="text-xs mt-1.5 leading-relaxed text-[var(--text-secondary)] transition-colors duration-200">
                  {cat.desc}
                </p>
              </div>

              {/* Bottom footer with item count and clear interactive link */}
              <div className="mt-5 pt-3 border-t border-[var(--border)] flex items-center justify-between transition-colors duration-200">
                <span className="text-[11px] font-mono font-medium text-[var(--text-muted)]">
                  {cat.count}
                </span>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectCategory(cat.id);
                  }}
                  className="text-xs font-mono font-semibold flex items-center gap-1 text-[var(--accent)] group-hover:translate-x-1 transition-all duration-200 hover:underline cursor-pointer"
                >
                  <span>Shop with AI</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* TRENDING IN THIS CATEGORY SECTION */}
      <div className="space-y-8 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[var(--border)]">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                isLight
                  ? 'bg-amber-100 text-amber-700 border border-amber-200'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              }`}
            >
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg sm:text-xl text-[var(--text-primary)]">
                Trending in this Category
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Ranked by user review volume and verified customer ratings via AI negotiation engine
              </p>
            </div>
          </div>

          {/* Category filter tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            <button
              type="button"
              onClick={() => setSelectedCategoryTab('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategoryTab === 'all'
                  ? isLight
                    ? 'bg-blue-600 text-white font-bold shadow-xs'
                    : 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                  : isLight
                  ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              All Categories
            </button>
            {CATEGORIES_LIST.map((c) => {
              const active = selectedCategoryTab === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedCategoryTab(c.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    active
                      ? isLight
                        ? 'bg-blue-600 text-white font-bold shadow-xs'
                        : 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                      : isLight
                      ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  {c.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Render Trending Sections for each Category */}
        <div className="space-y-10">
          {activeTrendingCategories.map((cat) => {
            const trendingProducts = getTrendingProductsForCategory(cat.id, 4);
            if (trendingProducts.length === 0) {
              return null;
            }

            return (
              <div key={cat.id} className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg ${
                        isLight
                          ? 'bg-blue-100 text-blue-800 border border-blue-200'
                          : 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                      }`}
                    >
                      {cat.name}
                    </span>
                    <span className="text-xs text-[var(--text-secondary)]">
                      Top ranked deals ({trendingProducts.length})
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => onSelectCategory(cat.id)}
                    className="text-xs font-mono font-semibold text-[var(--accent)] hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    <span>View all in {cat.name}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {trendingProducts.map((prod, index) => {
                    const discountPct = Math.round(
                      ((prod.listPrice - prod.minAcceptablePrice) / prod.listPrice) * 100
                    );

                    return (
                      <div
                        key={prod.id}
                        className={`rounded-2xl border p-4 flex flex-col justify-between transition-all duration-200 shadow-sm hover:shadow-md ${
                          isLight
                            ? 'bg-white border-slate-200 hover:border-blue-400'
                            : 'bg-[#0B101D] border-slate-800 hover:border-cyan-500/50'
                        }`}
                      >
                        <div>
                          {/* Image & Rank Badge */}
                          <div className="relative aspect-4/3 rounded-xl overflow-hidden mb-3 bg-slate-900 border border-slate-800/80">
                            <img
                              src={prod.image}
                              alt={prod.name}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                            {/* Ranking Badge */}
                            <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-slate-950/80 backdrop-blur-xs border border-amber-400/40 text-amber-300 text-[10px] font-mono font-bold flex items-center gap-1">
                              <span>#{index + 1} Trending</span>
                            </div>

                            {/* Negotiable Badge */}
                            {prod.isNegotiable && (
                              <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded-md bg-emerald-950/85 backdrop-blur-xs border border-emerald-500/40 text-emerald-300 text-[9px] font-mono font-semibold flex items-center gap-1">
                                <Zap className="w-2.5 h-2.5" />
                                <span>Negotiable</span>
                              </div>
                            )}
                          </div>

                          {/* Brand & Name */}
                          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] font-semibold">
                            {prod.brand}
                          </div>
                          <h4
                            className={`font-display font-bold text-xs sm:text-sm line-clamp-2 mt-0.5 ${
                              isLight ? 'text-slate-900' : 'text-[#F8FAFC]'
                            }`}
                            title={prod.name}
                          >
                            {prod.name}
                          </h4>

                          {/* Rating & Review Count (Key Ranking Criteria) */}
                          <div className="flex items-center gap-1.5 mt-2 text-xs font-mono">
                            <div className="flex items-center text-amber-400">
                              <Star className="w-3.5 h-3.5 fill-current" />
                            </div>
                            <span
                              className={`font-bold tabular-nums ${
                                isLight ? 'text-slate-800' : 'text-slate-200'
                              }`}
                            >
                              {prod.rating.toFixed(1)}
                            </span>
                            <span aria-hidden="true" className="text-slate-400">·</span>
                            <span className="text-[11px] text-[var(--text-muted)] tabular-nums">
                              {prod.reviewsCount.toLocaleString('en-IN')} reviews
                            </span>
                          </div>

                          {/* Seller info */}
                          <div className="text-[11px] text-[var(--text-secondary)] mt-1 truncate">
                            Seller: <span className="font-medium">{prod.sellerName}</span>
                          </div>
                        </div>

                        {/* Price & Action */}
                        <div className="mt-4 pt-3 border-t border-[var(--border)]">
                          <div className="flex items-baseline justify-between mb-2">
                            <div>
                              <span
                                className={`text-sm sm:text-base font-extrabold font-mono tabular-nums ${
                                  isLight ? 'text-slate-900' : 'text-[#F8FAFC]'
                                }`}
                              >
                                ₹{prod.listPrice.toLocaleString('en-IN')}
                              </span>
                              {prod.marketPrice > prod.listPrice && (
                                <span className="text-[10px] text-[var(--text-muted)] line-through font-mono tabular-nums ml-1.5">
                                  ₹{prod.marketPrice.toLocaleString('en-IN')}
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                              Up to {discountPct}% off
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              if (onSelectProduct) {
                                onSelectProduct(prod);
                              } else {
                                onSelectCategory(cat.id);
                              }
                            }}
                            className={`w-full py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95 ${
                              isLight
                                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs shadow-blue-500/20'
                                : 'bg-gradient-to-r from-cyan-400 to-indigo-500 hover:from-cyan-300 hover:to-indigo-400 text-slate-950 shadow-md shadow-cyan-500/20'
                            }`}
                          >
                            <span>Negotiate Deal</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

