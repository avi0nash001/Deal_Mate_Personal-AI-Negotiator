import React from 'react';
import { ShieldCheck, Cpu } from 'lucide-react';
import { ThemeId, THEMES } from '../../types/theme';

interface FooterProps {
  currentThemeId?: ThemeId;
}

export const Footer: React.FC<FooterProps> = ({ currentThemeId = 'pure-white' }) => {
  const theme = THEMES[currentThemeId] || THEMES['pure-white'];

  return (
    <footer
      className={`border-t py-12 px-4 sm:px-6 lg:px-8 text-xs transition-colors ${
        theme.isLight
          ? 'bg-slate-50/90 border-slate-200 text-slate-600'
          : 'bg-[#0E1114] border-[#293139] text-[#AAB3BC]'
      }`}
    >
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <span
            className={`font-display font-bold text-sm tracking-tight ${
              theme.isLight ? 'text-slate-900' : 'text-[#F2F5F7]'
            }`}
          >
            DealMate
          </span>
          <span className="hidden sm:inline opacity-40">·</span>
          <span>Autonomous AI-to-AI Shopping Negotiation Protocol</span>
        </div>

        <div className="flex items-center gap-6">
          <div
            className="flex items-center gap-1.5 font-mono text-[11px]"
            style={{ color: theme.dealEmerald }}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Cryptographic Deal Price Lock</span>
          </div>
          <span className="opacity-30">·</span>
          <div
            className="flex items-center gap-1.5 font-mono text-[11px]"
            style={{ color: theme.buyerBlue }}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Dual-Agent State Machine</span>
          </div>
        </div>

        <div className={theme.isLight ? 'text-slate-400' : 'text-[#707A84]'}>
          © {new Date().getFullYear()} DealMate Systems. All rights reserved.
        </div>
      </div>
    </footer>
  );
};
