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
  noSchema?: boolean;
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

export const HOMEPAGE_FAQS: FaqItem[] = [
  {
    q: 'Can foreign companies or individuals file a trademark in Mexico?',
    a: 'Yes. Foreign individuals and companies of any nationality can file trademark applications directly before IMPI without needing a Mexican subsidiary or local company.',
  },
  {
    q: 'Do I need a Mexican company to file?',
    a: 'No. You do not need a Mexican company to file a trademark in Mexico. Foreign individuals and companies can apply directly.',
  },
  {
    q: 'Can I submit information in my own language?',
    a: 'You can submit information in your own language or in English. We translate the application into Spanish, which is required for IMPI filing.',
  },
  {
    q: 'What if my logo contains non-Latin characters or script?',
    a: 'Logos with non-Latin scripts (Arabic, Cyrillic, Devanagari, Chinese, etc.) can be filed in Mexico. We provide a transliteration and Spanish description of the mark for the IMPI application.',
  },
  {
    q: 'What are government fees?',
    a: 'IMPI charges official government fees per class filed. These are included in our total price. Current fees are USD $170 per class. Our prices already include all applicable taxes.',
  },
  {
    q: 'Is classification automatic?',
    a: 'We provide a keyword-based classification suggestion based on your goods/services description. All suggested classifications are reviewed by our team before filing.',
  },
  {
    q: 'Is filing guaranteed within 24 business hours?',
    a: 'We target filing within 24 business hours after receiving complete information and confirmed payment. Delays may occur if information is incomplete or payment is pending.',
  },
  {
    q: 'Does this guarantee trademark registration?',
    a: 'No. Filing an application does not guarantee registration. IMPI examines all applications and may issue office actions or refuse registration.',
  },
  {
    q: 'What happens if IMPI issues an office action?',
    a: 'Office action responses are not included in the base filing service. If IMPI issues an office action, we will notify you and can provide a separate quote for the response.',
  },
  {
    q: 'How long does registration take?',
    a: 'Mexican trademark registration typically takes 12 to 24 months, depending on the backlog at IMPI and whether office actions are issued.',
  },
  {
    q: 'Can I file multiple trademarks at once?',
    a: 'Yes. You can file multiple trademarks and multiple classes in a single order. Volume pricing applies automatically based on the total number of classes filed.',
  },
  {
    q: 'What is the difference between a Filing Certificate and a Registration Certificate?',
    a: 'The Filing Certificate (Constancia de Presentación) is issued by IMPI immediately upon submission and establishes your official filing date. The Registration Certificate (Título de Registro de Marca) is issued after IMPI completes examination and approves your mark — typically 12 to 24 months later.',
  },
  {
    q: 'What is an IMPI anticipation (anterioridad)?',
    a: 'An anterioridad is a prior trademark on the IMPI register that is identical or confusingly similar to your mark. If found during examination, IMPI issues an office action citing it as a barrier to registration.',
  },
  {
    q: 'What is a trademark opposition?',
    a: 'After IMPI approves your application, it is published in the Gaceta de la Propiedad Industrial for a mandatory opposition period — typically 30 business days — during which third parties can file a formal opposition.',
  },
];

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
  noSchema = false,
}: SEOHeadProps) {
  const canonicalUrl = `${BASE_URL}${canonicalPath}`;

  const faqSchema = !noSchema && faqs && faqs.length > 0
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

      {!noSchema && (
        <script type="application/ld+json">{ORGANIZATION_SCHEMA}</script>
      )}
      {!noSchema && (
        <script type="application/ld+json">{OFFER_SCHEMA}</script>
      )}
      {faqSchema && (
        <script type="application/ld+json">{faqSchema}</script>
      )}
    </Helmet>
  );
}
