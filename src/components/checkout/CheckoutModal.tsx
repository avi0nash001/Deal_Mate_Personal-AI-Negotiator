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

              if (verifyResult.verified && verifyResult.order) {
                setIsProcessing(false);
                onOrderConfirmed(verifyResult.order);
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
        msg.includes('RAZORPAY_KEY_ID')
      ) {
        setMissingConfigHelp(true);
      }
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-3xl border border-emerald-500/40 bg-gradient-to-b from-[#0D161F] via-[#090E17] to-[#06080E] p-6 shadow-2xl shadow-emerald-950/60 text-slate-100 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isProcessing}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-30"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Header & Gateway Status Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-700/60 flex items-center justify-center text-emerald-400">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg text-white">
                Checkout & Secure Payment
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

          {/* Real Razorpay Gateway Status Indicator */}
          <div className="flex items-center gap-2">
            {razorpayConfig?.isConfigured ? (
              <div
                className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold flex items-center gap-1.5 border ${
                  razorpayConfig.mode === 'live'
                    ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300'
                    : 'bg-amber-950/80 border-amber-500/60 text-amber-300'
                }`}
              >
                <div
                  className={`w-1.5 h-1.5 rounded-full ${
                    razorpayConfig.mode === 'live' ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'
                  }`}
                />
                <span>
                  Razorpay {razorpayConfig.mode === 'live' ? 'Live Gateway' : 'Test Mode Active'}
                </span>
              </div>
            ) : (
              <div className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold flex items-center gap-1.5 border bg-slate-900 border-slate-700 text-slate-300">
                <KeyRound className="w-3 h-3 text-cyan-400" />
                <span>Razorpay Gateway Ready</span>
              </div>
            )}
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
                  disabled={isProcessing}
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

        {/* Error notification */}
        {orderError && (
          <div className="mt-4 p-3.5 rounded-2xl bg-rose-950/70 border border-rose-500/50 text-rose-200 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <div className="flex-1">
              <div className="font-bold">Transaction Notice</div>
              <div className="mt-0.5 text-rose-300/90">{orderError}</div>
            </div>
          </div>
        )}

        {/* Missing Razorpay credentials helper banner */}
        {missingConfigHelp && (
          <div className="mt-4 p-4 rounded-2xl bg-slate-900/90 border border-cyan-500/40 text-xs space-y-3">
            <div className="flex items-center gap-2 text-cyan-300 font-bold">
              <KeyRound className="w-4 h-4" />
              <span>Razorpay Credentials Setup Guide</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              DealMate uses the official Razorpay Standard Checkout SDK. To activate live or test card/UPI payments:
            </p>
            <ol className="list-decimal list-inside space-y-1 text-slate-400 font-mono text-[11px]">
              <li>
                Log in to <span className="text-cyan-300">dashboard.razorpay.com</span>
              </li>
              <li>Toggle the header switch to <strong>Test Mode</strong></li>
              <li>Go to <strong>Settings &gt; API Keys</strong> and click <strong>Generate Key</strong></li>
              <li>
                Add <code className="text-emerald-400">RAZORPAY_KEY_ID</code> and{' '}
                <code className="text-emerald-400">RAZORPAY_KEY_SECRET</code> to your server environment (.env)
              </li>
            </ol>
            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-slate-400">
                Or select <strong>Cash on Delivery</strong> below to test checkout immediately.
              </span>
              <button
                type="button"
                onClick={() => {
                  setPaymentMethod('COD');
                  setOrderError(null);
                  setMissingConfigHelp(false);
                }}
                className="px-3 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 rounded-lg font-mono text-xs cursor-pointer"
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
                  disabled={isProcessing}
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
                  disabled={isProcessing}
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
                  disabled={isProcessing}
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
                  disabled={isProcessing}
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
                  disabled={isProcessing}
                  onChange={(e) => setPostalCode(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-cyan-400" />
                <span>Payment Option (Razorpay Gateway)</span>
              </h3>
              <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                INR (₹) Standard Checkout
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => setPaymentMethod('UPI')}
                className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                  paymentMethod === 'UPI'
                    ? 'border-emerald-400 bg-emerald-950/40 text-white shadow-md shadow-emerald-950/40'
                    : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="text-xs font-bold font-mono">Instant UPI</div>
                <div className="text-[10px] text-slate-400 mt-0.5">GPay / PhonePe / Paytm</div>
              </button>

              <button
                type="button"
                disabled={isProcessing}
                onClick={() => setPaymentMethod('CREDIT_CARD')}
                className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                  paymentMethod === 'CREDIT_CARD'
                    ? 'border-emerald-400 bg-emerald-950/40 text-white shadow-md shadow-emerald-950/40'
                    : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="text-xs font-bold font-mono">Card / NetBanking</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Visa / MC / RuPay</div>
              </button>

              <button
                type="button"
                disabled={isProcessing}
                onClick={() => setPaymentMethod('COD')}
                className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                  paymentMethod === 'COD'
                    ? 'border-cyan-400 bg-cyan-950/40 text-white shadow-md shadow-cyan-950/40'
                    : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="text-xs font-bold font-mono">Cash on Delivery</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Pay on delivery</div>
              </button>
            </div>
          </div>

          {/* Trust & Security Badges */}
          <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>256-Bit SSL · RBI Compliant Checkout</span>
            </div>
            <div className="text-slate-500">Official Razorpay Integration</div>
          </div>

          {/* Action Row */}
          <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-400 font-mono">
              Estimated delivery: {product.deliveryDays} business days
            </div>

            <button
              type="submit"
              disabled={isProcessing}
              className="w-full sm:w-auto px-7 py-3 bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500 hover:from-emerald-300 hover:to-teal-300 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 cursor-pointer transition-transform transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
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
