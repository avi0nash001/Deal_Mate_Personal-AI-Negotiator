import React, { useState, useEffect } from 'react';
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
import {
  createBackendOrder,
  verifyBackendPayment,
  loadRazorpayScript,
  fetchRazorpayConfig,
  RazorpayConfigResponse,
} from '../../services/razorpayService';
import { saveOrderToFirestore } from '../../services/orderService';
import {
  X,
  ShieldCheck,
  Lock,
  Truck,
  CreditCard,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Loader2,
  KeyRound,
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
  const [phone, setPhone] = useState('+91 98450 11201');
  const [address, setAddress] = useState('402 Silicon Heights, Outer Ring Road');
  const [city, setCity] = useState('Bengaluru');
  const [postalCode, setPostalCode] = useState('560103');
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'CREDIT_CARD' | 'COD'>('UPI');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [orderError, setOrderError] = useState<string | null>(null);
  const [missingConfigHelp, setMissingConfigHelp] = useState<boolean>(false);
  const [razorpayConfig, setRazorpayConfig] = useState<RazorpayConfigResponse | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadRazorpayScript().catch(() => {});
      fetchRazorpayConfig()
        .then((cfg) => setRazorpayConfig(cfg))
        .catch(() => {});
    }
  }, [isOpen]);

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
    if (isProcessing) return; // Prevent duplicate submission

    setOrderError(null);
    setMissingConfigHelp(false);
    setIsProcessing(true);
    setProcessingStatus('Validating price floor & creating server order...');

    try {
      const orderPayload = {
        product,
        unitPrice,
        quantity,
        dealToken,
        shippingAddress: {
          fullName,
          phone,
          address,
          city,
          postalCode,
        },
        paymentMethod,
        maxSingleDiscountPct,
        maxBundleDiscountPct,
        isBundle,
      };

      const backendResponse = await createBackendOrder(orderPayload);

      // Route 1: Cash On Delivery (Instant verified server confirmation)
      if (backendResponse.isCOD && backendResponse.order) {
        setProcessingStatus('Saving order to database...');
        try {
          await saveOrderToFirestore(backendResponse.order);
        } catch (e) {
          console.warn('Firestore order save error (non-blocking):', e);
        }
        setIsProcessing(false);
        onOrderConfirmed(backendResponse.order);
        onClose();
        return;
      }

      // Route 2: Razorpay Online Payment (UPI / Credit Card)
      if (backendResponse.razorpayOrderId && backendResponse.keyId) {
        setProcessingStatus('Opening official Razorpay Checkout...');

        const scriptReady = await loadRazorpayScript();
        if (!scriptReady || typeof window.Razorpay === 'undefined') {
          throw new Error('Razorpay Checkout SDK could not be loaded in browser. Check your internet connection.');
        }

        const options = {
          key: backendResponse.keyId,
          amount: backendResponse.amount,
          currency: backendResponse.currency || 'INR',
          name: 'DealMate AI Shopping Negotiator',
          description: backendResponse.description || `${product.name} (Locked Deal)`,
          order_id: backendResponse.razorpayOrderId,
          prefill: backendResponse.prefill || {
            name: fullName,
            contact: phone,
          },
          theme: {
            color: '#10B981', // Emerald theme matching DealMate branding
          },
          handler: async (razorpayResponse: {
            razorpay_payment_id: string;
            razorpay_order_id: string;
            razorpay_signature: string;
          }) => {
            setProcessingStatus('Verifying cryptographic signature on server...');
            try {
              const verifyResult = await verifyBackendPayment({
                dealmateOrderId: backendResponse.orderId!,
                razorpayOrderId: razorpayResponse.razorpay_order_id,
                razorpayPaymentId: razorpayResponse.razorpay_payment_id,
                razorpaySignature: razorpayResponse.razorpay_signature,
              });

              if (verifyResult.verified) {
                const confirmedOrder: Order = {
                  id: verifyResult.order?.id || backendResponse.orderId || `ORD-${Date.now().toString(36).toUpperCase()}`,
                  dealToken,
                  product,
                  quantity,
                  totalPaid,
                  totalSaved,
                  status: 'CONFIRMED',
                  paymentMethod,
                  paymentStatus: 'PAID',
                  shippingAddress: {
                    fullName,
                    phone,
                    address,
                    city,
                    postalCode,
                  },
                  razorpayOrderId: razorpayResponse.razorpay_order_id,
                  razorpayPaymentId: razorpayResponse.razorpay_payment_id,
                  razorpaySignature: razorpayResponse.razorpay_signature,
                  currency: backendResponse.currency || 'INR',
                  placedAt: Date.now(),
                  estimatedDelivery: `${product.deliveryDays || 3} Business Days`,
                  verifiedAt: new Date().toISOString(),
                  ...(verifyResult.order || {}),
                };

                setProcessingStatus('Saving verified payment to database...');
                try {
                  await saveOrderToFirestore(confirmedOrder);
                } catch (e) {
                  console.warn('Firestore order save error (non-blocking):', e);
                }
                setIsProcessing(false);
                onOrderConfirmed(confirmedOrder);
                onClose();
              } else {
                throw new Error(verifyResult.error || 'Cryptographic verification failed.');
              }
            } catch (vErr: any) {
              setOrderError(
                vErr?.message ||
                  'Payment was captured by gateway but server verification failed. Please contact support.'
              );
              setIsProcessing(false);
            }
          },
          modal: {
            ondismiss: () => {
              setIsProcessing(false);
              setProcessingStatus('');
            },
          },
        };

        const rzpInstance = new window.Razorpay(options);
        rzpInstance.on('payment.failed', (failResp: any) => {
          const reason =
            failResp?.error?.description ||
            failResp?.error?.reason ||
            'Payment transaction was declined by bank or user.';
          setOrderError(`Razorpay Payment Failed: ${reason}`);
          setIsProcessing(false);
        });

        rzpInstance.open();
      } else {
        throw new Error('Server did not return a valid Razorpay order ID.');
      }
    } catch (err: any) {
      const msg = err?.message || 'Failed to complete checkout.';
      setOrderError(msg);
      if (
        msg.includes('RAZORPAY_NOT_CONFIGURED') ||
        msg.includes('credentials') ||
        msg.includes('RAZORPAY_KEY_ID') ||
        msg.includes('authentication failed') ||
        msg.includes('Authentication failed') ||
        msg.includes('RAZORPAY_AUTH_FAILED')
      ) {
        setMissingConfigHelp(true);
      }
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-3xl border border-[#E2E8F0] bg-white p-6 shadow-2xl shadow-slate-900/20 text-[#0F172A] max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isProcessing}
          className="absolute top-5 right-5 p-2 rounded-full text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition-colors cursor-pointer disabled:opacity-30"
          title="Close checkout"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Header & Gateway Status Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-1">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shadow-xs">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg text-[#0F172A]">
                Checkout & Secure Payment
              </h2>
              <div className="flex items-center gap-2 text-xs font-mono text-emerald-700 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>
                  Settled Unit Price: ₹{unitPrice.toLocaleString('en-IN')} · Category Floor: ₹
                  {effectiveFloor.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          {/* Real Razorpay Gateway Status Indicator */}
          <div className="flex items-center gap-2">
            {razorpayConfig?.isConfigured ? (
              <div
                className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold flex items-center gap-1.5 border shadow-xs ${
                  razorpayConfig.mode === 'live'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                    : 'bg-amber-50 border-amber-300 text-amber-800'
                }`}
              >
                <div
                  className={`w-1.5 h-1.5 rounded-full ${
                    razorpayConfig.mode === 'live' ? 'bg-emerald-600' : 'bg-amber-500 animate-pulse'
                  }`}
                />
                <span>
                  Razorpay {razorpayConfig.mode === 'live' ? 'Live Gateway' : 'Test Mode Active'}
                </span>
              </div>
            ) : (
              <div className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold flex items-center gap-1.5 border bg-slate-100 border-slate-200 text-slate-700 shadow-xs">
                <KeyRound className="w-3 h-3 text-cyan-600" />
                <span>Razorpay Gateway Ready</span>
              </div>
            )}
          </div>
        </div>

        {/* Deal Summary Banner + Quantity Control (#F8FAFC) */}
        <div className="mt-4 p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src={product.image}
              alt={product.name}
              referrerPolicy="no-referrer"
              className="w-14 h-14 rounded-xl object-cover bg-white border border-[#E2E8F0] shadow-xs"
            />
            <div>
              <h4 className="text-xs font-bold text-[#0F172A] line-clamp-1">{product.name}</h4>
              <p className="text-xs text-[#64748B] font-mono mt-0.5">
                Seller: <span className="text-emerald-700 font-bold">{product.sellerName}</span>
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs font-mono text-[#334155] font-semibold">Quantity:</span>
                <input
                  type="number"
                  min={1}
                  max={Math.max(1, product.stock)}
                  value={quantity}
                  disabled={isProcessing}
                  onChange={(e) =>
                    setQuantity(Math.max(1, Math.min(product.stock || 10, Number(e.target.value) || 1)))
                  }
                  className="w-16 px-2.5 py-1 rounded-lg bg-white border border-[#CBD5E1] font-mono text-xs text-[#0F172A] text-center focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 shadow-xs"
                />
              </div>
            </div>
          </div>

          <div className="text-right sm:border-l sm:border-[#E2E8F0] sm:pl-4">
            <div className="text-xs text-[#94A3B8] line-through font-mono">
              ₹{(dealToken.originalPrice * quantity).toLocaleString('en-IN')}
            </div>
            <div className="text-2xl font-extrabold font-mono text-emerald-700">
              ₹{totalPaid.toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] font-mono text-emerald-700 font-semibold">
              You Save ₹{totalSaved.toLocaleString('en-IN')}
            </div>
          </div>
        </div>

        {/* Error notification */}
        {orderError && (
          <div className="mt-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-2.5 shadow-xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            <div className="flex-1">
              <div className="font-bold text-rose-950">Transaction Notice</div>
              <div className="mt-0.5 text-rose-800">{orderError}</div>
            </div>
          </div>
        )}

        {/* Missing Razorpay credentials helper banner */}
        {missingConfigHelp && (
          <div className="mt-4 p-4 rounded-2xl bg-[#F8FAFC] border border-cyan-200 text-xs space-y-3 shadow-xs">
            <div className="flex items-center gap-2 text-cyan-800 font-bold">
              <KeyRound className="w-4 h-4 text-cyan-600" />
              <span>Razorpay Credentials Setup Guide</span>
            </div>
            <p className="text-[#334155] leading-relaxed">
              DealMate uses the official Razorpay Standard Checkout SDK. To activate live or test card/UPI payments:
            </p>
            <ol className="list-decimal list-inside space-y-1 text-[#64748B] font-mono text-[11px]">
              <li>
                Log in to <span className="text-cyan-700 font-semibold">dashboard.razorpay.com</span>
              </li>
              <li>Toggle the header switch to <strong>Test Mode</strong></li>
              <li>Go to <strong>Settings &gt; API Keys</strong> and click <strong>Generate Key</strong></li>
              <li>
                Add <code className="text-emerald-800 bg-emerald-50 px-1 py-0.5 rounded border border-emerald-200">RAZORPAY_KEY_ID</code> and{' '}
                <code className="text-emerald-800 bg-emerald-50 px-1 py-0.5 rounded border border-emerald-200">RAZORPAY_KEY_SECRET</code> to your server environment (.env)
              </li>
            </ol>
            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-[#64748B]">
                Or select <strong>Cash on Delivery</strong> below to test checkout immediately.
              </span>
              <button
                type="button"
                onClick={() => {
                  setPaymentMethod('COD');
                  setOrderError(null);
                  setMissingConfigHelp(false);
                }}
                className="px-3 py-1 bg-cyan-100 hover:bg-cyan-200 text-cyan-900 border border-cyan-300 rounded-lg font-mono text-xs cursor-pointer font-semibold transition-colors"
              >
                Switch to COD
              </button>
            </div>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmitOrder} className="mt-6 space-y-5">
          {/* Shipping Details */}
          <div>
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#0F172A] mb-3 flex items-center gap-2">
              <Truck className="w-4 h-4 text-cyan-600 shrink-0" />
              <span>Shipping & Delivery Destination</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-[#334155] mb-1.5 font-mono font-semibold">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  disabled={isProcessing}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter full name"
                  className="w-full px-3 py-2 bg-white border border-[#CBD5E1] hover:border-slate-400 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 rounded-xl text-xs text-[#0F172A] placeholder:text-[#94A3B8] outline-none transition-colors shadow-xs"
                />
              </div>

              <div>
                <label className="block text-xs text-[#334155] mb-1.5 font-mono font-semibold">
                  Phone Number
                </label>
                <input
                  type="text"
                  required
                  value={phone}
                  disabled={isProcessing}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91..."
                  className="w-full px-3 py-2 bg-white border border-[#CBD5E1] hover:border-slate-400 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 rounded-xl text-xs text-[#0F172A] placeholder:text-[#94A3B8] outline-none font-mono transition-colors shadow-xs"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs text-[#334155] mb-1.5 font-mono font-semibold">
                  Street Address
                </label>
                <input
                  type="text"
                  required
                  value={address}
                  disabled={isProcessing}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="House/Flat, Street, Area"
                  className="w-full px-3 py-2 bg-white border border-[#CBD5E1] hover:border-slate-400 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 rounded-xl text-xs text-[#0F172A] placeholder:text-[#94A3B8] outline-none transition-colors shadow-xs"
                />
              </div>

              <div>
                <label className="block text-xs text-[#334155] mb-1.5 font-mono font-semibold">City</label>
                <input
                  type="text"
                  required
                  value={city}
                  disabled={isProcessing}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="City"
                  className="w-full px-3 py-2 bg-white border border-[#CBD5E1] hover:border-slate-400 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 rounded-xl text-xs text-[#0F172A] placeholder:text-[#94A3B8] outline-none transition-colors shadow-xs"
                />
              </div>

              <div>
                <label className="block text-xs text-[#334155] mb-1.5 font-mono font-semibold">
                  Postal Code
                </label>
                <input
                  type="text"
                  required
                  value={postalCode}
                  disabled={isProcessing}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="6-digit PIN"
                  className="w-full px-3 py-2 bg-white border border-[#CBD5E1] hover:border-slate-400 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 rounded-xl text-xs text-[#0F172A] placeholder:text-[#94A3B8] outline-none font-mono transition-colors shadow-xs"
                />
              </div>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#0F172A] flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-cyan-600 shrink-0" />
                <span>Payment Option (Razorpay Gateway)</span>
              </h3>
              <span className="text-xs font-mono text-emerald-700 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                INR (₹) Standard Checkout
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => setPaymentMethod('UPI')}
                className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                  paymentMethod === 'UPI'
                    ? 'border-emerald-600 bg-emerald-50/80 text-[#0F172A] shadow-sm ring-2 ring-emerald-600/20'
                    : 'border-[#E2E8F0] bg-white text-[#334155] hover:border-slate-300 hover:bg-[#F8FAFC]'
                }`}
              >
                <div className="text-xs font-bold font-mono text-[#0F172A] flex items-center justify-between">
                  <span>Instant UPI</span>
                  {paymentMethod === 'UPI' && (
                    <span className="w-2 h-2 rounded-full bg-emerald-600 shadow-xs shadow-emerald-500" />
                  )}
                </div>
                <div className={`text-[11px] mt-1 font-sans ${paymentMethod === 'UPI' ? 'text-emerald-800 font-medium' : 'text-[#64748B]'}`}>
                  GPay / PhonePe / Paytm
                </div>
              </button>

              <button
                type="button"
                disabled={isProcessing}
                onClick={() => setPaymentMethod('CREDIT_CARD')}
                className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                  paymentMethod === 'CREDIT_CARD'
                    ? 'border-emerald-600 bg-emerald-50/80 text-[#0F172A] shadow-sm ring-2 ring-emerald-600/20'
                    : 'border-[#E2E8F0] bg-white text-[#334155] hover:border-slate-300 hover:bg-[#F8FAFC]'
                }`}
              >
                <div className="text-xs font-bold font-mono text-[#0F172A] flex items-center justify-between">
                  <span>Card / NetBanking</span>
                  {paymentMethod === 'CREDIT_CARD' && (
                    <span className="w-2 h-2 rounded-full bg-emerald-600 shadow-xs shadow-emerald-500" />
                  )}
                </div>
                <div className={`text-[11px] mt-1 font-sans ${paymentMethod === 'CREDIT_CARD' ? 'text-emerald-800 font-medium' : 'text-[#64748B]'}`}>
                  Visa / MC / RuPay
                </div>
              </button>

              <button
                type="button"
                disabled={isProcessing}
                onClick={() => setPaymentMethod('COD')}
                className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                  paymentMethod === 'COD'
                    ? 'border-cyan-600 bg-cyan-50/80 text-[#0F172A] shadow-sm ring-2 ring-cyan-600/20'
                    : 'border-[#E2E8F0] bg-white text-[#334155] hover:border-slate-300 hover:bg-[#F8FAFC]'
                }`}
              >
                <div className="text-xs font-bold font-mono text-[#0F172A] flex items-center justify-between">
                  <span>Cash on Delivery</span>
                  {paymentMethod === 'COD' && (
                    <span className="w-2 h-2 rounded-full bg-cyan-600 shadow-xs shadow-cyan-500" />
                  )}
                </div>
                <div className={`text-[11px] mt-1 font-sans ${paymentMethod === 'COD' ? 'text-cyan-800 font-medium' : 'text-[#64748B]'}`}>
                  Pay on delivery
                </div>
              </button>
            </div>
          </div>

          {/* Trust & Security Badges */}
          <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between text-xs text-[#334155] font-mono shadow-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold text-[#0F172A]">256-Bit SSL · RBI Compliant Checkout</span>
            </div>
            <div className="text-[#64748B] font-medium">Official Razorpay Integration</div>
          </div>

          {/* Action Row */}
          <div className="pt-4 border-t border-[#E2E8F0] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-[#475569] font-mono font-medium">
              Estimated delivery: <span className="text-emerald-700 font-bold">{product.deliveryDays || 3} business days</span>
            </div>

            <button
              type="submit"
              disabled={isProcessing}
              className="w-full sm:w-auto px-7 py-3.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 cursor-pointer transition-transform transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>{processingStatus || 'Contacting Gateway...'}</span>
                </>
              ) : (
                <>
                  <span>
                    {paymentMethod === 'COD'
                      ? `CONFIRM ORDER (₹${totalPaid.toLocaleString('en-IN')})`
                      : `PAY NOW VIA RAZORPAY (₹${totalPaid.toLocaleString('en-IN')})`}
                  </span>
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

