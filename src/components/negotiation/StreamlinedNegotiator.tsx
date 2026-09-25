import React, { useState } from 'react';
import { NegotiationSession, ActivityLogEntry, DealToken } from '../../types';
import { NegotiationTimeline } from './NegotiationTimeline';
import { DealSecuredCard } from './DealSecuredCard';
import { TechnicalActivityLog } from './TechnicalActivityLog';
import { AgentConnection3D } from './AgentConnection3D';
import { ThemeId, THEMES } from '../../types/theme';
import {
  Bot,
  Store,
  ShieldCheck,
  Sparkles,
  Play,
  RotateCcw,
  ArrowRight,
  Users,
  Target,
  Clock,
  Layers,
  CheckCircle2,
  ChevronRight,
  TrendingDown
} from 'lucide-react';

interface StreamlinedNegotiatorProps {
  session: NegotiationSession;
  activeStepIndex: number;
  isAutoPlaying: boolean;
  activityLogs: ActivityLogEntry[];
  competingSellers: Array<{ sellerId: string; sellerName: string; offeredPrice: number; deliveryDays: number; stock: number; isBest?: boolean }>;
  showMultiSeller: boolean;
  onStepNegotiation: () => void;
  onAutoNegotiate: () => void;
  onResetSession: () => void;
  onToggleMultiSeller: () => void;
  onOpenCheckout: () => void;
  onBackToDiscovery: () => void;
  currentThemeId?: ThemeId;
}

