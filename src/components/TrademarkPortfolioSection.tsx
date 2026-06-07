import { useMemo } from 'react';
import { useLanguage } from '../context/LanguageContext';

const ALL_BRANDS = [
  'FUOMO', 'FOFL', 'FOFL FLASH', 'POMUIKA', 'JAVENCEN', 'ISTOIIS', 'FP DIESEL',
  'NODQDU', 'WOOFVIG', 'FULUODE', 'UEUXFWK', 'FEDRIO', 'BUEART DESIGN', 'MIXZENT',
  'LUVANO', 'YZLDM', 'ULYAN ARCHARE', 'LILULAMEM', 'BIGHEIMER', 'ZKONLY', 'LERAYA',
  'LUNIVORINNA', 'MYCNLEE', 'YSENSHEKO', 'AMHHER', 'TABWEE', 'MTEZIZ', 'VATTVEX',
  'UHPPOTE', 'GODERY', 'KAYOTOM RADIOS', 'YALALAJO', 'SIENWINY', 'DOCREATE',
  'MOTUCHUA', 'COXYZOXY', 'APOWER', 'INDEVOLT', 'GEESONG', 'ZEEZON', 'JTTIO',
  'DDJIUHAO', 'GGFEELD', 'GALOVEBBST', 'GIPHTPOEET', 'HOMENJOY', 'FEYNYN', 'JUALYUE',
  'KUYYFDS', 'NTCBAZL', 'NZIDGNNRL', 'RUYLLGDR', 'TOGRHLFE', 'VUIKIBMTY', 'ZIUETUYNL',
  'KAELTHRENOX', 'THALQRENIX', 'SEHAWEI', 'LOXTHARVYN', 'BRELAN', 'HAITEL LIRA',
  'AELLGAN', 'MBIGBOSS', 'FYGIKJ', 'XIN BOWE', 'CEVADAMA', 'G.L WEAR', 'ORVEA',
  'VTJOUNEWS', 'ZINURO', 'KIVRON', 'LNVCD', 'DTUYITAI', 'ALLACERYVVA', 'COCOSILIYA',
  'QIYBESD', 'ECRVOM', 'TOYCOD', 'MSGRAS', 'LUYUNSA', 'MRGRAS', 'BRIXELPRO',
  'SLEEPBUNNYY', 'VANJALY', 'GUGALO', 'SUETAIR', 'REWUWA', 'HUMBUZZ', 'HEALEXCER',
  'MEILLETES', 'KAELVOREXIMAR', 'MOXARIVELTRAN', 'FIMDIM', 'HUDUOMI', 'TOLKWOLK',
  'EOIOI', 'MVMY', 'PB MOTOR TECH BMT', 'LZOXTHXI', 'XULKTING', 'KEVIROX', 'LUMINA',
  'PHYLKETHROV', 'AUXFZF', 'FELVORANTIS', 'LUNEVTHYS', 'MUNCHI', 'DORAVIVAMX',
  'XELVRA', 'JIUSHIJIU', 'MEOWPOP', 'OQAQO', 'BHBWV', 'ATARDECERÍA', 'FEKTRUNO',
  'LES UMES', 'YORQUA', 'HOUPUCUN', 'XOMIVP', 'RZ380', 'EXTRALCO', 'HILOPRES',
  'LIILRIS', 'STNTALK', 'XAZISUO', 'YURAZEN', 'KOMPORY', 'KENOPSIA', 'NIHILUX',
  'QUORUND', 'CIPHRIAS', 'MINDDISTILL', 'AFFABIL', 'AURICREA', 'KALOPHUS', 'PSYTHRUM',
  'RUBATOSIS', 'TAKAGI', 'AOVMY', 'FLYSKY', 'SELOVE', 'FYWOK', 'DY', 'EUROW',
  'JUST RETAIL LATAM', 'RETAIL EXPANSION', 'LIZAN', 'LIZAN RETAIL ADVISORS',
  'LRA LIZAN RETAIL ADVISORS', 'SIN DENOMINACIÓN - 3469884', 'BLIND TIGER',
  'ENTRE MANTELES', 'THE BLIND TIGER', 'ACRE', 'ACRE CLUB', 'CHUNG KI WA TOWN',
  'HUNGRYBABIES CLUB', 'CAMARONERA', 'ALJIBE POR CLUB DE PATOS', 'WEBCAMS DE MEXICO',
  'LAWTAEM THE LATIN AMERICAN LAW FIRM', 'PALMAR KITE SURF EL CUYO',
  'PALMAR KITE SURF SISAL', 'PALMAR KITE EL CUYO', 'PALMAR KITE SISAL',
  'AMOR INHALADO', 'ALGORITMO', 'EL PALMAR SISAL', 'CLUB DE PLAYA EL PALMAR SISAL',
  'EL PALMAR EL CUYO', 'CLUB DE PLAYA EL PALMAR EL CUYO', 'LAS HAMACAS SISAL',
  'EL MUELLE DE SISAL', 'GATOPARDO', 'RITUS', 'MULTISUPERET', 'DAMOORE', 'KARL',
  'VALUE INVESTING FORUM', 'VALUE INVESTING FORUM LATAM', 'CLUB DE PATOS', 'VENATRAC',
  'PALINDROME', 'FIRST CARD', 'NEXT CARD', 'INGENIO FINANCIERO',
  'DIGITALIZACIÓN CERTIFICADA POWERED BY SEGURIDATA', 'FAMILY OFFICE', 'PRAEMIA',
  'PACTIO', 'MINI MIGLIA', 'MAXID', 'BASH', 'HELIOPHARM', 'SEGURIINVENTORY',
  'SEGURINOTARY', 'LA QUICHE', 'SEGURIPROXI', 'SEGURITELNET', 'SEGURIEDIFACT',
  'SEGURILIB', 'SEGURIDATA', 'LA GUACAMAYA', 'FIRST CLASS',
];

