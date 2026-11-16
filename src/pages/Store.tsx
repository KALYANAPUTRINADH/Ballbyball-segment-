import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ShoppingBag, Search, Star, Heart, Scale, ShieldCheck, Ruler,
  PackageCheck, Truck, Plus, Minus, X, Check, Settings, ArrowRight,
  Clock, MapPin, Copy, RotateCcw, Package, BookmarkCheck,
  SlidersHorizontal, ChevronDown, ChevronUp, Edit, Trash2, Lock,
  Share2, BellRing, Mail, ExternalLink, Zap, CreditCard, Smartphone, Banknote, Landmark, QrCode, Link2
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ToastContext';
import { StoreService } from '../services/StoreService';
import { generateQrDataUrl, resolveAccountQrPayload, buildPayPalLink } from '../utils/paymentQr';
import {
  STORE_HERO_IMAGE,
  STORE_PRIMARY_DOMAINS,
  STORE_CATEGORIES_BY_DOMAIN,
  STORE_SPORTS_BY_DOMAIN,
  ALL_STORE_SPORTS,
  SIDEBAR_FEATURED_SPORTS,
  SIDEBAR_FEATURED_CATEGORIES,
  normalizeSportLabel,
  matchesStoreSport,
  matchesStoreCategory,
  CRICKET_BAT_SIZE_GUIDE,
  TEAM_BALL_SIZE_GUIDE,
  RACKET_GRIP_SIZE_GUIDE,
  APPAREL_SIZE_GUIDE,
  INDOOR_BOARD_SIZE_GUIDE,
} from '../data/storeCatalog';
import {
  STORE_CURRENCIES,
  StoreCurrency,
  getInitialStoreCurrency,
  getProductPriceInCurrency,
  formatStorePrice,
  formatRawStoreAmount,
  getFreeShippingThreshold,
  getFlatShippingFee,
} from '../utils/storePricing';
import type {
  StoreProduct,
  CartItem,
  StoreOrder,
  StoreReview,
  StoreCoupon,
  StoreBrand,
  StoreDomain,
  OrderStatus,
  StoreRestockRequest,
  StoreSavedPaymentMethod,
  SavedPaymentProvider,
  StorePayoutAccount,
} from '../types/store';

interface StoreProps {
  setFullScreenView?: (view: string | null) => void;
}

const CART_STORAGE_KEY = 'streamlify_store_cart_v1';
const COMPARE_STORAGE_KEY = 'streamlify_store_compare_v1';
const MAX_COMPARE_ITEMS = 4;

const SHIPMENT_STEPS: { key: OrderStatus; label: string; detail: string }[] = [
  { key: 'pending', label: 'Order Placed', detail: 'Order confirmed & queued for dispatch' },
  { key: 'processing', label: 'Prep & Knocking', detail: 'Quality check, knocking & custom print prep' },
  { key: 'packed', label: 'Packed', detail: 'Hologram sealed & ready for courier pickup' },
  { key: 'shipped', label: 'In Transit', detail: 'Dispatched with live carrier tracking' },
  { key: 'delivered', label: 'Delivered', detail: 'Delivered to destination address' },
];

interface CheckoutQrCardProps {
  account: StorePayoutAccount;
  amount: number;
  inrAmount: number;
  currency: StoreCurrency;
  note: string;
  copiedField: string | null;
  onCopy: (fieldKey: string, value: string) => void;
}

function CheckoutQrCard({
  account,
  amount,
  inrAmount,
  currency,
  note,
  copiedField,
  onCopy,
}: CheckoutQrCardProps) {
  const [liveQrSrc, setLiveQrSrc] = useState<string>(account.qr_code_url || '');

  const dynamicPayload = useMemo(
    () =>
      resolveAccountQrPayload(account, {
        amount,
        inrAmount,
        currency,
        note,
      }),
    [account, amount, inrAmount, currency, note]
  );

  useEffect(() => {
    let cancelled = false;
    const hasUploadedCustomQrOnly = Boolean(account.qr_code_url && !account.qr_payload);
    if (hasUploadedCustomQrOnly) {
      setLiveQrSrc(account.qr_code_url || '');
      return;
    }

    if (dynamicPayload) {
      generateQrDataUrl(dynamicPayload)
        .then((url) => {
          if (!cancelled) setLiveQrSrc(url);
        })
        .catch(() => {
          if (!cancelled) setLiveQrSrc(account.qr_code_url || '');
        });
    } else {
      setLiveQrSrc(account.qr_code_url || '');
    }
    return () => {
      cancelled = true;
    };
  }, [account.qr_code_url, account.qr_payload, dynamicPayload]);

  const directActionHref = useMemo(() => {
    if (account.account_type === 'upi' || (account.account_type === 'bank_transfer' && account.upi_id)) {
      if (dynamicPayload && dynamicPayload.startsWith('upi://')) return dynamicPayload;
    }
    if (account.account_type === 'paypal') {
      const target = account.payment_link || account.paypal_handle || account.qr_payload || '';
      if (target) {
        return buildPayPalLink({
          handleOrEmailOrUrl: target,
          amount,
          currency,
          itemName: note,
        });
      }
    }
    if (account.payment_link && /^https?:\/\//i.test(account.payment_link)) {
      return account.payment_link;
    }
    if (account.qr_payload && /^(https?:\/\/|upi:\/\/)/i.test(account.qr_payload.trim())) {
      return account.qr_payload.trim();
    }
    return '';
  }, [account, dynamicPayload, amount, currency, note]);

  const copyTargetLabel =
    account.account_type === 'upi' || account.upi_id
      ? 'UPI ID'
      : account.account_type === 'paypal'
      ? 'PayPal'
      : 'Payment Link';
  const copyTargetValue =
    account.upi_id ||
    account.paypal_handle ||
    account.payment_link ||
    account.qr_payload ||
    '';

  const qrSrc = liveQrSrc || account.qr_code_url || '';
  if (!qrSrc && !directActionHref) return null;

  return (
    <div className="border-2 border-slate-900 bg-white rounded-2xl p-4 shadow-sm space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#d11a2a]">
            <QrCode className="w-3.5 h-3.5" />
            Scan &amp; Pay Directly
          </div>
          <div className="text-xs font-bold text-slate-900 truncate mt-0.5">
            {account.label}
          </div>
          <div className="text-[11px] text-slate-500 truncate">
            Payee: {account.account_holder_name}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-[10px] font-semibold uppercase text-slate-400">Exact Payable</div>
          <div className="font-mono text-sm font-bold text-[#d11a2a] tabular-nums">
            {formatRawStoreAmount(amount, currency)}
          </div>
        </div>
      </div>

      {qrSrc && (
        <div className="flex flex-col items-center justify-center py-2">
          <div className="w-44 h-44 rounded-xl border border-slate-200 bg-white p-2 flex items-center justify-center shadow-inner">
            <img
              src={qrSrc}
              alt={`${account.label} Payment QR Code`}
              referrerPolicy="no-referrer"
              className="w-full h-full object-contain"
            />
          </div>
          <p className="text-[11px] text-slate-500 text-center mt-2">
            Scan with any supported payment app, then enter your transaction reference below.
          </p>
        </div>
      )}

      {(copyTargetValue || directActionHref) && (
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
          {copyTargetValue && (
            <button
              type="button"
              onClick={() => onCopy(copyTargetLabel, copyTargetValue)}
              className="px-3 py-1.5 text-[11px] font-semibold border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-800 flex items-center gap-1.5 whitespace-nowrap"
            >
              <Copy className="w-3 h-3" />
              {copiedField === copyTargetLabel ? `Copied ${copyTargetLabel}` : `Copy ${copyTargetLabel}`}
            </button>
          )}
          {directActionHref && (
            <a
              href={directActionHref}
              target={directActionHref.startsWith('http') ? '_blank' : undefined}
              rel={directActionHref.startsWith('http') ? 'noopener noreferrer' : undefined}
              className="px-3 py-1.5 text-[11px] font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800 flex items-center gap-1.5 whitespace-nowrap"
            >
              <ExternalLink className="w-3 h-3" />
              {account.account_type === 'upi' || directActionHref.startsWith('upi://')
                ? 'Open UPI App'
                : account.account_type === 'paypal'
                ? 'Pay via PayPal'
                : 'Open Payment Link'}
            </a>
          )}
        </div>
      )}

      {account.instructions && (
        <p className="text-[11px] text-slate-600 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 leading-relaxed">
          {account.instructions}
        </p>
      )}
    </div>
  );
}

