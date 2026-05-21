import { CheckCircle2, X, Globe, ArrowRight, Sparkles, Brain } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage, type Language } from '../context/LanguageContext';

interface Props {
  lang?: Language;
  /** When true, renders as a modal-friendly inner panel (no outer section padding) */
  compact?: boolean;
  onClose?: () => void;
}

interface Competitor {
  name: string;
  price: number;
}

const MTC_PRICE = 299;

// Competitors sorted alphabetically — data from published prices as of May 2026
const COMPETITORS: Competitor[] = [
  { name: 'Bonamark',               price: 533 },
  { name: 'Flatfee Corp',           price: 600 },
  { name: 'Markavo',                price: 566 },
  { name: 'MiRegistroDeMarca.com',  price: 870 },
  { name: 'Nombrare',               price: 440 },
  { name: 'Trademark Angel',        price: 713 },
  { name: 'Trademarkia',            price: 670 },
  { name: 'TramaTM',                price: 841 },
  { name: 'United Legal Experts',   price: 985 },
];

const YES = <CheckCircle2 size={16} className="text-emerald-500 mx-auto" />;
const NO  = <X size={15} className="text-red-400 mx-auto" />;

export default function ComparisonSection({ lang, compact = false, onClose }: Props) {
  const { t } = useLanguage();

  const table = (
    <div className="rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-xs min-w-[600px]">
          {/* Column headers */}
          <thead>
            <tr className="bg-navy-950 text-white">
              <th className="text-left px-4 py-3 font-semibold uppercase tracking-wider text-[10px] w-[30%]">
                {t('comparison.col.service')}
              </th>
              <th className="text-center px-3 py-3 font-semibold uppercase tracking-wider text-[10px] w-[13%]">
                {t('comparison.col.price')}
              </th>
              <th className="text-center px-2 py-3 font-semibold uppercase tracking-wider text-[10px] w-[13%]">
                {t('comparison.col.inclusive')}
              </th>
              <th className="text-center px-2 py-3 font-semibold uppercase tracking-wider text-[10px] w-[15%]">
                <span className="flex flex-col items-center gap-0.5">
                  <Sparkles size={11} className="text-gold-400" />
                  {t('comparison.col.aiClearance')}
                </span>
              </th>
              <th className="text-center px-2 py-3 font-semibold uppercase tracking-wider text-[10px] w-[15%]">
                <span className="flex flex-col items-center gap-0.5">
                  <Brain size={11} className="text-gold-400" />
                  {t('comparison.col.aiClassify')}
                </span>
              </th>
              <th className="text-center px-2 py-3 font-semibold uppercase tracking-wider text-[10px] w-[14%]">
                <span className="flex flex-col items-center gap-0.5">
                  <Globe size={11} className="text-gold-400" />
                  {t('comparison.col.multilingual')}
                </span>
              </th>
            </tr>
          </thead>

          <tbody>
            {/* MTC row — pinned at top */}
            <tr className="bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-50 border-b-2 border-gold-200 relative">
              <td className="px-4 py-3">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gold-500 rounded-r-sm" />
                <div>
                  <span className="font-bold text-navy-900 text-[11px] leading-tight block">
                    MexicoTrademarkCenter.com
                  </span>
                  <span className="inline-flex items-center gap-1 mt-0.5 text-[9px] font-semibold bg-gold-100 text-gold-800 border border-gold-300 px-1.5 py-0.5 rounded-full">
                    {t('comparison.lowestPrice')}
                  </span>
                </div>
              </td>
              <td className="px-3 py-3 text-center">
                <span className="text-base font-extrabold text-navy-900 block leading-none">$299</span>
                <CheckCircle2 size={12} className="text-emerald-500 mx-auto mt-0.5" />
              </td>
              <td className="px-2 py-3 text-center">{YES}</td>
              <td className="px-2 py-3 text-center">{YES}</td>
              <td className="px-2 py-3 text-center">{YES}</td>
              <td className="px-2 py-3 text-center">
                <span className="inline-flex items-center gap-1 bg-navy-900 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                  <Globe size={9} />
                  8
                </span>
              </td>
            </tr>

            {/* Competitors */}
            {COMPETITORS.map((c, i) => (
              <tr
                key={c.name}
                className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                  i % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'
                }`}
              >
                <td className="px-4 py-2.5">
                  <span className="font-medium text-gray-600 text-[11px]">{c.name}</span>
                </td>
                <td className="px-3 py-2.5 text-center">
                  <span className="font-semibold text-gray-400 block leading-none">${c.price}</span>
                  <X size={10} className="text-red-400 mx-auto mt-0.5" />
                </td>
                <td className="px-2 py-2.5 text-center">{NO}</td>
                <td className="px-2 py-2.5 text-center">{NO}</td>
                <td className="px-2 py-2.5 text-center">{NO}</td>
                <td className="px-2 py-2.5 text-center">{NO}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer note */}
      <div className="bg-gray-50 border-t border-gray-100 px-4 py-2.5">
        <p className="text-[10px] text-gray-400 leading-relaxed italic">
          {t('comparison.footer')}
        </p>
      </div>
    </div>
  );

  // Modal / inline-compact mode (used in HomePage popup)
  if (compact) {
    return (
      <div className="w-full">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-[10px] font-semibold text-gold-600 uppercase tracking-wider mb-0.5">
              {t('comparison.eyebrow')}
            </p>
            <h3 className="text-base font-bold font-serif text-navy-900 leading-snug">
              {t('comparison.title')}
            </h3>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-700 transition-colors p-1 rounded-lg hover:bg-gray-100 flex-shrink-0 ml-4"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          )}
        </div>
        {table}
        <div className="mt-4 text-center">
          <Link
            to="/apply"
            onClick={onClose}
            className="inline-flex items-center gap-2 bg-gold-500 hover:bg-gold-400 text-navy-950 font-bold px-6 py-3 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg text-sm"
          >
            {t('comparison.cta')}
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    );
  }

  // Full section mode (used in LandingPage)
  return (
    <section className="py-14 lg:py-18 bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 text-gold-600 font-semibold text-sm uppercase tracking-wider mb-3">
            <span className="w-6 h-px bg-gold-400 inline-block" />
            {t('comparison.eyebrow')}
            <span className="w-6 h-px bg-gold-400 inline-block" />
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold font-serif text-navy-900 mb-3 leading-snug">
            {t('comparison.title')}
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto text-sm leading-relaxed">
            {t('comparison.subtitle')}
          </p>
        </div>

        {table}

        <div className="mt-7 text-center">
          <Link
            to="/apply"
            className="inline-flex items-center gap-2 bg-gold-500 hover:bg-gold-400 text-navy-950 font-bold px-8 py-4 rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5 text-base"
          >
            {t('comparison.cta')}
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
