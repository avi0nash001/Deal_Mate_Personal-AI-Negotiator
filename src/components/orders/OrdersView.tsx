import React from 'react';
import { Order } from '../../types';
import { ThemeId, THEMES } from '../../types/theme';
import {
  Package,
  ShieldCheck,
  CheckCircle2,
  Truck,
  ArrowRight,
  CreditCard,
  AlertCircle,
  Clock,
  Check,
} from 'lucide-react';

interface OrdersViewProps {
  orders: Order[];
  onStartNewNegotiation: () => void;
  currentThemeId?: ThemeId;
}

export const OrdersView: React.FC<OrdersViewProps> = ({
  orders,
  onStartNewNegotiation,
  currentThemeId = 'pure-white',
}) => {
  const currentTheme = THEMES[currentThemeId] || THEMES['pure-white'];
  const isLight = currentTheme.isLight;
  const totalSavedAllOrders = orders.reduce((acc, o) => acc + o.totalSaved, 0);

  if (orders.length === 0) {
    return (
      <div
        className={`py-20 text-center rounded-3xl border border-dashed p-8 max-w-xl mx-auto transition-colors ${
          isLight
            ? 'border-slate-300 bg-white text-slate-900 shadow-sm'
            : 'border-slate-800 bg-[#090D15] text-white'
        }`}
      >
        <div
          className={`w-12 h-12 rounded-2xl mx-auto flex items-center justify-center mb-4 ${
            isLight
              ? 'bg-blue-50 border border-blue-200 text-blue-600'
              : 'bg-cyan-950/60 border border-cyan-700/40 text-cyan-400'
          }`}
        >
          <Package className="w-6 h-6" />
        </div>
        <h3
          className={`font-display font-bold text-lg mb-2 ${
            isLight ? 'text-slate-900' : 'text-white'
          }`}
        >
          No Orders Placed Yet
        </h3>
        <p
          className={`text-xs mb-6 leading-relaxed ${
            isLight ? 'text-slate-600' : 'text-slate-300'
          }`}
        >
          Your negotiated deals will appear here once verified and confirmed. Start your first AI-to-AI negotiation now!
        </p>
        <button
          onClick={onStartNewNegotiation}
          className="px-6 py-2.5 bg-gradient-to-r from-cyan-400 to-indigo-500 hover:from-cyan-300 hover:to-indigo-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-cyan-500/20 cursor-pointer"
        >
          Explore Marketplace & Negotiate
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Savings Trophy Bar */}
      <div
        className={`p-6 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl transition-colors ${
          isLight
            ? 'bg-gradient-to-r from-emerald-50 via-white to-teal-50/50 border-emerald-300 text-slate-900 shadow-sm'
            : 'bg-gradient-to-r from-emerald-950/60 via-[#0B1516] to-[#0A0E18] border-emerald-500/40 text-white'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isLight
                ? 'bg-emerald-100 border border-emerald-300 text-emerald-700'
                : 'bg-emerald-500/20 border border-emerald-400/40 text-emerald-300'
            }`}
          >
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2
              className={`font-display font-bold text-base ${
                isLight ? 'text-slate-900' : 'text-[#F8FAFC]'
              }`}
            >
              Verified Order Receipts & Gateway Records
            </h2>
            <p
              className={`text-xs ${
                isLight ? 'text-slate-600' : 'text-slate-200'
              }`}
            >
              Purchased strictly at verified AI-negotiated prices with server payment reconciliation
            </p>
          </div>
        </div>

        <div className="text-left sm:text-right">
          <div
            className={`text-[11px] font-mono uppercase tracking-wider font-semibold ${
              isLight ? 'text-emerald-700' : 'text-emerald-300'
            }`}
          >
            Cumulative Savings
          </div>
          <div
            className={`text-2xl font-extrabold font-mono tabular-nums ${
              isLight ? 'text-emerald-700' : 'text-emerald-300'
            }`}
          >
            ₹{totalSavedAllOrders.toLocaleString('en-IN')}
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {orders.map((order) => (
          <div
            key={order.id}
            className={`p-5 rounded-2xl border transition-colors shadow-lg ${
              isLight
                ? 'border-slate-200 bg-white hover:border-slate-300 shadow-sm'
                : 'border-slate-800 bg-[#0B0F19] hover:border-slate-700'
            }`}
          >
            <div
              className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b ${
                isLight ? 'border-slate-200' : 'border-slate-800'
              }`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`text-xs font-mono font-bold ${
                    isLight ? 'text-slate-900' : 'text-[#F8FAFC]'
                  }`}
                >
                  {order.id}
                </span>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full flex items-center gap-1 font-semibold ${
                    isLight
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-emerald-950/90 text-emerald-200 border border-emerald-600'
                  }`}
                >
                  <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                  Price Locked
                </span>

                {/* Real Payment Gateway Status Badges */}
                {order.paymentStatus === 'PAID' && (
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full flex items-center gap-1 font-bold ${
                      isLight
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-emerald-950/90 text-emerald-200 border border-emerald-600'
                    }`}
                  >
                    <Check className="w-2.5 h-2.5 text-emerald-400" />
                    Razorpay Verified (PAID)
                  </span>
                )}
                {order.paymentStatus === 'COD_PENDING' && (
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full flex items-center gap-1 font-bold ${
                      isLight
                        ? 'bg-sky-100 text-sky-800 border border-sky-300'
                        : 'bg-cyan-950/90 text-cyan-200 border border-cyan-600'
                    }`}
                  >
                    <Clock className="w-2.5 h-2.5 text-cyan-400" />
                    Cash on Delivery (Pending Delivery)
                  </span>
                )}
                {order.paymentStatus === 'PAYMENT_PENDING' && (
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full flex items-center gap-1 font-bold ${
                      isLight
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : 'bg-amber-950/90 text-amber-200 border border-amber-600'
                    }`}
                  >
                    <Clock className="w-2.5 h-2.5 text-amber-400" />
                    Payment Pending
                  </span>
                )}
                {order.paymentStatus === 'PAYMENT_FAILED' && (
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full flex items-center gap-1 font-bold ${
                      isLight
                        ? 'bg-rose-100 text-rose-800 border border-rose-300'
                        : 'bg-rose-950/90 text-rose-200 border border-rose-600'
                    }`}
                  >
                    <AlertCircle className="w-2.5 h-2.5 text-rose-400" />
                    Payment Declined
                  </span>
                )}
              </div>

              <span
                className={`text-xs font-mono tabular-nums ${
                  isLight ? 'text-slate-600' : 'text-slate-300'
                }`}
              >
                {new Date(order.placedAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            </div>

            <div className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <img
                  src={order.product.image}
                  alt={order.product.name}
                  referrerPolicy="no-referrer"
                  className={`w-14 h-14 rounded-xl object-cover ${
                    isLight
                      ? 'bg-slate-100 border border-slate-300'
                      : 'bg-slate-900 border border-slate-700'
                  }`}
                />
                <div>
                  <h4
                    className={`text-sm font-bold line-clamp-1 ${
                      isLight ? 'text-slate-900' : 'text-[#F8FAFC]'
                    }`}
                  >
                    {order.product.name}
                  </h4>
                  <div
                    className={`flex items-center gap-2 text-xs font-mono mt-0.5 ${
                      isLight ? 'text-slate-600' : 'text-slate-300'
                    }`}
                  >
                    <span className="font-medium">
                      Seller:{' '}
                      <strong className={isLight ? 'text-slate-800' : 'text-[#E2E8F0]'}>
                        {order.product.sellerName}
                      </strong>
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>Qty: {order.quantity}</span>
                    <span aria-hidden="true">·</span>
                    <span
                      className={`flex items-center gap-1 font-semibold ${
                        isLight ? 'text-sky-700' : 'text-cyan-300'
                      }`}
                    >
                      <Truck className="w-3.5 h-3.5" /> {order.estimatedDelivery}
                    </span>
                  </div>
                </div>
              </div>

              <div
                className={`text-right sm:border-l sm:pl-6 ${
                  isLight ? 'sm:border-slate-200' : 'sm:border-slate-800'
                }`}
              >
                <div
                  className={`text-xs line-through font-mono tabular-nums ${
                    isLight ? 'text-slate-500' : 'text-slate-400'
                  }`}
                >
                  List: ₹{((order.dealToken?.originalPrice || order.product.listPrice) * order.quantity).toLocaleString('en-IN')}
                </div>
                <div
                  className={`text-xl font-bold font-mono tabular-nums ${
                    isLight ? 'text-slate-900' : 'text-[#F8FAFC]'
                  }`}
                >
                  Paid: ₹{order.totalPaid.toLocaleString('en-IN')}
                </div>
                <div
                  className={`text-xs font-mono tabular-nums font-bold ${
                    isLight ? 'text-emerald-700' : 'text-emerald-400'
                  }`}
                >
                  Saved ₹{order.totalSaved.toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            {/* Gateway Tracking ID details */}
            <div
              className={`pt-3 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] font-mono ${
                isLight
                  ? 'border-slate-200 text-slate-600'
                  : 'border-slate-800/80 text-slate-300'
              }`}
            >
              <div>
                Ship to:{' '}
                <span className={isLight ? 'text-slate-800 font-semibold' : 'text-[#E2E8F0] font-semibold'}>
                  {order.shippingAddress.fullName}, {order.shippingAddress.city}
                </span>
              </div>
              <div
                className={`flex flex-wrap items-center gap-3 ${
                  isLight ? 'text-slate-600' : 'text-slate-300'
                }`}
              >
                <div>
                  Method:{' '}
                  <span className={isLight ? 'text-slate-800 font-bold' : 'text-[#F8FAFC] font-bold'}>
                    {order.paymentMethod}
                  </span>
                </div>
                {order.razorpayPaymentId && (
                  <div
                    className={`font-mono font-medium ${
                      isLight ? 'text-emerald-700' : 'text-emerald-300'
                    }`}
                  >
                    Payment ID: {order.razorpayPaymentId}
                  </div>
                )}
                {order.razorpayOrderId && (
                  <div
                    className={`font-mono ${
                      isLight ? 'text-slate-600' : 'text-slate-300'
                    }`}
                  >
                    Gateway Order: {order.razorpayOrderId}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
