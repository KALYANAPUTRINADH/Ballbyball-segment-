import { dbService } from '../lib/database';
import type {
  StoreProduct,
  StoreOrder,
  StoreReview,
  StoreCoupon,
  StoreWishlistItem,
  StoreBrand,
  OrderStatus,
  StoreAlertConfig,
  StoreStockAlert,
  StoreAlertSeverity,
  StoreRestockRequest,
  StoreSavedPaymentMethod,
  SavedPaymentProvider,
  StoreSavedAddress,
  StoreAnalyticsEvent,
  StoreAnalyticsEventType,
  StorePayoutAccount,
  StorePayoutAccountType,
} from '../types/store';

const LOCAL_PRODUCTS_KEY = 'streamlify_store_products_v1';
const LOCAL_ORDERS_KEY = 'streamlify_store_orders_v1';
const LOCAL_COUPONS_KEY = 'streamlify_store_coupons_v1';
const LOCAL_REVIEWS_KEY = 'streamlify_store_reviews_v1';
const LOCAL_WISHLIST_KEY = 'streamlify_store_wishlist_v1';
const LOCAL_BRANDS_KEY = 'streamlify_store_brands_v1';
const LOCAL_ALERT_CONFIG_KEY = 'streamlify_store_alert_config_v1';
const LOCAL_STOCK_ALERTS_KEY = 'streamlify_store_stock_alerts_v1';
const LOCAL_RESTOCK_KEY = 'streamlify_store_restock_v1';
const LOCAL_PAYMENT_METHODS_KEY = 'streamlify_store_payment_methods_v1';
const LOCAL_SAVED_ADDRESS_KEY = 'streamlify_store_saved_address_v1';
const LOCAL_ANALYTICS_EVENTS_KEY = 'streamlify_store_analytics_v1';
const LOCAL_PAYOUT_ACCOUNTS_KEY = 'streamlify_store_payout_accounts_v1';
const STORE_SESSION_STORAGE_KEY = 'streamlify_store_session_id_v1';

export const DEFAULT_STORE_ALERT_CONFIG: StoreAlertConfig = {
  id: 'default',
  enabled: true,
  scope: 'popular_cricket',
  popular_threshold: 10,
  default_threshold: 5,
  popular_min_units_ordered: 3,
  sync_to_global_bell: true,
  toast_on_trigger: true,
  updated_at: new Date().toISOString(),
};

