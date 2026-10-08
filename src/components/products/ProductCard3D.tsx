import React, { useRef, useState } from 'react';
import { Product } from '../../types';
import { Sparkles, Star, Zap, ArrowRight } from 'lucide-react';
import { INITIAL_COLLECTIVE_POOLS } from '../../data/catalog';
import { CollectiveDealIndicator } from '../common/CollectiveDealIndicator';

interface ProductCard3DProps {
  product: Product;
  onSelectForNegotiation: (product: Product) => void;
}

export const ProductCard3D: React.FC<ProductCard3DProps> = ({
  product,
  onSelectForNegotiation,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    // 3D tilt calculation
    const rotX = -(y / (rect.height / 2)) * 10;
    const rotY = (x / (rect.width / 2)) * 10;
    setRotate({ x: rotX, y: rotY });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotate({ x: 0, y: 0 });
  };

  const maxNegotiableDiscount = Math.round(
    ((product.listPrice - product.minAcceptablePrice) / product.listPrice) * 100
  );

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      className="relative rounded-2xl border border-slate-800 bg-gradient-to-b from-[#0F1420] via-[#0B0F19] to-[#080B12] p-5 shadow-xl transition-all duration-200 perspective-1000 group hover:border-cyan-500/40 hover:shadow-cyan-950/30 flex flex-col justify-between"
      style={{
        transform: isHovered
          ? `perspective(1000px) rotateX(${rotate.x}deg) rotateY(${rotate.y}deg) translateY(-4px)`
          : 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)',
      }}
    >
      <div>
        {/* Top bar with brand & negotiable flag */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {product.brand}
          </span>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-800/60 text-[11px] font-mono text-cyan-300">
            <Zap className="w-3 h-3 text-cyan-400" />
            <span>Up to {maxNegotiableDiscount}% Off with AI</span>
          </div>
        </div>

        {/* 3D Product Image Container */}
        <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-slate-900 border border-slate-800/80 mb-4 group-hover:shadow-lg transition-shadow">
          <img
            src={product.image}
            alt={product.name}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          {/* Subtle reflection overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#080B12] via-transparent to-transparent opacity-60" />

          {/* Stock indicator badge */}
          <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-slate-900/90 backdrop-blur-md border border-slate-700/60 text-[10px] font-mono text-emerald-400">
            {product.stock} units available
          </div>
        </div>

        {/* Title and Rating */}
        <div className="flex items-center gap-1.5 text-xs text-amber-400 mb-1">
          <Star className="w-3.5 h-3.5 fill-current" />
          <span className="font-bold text-white">{product.rating}</span>
          <span className="text-slate-500">({product.reviewsCount})</span>
          <span className="text-slate-600">·</span>
          <span className="text-slate-400 text-[11px]">{product.sellerName}</span>
        </div>

        <h3 className="font-display font-bold text-base text-white line-clamp-1 group-hover:text-cyan-300 transition-colors">
          {product.name}
        </h3>

        <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
          {product.description}
        </p>

        {/* Key Specs tags */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {Object.entries(product.specs)
            .slice(0, 2)
            .map(([key, val]) => (
              <span
                key={key}
                className="text-[10px] font-mono text-slate-300 bg-slate-800/60 border border-slate-700/50 px-2 py-0.5 rounded"
              >
                {key}: {val}
              </span>
            ))}
        </div>

        {/* Collective Deal Indicator for group buy opportunities */}
        {(() => {
          const matchedPool = INITIAL_COLLECTIVE_POOLS.find(
            (p) =>
              p.productId === product.id ||
              p.productName.toLowerCase() === product.name.toLowerCase()
          );
          if (matchedPool) {
            return (
              <div className="mt-3">
                <CollectiveDealIndicator pool={matchedPool} compact={true} />
              </div>
            );
          }
          return null;
        })()}
      </div>

      {/* Pricing & CTA Bottom Row */}
      <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between gap-3">
        <div>
          <div className="text-[10px] uppercase font-mono text-slate-400">List Price</div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-extrabold font-mono text-white tracking-tight">
              ₹{product.listPrice.toLocaleString('en-IN')}
            </span>
            <span className="text-xs font-mono text-slate-500 line-through">
              ₹{product.marketPrice.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        <button
          onClick={() => onSelectForNegotiation(product)}
          className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-semibold text-xs rounded-xl shadow-md shadow-cyan-500/20 transition-all flex items-center gap-1.5 cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan-200" />
          <span>Negotiate</span>
          <ArrowRight className="w-3 h-3 text-cyan-200" />
        </button>
      </div>
    </div>
  );
};
