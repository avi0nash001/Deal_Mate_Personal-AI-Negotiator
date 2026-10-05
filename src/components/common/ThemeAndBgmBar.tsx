import React, { useState } from 'react';
import {
  Palette,
  Check,
  X,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { ThemeId, THEMES } from '../../types/theme';
import { soundEffects } from '../../services/soundEffects';

interface ThemeAndBgmBarProps {
  currentThemeId: ThemeId;
  onSelectTheme: (themeId: ThemeId) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export const ThemeAndBgmBar: React.FC<ThemeAndBgmBarProps> = ({
  currentThemeId,
  onSelectTheme,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const currentTheme = THEMES[currentThemeId];

  return (
    <>
      {/* Floating Theme Quick Pill in Bottom Corner */}
      <div className="fixed bottom-3 right-3 sm:bottom-5 sm:right-5 z-40 flex flex-col items-end gap-2 pointer-events-auto">
        {/* Expanded Panel */}
        {isExpanded && (
          <div
            className={`w-[calc(100vw-1.5rem)] max-w-sm rounded-2xl border p-4 sm:p-5 shadow-2xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 max-h-[80vh] overflow-y-auto backdrop-blur-2xl ${
              currentTheme.isLight
                ? 'bg-white/95 border-slate-200 text-slate-900'
                : 'bg-[#0E1526]/95 border-white/10 text-white'
            }`}
            style={{
              borderColor: `${currentTheme.primaryAccentHex}40`,
              boxShadow: `0 20px 40px -10px rgba(0,0,0,0.4), 0 0 25px ${currentTheme.primaryAccentHex}25`,
            }}
          >
            {/* Header */}
            <div
              className={`flex items-center justify-between pb-3 mb-3 border-b ${
                currentTheme.isLight ? 'border-slate-200' : 'border-white/10'
              }`}
            >
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4" style={{ color: currentTheme.primaryAccentHex }} />
                <span className="text-xs font-mono font-bold uppercase tracking-wider">
                  Color Themes
                </span>
              </div>
              <button
                onClick={() => setIsExpanded(false)}
                className={`p-1 rounded-lg transition-colors cursor-pointer ${
                  currentTheme.isLight
                    ? 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'
                    : 'hover:bg-white/10 text-slate-400 hover:text-white'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Theme Selection Palette */}
            <div className="space-y-2">
              <div
                className={`flex items-center justify-between text-[11px] font-mono ${
                  currentTheme.isLight ? 'text-slate-600' : 'text-slate-300'
                }`}
              >
                <span>Select Background Color:</span>
                <span className="font-bold" style={{ color: currentTheme.primaryAccentHex }}>
                  {currentTheme.name}
                </span>
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5 pt-1">
                {(Object.keys(THEMES) as ThemeId[]).map((themeKey) => {
                  const t = THEMES[themeKey];
                  const isSelected = currentThemeId === themeKey;
                  return (
                    <button
                      key={themeKey}
                      onClick={() => {
                        soundEffects.playBlip();
                        onSelectTheme(themeKey);
                      }}
                      title={`${t.name} — ${t.tagline}`}
                      className={`relative flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all cursor-pointer group ${
                        isSelected
                          ? 'border-blue-500 ring-2 scale-105 shadow-lg'
                          : 'border-slate-300/40 hover:border-slate-400/60'
                      }`}
                      style={{
                        backgroundColor: t.bgHex,
                        boxShadow: isSelected ? `0 0 14px ${t.primaryAccentHex}50` : undefined,
                      }}
                    >
                      {/* Swatch tri-circle preview */}
                      <div className="flex items-center -space-x-1">
                        <span
                          className="w-3 h-3 rounded-full border border-black/40 shadow-xs"
                          style={{ backgroundColor: t.swatchPreview[0] }}
                        />
                        <span
                          className="w-3 h-3 rounded-full border border-black/40 shadow-xs"
                          style={{ backgroundColor: t.swatchPreview[1] }}
                        />
                        <span
                          className="w-3 h-3 rounded-full border border-black/40 shadow-xs"
                          style={{ backgroundColor: t.swatchPreview[2] }}
                        />
                      </div>
                      <span
                        className={`text-[9px] font-mono truncate max-w-full text-center ${
                          t.isLight ? 'text-slate-800' : 'text-slate-300'
                        }`}
                      >
                        {t.name.split(' ')[0]}
                      </span>

                      {isSelected && (
                        <div
                          className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center text-black"
                          style={{ backgroundColor: t.primaryAccentHex }}
                        >
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
              <p
                className={`text-[10px] font-mono italic mt-1 ${
                  currentTheme.isLight ? 'text-slate-500' : 'text-slate-400'
                }`}
              >
                {currentTheme.tagline}
              </p>
            </div>
          </div>
        )}

        {/* Collapsed Pill Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              soundEffects.playBlip();
              setIsExpanded(!isExpanded);
            }}
            title="Open Color Palette Studio"
            className={`px-3.5 py-2 rounded-xl backdrop-blur-xl border text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-2 shadow-xl ${
              currentTheme.isLight
                ? 'bg-white/95 border-slate-200 text-slate-800 hover:bg-slate-50'
                : 'bg-[#0E1526]/90 border-white/15 text-slate-200 hover:text-white hover:bg-[#141E34]'
            }`}
          >
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{
                backgroundColor: currentTheme.primaryAccentHex,
                boxShadow: `0 0 8px ${currentTheme.primaryAccentHex}`,
              }}
            />
            <span>Theme Colors</span>
            {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </>
  );
};
