import React, { useState, useEffect, useRef } from 'react';
import {
  Zap,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  Search,
  Bot,
  Store,
  TrendingDown,
  CheckCircle2,
  QrCode,
  Play,
  Layers,
  Globe,
  Sliders,
  MessageSquare,
  ExternalLink,
  ChevronDown,
  Lock,
  Compass,
  Mic,
} from 'lucide-react';
import { Product } from '../../types';
import { PRODUCTS } from '../../data/catalog';
import { ThemeId, THEMES } from '../../types/theme';
import { CyberScene3D } from '../common/CyberScene3D';
import { Pipeline3DStage } from './Pipeline3DStage';
import {
  SearchQuickStartDropdown,
  TrendingSearchPreset,
  PopularCategoryPreset,
  MapsStorePreset,
} from '../ai/SearchQuickStartDropdown';
import { soundEffects } from '../../services/soundEffects';

interface LandingHeroProps {
  onStartNegotiating: () => void;
  onLaunchDemo: () => void;
  onExploreMarketplace: () => void;
  onQuickGoogleSearch: (query?: string) => void;
  recentSearches?: string[];
  onSelectProductForNegotiation?: (product: Product) => void;
  currentThemeId?: ThemeId;
}

const HERO_QUICK_SEARCHES = [
  'Wireless ANC earbuds under ₹2,500',
  'Casual college shirt under ₹1,800',
  'Running sneakers under ₹3,000',
  'Smartwatch with AMOLED under ₹3,500',
];

