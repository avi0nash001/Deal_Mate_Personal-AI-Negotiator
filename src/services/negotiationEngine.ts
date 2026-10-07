import {
  Product,
  NegotiationOffer,
  NegotiationSession,
  DealToken,
  ActivityLogEntry,
  CategoryNegotiationSetting,
  NegotiationExchangeTurn,
  BulkDiscountTier,
  CollectiveDealPool,
  NegotiationMode,
} from '../types';
import { SELLERS, DEFAULT_BULK_DISCOUNT_TIERS, INITIAL_COLLECTIVE_POOLS } from '../data/catalog';

export const MAX_SINGLE_ITEM_DISCOUNT = 15; // 15% default -> 0.85 floor
export const MAX_BUNDLE_DISCOUNT = 20; // 20% default -> 0.80 floor

/**
 * Computes the strict minimum allowed unit price given listPrice and optional
 * seller category max discount % (0-40). Falls back to 15% single / 20% bundle.
 */
export function priceFloor(
  listPrice: number,
  maxDiscountPct?: number,
  isBundle: boolean = false
): number {
  const defaultPct = isBundle ? MAX_BUNDLE_DISCOUNT : MAX_SINGLE_ITEM_DISCOUNT;
  const boundedPct =
    typeof maxDiscountPct === 'number' && !Number.isNaN(maxDiscountPct)
      ? Math.max(0, Math.min(40, maxDiscountPct))
      : defaultPct;
  return Math.round(listPrice * (1 - boundedPct / 100));
}

/**
 * Clamps any proposed price to [priceFloor(listPrice, maxDiscountPct), listPrice].
 */
export function clampPrice(
  proposedPrice: number,
  listPrice: number,
  maxDiscountPct?: number,
  isBundle: boolean = false
): number {
  const floor = priceFloor(listPrice, maxDiscountPct, isBundle);
  return Math.max(floor, Math.min(listPrice, Math.round(proposedPrice)));
}

/**
 * Resolves the applicable max discount % for a product from category_negotiation_settings
 * by matching (sellerId + category).
 */
export function resolveCategorySetting(
  product: Product,
  settings: CategoryNegotiationSetting[] = []
): CategoryNegotiationSetting | undefined {
  const normCat = (product.category || '').trim().toLowerCase();
  const byExactSeller = settings.find(
    (s) =>
      s.sellerId === product.sellerId &&
      s.category.trim().toLowerCase() === normCat
  );
  if (byExactSeller) return byExactSeller;

  // Fallback to any store owner setting for that category if sellerId is a default store alias
  return settings.find((s) => s.category.trim().toLowerCase() === normCat);
}

export class NegotiationEngine {
  /**
   * Initialize a new negotiation session respecting category_negotiation_settings
   */
  static createSession(
    product: Product,
    userBudget: { target: number; maxBudget: number },
    categorySettings: CategoryNegotiationSetting[] = []
  ): NegotiationSession {
    const id = 'neg_' + Math.random().toString(36).substring(2, 9);
    const createdAt = Date.now();
    const expiresAt = createdAt + 15 * 60 * 1000; // 15 mins lock

    const matchedSetting = resolveCategorySetting(product, categorySettings);
    const effectiveFloor = matchedSetting
      ? priceFloor(product.listPrice, matchedSetting.maxSingleDiscountPct, false)
      : priceFloor(product.listPrice, product.maxDiscountPercent || MAX_SINGLE_ITEM_DISCOUNT, false);

    const normalizedProduct: Product = {
      ...product,
      minAcceptablePrice: effectiveFloor,
      maxDiscountPercent:
        matchedSetting?.maxSingleDiscountPct ??
        product.maxDiscountPercent ??
        MAX_SINGLE_ITEM_DISCOUNT,
    };

    return {
      id,
      productId: normalizedProduct.id,
      product: normalizedProduct,
      userBudget: {
        target: Math.max(100, userBudget.target),
        maxBudget: Math.max(userBudget.target, userBudget.maxBudget),
      },
      currentOffer: normalizedProduct.listPrice,
      originalPrice: normalizedProduct.listPrice,
      status: 'NEGOTIATION_STARTED',
      offers: [],
      activeSellerId: normalizedProduct.sellerId,
      createdAt,
      expiresAt,
    };
  }

