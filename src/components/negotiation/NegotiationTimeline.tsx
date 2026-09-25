import React from 'react';
import { NegotiationOffer, NegotiationStatus } from '../../types';
import { Bot, Store, CheckCircle, Package, ShieldCheck, XCircle } from 'lucide-react';
import { ThemeId, THEMES } from '../../types/theme';

interface NegotiationTimelineProps {
  productName: string;
  offers: NegotiationOffer[];
  status: NegotiationStatus;
  currentOffer: number;
  finalPrice?: number;
  originalPrice: number;
  currentThemeId?: ThemeId;
}

export const NegotiationTimeline: React.FC<NegotiationTimelineProps> = ({
  productName,
  offers,
  status,
  currentOffer,
  finalPrice,
  originalPrice,
  currentThemeId = 'pure-white',
}) => {
  const theme = THEMES[currentThemeId] || THEMES['pure-white'];
  const isAccepted = status === 'DEAL_ACCEPTED';
  const isRejected = status === 'DEAL_REJECTED' || status === 'BUDGET_EXCEEDED';

  return (
    <div className="relative pl-6 py-2">
      {/* Vertical Timeline Axis Line */}
      <div
        className="absolute left-[11px] top-4 bottom-6 w-[2px] opacity-40"
        style={{
          background: `linear-gradient(180deg, ${theme.buyerBlue}, ${theme.sellerAmber}, ${theme.dealEmerald})`,
        }}
      />

      {/* Node 0: Product Matched */}
      <div className="relative flex items-start gap-4 mb-6 group">
        <div
          className="relative z-10 w-6 h-6 rounded-full border-2 flex items-center justify-center shadow-md"
          style={{
            borderColor: theme.buyerBlue,
            backgroundColor: theme.isLight ? '#FFFFFF' : '#0E1114',
          }}
        >
          <Package className="w-3 h-3" style={{ color: theme.buyerBlue }} />
        </div>
        <div className="pt-0.5">
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-bold tracking-wide ${
                theme.isLight ? 'text-slate-900' : 'text-white'
              }`}
            >
              Product Matched
            </span>
            <span
              className={`text-[10px] font-mono ${
                theme.isLight ? 'text-slate-400' : 'text-[#707A84]'
              }`}
            >
              Catalog Match
            </span>
          </div>
          <p
            className={`text-xs mt-0.5 ${
              theme.isLight ? 'text-slate-600' : 'text-[#AAB3BC]'
            }`}
          >
            Buyer Agent identified{' '}
            <span className={`font-semibold ${theme.isLight ? 'text-slate-900' : 'text-slate-200'}`}>
              {productName}
            </span>{' '}
            at list price ₹{originalPrice.toLocaleString('en-IN')}.
          </p>
        </div>
      </div>

      {/* Live Iterative Offer Nodes */}
      {offers.map((offer, idx) => {
        const isBuyer = offer.speaker === 'BUYER';
        const isLatest = idx === offers.length - 1;

        return (
          <div key={offer.id} className="relative flex items-start gap-4 mb-6 group">
            {/* Timeline node marker */}
            <div
              className={`relative z-10 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                isLatest ? 'scale-110 ring-2 ring-blue-500/20' : ''
              }`}
              style={{
                borderColor: isBuyer ? theme.buyerBlue : theme.sellerAmber,
                backgroundColor: theme.isLight ? '#FFFFFF' : '#0E1114',
                color: isBuyer ? theme.buyerBlue : theme.sellerAmber,
              }}
            >
              {isBuyer ? <Bot className="w-3 h-3" /> : <Store className="w-3 h-3" />}
            </div>

            {/* Content card */}
            <div className="flex-1 pt-0.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-bold ${
                      theme.isLight ? 'text-slate-900' : 'text-slate-200'
                    }`}
                  >
                    {isBuyer ? 'Buyer Agent' : offer.sellerName || 'Seller Agent'}
                  </span>
                  <span
                    className={`text-[10px] font-mono ${
                      theme.isLight ? 'text-slate-400' : 'text-[#707A84]'
                    }`}
                  >
                    {isBuyer ? 'Offered' : 'Countered'}
                  </span>
                </div>
                <span
                  className="text-xs font-bold font-mono"
                  style={{ color: isBuyer ? theme.buyerBlue : theme.sellerAmber }}
                >
                  ₹{offer.price.toLocaleString('en-IN')}
                </span>
              </div>
              <p
                className={`text-xs mt-1 leading-relaxed p-2.5 rounded-xl border ${
                  theme.isLight
                    ? 'bg-slate-50 border-slate-200 text-slate-700'
                    : 'bg-[#181D22] border-[#293139] text-[#AAB3BC]'
                }`}
              >
                {offer.message}
              </p>
            </div>
          </div>
        );
      })}

      {/* Terminal Node: Deal Secured or Terminated */}
      {isAccepted && (
        <div className="relative flex items-start gap-4 mb-2 group">
          <div
            className="relative z-10 w-6 h-6 rounded-full border-2 flex items-center justify-center shadow-lg animate-pulse"
            style={{
              backgroundColor: theme.dealEmerald,
              borderColor: '#68E6A0',
            }}
          >
            <CheckCircle className="w-3.5 h-3.5 text-slate-950 font-bold" />
          </div>
          <div className="pt-0.5">
            <div className="flex items-center gap-2">
              <span
                className="text-xs font-bold tracking-wide uppercase"
                style={{ color: theme.dealEmerald }}
              >
                Deal Secured & Locked
              </span>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                  theme.isLight
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold'
                    : 'bg-emerald-950 text-emerald-300 border-emerald-800'
                }`}
              >
                Verified
              </span>
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span
                className={`text-xl font-extrabold font-mono ${
                  theme.isLight ? 'text-slate-900' : 'text-white'
                }`}
              >
                ₹{(finalPrice || currentOffer).toLocaleString('en-IN')}
              </span>
              <span
                className={`text-xs line-through ${
                  theme.isLight ? 'text-slate-400' : 'text-[#707A84]'
                }`}
              >
                ₹{originalPrice.toLocaleString('en-IN')}
              </span>
              <span
                className="text-xs font-semibold"
                style={{ color: theme.dealEmerald }}
              >
                Saved ₹{(originalPrice - (finalPrice || currentOffer)).toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>
      )}

      {isRejected && (
        <div className="relative flex items-start gap-4 mb-2 group">
          <div className="relative z-10 w-6 h-6 rounded-full bg-rose-500 border-2 border-rose-300 flex items-center justify-center shadow-lg shadow-rose-500/40">
            <XCircle className="w-3.5 h-3.5 text-slate-950 font-bold" />
          </div>
          <div className="pt-0.5">
            <span className="text-xs font-bold text-rose-400 tracking-wide uppercase">
              Negotiation Ended Without Agreement
            </span>
            <p className="text-xs text-slate-400 mt-0.5">
              Buyer Agent preserved your budget threshold and declined seller terms.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
