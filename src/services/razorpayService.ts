import { getAuthHeaders } from './authHeaders';
import { Product, DealToken, Order } from '../types';

declare global {
  interface Window {
    Razorpay?: any;
  }
}

export interface RazorpayConfigResponse {
  keyId: string;
  isConfigured: boolean;
  currency: string;
  mode: 'test' | 'live' | 'unconfigured';
  secretIsAsterisks?: boolean;
}

export interface CreateOrderPayload {
  product: Product;
  unitPrice: number;
  quantity: number;
  dealToken: DealToken;
  shippingAddress: {
    fullName: string;
    phone: string;
    address: string;
    city: string;
    postalCode: string;
  };
  paymentMethod: 'UPI' | 'CREDIT_CARD' | 'COD';
  maxSingleDiscountPct?: number;
  maxBundleDiscountPct?: number;
  isBundle?: boolean;
}

export interface CreateOrderResponse {
  success: boolean;
  isCOD?: boolean;
  order?: Order;
  orderId?: string;
  razorpayOrderId?: string;
  amount?: number;
  currency?: string;
  keyId?: string;
  productName?: string;
  description?: string;
  prefill?: {
    name: string;
    contact: string;
    email: string;
  };
  error?: string;
  code?: string;
  docsHelp?: string;
}

export interface VerifyPaymentPayload {
  dealmateOrderId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export interface VerifyPaymentResponse {
  verified: boolean;
  order?: Order;
  error?: string;
  code?: string;
  alreadyVerified?: boolean;
}

/**
 * Ensures Razorpay Checkout.js is dynamically loaded in the window.
 */
export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && typeof window.Razorpay !== 'undefined') {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

/**
 * Fetches Razorpay public status and Key ID from backend
 */
export async function fetchRazorpayConfig(): Promise<RazorpayConfigResponse> {
  try {
    const res = await fetch('/api/payments/razorpay-config');
    if (!res.ok) {
      return {
        keyId: '',
        isConfigured: false,
        currency: 'INR',
        mode: 'unconfigured',
      };
    }
    return await res.json();
  } catch {
    return {
      keyId: '',
      isConfigured: false,
      currency: 'INR',
      mode: 'unconfigured',
    };
  }
}

/**
 * Initiates order on backend. Calculates payable amount on server using negotiated price.
 */
export async function createBackendOrder(
  payload: CreateOrderPayload
): Promise<CreateOrderResponse> {
  const res = await fetch('/api/orders/create-razorpay-order', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to create payment order on server.');
  }
  return data;
}

/**
 * Submits signature and transaction IDs for server-side cryptographic verification
 */
export async function verifyBackendPayment(
  payload: VerifyPaymentPayload
): Promise<VerifyPaymentResponse> {
  const body = {
    dealmateOrderId: payload.dealmateOrderId,
    razorpay_order_id: payload.razorpayOrderId,
    razorpay_payment_id: payload.razorpayPaymentId,
    razorpay_signature: payload.razorpaySignature,
    razorpayOrderId: payload.razorpayOrderId,
    razorpayPaymentId: payload.razorpayPaymentId,
    razorpaySignature: payload.razorpaySignature,
  };

  const res = await fetch('/api/orders/verify-payment', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok || !data.verified) {
    throw new Error(data.error || 'Payment signature verification failed.');
  }
  return data;
}
