import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Search,
  CheckCircle,
  HelpCircle,
  TrendingDown,
  Store,
  Bot,
  Zap,
  ShoppingBag,
  SlidersHorizontal,
  Compass
} from 'lucide-react';

interface SmartBuyHeroProps {
  onStartAIShopping: (initialQuery?: string) => void;
  onExploreCategories: () => void;
  onSelectBudget: (budget: number) => void;
}

export const SmartBuyHero: React.FC<SmartBuyHeroProps> = ({
  onStartAIShopping,
  onExploreCategories,
  onSelectBudget,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const quickPrompts = [
    'I have ₹2,000 and I need a casual shirt for college',
    'My budget is ₹5,000. I need a dress for my birthday',
    'I have 3000 rupees. I want good shoes for college',
    'I need groceries for a family of four under ₹2,000',
    'Find a birthday gift for my sister under ₹1,500',
  ];

  const budgetChips = [500, 1000, 2000, 5000, 10000];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onStartAIShopping(searchQuery.trim());
    } else {
      onStartAIShopping();
    }
  };

  return (
    <div className="space-y-24">
      {/* 1. HERO SECTION */}
      <section className="relative pt-6 pb-12 overflow-hidden text-center max-w-4xl mx-auto space-y-8">
        {/* Ambient background glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-cyan-500/10 via-indigo-600/15 to-emerald-500/10 rounded-full blur-[130px] pointer-events-none" />

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0E1524] border border-cyan-500/30 text-xs text-cyan-300 font-mono shadow-inner">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Budget-First AI Shopping Discovery & Bargaining</span>
        </div>

        <h1 className="font-display font-extrabold text-4xl sm:text-6xl text-white tracking-tight leading-[1.1] text-balance">
          Tell Us What You Need.{' '}
          <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-indigo-400 bg-clip-text text-transparent">
            We’ll Find It Within Your Budget.
          </span>
        </h1>

        <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto">
          Your AI shopping assistant understands your budget, preferences, and requirements and helps you discover the right products and stores.
        </p>

        {/* Natural Language Search Input Bar */}
        <form onSubmit={handleSearchSubmit} className="relative max-w-2xl mx-auto">
          <div className="relative flex items-center bg-[#0C111E] border border-slate-700/80 hover:border-cyan-400/80 focus-within:border-cyan-400 rounded-2xl shadow-2xl p-2 transition-all">
            <Search className="w-5 h-5 text-slate-400 ml-3 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="e.g. 'I have ₹2,000 and I need a casual shirt for college'..."
              className="w-full px-3 py-2 bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none font-sans"
            />
            <button
              type="submit"
              className="px-5 py-2.5 bg-gradient-to-r from-cyan-400 to-indigo-500 hover:from-cyan-300 hover:to-indigo-400 text-slate-950 font-bold text-xs rounded-xl shadow-md shadow-cyan-500/20 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <span>Ask AI</span>
              <ArrowRight className="w-3.5 h-3.5 font-bold" />
            </button>
          </div>

          {/* Quick Click Prompts */}
          <div className="mt-3 flex items-center justify-center gap-2 flex-wrap">
            <span className="text-[11px] font-mono text-slate-500">Try:</span>
            {quickPrompts.slice(0, 3).map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onStartAIShopping(prompt)}
                className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-cyan-300 border border-slate-800 transition-colors cursor-pointer"
              >
                "{prompt}"
              </button>
            ))}
          </div>
        </form>

        {/* Quick Budget Jump Selector */}
        <div className="pt-2">
          <span className="text-xs font-mono text-slate-400 block mb-2.5">
            Or select your approximate budget to browse tailored options:
          </span>
          <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
            {budgetChips.map((amount) => (
              <button
                key={amount}
                onClick={() => {
                  onSelectBudget(amount);
                  onStartAIShopping(`My budget is ₹${amount.toLocaleString('en-IN')}`);
                }}
                className="px-4 py-2 rounded-xl bg-slate-900/90 hover:bg-cyan-950 border border-slate-800 hover:border-cyan-600/60 text-xs font-mono font-bold text-slate-200 hover:text-cyan-300 transition-all cursor-pointer shadow-sm"
              >
                ₹{amount.toLocaleString('en-IN')}
              </button>
            ))}
          </div>
        </div>

        {/* Primary and Secondary CTA Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <button
            onClick={() => onStartAIShopping()}
            className="px-8 py-3.5 bg-gradient-to-r from-cyan-400 to-indigo-500 hover:from-cyan-300 hover:to-indigo-400 text-slate-950 font-bold text-sm rounded-xl shadow-lg shadow-cyan-500/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2 cursor-pointer"
          >
            <Bot className="w-4 h-4 font-bold" />
            <span>Start Shopping With AI</span>
            <ArrowRight className="w-4 h-4 font-bold" />
          </button>

          <button
            onClick={onExploreCategories}
            className="px-6 py-3.5 bg-slate-900/90 hover:bg-slate-800 text-white font-semibold text-sm rounded-xl border border-slate-700/80 hover:border-slate-600 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Compass className="w-4 h-4 text-cyan-400" />
            <span>Explore Categories</span>
          </button>
        </div>
      </section>

      {/* 2. HOW IT WORKS SECTION */}
      <section className="space-y-8 max-w-5xl mx-auto">
        <div className="text-center space-y-2">
          <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest font-bold">
            Personalized Process
          </span>
          <h2 className="font-display font-bold text-2xl sm:text-3xl text-white">
            How SmartBuy AI Works
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
            Instead of searching through thousands of overpriced items, tell AI your budget and let it work for you.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { step: '01', title: 'Tell us your budget', desc: 'State ₹500, ₹2,000, ₹5,000 or custom spending limit.' },
            { step: '02', title: 'Tell us what you need', desc: 'Clothes, shoes, electronics, gifts, or groceries for any purpose.' },
            { step: '03', title: 'AI understands intent', desc: 'Extracts style, recipient, quality and nearby store options.' },
            { step: '04', title: 'Personalized recommendations', desc: 'Organized into Within Budget, Best Value, and Slightly Above.' },
            { step: '05', title: 'Choose product or store', desc: 'Buy online, visit nearby physical stores, or bargain with AI!' },
          ].map((item, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-[#0B0F19] border border-slate-800 shadow-xl space-y-2.5 flex flex-col justify-between"
            >
              <div>
                <span className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-800/80 text-cyan-400 font-mono font-bold text-xs flex items-center justify-center mb-3">
                  {item.step}
                </span>
                <h3 className="font-display font-bold text-sm text-white">
                  {item.title}
                </h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 3. TRUST & TRANSPARENCY SECTION */}
      <section className="rounded-3xl border border-slate-800 bg-[#090D16] p-8 sm:p-12 shadow-2xl space-y-6 max-w-5xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-800/60 text-cyan-400 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-display font-bold text-xl text-white">
              How Our AI Makes Recommendations
            </h2>
            <p className="text-xs text-slate-400">
              Clear, transparent rules. No hidden markups or fabricated discounts.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
            <h4 className="text-xs font-bold text-white font-mono uppercase flex items-center gap-1.5 text-cyan-300">
              <CheckCircle className="w-4 h-4 text-cyan-400" />
              <span>Budget Discipline First</span>
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              We never falsely claim an item is within budget. If an item is ₹300 higher, we explicitly highlight it and explain why.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
            <h4 className="text-xs font-bold text-white font-mono uppercase flex items-center gap-1.5 text-emerald-300">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>Real Verified Stores</span>
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Find physical stores nearby with real contact details, WhatsApp direct chat, directions, and in-store trial facilities.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
            <h4 className="text-xs font-bold text-white font-mono uppercase flex items-center gap-1.5 text-amber-300">
              <CheckCircle className="w-4 h-4 text-amber-400" />
              <span>Integrated AI Bargaining</span>
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Need a better price? Your Buyer Agent bargains directly with the store AI to lock in verified discounts before purchase.
            </p>
          </div>
        </div>
      </section>

      {/* 4. FINAL HOMEPAGE CTA */}
      <section className="text-center p-8 sm:p-12 rounded-3xl bg-gradient-to-b from-[#0E1626] to-[#080B12] border border-cyan-500/30 max-w-4xl mx-auto space-y-4 shadow-2xl">
        <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-white">
          Your Budget. Your Needs. Our AI.
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
          Tell us what you want and how much you want to spend. Let our AI help you discover suitable products and stores.
        </p>
        <div className="pt-2">
          <button
            onClick={() => onStartAIShopping()}
            className="px-8 py-3.5 bg-gradient-to-r from-cyan-400 to-indigo-500 hover:from-cyan-300 hover:to-indigo-400 text-slate-950 font-bold text-sm rounded-xl shadow-lg shadow-cyan-500/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0 inline-flex items-center gap-2 cursor-pointer"
          >
            <span>Start Shopping With AI</span>
            <ArrowRight className="w-4 h-4 font-bold" />
          </button>
        </div>
      </section>
    </div>
  );
};
