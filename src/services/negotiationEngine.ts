import { Product, NegotiationOffer, NegotiationSession, DealToken, ActivityLogEntry, Seller } from '../types';
import { SELLERS } from '../data/catalog';

export class NegotiationEngine {
  /**
   * Initialize a new negotiation session
   */
  static createSession(
    product: Product,
    userBudget: { target: number; maxBudget: number }
  ): NegotiationSession {
    const id = 'neg_' + Math.random().toString(36).substring(2, 9);
    const createdAt = Date.now();
    const expiresAt = createdAt + 15 * 60 * 1000; // 15 mins lock

    return {
      id,
      productId: product.id,
      product,
      userBudget: {
        target: Math.max(100, userBudget.target),
        maxBudget: Math.max(userBudget.target, userBudget.maxBudget),
      },
      currentOffer: product.listPrice,
      originalPrice: product.listPrice,
      status: 'NEGOTIATION_STARTED',
      offers: [],
      activeSellerId: product.sellerId,
      createdAt,
      expiresAt,
    };
  }

  /**
   * Run the next step of negotiation
   */
  static processStep(
    session: NegotiationSession,
    stepIndex: number
  ): {
    updatedSession: NegotiationSession;
    newOffer: NegotiationOffer;
    logEntry: ActivityLogEntry;
  } {
    const { product, userBudget, offers } = session;
    const seller = SELLERS.find((s) => s.id === session.activeSellerId) || SELLERS[0];
    const target = userBudget.target;
    const maxBudget = userBudget.maxBudget;
    const listPrice = product.listPrice;
    const floorPrice = product.minAcceptablePrice;

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
      // First offer is usually near target or 2-4% below target to anchor
      offerPrice = Math.round(Math.min(target, target * 0.98));
      message = `Buyer AI initialized anchor offer of ₹${offerPrice.toLocaleString('en-IN')} for ${product.name} (Target: ₹${target.toLocaleString('en-IN')}). Immediate payment capability flagged.`;
      nextSessionStatus = 'BUYER_OFFER';
      status = 'PENDING';
      logStep = 'BUYER_OFFER_INITIALIZED';
      logDetail = `Anchor price computed at ₹${offerPrice}. Constraint check: <= maxBudget (₹${maxBudget}) passed.`;
    }
    // Step 1: Seller Counter 1
    else if (stepIndex === 1) {
      speaker = 'SELLER';
      // Seller concessions based on inventory & floor price
      const buyerFirst = offers[0]?.price || target;
      // Seller counters mid-way between list price and floor price
      const calculatedCounter = Math.round(listPrice - (listPrice - floorPrice) * 0.35);
      offerPrice = Math.max(floorPrice + 100, calculatedCounter);
      message = `${seller.name}: Stock level is ${product.stock} units with high demand. We cannot meet ₹${buyerFirst.toLocaleString('en-IN')}, but we can offer priority fulfillment at ₹${offerPrice.toLocaleString('en-IN')}.`;
      nextSessionStatus = 'SELLER_COUNTER';
      status = 'COUNTERED';
      logStep = 'SELLER_COUNTER_EVALUATED';
      logDetail = `Seller concession rate: 35% of allowable margin. Price: ₹${offerPrice}. Stock reserve locked.`;
    }
    // Step 2: Buyer Counter 2
    else if (stepIndex === 2) {
      speaker = 'BUYER';
      const sellerLast = offers[1]?.price || listPrice;
      // Buyer inches upward toward target / mid-point
      const buyerStep = Math.round(target + (Math.min(sellerLast, maxBudget) - target) * 0.35);
      offerPrice = Math.min(buyerStep, maxBudget);
      message = `Buyer AI: Cross-referenced competing marketplace pricing. Countering at ₹${offerPrice.toLocaleString('en-IN')} with instant checkout verification.`;
      nextSessionStatus = 'BUYER_COUNTER';
      status = 'PENDING';
      logStep = 'BUYER_COUNTER_DISPATCHED';
      logDetail = `Concession delta: +₹${offerPrice - (offers[0]?.price || target)}. Price adheres to max ceiling ₹${maxBudget}.`;
    }
    // Step 3: Seller Final Concession / Counter 2
    else if (stepIndex === 3) {
      speaker = 'SELLER';
      // Seller makes final best offer near or at floor + healthy buffer
      const floorBuffer = Math.round((listPrice - floorPrice) * 0.12);
      offerPrice = Math.max(floorPrice, floorPrice + floorBuffer);
      
      // Ensure if floorPrice is within maxBudget, it creates a viable deal
      if (offerPrice > maxBudget && floorPrice <= maxBudget) {
        offerPrice = maxBudget;
      }

      message = `${seller.name}: Executive pricing engine authorized optimal concession. We can close this transaction at ₹${offerPrice.toLocaleString('en-IN')} with standard 1-year brand warranty.`;
      nextSessionStatus = 'SELLER_COUNTER';
      status = 'COUNTERED';
      logStep = 'SELLER_OPTIMAL_CONCESSION';
      logDetail = `Near-floor clearing price reached at ₹${offerPrice} (Min floor: ₹${floorPrice}). Margin verified.`;
    }
    // Step 4: Deal Accepted or Terminal Decision
    else {
      speaker = 'BUYER';
      const lastSellerOffer = offers[offers.length - 1]?.price || product.listPrice;
      
      if (lastSellerOffer <= maxBudget) {
        offerPrice = lastSellerOffer;
        nextSessionStatus = 'DEAL_ACCEPTED';
        status = 'ACCEPTED';
        const totalSaved = listPrice - offerPrice;
        message = `Buyer AI: Seller counter-offer ₹${offerPrice.toLocaleString('en-IN')} meets all budgetary criteria (Ceiling: ₹${maxBudget.toLocaleString('en-IN')}). Deal successfully accepted! You save ₹${totalSaved.toLocaleString('en-IN')}.`;
        logStep = 'DEAL_ACCEPTED_AND_LOCKED';
        logDetail = `Deal secured at ₹${offerPrice}. Original: ₹${listPrice}, Net savings: ₹${totalSaved}. Token generated.`;
        logType = 'success';
      } else {
        offerPrice = lastSellerOffer;
        nextSessionStatus = 'BUDGET_EXCEEDED';
        status = 'REJECTED';
        message = `Buyer AI: Seller's lowest offer (₹${lastSellerOffer.toLocaleString('en-IN')}) exceeds your hard budget constraint of ₹${maxBudget.toLocaleString('en-IN')}. Negotiation terminated to protect your funds.`;
        logStep = 'BUDGET_VIOLATION_ABORT';
        logDetail = `Aborted: Offer ₹${lastSellerOffer} > Max budget ₹${maxBudget}.`;
        logType = 'warning';
      }
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
      currentOffer: offerPrice,
      status: nextSessionStatus,
      offers: newOffers,
      finalPrice: nextSessionStatus === 'DEAL_ACCEPTED' ? offerPrice : undefined,
      totalSaved: nextSessionStatus === 'DEAL_ACCEPTED' ? totalSaved : undefined,
      token: nextSessionStatus === 'DEAL_ACCEPTED' ? 'DLM-' + Math.random().toString(36).substring(2, 10).toUpperCase() : undefined,
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
   * Run multi-seller comparison
   */
  static runMultiSellerComparison(
    product: Product,
    targetPrice: number
  ): Array<{
    sellerId: string;
    sellerName: string;
    offeredPrice: number;
    deliveryDays: number;
    stock: number;
    isBest?: boolean;
  }> {
    const list = product.listPrice;
    const floor = product.minAcceptablePrice;

    const results = SELLERS.map((seller, idx) => {
      let variance = 0;
      if (seller.negotiationFlexibility === 'flexible') {
        variance = 0.88; // e.g. 12% drop
      } else if (seller.negotiationFlexibility === 'moderate') {
        variance = 0.92; // 8% drop
      } else {
        variance = 0.95; // 5% drop
      }

      const calculated = Math.round(list * variance);
      const offeredPrice = Math.max(floor + (idx * 30), calculated);

      return {
        sellerId: seller.id,
        sellerName: seller.name,
        offeredPrice,
        deliveryDays: idx === 0 ? 2 : idx === 1 ? 1 : 3,
        stock: product.stock - (idx * 5),
      };
    });

    // Mark the best price
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
    if (!session.finalPrice) {
      throw new Error('Cannot lock deal token without accepted final price');
    }

    return {
      negotiationId: session.id,
      productId: session.productId,
      sellerId: session.activeSellerId,
      originalPrice: session.originalPrice,
      finalPrice: session.finalPrice,
      savings: session.originalPrice - session.finalPrice,
      buyerMaxBudget: session.userBudget.maxBudget,
      status: 'LOCKED',
      expiresAt: Date.now() + 15 * 60 * 1000,
      dealHash: 'SHA256:' + Math.random().toString(36).substring(2, 14).toUpperCase(),
    };
  }
}
