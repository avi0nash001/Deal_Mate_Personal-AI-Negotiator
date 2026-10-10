import React from 'react';
import { X, PlusCircle, QrCode, Sparkles, ArrowRight, Camera } from 'lucide-react';

interface AddProductChoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectManual: () => void;
  onSelectScan: () => void;
}

export const AddProductChoiceModal: React.FC<AddProductChoiceModalProps> = ({
  isOpen,
  onClose,
  onSelectManual,
  onSelectScan,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-product-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-lg rounded-3xl bg-white border border-slate-200 shadow-2xl p-6 sm:p-7 space-y-6 text-slate-900">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="space-y-1.5 pr-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono font-bold uppercase">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Inventory Onboarding</span>
          </div>
          <h2
            id="add-product-dialog-title"
            className="text-xl sm:text-2xl font-display font-extrabold text-slate-900 tracking-tight"
          >
            Add Product to Store
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Select how you would like to register or update this item in your inventory catalogue.
          </p>
        </div>

        {/* Options Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Option 1: Manual Entry */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onSelectManual();
            }}
            className="group p-5 rounded-2xl border-2 border-slate-200 hover:border-emerald-500 bg-slate-50/70 hover:bg-emerald-50/40 text-left transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-3 shadow-xs hover:shadow-md"
          >
            <div className="space-y-2">
              <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                <PlusCircle className="w-6 h-6" />
              </div>
              <h3 className="font-display font-bold text-base text-slate-900 group-hover:text-emerald-950">
                Manual Entry
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Add title, brand, category, list MRP, custom seller floor price, stock count, and specifications manually.
              </p>
            </div>
            <div className="pt-2 flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-700 group-hover:text-emerald-800">
              <span>Enter Details</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* Option 2: Scan QR / Barcode */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onSelectScan();
            }}
            className="group p-5 rounded-2xl border-2 border-slate-200 hover:border-cyan-500 bg-slate-50/70 hover:bg-cyan-50/40 text-left transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-3 shadow-xs hover:shadow-md"
          >
            <div className="space-y-2">
              <div className="w-12 h-12 rounded-xl bg-cyan-600 text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                <QrCode className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-display font-bold text-base text-slate-900 group-hover:text-cyan-950">
                Scan QR / Barcode
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Scan existing shelf tag QR or barcode using your device camera, image file upload, or enter DealMate Product ID.
              </p>
            </div>
            <div className="pt-2 flex items-center gap-1.5 text-xs font-mono font-bold text-cyan-700 group-hover:text-cyan-800">
              <span>Launch Scanner</span>
              <Camera className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
            </div>
          </button>
        </div>

        {/* Footer Note */}
        <div className="pt-2 border-t border-slate-200 text-center">
          <p className="text-[11px] font-mono text-slate-500">
            Every product automatically receives a persistent DealMate QR code for shelf tags and immediate AI Deal Analyzer indexing.
          </p>
        </div>
      </div>
    </div>
  );
};