export const StreamlinedNegotiator: React.FC<StreamlinedNegotiatorProps> = ({
  session,
  activeStepIndex,
  isAutoPlaying,
  activityLogs,
  competingSellers,
  showMultiSeller,
  onStepNegotiation,
  onAutoNegotiate,
  onResetSession,
  onToggleMultiSeller,
  onOpenCheckout,
  onBackToDiscovery,
  currentThemeId = 'pure-white',
}) => {
  const [activeTab, setActiveTab] = useState<'timeline' | 'multiseller' | 'audit'>('timeline');
  const theme = THEMES[currentThemeId] || THEMES['pure-white'];

  const isAccepted = session.status === 'DEAL_ACCEPTED';
  const isBudgetExceeded = session.status === 'BUDGET_EXCEEDED';
  const isFinished = isAccepted || isBudgetExceeded;
  const savings = Math.max(0, session.originalPrice - session.currentOffer);

  const lastSpeaker =
    session.offers.length > 0
      ? session.offers[session.offers.length - 1].speaker
      : 'BUYER';

  return (
    <div className="w-full max-w-5xl mx-auto space-y-4">
      {/* 1. FIXED HEADER SINGLE-LINE STRUCTURE (HUD) */}
      <div
        className={`sticky top-[69px] z-40 backdrop-blur-xl border rounded-2xl px-4 py-2.5 shadow-2xl flex flex-wrap items-center justify-between gap-3 text-xs font-mono transition-colors ${
          theme.isLight
            ? 'bg-white/95 border-slate-200 text-slate-800 shadow-slate-200/60'
            : 'bg-[#13171B]/95 border-[#293139] text-[#F2F5F7] shadow-black/80'
        }`}
      >
        {/* Left: Product & Seller */}
        <div className="flex items-center gap-3 min-w-0">
          <img
            src={session.product.image}
            alt={session.product.name}
            referrerPolicy="no-referrer"
            className={`w-9 h-9 rounded-lg object-cover shrink-0 border ${
              theme.isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-900 border-[#293139]'
            }`}
          />
          <div className="truncate">
            <div className="flex items-center gap-2">
              <span
                className={`font-bold font-sans text-xs truncate max-w-[180px] sm:max-w-xs ${
                  theme.isLight ? 'text-slate-900' : 'text-white'
                }`}
              >
                {session.product.name}
              </span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded border hidden sm:inline ${
                  theme.isLight
                    ? 'text-blue-700 bg-blue-50 border-blue-200'
                    : 'text-[#4DA3FF] bg-[#1E242A] border-[#293139]'
                }`}
              >
                {session.product.sellerName}
              </span>
            </div>
          </div>
        </div>

        {/* Center: Single-Line Budget & Price Metrics */}
        <div
          className={`hidden md:flex items-center gap-4 text-[11px] border-x px-4 ${
            theme.isLight ? 'border-slate-200' : 'border-[#293139]'
          }`}
        >
          <div>
            <span
              className={`uppercase text-[9px] block ${
                theme.isLight ? 'text-slate-400' : 'text-[#707A84]'
              }`}
            >
              List
            </span>
            <span
              className={`line-through ${
                theme.isLight ? 'text-slate-400' : 'text-[#707A84]'
              }`}
            >
              ₹{session.originalPrice.toLocaleString('en-IN')}
            </span>
          </div>

          <div>
            <span
              className={`uppercase text-[9px] block ${
                theme.isLight ? 'text-slate-400' : 'text-[#707A84]'
              }`}
            >
              Target
            </span>
            <span className="font-bold" style={{ color: theme.buyerBlue }}>
              ₹{session.userBudget.target.toLocaleString('en-IN')}
            </span>
          </div>

          <div>
            <span
              className={`uppercase text-[9px] block ${
                theme.isLight ? 'text-slate-400' : 'text-[#707A84]'
              }`}
            >
              Ceiling
            </span>
            <span className="font-bold" style={{ color: theme.sellerAmber }}>
              ₹{session.userBudget.maxBudget.toLocaleString('en-IN')}
            </span>
          </div>

          <div
            className={`px-2.5 py-1 rounded-lg border ${
              theme.isLight ? 'bg-slate-100 border-slate-200' : 'bg-[#181D22] border-[#293139]'
            }`}
          >
            <span
              className={`uppercase text-[9px] block ${
                theme.isLight ? 'text-slate-500' : 'text-[#AAB3BC]'
              }`}
            >
              Current Bid
            </span>
            <span
              className={`font-bold text-sm ${
                isAccepted
                  ? 'text-emerald-500'
                  : theme.isLight
                  ? 'text-slate-900'
                  : 'text-white'
              }`}
            >
              ₹{session.currentOffer.toLocaleString('en-IN')}
            </span>
          </div>

          {savings > 0 && (
            <div
              className="font-semibold flex items-center gap-1"
              style={{ color: theme.dealEmerald }}
            >
              <TrendingDown className="w-3.5 h-3.5" />
              <span>-₹{savings.toLocaleString('en-IN')}</span>
            </div>
          )}
        </div>

        {/* Right: Streamlined Control Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onResetSession}
            title="Reset round"
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
              theme.isLight
                ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-600 hover:text-slate-900'
                : 'bg-[#181D22] hover:bg-[#1E242A] border-[#293139] text-slate-400 hover:text-white'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {!isFinished ? (
            <>
              <button
                onClick={onStepNegotiation}
                disabled={isAutoPlaying}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors disabled:opacity-50 cursor-pointer whitespace-nowrap ${
                  theme.isLight
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                    : 'bg-[#181D22] hover:bg-[#1E242A] text-slate-200 border-[#293139]'
                }`}
              >
                Step 1 Turn
              </button>

              <button
                onClick={onAutoNegotiate}
                disabled={isAutoPlaying}
                className="px-3.5 py-1.5 text-slate-950 font-bold text-xs rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50 whitespace-nowrap"
                style={{
                  background: `linear-gradient(135deg, ${theme.buyerBlue}, ${theme.secondaryAccentHex})`,
                }}
              >
                <Play className="w-3 h-3 fill-current" />
                <span>{isAutoPlaying ? 'Negotiating...' : 'Auto Negotiate'}</span>
              </button>
            </>
          ) : isAccepted ? (
            <button
              onClick={onOpenCheckout}
              className="px-4 py-1.5 text-slate-950 font-bold text-xs rounded-lg shadow-md flex items-center gap-1.5 cursor-pointer whitespace-nowrap animate-pulse"
              style={{
                background: `linear-gradient(135deg, ${theme.dealEmerald}, #22c55e)`,
              }}
            >
              <ShieldCheck className="w-4 h-4 font-bold" />
              <span>BUY AT ₹{session.finalPrice?.toLocaleString('en-IN')}</span>
            </button>
          ) : null}
        </div>
      </div>

      {/* 2. SUB-BAR: Tab switchers for Multi-Seller, Timeline & Audit */}
      <div
        className={`flex items-center justify-between text-xs border-b pb-2 ${
          theme.isLight ? 'border-slate-200' : 'border-[#293139]'
        }`}
      >
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('timeline')}
            className={`px-3 py-1.5 rounded-lg transition-colors font-semibold ${
              activeTab === 'timeline'
                ? theme.isLight
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'bg-[#1E242A] text-[#4DA3FF] border border-[#3D4852]'
                : theme.isLight
                ? 'text-slate-600 hover:text-slate-900'
                : 'text-[#AAB3BC] hover:text-white'
            }`}
          >
            Live Timeline ({session.offers.length} Events)
          </button>
          <button
            onClick={() => {
              setActiveTab('multiseller');
              onToggleMultiSeller();
            }}
            className={`px-3 py-1.5 rounded-lg transition-colors font-semibold flex items-center gap-1.5 ${
              activeTab === 'multiseller'
                ? theme.isLight
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'bg-[#1E242A] text-[#4DA3FF] border border-[#3D4852]'
                : theme.isLight
                ? 'text-slate-600 hover:text-slate-900'
                : 'text-[#AAB3BC] hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Multi-Seller Compare</span>
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1.5 rounded-lg transition-colors font-semibold ${
              activeTab === 'audit'
                ? theme.isLight
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'bg-[#1E242A] text-[#4DA3FF] border border-[#3D4852]'
                : theme.isLight
                ? 'text-slate-600 hover:text-slate-900'
                : 'text-[#AAB3BC] hover:text-white'
            }`}
          >
            Agent Telemetry
          </button>
        </div>

        <button
          onClick={onBackToDiscovery}
          className={`text-xs transition-colors flex items-center gap-1 cursor-pointer font-mono ${
            theme.isLight ? 'text-slate-500 hover:text-blue-600' : 'text-[#AAB3BC] hover:text-[#4DA3FF]'
          }`}
        >
          <span>Explore More Products</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 3. DEDICATED SPACIOUS TIMELINE VIEW WITH 3D ARENA */}
      {activeTab === 'timeline' && (
        <div className="space-y-6">
          {/* Top 3D Interactive Spatial Arena */}
          <AgentConnection3D
            buyerName="Buyer Agent (You)"
            sellerName={session.product.sellerName}
            status={session.status}
            currentOffer={session.currentOffer}
            originalPrice={session.originalPrice}
            activeSpeaker={lastSpeaker}
            stepIndex={activeStepIndex}
          />

          {/* Deal Secured Celebration Banner (when accepted) */}
          {isAccepted && session.finalPrice && (
            <DealSecuredCard
              product={session.product}
              originalPrice={session.originalPrice}
              finalPrice={session.finalPrice}
              savings={session.totalSaved || 0}
              sellerName={session.product.sellerName}
              token={session.token}
              onBuyNow={onOpenCheckout}
            />
          )}

          {/* Clean Spacious Vertical Timeline */}
          <div
            className={`p-6 rounded-2xl border shadow-xl ${
              theme.isLight
                ? 'bg-white border-slate-200 shadow-slate-200/60'
                : 'bg-[#181D22] border-[#293139]'
            }`}
          >
            <NegotiationTimeline
              productName={session.product.name}
              offers={session.offers}
              status={session.status}
              currentOffer={session.currentOffer}
              finalPrice={session.finalPrice}
              originalPrice={session.originalPrice}
              currentThemeId={currentThemeId}
            />
          </div>
        </div>
      )}

      {/* 4. MULTI-SELLER TAB */}
      {activeTab === 'multiseller' && (
        <div
          className={`p-6 rounded-2xl border shadow-xl space-y-4 ${
            theme.isLight
              ? 'bg-white border-slate-200'
              : 'bg-[#181D22] border-[#293139]'
          }`}
        >
          <div className="flex items-center justify-between">
            <h3
              className={`font-display font-bold text-sm flex items-center gap-2 ${
                theme.isLight ? 'text-slate-900' : 'text-white'
              }`}
            >
              <Users className="w-4 h-4" style={{ color: theme.buyerBlue }} />
              <span>Competing Merchant Offers for {session.product.name}</span>
            </h3>
            <span
              className={`text-xs font-mono ${
                theme.isLight ? 'text-slate-500' : 'text-[#707A84]'
              }`}
            >
              Buyer Agent pitched to 3 verified sellers simultaneously
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            {competingSellers.length === 0 ? (
              <div
                className={`col-span-3 py-10 text-center text-xs ${
                  theme.isLight ? 'text-slate-500' : 'text-[#707A84]'
                }`}
              >
                Generating competitive bids across verified seller network...
              </div>
            ) : (
              competingSellers.map((seller) => (
                <div
                  key={seller.sellerId}
                  className={`p-4 rounded-xl border transition-all ${
                    seller.isBest
                      ? theme.isLight
                        ? 'bg-emerald-50 border-emerald-300 shadow-md'
                        : 'bg-emerald-950/30 border-emerald-500/60 shadow-lg shadow-emerald-950/40'
                      : theme.isLight
                      ? 'bg-slate-50 border-slate-200'
                      : 'bg-[#1E242A] border-[#293139]'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span
                      className={`font-bold truncate max-w-[140px] ${
                        theme.isLight ? 'text-slate-900' : 'text-white'
                      }`}
                    >
                      {seller.sellerName}
                    </span>
                    {seller.isBest && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold">
                        Best Deal
                      </span>
                    )}
                  </div>
                  <div
                    className={`text-2xl font-extrabold font-mono mt-2 ${
                      theme.isLight ? 'text-slate-900' : 'text-white'
                    }`}
                  >
                    ₹{seller.offeredPrice.toLocaleString('en-IN')}
                  </div>
                  <div
                    className={`text-xs font-mono mt-1 ${
                      theme.isLight ? 'text-slate-500' : 'text-[#707A84]'
                    }`}
                  >
                    Delivery in {seller.deliveryDays}d · {seller.stock} units remaining
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 5. TELEMETRY & AUDIT TAB */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <TechnicalActivityLog logs={activityLogs} sessionId={session.id} />
        </div>
      )}
    </div>
  );
};
