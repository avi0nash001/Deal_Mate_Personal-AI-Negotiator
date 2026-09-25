import React, { useState, useEffect } from 'react';
import { Bot, Sparkles, Store, Layers, User, Zap, Volume2, VolumeX, Palette, Music, Check, ChevronDown } from 'lucide-react';
import { soundEffects } from '../../services/soundEffects';
import { ThemeId, THEMES } from '../../types/theme';

export type ActiveNavTab =
  | 'home'
  | 'ai_shopping'
  | 'categories'
  | 'stores'
  | 'negotiator'
  | 'for_business'
  | 'orders'
  | 'admin';

interface HeaderProps {
  currentTab: ActiveNavTab;
  onNavigate: (tab: ActiveNavTab) => void;
  comparedCount: number;
  onOpenCompare: () => void;
  savedCount: number;
  onOpenAccount: () => void;
  ordersCount: number;
  isNegotiatingActive?: boolean;
  currentThemeId: ThemeId;
  onSelectTheme: (themeId: ThemeId) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onNavigate,
  comparedCount,
  onOpenCompare,
  savedCount,
  onOpenAccount,
  ordersCount,
  isNegotiatingActive = false,
  currentThemeId,
  onSelectTheme,
}) => {
  const [soundEnabled, setSoundEnabled] = useState(soundEffects.enabled);
  const [isBgmActive, setIsBgmActive] = useState(soundEffects.bgmPlaying);
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);

  useEffect(() => {
    const unsub = soundEffects.subscribeBgmState((playing) => {
      setIsBgmActive(playing);
    });
    return unsub;
  }, []);

  const toggleSound = () => {
    soundEffects.enabled = !soundEffects.enabled;
    setSoundEnabled(soundEffects.enabled);
    if (soundEffects.enabled) {
      soundEffects.playBlip();
    }
  };

  const handleToggleBgm = () => {
    const state = soundEffects.toggleBGM();
    setIsBgmActive(state);
  };

  const currentTheme = THEMES[currentThemeId];

  return (
    <header
      className={`sticky top-0 z-50 backdrop-blur-2xl px-4 sm:px-6 lg:px-8 py-3 transition-all ${
        currentTheme.isLight
          ? 'bg-white/95 border-b border-slate-200 shadow-xs text-slate-900'
          : 'bg-[#0E1114]/90 border-b border-[#293139] shadow-xl text-[#F2F5F7]'
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Zone 1: DealMate Brand Wordmark */}
        <button
          onClick={() => {
            soundEffects.playBlip();
            onNavigate('home');
          }}
          className="flex items-center gap-2.5 text-left focus:outline-none cursor-pointer group"
        >
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-105"
            style={{
              background: `linear-gradient(135deg, ${currentTheme.primaryAccentHex}, ${currentTheme.secondaryAccentHex})`,
              boxShadow: `0 0 15px ${currentTheme.primaryAccentHex}50`,
            }}
          >
            <Zap className="w-4 h-4 text-slate-950 font-black fill-current" />
          </div>
          <div>
            <span
              className={`font-display font-extrabold text-xl tracking-tight transition-colors ${
                currentTheme.isLight
                  ? 'text-slate-900 group-hover:text-blue-600'
                  : 'text-white group-hover:text-cyan-300'
              }`}
            >
              DealMate<span className="font-mono text-xs font-bold ml-1" style={{ color: currentTheme.primaryAccentHex }}>3D</span>
            </span>
            <span
              className={`hidden sm:block text-[9px] font-mono uppercase tracking-widest -mt-1 ${
                currentTheme.isLight ? 'text-slate-500' : 'text-slate-400'
              }`}
            >
              Autonomous AI Negotiator
            </span>
          </div>
        </button>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-semibold tracking-wide">
          <button
            onClick={() => {
              soundEffects.playBlip();
              onNavigate('home');
            }}
            className={`transition-all py-1 cursor-pointer flex items-center gap-1.5 ${
              currentTab === 'home'
                ? currentTheme.isLight
                  ? 'text-slate-900 border-b-2 font-bold'
                  : 'text-white border-b-2 font-bold'
                : currentTheme.isLight
                ? 'text-slate-600 hover:text-slate-900'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            style={{
              borderColor: currentTab === 'home' ? currentTheme.primaryAccentHex : 'transparent',
              color: currentTab === 'home' ? currentTheme.primaryAccentHex : undefined,
            }}
          >
            <span>Overview 3D</span>
          </button>

          <button
            onClick={() => {
              soundEffects.playBlip();
              onNavigate('negotiator');
            }}
            className={`transition-all py-1 flex items-center gap-1.5 cursor-pointer ${
              currentTab === 'negotiator'
                ? 'border-b-2 font-bold'
                : currentTheme.isLight
                ? 'text-slate-600 hover:text-slate-900'
                : 'text-slate-400 hover:text-white'
            }`}
            style={{
              borderColor: currentTab === 'negotiator' ? currentTheme.primaryAccentHex : 'transparent',
              color: currentTab === 'negotiator' ? currentTheme.primaryAccentHex : undefined,
            }}
          >
            <Zap className="w-3.5 h-3.5" style={{ color: currentTheme.primaryAccentHex }} />
            <span>AI Negotiator</span>
            <span
              className="w-1.5 h-1.5 rounded-full animate-ping"
              style={{ backgroundColor: currentTheme.primaryAccentHex }}
            />
          </button>

          <button
            onClick={() => {
              soundEffects.playBlip();
              onNavigate('ai_shopping');
            }}
            className={`transition-all py-1 flex items-center gap-1.5 cursor-pointer ${
              currentTab === 'ai_shopping'
                ? 'border-b-2 font-bold'
                : currentTheme.isLight
                ? 'text-slate-600 hover:text-slate-900'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            style={{
              borderColor: currentTab === 'ai_shopping' ? currentTheme.primaryAccentHex : 'transparent',
              color: currentTab === 'ai_shopping' ? currentTheme.primaryAccentHex : undefined,
            }}
          >
            <Sparkles className="w-3 h-3" style={{ color: currentTheme.primaryAccentHex }} />
            <span>AI Discovery</span>
          </button>

          <button
            onClick={() => {
              soundEffects.playBlip();
              onNavigate('categories');
            }}
            className={`transition-all py-1 flex items-center gap-1.5 cursor-pointer ${
              currentTab === 'categories'
                ? 'border-b-2 font-bold'
                : currentTheme.isLight
                ? 'text-slate-600 hover:text-slate-900'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            style={{
              borderColor: currentTab === 'categories' ? currentTheme.primaryAccentHex : 'transparent',
              color: currentTab === 'categories' ? currentTheme.primaryAccentHex : undefined,
            }}
          >
            <Layers className="w-3.5 h-3.5 opacity-70" />
            <span>Marketplace</span>
          </button>

          <button
            onClick={() => {
              soundEffects.playBlip();
              onNavigate('stores');
            }}
            className={`transition-all py-1 flex items-center gap-1.5 cursor-pointer ${
              currentTab === 'stores'
                ? 'border-b-2 font-bold'
                : currentTheme.isLight
                ? 'text-slate-600 hover:text-slate-900'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            style={{
              borderColor: currentTab === 'stores' ? currentTheme.primaryAccentHex : 'transparent',
              color: currentTab === 'stores' ? currentTheme.primaryAccentHex : undefined,
            }}
          >
            <Store className="w-3 h-3 opacity-70" />
            <span>Local Stores</span>
          </button>

          <button
            onClick={() => {
              soundEffects.playBlip();
              onNavigate('orders');
            }}
            className={`transition-all py-1 flex items-center gap-1.5 cursor-pointer ${
              currentTab === 'orders'
                ? 'border-b-2 font-bold'
                : currentTheme.isLight
                ? 'text-slate-600 hover:text-slate-900'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            style={{
              borderColor: currentTab === 'orders' ? currentTheme.primaryAccentHex : 'transparent',
              color: currentTab === 'orders' ? currentTheme.primaryAccentHex : undefined,
            }}
          >
            <span>Orders</span>
            {ordersCount > 0 && (
              <span className="text-[10px] font-mono text-emerald-400 font-bold px-1.5 py-0.2 rounded-full bg-emerald-950/80 border border-emerald-800">
                {ordersCount}
              </span>
            )}
          </button>
        </nav>

        {/* Zone 3: Actions, Quick Palette Switcher & Audio Controls */}
        <div className="flex items-center gap-2">
          {/* Quick Direct White / Charcoal Switcher */}
          <div
            className="flex items-center rounded-xl p-0.5 border"
            style={{
              backgroundColor: currentTheme.isLight ? '#F1F5F9' : '#181D22',
              borderColor: currentTheme.isLight ? '#E2E8F0' : '#293139',
            }}
          >
            <button
              onClick={() => {
                soundEffects.playBlip();
                onSelectTheme('pure-white');
              }}
              title="Set background to Pure White Canvas"
              className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition-all flex items-center gap-1 cursor-pointer ${
                currentThemeId === 'pure-white'
                  ? 'bg-white text-blue-600 shadow-sm border border-slate-200'
                  : currentTheme.isLight
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>☀️ White</span>
            </button>
            <button
              onClick={() => {
                soundEffects.playBlip();
                onSelectTheme('warm-graphite');
              }}
              title="Set background to Warm Charcoal #0E1114"
              className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition-all flex items-center gap-1 cursor-pointer ${
                currentThemeId === 'warm-graphite'
                  ? 'bg-[#242B32] text-[#4DA3FF] shadow-sm border border-[#3D4852]'
                  : currentTheme.isLight
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>🌙 #0E1114</span>
            </button>
          </div>

          {/* Palette Dropdown Button */}
          <div className="relative">
            <button
              onClick={() => {
                soundEffects.playBlip();
                setIsThemeMenuOpen(!isThemeMenuOpen);
              }}
              title="All Background Themes"
              className={`px-2.5 py-1.5 rounded-xl border text-xs font-mono font-medium transition-all cursor-pointer flex items-center gap-2 shadow-xs ${
                currentTheme.isLight
                  ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
                  : 'bg-slate-900/90 hover:bg-slate-800 border-white/10 text-slate-200 hover:text-white'
              }`}
            >
              <span
                className="w-3.5 h-3.5 rounded-full border border-black/20"
                style={{ backgroundColor: currentTheme.primaryAccentHex }}
              />
              <span className="hidden lg:inline">{currentTheme.name.split(' ')[0]}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {/* Dropdown Menu */}
            {isThemeMenuOpen && (
              <div
                className={`absolute right-0 mt-2 w-64 rounded-2xl border p-3 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 backdrop-blur-2xl ${
                  currentTheme.isLight
                    ? 'bg-white/98 border-slate-200 text-slate-900'
                    : 'bg-[#13171B]/95 border-[#293139] text-[#F2F5F7]'
                }`}
                style={{
                  boxShadow: `0 20px 40px -10px rgba(0,0,0,0.4), 0 0 20px ${currentTheme.primaryAccentHex}30`,
                }}
              >
                <div
                  className={`flex items-center justify-between pb-2 mb-2 border-b text-[11px] font-mono ${
                    currentTheme.isLight ? 'border-slate-200 text-slate-500' : 'border-[#293139] text-[#AAB3BC]'
                  }`}
                >
                  <span>Select Background Color</span>
                  <Palette className="w-3.5 h-3.5" style={{ color: currentTheme.primaryAccentHex }} />
                </div>
                <div className="space-y-1">
                  {(Object.keys(THEMES) as ThemeId[]).map((themeKey) => {
                    const t = THEMES[themeKey];
                    const isSelected = currentThemeId === themeKey;
                    return (
                      <button
                        key={themeKey}
                        onClick={() => {
                          soundEffects.playBlip();
                          onSelectTheme(themeKey);
                          setIsThemeMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-mono transition-all cursor-pointer ${
                          isSelected
                            ? currentTheme.isLight
                              ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200'
                              : 'bg-white/15 text-white font-bold'
                            : currentTheme.isLight
                            ? 'hover:bg-slate-100 text-slate-700'
                            : 'hover:bg-white/5 text-slate-300 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-black/20"
                            style={{ backgroundColor: t.primaryAccentHex }}
                          />
                          <span>{t.name}</span>
                        </div>
                        {isSelected && (
                          <Check className="w-3.5 h-3.5" style={{ color: t.primaryAccentHex }} />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 2. Ambient BGM Synthesizer Button */}
          <button
            onClick={handleToggleBgm}
            title={isBgmActive ? 'Pause Ambient Cyber BGM' : 'Play Ambient Cyber BGM'}
            className={`px-2.5 py-1.5 rounded-xl border text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm ${
              isBgmActive
                ? 'bg-cyan-950/90 border-cyan-400 text-cyan-300 shadow-cyan-500/20'
                : 'bg-slate-900/90 hover:bg-slate-800 border-white/10 text-slate-400 hover:text-white'
            }`}
          >
            <Music className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">BGM</span>
            {isBgmActive && (
              <span className="flex items-end gap-0.5 h-2.5">
                <span className="w-0.5 h-2.5 bg-cyan-400 animate-pulse" />
                <span className="w-0.5 h-1.5 bg-indigo-400 animate-ping" />
              </span>
            )}
          </button>

          {/* SFX Mute/Unmute */}
          <button
            onClick={toggleSound}
            title={soundEnabled ? 'Mute Interaction Audio' : 'Unmute Interaction Audio'}
            className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-white/10 text-slate-300 hover:text-white transition-all cursor-pointer"
          >
            {soundEnabled ? (
              <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
            ) : (
              <VolumeX className="w-3.5 h-3.5 text-slate-500" />
            )}
          </button>

          {/* Compare Drawer Action */}
          {comparedCount > 0 && (
            <button
              onClick={() => {
                soundEffects.playBlip();
                onOpenCompare();
              }}
              className="px-2.5 py-1.5 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/40 text-xs font-mono text-cyan-300 flex items-center gap-1.5 cursor-pointer transition-all shadow-sm"
              title="Compare selected products"
            >
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Compare</span> ({comparedCount})
            </button>
          )}

          {/* User Account / Wishlist Button */}
          <button
            onClick={() => {
              soundEffects.playBlip();
              onOpenAccount();
            }}
            className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer relative"
            title="Saved & History"
          >
            <User className="w-4 h-4" />
            {savedCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-cyan-400 text-slate-950 text-[9px] font-mono font-bold flex items-center justify-center shadow-md">
                {savedCount}
              </span>
            )}
          </button>

          {/* Primary CTA */}
          <button
            onClick={() => {
              soundEffects.playBlip();
              onNavigate('negotiator');
            }}
            className="px-3.5 py-2 text-xs font-bold text-slate-950 rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap transform hover:-translate-y-0.5 active:translate-y-0"
            style={{
              background: `linear-gradient(135deg, ${currentTheme.primaryAccentHex}, ${currentTheme.secondaryAccentHex})`,
              boxShadow: `0 4px 15px ${currentTheme.primaryAccentHex}30`,
            }}
          >
            <Zap className="w-3.5 h-3.5 text-slate-950 fill-current" />
            <span className="hidden sm:inline">Launch Negotiator</span>
            <span className="sm:hidden">Negotiate</span>
          </button>
        </div>
      </div>
    </header>
  );
};
