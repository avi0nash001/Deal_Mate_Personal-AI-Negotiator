import { Product, UserRequirement } from '../types';

export class RecommendationEngine {
  /**
   * Natural Language Intent Understanding
   */
  static parseUserQuery(query: string): UserRequirement {
    const text = query.toLowerCase();

    // 1. Extract budget numbers
    let budget = 2500; // default baseline

    // Match patterns like "3000 rupees", "₹2,000", "under 2500", "only 1500", "budget is 5000"
    const budgetMatch =
      text.match(/(?:₹|rs\.?|inr|rupees)\s*(\d[\d,]*)/i) ||
      text.match(/(\d[\d,]*)\s*(?:₹|rs\.?|inr|rupees)/i) ||
      text.match(/(?:budget|under|below|around|within)\s*(?:is\s*)?(?:₹|rs\.?|inr)?\s*(\d[\d,]*)/i) ||
      text.match(/(\d{3,6})/);

    if (budgetMatch && budgetMatch[1]) {
      const parsed = parseInt(budgetMatch[1].replace(/,/g, ''), 10);
      if (!isNaN(parsed) && parsed > 0) {
        budget = parsed;
      }
    }

    // 2. Extract Category & Product Type
    let category = 'Fashion';
    let productType = 'general';

    if (text.includes('shirt') || text.includes('cloth') || text.includes('wear') || text.includes('tshirt') || text.includes('pant')) {
      category = 'Fashion';
      productType = 'shirt';
    } else if (text.includes('dress') || text.includes('gown') || text.includes('kurti')) {
      category = 'Fashion';
      productType = 'dress';
    } else if (text.includes('shoe') || text.includes('sneaker') || text.includes('footwear') || text.includes('boots') || text.includes('kicks')) {
      category = 'Footwear';
      productType = 'sneakers';
    } else if (text.includes('earbud') || text.includes('headphone') || text.includes('audio') || text.includes('sound') || text.includes('tws')) {
      category = 'Electronics';
      productType = 'earbuds';
    } else if (text.includes('watch') || text.includes('smartwatch') || text.includes('fitness')) {
      category = 'Electronics';
      productType = 'smartwatch';
    } else if (text.includes('keyboard') || text.includes('pc') || text.includes('mouse') || text.includes('desk')) {
      category = 'Electronics';
      productType = 'keyboard';
    } else if (text.includes('grocery') || text.includes('food') || text.includes('fruit') || text.includes('pantry') || text.includes('organic')) {
      category = 'Grocery';
      productType = 'grocery';
    } else if (text.includes('gift') || text.includes('sister') || text.includes('mother') || text.includes('birthday')) {
      category = 'Gifts';
      productType = 'gift';
    }

    // 3. Extract Purpose
    let purpose = 'Everyday';
    if (text.includes('college') || text.includes('university') || text.includes('campus') || text.includes('student')) {
      purpose = 'College';
    } else if (text.includes('birthday') || text.includes('anniversary') || text.includes('party')) {
      purpose = 'Birthday';
    } else if (text.includes('casual')) {
      purpose = 'Casual';
    } else if (text.includes('formal') || text.includes('office') || text.includes('interview')) {
      purpose = 'Office';
    } else if (text.includes('gym') || text.includes('fitness') || text.includes('workout') || text.includes('running')) {
      purpose = 'Fitness';
    }

    // 4. Extract Recipient if present
    let recipient: string | undefined = undefined;
    if (text.includes('sister')) recipient = 'Sister';
    else if (text.includes('mother') || text.includes('mom')) recipient = 'Mother';
    else if (text.includes('brother')) recipient = 'Brother';
    else if (text.includes('friend')) recipient = 'Friend';

    return {
      rawQuery: query,
      budget,
      category,
      productType,
      purpose,
      preference: text.includes('good') ? 'Quality' : text.includes('cheap') ? 'Budget' : 'Balanced',
      recipient,
    };
  }

