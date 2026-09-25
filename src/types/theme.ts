export type ThemeId =
  | 'pure-white'
  | 'warm-graphite'
  | 'cyber-indigo'
  | 'cosmic-nebula'
  | 'emerald-matrix'
  | 'titanium-stealth'
  | 'solar-gold';

export interface ThemeConfig {
  id: ThemeId;
  name: string;
  tagline: string;
  bgHex: string;
  isLight: boolean;
  bodyGradient: string;
  ambientMesh: string;
  primaryAccent: string; // e.g. text color or hex
  primaryAccentHex: string;
  secondaryAccentHex: string;
  particleColors: string[];
  ringColors: [string, string];
  glassBorder: string;
  cardBg: string;
  badgeBg: string;
  level1Bg: string;
  level2Bg: string;
  level3Card: string;
  level4Elevated: string;
  level5Surface: string;
  borderPrimary: string;
  borderSecondary: string;
  borderActive: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  buyerBlue: string;
  sellerAmber: string;
  dealEmerald: string;
  glowClasses: {
    spotlight1: string;
    spotlight2: string;
  };
  swatchPreview: [string, string, string];
}

export const THEMES: Record<ThemeId, ThemeConfig> = {
  'pure-white': {
    id: 'pure-white',
    name: 'Pure White Canvas',
    tagline: 'Clean white background with refined slate surfaces & high contrast',
    bgHex: '#FFFFFF',
    isLight: true,
    bodyGradient: 'bg-white',
    ambientMesh: 'from-blue-200/20 via-slate-100/30 to-amber-200/15',
    primaryAccent: 'text-blue-600',
    primaryAccentHex: '#2563eb',
    secondaryAccentHex: '#3b82f6',
    particleColors: ['#2563eb', '#3b82f6', '#0284c7', '#16a34a', '#d97706'],
    ringColors: ['rgba(37, 99, 235, 0.25)', 'rgba(59, 130, 246, 0.2)'],
    glassBorder: 'border-slate-200',
    cardBg: 'bg-white',
    badgeBg: 'bg-blue-50 border-blue-200 text-blue-700',
    level1Bg: '#FFFFFF',
    level2Bg: '#F8FAFC',
    level3Card: '#FFFFFF',
    level4Elevated: '#F1F5F9',
    level5Surface: '#E2E8F0',
    borderPrimary: '#E2E8F0',
    borderSecondary: '#CBD5E1',
    borderActive: '#94A3B8',
    textPrimary: '#0F172A',
    textSecondary: '#475569',
    textMuted: '#64748B',
    buyerBlue: '#2563EB',
    sellerAmber: '#D97706',
    dealEmerald: '#16A34A',
    glowClasses: {
      spotlight1: 'bg-blue-500/10',
      spotlight2: 'bg-indigo-500/10',
    },
    swatchPreview: ['#FFFFFF', '#2563eb', '#F1F5F9'],
  },
  'warm-graphite': {
    id: 'warm-graphite',
    name: 'Warm Graphite #0E1114',
    tagline: 'Deep charcoal #0E1114 foundation with layered surfaces',
    bgHex: '#0E1114',
    isLight: false,
    bodyGradient: 'bg-[#0E1114]',
    ambientMesh: 'from-blue-600/10 via-amber-600/8 to-emerald-600/8',
    primaryAccent: 'text-[#4DA3FF]',
    primaryAccentHex: '#4DA3FF',
    secondaryAccentHex: '#78BCFF',
    particleColors: ['#4DA3FF', '#78BCFF', '#F2A93B', '#35D07F', '#AAB3BC'],
    ringColors: ['rgba(77, 163, 255, 0.3)', 'rgba(242, 169, 59, 0.25)'],
    glassBorder: 'border-[#293139]',
    cardBg: 'bg-[#181D22]',
    badgeBg: 'bg-[#1E242A] border-[#293139] text-[#4DA3FF]',
    level1Bg: '#0E1114',
    level2Bg: '#13171B',
    level3Card: '#181D22',
    level4Elevated: '#1E242A',
    level5Surface: '#242B32',
    borderPrimary: '#293139',
    borderSecondary: '#323B44',
    borderActive: '#3D4852',
    textPrimary: '#F2F5F7',
    textSecondary: '#AAB3BC',
    textMuted: '#707A84',
    buyerBlue: '#4DA3FF',
    sellerAmber: '#F2A93B',
    dealEmerald: '#35D07F',
    glowClasses: {
      spotlight1: 'bg-blue-500/15',
      spotlight2: 'bg-amber-500/10',
    },
    swatchPreview: ['#0E1114', '#4DA3FF', '#181D22'],
  },
  'cyber-indigo': {
    id: 'cyber-indigo',
    name: 'Cyber Indigo',
    tagline: 'Deep space sapphire with electric cyan & indigo pulses',
    bgHex: '#080D1A',
    isLight: false,
    bodyGradient: 'bg-gradient-to-b from-[#0B1124] via-[#070B16] to-[#04060C]',
    ambientMesh: 'from-cyan-500/15 via-indigo-600/15 to-blue-500/10',
    primaryAccent: 'text-cyan-400',
    primaryAccentHex: '#06b6d4',
    secondaryAccentHex: '#6366f1',
    particleColors: ['#06b6d4', '#38bdf8', '#6366f1', '#818cf8', '#22d3ee'],
    ringColors: ['rgba(6, 182, 212, 0.35)', 'rgba(99, 102, 241, 0.3)'],
    glassBorder: 'border-cyan-500/25',
    cardBg: 'bg-[#0E1528]/85',
    badgeBg: 'bg-cyan-950/80 border-cyan-500/40 text-cyan-300',
    level1Bg: '#080D1A',
    level2Bg: '#0B1124',
    level3Card: '#0E1528',
    level4Elevated: '#131B32',
    level5Surface: '#192442',
    borderPrimary: '#1E2D4A',
    borderSecondary: '#2B3E66',
    borderActive: '#3B82F6',
    textPrimary: '#F8FAFC',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',
    buyerBlue: '#06b6d4',
    sellerAmber: '#f59e0b',
    dealEmerald: '#10b981',
    glowClasses: {
      spotlight1: 'bg-cyan-500/20',
      spotlight2: 'bg-indigo-600/20',
    },
    swatchPreview: ['#0B1124', '#06b6d4', '#6366f1'],
  },
  'cosmic-nebula': {
    id: 'cosmic-nebula',
    name: 'Cosmic Nebula',
    tagline: 'Deep velvet violet with radiant magenta & neon astral light',
    bgHex: '#100A1F',
    isLight: false,
    bodyGradient: 'bg-gradient-to-b from-[#150D2B] via-[#0E081C] to-[#080410]',
    ambientMesh: 'from-fuchsia-600/15 via-purple-600/20 to-pink-500/10',
    primaryAccent: 'text-fuchsia-400',
    primaryAccentHex: '#d946ef',
    secondaryAccentHex: '#a855f7',
    particleColors: ['#d946ef', '#c084fc', '#f43f5e', '#a855f7', '#ec4899'],
    ringColors: ['rgba(217, 70, 239, 0.35)', 'rgba(168, 85, 247, 0.3)'],
    glassBorder: 'border-purple-500/25',
    cardBg: 'bg-[#18112E]/85',
    badgeBg: 'bg-purple-950/80 border-purple-500/40 text-purple-300',
    level1Bg: '#100A1F',
    level2Bg: '#150D2B',
    level3Card: '#18112E',
    level4Elevated: '#21173F',
    level5Surface: '#2B1E52',
    borderPrimary: '#382669',
    borderSecondary: '#4A338B',
    borderActive: '#A855F7',
    textPrimary: '#F8FAFC',
    textSecondary: '#C084FC',
    textMuted: '#9333EA',
    buyerBlue: '#A855F7',
    sellerAmber: '#F43F5E',
    dealEmerald: '#10B981',
    glowClasses: {
      spotlight1: 'bg-fuchsia-600/20',
      spotlight2: 'bg-purple-600/20',
    },
    swatchPreview: ['#150D2B', '#d946ef', '#a855f7'],
  },
  'emerald-matrix': {
    id: 'emerald-matrix',
    name: 'Emerald Matrix',
    tagline: 'Deep dark jade obsidian with bio-tech emerald & mint neon',
    bgHex: '#051412',
    isLight: false,
    bodyGradient: 'bg-gradient-to-b from-[#091F1C] via-[#051412] to-[#020A09]',
    ambientMesh: 'from-emerald-500/15 via-teal-600/15 to-cyan-500/10',
    primaryAccent: 'text-emerald-400',
    primaryAccentHex: '#10b981',
    secondaryAccentHex: '#14b8a6',
    particleColors: ['#10b981', '#34d399', '#14b8a6', '#059669', '#6ee7b7'],
    ringColors: ['rgba(16, 185, 129, 0.35)', 'rgba(20, 184, 166, 0.3)'],
    glassBorder: 'border-emerald-500/25',
    cardBg: 'bg-[#0C2420]/85',
    badgeBg: 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300',
    level1Bg: '#051412',
    level2Bg: '#091F1C',
    level3Card: '#0C2420',
    level4Elevated: '#11332D',
    level5Surface: '#17443C',
    borderPrimary: '#1E574D',
    borderSecondary: '#297366',
    borderActive: '#10B981',
    textPrimary: '#F0FDF4',
    textSecondary: '#A7F3D0',
    textMuted: '#6EE7B7',
    buyerBlue: '#06B6D4',
    sellerAmber: '#F59E0B',
    dealEmerald: '#10B981',
    glowClasses: {
      spotlight1: 'bg-emerald-500/20',
      spotlight2: 'bg-teal-600/20',
    },
    swatchPreview: ['#091F1C', '#10b981', '#14b8a6'],
  },
  'titanium-stealth': {
    id: 'titanium-stealth',
    name: 'Titanium Graphite',
    tagline: 'Ultra-refined charcoal steel with icy sky & platinum sheen',
    bgHex: '#10141B',
    isLight: false,
    bodyGradient: 'bg-gradient-to-b from-[#161B24] via-[#0F131A] to-[#0A0D12]',
    ambientMesh: 'from-slate-400/10 via-sky-600/15 to-cyan-500/10',
    primaryAccent: 'text-sky-400',
    primaryAccentHex: '#38bdf8',
    secondaryAccentHex: '#94a3b8',
    particleColors: ['#38bdf8', '#94a3b8', '#cbd5e1', '#64748b', '#0ea5e9'],
    ringColors: ['rgba(56, 189, 248, 0.35)', 'rgba(148, 163, 184, 0.3)'],
    glassBorder: 'border-slate-500/25',
    cardBg: 'bg-[#171D27]/85',
    badgeBg: 'bg-slate-900/90 border-slate-600/50 text-sky-300',
    level1Bg: '#10141B',
    level2Bg: '#161B24',
    level3Card: '#171D27',
    level4Elevated: '#202836',
    level5Surface: '#2B3547',
    borderPrimary: '#374359',
    borderSecondary: '#475672',
    borderActive: '#38BDF8',
    textPrimary: '#F8FAFC',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',
    buyerBlue: '#38BDF8',
    sellerAmber: '#F59E0B',
    dealEmerald: '#10B981',
    glowClasses: {
      spotlight1: 'bg-sky-500/15',
      spotlight2: 'bg-slate-500/15',
    },
    swatchPreview: ['#161B24', '#38bdf8', '#94a3b8'],
  },
  'solar-gold': {
    id: 'solar-gold',
    name: 'Solar Eclipse',
    tagline: 'Warm espresso obsidian with liquid amber & champagne gold radiance',
    bgHex: '#161009',
    isLight: false,
    bodyGradient: 'bg-gradient-to-b from-[#21160C] via-[#140E08] to-[#0B0704]',
    ambientMesh: 'from-amber-500/15 via-orange-600/15 to-yellow-500/10',
    primaryAccent: 'text-amber-400',
    primaryAccentHex: '#f59e0b',
    secondaryAccentHex: '#fbbf24',
    particleColors: ['#f59e0b', '#fbbf24', '#f97316', '#d97706', '#fde047'],
    ringColors: ['rgba(245, 158, 11, 0.35)', 'rgba(251, 191, 36, 0.3)'],
    glassBorder: 'border-amber-500/25',
    cardBg: 'bg-[#241A10]/85',
    badgeBg: 'bg-amber-950/80 border-amber-500/40 text-amber-300',
    level1Bg: '#161009',
    level2Bg: '#21160C',
    level3Card: '#241A10',
    level4Elevated: '#322316',
    level5Surface: '#422E1D',
    borderPrimary: '#543B25',
    borderSecondary: '#6B4B2F',
    borderActive: '#F59E0B',
    textPrimary: '#FFFBEB',
    textSecondary: '#FDE68A',
    textMuted: '#F59E0B',
    buyerBlue: '#38BDF8',
    sellerAmber: '#F59E0B',
    dealEmerald: '#10B981',
    glowClasses: {
      spotlight1: 'bg-amber-500/20',
      spotlight2: 'bg-orange-600/15',
    },
    swatchPreview: ['#21160C', '#f59e0b', '#fbbf24'],
  },
};
