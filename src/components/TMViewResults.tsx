import { useState } from 'react';
import {
  ExternalLink, ChevronDown, ChevronUp, Filter, AlertTriangle,
  CheckCircle2, Clock, XCircle, Database, Info, ChevronLeft, ChevronRight,
} from 'lucide-react';
import type { TMViewTrademark, TMViewResult } from '../lib/tmview';
import { tmviewDetailUrl, tmviewRiskContribution } from '../lib/tmview';

interface Props {
  result: TMViewResult;
  classes: number[];
  language: 'en' | 'zh' | 'es' | 'de' | 'fr' | 'hi' | 'pt';
  onPageChange?: (start: number) => void;
  loading?: boolean;
}

const PAGE_SIZE = 50;

const STATUS_CFG: Record<string, { label: string; labelEs: string; bg: string; text: string; dot: string }> = {
  Registered: { label: 'Registered', labelEs: 'Registrada', bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  Filed: { label: 'Filed', labelEs: 'En trámite', bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-400' },
  Expired: { label: 'Expired', labelEs: 'Vencida', bg: 'bg-gray-100', text: 'text-gray-500', dot: 'bg-gray-400' },
};

function statusCfg(status: string) {
  return STATUS_CFG[status] ?? { label: status, labelEs: status, bg: 'bg-gray-100', text: 'text-gray-500', dot: 'bg-gray-400' };
}

function StatusBadge({ status, lang }: { status: string; lang: string }) {
  const cfg = statusCfg(status);
  const label = lang === 'en' ? cfg.label : cfg.labelEs;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {label}
    </span>
  );
}

function fmtDate(d?: string): string {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return d;
  }
}

const UI = {
  en: {
    title: 'TMView / IMPI — Real-Time Registry',
    source: 'Source: TMDN/IMPI (real-time data)',
    freshness: 'Data syncs with IMPI periodically. For official verification, visit marcia.impi.gob.mx',
    found: (n: number) => `${n.toLocaleString()} trademark${n !== 1 ? 's' : ''} found in IMPI via TMView`,
    registered: 'Registered',
    filed: 'Filed',
    expired: 'Expired',
    colName: 'Name',
    colClasses: 'Class(es)',
    colHolder: 'Holder',
    colStatus: 'Status',
    colRegDate: 'Reg. Date',
    colExpiry: 'Expiry',
    colActions: 'Actions',
    viewTMView: 'View in TMView',
    goodsServices: 'Goods & Services',
    noGs: 'No description available.',
    empty: 'No similar trademarks found in the Mexican registry.',
    filterStatus: 'Filter by status',
    filterClass: 'Filter by class',
    filterText: 'Search within results',
    all: 'All',
    prev: 'Previous',
    next: 'Next',
    page: 'Page',
    of: 'of',
    riskTitle: 'Risk Contribution',
    riskDesc: 'How this conflict count affects the overall registrability score:',
    low: '0–5 conflicts in same class: Low risk (+20 pts)',
    medium: '6–20 conflicts: Medium risk (0 pts)',
    high: '21–50 conflicts: High risk (−15 pts)',
    critical: '50+ conflicts: Critical risk (−30 pts)',
  },
  es: {
    title: 'TMView / IMPI — Registro en tiempo real',
    source: 'Fuente: TMDN/IMPI (datos en tiempo real)',
    freshness: 'Los datos se sincronizan con IMPI periódicamente. Para verificación oficial, consulta marcia.impi.gob.mx',
    found: (n: number) => `${n.toLocaleString()} marca${n !== 1 ? 's' : ''} encontrada${n !== 1 ? 's' : ''} en IMPI vía TMView`,
    registered: 'Registradas',
    filed: 'En trámite',
    expired: 'Vencidas',
    colName: 'Nombre',
    colClasses: 'Clase(s)',
    colHolder: 'Titular',
    colStatus: 'Estado',
    colRegDate: 'Fecha Registro',
    colExpiry: 'Vencimiento',
    colActions: 'Acciones',
    viewTMView: 'Ver en TMView',
    goodsServices: 'Productos y Servicios',
    noGs: 'Sin descripción disponible.',
    empty: 'No se encontraron marcas similares en el registro de México.',
    filterStatus: 'Filtrar por estado',
    filterClass: 'Filtrar por clase',
    filterText: 'Buscar en resultados',
    all: 'Todos',
    prev: 'Anterior',
    next: 'Siguiente',
    page: 'Página',
    of: 'de',
    riskTitle: 'Contribución al riesgo',
    riskDesc: 'Cómo este número de conflictos afecta la puntuación de registrabilidad:',
    low: '0–5 conflictos en la misma clase: Riesgo bajo (+20 pts)',
    medium: '6–20 conflictos: Riesgo medio (0 pts)',
    high: '21–50 conflictos: Riesgo alto (−15 pts)',
    critical: '50+ conflictos: Riesgo crítico (−30 pts)',
  },
};