function shuffle<T>(arr: T[], seed: number): T[] {
  const a = [...arr];
  let s = seed;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    const j = Math.abs(s) % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function TrademarkCard({ name }: { name: string }) {
  return (
    <div
      className="flex-shrink-0 flex items-center justify-center"
      style={{
        background: 'rgba(255,255,255,0.07)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: '12px',
        padding: '16px 24px',
        minWidth: '180px',
        maxWidth: '260px',
      }}
    >
      <span
        style={{
          fontWeight: 700,
          fontSize: '18px',
          color: '#ffffff',
          letterSpacing: '0.02em',
          whiteSpace: 'nowrap',
        }}
      >
        {name}
      </span>
    </div>
  );
}

function ScrollRow({ brands, direction }: { brands: string[]; direction: 'left' | 'right' }) {
  const doubled = [...brands, ...brands];
  const animClass = direction === 'left' ? 'animate-scroll-left' : 'animate-scroll-right';

  return (
    <div className="overflow-hidden w-full" style={{ maskImage: 'linear-gradient(to right, transparent, black 5%, black 95%, transparent)' }}>
      <div className={`flex gap-4 ${animClass} hover:[animation-play-state:paused]`} style={{ width: 'max-content' }}>
        {doubled.map((name, i) => (
          <TrademarkCard key={`${name}-${i}`} name={name} />
        ))}
      </div>
    </div>
  );
}

export default function TrademarkPortfolioSection() {
  const { t } = useLanguage();

  const shuffledRow1 = useMemo(() => shuffle(ALL_BRANDS, 42), []);
  const shuffledRow2 = useMemo(() => shuffle(ALL_BRANDS, 137), []);

  return (
    <section className="bg-[#1a3a2a] py-14 lg:py-20 overflow-hidden">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-10">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-400 mb-3">
          {t('portfolio.eyebrow')}
        </p>
        <h2 className="text-2xl lg:text-3xl font-bold text-white mb-3 leading-snug">
          {t('portfolio.title')}
        </h2>
        <p className="text-white/60 text-sm max-w-2xl mx-auto leading-relaxed">
          {t('portfolio.subtitle')}
        </p>
      </div>

      <div className="flex flex-col gap-5">
        <ScrollRow brands={shuffledRow1} direction="left" />
        <ScrollRow brands={shuffledRow2} direction="right" />
      </div>

      <p className="text-center text-white/35 text-[11px] mt-8 px-4 max-w-2xl mx-auto leading-relaxed">
        {t('portfolio.disclaimer')}
      </p>
    </section>
  );
}
