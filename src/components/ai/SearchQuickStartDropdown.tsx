import React, { useState, useEffect, useRef } from 'react';
import {
  TrendingUp,
  Grid,
  MapPin,
  Search,
  ArrowUpRight,
  Clock,
  Cpu,
  Shirt,
  Footprints,
  ShoppingBasket,
  Sparkles,
  Home,
  Gift,
  Watch,
  Compass,
  X,
  Zap,
} from 'lucide-react';

export interface TrendingSearchPreset {
  id: string;
  label: string;
  query: string;
  category: string;
  budget: number;
  tag: string;
}

export interface PopularCategoryPreset {
  id: string;
  name: string;
  categoryKey: string;
  defaultBudget: number;
  sampleQuery: string;
  subtitle: string;
  iconName: 'Cpu' | 'Shirt' | 'Footprints' | 'ShoppingBasket' | 'Sparkles' | 'Home' | 'Gift' | 'Watch';
}

export interface MapsStorePreset {
  id: string;
  label: string;
  mapsQuery: string;
  locality: string;
  category: string;
}

export const TRENDING_SEARCH_PRESETS: TrendingSearchPreset[] = [
  {
    id: 'trend_laptops_50k',
    label: 'Best laptops under ₹50k',
    query: 'Best laptops under ₹50k',
    category: 'Electronics',
    budget: 50000,
    tag: 'High-Interest Tech',
  },
  {
    id: 'trend_anc_headphones',
    label: 'Latest noise-cancelling headphones',
    query: 'Latest noise-cancelling headphones',
    category: 'Electronics',
    budget: 4500,
    tag: 'Most Negotiated',
  },
  {
    id: 'trend_earbuds',
    label: 'Sony & OnePlus ANC Wireless Earbuds',
    query: 'Best ANC wireless earbuds in India under ₹3000',
    category: 'Electronics',
    budget: 3000,
    tag: 'Top Audio Pick',
  },
  {
    id: 'trend_sneakers',
    label: 'Nike & Puma Campus Running Sneakers',
    query: 'Best Nike Puma casual sneakers in India under ₹3500',
    category: 'Footwear',
    budget: 3500,
    tag: 'Trending Footwear',
  },
  {
    id: 'trend_smartwatch',
    label: 'AMOLED GPS Fitness Smartwatches',
    query: 'Best AMOLED fitness smartwatch in India under ₹4500',
    category: 'Electronics',
    budget: 4500,
    tag: 'Top Tech Deal',
  },
  {
    id: 'trend_shirts',
    label: "Levi's & U.S. Polo Pure Cotton Casual Shirts",
    query: 'Best cotton casual shirts for men in India under ₹2000',
    category: 'Fashion',
    budget: 2000,
    tag: 'College Essential',
  },
  {
    id: 'trend_keyboard',
    label: 'Hot-Swappable Wireless Mechanical Keyboards',
    query: 'Best wireless mechanical keyboard in India under ₹4500',
    category: 'Electronics',
    budget: 4500,
    tag: 'Desk Setup',
  },
  {
    id: 'trend_dress',
    label: 'Evening Party & Birthday Celebration Dresses',
    query: 'Best party and birthday dresses in India under ₹5000',
    category: 'Fashion',
    budget: 5000,
    tag: 'Popular Gift',
  },
];

