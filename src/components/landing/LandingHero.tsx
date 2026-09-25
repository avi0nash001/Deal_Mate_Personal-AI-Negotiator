import React, { useState, useEffect, useRef } from 'react';
import { Bot, Store, ArrowRight, Sparkles, ShieldCheck, Zap, Layers, Volume2, TrendingDown, Lock, Rotate3d, CheckCircle2 } from 'lucide-react';
import earbudsImg from '../../assets/images/dealmate_earbuds_1790325700521.jpg';
import smartwatchImg from '../../assets/images/dealmate_smartwatch_1790325712403.jpg';
import headphonesImg from '../../assets/images/dealmate_headphones_1790325721867.jpg';
import { CyberScene3D } from '../common/CyberScene3D';
import { Pipeline3DStage } from './Pipeline3DStage';
import { ProductViewer3D } from '../products/ProductViewer3D';
import { PRODUCTS } from '../../data/catalog';
import { soundEffects } from '../../services/soundEffects';
import { Product } from '../../types';
import { ThemeId, THEMES } from '../../types/theme';

interface LandingHeroProps {
  onStartNegotiating: () => void;
  onLaunchDemo: () => void;
  onExploreMarketplace: () => void;
  onSelectProductForNegotiation: (product: Product) => void;
  currentThemeId?: ThemeId;
}

