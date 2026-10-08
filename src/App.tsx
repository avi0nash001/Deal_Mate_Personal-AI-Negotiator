import React, { useState, useEffect } from 'react';
import { Header, ActiveNavTab } from './components/common/Header';
import { Footer } from './components/common/Footer';
import { LandingHero } from './components/landing/LandingHero';
import { AIShoppingAgent } from './components/ai/AIShoppingAgent';
import { DealAnalyzerView } from './components/dealAnalyzer/DealAnalyzerView';
import { CategoriesView } from './components/categories/CategoriesView';
import { LocalStoresView } from './components/stores/LocalStoresView';
import { ForBusinessView } from './components/business/ForBusinessView';
import { StreamlinedNegotiator } from './components/negotiation/StreamlinedNegotiator';
import { ProductCompareModal } from './components/compare/ProductCompareModal';
import { UserAccountModal, AccountModalTab } from './components/account/UserAccountModal';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { CheckoutModal } from './components/checkout/CheckoutModal';
import { OrdersView } from './components/orders/OrdersView';
import { VoiceAssistantModal } from './components/voice/VoiceAssistantModal';
import { ThemeAndBgmBar } from './components/common/ThemeAndBgmBar';
import { AuthModal, AuthRoutePath, AuthGateContext } from './components/auth/AuthModal';
import { StoreOwnerPortal } from './components/storeOwner/StoreOwnerPortal';
import { ThemeId, THEMES } from './types/theme';

export type IntendedAction =
  | { type: 'DEMO_EARBUDS' }
  | { type: 'AI_DISCOVERY' }
  | { type: 'LIVE_SEARCH'; query: string; budget?: number }
  | { type: 'AI_NEGOTIATOR'; product?: Product | null }
  | { type: 'NEGOTIATE_PRODUCT'; product: Product; targetPrice: number; maxBudget: number }
  | { type: 'COMPARE_PRODUCT'; product: Product }
  | { type: 'OPEN_COMPARE' }
  | { type: 'ORDERS' }
  | { type: 'NAVIGATE_TAB'; tab: ActiveNavTab };

export const TAB_PATH_MAP: Record<ActiveNavTab, string> = {
  home: '/overview',
  negotiator: '/negotiator',
  ai_shopping: '/analyzer',
  orders: '/orders',
  categories: '/categories',
  stores: '/stores',
  for_business: '/for-business',
  store_owner_portal: '/seller',
  admin: '/admin',
};

export const getInitialTabFromLocation = (): ActiveNavTab => {
  try {
    const path = window.location.pathname.toLowerCase();
    if (path === '/overview' || path === '/') return 'home';
    if (path === '/negotiator' || path === '/negotiation') return 'negotiator';
    if (path === '/analyzer' || path === '/discovery' || path === '/chat' || path === '/dashboard' || path === '/my-deals') return 'ai_shopping';
    if (path === '/orders' || path === '/my-orders') return 'orders';
    if (path === '/seller' || path === '/shop-owner' || path.startsWith('/shop-owner')) return 'store_owner_portal';
    if (path === '/admin' || path.startsWith('/admin')) return 'admin';
    if (path === '/categories' || path === '/products') return 'categories';
    if (path === '/stores') return 'stores';
    if (path === '/for-business' || path === '/business') return 'for_business';

    const saved = localStorage.getItem('dealmate_current_tab');
    if (
      saved &&
      [
        'home',
        'ai_shopping',
        'categories',
        'stores',
        'negotiator',
        'for_business',
        'orders',
        'store_owner_portal',
        'admin',
      ].includes(saved)
    ) {
      return saved as ActiveNavTab;
    }
  } catch {
    // ignore
  }
  return 'home';
};

import {
  PRODUCTS as initialProducts,
  MARKETPLACE_API_PRODUCTS,
  LOCAL_STORES as initialStores,
  INITIAL_USERS,
  INITIAL_NEGOTIATION_RECORDS,
  INITIAL_INCOMING_NEGOTIATIONS,
} from './data/catalog';
import {
  Product,
  LocalStore,
  NegotiationSession,
  Order,
  DealToken,
  ActivityLogEntry,
  AppUser,
  NegotiationAuditRecord,
  CategoryNegotiationSetting,
  IncomingNegotiationRequest,
  AccountStatus,
  ShopApprovalStatus,
} from './types';
import {
  NegotiationEngine,
  resolveCategorySetting,
  MAX_SINGLE_ITEM_DISCOUNT,
  MAX_BUNDLE_DISCOUNT,
} from './services/negotiationEngine';
import {
  auth,
  db,
  collection,
  doc,
  setDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  signOut,
  OperationType,
  handleFirestoreError,
} from './firebase';

const DEFAULT_CATEGORY_SETTINGS: CategoryNegotiationSetting[] = [
  {
    id: 'store_owner_urban_01_Electronics',
    sellerId: 'store_owner_urban_01',
    category: 'Electronics',
    maxSingleDiscountPct: 18,
    maxBundleDiscountPct: 24,
  },
  {
    id: 'store_owner_urban_01_Fashion',
    sellerId: 'store_owner_urban_01',
    category: 'Fashion',
    maxSingleDiscountPct: 22,
    maxBundleDiscountPct: 28,
  },
  {
    id: 'store_owner_urban_01_Footwear',
    sellerId: 'store_owner_urban_01',
    category: 'Footwear',
    maxSingleDiscountPct: 20,
    maxBundleDiscountPct: 25,
  },
  {
    id: 'store_owner_urban_01_Accessories',
    sellerId: 'store_owner_urban_01',
    category: 'Accessories',
    maxSingleDiscountPct: 15,
    maxBundleDiscountPct: 20,
  },
];