export const POPULAR_CATEGORY_PRESETS: PopularCategoryPreset[] = [
  {
    id: 'cat_electronics',
    name: 'Electronics & Audio',
    categoryKey: 'Electronics',
    defaultBudget: 3000,
    sampleQuery: 'Best wireless ANC earbuds, headphones and smartwatches in India under ₹3000',
    subtitle: 'Earbuds, Smartwatches, Keyboards',
    iconName: 'Cpu',
  },
  {
    id: 'cat_fashion',
    name: 'Fashion & Apparel',
    categoryKey: 'Fashion',
    defaultBudget: 2000,
    sampleQuery: 'Best cotton casual shirts, dresses and college wear in India under ₹2000',
    subtitle: 'Shirts, Dresses, Denim & Ethnic',
    iconName: 'Shirt',
  },
  {
    id: 'cat_footwear',
    name: 'Footwear & Sneakers',
    categoryKey: 'Footwear',
    defaultBudget: 3000,
    sampleQuery: 'Best Nike, Puma and Adidas running shoes and sneakers in India under ₹3000',
    subtitle: 'Sneakers, Running Trainers, Boots',
    iconName: 'Footprints',
  },
  {
    id: 'cat_grocery',
    name: 'Supermarket & Grocery',
    categoryKey: 'Grocery',
    defaultBudget: 1500,
    sampleQuery: 'Best organic grocery staples, dry fruits and olive oil in India under ₹1500',
    subtitle: 'Organic Produce, Pantry, Gourmet',
    iconName: 'ShoppingBasket',
  },
  {
    id: 'cat_beauty',
    name: 'Beauty & Wellness',
    categoryKey: 'Beauty',
    defaultBudget: 2000,
    sampleQuery: 'Best dermatological skincare serums and fragrances in India under ₹2000',
    subtitle: 'Skincare, Perfumes, Grooming',
    iconName: 'Sparkles',
  },
  {
    id: 'cat_home',
    name: 'Home & Kitchen',
    categoryKey: 'Home',
    defaultBudget: 3500,
    sampleQuery: 'Best smart home lighting, air fryers and cookware in India under ₹3500',
    subtitle: 'Smart Decor, Cookware, Desk Gear',
    iconName: 'Home',
  },
  {
    id: 'cat_gifts',
    name: 'Gifts & Hampers',
    categoryKey: 'Gifts',
    defaultBudget: 4000,
    sampleQuery: 'Best curated birthday and anniversary gift hampers in India under ₹4000',
    subtitle: 'Birthday, Anniversary, Festive',
    iconName: 'Gift',
  },
  {
    id: 'cat_accessories',
    name: 'Accessories & Bags',
    categoryKey: 'Accessories',
    defaultBudget: 2500,
    sampleQuery: 'Best laptop backpacks, leather wallets and sunglasses in India under ₹2500',
    subtitle: 'Backpacks, Wallets, Eyewear',
    iconName: 'Watch',
  },
];

export const MAPS_STORE_PRESETS: MapsStorePreset[] = [
  {
    id: 'maps_audio',
    label: 'Electronics & Audio Showrooms (Croma, Reliance Digital, Sony Center)',
    mapsQuery: 'Best electronics, headphone and gadget retail stores in Indiranagar and Brigade Road Bengaluru',
    locality: 'Indiranagar & Brigade Rd',
    category: 'Electronics',
  },
  {
    id: 'maps_sneakers',
    label: 'Sneaker & Streetwear Retail Stores (Nike, Puma, VegNonVeg)',
    mapsQuery: 'Best sneaker, footwear and sportswear stores in Koramangala and Indiranagar Bengaluru',
    locality: 'Koramangala & 100ft Rd',
    category: 'Footwear',
  },
  {
    id: 'maps_fashion',
    label: 'Fashion Boutiques & Apparel Flagship Stores',
    mapsQuery: 'Best fashion clothing stores, Zara, Levi’s and boutiques on Commercial Street and Lavelle Road Bengaluru',
    locality: 'Central District & Lavelle Rd',
    category: 'Fashion',
  },
  {
    id: 'maps_grocery',
    label: 'Organic Supermarkets & Gourmet Grocery Stores',
    mapsQuery: 'Best organic supermarkets, Nature’s Basket and gourmet grocery stores in HSR Layout and Jayanagar Bengaluru',
    locality: 'HSR Layout & Jayanagar',
    category: 'Grocery',
  },
];

interface SearchQuickStartDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTrendingSearch: (preset: TrendingSearchPreset) => void;
  onSelectCategoryPreset: (category: PopularCategoryPreset) => void;
  onInstantNegotiatePreset?: (preset: TrendingSearchPreset) => void;
  onSelectMapsPreset?: (mapsPreset: MapsStorePreset, useGps?: boolean) => void;
  recentSearches?: string[];
  onSelectRecentSearch?: (query: string) => void;
  isLightTheme?: boolean;
}

