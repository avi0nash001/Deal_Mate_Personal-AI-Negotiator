import React, { useState } from 'react';
import {
  X,
  Package,
  Plus,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Image,
  Tag,
  DollarSign,
  Layers,
  FileText,
} from 'lucide-react';
import { Product, CategoryNegotiationSetting } from '../../types';
import { generateDealMateProductId } from '../../utils/productIdentifier';

interface AddProductManualModalProps {
  existingProducts: Product[];
  sellerId: string;
  sellerName: string;
  storeAddress: string;
  categorySettings: CategoryNegotiationSetting[];
  onAddProduct: (product: Product) => Promise<void> | void;
  onClose: () => void;
  initialPrefill?: Partial<Product>;
}

const CATEGORY_OPTIONS = [
  'Electronics',
  'Fashion',
  'Footwear',
  'Grocery',
  'Home',
  'Beauty',
  'Gifts',
  'Accessories',
];

export const AddProductManualModal: React.FC<AddProductManualModalProps> = ({
  existingProducts,
  sellerId,
  sellerName,
  storeAddress,
  categorySettings,
  onAddProduct,
  onClose,
  initialPrefill,
}) => {
  // Pre-generate unique persistent DealMate Product ID
  const defaultDealMateId =
    initialPrefill?.dealMateProductId || generateDealMateProductId(existingProducts);

  const [dealMateId] = useState<string>(defaultDealMateId);
  const [name, setName] = useState<string>(initialPrefill?.name || '');
  const [brand, setBrand] = useState<string>(initialPrefill?.brand || '');
  const [category, setCategory] = useState<string>(
    initialPrefill?.category || CATEGORY_OPTIONS[0]
  );
  const [description, setDescription] = useState<string>(
    initialPrefill?.description ||
      'Verified store product ready for instant AI negotiation and store pickup.'
  );
  const [imageUrl, setImageUrl] = useState<string>(
    initialPrefill?.image ||
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80'
  );
  const [mrp, setMrp] = useState<number>(initialPrefill?.marketPrice || 2999);
  const [sellingPrice, setSellingPrice] = useState<number>(
    initialPrefill?.listPrice || 2499
  );
  const [stock, setStock] = useState<number>(initialPrefill?.stock ?? 20);
  const [sku, setSku] = useState<string>(
    initialPrefill?.sku || `SKU-${Math.floor(1000 + Math.random() * 9000)}`
  );
  const [discount, setDiscount] = useState<number>(
    initialPrefill?.discount ||
      (mrp > sellingPrice ? Math.round(((mrp - sellingPrice) / mrp) * 100) : 0)
  );
  const [availabilityStatus, setAvailabilityStatus] = useState<
    'in_stock' | 'low_stock' | 'out_of_stock'
  >(initialPrefill?.availabilityStatus || 'in_stock');
  const [specsText, setSpecsText] = useState<string>(
    initialPrefill?.specs
      ? Object.entries(initialPrefill.specs)
          .map(([k, v]) => `${k}: ${v}`)
          .join('\n')
      : 'Warranty: 1 Year Official\nOrigin: Genuine Store Stock\nCondition: Brand New Sealed'
  );

  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successProduct, setSuccessProduct] = useState<Product | null>(null);

  // Get category floor settings
  const catSetting = categorySettings.find(
    (s) =>
      s.sellerId === sellerId && s.category.toLowerCase() === category.toLowerCase()
  );
  const maxSingleDiscountPct = catSetting?.maxSingleDiscountPct ?? 15;
  const floorPrice = Math.round(sellingPrice * (1 - maxSingleDiscountPct / 100));

  const handlePriceChange = (newSellingPrice: number) => {
    setSellingPrice(newSellingPrice);
    if (mrp > newSellingPrice) {
      setDiscount(Math.round(((mrp - newSellingPrice) / mrp) * 100));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // 1. Validate the information
    if (!name.trim()) {
      setValidationError('Product Name is required.');
      return;
    }
    if (sellingPrice <= 0) {
      setValidationError('Selling Price must be greater than 0.');
      return;
    }
    if (mrp < sellingPrice) {
      setValidationError('MRP / Original Price should be greater than or equal to Selling Price.');
      return;
    }
    if (stock < 0) {
      setValidationError('Available Stock cannot be negative.');
      return;
    }

    // Parse specifications
    const parsedSpecs: Record<string, string> = {
      'DealMate ID': dealMateId,
      SKU: sku.trim(),
      'Listed By': sellerName,
    };
    specsText.split('\n').forEach((line) => {
      const parts = line.split(':');
      if (parts.length >= 2) {
        const k = parts[0].trim();
        const v = parts.slice(1).join(':').trim();
        if (k && v) parsedSpecs[k] = v;
      }
    });

    const newProduct: Product = {
      id: `store_${dealMateId.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now().toString(36)}`,
      dealMateProductId: dealMateId,
      sku: sku.trim(),
      name: name.trim(),
      brand: brand.trim() || sellerName,
      category: category.trim(),
      purpose: ['Store Direct', 'Everyday', 'Essential'],
      rating: 4.9,
      reviewsCount: 1,
      listPrice: sellingPrice,
      marketPrice: Math.max(mrp, sellingPrice),
      minAcceptablePrice: floorPrice,
      maxDiscountPercent: maxSingleDiscountPct,
      stock,
      availabilityStatus,
      discount: discount > 0 ? discount : undefined,
      sellerId,
      sellerName,
      sellerRating: 4.9,
      isLocalStore: true,
      isStoreOwnerListed: true,
      marketplaceSource: 'Store Owner QR Verified',
      qrCodeData: dealMateId, // The QR code strictly encodes the unique Product ID
      storeDistance: '1.2 km away',
      storeAddress,
      image:
        imageUrl.trim() ||
        'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80',
      description: description.trim(),
      specs: parsedSpecs,
      isNegotiable: true,
      bundleEligible: true,
      deliveryDays: 1,
      aiMatchScore: 99,
      whyRecommended: `Listed directly by verified store owner (${sellerName}). Supports instant AI bargaining!`,
    };

    setIsSubmitting(true);
    try {
      await onAddProduct(newProduct);
      setSuccessProduct(newProduct);
    } catch (err) {
      setValidationError('Failed to save product. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto"
    >
      <div className="relative w-full max-w-2xl my-8 rounded-3xl bg-surface border border-[var(--border)] shadow-2xl p-6 sm:p-7 text-[var(--text-primary)] space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg">📝 Add Product Manually</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Register a new inventory item with persistent DealMate Product ID
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Confirmation State */}
        {successProduct ? (
          <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-center space-y-4 animate-in zoom-in-95">
            <div className="w-14 h-14 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-lg">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h4 className="font-display font-bold text-lg text-emerald-950 dark:text-emerald-100">
                Product Published Successfully!
              </h4>
              <p className="text-xs text-emerald-800 dark:text-emerald-300 max-w-md mx-auto">
                <strong>{successProduct.name}</strong> is now live in your store inventory,
                indexed in Shopper Search, and ready for autonomous AI bargaining.
              </p>
            </div>

            <div className="inline-flex items-center gap-2 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 font-mono text-xs font-bold text-emerald-700 dark:text-emerald-300">
              <span>Unique Product ID:</span>
              <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-100">
                {successProduct.dealMateProductId}
              </span>
            </div>

            <div className="pt-2 flex justify-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md cursor-pointer transition-colors"
              >
                Done & Return to Inventory
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {validationError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            {/* Persistent ID Preview */}
            <div className="p-3 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-[10px] font-mono text-indigo-700 dark:text-indigo-300 uppercase font-bold">
                  Assigned DealMate Product ID:
                </span>
                <div className="font-mono text-sm font-extrabold text-indigo-950 dark:text-indigo-100">
                  {dealMateId}
                </div>
              </div>
              <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                Persistent across price and stock updates
              </span>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Nike Revolution 7 Running Shoes"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                  Brand *
                </label>
                <input
                  type="text"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="e.g. Nike / Store Brand"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                  Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  {CATEGORY_OPTIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Pricing & Stock */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                  MRP / Orig Price (₹) *
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={mrp}
                  onChange={(e) => setMrp(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                  Selling Price (₹) *
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={sellingPrice}
                  onChange={(e) => handlePriceChange(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-extrabold text-emerald-600 dark:text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                  Stock Units *
                </label>
                <input
                  type="number"
                  min={0}
                  required
                  value={stock}
                  onChange={(e) => setStock(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                  SKU / Internal ID
                </label>
                <input
                  type="text"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="SKU-1029"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Discount & Availability */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                  Discount (Optional %)
                </label>
                <input
                  type="number"
                  min={0}
                  max={90}
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                  Availability Status
                </label>
                <select
                  value={availabilityStatus}
                  onChange={(e) =>
                    setAvailabilityStatus(e.target.value as 'in_stock' | 'low_stock' | 'out_of_stock')
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  <option value="in_stock">In Stock (Available)</option>
                  <option value="low_stock">Low Stock</option>
                  <option value="out_of_stock">Out of Stock</option>
                </select>
              </div>
            </div>

            {/* Image URL & Description */}
            <div>
              <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                Product Image URL
              </label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-[11px] focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                Product Description
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe key features, sizing, warranty..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Specifications */}
            <div>
              <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                Specifications (Key: Value per line)
              </label>
              <textarea
                rows={3}
                value={specsText}
                onChange={(e) => setSpecsText(e.target.value)}
                placeholder="Warranty: 1 Year&#10;Color: Black&#10;Material: Breathable Mesh"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-[11px] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* AI Floor Protection Notice */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-[11px] font-mono">
              <span className="text-slate-600 dark:text-slate-400">
                AI Bottom Line Floor ({category}: max {maxSingleDiscountPct}% off):
              </span>
              <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                ₹{floorPrice.toLocaleString('en-IN')}
              </span>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-2 cursor-pointer shadow-md transition-colors disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                <span>{isSubmitting ? 'Saving...' : 'Add to Inventory'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
