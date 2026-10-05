import React, { useState, useRef, useEffect } from 'react';
import { Zap, Bell, Bookmark, Layers, Sparkles, TrendingDown } from 'lucide-react';
import { soundEffects } from '../../services/soundEffects';
import { ThemeId, THEMES } from '../../types/theme';
import { AppUser } from '../../types';
import { DesktopNavigation } from './header/DesktopNavigation';
import { MobileNavigation } from './header/MobileNavigation';
import { QuickAccessMenu } from './header/QuickAccessMenu';
import { ThemeMenu } from './header/ThemeMenu';
import { ProfileMenu } from './header/ProfileMenu';
import type { AuthRoutePath } from '../auth/AuthModal';

export type ActiveNavTab =
  | 'home'
  | 'ai_shopping'
  | 'categories'
  | 'stores'
  | 'negotiator'
  | 'for_business'
  | 'orders'
  | 'store_owner_portal'
  | 'admin';

interface HeaderProps {
  currentTab: ActiveNavTab;
  onNavigate: (tab: ActiveNavTab) => void;
  comparedCount: number;
  onOpenCompare: () => void;
  savedCount: number;
  onOpenAccount: (
    initialTab?: 'profile' | 'saved_products' | 'saved_stores' | 'history' | 'settings'
  ) => void;
  ordersCount: number;
  isNegotiatingActive?: boolean;
  currentThemeId: ThemeId;
  onSelectTheme: (themeId: ThemeId) => void;
  currentUser?: AppUser | null;
  onOpenAuthModal?: (route?: AuthRoutePath) => void;
  onSignOut?: () => void;
  onOpenVoiceModal?: () => void;
  totalPlatformSavings?: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onNavigate,
  comparedCount,
  onOpenCompare,
  savedCount,
  onOpenAccount,
  ordersCount,
  currentThemeId,
  onSelectTheme,
  currentUser,
  onOpenAuthModal,
  onSignOut,
  onOpenVoiceModal,
  totalPlatformSavings = 18420,
}) => {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);

  const currentTheme = THEMES[currentThemeId] || THEMES['pure-white'];
  const totalAlertCount = savedCount + comparedCount;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(e.target as Node)
      ) {
        setIsNotificationsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsNotificationsOpen(false);
      }
    };
    if (isNotificationsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isNotificationsOpen]);

  return (
    <header
      className={`sticky top-0 z-50 h-16 backdrop-blur-xl transition-colors ${
        currentTheme.isLight
          ? 'bg-white/90 border-b border-slate-200/80 text-slate-900'
          : 'bg-[#0E1114]/90 border-b border-[#242C35] text-[#F2F5F7]'
      }`}
    >
      <div className="max-w-7xl h-full mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3">
        {/* 1. DealMate Brand Logo (Left) */}
        <button
          type="button"
          onClick={() => {
            soundEffects.playBlip();
            onNavigate('home');
          }}
          aria-label="DealMate Home"
          className="flex items-center gap-2.5 text-left cursor-pointer group shrink-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shadow-xs transition-transform group-hover:scale-105 shrink-0"
            style={{
              background: `linear-gradient(135deg, ${currentTheme.primaryAccentHex}, ${currentTheme.secondaryAccentHex})`,
            }}
          >
            <Zap className="w-4 h-4 text-white fill-current" />
          </div>
          <div className="leading-none">
            <span
              className={`font-display font-extrabold text-lg xl:text-xl tracking-tight transition-colors ${
                currentTheme.isLight
                  ? 'text-slate-900 group-hover:text-blue-600'
                  : 'text-white group-hover:text-blue-400'
              }`}
            >
              DealMate
            </span>
          </div>
        </button>

        {/* 2. Main Navigation (Center - Desktop & Tablet >= 768px) */}
        <div className="hidden md:flex flex-1 justify-center min-w-0 mx-2 lg:mx-4">
          <DesktopNavigation
            currentTab={currentTab}
            onNavigate={onNavigate}
            ordersCount={ordersCount}
            currentTheme={currentTheme}
            currentUser={currentUser}
            onOpenAuthModal={onOpenAuthModal}
          />
        </div>

        {/* 3. Essential Utility Controls (Right - Desktop & Tablet >= 768px) */}
        <div className="hidden md:flex items-center gap-1.5 lg:gap-2 shrink-0">
          {/* Quick Access Contextual Menu (xl+ only to keep laptop header clean) */}
          <div className="hidden xl:block">
            <QuickAccessMenu
              currentTab={currentTab}
              onNavigate={onNavigate}
              onOpenAuthModal={onOpenAuthModal}
              currentTheme={currentTheme}
              totalPlatformSavings={totalPlatformSavings}
            />
          </div>

          {/* Compact Theme Control */}
          <ThemeMenu
            currentThemeId={currentThemeId}
            onSelectTheme={onSelectTheme}
          />

          {/* Notifications Control */}
          <div className="relative" ref={notificationsRef}>
            <button
              type="button"
              onClick={() => {
                soundEffects.playBlip();
                setIsNotificationsOpen((prev) => !prev);
              }}
              title="Notifications, Saved Deals & Product Comparison"
              aria-label="Notifications and saved activity"
              aria-expanded={isNotificationsOpen}
              aria-haspopup="menu"
              className={`h-9 px-2.5 rounded-lg border text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                currentTheme.isLight
                  ? 'bg-white hover:bg-slate-50 border-slate-200/90 text-slate-700'
                  : 'bg-[#161B20] hover:bg-[#1E242B] border-[#293139] text-slate-200'
              }`}
            >
              <Bell className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden 2xl:inline">Notifications</span>
              {totalAlertCount > 0 && (
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: currentTheme.primaryAccentHex }}
                />
              )}
            </button>

            {isNotificationsOpen && (
              <div
                role="menu"
                aria-label="Notifications and activity"
                className={`absolute right-0 mt-2 w-72 rounded-xl border p-2.5 shadow-xl z-50 backdrop-blur-xl ${
                  currentTheme.isLight
                    ? 'bg-white/98 border-slate-200 text-slate-800 shadow-slate-900/5'
                    : 'bg-[#14191F]/98 border-[#293139] text-slate-100 shadow-black/60'
                }`}
              >
                <div className="flex items-center justify-between px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  <span>Activity & Alerts</span>
                  {totalAlertCount > 0 && (
                    <span className="text-[10px] font-mono text-blue-500">
                      {totalAlertCount} active
                    </span>
                  )}
                </div>

                <div className="mt-1 space-y-1">
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      soundEffects.playBlip();
                      onOpenAccount();
                      setIsNotificationsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                      currentTheme.isLight
                        ? 'hover:bg-slate-100 text-slate-700'
                        : 'hover:bg-white/5 text-slate-200'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <Bookmark className="w-4 h-4 text-blue-500 shrink-0" />
                      <span className="font-medium">Saved Products & Stores</span>
                    </span>
                    <span className="text-xs font-mono font-bold text-blue-500">
                      {savedCount}
                    </span>
                  </button>

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      soundEffects.playBlip();
                      if (comparedCount > 0) {
                        onOpenCompare();
                      } else {
                        onNavigate('ai_shopping');
                      }
                      setIsNotificationsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                      currentTheme.isLight
                        ? 'hover:bg-slate-100 text-slate-700'
                        : 'hover:bg-white/5 text-slate-200'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <Layers className="w-4 h-4 text-cyan-500 shrink-0" />
                      <span className="font-medium">Comparison Tray</span>
                    </span>
                    <span className="text-xs font-mono font-bold text-cyan-500">
                      {comparedCount}
                    </span>
                  </button>

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      soundEffects.playBlip();
                      onNavigate('negotiator');
                      setIsNotificationsOpen(false);
                    }}
                    className={`w-full flex items-start gap-2.5 px-2.5 py-2 rounded-lg text-left text-xs transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                      currentTheme.isLight
                        ? 'hover:bg-slate-100 text-slate-700'
                        : 'hover:bg-white/5 text-slate-200'
                    }`}
                  >
                    <TrendingDown className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium">
                        ₹{totalPlatformSavings.toLocaleString('en-IN')} Platform Savings
                      </div>
                      <div
                        className={`text-[11px] ${
                          currentTheme.isLight ? 'text-slate-500' : 'text-slate-400'
                        }`}
                      >
                        Autonomous AI negotiator ready
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      soundEffects.playBlip();
                      onNavigate('ai_shopping');
                      setIsNotificationsOpen(false);
                    }}
                    className={`w-full flex items-start gap-2.5 px-2.5 py-2 rounded-lg text-left text-xs transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                      currentTheme.isLight
                        ? 'hover:bg-slate-100 text-slate-700'
                        : 'hover:bg-white/5 text-slate-200'
                    }`}
                  >
                    <Sparkles className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium">Live Price Discovery</div>
                      <div
                        className={`text-[11px] ${
                          currentTheme.isLight ? 'text-slate-500' : 'text-slate-400'
                        }`}
                      >
                        Compare Amazon, Flipkart & Store QR
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Profile & Account Menu */}
          <ProfileMenu
            currentUser={currentUser}
            savedCount={savedCount}
            onOpenAccount={onOpenAccount}
            onNavigate={onNavigate}
            onOpenAuthModal={onOpenAuthModal}
            onSignOut={onSignOut}
            onOpenVoiceModal={onOpenVoiceModal}
            currentTheme={currentTheme}
          />
        </div>

        {/* 4. Mobile Quick Auth + Hamburger Navigation (<= 767px) */}
        <div className="flex md:hidden items-center gap-1.5 shrink-0">
          {currentUser ? (
            <button
              type="button"
              onClick={() => onOpenAccount('profile')}
              className="h-8 px-2.5 rounded-lg bg-blue-600 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <span className="w-4 h-4 rounded-full bg-white/20 text-[10px] font-bold flex items-center justify-center">
                {currentUser.displayName.charAt(0).toUpperCase()}
              </span>
              <span className="max-w-[72px] truncate">{currentUser.displayName.split(' ')[0]}</span>
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => onOpenAuthModal?.('/auth')}
                className="h-8 px-2.5 rounded-lg border border-slate-700 bg-slate-900 text-white text-xs font-medium cursor-pointer"
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => onOpenAuthModal?.('/auth/signup')}
                className="h-8 px-2.5 rounded-lg bg-blue-600 text-white text-xs font-semibold cursor-pointer"
              >
                Join
              </button>
            </>
          )}

          <MobileNavigation
            currentTab={currentTab}
            onNavigate={onNavigate}
            ordersCount={ordersCount}
            savedCount={savedCount}
            comparedCount={comparedCount}
            onOpenAccount={onOpenAccount}
            onOpenCompare={onOpenCompare}
            currentThemeId={currentThemeId}
            currentTheme={currentTheme}
            onSelectTheme={onSelectTheme}
            currentUser={currentUser}
            onOpenAuthModal={onOpenAuthModal}
            onSignOut={onSignOut}
            totalPlatformSavings={totalPlatformSavings}
          />
        </div>
      </div>
    </header>
  );
};
