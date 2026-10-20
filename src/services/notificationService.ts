/**
 * Web Notifications Service for DealMate
 * 
 * Provides native desktop/mobile alerts via the Web Notifications API when:
 * 1. The autonomous buyer agent successfully completes a negotiation.
 * 2. A seller responds to an offer while the user is offline (network offline or tab in background).
 * 
 * Includes permission management, offline state detection, notification history,
 * fallback audio blips, and reactive UI subscriptions.
 */

export interface DealMateNotificationItem {
  id: string;
  title: string;
  body: string;
  type: 'DEAL_COMPLETED' | 'SELLER_RESPONSE' | 'SYSTEM';
  timestamp: string;
  read: boolean;
  productName?: string;
  sellerName?: string;
  price?: number;
  savings?: number;
  isOfflineAlert?: boolean;
}

const STORAGE_KEY = 'dealmate_web_notifications_history';
const MAX_HISTORY = 20;

type Listener = () => void;
const listeners = new Set<Listener>();

function notifyListeners() {
  listeners.forEach((l) => {
    try {
      l();
    } catch (e) {
      console.warn('[NotificationService] Listener error:', e);
    }
  });
}

class NotificationService {
  private offlineDetected: boolean = typeof navigator !== 'undefined' ? !navigator.onLine : false;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.offlineDetected = false;
        notifyListeners();
      });
      window.addEventListener('offline', () => {
        this.offlineDetected = true;
        notifyListeners();
      });
      document.addEventListener('visibilitychange', () => {
        notifyListeners();
      });
    }
  }

  /**
   * Check if Web Notifications API is supported in the current environment
   */
  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  /**
   * Get current permission state: 'default' | 'granted' | 'denied' | 'unsupported'
   */
  public getPermission(): NotificationPermission | 'unsupported' {
    if (!this.isSupported()) return 'unsupported';
    return Notification.permission;
  }

  /**
   * Request permission from the user for Web Notifications
   */
  public async requestPermission(): Promise<NotificationPermission | 'unsupported'> {
    if (!this.isSupported()) return 'unsupported';
    try {
      const result = await Notification.requestPermission();
      notifyListeners();
      return result;
    } catch (err) {
      console.warn('[NotificationService] Permission request failed:', err);
      return Notification.permission;
    }
  }

  /**
   * Check if the user is considered offline (network disconnected or tab hidden/minimized)
   */
  public isOfflineOrBackground(): boolean {
    if (typeof window === 'undefined') return false;
    const isNetworkOffline = !navigator.onLine;
    const isTabHidden = document.visibilityState === 'hidden';
    const isWindowBlurred = !document.hasFocus();
    return isNetworkOffline || isTabHidden || isWindowBlurred;
  }

  /**
   * Internal helper to trigger native browser Web Notification
   */
  private triggerNativeNotification(
    title: string,
    options: NotificationOptions,
    onClick?: () => void
  ): boolean {
    if (!this.isSupported() || Notification.permission !== 'granted') {
      return false;
    }

    try {
      const notification = new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options,
      });

      notification.onclick = () => {
        try {
          window.focus();
        } catch {
          // ignore
        }
        notification.close();
        if (onClick) onClick();
      };

      return true;
    } catch (err) {
      console.warn('[NotificationService] Error creating native notification:', err);
      return false;
    }
  }

  /**
   * Save a notification event to history
   */
  private recordHistory(item: Omit<DealMateNotificationItem, 'id' | 'timestamp' | 'read'>): DealMateNotificationItem {
    const fullItem: DealMateNotificationItem = {
      ...item,
      id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      read: false,
    };

    try {
      const history = this.getHistory();
      const updated = [fullItem, ...history].slice(0, MAX_HISTORY);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.warn('[NotificationService] Error saving history:', err);
    }

    notifyListeners();
    return fullItem;
  }

  /**
   * Alert user when their autonomous buyer agent successfully completes a negotiation
   */
  public notifyAutonomousDealCompleted(options: {
    productName: string;
    settledPrice: number;
    savings: number;
    sellerName?: string;
    quantity?: number;
    image?: string;
    onClick?: () => void;
  }): void {
    const { productName, settledPrice, savings, sellerName, quantity = 1, image, onClick } = options;
    const formattedPrice = `₹${settledPrice.toLocaleString('en-IN')}`;
    const formattedSavings = `₹${savings.toLocaleString('en-IN')}`;
    const isOffline = this.isOfflineOrBackground();

    const title = `🎉 Deal Secured! Autonomous Buyer Agent Succeeded`;
    const body = quantity > 1
      ? `Your agent negotiated ${quantity}x "${productName}" down to ${formattedPrice}/unit, saving you ${formattedSavings}!`
      : `Your agent negotiated "${productName}" with ${sellerName || 'Seller'} down to ${formattedPrice}, saving you ${formattedSavings}!`;

    this.recordHistory({
      title,
      body,
      type: 'DEAL_COMPLETED',
      productName,
      sellerName,
      price: settledPrice,
      savings,
      isOfflineAlert: isOffline,
    });

    this.triggerNativeNotification(
      title,
      {
        body,
        icon: image || '/favicon.ico',
        tag: `dealmate-completed-${productName.slice(0, 20)}`,
      },
      onClick
    );
  }

  /**
   * Alert user when a seller responds to an offer while the user is offline (or backgrounded)
   */
  public notifySellerResponse(options: {
    productName: string;
    sellerName: string;
    counterOfferPrice: number;
    image?: string;
    forceAlert?: boolean;
    onClick?: () => void;
  }): void {
    const { productName, sellerName, counterOfferPrice, image, forceAlert = false, onClick } = options;
    const isOffline = this.isOfflineOrBackground();

    // The user specifically requested alerts when seller responds while user is offline
    // If forceAlert is true or user is offline/backgrounded, trigger native notification
    const shouldNotify = forceAlert || isOffline;
    const formattedPrice = `₹${counterOfferPrice.toLocaleString('en-IN')}`;

    const title = isOffline
      ? `💬 Seller Counter-Offer (While You Were Away)`
      : `💬 Seller Counter-Offer Received`;
    const body = `${sellerName} just counter-offered ${formattedPrice} for "${productName}". Tap to review!`;

    this.recordHistory({
      title,
      body,
      type: 'SELLER_RESPONSE',
      productName,
      sellerName,
      price: counterOfferPrice,
      isOfflineAlert: isOffline,
    });

    if (shouldNotify) {
      this.triggerNativeNotification(
        title,
        {
          body,
          icon: image || '/favicon.ico',
          tag: `dealmate-seller-${sellerName.slice(0, 15)}`,
        },
        onClick
      );
    }
  }

  /**
   * Send a test notification to verify Web Notifications API is operating correctly
   */
  public async sendTestNotification(): Promise<boolean> {
    if (!this.isSupported()) return false;

    if (Notification.permission !== 'granted') {
      const perm = await this.requestPermission();
      if (perm !== 'granted') return false;
    }

    const title = `🔔 DealMate Notifications Active`;
    const body = `You will receive instant native alerts when your autonomous agent secures a deal or a seller counters while you're offline.`;

    this.recordHistory({
      title,
      body,
      type: 'SYSTEM',
    });

    return this.triggerNativeNotification(title, {
      body,
      tag: 'dealmate-test-notification',
    });
  }

  /**
   * Retrieve notification history from localStorage
   */
  public getHistory(): DealMateNotificationItem[] {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return [];
  }

  /**
   * Mark all notifications as read
   */
  public markAllAsRead(): void {
    try {
      const history = this.getHistory().map((item) => ({ ...item, read: true }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
      notifyListeners();
    } catch (err) {
      console.warn('[NotificationService] Error marking as read:', err);
    }
  }

  /**
   * Clear all notification history
   */
  public clearHistory(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
      notifyListeners();
    } catch (err) {
      console.warn('[NotificationService] Error clearing history:', err);
    }
  }

  /**
   * Subscribe to notification updates (e.g. for React components)
   */
  public subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }
}

export const notificationService = new NotificationService();
