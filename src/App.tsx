import React, { useState } from 'react';
import { Header, ActiveNavTab } from './components/common/Header';
import { Footer } from './components/common/Footer';
import { LandingHero } from './components/landing/LandingHero';
import { SmartBuyHero } from './components/home/SmartBuyHero';
import { AIShoppingAgent } from './components/ai/AIShoppingAgent';
import { CategoriesView } from './components/categories/CategoriesView';
import { LocalStoresView } from './components/stores/LocalStoresView';
import { ForBusinessView } from './components/business/ForBusinessView';
import { StreamlinedNegotiator } from './components/negotiation/StreamlinedNegotiator';
import { ProductCompareModal } from './components/compare/ProductCompareModal';
import { UserAccountModal } from './components/account/UserAccountModal';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { CheckoutModal } from './components/checkout/CheckoutModal';
import { OrdersView } from './components/orders/OrdersView';
import { VoiceAssistantModal } from './components/voice/VoiceAssistantModal';
import { ThemeAndBgmBar } from './components/common/ThemeAndBgmBar';
import { ThemeId, THEMES } from './types/theme';

import { PRODUCTS as initialProducts, LOCAL_STORES as initialStores } from './data/catalog';
import { Product, LocalStore, NegotiationSession, Order, DealToken, ActivityLogEntry } from './types';
import { NegotiationEngine } from './services/negotiationEngine';

