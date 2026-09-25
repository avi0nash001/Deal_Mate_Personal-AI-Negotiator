import React from 'react';
import { NegotiationOffer } from '../../types';
import { Bot, Store, ArrowDownRight, ArrowUpRight, CheckCircle2 } from 'lucide-react';

interface OfferCardProps {
  offer: NegotiationOffer;
  isLatest?: boolean;
}

export const OfferCard: React.FC<OfferCardProps> = ({ offer, isLatest = false }) => {
  const isBuyer = offer.speaker === 'BUYER';
  const isAccepted = offer.status === 'ACCEPTED';

  return (
    <div
      className={`relative rounded-xl p-4 transition-all duration-300 transform-style-3d border ${
        isAccepted
          ? 'bg-gradient-to-r from-emerald-950/40 via-[#0B1516] to-[#0A0E18] border-emerald-500/40 shadow-lg shadow-emerald-950/30'
          : isBuyer
          ? 'bg-[#0A0F1A]/90 border-cyan-500/25 hover:border-cyan-400/50 shadow-md shadow-cyan-950/20'
          : 'bg-[#120F16]/90 border-amber-500/25 hover:border-amber-400/50 shadow-md shadow-amber-950/20'
      } ${isLatest ? 'ring-1 ring-white/10' : ''}`}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Speaker badge & name */}
        <div className="flex items-center gap-2.5">
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center ${
              isBuyer
                ? 'bg-cyan-950 text-cyan-400 border border-cyan-700/60'
                : 'bg-amber-950 text-amber-400 border border-amber-700/60'
            }`}
          >
            {isBuyer ? <Bot className="w-4 h-4" /> : <Store className="w-4 h-4" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white tracking-wide">
                {isBuyer ? 'Buyer Agent' : offer.sellerName || 'Seller Agent'}
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                Round {offer.round}
              </span>
            </div>
            <span className="text-[10px] text-slate-400">
              {new Date(offer.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>
        </div>

        {/* Offer Price Pill */}
        <div className="text-right">
          <div className="flex items-center justify-end gap-1">
            {isBuyer ? (
              <ArrowDownRight className="w-4 h-4 text-cyan-400" />
            ) : (
              <ArrowUpRight className="w-4 h-4 text-amber-400" />
            )}
            <span
              className={`text-lg font-extrabold font-mono tracking-tight ${
                isAccepted
                  ? 'text-emerald-400'
                  : isBuyer
                  ? 'text-cyan-300'
                  : 'text-amber-300'
              }`}
            >
              ₹{offer.price.toLocaleString('en-IN')}
            </span>
          </div>
          <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">
            {isAccepted ? 'Secured Deal' : isBuyer ? 'Buyer Offer' : 'Seller Counter'}
          </span>
        </div>
      </div>

      {/* Offer reasoning message */}
      <p className="mt-2.5 text-xs text-slate-300 leading-relaxed font-sans pl-9 border-l border-slate-800">
        {offer.message}
      </p>

      {/* Savings indicator if available */}
      {offer.savingsSoFar && offer.savingsSoFar > 0 && (
        <div className="mt-2.5 ml-9 flex items-center gap-1.5 text-[11px] font-mono text-emerald-400/90">
          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          <span>Discount captured: ₹{offer.savingsSoFar.toLocaleString('en-IN')}</span>
        </div>
      )}
    </div>
  );
};