function tr(key: keyof typeof UI['en'], lang: string): string | ((n: number) => string) {
  const dict = (lang === 'en' ? UI.en : UI.es) as Record<string, string | ((n: number) => string)>;
  return dict[key] ?? (UI.en as Record<string, string | ((n: number) => string)>)[key] ?? key;
}

function t(key: keyof typeof UI['en'], lang: string): string {
  const val = tr(key, lang);
  return typeof val === 'string' ? val : key;
}

export default function TMViewResults({ result, classes, language, onPageChange, loading = false }: Props) {
  const lang = language === 'en' ? 'en' : 'es';
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [classFilter, setClassFilter] = useState<string>('all');
  const [textFilter, setTextFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const toggleRow = (st13: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(st13)) next.delete(st13);
      else next.add(st13);
      return next;
    });
  };

  const filtered = result.trademarks.filter(tm => {
    if (statusFilter !== 'all' && tm.status !== statusFilter) return false;
    if (classFilter !== 'all' && !tm.niceClasses.includes(Number(classFilter))) return false;
    if (textFilter) {
      const q = textFilter.toLowerCase();
      if (!tm.name.toLowerCase().includes(q) && !tm.applicant.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(result.total / PAGE_SIZE));
  const currentPage = Math.floor(result.start / PAGE_SIZE) + 1;

  const countByStatus = (s: string) => result.trademarks.filter(tm => tm.status === s).length;
  const risk = tmviewRiskContribution(result.total);

  const availableClasses = Array.from(
    new Set(result.trademarks.flatMap(tm => tm.niceClasses))
  ).sort((a, b) => a - b);

  return (
    <div className="space-y-4">
      {/* ── Summary Banner ── */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="flex items-center gap-2">
              <Database size={16} className="text-blue-600 shrink-0" />
              <span className="text-sm font-semibold text-blue-900">
                {typeof tr('found', lang) === 'function'
                  ? (tr('found', lang) as (n: number) => string)(result.total)
                  : ''}
              </span>
            </div>
            <div className="flex items-center gap-1 mt-1">
              <Info size={12} className="text-blue-500 shrink-0" />
              <span className="text-xs text-blue-600">{t('source', lang)}</span>
            </div>
          </div>

          {/* Status breakdown chips */}
          <div className="flex flex-wrap gap-2">
            {(['Registered', 'Filed', 'Expired'] as const).map(s => {
              const count = countByStatus(s);
              const cfg = statusCfg(s);
              const label = lang === 'en' ? cfg.label : cfg.labelEs;
              return (
                <span key={s} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${cfg.bg} ${cfg.text} border-transparent`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                  {count} {label}
                </span>
              );
            })}
          </div>
        </div>

        {/* Freshness disclaimer */}
        <p className="text-xs text-blue-600/80 flex items-start gap-1">
          <AlertTriangle size={11} className="shrink-0 mt-0.5" />
          {t('freshness', lang)}
        </p>
      </div>

      {/* ── Filter Bar ── */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => setShowFilters(v => !v)}
          className="flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 transition-colors"
        >
          <Filter size={13} />
          {t('filterStatus', lang)}
          {showFilters ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>

        {(statusFilter !== 'all' || classFilter !== 'all' || textFilter) && (
          <button
            type="button"
            onClick={() => { setStatusFilter('all'); setClassFilter('all'); setTextFilter(''); }}
            className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors"
          >
            ✕ Clear filters
          </button>
        )}
      </div>

      {showFilters && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
          {/* Status filter */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">{t('filterStatus', lang)}</label>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full text-xs border border-gray-300 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">{t('all', lang)}</option>
              <option value="Registered">{lang === 'en' ? 'Registered' : 'Registradas'}</option>
              <option value="Filed">{lang === 'en' ? 'Filed' : 'En trámite'}</option>
              <option value="Expired">{lang === 'en' ? 'Expired' : 'Vencidas'}</option>
            </select>
          </div>

          {/* Class filter */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">{t('filterClass', lang)}</label>
            <select
              value={classFilter}
              onChange={e => setClassFilter(e.target.value)}
              className="w-full text-xs border border-gray-300 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">{t('all', lang)}</option>
              {availableClasses.map(c => (
                <option key={c} value={String(c)}>
                  {lang === 'en' ? `Class ${c}` : `Clase ${c}`}
                  {classes.includes(c) ? ' ★' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Text filter */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">{t('filterText', lang)}</label>
            <input
              type="text"
              value={textFilter}
              onChange={e => setTextFilter(e.target.value)}
              placeholder={lang === 'en' ? 'Name or holder...' : 'Nombre o titular...'}
              className="w-full text-xs border border-gray-300 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      )}

      {/* ── Conflict Table ── */}
      {loading ? (
        <SkeletonTable />
      ) : filtered.length === 0 ? (
        <div className="text-center py-10 text-gray-400 text-sm">{t('empty', lang)}</div>
      ) : (
        <div className="rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {([
                    ['colName', 'min-w-[160px]'],
                    ['colClasses', 'w-24'],
                    ['colHolder', 'min-w-[140px]'],
                    ['colStatus', 'w-28'],
                    ['colRegDate', 'w-28'],
                    ['colExpiry', 'w-24'],
                    ['colActions', 'w-28'],
                  ] as [keyof typeof UI['en'], string][]).map(([key, cls]) => (
                    <th key={key} className={`px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide ${cls}`}>
                      {t(key, lang)}
                    </th>
                  ))}
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(tm => {
                  const isExpanded = expandedRows.has(tm.st13);
                  return (
                    <>
                      <tr
                        key={tm.st13}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        {/* Name */}
                        <td className="px-3 py-2.5">
                          <span className="font-medium text-gray-900 text-xs">{tm.name || '—'}</span>
                          {tm.applicationNumber && (
                            <div className="text-gray-400 text-xs mt-0.5">{tm.applicationNumber}</div>
                          )}
                        </td>

                        {/* Classes */}
                        <td className="px-3 py-2.5">
                          <div className="flex flex-wrap gap-1">
                            {tm.niceClasses.map(c => (
                              <span
                                key={c}
                                className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium ${classes.includes(c) ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'}`}
                              >
                                {c}
                              </span>
                            ))}
                          </div>
                        </td>

                        {/* Holder */}
                        <td className="px-3 py-2.5 text-xs text-gray-700 max-w-[160px] truncate" title={tm.applicant}>
                          {tm.applicant || '—'}
                        </td>

                        {/* Status */}
                        <td className="px-3 py-2.5">
                          <StatusBadge status={tm.status} lang={lang} />
                        </td>

                        {/* Reg Date */}
                        <td className="px-3 py-2.5 text-xs text-gray-500">{fmtDate(tm.registrationDate)}</td>

                        {/* Expiry */}
                        <td className="px-3 py-2.5 text-xs text-gray-500">{fmtDate(tm.expiryDate)}</td>

                        {/* Actions */}
                        <td className="px-3 py-2.5">
                          {tm.st13 ? (
                            <a
                              href={tmviewDetailUrl(tm.st13)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
                            >
                              {t('viewTMView', lang)}
                              <ExternalLink size={11} />
                            </a>
                          ) : '—'}
                        </td>

                        {/* Expand toggle */}
                        <td className="px-2 py-2.5">
                          {tm.goodsAndServices && (
                            <button
                              type="button"
                              onClick={() => toggleRow(tm.st13)}
                              className="text-gray-400 hover:text-gray-600 transition-colors"
                              aria-label="Toggle goods & services"
                            >
                              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>
                          )}
                        </td>
                      </tr>

                      {/* Expanded goods & services row */}
                      {isExpanded && (
                        <tr key={`${tm.st13}-expanded`} className="bg-blue-50/50">
                          <td colSpan={8} className="px-4 py-3">
                            <p className="text-xs font-semibold text-gray-500 mb-1">{t('goodsServices', lang)}</p>
                            <p className="text-xs text-gray-700 leading-relaxed">
                              {tm.goodsAndServices || t('noGs', lang)}
                            </p>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Pagination ── */}
      {result.total > PAGE_SIZE && (
        <div className="flex items-center justify-between gap-3 pt-1">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => onPageChange?.(result.start - PAGE_SIZE)}
            className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={13} />
            {t('prev', lang)}
          </button>

          <span className="text-xs text-gray-500">
            {t('page', lang)} {currentPage} {t('of', lang)} {totalPages}
          </span>

          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange?.(result.start + PAGE_SIZE)}
            className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {t('next', lang)}
            <ChevronRight size={13} />
          </button>
        </div>
      )}

      {/* ── Risk Contribution ── */}
      <div className="border border-gray-200 rounded-xl p-4 space-y-3">
        <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">{t('riskTitle', lang)}</h4>
        <p className="text-xs text-gray-500">{t('riskDesc', lang)}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {(
            [
              { key: 'low', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', severity: 'low' },
              { key: 'medium', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', severity: 'medium' },
              { key: 'high', icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', severity: 'high' },
              { key: 'critical', icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', severity: 'critical' },
            ] as const
          ).map(({ key, icon: Icon, color, bg, border, severity }) => (
            <div
              key={key}
              className={`flex items-start gap-2 p-2.5 rounded-lg border text-xs ${bg} ${border} ${risk.severity === severity ? 'ring-2 ring-offset-1 ' + (severity === 'low' ? 'ring-emerald-400' : severity === 'medium' ? 'ring-amber-400' : severity === 'high' ? 'ring-orange-400' : 'ring-red-400') : ''}`}
            >
              <Icon size={13} className={`${color} shrink-0 mt-0.5`} />
              <span className="text-gray-700">{t(key as keyof typeof UI['en'], lang)}</span>
            </div>
          ))}
        </div>
        <div className="text-xs text-gray-500 pt-1">
          {lang === 'en'
            ? `Current score impact: ${risk.points > 0 ? '+' : ''}${risk.points} pts (${risk.label})`
            : `Impacto actual: ${risk.points > 0 ? '+' : ''}${risk.points} pts (${risk.labelEs})`}
        </div>
      </div>
    </div>
  );
}

function SkeletonTable() {
  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden animate-pulse">
      <div className="bg-gray-50 border-b border-gray-200 h-9" />
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-3 py-3 border-b border-gray-100 last:border-0">
          <div className="h-3 bg-gray-200 rounded flex-1" />
          <div className="h-3 bg-gray-200 rounded w-12" />
          <div className="h-3 bg-gray-200 rounded w-28" />
          <div className="h-3 bg-gray-200 rounded w-20" />
          <div className="h-3 bg-gray-200 rounded w-20" />
          <div className="h-3 bg-gray-200 rounded w-16" />
          <div className="h-3 bg-gray-200 rounded w-20" />
        </div>
      ))}
    </div>
  );
}

export { SkeletonTable };
export type { TMViewTrademark, TMViewResult };