export const LandingHero: React.FC<LandingHeroProps> = ({
  onStartNegotiating,
  onLaunchDemo,
  onExploreMarketplace,
  onSelectProductForNegotiation,
  currentThemeId = 'cyber-indigo',
}) => {
  const theme = THEMES[currentThemeId] || THEMES['cyber-indigo'];

  // Hero price step animation cycle
  const priceSteps = [3000, 2750, 2600, 2520];
  const [stepIdx, setStepIdx] = useState(0);

  // 3D Parallax state for interactive Hero Stage
  const heroCardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 8, y: -6 });

  useEffect(() => {
    const timer = setInterval(() => {
      setStepIdx((prev) => (prev + 1) % priceSteps.length);
    }, 2000);
    return () => clearInterval(timer);
  }, [priceSteps.length]);

  const handleHeroMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!heroCardRef.current) return;
    const rect = heroCardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    setTilt({
      x: -(y / (rect.height / 2)) * 14,
      y: (x / (rect.width / 2)) * 18,
    });
  };

  const handleHeroMouseLeave = () => {
    setTilt({ x: 8, y: -6 });
  };

  const currentPrice = priceSteps[stepIdx];
  const originalPrice = 3000;
  const isFinalStep = stepIdx === priceSteps.length - 1;
  const savings = originalPrice - currentPrice;

  return (
    <div className="space-y-28">
      {/* 1. HERO SECTION WITH 3D CYBER CANVAS & PARALLAX STAGE */}
      <section className="relative pt-6 pb-16 overflow-hidden">
        {/* Interactive 3D Holographic Particle Matrix Canvas themed */}
        <CyberScene3D
          intensity="active"
          className="opacity-75"
          particleColors={theme.particleColors}
          ringColors={theme.ringColors}
        />

        {/* Dynamic theme ambient background glows */}
        <div
          className={`absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[720px] h-[420px] rounded-full blur-[140px] pointer-events-none opacity-60 bg-gradient-to-tr ${theme.ambientMesh}`}
        />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Bold Tagline & Action */}
          <div className="lg:col-span-7 space-y-7">
            {/* User Requested Badge: SHOP. NEGOTIATE. */}
            <div
              className={`inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border text-xs font-mono shadow-lg backdrop-blur-md ${theme.badgeBg}`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full animate-pulse"
                style={{ backgroundColor: theme.primaryAccentHex }}
              />
              <span className="font-bold tracking-widest uppercase">SHOP. NEGOTIATE.</span>
              <span className="text-slate-500">|</span>
              <span className="text-slate-300">Autonomous AI Protocol</span>
            </div>

            {/* User Requested Headline: Your AI talks to their AI */}
            <h1
              className={`font-display font-extrabold text-4xl sm:text-6xl lg:text-7xl tracking-tight leading-[1.05] text-balance ${
                theme.isLight ? 'text-slate-900' : 'text-[#F2F5F7]'
              }`}
            >
              YOUR AI TALKS TO{' '}
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage: theme.isLight
                    ? `linear-gradient(135deg, ${theme.primaryAccentHex}, ${theme.secondaryAccentHex})`
                    : `linear-gradient(135deg, ${theme.primaryAccentHex}, ${theme.secondaryAccentHex}, #ffffff)`,
                }}
              >
                THEIR AI.
              </span>
            </h1>

            <p
              className={`text-base sm:text-lg leading-relaxed max-w-xl ${
                theme.isLight ? 'text-slate-600' : 'text-[#AAB3BC]'
              }`}
            >
              Tell your personal AI what you want and your maximum budget. Your Buyer AI negotiates in real-time with merchant Seller AI agents to secure genuine discounts strictly before checkout.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={() => {
                  soundEffects.playBlip();
                  onStartNegotiating();
                }}
                className="px-8 py-4 text-slate-950 font-extrabold text-sm rounded-xl shadow-xl transition-all transform hover:-translate-y-1 active:translate-y-0 flex items-center gap-2.5 cursor-pointer"
                style={{
                  background: `linear-gradient(135deg, ${theme.primaryAccentHex}, ${theme.secondaryAccentHex})`,
                  boxShadow: `0 10px 25px ${theme.primaryAccentHex}40`,
                }}
              >
                <span>Start Negotiating Now</span>
                <ArrowRight className="w-4 h-4 font-bold" />
              </button>

              <button
                onClick={() => {
                  soundEffects.playBlip();
                  onLaunchDemo();
                }}
                className={`px-6 py-4 font-bold text-sm rounded-xl border shadow-md transition-all flex items-center gap-2.5 cursor-pointer backdrop-blur-md ${
                  theme.isLight
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                    : 'bg-[#181D22] hover:bg-[#1E242A] text-white border-[#293139]'
                }`}
              >
                <Sparkles className="w-4 h-4 animate-spin" style={{ color: theme.primaryAccentHex }} />
                <span>Launch 1-Click Earbuds Demo (₹2,520)</span>
              </button>
            </div>

            {/* 3D Features Micro Badges */}
            <div
              className={`pt-3 flex flex-wrap items-center gap-6 text-xs font-mono ${
                theme.isLight ? 'text-slate-600' : 'text-[#AAB3BC]'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Locked Deal Token</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Bot className="w-4 h-4" style={{ color: theme.primaryAccentHex }} />
                <span>100% Agent-to-Agent</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-500" />
                <span>Game-Theoretic Concessions</span>
              </div>
            </div>
          </div>

          {/* Right Column: 3D Animated Hero Stage with Interactive Parallax */}
          <div className="lg:col-span-5 perspective-1200">
            <div
              ref={heroCardRef}
              onMouseMove={handleHeroMouseMove}
              onMouseLeave={handleHeroMouseLeave}
              className={`relative rounded-3xl border p-7 shadow-2xl transition-transform duration-200 transform-style-3d cursor-default backdrop-blur-xl ${
                theme.isLight
                  ? 'bg-white border-slate-200 shadow-slate-200/60'
                  : 'bg-[#181D22] border-[#293139] shadow-black/80'
              }`}
              style={{
                transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
                borderColor: theme.isLight ? '#E2E8F0' : `${theme.primaryAccentHex}40`,
                boxShadow: theme.isLight
                  ? '0 25px 50px -12px rgba(0, 0, 0, 0.08), 0 0 25px rgba(37, 99, 235, 0.1)'
                  : `0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 35px ${theme.primaryAccentHex}20`,
              }}
            >
              {/* Top simulation badge */}
              <div
                className={`flex items-center justify-between pb-3.5 mb-5 border-b ${
                  theme.isLight ? 'border-slate-200' : 'border-[#293139]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                  <span
                    className={`text-xs font-mono uppercase font-bold tracking-wider ${
                      theme.isLight ? 'text-slate-800' : 'text-slate-200'
                    }`}
                  >
                    Autonomous Bargaining Live
                  </span>
                </div>
                <div
                  className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[10px] font-mono"
                  style={{
                    backgroundColor: `${theme.primaryAccentHex}15`,
                    borderColor: `${theme.primaryAccentHex}40`,
                    color: theme.primaryAccentHex,
                  }}
                >
                  <Rotate3d className="w-3 h-3" />
                  <span>3D Interactive Stage</span>
                </div>
              </div>

              {/* Product preview card with 3D elevation */}
              <div
                className={`flex items-center gap-4 mb-5 p-3.5 rounded-2xl border shadow-md transform-style-3d ${
                  theme.isLight
                    ? 'bg-slate-50 border-slate-200'
                    : 'bg-[#1E242A] border-[#293139]'
                }`}
                style={{ transform: 'translateZ(25px)' }}
              >
                <img
                  src={earbudsImg}
                  alt="Apex Pulse Active ANC Wireless Earbuds"
                  referrerPolicy="no-referrer"
                  className={`w-16 h-16 rounded-xl object-cover border shadow-md ${
                    theme.isLight ? 'border-slate-200' : 'border-white/20'
                  }`}
                />
                <div>
                  <div
                    className="text-[10px] font-mono uppercase tracking-wider font-bold"
                    style={{ color: theme.primaryAccentHex }}
                  >
                    Target Negotiation Item
                  </div>
                  <h4
                    className={`text-sm font-bold line-clamp-1 ${
                      theme.isLight ? 'text-slate-900' : 'text-white'
                    }`}
                  >
                    Apex Pulse Active ANC Earbuds
                  </h4>
                  <div
                    className={`text-xs font-mono mt-0.5 ${
                      theme.isLight ? 'text-slate-600' : 'text-slate-300'
                    }`}
                  >
                    Seller: Apex Audio · Target:{' '}
                    <span className={`font-bold ${theme.isLight ? 'text-slate-900' : 'text-white'}`}>
                      ₹2,400
                    </span>
                  </div>
                </div>
              </div>

              {/* Agent Connection Pipeline Graphic */}
              <div className="py-2 space-y-3 transform-style-3d" style={{ transform: 'translateZ(35px)' }}>
                <div
                  className={`flex items-center justify-between text-xs font-mono px-1 ${
                    theme.isLight ? 'text-slate-600' : 'text-[#AAB3BC]'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold" style={{ color: theme.buyerBlue }}>
                    <Bot className="w-4 h-4" />
                    <span>BUYER AI</span>
                  </div>
                  <div
                    className={`text-[10px] uppercase tracking-widest ${
                      theme.isLight ? 'text-slate-400' : 'text-[#707A84]'
                    }`}
                  >
                    DUAL AGENT EXCHANGE
                  </div>
                  <div className="flex items-center gap-1.5 font-bold" style={{ color: theme.sellerAmber }}>
                    <Store className="w-4 h-4" />
                    <span>SELLER AI</span>
                  </div>
                </div>

                {/* Animated Bridge */}
                <div
                  className={`relative h-2 rounded-full overflow-hidden shadow-inner ${
                    theme.isLight ? 'bg-slate-200' : 'bg-[#13171B]'
                  }`}
                >
                  <div
                    className="absolute inset-y-0 rounded-full transition-all duration-500"
                    style={{
                      width: `${((stepIdx + 1) / priceSteps.length) * 100}%`,
                      background: `linear-gradient(90deg, ${theme.buyerBlue}, ${theme.sellerAmber})`,
                    }}
                  />
                </div>
              </div>

              {/* Dynamic Price Movement Box with 3D lift */}
              <div
                className={`mt-5 p-5 rounded-2xl border text-center relative overflow-hidden transition-all duration-300 transform-style-3d shadow-xl ${
                  isFinalStep
                    ? theme.isLight
                      ? 'bg-emerald-50 border-emerald-400 shadow-emerald-200/50'
                      : 'bg-emerald-950/90 border-emerald-400/80 shadow-emerald-950/60'
                    : theme.isLight
                    ? 'bg-slate-50 border-slate-200'
                    : 'bg-[#13171B] border-[#293139]'
                }`}
                style={{ transform: 'translateZ(45px)' }}
              >
                <div
                  className={`text-[10px] uppercase font-mono tracking-widest ${
                    theme.isLight ? 'text-slate-500' : 'text-[#707A84]'
                  }`}
                >
                  {isFinalStep ? 'DEAL SECURED BY YOUR AI' : 'Active Negotiated Offer'}
                </div>

                <div className="mt-1 flex items-baseline justify-center gap-3">
                  <span
                    className={`text-3xl sm:text-4xl font-extrabold font-mono tracking-tight transition-all duration-300 ${
                      isFinalStep
                        ? 'text-emerald-500 scale-105'
                        : theme.isLight
                        ? 'text-slate-900'
                        : 'text-[#F2F5F7]'
                    }`}
                  >
                    ₹{currentPrice.toLocaleString('en-IN')}
                  </span>
                  <span
                    className={`text-sm font-mono line-through ${
                      theme.isLight ? 'text-slate-400' : 'text-[#707A84]'
                    }`}
                  >
                    ₹{originalPrice.toLocaleString('en-IN')}
                  </span>
                </div>

                {savings > 0 && (
                  <div
                    className={`mt-2.5 inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-mono font-bold border ${
                      theme.isLight
                        ? 'bg-emerald-100 border-emerald-300 text-emerald-800'
                        : 'bg-emerald-900/60 border-emerald-600/60 text-emerald-300'
                    }`}
                  >
                    <TrendingDown className="w-4 h-4 text-emerald-500" />
                    <span>₹{savings.toLocaleString('en-IN')} SAVED BELOW LIST PRICE</span>
                  </div>
                )}
              </div>

              {/* Action trigger button */}
              <button
                onClick={() => {
                  soundEffects.playBlip();
                  onLaunchDemo();
                }}
                className="mt-5 w-full py-3 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center justify-center gap-2 transform-style-3d border"
                style={{
                  transform: 'translateZ(30px)',
                  backgroundColor: `${theme.primaryAccentHex}15`,
                  borderColor: `${theme.primaryAccentHex}40`,
                  color: theme.primaryAccentHex,
                }}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Click To Open Live Multi-Round Negotiator</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 2. USER REQUESTED 3D PIPELINE: Find → Negotiate → Secure → Buy */}
      <Pipeline3DStage onStartNegotiation={onStartNegotiating} currentThemeId={currentThemeId} />

      {/* 3. 3D INTERACTIVE PRODUCT SHOWCASE SECTION */}
      <section className="space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div
            className={`inline-flex items-center gap-2 px-3.5 py-1 rounded-full border text-xs font-mono ${theme.badgeBg}`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Interactive 3D Product Visualizer</span>
          </div>
          <h2
            className={`font-display font-extrabold text-2xl sm:text-4xl ${
              theme.isLight ? 'text-slate-900' : 'text-[#F2F5F7]'
            }`}
          >
            Inspect Hardware In 3D Space
          </h2>
          <p className={`text-xs sm:text-sm ${theme.isLight ? 'text-slate-600' : 'text-[#AAB3BC]'}`}>
            Rotate products in 3D perspective, check verified inventory, and deploy your Buyer AI immediately.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          <ProductViewer3D
            product={PRODUCTS[0]}
            onNegotiate={(prod) => onSelectProductForNegotiation(prod)}
            currentThemeId={currentThemeId}
          />
          <ProductViewer3D
            product={PRODUCTS[1]}
            onNegotiate={(prod) => onSelectProductForNegotiation(prod)}
            currentThemeId={currentThemeId}
          />
        </div>
      </section>

      {/* 4. MULTI-AGENT ARCHITECTURAL DIFFERENTIATION */}
      <section
        className={`rounded-3xl border p-8 sm:p-12 shadow-2xl space-y-8 backdrop-blur-md ${
          theme.isLight
            ? 'bg-slate-50/80 border-slate-200'
            : 'bg-[#13171B] border-[#293139]'
        }`}
        style={{
          borderColor: theme.isLight ? '#E2E8F0' : `${theme.primaryAccentHex}25`,
        }}
      >
        <div className="max-w-3xl space-y-3">
          <div
            className="text-xs font-mono uppercase tracking-widest font-bold"
            style={{ color: theme.primaryAccentHex }}
          >
            The Fundamental Paradigm Shift
          </div>
          <h2
            className={`font-display font-extrabold text-2xl sm:text-4xl ${
              theme.isLight ? 'text-slate-900' : 'text-[#F2F5F7]'
            }`}
          >
            Why DealMate Is Not Just Another Chatbot
          </h2>
          <p
            className={`text-xs sm:text-sm leading-relaxed ${
              theme.isLight ? 'text-slate-600' : 'text-[#AAB3BC]'
            }`}
          >
            Traditional shopping platforms force you to take or leave a static price. DealMate unlocks genuine agent-to-agent negotiation dynamics powered by game theory and real merchant rules.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          <div
            className={`p-6 rounded-2xl border space-y-3 shadow-lg ${
              theme.isLight
                ? 'bg-rose-50 border-rose-200'
                : 'bg-rose-950/20 border-rose-500/30'
            }`}
          >
            <span
              className={`text-xs font-mono font-bold uppercase ${
                theme.isLight ? 'text-rose-600' : 'text-rose-400'
              }`}
            >
              The Old E-Commerce Paradigm
            </span>
            <p className={`text-base font-bold ${theme.isLight ? 'text-slate-900' : 'text-white'}`}>
              User → Search → Fixed Static Price → Full Retail Markup
            </p>
            <p
              className={`text-xs leading-relaxed ${
                theme.isLight ? 'text-slate-600' : 'text-slate-400'
              }`}
            >
              No flexibility, expired coupon codes, and pricing models optimized purely for merchant profit.
            </p>
          </div>

          <div
            className={`p-6 rounded-2xl border space-y-3 shadow-lg ${
              theme.isLight
                ? 'bg-blue-50/70 border-blue-200'
                : 'border-[#293139]'
            }`}
            style={{
              backgroundColor: theme.isLight ? undefined : `${theme.primaryAccentHex}10`,
              borderColor: theme.isLight ? undefined : `${theme.primaryAccentHex}40`,
            }}
          >
            <span
              className="text-xs font-mono font-bold uppercase"
              style={{ color: theme.primaryAccentHex }}
            >
              The DealMate Paradigm
            </span>
            <p className={`text-base font-bold ${theme.isLight ? 'text-slate-900' : 'text-white'}`}>
              User → Tell AI → AI Matches → AI Negotiates → Deal Secured
            </p>
            <p
              className={`text-xs leading-relaxed ${
                theme.isLight ? 'text-slate-600' : 'text-[#AAB3BC]'
              }`}
            >
              Dynamic concessions based on current inventory, immediate cash capability, and verifiable game-theoretic equilibrium.
            </p>
          </div>
        </div>

        <div className="pt-4 flex justify-center">
          <button
            onClick={() => {
              soundEffects.playBlip();
              onExploreMarketplace();
            }}
            className="px-8 py-3.5 text-slate-950 font-bold text-sm rounded-xl shadow-lg cursor-pointer transition-all transform hover:-translate-y-0.5 active:translate-y-0"
            style={{
              background: `linear-gradient(135deg, ${theme.primaryAccentHex}, ${theme.secondaryAccentHex})`,
              boxShadow: `0 4px 20px ${theme.primaryAccentHex}30`,
            }}
          >
            Explore Complete Marketplace Catalog
          </button>
        </div>
      </section>
    </div>
  );
};
