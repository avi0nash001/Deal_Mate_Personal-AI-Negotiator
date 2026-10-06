import React, { useState, useRef, useEffect } from 'react';
import {
  QrCode,
  Camera,
  CameraOff,
  CheckCircle2,
  Plus,
  Package,
  Store,
  Sparkles,
  Trash2,
  Search,
  ScanLine,
  ArrowUpRight,
  ShieldCheck,
  Sliders,
  Save,
  Edit2,
  Check,
  X,
  MessageSquare,
  ShoppingBag,
  LogOut,
  MapPin,
  Phone,
  Briefcase,
  Lock,
} from 'lucide-react';
import {
  AppUser,
  Product,
  QRProductPreset,
  NegotiationAuditRecord,
  CategoryNegotiationSetting,
  IncomingNegotiationRequest,
  Order,
} from '../../types';
import { PRESEEDED_QR_PRODUCTS, INITIAL_INCOMING_NEGOTIATIONS } from '../../data/catalog';
import {
  priceFloor,
  MAX_SINGLE_ITEM_DISCOUNT,
  MAX_BUNDLE_DISCOUNT,
} from '../../services/negotiationEngine';
import {
  auth,
  db,
  doc,
  setDoc,
  serverTimestamp,
  OperationType,
  handleFirestoreError,
} from '../../firebase';

