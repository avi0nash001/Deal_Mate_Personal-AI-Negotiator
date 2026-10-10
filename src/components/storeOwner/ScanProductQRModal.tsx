import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Camera,
  CameraOff,
  QrCode,
  Upload,
  Search,
  CheckCircle2,
  AlertCircle,
  Package,
  Plus,
  RefreshCw,
  Edit2,
  Check,
  Sparkles,
} from 'lucide-react';
import { Product } from '../../types';
import { extractDealMateProductId, ensureDealMateProductId } from '../../utils/productIdentifier';

interface ScanProductQRModalProps {
  existingProducts: Product[];
  onUpdateProductStock?: (productId: string, newStock: number) => void;
  onUpdateProductPrice?: (productId: string, newPrice: number) => void;
  onUpdateStoreProduct?: (updatedProduct: Product) => void;
  onAddStoreProduct: (newProduct: Product) => void;
  onOpenManualAddWithPrefill?: (prefill: Partial<Product>) => void;
  onClose: () => void;
}

export const ScanProductQRModal: React.FC<ScanProductQRModalProps> = ({
  existingProducts,
  onUpdateProductStock,
  onUpdateProductPrice,
  onUpdateStoreProduct,
  onAddStoreProduct,
  onOpenManualAddWithPrefill,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'camera' | 'manual' | 'upload'>('camera');
  const [manualInput, setManualInput] = useState<string>('');
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Scanned product match state
  const [scannedId, setScannedId] = useState<string | null>(null);
  const [matchedProduct, setMatchedProduct] = useState<Product | null>(null);
  const [notFoundId, setNotFoundId] = useState<string | null>(null);

  // Edit fields for matched product
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editStock, setEditStock] = useState<number>(0);
  const [stockAdjustment, setStockAdjustment] = useState<number>(0);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Camera API not available in this browser environment');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      setCameraActive(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      }, 100);
    } catch (err: unknown) {
      setCameraError(
        'Camera access unavailable or blocked. Use manual ID entry or image upload below!'
      );
      setCameraActive(false);
      setActiveTab('manual');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const handleLookupId = (rawId: string) => {
    const extracted = extractDealMateProductId(rawId);
    if (!extracted) {
      setCameraError(`Could not detect a valid Product ID in "${rawId}".`);
      return;
    }

    setScannedId(extracted);
    setSuccessMessage(null);

    // Search existing product data
    const normalizedTarget = extracted.toUpperCase();
    const found = existingProducts.find((p) => {
      const pId = ensureDealMateProductId(p).toUpperCase();
      return (
        pId === normalizedTarget ||
        p.id.toUpperCase() === normalizedTarget ||
        p.dealMateProductId?.toUpperCase() === normalizedTarget ||
        p.sku?.toUpperCase() === normalizedTarget ||
        p.qrCodeData?.toUpperCase().includes(normalizedTarget)
      );
    });

    if (found) {
      setMatchedProduct(found);
      setEditPrice(found.listPrice);
      setEditStock(found.stock);
      setStockAdjustment(0);
      setNotFoundId(null);
    } else {
      setMatchedProduct(null);
      setNotFoundId(extracted);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Simulate / decode QR from image
    const reader = new FileReader();
    reader.onload = () => {
      // Look for first product ID as fallback or simulate recognition
      const sample = existingProducts[0]
        ? ensureDealMateProductId(existingProducts[0])
        : 'DM-PROD-000101';
      handleLookupId(sample);
    };
    reader.readAsDataURL(file);
  };

  const handleConfirmUpdate = () => {
    if (!matchedProduct) return;

    const finalStock = Math.max(0, editStock + stockAdjustment);
    const finalPrice = Math.max(1, editPrice);

    onUpdateProductPrice?.(matchedProduct.id, finalPrice);
    onUpdateProductStock?.(matchedProduct.id, finalStock);

    const updated: Product = {
      ...matchedProduct,
      listPrice: finalPrice,
      stock: finalStock,
      availabilityStatus: finalStock === 0 ? 'out_of_stock' : finalStock < 5 ? 'low_stock' : 'in_stock',
    };
    onUpdateStoreProduct?.(updated);

    setMatchedProduct(updated);
    setEditStock(finalStock);
    setStockAdjustment(0);
    setSuccessMessage(
      `Inventory for "${updated.name}" updated! Stock: ${finalStock} units · Price: ₹${finalPrice.toLocaleString(
        'en-IN'
      )}`
    );
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto"
    >
      <div className="relative w-full max-w-xl my-8 rounded-3xl bg-surface border border-[var(--border)] shadow-2xl p-6 sm:p-7 text-[var(--text-primary)] space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-cyan-50 dark:bg-cyan-950/50 text-cyan-600 dark:text-cyan-400">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg">📷 Scan QR / Barcode</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Identify DealMate Product ID & update store inventory
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher: Camera / Manual ID / Upload Image */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
          <button
            type="button"
            onClick={() => {
              setActiveTab('camera');
              if (!cameraActive) startCamera();
            }}
            className={`flex-1 py-1.5 px-3 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'camera'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Camera Scanner</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('manual');
              stopCamera();
            }}
            className={`flex-1 py-1.5 px-3 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'manual'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Type / Paste ID</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('upload');
              stopCamera();
            }}
            className={`flex-1 py-1.5 px-3 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'upload'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Image</span>
          </button>
        </div>

        {/* Camera Scanner View */}
        {activeTab === 'camera' && (
          <div className="space-y-3">
            <div className="relative h-56 rounded-2xl overflow-hidden bg-slate-950 flex flex-col items-center justify-center border border-slate-800">
              {cameraActive ? (
                <>
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    playsInline
                    muted
                  />
                  {/* Scanner overlay target frame */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-48 h-48 border-2 border-emerald-400/80 rounded-2xl relative shadow-[0_0_20px_rgba(16,185,129,0.3)] animate-pulse">
                      <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-emerald-400" />
                      <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-emerald-400" />
                      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-emerald-400" />
                      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-emerald-400" />
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-4 text-center space-y-2">
                  <CameraOff className="w-8 h-8 text-slate-500 mx-auto" />
                  <p className="text-xs text-slate-400">Camera preview inactive or blocked</p>
                  <button
                    type="button"
                    onClick={startCamera}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-xs"
                  >
                    Retry Camera
                  </button>
                </div>
              )}
            </div>

            {/* Quick scan trigger for existing inventory test */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 text-xs">
              <div className="text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
                <span>Simulate / 1-Click Test Scan from Your Inventory:</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {existingProducts.slice(0, 3).map((item) => {
                  const pid = ensureDealMateProductId(item);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleLookupId(pid)}
                      className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-200 text-[11px] font-mono hover:border-emerald-500 cursor-pointer"
                    >
                      {pid} ({item.name.slice(0, 16)}...)
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Manual ID Input View */}
        {activeTab === 'manual' && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Type or Paste DealMate Product ID
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  placeholder="e.g. DM-PROD-000127"
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-xs text-slate-900 dark:text-white uppercase focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => handleLookupId(manualInput)}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer shadow-xs"
                >
                  Lookup ID
                </button>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 text-xs">
              <span className="text-[11px] font-mono text-slate-500">Quick Picks:</span>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {existingProducts.slice(0, 4).map((p) => {
                  const pid = ensureDealMateProductId(p);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setManualInput(pid);
                        handleLookupId(pid);
                      }}
                      className="px-2 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 font-mono text-[10px] text-slate-700 dark:text-slate-300 hover:text-emerald-500 cursor-pointer"
                    >
                      {pid}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Image Upload View */}
        {activeTab === 'upload' && (
          <div className="space-y-3">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              className="p-8 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 bg-slate-50 dark:bg-slate-800/40 text-center cursor-pointer space-y-2 transition-colors"
            >
              <Upload className="w-8 h-8 text-emerald-500 mx-auto" />
              <div className="text-xs font-bold">Upload QR Code or Barcode Image</div>
              <p className="text-[11px] text-slate-500">PNG, JPG, or screenshot of shelf label</p>
            </div>
          </div>
        )}

        {/* Success Confirmation Toast */}
        {successMessage && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 flex items-center gap-2.5 text-xs font-bold animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Product Search & Match Result */}
        {matchedProduct && (
          <div className="p-4 rounded-2xl border border-emerald-300/80 dark:border-emerald-700/80 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-emerald-200 dark:border-emerald-800 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded-lg bg-emerald-600 text-white">
                  <Check className="w-3.5 h-3.5" />
                </span>
                <span className="font-display font-bold text-xs text-emerald-950 dark:text-emerald-100">
                  Product Identified in Store Inventory
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full font-mono font-extrabold text-[11px] bg-emerald-100 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-100 border border-emerald-300 dark:border-emerald-700">
                {ensureDealMateProductId(matchedProduct)}
              </span>
            </div>

            <div className="flex items-start gap-3">
              <img
                src={matchedProduct.image}
                alt={matchedProduct.name}
                referrerPolicy="no-referrer"
                className="w-16 h-16 rounded-xl object-cover bg-white dark:bg-slate-900 border shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="font-display font-bold text-xs truncate">
                  {matchedProduct.name}
                </div>
                <div className="text-[11px] text-slate-500 font-mono">
                  {matchedProduct.brand} · {matchedProduct.category}
                </div>
                <div className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400 font-bold mt-1">
                  Current: ₹{matchedProduct.listPrice.toLocaleString('en-IN')} · Stock:{' '}
                  {matchedProduct.stock} units
                </div>
              </div>
            </div>

            {/* Quick Adjustment Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Selling Price (₹)
                </label>
                <input
                  type="number"
                  min={1}
                  value={editPrice}
                  onChange={(e) => setEditPrice(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 font-mono font-bold bg-white dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Stock Units (Current: {matchedProduct.stock})
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min={0}
                    value={editStock + stockAdjustment}
                    onChange={(e) => {
                      setEditStock(Number(e.target.value));
                      setStockAdjustment(0);
                    }}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 font-mono font-bold bg-white dark:bg-slate-800"
                  />
                  <button
                    type="button"
                    onClick={() => setStockAdjustment((prev) => prev + 5)}
                    className="px-2 py-1.5 rounded-xl bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-900/60 dark:hover:bg-emerald-900 text-emerald-800 dark:text-emerald-200 font-mono font-bold text-xs whitespace-nowrap cursor-pointer"
                  >
                    +5
                  </button>
                  <button
                    type="button"
                    onClick={() => setStockAdjustment((prev) => prev + 10)}
                    className="px-2 py-1.5 rounded-xl bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-900/60 dark:hover:bg-emerald-900 text-emerald-800 dark:text-emerald-200 font-mono font-bold text-xs whitespace-nowrap cursor-pointer"
                  >
                    +10
                  </button>
                </div>
              </div>
            </div>

            {/* Confirm & Save Button */}
            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={handleConfirmUpdate}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-colors"
              >
                <Check className="w-4 h-4" />
                <span>Confirm & Update Inventory</span>
              </button>
            </div>
          </div>
        )}

        {/* Product Not Found in Inventory */}
        {notFoundId && (
          <div className="p-4 rounded-2xl border border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/20 text-xs space-y-3">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200 font-bold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>
                Product ID "{notFoundId}" is not yet registered in this store's inventory.
              </span>
            </div>
            <p className="text-slate-600 dark:text-slate-400">
              Would you like to register a new product under this DealMate Product ID?
            </p>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenManualAddWithPrefill?.({ dealMateProductId: notFoundId });
              }}
              className="py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add New Product With ID {notFoundId}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
