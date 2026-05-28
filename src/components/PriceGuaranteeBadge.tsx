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
        </div>
      </div>
    </div>
  );
}
