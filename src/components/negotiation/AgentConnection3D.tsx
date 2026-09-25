import React, { useState, useRef, useEffect } from 'react';
import { AgentAvatar } from './AgentAvatar';
import { ArrowLeftRight, Activity, ShieldCheck, Zap, Lock, Sparkles, Volume2, VolumeX } from 'lucide-react';
import { NegotiationStatus } from '../../types';
import { soundEffects } from '../../services/soundEffects';

interface AgentConnection3DProps {
  buyerName?: string;
  sellerName?: string;
  status: NegotiationStatus;
  currentOffer: number;
  originalPrice: number;
  activeSpeaker?: 'BUYER' | 'SELLER' | 'SYSTEM';
  stepIndex?: number;
}

export const AgentConnection3D: React.FC<AgentConnection3DProps> = ({
  buyerName = 'Buyer Agent (You)',
  sellerName = 'Seller Agent (Apex Audio)',
  status,
  currentOffer,
  originalPrice,
  activeSpeaker = 'BUYER',
  stepIndex = 0,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState({ x: 12, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(soundEffects.enabled);

  // Play sound effect when speaker or status changes
  useEffect(() => {
    if (status === 'DEAL_ACCEPTED') {
      soundEffects.playDealSecured();
    } else if (activeSpeaker === 'BUYER') {
      soundEffects.playBuyerOffer();
    } else if (activeSpeaker === 'SELLER') {
      soundEffects.playSellerCounter();
    }
  }, [status, activeSpeaker, stepIndex]);

  const toggleSound = () => {
    soundEffects.enabled = !soundEffects.enabled;
    setSoundEnabled(soundEffects.enabled);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    // Calculate 3D tilt angles with enhanced perspective
    const rotX = -(y / (rect.height / 2)) * 16 + 10;
    const rotY = (x / (rect.width / 2)) * 20;
    setRotation({ x: rotX, y: rotY });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotation({ x: 10, y: 0 }); // reset to default cinematic angle
  };

  const isAccepted = status === 'DEAL_ACCEPTED';
  const isTerminated = status === 'DEAL_REJECTED' || status === 'BUDGET_EXCEEDED';
  const savings = Math.max(0, originalPrice - currentOffer);

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      className="relative w-full overflow-hidden rounded-3xl border border-cyan-500/30 bg-gradient-to-b from-[#0F1628] via-[#0A0E1A] to-[#070912] p-6 perspective-1200 select-none shadow-2xl transition-all duration-300"
    >
      {/* Dynamic 3D depth background neon grid */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none transition-transform duration-200"
        style={{
          backgroundImage: `radial-gradient(circle at 50% 50%, rgba(6, 182, 212, 0.35) 1.5px, transparent 1.5px), radial-gradient(circle at 50% 50%, rgba(245, 158, 11, 0.25) 1.5px, transparent 1.5px)`,
          backgroundSize: '28px 28px, 56px 56px',
          transform: `rotateX(${rotation.x * 0.5}deg) rotateY(${rotation.y * 0.5}deg) scale(1.1)`,
        }}
      />

      {/* Atmospheric ambient background light */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header bar of 3D Arena */}
      <div className="relative z-10 flex items-center justify-between mb-4 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
            Autonomous Bargaining Arena 3D
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleSound}
            title={soundEnabled ? 'Mute AI Audio' : 'Unmute AI Audio'}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer border border-slate-700/60"
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-cyan-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-500" />}
          </button>
          <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 shadow-sm">
            Holographic Spatial Stage
          </span>
        </div>
      </div>

      {/* Main 3D Spatial Arena Transform Container */}
      <div
        className="relative py-6 transition-transform duration-150 ease-out transform-style-3d"
        style={{
          transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) translateZ(15px)`,
        }}
      >
        {/* Spatial Connection Ground Plane Glow */}
        <div className="absolute inset-x-8 bottom-0 h-20 bg-gradient-to-t from-cyan-950/30 via-indigo-950/20 to-transparent blur-xl pointer-events-none" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {/* Left: Buyer AI Pod with 3D Elevation */}
          <div
            className={`flex flex-col items-center text-center p-5 rounded-2xl border transition-all duration-300 transform-style-3d shadow-xl ${
              activeSpeaker === 'BUYER'
                ? 'border-cyan-400/80 bg-gradient-to-b from-cyan-950/50 via-[#0E1526] to-[#0A0E18] shadow-cyan-500/20'
                : 'border-cyan-500/20 bg-gradient-to-b from-cyan-950/20 to-[#0A0E18]/80'
            }`}
            style={{ transform: 'translateZ(35px)' }}
          >
            <AgentAvatar
              type="BUYER"
              size="lg"
              status={
                isAccepted
                  ? 'ACCEPTED'
                  : isTerminated
                  ? 'REJECTED'
                  : activeSpeaker === 'BUYER'
                  ? 'NEGOTIATING'
                  : 'WAITING'
              }
            />
            <div className="mt-3">
              <h4 className="text-sm font-bold text-white tracking-wide">{buyerName}</h4>
              <p className="text-[11px] text-cyan-400 font-mono mt-0.5">Autonomous Buyer Agent</p>
              <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-700/50 text-[11px] text-cyan-300 font-mono shadow-sm">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                <span>Enforcing Your Budget Ceiling</span>
              </div>
            </div>
          </div>

          {/* Center: Live 3D Holographic Bridge & Conduit */}
          <div
            className="flex flex-col items-center justify-center relative py-2 transform-style-3d"
            style={{ transform: 'translateZ(55px)' }}
          >
            {/* Animated Conduit Laser */}
            <div className="relative w-full flex items-center justify-center my-3">
              <div className="w-full h-1.5 bg-gradient-to-r from-cyan-400 via-indigo-400 to-amber-400 rounded-full shadow-[0_0_15px_rgba(6,182,212,0.8)] relative overflow-hidden">
                {/* Moving energetic pulse packet */}
                <div
                  className={`absolute top-0 bottom-0 w-16 bg-white rounded-full blur-[1px] ${
                    activeSpeaker === 'BUYER'
                      ? 'animate-[shimmer_1.2s_infinite_linear]'
                      : 'animate-[shimmer_1.2s_infinite_reverse_linear]'
                  }`}
                  style={{
                    background:
                      activeSpeaker === 'BUYER'
                        ? 'linear-gradient(90deg, transparent, #38BDF8, #ffffff)'
                        : 'linear-gradient(90deg, #ffffff, #F59E0B, transparent)',
                  }}
                />
              </div>

              {/* Center 3D Core Node */}
              <div
                className={`absolute w-11 h-11 rounded-2xl flex items-center justify-center border-2 shadow-2xl transition-all duration-300 transform hover:rotate-12 ${
                  isAccepted
                    ? 'bg-emerald-950 border-emerald-400 text-emerald-300 shadow-emerald-500/60 scale-125'
                    : 'bg-[#0E1526] border-indigo-400/70 text-indigo-300 shadow-indigo-500/40'
                }`}
              >
                {isAccepted ? (
                  <ShieldCheck className="w-6 h-6 text-emerald-300 animate-pulse" />
                ) : (
                  <ArrowLeftRight className="w-5 h-5 text-cyan-300 animate-pulse" />
                )}
              </div>
            </div>

            {/* Live Floating Price Hologram with 3D depth */}
            <div
              className={`mt-4 px-5 py-3 rounded-2xl border backdrop-blur-md shadow-2xl text-center transform-style-3d transition-all duration-300 ${
                isAccepted
                  ? 'bg-emerald-950/90 border-emerald-400/80 shadow-emerald-950/80'
                  : 'bg-slate-900/95 border-slate-700/80'
              }`}
              style={{ transform: 'translateZ(40px)' }}
            >
              <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400">
                {isAccepted ? 'SECURED DEAL PRICE' : 'ACTIVE CONVERGENCE PRICE'}
              </div>
              <div className="text-3xl font-extrabold font-mono text-white mt-1 tracking-tight flex items-center justify-center gap-1.5">
                <span className={isAccepted ? 'text-emerald-400' : 'text-cyan-300'}>
                  ₹{currentOffer.toLocaleString('en-IN')}
                </span>
              </div>
              {savings > 0 && (
                <div className="text-xs font-mono text-emerald-400 font-bold mt-1 inline-flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Saved ₹{savings.toLocaleString('en-IN')} below retail</span>
                </div>
              )}
            </div>

            {/* Negotiation State Label */}
            <div className="mt-3 text-[11px] font-mono text-slate-300 flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-800">
              <Zap className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>
                {status === 'DEAL_ACCEPTED'
                  ? 'Cryptographic equilibrium verified'
                  : activeSpeaker === 'BUYER'
                  ? 'Buyer Agent negotiating concessions...'
                  : 'Seller Agent assessing margin room...'}
              </span>
            </div>
          </div>

          {/* Right: Seller AI Pod with 3D Elevation */}
          <div
            className={`flex flex-col items-center text-center p-5 rounded-2xl border transition-all duration-300 transform-style-3d shadow-xl ${
              activeSpeaker === 'SELLER'
                ? 'border-amber-400/80 bg-gradient-to-b from-amber-950/50 via-[#0E1526] to-[#0A0E18] shadow-amber-500/20'
                : 'border-amber-500/20 bg-gradient-to-b from-amber-950/20 to-[#0A0E18]/80'
            }`}
            style={{ transform: 'translateZ(35px)' }}
          >
            <AgentAvatar
              type="SELLER"
              size="lg"
              status={
                isAccepted
                  ? 'ACCEPTED'
                  : isTerminated
                  ? 'REJECTED'
                  : activeSpeaker === 'SELLER'
                  ? 'NEGOTIATING'
                  : 'WAITING'
              }
            />
            <div className="mt-3">
              <h4 className="text-sm font-bold text-white tracking-wide">{sellerName}</h4>
              <p className="text-[11px] text-amber-400 font-mono mt-0.5">Merchant Pricing Agent</p>
              <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/80 border border-amber-700/50 text-[11px] text-amber-300 font-mono shadow-sm">
                <Activity className="w-3.5 h-3.5 text-amber-400" />
                <span>Evaluating Inventory & Margins</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

