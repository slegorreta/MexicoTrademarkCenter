import { Tag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

interface Props {
  variant?: 'float' | 'inline';
  hidden?: boolean;
}

export default function PriceGuaranteeBadge({ variant = 'float', hidden = false }: Props) {
  const { language, t } = useLanguage();

  if (hidden) return null;

  const label = language === 'zh'
    ? '墨西哥最低价'
    : language === 'es'
    ? 'El precio más bajo en México'
    : language === 'de'
    ? 'Niedrigster Preis in Mexiko'
    : language === 'fr'
    ? 'Prix le plus bas au Mexique'
    : language === 'hi'
    ? 'मेक्सिको में सबसे कम कीमत'
    : language === 'pt'
    ? 'Menor preço no México'
    : language === 'ja'
    ? 'メキシコで最低価格'
    : language === 'it'
    ? 'Prezzo più basso in Messico'
    : 'Lowest price in Mexico';

  if (variant === 'inline') {
    return (
      <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-300 rounded-2xl px-4 py-2.5 shadow-sm">
        <Tag size={13} className="text-amber-500 flex-shrink-0" />
        <span className="text-xs font-bold text-amber-800 tracking-wide">{label}</span>
      </div>
    );
  }

  // Float variant — fixed to bottom-left
  return (
    <div className="fixed bottom-6 left-4 z-40 group">
      <div className="absolute inset-0 rounded-2xl bg-amber-400/30 animate-ping group-hover:animate-none" />
      <div className="relative flex flex-col gap-1.5 bg-white border-2 border-amber-400 rounded-2xl px-4 py-3 shadow-xl hover:shadow-2xl transition-shadow max-w-[240px]">
        <div className="flex items-center gap-2.5">
          <Tag size={15} className="text-amber-500 flex-shrink-0" />
          <p className="text-[11px] font-extrabold text-navy-900 leading-tight tracking-wide uppercase">
            {label}
          </p>
        </div>
        <Link
          to="/apply"
          className="text-[11px] font-semibold text-amber-600 hover:text-amber-700 transition-colors leading-snug pl-[23px]"
        >
          {t('widget.cta')}
        </Link>
      </div>
    </div>
  );
}
