import { Product, UserRequirement } from '../types';

type AnswerContext = {
  requirement: UserRequirement;
  products: Product[];
  selectedProduct?: Product;
};

export type ProductAnswer =
  | { kind: 'answer'; text: string; productIds?: string[] }
  | { kind: 'search'; text: string }
  | { kind: 'clarify'; text: string }
  | { kind: 'negotiate'; text: string; product: Product; productIds?: string[] };

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9₹.\s-]/g, ' ');
const money = (value: number) => `₹${value.toLocaleString('en-IN')}`;

export class RecommendationEngine {
  static parseUserQuery(query: string): UserRequirement {
    const text = normalize(query);
    let budget = 2500;
    const budgetMatch =
      text.match(/(?:₹|rs\.?|inr|rupees)\s*(\d[\d,]*)/i) ||
      text.match(/(\d[\d,]*)\s*(?:₹|rs\.?|inr|rupees)/i) ||
      text.match(/(?:budget|under|below|around|within|upto|up to|less than|max)\s*(?:is\s*)?(?:₹|rs\.?|inr)?\s*(\d[\d,]*)/i) ||
      text.match(/(\d{3,6})/);

    if (budgetMatch?.[1]) {
      const parsed = Number(budgetMatch[1].replace(/,/g, ''));
      if (Number.isFinite(parsed) && parsed > 0) budget = parsed;
    }

    let category = 'Fashion';
    let productType = 'general';
    if (/shirt|tshirt|cloth|jeans|pant|jacket|hoodie/.test(text)) { category = 'Fashion'; productType = 'shirt'; }
    else if (/dress|gown|kurti/.test(text)) { category = 'Fashion'; productType = 'dress'; }
    else if (/shoe|sneaker|footwear|boot|kicks/.test(text)) { category = 'Footwear'; productType = 'sneakers'; }
    else if (/earbud|headphone|headset|audio|sound|tws/.test(text)) { category = 'Electronics'; productType = 'audio'; }
    else if (/watch|smartwatch|fitness band/.test(text)) { category = 'Electronics'; productType = 'smartwatch'; }
    else if (/keyboard|mouse|pc|laptop|computer|coding|desk/.test(text)) { category = 'Electronics'; productType = /keyboard/.test(text) ? 'keyboard' : 'computer'; }
    else if (/grocery|food|fruit|pantry|organic/.test(text)) { category = 'Grocery'; productType = 'grocery'; }
    else if (/gift|birthday|anniversary/.test(text)) { category = 'Gifts'; productType = 'gift'; }

    let purpose = 'Everyday';
    if (/college|university|campus|student/.test(text)) purpose = 'College';
    else if (/gaming|game/.test(text)) purpose = 'Gaming';
    else if (/coding|programming|developer|ai project/.test(text)) purpose = 'Coding';
    else if (/birthday|anniversary|party/.test(text)) purpose = 'Birthday';
    else if (/office|formal|interview|work/.test(text)) purpose = 'Office';
    else if (/gym|fitness|workout|running/.test(text)) purpose = 'Fitness';

    const preference = /cheap|cheaper|lowest|budget/.test(text)
      ? 'Budget'
      : /quality|premium|best/.test(text)
      ? 'Quality'
      : 'Balanced';

    return {
      rawQuery: query,
      budget,
      category,
      productType,
      purpose,
      preference,
      color: /black/.test(text) ? 'Black' : undefined,
      location: /near me|nearby|local/.test(text) ? 'nearby' : undefined,
      deliveryPreference: /pickup|pick up/.test(text) ? 'pickup' : /delivery/.test(text) ? 'delivery' : undefined,
    };
  }

