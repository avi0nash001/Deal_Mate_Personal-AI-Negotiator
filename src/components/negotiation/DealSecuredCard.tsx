import React, { useEffect, useRef } from 'react';
import { ShieldCheck, Sparkles, ArrowRight, Clock, Award, CheckCircle2 } from 'lucide-react';
import { Product } from '../../types';
import confetti from 'canvas-confetti';
import { soundEffects } from '../../services/soundEffects';

interface DealSecuredCardProps {
  product: Product;
  originalPrice: number;
  finalPrice: number;
  savings: number;
  sellerName: string;
  token?: string;
  onBuyNow: () => void;
}

export const DealSecuredCard: React.FC<DealSecuredCardProps> = ({
  product,
  originalPrice,
  finalPrice,
  savings,
  sellerName,
  token = 'DLM-94A2B7C',
  onBuyNow,
}) => {
  const discountPercent = Math.round((savings / originalPrice) * 100);

  // Trigger celebration confetti & audio chime upon deal secured
  useEffect(() => {
    soundEffects.playDealSecured();
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#06b6d4', '#f59e0b', '#38bdf8', '#34d399'],
      });
    } catch {
      // Ignore if confetti not supported
    }
  }, []);

  return (
    <div className="relative overflow-hidden rounded-3xl border-2 border-emerald-400/70 bg-gradient-to-b from-[#0D2420] via-[#091717] to-[#060D0F] p-7 shadow-2xl shadow-emerald-950/70 transform-style-3d animate-pulse-glow">
      {/* 3D celebratory background bursts */}
      <div className="absolute -top-16 -right-16 w-56 h-56 bg-emerald-500/25 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-cyan-500/25 rounded-full blur-3xl pointer-events-none" />

      {/* Top Banner with 3D verified badge */}
      <div className="flex items-center justify-between gap-4 border-b border-emerald-500/30 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500/30 to-teal-400/30 border border-emerald-400/60 flex items-center justify-center text-emerald-300 shadow-lg shadow-emerald-500/30 animate-bounce">
            <Award className="w-5 h-5 text-emerald-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-extrabold text-lg text-white tracking-wide">
                DEAL SECURED
              </span>
              <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/60 flex items-center gap-1 font-bold">
                <Sparkles className="w-3 h-3 text-emerald-400 animate-spin" />
                Verified Equilibrium
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">Negotiated by Buyer Agent with {sellerName}</p>
          </div>
        </div>

        <div className="text-right">
          <div className="text-[11px] font-mono text-emerald-400 font-bold">TOKEN: {token}</div>
          <div className="flex items-center gap-1 text-[11px] font-mono text-amber-300 mt-0.5">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Guaranteed Price Locked</span>
          </div>
        </div>
      </div>

      {/* Main Pricing Center with 3D Product & Token Medallion */}
      <div className="py-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="relative transform-style-3d">
            <img
              src={product.image}
              alt={product.name}
              referrerPolicy="no-referrer"
              className="w-20 h-20 rounded-2xl object-cover border-2 border-emerald-400/50 shadow-xl bg-slate-900"
            />
            <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-slate-950 p-1 rounded-full shadow-lg">
              <CheckCircle2 className="w-4 h-4 font-bold" />
            </div>
          </div>
          <div>
            <h3 className="text-base font-bold text-white line-clamp-1">{product.name}</h3>
            <div className="mt-1 flex items-baseline gap-3">
              <span className="text-4xl font-extrabold font-mono text-emerald-400 tracking-tight">
                ₹{finalPrice.toLocaleString('en-IN')}
              </span>
              <span className="text-sm font-mono text-slate-400 line-through">
                ₹{originalPrice.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="mt-1.5 flex items-center gap-2 text-xs font-mono">
              <span className="text-emerald-300 font-bold px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-700/60">
                You saved ₹{savings.toLocaleString('en-IN')} ({discountPercent}% OFF)
              </span>
            </div>
          </div>
        </div>

        {/* Big Buy Now Button */}
        <div className="w-full md:w-auto">
          <button
            onClick={() => {
              soundEffects.playBlip();
              onBuyNow();
            }}
            className="w-full md:w-auto px-8 py-4 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 text-slate-950 font-extrabold text-sm rounded-xl shadow-xl shadow-emerald-500/30 transition-all transform hover:-translate-y-1 active:translate-y-0 flex items-center justify-center gap-2.5 cursor-pointer"
          >
            <span>BUY NOW AT SECURED PRICE</span>
            <ArrowRight className="w-4 h-4 font-bold" />
          </button>
          <div className="mt-2 flex items-center justify-center md:justify-end gap-1.5 text-[11px] text-slate-400 font-mono">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Smart Contract Price Guarantee · Instant Dispatch</span>
          </div>
        </div>
      </div>
    </div>
  );
};
