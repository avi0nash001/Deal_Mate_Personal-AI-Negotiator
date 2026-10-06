import { SavedOptimizedDeal, DealOptimizerResult } from '../types/coupon';

const STORAGE_KEY = 'dealmate_optimized_deals_history';

export class DealHistoryService {
  static getHistory(): SavedOptimizedDeal[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return this.getSampleInitialHistory();
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return this.getSampleInitialHistory();
    }
  }

  static recordDeal(result: DealOptimizerResult): SavedOptimizedDeal {
    const item: SavedOptimizedDeal = {
      id: `opt_deal_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      productId: result.product.id,
      productName: result.product.name,
      productImage: result.product.image,
      merchantName: result.product.sellerName || 'Amazon.in',
      originalPrice: result.originalPrice,
      negotiatedPrice: result.negotiatedPrice,
      couponCode: result.appliedCoupon?.code,
      paymentOffer: result.appliedPaymentOffer?.title,
      finalPrice: result.finalPayablePrice,
      totalSavings: result.totalSavings,
      dealScore: result.dealScore,
      date: new Date().toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }),
      timestamp: Date.now(),
    };

    if (typeof window !== 'undefined') {
      try {
        const existing = this.getHistory();
        const updated = [item, ...existing.filter((d) => d.productId !== result.product.id)].slice(0, 15);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // Ignored
      }
    }

    return item;
  }

  static clearHistory(): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // Ignored
      }
    }
  }

  private static getSampleInitialHistory(): SavedOptimizedDeal[] {
    return [
      {
        id: 'opt_demo_1',
        productId: 'amz_oneplus_nord_2r',
        productName: 'OnePlus Nord Buds 2r True Wireless Earbuds',
        productImage: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&q=80',
        merchantName: 'Amazon.in',
        originalPrice: 2299,
        negotiatedPrice: 1999,
        couponCode: 'SAVE200',
        paymentOffer: 'Instant ₹150 Off via HDFC Card',
        finalPrice: 1649,
        totalSavings: 650,
        dealScore: 95,
        date: 'Today',
        timestamp: Date.now() - 3600000,
      },
      {
        id: 'opt_demo_2',
        productId: 'sneaker_nike_rev7',
        productName: 'Nike Revolution 7 Road Running Shoes',
        productImage: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80',
        merchantName: 'Myntra Verified',
        originalPrice: 3695,
        negotiatedPrice: 2795,
        couponCode: 'NIKESAVE250',
        paymentOffer: '₹200 Instant UPI Discount',
        finalPrice: 2345,
        totalSavings: 1350,
        dealScore: 92,
        date: 'Yesterday',
        timestamp: Date.now() - 86400000,
      },
    ];
  }
}
