import React, { useState } from 'react';
import { Product, LocalStore } from '../../types';
import {
  ShieldAlert,
  Search,
  Plus,
  Trash2,
  Edit2,
  Check,
  Package,
  Store,
  Users,
  Star,
  DollarSign
} from 'lucide-react';

interface AdminDashboardProps {
  products: Product[];
  stores: LocalStore[];
  onUpdateProductPrice: (productId: string, newPrice: number) => void;
  onDeleteProduct: (productId: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  products,
  stores,
  onUpdateProductPrice,
  onDeleteProduct,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'products' | 'stores' | 'analytics'>('products');
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [tempPrice, setTempPrice] = useState<number>(0);

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sellerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleStartEdit = (p: Product) => {
    setEditingPriceId(p.id);
    setTempPrice(p.listPrice);
  };

  const handleSavePrice = (id: string) => {
    onUpdateProductPrice(id, tempPrice);
    setEditingPriceId(null);
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-[#0B0F19] to-[#0A0D18] border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 font-bold uppercase mb-1">
            <ShieldAlert className="w-4 h-4 text-cyan-400" />
            <span>SmartBuy AI Platform Administration Console</span>
          </div>
          <h1 className="font-display font-bold text-xl text-white">
            Catalog & Merchant Control Dashboard
          </h1>
          <p className="text-xs text-slate-400">
            Manage live products, partner store profiles, price rules, and AI recommendation weighting.
          </p>
        </div>

        {/* Tab switchers */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 rounded-xl border border-slate-800 text-xs font-mono">
          <button
            onClick={() => setActiveTab('products')}
            className={`px-3 py-1.5 rounded-lg cursor-pointer ${
              activeTab === 'products' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Products ({products.length})
          </button>
          <button
            onClick={() => setActiveTab('stores')}
            className={`px-3 py-1.5 rounded-lg cursor-pointer ${
              activeTab === 'stores' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Stores ({stores.length})
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-3 py-1.5 rounded-lg cursor-pointer ${
              activeTab === 'analytics' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            System Metrics
          </button>
        </div>
      </div>

      {activeTab === 'products' && (
        <div className="space-y-4">
          {/* Search bar */}
          <div className="relative max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search SKU, category or merchant..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
            />
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-[#090D15]">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Item</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">List Price</th>
                  <th className="py-3 px-4">Floor (Min)</th>
                  <th className="py-3 px-4">Merchant Store</th>
                  <th className="py-3 px-4">Stock</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-900/40">
                    <td className="py-3 px-4 flex items-center gap-3">
                      <img
                        src={p.image}
                        alt={p.name}
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-lg object-cover bg-slate-800 shrink-0"
                      />
                      <span className="font-sans font-semibold text-white truncate max-w-[200px]">
                        {p.name}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-300">{p.category}</td>
                    <td className="py-3 px-4">
                      {editingPriceId === p.id ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={tempPrice}
                            onChange={(e) => setTempPrice(Number(e.target.value))}
                            className="w-20 px-1 py-0.5 bg-slate-800 border border-cyan-400 rounded text-xs text-white"
                          />
                          <button
                            onClick={() => handleSavePrice(p.id)}
                            className="p-1 text-emerald-400 hover:text-white"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className="font-bold text-white">
                          ₹{p.listPrice.toLocaleString('en-IN')}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-amber-400">
                      ₹{p.minAcceptablePrice.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-slate-400">{p.sellerName}</td>
                    <td className="py-3 px-4 text-emerald-400">{p.stock}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleStartEdit(p)}
                          className="p-1 rounded text-slate-400 hover:text-cyan-300"
                          title="Edit price"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteProduct(p.id)}
                          className="p-1 rounded text-slate-400 hover:text-rose-400"
                          title="Delete SKU"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'stores' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {stores.map((s) => (
            <div key={s.id} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-white text-sm">{s.name}</h4>
                  <span className="text-xs text-emerald-400 font-mono">{s.category} · {s.distance}</span>
                </div>
                <span className="text-xs font-mono text-amber-400">★ {s.rating}</span>
              </div>
              <p className="text-xs text-slate-400">{s.address}</p>
              <div className="text-[11px] font-mono text-slate-500">Phone: {s.phone}</div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <span className="text-xs font-mono uppercase text-slate-400">Total Catalog Items</span>
            <div className="text-3xl font-extrabold font-mono text-white mt-1">{products.length}</div>
            <p className="text-xs text-slate-500 mt-1">Active AI-bargainable SKUs</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <span className="text-xs font-mono uppercase text-slate-400">Verified Partner Stores</span>
            <div className="text-3xl font-extrabold font-mono text-emerald-400 mt-1">{stores.length}</div>
            <p className="text-xs text-slate-500 mt-1">Neighborhood retail locations</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <span className="text-xs font-mono uppercase text-slate-400">Average Savings Delivered</span>
            <div className="text-3xl font-extrabold font-mono text-cyan-400 mt-1">18.4%</div>
            <p className="text-xs text-slate-500 mt-1">Saved per accepted negotiation</p>
          </div>
        </div>
      )}
    </div>
  );
};
