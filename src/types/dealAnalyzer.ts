import { Product } from './index';

export type DealVerdict = 'BUY' | 'THINK' | 'AVOID';

export type EvidenceConfidenceLevel = 'STRONG' | 'UNCERTAIN' | 'SUSPICIOUS';

export type InformationSourceTier =
  | 'VERIFIED'
  | 'USER_REPORTED'
  | 'INFERRED'
  | 'UNKNOWN';

export interface CategoryMetricScore {
  name: string;
  key: string;
  score: number; // 0 - 100
  label: string; // Dynamic label e.g., "Thermal Management", "Sole Durability & Grip", "Inverter Efficiency"
  assessment: string;
  sourceType: InformationSourceTier;
  sourceLabel: string;
  confidence: number; // 0 - 100
}

export interface EvidenceItem {
  id: string;
  type: 'PHOTO' | 'VIDEO' | 'BENCHMARK' | 'PURCHASE_VERIFIED' | 'COMMUNITY';
  title: string;
  details: string;
  level: EvidenceConfidenceLevel;
  source: string;
  timestamp?: string;
  sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
  imageUrl?: string;
}

export interface RiskItem {
  category:
    | 'Performance'
    | 'Durability'
    | 'Reliability'
    | 'Seller'
    | 'Warranty'
    | 'Authenticity'
    | 'Return'
    | 'Compatibility'
    | 'Financial'
    | 'Evidence Uncertainty';
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  title: string;
  description: string;
  isNegotiableIssue?: boolean;
  improvementSuggestion?: string;
  evidenceSource: string;
}

export interface ReviewSentimentAnalysis {
  ratingDistribution: {
    fiveStar: number;
    fourStar: number;
    threeStar: number;
    twoStar: number;
    oneStar: number;
  };
  totalAnalyzed: number;
  recentSampleCount: number;
  recencyTrend: 'IMPROVING' | 'CONSISTENT' | 'DECLINING';
  recurringComplaints: string[];
  positivePatterns: string[];
  verifiedPurchaseRatioPct: number;
  suspiciousReviewFlag: boolean;
  suspiciousReason?: string;
}

export interface TotalCostAnalysis {
  basePrice: number;
  negotiatedDiscount: number;
  negotiatedPrice: number;
  shippingCharge: number;
  isShippingFree: boolean;
  platformFee: number;
  installationCharge: number;
  isInstallationFree: boolean;
  applicableCouponsDiscount: number;
  bankCashbackDiscount: number;
  estimatedTotalPayable: number;
  isConfirmedFinalPrice: boolean;
  costBreakdownNotes: string[];
}

export interface TrustedCircleOpinion {
  id: string;
  userName: string;
  avatar?: string;
  relation: 'Family' | 'Colleague' | 'Tech Friend' | 'Verified Buyer';
  ratingScore: number; // 0 - 100
  comment: string;
  timestamp: string;
}

export interface DealImprovementOption {
  id: string;
  issueKey: string;
  title: string;
  negotiatorPrompt: string;
  expectedConcession: string;
  actionType:
    | 'EXTENDED_WARRANTY'
    | 'FREE_SHIPPING'
    | 'ACCESSORIES'
    | 'REPLACEMENT_PROTECTION'
    | 'ADDITIONAL_DISCOUNT'
    | 'FREE_INSTALLATION'
    | 'SELLER_SUPPORT';
}

export interface DealAnalysisReport {
  id: string;
  product: Product;
  negotiatedPrice: number;
  originalPrice: number;
  userBudget: number;
  savings: number;
  analyzedAt: string;
  isLiveRefreshed: boolean;

  // Category & Taxonomy
  detectedCategory: string;
  detectedSubcategory: string;
  categoryThresholdTitle: string; // e.g. "Performance Confidence", "Comfort & Durability Confidence"
  primaryConfidenceScore: number; // 0 - 100

  // Core Decision Framework (Section 19 & 20)
  dealValueScore: number; // 0 - 100
  verdict: DealVerdict;
  verdictSummary: string;
  whyDealMateRecommends: string[];
  whatCouldGoWrong: string[];

  // Separate Quality vs Confidence (Section 26)
  productQualityScore: number; // 0 - 100
  analysisConfidenceScore: number; // 0 - 100
  confidenceLimitations: string[];

  // Pillar Scores
  categoryMetrics: CategoryMetricScore[];
  reliabilityScore: number;
  sellerTrustScore: number;
  sellerAssessment: string;
  sellerSourceTier: InformationSourceTier;

  // Warranty & Return
  warrantyConfidenceScore: number;
  warrantyTerms: string;
  warrantySourceTier: InformationSourceTier;
  returnProtectionScore: number;
  returnPolicyTerms: string;
  returnSourceTier: InformationSourceTier;

  // Evidence & Reviews
  evidenceConfidenceScore: number;
  evidenceItems: EvidenceItem[];
  reviewAnalysis: ReviewSentimentAnalysis;

  // Product History (Section 12)
  productHistoryStatus: 'AVAILABLE' | 'LIMITED' | 'INSUFFICIENT';
  productHistoryNotes: string[];

  // Risks (Section 16 & 17)
  risks: RiskItem[];
  overallRiskLevel: 'LOW' | 'MODERATE' | 'HIGH';

  // Cost (Section 15)
  costBreakdown: TotalCostAnalysis;

  // Trusted Opinions (Section 18)
  trustedCircleScore: number;
  trustedCircleOpinions: TrustedCircleOpinion[];
  combinedFinalConfidence: number;

  // Improvements & Re-negotiation (Section 21)
  improvementOptions: DealImprovementOption[];

  // Source Transparency (Section 23)
  sourcesTransparency: Array<{
    section: string;
    source: string;
    tier: InformationSourceTier;
    notes?: string;
  }>;
}
