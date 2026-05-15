import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import SEOHead from '../components/SEOHead';

const FILTER = 'saturate(0.72) contrast(1.1) brightness(0.93)';

// Per-language "We are…" lines (one per line in the original copy)
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

export default function AboutPage() {
  const { language, t } = useLanguage();
  const weAre = WE_ARE[language] ?? WE_ARE.en;

  return (
    <>
      <SEOHead
        title={`${t('about.title')} — Mexico Trademark Center`}
        description={t('about.p1')}
        canonicalPath="/about"
        lang="en"
        ogLocale="en_US"
        ogImageAlt="Mexico Trademark Center team"
        hreflangAlternates={[{ lang: 'x-default', href: '/about' }]}
      />

      {/* ── Hero ── */}
      <section className="bg-navy-950 pt-28 pb-20">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <p className="text-gold-400 text-sm font-semibold uppercase tracking-[0.2em] mb-5">
            {t('about.eyebrow')}
          </p>
          <h1 className="text-6xl lg:text-8xl font-bold text-white leading-none tracking-tight mb-10">
            {t('about.title')}
          </h1>
        </div>

        {/* Full-width image triptych */}
        <div className="grid grid-cols-3 w-full mt-10" style={{ height: '380px' }}>
          {[
            '/pexels-kampus-8190827.jpg',
            '/pexels-pavel-danilyuk-7658400.jpg',
            '/pexels-pavel-danilyuk-7658388.jpg',
          ].map((src, i) => (
            <div key={i} className="relative overflow-hidden">
              <img
                src={src}
                alt=""
                className="w-full h-full object-cover"
                style={{ filter: FILTER }}
              />
              <div className="absolute inset-0 bg-navy-900/35" />
            </div>
          ))}
        </div>
      </section>

      {/* ── Declaration body ── */}
      <section className="bg-white py-20">
        <div className="max-w-2xl mx-auto px-6 space-y-7 text-gray-800 text-lg leading-relaxed">

          <p>{t('about.tagline')}</p>

          <p>{t('about.p1')}</p>

          <p>{t('about.p2')}</p>

          {/* "We are…" stanza */}
          <div className="py-2 space-y-1">
            {weAre.map((line, i) => (
              <p key={i} className="font-medium text-navy-900">{line}</p>
            ))}
          </div>

          <p>{t('about.p3')}</p>

          <p>{t('about.p4')}</p>

          <p>{t('about.p5')}</p>

          <p>{t('about.p6')}</p>

        </div>
      </section>

      {/* ── Full-width image break ── */}
      <div
        className="w-full overflow-hidden"
        style={{ height: '420px' }}
      >
        <img
          src="/pexels-pavel-danilyuk-7658388.jpg"
          alt="Our team at work"
          className="w-full h-full object-cover object-center"
          style={{ filter: FILTER }}
        />
      </div>

      {/* ── Closing + SofIA ── */}
      <section className="bg-white py-20">
        <div className="max-w-2xl mx-auto px-6 space-y-7 text-gray-800 text-lg leading-relaxed">

          <p className="text-navy-900 font-medium">{t('about.p7')}</p>

          <p className="text-2xl font-bold text-navy-950 leading-snug">
            {t('about.closing')}
          </p>

        </div>
      </section>

      {/* ── SofIA — AgenticEO ── */}
      <section className="bg-navy-950 py-20">
        <div className="max-w-2xl mx-auto px-6">

          {/* Portrait */}
          <div className="flex justify-center mb-10">
            <div className="relative">
              <div className="w-48 h-48 rounded-full overflow-hidden ring-4 ring-gold-400/50 shadow-2xl">
                <img
                  src="/image.png"
                  alt="SofIA — AgenticEO"
                  className="w-full h-full object-cover object-top"
                  style={{ filter: 'saturate(0.85) contrast(1.05)' }}
                />
              </div>
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap bg-gold-500 text-navy-950 font-bold text-xs px-4 py-1.5 rounded-full shadow-lg tracking-wide uppercase">
                SofIA &middot; AgenticEO
              </div>
            </div>
          </div>

          <div className="text-center space-y-4 text-gray-300">
            <p className="text-white text-xl font-semibold">{t('about.sofia.role')}</p>
            <p className="text-lg leading-relaxed">{t('about.sofia.desc')}</p>
          </div>

        </div>
      </section>

      {/* ── CTA ── */}
      <section className="bg-navy-900 border-t border-navy-800 py-16">
        <div className="max-w-2xl mx-auto px-6 flex flex-wrap justify-center gap-4">
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
    </>
  );
}
