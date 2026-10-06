import { Product } from './index';

export type CouponDiscountType =
  | 'PERCENTAGE'
  | 'FIXED_AMOUNT'
  | 'CASHBACK'
  | 'FREE_SHIPPING'
  | 'BANK_OFFER'
  | 'SELLER_DISCOUNT';

export type CouponVerificationStatus =
  | 'VERIFIED'
  | 'LIMITED'
  | 'EXPIRING_SOON'
  | 'INVALID';

export type CouponStackGroup = 'SELLER' | 'COUPON' | 'PAYMENT' | 'CASHBACK';

export interface Coupon {
  id: string;
  code: string;
  title: string;
  description: string;
  discountType: CouponDiscountType;
  discountValue: number; // e.g. 200 for ₹200 or 10 for 10%
  maximumDiscount?: number; // e.g. 500 max cap for % coupons
  minimumCartValue: number;
  applicableProducts?: string[];
  applicableCategories?: string[];
  applicableBrands?: string[];
  applicableSellers?: string[];
  newUserOnly: boolean;
  existingUserEligible: boolean;
  paymentMethod?: string; // 'HDFC', 'ICICI', 'UPI', 'CRED', 'Axis Bank', 'Any'
  bank?: string;
  cardNetwork?: 'Visa' | 'Mastercard' | 'RuPay' | 'Amex' | 'All';
  startDate?: string;
  expiryDate?: string;
  usageLimit?: number;
  remainingUsage?: number;
  stackable: boolean;
  stackGroup: CouponStackGroup;
  source: string; // e.g. 'Amazon.in Official', 'Flipkart Partner Feed', 'Merchant Verified'
  sourceUrl?: string;
  verificationStatus: CouponVerificationStatus;
  lastVerified: string;
  lastChecked: string;
  confidenceScore: number; // 0 - 100
  termsAndConditions?: string;
}

export interface DealOptimizerStrategy {
  strategy: string;
  finalPrice: number;
  savings: number;
  isOptimal?: boolean;
}

export interface DealPathStep {
  step: string;
  label: string;
  amount: number;
  runningPrice: number;
  icon: string;
  color: string;
}

export interface DealOptimizerResult {
  product: Product;
  originalPrice: number;
  sellerDiscount: number;
  negotiatedPrice: number;
  negotiationSavings: number;
  appliedCoupon: Coupon | null;
  couponSavings: number;
  appliedPaymentOffer: Coupon | null;
  paymentSavings: number;
  appliedCashback: Coupon | null;
  cashbackAmount: number;
  shippingCost: number;
  finalPayablePrice: number; // Pay now price
  effectiveCostAfterCashback: number; // Final after cashback
  totalSavings: number;
  savingsPercent: number;
  dealScore: number; // 0-100
  dealScoreTier: 'exceptional' | 'great' | 'fair' | 'wait';
  dealScoreTierLabel: string;
  negotiationPotential: 'high' | 'medium' | 'low';
  negotiationPotentialReason: string;
  isUnderBudget: boolean;
  budgetDifference: number;
  userBudget: number;
  strategiesComparison: DealOptimizerStrategy[];
  dealPath: DealPathStep[];
  whyBestDealReasons: string[];
  excludedOffers: Array<{ offer: Coupon; reason: string }>;
  availableOffers: Coupon[];
  explanationText: string;
  optimizedAt: string;
  isLiveMode: boolean;
}

export interface SavedOptimizedDeal {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  merchantName: string;
  originalPrice: number;
  negotiatedPrice: number;
  couponCode?: string;
  paymentOffer?: string;
  finalPrice: number;
  totalSavings: number;
  dealScore: number;
  date: string;
  timestamp: number;
}
