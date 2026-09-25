import React, { useState, useRef } from 'react';
import { Product } from '../../types';
import { Sparkles, Eye, ShieldCheck, ArrowRight, RotateCw, Layers } from 'lucide-react';
import { soundEffects } from '../../services/soundEffects';
import { ThemeId, THEMES } from '../../types/theme';

interface ProductViewer3DProps {
  product: Product;
  onNegotiate: (product: Product) => void;
  currentThemeId?: ThemeId;
}

export const ProductViewer3D: React.FC<ProductViewer3DProps> = ({
  product,
  onNegotiate,
  currentThemeId = 'pure-white',
}) => {
  const theme = THEMES[currentThemeId] || THEMES['pure-white'];
  const containerRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState({ x: 8, y: -12 });
  const [isWireframe, setIsWireframe] = useState(false);
  const [activeHotspot, setActiveHotspot] = useState<string | null>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    setRotation({
      x: -(y / (rect.height / 2)) * 18,
      y: (x / (rect.width / 2)) * 22,
    });
  };

  const handleMouseLeave = () => {
    setRotation({ x: 8, y: -12 });
    setActiveHotspot(null);
  };

  const toggleWireframe = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsWireframe(!isWireframe);
    soundEffects.playBlip();
  };

  return (
    <div
      className={`relative rounded-3xl border p-6 shadow-2xl overflow-hidden perspective-1000 transition-colors ${
        theme.isLight
          ? 'bg-white border-slate-200 shadow-slate-200/80'
          : 'bg-[#181D22] border-[#293139] shadow-black/80'
      }`}
    >
      {/* Top Controls */}
      <div
        className={`flex items-center justify-between border-b pb-3 mb-4 ${
          theme.isLight ? 'border-slate-200' : 'border-[#293139]'
        }`}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-2.5 h-2.5 rounded-full animate-ping"
            style={{ backgroundColor: theme.primaryAccentHex }}
          />
          <span
            className={`text-xs font-mono font-bold uppercase tracking-wider ${
              theme.isLight ? 'text-slate-900' : 'text-white'
            }`}
          >
            3D Spatial Hologram
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleWireframe}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-mono border transition-all cursor-pointer flex items-center gap-1 ${
              isWireframe
                ? 'bg-blue-500/20 border-blue-400 text-blue-600'
                : theme.isLight
                ? 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900'
                : 'bg-[#1E242A] border-[#293139] text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3 h-3" />
            <span>{isWireframe ? 'Mesh Mode' : 'Solid Mode'}</span>
          </button>
          <span
            className={`text-[10px] font-mono border px-2 py-0.5 rounded ${
              theme.isLight
                ? 'bg-blue-50 border-blue-200 text-blue-700'
                : 'bg-[#1E242A] border-[#293139] text-cyan-300'
            }`}
          >
            Interactive Parallax
          </span>
        </div>
      </div>

      {/* 3D Viewport with interactive mouse rotation */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="relative h-72 sm:h-80 flex items-center justify-center transform-style-3d transition-transform duration-150 cursor-grab select-none"
        style={{
          transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
        }}
      >
        {/* Ground grid reflection */}
        <div
          className="absolute inset-x-12 bottom-4 h-24 rounded-full blur-2xl transform-style-3d pointer-events-none opacity-20"
          style={{
            transform: 'rotateX(80deg) translateZ(-40px)',
            backgroundColor: theme.primaryAccentHex,
          }}
        />

        {/* 3D Floating Product Image Card */}
        <div
          className={`relative w-48 h-48 sm:w-56 sm:h-56 rounded-2xl overflow-hidden border shadow-2xl transition-all duration-300 transform-style-3d ${
            isWireframe
              ? 'border-blue-400/80 shadow-[0_0_30px_rgba(37,99,235,0.4)] bg-blue-950/60'
              : theme.isLight
              ? 'border-slate-200 shadow-slate-300/50 bg-white'
              : 'border-[#293139] shadow-black/80 bg-[#1E242A]'
          }`}
          style={{ transform: 'translateZ(30px)' }}
        >
          <img
            src={product.image}
            alt={product.name}
            referrerPolicy="no-referrer"
            className={`w-full h-full object-cover transition-all duration-300 ${
              isWireframe ? 'opacity-40 invert filter contrast-200 hue-rotate-180' : 'opacity-95'
            }`}
          />

          {/* Wireframe holographic scanlines overlay */}
          {isWireframe && (
            <div
              className="absolute inset-0 pointer-events-none opacity-40"
              style={{
                backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 3px, ${theme.primaryAccentHex} 3px, ${theme.primaryAccentHex} 4px)`,
              }}
            />
          )}

          {/* Hologram specular light shine */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none" />
        </div>

        {/* Floating 3D Spatial Tag 1: Target Price */}
        <div
          className={`absolute -top-1 -right-2 sm:right-6 px-3 py-1.5 rounded-xl border backdrop-blur-md text-xs font-mono shadow-xl pointer-events-auto transform-style-3d ${
            theme.isLight
              ? 'bg-white/95 border-blue-200 text-blue-700'
              : 'bg-[#1E242A]/95 border-[#293139] text-[#4DA3FF]'
          }`}
          style={{ transform: 'translateZ(60px)' }}
          onMouseEnter={() => setActiveHotspot('target')}
        >
          <div className={`text-[9px] uppercase ${theme.isLight ? 'text-slate-400' : 'text-[#707A84]'}`}>
            Target Price
          </div>
          <div className="font-bold text-sm">₹{Math.round(product.listPrice * 0.8).toLocaleString('en-IN')}</div>
        </div>

        {/* Floating 3D Spatial Tag 2: Stock Availability */}
        <div
          className={`absolute -bottom-2 -left-2 sm:left-6 px-3 py-1.5 rounded-xl border backdrop-blur-md text-xs font-mono shadow-xl pointer-events-auto transform-style-3d ${
            theme.isLight
              ? 'bg-white/95 border-amber-200 text-amber-700'
              : 'bg-[#1E242A]/95 border-[#293139] text-[#F2A93B]'
          }`}
          style={{ transform: 'translateZ(50px)' }}
          onMouseEnter={() => setActiveHotspot('stock')}
        >
          <div className={`text-[9px] uppercase ${theme.isLight ? 'text-slate-400' : 'text-[#707A84]'}`}>
            Inventory Elasticity
          </div>
          <div className="font-bold text-xs">{product.stock} Units In Stock</div>
        </div>

        {/* Floating 3D Spatial Tag 3: Verified Merchant */}
        <div
          className={`absolute top-1/2 -left-4 px-2.5 py-1 rounded-xl border backdrop-blur-md text-[10px] font-mono shadow-xl transform-style-3d ${
            theme.isLight
              ? 'bg-white/95 border-emerald-200 text-emerald-700'
              : 'bg-[#1E242A]/95 border-[#293139] text-[#35D07F]'
          }`}
          style={{ transform: 'translateZ(55px)' }}
        >
          <ShieldCheck className="w-3.5 h-3.5 inline mr-1 text-emerald-500" />
          Verified AI Seller
        </div>
      </div>

      {/* Product metadata & Instant Negotiate CTA */}
      <div
        className={`mt-4 pt-4 border-t space-y-4 ${
          theme.isLight ? 'border-slate-200' : 'border-[#293139]'
        }`}
      >
        <div>
          <div className="flex items-center justify-between">
            <span
              className="text-xs font-mono uppercase font-bold"
              style={{ color: theme.buyerBlue }}
            >
              {product.brand}
            </span>
            <div className={`text-xs font-mono ${theme.isLight ? 'text-slate-400' : 'text-[#707A84]'}`}>
              List: <span className="line-through">₹{product.listPrice.toLocaleString('en-IN')}</span>
            </div>
          </div>
          <h3
            className={`font-display font-bold text-lg mt-0.5 ${
              theme.isLight ? 'text-slate-900' : 'text-white'
            }`}
          >
            {product.name}
          </h3>
          <p
            className={`text-xs line-clamp-2 mt-1 ${
              theme.isLight ? 'text-slate-600' : 'text-[#AAB3BC]'
            }`}
          >
            {product.description}
          </p>
        </div>

        <button
          onClick={() => {
            soundEffects.playBlip();
            onNegotiate(product);
          }}
          className="w-full py-3 text-slate-950 font-bold text-sm rounded-xl shadow-lg transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer"
          style={{
            background: `linear-gradient(135deg, ${theme.primaryAccentHex}, ${theme.secondaryAccentHex})`,
          }}
        >
          <Sparkles className="w-4 h-4" />
          <span>Launch AI-to-AI Negotiation (Target: ₹{Math.round(product.listPrice * 0.8).toLocaleString('en-IN')})</span>
          <ArrowRight className="w-4 h-4 font-bold" />
        </button>
      </div>
    </div>
  );
};
