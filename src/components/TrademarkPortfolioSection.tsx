import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';

const ALL_BRANDS = [
  'FUOMO', 'FP DIESEL', 'BUEART DESIGN', 'LUVANO', 'ULYAN ARCHARE', 'BIGHEIMER',
  'LERAYA', 'LUNIVORINNA', 'MYCNLEE', 'YSENSHEKO', 'AMHHER', 'TABWEE',
  'KAYOTOM RADIOS', 'DOCREATE', 'MOTUCHUA', 'APOWER', 'INDEVOLT', 'GEESONG',
  'HOMENJOY', 'SEHAWEI', 'BRELAN', 'HAITEL LIRA', 'AELLGAN',
  'XIN BOWE', 'CEVADAMA', 'G.L WEAR', 'ORVEA', 'VTJOUNEWS', 'ZINURO', 'KIVRON',
  'COCOSILIYA', 'TOYCOD', 'BRIXELPRO', 'SLEEPBUNNYY', 'GUGALO', 'HUMBUZZ',
  'MEILLETES', 'HUDUOMI', 'TOLKWOLK', 'EOIOI', 'PB MOTOR TECH BMT',
  'KEVIROX', 'LUMINA', 'MUNCHI', 'ATARDECERÍA', 'LES UMES', 'EXTRALCO',
  'KOMPORY', 'KENOPSIA', 'QUORUND', 'CIPHRIAS', 'AURICREA', 'PSYTHRUM',
  'RUBATOSIS', 'TAKAGI', 'EUROW', 'JUST RETAIL LATAM', 'RETAIL EXPANSION',
  'LIZAN', 'LIZAN RETAIL ADVISORS', 'LRA LIZAN RETAIL ADVISORS',
  'BLIND TIGER', 'ENTRE MANTELES', 'THE BLIND TIGER', 'ACRE', 'ACRE CLUB',
  'CHUNG KI WA TOWN', 'HUNGRYBABIES CLUB', 'CAMARONERA',
  'ALJIBE POR CLUB DE PATOS', 'WEBCAMS DE MEXICO',
  'PALMAR KITE SURF EL CUYO', 'PALMAR KITE SURF SISAL',
  'PALMAR KITE EL CUYO', 'PALMAR KITE SISAL', 'AMOR INHALADO', 'ALGORITMO',
  'EL PALMAR SISAL', 'CLUB DE PLAYA EL PALMAR SISAL',
  'EL PALMAR EL CUYO', 'CLUB DE PLAYA EL PALMAR EL CUYO',
  'LAS HAMACAS SISAL', 'EL MUELLE DE SISAL', 'GATOPARDO', 'MULTISUPERET',
  'VALUE INVESTING FORUM', 'VALUE INVESTING FORUM LATAM', 'CLUB DE PATOS',
  'PALINDROME', 'FIRST CARD', 'NEXT CARD', 'INGENIO FINANCIERO',
  'FAMILY OFFICE', 'PRAEMIA', 'PACTIO', 'MINI MIGLIA',
  'BASH', 'HELIOPHARM', 'LA QUICHE', 'SEGURILIB', 'LA GUACAMAYA', 'FIRST CLASS',
];

function fisherYates(arr: string[]): string[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Build a long non-repeating sequence: shuffle all brands, then reshuffle and
// append, ensuring the last brand of one round != the first of the next.
function buildSequence(rounds: number): string[] {
  const result: string[] = [];
  let prev: string[] = [];
  for (let r = 0; r < rounds; r++) {
    let round = fisherYates(ALL_BRANDS);
    // Avoid the same brand appearing at the boundary between two rounds
    if (prev.length > 0 && round[0] === prev[prev.length - 1]) {
      const swap = Math.floor(Math.random() * (round.length - 1)) + 1;
      [round[0], round[swap]] = [round[swap], round[0]];
    }
    result.push(...round);
    prev = round;
  }
  return result;
}

// Height of each card in px (must match the rendered card)
const CARD_HEIGHT = 60;
const GAP = 16;
const ITEM_HEIGHT = CARD_HEIGHT + GAP;

// How many cards to show in the visible window
const VISIBLE_COUNT = 6;

export default function TrademarkPortfolioSection() {
  const { t } = useLanguage();

  // Build enough cards for a long smooth scroll (sequence doubles for seamless loop)
  const sequence = useRef<string[]>(buildSequence(6));
  const [offset, setOffset] = useState(0);
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number | null>(null);
  // px per second
  const SPEED = 40;

  useEffect(() => {
    const totalHeight = sequence.current.length * ITEM_HEIGHT;
    // We duplicate the sequence so we can loop seamlessly
    const loopAt = (sequence.current.length / 2) * ITEM_HEIGHT;

    function tick(time: number) {
      if (lastTimeRef.current === null) lastTimeRef.current = time;
      const delta = (time - lastTimeRef.current) / 1000;
      lastTimeRef.current = time;

      setOffset(prev => {
        const next = prev + SPEED * delta;
        // Loop back once we've scrolled through the first half
        return next >= loopAt ? next - loopAt : next;
      });

      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  // Double the sequence so we can loop seamlessly
  const doubled = [...sequence.current, ...sequence.current];

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

      {/* Single scrolling column, centered */}
      <div className="flex justify-center">
        <div
          className="relative overflow-hidden"
          style={{
            height: VISIBLE_COUNT * ITEM_HEIGHT - GAP,
            width: 340,
            maskImage: 'linear-gradient(to bottom, transparent, black 12%, black 88%, transparent)',
          }}
        >
          <div
            style={{
              transform: `translateY(-${offset}px)`,
              display: 'flex',
              flexDirection: 'column',
              gap: GAP,
              willChange: 'transform',
            }}
          >
            {doubled.map((name, i) => (
              <div
                key={`${name}-${i}`}
                style={{
                  height: CARD_HEIGHT,
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 12,
                  padding: '0 24px',
                }}
              >
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: 17,
                    color: '#ffffff',
                    letterSpacing: '0.02em',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <p className="text-center text-white/35 text-[11px] mt-8 px-4 max-w-2xl mx-auto leading-relaxed">
        {t('portfolio.disclaimer')}
      </p>
    </section>
  );
}
