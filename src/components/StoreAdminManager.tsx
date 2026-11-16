import React, { useState, useEffect, useMemo } from 'react';
import {
  Package, Plus, Search, Edit, Trash2, Copy, RefreshCw, X,
  ShoppingBag, Tag, ShieldCheck, Truck, ArrowLeft,
  Star, Upload, MessageSquare, Award, Bell, AlertTriangle,
  Check, CheckCheck, Sliders, BellRing, Mail, Send, BarChart3,
  Landmark, CreditCard, Smartphone, Eye, EyeOff, QrCode, Link2, Download
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from './ToastContext';
import { StoreService, DEFAULT_STORE_ALERT_CONFIG } from '../services/StoreService';
import { StoreAnalyticsDashboard } from './StoreAnalyticsDashboard';
import { generateQrDataUrl, resizeQrImageFile, resolveAccountQrPayload } from '../utils/paymentQr';
import {
  STORE_BRANDS,
  STORE_PRIMARY_DOMAINS,
  STORE_CATEGORIES_BY_DOMAIN,
  STORE_SPORTS_BY_DOMAIN,
  ALL_STORE_SPORTS,
  STORE_PRESET_IMAGES,
} from '../data/storeCatalog';
import type {
  StoreProduct,
  StoreOrder,
  StoreCoupon,
  StoreReview,
  StoreBrand,
  StoreDomain,
  OrderStatus,
  StoreAlertConfig,
  StoreAlertScope,
  StoreStockAlert,
  StoreRestockRequest,
  StoreAnalyticsEvent,
  StorePayoutAccount,
  StorePayoutAccountType,
} from '../types/store';
import { formatCurrency } from '../utils/currency';

interface StoreAdminManagerProps {
  embedded?: boolean;
  onBack?: () => void;
  onOpenStorefront?: () => void;
}

const DEFAULT_FORM_STATE = (): Partial<StoreProduct> & {
  sizesText: string;
  highlightsText: string;
  specRows: { key: string; value: string }[];
  useHandedness: boolean;
} => ({
  sku: '',
  name: '',
  brand: 'SG',
  domain: 'Cricket',
  category: 'Bats',
  sport_type: 'Cricket',
  price_usd: 149,
  mrp_usd: 179,
  price_inr: 11999,
  mrp_inr: 14499,
  stock: 15,
  image_url: STORE_PRESET_IMAGES[0].url,
  description: '',
  sizesText: 'SH (Short Handle), LH (Long Handle), Harrow',
  highlightsText: 'Genuine manufacturer hologram seal\nTournament-grade quality tested',
  useHandedness: true,
  knocking_available: true,
  knocking_fee_usd: 15,
  knocking_fee_inr: 999,
  custom_print_available: false,
  authenticity_prefix: 'SG-PRO',
  featured: false,
  is_active: true,
  low_stock_threshold: undefined,
  rating: 0,
  review_count: 0,
  specRows: [
    { key: 'Willow Grade', value: 'Grade 1 English Willow' },
    { key: 'Weight', value: '1160g - 1200g' },
    { key: 'Sweet Spot', value: 'Mid-to-Low' },
    { key: 'Edge Thickness', value: '40mm' },
  ],
});

const SPEC_TEMPLATES: Record<string, { key: string; value: string }[]> = {
  'Cricket Bat': [
    { key: 'Willow Grade', value: 'Grade 1 English Willow' },
    { key: 'Weight', value: '1160g - 1200g' },
    { key: 'Grains', value: '8-12 Straight Grains' },
    { key: 'Sweet Spot', value: 'Mid-to-Low' },
    { key: 'Edge Thickness', value: '40mm' },
    { key: 'Handle', value: 'Sarawak Cane Round' },
  ],
  'Team Ball / Kit': [
    { key: 'Surface Material', value: 'Thermal-Bonded Microfiber PU' },
    { key: 'Bladder / Core', value: 'Butyl Pressure-Lock' },
    { key: 'Certification', value: 'FIFA / FIBA / FIVB Match Spec' },
    { key: 'Play Surface', value: 'Grass, Turf & Indoor Court' },
  ],
  'Racket / Paddle': [
    { key: 'Frame Material', value: 'High-Modulus Graphite / Carbon' },
    { key: 'Weight / Balance', value: '4U (82g) · Even Balance' },
    { key: 'String / Surface', value: 'Raw Carbon Friction / Pro Tension' },
    { key: 'Certification', value: 'BWF / ITF / USAPA / ITTF Spec' },
  ],
  'Fitness & Gym': [
    { key: 'Construction', value: 'Cast Iron / Neoprene / High-Density TPU' },
    { key: 'Load / Tolerance', value: 'Commercial Gym Grade' },
    { key: 'Finish', value: 'Anti-Slip Knurled Grip' },
  ],
  'Team Jersey': [
    { key: 'Fabric', value: '160 GSM Micro-Dot Dry-Fit' },
    { key: 'Printing', value: 'Full Dye Sublimation' },
    { key: 'UV Protection', value: 'UPF 40+' },
    { key: 'Fit', value: 'Athletic Cut' },
  ],
  'Indoor / Board Game': [
    { key: 'Board / Frame', value: 'Tournament Rosewood / Staunton / Sisal' },
    { key: 'Included Accessories', value: 'Coins, Pieces, Striker & Carry Case' },
    { key: 'Federation Spec', value: 'ICF / FIDE / WDF Tournament Size' },
  ],
  'Esports / Gaming': [
    { key: 'Connectivity', value: 'Low-Latency 2.4GHz Wireless & USB-C' },
    { key: 'Sensor / Switches', value: 'Hall-Effect / Optical Pro Switches' },
    { key: 'Compatibility', value: 'PC, Console & Mobile' },
  ],
};

export const StoreAdminManager: React.FC<StoreAdminManagerProps> = ({
  embedded = false,
  onBack,
  onOpenStorefront,
}) => {
  const { user, isAdmin } = useAuth();
  const { showToast } = useToast();

  const [subTab, setSubTab] = useState<'catalog' | 'analytics' | 'payouts' | 'brands' | 'alerts' | 'waitlist' | 'orders' | 'reviews' | 'coupons' | 'authenticity'>('catalog');
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [brands, setBrands] = useState<StoreBrand[]>([]);
  const [orders, setOrders] = useState<StoreOrder[]>([]);
  const [reviews, setReviews] = useState<StoreReview[]>([]);
  const [coupons, setCoupons] = useState<StoreCoupon[]>([]);
  const [alertConfig, setAlertConfig] = useState<StoreAlertConfig>(DEFAULT_STORE_ALERT_CONFIG);
  const [alertConfigDraft, setAlertConfigDraft] = useState<StoreAlertConfig>(DEFAULT_STORE_ALERT_CONFIG);
  const [stockAlerts, setStockAlerts] = useState<StoreStockAlert[]>([]);
  const [alertViewFilter, setAlertViewFilter] = useState<'open' | 'unread' | 'resolved' | 'all'>('open');
  const [restockRequests, setRestockRequests] = useState<StoreRestockRequest[]>([]);
  const [analyticsEvents, setAnalyticsEvents] = useState<StoreAnalyticsEvent[]>([]);
  const [payoutAccounts, setPayoutAccounts] = useState<StorePayoutAccount[]>([]);
  const [payoutFilterType, setPayoutFilterType] = useState<'all' | StorePayoutAccountType>('all');
  const [revealedAccountIds, setRevealedAccountIds] = useState<Record<string, boolean>>({});
  const [waitlistStatusFilter, setWaitlistStatusFilter] = useState<'waiting' | 'notified' | 'all'>('waiting');
  const [notifyingProductId, setNotifyingProductId] = useState<string | null>(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [restockDrafts, setRestockDrafts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [domainFilter, setDomainFilter] = useState<'All' | StoreDomain>('All');
  const [sportFilter, setSportFilter] = useState<string>('All');
  const [brandFilter, setBrandFilter] = useState<string>('All');
  const [stockFilter, setStockFilter] = useState<'all' | 'in' | 'low' | 'out'>('all');
  const [catalogSort, setCatalogSort] = useState<'newest' | 'units_desc' | 'rating_desc' | 'stock_asc' | 'price_desc' | 'price_asc'>('newest');
  const [orderStatusFilter, setOrderStatusFilter] = useState<'all' | OrderStatus>('all');
  const [reviewProductFilter, setReviewProductFilter] = useState<string>('all');
  const [reviewStarFilter, setReviewStarFilter] = useState<string>('all');

  // Product modal
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productForm, setProductForm] = useState(DEFAULT_FORM_STATE());
  const [customBrand, setCustomBrand] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [customSport, setCustomSport] = useState('');
  const [saveInlineCustomBrand, setSaveInlineCustomBrand] = useState(true);

  // Custom Brand modal
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
  const [editingBrandId, setEditingBrandId] = useState<string | null>(null);
  const [brandForm, setBrandForm] = useState<{
    name: string;
    domain: 'All' | StoreDomain;
    origin: string;
    authenticity_prefix: string;
    logo_url: string;
    description: string;
    is_active: boolean;
  }>({
    name: '',
    domain: 'All',
    origin: '',
    authenticity_prefix: '',
    logo_url: '',
    description: '',
    is_active: true,
  });

  // Coupon modal
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [couponForm, setCouponForm] = useState({
    code: '',
    discount_type: 'percent' as 'percent' | 'flat',
    value: 10,
    min_order_usd: 25,
    description: '',
    is_active: true,
  });

  // Order tracking inputs
  const [trackingDrafts, setTrackingDrafts] = useState<Record<string, string>>({});

  // Authenticity test input
  const [serialCheckInput, setSerialCheckInput] = useState('');

  // Payout / Bank account modal
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [editingPayoutId, setEditingPayoutId] = useState<string | null>(null);
  const [confirmAccountNumber, setConfirmAccountNumber] = useState('');
  const [qrGenerating, setQrGenerating] = useState(false);
  const [payoutForm, setPayoutForm] = useState<{
    label: string;
    account_type: StorePayoutAccountType;
    account_holder_name: string;
    bank_name: string;
    account_number: string;
    ifsc_or_routing: string;
    branch_name: string;
    upi_id: string;
    paypal_handle: string;
    payment_link: string;
    qr_payload: string;
    qr_code_url: string;
    razorpay_key_id: string;
    razorpay_account_id: string;
    currency_scope: 'INR' | 'USD' | 'ALL';
    instructions: string;
    is_active: boolean;
    is_primary: boolean;
  }>({
    label: '',
    account_type: 'bank_transfer',
    account_holder_name: '',
    bank_name: '',
    account_number: '',
    ifsc_or_routing: '',
    branch_name: '',
    upi_id: '',
    paypal_handle: '',
    payment_link: '',
    qr_payload: '',
    qr_code_url: '',
    razorpay_key_id: '',
    razorpay_account_id: '',
    currency_scope: 'ALL',
    instructions: 'Include your Store Order # in transfer remarks for fast dispatch verification.',
    is_active: true,
    is_primary: true,
  });

  // In-app delete confirmation modal (avoids iframe-blocked window.confirm)
  const [confirmModal, setConfirmModal] = useState<{
    title: string;
    message: string;
    confirmLabel: string;
    onConfirm: () => Promise<void>;
  } | null>(null);
  const [confirmBusy, setConfirmBusy] = useState(false);

  const runStockAlertScan = async (
    nextProducts: StoreProduct[],
    nextOrders: StoreOrder[],
    nextReviews: StoreReview[],
    nextConfig: StoreAlertConfig,
    currentAlerts: StoreStockAlert[],
    silent = false
  ) => {
    try {
      const result = await StoreService.syncAutomatedStockAlerts({
        products: nextProducts,
        orders: nextOrders,
        reviews: nextReviews,
        config: nextConfig,
        existingAlerts: currentAlerts,
        adminUserId: user?.uid,
      });
      setStockAlerts(result.alerts);
      if (result.newlyTriggered.length > 0) {
        setBannerDismissed(false);
        if (!silent && nextConfig.toast_on_trigger) {
          const top = result.newlyTriggered[0];
          const extra = result.newlyTriggered.length > 1 ? ` (+${result.newlyTriggered.length - 1} more)` : '';
          showToast(
            `Low-Stock Alert: ${top.product_name} (${top.current_stock} left, threshold ≤ ${top.threshold})${extra}`,
            'error'
          );
        }
      }
      return result;
    } catch (e) {
      console.warn('Automated stock alert scan failed:', e);
      return null;
    }
  };

  const loadAll = async () => {
    setLoading(true);
    try {
      const [prods, brds, ords, revs, coups, cfg, existingAlerts, restocks, events, payouts] = await Promise.all([
        StoreService.fetchProducts(true),
        StoreService.fetchBrands(true),
        StoreService.fetchOrders(undefined, true),
        StoreService.fetchAllReviews(),
        StoreService.fetchCoupons(true),
        StoreService.fetchAlertConfig(),
        StoreService.fetchStockAlerts(),
        StoreService.fetchRestockRequests(undefined, true),
        StoreService.fetchAnalyticsEvents(),
        StoreService.fetchPayoutAccounts(true),
      ]);
      setProducts(prods);
      setBrands(brds);
      setOrders(ords);
      setReviews(revs);
      setCoupons(coups);
      setAlertConfig(cfg);
      setAlertConfigDraft(cfg);
      setStockAlerts(existingAlerts);
      setRestockRequests(restocks);
      setAnalyticsEvents(events);
      setPayoutAccounts(payouts);
      const tDrafts: Record<string, string> = {};
      ords.forEach((o) => {
        if (o.tracking_number) tDrafts[o.id] = o.tracking_number;
      });
      setTrackingDrafts(tDrafts);

      await runStockAlertScan(prods, ords, revs, cfg, existingAlerts, false);
    } catch (e) {
      console.error('Failed to load store admin data:', e);
      showToast('Failed to sync store database.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && isAdmin) {
      loadAll();
    }
  }, [user, isAdmin]);

  const orderMetricsByProduct = useMemo(
    () => StoreService.computeProductOrderMetrics(orders),
    [orders]
  );

  const reviewMetricsByProduct = useMemo(
    () => StoreService.computeProductReviewMetrics(reviews),
    [reviews]
  );

  const productNameMap = useMemo(() => {
    const map: Record<string, StoreProduct> = {};
    products.forEach((p) => {
      map[p.id] = p;
    });
    return map;
  }, [products]);

  const metrics = useMemo(() => {
    const totalSkus = products.length;
    const publishedSkus = products.filter((p) => p.is_active !== false).length;
    const lowStock = products.filter((p) => p.stock > 0 && p.stock <= 5).length;
    const outOfStock = products.filter((p) => p.stock === 0).length;
    const activeOrders = orders.filter((o) => o.status !== 'cancelled');
    const totalOrders = orders.length;
    const pendingOrders = orders.filter((o) => o.status === 'pending' || o.status === 'processing').length;
    const totalUnitsOrdered = activeOrders.reduce(
      (sum, o) => sum + (o.items || []).reduce((s, it) => s + (Number(it.quantity) || 0), 0),
      0
    );
    const totalRevenueUsd = activeOrders.reduce((acc, o) => {
      if (o.currency === 'INR') return acc + (Number(o.total) || 0) / 83.5;
      return acc + (Number(o.total) || 0);
    }, 0);
    const totalReviews = reviews.length;
    const avgStoreRating =
      totalReviews > 0
        ? Number((reviews.reduce((sum, r) => sum + (Number(r.rating) || 0), 0) / totalReviews).toFixed(1))
        : 0;

    const openAlerts = stockAlerts.filter((a) => a.status !== 'resolved');
    const unreadAlerts = openAlerts.filter((a) => !a.is_read);

    return {
      totalSkus,
      publishedSkus,
      lowStock,
      outOfStock,
      openAlertCount: openAlerts.length,
      unreadAlertCount: unreadAlerts.length,
      totalOrders,
      pendingOrders,
      totalUnitsOrdered,
      totalRevenueUsd,
      totalReviews,
      avgStoreRating,
    };
  }, [products, orders, reviews, stockAlerts]);

  const openAlerts = useMemo(
    () => stockAlerts.filter((a) => a.status !== 'resolved'),
    [stockAlerts]
  );

  const unreadAlerts = useMemo(
    () => openAlerts.filter((a) => !a.is_read),
    [openAlerts]
  );

  const resolvedAlerts = useMemo(
    () => stockAlerts.filter((a) => a.status === 'resolved'),
    [stockAlerts]
  );

  const filteredAlerts = useMemo(() => {
    if (alertViewFilter === 'open') return openAlerts;
    if (alertViewFilter === 'unread') return unreadAlerts;
    if (alertViewFilter === 'resolved') return resolvedAlerts;
    return stockAlerts;
  }, [alertViewFilter, openAlerts, unreadAlerts, resolvedAlerts, stockAlerts]);

  const waitingRestockRequests = useMemo(
    () => restockRequests.filter((r) => r.status === 'waiting'),
    [restockRequests]
  );

  const notifiedRestockRequests = useMemo(
    () => restockRequests.filter((r) => r.status === 'notified'),
    [restockRequests]
  );

  const waitlistCountByProduct = useMemo(
    () => StoreService.computeWaitlistCountsByProduct(restockRequests),
    [restockRequests]
  );

  const filteredRestockRequests = useMemo(() => {
    if (waitlistStatusFilter === 'waiting') return waitingRestockRequests;
    if (waitlistStatusFilter === 'notified') return notifiedRestockRequests;
    return restockRequests;
  }, [waitlistStatusFilter, waitingRestockRequests, notifiedRestockRequests, restockRequests]);

  const groupedWaitingProducts = useMemo(() => {
    const groups = new Map<
      string,
      { productId: string; productName: string; sku: string; brand: string; count: number; latestAt: string }
    >();
    for (const r of waitingRestockRequests) {
      const prev = groups.get(r.product_id);
      if (prev) {
        prev.count += 1;
        if (new Date(r.created_at).getTime() > new Date(prev.latestAt).getTime()) {
          prev.latestAt = r.created_at;
        }
      } else {
        groups.set(r.product_id, {
          productId: r.product_id,
          productName: r.product_name,
          sku: r.sku,
          brand: r.brand,
          count: 1,
          latestAt: r.created_at,
        });
      }
    }
    return Array.from(groups.values()).sort((a, b) => b.count - a.count);
  }, [waitingRestockRequests]);

  const customBrandNames = useMemo(() => {
    const standardLower = new Set(STORE_BRANDS.map((b) => b.toLowerCase()));
    return brands
      .map((b) => b.name)
      .filter((name) => !standardLower.has(name.toLowerCase()));
  }, [brands]);

  const availableBrands = useMemo(() => {
    const set = new Set([
      ...STORE_BRANDS,
      ...brands.map((b) => b.name),
      ...products.map((p) => p.brand).filter(Boolean),
    ]);
    return Array.from(set).sort();
  }, [brands, products]);

  const availableSports = useMemo(() => {
    const set = new Set([
      ...ALL_STORE_SPORTS,
      ...products.map((p) => p.sport_type).filter(Boolean),
    ]);
    return Array.from(set).sort();
  }, [products]);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = products.filter((p) => {
      if (domainFilter !== 'All') {
        const domainMatch =
          p.domain === domainFilter ||
          (domainFilter === 'Team Sports' && p.domain === 'Sports') ||
          (domainFilter === 'Indoor & Board Games' && p.domain === 'Indoor & Games');
        if (!domainMatch) return false;
      }
      if (sportFilter !== 'All' && p.sport_type !== sportFilter) return false;
      if (brandFilter !== 'All' && p.brand !== brandFilter) return false;
      if (stockFilter === 'in' && p.stock <= 0) return false;
      if (stockFilter === 'low' && (p.stock <= 0 || p.stock > 5)) return false;
      if (stockFilter === 'out' && p.stock > 0) return false;
      if (q) {
        const hay = `${p.name} ${p.sku} ${p.brand} ${p.category} ${p.sport_type}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    return [...list].sort((a, b) => {
      if (catalogSort === 'units_desc') {
        const ua = orderMetricsByProduct[a.id]?.unitsOrdered || 0;
        const ub = orderMetricsByProduct[b.id]?.unitsOrdered || 0;
        return ub - ua;
      }
      if (catalogSort === 'rating_desc') {
        const ra = reviewMetricsByProduct[a.id]?.averageRating || 0;
        const rb = reviewMetricsByProduct[b.id]?.averageRating || 0;
        return rb - ra;
      }
      if (catalogSort === 'stock_asc') return a.stock - b.stock;
      if (catalogSort === 'price_desc') return b.price_usd - a.price_usd;
      if (catalogSort === 'price_asc') return a.price_usd - b.price_usd;
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    });
  }, [products, searchQuery, domainFilter, sportFilter, brandFilter, stockFilter, catalogSort, orderMetricsByProduct, reviewMetricsByProduct]);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => orderStatusFilter === 'all' || o.status === orderStatusFilter);
  }, [orders, orderStatusFilter]);

  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => {
      if (reviewProductFilter !== 'all' && r.product_id !== reviewProductFilter) return false;
      if (reviewStarFilter !== 'all' && String(r.rating) !== reviewStarFilter) return false;
      return true;
    });
  }, [reviews, reviewProductFilter, reviewStarFilter]);

  const openCreateModal = () => {
    setEditingProductId(null);
    setProductForm(DEFAULT_FORM_STATE());
    setCustomBrand('');
    setCustomCategory('');
    setCustomSport('');
    setSaveInlineCustomBrand(true);
    setIsProductModalOpen(true);
  };

  const openEditModal = (p: StoreProduct) => {
    setEditingProductId(p.id);
    const knownBrands = new Set([...STORE_BRANDS, ...brands.map((b) => b.name)]);
    const isKnownBrand = knownBrands.has(p.brand);
    setCustomBrand(isKnownBrand ? '' : p.brand);

    const domainCats = STORE_CATEGORIES_BY_DOMAIN[p.domain || 'Cricket'] || [];
    const isKnownCat = domainCats.includes(p.category);
    setCustomCategory(isKnownCat ? '' : p.category);

    const domainSports = STORE_SPORTS_BY_DOMAIN[p.domain || 'Cricket'] || ALL_STORE_SPORTS;
    const isKnownSport = domainSports.includes(p.sport_type) || ALL_STORE_SPORTS.includes(p.sport_type);
    setCustomSport(isKnownSport ? '' : p.sport_type);

    setSaveInlineCustomBrand(true);
    setProductForm({
      ...p,
      brand: isKnownBrand ? p.brand : 'Custom',
      category: isKnownCat ? p.category : '__custom__',
      sport_type: isKnownSport ? p.sport_type : '__custom__',
      sizesText: (p.sizes || []).join(', '),
      highlightsText: (p.highlights || []).join('\n'),
      useHandedness: Boolean(p.handedness_options && p.handedness_options.length > 0),
      specRows: Object.entries(p.specs || {}).map(([key, value]) => ({ key, value })),
    });
    setIsProductModalOpen(true);
  };

  const openCreateBrandModal = () => {
    setEditingBrandId(null);
    setBrandForm({
      name: '',
      domain: 'All',
      origin: '',
      authenticity_prefix: '',
      logo_url: '',
      description: '',
      is_active: true,
    });
    setIsBrandModalOpen(true);
  };

  const openEditBrandModal = (b: StoreBrand) => {
    setEditingBrandId(b.id);
    setBrandForm({
      name: b.name,
      domain: b.domain || 'All',
      origin: b.origin || '',
      authenticity_prefix: b.authenticity_prefix || '',
      logo_url: b.logo_url || '',
      description: b.description || '',
      is_active: b.is_active !== false,
    });
    setIsBrandModalOpen(true);
  };

  const handleBrandLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 256;
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          setBrandForm((prev) => ({ ...prev, logo_url: dataUrl }));
        }
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandForm.name.trim()) {
      showToast('Brand name is required.', 'error');
      return;
    }
    setSaving(true);
    try {
      const existing = editingBrandId ? brands.find((b) => b.id === editingBrandId) : undefined;
      await StoreService.saveBrand({
        id: editingBrandId || undefined,
        created_at: existing?.created_at,
        name: brandForm.name.trim(),
        domain: brandForm.domain,
        origin: brandForm.origin.trim(),
        authenticity_prefix: brandForm.authenticity_prefix.trim().toUpperCase(),
        logo_url: brandForm.logo_url.trim(),
        description: brandForm.description.trim(),
        is_active: brandForm.is_active,
      });
      showToast(editingBrandId ? `Updated custom brand "${brandForm.name.trim()}".` : `Added custom brand "${brandForm.name.trim()}".`);
      setIsBrandModalOpen(false);
      await loadAll();
    } catch (err: any) {
      console.error(err);
      showToast(err?.message || 'Failed to save custom brand.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBrand = (b: StoreBrand) => {
    setConfirmModal({
      title: 'Delete Custom Brand',
      message: `Remove "${b.name}" from custom brands? Existing products using this brand name will keep their label.`,
      confirmLabel: 'Delete Brand',
      onConfirm: async () => {
        await StoreService.deleteBrand(b.id);
        setBrands((prev) => prev.filter((item) => item.id !== b.id));
        showToast(`Deleted custom brand "${b.name}".`);
      },
    });
  };

  const handleDuplicateProduct = async (p: StoreProduct) => {
    try {
      setSaving(true);
      await StoreService.saveProduct({
        ...p,
        id: undefined,
        sku: `${p.sku}-COPY`,
        name: `${p.name} (Edition)`,
        rating: 0,
        review_count: 0,
      });
      showToast(`Duplicated "${p.name}".`);
      await loadAll();
    } catch (e: any) {
      showToast(e?.message || 'Failed to duplicate item.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 640;
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.78);
          setProductForm((prev) => ({ ...prev, image_url: dataUrl }));
        }
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const resolvedBrand = productForm.brand === 'Custom' ? customBrand.trim() : (productForm.brand || '').trim();
    const resolvedCategory =
      productForm.category === '__custom__' ? customCategory.trim() : (productForm.category || 'General').trim();
    const resolvedSport =
      productForm.sport_type === '__custom__' ? customSport.trim() : (productForm.sport_type || 'General Sport').trim();

    if (!productForm.name?.trim() || !resolvedBrand || !productForm.sku?.trim() || !resolvedCategory || !resolvedSport) {
      showToast('Name, Brand, SKU, Category, and Sport/Game are required.', 'error');
      return;
    }
    setSaving(true);
    try {
      const sizes = productForm.sizesText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const highlights = productForm.highlightsText
        .split('\n')
        .map((h) => h.trim())
        .filter(Boolean);
      const specs: Record<string, string> = {};
      productForm.specRows.forEach((row) => {
        if (row.key.trim() && row.value.trim()) {
          specs[row.key.trim()] = row.value.trim();
        }
      });

      const liveReviewStats = editingProductId ? reviewMetricsByProduct[editingProductId] : undefined;

      if (productForm.brand === 'Custom' && saveInlineCustomBrand) {
        const alreadyExists = [...STORE_BRANDS, ...brands.map((b) => b.name)].some(
          (name) => name.toLowerCase() === resolvedBrand.toLowerCase()
        );
        if (!alreadyExists) {
          await StoreService.saveBrand({
            name: resolvedBrand,
            domain: (productForm.domain as StoreDomain) || 'All',
            authenticity_prefix: productForm.authenticity_prefix?.trim().toUpperCase() || '',
            is_active: true,
          });
        }
      }

      const previousProduct = editingProductId ? productNameMap[editingProductId] : undefined;
      const savedProduct = await StoreService.saveProduct({
        id: editingProductId || undefined,
        sku: productForm.sku.trim().toUpperCase(),
        name: productForm.name.trim(),
        brand: resolvedBrand,
        domain: (productForm.domain as StoreDomain) || 'Team Sports',
        category: resolvedCategory,
        sport_type: resolvedSport,
        price_usd: Number(productForm.price_usd) || 0,
        mrp_usd: Number(productForm.mrp_usd) || Number(productForm.price_usd) || 0,
        price_inr: Number(productForm.price_inr) || 0,
        mrp_inr: Number(productForm.mrp_inr) || Number(productForm.price_inr) || 0,
        stock: Math.max(0, Number(productForm.stock) || 0),
        image_url: productForm.image_url || STORE_PRESET_IMAGES[0].url,
        description: productForm.description || '',
        sizes: sizes.length > 0 ? sizes : ['Standard'],
        handedness_options: productForm.useHandedness ? ['Right-Handed', 'Left-Handed'] : undefined,
        knocking_available: Boolean(productForm.knocking_available),
        knocking_fee_usd: Number(productForm.knocking_fee_usd) || 15,
        knocking_fee_inr: Number(productForm.knocking_fee_inr) || 999,
        custom_print_available: Boolean(productForm.custom_print_available),
        authenticity_prefix: productForm.authenticity_prefix?.trim() || 'SL-GEAR',
        specs,
        highlights,
        rating: liveReviewStats ? liveReviewStats.averageRating : 0,
        review_count: liveReviewStats ? liveReviewStats.reviewCount : 0,
        featured: Boolean(productForm.featured),
        is_active: productForm.is_active !== false,
        low_stock_threshold:
          productForm.low_stock_threshold !== undefined &&
          String(productForm.low_stock_threshold) !== '' &&
          Number(productForm.low_stock_threshold) >= 0
            ? Number(productForm.low_stock_threshold)
            : undefined,
      });

      if (previousProduct && previousProduct.stock === 0 && savedProduct.stock > 0) {
        await notifyWaitlistIfRestocked(previousProduct.stock, savedProduct);
      }

      showToast(editingProductId ? 'Gear updated in Store catalog.' : 'New gear published to Store.');
      setIsProductModalOpen(false);
      await loadAll();
    } catch (err: any) {
      console.error(err);
      showToast(err?.message || 'Failed to save product.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const notifyWaitlistIfRestocked = async (prevStock: number, updatedProduct: StoreProduct) => {
    if (prevStock > 0 || updatedProduct.stock <= 0) return 0;
    const waitingCount = waitlistCountByProduct[updatedProduct.id] || 0;
    if (waitingCount === 0) return 0;

    try {
      const authToken = await user?.getIdToken?.();
      const productUrl =
        typeof window !== 'undefined'
          ? `${window.location.origin}/?tab=store&product=${encodeURIComponent(updatedProduct.id)}`
          : undefined;
      const res = await StoreService.notifyRestockSubscribers({
        product: updatedProduct,
        requests: restockRequests,
        authToken,
        productUrl,
      });
      setRestockRequests(res.updatedRequests);
      if (res.notifiedCount > 0) {
        showToast(
          `Notified ${res.notifiedCount} waiting subscriber${res.notifiedCount === 1 ? '' : 's'} that ${updatedProduct.name} is back in stock${res.deliveredViaEmail ? ' (email sent)' : ''}.`
        );
      }
      return res.notifiedCount;
    } catch (e) {
      console.warn('Restock subscriber notification failed:', e);
      return 0;
    }
  };

  const handleNotifyProductWaitlist = async (product: StoreProduct) => {
    if (product.stock <= 0) {
      showToast(`Restock "${product.name}" above 0 units before dispatching back-in-stock alerts.`, 'error');
      return;
    }
    setNotifyingProductId(product.id);
    try {
      const authToken = await user?.getIdToken?.();
      const productUrl =
        typeof window !== 'undefined'
          ? `${window.location.origin}/?tab=store&product=${encodeURIComponent(product.id)}`
          : undefined;
      const res = await StoreService.notifyRestockSubscribers({
        product,
        requests: restockRequests,
        authToken,
        productUrl,
      });
      setRestockRequests(res.updatedRequests);
      if (res.notifiedCount > 0) {
        showToast(
          `Dispatched back-in-stock notice to ${res.notifiedCount} subscriber${res.notifiedCount === 1 ? '' : 's'}${res.deliveredViaEmail ? ' via email' : ''}.`
        );
      } else {
        showToast('No waiting subscribers left for this item.');
      }
    } catch {
      showToast('Failed to notify waitlist subscribers.', 'error');
    } finally {
      setNotifyingProductId(null);
    }
  };

  const handleDeleteRestockRequest = async (requestId: string) => {
    try {
      await StoreService.deleteRestockRequest(requestId);
      setRestockRequests((prev) => prev.filter((r) => r.id !== requestId));
      showToast('Waitlist entry removed.');
    } catch {
      showToast('Failed to remove waitlist entry.', 'error');
    }
  };

  const handleQuickStock = async (p: StoreProduct, delta: number) => {
    try {
      const nextStock = Math.max(0, p.stock + delta);
      const updatedProduct = { ...p, stock: nextStock };
      await StoreService.saveProduct(updatedProduct);
      const updatedProducts = products.map((item) => (item.id === p.id ? updatedProduct : item));
      setProducts(updatedProducts);
      showToast(`${p.sku} stock updated to ${nextStock}.`);
      if (p.stock === 0 && nextStock > 0) {
        await notifyWaitlistIfRestocked(p.stock, updatedProduct);
      }
      await runStockAlertScan(updatedProducts, orders, reviews, alertConfig, stockAlerts, false);
    } catch {
      showToast('Failed to update stock.', 'error');
    }
  };

  const handleToggleProductField = async (p: StoreProduct, field: 'is_active' | 'featured') => {
    try {
      const nextVal = !p[field];
      await StoreService.saveProduct({ ...p, [field]: nextVal });
      const updatedProducts = products.map((item) => (item.id === p.id ? { ...item, [field]: nextVal } : item));
      setProducts(updatedProducts);
      showToast(`Updated ${p.name}.`);
      await runStockAlertScan(updatedProducts, orders, reviews, alertConfig, stockAlerts, false);
    } catch {
      showToast('Failed to update product flag.', 'error');
    }
  };

  const handleDeleteProduct = (p: StoreProduct) => {
    setConfirmModal({
      title: 'Delete Store Product',
      message: `Remove "${p.name}" (${p.sku}) permanently from the store catalog? Existing order history will keep item snapshots.`,
      confirmLabel: 'Delete Product',
      onConfirm: async () => {
        await StoreService.deleteProduct(p.id);
        const updatedProducts = products.filter((item) => item.id !== p.id);
        setProducts(updatedProducts);
        setStockAlerts((prev) => prev.filter((a) => a.product_id !== p.id));
        showToast(`Removed "${p.name}" from store catalog.`);
        await runStockAlertScan(updatedProducts, orders, reviews, alertConfig, stockAlerts, true);
      },
    });
  };

  const handleSaveAlertRules = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const savedCfg = await StoreService.saveAlertConfig(alertConfigDraft, user?.email || user?.uid);
      setAlertConfig(savedCfg);
      setAlertConfigDraft(savedCfg);
      const res = await runStockAlertScan(products, orders, reviews, savedCfg, stockAlerts, true);
      const openCount = res ? res.alerts.filter((a) => a.status !== 'resolved').length : openAlerts.length;
      showToast(`Alert rules saved. Catalog scan complete: ${openCount} active stock alert${openCount === 1 ? '' : 's'}.`);
    } catch (err: any) {
      showToast(err?.message || 'Failed to save stock alert rules.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAcknowledgeAlert = async (alert: StoreStockAlert) => {
    try {
      const updated: StoreStockAlert = {
        ...alert,
        is_read: true,
        status: alert.status === 'active' ? 'acknowledged' : alert.status,
        updated_at: new Date().toISOString(),
      };
      await StoreService.saveStockAlert(updated);
      setStockAlerts((prev) => prev.map((a) => (a.id === alert.id ? updated : a)));
      showToast(`Acknowledged alert for ${alert.product_name}.`);
    } catch {
      showToast('Failed to update alert status.', 'error');
    }
  };

  const handleMarkAllAlertsRead = async () => {
    try {
      const now = new Date().toISOString();
      const updates = openAlerts
        .filter((a) => !a.is_read)
        .map((a) => ({
          ...a,
          is_read: true,
          status: a.status === 'active' ? ('acknowledged' as const) : a.status,
          updated_at: now,
        }));
      await Promise.all(updates.map((u) => StoreService.saveStockAlert(u)));
      setStockAlerts((prev) =>
        prev.map((a) => (a.status !== 'resolved' ? { ...a, is_read: true, status: a.status === 'active' ? 'acknowledged' : a.status } : a))
      );
      showToast('All active stock alerts marked as read.');
    } catch {
      showToast('Failed to mark alerts as read.', 'error');
    }
  };

  const handleRestockFromAlert = async (alert: StoreStockAlert, addUnits: number) => {
    const prod = products.find((p) => p.id === alert.product_id);
    if (!prod) {
      showToast('Product no longer exists in catalog.', 'error');
      return;
    }
    const qtyToAdd = Math.max(1, Math.round(addUnits));
    await handleQuickStock(prod, qtyToAdd);
  };

  const handleClearResolvedAlerts = async () => {
    try {
      await Promise.all(resolvedAlerts.map((a) => StoreService.deleteStockAlert(a.id)));
      setStockAlerts((prev) => prev.filter((a) => a.status !== 'resolved'));
      showToast('Cleared resolved stock alert log.');
    } catch {
      showToast('Failed to clear resolved alerts.', 'error');
    }
  };

  const handleDeleteReview = (reviewId: string) => {
    setConfirmModal({
      title: 'Delete Customer Review',
      message: 'Permanently delete this customer review from the product page?',
      confirmLabel: 'Delete Review',
      onConfirm: async () => {
        await StoreService.deleteReview(reviewId);
        setReviews((prev) => prev.filter((r) => r.id !== reviewId));
        showToast('Review removed.');
      },
    });
  };

  const handleOrderStatusChange = async (orderId: string, status: OrderStatus) => {
    try {
      const tracking = trackingDrafts[orderId];
      await StoreService.updateOrderStatus(orderId, status, tracking);
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? { ...o, status, tracking_number: tracking ?? o.tracking_number, updated_at: new Date().toISOString() }
            : o
        )
      );
      showToast(`Order status set to ${status}.`);
    } catch {
      showToast('Failed to update order status.', 'error');
    }
  };

  const handleVerifyOrderPayment = async (order: StoreOrder) => {
    try {
      await StoreService.updateOrderPaymentStatus(order.id, 'paid');
      setOrders((prev) =>
        prev.map((o) =>
          o.id === order.id
            ? { ...o, payment_status: 'paid', updated_at: new Date().toISOString() }
            : o
        )
      );
      showToast(`Verified bank transfer for ${order.order_number}. Marked as paid.`);
    } catch {
      showToast('Failed to verify order payment.', 'error');
    }
  };

  const openCreatePayoutModal = (presetType: StorePayoutAccountType = 'bank_transfer') => {
    setEditingPayoutId(null);
    setConfirmAccountNumber('');
    const hasExistingOfType = payoutAccounts.some((a) => a.account_type === presetType && a.is_primary);
    setPayoutForm({
      label: '',
      account_type: presetType,
      account_holder_name: user?.displayName || '',
      bank_name: '',
      account_number: '',
      ifsc_or_routing: '',
      branch_name: '',
      upi_id: '',
      paypal_handle: '',
      payment_link: '',
      qr_payload: '',
      qr_code_url: '',
      razorpay_key_id: '',
      razorpay_account_id: '',
      currency_scope:
        presetType === 'upi' || presetType === 'razorpay'
          ? 'INR'
          : presetType === 'paypal'
          ? 'USD'
          : 'ALL',
      instructions:
        presetType === 'bank_transfer'
          ? 'Include your Store Order # (e.g. SL-123456) in NEFT/IMPS/Wire remarks.'
          : presetType === 'upi'
          ? 'Scan the QR code or send via UPI app and enter the 12-digit UTR reference.'
          : presetType === 'paypal'
          ? 'Scan the PayPal QR code or open the PayPal link and enter your PayPal Transaction ID.'
          : presetType === 'custom_qr'
          ? 'Scan the merchant QR code with your banking/wallet app and enter the transfer reference ID.'
          : '',
      is_active: true,
      is_primary: !hasExistingOfType,
    });
    setIsPayoutModalOpen(true);
  };

  const openEditPayoutModal = (acc: StorePayoutAccount) => {
    setEditingPayoutId(acc.id);
    setConfirmAccountNumber(acc.account_number || '');
    setPayoutForm({
      label: acc.label,
      account_type: acc.account_type,
      account_holder_name: acc.account_holder_name,
      bank_name: acc.bank_name || '',
      account_number: acc.account_number || '',
      ifsc_or_routing: acc.ifsc_or_routing || '',
      branch_name: acc.branch_name || '',
      upi_id: acc.upi_id || '',
      paypal_handle: acc.paypal_handle || '',
      payment_link: acc.payment_link || '',
      qr_payload: acc.qr_payload || '',
      qr_code_url: acc.qr_code_url || '',
      razorpay_key_id: acc.razorpay_key_id || '',
      razorpay_account_id: acc.razorpay_account_id || '',
      currency_scope: acc.currency_scope || 'ALL',
      instructions: acc.instructions || '',
      is_active: acc.is_active !== false,
      is_primary: Boolean(acc.is_primary),
    });
    setIsPayoutModalOpen(true);
  };

  const handleDuplicatePayoutAccount = (acc: StorePayoutAccount) => {
    setEditingPayoutId(null);
    setConfirmAccountNumber(acc.account_number || '');
    setPayoutForm({
      label: `${acc.label} (Backup)`,
      account_type: acc.account_type,
      account_holder_name: acc.account_holder_name,
      bank_name: acc.bank_name || '',
      account_number: acc.account_number || '',
      ifsc_or_routing: acc.ifsc_or_routing || '',
      branch_name: acc.branch_name || '',
      upi_id: acc.upi_id || '',
      paypal_handle: acc.paypal_handle || '',
      payment_link: acc.payment_link || '',
      qr_payload: acc.qr_payload || '',
      qr_code_url: acc.qr_code_url || '',
      razorpay_key_id: acc.razorpay_key_id || '',
      razorpay_account_id: acc.razorpay_account_id || '',
      currency_scope: acc.currency_scope || 'ALL',
      instructions: acc.instructions || '',
      is_active: true,
      is_primary: false,
    });
    setIsPayoutModalOpen(true);
  };

  const handleGeneratePayoutQr = async () => {
    const resolvedPayload = resolveAccountQrPayload({
      account_type: payoutForm.account_type,
      account_holder_name: payoutForm.account_holder_name || payoutForm.label || 'Streamlify Store',
      label: payoutForm.label || 'Streamlify Store',
      upi_id: payoutForm.upi_id,
      paypal_handle: payoutForm.paypal_handle,
      payment_link: payoutForm.payment_link,
      qr_payload: payoutForm.qr_payload,
    });
    if (!resolvedPayload) {
      showToast('Enter a UPI ID, PayPal handle/email, Payment Link, or QR Payload to generate a QR code.', 'error');
      return;
    }
    setQrGenerating(true);
    try {
      const dataUrl = await generateQrDataUrl(resolvedPayload);
      setPayoutForm((prev) => ({
        ...prev,
        qr_payload: prev.qr_payload.trim() || resolvedPayload,
        qr_code_url: dataUrl,
      }));
      showToast('Generated scannable payment QR code.');
    } catch (err: any) {
      showToast(err?.message || 'Could not generate QR code.', 'error');
    } finally {
      setQrGenerating(false);
    }
  };

  const handleUploadPayoutQrFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setQrGenerating(true);
    try {
      const dataUrl = await resizeQrImageFile(file);
      setPayoutForm((prev) => ({ ...prev, qr_code_url: dataUrl }));
      showToast('Custom QR image uploaded and optimized for checkout.');
    } catch (err: any) {
      showToast(err?.message || 'Failed to process QR image.', 'error');
    } finally {
      setQrGenerating(false);
    }
  };

  const handleSavePayoutAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payoutForm.label.trim() || !payoutForm.account_holder_name.trim()) {
      showToast('Account label and holder name are required.', 'error');
      return;
    }
    if (payoutForm.account_type === 'bank_transfer') {
      if (!payoutForm.bank_name.trim() || !payoutForm.account_number.trim() || !payoutForm.ifsc_or_routing.trim()) {
        showToast('Bank name, account number, and IFSC/Routing/SWIFT code are required.', 'error');
        return;
      }
      if (payoutForm.account_number.trim() !== confirmAccountNumber.trim()) {
        showToast('Account numbers do not match. Please double-check.', 'error');
        return;
      }
    }
    if (payoutForm.account_type === 'upi' && !payoutForm.upi_id.includes('@')) {
      showToast('Enter a valid UPI VPA ID (e.g. merchant@icici).', 'error');
      return;
    }
    if (payoutForm.account_type === 'paypal' && !payoutForm.paypal_handle.trim() && !payoutForm.payment_link.trim() && !payoutForm.qr_code_url.trim()) {
      showToast('Enter a PayPal.me handle / business email, payment link, or upload a PayPal QR code.', 'error');
      return;
    }
    if (payoutForm.account_type === 'custom_qr' && !payoutForm.qr_code_url.trim() && !payoutForm.qr_payload.trim() && !payoutForm.payment_link.trim()) {
      showToast('Upload a custom QR image or enter a payment link / QR payload.', 'error');
      return;
    }
    if (payoutForm.account_type === 'razorpay' && !payoutForm.razorpay_key_id.trim() && !payoutForm.razorpay_account_id.trim()) {
      showToast('Enter at least a Razorpay Public Key ID (rzp_...) or Linked Route Account ID (acc_...).', 'error');
      return;
    }

    setSaving(true);
    try {
      // Auto-generate QR image if admin saved a UPI, PayPal, or Custom QR account with payload but didn't manually upload/click generate yet
      let finalQrUrl = payoutForm.qr_code_url.trim();
      const resolvedPayload =
        payoutForm.qr_payload.trim() ||
        resolveAccountQrPayload({
          account_type: payoutForm.account_type,
          account_holder_name: payoutForm.account_holder_name.trim(),
          label: payoutForm.label.trim(),
          upi_id: payoutForm.upi_id.trim(),
          paypal_handle: payoutForm.paypal_handle.trim(),
          payment_link: payoutForm.payment_link.trim(),
          qr_payload: payoutForm.qr_payload.trim(),
        });

      if (!finalQrUrl && resolvedPayload && ['upi', 'paypal', 'custom_qr'].includes(payoutForm.account_type)) {
        try {
          finalQrUrl = await generateQrDataUrl(resolvedPayload);
        } catch {
          // non-blocking fallback
        }
      }

      const existing = editingPayoutId ? payoutAccounts.find((a) => a.id === editingPayoutId) : undefined;
      await StoreService.savePayoutAccount({
        id: editingPayoutId || undefined,
        created_at: existing?.created_at,
        label: payoutForm.label.trim(),
        account_type: payoutForm.account_type,
        account_holder_name: payoutForm.account_holder_name.trim(),
        bank_name: payoutForm.bank_name.trim(),
        account_number: payoutForm.account_number.trim(),
        ifsc_or_routing: payoutForm.ifsc_or_routing.trim().toUpperCase(),
        branch_name: payoutForm.branch_name.trim(),
        upi_id: payoutForm.upi_id.trim(),
        paypal_handle: payoutForm.paypal_handle.trim(),
        payment_link: payoutForm.payment_link.trim(),
        qr_payload: resolvedPayload,
        qr_code_url: finalQrUrl,
        razorpay_key_id: payoutForm.razorpay_key_id.trim(),
        razorpay_account_id: payoutForm.razorpay_account_id.trim(),
        currency_scope: payoutForm.currency_scope,
        instructions: payoutForm.instructions.trim(),
        is_active: payoutForm.is_active,
        is_primary: payoutForm.is_primary,
      });
      const updated = await StoreService.fetchPayoutAccounts(true);
      setPayoutAccounts(updated);
      setIsPayoutModalOpen(false);
      showToast(
        editingPayoutId
          ? `Updated receiving account "${payoutForm.label.trim()}".`
          : `Added receiving account "${payoutForm.label.trim()}".`
      );
    } catch (err: any) {
      showToast(err?.message || 'Failed to save receiving account.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSwitchPrimaryPayout = async (accId: string) => {
    try {
      const updated = await StoreService.setPrimaryPayoutAccount(accId);
      setPayoutAccounts(updated);
      const active = updated.find((a) => a.id === accId);
      if (active) {
        showToast(`Switched active ${active.account_type.replace('_', ' ')} receiving account to "${active.label}".`);
      }
    } catch {
      showToast('Failed to switch primary receiving account.', 'error');
    }
  };

  const handleTogglePayoutActive = async (acc: StorePayoutAccount) => {
    try {
      await StoreService.savePayoutAccount({
        ...acc,
        is_active: !acc.is_active,
        is_primary: !acc.is_active ? acc.is_primary : false,
      });
      const updated = await StoreService.fetchPayoutAccounts(true);
      setPayoutAccounts(updated);
      showToast(`${acc.label} ${!acc.is_active ? 'activated' : 'paused'} for buyer checkout.`);
    } catch {
      showToast('Failed to update account status.', 'error');
    }
  };

  const handleDeletePayoutAccount = (acc: StorePayoutAccount) => {
    setConfirmModal({
      title: 'Delete Receiving Account',
      message: `Remove "${acc.label}" from admin receiving accounts? Historical order records will preserve their snapshot label.`,
      confirmLabel: 'Delete Account',
      onConfirm: async () => {
        await StoreService.deletePayoutAccount(acc.id);
        setPayoutAccounts((prev) => prev.filter((a) => a.id !== acc.id));
        showToast(`Removed "${acc.label}".`);
      },
    });
  };

  const handleSaveTrackingOnly = async (order: StoreOrder) => {
    try {
      const tracking = (trackingDrafts[order.id] || '').trim();
      await StoreService.updateOrderStatus(order.id, order.status, tracking);
      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? { ...o, tracking_number: tracking, updated_at: new Date().toISOString() } : o))
      );
      showToast(`Tracking ID saved for ${order.order_number}.`);
    } catch {
      showToast('Failed to save tracking ID.', 'error');
    }
  };

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponForm.code.trim()) {
      showToast('Coupon code is required.', 'error');
      return;
    }
    try {
      await StoreService.saveCoupon(couponForm);
      showToast(`Coupon ${couponForm.code.toUpperCase()} saved.`);
      setIsCouponModalOpen(false);
      setCouponForm({
        code: '',
        discount_type: 'percent',
        value: 10,
        min_order_usd: 25,
        description: '',
        is_active: true,
      });
      await loadAll();
    } catch {
      showToast('Failed to save coupon.', 'error');
    }
  };

  if (!user || !isAdmin) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center">
        <div className="w-14 h-14 rounded-xl bg-rose-50 text-[#d11a2a] flex items-center justify-center mb-4 border border-rose-200">
          <ShieldCheck className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Store Admin Access Required</h2>
        <p className="text-sm text-slate-600 max-w-md mt-2">
          Only authorized store administrators can add cricket, sports, and games inventory, manage custom brands, fulfill orders, or moderate reviews.
        </p>
        {onBack && (
          <button
            onClick={onBack}
            className="mt-6 px-5 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-800 transition-colors"
          >
            Return to Store
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`${embedded ? '' : 'bg-slate-50 min-h-screen pb-16'} text-slate-900`}>
      {!embedded && (
        <div className="bg-white border-b border-slate-200 px-4 md:px-8 py-5">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              {onBack && (
                <button
                  onClick={onBack}
                  className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                  title="Back"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              )}
              <div>
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900" style={{ fontFamily: "'Outfit', sans-serif" }}>
                  Store Inventory &amp; Merchant Console
                </h1>
                <p className="text-xs md:text-sm text-slate-500 mt-0.5">
                  Manage Cricket, Multi-Sport &amp; Indoor Games inventory, custom brands, pricing, units ordered, reviews, and shipments.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              {onOpenStorefront && (
                <button
                  onClick={onOpenStorefront}
                  className="px-4 py-2 text-xs font-semibold border border-slate-200 rounded-lg bg-white text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2 whitespace-nowrap shrink-0"
                >
                  <ShoppingBag className="w-4 h-4" />
                  View Live Storefront
                </button>
              )}
              <button
                onClick={() => setSubTab('alerts')}
                className={`px-3.5 py-2 text-xs font-semibold border rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 ${
                  openAlerts.length > 0
                    ? 'border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Bell className={`w-4 h-4 ${unreadAlerts.length > 0 ? 'text-[#d11a2a]' : ''}`} />
                <span>Stock Alerts</span>
                {openAlerts.length > 0 && (
                  <span className="px-1.5 py-0.5 text-[11px] font-bold rounded bg-[#d11a2a] text-white tabular-nums">
                    {openAlerts.length}
                  </span>
                )}
              </button>
              <button
                onClick={openCreateBrandModal}
                className="px-4 py-2 text-xs font-semibold border border-slate-200 rounded-lg bg-white text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2 whitespace-nowrap shrink-0"
              >
                <Award className="w-4 h-4" />
                Add Custom Brand
              </button>
              <button
                onClick={loadAll}
                disabled={loading}
                className="px-4 py-2 text-xs font-semibold border border-slate-200 rounded-lg bg-white text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2 whitespace-nowrap shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                Refresh Data
              </button>
              <button
                onClick={openCreateModal}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#d11a2a] hover:bg-[#b51523] text-white transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Add New Gear
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={`${embedded ? '' : 'max-w-7xl mx-auto px-4 md:px-8 mt-6'} space-y-6`}>
        {embedded && (
          <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Store Catalog, Custom Brands, Orders &amp; Reviews</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Track pricing, custom brands, units ordered, stock alerts, and verified buyer reviews across Cricket, Sports &amp; Games gear.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setSubTab('alerts')}
                className={`px-3.5 py-2 text-xs font-semibold border rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                  openAlerts.length > 0
                    ? 'border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Bell className={`w-3.5 h-3.5 ${unreadAlerts.length > 0 ? 'text-[#d11a2a]' : ''}`} />
                <span>Alerts</span>
                {openAlerts.length > 0 && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-[#d11a2a] text-white tabular-nums">
                    {openAlerts.length}
                  </span>
                )}
              </button>
              <button
                onClick={openCreateBrandModal}
                className="px-3.5 py-2 text-xs font-semibold border border-slate-200 rounded-lg bg-white text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1.5 whitespace-nowrap"
              >
                <Award className="w-3.5 h-3.5" />
                Add Custom Brand
              </button>
              <button
                onClick={loadAll}
                disabled={loading}
                className="px-3.5 py-2 text-xs font-semibold border border-slate-200 rounded-lg bg-slate-50 text-slate-700 hover:bg-slate-100 transition-colors flex items-center gap-1.5 whitespace-nowrap"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                onClick={openCreateModal}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#d11a2a] hover:bg-[#b51523] text-white transition-colors flex items-center gap-1.5 whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                Add New Gear
              </button>
            </div>
          </div>
        )}

        {/* Automated Low-Stock Notification Banner */}
        {alertConfig.enabled && openAlerts.length > 0 && !bannerDismissed && (
          <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#d11a2a] text-white flex items-center justify-center shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-bold text-slate-900">
                    Automated Inventory Alert: {openAlerts.length} {openAlerts.length === 1 ? 'item needs' : 'items need'} restocking
                  </span>
                  {unreadAlerts.length > 0 && (
                    <span className="px-2 py-0.5 text-[11px] font-bold bg-[#d11a2a] text-white rounded tabular-nums">
                      {unreadAlerts.length} unread
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-700">
                  {openAlerts
                    .slice(0, 3)
                    .map((a) => `${a.product_name} (${a.current_stock}/${a.threshold})`)
                    .join(' · ')}
                  {openAlerts.length > 3 ? ` · +${openAlerts.length - 3} more` : ''}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setSubTab('alerts')}
                className="px-3.5 py-2 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800 whitespace-nowrap"
              >
                Review &amp; Restock ({openAlerts.length})
              </button>
              <button
                type="button"
                onClick={() => setBannerDismissed(true)}
                className="p-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-amber-100"
                title="Dismiss banner"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* KPI Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="text-xs font-medium text-slate-500">Catalog SKUs</div>
            <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">{metrics.totalSkus}</div>
            <div className="text-xs text-slate-500 mt-1 tabular-nums flex items-center justify-between gap-2">
              <span>{metrics.publishedSkus} published</span>
              <button
                type="button"
                onClick={() => setSubTab('alerts')}
                className={`font-semibold hover:underline ${
                  metrics.openAlertCount > 0 ? 'text-[#d11a2a]' : 'text-slate-500'
                }`}
              >
                {metrics.openAlertCount} active alert{metrics.openAlertCount === 1 ? '' : 's'}
              </button>
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="text-xs font-medium text-slate-500">Total Units Ordered</div>
            <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">{metrics.totalUnitsOrdered}</div>
            <div className="text-xs text-slate-500 mt-1 tabular-nums">
              Across {metrics.totalOrders} orders · {metrics.pendingOrders} pending
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="text-xs font-medium text-slate-500">Customer Reviews</div>
            <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums flex items-center gap-2">
              <span>{metrics.totalReviews}</span>
              {metrics.totalReviews > 0 && (
                <span className="text-sm font-semibold text-amber-600 flex items-center gap-1">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  {metrics.avgStoreRating.toFixed(1)}
                </span>
              )}
            </div>
            <div className="text-xs text-slate-500 mt-1">Verified store product ratings</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="text-xs font-medium text-slate-500">Gross Store Revenue</div>
            <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">
              {formatCurrency(metrics.totalRevenueUsd, 'USD', 'en-US')}
            </div>
            <div className="text-xs text-emerald-700 mt-1">Non-cancelled orders total</div>
          </div>
        </div>

        {/* Sub-Navigation */}
        <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200 w-fit">
          {[
            { id: 'catalog', label: `Catalog & Pricing (${products.length})`, icon: Package },
            { id: 'analytics', label: 'Store Analytics', icon: BarChart3 },
            { id: 'payouts', label: `Bank & Payouts (${payoutAccounts.length})`, icon: Landmark },
            {
              id: 'alerts',
              label: `Stock Alerts (${openAlerts.length})`,
              icon: Bell,
              highlight: unreadAlerts.length > 0,
            },
            {
              id: 'waitlist',
              label: `Restock Waitlist (${waitingRestockRequests.length})`,
              icon: BellRing,
              highlight: waitingRestockRequests.length > 0,
            },
            { id: 'brands', label: `Custom Brands (${brands.length})`, icon: Award },
            { id: 'orders', label: `Orders & Shipments (${orders.length})`, icon: Truck },
            { id: 'reviews', label: `Reviews (${reviews.length})`, icon: MessageSquare },
            { id: 'coupons', label: `Promo Coupons (${coupons.length})`, icon: Tag },
            { id: 'authenticity', label: 'Authenticity Registry', icon: ShieldCheck },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = subTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSubTab(tab.id as any)}
                className={`px-3.5 py-2 rounded-md text-xs font-semibold flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 ${
                  active
                    ? 'bg-white text-slate-900 shadow-sm'
                    : tab.highlight
                    ? 'text-[#d11a2a] hover:bg-white/60'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* CATALOG TAB */}
        {subTab === 'catalog' && (
          <div className="space-y-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by product, sport, game, SKU, or brand..."
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d11a2a]"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={domainFilter}
                  onChange={(e) => setDomainFilter(e.target.value as any)}
                  className="px-3 py-2 text-xs font-semibold border border-slate-200 rounded-lg bg-white text-slate-700"
                >
                  <option value="All">All Store Sections</option>
                  {STORE_PRIMARY_DOMAINS.map((dom) => (
                    <option key={dom} value={dom}>{dom}</option>
                  ))}
                </select>
                <select
                  value={sportFilter}
                  onChange={(e) => setSportFilter(e.target.value)}
                  className="px-3 py-2 text-xs font-semibold border border-slate-200 rounded-lg bg-white text-slate-700"
                >
                  <option value="All">All Sports &amp; Games</option>
                  {availableSports.map((sp) => (
                    <option key={sp} value={sp}>{sp}</option>
                  ))}
                </select>
                <select
                  value={brandFilter}
                  onChange={(e) => setBrandFilter(e.target.value)}
                  className="px-3 py-2 text-xs font-semibold border border-slate-200 rounded-lg bg-white text-slate-700"
                >
                  <option value="All">All Brands</option>
                  {availableBrands.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
                <select
                  value={stockFilter}
                  onChange={(e) => setStockFilter(e.target.value as any)}
                  className="px-3 py-2 text-xs font-semibold border border-slate-200 rounded-lg bg-white text-slate-700"
                >
                  <option value="all">All Stock Levels</option>
                  <option value="in">In Stock</option>
                  <option value="low">Low Stock (1-5)</option>
                  <option value="out">Out of Stock</option>
                </select>
                <select
                  value={catalogSort}
                  onChange={(e) => setCatalogSort(e.target.value as any)}
                  className="px-3 py-2 text-xs font-semibold border border-slate-200 rounded-lg bg-white text-slate-700"
                >
                  <option value="newest">Sort: Newest</option>
                  <option value="units_desc">Sort: Most Units Ordered</option>
                  <option value="rating_desc">Sort: Highest Rated</option>
                  <option value="stock_asc">Sort: Lowest Stock</option>
                  <option value="price_desc">Sort: Price High-Low</option>
                  <option value="price_asc">Sort: Price Low-High</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-sm text-slate-500">
                Loading inventory...
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl p-12 text-center space-y-3">
                <p className="text-sm font-semibold text-slate-700">
                  {products.length === 0
                    ? 'Your store catalog is empty. Add your first Cricket, Sports, or Indoor Games product.'
                    : 'No gear matches your current filters.'}
                </p>
                <button
                  onClick={openCreateModal}
                  className="px-4 py-2 text-xs font-semibold bg-[#d11a2a] text-white rounded-lg hover:bg-[#b51523]"
                >
                  Add Store Gear
                </button>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500">
                        <th className="py-3 px-4">Product &amp; SKU</th>
                        <th className="py-3 px-4">Domain &amp; Category</th>
                        <th className="py-3 px-4">Pricing (USD / INR)</th>
                        <th className="py-3 px-4">Stock</th>
                        <th className="py-3 px-4">Units Ordered</th>
                        <th className="py-3 px-4">Reviews</th>
                        <th className="py-3 px-4">Visibility</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {filteredProducts.map((p) => {
                        const orderStats = orderMetricsByProduct[p.id] || { unitsOrdered: 0, revenueUsd: 0, orderCount: 0 };
                        const revStats = reviewMetricsByProduct[p.id] || { averageRating: 0, reviewCount: 0 };
                        const monitorEval = StoreService.evaluateProductMonitoring(p, orderStats, revStats, alertConfig);
                        const discountPct =
                          p.mrp_usd > p.price_usd ? Math.round(((p.mrp_usd - p.price_usd) / p.mrp_usd) * 100) : 0;

                        return (
                          <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-14 h-11 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                                  <img
                                    src={p.image_url}
                                    alt={p.name}
                                    referrerPolicy="no-referrer"
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      (e.currentTarget as HTMLImageElement).style.display = 'none';
                                    }}
                                  />
                                </div>
                                <div className="min-w-0">
                                  <div className="font-semibold text-slate-900 truncate max-w-[240px] flex items-center gap-1.5">
                                    <span className="truncate">{p.name}</span>
                                    {monitorEval.isPopular && (
                                      <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 rounded shrink-0">
                                        Popular
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-xs text-slate-500 font-mono tabular-nums mt-0.5">
                                    {p.brand} · {p.sku}
                                    {p.knocking_available ? ' · Knocking' : ''}
                                    {p.custom_print_available ? ' · Custom Print' : ''}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="font-medium text-slate-800">{p.domain}</div>
                              <div className="text-xs text-slate-500">{p.category} · {p.sport_type}</div>
                            </td>
                            <td className="py-3.5 px-4 font-mono tabular-nums">
                              <div className="font-semibold text-slate-900">
                                ${p.price_usd.toFixed(2)}{' '}
                                <span className="text-slate-400 font-normal">/ ₹{p.price_inr.toLocaleString('en-IN')}</span>
                              </div>
                              {p.mrp_usd > p.price_usd && (
                                <div className="text-xs text-slate-400 flex items-center gap-1.5">
                                  <span className="line-through">
                                    ${p.mrp_usd.toFixed(2)} / ₹{p.mrp_inr.toLocaleString('en-IN')}
                                  </span>
                                  <span className="text-emerald-700 font-sans font-semibold">-{discountPct}%</span>
                                </div>
                              )}
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="space-y-1">
                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={() => handleQuickStock(p, -1)}
                                    className="w-6 h-6 rounded border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold"
                                    title="Decrease stock"
                                  >
                                    -
                                  </button>
                                  <span
                                    className={`min-w-[32px] text-center font-mono text-xs font-semibold tabular-nums ${
                                      p.stock === 0
                                        ? 'text-rose-600'
                                        : monitorEval.isTriggered
                                        ? 'text-amber-700'
                                        : 'text-slate-900'
                                    }`}
                                  >
                                    {p.stock}
                                  </span>
                                  <button
                                    onClick={() => handleQuickStock(p, 5)}
                                    className="px-1.5 h-6 rounded border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold"
                                    title="Restock +5"
                                  >
                                    +5
                                  </button>
                                </div>
                                {monitorEval.isTriggered && (
                                  <div className="text-[10px] font-semibold text-[#d11a2a] tabular-nums">
                                    {p.stock === 0 ? 'Out of stock' : `Below ≤ ${monitorEval.threshold} alert`}
                                  </div>
                                )}
                                {(waitlistCountByProduct[p.id] || 0) > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => setSubTab('waitlist')}
                                    className="text-[10px] font-semibold text-amber-700 hover:underline flex items-center gap-1 tabular-nums"
                                  >
                                    <BellRing className="w-3 h-3" />
                                    {waitlistCountByProduct[p.id]} waiting
                                  </button>
                                )}
                              </div>
                            </td>
                            <td className="py-3.5 px-4 font-mono tabular-nums">
                              <div className="font-bold text-slate-900">
                                {orderStats.unitsOrdered} {orderStats.unitsOrdered === 1 ? 'unit' : 'units'}
                              </div>
                              <div className="text-xs text-slate-500">
                                {orderStats.orderCount} {orderStats.orderCount === 1 ? 'order' : 'orders'} · ${orderStats.revenueUsd.toFixed(2)}
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <button
                                type="button"
                                onClick={() => {
                                  setReviewProductFilter(p.id);
                                  setSubTab('reviews');
                                }}
                                className="text-left group"
                                title="View product reviews"
                              >
                                <div className="flex items-center gap-1 font-mono text-xs font-semibold text-slate-900 tabular-nums group-hover:text-[#d11a2a]">
                                  <Star className={`w-3.5 h-3.5 ${revStats.reviewCount > 0 ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
                                  <span>{revStats.reviewCount > 0 ? revStats.averageRating.toFixed(1) : '—'}</span>
                                </div>
                                <div className="text-xs text-slate-500 tabular-nums">
                                  {revStats.reviewCount} {revStats.reviewCount === 1 ? 'review' : 'reviews'}
                                </div>
                              </button>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleToggleProductField(p, 'is_active')}
                                  className={`px-2.5 py-1 rounded-md text-xs font-semibold border transition-colors ${
                                    p.is_active
                                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                      : 'bg-slate-100 border-slate-200 text-slate-500'
                                  }`}
                                >
                                  {p.is_active ? 'Published' : 'Hidden'}
                                </button>
                                <button
                                  onClick={() => handleToggleProductField(p, 'featured')}
                                  className={`p-1.5 rounded-md border transition-colors ${
                                    p.featured
                                      ? 'bg-amber-50 border-amber-200 text-amber-600'
                                      : 'bg-white border-slate-200 text-slate-400 hover:text-slate-600'
                                  }`}
                                  title="Toggle Featured"
                                >
                                  <Star className="w-3.5 h-3.5 fill-current" />
                                </button>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => openEditModal(p)}
                                  className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                                  title="Edit Product"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDuplicateProduct(p)}
                                  className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                                  title="Duplicate Product"
                                >
                                  <Copy className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteProduct(p)}
                                  className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50"
                                  title="Delete Product"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STOCK ALERTS & AUTOMATION TAB */}
        {subTab === 'alerts' && (
          <div className="space-y-6">
            {/* Automated Threshold Rules Configuration */}
            <form
              onSubmit={handleSaveAlertRules}
              className="bg-white border border-slate-200 rounded-xl p-5 space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0">
                    <Sliders className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Automated Low-Stock Alert Rules
                    </h3>
                    <p className="text-xs text-slate-500">
                      Automatically detects when popular cricket gear or catalog stock falls at or below your threshold.
                    </p>
                  </div>
                </div>
                <label className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800 cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={alertConfigDraft.enabled}
                    onChange={(e) => setAlertConfigDraft({ ...alertConfigDraft, enabled: e.target.checked })}
                  />
                  Automated Monitoring Active
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Monitoring Scope</label>
                  <select
                    value={alertConfigDraft.scope}
                    onChange={(e) =>
                      setAlertConfigDraft({ ...alertConfigDraft, scope: e.target.value as StoreAlertScope })
                    }
                    className="w-full px-3 py-2 text-xs font-semibold border border-slate-200 rounded-lg bg-white text-slate-800"
                  >
                    <option value="popular_cricket">Popular Cricket Gear (Recommended)</option>
                    <option value="all_cricket">All Cricket Gear</option>
                    <option value="all_popular">All Popular Sports &amp; Games</option>
                    <option value="all_catalog">Entire Store Catalog</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Popular Gear Threshold (≤ units)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="10000"
                    value={alertConfigDraft.popular_threshold}
                    onChange={(e) =>
                      setAlertConfigDraft({
                        ...alertConfigDraft,
                        popular_threshold: Math.max(0, parseInt(e.target.value, 10) || 0),
                      })
                    }
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Standard Gear Threshold (≤ units)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="10000"
                    value={alertConfigDraft.default_threshold}
                    onChange={(e) =>
                      setAlertConfigDraft({
                        ...alertConfigDraft,
                        default_threshold: Math.max(0, parseInt(e.target.value, 10) || 0),
                      })
                    }
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Popular = Min Units Ordered
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10000"
                    value={alertConfigDraft.popular_min_units_ordered}
                    onChange={(e) =>
                      setAlertConfigDraft({
                        ...alertConfigDraft,
                        popular_min_units_ordered: Math.max(1, parseInt(e.target.value, 10) || 1),
                      })
                    }
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={alertConfigDraft.sync_to_global_bell}
                      onChange={(e) =>
                        setAlertConfigDraft({ ...alertConfigDraft, sync_to_global_bell: e.target.checked })
                      }
                    />
                    Push alerts to top Notification Bell
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={alertConfigDraft.toast_on_trigger}
                      onChange={(e) =>
                        setAlertConfigDraft({ ...alertConfigDraft, toast_on_trigger: e.target.checked })
                      }
                    />
                    Show live toast on new trigger
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-xs font-semibold bg-[#d11a2a] hover:bg-[#b51523] text-white rounded-lg transition-colors whitespace-nowrap shrink-0"
                >
                  {saving ? 'Scanning...' : 'Save Rules & Scan Inventory'}
                </button>
              </div>
              <p className="text-[11px] text-slate-500">
                Popularity auto-qualifies items marked <strong>Featured</strong>, items with{' '}
                <strong className="font-mono">{alertConfigDraft.popular_min_units_ordered}+</strong> units ordered, or items rated{' '}
                <strong className="font-mono">4.0★+</strong>. Per-product threshold overrides can also be set inside each item&apos;s edit modal.
              </p>
            </form>

            {/* Alerts Queue Header & Actions */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { id: 'open', label: `Active (${openAlerts.length})` },
                  { id: 'unread', label: `Unread (${unreadAlerts.length})` },
                  { id: 'resolved', label: `Resolved (${resolvedAlerts.length})` },
                  { id: 'all', label: `All Log (${stockAlerts.length})` },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setAlertViewFilter(f.id as any)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap ${
                      alertViewFilter === f.id
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {unreadAlerts.length > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllAlertsRead}
                    className="px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 whitespace-nowrap"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    Mark All Read
                  </button>
                )}
                {resolvedAlerts.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearResolvedAlerts}
                    className="px-3 py-1.5 text-xs font-semibold border border-rose-200 rounded-lg text-rose-600 hover:bg-rose-50 whitespace-nowrap"
                  >
                    Clear Resolved
                  </button>
                )}
              </div>
            </div>

            {filteredAlerts.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl p-12 text-center space-y-2">
                <Bell className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-sm font-bold text-slate-800">
                  {alertViewFilter === 'open'
                    ? 'All monitored inventory is healthy'
                    : 'No stock notifications in this view'}
                </p>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  {alertConfig.enabled
                    ? 'Automated monitoring will alert you immediately whenever popular cricket gear or monitored products drop at or below your threshold.'
                    : 'Automated stock monitoring is currently paused. Enable it above to start scanning.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredAlerts.map((alert) => {
                  const linkedProduct = productNameMap[alert.product_id];
                  const customAdd = restockDrafts[alert.id] ?? 10;
                  const isResolved = alert.status === 'resolved';
                  const severityStyle = isResolved
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : alert.severity === 'out_of_stock'
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : alert.severity === 'critical'
                    ? 'bg-amber-50 text-amber-800 border-amber-300'
                    : 'bg-yellow-50 text-yellow-800 border-yellow-200';
                  const severityLabel = isResolved
                    ? 'Restocked'
                    : alert.severity === 'out_of_stock'
                    ? 'Out of Stock'
                    : alert.severity === 'critical'
                    ? 'Critical Low'
                    : 'Below Threshold';

                  return (
                    <div
                      key={alert.id}
                      className={`bg-white border rounded-xl p-4 md:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                        !alert.is_read && !isResolved ? 'border-amber-300 ring-1 ring-amber-200/60' : 'border-slate-200'
                      }`}
                    >
                      <div className="flex items-start gap-3.5 min-w-0">
                        <div className="w-14 h-12 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                          {linkedProduct?.image_url ? (
                            <img
                              src={linkedProduct.image_url}
                              alt={alert.product_name}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Package className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                        <div className="space-y-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`px-2 py-0.5 text-[11px] font-bold rounded border ${severityStyle}`}>
                              {severityLabel}
                            </span>
                            {alert.is_popular && (
                              <span className="px-2 py-0.5 text-[11px] font-semibold bg-slate-900 text-white rounded">
                                {alert.popularity_reason}
                              </span>
                            )}
                            {!alert.is_read && !isResolved && (
                              <span className="text-[11px] font-bold text-[#d11a2a]">Unread</span>
                            )}
                          </div>

                          <div className="text-sm font-bold text-slate-900 truncate">{alert.product_name}</div>
                          <div className="text-xs text-slate-500 flex flex-wrap items-center gap-x-2 gap-y-0.5 font-mono tabular-nums">
                            <span>{alert.brand}</span>
                            <span>·</span>
                            <span>{alert.sku}</span>
                            <span>·</span>
                            <span className="font-sans">{alert.domain} / {alert.sport_type}</span>
                          </div>
                          <div className="text-xs text-slate-700 pt-0.5 tabular-nums">
                            Current Stock:{' '}
                            <strong className={alert.current_stock === 0 ? 'text-rose-600' : 'text-slate-900'}>
                              {alert.current_stock}
                            </strong>{' '}
                            / Alert Threshold: <strong>≤ {alert.threshold}</strong>
                            {(waitlistCountByProduct[alert.product_id] || 0) > 0 && (
                              <button
                                type="button"
                                onClick={() => setSubTab('waitlist')}
                                className="ml-2 text-amber-700 font-semibold hover:underline"
                              >
                                · {waitlistCountByProduct[alert.product_id]} waiting for email alert
                              </button>
                            )}
                            <span className="text-slate-400 ml-2">
                              · Updated {new Date(alert.updated_at).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      {!isResolved && linkedProduct && (
                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleRestockFromAlert(alert, 5)}
                            className="px-2.5 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg bg-white hover:bg-slate-50 text-slate-800 whitespace-nowrap"
                          >
                            +5 Stock
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRestockFromAlert(alert, 10)}
                            className="px-2.5 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg bg-white hover:bg-slate-50 text-slate-800 whitespace-nowrap"
                          >
                            +10 Stock
                          </button>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min="1"
                              max="1000"
                              value={customAdd}
                              onChange={(e) =>
                                setRestockDrafts((prev) => ({
                                  ...prev,
                                  [alert.id]: Math.max(1, parseInt(e.target.value, 10) || 1),
                                }))
                              }
                              className="w-14 px-2 py-1.5 text-xs border border-slate-200 rounded-lg font-mono text-center"
                              aria-label="Custom restock units"
                            />
                            <button
                              type="button"
                              onClick={() => handleRestockFromAlert(alert, customAdd)}
                              className="px-2.5 py-1.5 text-xs font-semibold bg-[#d11a2a] hover:bg-[#b51523] text-white rounded-lg whitespace-nowrap"
                            >
                              Restock
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => openEditModal(linkedProduct)}
                            className="p-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
                            title="Edit Product"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          {!alert.is_read && (
                            <button
                              type="button"
                              onClick={() => handleAcknowledgeAlert(alert)}
                              className="px-2.5 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 flex items-center gap-1 whitespace-nowrap"
                            >
                              <Check className="w-3.5 h-3.5" />
                              Acknowledge
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* RESTOCK WAITLIST TAB */}
        {subTab === 'waitlist' && (
          <div className="space-y-5">
            <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0">
                  <BellRing className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Customer Restock Waitlist &amp; Back-in-Stock Email Alerts
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Subscribers who clicked &quot;Notify Me&quot; on out-of-stock products. Restocking a product from 0 units automatically marks waitlist subscribers as notified and dispatches email/in-app notices.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                {[
                  { id: 'waiting', label: `Waiting (${waitingRestockRequests.length})` },
                  { id: 'notified', label: `Notified (${notifiedRestockRequests.length})` },
                  { id: 'all', label: `All (${restockRequests.length})` },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setWaitlistStatusFilter(f.id as any)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap ${
                      waitlistStatusFilter === f.id
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {groupedWaitingProducts.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groupedWaitingProducts.map((grp) => {
                  const linked = productNameMap[grp.productId];
                  const currentStock = linked ? linked.stock : 0;
                  return (
                    <div
                      key={grp.productId}
                      className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between gap-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-xs font-mono text-slate-500">
                            {grp.brand} · {grp.sku}
                          </div>
                          <div className="text-sm font-bold text-slate-900 truncate mt-0.5">
                            {grp.productName}
                          </div>
                          <div className="text-xs text-slate-600 mt-1 tabular-nums">
                            Stock:{' '}
                            <strong className={currentStock === 0 ? 'text-rose-600' : 'text-emerald-700'}>
                              {currentStock} units
                            </strong>
                          </div>
                        </div>
                        <span className="px-2 py-1 text-xs font-bold rounded bg-amber-50 border border-amber-200 text-amber-800 shrink-0 tabular-nums">
                          {grp.count} waiting
                        </span>
                      </div>

                      {linked && (
                        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                          {currentStock === 0 ? (
                            <button
                              type="button"
                              onClick={() => handleQuickStock(linked, 10)}
                              className="flex-1 px-3 py-1.5 text-xs font-semibold bg-[#d11a2a] hover:bg-[#b51523] text-white rounded-lg transition-colors whitespace-nowrap flex items-center justify-center gap-1.5"
                            >
                              <Send className="w-3.5 h-3.5" />
                              Restock +10 &amp; Notify All
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={notifyingProductId === linked.id}
                              onClick={() => handleNotifyProductWaitlist(linked)}
                              className="flex-1 px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors whitespace-nowrap flex items-center justify-center gap-1.5"
                            >
                              <Mail className="w-3.5 h-3.5" />
                              {notifyingProductId === linked.id ? 'Sending...' : 'Send Back-in-Stock Notice'}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => openEditModal(linked)}
                            className="p-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
                            title="Edit Product Stock"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {filteredRestockRequests.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl p-12 text-center space-y-2">
                <BellRing className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-sm font-bold text-slate-800">
                  {waitlistStatusFilter === 'waiting'
                    ? 'No customers currently waiting for restock alerts'
                    : 'No restock alert signups recorded yet'}
                </p>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  When a store product has 0 stock, customers see a &quot;Notify Me&quot; email signup button on the storefront and product page. Signups appear here automatically.
                </p>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500">
                        <th className="py-3 px-4">Product &amp; SKU</th>
                        <th className="py-3 px-4">Current Stock</th>
                        <th className="py-3 px-4">Subscriber Email</th>
                        <th className="py-3 px-4">Requested</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {filteredRestockRequests.map((req) => {
                        const linked = productNameMap[req.product_id];
                        const currentStock = linked ? linked.stock : 0;
                        return (
                          <tr key={req.id} className="hover:bg-slate-50/70">
                            <td className="py-3 px-4">
                              <div className="font-semibold text-slate-900">{req.product_name}</div>
                              <div className="text-xs text-slate-500 font-mono">
                                {req.brand} · {req.sku}
                              </div>
                            </td>
                            <td className="py-3 px-4 font-mono text-xs font-semibold tabular-nums">
                              <span className={currentStock === 0 ? 'text-rose-600' : 'text-emerald-700'}>
                                {linked ? `${currentStock} units` : 'Removed'}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-mono text-xs font-semibold text-slate-900">{req.email}</div>
                              {req.user_name && (
                                <div className="text-xs text-slate-500">{req.user_name}</div>
                              )}
                            </td>
                            <td className="py-3 px-4 text-xs text-slate-500 tabular-nums">
                              <div>{new Date(req.created_at).toLocaleDateString()}</div>
                              {req.notified_at && (
                                <div className="text-emerald-700 font-medium">
                                  Notified {new Date(req.notified_at).toLocaleDateString()}
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`px-2 py-0.5 text-xs font-semibold rounded border ${
                                  req.status === 'notified'
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                    : req.status === 'cancelled'
                                    ? 'bg-slate-100 border-slate-200 text-slate-500'
                                    : 'bg-amber-50 border-amber-200 text-amber-800'
                                }`}
                              >
                                {req.status === 'notified'
                                  ? 'Notified'
                                  : req.status === 'cancelled'
                                  ? 'Cancelled'
                                  : 'Waiting'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="inline-flex items-center gap-1.5">
                                {req.status === 'waiting' && linked && (
                                  <button
                                    type="button"
                                    disabled={notifyingProductId === linked.id}
                                    onClick={() =>
                                      currentStock > 0
                                        ? handleNotifyProductWaitlist(linked)
                                        : handleQuickStock(linked, 10)
                                    }
                                    className="px-2.5 py-1 text-xs font-semibold rounded-md bg-slate-900 hover:bg-slate-800 text-white whitespace-nowrap"
                                  >
                                    {currentStock > 0 ? 'Notify Now' : 'Restock +10 & Notify'}
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleDeleteRestockRequest(req.id)}
                                  className="p-1.5 rounded-md border border-rose-200 text-rose-600 hover:bg-rose-50"
                                  title="Delete Waitlist Request"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* CUSTOM BRANDS TAB */}
        {subTab === 'brands' && (
          <div className="space-y-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="text-sm font-bold text-slate-900">Custom Brands &amp; Label Directory</div>
                <div className="text-xs text-slate-500">
                  Create your own cricket, multi-sport, academy, or tournament equipment brands alongside SG, SS, MRF, and Kookaburra.
                </div>
              </div>
              <button
                onClick={openCreateBrandModal}
                className="px-4 py-2 text-xs font-semibold bg-[#d11a2a] text-white rounded-lg hover:bg-[#b51523] flex items-center gap-1.5 whitespace-nowrap shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Custom Brand
              </button>
            </div>

            {brands.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl p-12 text-center space-y-3">
                <Award className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-sm font-semibold text-slate-700">No custom brands added yet</p>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Add custom gear brands with optional logo badges, origin details, and hologram serial prefixes. Custom brands appear automatically in product creation and storefront filters.
                </p>
                <button
                  onClick={openCreateBrandModal}
                  className="px-4 py-2 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800"
                >
                  Create First Custom Brand
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {brands.map((b) => {
                  const skuCount = products.filter((p) => p.brand.toLowerCase() === b.name.toLowerCase()).length;
                  return (
                    <div key={b.id} className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between gap-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-11 h-11 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                              {b.logo_url ? (
                                <img
                                  src={b.logo_url}
                                  alt={b.name}
                                  referrerPolicy="no-referrer"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="text-sm font-bold text-slate-700 uppercase">
                                  {b.name.slice(0, 2)}
                                </span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-base text-slate-900 truncate">{b.name}</div>
                              <div className="text-xs text-slate-500 truncate">
                                {b.domain === 'All' ? 'All Store Sections' : b.domain}
                                {b.origin ? ` · ${b.origin}` : ''}
                              </div>
                            </div>
                          </div>
                          <span className={`text-xs font-semibold shrink-0 ${b.is_active ? 'text-emerald-600' : 'text-slate-400'}`}>
                            {b.is_active ? 'Active' : 'Paused'}
                          </span>
                        </div>

                        {b.description && (
                          <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">{b.description}</p>
                        )}

                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-mono tabular-nums pt-1">
                          <span>{skuCount} {skuCount === 1 ? 'product' : 'products'}</span>
                          {b.authenticity_prefix && (
                            <span>· Prefix: {b.authenticity_prefix}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={async () => {
                            await StoreService.saveBrand({ ...b, is_active: !b.is_active });
                            await loadAll();
                          }}
                          className="text-xs font-semibold text-slate-700 hover:text-slate-900"
                        >
                          {b.is_active ? 'Pause Brand' : 'Activate Brand'}
                        </button>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openEditBrandModal(b)}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                            title="Edit Custom Brand"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteBrand(b)}
                            className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50"
                            title="Delete Custom Brand"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ORDERS TAB */}
        {subTab === 'orders' && (
          <div className="space-y-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm font-semibold text-slate-800">
                Customer Orders &amp; Dispatch Queue · {metrics.totalUnitsOrdered} total units ordered
              </div>
              <select
                value={orderStatusFilter}
                onChange={(e) => setOrderStatusFilter(e.target.value as any)}
                className="px-3 py-2 text-xs font-semibold border border-slate-200 rounded-lg bg-white text-slate-700"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing / Knocking</option>
                <option value="packed">Packed</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {filteredOrders.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-sm text-slate-500">
                No store orders found yet. Orders placed in the storefront appear here in real time.
              </div>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map((order) => {
                  const orderUnits = (order.items || []).reduce((s, it) => s + (Number(it.quantity) || 0), 0);
                  return (
                    <div key={order.id} className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pb-3 border-b border-slate-100">
                        <div>
                          <div className="flex items-center gap-2 text-sm font-bold text-slate-900 font-mono">
                            <span>{order.order_number}</span>
                            <span className="text-slate-300">·</span>
                            <span className="font-sans font-semibold text-slate-600">{order.customer_name}</span>
                            <span className="text-slate-300">·</span>
                            <span className="font-sans text-xs font-semibold text-slate-500 tabular-nums">
                              {orderUnits} {orderUnits === 1 ? 'unit' : 'units'}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 mt-1">
                            {new Date(order.created_at).toLocaleString()} · {order.payment_method.toUpperCase()} ({order.payment_status}) · Total:{' '}
                            <span className="font-mono font-semibold text-slate-900">
                              {formatCurrency(order.total, order.currency)}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              placeholder="Tracking ID / AWB..."
                              value={trackingDrafts[order.id] ?? order.tracking_number ?? ''}
                              onChange={(e) => setTrackingDrafts((prev) => ({ ...prev, [order.id]: e.target.value }))}
                              className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg font-mono w-40"
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveTrackingOnly(order)}
                              className="px-2.5 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg bg-white hover:bg-slate-50 text-slate-700"
                            >
                              Save ID
                            </button>
                          </div>
                          <select
                            value={order.status}
                            onChange={(e) => handleOrderStatusChange(order.id, e.target.value as OrderStatus)}
                            className="px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg bg-slate-50 text-slate-800"
                          >
                            <option value="pending">Pending</option>
                            <option value="processing">Processing / Knocking</option>
                            <option value="packed">Packed</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div className="space-y-1.5">
                          <div className="font-semibold text-slate-500 uppercase tracking-wider">Items Ordered</div>
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between py-1 border-b border-slate-100 last:border-0">
                              <div>
                                <span className="font-semibold text-slate-800">{item.quantity}x {item.name}</span>
                                <div className="text-slate-500">
                                  {item.brand} · Size: {item.selected_size}
                                  {item.selected_hand ? ` · ${item.selected_hand}` : ''}
                                  {item.include_knocking ? ' · + Bat Knocking & Oiling' : ''}
                                  {item.custom_print ? ` · Custom Print: ${item.custom_print}` : ''}
                                </div>
                              </div>
                              <span className="font-mono font-semibold text-slate-800 shrink-0 ml-3">
                                {formatCurrency(item.unit_price * item.quantity, order.currency)}
                              </span>
                            </div>
                          ))}
                        </div>
                        <div className="space-y-1.5">
                          <div className="font-semibold text-slate-500 uppercase tracking-wider">Shipping &amp; Settlement</div>
                          <div className="text-slate-700 leading-relaxed">
                            <div>{order.customer_name} ({order.customer_phone || 'No phone'})</div>
                            <div>{order.customer_email}</div>
                            <div>
                              {order.shipping_address?.line1}, {order.shipping_address?.city},{' '}
                              {order.shipping_address?.state} {order.shipping_address?.postal_code},{' '}
                              {order.shipping_address?.country}
                            </div>
                          </div>
                          {(order.receiving_account_label || order.payment_reference || order.payer_bank_name) && (
                            <div className="mt-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1 text-[11px]">
                              {order.receiving_account_label && (
                                <div className="text-slate-700">
                                  Receiving A/C: <strong className="text-slate-900">{order.receiving_account_label}</strong>
                                </div>
                              )}
                              {order.payer_bank_name && (
                                <div className="text-slate-600">Sender Bank: {order.payer_bank_name}</div>
                              )}
                              {order.payment_reference && (
                                <div className="font-mono text-slate-800">UTR / Ref: {order.payment_reference}</div>
                              )}
                              {order.payment_status === 'awaiting_verification' && (
                                <button
                                  type="button"
                                  onClick={() => handleVerifyOrderPayment(order)}
                                  className="mt-1 px-2.5 py-1 text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded flex items-center gap-1"
                                >
                                  <Check className="w-3 h-3" />
                                  Verify Bank Transfer &amp; Mark Paid
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* REVIEWS MODERATION TAB */}
        {subTab === 'reviews' && (
          <div className="space-y-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <div className="text-sm font-bold text-slate-900">Customer Reviews &amp; Ratings</div>
                <div className="text-xs text-slate-500 tabular-nums">
                  {reviews.length} total reviews · Storewide rating:{' '}
                  {metrics.totalReviews > 0 ? `${metrics.avgStoreRating.toFixed(1)} / 5.0` : 'No ratings yet'}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={reviewProductFilter}
                  onChange={(e) => setReviewProductFilter(e.target.value)}
                  className="px-3 py-2 text-xs font-semibold border border-slate-200 rounded-lg bg-white text-slate-700 max-w-[240px]"
                >
                  <option value="all">All Products</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <select
                  value={reviewStarFilter}
                  onChange={(e) => setReviewStarFilter(e.target.value)}
                  className="px-3 py-2 text-xs font-semibold border border-slate-200 rounded-lg bg-white text-slate-700"
                >
                  <option value="all">All Ratings</option>
                  <option value="5">5 Stars</option>
                  <option value="4">4 Stars</option>
                  <option value="3">3 Stars</option>
                  <option value="2">2 Stars</option>
                  <option value="1">1 Star</option>
                </select>
              </div>
            </div>

            {filteredReviews.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-sm text-slate-500">
                No customer reviews match the current filter. Real buyer reviews submitted on product pages appear here automatically.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredReviews.map((rev) => {
                  const prod = productNameMap[rev.product_id];
                  return (
                    <div key={rev.id} className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="space-y-1.5 min-w-0">
                        <div className="text-xs text-slate-500 font-medium">
                          {prod ? `${prod.brand} · ${prod.name} (${prod.sku})` : `Product ID: ${rev.product_id}`}
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: rev.rating }).map((_, idx) => (
                              <Star key={idx} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            ))}
                          </div>
                          <span className="text-sm font-bold text-slate-900">{rev.title}</span>
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed">{rev.comment}</p>
                        <div className="text-xs text-slate-400 pt-1">
                          By <span className="font-semibold text-slate-600">{rev.user_name}</span>
                          {rev.verified_purchase ? ' · Verified Purchaser' : ''}
                          {rev.verified_order_number ? ` (${rev.verified_order_number})` : ''} ·{' '}
                          {new Date(rev.created_at).toLocaleString()}
                          {rev.updated_at ? ' · Edited' : ''}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteReview(rev.id)}
                        className="px-3 py-1.5 text-xs font-semibold text-rose-600 border border-rose-200 rounded-lg hover:bg-rose-50 shrink-0 self-start"
                      >
                        Remove Review
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* COUPONS TAB */}
        {subTab === 'coupons' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl p-4">
              <div>
                <div className="text-sm font-bold text-slate-900">Store Promo Codes</div>
                <div className="text-xs text-slate-500">Create and manage active promo codes for checkout discounts.</div>
              </div>
              <button
                onClick={() => setIsCouponModalOpen(true)}
                className="px-4 py-2 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800 flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Create Coupon
              </button>
            </div>
            {coupons.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-sm text-slate-500">
                No promo coupons configured yet. Click &quot;Create Coupon&quot; to publish a discount code.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {coupons.map((c) => (
                  <div key={c.id} className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between gap-4">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-base font-bold text-slate-900">{c.code}</span>
                        <span className={`text-xs font-semibold ${c.is_active ? 'text-emerald-600' : 'text-slate-400'}`}>
                          {c.is_active ? 'Active' : 'Paused'}
                        </span>
                      </div>
                      <div className="text-sm font-semibold text-[#d11a2a] mt-1 tabular-nums">
                        {c.discount_type === 'percent' ? `${c.value}% Off` : `$${c.value} Flat Off`}
                      </div>
                      <p className="text-xs text-slate-500 mt-1.5">{c.description}</p>
                      <div className="text-xs text-slate-400 mt-2 font-mono">Min order: ${c.min_order_usd} USD</div>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                      <button
                        onClick={async () => {
                          await StoreService.saveCoupon({ ...c, is_active: !c.is_active });
                          await loadAll();
                        }}
                        className="text-xs font-semibold text-slate-700 hover:text-slate-900"
                      >
                        {c.is_active ? 'Pause Code' : 'Activate Code'}
                      </button>
                      <button
                        onClick={async () => {
                          await StoreService.deleteCoupon(c.id);
                          await loadAll();
                        }}
                        className="text-xs font-semibold text-rose-600 hover:text-rose-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* AUTHENTICITY TAB */}
        {subTab === 'authenticity' && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
            <div>
              <h3 className="text-base font-bold text-slate-900">Manufacturer Hologram &amp; Serial Registry</h3>
              <p className="text-xs text-slate-500 mt-1">
                Test or audit registered serial prefixes attached to active catalog items.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 max-w-lg">
              <input
                type="text"
                value={serialCheckInput}
                onChange={(e) => setSerialCheckInput(e.target.value.toUpperCase())}
                placeholder="Enter serial e.g. SG-PRO-88412"
                className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg font-mono"
              />
                <button
                  onClick={() => {
                    const matchProd = products.find(
                      (p) =>
                        p.authenticity_prefix &&
                        serialCheckInput.startsWith(p.authenticity_prefix.toUpperCase())
                    );
                    const matchBrand = brands.find(
                      (b) =>
                        b.authenticity_prefix &&
                        serialCheckInput.startsWith(b.authenticity_prefix.toUpperCase())
                    );
                    if (matchProd) {
                      showToast(`Verified genuine ${matchProd.brand} gear (${matchProd.name}).`);
                    } else if (matchBrand) {
                      showToast(`Verified genuine ${matchBrand.name} registered custom brand serial.`);
                    } else {
                      showToast('Serial prefix not matched in active registry.', 'error');
                    }
                  }}
                  className="px-4 py-2 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800 whitespace-nowrap"
                >
                  Verify Serial
                </button>
            </div>
            {products.length === 0 && brands.filter((b) => b.authenticity_prefix).length === 0 ? (
              <p className="text-xs text-slate-500">Add catalog products or custom brands with authenticity serial prefixes to populate the registry.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                {brands
                  .filter((b) => b.authenticity_prefix)
                  .map((b) => (
                    <div key={b.id} className="border border-slate-200 rounded-lg p-3 text-xs bg-slate-50/60">
                      <div className="font-mono font-bold text-slate-900">{b.authenticity_prefix}-XXXXX</div>
                      <div className="font-semibold text-slate-700 mt-1 truncate">{b.name} (Custom Brand)</div>
                      <div className="text-slate-400 mt-0.5">{b.origin || b.domain}</div>
                    </div>
                  ))}
                {products.map((p) => (
                  <div key={p.id} className="border border-slate-200 rounded-lg p-3 text-xs">
                    <div className="font-mono font-bold text-slate-900">{p.authenticity_prefix || 'SL-GEAR'}-XXXXX</div>
                    <div className="font-semibold text-slate-700 mt-1 truncate">{p.name}</div>
                    <div className="text-slate-400 mt-0.5">{p.brand} · SKU {p.sku}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* STORE ANALYTICS TAB */}
        {subTab === 'analytics' && (
          <StoreAnalyticsDashboard
            products={products}
            orders={orders}
            reviews={reviews}
            analyticsEvents={analyticsEvents}
            onOpenProductEdit={(prod) => openEditModal(prod)}
            onJumpToCatalog={() => setSubTab('catalog')}
          />
        )}

        {/* BANK & PAYOUT ACCOUNTS TAB */}
        {subTab === 'payouts' && (() => {
          const bankList = payoutAccounts.filter((a) => a.account_type === 'bank_transfer');
          const upiList = payoutAccounts.filter((a) => a.account_type === 'upi');
          const paypalList = payoutAccounts.filter((a) => a.account_type === 'paypal');
          const customQrList = payoutAccounts.filter((a) => a.account_type === 'custom_qr');
          const rzpList = payoutAccounts.filter((a) => a.account_type === 'razorpay');
          const stripeList = payoutAccounts.filter((a) => a.account_type === 'stripe');

          const activePrimaryOf = (list: StorePayoutAccount[]) =>
            list.find((a) => a.is_primary && a.is_active) || list.find((a) => a.is_active);

          const filteredPayouts = payoutAccounts.filter(
            (a) => payoutFilterType === 'all' || a.account_type === payoutFilterType
          );

          const awaitingVerificationOrders = orders.filter(
            (o) => o.payment_status === 'awaiting_verification' && o.status !== 'cancelled'
          );

          return (
            <div className="space-y-6">
              {/* Top Action Header */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Admin Bank Details, Payment QR Codes &amp; Receiving Accounts
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-2xl">
                    Configure where buyers send money during checkout—including direct Bank Accounts, UPI QR, PayPal, Custom Payment QR codes, Razorpay, or Stripe. Upload your own QR image or auto-generate scannable QR codes from any link or VPA.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => openCreatePayoutModal('bank_transfer')}
                    className="px-3.5 py-2 text-xs font-semibold bg-[#d11a2a] hover:bg-[#b51523] text-white rounded-lg flex items-center gap-1.5 whitespace-nowrap"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Bank Account
                  </button>
                  <button
                    type="button"
                    onClick={() => openCreatePayoutModal('custom_qr')}
                    className="px-3.5 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg flex items-center gap-1.5 whitespace-nowrap"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    Add Payment QR
                  </button>
                  <button
                    type="button"
                    onClick={() => openCreatePayoutModal('upi')}
                    className="px-3.5 py-2 text-xs font-semibold border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 rounded-lg flex items-center gap-1.5 whitespace-nowrap"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add UPI QR
                  </button>
                  <button
                    type="button"
                    onClick={() => openCreatePayoutModal('paypal')}
                    className="px-3.5 py-2 text-xs font-semibold border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 rounded-lg flex items-center gap-1.5 whitespace-nowrap"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add PayPal
                  </button>
                  <button
                    type="button"
                    onClick={() => openCreatePayoutModal('razorpay')}
                    className="px-3.5 py-2 text-xs font-semibold border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 rounded-lg flex items-center gap-1.5 whitespace-nowrap"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Razorpay
                  </button>
                  <button
                    type="button"
                    onClick={() => openCreatePayoutModal('stripe')}
                    className="px-3.5 py-2 text-xs font-semibold border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 rounded-lg flex items-center gap-1.5 whitespace-nowrap"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Stripe
                  </button>
                </div>
              </div>

              {/* Quick-Switch Active Channels Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {[
                  {
                    type: 'bank_transfer' as StorePayoutAccountType,
                    title: 'Direct Bank Transfer',
                    sub: 'NEFT / IMPS / Wire / ACH',
                    icon: Landmark,
                    list: bankList,
                    primary: activePrimaryOf(bankList),
                  },
                  {
                    type: 'upi' as StorePayoutAccountType,
                    title: 'Direct UPI & QR',
                    sub: 'Zero-fee VPA / Bank App QR',
                    icon: Smartphone,
                    list: upiList,
                    primary: activePrimaryOf(upiList),
                  },
                  {
                    type: 'paypal' as StorePayoutAccountType,
                    title: 'PayPal & QR Transfer',
                    sub: 'PayPal.me / Global Direct QR',
                    icon: Link2,
                    list: paypalList,
                    primary: activePrimaryOf(paypalList),
                  },
                  {
                    type: 'custom_qr' as StorePayoutAccountType,
                    title: 'Custom Merchant QR',
                    sub: 'Uploaded QR / Wallet / Wise / Link',
                    icon: QrCode,
                    list: customQrList,
                    primary: activePrimaryOf(customQrList),
                  },
                  {
                    type: 'razorpay' as StorePayoutAccountType,
                    title: 'Razorpay Settlement',
                    sub: 'Cards / Netbanking / UPI',
                    icon: CreditCard,
                    list: rzpList,
                    primary: activePrimaryOf(rzpList),
                  },
                  {
                    type: 'stripe' as StorePayoutAccountType,
                    title: 'Stripe Payouts',
                    sub: 'Global Card Processing',
                    icon: CreditCard,
                    list: stripeList,
                    primary: activePrimaryOf(stripeList),
                  },
                ].map((channel) => {
                  const Icon = channel.icon;
                  return (
                    <div key={channel.type} className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between gap-3">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${channel.primary ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'}`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="text-xs font-bold text-slate-900">{channel.title}</div>
                              <div className="text-[11px] text-slate-500">{channel.sub}</div>
                            </div>
                          </div>
                          <span className={`text-[11px] font-semibold ${channel.primary ? 'text-emerald-700' : 'text-slate-400'}`}>
                            {channel.primary ? 'Live' : 'Unset'}
                          </span>
                        </div>

                        {channel.primary ? (
                          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs flex items-center justify-between gap-2.5">
                            <div className="min-w-0 space-y-0.5">
                              <div className="font-bold text-slate-900 truncate">{channel.primary.label}</div>
                              <div className="text-slate-600 truncate">{channel.primary.account_holder_name}</div>
                              {channel.primary.bank_name && (
                                <div className="text-[11px] font-mono text-slate-500 truncate">
                                  {channel.primary.bank_name}
                                  {channel.primary.account_number
                                    ? ` · ••••${channel.primary.account_number.slice(-4)}`
                                    : ''}
                                </div>
                              )}
                              {channel.primary.upi_id && (
                                <div className="text-[11px] font-mono text-slate-700 truncate">{channel.primary.upi_id}</div>
                              )}
                              {(channel.primary.paypal_handle || channel.primary.payment_link) && (
                                <div className="text-[11px] font-mono text-slate-700 truncate">
                                  {channel.primary.paypal_handle || channel.primary.payment_link}
                                </div>
                              )}
                              {(channel.primary.razorpay_key_id || channel.primary.razorpay_account_id) && (
                                <div className="text-[11px] font-mono text-slate-600 truncate">
                                  {channel.primary.razorpay_account_id || channel.primary.razorpay_key_id}
                                </div>
                              )}
                            </div>
                            {channel.primary.qr_code_url && (
                              <img
                                src={channel.primary.qr_code_url}
                                alt={`${channel.primary.label} QR`}
                                referrerPolicy="no-referrer"
                                className="w-12 h-12 rounded border border-slate-200 bg-white p-0.5 object-contain shrink-0"
                              />
                            )}
                          </div>
                        ) : (
                          <div className="p-2.5 rounded-lg border border-dashed border-slate-200 text-[11px] text-slate-500">
                            No active account configured. Add one to accept {channel.title.toLowerCase()}.
                          </div>
                        )}
                      </div>

                      {channel.list.length > 0 ? (
                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold uppercase tracking-wide text-slate-500">
                            Quick-Switch Active Account
                          </label>
                          <select
                            value={channel.primary?.id || ''}
                            onChange={(e) => {
                              if (e.target.value) handleSwitchPrimaryPayout(e.target.value);
                            }}
                            className="w-full px-2.5 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg bg-white text-slate-800"
                          >
                            {!channel.primary && <option value="">Select receiving account...</option>}
                            {channel.list.map((acc) => (
                              <option key={acc.id} value={acc.id}>
                                {acc.label} ({acc.currency_scope})
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => openCreatePayoutModal(channel.type)}
                          className="w-full py-1.5 text-xs font-semibold border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50"
                        >
                          Configure {channel.title}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Pending Bank Transfer Verification Queue */}
              {awaitingVerificationOrders.length > 0 && (
                <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-bold text-slate-900">
                      Buyer Bank / QR Transfers Pending Verification ({awaitingVerificationOrders.length})
                    </div>
                    <button
                      type="button"
                      onClick={() => setSubTab('orders')}
                      className="text-xs font-semibold text-slate-900 underline"
                    >
                      View in Orders Queue
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {awaitingVerificationOrders.slice(0, 6).map((ord) => (
                      <div key={ord.id} className="bg-white border border-amber-200 rounded-lg p-3 flex items-center justify-between gap-3 text-xs">
                        <div className="min-w-0 space-y-0.5">
                          <div className="font-mono font-bold text-slate-900">
                            {ord.order_number} · {formatCurrency(ord.total, ord.currency)}
                          </div>
                          <div className="text-slate-600 truncate">
                            {ord.customer_name} {ord.payer_bank_name ? `(${ord.payer_bank_name})` : ''}
                          </div>
                          <div className="font-mono text-[11px] text-slate-500 truncate">
                            Ref: {ord.payment_reference || 'N/A'} → {ord.receiving_account_label || 'Admin Bank'}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleVerifyOrderPayment(ord)}
                          className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shrink-0 whitespace-nowrap"
                        >
                          Confirm Receipt
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Saved Accounts Filter & Grid */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  {[
                    { id: 'all', label: `All Accounts (${payoutAccounts.length})` },
                    { id: 'bank_transfer', label: `Bank Accounts (${bankList.length})` },
                    { id: 'upi', label: `UPI QR (${upiList.length})` },
                    { id: 'paypal', label: `PayPal (${paypalList.length})` },
                    { id: 'custom_qr', label: `Custom QR (${customQrList.length})` },
                    { id: 'razorpay', label: `Razorpay (${rzpList.length})` },
                    { id: 'stripe', label: `Stripe (${stripeList.length})` },
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setPayoutFilterType(f.id as any)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap ${
                        payoutFilterType === f.id
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {filteredPayouts.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-xl p-12 text-center space-y-3">
                  <Landmark className="w-9 h-9 text-slate-300 mx-auto" />
                  <div className="text-sm font-semibold text-slate-800">No receiving bank or QR payment accounts added yet</div>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Add your business bank account, UPI QR, PayPal link/QR, Custom Merchant QR, or Razorpay/Stripe settlement profile so buyers can pay directly at checkout.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => openCreatePayoutModal('bank_transfer')}
                      className="px-4 py-2 text-xs font-semibold bg-[#d11a2a] text-white rounded-lg hover:bg-[#b51523]"
                    >
                      + Add Bank Account
                    </button>
                    <button
                      type="button"
                      onClick={() => openCreatePayoutModal('custom_qr')}
                      className="px-4 py-2 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800"
                    >
                      + Upload or Generate Payment QR
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredPayouts.map((acc) => {
                    const isRevealed = Boolean(revealedAccountIds[acc.id]);
                    const maskedNum =
                      acc.account_number && !isRevealed && acc.account_number.length > 4
                        ? `${'•'.repeat(Math.max(4, acc.account_number.length - 4))}${acc.account_number.slice(-4)}`
                        : acc.account_number;
                    const typeTitle =
                      acc.account_type === 'bank_transfer'
                        ? 'Bank Account'
                        : acc.account_type === 'razorpay'
                        ? 'Razorpay Account'
                        : acc.account_type === 'upi'
                        ? 'Direct UPI & QR'
                        : acc.account_type === 'paypal'
                        ? 'PayPal & QR'
                        : acc.account_type === 'custom_qr'
                        ? 'Custom Payment QR'
                        : 'Stripe Settlement';

                    return (
                      <div
                        key={acc.id}
                        className={`bg-white rounded-xl p-5 border flex flex-col justify-between gap-4 ${
                          acc.is_primary && acc.is_active
                            ? 'border-emerald-300 ring-1 ring-emerald-200'
                            : 'border-slate-200'
                        }`}
                      >
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                                  {typeTitle}
                                </span>
                                <span className="text-slate-300">·</span>
                                <span className="text-[11px] font-mono text-slate-600">{acc.currency_scope}</span>
                                {acc.qr_code_url && (
                                  <>
                                    <span className="text-slate-300">·</span>
                                    <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                                      <QrCode className="w-3 h-3" /> QR Ready
                                    </span>
                                  </>
                                )}
                              </div>
                              <h4 className="text-sm font-bold text-slate-900 mt-0.5 truncate">{acc.label}</h4>
                              <div className="text-xs text-slate-600">Holder: {acc.account_holder_name}</div>
                            </div>

                            <div className="text-right shrink-0">
                              {acc.is_primary && acc.is_active ? (
                                <span className="px-2 py-0.5 text-[11px] font-bold rounded bg-emerald-50 border border-emerald-200 text-emerald-700">
                                  Primary Active
                                </span>
                              ) : acc.is_active ? (
                                <span className="px-2 py-0.5 text-[11px] font-semibold rounded bg-slate-100 text-slate-700">
                                  Standby
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 text-[11px] font-semibold rounded bg-rose-50 text-rose-700">
                                  Paused
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-start justify-between gap-3 text-xs">
                            <div className="flex-1 min-w-0 space-y-1.5">
                              {acc.bank_name && (
                                <div className="flex justify-between gap-2">
                                  <span className="text-slate-500">Bank:</span>
                                  <span className="font-semibold text-slate-800 truncate">{acc.bank_name}{acc.branch_name ? ` (${acc.branch_name})` : ''}</span>
                                </div>
                              )}
                              {acc.account_number && (
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-slate-500">Account #:</span>
                                  <div className="flex items-center gap-1.5 font-mono font-semibold text-slate-900">
                                    <span>{maskedNum}</span>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setRevealedAccountIds((prev) => ({ ...prev, [acc.id]: !prev[acc.id] }))
                                      }
                                      className="text-slate-400 hover:text-slate-800"
                                      title={isRevealed ? 'Hide account number' : 'Reveal account number'}
                                    >
                                      {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                    </button>
                                  </div>
                                </div>
                              )}
                              {acc.ifsc_or_routing && (
                                <div className="flex justify-between gap-2">
                                  <span className="text-slate-500">IFSC / Routing / SWIFT:</span>
                                  <span className="font-mono font-semibold text-slate-800">{acc.ifsc_or_routing}</span>
                                </div>
                              )}
                              {acc.upi_id && (
                                <div className="flex justify-between gap-2">
                                  <span className="text-slate-500">UPI VPA:</span>
                                  <span className="font-mono font-semibold text-slate-900 truncate">{acc.upi_id}</span>
                                </div>
                              )}
                              {acc.paypal_handle && (
                                <div className="flex justify-between gap-2">
                                  <span className="text-slate-500">PayPal ID / Link:</span>
                                  <span className="font-mono font-semibold text-slate-900 truncate">{acc.paypal_handle}</span>
                                </div>
                              )}
                              {acc.payment_link && (
                                <div className="flex justify-between gap-2">
                                  <span className="text-slate-500">Pay Link:</span>
                                  <span className="font-mono text-slate-700 truncate max-w-[180px]">{acc.payment_link}</span>
                                </div>
                              )}
                              {acc.qr_payload && !acc.upi_id && !acc.payment_link && (
                                <div className="flex justify-between gap-2">
                                  <span className="text-slate-500">QR Payload:</span>
                                  <span className="font-mono text-slate-700 truncate max-w-[180px]">{acc.qr_payload}</span>
                                </div>
                              )}
                              {acc.razorpay_key_id && (
                                <div className="flex justify-between gap-2">
                                  <span className="text-slate-500">Razorpay Key ID:</span>
                                  <span className="font-mono text-slate-800">{acc.razorpay_key_id}</span>
                                </div>
                              )}
                              {acc.razorpay_account_id && (
                                <div className="flex justify-between gap-2">
                                  <span className="text-slate-500">Route Account ID:</span>
                                  <span className="font-mono text-slate-800">{acc.razorpay_account_id}</span>
                                </div>
                              )}
                              {acc.instructions && (
                                <div className="pt-1 border-t border-slate-200/70 text-[11px] text-slate-600">
                                  {acc.instructions}
                                </div>
                              )}
                            </div>

                            {acc.qr_code_url && (
                              <div className="shrink-0 flex flex-col items-center gap-1">
                                <img
                                  src={acc.qr_code_url}
                                  alt={`${acc.label} Payment QR`}
                                  referrerPolicy="no-referrer"
                                  className="w-16 h-16 rounded-lg border border-slate-200 bg-white p-1 object-contain"
                                />
                                <a
                                  href={acc.qr_code_url}
                                  download={`${acc.label.replace(/\s+/g, '_').toLowerCase()}_qr.png`}
                                  className="text-[10px] font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-0.5"
                                >
                                  <Download className="w-2.5 h-2.5" /> PNG
                                </a>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100">
                          <div className="flex items-center gap-2">
                            {!(acc.is_primary && acc.is_active) && (
                              <button
                                type="button"
                                onClick={() => handleSwitchPrimaryPayout(acc.id)}
                                className="px-3 py-1.5 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg whitespace-nowrap"
                              >
                                Set as Primary Active
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleTogglePayoutActive(acc)}
                              className="px-2.5 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 whitespace-nowrap"
                            >
                              {acc.is_active ? 'Pause' : 'Activate'}
                            </button>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => openEditPayoutModal(acc)}
                              title="Edit Account Details"
                              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDuplicatePayoutAccount(acc)}
                              title="Duplicate to Add Backup Account"
                              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeletePayoutAccount(acc)}
                              title="Delete Account"
                              className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* ADD / EDIT PRODUCT MODAL */}
      {isProductModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveProduct}
            className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]"
          >
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <Package className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base">
                  {editingProductId ? 'Edit Store Gear' : 'Add New Cricket / Sports / Games Gear'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsProductModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Product Title *</label>
                  <input
                    type="text"
                    required
                    value={productForm.name || ''}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    placeholder="e.g. SG Players Edition English Willow Bat"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#d11a2a] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">SKU Code *</label>
                  <input
                    type="text"
                    required
                    value={productForm.sku || ''}
                    onChange={(e) => setProductForm({ ...productForm, sku: e.target.value.toUpperCase() })}
                    placeholder="e.g. SG-PE-2026"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg font-mono focus:ring-2 focus:ring-[#d11a2a] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Store Section</label>
                  <select
                    value={productForm.domain || 'Cricket'}
                    onChange={(e) => {
                      const nextDomain = e.target.value as StoreDomain;
                      const cats = STORE_CATEGORIES_BY_DOMAIN[nextDomain] || ['General'];
                      const sports = STORE_SPORTS_BY_DOMAIN[nextDomain] || ALL_STORE_SPORTS;
                      setCustomCategory('');
                      setCustomSport('');
                      setProductForm({
                        ...productForm,
                        domain: nextDomain,
                        category: cats[0],
                        sport_type: sports[0] || 'General Sport',
                      });
                    }}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white"
                  >
                    {STORE_PRIMARY_DOMAINS.map((dom) => (
                      <option key={dom} value={dom}>{dom}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Category</label>
                  <select
                    value={productForm.category || ''}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white"
                  >
                    {(STORE_CATEGORIES_BY_DOMAIN[productForm.domain || 'Cricket'] || ['General']).map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                    <option value="__custom__">+ Custom Category</option>
                  </select>
                  {productForm.category === '__custom__' && (
                    <input
                      type="text"
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      placeholder="Enter category name"
                      className="mt-1.5 w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg"
                    />
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Brand</label>
                  <select
                    value={productForm.brand || 'SG'}
                    onChange={(e) => {
                      const val = e.target.value;
                      const matchedBrand = brands.find((b) => b.name === val);
                      setProductForm((prev) => ({
                        ...prev,
                        brand: val,
                        authenticity_prefix:
                          matchedBrand?.authenticity_prefix
                            ? matchedBrand.authenticity_prefix
                            : prev.authenticity_prefix,
                      }));
                    }}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white"
                  >
                    <optgroup label="Official Standard Brands">
                      {STORE_BRANDS.map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </optgroup>
                    {customBrandNames.length > 0 && (
                      <optgroup label="Custom Brands">
                        {customBrandNames.map((b) => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                      </optgroup>
                    )}
                    <option value="Custom">+ New Custom Brand</option>
                  </select>
                  {productForm.brand === 'Custom' && (
                    <div className="mt-1.5 space-y-1.5">
                      <input
                        type="text"
                        value={customBrand}
                        onChange={(e) => setCustomBrand(e.target.value)}
                        placeholder="Enter custom brand name"
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg"
                      />
                      <label className="flex items-center gap-1.5 text-[11px] text-slate-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={saveInlineCustomBrand}
                          onChange={(e) => setSaveInlineCustomBrand(e.target.checked)}
                        />
                        Save to Custom Brands directory
                      </label>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Sport / Game</label>
                  <select
                    value={productForm.sport_type || 'Cricket'}
                    onChange={(e) => setProductForm({ ...productForm, sport_type: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white"
                  >
                    <optgroup label={`${productForm.domain || 'Selected'} Sports & Games`}>
                      {(STORE_SPORTS_BY_DOMAIN[productForm.domain || 'Cricket'] || []).map((sp) => (
                        <option key={`dom-${sp}`} value={sp}>{sp}</option>
                      ))}
                    </optgroup>
                    <optgroup label="All Sports & Games">
                      {ALL_STORE_SPORTS.filter(
                        (sp) => !(STORE_SPORTS_BY_DOMAIN[productForm.domain || 'Cricket'] || []).includes(sp)
                      ).map((sp) => (
                        <option key={`all-${sp}`} value={sp}>{sp}</option>
                      ))}
                    </optgroup>
                    <option value="__custom__">+ Custom Sport / Game</option>
                  </select>
                  {productForm.sport_type === '__custom__' && (
                    <input
                      type="text"
                      value={customSport}
                      onChange={(e) => setCustomSport(e.target.value)}
                      placeholder="e.g. Sepak Takraw, Archery, Monopoly..."
                      className="mt-1.5 w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg"
                    />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Sale Price (USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={productForm.price_usd ?? 0}
                    onChange={(e) => setProductForm({ ...productForm, price_usd: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">MRP (USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={productForm.mrp_usd ?? 0}
                    onChange={(e) => setProductForm({ ...productForm, mrp_usd: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Sale Price (INR)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={productForm.price_inr ?? 0}
                    onChange={(e) => setProductForm({ ...productForm, price_inr: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">MRP (INR)</label>
                  <input
                    type="number"
                    min="0"
                    value={productForm.mrp_inr ?? 0}
                    onChange={(e) => setProductForm({ ...productForm, mrp_inr: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Stock Qty</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={productForm.stock ?? 0}
                    onChange={(e) => setProductForm({ ...productForm, stock: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Custom Low-Stock Alert Threshold (Optional)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="10000"
                    value={productForm.low_stock_threshold ?? ''}
                    onChange={(e) =>
                      setProductForm({
                        ...productForm,
                        low_stock_threshold: e.target.value === '' ? undefined : Math.max(0, parseInt(e.target.value, 10) || 0),
                      })
                    }
                    placeholder={`Leave blank to use auto rule (Popular ≤ ${alertConfig.popular_threshold}, Standard ≤ ${alertConfig.default_threshold})`}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-600">Product Image (Preset, URL, or Upload)</label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={productForm.image_url || ''}
                    onChange={(e) => setProductForm({ ...productForm, image_url: e.target.value })}
                    placeholder="Image URL or select preset below"
                    className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono"
                  />
                  <label className="px-3 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg cursor-pointer flex items-center gap-1.5 whitespace-nowrap">
                    <Upload className="w-3.5 h-3.5" />
                    Upload Photo
                    <input type="file" accept="image/*" onChange={handleImageFileUpload} className="hidden" />
                  </label>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {STORE_PRESET_IMAGES.map((preset) => (
                    <button
                      type="button"
                      key={preset.label}
                      onClick={() => setProductForm({ ...productForm, image_url: preset.url })}
                      className={`px-2.5 py-1 text-xs rounded-md border transition-colors ${
                        productForm.image_url === preset.url
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Available Sizes (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={productForm.sizesText}
                    onChange={(e) => setProductForm({ ...productForm, sizesText: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                  />
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    <button
                      type="button"
                      onClick={() => setProductForm({ ...productForm, sizesText: 'SH (Short Handle), LH (Long Handle), Harrow, Size 6' })}
                      className="text-[11px] px-2 py-0.5 bg-slate-100 rounded text-slate-600 hover:bg-slate-200"
                    >
                      Bat Sizes
                    </button>
                    <button
                      type="button"
                      onClick={() => setProductForm({ ...productForm, sizesText: 'Size 3, Size 4, Size 5, Size 6, Size 7' })}
                      className="text-[11px] px-2 py-0.5 bg-slate-100 rounded text-slate-600 hover:bg-slate-200"
                    >
                      Ball Sizes (3–7)
                    </button>
                    <button
                      type="button"
                      onClick={() => setProductForm({ ...productForm, sizesText: 'G4 (Medium), G5 (Slim), L2, L3' })}
                      className="text-[11px] px-2 py-0.5 bg-slate-100 rounded text-slate-600 hover:bg-slate-200"
                    >
                      Racket Grips
                    </button>
                    <button
                      type="button"
                      onClick={() => setProductForm({ ...productForm, sizesText: 'XS, S, M, L, XL, XXL' })}
                      className="text-[11px] px-2 py-0.5 bg-slate-100 rounded text-slate-600 hover:bg-slate-200"
                    >
                      Apparel XS–XXL
                    </button>
                    <button
                      type="button"
                      onClick={() => setProductForm({ ...productForm, sizesText: 'US 7, US 8, US 9, US 10, US 11, US 12' })}
                      className="text-[11px] px-2 py-0.5 bg-slate-100 rounded text-slate-600 hover:bg-slate-200"
                    >
                      Footwear
                    </button>
                    <button
                      type="button"
                      onClick={() => setProductForm({ ...productForm, sizesText: 'Club Edition, Tournament Standard, Pro Set' })}
                      className="text-[11px] px-2 py-0.5 bg-slate-100 rounded text-slate-600 hover:bg-slate-200"
                    >
                      Boards &amp; Sets
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Authenticity Serial Prefix</label>
                  <input
                    type="text"
                    value={productForm.authenticity_prefix || ''}
                    onChange={(e) => setProductForm({ ...productForm, authenticity_prefix: e.target.value.toUpperCase() })}
                    placeholder="e.g. SG-PRO, SS-TON"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
                <label className="flex items-center gap-2 font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(productForm.useHandedness)}
                    onChange={(e) => setProductForm({ ...productForm, useHandedness: e.target.checked })}
                  />
                  LH / RH Selector
                </label>
                <label className="flex items-center gap-2 font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(productForm.knocking_available)}
                    onChange={(e) => setProductForm({ ...productForm, knocking_available: e.target.checked })}
                  />
                  Bat Knocking Add-on
                </label>
                <label className="flex items-center gap-2 font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(productForm.custom_print_available)}
                    onChange={(e) => setProductForm({ ...productForm, custom_print_available: e.target.checked })}
                  />
                  Custom Jersey Print
                </label>
                <label className="flex items-center gap-2 font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(productForm.featured)}
                    onChange={(e) => setProductForm({ ...productForm, featured: e.target.checked })}
                  />
                  Feature on Storefront
                </label>
              </div>

              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="text-xs font-semibold text-slate-600">Technical Specifications</label>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(SPEC_TEMPLATES).map(([tplName, tplRows]) => (
                      <button
                        type="button"
                        key={tplName}
                        onClick={() => setProductForm({ ...productForm, specRows: tplRows.map((r) => ({ ...r })) })}
                        className="text-[11px] px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 font-medium"
                      >
                        {tplName} Specs
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  {productForm.specRows.map((row, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={row.key}
                        onChange={(e) => {
                          const next = [...productForm.specRows];
                          next[idx] = { ...next[idx], key: e.target.value };
                          setProductForm({ ...productForm, specRows: next });
                        }}
                        placeholder="Spec name (e.g. Willow Grade)"
                        className="flex-1 px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg"
                      />
                      <input
                        type="text"
                        value={row.value}
                        onChange={(e) => {
                          const next = [...productForm.specRows];
                          next[idx] = { ...next[idx], value: e.target.value };
                          setProductForm({ ...productForm, specRows: next });
                        }}
                        placeholder="Value (e.g. Grade 1 English Willow)"
                        className="flex-1 px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setProductForm({
                            ...productForm,
                            specRows: productForm.specRows.filter((_, i) => i !== idx),
                          })
                        }
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() =>
                      setProductForm({
                        ...productForm,
                        specRows: [...productForm.specRows, { key: '', value: '' }],
                      })
                    }
                    className="text-xs font-semibold text-[#d11a2a] hover:underline"
                  >
                    + Add Specification Row
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Product Description</label>
                  <textarea
                    rows={3}
                    value={productForm.description || ''}
                    onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                    placeholder="Detailed gear craftsmanship, willow seasoning, and match suitability..."
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Key Highlights (one per line)</label>
                  <textarea
                    rows={3}
                    value={productForm.highlightsText}
                    onChange={(e) => setProductForm({ ...productForm, highlightsText: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                  />
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setIsProductModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 text-xs font-semibold text-white bg-[#d11a2a] hover:bg-[#b51523] rounded-lg shadow-sm"
              >
                {saving ? 'Saving...' : editingProductId ? 'Save Changes' : 'Publish to Store'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* CREATE COUPON MODAL */}
      {isCouponModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveCoupon}
            className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-200"
          >
            <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
              <h3 className="font-bold text-base">Create Store Promo Coupon</h3>
              <button type="button" onClick={() => setIsCouponModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Coupon Code *</label>
                <input
                  type="text"
                  required
                  value={couponForm.code}
                  onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. MATCHDAY15"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg font-mono"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Type</label>
                  <select
                    value={couponForm.discount_type}
                    onChange={(e) => setCouponForm({ ...couponForm, discount_type: e.target.value as any })}
                    className="w-full px-2.5 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="percent">% Percent</option>
                    <option value="flat">$ Flat USD</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Value</label>
                  <input
                    type="number"
                    min="1"
                    value={couponForm.value}
                    onChange={(e) => setCouponForm({ ...couponForm, value: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2.5 py-2 text-xs border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Min Order ($)</label>
                  <input
                    type="number"
                    min="0"
                    value={couponForm.min_order_usd}
                    onChange={(e) => setCouponForm({ ...couponForm, min_order_usd: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2.5 py-2 text-xs border border-slate-200 rounded-lg font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Description</label>
                <input
                  type="text"
                  value={couponForm.description}
                  onChange={(e) => setCouponForm({ ...couponForm, description: e.target.value })}
                  placeholder="e.g. Discount on cricket bats & protective kits"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                />
              </div>
            </div>
            <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsCouponModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold bg-white border border-slate-200 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold bg-[#d11a2a] text-white rounded-lg hover:bg-[#b51523]"
              >
                Save Coupon
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ADD / EDIT CUSTOM BRAND MODAL */}
      {isBrandModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveBrand}
            className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-slate-200"
          >
            <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base">
                  {editingBrandId ? 'Edit Custom Brand' : 'Add Custom Brand'}
                </h3>
              </div>
              <button type="button" onClick={() => setIsBrandModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Brand Name *</label>
                  <input
                    type="text"
                    required
                    value={brandForm.name}
                    onChange={(e) => setBrandForm({ ...brandForm, name: e.target.value })}
                    placeholder="e.g. Apex Cricket, Titan Sports"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#d11a2a] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Primary Store Section</label>
                  <select
                    value={brandForm.domain}
                    onChange={(e) => setBrandForm({ ...brandForm, domain: e.target.value as any })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="All">All Sports &amp; Games</option>
                    {STORE_PRIMARY_DOMAINS.map((dom) => (
                      <option key={dom} value={dom}>{dom}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Origin / Specialty</label>
                  <input
                    type="text"
                    value={brandForm.origin}
                    onChange={(e) => setBrandForm({ ...brandForm, origin: e.target.value })}
                    placeholder="e.g. Meerut Willow Craft, USA"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Hologram Serial Prefix</label>
                  <input
                    type="text"
                    value={brandForm.authenticity_prefix}
                    onChange={(e) => setBrandForm({ ...brandForm, authenticity_prefix: e.target.value.toUpperCase() })}
                    placeholder="e.g. APEX-PRO"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-600">Brand Logo (URL or Upload)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={brandForm.logo_url}
                    onChange={(e) => setBrandForm({ ...brandForm, logo_url: e.target.value })}
                    placeholder="https://... or upload logo badge"
                    className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono"
                  />
                  <label className="px-3 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg cursor-pointer flex items-center gap-1.5 whitespace-nowrap">
                    <Upload className="w-3.5 h-3.5" />
                    Upload Logo
                    <input type="file" accept="image/*" onChange={handleBrandLogoUpload} className="hidden" />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Brand Description</label>
                <textarea
                  rows={2}
                  value={brandForm.description}
                  onChange={(e) => setBrandForm({ ...brandForm, description: e.target.value })}
                  placeholder="Short brand story, warranty coverage, or tournament specialization..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                />
              </div>

              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={brandForm.is_active}
                  onChange={(e) => setBrandForm({ ...brandForm, is_active: e.target.checked })}
                />
                Visible in Storefront brand filters
              </label>
            </div>
            <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsBrandModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold bg-white border border-slate-200 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 text-xs font-semibold bg-[#d11a2a] text-white rounded-lg hover:bg-[#b51523]"
              >
                {saving ? 'Saving...' : editingBrandId ? 'Save Brand' : 'Create Custom Brand'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ADD / EDIT ADMIN PAYOUT & BANK ACCOUNT MODAL */}
      {isPayoutModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[1010] flex items-center justify-center p-4">
          <form
            onSubmit={handleSavePayoutAccount}
            className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
          >
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Landmark className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base">
                  {editingPayoutId ? 'Edit Admin Receiving Account & QR' : 'Add Admin Bank / QR / Payout Account'}
                </h3>
              </div>
              <button type="button" onClick={() => setIsPayoutModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              {/* Account Type Switcher */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Receiving Channel Type</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {[
                    { id: 'bank_transfer' as StorePayoutAccountType, label: 'Bank Account' },
                    { id: 'upi' as StorePayoutAccountType, label: 'Direct UPI & QR' },
                    { id: 'paypal' as StorePayoutAccountType, label: 'PayPal & QR' },
                    { id: 'custom_qr' as StorePayoutAccountType, label: 'Custom QR' },
                    { id: 'razorpay' as StorePayoutAccountType, label: 'Razorpay' },
                    { id: 'stripe' as StorePayoutAccountType, label: 'Stripe Bank' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setPayoutForm({ ...payoutForm, account_type: opt.id })}
                      className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-colors ${
                        payoutForm.account_type === opt.id
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Account Nickname / Label *</label>
                  <input
                    type="text"
                    required
                    value={payoutForm.label}
                    onChange={(e) => setPayoutForm({ ...payoutForm, label: e.target.value })}
                    placeholder={
                      payoutForm.account_type === 'paypal'
                        ? 'e.g. Official PayPal Business'
                        : payoutForm.account_type === 'custom_qr'
                        ? 'e.g. Merchant Scan & Pay QR'
                        : 'e.g. HDFC Business Current A/C'
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Account Holder / Legal Name *</label>
                  <input
                    type="text"
                    required
                    value={payoutForm.account_holder_name}
                    onChange={(e) => setPayoutForm({ ...payoutForm, account_holder_name: e.target.value })}
                    placeholder="e.g. Streamlify Sports Pvt Ltd"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              {(payoutForm.account_type === 'bank_transfer' || payoutForm.account_type === 'stripe' || payoutForm.account_type === 'razorpay') && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Bank Name {payoutForm.account_type === 'bank_transfer' ? '*' : '(Optional Settlement Bank)'}
                    </label>
                    <input
                      type="text"
                      required={payoutForm.account_type === 'bank_transfer'}
                      value={payoutForm.bank_name}
                      onChange={(e) => setPayoutForm({ ...payoutForm, bank_name: e.target.value })}
                      placeholder="e.g. HDFC Bank / Chase / ICICI"
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Branch / City</label>
                    <input
                      type="text"
                      value={payoutForm.branch_name}
                      onChange={(e) => setPayoutForm({ ...payoutForm, branch_name: e.target.value })}
                      placeholder="e.g. Indiranagar / New York"
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                    />
                  </div>
                </div>
              )}

              {payoutForm.account_type === 'bank_transfer' && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Account Number / IBAN *</label>
                      <input
                        type="text"
                        required
                        value={payoutForm.account_number}
                        onChange={(e) => setPayoutForm({ ...payoutForm, account_number: e.target.value })}
                        placeholder="Enter bank account number"
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Confirm Account Number *</label>
                      <input
                        type="text"
                        required
                        value={confirmAccountNumber}
                        onChange={(e) => setConfirmAccountNumber(e.target.value)}
                        placeholder="Re-enter account number"
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg font-mono"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">IFSC / Routing / SWIFT Code *</label>
                      <input
                        type="text"
                        required
                        value={payoutForm.ifsc_or_routing}
                        onChange={(e) => setPayoutForm({ ...payoutForm, ifsc_or_routing: e.target.value.toUpperCase() })}
                        placeholder="e.g. HDFC0001234 or CHASUS33"
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Optional Linked UPI ID</label>
                      <input
                        type="text"
                        value={payoutForm.upi_id}
                        onChange={(e) => setPayoutForm({ ...payoutForm, upi_id: e.target.value })}
                        placeholder="e.g. store@hdfcbank"
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg font-mono"
                      />
                    </div>
                  </div>
                </>
              )}

              {payoutForm.account_type === 'upi' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Merchant / Admin Bank UPI VPA *</label>
                  <input
                    type="text"
                    required
                    value={payoutForm.upi_id}
                    onChange={(e) => setPayoutForm({ ...payoutForm, upi_id: e.target.value })}
                    placeholder="e.g. streamlifystore@okicici"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg font-mono"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Automatically creates a live amount-locked UPI QR code &amp; deep link for buyer checkout.
                  </p>
                </div>
              )}

              {payoutForm.account_type === 'paypal' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">PayPal.me Handle or Business Email</label>
                    <input
                      type="text"
                      value={payoutForm.paypal_handle}
                      onChange={(e) => setPayoutForm({ ...payoutForm, paypal_handle: e.target.value })}
                      placeholder="e.g. streamlifystore or pay@domain.com"
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Direct PayPal Payment Link (Optional)</label>
                    <input
                      type="url"
                      value={payoutForm.payment_link}
                      onChange={(e) => setPayoutForm({ ...payoutForm, payment_link: e.target.value })}
                      placeholder="https://paypal.me/streamlifystore"
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg font-mono"
                    />
                  </div>
                </div>
              )}

              {payoutForm.account_type === 'custom_qr' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Merchant Payment Link (Optional)</label>
                    <input
                      type="url"
                      value={payoutForm.payment_link}
                      onChange={(e) => setPayoutForm({ ...payoutForm, payment_link: e.target.value })}
                      placeholder="https://wise.com/pay/me/... or Venmo/Zelle URL"
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Custom QR Text / URI Payload</label>
                    <input
                      type="text"
                      value={payoutForm.qr_payload}
                      onChange={(e) => setPayoutForm({ ...payoutForm, qr_payload: e.target.value })}
                      placeholder="e.g. upi://pay?... or any payment handle/URI"
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg font-mono"
                    />
                  </div>
                </div>
              )}

              {/* UPLOAD OR AUTO-GENERATE CUSTOM PAYMENT QR CODE */}
              {['bank_transfer', 'upi', 'paypal', 'custom_qr'].includes(payoutForm.account_type) && (
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <QrCode className="w-4 h-4 text-[#d11a2a]" />
                      <div>
                        <div className="text-xs font-bold text-slate-900">Payment QR Code (Upload or Auto-Generate)</div>
                        <div className="text-[11px] text-slate-500">
                          Displayed prominently to buyers on the final checkout screen for instant scan-to-pay.
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 items-start">
                    <div className="w-28 h-28 rounded-xl border border-slate-200 bg-white p-1.5 flex items-center justify-center shrink-0">
                      {payoutForm.qr_code_url ? (
                        <img
                          src={payoutForm.qr_code_url}
                          alt="Payment QR Preview"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="text-center text-[10px] text-slate-400 px-2 space-y-1">
                          <QrCode className="w-6 h-6 mx-auto text-slate-300" />
                          <div>No QR yet</div>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0 space-y-2.5 w-full">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          disabled={qrGenerating}
                          onClick={handleGeneratePayoutQr}
                          className="px-3 py-1.5 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg flex items-center gap-1.5 whitespace-nowrap"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          {qrGenerating ? 'Generating...' : 'Auto-Generate QR Code'}
                        </button>

                        <label className="px-3 py-1.5 text-xs font-semibold border border-slate-200 bg-white hover:bg-slate-100 text-slate-800 rounded-lg cursor-pointer flex items-center gap-1.5 whitespace-nowrap">
                          <Upload className="w-3.5 h-3.5" />
                          Upload QR Image
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp,image/svg+xml"
                            onChange={handleUploadPayoutQrFile}
                            className="hidden"
                          />
                        </label>

                        {payoutForm.qr_code_url && (
                          <button
                            type="button"
                            onClick={() => setPayoutForm((prev) => ({ ...prev, qr_code_url: '' }))}
                            className="px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg"
                          >
                            Clear QR
                          </button>
                        )}
                      </div>

                      {payoutForm.account_type !== 'custom_qr' && (
                        <input
                          type="text"
                          value={payoutForm.qr_payload}
                          onChange={(e) => setPayoutForm({ ...payoutForm, qr_payload: e.target.value })}
                          placeholder="Optional custom QR text / URL override (auto-filled when generating)"
                          className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white font-mono"
                        />
                      )}

                      <input
                        type="text"
                        value={payoutForm.qr_code_url.startsWith('data:') ? '' : payoutForm.qr_code_url}
                        onChange={(e) => setPayoutForm({ ...payoutForm, qr_code_url: e.target.value })}
                        placeholder={
                          payoutForm.qr_code_url.startsWith('data:')
                            ? 'Uploaded / Generated QR image attached (ready to save)'
                            : 'Or paste direct HTTPS QR image URL...'
                        }
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {payoutForm.account_type === 'razorpay' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Razorpay Public Key ID</label>
                      <input
                        type="text"
                        value={payoutForm.razorpay_key_id}
                        onChange={(e) => setPayoutForm({ ...payoutForm, razorpay_key_id: e.target.value })}
                        placeholder="e.g. rzp_live_..."
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Linked Route Account / Settlement ID</label>
                      <input
                        type="text"
                        value={payoutForm.razorpay_account_id}
                        onChange={(e) => setPayoutForm({ ...payoutForm, razorpay_account_id: e.target.value })}
                        placeholder="e.g. acc_N8x... or Settlement A/C"
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono"
                      />
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    For security, Razorpay Key Secrets stay strictly in server environment variables and are never stored in browser-readable database records.
                  </p>
                </div>
              )}

              {payoutForm.account_type === 'stripe' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Connected Account / Settlement Bank Ref</label>
                    <input
                      type="text"
                      value={payoutForm.account_number}
                      onChange={(e) => setPayoutForm({ ...payoutForm, account_number: e.target.value })}
                      placeholder="e.g. Checking •••• 8891"
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Routing / IBAN Summary</label>
                    <input
                      type="text"
                      value={payoutForm.ifsc_or_routing}
                      onChange={(e) => setPayoutForm({ ...payoutForm, ifsc_or_routing: e.target.value.toUpperCase() })}
                      placeholder="e.g. ACH-021000021"
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Supported Currency</label>
                  <select
                    value={payoutForm.currency_scope}
                    onChange={(e) => setPayoutForm({ ...payoutForm, currency_scope: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="ALL">All Currencies (INR &amp; USD)</option>
                    <option value="INR">INR Only</option>
                    <option value="USD">USD Only</option>
                  </select>
                </div>
                <div className="flex flex-col justify-end gap-1.5">
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={payoutForm.is_primary}
                      onChange={(e) => setPayoutForm({ ...payoutForm, is_primary: e.target.checked })}
                    />
                    Set as Primary Receiving Account
                  </label>
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={payoutForm.is_active}
                      onChange={(e) => setPayoutForm({ ...payoutForm, is_active: e.target.checked })}
                    />
                    Visible &amp; active at buyer checkout
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Buyer Transfer Instructions</label>
                <textarea
                  rows={2}
                  value={payoutForm.instructions}
                  onChange={(e) => setPayoutForm({ ...payoutForm, instructions: e.target.value })}
                  placeholder="Optional guidance shown to buyers at checkout..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                />
              </div>
            </div>

            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsPayoutModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold bg-white border border-slate-200 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 text-xs font-semibold bg-[#d11a2a] hover:bg-[#b51523] text-white rounded-lg"
              >
                {saving ? 'Saving...' : editingPayoutId ? 'Save Changes' : 'Save Receiving Account'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* IN-APP DELETE CONFIRMATION MODAL */}
      {confirmModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[1050] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
                <AlertTriangle className="w-4 h-4" />
                <span>{confirmModal.title}</span>
              </div>
              <button
                type="button"
                disabled={confirmBusy}
                onClick={() => setConfirmModal(null)}
                className="text-slate-400 hover:text-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 text-xs text-slate-600 leading-relaxed">
              {confirmModal.message}
            </div>
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                disabled={confirmBusy}
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2 text-xs font-semibold bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={confirmBusy}
                onClick={async () => {
                  setConfirmBusy(true);
                  try {
                    await confirmModal.onConfirm();
                    setConfirmModal(null);
                  } catch (err: any) {
                    showToast(err?.message || 'Delete operation failed.', 'error');
                  } finally {
                    setConfirmBusy(false);
                  }
                }}
                className="px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white rounded-lg"
              >
                {confirmBusy ? 'Deleting...' : confirmModal.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
