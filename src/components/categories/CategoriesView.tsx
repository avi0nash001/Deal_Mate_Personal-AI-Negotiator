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
  ArrowRight,
} from 'lucide-react';
import { ThemeId, THEMES } from '../../types/theme';

interface CategoriesViewProps {
  onSelectCategory: (categoryId: string) => void;
  currentThemeId?: ThemeId;
}

export const CategoriesView: React.FC<CategoriesViewProps> = ({
  onSelectCategory,
  currentThemeId = 'pure-white',
}) => {
  const currentTheme = THEMES[currentThemeId] || THEMES['pure-white'];
  const isLight = currentTheme.isLight;

  const getCategoryTheme = (iconName: string) => {
    switch (iconName) {
      case 'Shirt':
        return {
          lightBg: 'bg-sky-50 border-sky-100 text-sky-600',
          darkBg: 'bg-[var(--dm-surface-3)] border-[var(--border)] text-cyan-400',
          icon: <Shirt className="w-6 h-6" />,
        };
      case 'Footprints':
        return {
          lightBg: 'bg-indigo-50 border-indigo-100 text-indigo-600',
          darkBg: 'bg-[var(--dm-surface-3)] border-[var(--border)] text-indigo-400',
          icon: <Footprints className="w-6 h-6" />,
        };
      case 'ShoppingBasket':
        return {
          lightBg: 'bg-emerald-50 border-emerald-100 text-emerald-600',
          darkBg: 'bg-[var(--dm-surface-3)] border-[var(--border)] text-emerald-400',
          icon: <ShoppingBasket className="w-6 h-6" />,
        };
      case 'Cpu':
        return {
          lightBg: 'bg-blue-50 border-blue-100 text-blue-600',
          darkBg: 'bg-[var(--dm-surface-3)] border-[var(--border)] text-cyan-400',
          icon: <Cpu className="w-6 h-6" />,
        };
      case 'Sparkles':
        return {
          lightBg: 'bg-pink-50 border-pink-100 text-pink-600',
          darkBg: 'bg-[var(--dm-surface-3)] border-[var(--border)] text-pink-400',
          icon: <Sparkles className="w-6 h-6" />,
        };
      case 'Home':
        return {
          lightBg: 'bg-amber-50 border-amber-100 text-amber-600',
          darkBg: 'bg-[var(--dm-surface-3)] border-[var(--border)] text-amber-400',
          icon: <Home className="w-6 h-6" />,
        };
      case 'Gift':
        return {
          lightBg: 'bg-purple-50 border-purple-100 text-purple-600',
          darkBg: 'bg-[var(--dm-surface-3)] border-[var(--border)] text-purple-400',
          icon: <Gift className="w-6 h-6" />,
        };
      case 'Watch':
        return {
          lightBg: 'bg-teal-50 border-teal-100 text-teal-600',
          darkBg: 'bg-[var(--dm-surface-3)] border-[var(--border)] text-sky-400',
          icon: <Watch className="w-6 h-6" />,
        };
      default:
        return {
          lightBg: 'bg-blue-50 border-blue-100 text-blue-600',
          darkBg: 'bg-[var(--dm-surface-3)] border-[var(--border)] text-cyan-400',
          icon: <Shirt className="w-6 h-6" />,
        };
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header section with semantic theme variables */}
      <div className="pb-4 border-b border-[var(--border)] transition-colors duration-300">
        <h1 className="font-display font-extrabold text-2xl sm:text-3xl tracking-tight text-[var(--text-primary)] transition-colors duration-300">
          Explore Shopping Categories
        </h1>
        <p className="text-xs sm:text-sm mt-1.5 leading-relaxed text-[var(--text-secondary)] transition-colors duration-300">
          Pick any retail department and let SmartBuy AI discover options matching your exact spending ceiling.
        </p>
      </div>

      {/* 8 Product Category Cards in Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {CATEGORIES_LIST.map((cat) => {
          const themeStyle = getCategoryTheme(cat.icon);
          return (
            <div
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`p-6 rounded-2xl transition-all duration-200 cursor-pointer group flex flex-col justify-between h-full min-h-[230px] border ${
                isLight
                  ? 'bg-surface border-slate-200/90 hover:border-blue-400 hover:shadow-lg hover:shadow-blue-500/5 hover:-translate-y-1'
                  : 'bg-[var(--dm-surface)] border-[var(--border)] hover:border-cyan-500/50 hover:shadow-xl hover:shadow-cyan-950/20 hover:-translate-y-1'
              }`}
            >
              <div>
                {/* Soft pastel icon container in light mode, subtle dark surface in dark mode */}
                <div
                  className={`w-12 h-12 rounded-2xl border flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-200 ${
                    isLight ? themeStyle.lightBg : themeStyle.darkBg
                  }`}
                >
                  {themeStyle.icon}
                </div>

                {/* Category title using text-primary */}
                <h3 className="font-display font-bold text-base text-[var(--text-primary)] group-hover:text-blue-500 transition-colors duration-200">
                  {cat.name}
                </h3>

                {/* Description using text-secondary */}
                <p className="text-xs mt-1.5 leading-relaxed text-[var(--text-secondary)] transition-colors duration-200">
                  {cat.desc}
                </p>
              </div>

              {/* Bottom footer with item count and clear interactive link */}
              <div className="mt-5 pt-3 border-t border-[var(--border)] flex items-center justify-between transition-colors duration-200">
                <span className="text-[11px] font-mono font-medium text-[var(--text-muted)]">
                  {cat.count}
                </span>

                <span className="text-xs font-mono font-semibold flex items-center gap-1 text-[var(--accent)] group-hover:translate-x-1 transition-all duration-200">
                  <span>Shop with AI</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
