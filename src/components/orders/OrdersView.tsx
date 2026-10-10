import React from 'react';
import { Order } from '../../types';
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
}

export const OrdersView: React.FC<OrdersViewProps> = ({
  orders,
  onStartNewNegotiation,
}) => {
  const totalSavedAllOrders = orders.reduce((acc, o) => acc + o.totalSaved, 0);

  if (orders.length === 0) {
    return (
      <div className="py-20 text-center rounded-3xl border border-dashed border-slate-800 bg-[#090D15] p-8 max-w-xl mx-auto">
        <div className="w-12 h-12 rounded-2xl bg-cyan-950/60 border border-cyan-700/40 text-cyan-400 mx-auto flex items-center justify-center mb-4">
          <Package className="w-6 h-6" />
        </div>
        <h3 className="font-display font-bold text-lg text-white mb-2">
          No Orders Placed Yet
        </h3>
        <p className="text-xs text-slate-400 mb-6 leading-relaxed">
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
      <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-[#0B1516] to-[#0A0E18] border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-display font-bold text-base text-white">
              Verified Order Receipts & Gateway Records
            </h2>
            <p className="text-xs text-slate-400">
              Purchased strictly at verified AI-negotiated prices with server payment reconciliation
            </p>
          </div>
        </div>

        <div className="text-left sm:text-right">
          <div className="text-[10px] font-mono uppercase text-emerald-400">Cumulative Savings</div>
          <div className="text-2xl font-extrabold font-mono text-emerald-400">
            ₹{totalSavedAllOrders.toLocaleString('en-IN')}
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {orders.map((order) => (
          <div
            key={order.id}
            className="p-5 rounded-2xl border border-slate-800 bg-[#0B0F19] hover:border-slate-700 transition-colors shadow-lg"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-mono font-bold text-white">{order.id}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
                  <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                  Price Locked
                </span>

                {/* Real Payment Gateway Status Badges */}
                {order.paymentStatus === 'PAID' && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 flex items-center gap-1 font-bold">
                    <Check className="w-2.5 h-2.5 text-emerald-400" />
                    Razorpay Verified (PAID)
                  </span>
                )}
                {order.paymentStatus === 'COD_PENDING' && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-700/60 flex items-center gap-1 font-bold">
                    <Clock className="w-2.5 h-2.5 text-cyan-400" />
                    Cash on Delivery (Pending Delivery)
                  </span>
                )}
                {order.paymentStatus === 'PAYMENT_PENDING' && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-700/60 flex items-center gap-1 font-bold">
                    <Clock className="w-2.5 h-2.5 text-amber-400" />
                    Payment Pending
                  </span>
                )}
                {order.paymentStatus === 'PAYMENT_FAILED' && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-950/80 text-rose-300 border border-rose-700/60 flex items-center gap-1 font-bold">
                    <AlertCircle className="w-2.5 h-2.5 text-rose-400" />
                    Payment Declined
                  </span>
                )}
              </div>

              <span className="text-xs font-mono text-slate-400">
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
                  className="w-14 h-14 rounded-xl object-cover bg-slate-900 border border-slate-700"
                />
                <div>
                  <h4 className="text-sm font-bold text-white line-clamp-1">{order.product.name}</h4>
                  <div className="flex items-center gap-2 text-xs font-mono text-slate-400 mt-0.5">
                    <span>Seller: {order.product.sellerName}</span>
                    <span>·</span>
                    <span>Qty: {order.quantity}</span>
                    <span>·</span>
                    <span className="text-cyan-400 flex items-center gap-1">
                      <Truck className="w-3 h-3" /> {order.estimatedDelivery}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-right sm:border-l sm:border-slate-800 sm:pl-6">
                <div className="text-xs text-slate-500 line-through font-mono">
                  List: ₹{((order.dealToken?.originalPrice || order.product.listPrice) * order.quantity).toLocaleString('en-IN')}
                </div>
                <div className="text-xl font-bold font-mono text-white">
                  Paid: ₹{order.totalPaid.toLocaleString('en-IN')}
                </div>
                <div className="text-xs font-mono text-emerald-400 font-semibold">
                  Saved ₹{order.totalSaved.toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            {/* Gateway Tracking ID details */}
            <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] font-mono text-slate-400">
              <div>Ship to: {order.shippingAddress.fullName}, {order.shippingAddress.city}</div>
              <div className="flex flex-wrap items-center gap-3 text-slate-400">
                <div>Method: <span className="text-slate-200">{order.paymentMethod}</span></div>
                {order.razorpayPaymentId && (
                  <div className="text-emerald-400/90 font-mono">
                    Payment ID: {order.razorpayPaymentId}
                  </div>
                )}
                {order.razorpayOrderId && (
                  <div className="text-slate-500 font-mono">
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