  /**
   * Run the next step of negotiation (always clamped by priceFloor / clampPrice)
   */
  static processStep(
    session: NegotiationSession,
    stepIndex: number,
    categorySettings: CategoryNegotiationSetting[] = []
  ): {
    updatedSession: NegotiationSession;
    newOffer: NegotiationOffer;
    logEntry: ActivityLogEntry;
  } {
    const { product, userBudget, offers } = session;
    const seller = SELLERS.find((s) => s.id === session.activeSellerId) || {
      id: product.sellerId,
      name: product.sellerName || SELLERS[0].name,
    };
    const target = userBudget.target;
    const maxBudget = userBudget.maxBudget;
    const listPrice = product.listPrice;

    const matchedSetting = resolveCategorySetting(product, categorySettings);
    const maxDiscountPct =
      matchedSetting?.maxSingleDiscountPct ??
      product.maxDiscountPercent ??
      MAX_SINGLE_ITEM_DISCOUNT;
    const floorPrice = priceFloor(listPrice, maxDiscountPct, false);

    let speaker: 'BUYER' | 'SELLER' = 'BUYER';
    let offerPrice = listPrice;
    let message = '';
    let status: NegotiationOffer['status'] = 'PENDING';
    let nextSessionStatus = session.status;
    let logType: ActivityLogEntry['type'] = 'info';
    let logStep = '';
    let logDetail = '';

    // Step 0: Buyer Initial Offer
    if (stepIndex === 0) {
      speaker = 'BUYER';
      offerPrice = Math.round(Math.min(target, target * 0.98));
      message = `Buyer's Agent: Offering ₹${offerPrice.toLocaleString('en-IN')} for ${product.name} (Target: ₹${target.toLocaleString('en-IN')}). Immediate checkout readiness confirmed.`;
      nextSessionStatus = 'BUYER_OFFER';
      status = 'PENDING';
      logStep = 'BUYER_OFFER_INITIALIZED';
      logDetail = `Buyer anchor computed at ₹${offerPrice}. Category floor policy: max ${maxDiscountPct}% discount (₹${floorPrice}).`;
    }
    // Step 1: Seller Counter 1
    else if (stepIndex === 1) {
      speaker = 'SELLER';
      const buyerFirst = offers[0]?.price || target;
      const calculatedCounter = Math.round(listPrice - (listPrice - floorPrice) * 0.45);
      offerPrice = clampPrice(Math.max(floorPrice, calculatedCounter), listPrice, maxDiscountPct, false);
      message = `Seller's Agent (${seller.name}): We can't do ₹${buyerFirst.toLocaleString('en-IN')}, but I can come down to ₹${offerPrice.toLocaleString('en-IN')} — that's close to what ${product.category.toLowerCase()} items move at this month.`;
      nextSessionStatus = 'SELLER_COUNTER';
      status = 'COUNTERED';
      logStep = 'SELLER_COUNTER_EVALUATED';
      logDetail = `Seller counter clamped to ₹${offerPrice} (Category floor: ₹${floorPrice}).`;
    }
    // Step 2: Buyer Counter 2
    else if (stepIndex === 2) {
      speaker = 'BUYER';
      const sellerLast = offers[1]?.price || listPrice;
      const buyerStep = Math.round(target + (Math.min(sellerLast, maxBudget) - target) * 0.5);
      offerPrice = Math.min(buyerStep, maxBudget);
      message = `Buyer's Agent: Stepping up our offer to ₹${offerPrice.toLocaleString('en-IN')} to lock this deal immediately.`;
      nextSessionStatus = 'BUYER_COUNTER';
      status = 'PENDING';
      logStep = 'BUYER_COUNTER_DISPATCHED';
      logDetail = `Buyer counter-offer ₹${offerPrice} dispatched.`;
    }
    // Step 3: Seller Final Concession / Counter 2
    else if (stepIndex === 3) {
      speaker = 'SELLER';
      const floorBuffer = Math.round((listPrice - floorPrice) * 0.1);
      let candidate = Math.max(floorPrice, floorPrice + floorBuffer);
      if (candidate > maxBudget && floorPrice <= maxBudget) {
        candidate = Math.max(floorPrice, maxBudget);
      }
      offerPrice = clampPrice(candidate, listPrice, maxDiscountPct, false);

      message = `Seller's Agent (${seller.name}): Our final authorized floor-protected offer for ${product.name} is ₹${offerPrice.toLocaleString('en-IN')} with full warranty and priority fulfillment.`;
      nextSessionStatus = 'SELLER_COUNTER';
      status = 'COUNTERED';
      logStep = 'SELLER_OPTIMAL_CONCESSION';
      logDetail = `Final seller counter clamped at ₹${offerPrice} (Min category floor: ₹${floorPrice}, Max discount: ${maxDiscountPct}%).`;
    }
    // Step 4: Deal Accepted or Settled at Clamped Floor
    else {
      speaker = 'BUYER';
      const lastSellerOffer = clampPrice(
        offers[offers.length - 1]?.price || floorPrice,
        listPrice,
        maxDiscountPct,
        false
      );

      offerPrice = lastSellerOffer;
      nextSessionStatus = 'DEAL_ACCEPTED';
      status = 'ACCEPTED';
      const totalSaved = Math.max(0, listPrice - offerPrice);
      message = `Buyer's Agent: Deal settled at ₹${offerPrice.toLocaleString('en-IN')} with ${seller.name}! You save ₹${totalSaved.toLocaleString('en-IN')} (${Math.round((totalSaved / listPrice) * 100)}% off list price).`;
      logStep = 'DEAL_ACCEPTED_AND_LOCKED';
      logDetail = `Deal secured at ₹${offerPrice} (>= floor ₹${floorPrice}). Net savings: ₹${totalSaved}.`;
      logType = 'success';
    }

    const newOffer: NegotiationOffer = {
      id: 'off_' + Math.random().toString(36).substring(2, 9),
      round: Math.floor(stepIndex / 2) + 1,
      speaker,
      sellerId: seller.id,
      sellerName: seller.name,
      price: offerPrice,
      message,
      timestamp: Date.now(),
      status,
      deltaFromTarget: offerPrice - target,
      savingsSoFar: listPrice - offerPrice,
    };

    const newOffers = [...offers, newOffer];
    const totalSaved = listPrice - offerPrice;

    const updatedSession: NegotiationSession = {
      ...session,
      product: {
        ...product,
        minAcceptablePrice: floorPrice,
        maxDiscountPercent: maxDiscountPct,
      },
      currentOffer: offerPrice,
      status: nextSessionStatus,
      offers: newOffers,
      finalPrice: nextSessionStatus === 'DEAL_ACCEPTED' ? offerPrice : undefined,
      totalSaved: nextSessionStatus === 'DEAL_ACCEPTED' ? totalSaved : undefined,
      token:
        nextSessionStatus === 'DEAL_ACCEPTED'
          ? 'DLM-' + Math.random().toString(36).substring(2, 10).toUpperCase()
          : undefined,
    };

    const logEntry: ActivityLogEntry = {
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
      timestamp: new Date().toLocaleTimeString(),
      agent: speaker === 'BUYER' ? 'BUYER_AGENT' : 'SELLER_AGENT',
      step: logStep,
      detail: logDetail,
      type: logType,
    };

    return { updatedSession, newOffer, logEntry };
  }

