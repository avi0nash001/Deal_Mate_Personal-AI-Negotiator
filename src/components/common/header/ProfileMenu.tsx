import React, { useState, useRef, useEffect } from 'react';
import {
  User,
  ChevronDown,
  Bookmark,
  Volume2,
  VolumeX,
  LogIn,
  UserPlus,
  LogOut,
  Settings,
  LayoutDashboard,
  ShieldCheck,
  Store,
  Mic,
  ShoppingBag,
  TrendingDown,
  Sliders,
  SlidersHorizontal,
} from 'lucide-react';
import { AppUser } from '../../../types';
import { ThemeConfig } from '../../../types/theme';
import { soundEffects } from '../../../services/soundEffects';
import { ActiveNavTab } from '../Header';
import type { AuthRoutePath } from '../../auth/AuthModal';

interface ProfileMenuProps {
  currentUser?: AppUser | null;
  savedCount: number;
  onOpenAccount: (initialTab?: 'profile' | 'saved_products' | 'saved_stores' | 'history' | 'settings') => void;
  onNavigate?: (tab: ActiveNavTab) => void;
  onOpenAuthModal?: (route?: AuthRoutePath) => void;
  onSignOut?: () => void;
  onOpenVoiceModal?: () => void;
  currentTheme: ThemeConfig;
}

