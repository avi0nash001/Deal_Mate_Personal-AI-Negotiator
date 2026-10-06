import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Product,
  UserRequirement,
  LocalStore,
  CategoryNegotiationSetting,
} from '../../types';
import { RecommendationEngine } from '../../services/recommendationEngine';
import { PriceSparkline } from '../common/PriceSparkline';
import {
  ArrowRight,
  Bot,
  Check,
  ChevronDown,
  Filter,
  Heart,
  MessageCircle,
  Mic,
  PackageSearch,
  RotateCcw,
  Send,
  SlidersHorizontal,
  Sparkles,
  Star,
  Store,
  Tag,
  X,
  Zap,
} from 'lucide-react';

interface AIShoppingAgentProps {
  products: Product[];
  localStores: LocalStore[];
  categorySettings?: CategoryNegotiationSetting[];
  initialQuery?: string;
  initialBudget?: number;
  recentSearches?: string[];
  onNegotiateProduct: (product: Product, targetPrice: number, maxBudget: number) => void;
  onBuySettledProduct?: (product: Product, settledUnitPrice: number) => void;
  onCompareToggle: (product: Product) => void;
  comparedProductIds: string[];
  onSaveToggle: (product: Product) => void;
  savedProductIds: string[];
  onViewStore: (store: LocalStore) => void;
  onOpenVoiceModal?: () => void;
  onLiveProductsFetched?: (liveProducts: Product[]) => void;
}

type Message = {
  id: string;
  sender: 'assistant' | 'user';
  text: string;
  productIds?: string[];
  action?: 'negotiate' | 'compare' | 'products';
  timestamp: string;
};

type SortMode = 'match' | 'price-asc' | 'rating' | 'deal';