interface StoreOwnerPortalProps {
  currentUser: AppUser | null;
  products: Product[];
  negotiationRecords: NegotiationAuditRecord[];
  orders?: Order[];
  categorySettings: CategoryNegotiationSetting[];
  onUpsertCategorySetting: (setting: CategoryNegotiationSetting) => void;
  onAddStoreProduct: (newProduct: Product) => void;
  onUpdateProductPrice?: (productId: string, newPrice: number) => void;
  onUpdateProductStock?: (productId: string, newStock: number) => void;
  onUpdateStoreProduct?: (updatedProduct: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onUpdateUserProfile?: (updatedUser: AppUser) => void;
  onOpenAuthModal: () => void;
  onSignOut?: () => void;
  onNavigateToSearch: (query?: string) => void;
}

const SUGGESTED_CATEGORIES = [
  'Electronics',
  'Fashion',
  'Footwear',
  'Accessories',
  'Grocery',
  'Home',
  'Gifts',
];

export const StoreOwnerPortal: React.FC<StoreOwnerPortalProps> = ({
  currentUser,
  products,
  negotiationRecords,
  orders = [],
  categorySettings,
  onUpsertCategorySetting,
  onAddStoreProduct,
  onUpdateProductPrice,
  onUpdateProductStock,
  onUpdateStoreProduct,
  onDeleteProduct,
  onUpdateUserProfile,
  onOpenAuthModal,
  onSignOut,
  onNavigateToSearch,
}) => {
  const [activePortalTab, setActivePortalTab] = useState<
    'inventory' | 'negotiations' | 'sales' | 'store_profile'
  >('inventory');

  const [scanningPresetId, setScanningPresetId] = useState<string | null>(null);
  const [scanSuccessMessage, setScanSuccessMessage] = useState<string | null>(null);
  const [customQrInput, setCustomQrInput] = useState<string>('');
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Add Product Form State
  const [formName, setFormName] = useState('');
  const [formBrand, setFormBrand] = useState('');
  const [formCategory, setFormCategory] = useState('Electronics');
  const [formListPrice, setFormListPrice] = useState<number>(2499);
  const [formImageUrl, setFormImageUrl] = useState<string>(
    PRESEEDED_QR_PRODUCTS[0]?.image ||
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80'
  );
  const [formStock, setFormStock] = useState<number>(25);
  const [formSku, setFormSku] = useState<string>('SKU-QR-901');
  const [formDescription, setFormDescription] = useState<string>(
    'QR-Verified Store Owner Product ready for instant AI negotiation and local pickup.'
  );

  // Inline Edit Product State
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editName, setEditName] = useState<string>('');
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editStock, setEditStock] = useState<number>(0);

  // Incoming Negotiation Requests State
  const [incomingRequests, setIncomingRequests] = useState<IncomingNegotiationRequest[]>(
    INITIAL_INCOMING_NEGOTIATIONS
  );
  const [counterOfferInputs, setCounterOfferInputs] = useState<Record<string, number>>({});
  const [counterNoteInputs, setCounterNoteInputs] = useState<Record<string, string>>({});

  // Store Profile State
  const [profileStoreName, setProfileStoreName] = useState(
    currentUser?.storeName || 'Urban Threads Studio (Indiranagar)'
  );
  const [profileOwnerName, setProfileOwnerName] = useState(
    currentUser?.displayName || 'Vikram Malhotra'
  );
  const [profileCategory, setProfileCategory] = useState(
    currentUser?.businessCategory || 'Fashion & Apparel'
  );
  const [profileAddress, setProfileAddress] = useState(
    currentUser?.storeAddress || '100ft Road, Indiranagar, Bengaluru 560038'
  );
  const [profilePhone, setProfilePhone] = useState(
    currentUser?.phone || '+91 98801 44501'
  );
  const [profileSavedMsg, setProfileSavedMsg] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser?.role === 'store_owner') {
      setProfileStoreName(currentUser.storeName || `${currentUser.displayName}'s Store`);
      setProfileOwnerName(currentUser.displayName);
      setProfileCategory(currentUser.businessCategory || 'Electronics & Audio');
      setProfileAddress(
        currentUser.storeAddress || '100ft Road, Indiranagar, Bengaluru'
      );
      setProfilePhone(currentUser.phone || '+91 98801 44501');
    }
  }, [currentUser]);

  // Role-Based Access Guard: Regular USER accounts cannot modify shop owner accounts or inventory
  if (currentUser && currentUser.role === 'user') {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 rounded-3xl bg-white border border-slate-200 shadow-xl text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
          <Lock className="w-7 h-7" />
        </div>
        <h2 className="font-display font-extrabold text-xl text-slate-900">
          Shop Owner Access Required
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          You are currently signed in as a Customer <strong>USER</strong> (
          <code className="font-mono">{currentUser.email}</code>). Standard user accounts
          cannot access the Shop Owner Dashboard or modify store inventory.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={onOpenAuthModal}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 cursor-pointer"
          >
            <Store className="w-4 h-4" />
            <span>Sign In / Register as Shop Owner</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigateToSearch()}
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold cursor-pointer"
          >
            Return to AI Deal Analyzer
          </button>
        </div>
      </div>
    );
  }

  // Active signed-in seller identity (scoped strictly to the shop owner's own seller_id)
  const activeSellerId =
    currentUser?.role === 'store_owner' ? currentUser.uid : 'store_owner_urban_01';
  const activeStoreName =
    currentUser?.storeName ||
    (currentUser?.role === 'store_owner'
      ? `${currentUser.displayName}'s Verified Store`
      : profileStoreName);

  // Scope Store Owner dashboard's product list to the signed-in seller's own seller_id
  const mySellerProducts = products.filter(
    (p) =>
      p.sellerId === activeSellerId ||
      (activeSellerId === 'store_owner_urban_01' &&
        (p.sellerId === 'seller_urban' || p.isStoreOwnerListed))
  );

  // Scoped incoming negotiations & completed sales for this store owner
  const myIncomingRequests = incomingRequests.filter(
    (req) =>
      req.sellerId === activeSellerId || activeSellerId === 'store_owner_urban_01'
  );

  const mySalesRecords = negotiationRecords.filter(
    (r) =>
      r.sellerId === activeSellerId ||
      activeSellerId === 'store_owner_urban_01' ||
      r.sellerName.toLowerCase().includes(activeStoreName.split(' ')[0].toLowerCase())
  );

  const sellerCategories = Array.from(
    new Set([
      ...mySellerProducts.map((p) => p.category),
      ...SUGGESTED_CATEGORIES.slice(0, 4),
    ])
  );

  const [savedRangeCategory, setSavedRangeCategory] = useState<string | null>(null);

  const getCategoryRange = (category: string) => {
    const found = categorySettings.find(
      (s) =>
        s.sellerId === activeSellerId &&
        s.category.toLowerCase() === category.toLowerCase()
    );
    return {
      maxSingleDiscountPct: found?.maxSingleDiscountPct ?? MAX_SINGLE_ITEM_DISCOUNT,
      maxBundleDiscountPct: found?.maxBundleDiscountPct ?? MAX_BUNDLE_DISCOUNT,
    };
  };

  const handleSaveCategoryRange = async (
    category: string,
    singlePct: number,
    bundlePct: number
  ) => {
    const clampedSingle = Math.max(0, Math.min(40, Math.round(Number(singlePct) || 0)));
    const clampedBundle = Math.max(0, Math.min(40, Math.round(Number(bundlePct) || 0)));
    const cleanSeller = (auth.currentUser?.uid || activeSellerId)
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 60);
    const cleanCat = category.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 40);
    const settingId = `${cleanSeller}_${cleanCat}`;

    const setting: CategoryNegotiationSetting = {
      id: settingId,
      sellerId: activeSellerId,
      category,
      maxSingleDiscountPct: clampedSingle,
      maxBundleDiscountPct: clampedBundle,
    };

    onUpsertCategorySetting(setting);
    setSavedRangeCategory(category);
    setTimeout(() => setSavedRangeCategory(null), 2200);

    if (auth.currentUser) {
      const path = `categoryNegotiationSettings/${settingId}`;
      try {
        await setDoc(doc(db, 'categoryNegotiationSettings', settingId), {
          id: settingId,
          sellerId: auth.currentUser.uid,
          category: category.slice(0, 60),
          maxSingleDiscountPct: clampedSingle,
          maxBundleDiscountPct: clampedBundle,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        try {
          handleFirestoreError(err, OperationType.WRITE, path);
        } catch {
          // continue
        }
      }
    }
  };

  const startCameraScanner = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      setIsCameraActive(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      }, 100);
    } catch {
      setCameraError(
        'Camera access unavailable in this browser frame. Use the Pre-Seeded Product QR Scanner cards below for instant 1-click scanning!'
      );
      setIsCameraActive(false);
    }
  };

  const stopCameraScanner = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const persistProductToFirestore = async (product: Product) => {
    if (!auth.currentUser) return;
    const cleanId = product.id.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 120);
    const path = `storeProducts/${cleanId}`;
    try {
      await setDoc(doc(db, 'storeProducts', cleanId), {
        id: cleanId,
        name: product.name.slice(0, 160),
        brand: product.brand.slice(0, 80),
        category: product.category.slice(0, 60),
        listPrice: Number(product.listPrice),
        marketPrice: Number(Math.max(product.marketPrice, product.listPrice)),
        minAcceptablePrice: Number(Math.min(product.minAcceptablePrice, product.listPrice)),
        stock: Math.max(0, Math.floor(product.stock)),
        sellerId: auth.currentUser.uid,
        sellerName: product.sellerName.slice(0, 120),
        qrCodeData: (product.qrCodeData || `DM-QR::${cleanId}`).slice(0, 500),
        image: (
          product.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30'
        ).slice(0, 1000),
        description: (product.description || 'Verified Store Product').slice(0, 1000),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      try {
        handleFirestoreError(err, OperationType.CREATE, path);
      } catch {
        // continue
      }
    }
  };

  const handleScanPreseededQR = (preset: QRProductPreset) => {
    setScanningPresetId(preset.id);
    setScanSuccessMessage(null);

    setFormName(preset.name);
    setFormBrand(preset.brand);
    setFormCategory(preset.category);
    setFormListPrice(preset.listPrice);
    setFormImageUrl(preset.image);
    setFormStock(preset.stock);
    setFormSku(preset.sku);
    setFormDescription(preset.description);
    setCustomQrInput(preset.qrCodeData);

    setTimeout(async () => {
      const catRange = getCategoryRange(preset.category);
      const calculatedFloor = priceFloor(
        preset.listPrice,
        catRange.maxSingleDiscountPct,
        false
      );

      const newProd: Product = {
        id: `store_${preset.id}_${Date.now().toString(36)}`,
        name: preset.name,
        brand: preset.brand,
        category: preset.category,
        purpose: ['College', 'Casual', 'Everyday', 'Gift'],
        rating: 4.9,
        reviewsCount: 128,
        listPrice: preset.listPrice,
        marketPrice: preset.marketPrice,
        minAcceptablePrice: calculatedFloor,
        maxDiscountPercent: catRange.maxSingleDiscountPct,
        stock: preset.stock,
        sellerId: activeSellerId,
        sellerName: activeStoreName,
        sellerRating: 4.9,
        isLocalStore: true,
        isStoreOwnerListed: true,
        marketplaceSource: 'Store Owner QR Verified',
        qrCodeData: preset.qrCodeData,
        storeDistance: '1.1 km away',
        storeAddress: profileAddress,
        image: preset.image,
        description: preset.description,
        specs: preset.specs,
        isNegotiable: true,
        bundleEligible: true,
        deliveryDays: 1,
        aiMatchScore: 99,
        whyRecommended: `Listed directly by Store Owner (${activeStoreName}) via QR Scan (${preset.sku}). Supports instant AI bargaining!`,
      };

      onAddStoreProduct(newProd);
      await persistProductToFirestore(newProd);
      setScanningPresetId(null);
      setScanSuccessMessage(
        `QR Code [${preset.sku}] scanned & verified! "${preset.name}" is now live in your Seller Dashboard AND Shopper Search.`
      );
    }, 550);
  };

  const handleManualOrCustomQRSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const listPrice = Math.max(1, Number(formListPrice) || 999);
    const catRange = getCategoryRange(formCategory);
    const computedFloor = priceFloor(listPrice, catRange.maxSingleDiscountPct, false);

    const newProd: Product = {
      id: `store_custom_${Date.now().toString(36)}`,
      name: formName.trim(),
      brand: formBrand.trim() || activeStoreName,
      category: formCategory.trim() || 'Electronics',
      purpose: ['College', 'Everyday', 'Casual'],
      rating: 4.9,
      reviewsCount: 64,
      listPrice,
      marketPrice: Math.round(listPrice * 1.25),
      minAcceptablePrice: computedFloor,
      maxDiscountPercent: catRange.maxSingleDiscountPct,
      stock: Math.max(1, Number(formStock) || 15),
      sellerId: activeSellerId,
      sellerName: activeStoreName,
      sellerRating: 4.9,
      isLocalStore: true,
      isStoreOwnerListed: true,
      marketplaceSource: 'Store Owner QR Verified',
      qrCodeData: customQrInput || `DM-QR::${formSku}::PRICE-${listPrice}`,
      storeDistance: '1.4 km away',
      storeAddress: profileAddress,
      image: formImageUrl.trim() || PRESEEDED_QR_PRODUCTS[0].image,
      description: formDescription,
      specs: {
        'QR SKU': formSku,
        'Listed By': activeStoreName,
        'Max Single Discount': `${catRange.maxSingleDiscountPct}%`,
      },
      isNegotiable: true,
      bundleEligible: true,
      deliveryDays: 1,
      aiMatchScore: 98,
      whyRecommended: `Store Owner listing from ${activeStoreName}.`,
    };

    onAddStoreProduct(newProd);
    await persistProductToFirestore(newProd);
    setScanSuccessMessage(
      `Product "${newProd.name}" added to your Seller catalogue and indexed immediately in Shopper Search!`
    );
  };

  // Start editing own product
  const handleStartEditProduct = (item: Product) => {
    setEditingProductId(item.id);
    setEditName(item.name);
    setEditPrice(item.listPrice);
    setEditStock(item.stock);
  };

  const handleSaveEditProduct = (item: Product) => {
    const nextPrice = Math.max(1, Number(editPrice) || item.listPrice);
    const nextStock = Math.max(0, Number(editStock) ?? item.stock);
    const nextName = editName.trim() || item.name;

    onUpdateProductPrice?.(item.id, nextPrice);
    onUpdateProductStock?.(item.id, nextStock);
    onUpdateStoreProduct?.({
      ...item,
      name: nextName,
      listPrice: nextPrice,
      stock: nextStock,
    });
    setEditingProductId(null);
  };

  // Respond to Incoming Negotiation Request (Accept / Reject / Counter)
  const handleRespondNegotiation = (
    requestId: string,
    decision: 'ACCEPTED' | 'REJECTED' | 'COUNTERED'
  ) => {
    setIncomingRequests((prev) =>
      prev.map((req) => {
        if (req.id !== requestId) return req;
        const customCounter = counterOfferInputs[requestId];
        const customNote = counterNoteInputs[requestId];
        if (decision === 'ACCEPTED') {
          return {
            ...req,
            status: 'ACCEPTED',
            sellerResponseNote:
              customNote ||
              `Offer of ₹${req.buyerOfferPrice.toLocaleString('en-IN')} accepted by ${activeStoreName}!`,
          };
        }
        if (decision === 'REJECTED') {
          return {
            ...req,
            status: 'REJECTED',
            sellerResponseNote:
              customNote ||
              `Offer below store floor. Minimum acceptable price is enforced.`,
          };
        }
        const counterVal =
          customCounter && customCounter > req.buyerOfferPrice
            ? customCounter
            : Math.round((req.listPrice + req.buyerOfferPrice) / 2);
        return {
          ...req,
          status: 'COUNTERED',
          sellerCounterPrice: counterVal,
          sellerResponseNote:
            customNote ||
            `Counter-offer of ₹${counterVal.toLocaleString('en-IN')} sent with priority store dispatch.`,
        };
      })
    );
  };

  const handleSaveStoreProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUser && onUpdateUserProfile) {
      onUpdateUserProfile({
        ...currentUser,
        displayName: profileOwnerName.trim() || currentUser.displayName,
        storeName: profileStoreName.trim() || currentUser.storeName,
        businessCategory: profileCategory,
        storeAddress: profileAddress.trim(),
        phone: profilePhone.trim(),
      });
    }
    setProfileSavedMsg('Store profile & merchant details updated.');
    setTimeout(() => setProfileSavedMsg(null), 2800);
  };

  const storeRevenue = mySalesRecords.reduce((acc, r) => acc + r.finalPrice, 0);
  const pendingRequestsCount = myIncomingRequests.filter(
    (r) => r.status === 'PENDING'
  ).length;

  return (
    <div className="space-y-7 max-w-7xl mx-auto">
      {/* Top Store Owner Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-950 text-white border border-emerald-500/30 shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-mono font-bold uppercase">
            <Store className="w-3.5 h-3.5" />
            <span>
              Shop Owner Dashboard · Role: SHOP_OWNER · ID: {activeSellerId}
            </span>
          </div>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-white">
            {activeStoreName}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Create, edit, and manage your store inventory, respond to incoming buyer AI
            negotiation offers, configure per-category discount floors, and manage your
            store profile.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {!currentUser && (
            <button
              onClick={onOpenAuthModal}
              className="px-4 py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs flex items-center gap-2 cursor-pointer shadow-lg"
            >
              <Store className="w-4 h-4" />
              <span>Sign In as Shop Owner</span>
            </button>
          )}
          <button
            onClick={() => onNavigateToSearch()}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs flex items-center gap-2 cursor-pointer"
          >
            <Search className="w-4 h-4 text-cyan-400" />
            <span>View in AI Deal Analyzer</span>
          </button>
          {currentUser && onSignOut && (
            <button
              onClick={onSignOut}
              className="px-3.5 py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-400/30 text-rose-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          )}
        </div>
      </div>

      {/* Store Owner KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="text-[11px] font-mono uppercase text-slate-500">
            My Store Products
          </div>
          <div className="text-2xl font-extrabold font-mono text-slate-900 mt-1">
            {mySellerProducts.length}
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">
            Scoped to {activeSellerId}
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="text-[11px] font-mono uppercase text-slate-500">
            Incoming Offer Requests
          </div>
          <div className="text-2xl font-extrabold font-mono text-amber-600 mt-1">
            {myIncomingRequests.length}{' '}
            <span className="text-xs font-normal text-slate-500">
              ({pendingRequestsCount} pending)
            </span>
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Accept, reject, or counter
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="text-[11px] font-mono uppercase text-slate-500">
            AI Deals & Orders Closed
          </div>
          <div className="text-2xl font-extrabold font-mono text-blue-600 mt-1">
            {mySalesRecords.length + orders.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Verified store transactions
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="text-[11px] font-mono uppercase text-slate-500">
            Store Revenue (GMV)
          </div>
          <div className="text-2xl font-extrabold font-mono text-slate-900 mt-1">
            ₹{storeRevenue.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">
            Protected above category floor
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs for Shop Owner */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-slate-100 border border-slate-200">
        <button
          type="button"
          onClick={() => setActivePortalTab('inventory')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activePortalTab === 'inventory'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Package className="w-4 h-4 text-emerald-400" />
          <span>Inventory, Products & Floor Rules ({mySellerProducts.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActivePortalTab('negotiations')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activePortalTab === 'negotiations'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <MessageSquare className="w-4 h-4 text-amber-400" />
          <span>Incoming Negotiation Requests</span>
          {pendingRequestsCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-mono font-extrabold">
              {pendingRequestsCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActivePortalTab('sales')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activePortalTab === 'sales'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ShoppingBag className="w-4 h-4 text-blue-400" />
          <span>Store Sales & Orders ({mySalesRecords.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActivePortalTab('store_profile')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activePortalTab === 'store_profile'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Store className="w-4 h-4 text-cyan-400" />
          <span>Manage Store Profile</span>
        </button>
      </div>

      {/* =================================================================== */}
      {/* TAB 1: INVENTORY, PRODUCTS, QR SCANNER & FLOOR RULES                */}
      {/* =================================================================== */}
      {activePortalTab === 'inventory' && (
        <div className="space-y-8">
          {scanSuccessMessage && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
              <div className="flex items-center gap-2.5 text-xs font-bold">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{scanSuccessMessage}</span>
              </div>
              <button
                onClick={() => onNavigateToSearch(formName)}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <span>Test in Shopper Search</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Per-Category Negotiation Ranges Panel */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
              <div>
                <h2 className="font-display font-bold text-lg text-slate-900 flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-emerald-600" />
                  <span>Negotiation Floor Rules (Per-Category Discount Bounds)</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Configure your store&apos;s maximum single-item and bundle discount % (0–40%)
                  per category.
                </p>
              </div>
              <span className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                Defaults: {MAX_SINGLE_ITEM_DISCOUNT}% Single / {MAX_BUNDLE_DISCOUNT}%
                Bundle
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {sellerCategories.map((cat) => (
                <CategoryRangeCard
                  key={cat}
                  category={cat}
                  initialSinglePct={getCategoryRange(cat).maxSingleDiscountPct}
                  initialBundlePct={getCategoryRange(cat).maxBundleDiscountPct}
                  isSaved={savedRangeCategory === cat}
                  onSave={(singlePct, bundlePct) =>
                    handleSaveCategoryRange(cat, singlePct, bundlePct)
                  }
                />
              ))}
            </div>
          </div>

          {/* Add Product Form + Pre-Seeded QR Scanner */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-5">
              <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <h3 className="font-display font-bold text-base text-slate-900">
                      Create New Store Product
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                    {activeSellerId.slice(0, 14)}
                  </span>
                </div>

                <form
                  onSubmit={handleManualOrCustomQRSubmit}
                  className="space-y-3.5 text-xs"
                >
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Product Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="e.g. Sony WF-C700N ANC Wireless Earbuds"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:border-emerald-600"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Category *
                      </label>
                      <input
                        type="text"
                        list="seller-category-suggestions"
                        required
                        value={formCategory}
                        onChange={(e) => setFormCategory(e.target.value)}
                        placeholder="Electronics / Fashion"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 bg-white focus:outline-none focus:border-emerald-600"
                      />
                      <datalist id="seller-category-suggestions">
                        {SUGGESTED_CATEGORIES.map((c) => (
                          <option key={c} value={c} />
                        ))}
                      </datalist>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Brand
                      </label>
                      <input
                        type="text"
                        value={formBrand}
                        onChange={(e) => setFormBrand(e.target.value)}
                        placeholder="Sony / Store Brand"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:border-emerald-600"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        List Price (₹) *
                      </label>
                      <input
                        type="number"
                        required
                        min={1}
                        value={formListPrice}
                        onChange={(e) => setFormListPrice(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-slate-900 font-bold focus:outline-none focus:border-emerald-600"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Opening Stock *
                      </label>
                      <input
                        type="number"
                        required
                        min={1}
                        value={formStock}
                        onChange={(e) => setFormStock(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-slate-900 focus:outline-none focus:border-emerald-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Image URL *
                    </label>
                    <input
                      type="url"
                      required
                      value={formImageUrl}
                      onChange={(e) => setFormImageUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-[11px] text-slate-900 focus:outline-none focus:border-emerald-600"
                    />
                  </div>

                  <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between text-[11px] font-mono">
                    <span className="text-emerald-800">
                      Category Floor ({formCategory}: max{' '}
                      {getCategoryRange(formCategory).maxSingleDiscountPct}% off):
                    </span>
                    <span className="font-extrabold text-emerald-900 text-xs">
                      ₹
                      {priceFloor(
                        Number(formListPrice) || 0,
                        getCategoryRange(formCategory).maxSingleDiscountPct,
                        false
                      ).toLocaleString('en-IN')}
                    </span>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Product & Publish to Store</span>
                  </button>
                </form>
              </div>
            </div>

            <div className="lg:col-span-7 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                <div>
                  <h2 className="font-display font-bold text-lg text-slate-900 flex items-center gap-2">
                    <QrCode className="w-5 h-5 text-emerald-600" />
                    <span>Instant QR Code Product Scanner</span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    Click any pre-seeded QR product card below or use the camera scanner.
                  </p>
                </div>

                <button
                  onClick={isCameraActive ? stopCameraScanner : startCameraScanner}
                  className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer border transition-all ${
                    isCameraActive
                      ? 'bg-rose-50 border-rose-200 text-rose-700'
                      : 'bg-slate-900 text-white border-slate-900 hover:bg-slate-800'
                  }`}
                >
                  {isCameraActive ? (
                    <>
                      <CameraOff className="w-3.5 h-3.5" />
                      <span>Stop Camera</span>
                    </>
                  ) : (
                    <>
                      <Camera className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Camera QR Scanner</span>
                    </>
                  )}
                </button>
              </div>

              {isCameraActive && (
                <div className="p-4 rounded-2xl bg-slate-950 border border-emerald-500/40 text-white space-y-3">
                  <div className="relative h-48 rounded-xl overflow-hidden bg-black flex items-center justify-center border border-slate-800">
                    <video
                      ref={videoRef}
                      className="w-full h-full object-cover"
                      playsInline
                      muted
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleScanPreseededQR(PRESEEDED_QR_PRODUCTS[0])}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-bold text-xs cursor-pointer"
                    >
                      Capture Scanned QR (Sony Earbuds)
                    </button>
                  </div>
                </div>
              )}

              {cameraError && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                  {cameraError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {PRESEEDED_QR_PRODUCTS.map((preset) => {
                  const isScanning = scanningPresetId === preset.id;
                  const alreadyListed = mySellerProducts.some(
                    (p) => p.qrCodeData === preset.qrCodeData
                  );
                  const catRange = getCategoryRange(preset.category);
                  const effectiveFloor = priceFloor(
                    preset.listPrice,
                    catRange.maxSingleDiscountPct,
                    false
                  );

                  return (
                    <div
                      key={preset.id}
                      className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                        alreadyListed
                          ? 'bg-emerald-50/50 border-emerald-300'
                          : 'bg-white border-slate-200 hover:border-emerald-400 shadow-xs'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-14 h-14 rounded-xl bg-slate-900 p-2 flex flex-col items-center justify-center shrink-0">
                          <QrCode className="w-8 h-8 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                            {preset.category}
                          </span>
                          <h3 className="font-display font-bold text-xs text-slate-900 mt-1 leading-snug">
                            {preset.name}
                          </h3>
                          <div className="flex items-center gap-2.5 mt-1 text-[11px] font-mono">
                            <span className="text-slate-900 font-bold">
                              ₹{preset.listPrice.toLocaleString('en-IN')}
                            </span>
                            <span className="text-emerald-700 font-semibold">
                              Floor: ₹{effectiveFloor.toLocaleString('en-IN')}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between gap-2">
                        <span className="text-[10px] font-mono text-slate-400 truncate max-w-[140px]">
                          {preset.sku}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleScanPreseededQR(preset)}
                          disabled={isScanning}
                          className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-emerald-600 text-white text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer"
                        >
                          <ScanLine className="w-3.5 h-3.5" />
                          <span>{isScanning ? 'Scanning...' : 'Scan QR to Add'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Scoped Seller Inventory Table (Create / Edit / Remove Own Products) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-600" />
                <h2 className="font-display font-bold text-lg text-slate-900">
                  My Store Inventory ({mySellerProducts.length} Products)
                </h2>
              </div>
              <span className="text-xs font-mono text-slate-500">
                Strict Ownership Scope: You can edit or remove only your own products
              </span>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Product</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">List Price</th>
                    <th className="py-3 px-4">AI Floor Price</th>
                    <th className="py-3 px-4">Inventory Stock</th>
                    <th className="py-3 px-4 text-right">Manage Product</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {mySellerProducts.map((item) => {
                    const catRange = getCategoryRange(item.category);
                    const singleFloor = priceFloor(
                      item.listPrice,
                      catRange.maxSingleDiscountPct,
                      false
                    );
                    const isEditing = editingProductId === item.id;

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/80">
                        <td className="py-3 px-4 flex items-center gap-3">
                          <img
                            src={item.image}
                            alt={item.name}
                            referrerPolicy="no-referrer"
                            className="w-10 h-10 rounded-lg object-cover bg-slate-100 shrink-0"
                          />
                          <div>
                            {isEditing ? (
                              <input
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="px-2 py-1 rounded border border-blue-400 font-sans text-xs text-slate-900 w-48"
                              />
                            ) : (
                              <div className="font-sans font-bold text-slate-900">
                                {item.name}
                              </div>
                            )}
                            <div className="text-[10px] text-slate-500">{item.brand}</div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-700">{item.category}</td>
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {isEditing ? (
                            <input
                              type="number"
                              value={editPrice}
                              onChange={(e) => setEditPrice(Number(e.target.value))}
                              className="w-24 px-2 py-1 rounded border border-blue-400 text-xs text-slate-900"
                            />
                          ) : (
                            `₹${item.listPrice.toLocaleString('en-IN')}`
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-emerald-700">
                            ₹{singleFloor.toLocaleString('en-IN')}
                          </span>
                          <span className="text-[10px] text-slate-500 ml-1">
                            (-{catRange.maxSingleDiscountPct}%)
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {isEditing ? (
                            <input
                              type="number"
                              value={editStock}
                              onChange={(e) => setEditStock(Number(e.target.value))}
                              className="w-20 px-2 py-1 rounded border border-blue-400 text-xs text-slate-900"
                            />
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-800">
                                {item.stock} units
                              </span>
                              {onUpdateProductStock && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      onUpdateProductStock(
                                        item.id,
                                        Math.max(0, item.stock - 1)
                                      )
                                    }
                                    className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-[10px] text-slate-700 cursor-pointer"
                                  >
                                    -1
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      onUpdateProductStock(item.id, item.stock + 5)
                                    }
                                    className="px-1.5 py-0.5 rounded bg-emerald-50 hover:bg-emerald-100 text-[10px] text-emerald-700 font-bold cursor-pointer"
                                  >
                                    +5
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {isEditing ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleSaveEditProduct(item)}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                                >
                                  <Check className="w-3 h-3" /> Save
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingProductId(null)}
                                  className="p-1 rounded-lg bg-slate-100 text-slate-600 cursor-pointer"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleStartEditProduct(item)}
                                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                                >
                                  <Edit2 className="w-3 h-3" /> Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onNavigateToSearch(item.name)}
                                  className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[10px] cursor-pointer"
                                >
                                  Preview
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onDeleteProduct(item.id)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                                  title="Remove Product"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 2: INCOMING NEGOTIATION REQUESTS (ACCEPT / REJECT / COUNTER)    */}
      {/* =================================================================== */}
      {activePortalTab === 'negotiations' && (
        <div className="space-y-4">
          <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
              <div>
                <h2 className="font-display font-bold text-lg text-slate-900">
                  Incoming Buyer Negotiation Requests
                </h2>
                <p className="text-xs text-slate-500">
                  Review live buyer offers submitted through DealMate AI Negotiator and
                  accept, counter, or reject them.
                </p>
              </div>
              <span className="text-xs font-mono text-emerald-700 font-bold">
                {myIncomingRequests.length} Requests for {activeStoreName}
              </span>
            </div>

            <div className="space-y-3">
              {myIncomingRequests.map((req) => {
                const discountAskedPct = Math.round(
                  ((req.listPrice - req.buyerOfferPrice) / req.listPrice) * 100
                );
                return (
                  <div
                    key={req.id}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3.5">
                      <img
                        src={req.productImage}
                        alt={req.productName}
                        referrerPolicy="no-referrer"
                        className="w-14 h-14 rounded-xl object-cover bg-white border border-slate-200 shrink-0"
                      />
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-display font-bold text-sm text-slate-900">
                            {req.productName}
                          </span>
                          <span
                            className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full font-bold ${
                              req.status === 'ACCEPTED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : req.status === 'REJECTED'
                                ? 'bg-rose-100 text-rose-800'
                                : req.status === 'COUNTERED'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {req.status}
                          </span>
                        </div>
                        <div className="text-xs text-slate-600">
                          Buyer: <strong>{req.buyerName}</strong> ({req.buyerEmail})
                        </div>
                        <div className="flex items-center gap-4 text-xs font-mono pt-0.5">
                          <span className="text-slate-500">
                            List Price: ₹{req.listPrice.toLocaleString('en-IN')}
                          </span>
                          <span className="font-bold text-blue-700">
                            Buyer Offer: ₹{req.buyerOfferPrice.toLocaleString('en-IN')} (-
                            {discountAskedPct}%)
                          </span>
                          {req.sellerCounterPrice && (
                            <span className="font-bold text-emerald-700">
                              Your Counter: ₹
                              {req.sellerCounterPrice.toLocaleString('en-IN')}
                            </span>
                          )}
                        </div>
                        {req.sellerResponseNote && (
                          <div className="text-[11px] text-slate-600 italic bg-white px-2.5 py-1 rounded-lg border border-slate-200 mt-1">
                            Note: {req.sellerResponseNote}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Response Controls */}
                    <div className="w-full lg:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <input
                        type="number"
                        placeholder="Counter ₹"
                        value={counterOfferInputs[req.id] || ''}
                        onChange={(e) =>
                          setCounterOfferInputs((prev) => ({
                            ...prev,
                            [req.id]: Number(e.target.value),
                          }))
                        }
                        className="w-full sm:w-28 h-9 px-2.5 rounded-xl bg-white border border-slate-300 text-xs font-mono text-slate-900"
                      />
                      <input
                        type="text"
                        placeholder="Optional merchant note..."
                        value={counterNoteInputs[req.id] || ''}
                        onChange={(e) =>
                          setCounterNoteInputs((prev) => ({
                            ...prev,
                            [req.id]: e.target.value,
                          }))
                        }
                        className="w-full sm:w-44 h-9 px-2.5 rounded-xl bg-white border border-slate-300 text-xs text-slate-900"
                      />
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleRespondNegotiation(req.id, 'ACCEPTED')}
                          className="px-3 h-9 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer"
                        >
                          Accept Offer
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRespondNegotiation(req.id, 'COUNTERED')}
                          className="px-3 h-9 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold cursor-pointer"
                        >
                          Counter
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRespondNegotiation(req.id, 'REJECTED')}
                          className="px-3 h-9 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 3: RELEVANT SALES & ORDERS                                      */}
      {/* =================================================================== */}
      {activePortalTab === 'sales' && (
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h2 className="font-display font-bold text-lg text-slate-900">
                Store Sales & Completed Negotiations
              </h2>
              <p className="text-xs text-slate-500">
                Orders and accepted AI deals for {activeStoreName}.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-700">
              Total Revenue: ₹{storeRevenue.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Deal / Order ID</th>
                  <th className="py-3 px-4">Buyer</th>
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">List Price</th>
                  <th className="py-3 px-4">Settled Price</th>
                  <th className="py-3 px-4">Buyer Saved</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {mySalesRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 text-slate-500">{rec.id}</td>
                    <td className="py-3 px-4">
                      <div className="font-sans font-bold text-slate-900">
                        {rec.userName}
                      </div>
                      <div className="text-[10px] text-slate-500">{rec.userEmail}</div>
                    </td>
                    <td className="py-3 px-4 font-sans font-semibold text-slate-900">
                      {rec.productName}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      ₹{rec.originalPrice.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      ₹{rec.finalPrice.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 font-bold text-emerald-600">
                      ₹{rec.savedAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        {rec.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 4: MANAGE STORE PROFILE                                         */}
      {/* =================================================================== */}
      {activePortalTab === 'store_profile' && (
        <div className="max-w-2xl p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="border-b border-slate-200 pb-3">
            <h2 className="font-display font-bold text-lg text-slate-900 flex items-center gap-2">
              <Store className="w-5 h-5 text-emerald-600" />
              <span>Manage Store Profile</span>
            </h2>
            <p className="text-xs text-slate-500">
              Update your business name, category, showroom address, and contact details.
            </p>
          </div>

          {profileSavedMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{profileSavedMsg}</span>
            </div>
          )}

          <form onSubmit={handleSaveStoreProfile} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Owner Full Name
                </label>
                <input
                  type="text"
                  value={profileOwnerName}
                  onChange={(e) => setProfileOwnerName(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Shop / Business Name
                </label>
                <input
                  type="text"
                  value={profileStoreName}
                  onChange={(e) => setProfileStoreName(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Business Category
                </label>
                <div className="relative">
                  <Briefcase className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={profileCategory}
                    onChange={(e) => setProfileCategory(e.target.value)}
                    className="w-full h-10 pl-8 pr-3 rounded-xl border border-slate-300 text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Business Phone Number
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    className="w-full h-10 pl-8 pr-3 rounded-xl border border-slate-300 text-slate-900"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Store Physical Address
              </label>
              <div className="relative">
                <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={profileAddress}
                  onChange={(e) => setProfileAddress(e.target.value)}
                  className="w-full h-10 pl-8 pr-3 rounded-xl border border-slate-300 text-slate-900"
                />
              </div>
            </div>

            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save Store Profile</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

interface CategoryRangeCardProps {
  category: string;
  initialSinglePct: number;
  initialBundlePct: number;
  isSaved: boolean;
  onSave: (singlePct: number, bundlePct: number) => void;
}

const CategoryRangeCard: React.FC<CategoryRangeCardProps> = ({
  category,
  initialSinglePct,
  initialBundlePct,
  isSaved,
  onSave,
}) => {
  const [singlePct, setSinglePct] = useState<number>(initialSinglePct);
  const [bundlePct, setBundlePct] = useState<number>(initialBundlePct);

  useEffect(() => {
    setSinglePct(initialSinglePct);
    setBundlePct(initialBundlePct);
  }, [initialSinglePct, initialBundlePct]);

  return (
    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between">
          <span className="font-display font-bold text-sm text-slate-900">
            {category}
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-600">
            0–40% Bounds
          </span>
        </div>

        <div className="mt-3 space-y-2.5 text-xs font-mono">
          <div>
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-slate-600">Max Single Discount %:</span>
              <span className="font-bold text-emerald-700">{singlePct}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={40}
              value={singlePct}
              onChange={(e) => setSinglePct(Number(e.target.value))}
              className="w-full accent-emerald-600 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-slate-600">Max Bundle Discount %:</span>
              <span className="font-bold text-blue-700">{bundlePct}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={40}
              value={bundlePct}
              onChange={(e) => setBundlePct(Number(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer"
            />
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onSave(singlePct, bundlePct)}
        className={`w-full py-2 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
          isSaved
            ? 'bg-emerald-600 text-white'
            : 'bg-slate-900 hover:bg-emerald-600 text-white'
        }`}
      >
        {isSaved ? (
          <>
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Range Saved!</span>
          </>
        ) : (
          <>
            <Save className="w-3.5 h-3.5" />
            <span>Save {category} Floor</span>
          </>
        )}
      </button>
    </div>
  );
};