  static rankProducts(requirement: UserRequirement, allProducts: Product[]): Product[] {
    const category = (requirement.category || '').toLowerCase();
    const productType = (requirement.productType || '').toLowerCase();
    const purpose = (requirement.purpose || '').toLowerCase();

    const scored = allProducts
      .map((product) => {
        let score = 40;
        const haystack = `${product.name} ${product.brand} ${product.subcategory || ''} ${product.description} ${Object.entries(product.specs).join(' ')}`.toLowerCase();
        if (category && product.category.toLowerCase() === category) score += 25;
        if (productType && productType !== 'general' && haystack.includes(productType.replace('audio', 'audio'))) score += 15;
        if (purpose && product.purpose?.some((p) => p.toLowerCase() === purpose)) score += 12;
        if (product.listPrice <= requirement.budget) score += 10;
        if (requirement.preference === 'Quality') score += Math.round(product.rating * 2);
        if (requirement.preference === 'Budget') score += Math.max(0, 10 - Math.round(product.listPrice / Math.max(1, requirement.budget) * 10));
        if (requirement.location && product.isLocalStore) score += 6;
        if (requirement.color && haystack.includes(requirement.color.toLowerCase())) score += 5;
        return { ...product, aiMatchScore: Math.min(99, Math.max(product.aiMatchScore || 0, score)) };
      });

    const categoryMatches = category
      ? scored.filter((product) => product.category.toLowerCase() === category || (category === 'gifts' && product.purpose?.some((p) => /gift|birthday|anniversary/i.test(p))))
      : scored;

    const typeMatches = productType && productType !== 'general'
      ? categoryMatches.filter((product) => {
          const haystack = `${product.name} ${product.subcategory || ''} ${product.description}`.toLowerCase();
          if (productType === 'audio') return /audio|earbud|headphone|headset/.test(haystack);
          if (productType === 'smartwatch') return /watch/.test(haystack);
          if (productType === 'keyboard') return /keyboard/.test(haystack);
          if (productType === 'sneakers') return /shoe|sneaker|footwear/.test(haystack);
          if (productType === 'shirt') return /shirt|tshirt|clothing/.test(haystack);
          if (productType === 'dress') return /dress|gown|kurti/.test(haystack);
          if (productType === 'grocery') return /grocery|organic|food|pantry/.test(haystack);
          return true;
        })
      : categoryMatches;

    return (typeMatches.length ? typeMatches : categoryMatches.length ? categoryMatches : scored)
      .sort((a, b) => (b.aiMatchScore || 0) - (a.aiMatchScore || 0));
  }

  static getCategorizedRecommendations(requirement: UserRequirement, allProducts: Product[]) {
    const ranked = this.rankProducts(requirement, allProducts);
    const within = ranked.filter((p) => p.listPrice <= requirement.budget).map((p) => ({ ...p, budgetTier: 'within_budget' as const }));
    const bestValue = [...within].sort((a, b) => b.maxDiscountPercent - a.maxDiscountPercent).slice(0, 2).map((p) => ({ ...p, budgetTier: 'best_value' as const }));
    const slightlyAboveBudget = ranked.filter((p) => p.listPrice > requirement.budget && p.listPrice <= requirement.budget * 1.35).slice(0, 4).map((p) => ({ ...p, budgetTier: 'slightly_above' as const }));
    return { perfectWithinBudget: within, bestValue, slightlyAboveBudget };
  }