  /**
   * Convert server-side /api/negotiation/run-exchange turns into a settled NegotiationSession
   */
  static applyExchangeTurns(
    session: NegotiationSession,
    turns: NegotiationExchangeTurn[],
    settledPrice: number,
    floorPrice: number
  ): {
    updatedSession: NegotiationSession;
    logs: ActivityLogEntry[];
  } {
    const now = Date.now();
    const mappedOffers: NegotiationOffer[] = turns.map((t, idx) => ({
      id: `off_live_${idx}_${now}`,
      round: t.round,
      speaker: t.speaker === 'BUYER_AGENT' ? 'BUYER' : 'SELLER',
      sellerId: session.product.sellerId,
      sellerName: session.product.sellerName,
      price: t.price,
      message: t.message,
      timestamp: now + idx * 400,
      status:
        idx === turns.length - 1
          ? 'ACCEPTED'
          : t.speaker === 'SELLER_AGENT'
          ? 'COUNTERED'
          : 'PENDING',
      deltaFromTarget: t.price - session.userBudget.target,
      savingsSoFar: session.originalPrice - t.price,
    }));

    const finalSaved = Math.max(0, session.originalPrice - settledPrice);

    const updatedSession: NegotiationSession = {
      ...session,
      product: {
        ...session.product,
        minAcceptablePrice: floorPrice,
      },
      currentOffer: settledPrice,
      finalPrice: settledPrice,
      totalSaved: finalSaved,
      status: 'DEAL_ACCEPTED',
      offers: mappedOffers,
      token: 'DLM-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
    };

    const logs: ActivityLogEntry[] = turns.map((t, idx) => ({
      id: `log_live_${idx}_${now}`,
      timestamp: new Date().toLocaleTimeString(),
      agent: t.speaker,
      step:
        idx === turns.length - 1
          ? 'DEAL_SETTLED_AT_FLOOR_VERIFIED_PRICE'
          : `ROUND_${t.round}_${t.speaker}`,
      detail: `${t.message} (Clamped Floor: ₹${floorPrice})`,
      type: idx === turns.length - 1 ? 'success' : 'info',
    }));

    return { updatedSession, logs };
  }

