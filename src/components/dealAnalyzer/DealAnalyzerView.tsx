import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Zap,
  TrendingDown,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  RefreshCw,
  ShoppingBag,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  Users,
  Search,
  ArrowRight,
  Info,
  Clock,
  Award,
  Layers,
  Store,
  RotateCcw,
  Tag,
  ThumbsUp,
  FileText,
  SlidersHorizontal,
} from 'lucide-react';
import { Product, CollectiveDealPool } from '../../types';
import { ThemeId, THEMES } from '../../types/theme';
import { DealAnalysisReport, DealImprovementOption, DealVerdict } from '../../types/dealAnalyzer';
import { DealAnalyzerEngine } from '../../services/dealAnalyzerEngine';
import { soundEffects } from '../../services/soundEffects';
import { PRODUCTS, INITIAL_COLLECTIVE_POOLS } from '../../data/catalog';
import { CollectiveDealIndicator } from '../common/CollectiveDealIndicator';

interface DealAnalyzerViewProps {
  initialProduct?: Product | null;
  initialNegotiatedPrice?: number;
  initialBudget?: number;
  products?: Product[];
  activeCollectivePools?: CollectiveDealPool[];
  onBuyNow?: (product: Product, finalPrice: number) => void;
  onReNegotiate?: (product: Product, improvementPrompt: string, basePrice: number) => void;
  onBrowseMoreProducts?: () => void;
  currentThemeId?: ThemeId;
}

