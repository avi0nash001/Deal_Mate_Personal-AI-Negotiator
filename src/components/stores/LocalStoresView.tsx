import React, { useState } from 'react';
import { LocalStore } from '../../types';
import {
  MapPin,
  Phone,
  MessageSquare,
  Navigation,
  Clock,
  Star,
  CheckCircle,
  ExternalLink,
  Store,
  Compass
} from 'lucide-react';

interface LocalStoresViewProps {
  stores: LocalStore[];
  onSelectStoreProducts: (category: string) => void;
}

export const LocalStoresView: React.FC<LocalStoresViewProps> = ({
  stores,
  onSelectStoreProducts,
}) => {
  const [selectedStore, setSelectedStore] = useState<LocalStore | null>(null);

  const handleWhatsApp = (whatsappNumber: string, storeName: string) => {
    const text = encodeURIComponent(`Hi ${storeName}, I saw your products on SmartBuy AI. Is in-store pickup available today?`);
    window.open(`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${text}`, '_blank');
  };

  const handleDirections = (address: string) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-950/40 via-[#0B1516] to-[#0A0E18] border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 flex items-center justify-center">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-display font-bold text-lg text-white">
              Local Physical Store Discovery
            </h2>
            <p className="text-xs text-slate-400">
              Find verified neighborhood retail merchants with in-store trial, WhatsApp ordering, and direct pickup.
            </p>
          </div>
        </div>

        <div className="text-xs font-mono text-emerald-400 flex items-center gap-1.5">
          <MapPin className="w-4 h-4" />
          <span>Bengaluru Central & Metro Districts</span>
        </div>
      </div>

      {/* Stores Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {stores.map((store) => (
          <div
            key={store.id}
            className="p-5 rounded-2xl bg-[#0B0F19] border border-slate-800 hover:border-emerald-500/40 transition-all shadow-xl space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-3">
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold block mb-0.5">
                    {store.category}
                  </span>
                  <h3 className="font-display font-bold text-base text-white">
                    {store.name}
                  </h3>
                </div>

                <div className="text-right shrink-0">
                  <div className="flex items-center gap-1 text-amber-400 text-xs justify-end">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span className="font-bold text-white">{store.rating}</span>
                    <span className="text-slate-500">({store.reviewsCount})</span>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-400 font-semibold block mt-0.5">
                    {store.distance}
                  </span>
                </div>
              </div>

              {/* Address and Hours */}
              <div className="space-y-1.5 text-xs text-slate-300">
                <div className="flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span className="text-slate-400">{store.address}</span>
                </div>
                <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{store.openingHours}</span>
                </div>
              </div>

              {/* Services Tags */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                {store.services.map((svc, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800"
                  >
                    ✓ {svc}
                  </span>
                ))}
              </div>
            </div>

            {/* Direct Action Buttons: Call, WhatsApp, Directions, View */}
            <div className="pt-3 border-t border-slate-800 grid grid-cols-4 gap-2">
              <a
                href={`tel:${store.phone}`}
                className="py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-mono text-slate-300 hover:text-white flex items-center justify-center gap-1 transition-colors"
                title="Call store"
              >
                <Phone className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">Call</span>
              </a>

              <button
                onClick={() => handleWhatsApp(store.whatsapp, store.name)}
                className="py-2 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-800/80 text-xs font-mono text-emerald-300 flex items-center justify-center gap-1 transition-colors cursor-pointer"
                title="WhatsApp direct chat"
              >
                <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">WhatsApp</span>
              </button>

              <button
                onClick={() => handleDirections(store.address)}
                className="py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-mono text-slate-300 hover:text-white flex items-center justify-center gap-1 transition-colors cursor-pointer"
                title="Directions on Google Maps"
              >
                <Navigation className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden sm:inline">Maps</span>
              </button>

              <button
                onClick={() => setSelectedStore(store)}
                className="py-2 rounded-xl bg-cyan-950/80 hover:bg-cyan-900/80 border border-cyan-800/80 text-xs font-mono text-cyan-300 flex items-center justify-center gap-1 transition-colors cursor-pointer font-semibold"
              >
                <span>Details</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Store Detail Modal */}
      {selectedStore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-lg rounded-3xl bg-[#0C121F] border border-emerald-500/40 p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold">{selectedStore.category}</span>
                <h3 className="font-display font-bold text-lg text-white">{selectedStore.name}</h3>
              </div>
              <button
                onClick={() => setSelectedStore(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs text-slate-300">
              <p><strong className="text-white">Address:</strong> {selectedStore.address}</p>
              <p><strong className="text-white">Hours:</strong> {selectedStore.openingHours}</p>
              <p><strong className="text-white">Phone:</strong> {selectedStore.phone}</p>
            </div>

            <div>
              <h4 className="text-xs font-mono uppercase text-slate-400 mb-2">Featured In-Store Items:</h4>
              <div className="flex items-center gap-1.5 flex-wrap">
                {selectedStore.featuredProducts.map((p, idx) => (
                  <span key={idx} className="text-xs px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-cyan-300">
                    {p}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-4 flex gap-3">
              <button
                onClick={() => handleDirections(selectedStore.address)}
                className="flex-1 py-2.5 bg-gradient-to-r from-emerald-400 to-teal-400 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5"
              >
                <Navigation className="w-4 h-4" />
                <span>Open in Google Maps</span>
              </button>

              <button
                onClick={() => {
                  setSelectedStore(null);
                  onSelectStoreProducts(selectedStore.category);
                }}
                className="px-4 py-2.5 bg-slate-800 text-white text-xs rounded-xl"
              >
                Browse Items
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