export const SearchQuickStartDropdown: React.FC<SearchQuickStartDropdownProps> = ({
  isOpen,
  onClose,
  onSelectTrendingSearch,
  onSelectCategoryPreset,
  onInstantNegotiatePreset,
  onSelectMapsPreset,
  recentSearches = [],
  onSelectRecentSearch,
  isLightTheme = false,
}) => {
  const [activeTab, setActiveTab] = useState<'trending' | 'categories' | 'maps'>('trending');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const renderCategoryIcon = (iconName: PopularCategoryPreset['iconName']) => {
    const cls = 'w-4 h-4 text-cyan-400 shrink-0';
    switch (iconName) {
      case 'Cpu':
        return <Cpu className={cls} />;
      case 'Shirt':
        return <Shirt className={cls} />;
      case 'Footprints':
        return <Footprints className={cls} />;
      case 'ShoppingBasket':
        return <ShoppingBasket className={cls} />;
      case 'Sparkles':
        return <Sparkles className={cls} />;
      case 'Home':
        return <Home className={cls} />;
      case 'Gift':
        return <Gift className={cls} />;
      case 'Watch':
        return <Watch className={cls} />;
    }
  };

  return (
    <div
      ref={dropdownRef}
      role="dialog"
      aria-label="Trending searches, popular categories, and nearby Google Maps stores"
      className={`absolute left-0 right-0 top-full mt-2 z-50 rounded-2xl border shadow-2xl overflow-hidden transition-all ${
        isLightTheme
          ? 'bg-white border-slate-200 text-slate-900 shadow-slate-300/70'
          : 'bg-[#0B101D] border-slate-700/90 text-white shadow-black/90'
      }`}
    >
      {/* Top Segmented Control Bar */}
      <div
        className={`flex items-center justify-between px-4 py-2.5 border-b ${
          isLightTheme ? 'bg-slate-50 border-slate-200' : 'bg-[#080C16] border-slate-800'
        }`}
      >
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setActiveTab('trending')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors ${
              activeTab === 'trending'
                ? isLightTheme
                  ? 'bg-blue-600 text-white font-semibold shadow-xs'
                  : 'bg-cyan-500 text-slate-950 font-semibold'
                : isLightTheme
                ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Trending Searches</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('categories')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors ${
              activeTab === 'categories'
                ? isLightTheme
                  ? 'bg-blue-600 text-white font-semibold shadow-xs'
                  : 'bg-cyan-500 text-slate-950 font-semibold'
                : isLightTheme
                ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span>Popular Categories</span>
          </button>

          {onSelectMapsPreset && (
            <button
              type="button"
              onClick={() => setActiveTab('maps')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors ${
                activeTab === 'maps'
                  ? isLightTheme
                    ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                    : 'bg-emerald-500 text-slate-950 font-semibold'
                  : isLightTheme
                  ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Nearby Stores (Google Maps)</span>
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close quick start menu"
          className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
            isLightTheme
              ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-200/60'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Dropdown Content Body */}
      <div className="p-4 max-h-[380px] overflow-y-auto space-y-4">
        {/* TAB 1: TRENDING SEARCHES */}
        {activeTab === 'trending' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span
                className={`text-xs font-medium ${
                  isLightTheme ? 'text-slate-500' : 'text-slate-400'
                }`}
              >
                Click any trending search to fetch live Google Search deals & start AI negotiation:
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {TRENDING_SEARCH_PRESETS.map((item) => (
                <div
                  key={item.id}
                  className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between gap-2 group ${
                    isLightTheme
                      ? 'bg-slate-50/70 hover:bg-blue-50/60 border-slate-200 hover:border-blue-300'
                      : 'bg-slate-900/70 hover:bg-slate-800/90 border-slate-800 hover:border-cyan-500/40'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      onSelectTrendingSearch(item);
                      onClose();
                    }}
                    className="min-w-0 flex-1 text-left cursor-pointer"
                  >
                    <div
                      className={`text-xs font-semibold truncate transition-colors ${
                        isLightTheme
                          ? 'text-slate-900 group-hover:text-blue-600'
                          : 'text-white group-hover:text-cyan-300'
                      }`}
                    >
                      {item.label}
                    </div>
                    <div
                      className={`text-[11px] font-mono mt-1 flex items-center gap-1.5 flex-wrap ${
                        isLightTheme ? 'text-slate-500' : 'text-slate-400'
                      }`}
                    >
                      <span>{item.category}</span>
                      <span>·</span>
                      <span className="text-emerald-500 font-semibold">
                        Under ₹{item.budget.toLocaleString('en-IN')}
                      </span>
                      <span>·</span>
                      <span>{item.tag}</span>
                    </div>
                  </button>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {onInstantNegotiatePreset && (
                      <button
                        type="button"
                        onClick={() => {
                          onInstantNegotiatePreset(item);
                          onClose();
                        }}
                        title={`Search "${item.label}" & initiate AI negotiation`}
                        className="px-2.5 py-1.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500 text-cyan-300 hover:text-slate-950 border border-cyan-500/30 font-mono font-bold text-[10px] flex items-center gap-1 transition-all cursor-pointer"
                      >
                        <Zap className="w-3 h-3" />
                        <span>Negotiate</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        onSelectTrendingSearch(item);
                        onClose();
                      }}
                      aria-label={`Search ${item.label}`}
                      className="p-1 rounded-lg cursor-pointer"
                    >
                      <ArrowUpRight
                        className={`w-4 h-4 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${
                          isLightTheme
                            ? 'text-slate-400 group-hover:text-blue-600'
                            : 'text-slate-500 group-hover:text-cyan-400'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Recent Searches if available */}
            {recentSearches.length > 0 && onSelectRecentSearch && (
              <div
                className={`pt-3 border-t space-y-2 ${
                  isLightTheme ? 'border-slate-200' : 'border-slate-800'
                }`}
              >
                <div
                  className={`text-xs font-medium flex items-center gap-1.5 ${
                    isLightTheme ? 'text-slate-500' : 'text-slate-400'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Your Recent Searches</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((recent, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        onSelectRecentSearch(recent);
                        onClose();
                      }}
                      className={`px-3 py-1.5 rounded-lg border text-xs flex items-center gap-1.5 cursor-pointer transition-colors ${
                        isLightTheme
                          ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                          : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300 hover:text-white'
                      }`}
                    >
                      <Search className="w-3 h-3 text-slate-400" />
                      <span>{recent}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: POPULAR CATEGORIES */}
        {activeTab === 'categories' && (
          <div className="space-y-3">
            <div
              className={`text-xs font-medium ${
                isLightTheme ? 'text-slate-500' : 'text-slate-400'
              }`}
            >
              Choose a popular category to auto-configure your target budget and fetch live deals:
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {POPULAR_CATEGORY_PRESETS.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    onSelectCategoryPreset(cat);
                    onClose();
                  }}
                  className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between gap-2 cursor-pointer group ${
                    isLightTheme
                      ? 'bg-slate-50/80 hover:bg-blue-50/70 border-slate-200 hover:border-blue-300'
                      : 'bg-slate-900/70 hover:bg-slate-800 border-slate-800 hover:border-cyan-500/40'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {renderCategoryIcon(cat.iconName)}
                      <span
                        className={`text-xs font-semibold ${
                          isLightTheme
                            ? 'text-slate-900 group-hover:text-blue-600'
                            : 'text-white group-hover:text-cyan-300'
                        }`}
                      >
                        {cat.name}
                      </span>
                    </div>
                  </div>
                  <div
                    className={`text-[11px] leading-snug ${
                      isLightTheme ? 'text-slate-500' : 'text-slate-400'
                    }`}
                  >
                    {cat.subtitle}
                  </div>
                  <div className="text-[11px] font-mono text-emerald-500 font-semibold pt-1">
                    Target ≤ ₹{cat.defaultBudget.toLocaleString('en-IN')} →
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: NEARBY STORES VIA GOOGLE MAPS GROUNDING */}
        {activeTab === 'maps' && onSelectMapsPreset && (
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span
                className={`text-xs font-medium ${
                  isLightTheme ? 'text-slate-600' : 'text-slate-300'
                }`}
              >
                Discover verified neighborhood retail stores & showrooms powered by live Google Maps Grounding:
              </span>
              <button
                type="button"
                onClick={() => {
                  onSelectMapsPreset(
                    {
                      id: 'maps_gps',
                      label: 'Retail Stores Near My GPS',
                      mapsQuery: 'Best electronics, fashion and footwear retail stores near me',
                      locality: 'Current GPS Location',
                      category: 'Electronics',
                    },
                    true
                  );
                  onClose();
                }}
                className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs flex items-center gap-1.5 cursor-pointer self-start sm:self-auto shrink-0"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Find Stores Near My GPS</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {MAPS_STORE_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    onSelectMapsPreset(preset, false);
                    onClose();
                  }}
                  className={`p-3 rounded-xl border text-left transition-all flex items-start justify-between gap-3 cursor-pointer group ${
                    isLightTheme
                      ? 'bg-slate-50 hover:bg-emerald-50/60 border-slate-200 hover:border-emerald-300'
                      : 'bg-slate-900/70 hover:bg-slate-800 border-slate-800 hover:border-emerald-500/40'
                  }`}
                >
                  <div>
                    <div
                      className={`text-xs font-semibold ${
                        isLightTheme
                          ? 'text-slate-900 group-hover:text-emerald-700'
                          : 'text-white group-hover:text-emerald-300'
                      }`}
                    >
                      {preset.label}
                    </div>
                    <div
                      className={`text-[11px] font-mono mt-1 flex items-center gap-1.5 ${
                        isLightTheme ? 'text-slate-500' : 'text-slate-400'
                      }`}
                    >
                      <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span>{preset.locality}</span>
                      <span>·</span>
                      <span>{preset.category}</span>
                    </div>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
