/**
 * Voice Command Parser & Dispatcher for Active Negotiation Sessions
 * Allows users to verbally update target price or maximum budget hands-free.
 */

export interface VoiceNegotiationCommandResult {
  type: 'TARGET_PRICE' | 'MAX_BUDGET' | 'GENERAL_QUERY';
  amount?: number;
  rawTranscript: string;
  feedbackMessage?: string;
}

/**
 * Convert spoken words to numbers (e.g. "fifteen hundred" -> 1500, "two thousand" -> 2000)
 */
export function wordsToNumber(text: string): number | null {
  const clean = text.toLowerCase().replace(/,/g, '').trim();

  // If already contains digits, extract first contiguous digits
  const digitMatch = clean.match(/(?:₹|rs\.?|inr)?\s*(\d+)/i);
  if (digitMatch) {
    const parsed = parseInt(digitMatch[1], 10);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }

  // Common spoken numbers in Indian shopping context
  const numberWords: Record<string, number> = {
    zero: 0,
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    six: 6,
    seven: 7,
    eight: 8,
    nine: 9,
    ten: 10,
    eleven: 11,
    twelve: 12,
    thirteen: 13,
    fourteen: 14,
    fifteen: 15,
    sixteen: 16,
    seventeen: 17,
    eighteen: 18,
    nineteen: 19,
    twenty: 20,
    thirty: 30,
    forty: 40,
    fifty: 50,
    sixty: 60,
    seventy: 70,
    eighty: 80,
    ninety: 90,
  };

  // Check for expressions like "fifteen hundred", "two thousand five hundred"
  if (clean.includes('thousand') || clean.includes('hundred') || clean.includes('k')) {
    let total = 0;
    // e.g. "2k" or "2.5k"
    const kMatch = clean.match(/(\d+(?:\.\d+)?)\s*k\b/i);
    if (kMatch) {
      return Math.round(parseFloat(kMatch[1]) * 1000);
    }

    const thousandMatch = clean.match(/(\w+|\d+)\s+thousand(?:\s+(\w+|\d+)\s+hundred)?/i);
    if (thousandMatch) {
      const thousands = isNaN(Number(thousandMatch[1]))
        ? numberWords[thousandMatch[1]] || 1
        : Number(thousandMatch[1]);
      total += thousands * 1000;
      if (thousandMatch[2]) {
        const hundreds = isNaN(Number(thousandMatch[2]))
          ? numberWords[thousandMatch[2]] || 0
          : Number(thousandMatch[2]);
        total += hundreds * 100;
      }
      return total > 0 ? total : null;
    }

    const hundredMatch = clean.match(/(\w+|\d+)\s+hundred/i);
    if (hundredMatch) {
      const hundreds = isNaN(Number(hundredMatch[1]))
        ? numberWords[hundredMatch[1]] || 1
        : Number(hundredMatch[1]);
      total += hundreds * 100;
      return total > 0 ? total : null;
    }
  }

  return null;
}

/**
 * Parse verbal commands specifically during active negotiation sessions
 */
export function parseVoiceNegotiationCommand(transcript: string): VoiceNegotiationCommandResult {
  const text = transcript.trim();
  const lower = text.toLowerCase();

  // Pattern 1: Target Price Commands
  // e.g., "set target price to 1800", "target 2000", "counter offer 1950", "offer 2100", "make it 1900", "counter at 1800"
  const targetRegex =
    /\b(?:set\s+)?(?:target\s+price|target|counter\s+offer|counter|offer|ask|ask\s+for|counter-offer|aim\s+for|negotiate\s+to|negotiate\s+at|make\s+it|drop\s+to|bring\s+it\s+to|can\s+we\s+do)\b/i;

  // Pattern 2: Max Budget Commands
  // e.g., "set max budget to 2500", "budget 3000", "my budget is 2800", "max budget 3500", "ceiling 3000", "increase budget to 3500"
  const budgetRegex =
    /\b(?:set\s+)?(?:max\s+budget|maximum\s+budget|user\s+budget|my\s+budget\s+is|budget\s+limit|ceiling|spending\s+limit|cap\s+at|budget)\b/i;

  const hasTargetIntent = targetRegex.test(lower);
  const hasBudgetIntent = budgetRegex.test(lower);

  // If budget intent matched
  if (hasBudgetIntent && !hasTargetIntent) {
    const amount = wordsToNumber(text);
    if (amount && amount >= 100 && amount <= 500000) {
      return {
        type: 'MAX_BUDGET',
        amount,
        rawTranscript: text,
        feedbackMessage: `Max budget verbally updated to ₹${amount.toLocaleString('en-IN')}`,
      };
    }
  }

  // If target intent matched
  if (hasTargetIntent) {
    const amount = wordsToNumber(text);
    if (amount && amount >= 50 && amount <= 500000) {
      return {
        type: 'TARGET_PRICE',
        amount,
        rawTranscript: text,
        feedbackMessage: `Negotiation target price updated to ₹${amount.toLocaleString('en-IN')}`,
      };
    }
  }

  // Fallback: Check if user simply spoke a standalone number or currency amount during active negotiation
  // e.g., "₹1,800", "1900", "make 2200"
  const standaloneMatch = lower.match(/^(?:₹|rs\.?|inr)?\s*(\d{3,6})\s*(?:rupees|bucks)?$/i);
  if (standaloneMatch) {
    const amount = parseInt(standaloneMatch[1], 10);
    if (!isNaN(amount) && amount >= 100) {
      return {
        type: 'TARGET_PRICE',
        amount,
        rawTranscript: text,
        feedbackMessage: `Target price set to ₹${amount.toLocaleString('en-IN')}`,
      };
    }
  }

  return {
    type: 'GENERAL_QUERY',
    rawTranscript: text,
  };
}

/**
 * Text-to-speech verbal confirmation using browser SpeechSynthesis
 */
export function speakVoiceFeedback(message: string): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.lang = 'en-IN';
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  } catch {
    // Graceful fallback
  }
}
