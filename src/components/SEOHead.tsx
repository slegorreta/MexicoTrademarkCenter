import { Helmet } from 'react-helmet-async';

const BASE_URL = 'https://www.mexicotrademarkcenter.com';

export interface HreflangAlternate {
  lang: string;
  href: string;
}

export interface FaqItem {
  q: string;
  a: string;
}

interface SEOHeadProps {
  title: string;
  description: string;
  canonicalPath: string;
  lang: string;
  ogLocale: string;
  ogImageAlt: string;
  hreflangAlternates: HreflangAlternate[];
  faqs?: FaqItem[];
  ogImage?: string;
}

const ORGANIZATION_SCHEMA = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': ['Organization', 'LegalService'],
  name: 'MexicoTrademarkCenter',
  url: BASE_URL,
  logo: `${BASE_URL}/IMG_2221_2.jpg`,
  description: 'Affordable trademark registration in Mexico with IMPI — AI-powered classification, 24-hour filing, all fees included from USD $299 per class.',
  areaServed: {
    '@type': 'Country',
    name: 'Mexico',
  },
  serviceType: 'Trademark Registration',
  priceRange: '$',
  sameAs: [],
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer support',
    url: `${BASE_URL}/contact`,
    availableLanguage: ['English', 'Spanish', 'Chinese', 'Portuguese', 'German', 'French', 'Hindi', 'Japanese'],
  },
});

const OFFER_SCHEMA = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: 'Trademark Registration in Mexico',
  provider: {
    '@type': 'Organization',
    name: 'MexicoTrademarkCenter',
    url: BASE_URL,
  },
  areaServed: {
    '@type': 'Country',
    name: 'Mexico',
  },
  offers: {
    '@type': 'Offer',
    price: '299',
    priceCurrency: 'USD',
    description: 'All-inclusive price per Nice class — covers service fees and official IMPI government fees. No hidden charges.',
    availability: 'https://schema.org/InStock',
    url: `${BASE_URL}/apply`,
  },
});

export default function SEOHead({
  title,
  description,
  canonicalPath,
  lang,
  ogLocale,
  ogImageAlt,
  hreflangAlternates,
  faqs,
  ogImage = `${BASE_URL}/IMG_2221_2.jpg`,
}: SEOHeadProps) {
  const canonicalUrl = `${BASE_URL}${canonicalPath}`;

  const faqSchema = faqs && faqs.length > 0
    ? JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqs.map(({ q, a }) => ({
          '@type': 'Question',
          name: q,
          acceptedAnswer: { '@type': 'Answer', text: a },
        })),
      })
    : null;

  return (
    <Helmet htmlAttributes={{ lang }}>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />

      {hreflangAlternates.map((alt) => (
        <link key={alt.lang} rel="alternate" hreflang={alt.lang} href={`${BASE_URL}${alt.href}`} />
      ))}
      <link rel="alternate" hreflang="x-default" href={BASE_URL} />

      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:locale" content={ogLocale} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={ogImageAlt} />
      <meta property="og:site_name" content="MexicoTrademarkCenter" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      <meta name="twitter:image:alt" content={ogImageAlt} />

      <script type="application/ld+json">{ORGANIZATION_SCHEMA}</script>
      <script type="application/ld+json">{OFFER_SCHEMA}</script>

      {faqSchema && (
        <script type="application/ld+json">{faqSchema}</script>
      )}
    </Helmet>
  );
}