function sanitizeId(raw: string): string {
  const cleaned = raw.replace(/[^a-zA-Z0-9_-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  return cleaned.slice(0, 120) || `item-${Date.now()}`;
}

export interface ProductOrderMetrics {
  unitsOrdered: number;
  revenueUsd: number;
  orderCount: number;
}

export interface ProductReviewMetrics {
  averageRating: number;
  reviewCount: number;
}

export const StoreService = {
  async fetchProducts(includeInactive = false): Promise<StoreProduct[]> {
    let dbItems: StoreProduct[] = [];
    let dbSucceeded = false;
    try {
      const res = await dbService.getAll('store_products');
      if (Array.isArray(res)) {
        dbItems = res as StoreProduct[];
        dbSucceeded = true;
      }
    } catch (e) {
      console.warn('StoreService.fetchProducts Firestore fallback:', e);
    }

    let localItems: StoreProduct[] = [];
    if (!dbSucceeded) {
      try {
        const raw = localStorage.getItem(LOCAL_PRODUCTS_KEY);
        if (raw) localItems = JSON.parse(raw);
      } catch {
        localItems = [];
      }
    } else {
      try {
        localStorage.setItem(LOCAL_PRODUCTS_KEY, JSON.stringify(dbItems));
      } catch {
        // ignore storage limits
      }
    }

    const source = dbSucceeded ? dbItems : localItems;
    const map = new Map<string, StoreProduct>();
    for (const item of source) {
      if (item && item.id) {
        map.set(item.id, item);
      }
    }

    const combined = Array.from(map.values()).sort((a, b) => {
      if (Boolean(a.featured) !== Boolean(b.featured)) {
        return a.featured ? -1 : 1;
      }
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    });

    return includeInactive ? combined : combined.filter((p) => p.is_active !== false);
  },

  async saveProduct(
    product: Omit<StoreProduct, 'id' | 'created_at' | 'updated_at'> & { id?: string; created_at?: string }
  ): Promise<StoreProduct> {
    const now = new Date().toISOString();
    const id = sanitizeId(product.id || `${product.brand}-${product.sku}-${Date.now()}`);
    const payload: StoreProduct = {
      ...product,
      id,
      sku: String(product.sku || id).slice(0, 64),
      name: String(product.name).slice(0, 160),
      brand: String(product.brand).slice(0, 64),
      category: String(product.category).slice(0, 80),
      description: String(product.description || '').slice(0, 2000),
      image_url: String(product.image_url || '').slice(0, 2000),
      price_usd: Math.max(0, Number(product.price_usd) || 0),
      mrp_usd: Math.max(0, Number(product.mrp_usd || product.price_usd) || 0),
      price_inr: Math.max(0, Number(product.price_inr) || 0),
      mrp_inr: Math.max(0, Number(product.mrp_inr || product.price_inr) || 0),
      stock: Math.max(0, Math.round(Number(product.stock) || 0)),
      sizes: Array.isArray(product.sizes) && product.sizes.length > 0 ? product.sizes : ['Standard'],
      specs: product.specs || {},
      highlights: Array.isArray(product.highlights) ? product.highlights : [],
      rating: Math.max(0, Number(product.rating) || 0),
      review_count: Math.max(0, Number(product.review_count) || 0),
      is_active: product.is_active !== false,
      featured: Boolean(product.featured),
      ...(product.low_stock_threshold !== undefined && product.low_stock_threshold >= 0
        ? { low_stock_threshold: Math.round(Number(product.low_stock_threshold)) }
        : {}),
      created_at: product.created_at || now,
      updated_at: now,
    };

    try {
      const existingRaw = localStorage.getItem(LOCAL_PRODUCTS_KEY);
      const list: StoreProduct[] = existingRaw ? JSON.parse(existingRaw) : [];
      const idx = list.findIndex((p) => p.id === id);
      if (idx >= 0) list[idx] = payload;
      else list.unshift(payload);
      localStorage.setItem(LOCAL_PRODUCTS_KEY, JSON.stringify(list));
    } catch {
      // ignore localStorage limits
    }

    await dbService.upsert('store_products', payload);
    return payload;
  },

  async deleteProduct(id: string): Promise<void> {
    const remoteDeleted = await dbService.remove('store_products', id);
    if (!remoteDeleted) {
      throw new Error('Could not delete product from catalog. Ensure you are signed in as Store Admin and retry.');
    }
    try {
      const existingRaw = localStorage.getItem(LOCAL_PRODUCTS_KEY);
      if (existingRaw) {
        const list: StoreProduct[] = JSON.parse(existingRaw);
        localStorage.setItem(LOCAL_PRODUCTS_KEY, JSON.stringify(list.filter((p) => p.id !== id)));
      }
      const alertsRaw = localStorage.getItem(LOCAL_STOCK_ALERTS_KEY);
      if (alertsRaw) {
        const alertList: StoreStockAlert[] = JSON.parse(alertsRaw);
        localStorage.setItem(
          LOCAL_STOCK_ALERTS_KEY,
          JSON.stringify(alertList.filter((a) => a.product_id !== id))
        );
      }
    } catch {
      // ignore localStorage cleanup errors
    }
  },

  async decrementStockAfterOrder(
    items: { product_id: string; quantity: number }[],
    persistRemote = false
  ): Promise<void> {
    if (!items || items.length === 0) return;
    const qtyByProduct: Record<string, number> = {};
    for (const it of items) {
      if (it.product_id && it.quantity > 0) {
        qtyByProduct[it.product_id] = (qtyByProduct[it.product_id] || 0) + Math.round(it.quantity);
      }
    }

    try {
      const raw = localStorage.getItem(LOCAL_PRODUCTS_KEY);
      if (raw) {
        const list: StoreProduct[] = JSON.parse(raw);
        const now = new Date().toISOString();
        const updatedList = list.map((p) => {
          const dec = qtyByProduct[p.id];
          if (!dec) return p;
          return {
            ...p,
            stock: Math.max(0, p.stock - dec),
            units_ordered: (p.units_ordered || 0) + dec,
            updated_at: now,
          };
        });
        localStorage.setItem(LOCAL_PRODUCTS_KEY, JSON.stringify(updatedList));

        if (persistRemote) {
          const changed = updatedList.filter((p) => qtyByProduct[p.id] > 0);
          await Promise.allSettled(changed.map((p) => dbService.upsert('store_products', p)));
        }
      }
    } catch (e) {
      console.warn('decrementStockAfterOrder warning:', e);
    }
  },

  async fetchCoupons(includeInactive = false): Promise<StoreCoupon[]> {
    let dbCoupons: StoreCoupon[] = [];
    let dbSucceeded = false;
    try {
      const res = await dbService.getAll('store_coupons');
      if (Array.isArray(res)) {
        dbCoupons = res as StoreCoupon[];
        dbSucceeded = true;
      }
    } catch (e) {
      console.warn('StoreService.fetchCoupons fallback:', e);
    }

    let localCoupons: StoreCoupon[] = [];
    if (!dbSucceeded) {
      try {
        const raw = localStorage.getItem(LOCAL_COUPONS_KEY);
        if (raw) localCoupons = JSON.parse(raw);
      } catch {
        localCoupons = [];
      }
    } else {
      try {
        localStorage.setItem(LOCAL_COUPONS_KEY, JSON.stringify(dbCoupons));
      } catch {
        // ignore
      }
    }

    const source = dbSucceeded ? dbCoupons : localCoupons;
    const map = new Map<string, StoreCoupon>();
    for (const c of source) if (c && c.id) map.set(c.id, c);

    const all = Array.from(map.values());
    return includeInactive ? all : all.filter((c) => c.is_active);
  },

  async saveCoupon(coupon: Omit<StoreCoupon, 'id' | 'created_at'> & { id?: string }): Promise<StoreCoupon> {
    const id = sanitizeId(coupon.id || `coupon-${coupon.code.toLowerCase()}`);
    const payload: StoreCoupon = {
      ...coupon,
      id,
      code: coupon.code.trim().toUpperCase().slice(0, 40),
      value: Math.max(0, Number(coupon.value) || 0),
      min_order_usd: Math.max(0, Number(coupon.min_order_usd) || 0),
      description: String(coupon.description || '').slice(0, 200),
      is_active: coupon.is_active !== false,
      created_at: new Date().toISOString(),
    };
    try {
      const raw = localStorage.getItem(LOCAL_COUPONS_KEY);
      const list: StoreCoupon[] = raw ? JSON.parse(raw) : [];
      const idx = list.findIndex((c) => c.id === id);
      if (idx >= 0) list[idx] = payload;
      else list.unshift(payload);
      localStorage.setItem(LOCAL_COUPONS_KEY, JSON.stringify(list));
    } catch {
      // ignore
    }
    await dbService.upsert('store_coupons', payload);
    return payload;
  },

  async deleteCoupon(id: string): Promise<void> {
    const remoteDeleted = await dbService.remove('store_coupons', id);
    if (!remoteDeleted) {
      throw new Error('Could not delete promo code from catalog.');
    }
    try {
      const raw = localStorage.getItem(LOCAL_COUPONS_KEY);
      if (raw) {
        const list: StoreCoupon[] = JSON.parse(raw);
        localStorage.setItem(LOCAL_COUPONS_KEY, JSON.stringify(list.filter((c) => c.id !== id)));
      }
    } catch {
      // ignore
    }
  },

  async fetchBrands(includeInactive = false): Promise<StoreBrand[]> {
    let dbBrands: StoreBrand[] = [];
    let dbSucceeded = false;
    try {
      const res = await dbService.getAll('store_brands');
      if (Array.isArray(res)) {
        dbBrands = res as StoreBrand[];
        dbSucceeded = true;
      }
    } catch (e) {
      console.warn('StoreService.fetchBrands fallback:', e);
    }

    let localBrands: StoreBrand[] = [];
    if (!dbSucceeded) {
      try {
        const raw = localStorage.getItem(LOCAL_BRANDS_KEY);
        if (raw) localBrands = JSON.parse(raw);
      } catch {
        localBrands = [];
      }
    } else {
      try {
        localStorage.setItem(LOCAL_BRANDS_KEY, JSON.stringify(dbBrands));
      } catch {
        // ignore
      }
    }

    const source = dbSucceeded ? dbBrands : localBrands;
    const map = new Map<string, StoreBrand>();
    for (const b of source) {
      if (b && b.id && b.name) map.set(b.id, b);
    }

    const sorted = Array.from(map.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
    return includeInactive ? sorted : sorted.filter((b) => b.is_active !== false);
  },

  async saveBrand(
    brand: Omit<StoreBrand, 'id' | 'created_at' | 'updated_at'> & { id?: string; created_at?: string }
  ): Promise<StoreBrand> {
    const now = new Date().toISOString();
    const cleanName = brand.name.trim().slice(0, 64);
    const id = sanitizeId(brand.id || `brand-${cleanName.toLowerCase()}`);
    const payload: StoreBrand = {
      id,
      name: cleanName,
      domain: brand.domain || 'All',
      origin: String(brand.origin || '').trim().slice(0, 80),
      authenticity_prefix: String(brand.authenticity_prefix || '').trim().toUpperCase().slice(0, 32),
      logo_url: String(brand.logo_url || '').trim(),
      description: String(brand.description || '').trim().slice(0, 500),
      is_active: brand.is_active !== false,
      created_at: brand.created_at || now,
      updated_at: now,
    };

    try {
      const raw = localStorage.getItem(LOCAL_BRANDS_KEY);
      const list: StoreBrand[] = raw ? JSON.parse(raw) : [];
      const idx = list.findIndex((b) => b.id === id);
      if (idx >= 0) list[idx] = payload;
      else list.push(payload);
      localStorage.setItem(LOCAL_BRANDS_KEY, JSON.stringify(list));
    } catch {
      // ignore
    }

    await dbService.upsert('store_brands', payload);
    return payload;
  },

  async deleteBrand(id: string): Promise<void> {
    const remoteDeleted = await dbService.remove('store_brands', id);
    if (!remoteDeleted) {
      throw new Error('Could not delete custom brand. Check admin permissions and retry.');
    }
    try {
      const raw = localStorage.getItem(LOCAL_BRANDS_KEY);
      if (raw) {
        const list: StoreBrand[] = JSON.parse(raw);
        localStorage.setItem(LOCAL_BRANDS_KEY, JSON.stringify(list.filter((b) => b.id !== id)));
      }
    } catch {
      // ignore
    }
  },

  async fetchOrders(userId?: string, isAdmin = false): Promise<StoreOrder[]> {
    let dbOrders: StoreOrder[] = [];
    try {
      if (isAdmin) {
        const res = await dbService.getAll('store_orders');
        if (Array.isArray(res)) dbOrders = res as StoreOrder[];
      } else if (userId && userId !== 'guest') {
        const res = await dbService.getAll('store_orders', { user_id: userId });
        if (Array.isArray(res)) dbOrders = res as StoreOrder[];
      }
    } catch (e) {
      console.warn('StoreService.fetchOrders fallback:', e);
    }

    let localOrders: StoreOrder[] = [];
    try {
      const raw = localStorage.getItem(LOCAL_ORDERS_KEY);
      if (raw) localOrders = JSON.parse(raw);
    } catch {
      localOrders = [];
    }

    const map = new Map<string, StoreOrder>();
    for (const o of localOrders) {
      if (isAdmin || (userId && o.user_id === userId) || (!userId && o.user_id === 'guest')) {
        map.set(o.id, o);
      }
    }
    for (const o of dbOrders) {
      if (o && o.id) map.set(o.id, o);
    }

    return Array.from(map.values()).sort(
      (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
    );
  },

  async createOrder(order: Omit<StoreOrder, 'id' | 'order_number' | 'created_at' | 'updated_at'>): Promise<StoreOrder> {
    const now = new Date().toISOString();
    const orderNum = `SL-${Math.floor(100000 + Math.random() * 900000)}`;
    const id = sanitizeId(`ord-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`);
    const payload: StoreOrder = {
      ...order,
      id,
      order_number: orderNum,
      created_at: now,
      updated_at: now,
    };

    try {
      const raw = localStorage.getItem(LOCAL_ORDERS_KEY);
      const list: StoreOrder[] = raw ? JSON.parse(raw) : [];
      list.unshift(payload);
      localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(list));
    } catch {
      // ignore
    }

    if (order.user_id && order.user_id !== 'guest') {
      try {
        await dbService.create('store_orders', payload);
        if (order.payment_status === 'paid') {
          await dbService.create('transactions', {
            user_id: order.user_id,
            amount: order.total,
            currency: order.currency,
            status: 'completed',
            order_id: orderNum,
            description: `Streamlify Store Order ${orderNum} (${order.items.length} items)`,
            created_at: now,
          });
        }
      } catch (e) {
        console.warn('Firestore order save failed, kept in local orders:', e);
      }
    }

    return payload;
  },

  async updateOrderStatus(orderId: string, status: OrderStatus, trackingNumber?: string): Promise<void> {
    const updated_at = new Date().toISOString();
    const patch: any = { status, updated_at };
    if (trackingNumber !== undefined) {
      patch.tracking_number = trackingNumber;
    }

    try {
      const raw = localStorage.getItem(LOCAL_ORDERS_KEY);
      if (raw) {
        const list: StoreOrder[] = JSON.parse(raw);
        const updated = list.map((o) => (o.id === orderId ? { ...o, ...patch } : o));
        localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(updated));
      }
    } catch {
      // ignore
    }

    try {
      await dbService.update('store_orders', orderId, patch);
    } catch (e) {
      console.warn('Firestore updateOrderStatus failed:', e);
    }
  },

  async updateOrderPaymentStatus(
    orderId: string,
    paymentStatus: StoreOrder['payment_status']
  ): Promise<void> {
    const updated_at = new Date().toISOString();
    const patch = { payment_status: paymentStatus, updated_at };
    try {
      const raw = localStorage.getItem(LOCAL_ORDERS_KEY);
      if (raw) {
        const list: StoreOrder[] = JSON.parse(raw);
        const updated = list.map((o) => (o.id === orderId ? { ...o, ...patch } : o));
        localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(updated));
      }
    } catch {
      // ignore
    }
    try {
      await dbService.update('store_orders', orderId, patch);
    } catch (e) {
      console.warn('Firestore updateOrderPaymentStatus failed:', e);
    }
  },

  async fetchReviews(productId: string): Promise<StoreReview[]> {
    let dbReviews: StoreReview[] = [];
    let dbSucceeded = false;
    try {
      const res = await dbService.getAll('store_reviews', { product_id: productId });
      if (Array.isArray(res)) {
        dbReviews = res as StoreReview[];
        dbSucceeded = true;
      }
    } catch {
      dbReviews = [];
    }

    let localReviews: StoreReview[] = [];
    if (!dbSucceeded) {
      try {
        const raw = localStorage.getItem(LOCAL_REVIEWS_KEY);
        if (raw) {
          localReviews = (JSON.parse(raw) as StoreReview[]).filter((r) => r.product_id === productId);
        }
      } catch {
        localReviews = [];
      }
    }

    const map = new Map<string, StoreReview>();
    for (const r of dbSucceeded ? dbReviews : localReviews) {
      if (r && r.id) map.set(r.id, r);
    }

    return Array.from(map.values()).sort(
      (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
    );
  },

  async fetchAllReviews(): Promise<StoreReview[]> {
    let dbReviews: StoreReview[] = [];
    let dbSucceeded = false;
    try {
      const res = await dbService.getAll('store_reviews');
      if (Array.isArray(res)) {
        dbReviews = res as StoreReview[];
        dbSucceeded = true;
      }
    } catch {
      dbReviews = [];
    }

    let localReviews: StoreReview[] = [];
    if (!dbSucceeded) {
      try {
        const raw = localStorage.getItem(LOCAL_REVIEWS_KEY);
        if (raw) localReviews = JSON.parse(raw);
      } catch {
        localReviews = [];
      }
    } else {
      try {
        localStorage.setItem(LOCAL_REVIEWS_KEY, JSON.stringify(dbReviews));
      } catch {
        // ignore
      }
    }

    const map = new Map<string, StoreReview>();
    for (const r of dbSucceeded ? dbReviews : localReviews) {
      if (r && r.id) map.set(r.id, r);
    }

    return Array.from(map.values()).sort(
      (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
    );
  },

  getVerifiedPurchaseOrder(
    orders: StoreOrder[],
    userId: string | undefined,
    productId: string
  ): StoreOrder | null {
    if (!userId || userId === 'guest' || !productId) return null;
    for (const order of orders) {
      if (!order || order.status === 'cancelled') continue;
      if (order.user_id !== userId) continue;
      const bought = (order.items || []).some((it) => it.product_id === productId);
      if (bought) return order;
    }
    return null;
  },

  async submitReview(review: Omit<StoreReview, 'id' | 'created_at'>): Promise<StoreReview> {
    if (!review.user_id || review.user_id === 'guest') {
      throw new Error('Sign in required to post a verified product review.');
    }
    const id = sanitizeId(`rev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`);
    const payload: StoreReview = {
      ...review,
      id,
      title: String(review.title || '').trim().slice(0, 140) || 'Verified Buyer Review',
      comment: String(review.comment || '').trim().slice(0, 1000),
      rating: Math.min(5, Math.max(1, Math.round(Number(review.rating) || 5))),
      verified_purchase: Boolean(review.verified_purchase),
      ...(review.verified_order_number
        ? { verified_order_number: String(review.verified_order_number).slice(0, 64) }
        : {}),
      created_at: new Date().toISOString(),
    };

    try {
      const raw = localStorage.getItem(LOCAL_REVIEWS_KEY);
      const list: StoreReview[] = raw ? JSON.parse(raw) : [];
      list.unshift(payload);
      localStorage.setItem(LOCAL_REVIEWS_KEY, JSON.stringify(list));
    } catch {
      // ignore
    }

    await dbService.create('store_reviews', payload);
    return payload;
  },

  async updateReview(
    reviewId: string,
    patch: { rating: number; title: string; comment: string }
  ): Promise<StoreReview | null> {
    const cleanPatch = {
      rating: Math.min(5, Math.max(1, Math.round(Number(patch.rating) || 5))),
      title: String(patch.title || '').trim().slice(0, 140) || 'Verified Buyer Review',
      comment: String(patch.comment || '').trim().slice(0, 1000),
      updated_at: new Date().toISOString(),
    };

    let updatedReview: StoreReview | null = null;
    try {
      const raw = localStorage.getItem(LOCAL_REVIEWS_KEY);
      if (raw) {
        const list: StoreReview[] = JSON.parse(raw);
        const nextList = list.map((r) => {
          if (r.id === reviewId) {
            updatedReview = { ...r, ...cleanPatch };
            return updatedReview;
          }
          return r;
        });
        localStorage.setItem(LOCAL_REVIEWS_KEY, JSON.stringify(nextList));
      }
    } catch {
      // ignore
    }

    await dbService.update('store_reviews', reviewId, cleanPatch);
    return updatedReview;
  },

  async deleteReview(reviewId: string): Promise<void> {
    try {
      const raw = localStorage.getItem(LOCAL_REVIEWS_KEY);
      if (raw) {
        const list: StoreReview[] = JSON.parse(raw);
        localStorage.setItem(LOCAL_REVIEWS_KEY, JSON.stringify(list.filter((r) => r.id !== reviewId)));
      }
    } catch {
      // ignore
    }
    try {
      await dbService.remove('store_reviews', reviewId);
    } catch (e) {
      console.warn('Firestore deleteReview failed:', e);
    }
  },

  async fetchWishlist(userId?: string): Promise<string[]> {
    let localIds: string[] = [];
    try {
      const raw = localStorage.getItem(LOCAL_WISHLIST_KEY);
      if (raw) localIds = JSON.parse(raw);
    } catch {
      localIds = [];
    }

    if (!userId || userId === 'guest') {
      return Array.from(new Set(localIds));
    }

    try {
      const res = await dbService.getAll('store_wishlist', { user_id: userId });
      if (Array.isArray(res)) {
        const dbIds = (res as StoreWishlistItem[]).map((item) => item.product_id).filter(Boolean);
        const merged = Array.from(new Set([...dbIds, ...localIds]));
        try {
          localStorage.setItem(LOCAL_WISHLIST_KEY, JSON.stringify(merged));
        } catch {
          // ignore
        }
        return merged;
      }
    } catch (e) {
      console.warn('StoreService.fetchWishlist fallback:', e);
    }
    return Array.from(new Set(localIds));
  },

  async toggleWishlistItem(userId: string | undefined, productId: string, currentlySaved: boolean): Promise<boolean> {
    let list: string[] = [];
    try {
      const raw = localStorage.getItem(LOCAL_WISHLIST_KEY);
      if (raw) list = JSON.parse(raw);
    } catch {
      list = [];
    }

    const nextSaved = !currentlySaved;
    const nextList = nextSaved
      ? Array.from(new Set([...list, productId]))
      : list.filter((id) => id !== productId);

    try {
      localStorage.setItem(LOCAL_WISHLIST_KEY, JSON.stringify(nextList));
    } catch {
      // ignore
    }

    if (userId && userId !== 'guest') {
      const docId = sanitizeId(`${userId}_${productId}`);
      try {
        if (nextSaved) {
          await dbService.create('store_wishlist', {
            id: docId,
            user_id: userId,
            product_id: productId,
            created_at: new Date().toISOString(),
          });
        } else {
          await dbService.remove('store_wishlist', docId);
        }
      } catch (e) {
        console.warn('Firestore toggleWishlistItem failed:', e);
      }
    }

    return nextSaved;
  },

  async clearWishlist(userId: string | undefined, productIds: string[]): Promise<void> {
    try {
      localStorage.setItem(LOCAL_WISHLIST_KEY, JSON.stringify([]));
    } catch {
      // ignore
    }
    if (userId && userId !== 'guest') {
      await Promise.all(
        productIds.map((pid) =>
          dbService.remove('store_wishlist', sanitizeId(`${userId}_${pid}`)).catch(() => undefined)
        )
      );
    }
  },

  computeProductOrderMetrics(orders: StoreOrder[]): Record<string, ProductOrderMetrics> {
    const map: Record<string, ProductOrderMetrics> = {};
    for (const order of orders) {
      if (!order || order.status === 'cancelled') continue;
      const seenProductsInOrder = new Set<string>();
      for (const item of order.items || []) {
        if (!item.product_id) continue;
        if (!map[item.product_id]) {
          map[item.product_id] = { unitsOrdered: 0, revenueUsd: 0, orderCount: 0 };
        }
        const qty = Math.max(0, Number(item.quantity) || 0);
        const lineTotal = (Number(item.unit_price) || 0) * qty;
        const lineUsd = order.currency === 'INR' ? lineTotal / 83.5 : lineTotal;
        map[item.product_id].unitsOrdered += qty;
        map[item.product_id].revenueUsd += lineUsd;
        if (!seenProductsInOrder.has(item.product_id)) {
          map[item.product_id].orderCount += 1;
          seenProductsInOrder.add(item.product_id);
        }
      }
    }
    return map;
  },

  computeProductReviewMetrics(reviews: StoreReview[]): Record<string, ProductReviewMetrics> {
    const sums: Record<string, { total: number; count: number }> = {};
    for (const rev of reviews) {
      if (!rev.product_id) continue;
      if (!sums[rev.product_id]) sums[rev.product_id] = { total: 0, count: 0 };
      sums[rev.product_id].total += Math.min(5, Math.max(1, Number(rev.rating) || 0));
      sums[rev.product_id].count += 1;
    }
    const result: Record<string, ProductReviewMetrics> = {};
    for (const [pid, data] of Object.entries(sums)) {
      result[pid] = {
        averageRating: data.count > 0 ? Number((data.total / data.count).toFixed(1)) : 0,
        reviewCount: data.count,
      };
    }
    return result;
  },

  async fetchAlertConfig(): Promise<StoreAlertConfig> {
    try {
      const remote = await dbService.get('store_alert_settings', 'default');
      if (remote && typeof remote === 'object') {
        const merged: StoreAlertConfig = {
          ...DEFAULT_STORE_ALERT_CONFIG,
          ...(remote as Partial<StoreAlertConfig>),
          id: 'default',
        };
        try {
          localStorage.setItem(LOCAL_ALERT_CONFIG_KEY, JSON.stringify(merged));
        } catch {
          // ignore
        }
        return merged;
      }
    } catch (e) {
      console.warn('StoreService.fetchAlertConfig fallback:', e);
    }

    try {
      const raw = localStorage.getItem(LOCAL_ALERT_CONFIG_KEY);
      if (raw) {
        return { ...DEFAULT_STORE_ALERT_CONFIG, ...JSON.parse(raw), id: 'default' };
      }
    } catch {
      // ignore
    }
    return { ...DEFAULT_STORE_ALERT_CONFIG };
  },

  async saveAlertConfig(config: Partial<StoreAlertConfig>, updatedBy?: string): Promise<StoreAlertConfig> {
    const payload: StoreAlertConfig = {
      id: 'default',
      enabled: config.enabled !== false,
      scope: config.scope || 'popular_cricket',
      popular_threshold: Math.max(0, Math.min(10000, Math.round(Number(config.popular_threshold ?? 10)))),
      default_threshold: Math.max(0, Math.min(10000, Math.round(Number(config.default_threshold ?? 5)))),
      popular_min_units_ordered: Math.max(1, Math.min(10000, Math.round(Number(config.popular_min_units_ordered ?? 3)))),
      sync_to_global_bell: config.sync_to_global_bell !== false,
      toast_on_trigger: config.toast_on_trigger !== false,
      updated_by: String(updatedBy || '').slice(0, 128),
      updated_at: new Date().toISOString(),
    };

    try {
      localStorage.setItem(LOCAL_ALERT_CONFIG_KEY, JSON.stringify(payload));
    } catch {
      // ignore
    }

    await dbService.upsert('store_alert_settings', payload);
    return payload;
  },

  async fetchStockAlerts(): Promise<StoreStockAlert[]> {
    let dbAlerts: StoreStockAlert[] = [];
    let dbSucceeded = false;
    try {
      const res = await dbService.getAll('store_stock_alerts');
      if (Array.isArray(res)) {
        dbAlerts = res as StoreStockAlert[];
        dbSucceeded = true;
      }
    } catch (e) {
      console.warn('StoreService.fetchStockAlerts fallback:', e);
    }

    let localAlerts: StoreStockAlert[] = [];
    if (!dbSucceeded) {
      try {
        const raw = localStorage.getItem(LOCAL_STOCK_ALERTS_KEY);
        if (raw) localAlerts = JSON.parse(raw);
      } catch {
        localAlerts = [];
      }
    } else {
      try {
        localStorage.setItem(LOCAL_STOCK_ALERTS_KEY, JSON.stringify(dbAlerts));
      } catch {
        // ignore
      }
    }

    const map = new Map<string, StoreStockAlert>();
    for (const a of dbSucceeded ? dbAlerts : localAlerts) {
      if (a && a.id) map.set(a.id, a);
    }

    return Array.from(map.values()).sort(
      (a, b) => new Date(b.updated_at || b.created_at || 0).getTime() - new Date(a.updated_at || a.created_at || 0).getTime()
    );
  },

  async saveStockAlert(alert: StoreStockAlert): Promise<StoreStockAlert> {
    const cleanAlert: StoreStockAlert = {
      ...alert,
      id: sanitizeId(alert.id),
      product_id: String(alert.product_id).slice(0, 128),
      product_name: String(alert.product_name).slice(0, 160),
      sku: String(alert.sku).slice(0, 64),
      brand: String(alert.brand || '').slice(0, 64),
      domain: String(alert.domain || '').slice(0, 64),
      sport_type: String(alert.sport_type || '').slice(0, 64),
      current_stock: Math.max(0, Math.round(Number(alert.current_stock) || 0)),
      threshold: Math.max(0, Math.round(Number(alert.threshold) || 0)),
      popularity_reason: String(alert.popularity_reason || '').slice(0, 160),
      units_ordered: Math.max(0, Math.round(Number(alert.units_ordered) || 0)),
      updated_at: alert.updated_at || new Date().toISOString(),
    };

    try {
      const raw = localStorage.getItem(LOCAL_STOCK_ALERTS_KEY);
      const list: StoreStockAlert[] = raw ? JSON.parse(raw) : [];
      const idx = list.findIndex((item) => item.id === cleanAlert.id);
      if (idx >= 0) list[idx] = cleanAlert;
      else list.unshift(cleanAlert);
      localStorage.setItem(LOCAL_STOCK_ALERTS_KEY, JSON.stringify(list));
    } catch {
      // ignore
    }

    await dbService.upsert('store_stock_alerts', cleanAlert);
    return cleanAlert;
  },

  async deleteStockAlert(alertId: string): Promise<void> {
    try {
      const raw = localStorage.getItem(LOCAL_STOCK_ALERTS_KEY);
      if (raw) {
        const list: StoreStockAlert[] = JSON.parse(raw);
        localStorage.setItem(LOCAL_STOCK_ALERTS_KEY, JSON.stringify(list.filter((a) => a.id !== alertId)));
      }
    } catch {
      // ignore
    }
    try {
      await dbService.remove('store_stock_alerts', alertId);
    } catch (e) {
      console.warn('Firestore delete stock alert failed:', e);
    }
  },

  evaluateProductMonitoring(
    product: StoreProduct,
    orderMetrics: ProductOrderMetrics | undefined,
    reviewMetrics: ProductReviewMetrics | undefined,
    config: StoreAlertConfig
  ): {
    isCricket: boolean;
    isPopular: boolean;
    popularityReason: string;
    shouldMonitor: boolean;
    threshold: number;
    isTriggered: boolean;
    severity: StoreAlertSeverity;
  } {
    const isCricket =
      product.domain === 'Cricket' ||
      String(product.sport_type || '').toLowerCase().includes('cricket');

    const unitsOrdered = orderMetrics?.unitsOrdered || product.units_ordered || 0;
    const avgRating = reviewMetrics?.averageRating || product.rating || 0;
    const reviewCount = reviewMetrics?.reviewCount || product.review_count || 0;

    const reasons: string[] = [];
    if (product.featured) reasons.push('Featured Gear');
    if (unitsOrdered >= (config.popular_min_units_ordered || 3)) {
      reasons.push(`${unitsOrdered} units ordered`);
    }
    if (reviewCount > 0 && avgRating >= 4.0) {
      reasons.push(`${avgRating.toFixed(1)}★ top-rated`);
    }

    const isPopular = reasons.length > 0;
    const popularityReason =
      reasons.length > 0
        ? reasons.join(' · ')
        : isCricket
        ? 'Standard Cricket Catalog'
        : 'Standard Catalog';

    let shouldMonitor = product.is_active !== false;
    if (shouldMonitor) {
      if (config.scope === 'popular_cricket') {
        shouldMonitor = isCricket && (isPopular || product.stock === 0);
      } else if (config.scope === 'all_cricket') {
        shouldMonitor = isCricket;
      } else if (config.scope === 'all_popular') {
        shouldMonitor = isPopular || product.stock === 0;
      } else {
        shouldMonitor = true;
      }
    }

    const threshold =
      typeof product.low_stock_threshold === 'number' && product.low_stock_threshold >= 0
        ? product.low_stock_threshold
        : isPopular
        ? config.popular_threshold
        : config.default_threshold;

    const isTriggered = config.enabled && shouldMonitor && product.stock <= threshold;

    let severity: StoreAlertSeverity = 'low';
    if (product.stock === 0) {
      severity = 'out_of_stock';
    } else if (product.stock <= Math.max(1, Math.floor(threshold / 2))) {
      severity = 'critical';
    }

    return {
      isCricket,
      isPopular,
      popularityReason,
      shouldMonitor,
      threshold,
      isTriggered,
      severity,
    };
  },

  async syncAutomatedStockAlerts(params: {
    products: StoreProduct[];
    orders: StoreOrder[];
    reviews: StoreReview[];
    config: StoreAlertConfig;
    existingAlerts: StoreStockAlert[];
    adminUserId?: string;
  }): Promise<{
    alerts: StoreStockAlert[];
    newlyTriggered: StoreStockAlert[];
    autoResolved: StoreStockAlert[];
  }> {
    const { products, orders, reviews, config, existingAlerts, adminUserId } = params;
    const orderMap = this.computeProductOrderMetrics(orders);
    const reviewMap = this.computeProductReviewMetrics(reviews);
    const now = new Date().toISOString();

    const existingByProduct = new Map<string, StoreStockAlert>();
    const preservedResolved: StoreStockAlert[] = [];

    for (const a of existingAlerts) {
      if (a.status === 'resolved') {
        preservedResolved.push(a);
      } else if (a.product_id) {
        const prev = existingByProduct.get(a.product_id);
        if (!prev || new Date(a.updated_at).getTime() > new Date(prev.updated_at).getTime()) {
          existingByProduct.set(a.product_id, a);
        }
      }
    }

    const updatedAlerts: StoreStockAlert[] = [...preservedResolved];
    const newlyTriggered: StoreStockAlert[] = [];
    const autoResolved: StoreStockAlert[] = [];
    const writeOps: Promise<any>[] = [];
    const seenProductIds = new Set<string>();

    for (const product of products) {
      seenProductIds.add(product.id);
      const evalRes = this.evaluateProductMonitoring(
        product,
        orderMap[product.id],
        reviewMap[product.id],
        config
      );
      const existingOpen = existingByProduct.get(product.id);

      if (evalRes.isTriggered) {
        const unitsOrdered = orderMap[product.id]?.unitsOrdered || product.units_ordered || 0;
        const alertId = existingOpen?.id || sanitizeId(`alert-${product.id}`);
        const escalatedOrNew =
          !existingOpen ||
          (existingOpen.severity !== evalRes.severity &&
            (evalRes.severity === 'out_of_stock' ||
              (evalRes.severity === 'critical' && existingOpen.severity === 'low')));

        const nextAlert: StoreStockAlert = {
          id: alertId,
          product_id: product.id,
          product_name: product.name,
          sku: product.sku,
          brand: product.brand,
          domain: product.domain,
          sport_type: product.sport_type,
          current_stock: product.stock,
          threshold: evalRes.threshold,
          severity: evalRes.severity,
          status: escalatedOrNew ? 'active' : existingOpen?.status || 'active',
          is_read: escalatedOrNew ? false : Boolean(existingOpen?.is_read),
          is_popular: evalRes.isPopular,
          popularity_reason: evalRes.popularityReason,
          units_ordered: unitsOrdered,
          created_at: existingOpen?.created_at || now,
          updated_at:
            !existingOpen ||
            existingOpen.current_stock !== product.stock ||
            existingOpen.threshold !== evalRes.threshold ||
            existingOpen.severity !== evalRes.severity
              ? now
              : existingOpen.updated_at,
        };

        updatedAlerts.push(nextAlert);

        if (
          !existingOpen ||
          existingOpen.current_stock !== product.stock ||
          existingOpen.threshold !== evalRes.threshold ||
          existingOpen.severity !== evalRes.severity ||
          existingOpen.popularity_reason !== evalRes.popularityReason
        ) {
          writeOps.push(this.saveStockAlert(nextAlert));
        }

        if (escalatedOrNew) {
          newlyTriggered.push(nextAlert);
          if (config.sync_to_global_bell && adminUserId) {
            const notifId = sanitizeId(`store-stock-${product.id}-${evalRes.severity}`);
            writeOps.push(
              dbService
                .upsert('notifications', {
                  id: notifId,
                  user_id: adminUserId,
                  title:
                    evalRes.severity === 'out_of_stock'
                      ? `Out of Stock: ${product.name}`
                      : `Low Stock Alert: ${product.name}`,
                  body: `${product.brand} (${product.sku}) has ${product.stock} unit${product.stock === 1 ? '' : 's'} left (threshold ≤ ${evalRes.threshold}). ${evalRes.popularityReason}.`,
                  type: 'system',
                  is_read: false,
                  created_at: now,
                  action_url: 'Store Admin',
                })
                .catch((err) => console.warn('Global bell sync skipped:', err))
            );
          }
        }
      } else if (existingOpen) {
        const resolvedAlert: StoreStockAlert = {
          ...existingOpen,
          current_stock: product.stock,
          threshold: evalRes.threshold,
          status: 'resolved',
          is_read: true,
          resolved_at: now,
          updated_at: now,
        };
        autoResolved.push(resolvedAlert);
        updatedAlerts.push(resolvedAlert);
        writeOps.push(this.saveStockAlert(resolvedAlert));
      }
    }

    // Resolve orphaned open alerts whose products were removed
    for (const [pid, orphan] of existingByProduct.entries()) {
      if (!seenProductIds.has(pid)) {
        const resolvedOrphan: StoreStockAlert = {
          ...orphan,
          status: 'resolved',
          is_read: true,
          resolved_at: now,
          updated_at: now,
        };
        updatedAlerts.push(resolvedOrphan);
        writeOps.push(this.saveStockAlert(resolvedOrphan));
      }
    }

    if (writeOps.length > 0) {
      await Promise.allSettled(writeOps);
    }

    const sorted = updatedAlerts.sort(
      (a, b) => new Date(b.updated_at || b.created_at || 0).getTime() - new Date(a.updated_at || a.created_at || 0).getTime()
    );
    return { alerts: sorted, newlyTriggered, autoResolved };
  },

  async fetchRestockRequests(userId?: string, isAdmin = false): Promise<StoreRestockRequest[]> {
    let dbRequests: StoreRestockRequest[] = [];
    let dbSucceeded = false;
    try {
      if (isAdmin) {
        const res = await dbService.getAll('store_restock_requests');
        if (Array.isArray(res)) {
          dbRequests = res as StoreRestockRequest[];
          dbSucceeded = true;
        }
      } else if (userId && userId !== 'guest') {
        const res = await dbService.getAll('store_restock_requests', { user_id: userId });
        if (Array.isArray(res)) {
          dbRequests = res as StoreRestockRequest[];
          dbSucceeded = true;
        }
      }
    } catch (e) {
      console.warn('StoreService.fetchRestockRequests fallback:', e);
    }

    let localRequests: StoreRestockRequest[] = [];
    try {
      const raw = localStorage.getItem(LOCAL_RESTOCK_KEY);
      if (raw) localRequests = JSON.parse(raw);
    } catch {
      localRequests = [];
    }

    const map = new Map<string, StoreRestockRequest>();
    for (const r of localRequests) {
      if (!r || !r.id) continue;
      if (isAdmin || (userId && r.user_id === userId) || (!userId || userId === 'guest')) {
        map.set(r.id, r);
      }
    }
    if (dbSucceeded) {
      for (const r of dbRequests) {
        if (r && r.id) map.set(r.id, r);
      }
      if (isAdmin) {
        try {
          localStorage.setItem(LOCAL_RESTOCK_KEY, JSON.stringify(Array.from(map.values())));
        } catch {
          // ignore
        }
      }
    }

    return Array.from(map.values()).sort(
      (a, b) => new Date(b.updated_at || b.created_at || 0).getTime() - new Date(a.updated_at || a.created_at || 0).getTime()
    );
  },

  async subscribeRestockAlert(params: {
    product: StoreProduct;
    email: string;
    userId?: string;
    userName?: string;
  }): Promise<StoreRestockRequest> {
    const cleanEmail = params.email.trim().toLowerCase().slice(0, 160);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      throw new Error('Please enter a valid email address for restock alerts.');
    }

    const now = new Date().toISOString();
    const emailSlug = cleanEmail.replace(/[^a-z0-9]/g, '_').slice(0, 48);
    const id = sanitizeId(`rstk-${params.product.id.slice(0, 48)}-${emailSlug}`);

    let existingCreatedAt = now;
    try {
      const raw = localStorage.getItem(LOCAL_RESTOCK_KEY);
      if (raw) {
        const list: StoreRestockRequest[] = JSON.parse(raw);
        const found = list.find((item) => item.id === id);
        if (found?.created_at) existingCreatedAt = found.created_at;
      }
    } catch {
      // ignore
    }

    const payload: StoreRestockRequest = {
      id,
      product_id: String(params.product.id).slice(0, 128),
      product_name: String(params.product.name).slice(0, 160),
      sku: String(params.product.sku).slice(0, 64),
      brand: String(params.product.brand || '').slice(0, 64),
      email: cleanEmail,
      user_id: params.userId && params.userId !== 'guest' ? params.userId : 'guest',
      user_name: String(params.userName || '').trim().slice(0, 100) || undefined,
      status: 'waiting',
      created_at: existingCreatedAt,
      updated_at: now,
    };

    try {
      const raw = localStorage.getItem(LOCAL_RESTOCK_KEY);
      const list: StoreRestockRequest[] = raw ? JSON.parse(raw) : [];
      const idx = list.findIndex((item) => item.id === id);
      if (idx >= 0) list[idx] = payload;
      else list.unshift(payload);
      localStorage.setItem(LOCAL_RESTOCK_KEY, JSON.stringify(list));
    } catch {
      // ignore
    }

    await dbService.upsert('store_restock_requests', payload);
    return payload;
  },

  async cancelRestockRequest(requestId: string): Promise<void> {
    const now = new Date().toISOString();
    try {
      const raw = localStorage.getItem(LOCAL_RESTOCK_KEY);
      if (raw) {
        const list: StoreRestockRequest[] = JSON.parse(raw);
        const updated = list.map((r) =>
          r.id === requestId ? { ...r, status: 'cancelled' as const, updated_at: now } : r
        );
        localStorage.setItem(LOCAL_RESTOCK_KEY, JSON.stringify(updated));
      }
    } catch {
      // ignore
    }
    try {
      await dbService.update('store_restock_requests', requestId, { status: 'cancelled', updated_at: now });
    } catch (e) {
      console.warn('Firestore cancelRestockRequest failed:', e);
    }
  },

  async deleteRestockRequest(requestId: string): Promise<void> {
    try {
      const raw = localStorage.getItem(LOCAL_RESTOCK_KEY);
      if (raw) {
        const list: StoreRestockRequest[] = JSON.parse(raw);
        localStorage.setItem(LOCAL_RESTOCK_KEY, JSON.stringify(list.filter((r) => r.id !== requestId)));
      }
    } catch {
      // ignore
    }
    try {
      await dbService.remove('store_restock_requests', requestId);
    } catch (e) {
      console.warn('Firestore deleteRestockRequest failed:', e);
    }
  },

  computeWaitlistCountsByProduct(requests: StoreRestockRequest[]): Record<string, number> {
    const map: Record<string, number> = {};
    for (const r of requests) {
      if (r && r.product_id && r.status === 'waiting') {
        map[r.product_id] = (map[r.product_id] || 0) + 1;
      }
    }
    return map;
  },

  async notifyRestockSubscribers(params: {
    product: StoreProduct;
    requests: StoreRestockRequest[];
    authToken?: string;
    productUrl?: string;
  }): Promise<{ notifiedCount: number; updatedRequests: StoreRestockRequest[]; deliveredViaEmail: boolean }> {
    const { product, requests, authToken, productUrl } = params;
    const waiting = requests.filter((r) => r.product_id === product.id && r.status === 'waiting');
    if (waiting.length === 0) {
      return { notifiedCount: 0, updatedRequests: requests, deliveredViaEmail: false };
    }

    const now = new Date().toISOString();
    const updatedMap = new Map<string, StoreRestockRequest>();
    for (const w of waiting) {
      updatedMap.set(w.id, {
        ...w,
        status: 'notified',
        notified_at: now,
        updated_at: now,
        last_stock_notified: product.stock,
      });
    }

    const updatedAll = requests.map((r) => updatedMap.get(r.id) || r);
    try {
      localStorage.setItem(LOCAL_RESTOCK_KEY, JSON.stringify(updatedAll));
    } catch {
      // ignore
    }

    const writeOps: Promise<any>[] = [];
    for (const nextReq of updatedMap.values()) {
      writeOps.push(dbService.upsert('store_restock_requests', nextReq));
      if (nextReq.user_id && nextReq.user_id !== 'guest') {
        const notifId = sanitizeId(`restock-notif-${product.id}-${nextReq.user_id}`);
        writeOps.push(
          dbService
            .upsert('notifications', {
              id: notifId,
              user_id: nextReq.user_id,
              title: `Back in Stock: ${product.name}`,
              body: `${product.brand} (${product.sku}) is back in stock with ${product.stock} unit${product.stock === 1 ? '' : 's'} ready to ship.`,
              type: 'system',
              is_read: false,
              created_at: now,
              action_url: `/?tab=store&product=${encodeURIComponent(product.id)}`,
            })
            .catch(() => undefined)
        );
      }
    }
    await Promise.allSettled(writeOps);

    let deliveredViaEmail = false;
    if (authToken) {
      try {
        const res = await fetch('/api/store/notify-restock', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            productId: product.id,
            productName: product.name,
            sku: product.sku,
            brand: product.brand,
            stock: product.stock,
            productUrl,
            recipients: waiting.map((w) => ({ email: w.email, userName: w.user_name })),
          }),
        });
        if (res.ok) {
          const data = await res.json();
          deliveredViaEmail = data?.deliveryMode === 'resend';
        }
      } catch (e) {
        console.warn('Restock email API call skipped:', e);
      }
    }

    return {
      notifiedCount: waiting.length,
      updatedRequests: updatedAll,
      deliveredViaEmail,
    };
  },

  getStoreSessionId(): string {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        let sid = window.sessionStorage.getItem(STORE_SESSION_STORAGE_KEY);
        if (!sid) {
          sid = sanitizeId(`sess-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
          window.sessionStorage.setItem(STORE_SESSION_STORAGE_KEY, sid);
        }
        return sid;
      }
    } catch {
      // ignore
    }
    return sanitizeId(`sess-${Date.now()}`);
  },

  getSavedShippingAddress(userId?: string): StoreSavedAddress | null {
    const key = `${LOCAL_SAVED_ADDRESS_KEY}_${userId || 'guest'}`;
    try {
      const raw = localStorage.getItem(key) || localStorage.getItem(LOCAL_SAVED_ADDRESS_KEY);
      if (raw) return JSON.parse(raw) as StoreSavedAddress;
    } catch {
      // ignore
    }
    return null;
  },

  saveShippingAddress(userId: string | undefined, addr: StoreSavedAddress): void {
    const key = `${LOCAL_SAVED_ADDRESS_KEY}_${userId || 'guest'}`;
    try {
      const payload = JSON.stringify(addr);
      localStorage.setItem(key, payload);
      localStorage.setItem(LOCAL_SAVED_ADDRESS_KEY, payload);
    } catch {
      // ignore
    }
  },

  async fetchSavedPaymentMethods(userId?: string): Promise<StoreSavedPaymentMethod[]> {
    const effectiveUid = userId && userId !== 'guest' ? userId : 'guest';
    let dbMethods: StoreSavedPaymentMethod[] = [];
    let dbSucceeded = false;

    if (effectiveUid !== 'guest') {
      try {
        const res = await dbService.getAll('store_payment_methods', { user_id: effectiveUid });
        if (Array.isArray(res)) {
          dbMethods = res as StoreSavedPaymentMethod[];
          dbSucceeded = true;
        }
      } catch (e) {
        console.warn('StoreService.fetchSavedPaymentMethods fallback:', e);
      }
    }

    let localMethods: StoreSavedPaymentMethod[] = [];
    try {
      const raw = localStorage.getItem(LOCAL_PAYMENT_METHODS_KEY);
      if (raw) {
        localMethods = (JSON.parse(raw) as StoreSavedPaymentMethod[]).filter(
          (m) => m && m.user_id === effectiveUid
        );
      }
    } catch {
      localMethods = [];
    }

    const map = new Map<string, StoreSavedPaymentMethod>();
    for (const m of localMethods) {
      if (m && m.id) map.set(m.id, m);
    }
    if (dbSucceeded) {
      for (const m of dbMethods) {
        if (m && m.id) map.set(m.id, m);
      }
      try {
        const rawAll = localStorage.getItem(LOCAL_PAYMENT_METHODS_KEY);
        const others: StoreSavedPaymentMethod[] = rawAll
          ? (JSON.parse(rawAll) as StoreSavedPaymentMethod[]).filter((m) => m.user_id !== effectiveUid)
          : [];
        localStorage.setItem(LOCAL_PAYMENT_METHODS_KEY, JSON.stringify([...Array.from(map.values()), ...others]));
      } catch {
        // ignore
      }
    }

    return Array.from(map.values()).sort((a, b) => {
      if (a.is_default !== b.is_default) return a.is_default ? -1 : 1;
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    });
  },

  async savePaymentMethod(params: {
    userId?: string;
    provider: SavedPaymentProvider;
    label: string;
    brand?: string;
    last4?: string;
    expiry?: string;
    isDefault?: boolean;
  }): Promise<StoreSavedPaymentMethod> {
    const effectiveUid = params.userId && params.userId !== 'guest' ? params.userId : 'guest';
    const now = new Date().toISOString();
    const id = sanitizeId(`pm-${effectiveUid.slice(0, 24)}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`);
    const makeDefault = params.isDefault !== false;

    const payload: StoreSavedPaymentMethod = {
      id,
      user_id: effectiveUid,
      provider: params.provider,
      label: String(params.label).trim().slice(0, 80),
      ...(params.brand ? { brand: String(params.brand).trim().slice(0, 40) } : {}),
      ...(params.last4 ? { last4: String(params.last4).trim().slice(0, 12) } : {}),
      ...(params.expiry ? { expiry: String(params.expiry).trim().slice(0, 10) } : {}),
      is_default: makeDefault,
      created_at: now,
    };

    try {
      const raw = localStorage.getItem(LOCAL_PAYMENT_METHODS_KEY);
      const list: StoreSavedPaymentMethod[] = raw ? JSON.parse(raw) : [];
      const updatedList = list.map((m) =>
        m.user_id === effectiveUid && makeDefault ? { ...m, is_default: false } : m
      );
      updatedList.unshift(payload);
      localStorage.setItem(LOCAL_PAYMENT_METHODS_KEY, JSON.stringify(updatedList));
    } catch {
      // ignore
    }

    if (effectiveUid !== 'guest') {
      try {
        if (makeDefault) {
          const existing = await this.fetchSavedPaymentMethods(effectiveUid);
          await Promise.allSettled(
            existing
              .filter((m) => m.id !== id && m.is_default)
              .map((m) => dbService.upsert('store_payment_methods', { ...m, is_default: false }))
          );
        }
        await dbService.upsert('store_payment_methods', payload);
      } catch (e) {
        console.warn('Firestore savePaymentMethod failed:', e);
      }
    }

    return payload;
  },

  async setDefaultPaymentMethod(userId: string | undefined, methodId: string): Promise<void> {
    const effectiveUid = userId && userId !== 'guest' ? userId : 'guest';
    let targetMethods: StoreSavedPaymentMethod[] = [];
    try {
      const raw = localStorage.getItem(LOCAL_PAYMENT_METHODS_KEY);
      if (raw) {
        const list: StoreSavedPaymentMethod[] = JSON.parse(raw);
        const updated = list.map((m) =>
          m.user_id === effectiveUid ? { ...m, is_default: m.id === methodId } : m
        );
        targetMethods = updated.filter((m) => m.user_id === effectiveUid);
        localStorage.setItem(LOCAL_PAYMENT_METHODS_KEY, JSON.stringify(updated));
      }
    } catch {
      // ignore
    }

    if (effectiveUid !== 'guest') {
      try {
        if (targetMethods.length === 0) {
          targetMethods = (await this.fetchSavedPaymentMethods(effectiveUid)).map((m) => ({
            ...m,
            is_default: m.id === methodId,
          }));
        }
        await Promise.allSettled(
          targetMethods.map((m) => dbService.upsert('store_payment_methods', m))
        );
      } catch (e) {
        console.warn('Firestore setDefaultPaymentMethod failed:', e);
      }
    }
  },

  async deleteSavedPaymentMethod(methodId: string): Promise<void> {
    try {
      const raw = localStorage.getItem(LOCAL_PAYMENT_METHODS_KEY);
      if (raw) {
        const list: StoreSavedPaymentMethod[] = JSON.parse(raw);
        localStorage.setItem(LOCAL_PAYMENT_METHODS_KEY, JSON.stringify(list.filter((m) => m.id !== methodId)));
      }
    } catch {
      // ignore
    }
    try {
      await dbService.remove('store_payment_methods', methodId);
    } catch (e) {
      console.warn('Firestore deleteSavedPaymentMethod failed:', e);
    }
  },

  async trackAnalyticsEvent(params: {
    eventType: StoreAnalyticsEventType;
    product?: StoreProduct;
    userId?: string;
    checkoutMode?: 'quick_buy' | 'cart_checkout';
    revenueUsd?: number;
    units?: number;
  }): Promise<void> {
    const effectiveUid = params.userId && params.userId !== 'guest' ? params.userId : 'guest';
    const now = new Date().toISOString();
    const id = sanitizeId(`evt-${params.eventType}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`);
    const payload: StoreAnalyticsEvent = {
      id,
      event_type: params.eventType,
      session_id: this.getStoreSessionId(),
      user_id: effectiveUid,
      created_at: now,
      ...(params.product
        ? {
            product_id: String(params.product.id).slice(0, 128),
            product_name: String(params.product.name).slice(0, 160),
            brand: String(params.product.brand || '').slice(0, 64),
            domain: String(params.product.domain || '').slice(0, 64),
            sport_type: String(params.product.sport_type || '').slice(0, 64),
          }
        : {}),
      ...(params.checkoutMode ? { checkout_mode: params.checkoutMode } : {}),
      ...(typeof params.revenueUsd === 'number' && params.revenueUsd >= 0
        ? { revenue_usd: Number(params.revenueUsd.toFixed(2)) }
        : {}),
      ...(typeof params.units === 'number' && params.units >= 0 ? { units: Math.round(params.units) } : {}),
    };

    try {
      const raw = localStorage.getItem(LOCAL_ANALYTICS_EVENTS_KEY);
      const list: StoreAnalyticsEvent[] = raw ? JSON.parse(raw) : [];
      list.unshift(payload);
      localStorage.setItem(LOCAL_ANALYTICS_EVENTS_KEY, JSON.stringify(list.slice(0, 1000)));
    } catch {
      // ignore
    }

    try {
      await dbService.create('store_analytics_events', payload);
    } catch {
      // non-blocking telemetry write
    }
  },

  async fetchAnalyticsEvents(): Promise<StoreAnalyticsEvent[]> {
    let dbEvents: StoreAnalyticsEvent[] = [];
    let dbSucceeded = false;
    try {
      const res = await dbService.getAll('store_analytics_events');
      if (Array.isArray(res)) {
        dbEvents = res as StoreAnalyticsEvent[];
        dbSucceeded = true;
      }
    } catch (e) {
      console.warn('StoreService.fetchAnalyticsEvents fallback:', e);
    }

    let localEvents: StoreAnalyticsEvent[] = [];
    try {
      const raw = localStorage.getItem(LOCAL_ANALYTICS_EVENTS_KEY);
      if (raw) localEvents = JSON.parse(raw);
    } catch {
      localEvents = [];
    }

    const map = new Map<string, StoreAnalyticsEvent>();
    for (const ev of localEvents) {
      if (ev && ev.id) map.set(ev.id, ev);
    }
    if (dbSucceeded) {
      for (const ev of dbEvents) {
        if (ev && ev.id) map.set(ev.id, ev);
      }
      try {
        localStorage.setItem(LOCAL_ANALYTICS_EVENTS_KEY, JSON.stringify(Array.from(map.values()).slice(0, 1000)));
      } catch {
        // ignore
      }
    }

    return Array.from(map.values()).sort(
      (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
    );
  },

  async fetchPayoutAccounts(includeInactive = false): Promise<StorePayoutAccount[]> {
    let dbAccounts: StorePayoutAccount[] = [];
    let dbSucceeded = false;
    try {
      const res = includeInactive
        ? await dbService.getAll('store_payout_accounts')
        : await dbService.getAll('store_payout_accounts', { is_active: true });
      if (Array.isArray(res)) {
        dbAccounts = res as StorePayoutAccount[];
        dbSucceeded = true;
      }
    } catch (e) {
      console.warn('StoreService.fetchPayoutAccounts fallback:', e);
    }

    let localAccounts: StorePayoutAccount[] = [];
    try {
      const raw = localStorage.getItem(LOCAL_PAYOUT_ACCOUNTS_KEY);
      if (raw) localAccounts = JSON.parse(raw);
    } catch {
      localAccounts = [];
    }

    const map = new Map<string, StorePayoutAccount>();
    for (const acc of localAccounts) {
      if (acc && acc.id) map.set(acc.id, acc);
    }
    if (dbSucceeded) {
      if (includeInactive) {
        map.clear();
      }
      for (const acc of dbAccounts) {
        if (acc && acc.id) map.set(acc.id, acc);
      }
      try {
        localStorage.setItem(LOCAL_PAYOUT_ACCOUNTS_KEY, JSON.stringify(Array.from(map.values())));
      } catch {
        // ignore
      }
    }

    const combined = Array.from(map.values()).sort((a, b) => {
      if (a.is_primary !== b.is_primary) return a.is_primary ? -1 : 1;
      if (a.is_active !== b.is_active) return a.is_active ? -1 : 1;
      return new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime();
    });

    return includeInactive ? combined : combined.filter((a) => a.is_active !== false);
  },

  async savePayoutAccount(
    account: Omit<StorePayoutAccount, 'id' | 'created_at' | 'updated_at'> & {
      id?: string;
      created_at?: string;
    }
  ): Promise<StorePayoutAccount> {
    const now = new Date().toISOString();
    const id = sanitizeId(account.id || `pay-${account.account_type}-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`);
    const payload: StorePayoutAccount = {
      id,
      label: String(account.label || '').trim().slice(0, 80),
      account_type: account.account_type as StorePayoutAccountType,
      account_holder_name: String(account.account_holder_name || '').trim().slice(0, 120),
      ...(account.bank_name?.trim() ? { bank_name: account.bank_name.trim().slice(0, 120) } : {}),
      ...(account.account_number?.trim() ? { account_number: account.account_number.trim().slice(0, 64) } : {}),
      ...(account.ifsc_or_routing?.trim() ? { ifsc_or_routing: account.ifsc_or_routing.trim().toUpperCase().slice(0, 40) } : {}),
      ...(account.branch_name?.trim() ? { branch_name: account.branch_name.trim().slice(0, 120) } : {}),
      ...(account.upi_id?.trim() ? { upi_id: account.upi_id.trim().slice(0, 100) } : {}),
      ...(account.paypal_handle?.trim() ? { paypal_handle: account.paypal_handle.trim().slice(0, 120) } : {}),
      ...(account.payment_link?.trim() ? { payment_link: account.payment_link.trim().slice(0, 500) } : {}),
      ...(account.qr_payload?.trim() ? { qr_payload: account.qr_payload.trim().slice(0, 600) } : {}),
      ...(account.qr_code_url?.trim() ? { qr_code_url: account.qr_code_url.trim().slice(0, 120000) } : {}),
      ...(account.razorpay_key_id?.trim() ? { razorpay_key_id: account.razorpay_key_id.trim().slice(0, 80) } : {}),
      ...(account.razorpay_account_id?.trim() ? { razorpay_account_id: account.razorpay_account_id.trim().slice(0, 80) } : {}),
      currency_scope: account.currency_scope || 'ALL',
      ...(account.instructions?.trim() ? { instructions: account.instructions.trim().slice(0, 400) } : {}),
      is_active: account.is_active !== false,
      is_primary: Boolean(account.is_primary),
      created_at: account.created_at || now,
      updated_at: now,
    };

    if (payload.is_primary) {
      payload.is_active = true;
    }

    // Update localStorage cache & ensure single primary per account_type
    let demotedAccounts: StorePayoutAccount[] = [];
    try {
      const raw = localStorage.getItem(LOCAL_PAYOUT_ACCOUNTS_KEY);
      const list: StorePayoutAccount[] = raw ? JSON.parse(raw) : [];
      const nextList: StorePayoutAccount[] = [];
      let found = false;
      for (const existing of list) {
        if (existing.id === id) {
          nextList.push(payload);
          found = true;
        } else if (payload.is_primary && existing.account_type === payload.account_type && existing.is_primary) {
          const demoted = { ...existing, is_primary: false, updated_at: now };
          demotedAccounts.push(demoted);
          nextList.push(demoted);
        } else {
          nextList.push(existing);
        }
      }
      if (!found) {
        nextList.unshift(payload);
      }
      localStorage.setItem(LOCAL_PAYOUT_ACCOUNTS_KEY, JSON.stringify(nextList));
    } catch {
      // ignore
    }

    if (demotedAccounts.length > 0) {
      await Promise.allSettled(
        demotedAccounts.map((acc) => dbService.upsert('store_payout_accounts', acc))
      );
    }

    await dbService.upsert('store_payout_accounts', payload);
    return payload;
  },

  async setPrimaryPayoutAccount(accountId: string): Promise<StorePayoutAccount[]> {
    const all = await this.fetchPayoutAccounts(true);
    const target = all.find((a) => a.id === accountId);
    if (!target) return all;

    const now = new Date().toISOString();
    const updatedList: StorePayoutAccount[] = [];
    const changed: StorePayoutAccount[] = [];

    for (const acc of all) {
      if (acc.id === accountId) {
        const nextAcc = { ...acc, is_primary: true, is_active: true, updated_at: now };
        updatedList.push(nextAcc);
        changed.push(nextAcc);
      } else if (acc.account_type === target.account_type && acc.is_primary) {
        const demoted = { ...acc, is_primary: false, updated_at: now };
        updatedList.push(demoted);
        changed.push(demoted);
      } else {
        updatedList.push(acc);
      }
    }

    try {
      localStorage.setItem(LOCAL_PAYOUT_ACCOUNTS_KEY, JSON.stringify(updatedList));
    } catch {
      // ignore
    }

    await Promise.allSettled(
      changed.map((acc) => dbService.upsert('store_payout_accounts', acc))
    );

    return updatedList.sort((a, b) => {
      if (a.is_primary !== b.is_primary) return a.is_primary ? -1 : 1;
      if (a.is_active !== b.is_active) return a.is_active ? -1 : 1;
      return new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime();
    });
  },

  async deletePayoutAccount(accountId: string): Promise<void> {
    const remoteDeleted = await dbService.remove('store_payout_accounts', accountId);
    if (!remoteDeleted) {
      throw new Error('Could not delete receiving account. Check admin permissions and retry.');
    }
    try {
      const raw = localStorage.getItem(LOCAL_PAYOUT_ACCOUNTS_KEY);
      if (raw) {
        const list: StorePayoutAccount[] = JSON.parse(raw);
        localStorage.setItem(
          LOCAL_PAYOUT_ACCOUNTS_KEY,
          JSON.stringify(list.filter((a) => a.id !== accountId))
        );
      }
    } catch {
      // ignore
    }
  },
};
