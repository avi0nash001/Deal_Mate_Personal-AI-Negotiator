import React from 'react';
import { CATEGORIES_LIST } from '../../data/catalog';
import {
  Shirt,
  Footprints,
  ShoppingBasket,
  Cpu,
  Sparkles,
  Home,
  Gift,
  Watch,
  ArrowRight
} from 'lucide-react';

interface CategoriesViewProps {
  onSelectCategory: (categoryId: string) => void;
}

export const CategoriesView: React.FC<CategoriesViewProps> = ({
  onSelectCategory,
}) => {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Shirt': return <Shirt className="w-6 h-6 text-cyan-400" />;
      case 'Footprints': return <Footprints className="w-6 h-6 text-indigo-400" />;
      case 'ShoppingBasket': return <ShoppingBasket className="w-6 h-6 text-emerald-400" />;
      case 'Cpu': return <Cpu className="w-6 h-6 text-cyan-400" />;
      case 'Sparkles': return <Sparkles className="w-6 h-6 text-pink-400" />;
      case 'Home': return <Home className="w-6 h-6 text-amber-400" />;
      case 'Gift': return <Gift className="w-6 h-6 text-purple-400" />;
      case 'Watch': return <Watch className="w-6 h-6 text-sky-400" />;
      default: return <Shirt className="w-6 h-6 text-cyan-400" />;
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="border-b border-slate-800 pb-4">
        <h1 className="font-display font-extrabold text-2xl text-white">
          Explore Shopping Categories
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Pick any retail department and let SmartBuy AI discover options matching your exact spending ceiling.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {CATEGORIES_LIST.map((cat) => (
          <div
            key={cat.id}
            onClick={() => onSelectCategory(cat.id)}
            className="p-6 rounded-2xl bg-gradient-to-b from-[#0F1422] to-[#0A0D15] border border-slate-800 hover:border-cyan-500/50 hover:shadow-xl hover:shadow-cyan-950/20 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                {getIcon(cat.icon)}
              </div>
              <h3 className="font-display font-bold text-base text-white group-hover:text-cyan-300 transition-colors">
                {cat.name}
              </h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                {cat.desc}
              </p>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-500">
                {cat.count}
              </span>
              <span className="text-xs font-mono font-semibold text-cyan-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                <span>Shop with AI</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
