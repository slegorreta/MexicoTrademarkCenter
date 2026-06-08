import { Link, Navigate, useParams } from 'react-router-dom';
import { Calendar, Clock, ArrowLeft } from 'lucide-react';
import SEOHead from '../components/SEOHead';
import { blogPosts } from '../data/blogPosts';

interface Props {
  lang: string;
}

const LANG_META: Record<string, { ogLocale: string; bcp47: string }> = {
  en: { ogLocale: 'en_US', bcp47: 'en' },
  es: { ogLocale: 'es_MX', bcp47: 'es' },
  zh: { ogLocale: 'zh_CN', bcp47: 'zh' },
  ja: { ogLocale: 'ja_JP', bcp47: 'ja' },
  de: { ogLocale: 'de_DE', bcp47: 'de' },
  fr: { ogLocale: 'fr_FR', bcp47: 'fr' },
  hi: { ogLocale: 'hi_IN', bcp47: 'hi' },
  pt: { ogLocale: 'pt_BR', bcp47: 'pt' },
};

const CTA_TITLE: Record<string, string> = {
  en: 'Ready to protect your brand in Mexico?',
  es: '¿Listo para proteger tu marca en México?',
  zh: '准备好在墨西哥保护您的品牌了吗？',
  ja: 'メキシコでブランドを保護する準備はできていますか？',
  de: 'Bereit, Ihre Marke in Mexiko zu schützen?',
  fr: 'Prêt à protéger votre marque au Mexique ?',
  hi: 'मेक्सिको में अपने ब्रांड की सुरक्षा के लिए तैयार हैं?',
  pt: 'Pronto para proteger sua marca no México?',
};

const CTA_BTN: Record<string, string> = {
  en: 'Start Filing — $299 All-Inclusive',
  es: 'Registrar Marca — $299 Todo Incluido',
  zh: '开始申请 — $299 全包价',
  ja: '出願を開始 — $299 オールインクルーシブ',
  de: 'Jetzt anmelden — $299 All-Inclusive',
  fr: 'Déposer ma marque — $299 tout compris',
  hi: 'आवेदन शुरू करें — $299 सब कुछ शामिल',
  pt: 'Registrar Marca — $299 Tudo Incluso',
};

const BACK_TO_BLOG: Record<string, string> = {
  en: 'Back to Blog', es: 'Volver al Blog', zh: '返回博客', ja: 'ブログに戻る',
  de: 'Zurück zum Blog', fr: 'Retour au Blog', hi: 'ब्लॉग पर वापस जाएं', pt: 'Voltar ao Blog',
};

const MIN_READ: Record<string, string> = {
  en: 'min read', es: 'min de lectura', zh: '分钟阅读', ja: '分で読める',
  de: 'Min. Lesezeit', fr: 'min de lecture', hi: 'मिनट पढ़ें', pt: 'min de leitura',
};

export default function BlogPost({ lang }: Props) {
  const { slug } = useParams<{ slug: string }>();
  const post = blogPosts.find(p => p.slug === slug && p.lang === lang);

  const prefix = lang === 'en' ? '/en' : `/${lang}`;
  const langMeta = LANG_META[lang] ?? LANG_META['en'];

  if (!post) return <Navigate to={`${prefix}/blog`} replace />;

  return (
    <div className="bg-white">
      <SEOHead
        title={post.title}
        description={post.metaDescription}
        canonicalPath={`${prefix}/blog/${post.slug}`}
        lang={langMeta.bcp47}
        ogLocale={langMeta.ogLocale}
        ogImageAlt={post.title}
        hreflangAlternates={[]}
        noSchema
      />

      {/* Hero */}
      <section className="bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800 text-white py-14 lg:py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            to={`${prefix}/blog`}
            className="inline-flex items-center gap-1.5 text-gold-400 hover:text-gold-300 text-sm font-medium mb-6 transition-colors"
          >
            <ArrowLeft size={14} />
            {BACK_TO_BLOG[lang] ?? BACK_TO_BLOG['en']}
          </Link>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight">
            {post.title}
          </h1>
          <div className="flex items-center gap-5 mt-4 text-gold-400 text-sm">
            <span className="flex items-center gap-1.5">
              <Calendar size={14} />
              {post.publishDate}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock size={14} />
              {post.readTime} {MIN_READ[lang] ?? 'min read'}
            </span>
          </div>
        </div>
      </section>

      {/* Article body */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div
          className="
            text-gray-700 leading-relaxed
            [&_h2]:text-navy-900 [&_h2]:font-bold [&_h2]:text-2xl [&_h2]:mt-8 [&_h2]:mb-3
            [&_h3]:text-navy-900 [&_h3]:font-semibold [&_h3]:text-xl [&_h3]:mt-6 [&_h3]:mb-2
            [&_p]:mb-4
            [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4
            [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-4
            [&_li]:mb-1
            [&_strong]:text-navy-900
            [&_a]:text-gold-500 [&_a]:underline [&_a]:hover:text-gold-600
          "
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="bg-navy-900 rounded-xl p-8 text-center">
          <h2 className="text-white font-bold text-xl mb-5">
            {CTA_TITLE[lang] ?? CTA_TITLE['en']}
          </h2>
          <Link
            to="/apply"
            className="inline-flex items-center gap-2 bg-gold-500 hover:bg-gold-600 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            {CTA_BTN[lang] ?? CTA_BTN['en']}
          </Link>
        </div>
      </section>
    </div>
  );
}