  static answerProductQuestion(question: string, context: AnswerContext): ProductAnswer {
    const text = normalize(question);
    const current = context.products;
    const selected = context.selectedProduct;

    if (/^find |^show |^search |need |want |looking for|under ₹|under \d|below ₹|below \d/.test(text) && !/which|does|is |compare|can i|cheaper/.test(text)) {
      return { kind: 'search', text: 'I’ll update the current product search.' };
    }

    const resolveProduct = (): Product | undefined => {
      if (selected) return selected;
      const ordinal = text.match(/(?:first|1st|one|second|2nd|two|third|3rd)/);
      if (ordinal) {
        const index = /second|2nd|two/.test(ordinal[0]) ? 1 : /third|3rd/.test(ordinal[0]) ? 2 : 0;
        return current[index];
      }
      const byName = current.find((p) => text.includes(p.name.toLowerCase()) || text.includes(p.brand.toLowerCase()));
      return byName;
    };

    if (/good laptop|good phone|good product|need a good/.test(text) && !/budget|under|₹|rs|inr/.test(text)) {
      return { kind: 'clarify', text: 'Sure. What is your approximate budget? You can say something like “under ₹60,000”.' };
    }

    if (/best battery|longest battery|most battery|best rated|highest rating|cheapest|lowest price/.test(text)) {
      if (!current.length) return { kind: 'clarify', text: 'There are no current products available to evaluate.' };
      if (/battery/.test(text)) {
        const candidates = current
          .map((p) => ({ product: p, hours: this.extractNumber(p.specs, ['battery life', 'playback', 'battery']) }))
          .filter((item) => item.hours !== null)
          .sort((a, b) => (b.hours || 0) - (a.hours || 0));
        if (!candidates.length) return { kind: 'answer', text: "I don't have verified battery-life values for the current products, so I won't guess." };
        const best = candidates[0];
        const next = candidates[1];
        return {
          kind: 'answer',
          productIds: candidates.slice(0, 2).map((item) => item.product.id),
          text: `${best.product.name} has the longest listed battery life at approximately ${best.hours} hours${next ? `; ${next.product.name} is next at about ${next.hours} hours` : ''}.`,
        };
      }
      if (/best rated|highest rating/.test(text)) {
        const best = [...current].sort((a, b) => b.rating - a.rating)[0];
        return { kind: 'answer', productIds: [best.id], text: `${best.name} has the highest listed rating among the current results at ${best.rating}★.` };
      }
      const cheapest = [...current].sort((a, b) => a.listPrice - b.listPrice)[0];
      return { kind: 'answer', productIds: [cheapest.id], text: `${cheapest.name} is the lowest-priced current result at ${money(cheapest.listPrice)}.` };
    }

    if (/compare|difference|versus| vs |first two|two products/.test(text)) {
      const a = current[0];
      const b = current[1];
      if (!a || !b) return { kind: 'clarify', text: 'I need at least two products in the current results to compare them.' };
      return {
        kind: 'answer',
        productIds: [a.id, b.id],
        text: `${a.name} is ${money(a.listPrice)} with ${a.rating}★. ${b.name} is ${money(b.listPrice)} with ${b.rating}★. ${this.compareRelevantSpecs(a, b, context.requirement)}.`,
      };
    }

    if (/cheaper|lower price|less expensive|more affordable|something cheaper/.test(text)) {
      const base = selected || current[0];
      if (!base) return { kind: 'clarify', text: 'I don’t have a current product to use as the reference for “cheaper”.' };
      const alternatives = current.filter((p) => p.id !== base.id && p.listPrice < base.listPrice);
      if (!alternatives.length) return { kind: 'answer', text: `I don't have a cheaper matching product in the current catalog. I can broaden the search if you want.` };
      const picks = alternatives.slice(0, 3);
      return { kind: 'answer', productIds: picks.map((p) => p.id), text: `I found ${picks.length} lower-priced alternatives. ${picks.map((p) => `${p.name} at ${money(p.listPrice)}`).join(', ')}.` };
    }

    if (/negotiate|target price|get it for|can i get it|bring.*price|below.*price/.test(text)) {
      const product = resolveProduct() || current[0];
      if (!product) return { kind: 'clarify', text: 'Select a product first and I can pass its exact context into the negotiation flow.' };
      const explicit = text.match(/(?:₹|rs\.?|inr|for|at)\s*(\d[\d,]*)/i);
      const target = explicit ? Number(explicit[1].replace(/,/g, '')) : context.requirement.budget;
      return { kind: 'negotiate', product, productIds: [product.id], text: `Yes. I’ll use ${product.name} as the negotiation target. Your target is ${money(Math.min(target, product.listPrice))}.`, };
    }

    const product = resolveProduct();
    if (!product) {
      if (/which one|what about|this one|that one|does it|is it|how long|how much/.test(text)) {
        return { kind: 'clarify', text: 'Which current product do you mean? Select a product in the right panel, or say “the first one” or “the second one”.' };
      }
      return { kind: 'search', text: 'I’ll treat that as a new shopping request and update the product results.' };
    }

    if (/battery|how long.*last|playback/.test(text)) {
      const entry = this.findSpec(product, ['battery', 'playback']);
      return entry
        ? { kind: 'answer', productIds: [product.id], text: `${product.name} lists ${entry[1]} for ${entry[0]}.` }
        : { kind: 'answer', productIds: [product.id], text: `I don't have verified battery information for ${product.name} in the current product data.` };
    }

    if (/anc|noise cancellation/.test(text)) {
      const entry = this.findSpec(product, ['anc', 'noise cancellation']);
      return entry
        ? { kind: 'answer', productIds: [product.id], text: `Yes — the listed specification is ${entry[1]}.` }
        : { kind: 'answer', productIds: [product.id], text: `I don't have verified ANC information for ${product.name} in the current data, so I won't guess.` };
    }

    if (/waterproof|water resistant|ip rating/.test(text)) {
      const entry = this.findSpec(product, ['water', 'ip rating']);
      return entry
        ? { kind: 'answer', productIds: [product.id], text: `${product.name} lists ${entry[0]} as ${entry[1]}.` }
        : { kind: 'answer', productIds: [product.id], text: `Water resistance isn't listed in the available specifications for ${product.name}.` };
    }

    if (/fast charging|charging/.test(text)) {
      const entry = this.findSpec(product, ['charging', 'charge']);
      return entry
        ? { kind: 'answer', productIds: [product.id], text: `${entry[0]}: ${entry[1]}.` }
        : { kind: 'answer', productIds: [product.id], text: `I don't have verified charging information for ${product.name} in the current data.` };
    }

    if (/gaming|game/.test(text)) return this.suitabilityAnswer(product, 'Gaming', context.requirement);
    if (/college|student/.test(text)) return this.suitabilityAnswer(product, 'College', context.requirement);
    if (/coding|programming|ai project/.test(text)) return this.suitabilityAnswer(product, 'Coding', context.requirement);
    if (/cheaper|price|cost|how much/.test(text)) return { kind: 'answer', productIds: [product.id], text: `${product.name} is listed at ${money(product.listPrice)}. Its market reference is ${money(product.marketPrice)}.` };
    if (/seller|store|shop|where/.test(text)) return { kind: 'answer', productIds: [product.id], text: `${product.name} is listed by ${product.sellerName}, rated ${product.sellerRating}★, with ${product.stock} units shown in the current catalog.` };

    return {
      kind: 'answer',
      productIds: [product.id],
      text: `${product.name} is ${money(product.listPrice)} with a ${product.rating}★ rating. Ask me about a specific feature, comparison, suitability, seller, or negotiation target and I’ll use the listed product data.`,
    };
  }

