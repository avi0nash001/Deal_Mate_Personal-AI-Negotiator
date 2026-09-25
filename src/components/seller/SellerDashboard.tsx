import React, { useState } from 'react';
import { Product } from '../../types';
import { PRODUCTS, SELLERS } from '../../data/catalog';
import { Store, Sliders, DollarSign, Package, ShieldCheck, Activity, ToggleLeft, ToggleRight, Sparkles } from 'lucide-react';

interface SellerDashboardProps {
  onSimulateNegotiation: (product: Product, buyerOffer: number) => void;
}

export const SellerDashboard: React.FC<SellerDashboardProps> = ({
  onSimulateNegotiation,
}) => {
  const [productsList, setProductsList] = useState<Product[]>(PRODUCTS);
  const [selectedProduct, setSelectedProduct] = useState<Product>(PRODUCTS[0]);
  const [simulatedBuyerOffer, setSimulatedBuyerOffer] = useState<number>(2400);

  const handleUpdateFloor = (productId: string, newFloor: number) => {
    setProductsList((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, minAcceptablePrice: newFloor } : p))
    );
    if (selectedProduct.id === productId) {
      setSelectedProduct((prev) => ({ ...prev, minAcceptablePrice: newFloor }));
    }
  };

  const handleUpdateStock = (productId: string, newStock: number) => {
    setProductsList((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, stock: newStock } : p))
    );
    if (selectedProduct.id === productId) {
      setSelectedProduct((prev) => ({ ...prev, stock: newStock }));
    }
  };

  // Compute metrics
  const totalCatalogValue = productsList.reduce((acc, p) => acc + p.listPrice * p.stock, 0);
  const totalStockUnits = productsList.reduce((acc, p) => acc + p.stock, 0);

  // Simulation response logic
  const listPrice = selectedProduct.listPrice;
  const floorPrice = selectedProduct.minAcceptablePrice;
  const allowableDiscountPercent = Math.round(((listPrice - floorPrice) / listPrice) * 100);

  const willAccept = simulatedBuyerOffer >= floorPrice;
  const recommendedCounter = Math.round(listPrice - (listPrice - floorPrice) * 0.4);

  return (
    <div className="space-y-8">
      {/* Top Banner & Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-[#0C101C] border border-amber-500/30 shadow-lg">
          <div className="flex items-center justify-between text-amber-400 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Merchant Sales Yield</span>
            <DollarSign className="w-4 h-4" />
          </div>
          <div className="text-2xl font-extrabold font-mono text-white">
            ₹{totalCatalogValue.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono">
            4 Active automated negotiation agents
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0C101C] border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-cyan-400 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Live Inventory</span>
            <Package className="w-4 h-4" />
          </div>
          <div className="text-2xl font-extrabold font-mono text-white">
            {totalStockUnits} Units
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono">
            Across 4 SKU product lines
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0C101C] border border-emerald-500/30 shadow-lg">
          <div className="flex items-center justify-between text-emerald-400 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Seller Agent Policy</span>
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="text-2xl font-extrabold font-mono text-emerald-400">
            Protected
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono">
            Private margin floors strictly enforced
          </div>
        </div>
      </div>

      {/* Main 2-Column: Catalog Policy Matrix & Live Agent Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Product Policy Matrix */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-base text-white flex items-center gap-2">
              <Store className="w-4 h-4 text-amber-400" />
              <span>Merchant Inventory & Margin Thresholds</span>
            </h3>
            <span className="text-xs font-mono text-slate-400">
              Select product to test negotiation rules
            </span>
          </div>

          <div className="space-y-3">
            {productsList.map((prod) => {
              const isSelected = selectedProduct.id === prod.id;
              const maxDiscount = Math.round(
                ((prod.listPrice - prod.minAcceptablePrice) / prod.listPrice) * 100
              );

              return (
                <div
                  key={prod.id}
                  onClick={() => setSelectedProduct(prod)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-amber-400/80 bg-[#141219] shadow-lg shadow-amber-950/30'
                      : 'border-slate-800 bg-[#0B0F19] hover:border-slate-700'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={prod.image}
                        alt={prod.name}
                        referrerPolicy="no-referrer"
                        className="w-12 h-12 rounded-lg object-cover bg-slate-900 border border-slate-700"
                      />
                      <div>
                        <h4 className="text-xs font-bold text-white line-clamp-1">{prod.name}</h4>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] font-mono text-slate-400">
                          <span>List: ₹{prod.listPrice.toLocaleString('en-IN')}</span>
                          <span>·</span>
                          <span className="text-emerald-400">{prod.stock} in stock</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end">
                      {/* Floor Price Control */}
                      <div>
                        <span className="text-[10px] font-mono text-slate-400 uppercase">
                          Private Floor (Min Price)
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-xs font-mono text-slate-400">₹</span>
                          <input
                            type="number"
                            value={prod.minAcceptablePrice}
                            onChange={(e) => handleUpdateFloor(prod.id, Number(e.target.value))}
                            onClick={(e) => e.stopPropagation()}
                            className="w-20 px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs font-mono text-amber-300 focus:outline-none focus:border-amber-400"
                          />
                        </div>
                      </div>

                      {/* Stock Slider */}
                      <div>
                        <span className="text-[10px] font-mono text-slate-400 uppercase">
                          Stock Units
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <input
                            type="number"
                            value={prod.stock}
                            onChange={(e) => handleUpdateStock(prod.id, Number(e.target.value))}
                            onClick={(e) => e.stopPropagation()}
                            className="w-16 px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-400"
                          />
                        </div>
                      </div>

                      {/* Max Discount Tag */}
                      <div className="text-right">
                        <span className="text-[10px] font-mono text-slate-400 uppercase">
                          Max Discount
                        </span>
                        <div className="text-xs font-mono font-bold text-amber-400 mt-0.5">
                          {maxDiscount}%
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Col: Hackathon Seller Agent Simulator */}
        <div className="p-5 rounded-2xl border border-amber-500/40 bg-gradient-to-b from-[#13121C] to-[#0A0D15] shadow-2xl space-y-5">
          <div className="flex items-center justify-between border-b border-amber-500/20 pb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-amber-400" />
              <h3 className="font-display font-bold text-sm text-white">
                Seller Agent Simulator
              </h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 bg-amber-950 text-amber-300 rounded border border-amber-800">
              Judge Console
            </span>
          </div>

          <div className="space-y-3 text-xs font-mono">
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">Target Product:</span>
              <span className="text-white font-bold truncate max-w-[150px]">
                {selectedProduct.name}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">List Price:</span>
              <span className="text-white">₹{listPrice.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">Enforced Minimum Floor:</span>
              <span className="text-amber-400 font-bold">
                ₹{floorPrice.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">Max Discount Limit:</span>
              <span className="text-cyan-400">{allowableDiscountPercent}%</span>
            </div>
          </div>

          {/* Test Buyer Offer Input */}
          <div>
            <label className="block text-xs font-mono text-slate-300 mb-2">
              Simulate Incoming Buyer Offer:
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">₹</span>
              <input
                type="number"
                value={simulatedBuyerOffer}
                onChange={(e) => setSimulatedBuyerOffer(Number(e.target.value))}
                className="w-full pl-7 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* Agent Decision Output */}
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
            <div className="text-[10px] font-mono uppercase text-slate-400">
              Seller Agent Decision Tree:
            </div>
            {simulatedBuyerOffer >= floorPrice ? (
              <div className="text-xs text-emerald-400 font-mono">
                ✓ Offer ₹{simulatedBuyerOffer} is ABOVE internal floor (₹{floorPrice}). Action: Accept or Counter at ₹{Math.max(floorPrice, Math.min(listPrice, recommendedCounter))}.
              </div>
            ) : (
              <div className="text-xs text-amber-400 font-mono">
                ⚠ Offer ₹{simulatedBuyerOffer} is BELOW minimum floor (₹{floorPrice}). Action: Reject or Counter with baseline clearing rate ₹{floorPrice}.
              </div>
            )}
          </div>

          {/* Simulate Action Button */}
          <button
            onClick={() => onSimulateNegotiation(selectedProduct, simulatedBuyerOffer)}
            className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer transition-transform transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <Sparkles className="w-4 h-4 text-slate-950" />
            <span>Launch Live Negotiation With This SKU</span>
          </button>
        </div>
      </div>
    </div>
  );
};
