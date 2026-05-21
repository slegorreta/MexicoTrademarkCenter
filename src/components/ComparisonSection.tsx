import { CheckCircle2, X, Globe, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage, type Language } from '../context/LanguageContext';

interface Props {
  lang: Language;
}

interface Competitor {
  name: string;
  price: number;
  inclusive: false;
  multilingual: false;
}

const MTC_PRICE = 299;

// Competitors sorted alphabetically — data from published prices as of May 2026
const COMPETITORS: Competitor[] = [
  { name: 'Bonamark',               price: 533,  inclusive: false, multilingual: false },
  { name: 'Flatfee Corp',           price: 600,  inclusive: false, multilingual: false },
  { name: 'Markavo',                price: 566,  inclusive: false, multilingual: false },
  { name: 'MiRegistroDeMarca.com',  price: 870,  inclusive: false, multilingual: false },
  { name: 'Nombrere',               price: 440,  inclusive: false, multilingual: false },
  { name: 'Trademark Angel',        price: 713,  inclusive: false, multilingual: false },
  { name: 'Trademarkia',            price: 670,  inclusive: false, multilingual: false },
  { name: 'TramaTM',                price: 841,  inclusive: false, multilingual: false },
  { name: 'United Legal Experts',   price: 985,  inclusive: false, multilingual: false },
];

export default function ComparisonSection({ lang }: Props) {
  const { t } = useLanguage();

  return (
    <section className="py-16 lg:py-20 bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 text-gold-600 font-semibold text-sm uppercase tracking-wider mb-3">
            <span className="w-6 h-px bg-gold-400 inline-block" />
            {t('comparison.eyebrow')}
            <span className="w-6 h-px bg-gold-400 inline-block" />
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold font-serif text-navy-900 mb-4 leading-snug">
            {t('comparison.title')}
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto text-sm leading-relaxed">
            {t('comparison.subtitle')}
          </p>
        </div>

        {/* Table card */}
        <div className="rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          {/* Desktop table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[560px]">
              <thead>
                <tr className="bg-navy-950 text-white">
                  <th className="text-left px-5 py-4 font-semibold text-xs uppercase tracking-wider w-[44%]">
                    {t('comparison.col.service')}
                  </th>
                  <th className="text-center px-4 py-4 font-semibold text-xs uppercase tracking-wider w-[22%]">
                    {t('comparison.col.price')}
                  </th>
                  <th className="text-center px-4 py-4 font-semibold text-xs uppercase tracking-wider w-[17%]">
                    {t('comparison.col.inclusive')}
                  </th>
                  <th className="text-center px-4 py-4 font-semibold text-xs uppercase tracking-wider w-[17%]">
                    {t('comparison.col.multilingual')}
                  </th>
                </tr>
              </thead>

              <tbody>
                {/* MTC row — pinned at top, gold treatment */}
                <tr className="bg-gradient-to-r from-amber-50 via-gold-50 to-amber-50 border-b-2 border-gold-200 relative">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      {/* Gold left accent bar */}
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gold-500 rounded-r-sm" />
                      <div>
                        <span className="font-bold text-navy-900 text-base leading-tight block">
                          MexicoTrademarkCenter.com
                        </span>
                        <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-semibold bg-gold-100 text-gold-800 border border-gold-300 px-2 py-0.5 rounded-full">
                          {t('comparison.lowestPrice')}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-xl font-extrabold text-navy-900 leading-none">$299</span>
                      <CheckCircle2 size={14} className="text-emerald-500" />
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <div className="flex justify-center">
                      <CheckCircle2 size={20} className="text-emerald-500" />
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <div className="inline-flex items-center gap-1.5 bg-navy-900 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
                        <Globe size={10} />
                        {t('comparison.languages')}
                      </div>
                    </div>
                  </td>
                </tr>

                {/* Competitor rows — alphabetical */}
                {COMPETITORS.map((c, i) => (
                  <tr
                    key={c.name}
                    className={`border-b border-gray-100 transition-colors hover:bg-gray-50 ${
                      i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                    }`}
                  >
                    <td className="px-5 py-3.5">
                      <span className="font-medium text-gray-700">{c.name}</span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="font-semibold text-gray-500">${c.price}</span>
                        <X size={12} className="text-red-400" />
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <div className="flex justify-center">
                        <X size={18} className="text-red-400" />
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <div className="flex justify-center">
                        <X size={18} className="text-red-400" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer note */}
          <div className="bg-gray-50 border-t border-gray-100 px-5 py-3">
            <p className="text-[11px] text-gray-400 leading-relaxed italic">
              {t('comparison.footer')}
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-8 text-center">
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