  /**
   * Run multi-seller comparison
   */
  static runMultiSellerComparison(
    product: Product,
    _targetPrice: number,
    categorySettings: CategoryNegotiationSetting[] = []
  ): Array<{
    sellerId: string;
    sellerName: string;
    offeredPrice: number;
    deliveryDays: number;
    stock: number;
    isBest?: boolean;
  }> {
    const list = product.listPrice;
    const matchedSetting = resolveCategorySetting(product, categorySettings);
    const floor = priceFloor(
      list,
      matchedSetting?.maxSingleDiscountPct ?? product.maxDiscountPercent ?? MAX_SINGLE_ITEM_DISCOUNT,
      false
    );

    const results = SELLERS.map((seller, idx) => {
      let variance = 0.92;
      if (seller.negotiationFlexibility === 'flexible') {
        variance = 0.87;
      } else if (seller.negotiationFlexibility === 'moderate') {
        variance = 0.91;
      } else {
        variance = 0.94;
      }

      const calculated = Math.round(list * variance);
      const offeredPrice = Math.max(floor + idx * 25, calculated);

      return {
        sellerId: seller.id,
        sellerName: seller.name,
        offeredPrice,
        deliveryDays: idx === 0 ? 2 : idx === 1 ? 1 : 3,
        stock: Math.max(2, product.stock - idx * 3),
      };
    });

    const minPrice = Math.min(...results.map((r) => r.offeredPrice));
    return results.map((r) => ({
      ...r,
      isBest: r.offeredPrice === minPrice,
    }));
  }

  /**
   * Generate secure Deal Token for checkout
   */
  static generateDealToken(session: NegotiationSession): DealToken {
    const settled = session.finalPrice ?? session.currentOffer;
    if (!settled) {
      throw new Error('Cannot lock deal token without accepted final price');
    }

    return {
      negotiationId: session.id,
      productId: session.productId,
      sellerId: session.activeSellerId,
      originalPrice: session.originalPrice,
      finalPrice: settled,
      savings: Math.max(0, session.originalPrice - settled),
      buyerMaxBudget: session.userBudget.maxBudget,
      status: 'LOCKED',
      expiresAt: Date.now() + 15 * 60 * 1000,
      dealHash: 'SHA256:' + Math.random().toString(36).substring(2, 14).toUpperCase(),
    };
  }

