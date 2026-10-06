import React, { useState, useEffect } from 'react';
import {
  Menu,
  X,
  Zap,
  Sparkles,
  ShoppingBag,
  Home,
  User,
  Store,
  ShieldCheck,
  QrCode,
  Globe,
  MapPin,
  BarChart3,
  Sun,
  Moon,
  Monitor,
  Bell,
  Volume2,
  VolumeX,
  LogOut,
  Layers,
} from 'lucide-react';
import { ActiveNavTab } from '../Header';
import { ThemeId, ThemeConfig } from '../../../types/theme';
import { AppUser } from '../../../types';
import { soundEffects } from '../../../services/soundEffects';
import type { AuthRoutePath } from '../../auth/AuthModal';

interface MobileNavigationProps {
  currentTab: ActiveNavTab;
  onNavigate: (tab: ActiveNavTab) => void;
  ordersCount: number;
  savedCount: number;
  comparedCount: number;
  onOpenAccount: (
    initialTab?: 'profile' | 'saved_products' | 'saved_stores' | 'history' | 'settings'
  ) => void;
  onOpenCompare: () => void;
  currentThemeId: ThemeId;
  currentTheme: ThemeConfig;
  onSelectTheme: (themeId: ThemeId) => void;
  currentUser?: AppUser | null;
  onOpenAuthModal?: (route?: AuthRoutePath) => void;
  onSignOut?: () => void;
  totalPlatformSavings?: number;
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({
  currentTab,
  onNavigate,
  ordersCount,
  savedCount,
  comparedCount,
  onOpenAccount,
  onOpenCompare,
  currentThemeId,
  currentTheme,
  onSelectTheme,
  currentUser,
  onOpenAuthModal,
  onSignOut,
  totalPlatformSavings = 18420,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(soundEffects.enabled);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const toggleSound = () => {
    soundEffects.enabled = !soundEffects.enabled;
    setSoundEnabled(soundEffects.enabled);
    if (soundEffects.enabled) {
      soundEffects.playBlip();
    }
  };

  const handleNav = (tab: ActiveNavTab) => {
    soundEffects.playBlip();
    onNavigate(tab);
    setIsOpen(false);
  };

  const role = currentUser?.role || 'user';

  const userMainItems: Array<{
    id: ActiveNavTab;
    label: string;
    icon: React.ReactNode;
    badge?: number;
  }> = [
    {
      id: 'home',
      label: 'Overview',
      icon: <Home className="w-4 h-4 text-blue-500" />,
    },
    {
      id: 'negotiator',
      label: 'AI Negotiator',
      icon: <Zap className="w-4 h-4 text-blue-500" />,
    },
    {
      id: 'ai_shopping',
      label: 'AI Deal Analyzer',
      icon: <ShieldCheck className="w-4 h-4 text-blue-500" />,
    },
    {
      id: 'orders',
      label: 'Orders',
      icon: <ShoppingBag className="w-4 h-4 text-emerald-500" />,
      badge: ordersCount,
    },
  ];

  const shopOwnerMainItems: Array<{
    id: ActiveNavTab;
    label: string;
    icon: React.ReactNode;
    badge?: number;
  }> = [
    {
      id: 'home',
      label: 'Overview',
      icon: <Home className="w-4 h-4 text-blue-500" />,
    },
    {
      id: 'store_owner_portal',
      label: 'Shop Dashboard',
      icon: <Store className="w-4 h-4 text-emerald-500" />,
    },
    {
      id: 'categories',
      label: 'Products & Inventory',
      icon: <Layers className="w-4 h-4 text-cyan-500" />,
    },
    {
      id: 'negotiator',
      label: 'Negotiations',
      icon: <Zap className="w-4 h-4 text-blue-500" />,
    },
    {
      id: 'orders',
      label: 'Orders',
      icon: <ShoppingBag className="w-4 h-4 text-emerald-500" />,
      badge: ordersCount,
    },
  ];

  const adminMainItems: Array<{
    id: ActiveNavTab;
    label: string;
    icon: React.ReactNode;
    badge?: number;
  }> = [
    {
      id: 'home',
      label: 'Overview',
      icon: <Home className="w-4 h-4 text-blue-500" />,
    },
    {
      id: 'admin',
      label: 'Admin Dashboard',
      icon: <BarChart3 className="w-4 h-4 text-amber-500" />,
    },
    {
      id: 'categories',
      label: 'Products',
      icon: <Layers className="w-4 h-4 text-blue-500" />,
    },
    {
      id: 'negotiator',
      label: 'Negotiations',
      icon: <Zap className="w-4 h-4 text-purple-500" />,
    },
    {
      id: 'orders',
      label: 'Orders',
      icon: <ShoppingBag className="w-4 h-4 text-emerald-500" />,
      badge: ordersCount,
    },
  ];

  const mainItems =
    role === 'store_owner'
      ? shopOwnerMainItems
      : role === 'admin'
      ? adminMainItems
      : userMainItems;

  const quickAccessItems = [
    {
      key: 'shopper-login',
      label: 'Shopper Login',
      icon: <User className="w-4 h-4 text-blue-500" />,
      action: () => {
        onOpenAuthModal?.('/auth');
        setIsOpen(false);
      },
    },
    {
      key: 'store-owner',
      label: 'Store Owner',
      icon: <Store className="w-4 h-4 text-emerald-500" />,
      action: () => {
        onOpenAuthModal?.('/auth/store');
        setIsOpen(false);
      },
    },
    {
      key: 'admin',
      label: 'Admin',
      icon: <ShieldCheck className="w-4 h-4 text-amber-500" />,
      action: () => {
        onOpenAuthModal?.('/auth/admin');
        setIsOpen(false);
      },
    },
    {
      key: 'store-owner-qr',
      label: 'Store Owner QR',
      icon: <QrCode className="w-4 h-4 text-emerald-500" />,
      action: () => handleNav('store_owner_portal'),
    },
    {
      key: 'unified-search',
      label: 'Unified Search',
      icon: <Globe className="w-4 h-4 text-blue-500" />,
      action: () => handleNav('ai_shopping'),
    },
    {
      key: 'local-stores',
      label: 'Local Stores',
      icon: <MapPin className="w-4 h-4 text-cyan-500" />,
      action: () => handleNav('stores'),
    },
    {
      key: 'admin-analytics',
      label: 'Admin Analytics',
      subtitle: `₹${totalPlatformSavings.toLocaleString('en-IN')} saved`,
      icon: <BarChart3 className="w-4 h-4 text-amber-500" />,
      action: () => handleNav('admin'),
    },
  ];

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => {
          soundEffects.playBlip();
          setIsOpen((prev) => !prev);
        }}
        title={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
        aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
        aria-expanded={isOpen}
        aria-controls="dealmate-mobile-drawer"
        className={`w-10 h-10 rounded-lg border flex items-center justify-center transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
          currentTheme.isLight
            ? 'bg-white hover:bg-slate-100 border-slate-200 text-slate-800'
            : 'bg-[#161B20] hover:bg-[#1E242B] border-[#293139] text-slate-100'
        }`}
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {isOpen && (
        <div
          id="dealmate-mobile-drawer"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile Navigation Menu"
          className="fixed inset-x-0 top-16 bottom-0 z-50 flex flex-col"
        >
          {/* Backdrop */}
          <div
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 top-16 bg-slate-950/60 backdrop-blur-xs"
          />

          {/* Full-width vertical drawer */}
          <div
            className={`relative z-10 w-full max-h-[calc(100vh-4rem)] overflow-y-auto border-b px-4 py-5 space-y-6 shadow-2xl ${
              currentTheme.isLight
                ? 'bg-white border-slate-200 text-slate-900'
                : 'bg-[#12161B] border-[#293139] text-slate-100'
            }`}
          >
            {/* SECTION 1: MAIN */}
            <div>
              <div className="px-2 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Main
              </div>
              <div className="space-y-1">
                {mainItems.map((item) => {
                  const isActive = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleNav(item.id)}
                      className={`w-full min-h-[44px] flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                        isActive
                          ? currentTheme.isLight
                            ? 'bg-blue-50 text-blue-700 font-semibold'
                            : 'bg-blue-950/50 text-blue-300 font-semibold'
                          : currentTheme.isLight
                          ? 'hover:bg-slate-100 text-slate-800'
                          : 'hover:bg-white/5 text-slate-200'
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        {item.icon}
                        <span>{item.label}</span>
                      </span>
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-500">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* SECTION 2: QUICK ACCESS */}
            <div
              className={`pt-4 border-t ${
                currentTheme.isLight ? 'border-slate-100' : 'border-[#242C35]'
              }`}
            >
              <div className="px-2 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Quick Access
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                {quickAccessItems.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => {
                      soundEffects.playBlip();
                      item.action();
                    }}
                    className={`w-full min-h-[44px] flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                      currentTheme.isLight
                        ? 'hover:bg-slate-100 text-slate-700'
                        : 'hover:bg-white/5 text-slate-200'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      {item.icon}
                      <span>{item.label}</span>
                    </span>
                    {item.subtitle && (
                      <span className="text-[11px] font-mono text-slate-400">
                        {item.subtitle}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* SECTION 3: SETTINGS */}
            <div
              className={`pt-4 border-t space-y-3 ${
                currentTheme.isLight ? 'border-slate-100' : 'border-[#242C35]'
              }`}
            >
              <div className="px-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Settings
              </div>

              {/* Theme segmented selector */}
              <div className="px-2">
                <div className="text-xs font-medium mb-2 text-slate-500">
                  Theme
                </div>
                <div
                  className={`grid grid-cols-3 gap-1.5 p-1 rounded-xl border ${
                    currentTheme.isLight
                      ? 'bg-slate-50 border-slate-200'
                      : 'bg-[#181D23] border-[#293139]'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      soundEffects.playBlip();
                      onSelectTheme('pure-white');
                    }}
                    className={`min-h-[38px] rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                      currentThemeId === 'pure-white'
                        ? 'bg-white text-blue-600 shadow-xs font-semibold'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Sun className="w-3.5 h-3.5 text-amber-500" />
                    <span>Light</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      soundEffects.playBlip();
                      onSelectTheme('warm-graphite');
                    }}
                    className={`min-h-[38px] rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                      currentThemeId === 'warm-graphite'
                        ? 'bg-[#242B33] text-white shadow-xs font-semibold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Moon className="w-3.5 h-3.5 text-blue-400" />
                    <span>Dark</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      soundEffects.playBlip();
                      const prefersDark =
                        typeof window !== 'undefined' &&
                        window.matchMedia &&
                        window.matchMedia('(prefers-color-scheme: dark)').matches;
                      onSelectTheme(prefersDark ? 'warm-graphite' : 'pure-white');
                    }}
                    className="min-h-[38px] rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 text-slate-400 hover:text-blue-500 transition-colors cursor-pointer"
                  >
                    <Monitor className="w-3.5 h-3.5" />
                    <span>System</span>
                  </button>
                </div>
              </div>

              {/* Notifications & Saved Items */}
              <button
                type="button"
                onClick={() => {
                  soundEffects.playBlip();
                  onOpenAccount();
                  setIsOpen(false);
                }}
                className={`w-full min-h-[44px] flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                  currentTheme.isLight
                    ? 'hover:bg-slate-100 text-slate-700'
                    : 'hover:bg-white/5 text-slate-200'
                }`}
              >
                <span className="flex items-center gap-3">
                  <Bell className="w-4 h-4 text-blue-500" />
                  <span>Notifications & Saved Deals</span>
                </span>
                {savedCount > 0 && (
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-500">
                    {savedCount}
                  </span>
                )}
              </button>

              {comparedCount > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    soundEffects.playBlip();
                    onOpenCompare();
                    setIsOpen(false);
                  }}
                  className={`w-full min-h-[44px] flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                    currentTheme.isLight
                      ? 'hover:bg-slate-100 text-slate-700'
                      : 'hover:bg-white/5 text-slate-200'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Layers className="w-4 h-4 text-cyan-500" />
                    <span>Compare Selected Products</span>
                  </span>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-500">
                    {comparedCount}
                  </span>
                </button>
              )}

              {/* Sound toggle */}
              <button
                type="button"
                onClick={toggleSound}
                className={`w-full min-h-[44px] flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                  currentTheme.isLight
                    ? 'hover:bg-slate-100 text-slate-700'
                    : 'hover:bg-white/5 text-slate-200'
                }`}
              >
                <span className="flex items-center gap-3">
                  {soundEnabled ? (
                    <Volume2 className="w-4 h-4 text-blue-500" />
                  ) : (
                    <VolumeX className="w-4 h-4 text-slate-400" />
                  )}
                  <span>Interface Audio</span>
                </span>
                <span className="text-xs font-mono text-slate-400">
                  {soundEnabled ? 'Enabled' : 'Muted'}
                </span>
              </button>

              {/* Profile / Auth actions */}
              {!currentUser ? (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      soundEffects.playBlip();
                      onOpenAuthModal?.('/auth');
                      setIsOpen(false);
                    }}
                    className={`min-h-[42px] rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer ${
                      currentTheme.isLight
                        ? 'bg-white border-slate-200 text-slate-800'
                        : 'bg-[#181D23] border-[#293139] text-slate-100'
                    }`}
                  >
                    <User className="w-4 h-4 text-blue-500" />
                    <span>Sign In</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      soundEffects.playBlip();
                      onOpenAuthModal?.('/auth/signup');
                      setIsOpen(false);
                    }}
                    className="min-h-[42px] rounded-xl bg-blue-600 text-white text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Create Account</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      soundEffects.playBlip();
                      onOpenAccount('settings');
                      setIsOpen(false);
                    }}
                    className={`w-full min-h-[44px] flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                      currentTheme.isLight
                        ? 'hover:bg-slate-100 text-slate-700'
                        : 'hover:bg-white/5 text-slate-200'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <User className="w-4 h-4 text-blue-500" />
                      <span>
                        {currentUser.displayName} (
                        {currentUser.role === 'store_owner'
                          ? 'SHOP OWNER'
                          : currentUser.role.toUpperCase()}
                        )
                      </span>
                    </span>
                    <span className="text-xs font-mono text-blue-500">Settings</span>
                  </button>
                  {onSignOut && (
                    <button
                      type="button"
                      onClick={() => {
                        soundEffects.playBlip();
                        onSignOut();
                        setIsOpen(false);
                      }}
                      className="w-full min-h-[44px] flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
