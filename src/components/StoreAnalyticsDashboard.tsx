import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';
import {
  TrendingUp,
  ShoppingBag,
  Percent,
  Package,
  Download,
  Zap,
  ArrowUpRight,
  Star,
} from 'lucide-react';
import type {
  StoreProduct,
  StoreOrder,
  StoreReview,
  StoreAnalyticsEvent,
  StoreDomain,
} from '../types/store';
import { STORE_PRIMARY_DOMAINS } from '../data/storeCatalog';
import { formatCurrency } from '../utils/currency';

interface StoreAnalyticsDashboardProps {
  products: StoreProduct[];
  orders: StoreOrder[];
  reviews: StoreReview[];
  analyticsEvents: StoreAnalyticsEvent[];
  onOpenProductEdit?: (product: StoreProduct) => void;
  onJumpToCatalog?: () => void;
}

type TimeRange = '7d' | '14d' | '30d' | 'all';

interface DailyBucket {
  dateKey: string;
  label: string;
  revenueUsd: number;
  unitsSold: number;
  ordersCount: number;
  quickBuyOrders: number;
  viewsCount: number;
  intentCount: number;
  conversionRate: number;
  intentRate: number;
}

const CHART_COLORS = ['#d11a2a', '#0f172a', '#0284c7', '#16a34a', '#d97706', '#64748b'];

function toUsd(amount: number, currency: string): number {
  const val = Number(amount) || 0;
  return currency === 'INR' ? val / 83.5 : val;
}

