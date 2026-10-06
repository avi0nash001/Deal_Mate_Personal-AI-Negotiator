export type NegotiationStatus =
  | 'IDLE'
  | 'DISCOVERING'
  | 'PRODUCT_MATCHED'
  | 'NEGOTIATION_STARTED'
  | 'BUYER_OFFER'
  | 'SELLER_COUNTER'
  | 'BUYER_COUNTER'
  | 'DEAL_ACCEPTED'
  | 'DEAL_REJECTED'
  | 'BUDGET_EXCEEDED'
  | 'OUT_OF_STOCK'
  | 'NEGOTIATION_EXPIRED';

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: string; // 'Fashion' | 'Electronics' | 'Footwear' | 'Grocery' | 'Beauty' | 'Gifts' | etc.
  subcategory?: string;
  purpose?: string[]; // e.g. ['College', 'Casual', 'Birthday', 'Office', 'Fitness']
  rating: number;
  reviewsCount: number;
  listPrice: number;
  marketPrice: number;
  minAcceptablePrice: number; // Seller bottom line (internal)
  maxDiscountPercent: number;
  stock: number;
  sellerId: string;
  sellerName: string;
  sellerRating: number;
  isLocalStore?: boolean;
  storeDistance?: string; // e.g. "1.4 km away"
  storeAddress?: string;
  image: string;
  description: string;
  specs: Record<string, string>;
  isNegotiable: boolean;
  bundleEligible: boolean;
  deliveryDays: number;
  budgetTier?: 'within_budget' | 'best_value' | 'slightly_above';
  aiMatchScore?: number; // e.g. 96
  whyRecommended?: string;
  marketplaceSource?:
    | 'Store Owner QR Verified'
    | 'Amazon.in'
    | 'Flipkart'
    | 'Myntra'
    | 'Croma'
    | 'Reliance Digital'
    | 'Ajio'
    | 'Nykaa'
    | 'Google Search Live'
    | 'Local Store';
  qrCodeData?: string;
  externalUrl?: string;
  externalId?: string;
  isStoreOwnerListed?: boolean;
  isLiveGoogleSearch?: boolean;
  searchSourceTitle?: string;
  fetchedAt?: string;
  priceHistory?: Array<{ date: string; price: number }>;
}

export * from './coupon';

export interface CategoryNegotiationSetting {
  id: string;
  sellerId: string;
  category: string;
  maxSingleDiscountPct: number; // 0-40, default 15
  maxBundleDiscountPct: number; // 0-40, default 20
}

export interface NegotiationExchangeTurn {
  round: number;
  speaker: 'BUYER_AGENT' | 'SELLER_AGENT';
  price: number;
  message: string;
}

export type UserRole = 'user' | 'store_owner' | 'admin';

export type AccountStatus = 'active' | 'disabled' | 'suspended';

export type ShopApprovalStatus = 'approved' | 'pending' | 'rejected';

export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  phone?: string;
  storeName?: string;
  businessCategory?: string;
  storeAddress?: string;
  emailVerified?: boolean;
  accountStatus?: AccountStatus;
  shopApprovalStatus?: ShopApprovalStatus;
  sessionToken?: string;
  totalSaved: number;
  totalSpent: number;
  negotiationsCount: number;
  createdAt: string;
}

export interface IncomingNegotiationRequest {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  listPrice: number;
  buyerId: string;
  buyerName: string;
  buyerEmail: string;
  buyerOfferPrice: number;
  sellerCounterPrice?: number;
  sellerId: string;
  sellerName: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COUNTERED';
  sellerResponseNote?: string;
  createdAt: string;
}

export interface ReportedProductItem {
  id: string;
  productId: string;
  productName: string;
  sellerName: string;
  reportedByEmail: string;
  reason: string;
  status: 'OPEN' | 'RESOLVED' | 'REMOVED';
  createdAt: string;
}

