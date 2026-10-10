import React, { useState } from 'react';
import {
  Product,
  LocalStore,
  AppUser,
  NegotiationAuditRecord,
  CategoryNegotiationSetting,
  AccountStatus,
  ShopApprovalStatus,
  ReportedProductItem,
  PlatformSettings,
} from '../../types';
import {
  BarChart3,
  Package,
  Store,
  TrendingDown,
  Plus,
  Trash2,
  Edit3,
  Check,
  X,
  ShieldCheck,
  Users,
  Search,
  Sparkles,
  QrCode,
  Sliders,
  Lock,
  ArrowUpRight,
  AlertTriangle,
  Settings,
  Ban,
  CheckCircle2,
  XCircle,
  Clock,
  Activity,
} from 'lucide-react';
import { INITIAL_REPORTED_PRODUCTS } from '../../data/catalog';
import { ThemeId, THEMES } from '../../types/theme';

interface AdminDashboardProps {
  products: Product[];
  stores: LocalStore[];
  registeredUsers: AppUser[];
  negotiationRecords: NegotiationAuditRecord[];
  categorySettings?: CategoryNegotiationSetting[];
  currentUser: AppUser | null;
  onOpenAuthModal: () => void;
  onUpdateProductPrice: (productId: string, newPrice: number) => void;
  onDeleteProduct: (productId: string) => void;
  onUpdateUserStatus?: (uid: string, status: AccountStatus) => void;
  onUpdateShopApproval?: (uid: string, status: ShopApprovalStatus) => void;
  currentThemeId?: ThemeId;
}

