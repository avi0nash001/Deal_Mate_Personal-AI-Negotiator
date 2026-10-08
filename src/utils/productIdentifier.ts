import { Product } from '../types';

/**
 * Generates a persistent and unique DealMate Product ID in the format DM-PROD-XXXXXX (e.g. DM-PROD-000127).
 */
export function generateDealMateProductId(existingProducts: Product[] = []): string {
  let maxSeq = 100;

  for (const p of existingProducts) {
    const idToCheck = p.dealMateProductId || (p.id.startsWith('DM-PROD-') ? p.id : '');
    const match = idToCheck.match(/DM-PROD-(\d+)/i);
    if (match && match[1]) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxSeq) {
        maxSeq = num;
      }
    }
  }

  const nextSeq = maxSeq + 1;
  const padded = nextSeq.toString().padStart(6, '0');
  return `DM-PROD-${padded}`;
}

/**
 * Ensures a product has a valid, deterministic DealMate Product ID.
 */
export function ensureDealMateProductId(product: Product, fallbackIndex: number = 0): string {
  if (product.dealMateProductId && product.dealMateProductId.startsWith('DM-PROD-')) {
    return product.dealMateProductId;
  }

  // Check if product.id has a DM-PROD format
  const match = product.id.match(/DM-PROD-(\d+)/i);
  if (match) {
    return `DM-PROD-${match[1].padStart(6, '0')}`;
  }

  // Generate deterministic number from product id or name
  let hash = 0;
  const str = product.id || product.name || `item_${fallbackIndex}`;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const positiveNum = 101 + (Math.abs(hash) % 899);
  return `DM-PROD-${positiveNum.toString().padStart(6, '0')}`;
}

/**
 * Parses raw scanner input or barcode data to extract the DealMate Product ID.
 */
export function extractDealMateProductId(rawInput: string): string | null {
  if (!rawInput) return null;
  const cleaned = rawInput.trim();

  // Direct match: DM-PROD-000127
  const directMatch = cleaned.match(/DM-PROD-\d{3,8}/i);
  if (directMatch) {
    return directMatch[0].toUpperCase();
  }

  // SKU match or URL match
  const urlMatch = cleaned.match(/\/products?\/([a-zA-Z0-9_-]+)/i);
  if (urlMatch && urlMatch[1]) {
    const subMatch = urlMatch[1].match(/DM-PROD-\d{3,8}/i);
    if (subMatch) return subMatch[0].toUpperCase();
    return urlMatch[1];
  }

  // Raw alphanumeric code
  if (cleaned.length >= 3 && cleaned.length <= 40) {
    return cleaned;
  }

  return null;
}