export default function Store({ setFullScreenView }: StoreProps) {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const canAccessStoreAdmin = Boolean(user && isAdmin && !authLoading);
  const { showToast } = useToast();

  // Catalog & remote state
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [customBrands, setCustomBrands] = useState<StoreBrand[]>([]);
  const [coupons, setCoupons] = useState<StoreCoupon[]>([]);
  const [orders, setOrders] = useState<StoreOrder[]>([]);
  const [allReviews, setAllReviews] = useState<StoreReview[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Currency
  const [currency, setCurrency] = useState<StoreCurrency>(() => getInitialStoreCurrency());

  // Filters & sorting
  const [activeDomain, setActiveDomain] = useState<'All' | StoreDomain>('All');
  const [activeSport, setActiveSport] = useState<string>('All');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [activeBrand, setActiveBrand] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [minRatingFilter, setMinRatingFilter] = useState<number>(0);
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'rating'>('featured');
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [showAllSidebarSports, setShowAllSidebarSports] = useState(false);
  const [showAllSidebarCategories, setShowAllSidebarCategories] = useState(false);
  const [sidebarOpenSections, setSidebarOpenSections] = useState({
    sport: true,
    category: true,
    brand: true,
    rating: true,
  });

  // Cart & Compare
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const raw = localStorage.getItem(CART_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [compareIds, setCompareIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(COMPARE_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed.slice(0, MAX_COMPARE_ITEMS) : [];
    } catch {
      return [];
    }
  });

  // Modals / Drawers
  const [selectedProduct, setSelectedProduct] = useState<StoreProduct | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'shipping' | 'confirmed'>('cart');
  const [isOrdersOpen, setIsOrdersOpen] = useState(false);
  const [ordersTab, setOrdersTab] = useState<'history' | 'track'>('history');
  const [orderHistoryFilter, setOrderHistoryFilter] = useState<'all' | 'active' | 'delivered' | 'cancelled'>('all');
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [trackInput, setTrackInput] = useState('');
  const [trackedOrderId, setTrackedOrderId] = useState<string | null>(null);

  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [compareDiffOnly, setCompareDiffOnly] = useState(false);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [sizeGuideTab, setSizeGuideTab] = useState<'cricket' | 'balls' | 'racket' | 'apparel' | 'indoor'>('cricket');
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);

  // PDP & Review State
  const [pdpSize, setPdpSize] = useState('');
  const [pdpHand, setPdpHand] = useState('');
  const [pdpKnocking, setPdpKnocking] = useState(false);
  const [pdpJerseyName, setPdpJerseyName] = useState('');
  const [pdpJerseyNumber, setPdpJerseyNumber] = useState('');
  const [pdpQty, setPdpQty] = useState(1);
  const [pdpReviews, setPdpReviews] = useState<StoreReview[]>([]);
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [hoverReviewStar, setHoverReviewStar] = useState(0);
  const [newReviewTitle, setNewReviewTitle] = useState('');
  const [newReviewComment, setNewReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [reviewStarFilter, setReviewStarFilter] = useState<number | 'all'>('all');
  const [reviewSortBy, setReviewSortBy] = useState<'newest' | 'highest' | 'lowest'>('newest');

  // Checkout State
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<StoreCoupon | null>(null);
  const [shippingForm, setShippingForm] = useState({
    name: user?.displayName || '',
    email: user?.email || '',
    phone: user?.phoneNumber || '',
    line1: '',
    city: '',
    state: '',
    postal_code: '',
    country: currency === 'INR' ? 'India' : 'United States',
  });
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'razorpay' | 'cod' | 'bank_transfer' | 'upi' | 'paypal' | 'custom_qr'>('cod');
  const [payoutAccounts, setPayoutAccounts] = useState<StorePayoutAccount[]>([]);
  const [selectedBankAccountId, setSelectedBankAccountId] = useState<string>('');
  const [selectedUpiAccountId, setSelectedUpiAccountId] = useState<string>('');
  const [selectedPaypalAccountId, setSelectedPaypalAccountId] = useState<string>('');
  const [selectedCustomQrAccountId, setSelectedCustomQrAccountId] = useState<string>('');
  const [bankTransferRef, setBankTransferRef] = useState('');
  const [payerBankName, setPayerBankName] = useState('');
  const [copiedBankField, setCopiedBankField] = useState<string | null>(null);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<StoreOrder | null>(null);

  // Authenticity modal state
  const [serialQuery, setSerialQuery] = useState('');
  const [serialResult, setSerialResult] = useState<{ valid: boolean; message: string; product?: StoreProduct } | null>(null);

  // Share & Notify Me restock alert state
  const [restockRequests, setRestockRequests] = useState<StoreRestockRequest[]>([]);
  const [notifyEmailInput, setNotifyEmailInput] = useState(user?.email || '');
  const [notifyModalProduct, setNotifyModalProduct] = useState<StoreProduct | null>(null);
  const [submittingNotify, setSubmittingNotify] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const deepLinkHandledRef = useRef(false);

  // Quick Buy & Saved Payment Methods state
  const [savedPaymentMethods, setSavedPaymentMethods] = useState<StoreSavedPaymentMethod[]>([]);
  const [selectedQuickMethodId, setSelectedQuickMethodId] = useState<string>('');
  const [quickBuyProduct, setQuickBuyProduct] = useState<StoreProduct | null>(null);
  const [quickBuyQty, setQuickBuyQty] = useState(1);
  const [quickBuySize, setQuickBuySize] = useState('Standard');
  const [quickBuyHand, setQuickBuyHand] = useState('');
  const [quickBuyKnocking, setQuickBuyKnocking] = useState(false);
  const [quickBuyPlacing, setQuickBuyPlacing] = useState(false);
  const [quickBuyConfirmedOrder, setQuickBuyConfirmedOrder] = useState<StoreOrder | null>(null);
  const [isEditingQuickAddress, setIsEditingQuickAddress] = useState(false);
  const [showAddQuickPaymentForm, setShowAddQuickPaymentForm] = useState(false);
  const [newPayProvider, setNewPayProvider] = useState<SavedPaymentProvider>('stripe_card');
  const [newPayBrand, setNewPayBrand] = useState('Visa');
  const [newPayLast4, setNewPayLast4] = useState('');
  const [newPayExpiry, setNewPayExpiry] = useState('');
  const [newPayUpi, setNewPayUpi] = useState('');
  const [newPayBankName, setNewPayBankName] = useState('');
  const [savingQuickMethod, setSavingQuickMethod] = useState(false);
  const storeViewTrackedRef = useRef(false);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch {
      // ignore
    }
  }, [cart]);

  useEffect(() => {
    try {
      localStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(compareIds));
    } catch {
      // ignore
    }
  }, [compareIds]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('store_currency', currency);
    }
  }, [currency]);

  useEffect(() => {
    if (user) {
      setShippingForm((prev) => ({
        ...prev,
        name: prev.name || user.displayName || '',
        email: prev.email || user.email || '',
        phone: prev.phone || user.phoneNumber || '',
      }));
      if (user.email) {
        setNotifyEmailInput((prev) => prev || user.email);
      }
    }
  }, [user]);

  const getProductShareUrl = (product: StoreProduct) => {
    if (typeof window === 'undefined') return `/?tab=store&product=${encodeURIComponent(product.id)}`;
    const url = new URL(window.location.href);
    url.searchParams.set('tab', 'store');
    url.searchParams.set('product', product.id);
    return url.toString();
  };

  const loadStoreData = async () => {
    setLoading(true);
    try {
      const [prods, brds, coups, ords, revs, wish, restocks, savedMethods, payoutAccs] = await Promise.all([
        StoreService.fetchProducts(false),
        StoreService.fetchBrands(false),
        StoreService.fetchCoupons(false),
        StoreService.fetchOrders(user?.uid || 'guest', false),
        StoreService.fetchAllReviews(),
        StoreService.fetchWishlist(user?.uid),
        StoreService.fetchRestockRequests(user?.uid || 'guest', false),
        StoreService.fetchSavedPaymentMethods(user?.uid),
        StoreService.fetchPayoutAccounts(false),
      ]);
      setProducts(prods);
      setCustomBrands(brds);
      setCoupons(coups);
      setOrders(ords);
      setAllReviews(revs);
      setWishlist(wish);
      setRestockRequests(restocks);
      setSavedPaymentMethods(savedMethods);
      setPayoutAccounts(payoutAccs);
      const bankAccs = payoutAccs.filter((a) => a.account_type === 'bank_transfer' && a.is_active !== false);
      if (bankAccs.length > 0) {
        const preferred =
          bankAccs.find((a) => a.is_primary && (a.currency_scope === currency || a.currency_scope === 'ALL')) ||
          bankAccs.find((a) => a.is_primary) ||
          bankAccs[0];
        setSelectedBankAccountId((prev) => (prev && bankAccs.some((a) => a.id === prev) ? prev : preferred.id));
      }
      const upiAccs = payoutAccs.filter((a) => a.account_type === 'upi' && a.is_active !== false);
      if (upiAccs.length > 0) {
        const prefUpi = upiAccs.find((a) => a.is_primary) || upiAccs[0];
        setSelectedUpiAccountId((prev) => (prev && upiAccs.some((a) => a.id === prev) ? prev : prefUpi.id));
      }
      const paypalAccs = payoutAccs.filter((a) => a.account_type === 'paypal' && a.is_active !== false);
      if (paypalAccs.length > 0) {
        const prefPaypal = paypalAccs.find((a) => a.is_primary) || paypalAccs[0];
        setSelectedPaypalAccountId((prev) => (prev && paypalAccs.some((a) => a.id === prev) ? prev : prefPaypal.id));
      }
      const customQrAccs = payoutAccs.filter((a) => a.account_type === 'custom_qr' && a.is_active !== false);
      if (customQrAccs.length > 0) {
        const prefQr = customQrAccs.find((a) => a.is_primary) || customQrAccs[0];
        setSelectedCustomQrAccountId((prev) => (prev && customQrAccs.some((a) => a.id === prev) ? prev : prefQr.id));
      }
      if (savedMethods.length > 0) {
        const def = savedMethods.find((m) => m.is_default) || savedMethods[0];
        setSelectedQuickMethodId((prev) => (prev && savedMethods.some((m) => m.id === prev) ? prev : def.id));
      } else {
        setSelectedQuickMethodId((prev) => prev || 'cod-instant');
      }

      // Hydrate shipping form from saved address or latest order for 1-click Quick Buy
      const savedAddr = StoreService.getSavedShippingAddress(user?.uid);
      const fallbackOrd = ords[0];
      setShippingForm((prev) => {
        if (prev.line1.trim() && prev.city.trim()) return prev;
        if (savedAddr && savedAddr.line1) {
          return {
            name: prev.name || savedAddr.name || user?.displayName || '',
            email: prev.email || savedAddr.email || user?.email || '',
            phone: prev.phone || savedAddr.phone || user?.phoneNumber || '',
            line1: savedAddr.line1,
            city: savedAddr.city,
            state: savedAddr.state,
            postal_code: savedAddr.postal_code,
            country: savedAddr.country || prev.country,
          };
        }
        if (fallbackOrd?.shipping_address?.line1) {
          return {
            name: prev.name || fallbackOrd.customer_name || user?.displayName || '',
            email: prev.email || fallbackOrd.customer_email || user?.email || '',
            phone: prev.phone || fallbackOrd.customer_phone || user?.phoneNumber || '',
            line1: fallbackOrd.shipping_address.line1,
            city: fallbackOrd.shipping_address.city,
            state: fallbackOrd.shipping_address.state,
            postal_code: fallbackOrd.shipping_address.postal_code,
            country: fallbackOrd.shipping_address.country || prev.country,
          };
        }
        return prev;
      });

      if (ords.length > 0 && !trackedOrderId) {
        setTrackedOrderId(ords[0].id);
      }

      if (!storeViewTrackedRef.current) {
        storeViewTrackedRef.current = true;
        void StoreService.trackAnalyticsEvent({
          eventType: 'store_view',
          userId: user?.uid || 'guest',
        });
      }

      if (!deepLinkHandledRef.current && typeof window !== 'undefined' && prods.length > 0) {
        const params = new URLSearchParams(window.location.search);
        const targetId = params.get('product');
        const targetSku = params.get('sku');
        const matched = targetId
          ? prods.find((p) => p.id === targetId || p.sku.toLowerCase() === targetId.toLowerCase())
          : targetSku
          ? prods.find((p) => p.sku.toLowerCase() === targetSku.toLowerCase())
          : undefined;
        deepLinkHandledRef.current = true;
        if (matched) {
          openProductDetail(matched);
        }
      }
    } catch (e) {
      console.error('Store load failed:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStoreData();
  }, [user?.uid]);

  const customBrandMap = useMemo(() => {
    const map: Record<string, StoreBrand> = {};
    for (const b of customBrands) {
      map[b.name.toLowerCase()] = b;
    }
    return map;
  }, [customBrands]);

  const reviewMetricsMap = useMemo(
    () => StoreService.computeProductReviewMetrics(allReviews),
    [allReviews]
  );

  const getProductRating = (p: StoreProduct) => {
    const live = reviewMetricsMap[p.id];
    if (live) return { rating: live.averageRating, count: live.reviewCount };
    return { rating: 0, count: 0 };
  };

  const getActiveRestockAlert = (productId: string): StoreRestockRequest | undefined => {
    return restockRequests.find(
      (r) =>
        r.product_id === productId &&
        r.status === 'waiting' &&
        ((user?.uid && r.user_id === user.uid) ||
          (notifyEmailInput.trim() && r.email.toLowerCase() === notifyEmailInput.trim().toLowerCase()) ||
          r.user_id === 'guest')
    );
  };

  // Open PDP helper
  const openProductDetail = async (product: StoreProduct, focusReviews = false) => {
    setSelectedProduct(product);
    setIsShareOpen(false);
    setShareCopied(false);
    setPdpSize(product.sizes?.[0] || 'Standard');
    setPdpHand(product.handedness_options?.[0] || '');
    setPdpKnocking(false);
    setPdpJerseyName('');
    setPdpJerseyNumber('');
    setPdpQty(1);
    setEditingReviewId(null);
    setNewReviewRating(5);
    setHoverReviewStar(0);
    setNewReviewTitle('');
    setNewReviewComment('');
    setReviewStarFilter('all');
    setReviewSortBy('newest');

    void StoreService.trackAnalyticsEvent({
      eventType: 'product_view',
      product,
      userId: user?.uid || 'guest',
    });

    if (typeof window !== 'undefined') {
      try {
        const url = new URL(window.location.href);
        url.searchParams.set('tab', 'store');
        url.searchParams.set('product', product.id);
        window.history.replaceState({}, '', url.toString());
      } catch {
        // ignore URL sync issues
      }
    }

    const revs = await StoreService.fetchReviews(product.id);
    setPdpReviews(revs);
    if (focusReviews) {
      setTimeout(() => {
        document.getElementById('pdp-reviews-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 90);
    }
  };

  const closeProductDetail = () => {
    setSelectedProduct(null);
    setIsShareOpen(false);
    if (typeof window !== 'undefined') {
      try {
        const url = new URL(window.location.href);
        if (url.searchParams.has('product') || url.searchParams.has('sku')) {
          url.searchParams.delete('product');
          url.searchParams.delete('sku');
          window.history.replaceState({}, '', url.toString());
        }
      } catch {
        // ignore
      }
    }
  };

  const handleCopyProductLink = async (product: StoreProduct) => {
    const shareUrl = getProductShareUrl(product);
    try {
      await navigator.clipboard?.writeText(shareUrl);
      setShareCopied(true);
      showToast('Product deep link copied! Share it with your team.');
      setTimeout(() => setShareCopied(false), 2500);
    } catch {
      showToast('Copy this link from the box below.', 'error');
    }
  };

  const handleNativeShareProduct = async (product: StoreProduct) => {
    if (typeof navigator === 'undefined' || typeof navigator.share !== 'function') {
      setIsShareOpen(true);
      return;
    }
    const shareUrl = getProductShareUrl(product);
    const priceLabel = formatStorePrice(product.price_usd, product.price_inr, currency);
    try {
      await navigator.share({
        title: `${product.name} (${product.brand})`,
        text: `Check out ${product.name} by ${product.brand} (${priceLabel}) on Streamlify Store`,
        url: shareUrl,
      });
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        setIsShareOpen(true);
      }
    }
  };

  const handleOpenNotifyModal = (product: StoreProduct) => {
    setNotifyEmailInput((prev) => prev || user?.email || '');
    setNotifyModalProduct(product);
  };

  const handleSubmitRestockAlert = async (e: React.FormEvent, targetProduct: StoreProduct) => {
    e.preventDefault();
    const email = notifyEmailInput.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showToast('Please enter a valid email address.', 'error');
      return;
    }
    setSubmittingNotify(true);
    try {
      const req = await StoreService.subscribeRestockAlert({
        product: targetProduct,
        email,
        userId: user?.uid || 'guest',
        userName: user?.displayName || user?.email?.split('@')[0] || '',
      });
      setRestockRequests((prev) => {
        const filtered = prev.filter((item) => item.id !== req.id);
        return [req, ...filtered];
      });
      setNotifyModalProduct(null);
      showToast(`Subscribed! We will email ${req.email} when "${targetProduct.name}" is back in stock.`);
    } catch (err: any) {
      showToast(err?.message || 'Failed to subscribe to restock alert.', 'error');
    } finally {
      setSubmittingNotify(false);
    }
  };

  const handleCancelRestockAlert = async (req: StoreRestockRequest) => {
    try {
      await StoreService.cancelRestockRequest(req.id);
      setRestockRequests((prev) => prev.filter((item) => item.id !== req.id));
      showToast(`Cancelled restock alert for ${req.product_name}.`);
    } catch {
      showToast('Could not remove restock alert.', 'error');
    }
  };

  const matchesDomainFilter = (productDomain: StoreDomain, selected: 'All' | StoreDomain) => {
    if (selected === 'All') return true;
    if (productDomain === selected) return true;
    if (selected === 'Team Sports' && productDomain === 'Sports') return true;
    if (selected === 'Indoor & Board Games' && productDomain === 'Indoor & Games') return true;
    return false;
  };

  const resetAllFilters = () => {
    setActiveDomain('All');
    setActiveSport('All');
    setActiveCategory('All');
    setActiveBrand('All');
    setSearchQuery('');
    setInStockOnly(false);
    setMinRatingFilter(0);
  };

  const activeFilterCount =
    (activeDomain !== 'All' ? 1 : 0) +
    (activeSport !== 'All' ? 1 : 0) +
    (activeCategory !== 'All' ? 1 : 0) +
    (activeBrand !== 'All' ? 1 : 0) +
    (inStockOnly ? 1 : 0) +
    (minRatingFilter > 0 ? 1 : 0);

  const productsMatchingFacetBase = (exclude: 'sport' | 'category' | 'brand') => {
    const q = searchQuery.trim().toLowerCase();
    return products.filter((p) => {
      if (!matchesDomainFilter(p.domain, activeDomain)) return false;
      if (exclude !== 'sport' && !matchesStoreSport(p.sport_type, activeSport)) return false;
      if (exclude !== 'category' && !matchesStoreCategory(p.category, activeCategory)) return false;
      if (exclude !== 'brand' && activeBrand !== 'All' && p.brand !== activeBrand) return false;
      if (inStockOnly && p.stock <= 0) return false;
      if (minRatingFilter > 0 && getProductRating(p).rating < minRatingFilter) return false;
      if (q) {
        const hay = `${p.name} ${p.brand} ${p.category} ${p.sport_type} ${p.domain} ${p.sku} ${p.description}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  };

  const sidebarSportOptions = useMemo(() => {
    const baseProducts = productsMatchingFacetBase('sport');
    const domainSports =
      activeDomain === 'All'
        ? SIDEBAR_FEATURED_SPORTS
        : STORE_SPORTS_BY_DOMAIN[activeDomain] || SIDEBAR_FEATURED_SPORTS;
    const fromProducts = products
      .filter((p) => matchesDomainFilter(p.domain, activeDomain))
      .map((p) => normalizeSportLabel(p.sport_type))
      .filter(Boolean);
    const orderedNames = Array.from(new Set([...domainSports, ...fromProducts, ...(activeDomain === 'All' ? ALL_STORE_SPORTS : [])]));
    const withCounts = orderedNames.map((sport) => ({
      name: sport,
      count: baseProducts.filter((p) => matchesStoreSport(p.sport_type, sport)).length,
    }));
    // Prioritize sports with inventory first, then featured order
    const featuredSet = new Set(SIDEBAR_FEATURED_SPORTS);
    return withCounts.sort((a, b) => {
      if ((a.count > 0) !== (b.count > 0)) return a.count > 0 ? -1 : 1;
      if (featuredSet.has(a.name) !== featuredSet.has(b.name)) return featuredSet.has(a.name) ? -1 : 1;
      if (b.count !== a.count) return b.count - a.count;
      return a.name.localeCompare(b.name);
    });
  }, [activeDomain, products, activeCategory, activeBrand, inStockOnly, minRatingFilter, searchQuery, reviewMetricsMap]);

  const sidebarCategoryOptions = useMemo(() => {
    const baseProducts = productsMatchingFacetBase('category');
    const domainCats =
      activeDomain === 'All'
        ? SIDEBAR_FEATURED_CATEGORIES
        : Array.from(new Set([...(STORE_CATEGORIES_BY_DOMAIN[activeDomain] || []), ...SIDEBAR_FEATURED_CATEGORIES]));
    const fromProducts = products
      .filter((p) => matchesDomainFilter(p.domain, activeDomain))
      .map((p) => p.category)
      .filter(Boolean);
    // Include custom product categories not already covered by alias groups
    const extraCustom = fromProducts.filter(
      (cat) => !domainCats.some((baseCat) => matchesStoreCategory(cat, baseCat))
    );
    const allNames = Array.from(new Set([...domainCats, ...extraCustom]));
    return allNames
      .map((cat) => ({
        name: cat,
        count: baseProducts.filter((p) => matchesStoreCategory(p.category, cat)).length,
      }))
      .sort((a, b) => {
        if ((a.count > 0) !== (b.count > 0)) return a.count > 0 ? -1 : 1;
        return 0;
      });
  }, [activeDomain, products, activeSport, activeBrand, inStockOnly, minRatingFilter, searchQuery, reviewMetricsMap]);

  const sidebarBrandOptions = useMemo(() => {
    const baseProducts = productsMatchingFacetBase('brand');
    const names = Array.from(
      new Set([
        ...products.map((p) => p.brand).filter(Boolean),
        ...customBrands.map((b) => b.name).filter(Boolean),
      ])
    ).sort();
    return names
      .map((brand) => ({
        name: brand,
        count: baseProducts.filter((p) => p.brand === brand).length,
      }))
      .sort((a, b) => {
        if ((a.count > 0) !== (b.count > 0)) return a.count > 0 ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
  }, [products, customBrands, activeDomain, activeSport, activeCategory, inStockOnly, minRatingFilter, searchQuery, reviewMetricsMap]);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = products.filter((p) => {
      if (!matchesDomainFilter(p.domain, activeDomain)) return false;
      if (!matchesStoreSport(p.sport_type, activeSport)) return false;
      if (!matchesStoreCategory(p.category, activeCategory)) return false;
      if (activeBrand !== 'All' && p.brand !== activeBrand) return false;
      if (inStockOnly && p.stock <= 0) return false;
      if (minRatingFilter > 0 && getProductRating(p).rating < minRatingFilter) return false;
      if (q) {
        const hay = `${p.name} ${p.brand} ${p.category} ${p.sport_type} ${p.domain} ${p.sku} ${p.description}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    return [...list].sort((a, b) => {
      if (sortBy === 'price-asc') return a.price_usd - b.price_usd;
      if (sortBy === 'price-desc') return b.price_usd - a.price_usd;
      if (sortBy === 'rating') {
        const ra = reviewMetricsMap[a.id]?.averageRating || 0;
        const rb = reviewMetricsMap[b.id]?.averageRating || 0;
        if (rb !== ra) return rb - ra;
        return (reviewMetricsMap[b.id]?.reviewCount || 0) - (reviewMetricsMap[a.id]?.reviewCount || 0);
      }
      if (Boolean(a.featured) !== Boolean(b.featured)) return a.featured ? -1 : 1;
      return 0;
    });
  }, [products, activeDomain, activeSport, activeCategory, activeBrand, inStockOnly, minRatingFilter, searchQuery, sortBy, reviewMetricsMap]);

  const wishlistProducts = useMemo(
    () => products.filter((p) => wishlist.includes(p.id)),
    [products, wishlist]
  );

  // Cart item pricing
  const getCartItemUnitPrice = (item: CartItem): number => {
    const base = getProductPriceInCurrency(item.product.price_usd, item.product.price_inr, currency);
    if (item.includeKnocking && item.product.knocking_available) {
      const knockFee = getProductPriceInCurrency(
        item.product.knocking_fee_usd || 15,
        item.product.knocking_fee_inr || 999,
        currency
      );
      return Number((base + knockFee).toFixed(2));
    }
    return base;
  };

  const cartSubtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + getCartItemUnitPrice(item) * item.quantity, 0);
  }, [cart, currency]);

  const cartCount = useMemo(() => cart.reduce((sum, i) => sum + i.quantity, 0), [cart]);

  const freeShippingThreshold = getFreeShippingThreshold(currency);
  const shippingFee = cartSubtotal === 0 || cartSubtotal >= freeShippingThreshold ? 0 : getFlatShippingFee(currency);

  const discountAmount = useMemo(() => {
    if (!appliedCoupon || cartSubtotal === 0) return 0;
    const minInCurr = getProductPriceInCurrency(appliedCoupon.min_order_usd, appliedCoupon.min_order_usd * 83.5, currency);
    if (cartSubtotal < minInCurr) return 0;
    if (appliedCoupon.discount_type === 'percent') {
      return Number(((cartSubtotal * appliedCoupon.value) / 100).toFixed(2));
    }
    return Math.min(cartSubtotal, getProductPriceInCurrency(appliedCoupon.value, appliedCoupon.value * 83.5, currency));
  }, [appliedCoupon, cartSubtotal, currency]);

  const cartTotal = Math.max(0, Number((cartSubtotal - discountAmount + shippingFee).toFixed(2)));

  const handleAddToCart = (
    product: StoreProduct,
    opts?: {
      size?: string;
      hand?: string;
      knocking?: boolean;
      jerseyName?: string;
      jerseyNumber?: string;
      qty?: number;
      openDrawer?: boolean;
    }
  ) => {
    if (product.stock <= 0) {
      showToast('This item is currently out of stock.', 'error');
      return;
    }
    const selectedSize = opts?.size || product.sizes?.[0] || 'Standard';
    const selectedHand = opts?.hand || product.handedness_options?.[0] || '';
    const includeKnocking = Boolean(opts?.knocking && product.knocking_available);
    const customJerseyName = opts?.jerseyName?.trim() || '';
    const customJerseyNumber = opts?.jerseyNumber?.trim() || '';
    const qty = Math.max(1, opts?.qty || 1);

    const cartKey = [product.id, selectedSize, selectedHand, includeKnocking ? 'knock' : '', customJerseyName, customJerseyNumber].join('::');

    setCart((prev) => {
      const existing = prev.find((i) => i.cartKey === cartKey);
      if (existing) {
        return prev.map((i) =>
          i.cartKey === cartKey ? { ...i, quantity: Math.min(product.stock, i.quantity + qty) } : i
        );
      }
      return [
        ...prev,
        {
          cartKey,
          product,
          quantity: qty,
          selectedSize,
          selectedHand: selectedHand || undefined,
          includeKnocking,
          customJerseyName: customJerseyName || undefined,
          customJerseyNumber: customJerseyNumber || undefined,
        },
      ];
    });

    showToast(`Added ${product.name} to your bag.`);
    void StoreService.trackAnalyticsEvent({
      eventType: 'add_to_cart',
      product,
      userId: user?.uid || 'guest',
      units: qty,
    });
    if (opts?.openDrawer) {
      setCheckoutStep('cart');
      setIsCartOpen(true);
    }
  };

  const toggleWishlist = async (product: StoreProduct) => {
    const currentlySaved = wishlist.includes(product.id);
    setWishlist((prev) =>
      currentlySaved ? prev.filter((id) => id !== product.id) : [...prev, product.id]
    );
    showToast(
      currentlySaved
        ? `Removed "${product.name}" from wishlist.`
        : `Saved "${product.name}" to wishlist for later.`
    );
    await StoreService.toggleWishlistItem(user?.uid, product.id, currentlySaved);
  };

  const handleMoveWishlistItemToBag = async (product: StoreProduct) => {
    if (product.stock <= 0) {
      showToast('This saved item is currently out of stock.', 'error');
      return;
    }
    handleAddToCart(product, { openDrawer: false });
    if (wishlist.includes(product.id)) {
      setWishlist((prev) => prev.filter((id) => id !== product.id));
      await StoreService.toggleWishlistItem(user?.uid, product.id, true);
    }
  };

  const handleMoveAllWishlistToBag = async () => {
    const inStock = wishlistProducts.filter((p) => p.stock > 0);
    if (inStock.length === 0) {
      showToast('None of your saved items are currently in stock.', 'error');
      return;
    }
    inStock.forEach((p) => handleAddToCart(p, { openDrawer: false }));
    for (const p of inStock) {
      await StoreService.toggleWishlistItem(user?.uid, p.id, true);
    }
    setWishlist((prev) => prev.filter((id) => !inStock.some((p) => p.id === id)));
    setIsWishlistOpen(false);
    setCheckoutStep('cart');
    setIsCartOpen(true);
  };

  const toggleCompare = (productId: string) => {
    const targetProduct = products.find((p) => p.id === productId);
    setCompareIds((prev) => {
      if (prev.includes(productId)) {
        return prev.filter((id) => id !== productId);
      }
      if (prev.length >= MAX_COMPARE_ITEMS) {
        showToast(`You can compare up to ${MAX_COMPARE_ITEMS} items side by side.`, 'error');
        return prev;
      }
      const next = [...prev, productId];
      if (targetProduct) {
        if (next.length === 1) {
          showToast(`Added "${targetProduct.name}" to compare. Pick 1+ more item.`);
        } else {
          showToast(`${next.length} items ready to compare side by side.`);
        }
      }
      return next;
    });
  };

  const handleApplyCoupon = () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    const found = coupons.find((c) => c.code.toUpperCase() === code && c.is_active);
    if (!found) {
      showToast('Invalid or expired promo code.', 'error');
      return;
    }
    const minInCurr = getProductPriceInCurrency(found.min_order_usd, found.min_order_usd * 83.5, currency);
    if (cartSubtotal < minInCurr) {
      showToast(`Minimum order of ${formatRawStoreAmount(minInCurr, currency)} required for ${found.code}.`, 'error');
      return;
    }
    setAppliedCoupon(found);
    showToast(`Promo ${found.code} applied!`);
  };

  const hasCompleteShippingAddress = Boolean(
    shippingForm.name.trim() &&
      shippingForm.phone.trim() &&
      shippingForm.line1.trim() &&
      shippingForm.city.trim() &&
      shippingForm.postal_code.trim()
  );

  const getQuickBuyUnitPrice = (product: StoreProduct, knocking: boolean): number => {
    const base = getProductPriceInCurrency(product.price_usd, product.price_inr, currency);
    if (knocking && product.knocking_available) {
      const knockFee = getProductPriceInCurrency(
        product.knocking_fee_usd || 15,
        product.knocking_fee_inr || 999,
        currency
      );
      return Number((base + knockFee).toFixed(2));
    }
    return base;
  };

  const quickBuyTotals = useMemo(() => {
    if (!quickBuyProduct) return { unitPrice: 0, subtotal: 0, shipping: 0, total: 0 };
    const unitPrice = getQuickBuyUnitPrice(quickBuyProduct, quickBuyKnocking);
    const subtotal = Number((unitPrice * quickBuyQty).toFixed(2));
    const shipping = subtotal >= freeShippingThreshold ? 0 : getFlatShippingFee(currency);
    const total = Number((subtotal + shipping).toFixed(2));
    return { unitPrice, subtotal, shipping, total };
  }, [quickBuyProduct, quickBuyKnocking, quickBuyQty, currency, freeShippingThreshold]);

  const activeBankAccounts = useMemo(
    () => payoutAccounts.filter((a) => a.account_type === 'bank_transfer' && a.is_active !== false),
    [payoutAccounts]
  );

  const activeUpiAccounts = useMemo(
    () => payoutAccounts.filter((a) => a.account_type === 'upi' && a.is_active !== false),
    [payoutAccounts]
  );

  const activePaypalAccounts = useMemo(
    () => payoutAccounts.filter((a) => a.account_type === 'paypal' && a.is_active !== false),
    [payoutAccounts]
  );

  const activeCustomQrAccounts = useMemo(
    () => payoutAccounts.filter((a) => a.account_type === 'custom_qr' && a.is_active !== false),
    [payoutAccounts]
  );

  const activeRazorpayAccount = useMemo(
    () =>
      payoutAccounts.find((a) => a.account_type === 'razorpay' && a.is_active !== false && a.is_primary) ||
      payoutAccounts.find((a) => a.account_type === 'razorpay' && a.is_active !== false) ||
      null,
    [payoutAccounts]
  );

  const activeStripeAccount = useMemo(
    () =>
      payoutAccounts.find((a) => a.account_type === 'stripe' && a.is_active !== false && a.is_primary) ||
      payoutAccounts.find((a) => a.account_type === 'stripe' && a.is_active !== false) ||
      null,
    [payoutAccounts]
  );

  const selectedBankAccount = useMemo(() => {
    if (activeBankAccounts.length === 0) return null;
    return (
      activeBankAccounts.find((a) => a.id === selectedBankAccountId) ||
      activeBankAccounts.find((a) => a.is_primary && (a.currency_scope === currency || a.currency_scope === 'ALL')) ||
      activeBankAccounts.find((a) => a.is_primary) ||
      activeBankAccounts[0]
    );
  }, [activeBankAccounts, selectedBankAccountId, currency]);

  const primaryUpiAccount = useMemo(() => {
    if (activeUpiAccounts.length === 0) return null;
    return (
      activeUpiAccounts.find((a) => a.id === selectedUpiAccountId) ||
      activeUpiAccounts.find((a) => a.is_primary) ||
      activeUpiAccounts[0]
    );
  }, [activeUpiAccounts, selectedUpiAccountId]);

  const selectedPaypalAccount = useMemo(() => {
    if (activePaypalAccounts.length === 0) return null;
    return (
      activePaypalAccounts.find((a) => a.id === selectedPaypalAccountId) ||
      activePaypalAccounts.find((a) => a.is_primary) ||
      activePaypalAccounts[0]
    );
  }, [activePaypalAccounts, selectedPaypalAccountId]);

  const selectedCustomQrAccount = useMemo(() => {
    if (activeCustomQrAccounts.length === 0) return null;
    return (
      activeCustomQrAccounts.find((a) => a.id === selectedCustomQrAccountId) ||
      activeCustomQrAccounts.find((a) => a.is_primary) ||
      activeCustomQrAccounts[0]
    );
  }, [activeCustomQrAccounts, selectedCustomQrAccountId]);

  const effectiveUpiVpa = primaryUpiAccount?.upi_id || selectedBankAccount?.upi_id || '';
  const effectiveUpiPayeeName =
    primaryUpiAccount?.account_holder_name || selectedBankAccount?.account_holder_name || 'Streamlify Store';

  const syntheticUpiQrAccount: StorePayoutAccount | null = useMemo(() => {
    if (primaryUpiAccount) return primaryUpiAccount;
    if (!effectiveUpiVpa) return null;
    return {
      id: selectedBankAccount?.id || 'store-upi',
      label: selectedBankAccount?.label || 'Direct Store UPI',
      account_type: 'upi',
      account_holder_name: effectiveUpiPayeeName,
      upi_id: effectiveUpiVpa,
      qr_code_url: selectedBankAccount?.qr_code_url,
      qr_payload: selectedBankAccount?.qr_payload,
      instructions: selectedBankAccount?.instructions,
      currency_scope: 'INR',
      is_primary: true,
      is_active: true,
      created_at: selectedBankAccount?.created_at || '',
      updated_at: selectedBankAccount?.updated_at || '',
    };
  }, [primaryUpiAccount, effectiveUpiVpa, effectiveUpiPayeeName, selectedBankAccount]);

  const handleCopyBankDetail = async (fieldKey: string, value: string) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopiedBankField(fieldKey);
      showToast(`Copied ${fieldKey}`);
      window.setTimeout(() => {
        setCopiedBankField((prev) => (prev === fieldKey ? null : prev));
      }, 1600);
    } catch {
      showToast('Copy failed — please select and copy manually.', 'error');
    }
  };

  const buildUpiDeepLink = (vpa: string, payeeName: string, amount: number, note: string) => {
    const safeAmt = Math.max(1, Number(amount || 0)).toFixed(2);
    return `upi://pay?pa=${encodeURIComponent(vpa)}&pn=${encodeURIComponent(payeeName)}&am=${safeAmt}&cu=INR&tn=${encodeURIComponent(note)}`;
  };

  const formatPaymentMethodLabel = (method: StoreOrder['payment_method']) => {
    switch (method) {
      case 'bank_transfer':
        return 'Bank Transfer';
      case 'upi':
        return 'Direct UPI';
      case 'paypal':
        return 'PayPal';
      case 'custom_qr':
        return 'Custom QR';
      case 'razorpay':
        return 'Razorpay';
      case 'stripe':
        return 'Stripe Card';
      case 'cod':
        return 'Cash on Delivery';
      default:
        return String(method).replace('_', ' ');
    }
  };

  const formatOrderPaymentStatusLabel = (status: StoreOrder['payment_status']) => {
    if (status === 'awaiting_verification') return 'Awaiting Transfer Verification';
    if (status === 'pending_cod') return 'COD Due on Delivery';
    if (status === 'paid') return 'Paid';
    return status;
  };

  const openQuickBuyModal = (
    product: StoreProduct,
    opts?: { qty?: number; size?: string; hand?: string; knocking?: boolean }
  ) => {
    if (product.stock <= 0) {
      showToast('This item is currently out of stock.', 'error');
      return;
    }
    setQuickBuyProduct(product);
    setQuickBuyQty(Math.min(product.stock, Math.max(1, opts?.qty || 1)));
    setQuickBuySize(opts?.size || product.sizes?.[0] || 'Standard');
    setQuickBuyHand(opts?.hand || product.handedness_options?.[0] || '');
    setQuickBuyKnocking(Boolean(opts?.knocking && product.knocking_available));
    setQuickBuyConfirmedOrder(null);
    setShowAddQuickPaymentForm(false);
    setBankTransferRef('');
    setIsEditingQuickAddress(!hasCompleteShippingAddress);
    const defSaved = savedPaymentMethods.find((m) => m.is_default) || savedPaymentMethods[0];
    if (!selectedQuickMethodId) {
      setSelectedQuickMethodId(defSaved ? defSaved.id : 'cod-instant');
    } else if (defSaved && defSaved.provider === 'bank_transfer' && defSaved.brand && !payerBankName) {
      setPayerBankName(defSaved.brand);
    }

    void StoreService.trackAnalyticsEvent({
      eventType: 'quick_buy_open',
      product,
      userId: user?.uid || 'guest',
      checkoutMode: 'quick_buy',
    });
  };

  const handleSaveQuickPaymentMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPayProvider === 'stripe_card') {
      const cleanDigits = newPayLast4.replace(/\D/g, '');
      if (cleanDigits.length !== 4) {
        showToast('Enter the last 4 digits of your card for display reference.', 'error');
        return;
      }
      if (!/^\d{2}\/\d{2}$/.test(newPayExpiry.trim())) {
        showToast('Enter expiry as MM/YY.', 'error');
        return;
      }
    }
    if ((newPayProvider === 'razorpay_upi' || newPayProvider === 'upi') && !newPayUpi.includes('@')) {
      showToast('Enter a valid UPI ID (e.g. player@okaxis).', 'error');
      return;
    }
    if (newPayProvider === 'bank_transfer' && !newPayBankName.trim()) {
      showToast('Enter your bank name (e.g. HDFC Bank, Chase, SBI).', 'error');
      return;
    }

    setSavingQuickMethod(true);
    try {
      const cleanLast4 = newPayLast4.replace(/\D/g, '').slice(-4);
      const maskedUpi =
        newPayProvider === 'razorpay_upi' || newPayProvider === 'upi'
          ? newPayUpi.trim()
          : undefined;
      const bankTitle = newPayBankName.trim();
      const label =
        newPayProvider === 'stripe_card'
          ? `${newPayBrand} •••• ${cleanLast4}`
          : newPayProvider === 'razorpay_upi'
          ? `Razorpay UPI · ${maskedUpi}`
          : newPayProvider === 'upi'
          ? `Direct UPI · ${maskedUpi}`
          : newPayProvider === 'bank_transfer'
          ? `${bankTitle}${cleanLast4 ? ` •••• ${cleanLast4}` : ' Bank Transfer'}`
          : 'Cash on Delivery (Instant)';

      const saved = await StoreService.savePaymentMethod({
        userId: user?.uid || 'guest',
        provider: newPayProvider,
        label,
        brand:
          newPayProvider === 'stripe_card'
            ? newPayBrand
            : newPayProvider === 'razorpay_upi'
            ? 'UPI'
            : newPayProvider === 'upi'
            ? 'Direct UPI'
            : newPayProvider === 'bank_transfer'
            ? bankTitle
            : 'COD',
        last4: cleanLast4 || undefined,
        expiry: newPayProvider === 'stripe_card' ? newPayExpiry.trim() : undefined,
        isDefault: true,
      });

      setSavedPaymentMethods((prev) => [
        saved,
        ...prev.filter((m) => m.id !== saved.id).map((m) => ({ ...m, is_default: false })),
      ]);
      setSelectedQuickMethodId(saved.id);
      if (newPayProvider === 'bank_transfer' && bankTitle) {
        setPayerBankName(bankTitle);
      }
      setShowAddQuickPaymentForm(false);
      setNewPayLast4('');
      setNewPayExpiry('');
      setNewPayUpi('');
      setNewPayBankName('');
      showToast(`Saved "${saved.label}" for Quick Buy.`);
    } catch (err: any) {
      showToast(err?.message || 'Failed to save payment method.', 'error');
    } finally {
      setSavingQuickMethod(false);
    }
  };

  const handleSetDefaultQuickMethod = async (methodId: string) => {
    setSelectedQuickMethodId(methodId);
    const chosen = savedPaymentMethods.find((m) => m.id === methodId);
    if (chosen?.provider === 'bank_transfer' && chosen.brand) {
      setPayerBankName(chosen.brand);
    }
    setSavedPaymentMethods((prev) =>
      prev.map((m) => ({ ...m, is_default: m.id === methodId }))
    );
    await StoreService.setDefaultPaymentMethod(user?.uid, methodId);
  };

  const handleDeleteQuickMethod = async (methodId: string) => {
    await StoreService.deleteSavedPaymentMethod(methodId);
    setSavedPaymentMethods((prev) => {
      const next = prev.filter((m) => m.id !== methodId);
      if (selectedQuickMethodId === methodId) {
        setSelectedQuickMethodId(next[0]?.id || 'cod-instant');
      }
      return next;
    });
    showToast('Removed saved payment method.');
  };

  const persistShippingAndSyncOrder = async (
    order: StoreOrder,
    purchasedItems: { product_id: string; quantity: number }[],
    checkoutMode: 'quick_buy' | 'cart_checkout',
    primaryProduct?: StoreProduct
  ) => {
    StoreService.saveShippingAddress(user?.uid, {
      name: shippingForm.name.trim(),
      email: shippingForm.email.trim(),
      phone: shippingForm.phone.trim(),
      line1: shippingForm.line1.trim(),
      city: shippingForm.city.trim(),
      state: shippingForm.state.trim(),
      postal_code: shippingForm.postal_code.trim(),
      country: shippingForm.country.trim(),
    });

    await StoreService.decrementStockAfterOrder(purchasedItems, canAccessStoreAdmin);
    const updatedProducts = products.map((p) => {
      const boughtQty = purchasedItems
        .filter((it) => it.product_id === p.id)
        .reduce((sum, it) => sum + it.quantity, 0);
      if (!boughtQty) return p;
      return {
        ...p,
        stock: Math.max(0, p.stock - boughtQty),
        units_ordered: (p.units_ordered || 0) + boughtQty,
      };
    });
    setProducts(updatedProducts);

    if (canAccessStoreAdmin) {
      try {
        const [cfg, existingAlerts] = await Promise.all([
          StoreService.fetchAlertConfig(),
          StoreService.fetchStockAlerts(),
        ]);
        await StoreService.syncAutomatedStockAlerts({
          products: updatedProducts,
          orders: [order, ...orders],
          reviews: allReviews,
          config: cfg,
          existingAlerts,
          adminUserId: user?.uid,
        });
      } catch {
        // non-blocking alert sync
      }
    }

    const totalUnits = purchasedItems.reduce((s, it) => s + it.quantity, 0);
    const revenueUsd =
      order.currency === 'INR'
        ? Number((order.total / 83.5).toFixed(2))
        : Number(order.total || 0);

    void StoreService.trackAnalyticsEvent({
      eventType: 'order_completed',
      product: primaryProduct,
      userId: user?.uid || 'guest',
      checkoutMode,
      revenueUsd,
      units: totalUnits,
    });

    setOrders((prev) => [order, ...prev]);
    setTrackedOrderId(order.id);
  };

  const finalizeOrderRecord = async (
    method: 'stripe' | 'razorpay' | 'cod' | 'bank_transfer' | 'upi' | 'paypal' | 'custom_qr',
    paymentStatus: 'paid' | 'pending_cod' | 'awaiting_verification',
    settlementMeta?: {
      payment_reference?: string;
      payer_bank_name?: string;
      receiving_account_id?: string;
      receiving_account_label?: string;
    }
  ) => {
    const order = await StoreService.createOrder({
      user_id: user?.uid || 'guest',
      customer_name: shippingForm.name.trim(),
      customer_email: shippingForm.email.trim(),
      customer_phone: shippingForm.phone.trim(),
      shipping_address: {
        line1: shippingForm.line1.trim(),
        city: shippingForm.city.trim(),
        state: shippingForm.state.trim(),
        postal_code: shippingForm.postal_code.trim(),
        country: shippingForm.country.trim(),
      },
      items: cart.map((item) => ({
        product_id: item.product.id,
        sku: item.product.sku,
        name: item.product.name,
        brand: item.product.brand,
        quantity: item.quantity,
        selected_size: item.selectedSize,
        selected_hand: item.selectedHand,
        include_knocking: item.includeKnocking,
        custom_print:
          item.customJerseyName || item.customJerseyNumber
            ? `${item.customJerseyName || ''} #${item.customJerseyNumber || ''}`.trim()
            : undefined,
        unit_price: getCartItemUnitPrice(item),
      })),
      currency,
      subtotal: cartSubtotal,
      discount: discountAmount,
      shipping_fee: shippingFee,
      total: cartTotal,
      coupon_code: appliedCoupon?.code,
      payment_method: method,
      payment_status: paymentStatus,
      ...(settlementMeta?.payment_reference
        ? { payment_reference: String(settlementMeta.payment_reference).slice(0, 120) }
        : {}),
      ...(settlementMeta?.payer_bank_name
        ? { payer_bank_name: String(settlementMeta.payer_bank_name).slice(0, 100) }
        : {}),
      ...(settlementMeta?.receiving_account_id
        ? { receiving_account_id: String(settlementMeta.receiving_account_id).slice(0, 128) }
        : {}),
      ...(settlementMeta?.receiving_account_label
        ? { receiving_account_label: String(settlementMeta.receiving_account_label).slice(0, 120) }
        : {}),
      status: 'pending',
      checkout_mode: 'cart_checkout',
    });

    const purchasedItems = cart.map((item) => ({
      product_id: item.product.id,
      quantity: item.quantity,
    }));

    await persistShippingAndSyncOrder(order, purchasedItems, 'cart_checkout', cart[0]?.product);

    setCart([]);
    setAppliedCoupon(null);
    setBankTransferRef('');
    setConfirmedOrder(order);
    setCheckoutStep('confirmed');
    showToast(
      paymentStatus === 'awaiting_verification'
        ? `Order ${order.order_number} submitted for bank transfer verification!`
        : `Order ${order.order_number} confirmed!`
    );
  };

  const finalizeQuickBuyOrder = async (
    targetProduct: StoreProduct,
    method: 'stripe' | 'razorpay' | 'cod' | 'bank_transfer' | 'upi' | 'paypal' | 'custom_qr',
    paymentStatus: 'paid' | 'pending_cod' | 'awaiting_verification',
    settlementMeta?: {
      payment_reference?: string;
      payer_bank_name?: string;
      receiving_account_id?: string;
      receiving_account_label?: string;
    }
  ) => {
    const unitPrice = getQuickBuyUnitPrice(targetProduct, quickBuyKnocking);
    const subtotal = Number((unitPrice * quickBuyQty).toFixed(2));
    const shipFee = subtotal >= freeShippingThreshold ? 0 : getFlatShippingFee(currency);
    const total = Number((subtotal + shipFee).toFixed(2));

    const order = await StoreService.createOrder({
      user_id: user?.uid || 'guest',
      customer_name: shippingForm.name.trim(),
      customer_email: shippingForm.email.trim(),
      customer_phone: shippingForm.phone.trim(),
      shipping_address: {
        line1: shippingForm.line1.trim(),
        city: shippingForm.city.trim(),
        state: shippingForm.state.trim(),
        postal_code: shippingForm.postal_code.trim(),
        country: shippingForm.country.trim(),
      },
      items: [
        {
          product_id: targetProduct.id,
          sku: targetProduct.sku,
          name: targetProduct.name,
          brand: targetProduct.brand,
          quantity: quickBuyQty,
          selected_size: quickBuySize,
          selected_hand: quickBuyHand || undefined,
          include_knocking: Boolean(quickBuyKnocking && targetProduct.knocking_available),
          unit_price: unitPrice,
        },
      ],
      currency,
      subtotal,
      discount: 0,
      shipping_fee: shipFee,
      total,
      payment_method: method,
      payment_status: paymentStatus,
      ...(settlementMeta?.payment_reference
        ? { payment_reference: String(settlementMeta.payment_reference).slice(0, 120) }
        : {}),
      ...(settlementMeta?.payer_bank_name
        ? { payer_bank_name: String(settlementMeta.payer_bank_name).slice(0, 100) }
        : {}),
      ...(settlementMeta?.receiving_account_id
        ? { receiving_account_id: String(settlementMeta.receiving_account_id).slice(0, 128) }
        : {}),
      ...(settlementMeta?.receiving_account_label
        ? { receiving_account_label: String(settlementMeta.receiving_account_label).slice(0, 120) }
        : {}),
      status: 'pending',
      checkout_mode: 'quick_buy',
    });

    await persistShippingAndSyncOrder(
      order,
      [{ product_id: targetProduct.id, quantity: quickBuyQty }],
      'quick_buy',
      targetProduct
    );

    setBankTransferRef('');
    setQuickBuyConfirmedOrder(order);
    showToast(
      paymentStatus === 'awaiting_verification'
        ? `Quick Buy ${order.order_number} submitted for bank verification!`
        : `Quick Buy order ${order.order_number} confirmed!`
    );
  };

  const handleQuickBuySubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!quickBuyProduct) return;
    if (quickBuyProduct.stock < quickBuyQty) {
      showToast('Requested quantity exceeds available stock.', 'error');
      return;
    }
    if (!hasCompleteShippingAddress) {
      setIsEditingQuickAddress(true);
      showToast('Please enter your delivery details for 1-click checkout.', 'error');
      return;
    }

    const activeSaved = savedPaymentMethods.find((m) => m.id === selectedQuickMethodId);
    const provider: SavedPaymentProvider =
      selectedQuickMethodId === 'bank-transfer-direct'
        ? 'bank_transfer'
        : selectedQuickMethodId === 'upi-direct'
        ? 'upi'
        : selectedQuickMethodId === 'paypal-direct'
        ? 'paypal'
        : selectedQuickMethodId === 'custom-qr-direct'
        ? 'custom_qr'
        : activeSaved
        ? activeSaved.provider
        : 'cod';

    if (provider === 'bank_transfer') {
      if (!selectedBankAccount) {
        showToast('No active admin receiving bank account is configured right now.', 'error');
        return;
      }
      if (bankTransferRef.trim().length < 4) {
        showToast('Enter your Bank Transaction / UTR reference number after completing the transfer.', 'error');
        return;
      }
    }

    if (provider === 'upi') {
      if (!effectiveUpiVpa && !syntheticUpiQrAccount?.qr_code_url) {
        showToast('No active admin UPI VPA is configured right now.', 'error');
        return;
      }
      if (bankTransferRef.trim().length < 4) {
        showToast('Enter your UPI Transaction / UTR reference number after transferring.', 'error');
        return;
      }
    }

    if (provider === 'paypal') {
      if (!selectedPaypalAccount) {
        showToast('No active admin PayPal receiving account is configured right now.', 'error');
        return;
      }
      if (bankTransferRef.trim().length < 4) {
        showToast('Enter your PayPal Transaction ID after sending payment.', 'error');
        return;
      }
    }

    if (provider === 'custom_qr') {
      if (!selectedCustomQrAccount) {
        showToast('No active merchant payment QR is configured right now.', 'error');
        return;
      }
      if (bankTransferRef.trim().length < 4) {
        showToast('Enter your Payment Reference / Receipt ID after scanning the QR code.', 'error');
        return;
      }
    }

    void StoreService.trackAnalyticsEvent({
      eventType: 'checkout_start',
      product: quickBuyProduct,
      userId: user?.uid || 'guest',
      checkoutMode: 'quick_buy',
      units: quickBuyQty,
      revenueUsd:
        currency === 'INR'
          ? Number((quickBuyTotals.total / 83.5).toFixed(2))
          : quickBuyTotals.total,
    });

    setQuickBuyPlacing(true);
    try {
      if (provider === 'cod') {
        await finalizeQuickBuyOrder(quickBuyProduct, 'cod', 'pending_cod');
      } else if (provider === 'bank_transfer' && selectedBankAccount) {
        await finalizeQuickBuyOrder(quickBuyProduct, 'bank_transfer', 'awaiting_verification', {
          payment_reference: bankTransferRef.trim(),
          payer_bank_name: payerBankName.trim() || activeSaved?.brand || 'Buyer Bank Account',
          receiving_account_id: selectedBankAccount.id,
          receiving_account_label: selectedBankAccount.label,
        });
      } else if (provider === 'upi' && (effectiveUpiVpa || syntheticUpiQrAccount)) {
        await finalizeQuickBuyOrder(quickBuyProduct, 'upi', 'awaiting_verification', {
          payment_reference: bankTransferRef.trim(),
          payer_bank_name: payerBankName.trim() || activeSaved?.label || 'Direct UPI',
          receiving_account_id: primaryUpiAccount?.id || selectedBankAccount?.id,
          receiving_account_label: primaryUpiAccount?.label || selectedBankAccount?.label || effectiveUpiVpa,
        });
      } else if (provider === 'paypal' && selectedPaypalAccount) {
        await finalizeQuickBuyOrder(quickBuyProduct, 'paypal', 'awaiting_verification', {
          payment_reference: bankTransferRef.trim(),
          payer_bank_name: payerBankName.trim() || 'PayPal Transfer',
          receiving_account_id: selectedPaypalAccount.id,
          receiving_account_label: selectedPaypalAccount.label,
        });
      } else if (provider === 'custom_qr' && selectedCustomQrAccount) {
        await finalizeQuickBuyOrder(quickBuyProduct, 'custom_qr', 'awaiting_verification', {
          payment_reference: bankTransferRef.trim(),
          payer_bank_name: payerBankName.trim() || 'Custom QR Transfer',
          receiving_account_id: selectedCustomQrAccount.id,
          receiving_account_label: selectedCustomQrAccount.label,
        });
      } else if (provider === 'stripe_card') {
        if (!user) {
          showToast('Please sign in to pay with a saved Stripe Card, or choose Direct Bank Transfer / COD.', 'error');
          setQuickBuyPlacing(false);
          return;
        }
        const res = await fetch('/api/stripe/create-checkout-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${await user.getIdToken()}`,
          },
          body: JSON.stringify({
            amount: quickBuyTotals.total,
            currency: currency.toLowerCase(),
            description: `Quick Buy: ${quickBuyProduct.name} x${quickBuyQty}`,
          }),
        });
        const data = await res.json();
        await finalizeQuickBuyOrder(quickBuyProduct, 'stripe', 'paid', {
          receiving_account_id: activeStripeAccount?.id,
          receiving_account_label: activeStripeAccount?.label || 'Primary Stripe Payout',
        });
        if (data.url && !data.simulated) {
          window.location.href = data.url;
        }
      } else if (provider === 'razorpay_upi') {
        if (!user) {
          showToast('Please sign in to pay via Razorpay, or choose Direct Bank Transfer / COD.', 'error');
          setQuickBuyPlacing(false);
          return;
        }
        const totalInr = Math.round(
          currency === 'INR'
            ? quickBuyTotals.total
            : quickBuyProduct.price_inr * quickBuyQty
        );
        const configRes = await fetch('/api/config');
        const configData = configRes.ok ? await configRes.json() : {};
        const rzpKey = activeRazorpayAccount?.razorpay_key_id || configData.razorpayKeyId;
        const res = await fetch('/api/payments/razorpay/create-order', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${await user.getIdToken()}`,
          },
          body: JSON.stringify({
            amount: totalInr,
            description: `Quick Buy: ${quickBuyProduct.name} x${quickBuyQty}`,
            receivingAccountId: activeRazorpayAccount?.id,
            receivingAccountLabel: activeRazorpayAccount?.label,
            razorpayAccountId: activeRazorpayAccount?.razorpay_account_id,
            razorpayKeyId: activeRazorpayAccount?.razorpay_key_id,
          }),
        });
        const data = await res.json();
        if ((data.orderId || data.customKeyId) && rzpKey && (window as any).Razorpay) {
          const targetSnap = quickBuyProduct;
          const rzp = new (window as any).Razorpay({
            key: data.customKeyId || rzpKey,
            amount: data.amount,
            currency: 'INR',
            name: 'Streamlify Store Quick Buy',
            description: `${targetSnap.name} x${quickBuyQty}`,
            ...(data.orderId ? { order_id: data.orderId } : {}),
            handler: async (resp: any) => {
              await finalizeQuickBuyOrder(targetSnap, 'razorpay', 'paid', {
                payment_reference: resp?.razorpay_payment_id,
                receiving_account_id: activeRazorpayAccount?.id,
                receiving_account_label: activeRazorpayAccount?.label || 'Primary Razorpay',
              });
            },
            prefill: {
              name: shippingForm.name,
              email: shippingForm.email,
              contact: shippingForm.phone,
            },
            theme: { color: '#d11a2a' },
          });
          rzp.open();
        } else {
          await finalizeQuickBuyOrder(quickBuyProduct, 'razorpay', 'paid', {
            receiving_account_id: activeRazorpayAccount?.id,
            receiving_account_label: activeRazorpayAccount?.label || 'Primary Razorpay',
          });
        }
      }
    } catch (err: any) {
      console.error(err);
      showToast(err?.message || 'Quick Buy failed. Please try again.', 'error');
    } finally {
      setQuickBuyPlacing(false);
    }
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shippingForm.name.trim() || !shippingForm.phone.trim() || !shippingForm.line1.trim() || !shippingForm.city.trim() || !shippingForm.postal_code.trim()) {
      showToast('Please fill in all required delivery address fields.', 'error');
      return;
    }

    if (paymentMethod === 'bank_transfer') {
      if (!selectedBankAccount) {
        showToast('No active receiving bank account is configured by the store admin.', 'error');
        return;
      }
      if (bankTransferRef.trim().length < 4) {
        showToast('Enter your Bank Transaction / UTR / Wire reference number.', 'error');
        return;
      }
    }

    if (paymentMethod === 'upi') {
      if (!effectiveUpiVpa && !syntheticUpiQrAccount?.qr_code_url) {
        showToast('No active receiving UPI ID is configured by the store admin.', 'error');
        return;
      }
      if (bankTransferRef.trim().length < 4) {
        showToast('Enter your UPI Transaction / UTR reference number.', 'error');
        return;
      }
    }

    if (paymentMethod === 'paypal') {
      if (!selectedPaypalAccount) {
        showToast('No active receiving PayPal account is configured by the store admin.', 'error');
        return;
      }
      if (bankTransferRef.trim().length < 4) {
        showToast('Enter your PayPal Transaction ID.', 'error');
        return;
      }
    }

    if (paymentMethod === 'custom_qr') {
      if (!selectedCustomQrAccount) {
        showToast('No active merchant payment QR code is configured by the store admin.', 'error');
        return;
      }
      if (bankTransferRef.trim().length < 4) {
        showToast('Enter your Payment Reference / Receipt ID.', 'error');
        return;
      }
    }

    setPlacingOrder(true);
    try {
      if (paymentMethod === 'cod') {
        await finalizeOrderRecord('cod', 'pending_cod');
      } else if (paymentMethod === 'bank_transfer' && selectedBankAccount) {
        await finalizeOrderRecord('bank_transfer', 'awaiting_verification', {
          payment_reference: bankTransferRef.trim(),
          payer_bank_name: payerBankName.trim() || 'Buyer Bank Account',
          receiving_account_id: selectedBankAccount.id,
          receiving_account_label: selectedBankAccount.label,
        });
      } else if (paymentMethod === 'upi' && (effectiveUpiVpa || syntheticUpiQrAccount)) {
        await finalizeOrderRecord('upi', 'awaiting_verification', {
          payment_reference: bankTransferRef.trim(),
          payer_bank_name: payerBankName.trim() || 'Direct UPI App',
          receiving_account_id: primaryUpiAccount?.id || selectedBankAccount?.id,
          receiving_account_label: primaryUpiAccount?.label || selectedBankAccount?.label || effectiveUpiVpa,
        });
      } else if (paymentMethod === 'paypal' && selectedPaypalAccount) {
        await finalizeOrderRecord('paypal', 'awaiting_verification', {
          payment_reference: bankTransferRef.trim(),
          payer_bank_name: payerBankName.trim() || 'PayPal Transfer',
          receiving_account_id: selectedPaypalAccount.id,
          receiving_account_label: selectedPaypalAccount.label,
        });
      } else if (paymentMethod === 'custom_qr' && selectedCustomQrAccount) {
        await finalizeOrderRecord('custom_qr', 'awaiting_verification', {
          payment_reference: bankTransferRef.trim(),
          payer_bank_name: payerBankName.trim() || 'Custom QR Transfer',
          receiving_account_id: selectedCustomQrAccount.id,
          receiving_account_label: selectedCustomQrAccount.label,
        });
      } else if (paymentMethod === 'stripe') {
        if (!user) {
          showToast('Please sign in to pay by Card via Stripe, or choose Direct Bank Transfer / COD.', 'error');
          setPlacingOrder(false);
          return;
        }
        const res = await fetch('/api/stripe/create-checkout-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${await user.getIdToken()}`,
          },
          body: JSON.stringify({
            amount: cartTotal,
            currency: currency.toLowerCase(),
            description: `Streamlify Store (${cartCount} items)`,
          }),
        });
        const data = await res.json();
        await finalizeOrderRecord('stripe', 'paid', {
          receiving_account_id: activeStripeAccount?.id,
          receiving_account_label: activeStripeAccount?.label || 'Primary Stripe Payout',
        });
        if (data.url && !data.simulated) {
          window.location.href = data.url;
        }
      } else if (paymentMethod === 'razorpay') {
        if (!user) {
          showToast('Please sign in to pay via Razorpay, or choose Direct Bank Transfer / COD.', 'error');
          setPlacingOrder(false);
          return;
        }
        const totalInr = Math.round(
          currency === 'INR'
            ? cartTotal
            : cart.reduce((s, i) => s + i.product.price_inr * i.quantity, 0)
        );
        const configRes = await fetch('/api/config');
        const configData = configRes.ok ? await configRes.json() : {};
        const rzpKey = activeRazorpayAccount?.razorpay_key_id || configData.razorpayKeyId;
        const res = await fetch('/api/payments/razorpay/create-order', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${await user.getIdToken()}`,
          },
          body: JSON.stringify({
            amount: totalInr,
            description: `Streamlify Store Order (${cartCount} items)`,
            receivingAccountId: activeRazorpayAccount?.id,
            receivingAccountLabel: activeRazorpayAccount?.label,
            razorpayAccountId: activeRazorpayAccount?.razorpay_account_id,
            razorpayKeyId: activeRazorpayAccount?.razorpay_key_id,
          }),
        });
        const data = await res.json();
        if ((data.orderId || data.customKeyId) && rzpKey && (window as any).Razorpay) {
          const rzp = new (window as any).Razorpay({
            key: data.customKeyId || rzpKey,
            amount: data.amount,
            currency: 'INR',
            name: 'Streamlify Store',
            description: `Gear Order (${cartCount} items)`,
            ...(data.orderId ? { order_id: data.orderId } : {}),
            handler: async (resp: any) => {
              await finalizeOrderRecord('razorpay', 'paid', {
                payment_reference: resp?.razorpay_payment_id,
                receiving_account_id: activeRazorpayAccount?.id,
                receiving_account_label: activeRazorpayAccount?.label || 'Primary Razorpay',
              });
            },
            prefill: {
              name: shippingForm.name,
              email: shippingForm.email,
              contact: shippingForm.phone,
            },
            theme: { color: '#d11a2a' },
          });
          rzp.open();
        } else {
          await finalizeOrderRecord('razorpay', 'paid', {
            receiving_account_id: activeRazorpayAccount?.id,
            receiving_account_label: activeRazorpayAccount?.label || 'Primary Razorpay',
          });
        }
      }
    } catch (err: any) {
      console.error(err);
      showToast(err?.message || 'Checkout failed. Please try again.', 'error');
    } finally {
      setPlacingOrder(false);
    }
  };

  const verifiedPurchaseOrder = useMemo(() => {
    if (!selectedProduct) return null;
    return StoreService.getVerifiedPurchaseOrder(orders, user?.uid, selectedProduct.id);
  }, [selectedProduct, orders, user?.uid]);

  const existingUserReview = useMemo(() => {
    if (!user?.uid) return null;
    return pdpReviews.find((r) => r.user_id === user.uid) || null;
  }, [pdpReviews, user?.uid]);

  const handleStartEditReview = (rev: StoreReview) => {
    setEditingReviewId(rev.id);
    setNewReviewRating(rev.rating);
    setNewReviewTitle(rev.title);
    setNewReviewComment(rev.comment);
  };

  const handleDeleteReview = async (reviewId: string) => {
    try {
      await StoreService.deleteReview(reviewId);
      setPdpReviews((prev) => prev.filter((r) => r.id !== reviewId));
      setAllReviews((prev) => prev.filter((r) => r.id !== reviewId));
      if (editingReviewId === reviewId) {
        setEditingReviewId(null);
        setNewReviewTitle('');
        setNewReviewComment('');
        setNewReviewRating(5);
      }
      showToast('Review deleted.');
    } catch {
      showToast('Failed to delete review.', 'error');
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    if (!user || user.uid === 'guest') {
      showToast('Sign in with your buyer account to leave a verified product review.', 'error');
      return;
    }
    if (!verifiedPurchaseOrder && !editingReviewId) {
      showToast('Verified purchase required: only customers who ordered this item can leave a review.', 'error');
      return;
    }
    if (!newReviewComment.trim()) {
      showToast('Please write a review comment.', 'error');
      return;
    }

    setSubmittingReview(true);
    try {
      if (editingReviewId) {
        const updated = await StoreService.updateReview(editingReviewId, {
          rating: newReviewRating,
          title: newReviewTitle.trim() || 'Verified Buyer Review',
          comment: newReviewComment.trim(),
        });
        const nextUpdatedAt = updated?.updated_at || new Date().toISOString();
        const patchList = (list: StoreReview[]) =>
          list.map((r) =>
            r.id === editingReviewId
              ? {
                  ...r,
                  rating: newReviewRating,
                  title: newReviewTitle.trim() || 'Verified Buyer Review',
                  comment: newReviewComment.trim(),
                  updated_at: nextUpdatedAt,
                }
              : r
          );
        setPdpReviews(patchList);
        setAllReviews(patchList);
        setEditingReviewId(null);
        setNewReviewTitle('');
        setNewReviewComment('');
        setNewReviewRating(5);
        showToast('Your verified review was updated!');
      } else {
        const review = await StoreService.submitReview({
          product_id: selectedProduct.id,
          user_id: user.uid,
          user_name: user.displayName || user.email?.split('@')[0] || 'Verified Buyer',
          rating: newReviewRating,
          title: newReviewTitle.trim() || 'Verified Buyer Review',
          comment: newReviewComment.trim(),
          verified_purchase: true,
          verified_order_number: verifiedPurchaseOrder?.order_number,
        });
        setPdpReviews((prev) => [review, ...prev]);
        setAllReviews((prev) => [review, ...prev]);
        setNewReviewTitle('');
        setNewReviewComment('');
        setNewReviewRating(5);
        showToast('Verified purchase review published!');
      }
    } catch (err: any) {
      showToast(err?.message || 'Failed to submit review.', 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleVerifySerial = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = serialQuery.trim().toUpperCase();
    if (!cleaned || cleaned.length < 5) {
      setSerialResult({ valid: false, message: 'Enter a valid serial number (e.g. SG-PRO-92841).' });
      return;
    }
    const matched = products.find(
      (p) => p.authenticity_prefix && cleaned.startsWith(p.authenticity_prefix.toUpperCase())
    );
    const matchedCustomBrand = customBrands.find(
      (b) => b.authenticity_prefix && cleaned.startsWith(b.authenticity_prefix.toUpperCase())
    );
    if (matched) {
      setSerialResult({
        valid: true,
        message: `Authentic ${matched.brand} Product Verified — Covered under official manufacturer warranty.`,
        product: matched,
      });
    } else if (matchedCustomBrand) {
      setSerialResult({
        valid: true,
        message: `Authentic ${matchedCustomBrand.name} Brand Serial Verified — Covered under official store brand warranty.`,
      });
    } else {
      setSerialResult({
        valid: false,
        message: 'Serial prefix not found in active catalog authenticity registry.',
      });
    }
  };

  const handleReorder = (ord: StoreOrder) => {
    let addedCount = 0;
    for (const item of ord.items || []) {
      const prod = products.find((p) => p.id === item.product_id);
      if (prod && prod.stock > 0) {
        handleAddToCart(prod, {
          size: item.selected_size,
          hand: item.selected_hand,
          knocking: item.include_knocking,
          qty: Math.min(prod.stock, item.quantity),
          openDrawer: false,
        });
        addedCount++;
      }
    }
    if (addedCount > 0) {
      setIsOrdersOpen(false);
      setCheckoutStep('cart');
      setIsCartOpen(true);
    } else {
      showToast('Items from this order are currently unavailable or out of stock.', 'error');
    }
  };

  const handleTrackLookup = (e: React.FormEvent) => {
    e.preventDefault();
    const q = trackInput.trim().toUpperCase();
    if (!q) return;
    const match = orders.find(
      (o) =>
        o.order_number.toUpperCase() === q ||
        (o.tracking_number && o.tracking_number.toUpperCase() === q)
    );
    if (match) {
      setTrackedOrderId(match.id);
      showToast(`Showing shipment timeline for ${match.order_number}.`);
    } else {
      showToast('No matching Order ID or Tracking Number found in your orders.', 'error');
    }
  };

  const filteredOrderHistory = useMemo(() => {
    const q = orderSearchQuery.trim().toLowerCase();
    return orders.filter((ord) => {
      if (orderHistoryFilter === 'active' && (ord.status === 'delivered' || ord.status === 'cancelled')) return false;
      if (orderHistoryFilter === 'delivered' && ord.status !== 'delivered') return false;
      if (orderHistoryFilter === 'cancelled' && ord.status !== 'cancelled') return false;
      if (q) {
        const hay = `${ord.order_number} ${ord.tracking_number || ''} ${(ord.items || []).map((i) => `${i.name} ${i.sku}`).join(' ')}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [orders, orderHistoryFilter, orderSearchQuery]);

  const activeTrackedOrder = useMemo(() => {
    return orders.find((o) => o.id === trackedOrderId) || orders[0] || null;
  }, [orders, trackedOrderId]);

  const compareProducts = useMemo(
    () =>
      compareIds
        .map((id) => products.find((p) => p.id === id))
        .filter((p): p is StoreProduct => Boolean(p)),
    [products, compareIds]
  );

  const uncomparedProducts = useMemo(
    () => products.filter((p) => !compareIds.includes(p.id)),
    [products, compareIds]
  );

  return (
    <div className="min-h-full bg-slate-50 text-slate-900 pb-20" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Top Store Utility Navigation */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          {/* Domain Segmented Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto hide-scrollbar max-w-full">
            {(['All', ...STORE_PRIMARY_DOMAINS] as const).map((dom) => {
              const active = activeDomain === dom;
              return (
                <button
                  key={dom}
                  onClick={() => {
                    setActiveDomain(dom);
                    setActiveSport('All');
                    setActiveCategory('All');
                  }}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    active ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {dom === 'All' ? 'All Gear' : dom}
                </button>
              );
            })}
          </div>

          {/* Action Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            <select
              aria-label="Store currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value as StoreCurrency)}
              className="px-2.5 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg bg-white text-slate-700 font-mono"
            >
              {STORE_CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>{c.label}</option>
              ))}
            </select>

            <button
              onClick={() => setIsWishlistOpen(true)}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <Heart className={`w-3.5 h-3.5 ${wishlist.length > 0 ? 'fill-[#d11a2a] text-[#d11a2a]' : ''}`} />
              <span className="tabular-nums">Wishlist ({wishlist.length})</span>
            </button>

            <button
              onClick={() => setIsCompareOpen(true)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                compareProducts.length >= 2
                  ? 'border-slate-900 bg-slate-900 text-white hover:bg-slate-800'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              <span className="tabular-nums">Compare ({compareProducts.length}/{MAX_COMPARE_ITEMS})</span>
            </button>

            <button
              onClick={() => {
                setOrdersTab('history');
                setIsOrdersOpen(true);
              }}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <Clock className="w-3.5 h-3.5" />
              <span className="tabular-nums">Order History ({orders.length})</span>
            </button>

            <button
              onClick={() => {
                setOrdersTab('track');
                setIsOrdersOpen(true);
              }}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Track Order</span>
            </button>

            {canAccessStoreAdmin && setFullScreenView && (
              <button
                onClick={() => setFullScreenView('Store Admin')}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
              >
                <Settings className="w-3.5 h-3.5" />
                Store Admin
              </button>
            )}

            <button
              onClick={() => {
                setCheckoutStep('cart');
                setIsCartOpen(true);
              }}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-[#d11a2a] hover:bg-[#b51523] text-white transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 shadow-sm"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span className="tabular-nums">Bag ({cartCount})</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 pt-6 space-y-8">
        {/* Section 1: Storefront Hero Campaign */}
        <section className="relative rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800">
          <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
            <div className="lg:col-span-6 p-7 md:p-10 flex flex-col justify-between z-10 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-900/95 text-white">
              <div className="space-y-4">
                <div className="text-xs font-semibold tracking-wide text-zinc-400">
                  Official Multi-Sport &amp; Games Pro Shop · Field · Court · Fitness · Tabletop &amp; Esports
                </div>
                <h1
                  className="font-bold tracking-tight text-white leading-[1.08]"
                  style={{ fontFamily: "'Outfit', sans-serif", fontSize: 'clamp(1.85rem, 3.4vw, 2.85rem)', textWrap: 'balance' }}
                >
                  Pro equipment for every sport, court, pitch, and game.
                </h1>
                <p className="text-sm md:text-base text-zinc-300 max-w-xl leading-relaxed">
                  Tournament-grade gear across cricket, football, basketball, badminton, tennis, pickleball, fitness, indoor board games, and esports—with custom team printing and verified authenticity.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-6">
                <button
                  onClick={() => {
                    setActiveDomain('All');
                    setActiveSport('All');
                    setActiveCategory('All');
                    document.getElementById('store-catalog-section')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-5 py-2.5 bg-[#d11a2a] hover:bg-[#b51523] text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap shrink-0"
                >
                  Explore All Gear
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsSizeGuideOpen(true)}
                  className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-xs font-semibold rounded-lg border border-zinc-700 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
                >
                  <Ruler className="w-3.5 h-3.5" />
                  Size &amp; Fit Guide
                </button>
                <button
                  onClick={() => {
                    setSerialResult(null);
                    setIsVerifyModalOpen(true);
                  }}
                  className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-xs font-semibold rounded-lg border border-zinc-700 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Verify Gear Serial
                </button>
              </div>
            </div>

            <div className="lg:col-span-6 relative min-h-[240px] lg:min-h-[340px] bg-zinc-900">
              <img
                src={STORE_HERO_IMAGE}
                alt="Multi-sport and tournament equipment showcase"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover lg:absolute lg:inset-0"
              />
              <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-zinc-950/80 via-zinc-950/20 to-transparent pointer-events-none" />
            </div>
          </div>
        </section>

        {/* Section 2 & 3: Store Filtering Sidebar + Catalog Grid */}
        <section id="store-catalog-section" className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Desktop Filtering Sidebar */}
          <aside className="hidden lg:block lg:col-span-3 bg-white border border-slate-200 rounded-xl p-4 space-y-5 sticky top-20">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-800">
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#d11a2a]" />
                <span>Filter Gear</span>
              </div>
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="text-xs font-semibold text-[#d11a2a] hover:underline"
                >
                  Reset ({activeFilterCount})
                </button>
              )}
            </div>

            {/* Sport Type Filter */}
            <div className="space-y-2 pb-4 border-b border-slate-100">
              <button
                type="button"
                onClick={() => setSidebarOpenSections((s) => ({ ...s, sport: !s.sport }))}
                className="w-full flex items-center justify-between text-xs font-bold text-slate-900"
              >
                <span>Sport Type</span>
                {sidebarOpenSections.sport ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
              </button>
              {sidebarOpenSections.sport && (
                <div className="space-y-1 pt-1">
                  <button
                    type="button"
                    onClick={() => setActiveSport('All')}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                      activeSport === 'All'
                        ? 'bg-slate-900 text-white font-semibold'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className="truncate">All Sports &amp; Games</span>
                    <span className={`font-mono text-[11px] tabular-nums ${activeSport === 'All' ? 'text-slate-300' : 'text-slate-400'}`}>
                      {productsMatchingFacetBase('sport').length}
                    </span>
                  </button>
                  {(showAllSidebarSports ? sidebarSportOptions : sidebarSportOptions.slice(0, 8)).map((sp) => {
                    const selected = activeSport === sp.name;
                    return (
                      <button
                        type="button"
                        key={sp.name}
                        onClick={() => setActiveSport(selected ? 'All' : sp.name)}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                          selected
                            ? 'bg-[#d11a2a] text-white font-semibold'
                            : sp.count === 0
                            ? 'text-slate-400 hover:bg-slate-50'
                            : 'text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <span className="truncate">{sp.name}</span>
                        <span className={`font-mono text-[11px] tabular-nums ${selected ? 'text-rose-100' : 'text-slate-400'}`}>
                          {sp.count}
                        </span>
                      </button>
                    );
                  })}
                  {sidebarSportOptions.length > 8 && (
                    <button
                      type="button"
                      onClick={() => setShowAllSidebarSports((v) => !v)}
                      className="text-[11px] font-semibold text-slate-600 hover:text-slate-900 px-2.5 pt-1"
                    >
                      {showAllSidebarSports ? 'Show fewer sports' : `+ ${sidebarSportOptions.length - 8} more sports`}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Product Category Filter */}
            <div className="space-y-2 pb-4 border-b border-slate-100">
              <button
                type="button"
                onClick={() => setSidebarOpenSections((s) => ({ ...s, category: !s.category }))}
                className="w-full flex items-center justify-between text-xs font-bold text-slate-900"
              >
                <span>Product Category</span>
                {sidebarOpenSections.category ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
              </button>
              {sidebarOpenSections.category && (
                <div className="space-y-1 pt-1">
                  <button
                    type="button"
                    onClick={() => setActiveCategory('All')}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                      activeCategory === 'All'
                        ? 'bg-slate-900 text-white font-semibold'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className="truncate">All Categories</span>
                    <span className={`font-mono text-[11px] tabular-nums ${activeCategory === 'All' ? 'text-slate-300' : 'text-slate-400'}`}>
                      {productsMatchingFacetBase('category').length}
                    </span>
                  </button>
                  {(showAllSidebarCategories ? sidebarCategoryOptions : sidebarCategoryOptions.slice(0, 8)).map((cat) => {
                    const selected = activeCategory === cat.name;
                    return (
                      <button
                        type="button"
                        key={cat.name}
                        onClick={() => setActiveCategory(selected ? 'All' : cat.name)}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                          selected
                            ? 'bg-[#d11a2a] text-white font-semibold'
                            : cat.count === 0
                            ? 'text-slate-400 hover:bg-slate-50'
                            : 'text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <span className="truncate">{cat.name}</span>
                        <span className={`font-mono text-[11px] tabular-nums ${selected ? 'text-rose-100' : 'text-slate-400'}`}>
                          {cat.count}
                        </span>
                      </button>
                    );
                  })}
                  {sidebarCategoryOptions.length > 8 && (
                    <button
                      type="button"
                      onClick={() => setShowAllSidebarCategories((v) => !v)}
                      className="text-[11px] font-semibold text-slate-600 hover:text-slate-900 px-2.5 pt-1"
                    >
                      {showAllSidebarCategories ? 'Show fewer categories' : `+ ${sidebarCategoryOptions.length - 8} more categories`}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Brand Filter */}
            {sidebarBrandOptions.length > 0 && (
              <div className="space-y-2 pb-4 border-b border-slate-100">
                <button
                  type="button"
                  onClick={() => setSidebarOpenSections((s) => ({ ...s, brand: !s.brand }))}
                  className="w-full flex items-center justify-between text-xs font-bold text-slate-900"
                >
                  <span>Brand</span>
                  {sidebarOpenSections.brand ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
                </button>
                {sidebarOpenSections.brand && (
                  <div className="space-y-1 pt-1 max-h-48 overflow-y-auto pr-1">
                    <button
                      type="button"
                      onClick={() => setActiveBrand('All')}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                        activeBrand === 'All'
                          ? 'bg-slate-900 text-white font-semibold'
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span>All Brands</span>
                      <span className={`font-mono text-[11px] tabular-nums ${activeBrand === 'All' ? 'text-slate-300' : 'text-slate-400'}`}>
                        {productsMatchingFacetBase('brand').length}
                      </span>
                    </button>
                    {sidebarBrandOptions.map((b) => {
                      const selected = activeBrand === b.name;
                      return (
                        <button
                          type="button"
                          key={b.name}
                          onClick={() => setActiveBrand(selected ? 'All' : b.name)}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                            selected
                              ? 'bg-[#d11a2a] text-white font-semibold'
                              : b.count === 0
                              ? 'text-slate-400 hover:bg-slate-50'
                              : 'text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <span className="truncate">{b.name}</span>
                          <span className={`font-mono text-[11px] tabular-nums ${selected ? 'text-rose-100' : 'text-slate-400'}`}>
                            {b.count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Customer Rating & Availability */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setSidebarOpenSections((s) => ({ ...s, rating: !s.rating }))}
                className="w-full flex items-center justify-between text-xs font-bold text-slate-900"
              >
                <span>Rating &amp; Availability</span>
                {sidebarOpenSections.rating ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
              </button>
              {sidebarOpenSections.rating && (
                <div className="space-y-2 pt-1">
                  <div className="space-y-1">
                    {[
                      { label: 'All Ratings', value: 0 },
                      { label: '4★ & Above', value: 4 },
                      { label: '3★ & Above', value: 3 },
                    ].map((opt) => (
                      <button
                        type="button"
                        key={opt.value}
                        onClick={() => setMinRatingFilter(opt.value)}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                          minRatingFilter === opt.value
                            ? 'bg-slate-900 text-white font-semibold'
                            : 'text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <span className="flex items-center gap-1.5">
                          {opt.value > 0 && <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />}
                          <span>{opt.label}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                  <label className="flex items-center justify-between px-2.5 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer">
                    <span>In Stock Only</span>
                    <input
                      type="checkbox"
                      checked={inStockOnly}
                      onChange={(e) => setInStockOnly(e.target.checked)}
                    />
                  </label>
                </div>
              )}
            </div>
          </aside>

          {/* Main Catalog Column */}
          <div className="lg:col-span-9 space-y-4">
            {/* Search, Mobile Filters Trigger & Sort Bar */}
            <div className="bg-white border border-slate-200 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search cricket bats, balls, safety gear, football, tennis, brands, SKU..."
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d11a2a]"
                />
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsMobileFiltersOpen(true)}
                  className="lg:hidden px-3 py-2 text-xs font-semibold border border-slate-200 rounded-lg bg-white text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 whitespace-nowrap"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-[#d11a2a]" />
                  <span>Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}</span>
                </button>

                <select
                  aria-label="Sort products"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-2 text-xs font-semibold border border-slate-200 rounded-lg bg-white text-slate-700"
                >
                  <option value="featured">Featured Gear</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="rating">Highest Rated</option>
                </select>
              </div>
            </div>

            {/* Active Filter Strip */}
            {(activeFilterCount > 0 || searchQuery.trim()) && (
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-slate-500 font-medium">Active filters:</span>
                {activeDomain !== 'All' && (
                  <button
                    type="button"
                    onClick={() => setActiveDomain('All')}
                    className="px-2.5 py-1 rounded-md bg-slate-900 text-white font-semibold flex items-center gap-1.5"
                  >
                    <span>Section: {activeDomain}</span>
                    <X className="w-3 h-3" />
                  </button>
                )}
                {activeSport !== 'All' && (
                  <button
                    type="button"
                    onClick={() => setActiveSport('All')}
                    className="px-2.5 py-1 rounded-md bg-[#d11a2a] text-white font-semibold flex items-center gap-1.5"
                  >
                    <span>Sport: {activeSport}</span>
                    <X className="w-3 h-3" />
                  </button>
                )}
                {activeCategory !== 'All' && (
                  <button
                    type="button"
                    onClick={() => setActiveCategory('All')}
                    className="px-2.5 py-1 rounded-md bg-[#d11a2a] text-white font-semibold flex items-center gap-1.5"
                  >
                    <span>Category: {activeCategory}</span>
                    <X className="w-3 h-3" />
                  </button>
                )}
                {activeBrand !== 'All' && (
                  <button
                    type="button"
                    onClick={() => setActiveBrand('All')}
                    className="px-2.5 py-1 rounded-md bg-slate-800 text-white font-semibold flex items-center gap-1.5"
                  >
                    <span>Brand: {activeBrand}</span>
                    <X className="w-3 h-3" />
                  </button>
                )}
                {minRatingFilter > 0 && (
                  <button
                    type="button"
                    onClick={() => setMinRatingFilter(0)}
                    className="px-2.5 py-1 rounded-md bg-slate-800 text-white font-semibold flex items-center gap-1.5"
                  >
                    <span>Rating: {minRatingFilter}★ &amp; Up</span>
                    <X className="w-3 h-3" />
                  </button>
                )}
                {inStockOnly && (
                  <button
                    type="button"
                    onClick={() => setInStockOnly(false)}
                    className="px-2.5 py-1 rounded-md bg-slate-800 text-white font-semibold flex items-center gap-1.5"
                  >
                    <span>In Stock Only</span>
                    <X className="w-3 h-3" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="text-xs font-semibold text-slate-600 hover:text-[#d11a2a] underline ml-1"
                >
                  Clear all
                </button>
              </div>
            )}

            {customBrands.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pt-0.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 shrink-0 mr-1">
                  Featured Brands:
                </span>
                {customBrands.map((b) => {
                  const isSelected = activeBrand === b.name;
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setActiveBrand(isSelected ? 'All' : b.name)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 ${
                        isSelected
                          ? 'bg-[#d11a2a] text-white border-[#d11a2a]'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {b.logo_url && (
                        <img
                          src={b.logo_url}
                          alt={b.name}
                          referrerPolicy="no-referrer"
                          className="w-4 h-4 rounded object-cover shrink-0"
                        />
                      )}
                      <span>{b.name}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Catalog Header */}
            <div className="flex items-center justify-between pt-1">
              <h2 className="text-lg md:text-xl font-bold text-slate-900" style={{ fontFamily: "'Outfit', sans-serif" }}>
                {activeSport !== 'All' && activeCategory !== 'All'
                  ? `${activeSport} · ${activeCategory}`
                  : activeCategory !== 'All'
                  ? activeCategory
                  : activeSport !== 'All'
                  ? `${activeSport} Equipment`
                  : activeDomain === 'All'
                  ? 'Pro Equipment Catalog'
                  : `${activeDomain} Collection`}
              </h2>
              <span className="text-xs font-medium text-slate-500 tabular-nums">
                {filteredProducts.length} {filteredProducts.length === 1 ? 'item' : 'items'}
              </span>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="bg-white border border-slate-200 rounded-xl p-4 animate-pulse space-y-4">
                    <div className="aspect-[4/3] bg-slate-100 rounded-lg" />
                    <div className="h-3 bg-slate-100 rounded w-1/3" />
                    <div className="h-5 bg-slate-100 rounded w-3/4" />
                    <div className="h-8 bg-slate-100 rounded" />
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl p-12 text-center space-y-3">
                <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-base font-bold text-slate-800">
                  {canAccessStoreAdmin ? 'No Store Gear Listed Yet' : 'Store Catalog Restocking Soon'}
                </p>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  {canAccessStoreAdmin
                    ? 'Add gear across cricket, football, tennis, basketball, racket sports, fitness, indoor board games, and esports—plus custom brands—from Store Admin.'
                    : 'Equipment across cricket, football, tennis, team sports, racket sports, fitness, indoor board games, and esports will appear here as soon as stock is published.'}
                </p>
                {canAccessStoreAdmin && setFullScreenView && (
                  <button
                    onClick={() => setFullScreenView('Store Admin')}
                    className="px-4 py-2 text-xs font-semibold bg-[#d11a2a] text-white rounded-lg hover:bg-[#b51523]"
                  >
                    Add First Gear in Store Admin
                  </button>
                )}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl p-12 text-center space-y-3">
                <p className="text-sm font-semibold text-slate-700">No gear matches your active filters.</p>
                <button
                  onClick={resetAllFilters}
                  className="px-4 py-2 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {filteredProducts.map((product) => {
                  const isWish = wishlist.includes(product.id);
                  const isCompared = compareIds.includes(product.id);
                  const primarySpec = Object.entries(product.specs || {})[0];
                  const { rating, count } = getProductRating(product);
                  const discountPct =
                    product.mrp_usd > product.price_usd
                      ? Math.round(((product.mrp_usd - product.price_usd) / product.mrp_usd) * 100)
                      : 0;

                  return (
                    <article
                      key={product.id}
                      className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md group"
                    >
                      <div>
                        <div
                          onClick={() => openProductDetail(product)}
                          className="relative aspect-[4/3] bg-zinc-100 overflow-hidden cursor-pointer"
                        >
                          <img
                            src={product.image_url}
                            alt={product.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).style.display = 'none';
                            }}
                          />
                          <div className="absolute top-3 right-3 flex items-center gap-1.5">
                            <button
                              type="button"
                              aria-label="Bookmark to wishlist"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleWishlist(product);
                              }}
                              className="w-8 h-8 rounded-lg bg-white/90 backdrop-blur-sm border border-slate-200 flex items-center justify-center text-slate-600 hover:text-[#d11a2a] transition-colors"
                            >
                              <Heart className={`w-4 h-4 ${isWish ? 'fill-[#d11a2a] text-[#d11a2a]' : ''}`} />
                            </button>
                            <button
                              type="button"
                              aria-label={isCompared ? 'Remove from comparison' : 'Compare product'}
                              title={isCompared ? 'Remove from comparison' : 'Add to side-by-side comparison'}
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleCompare(product.id);
                              }}
                              className={`px-2.5 h-8 rounded-lg backdrop-blur-sm border flex items-center gap-1 text-[11px] font-semibold transition-colors ${
                                isCompared
                                  ? 'bg-slate-900 border-slate-900 text-white'
                                  : 'bg-white/95 border-slate-200 text-slate-700 hover:text-slate-900'
                              }`}
                            >
                              <Scale className="w-3.5 h-3.5" />
                              <span>{isCompared ? 'Added' : 'Compare'}</span>
                            </button>
                          </div>
                        </div>

                        <div className="p-5 space-y-2.5">
                          <div className="flex items-center justify-between text-xs text-slate-500">
                            <span className="font-semibold uppercase tracking-wide text-slate-600 truncate pr-2">
                              {product.brand} · {product.category}
                              {product.featured || (product.units_ordered || 0) >= 3 ? ' · Popular' : ''}
                            </span>
                            <span className={`shrink-0 ${product.stock === 0 ? 'text-rose-600 font-semibold' : 'text-emerald-700 font-medium'}`}>
                              {product.stock === 0 ? 'Out of stock' : product.stock <= 5 ? `Only ${product.stock} left` : 'In Stock'}
                            </span>
                          </div>

                          <h3
                            onClick={() => openProductDetail(product)}
                            className="text-base font-semibold text-slate-900 leading-snug cursor-pointer hover:text-[#d11a2a] transition-colors line-clamp-2"
                          >
                            {product.name}
                          </h3>

                          <div className="text-xs text-slate-500 truncate">
                            {normalizeSportLabel(product.sport_type)}
                            {primarySpec ? ` · ${primarySpec[0]}: ${primarySpec[1]}` : ''}
                            {product.knocking_available ? ' · Knocking Option' : ''}
                            {product.custom_print_available ? ' · Custom Print' : ''}
                          </div>
                        </div>
                      </div>

                      <div className="px-5 pb-5 pt-3 border-t border-slate-100 space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-baseline gap-2 font-mono tabular-nums">
                            <span className="text-base font-bold text-slate-900">
                              {formatStorePrice(product.price_usd, product.price_inr, currency)}
                            </span>
                            {discountPct > 0 && (
                              <span className="text-xs text-slate-400 line-through">
                                {formatStorePrice(product.mrp_usd, product.mrp_inr, currency)}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-slate-500 tabular-nums shrink-0">
                            <Star className={`w-3.5 h-3.5 ${count > 0 ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
                            {count > 0 ? (
                              <>
                                <span className="font-semibold text-slate-700">{rating.toFixed(1)}</span>
                                <span>({count})</span>
                              </>
                            ) : (
                              <span>No reviews</span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openProductDetail(product)}
                            className="px-3 py-2 text-xs font-semibold border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
                          >
                            Specs
                          </button>
                          {product.stock === 0 ? (() => {
                            const waitingReq = getActiveRestockAlert(product.id);
                            return (
                              <button
                                type="button"
                                onClick={() =>
                                  waitingReq ? openProductDetail(product) : handleOpenNotifyModal(product)
                                }
                                className={`flex-1 px-3 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap ${
                                  waitingReq
                                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                                    : 'bg-slate-900 hover:bg-slate-800 text-white'
                                }`}
                              >
                                <BellRing className="w-3.5 h-3.5" />
                                {waitingReq ? 'Notifying' : 'Notify Me'}
                              </button>
                            );
                          })() : (
                            <>
                              <button
                                type="button"
                                onClick={() => handleAddToCart(product, { openDrawer: false })}
                                className="flex-1 px-3 py-2 text-xs font-semibold rounded-lg bg-[#d11a2a] hover:bg-[#b51523] text-white transition-colors whitespace-nowrap"
                              >
                                Add to Bag
                              </button>
                              <button
                                type="button"
                                onClick={() => openQuickBuyModal(product)}
                                title="1-Click Quick Buy Checkout"
                                className="px-3 py-2 text-xs font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 text-white transition-colors flex items-center justify-center gap-1 whitespace-nowrap shrink-0"
                              >
                                <Zap className="w-3.5 h-3.5 text-amber-400" />
                                Quick Buy
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* WISHLIST SLIDE-OVER DRAWER */}
      {isWishlistOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[120] flex justify-end">
          <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookmarkCheck className="w-5 h-5 text-[#d11a2a]" />
                <h2 className="text-base font-bold text-slate-900">
                  Saved Gear &amp; Wishlist ({wishlistProducts.length})
                </h2>
              </div>
              <button onClick={() => setIsWishlistOpen(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            {wishlistProducts.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3">
                <Heart className="w-10 h-10 text-slate-300" />
                <div className="text-sm font-semibold text-slate-800">Your wishlist is empty</div>
                <p className="text-xs text-slate-500 max-w-xs">
                  Bookmark English Willow bats, protective kits, and court accessories to compare or buy later.
                </p>
                <button
                  onClick={() => setIsWishlistOpen(false)}
                  className="px-4 py-2 text-xs font-semibold bg-slate-900 text-white rounded-lg"
                >
                  Explore Store
                </button>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {wishlistProducts.map((item) => (
                    <div key={item.id} className="flex gap-3.5 pb-4 border-b border-slate-100">
                      <img
                        src={item.image_url}
                        alt={item.name}
                        referrerPolicy="no-referrer"
                        onClick={() => {
                          setIsWishlistOpen(false);
                          openProductDetail(item);
                        }}
                        className="w-20 h-16 rounded-lg object-cover bg-slate-100 border border-slate-200 shrink-0 cursor-pointer"
                      />
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <h4
                            onClick={() => {
                              setIsWishlistOpen(false);
                              openProductDetail(item);
                            }}
                            className="text-xs font-semibold text-slate-900 line-clamp-2 cursor-pointer hover:text-[#d11a2a]"
                          >
                            {item.name}
                          </h4>
                          <button
                            onClick={() => toggleWishlist(item)}
                            className="text-slate-400 hover:text-rose-600 shrink-0"
                            title="Remove from wishlist"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {item.brand} · {item.category} · {item.stock > 0 ? `${item.stock} in stock` : 'Out of stock'}
                        </div>
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-xs font-bold font-mono text-slate-900 tabular-nums">
                            {formatStorePrice(item.price_usd, item.price_inr, currency)}
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setIsWishlistOpen(false);
                                openProductDetail(item);
                              }}
                              className="px-2.5 py-1 text-[11px] font-semibold border border-slate-200 rounded-md text-slate-700 hover:bg-slate-50"
                            >
                              Specs
                            </button>
                            {item.stock === 0 ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setIsWishlistOpen(false);
                                  handleOpenNotifyModal(item);
                                }}
                                className="px-2.5 py-1 text-[11px] font-semibold rounded-md bg-slate-900 hover:bg-slate-800 text-white flex items-center gap-1"
                              >
                                <BellRing className="w-3 h-3" />
                                Notify Me
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleMoveWishlistItemToBag(item)}
                                className="px-2.5 py-1 text-[11px] font-semibold rounded-md bg-[#d11a2a] hover:bg-[#b51523] text-white"
                              >
                                Move to Bag
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-6 border-t border-slate-200 bg-slate-50 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={async () => {
                      await StoreService.clearWishlist(user?.uid, wishlist);
                      setWishlist([]);
                      showToast('Wishlist cleared.');
                    }}
                    className="px-4 py-2.5 text-xs font-semibold border border-slate-200 bg-white text-slate-700 rounded-lg hover:bg-slate-100 whitespace-nowrap"
                  >
                    Clear All
                  </button>
                  <button
                    type="button"
                    onClick={handleMoveAllWishlistToBag}
                    className="flex-1 py-2.5 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg whitespace-nowrap"
                  >
                    Move All In-Stock to Bag
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* PRODUCT DETAIL MODAL (Contiguous Purchase Module) */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[100] flex items-center justify-center p-3 md:p-6">
          <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-3 bg-white shrink-0">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">
                {selectedProduct.brand} · {selectedProduct.domain} · {selectedProduct.category} · SKU {selectedProduct.sku}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsShareOpen((prev) => !prev)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                    isShareOpen
                      ? 'bg-slate-900 border-slate-900 text-white'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Share2 className="w-3.5 h-3.5" />
                  Share
                </button>
                <button
                  type="button"
                  onClick={closeProductDetail}
                  aria-label="Close product details"
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-6 space-y-6">
                  <div className="aspect-[4/3] rounded-xl overflow-hidden bg-zinc-100 border border-slate-200">
                    <img
                      src={selectedProduct.image_url}
                      alt={selectedProduct.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-700">
                      Technical Specifications
                    </div>
                    <div className="divide-y divide-slate-100 text-sm">
                      {Object.entries(selectedProduct.specs || {}).map(([k, v]) => (
                        <div key={k} className="px-4 py-2.5 flex items-center justify-between gap-4">
                          <span className="text-slate-500 text-xs font-medium">{k}</span>
                          <span className="text-slate-900 font-semibold text-xs text-right font-mono">{v}</span>
                        </div>
                      ))}
                      <div className="px-4 py-2.5 flex items-center justify-between gap-4">
                        <span className="text-slate-500 text-xs font-medium">Authenticity Tag</span>
                        <span className="text-emerald-700 font-semibold text-xs font-mono">
                          {selectedProduct.authenticity_prefix || 'SL-GEAR'} Hologram Verified
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-6 space-y-5">
                  <div>
                    {(() => {
                      const matchedBrand = customBrandMap[selectedProduct.brand.toLowerCase()];
                      if (!matchedBrand) return null;
                      return (
                        <div className="flex items-center gap-2 mb-2 text-xs text-slate-600">
                          {matchedBrand.logo_url && (
                            <img
                              src={matchedBrand.logo_url}
                              alt={matchedBrand.name}
                              referrerPolicy="no-referrer"
                              className="w-5 h-5 rounded object-cover border border-slate-200 shrink-0"
                            />
                          )}
                          <span className="font-semibold text-slate-800">{matchedBrand.name}</span>
                          {matchedBrand.origin && <span>· {matchedBrand.origin}</span>}
                        </div>
                      );
                    })()}
                    <h2
                      className="text-2xl font-bold text-slate-900 leading-tight"
                      style={{ fontFamily: "'Outfit', sans-serif" }}
                    >
                      {selectedProduct.name}
                    </h2>
                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-600 tabular-nums">
                      <span className="flex items-center gap-1 font-semibold text-slate-900">
                        <Star className={`w-4 h-4 ${pdpReviews.length > 0 ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
                        {pdpReviews.length > 0
                          ? (pdpReviews.reduce((s, r) => s + r.rating, 0) / pdpReviews.length).toFixed(1)
                          : '0.0'}
                      </span>
                      <span>{pdpReviews.length} {pdpReviews.length === 1 ? 'review' : 'reviews'}</span>
                      <span>·</span>
                      <span className={selectedProduct.stock > 0 ? 'text-emerald-700 font-semibold' : 'text-rose-600 font-semibold'}>
                        {selectedProduct.stock > 0 ? `${selectedProduct.stock} units ready to ship` : 'Out of Stock'}
                      </span>
                    </div>
                  </div>

                  <div className="py-3 border-y border-slate-100 flex items-baseline gap-3 font-mono tabular-nums">
                    <span className="text-3xl font-bold text-slate-900">
                      {formatStorePrice(selectedProduct.price_usd, selectedProduct.price_inr, currency)}
                    </span>
                    {selectedProduct.mrp_usd > selectedProduct.price_usd && (
                      <>
                        <span className="text-sm text-slate-400 line-through">
                          {formatStorePrice(selectedProduct.mrp_usd, selectedProduct.mrp_inr, currency)}
                        </span>
                        <span className="text-xs font-semibold text-emerald-700 font-sans">
                          Save {Math.round(((selectedProduct.mrp_usd - selectedProduct.price_usd) / selectedProduct.mrp_usd) * 100)}%
                        </span>
                      </>
                    )}
                  </div>

                  <p className="text-sm text-slate-600 leading-relaxed">{selectedProduct.description}</p>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-700">Select Size / Edition</label>
                      <button
                        type="button"
                        onClick={() => setIsSizeGuideOpen(true)}
                        className="text-xs font-semibold text-[#d11a2a] hover:underline flex items-center gap-1"
                      >
                        <Ruler className="w-3.5 h-3.5" />
                        Size Guide
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(selectedProduct.sizes || ['Standard']).map((sz) => (
                        <button
                          type="button"
                          key={sz}
                          onClick={() => setPdpSize(sz)}
                          className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-colors ${
                            pdpSize === sz
                              ? 'bg-slate-900 text-white border-slate-900'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {sz}
                        </button>
                      ))}
                    </div>
                  </div>

                  {selectedProduct.handedness_options && selectedProduct.handedness_options.length > 0 && (
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-700 block">Batting / Playing Hand</label>
                      <div className="flex gap-2">
                        {selectedProduct.handedness_options.map((h) => (
                          <button
                            type="button"
                            key={h}
                            onClick={() => setPdpHand(h)}
                            className={`px-3.5 py-2 text-xs font-semibold rounded-lg border transition-colors ${
                              pdpHand === h
                                ? 'bg-slate-900 text-white border-slate-900'
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            {h}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedProduct.knocking_available && (
                    <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={pdpKnocking}
                        onChange={(e) => setPdpKnocking(e.target.checked)}
                        className="mt-0.5"
                      />
                      <div className="text-xs">
                        <div className="font-semibold text-slate-900">
                          Add Pro Machine Knocking, Oiling &amp; Scuff Sheet (+
                          {formatStorePrice(
                            selectedProduct.knocking_fee_usd || 15,
                            selectedProduct.knocking_fee_inr || 999,
                            currency
                          )}
                          )
                        </div>
                        <div className="text-slate-500 mt-0.5">
                          10,000-ball automated mallet knocking, raw linseed oiling, fiber edge tape, and toe guard fitted before dispatch.
                        </div>
                      </div>
                    </label>
                  )}

                  {selectedProduct.custom_print_available && (
                    <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2.5">
                      <div className="text-xs font-semibold text-slate-900">
                        Custom Sublimated Player Name &amp; Number (Included Free)
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <input
                          type="text"
                          value={pdpJerseyName}
                          onChange={(e) => setPdpJerseyName(e.target.value.toUpperCase())}
                          placeholder="BACK NAME"
                          maxLength={16}
                          className="col-span-2 px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white font-mono"
                        />
                        <input
                          type="text"
                          value={pdpJerseyNumber}
                          onChange={(e) => setPdpJerseyNumber(e.target.value.replace(/\D/g, '').slice(0, 3))}
                          placeholder="NO."
                          className="px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white font-mono"
                        />
                      </div>
                    </div>
                  )}

                  {/* Qty + Primary CTAs + Wishlist Bookmark + Compare + Share */}
                  <div className="flex flex-wrap items-center gap-2.5 pt-2">
                    {selectedProduct.stock > 0 && (
                      <div className="flex items-center border border-slate-200 rounded-lg bg-white">
                        <button
                          type="button"
                          onClick={() => setPdpQty((q) => Math.max(1, q - 1))}
                          className="p-2.5 text-slate-600 hover:text-slate-900"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="px-3 text-sm font-semibold font-mono tabular-nums">{pdpQty}</span>
                        <button
                          type="button"
                          onClick={() => setPdpQty((q) => Math.min(selectedProduct.stock || 1, q + 1))}
                          className="p-2.5 text-slate-600 hover:text-slate-900"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    {selectedProduct.stock > 0 ? (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            handleAddToCart(selectedProduct, {
                              size: pdpSize,
                              hand: pdpHand,
                              knocking: pdpKnocking,
                              jerseyName: pdpJerseyName,
                              jerseyNumber: pdpJerseyNumber,
                              qty: pdpQty,
                              openDrawer: true,
                            })
                          }
                          className="flex-1 py-3 px-4 bg-[#d11a2a] hover:bg-[#b51523] text-white text-sm font-semibold rounded-lg transition-colors whitespace-nowrap"
                        >
                          Add to Bag
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            openQuickBuyModal(selectedProduct, {
                              qty: pdpQty,
                              size: pdpSize,
                              hand: pdpHand,
                              knocking: pdpKnocking,
                            })
                          }
                          className="py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap"
                        >
                          <Zap className="w-4 h-4 text-amber-400" />
                          Quick Buy
                        </button>
                      </>
                    ) : (
                      <div className="flex-1 py-3 px-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center justify-center gap-2 whitespace-nowrap">
                        <Clock className="w-4 h-4" />
                        Currently Out of Stock
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => toggleWishlist(selectedProduct)}
                      className={`py-3 px-3.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                        wishlist.includes(selectedProduct.id)
                          ? 'bg-rose-50 border-rose-200 text-[#d11a2a]'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${wishlist.includes(selectedProduct.id) ? 'fill-[#d11a2a] text-[#d11a2a]' : ''}`} />
                      {wishlist.includes(selectedProduct.id) ? 'Saved' : 'Wishlist'}
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleCompare(selectedProduct.id)}
                      className={`py-3 px-3.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                        compareIds.includes(selectedProduct.id)
                          ? 'bg-slate-900 border-slate-900 text-white'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <Scale className="w-4 h-4" />
                      {compareIds.includes(selectedProduct.id) ? 'In Compare' : 'Compare'}
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsShareOpen((prev) => !prev)}
                      className={`py-3 px-3.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                        isShareOpen
                          ? 'bg-slate-900 border-slate-900 text-white'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <Share2 className="w-4 h-4" />
                      Share
                    </button>
                  </div>

                  {/* Share Panel with Deep Link, Native Share & Community Intents */}
                  {isShareOpen && (() => {
                    const shareUrl = getProductShareUrl(selectedProduct);
                    const priceText = formatStorePrice(selectedProduct.price_usd, selectedProduct.price_inr, currency);
                    const shareText = `Check out ${selectedProduct.name} (${selectedProduct.brand} · ${priceText}) on Streamlify Store:`;
                    const encodedUrl = encodeURIComponent(shareUrl);
                    const encodedText = encodeURIComponent(shareText);
                    const encodedFull = encodeURIComponent(`${shareText} ${shareUrl}`);
                    const hasNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

                    return (
                      <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                              <Share2 className="w-3.5 h-3.5 text-[#d11a2a]" />
                              Share Gear with Teammates &amp; Community
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              Deep link opens this exact item in Storefront
                            </div>
                          </div>
                          {hasNativeShare && (
                            <button
                              type="button"
                              onClick={() => handleNativeShareProduct(selectedProduct)}
                              className="px-3 py-1.5 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg flex items-center gap-1.5 whitespace-nowrap"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              Device Share
                            </button>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            readOnly
                            value={shareUrl}
                            aria-label="Shareable product deep link"
                            onFocus={(e) => e.currentTarget.select()}
                            className="flex-1 px-3 py-2 text-xs font-mono bg-white border border-slate-200 rounded-lg text-slate-700"
                          />
                          <button
                            type="button"
                            onClick={() => handleCopyProductLink(selectedProduct)}
                            className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-[#d11a2a] hover:bg-[#b51523] text-white flex items-center gap-1.5 whitespace-nowrap"
                          >
                            {shareCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            {shareCopied ? 'Copied!' : 'Copy Link'}
                          </button>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 pt-0.5">
                          <a
                            href={`https://wa.me/?text=${encodedFull}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition-colors"
                          >
                            WhatsApp
                          </a>
                          <a
                            href={`https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-800 hover:bg-slate-100 transition-colors"
                          >
                            X (Twitter)
                          </a>
                          <a
                            href={`https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-sky-200 bg-sky-50 text-sky-800 hover:bg-sky-100 transition-colors"
                          >
                            Telegram
                          </a>
                          <a
                            href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100 transition-colors"
                          >
                            Facebook
                          </a>
                          <a
                            href={`mailto:?subject=${encodeURIComponent(`${selectedProduct.name} — ${selectedProduct.brand}`)}&body=${encodedFull}`}
                            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 transition-colors flex items-center gap-1"
                          >
                            <Mail className="w-3.5 h-3.5" />
                            Email
                          </a>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Out-of-Stock Back-in-Stock Email Notification Box */}
                  {selectedProduct.stock === 0 && (() => {
                    const activeSub = getActiveRestockAlert(selectedProduct.id);
                    return activeSub ? (
                      <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/70 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
                            <BellRing className="w-4 h-4 text-emerald-700" />
                            <span>Back-in-Stock Alert Active</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCancelRestockAlert(activeSub)}
                            className="text-[11px] font-semibold text-rose-600 hover:underline"
                          >
                            Remove Alert
                          </button>
                        </div>
                        <p className="text-xs text-emerald-800 leading-relaxed">
                          We will email <strong className="font-mono">{activeSub.email}</strong> as soon as{' '}
                          <strong>{selectedProduct.name}</strong> is restocked by our store team.
                        </p>
                      </div>
                    ) : (
                      <form
                        onSubmit={(e) => handleSubmitRestockAlert(e, selectedProduct)}
                        className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3"
                      >
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                          <BellRing className="w-4 h-4 text-[#d11a2a]" />
                          <span>Notify Me When Back in Stock</span>
                        </div>
                        <p className="text-xs text-slate-600">
                          Enter your email to get an instant restock notification as soon as more units arrive.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input
                            type="email"
                            required
                            value={notifyEmailInput}
                            onChange={(e) => setNotifyEmailInput(e.target.value)}
                            placeholder="teammate@example.com"
                            className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                          />
                          <button
                            type="submit"
                            disabled={submittingNotify}
                            className="px-4 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white rounded-lg whitespace-nowrap"
                          >
                            {submittingNotify ? 'Subscribing...' : 'Notify Me'}
                          </button>
                        </div>
                      </form>
                    );
                  })()}

                  {selectedProduct.highlights && selectedProduct.highlights.length > 0 && (
                    <ul className="space-y-1.5 pt-2 text-xs text-slate-600">
                      {selectedProduct.highlights.map((hl, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{hl}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* Verified Customer Reviews & Ratings Section */}
              {(() => {
                const avgScore =
                  pdpReviews.length > 0
                    ? pdpReviews.reduce((s, r) => s + r.rating, 0) / pdpReviews.length
                    : 0;
                const filteredSortedReviews = pdpReviews
                  .filter((r) => reviewStarFilter === 'all' || r.rating === reviewStarFilter)
                  .sort((a, b) => {
                    if (reviewSortBy === 'highest') return b.rating - a.rating;
                    if (reviewSortBy === 'lowest') return a.rating - b.rating;
                    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                  });
                const ratingLabel = (stars: number) => {
                  if (stars >= 5) return 'Pro Match Quality';
                  if (stars === 4) return 'Very Good';
                  if (stars === 3) return 'Good';
                  if (stars === 2) return 'Fair';
                  return 'Needs Improvement';
                };

                return (
                  <div id="pdp-reviews-section" className="pt-6 border-t border-slate-200 grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-7 space-y-5">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <h3 className="text-base font-bold text-slate-900">
                          Verified Customer Reviews ({pdpReviews.length})
                        </h3>
                        {pdpReviews.length > 0 && (
                          <select
                            aria-label="Sort reviews"
                            value={reviewSortBy}
                            onChange={(e) => setReviewSortBy(e.target.value as any)}
                            className="px-2.5 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg bg-white text-slate-700"
                          >
                            <option value="newest">Newest First</option>
                            <option value="highest">Highest Rated</option>
                            <option value="lowest">Lowest Rated</option>
                          </select>
                        )}
                      </div>

                      {/* Star Rating Breakdown Summary */}
                      <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                        <div className="sm:col-span-4 text-center sm:border-r sm:border-slate-200 sm:pr-4">
                          <div className="text-3xl font-bold font-mono text-slate-900 tabular-nums">
                            {pdpReviews.length > 0 ? avgScore.toFixed(1) : '—'}
                          </div>
                          <div className="flex items-center justify-center gap-0.5 my-1">
                            {[1, 2, 3, 4, 5].map((st) => (
                              <Star
                                key={st}
                                className={`w-3.5 h-3.5 ${
                                  st <= Math.round(avgScore) ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                                }`}
                              />
                            ))}
                          </div>
                          <div className="text-[11px] text-slate-500 tabular-nums">
                            {pdpReviews.length} {pdpReviews.length === 1 ? 'verified review' : 'verified reviews'}
                          </div>
                        </div>

                        <div className="sm:col-span-8 space-y-1.5">
                          {[5, 4, 3, 2, 1].map((starLevel) => {
                            const count = pdpReviews.filter((r) => r.rating === starLevel).length;
                            const pct = pdpReviews.length > 0 ? Math.round((count / pdpReviews.length) * 100) : 0;
                            const isFiltered = reviewStarFilter === starLevel;
                            return (
                              <button
                                key={starLevel}
                                type="button"
                                onClick={() => setReviewStarFilter(isFiltered ? 'all' : starLevel)}
                                className={`w-full flex items-center gap-2 text-xs rounded px-1.5 py-0.5 transition-colors ${
                                  isFiltered ? 'bg-slate-200 font-semibold text-slate-900' : 'hover:bg-slate-100 text-slate-600'
                                }`}
                              >
                                <span className="w-8 text-left font-mono tabular-nums">{starLevel}★</span>
                                <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-amber-400 rounded-full"
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                                <span className="w-10 text-right font-mono text-[11px] text-slate-500 tabular-nums">
                                  {count}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {reviewStarFilter !== 'all' && (
                        <div className="flex items-center justify-between text-xs bg-slate-100 px-3 py-2 rounded-lg">
                          <span className="font-semibold text-slate-700">
                            Showing {reviewStarFilter}-star reviews ({filteredSortedReviews.length})
                          </span>
                          <button
                            type="button"
                            onClick={() => setReviewStarFilter('all')}
                            className="font-semibold text-[#d11a2a] hover:underline"
                          >
                            Show all stars
                          </button>
                        </div>
                      )}

                      {filteredSortedReviews.length === 0 ? (
                        <p className="text-xs text-slate-500 py-2">
                          {pdpReviews.length === 0
                            ? 'No verified reviews submitted yet for this product.'
                            : 'No reviews match the selected star filter.'}
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {filteredSortedReviews.map((rev) => {
                            const isOwnReview = Boolean(user?.uid && rev.user_id === user.uid);
                            return (
                              <div key={rev.id} className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                                <div className="flex items-center justify-between gap-2 text-xs">
                                  <div className="flex flex-wrap items-center gap-1.5 text-slate-900">
                                    <span className="font-semibold">{rev.user_name}</span>
                                    {rev.verified_purchase && (
                                      <span className="text-emerald-700 font-semibold flex items-center gap-1">
                                        · <ShieldCheck className="w-3.5 h-3.5 inline" /> Verified Purchaser
                                        {rev.verified_order_number ? ` (${rev.verified_order_number})` : ''}
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-slate-400 shrink-0 tabular-nums">
                                    {new Date(rev.created_at).toLocaleDateString()}
                                    {rev.updated_at ? ' · Edited' : ''}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  {Array.from({ length: 5 }).map((_, idx) => (
                                    <Star
                                      key={idx}
                                      className={`w-3.5 h-3.5 ${
                                        idx < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                                      }`}
                                    />
                                  ))}
                                  <span className="text-xs font-semibold text-slate-900 ml-1.5">{rev.title}</span>
                                </div>
                                <p className="text-xs text-slate-600 leading-relaxed">{rev.comment}</p>
                                {(isOwnReview || canAccessStoreAdmin) && (
                                  <div className="flex items-center gap-3 pt-1 text-[11px] font-semibold">
                                    {isOwnReview && (
                                      <button
                                        type="button"
                                        onClick={() => handleStartEditReview(rev)}
                                        className="text-slate-600 hover:text-slate-900 flex items-center gap-1"
                                      >
                                        <Edit className="w-3 h-3" />
                                        Edit
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteReview(rev.id)}
                                      className="text-rose-600 hover:text-rose-700 flex items-center gap-1"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                      Delete
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Right Column: Verified Purchaser Review Submission / Eligibility Gate */}
                    <div className="lg:col-span-5 h-fit">
                      {!user || user.uid === 'guest' ? (
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
                          <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                            <Lock className="w-4 h-4 text-[#d11a2a]" />
                            <span>Verified Purchases Only</span>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed">
                            Only verified purchasers can leave star ratings and reviews for this item. Sign in to your account to verify your past orders.
                          </p>
                        </div>
                      ) : !verifiedPurchaseOrder && !editingReviewId ? (
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
                          <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                            <ShieldCheck className="w-4 h-4 text-[#d11a2a]" />
                            <span>Verified Purchaser Required</span>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed">
                            Reviews on this gear are restricted to players and customers with a confirmed, non-cancelled order for <strong>{selectedProduct.name}</strong>.
                          </p>
                          <div className="flex flex-wrap gap-2 pt-1">
                            {selectedProduct.stock > 0 && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleAddToCart(selectedProduct, {
                                    size: pdpSize,
                                    hand: pdpHand,
                                    knocking: pdpKnocking,
                                    jerseyName: pdpJerseyName,
                                    jerseyNumber: pdpJerseyNumber,
                                    qty: 1,
                                    openDrawer: true,
                                  })
                                }
                                className="px-3.5 py-2 text-xs font-semibold bg-[#d11a2a] hover:bg-[#b51523] text-white rounded-lg"
                              >
                                Order Item to Review
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedProduct(null);
                                setOrdersTab('history');
                                setIsOrdersOpen(true);
                              }}
                              className="px-3.5 py-2 text-xs font-semibold border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 rounded-lg"
                            >
                              Check Order History
                            </button>
                          </div>
                        </div>
                      ) : existingUserReview && !editingReviewId ? (
                        <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-5 space-y-3">
                          <div className="flex items-center gap-2 text-sm font-bold text-emerald-900">
                            <ShieldCheck className="w-4 h-4 text-emerald-700" />
                            <span>Your Verified Review Is Live</span>
                          </div>
                          <p className="text-xs text-emerald-800 leading-relaxed">
                            Purchased under <span className="font-mono font-semibold">{verifiedPurchaseOrder?.order_number}</span>. You rated this item{' '}
                            <strong className="font-mono">{existingUserReview.rating}/5</strong>.
                          </p>
                          <div className="flex items-center gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => handleStartEditReview(existingUserReview)}
                              className="px-3.5 py-2 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800 flex items-center gap-1.5"
                            >
                              <Edit className="w-3.5 h-3.5" />
                              Edit My Review
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteReview(existingUserReview.id)}
                              className="px-3.5 py-2 text-xs font-semibold border border-rose-200 bg-white text-rose-600 rounded-lg hover:bg-rose-50"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ) : (
                        <form onSubmit={handleSubmitReview} className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
                          <div className="flex items-center justify-between gap-2">
                            <div className="text-sm font-bold text-slate-900">
                              {editingReviewId ? 'Update Your Verified Review' : 'Rate & Review Your Purchase'}
                            </div>
                            {editingReviewId && (
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingReviewId(null);
                                  setNewReviewTitle('');
                                  setNewReviewComment('');
                                  setNewReviewRating(5);
                                }}
                                className="text-xs font-semibold text-slate-500 hover:text-slate-900"
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                          {verifiedPurchaseOrder && (
                            <div className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1.5">
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>Verified Purchaser · Order {verifiedPurchaseOrder.order_number}</span>
                            </div>
                          )}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1" onMouseLeave={() => setHoverReviewStar(0)}>
                              {[1, 2, 3, 4, 5].map((star) => {
                                const activeStar = hoverReviewStar > 0 ? star <= hoverReviewStar : star <= newReviewRating;
                                return (
                                  <button
                                    type="button"
                                    key={star}
                                    onMouseEnter={() => setHoverReviewStar(star)}
                                    onClick={() => setNewReviewRating(star)}
                                    className="p-1"
                                    aria-label={`Rate ${star} stars`}
                                  >
                                    <Star
                                      className={`w-5 h-5 transition-colors ${
                                        activeStar ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                                      }`}
                                    />
                                  </button>
                                );
                              })}
                            </div>
                            <span className="text-xs font-semibold text-slate-700">
                              {ratingLabel(hoverReviewStar || newReviewRating)}
                            </span>
                          </div>
                          <input
                            type="text"
                            value={newReviewTitle}
                            onChange={(e) => setNewReviewTitle(e.target.value)}
                            maxLength={140}
                            placeholder="Headline (e.g. Incredible ping & balance)"
                            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                          />
                          <textarea
                            rows={3}
                            required
                            maxLength={1000}
                            value={newReviewComment}
                            onChange={(e) => setNewReviewComment(e.target.value)}
                            placeholder="Share how this gear performed in match conditions..."
                            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                          />
                          <button
                            type="submit"
                            disabled={submittingReview}
                            className="w-full py-2.5 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:bg-slate-400"
                          >
                            {submittingReview
                              ? 'Saving Review...'
                              : editingReviewId
                              ? 'Save Updated Review'
                              : 'Publish Verified Review'}
                          </button>
                        </form>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* CART & CHECKOUT SLIDE-OVER DRAWER */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[120] flex justify-end">
          <div className="bg-white w-full max-w-lg h-full shadow-2xl flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-[#d11a2a]" />
                <h2 className="text-base font-bold text-slate-900">
                  {checkoutStep === 'cart'
                    ? `Your Gear Bag (${cartCount})`
                    : checkoutStep === 'shipping'
                    ? 'Delivery & Payment'
                    : 'Order Confirmed'}
                </h2>
              </div>
              <button onClick={() => setIsCartOpen(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            {checkoutStep === 'confirmed' && confirmedOrder ? (
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="p-5 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold text-base">
                    <PackageCheck className="w-5 h-5" />
                    Order {confirmedOrder.order_number} Confirmed
                  </div>
                  <p className="text-xs text-emerald-700 leading-relaxed">
                    Preparing shipment for {confirmedOrder.customer_name}. Payment method:{' '}
                    <span className="font-semibold">{formatPaymentMethodLabel(confirmedOrder.payment_method)}</span>
                    {' · '}
                    <span className="font-semibold">{formatOrderPaymentStatusLabel(confirmedOrder.payment_status)}</span>.
                  </p>
                  {(confirmedOrder.payment_reference || confirmedOrder.receiving_account_label || confirmedOrder.payer_bank_name) && (
                    <div className="pt-2 border-t border-emerald-200/70 text-[11px] text-emerald-900 space-y-0.5">
                      {confirmedOrder.receiving_account_label && (
                        <div>Receiving A/C: <span className="font-semibold">{confirmedOrder.receiving_account_label}</span></div>
                      )}
                      {confirmedOrder.payment_reference && (
                        <div>Ref / UTR: <span className="font-mono font-semibold">{confirmedOrder.payment_reference}</span></div>
                      )}
                      {confirmedOrder.payer_bank_name && (
                        <div>Sender Bank: <span className="font-semibold">{confirmedOrder.payer_bank_name}</span></div>
                      )}
                    </div>
                  )}
                </div>

                <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 text-xs">
                  {confirmedOrder.items.map((item, idx) => (
                    <div key={idx} className="p-3.5 flex justify-between gap-3">
                      <div>
                        <div className="font-semibold text-slate-900">
                          {item.quantity}x {item.name}
                        </div>
                        <div className="text-slate-500 mt-0.5">
                          Size: {item.selected_size}
                          {item.include_knocking ? ' · + Knocking' : ''}
                          {item.custom_print ? ` · ${item.custom_print}` : ''}
                        </div>
                      </div>
                      <div className="font-mono font-semibold text-slate-900 shrink-0">
                        {formatRawStoreAmount(item.unit_price * item.quantity, confirmedOrder.currency as StoreCurrency)}
                      </div>
                    </div>
                  ))}
                  <div className="p-3.5 flex justify-between font-bold text-sm text-slate-900 bg-slate-50">
                    <span>Total</span>
                    <span className="font-mono">
                      {formatRawStoreAmount(confirmedOrder.total, confirmedOrder.currency as StoreCurrency)}
                    </span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setIsCartOpen(false);
                      setTrackedOrderId(confirmedOrder.id);
                      setOrdersTab('track');
                      setIsOrdersOpen(true);
                    }}
                    className="flex-1 py-2.5 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800"
                  >
                    Track Shipment
                  </button>
                  <button
                    onClick={() => setIsCartOpen(false)}
                    className="flex-1 py-2.5 text-xs font-semibold border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50"
                  >
                    Continue Shopping
                  </button>
                </div>
              </div>
            ) : cart.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3">
                <ShoppingBag className="w-10 h-10 text-slate-300" />
                <div className="text-sm font-semibold text-slate-800">Your gear bag is empty</div>
                <p className="text-xs text-slate-500 max-w-xs">
                  Add sports equipment, jerseys, fitness gear, indoor board games, or esports accessories from the store or your wishlist.
                </p>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="px-4 py-2 text-xs font-semibold bg-slate-900 text-white rounded-lg"
                >
                  Browse Store
                </button>
              </div>
            ) : checkoutStep === 'cart' ? (
              <>
                <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 text-xs">
                  {cartSubtotal >= freeShippingThreshold ? (
                    <div className="font-semibold text-emerald-700 flex items-center gap-1.5">
                      <Truck className="w-4 h-4" />
                      Unlocked Free Express Tournament Shipping
                    </div>
                  ) : (
                    <div className="text-slate-600">
                      Add{' '}
                      <span className="font-mono font-semibold text-slate-900">
                        {formatRawStoreAmount(freeShippingThreshold - cartSubtotal, currency)}
                      </span>{' '}
                      more for Free Express Shipping
                    </div>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {cart.map((item) => (
                    <div key={item.cartKey} className="flex gap-3.5 pb-4 border-b border-slate-100">
                      <img
                        src={item.product.image_url}
                        alt={item.product.name}
                        referrerPolicy="no-referrer"
                        className="w-20 h-16 rounded-lg object-cover bg-slate-100 border border-slate-200 shrink-0"
                      />
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-xs font-semibold text-slate-900 line-clamp-2">{item.product.name}</h4>
                          <button
                            onClick={() => setCart((prev) => prev.filter((c) => c.cartKey !== item.cartKey))}
                            className="text-slate-400 hover:text-rose-600 shrink-0"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Size: {item.selectedSize}
                          {item.selectedHand ? ` · ${item.selectedHand}` : ''}
                          {item.includeKnocking ? ' · + Knocking' : ''}
                          {item.customJerseyName || item.customJerseyNumber
                            ? ` · Print: ${item.customJerseyName || ''} #${item.customJerseyNumber || ''}`
                            : ''}
                        </div>
                        <div className="flex items-center justify-between pt-1">
                          <div className="flex items-center border border-slate-200 rounded-md">
                            <button
                              onClick={() =>
                                setCart((prev) =>
                                  prev
                                    .map((c) => (c.cartKey === item.cartKey ? { ...c, quantity: c.quantity - 1 } : c))
                                    .filter((c) => c.quantity > 0)
                                )
                              }
                              className="px-2 py-1 text-slate-600 hover:bg-slate-50"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="px-2 text-xs font-mono font-semibold tabular-nums">{item.quantity}</span>
                            <button
                              onClick={() =>
                                setCart((prev) =>
                                  prev.map((c) =>
                                    c.cartKey === item.cartKey
                                      ? { ...c, quantity: Math.min(c.product.stock, c.quantity + 1) }
                                      : c
                                  )
                                )
                              }
                              className="px-2 py-1 text-slate-600 hover:bg-slate-50"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          <span className="text-xs font-bold font-mono text-slate-900 tabular-nums">
                            {formatRawStoreAmount(getCartItemUnitPrice(item) * item.quantity, currency)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="pt-2 space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                        placeholder="Enter promo code"
                        className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono"
                      />
                      <button
                        type="button"
                        onClick={handleApplyCoupon}
                        className="px-3.5 py-2 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800"
                      >
                        Apply
                      </button>
                    </div>
                    {appliedCoupon && (
                      <div className="flex items-center justify-between text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                        <span>
                          Code <strong className="font-mono">{appliedCoupon.code}</strong> applied
                        </span>
                        <button onClick={() => setAppliedCoupon(null)} className="text-emerald-800 underline">
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-6 border-t border-slate-200 bg-slate-50 space-y-3">
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Subtotal</span>
                      <span className="font-mono tabular-nums">{formatRawStoreAmount(cartSubtotal, currency)}</span>
                    </div>
                    {discountAmount > 0 && (
                      <div className="flex justify-between text-emerald-700">
                        <span>Promo Discount</span>
                        <span className="font-mono tabular-nums">-{formatRawStoreAmount(discountAmount, currency)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-slate-600">
                      <span>Shipping</span>
                      <span className="font-mono tabular-nums">
                        {shippingFee === 0 ? 'FREE' : formatRawStoreAmount(shippingFee, currency)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
                      <span>Total</span>
                      <span className="font-mono tabular-nums">{formatRawStoreAmount(cartTotal, currency)}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setCheckoutStep('shipping');
                      void StoreService.trackAnalyticsEvent({
                        eventType: 'checkout_start',
                        userId: user?.uid || 'guest',
                        checkoutMode: 'cart_checkout',
                        units: cartCount,
                        revenueUsd: currency === 'INR' ? Number((cartTotal / 83.5).toFixed(2)) : cartTotal,
                      });
                    }}
                    className="w-full py-3 bg-[#d11a2a] hover:bg-[#b51523] text-white text-sm font-semibold rounded-lg transition-colors"
                  >
                    Proceed to Shipping &amp; Payment
                  </button>
                </div>
              </>
            ) : (
              <form onSubmit={handleCheckoutSubmit} className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  <button
                    type="button"
                    onClick={() => setCheckoutStep('cart')}
                    className="text-xs font-semibold text-slate-600 hover:text-slate-900"
                  >
                    &larr; Back to Bag
                  </button>

                  <div className="space-y-3">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Customer &amp; Delivery Address</div>
                    <input
                      type="text"
                      required
                      placeholder="Full Name *"
                      value={shippingForm.name}
                      onChange={(e) => setShippingForm({ ...shippingForm, name: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                    />
                    <div className="grid grid-cols-2 gap-2.5">
                      <input
                        type="email"
                        placeholder="Email for receipt"
                        value={shippingForm.email}
                        onChange={(e) => setShippingForm({ ...shippingForm, email: e.target.value })}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                      />
                      <input
                        type="tel"
                        required
                        placeholder="Phone Number *"
                        value={shippingForm.phone}
                        onChange={(e) => setShippingForm({ ...shippingForm, phone: e.target.value })}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                      />
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="Street Address, Ground / Apartment *"
                      value={shippingForm.line1}
                      onChange={(e) => setShippingForm({ ...shippingForm, line1: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                    />
                    <div className="grid grid-cols-2 gap-2.5">
                      <input
                        type="text"
                        required
                        placeholder="City *"
                        value={shippingForm.city}
                        onChange={(e) => setShippingForm({ ...shippingForm, city: e.target.value })}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                      />
                      <input
                        type="text"
                        required
                        placeholder="State / Province *"
                        value={shippingForm.state}
                        onChange={(e) => setShippingForm({ ...shippingForm, state: e.target.value })}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                      <input
                        type="text"
                        required
                        placeholder="Postal / ZIP Code *"
                        value={shippingForm.postal_code}
                        onChange={(e) => setShippingForm({ ...shippingForm, postal_code: e.target.value })}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                      />
                      <input
                        type="text"
                        required
                        placeholder="Country *"
                        value={shippingForm.country}
                        onChange={(e) => setShippingForm({ ...shippingForm, country: e.target.value })}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="space-y-2.5 pt-2">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Payment Method</div>
                    {[
                      ...(activeBankAccounts.length > 0 && selectedBankAccount
                        ? [
                            {
                              id: 'bank_transfer',
                              title: 'Direct Bank-to-Bank Transfer (Admin A/C)',
                              sub: `NEFT / IMPS / RTGS / Wire directly to ${selectedBankAccount.bank_name || selectedBankAccount.label} (${selectedBankAccount.account_holder_name})`,
                            },
                          ]
                        : []),
                      ...(syntheticUpiQrAccount
                        ? [
                            {
                              id: 'upi',
                              title: 'Direct Bank UPI & Scan QR',
                              sub: `Scan QR or send directly to Store UPI: ${syntheticUpiQrAccount.upi_id || syntheticUpiQrAccount.label}`,
                            },
                          ]
                        : []),
                      ...(activePaypalAccounts.length > 0 && selectedPaypalAccount
                        ? [
                            {
                              id: 'paypal',
                              title: 'PayPal & Scan QR Transfer',
                              sub: `Send directly to ${selectedPaypalAccount.paypal_handle || selectedPaypalAccount.label}`,
                            },
                          ]
                        : []),
                      ...(activeCustomQrAccounts.length > 0 && selectedCustomQrAccount
                        ? [
                            {
                              id: 'custom_qr',
                              title: `Merchant QR Scan & Pay (${selectedCustomQrAccount.label})`,
                              sub: `Scan QR code or use direct merchant link (${selectedCustomQrAccount.account_holder_name})`,
                            },
                          ]
                        : []),
                      { id: 'cod', title: 'Cash on Delivery (COD)', sub: 'Pay at your doorstep when gear arrives' },
                      {
                        id: 'razorpay',
                        title: 'UPI / Netbanking / Cards (Razorpay)',
                        sub: activeRazorpayAccount
                          ? `Settlement routed to ${activeRazorpayAccount.label}`
                          : 'Instant checkout in INR',
                      },
                      {
                        id: 'stripe',
                        title: `Card Checkout via Stripe (${currency})`,
                        sub: activeStripeAccount
                          ? `Settlement routed to ${activeStripeAccount.label}`
                          : 'Global credit/debit cards with AVS protection',
                      },
                    ].map((opt) => (
                      <label
                        key={opt.id}
                        className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                          paymentMethod === opt.id
                            ? 'border-slate-900 bg-slate-50'
                            : 'border-slate-200 bg-white hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="paymentMethod"
                          checked={paymentMethod === opt.id}
                          onChange={() => setPaymentMethod(opt.id as any)}
                          className="mt-0.5"
                        />
                        <div className="text-xs">
                          <div className="font-semibold text-slate-900">{opt.title}</div>
                          <div className="text-slate-500">{opt.sub}</div>
                        </div>
                      </label>
                    ))}

                    {paymentMethod === 'bank_transfer' && selectedBankAccount && (
                      <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                            <Landmark className="w-4 h-4 text-[#d11a2a]" />
                            Transfer to Store Admin Bank Account
                          </div>
                          {activeBankAccounts.length > 1 && (
                            <select
                              value={selectedBankAccount.id}
                              onChange={(e) => setSelectedBankAccountId(e.target.value)}
                              aria-label="Choose receiving bank account"
                              className="px-2 py-1 text-[11px] font-semibold border border-slate-200 rounded-md bg-white text-slate-800"
                            >
                              {activeBankAccounts.map((acc) => (
                                <option key={acc.id} value={acc.id}>
                                  {acc.label} ({acc.currency_scope})
                                </option>
                              ))}
                            </select>
                          )}
                        </div>

                        {(selectedBankAccount.qr_code_url || selectedBankAccount.upi_id || selectedBankAccount.qr_payload) && (
                          <CheckoutQrCard
                            account={selectedBankAccount}
                            amount={cartTotal}
                            inrAmount={currency === 'INR' ? cartTotal : cart.reduce((s, i) => s + i.product.price_inr * i.quantity, 0)}
                            currency={currency}
                            note="Streamlify Store Order"
                            copiedField={copiedBankField}
                            onCopy={handleCopyBankDetail}
                          />
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-white p-3 rounded-lg border border-slate-200">
                          <div>
                            <div className="text-[10px] uppercase text-slate-400 font-semibold">Beneficiary Name</div>
                            <div className="font-semibold text-slate-900">{selectedBankAccount.account_holder_name}</div>
                          </div>
                          <div>
                            <div className="text-[10px] uppercase text-slate-400 font-semibold">Bank &amp; Branch</div>
                            <div className="font-semibold text-slate-900">
                              {selectedBankAccount.bank_name || selectedBankAccount.label}
                              {selectedBankAccount.branch_name ? ` · ${selectedBankAccount.branch_name}` : ''}
                            </div>
                          </div>
                          {selectedBankAccount.account_number && (
                            <div className="flex items-center justify-between gap-2 sm:col-span-2 pt-1.5 border-t border-slate-100">
                              <div>
                                <div className="text-[10px] uppercase text-slate-400 font-semibold">Account Number</div>
                                <div className="font-mono font-bold text-slate-900">{selectedBankAccount.account_number}</div>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleCopyBankDetail('Account Number', selectedBankAccount.account_number || '')}
                                className="px-2.5 py-1 text-[11px] font-semibold border border-slate-200 rounded-md hover:bg-slate-50 flex items-center gap-1 whitespace-nowrap"
                              >
                                <Copy className="w-3 h-3" />
                                {copiedBankField === 'Account Number' ? 'Copied' : 'Copy'}
                              </button>
                            </div>
                          )}
                          {selectedBankAccount.ifsc_or_routing && (
                            <div className="flex items-center justify-between gap-2 sm:col-span-2 pt-1.5 border-t border-slate-100">
                              <div>
                                <div className="text-[10px] uppercase text-slate-400 font-semibold">IFSC / Routing / SWIFT</div>
                                <div className="font-mono font-bold text-slate-900">{selectedBankAccount.ifsc_or_routing}</div>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleCopyBankDetail('IFSC / Routing', selectedBankAccount.ifsc_or_routing || '')}
                                className="px-2.5 py-1 text-[11px] font-semibold border border-slate-200 rounded-md hover:bg-slate-50 flex items-center gap-1 whitespace-nowrap"
                              >
                                <Copy className="w-3 h-3" />
                                {copiedBankField === 'IFSC / Routing' ? 'Copied' : 'Copy'}
                              </button>
                            </div>
                          )}
                          <div className="flex items-center justify-between gap-2 sm:col-span-2 pt-1.5 border-t border-slate-100">
                            <div>
                              <div className="text-[10px] uppercase text-slate-400 font-semibold">Exact Payable Amount</div>
                              <div className="font-mono font-bold text-[#d11a2a] tabular-nums">
                                {formatRawStoreAmount(cartTotal, currency)}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleCopyBankDetail('Amount', String(cartTotal))}
                              className="px-2.5 py-1 text-[11px] font-semibold border border-slate-200 rounded-md hover:bg-slate-50 flex items-center gap-1 whitespace-nowrap"
                            >
                              <Copy className="w-3 h-3" />
                              {copiedBankField === 'Amount' ? 'Copied' : 'Copy'}
                            </button>
                          </div>
                        </div>

                        {selectedBankAccount.instructions && (
                          <p className="text-[11px] text-slate-600 leading-relaxed">{selectedBankAccount.instructions}</p>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <input
                            type="text"
                            placeholder="Your Bank Name (e.g. HDFC, Chase)"
                            value={payerBankName}
                            onChange={(e) => setPayerBankName(e.target.value)}
                            className="px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                          />
                          <input
                            type="text"
                            required
                            placeholder="Transaction / UTR / Wire Ref # *"
                            value={bankTransferRef}
                            onChange={(e) => setBankTransferRef(e.target.value)}
                            className="px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white font-mono"
                          />
                        </div>
                      </div>
                    )}

                    {paymentMethod === 'upi' && syntheticUpiQrAccount && (
                      <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                            <Smartphone className="w-4 h-4 text-[#d11a2a]" />
                            Scan &amp; Pay Store UPI
                          </div>
                          {activeUpiAccounts.length > 1 && (
                            <select
                              value={syntheticUpiQrAccount.id}
                              onChange={(e) => setSelectedUpiAccountId(e.target.value)}
                              aria-label="Choose receiving UPI account"
                              className="px-2 py-1 text-[11px] font-semibold border border-slate-200 rounded-md bg-white text-slate-800"
                            >
                              {activeUpiAccounts.map((acc) => (
                                <option key={acc.id} value={acc.id}>
                                  {acc.label} ({acc.upi_id})
                                </option>
                              ))}
                            </select>
                          )}
                        </div>

                        <CheckoutQrCard
                          account={syntheticUpiQrAccount}
                          amount={currency === 'INR' ? cartTotal : cart.reduce((s, i) => s + i.product.price_inr * i.quantity, 0)}
                          inrAmount={currency === 'INR' ? cartTotal : cart.reduce((s, i) => s + i.product.price_inr * i.quantity, 0)}
                          currency="INR"
                          note="Streamlify Store Order"
                          copiedField={copiedBankField}
                          onCopy={handleCopyBankDetail}
                        />

                        {effectiveUpiVpa && (
                          <div className="bg-white p-3 rounded-lg border border-slate-200 flex items-center justify-between gap-2 text-xs">
                            <div>
                              <div className="text-[10px] uppercase text-slate-400 font-semibold">Store UPI ID · {effectiveUpiPayeeName}</div>
                              <div className="font-mono font-bold text-slate-900">{effectiveUpiVpa}</div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleCopyBankDetail('UPI ID', effectiveUpiVpa)}
                              className="px-2.5 py-1 text-[11px] font-semibold border border-slate-200 rounded-md hover:bg-slate-50 flex items-center gap-1 whitespace-nowrap"
                            >
                              <Copy className="w-3 h-3" />
                              {copiedBankField === 'UPI ID' ? 'Copied' : 'Copy'}
                            </button>
                          </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <input
                            type="text"
                            placeholder="Your UPI App / Bank (optional)"
                            value={payerBankName}
                            onChange={(e) => setPayerBankName(e.target.value)}
                            className="px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                          />
                          <input
                            type="text"
                            required
                            placeholder="12-digit UPI UTR Ref # *"
                            value={bankTransferRef}
                            onChange={(e) => setBankTransferRef(e.target.value)}
                            className="px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white font-mono"
                          />
                        </div>
                      </div>
                    )}

                    {paymentMethod === 'paypal' && selectedPaypalAccount && (
                      <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                            <Link2 className="w-4 h-4 text-[#d11a2a]" />
                            Pay Directly via PayPal
                          </div>
                          {activePaypalAccounts.length > 1 && (
                            <select
                              value={selectedPaypalAccount.id}
                              onChange={(e) => setSelectedPaypalAccountId(e.target.value)}
                              aria-label="Choose receiving PayPal account"
                              className="px-2 py-1 text-[11px] font-semibold border border-slate-200 rounded-md bg-white text-slate-800"
                            >
                              {activePaypalAccounts.map((acc) => (
                                <option key={acc.id} value={acc.id}>
                                  {acc.label} ({acc.currency_scope})
                                </option>
                              ))}
                            </select>
                          )}
                        </div>

                        <CheckoutQrCard
                          account={selectedPaypalAccount}
                          amount={cartTotal}
                          inrAmount={currency === 'INR' ? cartTotal : cart.reduce((s, i) => s + i.product.price_inr * i.quantity, 0)}
                          currency={currency}
                          note="Streamlify Store Order"
                          copiedField={copiedBankField}
                          onCopy={handleCopyBankDetail}
                        />

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <input
                            type="text"
                            placeholder="Your PayPal Name / Email (optional)"
                            value={payerBankName}
                            onChange={(e) => setPayerBankName(e.target.value)}
                            className="px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                          />
                          <input
                            type="text"
                            required
                            placeholder="PayPal Transaction ID *"
                            value={bankTransferRef}
                            onChange={(e) => setBankTransferRef(e.target.value)}
                            className="px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white font-mono"
                          />
                        </div>
                      </div>
                    )}

                    {paymentMethod === 'custom_qr' && selectedCustomQrAccount && (
                      <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                            <QrCode className="w-4 h-4 text-[#d11a2a]" />
                            Merchant Scan &amp; Pay QR
                          </div>
                          {activeCustomQrAccounts.length > 1 && (
                            <select
                              value={selectedCustomQrAccount.id}
                              onChange={(e) => setSelectedCustomQrAccountId(e.target.value)}
                              aria-label="Choose merchant payment QR"
                              className="px-2 py-1 text-[11px] font-semibold border border-slate-200 rounded-md bg-white text-slate-800"
                            >
                              {activeCustomQrAccounts.map((acc) => (
                                <option key={acc.id} value={acc.id}>
                                  {acc.label} ({acc.currency_scope})
                                </option>
                              ))}
                            </select>
                          )}
                        </div>

                        <CheckoutQrCard
                          account={selectedCustomQrAccount}
                          amount={cartTotal}
                          inrAmount={currency === 'INR' ? cartTotal : cart.reduce((s, i) => s + i.product.price_inr * i.quantity, 0)}
                          currency={currency}
                          note="Streamlify Store Order"
                          copiedField={copiedBankField}
                          onCopy={handleCopyBankDetail}
                        />

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <input
                            type="text"
                            placeholder="Payment App / Wallet Used (optional)"
                            value={payerBankName}
                            onChange={(e) => setPayerBankName(e.target.value)}
                            className="px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                          />
                          <input
                            type="text"
                            required
                            placeholder="Payment Reference / Receipt ID *"
                            value={bankTransferRef}
                            onChange={(e) => setBankTransferRef(e.target.value)}
                            className="px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white font-mono"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-6 border-t border-slate-200 bg-slate-50 space-y-3">
                  <div className="flex justify-between text-sm font-bold text-slate-900">
                    <span>Order Total</span>
                    <span className="font-mono tabular-nums">{formatRawStoreAmount(cartTotal, currency)}</span>
                  </div>
                  <button
                    type="submit"
                    disabled={placingOrder}
                    className="w-full py-3 bg-[#d11a2a] hover:bg-[#b51523] text-white text-sm font-semibold rounded-lg transition-colors"
                  >
                    {placingOrder
                      ? 'Processing Order...'
                      : paymentMethod === 'cod'
                      ? 'Confirm Cash on Delivery Order'
                      : paymentMethod === 'bank_transfer' || paymentMethod === 'upi' || paymentMethod === 'paypal' || paymentMethod === 'custom_qr'
                      ? `Submit Transfer Proof (${formatRawStoreAmount(cartTotal, currency)}) & Place Order`
                      : `Pay ${formatRawStoreAmount(cartTotal, currency)} & Place Order`}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ORDER HISTORY & TRACK ORDER MODAL */}
      {isOrdersOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[120] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-4">
                <h3 className="font-bold text-base text-slate-900">Orders &amp; Shipment Tracking</h3>
                <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setOrdersTab('history')}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                      ordersTab === 'history' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Order History ({orders.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrdersTab('track')}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                      ordersTab === 'track' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Track Order
                  </button>
                </div>
              </div>
              <button onClick={() => setIsOrdersOpen(false)} className="text-slate-400 hover:text-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            {ordersTab === 'history' ? (
              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[
                      { id: 'all', label: 'All Orders' },
                      { id: 'active', label: 'Active Shipments' },
                      { id: 'delivered', label: 'Delivered' },
                      { id: 'cancelled', label: 'Cancelled' },
                    ].map((f) => (
                      <button
                        type="button"
                        key={f.id}
                        onClick={() => setOrderHistoryFilter(f.id as any)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap ${
                          orderHistoryFilter === f.id
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                  <div className="relative w-full sm:w-64">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={orderSearchQuery}
                      onChange={(e) => setOrderSearchQuery(e.target.value)}
                      placeholder="Search order # or gear name..."
                      className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg"
                    />
                  </div>
                </div>

                {filteredOrderHistory.length === 0 ? (
                  <div className="text-center py-12 space-y-2">
                    <Package className="w-10 h-10 text-slate-300 mx-auto" />
                    <p className="text-sm font-semibold text-slate-700">No purchase history found</p>
                    <p className="text-xs text-slate-500">
                      Orders you place in the Store appear here with receipts, tracking IDs, and one-click reordering.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredOrderHistory.map((ord) => {
                      const units = (ord.items || []).reduce((s, it) => s + (Number(it.quantity) || 0), 0);
                      return (
                        <div key={ord.id} className="border border-slate-200 rounded-xl p-5 space-y-4">
                          <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-slate-100">
                            <div>
                              <div className="flex items-center gap-2 font-mono font-bold text-sm text-slate-900">
                                <span>{ord.order_number}</span>
                                <span className="text-slate-300">·</span>
                                <span className="font-sans text-xs font-semibold text-slate-600">
                                  {units} {units === 1 ? 'unit' : 'units'}
                                </span>
                              </div>
                              <div className="text-xs text-slate-500 mt-0.5">
                                Placed {new Date(ord.created_at).toLocaleString()} · Payment: {formatPaymentMethodLabel(ord.payment_method)} ({formatOrderPaymentStatusLabel(ord.payment_status)})
                              </div>
                              {(ord.receiving_account_label || ord.payment_reference || ord.payer_bank_name) && (
                                <div className="text-[11px] text-slate-600 mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-0.5">
                                  {ord.receiving_account_label && (
                                    <span>To: <span className="font-semibold text-slate-800">{ord.receiving_account_label}</span></span>
                                  )}
                                  {ord.payment_reference && (
                                    <span>Ref/UTR: <span className="font-mono font-semibold text-slate-800">{ord.payment_reference}</span></span>
                                  )}
                                  {ord.payer_bank_name && (
                                    <span>From: <span className="font-semibold text-slate-800">{ord.payer_bank_name}</span></span>
                                  )}
                                </div>
                              )}
                            </div>
                            <div className="text-right">
                              <div className="text-xs font-bold uppercase tracking-wide text-[#d11a2a]">
                                {ord.status}
                              </div>
                              <div className="font-mono text-base font-bold text-slate-900 tabular-nums">
                                {formatRawStoreAmount(ord.total, ord.currency as StoreCurrency)}
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2 text-xs">
                            {ord.items.map((it, idx) => {
                              const catalogProd = products.find((p) => p.id === it.product_id);
                              const alreadyReviewed = Boolean(
                                user?.uid &&
                                  allReviews.some((r) => r.product_id === it.product_id && r.user_id === user.uid)
                              );
                              return (
                                <div key={idx} className="flex justify-between items-start gap-3 py-1.5 border-b border-slate-50 last:border-0">
                                  <div>
                                    <div className="font-semibold text-slate-800">
                                      {it.quantity}x {it.name}
                                    </div>
                                    <div className="text-slate-500">
                                      {it.brand} · Size: {it.selected_size}
                                      {it.selected_hand ? ` · ${it.selected_hand}` : ''}
                                      {it.include_knocking ? ' · + Bat Knocking & Oiling' : ''}
                                      {it.custom_print ? ` · Custom Print: ${it.custom_print}` : ''}
                                    </div>
                                    {ord.status !== 'cancelled' && catalogProd && user?.uid && user.uid !== 'guest' && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setIsOrdersOpen(false);
                                          openProductDetail(catalogProd, true);
                                        }}
                                        className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-[#d11a2a] hover:underline"
                                      >
                                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                        {alreadyReviewed ? 'Edit Your Review' : 'Write Verified Review'}
                                      </button>
                                    )}
                                  </div>
                                  <span className="font-mono font-semibold text-slate-900 shrink-0 tabular-nums">
                                    {formatRawStoreAmount(it.unit_price * it.quantity, ord.currency as StoreCurrency)}
                                  </span>
                                </div>
                              );
                            })}
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
                            <div className="text-slate-500">
                              Ship to: <span className="text-slate-700 font-medium">{ord.shipping_address?.city}, {ord.shipping_address?.country}</span>
                              {ord.tracking_number && (
                                <span className="ml-2 font-mono text-slate-800">· AWB {ord.tracking_number}</span>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              {ord.status === 'pending' && (
                                <button
                                  type="button"
                                  onClick={async () => {
                                    await StoreService.updateOrderStatus(ord.id, 'cancelled');
                                    setOrders((prev) =>
                                      prev.map((o) => (o.id === ord.id ? { ...o, status: 'cancelled' } : o))
                                    );
                                    showToast(`Order ${ord.order_number} cancelled.`);
                                  }}
                                  className="px-3 py-1.5 text-xs font-semibold text-rose-600 border border-rose-200 rounded-lg hover:bg-rose-50"
                                >
                                  Cancel Order
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleReorder(ord)}
                                className="px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 flex items-center gap-1"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                Reorder
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setTrackedOrderId(ord.id);
                                  setOrdersTab('track');
                                }}
                                className="px-3 py-1.5 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800 flex items-center gap-1"
                              >
                                <Truck className="w-3.5 h-3.5" />
                                Track Shipment
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              /* TRACK ORDER TAB */
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <form onSubmit={handleTrackLookup} className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={trackInput}
                      onChange={(e) => setTrackInput(e.target.value.toUpperCase())}
                      placeholder="Enter Order Number (e.g. SL-104281) or Carrier Tracking ID..."
                      className="w-full pl-9 pr-3 py-2.5 text-xs border border-slate-200 rounded-lg font-mono"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2.5 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800 whitespace-nowrap"
                  >
                    Locate Shipment
                  </button>
                </form>

                {orders.length > 0 && (
                  <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-1">
                    {orders.slice(0, 8).map((ord) => (
                      <button
                        type="button"
                        key={ord.id}
                        onClick={() => setTrackedOrderId(ord.id)}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-semibold whitespace-nowrap shrink-0 transition-colors ${
                          activeTrackedOrder?.id === ord.id
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {ord.order_number} · {ord.status.toUpperCase()}
                      </button>
                    ))}
                  </div>
                )}

                {!activeTrackedOrder ? (
                  <div className="text-center py-12 space-y-2">
                    <Truck className="w-10 h-10 text-slate-300 mx-auto" />
                    <p className="text-sm font-semibold text-slate-700">No shipments to track yet</p>
                    <p className="text-xs text-slate-500">
                      Place an order in the Store to monitor real-time preparation, packing, carrier dispatch, and delivery progress.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Summary Header */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="text-xs font-medium text-slate-500">
                          Order {activeTrackedOrder.order_number} · Updated {new Date(activeTrackedOrder.updated_at || activeTrackedOrder.created_at).toLocaleString()}
                        </div>
                        <div className="text-lg font-bold text-slate-900">
                          Status: <span className="text-[#d11a2a] uppercase">{activeTrackedOrder.status}</span>
                        </div>
                        <div className="text-xs text-slate-600 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {activeTrackedOrder.shipping_address?.line1}, {activeTrackedOrder.shipping_address?.city},{' '}
                            {activeTrackedOrder.shipping_address?.state} {activeTrackedOrder.shipping_address?.postal_code},{' '}
                            {activeTrackedOrder.shipping_address?.country}
                          </span>
                        </div>
                      </div>

                      {activeTrackedOrder.tracking_number ? (
                        <div className="bg-white border border-slate-200 rounded-lg px-4 py-2.5 flex items-center gap-3 shrink-0">
                          <div>
                            <div className="text-[11px] font-medium text-slate-500">Carrier Tracking ID</div>
                            <div className="text-sm font-mono font-bold text-slate-900">{activeTrackedOrder.tracking_number}</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard?.writeText(activeTrackedOrder.tracking_number || '');
                              showToast('Tracking ID copied to clipboard.');
                            }}
                            className="p-1.5 rounded-md border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                            title="Copy Tracking ID"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="text-xs text-slate-500 bg-white border border-slate-200 rounded-lg px-3.5 py-2">
                          Carrier Tracking ID will appear once dispatched.
                        </div>
                      )}
                    </div>

                    {/* Visual Progress Stepper */}
                    {activeTrackedOrder.status === 'cancelled' ? (
                      <div className="p-5 rounded-xl border border-rose-200 bg-rose-50 text-rose-800 text-xs space-y-1">
                        <div className="font-bold text-sm">Shipment Cancelled</div>
                        <p>This order was cancelled before final delivery. If paid online, refunds process automatically.</p>
                      </div>
                    ) : (
                      <div className="border border-slate-200 rounded-xl p-5 space-y-4">
                        <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Live Fulfillment Timeline</div>
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                          {SHIPMENT_STEPS.map((step, index) => {
                            const currentIdx = SHIPMENT_STEPS.findIndex((s) => s.key === activeTrackedOrder.status);
                            const completed = index <= (currentIdx >= 0 ? currentIdx : 0);
                            const isCurrent = index === (currentIdx >= 0 ? currentIdx : 0);
                            return (
                              <div
                                key={step.key}
                                className={`p-3.5 rounded-xl border transition-colors ${
                                  completed
                                    ? isCurrent
                                      ? 'border-[#d11a2a] bg-rose-50/40'
                                      : 'border-emerald-200 bg-emerald-50/40'
                                    : 'border-slate-200 bg-slate-50/60 opacity-60'
                                }`}
                              >
                                <div className="flex items-center justify-between mb-1.5">
                                  <span className="text-[11px] font-mono font-bold text-slate-500">0{index + 1}</span>
                                  {completed ? (
                                    <Check className={`w-4 h-4 ${isCurrent ? 'text-[#d11a2a]' : 'text-emerald-600'}`} />
                                  ) : (
                                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                                  )}
                                </div>
                                <div className="text-xs font-bold text-slate-900">{step.label}</div>
                                <div className="text-[11px] text-slate-500 mt-1 leading-snug">{step.detail}</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Package Contents */}
                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                      <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-700">
                        Package Manifest
                      </div>
                      <div className="divide-y divide-slate-100 text-xs">
                        {activeTrackedOrder.items.map((it, idx) => (
                          <div key={idx} className="px-4 py-3 flex justify-between gap-3">
                            <div>
                              <div className="font-semibold text-slate-900">
                                {it.quantity}x {it.name}
                              </div>
                              <div className="text-slate-500">
                                SKU {it.sku} · Size: {it.selected_size}
                                {it.include_knocking ? ' · + Knocking' : ''}
                                {it.custom_print ? ` · ${it.custom_print}` : ''}
                              </div>
                            </div>
                            <div className="font-mono font-semibold text-slate-900 shrink-0 tabular-nums">
                              {formatRawStoreAmount(it.unit_price * it.quantity, activeTrackedOrder.currency as StoreCurrency)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MOBILE / TABLET FILTER SIDEBAR DRAWER */}
      {isMobileFiltersOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[120] flex justify-start lg:hidden">
          <div className="bg-white w-full max-w-xs h-full shadow-2xl flex flex-col">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <SlidersHorizontal className="w-4 h-4 text-[#d11a2a]" />
                <span>Filter Gear</span>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileFiltersOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Sport Type */}
              <div className="space-y-1.5">
                <div className="text-xs font-bold text-slate-900 pb-1">Sport Type</div>
                <button
                  type="button"
                  onClick={() => setActiveSport('All')}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs ${
                    activeSport === 'All' ? 'bg-slate-900 text-white font-semibold' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span>All Sports &amp; Games</span>
                  <span className="font-mono text-[11px] tabular-nums">{productsMatchingFacetBase('sport').length}</span>
                </button>
                {sidebarSportOptions.map((sp) => (
                  <button
                    type="button"
                    key={sp.name}
                    onClick={() => setActiveSport(activeSport === sp.name ? 'All' : sp.name)}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs ${
                      activeSport === sp.name
                        ? 'bg-[#d11a2a] text-white font-semibold'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>{sp.name}</span>
                    <span className="font-mono text-[11px] tabular-nums">{sp.count}</span>
                  </button>
                ))}
              </div>

              {/* Product Category */}
              <div className="space-y-1.5 pt-4 border-t border-slate-100">
                <div className="text-xs font-bold text-slate-900 pb-1">Product Category</div>
                <button
                  type="button"
                  onClick={() => setActiveCategory('All')}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs ${
                    activeCategory === 'All' ? 'bg-slate-900 text-white font-semibold' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span>All Categories</span>
                  <span className="font-mono text-[11px] tabular-nums">{productsMatchingFacetBase('category').length}</span>
                </button>
                {sidebarCategoryOptions.map((cat) => (
                  <button
                    type="button"
                    key={cat.name}
                    onClick={() => setActiveCategory(activeCategory === cat.name ? 'All' : cat.name)}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs ${
                      activeCategory === cat.name
                        ? 'bg-[#d11a2a] text-white font-semibold'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>{cat.name}</span>
                    <span className="font-mono text-[11px] tabular-nums">{cat.count}</span>
                  </button>
                ))}
              </div>

              {/* Brand */}
              {sidebarBrandOptions.length > 0 && (
                <div className="space-y-1.5 pt-4 border-t border-slate-100">
                  <div className="text-xs font-bold text-slate-900 pb-1">Brand</div>
                  <button
                    type="button"
                    onClick={() => setActiveBrand('All')}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs ${
                      activeBrand === 'All' ? 'bg-slate-900 text-white font-semibold' : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>All Brands</span>
                    <span className="font-mono text-[11px] tabular-nums">{productsMatchingFacetBase('brand').length}</span>
                  </button>
                  {sidebarBrandOptions.map((b) => (
                    <button
                      type="button"
                      key={b.name}
                      onClick={() => setActiveBrand(activeBrand === b.name ? 'All' : b.name)}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs ${
                        activeBrand === b.name
                          ? 'bg-[#d11a2a] text-white font-semibold'
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span>{b.name}</span>
                      <span className="font-mono text-[11px] tabular-nums">{b.count}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Rating & Stock */}
              <div className="space-y-2 pt-4 border-t border-slate-100">
                <div className="text-xs font-bold text-slate-900 pb-1">Rating &amp; Availability</div>
                {[
                  { label: 'All Ratings', value: 0 },
                  { label: '4★ & Above', value: 4 },
                  { label: '3★ & Above', value: 3 },
                ].map((opt) => (
                  <button
                    type="button"
                    key={opt.value}
                    onClick={() => setMinRatingFilter(opt.value)}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs ${
                      minRatingFilter === opt.value
                        ? 'bg-slate-900 text-white font-semibold'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>{opt.label}</span>
                  </button>
                ))}
                <label className="flex items-center justify-between px-2.5 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700">
                  <span>In Stock Only</span>
                  <input
                    type="checkbox"
                    checked={inStockOnly}
                    onChange={(e) => setInStockOnly(e.target.checked)}
                  />
                </label>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center gap-2">
              <button
                type="button"
                onClick={resetAllFilters}
                className="px-4 py-2.5 text-xs font-semibold border border-slate-200 bg-white text-slate-700 rounded-lg"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => setIsMobileFiltersOpen(false)}
                className="flex-1 py-2.5 text-xs font-semibold bg-[#d11a2a] text-white rounded-lg"
              >
                Show {filteredProducts.length} Items
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STICKY FLOATING COMPARISON TRAY */}
      {compareProducts.length > 0 && !isCompareOpen && !isCartOpen && !isWishlistOpen && !isOrdersOpen && !selectedProduct && (
        <div className="fixed bottom-4 inset-x-4 z-30 pointer-events-none">
          <div className="max-w-5xl mx-auto bg-white border border-slate-300 rounded-xl shadow-2xl px-4 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3 pointer-events-auto">
            <div className="flex items-center gap-2.5 overflow-x-auto hide-scrollbar">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 shrink-0 pr-1">
                <Scale className="w-4 h-4 text-[#d11a2a]" />
                <span className="tabular-nums">Compare ({compareProducts.length}/{MAX_COMPARE_ITEMS})</span>
              </div>
              {compareProducts.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 shrink-0"
                >
                  <img
                    src={item.image_url}
                    alt={item.name}
                    referrerPolicy="no-referrer"
                    className="w-7 h-7 rounded object-cover bg-white shrink-0"
                  />
                  <span className="text-xs font-medium text-slate-800 max-w-[130px] truncate">{item.name}</span>
                  <button
                    type="button"
                    onClick={() => toggleCompare(item.id)}
                    aria-label={`Remove ${item.name} from comparison`}
                    className="text-slate-400 hover:text-rose-600 shrink-0"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {compareProducts.length === 1 && (
                <span className="text-xs text-slate-500 whitespace-nowrap shrink-0">
                  Select 1+ more item to compare side by side
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0 justify-end">
              <button
                type="button"
                onClick={() => setCompareIds([])}
                className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg bg-white whitespace-nowrap"
              >
                Clear All
              </button>
              <button
                type="button"
                onClick={() => setIsCompareOpen(true)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#d11a2a] hover:bg-[#b51523] text-white transition-colors flex items-center gap-1.5 whitespace-nowrap"
              >
                <Scale className="w-3.5 h-3.5" />
                {compareProducts.length >= 2 ? `Compare Now (${compareProducts.length})` : 'Open Comparison'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* COMPARE GEAR MODAL */}
      {isCompareOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[120] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-6xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
              <div>
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <Scale className="w-4 h-4 text-[#d11a2a]" />
                  <span>Side-by-Side Product Comparison</span>
                  <span className="text-xs font-normal text-slate-500 tabular-nums">
                    ({compareProducts.length}/{MAX_COMPARE_ITEMS} selected)
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Compare features, technical specifications, customer ratings, and pricing side by side.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                {compareProducts.length < MAX_COMPARE_ITEMS && uncomparedProducts.length > 0 && (
                  <select
                    aria-label="Add product to compare"
                    value=""
                    onChange={(e) => {
                      if (e.target.value) toggleCompare(e.target.value);
                    }}
                    className="px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg bg-white text-slate-700 max-w-[210px]"
                  >
                    <option value="">+ Add item to compare...</option>
                    {uncomparedProducts.map((prod) => (
                      <option key={prod.id} value={prod.id}>
                        {prod.brand} · {prod.name} ({formatStorePrice(prod.price_usd, prod.price_inr, currency)})
                      </option>
                    ))}
                  </select>
                )}

                {compareProducts.length >= 2 && (
                  <label className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg bg-slate-50 text-slate-700 cursor-pointer whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={compareDiffOnly}
                      onChange={(e) => setCompareDiffOnly(e.target.checked)}
                    />
                    Differences Only
                  </label>
                )}

                {compareProducts.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setCompareIds([])}
                    className="px-3 py-1.5 text-xs font-semibold text-rose-600 border border-rose-200 rounded-lg hover:bg-rose-50 whitespace-nowrap"
                  >
                    Clear All
                  </button>
                )}

                <button
                  onClick={() => setIsCompareOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100"
                  aria-label="Close comparison"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-6">
              {compareProducts.length === 0 ? (
                <div className="py-12 text-center space-y-4">
                  <Scale className="w-10 h-10 text-slate-300 mx-auto" />
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-slate-800">No products selected for comparison</p>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      Pick two or more items using the Compare button on product cards or select items directly from the dropdown above.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsCompareOpen(false)}
                    className="px-4 py-2 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800"
                  >
                    Browse Store Gear
                  </button>
                </div>
              ) : (() => {
                const prices = compareProducts.map((p) => getProductPriceInCurrency(p.price_usd, p.price_inr, currency));
                const minPrice = Math.min(...prices);
                const priceDiffers = new Set(prices).size > 1;

                const ratings = compareProducts.map((p) => getProductRating(p));
                const maxRating = Math.max(...ratings.map((r) => r.count > 0 ? r.rating : 0));
                const ratingDiffers = maxRating > 0 && new Set(ratings.map((r) => r.rating)).size > 1;

                const allSpecKeys = Array.from(
                  new Set<string>(compareProducts.flatMap((p) => Object.keys(p.specs || {})))
                );

                const rowHasDifference = (values: string[]) => {
                  if (compareProducts.length < 2) return true;
                  return new Set(values.map((v) => v.trim().toLowerCase())).size > 1;
                };

                const showRow = (values: string[]) => !compareDiffOnly || rowHasDifference(values);

                const brandVals = compareProducts.map((p) => p.brand);
                const sportVals = compareProducts.map((p) => `${p.domain} · ${p.sport_type} · ${p.category}`);
                const priceVals = compareProducts.map((p) => formatStorePrice(p.price_usd, p.price_inr, currency));
                const mrpVals = compareProducts.map((p) =>
                  p.mrp_usd > p.price_usd
                    ? `${formatStorePrice(p.mrp_usd, p.mrp_inr, currency)} (-${Math.round(((p.mrp_usd - p.price_usd) / p.mrp_usd) * 100)}%)`
                    : 'No discount'
                );
                const stockVals = compareProducts.map((p) => (p.stock === 0 ? 'Out of Stock' : `${p.stock} available`));
                const ratingVals = ratings.map((r) => (r.count > 0 ? `${r.rating.toFixed(1)} (${r.count})` : 'None'));
                const sizeVals = compareProducts.map((p) => (p.sizes || ['Standard']).join(', '));
                const handVals = compareProducts.map((p) =>
                  p.handedness_options && p.handedness_options.length > 0 ? p.handedness_options.join(', ') : 'Universal Fit'
                );
                const knockVals = compareProducts.map((p) =>
                  p.knocking_available
                    ? `Available (+${formatStorePrice(p.knocking_fee_usd || 15, p.knocking_fee_inr || 999, currency)})`
                    : 'Not applicable'
                );
                const printVals = compareProducts.map((p) => (p.custom_print_available ? 'Included Free' : 'Standard Finish'));
                const authVals = compareProducts.map((p) => `${p.authenticity_prefix || 'SL-GEAR'} Verified`);
                const highlightVals = compareProducts.map((p) => (p.highlights || []).join(' | ') || '—');

                return (
                  <div className="space-y-4">
                    {compareProducts.length === 1 && (
                      <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-amber-900">
                        <span>
                          <strong>1 item selected.</strong> Add at least 1 more item from the selector above to compare features, specs, and pricing side by side.
                        </span>
                      </div>
                    )}

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-slate-200 bg-slate-50/70 align-top">
                            <th className="py-4 px-4 text-slate-500 font-semibold w-44 min-w-[160px] sticky left-0 bg-slate-50 z-10 border-r border-slate-200">
                              Product Overview
                            </th>
                            {compareProducts.map((p, idx) => {
                              const currentPrice = prices[idx];
                              const currentRating = ratings[idx];
                              const isBestPrice = compareProducts.length >= 2 && priceDiffers && currentPrice === minPrice;
                              const isBestRated = compareProducts.length >= 2 && ratingDiffers && currentRating.count > 0 && currentRating.rating === maxRating;
                              const isWish = wishlist.includes(p.id);

                              return (
                                <th key={p.id} className="py-4 px-4 min-w-[230px] max-w-[270px] font-normal align-top">
                                  <div className="space-y-3">
                                    <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
                                      <img
                                        src={p.image_url}
                                        alt={p.name}
                                        referrerPolicy="no-referrer"
                                        onClick={() => {
                                          setIsCompareOpen(false);
                                          openProductDetail(p);
                                        }}
                                        className="w-full h-full object-cover cursor-pointer"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => toggleCompare(p.id)}
                                        aria-label={`Remove ${p.name}`}
                                        className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-white/95 border border-slate-200 text-slate-500 hover:text-rose-600 flex items-center justify-center shadow-sm"
                                      >
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </div>

                                    <div className="space-y-1">
                                      <div className="text-[11px] text-slate-500 font-medium truncate">
                                        {p.brand} · {p.sport_type}
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setIsCompareOpen(false);
                                          openProductDetail(p);
                                        }}
                                        className="text-left font-bold text-slate-900 text-sm leading-snug hover:text-[#d11a2a] transition-colors line-clamp-2"
                                      >
                                        {p.name}
                                      </button>
                                      {(isBestPrice || isBestRated) && (
                                        <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold pt-0.5">
                                          {isBestPrice && <span className="text-emerald-700">Lowest Price</span>}
                                          {isBestPrice && isBestRated && <span className="text-slate-300">·</span>}
                                          {isBestRated && <span className="text-amber-700">Top Rated</span>}
                                        </div>
                                      )}
                                    </div>

                                    <div className="flex items-center gap-2 pt-1">
                                      {p.stock === 0 ? (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setIsCompareOpen(false);
                                            handleOpenNotifyModal(p);
                                          }}
                                          className="flex-1 py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1 whitespace-nowrap"
                                        >
                                          <BellRing className="w-3.5 h-3.5" />
                                          Notify Me
                                        </button>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() => handleAddToCart(p, { openDrawer: true })}
                                          className="flex-1 py-2 px-3 bg-[#d11a2a] hover:bg-[#b51523] text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap"
                                        >
                                          Add to Bag
                                        </button>
                                      )}
                                      <button
                                        type="button"
                                        onClick={() => toggleWishlist(p)}
                                        aria-label={isWish ? 'Remove from wishlist' : 'Save to wishlist'}
                                        className={`p-2 rounded-lg border transition-colors ${
                                          isWish
                                            ? 'border-rose-200 bg-rose-50 text-[#d11a2a]'
                                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                                        }`}
                                      >
                                        <Heart className={`w-3.5 h-3.5 ${isWish ? 'fill-[#d11a2a]' : ''}`} />
                                      </button>
                                    </div>
                                  </div>
                                </th>
                              );
                            })}
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                          {/* PRICING & AVAILABILITY */}
                          <tr className="bg-slate-50">
                            <td
                              colSpan={compareProducts.length + 1}
                              className="py-2 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500"
                            >
                              Pricing &amp; Availability
                            </td>
                          </tr>

                          {showRow(priceVals) && (
                            <tr>
                              <td className="py-3 px-4 font-medium text-slate-500 sticky left-0 bg-white border-r border-slate-100">
                                Sale Price
                              </td>
                              {compareProducts.map((p, idx) => {
                                const isLowest = compareProducts.length >= 2 && priceDiffers && prices[idx] === minPrice;
                                return (
                                  <td
                                    key={p.id}
                                    className={`py-3 px-4 font-mono font-bold tabular-nums text-sm ${
                                      isLowest ? 'text-emerald-700 bg-emerald-50/40' : 'text-slate-900'
                                    }`}
                                  >
                                    {formatStorePrice(p.price_usd, p.price_inr, currency)}
                                  </td>
                                );
                              })}
                            </tr>
                          )}

                          {showRow(mrpVals) && (
                            <tr>
                              <td className="py-2.5 px-4 font-medium text-slate-500 sticky left-0 bg-white border-r border-slate-100">
                                Retail MRP &amp; Savings
                              </td>
                              {compareProducts.map((p) => {
                                const pct =
                                  p.mrp_usd > p.price_usd
                                    ? Math.round(((p.mrp_usd - p.price_usd) / p.mrp_usd) * 100)
                                    : 0;
                                return (
                                  <td key={p.id} className="py-2.5 px-4 font-mono tabular-nums text-slate-600">
                                    {pct > 0 ? (
                                      <span>
                                        <span className="line-through text-slate-400">
                                          {formatStorePrice(p.mrp_usd, p.mrp_inr, currency)}
                                        </span>{' '}
                                        <span className="font-sans font-semibold text-emerald-700">Save {pct}%</span>
                                      </span>
                                    ) : (
                                      'Standard Retail Price'
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          )}

                          {showRow(stockVals) && (
                            <tr>
                              <td className="py-2.5 px-4 font-medium text-slate-500 sticky left-0 bg-white border-r border-slate-100">
                                Availability
                              </td>
                              {compareProducts.map((p) => (
                                <td key={p.id} className="py-2.5 px-4 font-medium tabular-nums">
                                  <span
                                    className={
                                      p.stock === 0
                                        ? 'text-rose-600 font-semibold'
                                        : p.stock <= 5
                                        ? 'text-amber-700 font-semibold'
                                        : 'text-emerald-700'
                                    }
                                  >
                                    {p.stock === 0 ? 'Out of Stock' : `${p.stock} units in stock`}
                                  </span>
                                </td>
                              ))}
                            </tr>
                          )}

                          {showRow(ratingVals) && (
                            <tr>
                              <td className="py-2.5 px-4 font-medium text-slate-500 sticky left-0 bg-white border-r border-slate-100">
                                Customer Rating
                              </td>
                              {compareProducts.map((p, idx) => {
                                const r = ratings[idx];
                                const isTop = compareProducts.length >= 2 && ratingDiffers && r.count > 0 && r.rating === maxRating;
                                return (
                                  <td
                                    key={p.id}
                                    className={`py-2.5 px-4 tabular-nums ${isTop ? 'bg-amber-50/40 font-semibold text-slate-900' : 'text-slate-700'}`}
                                  >
                                    {r.count > 0 ? (
                                      <span className="inline-flex items-center gap-1.5 font-mono">
                                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                        <span>{r.rating.toFixed(1)} / 5.0</span>
                                        <span className="text-slate-400 font-sans">({r.count})</span>
                                      </span>
                                    ) : (
                                      <span className="text-slate-400">No reviews yet</span>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          )}

                          {/* FEATURES & OPTIONS */}
                          <tr className="bg-slate-50">
                            <td
                              colSpan={compareProducts.length + 1}
                              className="py-2 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500"
                            >
                              Features &amp; Fit Options
                            </td>
                          </tr>

                          {showRow(brandVals) && (
                            <tr>
                              <td className="py-2.5 px-4 font-medium text-slate-500 sticky left-0 bg-white border-r border-slate-100">
                                Brand
                              </td>
                              {compareProducts.map((p) => (
                                <td key={p.id} className="py-2.5 px-4 font-semibold text-slate-900">
                                  {p.brand}
                                </td>
                              ))}
                            </tr>
                          )}

                          {showRow(sportVals) && (
                            <tr>
                              <td className="py-2.5 px-4 font-medium text-slate-500 sticky left-0 bg-white border-r border-slate-100">
                                Sport &amp; Category
                              </td>
                              {compareProducts.map((p) => (
                                <td key={p.id} className="py-2.5 px-4 text-slate-700">
                                  {p.domain} · {p.sport_type} · {p.category}
                                </td>
                              ))}
                            </tr>
                          )}

                          {showRow(sizeVals) && (
                            <tr>
                              <td className="py-2.5 px-4 font-medium text-slate-500 sticky left-0 bg-white border-r border-slate-100">
                                Sizes / Editions
                              </td>
                              {compareProducts.map((p) => (
                                <td key={p.id} className="py-2.5 px-4 text-slate-700 leading-relaxed">
                                  {(p.sizes || ['Standard']).join(', ')}
                                </td>
                              ))}
                            </tr>
                          )}

                          {showRow(handVals) && (
                            <tr>
                              <td className="py-2.5 px-4 font-medium text-slate-500 sticky left-0 bg-white border-r border-slate-100">
                                Handedness
                              </td>
                              {compareProducts.map((p) => (
                                <td key={p.id} className="py-2.5 px-4 text-slate-700">
                                  {p.handedness_options && p.handedness_options.length > 0
                                    ? p.handedness_options.join(', ')
                                    : 'Universal Fit'}
                                </td>
                              ))}
                            </tr>
                          )}

                          {showRow(knockVals) && (
                            <tr>
                              <td className="py-2.5 px-4 font-medium text-slate-500 sticky left-0 bg-white border-r border-slate-100">
                                Pro Machine Knocking
                              </td>
                              {compareProducts.map((p) => (
                                <td key={p.id} className="py-2.5 px-4 text-slate-700">
                                  {p.knocking_available ? (
                                    <span className="text-emerald-700 font-medium">
                                      Available (+
                                      {formatStorePrice(p.knocking_fee_usd || 15, p.knocking_fee_inr || 999, currency)})
                                    </span>
                                  ) : (
                                    <span className="text-slate-400">Not applicable</span>
                                  )}
                                </td>
                              ))}
                            </tr>
                          )}

                          {showRow(printVals) && (
                            <tr>
                              <td className="py-2.5 px-4 font-medium text-slate-500 sticky left-0 bg-white border-r border-slate-100">
                                Custom Name &amp; Number
                              </td>
                              {compareProducts.map((p) => (
                                <td key={p.id} className="py-2.5 px-4 text-slate-700">
                                  {p.custom_print_available ? (
                                    <span className="text-emerald-700 font-medium">Included Free</span>
                                  ) : (
                                    <span className="text-slate-400">Standard Finish</span>
                                  )}
                                </td>
                              ))}
                            </tr>
                          )}

                          {showRow(authVals) && (
                            <tr>
                              <td className="py-2.5 px-4 font-medium text-slate-500 sticky left-0 bg-white border-r border-slate-100">
                                Authenticity Serial
                              </td>
                              {compareProducts.map((p) => (
                                <td key={p.id} className="py-2.5 px-4 font-mono text-emerald-700">
                                  {p.authenticity_prefix || 'SL-GEAR'} Verified
                                </td>
                              ))}
                            </tr>
                          )}

                          {showRow(highlightVals) && (
                            <tr className="align-top">
                              <td className="py-3 px-4 font-medium text-slate-500 sticky left-0 bg-white border-r border-slate-100">
                                Key Highlights
                              </td>
                              {compareProducts.map((p) => (
                                <td key={p.id} className="py-3 px-4 text-slate-700">
                                  {p.highlights && p.highlights.length > 0 ? (
                                    <ul className="space-y-1">
                                      {p.highlights.map((hl, hIdx) => (
                                        <li key={hIdx} className="flex items-start gap-1.5">
                                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                          <span>{hl}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  ) : (
                                    <span className="text-slate-400">—</span>
                                  )}
                                </td>
                              ))}
                            </tr>
                          )}

                          {/* TECHNICAL SPECIFICATIONS */}
                          {allSpecKeys.length > 0 && (
                            <tr className="bg-slate-50">
                              <td
                                colSpan={compareProducts.length + 1}
                                className="py-2 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500"
                              >
                                Technical Specifications
                              </td>
                            </tr>
                          )}

                          {allSpecKeys.map((specKey) => {
                            const specValues = compareProducts.map((p) => p.specs?.[specKey] || '—');
                            if (!showRow(specValues)) return null;
                            const differs = rowHasDifference(specValues);
                            return (
                              <tr key={specKey}>
                                <td className="py-2.5 px-4 font-medium text-slate-500 sticky left-0 bg-white border-r border-slate-100">
                                  {specKey}
                                </td>
                                {compareProducts.map((p) => (
                                  <td
                                    key={p.id}
                                    className={`py-2.5 px-4 ${
                                      differs && compareProducts.length >= 2
                                        ? 'text-slate-900 font-semibold bg-amber-50/20'
                                        : 'text-slate-700'
                                    }`}
                                  >
                                    {p.specs?.[specKey] || '—'}
                                  </td>
                                ))}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* MULTI-SPORT & GAMES SIZE GUIDE MODAL */}
      {isSizeGuideOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[120] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-900">All-Sports &amp; Games Size &amp; Fit Guide</h3>
              <button onClick={() => setIsSizeGuideOpen(false)} className="text-slate-400 hover:text-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 pt-4 flex items-center gap-2 overflow-x-auto hide-scrollbar border-b border-slate-100 pb-3">
              {(
                [
                  { id: 'cricket', label: 'Cricket Bats & Pads' },
                  { id: 'balls', label: 'Team Balls' },
                  { id: 'racket', label: 'Racket & Grips' },
                  { id: 'apparel', label: 'Jerseys & Apparel' },
                  { id: 'indoor', label: 'Indoor & Board Games' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSizeGuideTab(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                    sizeGuideTab === tab.id
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {sizeGuideTab === 'cricket' && (
                <>
                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                          <th className="py-2.5 px-4">Bat Size</th>
                          <th className="py-2.5 px-4">Player Height</th>
                          <th className="py-2.5 px-4">Typical Age</th>
                          <th className="py-2.5 px-4">Blade + Handle Length</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {CRICKET_BAT_SIZE_GUIDE.map((row) => (
                          <tr key={row.size}>
                            <td className="py-2.5 px-4 font-semibold text-slate-900">{row.size}</td>
                            <td className="py-2.5 px-4 text-slate-700 font-mono">{row.height}</td>
                            <td className="py-2.5 px-4 text-slate-600">{row.age}</td>
                            <td className="py-2.5 px-4 text-slate-700 font-mono">{row.length}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-xs text-slate-500">
                    Batting pads &amp; gloves: Measure from center of knee cap to instep (Adult Regular fits 15.5&quot;–17&quot;, Youth fits 13.5&quot;–15&quot;).
                  </p>
                </>
              )}

              {sizeGuideTab === 'balls' && (
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                        <th className="py-2.5 px-4">Sport</th>
                        <th className="py-2.5 px-4">Official Sizes</th>
                        <th className="py-2.5 px-4">Age &amp; Circumference Standard</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {TEAM_BALL_SIZE_GUIDE.map((row) => (
                        <tr key={row.sport}>
                          <td className="py-2.5 px-4 font-semibold text-slate-900">{row.sport}</td>
                          <td className="py-2.5 px-4 text-slate-700 font-mono">{row.size}</td>
                          <td className="py-2.5 px-4 text-slate-600">{row.spec}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {sizeGuideTab === 'racket' && (
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                        <th className="py-2.5 px-4">Court Sport</th>
                        <th className="py-2.5 px-4">Weight / Grip Spec</th>
                        <th className="py-2.5 px-4">Recommended Fit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {RACKET_GRIP_SIZE_GUIDE.map((row) => (
                        <tr key={row.sport}>
                          <td className="py-2.5 px-4 font-semibold text-slate-900">{row.sport}</td>
                          <td className="py-2.5 px-4 text-slate-700 font-mono">{row.size}</td>
                          <td className="py-2.5 px-4 text-slate-600">{row.spec}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {sizeGuideTab === 'apparel' && (
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                        <th className="py-2.5 px-4">Size</th>
                        <th className="py-2.5 px-4">Chest</th>
                        <th className="py-2.5 px-4">Waist</th>
                        <th className="py-2.5 px-4">Cut / Fit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {APPAREL_SIZE_GUIDE.map((row) => (
                        <tr key={row.size}>
                          <td className="py-2.5 px-4 font-semibold text-slate-900">{row.size}</td>
                          <td className="py-2.5 px-4 text-slate-700 font-mono">{row.chest}</td>
                          <td className="py-2.5 px-4 text-slate-700 font-mono">{row.waist}</td>
                          <td className="py-2.5 px-4 text-slate-600">{row.fit}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {sizeGuideTab === 'indoor' && (
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                        <th className="py-2.5 px-4">Game</th>
                        <th className="py-2.5 px-4">Tournament Format</th>
                        <th className="py-2.5 px-4">Official Dimensions &amp; Spec</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {INDOOR_BOARD_SIZE_GUIDE.map((row) => (
                        <tr key={row.game}>
                          <td className="py-2.5 px-4 font-semibold text-slate-900">{row.game}</td>
                          <td className="py-2.5 px-4 text-slate-700 font-mono">{row.edition}</td>
                          <td className="py-2.5 px-4 text-slate-600">{row.spec}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* AUTHENTICITY HOLOGRAM VERIFIER MODAL */}
      {isVerifyModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[120] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-900">Verify Gear Authenticity Serial</h3>
              <button onClick={() => setIsVerifyModalOpen(false)} className="text-slate-400 hover:text-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleVerifySerial} className="p-6 space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Verify authenticity codes for Cricket, Team Sports, Racket &amp; Court, Fitness, Indoor Games, Esports gear, and registered Custom Brands.
              </p>
              <input
                type="text"
                value={serialQuery}
                onChange={(e) => setSerialQuery(e.target.value.toUpperCase())}
                placeholder="Enter product serial or SKU code"
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg font-mono"
              />
              {serialResult && (
                <div
                  className={`p-3.5 rounded-xl border text-xs ${
                    serialResult.valid
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}
                >
                  <div className="font-semibold">{serialResult.message}</div>
                  {serialResult.product && (
                    <div className="mt-1 text-emerald-700">Matched Catalog SKU: {serialResult.product.sku}</div>
                  )}
                </div>
              )}
              <button
                type="submit"
                className="w-full py-2.5 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800"
              >
                Verify Serial Number
              </button>
            </form>
          </div>
        </div>
      )}
      {/* NOTIFY ME BACK-IN-STOCK SIGNUP MODAL */}
      {notifyModalProduct && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[130] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BellRing className="w-4 h-4 text-[#d11a2a]" />
                <h3 className="font-bold text-base text-slate-900">Back-in-Stock Email Alert</h3>
              </div>
              <button
                type="button"
                onClick={() => setNotifyModalProduct(null)}
                className="text-slate-400 hover:text-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={(e) => handleSubmitRestockAlert(e, notifyModalProduct)} className="p-6 space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <img
                  src={notifyModalProduct.image_url}
                  alt={notifyModalProduct.name}
                  referrerPolicy="no-referrer"
                  className="w-14 h-12 rounded-lg object-cover bg-white border border-slate-200 shrink-0"
                />
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 truncate">{notifyModalProduct.name}</div>
                  <div className="text-[11px] text-slate-500 font-mono truncate">
                    {notifyModalProduct.brand} · SKU {notifyModalProduct.sku}
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Email Address for Restock Notification *
                </label>
                <input
                  type="email"
                  required
                  value={notifyEmailInput}
                  onChange={(e) => setNotifyEmailInput(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d11a2a]"
                />
                <p className="text-[11px] text-slate-500">
                  We will send a single email notification and log your request for our Store Admin inventory team.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setNotifyModalProduct(null)}
                  className="px-4 py-2 text-xs font-semibold border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingNotify}
                  className="px-5 py-2 text-xs font-semibold bg-[#d11a2a] hover:bg-[#b51523] disabled:bg-slate-400 text-white rounded-lg"
                >
                  {submittingNotify ? 'Subscribing...' : 'Notify Me'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK BUY 1-CLICK CHECKOUT MODAL */}
      {quickBuyProduct && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[135] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-950 text-white shrink-0">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <div>
                  <h3 className="font-bold text-base">1-Click Quick Buy</h3>
                  <p className="text-[11px] text-slate-300">Express single-item checkout with saved payment methods</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setQuickBuyProduct(null);
                  setQuickBuyConfirmedOrder(null);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {quickBuyConfirmedOrder ? (
              <div className="p-6 overflow-y-auto space-y-5">
                <div className="p-5 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold text-base">
                    <PackageCheck className="w-5 h-5" />
                    Quick Order {quickBuyConfirmedOrder.order_number} Confirmed
                  </div>
                  <p className="text-xs text-emerald-700 leading-relaxed">
                    Express order placed for {quickBuyConfirmedOrder.customer_name} via{' '}
                    <span className="font-semibold">{formatPaymentMethodLabel(quickBuyConfirmedOrder.payment_method)}</span>
                    {' · '}
                    <span className="font-semibold">{formatOrderPaymentStatusLabel(quickBuyConfirmedOrder.payment_status)}</span>.
                  </p>
                  {(quickBuyConfirmedOrder.receiving_account_label || quickBuyConfirmedOrder.payment_reference || quickBuyConfirmedOrder.payer_bank_name) && (
                    <div className="pt-2 border-t border-emerald-200/70 text-[11px] text-emerald-900 space-y-0.5">
                      {quickBuyConfirmedOrder.receiving_account_label && (
                        <div>Receiving A/C: <span className="font-semibold">{quickBuyConfirmedOrder.receiving_account_label}</span></div>
                      )}
                      {quickBuyConfirmedOrder.payment_reference && (
                        <div>Ref / UTR: <span className="font-mono font-semibold">{quickBuyConfirmedOrder.payment_reference}</span></div>
                      )}
                      {quickBuyConfirmedOrder.payer_bank_name && (
                        <div>Sender Bank: <span className="font-semibold">{quickBuyConfirmedOrder.payer_bank_name}</span></div>
                      )}
                    </div>
                  )}
                </div>

                <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 text-xs">
                  {quickBuyConfirmedOrder.items.map((item, idx) => (
                    <div key={idx} className="p-3.5 flex justify-between gap-3">
                      <div>
                        <div className="font-semibold text-slate-900">
                          {item.quantity}x {item.name}
                        </div>
                        <div className="text-slate-500 mt-0.5">
                          Size: {item.selected_size}
                          {item.selected_hand ? ` · ${item.selected_hand}` : ''}
                          {item.include_knocking ? ' · + Knocking' : ''}
                        </div>
                      </div>
                      <div className="font-mono font-semibold text-slate-900 shrink-0 tabular-nums">
                        {formatRawStoreAmount(item.unit_price * item.quantity, quickBuyConfirmedOrder.currency as StoreCurrency)}
                      </div>
                    </div>
                  ))}
                  <div className="p-3.5 flex justify-between font-bold text-sm text-slate-900 bg-slate-50">
                    <span>Total Paid / Due</span>
                    <span className="font-mono tabular-nums">
                      {formatRawStoreAmount(quickBuyConfirmedOrder.total, quickBuyConfirmedOrder.currency as StoreCurrency)}
                    </span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setQuickBuyProduct(null);
                      setTrackedOrderId(quickBuyConfirmedOrder.id);
                      setOrdersTab('track');
                      setIsOrdersOpen(true);
                    }}
                    className="flex-1 py-2.5 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800"
                  >
                    Track Shipment
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setQuickBuyProduct(null);
                      setQuickBuyConfirmedOrder(null);
                    }}
                    className="flex-1 py-2.5 text-xs font-semibold border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-6 overflow-y-auto space-y-5">
                {/* Item & Quick Options */}
                <div className="flex gap-3.5 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <img
                    src={quickBuyProduct.image_url}
                    alt={quickBuyProduct.name}
                    referrerPolicy="no-referrer"
                    className="w-20 h-16 rounded-lg object-cover bg-white border border-slate-200 shrink-0"
                  />
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 truncate">
                      {quickBuyProduct.brand} · {quickBuyProduct.category}
                    </div>
                    <div className="text-sm font-bold text-slate-900 leading-snug line-clamp-2">
                      {quickBuyProduct.name}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {quickBuyProduct.sizes && quickBuyProduct.sizes.length > 0 && (
                        <select
                          value={quickBuySize}
                          onChange={(e) => setQuickBuySize(e.target.value)}
                          aria-label="Select size"
                          className="px-2 py-1 text-xs border border-slate-200 rounded-md bg-white text-slate-800"
                        >
                          {quickBuyProduct.sizes.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      )}
                      {quickBuyProduct.handedness_options && quickBuyProduct.handedness_options.length > 0 && (
                        <select
                          value={quickBuyHand}
                          onChange={(e) => setQuickBuyHand(e.target.value)}
                          aria-label="Select handedness"
                          className="px-2 py-1 text-xs border border-slate-200 rounded-md bg-white text-slate-800"
                        >
                          {quickBuyProduct.handedness_options.map((h) => (
                            <option key={h} value={h}>{h}</option>
                          ))}
                        </select>
                      )}
                      <div className="flex items-center border border-slate-200 rounded-md bg-white ml-auto">
                        <button
                          type="button"
                          onClick={() => setQuickBuyQty((q) => Math.max(1, q - 1))}
                          className="px-2 py-1 text-slate-600 hover:bg-slate-50"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2.5 text-xs font-mono font-bold tabular-nums">{quickBuyQty}</span>
                        <button
                          type="button"
                          onClick={() => setQuickBuyQty((q) => Math.min(quickBuyProduct.stock, q + 1))}
                          className="px-2 py-1 text-slate-600 hover:bg-slate-50"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    {quickBuyProduct.knocking_available && (
                      <label className="flex items-center gap-2 text-xs text-slate-700 pt-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={quickBuyKnocking}
                          onChange={(e) => setQuickBuyKnocking(e.target.checked)}
                          className="rounded border-slate-300 text-[#d11a2a] focus:ring-[#d11a2a]"
                        />
                        <span>
                          Add Pro Knocking (+{formatStorePrice(quickBuyProduct.knocking_fee_usd || 15, quickBuyProduct.knocking_fee_inr || 999, currency)})
                        </span>
                      </label>
                    )}
                  </div>
                </div>

                {/* Saved Payment Methods */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wide text-slate-600">
                      Saved Payment Method
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowAddQuickPaymentForm((v) => !v)}
                      className="text-xs font-semibold text-[#d11a2a] hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      {showAddQuickPaymentForm ? 'Cancel' : 'Add Saved Method'}
                    </button>
                  </div>

                  {showAddQuickPaymentForm && (
                    <form
                      onSubmit={handleSaveQuickPaymentMethod}
                      className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-3"
                    >
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                        {[
                          { id: 'stripe_card' as SavedPaymentProvider, label: 'Card (Stripe)' },
                          { id: 'razorpay_upi' as SavedPaymentProvider, label: 'Razorpay UPI' },
                          { id: 'bank_transfer' as SavedPaymentProvider, label: 'My Bank A/C' },
                          { id: 'upi' as SavedPaymentProvider, label: 'Direct UPI' },
                        ].map((opt) => (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setNewPayProvider(opt.id)}
                            className={`px-2 py-2 text-[11px] font-semibold rounded-lg border transition-colors whitespace-nowrap ${
                              newPayProvider === opt.id
                                ? 'bg-slate-900 border-slate-900 text-white'
                                : 'bg-white border-slate-200 text-slate-700'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>

                      {newPayProvider === 'stripe_card' && (
                        <div className="grid grid-cols-3 gap-2">
                          <select
                            value={newPayBrand}
                            onChange={(e) => setNewPayBrand(e.target.value)}
                            className="px-2.5 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                          >
                            <option value="Visa">Visa</option>
                            <option value="Mastercard">Mastercard</option>
                            <option value="Amex">Amex</option>
                            <option value="RuPay">RuPay</option>
                          </select>
                          <input
                            type="text"
                            maxLength={4}
                            value={newPayLast4}
                            onChange={(e) => setNewPayLast4(e.target.value.replace(/\D/g, '').slice(0, 4))}
                            placeholder="Last 4 (4242)"
                            className="px-2.5 py-2 text-xs border border-slate-200 rounded-lg bg-white font-mono"
                          />
                          <input
                            type="text"
                            maxLength={5}
                            value={newPayExpiry}
                            onChange={(e) => setNewPayExpiry(e.target.value)}
                            placeholder="MM/YY"
                            className="px-2.5 py-2 text-xs border border-slate-200 rounded-lg bg-white font-mono"
                          />
                        </div>
                      )}

                      {(newPayProvider === 'razorpay_upi' || newPayProvider === 'upi') && (
                        <input
                          type="text"
                          value={newPayUpi}
                          onChange={(e) => setNewPayUpi(e.target.value)}
                          placeholder="UPI ID e.g. player@okaxis"
                          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white font-mono"
                        />
                      )}

                      {newPayProvider === 'bank_transfer' && (
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={newPayBankName}
                            onChange={(e) => setNewPayBankName(e.target.value)}
                            placeholder="Your Bank (e.g. HDFC, Chase) *"
                            className="px-2.5 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                          />
                          <input
                            type="text"
                            maxLength={4}
                            value={newPayLast4}
                            onChange={(e) => setNewPayLast4(e.target.value.replace(/\D/g, '').slice(0, 4))}
                            placeholder="A/C Last 4 (optional)"
                            className="px-2.5 py-2 text-xs border border-slate-200 rounded-lg bg-white font-mono"
                          />
                        </div>
                      )}

                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] text-slate-500">
                          Stores masked reference only (no full bank or card numbers stored).
                        </span>
                        <button
                          type="submit"
                          disabled={savingQuickMethod}
                          className="px-3.5 py-1.5 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800 whitespace-nowrap"
                        >
                          {savingQuickMethod ? 'Saving...' : 'Save Method'}
                        </button>
                      </div>
                    </form>
                  )}

                  <div className="space-y-2">
                    {savedPaymentMethods.map((m) => {
                      const active = selectedQuickMethodId === m.id;
                      return (
                        <div
                          key={m.id}
                          onClick={() => handleSetDefaultQuickMethod(m.id)}
                          className={`p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                            active
                              ? 'border-[#d11a2a] bg-rose-50/40'
                              : 'border-slate-200 bg-white hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                active ? 'bg-[#d11a2a] text-white' : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {m.provider === 'stripe_card' ? (
                                <CreditCard className="w-4 h-4" />
                              ) : m.provider === 'razorpay_upi' || m.provider === 'upi' ? (
                                <Smartphone className="w-4 h-4" />
                              ) : m.provider === 'bank_transfer' ? (
                                <Landmark className="w-4 h-4" />
                              ) : (
                                <Banknote className="w-4 h-4" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-slate-900 truncate flex items-center gap-1.5">
                                <span>{m.label}</span>
                                {m.is_default && (
                                  <span className="text-[10px] font-semibold text-emerald-700 uppercase">Default</span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-500">
                                {m.provider === 'stripe_card'
                                  ? `Stripe Card${m.expiry ? ` · Exp ${m.expiry}` : ''}`
                                  : m.provider === 'razorpay_upi'
                                  ? activeRazorpayAccount
                                    ? `Razorpay (${activeRazorpayAccount.label})`
                                    : 'Razorpay Instant UPI'
                                  : m.provider === 'upi'
                                  ? 'Direct UPI Transfer to Admin Bank'
                                  : m.provider === 'bank_transfer'
                                  ? 'Direct Bank-to-Admin-Bank Transfer'
                                  : 'Pay on delivery courier verification'}
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            aria-label="Remove saved payment method"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteQuickMethod(m.id);
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}

                    {activeBankAccounts.length > 0 && selectedBankAccount && (
                      <div
                        onClick={() => setSelectedQuickMethodId('bank-transfer-direct')}
                        className={`p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                          selectedQuickMethodId === 'bank-transfer-direct'
                            ? 'border-[#d11a2a] bg-rose-50/40'
                            : 'border-slate-200 bg-white hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                              selectedQuickMethodId === 'bank-transfer-direct'
                                ? 'bg-[#d11a2a] text-white'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            <Landmark className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-900">Direct Bank Transfer (to Admin A/C)</div>
                            <div className="text-[11px] text-slate-500 truncate">
                              {selectedBankAccount.bank_name || selectedBankAccount.label} · {selectedBankAccount.account_holder_name}
                            </div>
                          </div>
                        </div>
                        {selectedQuickMethodId === 'bank-transfer-direct' && (
                          <Check className="w-4 h-4 text-[#d11a2a] shrink-0" />
                        )}
                      </div>
                    )}

                    {syntheticUpiQrAccount && (
                      <div
                        onClick={() => setSelectedQuickMethodId('upi-direct')}
                        className={`p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                          selectedQuickMethodId === 'upi-direct'
                            ? 'border-[#d11a2a] bg-rose-50/40'
                            : 'border-slate-200 bg-white hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                              selectedQuickMethodId === 'upi-direct'
                                ? 'bg-[#d11a2a] text-white'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            <Smartphone className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-900">Direct Bank UPI &amp; Scan QR</div>
                            <div className="text-[11px] text-slate-500 truncate">
                              Scan QR or pay {syntheticUpiQrAccount.upi_id || syntheticUpiQrAccount.label} directly
                            </div>
                          </div>
                        </div>
                        {selectedQuickMethodId === 'upi-direct' && (
                          <Check className="w-4 h-4 text-[#d11a2a] shrink-0" />
                        )}
                      </div>
                    )}

                    {activePaypalAccounts.length > 0 && selectedPaypalAccount && (
                      <div
                        onClick={() => setSelectedQuickMethodId('paypal-direct')}
                        className={`p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                          selectedQuickMethodId === 'paypal-direct'
                            ? 'border-[#d11a2a] bg-rose-50/40'
                            : 'border-slate-200 bg-white hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                              selectedQuickMethodId === 'paypal-direct'
                                ? 'bg-[#d11a2a] text-white'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            <Link2 className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-900">PayPal &amp; Scan QR</div>
                            <div className="text-[11px] text-slate-500 truncate">
                              {selectedPaypalAccount.paypal_handle || selectedPaypalAccount.label}
                            </div>
                          </div>
                        </div>
                        {selectedQuickMethodId === 'paypal-direct' && (
                          <Check className="w-4 h-4 text-[#d11a2a] shrink-0" />
                        )}
                      </div>
                    )}

                    {activeCustomQrAccounts.length > 0 && selectedCustomQrAccount && (
                      <div
                        onClick={() => setSelectedQuickMethodId('custom-qr-direct')}
                        className={`p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                          selectedQuickMethodId === 'custom-qr-direct'
                            ? 'border-[#d11a2a] bg-rose-50/40'
                            : 'border-slate-200 bg-white hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                              selectedQuickMethodId === 'custom-qr-direct'
                                ? 'bg-[#d11a2a] text-white'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            <QrCode className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-900">Merchant Payment QR</div>
                            <div className="text-[11px] text-slate-500 truncate">
                              {selectedCustomQrAccount.label} · {selectedCustomQrAccount.account_holder_name}
                            </div>
                          </div>
                        </div>
                        {selectedQuickMethodId === 'custom-qr-direct' && (
                          <Check className="w-4 h-4 text-[#d11a2a] shrink-0" />
                        )}
                      </div>
                    )}

                    <div
                      onClick={() => setSelectedQuickMethodId('cod-instant')}
                      className={`p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                        selectedQuickMethodId === 'cod-instant'
                          ? 'border-[#d11a2a] bg-rose-50/40'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            selectedQuickMethodId === 'cod-instant'
                              ? 'bg-[#d11a2a] text-white'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          <Banknote className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900">Cash on Delivery (Express)</div>
                          <div className="text-[11px] text-slate-500">Pay upon delivery — zero pre-registration needed</div>
                        </div>
                      </div>
                      {selectedQuickMethodId === 'cod-instant' && (
                        <Check className="w-4 h-4 text-[#d11a2a] shrink-0" />
                      )}
                    </div>
                  </div>

                  {/* Inline Admin Bank / Direct UPI / PayPal / Custom QR Details inside Quick Buy */}
                  {(selectedQuickMethodId === 'bank-transfer-direct' ||
                    savedPaymentMethods.find((m) => m.id === selectedQuickMethodId)?.provider === 'bank_transfer') &&
                    selectedBankAccount && (
                      <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2.5 text-xs">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-slate-900 flex items-center gap-1.5">
                            <Landmark className="w-3.5 h-3.5 text-[#d11a2a]" />
                            Send to Admin Bank A/C
                          </span>
                          {activeBankAccounts.length > 1 && (
                            <select
                              value={selectedBankAccount.id}
                              onChange={(e) => setSelectedBankAccountId(e.target.value)}
                              className="px-2 py-1 text-[11px] border border-slate-200 rounded-md bg-white"
                            >
                              {activeBankAccounts.map((acc) => (
                                <option key={acc.id} value={acc.id}>
                                  {acc.label} ({acc.currency_scope})
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                        {(selectedBankAccount.qr_code_url || selectedBankAccount.upi_id || selectedBankAccount.qr_payload) && (
                          <CheckoutQrCard
                            account={selectedBankAccount}
                            amount={quickBuyTotals.total}
                            inrAmount={currency === 'INR' ? quickBuyTotals.total : quickBuyProduct.price_inr * quickBuyQty}
                            currency={currency}
                            note={`Quick Buy ${quickBuyProduct.name}`}
                            copiedField={copiedBankField}
                            onCopy={handleCopyBankDetail}
                          />
                        )}
                        <div className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-1">
                          <div className="flex justify-between gap-2">
                            <span className="text-slate-500">Holder / Bank:</span>
                            <span className="font-semibold text-slate-900 text-right">
                              {selectedBankAccount.account_holder_name} · {selectedBankAccount.bank_name || selectedBankAccount.label}
                            </span>
                          </div>
                          {selectedBankAccount.account_number && (
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-slate-500">A/C #:</span>
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono font-bold text-slate-900">{selectedBankAccount.account_number}</span>
                                <button
                                  type="button"
                                  onClick={() => handleCopyBankDetail('A/C', selectedBankAccount.account_number || '')}
                                  className="text-[11px] font-semibold text-[#d11a2a] hover:underline"
                                >
                                  {copiedBankField === 'A/C' ? 'Copied' : 'Copy'}
                                </button>
                              </div>
                            </div>
                          )}
                          {selectedBankAccount.ifsc_or_routing && (
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-slate-500">IFSC / Routing:</span>
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono font-bold text-slate-900">{selectedBankAccount.ifsc_or_routing}</span>
                                <button
                                  type="button"
                                  onClick={() => handleCopyBankDetail('IFSC', selectedBankAccount.ifsc_or_routing || '')}
                                  className="text-[11px] font-semibold text-[#d11a2a] hover:underline"
                                >
                                  {copiedBankField === 'IFSC' ? 'Copied' : 'Copy'}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <input
                            type="text"
                            placeholder="Your Bank Name"
                            value={payerBankName}
                            onChange={(e) => setPayerBankName(e.target.value)}
                            className="px-2.5 py-2 border border-slate-200 rounded-lg bg-white text-xs"
                          />
                          <input
                            type="text"
                            placeholder="UTR / Transfer Ref # *"
                            value={bankTransferRef}
                            onChange={(e) => setBankTransferRef(e.target.value)}
                            className="px-2.5 py-2 border border-slate-200 rounded-lg bg-white text-xs font-mono"
                          />
                        </div>
                      </div>
                    )}

                  {(selectedQuickMethodId === 'upi-direct' ||
                    savedPaymentMethods.find((m) => m.id === selectedQuickMethodId)?.provider === 'upi') &&
                    syntheticUpiQrAccount && (
                      <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2.5 text-xs">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-slate-900 flex items-center gap-1.5">
                            <Smartphone className="w-3.5 h-3.5 text-[#d11a2a]" />
                            Scan &amp; Pay Store UPI ({effectiveUpiPayeeName})
                          </span>
                          {activeUpiAccounts.length > 1 && (
                            <select
                              value={syntheticUpiQrAccount.id}
                              onChange={(e) => setSelectedUpiAccountId(e.target.value)}
                              className="px-2 py-1 text-[11px] border border-slate-200 rounded-md bg-white"
                            >
                              {activeUpiAccounts.map((acc) => (
                                <option key={acc.id} value={acc.id}>
                                  {acc.label}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                        <CheckoutQrCard
                          account={syntheticUpiQrAccount}
                          amount={currency === 'INR' ? quickBuyTotals.total : quickBuyProduct.price_inr * quickBuyQty}
                          inrAmount={currency === 'INR' ? quickBuyTotals.total : quickBuyProduct.price_inr * quickBuyQty}
                          currency="INR"
                          note={`Quick Buy ${quickBuyProduct.name}`}
                          copiedField={copiedBankField}
                          onCopy={handleCopyBankDetail}
                        />
                        <input
                          type="text"
                          placeholder="Enter 12-digit UPI UTR Reference *"
                          value={bankTransferRef}
                          onChange={(e) => setBankTransferRef(e.target.value)}
                          className="w-full px-2.5 py-2 border border-slate-200 rounded-lg bg-white text-xs font-mono"
                        />
                      </div>
                    )}

                  {(selectedQuickMethodId === 'paypal-direct' ||
                    savedPaymentMethods.find((m) => m.id === selectedQuickMethodId)?.provider === 'paypal') &&
                    selectedPaypalAccount && (
                      <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2.5 text-xs">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-slate-900 flex items-center gap-1.5">
                            <Link2 className="w-3.5 h-3.5 text-[#d11a2a]" />
                            PayPal Quick Transfer
                          </span>
                          {activePaypalAccounts.length > 1 && (
                            <select
                              value={selectedPaypalAccount.id}
                              onChange={(e) => setSelectedPaypalAccountId(e.target.value)}
                              className="px-2 py-1 text-[11px] border border-slate-200 rounded-md bg-white"
                            >
                              {activePaypalAccounts.map((acc) => (
                                <option key={acc.id} value={acc.id}>
                                  {acc.label}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                        <CheckoutQrCard
                          account={selectedPaypalAccount}
                          amount={quickBuyTotals.total}
                          inrAmount={currency === 'INR' ? quickBuyTotals.total : quickBuyProduct.price_inr * quickBuyQty}
                          currency={currency}
                          note={`Quick Buy ${quickBuyProduct.name}`}
                          copiedField={copiedBankField}
                          onCopy={handleCopyBankDetail}
                        />
                        <input
                          type="text"
                          placeholder="Enter PayPal Transaction ID *"
                          value={bankTransferRef}
                          onChange={(e) => setBankTransferRef(e.target.value)}
                          className="w-full px-2.5 py-2 border border-slate-200 rounded-lg bg-white text-xs font-mono"
                        />
                      </div>
                    )}

                  {(selectedQuickMethodId === 'custom-qr-direct' ||
                    savedPaymentMethods.find((m) => m.id === selectedQuickMethodId)?.provider === 'custom_qr') &&
                    selectedCustomQrAccount && (
                      <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2.5 text-xs">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-slate-900 flex items-center gap-1.5">
                            <QrCode className="w-3.5 h-3.5 text-[#d11a2a]" />
                            Merchant Scan &amp; Pay QR
                          </span>
                          {activeCustomQrAccounts.length > 1 && (
                            <select
                              value={selectedCustomQrAccount.id}
                              onChange={(e) => setSelectedCustomQrAccountId(e.target.value)}
                              className="px-2 py-1 text-[11px] border border-slate-200 rounded-md bg-white"
                            >
                              {activeCustomQrAccounts.map((acc) => (
                                <option key={acc.id} value={acc.id}>
                                  {acc.label}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                        <CheckoutQrCard
                          account={selectedCustomQrAccount}
                          amount={quickBuyTotals.total}
                          inrAmount={currency === 'INR' ? quickBuyTotals.total : quickBuyProduct.price_inr * quickBuyQty}
                          currency={currency}
                          note={`Quick Buy ${quickBuyProduct.name}`}
                          copiedField={copiedBankField}
                          onCopy={handleCopyBankDetail}
                        />
                        <input
                          type="text"
                          placeholder="Enter Payment Reference / Receipt ID *"
                          value={bankTransferRef}
                          onChange={(e) => setBankTransferRef(e.target.value)}
                          className="w-full px-2.5 py-2 border border-slate-200 rounded-lg bg-white text-xs font-mono"
                        />
                      </div>
                    )}
                </div>

                {/* Delivery Destination Summary / Inline Editor */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#d11a2a]" />
                      Delivery Destination
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsEditingQuickAddress((v) => !v)}
                      className="text-xs font-semibold text-slate-700 hover:text-slate-900 underline"
                    >
                      {isEditingQuickAddress ? 'Done' : hasCompleteShippingAddress ? 'Edit' : 'Add Address'}
                    </button>
                  </div>

                  {!isEditingQuickAddress && hasCompleteShippingAddress ? (
                    <div className="text-xs text-slate-600 leading-relaxed">
                      <span className="font-semibold text-slate-900">{shippingForm.name}</span> · {shippingForm.phone}
                      <div className="truncate">
                        {shippingForm.line1}, {shippingForm.city}
                        {shippingForm.state ? `, ${shippingForm.state}` : ''} {shippingForm.postal_code}
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <input
                        type="text"
                        value={shippingForm.name}
                        onChange={(e) => setShippingForm({ ...shippingForm, name: e.target.value })}
                        placeholder="Full Name *"
                        className="px-2.5 py-2 border border-slate-200 rounded-lg bg-white"
                      />
                      <input
                        type="tel"
                        value={shippingForm.phone}
                        onChange={(e) => setShippingForm({ ...shippingForm, phone: e.target.value })}
                        placeholder="Phone Number *"
                        className="px-2.5 py-2 border border-slate-200 rounded-lg bg-white"
                      />
                      <input
                        type="email"
                        value={shippingForm.email}
                        onChange={(e) => setShippingForm({ ...shippingForm, email: e.target.value })}
                        placeholder="Email for tracking updates"
                        className="px-2.5 py-2 border border-slate-200 rounded-lg bg-white sm:col-span-2"
                      />
                      <input
                        type="text"
                        value={shippingForm.line1}
                        onChange={(e) => setShippingForm({ ...shippingForm, line1: e.target.value })}
                        placeholder="Street Address *"
                        className="px-2.5 py-2 border border-slate-200 rounded-lg bg-white sm:col-span-2"
                      />
                      <input
                        type="text"
                        value={shippingForm.city}
                        onChange={(e) => setShippingForm({ ...shippingForm, city: e.target.value })}
                        placeholder="City *"
                        className="px-2.5 py-2 border border-slate-200 rounded-lg bg-white"
                      />
                      <input
                        type="text"
                        value={shippingForm.postal_code}
                        onChange={(e) => setShippingForm({ ...shippingForm, postal_code: e.target.value })}
                        placeholder="Postal Code *"
                        className="px-2.5 py-2 border border-slate-200 rounded-lg bg-white"
                      />
                    </div>
                  )}
                </div>

                {/* Express Order Summary & 1-Click Submit */}
                <div className="pt-2 border-t border-slate-200 space-y-3">
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Item Subtotal ({quickBuyQty}x)</span>
                      <span className="font-mono tabular-nums">{formatRawStoreAmount(quickBuyTotals.subtotal, currency)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Shipping</span>
                      <span className="font-mono tabular-nums">
                        {quickBuyTotals.shipping === 0 ? 'FREE' : formatRawStoreAmount(quickBuyTotals.shipping, currency)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm font-bold text-slate-900 pt-1">
                      <span>Express Total</span>
                      <span className="font-mono tabular-nums">{formatRawStoreAmount(quickBuyTotals.total, currency)}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={quickBuyPlacing}
                    onClick={() => handleQuickBuySubmit()}
                    className="w-full py-3 bg-[#d11a2a] hover:bg-[#b51523] disabled:bg-slate-400 text-white text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    <Zap className="w-4 h-4 text-amber-300" />
                    {quickBuyPlacing
                      ? 'Completing Express Order...'
                      : selectedQuickMethodId === 'bank-transfer-direct' ||
                        selectedQuickMethodId === 'upi-direct' ||
                        selectedQuickMethodId === 'paypal-direct' ||
                        selectedQuickMethodId === 'custom-qr-direct' ||
                        savedPaymentMethods.find((m) => m.id === selectedQuickMethodId)?.provider === 'bank_transfer' ||
                        savedPaymentMethods.find((m) => m.id === selectedQuickMethodId)?.provider === 'upi' ||
                        savedPaymentMethods.find((m) => m.id === selectedQuickMethodId)?.provider === 'paypal' ||
                        savedPaymentMethods.find((m) => m.id === selectedQuickMethodId)?.provider === 'custom_qr'
                      ? `Submit Transfer Proof · ${formatRawStoreAmount(quickBuyTotals.total, currency)}`
                      : `1-Click Buy Now · ${formatRawStoreAmount(quickBuyTotals.total, currency)}`}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
