import React, { useState, useRef } from 'react';
import { Search, Bot, ShieldCheck, ShoppingCart, Zap, CheckCircle2, ArrowRight, Sparkles, TrendingDown, Lock } from 'lucide-react';
import { soundEffects } from '../../services/soundEffects';
import { ThemeId, THEMES } from '../../types/theme';

interface Pipeline3DStageProps {
  onStartNegotiation: () => void;
  currentThemeId?: ThemeId;
}

export const Pipeline3DStage: React.FC<Pipeline3DStageProps> = ({
  onStartNegotiation,
  currentThemeId = 'pure-white',
}) => {
  const theme = THEMES[currentThemeId] || THEMES['pure-white'];
  const [activeStep, setActiveStep] = useState<0 | 1 | 2 | 3>(1); // Default on Negotiate
  const containerRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 6, y: -4 });

  const steps = [
    {
      id: 0,
      title: 'FIND',
      tag: '01 · AI DISCOVERY',
      label: 'Find',
      headline: 'Autonomous Catalog Match',
      desc: 'You specify your product and budget ceiling. Your Buyer AI scans verified merchants for compatible stock elasticity.',
      icon: Search,
      color: 'cyan',
    },
    {
      id: 1,
      title: 'NEGOTIATE',
      tag: '02 · AI-TO-AI CONVERGENCE',
      label: 'Negotiate',
      headline: 'High-Frequency Concession War',
      desc: 'Buyer AI battles Seller AI over margins, payment terms, and inventory velocity. Zero manual haggling required.',
      icon: Zap,
      color: 'indigo',
    },
    {
      id: 2,
      title: 'SECURE',
      tag: '03 · CRYPTOGRAPHIC LOCK',
      label: 'Secure',
      headline: 'Deal Token Price Freeze',
      desc: 'When convergence matches your ceiling, both agents sign a cryptographic deal token. Price is guaranteed and locked.',
      icon: ShieldCheck,
      color: 'emerald',
    },
    {
      id: 3,
      title: 'BUY',
      tag: '04 · 1-CLICK FULFILLMENT',
      label: 'Buy',
      headline: 'Checkout at Negotiated Price',
      desc: 'Execute instant express checkout with UPI or Cards at the locked discount rate. Merchant fulfills directly.',
      icon: ShoppingCart,
      color: 'amber',
    },
  ];

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    setTilt({
      x: -(y / (rect.height / 2)) * 10,
      y: (x / (rect.width / 2)) * 12,
    });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 6, y: -4 });
  };

  const handleSelectStep = (idx: 0 | 1 | 2 | 3) => {
    setActiveStep(idx);
    soundEffects.playBlip();
  };

  return (
    <section className="relative my-10 sm:my-16 space-y-6 sm:space-y-10">
      {/* Ambient background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-72 bg-gradient-to-r from-cyan-600/10 via-indigo-600/15 to-emerald-600/10 blur-[100px] pointer-events-none" />

      {/* Header Badge & Title */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div
          className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-mono ${
            theme.isLight ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-[#1E242A] border-[#293139] text-[#4DA3FF]'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 animate-spin" style={{ color: theme.primaryAccentHex }} />
          <span className="font-bold tracking-wider uppercase">The 4-Step Autonomous Protocol</span>
        </div>
        <h2
          className={`font-display font-extrabold text-3xl sm:text-5xl tracking-tight ${
            theme.isLight ? 'text-slate-900' : 'text-[#F2F5F7]'
          }`}
        >
          Find <span className={theme.isLight ? 'text-slate-400' : 'text-slate-600'}>→</span> Negotiate{' '}
          <span className={theme.isLight ? 'text-slate-400' : 'text-slate-600'}>→</span> Secure{' '}
          <span className={theme.isLight ? 'text-slate-400' : 'text-slate-600'}>→</span>{' '}
          <span
            className="bg-clip-text text-transparent"
            style={{
              backgroundImage: `linear-gradient(135deg, ${theme.buyerBlue}, ${theme.dealEmerald})`,
            }}
          >
            Buy
          </span>
        </h2>
        <p
          className={`text-sm sm:text-base leading-relaxed max-w-xl mx-auto ${
            theme.isLight ? 'text-slate-600' : 'text-[#AAB3BC]'
          }`}
        >
          Explore how DealMate transforms static pricing into an autonomous, real-time bargaining exchange.
        </p>
      </div>

      {/* 3D Step Selector Pills */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl mx-auto">
        {steps.map((s, idx) => {
          const Icon = s.icon;
          const isActive = activeStep === idx;
          return (
            <button
              key={s.id}
              onClick={() => handleSelectStep(idx as 0 | 1 | 2 | 3)}
              className={`relative p-4 rounded-2xl border text-left transition-all duration-300 cursor-pointer overflow-hidden transform hover:-translate-y-1 ${
                isActive
                  ? theme.isLight
                    ? 'bg-blue-50/90 border-blue-400 shadow-md scale-[1.02]'
                    : 'bg-[#1E242A] border-[#3D4852] shadow-lg scale-[1.02]'
                  : theme.isLight
                  ? 'bg-white border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-900 shadow-xs'
                  : 'bg-[#13171B] border-[#293139] hover:border-[#3D4852] text-[#AAB3BC] hover:text-white'
              }`}
            >
              {isActive && (
                <div
                  className="absolute top-0 inset-x-0 h-1"
                  style={{
                    background: `linear-gradient(90deg, ${theme.buyerBlue}, ${theme.sellerAmber}, ${theme.dealEmerald})`,
                  }}
                />
              )}
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`text-[10px] font-mono tracking-widest uppercase ${
                    isActive ? 'font-bold' : theme.isLight ? 'text-slate-400' : 'text-slate-500'
                  }`}
                  style={{ color: isActive ? theme.primaryAccentHex : undefined }}
                >
                  STEP 0{idx + 1}
                </span>
                <div
                  className={`p-1.5 rounded-lg ${
                    isActive
                      ? 'bg-blue-500/15'
                      : theme.isLight
                      ? 'bg-slate-100 text-slate-500'
                      : 'bg-slate-800/60 text-slate-400'
                  }`}
                  style={{ color: isActive ? theme.primaryAccentHex : undefined }}
                >
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div
                className={`font-display font-bold text-lg ${
                  theme.isLight ? 'text-slate-900' : 'text-white'
                }`}
              >
                {s.title}
              </div>
              <div
                className={`text-[11px] line-clamp-1 mt-0.5 ${
                  theme.isLight ? 'text-slate-500' : 'text-[#707A84]'
                }`}
              >
                {s.headline}
              </div>
            </button>
          );
        })}
      </div>

      {/* 3D Interactive Stage Holographic Canvas Box */}
      <div className="max-w-4xl mx-auto perspective-1200">
        <div
          ref={containerRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className={`relative rounded-3xl border p-4 sm:p-8 shadow-2xl transform-style-3d transition-transform duration-200 ${
            theme.isLight
              ? 'bg-white border-slate-200 shadow-slate-200/80'
              : 'bg-[#181D22] border-[#293139] shadow-black/80'
          }`}
          style={{
            transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
            borderColor: theme.isLight ? '#E2E8F0' : `${theme.primaryAccentHex}30`,
          }}
        >
          {/* Top Stage Bar */}
          <div
            className={`flex flex-wrap items-center justify-between border-b pb-4 mb-6 ${
              theme.isLight ? 'border-slate-200' : 'border-[#293139]'
            }`}
          >
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full animate-pulse"
                style={{ backgroundColor: theme.primaryAccentHex }}
              />
              <span
                className="text-xs font-mono uppercase tracking-widest font-bold"
                style={{ color: theme.primaryAccentHex }}
              >
                {steps[activeStep].tag}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`text-[11px] font-mono ${
                  theme.isLight ? 'text-slate-500' : 'text-[#707A84]'
                }`}
              >
                Status: Active Simulation
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono border ${
                  theme.isLight
                    ? 'bg-slate-100 border-slate-200 text-slate-700'
                    : 'bg-[#1E242A] border-[#293139] text-cyan-300'
                }`}
              >
                Depth Layer 3D
              </span>
            </div>
          </div>

          {/* Interactive Dynamic 3D Scene based on activeStep */}
          <div className="min-h-[260px] flex items-center justify-center py-4">
            {/* Step 0: FIND */}
            {activeStep === 0 && (
              <div className="w-full space-y-6 text-center transform-style-3d" style={{ transform: 'translateZ(30px)' }}>
                <div className="relative inline-flex items-center justify-center w-24 h-24 rounded-full bg-cyan-950/40 border border-cyan-500/40 shadow-2xl shadow-cyan-500/30">
                  <div className="absolute inset-0 rounded-full border border-cyan-400/30 animate-ping" />
                  <Search className="w-10 h-10 text-cyan-300" />
                </div>
                <div className="space-y-2 max-w-md mx-auto">
                  <h4 className="text-xl font-display font-bold text-white">
                    Buyer Intent Parsing & Catalog Matching
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed font-mono">
                    "I want premium ANC earbuds under ₹2,600."
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <div className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 text-xs font-mono text-cyan-300">
                    Extracted Target: ₹2,400
                  </div>
                  <div className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 text-xs font-mono text-amber-300">
                    Max Ceiling: ₹2,600
                  </div>
                  <div className="px-3.5 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-700/60 text-xs font-mono text-emerald-300">
                    Candidate: Apex Pulse ANC (List ₹3,000)
                  </div>
                </div>
              </div>
            )}

            {/* Step 1: NEGOTIATE */}
            {activeStep === 1 && (
              <div className="w-full space-y-6 transform-style-3d" style={{ transform: 'translateZ(40px)' }}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                  {/* Left Pod */}
                  <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 text-center space-y-2">
                    <div className="w-10 h-10 mx-auto rounded-xl bg-cyan-500/20 flex items-center justify-center text-cyan-300">
                      <Bot className="w-5 h-5" />
                    </div>
                    <div className="text-xs font-bold text-white">Your Buyer AI</div>
                    <div className="text-[11px] font-mono text-cyan-300 font-bold bg-cyan-950/80 py-1 rounded">
                      Offer: ₹2,450
                    </div>
                    <div className="text-[10px] text-slate-400">"Immediate UPI checkout if agreed"</div>
                  </div>

                  {/* Middle Conduit */}
                  <div className="text-center space-y-2">
                    <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                      Live Multi-Turn Rounds
                    </div>
                    <div className="relative h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-cyan-400 via-indigo-500 to-amber-400 animate-pulse" />
                    </div>
                    <div className="text-xs font-mono text-emerald-400 font-bold">
                      Price Delta Converging (₹70 gap)
                    </div>
                  </div>

                  {/* Right Pod */}
                  <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/30 text-center space-y-2">
                    <div className="w-10 h-10 mx-auto rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-300">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div className="text-xs font-bold text-white">Seller AI (Apex)</div>
                    <div className="text-[11px] font-mono text-amber-300 font-bold bg-amber-950/80 py-1 rounded">
                      Counter: ₹2,520
                    </div>
                    <div className="text-[10px] text-slate-400">"14 units left in inventory"</div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-center text-xs font-mono text-slate-300">
                  ⚡ Game Theory Rule: Buyer AI accepts when counter falls strictly below your maximum budget ceiling.
                </div>
              </div>
            )}

            {/* Step 2: SECURE */}
            {activeStep === 2 && (
              <div className="w-full space-y-5 text-center transform-style-3d" style={{ transform: 'translateZ(45px)' }}>
                <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border-2 border-emerald-400 text-emerald-300 shadow-2xl shadow-emerald-500/30 animate-bounce">
                  <Lock className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xl font-display font-bold text-white">
                    Deal Secured: ₹2,520
                  </h4>
                  <p className="text-xs font-mono text-emerald-400 font-bold">
                    SAVED ₹480 (16% BELOW LIST PRICE)
                  </p>
                </div>

                <div className="max-w-md mx-auto p-4 rounded-2xl bg-slate-900/90 border border-emerald-500/40 text-left font-mono text-xs space-y-1.5 shadow-inner">
                  <div className="flex justify-between text-slate-400">
                    <span>TOKEN ID:</span>
                    <span className="text-cyan-300">DM-SEC-8F29A4</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>EXPIRATION:</span>
                    <span className="text-amber-300">14:59 (Locked Price Guaranteed)</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>SIGNATURE:</span>
                    <span className="text-emerald-400">VALID_MERCHANT_ECDSA</span>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: BUY */}
            {activeStep === 3 && (
              <div className="w-full space-y-5 text-center transform-style-3d" style={{ transform: 'translateZ(30px)' }}>
                <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-emerald-300">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xl font-display font-bold text-white">
                    Express 1-Click Purchase
                  </h4>
                  <p className="text-xs text-slate-400">
                    Original Price: <span className="line-through text-slate-500">₹3,000</span> →{' '}
                    <span className="text-emerald-400 font-bold font-mono text-base">₹2,520</span>
                  </p>
                </div>

                <div className="flex justify-center pt-2">
                  <button
                    onClick={onStartNegotiation}
                    className="px-8 py-3.5 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 text-slate-950 font-extrabold text-sm rounded-xl shadow-xl shadow-emerald-500/30 transition-all transform hover:-translate-y-1 active:translate-y-0 flex items-center gap-2 cursor-pointer"
                  >
                    <span>Launch Live Negotiation Now</span>
                    <ArrowRight className="w-4 h-4 font-bold" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Bottom helper info */}
          <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs font-mono text-slate-400">
            <span>{steps[activeStep].desc}</span>
            <span className="text-cyan-400 cursor-pointer hover:underline" onClick={() => handleSelectStep(((activeStep + 1) % 4) as 0 | 1 | 2 | 3)}>
              Next Step →
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
