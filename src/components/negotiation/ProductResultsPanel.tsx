import React, { useState } from 'react';
import {
  Product,
  CollectiveDealPool,
  CategoryNegotiationSetting,
  BulkDiscountTier,
} from '../../types';
import { ThemeConfig } from '../../types/theme';
import { PriceSparkline } from '../common/PriceSparkline';
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
} from 'lucide-react';

export type ProductSortOption = 'best_match' | 'lowest_price' | 'highest_rating' | 'best_deal';
export type ProductFilterOption = 'all' | 'negotiable' | 'local' | 'rating_4';
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
}) => {
  const [expandedDetailsId, setExpandedDetailsId] = useState<string | null>(null);

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
     MODE B: ACTIVE PRODUCT / NEGOTIATION MODE (No Unrelated Products!)
     ========================================================================= */
  if (mode === 'negotiation' && currentActiveProduct) {
    const isCompleted = activeNegotiation?.status === 'COMPLETED';
    const isNegotiating = activeNegotiation?.status === 'NEGOTIATING';
    const bulletSpecs = getKeyBulletSpecs(currentActiveProduct);
    const isExpanded = expandedDetailsId === currentActiveProduct.id;

    const listPrice = currentActiveProduct.listPrice;
    const marketPrice = currentActiveProduct.marketPrice;
    const settledPrice = activeNegotiation?.settledPrice || listPrice;
    const targetPrice = activeNegotiation?.targetPrice || Math.round(listPrice * 0.85);
    const savings = isCompleted
      ? activeNegotiation?.savings || Math.max(0, listPrice - settledPrice)
      : Math.max(0, listPrice - targetPrice);

    return (
      <div className="flex flex-col h-full overflow-hidden" style={{ color: 'var(--text-primary)' }}>
        {/* Active Deal Header */}
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
                className="px-2.5 py-1 rounded-full text-xs font-mono font-bold flex items-center gap-1.5"
                style={{
                  backgroundColor: isCompleted
                    ? 'rgba(22, 163, 74, 0.12)'
                    : 'rgba(37, 99, 235, 0.12)',
                  color: isCompleted ? 'var(--success)' : 'var(--accent)',
                  border: `1px solid ${isCompleted ? 'rgba(22, 163, 74, 0.3)' : 'rgba(37, 99, 235, 0.3)'}`,
                }}
              >
                {isCompleted ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>DEAL SECURED</span>
                  </>
                ) : isNegotiating ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
                    <span>ACTIVE NEGOTIATION</span>
                  </>
                ) : (
                  <>
                    <Tag className="w-3.5 h-3.5" />
                    <span>ACTIVE DEAL</span>
                  </>
                )}
              </span>
              <span className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>
                Targeting 1 Product
              </span>
            </div>

            <div className="flex items-center gap-2">
              {onBackToDiscovery && (
                <button
                  type="button"
                  onClick={onBackToDiscovery}
                  className="px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors border"
                  style={{
                    backgroundColor: 'var(--surface)',
                    borderColor: 'var(--border)',
                    color: 'var(--text-secondary)',
                  }}
                  title="Browse discovery results"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Discovery ({candidates.length})</span>
                </button>
              )}
            </div>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            DealMate is negotiating exclusively for this item. Unrelated recommendations are hidden.
          </p>
        </div>

        {/* Scrollable Container with ONLY the active product & its negotiation protocol */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 space-y-4 min-h-0">
          {/* Main Active Product Card */}
          <div
            className="p-4 rounded-2xl border shadow-sm space-y-3.5"
            style={{
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--border-strong)',
            }}
          >
            {/* Header: Store Origin & Rating */}
            <div
              className="flex items-center justify-between gap-2 pb-2.5 border-b"
              style={{ borderColor: 'var(--border)' }}
            >
              <div className="flex items-center gap-1.5 flex-wrap">
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold"
                  style={{
                    backgroundColor: 'rgba(22, 163, 74, 0.1)',
                    color: 'var(--success)',
                    border: '1px solid rgba(22, 163, 74, 0.25)',
                  }}
                >
                  <Store className="w-3 h-3" />
                  <span>
                    {currentActiveProduct.sellerName} • {currentActiveProduct.isLocalStore ? '📍 Verified Local' : 'DealMate Store'}
                  </span>
                </span>
                <span
                  className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold"
                  style={{
                    backgroundColor: 'rgba(37, 99, 235, 0.1)',
                    color: 'var(--accent)',
                    border: '1px solid rgba(37, 99, 235, 0.25)',
                  }}
                >
                  <Zap className="w-3 h-3" />
                  <span>Eligible for Bargain</span>
                </span>
              </div>

              <div className="flex items-center gap-1 text-xs font-bold text-amber-500">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>{currentActiveProduct.rating}</span>
                <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                  ({currentActiveProduct.reviewsCount})
                </span>
              </div>
            </div>

            {/* Product Image + Title + Pricing */}
            <div className="flex items-start gap-3.5">
              <img
                src={currentActiveProduct.image}
                alt={currentActiveProduct.name}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover shrink-0 border"
                style={{ borderColor: 'var(--border)' }}
              />

              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="text-[10px] font-mono uppercase tracking-wider font-bold" style={{ color: 'var(--text-muted)' }}>
                  {currentActiveProduct.brand}
                </div>
                <h3
                  className="font-display font-bold text-sm sm:text-base leading-snug"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {currentActiveProduct.name}
                </h3>

                {/* Price Matrix */}
                <div className="flex items-baseline gap-2.5 flex-wrap pt-0.5">
                  {isCompleted ? (
                    <>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                          Final:
                        </span>
                        <span className="text-xl sm:text-2xl font-mono font-extrabold" style={{ color: 'var(--success)' }}>
                          ₹{settledPrice.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <span className="text-xs font-mono line-through" style={{ color: 'var(--text-muted)' }}>
                        ₹{listPrice.toLocaleString('en-IN')}
                      </span>
                      <span
                        className="px-2 py-0.5 rounded-md text-xs font-mono font-bold"
                        style={{
                          backgroundColor: 'rgba(22, 163, 74, 0.15)',
                          color: 'var(--success)',
                        }}
                      >
                        Saved ₹{savings.toLocaleString('en-IN')}!
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-lg sm:text-xl font-mono font-extrabold" style={{ color: 'var(--text-primary)' }}>
                        ₹{listPrice.toLocaleString('en-IN')}
                      </span>
                      {marketPrice > listPrice && (
                        <span className="text-xs font-mono line-through" style={{ color: 'var(--text-muted)' }}>
                          ₹{marketPrice.toLocaleString('en-IN')}
                        </span>
                      )}
                      <span
                        className="px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold"
                        style={{
                          backgroundColor: 'rgba(37, 99, 235, 0.12)',
                          color: 'var(--accent)',
                        }}
                      >
                        Target: ₹{targetPrice.toLocaleString('en-IN')}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* ADVANCED NEGOTIATION 2.0: Order Quantity & Mode Selector */}
            <div className="pt-2 border-t flex flex-wrap items-center justify-between gap-2" style={{ borderColor: 'var(--border)' }}>
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

              {/* Quick volume chips */}
              <div className="flex items-center gap-1 text-[10px] font-mono">
                {[1, 3, 5, 10, 25].map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => onChangeQuantity && onChangeQuantity(q)}
                    className={`px-2 py-0.5 rounded-md border font-semibold cursor-pointer transition-colors ${
                      quantity === q
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-slate-300 dark:border-slate-700 hover:bg-slate-500/10'
                    }`}
                  >
                    {q === 1 ? '1 unit' : `${q}u (Bulk)`}
                  </button>
                ))}
              </div>
            </div>

            {/* Bullet Specifications */}
            <div className="pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
              <div className="flex flex-wrap gap-1.5 text-xs">
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
            </div>

            {/* Description & Seller terms */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setExpandedDetailsId(isExpanded ? null : currentActiveProduct.id)}
                className="text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                style={{ color: 'var(--accent)' }}
              >
                <span>{isExpanded ? 'Hide Product Details' : 'View Full Details & Specs'}</span>
                {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {isExpanded && (
                <div
                  className="mt-2.5 p-3 rounded-xl border text-xs space-y-2 leading-relaxed"
                  style={{
                    backgroundColor: 'var(--surface-elevated)',
                    borderColor: 'var(--border)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  <p>{currentActiveProduct.description}</p>
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
                </div>
              )}
            </div>
          </div>

          {/* Negotiation Protocol Status Block */}
          <div
            className="p-4 rounded-2xl border space-y-3"
            style={{
              backgroundColor: isCompleted
                ? 'rgba(22, 163, 74, 0.04)'
                : 'var(--surface)',
              borderColor: isCompleted ? 'rgba(22, 163, 74, 0.4)' : 'var(--border)',
            }}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider" style={{ color: 'var(--accent)' }}>
                Buyer AI ↔ Seller AI Protocol
              </span>
              <span
                className="text-xs font-mono font-bold px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: isCompleted ? 'rgba(22, 163, 74, 0.15)' : 'rgba(37, 99, 235, 0.12)',
                  color: isCompleted ? 'var(--success)' : 'var(--accent)',
                }}
              >
                {isCompleted ? '✓ Negotiation Complete' : isNegotiating ? '⚡ Counter-Offer in Progress' : 'Ready'}
              </span>
            </div>

            {/* Protocol Metrics */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
              <div
                className="p-2.5 rounded-xl border"
                style={{ backgroundColor: 'var(--surface-elevated)', borderColor: 'var(--border)' }}
              >
                <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                  Original
                </div>
                <div className="font-bold line-through" style={{ color: 'var(--text-secondary)' }}>
                  ₹{listPrice.toLocaleString('en-IN')}
                </div>
              </div>

              <div
                className="p-2.5 rounded-xl border"
                style={{ backgroundColor: 'var(--surface-elevated)', borderColor: 'var(--border)' }}
              >
                <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                  AI Target
                </div>
                <div className="font-bold" style={{ color: 'var(--accent)' }}>
                  ₹{targetPrice.toLocaleString('en-IN')}
                </div>
              </div>

              <div
                className="p-2.5 rounded-xl border"
                style={{
                  backgroundColor: isCompleted ? 'rgba(22, 163, 74, 0.12)' : 'var(--surface-elevated)',
                  borderColor: isCompleted ? 'rgba(22, 163, 74, 0.3)' : 'var(--border)',
                }}
              >
                <div className="text-[10px]" style={{ color: isCompleted ? 'var(--success)' : 'var(--text-muted)' }}>
                  {isCompleted ? 'Settled' : 'Floor'}
                </div>
                <div className="font-bold text-sm" style={{ color: isCompleted ? 'var(--success)' : 'var(--text-primary)' }}>
                  ₹{(isCompleted ? settledPrice : activeNegotiation?.floorPrice || Math.round(listPrice * 0.78)).toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            {/* Protocol Rounds / Status Note */}
            {isCompleted ? (
              <div
                className="p-3 rounded-xl border text-xs leading-relaxed"
                style={{
                  backgroundColor: 'rgba(22, 163, 74, 0.08)',
                  borderColor: 'rgba(22, 163, 74, 0.25)',
                  color: 'var(--text-primary)',
                }}
              >
                <div className="font-bold flex items-center gap-1.5" style={{ color: 'var(--success)' }}>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Deal Settled & Locked at ₹{settledPrice.toLocaleString('en-IN')}</span>
                </div>
                <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>
                  You save ₹{savings.toLocaleString('en-IN')} off current seller pricing. This negotiated price is guaranteed for immediate checkout.
                </p>
              </div>
            ) : isNegotiating ? (
              <div
                className="p-3 rounded-xl border text-xs flex items-center gap-2"
                style={{
                  backgroundColor: 'rgba(37, 99, 235, 0.08)',
                  borderColor: 'rgba(37, 99, 235, 0.25)',
                  color: 'var(--accent)',
                }}
              >
                <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                <span>Exchanging algorithmic offers with {currentActiveProduct.sellerName} AI...</span>
              </div>
            ) : null}
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-1">
            {isCompleted ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    if (onAnalyzeDeal && currentActiveProduct) {
                      onAnalyzeDeal(currentActiveProduct, settledPrice);
                    } else if (onOptimizeDeal && currentActiveProduct) {
                      onOptimizeDeal(currentActiveProduct, settledPrice);
                    } else if (onAcceptDeal) {
                      onAcceptDeal();
                    }
                  }}
                  className="w-full py-3 px-4 rounded-xl text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-md transition-transform active:scale-[0.98] bg-linear-to-r from-blue-600 via-indigo-600 to-purple-600"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>🔬 Run AI Deal Analyzer (Quality, Seller & Risk Evaluation)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (onOptimizeDeal && currentActiveProduct) {
                      onOptimizeDeal(currentActiveProduct, settledPrice);
                    } else if (onAcceptDeal) {
                      onAcceptDeal();
                    }
                  }}
                  className="w-full py-2.5 px-4 rounded-xl text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-md transition-transform active:scale-[0.98] bg-linear-to-r from-emerald-600 via-teal-600 to-blue-600"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>⚡ Deal Optimizer (Live Coupons & Bank Concessions)</span>
                </button>

                <button
                  type="button"
                  onClick={onAcceptDeal}
                  className="w-full py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  style={{
                    backgroundColor: 'var(--surface)',
                    borderColor: 'var(--border)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Direct Checkout at Negotiated Price (₹{settledPrice.toLocaleString('en-IN')})</span>
                </button>

                {/* ADVANCED NEGOTIATION SYSTEM 2.0: Mode 2 Bulk & Mode 3 Collective Options */}
                {(() => {
                  const qty = quantity >= 3 ? quantity : 10;
                  const currentNormalTotal = settledPrice * qty;
                  const bulkUnitPrice = NegotiationEngine.computeBulkUnitPrice(currentActiveProduct.listPrice, qty, currentActiveProduct, categorySettings);
                  const bulkTotal = bulkUnitPrice * qty;
                  const bulkSavings = Math.max(0, currentNormalTotal - bulkTotal);

                  return (
                    <div className="p-3 rounded-2xl border border-indigo-500/40 bg-gradient-to-r from-indigo-950/30 via-slate-900/40 to-slate-950/40 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-mono font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Package className="w-3.5 h-3.5" /> Bulk Purchase ({qty} units)
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          Volume Tier
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed font-sans">
                        &ldquo;You&apos;re already close to my best individual price. Because you&apos;re purchasing {qty} units, I can try a bulk negotiation with the seller.&rdquo;
                      </p>
                      <div className="grid grid-cols-3 gap-1.5 text-center text-xs font-mono">
                        <div className="p-1.5 rounded-xl bg-slate-900/60 border border-slate-800">
                          <div className="text-[10px] text-slate-400">Current Total</div>
                          <div className="font-bold text-slate-200">₹{currentNormalTotal.toLocaleString('en-IN')}</div>
                        </div>
                        <div className="p-1.5 rounded-xl bg-indigo-950/40 border border-indigo-700/50">
                          <div className="text-[10px] text-indigo-300">Bulk Target</div>
                          <div className="font-bold text-indigo-400">₹{bulkTotal.toLocaleString('en-IN')}</div>
                        </div>
                        <div className="p-1.5 rounded-xl bg-emerald-950/40 border border-emerald-700/50">
                          <div className="text-[10px] text-emerald-300">Potential Saving</div>
                          <div className="font-bold text-emerald-400">₹{bulkSavings.toLocaleString('en-IN')}</div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (onStartBulkNegotiate && activeCandidate) {
                            onStartBulkNegotiate(activeCandidate, qty);
                          } else if (onStartNegotiate && activeCandidate) {
                            onStartNegotiate(activeCandidate);
                          }
                        }}
                        className="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition-transform active:scale-[0.98]"
                      >
                        <Package className="w-3.5 h-3.5" />
                        <span>[ Start Bulk Negotiation ]</span>
                      </button>
                    </div>
                  );
                })()}

                {(() => {
                  const matchedPool =
                    activeCollectivePools.find(
                      (p) =>
                        (p.productId === currentActiveProduct.id || p.productName.toLowerCase() === currentActiveProduct.name.toLowerCase()) &&
                        p.status === 'ACTIVE'
                    ) ||
                    activeCollectivePools.find((p) => p.category === currentActiveProduct.category && p.status === 'ACTIVE');

                  if (!matchedPool) return null;
                  const pctReached = Math.min(100, Math.round((matchedPool.currentQuantity / matchedPool.targetQuantity) * 100));

                  return (
                    <div className="p-3 rounded-2xl border border-purple-500/40 bg-gradient-to-r from-purple-950/30 via-slate-900/40 to-slate-950/40 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-mono font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5" /> Collective Deal (Group Buy)
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          {matchedPool.participantsCount} Buyers Active
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed font-sans">
                        &ldquo;You&apos;ve reached the maximum reasonable individual negotiation. Pool demand with {matchedPool.participantsCount} other buyers to unlock wholesale pricing at ₹{matchedPool.collectiveTargetPrice.toLocaleString('en-IN')}/unit!&rdquo;
                      </p>
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] font-mono text-slate-400">
                          <span>Pledged: {matchedPool.currentQuantity} / {matchedPool.targetQuantity} units</span>
                          <span className="text-purple-300 font-bold">{pctReached}% ({matchedPool.probabilityScore}% Probability)</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all"
                            style={{ width: `${pctReached}%` }}
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (onJoinCollectiveDeal) onJoinCollectiveDeal(matchedPool);
                        }}
                        className="w-full py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition-transform active:scale-[0.98]"
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>[ Join Collective Pool — Lock ₹{matchedPool.collectiveTargetPrice.toLocaleString('en-IN')} ]</span>
                      </button>
                    </div>
                  );
                })()}

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={onTryAgain}
                    className="py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    style={{
                      backgroundColor: 'var(--surface)',
                      borderColor: 'var(--border)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Try Again</span>
                  </button>

                  <button
                    type="button"
                    onClick={onFindAlternatives}
                    className="py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    style={{
                      backgroundColor: 'var(--surface)',
                      borderColor: 'var(--border)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>Find Alternatives</span>
                  </button>
                </div>
              </>
            ) : isNegotiating ? (
              <button
                type="button"
                disabled
                className="w-full py-3 px-4 rounded-xl text-white font-bold text-xs opacity-75 flex items-center justify-center gap-2 cursor-wait"
                style={{ backgroundColor: 'var(--accent)' }}
              >
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Negotiating Deal...</span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    if (activeCandidate) onStartNegotiate(activeCandidate);
                  }}
                  className="w-full py-3 px-4 rounded-xl text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-md transition-transform active:scale-[0.98]"
                  style={{ backgroundColor: 'var(--accent)' }}
                >
                  <Zap className="w-4 h-4" />
                  <span>Start AI Negotiation (Ask ₹{targetPrice.toLocaleString('en-IN')})</span>
                </button>

                <button
                  type="button"
                  onClick={onFindAlternatives}
                  className="w-full py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  style={{
                    backgroundColor: 'var(--surface)',
                    borderColor: 'var(--border)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Explore Similar Alternatives</span>
                </button>
              </>
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
                        onStartNegotiate(cand);
                      }
                    }}
                    className="px-3 py-1.5 rounded-xl text-white font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                    style={{ backgroundColor: 'var(--accent)' }}
                  >
                    <Zap className="w-3 h-3" />
                    <span>🤝 Negotiate This Instead</span>
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
    const bulletSpecs = getKeyBulletSpecs(p);
    const isCompared = comparedProductIds.includes(p.id);
    const isExpanded = expandedDetailsId === p.id;

    return (
      <div
        key={p.id}
        id={`product-card-${p.id}`}
        onClick={() => onSelectProduct(cand)}
        className="p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 cursor-pointer shadow-2xs"
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
          className="flex items-center justify-between gap-2 pb-2 mb-2 border-b"
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
                <ExternalLink className="w-3 h-3" />
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

            {cand.eligibleForNegotiation && (
              <span
                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-mono font-semibold border"
                style={{
                  backgroundColor: 'rgba(37, 99, 235, 0.08)',
                  borderColor: 'rgba(37, 99, 235, 0.25)',
                  color: 'var(--accent)',
                }}
              >
                <Zap className="w-2.5 h-2.5" />
                <span>Negotiable</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 text-xs font-bold text-amber-500 shrink-0">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span>{p.rating}</span>
          </div>
        </div>

        {/* Main Product Info: Image + Name + Price */}
        <div className="flex items-start gap-3">
          <img
            src={p.image}
            alt={p.name}
            className="w-16 h-16 sm:w-18 sm:h-18 rounded-xl object-cover shrink-0 border"
            style={{ borderColor: 'var(--border)' }}
            loading="lazy"
          />

          <div className="min-w-0 flex-1 space-y-1">
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
                <span className="text-[10px] font-mono font-bold" style={{ color: 'var(--success)' }}>
                  Save ₹{(p.marketPrice - p.listPrice).toLocaleString('en-IN')}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 30-Day Price Trend Sparkline Chart */}
        <div className="mt-2 pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
          <PriceSparkline product={p} height={26} showLabels={false} />
        </div>

        {/* Key Specifications Bullet Points */}
        <div className="mt-2 pt-1 border-t" style={{ borderColor: 'var(--border)' }}>
          <div className="flex flex-wrap gap-1.5 text-[11px]">
            {bulletSpecs.map((spec, sIdx) => (
              <span
                key={sIdx}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-medium border"
                style={{
                  backgroundColor: 'var(--surface-elevated)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-secondary)',
                }}
              >
                <Check className="w-3 h-3" style={{ color: 'var(--success)' }} />
                <span className="truncate max-w-[200px]">{spec}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Expandable Details Section */}
        {isExpanded && (
          <div
            className="mt-2.5 p-3 rounded-xl border text-xs space-y-2 leading-relaxed"
            style={{
              backgroundColor: 'var(--surface-elevated)',
              borderColor: 'var(--border)',
              color: 'var(--text-secondary)',
            }}
          >
            <p>{p.description}</p>
            <div className="grid grid-cols-2 gap-1.5 font-mono text-[11px] pt-1 border-t" style={{ borderColor: 'var(--border)' }}>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Seller: </span>
                <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{p.sellerName}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Delivery: </span>
                <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {p.deliveryDays ? `${p.deliveryDays} Day${p.deliveryDays > 1 ? 's' : ''}` : 'Standard'}
                </span>
              </div>
              {cand.eligibleForNegotiation && (
                <div className="col-span-2 font-semibold" style={{ color: 'var(--success)' }}>
                  AI Target: ₹{cand.negotiationTarget.toLocaleString('en-IN')} (Eligible for bargain)
                </div>
              )}
            </div>
          </div>
        )}

        {/* ADVANCED NEGOTIATION 2.0: Matched Collective Group Buy Pool Badge */}
        {(() => {
          const matchedPool = activeCollectivePools.find(
            (pool) =>
              (pool.productId === p.id ||
                pool.productName.toLowerCase().includes(p.name.toLowerCase().slice(0, 14))) &&
              pool.status === 'ACTIVE'
          );
          if (!matchedPool) return null;
          return (
            <div
              className="mt-2.5 p-2 rounded-xl border flex items-center justify-between gap-2"
              style={{
                backgroundColor: 'rgba(147, 51, 234, 0.08)',
                borderColor: 'rgba(147, 51, 234, 0.3)',
              }}
            >
              <div className="flex items-center gap-1.5 min-w-0 text-xs">
                <Users className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                <span className="truncate text-[11px] font-mono" style={{ color: 'var(--text-primary)' }}>
                  Group Pool: <strong>{matchedPool.currentQuantity}/{matchedPool.targetQuantity}</strong> units •{' '}
                  <strong className="text-purple-600 dark:text-purple-400">
                    ₹{matchedPool.collectiveTargetPrice.toLocaleString('en-IN')}
                  </strong>
                </span>
              </div>
              {onJoinCollectiveDeal && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onJoinCollectiveDeal(matchedPool);
                  }}
                  className="px-2 py-0.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-mono text-[10px] font-bold shrink-0 cursor-pointer shadow-xs"
                >
                  Join Pool
                </button>
              )}
            </div>
          );
        })()}

        {/* Card Action Buttons */}
        <div className="mt-3 flex items-center justify-between gap-2 pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setExpandedDetailsId(isExpanded ? null : p.id);
            }}
            className="text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
            style={{ color: 'var(--text-secondary)' }}
          >
            <span>{isExpanded ? 'Hide Details' : 'View Details'}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          <div className="flex items-center gap-2">
            {onToggleCompare && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleCompare(p);
                }}
                className="p-1.5 rounded-lg border text-xs cursor-pointer transition-colors"
                style={{
                  backgroundColor: isCompared ? 'var(--accent)' : 'var(--surface)',
                  borderColor: isCompared ? 'var(--accent)' : 'var(--border)',
                  color: isCompared ? '#FFFFFF' : 'var(--text-secondary)',
                }}
                title={isCompared ? 'Remove from compare' : 'Add to compare'}
              >
                <Layers className="w-3.5 h-3.5" />
              </button>
            )}

            {isExternal || !cand.eligibleForNegotiation ? (
              <a
                href={cand.retailerUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="px-3 py-1.5 rounded-xl text-white font-semibold text-xs inline-flex items-center gap-1 transition-colors shadow-xs"
                style={{ backgroundColor: 'var(--text-primary)' }}
              >
                <span>View Retailer</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            ) : quantity >= 3 ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onStartBulkNegotiate) {
                    onStartBulkNegotiate(cand, quantity);
                  } else {
                    onStartNegotiate(cand);
                  }
                }}
                className="px-3.5 py-1.5 rounded-xl text-white font-display font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs bg-indigo-600 hover:bg-indigo-500"
              >
                <Package className="w-3.5 h-3.5" />
                <span>⚡ Bulk Negotiate ({quantity}u)</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onStartNegotiate(cand);
                }}
                className="px-3.5 py-1.5 rounded-xl text-white font-display font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                style={{ backgroundColor: 'var(--accent)' }}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>⚡ Select & Negotiate</span>
              </button>
            )}
          </div>
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
                {userBudget
                  ? `No exact matches found under ₹${userBudget.toLocaleString('en-IN')}`
                  : 'No matching products found'}
              </h4>
              <p className="text-xs max-w-sm mx-auto" style={{ color: 'var(--text-muted)' }}>
                {userBudget
                  ? `I searched verified stores for products within ₹${userBudget.toLocaleString('en-IN')}, but couldn't find items in this price bracket. You can adjust your budget or search wider.`
                  : "I couldn't find products matching your exact query. Try broadening your criteria or search wider."}
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 flex-wrap pt-1">
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