export default function App() {
  const [currentTab, setCurrentTab] = useState<ActiveNavTab>('home');
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [stores, setStores] = useState<LocalStore[]>(initialStores);

  // AI Shopping Search query & budget state
  const [initialSearchQuery, setInitialSearchQuery] = useState<string>('');
  const [initialSearchBudget, setInitialSearchBudget] = useState<number | undefined>(undefined);

  // Saved items & compared items
  const [savedProductIds, setSavedProductIds] = useState<string[]>(['prod_shirt_01']);
  const [savedStoreIds, setSavedStoreIds] = useState<string[]>(['store_urban_threads']);
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

  // Orders state
  const [orders, setOrders] = useState<Order[]>([]);

  // Active negotiation session state
  const [session, setSession] = useState<NegotiationSession>(() =>
    NegotiationEngine.createSession(initialProducts[0], { target: 1600, maxBudget: 1900 })
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
    Array<{ sellerId: string; sellerName: string; offeredPrice: number; deliveryDays: number; stock: number; isBest?: boolean }>
  >([]);
  const [showMultiSeller, setShowMultiSeller] = useState<boolean>(false);

  // Navigation handlers
  const handleStartAIShoppingWithQuery = (query?: string) => {
    if (query) {
      setInitialSearchQuery(query);
      setRecentSearches((prev) => [query, ...prev.filter((q) => q !== query)].slice(0, 5));
    }
    setCurrentTab('ai_shopping');
  };

  const handleSelectBudgetFromHero = (budget: number) => {
    setInitialSearchBudget(budget);
    setCurrentTab('ai_shopping');
  };

  // Compare handlers
  const handleToggleCompare = (product: Product) => {
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
      prev.includes(product.id) ? prev.filter((id) => id !== product.id) : [...prev, product.id]
    );
  };

  // Launch Streamlined Negotiation
  const handleNegotiateProduct = (product: Product, targetPrice: number, maxBudget: number) => {
    const newSession = NegotiationEngine.createSession(product, {
      target: targetPrice,
      maxBudget,
    });
    setSession(newSession);
    setActiveStepIndex(0);
    setIsAutoPlaying(false);
    setShowMultiSeller(false);
    setCurrentTab('negotiator');
    setActivityLogs([
      {
        id: 'log_neg_' + Date.now(),
        timestamp: new Date().toLocaleTimeString(),
        agent: 'BUYER_AGENT',
        step: 'AUTONOMOUS_BARGAIN_INITIALIZED',
        detail: `Loaded ${product.name} (List: ₹${product.listPrice}). Target: ₹${targetPrice}, Ceiling: ₹${maxBudget}.`,
        type: 'info',
      },
    ]);
  };

  // 1-Click Earbuds Interactive Negotiation Demo
  const handleLaunchEarbudsDemo = () => {
    const earbuds = products.find((p) => p.category.toLowerCase().includes('electron') || p.id.includes('earbuds')) || products[0];
    handleNegotiateProduct(earbuds, 2400, 2600);
    setTimeout(() => {
      handleAutoNegotiate();
    }, 400);
  };

  // Step negotiation turn
  const handleStepNegotiation = () => {
    if (session.status === 'DEAL_ACCEPTED' || session.status === 'DEAL_REJECTED' || session.status === 'BUDGET_EXCEEDED') {
      return;
    }
    const { updatedSession, newOffer, logEntry } = NegotiationEngine.processStep(session, activeStepIndex);
    setSession(updatedSession);
    setActiveStepIndex((prev) => prev + 1);
    setActivityLogs((prev) => [logEntry, ...prev]);
  };

  // Auto negotiate turns
  const handleAutoNegotiate = () => {
    setIsAutoPlaying(true);
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

      const { updatedSession, newOffer, logEntry } = NegotiationEngine.processStep(currentSession, step);
      currentSession = updatedSession;
      step += 1;

      setSession(updatedSession);
      setActiveStepIndex(step);
      setActivityLogs((prev) => [logEntry, ...prev]);

      if (updatedSession.status === 'DEAL_ACCEPTED' || updatedSession.status === 'DEAL_REJECTED' || step >= 5) {
        clearInterval(interval);
        setIsAutoPlaying(false);
      }
    }, 1200);
  };

  const handleResetSession = () => {
    const newSession = NegotiationEngine.createSession(session.product, {
      target: session.userBudget.target,
      maxBudget: session.userBudget.maxBudget,
    });
    setSession(newSession);
    setActiveStepIndex(0);
    setIsAutoPlaying(false);
  };

  const handleToggleMultiSeller = () => {
    if (!showMultiSeller) {
      const comp = NegotiationEngine.runMultiSellerComparison(session.product, session.userBudget.target);
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
      setActiveDealToken(token);
      setIsCheckoutOpen(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOrderConfirmed = (newOrder: Order) => {
    setOrders((prev) => [newOrder, ...prev]);
    setCurrentTab('orders');
  };

  // Admin handlers
  const handleUpdateProductPrice = (productId: string, newPrice: number) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, listPrice: newPrice } : p))
    );
  };

  const handleDeleteProduct = (productId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId));
  };

  const comparedProducts = products.filter((p) => comparedProductIds.includes(p.id));
  const savedProducts = products.filter((p) => savedProductIds.includes(p.id));
  const savedStores = stores.filter((s) => savedStoreIds.includes(s.id));

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

      {/* SmartBuy / DealMate AI Top Bar */}
      <Header
        currentTab={currentTab}
        onNavigate={setCurrentTab}
        comparedCount={comparedProductIds.length}
        onOpenCompare={() => setIsCompareOpen(true)}
        savedCount={savedProductIds.length}
        onOpenAccount={() => setIsAccountOpen(true)}
        ordersCount={orders.length}
        isNegotiatingActive={currentTab === 'negotiator'}
        currentThemeId={currentThemeId}
        onSelectTheme={handleSelectTheme}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* 1. HOMEPAGE: DEALMATE 3D CINEMATIC HERO */}
        {currentTab === 'home' && (
          <LandingHero
            onStartNegotiating={() => setCurrentTab('negotiator')}
            onLaunchDemo={handleLaunchEarbudsDemo}
            onExploreMarketplace={() => setCurrentTab('categories')}
            onSelectProductForNegotiation={(prod) =>
              handleNegotiateProduct(prod, Math.round(prod.listPrice * 0.8), prod.listPrice)
            }
            currentThemeId={currentThemeId}
          />
        )}

        {/* 2. AI SHOPPING AGENT (Conversational + 3 Budget Tiers) */}
        {currentTab === 'ai_shopping' && (
          <AIShoppingAgent
            products={products}
            localStores={stores}
            initialQuery={initialSearchQuery}
            initialBudget={initialSearchBudget}
            onNegotiateProduct={handleNegotiateProduct}
            onCompareToggle={handleToggleCompare}
            comparedProductIds={comparedProductIds}
            onSaveToggle={handleToggleSaveProduct}
            savedProductIds={savedProductIds}
            onViewStore={() => setCurrentTab('stores')}
          />
        )}

        {/* 3. CATEGORIES VIEW */}
        {currentTab === 'categories' && (
          <CategoriesView
            onSelectCategory={(catId) => {
              setInitialSearchQuery(`I need ${catId} within my budget`);
              setCurrentTab('ai_shopping');
            }}
          />
        )}

        {/* 4. LOCAL STORES DISCOVERY */}
        {currentTab === 'stores' && (
          <LocalStoresView
            stores={stores}
            onSelectStoreProducts={() => setCurrentTab('ai_shopping')}
          />
        )}

        {/* 5. STREAMLINED FIXED-LAYOUT NEGOTIATOR (Single-Line Header HUD + Spacious Timeline) */}
        {currentTab === 'negotiator' && (
          <StreamlinedNegotiator
            session={session}
            activeStepIndex={activeStepIndex}
            isAutoPlaying={isAutoPlaying}
            activityLogs={activityLogs}
            competingSellers={competingSellers}
            showMultiSeller={showMultiSeller}
            onStepNegotiation={handleStepNegotiation}
            onAutoNegotiate={handleAutoNegotiate}
            onResetSession={handleResetSession}
            onToggleMultiSeller={handleToggleMultiSeller}
            onOpenCheckout={handleOpenCheckout}
            onBackToDiscovery={() => setCurrentTab('ai_shopping')}
            currentThemeId={currentThemeId}
          />
        )}

        {/* 6. FOR BUSINESSES */}
        {currentTab === 'for_business' && <ForBusinessView />}

        {/* 7. ORDERS */}
        {currentTab === 'orders' && (
          <OrdersView
            orders={orders}
            onStartNewNegotiation={() => setCurrentTab('ai_shopping')}
          />
        )}

        {/* 8. ADMIN DASHBOARD */}
        {currentTab === 'admin' && (
          <AdminDashboard
            products={products}
            stores={stores}
            onUpdateProductPrice={handleUpdateProductPrice}
            onDeleteProduct={handleDeleteProduct}
          />
        )}
      </main>

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
        savedProducts={savedProducts}
        savedStores={savedStores}
        recentSearches={recentSearches}
        onSelectProduct={(p) => {
          handleNegotiateProduct(p, Math.round(p.listPrice * 0.8), p.listPrice);
        }}
        onSelectSearch={handleStartAIShoppingWithQuery}
      />

      {/* Checkout Modal */}
      {activeDealToken && (
        <CheckoutModal
          isOpen={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
          product={session.product}
          dealToken={activeDealToken}
          onOrderConfirmed={handleOrderConfirmed}
        />
      )}

      {/* Voice Assistant Modal */}
      <VoiceAssistantModal
        isOpen={isVoiceOpen}
        onClose={() => setIsVoiceOpen(false)}
        onVoiceCommand={handleStartAIShoppingWithQuery}
      />

      {/* Quiet Refined Footer */}
      <Footer currentThemeId={currentThemeId} />

      {/* Floating Theme & Ambient BGM Switcher Bar */}
      <ThemeAndBgmBar
        currentThemeId={currentThemeId}
        onSelectTheme={handleSelectTheme}
      />
    </div>
  );
}
