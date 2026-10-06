import React, { useState, useRef, useEffect } from 'react';
import {
  Compass,
  Zap,
  Sparkles,
  ShieldCheck,
  ShoppingBag,
  Store,
  BarChart3,
  Users,
  Building2,
  Package,
  ArrowUpDown,
  ChevronDown,
  MapPin,
  QrCode,
  LineChart,
} from 'lucide-react';
import { ActiveNavTab } from '../Header';
import { ThemeConfig } from '../../../types/theme';
import { AppUser } from '../../../types';
import { soundEffects } from '../../../services/soundEffects';
import type { AuthRoutePath } from '../../auth/AuthModal';

interface DesktopNavigationProps {
  currentTab: ActiveNavTab;
  onNavigate: (tab: ActiveNavTab) => void;
  ordersCount: number;
  currentTheme: ThemeConfig;
  currentUser?: AppUser | null;
  onOpenAuthModal?: (route?: AuthRoutePath) => void;
}

export const DesktopNavigation: React.FC<DesktopNavigationProps> = ({
  currentTab,
  onNavigate,
  ordersCount,
  currentTheme,
  currentUser,
  onOpenAuthModal,
}) => {
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setIsMoreOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMoreOpen(false);
      }
    };
    if (isMoreOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMoreOpen]);

  // Role-based Navigation configuration
  const role = currentUser?.role || 'user';

  // 1. STANDARD USER & UNAUTHENTICATED NAVIGATION
  const userPrimaryItems: Array<{
    id: ActiveNavTab;
    label: string;
    icon: React.ReactNode;
    badgeCount?: number;
  }> = [
    {
      id: 'home',
      label: 'Overview',
      icon: <Compass className="w-3.5 h-3.5 shrink-0" />,
    },
    {
      id: 'negotiator',
      label: 'AI Negotiator',
      icon: <Zap className="w-3.5 h-3.5 shrink-0" />,
    },
    {
      id: 'ai_shopping',
      label: 'AI Deal Analyzer',
      icon: <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-blue-500" />,
    },
    {
      id: 'orders',
      label: 'Orders',
      icon: <ShoppingBag className="w-3.5 h-3.5 shrink-0" />,
      badgeCount: ordersCount,
    },
  ];

  // 2. SHOP OWNER NAVIGATION (Section 14)
  // Overview, Dashboard, Products, Negotiations, Orders
  const shopOwnerPrimaryItems: Array<{
    id: ActiveNavTab;
    label: string;
    icon: React.ReactNode;
    badgeCount?: number;
  }> = [
    {
      id: 'home',
      label: 'Overview',
      icon: <Compass className="w-3.5 h-3.5 shrink-0" />,
    },
    {
      id: 'store_owner_portal',
      label: 'Dashboard',
      icon: <Store className="w-3.5 h-3.5 shrink-0 text-emerald-500" />,
    },
    {
      id: 'categories',
      label: 'Products',
      icon: <Package className="w-3.5 h-3.5 shrink-0 text-cyan-500" />,
    },
    {
      id: 'negotiator',
      label: 'Negotiations',
      icon: <ArrowUpDown className="w-3.5 h-3.5 shrink-0 text-blue-500" />,
    },
    {
      id: 'orders',
      label: 'Orders',
      icon: <ShoppingBag className="w-3.5 h-3.5 shrink-0 text-emerald-500" />,
      badgeCount: ordersCount,
    },
  ];

  // 3. ADMIN NAVIGATION (Section 14)
  // Overview, Admin Dashboard, Users, Shop Owners, Products, Negotiations, Analytics
  const adminPrimaryItems: Array<{
    id: ActiveNavTab;
    label: string;
    icon: React.ReactNode;
    badgeCount?: number;
  }> = [
    {
      id: 'home',
      label: 'Overview',
      icon: <Compass className="w-3.5 h-3.5 shrink-0" />,
    },
    {
      id: 'admin',
      label: 'Admin Dashboard',
      icon: <BarChart3 className="w-3.5 h-3.5 shrink-0 text-amber-500" />,
    },
    {
      id: 'admin',
      label: 'Users',
      icon: <Users className="w-3.5 h-3.5 shrink-0 text-blue-500" />,
    },
    {
      id: 'admin',
      label: 'Shop Owners',
      icon: <Store className="w-3.5 h-3.5 shrink-0 text-emerald-500" />,
    },
    {
      id: 'categories',
      label: 'Products',
      icon: <Package className="w-3.5 h-3.5 shrink-0 text-purple-500" />,
    },
    {
      id: 'negotiator',
      label: 'Negotiations',
      icon: <ArrowUpDown className="w-3.5 h-3.5 shrink-0 text-cyan-500" />,
    },
    {
      id: 'admin',
      label: 'Analytics',
      icon: <LineChart className="w-3.5 h-3.5 shrink-0 text-rose-500" />,
    },
  ];

  const primaryItems =
    role === 'store_owner'
      ? shopOwnerPrimaryItems
      : role === 'admin'
      ? adminPrimaryItems
      : userPrimaryItems;

  const moreItems: Array<{
    key: string;
    tabId?: ActiveNavTab;
    label: string;
    description: string;
    icon: React.ReactNode;
    onClick: () => void;
  }> = [
    {
      key: 'local-maps',
      tabId: 'stores',
      label: 'Local Stores & Maps',
      description: 'Find verified physical stores near you',
      icon: <MapPin className="w-4 h-4 text-cyan-500" />,
      onClick: () => onNavigate('stores'),
    },
    {
      key: 'categories-view',
      tabId: 'categories',
      label: 'Categories & Catalogs',
      description: 'Explore Electronics, Fashion, Footwear, etc.',
      icon: <Package className="w-4 h-4 text-blue-500" />,
      onClick: () => onNavigate('categories'),
    },
    {
      key: 'store-owner',
      label: 'Store Owner Portal',
      description: 'Merchant dashboard & category floor rules',
      icon: <Store className="w-4 h-4 text-emerald-500" />,
      onClick: () => {
        if (!currentUser) {
          if (onOpenAuthModal) onOpenAuthModal('/auth/store');
        } else if (currentUser.role === 'store_owner') {
          onNavigate('store_owner_portal');
        } else {
          onNavigate('store_owner_portal');
        }
      },
    },
    {
      key: 'admin-panel',
      tabId: 'admin',
      label: 'Admin Console',
      description: 'Platform management, users, and audit logs',
      icon: <BarChart3 className="w-4 h-4 text-amber-500" />,
      onClick: () => {
        if (!currentUser || currentUser.role !== 'admin') {
          if (onOpenAuthModal) onOpenAuthModal('/auth/admin');
        } else {
          onNavigate('admin');
        }
      },
    },
  ];

  const isMoreActive =
    currentTab === 'stores' ||
    (role === 'user' && (currentTab === 'categories' || currentTab === 'store_owner_portal' || currentTab === 'admin'));

  return (
    <nav
      aria-label="Primary Navigation"
      className={`hidden md:flex items-center gap-1 lg:gap-1.5 p-1 rounded-2xl border transition-all shadow-xs ${
        currentTheme.isLight
          ? 'bg-slate-100/90 border-slate-200/90'
          : 'bg-[#141922]/90 border-slate-800'
      }`}
    >
      {primaryItems.map((item) => {
        const isActive = currentTab === item.id;
        return (
          <button
            key={`${item.id}-${item.label}`}
            type="button"
            onClick={() => {
              soundEffects.playBlip();
              onNavigate(item.id);
            }}
            aria-current={isActive ? 'page' : undefined}
            className={`group relative px-3 py-1.5 rounded-xl text-xs lg:text-[13px] font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
              isActive
                ? currentTheme.isLight
                  ? 'text-blue-700 font-bold bg-white border border-blue-200/90 shadow-xs ring-1 ring-blue-500/20'
                  : 'text-white font-bold bg-[#1C2432] border border-cyan-500/50 shadow-xs shadow-cyan-500/20'
                : currentTheme.isLight
                ? 'text-slate-700 hover:text-slate-950 hover:bg-white/80 border border-transparent'
                : 'text-slate-200 hover:text-white hover:bg-white/10 border border-transparent'
            }`}
          >
            {/* Icon with active highlight */}
            <span
              className={`transition-colors shrink-0 ${
                isActive
                  ? currentTheme.isLight
                    ? 'text-blue-600 scale-105'
                    : 'text-cyan-400 scale-105'
                  : currentTheme.isLight
                  ? 'text-slate-500 group-hover:text-blue-600'
                  : 'text-slate-400 group-hover:text-white'
              }`}
            >
              {item.icon}
            </span>

            {/* Label */}
            <span className="tracking-tight">{item.label}</span>

            {/* Orders or alerts Badge */}
            {item.badgeCount !== undefined && item.badgeCount > 0 && (
              <span
                className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full ${
                  isActive
                    ? currentTheme.isLight
                      ? 'bg-blue-600 text-white'
                      : 'bg-cyan-500 text-slate-950'
                    : currentTheme.isLight
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-blue-500/20 text-blue-300'
                }`}
              >
                {item.badgeCount}
              </span>
            )}

            {/* Clear Bottom Active Indicator Bar (Section 1) */}
            {isActive && (
              <span
                className={`absolute -bottom-1 left-2.5 right-2.5 h-0.5 rounded-full ${
                  currentTheme.isLight
                    ? 'bg-blue-600 shadow-xs'
                    : 'bg-cyan-400 shadow-sm shadow-cyan-400/50'
                }`}
              />
            )}
          </button>
        );
      })}

      {/* "More" Dropdown for Secondary Sections */}
      <div className="relative" ref={moreRef}>
        <button
          type="button"
          onClick={() => {
            soundEffects.playBlip();
            setIsMoreOpen((prev) => !prev);
          }}
          aria-expanded={isMoreOpen}
          aria-haspopup="menu"
          aria-label="More navigation sections"
          className={`relative px-3 py-1.5 rounded-xl text-xs lg:text-[13px] font-semibold transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
            isMoreActive || isMoreOpen
              ? currentTheme.isLight
                ? 'text-blue-700 font-bold bg-white border border-blue-200/90 shadow-xs ring-1 ring-blue-500/20'
                : 'text-white font-bold bg-[#1C2432] border border-cyan-500/50 shadow-xs'
              : currentTheme.isLight
              ? 'text-slate-700 hover:text-slate-950 hover:bg-white/80 border border-transparent'
              : 'text-slate-200 hover:text-white hover:bg-white/10 border border-transparent'
          }`}
        >
          <span>More</span>
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform duration-150 ${
              isMoreOpen ? 'rotate-180' : ''
            }`}
          />
          {isMoreActive && (
            <span
              className={`absolute -bottom-1 left-2.5 right-2.5 h-0.5 rounded-full ${
                currentTheme.isLight ? 'bg-blue-600' : 'bg-cyan-400'
              }`}
            />
          )}
        </button>

        {isMoreOpen && (
          <div
            role="menu"
            aria-label="Additional sections"
            className={`absolute left-0 mt-2 w-64 rounded-2xl border p-1.5 shadow-2xl z-50 backdrop-blur-xl ${
              currentTheme.isLight
                ? 'bg-white/98 border-slate-200 text-slate-800 shadow-slate-900/10'
                : 'bg-[#14191F]/98 border-[#293139] text-slate-100 shadow-black/80'
            }`}
          >
            {moreItems.map((item) => {
              const isSelected = item.tabId && currentTab === item.tabId;
              return (
                <button
                  key={item.key}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    soundEffects.playBlip();
                    item.onClick();
                    setIsMoreOpen(false);
                  }}
                  className={`w-full flex items-start gap-2.5 px-3 py-2 rounded-xl text-left transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                    isSelected
                      ? currentTheme.isLight
                        ? 'bg-blue-50 text-blue-700'
                        : 'bg-blue-950/40 text-blue-300'
                      : currentTheme.isLight
                      ? 'hover:bg-slate-100 text-slate-800'
                      : 'hover:bg-white/5 text-slate-200'
                  }`}
                >
                  <div
                    className={`mt-0.5 p-1.5 rounded-lg shrink-0 ${
                      currentTheme.isLight ? 'bg-slate-100' : 'bg-[#1D242C]'
                    }`}
                  >
                    {item.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold leading-tight">
                      {item.label}
                    </div>
                    <div
                      className={`text-[11px] truncate mt-0.5 ${
                        currentTheme.isLight ? 'text-slate-500' : 'text-slate-400'
                      }`}
                    >
                      {item.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </nav>
  );
};
