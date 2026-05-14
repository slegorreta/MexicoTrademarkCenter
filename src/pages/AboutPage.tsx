import { Link } from 'react-router-dom';
import { ArrowRight, Cpu, Zap, Users, Scale } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import SEOHead from '../components/SEOHead';

// Consistent CSS color treatment applied via Tailwind + inline style across all photos
const IMG_STYLE = { filter: 'saturate(0.75) contrast(1.08) brightness(0.96)' } as const;

// Per-language "We are..." list items
const WE_ARE_ITEMS: Record<string, string[]> = {
  en: ['lawyers', 'engineers', 'strategists', 'builders', 'machines', 'code', 'agents', 'human', 'futurists'],
  es: ['abogados', 'ingenieros', 'estrategas', 'constructores', 'máquinas', 'código', 'agentes', 'humanos', 'futuristas'],
  zh: ['律师', '工程师', '战略家', '建造者', '机器', '代码', '智能体', '人类', '未来主义者'],
  de: ['Anwälte', 'Ingenieure', 'Strategen', 'Baumeister', 'Maschinen', 'Code', 'Agenten', 'Menschen', 'Futuristen'],
  fr: ['des avocats', 'des ingénieurs', 'des stratèges', 'des bâtisseurs', 'des machines', 'du code', 'des agents', 'humains', 'des futuristes'],
  hi: ['वकील', 'इंजीनियर', 'रणनीतिकार', 'निर्माता', 'मशीनें', 'कोड', 'एजेंट', 'इंसान', 'भविष्यवादी'],
  pt: ['advogados', 'engenheiros', 'estrategistas', 'construtores', 'máquinas', 'código', 'agentes', 'humanos', 'futuristas'],
  ja: ['弁護士', 'エンジニア', 'ストラテジスト', 'ビルダー', 'マシン', 'コード', 'エージェント', '人間', '未来主義者'],
};

const WE_ARE_PREFIX: Record<string, string> = {
  en: 'We are', es: 'Somos', zh: '我们是', de: 'Wir sind',
  fr: 'Nous sommes', hi: 'हम हैं', pt: 'Somos', ja: '私たちは',
};

