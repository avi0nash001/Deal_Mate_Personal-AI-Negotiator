import React, { useState, useEffect, useRef } from 'react';
import {
  Product,
  CategoryNegotiationSetting,
  NegotiationSession,
  ActivityLogEntry,
  NegotiationExchangeTurn,
  AppUser,
} from '../../types';
import { ThemeId, THEMES } from '../../types/theme';
import { soundEffects } from '../../services/soundEffects';
import {
  PreferenceAgent,
  DealHunterAgent,
  NegotiatorAgent,
  StructuredShoppingPreferences,
  DealHunterProductCandidate,
  DealHunterSourceStatus,
  ChatTurnMessage,
  AgentStageStatus,
  NegotiationWorkspaceData,
  parseSpokenOrTypedBudget,
} from '../../services/multiAgentPipeline';
import {
  resolveCategorySetting,
  priceFloor,
  MAX_SINGLE_ITEM_DISCOUNT,
} from '../../services/negotiationEngine';
import { getAuthHeaders } from '../../services/authHeaders';
import {
  ProductResultsPanel,
  ProductSortOption,
  ProductFilterOption,
  NegotiatorPanelMode,
} from './ProductResultsPanel';

export interface NegotiatorSessionState {
  mode: NegotiatorPanelMode; // 'discovery' | 'negotiation' | 'alternatives'
  activeProduct: Product | null;
  activeCandidate: DealHunterProductCandidate | null;
  activeNegotiation: NegotiationWorkspaceData | null;
  alternativeCandidates: DealHunterProductCandidate[];
}
import {
  Bot,
  Mic,
  MicOff,
  Send,
  Sparkles,
  Search,
  Zap,
  Tag,
  CheckCircle2,
  Volume2,
  VolumeX,
  Settings,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  RotateCcw,
  Plus,
  Layers,
  MapPin,
  Truck,
  Star,
  ShieldCheck,
  ArrowRight,
  MessageSquare,
  SlidersHorizontal,
  Headphones,
  Laptop,
  ShoppingBag,
  Home,
  Gamepad2,
  Loader2,
  X,
  Eye,
  Clock,
  ExternalLink,
  Store,
  AlertCircle,
} from 'lucide-react';

interface StreamlinedNegotiatorProps {
  products?: Product[];
  categorySettings?: CategoryNegotiationSetting[];
  initialSelectedProduct?: Product | null;
  onClearInitialProduct?: () => void;
  onAcceptDealCheckout?: (product: Product, settledPrice: number) => void;
  onAnalyzeDeal?: (product: Product, settledPrice: number) => void;
  onCompareToggle?: (product: Product) => void;
  comparedProductIds?: string[];
  onOpenCompareModal?: () => void;
  onNavigateToStores?: () => void;
  currentThemeId?: ThemeId;
  currentUser?: AppUser | null;
  // Legacy compatibility props (optional)
  session?: NegotiationSession;
  activeStepIndex?: number;
  isAutoPlaying?: boolean;
  activityLogs?: ActivityLogEntry[];
  competingSellers?: Array<{
    sellerId: string;
    sellerName: string;
    offeredPrice: number;
    deliveryDays: number;
    stock: number;
    isBest?: boolean;
  }>;
  showMultiSeller?: boolean;
  onStepNegotiation?: () => void;
  onAutoNegotiate?: () => void;
  onResetSession?: () => void;
  onToggleMultiSeller?: () => void;
  onOpenCheckout?: () => void;
  onBackToDiscovery?: () => void;
  onOpenVoiceModal?: () => void;
}

type ResultFilterTab =
  | 'all'
  | 'best_match'
  | 'lowest_price'
  | 'negotiable'
  | 'local'
  | 'fast_delivery';

interface SavedConversationSession {
  id: string;
  title: string;
  timestamp: string;
  preferences: StructuredShoppingPreferences | null;
  messages: ChatTurnMessage[];
}

const WELCOME_EXAMPLE_PROMPTS = [
  'Find Sony earbuds under ₹2,000',
  'I need a gaming laptop under ₹60,000 with RTX graphics, 16GB RAM, 512GB SSD',
  'Find me Nike running shoes under ₹3,000',
  'I need wireless earbuds under ₹2,500. Good bass, ANC, and preferably Sony or JBL.',
];

const POPULAR_CATEGORY_REQUESTS = [
  {
    label: 'Sony Earbuds ≤ ₹2,000',
    icon: Headphones,
    prompt: 'Find Sony earbuds under ₹2,000',
  },
  {
    label: 'RTX Laptop ≤ ₹60,000',
    icon: Laptop,
    prompt: 'I need a gaming laptop under ₹60,000 with RTX graphics, 16GB RAM, 512GB SSD',
  },
  {
    label: 'Nike Shoes ≤ ₹3,000',
    icon: ShoppingBag,
    prompt: 'Find me Nike running shoes under ₹3,000',
  },
  {
    label: 'Sony WH-CH520 Deals',
    icon: Headphones,
    prompt: 'Find the cheapest Sony WH-CH520 wireless headphones under ₹3,500',
  },
  {
    label: 'Gaming Keyboard',
    icon: Gamepad2,
    prompt: 'Find me a hot-swappable wireless mechanical gaming keyboard under ₹4,500.',
  },
];

const FOLLOW_UP_SUGGESTIONS = [
  'Which one is the cheapest?',
  'Can you negotiate it?',
  'Show me anything under ₹3,200',
  'Actually increase my budget to ₹3,000',
  'Only show Sony',
  'Compare the first and third',
  'Show me local stores',
];

