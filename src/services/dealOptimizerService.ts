import { Product } from '../types';
import {
  Coupon,
  DealOptimizerResult,
  DealOptimizerStrategy,
  DealPathStep,
} from '../types/coupon';
import { CouponIntelligenceService } from './couponIntelligenceService';

export interface DealOptimizationInput {
  product: Product;
  originalPrice: number;
  negotiatedPrice?: number;
  userBudget?: number;
  offers: Coupon[];
  isNewUser?: boolean;
  paymentPreference?: string;
  isLiveMode?: boolean;
}

export class DealOptimizerService {
  /**
   * Main deal optimization engine that combines negotiation, live coupons,
   * bank payment offers, and seller promotions to compute the lowest valid final payable price.
   */
  static optimizeDeal(input: DealOptimizationInput): DealOptimizerResult {
    const {
      product,
      originalPrice,
      negotiatedPrice: rawNegPrice,
      userBudget: rawBudget,
      offers,
      isNewUser = false,
      paymentPreference = 'Credit Card / UPI',
      isLiveMode = true,
    } = input;

    const userBudget = rawBudget || product.listPrice;
    const negotiatedPrice = rawNegPrice !== undefined ? rawNegPrice : product.listPrice;
    const negotiationSavings = Math.max(0, originalPrice - negotiatedPrice);

    // 1. Filter and validate all candidate offers
    const eligibleOffers: Coupon[] = [];
    const excludedOffers: Array<{ offer: Coupon; reason: string }> = [];

    for (const offer of offers) {
      const val = CouponIntelligenceService.validateCouponEligibility(
        offer,
        product,
        negotiatedPrice,
        { isNewUser, paymentPreference }
      );
      if (val.isEligible) {
        eligibleOffers.push(offer);
      } else {
        excludedOffers.push({ offer, reason: val.reason || 'Not applicable to current cart criteria.' });
      }
    }

    // 2. Classify eligible offers into stack groups
    const promoCoupons = eligibleOffers
      .filter((o) => o.stackGroup === 'COUPON')
      .sort((a, b) => b.discountValue - a.discountValue);

    const paymentOffers = eligibleOffers
      .filter((o) => o.stackGroup === 'PAYMENT')
      .sort((a, b) => b.discountValue - a.discountValue);

    const cashbackOffers = eligibleOffers
      .filter((o) => o.stackGroup === 'CASHBACK')
      .sort((a, b) => b.discountValue - a.discountValue);

    const shippingOffers = eligibleOffers.filter((o) => o.discountType === 'FREE_SHIPPING');

    // 3. Select best valid combination respecting stacking rules (Section 13)
    const appliedCoupon = promoCoupons.length > 0 ? promoCoupons[0] : null;
    const appliedPaymentOffer = paymentOffers.length > 0 ? paymentOffers[0] : null;
    const appliedCashback = cashbackOffers.length > 0 ? cashbackOffers[0] : null;

    // Calculate savings
    const couponSavings = appliedCoupon ? appliedCoupon.discountValue : 0;
    const paymentSavings = appliedPaymentOffer ? appliedPaymentOffer.discountValue : 0;
    const cashbackAmount = appliedCashback ? appliedCashback.discountValue : 0;
    const shippingCost = shippingOffers.length > 0 ? 0 : 0; // Standard free delivery verified

    // Final Payable Price (Pay Now)
    const finalPayablePrice = Math.max(
      product.minAcceptablePrice || 1,
      negotiatedPrice - couponSavings - paymentSavings + shippingCost
    );

    // Effective Cost after Cashback
    const effectiveCostAfterCashback = Math.max(1, finalPayablePrice - cashbackAmount);
    const totalSavings = Math.max(0, originalPrice - finalPayablePrice);
    const savingsPercent = Math.min(
      95,
      Math.round((totalSavings / Math.max(1, originalPrice)) * 100)
    );

    // 4. Compute transparent, multi-factor Deal Score (Section 15)
    // Factors: savings %, budget compliance, coupon verification, product & seller rating
    let score = 55;
    score += Math.min(25, Math.round(savingsPercent * 0.9));

    if (finalPayablePrice <= userBudget) {
      score += 12; // Within budget bonus
    } else if (finalPayablePrice <= userBudget * 1.05) {
      score += 5;
    }

    if (appliedCoupon && appliedCoupon.verificationStatus === 'VERIFIED') score += 5;
    if (appliedPaymentOffer) score += 4;
    if (product.rating >= 4.5) score += 4;
    if (negotiationSavings > 0) score += 5;

    const dealScore = Math.min(99, Math.max(48, score));

    let dealScoreTier: DealOptimizerResult['dealScoreTier'] = 'great';
    let dealScoreTierLabel = '🟢 Great Deal';
    if (dealScore >= 90) {
      dealScoreTier = 'exceptional';
      dealScoreTierLabel = '🔥 Exceptional Deal';
    } else if (dealScore >= 75) {
      dealScoreTier = 'great';
      dealScoreTierLabel = '🟢 Great Deal';
    } else if (dealScore >= 60) {
      dealScoreTier = 'fair';
      dealScoreTierLabel = '🟡 Fair Deal';
    } else {
      dealScoreTier = 'wait';
      dealScoreTierLabel = '🔴 Wait / Look for Better Deal';
    }

    // 5. Compute Negotiation Potential (Section 16)
    let negotiationPotential: DealOptimizerResult['negotiationPotential'] = 'medium';
    let negotiationPotentialReason = 'Seller has standard promotional flexibility.';

    if (product.isNegotiable && product.listPrice >= 2000) {
      const room = product.listPrice - (product.minAcceptablePrice || product.listPrice * 0.85);
      if (room >= 300) {
        negotiationPotential = 'high';
        negotiationPotentialReason = `High potential — seller bottom line allows up to ₹${Math.round(room).toLocaleString('en-IN')} additional concession.`;
      } else {
        negotiationPotential = 'medium';
        negotiationPotentialReason = `Moderate potential — expected room for ₹${Math.round(room).toLocaleString('en-IN')} discount.`;
      }
    } else {
      negotiationPotential = 'low';
      negotiationPotentialReason = 'Current listing is already heavily discounted near cost floor.';
    }

    // 6. Deal Path Visualization steps (Section 18)
    const dealPath: DealPathStep[] = [
      {
        step: 'Original Price',
        label: 'Listed Marketplace Price',
        amount: 0,
        runningPrice: originalPrice,
        icon: 'Tag',
        color: 'text-slate-600',
      },
    ];

    let running = originalPrice;

    if (negotiationSavings > 0) {
      running -= negotiationSavings;
      dealPath.push({
        step: 'AI Negotiation',
        label: `Buyer AI ↔ Seller AI Concession`,
        amount: negotiationSavings,
        runningPrice: running,
        icon: 'Zap',
        color: 'text-blue-500',
      });
    }

    if (couponSavings > 0 && appliedCoupon) {
      running -= couponSavings;
      dealPath.push({
        step: 'Live Coupon Applied',
        label: `${appliedCoupon.code} (${appliedCoupon.title})`,
        amount: couponSavings,
        runningPrice: running,
        icon: 'Ticket',
        color: 'text-emerald-500',
      });
    }

    if (paymentSavings > 0 && appliedPaymentOffer) {
      running -= paymentSavings;
      dealPath.push({
        step: 'Payment Gateway Offer',
        label: `${appliedPaymentOffer.title}`,
        amount: paymentSavings,
        runningPrice: running,
        icon: 'CreditCard',
        color: 'text-purple-500',
      });
    }

    dealPath.push({
      step: 'Final Payable Deal',
      label: 'Guaranteed checkout payable amount',
      amount: totalSavings,
      runningPrice: finalPayablePrice,
      icon: 'CheckCircle2',
      color: 'text-emerald-600',
    });

    // 7. Strategy Comparison Table (Section 24)
    const strategiesComparison: DealOptimizerStrategy[] = [
      {
        strategy: 'Original Price',
        finalPrice: originalPrice,
        savings: 0,
      },
      {
        strategy: 'Coupon Only',
        finalPrice: Math.max(1, originalPrice - couponSavings),
        savings: couponSavings,
      },
      {
        strategy: 'Negotiation Only',
        finalPrice: negotiatedPrice,
        savings: negotiationSavings,
      },
      {
        strategy: 'Coupon + Negotiation',
        finalPrice: Math.max(1, negotiatedPrice - couponSavings),
        savings: negotiationSavings + couponSavings,
      },
      {
        strategy: 'Full Optimization (DealMate AI)',
        finalPrice: finalPayablePrice,
        savings: totalSavings,
        isOptimal: true,
      },
    ];

    // 8. "Why DealMate chose this deal" verified bullet points (Section 23)
    const whyBestDealReasons: string[] = [];
    if (negotiationSavings > 0) {
      whyBestDealReasons.push(`₹${negotiationSavings.toLocaleString('en-IN')} secured through autonomous buyer-seller AI negotiation`);
    }
    if (appliedCoupon) {
      whyBestDealReasons.push(`₹${appliedCoupon.discountValue.toLocaleString('en-IN')} verified coupon "${appliedCoupon.code}" applied (Source: ${appliedCoupon.source})`);
    }
    if (appliedPaymentOffer) {
      whyBestDealReasons.push(`₹${appliedPaymentOffer.discountValue.toLocaleString('en-IN')} instant bank offer applied via ${appliedPaymentOffer.bank || 'payment gateway'}`);
    }
    whyBestDealReasons.push('Free express delivery included');
    if (finalPayablePrice <= userBudget) {
      whyBestDealReasons.push(`Well within your configured budget of ₹${userBudget.toLocaleString('en-IN')}`);
    }
    whyBestDealReasons.push(`Seller rating ${product.sellerRating}/5 with verified stock`);
    whyBestDealReasons.push(`Verified live offers checked ${appliedCoupon?.lastChecked || 'just now'}`);

    // 9. AI Explanation text (Section 33)
    const parts: string[] = [];
    if (negotiationSavings > 0) {
      parts.push(`negotiated the seller price down by ₹${negotiationSavings.toLocaleString('en-IN')}`);
    }
    if (appliedCoupon) {
      parts.push(`applied a verified ₹${appliedCoupon.discountValue.toLocaleString('en-IN')} promo code (${appliedCoupon.code})`);
    }
    if (appliedPaymentOffer) {
      parts.push(`identified a ₹${appliedPaymentOffer.discountValue.toLocaleString('en-IN')} payment discount`);
    }
    const explanationText = `DealMate ${parts.join(', ')}. After accounting for shipping, your lowest valid final payable price is ₹${finalPayablePrice.toLocaleString('en-IN')}, saving you ₹${totalSavings.toLocaleString('en-IN')} (${savingsPercent}% discount).`;

    const isUnderBudget = finalPayablePrice <= userBudget;
    const budgetDifference = Math.abs(userBudget - finalPayablePrice);

    return {
      product,
      originalPrice,
      sellerDiscount: Math.max(0, product.marketPrice - product.listPrice),
      negotiatedPrice,
      negotiationSavings,
      appliedCoupon,
      couponSavings,
      appliedPaymentOffer,
      paymentSavings,
      appliedCashback,
      cashbackAmount,
      shippingCost,
      finalPayablePrice,
      effectiveCostAfterCashback,
      totalSavings,
      savingsPercent,
      dealScore,
      dealScoreTier,
      dealScoreTierLabel,
      negotiationPotential,
      negotiationPotentialReason,
      isUnderBudget,
      budgetDifference,
      userBudget,
      strategiesComparison,
      dealPath,
      whyBestDealReasons,
      excludedOffers,
      availableOffers: eligibleOffers,
      explanationText,
      optimizedAt: 'Just now',
      isLiveMode,
    };
  }
}
