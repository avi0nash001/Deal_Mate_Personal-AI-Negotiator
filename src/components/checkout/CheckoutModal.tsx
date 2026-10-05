import React, { useState } from 'react';
import {
  Product,
  DealToken,
  Order,
  CategoryNegotiationSetting,
} from '../../types';
import {
  resolveCategorySetting,
  priceFloor,
  MAX_SINGLE_ITEM_DISCOUNT,
} from '../../services/negotiationEngine';
import { getAuthHeaders } from '../../services/authHeaders';
import {
  X,
  ShieldCheck,
  Lock,
  Truck,
  CreditCard,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  dealToken: DealToken;
  categorySettings?: CategoryNegotiationSetting[];
  onOrderConfirmed: (order: Order) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  product,
  dealToken,
  categorySettings = [],
  onOrderConfirmed,
}) => {
  const [quantity, setQuantity] = useState<number>(1);
  const [fullName, setFullName] = useState('Aarav Sharma');
  const [phone, setPhone] = useState('+91 98765 43210');
  const [address, setAddress] = useState('402 Silicon Heights, Outer Ring Road');
  const [city, setCity] = useState('Bengaluru');
  const [postalCode, setPostalCode] = useState('560103');
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'CREDIT_CARD' | 'COD'>('UPI');
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  if (!isOpen) return null;

  const matchedSetting = resolveCategorySetting(product, categorySettings);
  const maxSingleDiscountPct =
    matchedSetting?.maxSingleDiscountPct ??
    product.maxDiscountPercent ??
    MAX_SINGLE_ITEM_DISCOUNT;
  const maxBundleDiscountPct = matchedSetting?.maxBundleDiscountPct ?? 20;
  const isBundle = quantity > 1 && product.bundleEligible;
  const effectiveFloor = priceFloor(
    product.listPrice,
    isBundle ? maxBundleDiscountPct : maxSingleDiscountPct,
    isBundle
  );

  const unitPrice = dealToken.finalPrice;
  const totalPaid = unitPrice * quantity;
  const totalSaved = Math.max(0, (dealToken.originalPrice - unitPrice) * quantity);

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setOrderError(null);
    setIsProcessing(true);

    try {
      // Server-side place_order verification against category_negotiation_settings floor
      const res = await fetch('/api/orders/place-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          product,
          unitPrice,
          quantity,
          maxSingleDiscountPct,
          maxBundleDiscountPct,
          isBundle,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.verified) {
        setOrderError(
          data.error ||
            `Order rejected: unitPrice ₹${unitPrice} is below the store category floor of ₹${effectiveFloor}.`
        );
        setIsProcessing(false);
        return;
      }

      const orderId = 'ORD-' + Math.random().toString(36).substring(2, 8).toUpperCase();
      const order: Order = {
        id: orderId,
        dealToken,
        product,
        quantity: data.quantity || quantity,
        totalPaid: data.totalPaid || totalPaid,
        totalSaved: data.totalSaved || totalSaved,
        status: 'CONFIRMED',
        shippingAddress: {
          fullName,
          phone,
          address,
          city,
          postalCode,
        },
        paymentMethod,
        placedAt: Date.now(),
        estimatedDelivery: `${product.deliveryDays} Business Days`,
      };

      setIsProcessing(false);
      onOrderConfirmed(order);
      onClose();
    } catch (err: any) {
      setOrderError(err?.message || 'Unable to verify order floor price.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-3xl border border-emerald-500/40 bg-gradient-to-b from-[#0D161F] via-[#090E17] to-[#06080E] p-6 shadow-2xl shadow-emerald-950/60 text-slate-100 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Header */}
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-700/60 flex items-center justify-center text-emerald-400">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-display font-bold text-lg text-white">
              Checkout & Order Confirmation (place_order Verified)
            </h2>
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>
                Settled Unit Price: ₹{unitPrice.toLocaleString('en-IN')} · Category Floor: ₹
                {effectiveFloor.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>

        {/* Deal Summary Banner + Quantity Control */}
        <div className="mt-4 p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src={product.image}
              alt={product.name}
              referrerPolicy="no-referrer"
              className="w-14 h-14 rounded-xl object-cover bg-slate-900 border border-slate-700"
            />
            <div>
              <h4 className="text-xs font-bold text-white line-clamp-1">{product.name}</h4>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                Seller: <span className="text-emerald-300 font-bold">{product.sellerName}</span>
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[11px] font-mono text-slate-300">Quantity:</span>
                <input
                  type="number"
                  min={1}
                  max={Math.max(1, product.stock)}
                  value={quantity}
                  onChange={(e) =>
                    setQuantity(Math.max(1, Math.min(product.stock || 10, Number(e.target.value) || 1)))
                  }
                  className="w-16 px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 font-mono text-xs text-white text-center"
                />
              </div>
            </div>
          </div>

          <div className="text-right sm:border-l sm:border-emerald-500/20 sm:pl-4">
            <div className="text-xs text-slate-400 line-through font-mono">
              ₹{(dealToken.originalPrice * quantity).toLocaleString('en-IN')}
            </div>
            <div className="text-2xl font-extrabold font-mono text-emerald-400">
              ₹{totalPaid.toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] font-mono text-emerald-300 font-semibold">
              You Save ₹{totalSaved.toLocaleString('en-IN')}
            </div>
          </div>
        </div>

        {orderError && (
          <div className="mt-4 p-3 rounded-xl bg-rose-950/70 border border-rose-500/50 text-rose-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{orderError}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmitOrder} className="mt-6 space-y-5">
          {/* Shipping Details */}
          <div>
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-cyan-400" />
              <span>Shipping & Delivery Destination</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1 font-mono">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1 font-mono">
                  Phone Number
                </label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] text-slate-400 mb-1 font-mono">
                  Street Address
                </label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1 font-mono">City</label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1 font-mono">
                  Postal Code
                </label>
                <input
                  type="text"
                  required
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-cyan-400" />
              <span>Payment Option</span>
            </h3>

            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod('UPI')}
                className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                  paymentMethod === 'UPI'
                    ? 'border-cyan-400 bg-cyan-950/40 text-white shadow-md shadow-cyan-950/40'
                    : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="text-xs font-bold font-mono">Instant UPI</div>
                <div className="text-[10px] text-slate-400 mt-0.5">GPay / PhonePe</div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('CREDIT_CARD')}
                className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                  paymentMethod === 'CREDIT_CARD'
                    ? 'border-cyan-400 bg-cyan-950/40 text-white shadow-md shadow-cyan-950/40'
                    : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="text-xs font-bold font-mono">Card</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Credit / Debit</div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('COD')}
                className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                  paymentMethod === 'COD'
                    ? 'border-cyan-400 bg-cyan-950/40 text-white shadow-md shadow-cyan-950/40'
                    : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="text-xs font-bold font-mono">Cash on Delivery</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Pay on arrival</div>
              </button>
            </div>
          </div>

          {/* Action Row */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-4">
            <div className="text-xs text-slate-400 font-mono">
              Delivery in {product.deliveryDays} days via Express Carrier
            </div>

            <button
              type="submit"
              disabled={isProcessing}
              className="px-6 py-3 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-2 cursor-pointer transition-transform transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
            >
              {isProcessing ? (
                <span>Verifying Floor & Confirming...</span>
              ) : (
                <>
                  <span>CONFIRM ORDER (₹{totalPaid.toLocaleString('en-IN')})</span>
                  <ArrowRight className="w-4 h-4 font-bold" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