const Hero3DVisual: React.FC<{
  isLight?: boolean;
  primaryAccentHex?: string;
  onSelectProduct?: (product: Product) => void;
}> = ({ isLight = true, onSelectProduct }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ rotateX: 4, rotateY: -6 });
  const [activeProductIdx, setActiveProductIdx] = useState(0);
  const [activeStageIdx, setActiveStageIdx] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const featuredProducts = PRODUCTS.slice(0, 3);
  const currentProduct = featuredProducts[activeProductIdx] || PRODUCTS[0];

  const listPrice = currentProduct.listPrice;
  const floorPrice = currentProduct.minAcceptablePrice;
  const buyerTarget = Math.max(
    Math.round(floorPrice * 0.94),
    Math.round(listPrice * 0.72)
  );
  const midCounterPrice = Math.round((listPrice + floorPrice) / 2);
  const totalSaved = Math.max(0, listPrice - floorPrice);
  const savedPct = Math.round((totalSaved / Math.max(1, listPrice)) * 100);

  // 4 automatic sliding stages from List Price -> Buyer Bid -> Seller Counter -> Floor Locked!
  const stages = [
    {
      id: 0,
      label: 'Opening List',
      roundTag: 'STAGE 01 · RETAIL LISTING',
      speaker: 'SELLER AI',
      currentPrice: listPrice,
      sliderPct: 92,
      message: `Listed at ₹${listPrice.toLocaleString('en-IN')} (${currentProduct.sellerName}). Scanning stock elasticity...`,
      accentColor: 'text-slate-500',
      thumbBg: 'bg-slate-700 text-white',
      barGradient: 'from-blue-500 via-indigo-500 to-slate-500',
    },
    {
      id: 1,
      label: 'Buyer AI Bid',
      roundTag: 'ROUND 01 · BUYER AI OFFER',
      speaker: 'BUYER AI',
      currentPrice: buyerTarget,
      sliderPct: 18,
      message: `"Offering ₹${buyerTarget.toLocaleString('en-IN')} based on 14 live competitor price benchmarks."`,
      accentColor: 'text-blue-600',
      thumbBg: 'bg-blue-600 text-white',
      barGradient: 'from-blue-600 to-cyan-400',
    },
    {
      id: 2,
      label: 'Seller Counter',
      roundTag: 'ROUND 02 · SELLER AI COUNTER',
      speaker: 'SELLER AI',
      currentPrice: midCounterPrice,
      sliderPct: 58,
      message: `"Countering at ₹${midCounterPrice.toLocaleString('en-IN')} — fast 1-day dispatch included."`,
      accentColor: 'text-amber-600',
      thumbBg: 'bg-amber-500 text-slate-950',
      barGradient: 'from-blue-500 via-cyan-400 to-amber-500',
    },
    {
      id: 3,
      label: 'Deal Locked ✓',
      roundTag: 'ROUND 03 · DEAL CONVERGED & LOCKED',
      speaker: 'DEAL LOCKED',
      currentPrice: floorPrice,
      sliderPct: 38,
      message: `Deal locked at verified QR floor ₹${floorPrice.toLocaleString('en-IN')}! You save ₹${totalSaved.toLocaleString('en-IN')} (${savedPct}% OFF).`,
      accentColor: 'text-emerald-600',
      thumbBg: 'bg-emerald-500 text-slate-950',
      barGradient: 'from-emerald-500 via-teal-400 to-cyan-500',
    },
  ];

  const activeStage = stages[activeStageIdx] || stages[0];

  // Automatic sliding negotiation timer: advances stages and cycles products automatically
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setActiveStageIdx((prevStage) => {
        if (prevStage < stages.length - 1) {
          return prevStage + 1;
        }
        setActiveProductIdx((prevProd) => (prevProd + 1) % featuredProducts.length);
        return 0;
      });
    }, 2200);
    return () => clearInterval(timer);
  }, [isPaused, stages.length, featuredProducts.length]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({
      rotateX: -y * 10,
      rotateY: x * 12,
    });
  };

  const handleMouseLeave = () => {
    setIsPaused(false);
    setTilt({ rotateX: 4, rotateY: -6 });
  };

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setIsPaused(true)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full py-2 sm:py-4 flex items-center justify-center select-none"
      style={{ perspective: '1200px' }}
    >
      {/* Ambient 3D Glow */}
      <div className="absolute inset-2 rounded-full bg-gradient-to-tr from-cyan-500/20 via-blue-600/15 to-emerald-500/20 blur-3xl pointer-events-none" />

      {/* 3D Interactive Automatic Sliding Negotiation Card */}
      <div
        className={`relative w-full max-w-[480px] rounded-3xl border p-4 sm:p-6 shadow-2xl transition-transform duration-200 ease-out space-y-4 ${
          isLight
            ? 'bg-white/95 border-slate-200 text-slate-900 shadow-slate-200/90'
            : 'bg-[#0B101D]/95 border-slate-800 text-white shadow-black/70'
        }`}
        style={{
          transform: `rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg)`,
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Top Header + Product Switcher Dots */}
        <div
          className={`flex items-center justify-between gap-2 pb-3 border-b ${
            isLight ? 'border-slate-200' : 'border-slate-800'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
            <span className="text-[11px] font-mono uppercase tracking-wider text-blue-600 font-bold truncate">
              Live Auto-Sliding AI Negotiation
            </span>
          </div>

          {/* Product Slide Selector Pills */}
          <div className="flex items-center gap-1.5 shrink-0">
            {featuredProducts.map((p, idx) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setActiveProductIdx(idx);
                  setActiveStageIdx(0);
                }}
                title={p.name}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  idx === activeProductIdx
                    ? 'w-6 bg-blue-600'
                    : isLight
                    ? 'w-2 bg-slate-300 hover:bg-slate-400'
                    : 'w-2 bg-slate-700 hover:bg-slate-600'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Active Product Row */}
        <div className="flex items-center gap-3.5">
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border border-slate-200/80 shrink-0 shadow-md">
            <img
              src={currentProduct.image}
              alt={currentProduct.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover transition-all duration-500"
            />
            <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/75 text-emerald-400 text-[9px] font-mono font-bold">
              -{savedPct}%
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[10px] font-mono uppercase text-slate-500 truncate">
                {currentProduct.brand} • {currentProduct.sellerName}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 text-[9px] font-mono font-bold shrink-0">
                QR Verified
              </span>
            </div>

            <h3
              className={`font-display font-bold text-sm sm:text-base truncate mt-0.5 ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}
            >
              {currentProduct.name}
            </h3>

            <div className="flex items-baseline gap-2 mt-1 flex-wrap">
              <span className="text-lg sm:text-2xl font-mono font-extrabold text-emerald-600 tabular-nums transition-all duration-300">
                ₹{activeStage.currentPrice.toLocaleString('en-IN')}
              </span>
              <span className="text-xs font-mono text-slate-400 line-through tabular-nums">
                MRP ₹{listPrice.toLocaleString('en-IN')}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 text-[10px] font-mono font-bold">
                Save ₹{Math.max(0, listPrice - activeStage.currentPrice).toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>

        {/* AUTOMATIC SLIDING NEGOTIATION BAR (Live Price Convergence Track) */}
        <div
          className={`p-3.5 sm:p-4 rounded-2xl border space-y-3 ${
            isLight
              ? 'bg-slate-50/90 border-slate-200/90'
              : 'bg-slate-900/90 border-slate-800'
          }`}
        >
          {/* Top Labels: Buyer AI vs Seller AI */}
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="flex items-center gap-1.5 font-bold text-blue-600">
              <Bot className="w-3.5 h-3.5" />
              <span>Buyer AI: ₹{buyerTarget.toLocaleString('en-IN')}</span>
            </span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                activeStageIdx === 3
                  ? 'bg-emerald-500/20 text-emerald-600'
                  : 'bg-blue-500/15 text-blue-600'
              }`}
            >
              {activeStage.label}
            </span>
            <span className="flex items-center gap-1 font-bold text-amber-600">
              <span>Seller: ₹{listPrice.toLocaleString('en-IN')}</span>
              <Store className="w-3.5 h-3.5" />
            </span>
          </div>

          {/* Animated Sliding Bar Track + Moving Price Thumb */}
          <div className="relative pt-6 pb-2">
            {/* Floating Animated Price Pill that slides automatically with the thumb */}
            <div
              className="absolute top-0 -translate-x-1/2 transition-all duration-700 ease-in-out z-10 pointer-events-none"
              style={{ left: `${activeStage.sliderPct}%` }}
            >
              <div
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold shadow-md whitespace-nowrap flex items-center gap-1 ${activeStage.thumbBg}`}
              >
                <span>₹{activeStage.currentPrice.toLocaleString('en-IN')}</span>
                {activeStageIdx === 3 && <CheckCircle2 className="w-3 h-3" />}
              </div>
            </div>

            {/* Horizontal Slider Rail */}
            <div
              className={`relative h-3 w-full rounded-full overflow-hidden border ${
                isLight
                  ? 'bg-slate-200/90 border-slate-300/80'
                  : 'bg-slate-800 border-slate-700'
              }`}
            >
              {/* Animated Gradient Fill */}
              <div
                className={`h-full rounded-full bg-gradient-to-r ${activeStage.barGradient} transition-all duration-700 ease-in-out`}
                style={{ width: `${activeStage.sliderPct}%` }}
              />
            </div>

            {/* Sliding Circular Knob */}
            <div
              className="absolute top-[22px] -translate-x-1/2 w-4 h-4 rounded-full bg-white border-2 border-blue-600 shadow-lg transition-all duration-700 ease-in-out pointer-events-none"
              style={{ left: `${activeStage.sliderPct}%` }}
            />

            {/* Verified Floor Marker Tick */}
            <div
              className="absolute top-[20px] -translate-x-1/2 flex flex-col items-center pointer-events-none"
              style={{ left: '38%' }}
            >
              <div className="w-0.5 h-4 bg-emerald-500" />
              <span className="text-[9px] font-mono text-emerald-600 font-bold mt-0.5">
                QR Floor (₹{floorPrice.toLocaleString('en-IN')})
              </span>
            </div>
          </div>

          {/* Interactive Stage Scrubber Pills */}
          <div className="grid grid-cols-4 gap-1.5 pt-2">
            {stages.map((st, idx) => {
              const isCurrent = idx === activeStageIdx;
              return (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setActiveStageIdx(idx)}
                  className={`py-1.5 px-2 rounded-xl border text-[10px] font-mono font-semibold transition-all cursor-pointer truncate ${
                    isCurrent
                      ? isLight
                        ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                        : 'bg-cyan-500 border-cyan-400 text-slate-950 font-bold'
                      : isLight
                      ? 'bg-white hover:bg-slate-100 border-slate-200 text-slate-600'
                      : 'bg-slate-950 hover:bg-slate-800 border-slate-800 text-slate-400'
                  }`}
                >
                  {st.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Live Agent Message Feed Box */}
        <div
          className={`p-3 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
            activeStageIdx === 3
              ? isLight
                ? 'bg-emerald-50/90 border-emerald-300 text-slate-900'
                : 'bg-emerald-950/30 border-emerald-500/40 text-white'
              : isLight
              ? 'bg-blue-50/70 border-blue-200 text-slate-800'
              : 'bg-slate-900/90 border-slate-800 text-slate-100'
          }`}
        >
          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-mono font-extrabold uppercase ${activeStage.accentColor}`}>
                {activeStage.roundTag}
              </span>
            </div>
            <p
              className={`text-xs leading-relaxed ${
                isLight ? 'text-slate-700' : 'text-slate-200'
              }`}
            >
              {activeStage.message}
            </p>
          </div>

          <button
            type="button"
            onClick={() => onSelectProduct?.(currentProduct)}
            className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-display font-bold text-xs flex items-center gap-1 shrink-0 cursor-pointer shadow-sm transition-colors self-center"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Negotiate</span>
          </button>
        </div>

        {/* Bottom Cryptographic Lock Strip */}
        <div
          className={`pt-2 border-t flex items-center justify-between gap-2 text-[11px] font-mono ${
            isLight ? 'border-slate-200 text-slate-500' : 'border-slate-800 text-slate-400'
          }`}
        >
          <span className="flex items-center gap-1.5 truncate">
            <Lock className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span className="truncate">Auto-Sliding Live Preview • Hover to Pause</span>
          </span>
          <span className="text-emerald-600 font-bold shrink-0">QR Floor Locked ✓</span>
        </div>
      </div>
    </div>
  );
};

export const LandingHero: React.FC<LandingHeroProps> = ({
  onStartNegotiating,
  onLaunchDemo,
  onExploreMarketplace,
  onQuickGoogleSearch,
  recentSearches = [],
  onSelectProductForNegotiation,
  currentThemeId = 'pure-white',
}) => {
  const [heroSearchInput, setHeroSearchInput] = useState('');
  const [isQuickStartOpen, setIsQuickStartOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const theme = THEMES[currentThemeId] || THEMES['pure-white'];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setIsQuickStartOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleHeroSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsQuickStartOpen(false);
    if (heroSearchInput.trim()) {
      onQuickGoogleSearch(heroSearchInput.trim());
    } else {
      onExploreMarketplace();
    }
  };

  const handleSelectTrendingPreset = (preset: TrendingSearchPreset) => {
    setIsQuickStartOpen(false);
    onQuickGoogleSearch(preset.query);
  };

  const handleSelectCategoryPreset = (catPreset: PopularCategoryPreset) => {
    setIsQuickStartOpen(false);
    onQuickGoogleSearch(catPreset.sampleQuery);
  };

  const handleSelectMapsPreset = (mapsPreset: MapsStorePreset) => {
    setIsQuickStartOpen(false);
    onQuickGoogleSearch(mapsPreset.mapsQuery);
  };

  return (
    <div className="space-y-14 sm:space-y-20 pb-10">
      {/* 1. CINEMATIC 3D HERO SECTION (Responsive on both Desktop & Mobile) */}
      <section className="relative pt-2 sm:pt-4 lg:py-8">
        {/* Interactive 3D Particle & Ring Canvas */}
        <div className="absolute inset-0 -z-10 overflow-hidden rounded-3xl pointer-events-none opacity-65">
          <CyberScene3D
            intensity="ambient"
            interactive={true}
            particleColors={theme.particleColors}
            ringColors={theme.ringColors}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-6 items-center">
          {/* Left Column: Headline, Search & Primary CTAs */}
          <div className="lg:col-span-7 space-y-5 sm:space-y-6 text-left">
            <div
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-[11px] sm:text-xs font-mono font-semibold ${
                theme.isLight
                  ? 'bg-blue-50 border-blue-200 text-blue-700'
                  : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span>Autonomous Multi-Agent Bargaining Engine</span>
            </div>

            <h1
              className={`font-display font-extrabold text-3xl sm:text-5xl xl:text-[3.35rem] tracking-tight leading-[1.1] ${
                theme.isLight ? 'text-slate-900' : 'text-white'
              }`}
            >
              Never Pay Retail Price.{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-500">
                Your AI Negotiates
              </span>{' '}
              With Seller AI Live.
            </h1>

            <p
              className={`text-sm sm:text-base lg:text-lg max-w-2xl leading-relaxed ${
                theme.isLight ? 'text-slate-600' : 'text-slate-300'
              }`}
            >
              DealMate pairs your personal{' '}
              <strong className={theme.isLight ? 'text-slate-900' : 'text-white'}>
                Buyer AI
              </strong>{' '}
              against verified{' '}
              <strong className={theme.isLight ? 'text-slate-900' : 'text-white'}>
                Shop Owner Seller AIs
              </strong>{' '}
              and benchmarks live prices across Amazon.in, Flipkart, Croma & local stores in
              seconds.
            </p>

            {/* Live Search Box + QuickStart Dropdown */}
            <div ref={searchContainerRef} className="relative max-w-2xl">
              <form onSubmit={handleHeroSearchSubmit} className="space-y-2.5">
                <div
                  className={`p-1.5 sm:p-2 rounded-2xl border shadow-xl transition-all flex flex-col sm:flex-row items-stretch sm:items-center gap-2 ${
                    theme.isLight
                      ? 'bg-white border-slate-300 focus-within:border-blue-600 shadow-slate-200/70'
                      : 'bg-[#0B101D] border-slate-700 focus-within:border-cyan-400 shadow-black/50'
                  }`}
                >
                  <div className="flex items-center gap-2.5 flex-1 px-2.5 py-1.5">
                    <Search className="w-4 h-4 text-blue-500 shrink-0" />
                    <input
                      type="text"
                      value={heroSearchInput}
                      onFocus={() => setIsQuickStartOpen(true)}
                      onChange={(e) => setHeroSearchInput(e.target.value)}
                      placeholder="Search any product & budget (e.g., 'Sony earbuds under ₹2,500')..."
                      className={`w-full bg-transparent text-xs sm:text-sm focus:outline-none ${
                        theme.isLight
                          ? 'text-slate-900 placeholder-slate-400'
                          : 'text-white placeholder-slate-400'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setIsQuickStartOpen((prev) => !prev)}
                      className={`hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-medium cursor-pointer shrink-0 ${
                        theme.isLight
                          ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'
                          : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300'
                      }`}
                    >
                      <span>Trending</span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform ${
                          isQuickStartOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                  </div>

                  <button
                    type="submit"
                    className="px-5 py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-display font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shrink-0 shadow-md"
                  >
                    <Globe className="w-4 h-4" />
                    <span>Search Live Web</span>
                  </button>
                </div>

                {/* Popular Quick Search Pills */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider font-semibold">
                    Popular:
                  </span>
                  {HERO_QUICK_SEARCHES.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => onQuickGoogleSearch(q)}
                      className={`px-3 py-1 rounded-full border text-[11px] font-medium transition-colors cursor-pointer ${
                        theme.isLight
                          ? 'bg-slate-100 hover:bg-blue-50 border-slate-300 text-slate-800 font-semibold hover:text-blue-700 shadow-xs'
                          : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300 hover:text-white'
                      }`}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </form>

              <SearchQuickStartDropdown
                isOpen={isQuickStartOpen}
                onClose={() => setIsQuickStartOpen(false)}
                onSelectTrendingSearch={handleSelectTrendingPreset}
                onSelectCategoryPreset={handleSelectCategoryPreset}
                onSelectMapsPreset={handleSelectMapsPreset}
                recentSearches={recentSearches}
                onSelectRecentSearch={(q) => {
                  setIsQuickStartOpen(false);
                  onQuickGoogleSearch(q);
                }}
                isLightTheme={theme.isLight}
              />
            </div>

            {/* Primary CTA Buttons */}
            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => {
                  soundEffects.playBlip();
                  onStartNegotiating();
                }}
                className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-display font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 cursor-pointer transition-all"
              >
                <Zap className="w-4 h-4" />
                <span>Start Negotiating</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  soundEffects.playBlip();
                  onLaunchDemo();
                }}
                className={`px-5 py-3.5 rounded-2xl border font-display font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition-all ${
                  theme.isLight
                    ? 'bg-emerald-50 hover:bg-emerald-100/80 border-emerald-300 text-emerald-800'
                    : 'bg-emerald-500/15 hover:bg-emerald-500/25 border-emerald-500/30 text-emerald-300'
                }`}
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Try 1-Click Earbuds Demo</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  soundEffects.playBlip();
                  onExploreMarketplace();
                }}
                className={`px-5 py-3.5 rounded-2xl border font-display font-medium text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition-all ${
                  theme.isLight
                    ? 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 shadow-xs'
                    : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-200'
                }`}
              >
                <Sparkles className="w-4 h-4 text-blue-500" />
                <span>Explore Marketplace</span>
              </button>
            </div>

            {/* Key Platform KPIs */}
            <div
              className={`grid grid-cols-3 gap-4 pt-4 border-t max-w-lg ${
                theme.isLight ? 'border-slate-200' : 'border-slate-800'
              }`}
            >
              <div>
                <div
                  className={`font-mono font-extrabold text-lg sm:text-2xl ${
                    theme.isLight ? 'text-slate-900' : 'text-white'
                  }`}
                >
                  ₹1,240
                </div>
                <div className="text-[11px] text-slate-500">Avg. Deal Savings</div>
              </div>
              <div>
                <div className="font-mono font-extrabold text-lg sm:text-2xl text-blue-600">
                  8.4 Sec
                </div>
                <div className="text-[11px] text-slate-500">Multi-Round Settlement</div>
              </div>
              <div>
                <div className="font-mono font-extrabold text-lg sm:text-2xl text-emerald-600">
                  100% QR
                </div>
                <div className="text-[11px] text-slate-500">Store Floor Verified</div>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive 3D Showcase with Automatic Sliding Negotiation Bar */}
          <div className="lg:col-span-5">
            <Hero3DVisual
              isLight={theme.isLight}
              primaryAccentHex={theme.primaryAccentHex}
              onSelectProduct={(prod) =>
                onSelectProductForNegotiation
                  ? onSelectProductForNegotiation(prod)
                  : onStartNegotiating()
              }
            />
          </div>
        </div>
      </section>

      {/* 2. CORE CAPABILITIES: AI DISCOVERY & AI NEGOTIATOR FEATURES */}
      <section
        className={`rounded-3xl border p-5 sm:p-8 space-y-6 shadow-xl ${
          theme.isLight
            ? 'bg-white border-slate-200 shadow-slate-200/60'
            : 'bg-[#0B101D] border-slate-800 shadow-black/50'
        }`}
      >
        <div
          className={`flex flex-col md:flex-row md:items-end justify-between gap-4 border-b pb-5 ${
            theme.isLight ? 'border-slate-200' : 'border-slate-800'
          }`}
        >
          <div className="space-y-1">
            <span className="text-xs font-mono uppercase tracking-wider text-blue-600 font-bold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Core Platform Capabilities</span>
            </span>
            <h2
              className={`font-display font-bold text-xl sm:text-3xl ${
                theme.isLight ? 'text-slate-900' : 'text-white'
              }`}
            >
              AI Negotiator & AI Deal Analyzer
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md">
            Explore DealMate's end-to-end intelligence: autonomously negotiate prices with seller agents, then independently verify quality, seller trust, warranties, and risks before buying.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Feature Card 1: AI Discovery Features */}
          <div
            className={`rounded-2xl border p-5 sm:p-6 flex flex-col justify-between space-y-5 ${
              theme.isLight
                ? 'bg-slate-50/70 border-slate-200/90'
                : 'bg-[#070B14] border-slate-800'
            }`}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="px-3 py-1 rounded-xl bg-blue-500/10 border border-blue-500/25 text-blue-600 text-xs font-mono font-bold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>01 • AI Product Discovery Features</span>
                </span>
                <span className="text-[11px] font-mono text-slate-500">
                  Search, Grounding & Live Detailing
                </span>
              </div>

              <div>
                <h3
                  className={`font-display font-bold text-lg sm:text-xl ${
                    theme.isLight ? 'text-slate-900' : 'text-white'
                  }`}
                >
                  Intelligent Discovery & Multi-Retailer Grounding
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Comprehensive multi-retailer search, live price benchmarking, and detailed product comparisons.
                </p>
              </div>

              <ul
                className={`space-y-3 text-xs sm:text-sm ${
                  theme.isLight ? 'text-slate-700' : 'text-slate-300'
                }`}
              >
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                  <span>
                    <strong className={theme.isLight ? 'text-slate-900 font-semibold' : 'text-white'}>
                      Live Google Search & Maps Grounding:
                    </strong>{' '}
                    Benchmarks live prices across Amazon.in, Flipkart, Croma, and nearby physical retail showrooms.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                  <span>
                    <strong className={theme.isLight ? 'text-slate-900 font-semibold' : 'text-white'}>
                      Live Product Detailing Drawer:
                    </strong>{' '}
                    Click any product to inspect verified technical specs, customer reviews, seller warranties, and real-time stock levels.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                  <span>
                    <strong className={theme.isLight ? 'text-slate-900 font-semibold' : 'text-white'}>
                      Budget-First Smart Categorization:
                    </strong>{' '}
                    Instantly filters search results into Within Budget items, DealMate Negotiable Inventory, and External Marketplaces.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                  <span>
                    <strong className={theme.isLight ? 'text-slate-900 font-semibold' : 'text-white'}>
                      Voice-Powered Natural Search:
                    </strong>{' '}
                    Speak naturally using AI voice input to find products with specific price ceilings and features.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                  <span>
                    <strong className={theme.isLight ? 'text-slate-900 font-semibold' : 'text-white'}>
                      Side-by-Side Product Comparison:
                    </strong>{' '}
                    Compare specifications, list prices, and potential dealer savings across up to 4 items simultaneously.
                  </span>
                </li>
              </ul>

              {/* Feature Tags */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                {['Live Search Grounding', 'Maps Integration', 'Spec Inspector', 'Voice Queries', 'Compare Matrix'].map((tag) => (
                  <span
                    key={tag}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-medium ${
                      theme.isLight
                        ? 'bg-blue-50 border border-blue-200 text-blue-700'
                        : 'bg-blue-500/10 border border-blue-500/20 text-blue-300'
                    }`}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={onExploreMarketplace}
              className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-display font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-sm"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Explore AI Deal Analyzer</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Feature Card 2: AI Negotiator Features */}
          <div
            className={`rounded-2xl border p-5 sm:p-6 flex flex-col justify-between space-y-5 ${
              theme.isLight
                ? 'bg-slate-50/70 border-slate-200/90'
                : 'bg-[#070B14] border-slate-800'
            }`}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 text-xs font-mono font-bold flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" />
                  <span>02 • AI-to-AI Negotiator Features</span>
                </span>
                <span className="text-[11px] font-mono text-slate-500">
                  Multi-Agent Bargaining & Price Lock
                </span>
              </div>

              <div>
                <h3
                  className={`font-display font-bold text-lg sm:text-xl ${
                    theme.isLight ? 'text-slate-900' : 'text-white'
                  }`}
                >
                  Autonomous Multi-Agent Bargaining & Token Lock
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Real-time autonomous concessions, merchant floor price protection, and cryptographic deal lock.
                </p>
              </div>

              <ul
                className={`space-y-3 text-xs sm:text-sm ${
                  theme.isLight ? 'text-slate-700' : 'text-slate-300'
                }`}
              >
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>
                    <strong className={theme.isLight ? 'text-slate-900 font-semibold' : 'text-white'}>
                      Coordinated 3-Agent Pipeline:
                    </strong>{' '}
                    Preference Agent parses your intent, Deal Hunter searches candidates, and Negotiator AI bargains live.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>
                    <strong className={theme.isLight ? 'text-slate-900 font-semibold' : 'text-white'}>
                      Dynamic Multi-Round Counter Bids:
                    </strong>{' '}
                    Executes fast, iterative counter-offers against seller AI with transparent conversation transcripts.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>
                    <strong className={theme.isLight ? 'text-slate-900 font-semibold' : 'text-white'}>
                      Merchant Floor Protection:
                    </strong>{' '}
                    Autonomous counter-offers are mathematically clamped to the verified shop owner discount floor.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>
                    <strong className={theme.isLight ? 'text-slate-900 font-semibold' : 'text-white'}>
                      Cryptographic Deal Lock Token:
                    </strong>{' '}
                    Freezes your agreed price into an encrypted digital token with an active countdown timer.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>
                    <strong className={theme.isLight ? 'text-slate-900 font-semibold' : 'text-white'}>
                      In-Store Contactless QR Pass:
                    </strong>{' '}
                    Generates a verifiable QR code to redeem your negotiated price in person at physical partner stores.
                  </span>
                </li>
              </ul>

              {/* Feature Tags */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                {['Agent vs Agent', 'QR Pass', 'Floor Clamping', 'Cryptographic Token', 'Express Checkout'].map((tag) => (
                  <span
                    key={tag}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-medium ${
                      theme.isLight
                        ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                        : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'
                    }`}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={onStartNegotiating}
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-display font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-sm"
            >
              <Zap className="w-4 h-4" />
              <span>Start AI Negotiation</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* 3. THE 4-STEP AUTONOMOUS PROTOCOL (3D Interactive Stage) */}
      <Pipeline3DStage
        onStartNegotiation={onStartNegotiating}
        currentThemeId={currentThemeId}
      />

      {/* 4. FEATURED STORE OWNER NEGOTIABLE DEALS */}
      <section className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-emerald-600 font-bold">
              QR-Verified Merchant Inventory
            </span>
            <h2
              className={`font-display font-bold text-xl sm:text-2xl ${
                theme.isLight ? 'text-slate-900' : 'text-white'
              }`}
            >
              Live Negotiable Deals
            </h2>
          </div>
          <button
            type="button"
            onClick={onExploreMarketplace}
            className="text-xs font-mono text-blue-600 hover:underline flex items-center gap-1 cursor-pointer self-start sm:self-auto"
          >
            <span>Explore Full Catalog</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {PRODUCTS.slice(0, 4).map((prod) => (
            <div
              key={prod.id}
              className={`rounded-2xl border p-4 flex flex-col justify-between gap-3 transition-all hover:-translate-y-0.5 ${
                theme.isLight
                  ? 'bg-white border-slate-200 hover:border-blue-300 shadow-xs'
                  : 'bg-[#0B101D] border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="space-y-3">
                <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-slate-100 border border-slate-200/60">
                  <img
                    src={prod.image}
                    alt={prod.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-emerald-950/90 text-emerald-300 text-[10px] font-mono font-semibold">
                    Up to {prod.maxDiscountPercent}% Negotiable
                  </span>
                </div>
                <div>
                  <div className="text-[10px] font-mono uppercase text-slate-400 truncate">
                    {prod.brand} • {prod.sellerName}
                  </div>
                  <h3
                    className={`font-display font-bold text-sm line-clamp-1 mt-0.5 ${
                      theme.isLight ? 'text-slate-900' : 'text-white'
                    }`}
                  >
                    {prod.name}
                  </h3>
                </div>
              </div>

              <div
                className={`pt-3 border-t flex items-center justify-between gap-2 ${
                  theme.isLight ? 'border-slate-100' : 'border-slate-800'
                }`}
              >
                <div>
                  <div
                    className={`text-sm font-mono font-extrabold ${
                      theme.isLight ? 'text-slate-900' : 'text-white'
                    }`}
                  >
                    ₹{prod.listPrice.toLocaleString('en-IN')}
                  </div>
                  <div className="text-[10px] font-mono text-emerald-600 font-semibold">
                    Floor: ₹{prod.minAcceptablePrice.toLocaleString('en-IN')}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    onSelectProductForNegotiation
                      ? onSelectProductForNegotiation(prod)
                      : onStartNegotiating()
                  }
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Zap className="w-3 h-3" />
                  <span>Negotiate</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
