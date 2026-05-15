import { useEffect, useState, useMemo } from 'react';
import {
  Monitor, Smartphone, Tablet, Globe, Search, FileText, CreditCard,
  TrendingUp, Users, MapPin, ChevronDown, ChevronUp, Calendar,
  BarChart2, RefreshCw, Download, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Session {
  id: string;
  session_id: string;
  ip_address: string | null;
  city: string | null;
  country: string | null;
  device_type: string | null;
  os: string | null;
  browser: string | null;
  page_path: string | null;
  language: string | null;
  referrer: string | null;
  created_at: string;
}

interface ClearanceSearch {
  id: string;
  session_id: string | null;
  ip_address: string | null;
  city: string | null;
  country: string | null;
  device_type: string | null;
  os: string | null;
  mark_searched: string | null;
  classes_searched: number[] | null;
  language: string | null;
  result_risk: string | null;
  created_at: string;
}

interface FilingEvent {
  id: string;
  application_id: string | null;
  event_type: string;
  ip_address: string | null;
  city: string | null;
  country: string | null;
  device_type: string | null;
  os: string | null;
  language: string | null;
  amount_usd: number | null;
  session_id: string | null;
  created_at: string;
  applications?: { case_number: string } | null;
}

type TimeRange = 'day' | 'week' | 'month' | 'year';
type ActiveTab = 'sessions' | 'searches' | 'filings';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDateBounds(range: TimeRange, yearOffset: number = 0): { from: Date; to: Date } {
  const now = new Date();
  const to = new Date(now);
  let from: Date;

  if (yearOffset !== 0) {
    const yr = now.getFullYear() - yearOffset;
    from = new Date(yr, 0, 1);
    to.setTime(new Date(yr, 11, 31, 23, 59, 59).getTime());
    return { from, to };
  }

  if (range === 'day') {
    from = new Date(now); from.setHours(0, 0, 0, 0);
  } else if (range === 'week') {
    from = new Date(now); from.setDate(now.getDate() - 6); from.setHours(0, 0, 0, 0);
  } else if (range === 'month') {
    from = new Date(now); from.setDate(1); from.setHours(0, 0, 0, 0);
  } else {
    from = new Date(now.getFullYear(), 0, 1);
  }
  return { from, to };
}

function getPrevBounds(range: TimeRange): { from: Date; to: Date } {
  const now = new Date();
  if (range === 'day') {
    const from = new Date(now); from.setDate(now.getDate() - 1); from.setHours(0, 0, 0, 0);
    const to = new Date(from); to.setHours(23, 59, 59, 999);
    return { from, to };
  }
  if (range === 'week') {
    const to = new Date(now); to.setDate(now.getDate() - 7); to.setHours(23, 59, 59, 999);
    const from = new Date(to); from.setDate(to.getDate() - 6); from.setHours(0, 0, 0, 0);
    return { from, to };
  }
  if (range === 'month') {
    const to = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    const from = new Date(to.getFullYear(), to.getMonth(), 1);
    return { from, to };
  }
  // year
  const from = new Date(now.getFullYear() - 1, 0, 1);
  const to = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59);
  return { from, to };
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
function fmtTime(d: string) {
  return new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}
function fmtDateTime(d: string) { return `${fmtDate(d)} ${fmtTime(d)}`; }

function delta(curr: number, prev: number): { pct: number; up: boolean } {
  if (prev === 0) return { pct: curr > 0 ? 100 : 0, up: true };
  const pct = Math.round(((curr - prev) / prev) * 100);
  return { pct: Math.abs(pct), up: pct >= 0 };
}

function topN<T extends Record<string, number>>(obj: T, n = 10): [string, number][] {
  return Object.entries(obj).sort((a, b) => b[1] - a[1]).slice(0, n);
}

function countBy<T>(arr: T[], key: (x: T) => string | null | undefined): Record<string, number> {
  const out: Record<string, number> = {};
  arr.forEach(x => {
    const k = key(x) || 'Unknown';
    out[k] = (out[k] || 0) + 1;
  });
  return out;
}

// ─── Mini bar chart (CSS only) ────────────────────────────────────────────────

function MiniBarChart({ data, color = 'bg-gold-500' }: { data: number[]; color?: string }) {
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-0.5 h-8">
      {data.map((v, i) => (
        <div
          key={i}
          className={`flex-1 ${color} rounded-sm opacity-80`}
          style={{ height: `${Math.max(4, (v / max) * 100)}%` }}
        />
      ))}
    </div>
  );
}

