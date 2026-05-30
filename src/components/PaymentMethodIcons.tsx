import { useLanguage } from '../context/LanguageContext';

interface Props {
  size?: 'sm' | 'md';
  align?: 'center' | 'left';
  variant?: 'light' | 'dark';
}

// Each icon is a self-contained SVG. fill/stroke use currentColor so the parent
// color class controls appearance — white on dark backgrounds, gray on light.
function VisaIcon({ h }: { h: number }) {
  return (
    <svg height={h} viewBox="0 0 50 16" aria-label="Visa" fill="currentColor">
      <text y="14" fontFamily="Arial, Helvetica, sans-serif" fontWeight="900" fontSize="15" letterSpacing="0">VISA</text>
    </svg>
  );
}

function MastercardIcon({ h }: { h: number }) {
  return (
    <svg height={h} viewBox="0 0 36 24" aria-label="Mastercard">
      <circle cx="13" cy="12" r="10" fill="currentColor" fillOpacity="0.85" />
      <circle cx="23" cy="12" r="10" fill="currentColor" fillOpacity="0.5" />
      <path d="M18 5.8a10 10 0 010 12.4A10 10 0 0118 5.8z" fill="currentColor" fillOpacity="0.65" />
    </svg>
  );
}

function AmexIcon({ h }: { h: number }) {
  return (
    <svg height={h} viewBox="0 0 48 20" aria-label="American Express" fill="currentColor">
      <rect x="0" y="0" width="48" height="20" rx="3" fillOpacity="0.15" />
      <text x="5" y="14.5" fontFamily="Arial, Helvetica, sans-serif" fontWeight="800" fontSize="11" letterSpacing="1">AMEX</text>
    </svg>
  );
}

function PayPalIcon({ h }: { h: number }) {
  return (
    <svg height={h} viewBox="0 0 52 20" aria-label="PayPal" fill="currentColor">
      <text y="15" fontFamily="Arial, Helvetica, sans-serif" fontWeight="800" fontSize="14" letterSpacing="-0.3">PayPal</text>
    </svg>
  );
}

function BankIcon({ h }: { h: number }) {
  return (
    <svg height={h} viewBox="0 0 24 24" aria-label="Bank Transfer" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10h18M12 3l9 7H3l9-7zM5 10v8M8 10v8M12 10v8M16 10v8M19 10v8M3 18h18" />
    </svg>
  );
}

function PixIcon({ h }: { h: number }) {
  // Simplified Pix-style rotated diamond/key shape
  return (
    <svg height={h} viewBox="0 0 24 24" aria-label="Pix" fill="currentColor">
      <path d="M9.5 4.5L4.5 9.5a3.5 3.5 0 000 5l5 5a3.5 3.5 0 005 0l5-5a3.5 3.5 0 000-5l-5-5a3.5 3.5 0 00-5 0zm1.06 1.5l4-4a1.5 1.5 0 012.12 0l4 4a1.5 1.5 0 010 2.12l-4 4a1.5 1.5 0 01-2.12 0l-4-4a1.5 1.5 0 010-2.12z" fillOpacity="0.9" />
      <path d="M8 12l8 0M12 8l0 8" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function AlipayIcon({ h }: { h: number }) {
  return (
    <svg height={h} viewBox="0 0 52 20" aria-label="Alipay" fill="currentColor">
      <text y="15" fontFamily="Arial, Helvetica, sans-serif" fontWeight="700" fontSize="13" letterSpacing="-0.2">Alipay</text>
    </svg>
  );
}

function WeChatPayIcon({ h }: { h: number }) {
  return (
    <svg height={h} viewBox="0 0 24 24" aria-label="WeChat Pay" fill="currentColor">
      <path d="M9.5 2C5.36 2 2 5.13 2 9c0 2.06 1.01 3.9 2.6 5.15l-.6 2.35 2.6-1.3A8.3 8.3 0 009.5 15.5c.17 0 .34 0 .5-.02A6.5 6.5 0 0110 14c0-3.59 3.13-6.5 7-6.5.16 0 .31 0 .46.01C16.5 4.5 13.27 2 9.5 2z" fillOpacity="0.6" />
      <path d="M17 9.5c-2.76 0-5 1.79-5 4s2.24 4 5 4c.63 0 1.23-.1 1.78-.28L21 19l-.5-1.94C21.44 16.14 22 15.12 22 14c0-2.21-2.24-4.5-5-4.5z" />
    </svg>
  );
}

function CryptoIcon({ h }: { h: number }) {
  return (
    <svg height={h} viewBox="0 0 24 24" aria-label="Cryptocurrency" fill="currentColor">
      <path d="M11.5 4H8v4h3.5c1.1 0 2-.9 2-2s-.9-2-2-2zM8 13v4h3.5c1.1 0 2-.9 2-2s-.9-2-2-2H8zm8-4.5c.6-.7 1-1.6 1-2.5C17 4.35 15.65 3 14 3H6v18h8c2.21 0 4-1.79 4-4 0-1.45-.77-2.72-1.93-3.43C16.63 12.96 17 12.02 17 11c0-.54-.18-1.04-.5-1.5z" />
    </svg>
  );
}

const ICONS = [
  { id: 'visa',       label: 'Visa',             Component: VisaIcon,       widthRatio: 3.2 },
  { id: 'mastercard', label: 'Mastercard',        Component: MastercardIcon, widthRatio: 1.5 },
  { id: 'amex',       label: 'American Express',  Component: AmexIcon,       widthRatio: 2.4 },
  { id: 'paypal',     label: 'PayPal',            Component: PayPalIcon,     widthRatio: 2.8 },
  { id: 'bank',       label: 'Bank Transfer',     Component: BankIcon,       widthRatio: 1.0 },
  { id: 'pix',        label: 'Pix',               Component: PixIcon,        widthRatio: 1.0 },
  { id: 'alipay',     label: 'Alipay',            Component: AlipayIcon,     widthRatio: 2.8 },
  { id: 'wechat',     label: 'WeChat Pay',        Component: WeChatPayIcon,  widthRatio: 1.0 },
  { id: 'crypto',     label: 'Crypto',            Component: CryptoIcon,     widthRatio: 1.0 },
];

export default function PaymentMethodIcons({ size = 'md', align = 'center', variant = 'light' }: Props) {
  const { t } = useLanguage();

  const h = size === 'sm' ? 20 : 26;
  const gap = size === 'sm' ? 'gap-2' : 'gap-2.5';
  const labelSize = size === 'sm' ? 'text-[10px]' : 'text-[11px]';
  const justifyClass = align === 'center' ? 'justify-center' : 'justify-start';
  const colorClass = variant === 'light' ? 'text-white' : 'text-gray-400';
  const labelClass = variant === 'light' ? 'text-white/60' : 'text-gray-400';

  return (
    <div className={`flex flex-col ${align === 'center' ? 'items-center' : 'items-start'} gap-1.5`}>
      <span className={`${labelSize} font-medium ${labelClass} tracking-widest uppercase`}>
        {t('payment.accept')}
      </span>
      <div className={`flex flex-wrap ${justifyClass} ${gap} items-center ${colorClass}`}>
        {ICONS.map(({ id, label, Component }) => (
          <span key={id} className="inline-flex items-center opacity-75 hover:opacity-100 transition-opacity" title={label}>
            <Component h={h} />
          </span>
        ))}
      </div>
    </div>
  );
}
