import { Star } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface Props {
  variant?: 'float' | 'inline';
  hidden?: boolean;
}

export default function PriceGuaranteeBadge({ variant = 'float', hidden = false }: Props) {
  const { language } = useLanguage();

  if (hidden) return null;

  const label = language === 'zh'
    ? '市场最低价，有保障。'
    : language === 'es'
    ? 'El precio más bajo del mercado, garantizado.'
    : language === 'de'
    ? 'Günstigster Preis am Markt, garantiert.'
    : language === 'fr'
    ? 'Le prix le plus bas du marché, garanti.'
    : language === 'hi'
    ? 'बाज़ार में सबसे कम दाम, गारंटी के साथ।'
    : language === 'pt'
    ? 'O menor preço do mercado, garantido.'
    : language === 'ja'
    ? '業界最低価格、保証付き。'
    : 'Lowest price in the market, guaranteed.';

  if (variant === 'inline') {
    return (
      <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-300 rounded-2xl px-4 py-2.5 shadow-sm">
        <div className="flex gap-0.5 flex-shrink-0">
          {[0,1,2,3,4].map(i => (
            <Star key={i} size={11} className="fill-amber-400 text-amber-400" />
          ))}
        </div>
        <span className="text-xs font-bold text-amber-800 tracking-wide">{label}</span>
      </div>
    );
  }

  // Float variant — fixed to bottom-left
  return (
    <div className="fixed bottom-6 left-4 z-40 group">
      {/* Glow pulse ring */}
      <div className="absolute inset-0 rounded-2xl bg-amber-400/30 animate-ping group-hover:animate-none" />

      <div className="relative flex items-center gap-2.5 bg-white border-2 border-amber-400 rounded-2xl px-4 py-3 shadow-xl hover:shadow-2xl transition-shadow cursor-default max-w-[220px]">
        {/* Star cluster */}
        <div className="flex-shrink-0 flex flex-col items-center gap-0.5">
          <div className="flex gap-0.5">
            {[0,1,2].map(i => (
              <Star key={i} size={13} className="fill-amber-400 text-amber-400" />
            ))}
          </div>
          <div className="flex gap-0.5">
            {[0,1].map(i => (
              <Star key={i} size={13} className="fill-amber-400 text-amber-400" />
            ))}
          </div>
        </div>

        <div>
          <p className="text-[11px] font-extrabold text-navy-900 leading-tight tracking-wide uppercase">
            {label}
          </p>
          <p className="text-[10px] text-gray-500 mt-0.5 leading-tight">
            {language === 'zh' ? '法律费用价格匹配' : language === 'es' ? 'Igualación de precio en honorarios' : language === 'de' ? 'Preisanpassung auf Servicegebühren' : language === 'fr' ? 'Alignement de prix sur les honoraires' : language === 'hi' ? 'कानूनी शुल्क पर मूल्य समानता' : language === 'pt' ? 'Igualdade de preço em honorários' : language === 'ja' ? 'サービス料の価格保証' : 'Price match on legal fees'}
          </p>
        </div>
      </div>
    </div>
  );
}