export const StreamlinedNegotiator: React.FC<StreamlinedNegotiatorProps> = ({
  products = [],
  categorySettings = [],
  initialSelectedProduct = null,
  onClearInitialProduct,
  onAcceptDealCheckout,
  onAnalyzeDeal,
  onCompareToggle,
  comparedProductIds = [],
  onOpenCompareModal,
  onNavigateToStores,
  currentThemeId = 'pure-white',
  currentUser = null,
}) => {
  const theme = THEMES[currentThemeId] || THEMES['pure-white'];

  // Session Security: Associate conversation state with authenticated user (Section 19)
  const prevUserIdRef = useRef<string | null>(currentUser?.uid || null);

  // Shared Conversational Multi-Agent State
  const [sessionId, setSessionId] = useState<string>(() => `dm_session_${currentUser?.uid || 'guest'}_${Date.now()}`);
  const [inputText, setInputText] = useState<string>('');
  const [preferences, setPreferences] = useState<StructuredShoppingPreferences | null>(null);

  // Authoritative Single Source of Truth for currently displayed search results (Requirements #1, #4, #5)
  const [currentSearchResults, setCurrentSearchResults] = useState<DealHunterProductCandidate[]>([]);
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [currentSearchQuery, setCurrentSearchQuery] = useState<string>('');
  const searchRequestIdRef = useRef<number>(0);

  // searchResults kept in sync with currentSearchResults for backward compatibility
  const [searchResults, setSearchResults] = useState<DealHunterProductCandidate[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [conversationHistory, setConversationHistory] = useState<ChatTurnMessage[]>([]);
  const [pastSessions, setPastSessions] = useState<SavedConversationSession[]>([]);

  // Explicit State Management Object separating 'discovery', 'negotiation', and 'alternatives' modes
  const [sessionState, setSessionState] = useState<NegotiatorSessionState>({
    mode: 'discovery',
    activeProduct: null,
    activeCandidate: null,
    activeNegotiation: null,
    alternativeCandidates: [],
  });

  // Reset conversation if user logs in/out or switches accounts
  useEffect(() => {
    if (prevUserIdRef.current !== (currentUser?.uid || null)) {
      prevUserIdRef.current = currentUser?.uid || null;
      searchRequestIdRef.current += 1;
      setHasSearched(false);
      setCurrentSearchQuery('');
      setCurrentSearchResults([]);
      setSearchResults([]);
      setConversationHistory([]);
      setInputText('');
      setPreferences(null);
      setSelectedProduct(null);
      setInspectDealProduct(null);
      setSessionState({
        mode: 'discovery',
        activeProduct: null,
        activeCandidate: null,
        activeNegotiation: null,
        alternativeCandidates: [],
      });
      setSessionId(`dm_session_${currentUser?.uid || 'guest'}_${Date.now()}`);
    }
  }, [currentUser?.uid]);

  // Three-Agent Pipeline Status
  const [agentStatus, setAgentStatus] = useState<{
    preference: AgentStageStatus;
    dealHunter: AgentStageStatus;
    negotiator: AgentStageStatus;
  }>({
    preference: 'idle',
    dealHunter: 'idle',
    negotiator: 'idle',
  });
  const [isPipelineRunning, setIsPipelineRunning] = useState<boolean>(false);

  // Compact Expandable "AI Team Activity" Panel State
  const [isActivityPanelOpen, setIsActivityPanelOpen] = useState<boolean>(false);

  // Product Results Panel dedicated state (Requirement #2, #4, #5, #6)
  const [productSort, setProductSort] = useState<ProductSortOption>('best_match');
  const [productFilter, setProductFilter] = useState<ProductFilterOption>('all');
  const [displayedProductsCount, setDisplayedProductsCount] = useState<number>(6);
  const [highlightedProductId, setHighlightedProductId] = useState<string | null>(null);
  const [mobileActiveTab, setMobileActiveTab] = useState<'chat' | 'products'>('chat');

  // Unified candidates for the dedicated Product Results Panel:
  // Render ONLY currentSearchResults! NEVER merge with default products or fall back to products.slice(0, 10)! (Requirements #1, #2, #4, #5)
  const displayCandidates: DealHunterProductCandidate[] = currentSearchResults;

  const [inspectDealProduct, setInspectDealProduct] = useState<DealHunterProductCandidate | null>(
    null
  );
  const [redirectBannerMsg, setRedirectBannerMsg] = useState<string | null>(null);
  const [customBudgetMsgId, setCustomBudgetMsgId] = useState<string | null>(null);
  const [customBudgetInput, setCustomBudgetInput] = useState<string>('');

  // Chat & Session Management Modal States (Section 15, 16, 17, 18)
  const [showClearChatModal, setShowClearChatModal] = useState<boolean>(false);
  const [showClearSessionModal, setShowClearSessionModal] = useState<boolean>(false);

  const handleNewChat = () => {
    soundEffects.playBlip();
    searchRequestIdRef.current += 1;
    setConversationHistory([]);
    setInputText('');
    setPreferences(null);
    setHasSearched(false);
    setCurrentSearchQuery('');
    setCurrentSearchResults([]);
    setSearchResults([]);
    setSelectedProduct(null);
    setInspectDealProduct(null);
    onClearInitialProduct?.();
    setSessionId(`dm_session_${Date.now()}`);
    setAgentStatus({
      preference: 'idle',
      dealHunter: 'idle',
      negotiator: 'idle',
    });
    setIsPipelineRunning(false);
    setSessionState({
      mode: 'discovery',
      activeProduct: null,
      activeCandidate: null,
      activeNegotiation: null,
      alternativeCandidates: [],
    });
  };

  const handleConfirmClearChat = () => {
    soundEffects.playBlip();
    searchRequestIdRef.current += 1;
    setConversationHistory([]);
    setInputText('');
    setPreferences(null);
    setHasSearched(false);
    setCurrentSearchQuery('');
    setCurrentSearchResults([]);
    setSearchResults([]);
    setSelectedProduct(null);
    setInspectDealProduct(null);
    onClearInitialProduct?.();
    setSessionId(`dm_session_${Date.now()}`);
    setAgentStatus({
      preference: 'idle',
      dealHunter: 'idle',
      negotiator: 'idle',
    });
    setIsPipelineRunning(false);
    setShowClearChatModal(false);
    setSessionState({
      mode: 'discovery',
      activeProduct: null,
      activeCandidate: null,
      activeNegotiation: null,
      alternativeCandidates: [],
    });
  };

  const handleConfirmClearSession = () => {
    soundEffects.playBlip();
    searchRequestIdRef.current += 1;
    setConversationHistory([]);
    setInputText('');
    setPreferences(null);
    setHasSearched(false);
    setCurrentSearchQuery('');
    setCurrentSearchResults([]);
    setSearchResults([]);
    setSelectedProduct(null);
    setInspectDealProduct(null);
    setProductFilter('all');
    setProductSort('best_match');
    setDisplayedProductsCount(6);
    setCustomBudgetMsgId(null);
    setCustomBudgetInput('');
    onClearInitialProduct?.();
    setSessionId(`dm_session_${Date.now()}`);
    setAgentStatus({
      preference: 'idle',
      dealHunter: 'idle',
      negotiator: 'idle',
    });
    setIsPipelineRunning(false);
    setShowClearSessionModal(false);
    setSessionState({
      mode: 'discovery',
      activeProduct: null,
      activeCandidate: null,
      activeNegotiation: null,
      alternativeCandidates: [],
    });
  };

  const handleExternalRedirectNotice = (retailerName: string, productName: string) => {
    setRedirectBannerMsg(
      `Opening the retailer's website... You're being redirected to ${retailerName} for "${productName}".`
    );
    setTimeout(() => {
      setRedirectBannerMsg(null);
    }, 4500);
  };

  // Voice Assistant State (IDLE | LISTENING | PROCESSING)
  const [voiceState, setVoiceState] = useState<'IDLE' | 'LISTENING' | 'PROCESSING'>('IDLE');
  const [liveTranscriptPreview, setLiveTranscriptPreview] = useState<string>('');
  const [isSpeakingId, setIsSpeakingId] = useState<string | null>(null);

  // Collapsible Voice Settings Popover State (not permanently visible)
  const [isVoiceSettingsOpen, setIsVoiceSettingsOpen] = useState<boolean>(false);
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(true);
  const [autoPlayResponses, setAutoPlayResponses] = useState<boolean>(false);
  const [speechRate, setSpeechRate] = useState<number>(1.0);
  const [micPermissionState, setMicPermissionState] = useState<
    'prompt' | 'granted' | 'denied'
  >('prompt');

  const recognitionRef = useRef<any>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const hasHandledInitialProductRef = useRef<string | null>(null);

  // Auto-scroll chat to latest message when conversation updates
  useEffect(() => {
    if (conversationHistory.length > 0) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [conversationHistory.length, isPipelineRunning]);

  // Clean up speech synthesis on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Only if the user explicitly clicked "Negotiate" on a specific product card from another view
  useEffect(() => {
    if (
      initialSelectedProduct &&
      hasHandledInitialProductRef.current !== initialSelectedProduct.id
    ) {
      hasHandledInitialProductRef.current = initialSelectedProduct.id;
      const autoQuery = `Find me ${initialSelectedProduct.name} under ₹${initialSelectedProduct.listPrice.toLocaleString(
        'en-IN'
      )} and negotiate the lowest price`;
      handleUserSubmission(autoQuery, false, initialSelectedProduct);
    }
  }, [initialSelectedProduct]);

  /**
   * Text-to-Speech (TTS) playback for assistant responses
   */
  const handlePlaySpeech = (messageId: string, textToSpeak: string) => {
    if (!voiceEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }

    if (isSpeakingId === messageId) {
      window.speechSynthesis.cancel();
      setIsSpeakingId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = 'en-IN';
    utterance.rate = speechRate;
    utterance.onstart = () => setIsSpeakingId(messageId);
    utterance.onend = () => setIsSpeakingId(null);
    utterance.onerror = () => setIsSpeakingId(null);
    window.speechSynthesis.speak(utterance);
  };

  /**
   * Start a fresh conversational shopping session (Welcome State)
   */
  const handleStartNewSession = () => {
    if (conversationHistory.length > 0 && preferences) {
      setPastSessions((prev) => [
        {
          id: sessionId,
          title: `${preferences.productType} ≤ ₹${preferences.budget.toLocaleString('en-IN')}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          preferences,
          messages: conversationHistory,
        },
        ...prev.slice(0, 7),
      ]);
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    searchRequestIdRef.current += 1;
    setSessionId(`dm_session_${Date.now()}`);
    setInputText('');
    setPreferences(null);
    setHasSearched(false);
    setCurrentSearchQuery('');
    setCurrentSearchResults([]);
    setSearchResults([]);
    setSelectedProduct(null);
    setConversationHistory([]);
    setAgentStatus({
      preference: 'idle',
      dealHunter: 'idle',
      negotiator: 'idle',
    });
    setProductFilter('all');
    setProductSort('best_match');
    setDisplayedProductsCount(6);
    setInspectDealProduct(null);
    setSessionState({
      mode: 'discovery',
      activeProduct: null,
      activeCandidate: null,
      activeNegotiation: null,
      alternativeCandidates: [],
    });
    hasHandledInitialProductRef.current = null;
    if (onClearInitialProduct) {
      onClearInitialProduct();
    }
  };

  /**
   * Launch or run bounded Buyer AI <-> Seller AI negotiation inside the conversation
   */
  const startInlineProductNegotiation = async (
    product: Product,
    customTargetAsk?: number
  ) => {
    setSelectedProduct(product);
    setAgentStatus({
      preference: 'completed',
      dealHunter: 'completed',
      negotiator: 'active',
    });

    const matchedSetting = resolveCategorySetting(product, categorySettings);
    const maxPct =
      matchedSetting?.maxSingleDiscountPct ??
      product.maxDiscountPercent ??
      MAX_SINGLE_ITEM_DISCOUNT;
    const floor = Math.max(
      product.minAcceptablePrice || priceFloor(product.listPrice, maxPct, false),
      priceFloor(product.listPrice, maxPct, false)
    );

    const userBudget = preferences?.budget || product.listPrice;
    const rawTarget =
      customTargetAsk ||
      Math.min(userBudget, Math.round(product.listPrice * 0.86));
    // Never promise a discount below the seller's floor
    const boundedTarget = Math.max(floor, Math.min(product.listPrice - 50, rawTarget));

    const workspaceMsgId = `msg_neg_ws_${Date.now()}`;
    const initialWorkspace: NegotiationWorkspaceData = {
      product,
      currentPrice: product.listPrice,
      userBudget,
      targetPrice: boundedTarget,
      floorPrice: floor,
      status: 'NEGOTIATING',
      settledPrice: product.listPrice,
      savings: 0,
      isSimulatedDemo: !product.isStoreOwnerListed,
      turns: [],
      quantity: preferences?.quantity || 1,
      bundleSuggestion: product.bundleEligible
        ? 'Eligible for additional 5% bundle discount when paired with an accessory.'
        : undefined,
    };

    const negotiatingTurn: ChatTurnMessage = {
      id: workspaceMsgId,
      role: 'assistant',
      agentLabel: 'Negotiator',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: `Initiating bounded Buyer AI ↔ Seller AI negotiation with ${product.sellerName} for ${product.name}...`,
      negotiationWorkspace: initialWorkspace,
    };

    const alts = displayCandidates
      .filter((c) => c.product.id !== product.id)
      .sort((a, b) => a.product.listPrice - b.product.listPrice);
    const activeCand = displayCandidates.find((c) => c.product.id === product.id) || null;

    setSessionState({
      mode: 'negotiation',
      activeProduct: product,
      activeCandidate: activeCand,
      activeNegotiation: initialWorkspace,
      alternativeCandidates: alts,
    });

    setConversationHistory((prev) => [...prev, negotiatingTurn]);

    // Call backend /api/negotiation/run-exchange (or fallback to deterministic bounded exchange)
    let turns: NegotiationExchangeTurn[] = [];
    let settledPrice = boundedTarget;

    try {
      const res = await fetch('/api/negotiation/run-exchange', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          product,
          buyerInitialAsk: boundedTarget,
          maxSingleDiscountPct: maxPct,
          maxBundleDiscountPct: matchedSetting?.maxBundleDiscountPct,
          isBundle: (preferences?.quantity || 1) > 1,
        }),
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data.turns) && data.turns.length > 0) {
        turns = data.turns;
        settledPrice = Math.max(floor, Number(data.settledPrice) || boundedTarget);
      }
    } catch {
      // Fallback bounded turns
    }

    if (turns.length === 0) {
      const midOffer = Math.round((product.listPrice + boundedTarget) / 2);
      settledPrice = Math.max(floor, boundedTarget);
      turns = [
        {
          round: 1,
          speaker: 'BUYER_AGENT',
          price: boundedTarget,
          message: `Buyer AI: Requesting ₹${boundedTarget.toLocaleString(
            'en-IN'
          )} based on user budget of ₹${userBudget.toLocaleString(
            'en-IN'
          )} and competing marketplace benchmarks.`,
        },
        {
          round: 1,
          speaker: 'SELLER_AGENT',
          price: midOffer,
          message: `${product.sellerName} AI: We can counter at ₹${midOffer.toLocaleString(
            'en-IN'
          )} with express dispatch and full warranty.`,
        },
        {
          round: 2,
          speaker: 'BUYER_AGENT',
          price: settledPrice,
          message: `Buyer AI: Counter-proposing ₹${settledPrice.toLocaleString(
            'en-IN'
          )} for immediate checkout confirmation.`,
        },
        {
          round: 2,
          speaker: 'SELLER_AGENT',
          price: settledPrice,
          message: `${product.sellerName} AI: Deal accepted at ₹${settledPrice.toLocaleString(
            'en-IN'
          )} (verified within seller floor constraints).`,
        },
      ];
    }

    const savings = Math.max(0, product.listPrice - settledPrice);

    setTimeout(() => {
      setConversationHistory((prev) =>
        prev.map((m) => {
          if (m.id !== workspaceMsgId) return m;
          const summaryMsg = `Negotiation complete for ${product.name}: settled at ₹${settledPrice.toLocaleString(
            'en-IN'
          )} (saving ₹${savings.toLocaleString('en-IN')} off ₹${product.listPrice.toLocaleString(
            'en-IN'
          )}).`;
          if (autoPlayResponses && voiceEnabled) {
            handlePlaySpeech(workspaceMsgId, summaryMsg);
          }
          return {
            ...m,
            text: summaryMsg,
            negotiationWorkspace: {
              ...initialWorkspace,
              status: 'COMPLETED',
              settledPrice,
              savings,
              turns,
            },
          };
        })
      );
      setAgentStatus({
        preference: 'completed',
        dealHunter: 'completed',
        negotiator: 'completed',
      });
      setSessionState((prev) => ({
        ...prev,
        mode: 'negotiation',
        activeProduct: product,
        activeNegotiation: {
          ...initialWorkspace,
          status: 'COMPLETED',
          settledPrice,
          savings,
          turns,
        },
      }));

      // AUTOMATIC TRANSITION: AI Negotiator -> AI Deal Analyzer (Requirement #1)
      if (onAnalyzeDeal) {
        setTimeout(() => {
          onAnalyzeDeal(product, settledPrice);
        }, 1200);
      }
    }, 650);
  };

  /**
   * Explicit mode transition helpers for StreamlinedNegotiator (Discovery <-> Negotiation <-> Alternatives)
   */
  const handleSelectProduct = (candidate: DealHunterProductCandidate) => {
    setSelectedProduct(candidate.product);
    setHighlightedProductId(candidate.product.id);
    const alts = displayCandidates
      .filter((c) => c.product.id !== candidate.product.id)
      .sort((a, b) => a.product.listPrice - b.product.listPrice);
    setSessionState({
      mode: 'negotiation',
      activeProduct: candidate.product,
      activeCandidate: candidate,
      activeNegotiation: null,
      alternativeCandidates: alts,
    });
  };

  const handleStartNegotiate = (candidate: DealHunterProductCandidate) => {
    setSelectedProduct(candidate.product);
    setHighlightedProductId(candidate.product.id);
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setMobileActiveTab('chat');
    }
    startInlineProductNegotiation(candidate.product, candidate.negotiationTarget);
  };

  const handleFindAlternatives = () => {
    const currentProd = sessionState.activeProduct || selectedProduct;
    const alts = displayCandidates
      .filter((c) => !currentProd || c.product.id !== currentProd.id)
      .sort((a, b) => a.product.listPrice - b.product.listPrice);
    setSessionState((prev) => ({
      ...prev,
      mode: 'alternatives',
      alternativeCandidates: alts.length > 0 ? alts : displayCandidates,
    }));
  };

  const handleBackToDiscovery = () => {
    setSessionState((prev) => ({
      ...prev,
      mode: 'discovery',
    }));
  };

  const handleBackToActiveDeal = () => {
    setSessionState((prev) => ({
      ...prev,
      mode: 'negotiation',
    }));
  };

  const handleSelectAlternative = (candidate: DealHunterProductCandidate) => {
    setSelectedProduct(candidate.product);
    setHighlightedProductId(candidate.product.id);
    startInlineProductNegotiation(candidate.product, candidate.negotiationTarget);
  };

  /**
   * Action handler for interactive suggested action pills (Requirement #6 & Conversational Intelligence)
   */
  const handleSuggestedAction = async (action: {
    type: string;
    label: string;
    productId?: string;
    productIds?: string[];
    targetPrice?: number;
    choices?: string[];
  }) => {
    soundEffects.playBlip();

    if (action.type === 'START_NEGOTIATION') {
      const prod =
        (action.productId && displayCandidates.find((c) => c.product.id === action.productId)?.product) ||
        selectedProduct ||
        displayCandidates.find((c) => c.eligibleForNegotiation)?.product ||
        displayCandidates[0]?.product;

      if (prod) {
        if (typeof window !== 'undefined' && window.innerWidth < 1024) {
          setMobileActiveTab('chat');
        }
        await startInlineProductNegotiation(prod, action.targetPrice);
      }
      return;
    }

    if (action.type === 'VIEW_PRODUCT' && action.productId) {
      setHighlightedProductId(action.productId);
      const prod = displayCandidates.find((c) => c.product.id === action.productId)?.product;
      if (prod) setSelectedProduct(prod);
      if (typeof window !== 'undefined' && window.innerWidth < 1024) {
        setMobileActiveTab('products');
      }
      const elem = document.getElementById(`product-card-${action.productId}`);
      elem?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      return;
    }

    if (action.type === 'COMPARE') {
      if (onOpenCompareModal) {
        onOpenCompareModal();
      }
      return;
    }

    if (action.type === 'ADJUST_BUDGET' && action.targetPrice) {
      handleUserSubmission(`Show me options under ₹${action.targetPrice}`, false);
      return;
    }

    if (action.type === 'QUICK_CHOICES' && action.choices && action.choices.length > 0) {
      handleUserSubmission(`Budget ${action.choices[0]}`, false);
      return;
    }
  };

  /**
   * Unified Multi-Agent Pipeline Handler (used identically by BOTH Text Input AND Voice Input)
   */
  const handleUserSubmission = async (
    rawText: string,
    isFromVoice: boolean = false,
    autoNegotiateProduct?: Product | null
  ) => {
    const trimmed = rawText.trim();
    if (!trimmed) return;

    setInputText('');
    setIsPipelineRunning(true);

    const nowTime = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    // 1. Append User Message to Conversation
    const userMessage: ChatTurnMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      timestamp: nowTime,
      text: trimmed,
      isVoiceTranscript: isFromVoice,
    };

    setConversationHistory((prev) => [...prev, userMessage]);

    // Check if this is a follow-up intent on an existing conversation
    const hasExisting = Boolean(preferences && searchResults.length > 0);
    const intent = PreferenceAgent.detectFollowUpIntent(trimmed, hasExisting);

    // Follow-up Case 0A: User approves budget expansion ("Yes" / "Search up to ₹2,500")
    if (intent === 'approve_expanded_budget' && preferences) {
      const { budget: explicitNewBudget, foundExplicitBudget } = parseSpokenOrTypedBudget(trimmed);
      const stepIncrement =
        preferences.budget >= 20000 ? 3000 : preferences.budget >= 5000 ? 1000 : 500;
      const expandedBudget = foundExplicitBudget
        ? explicitNewBudget
        : preferences.budget + stepIncrement;
      setIsPipelineRunning(false);
      await handleUserSubmission(
        `Show me ${
          preferences.preferredBrands.length > 0 ? preferences.preferredBrands.join(' ') + ' ' : ''
        }${preferences.productType} up to ₹${expandedBudget}`,
        isFromVoice
      );
      return;
    }

    // Check if this is an explicit or natural product search query (Requirement #1, #6, #7, #9, #11)
    const isSearchQuery =
      intent === 'new_search' ||
      /^(find|search|show me|look for|looking for|i want|i need|get me|give me)\b/i.test(trimmed) ||
      /\b(under|below|budget|within|around)\s*(?:₹|rs\.?)?\s*\d+/i.test(trimmed) ||
      /\b(earbuds?|headphones?|laptops?|smartwatch|shoes?|sneakers?|shirts?|dresses?|keyboards?)\b/i.test(trimmed);

    // Conversational Intelligence: Call /api/negotiator/chat ONLY if NOT a product search AND asking a question/comparison/negotiation
    const isQuestionOrNegotiation =
      !isSearchQuery &&
      (hasExisting ||
        currentSearchResults.length > 0 ||
        trimmed.includes('?') ||
        /\b(which|what|does|is|are|compare|vs|difference|better|lowest|negotiate|bargain|battery|anc|noise|gaming|latency|specs|specifications|warranty|charge|tell me|explain)\b/i.test(trimmed));

    if (isQuestionOrNegotiation && (hasExisting || currentSearchResults.length > 0)) {
      try {
        const chatRes = await fetch('/api/negotiator/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: trimmed,
            conversationHistory: conversationHistory.slice(-6),
            currentProducts: currentSearchResults.map((c) => c.product),
            selectedProduct,
            discussedProduct:
              currentSearchResults.find((c) => c.product.id === highlightedProductId)?.product ||
              selectedProduct,
            preferences,
          }),
        });

        if (chatRes.ok) {
          const aiData = await chatRes.json();

          // Case 1: NEGOTIATION INTENT
          if (aiData.intent === 'NEGOTIATION') {
            const targetCand =
              (aiData.resolvedProductId &&
                currentSearchResults.find((c) => c.product.id === aiData.resolvedProductId)) ||
              currentSearchResults.find((c) => c.product.id === selectedProduct?.id) ||
              currentSearchResults.find((c) => c.eligibleForNegotiation) ||
              currentSearchResults[0];

            if (targetCand && (targetCand.listingOrigin === 'EXTERNAL_RETAILER' || !targetCand.eligibleForNegotiation)) {
              const extMsg: ChatTurnMessage = {
                id: `ext_${Date.now()}`,
                role: 'assistant',
                agentLabel: 'Negotiator',
                timestamp: nowTime,
                text: aiData.replyText,
                suggestedActions: aiData.suggestedActions,
              };
              setConversationHistory((prev) => [...prev, extMsg]);
              setIsPipelineRunning(false);
              return;
            }

            if (targetCand) {
              const targetPrice =
                aiData.suggestedActions?.find((a: any) => a.type === 'START_NEGOTIATION')?.targetPrice ||
                targetCand.negotiationTarget;

              const aiNegMsg: ChatTurnMessage = {
                id: `assist_neg_${Date.now()}`,
                role: 'assistant',
                agentLabel: 'Negotiator',
                timestamp: nowTime,
                text: aiData.replyText,
                suggestedActions: aiData.suggestedActions,
                mentionedProductIds: [targetCand.product.id],
              };
              setConversationHistory((prev) => [...prev, aiNegMsg]);
              setIsPipelineRunning(false);

              if (autoPlayResponses && voiceEnabled) {
                handlePlaySpeech(aiNegMsg.id, aiNegMsg.text);
              }

              await startInlineProductNegotiation(targetCand.product, targetPrice);
              return;
            }
          }

          // Case 2: NEW SEARCH INTENT (e.g. "Show me something cheaper", "Find lower price")
          if (aiData.intent === 'NEW_SEARCH') {
            const currentReqId = ++searchRequestIdRef.current;
            setHasSearched(true);
            setCurrentSearchQuery(trimmed);
            setCurrentSearchResults([]);
            setSearchResults([]);

            const newBudget = aiData.newSearchCriteria?.budget;
            const updatedPrefs: StructuredShoppingPreferences = {
              rawQuery: aiData.newSearchCriteria?.query || trimmed,
              category: aiData.newSearchCriteria?.category || 'Electronics',
              productType: aiData.newSearchCriteria?.productType || 'Product',
              budget: newBudget || 2000,
              preferredBrands: [],
              requiredFeatures: [],
              quantity: 1,
              condition: 'New',
              deliveryPreference: 'Standard Delivery',
              minSpecs: [],
              dealPreferences: 'Best Value',
              isPriceFirstMode: false,
            };
            setPreferences(updatedPrefs);
            setSelectedProduct(null);
            setHighlightedProductId(null);
            setSessionState({
              mode: 'discovery',
              activeProduct: null,
              activeCandidate: null,
              activeNegotiation: null,
              alternativeCandidates: [],
            });

            const aiMsg: ChatTurnMessage = {
              id: `assist_search_${Date.now()}`,
              role: 'assistant',
              agentLabel: 'Deal Hunter',
              timestamp: nowTime,
              text: aiData.replyText,
              suggestedActions: aiData.suggestedActions,
            };
            setConversationHistory((prev) => [...prev, aiMsg]);

            const hunterOutput = await DealHunterAgent.searchWithExternalFallback(
              updatedPrefs,
              products,
              categorySettings
            );

            if (currentReqId !== searchRequestIdRef.current) return;
            setCurrentSearchResults(hunterOutput.candidates);
            setSearchResults(hunterOutput.candidates);

            const isAltIntent = /\b(cheaper|alternative|alternatives|similar|other options|another one|better option|different|lower price|under)\b/i.test(trimmed);
            if (isAltIntent && (sessionState.activeProduct || selectedProduct)) {
              setSessionState((prev) => ({
                ...prev,
                mode: 'alternatives',
                alternativeCandidates: hunterOutput.candidates,
              }));
            } else {
              setSessionState({
                mode: 'discovery',
                activeProduct: null,
                activeCandidate: null,
                activeNegotiation: null,
                alternativeCandidates: [],
              });
            }

            setIsPipelineRunning(false);
            if (autoPlayResponses && voiceEnabled) {
              handlePlaySpeech(aiMsg.id, aiMsg.text);
            }
            return;
          }

          // Case 3: GENERAL / SPEC QUESTION / COMPARISON
          const comparePair: [Product, Product] | undefined =
            aiData.comparedProductIds && aiData.comparedProductIds.length >= 2
              ? ([
                  currentSearchResults.find((c) => c.product.id === aiData.comparedProductIds[0])?.product,
                  currentSearchResults.find((c) => c.product.id === aiData.comparedProductIds[1])?.product,
                ].filter(Boolean) as [Product, Product])
              : undefined;

          const assistantAnswer: ChatTurnMessage = {
            id: `assist_${Date.now()}`,
            role: 'assistant',
            agentLabel: 'Deal Hunter',
            timestamp: nowTime,
            text: aiData.replyText,
            suggestedActions: aiData.suggestedActions,
            mentionedProductIds: aiData.mentionedProductIds,
            comparisonPair: comparePair && comparePair.length === 2 ? comparePair : undefined,
          };

          setConversationHistory((prev) => [...prev, assistantAnswer]);

          if (aiData.mentionedProductIds && aiData.mentionedProductIds.length > 0) {
            setHighlightedProductId(aiData.mentionedProductIds[0]);
          }
          if (aiData.resolvedProductId) {
            const resolved = currentSearchResults.find((c) => c.product.id === aiData.resolvedProductId)?.product;
            if (resolved) setSelectedProduct(resolved);
          }

          setIsPipelineRunning(false);
          if (autoPlayResponses && voiceEnabled) {
            handlePlaySpeech(assistantAnswer.id, assistantAnswer.text);
          }
          return;
        }
      } catch (err) {
        console.warn('Error fetching /api/negotiator/chat, falling back to local multi-agent pipeline:', err);
      }
    }

    // Fallback: Follow-up Case 0B: "Which one is the cheapest?" / "Lowest price"
    if (intent === 'cheapest_query' && displayCandidates.length > 0) {
      const sortedByPrice = [...displayCandidates].sort(
        (a, b) => a.product.listPrice - b.product.listPrice
      );
      const cheapest = sortedByPrice[0];
      const cheapestMsg: ChatTurnMessage = {
        id: `cheap_${Date.now()}`,
        role: 'assistant',
        agentLabel: 'Deal Hunter',
        timestamp: nowTime,
        text: `The lowest verified price I found across searched sources for a matching configuration is ₹${cheapest.product.listPrice.toLocaleString(
          'en-IN'
        )} for "${cheapest.product.name}" via ${cheapest.retailerName}.\n\nPrices may change on the retailer's website.`,
        productCandidates: [cheapest],
      };
      setConversationHistory((prev) => [...prev, cheapestMsg]);
      setHighlightedProductId(cheapest.product.id);
      setIsPipelineRunning(false);
      if (autoPlayResponses && voiceEnabled) {
        handlePlaySpeech(cheapestMsg.id, cheapestMsg.text);
      }
      return;
    }

    // Fallback: Follow-up Case A: "Compare the first and third"
    if (intent === 'compare' && displayCandidates.length >= 2) {
      const first = displayCandidates[0].product;
      const secondIndex = trimmed.toLowerCase().includes('third') && displayCandidates[2] ? 2 : 1;
      const second = displayCandidates[secondIndex].product;

      const compareMsg: ChatTurnMessage = {
        id: `cmp_${Date.now()}`,
        role: 'assistant',
        agentLabel: 'Deal Hunter',
        timestamp: nowTime,
        text: `Here is a direct side-by-side comparison between #1 (${first.name}) and #${
          secondIndex + 1
        } (${second.name}):`,
        comparisonPair: [first, second],
      };

      setConversationHistory((prev) => [...prev, compareMsg]);
      setIsPipelineRunning(false);
      if (autoPlayResponses && voiceEnabled) {
        handlePlaySpeech(compareMsg.id, compareMsg.text);
      }
      return;
    }

    // Fallback: Follow-up Case B: "Try negotiating with the seller"
    if (intent === 'negotiate_target' && (selectedProduct || displayCandidates.length > 0)) {
      const targetCand =
        displayCandidates.find((c) => c.product.id === selectedProduct?.id) ||
        displayCandidates.find((c) => c.eligibleForNegotiation) ||
        displayCandidates[0];

      if (targetCand.listingOrigin === 'EXTERNAL_RETAILER' || !targetCand.eligibleForNegotiation) {
        const extFallbackMsg: ChatTurnMessage = {
          id: `ext_neg_fb_${Date.now()}`,
          role: 'assistant',
          agentLabel: 'Negotiator',
          timestamp: nowTime,
          text: `"${targetCand.product.name}" (₹${targetCand.product.listPrice.toLocaleString(
            'en-IN'
          )}) is from an external retailer (${
            targetCand.retailerName
          }), so DealMate cannot negotiate its price directly. You can view it on the retailer's website or switch to a negotiable DealMate Store listing.`,
        };
        setConversationHistory((prev) => [...prev, extFallbackMsg]);
        setIsPipelineRunning(false);
        return;
      }

      const { budget: requestedAsk, foundExplicitBudget } = parseSpokenOrTypedBudget(trimmed);
      setIsPipelineRunning(false);
      await startInlineProductNegotiation(
        targetCand.product,
        foundExplicitBudget ? requestedAsk : undefined
      );
      return;
    }

    // Standard or Refinement 3-Agent Pipeline:
    // Stale result protection & immediate product clear (Requirements #1, #9, #10, #11)
    const currentReqId = ++searchRequestIdRef.current;
    const isRefinement =
      hasExisting &&
      (intent === 'modify_budget' || intent === 'filter_brand' || intent === 'local_stores');

    if (!isRefinement) {
      setHasSearched(true);
      setCurrentSearchQuery(trimmed);
      setCurrentSearchResults([]);
      setSearchResults([]);
      setSelectedProduct(null);
      setHighlightedProductId(null);
      setSessionState({
        mode: 'discovery',
        activeProduct: null,
        activeCandidate: null,
        activeNegotiation: null,
        alternativeCandidates: [],
      });
    }

    // Stage 01: PREFERENCE AGENT
    setAgentStatus({
      preference: 'active',
      dealHunter: 'idle',
      negotiator: 'idle',
    });

    const updatedPrefs = PreferenceAgent.extractPreferences(
      trimmed,
      isRefinement && preferences ? preferences : undefined
    );
    setPreferences(updatedPrefs);

    const prefReply = PreferenceAgent.buildResponse(updatedPrefs, isRefinement);
    const prefMsgId = `pref_${Date.now()}`;
    const prefTurn: ChatTurnMessage = {
      id: prefMsgId,
      role: 'assistant',
      agentLabel: 'Preference Agent',
      timestamp: nowTime,
      text: prefReply.text,
      bulletPoints: prefReply.bulletPoints,
    };

    setConversationHistory((prev) => [...prev, prefTurn]);

    // Stage 02: DEAL HUNTER AGENT
    setAgentStatus({
      preference: 'completed',
      dealHunter: 'active',
      negotiator: 'idle',
    });

    await new Promise((r) => setTimeout(r, 320));

    const hunterOutput = await DealHunterAgent.searchWithExternalFallback(
      updatedPrefs,
      products,
      categorySettings
    );

    // Stale search protection: ignore if another search request started in the meantime (Requirement #10)
    if (currentReqId !== searchRequestIdRef.current) return;

    // Single source of truth update (Requirements #1, #2, #4, #5)
    setCurrentSearchResults(hunterOutput.candidates);
    setSearchResults(hunterOutput.candidates);
    if (!autoNegotiateProduct && !trimmed.toLowerCase().includes('and negotiate') && !trimmed.toLowerCase().includes('lowest possible price')) {
      setSessionState({
        mode: 'discovery',
        activeProduct: null,
        activeCandidate: null,
        activeNegotiation: null,
        alternativeCandidates: [],
      });
    }

    const hunterMsgId = `hunter_${Date.now()}`;
    const hunterTurn: ChatTurnMessage = {
      id: hunterMsgId,
      role: 'assistant',
      agentLabel: 'Deal Hunter',
      timestamp: nowTime,
      text: hunterOutput.summaryText,
      dealHunterSources: hunterOutput.sources,
      expandedSearchSummary: hunterOutput.expandedSearchSummary,
      isDemoDataNotice: true,
      productCandidates: hunterOutput.candidates,
    };

    setConversationHistory((prev) => [...prev, hunterTurn]);

    // Stage 03: NEGOTIATOR AGENT
    setAgentStatus({
      preference: 'completed',
      dealHunter: 'completed',
      negotiator: 'active',
    });

    await new Promise((r) => setTimeout(r, 280));

    const negotiatorOutput = NegotiatorAgent.evaluateDeals(
      updatedPrefs,
      hunterOutput.candidates
    );

    const negMsgId = `neg_${Date.now()}`;
    const negTurn: ChatTurnMessage = {
      id: negMsgId,
      role: 'assistant',
      agentLabel: 'Negotiator',
      timestamp: nowTime,
      text: negotiatorOutput.summaryText,
      negotiatorCandidates: negotiatorOutput.eligibleCandidates,
    };

    setConversationHistory((prev) => [...prev, negTurn]);
    setAgentStatus({
      preference: 'completed',
      dealHunter: 'completed',
      negotiator: 'completed',
    });
    setIsPipelineRunning(false);

    if (autoPlayResponses && voiceEnabled) {
      handlePlaySpeech(
        negMsgId,
        `${prefReply.text} ${hunterOutput.summaryText} ${negotiatorOutput.summaryText}`
      );
    }

    // If user explicitly asked to negotiate right away or came from a product card
    const shouldAutoNegotiate =
      Boolean(autoNegotiateProduct) ||
      trimmed.toLowerCase().includes('lowest possible price') ||
      trimmed.toLowerCase().includes('and negotiate');

    if (shouldAutoNegotiate) {
      const negotiableCandidate =
        hunterOutput.candidates.find(
          (c) =>
            c.eligibleForNegotiation &&
            (!autoNegotiateProduct || c.product.id === autoNegotiateProduct.id)
        ) || hunterOutput.candidates.find((c) => c.eligibleForNegotiation);

      if (negotiableCandidate) {
        await startInlineProductNegotiation(
          negotiableCandidate.product,
          negotiableCandidate.negotiationTarget
        );
      }
    }
  };

  /**
   * Voice Capture Handler (Web Speech API -> exact same handleUserSubmission pipeline)
   */
  const handleToggleVoiceCapture = async () => {
    if (voiceState === 'LISTENING' && recognitionRef.current) {
      recognitionRef.current.stop();
      setVoiceState('IDLE');
      return;
    }

    const SpeechRecognitionAPI =
      typeof window !== 'undefined'
        ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        : null;

    if (!SpeechRecognitionAPI) {
      // Request microphone permission check and inform user
      setVoiceState('PROCESSING');
      setTimeout(() => {
        setVoiceState('IDLE');
        const fallbackVoiceQuery =
          'I need wireless earbuds under ₹2,500. Good bass, ANC, and preferably Sony or JBL.';
        handleUserSubmission(fallbackVoiceQuery, true);
      }, 600);
      return;
    }

    try {
      const recognition = new SpeechRecognitionAPI();
      recognition.lang = 'en-IN';
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setMicPermissionState('granted');
        setVoiceState('LISTENING');
        setLiveTranscriptPreview('');
      };

      recognition.onresult = (event: any) => {
        let interim = '';
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const chunk = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += chunk;
          } else {
            interim += chunk;
          }
        }
        if (interim) {
          setLiveTranscriptPreview(interim);
        }
        if (finalTranscript.trim()) {
          setLiveTranscriptPreview(finalTranscript.trim());
          setVoiceState('PROCESSING');
          setTimeout(() => {
            setVoiceState('IDLE');
            setLiveTranscriptPreview('');
            handleUserSubmission(finalTranscript.trim(), true);
          }, 350);
        }
      };

      recognition.onerror = () => {
        setVoiceState('IDLE');
        setLiveTranscriptPreview('');
      };

      recognition.onend = () => {
        setVoiceState((prev) => (prev === 'LISTENING' ? 'IDLE' : prev));
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setVoiceState('IDLE');
    }
  };

  const isWelcomeState = conversationHistory.length === 0;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Top Bar: Session Status + Compact Expandable "AI Team Activity" Trigger + Voice Settings */}
      <div
        className={`mb-4 px-4 py-3 rounded-2xl border flex flex-wrap items-center justify-between gap-3 transition-all ${
          theme.isLight
            ? 'bg-white border-slate-200/90 shadow-xs'
            : 'bg-[#0D1322] border-slate-800'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm shrink-0">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1
                className={`font-display font-bold text-base sm:text-lg ${
                  theme.isLight ? 'text-slate-900' : 'text-white'
                }`}
              >
                DealMate AI Shopping Assistant
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-blue-500/10 text-blue-600 border border-blue-500/20">
                3-Agent Pipeline
              </span>
            </div>
            <p className={`text-xs ${theme.isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Preference AI → Deal Hunter AI → Negotiator AI
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Section 15, 16, 17, 18: Chat & Session Controls */}
          <button
            type="button"
            onClick={handleNewChat}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 cursor-pointer transition-all ${
              theme.isLight
                ? 'bg-blue-600 hover:bg-blue-500 text-white border-blue-600 shadow-xs'
                : 'bg-blue-600 hover:bg-blue-500 text-white border-blue-500'
            }`}
            title="Start a fresh shopping and negotiation conversation"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Chat</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEffects.playBlip();
              setShowClearChatModal(true);
            }}
            disabled={conversationHistory.length === 0}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-medium border flex items-center gap-1 cursor-pointer transition-all ${
              conversationHistory.length === 0
                ? 'opacity-40 cursor-not-allowed border-transparent text-slate-400'
                : theme.isLight
                ? 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
            }`}
            title="Clear the current conversation"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Clear Chat</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEffects.playBlip();
              setShowClearSessionModal(true);
            }}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-medium border flex items-center gap-1 cursor-pointer transition-all ${
              theme.isLight
                ? 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
            }`}
            title="Reset temporary shopping session"
          >
            <X className="w-3.5 h-3.5 text-rose-500" />
            <span className="hidden sm:inline">Clear Session</span>
          </button>

          {/* Compact Expandable "AI Team Activity" Button */}
          <button
            type="button"
            onClick={() => setIsActivityPanelOpen((prev) => !prev)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium border flex items-center gap-2 cursor-pointer transition-all ${
              isActivityPanelOpen
                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                : theme.isLight
                ? 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isPipelineRunning
                  ? 'bg-amber-400 animate-ping'
                  : agentStatus.negotiator === 'completed'
                  ? 'bg-emerald-500'
                  : 'bg-blue-500'
              }`}
            />
            <span>AI Team Activity</span>
            {isActivityPanelOpen ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>

          {/* Collapsible Voice Settings Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsVoiceSettingsOpen((prev) => !prev)}
              aria-label="Voice Settings"
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border flex items-center gap-1.5 cursor-pointer transition-all ${
                theme.isLight
                  ? 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700'
              }`}
            >
              <Settings className="w-3.5 h-3.5 text-blue-500" />
              <span className="hidden sm:inline">Voice Settings</span>
            </button>

            {isVoiceSettingsOpen && (
              <div
                className={`absolute right-0 mt-2 w-64 rounded-2xl border p-4 shadow-xl z-50 space-y-3 ${
                  theme.isLight
                    ? 'bg-white border-slate-200 text-slate-800'
                    : 'bg-[#0F1626] border-slate-700 text-slate-100'
                }`}
              >
                <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                  <span className="text-xs font-bold">Voice Assistant Settings</span>
                  <button
                    type="button"
                    onClick={() => setIsVoiceSettingsOpen(false)}
                    className="p-1 rounded-lg hover:bg-slate-500/10 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <label className="flex items-center justify-between text-xs cursor-pointer">
                  <span>Voice Output (TTS)</span>
                  <input
                    type="checkbox"
                    checked={voiceEnabled}
                    onChange={(e) => setVoiceEnabled(e.target.checked)}
                    className="accent-blue-600"
                  />
                </label>

                <label className="flex items-center justify-between text-xs cursor-pointer">
                  <span>Auto-play AI Responses</span>
                  <input
                    type="checkbox"
                    checked={autoPlayResponses}
                    onChange={(e) => setAutoPlayResponses(e.target.checked)}
                    className="accent-blue-600"
                  />
                </label>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span>Speech Speed</span>
                    <span className="font-mono text-[11px] text-blue-500">{speechRate}x</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {[0.9, 1.0, 1.15, 1.3].map((rate) => (
                      <button
                        key={rate}
                        type="button"
                        onClick={() => setSpeechRate(rate)}
                        className={`flex-1 py-1 rounded-lg text-[11px] font-mono border cursor-pointer ${
                          speechRate === rate
                            ? 'bg-blue-600 text-white border-blue-600 font-bold'
                            : 'border-slate-300/40 hover:bg-slate-500/10'
                        }`}
                      >
                        {rate}x
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-1 border-t border-slate-200/50 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 dark:text-slate-400">Mic Permission:</span>
                  <span
                    className={`font-mono font-semibold ${
                      micPermissionState === 'granted' ? 'text-emerald-500' : 'text-blue-500'
                    }`}
                  >
                    {micPermissionState === 'granted' ? 'Granted ✓' : 'Ready on Click'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {!isWelcomeState && (
            <button
              type="button"
              onClick={handleStartNewSession}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 cursor-pointer transition-all ${
                theme.isLight
                  ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Session</span>
            </button>
          )}
        </div>
      </div>

      {/* Expandable Compact "AI Team Activity" Drawer (when toggled on mobile/tablet or top) */}
      {isActivityPanelOpen && (
        <div
          className={`mb-4 p-4 rounded-2xl border transition-all ${
            theme.isLight
              ? 'bg-slate-50/90 border-slate-200 text-slate-800'
              : 'bg-[#0F172A] border-slate-800 text-slate-100'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono uppercase tracking-wider font-bold text-blue-600">
              AI Team Activity Pipeline
            </span>
            <button
              type="button"
              onClick={() => setIsActivityPanelOpen(false)}
              className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer font-medium"
            >
              Hide
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div
              className={`p-3 rounded-xl border flex items-start gap-2.5 ${
                theme.isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
              }`}
            >
              <CheckCircle2
                className={`w-4 h-4 mt-0.5 shrink-0 ${
                  agentStatus.preference === 'completed'
                    ? 'text-emerald-500'
                    : agentStatus.preference === 'active'
                    ? 'text-blue-500 animate-pulse'
                    : 'text-slate-400'
                }`}
              />
              <div>
                <div className="text-xs font-bold">01 Preference Agent</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  {preferences
                    ? `Understanding: ${preferences.productType} ≤ ₹${preferences.budget.toLocaleString(
                        'en-IN'
                      )}`
                    : 'Waiting for your shopping request'}
                </div>
              </div>
            </div>

            <div
              className={`p-3 rounded-xl border flex items-start gap-2.5 ${
                theme.isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
              }`}
            >
              <CheckCircle2
                className={`w-4 h-4 mt-0.5 shrink-0 ${
                  agentStatus.dealHunter === 'completed'
                    ? 'text-emerald-500'
                    : agentStatus.dealHunter === 'active'
                    ? 'text-blue-500 animate-pulse'
                    : 'text-slate-400'
                }`}
              />
              <div>
                <div className="text-xs font-bold">02 Deal Hunter</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  {searchResults.length > 0
                    ? `Searched 4 sources • Found ${searchResults.length} matches`
                    : 'Ready to search Amazon, Flipkart, Catalog & Local Stores'}
                </div>
              </div>
            </div>

            <div
              className={`p-3 rounded-xl border flex items-start gap-2.5 ${
                theme.isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
              }`}
            >
              <CheckCircle2
                className={`w-4 h-4 mt-0.5 shrink-0 ${
                  agentStatus.negotiator === 'completed'
                    ? 'text-emerald-500'
                    : agentStatus.negotiator === 'active'
                    ? 'text-blue-500 animate-pulse'
                    : 'text-slate-400'
                }`}
              />
              <div>
                <div className="text-xs font-bold">03 Negotiator</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  {searchResults.length > 0
                    ? `Analyzing ${
                        searchResults.filter((c) => c.eligibleForNegotiation).length
                      } eligible deals`
                    : 'Ready to negotiate bounded seller discounts'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Tab Switcher (Requirement #8 & #29: Mobile-responsive stacked tabs) */}
      <div
        className="flex lg:hidden items-center p-1 rounded-2xl mb-3 border shrink-0 transition-colors"
        style={{
          backgroundColor: 'var(--surface-elevated)',
          borderColor: 'var(--border)',
        }}
      >
        <button
          type="button"
          onClick={() => setMobileActiveTab('chat')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            mobileActiveTab === 'chat'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>💬 Chat</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileActiveTab('products')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            mobileActiveTab === 'products'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          {sessionState.mode === 'negotiation' ? (
            <>
              <Tag className="w-4 h-4" />
              <span>🏷️ Active Deal</span>
            </>
          ) : sessionState.mode === 'alternatives' ? (
            <>
              <Search className="w-4 h-4" />
              <span>
                🔄 Alternatives ({sessionState.alternativeCandidates.length || displayCandidates.length})
              </span>
            </>
          ) : (
            <>
              <ShoppingBag className="w-4 h-4" />
              <span>🛍 Products ({displayCandidates.length})</span>
            </>
          )}
        </button>
      </div>

      {/* TWO-PANE WORKSPACE (Requirement #1, #2, #3, #6, #8) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-[calc(100vh-140px)] min-h-[660px] items-stretch">
        {/* Left Pane: Conversation & AI Shopping Assistant */}
        <section
          className={`col-span-1 lg:col-span-7 flex flex-col rounded-3xl border overflow-hidden transition-all h-full ${
            mobileActiveTab === 'chat' ? 'flex' : 'hidden lg:flex'
          } ${
            theme.isLight
              ? 'bg-white border-slate-200 shadow-xs'
              : 'bg-[#0B101D] border-slate-800 shadow-xl'
          }`}
        >
          {/* 1. STARTING WELCOME SCREEN (When no product or query has been submitted yet) */}
          {isWelcomeState ? (
            <div className="p-6 sm:p-10 flex flex-col items-center text-center space-y-8">
              <div className="space-y-3 max-w-xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 text-xs font-mono font-bold uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>DEALMATE AI • YOUR AI SHOPPING TEAM</span>
                </div>

                <h2
                  className={`font-display font-bold text-2xl sm:text-3xl tracking-tight ${
                    theme.isLight ? 'text-slate-900' : 'text-white'
                  }`}
                >
                  Tell us what you're looking for.
                </h2>

                <p
                  className={`text-sm sm:text-base leading-relaxed ${
                    theme.isLight ? 'text-slate-600' : 'text-slate-300'
                  }`}
                >
                  Describe the product, your budget, and any preferences.
                  <br className="hidden sm:inline" /> You can type or speak naturally.
                </p>
              </div>

              {/* Welcome Voice + Text Input Bar */}
              <div className="w-full max-w-2xl space-y-3">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleUserSubmission(inputText, false);
                  }}
                  className={`flex items-center gap-2 p-2 rounded-2xl border shadow-sm transition-all ${
                    theme.isLight
                      ? 'bg-slate-50/90 border-slate-300 focus-within:border-blue-600 focus-within:bg-white'
                      : 'bg-[#090D17] border-slate-700 focus-within:border-cyan-400'
                  }`}
                >
                  <button
                    type="button"
                    onClick={handleToggleVoiceCapture}
                    className={`px-3.5 py-2.5 rounded-xl font-semibold text-xs flex items-center gap-2 shrink-0 cursor-pointer transition-all ${
                      voiceState === 'LISTENING'
                        ? 'bg-rose-600 text-white animate-pulse shadow-sm'
                        : voiceState === 'PROCESSING'
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-blue-600 hover:bg-blue-500 text-white shadow-xs'
                    }`}
                  >
                    {voiceState === 'LISTENING' ? (
                      <>
                        <MicOff className="w-4 h-4" />
                        <span>Listening...</span>
                      </>
                    ) : voiceState === 'PROCESSING' ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <Mic className="w-4 h-4" />
                        <span>Start Voice</span>
                      </>
                    )}
                  </button>

                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Type your request (e.g., 'Find me wireless earbuds under ₹2,500')..."
                    className={`flex-1 px-2 py-2 bg-transparent text-sm focus:outline-none ${
                      theme.isLight
                        ? 'text-slate-900 placeholder-slate-400'
                        : 'text-white placeholder-slate-400'
                    }`}
                  />

                  <button
                    type="submit"
                    disabled={!inputText.trim()}
                    className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white cursor-pointer transition-colors shrink-0"
                    aria-label="Submit request"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>

                {/* Animated Voice Waveform Banner when Listening */}
                {voiceState !== 'IDLE' && (
                  <div
                    className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                      voiceState === 'LISTENING'
                        ? 'bg-rose-500/10 border-rose-500/30 text-rose-600'
                        : 'bg-amber-500/10 border-amber-500/30 text-amber-600'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 text-xs font-medium">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                      <span>
                        {voiceState === 'LISTENING'
                          ? liveTranscriptPreview ||
                            'Listening... Speak your product, budget & preferred brands'
                          : 'Processing speech transcript into 3-agent pipeline...'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 h-4">
                      {[1, 2, 3, 4, 5].map((bar) => (
                        <span
                          key={bar}
                          className="w-1 bg-current rounded-full animate-bounce"
                          style={{
                            height: `${8 + (bar % 3) * 4}px`,
                            animationDelay: `${bar * 120}ms`,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Example Prompts */}
              <div className="w-full max-w-2xl space-y-2.5 text-left">
                <div
                  className="text-xs font-mono uppercase tracking-wider font-semibold text-center"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Example Prompts — Click to Start
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {WELCOME_EXAMPLE_PROMPTS.map((example) => (
                    <button
                      key={example}
                      type="button"
                      onClick={() => handleUserSubmission(example, false)}
                      className="p-4 rounded-2xl border text-left text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center justify-between gap-3 cursor-pointer group shadow-2xs hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
                      style={{
                        backgroundColor: 'var(--surface)',
                        borderColor: 'var(--border)',
                        color: 'var(--text-primary)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'var(--accent)';
                        e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--border)';
                        e.currentTarget.style.backgroundColor = 'var(--surface)';
                      }}
                    >
                      <span className="leading-snug flex-1" style={{ color: 'var(--text-primary)' }}>
                        "{example}"
                      </span>
                      <div
                        className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:translate-x-1"
                        style={{
                          backgroundColor: 'rgba(37, 99, 235, 0.12)',
                          color: 'var(--accent)',
                        }}
                      >
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* YOUR AI SHOPPING TEAM Diagram */}
              <div
                className="w-full max-w-2xl p-5 rounded-2xl border space-y-4 shadow-2xs"
                style={{
                  backgroundColor: 'var(--surface-elevated)',
                  borderColor: 'var(--border)',
                }}
              >
                <div className="text-xs font-mono uppercase tracking-wider font-bold" style={{ color: 'var(--accent)' }}>
                  Your AI Shopping Team
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                  <div
                    className="p-3.5 rounded-xl border text-left shadow-2xs"
                    style={{
                      backgroundColor: 'var(--surface)',
                      borderColor: 'var(--border)',
                    }}
                  >
                    <div className="text-[11px] font-mono font-bold" style={{ color: 'var(--accent)' }}>
                      ◉ 01 Preference AI
                    </div>
                    <div
                      className="text-xs font-semibold mt-1"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      Understands what you want
                    </div>
                    <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      Extracts category, budget, brands & key specs
                    </p>
                  </div>

                  <div
                    className="p-3.5 rounded-xl border text-left shadow-2xs"
                    style={{
                      backgroundColor: 'var(--surface)',
                      borderColor: 'var(--border)',
                    }}
                  >
                    <div className="text-[11px] font-mono font-bold" style={{ color: 'var(--accent)' }}>
                      ◉ 02 Deal Hunter AI
                    </div>
                    <div
                      className="text-xs font-semibold mt-1"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      Finds matching products
                    </div>
                    <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      Scans Amazon, Flipkart, Catalog & Local Stores
                    </p>
                  </div>

                  <div
                    className="p-3.5 rounded-xl border text-left shadow-2xs"
                    style={{
                      backgroundColor: 'var(--surface)',
                      borderColor: 'var(--border)',
                    }}
                  >
                    <div className="text-[11px] font-mono font-bold" style={{ color: 'var(--accent)' }}>
                      ◉ 03 Negotiator AI
                    </div>
                    <div
                      className="text-xs font-semibold mt-1"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      Searches for better deals
                    </div>
                    <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      Runs Buyer AI ↔ Seller AI price bargaining
                    </p>
                  </div>
                </div>
              </div>

              {/* Popular Requests Pills */}
              <div className="space-y-2">
                <div
                  className="text-xs font-mono uppercase tracking-wider font-semibold"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Popular Requests
                </div>
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  {POPULAR_CATEGORY_REQUESTS.map((cat) => {
                    const IconComponent = cat.icon;
                    return (
                      <button
                        key={cat.label}
                        type="button"
                        onClick={() => handleUserSubmission(cat.prompt, false)}
                        className="px-3.5 py-2 rounded-xl border text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all duration-150 shadow-2xs hover:shadow-xs hover:-translate-y-0.5"
                        style={{
                          backgroundColor: 'var(--surface)',
                          borderColor: 'var(--border)',
                          color: 'var(--text-primary)',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = 'var(--accent)';
                          e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = 'var(--border)';
                          e.currentTarget.style.backgroundColor = 'var(--surface)';
                        }}
                      >
                        <IconComponent className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
                        <span style={{ color: 'var(--text-primary)' }}>{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* 2. ACTIVE CONVERSATIONAL STREAM */
            <div className="flex flex-col h-full min-h-[580px]">
              <div className="flex-1 p-4 sm:p-6 space-y-5 overflow-y-auto max-h-[740px]">
                {conversationHistory.map((msg) => (
                  <div key={msg.id} className="space-y-3">
                    {msg.role === 'user' ? (
                      /* USER BUBBLE */
                      <div className="flex justify-end">
                        <div className="max-w-xl rounded-2xl rounded-br-xs bg-blue-600 text-white px-4 py-3 shadow-xs space-y-1">
                          <div className="flex items-center justify-end gap-2 text-[10px] font-mono opacity-80">
                            {msg.isVoiceTranscript && (
                              <span className="px-1.5 py-0.5 rounded bg-white/20 font-semibold">
                                🎙 Voice Transcript
                              </span>
                            )}
                            <span>YOU • {msg.timestamp}</span>
                          </div>
                          <p className="text-sm leading-relaxed">{msg.text}</p>
                        </div>
                      </div>
                    ) : (
                      /* DEALMATE AI + SUB-AGENT BUBBLE */
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-xl bg-blue-600/10 border border-blue-500/30 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                          <Bot className="w-4 h-4" />
                        </div>

                        <div className="flex-1 min-w-0 space-y-3">
                          <div
                            className={`rounded-2xl rounded-tl-xs border p-4 space-y-3 ${
                              theme.isLight
                                ? 'bg-slate-50/90 border-slate-200/90 text-slate-800'
                                : 'bg-[#111829] border-slate-800 text-slate-100'
                            }`}
                          >
                            {/* Unified DealMate AI -> Sub-Agent Label + TTS Play Button */}
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <div className="flex items-center gap-1.5 text-xs font-mono">
                                <span className="font-bold text-blue-600">DealMate AI</span>
                                {msg.agentLabel && (
                                  <span
                                    className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                                      msg.agentLabel === 'Preference Agent'
                                        ? 'bg-indigo-500/10 text-indigo-600 border border-indigo-500/20'
                                        : msg.agentLabel === 'Deal Hunter'
                                        ? 'bg-cyan-500/10 text-cyan-600 border border-cyan-500/20'
                                        : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                                    }`}
                                  >
                                    ↳ {msg.agentLabel}
                                  </span>
                                )}
                                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{msg.timestamp}</span>
                              </div>

                              {voiceEnabled && (
                                <button
                                  type="button"
                                  onClick={() => handlePlaySpeech(msg.id, msg.text)}
                                  className={`px-2 py-1 rounded-lg text-[11px] font-mono flex items-center gap-1 cursor-pointer transition-colors ${
                                    isSpeakingId === msg.id
                                      ? 'bg-blue-600 text-white'
                                      : theme.isLight
                                      ? 'hover:bg-slate-200/70 text-slate-500'
                                      : 'hover:bg-slate-800 text-slate-400'
                                  }`}
                                >
                                  {isSpeakingId === msg.id ? (
                                    <>
                                      <VolumeX className="w-3 h-3" />
                                      <span>Stop</span>
                                    </>
                                  ) : (
                                    <>
                                      <Volume2 className="w-3 h-3" />
                                      <span>Play response</span>
                                    </>
                                  )}
                                </button>
                              )}
                            </div>

                            {/* Message Text */}
                            <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-line">
                              {msg.text}
                            </p>

                            {/* Preference Agent Extracted Checkmarks */}
                            {msg.bulletPoints && msg.bulletPoints.length > 0 && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                                {msg.bulletPoints.map((b, i) => (
                                  <div
                                    key={i}
                                    className={`px-2.5 py-1.5 rounded-xl border text-xs flex items-center gap-2 ${
                                      theme.isLight
                                        ? 'bg-white border-slate-200/80 text-slate-700'
                                        : 'bg-slate-900/80 border-slate-800 text-slate-200'
                                    }`}
                                  >
                                    <span className="text-emerald-500 font-bold">✓</span>
                                    <span>{b}</span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Deal Hunter Live Source Status Bar */}
                            {msg.dealHunterSources && (
                              <div
                                className={`p-3 rounded-xl border space-y-2 ${
                                  theme.isLight
                                    ? 'bg-white border-slate-200'
                                    : 'bg-slate-900/90 border-slate-800'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-2 flex-wrap">
                                  <span className="text-[11px] font-mono font-bold text-blue-600 flex items-center gap-1.5">
                                    <Search className="w-3.5 h-3.5" />
                                    <span>
                                      Deal Hunter • Checked DealMate Catalog, Shop Owners & External Retailers
                                    </span>
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                  {msg.dealHunterSources.map((src) => (
                                    <div
                                      key={src.name}
                                      className={`px-2.5 py-1.5 rounded-lg border text-xs font-mono flex items-center justify-between ${
                                        theme.isLight
                                          ? 'bg-slate-50 border-slate-200/80 text-slate-700'
                                          : 'bg-slate-950 border-slate-800 text-slate-300'
                                      }`}
                                    >
                                      <span className="truncate">{src.name}</span>
                                      <span className="text-emerald-600 font-bold shrink-0 ml-1">
                                        {src.matchesCount} ✓
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* SEARCH RESULT SUMMARY & BROADEN YOUR SEARCH / EXPANDED SEARCH PANEL */}
                            {msg.expandedSearchSummary && (
                              <div
                                className={`p-3.5 rounded-2xl border space-y-3 ${
                                  msg.expandedSearchSummary.isExpandedSearch
                                    ? theme.isLight
                                      ? 'bg-amber-50/70 border-amber-200 text-slate-800'
                                      : 'bg-amber-950/20 border-amber-500/30 text-slate-100'
                                    : theme.isLight
                                    ? 'bg-white border-slate-200 text-slate-800'
                                    : 'bg-slate-900 border-slate-800 text-slate-100'
                                }`}
                              >
                                {/* Requirement #15: Transparent Search Result Summary */}
                                <div className="flex items-center justify-between gap-2 flex-wrap">
                                  <div className="flex items-center gap-2">
                                    <AlertCircle
                                      className={`w-4 h-4 shrink-0 ${
                                        msg.expandedSearchSummary.isExpandedSearch
                                          ? 'text-amber-600'
                                          : 'text-emerald-600'
                                      }`}
                                    />
                                    <span className="text-xs font-bold">
                                      {msg.expandedSearchSummary.fallbackSearchTriggered
                                        ? `Fallback Search Active — 0 Internal DB Exact Matches Under ₹${msg.expandedSearchSummary.userBudget.toLocaleString(
                                            'en-IN'
                                          )} (External Product Feeds Queried)`
                                        : msg.expandedSearchSummary.isExpandedSearch
                                        ? `Broaden Your Search Mode — 0 Exact Matches Under ₹${msg.expandedSearchSummary.userBudget.toLocaleString(
                                            'en-IN'
                                          )}`
                                        : `Verified Search Summary (Budget ≤ ₹${msg.expandedSearchSummary.userBudget.toLocaleString(
                                            'en-IN'
                                          )})`}
                                    </span>
                                  </div>
                                  <span className="text-[11px] text-slate-500">
                                    Prices may change on the retailer's website.
                                  </span>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                                  <div
                                    className={`p-2 rounded-xl border ${
                                      theme.isLight
                                        ? 'bg-white border-slate-200/80'
                                        : 'bg-slate-950 border-slate-800'
                                    }`}
                                  >
                                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">Exact Matches</div>
                                    <div className="font-mono font-bold text-sm">
                                      Found {msg.expandedSearchSummary.exactMatchesCount} under ₹
                                      {msg.expandedSearchSummary.userBudget.toLocaleString('en-IN')}
                                    </div>
                                  </div>
                                  <div
                                    className={`p-2 rounded-xl border ${
                                      theme.isLight
                                        ? 'bg-white border-slate-200/80'
                                        : 'bg-slate-950 border-slate-800'
                                    }`}
                                  >
                                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
                                      Close Alternatives
                                    </div>
                                    <div className="font-mono font-bold text-sm text-blue-600">
                                      Found {msg.expandedSearchSummary.closeAlternativesCount}{' '}
                                      options
                                    </div>
                                  </div>
                                  <div
                                    className={`p-2 rounded-xl border ${
                                      theme.isLight
                                        ? 'bg-white border-slate-200/80'
                                        : 'bg-slate-950 border-slate-800'
                                    }`}
                                  >
                                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
                                      DealMate Stores
                                    </div>
                                    <div className="font-mono font-bold text-sm text-emerald-600">
                                      {msg.expandedSearchSummary.dealMateStoreCount} available
                                    </div>
                                  </div>
                                  <div
                                    className={`p-2 rounded-xl border ${
                                      theme.isLight
                                        ? 'bg-white border-slate-200/80'
                                        : 'bg-slate-950 border-slate-800'
                                    }`}
                                  >
                                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
                                      External Retailers
                                    </div>
                                    <div className="font-mono font-bold text-sm">
                                      {msg.expandedSearchSummary.externalRetailerCount} from external
                                    </div>
                                  </div>
                                </div>

                                {/* Close Alternatives Quick Comparison Table (Product | Price | Match | Source | Action) */}
                                {msg.productCandidates && msg.productCandidates.length > 0 && (
                                  <div
                                    className={`rounded-xl border overflow-x-auto ${
                                      theme.isLight
                                        ? 'bg-white border-slate-200'
                                        : 'bg-slate-950 border-slate-800'
                                    }`}
                                  >
                                    <table className="w-full text-left border-collapse text-xs">
                                      <thead>
                                        <tr
                                          className={`border-b text-[11px] font-mono ${
                                            theme.isLight
                                              ? 'bg-slate-50 border-slate-200 text-slate-500'
                                              : 'bg-slate-900 border-slate-800 text-slate-400'
                                          }`}
                                        >
                                          <th className="py-2 px-3">Product</th>
                                          <th className="py-2 px-3 text-right">Price</th>
                                          <th className="py-2 px-3">Match</th>
                                          <th className="py-2 px-3">Source</th>
                                          <th className="py-2 px-3 text-right">Action</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-200/50">
                                        {msg.productCandidates.slice(0, 4).map((cand) => {
                                          const isExternal =
                                            cand.listingOrigin === 'EXTERNAL_RETAILER';
                                          return (
                                            <tr key={cand.product.id}>
                                              <td className="py-2 px-3 font-medium">
                                                <div className="truncate max-w-[180px] sm:max-w-[220px]">
                                                  {cand.product.name}
                                                </div>
                                                {cand.aboveBudgetAmount > 0 && (
                                                  <span className="text-[10px] font-mono text-amber-600">
                                                    ₹{cand.aboveBudgetAmount.toLocaleString('en-IN')}{' '}
                                                    above budget
                                                  </span>
                                                )}
                                              </td>
                                              <td className="py-2 px-3 text-right font-mono font-bold tabular-nums">
                                                ₹{cand.product.listPrice.toLocaleString('en-IN')}
                                              </td>
                                              <td className="py-2 px-3 font-mono tabular-nums text-emerald-600 font-semibold">
                                                {cand.matchScorePct}%
                                              </td>
                                              <td className="py-2 px-3 text-[11px] text-slate-500">
                                                {isExternal ? (
                                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-200/70 text-slate-800 font-mono font-semibold text-[10px]">
                                                    Retailer •{' '}
                                                    {cand.product.marketplaceSource ||
                                                      'Online Feed'}
                                                  </span>
                                                ) : (
                                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 font-mono font-semibold text-[10px]">
                                                    DealMate Store
                                                  </span>
                                                )}
                                              </td>
                                              <td className="py-2 px-3 text-right">
                                                {isExternal || !cand.eligibleForNegotiation ? (
                                                  <a
                                                    href={cand.retailerUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    onClick={() =>
                                                      handleExternalRedirectNotice(
                                                        cand.retailerName,
                                                        cand.product.name
                                                      )
                                                    }
                                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-semibold"
                                                  >
                                                    <span>View Product</span>
                                                    <ExternalLink className="w-3 h-3" />
                                                  </a>
                                                ) : (
                                                  <button
                                                    type="button"
                                                    onClick={() =>
                                                      startInlineProductNegotiation(
                                                        cand.product,
                                                        cand.negotiationTarget
                                                      )
                                                    }
                                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-semibold cursor-pointer"
                                                  >
                                                    <Zap className="w-3 h-3" />
                                                    <span>Negotiate</span>
                                                  </button>
                                                )}
                                              </td>
                                            </tr>
                                          );
                                        })}
                                      </tbody>
                                    </table>
                                  </div>
                                )}

                                {/* Multi-Retailer Equivalent Product Price Comparison */}
                                {msg.expandedSearchSummary.multiRetailerComparisons.length > 0 && (
                                  <div
                                    className={`p-3 rounded-xl border space-y-2 ${
                                      theme.isLight
                                        ? 'bg-white border-slate-200'
                                        : 'bg-slate-950 border-slate-800'
                                    }`}
                                  >
                                    {msg.expandedSearchSummary.multiRetailerComparisons.map(
                                      (group, gIdx) => (
                                        <div key={gIdx} className="space-y-2">
                                          <div className="flex items-center justify-between gap-2 flex-wrap">
                                            <div>
                                              <span className="text-xs font-bold">
                                                Multi-Retailer Price Comparison: {group.modelName}
                                              </span>
                                              <span className="text-[11px] text-slate-500 dark:text-slate-400 ml-2 font-medium">
                                                ({group.variantSpec})
                                              </span>
                                            </div>
                                            <span className="text-[11px] font-mono text-emerald-600 font-semibold">
                                              Lowest price found across searched sources: ₹
                                              {group.lowestPrice.toLocaleString('en-IN')} (
                                              {group.lowestSource})
                                            </span>
                                          </div>
                                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                            {group.offers.map((offer, oIdx) => (
                                              <div
                                                key={oIdx}
                                                className={`p-2 rounded-lg border text-xs flex flex-col justify-between gap-1 ${
                                                  offer.isLowest
                                                    ? theme.isLight
                                                      ? 'bg-emerald-50/70 border-emerald-300'
                                                      : 'bg-emerald-950/30 border-emerald-700'
                                                    : theme.isLight
                                                    ? 'bg-slate-50 border-slate-200'
                                                    : 'bg-slate-900 border-slate-800'
                                                }`}
                                              >
                                                <div className="font-medium truncate">
                                                  {offer.retailer}
                                                </div>
                                                <div className="font-mono font-bold tabular-nums text-sm">
                                                  ₹{offer.price.toLocaleString('en-IN')}
                                                </div>
                                                <div className="text-[10px] text-slate-500">
                                                  {offer.isNegotiable
                                                    ? 'Potentially negotiable'
                                                    : offer.isLowest
                                                    ? 'Lowest verified price'
                                                    : 'External retailer'}
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )
                                    )}
                                  </div>
                                )}

                                {/* Requirement #9: User-Controlled Budget Expansion (Only when user approves!) */}
                                {msg.expandedSearchSummary.isExpandedSearch && (
                                  <div
                                    className={`p-3 rounded-xl border space-y-2 ${
                                      theme.isLight
                                        ? 'bg-white border-amber-200'
                                        : 'bg-slate-950 border-slate-800'
                                    }`}
                                  >
                                    <div className="text-xs font-semibold">
                                      No exact matches found under ₹
                                      {msg.expandedSearchSummary.userBudget.toLocaleString('en-IN')}
                                      . Would you like me to expand the budget?
                                    </div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      {msg.expandedSearchSummary.suggestedBudgetExpansions.map(
                                        (newBudget) => {
                                          const diff =
                                            newBudget - msg.expandedSearchSummary!.userBudget;
                                          return (
                                            <button
                                              key={newBudget}
                                              type="button"
                                              onClick={() =>
                                                handleUserSubmission(
                                                  `Show me anything under ₹${newBudget}`,
                                                  false
                                                )
                                              }
                                              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold cursor-pointer transition-colors"
                                            >
                                              Search up to ₹{newBudget.toLocaleString('en-IN')} (+₹
                                              {diff.toLocaleString('en-IN')})
                                            </button>
                                          );
                                        }
                                      )}

                                      <button
                                        type="button"
                                        onClick={() =>
                                          setCustomBudgetMsgId(
                                            customBudgetMsgId === msg.id ? null : msg.id
                                          )
                                        }
                                        className={`px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer ${
                                          theme.isLight
                                            ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                                            : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-200'
                                        }`}
                                      >
                                        Set New Budget
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleUserSubmission(
                                            `Keep ₹${msg.expandedSearchSummary!.userBudget} and show similar alternatives`,
                                            false
                                          )
                                        }
                                        className={`px-3 py-1.5 rounded-xl border text-xs font-medium cursor-pointer ${
                                          theme.isLight
                                            ? 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600'
                                            : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-400'
                                        }`}
                                      >
                                        Keep ₹
                                        {msg.expandedSearchSummary.userBudget.toLocaleString(
                                          'en-IN'
                                        )}
                                      </button>
                                    </div>

                                    {customBudgetMsgId === msg.id && (
                                      <form
                                        onSubmit={(e) => {
                                          e.preventDefault();
                                          if (customBudgetInput.trim()) {
                                            handleUserSubmission(
                                              `Show me anything under ₹${customBudgetInput.trim()}`,
                                              false
                                            );
                                            setCustomBudgetMsgId(null);
                                            setCustomBudgetInput('');
                                          }
                                        }}
                                        className="flex items-center gap-2 pt-1"
                                      >
                                        <input
                                          type="number"
                                          min={500}
                                          step={100}
                                          value={customBudgetInput}
                                          onChange={(e) => setCustomBudgetInput(e.target.value)}
                                          placeholder="Enter new budget in ₹ (e.g. 2500)"
                                          className={`px-3 py-1.5 rounded-xl border text-xs w-52 ${
                                            theme.isLight
                                              ? 'bg-white border-slate-300 text-slate-900'
                                              : 'bg-slate-900 border-slate-700 text-white'
                                          }`}
                                        />
                                        <button
                                          type="submit"
                                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold cursor-pointer"
                                        >
                                          Apply Budget
                                        </button>
                                      </form>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* External Product Negotiation Fallback Card (When user asks "Can you negotiate it?" on an external listing) */}
                            {msg.externalNegotiationFallback && (
                              <div
                                className={`p-3.5 rounded-2xl border space-y-3 ${
                                  theme.isLight
                                    ? 'bg-white border-slate-200'
                                    : 'bg-slate-900 border-slate-800'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-2 flex-wrap">
                                  <span className="text-xs font-bold text-amber-600">
                                    External Retailer Listing — Discovery & Redirect Only
                                  </span>
                                  <a
                                    href={msg.externalNegotiationFallback.externalUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={() =>
                                      handleExternalRedirectNotice(
                                        msg.externalNegotiationFallback!.externalRetailer,
                                        msg.externalNegotiationFallback!.externalProductName
                                      )
                                    }
                                    className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold inline-flex items-center gap-1.5"
                                  >
                                    <span>
                                      View on {msg.externalNegotiationFallback.externalRetailer}
                                    </span>
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </a>
                                </div>

                                {msg.externalNegotiationFallback.negotiableAlternatives.length >
                                  0 && (
                                  <div className="space-y-2 pt-2 border-t border-slate-200/50">
                                    <div className="text-xs font-semibold">
                                      Negotiable DealMate Store Alternatives:
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                      {msg.externalNegotiationFallback.negotiableAlternatives.map(
                                        (alt) => (
                                          <div
                                            key={alt.product.id}
                                            className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 ${
                                              theme.isLight
                                                ? 'bg-slate-50 border-slate-200'
                                                : 'bg-slate-950 border-slate-800'
                                            }`}
                                          >
                                            <div className="min-w-0">
                                              <div className="text-xs font-bold truncate">
                                                {alt.product.name}
                                              </div>
                                              <div className="text-[11px] font-mono text-emerald-600">
                                                ₹{alt.product.listPrice.toLocaleString('en-IN')} →
                                                Target ₹
                                                {alt.negotiationTarget.toLocaleString('en-IN')}
                                              </div>
                                            </div>
                                            <button
                                              type="button"
                                              onClick={() =>
                                                startInlineProductNegotiation(
                                                  alt.product,
                                                  alt.negotiationTarget
                                                )
                                              }
                                              className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-semibold shrink-0 cursor-pointer"
                                            >
                                              Negotiate
                                            </button>
                                          </div>
                                        )
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Negotiator Agent Summary List */}
                            {msg.negotiatorCandidates && msg.negotiatorCandidates.length > 0 && (
                              <div className="space-y-2.5 pt-1">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  {msg.negotiatorCandidates.map((nc) => (
                                    <div
                                      key={nc.productId}
                                      className={`p-3 rounded-xl border flex items-center justify-between gap-2 ${
                                        theme.isLight
                                          ? 'bg-white border-slate-200'
                                          : 'bg-slate-900 border-slate-800'
                                      }`}
                                    >
                                      <div className="min-w-0">
                                        <div className="text-xs font-bold truncate">
                                          {nc.productName}
                                        </div>
                                        <div className="text-[11px] font-mono mt-0.5 flex items-center gap-1.5">
                                          <span className="text-slate-500 dark:text-slate-400 line-through">
                                            ₹{nc.currentPrice.toLocaleString('en-IN')}
                                          </span>
                                          <span>→</span>
                                          <span className="text-emerald-600 font-bold">
                                            Target ₹{nc.negotiationTarget.toLocaleString('en-IN')}
                                          </span>
                                        </div>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const found = searchResults.find(
                                            (c) => c.product.id === nc.productId
                                          )?.product;
                                          if (found) {
                                            startInlineProductNegotiation(
                                              found,
                                              nc.negotiationTarget
                                            );
                                          }
                                        }}
                                        className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-semibold shrink-0 cursor-pointer"
                                      >
                                        Negotiate
                                      </button>
                                    </div>
                                  ))}
                                </div>

                                <div
                                  className={`px-3 py-2 rounded-xl border text-[11px] font-mono flex items-center justify-between flex-wrap gap-2 ${
                                    theme.isLight
                                      ? 'bg-blue-50/60 border-blue-200 text-blue-800'
                                      : 'bg-blue-950/30 border-blue-800/50 text-blue-300'
                                  }`}
                                >
                                  <span>
                                    Pipeline Ready: Buyer Agent ↕ Negotiator AI ↕ Seller / Merchant
                                    Agent
                                  </span>
                                  <span className="text-[10px] opacity-80">
                                    Never exceeds verified seller floor
                                  </span>
                                </div>
                              </div>
                            )}

                            {/* Side-by-Side Comparison Card inside Chat */}
                            {msg.comparisonPair && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                {msg.comparisonPair.map((prod) => (
                                  <div
                                    key={prod.id}
                                    className={`p-3.5 rounded-xl border space-y-2 ${
                                      theme.isLight
                                        ? 'bg-white border-slate-200'
                                        : 'bg-slate-900 border-slate-800'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2.5">
                                      <img
                                        src={prod.image}
                                        alt={prod.name}
                                        className="w-12 h-12 rounded-lg object-cover shrink-0"
                                      />
                                      <div className="min-w-0">
                                        <div className="text-xs font-bold truncate">
                                          {prod.name}
                                        </div>
                                        <div className="text-xs font-mono font-bold text-blue-600">
                                          ₹{prod.listPrice.toLocaleString('en-IN')}
                                        </div>
                                      </div>
                                    </div>
                                    <p className="text-[11px] text-slate-500 line-clamp-2">
                                      {prod.description}
                                    </p>
                                    <button
                                      type="button"
                                      onClick={() => startInlineProductNegotiation(prod)}
                                      className="w-full py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold cursor-pointer"
                                    >
                                      Negotiate This Deal
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Compact Inline Negotiation Workspace Card inside Conversation */}
                            {msg.negotiationWorkspace && (
                              <div
                                className={`p-4 rounded-2xl border space-y-3 ${
                                  theme.isLight
                                    ? 'bg-white border-blue-200 shadow-xs'
                                    : 'bg-[#0A0F1D] border-cyan-500/40'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-3 flex-wrap">
                                  <div className="flex items-center gap-3">
                                    <img
                                      src={msg.negotiationWorkspace.product.image}
                                      alt={msg.negotiationWorkspace.product.name}
                                      className="w-12 h-12 rounded-xl object-cover border border-slate-200/40 shrink-0"
                                    />
                                    <div>
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <h4 className="font-display font-bold text-sm">
                                          {msg.negotiationWorkspace.product.name}
                                        </h4>
                                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/10 text-amber-600 border border-amber-500/20">
                                          {msg.negotiationWorkspace.isSimulatedDemo
                                            ? 'Simulated Demo Negotiation'
                                            : 'Verified Store Floor'}
                                        </span>
                                      </div>
                                      <p className="text-xs text-slate-500">
                                        Seller: {msg.negotiationWorkspace.product.sellerName}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="text-right font-mono">
                                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                                      Current Price: ₹
                                      {msg.negotiationWorkspace.currentPrice.toLocaleString('en-IN')}
                                    </div>
                                    <div className="text-xs font-bold text-blue-600">
                                      Target: ₹
                                      {msg.negotiationWorkspace.targetPrice.toLocaleString('en-IN')}
                                    </div>
                                  </div>
                                </div>

                                {/* Buyer AI <-> Seller AI Status */}
                                <div
                                  className={`px-3 py-2 rounded-xl border text-xs font-mono flex items-center justify-between ${
                                    theme.isLight
                                      ? 'bg-slate-50 border-slate-200 text-slate-700'
                                      : 'bg-slate-900 border-slate-800 text-slate-300'
                                  }`}
                                >
                                  <span>Buyer AI ↔ Seller AI</span>
                                  {msg.negotiationWorkspace.status === 'NEGOTIATING' ? (
                                    <span className="text-blue-600 font-bold flex items-center gap-1.5">
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                      <span>Negotiating...</span>
                                    </span>
                                  ) : (
                                    <span className="text-emerald-600 font-bold">
                                      ✓ Negotiation Complete
                                    </span>
                                  )}
                                </div>

                                {/* Exchange Turns */}
                                {msg.negotiationWorkspace.turns.length > 0 && (
                                  <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                                    {msg.negotiationWorkspace.turns.map((t, idx) => (
                                      <div
                                        key={idx}
                                        className={`px-3 py-2 rounded-xl text-xs flex items-start justify-between gap-2 ${
                                          t.speaker === 'BUYER_AGENT'
                                            ? theme.isLight
                                              ? 'bg-blue-50/70 text-slate-800'
                                              : 'bg-blue-950/30 text-slate-200'
                                            : theme.isLight
                                            ? 'bg-emerald-50/70 text-slate-800'
                                            : 'bg-emerald-950/30 text-slate-200'
                                        }`}
                                      >
                                        <span>{t.message}</span>
                                        <span className="font-mono font-bold shrink-0">
                                          ₹{t.price.toLocaleString('en-IN')}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* Completed Summary & Action Buttons */}
                                {msg.negotiationWorkspace.status === 'COMPLETED' && (
                                  <div className="pt-2 border-t border-slate-200/60 space-y-3">
                                    <div className="grid grid-cols-3 gap-2 text-center">
                                      <div
                                        className={`p-2 rounded-xl border ${
                                          theme.isLight
                                            ? 'bg-slate-50 border-slate-200'
                                            : 'bg-slate-900 border-slate-800'
                                        }`}
                                      >
                                        <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 font-semibold">
                                          Original
                                        </div>
                                        <div className="text-xs font-mono font-bold line-through text-slate-500">
                                          ₹
                                          {msg.negotiationWorkspace.currentPrice.toLocaleString(
                                            'en-IN'
                                          )}
                                        </div>
                                      </div>

                                      <div
                                        className={`p-2 rounded-xl border ${
                                          theme.isLight
                                            ? 'bg-emerald-50 border-emerald-200'
                                            : 'bg-emerald-950/30 border-emerald-800/50'
                                        }`}
                                      >
                                        <div className="text-[10px] font-mono text-emerald-600">
                                          Negotiated
                                        </div>
                                        <div className="text-sm font-mono font-bold text-emerald-600">
                                          ₹
                                          {msg.negotiationWorkspace.settledPrice.toLocaleString(
                                            'en-IN'
                                          )}
                                        </div>
                                      </div>

                                      <div
                                        className={`p-2 rounded-xl border ${
                                          theme.isLight
                                            ? 'bg-blue-50 border-blue-200'
                                            : 'bg-blue-950/30 border-blue-800/50'
                                        }`}
                                      >
                                        <div className="text-[10px] font-mono text-blue-600">
                                          Savings
                                        </div>
                                        <div className="text-xs font-mono font-bold text-blue-600">
                                          ₹
                                          {msg.negotiationWorkspace.savings.toLocaleString('en-IN')}
                                        </div>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-2 flex-wrap">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (onAcceptDealCheckout && msg.negotiationWorkspace) {
                                            onAcceptDealCheckout(
                                              msg.negotiationWorkspace.product,
                                              msg.negotiationWorkspace.settledPrice
                                            );
                                          }
                                        }}
                                        className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                                      >
                                        <ShieldCheck className="w-4 h-4" />
                                        <span>Accept Deal</span>
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (msg.negotiationWorkspace) {
                                            const lowerTarget = Math.max(
                                              msg.negotiationWorkspace.floorPrice,
                                              msg.negotiationWorkspace.settledPrice - 150
                                            );
                                            startInlineProductNegotiation(
                                              msg.negotiationWorkspace.product,
                                              lowerTarget
                                            );
                                          }
                                        }}
                                        className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${
                                          theme.isLight
                                            ? 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                                            : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-200'
                                        }`}
                                      >
                                        <RotateCcw className="w-3.5 h-3.5" />
                                        <span>Try Again</span>
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleUserSubmission('Find something cheaper', false)
                                        }
                                        className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${
                                          theme.isLight
                                            ? 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                                            : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-200'
                                        }`}
                                      >
                                        <Search className="w-3.5 h-3.5" />
                                        <span>Find Alternatives</span>
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Search Results Summary Banner (Product cards live in dedicated ProductResultsPanel) */}
                          {msg.productCandidates && msg.productCandidates.length > 0 && (
                            <div
                              className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
                                theme.isLight
                                  ? 'bg-blue-50/70 border-blue-200/80 text-slate-800'
                                  : 'bg-blue-950/30 border-blue-800/60 text-slate-200'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                                  <ShoppingBag className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                  <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <span>{msg.productCandidates.length} Product Matches Discovered</span>
                                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200">
                                      Live Feeds
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-600 dark:text-slate-400 truncate mt-0.5">
                                    Browse, compare specifications, and negotiate prices in the Products panel.
                                  </p>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => setMobileActiveTab('products')}
                                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shrink-0 cursor-pointer lg:hidden"
                              >
                                View Products →
                              </button>
                            </div>
                          )}

                          {/* Product Mention Micro-Pills (highlights product in Right Pane) */}
                          {msg.mentionedProductIds && msg.mentionedProductIds.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1.5 pt-1.5">
                              <span className={`text-[11px] font-semibold mr-0.5 ${theme.isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                                Mentioned:
                              </span>
                              {msg.mentionedProductIds.map((pid) => {
                                const prod = displayCandidates.find((c) => c.product.id === pid)?.product;
                                if (!prod) return null;
                                return (
                                  <button
                                    key={pid}
                                    type="button"
                                    onClick={() => {
                                      setHighlightedProductId(pid);
                                      setSelectedProduct(prod);
                                      if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                                        setMobileActiveTab('products');
                                      }
                                      const elem = document.getElementById(`product-card-${pid}`);
                                      elem?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                                    }}
                                    className={`px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all border ${
                                      highlightedProductId === pid
                                        ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                                        : theme.isLight
                                        ? 'bg-blue-50/80 hover:bg-blue-100 border-blue-200 text-blue-900'
                                        : 'bg-blue-950/40 hover:bg-blue-900/60 border-blue-800 text-blue-200'
                                    }`}
                                    title="Highlight in Products Panel"
                                  >
                                    <img src={prod.image} alt={prod.name} className="w-3.5 h-3.5 rounded object-cover" />
                                    <span className="truncate max-w-[130px]">{prod.name}</span>
                                    <span className="font-mono text-[10px] opacity-80">₹{prod.listPrice.toLocaleString('en-IN')}</span>
                                  </button>
                                );
                              })}
                            </div>
                          )}

                          {/* Inline Comparison Pair Card if generated by Conversational AI */}
                          {msg.comparisonPair && msg.comparisonPair.length === 2 && (
                            <div
                              className={`p-3 rounded-2xl border space-y-2.5 my-1.5 ${
                                theme.isLight
                                  ? 'bg-slate-50 border-slate-200 text-slate-800'
                                  : 'bg-slate-900/80 border-slate-800 text-slate-200'
                              }`}
                            >
                              <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white">
                                <span className="flex items-center gap-1.5">
                                  <Layers className="w-3.5 h-3.5 text-blue-600" />
                                  <span>Comparison: {msg.comparisonPair[0].name.split(' ').slice(0, 2).join(' ')} vs {msg.comparisonPair[1].name.split(' ').slice(0, 2).join(' ')}</span>
                                </span>
                                {onOpenCompareModal && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (onCompareToggle) {
                                        onCompareToggle(msg.comparisonPair![0]);
                                        onCompareToggle(msg.comparisonPair![1]);
                                      }
                                      onOpenCompareModal();
                                    }}
                                    className="text-[11px] text-blue-600 font-semibold hover:underline cursor-pointer"
                                  >
                                    Full Comparison Table →
                                  </button>
                                )}
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-[11px]">
                                {msg.comparisonPair.map((cp) => (
                                  <div
                                    key={cp.id}
                                    onClick={() => {
                                      setHighlightedProductId(cp.id);
                                      setSelectedProduct(cp);
                                    }}
                                    className={`p-2 rounded-xl border cursor-pointer transition-all ${
                                      highlightedProductId === cp.id
                                        ? 'bg-blue-100/60 dark:bg-blue-900/40 border-blue-400'
                                        : theme.isLight
                                        ? 'bg-white border-slate-200'
                                        : 'bg-slate-950 border-slate-800'
                                    }`}
                                  >
                                    <div className="font-bold truncate text-slate-900 dark:text-white">{cp.name}</div>
                                    <div className="font-mono text-blue-600 font-bold mt-0.5">₹{cp.listPrice.toLocaleString('en-IN')}</div>
                                    <div className="text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">{cp.description}</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Actionable Suggested Action Pills */}
                          {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1.5 pt-2">
                              <span className={`text-[11px] font-semibold mr-1 ${theme.isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                                Suggested:
                              </span>
                              {msg.suggestedActions.map((act, aIdx) => (
                                <button
                                  key={aIdx}
                                  type="button"
                                  onClick={() => handleSuggestedAction(act)}
                                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all ${
                                    act.type === 'START_NEGOTIATION'
                                      ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-xs'
                                      : theme.isLight
                                      ? 'bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-slate-800'
                                      : 'bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-100'
                                  }`}
                                >
                                  {act.type === 'START_NEGOTIATION' && <Zap className="w-3.5 h-3.5" />}
                                  {act.type === 'COMPARE' && <Layers className="w-3.5 h-3.5" />}
                                  {act.type === 'VIEW_PRODUCT' && <Eye className="w-3.5 h-3.5" />}
                                  <span>{act.label}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                <div ref={chatEndRef} />
              </div>

              {/* Sticky Bottom Conversational Input + Voice Assistant Bar: [ 🎙 ] [ Ask DealMate anything... ] [ ➤ ] */}
              <div
                className="p-3 sm:p-4 border-t space-y-2.5 transition-colors"
                style={{
                  backgroundColor: 'var(--surface-elevated)',
                  borderColor: 'var(--border)',
                }}
              >
                {/* Follow-up Quick Chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
                  <span
                    className="text-[11px] font-mono font-semibold shrink-0"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Suggestions:
                  </span>
                  {FOLLOW_UP_SUGGESTIONS.slice(0, 5).map((sugg) => (
                    <button
                      key={sugg}
                      type="button"
                      onClick={() => handleUserSubmission(sugg, false)}
                      className="px-2.5 py-1 rounded-lg border text-[11px] font-medium shrink-0 cursor-pointer transition-colors shadow-2xs hover:shadow-xs"
                      style={{
                        backgroundColor: 'var(--surface)',
                        borderColor: 'var(--border)',
                        color: 'var(--text-secondary)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'var(--accent)';
                        e.currentTarget.style.color = 'var(--text-primary)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--border)';
                        e.currentTarget.style.color = 'var(--text-secondary)';
                      }}
                    >
                      {sugg}
                    </button>
                  ))}
                </div>

                {voiceState !== 'IDLE' && (
                  <div
                    className={`px-3 py-2 rounded-xl border flex items-center justify-between text-xs ${
                      voiceState === 'LISTENING'
                        ? 'bg-rose-500/10 border-rose-500/30 text-rose-600'
                        : 'bg-amber-500/10 border-amber-500/30 text-amber-600'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-current animate-ping" />
                      <span>
                        {voiceState === 'LISTENING'
                          ? `🔴 Listening... ${liveTranscriptPreview}`
                          : '◌ Processing voice transcript...'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 h-3">
                      {[1, 2, 3, 4].map((n) => (
                        <span
                          key={n}
                          className="w-1 bg-current rounded-full animate-bounce"
                          style={{
                            height: `${6 + (n % 2) * 5}px`,
                            animationDelay: `${n * 100}ms`,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleUserSubmission(inputText, false);
                  }}
                  className="flex items-center gap-2"
                >
                  <button
                    type="button"
                    onClick={handleToggleVoiceCapture}
                    title={
                      voiceState === 'LISTENING'
                        ? 'Stop listening'
                        : 'Speak naturally with DealMate Voice Assistant'
                    }
                    className="px-3 py-2.5 rounded-xl font-mono text-xs font-semibold flex items-center gap-1.5 shrink-0 cursor-pointer transition-all border"
                    style={{
                      backgroundColor: voiceState === 'LISTENING' ? '#E11D48' : 'var(--surface)',
                      borderColor: voiceState === 'LISTENING' ? '#E11D48' : 'var(--border)',
                      color: voiceState === 'LISTENING' ? '#FFFFFF' : 'var(--accent)',
                    }}
                  >
                    {voiceState === 'LISTENING' ? (
                      <>
                        <MicOff className="w-4 h-4" />
                        <span className="hidden sm:inline">Listening...</span>
                      </>
                    ) : voiceState === 'PROCESSING' ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="hidden sm:inline">Processing</span>
                      </>
                    ) : (
                      <>
                        <Mic className="w-4 h-4" />
                        <span className="hidden sm:inline">Speak</span>
                      </>
                    )}
                  </button>

                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Ask DealMate anything (e.g., 'Only show Sony', 'Can you get this below ₹2,300?')..."
                    className="flex-1 px-4 py-2.5 rounded-xl border text-xs sm:text-sm focus:outline-none transition-colors"
                    style={{
                      backgroundColor: 'var(--surface)',
                      borderColor: 'var(--border)',
                      color: 'var(--text-primary)',
                    }}
                  />

                  <button
                    type="submit"
                    disabled={!inputText.trim() || isPipelineRunning}
                    className="px-4 py-2.5 rounded-xl text-white font-semibold text-xs flex items-center gap-1.5 shrink-0 cursor-pointer transition-colors shadow-xs disabled:opacity-40"
                    style={{
                      backgroundColor: 'var(--accent)',
                    }}
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>
          )}
        </section>

        {/* RIGHT ZONE: Dedicated Product Results Panel (Requirement #1, #2, #3, #4, #5, #6, #7) */}
        <aside
          className={`col-span-1 lg:col-span-5 flex flex-col rounded-3xl border overflow-hidden transition-all h-full ${
            mobileActiveTab === 'products' ? 'flex' : 'hidden lg:flex'
          }`}
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--border)',
          }}
        >
          <ProductResultsPanel
            mode={sessionState.mode}
            hasSearched={hasSearched}
            searchQuery={currentSearchQuery}
            onExecutePrompt={(promptText) => handleUserSubmission(promptText, false)}
            activeProduct={sessionState.activeProduct || selectedProduct}
            activeCandidate={sessionState.activeCandidate}
            activeNegotiation={sessionState.activeNegotiation}
            alternativeCandidates={sessionState.alternativeCandidates}
            candidates={displayCandidates}
            activeSort={productSort}
            onChangeSort={setProductSort}
            activeFilter={productFilter}
            onChangeFilter={setProductFilter}
            displayedCount={displayedProductsCount}
            onLoadMore={() => setDisplayedProductsCount((prev) => prev + 6)}
            selectedProductId={sessionState.activeProduct?.id || selectedProduct?.id || null}
            highlightedProductId={highlightedProductId}
            onSelectProduct={handleSelectProduct}
            onStartNegotiate={handleStartNegotiate}
            onTryAgain={() => {
              const prod = sessionState.activeProduct || selectedProduct;
              if (prod) {
                startInlineProductNegotiation(prod);
              }
            }}
            onAcceptDeal={() => {
              const prod = sessionState.activeProduct || selectedProduct;
              const price = sessionState.activeNegotiation?.settledPrice || prod?.listPrice;
              if (onAcceptDealCheckout && prod && price) {
                onAcceptDealCheckout(prod, price);
              }
            }}
            onAnalyzeDeal={(prod, price) => {
              if (onAnalyzeDeal) {
                onAnalyzeDeal(prod, price);
              }
            }}
            onFindAlternatives={handleFindAlternatives}
            onBackToDiscovery={handleBackToDiscovery}
            onBackToActiveDeal={handleBackToActiveDeal}
            onSelectAlternative={handleSelectAlternative}
            isSearching={isPipelineRunning}
            theme={theme}
            userBudget={preferences?.budget}
            onAdjustBudget={(newBudget) => {
              handleUserSubmission(
                `Show me ${preferences?.productType || 'products'} up to ₹${newBudget}`,
                false
              );
            }}
            onBroadenSearch={() => {
              handleUserSubmission(
                `Show me popular alternatives for ${preferences?.productType || 'wireless earbuds'}`,
                false
              );
            }}
            comparedProductIds={comparedProductIds}
            onToggleCompare={onCompareToggle}
            onOpenCompareModal={onOpenCompareModal}
          />
        </aside>
      </div>

      {/* Deal Analysis Inspection Modal when user clicks "Analyze Deal" */}
      {inspectDealProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className={`max-w-md w-full rounded-2xl border p-5 space-y-4 shadow-2xl ${
              theme.isLight
                ? 'bg-white border-slate-200 text-slate-900'
                : 'bg-[#0F1626] border-slate-700 text-white'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <img
                  src={inspectDealProduct.product.image}
                  alt={inspectDealProduct.product.name}
                  className="w-14 h-14 rounded-xl object-cover"
                />
                <div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-500/10 text-blue-600 font-semibold">
                    {inspectDealProduct.sourceLabel}
                  </span>
                  <h3 className="font-display font-bold text-sm mt-1">
                    {inspectDealProduct.product.name}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectDealProduct(null)}
                className="p-1 rounded-lg hover:bg-slate-500/10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              {inspectDealProduct.product.description}
            </p>

            <div
              className={`p-3 rounded-xl border space-y-1.5 text-xs font-mono ${
                theme.isLight
                  ? 'bg-slate-50 border-slate-200'
                  : 'bg-slate-900 border-slate-800'
              }`}
            >
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Original / MRP:</span>
                <span className="line-through">
                  ₹{inspectDealProduct.product.marketPrice.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Current Seller Price:</span>
                <span className="font-bold">
                  ₹{inspectDealProduct.product.listPrice.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between text-emerald-600 font-bold">
                <span>AI Negotiation Target:</span>
                <span>₹{inspectDealProduct.negotiationTarget.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-blue-600">
                <span>Potential Savings:</span>
                <span>₹{inspectDealProduct.estimatedSavings.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const target = inspectDealProduct;
                  setInspectDealProduct(null);
                  startInlineProductNegotiation(target.product, target.negotiationTarget);
                }}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Start AI Negotiation</span>
              </button>
              <button
                type="button"
                onClick={() => setInspectDealProduct(null)}
                className="py-2.5 px-4 rounded-xl border border-slate-300/50 text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Clear Chat (Section 17) */}
      {showClearChatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div
            className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl space-y-4 ${
              theme.isLight
                ? 'bg-white border-slate-200 text-slate-900'
                : 'bg-[#12161F] border-slate-800 text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-600 flex items-center justify-center shrink-0">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-bold text-base sm:text-lg">
                  Clear this conversation?
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  This will remove the current negotiation conversation from your active session.
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-500 bg-slate-100/60 dark:bg-slate-900/60 p-3 rounded-xl leading-relaxed">
              Your account, saved products, and completed orders will remain completely safe.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowClearChatModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmClearChat}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-sm cursor-pointer"
              >
                Clear Chat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Clear Session (Section 18) */}
      {showClearSessionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div
            className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl space-y-4 ${
              theme.isLight
                ? 'bg-white border-slate-200 text-slate-900'
                : 'bg-[#12161F] border-slate-800 text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/15 text-rose-600 flex items-center justify-center shrink-0">
                <X className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-bold text-base sm:text-lg">
                  Clear DealMate session?
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  This will clear your current shopping and negotiation session. Your account and saved information will remain safe.
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-500 bg-slate-100/60 dark:bg-slate-900/60 p-3 rounded-xl leading-relaxed">
              Temporary search queries, active product filters, and transient bargaining parameters will be reset.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowClearSessionModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmClearSession}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-sm cursor-pointer"
              >
                Clear Session
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
