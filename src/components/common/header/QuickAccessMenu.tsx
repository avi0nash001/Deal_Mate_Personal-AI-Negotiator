import React, { useState, useRef, useEffect } from 'react';
import {
  Compass,
  ChevronDown,
  User,
  Store,
  ShieldCheck,
  QrCode,
  Globe,
  BarChart3,
  MapPin,
} from 'lucide-react';
import { ActiveNavTab } from '../Header';
import { ThemeConfig } from '../../../types/theme';
import { soundEffects } from '../../../services/soundEffects';
import type { AuthRoutePath } from '../../auth/AuthModal';

interface QuickAccessMenuProps {
  currentTab: ActiveNavTab;
  onNavigate: (tab: ActiveNavTab) => void;
  onOpenAuthModal?: (route?: AuthRoutePath) => void;
  currentTheme: ThemeConfig;
  totalPlatformSavings?: number;
}

export const QuickAccessMenu: React.FC<QuickAccessMenuProps> = ({
  currentTab,
  onNavigate,
  onOpenAuthModal,
  currentTheme,
  totalPlatformSavings = 18420,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const rolePortals = [
    {
      id: 'shopper-login',
      label: 'Shopper Login',
      subtitle: 'Customer account & deal history',
      icon: <User className="w-4 h-4 text-blue-500" />,
      action: () => onOpenAuthModal?.('/auth'),
    },
    {
      id: 'store-owner-login',
      label: 'Store Owner',
      subtitle: 'Merchant inventory & floor rules',
      icon: <Store className="w-4 h-4 text-emerald-500" />,
      action: () => onOpenAuthModal?.('/auth/store'),
    },
    {
      id: 'admin-login',
      label: 'Admin',
      subtitle: 'Platform governance & access',
      icon: <ShieldCheck className="w-4 h-4 text-amber-500" />,
      action: () => onOpenAuthModal?.('/auth/admin'),
    },
  ];

  const featureShortcuts: Array<{
    id: ActiveNavTab;
    label: string;
    subtitle: string;
    icon: React.ReactNode;
  }> = [
    {
      id: 'store_owner_portal',
      label: 'Store Owner QR',
      subtitle: 'QR scanner & dynamic floor ranges',
      icon: <QrCode className="w-4 h-4 text-emerald-500" />,
    },
    {
      id: 'ai_shopping',
      label: 'Unified Search',
      subtitle: 'Amazon, Flipkart & local store QR',
      icon: <Globe className="w-4 h-4 text-blue-500" />,
    },
    {
      id: 'admin',
      label: 'Admin Analytics',
      subtitle: `₹${totalPlatformSavings.toLocaleString('en-IN')} verified savings`,
      icon: <BarChart3 className="w-4 h-4 text-amber-500" />,
    },
    {
      id: 'stores',
      label: 'Local Stores',
      subtitle: 'Google Maps store discovery',
      icon: <MapPin className="w-4 h-4 text-cyan-500" />,
    },
  ];

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => {
          soundEffects.playBlip();
          setIsOpen((prev) => !prev);
        }}
        title="Quick Access to role portals and platform tools"
        aria-label="Quick Access menu"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className={`h-9 px-3 rounded-lg border text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
          isOpen
            ? currentTheme.isLight
              ? 'bg-slate-100 border-slate-300 text-slate-900'
              : 'bg-[#1E242B] border-[#38424D] text-white'
            : currentTheme.isLight
            ? 'bg-slate-50/80 hover:bg-slate-100 border-slate-200/90 text-slate-600 hover:text-slate-900'
            : 'bg-[#14191F] hover:bg-[#1B222A] border-[#262E37] text-slate-300 hover:text-white'
        }`}
      >
        <Compass className="w-3.5 h-3.5 text-blue-500 shrink-0" />
        <span className="hidden lg:inline">Quick Access</span>
        <ChevronDown
          className={`w-3 h-3 opacity-60 transition-transform duration-150 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-label="Quick Access shortcuts"
          className={`absolute right-0 mt-2 w-72 rounded-xl border p-2 shadow-xl z-50 backdrop-blur-xl ${
            currentTheme.isLight
              ? 'bg-white/98 border-slate-200 text-slate-800 shadow-slate-900/5'
              : 'bg-[#14191F]/98 border-[#293139] text-slate-100 shadow-black/60'
          }`}
        >
          <div className="px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Role Portals
          </div>
          <div className="space-y-0.5">
            {rolePortals.map((portal) => (
              <button
                key={portal.id}
                type="button"
                role="menuitem"
                onClick={() => {
                  soundEffects.playBlip();
                  portal.action();
                  setIsOpen(false);
                }}
                className={`w-full flex items-start gap-2.5 px-2.5 py-2 rounded-lg text-left transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                  currentTheme.isLight
                    ? 'hover:bg-slate-100 text-slate-800'
                    : 'hover:bg-white/5 text-slate-200'
                }`}
              >
                <div
                  className={`mt-0.5 p-1.5 rounded-md shrink-0 ${
                    currentTheme.isLight ? 'bg-slate-100' : 'bg-[#1D242C]'
                  }`}
                >
                  {portal.icon}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold leading-tight">
                    {portal.label}
                  </div>
                  <div
                    className={`text-[11px] truncate mt-0.5 ${
                      currentTheme.isLight ? 'text-slate-500' : 'text-slate-400'
                    }`}
                  >
                    {portal.subtitle}
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div
            className={`my-1.5 border-t ${
              currentTheme.isLight ? 'border-slate-100' : 'border-[#242C35]'
            }`}
          />

          <div className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Platform Tools
          </div>
          <div className="space-y-0.5">
            {featureShortcuts.map((item) => {
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    soundEffects.playBlip();
                    onNavigate(item.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-start gap-2.5 px-2.5 py-2 rounded-lg text-left transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                    isActive
                      ? currentTheme.isLight
                        ? 'bg-blue-50 text-blue-700'
                        : 'bg-blue-950/40 text-blue-300'
                      : currentTheme.isLight
                      ? 'hover:bg-slate-100 text-slate-800'
                      : 'hover:bg-white/5 text-slate-200'
                  }`}
                >
                  <div
                    className={`mt-0.5 p-1.5 rounded-md shrink-0 ${
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
                      {item.subtitle}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