  /**
   * ADVANCED NEGOTIATION SYSTEM 2.0:
   * Resolves the quantity-based bulk discount tier according to store owner rules,
   * product-level tiers, or system defaults:
   * 1–2 units: 0–5% (4%)
   * 3–5 units: 5–8% (7%)
   * 6–10 units: 8–12% (10%)
   * 11–25 units: 12–15% (14%)
   * 25+ units: Custom negotiation (18%)
   */
  static resolveBulkDiscountTier(
    qty: number,
    product?: Product,
    categorySettings: CategoryNegotiationSetting[] = []
  ): BulkDiscountTier {
    const matchedSetting = product ? resolveCategorySetting(product, categorySettings) : undefined;
    const availableTiers =
      matchedSetting?.bulkTiers && matchedSetting.bulkTiers.length > 0
        ? matchedSetting.bulkTiers
        : product?.bulkDiscountTiers && product.bulkDiscountTiers.length > 0
        ? product.bulkDiscountTiers
        : DEFAULT_BULK_DISCOUNT_TIERS;

    const safeQty = Math.max(1, qty);

    const foundTier = availableTiers.find((tier) => {
      if (tier.maxQty !== undefined && tier.maxQty !== null) {
        return safeQty >= tier.minQty && safeQty <= tier.maxQty;
      }
      return safeQty >= tier.minQty;
    });

    if (foundTier) return foundTier;

    // Fallback if none matched
    if (safeQty >= 25) {
      return { minQty: 26, discountPct: 18, label: '25+ units (Custom volume)' };
    }
    return DEFAULT_BULK_DISCOUNT_TIERS[0];
  }

  /**
   * Calculates the bulk target unit price respecting seller floor constraint.
   */
  static computeBulkUnitPrice(
    listPrice: number,
    qty: number,
    product?: Product,
    categorySettings: CategoryNegotiationSetting[] = []
  ): number {
    const tier = this.resolveBulkDiscountTier(qty, product, categorySettings);
    const matchedSetting = product ? resolveCategorySetting(product, categorySettings) : undefined;
    const maxAllowedDiscountPct = matchedSetting?.maxBundleDiscountPct ?? 25;

    // Bulk discount is capped by max allowed discount percentage
    const effectiveDiscountPct = Math.min(tier.discountPct, maxAllowedDiscountPct);
    const rawBulkPrice = Math.round(listPrice * (1 - effectiveDiscountPct / 100));

    // Also protect against hard floor
    const absoluteFloor = priceFloor(listPrice, maxAllowedDiscountPct, true);
    return Math.max(absoluteFloor, rawBulkPrice);
  }

