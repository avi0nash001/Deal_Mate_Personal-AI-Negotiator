import React, { useState, useEffect } from 'react';
import {
  Zap,
  Sparkles,
  Ticket,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingDown,
  RefreshCw,
  ShoppingBag,
  Clock,
  History,
  ShieldCheck,
  Check,
  ExternalLink,
  Flame,
  Layers,
  ChevronRight,
  Award,
  Wallet,
} from 'lucide-react';
import { Product } from '../../types';
import { Coupon, DealOptimizerResult, SavedOptimizedDeal } from '../../types/coupon';
import { CouponIntelligenceService } from '../../services/couponIntelligenceService';
import { DealOptimizerService } from '../../services/dealOptimizerService';
import { DealHistoryService } from '../../services/dealHistoryService';
import { PriceSparkline } from '../common/PriceSparkline';
import { ThemeId, THEMES } from '../../types/theme';

interface DealOptimizerViewProps {
  initialProduct?: Product | null;
  initialNegotiatedPrice?: number;
  initialBudget?: number;
  onSelectProductForDiscovery?: () => void;
  onCheckoutDeal?: (product: Product, finalPrice: number) => void;
  currentThemeId?: ThemeId;
}

export const DealOptimizerView: React.FC<DealOptimizerViewProps> = ({
  initialProduct,
  initialNegotiatedPrice,
  initialBudget,
  onSelectProductForDiscovery,
  onCheckoutDeal,
  currentThemeId = 'pure-white',
}) => {
  const currentTheme = THEMES[currentThemeId] || THEMES['pure-white'];

  // Current active product being optimized
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(initialProduct || null);
  const [negotiatedPrice, setNegotiatedPrice] = useState<number | undefined>(initialNegotiatedPrice);
  const [userBudget, setUserBudget] = useState<number>(initialBudget || (initialProduct?.listPrice ? Math.round(initialProduct.listPrice * 0.9) : 2500));

  // Mode & Tabs
  const [activeTab, setActiveTab] = useState<'optimizer' | 'savings' | 'history'>('optimizer');
  const [isLiveMode, setIsLiveMode] = useState<boolean>(true);
  const [isSearchingOffers, setIsSearchingOffers] = useState<boolean>(false);
  const [activeSavingsCategory, setActiveSavingsCategory] = useState<'all' | 'coupon' | 'payment' | 'cashback' | 'seller'>('all');

  // Search and optimization state
  const [retrievedOffers, setRetrievedOffers] = useState<Coupon[]>([]);
  const [sourcesQueried, setSourcesQueried] = useState<string[]>([]);
  const [lastCheckedText, setLastCheckedText] = useState<string>('Just now');
  const [optimizationResult, setOptimizationResult] = useState<DealOptimizerResult | null>(null);
  const [savedDeals, setSavedDeals] = useState<SavedOptimizedDeal[]>(() => DealHistoryService.getHistory());

  // Run real-time coupon search and deal optimization
  const runOptimization = async (prod: Product, negPrice?: number, budget?: number) => {
    setIsSearchingOffers(true);

    try {
      const searchRes = await CouponIntelligenceService.searchLiveCoupons(prod, {
        userBudget: budget || userBudget,
        isNewUser: false,
        paymentPreference: 'HDFC / Credit Card / UPI',
        isLiveMode,
      });

      setRetrievedOffers(searchRes.offers);
      setSourcesQueried(searchRes.sourcesQueried);
      setLastCheckedText(searchRes.searchTimestamp);

      // Run optimization engine
      const opt = DealOptimizerService.optimizeDeal({
        product: prod,
        originalPrice: prod.listPrice,
        negotiatedPrice: negPrice !== undefined ? negPrice : Math.round(prod.listPrice * 0.9),
        userBudget: budget || userBudget,
        offers: searchRes.offers,
        isNewUser: false,
        paymentPreference: 'HDFC / Credit Card / UPI',
        isLiveMode,
      });

      setOptimizationResult(opt);

      // Record in deal history
      const saved = DealHistoryService.recordDeal(opt);
      setSavedDeals((prev) => [saved, ...prev.filter((d) => d.productId !== prod.id)].slice(0, 15));
    } catch {
      // Fallback
    } finally {
      setIsSearchingOffers(false);
    }
  };

  useEffect(() => {
    if (selectedProduct) {
      runOptimization(selectedProduct, negotiatedPrice, userBudget);
    }
  }, [selectedProduct?.id, isLiveMode]);

  // Handle 1-Click "Deal Hunter" autonomous execution
  const handleRunDealHunter = () => {
    if (!selectedProduct) return;
    runOptimization(selectedProduct, negotiatedPrice, userBudget);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner & Core Positioning Statement */}
      <div
        className="rounded-3xl border p-6 sm:p-8 relative overflow-hidden transition-all shadow-sm"
        style={{
          backgroundColor: 'var(--surface)',
          borderColor: 'var(--border)',
        }}
      >
        <div className="max-w-3xl space-y-3 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold border"
            style={{
              backgroundColor: 'rgba(37, 99, 235, 0.08)',
              borderColor: 'rgba(37, 99, 235, 0.25)',
              color: 'var(--accent)',
            }}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Autonomous AI Deal-Making Agent</span>
          </div>

          <h1 className="font-display font-extrabold text-2xl sm:text-3xl lg:text-4xl tracking-tight leading-tight"
            style={{ color: 'var(--text-primary)' }}
          >
            DISCOVER WHAT YOU WANT.<br />
            NEGOTIATE WHAT YOU CAN.<br />
            <span style={{ color: 'var(--accent)' }}>OPTIMIZE WHAT YOU PAY.</span>
          </h1>

          <p className="text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            <strong>DealMate</strong> combines AI negotiation concessions, live merchant promo codes, bank payment discounts, and logistics waivers into one unified deal calculation to construct your lowest achievable checkout price.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2 text-xs font-semibold">
            <span className="font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> No Fabricated Codes
            </span>
            <span className="text-slate-400">•</span>
            <span className="font-mono text-blue-600 dark:text-blue-400 flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> Real-Time Offer Verification
            </span>
            <span className="text-slate-400">•</span>
            <span className="font-mono text-purple-600 dark:text-purple-400 flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> Automated Stacking Rules
            </span>
          </div>
        </div>

        {/* Live Mode vs Demo Mode Toggle */}
        <div className="mt-4 sm:mt-0 sm:absolute sm:top-6 sm:right-6 flex items-center gap-2 text-xs font-mono">
          <span className="text-slate-400">Mode:</span>
          <button
            type="button"
            onClick={() => setIsLiveMode(!isLiveMode)}
            className="px-2.5 py-1 rounded-lg border text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
            style={{
              backgroundColor: isLiveMode ? 'rgba(22, 163, 74, 0.12)' : 'var(--surface-elevated)',
              borderColor: isLiveMode ? 'rgba(22, 163, 74, 0.4)' : 'var(--border)',
              color: isLiveMode ? 'var(--success)' : 'var(--text-secondary)',
            }}
          >
            <span className={`w-2 h-2 rounded-full ${isLiveMode ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
            <span>{isLiveMode ? 'LIVE MODE (Web Feeds)' : 'DEMO MODE (Preset)'}</span>
          </button>
        </div>
      </div>

      {/* 2. Unified Shopping Journey Progress Bar (Section 1) */}
      <div
        className="rounded-2xl border p-3.5 sm:p-4 overflow-x-auto shadow-2xs"
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <div className="flex items-center justify-between min-w-[700px] gap-2 text-xs font-mono">
          {[
            { label: 'DISCOVER', icon: '🔎', done: true },
            { label: 'COMPARE', icon: '⚖️', done: true },
            { label: 'SELECT', icon: '🎯', done: Boolean(selectedProduct) },
            { label: 'NEGOTIATE', icon: '🤝', done: Boolean(negotiatedPrice) },
            { label: 'LIVE COUPONS', icon: '🎟', done: Boolean(retrievedOffers.length > 0) },
            { label: 'OPTIMIZE DEAL', icon: '⚡', active: true },
            { label: 'FINAL DEAL', icon: '🏆', done: Boolean(optimizationResult) },
          ].map((step, idx) => (
            <React.Fragment key={idx}>
              <div
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl font-semibold transition-all ${
                  step.active
                    ? 'bg-blue-600 text-white shadow-xs'
                    : step.done
                    ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
                    : 'text-slate-400 bg-slate-100 dark:bg-slate-800/40'
                }`}
              >
                <span>{step.icon}</span>
                <span className="tracking-tight">{step.label}</span>
              </div>
              {idx < 6 && <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-700 shrink-0" />}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Navigation Tabs: Deal Optimizer vs Available Savings vs Deal History */}
      <div className="flex items-center justify-between gap-3 border-b pb-3 flex-wrap" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('optimizer')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer transition-all border ${
              activeTab === 'optimizer'
                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                : 'border-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Deal Optimizer</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('savings')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer transition-all border ${
              activeTab === 'savings'
                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                : 'border-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Ticket className="w-4 h-4" />
            <span>Available Savings ({retrievedOffers.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer transition-all border ${
              activeTab === 'history'
                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                : 'border-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Deal History ({savedDeals.length})</span>
          </button>
        </div>

        {/* 1-Click Deal Hunter Button (Section 22) */}
        {selectedProduct && (
          <button
            type="button"
            onClick={handleRunDealHunter}
            disabled={isSearchingOffers}
            className="px-4 py-2 rounded-xl bg-linear-to-r from-amber-500 to-rose-600 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs hover:opacity-95 disabled:opacity-50 transition-all"
          >
            {isSearchingOffers ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Scanning Live Offers...</span>
              </>
            ) : (
              <>
                <Flame className="w-4 h-4 fill-current" />
                <span>🔥 Run Deal Hunter (Re-Optimize)</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Main Tab 1: Deal Optimizer View */}
      {activeTab === 'optimizer' && (
        <div className="space-y-6">
          {!selectedProduct ? (
            /* Empty State when no product is currently selected */
            <div
              className="p-10 rounded-3xl border text-center space-y-4 shadow-sm"
              style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
            >
              <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center mx-auto">
                <ShoppingBag className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="font-display font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
                  No Product Selected for Deal Optimization
                </h3>
                <p className="text-xs sm:text-sm max-w-md mx-auto" style={{ color: 'var(--text-muted)' }}>
                  Pick a product from AI Deal Analyzer or AI Negotiator, and DealMate will automatically scan live merchant coupons, bank offers, and seller concessions to find your best deal.
                </p>
              </div>
              {onSelectProductForDiscovery && (
                <button
                  type="button"
                  onClick={onSelectProductForDiscovery}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-xs inline-flex items-center gap-2 cursor-pointer shadow-sm hover:bg-blue-500 transition-colors"
                >
                  <span>Explore Products in Discovery</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Product & Verification Context (4 cols) */}
              <div className="lg:col-span-5 space-y-5">
                {/* Product Summary Card with Sparkline Chart */}
                <div
                  className="p-4 sm:p-5 rounded-3xl border space-y-4 shadow-2xs"
                  style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
                >
                  <div className="flex items-start gap-3.5">
                    <img
                      src={selectedProduct.image}
                      alt={selectedProduct.name}
                      className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover shrink-0 border"
                      style={{ borderColor: 'var(--border)' }}
                    />
                    <div className="space-y-1 min-w-0 flex-1">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {selectedProduct.brand} • {selectedProduct.category}
                      </span>
                      <h3 className="font-display font-bold text-sm sm:text-base leading-snug line-clamp-2" style={{ color: 'var(--text-primary)' }}>
                        {selectedProduct.name}
                      </h3>
                      <div className="text-xs text-slate-500">
                        Seller: <strong style={{ color: 'var(--text-primary)' }}>{selectedProduct.sellerName}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Price Sparkline Chart (Visualizes 30-day price trend) */}
                  <div className="pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
                    <PriceSparkline product={selectedProduct} height={32} showLabels={true} />
                  </div>

                  {/* Negotiation Potential Indicator (Section 16) */}
                  {optimizationResult && (
                    <div
                      className="p-3 rounded-2xl border text-xs space-y-1"
                      style={{
                        backgroundColor: 'var(--surface-elevated)',
                        borderColor: 'var(--border)',
                      }}
                    >
                      <div className="flex items-center justify-between font-mono font-bold">
                        <span className="text-[11px] text-slate-400">NEGOTIATION POTENTIAL:</span>
                        <span
                          className={`flex items-center gap-1 ${
                            optimizationResult.negotiationPotential === 'high'
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : optimizationResult.negotiationPotential === 'medium'
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-slate-500'
                          }`}
                        >
                          {optimizationResult.negotiationPotential === 'high' ? '🟢 HIGH' : optimizationResult.negotiationPotential === 'medium' ? '🟡 MEDIUM' : '🔴 LOW'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        {optimizationResult.negotiationPotentialReason}
                      </p>
                    </div>
                  )}

                  {/* Real-Time Offer Verification Status Block (Section 20) */}
                  <div
                    className="p-3.5 rounded-2xl border space-y-2 text-xs"
                    style={{
                      backgroundColor: 'rgba(37, 99, 235, 0.04)',
                      borderColor: 'rgba(37, 99, 235, 0.2)',
                    }}
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="font-mono font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4" />
                        <span>Live Verification Status</span>
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>Last checked: {lastCheckedText}</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center font-mono text-xs pt-1">
                      <div className="p-1.5 rounded-lg bg-white/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
                        <div className="text-[10px] text-slate-400">Found</div>
                        <div className="font-bold text-slate-900 dark:text-white">{retrievedOffers.length}</div>
                      </div>
                      <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                        <div className="text-[10px]">Applicable</div>
                        <div className="font-bold">{optimizationResult?.availableOffers.length || 0}</div>
                      </div>
                      <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400">
                        <div className="text-[10px]">Excluded</div>
                        <div className="font-bold">{optimizationResult?.excludedOffers.length || 0}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stacking Rule Decisions (Section 13) */}
                {optimizationResult && optimizationResult.excludedOffers.length > 0 && (
                  <div
                    className="p-4 rounded-2xl border space-y-2 text-xs"
                    style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
                  >
                    <div className="font-mono font-bold text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Stacking & Eligibility Decisions</span>
                    </div>
                    <div className="space-y-1.5 text-[11px] text-slate-500">
                      {optimizationResult.excludedOffers.slice(0, 3).map((ex, idx) => (
                        <div key={idx} className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                          <strong className="text-slate-800 dark:text-slate-200">{ex.offer.code}:</strong> {ex.reason}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Best Deal Card & Deal Path (7 cols) */}
              <div className="lg:col-span-7 space-y-5">
                {optimizationResult && (
                  <>
                    {/* 🏆 BEST DEAL CARD (Section 17) */}
                    <div
                      className="p-5 sm:p-6 rounded-3xl border space-y-5 shadow-md relative overflow-hidden"
                      style={{
                        backgroundColor: 'var(--surface)',
                        borderColor: 'rgba(22, 163, 74, 0.4)',
                        boxShadow: '0 4px 24px -6px rgba(22, 163, 74, 0.12)',
                      }}
                    >
                      {/* Top Header & Deal Score Badge */}
                      <div className="flex items-center justify-between gap-3 flex-wrap pb-3 border-b" style={{ borderColor: 'var(--border)' }}>
                        <div className="space-y-0.5">
                          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <Award className="w-4 h-4" />
                            <span>🏆 BEST ACHIVABLE DEAL FOUND</span>
                          </span>
                          <h2 className="font-display font-bold text-lg sm:text-xl" style={{ color: 'var(--text-primary)' }}>
                            {selectedProduct.name}
                          </h2>
                        </div>

                        {/* Deal Score Badge (Section 15) */}
                        <div className="text-right">
                          <div className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-linear-to-r from-emerald-500 to-teal-600 text-white font-mono font-extrabold text-sm shadow-xs">
                            <span>Score: {optimizationResult.dealScore}/100</span>
                          </div>
                          <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                            {optimizationResult.dealScoreTierLabel}
                          </div>
                        </div>
                      </div>

                      {/* Price Breakdown Matrix */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                          <div className="text-[10px] text-slate-400">Market Price</div>
                          <div className="font-bold line-through text-slate-500">
                            ₹{optimizationResult.originalPrice.toLocaleString('en-IN')}
                          </div>
                        </div>

                        <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300">
                          <div className="text-[10px]">AI Negotiated</div>
                          <div className="font-bold">
                            ₹{optimizationResult.negotiatedPrice.toLocaleString('en-IN')}
                          </div>
                        </div>

                        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300">
                          <div className="text-[10px]">Live Coupon</div>
                          <div className="font-bold">
                            {optimizationResult.appliedCoupon ? `-₹${optimizationResult.couponSavings}` : 'None'}
                          </div>
                        </div>

                        <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300">
                          <div className="text-[10px]">Bank / Card Offer</div>
                          <div className="font-bold">
                            {optimizationResult.appliedPaymentOffer ? `-₹${optimizationResult.paymentSavings}` : 'None'}
                          </div>
                        </div>
                      </div>

                      {/* Final Payable Price & Savings Bar */}
                      <div className="p-4 rounded-2xl bg-linear-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 flex items-center justify-between gap-4 flex-wrap">
                        <div>
                          <div className="text-xs font-mono text-emerald-700 dark:text-emerald-300 font-semibold uppercase">
                            FINAL PAYABLE (PAY NOW)
                          </div>
                          <div className="text-2xl sm:text-3xl font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                            ₹{optimizationResult.finalPayablePrice.toLocaleString('en-IN')}
                          </div>
                          {optimizationResult.cashbackAmount > 0 && (
                            <div className="text-[11px] font-mono text-slate-500">
                              Effective cost after cashback: ₹{optimizationResult.effectiveCostAfterCashback.toLocaleString('en-IN')}
                            </div>
                          )}
                        </div>

                        <div className="text-right space-y-0.5">
                          <div className="text-sm sm:text-base font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                            Saved ₹{optimizationResult.totalSavings.toLocaleString('en-IN')} ({optimizationResult.savingsPercent}%)
                          </div>
                          {optimizationResult.isUnderBudget ? (
                            <span className="inline-flex items-center gap-1 text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>🎯 ₹{optimizationResult.budgetDifference.toLocaleString('en-IN')} Under Budget!</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
                              <span>Closest Achievable (₹{optimizationResult.budgetDifference.toLocaleString('en-IN')} above budget)</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Get This Deal / Buy Button */}
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (onCheckoutDeal) {
                              onCheckoutDeal(selectedProduct, optimizationResult.finalPayablePrice);
                            }
                          }}
                          className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-display font-bold text-sm sm:text-base flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all hover:scale-[1.01]"
                        >
                          <ShoppingBag className="w-4 h-4" />
                          <span>GET THIS DEAL — ₹{optimizationResult.finalPayablePrice.toLocaleString('en-IN')}</span>
                          <ArrowRight className="w-4 h-4 ml-1" />
                        </button>
                      </div>
                    </div>

                    {/* DEAL PATH Progressive Visualization (Section 18) */}
                    <div
                      className="p-5 rounded-3xl border space-y-3.5 shadow-2xs"
                      style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
                    >
                      <div className="flex items-center justify-between text-xs font-mono font-bold">
                        <span className="flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                          <TrendingDown className="w-4 h-4 text-emerald-500" />
                          <span>DEAL PATH CREATION</span>
                        </span>
                        <span className="text-emerald-600 dark:text-emerald-400">
                          Total Discount: ₹{optimizationResult.totalSavings.toLocaleString('en-IN')}
                        </span>
                      </div>

                      <div className="space-y-2">
                        {optimizationResult.dealPath.map((step, sIdx) => (
                          <div
                            key={sIdx}
                            className="p-3 rounded-2xl border flex items-center justify-between gap-3 text-xs transition-all"
                            style={{
                              backgroundColor: sIdx === optimizationResult.dealPath.length - 1 ? 'rgba(22, 163, 74, 0.08)' : 'var(--surface-elevated)',
                              borderColor: sIdx === optimizationResult.dealPath.length - 1 ? 'rgba(22, 163, 74, 0.3)' : 'var(--border)',
                            }}
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="w-6 h-6 rounded-lg bg-slate-200 dark:bg-slate-800 text-[10px] font-mono font-bold flex items-center justify-center shrink-0">
                                {sIdx + 1}
                              </span>
                              <div>
                                <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                                  {step.step}
                                </div>
                                <div className="text-[11px] text-slate-400">
                                  {step.label}
                                </div>
                              </div>
                            </div>

                            <div className="text-right font-mono">
                              {step.amount > 0 && sIdx < optimizationResult.dealPath.length - 1 && (
                                <div className="text-[11px] text-emerald-600 font-bold">
                                  -₹{step.amount.toLocaleString('en-IN')}
                                </div>
                              )}
                              <div className="font-extrabold text-sm" style={{ color: sIdx === optimizationResult.dealPath.length - 1 ? 'var(--success)' : 'var(--text-primary)' }}>
                                ₹{step.runningPrice.toLocaleString('en-IN')}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Final Deal Comparison Matrix (Section 24) */}
                    <div
                      className="p-5 rounded-3xl border space-y-3 shadow-2xs"
                      style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
                    >
                      <h4 className="font-display font-bold text-xs uppercase tracking-wider text-slate-400">
                        Savings Strategy Comparison
                      </h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs font-mono">
                          <thead>
                            <tr className="border-b text-slate-400" style={{ borderColor: 'var(--border)' }}>
                              <th className="py-2 px-2">Strategy</th>
                              <th className="py-2 px-2 text-right">Final Price</th>
                              <th className="py-2 px-2 text-right">Savings</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
                            {optimizationResult.strategiesComparison.map((st, idx) => (
                              <tr
                                key={idx}
                                className={st.isOptimal ? 'bg-emerald-500/10 font-bold text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-300'}
                              >
                                <td className="py-2.5 px-2 flex items-center gap-1.5">
                                  {st.isOptimal && <Sparkles className="w-3.5 h-3.5" />}
                                  <span>{st.strategy}</span>
                                </td>
                                <td className="py-2.5 px-2 text-right">
                                  ₹{st.finalPrice.toLocaleString('en-IN')}
                                </td>
                                <td className="py-2.5 px-2 text-right">
                                  {st.savings > 0 ? `₹${st.savings.toLocaleString('en-IN')}` : '—'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* "Why DealMate Chose This Deal" & AI Explanation (Section 23, 33) */}
                    <div
                      className="p-5 rounded-3xl border space-y-3"
                      style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
                    >
                      <h4 className="font-display font-bold text-xs uppercase tracking-wider text-slate-400">
                        Why DealMate Chose This Deal
                      </h4>
                      <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                        {optimizationResult.whyBestDealReasons.map((r, rIdx) => (
                          <div key={rIdx} className="flex items-start gap-2">
                            <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                            <span>{r}</span>
                          </div>
                        ))}
                      </div>

                      <div className="p-3 rounded-2xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-800/60 text-xs text-blue-900 dark:text-blue-200 leading-relaxed mt-2">
                        <strong>AI Summary: </strong>
                        {optimizationResult.explanationText}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Tab 2: Available Savings Tab (Section 19) */}
      {activeTab === 'savings' && (
        <div className="space-y-4">
          <div className="flex items-center gap-1.5 flex-wrap text-xs font-mono">
            {[
              { id: 'all', label: 'All Offers' },
              { id: 'coupon', label: 'Live Coupons' },
              { id: 'payment', label: 'Payment / Bank Offers' },
              { id: 'cashback', label: 'Cashback' },
              { id: 'seller', label: 'Seller & Shipping' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setActiveSavingsCategory(f.id as any)}
                className={`px-3 py-1.5 rounded-xl font-bold cursor-pointer transition-colors border ${
                  activeSavingsCategory === f.id
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-transparent hover:border-slate-300'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {retrievedOffers
              .filter((o) => {
                if (activeSavingsCategory === 'coupon') return o.stackGroup === 'COUPON';
                if (activeSavingsCategory === 'payment') return o.stackGroup === 'PAYMENT';
                if (activeSavingsCategory === 'cashback') return o.stackGroup === 'CASHBACK';
                if (activeSavingsCategory === 'seller') return o.stackGroup === 'SELLER';
                return true;
              })
              .map((offer) => (
                <div
                  key={offer.id}
                  className="p-4 rounded-2xl border space-y-2.5 relative transition-all"
                  style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono font-bold text-xs tracking-wider border border-emerald-500/20">
                      {offer.code}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold">
                      ✓ {offer.verificationStatus}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-xs sm:text-sm" style={{ color: 'var(--text-primary)' }}>
                      {offer.title}
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {offer.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t flex items-center justify-between text-[11px] font-mono text-slate-400" style={{ borderColor: 'var(--border)' }}>
                    <span>Source: {offer.source}</span>
                    <span>Min Order: ₹{offer.minimumCartValue.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Main Tab 3: Deal History (Section 30) */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-base" style={{ color: 'var(--text-primary)' }}>
              Previously Optimized Deals
            </h3>
            {savedDeals.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  DealHistoryService.clearHistory();
                  setSavedDeals([]);
                }}
                className="text-xs text-rose-500 hover:underline font-mono cursor-pointer"
              >
                Clear History
              </button>
            )}
          </div>

          {savedDeals.length === 0 ? (
            <div className="p-8 rounded-2xl border text-center text-xs text-slate-400">
              No previously saved deals found.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {savedDeals.map((deal) => (
                <div
                  key={deal.id}
                  className="p-4 rounded-2xl border flex items-center justify-between gap-3 shadow-2xs"
                  style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={deal.productImage}
                      alt={deal.productName}
                      className="w-14 h-14 rounded-xl object-cover shrink-0 border"
                      style={{ borderColor: 'var(--border)' }}
                    />
                    <div className="min-w-0 space-y-0.5">
                      <h4 className="font-bold text-xs truncate" style={{ color: 'var(--text-primary)' }}>
                        {deal.productName}
                      </h4>
                      <div className="text-[11px] font-mono text-slate-500">
                        {deal.merchantName} • {deal.date}
                      </div>
                      <div className="text-xs font-mono font-bold text-emerald-600">
                        Final ₹{deal.finalPrice.toLocaleString('en-IN')}{' '}
                        <span className="line-through text-slate-400 font-normal text-[11px]">
                          ₹{deal.originalPrice.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-600 text-xs font-mono font-bold">
                      Saved ₹{deal.totalSavings.toLocaleString('en-IN')}
                    </span>
                    <div className="text-[10px] font-mono text-slate-400 mt-1">
                      Score: {deal.dealScore}/100
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
