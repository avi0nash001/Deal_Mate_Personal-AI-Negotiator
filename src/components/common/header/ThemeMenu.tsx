import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Monitor, Check, ChevronDown, SlidersHorizontal } from 'lucide-react';
import { ThemeId, THEMES } from '../../../types/theme';
import { soundEffects } from '../../../services/soundEffects';

interface ThemeMenuProps {
  currentThemeId: ThemeId;
  onSelectTheme: (themeId: ThemeId) => void;
}

type ThemeMode = 'light' | 'dark' | 'system';

export const ThemeMenu: React.FC<ThemeMenuProps> = ({
  currentThemeId,
  onSelectTheme,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [themeMode, setThemeMode] = useState<ThemeMode>(() =>
    currentThemeId === 'pure-white' ? 'light' : 'dark'
  );
  const menuRef = useRef<HTMLDivElement>(null);

  const currentTheme = THEMES[currentThemeId] || THEMES['pure-white'];

  useEffect(() => {
    if (currentThemeId === 'pure-white' && themeMode !== 'system') {
      setThemeMode('light');
    } else if (currentThemeId !== 'pure-white' && themeMode !== 'system') {
      setThemeMode('dark');
    }
  }, [currentThemeId, themeMode]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setShowAdvanced(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        setShowAdvanced(false);
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

  const handleSelectMode = (mode: ThemeMode) => {
    soundEffects.playBlip();
    setThemeMode(mode);
    if (mode === 'light') {
      onSelectTheme('pure-white');
    } else if (mode === 'dark') {
      onSelectTheme('warm-graphite');
    } else {
      const prefersDark =
        typeof window !== 'undefined' &&
        window.matchMedia &&
        window.matchMedia('(prefers-color-scheme: dark)').matches;
      onSelectTheme(prefersDark ? 'warm-graphite' : 'pure-white');
    }
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => {
          soundEffects.playBlip();
          setIsOpen((prev) => !prev);
        }}
        title="Change appearance theme (Light, Dark, System)"
        aria-label="Theme settings"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className={`h-9 px-2.5 rounded-lg border text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
          currentTheme.isLight
            ? 'bg-white hover:bg-slate-50 border-slate-200/90 text-slate-700'
            : 'bg-[#161B20] hover:bg-[#1E242B] border-[#293139] text-slate-200'
        }`}
      >
        {currentTheme.isLight ? (
          <Sun className="w-3.5 h-3.5 text-amber-500 shrink-0" />
        ) : (
          <Moon className="w-3.5 h-3.5 text-blue-400 shrink-0" />
        )}
        <span className="hidden xl:inline">Theme</span>
        <ChevronDown
          className={`w-3 h-3 opacity-60 transition-transform duration-150 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-label="Appearance options"
          className={`absolute right-0 mt-2 w-56 rounded-xl border p-1.5 shadow-xl z-50 backdrop-blur-xl ${
            currentTheme.isLight
              ? 'bg-white/98 border-slate-200 text-slate-800 shadow-slate-900/5'
              : 'bg-[#14191F]/98 border-[#293139] text-slate-100 shadow-black/60'
          }`}
        >
          <div className="px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Appearance
          </div>

          <button
            type="button"
            role="menuitem"
            onClick={() => handleSelectMode('light')}
            className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
              themeMode === 'light' && currentThemeId === 'pure-white'
                ? currentTheme.isLight
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'bg-blue-950/50 text-blue-300 font-semibold'
                : currentTheme.isLight
                ? 'hover:bg-slate-100 text-slate-700'
                : 'hover:bg-white/5 text-slate-300'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              <span>Light</span>
            </span>
            {themeMode === 'light' && currentThemeId === 'pure-white' && (
              <Check className="w-3.5 h-3.5 text-blue-600" />
            )}
          </button>

          <button
            type="button"
            role="menuitem"
            onClick={() => handleSelectMode('dark')}
            className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
              themeMode === 'dark' && currentThemeId === 'warm-graphite'
                ? currentTheme.isLight
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'bg-blue-950/50 text-blue-300 font-semibold'
                : currentTheme.isLight
                ? 'hover:bg-slate-100 text-slate-700'
                : 'hover:bg-white/5 text-slate-300'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <Moon className="w-3.5 h-3.5 text-blue-400" />
              <span>Dark</span>
            </span>
            {themeMode === 'dark' && currentThemeId === 'warm-graphite' && (
              <Check className="w-3.5 h-3.5 text-blue-500" />
            )}
          </button>

          <button
            type="button"
            role="menuitem"
            onClick={() => handleSelectMode('system')}
            className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
              themeMode === 'system'
                ? currentTheme.isLight
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'bg-blue-950/50 text-blue-300 font-semibold'
                : currentTheme.isLight
                ? 'hover:bg-slate-100 text-slate-700'
                : 'hover:bg-white/5 text-slate-300'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <Monitor className="w-3.5 h-3.5 text-slate-400" />
              <span>System</span>
            </span>
            {themeMode === 'system' && (
              <Check className="w-3.5 h-3.5 text-blue-500" />
            )}
          </button>

          {/* Optional Advanced Theme Presets */}
          <div
            className={`mt-1 pt-1 border-t ${
              currentTheme.isLight ? 'border-slate-100' : 'border-[#242C35]'
            }`}
          >
            <button
              type="button"
              onClick={() => setShowAdvanced((prev) => !prev)}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                currentTheme.isLight
                  ? 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
              }`}
            >
              <span className="flex items-center gap-2">
                <SlidersHorizontal className="w-3 h-3" />
                <span>Studio Presets</span>
              </span>
              <ChevronDown
                className={`w-3 h-3 transition-transform ${
                  showAdvanced ? 'rotate-180' : ''
                }`}
              />
            </button>

            {showAdvanced && (
              <div className="mt-1 space-y-0.5 max-h-48 overflow-y-auto pr-0.5">
                {(Object.keys(THEMES) as ThemeId[]).map((themeKey) => {
                  const t = THEMES[themeKey];
                  const isSelected = currentThemeId === themeKey;
                  return (
                    <button
                      key={themeKey}
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        soundEffects.playBlip();
                        setThemeMode(t.isLight ? 'light' : 'dark');
                        onSelectTheme(themeKey);
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                        isSelected
                          ? currentTheme.isLight
                            ? 'bg-blue-50 text-blue-700 font-semibold'
                            : 'bg-white/10 text-white font-semibold'
                          : currentTheme.isLight
                          ? 'hover:bg-slate-100 text-slate-600'
                          : 'hover:bg-white/5 text-slate-300'
                      }`}
                    >
                      <span className="flex items-center gap-2 truncate">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0 border border-black/15"
                          style={{ backgroundColor: t.primaryAccentHex }}
                        />
                        <span className="truncate">{t.name.replace(' #0E1114', '')}</span>
                      </span>
                      {isSelected && <Check className="w-3 h-3 shrink-0 text-blue-500" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
