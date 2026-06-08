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
  '@type': 'Organization',
  name: 'MexicoTrademarkCenter',
  url: BASE_URL,
  logo: `${BASE_URL}/favicon.svg`,
  description: 'Mexico trademark registration service filing with IMPI for international businesses. All-inclusive price of $299 USD per class, filed within 24 business hours. Available in 8 languages.',
  foundingLocation: {
    '@type': 'Place',
    name: 'Mexico',
  },
  serviceArea: {
    '@type': 'AdministrativeArea',
    name: 'Mexico',
  },
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer support',
    url: `${BASE_URL}/contact`,
    availableLanguage: ['English', 'Spanish', 'Chinese', 'Japanese', 'German', 'French', 'Hindi', 'Portuguese'],
  },
  sameAs: [],
});

const OFFER_SCHEMA = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: 'Mexico Trademark Registration',
  provider: {
    '@type': 'Organization',
    name: 'MexicoTrademarkCenter',
    url: BASE_URL,
  },
  serviceType: 'Trademark Registration',
  description: 'All-inclusive Mexico trademark filing service with IMPI. Includes AI-powered availability search, Nice classification, government fees, and filing certificate — all for $299 USD per class.',
  areaServed: {
    '@type': 'Country',
    name: 'Mexico',
  },
  offers: {
    '@type': 'Offer',
    price: '299',
    priceCurrency: 'USD',
    priceSpecification: {
      '@type': 'UnitPriceSpecification',
      price: '299',
      priceCurrency: 'USD',
      unitText: 'per class',
    },
    availability: 'https://schema.org/InStock',
    url: `${BASE_URL}/pricing`,
  },
  termsOfService: `${BASE_URL}/terms`,
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