export const ProfileMenu: React.FC<ProfileMenuProps> = ({
  currentUser,
  savedCount,
  onOpenAccount,
  onNavigate,
  onOpenAuthModal,
  onSignOut,
  onOpenVoiceModal,
  currentTheme,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(soundEffects.enabled);
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

  const toggleSound = () => {
    soundEffects.enabled = !soundEffects.enabled;
    setSoundEnabled(soundEffects.enabled);
    if (soundEffects.enabled) {
      soundEffects.playBlip();
    }
  };

  const roleBadgeLabel =
    currentUser?.role === 'store_owner'
      ? 'SHOP OWNER'
      : currentUser?.role === 'admin'
      ? 'ADMIN'
      : 'USER';

  const roleBadgeClasses =
    currentUser?.role === 'admin'
      ? 'bg-amber-500/15 text-amber-600 border-amber-500/30'
      : currentUser?.role === 'store_owner'
      ? 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30'
      : 'bg-blue-500/15 text-blue-600 border-blue-500/30';

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const handleGoToRoleDashboard = () => {
    soundEffects.playBlip();
    setIsOpen(false);
    if (!currentUser) return;
    if (currentUser.role === 'admin') {
      onNavigate?.('admin');
    } else if (currentUser.role === 'store_owner') {
      onNavigate?.('store_owner_portal');
    } else {
      onNavigate?.('ai_shopping');
    }
  };

  // UNAUTHENTICATED HEADER ENTRY: Clean Sign In and Create Account
  if (!currentUser) {
    return (
      <div className="flex items-center gap-1.5 sm:gap-2">
        <button
          type="button"
          onClick={() => {
            soundEffects.playBlip();
            onOpenAuthModal?.('/auth');
          }}
          className={`h-9 px-3 rounded-xl border text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
            currentTheme.isLight
              ? 'bg-white hover:bg-slate-50 border-slate-200/90 text-slate-800 shadow-2xs hover:border-slate-300'
              : 'bg-[#161B20] hover:bg-[#1E242B] border-[#293139] text-slate-100'
          }`}
        >
          <LogIn className="w-3.5 h-3.5 text-blue-500 shrink-0" />
          <span>Sign In</span>
        </button>

        <button
          type="button"
          onClick={() => {
            soundEffects.playBlip();
            onOpenAuthModal?.('/auth/signup');
          }}
          className="h-9 px-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <UserPlus className="w-3.5 h-3.5 shrink-0" />
          <span>Create Account</span>
        </button>
      </div>
    );
  }

  // AUTHENTICATED HEADER ENTRY: Avatar + User Name + Role Badge + Dropdown
  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => {
          soundEffects.playBlip();
          setIsOpen((prev) => !prev);
        }}
        title={`${currentUser.displayName} (${roleBadgeLabel})`}
        aria-label="Authenticated account menu"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className={`h-9 pl-2 pr-2.5 rounded-xl border text-xs font-medium transition-all flex items-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
          currentTheme.isLight
            ? 'bg-white hover:bg-slate-50 border-slate-200 text-slate-900 shadow-2xs'
            : 'bg-[#161B20] hover:bg-[#1E242B] border-[#293139] text-slate-100'
        }`}
      >
        {/* Profile / Account Avatar */}
        <div
          className={`w-6 h-6 rounded-lg flex items-center justify-center font-display font-bold text-[10px] text-white shrink-0 ${
            currentUser.role === 'admin'
              ? 'bg-gradient-to-br from-amber-500 to-orange-600'
              : currentUser.role === 'store_owner'
              ? 'bg-gradient-to-br from-emerald-500 to-teal-600'
              : 'bg-gradient-to-br from-blue-600 to-cyan-500'
          }`}
        >
          {getInitials(currentUser.displayName)}
        </div>

        {/* User Name & Account Role */}
        <div className="text-left leading-tight hidden sm:block max-w-[120px]">
          <div className="text-xs font-bold truncate">{currentUser.displayName}</div>
          <div className="text-[9px] font-mono uppercase tracking-wider text-blue-500 font-semibold">
            {roleBadgeLabel}
          </div>
        </div>

        <ChevronDown
          className={`w-3.5 h-3.5 opacity-70 transition-transform duration-150 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-label="Account menu"
          className={`absolute right-0 mt-2 w-72 rounded-2xl border p-2.5 shadow-2xl z-50 backdrop-blur-xl ${
            currentTheme.isLight
              ? 'bg-white/98 border-slate-200 text-slate-800 shadow-slate-900/10'
              : 'bg-[#14191F]/98 border-[#293139] text-slate-100 shadow-black/80'
          }`}
        >
          {/* User Identity Card */}
          <div
            className={`p-3 mb-2 rounded-xl border ${
              currentTheme.isLight
                ? 'bg-slate-50 border-slate-200/70'
                : 'bg-[#1B2128] border-[#293139]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center font-display font-bold text-xs text-white shrink-0 ${
                  currentUser.role === 'admin'
                    ? 'bg-gradient-to-br from-amber-500 to-orange-600'
                    : currentUser.role === 'store_owner'
                    ? 'bg-gradient-to-br from-emerald-500 to-teal-600'
                    : 'bg-gradient-to-br from-blue-600 to-cyan-500'
                }`}
              >
                {getInitials(currentUser.displayName)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1.5">
                  <span className="text-xs font-bold truncate">
                    {currentUser.displayName}
                  </span>
                  <span
                    className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded border font-bold shrink-0 ${roleBadgeClasses}`}
                  >
                    {roleBadgeLabel}
                  </span>
                </div>
                <p
                  className={`text-[11px] truncate mt-0.5 ${
                    currentTheme.isLight ? 'text-slate-500' : 'text-slate-400'
                  }`}
                >
                  {currentUser.email}
                </p>
                {currentUser.storeName && (
                  <p className="text-[10px] text-emerald-600 font-medium truncate mt-0.5">
                    🏪 {currentUser.storeName}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Section 14: Role-Specific Dropdown Navigation */}
          <div className="space-y-0.5">
            {/* USER ROLE ITEMS: Dashboard, My Deals, My Orders, Settings, Sign Out */}
            {currentUser.role === 'user' && (
              <>
                <button
                  type="button"
                  role="menuitem"
                  onClick={handleGoToRoleDashboard}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    currentTheme.isLight
                      ? 'hover:bg-blue-50 text-slate-800'
                      : 'hover:bg-white/5 text-slate-100'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <LayoutDashboard className="w-4 h-4 text-blue-500" />
                    <span>AI Shopping Dashboard</span>
                  </span>
                  <span className="text-[10px] font-mono text-blue-500">Open →</span>
                </button>

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    soundEffects.playBlip();
                    onOpenAccount('saved_products');
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    currentTheme.isLight
                      ? 'hover:bg-slate-100 text-slate-700'
                      : 'hover:bg-white/5 text-slate-200'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Bookmark className="w-4 h-4 text-cyan-500" />
                    <span>My Deals & Saved Items</span>
                  </span>
                  {savedCount > 0 && (
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-blue-500/15 text-blue-500">
                      {savedCount}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    soundEffects.playBlip();
                    onNavigate?.('orders');
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    currentTheme.isLight
                      ? 'hover:bg-slate-100 text-slate-700'
                      : 'hover:bg-white/5 text-slate-200'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <ShoppingBag className="w-4 h-4 text-emerald-500" />
                    <span>My Orders</span>
                  </span>
                </button>
              </>
            )}

            {/* SHOP OWNER ROLE ITEMS: Shop Profile, Settings, Sign Out */}
            {currentUser.role === 'store_owner' && (
              <>
                <button
                  type="button"
                  role="menuitem"
                  onClick={handleGoToRoleDashboard}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    currentTheme.isLight
                      ? 'hover:bg-emerald-50 text-slate-800'
                      : 'hover:bg-white/5 text-slate-100'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Store className="w-4 h-4 text-emerald-500" />
                    <span>Shop Owner Dashboard</span>
                  </span>
                  <span className="text-[10px] font-mono text-emerald-600">Open →</span>
                </button>

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    soundEffects.playBlip();
                    onOpenAccount('profile');
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    currentTheme.isLight
                      ? 'hover:bg-slate-100 text-slate-700'
                      : 'hover:bg-white/5 text-slate-200'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Store className="w-4 h-4 text-blue-500" />
                    <span>Shop Profile & Verification</span>
                  </span>
                </button>

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    soundEffects.playBlip();
                    onNavigate?.('store_owner_portal');
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    currentTheme.isLight
                      ? 'hover:bg-slate-100 text-slate-700'
                      : 'hover:bg-white/5 text-slate-200'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <SlidersHorizontal className="w-4 h-4 text-cyan-500" />
                    <span>Category Floor Rules</span>
                  </span>
                </button>
              </>
            )}

            {/* ADMIN ROLE ITEMS: Admin Profile, Settings, Sign Out */}
            {currentUser.role === 'admin' && (
              <>
                <button
                  type="button"
                  role="menuitem"
                  onClick={handleGoToRoleDashboard}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    currentTheme.isLight
                      ? 'hover:bg-amber-50 text-slate-800'
                      : 'hover:bg-white/5 text-slate-100'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-amber-500" />
                    <span>Admin Dashboard</span>
                  </span>
                  <span className="text-[10px] font-mono text-amber-600">Open →</span>
                </button>

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    soundEffects.playBlip();
                    onNavigate?.('admin');
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    currentTheme.isLight
                      ? 'hover:bg-slate-100 text-slate-700'
                      : 'hover:bg-white/5 text-slate-200'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Settings className="w-4 h-4 text-amber-500" />
                    <span>Platform Settings & Audit</span>
                  </span>
                </button>
              </>
            )}

            {/* General Settings for all authenticated accounts */}
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                soundEffects.playBlip();
                onOpenAccount('settings');
                setIsOpen(false);
              }}
              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                currentTheme.isLight
                  ? 'hover:bg-slate-100 text-slate-700'
                  : 'hover:bg-white/5 text-slate-200'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Settings className="w-4 h-4 text-slate-500" />
                <span>Account Settings</span>
              </span>
            </button>
          </div>

          {/* Sound & Voice Preferences */}
          <div
            className={`my-1.5 pt-1.5 border-t space-y-0.5 ${
              currentTheme.isLight ? 'border-slate-100' : 'border-[#242C35]'
            }`}
          >
            <button
              type="button"
              role="menuitem"
              onClick={toggleSound}
              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                currentTheme.isLight
                  ? 'hover:bg-slate-100 text-slate-700'
                  : 'hover:bg-white/5 text-slate-200'
              }`}
            >
              <span className="flex items-center gap-2.5">
                {soundEnabled ? (
                  <Volume2 className="w-3.5 h-3.5 text-blue-500" />
                ) : (
                  <VolumeX className="w-3.5 h-3.5 text-slate-400" />
                )}
                <span>Sound Effects</span>
              </span>
              <span className="text-[10px] font-mono uppercase text-slate-400">
                {soundEnabled ? 'On' : 'Muted'}
              </span>
            </button>

            {onOpenVoiceModal && (
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  soundEffects.playBlip();
                  onOpenVoiceModal();
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  currentTheme.isLight
                    ? 'hover:bg-slate-100 text-slate-700'
                    : 'hover:bg-white/5 text-slate-200'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Mic className="w-3.5 h-3.5 text-blue-500" />
                  <span>Voice Assistant</span>
                </span>
              </button>
            )}
          </div>

          {/* Sign Out */}
          <div
            className={`mt-1 pt-1 border-t ${
              currentTheme.isLight ? 'border-slate-100' : 'border-[#242C35]'
            }`}
          >
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                soundEffects.playBlip();
                onSignOut?.();
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-500/10 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