export const DealAnalyzerView: React.FC<DealAnalyzerViewProps> = ({
  initialProduct,
  initialNegotiatedPrice,
  initialBudget,
  products,
  activeCollectivePools,
  onBuyNow,
  onReNegotiate,
  onBrowseMoreProducts,
  currentThemeId = 'pure-white',
}) => {
  const currentTheme = THEMES[currentThemeId] || THEMES['pure-white'];

  const allProducts = products && products.length > 0 ? products : PRODUCTS;
  const collectivePools = activeCollectivePools || INITIAL_COLLECTIVE_POOLS;

  // Filter state in Deal Analyzer (All, Group Deals, Electronics, Fashion, Local Stores)
  const [dealFilter, setDealFilter] = useState<'all' | 'group_deals' | 'electronics' | 'fashion' | 'local'>('all');

  // Current active product & analysis report state
  const [activeProduct, setActiveProduct] = useState<Product | null>(initialProduct || null);
  const [negotiatedPrice, setNegotiatedPrice] = useState<number | undefined>(initialNegotiatedPrice);
  const [userBudget, setUserBudget] = useState<number>(
    initialBudget || (initialProduct?.listPrice ? Math.round(initialProduct.listPrice * 0.95) : 3000)
  );

  // Active group deal opportunity for currently inspected product
  const activeProductPool = collectivePools.find(
    (pool) =>
      pool.productId === activeProduct?.id ||
      pool.productName.toLowerCase() === activeProduct?.name.toLowerCase()
  );

  // Filtered product list for deal analyzer product switcher
  const filteredProductList = allProducts.filter((p) => {
    if (dealFilter === 'group_deals') {
      return collectivePools.some(
        (pool) =>
          pool.productId === p.id ||
          pool.productName.toLowerCase() === p.name.toLowerCase()
      );
    }
    if (dealFilter === 'local') return p.isLocalStore;
    if (dealFilter === 'electronics') return p.category.toLowerCase().includes('electron');
    if (dealFilter === 'fashion') return p.category.toLowerCase().includes('fashion');
    return true;
  });

  const [analysisReport, setAnalysisReport] = useState<DealAnalysisReport | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [showSourcesModal, setShowSourcesModal] = useState<boolean>(false);
  const [showTrustedOpinionsModal, setShowTrustedOpinionsModal] = useState<boolean>(false);
  const [activeTabSection, setActiveTabSection] = useState<'all' | 'performance' | 'seller' | 'risks' | 'cost'>('all');

  // New opinion submission in trusted circle
  const [newOpinionComment, setNewOpinionComment] = useState<string>('');
  const [newOpinionScore, setNewOpinionScore] = useState<number>(85);

  // Run or refresh analysis
  const executeAnalysis = (prod: Product, negPrice?: number, budget?: number) => {
    setIsRefreshing(true);
    try {
      const report = DealAnalyzerEngine.analyzeDeal(prod, {
        negotiatedPrice: negPrice !== undefined ? negPrice : Math.round(prod.listPrice * 0.88),
        userBudget: budget || userBudget,
        isLiveRefreshed: true,
      });
      setAnalysisReport(report);
      soundEffects.playBlip();
    } catch {
      // fallback
    } finally {
      setTimeout(() => setIsRefreshing(false), 300);
    }
  };

  useEffect(() => {
    if (activeProduct) {
      executeAnalysis(activeProduct, negotiatedPrice, userBudget);
    }
  }, [activeProduct?.id]);

  // Sync props if changed externally
  useEffect(() => {
    if (initialProduct && initialProduct.id !== activeProduct?.id) {
      setActiveProduct(initialProduct);
      setNegotiatedPrice(initialNegotiatedPrice);
      if (initialBudget) setUserBudget(initialBudget);
    }
  }, [initialProduct?.id, initialNegotiatedPrice, initialBudget]);

  const handleApplyImprovement = (option: DealImprovementOption) => {
    if (!activeProduct || !analysisReport) return;
    soundEffects.playBlip();
    if (onReNegotiate) {
      onReNegotiate(
        activeProduct,
        option.negotiatorPrompt,
        analysisReport.negotiatedPrice
      );
    }
  };

  const handleAddTrustedOpinion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOpinionComment.trim() || !analysisReport) return;
    const newOp = {
      id: `op_${Date.now()}`,
      userName: 'You (Reviewer)',
      relation: 'Verified Buyer' as const,
      ratingScore: newOpinionScore,
      comment: newOpinionComment.trim(),
      timestamp: 'Just now',
    };
    const updatedOpinions = [newOp, ...analysisReport.trustedCircleOpinions];
    const newCircleScore = Math.round(
      updatedOpinions.reduce((acc, c) => acc + c.ratingScore, 0) / updatedOpinions.length
    );
    const newFinalConf = Math.round(
      analysisReport.productQualityScore * 0.5 +
        analysisReport.evidenceConfidenceScore * 0.3 +
        newCircleScore * 0.2
    );

    setAnalysisReport({
      ...analysisReport,
      trustedCircleOpinions: updatedOpinions,
      trustedCircleScore: newCircleScore,
      combinedFinalConfidence: newFinalConf,
    });
    setNewOpinionComment('');
    setShowTrustedOpinionsModal(false);
  };

  if (!activeProduct || !analysisReport) {
    return (
      <div
        className="rounded-3xl border p-8 sm:p-12 text-center space-y-6 shadow-sm"
        style={{
          backgroundColor: 'var(--surface)',
          borderColor: 'var(--border)',
          color: 'var(--text-primary)',
        }}
      >
        <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center bg-blue-500/10 text-blue-500 border border-blue-500/20 shadow-inner">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <div className="max-w-md mx-auto space-y-2">
          <h2 className="text-xl sm:text-2xl font-display font-extrabold tracking-tight" style={{ color: 'var(--heading-primary)' }}>
            AI Deal Analyzer
          </h2>
          <p className="text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Select or negotiate any product from DealMate, local partner stores, or real-time search. The AI Deal Analyzer will independently evaluate quality, seller trust, warranties, and risks before you buy.
          </p>
        </div>
        <div>
          <button
            type="button"
            onClick={onBrowseMoreProducts}
            className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm inline-flex items-center gap-2 cursor-pointer transition-colors shadow-md"
          >
            <Search className="w-4 h-4" />
            <span>Find & Negotiate Products First</span>
          </button>
        </div>
      </div>
    );
  }

  const {
    detectedCategory,
    detectedSubcategory,
    categoryThresholdTitle,
    primaryConfidenceScore,
    dealValueScore,
    verdict,
    verdictSummary,
    whyDealMateRecommends,
    whatCouldGoWrong,
    productQualityScore,
    analysisConfidenceScore,
    confidenceLimitations,
    categoryMetrics,
    reliabilityScore,
    sellerTrustScore,
    sellerAssessment,
    warrantyConfidenceScore,
    warrantyTerms,
    returnProtectionScore,
    returnPolicyTerms,
    evidenceConfidenceScore,
    evidenceItems,
    reviewAnalysis,
    productHistoryStatus,
    productHistoryNotes,
    risks,
    overallRiskLevel,
    costBreakdown,
    trustedCircleScore,
    combinedFinalConfidence,
    improvementOptions,
    sourcesTransparency,
  } = analysisReport;

  return (
    <div className="space-y-6">
      {/* 1. Header Banner & Dynamic Category Badge */}
      <div
        className="rounded-3xl border p-5 sm:p-7 relative overflow-hidden transition-all shadow-sm"
        style={{
          backgroundColor: 'var(--surface)',
          borderColor: 'var(--border)',
        }}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold border"
                style={{
                  backgroundColor: 'rgba(37, 99, 235, 0.08)',
                  borderColor: 'rgba(37, 99, 235, 0.25)',
                  color: 'var(--accent)',
                }}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>AI Deal Analyzer</span>
              </span>
              <span
                className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold border"
                style={{
                  backgroundColor: 'var(--surface-elevated)',
                  borderColor: 'var(--border)',
                  color: 'var(--supporting-text)',
                }}
              >
                {detectedCategory} • {detectedSubcategory}
              </span>
              <span
                className="text-[11px] font-mono"
                style={{ color: 'var(--supporting-text)' }}
              >
                Analysis based on current available information ({analysisReport.analyzedAt})
              </span>
            </div>
            <h1
              className="text-xl sm:text-2xl font-display font-black tracking-tight"
              style={{ color: 'var(--heading-primary)' }}
            >
              Independent Product, Seller & Risk Evaluation
            </h1>
            <p
              className="text-xs sm:text-sm max-w-2xl leading-relaxed"
              style={{ color: 'var(--text-secondary)' }}
            >
              "A cheaper product is not always a better deal." We check whether the negotiated deal is actually worth buying.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-center">
            <button
              type="button"
              onClick={() => executeAnalysis(activeProduct, negotiatedPrice, userBudget)}
              disabled={isRefreshing}
              className="px-3 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
              style={{
                backgroundColor: 'var(--surface-elevated)',
                borderColor: 'var(--border)',
                color: 'var(--text-secondary)',
              }}
              title="Refresh real-time evidence"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Analyzing...' : 'Refresh Data'}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowSourcesModal(true)}
              className="px-3 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
              style={{
                backgroundColor: 'var(--surface-elevated)',
                borderColor: 'var(--border)',
                color: 'var(--text-secondary)',
              }}
            >
              <FileText className="w-3.5 h-3.5 text-blue-500" />
              <span>View Sources</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter Bar with 'Group Deals' option */}
      <div
        className="rounded-2xl border p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
        style={{
          backgroundColor: 'var(--surface)',
          borderColor: 'var(--border)',
        }}
      >
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          <span className="text-xs font-mono font-bold mr-1" style={{ color: 'var(--text-muted)' }}>
            Filter Deals:
          </span>
          {[
            { id: 'all', label: 'All Products' },
            { id: 'group_deals', label: '👥 Group Deals' },
            { id: 'electronics', label: 'Electronics' },
            { id: 'fashion', label: 'Fashion' },
            { id: 'local', label: '📍 Local Stores' },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setDealFilter(f.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-all border ${
                dealFilter === f.id
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'hover:bg-slate-500/10'
              }`}
              style={
                dealFilter !== f.id
                  ? { color: 'var(--text-secondary)', borderColor: 'var(--border)' }
                  : undefined
              }
            >
              {f.label}
            </button>
          ))}
        </div>

        <span className="text-[11px] font-mono shrink-0" style={{ color: 'var(--supporting-text)' }}>
          Showing {filteredProductList.length} products
        </span>
      </div>

      {/* Group Deals Opportunity Section */}
      {dealFilter === 'group_deals' && (
        <div
          className="p-4 rounded-3xl border space-y-3"
          style={{
            backgroundColor: 'rgba(147, 51, 234, 0.04)',
            borderColor: 'rgba(147, 51, 234, 0.25)',
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-600" />
              <h3 className="font-display font-bold text-sm text-purple-950 dark:text-purple-200">
                Products with Active Collective Demand Opportunities
              </h3>
            </div>
            <span className="text-[11px] font-mono text-purple-700 dark:text-purple-300 font-bold">
              {filteredProductList.length} Group Deals Available
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredProductList.map((prod) => {
              const matchedPool = collectivePools.find(
                (p) =>
                  p.productId === prod.id ||
                  p.productName.toLowerCase() === prod.name.toLowerCase()
              );
              const isSelected = activeProduct.id === prod.id;

              return (
                <div
                  key={prod.id}
                  onClick={() => {
                    setActiveProduct(prod);
                    setNegotiatedPrice(
                      matchedPool?.collectiveTargetPrice || Math.round(prod.listPrice * 0.85)
                    );
                  }}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                    isSelected
                      ? 'border-purple-500 bg-white dark:bg-slate-900 shadow-md ring-2 ring-purple-500/20'
                      : 'border-purple-200/60 dark:border-purple-800/40 bg-white/70 dark:bg-slate-900/60 hover:border-purple-400'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <img
                      src={prod.image}
                      alt={prod.name}
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 rounded-xl object-cover bg-slate-100 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="font-display font-bold text-xs truncate text-slate-900 dark:text-white">
                        {prod.name}
                      </div>
                      <div className="text-[11px] font-mono font-bold text-purple-700 dark:text-purple-300">
                        ₹{prod.listPrice.toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>

                  {matchedPool && (
                    <CollectiveDealIndicator pool={matchedPool} compact={true} />
                  )}

                  <div className="text-[10px] font-mono text-right text-purple-600 font-semibold">
                    {isSelected ? '✓ Currently Analyzing' : 'Click to Analyze Deal →'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. Top Analytical Dashboard (Product + Negotiated Price + Deal Value + Verdict) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Product & Negotiation Context Card */}
        <div
          className="lg:col-span-7 rounded-3xl border p-5 sm:p-6 space-y-5 flex flex-col justify-between shadow-sm"
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--border)',
          }}
        >
          <div className="flex items-start gap-4">
            <img
              src={activeProduct.image}
              alt={activeProduct.name}
              referrerPolicy="no-referrer"
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border border-slate-700/50 bg-slate-900 shrink-0"
            />
            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  {activeProduct.brand}
                </span>
                <span
                  className="text-xs px-2 py-0.5 rounded-md font-mono border"
                  style={{
                    backgroundColor: 'var(--surface-elevated)',
                    borderColor: 'var(--border)',
                    color: 'var(--supporting-text)',
                  }}
                >
                  {activeProduct.sellerName}
                </span>
                {activeProduct.isLocalStore && (
                  <span className="text-[11px] px-2 py-0.5 rounded-md font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                    📍 Verified Local Store
                  </span>
                )}
              </div>

              <h2 className="text-base sm:text-lg font-bold truncate" style={{ color: 'var(--heading-primary)' }}>
                {activeProduct.name}
              </h2>

              <p className="text-xs line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                {activeProduct.description}
              </p>
            </div>
          </div>

          {/* Active Product Collective Deal Opportunity */}
          {activeProductPool && (
            <div className="pt-1">
              <CollectiveDealIndicator pool={activeProductPool} />
            </div>
          )}

          {/* Pricing Row */}
          <div
            className="p-4 rounded-2xl border grid grid-cols-3 gap-2 text-center"
            style={{
              backgroundColor: 'var(--surface-elevated)',
              borderColor: 'var(--border)',
            }}
          >
            <div>
              <div className="text-[11px] font-mono font-semibold" style={{ color: 'var(--supporting-text)' }}>List Price</div>
              <div className="text-xs sm:text-sm font-mono line-through" style={{ color: 'var(--text-muted)' }}>
                ₹{activeProduct.listPrice.toLocaleString('en-IN')}
              </div>
            </div>

            <div>
              <div className="text-[11px] font-mono font-bold text-blue-600 dark:text-blue-400">Negotiated Deal</div>
              <div className="text-base sm:text-xl font-mono font-black text-emerald-600 dark:text-emerald-400">
                ₹{analysisReport.negotiatedPrice.toLocaleString('en-IN')}
              </div>
            </div>

            <div>
              <div className="text-[11px] font-mono font-semibold" style={{ color: 'var(--supporting-text)' }}>Direct Savings</div>
              <div className="text-xs sm:text-sm font-mono font-bold text-emerald-600 dark:text-emerald-400">
                ₹{analysisReport.savings.toLocaleString('en-IN')} ({Math.round((analysisReport.savings / activeProduct.listPrice) * 100)}%)
              </div>
            </div>
          </div>
        </div>

        {/* Right: Deal Value Score & Final Verdict */}
        <div
          className="lg:col-span-5 rounded-3xl border p-5 sm:p-6 space-y-4 flex flex-col justify-between shadow-sm relative overflow-hidden"
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--border)',
          }}
        >
          <div>
            <div className="flex items-center justify-between gap-2 border-b pb-3" style={{ borderColor: 'var(--border)' }}>
              <span className="text-xs font-mono font-bold uppercase tracking-wider" style={{ color: 'var(--supporting-text)' }}>
                Decision Synthesis
              </span>
              <span className="text-[11px] font-mono" style={{ color: 'var(--supporting-text)' }}>
                Combined Evidence Profile
              </span>
            </div>

            {/* Verdict Box */}
            <div className="mt-4 flex items-center justify-between gap-4">
              <div>
                <div className="text-xs font-mono font-semibold" style={{ color: 'var(--supporting-text)' }}>Deal Value Score</div>
                <div className="text-4xl sm:text-5xl font-black font-display tracking-tight flex items-baseline gap-1"
                  style={{
                    color: dealValueScore >= 80 ? 'var(--success)' : dealValueScore >= 65 ? '#d97706' : '#dc2626',
                  }}
                >
                  <span>{dealValueScore}</span>
                  <span className="text-sm font-mono font-normal" style={{ color: 'var(--text-muted)' }}>/ 100</span>
                </div>
              </div>

              {/* Big Verdict Pill */}
              <div
                className={`px-4 py-2.5 rounded-2xl flex items-center gap-2 border shadow-sm ${
                  verdict === 'BUY'
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-600 dark:text-emerald-400'
                    : verdict === 'THINK'
                    ? 'bg-amber-500/10 border-amber-500/40 text-amber-600 dark:text-amber-400'
                    : 'bg-red-500/10 border-red-500/40 text-red-600 dark:text-red-400'
                }`}
              >
                {verdict === 'BUY' && <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />}
                {verdict === 'THINK' && <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />}
                {verdict === 'AVOID' && <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />}
                <div>
                  <div className="text-[10px] font-mono uppercase font-bold tracking-wider">Final Verdict</div>
                  <div className="text-lg font-black tracking-wide">
                    {verdict === 'BUY' ? '🟢 BUY' : verdict === 'THINK' ? '🟡 THINK' : '🔴 AVOID'}
                  </div>
                </div>
              </div>
            </div>

            <p className="mt-3 text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {verdictSummary}
            </p>
          </div>

          {/* Dual Metrics: Product Quality vs Analysis Confidence (Section 26) */}
          <div
            className="p-3 rounded-xl border grid grid-cols-2 gap-2 text-xs font-mono"
            style={{
              backgroundColor: 'var(--surface-elevated)',
              borderColor: 'var(--border)',
            }}
          >
            <div>
              <span className="text-[10px] font-semibold block" style={{ color: 'var(--supporting-text)' }}>Product Quality</span>
              <strong className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{productQualityScore}/100</strong>
            </div>
            <div>
              <span className="text-[10px] font-semibold block" style={{ color: 'var(--supporting-text)' }}>Analysis Confidence</span>
              <strong className="text-sm font-bold text-blue-600 dark:text-blue-400">{analysisConfidenceScore}/100</strong>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Category-Specific Analysis Pillars (Section 8, 24 & 25) */}
      <div
        className="rounded-3xl border p-5 sm:p-7 space-y-6 shadow-sm"
        style={{
          backgroundColor: 'var(--surface)',
          borderColor: 'var(--border)',
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-4" style={{ borderColor: 'var(--border)' }}>
          <div>
            <h3 className="text-base sm:text-lg font-bold font-display" style={{ color: 'var(--heading-primary)' }}>
              Category Analysis: {categoryThresholdTitle}
            </h3>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Dynamically adapted for {detectedCategory} ({detectedSubcategory}). Zero generic filler specs.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/25">
              Score: {primaryConfidenceScore}/100
            </span>
          </div>
        </div>

        {/* 4 Adaptive Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {categoryMetrics.map((metric, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl border space-y-2.5 transition-all hover:border-blue-500/40"
              style={{
                backgroundColor: 'var(--surface-elevated)',
                borderColor: 'var(--border)',
              }}
            >
              <div className="flex items-center justify-between gap-1">
                <span className="text-[11px] font-mono uppercase font-bold tracking-wider" style={{ color: 'var(--supporting-text)' }}>
                  Dimension 0{idx + 1}
                </span>
                <span
                  className="text-xs font-mono font-black px-2 py-0.5 rounded-md"
                  style={{
                    backgroundColor:
                      metric.score >= 85
                        ? 'rgba(22, 163, 74, 0.12)'
                        : 'rgba(234, 179, 8, 0.12)',
                    color: metric.score >= 85 ? 'var(--success)' : '#d97706',
                  }}
                >
                  {metric.score}/100
                </span>
              </div>

              <h4 className="text-xs sm:text-sm font-bold line-clamp-1" style={{ color: 'var(--text-primary)' }}>
                {metric.name}
              </h4>

              <p className="text-[11px] leading-relaxed line-clamp-3" style={{ color: 'var(--text-secondary)' }}>
                {metric.assessment}
              </p>

              <div className="pt-2 border-t flex items-center justify-between text-[10px] font-mono" style={{ borderColor: 'var(--border)', color: 'var(--supporting-text)' }}>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  <span>{metric.sourceType}</span>
                </span>
                <span className="truncate max-w-[120px]">{metric.sourceLabel}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Cross-Pillar Grid: Seller, Warranty, Evidence, Total Cost (Sections 13, 14, 15) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Seller Trust */}
        <div
          className="rounded-3xl border p-5 space-y-3 shadow-sm"
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--border)',
          }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase" style={{ color: 'var(--supporting-text)' }}>Seller Trust</span>
            <span className="text-sm font-mono font-black text-emerald-600 dark:text-emerald-400">{sellerTrustScore}/100</span>
          </div>
          <div className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{activeProduct.sellerName}</div>
          <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{sellerAssessment}</p>
          <div className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1 pt-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Fulfillment Verified</span>
          </div>
        </div>

        {/* Warranty Confidence */}
        <div
          className="rounded-3xl border p-5 space-y-3 shadow-sm"
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--border)',
          }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase" style={{ color: 'var(--supporting-text)' }}>Warranty</span>
            <span className="text-sm font-mono font-black text-blue-600 dark:text-blue-400">{warrantyConfidenceScore}/100</span>
          </div>
          <div className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>Manufacturer & Partner Cover</div>
          <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{warrantyTerms}</p>
          <div className="text-[10px] font-mono text-blue-600 dark:text-blue-400 flex items-center gap-1 pt-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Authorized Service Network</span>
          </div>
        </div>

        {/* Return Protection */}
        <div
          className="rounded-3xl border p-5 space-y-3 shadow-sm"
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--border)',
          }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase" style={{ color: 'var(--supporting-text)' }}>Return Protection</span>
            <span className="text-sm font-mono font-black text-emerald-600 dark:text-emerald-400">{returnProtectionScore}/100</span>
          </div>
          <div className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>Hassle-Free Policy</div>
          <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{returnPolicyTerms}</p>
          <div className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1 pt-1">
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Doorstep Replacement</span>
          </div>
        </div>

        {/* Total Cost Analysis (Section 15) */}
        <div
          className="rounded-3xl border p-5 space-y-3 shadow-sm"
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--border)',
          }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase" style={{ color: 'var(--supporting-text)' }}>Estimated Total Cost</span>
            <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-bold">
              {costBreakdown.isShippingFree ? 'Free Delivery' : `+₹${costBreakdown.shippingCharge}`}
            </span>
          </div>
          <div className="text-lg font-mono font-black" style={{ color: 'var(--heading-primary)' }}>
            ₹{costBreakdown.estimatedTotalPayable.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            {costBreakdown.costBreakdownNotes[0]}
          </p>
          <div className="text-[10px] font-mono pt-1" style={{ color: 'var(--text-muted)' }}>
            Zero hidden charges • Guaranteed locked checkout price
          </div>
        </div>
      </div>

      {/* 5. "What Could Go Wrong?" & "Why DealMate Recommends This" (Section 17 & 24) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Why DealMate Recommends This */}
        <div
          className="rounded-3xl border p-5 sm:p-6 space-y-4 shadow-sm"
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--border)',
          }}
        >
          <div className="flex items-center gap-2 border-b pb-3" style={{ borderColor: 'var(--border)' }}>
            <Sparkles className="w-4 h-4 text-emerald-500" />
            <h3 className="font-bold text-sm sm:text-base" style={{ color: 'var(--heading-primary)' }}>
              Why DealMate Recommends This
            </h3>
          </div>
          <div className="space-y-3">
            {whyDealMateRecommends.map((point, pIdx) => (
              <div key={pIdx} className="flex items-start gap-2.5 text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <span className="font-medium">{point}</span>
              </div>
            ))}
          </div>
        </div>

        {/* What Could Go Wrong? (Evidence-based risk warnings) */}
        <div
          className="rounded-3xl border p-5 sm:p-6 space-y-4 shadow-sm"
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--border)',
          }}
        >
          <div className="flex items-center gap-2 border-b pb-3" style={{ borderColor: 'var(--border)' }}>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <h3 className="font-bold text-sm sm:text-base" style={{ color: 'var(--heading-primary)' }}>
              What Could Go Wrong?
            </h3>
          </div>
          <div className="space-y-3">
            {whatCouldGoWrong.map((concern, cIdx) => (
              <div key={cIdx} className="flex items-start gap-2.5 text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                <span className="text-amber-500 font-bold shrink-0">⚠</span>
                <span className="font-medium">{concern}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 6. Automatic Negotiation Feedback Loop: "IMPROVE THIS DEAL" (Section 21) */}
      {improvementOptions.length > 0 && (
        <div
          className="rounded-3xl border p-5 sm:p-7 space-y-4 shadow-sm"
          style={{
            backgroundColor: 'rgba(37, 99, 235, 0.04)',
            borderColor: 'rgba(37, 99, 235, 0.3)',
          }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                <Zap className="w-3.5 h-3.5" />
                <span>Improve This Deal — Automatic Feedback Loop</span>
              </div>
              <h3 className="text-base font-bold mt-1" style={{ color: 'var(--heading-primary)' }}>
                Discovered Negotiable Opportunities
              </h3>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                Send newly discovered concerns directly back to the AI Negotiator. It will retain your current price of ₹{analysisReport.negotiatedPrice.toLocaleString('en-IN')} and negotiate this specific concession.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            {improvementOptions.map((opt) => (
              <div
                key={opt.id}
                className="p-4 rounded-2xl border flex flex-col justify-between space-y-3"
                style={{
                  backgroundColor: 'var(--surface)',
                  borderColor: 'var(--border)',
                }}
              >
                <div>
                  <div className="text-xs font-bold flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                    <Tag className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>{opt.title}</span>
                  </div>
                  <p className="text-[11px] mt-1 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    Target: {opt.expectedConcession}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleApplyImprovement(opt)}
                  className="w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>🤝 Re-Negotiate with Seller</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. Action Bar: BUY NOW / RE-NEGOTIATE / VIEW SOURCES */}
      <div
        className="rounded-3xl border p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm"
        style={{
          backgroundColor: 'var(--surface)',
          borderColor: 'var(--border)',
        }}
      >
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="text-left">
            <div className="text-[11px] font-mono font-semibold" style={{ color: 'var(--supporting-text)' }}>Final Recommended Action</div>
            <div className="text-sm font-bold" style={{ color: 'var(--heading-primary)' }}>
              {verdict === 'BUY'
                ? 'Proceed with High Confidence'
                : verdict === 'THINK'
                ? 'Review Improvements Before Checkout'
                : 'Consider Higher-Rated Alternatives'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto flex-wrap">
          <button
            type="button"
            onClick={() => setShowTrustedOpinionsModal(true)}
            className="px-4 py-3 rounded-xl border text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
            style={{
              backgroundColor: 'var(--surface-elevated)',
              borderColor: 'var(--border)',
              color: 'var(--text-secondary)',
            }}
          >
            <Users className="w-4 h-4 text-blue-400" />
            <span>Trusted Circle ({analysisReport.trustedCircleOpinions.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (improvementOptions[0]) {
                handleApplyImprovement(improvementOptions[0]);
              }
            }}
            className="px-4 py-3 rounded-xl border text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
            style={{
              backgroundColor: 'var(--surface-elevated)',
              borderColor: 'var(--border)',
              color: 'var(--text-secondary)',
            }}
          >
            <RotateCcw className="w-4 h-4 text-amber-500" />
            <span>Re-Negotiate</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEffects.playDealSecured();
              if (onBuyNow) {
                onBuyNow(activeProduct, analysisReport.negotiatedPrice);
              }
            }}
            className="flex-1 sm:flex-none px-6 py-3 rounded-xl text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-md transition-transform active:scale-[0.98] bg-linear-to-r from-emerald-600 via-teal-600 to-blue-600"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>BUY NOW (₹{analysisReport.negotiatedPrice.toLocaleString('en-IN')})</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Sources Transparency Modal (Section 23) */}
      {showSourcesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div
            className="w-full max-w-xl rounded-3xl border p-6 space-y-5 shadow-2xl"
            style={{
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--border)',
              color: 'var(--text-primary)',
            }}
          >
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-500" />
                <h3 className="text-base font-bold">Source Transparency Registry</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSourcesModal(false)}
                className="text-xs px-2.5 py-1 rounded-lg border cursor-pointer"
                style={{
                  color: 'var(--supporting-text)',
                  borderColor: 'var(--border)',
                  backgroundColor: 'var(--surface-elevated)',
                }}
              >
                Close
              </button>
            </div>

            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Every data point in DealMate is tagged by source reliability. Inferred conclusions are never presented as verified facts.
            </p>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {sourcesTransparency.map((src, sIdx) => (
                <div
                  key={sIdx}
                  className="p-3 rounded-xl border space-y-1 text-xs"
                  style={{
                    backgroundColor: 'var(--surface-elevated)',
                    borderColor: 'var(--border)',
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{src.section}</span>
                    <span
                      className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold"
                      style={{
                        backgroundColor:
                          src.tier === 'VERIFIED'
                            ? 'rgba(22, 163, 74, 0.15)'
                            : 'rgba(234, 179, 8, 0.15)',
                        color: src.tier === 'VERIFIED' ? 'var(--success)' : '#d97706',
                      }}
                    >
                      {src.tier}
                    </span>
                  </div>
                  <div style={{ color: 'var(--text-secondary)' }}>{src.source}</div>
                  {src.notes && <div className="text-[11px]" style={{ color: 'var(--supporting-text)' }}>{src.notes}</div>}
                </div>
              ))}
            </div>

            <div className="pt-2 text-right">
              <button
                type="button"
                onClick={() => setShowSourcesModal(false)}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Trusted Circle Opinions Modal (Section 18) */}
      {showTrustedOpinionsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div
            className="w-full max-w-xl rounded-3xl border p-6 space-y-5 shadow-2xl"
            style={{
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--border)',
              color: 'var(--text-primary)',
            }}
          >
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-500" />
                <h3 className="text-base font-bold" style={{ color: 'var(--heading-primary)' }}>Trusted Opinion Layer</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowTrustedOpinionsModal(false)}
                className="text-xs px-2.5 py-1 rounded-lg border cursor-pointer"
                style={{
                  color: 'var(--supporting-text)',
                  borderColor: 'var(--border)',
                  backgroundColor: 'var(--surface-elevated)',
                }}
              >
                Close
              </button>
            </div>

            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Family, friends, and verified buyers provide contextual experience. Note that community opinions do not override verified lab or warranty evidence.
            </p>

            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {analysisReport.trustedCircleOpinions.map((op) => (
                <div
                  key={op.id}
                  className="p-3 rounded-xl border space-y-1.5 text-xs"
                  style={{
                    backgroundColor: 'var(--surface-elevated)',
                    borderColor: 'var(--border)',
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{op.userName} ({op.relation})</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">{op.ratingScore}/100</span>
                  </div>
                  <p className="leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{op.comment}</p>
                  <div className="text-[10px] font-mono" style={{ color: 'var(--supporting-text)' }}>{op.timestamp}</div>
                </div>
              ))}
            </div>

            {/* Add Opinion Form */}
            <form onSubmit={handleAddTrustedOpinion} className="pt-2 border-t space-y-3" style={{ borderColor: 'var(--border)' }}>
              <div className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>Add Your or Friend's Perspective</div>
              <input
                type="text"
                value={newOpinionComment}
                onChange={(e) => setNewOpinionComment(e.target.value)}
                placeholder="e.g. Bought last month, battery lasts 2 full days..."
                className="w-full px-3 py-2 rounded-xl border text-xs focus:outline-none"
                style={{
                  backgroundColor: 'var(--surface-elevated)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-primary)',
                }}
              />
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs">
                  <span style={{ color: 'var(--supporting-text)' }}>Score:</span>
                  <input
                    type="number"
                    min="50"
                    max="100"
                    value={newOpinionScore}
                    onChange={(e) => setNewOpinionScore(Number(e.target.value))}
                    className="w-16 px-2 py-1 rounded-lg border text-xs font-mono"
                    style={{
                      backgroundColor: 'var(--surface-elevated)',
                      borderColor: 'var(--border)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={!newOpinionComment.trim()}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs cursor-pointer shadow-xs"
                >
                  Add Opinion
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