export default function AboutPage() {
  const { language, t } = useLanguage();
  const weAre = WE_ARE_ITEMS[language] ?? WE_ARE_ITEMS.en;
  const prefix = WE_ARE_PREFIX[language] ?? 'We are';

  return (
    <>
      <SEOHead
        title={`${t('about.title')} — Mexico Trademark Center`}
        description={t('about.p1')}
        canonicalUrl="https://mexicotrademarkcenter.com/about"
      />

      {/* ── Hero — dark navy with image triptych ───────────────────────── */}
      <section className="relative bg-navy-950 pt-28 pb-0 overflow-hidden">
        {/* Triptych of color-treated images at the bottom of the hero */}
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center pb-16 z-10">
          <div className="inline-flex items-center gap-2 bg-gold-500/15 border border-gold-400/25 rounded-full px-4 py-1.5 text-gold-300 text-xs font-semibold uppercase tracking-widest mb-6">
            <Cpu size={12} />
            {t('about.eyebrow')}
          </div>
          <h1 className="text-5xl lg:text-7xl font-bold text-white mb-6 leading-[1.05] tracking-tight">
            {t('about.title')}
          </h1>
          <p className="text-xl lg:text-2xl text-gold-300 italic font-medium leading-relaxed max-w-3xl mx-auto">
            &ldquo;{t('about.tagline')}&rdquo;
          </p>
        </div>

        {/* Full-bleed image strip — three photos, color-treated, overlapping with next section */}
        <div className="relative grid grid-cols-3 gap-0 -mb-16">
          {[
            '/pexels-kampus-8190827.jpg',
            '/pexels-pavel-danilyuk-7658400.jpg',
            '/pexels-pavel-danilyuk-7658388.jpg',
          ].map((src, i) => (
            <div key={i} className="relative overflow-hidden" style={{ height: '340px' }}>
              <img
                src={src}
                alt=""
                className="w-full h-full object-cover"
                style={IMG_STYLE}
              />
              {/* Unified navy tint overlay for brand cohesion */}
              <div className="absolute inset-0 bg-navy-900/40 mix-blend-multiply" />
              {/* Top & bottom gradient to blend into page */}
              <div className="absolute inset-0 bg-gradient-to-b from-navy-950/60 via-transparent to-white/30" />
            </div>
          ))}
          {/* Full-width bottom fade into white */}
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent pointer-events-none" />
        </div>
      </section>

      {/* ── Declaration body ───────────────────────────────────────────── */}
      <section className="pt-24 pb-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Opening paragraphs + "We are" list */}
          <div className="grid lg:grid-cols-2 gap-16 items-start mb-20">
            <div className="space-y-6">
              <p className="text-lg text-gray-700 leading-relaxed">{t('about.p1')}</p>
              <p className="text-lg text-gray-700 leading-relaxed">{t('about.p2')}</p>
              <p className="text-xl font-bold text-navy-900 pt-2">{t('about.p3')}</p>
            </div>

            {/* "We are…" manifesto list */}
            <div className="bg-navy-50 border border-navy-100 rounded-2xl p-8">
              <ul className="space-y-2">
                {weAre.map((item, i) => (
                  <li key={i} className="flex items-baseline gap-3">
                    <span className="text-gold-500 font-bold text-lg leading-none mt-0.5">—</span>
                    <span className="text-navy-900 font-semibold text-lg">
                      {prefix} {item}.
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* AI-native platform — second image */}
          <div className="grid lg:grid-cols-2 gap-16 items-center mb-20">
            {/* Image */}
            <div className="relative order-2 lg:order-1">
              <div className="rounded-2xl overflow-hidden shadow-2xl aspect-[4/3]" style={IMG_STYLE}>
                <img
                  src="/pexels-pavel-danilyuk-7658400.jpg"
                  alt="IP professionals at work"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-navy-800/20 mix-blend-multiply rounded-2xl" />
              </div>
              <div className="absolute -bottom-5 -left-5 w-28 h-28 bg-gold-100 rounded-2xl -z-10" />
              <div className="absolute -top-5 -right-5 w-20 h-20 bg-navy-100 rounded-2xl -z-10" />
            </div>
            {/* Copy */}
            <div className="order-1 lg:order-2 space-y-5">
              <div className="inline-flex items-center gap-2 bg-gold-50 border border-gold-200 rounded-full px-3 py-1 text-gold-700 text-xs font-bold uppercase tracking-wider">
                <Zap size={11} />
                AI-Native Platform
              </div>
              <p className="text-lg text-gray-700 leading-relaxed">{t('about.p4')}</p>
              <p className="text-lg text-gray-700 leading-relaxed">{t('about.p5')}</p>
            </div>
          </div>

          {/* Expert network — third image */}
          <div className="grid lg:grid-cols-2 gap-16 items-center mb-8">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 bg-navy-50 border border-navy-100 rounded-full px-3 py-1 text-navy-700 text-xs font-bold uppercase tracking-wider">
                <Scale size={11} className="text-gold-500" />
                Expert Network
              </div>
              <p className="text-lg text-gray-700 leading-relaxed">{t('about.p6')}</p>
              <div className="flex flex-wrap gap-2 pt-1">
                {['Chambers & Partners', 'Managing IP — IP Stars'].map(b => (
                  <span key={b} className="text-xs font-semibold bg-gold-50 border border-gold-200 text-gold-800 px-3 py-1.5 rounded-full">
                    {b}
                  </span>
                ))}
              </div>
            </div>
            {/* Image */}
            <div className="relative">
              <div className="rounded-2xl overflow-hidden shadow-2xl aspect-[4/3]" style={IMG_STYLE}>
                <img
                  src="/pexels-pavel-danilyuk-7658388.jpg"
                  alt="Legal technology team"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-navy-800/20 mix-blend-multiply rounded-2xl" />
              </div>
              <div className="absolute -bottom-5 -right-5 w-28 h-28 bg-gold-100 rounded-2xl -z-10" />
              <div className="absolute -top-5 -left-5 w-20 h-20 bg-navy-100 rounded-2xl -z-10" />
            </div>
          </div>

        </div>
      </section>

      {/* ── SofIA — AgenticEO ──────────────────────────────────────────── */}
      <section className="py-24 bg-navy-950 relative overflow-hidden">
        {/* Subtle texture */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '32px 32px',
        }} />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            {/* Portrait */}
            <div className="flex justify-center">
              <div className="relative">
                {/* Glow ring */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-gold-400/30 to-transparent scale-125 blur-2xl" />
                {/* Outer decorative ring */}
                <div className="w-72 h-72 rounded-full border-2 border-gold-400/20 flex items-center justify-center p-1">
                  <div
                    className="w-full h-full rounded-full overflow-hidden border-4 border-gold-400/40 shadow-2xl"
                    style={{ ...IMG_STYLE, filter: 'saturate(0.85) contrast(1.05) brightness(0.97)' }}
                  >
                    <img
                      src="/image.png"
                      alt="SofIA — AgenticEO"
                      className="w-full h-full object-cover object-top"
                    />
                  </div>
                </div>
                {/* Badge */}
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap bg-gold-500 text-navy-950 font-bold text-sm px-5 py-2 rounded-full shadow-lg flex items-center gap-2">
                  <Cpu size={13} />
                  SofIA &middot; AgenticEO
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 bg-gold-500/15 border border-gold-400/25 rounded-full px-3 py-1 text-gold-300 text-xs font-bold uppercase tracking-wider">
                <Users size={11} />
                {t('about.sofia.role').split('—')[0].trim()}
              </div>
              <h2 className="text-4xl font-bold text-white">SofIA</h2>
              <p className="text-base font-semibold text-gold-300 -mt-2">{t('about.sofia.role')}</p>
              <p className="text-gray-300 text-lg leading-relaxed">{t('about.sofia.desc')}</p>
            </div>

          </div>
        </div>
      </section>

      {/* ── Closing declaration ────────────────────────────────────────── */}
      <section className="py-24 bg-navy-900 border-t border-navy-800">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <p className="text-gray-300 text-lg leading-relaxed">{t('about.p7')}</p>
          <p className="text-2xl lg:text-3xl text-white font-bold leading-snug">
            &ldquo;{t('about.closing')}&rdquo;
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <Link
              to="/apply"
              className="inline-flex items-center gap-2 bg-gold-500 hover:bg-gold-400 text-navy-950 font-bold px-7 py-3.5 rounded-xl transition-colors shadow-lg"
            >
              {t('hero.cta.start')}
              <ArrowRight size={16} />
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 border border-white/20 text-white hover:bg-white/10 font-semibold px-7 py-3.5 rounded-xl transition-colors"
            >
              {t('contact.title')}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
