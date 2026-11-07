import React, { useState } from 'react';
import {
  Product,
  CollectiveDealPool,
  CategoryNegotiationSetting,
  BulkDiscountTier,
} from '../../types';
import { ThemeConfig } from '../../types/theme';
import { PriceSparkline } from '../common/PriceSparkline';
import { CollectiveDealIndicator } from '../common/CollectiveDealIndicator';
import { D3PriceTrendChart } from '../common/D3PriceTrendChart';
import { VoiceNegotiationController } from './VoiceNegotiationController';
import { BudgetConstraintWorkspaceBar } from './BudgetConstraintWorkspaceBar';
import {
  DealHunterProductCandidate,
  NegotiationWorkspaceData,
} from '../../services/multiAgentPipeline';
import { NegotiationEngine } from '../../services/negotiationEngine';
import { INITIAL_COLLECTIVE_POOLS, DEFAULT_BULK_DISCOUNT_TIERS } from '../../data/catalog';
import {
  Star,
  Zap,
  ExternalLink,
  Store,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Check,
  RotateCcw,
  ArrowLeft,
  SlidersHorizontal,
  Search,
  Sparkles,
  Layers,
  CheckCircle2,
  Loader2,
  Tag,
  Package,
  Users,
  Minus,
  Plus,
  TrendingUp,
  TrendingDown,
  Wallet,
  Target,
  Mic,
  AlertCircle,
} from 'lucide-react';

export type ProductSortOption = 'best_match' | 'lowest_price' | 'highest_rating' | 'best_deal';
export type ProductFilterOption = 'all' | 'negotiable' | 'local' | 'rating_4' | 'group_deals';
export type NegotiatorPanelMode =
  | 'no_search'
  | 'search_results'
  | 'discovery'
  | 'negotiation'
  | 'alternatives';

interface ProductResultsPanelProps {
  mode?: NegotiatorPanelMode;
  hasSearched?: boolean;
  searchQuery?: string;
  onExecutePrompt?: (promptText: string) => void;
  activeProduct?: Product | null;
  activeCandidate?: DealHunterProductCandidate | null;
  activeNegotiation?: NegotiationWorkspaceData | null;
  candidates: DealHunterProductCandidate[];
  alternativeCandidates?: DealHunterProductCandidate[];
  activeSort: ProductSortOption;
  onChangeSort: (sort: ProductSortOption) => void;
  activeFilter: ProductFilterOption;
  onChangeFilter: (filter: ProductFilterOption) => void;
  displayedCount: number;
  onLoadMore: () => void;
  selectedProductId: string | null;
  highlightedProductId: string | null;
  onSelectProduct: (candidate: DealHunterProductCandidate) => void;
  onStartNegotiate: (candidate: DealHunterProductCandidate) => void;
  onTryAgain?: () => void;
  onAcceptDeal?: () => void;
  onFindAlternatives?: () => void;
  onOptimizeDeal?: (product: Product, settledPrice: number) => void;
  onAnalyzeDeal?: (product: Product, settledPrice: number) => void;
  onBackToDiscovery?: () => void;
  onBackToActiveDeal?: () => void;
  onSelectAlternative?: (candidate: DealHunterProductCandidate) => void;
  isSearching: boolean;
  theme: ThemeConfig;
  userBudget?: number;
  hasExplicitBudget?: boolean;
  suggestedBudget?: number;
  onAdjustBudget?: (newBudget: number) => void;
  onBroadenSearch?: () => void;
  comparedProductIds?: string[];
  onToggleCompare?: (product: Product) => void;
  onOpenCompareModal?: () => void;
  quantity?: number;
  onChangeQuantity?: (qty: number) => void;
  onStartBulkNegotiate?: (candidate: DealHunterProductCandidate, qty: number) => void;
  onJoinCollectiveDeal?: (pool: CollectiveDealPool) => void;
  activeCollectivePools?: CollectiveDealPool[];
  categorySettings?: CategoryNegotiationSetting[];
  onVoiceUpdateTarget?: (newTarget: number) => void;
  onVoiceUpdateBudget?: (newBudget: number) => void;
  onOpenProductDetails?: (product: Product) => void;
}

