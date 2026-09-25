import React, { useState } from 'react';
import { Store, Sparkles, CheckCircle, ArrowRight, ShieldCheck, Upload } from 'lucide-react';

export const ForBusinessView: React.FC = () => {
  const [businessName, setBusinessName] = useState('');
  const [category, setCategory] = useState('Fashion & Apparel');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [openingHours, setOpeningHours] = useState('10:00 AM – 9:00 PM');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="space-y-12 max-w-4xl mx-auto">
      {/* Top Banner */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-700/60 text-xs font-mono text-emerald-300">
          <Store className="w-3.5 h-3.5" />
          <span>For Retailers & Brand Merchants</span>
        </div>

        <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-white tracking-tight">
          List Your Store and Let AI Connect You With Ready Buyers
        </h1>

        <p className="text-sm text-slate-300 leading-relaxed">
          List your store and let AI connect your products with customers looking for exactly what you sell, matching real budgets and immediate purchasing intent.
        </p>
      </div>

      {/* Benefits Triad */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-5 rounded-2xl bg-[#0B0F19] border border-slate-800 space-y-2">
          <CheckCircle className="w-5 h-5 text-emerald-400" />
          <h3 className="font-display font-bold text-sm text-white">Targeted Budget Matching</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Customers arrive with verified budgets. You only receive leads that fit your inventory margins.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-[#0B0F19] border border-slate-800 space-y-2">
          <CheckCircle className="w-5 h-5 text-cyan-400" />
          <h3 className="font-display font-bold text-sm text-white">Automated Store Agent</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Your customized Store AI negotiates within your strictly enforced margin floors 24/7 without manual intervention.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-[#0B0F19] border border-slate-800 space-y-2">
          <CheckCircle className="w-5 h-5 text-indigo-400" />
          <h3 className="font-display font-bold text-sm text-white">Drive Footfall & WhatsApp Orders</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Direct customer directions, phone inquiries, and 1-tap WhatsApp ordering right from recommendation cards.
          </p>
        </div>
      </div>

      {/* Listing Registration Form */}
      <div className="p-8 rounded-3xl bg-[#0A0E18] border border-slate-800 shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h2 className="font-display font-bold text-lg text-white">List Your Business Store</h2>
            <p className="text-xs text-slate-400 font-mono">Instant verification within 24 hours</p>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
            Zero Listing Fee
          </span>
        </div>

        {submitted ? (
          <div className="py-12 text-center space-y-3">
            <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto" />
            <h3 className="font-display font-bold text-lg text-white">Store Application Received!</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Our merchant onboarding team will audit "{businessName}" and activate your Store AI agent within 24 hours.
            </p>
            <button
              onClick={() => setSubmitted(false)}
              className="mt-4 px-4 py-2 bg-slate-800 text-xs font-mono text-cyan-300 rounded-xl"
            >
              Submit Another Listing
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">Business Name</label>
                <input
                  type="text"
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. Metro Fashion & Co."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">Retail Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400"
                >
                  <option>Fashion & Apparel</option>
                  <option>Footwear & Kicks</option>
                  <option>Supermarket & Grocery</option>
                  <option>Consumer Electronics</option>
                  <option>Beauty & Cosmetics</option>
                  <option>Home & Kitchen</option>
                  <option>Gifts & Hampers</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-mono text-slate-400 mb-1">Physical Store Address</label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street, Landmark, Area, City"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">Phone Number</label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 00000"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">WhatsApp Business Number</label>
                <input
                  type="text"
                  required
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="+91 98765 00000"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">Operating Hours</label>
                <input
                  type="text"
                  value={openingHours}
                  onChange={(e) => setOpeningHours(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 font-bold text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-transform transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <Sparkles className="w-4 h-4 text-slate-950" />
              <span>List My Store on SmartBuy AI</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