  private static extractNumber(specs: Record<string, string>, terms: string[]): number | null {
    const entry = Object.entries(specs).find(([key, value]) => terms.some((term) => `${key} ${value}`.toLowerCase().includes(term)));
    if (!entry) return null;
    const match = entry[1].match(/(\d+(?:\.\d+)?)/);
    return match ? Number(match[1]) : null;
  }

  private static findSpec(product: Product, terms: string[]): [string, string] | null {
    const entry = Object.entries(product.specs).find(([key, value]) => terms.some((term) => `${key} ${value}`.toLowerCase().includes(term)));
    return entry || null;
  }

  private static suitabilityAnswer(product: Product, useCase: string, requirement: UserRequirement): ProductAnswer {
    const purposeMatch = product.purpose?.some((p) => p.toLowerCase() === useCase.toLowerCase());
    const supporting = Object.entries(product.specs).slice(0, 2).map(([k, v]) => `${k}: ${v}`).join('; ');
    if (purposeMatch) return { kind: 'answer', productIds: [product.id], text: `${product.name} is listed for ${useCase} use. Relevant specs include ${supporting}. It is ${money(product.listPrice)} against your ${money(requirement.budget)} budget.` };
    return { kind: 'answer', productIds: [product.id], text: `${useCase} is not explicitly listed in this product's supported purposes. The available data shows ${supporting}. I wouldn't claim a stronger fit without more verified information.` };
  }

  private static compareRelevantSpecs(a: Product, b: Product, requirement: UserRequirement): string {
    const keys = ['Battery Life', 'Noise Cancellation', 'Connectivity', 'Display', 'Storage', 'RAM', 'Switches'];
    for (const key of keys) {
      if (a.specs[key] || b.specs[key]) return `${a.name} lists ${a.specs[key] || 'no value'} for ${key}, while ${b.name} lists ${b.specs[key] || 'no value'}`;
    }
    if (requirement.preference === 'Budget') return `${a.name} is cheaper by ${money(Math.abs(a.listPrice - b.listPrice))}`;
    return 'Their listed specifications should be compared against your priority';
  }

  static getComparisonAnalysis(products: Product[], userBudget: number): string {
    if (products.length < 2) return 'Please select at least 2 products to compare.';
    return products.slice(0, 3).map((p) => `${p.name}: ${money(p.listPrice)}, ${p.rating}★`).join(' | ');
  }
}
