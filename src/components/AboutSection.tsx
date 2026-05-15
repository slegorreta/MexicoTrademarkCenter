import { Link } from 'react-router-dom';
import { ArrowRight, Youtube, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import sofiaImg from '../assets/Captura_de_pantalla_2026-05-14_a_la(s)_5.12.23_p.m..png';

// ── Per-language YouTube video IDs for SofIA's welcome video ──────────────────
// Replace each value with the actual YouTube video ID for that language version.
const SOFIA_VIDEO_IDS: Record<string, string> = {
  en: 'vIK7hikaVp0',
  es: 'N4wNYJO06Go',
  zh: 'UOtEg9rUrlA',
  de: 'pl_AUmsc_gU',
  fr: 'Du3E8fxOU18',
  hi: 'KfCpbk9FOzc',
  pt: 'TZVJ_whPSck',
  ja: '-fsnNbCjk7c',
};

export { SOFIA_VIDEO_IDS };

const WATCH_LABEL: Record<string, string> = {
  en: 'Watch my welcome video',
  es: 'Ver mi video de bienvenida',
  zh: '观看我的欢迎视频',
  de: 'Mein Willkommensvideo ansehen',
  fr: 'Regarder ma vidéo de bienvenue',
  hi: 'मेरा स्वागत वीडियो देखें',
  pt: 'Assistir ao meu vídeo de boas-vindas',
  ja: 'ウェルカムビデオを見る',
};

// ── Per-language "We are…" stanza ─────────────────────────────────────────────
const WE_ARE: Record<string, string[]> = {
  en: ['We are lawyers.', 'We are engineers.', 'We are strategists.', 'We are builders.', 'We are machines.', 'We are code.', 'We are agents.', 'We are human.', 'We are futurists.'],
  es: ['Somos abogados.', 'Somos ingenieros.', 'Somos estrategas.', 'Somos constructores.', 'Somos máquinas.', 'Somos código.', 'Somos agentes.', 'Somos humanos.', 'Somos futuristas.'],
  zh: ['我们是律师。', '我们是工程师。', '我们是战略家。', '我们是建造者。', '我们是机器。', '我们是代码。', '我们是智能体。', '我们是人类。', '我们是未来主义者。'],
  de: ['Wir sind Anwälte.', 'Wir sind Ingenieure.', 'Wir sind Strategen.', 'Wir sind Baumeister.', 'Wir sind Maschinen.', 'Wir sind Code.', 'Wir sind Agenten.', 'Wir sind Menschen.', 'Wir sind Futuristen.'],
  fr: ['Nous sommes des avocats.', 'Nous sommes des ingénieurs.', 'Nous sommes des stratèges.', 'Nous sommes des bâtisseurs.', 'Nous sommes des machines.', 'Nous sommes du code.', 'Nous sommes des agents.', 'Nous sommes humains.', 'Nous sommes des futuristes.'],
  hi: ['हम वकील हैं।', 'हम इंजीनियर हैं।', 'हम रणनीतिकार हैं।', 'हम निर्माता हैं।', 'हम मशीनें हैं।', 'हम कोड हैं।', 'हम एजेंट हैं।', 'हम इंसान हैं।', 'हम भविष्यवादी हैं।'],
  pt: ['Somos advogados.', 'Somos engenheiros.', 'Somos estrategistas.', 'Somos construtores.', 'Somos máquinas.', 'Somos código.', 'Somos agentes.', 'Somos humanos.', 'Somos futuristas.'],
  ja: ['私たちは弁護士です。', '私たちはエンジニアです。', '私たちはストラテジストです。', '私たちはビルダーです。', '私たちはマシンです。', '私たちはコードです。', '私たちはエージェントです。', '私たちは人間です。', '私たちは未来主義者です。'],
};

function buildLines(t: (k: string) => string, lang: string): string[] {
  const weAre = WE_ARE[lang] ?? WE_ARE.en;
  return [
    t('about.tagline'),
    '',
    t('about.p1'),
    '',
    t('about.p2'),
    '',
    ...weAre,
    '',
    t('about.p3'),
    '',
    t('about.p4'),
    '',
    t('about.p5'),
    '',
    t('about.p6'),
    '',
    t('about.p7'),
    '',
    t('about.closing'),
  ];
}

function injectTypo(line: string): { corrupted: string; fixed: string } | null {
  if (line.length < 6) return null;
  const words = line.split(' ');
  const long = words.map((w, i) => ({ w, i })).filter(({ w }) => w.length >= 4);
  if (!long.length) return null;
  const { w, i } = long[Math.floor(Math.random() * long.length)];
  const pos = Math.floor(Math.random() * (w.length - 1));
  const typo = w.slice(0, pos) + w[pos + 1] + w[pos] + w.slice(pos + 2);
  return {
    corrupted: [...words.slice(0, i), typo, ...words.slice(i + 1)].join(' '),
    fixed: line,
  };
}

type TypoState = {
  corrupted: string;
  fixed: string;
  phase: 'typing-typo' | 'erasing' | 'retyping';
  typoCharIdx: number;
  eraseCount: number;
  retypeIdx: number;
};

function useTypewriter(lines: string[], active: boolean) {
  const [displayed, setDisplayed] = useState<string[]>([]);
  const [current, setCurrent] = useState('');
  const [done, setDone] = useState(false);
  const rafRef = useRef<number | null>(null);
  const linesKey = lines.join('|');

  useEffect(() => {
    if (!active) return;
    setDisplayed([]);
    setCurrent('');
    setDone(false);

    let lineIdx = 0;
    let charIdx = 0;
    let typoState: TypoState | null = null;
    let typoScheduled = false;
    let waitUntil = 0;

    const charDelay = () => 28 + Math.random() * 38;
    const lineDelay = () => 120 + Math.random() * 180;

    function tick(now: number) {
      if (now < waitUntil) { rafRef.current = requestAnimationFrame(tick); return; }
      if (lineIdx >= lines.length) { setDone(true); return; }

      const line = lines[lineIdx];

      if (line === '') {
        setDisplayed(prev => [...prev, '']);
        setCurrent('');
        lineIdx++; charIdx = 0; typoState = null; typoScheduled = false;
        waitUntil = now + lineDelay() * 0.4;
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      if (!typoScheduled && charIdx === 0 && line.length >= 6) {
        typoScheduled = true;
        if (Math.random() < 0.3) {
          const t = injectTypo(line);
          if (t) typoState = { ...t, phase: 'typing-typo', typoCharIdx: 0, eraseCount: 0, retypeIdx: 0 };
        }
      }

      if (typoState) {
        const ts = typoState;
        if (ts.phase === 'typing-typo') {
          const diffPos = [...ts.corrupted].findIndex((c, i) => c !== (ts.fixed[i] ?? ''));
          const target = diffPos >= 0 ? diffPos + 2 : ts.corrupted.length;
          if (ts.typoCharIdx < target) {
            setCurrent(ts.corrupted.slice(0, ts.typoCharIdx + 1));
            ts.typoCharIdx++;
            waitUntil = now + charDelay();
          } else {
            ts.phase = 'erasing';
            waitUntil = now + 350 + Math.random() * 250;
          }
          rafRef.current = requestAnimationFrame(tick); return;
        }
        if (ts.phase === 'erasing') {
          const s = ts.corrupted.slice(0, ts.typoCharIdx - ts.eraseCount);
          setCurrent(s);
          ts.eraseCount++;
          if (s.length <= ts.typoCharIdx - ts.corrupted.length + ts.fixed.length - 3) {
            ts.phase = 'retyping'; ts.retypeIdx = s.length; waitUntil = now + 80;
          } else { waitUntil = now + 40 + Math.random() * 30; }
          rafRef.current = requestAnimationFrame(tick); return;
        }
        if (ts.phase === 'retyping') {
          if (ts.retypeIdx < ts.fixed.length) {
            setCurrent(ts.fixed.slice(0, ts.retypeIdx + 1));
            ts.retypeIdx++; waitUntil = now + charDelay();
          } else {
            setDisplayed(prev => [...prev, ts.fixed]);
            setCurrent(''); lineIdx++; charIdx = 0; typoState = null; typoScheduled = false;
            waitUntil = now + lineDelay();
          }
          rafRef.current = requestAnimationFrame(tick); return;
        }
      }

      if (charIdx < line.length) {
        setCurrent(line.slice(0, charIdx + 1));
        charIdx++; waitUntil = now + charDelay();
      } else {
        setDisplayed(prev => [...prev, line]);
        setCurrent(''); lineIdx++; charIdx = 0; typoState = null; typoScheduled = false;
        waitUntil = now + lineDelay();
      }
      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [active, linesKey]);

  return { displayed, current, done };
}

// ── Exported component ────────────────────────────────────────────────────────
export default function AboutSection() {
  const { language, t } = useLanguage();
  const lines = buildLines(t, language);

  const terminalRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [videoOpen, setVideoOpen] = useState(false);

  const videoId = SOFIA_VIDEO_IDS[language] ?? null;
  const watchLabel = WATCH_LABEL[language] ?? WATCH_LABEL.en;

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold: 0.05 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const { displayed, current, done } = useTypewriter(lines, inView);

  useEffect(() => {
    const el = terminalRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [displayed, current]);

  return (
    <div ref={sectionRef}>
      {/* ── Header ── */}
      <section className="bg-navy-950 py-16 text-center px-6">
        <p className="text-gold-400 text-sm font-semibold uppercase tracking-[0.22em] mb-4">
          {t('about.title')}
        </p>
        <h2 className="text-3xl sm:text-4xl lg:text-6xl font-bold text-white leading-tight tracking-tight max-w-3xl mx-auto break-words hyphens-auto">
          {t('about.eyebrow')}
        </h2>
      </section>

      {/* ── Terminal ── */}
      <section className="bg-[#0d0d0d] py-14 px-4 sm:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="rounded-xl overflow-hidden shadow-2xl border border-[#1e1e1e]">
            {/* Title bar */}
            <div className="bg-[#1a1a1a] px-4 py-3 flex items-center gap-2 border-b border-[#2a2a2a]">
              <span className="w-3 h-3 rounded-full bg-[#ff5f57]" />
              <span className="w-3 h-3 rounded-full bg-[#febc2e]" />
              <span className="w-3 h-3 rounded-full bg-[#28c840]" />
              <span className="ml-4 text-[#555] text-xs font-mono">declaration.txt — mexico-trademark-center</span>
            </div>
            {/* Body */}
            <div
              ref={terminalRef}
              className="bg-[#0a0a0a] px-6 sm:px-10 py-8 min-h-[420px] max-h-[65vh] overflow-y-auto"
              style={{ fontFamily: '"Courier New", Courier, monospace', scrollBehavior: 'smooth' }}
            >
              <p className="text-[#555] text-sm mb-5 font-mono">
                <span className="text-[#28c840]">mtc@aindependence</span>
                <span className="text-[#555]">:</span>
                <span className="text-[#4da6ff]">~</span>
                <span className="text-[#555]">$ </span>
                <span className="text-[#aaa]">cat declaration.txt</span>
              </p>
              {displayed.map((line, i) => (
                <p
                  key={i}
                  className={`text-[15px] leading-[1.8] whitespace-pre-wrap break-words ${line === '' ? 'h-4' : 'text-[#39ff14]'}`}
                  style={{ fontFamily: '"Courier New", Courier, monospace' }}
                >
                  {line}
                </p>
              ))}
              {!done && (
                <p
                  className="text-[15px] leading-[1.8] text-[#39ff14] whitespace-pre-wrap break-words"
                  style={{ fontFamily: '"Courier New", Courier, monospace' }}
                >
                  {current}
                  <span className="inline-block w-[9px] h-[16px] bg-[#39ff14] ml-[1px] animate-pulse align-middle" />
                </p>
              )}
              {done && (
                <p className="text-[#555] text-sm mt-4 font-mono">
                  <span className="text-[#28c840]">mtc@aindependence</span>
                  <span className="text-[#555]">:</span>
                  <span className="text-[#4da6ff]">~</span>
                  <span className="text-[#555]">$ </span>
                  <span className="inline-block w-[9px] h-[16px] bg-[#555] ml-[1px] animate-pulse align-middle" />
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── SofIA ── */}
      <section className="bg-navy-950 py-16">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="w-48 h-48 rounded-full overflow-hidden ring-4 ring-gold-400/40 shadow-2xl">
                <img
                  src={sofiaImg}
                  alt="SofIA — AgenticEO"
                  className="w-full h-full object-cover"
                  style={{ objectPosition: 'center 8%' }}
                />
              </div>
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap bg-gold-500 text-navy-950 font-bold text-xs px-5 py-1.5 rounded-full shadow-lg tracking-widest uppercase">
                SofIA &middot; AgenticEO
              </div>
            </div>
          </div>
          <div className="space-y-3 text-gray-300 mt-6">
            <p className="text-white text-xl font-semibold">{t('about.sofia.role')}</p>
            <p className="text-base leading-relaxed max-w-xl mx-auto">{t('about.sofia.desc')}</p>
            {videoId && (
              <div className="pt-2">
                <button
                  onClick={() => setVideoOpen(true)}
                  className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white font-semibold text-sm px-5 py-2.5 rounded-full transition-all duration-200 shadow-lg hover:shadow-red-600/40 hover:scale-105 active:scale-100"
                >
                  <Youtube size={17} />
                  {watchLabel}
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Video modal ── */}
      {videoOpen && videoId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setVideoOpen(false)}
        >
          <div
            className="relative w-full max-w-3xl bg-black rounded-2xl overflow-hidden shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setVideoOpen(false)}
              className="absolute top-3 right-3 z-10 flex items-center justify-center w-9 h-9 rounded-full bg-white/10 hover:bg-white/25 text-white transition-colors"
              aria-label="Close video"
            >
              <X size={18} />
            </button>
            <div className="aspect-video">
              <iframe
                src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
                title="SofIA Welcome Video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
          </div>
        </div>
      )}

      {/* ── CTA ── */}
      <section className="bg-navy-900 border-t border-navy-800 py-12">
        <div className="max-w-xl mx-auto px-6 flex flex-wrap justify-center gap-4">
          <Link
            to="/apply"
            className="inline-flex items-center gap-2 bg-gold-500 hover:bg-gold-400 text-navy-950 font-bold px-8 py-4 rounded-xl transition-colors shadow-lg"
          >
            {t('hero.cta.start')}
            <ArrowRight size={16} />
          </Link>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 border border-white/20 text-white hover:bg-white/10 font-semibold px-8 py-4 rounded-xl transition-colors"
          >
            {t('contact.title')}
          </Link>
        </div>
      </section>
    </div>
  );
}
