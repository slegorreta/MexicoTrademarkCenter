import { Link } from 'react-router-dom';
import { Calendar, Clock, ArrowRight } from 'lucide-react';
import SEOHead from '../components/SEOHead';
import { blogPosts } from '../data/blogPosts';

interface Props {
  lang: string;
}

const BLOG_META: Record<string, {
  title: string;
  description: string;
  ogLocale: string;
  bcp47: string;
  canonicalPath: string;
}> = {
  en: {
    title: 'Mexico Trademark Blog — Expert Guides for International Businesses | MexicoTrademarkCenter',
    description: 'Expert guides on Mexico trademark registration for foreign businesses. Learn about IMPI filing, costs, timelines, and brand protection strategies.',
    ogLocale: 'en_US', bcp47: 'en', canonicalPath: '/en/blog',
  },
  es: {
    title: 'Blog de Marcas México — Guías para Empresas Internacionales | MexicoTrademarkCenter',
    description: 'Guías sobre el registro de marcas en México para empresas extranjeras. Aprende sobre solicitudes ante el IMPI, costos, plazos y estrategias de protección de marca.',
    ogLocale: 'es_MX', bcp47: 'es', canonicalPath: '/es/blog',
  },
  zh: {
    title: '墨西哥商标博客 — 国际企业专家指南 | MexicoTrademarkCenter',
    description: '为外国企业提供的墨西哥商标注册专家指南。了解IMPI申请、费用、时间表和品牌保护策略。',
    ogLocale: 'zh_CN', bcp47: 'zh', canonicalPath: '/zh/blog',
  },
  ja: {
    title: 'メキシコ商標ブログ — 国際企業向け専門ガイド | MexicoTrademarkCenter',
    description: '外国企業向けのメキシコ商標登録に関する専門ガイド。IMPI申請、費用、スケジュール、ブランド保護戦略について学ぶ。',
    ogLocale: 'ja_JP', bcp47: 'ja', canonicalPath: '/ja/blog',
  },
  de: {
    title: 'Mexiko-Markenblog — Expertenleitfäden für internationale Unternehmen | MexicoTrademarkCenter',
    description: 'Expertenleitfäden zur Markenanmeldung in Mexiko für ausländische Unternehmen. IMPI-Anmeldungen, Kosten, Zeitrahmen und Markenschutzstrategien.',
    ogLocale: 'de_DE', bcp47: 'de', canonicalPath: '/de/blog',
  },
  fr: {
    title: 'Blog Marques Mexique — Guides pour Entreprises Internationales | MexicoTrademarkCenter',
    description: "Guides experts sur l'enregistrement de marques au Mexique pour les entreprises étrangères. Dépôts IMPI, coûts, délais et stratégies de protection de marque.",
    ogLocale: 'fr_FR', bcp47: 'fr', canonicalPath: '/fr/blog',
  },
  hi: {
    title: 'मेक्सिको ट्रेडमार्क ब्लॉग — अंतर्राष्ट्रीय व्यवसायों के लिए विशेषज्ञ गाइड | MexicoTrademarkCenter',
    description: 'विदेशी व्यवसायों के लिए मेक्सिको ट्रेडमार्क पंजीकरण पर विशेषज्ञ गाइड। IMPI फाइलिंग, लागत, समयरेखा और ब्रांड सुरक्षा रणनीतियों के बारे में जानें।',
    ogLocale: 'hi_IN', bcp47: 'hi', canonicalPath: '/hi/blog',
  },
  pt: {
    title: 'Blog de Marcas México — Guias para Empresas Internacionais | MexicoTrademarkCenter',
    description: 'Guias especializados sobre registro de marcas no México para empresas estrangeiras. Solicitações ao IMPI, custos, prazos e estratégias de proteção de marca.',
    ogLocale: 'pt_BR', bcp47: 'pt', canonicalPath: '/pt/blog',
  },
};

const BLOG_HREFLANG = Object.values(BLOG_META).map(v => ({ lang: v.bcp47, href: v.canonicalPath }));

const BLOG_HEADING: Record<string, string> = {
  en: 'Blog', es: 'Blog', zh: '博客', ja: 'ブログ',
  de: 'Blog', fr: 'Blog', hi: 'ब्लॉग', pt: 'Blog',
};

const BLOG_COMING_SOON: Record<string, string> = {
  en: 'Expert guides and insights coming soon. Check back shortly.',
  es: 'Guías y análisis expertos próximamente. Vuelve pronto.',
  zh: '专家指南和见解即将发布，敬请关注。',
  ja: 'エキスパートガイドと洞察が間もなく公開されます。',
  de: 'Expertenleitfäden und Einblicke kommen bald. Schauen Sie bald wieder vorbei.',
  fr: 'Guides et insights experts bientôt disponibles. Revenez prochainement.',
  hi: 'विशेषज्ञ गाइड और अंतर्दृष्टि जल्द आ रही है। जल्द ही वापस देखें।',
  pt: 'Guias e análises especializados em breve. Volte em breve.',
};

const READ_MORE: Record<string, string> = {
  en: 'Read more', es: 'Leer más', zh: '阅读更多', ja: '続きを読む',
  de: 'Mehr lesen', fr: 'Lire la suite', hi: 'और पढ़ें', pt: 'Leia mais',
};

const MIN_READ: Record<string, string> = {
  en: 'min read', es: 'min de lectura', zh: '分钟阅读', ja: '分で読める',
  de: 'Min. Lesezeit', fr: 'min de lecture', hi: 'मिनट पढ़ें', pt: 'min de leitura',
};

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

export default function BlogIndex({ lang }: Props) {
  const meta = BLOG_META[lang] ?? BLOG_META['en'];
  const posts = blogPosts.filter(p => p.lang === lang);
  const prefix = lang === 'en' ? '/en' : `/${lang}`;

  return (
    <div className="bg-white">
      <SEOHead
        title={meta.title}
        description={meta.description}
        canonicalPath={meta.canonicalPath}
        lang={meta.bcp47}
        ogLocale={meta.ogLocale}
        ogImageAlt="Mexico Trademark Blog — MexicoTrademarkCenter"
        hreflangAlternates={BLOG_HREFLANG}
        noSchema
      />

      {/* Hero */}
      <section className="bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800 text-white py-16 lg:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-gold-400 font-semibold text-sm uppercase tracking-wider mb-3">
            MexicoTrademarkCenter
          </p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">
            {BLOG_HEADING[lang] ?? 'Blog'}
          </h1>
        </div>
      </section>

      {/* Posts grid */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        {posts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">
              {BLOG_COMING_SOON[lang] ?? BLOG_COMING_SOON['en']}
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map(post => {
              const excerpt = stripHtml(post.content).slice(0, 150);
              return (
                <article
                  key={post.slug}
                  className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow flex flex-col"
                >
                  <div className="p-6 flex flex-col flex-1">
                    <h2 className="text-navy-900 font-bold text-lg leading-snug mb-3">
                      {post.title}
                    </h2>
                    <div className="flex items-center gap-4 text-gray-400 text-xs mb-3">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        {post.publishDate}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {post.readTime} {MIN_READ[lang] ?? 'min read'}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm leading-relaxed mb-5 flex-1">
                      {excerpt}&hellip;
                    </p>
                    <Link
                      to={`${prefix}/blog/${post.slug}`}
                      className="inline-flex items-center gap-1.5 text-gold-500 hover:text-gold-600 font-semibold text-sm transition-colors"
                    >
                      {READ_MORE[lang] ?? READ_MORE['en']}
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