// ─── Rank list ────────────────────────────────────────────────────────────────

function RankList({ title, items, icon: Icon }: { title: string; items: [string, number][]; icon: typeof Globe }) {
  const max = items[0]?.[1] ?? 1;
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
      <div className="flex items-center gap-2 mb-3">
        <Icon size={14} className="text-gold-500" />
        <h3 className="text-sm font-semibold text-navy-900">{title}</h3>
      </div>
      <div className="space-y-2">
        {items.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-3">No data</p>
        ) : items.map(([label, count], i) => (
          <div key={label} className="flex items-center gap-2">
            <span className="text-xs text-gray-400 w-4">{i + 1}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-xs font-medium text-gray-800 truncate">{label}</span>
                <span className="text-xs text-gray-500 ml-2 flex-shrink-0">{count}</span>
              </div>
              <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-gold-400 rounded-full" style={{ width: `${(count / max) * 100}%` }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── KPI card ─────────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, prevValue, icon: Icon, iconColor, iconBg, prefix = '' }: {
  label: string; value: number; sub?: string; prevValue?: number;
  icon: typeof Monitor; iconColor: string; iconBg: string; prefix?: string;
}) {
  const d = prevValue !== undefined ? delta(value, prevValue) : null;
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-8 h-8 ${iconBg} rounded-lg flex items-center justify-center`}>
          <Icon size={16} className={iconColor} />
        </div>
        {d && (
          <div className={`flex items-center gap-0.5 text-xs font-medium ${d.up ? 'text-emerald-600' : 'text-red-500'}`}>
            {d.up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {d.pct}%
          </div>
        )}
      </div>
      <div className="text-2xl font-bold text-navy-900">{prefix}{value.toLocaleString()}</div>
      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
      {sub && <div className="text-[10px] text-gray-400 mt-1">{sub}</div>}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const RANGE_LABELS: Record<TimeRange, string> = {
  day: 'Today', week: 'This Week', month: 'This Month', year: 'This Year',
};

const YEAR_OPTIONS = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

export default function AdminAnalytics() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('sessions');
  const [range, setRange] = useState<TimeRange>('month');
  const [yearOffset, setYearOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const [sessions, setSessions] = useState<Session[]>([]);
  const [searches, setSearches] = useState<ClearanceSearch[]>([]);
  const [filingEvents, setFilingEvents] = useState<FilingEvent[]>([]);

  const [prevSessions, setPrevSessions] = useState<Session[]>([]);
  const [prevSearches, setPrevSearches] = useState<ClearanceSearch[]>([]);
  const [prevFilings, setPrevFilings] = useState<FilingEvent[]>([]);

  // Pagination
  const [sessionPage, setSessionPage] = useState(0);
  const [searchPage, setSearchPage] = useState(0);
  const [filingPage, setFilingPage] = useState(0);
  const PAGE_SIZE = 50;

  // Sort
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc');

  // Filters
  const [sessionFilter, setSessionFilter] = useState('');
  const [searchFilter, setSearchFilter] = useState('');

  // ── Filing sub-tab
  const [filingSubTab, setFilingSubTab] = useState<'started' | 'paid'>('started');

  useEffect(() => {
    fetchAll();
  }, [range, yearOffset]);

  async function fetchAll() {
    setLoading(true);
    const { from, to } = getDateBounds(range, yearOffset);
    const prev = yearOffset === 0 ? getPrevBounds(range) : null;

    const fromStr = from.toISOString();
    const toStr = to.toISOString();

    const [sessRes, srchRes, filRes] = await Promise.all([
      supabase.from('website_sessions').select('*').gte('created_at', fromStr).lte('created_at', toStr).order('created_at', { ascending: false }),
      supabase.from('clearance_searches').select('*').gte('created_at', fromStr).lte('created_at', toStr).order('created_at', { ascending: false }),
      supabase.from('filing_events').select('*, applications(case_number)').gte('created_at', fromStr).lte('created_at', toStr).order('created_at', { ascending: false }),
    ]);

    setSessions(sessRes.data ?? []);
    setSearches(srchRes.data ?? []);
    setFilingEvents(filRes.data ?? []);

    if (prev) {
      const pFrom = prev.from.toISOString();
      const pTo = prev.to.toISOString();
      const [ps, psr, pf] = await Promise.all([
        supabase.from('website_sessions').select('id').gte('created_at', pFrom).lte('created_at', pTo),
        supabase.from('clearance_searches').select('id').gte('created_at', pFrom).lte('created_at', pTo),
        supabase.from('filing_events').select('id').gte('created_at', pFrom).lte('created_at', pTo),
      ]);
      setPrevSessions(ps.data ?? []);
      setPrevSearches(psr.data ?? []);
      setPrevFilings(pf.data ?? []);
    } else {
      setPrevSessions([]); setPrevSearches([]); setPrevFilings([]);
    }

    setSessionPage(0); setSearchPage(0); setFilingPage(0);
    setLoading(false);
    setLastRefresh(new Date());
  }

  // ── Derived data ─────────────────────────────────────────────────────────────

  const filteredSessions = useMemo(() =>
    sessions.filter(s =>
      sessionFilter === '' || [s.country, s.city, s.device_type, s.os, s.browser, s.ip_address, s.page_path].some(v => v?.toLowerCase().includes(sessionFilter.toLowerCase()))
    ), [sessions, sessionFilter]);

  const filteredSearches = useMemo(() =>
    searches.filter(s =>
      searchFilter === '' || [s.mark_searched, s.country, s.city, s.ip_address].some(v => v?.toLowerCase().includes(searchFilter.toLowerCase()))
    ), [searches, searchFilter]);

  const startedEvents = useMemo(() => filingEvents.filter(e => e.event_type === 'process_started'), [filingEvents]);
  const paidEvents    = useMemo(() => filingEvents.filter(e => e.event_type === 'payment_completed'), [filingEvents]);
  const currentFilings = filingSubTab === 'started' ? startedEvents : paidEvents;

  const totalRevenue = useMemo(() => paidEvents.reduce((s, e) => s + (e.amount_usd ?? 0), 0), [paidEvents]);
  const prevRevenue  = useMemo(() => prevFilings.filter(e => e.event_type === 'payment_completed').reduce((s, e: any) => s + (e.amount_usd ?? 0), 0), [prevFilings]);

  // Geo breakdowns
  const sessionCountries = useMemo(() => topN(countBy(sessions, s => s.country)), [sessions]);
  const sessionDevices   = useMemo(() => topN(countBy(sessions, s => s.device_type)), [sessions]);
  const sessionOS        = useMemo(() => topN(countBy(sessions, s => s.os)), [sessions]);
  const sessionLangs     = useMemo(() => topN(countBy(sessions, s => s.language)), [sessions]);
  const searchCountries  = useMemo(() => topN(countBy(searches, s => s.country)), [searches]);
  const topMarks         = useMemo(() => topN(countBy(searches, s => s.mark_searched)), [searches]);
  const topClasses       = useMemo(() => {
    const counts: Record<string, number> = {};
    searches.forEach(s => (s.classes_searched ?? []).forEach((c: number) => { counts[`Class ${c}`] = (counts[`Class ${c}`] || 0) + 1; }));
    return topN(counts);
  }, [searches]);

  // Mini sparkline data (last 7 data points)
  const sessionSparkline = useMemo(() => {
    const buckets = Array(7).fill(0);
    const now = Date.now();
    sessions.forEach(s => {
      const diffDays = Math.floor((now - new Date(s.created_at).getTime()) / 86400000);
      if (diffDays < 7) buckets[6 - diffDays]++;
    });
    return buckets;
  }, [sessions]);

  const searchSparkline = useMemo(() => {
    const buckets = Array(7).fill(0);
    const now = Date.now();
    searches.forEach(s => {
      const diffDays = Math.floor((now - new Date(s.created_at).getTime()) / 86400000);
      if (diffDays < 7) buckets[6 - diffDays]++;
    });
    return buckets;
  }, [searches]);

  const uniqueIPs = (arr: { ip_address: string | null }[]) =>
    new Set(arr.map(s => s.ip_address).filter(Boolean)).size;

  // Conversion funnel
  const convSearchToStart = searches.length > 0 ? ((startedEvents.length / searches.length) * 100).toFixed(1) : '—';
  const convStartToPaid   = startedEvents.length > 0 ? ((paidEvents.length / startedEvents.length) * 100).toFixed(1) : '—';

  // CSV export helpers
  function exportCSV(rows: object[], filename: string) {
    if (rows.length === 0) return;
    const keys = Object.keys(rows[0]);
    const csv = [keys.join(','), ...rows.map(r => keys.map(k => JSON.stringify((r as any)[k] ?? '')).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  }

  const paginatedSessions = filteredSessions.slice(sessionPage * PAGE_SIZE, (sessionPage + 1) * PAGE_SIZE);
  const paginatedSearches = filteredSearches.slice(searchPage * PAGE_SIZE, (searchPage + 1) * PAGE_SIZE);
  const paginatedFilings  = currentFilings.slice(filingPage * PAGE_SIZE, (filingPage + 1) * PAGE_SIZE);

  const sortedPaginatedSessions = useMemo(() => [...paginatedSessions].sort((a, b) =>
    sortDir === 'desc'
      ? new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      : new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  ), [paginatedSessions, sortDir]);

  // ── Render ────────────────────────────────────────────────────────────────────

  const tabItems: { id: ActiveTab; label: string; icon: typeof Monitor; count: number }[] = [
    { id: 'sessions', label: 'Website Sessions', icon: Monitor, count: sessions.length },
    { id: 'searches', label: 'Trademark Searches', icon: Search, count: searches.length },
    { id: 'filings',  label: 'Filing & Payments', icon: FileText, count: filingEvents.length },
  ];

  return (
    <div>
      {/* ── Page header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-navy-900">Platform Analytics</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Last refreshed {lastRefresh.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Year selector (for archived data) */}
          <select
            value={yearOffset}
            onChange={e => { setYearOffset(Number(e.target.value)); if (Number(e.target.value) !== 0) setRange('year'); }}
            className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-gold-400"
          >
            {YEAR_OPTIONS.map((yr, i) => (
              <option key={yr} value={i}>{i === 0 ? 'Current year' : String(yr)}</option>
            ))}
          </select>

          {/* Time range pills */}
          {yearOffset === 0 && (
            <div className="flex bg-gray-100 rounded-lg p-0.5 gap-0.5">
              {(Object.keys(RANGE_LABELS) as TimeRange[]).map(r => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors ${range === r ? 'bg-white text-navy-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  {RANGE_LABELS[r]}
                </button>
              ))}
            </div>
          )}

          <button
            onClick={fetchAll}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs border border-gray-200 hover:border-gray-300 rounded-lg px-3 py-1.5 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* ── Summary KPI strip ────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <KpiCard label="Total Sessions"     value={sessions.length}    prevValue={prevSessions.length}   icon={Monitor}    iconColor="text-blue-600"   iconBg="bg-blue-50" />
            <KpiCard label="Clearance Searches" value={searches.length}    prevValue={prevSearches.length}   icon={Search}     iconColor="text-amber-600"  iconBg="bg-amber-50" />
            <KpiCard label="Filings Started"    value={startedEvents.length} prevValue={prevFilings.filter((e: any) => e.event_type === 'process_started').length} icon={FileText} iconColor="text-teal-600" iconBg="bg-teal-50" />
            <KpiCard label="Filing Revenue"     value={totalRevenue}       prevValue={prevRevenue}           icon={CreditCard} iconColor="text-emerald-600" iconBg="bg-emerald-50" prefix="$" />
          </div>

          {/* ── Tabs ─────────────────────────────────────────────────────────── */}
          <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1">
            {tabItems.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id ? 'bg-white text-navy-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon size={14} />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${activeTab === tab.id ? 'bg-gold-100 text-gold-700' : 'bg-gray-200 text-gray-500'}`}>
                  {tab.count.toLocaleString()}
                </span>
              </button>
            ))}
          </div>

          {/* ══════════════════════════════════════════════════════════════════ */}
          {/* TAB: WEBSITE SESSIONS                                             */}
          {/* ══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'sessions' && (
            <div className="space-y-5">
              {/* Summary cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-500">Total Sessions</span>
                    <MiniBarChart data={sessionSparkline} />
                  </div>
                  <div className="text-2xl font-bold text-navy-900">{sessions.length.toLocaleString()}</div>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                  <span className="text-xs text-gray-500">Unique IPs</span>
                  <div className="text-2xl font-bold text-navy-900 mt-2">{uniqueIPs(sessions).toLocaleString()}</div>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                  <span className="text-xs text-gray-500">Top Country</span>
                  <div className="text-lg font-bold text-navy-900 mt-2 truncate">{sessionCountries[0]?.[0] ?? '—'}</div>
                  <div className="text-xs text-gray-400">{sessionCountries[0]?.[1] ?? 0} sessions</div>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                  <span className="text-xs text-gray-500">Mobile %</span>
                  <div className="text-2xl font-bold text-navy-900 mt-2">
                    {sessions.length > 0 ? Math.round((sessions.filter(s => s.device_type === 'mobile').length / sessions.length) * 100) : 0}%
                  </div>
                </div>
              </div>

              {/* Breakdown grids */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <RankList title="Top Countries"  items={sessionCountries} icon={Globe} />
                <RankList title="Device Types"   items={sessionDevices}   icon={Monitor} />
                <RankList title="Operating Systems" items={sessionOS}     icon={Smartphone} />
                <RankList title="Languages"      items={sessionLangs}     icon={Globe} />
              </div>

              {/* Table */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-3 flex-wrap">
                  <h2 className="font-semibold text-navy-900">Sessions Log</h2>
                  <div className="flex items-center gap-2 flex-wrap">
                    <input
                      type="text"
                      placeholder="Filter…"
                      value={sessionFilter}
                      onChange={e => { setSessionFilter(e.target.value); setSessionPage(0); }}
                      className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 w-40 focus:outline-none focus:ring-1 focus:ring-gold-400"
                    />
                    <button
                      onClick={() => setSortDir(d => d === 'desc' ? 'asc' : 'desc')}
                      className="flex items-center gap-1 text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      {sortDir === 'desc' ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
                      {sortDir === 'desc' ? 'Newest first' : 'Oldest first'}
                    </button>
                    <button
                      onClick={() => exportCSV(filteredSessions.map(s => ({ date: fmtDate(s.created_at), time: fmtTime(s.created_at), ip: s.ip_address, city: s.city, country: s.country, device: s.device_type, os: s.os, browser: s.browser, path: s.page_path, language: s.language, referrer: s.referrer })), 'sessions.csv')}
                      className="flex items-center gap-1 text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      <Download size={11} /> Export CSV
                    </button>
                  </div>
                </div>
                {sortedPaginatedSessions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                    <BarChart2 size={28} className="mb-2" />
                    <p className="text-sm">No sessions in this period</p>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-100 bg-gray-50">
                            {['Date', 'Time', 'IP Address', 'City', 'Country', 'Device', 'OS', 'Browser', 'Page', 'Language'].map(h => (
                              <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {sortedPaginatedSessions.map(s => (
                            <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-4 py-2.5 text-xs text-gray-600 whitespace-nowrap">{fmtDate(s.created_at)}</td>
                              <td className="px-4 py-2.5 text-xs text-gray-500 whitespace-nowrap">{fmtTime(s.created_at)}</td>
                              <td className="px-4 py-2.5 text-xs font-mono text-gray-600">{s.ip_address ?? '—'}</td>
                              <td className="px-4 py-2.5 text-xs text-gray-600">{s.city ?? '—'}</td>
                              <td className="px-4 py-2.5 text-xs text-gray-600">{s.country ?? '—'}</td>
                              <td className="px-4 py-2.5">
                                <DeviceBadge type={s.device_type} />
                              </td>
                              <td className="px-4 py-2.5 text-xs text-gray-600">{s.os ?? '—'}</td>
                              <td className="px-4 py-2.5 text-xs text-gray-600">{s.browser ?? '—'}</td>
                              <td className="px-4 py-2.5 text-xs text-gray-500 max-w-[180px] truncate">{s.page_path ?? '—'}</td>
                              <td className="px-4 py-2.5 text-xs text-gray-500 uppercase">{s.language ?? '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <Pagination
                      page={sessionPage} setPage={setSessionPage}
                      total={filteredSessions.length} pageSize={PAGE_SIZE}
                    />
                  </>
                )}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════ */}
          {/* TAB: TRADEMARK SEARCHES                                           */}
          {/* ══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'searches' && (
            <div className="space-y-5">
              {/* Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-500">Total Searches</span>
                    <MiniBarChart data={searchSparkline} color="bg-amber-400" />
                  </div>
                  <div className="text-2xl font-bold text-navy-900">{searches.length.toLocaleString()}</div>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                  <span className="text-xs text-gray-500">Unique IPs</span>
                  <div className="text-2xl font-bold text-navy-900 mt-2">{uniqueIPs(searches).toLocaleString()}</div>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                  <span className="text-xs text-gray-500">Top Mark</span>
                  <div className="text-base font-bold text-navy-900 mt-2 truncate">{topMarks[0]?.[0] ?? '—'}</div>
                  <div className="text-xs text-gray-400">{topMarks[0]?.[1] ?? 0} searches</div>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                  <span className="text-xs text-gray-500">Top Country</span>
                  <div className="text-lg font-bold text-navy-900 mt-2 truncate">{searchCountries[0]?.[0] ?? '—'}</div>
                </div>
              </div>

              {/* Risk breakdown */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                <h3 className="text-sm font-semibold text-navy-900 mb-3">Risk Distribution</h3>
                <div className="flex gap-4 flex-wrap">
                  {(['low', 'medium', 'high'] as const).map(risk => {
                    const count = searches.filter(s => s.result_risk === risk).length;
                    const pct = searches.length > 0 ? Math.round((count / searches.length) * 100) : 0;
                    const colors = { low: 'bg-emerald-100 text-emerald-700', medium: 'bg-amber-100 text-amber-700', high: 'bg-red-100 text-red-700' };
                    return (
                      <div key={risk} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl ${colors[risk]}`}>
                        <span className="text-sm font-bold">{count}</span>
                        <span className="text-xs capitalize font-medium">{risk} risk</span>
                        <span className="text-xs opacity-70">({pct}%)</span>
                      </div>
                    );
                  })}
                  <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-100 text-gray-600">
                    <span className="text-sm font-bold">{searches.filter(s => !s.result_risk).length}</span>
                    <span className="text-xs font-medium">Not run</span>
                  </div>
                </div>
              </div>

              {/* Rank lists */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <RankList title="Top Searched Marks"   items={topMarks}        icon={Search} />
                <RankList title="Top Countries"        items={searchCountries} icon={Globe} />
                <RankList title="Top Nice Classes"     items={topClasses}      icon={FileText} />
              </div>

              {/* Table */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-3 flex-wrap">
                  <h2 className="font-semibold text-navy-900">Search Log</h2>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Filter mark / country…"
                      value={searchFilter}
                      onChange={e => { setSearchFilter(e.target.value); setSearchPage(0); }}
                      className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 w-48 focus:outline-none focus:ring-1 focus:ring-gold-400"
                    />
                    <button
                      onClick={() => exportCSV(filteredSearches.map(s => ({ date: fmtDate(s.created_at), time: fmtTime(s.created_at), ip: s.ip_address, city: s.city, country: s.country, device: s.device_type, os: s.os, mark: s.mark_searched, classes: (s.classes_searched ?? []).join('; '), language: s.language, risk: s.result_risk })), 'clearance-searches.csv')}
                      className="flex items-center gap-1 text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      <Download size={11} /> Export CSV
                    </button>
                  </div>
                </div>
                {paginatedSearches.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                    <Search size={28} className="mb-2" />
                    <p className="text-sm">No searches in this period</p>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-100 bg-gray-50">
                            {['Date', 'Time', 'IP Address', 'City', 'Country', 'Device', 'OS', 'Mark Searched', 'Classes', 'Language', 'Risk'].map(h => (
                              <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {paginatedSearches.map(s => (
                            <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-4 py-2.5 text-xs text-gray-600 whitespace-nowrap">{fmtDate(s.created_at)}</td>
                              <td className="px-4 py-2.5 text-xs text-gray-500 whitespace-nowrap">{fmtTime(s.created_at)}</td>
                              <td className="px-4 py-2.5 text-xs font-mono text-gray-600">{s.ip_address ?? '—'}</td>
                              <td className="px-4 py-2.5 text-xs text-gray-600">{s.city ?? '—'}</td>
                              <td className="px-4 py-2.5 text-xs text-gray-600">{s.country ?? '—'}</td>
                              <td className="px-4 py-2.5"><DeviceBadge type={s.device_type} /></td>
                              <td className="px-4 py-2.5 text-xs text-gray-600">{s.os ?? '—'}</td>
                              <td className="px-4 py-2.5 text-xs font-semibold text-navy-900 max-w-[160px] truncate">{s.mark_searched ?? '—'}</td>
                              <td className="px-4 py-2.5 text-xs text-gray-500">
                                {(s.classes_searched ?? []).length > 0
                                  ? (s.classes_searched ?? []).slice(0, 4).join(', ') + ((s.classes_searched ?? []).length > 4 ? '…' : '')
                                  : '—'}
                              </td>
                              <td className="px-4 py-2.5 text-xs text-gray-500 uppercase">{s.language ?? '—'}</td>
                              <td className="px-4 py-2.5">
                                <RiskBadge risk={s.result_risk} />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <Pagination
                      page={searchPage} setPage={setSearchPage}
                      total={filteredSearches.length} pageSize={PAGE_SIZE}
                    />
                  </>
                )}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════ */}
          {/* TAB: FILING & PAYMENTS                                            */}
          {/* ══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'filings' && (
            <div className="space-y-5">
              {/* KPIs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-navy-900 rounded-xl p-4 text-white">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp size={14} className="text-gold-400" />
                    <span className="text-xs text-gray-400">Filing Revenue</span>
                  </div>
                  <div className="text-2xl font-bold">${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                  <div className="text-xs text-gray-500 mt-1">{paidEvents.length} paid filing{paidEvents.length !== 1 ? 's' : ''}</div>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                  <span className="text-xs text-gray-500">Processes Started</span>
                  <div className="text-2xl font-bold text-navy-900 mt-2">{startedEvents.length}</div>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                  <span className="text-xs text-gray-500">Payments Completed</span>
                  <div className="text-2xl font-bold text-navy-900 mt-2">{paidEvents.length}</div>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                  <span className="text-xs text-gray-500">Avg. Order Value</span>
                  <div className="text-2xl font-bold text-navy-900 mt-2">
                    ${paidEvents.length > 0 ? (totalRevenue / paidEvents.length).toFixed(0) : '—'}
                  </div>
                </div>
              </div>

              {/* Conversion funnel */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <h3 className="text-sm font-semibold text-navy-900 mb-4">Conversion Funnel</h3>
                <div className="flex items-center gap-0 flex-wrap">
                  <FunnelStep label="Clearance Searches" count={searches.length} color="bg-amber-100 text-amber-800" />
                  <FunnelArrow pct={convSearchToStart} />
                  <FunnelStep label="Filings Started" count={startedEvents.length} color="bg-blue-100 text-blue-800" />
                  <FunnelArrow pct={convStartToPaid} />
                  <FunnelStep label="Payments Completed" count={paidEvents.length} color="bg-emerald-100 text-emerald-800" />
                </div>
              </div>

              {/* Sub-tabs */}
              <div className="flex gap-1 bg-gray-100 rounded-xl p-1 max-w-sm">
                {(['started', 'paid'] as const).map(st => (
                  <button
                    key={st}
                    onClick={() => { setFilingSubTab(st); setFilingPage(0); }}
                    className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-colors ${filingSubTab === st ? 'bg-white text-navy-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    {st === 'started' ? `Processes Started (${startedEvents.length})` : `Payments (${paidEvents.length})`}
                  </button>
                ))}
              </div>

              {/* Table */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2">
                  <h2 className="font-semibold text-navy-900">
                    {filingSubTab === 'started' ? 'Filing Processes Started' : 'Payments Completed'}
                  </h2>
                  <button
                    onClick={() => exportCSV(currentFilings.map(e => ({ date: fmtDate(e.created_at), time: fmtTime(e.created_at), ip: e.ip_address, city: e.city, country: e.country, device: e.device_type, os: e.os, language: e.language, application: (e.applications as any)?.case_number ?? e.application_id, amount: e.amount_usd })), `filing-${filingSubTab}.csv`)}
                    className="flex items-center gap-1 text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    <Download size={11} /> Export CSV
                  </button>
                </div>
                {paginatedFilings.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                    <FileText size={28} className="mb-2" />
                    <p className="text-sm">No events in this period</p>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-100 bg-gray-50">
                            {['Date', 'Time', 'IP Address', 'City', 'Country', 'Device', 'OS', 'Language', 'Application', ...(filingSubTab === 'paid' ? ['Amount'] : [])].map(h => (
                              <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {paginatedFilings.map(e => (
                            <tr key={e.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-4 py-2.5 text-xs text-gray-600 whitespace-nowrap">{fmtDate(e.created_at)}</td>
                              <td className="px-4 py-2.5 text-xs text-gray-500 whitespace-nowrap">{fmtTime(e.created_at)}</td>
                              <td className="px-4 py-2.5 text-xs font-mono text-gray-600">{e.ip_address ?? '—'}</td>
                              <td className="px-4 py-2.5 text-xs text-gray-600">{e.city ?? '—'}</td>
                              <td className="px-4 py-2.5 text-xs text-gray-600">{e.country ?? '—'}</td>
                              <td className="px-4 py-2.5"><DeviceBadge type={e.device_type} /></td>
                              <td className="px-4 py-2.5 text-xs text-gray-600">{e.os ?? '—'}</td>
                              <td className="px-4 py-2.5 text-xs text-gray-500 uppercase">{e.language ?? '—'}</td>
                              <td className="px-4 py-2.5">
                                {e.application_id ? (
                                  <a href={`/admin/applications/${e.application_id}`} className="text-xs text-gold-600 hover:text-gold-700 font-medium">
                                    {(e.applications as any)?.case_number ?? e.application_id.slice(0, 8) + '…'}
                                  </a>
                                ) : <span className="text-xs text-gray-400">—</span>}
                              </td>
                              {filingSubTab === 'paid' && (
                                <td className="px-4 py-2.5 text-xs font-semibold text-emerald-700">
                                  {e.amount_usd != null ? `$${e.amount_usd.toFixed(2)}` : '—'}
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <Pagination
                      page={filingPage} setPage={setFilingPage}
                      total={currentFilings.length} pageSize={PAGE_SIZE}
                    />
                  </>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function DeviceBadge({ type }: { type: string | null }) {
  if (!type) return <span className="text-xs text-gray-400">—</span>;
  const map: Record<string, { icon: typeof Monitor; color: string }> = {
    desktop: { icon: Monitor,    color: 'text-blue-600 bg-blue-50' },
    mobile:  { icon: Smartphone, color: 'text-emerald-600 bg-emerald-50' },
    tablet:  { icon: Tablet,     color: 'text-amber-600 bg-amber-50' },
  };
  const cfg = map[type] ?? { icon: Monitor, color: 'text-gray-500 bg-gray-100' };
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full capitalize ${cfg.color}`}>
      <Icon size={10} />
      {type}
    </span>
  );
}

function RiskBadge({ risk }: { risk: string | null }) {
  if (!risk) return <span className="text-xs text-gray-400">—</span>;
  const colors: Record<string, string> = {
    low:    'bg-emerald-100 text-emerald-700',
    medium: 'bg-amber-100 text-amber-700',
    high:   'bg-red-100 text-red-700',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${colors[risk] ?? 'bg-gray-100 text-gray-500'}`}>
      {risk}
    </span>
  );
}

function Pagination({ page, setPage, total, pageSize }: { page: number; setPage: (p: number) => void; total: number; pageSize: number }) {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;
  return (
    <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
      <span className="text-xs text-gray-500">
        Showing {page * pageSize + 1}–{Math.min((page + 1) * pageSize, total)} of {total.toLocaleString()}
      </span>
      <div className="flex items-center gap-1">
        <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="text-xs px-2.5 py-1 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors">Previous</button>
        <span className="text-xs text-gray-500 px-2">{page + 1} / {totalPages}</span>
        <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="text-xs px-2.5 py-1 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors">Next</button>
      </div>
    </div>
  );
}

function FunnelStep({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div className={`flex flex-col items-center px-5 py-3 rounded-xl ${color} min-w-[120px]`}>
      <div className="text-2xl font-bold">{count.toLocaleString()}</div>
      <div className="text-xs font-medium mt-0.5 text-center">{label}</div>
    </div>
  );
}

function FunnelArrow({ pct }: { pct: string }) {
  return (
    <div className="flex flex-col items-center px-3">
      <div className="text-xs font-semibold text-gray-600">{pct}%</div>
      <div className="text-gray-300 text-lg leading-none">→</div>
    </div>
  );
}
