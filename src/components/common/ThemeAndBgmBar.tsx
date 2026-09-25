import React, { useState, useEffect } from 'react';
import {
  Palette,
  Music,
  Volume2,
  VolumeX,
  Check,
  Sparkles,
  X,
  ChevronUp,
  ChevronDown,
  Sliders,
  Disc3,
  Flame,
  Radio,
} from 'lucide-react';
import { ThemeId, THEMES } from '../../types/theme';
import { soundEffects, BGM_TRACKS, BgmTrackId } from '../../services/soundEffects';

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
  const [isBgmActive, setIsBgmActive] = useState<boolean>(soundEffects.bgmPlaying);
  const [currentTrack, setCurrentTrack] = useState<BgmTrackId>(soundEffects.currentTrackId);
  const [bgmVolume, setBgmVolume] = useState<number>(0.04);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = soundEffects.subscribeBgmState((playing, trackId) => {
      setIsBgmActive(playing);
      setCurrentTrack(trackId);
    });
    return unsubscribe;
  }, []);

  const handleToggleBgm = () => {
    const nextState = soundEffects.toggleBGM();
    setIsBgmActive(nextState);
    if (!nextState) {
      soundEffects.playBlip();
    }
  };

  const handleSelectTrack = (trackId: BgmTrackId) => {
    soundEffects.playBlip();
    soundEffects.setBgmTrack(trackId);
    if (!isBgmActive) {
      soundEffects.startBGM(trackId);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setBgmVolume(val);
    soundEffects.setBGMVolume(val);
  };

  const currentTheme = THEMES[currentThemeId];
  const activeTrackInfo = BGM_TRACKS.find((t) => t.id === currentTrack) || BGM_TRACKS[0];

  return (
    <>
      {/* Floating Theme & BGM Quick Pill in Bottom Corner */}
      <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-2 pointer-events-auto">
        {/* Expanded Panel */}
        {isExpanded && (
          <div
            className="w-84 sm:w-96 rounded-2xl border border-white/10 bg-[#0E1526]/95 backdrop-blur-2xl p-5 shadow-2xl shadow-black/80 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 max-h-[85vh] overflow-y-auto"
            style={{
              borderColor: `${currentTheme.primaryAccentHex}40`,
              boxShadow: `0 20px 40px -10px rgba(0,0,0,0.8), 0 0 25px ${currentTheme.primaryAccentHex}25`,
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                  Color Themes & BGM Soundtrack
                </span>
              </div>
              <button
                onClick={() => setIsExpanded(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 1. Theme Selection Palette */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-300">
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
                          ? 'border-white/80 ring-2 scale-105 shadow-lg'
                          : 'border-white/10 hover:border-white/30 bg-black/40 hover:bg-white/5'
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
                      <span className={`text-[9px] font-mono truncate max-w-full text-center ${t.isLight ? 'text-slate-800' : 'text-slate-300'}`}>
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
              <p className="text-[10px] text-slate-400 font-mono italic mt-1">
                {currentTheme.tagline}
              </p>
            </div>

            {/* 2. Selectable BGM Tracks */}
            <div className="pt-3 border-t border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${
                      isBgmActive ? 'bg-cyan-500/20 text-cyan-300' : 'bg-white/5 text-slate-500'
                    }`}
                  >
                    <Music className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>Ambient Background Music (BGM)</span>
                      {isBgmActive && (
                        <span className="flex items-end gap-0.5 h-3">
                          <span className="w-0.5 h-3 bg-cyan-400 animate-pulse" />
                          <span className="w-0.5 h-2 bg-indigo-400 animate-ping" />
                          <span className="w-0.5 h-2.5 bg-emerald-400 animate-pulse" />
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] font-mono text-slate-400">
                      {isBgmActive ? `Active: ${activeTrackInfo.name}` : 'Background soundtrack paused'}
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleToggleBgm}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer border flex items-center gap-1.5 ${
                    isBgmActive
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-md shadow-cyan-500/20'
                      : 'bg-white/10 hover:bg-white/20 border-white/20 text-slate-300'
                  }`}
                >
                  {isBgmActive ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                  <span>{isBgmActive ? 'BGM ON' : 'PLAY BGM'}</span>
                </button>
              </div>

              {/* BGM Track Selector Buttons */}
              <div className="space-y-1.5 pt-1">
                <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                  Switch Soundtrack Style:
                </div>
                <div className="grid grid-cols-1 gap-1.5">
                  {BGM_TRACKS.map((t) => {
                    const isCurrent = currentTrack === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => handleSelectTrack(t.id)}
                        className={`w-full text-left p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                          isCurrent
                            ? 'bg-cyan-950/70 border-cyan-500/50 text-cyan-200'
                            : 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Disc3
                            className={`w-3.5 h-3.5 ${
                              isCurrent && isBgmActive ? 'animate-spin text-cyan-400' : 'text-slate-500'
                            }`}
                          />
                          <div>
                            <div className="text-xs font-bold leading-tight flex items-center gap-1.5">
                              <span>{t.name}</span>
                              <span className="text-[9px] px-1.5 py-0.2 rounded font-mono bg-white/10 text-slate-400">
                                {t.genre}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono truncate max-w-[210px]">
                              {t.description}
                            </div>
                          </div>
                        </div>

                        {isCurrent && isBgmActive && (
                          <span className="text-[10px] font-mono font-bold text-cyan-400 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                            PLAYING
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Volume Slider */}
              {isBgmActive && (
                <div className="flex items-center gap-3 pt-1">
                  <span className="text-[10px] font-mono text-slate-400">Volume:</span>
                  <input
                    type="range"
                    min="0.005"
                    max="0.1"
                    step="0.005"
                    value={bgmVolume}
                    onChange={handleVolumeChange}
                    className="flex-1 accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                  <span className="text-[10px] font-mono text-cyan-400 w-8 text-right">
                    {Math.round((bgmVolume / 0.1) * 100)}%
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Collapsed Pill Button */}
        <div className="flex items-center gap-2">
          {/* Quick BGM Play Button */}
          <button
            onClick={handleToggleBgm}
            title={isBgmActive ? 'Mute Background Music (BGM)' : 'Play Ambient Cyber BGM'}
            className={`px-3 py-2 rounded-xl backdrop-blur-xl border text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-2 shadow-xl ${
              isBgmActive
                ? 'bg-cyan-950/90 border-cyan-400 text-cyan-300 shadow-cyan-500/20'
                : 'bg-[#0E1526]/90 border-white/15 text-slate-300 hover:text-white hover:border-white/30'
            }`}
          >
            {isBgmActive ? (
              <>
                <span className="flex items-end gap-0.5 h-3">
                  <span className="w-0.5 h-3 bg-cyan-400 animate-pulse" />
                  <span className="w-0.5 h-1.5 bg-indigo-400 animate-ping" />
                  <span className="w-0.5 h-2.5 bg-cyan-300 animate-pulse" />
                </span>
                <span>BGM: {activeTrackInfo.name.split(' ')[0]}</span>
              </>
            ) : (
              <>
                <VolumeX className="w-3.5 h-3.5 text-slate-400" />
                <span>BGM: OFF</span>
              </>
            )}
          </button>

          {/* Quick Color Palette Switcher Trigger */}
          <button
            onClick={() => {
              soundEffects.playBlip();
              setIsExpanded(!isExpanded);
            }}
            title="Open Color Palette & Soundtrack Studio"
            className="px-3 py-2 rounded-xl backdrop-blur-xl border border-white/15 bg-[#0E1526]/90 hover:bg-[#141E34] text-xs font-mono font-bold text-slate-200 hover:text-white transition-all cursor-pointer flex items-center gap-2 shadow-xl hover:border-white/30"
          >
            {/* Color swatch dot */}
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{
                backgroundColor: currentTheme.primaryAccentHex,
                boxShadow: `0 0 8px ${currentTheme.primaryAccentHex}`,
              }}
            />
            <span>Colors & Audio</span>
            {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </>
  );
};