function toDayKey(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

function formatDayLabel(dayKey: string): string {
  const d = new Date(`${dayKey}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return dayKey;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
}

export const StoreAnalyticsDashboard: React.FC<StoreAnalyticsDashboardProps> = ({
  products,
  orders,
  reviews,
  analyticsEvents,
  onOpenProductEdit,
  onJumpToCatalog,
}) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('14d');
  const [domainFilter, setDomainFilter] = useState<'All' | StoreDomain>('All');
  const [topMetric, setTopMetric] = useState<'units' | 'revenue'>('revenue');

  const productById = useMemo(() => {
    const map: Record<string, StoreProduct> = {};
    for (const p of products) map[p.id] = p;
    return map;
  }, [products]);

  const reviewsByProduct = useMemo(() => {
    const sums: Record<string, { total: number; count: number }> = {};
    for (const r of reviews) {
      if (!r.product_id) continue;
      if (!sums[r.product_id]) sums[r.product_id] = { total: 0, count: 0 };
      sums[r.product_id].total += Number(r.rating) || 0;
      sums[r.product_id].count += 1;
    }
    const res: Record<string, { avg: number; count: number }> = {};
    for (const [pid, s] of Object.entries(sums)) {
      res[pid] = { avg: s.count > 0 ? Number((s.total / s.count).toFixed(1)) : 0, count: s.count };
    }
    return res;
  }, [reviews]);

  const cutoffDate = useMemo(() => {
    if (timeRange === 'all') return null;
    const days = timeRange === '7d' ? 7 : timeRange === '14d' ? 14 : 30;
    const d = new Date();
    d.setUTCHours(0, 0, 0, 0);
    d.setUTCDate(d.getUTCDate() - (days - 1));
    return d;
  }, [timeRange]);

  const filteredOrders = useMemo(() => {
    return orders.filter((ord) => {
      if (ord.status === 'cancelled') return false;
      if (cutoffDate) {
        const dt = new Date(ord.created_at || 0);
        if (dt < cutoffDate) return false;
      }
      if (domainFilter !== 'All') {
        const matchesDomain = (ord.items || []).some((it) => {
          const prod = productById[it.product_id];
          return prod?.domain === domainFilter;
        });
        if (!matchesDomain) return false;
      }
      return true;
    });
  }, [orders, cutoffDate, domainFilter, productById]);

  const filteredEvents = useMemo(() => {
    return analyticsEvents.filter((ev) => {
      if (cutoffDate) {
        const dt = new Date(ev.created_at || 0);
        if (dt < cutoffDate) return false;
      }
      if (domainFilter !== 'All' && ev.domain && ev.domain !== domainFilter) {
        return false;
      }
      return true;
    });
  }, [analyticsEvents, cutoffDate, domainFilter]);

  const dailySeries = useMemo<DailyBucket[]>(() => {
    const bucketMap = new Map<string, DailyBucket>();

    const ensureBucket = (dayKey: string): DailyBucket => {
      let existing = bucketMap.get(dayKey);
      if (!existing) {
        existing = {
          dateKey: dayKey,
          label: formatDayLabel(dayKey),
          revenueUsd: 0,
          unitsSold: 0,
          ordersCount: 0,
          quickBuyOrders: 0,
          viewsCount: 0,
          intentCount: 0,
          conversionRate: 0,
          intentRate: 0,
        };
        bucketMap.set(dayKey, existing);
      }
      return existing;
    };

    if (timeRange !== 'all') {
      const days = timeRange === '7d' ? 7 : timeRange === '14d' ? 14 : 30;
      const now = new Date();
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - i));
        ensureBucket(d.toISOString().slice(0, 10));
      }
    }

    for (const ord of filteredOrders) {
      const key = toDayKey(ord.created_at);
      if (!key) continue;
      const b = ensureBucket(key);
      b.ordersCount += 1;
      if (ord.checkout_mode === 'quick_buy') b.quickBuyOrders += 1;

      if (domainFilter === 'All') {
        b.revenueUsd += toUsd(ord.total, ord.currency);
        b.unitsSold += (ord.items || []).reduce((s, it) => s + (Number(it.quantity) || 0), 0);
      } else {
        for (const it of ord.items || []) {
          const prod = productById[it.product_id];
          if (prod?.domain === domainFilter) {
            const qty = Number(it.quantity) || 0;
            b.unitsSold += qty;
            b.revenueUsd += toUsd((Number(it.unit_price) || 0) * qty, ord.currency);
          }
        }
      }
    }

    for (const ev of filteredEvents) {
      const key = toDayKey(ev.created_at);
      if (!key) continue;
      const b = ensureBucket(key);
      if (ev.event_type === 'store_view' || ev.event_type === 'product_view') {
        b.viewsCount += 1;
      } else if (
        ev.event_type === 'add_to_cart' ||
        ev.event_type === 'quick_buy_open' ||
        ev.event_type === 'checkout_start'
      ) {
        b.intentCount += 1;
      }
    }

    return Array.from(bucketMap.values())
      .sort((a, b) => a.dateKey.localeCompare(b.dateKey))
      .map((b) => {
        const effectiveViews = Math.max(b.viewsCount, b.intentCount, b.ordersCount);
        const conv = effectiveViews > 0 ? Math.min(100, (b.ordersCount / effectiveViews) * 100) : 0;
        const intentPct = effectiveViews > 0 ? Math.min(100, ((b.intentCount + b.ordersCount) / effectiveViews) * 100) : 0;
        return {
          ...b,
          revenueUsd: Number(b.revenueUsd.toFixed(2)),
          conversionRate: Number(conv.toFixed(1)),
          intentRate: Number(intentPct.toFixed(1)),
        };
      });
  }, [filteredOrders, filteredEvents, timeRange, domainFilter, productById]);

  const summary = useMemo(() => {
    const totalRevenueUsd = dailySeries.reduce((s, d) => s + d.revenueUsd, 0);
    const totalUnits = dailySeries.reduce((s, d) => s + d.unitsSold, 0);
    const totalOrders = filteredOrders.length;
    const quickBuyOrders = filteredOrders.filter((o) => o.checkout_mode === 'quick_buy').length;
    const quickBuyRevenueUsd = filteredOrders
      .filter((o) => o.checkout_mode === 'quick_buy')
      .reduce((s, o) => s + toUsd(o.total, o.currency), 0);

    const aovUsd = totalOrders > 0 ? totalRevenueUsd / totalOrders : 0;

    const totalViews = filteredEvents.filter(
      (e) => e.event_type === 'store_view' || e.event_type === 'product_view'
    ).length;
    const totalIntents = filteredEvents.filter(
      (e) =>
        e.event_type === 'add_to_cart' ||
        e.event_type === 'quick_buy_open' ||
        e.event_type === 'checkout_start'
    ).length;

    const funnelDenominator = Math.max(totalViews, totalIntents, totalOrders);
    const overallConversionPct =
      funnelDenominator > 0 ? Math.min(100, (totalOrders / funnelDenominator) * 100) : 0;

    const quickBuyOpens = filteredEvents.filter((e) => e.event_type === 'quick_buy_open').length;
    const quickBuyConvPct =
      Math.max(quickBuyOpens, quickBuyOrders) > 0
        ? Math.min(100, (quickBuyOrders / Math.max(quickBuyOpens, quickBuyOrders)) * 100)
        : 0;

    const scopedProducts = products.filter((p) => domainFilter === 'All' || p.domain === domainFilter);
    const totalCatalogValueUsd = scopedProducts.reduce(
      (s, p) => s + (Number(p.price_usd) || 0) * Math.max(0, Number(p.stock) || 0),
      0
    );
    const totalStockRemaining = scopedProducts.reduce((s, p) => s + Math.max(0, Number(p.stock) || 0), 0);
    const sellThroughPct =
      totalUnits + totalStockRemaining > 0
        ? (totalUnits / (totalUnits + totalStockRemaining)) * 100
        : 0;

    return {
      totalRevenueUsd,
      totalUnits,
      totalOrders,
      quickBuyOrders,
      quickBuyRevenueUsd,
      quickBuySharePct: totalOrders > 0 ? (quickBuyOrders / totalOrders) * 100 : 0,
      aovUsd,
      totalViews: funnelDenominator,
      totalIntents: Math.max(totalIntents, totalOrders),
      overallConversionPct,
      quickBuyConvPct,
      totalCatalogValueUsd,
      sellThroughPct,
      activeSkuCount: scopedProducts.filter((p) => p.is_active !== false).length,
    };
  }, [dailySeries, filteredOrders, filteredEvents, products, domainFilter]);

  const topSellingItems = useMemo(() => {
    const agg = new Map<
      string,
      {
        productId: string;
        name: string;
        shortName: string;
        sku: string;
        brand: string;
        sport: string;
        units: number;
        revenueUsd: number;
        orders: number;
      }
    >();

    for (const ord of filteredOrders) {
      const seenInOrd = new Set<string>();
      for (const it of ord.items || []) {
        const prod = productById[it.product_id];
        if (domainFilter !== 'All' && prod?.domain !== domainFilter) continue;
        const pid = it.product_id || it.sku;
        const qty = Number(it.quantity) || 0;
        const revUsd = toUsd((Number(it.unit_price) || 0) * qty, ord.currency);
        let row = agg.get(pid);
        if (!row) {
          const cleanName = it.name || prod?.name || it.sku;
          row = {
            productId: pid,
            name: cleanName,
            shortName: cleanName.length > 22 ? `${cleanName.slice(0, 21)}…` : cleanName,
            sku: it.sku || prod?.sku || '',
            brand: it.brand || prod?.brand || '',
            sport: prod?.sport_type || 'General',
            units: 0,
            revenueUsd: 0,
            orders: 0,
          };
          agg.set(pid, row);
        }
        row.units += qty;
        row.revenueUsd += revUsd;
        if (!seenInOrd.has(pid)) {
          row.orders += 1;
          seenInOrd.add(pid);
        }
      }
    }

    return Array.from(agg.values())
      .map((r) => ({ ...r, revenueUsd: Number(r.revenueUsd.toFixed(2)) }))
      .sort((a, b) => (topMetric === 'revenue' ? b.revenueUsd - a.revenueUsd : b.units - a.units))
      .slice(0, 8);
  }, [filteredOrders, productById, domainFilter, topMetric]);

  const revenueBySport = useMemo(() => {
    const map = new Map<string, { sport: string; revenueUsd: number; units: number }>();
    for (const ord of filteredOrders) {
      for (const it of ord.items || []) {
        const prod = productById[it.product_id];
        if (domainFilter !== 'All' && prod?.domain !== domainFilter) continue;
        const sport = prod?.sport_type || 'Cricket';
        const qty = Number(it.quantity) || 0;
        const rev = toUsd((Number(it.unit_price) || 0) * qty, ord.currency);
        const prev = map.get(sport) || { sport, revenueUsd: 0, units: 0 };
        prev.revenueUsd += rev;
        prev.units += qty;
        map.set(sport, prev);
      }
    }
    return Array.from(map.values())
      .map((r) => ({ ...r, revenueUsd: Number(r.revenueUsd.toFixed(2)) }))
      .sort((a, b) => b.revenueUsd - a.revenueUsd)
      .slice(0, 6);
  }, [filteredOrders, productById, domainFilter]);

  const handleExportCsv = () => {
    const headers = [
      'Date',
      'Orders',
      'Quick Buy Orders',
      'Units Sold',
      'Revenue (USD)',
      'Store & Product Views',
      'Cart/Quick-Buy Intents',
      'Conversion Rate (%)',
    ];
    const rows = dailySeries.map((d) => [
      d.dateKey,
      d.ordersCount,
      d.quickBuyOrders,
      d.unitsSold,
      d.revenueUsd.toFixed(2),
      d.viewsCount,
      d.intentCount,
      d.conversionRate.toFixed(1),
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `store-analytics-${timeRange}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Analytics Header & Controls */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">Store Sales &amp; Conversion Analytics</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time revenue trends, top-selling equipment, Quick Buy adoption, and storefront funnel conversion over time.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200">
            {(
              [
                { id: '7d', label: '7D' },
                { id: '14d', label: '14D' },
                { id: '30d', label: '30D' },
                { id: 'all', label: 'All Time' },
              ] as { id: TimeRange; label: string }[]
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setTimeRange(opt.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                  timeRange === opt.id
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <select
            aria-label="Filter analytics by store section"
            value={domainFilter}
            onChange={(e) => setDomainFilter(e.target.value as any)}
            className="px-3 py-2 text-xs font-semibold border border-slate-200 rounded-lg bg-white text-slate-700"
          >
            <option value="All">All Store Sections</option>
            {STORE_PRIMARY_DOMAINS.map((dom) => (
              <option key={dom} value={dom}>
                {dom}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={handleExportCsv}
            className="px-3.5 py-2 text-xs font-semibold border border-slate-200 rounded-lg bg-white text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* 4-Column Analytics KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Period Revenue</span>
            <TrendingUp className="w-4 h-4 text-[#d11a2a]" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {formatCurrency(summary.totalRevenueUsd, 'USD', 'en-US')}
          </div>
          <div className="text-xs text-slate-500 tabular-nums">
            AOV {formatCurrency(summary.aovUsd, 'USD', 'en-US')} · {summary.quickBuySharePct.toFixed(0)}% Quick Buy
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Orders &amp; Units</span>
            <ShoppingBag className="w-4 h-4 text-slate-700" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {summary.totalOrders}{' '}
            <span className="text-sm font-medium text-slate-500">({summary.totalUnits} units)</span>
          </div>
          <div className="text-xs text-slate-500 tabular-nums">
            {summary.quickBuyOrders} via 1-Click Quick Buy
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Conversion Rate</span>
            <Percent className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-700 font-mono tabular-nums">
            {summary.overallConversionPct.toFixed(1)}%
          </div>
          <div className="text-xs text-slate-500 tabular-nums">
            {summary.totalOrders} orders / {summary.totalViews} views · Quick Buy {summary.quickBuyConvPct.toFixed(0)}%
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Sell-Through &amp; Stock</span>
            <Package className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {summary.sellThroughPct.toFixed(1)}%
          </div>
          <div className="text-xs text-slate-500 tabular-nums">
            {summary.activeSkuCount} SKUs · {formatCurrency(summary.totalCatalogValueUsd, 'USD', 'en-US')} on hand
          </div>
        </div>
      </div>

      {/* Primary Time-Series Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sales Trend Chart */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Sales &amp; Units Trend Over Time</h3>
              <p className="text-xs text-slate-500">Daily revenue (USD) and units sold across the selected period</p>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-600">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#d11a2a] inline-block" />
                Revenue ($)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-slate-900 inline-block" />
                Units
              </span>
            </div>
          </div>

          <div className="h-72 w-full">
            {dailySeries.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No sales activity recorded in this period yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={dailySeries} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="storeRevGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#d11a2a" stopOpacity={0.22} />
                      <stop offset="95%" stopColor="#d11a2a" stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={{ stroke: '#cbd5e1' }}
                    tickLine={false}
                  />
                  <YAxis
                    yAxisId="left"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `$${v}`}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload || payload.length === 0) return null;
                      const d = payload[0].payload as DailyBucket;
                      return (
                        <div className="bg-slate-900 text-white px-3.5 py-2.5 rounded-lg shadow-xl text-xs space-y-1 font-mono tabular-nums">
                          <div className="font-sans font-semibold text-slate-200">{d.label}</div>
                          <div>Revenue: ${d.revenueUsd.toFixed(2)}</div>
                          <div>Units Sold: {d.unitsSold}</div>
                          <div>Orders: {d.ordersCount} (Quick Buy: {d.quickBuyOrders})</div>
                        </div>
                      );
                    }}
                  />
                  <Bar
                    yAxisId="right"
                    dataKey="unitsSold"
                    fill="#0f172a"
                    radius={[4, 4, 0, 0]}
                    barSize={18}
                    opacity={0.85}
                  />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="revenueUsd"
                    stroke="#d11a2a"
                    strokeWidth={2.5}
                    fill="url(#storeRevGradient)"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Conversion Rate Over Time */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Conversion Rate Over Time</h3>
              <p className="text-xs text-slate-500">Order conversion % &amp; checkout intent rate %</p>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-600">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-600 inline-block" />
                Order %
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 inline-block" />
                Intent %
              </span>
            </div>
          </div>

          <div className="h-72 w-full">
            {dailySeries.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                Browse the store or complete Quick Buys to populate funnel conversion telemetry.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailySeries} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="convGreenGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#16a34a" stopOpacity={0.22} />
                      <stop offset="95%" stopColor="#16a34a" stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={{ stroke: '#cbd5e1' }}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload || payload.length === 0) return null;
                      const d = payload[0].payload as DailyBucket;
                      return (
                        <div className="bg-slate-900 text-white px-3.5 py-2.5 rounded-lg shadow-xl text-xs space-y-1 font-mono tabular-nums">
                          <div className="font-sans font-semibold text-slate-200">{d.label}</div>
                          <div className="text-emerald-400">Order Conversion: {d.conversionRate}%</div>
                          <div className="text-amber-300">Add/Quick-Buy Intent: {d.intentRate}%</div>
                          <div className="text-slate-300 pt-1 border-t border-slate-700">
                            Views: {d.viewsCount} · Intents: {d.intentCount} · Orders: {d.ordersCount}
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="intentRate"
                    stroke="#d97706"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    fill="none"
                  />
                  <Area
                    type="monotone"
                    dataKey="conversionRate"
                    stroke="#16a34a"
                    strokeWidth={2.5}
                    fill="url(#convGreenGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Top-Selling Items + Sport & Checkout Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Top-Selling Equipment Chart & Table */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Top-Selling Products</h3>
              <p className="text-xs text-slate-500">Ranked by {topMetric === 'revenue' ? 'gross revenue (USD)' : 'units ordered'}</p>
            </div>
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200 w-fit">
              <button
                type="button"
                onClick={() => setTopMetric('revenue')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                  topMetric === 'revenue' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                }`}
              >
                By Revenue
              </button>
              <button
                type="button"
                onClick={() => setTopMetric('units')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                  topMetric === 'units' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                }`}
              >
                By Units
              </button>
            </div>
          </div>

          {topSellingItems.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500 space-y-2">
              <p>No product sales recorded in the selected window yet.</p>
              {onJumpToCatalog && (
                <button
                  type="button"
                  onClick={onJumpToCatalog}
                  className="px-3.5 py-2 text-xs font-semibold bg-slate-900 text-white rounded-lg"
                >
                  View Catalog Inventory
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-5">
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={topSellingItems}
                    layout="vertical"
                    margin={{ top: 4, right: 20, left: 10, bottom: 4 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => (topMetric === 'revenue' ? `$${v}` : `${v}`)}
                    />
                    <YAxis
                      type="category"
                      dataKey="shortName"
                      width={135}
                      tick={{ fontSize: 11, fill: '#0f172a' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload || payload.length === 0) return null;
                        const row = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white px-3 py-2 rounded-lg shadow-xl text-xs font-mono tabular-nums space-y-0.5">
                            <div className="font-sans font-bold text-white">{row.name}</div>
                            <div className="text-slate-300">{row.brand} · {row.sport}</div>
                            <div>Revenue: ${row.revenueUsd.toFixed(2)}</div>
                            <div>Units Sold: {row.units} ({row.orders} orders)</div>
                          </div>
                        );
                      }}
                    />
                    <Bar
                      dataKey={topMetric === 'revenue' ? 'revenueUsd' : 'units'}
                      radius={[0, 4, 4, 0]}
                      barSize={18}
                    >
                      {topSellingItems.map((_, idx) => (
                        <Cell key={idx} fill={idx === 0 ? '#d11a2a' : '#0f172a'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="overflow-x-auto border-t border-slate-100 pt-3">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="text-slate-500 border-b border-slate-100">
                      <th className="py-2 pr-3 font-semibold">Item</th>
                      <th className="py-2 px-3 font-semibold text-right">Units</th>
                      <th className="py-2 px-3 font-semibold text-right">Revenue</th>
                      <th className="py-2 px-3 font-semibold text-right">Stock</th>
                      <th className="py-2 pl-3 font-semibold text-right">Rating</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 tabular-nums">
                    {topSellingItems.map((item) => {
                      const prod = productById[item.productId];
                      const revInfo = reviewsByProduct[item.productId];
                      return (
                        <tr key={item.productId} className="hover:bg-slate-50">
                          <td className="py-2.5 pr-3">
                            <div className="font-semibold text-slate-900 truncate max-w-[200px]">{item.name}</div>
                            <div className="text-[11px] text-slate-500 font-mono">
                              {item.brand} · {item.sku}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900">
                            {item.units}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900">
                            ${item.revenueUsd.toFixed(2)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono">
                            {prod ? (
                              <button
                                type="button"
                                onClick={() => onOpenProductEdit?.(prod)}
                                className={`font-semibold hover:underline inline-flex items-center gap-0.5 ${
                                  prod.stock === 0
                                    ? 'text-rose-600'
                                    : prod.stock <= 5
                                    ? 'text-amber-700'
                                    : 'text-emerald-700'
                                }`}
                                title="Edit stock in catalog"
                              >
                                {prod.stock}
                                <ArrowUpRight className="w-3 h-3" />
                              </button>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          <td className="py-2.5 pl-3 text-right font-mono text-slate-700">
                            {revInfo ? (
                              <span className="inline-flex items-center gap-1">
                                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                {revInfo.avg.toFixed(1)}
                              </span>
                            ) : (
                              '—'
                            )}
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

        {/* Revenue by Sport & Quick Buy Funnel Comparison */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Revenue by Sport &amp; Category</h3>
              <p className="text-xs text-slate-500">Top performing sports &amp; games verticals</p>
            </div>
            <div className="h-52 w-full">
              {revenueBySport.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  No sport breakdown available for this window.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueBySport} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis
                      dataKey="sport"
                      tick={{ fontSize: 11, fill: '#475569' }}
                      axisLine={{ stroke: '#cbd5e1' }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `$${v}`}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload || payload.length === 0) return null;
                        const d = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white px-3 py-2 rounded-lg text-xs font-mono tabular-nums">
                            <div className="font-sans font-semibold">{d.sport}</div>
                            <div>Revenue: ${d.revenueUsd.toFixed(2)}</div>
                            <div>Units Sold: {d.units}</div>
                          </div>
                        );
                      }}
                    />
                    <Bar dataKey="revenueUsd" radius={[4, 4, 0, 0]} barSize={28}>
                      {revenueBySport.map((_, idx) => (
                        <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Checkout Channel & Funnel Conversion Summary */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Conversion Funnel &amp; Quick Buy Split</h3>
                <p className="text-xs text-slate-500">Comparing 1-click Quick Buy against standard bag checkout</p>
              </div>
              <Zap className="w-4 h-4 text-[#d11a2a]" />
            </div>

            <div className="space-y-3 text-xs tabular-nums">
              <div>
                <div className="flex justify-between font-medium text-slate-700 mb-1">
                  <span>Store &amp; Product Views</span>
                  <span className="font-mono font-bold">{summary.totalViews}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-slate-800 rounded-full" style={{ width: '100%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-medium text-slate-700 mb-1">
                  <span>Add to Bag &amp; Quick Buy Intent</span>
                  <span className="font-mono font-bold">
                    {summary.totalIntents} (
                    {summary.totalViews > 0
                      ? ((summary.totalIntents / summary.totalViews) * 100).toFixed(1)
                      : '0.0'}
                    %)
                  </span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full"
                    style={{
                      width: `${
                        summary.totalViews > 0
                          ? Math.min(100, (summary.totalIntents / summary.totalViews) * 100)
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-medium text-slate-700 mb-1">
                  <span>Completed Orders</span>
                  <span className="font-mono font-bold text-emerald-700">
                    {summary.totalOrders} ({summary.overallConversionPct.toFixed(1)}%)
                  </span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-600 rounded-full"
                    style={{ width: `${summary.overallConversionPct}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100 text-xs tabular-nums">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div className="text-slate-500 font-medium">1-Click Quick Buy</div>
                <div className="text-base font-bold text-slate-900 font-mono mt-0.5">
                  {summary.quickBuyOrders} orders
                </div>
                <div className="text-[11px] text-slate-500 font-mono">
                  {formatCurrency(summary.quickBuyRevenueUsd, 'USD', 'en-US')}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div className="text-slate-500 font-medium">Bag Checkout</div>
                <div className="text-base font-bold text-slate-900 font-mono mt-0.5">
                  {Math.max(0, summary.totalOrders - summary.quickBuyOrders)} orders
                </div>
                <div className="text-[11px] text-slate-500 font-mono">
                  {formatCurrency(Math.max(0, summary.totalRevenueUsd - summary.quickBuyRevenueUsd), 'USD', 'en-US')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
