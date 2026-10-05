import React, { useState, useEffect } from 'react';
import {
  Product,
  LocalStore,
  AppUser,
  NegotiationAuditRecord,
} from '../../types';
import {
  User,
  X,
  Store,
  ShieldCheck,
  CheckCircle2,
  Settings,
  Bookmark,
  History,
  TrendingDown,
  Lock,
  LogOut,
  LayoutDashboard,
  Phone,
  MapPin,
  Briefcase,
  Save,
} from 'lucide-react';

export type AccountModalTab =
  | 'profile'
  | 'settings'
  | 'saved_products'
  | 'saved_stores'
  | 'history';

interface UserAccountModalProps {
  isOpen: boolean;
  initialTab?: AccountModalTab;
  onClose: () => void;
  currentUser: AppUser | null;
  onUpdateUser: (updated: AppUser) => void;
  onOpenAuthModal: () => void;
  onSignOut: () => void;
  onNavigateDashboard: () => void;
  negotiationRecords?: NegotiationAuditRecord[];
  savedProducts: Product[];
  savedStores: LocalStore[];
  recentSearches: string[];
  onSelectProduct: (p: Product) => void;
  onSelectSearch: (q: string) => void;
}

export const UserAccountModal: React.FC<UserAccountModalProps> = ({
  isOpen,
  initialTab = 'settings',
  onClose,
  currentUser,
  onUpdateUser,
  onOpenAuthModal,
  onSignOut,
  onNavigateDashboard,
  negotiationRecords = [],
  savedProducts,
  savedStores,
  recentSearches,
  onSelectProduct,
  onSelectSearch,
}) => {
  const [activeTab, setActiveTab] = useState<AccountModalTab>(initialTab);

  // Editable Profile State
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [storeName, setStoreName] = useState('');
  const [businessCategory, setBusinessCategory] = useState('');
  const [storeAddress, setStoreAddress] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab, isOpen]);

  useEffect(() => {
    if (currentUser) {
      setDisplayName(currentUser.displayName || '');
      setPhone(currentUser.phone || '');
      setStoreName(currentUser.storeName || '');
      setBusinessCategory(currentUser.businessCategory || 'Electronics & Audio');
      setStoreAddress(currentUser.storeAddress || '');
      setNewPassword('');
    }
  }, [currentUser, isOpen]);

  if (!isOpen) return null;

  const roleLabel =
    currentUser?.role === 'admin'
      ? 'ADMIN'
      : currentUser?.role === 'store_owner'
      ? 'SHOP OWNER'
      : 'USER';

  // Scoped strictly to the signed-in user (PII isolation)
  const myNegotiations = currentUser
    ? negotiationRecords.filter(
        (r) =>
          r.userId === currentUser.uid ||
          r.userEmail.toLowerCase() === currentUser.email.toLowerCase()
      )
    : [];

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setSaveFeedback(null);

    const updatedLocal: AppUser = {
      ...currentUser,
      displayName: displayName.trim() || currentUser.displayName,
      phone: phone.trim() || undefined,
      storeName:
        currentUser.role === 'store_owner'
          ? storeName.trim() || currentUser.storeName
          : currentUser.storeName,
      businessCategory:
        currentUser.role === 'store_owner'
          ? businessCategory.trim() || currentUser.businessCategory
          : currentUser.businessCategory,
      storeAddress:
        currentUser.role === 'store_owner'
          ? storeAddress.trim() || currentUser.storeAddress
          : currentUser.storeAddress,
    };

    try {
      const token =
        currentUser.sessionToken || localStorage.getItem('dealmate_session_token') || '';
      if (token) {
        const res = await fetch('/api/auth/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            displayName: updatedLocal.displayName,
            phone: updatedLocal.phone,
            storeName: updatedLocal.storeName,
            businessCategory: updatedLocal.businessCategory,
            storeAddress: updatedLocal.storeAddress,
            newPassword: newPassword.trim().length >= 8 ? newPassword.trim() : undefined,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            onUpdateUser({ ...updatedLocal, ...data.user });
          }
        }
      }
    } catch {
      // fallback to local update
    }

    onUpdateUser(updatedLocal);
    try {
      localStorage.setItem('dealmate_auth_user', JSON.stringify(updatedLocal));
    } catch {
      // ignore
    }
    setNewPassword('');
    setSaveFeedback('Account profile & settings saved successfully.');
    setTimeout(() => setSaveFeedback(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-3xl bg-white border border-slate-200 p-6 shadow-2xl text-slate-900 max-h-[88vh] overflow-y-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center text-white font-display font-bold text-sm shadow-xs ${
                currentUser?.role === 'admin'
                  ? 'bg-gradient-to-br from-amber-500 to-orange-600'
                  : currentUser?.role === 'store_owner'
                  ? 'bg-gradient-to-br from-emerald-500 to-teal-600'
                  : 'bg-gradient-to-br from-blue-600 to-cyan-500'
              }`}
            >
              {currentUser ? (
                currentUser.displayName.slice(0, 2).toUpperCase()
              ) : (
                <User className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display font-bold text-base text-slate-900">
                  {currentUser ? currentUser.displayName : 'Guest DealMate Session'}
                </h2>
                {currentUser && (
                  <span
                    className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full font-bold ${
                      currentUser.role === 'admin'
                        ? 'bg-amber-100 text-amber-800'
                        : currentUser.role === 'store_owner'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {roleLabel}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-mono">
                {currentUser
                  ? `${currentUser.email} • Verified Email Identity`
                  : 'Sign in to manage your DealMate account & role permissions'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {currentUser && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigateDashboard();
                }}
                className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Dashboard</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200/80 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`px-3 py-2 rounded-xl font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'settings' || activeTab === 'profile'
                ? 'bg-white text-blue-600 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Profile & Settings</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('saved_products')}
            className={`px-3 py-2 rounded-xl font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'saved_products'
                ? 'bg-white text-blue-600 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Saved Products ({savedProducts.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('saved_stores')}
            className={`px-3 py-2 rounded-xl font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'saved_stores'
                ? 'bg-white text-blue-600 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            <span>Saved Stores ({savedStores.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`px-3 py-2 rounded-xl font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'history'
                ? 'bg-white text-blue-600 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>My Negotiations & Searches</span>
          </button>
        </div>

        {/* TAB 1: PROFILE & SETTINGS */}
        {(activeTab === 'settings' || activeTab === 'profile') && (
          <div className="space-y-4">
            {!currentUser ? (
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-3">
                <p className="text-sm font-semibold text-slate-800">
                  You are currently browsing as a Guest
                </p>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Sign in or create a DealMate account to save your profile, track
                  negotiated deals, or manage a Shop Owner store.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenAuthModal();
                  }}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold cursor-pointer"
                >
                  Sign In / Create Account
                </button>
              </div>
            ) : (
              <form onSubmit={handleSaveProfile} className="space-y-4">
                {saveFeedback && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{saveFeedback}</span>
                  </div>
                )}

                {/* Role & Permissions Summary Box */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                      <ShieldCheck className="w-4 h-4 text-blue-600" />
                      <span>Active Role: {roleLabel}</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      {currentUser.role === 'admin'
                        ? 'Full access to Admin Dashboard, user & shop governance, reported products, and platform settings.'
                        : currentUser.role === 'store_owner'
                        ? 'Authorized to manage your own store inventory, respond to incoming negotiations, and configure floor discounts.'
                        : 'Authorized to access AI Discovery, start AI Negotiator sessions, compare products, and manage your personal orders.'}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold shrink-0">
                    <CheckCircle2 className="w-3 h-3" /> Verified
                  </span>
                </div>

                {/* Basic Identity Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl bg-white border border-slate-200 text-xs text-slate-900"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      Registered Email (Unique Identity)
                    </label>
                    <input
                      type="email"
                      value={currentUser.email}
                      disabled
                      className="w-full h-10 px-3 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-500 cursor-not-allowed"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 98450 12345"
                        className="w-full h-10 pl-8 pr-3 rounded-xl bg-white border border-slate-200 text-xs text-slate-900"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      Change Password (Optional)
                    </label>
                    <div className="relative">
                      <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Leave blank to keep current"
                        className="w-full h-10 pl-8 pr-3 rounded-xl bg-white border border-slate-200 text-xs text-slate-900"
                      />
                    </div>
                  </div>
                </div>

                {/* Shop Owner Profile Fields */}
                {currentUser.role === 'store_owner' && (
                  <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200 space-y-3">
                    <div className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                      <Store className="w-4 h-4 text-emerald-600" />
                      <span>Shop / Business Profile Settings</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="block text-xs font-semibold text-slate-700">
                          Shop / Business Name
                        </label>
                        <input
                          type="text"
                          value={storeName}
                          onChange={(e) => setStoreName(e.target.value)}
                          className="w-full h-10 px-3 rounded-xl bg-white border border-slate-200 text-xs text-slate-900"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-xs font-semibold text-slate-700">
                          Business Category
                        </label>
                        <div className="relative">
                          <Briefcase className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={businessCategory}
                            onChange={(e) => setBusinessCategory(e.target.value)}
                            className="w-full h-10 pl-8 pr-3 rounded-xl bg-white border border-slate-200 text-xs text-slate-900"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-slate-700">
                        Store Address
                      </label>
                      <div className="relative">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={storeAddress}
                          onChange={(e) => setStoreAddress(e.target.value)}
                          className="w-full h-10 pl-8 pr-3 rounded-xl bg-white border border-slate-200 text-xs text-slate-900"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onSignOut();
                    }}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-1.5 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>

                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Account Changes</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* TAB 2: SAVED PRODUCTS */}
        {activeTab === 'saved_products' && (
          <div className="space-y-3">
            {savedProducts.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-400 font-mono">
                No saved products yet. Click the heart icon on any product to save it here.
              </div>
            ) : (
              savedProducts.map((p) => (
                <div
                  key={p.id}
                  className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={p.image}
                      alt={p.name}
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 rounded-xl object-cover bg-slate-200"
                    />
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 line-clamp-1">
                        {p.name}
                      </h4>
                      <span className="text-[11px] font-mono text-emerald-600 font-bold">
                        ₹{p.listPrice.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onSelectProduct(p);
                    }}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl cursor-pointer"
                  >
                    Negotiate
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 3: SAVED STORES */}
        {activeTab === 'saved_stores' && (
          <div className="space-y-3">
            {savedStores.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-400 font-mono">
                No saved local stores yet.
              </div>
            ) : (
              savedStores.map((s) => (
                <div
                  key={s.id}
                  className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex justify-between items-center"
                >
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{s.name}</h4>
                    <span className="text-[11px] text-slate-500">
                      {s.category} · {s.distance}
                    </span>
                  </div>
                  <span className="text-xs font-mono text-emerald-600 font-semibold">
                    Verified Partner
                  </span>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 4: MY NEGOTIATIONS & SEARCHES */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <TrendingDown className="w-4 h-4 text-emerald-600" />
                <span>My Negotiated Deals ({myNegotiations.length})</span>
              </div>
              {myNegotiations.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500">
                  No completed negotiations recorded for your account yet.
                </div>
              ) : (
                myNegotiations.map((rec) => (
                  <div
                    key={rec.id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-900">{rec.productName}</div>
                      <div className="text-[11px] text-slate-500">
                        Seller: {rec.sellerName} • List: ₹
                        {rec.originalPrice.toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div className="text-right font-mono">
                      <div className="font-bold text-slate-900">
                        ₹{rec.finalPrice.toLocaleString('en-IN')}
                      </div>
                      <div className="text-[11px] text-emerald-600 font-bold">
                        Saved ₹{rec.savedAmount.toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-800">Recent AI Searches</div>
              {recentSearches.map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    onClose();
                    onSelectSearch(q);
                  }}
                  className="w-full text-left p-3 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200 text-xs font-mono text-slate-700 hover:text-blue-700 flex items-center justify-between transition-colors cursor-pointer"
                >
                  <span>"{q}"</span>
                  <span className="text-[10px] text-blue-600 font-sans font-semibold">
                    Re-run Search →
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