const money = (value: number) => `₹${value.toLocaleString('en-IN')}`;
const now = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export const AIShoppingAgent: React.FC<AIShoppingAgentProps> = ({
  products,
  localStores,
  initialQuery = '',
  initialBudget,
  onNegotiateProduct,
  onCompareToggle,
  comparedProductIds,
  onSaveToggle,
  savedProductIds,
  onViewStore,
}) => {
  const firstRequirement = useMemo(() => {
    if (initialQuery) return RecommendationEngine.parseUserQuery(initialQuery);
    return {
      budget: initialBudget || 2500,
      category: 'Fashion',
      productType: 'general',
      purpose: 'Everyday',
      preference: 'Balanced',
    } as UserRequirement;
  }, [initialBudget, initialQuery]);

  const [requirement, setRequirement] = useState<UserRequirement>(firstRequirement);
  const [query, setQuery] = useState(initialQuery);
  const [messages, setMessages] = useState<Message[]>(() => [
    {
      id: 'welcome',
      sender: 'assistant',
      text: initialQuery
        ? `I understood your request. I’ll keep the current search and product context available while we chat.`
        : `Tell me what you want to buy, your budget, or ask me about any product currently shown. I’ll use the available product data instead of guessing.`,
      timestamp: now(),
    },
  ]);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [mobilePanel, setMobilePanel] = useState<'chat' | 'products'>('chat');
  const [sortMode, setSortMode] = useState<SortMode>('match');
  const [priceFilter, setPriceFilter] = useState<'all' | 'budget' | 'above'>('all');
  const [showFilter, setShowFilter] = useState(false);
  const [visibleCount, setVisibleCount] = useState(8);
  const [isThinking, setIsThinking] = useState(false);
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!initialQuery) return;
    const parsed = RecommendationEngine.parseUserQuery(initialQuery);
    setRequirement(parsed);
    setQuery(initialQuery);
  }, [initialQuery]);

  const rankedProducts = useMemo(
    () => RecommendationEngine.rankProducts(requirement, products),
    [products, requirement]
  );

  const filteredProducts = useMemo(() => {
    let result = [...rankedProducts];
    if (priceFilter === 'budget') result = result.filter((p) => p.listPrice <= requirement.budget);
    if (priceFilter === 'above') result = result.filter((p) => p.listPrice > requirement.budget);

    if (sortMode === 'price-asc') result.sort((a, b) => a.listPrice - b.listPrice);
    if (sortMode === 'rating') result.sort((a, b) => b.rating - a.rating);
    if (sortMode === 'deal') result.sort((a, b) => b.maxDiscountPercent - a.maxDiscountPercent);
    return result;
  }, [rankedProducts, priceFilter, requirement.budget, sortMode]);

  const visibleProducts = filteredProducts.slice(0, visibleCount);
  const selectedProduct = products.find((p) => p.id === selectedProductId) || null;

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  useEffect(() => {
    setVisibleCount(8);
  }, [requirement, sortMode, priceFilter]);

  const addMessage = (message: Omit<Message, 'id' | 'timestamp'>) => {
    setMessages((prev) => [...prev, { ...message, id: `${Date.now()}-${Math.random()}`, timestamp: now() }]);
  };

  const selectProduct = (product: Product) => {
    setSelectedProductId(product.id);
    addMessage({
      sender: 'assistant',
      text: `${product.name} is now the active product. Ask me about its price, specifications, suitability, seller, or negotiation target.`,
      productIds: [product.id],
    });
    setMobilePanel('chat');
  };

  const negotiate = (product: Product) => {
    setSelectedProductId(product.id);
    const target = Math.min(requirement.budget, product.listPrice);
    const ceiling = Math.max(target, requirement.budget);
    onNegotiateProduct(product, target, ceiling);
  };

  const handleNewSearch = (text: string) => {
    const parsed = RecommendationEngine.parseUserQuery(text);
    setRequirement(parsed);
    setSelectedProductId(null);
    setSortMode('match');
    setPriceFilter('all');
    addMessage({
      sender: 'assistant',
      text: `I updated the search to ${parsed.category || 'your requested category'}${parsed.productType && parsed.productType !== 'general' ? ` (${parsed.productType})` : ''} with a budget of ${money(parsed.budget)}. I found ${RecommendationEngine.rankProducts(parsed, products).length} matching catalog items.`,
      action: 'products',
    });
  };

  const handleSend = (text: string) => {
    const clean = text.trim();
    if (!clean) return;
    addMessage({ sender: 'user', text: clean });
    setQuery('');
    setIsThinking(true);

    window.setTimeout(() => {
      const response = RecommendationEngine.answerProductQuestion(clean, {
        requirement,
        products: filteredProducts,
        selectedProduct: selectedProduct || undefined,
      });

      if (response.kind === 'search') {
        handleNewSearch(clean);
      } else if (response.kind === 'clarify') {
        addMessage({ sender: 'assistant', text: response.text });
      } else if (response.kind === 'negotiate' && response.product) {
        setSelectedProductId(response.product.id);
        addMessage({ sender: 'assistant', text: response.text, productIds: [response.product.id], action: 'negotiate' });
      } else {
        if (response.productIds?.[0]) setSelectedProductId(response.productIds[0]);
        addMessage({ sender: 'assistant', text: response.text, productIds: response.productIds });
      }
      setIsThinking(false);
    }, 220);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend(query);
  };

  const resetConversation = () => {
    setRequirement(firstRequirement);
    setQuery(initialQuery);
    setSelectedProductId(null);
    setMessages([
      {
        id: 'reset',
        sender: 'assistant',
        text: 'Conversation reset. I’m ready to work from the current product catalog and your requirements.',
        timestamp: now(),
      },
    ]);
  };

  const quickPrompts = [
    'Which one has the best battery life?',
    'Compare the first two',
    'Show me something cheaper',
    'Can I negotiate this one?',
  ];

  return (
    <div className="dm-negotiator mx-auto w-full max-w-[1440px]">
      <div className="dm-mobile-tabs" role="tablist" aria-label="Negotiator panels">
        <button className={mobilePanel === 'chat' ? 'active' : ''} onClick={() => setMobilePanel('chat')}>
          <MessageCircle className="h-4 w-4" /> Chat
        </button>
        <button className={mobilePanel === 'products' ? 'active' : ''} onClick={() => setMobilePanel('products')}>
          <PackageSearch className="h-4 w-4" /> Products <span>{filteredProducts.length}</span>
        </button>
      </div>

      <div className="dm-workspace">
        <section className={`dm-chat-panel ${mobilePanel === 'chat' ? 'dm-mobile-visible' : 'dm-mobile-hidden'}`}>
          <header className="dm-panel-header">
            <div className="flex min-w-0 items-center gap-3">
              <div className="dm-agent-icon"><Bot className="h-5 w-5" /></div>
              <div className="min-w-0">
                <h1>AI Negotiator</h1>
                <p><span className="dm-live-dot" /> Context-aware shopping assistant</p>
              </div>
            </div>
            <button className="dm-icon-button" onClick={resetConversation} title="Reset conversation"><RotateCcw className="h-4 w-4" /></button>
          </header>

          <div className="dm-chat-context">
            <div><Sparkles className="h-3.5 w-3.5" /> Current shopping context</div>
            <div className="dm-context-chips">
              <span>Budget {money(requirement.budget)}</span>
              {requirement.productType && requirement.productType !== 'general' && <span>{requirement.productType}</span>}
              {requirement.purpose && <span>{requirement.purpose}</span>}
            </div>
          </div>

          <div className="dm-chat-scroll">
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <div key={msg.id} className={`dm-message-row ${isUser ? 'user' : ''}`}>
                  <div className={`dm-message-avatar ${isUser ? 'user' : ''}`}>{isUser ? 'You' : <Bot className="h-3.5 w-3.5" />}</div>
                  <div className={`dm-message ${isUser ? 'user' : ''}`}>
                    <p>{msg.text}</p>
                    <span>{msg.timestamp}</span>
                    {msg.productIds && msg.productIds.length > 0 && (
                      <div className="dm-inline-products">
                        {msg.productIds.slice(0, 2).map((id) => {
                          const p = products.find((item) => item.id === id);
                          if (!p) return null;
                          return (
                            <button key={id} onClick={() => selectProduct(p)}>
                              <img src={p.image} alt="" />
                              <span>{p.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                    {msg.action === 'negotiate' && msg.productIds?.[0] && (
                      <button className="dm-message-action" onClick={() => { const p = products.find((item) => item.id === msg.productIds?.[0]); if (p) negotiate(p); }}>
                        <Zap className="h-3.5 w-3.5" /> Start negotiation
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            {isThinking && <div className="dm-thinking"><span /> <span /> <span /> DealMate is thinking…</div>}
            <div ref={chatEndRef} />
          </div>

          <div className="dm-quick-prompts">
            {quickPrompts.map((prompt) => <button key={prompt} onClick={() => handleSend(prompt)}>{prompt}</button>)}
          </div>

          <form onSubmit={handleSubmit} className="dm-chat-input-wrap">
            <button type="button" className="dm-icon-button" title="Voice assistant is available from the main app" aria-label="Voice assistant"><Mic className="h-4 w-4" /></button>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Ask about a product, feature, price, comparison, or negotiation…" />
            <button type="submit" className="dm-send-button" disabled={!query.trim()}><Send className="h-4 w-4" /></button>
          </form>
        </section>

        <section className={`dm-products-panel ${mobilePanel === 'products' ? 'dm-mobile-visible' : 'dm-mobile-hidden'}`}>
          <header className="dm-products-header">
            <div>
              <div className="dm-section-kicker"><PackageSearch className="h-3.5 w-3.5" /> Product results</div>
              <h2>Products <span>{filteredProducts.length} matches</span></h2>
              <p>Showing {Math.min(visibleProducts.length, filteredProducts.length)} of {filteredProducts.length} relevant catalog items</p>
            </div>
            <div className="dm-product-controls">
              <select value={sortMode} onChange={(e) => setSortMode(e.target.value as SortMode)} aria-label="Sort products">
                <option value="match">Best Match</option>
                <option value="price-asc">Lowest Price</option>
                <option value="rating">Highest Rating</option>
                <option value="deal">Best Deal</option>
              </select>
              <button className={showFilter ? 'active' : ''} onClick={() => setShowFilter((v) => !v)}><Filter className="h-3.5 w-3.5" /> Filter</button>
            </div>
          </header>

          {showFilter && (
            <div className="dm-filter-bar">
              <button className={priceFilter === 'all' ? 'active' : ''} onClick={() => setPriceFilter('all')}>All prices</button>
              <button className={priceFilter === 'budget' ? 'active' : ''} onClick={() => setPriceFilter('budget')}>Within {money(requirement.budget)}</button>
              <button className={priceFilter === 'above' ? 'active' : ''} onClick={() => setPriceFilter('above')}>Above budget</button>
            </div>
          )}

          <div className="dm-product-scroll">
            {visibleProducts.length === 0 ? (
              <div className="dm-empty-state">
                <PackageSearch className="h-8 w-8" />
                <h3>No exact matches</h3>
                <p>I couldn't verify a matching product in the current catalog.</p>
                <div className="flex flex-wrap justify-center gap-2">
                  <button onClick={() => { setPriceFilter('all'); setRequirement((r) => ({ ...r, budget: Math.round(r.budget * 1.2) })); }}>Broaden budget</button>
                  <button onClick={() => handleSend('Show me alternatives')}>Find alternatives</button>
                </div>
              </div>
            ) : (
              <div className="dm-product-list">
                {visibleProducts.map((product) => (
                  <ProductResultCard
                    key={product.id}
                    product={product}
                    budget={requirement.budget}
                    selected={selectedProductId === product.id}
                    saved={savedProductIds.includes(product.id)}
                    compared={comparedProductIds.includes(product.id)}
                    onSelect={() => selectProduct(product)}
                    onNegotiate={() => negotiate(product)}
                    onSave={() => onSaveToggle(product)}
                    onCompare={() => onCompareToggle(product)}
                    onDetails={() => setDetailProduct(product)}
                    onStore={() => {
                      const store = localStores.find((s) => s.id === product.sellerId) || localStores.find((s) => s.name === product.sellerName);
                      if (store) onViewStore(store);
                    }}
                  />
                ))}
                {visibleCount < filteredProducts.length && (
                  <button className="dm-load-more" onClick={() => setVisibleCount((count) => count + 8)}>Load more products <ArrowRight className="h-3.5 w-3.5" /></button>
                )}
              </div>
            )}
          </div>
        </section>
      </div>

      {detailProduct && (
        <div className="dm-modal-backdrop" onClick={() => setDetailProduct(null)}>
          <div className="dm-product-modal" onClick={(e) => e.stopPropagation()}>
            <button className="dm-modal-close" onClick={() => setDetailProduct(null)}><X className="h-4 w-4" /></button>
            <img src={detailProduct.image} alt={detailProduct.name} />
            <div className="dm-modal-content">
              <span className="dm-brand">{detailProduct.brand}</span>
              <h3>{detailProduct.name}</h3>
              <p>{detailProduct.description}</p>
              <div className="dm-spec-grid">
                {Object.entries(detailProduct.specs).map(([key, value]) => <div key={key}><span>{key}</span><strong>{value}</strong></div>)}
              </div>
              <div className="dm-modal-actions">
                <strong>{money(detailProduct.listPrice)}</strong>
                <button onClick={() => negotiate(detailProduct)}><Zap className="h-4 w-4" /> Negotiate</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ProductResultCard: React.FC<{
  product: Product;
  budget: number;
  selected: boolean;
  saved: boolean;
  compared: boolean;
  onSelect: () => void;
  onNegotiate: () => void;
  onSave: () => void;
  onCompare: () => void;
  onDetails: () => void;
  onStore: () => void;
}> = ({ product, budget, selected, saved, compared, onSelect, onNegotiate, onSave, onCompare, onDetails, onStore }) => {
  const delta = product.listPrice - budget;
  return (
    <article className={`dm-product-card ${selected ? 'selected' : ''}`}>
      <button className="dm-product-image" onClick={onDetails} aria-label={`View ${product.name}`}>
        <img src={product.image} alt={product.name} loading="lazy" />
        <span className="dm-match-badge">{product.aiMatchScore || 90}% match</span>
      </button>
      <div className="dm-product-card-body">
        <div className="dm-product-meta-row">
          <span className="dm-brand">{product.brand}</span>
          <div className="flex items-center gap-1">
            <button className={`dm-small-icon ${saved ? 'active' : ''}`} onClick={onSave} title="Save"><Heart className="h-3.5 w-3.5" fill={saved ? 'currentColor' : 'none'} /></button>
            <button className={`dm-small-icon ${compared ? 'active' : ''}`} onClick={onCompare} title="Compare"><SlidersHorizontal className="h-3.5 w-3.5" /></button>
          </div>
        </div>
        <button className="dm-product-title" onClick={onSelect}>{product.name}</button>
        <div className="dm-rating"><Star className="h-3.5 w-3.5" fill="currentColor" /> <strong>{product.rating}</strong> <span>({product.reviewsCount})</span> <button onClick={onStore}><Store className="h-3 w-3" /> {product.sellerName}</button></div>
        <div className="dm-price-row">
          <strong>{money(product.listPrice)}</strong>
          <span>{money(product.marketPrice)}</span>
          {delta <= 0 ? <em className="good">Within budget</em> : <em className="warn">{money(delta)} above</em>}
        </div>
        <div className="my-1">
          <PriceSparkline product={product} height={24} showLabels={false} />
        </div>
        <div className="dm-specs">
          {Object.entries(product.specs).slice(0, 3).map(([key, value]) => <span key={key}><Check className="h-3 w-3" /> {key}: {value}</span>)}
        </div>
        <div className="dm-card-actions">
          <button onClick={onSelect}>View details</button>
          <button className="primary" onClick={onNegotiate}><Zap className="h-3.5 w-3.5" /> Select & Negotiate</button>
        </div>
      </div>
    </article>
  );
};