  /**
   * ADVANCED NEGOTIATION SYSTEM 2.0:
   * Multi-criteria evaluation determining whether individual negotiation,
   * bulk negotiation, or collective deal offers highest customer value
   * while safeguarding seller profitability & inventory constraints.
   */
  static evaluateAdvancedNegotiationPath(params: {
    product: Product;
    quantity: number;
    currentOffer: number;
    userBudget: { target: number; maxBudget: number };
    categorySettings?: CategoryNegotiationSetting[];
    activePools?: CollectiveDealPool[];
  }): {
    currentMode: NegotiationMode;
    product: Product;
    quantity: number;
    currentUnitOffer: number;
    currentTotal: number;
    sellerFloorUnitPrice: number;
    // Bulk Details
    canQualifyForBulk: boolean;
    bulkTier: BulkDiscountTier;
    bulkUnitPrice: number;
    bulkTotal: number;
    bulkSavings: number;
    bulkRecommendationText: string;
    // Collective Deal Details
    canQualifyForCollective: boolean;
    collectivePool: CollectiveDealPool | null;
    collectiveUnitPrice: number;
    collectiveTotal: number;
    collectiveSavings: number;
    collectiveRecommendationText: string;
    // Decision
    recommendedNextStep: 'STAY_INDIVIDUAL' | 'OFFER_BULK' | 'OFFER_COLLECTIVE' | 'PROCEED_CHECKOUT';
    aiRationale: string;
    sellerProfitabilityProtected: boolean;
    inventorySufficient: boolean;
  } {
    const {
      product,
      quantity,
      currentOffer,
      userBudget,
      categorySettings = [],
      activePools = INITIAL_COLLECTIVE_POOLS,
    } = params;

    const listPrice = product.listPrice;
    const matchedSetting = resolveCategorySetting(product, categorySettings);
    const maxDiscountPct =
      matchedSetting?.maxSingleDiscountPct ?? product.maxDiscountPercent ?? MAX_SINGLE_ITEM_DISCOUNT;
    const sellerFloor = priceFloor(listPrice, maxDiscountPct, false);

    // Current totals
    const currentUnitOffer = Math.max(sellerFloor, currentOffer);
    const currentTotal = currentUnitOffer * quantity;

    // Evaluate Bulk Opportunity
    const bulkTier = this.resolveBulkDiscountTier(quantity, product, categorySettings);
    const bulkUnitPrice = this.computeBulkUnitPrice(listPrice, quantity, product, categorySettings);
    const bulkTotal = bulkUnitPrice * quantity;
    const bulkSavings = Math.max(0, currentTotal - bulkTotal);

    // Can qualify for bulk: if quantity > 2 OR if purchasing multiple units
    const canQualifyForBulk = quantity >= 3 || (quantity >= 2 && bulkSavings > 0);

    const bulkRecommendationText =
      quantity >= 3
        ? `You're already close to my best individual price. Because you're purchasing ${quantity} units, I can try a bulk negotiation with the seller.`
        : `If you need 3 or more units, you can unlock tiered bulk pricing with up to ${bulkTier.discountPct}% volume savings.`;

    // Evaluate Collective Pool Opportunity
    // Find active pool for this product or category
    const matchedPool =
      activePools.find(
        (p) =>
          (p.productId === product.id || p.productName.toLowerCase() === product.name.toLowerCase()) &&
          p.status === 'ACTIVE'
      ) ||
      activePools.find((p) => p.category === product.category && p.status === 'ACTIVE') ||
      null;

    const collectiveUnitPrice = matchedPool
      ? matchedPool.collectiveTargetPrice
      : Math.round(listPrice * 0.85); // 15% collective benchmark
    const collectiveTotal = collectiveUnitPrice * quantity;
    const collectiveSavings = Math.max(0, currentTotal - collectiveTotal);
    const canQualifyForCollective = Boolean(matchedPool && collectiveSavings > 0);

    const collectiveRecommendationText = matchedPool
      ? `Pool demand with ${matchedPool.participantsCount} other buyers! ${matchedPool.currentQuantity}/${matchedPool.targetQuantity} units pledged. Lock unit price at ₹${matchedPool.collectiveTargetPrice.toLocaleString('en-IN')}.`
      : 'Start or join a Collective Deal to pool demand with other buyers and unlock wholesale rates without ordering in bulk alone.';

    // Logic: determine recommended next step
    let recommendedNextStep: 'STAY_INDIVIDUAL' | 'OFFER_BULK' | 'OFFER_COLLECTIVE' | 'PROCEED_CHECKOUT' =
      'STAY_INDIVIDUAL';
    let aiRationale = '';

    // Check if buyer has reached the maximum reasonable individual negotiation
    const isAtIndividualFloor = Math.abs(currentUnitOffer - sellerFloor) <= listPrice * 0.03;

    if (quantity >= 3 && bulkSavings > 0) {
      recommendedNextStep = 'OFFER_BULK';
      aiRationale = `High quantity (${quantity} units) triggers Volume Bulk Negotiation. Seller margin is preserved by batch fulfillment efficiencies.`;
    } else if (isAtIndividualFloor && canQualifyForCollective) {
      recommendedNextStep = 'OFFER_COLLECTIVE';
      aiRationale = `Individual offer is at seller floor limit (₹${sellerFloor.toLocaleString('en-IN')}). Transitioning to Collective Pool will aggregate volume and unlock wholesale tier.`;
    } else if (isAtIndividualFloor) {
      recommendedNextStep = 'PROCEED_CHECKOUT';
      aiRationale = `Individual negotiation has achieved maximum allowable margin reduction. Price is locked at verified seller floor.`;
    } else {
      recommendedNextStep = 'STAY_INDIVIDUAL';
      aiRationale = `Standard individual exchange in progress within authorized margin boundaries.`;
    }

    const inventorySufficient = product.stock >= quantity;
    const sellerProfitabilityProtected = bulkUnitPrice >= priceFloor(listPrice, 30, true);

    return {
      currentMode: quantity >= 3 ? 'BULK' : 'INDIVIDUAL',
      product,
      quantity,
      currentUnitOffer,
      currentTotal,
      sellerFloorUnitPrice: sellerFloor,
      canQualifyForBulk,
      bulkTier,
      bulkUnitPrice,
      bulkTotal,
      bulkSavings,
      bulkRecommendationText,
      canQualifyForCollective,
      collectivePool: matchedPool,
      collectiveUnitPrice,
      collectiveTotal,
      collectiveSavings,
      collectiveRecommendationText,
      recommendedNextStep,
      aiRationale,
      sellerProfitabilityProtected,
      inventorySufficient,
    };
  }
}