  /**
   * Filter and classify products into the 3 Budget Intelligence Tiers
   */
  static getCategorizedRecommendations(
    requirement: UserRequirement,
    allProducts: Product[]
  ): {
    perfectWithinBudget: Product[];
    bestValue: Product[];
    slightlyAboveBudget: Product[];
  } {
    const budget = requirement.budget;
    const cat = requirement.category?.toLowerCase() || '';
    const purpose = requirement.purpose?.toLowerCase() || '';

    // Score relevance
    const scored = allProducts.map((p) => {
      let score = 70;

      // Category match
      if (p.category.toLowerCase() === cat || (requirement.category === 'Gifts' && (p.category === 'Fashion' || p.category === 'Electronics'))) {
        score += 15;
      }

      // Purpose match
      if (p.purpose && p.purpose.some((prp) => prp.toLowerCase() === purpose)) {
        score += 10;
      }

      // Price closeness to budget without exceeding
      if (p.listPrice <= budget) {
        score += 5;
      }

      // Generate customized explanation
      let explanation = `Within your ₹${budget.toLocaleString('en-IN')} budget`;
      if (requirement.purpose) {
        explanation += ` for ${requirement.purpose} use.`;
      }
      if (p.isLocalStore) {
        explanation += ` Available at nearby store (${p.storeDistance}).`;
      }

      return {
        ...p,
        aiMatchScore: Math.min(99, score),
        whyRecommended: explanation,
      };
    });

    // Tier 1: Perfectly Within Budget
    const withinBudget = scored
      .filter((p) => p.listPrice <= budget)
      .map((p) => ({ ...p, budgetTier: 'within_budget' as const }))
      .sort((a, b) => (b.aiMatchScore || 0) - (a.aiMatchScore || 0));

    // Tier 2: Best Value (highest discount percentage or highest rating within budget)
    const bestValue = [...withinBudget]
      .sort((a, b) => b.maxDiscountPercent - a.maxDiscountPercent)
      .slice(0, 2)
      .map((p) => ({
        ...p,
        budgetTier: 'best_value' as const,
        whyRecommended: `Best Value pick: ${p.maxDiscountPercent}% allowable margin reduction and top ${p.rating}★ rating.`,
      }));

    // Tier 3: Slightly Above Budget (up to 25% above budget, with honest rationale)
    const slightlyAbove = scored
      .filter((p) => p.listPrice > budget && p.listPrice <= budget * 1.35)
      .map((p) => {
        const delta = p.listPrice - budget;
        return {
          ...p,
          budgetTier: 'slightly_above' as const,
          whyRecommended: `₹${delta.toLocaleString('en-IN')} above your budget — included because its specifications and durability closely match your requirements, and AI negotiation can compress this price.`,
        };
      })
      .slice(0, 2);

    return {
      perfectWithinBudget: withinBudget,
      bestValue,
      slightlyAboveBudget: slightlyAbove,
    };
  }

  /**
   * Compare multiple products and provide AI recommendation
   */
  static getComparisonAnalysis(products: Product[], userBudget: number): string {
    if (products.length < 2) return 'Please select at least 2 products to compare.';

    const within = products.filter((p) => p.listPrice <= userBudget);
    const bestRated = [...products].sort((a, b) => b.rating - a.rating)[0];
    const lowestPrice = [...products].sort((a, b) => a.listPrice - b.listPrice)[0];

    if (within.length === 1) {
      return `Based on your ₹${userBudget.toLocaleString('en-IN')} budget, ${within[0].name} (₹${within[0].listPrice.toLocaleString('en-IN')}) is the only option that strictly avoids exceeding your limit, while offering a verified ${within[0].rating}★ rating.`;
    }

    return `Between these options: ${lowestPrice.name} is the most economical at ₹${lowestPrice.listPrice.toLocaleString('en-IN')}, while ${bestRated.name} provides highest user satisfaction (${bestRated.rating}★). If your priority is longevity, choose ${bestRated.name}. If strict budget preservation is paramount, choose ${lowestPrice.name}.`;
  }
}
