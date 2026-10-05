import React, { useState, useEffect, useRef } from 'react';
import { LocalStore } from '../../types';
import { MAPS_STORE_PRESETS } from '../ai/SearchQuickStartDropdown';
import {
  MapPin,
  Phone,
  MessageSquare,
  Navigation,
  Clock,
  Star,
  Store,
  Search,
  Sparkles,
  ExternalLink,
  Compass,
  Loader2,
} from 'lucide-react';

interface LocalStoresViewProps {
  stores: LocalStore[];
  onSelectStoreProducts: (category: string) => void;
}

interface MapsGroundingPlace {
  title: string;
  uri: string;
  reviewSnippets?: string[];
}

export const LocalStoresView: React.FC<LocalStoresViewProps> = ({
  stores,
  onSelectStoreProducts,
}) => {
  const [selectedStore, setSelectedStore] = useState<LocalStore | null>(null);
  const [mapsQuery, setMapsQuery] = useState<string>('Best electronics & fashion retail stores in Indiranagar Bengaluru');
  const [mapsLoading, setMapsLoading] = useState<boolean>(false);
  const [mapsAiSummary, setMapsAiSummary] = useState<string | null>(null);
  const [mapsPlaces, setMapsPlaces] = useState<MapsGroundingPlace[]>([]);
  const [mapsError, setMapsError] = useState<string | null>(null);
  const hasAutoQueriedRef = useRef<boolean>(false);

  const handleWhatsApp = (whatsappNumber: string, storeName: string) => {
    const text = encodeURIComponent(
      `Hi ${storeName}, I saw your products on DealMate AI. Is in-store pickup available today?`
    );
    window.open(`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${text}`, '_blank');
  };

  const handleDirections = (address: string) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
    window.open(url, '_blank');
  };

  const executeGoogleMapsSearch = async (
    useGeolocation: boolean = false,
    overrideQuery?: string
  ) => {
    const targetQuery = (overrideQuery ?? mapsQuery).trim();
    if (!targetQuery) return;
    if (overrideQuery) setMapsQuery(overrideQuery);
    setMapsLoading(true);
    setMapsError(null);

    let latitude: number | undefined;
    let longitude: number | undefined;

    if (useGeolocation && typeof navigator !== 'undefined' && navigator.geolocation) {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
        });
        latitude = pos.coords.latitude;
        longitude = pos.coords.longitude;
      } catch {
        // Fallback to query location if geolocation denied
      }
    }

    try {
      const response = await fetch('/api/gemini/maps-grounding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: targetQuery,
          latitude,
          longitude,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to query Google Maps grounding.');
      }
      setMapsAiSummary(data.text || '');
      setMapsPlaces(Array.isArray(data.places) ? data.places : []);
    } catch (err: any) {
      setMapsError(err?.message || 'Unable to reach Google Maps Grounding service.');
    } finally {
      setMapsLoading(false);
    }
  };

  useEffect(() => {
    if (!hasAutoQueriedRef.current) {
      hasAutoQueriedRef.current = true;
      executeGoogleMapsSearch(false);
    }
  }, []);

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-950/90 via-slate-900 to-slate-950 border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl text-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 flex items-center justify-center shrink-0">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-display font-bold text-lg text-white">
              Local Physical Store Discovery & Google Maps Grounding
            </h2>
            <p className="text-xs text-slate-300">
              Find verified neighborhood retail merchants with live Google Maps grounding, WhatsApp ordering, and direct pickup.
            </p>
          </div>
        </div>

        <div className="text-xs font-mono text-emerald-400 flex items-center gap-1.5 shrink-0">
          <MapPin className="w-4 h-4" />
          <span>Live Google Maps Connected</span>
        </div>
      </div>

      {/* Live Google Maps Grounding Search Box (gemini-3.8-flash + googleMaps) */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-blue-600" />
            <h3 className="font-display font-bold text-base text-slate-900">
              Live Google Maps Store Finder (Powered by Gemini Maps Grounding)
            </h3>
          </div>
          <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full font-bold">
            Real-Time Google Maps Data
          </span>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={mapsQuery}
              onChange={(e) => setMapsQuery(e.target.value)}
              placeholder="Search any store type or city (e.g. Sneaker stores in Koramangala Bengaluru)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
            />
          </div>
          <button
            type="button"
            onClick={() => executeGoogleMapsSearch(false)}
            disabled={mapsLoading}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm shrink-0"
          >
            {mapsLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Searching Google Maps...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Search Google Maps</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => executeGoogleMapsSearch(true)}
            disabled={mapsLoading}
            className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 font-mono text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
          >
            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
            <span>Near My GPS</span>
          </button>
        </div>

        {/* 1-Click Popular Store Category Presets */}
        <div className="flex items-center gap-1.5 flex-wrap pt-1">
          <span className="text-[11px] font-medium text-slate-500 mr-1">
            Popular Store Categories:
          </span>
          {MAPS_STORE_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => executeGoogleMapsSearch(false, preset.mapsQuery)}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-xs text-slate-700 hover:text-blue-700 transition-colors cursor-pointer"
            >
              {preset.category} · {preset.locality}
            </button>
          ))}
        </div>

        {mapsError && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
            {mapsError}
          </div>
        )}

        {mapsAiSummary && (
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
            <div className="text-xs text-slate-800 whitespace-pre-line leading-relaxed">
              {mapsAiSummary}
            </div>

            {mapsPlaces.length > 0 && (
              <div className="pt-3 border-t border-slate-200 space-y-2">
                <div className="text-[11px] font-mono uppercase text-slate-500 font-bold">
                  Verified Google Maps Places & Review Snippets:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {mapsPlaces.map((place, idx) => (
                    <a
                      key={idx}
                      href={place.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 rounded-xl bg-white border border-slate-200 hover:border-blue-400 transition-all flex flex-col justify-between gap-1.5 group shadow-2xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-blue-700 group-hover:underline flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{place.title}</span>
                        </span>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 shrink-0" />
                      </div>
                      {place.reviewSnippets && place.reviewSnippets.length > 0 && (
                        <p className="text-[11px] text-slate-500 italic line-clamp-2">
                          "{place.reviewSnippets[0]}"
                        </p>
                      )}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Partner Stores Grid */}
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
                <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold">
                  {selectedStore.category}
                </span>
                <h3 className="font-display font-bold text-lg text-white">{selectedStore.name}</h3>
              </div>
              <button
                onClick={() => setSelectedStore(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs text-slate-300">
              <p>
                <strong className="text-white">Address:</strong> {selectedStore.address}
              </p>
              <p>
                <strong className="text-white">Hours:</strong> {selectedStore.openingHours}
              </p>
              <p>
                <strong className="text-white">Phone:</strong> {selectedStore.phone}
              </p>
            </div>

            <div>
              <h4 className="text-xs font-mono uppercase text-slate-400 mb-2">
                Featured In-Store Items:
              </h4>
              <div className="flex items-center gap-1.5 flex-wrap">
                {selectedStore.featuredProducts.map((p, idx) => (
                  <span
                    key={idx}
                    className="text-xs px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-cyan-300"
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-4 flex gap-3">
              <button
                onClick={() => handleDirections(selectedStore.address)}
                className="flex-1 py-2.5 bg-gradient-to-r from-emerald-400 to-teal-400 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Navigation className="w-4 h-4" />
                <span>Open in Google Maps</span>
              </button>

              <button
                onClick={() => {
                  setSelectedStore(null);
                  onSelectStoreProducts(selectedStore.category);
                }}
                className="px-4 py-2.5 bg-slate-800 text-white text-xs rounded-xl cursor-pointer"
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