type AdminTab =
  | 'overview'
  | 'users'
  | 'shop_owners'
  | 'products'
  | 'negotiations'
  | 'settings';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  products,
  registeredUsers,
  negotiationRecords,
  categorySettings = [],
  currentUser,
  onOpenAuthModal,
  onUpdateProductPrice,
  onDeleteProduct,
  onUpdateUserStatus,
  onUpdateShopApproval,
  currentThemeId = 'pure-white',
}) => {
  const currentTheme = THEMES[currentThemeId] || THEMES['pure-white'];
  const isLight = currentTheme.isLight;

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempPrice, setTempPrice] = useState<number>(0);
  const [userSearch, setUserSearch] = useState<string>('');
  const [productSearch, setProductSearch] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const [reportedProducts, setReportedProducts] = useState<ReportedProductItem[]>(
    INITIAL_REPORTED_PRODUCTS
  );

  const [platformSettings, setPlatformSettings] = useState<PlatformSettings>({
    requireShopOwnerApproval: true,
    requireEmailVerification: true,
    defaultMaxSingleDiscountPct: 35,
    defaultMaxBundleDiscountPct: 40,
    allowExternalRetailerFallback: true,
    platformSupportEmail: 'support@dealmate.ai',
  });

  // Strict RBAC Protection: Only ADMIN role can access Admin Dashboard
  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="max-w-xl mx-auto my-8 sm:my-12 p-6 sm:p-8 rounded-3xl bg-[#0B101D] border border-amber-500/30 text-center space-y-5 shadow-2xl">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
          <Lock className="w-7 h-7" />
        </div>
        <div className="space-y-2">
          <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-mono uppercase font-bold">
            Protected Route • /admin
          </span>
          <h2 className="font-display font-bold text-xl sm:text-2xl text-white">
            Administrator Authentication Required
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            {currentUser
              ? `You are currently signed in as "${currentUser.displayName}" (${currentUser.role.toUpperCase()}). Users and Shop Owners are not authorized to access platform administration.`
              : 'Please authenticate through the protected Admin Login portal to manage platform users, shop owners, products, and analytics.'}
          </p>
        </div>
        <div className="pt-2">
          <button
            type="button"
            onClick={onOpenAuthModal}
            className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-display font-bold text-xs sm:text-sm inline-flex items-center gap-2 cursor-pointer shadow-lg transition-colors"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Sign In as Administrator</span>
          </button>
        </div>
      </div>
    );
  }

  const notify = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 3500);
  };

  const buyers = registeredUsers.filter((u) => u.role === 'user');
  const storeOwners = registeredUsers.filter((u) => u.role === 'store_owner');
  const storeOwnerListedProducts = products.filter(
    (p) => p.isStoreOwnerListed || p.isLocalStore
  );

  const totalUserSavingsFromProfiles = buyers.reduce(
    (acc, u) => acc + (u.totalSaved || 0),
    0
  );
  const totalDealSavingsFromRecords = negotiationRecords.reduce(
    (acc, r) => acc + r.savedAmount,
    0
  );
  const combinedSavings = Math.max(
    totalUserSavingsFromProfiles,
    totalDealSavingsFromRecords
  );

  const filteredUsers = registeredUsers.filter(
    (u) =>
      u.displayName.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.role.toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.brand.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.sellerName.toLowerCase().includes(productSearch.toLowerCase())
  );

  const handleAccountStatusChange = async (user: AppUser, status: AccountStatus) => {
    if (onUpdateUserStatus) {
      onUpdateUserStatus(user.uid, status);
    }
    try {
      const savedSession = localStorage.getItem('dealmate_active_user_session');
      const token = savedSession ? JSON.parse(savedSession)?.sessionToken : '';
      await fetch(`/api/admin/users/${encodeURIComponent(user.uid)}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ accountStatus: status }),
      });
    } catch {
      // Fallback handled in local state
    }
    notify(`Updated ${user.displayName} account status to ${status.toUpperCase()}.`);
  };

  const handleShopApprovalChange = async (
    shopOwner: AppUser,
    approval: ShopApprovalStatus
  ) => {
    if (onUpdateShopApproval) {
      onUpdateShopApproval(shopOwner.uid, approval);
    }
    try {
      const savedSession = localStorage.getItem('dealmate_active_user_session');
      const token = savedSession ? JSON.parse(savedSession)?.sessionToken : '';
      await fetch(`/api/admin/shop-owners/${encodeURIComponent(shopOwner.uid)}/approval`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ shopApprovalStatus: approval }),
      });
    } catch {
      // Fallback handled in local state
    }
    notify(
      `Shop Owner "${shopOwner.storeName || shopOwner.displayName}" marked as ${approval.toUpperCase()}.`
    );
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Status Toast */}
      {statusMessage && (
        <div className="fixed bottom-5 right-5 z-50 px-4 py-3 rounded-2xl bg-emerald-950 border border-emerald-500/40 text-emerald-200 text-xs font-medium shadow-2xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Top Admin Command Header */}
      <div
        className={`p-5 sm:p-6 rounded-3xl transition-all duration-300 flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
          isLight
            ? 'bg-gradient-to-r from-blue-50/80 via-white to-sky-50/70 border border-blue-200/60 shadow-sm text-slate-900'
            : 'bg-[#0B101D] border border-slate-800 text-white shadow-xl'
        }`}
      >
        <div className="space-y-1">
          <div
            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-mono uppercase font-bold transition-colors ${
              isLight
                ? 'bg-blue-50 border border-blue-200 text-blue-700'
                : 'bg-amber-500/10 border border-amber-500/30 text-amber-300'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>DealMate Platform Administration • RBAC Verified</span>
          </div>
          <h1
            className={`font-display font-bold text-xl sm:text-2xl tracking-tight transition-colors ${
              isLight ? 'text-[#0f172a]' : 'text-white'
            }`}
          >
            Admin Control Center
          </h1>
          <p
            className={`text-xs sm:text-sm leading-relaxed transition-colors ${
              isLight ? 'text-slate-600' : 'text-slate-400'
            }`}
          >
            Signed in as{' '}
            <strong className={isLight ? 'text-slate-900 font-bold' : 'text-white'}>
              {currentUser.displayName}
            </strong>{' '}
            ({currentUser.email})
          </p>
        </div>

        {/* Navigation Sub-Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {[
            { id: 'overview', label: 'Analytics', icon: BarChart3 },
            { id: 'users', label: `Users (${registeredUsers.length})`, icon: Users },
            { id: 'shop_owners', label: `Shop Owners (${storeOwners.length})`, icon: Store },
            { id: 'products', label: `Products (${products.length})`, icon: Package },
            {
              id: 'negotiations',
              label: `Negotiations (${negotiationRecords.length})`,
              icon: TrendingDown,
            },
            { id: 'settings', label: 'Settings', icon: Settings },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as AdminTab)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-colors ${
                  active
                    ? isLight
                      ? 'bg-blue-600 text-white font-bold shadow-xs'
                      : 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : isLight
                    ? 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* KPI Summary Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div
          className={`p-4 rounded-2xl border transition-all ${
            isLight
              ? 'bg-white border-slate-200 shadow-xs'
              : 'bg-[#0B101D] border border-slate-800'
          }`}
        >
          <div className="text-[11px] font-mono uppercase text-slate-500">Platform Users</div>
          <div
            className={`text-xl sm:text-2xl font-mono font-extrabold mt-1 ${
              isLight ? 'text-[#0f172a]' : 'text-white'
            }`}
          >
            {registeredUsers.length}
          </div>
          <div className={`text-[11px] mt-0.5 ${isLight ? 'text-blue-600 font-semibold' : 'text-cyan-400'}`}>
            {buyers.length} Buyers • {storeOwners.length} Shop Owners
          </div>
        </div>

        <div
          className={`p-4 rounded-2xl border transition-all ${
            isLight
              ? 'bg-white border-slate-200 shadow-xs'
              : 'bg-[#0B101D] border border-slate-800'
          }`}
        >
          <div className="text-[11px] font-mono uppercase text-slate-500">Total Deal Savings</div>
          <div className="text-xl sm:text-2xl font-mono font-extrabold text-emerald-600 mt-1">
            ₹{combinedSavings.toLocaleString('en-IN')}
          </div>
          <div className={`text-[11px] mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            Across {negotiationRecords.length} verified negotiations
          </div>
        </div>

        <div
          className={`p-4 rounded-2xl border transition-all ${
            isLight
              ? 'bg-white border-slate-200 shadow-xs'
              : 'bg-[#0B101D] border border-slate-800'
          }`}
        >
          <div className="text-[11px] font-mono uppercase text-slate-500">Active Products</div>
          <div
            className={`text-xl sm:text-2xl font-mono font-extrabold mt-1 ${
              isLight ? 'text-[#0f172a]' : 'text-white'
            }`}
          >
            {products.length}
          </div>
          <div className={`text-[11px] mt-0.5 ${isLight ? 'text-indigo-600 font-semibold' : 'text-indigo-400'}`}>
            {storeOwnerListedProducts.length} Store Owner QR verified
          </div>
        </div>

        <div
          className={`p-4 rounded-2xl border transition-all ${
            isLight
              ? 'bg-white border-slate-200 shadow-xs'
              : 'bg-[#0B101D] border border-slate-800'
          }`}
        >
          <div className="text-[11px] font-mono uppercase text-slate-500">Category Rules</div>
          <div className="text-xl sm:text-2xl font-mono font-extrabold text-amber-600 mt-1">
            {categorySettings.length}
          </div>
          <div className={`text-[11px] mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            Max Single Cap: {platformSettings.defaultMaxSingleDiscountPct}%
          </div>
        </div>
      </div>

      {/* TAB 1: OVERVIEW & ANALYTICS */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Recent Negotiations Feed */}
          <div
            className={`rounded-3xl border p-5 space-y-4 shadow-xs transition-all ${
              isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#0B101D] border-slate-800 text-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <h2
                className={`font-display font-bold text-base sm:text-lg flex items-center gap-2 ${
                  isLight ? 'text-[#0f172a]' : 'text-white'
                }`}
              >
                <Activity className="w-4 h-4 text-emerald-500" />
                <span>Live Negotiation Telemetry</span>
              </h2>
              <button
                type="button"
                onClick={() => setActiveTab('negotiations')}
                className={`text-xs font-mono font-bold hover:underline cursor-pointer ${
                  isLight ? 'text-blue-600' : 'text-cyan-400'
                }`}
              >
                View All
              </button>
            </div>
            <div className="space-y-2.5">
              {negotiationRecords.slice(0, 5).map((rec) => (
                <div
                  key={rec.id}
                  className={`p-3 rounded-2xl border flex items-center justify-between gap-3 text-xs transition-colors ${
                    isLight
                      ? 'bg-slate-50 border-slate-200 text-slate-900'
                      : 'bg-slate-900/90 border-slate-800 text-white'
                  }`}
                >
                  <div className="min-w-0">
                    <div
                      className={`font-bold truncate ${
                        isLight ? 'text-slate-900' : 'text-white'
                      }`}
                    >
                      {rec.productName}
                    </div>
                    <div
                      className={`text-[11px] truncate mt-0.5 ${
                        isLight ? 'text-slate-500' : 'text-slate-400'
                      }`}
                    >
                      Buyer: {rec.userName} • Store: {rec.sellerName}
                    </div>
                  </div>
                  <div className="text-right font-mono shrink-0">
                    <div className="font-bold text-emerald-600">
                      ₹{rec.finalPrice.toLocaleString('en-IN')}
                    </div>
                    <div
                      className={`text-[10px] ${
                        isLight ? 'text-slate-500' : 'text-slate-400'
                      }`}
                    >
                      Saved ₹{rec.savedAmount.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pending Shop Owners & Reported Items */}
          <div
            className={`rounded-3xl border p-5 space-y-4 shadow-xs transition-all ${
              isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#0B101D] border-slate-800 text-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <h2
                className={`font-display font-bold text-base sm:text-lg flex items-center gap-2 ${
                  isLight ? 'text-[#0f172a]' : 'text-white'
                }`}
              >
                <Store className="w-4 h-4 text-amber-500" />
                <span>Shop Owner Verification Queue</span>
              </h2>
              <button
                type="button"
                onClick={() => setActiveTab('shop_owners')}
                className={`text-xs font-mono font-bold hover:underline cursor-pointer ${
                  isLight ? 'text-amber-700' : 'text-amber-400'
                }`}
              >
                Manage All
              </button>
            </div>
            <div className="space-y-2.5">
              {storeOwners.map((owner) => {
                const approval = owner.shopApprovalStatus || 'approved';
                return (
                  <div
                    key={owner.uid}
                    className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition-colors ${
                      isLight
                        ? 'bg-slate-50 border-slate-200 text-slate-900'
                        : 'bg-slate-900/90 border-slate-800 text-white'
                    }`}
                  >
                    <div>
                      <div
                        className={`font-bold flex items-center gap-2 ${
                          isLight ? 'text-slate-900' : 'text-white'
                        }`}
                      >
                        <span>{owner.storeName || owner.displayName}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold ${
                            approval === 'approved'
                              ? isLight
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-emerald-500/15 text-emerald-300'
                              : approval === 'pending'
                              ? isLight
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-amber-500/15 text-amber-300'
                              : isLight
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-rose-500/15 text-rose-300'
                          }`}
                        >
                          {approval}
                        </span>
                      </div>
                      <div
                        className={`text-[11px] mt-0.5 ${
                          isLight ? 'text-slate-500' : 'text-slate-400'
                        }`}
                      >
                        Owner: {owner.displayName} ({owner.email}) •{' '}
                        {owner.businessCategory || 'Retail'}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleShopApprovalChange(owner, 'approved')}
                        className={`px-2.5 py-1.5 rounded-lg font-semibold text-[11px] cursor-pointer transition-colors ${
                          isLight
                            ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800'
                            : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300'
                        }`}
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => handleShopApprovalChange(owner, 'rejected')}
                        className={`px-2.5 py-1.5 rounded-lg font-semibold text-[11px] cursor-pointer transition-colors ${
                          isLight
                            ? 'bg-rose-100 hover:bg-rose-200 text-rose-800'
                            : 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300'
                        }`}
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PLATFORM USERS MANAGEMENT */}
      {activeTab === 'users' && (
        <div
          className={`rounded-3xl border p-5 space-y-4 shadow-xs transition-all ${
            isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#0B101D] border-slate-800 text-white'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2
              className={`font-display font-bold text-lg ${
                isLight ? 'text-[#0f172a]' : 'text-white'
              }`}
            >
              Registered Platform Accounts ({filteredUsers.length})
            </h2>
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search by name, email, or role..."
                className={`w-full pl-9 pr-3 py-2 rounded-xl text-xs focus:outline-none transition-colors ${
                  isLight
                    ? 'bg-white border border-slate-300 text-slate-900 placeholder-slate-400 focus:border-blue-500'
                    : 'bg-slate-900 border border-slate-700 text-white focus:border-amber-400'
                }`}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr
                  className={`border-b text-[11px] font-mono uppercase ${
                    isLight
                      ? 'border-slate-200 text-slate-500 bg-slate-50/50'
                      : 'border-slate-800 text-slate-400'
                  }`}
                >
                  <th className="py-3 px-3">User / Email</th>
                  <th className="py-3 px-3">Role</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Activity</th>
                  <th className="py-3 px-3 text-right">Admin Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isLight ? 'divide-slate-200' : 'divide-slate-800/70'}`}>
                {filteredUsers.map((u) => {
                  const status = u.accountStatus || 'active';
                  return (
                    <tr
                      key={u.uid}
                      className={`transition-colors ${
                        isLight ? 'hover:bg-slate-50/80 text-slate-800' : 'hover:bg-slate-900/50 text-white'
                      }`}
                    >
                      <td className="py-3 px-3">
                        <div
                          className={`font-bold ${
                            isLight ? 'text-slate-900' : 'text-white'
                          }`}
                        >
                          {u.displayName}
                        </div>
                        <div
                          className={`text-[11px] font-mono ${
                            isLight ? 'text-slate-500' : 'text-slate-400'
                          }`}
                        >
                          {u.email}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-mono uppercase font-bold ${
                            u.role === 'admin'
                              ? isLight
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                              : u.role === 'store_owner'
                              ? isLight
                                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                              : isLight
                              ? 'bg-slate-100 text-slate-700 border border-slate-200'
                              : 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                          }`}
                        >
                          {u.role === 'store_owner' ? 'SHOP_OWNER' : u.role.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold ${
                            status === 'active'
                              ? isLight
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-emerald-500/15 text-emerald-300'
                              : isLight
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-rose-500/15 text-rose-300'
                          }`}
                        >
                          {status}
                        </span>
                      </td>
                      <td
                        className={`py-3 px-3 font-mono text-[11px] ${
                          isLight ? 'text-slate-600' : 'text-slate-300'
                        }`}
                      >
                        {u.negotiationsCount} deals • Saved ₹
                        {(u.totalSaved || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3 text-right">
                        {u.role !== 'admin' && (
                          <div className="inline-flex items-center gap-1.5">
                            {status !== 'active' ? (
                              <button
                                type="button"
                                onClick={() => handleAccountStatusChange(u, 'active')}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer transition-colors ${
                                  isLight
                                    ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800'
                                    : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300'
                                }`}
                              >
                                Activate
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleAccountStatusChange(u, 'disabled')}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer transition-colors ${
                                  isLight
                                    ? 'bg-rose-100 hover:bg-rose-200 text-rose-800'
                                    : 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300'
                                }`}
                              >
                                Disable
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: SHOP OWNERS & APPROVALS */}
      {activeTab === 'shop_owners' && (
        <div
          className={`rounded-3xl border p-5 space-y-4 shadow-xs transition-all ${
            isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#0B101D] border-slate-800 text-white'
          }`}
        >
          <h2
            className={`font-display font-bold text-lg ${
              isLight ? 'text-[#0f172a]' : 'text-white'
            }`}
          >
            Shop Owner Accounts & Store Verification ({storeOwners.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {storeOwners.map((owner) => {
              const approval = owner.shopApprovalStatus || 'approved';
              return (
                <div
                  key={owner.uid}
                  className={`p-4 rounded-2xl border space-y-3 transition-colors ${
                    isLight
                      ? 'bg-slate-50 border-slate-200 text-slate-900'
                      : 'bg-slate-900/90 border-slate-800 text-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div
                        className={`font-display font-bold text-base ${
                          isLight ? 'text-slate-900' : 'text-white'
                        }`}
                      >
                        {owner.storeName || owner.displayName}
                      </div>
                      <div
                        className={`text-xs mt-0.5 ${
                          isLight ? 'text-slate-500' : 'text-slate-400'
                        }`}
                      >
                        Owner: {owner.displayName} • {owner.email}
                      </div>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-mono uppercase font-bold ${
                        approval === 'approved'
                          ? isLight
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                          : approval === 'pending'
                          ? isLight
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                          : isLight
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                      }`}
                    >
                      {approval}
                    </span>
                  </div>

                  <div
                    className={`text-xs space-y-1 font-mono ${
                      isLight ? 'text-slate-600' : 'text-slate-300'
                    }`}
                  >
                    <div>Category: {owner.businessCategory || 'Multi-Category Retail'}</div>
                    <div>Address: {owner.storeAddress || 'Bengaluru, KA'}</div>
                    <div>Phone: {owner.phone || '+91 98765 43210'}</div>
                  </div>

                  <div
                    className={`pt-2 border-t flex items-center justify-end gap-2 ${
                      isLight ? 'border-slate-200' : 'border-slate-800'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleShopApprovalChange(owner, 'approved')}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs cursor-pointer transition-colors ${
                        isLight
                          ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                          : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                      }`}
                    >
                      Approve Shop
                    </button>
                    <button
                      type="button"
                      onClick={() => handleShopApprovalChange(owner, 'rejected')}
                      className={`px-3 py-1.5 rounded-xl font-semibold text-xs cursor-pointer transition-colors ${
                        isLight
                          ? 'bg-rose-100 hover:bg-rose-200 text-rose-800'
                          : 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300'
                      }`}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: PRODUCTS & REPORTED PRODUCTS */}
      {activeTab === 'products' && (
        <div className="space-y-5">
          {/* Reported Products Moderation */}
          {reportedProducts.length > 0 && (
            <div className="rounded-3xl bg-[#0B101D] border border-rose-500/30 p-5 space-y-3">
              <h3 className="font-display font-bold text-base text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>Reported Products Queue ({reportedProducts.length})</span>
              </h3>
              <div className="space-y-2">
                {reportedProducts.map((rep) => (
                  <div
                    key={rep.id}
                    className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="font-bold text-white">
                        {rep.productName}{' '}
                        <span className="text-slate-400 font-normal">({rep.sellerName})</span>
                      </div>
                      <div className="text-[11px] text-rose-300 mt-0.5">
                        Reason: {rep.reason} • Reported by {rep.reportedByEmail}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setReportedProducts((prev) =>
                            prev.filter((item) => item.id !== rep.id)
                          );
                          notify(`Resolved report for "${rep.productName}".`);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 font-semibold cursor-pointer"
                      >
                        Dismiss Report
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onDeleteProduct(rep.productId);
                          setReportedProducts((prev) =>
                            prev.filter((item) => item.id !== rep.id)
                          );
                          notify(`Removed reported product "${rep.productName}".`);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-rose-500/20 text-rose-300 font-semibold cursor-pointer"
                      >
                        Remove Product
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Full Catalog Management */}
          <div className="rounded-3xl bg-[#0B101D] border border-slate-800 p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="font-display font-bold text-lg text-white">
                Platform Catalog ({filteredProducts.length})
              </h2>
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Search products or sellers..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] font-mono uppercase text-slate-400">
                    <th className="py-2.5 px-3">Product</th>
                    <th className="py-2.5 px-3">Seller</th>
                    <th className="py-2.5 px-3 text-right">List Price</th>
                    <th className="py-2.5 px-3 text-right">Floor</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70">
                  {filteredProducts.slice(0, 20).map((prod) => (
                    <tr key={prod.id} className="hover:bg-slate-900/50">
                      <td className="py-2.5 px-3 font-semibold text-white">{prod.name}</td>
                      <td className="py-2.5 px-3 text-slate-300">{prod.sellerName}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-white">
                        {editingId === prod.id ? (
                          <input
                            type="number"
                            value={tempPrice}
                            onChange={(e) => setTempPrice(Number(e.target.value))}
                            className="w-24 px-2 py-1 rounded bg-slate-950 border border-amber-400 text-right text-white"
                          />
                        ) : (
                          `₹${prod.listPrice.toLocaleString('en-IN')}`
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-emerald-400">
                        ₹{prod.minAcceptablePrice.toLocaleString('en-IN')}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {editingId === prod.id ? (
                            <button
                              type="button"
                              onClick={() => {
                                onUpdateProductPrice(prod.id, tempPrice);
                                setEditingId(null);
                                notify(`Updated price for ${prod.name}`);
                              }}
                              className="p-1.5 rounded-lg bg-emerald-500 text-slate-950 cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingId(prod.id);
                                setTempPrice(prod.listPrice);
                              }}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              onDeleteProduct(prod.id);
                              notify(`Deleted product ${prod.name}`);
                            }}
                            className="p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 cursor-pointer"
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
        </div>
      )}

      {/* TAB 5: NEGOTIATIONS AUDIT LOG */}
      {activeTab === 'negotiations' && (
        <div className="rounded-3xl bg-[#0B101D] border border-slate-800 p-5 space-y-4">
          <h2 className="font-display font-bold text-lg text-white">
            Platform Negotiations Audit ({negotiationRecords.length})
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] font-mono uppercase text-slate-400">
                  <th className="py-2.5 px-3">Product</th>
                  <th className="py-2.5 px-3">Buyer</th>
                  <th className="py-2.5 px-3">Seller</th>
                  <th className="py-2.5 px-3 text-right">List Price</th>
                  <th className="py-2.5 px-3 text-right">Settled</th>
                  <th className="py-2.5 px-3 text-right">Saved</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {negotiationRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-900/50">
                    <td className="py-2.5 px-3 font-semibold text-white">{rec.productName}</td>
                    <td className="py-2.5 px-3 text-slate-300">{rec.userName}</td>
                    <td className="py-2.5 px-3 text-slate-300">{rec.sellerName}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-400">
                      ₹{rec.originalPrice.toLocaleString('en-IN')}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400">
                      ₹{rec.finalPrice.toLocaleString('en-IN')}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-cyan-400">
                      ₹{rec.savedAmount.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: PLATFORM SETTINGS */}
      {activeTab === 'settings' && (
        <div className="rounded-3xl bg-[#0B101D] border border-slate-800 p-5 sm:p-6 space-y-5 max-w-2xl">
          <h2 className="font-display font-bold text-lg text-white">
            Global Platform & Security Settings
          </h2>

          <div className="space-y-4 text-xs">
            <label className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-900 border border-slate-800 cursor-pointer">
              <div>
                <div className="font-bold text-white">Require Shop Owner Verification</div>
                <div className="text-slate-400 mt-0.5">
                  New shop owner registrations require admin approval before listing products
                </div>
              </div>
              <input
                type="checkbox"
                checked={platformSettings.requireShopOwnerApproval}
                onChange={(e) =>
                  setPlatformSettings((prev) => ({
                    ...prev,
                    requireShopOwnerApproval: e.target.checked,
                  }))
                }
                className="w-4 h-4 accent-amber-500"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-900 border border-slate-800 cursor-pointer">
              <div>
                <div className="font-bold text-white">Require Email Verification on Signup</div>
                <div className="text-slate-400 mt-0.5">
                  Enforce email verification code confirmation for newly registered accounts
                </div>
              </div>
              <input
                type="checkbox"
                checked={platformSettings.requireEmailVerification}
                onChange={(e) =>
                  setPlatformSettings((prev) => ({
                    ...prev,
                    requireEmailVerification: e.target.checked,
                  }))
                }
                className="w-4 h-4 accent-amber-500"
              />
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1.5">
                <label className="font-mono uppercase text-[10px] text-slate-400 block">
                  Global Max Single Discount Cap (%)
                </label>
                <input
                  type="number"
                  min={5}
                  max={50}
                  value={platformSettings.defaultMaxSingleDiscountPct}
                  onChange={(e) =>
                    setPlatformSettings((prev) => ({
                      ...prev,
                      defaultMaxSingleDiscountPct: Number(e.target.value) || 35,
                    }))
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono"
                />
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1.5">
                <label className="font-mono uppercase text-[10px] text-slate-400 block">
                  Global Max Bundle Discount Cap (%)
                </label>
                <input
                  type="number"
                  min={10}
                  max={60}
                  value={platformSettings.defaultMaxBundleDiscountPct}
                  onChange={(e) =>
                    setPlatformSettings((prev) => ({
                      ...prev,
                      defaultMaxBundleDiscountPct: Number(e.target.value) || 40,
                    }))
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => notify('Global platform settings saved and applied.')}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer"
            >
              Save Platform Settings
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