export const ProductResultsPanel: React.FC<ProductResultsPanelProps> = ({
  mode = 'discovery',
  hasSearched = false,
  searchQuery = '',
  onExecutePrompt,
  activeProduct = null,
  activeCandidate = null,
  activeNegotiation = null,
  candidates,
  alternativeCandidates = [],
  activeSort,
  onChangeSort,
  activeFilter,
  onChangeFilter,
  displayedCount,
  onLoadMore,
  selectedProductId,
  highlightedProductId,
  onSelectProduct,
  onStartNegotiate,
  onTryAgain,
  onAcceptDeal,
  onFindAlternatives,
  onOptimizeDeal,
  onAnalyzeDeal,
  onBackToDiscovery,
  onBackToActiveDeal,
  onSelectAlternative,
  isSearching,
  theme,
  userBudget,
  hasExplicitBudget,
  suggestedBudget,
  onAdjustBudget,
  onBroadenSearch,
  comparedProductIds = [],
  onToggleCompare,
  onOpenCompareModal,
  quantity = 1,
  onChangeQuantity,
  onStartBulkNegotiate,
  onJoinCollectiveDeal,
  activeCollectivePools = INITIAL_COLLECTIVE_POOLS,
  categorySettings = [],
  onVoiceUpdateTarget,
  onVoiceUpdateBudget,
  onOpenProductDetails,
}) => {
  const [expandedDetailsId, setExpandedDetailsId] = useState<string | null>(null);

  // Collapsible sections for Deal Analyzer (all default collapsed for a compact, clean first screen)
  const [isBulkGroupOpen, setIsBulkGroupOpen] = useState<boolean>(false);
  const [isAiAnalysisOpen, setIsAiAnalysisOpen] = useState<boolean>(false);
  const [isVoiceControlsOpen, setIsVoiceControlsOpen] = useState<boolean>(false);
  const [isSpecsOpen, setIsSpecsOpen] = useState<boolean>(false);
  const [isBudgetAdjustOpen, setIsBudgetAdjustOpen] = useState<boolean>(false);
  const [customBudgetInput, setCustomBudgetInput] = useState<string>('');
  const [budgetFeedbackMessage, setBudgetFeedbackMessage] = useState<string | null>(null);

  // Helper to extract key bullet specifications cleanly
  const getKeyBulletSpecs = (p: Product): string[] => {
    const bullets: string[] = [];
    const specs = p.specs || {};

    // 1. Noise Cancellation / ANC
    if (specs['Noise Cancellation'] || specs['ANC'] || specs['Noise Cancelling']) {
      const val = specs['Noise Cancellation'] || specs['ANC'] || specs['Noise Cancelling'];
      bullets.push(val.includes('ANC') ? val : `${val} ANC`);
    } else if (
      p.description.toLowerCase().includes('active noise cancellation') ||
      p.description.toLowerCase().includes('anc')
    ) {
      const dbMatch = p.description.match(/(\d+)\s*dB/i);
      bullets.push(dbMatch ? `${dbMatch[1]}dB Hybrid ANC` : 'Active Noise Cancellation (ANC)');
    }

    // 2. Battery Life
    if (specs['Battery Life'] || specs['Battery']) {
      bullets.push(`${specs['Battery Life'] || specs['Battery']}`);
    } else {
      const batMatch = p.description.match(
        /(\d+)\s*(?:hours|hrs?|h)\s*(?:battery|playback|longevity)?/i
      );
      if (batMatch) {
        bullets.push(`${batMatch[1]}-hour battery`);
      }
    }

    // 3. Connectivity / Processor / Material
    if (specs['Connectivity']) {
      bullets.push(specs['Connectivity']);
    } else if (specs['Processor']) {
      bullets.push(specs['Processor']);
    } else if (specs['Memory & Storage']) {
      bullets.push(specs['Memory & Storage']);
    } else if (specs['Fabric'] || specs['Material']) {
      bullets.push(specs['Fabric'] || specs['Material']);
    } else if (specs['Cushioning'] || specs['Upper']) {
      bullets.push(specs['Cushioning'] || specs['Upper']);
    }

    // Fallback specs if less than 2
    if (bullets.length < 2) {
      for (const [k, v] of Object.entries(specs)) {
        if (!bullets.includes(v) && bullets.length < 3 && !k.toLowerCase().includes('sku')) {
          bullets.push(`${k}: ${v}`);
        }
      }
    }

    return bullets.slice(0, 3);
  };

  // Determine effective product in active negotiation mode
  const currentActiveProduct = activeProduct || activeCandidate?.product || null;

  // Filter candidates for discovery
  const filteredCandidates = candidates.filter((c) => {
    if (activeFilter === 'group_deals') {
      return activeCollectivePools.some(
        (pool) =>
          pool.productId === c.product.id ||
          pool.productName.toLowerCase() === c.product.name.toLowerCase()
      );
    }
    if (activeFilter === 'negotiable') return c.eligibleForNegotiation;
    if (activeFilter === 'local') return c.product.isLocalStore || c.sourceLabel === 'Local Stores';
    if (activeFilter === 'rating_4') return c.product.rating >= 4.5;
    return true;
  });

  // Sort candidates for discovery
  const sortedCandidates = [...filteredCandidates].sort((a, b) => {
    if (activeSort === 'lowest_price') return a.product.listPrice - b.product.listPrice;
    if (activeSort === 'highest_rating') return b.product.rating - a.product.rating;
    if (activeSort === 'best_deal') return b.estimatedSavings - a.estimatedSavings;
    return b.matchScorePct - a.matchScorePct;
  });

  const visibleCandidates = sortedCandidates.slice(0, displayedCount);
  const totalCount = sortedCandidates.length;

  /* =========================================================================
     MODE B: DEDICATED DEAL ANALYZER & NEGOTIATION WORKSPACE
     8-Part Simple Hierarchy:
     1. Product and price summary
     2. Budget Summary
     3. AI Recommended Deal
     4. Primary negotiation action
     5. Bulk & Group Deals (collapsible)
     6. AI Analysis (collapsible)
     7. Voice Controls (collapsible)
     8. Product specifications and retailer details (collapsible)
     ========================================================================= */
  if (mode === 'negotiation' && currentActiveProduct) {
    const isCompleted = activeNegotiation?.status === 'COMPLETED';
    const isNegotiating = activeNegotiation?.status === 'NEGOTIATING';
    const bulletSpecs = getKeyBulletSpecs(currentActiveProduct);

    const listPrice = currentActiveProduct.listPrice;
    const marketPrice = currentActiveProduct.marketPrice || listPrice;
    const settledPrice = activeNegotiation?.settledPrice || listPrice;
    const targetPrice =
      activeNegotiation?.targetPrice ||
      activeCandidate?.negotiationTarget ||
      Math.round(listPrice * 0.85);
    const savings = isCompleted
      ? activeNegotiation?.savings || Math.max(0, listPrice - settledPrice)
      : Math.max(0, listPrice - targetPrice);

    const effectiveMaxBudget =
      userBudget || activeNegotiation?.userBudget || currentActiveProduct.listPrice;

    const effectiveCandidate: DealHunterProductCandidate =
      activeCandidate ||
      candidates.find((c) => c.product.id === currentActiveProduct.id) || {
        product: currentActiveProduct,
        sourceLabel: currentActiveProduct.isLocalStore ? 'Local Stores' : 'Store Catalog',
        retailerName: currentActiveProduct.sellerName,
        listingOrigin: currentActiveProduct.isStoreOwnerListed
          ? 'SHOP_OWNER_STORE'
          : 'DEALMATE_STORE',
        matchCategory: 'EXACT_MATCH',
        aboveBudgetAmount: 0,
        matchScorePct: 95,
        resultBadges: ['Top Deal'],
        retailerUrl: currentActiveProduct.externalUrl || '#',
        isSimulatedDemo: false,
        matchingFeatures: [],
        dealPotential: 'High',
        eligibleForNegotiation: true,
        potentiallyWithinBudgetViaNegotiation: true,
        negotiationTarget: targetPrice,
        floorPrice: activeNegotiation?.floorPrice || Math.round(listPrice * 0.82),
        maxSupportedDiscountPct: 18,
        estimatedSavings: savings,
      };

    const retailerLink = currentActiveProduct.externalUrl || effectiveCandidate.retailerUrl;
    const totalTargetAsk = targetPrice * quantity;
    const headroom = effectiveMaxBudget - totalTargetAsk;
    const budgetRatio = totalTargetAsk / Math.max(1, effectiveMaxBudget);
    const budgetPct = Math.min(100, Math.max(4, Math.round(budgetRatio * 100)));

    let zoneLabel = '';
    let zoneColor = '';
    let barGradient = '';
    const isOverBudget = headroom < 0;

    if (budgetRatio <= 0.70) {
      zoneLabel = 'Comfortable Zone — Healthy budget cushion';
      zoneColor = 'var(--success)';
      barGradient = 'linear-gradient(90deg, #10b981 0%, #14b8a6 100%)';
    } else if (budgetRatio <= 0.90) {
      zoneLabel = 'Cautionary Margin — Within budget ceiling';
      zoneColor = '#EAB308';
      barGradient = 'linear-gradient(90deg, #eab308 0%, #f59e0b 100%)';
    } else if (budgetRatio <= 1.00) {
      zoneLabel = `Near-Limit — Target ask consumes ${budgetPct}% of budget`;
      zoneColor = '#F97316';
      barGradient = 'linear-gradient(90deg, #f97316 0%, #ea580c 100%)';
    } else {
      zoneLabel = `Exceeds Budget — Over by ₹${Math.abs(headroom).toLocaleString('en-IN')}`;
      zoneColor = '#EF4444';
      barGradient = 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)';
    }

    const handleApplyBudgetPreset = (deltaOrVal: number, isAbsolute: boolean = false) => {
      const updated = isAbsolute ? deltaOrVal : Math.max(100, effectiveMaxBudget + deltaOrVal);
      if (onVoiceUpdateBudget) onVoiceUpdateBudget(updated);
      else if (onAdjustBudget) onAdjustBudget(updated);
      setBudgetFeedbackMessage(`Budget updated to ₹${updated.toLocaleString('en-IN')}`);
      setTimeout(() => setBudgetFeedbackMessage(null), 3000);
    };

    const handleCustomBudgetSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const val = parseInt(customBudgetInput.replace(/[^0-9]/g, ''), 10);
      if (!isNaN(val) && val >= 100) {
        handleApplyBudgetPreset(val, true);
        setCustomBudgetInput('');
        setIsBudgetAdjustOpen(false);
      }
    };

    // Matched group buy pool
    const matchedPool =
      activeCollectivePools.find(
        (p) =>
          (p.productId === currentActiveProduct.id ||
            p.productName.toLowerCase() === currentActiveProduct.name.toLowerCase()) &&
          p.status === 'ACTIVE'
      ) ||
      activeCollectivePools.find(
        (p) => p.category === currentActiveProduct.category && p.status === 'ACTIVE'
      );

    const poolPct = matchedPool
      ? Math.min(100, Math.round((matchedPool.currentQuantity / matchedPool.targetQuantity) * 100))
      : 0;

    // Bulk calculation
    const bulkUnitPrice = NegotiationEngine.computeBulkUnitPrice(
      currentActiveProduct.listPrice,
      quantity,
      currentActiveProduct,
      categorySettings
    );
    const bulkTotal = bulkUnitPrice * quantity;
    const normalTotal = listPrice * quantity;
    const bulkSavings = Math.max(0, normalTotal - bulkTotal);

    return (
      <div className="flex flex-col h-full overflow-hidden" style={{ color: 'var(--text-primary)' }}>
        {/* Top Header */}
        <div
          className="p-3.5 sm:p-4 border-b shrink-0 transition-colors"
          style={{
            backgroundColor: 'var(--surface-elevated)',
            borderColor: 'var(--border)',
          }}
        >
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <span
                className="px-2.5 py-1 rounded-full text-xs font-mono font-bold flex items-center gap-1.5"
                style={{
                  backgroundColor: isCompleted
                    ? 'rgba(22, 163, 74, 0.12)'
                    : isNegotiating
                    ? 'rgba(234, 179, 8, 0.12)'
                    : 'rgba(37, 99, 235, 0.12)',
                  color: isCompleted ? 'var(--success)' : isNegotiating ? '#EAB308' : 'var(--accent)',
                  border: `1px solid ${
                    isCompleted
                      ? 'rgba(22, 163, 74, 0.3)'
                      : isNegotiating
                      ? 'rgba(234, 179, 8, 0.3)'
                      : 'rgba(37, 99, 235, 0.3)'
                  }`,
                }}
              >
                {isCompleted ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>DEAL SECURED</span>
                  </>
                ) : isNegotiating ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                    <span>NEGOTIATING...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>DEAL ANALYZER</span>
                  </>
                )}
              </span>

              <span className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>
                Targeting 1 Product
              </span>
            </div>

            {onBackToDiscovery && (
              <button
                type="button"
                onClick={onBackToDiscovery}
                className="px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors border hover:bg-slate-500/10"
                style={{
                  backgroundColor: 'var(--surface)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-secondary)',
                }}
                title="Browse all products"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Discovery ({candidates.length})</span>
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Container with the 8 simple hierarchy sections */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-3.5 min-h-0">
          {/* 1. PRODUCT & PRICE SUMMARY */}
          <div
            className="p-3.5 sm:p-4 rounded-2xl border space-y-3"
            style={{
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--border)',
            }}
          >
            <div className="flex items-start gap-3 sm:gap-3.5">
              <img
                src={currentActiveProduct.image}
                alt={currentActiveProduct.name}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover shrink-0 border"
                style={{ borderColor: 'var(--border)' }}
              />

              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider font-bold" style={{ color: 'var(--text-muted)' }}>
                    {currentActiveProduct.brand} • {currentActiveProduct.sellerName}
                  </span>
                  <div className="flex items-center gap-1 text-xs font-bold text-amber-500 shrink-0">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{currentActiveProduct.rating}</span>
                  </div>
                </div>

                <h3
                  className="font-display font-bold text-xs sm:text-sm leading-snug line-clamp-2"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {currentActiveProduct.name}
                </h3>

                {/* Price Display */}
                <div className="flex items-baseline gap-2 flex-wrap pt-0.5">
                  <span className="text-base sm:text-lg font-mono font-extrabold" style={{ color: 'var(--text-primary)' }}>
                    ₹{listPrice.toLocaleString('en-IN')}
                  </span>
                  {marketPrice > listPrice && (
                    <span className="text-xs font-mono line-through" style={{ color: 'var(--text-muted)' }}>
                      ₹{marketPrice.toLocaleString('en-IN')}
                    </span>
                  )}
                  {marketPrice > listPrice && (
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      Save ₹{(marketPrice - listPrice).toLocaleString('en-IN')}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* AI Target Price Highlight */}
            <div
              className="p-2.5 rounded-xl border flex items-center justify-between gap-2"
              style={{
                backgroundColor: 'rgba(37, 99, 235, 0.05)',
                borderColor: 'rgba(37, 99, 235, 0.2)',
              }}
            >
              <div className="flex items-center gap-1.5">
                <Target className="w-4 h-4 text-blue-500 shrink-0" />
                <span className="text-xs font-mono font-semibold" style={{ color: 'var(--text-secondary)' }}>
                  AI Target Price:
                </span>
              </div>
              <span className="text-sm font-mono font-extrabold" style={{ color: 'var(--accent)' }}>
                ₹{targetPrice.toLocaleString('en-IN')}
                {quantity > 1 && (
                  <span className="text-[11px] font-normal text-slate-500 ml-1">
                    (₹{totalTargetAsk.toLocaleString('en-IN')} total)
                  </span>
                )}
              </span>
            </div>

            {/* Quantity Selector + Bulk Presets */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-semibold" style={{ color: 'var(--text-muted)' }}>
                  Units:
                </span>
                <div className="flex items-center rounded-lg border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
                  <button
                    type="button"
                    onClick={() => onChangeQuantity && onChangeQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    className="px-2 py-0.5 text-xs font-bold hover:bg-slate-500/10 disabled:opacity-40 cursor-pointer"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    -
                  </button>
                  <span className="px-2.5 py-0.5 font-mono text-xs font-bold" style={{ color: 'var(--accent)' }}>
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => onChangeQuantity && onChangeQuantity(quantity + 1)}
                    className="px-2 py-0.5 text-xs font-bold hover:bg-slate-500/10 cursor-pointer"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Quick Volume Presets */}
              <div className="flex items-center gap-1 text-[10px] font-mono">
                {[1, 3, 5, 10, 25].map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => onChangeQuantity && onChangeQuantity(q)}
                    className={`px-2 py-0.5 rounded-md border font-semibold cursor-pointer transition-colors ${
                      quantity === q
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-slate-300 dark:border-slate-700 hover:bg-slate-500/10 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {q === 1 ? '1 unit' : `${q}u (Bulk)`}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 2. BUDGET SUMMARY */}
          <div
            className="p-3.5 sm:p-4 rounded-2xl border space-y-3"
            style={{
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--border)',
            }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--accent)' }}>
                <Wallet className="w-3.5 h-3.5" /> Budget Summary
              </span>
              <button
                type="button"
                onClick={() => setIsBudgetAdjustOpen((prev) => !prev)}
                className="text-[11px] font-mono text-blue-500 hover:underline cursor-pointer flex items-center gap-1"
              >
                <span>{isBudgetAdjustOpen ? 'Close Adjust' : 'Adjust Budget ⚙'}</span>
              </button>
            </div>

            {/* 3 Values: Target Ask, Maximum Budget, Headroom */}
            <div className="grid grid-cols-3 gap-2 text-center font-mono">
              <div
                className="p-2.5 rounded-xl border"
                style={{ backgroundColor: 'var(--surface-elevated)', borderColor: 'var(--border)' }}
              >
                <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                  Target Ask
                </div>
                <div className="text-xs sm:text-sm font-bold" style={{ color: 'var(--accent)' }}>
                  ₹{totalTargetAsk.toLocaleString('en-IN')}
                </div>
              </div>

              <div
                className="p-2.5 rounded-xl border"
                style={{ backgroundColor: 'var(--surface-elevated)', borderColor: 'var(--border)' }}
              >
                <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                  Max Budget
                </div>
                <div className="text-xs sm:text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                  ₹{effectiveMaxBudget.toLocaleString('en-IN')}
                </div>
              </div>

              <div
                className="p-2.5 rounded-xl border"
                style={{
                  backgroundColor: isOverBudget
                    ? 'rgba(239, 68, 68, 0.08)'
                    : 'rgba(22, 163, 74, 0.08)',
                  borderColor: isOverBudget ? 'rgba(239, 68, 68, 0.3)' : 'rgba(22, 163, 74, 0.3)',
                }}
              >
                <div className="text-[10px]" style={{ color: isOverBudget ? '#EF4444' : 'var(--success)' }}>
                  Headroom
                </div>
                <div
                  className="text-xs sm:text-sm font-bold"
                  style={{ color: isOverBudget ? '#EF4444' : 'var(--success)' }}
                >
                  {headroom >= 0 ? `+₹${headroom.toLocaleString('en-IN')}` : `-₹${Math.abs(headroom).toLocaleString('en-IN')}`}
                </div>
              </div>
            </div>

            {/* Small Progress Indicator & Clear Text Label */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="font-semibold" style={{ color: zoneColor }}>
                  {zoneLabel}
                </span>
                <span style={{ color: 'var(--text-muted)' }}>{budgetPct}% used</span>
              </div>
              <div
                className="w-full h-2 rounded-full overflow-hidden"
                style={{ backgroundColor: 'var(--surface-elevated)' }}
              >
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${budgetPct}%`,
                    background: barGradient,
                  }}
                />
              </div>
            </div>

            {/* Compact Budget Adjustment Controls */}
            {isBudgetAdjustOpen && (
              <div
                className="pt-2.5 border-t space-y-2 text-xs"
                style={{ borderColor: 'var(--border)' }}
              >
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>Quick Presets:</span>
                  <button
                    type="button"
                    onClick={() => handleApplyBudgetPreset(totalTargetAsk, true)}
                    className="text-blue-500 hover:underline font-mono"
                  >
                    Match Ask (₹{totalTargetAsk.toLocaleString('en-IN')})
                  </button>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {[-500, +500, +1000].map((delta) => (
                    <button
                      key={delta}
                      type="button"
                      onClick={() => handleApplyBudgetPreset(delta, false)}
                      className="px-2.5 py-1 rounded-lg border font-mono text-[11px] font-semibold cursor-pointer hover:bg-slate-500/10"
                      style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                    >
                      {delta > 0 ? `+₹${delta}` : `-₹${Math.abs(delta)}`}
                    </button>
                  ))}
                </div>

                <form onSubmit={handleCustomBudgetSubmit} className="flex items-center gap-2 pt-1">
                  <input
                    type="number"
                    placeholder="Custom budget (₹)"
                    value={customBudgetInput}
                    onChange={(e) => setCustomBudgetInput(e.target.value)}
                    className="flex-1 px-2.5 py-1 rounded-lg border text-xs font-mono bg-transparent"
                    style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                    min={100}
                  />
                  <button
                    type="submit"
                    className="px-3 py-1 rounded-lg text-white font-bold text-xs bg-blue-600 hover:bg-blue-500 cursor-pointer"
                  >
                    Apply
                  </button>
                </form>
              </div>
            )}

            {budgetFeedbackMessage && (
              <div className="text-[11px] font-mono text-emerald-500 font-semibold animate-pulse">
                ✓ {budgetFeedbackMessage}
              </div>
            )}
          </div>

          {/* 3. AI RECOMMENDED DEAL */}
          <div
            className="p-3.5 sm:p-4 rounded-2xl border space-y-3"
            style={{
              backgroundColor: isCompleted ? 'rgba(22, 163, 74, 0.05)' : 'var(--surface)',
              borderColor: isCompleted ? 'rgba(22, 163, 74, 0.3)' : 'var(--border)',
            }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--accent)' }}>
                <Sparkles className="w-3.5 h-3.5" /> AI Recommended Deal
              </span>
              <span
                className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: isCompleted
                    ? 'rgba(22, 163, 74, 0.15)'
                    : isNegotiating
                    ? 'rgba(234, 179, 8, 0.15)'
                    : 'rgba(37, 99, 235, 0.12)',
                  color: isCompleted ? 'var(--success)' : isNegotiating ? '#EAB308' : 'var(--accent)',
                }}
              >
                {isCompleted ? '✓ Negotiation Complete' : isNegotiating ? '⚡ In Progress' : '3 Agents Aligned'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-center font-mono">
              <div
                className="p-2.5 rounded-xl border"
                style={{ backgroundColor: 'var(--surface-elevated)', borderColor: 'var(--border)' }}
              >
                <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                  {isCompleted ? 'Final Settled Price' : 'Recommended Target'}
                </div>
                <div
                  className="text-base sm:text-lg font-extrabold"
                  style={{ color: isCompleted ? 'var(--success)' : 'var(--accent)' }}
                >
                  ₹{(isCompleted ? settledPrice : targetPrice).toLocaleString('en-IN')}
                </div>
              </div>

              <div
                className="p-2.5 rounded-xl border"
                style={{
                  backgroundColor: 'rgba(22, 163, 74, 0.08)',
                  borderColor: 'rgba(22, 163, 74, 0.25)',
                }}
              >
                <div className="text-[10px]" style={{ color: 'var(--success)' }}>
                  Expected Savings
                </div>
                <div className="text-base sm:text-lg font-extrabold" style={{ color: 'var(--success)' }}>
                  ₹{savings.toLocaleString('en-IN')}
                  <span className="text-xs font-normal ml-1">
                    ({Math.round((savings / listPrice) * 100)}% off)
                  </span>
                </div>
              </div>
            </div>

            {/* Short explanation of why the price is reasonable */}
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Target is mathematically benchmarked against {currentActiveProduct.sellerName}&apos;s verified floor (₹
              {(activeNegotiation?.floorPrice || Math.round(listPrice * 0.82)).toLocaleString('en-IN')}) and 30-day category pricing trends. Protects maximum buyer savings without exceeding vendor margin constraints.
            </p>

            {/* 4. PRIMARY NEGOTIATION ACTION */}
            <div className="pt-1">
              {isCompleted ? (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={onAcceptDeal}
                    className="w-full py-3 px-4 rounded-xl text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all active:scale-[0.98] bg-linear-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Direct Checkout at Negotiated Price (₹{settledPrice.toLocaleString('en-IN')})</span>
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    {onOptimizeDeal && (
                      <button
                        type="button"
                        onClick={() => onOptimizeDeal(currentActiveProduct, settledPrice)}
                        className="py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer hover:bg-slate-500/10"
                        style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                      >
                        <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                        <span>Deal Optimizer</span>
                      </button>
                    )}
                    {onAnalyzeDeal && (
                      <button
                        type="button"
                        onClick={() => onAnalyzeDeal(currentActiveProduct, settledPrice)}
                        className="py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer hover:bg-slate-500/10"
                        style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Full Analysis</span>
                      </button>
                    )}
                  </div>
                </div>
              ) : isNegotiating ? (
                <button
                  type="button"
                  disabled
                  className="w-full py-3 px-4 rounded-xl text-white font-bold text-xs sm:text-sm opacity-85 flex items-center justify-center gap-2 cursor-wait bg-blue-600"
                >
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Negotiating with {currentActiveProduct.sellerName} AI...</span>
                </button>
              ) : (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => {
                      onStartNegotiate(effectiveCandidate);
                    }}
                    className="w-full py-3 px-4 rounded-xl text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all active:scale-[0.98] bg-linear-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500"
                  >
                    <Zap className="w-4 h-4" />
                    <span>Start AI Negotiation (Ask ₹{targetPrice.toLocaleString('en-IN')})</span>
                  </button>

                  {onFindAlternatives && (
                    <button
                      type="button"
                      onClick={onFindAlternatives}
                      className="w-full py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer hover:bg-slate-500/10 transition-colors"
                      style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                    >
                      <Search className="w-3.5 h-3.5" />
                      <span>Find Similar Alternatives</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 5. BULK & GROUP DEALS (Collapsible) */}
          <div
            className="rounded-2xl border overflow-hidden transition-all"
            style={{
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--border)',
            }}
          >
            <button
              type="button"
              onClick={() => setIsBulkGroupOpen((prev) => !prev)}
              className="w-full p-3.5 flex items-center justify-between text-left cursor-pointer hover:bg-slate-500/5 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-indigo-500 shrink-0" />
                <span className="font-display font-bold text-xs sm:text-sm" style={{ color: 'var(--text-primary)' }}>
                  Bulk & Group Deals
                </span>
                {matchedPool && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/25">
                    Pool Active
                  </span>
                )}
              </div>
              {isBulkGroupOpen ? (
                <ChevronUp className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
              ) : (
                <ChevronDown className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
              )}
            </button>

            {isBulkGroupOpen && (
              <div className="p-3.5 pt-0 space-y-3 text-xs border-t" style={{ borderColor: 'var(--border)' }}>
                {/* Available Quantity Tiers */}
                <div className="space-y-1.5 pt-2">
                  <div className="text-[11px] font-mono font-bold" style={{ color: 'var(--text-secondary)' }}>
                    Volume Pricing Tiers:
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-center font-mono text-[11px]">
                    <div className="p-2 rounded-xl border" style={{ backgroundColor: 'var(--surface-elevated)', borderColor: 'var(--border)' }}>
                      <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>1-2 units</div>
                      <div className="font-bold">Standard Target</div>
                    </div>
                    <div className="p-2 rounded-xl border" style={{ backgroundColor: 'var(--surface-elevated)', borderColor: 'var(--border)' }}>
                      <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>3-5 units</div>
                      <div className="font-bold text-indigo-500">~3% Concession</div>
                    </div>
                    <div className="p-2 rounded-xl border" style={{ backgroundColor: 'var(--surface-elevated)', borderColor: 'var(--border)' }}>
                      <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>6-10 units</div>
                      <div className="font-bold text-indigo-500">~6% Concession</div>
                    </div>
                    <div className="p-2 rounded-xl border" style={{ backgroundColor: 'var(--surface-elevated)', borderColor: 'var(--border)' }}>
                      <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>10+ units</div>
                      <div className="font-bold text-emerald-500">Wholesale Floor</div>
                    </div>
                  </div>
                </div>

                {/* Bulk Pricing for current quantity */}
                <div
                  className="p-3 rounded-xl border space-y-2"
                  style={{
                    backgroundColor: 'rgba(99, 102, 241, 0.05)',
                    borderColor: 'rgba(99, 102, 241, 0.25)',
                  }}
                >
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">
                      Bulk Order ({quantity} units):
                    </span>
                    <span className="text-slate-500">
                      ₹{bulkUnitPrice.toLocaleString('en-IN')}/unit
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-center font-mono">
                    <div className="p-2 rounded-lg bg-black/10 dark:bg-white/5">
                      <div className="text-[10px] text-slate-500">Bulk Target Total</div>
                      <div className="font-bold text-indigo-600 dark:text-indigo-400">₹{bulkTotal.toLocaleString('en-IN')}</div>
                    </div>
                    <div className="p-2 rounded-lg bg-emerald-500/10">
                      <div className="text-[10px] text-emerald-600 dark:text-emerald-400">Potential Saving</div>
                      <div className="font-bold text-emerald-600 dark:text-emerald-400">₹{bulkSavings.toLocaleString('en-IN')}</div>
                    </div>
                  </div>

                  {quantity >= 3 && onStartBulkNegotiate && activeCandidate && (
                    <button
                      type="button"
                      onClick={() => onStartBulkNegotiate(activeCandidate, quantity)}
                      className="w-full py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Package className="w-3.5 h-3.5" />
                      <span>Start Bulk Negotiation ({quantity} units)</span>
                    </button>
                  )}
                </div>

                {/* Group Buy Section */}
                {matchedPool ? (
                  <div
                    className="p-3 rounded-xl border space-y-2.5"
                    style={{
                      backgroundColor: 'rgba(168, 85, 247, 0.05)',
                      borderColor: 'rgba(168, 85, 247, 0.25)',
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5" /> Group Buy Pool
                      </span>
                      <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-400">
                        {matchedPool.participantsCount} Buyers Active
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between text-xs font-mono">
                      <span style={{ color: 'var(--text-secondary)' }}>Group Locked Price:</span>
                      <span className="text-sm font-extrabold text-purple-600 dark:text-purple-400">
                        ₹{matchedPool.collectiveTargetPrice.toLocaleString('en-IN')}/unit
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>
                        <span>Pledged: {matchedPool.currentQuantity} / {matchedPool.targetQuantity} units</span>
                        <span className="font-bold text-purple-600 dark:text-purple-400">
                          {Math.max(0, matchedPool.targetQuantity - matchedPool.currentQuantity)} units to unlock
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-linear-to-r from-purple-500 to-indigo-500 rounded-full transition-all"
                          style={{ width: `${poolPct}%` }}
                        />
                      </div>
                    </div>

                    {onJoinCollectiveDeal && (
                      <button
                        type="button"
                        onClick={() => onJoinCollectiveDeal(matchedPool)}
                        className="w-full py-2 px-3 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>Join Group Pool — Lock ₹{matchedPool.collectiveTargetPrice.toLocaleString('en-IN')}</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500">
                    No active collective group pool is currently open for this item. Volume bulk negotiation is available above.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* 6. AI ANALYSIS (Collapsible 3-Agent Results & Turns) */}
          <div
            className="rounded-2xl border overflow-hidden transition-all"
            style={{
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--border)',
            }}
          >
            <button
              type="button"
              onClick={() => setIsAiAnalysisOpen((prev) => !prev)}
              className="w-full p-3.5 flex items-center justify-between text-left cursor-pointer hover:bg-slate-500/5 transition-colors"
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-500 shrink-0" />
                <span className="font-display font-bold text-xs sm:text-sm" style={{ color: 'var(--text-primary)' }}>
                  View AI Analysis (3-Agent Pipeline)
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  3 Agents
                </span>
              </div>
              {isAiAnalysisOpen ? (
                <ChevronUp className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
              ) : (
                <ChevronDown className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
              )}
            </button>

            {isAiAnalysisOpen && (
              <div className="p-3.5 pt-0 space-y-2.5 text-xs border-t" style={{ borderColor: 'var(--border)' }}>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
                  {/* Agent 1 */}
                  <div
                    className="p-2.5 rounded-xl border space-y-1"
                    style={{ backgroundColor: 'var(--surface-elevated)', borderColor: 'var(--border)' }}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-[11px]" style={{ color: 'var(--accent)' }}>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span>01 Preference AI</span>
                    </div>
                    <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                      Budget constraint: ₹{effectiveMaxBudget.toLocaleString('en-IN')}. Category: {currentActiveProduct.category}.
                    </p>
                  </div>

                  {/* Agent 2 */}
                  <div
                    className="p-2.5 rounded-xl border space-y-1"
                    style={{ backgroundColor: 'var(--surface-elevated)', borderColor: 'var(--border)' }}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-[11px]" style={{ color: 'var(--accent)' }}>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span>02 Deal Hunter</span>
                    </div>
                    <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                      Verified {currentActiveProduct.sellerName} pricing. Rating: {currentActiveProduct.rating}★ with {currentActiveProduct.reviewsCount} reviews.
                    </p>
                  </div>

                  {/* Agent 3 */}
                  <div
                    className="p-2.5 rounded-xl border space-y-1"
                    style={{ backgroundColor: 'var(--surface-elevated)', borderColor: 'var(--border)' }}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-[11px]" style={{ color: 'var(--accent)' }}>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span>03 Negotiator AI</span>
                    </div>
                    <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                      Floor: ₹{(activeNegotiation?.floorPrice || Math.round(listPrice * 0.82)).toLocaleString('en-IN')}. Strategy: Bounded concession.
                    </p>
                  </div>
                </div>

                {/* Round-by-round exchange history if turns exist */}
                {activeNegotiation?.turns && activeNegotiation.turns.length > 0 && (
                  <div className="pt-2 border-t space-y-1.5" style={{ borderColor: 'var(--border)' }}>
                    <div className="text-[11px] font-mono font-bold" style={{ color: 'var(--text-secondary)' }}>
                      Exchange Turns History:
                    </div>
                    <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                      {activeNegotiation.turns.map((t, idx) => (
                        <div
                          key={idx}
                          className="px-2.5 py-1.5 rounded-lg text-[11px] flex items-center justify-between gap-2"
                          style={{
                            backgroundColor:
                              t.speaker === 'BUYER_AGENT'
                                ? 'rgba(37, 99, 235, 0.08)'
                                : 'rgba(22, 163, 74, 0.08)',
                          }}
                        >
                          <span className="truncate">{t.message}</span>
                          <span className="font-mono font-bold shrink-0">
                            ₹{t.price.toLocaleString('en-IN')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 7. VOICE CONTROLS (Collapsible, initialized on explicit click) */}
          {onVoiceUpdateTarget && onVoiceUpdateBudget && (
            <div
              className="rounded-2xl border overflow-hidden transition-all"
              style={{
                backgroundColor: 'var(--surface)',
                borderColor: 'var(--border)',
              }}
            >
              <button
                type="button"
                onClick={() => setIsVoiceControlsOpen((prev) => !prev)}
                className="w-full p-3.5 flex items-center justify-between text-left cursor-pointer hover:bg-slate-500/5 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Mic className="w-4 h-4 text-cyan-500 shrink-0" />
                  <span className="font-display font-bold text-xs sm:text-sm" style={{ color: 'var(--text-primary)' }}>
                    Voice Controls
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    Spoken Target & Budget
                  </span>
                </div>
                {isVoiceControlsOpen ? (
                  <ChevronUp className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                ) : (
                  <ChevronDown className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                )}
              </button>

              {isVoiceControlsOpen && (
                <div className="p-3.5 pt-0 border-t" style={{ borderColor: 'var(--border)' }}>
                  <div className="pt-2">
                    <VoiceNegotiationController
                      currentTargetPrice={targetPrice}
                      currentMaxBudget={effectiveMaxBudget}
                      floorPrice={activeNegotiation?.floorPrice}
                      productName={currentActiveProduct.name}
                      onUpdateTargetPrice={onVoiceUpdateTarget}
                      onUpdateMaxBudget={onVoiceUpdateBudget}
                      disabled={isCompleted}
                      isLight={theme.isLight}
                      compact={true}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 8. PRODUCT SPECIFICATIONS AND RETAILER DETAILS (Collapsible with Price Chart) */}
          <div
            className="rounded-2xl border overflow-hidden transition-all"
            style={{
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--border)',
            }}
          >
            <button
              type="button"
              onClick={() => setIsSpecsOpen((prev) => !prev)}
              className="w-full p-3.5 flex items-center justify-between text-left cursor-pointer hover:bg-slate-500/5 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-slate-500 shrink-0" />
                <span className="font-display font-bold text-xs sm:text-sm" style={{ color: 'var(--text-primary)' }}>
                  Product Specifications & Retailer Details
                </span>
              </div>
              {isSpecsOpen ? (
                <ChevronUp className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
              ) : (
                <ChevronDown className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
              )}
            </button>

            {isSpecsOpen && (
              <div className="p-3.5 pt-0 space-y-3 text-xs border-t" style={{ borderColor: 'var(--border)' }}>
                {/* Bullet specs */}
                <div className="pt-2 flex flex-wrap gap-1.5">
                  {bulletSpecs.map((spec, sIdx) => (
                    <span
                      key={sIdx}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium border"
                      style={{
                        backgroundColor: 'var(--surface-elevated)',
                        borderColor: 'var(--border)',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      <Check className="w-3.5 h-3.5" style={{ color: 'var(--success)' }} />
                      <span>{spec}</span>
                    </span>
                  ))}
                </div>

                <p className="leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {currentActiveProduct.description}
                </p>

                <div
                  className="grid grid-cols-2 gap-2 font-mono text-[11px] pt-2 border-t"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Seller: </span>
                    <strong style={{ color: 'var(--text-primary)' }}>{currentActiveProduct.sellerName}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Delivery: </span>
                    <strong style={{ color: 'var(--text-primary)' }}>
                      {currentActiveProduct.deliveryDays ? `${currentActiveProduct.deliveryDays} Days` : 'Standard'}
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Stock: </span>
                    <strong style={{ color: 'var(--text-primary)' }}>{currentActiveProduct.stock} units</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Warranty: </span>
                    <strong style={{ color: 'var(--text-primary)' }}>1 Year Verified</strong>
                  </div>
                </div>

                {/* Retailer Link if available */}
                {retailerLink && retailerLink !== '#' && (
                  <div className="pt-1">
                    <a
                      href={retailerLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-[11px] font-mono text-blue-500 hover:underline"
                    >
                      <span>View Retailer Page</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}

                {/* D3 Historical Price Trend Chart (Constrained Height) */}
                <div className="pt-2 border-t space-y-1.5" style={{ borderColor: 'var(--border)' }}>
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-[11px]" style={{ color: 'var(--accent)' }}>
                      30-Day Historical Price Trends
                    </span>
                    {onOpenProductDetails && (
                      <button
                        type="button"
                        onClick={() => onOpenProductDetails(currentActiveProduct)}
                        className="text-[11px] font-mono text-cyan-500 hover:underline cursor-pointer"
                      >
                        Expand Details ↗
                      </button>
                    )}
                  </div>
                  <div className="max-h-48 overflow-hidden rounded-xl border p-1" style={{ borderColor: 'var(--border)' }}>
                    <D3PriceTrendChart
                      products={[currentActiveProduct]}
                      targetPrice={targetPrice}
                      userBudget={effectiveMaxBudget}
                      height={160}
                      showTimeRangeSelector={false}
                      initialDays={30}
                      isLight={theme.isLight}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* =========================================================================
     MODE C: ALTERNATIVES MODE (Showing Close Alternatives for the Active Product)
     ========================================================================= */
  if (mode === 'alternatives') {
    const listToRender = alternativeCandidates.length > 0 ? alternativeCandidates : candidates.slice(0, 6);

    return (
      <div className="flex flex-col h-full overflow-hidden" style={{ color: 'var(--text-primary)' }}>
        {/* Header */}
        <div
          className="p-3.5 sm:p-4 border-b shrink-0 space-y-2 transition-colors"
          style={{
            backgroundColor: 'var(--surface-elevated)',
            borderColor: 'var(--border)',
          }}
        >
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <span
                className="font-display font-bold text-sm sm:text-base tracking-tight"
                style={{ color: 'var(--text-primary)' }}
              >
                {currentActiveProduct
                  ? `Alternatives to ${currentActiveProduct.name.split(' ').slice(0, 3).join(' ')}`
                  : 'Alternatives'}
              </span>
              <span
                className="px-2 py-0.5 rounded-full text-xs font-mono font-bold"
                style={{
                  backgroundColor: 'rgba(37, 99, 235, 0.12)',
                  color: 'var(--accent)',
                  border: '1px solid rgba(37, 99, 235, 0.25)',
                }}
              >
                {listToRender.length} {listToRender.length === 1 ? 'match' : 'matches'}
              </span>
            </div>

            {currentActiveProduct && onBackToActiveDeal && (
              <button
                type="button"
                onClick={onBackToActiveDeal}
                className="px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors border"
                style={{
                  backgroundColor: 'var(--surface)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-primary)',
                }}
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Active Deal</span>
              </button>
            )}
          </div>

          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {currentActiveProduct
              ? `Alternative recommendations matching or underpricing ${currentActiveProduct.name}.`
              : 'Alternative options matching your requirements.'}
          </p>
        </div>

        {/* Alternative Product Cards List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 min-h-0">
          {listToRender.map((cand) => {
            const p = cand.product;
            const bulletSpecs = getKeyBulletSpecs(p);

            return (
              <div
                key={p.id}
                className="p-3.5 rounded-2xl border transition-all duration-200"
                style={{
                  backgroundColor: 'var(--surface)',
                  borderColor: 'var(--border)',
                }}
              >
                <div className="flex items-start gap-3">
                  <img
                    src={p.image}
                    alt={p.name}
                    className="w-16 h-16 rounded-xl object-cover shrink-0 border"
                    style={{ borderColor: 'var(--border)' }}
                  />

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] font-mono uppercase tracking-wider font-semibold" style={{ color: 'var(--text-muted)' }}>
                        {p.brand}
                      </span>
                      <div className="flex items-center gap-1 text-xs font-bold text-amber-500">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span>{p.rating}</span>
                      </div>
                    </div>

                    <h4 className="font-display font-bold text-xs sm:text-sm line-clamp-1" style={{ color: 'var(--text-primary)' }}>
                      {p.name}
                    </h4>

                    <div className="flex items-baseline gap-2">
                      <span className="text-base font-mono font-extrabold" style={{ color: 'var(--accent)' }}>
                        ₹{p.listPrice.toLocaleString('en-IN')}
                      </span>
                      {currentActiveProduct && p.listPrice < currentActiveProduct.listPrice && (
                        <span className="text-[10px] font-mono font-bold" style={{ color: 'var(--success)' }}>
                          ₹{(currentActiveProduct.listPrice - p.listPrice).toLocaleString('en-IN')} cheaper
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Specs */}
                <div className="mt-2 flex flex-wrap gap-1 text-[11px]">
                  {bulletSpecs.slice(0, 2).map((sp, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md border"
                      style={{
                        backgroundColor: 'var(--surface-elevated)',
                        borderColor: 'var(--border)',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      {sp}
                    </span>
                  ))}
                </div>

                {/* Actions */}
                <div className="mt-2.5 pt-2 border-t flex items-center justify-end gap-2" style={{ borderColor: 'var(--border)' }}>
                  <button
                    type="button"
                    onClick={() => {
                      if (onSelectAlternative) {
                        onSelectAlternative(cand);
                      } else {
                        onSelectProduct(cand);
                      }
                    }}
                    className="w-full py-2 px-3 rounded-xl text-white font-display font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-xs hover:brightness-110 active:scale-[0.98]"
                    style={{ backgroundColor: 'var(--accent)' }}
                  >
                    <Zap className="w-3.5 h-3.5 fill-current" />
                    <span>Open Deal Analyzer</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  /* =========================================================================
     STATE 1: NO SEARCH (Initial Exploration State - Requirement #3)
     ========================================================================= */
  if (mode === 'no_search' || (mode === 'discovery' && !hasSearched)) {
    return (
      <div className="flex flex-col h-full overflow-hidden" style={{ color: 'var(--text-primary)' }}>
        {/* Header */}
        <div
          className="p-3.5 sm:p-4 border-b shrink-0 flex items-center justify-between gap-2"
          style={{
            backgroundColor: 'var(--surface-elevated)',
            borderColor: 'var(--border)',
          }}
        >
          <div className="flex items-center gap-2">
            <span
              className="font-display font-bold text-sm sm:text-base tracking-tight"
              style={{ color: 'var(--text-primary)' }}
            >
              Product Discovery
            </span>
            <span
              className="px-2 py-0.5 rounded-full text-xs font-mono font-medium"
              style={{
                backgroundColor: 'rgba(37, 99, 235, 0.08)',
                color: 'var(--accent)',
                border: '1px solid rgba(37, 99, 235, 0.2)',
              }}
            >
              Ready to search
            </span>
          </div>
        </div>

        {/* Scrollable Discovery Welcome State */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          <div
            className="p-5 sm:p-6 rounded-2xl border text-center space-y-3 shadow-2xs"
            style={{
              backgroundColor: 'var(--surface-elevated)',
              borderColor: 'var(--border)',
            }}
          >
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto"
              style={{
                backgroundColor: 'rgba(37, 99, 235, 0.12)',
                color: 'var(--accent)',
              }}
            >
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-display font-bold text-base sm:text-lg" style={{ color: 'var(--text-primary)' }}>
                Tell us what you're looking for.
              </h3>
              <p className="text-xs sm:text-sm max-w-md mx-auto leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                Search for any product, category, or budget in the chat or click an example prompt below. DealMate AI scans verified stores and negotiates the best price on your behalf.
              </p>
            </div>
          </div>

          {/* Example Prompts */}
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-accent" />
              Example Prompts
            </span>
            <div className="grid grid-cols-1 gap-2">
              {[
                'Find wireless earbuds under ₹2,000',
                'I need a gaming laptop under ₹60,000 with RTX graphics, 16GB RAM, 512GB SSD',
                'Find me Nike running shoes under ₹3,000',
                'Find me a wireless mechanical gaming keyboard under ₹4,500',
              ].map((promptText, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onExecutePrompt && onExecutePrompt(promptText)}
                  className="p-3 rounded-xl border text-left flex items-center justify-between gap-3 text-xs font-medium cursor-pointer transition-all hover:scale-[1.01]"
                  style={{
                    backgroundColor: 'var(--surface)',
                    borderColor: 'var(--border)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <span className="truncate">{promptText}</span>
                  <span className="text-[11px] font-semibold shrink-0 text-accent flex items-center gap-0.5">
                    Search <ChevronDown className="w-3.5 h-3.5 -rotate-90" />
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Curated / Trending Categories (Displayed ONLY in STATE 1: NO SEARCH) */}
          <div className="space-y-2 pt-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-accent" />
              Trending Categories
            </span>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Wireless Earbuds', sub: 'Under ₹2,000', prompt: 'Find wireless earbuds under ₹2,000' },
                { label: 'RTX Gaming Laptops', sub: 'Under ₹60,000', prompt: 'I need a gaming laptop under ₹60,000 with RTX graphics, 16GB RAM, 512GB SSD' },
                { label: 'Running Shoes', sub: 'Under ₹3,000', prompt: 'Find me Nike running shoes under ₹3,000' },
                { label: 'Smartwatches', sub: 'Under ₹4,500', prompt: 'Find titanium smartwatch with AMOLED display under ₹4,500' },
              ].map((cat, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onExecutePrompt && onExecutePrompt(cat.prompt)}
                  className="p-2.5 rounded-xl border text-left space-y-0.5 cursor-pointer transition-all hover:border-accent"
                  style={{
                    backgroundColor: 'var(--surface)',
                    borderColor: 'var(--border)',
                  }}
                >
                  <div className="font-semibold text-xs truncate" style={{ color: 'var(--text-primary)' }}>
                    {cat.label}
                  </div>
                  <div className="text-[11px] font-mono text-accent">
                    {cat.sub}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* =========================================================================
     PRODUCT CARD RENDERER (Reusable for Exact Matches & Near Budget Section)
     ========================================================================= */
  const renderProductCard = (cand: DealHunterProductCandidate, isNearBudgetSection = false) => {
    const p = cand.product;
    const isSelected = selectedProductId === p.id;
    const isHighlighted = highlightedProductId === p.id;
    const isExternal = cand.listingOrigin === 'EXTERNAL_RETAILER';
    const isCompared = comparedProductIds.includes(p.id);

    return (
      <div
        key={p.id}
        id={`product-card-${p.id}`}
        className="p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 shadow-2xs hover:shadow-md"
        style={{
          backgroundColor: isHighlighted || isSelected ? 'var(--surface-elevated)' : 'var(--surface)',
          borderColor: isHighlighted
            ? 'var(--accent)'
            : isSelected
            ? 'var(--border-strong)'
            : isNearBudgetSection
            ? 'rgba(245, 158, 11, 0.4)'
            : 'var(--border)',
          boxShadow: isHighlighted ? '0 0 0 2px rgba(37, 99, 235, 0.25)' : undefined,
        }}
      >
        {/* Header Tag: Source + Badges + Rating */}
        <div
          className="flex items-center justify-between gap-2 pb-2 mb-2.5 border-b"
          style={{ borderColor: 'var(--border)' }}
        >
          <div className="flex items-center gap-1.5 flex-wrap">
            {isExternal ? (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold border"
                style={{
                  backgroundColor: 'var(--surface-elevated)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-secondary)',
                }}
              >
                <ExternalLink className="w-3 h-3 text-blue-500" />
                <span>{cand.retailerName}</span>
              </span>
            ) : (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold border"
                style={{
                  backgroundColor: 'rgba(22, 163, 74, 0.08)',
                  borderColor: 'rgba(22, 163, 74, 0.25)',
                  color: 'var(--success)',
                }}
              >
                <Store className="w-3 h-3" />
                <span>DealMate Store • {p.isLocalStore ? '📍 Verified Local' : 'Direct'}</span>
              </span>
            )}

            {isNearBudgetSection && (
              <span
                className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold border"
                style={{
                  backgroundColor: 'rgba(245, 158, 11, 0.1)',
                  borderColor: 'rgba(245, 158, 11, 0.3)',
                  color: '#D97706',
                }}
              >
                Near Budget
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 text-xs font-bold text-amber-500 shrink-0">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span>{p.rating}</span>
            {p.reviewsCount > 0 && (
              <span className="text-[10px] font-normal text-slate-500 dark:text-slate-400">
                ({p.reviewsCount.toLocaleString('en-IN')})
              </span>
            )}
          </div>
        </div>

        {/* Main Product Info: Image + Name + Price */}
        <div className="flex items-start gap-3">
          <img
            src={p.image}
            alt={p.name}
            className="w-18 h-18 sm:w-20 sm:h-20 rounded-xl object-cover shrink-0 border"
            style={{ borderColor: 'var(--border)' }}
            loading="lazy"
          />

          <div className="min-w-0 flex-1 space-y-1.5">
            <h4
              className="font-display font-bold text-xs sm:text-sm leading-snug line-clamp-2"
              style={{ color: 'var(--text-primary)' }}
            >
              {p.name}
            </h4>

            {/* Price and Original MRP */}
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-base sm:text-lg font-mono font-extrabold" style={{ color: 'var(--accent)' }}>
                ₹{p.listPrice.toLocaleString('en-IN')}
              </span>
              {p.marketPrice > p.listPrice && (
                <span className="text-xs font-mono line-through" style={{ color: 'var(--text-muted)' }}>
                  ₹{p.marketPrice.toLocaleString('en-IN')}
                </span>
              )}
              {p.marketPrice > p.listPrice && (
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Save ₹{(p.marketPrice - p.listPrice).toLocaleString('en-IN')}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action: Single prominent 'Open Deal Analyzer' button navigating to Deal Analyzer */}
        <div className="mt-3.5 pt-2.5 border-t flex items-center gap-2" style={{ borderColor: 'var(--border)' }}>
          {onToggleCompare && (
            <button
              type="button"
              onClick={() => onToggleCompare(p)}
              className="p-2.5 rounded-xl border text-xs cursor-pointer transition-colors"
              style={{
                backgroundColor: isCompared ? 'var(--accent)' : 'var(--surface-elevated)',
                borderColor: isCompared ? 'var(--accent)' : 'var(--border)',
                color: isCompared ? '#FFFFFF' : 'var(--text-secondary)',
              }}
              title={isCompared ? 'Remove from compare' : 'Add to compare'}
            >
              <Layers className="w-4 h-4" />
            </button>
          )}

          {cand.retailerUrl && cand.retailerUrl !== '#' && (
            <a
              href={cand.retailerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 rounded-xl border text-xs cursor-pointer transition-colors hover:bg-slate-500/10 flex items-center justify-center"
              style={{
                backgroundColor: 'var(--surface-elevated)',
                borderColor: 'var(--border)',
                color: 'var(--text-secondary)',
              }}
              title={`Visit ${cand.retailerName} website directly`}
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}

          <button
            type="button"
            onClick={() => onSelectProduct(cand)}
            className="flex-1 py-2.5 px-4 rounded-xl text-white font-display font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition-all shadow-xs hover:brightness-110 active:scale-[0.98]"
            style={{ backgroundColor: 'var(--accent)' }}
            title="Open Deal Analyzer for this product"
          >
            <Zap className="w-4 h-4 fill-current" />
            <span>Open Deal Analyzer</span>
          </button>
        </div>
      </div>
    );
  };

  /* =========================================================================
     STATE 2: SEARCH RESULTS MODE (Rendering ONLY new search results - Requirement #1, #2, #8)
     ========================================================================= */
  const exactBudgetMatches = userBudget
    ? visibleCandidates.filter((c) => c.product.listPrice <= userBudget)
    : visibleCandidates;
  const nearBudgetMatches = userBudget
    ? visibleCandidates.filter((c) => c.product.listPrice > userBudget)
    : [];

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ color: 'var(--text-primary)' }}>
      {/* 1. Header with Matches Count and Controls */}
      <div
        className="p-3.5 sm:p-4 border-b shrink-0 space-y-2.5 transition-colors"
        style={{
          backgroundColor: 'var(--surface-elevated)',
          borderColor: 'var(--border)',
        }}
      >
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <span
              className="font-display font-bold text-sm sm:text-base tracking-tight truncate max-w-[240px]"
              style={{ color: 'var(--text-primary)' }}
              title={searchQuery ? `Results for "${searchQuery}"` : 'Search Results'}
            >
              {searchQuery ? `Results for "${searchQuery}"` : 'Search Results'}
            </span>
            <span
              className="px-2 py-0.5 rounded-full text-xs font-mono font-bold"
              style={{
                backgroundColor: 'rgba(37, 99, 235, 0.12)',
                color: 'var(--accent)',
                border: '1px solid rgba(37, 99, 235, 0.25)',
              }}
            >
              {totalCount} {totalCount === 1 ? 'match' : 'matches'}
            </span>
            {visibleCandidates.some((c) => c.isSerpApiLive) ? (
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live SerpAPI
              </span>
            ) : visibleCandidates.some((c) => c.isFallbackData) ? (
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25">
                Fallback Catalog
              </span>
            ) : null}
            {hasExplicitBudget && userBudget && userBudget > 0 ? (
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/25">
                Budget: ≤ ₹{userBudget.toLocaleString('en-IN')}
              </span>
            ) : (
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono text-slate-500 dark:text-slate-400 border border-slate-500/20">
                All Prices
              </span>
            )}
          </div>

          {/* Side-by-side Compare Launcher if items selected */}
          {comparedProductIds.length >= 2 && onOpenCompareModal && (
            <button
              type="button"
              onClick={onOpenCompareModal}
              className="px-2.5 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Compare Selected ({comparedProductIds.length})</span>
            </button>
          )}
        </div>

        {/* Sort & Filter Controls */}
        <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
          {/* Sort tabs */}
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-[11px] font-semibold mr-1" style={{ color: 'var(--text-secondary)' }}>
              Sort:
            </span>
            {[
              { id: 'best_match', label: 'Best Match' },
              { id: 'lowest_price', label: 'Lowest Price' },
              { id: 'highest_rating', label: 'Rating' },
              { id: 'best_deal', label: 'Best Deal' },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => onChangeSort(opt.id as ProductSortOption)}
                className="px-2.5 py-1 rounded-lg font-semibold text-[11px] cursor-pointer transition-all border"
                style={{
                  backgroundColor:
                    activeSort === opt.id ? 'var(--accent)' : 'var(--surface)',
                  color: activeSort === opt.id ? '#FFFFFF' : 'var(--text-secondary)',
                  borderColor:
                    activeSort === opt.id ? 'var(--accent)' : 'var(--border)',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Filter options */}
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-[11px] font-semibold mr-1" style={{ color: 'var(--text-secondary)' }}>
              Filter:
            </span>
            {[
              { id: 'all', label: 'All' },
              { id: 'group_deals', label: '👥 Group Deals' },
              { id: 'negotiable', label: '🤝 Negotiable' },
              { id: 'local', label: '📍 Local' },
              { id: 'rating_4', label: '★ 4.5+' },
            ].map((flt) => (
              <button
                key={flt.id}
                type="button"
                onClick={() => onChangeFilter(flt.id as ProductFilterOption)}
                className="px-2 py-0.5 rounded-lg text-[11px] font-medium cursor-pointer transition-colors border"
                style={{
                  backgroundColor:
                    activeFilter === flt.id ? 'var(--text-primary)' : 'transparent',
                  color:
                    activeFilter === flt.id ? 'var(--surface)' : 'var(--text-secondary)',
                  borderColor:
                    activeFilter === flt.id ? 'var(--text-primary)' : 'var(--border)',
                }}
              >
                {flt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Scrollable Container */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3.5 min-h-0">
        {/* Loading Skeletons - Requirement #11 (Immediate Clear & Loader) */}
        {isSearching && (
          <div className="space-y-3">
            <div
              className="p-3 rounded-xl border flex items-center gap-2 text-xs font-semibold"
              style={{
                backgroundColor: 'rgba(37, 99, 235, 0.08)',
                borderColor: 'rgba(37, 99, 235, 0.25)',
                color: 'var(--accent)',
              }}
            >
              <Sparkles className="w-4 h-4 animate-spin" />
              <span>Searching for {searchQuery ? `"${searchQuery}"` : 'products'} across verified catalog & live feeds...</span>
            </div>
            {/* Animated Product Skeleton Placeholders */}
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className="p-4 rounded-2xl border animate-pulse space-y-3"
                style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-xl bg-slate-200 dark:bg-slate-800 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-md w-3/4" />
                    <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded-md w-1/3" />
                  </div>
                </div>
                <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-lg w-full" />
              </div>
            ))}
          </div>
        )}

        {/* Empty State - Requirement #12 (NO Fallback Products!) */}
        {!isSearching && visibleCandidates.length === 0 && (
          <div
            className="p-6 rounded-2xl border text-center space-y-3.5"
            style={{
              backgroundColor: 'var(--surface-elevated)',
              borderColor: 'var(--border)',
              color: 'var(--text-primary)',
            }}
          >
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto">
              <Search className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="font-display font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                {hasExplicitBudget && userBudget && userBudget > 0
                  ? `No exact matches found under ₹${userBudget.toLocaleString('en-IN')}`
                  : `No matching products found for ${searchQuery ? `"${searchQuery}"` : 'your query'}`}
              </h4>
              <p className="text-xs max-w-sm mx-auto" style={{ color: 'var(--text-muted)' }}>
                {hasExplicitBudget && userBudget && userBudget > 0
                  ? `I searched verified stores for products within ₹${userBudget.toLocaleString('en-IN')}, but couldn't find items in this price bracket. You can adjust your budget or search wider.`
                  : "I couldn't find products matching your query across searched stores. Try modifying your search keywords or checking the suggested category budget."}
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 flex-wrap pt-1">
              {suggestedBudget && (!hasExplicitBudget || !userBudget) && onAdjustBudget && (
                <button
                  type="button"
                  onClick={() => onAdjustBudget(suggestedBudget)}
                  className="px-3 py-1.5 rounded-xl text-white text-xs font-semibold cursor-pointer shadow-xs"
                  style={{ backgroundColor: 'var(--accent)' }}
                >
                  Set Suggested Budget (₹{suggestedBudget.toLocaleString('en-IN')})
                </button>
              )}
              {onBroadenSearch && (
                <button
                  type="button"
                  onClick={onBroadenSearch}
                  className="px-3 py-1.5 rounded-xl text-white text-xs font-semibold cursor-pointer shadow-xs"
                  style={{ backgroundColor: 'var(--accent)' }}
                >
                  Broaden Search
                </button>
              )}
              {userBudget && onAdjustBudget && (
                <button
                  type="button"
                  onClick={() => onAdjustBudget(Math.round(userBudget * 1.25))}
                  className="px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer"
                  style={{
                    backgroundColor: 'var(--surface)',
                    borderColor: 'var(--border)',
                    color: 'var(--text-primary)',
                  }}
                >
                  Increase Budget (+25%)
                </button>
              )}
              {onFindAlternatives && (
                <button
                  type="button"
                  onClick={onFindAlternatives}
                  className="px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer"
                  style={{
                    backgroundColor: 'var(--surface)',
                    borderColor: 'var(--border)',
                    color: 'var(--text-primary)',
                  }}
                >
                  Try Similar Products
                </button>
              )}
            </div>
          </div>
        )}

        {/* Budget Isolation - Requirement #8 (Separate Exact Matches & Near Budget Sections) */}
        {!isSearching && visibleCandidates.length > 0 && (
          <>
            {/* Case A: User specified budget, but 0 exact matches under budget */}
            {userBudget && exactBudgetMatches.length === 0 && nearBudgetMatches.length > 0 && (
              <div
                className="p-4 rounded-2xl border text-center space-y-2.5 mb-2"
                style={{
                  backgroundColor: 'rgba(245, 158, 11, 0.06)',
                  borderColor: 'rgba(245, 158, 11, 0.3)',
                }}
              >
                <div className="text-xs font-bold text-amber-700 dark:text-amber-400">
                  No exact matches found under ₹{userBudget.toLocaleString('en-IN')}.
                </div>
                <p className="text-[11px] max-w-sm mx-auto" style={{ color: 'var(--text-muted)' }}>
                  Found {nearBudgetMatches.length} options slightly above your budget that may be negotiable into your price range.
                </p>
                <div className="flex items-center justify-center gap-2 flex-wrap pt-0.5">
                  {onAdjustBudget && (
                    <button
                      type="button"
                      onClick={() => onAdjustBudget(Math.round(userBudget * 1.25))}
                      className="px-2.5 py-1 rounded-lg text-white text-xs font-semibold cursor-pointer"
                      style={{ backgroundColor: 'var(--accent)' }}
                    >
                      Increase Budget (+25%)
                    </button>
                  )}
                  {onFindAlternatives && (
                    <button
                      type="button"
                      onClick={onFindAlternatives}
                      className="px-2.5 py-1 rounded-lg border text-xs font-semibold cursor-pointer"
                      style={{
                        backgroundColor: 'var(--surface)',
                        borderColor: 'var(--border)',
                        color: 'var(--text-primary)',
                      }}
                    >
                      Find Similar
                    </button>
                  )}
                  {onBroadenSearch && (
                    <button
                      type="button"
                      onClick={onBroadenSearch}
                      className="px-2.5 py-1 rounded-lg border text-xs font-semibold cursor-pointer"
                      style={{
                        backgroundColor: 'var(--surface)',
                        borderColor: 'var(--border)',
                        color: 'var(--text-primary)',
                      }}
                    >
                      Search Wider
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Exact Matches List */}
            {exactBudgetMatches.length > 0 && (
              <div className="space-y-3.5">
                {exactBudgetMatches.map((cand) => renderProductCard(cand, false))}
              </div>
            )}

            {/* Clearly Separated "Near Your Budget" Section - Requirement #8 */}
            {nearBudgetMatches.length > 0 && (
              <div className="pt-4 mt-4 border-t space-y-3" style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-center justify-between text-xs font-semibold text-amber-600 dark:text-amber-400">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Near Your Budget (Above ₹{userBudget?.toLocaleString('en-IN')})
                  </span>
                  <span className="text-[11px] font-mono text-muted">
                    May be negotiable into budget
                  </span>
                </div>
                <div className="space-y-3.5">
                  {nearBudgetMatches.map((cand) => renderProductCard(cand, true))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Pagination / Load More Button */}
        {!isSearching && totalCount > displayedCount && (
          <div className="pt-2 pb-4 text-center space-y-2">
            <p className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
              Showing {Math.min(displayedCount, totalCount)} of {totalCount} matches
            </p>
            <button
              type="button"
              onClick={onLoadMore}
              className="px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer shadow-xs"
              style={{
                backgroundColor: 'var(--surface)',
                borderColor: 'var(--border)',
                color: 'var(--text-primary)',
              }}
            >
              Load More Products ({totalCount - displayedCount} remaining)
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
