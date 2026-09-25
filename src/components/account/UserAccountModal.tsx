import React, { useState } from 'react';
import { Product, LocalStore } from '../../types';
import { User, X, Heart, Store, History, ShieldCheck, LogIn, Check } from 'lucide-react';

interface UserAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedProducts: Product[];
  savedStores: LocalStore[];
  recentSearches: string[];
  onSelectProduct: (p: Product) => void;
  onSelectSearch: (q: string) => void;
}

export const UserAccountModal: React.FC<UserAccountModalProps> = ({
  isOpen,
  onClose,
  savedProducts,
  savedStores,
  recentSearches,
  onSelectProduct,
  onSelectSearch,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'saved_products' | 'saved_stores' | 'history'>('saved_products');
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [userEmail, setUserEmail] = useState('shopper@smartbuy.ai');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-3xl bg-[#0B0F19] border border-cyan-500/30 p-6 shadow-2xl text-slate-100 max-h-[85vh] overflow-y-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-700 text-cyan-400 flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-bold text-base text-white">SmartBuy AI Member Account</h2>
              <p className="text-xs text-slate-400 font-mono">{userEmail} · Standard Buyer</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white">✕</button>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 rounded-xl border border-slate-800 text-xs font-mono">
          <button
            onClick={() => setActiveTab('saved_products')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'saved_products' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Saved Products ({savedProducts.length})
          </button>
          <button
            onClick={() => setActiveTab('saved_stores')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'saved_stores' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Saved Stores ({savedStores.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'history' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Recent AI Searches
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'saved_products' && (
          <div className="space-y-3">
            {savedProducts.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 font-mono">
                No saved products yet. Click the heart icon on any product to save it here.
              </div>
            ) : (
              savedProducts.map((p) => (
                <div
                  key={p.id}
                  className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={p.image}
                      alt={p.name}
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 rounded-lg object-cover bg-slate-800"
                    />
                    <div>
                      <h4 className="text-xs font-bold text-white line-clamp-1">{p.name}</h4>
                      <span className="text-[11px] font-mono text-emerald-400 font-bold">
                        ₹{p.listPrice.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      onClose();
                      onSelectProduct(p);
                    }}
                    className="px-3 py-1.5 bg-cyan-500 text-slate-950 font-bold text-xs rounded-lg"
                  >
                    Negotiate
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'saved_stores' && (
          <div className="space-y-3">
            {savedStores.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 font-mono">
                No saved local stores yet.
              </div>
            ) : (
              savedStores.map((s) => (
                <div key={s.id} className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex justify-between items-center">
                  <div>
                    <h4 className="text-xs font-bold text-white">{s.name}</h4>
                    <span className="text-[11px] text-slate-400">{s.category} · {s.distance}</span>
                  </div>
                  <span className="text-xs font-mono text-emerald-400">Verified</span>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-2">
            {recentSearches.map((q, idx) => (
              <button
                key={idx}
                onClick={() => {
                  onClose();
                  onSelectSearch(q);
                }}
                className="w-full text-left p-3 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-slate-800 text-xs font-mono text-slate-300 hover:text-cyan-300 flex items-center justify-between transition-colors cursor-pointer"
              >
                <span>"{q}"</span>
                <span className="text-[10px] text-slate-500">Re-run Search →</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