export default function App() {
  const [currentTab, setCurrentTab] = useState<ActiveNavTab>(getInitialTabFromLocation);
  const [authGateContext, setAuthGateContext] = useState<AuthGateContext | null>(null);
  const [intendedAction, setIntendedAction] = useState<IntendedAction | null>(() => {
    try {
      const stored = sessionStorage.getItem('dealmate_intended_action');
      if (stored) return JSON.parse(stored) as IntendedAction;
    } catch {
      // ignore
    }
    return null;
  });
  const [products, setProducts] = useState<Product[]>(() => [
    ...initialProducts.map((p) => ({
      ...p,
      sellerId: p.isLocalStore ? 'store_owner_urban_01' : p.sellerId,
      isStoreOwnerListed: p.isLocalStore ?? true,
      marketplaceSource: p.isLocalStore
        ? ('Store Owner QR Verified' as const)
        : undefined,
    })),
    ...MARKETPLACE_API_PRODUCTS,
  ]);
  const [stores] = useState<LocalStore[]>(initialStores);

  // Per-Category Negotiation Settings (category_negotiation_settings)
  const [categorySettings, setCategorySettings] = useState<CategoryNegotiationSetting[]>(
    DEFAULT_CATEGORY_SETTINGS
  );

  // Multi-Role Authentication & Telemetry State
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => {
    try {
      const saved = localStorage.getItem('dealmate_active_user_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.email && parsed.role) {
          return parsed as AppUser;
        }
      }
    } catch {
      // ignore
    }
    return null;
  });
  const [registeredUsers, setRegisteredUsers] = useState<AppUser[]>(INITIAL_USERS);
  const [negotiationRecords, setNegotiationRecords] = useState<NegotiationAuditRecord[]>(
    INITIAL_NEGOTIATION_RECORDS
  );
  const [incomingNegotiations, setIncomingNegotiations] = useState<IncomingNegotiationRequest[]>(
    INITIAL_INCOMING_NEGOTIATIONS
  );
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalRoute, setAuthModalRoute] = useState<AuthRoutePath>('/auth');
  const [accountModalTab, setAccountModalTab] = useState<AccountModalTab>('profile');

  // AI Shopping Search query & budget state
  const [initialSearchQuery, setInitialSearchQuery] = useState<string>('');
  const [initialSearchBudget] = useState<number | undefined>(undefined);

  // Saved items & compared items
  const [savedProductIds, setSavedProductIds] = useState<string[]>(['prod_shirt_01']);
  const [savedStoreIds] = useState<string[]>(['store_urban_threads']);
  const [comparedProductIds, setComparedProductIds] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([
    'casual shirt for college under ₹2,000',
    'birthday dress under ₹5,000',
    'good college shoes under ₹3,000',
  ]);

  // Modals state
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [activeDealToken, setActiveDealToken] = useState<DealToken | null>(null);
  const [checkoutProduct, setCheckoutProduct] = useState<Product>(initialProducts[0]);

  // Background Theme Palette State
  const [currentThemeId, setCurrentThemeId] = useState<ThemeId>(() => {
    try {
      const saved = localStorage.getItem('dealmate_theme');
      if (saved && saved in THEMES) return saved as ThemeId;
    } catch {
      // ignore
    }
    return 'pure-white';
  });

  const handleSelectTheme = (newThemeId: ThemeId) => {
    setCurrentThemeId(newThemeId);
    try {
      localStorage.setItem('dealmate_theme', newThemeId);
    } catch {
      // ignore
    }
  };

  // Verify persisted session token with backend on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('dealmate_active_user_session');
      if (!saved) return;
      const parsed = JSON.parse(saved);
      if (parsed?.sessionToken) {
        fetch('/api/auth/session', {
          headers: { Authorization: `Bearer ${parsed.sessionToken}` },
        })
          .then((res) => (res.ok ? res.json() : null))
          .then((data) => {
            if (data?.user) {
              setCurrentUser({ ...data.user, sessionToken: parsed.sessionToken });
            }
          })
          .catch(() => {
            // keep local session fallback
          });
      }
    } catch {
      // ignore
    }
  }, []);

  // Sync URL paths (/overview, /negotiator, /discovery, /orders, /seller, /admin, /auth, etc.) across refresh & popstate
  useEffect(() => {
    const syncPath = () => {
      const path = window.location.pathname.toLowerCase();
      if (
        path === '/auth' ||
        path === '/auth/signup' ||
        path === '/auth/store' ||
        path === '/auth/admin' ||
        path === '/auth/reset-password'
      ) {
        setAuthModalRoute(path as AuthRoutePath);
        setIsAuthModalOpen(true);
      } else if (path === '/overview' || path === '/') {
        setCurrentTab('home');
        try {
          localStorage.setItem('dealmate_current_tab', 'home');
        } catch {}
      } else if (path === '/negotiator' || path === '/negotiation') {
        setCurrentTab('negotiator');
        try {
          localStorage.setItem('dealmate_current_tab', 'negotiator');
        } catch {}
      } else if (
        path === '/discovery' ||
        path === '/chat' ||
        path === '/dashboard' ||
        path === '/my-deals'
      ) {
        setCurrentTab('ai_shopping');
        try {
          localStorage.setItem('dealmate_current_tab', 'ai_shopping');
        } catch {}
      } else if (path === '/orders' || path === '/my-orders') {
        setCurrentTab('orders');
        try {
          localStorage.setItem('dealmate_current_tab', 'orders');
        } catch {}
      } else if (
        path === '/seller' ||
        path === '/shop-owner' ||
        path.startsWith('/shop-owner')
      ) {
        setCurrentTab('store_owner_portal');
        try {
          localStorage.setItem('dealmate_current_tab', 'store_owner_portal');
        } catch {}
      } else if (path === '/admin' || path.startsWith('/admin')) {
        setCurrentTab('admin');
        try {
          localStorage.setItem('dealmate_current_tab', 'admin');
        } catch {}
      } else if (path === '/categories' || path === '/products') {
        setCurrentTab('categories');
        try {
          localStorage.setItem('dealmate_current_tab', 'categories');
        } catch {}
      } else if (path === '/stores') {
        setCurrentTab('stores');
        try {
          localStorage.setItem('dealmate_current_tab', 'stores');
        } catch {}
      } else if (path === '/for-business' || path === '/business') {
        setCurrentTab('for_business');
        try {
          localStorage.setItem('dealmate_current_tab', 'for_business');
        } catch {}
      }
    };
    syncPath();
    window.addEventListener('popstate', syncPath);
    return () => window.removeEventListener('popstate', syncPath);
  }, []);

  const navigateTab = (tab: ActiveNavTab) => {
    setCurrentTab(tab);
    try {
      localStorage.setItem('dealmate_current_tab', tab);
      const nextUrl = TAB_PATH_MAP[tab];
      if (nextUrl && window.location.pathname !== nextUrl) {
        window.history.pushState({}, '', nextUrl);
      }
    } catch {
      // ignore
    }
  };

  const openAuthRoute = (route: AuthRoutePath = '/auth') => {
    setAuthModalRoute(route);
    setIsAuthModalOpen(true);
    try {
      window.history.pushState({}, '', route);
    } catch {
      // ignore
    }
  };

  // Reusable Authentication Gate helper (Section 5 & 6)
  const requireAuth = (
    action: IntendedAction,
    gateContext: AuthGateContext
  ): boolean => {
    if (currentUser) {
      return true;
    }
    setIntendedAction(action);
    setAuthGateContext(gateContext);
    try {
      sessionStorage.setItem('dealmate_intended_action', JSON.stringify(action));
    } catch {
      // ignore
    }
    setAuthModalRoute('/auth');
    setIsAuthModalOpen(true);
    return false;
  };

  // Real-time Firestore listener for Store Owner QR products
  useEffect(() => {
    const path = 'storeProducts';
    const q = query(collection(db, path), where('stock', '>=', 0));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (snapshot.empty) return;
        const firestoreProducts: Product[] = snapshot.docs.map((docSnap) => {
          const d = docSnap.data();
          return {
            id: d.id,
            name: d.name,
            brand: d.brand,
            category: d.category,
            purpose: ['College', 'Casual', 'Everyday'],
            rating: 4.9,
            reviewsCount: 95,
            listPrice: Number(d.listPrice),
            marketPrice: Number(d.marketPrice),
            minAcceptablePrice: Number(d.minAcceptablePrice),
            maxDiscountPercent: Math.round(
              ((Number(d.listPrice) - Number(d.minAcceptablePrice)) /
                Math.max(1, Number(d.listPrice))) *
                100
            ),
            stock: Number(d.stock),
            sellerId: d.sellerId,
            sellerName: d.sellerName,
            sellerRating: 4.9,
            isLocalStore: true,
            isStoreOwnerListed: true,
            marketplaceSource: 'Store Owner QR Verified',
            qrCodeData: d.qrCodeData,
            storeDistance: '1.2 km away',
            image: d.image,
            description: d.description,
            specs: {
              'QR SKU': d.qrCodeData || d.id,
              'Listed By': d.sellerName,
            },
            isNegotiable: true,
            bundleEligible: true,
            deliveryDays: 1,
            aiMatchScore: 99,
            whyRecommended: `QR-Verified Store Owner Product from ${d.sellerName}.`,
          };
        });

        setProducts((prev) => {
          const existingIds = new Set(prev.map((p) => p.id));
          const merged = [...prev];
          for (const fp of firestoreProducts) {
            if (!existingIds.has(fp.id)) {
              merged.unshift(fp);
            }
          }
          return merged;
        });
      },
      (error) => {
        try {
          handleFirestoreError(error, OperationType.LIST, path);
        } catch {
          // Ignore if non-fatal
        }
      }
    );

    return () => unsubscribe();
  }, []);

  // Real-time Firestore listener for categoryNegotiationSettings
  useEffect(() => {
    const path = 'categoryNegotiationSettings';
    const q = query(collection(db, path), where('maxSingleDiscountPct', '>=', 0));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (snapshot.empty) return;
        const loaded: CategoryNegotiationSetting[] = snapshot.docs.map((docSnap) => {
          const d = docSnap.data();
          return {
            id: d.id,
            sellerId: d.sellerId,
            category: d.category,
            maxSingleDiscountPct: Number(
              d.maxSingleDiscountPct ?? MAX_SINGLE_ITEM_DISCOUNT
            ),
            maxBundleDiscountPct: Number(
              d.maxBundleDiscountPct ?? MAX_BUNDLE_DISCOUNT
            ),
            bulkTiers: Array.isArray(d.bulkTiers) ? d.bulkTiers : undefined,
          };
        });
        setCategorySettings((prev) => {
          const map = new Map(prev.map((item) => [item.id, item]));
          for (const item of loaded) {
            map.set(item.id, item);
          }
          return Array.from(map.values());
        });
      },
      () => {
        // Ignore non-fatal
      }
    );
    return () => unsubscribe();
  }, []);

  // Orders state
  const [orders, setOrders] = useState<Order[]>([]);

  // Initial product passed into AI Negotiator ONLY when user explicitly selects a product from another tab (null by default!)
  const [negotiatorInitialProduct, setNegotiatorInitialProduct] = useState<Product | null>(null);

  // AI Deal Analyzer State (Context preserved from Negotiator or Real-Time Search)
  const [analyzerProduct, setAnalyzerProduct] = useState<Product | null>(null);
  const [analyzerNegotiatedPrice, setAnalyzerNegotiatedPrice] = useState<number | undefined>(undefined);
  const [analyzerTargetBudget, setAnalyzerTargetBudget] = useState<number | undefined>(undefined);

  // Active negotiation session state
  const [session, setSession] = useState<NegotiationSession>(() =>
    NegotiationEngine.createSession(
      initialProducts[0],
      { target: 1600, maxBudget: 1900 },
      DEFAULT_CATEGORY_SETTINGS
    )
  );
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(false);
  const [activityLogs, setActivityLogs] = useState<ActivityLogEntry[]>([
    {
      id: 'log_init',
      timestamp: new Date().toLocaleTimeString(),
      agent: 'PRODUCT_MATCHER',
      step: 'CATALOG_INDEX_MATCHED',
      detail: `Initial product session loaded: ${initialProducts[0].name}.`,
      type: 'info',
    },
  ]);
  const [competingSellers, setCompetingSellers] = useState<
    Array<{
      sellerId: string;
      sellerName: string;
      offeredPrice: number;
      deliveryDays: number;
      stock: number;
      isBest?: boolean;
    }>
  >([]);
  const [showMultiSeller, setShowMultiSeller] = useState<boolean>(false);

  // Upsert category_negotiation_settings
  const handleUpsertCategorySetting = (setting: CategoryNegotiationSetting) => {
    setCategorySettings((prev) => {
      const idx = prev.findIndex(
        (s) =>
          s.sellerId === setting.sellerId &&
          s.category.toLowerCase() === setting.category.toLowerCase()
      );
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = setting;
        return next;
      }
      return [setting, ...prev];
    });
  };

  // Auth handlers
  const handleRegisterLocalUser = (user: AppUser) => {
    setRegisteredUsers((prev) => {
      const idx = prev.findIndex((u) => u.email.toLowerCase() === user.email.toLowerCase());
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = user;
        return copy;
      }
      return [user, ...prev];
    });
  };

  // Post-sign-in destinations & Automatic Action Resumption (Sections 5, 6, 7, 8, 9, 10)
  const handleAuthenticated = (user: AppUser, routeUsed?: AuthRoutePath) => {
    setCurrentUser(user);
    handleRegisterLocalUser(user);
    try {
      localStorage.setItem('dealmate_active_user_session', JSON.stringify(user));
    } catch {
      // ignore
    }

    // Retrieve pending intended action
    const actionToResume =
      intendedAction ||
      (() => {
        try {
          const stored = sessionStorage.getItem('dealmate_intended_action');
          if (stored) return JSON.parse(stored) as IntendedAction;
        } catch {
          // ignore
        }
        return null;
      })();

    // Clear intended action state
    setIntendedAction(null);
    setAuthGateContext(null);
    try {
      sessionStorage.removeItem('dealmate_intended_action');
    } catch {
      // ignore
    }

    // Automatically resume intended action if one was pending
    if (actionToResume) {
      if (actionToResume.type === 'DEMO_EARBUDS') {
        const earbuds =
          products.find(
            (p) =>
              p.category.toLowerCase().includes('electron') ||
              p.id.includes('earbuds')
          ) || products[0];
        const newSession = NegotiationEngine.createSession(
          earbuds,
          { target: 2400, maxBudget: 2600 },
          categorySettings
        );
        setSession(newSession);
        setNegotiatorInitialProduct(earbuds);
        setActiveStepIndex(0);
        setIsAutoPlaying(false);
        setShowMultiSeller(false);
        navigateTab('negotiator');
        setTimeout(() => {
          handleAutoNegotiate();
        }, 500);
        return;
      }

      if (actionToResume.type === 'NEGOTIATE_PRODUCT') {
        const prod = actionToResume.product;
        const newSession = NegotiationEngine.createSession(
          prod,
          {
            target: actionToResume.targetPrice,
            maxBudget: actionToResume.maxBudget,
          },
          categorySettings
        );
        setSession(newSession);
        setNegotiatorInitialProduct(prod);
        setActiveStepIndex(0);
        setIsAutoPlaying(false);
        setShowMultiSeller(false);
        navigateTab('negotiator');
        return;
      }

      if (actionToResume.type === 'LIVE_SEARCH') {
        setInitialSearchQuery(actionToResume.query);
        setRecentSearches((prev) =>
          [actionToResume.query, ...prev.filter((q) => q !== actionToResume.query)].slice(0, 5)
        );
        navigateTab('ai_shopping');
        return;
      }

      if (actionToResume.type === 'AI_DISCOVERY') {
        navigateTab('ai_shopping');
        return;
      }

      if (actionToResume.type === 'AI_NEGOTIATOR') {
        setNegotiatorInitialProduct(actionToResume.product || null);
        navigateTab('negotiator');
        return;
      }

      if (actionToResume.type === 'ORDERS') {
        navigateTab('orders');
        return;
      }

      if (actionToResume.type === 'COMPARE_PRODUCT') {
        setComparedProductIds((prev) =>
          prev.includes(actionToResume.product.id)
            ? prev
            : [...prev, actionToResume.product.id]
        );
        setIsCompareOpen(true);
        return;
      }

      if (actionToResume.type === 'OPEN_COMPARE') {
        setIsCompareOpen(true);
        return;
      }

      if (actionToResume.type === 'NAVIGATE_TAB') {
        navigateTab(actionToResume.tab);
        return;
      }
    }

    if (routeUsed === '/auth/store' || user.role === 'store_owner') {
      navigateTab('store_owner_portal');
    } else if (routeUsed === '/auth/admin' || user.role === 'admin') {
      navigateTab('admin');
    } else {
      navigateTab('ai_shopping');
    }
  };

  const handleUpdateUser = (updatedUser: AppUser) => {
    setCurrentUser(updatedUser);
    handleRegisterLocalUser(updatedUser);
    try {
      localStorage.setItem('dealmate_active_user_session', JSON.stringify(updatedUser));
    } catch {
      // ignore
    }
  };

  const handleSignOut = async () => {
    try {
      const saved = localStorage.getItem('dealmate_active_user_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.sessionToken) {
          await fetch('/api/auth/signout', {
            method: 'POST',
            headers: { Authorization: `Bearer ${parsed.sessionToken}` },
          });
        }
      }
      localStorage.removeItem('dealmate_active_user_session');
    } catch {
      // ignore
    }
    try {
      await signOut(auth);
    } catch {
      // ignore
    }
    setCurrentUser(null);
    setIsAuthModalOpen(false);
    setIsAccountOpen(false);
    navigateTab('home');
  };

  // Record a completed negotiation in state + Firestore
  const recordNegotiationOutcome = async (completedSession: NegotiationSession) => {
    const finalPrice = completedSession.finalPrice || completedSession.currentOffer;
    const savedAmount = Math.max(0, completedSession.originalPrice - finalPrice);
    const buyer = currentUser || registeredUsers[0];

    const recordId = `neg_${Date.now().toString(36)}`;
    const newRecord: NegotiationAuditRecord = {
      id: recordId,
      userId: buyer.uid,
      userName: buyer.displayName,
      userEmail: buyer.email,
      productId: completedSession.product.id,
      productName: completedSession.product.name,
      sellerId: completedSession.product.sellerId,
      sellerName: completedSession.product.sellerName,
      originalPrice: completedSession.originalPrice,
      finalPrice,
      savedAmount,
      status: 'DEAL_ACCEPTED',
      createdAt: new Date().toISOString(),
    };

    setNegotiationRecords((prev) => {
      if (
        prev.some(
          (r) =>
            r.productId === newRecord.productId &&
            r.finalPrice === newRecord.finalPrice &&
            Date.now() - new Date(r.createdAt).getTime() < 5000
        )
      ) {
        return prev;
      }
      return [newRecord, ...prev];
    });

    if (auth.currentUser) {
      const path = `negotiationRecords/${recordId}`;
      try {
        await setDoc(doc(db, 'negotiationRecords', recordId), {
          id: recordId,
          userId: auth.currentUser.uid,
          userName: buyer.displayName.slice(0, 100),
          userEmail: (auth.currentUser.email || buyer.email).slice(0, 254),
          productId: completedSession.product.id.slice(0, 128),
          productName: completedSession.product.name.slice(0, 160),
          sellerId: completedSession.product.sellerId.slice(0, 128),
          sellerName: completedSession.product.sellerName.slice(0, 120),
          originalPrice: Number(completedSession.originalPrice),
          finalPrice: Number(finalPrice),
          savedAmount: Number(savedAmount),
          status: 'DEAL_ACCEPTED',
          createdAt: serverTimestamp(),
        });
      } catch (err) {
        try {
          handleFirestoreError(err, OperationType.CREATE, path);
        } catch {
          // continue
        }
      }
    }
  };

  // Navigation handlers with Authentication Gate (Sections 5, 8, 9, 10)
  const handleStartAIShoppingWithQuery = (queryStr?: string) => {
    if (queryStr) {
      if (
        !requireAuth(
          { type: 'LIVE_SEARCH', query: queryStr },
          {
            title: 'Live Search',
            feature: `Search: "${queryStr}"`,
            message:
              'Sign in to continue. Create your free DealMate account to execute live searches across Amazon, Flipkart, Croma, and verified local stores.',
          }
        )
      ) {
        return;
      }
      setInitialSearchQuery(queryStr);
      setRecentSearches((prev) =>
        [queryStr, ...prev.filter((q) => q !== queryStr)].slice(0, 5)
      );
    } else {
      if (
        !requireAuth(
          { type: 'AI_DISCOVERY' },
          {
            title: 'AI Deal Analyzer',
            feature: 'AI Deal Analyzer Engine',
            message:
              'Sign in to continue. Create your free DealMate account to access AI Deal Analyzer, evaluate real-time product quality, seller trust, and warranty protection.',
          }
        )
      ) {
        return;
      }
    }
    navigateTab('ai_shopping');
  };

  const handleStartNegotiatingTab = () => {
    if (
      !requireAuth(
        { type: 'AI_NEGOTIATOR' },
        {
          title: 'AI Negotiator',
          feature: 'Autonomous AI Negotiator',
          message:
            'Sign in to continue. Create your free DealMate account to access AI Negotiation and bargain live with Seller AIs.',
        }
      )
    ) {
      return;
    }
    setNegotiatorInitialProduct(null);
    navigateTab('negotiator');
  };

  const handleOpenOrdersTab = () => {
    if (
      !requireAuth(
        { type: 'ORDERS' },
        {
          title: 'My Orders',
          feature: 'Orders & Verification Pass',
          message:
            'Sign in to continue. Sign in to view your orders, live delivery tracking, and in-store QR redemption passes.',
        }
      )
    ) {
      return;
    }
    navigateTab('orders');
  };

  // Compare handlers with Authentication Gate
  const handleToggleCompare = (product: Product) => {
    if (
      !requireAuth(
        { type: 'COMPARE_PRODUCT', product },
        {
          title: 'Product Comparison',
          feature: 'Side-by-Side Product Comparison',
          message:
            'Sign in to continue. Create your free DealMate account to compare products and sellers side-by-side.',
        }
      )
    ) {
      return;
    }
    setComparedProductIds((prev) => {
      if (prev.includes(product.id)) {
        return prev.filter((id) => id !== product.id);
      }
      if (prev.length >= 3) {
        return [prev[1], prev[2], product.id];
      }
      return [...prev, product.id];
    });
  };

  const handleRemoveFromCompare = (productId: string) => {
    setComparedProductIds((prev) => prev.filter((id) => id !== productId));
  };

  // Save handlers
  const handleToggleSaveProduct = (product: Product) => {
    setSavedProductIds((prev) =>
      prev.includes(product.id)
        ? prev.filter((id) => id !== product.id)
        : [...prev, product.id]
    );
  };

  // Launch Conversational Multi-Agent Negotiation for a selected product (Section 6 & 10)
  const handleNegotiateProduct = (
    product: Product,
    targetPrice: number,
    maxBudget: number
  ) => {
    if (
      !requireAuth(
        { type: 'NEGOTIATE_PRODUCT', product, targetPrice, maxBudget },
        {
          title: 'Negotiate This Deal',
          feature: `Negotiate ${product.name}`,
          message: `Sign in to continue. Create your free DealMate account to negotiate ${product.name} (list price: ₹${product.listPrice.toLocaleString('en-IN')}). We will automatically open the negotiation session for this product as soon as you sign in!`,
        }
      )
    ) {
      return;
    }
    const newSession = NegotiationEngine.createSession(
      product,
      {
        target: targetPrice,
        maxBudget,
      },
      categorySettings
    );
    setSession(newSession);
    setNegotiatorInitialProduct(product);
    setActiveStepIndex(0);
    setIsAutoPlaying(false);
    setShowMultiSeller(false);
    navigateTab('negotiator');
  };

  // Direct Checkout from Inline Chat Buyer<->Seller Exchange
  const handleBuySettledProduct = (product: Product, settledUnitPrice: number) => {
    const settledSession = NegotiationEngine.createSession(
      product,
      { target: settledUnitPrice, maxBudget: product.listPrice },
      categorySettings
    );
    settledSession.finalPrice = settledUnitPrice;
    settledSession.currentOffer = settledUnitPrice;
    settledSession.status = 'DEAL_ACCEPTED';

    const token = NegotiationEngine.generateDealToken(settledSession);
    setCheckoutProduct(product);
    setActiveDealToken(token);
    setIsCheckoutOpen(true);
    recordNegotiationOutcome(settledSession);
  };

  // 1-Click Earbuds Interactive Negotiation Demo (Section 7)
  const handleLaunchEarbudsDemo = () => {
    if (
      !requireAuth(
        { type: 'DEMO_EARBUDS' },
        {
          title: 'One-Click Demo',
          feature: '1-Click Interactive AI Demo',
          message:
            'Sign in to continue. Create your free DealMate account to run the live 1-Click Earbuds negotiation demo between your Buyer AI and Seller AI.',
        }
      )
    ) {
      return;
    }
    const earbuds =
      products.find(
        (p) =>
          p.category.toLowerCase().includes('electron') || p.id.includes('earbuds')
      ) || products[0];
    handleNegotiateProduct(earbuds, 2400, 2600);
    setTimeout(() => {
      handleAutoNegotiate();
    }, 400);
  };

  // Step negotiation turn
  const handleStepNegotiation = () => {
    if (
      session.status === 'DEAL_ACCEPTED' ||
      session.status === 'DEAL_REJECTED' ||
      session.status === 'BUDGET_EXCEEDED'
    ) {
      return;
    }
    const { updatedSession, logEntry } = NegotiationEngine.processStep(
      session,
      activeStepIndex,
      categorySettings
    );
    setSession(updatedSession);
    setActiveStepIndex((prev) => prev + 1);
    setActivityLogs((prev) => [logEntry, ...prev]);

    if (updatedSession.status === 'DEAL_ACCEPTED') {
      recordNegotiationOutcome(updatedSession);
    }
  };

  // Auto negotiate turns (uses server-side Buyer <-> Seller Exchange + category floor clamp)
  const handleAutoNegotiate = async () => {
    setIsAutoPlaying(true);
    try {
      const matchedSetting = resolveCategorySetting(session.product, categorySettings);
      const res = await fetch('/api/negotiation/run-exchange', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product: session.product,
          buyerInitialAsk: session.userBudget.target,
          maxSingleDiscountPct: matchedSetting?.maxSingleDiscountPct,
          maxBundleDiscountPct: matchedSetting?.maxBundleDiscountPct,
          isBundle: false,
        }),
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data.turns)) {
        const { updatedSession, logs } = NegotiationEngine.applyExchangeTurns(
          session,
          data.turns,
          data.settledPrice,
          data.floorPrice
        );
        setSession(updatedSession);
        setActiveStepIndex(data.turns.length);
        setActivityLogs((prev) => [...logs.reverse(), ...prev]);
        recordNegotiationOutcome(updatedSession);
        setIsAutoPlaying(false);
        return;
      }
    } catch {
      // Fallback to local step loop if offline
    }

    let currentSession = session;
    let step = activeStepIndex;

    const interval = setInterval(() => {
      if (
        currentSession.status === 'DEAL_ACCEPTED' ||
        currentSession.status === 'DEAL_REJECTED' ||
        currentSession.status === 'BUDGET_EXCEEDED' ||
        step >= 5
      ) {
        clearInterval(interval);
        setIsAutoPlaying(false);
        return;
      }

      const { updatedSession, logEntry } = NegotiationEngine.processStep(
        currentSession,
        step,
        categorySettings
      );
      currentSession = updatedSession;
      step += 1;

      setSession(updatedSession);
      setActiveStepIndex(step);
      setActivityLogs((prev) => [logEntry, ...prev]);

      if (updatedSession.status === 'DEAL_ACCEPTED') {
        recordNegotiationOutcome(updatedSession);
      }

      if (
        updatedSession.status === 'DEAL_ACCEPTED' ||
        updatedSession.status === 'DEAL_REJECTED' ||
        step >= 5
      ) {
        clearInterval(interval);
        setIsAutoPlaying(false);
      }
    }, 900);
  };

  const handleResetSession = () => {
    const newSession = NegotiationEngine.createSession(
      session.product,
      {
        target: session.userBudget.target,
        maxBudget: session.userBudget.maxBudget,
      },
      categorySettings
    );
    setSession(newSession);
    setActiveStepIndex(0);
    setIsAutoPlaying(false);
  };

  const handleToggleMultiSeller = () => {
    if (!showMultiSeller) {
      const comp = NegotiationEngine.runMultiSellerComparison(
        session.product,
        session.userBudget.target,
        categorySettings
      );
      setCompetingSellers(comp);
      setShowMultiSeller(true);
    } else {
      setShowMultiSeller(false);
    }
  };

  // Checkout & Order
  const handleOpenCheckout = () => {
    try {
      const token = NegotiationEngine.generateDealToken(session);
      setCheckoutProduct(session.product);
      setActiveDealToken(token);
      setIsCheckoutOpen(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOrderConfirmed = (newOrder: Order) => {
    setOrders((prev) => [newOrder, ...prev]);
    navigateTab('orders');
  };

  // Store Owner & Admin product handlers
  const handleAddStoreProduct = (newProduct: Product) => {
    setProducts((prev) => [newProduct, ...prev]);
  };

  const handleUpdateProductPrice = (productId: string, newPrice: number) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, listPrice: newPrice } : p))
    );
  };

  const handleUpdateProductStock = (productId: string, newStock: number) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, stock: newStock } : p))
    );
  };

  const handleDeleteProduct = (productId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId));
  };

  const handleUpdateProduct = (updatedProduct: Product) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p))
    );
  };

  const handleUpdateIncomingNegotiation = (updatedReq: IncomingNegotiationRequest) => {
    setIncomingNegotiations((prev) =>
      prev.map((r) => (r.id === updatedReq.id ? updatedReq : r))
    );
  };

  const handleUpdateUserStatus = (uid: string, status: AccountStatus) => {
    setRegisteredUsers((prev) =>
      prev.map((u) => (u.uid === uid ? { ...u, accountStatus: status } : u))
    );
  };

  const handleUpdateShopApproval = (uid: string, status: ShopApprovalStatus) => {
    setRegisteredUsers((prev) =>
      prev.map((u) => (u.uid === uid ? { ...u, shopApprovalStatus: status } : u))
    );
  };

  const comparedProducts = products.filter((p) => comparedProductIds.includes(p.id));
  const savedProducts = products.filter((p) => savedProductIds.includes(p.id));
  const savedStores = stores.filter((s) => savedStoreIds.includes(s.id));

  const totalPlatformSavings =
    registeredUsers
      .filter((u) => u.role === 'user' || u.totalSaved > 0)
      .reduce((acc, u) => acc + (u.totalSaved || 0), 0) +
    negotiationRecords.reduce((acc, r) => acc + r.savedAmount, 0);

  const theme = THEMES[currentThemeId] || THEMES['pure-white'];

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors duration-500 relative overflow-x-hidden theme-${theme.id} ${
        theme.isLight
          ? 'text-slate-900 bg-white selection:bg-blue-500/20 selection:text-blue-700'
          : 'text-[#F2F5F7] selection:bg-cyan-500/20 selection:text-cyan-300'
      } ${theme.bodyGradient}`}
      style={{ backgroundColor: theme.bgHex }}
    >
      {/* Dynamic Background Ambient Light Gradients */}
      <div
        className={`fixed -top-40 left-1/4 w-[750px] h-[480px] rounded-full blur-[160px] pointer-events-none transition-all duration-700 bg-gradient-to-br ${
          theme.isLight ? 'opacity-25' : 'opacity-40'
        } ${theme.ambientMesh}`}
      />
      <div
        className={`fixed -bottom-40 right-1/4 w-[750px] h-[480px] rounded-full blur-[160px] pointer-events-none transition-all duration-700 bg-gradient-to-tl ${
          theme.isLight ? 'opacity-20' : 'opacity-30'
        } ${theme.ambientMesh}`}
      />

      {/* Top Navigation Bar */}
      <Header
        currentTab={currentTab}
        onNavigate={(tab) => {
          if (tab === 'home') {
            navigateTab('home');
          } else if (tab === 'negotiator') {
            handleStartNegotiatingTab();
          } else if (tab === 'ai_shopping') {
            handleStartAIShoppingWithQuery();
          } else if (tab === 'orders') {
            handleOpenOrdersTab();
          } else if (tab === 'store_owner_portal') {
            if (!currentUser) {
              openAuthRoute('/auth/store');
            } else {
              navigateTab('store_owner_portal');
            }
          } else if (tab === 'admin') {
            if (!currentUser || currentUser.role !== 'admin') {
              openAuthRoute('/auth/admin');
            } else {
              navigateTab('admin');
            }
          } else {
            navigateTab(tab);
          }
        }}
        comparedCount={comparedProductIds.length}
        onOpenCompare={() => {
          if (
            !requireAuth(
              { type: 'OPEN_COMPARE' },
              {
                title: 'Product Comparison',
                feature: 'Side-by-Side Product Comparison',
                message:
                  'Sign in to continue. Create your free DealMate account to compare products and sellers side-by-side.',
              }
            )
          ) {
            return;
          }
          setIsCompareOpen(true);
        }}
        savedCount={savedProductIds.length}
        onOpenAccount={(tab) => {
          setAccountModalTab(tab || 'profile');
          setIsAccountOpen(true);
        }}
        ordersCount={orders.length}
        isNegotiatingActive={currentTab === 'negotiator'}
        currentThemeId={currentThemeId}
        onSelectTheme={handleSelectTheme}
        currentUser={currentUser}
        onOpenAuthModal={(route) => openAuthRoute(route || '/auth')}
        onSignOut={handleSignOut}
        onOpenVoiceModal={() => setIsVoiceOpen(true)}
        totalPlatformSavings={totalPlatformSavings}
      />

      {/* Main Content Area */}
      <main className="flex-1 container w-full max-w-full sm:max-w-3xl md:max-w-5xl lg:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-16 relative z-10">
        {/* 1. HOMEPAGE: DEALMATE 3D CINEMATIC HERO */}
        {currentTab === 'home' && (
          <section className="container w-full max-w-full sm:max-w-3xl md:max-w-5xl lg:max-w-7xl mx-auto">
            <LandingHero
              onStartNegotiating={handleStartNegotiatingTab}
              onLaunchDemo={handleLaunchEarbudsDemo}
              onExploreMarketplace={() => handleStartAIShoppingWithQuery()}
              onQuickGoogleSearch={handleStartAIShoppingWithQuery}
              recentSearches={recentSearches}
              onSelectProductForNegotiation={(prod) =>
                handleNegotiateProduct(
                  prod,
                  Math.round(prod.listPrice * 0.8),
                  prod.listPrice
                )
              }
              currentThemeId={currentThemeId}
            />
          </section>
        )}

        {/* 2. AI DEAL ANALYZER (/analyzer: Real-Time All-Category Quality, Seller & Risk Evaluation) */}
        {currentTab === 'ai_shopping' && (
          <section className="container w-full max-w-full sm:max-w-3xl md:max-w-5xl lg:max-w-7xl mx-auto">
            <DealAnalyzerView
              initialProduct={analyzerProduct || products[0]}
              initialNegotiatedPrice={analyzerNegotiatedPrice}
              initialBudget={analyzerTargetBudget}
              products={products}
              onBuyNow={handleBuySettledProduct}
              onReNegotiate={(prod, prompt, price) => {
                setNegotiatorInitialProduct(prod);
                navigateTab('negotiator');
              }}
              onBrowseMoreProducts={() => navigateTab('negotiator')}
              currentThemeId={currentThemeId}
            />
          </section>
        )}

        {/* 3. STORE OWNER DASHBOARD (/seller) */}
        {currentTab === 'store_owner_portal' && (
          <section className="container w-full max-w-full sm:max-w-3xl md:max-w-5xl lg:max-w-7xl mx-auto">
            <StoreOwnerPortal
              currentUser={currentUser}
              products={products}
              negotiationRecords={negotiationRecords}
              orders={orders}
              categorySettings={categorySettings}
              onUpsertCategorySetting={handleUpsertCategorySetting}
              onAddStoreProduct={handleAddStoreProduct}
              onUpdateProductPrice={handleUpdateProductPrice}
              onUpdateProductStock={handleUpdateProductStock}
              onUpdateStoreProduct={handleUpdateProduct}
              onDeleteProduct={handleDeleteProduct}
              onUpdateUserProfile={handleUpdateUser}
              onSignOut={handleSignOut}
              onOpenAuthModal={() => openAuthRoute('/auth/store')}
              onNavigateToSearch={(q) => handleStartAIShoppingWithQuery(q)}
            />
          </section>
        )}

        {/* 4. CATEGORIES VIEW */}
        {currentTab === 'categories' && (
          <section className="container w-full max-w-full sm:max-w-3xl md:max-w-5xl lg:max-w-6xl mx-auto">
            <CategoriesView
              onSelectCategory={(catId) => {
                setInitialSearchQuery(`I need ${catId} within my budget`);
                navigateTab('ai_shopping');
              }}
            />
          </section>
        )}

        {/* 5. LOCAL STORES DISCOVERY + GOOGLE MAPS GROUNDING */}
        {currentTab === 'stores' && (
          <section className="container w-full max-w-full sm:max-w-3xl md:max-w-5xl lg:max-w-7xl mx-auto">
            <LocalStoresView
              stores={stores}
              onSelectStoreProducts={() => navigateTab('ai_shopping')}
            />
          </section>
        )}

        {/* 6. CONVERSATIONAL MULTI-AGENT SHOPPING & NEGOTIATION ASSISTANT */}
        {currentTab === 'negotiator' && (
          <section className="container w-full max-w-full sm:max-w-3xl md:max-w-5xl lg:max-w-7xl mx-auto">
            <StreamlinedNegotiator
              products={products}
              categorySettings={categorySettings}
              initialSelectedProduct={negotiatorInitialProduct}
              onClearInitialProduct={() => setNegotiatorInitialProduct(null)}
              onAcceptDealCheckout={handleBuySettledProduct}
              onAnalyzeDeal={(product, settledPrice) => {
                setAnalyzerProduct(product);
                setAnalyzerNegotiatedPrice(settledPrice);
                navigateTab('ai_shopping');
              }}
              onCompareToggle={handleToggleCompare}
              comparedProductIds={comparedProductIds}
              onOpenCompareModal={() => setIsCompareOpen(true)}
              onNavigateToStores={() => navigateTab('stores')}
              currentThemeId={currentThemeId}
            />
          </section>
        )}

        {/* 7. FOR BUSINESSES */}
        {currentTab === 'for_business' && (
          <section className="container w-full max-w-full sm:max-w-3xl md:max-w-5xl lg:max-w-6xl mx-auto">
            <ForBusinessView />
          </section>
        )}

        {/* 8. ORDERS */}
        {currentTab === 'orders' && (
          <section className="container w-full max-w-full sm:max-w-3xl md:max-w-4xl lg:max-w-6xl mx-auto">
            <OrdersView
              orders={orders}
              onStartNewNegotiation={() => navigateTab('ai_shopping')}
            />
          </section>
        )}

        {/* 9. ADMIN DASHBOARD (/admin) */}
        {currentTab === 'admin' && (
          <section className="container w-full max-w-full sm:max-w-3xl md:max-w-5xl lg:max-w-7xl mx-auto">
            <AdminDashboard
              products={products}
              stores={stores}
              registeredUsers={registeredUsers}
              negotiationRecords={negotiationRecords}
              categorySettings={categorySettings}
              currentUser={currentUser}
              onOpenAuthModal={() => openAuthRoute('/auth/admin')}
              onUpdateProductPrice={handleUpdateProductPrice}
              onDeleteProduct={handleDeleteProduct}
              onUpdateUserStatus={handleUpdateUserStatus}
              onUpdateShopApproval={handleUpdateShopApproval}
            />
          </section>
        )}
      </main>

      {/* Three Separate Role Logins + Shared Password Reset (/auth, /auth/signup, /auth/store, /auth/admin, /auth/reset-password) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        initialRoute={authModalRoute}
        onClose={() => {
          setIsAuthModalOpen(false);
          setAuthGateContext(null);
        }}
        currentUser={currentUser}
        onAuthenticated={handleAuthenticated}
        onSignOut={handleSignOut}
        registeredUsers={registeredUsers}
        onRegisterLocalUser={handleRegisterLocalUser}
        onRouteChange={(r) => {
          setAuthModalRoute(r);
          try {
            window.history.pushState({}, '', r);
          } catch {
            // ignore
          }
        }}
        authGateContext={authGateContext}
      />

      {/* Product Compare Modal */}
      <ProductCompareModal
        isOpen={isCompareOpen}
        onClose={() => setIsCompareOpen(false)}
        products={comparedProducts}
        userBudget={session.userBudget.maxBudget || 3000}
        onSelectToNegotiate={(p) => {
          handleNegotiateProduct(p, Math.round(p.listPrice * 0.8), p.listPrice);
        }}
        onRemoveFromCompare={handleRemoveFromCompare}
      />

      {/* User Account Modal */}
      <UserAccountModal
        isOpen={isAccountOpen}
        onClose={() => setIsAccountOpen(false)}
        currentUser={currentUser}
        onUpdateUser={handleUpdateUser}
        onSignOut={handleSignOut}
        onOpenAuthModal={() => {
          setIsAccountOpen(false);
          openAuthRoute('/auth');
        }}
        onNavigateDashboard={() => {
          setIsAccountOpen(false);
          if (currentUser?.role === 'store_owner') {
            navigateTab('store_owner_portal');
          } else if (currentUser?.role === 'admin') {
            navigateTab('admin');
          } else {
            navigateTab('ai_shopping');
          }
        }}
        negotiationRecords={negotiationRecords}
        initialTab={accountModalTab}
        savedProducts={savedProducts}
        savedStores={savedStores}
        recentSearches={recentSearches}
        onSelectProduct={(p) => {
          handleNegotiateProduct(p, Math.round(p.listPrice * 0.8), p.listPrice);
        }}
        onSelectSearch={handleStartAIShoppingWithQuery}
      />

      {/* Checkout Modal (OrderModal with server-side place_order floor verification) */}
      {activeDealToken && (
        <CheckoutModal
          isOpen={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
          product={checkoutProduct}
          dealToken={activeDealToken}
          categorySettings={categorySettings}
          onOrderConfirmed={handleOrderConfirmed}
        />
      )}

      {/* Voice Assistant Modal (gemini-3.5-transcribe) */}
      <VoiceAssistantModal
        isOpen={isVoiceOpen}
        onClose={() => setIsVoiceOpen(false)}
        onVoiceCommand={handleStartAIShoppingWithQuery}
      />

      {/* Quiet Refined Footer */}
      <Footer currentThemeId={currentThemeId} />

      {/* Floating Theme Switcher Bar */}
      <ThemeAndBgmBar
        currentThemeId={currentThemeId}
        onSelectTheme={handleSelectTheme}
      />
    </div>
  );
}