export interface PlatformSettings {
  requireEmailVerification: boolean;
  requireShopOwnerApproval: boolean;
  defaultMaxSingleDiscountPct: number;
  defaultMaxBundleDiscountPct: number;
  allowExternalRetailerFallback: boolean;
  platformSupportEmail: string;
}

export interface QRProductPreset {
  id: string;
  qrCodeData: string;
  sku: string;
  name: string;
  brand: string;
  category: string;
  listPrice: number;
  marketPrice: number;
  minAcceptablePrice: number;
  stock: number;
  image: string;
  description: string;
  specs: Record<string, string>;
}

export interface NegotiationAuditRecord {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  productId: string;
  productName: string;
  sellerId: string;
  sellerName: string;
  originalPrice: number;
  finalPrice: number;
  savedAmount: number;
  status: 'DEAL_ACCEPTED' | 'PURCHASED';
  createdAt: string;
}

export interface LocalStore {
  id: string;
  name: string;
  category: string;
  distance: string;
  rating: number;
  reviewsCount: number;
  openingHours: string;
  address: string;
  phone: string;
  whatsapp: string;
  services: string[];
  featuredProducts: string[];
  image?: string;
}

export interface UserRequirement {
  rawQuery?: string;
  budget: number;
  category?: string;
  productType?: string;
  purpose?: string;
  preference?: string;
  recipient?: string;
  color?: string;
  size?: string;
  gender?: string;
  location?: string;
  deliveryPreference?: 'instant' | 'delivery' | 'pickup';
}

export interface Seller {
  id: string;
  name: string;
  rating: number;
  totalSales: number;
  responseTime: string;
  negotiationFlexibility: 'strict' | 'moderate' | 'flexible';
  badge: string;
}

export interface NegotiationOffer {
  id: string;
  round: number;
  speaker: 'BUYER' | 'SELLER' | 'SYSTEM';
  sellerId?: string;
  sellerName?: string;
  price: number;
  message: string;
  timestamp: number;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COUNTERED';
  deltaFromTarget?: number;
  savingsSoFar?: number;
}

export interface NegotiationSession {
  id: string;
  productId: string;
  product: Product;
  userBudget: {
    target: number;
    maxBudget: number;
  };
  currentOffer: number;
  originalPrice: number;
  finalPrice?: number;
  totalSaved?: number;
  status: NegotiationStatus;
  offers: NegotiationOffer[];
  activeSellerId: string;
  multiSellerComparison?: Array<{
    sellerId: string;
    sellerName: string;
    offeredPrice: number;
    deliveryDays: number;
    stock: number;
    isBest?: boolean;
  }>;
  createdAt: number;
  expiresAt: number;
  token?: string;
}

export interface DealToken {
  negotiationId: string;
  productId: string;
  sellerId: string;
  originalPrice: number;
  finalPrice: number;
  savings: number;
  buyerMaxBudget: number;
  status: 'LOCKED' | 'EXPIRED' | 'PURCHASED';
  expiresAt: number;
  dealHash: string;
}

export interface Order {
  id: string;
  dealToken: DealToken;
  product: Product;
  quantity: number;
  totalPaid: number;
  totalSaved: number;
  status: 'CONFIRMED' | 'PREPARING' | 'SHIPPED' | 'DELIVERED';
  shippingAddress: {
    fullName: string;
    phone: string;
    address: string;
    city: string;
    postalCode: string;
  };
  paymentMethod: 'UPI' | 'CREDIT_CARD' | 'COD';
  placedAt: number;
  estimatedDelivery: string;
}

export interface ActivityLogEntry {
  id: string;
  timestamp: string;
  agent: 'BUYER_AGENT' | 'SELLER_AGENT' | 'PRODUCT_MATCHER' | 'NEGOTIATION_ENGINE';
  step: string;
  detail: string;
  type: 'info' | 'success' | 'warning' | 'audit';
}

export type VoiceState =
  | 'IDLE'
  | 'LISTENING'
  | 'UNDERSTANDING'
  | 'SEARCHING'
  | 'NEGOTIATING'
  | 'DEAL_SECURED';
