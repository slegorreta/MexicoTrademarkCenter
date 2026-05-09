import { ExternalLink } from 'lucide-react';

interface CurrencyDisplayProps {
  usdAmount: number;
  targetCurrency: string;
  chargedInLabel: string;
  viewInLabel: string;
}

export default function CurrencyDisplay({
  usdAmount,
  targetCurrency,
  chargedInLabel,
  viewInLabel,
}: CurrencyDisplayProps) {
  const xeUrl = `https://www.xe.com/currencyconverter/convert/?Amount=${usdAmount}&From=USD&To=${targetCurrency}`;

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold text-white">USD ${usdAmount}</span>
        <span className="text-sm text-gray-400 font-medium">/ class</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs text-gray-400">{chargedInLabel}</span>
        {targetCurrency !== 'USD' && (
          <a
            href={xeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-gold-400 hover:text-gold-300 transition-colors font-medium"
          >
            {viewInLabel} {targetCurrency}
            <ExternalLink size={10} />
          </a>
        )}
      </div>
    </div>
  );
}
