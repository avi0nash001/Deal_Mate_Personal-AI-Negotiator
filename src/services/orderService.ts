import { doc, setDoc, getDocs, collection, query, where, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Order } from '../types';

/**
 * Saves a placed order (COD or verified Razorpay) to the Firestore database.
 */
export async function saveOrderToFirestore(order: Order): Promise<boolean> {
  try {
    const orderDocRef = doc(db, 'orders', order.id);

    const firestoreData = {
      id: order.id,
      productId: String(order.product?.id || order.dealToken?.productId || 'product_unknown'),
      productName: String(order.product?.name || 'DealMate Product').slice(0, 200),
      quantity: Math.max(1, Math.floor(Number(order.quantity) || 1)),
      unitPrice: Number(order.dealToken?.finalPrice || order.product?.listPrice || order.totalPaid),
      totalPaid: Number(order.totalPaid),
      totalSaved: Number(order.totalSaved || 0),
      status: order.status || 'CONFIRMED',
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus || (order.paymentMethod === 'COD' ? 'COD_PENDING' : 'PAID'),
      razorpayOrderId: order.razorpayOrderId || null,
      razorpayPaymentId: order.razorpayPaymentId || null,
      customerName: String(order.shippingAddress?.fullName || 'Valued Customer').slice(0, 120),
      customerPhone: String(order.shippingAddress?.phone || '').slice(0, 30),
      shippingAddress: String(
        `${order.shippingAddress?.address || ''}, ${order.shippingAddress?.city || ''} ${order.shippingAddress?.postalCode || ''}`
      ).trim().slice(0, 500),
      buyerUserId: order.buyerUserId || null,
      buyerEmail: order.buyerEmail || null,
      sellerId: String(order.product?.sellerId || order.dealToken?.sellerId || 'store_merchant').slice(0, 128),
      sellerName: String(order.product?.sellerName || 'Verified Merchant').slice(0, 120),
      placedAt: new Date(order.placedAt || Date.now()).toISOString(),
      verifiedAt: order.verifiedAt || null,
    };

    await setDoc(orderDocRef, firestoreData, { merge: true });
    return true;
  } catch (err: any) {
    console.warn('Could not sync order to Firestore:', err?.message || err);
    // Non-blocking: returns false so caller can still complete UI transition
    return false;
  }
}

/**
 * Fetches persisted orders from Firestore for the given user ID.
 */
export async function fetchUserOrdersFromFirestore(buyerUserId: string): Promise<any[]> {
  try {
    if (!buyerUserId) return [];
    const q = query(collection(db, 'orders'), where('buyerUserId', '==', buyerUserId));
    const snapshot = await getDocs(q);
    const results: any[] = [];
    snapshot.forEach((d) => {
      results.push(d.data());
    });
    return results;
  } catch (err) {
    console.warn('Could not fetch orders from Firestore:', err);
    return [];
  }
}
