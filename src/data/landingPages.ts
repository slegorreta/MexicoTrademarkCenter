export interface Testimonial {
  quote: string;
  author: string;
  role: string;
}

export interface FeatureHighlight {
  title: string;
  description: string;
  linkLabel: string;
  linkTo: string;
}

export interface FAQItem {
  q: string;
  a: string;
}

export interface LandingPageData {
  url: string;
  lang: string;
  bcp47: string;
  ogLocale: string;
  ogImageAlt: string;
  targetCurrency: string;
  title: string;
  metaDescription: string;
  h1: string;
  valueProposition: string;
  ctaLabel: string;
  trustStrip: string[];
  bodyHeading1: string;
  bodyParagraph1: string;
  bodyHeading2: string;
  bodyBullets: string[];
  bodyHeading3: string;
  bodyParagraph3: string;
  testimonials: Testimonial[];
  features: FeatureHighlight[];
  faqs: FAQItem[];
  finalCtaHeading: string;
  finalCtaSubtext: string;
  finalCtaButton: string;
  chargedInLabel: string;
  viewInLabel: string;
  perClass: string;
  socialProofLabel: string;
  starLabel: string;
}

export const LANDING_PAGES: Record<string, LandingPageData> = {
  es: {
    url: '/es/',
    lang: 'es',
    bcp47: 'es',
    ogLocale: 'es_MX',
    ogImageAlt: 'Registro de marca asequible en México — MexicoTrademarkCenter',
    targetCurrency: 'MXN',
    title: 'Registro de Marca Asequible en México | IMPI Online — MexicoTrademarkCenter',
    metaDescription: 'Registro de marca asequible en México ante el IMPI, 100% en línea. Desde USD $270 por clase, todo incluido. Presentación en 24 horas hábiles.',
    h1: 'Registra tu marca en México ante el IMPI',
    valueProposition: 'La forma más rápida y asequible de registrar tu marca en México: IA para clasificación, presentación en 24 horas hábiles y precios todo incluido.',
    ctaLabel: 'Registrar mi marca ahora',
    trustStrip: ['Impuestos incluidos', 'Garantía de precio', 'Presentación ante IMPI en 24 horas hábiles'],
    bodyHeading1: '¿Qué es el registro de marca en México y por qué importa?',
    bodyParagraph1: 'Una marca registrada ante el Instituto Mexicano de la Propiedad Industrial (IMPI) te otorga el derecho exclusivo de uso en todo el territorio nacional por 10 años renovables. Sin ese registro, cualquier tercero puede usar tu nombre comercial, tu logotipo o tu slogan en el mercado mexicano sin consecuencias legales. Para empresas mexicanas, emprendedores y marcas que venden en plataformas como Mercado Libre o Amazon México, el registro es la primera línea de defensa contra la piratería y el uso indebido. El proceso oficial ante el IMPI puede ser largo y técnico, pero nuestra plataforma lo simplifica: tú describes tu negocio y nosotros nos encargamos del resto.',
    bodyHeading2: '¿Por qué usar MexicoTrademarkCenter para registrar tu marca?',
    bodyBullets: [
      'IA de clasificación de Nice: describe tus productos o servicios en español y nuestra IA selecciona automáticamente la clase o clases correctas de las 45 disponibles.',
      'Generador de ideas de marca: si todavía no tienes nombre, nuestra IA propone opciones originales y verifica disponibilidad ante el IMPI al instante.',
      'Precio todo incluido: USD $270 por clase cubre honorarios de servicio y tasas oficiales del IMPI. Sin sorpresas al final.',
      'Presentación en 24 horas hábiles: tu solicitud se presenta ante el IMPI dentro de las 24 horas hábiles siguientes a la confirmación del pago.',
      'Acuse de recibo válido para Amazon Brand Registry: el acuse oficial del IMPI que emitimos sirve como comprobante para activar Amazon Brand Registry México.',
    ],
    bodyHeading3: 'El proceso IMPI explicado de forma simple',
    bodyParagraph3: 'El IMPI recibe tu solicitud, la examina formalmente y, si todo está en orden, la publica en la Gaceta de la Propiedad Industrial durante un período de oposición de 30 días hábiles. Pasado ese período sin oposición, el expediente avanza al examen de fondo, donde se verifica que la marca sea distintiva y no confundible con registros previos. El tiempo total hasta el certificado de registro es de 12 a 24 meses. Nuestra plataforma te mantiene informado en cada etapa a través de tu panel de cliente.',
    testimonials: [
      {
        quote: 'Registré mi marca para mi línea de cosméticos en menos de una semana. El proceso fue clarísimo y el equipo respondió todas mis dudas al día siguiente.',
        author: 'Valentina R.',
        role: 'Fundadora, marca de cosméticos — Guadalajara, México',
      },
      {
        quote: 'Vendo en Mercado Libre y necesitaba el registro para poder reclamar mi tienda oficial. MexicoTrademarkCenter lo hizo más sencillo de lo que esperaba.',
        author: 'Carlos M.',
        role: 'Vendedor en línea — Ciudad de México, México',
      },
      {
        quote: 'Excelente relación calidad-precio. Por USD $270 por clase obtuve un servicio profesional que en un despacho tradicional me hubiera costado el triple.',
        author: 'Sofía L.',
        role: 'Directora de operaciones, distribuidora — Monterrey, México',
      },
    ],
    features: [
      {
        title: 'Generador de marcas con IA',
        description: '¿No sabes cómo llamar a tu marca? Nuestra IA genera opciones creativas y verifica disponibilidad ante el IMPI en segundos.',
        linkLabel: 'Probar el generador',
        linkTo: '/trademark-ideas',
      },
      {
        title: 'Clasificación automática por IA',
        description: 'No necesitas conocer las clases de Nice. Describe tu negocio y la IA determina la clase correcta sin errores.',
        linkLabel: 'Verificar mi marca gratis',
        linkTo: '/trademark-check',
      },
      {
        title: 'Precio más bajo garantizado',
        description: 'Si encuentras un servicio equivalente más barato, lo igualamos. Precio todo incluido, sin honorarios ocultos.',
        linkLabel: 'Ver precios',
        linkTo: '/pricing',
      },
    ],
    faqs: [
      {
        q: '¿Puedo registrar una marca en México si soy extranjero o tengo una empresa extranjera?',
        a: 'Sí. Personas físicas y empresas de cualquier nacionalidad pueden presentar solicitudes de marca directamente ante el IMPI sin necesidad de tener una empresa mexicana.',
      },
      {
        q: '¿Cuánto cuesta registrar una marca en México?',
        a: 'Nuestro precio es de USD $270 por clase, todo incluido: honorarios de servicio (USD $100) y tasas oficiales del IMPI (USD $170, aproximadamente MXN $2,890). No hay cargos adicionales.',
      },
      {
        q: '¿Cuánto tiempo tarda el registro de marca en México?',
        a: 'El proceso completo ante el IMPI toma entre 12 y 24 meses, dependiendo de la carga de trabajo del instituto y de si surgen acciones de oficio.',
      },
      {
        q: '¿En qué plazo presentan mi solicitud ante el IMPI?',
        a: 'Presentamos tu solicitud dentro de las 24 horas hábiles siguientes a la confirmación de pago e información completa.',
      },
      {
        q: '¿El acuse de recibo del IMPI sirve para Amazon Brand Registry?',
        a: 'Sí. El acuse oficial que emitimos al momento de la presentación es aceptado por Amazon como comprobante para activar Amazon Brand Registry México.',
      },
      {
        q: '¿Qué pasa si el IMPI emite un oficio de observaciones?',
        a: 'Recibirás una notificación en tu panel. La respuesta a oficios de observación no está incluida en el servicio básico, pero podemos cotizarla por separado.',
      },
      {
        q: '¿Puedo registrar varias clases al mismo tiempo?',
        a: 'Sí. Puedes incluir múltiples clases en una sola solicitud. El precio es de USD $270 por clase.',
      },
    ],
    finalCtaHeading: 'Protege tu marca en México hoy',
    finalCtaSubtext: 'Cientos de empresas ya han registrado su marca con nosotros. El proceso toma minutos.',
    finalCtaButton: 'Comenzar mi solicitud',
    chargedInLabel: 'por clase · cobrado en USD',
    viewInLabel: 'Ver en',
    perClass: 'por clase',
    socialProofLabel: 'Empresas y emprendedores que ya confían en nosotros',
    starLabel: 'Calificación de clientes',
  },

  en: {
    url: '/en/',
    lang: 'en',
    bcp47: 'en',
    ogLocale: 'en_US',
    ogImageAlt: 'Affordable trademark registration in Mexico — MexicoTrademarkCenter',
    targetCurrency: 'USD',
    title: 'Affordable Trademark Registration in Mexico | IMPI Filing — MexicoTrademarkCenter',
    metaDescription: 'Affordable trademark registration in Mexico with IMPI — all fees included from USD $270 per class. AI-powered classification, 24-hour filing, no hidden charges.',
    h1: 'Register a Trademark in Mexico with IMPI',
    valueProposition: 'The most affordable way to file a Mexico trademark — AI-powered classification, all fees included from USD $270 per class, 24-hour IMPI submission.',
    ctaLabel: 'Start My Application',
    trustStrip: ['Tax inclusive', 'Price match guarantee', '24-hour IMPI submission'],
    bodyHeading1: 'Why Register a Trademark in Mexico?',
    bodyParagraph1: 'Mexico is the 15th largest economy in the world and a gateway to Latin America under the USMCA trade agreement. A trademark registered with the Instituto Mexicano de la Propiedad Industrial (IMPI) gives you the exclusive right to use your brand name, logo, or slogan across the entire Mexican territory for 10 renewable years. Without that protection, competitors can legally copy your brand in Mexico — and there is little you can do to stop them. For Amazon sellers on Amazon.com.mx, exporters, and businesses expanding into Mexico, trademark registration is not optional: it is the foundation of your brand protection strategy.',
    bodyHeading2: 'Why Choose MexicoTrademarkCenter?',
    bodyBullets: [
      'AI-powered Nice Classification: describe your goods and services in plain English and our AI maps them to the correct class out of 45 international categories — no legal knowledge required.',
      'AI Trademark Name Generator: not sure what to call your brand? Our AI generates options and checks IMPI availability instantly.',
      'All-inclusive pricing: USD $270 per class covers service fees and official IMPI government fees. No hidden charges.',
      '24-hour IMPI submission: your application is filed with IMPI within 24 business hours of payment confirmation.',
      'Amazon Brand Registry ready: the official IMPI receipt we provide upon filing is accepted by Amazon to activate Amazon Brand Registry Mexico.',
    ],
    bodyHeading3: 'How the IMPI Process Works',
    bodyParagraph3: 'Once filed, IMPI conducts a formal examination of the application. If it passes, it is published in the Industrial Property Gazette for a 30-business-day opposition period. After that, IMPI examines the mark on its merits — checking distinctiveness and conflicts with prior registrations. Total time to certificate: 12 to 24 months. Our client dashboard keeps you updated at every stage with real-time docketing notifications.',
    testimonials: [
      {
        quote: 'I sell on Amazon Mexico and needed the IMPI filing receipt for Brand Registry. The whole process took under a week. Incredibly smooth.',
        author: 'James T.',
        role: 'Amazon Seller, consumer electronics — Austin, TX, USA',
      },
      {
        quote: 'As a US brand expanding into Mexico, we needed trademark protection fast. MexicoTrademarkCenter filed within 24 hours and the dashboard made tracking easy.',
        author: 'Michelle K.',
        role: 'Brand Director, apparel company — New York, USA',
      },
      {
        quote: 'The AI classification tool saved me hours of research. I described my software product and it immediately identified the right Nice classes.',
        author: 'David O.',
        role: 'SaaS Founder — San Francisco, CA, USA',
      },
    ],
    features: [
      {
        title: 'AI Trademark Name Generator',
        description: "Don't know what to call your brand? Our AI creates original name options and checks IMPI availability instantly.",
        linkLabel: 'Try the Generator',
        linkTo: '/trademark-ideas',
      },
      {
        title: 'AI-Powered Classification',
        description: 'No need to know the Nice filing class. Our AI figures it out from your business description — accurately, every time.',
        linkLabel: 'Check My Trademark Free',
        linkTo: '/trademark-check',
      },
      {
        title: 'Lowest Price + Price Match',
        description: 'The cheapest Mexico trademark filing available, tax inclusive. Find it cheaper and we match it.',
        linkLabel: 'See Pricing',
        linkTo: '/pricing',
      },
    ],
    faqs: [
      {
        q: 'Can foreign companies or individuals file a trademark in Mexico?',
        a: 'Yes. Foreign individuals and companies of any nationality can file trademark applications directly with IMPI without needing a Mexican subsidiary or local company.',
      },
      {
        q: 'How much does it cost to register a trademark in Mexico?',
        a: 'Our all-inclusive price is USD $270 per class: service fee of USD $100 plus official IMPI government fees of USD $170. No hidden charges.',
      },
      {
        q: 'How long does Mexico trademark registration take?',
        a: 'The full process with IMPI takes 12 to 24 months, depending on IMPI\'s workload and whether office actions are issued.',
      },
      {
        q: 'Can I use the IMPI filing receipt for Amazon Brand Registry?',
        a: 'Yes. The official IMPI receipt issued at the time of filing is accepted by Amazon to activate Amazon Brand Registry Mexico.',
      },
      {
        q: 'How quickly is my application filed with IMPI?',
        a: 'We file your application with IMPI within 24 business hours of receiving complete information and confirmed payment.',
      },
      {
        q: 'Does filing guarantee registration?',
        a: 'No. Filing an application does not guarantee registration. IMPI examines all applications and may issue office actions. We provide filing services only.',
      },
      {
        q: 'What happens if IMPI issues an office action?',
        a: 'Office action responses are not included in the base filing service. If IMPI issues one, we notify you and can provide a separate quote for the response.',
      },
    ],
    finalCtaHeading: 'Protect Your Brand in Mexico Today',
    finalCtaSubtext: 'Join hundreds of businesses that have already filed with us. The application takes minutes.',
    finalCtaButton: 'Start My Application',
    chargedInLabel: 'per class · charged in USD',
    viewInLabel: 'Convert to',
    perClass: 'per class',
    socialProofLabel: 'Trusted by businesses and sellers worldwide',
    starLabel: 'Customer rating',
  },

  zh: {
    url: '/zh/',
    lang: 'zh',
    bcp47: 'zh-Hans',
    ogLocale: 'zh_CN',
    ogImageAlt: '墨西哥商标注册低价全包 — MexicoTrademarkCenter',
    targetCurrency: 'CNY',
    title: '墨西哥商标注册低价全包 | IMPI在线申请 — MexicoTrademarkCenter',
    metaDescription: '墨西哥商标注册费用低廉，每类仅USD $270全包含官费，IMPI官方在线申请，24工作小时内提交。AI智能分类，中文服务。',
    h1: '墨西哥商标注册 — IMPI在线申请',
    valueProposition: '专为中国跨境卖家打造：费用低廉全透明，AI智能分类、24小时内向IMPI提交申请、含全部官费。',
    ctaLabel: '立即申请商标注册',
    trustStrip: ['含税价', '价格保证', '24工作小时内向IMPI提交'],
    bodyHeading1: '为什么在墨西哥注册商标？',
    bodyParagraph1: '墨西哥是全球第15大经济体，也是亚马逊跨境电商进入拉丁美洲的重要门户。在Amazon.com.mx销售的中国卖家需要向墨西哥工业产权局（IMPI）注册商标，才能激活Amazon品牌注册（Amazon Brand Registry），从而有效防止仿冒和跟卖。墨西哥知识产权保护体系健全，商标注册成功后可享有10年独占使用权，到期可续展。无论您是深圳的外贸工厂、义乌的品牌卖家，还是经营速卖通或独立站的跨境商家，墨西哥商标注册都是进入拉丁美洲市场的第一步。',
    bodyHeading2: '为什么选择MexicoTrademarkCenter？',
    bodyBullets: [
      'AI智能尼斯分类：用中文描述您的商品或服务，AI自动从45个国际分类中选出正确类别，无需专业法律知识。',
      'AI商标创意生成器：还没想好品牌名？AI为您生成创意选项并即时查询IMPI数据库确认可用性。',
      '全包价格透明：每类USD $270，含服务费（USD $100）和IMPI官方注册费（USD $170），无隐藏收费。',
      '24工作小时内提交：付款确认后24工作小时内向IMPI提交申请。',
      'IMPI受理回执可用于Amazon品牌注册：我们提供的官方IMPI受理通知书是Amazon品牌注册中国卖家最常用的申请证明文件。',
    ],
    bodyHeading3: 'IMPI申请流程简介',
    bodyParagraph3: 'IMPI收到申请后进行形式审查，通过后在《工业产权公报》上公告30个工作日，供第三方提出异议。无异议后进入实质审查，审查商标的显著性及与在先注册的冲突。从提交到拿到注册证书通常需要12至24个月。我们的客户后台提供全程实时案件追踪，您随时可以查看最新状态。',
    testimonials: [
      {
        quote: '我们是深圳的3C卖家，在Amazon MX开店需要IMPI受理回执做品牌注册。MexicoTrademarkCenter一周内就搞定了，效率非常高。',
        author: '张先生',
        role: '跨境电商运营，3C品牌卖家 — 深圳，中国',
      },
      {
        quote: 'AI分类工具太好用了，输入产品描述就自动给出了正确的尼斯类别，省去了大量查询时间。价格也比其他服务商便宜很多。',
        author: '李女士',
        role: '品牌经理，家居用品 — 广州，中国',
      },
      {
        quote: '客服响应很快，中英文都可以沟通。墨西哥商标申请一次性通过，没有任何来回。强烈推荐给做Latin America的同行。',
        author: '王先生',
        role: '外贸出口，义乌 — 浙江，中国',
      },
    ],
    features: [
      {
        title: 'AI商标创意生成器',
        description: '不知道品牌叫什么？AI自动生成创意名称并即时查询IMPI可用性。',
        linkLabel: '试用生成器',
        linkTo: '/trademark-ideas',
      },
      {
        title: 'AI智能尼斯分类',
        description: '无需了解尼斯分类体系，只需描述业务，AI精准匹配正确类别。',
        linkLabel: '免费查询我的商标',
        linkTo: '/trademark-check',
      },
      {
        title: '最低价格保证',
        description: '市场最低价的墨西哥商标申请服务，含全部税费。发现更低价格，我们立即匹配。',
        linkLabel: '查看价格',
        linkTo: '/pricing',
      },
    ],
    faqs: [
      {
        q: '中国公司或个人可以在墨西哥注册商标吗？',
        a: '可以。任何国籍的个人和企业均可直接向IMPI提交商标申请，无需在墨西哥设立子公司或本地实体。',
      },
      {
        q: '墨西哥商标注册费用是多少？',
        a: '我们的全包价格为每类USD $270，包含服务费USD $100和IMPI官方注册费USD $170（约合人民币¥1,950，视汇率而定）。',
      },
      {
        q: 'IMPI受理回执可以用于Amazon品牌注册吗？',
        a: '可以。我们在提交申请时出具的IMPI官方受理回执是Amazon品牌注册中国卖家最常用的申请证明文件，Amazon官方认可此文件。',
      },
      {
        q: '从提交到拿到注册证书需要多长时间？',
        a: '完整流程通常需要12至24个月，视IMPI审查工作量及是否有官方异议而定。',
      },
      {
        q: '多久可以提交到IMPI？',
        a: '确认付款并收到完整信息后，我们在24工作小时内向IMPI提交申请。',
      },
      {
        q: '可以同时注册多个类别吗？',
        a: '可以。您可以在同一订单中申请多个类别，每类USD $270。',
      },
      {
        q: '如果IMPI发出官方意见书怎么办？',
        a: '我们会通过您的账户后台通知您。官方意见书答复不包含在基础服务中，可单独报价处理。',
      },
    ],
    finalCtaHeading: '立即保护您在墨西哥的品牌',
    finalCtaSubtext: '数百家企业已经通过我们完成了墨西哥商标申请。申请流程仅需几分钟。',
    finalCtaButton: '开始申请',
    chargedInLabel: '每类 · 以美元计费',
    viewInLabel: '查看',
    perClass: '每类',
    socialProofLabel: '已有数百家企业和卖家信赖我们',
    starLabel: '客户评分',
  },

  pt: {
    url: '/pt/',
    lang: 'pt',
    bcp47: 'pt',
    ogLocale: 'pt_BR',
    ogImageAlt: 'Registro de marca acessível no México — MexicoTrademarkCenter',
    targetCurrency: 'BRL',
    title: 'Registro de Marca Acessível no México | Protocolo IMPI Online — MexicoTrademarkCenter',
    metaDescription: 'Registro de marca acessível no México junto ao IMPI — a partir de USD $270 por classe, tudo incluído. Protocolo em 24 horas úteis, classificação por IA, sem taxas ocultas.',
    h1: 'Registro de Marca no México — Protocolo IMPI Online',
    valueProposition: 'A forma mais acessível de registrar sua marca no México: classificação por IA, todos os impostos inclusos a partir de USD $270 por classe, protocolo em 24 horas úteis.',
    ctaLabel: 'Registrar Minha Marca',
    trustStrip: ['Impostos inclusos', 'Garantia de menor preço', 'Protocolo no IMPI em 24 horas úteis'],
    bodyHeading1: 'Por que registrar uma marca no México?',
    bodyParagraph1: 'O México é o principal parceiro comercial do Brasil na América do Norte e representa uma oportunidade crescente para exportadores brasileiros. Com o mercado de e-commerce mexicano em forte expansão, marcas brasileiras estão cada vez mais presentes no Amazon.com.mx e no Mercado Livre México. O registro junto ao Instituto Mexicano de la Propiedad Industrial (IMPI) garante o direito exclusivo de uso da sua marca em todo o território mexicano por 10 anos renováveis, protegendo seu negócio contra cópias e uso indevido por terceiros. Sem esse registro, sua marca pode ser apropriada por concorrentes locais sem qualquer amparo legal.',
    bodyHeading2: 'Por que escolher a MexicoTrademarkCenter?',
    bodyBullets: [
      'Classificação por IA: descreva seus produtos ou serviços em português e nossa IA seleciona automaticamente a classe correta entre as 45 da Classificação de Nice.',
      'Gerador de nomes de marca por IA: ainda não sabe como chamar sua marca? Nossa IA sugere opções criativas e verifica disponibilidade no IMPI em tempo real.',
      'Preço com tudo incluído: USD $270 por classe cobre honorários de serviço e taxas oficiais do IMPI. Sem surpresas.',
      'Protocolo em 24 horas úteis: sua solicitação é protocolada no IMPI dentro de 24 horas úteis após a confirmação do pagamento.',
      'Comprovante aceito pelo Amazon Brand Registry: o comprovante oficial do IMPI é reconhecido pelo Amazon para ativar o Amazon Brand Registry México.',
    ],
    bodyHeading3: 'Como funciona o processo no IMPI',
    bodyParagraph3: 'Após o protocolo, o IMPI realiza um exame formal da solicitação. Se aprovada, a marca é publicada na Gaceta de la Propiedad Industrial por 30 dias úteis para eventual oposição de terceiros. Sem oposição, o processo avança para o exame de mérito, onde é verificada a distintividade da marca. O prazo total até o certificado de registro é de 12 a 24 meses. Nossa plataforma mantém você informado em cada etapa com atualizações em tempo real no painel do cliente.',
    testimonials: [
      {
        quote: 'Expandimos nossa linha de suplementos para o México e precisávamos proteger a marca antes de lançar. O processo foi direto ao ponto e o protocolo saiu em menos de 24 horas.',
        author: 'Rodrigo F.',
        role: 'Diretor comercial, suplementos alimentares — São Paulo, Brasil',
      },
      {
        quote: 'Vendo no Amazon México há dois anos. Precisava do comprovante do IMPI para o Brand Registry. A MexicoTrademarkCenter cuidou de tudo, sem complicação.',
        author: 'Camila S.',
        role: 'Empreendedora digital, moda — Rio de Janeiro, Brasil',
      },
      {
        quote: 'O melhor custo-benefício que encontrei para registro de marca no México. O preço todo incluído sem letras miúdas foi o que me convenceu.',
        author: 'André M.',
        role: 'CEO, empresa de tecnologia — Florianópolis, Brasil',
      },
    ],
    features: [
      {
        title: 'Gerador de Nomes de Marca com IA',
        description: 'Não sabe como nomear sua marca? Nossa IA cria opções originais e verifica disponibilidade no IMPI na hora.',
        linkLabel: 'Experimentar o Gerador',
        linkTo: '/trademark-ideas',
      },
      {
        title: 'Classificação Automática por IA',
        description: 'Sem necessidade de conhecer a Classificação de Nice. A IA determina a classe correta a partir da descrição do seu negócio.',
        linkLabel: 'Verificar Minha Marca Grátis',
        linkTo: '/trademark-check',
      },
      {
        title: 'Menor Preço Garantido',
        description: 'O protocolo de marca no México mais acessível do mercado, com impostos inclusos. Encontrou mais barato? Igualamos o preço.',
        linkLabel: 'Ver Preços',
        linkTo: '/pricing',
      },
    ],
    faqs: [
      {
        q: 'Empresas brasileiras podem registrar marca no México?',
        a: 'Sim. Pessoas físicas e empresas de qualquer nacionalidade podem protocolar pedidos de marca diretamente no IMPI sem precisar ter uma empresa mexicana.',
      },
      {
        q: 'Quanto custa o registro de marca no México?',
        a: 'Nosso preço é USD $270 por classe, tudo incluído: honorários de serviço (USD $100) e taxas oficiais do IMPI (USD $170).',
      },
      {
        q: 'O comprovante do IMPI serve para o Amazon Brand Registry?',
        a: 'Sim. O comprovante oficial de protocolo que emitimos é aceito pelo Amazon para ativar o Amazon Brand Registry México.',
      },
      {
        q: 'Qual o prazo para o certificado de registro?',
        a: 'O processo completo leva de 12 a 24 meses, dependendo da fila do IMPI e da eventual emissão de exigências.',
      },
      {
        q: 'Em quanto tempo minha solicitação é protocolada?',
        a: 'Protocolamos no IMPI dentro de 24 horas úteis após a confirmação do pagamento e recebimento das informações completas.',
      },
      {
        q: 'Posso registrar mais de uma classe ao mesmo tempo?',
        a: 'Sim. Você pode incluir múltiplas classes em um único pedido. O preço é de USD $270 por classe.',
      },
    ],
    finalCtaHeading: 'Proteja sua marca no México hoje mesmo',
    finalCtaSubtext: 'Centenas de empresas já protocolaram conosco. O processo leva poucos minutos.',
    finalCtaButton: 'Iniciar Minha Solicitação',
    chargedInLabel: 'por classe · cobrado em USD',
    viewInLabel: 'Ver em',
    perClass: 'por classe',
    socialProofLabel: 'Empresas e empreendedores que confiam em nós',
    starLabel: 'Avaliação dos clientes',
  },

  de: {
    url: '/de/',
    lang: 'de',
    bcp47: 'de',
    ogLocale: 'de_DE',
    ogImageAlt: 'Günstige Markenanmeldung in Mexiko — MexicoTrademarkCenter',
    targetCurrency: 'EUR',
    title: 'Günstige Markenanmeldung in Mexiko | IMPI Online — MexicoTrademarkCenter',
    metaDescription: 'Günstige Markenanmeldung in Mexiko beim IMPI — Komplettpreis ab USD $270 pro Klasse, alle Gebühren inklusive. Einreichung innerhalb von 24 Geschäftsstunden, vollständig online.',
    h1: 'Markenanmeldung in Mexiko beim IMPI',
    valueProposition: 'Die günstigste Markenanmeldung in Mexiko: KI-gestützte Klassifizierung, Einreichung innerhalb von 24 Geschäftsstunden, Komplettpreis inklusive aller IMPI-Gebühren.',
    ctaLabel: 'Marke jetzt anmelden',
    trustStrip: ['Steuerinklusive', 'Preisgarantie', 'Einreichung beim IMPI innerhalb von 24 Geschäftsstunden'],
    bodyHeading1: 'Warum eine Marke in Mexiko schützen?',
    bodyParagraph1: 'Mexiko ist die größte spanischsprachige Volkswirtschaft der Welt und ein zentraler Markt im USMCA-Freihandelsabkommen. Deutsche und europäische Unternehmen, die Waren nach Mexiko exportieren, im mexikanischen Einzelhandel verkaufen oder Lizenzen vergeben möchten, benötigen eine eingetragene Marke beim Instituto Mexicano de la Propiedad Industrial (IMPI), um ihren Markennamen rechtlich zu schützen. Ohne Markenschutz können mexikanische Mitbewerber identische oder ähnliche Bezeichnungen verwenden, ohne rechtliche Konsequenzen befürchten zu müssen. Die IMPI-Eintragung gewährt ein 10-jähriges, verlängerbares Ausschließlichkeitsrecht für das gesamte mexikanische Staatsgebiet.',
    bodyHeading2: 'Warum MexicoTrademarkCenter wählen?',
    bodyBullets: [
      'KI-gestützte Nizza-Klassifizierung: Beschreiben Sie Ihre Waren oder Dienstleistungen auf Deutsch und unsere KI wählt automatisch die korrekte Klasse aus den 45 Nizza-Klassen aus.',
      'KI-Markenideengenerator: Noch kein Markenname? Unsere KI schlägt kreative Optionen vor und prüft die IMPI-Verfügbarkeit sofort.',
      'Komplettpreis: USD $270 pro Klasse deckt Service- und offizielle IMPI-Gebühren. Keine versteckten Kosten.',
      'Einreichung innerhalb von 24 Geschäftsstunden: Ihre Anmeldung wird innerhalb von 24 Geschäftsstunden nach Zahlungsbestätigung beim IMPI eingereicht.',
      'Amazon Brand Registry: Der offizielle IMPI-Eingangsbeleg wird von Amazon als Nachweis für die Aktivierung des Amazon Brand Registry Mexiko akzeptiert.',
    ],
    bodyHeading3: 'Das IMPI-Verfahren einfach erklärt',
    bodyParagraph3: 'Nach der Einreichung prüft der IMPI die Anmeldung formell. Bei positivem Ergebnis wird die Marke für 30 Geschäftstage im Amtsblatt des gewerblichen Rechtsschutzes veröffentlicht. Geht keine Widerspruchserklärung ein, folgt die materielle Prüfung auf Unterscheidungskraft und Kollisionen mit älteren Eintragungen. Die Gesamtdauer bis zum Eintragungszertifikat beträgt 12 bis 24 Monate. Unser Kundenportal informiert Sie in Echtzeit über jeden Verfahrensschritt.',
    testimonials: [
      {
        quote: 'Wir exportieren Maschinenbauteile nach Mexiko und wollten unsere Marke dort schützen. Der Prozess war unkompliziert, die Einreichung erfolgte innerhalb eines Tages.',
        author: 'Thomas B.',
        role: 'Geschäftsführer, Maschinenbau-KMU — Stuttgart, Deutschland',
      },
      {
        quote: 'Die KI-Klassifizierung hat mir die mühsame Recherche in den Nizza-Klassen erspart. Einfach Produktbeschreibung eingeben und fertig.',
        author: 'Katharina W.',
        role: 'Markenmanagerin, Konsumgüter — München, Deutschland',
      },
      {
        quote: 'Für ein Unternehmen, das im USMCA-Raum tätig ist, ist der mexikanische Markenschutz unverzichtbar. MexicoTrademarkCenter bietet das beste Preis-Leistungs-Verhältnis.',
        author: 'Erik S.',
        role: 'Exportleiter, Pharmazeutika — Hamburg, Deutschland',
      },
    ],
    features: [
      {
        title: 'KI-Markenideengenerator',
        description: 'Noch kein Markenname? Unsere KI entwickelt kreative Optionen und prüft sofort die IMPI-Verfügbarkeit.',
        linkLabel: 'Generator ausprobieren',
        linkTo: '/trademark-ideas',
      },
      {
        title: 'KI-gestützte Klassifizierung',
        description: 'Kein Nizza-Wissen erforderlich. Die KI bestimmt die korrekte Klasse aus Ihrer Unternehmensbeschreibung.',
        linkLabel: 'Marke kostenlos prüfen',
        linkTo: '/trademark-check',
      },
      {
        title: 'Günstigster Preis garantiert',
        description: 'Die günstigste Markenanmeldung in Mexiko, steuerinklusive. Finden Sie es günstiger? Wir gleichen den Preis an.',
        linkLabel: 'Preise ansehen',
        linkTo: '/pricing',
      },
    ],
    faqs: [
      {
        q: 'Können ausländische Unternehmen eine Marke in Mexiko anmelden?',
        a: 'Ja. Natürliche und juristische Personen jeder Nationalität können Markenanmeldungen direkt beim IMPI einreichen, ohne eine mexikanische Tochtergesellschaft zu benötigen.',
      },
      {
        q: 'Was kostet eine Markenanmeldung in Mexiko?',
        a: 'Unser Komplettpreis beträgt USD $270 pro Klasse (Servicegebühr USD $100 + offizielle IMPI-Gebühren USD $170). Keine Zusatzkosten.',
      },
      {
        q: 'Wie lange dauert die Eintragung?',
        a: 'Das vollständige IMPI-Verfahren dauert 12 bis 24 Monate, abhängig von der Arbeitslast des IMPI und etwaigen Beanstandungen.',
      },
      {
        q: 'Wie schnell wird meine Anmeldung eingereicht?',
        a: 'Wir reichen Ihre Anmeldung innerhalb von 24 Geschäftsstunden nach Zahlungsbestätigung beim IMPI ein.',
      },
      {
        q: 'Kann ich mehrere Klassen gleichzeitig anmelden?',
        a: 'Ja. Sie können mehrere Klassen in einem Auftrag anmelden. Der Preis beträgt USD $270 pro Klasse.',
      },
      {
        q: 'Was passiert bei einer IMPI-Beanstandung?',
        a: 'Beanstandungsantworten sind nicht im Basisservice enthalten. Wir benachrichtigen Sie und können ein separates Angebot erstellen.',
      },
    ],
    finalCtaHeading: 'Schützen Sie Ihre Marke in Mexiko jetzt',
    finalCtaSubtext: 'Hunderte Unternehmen haben bereits mit uns angemeldet. Der Prozess dauert nur wenige Minuten.',
    finalCtaButton: 'Jetzt Anmeldung starten',
    chargedInLabel: 'pro Klasse · in USD abgerechnet',
    viewInLabel: 'In EUR ansehen',
    perClass: 'pro Klasse',
    socialProofLabel: 'Von Unternehmen weltweit genutzt',
    starLabel: 'Kundenbewertung',
  },

  fr: {
    url: '/fr/',
    lang: 'fr',
    bcp47: 'fr',
    ogLocale: 'fr_FR',
    ogImageAlt: 'Enregistrement de marque abordable au Mexique — MexicoTrademarkCenter',
    targetCurrency: 'EUR',
    title: 'Enregistrement de Marque Abordable au Mexique | Dépôt IMPI — MexicoTrademarkCenter',
    metaDescription: 'Enregistrement de marque abordable au Mexique auprès de l\'IMPI — à partir de USD $270 par classe, tous frais inclus. Dépôt en 24 heures ouvrées, sans frais cachés.',
    h1: 'Enregistrement de marque au Mexique — Dépôt IMPI en ligne',
    valueProposition: 'La solution la plus abordable pour enregistrer votre marque au Mexique : classification par IA, tous frais inclus dès USD $270 par classe, dépôt en 24 heures ouvrées.',
    ctaLabel: 'Déposer ma marque maintenant',
    trustStrip: ['Taxes incluses', 'Garantie meilleur prix', 'Dépôt IMPI en 24 heures ouvrées'],
    bodyHeading1: 'Pourquoi enregistrer une marque au Mexique ?',
    bodyParagraph1: 'Le Mexique est le 15e PIB mondial et un marché en forte croissance pour les exportateurs francophones — qu\'ils viennent de France, du Canada, d\'Afrique subsaharienne ou des Antilles. L\'enregistrement d\'une marque auprès de l\'Instituto Mexicano de la Propiedad Industrial (IMPI) confère un droit exclusif d\'utilisation sur l\'ensemble du territoire mexicain pour 10 ans renouvelables. Sans cette protection, un concurrent peut légalement utiliser votre nom de marque au Mexique. Pour les producteurs agroalimentaires ivoiriens, camerounais ou sénégalais qui exportent vers le Mexique, pour les PME françaises qui distribuent dans le réseau USMCA, et pour les marques québécoises qui s\'étendent en Amérique latine, la marque IMPI est le fondement de la protection commerciale.',
    bodyHeading2: 'Pourquoi choisir MexicoTrademarkCenter ?',
    bodyBullets: [
      'Classification par IA : décrivez vos produits ou services en français et notre IA sélectionne automatiquement la classe correcte parmi les 45 de la Classification de Nice.',
      'Générateur d\'idées de marque par IA : pas encore de nom ? L\'IA propose des options créatives et vérifie la disponibilité auprès de l\'IMPI instantanément.',
      'Tarif tout compris : USD $270 par classe couvre les honoraires de service et les taxes officielles de l\'IMPI. Aucun frais caché.',
      'Dépôt en 24 heures ouvrées : votre demande est déposée auprès de l\'IMPI dans les 24 heures ouvrées suivant la confirmation du paiement.',
      'Accusé de réception valable pour Amazon Brand Registry : l\'accusé officiel de l\'IMPI est reconnu par Amazon pour activer Amazon Brand Registry Mexique.',
    ],
    bodyHeading3: 'Comment fonctionne la procédure IMPI ?',
    bodyParagraph3: 'Après le dépôt, l\'IMPI procède à un examen formel de la demande. Si elle est recevable, la marque est publiée dans la Gazette de la Propriété Industrielle pendant 30 jours ouvrables pour permettre l\'opposition de tiers. En l\'absence d\'opposition, l\'examen de fond vérifie le caractère distinctif de la marque et l\'absence de conflit avec des enregistrements antérieurs. Le délai total jusqu\'au certificat d\'enregistrement est de 12 à 24 mois. Notre tableau de bord client vous tient informé à chaque étape en temps réel.',
    testimonials: [
      {
        quote: 'Nous exportons des produits cosmétiques bio vers le Mexique et avons eu besoin de protéger notre marque rapidement. Le dépôt a été effectué en moins de 24 heures. Service impeccable.',
        author: 'Aminata D.',
        role: 'Fondatrice, cosmétiques naturels — Abidjan, Côte d\'Ivoire',
      },
      {
        quote: 'En tant que PME française présente sur le marché nord-américain, la protection de notre marque au Mexique était indispensable. Processus clair, prix transparent.',
        author: 'Laurent P.',
        role: 'Directeur export, agroalimentaire — Lyon, France',
      },
      {
        quote: 'L\'outil de classification par IA m\'a épargné des heures de recherche dans les classes de Nice. J\'ai décrit mon activité et la classe s\'est sélectionnée automatiquement.',
        author: 'Marie-Claire B.',
        role: 'Consultante en propriété intellectuelle — Montréal, Canada',
      },
    ],
    features: [
      {
        title: 'Générateur de noms de marque par IA',
        description: 'Pas encore de nom pour votre marque ? L\'IA génère des options créatives et vérifie la disponibilité IMPI en temps réel.',
        linkLabel: 'Essayer le générateur',
        linkTo: '/trademark-ideas',
      },
      {
        title: 'Classification automatique par IA',
        description: 'Pas besoin de connaître les classes de Nice. L\'IA détermine la bonne classe à partir de la description de votre activité.',
        linkLabel: 'Vérifier ma marque gratuitement',
        linkTo: '/trademark-check',
      },
      {
        title: 'Meilleur prix garanti',
        description: 'Le dépôt de marque au Mexique le moins cher du marché, taxes incluses. Trouvez moins cher et nous alignons le prix.',
        linkLabel: 'Voir les tarifs',
        linkTo: '/pricing',
      },
    ],
    faqs: [
      {
        q: 'Les entreprises étrangères peuvent-elles déposer une marque au Mexique ?',
        a: 'Oui. Les personnes physiques et morales de toute nationalité peuvent déposer des demandes de marque directement auprès de l\'IMPI sans avoir besoin d\'une filiale mexicaine.',
      },
      {
        q: 'Quel est le coût d\'enregistrement d\'une marque au Mexique ?',
        a: 'Notre tarif tout compris est de USD $270 par classe : honoraires de service (USD $100) + taxes officielles IMPI (USD $170). Aucun frais supplémentaire.',
      },
      {
        q: 'Quel est le délai d\'enregistrement au Mexique ?',
        a: 'La procédure complète prend de 12 à 24 mois selon la charge de travail de l\'IMPI et les éventuelles actions d\'office.',
      },
      {
        q: 'Dans quel délai ma demande est-elle déposée ?',
        a: 'Nous déposons votre demande auprès de l\'IMPI dans les 24 heures ouvrées suivant la confirmation du paiement.',
      },
      {
        q: 'L\'accusé de réception IMPI est-il valable pour Amazon Brand Registry ?',
        a: 'Oui. L\'accusé officiel émis lors du dépôt est reconnu par Amazon pour activer Amazon Brand Registry Mexique.',
      },
      {
        q: 'Puis-je déposer plusieurs classes simultanément ?',
        a: 'Oui. Vous pouvez inclure plusieurs classes dans une seule demande. Le tarif est de USD $270 par classe.',
      },
    ],
    finalCtaHeading: 'Protégez votre marque au Mexique dès aujourd\'hui',
    finalCtaSubtext: 'Des centaines d\'entreprises ont déjà déposé avec nous. La demande prend quelques minutes.',
    finalCtaButton: 'Commencer ma demande',
    chargedInLabel: 'par classe · facturé en USD',
    viewInLabel: 'Voir en',
    perClass: 'par classe',
    socialProofLabel: 'Des entreprises du monde entier nous font confiance',
    starLabel: 'Avis clients',
  },

  hi: {
    url: '/hi/',
    lang: 'hi',
    bcp47: 'hi',
    ogLocale: 'hi_IN',
    ogImageAlt: 'मेक्सिको में किफायती ट्रेडमार्क पंजीकरण — MexicoTrademarkCenter',
    targetCurrency: 'INR',
    title: 'मेक्सिको में किफायती ट्रेडमार्क पंजीकरण | IMPI ऑनलाइन — MexicoTrademarkCenter',
    metaDescription: 'मेक्सिको में किफायती ट्रेडमार्क पंजीकरण — USD $270 प्रति वर्ग, सभी शुल्क सहित। IMPI के साथ 24 व्यावसायिक घंटों में दाखिल। Amazon Brand Registry के लिए मान्य।',
    h1: 'मेक्सिको में ट्रेडमार्क पंजीकरण — IMPI ऑनलाइन',
    valueProposition: 'भारतीय Amazon विक्रेताओं और निर्यातकों के लिए किफायती समाधान: AI-संचालित वर्गीकरण, USD $270 प्रति वर्ग सर्व-समावेशी, 24 घंटे में IMPI दाखिलगी।',
    ctaLabel: 'अभी आवेदन करें',
    trustStrip: ['कर सहित मूल्य', 'मूल्य गारंटी', '24 व्यावसायिक घंटों में IMPI दाखिलगी'],
    bodyHeading1: 'मेक्सिको में ट्रेडमार्क पंजीकरण क्यों आवश्यक है?',
    bodyParagraph1: 'मेक्सिको विश्व की 15वीं सबसे बड़ी अर्थव्यवस्था है और Amazon.com.mx के माध्यम से लैटिन अमेरिका में प्रवेश का प्रमुख द्वार है। भारतीय विक्रेता जो Amazon Global Selling के तहत मेक्सिको में व्यापार कर रहे हैं, उन्हें Amazon Brand Registry सक्रिय करने के लिए IMPI (Instituto Mexicano de la Propiedad Industrial) में ट्रेडमार्क पंजीकरण की आवश्यकता होती है। बिना इस पंजीकरण के, कोई भी प्रतियोगी आपके ब्रांड नाम का उपयोग मेक्सिको में कर सकता है। मेक्सिको में पंजीकृत ट्रेडमार्क 10 वर्षों के लिए वैध होता है और नवीनीकरण योग्य है।',
    bodyHeading2: 'MexicoTrademarkCenter क्यों चुनें?',
    bodyBullets: [
      'AI-संचालित Nice वर्गीकरण: अपने उत्पादों या सेवाओं को हिंदी में वर्णित करें और हमारी AI 45 अंतर्राष्ट्रीय वर्गों में से सही वर्ग स्वचालित रूप से चुनती है।',
      'AI ट्रेडमार्क आइडिया जनरेटर: ब्रांड नाम नहीं तय किया? AI रचनात्मक विकल्प उत्पन्न करती है और तुरंत IMPI उपलब्धता जाँचती है।',
      'सर्व-समावेशी मूल्य: प्रति वर्ग USD $270 में सेवा शुल्क और IMPI आधिकारिक शुल्क दोनों शामिल हैं। कोई छिपा हुआ शुल्क नहीं।',
      '24 व्यावसायिक घंटों में दाखिलगी: भुगतान की पुष्टि के 24 व्यावसायिक घंटों के भीतर आपका आवेदन IMPI में दाखिल किया जाता है।',
      'Amazon Brand Registry के लिए मान्य: IMPI की आधिकारिक रसीद Amazon Brand Registry Mexico सक्रिय करने के लिए Amazon द्वारा स्वीकृत है।',
    ],
    bodyHeading3: 'IMPI प्रक्रिया की सरल व्याख्या',
    bodyParagraph3: 'दाखिल होने के बाद IMPI औपचारिक जांच करता है। स्वीकृत होने पर, ट्रेडमार्क 30 कार्य दिवसों के लिए औद्योगिक संपत्ति राजपत्र में प्रकाशित होता है जिससे तीसरे पक्ष विरोध कर सकते हैं। बिना विरोध के, योग्यता परीक्षण होता है जहाँ विशिष्टता और पूर्व पंजीकरणों से टकराव की जाँच होती है। पंजीकरण प्रमाणपत्र प्राप्त होने में 12 से 24 महीने लगते हैं। हमारा क्लाइंट डैशबोर्ड हर चरण में रियल-टाइम अपडेट प्रदान करता है।',
    testimonials: [
      {
        quote: 'मैं Amazon Global Selling के तहत मेक्सिको में इलेक्ट्रॉनिक्स बेचता हूँ। Brand Registry के लिए IMPI रसीद की जरूरत थी। MexicoTrademarkCenter ने एक सप्ताह में सब कुछ व्यवस्थित कर दिया।',
        author: 'राहुल एस.',
        role: 'Amazon विक्रेता, इलेक्ट्रॉनिक्स — मुंबई, भारत',
      },
      {
        quote: 'AI वर्गीकरण टूल बेहद उपयोगी है। उत्पाद विवरण डाला और सही Nice वर्ग तुरंत मिल गया। समय और पैसे दोनों बचे।',
        author: 'प्रिया के.',
        role: 'ब्रांड मैनेजर, हस्तशिल्प निर्यात — जयपुर, भारत',
      },
      {
        quote: 'मेक्सिको में ट्रेडमार्क दाखिल करने का यह सबसे किफायती और पारदर्शी तरीका है जो मुझे मिला। पूरी प्रक्रिया में कोई जटिलता नहीं थी।',
        author: 'अनिल वी.',
        role: 'निर्यातक, कपड़ा — सूरत, भारत',
      },
    ],
    features: [
      {
        title: 'AI ट्रेडमार्क आइडिया जनरेटर',
        description: 'ब्रांड नाम नहीं सोचा? AI रचनात्मक विकल्प बनाती है और IMPI उपलब्धता तुरंत जाँचती है।',
        linkLabel: 'जनरेटर आज़माएं',
        linkTo: '/trademark-ideas',
      },
      {
        title: 'AI-संचालित वर्गीकरण',
        description: 'Nice वर्गीकरण जानने की जरूरत नहीं। AI आपके व्यवसाय विवरण से सही वर्ग निर्धारित करती है।',
        linkLabel: 'मेरा ट्रेडमार्क मुफ्त जाँचें',
        linkTo: '/trademark-check',
      },
      {
        title: 'सबसे कम मूल्य गारंटी',
        description: 'बाजार में सबसे किफायती मेक्सिको ट्रेडमार्क दाखिलगी, कर सहित। कहीं सस्ता मिले तो मूल्य मेल करेंगे।',
        linkLabel: 'मूल्य देखें',
        linkTo: '/pricing',
      },
    ],
    faqs: [
      {
        q: 'क्या भारतीय कंपनियाँ मेक्सिको में ट्रेडमार्क पंजीकरण करा सकती हैं?',
        a: 'हाँ। किसी भी राष्ट्रीयता के व्यक्ति और कंपनियाँ IMPI में सीधे ट्रेडमार्क आवेदन दाखिल कर सकती हैं, बिना मेक्सिकन सहायक कंपनी की आवश्यकता के।',
      },
      {
        q: 'मेक्सिको में ट्रेडमार्क पंजीकरण की लागत कितनी है?',
        a: 'हमारा सर्व-समावेशी मूल्य USD $270 प्रति वर्ग है: सेवा शुल्क USD $100 + IMPI आधिकारिक शुल्क USD $170। कोई अतिरिक्त शुल्क नहीं।',
      },
      {
        q: 'क्या IMPI रसीद Amazon Brand Registry के लिए मान्य है?',
        a: 'हाँ। दाखिलगी के समय जारी IMPI आधिकारिक रसीद Amazon Brand Registry Mexico सक्रिय करने के लिए Amazon द्वारा स्वीकृत है।',
      },
      {
        q: 'पंजीकरण में कितना समय लगता है?',
        a: 'पूरी प्रक्रिया 12 से 24 महीने लेती है, IMPI की कार्यभार और किसी कार्यालय कार्रवाई के आधार पर।',
      },
      {
        q: 'मेरा आवेदन कितने समय में दाखिल होता है?',
        a: 'भुगतान की पुष्टि और पूर्ण जानकारी प्राप्त होने के 24 व्यावसायिक घंटों के भीतर IMPI में दाखिल किया जाता है।',
      },
      {
        q: 'क्या एक साथ कई वर्गों के लिए आवेदन कर सकते हैं?',
        a: 'हाँ। एक ही ऑर्डर में कई वर्ग शामिल कर सकते हैं। मूल्य USD $270 प्रति वर्ग है।',
      },
    ],
    finalCtaHeading: 'आज ही मेक्सिको में अपने ब्रांड की सुरक्षा करें',
    finalCtaSubtext: 'सैकड़ों व्यवसायों ने हमारे साथ आवेदन किया है। प्रक्रिया में केवल कुछ मिनट लगते हैं।',
    finalCtaButton: 'आवेदन शुरू करें',
    chargedInLabel: 'प्रति वर्ग · USD में शुल्क लिया जाता है',
    viewInLabel: 'INR में देखें',
    perClass: 'प्रति वर्ग',
    socialProofLabel: 'विश्वभर के व्यवसायों का भरोसा',
    starLabel: 'ग्राहक रेटिंग',
  },

  ja: {
    url: '/ja/',
    lang: 'ja',
    bcp47: 'ja',
    ogLocale: 'ja_JP',
    ogImageAlt: 'メキシコ商標登録 低価格・全費用込み — MexicoTrademarkCenter',
    targetCurrency: 'JPY',
    title: 'メキシコ商標登録 低価格・全費用込み | IMPI オンライン申請 — MexicoTrademarkCenter',
    metaDescription: 'メキシコ商標登録が低価格・全費用込みでUSD $270/区分から。IMPIにオンラインで申請、AIによる区分分類、24営業時間以内の提出。Amazon Brand Registryにも対応。',
    h1: 'メキシコ商標登録 — IMPI オンライン申請',
    valueProposition: '日本企業・ブランドのための低コストなメキシコ商標登録：AIによる区分分類、全費用込みUSD $270/区分、24営業時間以内のIMPI申請提出。',
    ctaLabel: '今すぐ商標登録を申請する',
    trustStrip: ['税込み価格', '最低価格保証', '24営業時間以内にIMPI申請'],
    bodyHeading1: 'なぜメキシコで商標登録が必要なのか？',
    bodyParagraph1: 'メキシコは世界第15位の経済大国であり、USMCA（米国・メキシコ・カナダ協定）の一員として北米市場への重要な入口です。メキシコで事業を展開する日本企業、Amazon.com.mxで販売するブランド、ライセンス契約を結ぶメーカーにとって、商標登録はブランド保護の最初のステップです。IMPI（メキシコ工業所有権庁）への商標登録により、メキシコ全土での独占使用権を10年間（更新可能）取得できます。登録なしでは、競合他社が同一・類似のブランド名をメキシコで合法的に使用することができます。',
    bodyHeading2: 'MexicoTrademarkCenterを選ぶ理由',
    bodyBullets: [
      'AIによるニース分類：商品・サービスを日本語で説明するだけで、AIが45の国際分類の中から正しい区分を自動的に選択します。',
      'AI商標アイデアジェネレーター：ブランド名が決まっていない場合は、AIが独創的な選択肢を提案し、IMPIデータベースで即座に空き状況を確認します。',
      '全費用込み価格：1区分USD $270でサービス料とIMPI公式登録費用がすべて含まれます。追加料金なし。',
      '24営業時間以内の申請提出：支払い確認後24営業時間以内にIMPIへ申請書を提出します。',
      'Amazon Brand Registry対応：申請時に発行するIMPI公式受理書は、Amazon Brand Registry Mexicoの有効化にAmazonが認める書類です。',
    ],
    bodyHeading3: 'IMPI申請手続きの流れ',
    bodyParagraph3: '申請書が提出されると、IMPIは形式審査を実施します。通過後、商標は工業所有権公報に30営業日間公告され、第三者が異議申立を行う機会が与えられます。異議がなければ実体審査に進み、商標の識別性と先行登録との抵触がチェックされます。登録証書の取得までには12〜24ヶ月かかります。クライアントダッシュボードでは、各手続き段階をリアルタイムで確認いただけます。',
    testimonials: [
      {
        quote: 'Amazon Mexicoで家電製品を販売しており、Brand Registry申請のためにIMPI受理書が必要でした。MexicoTrademarkCenterは申請から受理書の発行まで1週間以内に対応してくれました。',
        author: '田中 H.',
        role: 'Amazonセラー、家電ブランド — 東京、日本',
      },
      {
        quote: 'メキシコでのライセンス展開に備えて商標を登録しました。AI区分分類ツールのおかげで、ニース分類を調べる手間が省けました。',
        author: '鈴木 A.',
        role: 'ライセンス担当、消費財メーカー — 大阪、日本',
      },
      {
        quote: '全費用込みのUSD $270という価格は非常に透明で、代理人を使った場合の数分の1のコストです。サービスの質も申し分ありません。',
        author: '山本 K.',
        role: 'IP担当マネージャー、化粧品会社 — 名古屋、日本',
      },
    ],
    features: [
      {
        title: 'AI商標アイデアジェネレーター',
        description: 'ブランド名が決まっていない？AIが独創的な候補を提案し、即座にIMPIの空き状況を確認します。',
        linkLabel: 'ジェネレーターを試す',
        linkTo: '/trademark-ideas',
      },
      {
        title: 'AIによる自動区分分類',
        description: 'ニース分類の知識不要。事業内容を入力するだけで、AIが正確な区分を特定します。',
        linkLabel: '無料で商標を確認する',
        linkTo: '/trademark-check',
      },
      {
        title: '最低価格保証',
        description: '市場最安値のメキシコ商標登録サービス、税込み。より安い価格が見つかれば合わせます。',
        linkLabel: '料金を見る',
        linkTo: '/pricing',
      },
    ],
    faqs: [
      {
        q: '日本企業や個人はメキシコで商標登録できますか？',
        a: 'はい。いかなる国籍の個人・法人もメキシコに子会社を設立することなく、直接IMPIに商標出願を行うことができます。',
      },
      {
        q: 'メキシコ商標登録の費用はいくらですか？',
        a: '1区分あたりUSD $270（全費用込み）：サービス料USD $100 + IMPI公式登録費USD $170。追加費用は一切ありません。',
      },
      {
        q: 'IMPI受理書はAmazon Brand Registryに使えますか？',
        a: 'はい。申請時に発行するIMPI公式受理書は、Amazon Brand Registry Mexicoの有効化にAmazonが認める書類です。',
      },
      {
        q: '登録証書の取得までどのくらいかかりますか？',
        a: 'IMPI全体の審査期間は12〜24ヶ月です（IMPIの審査状況と拒絶理由通知の有無によります）。',
      },
      {
        q: '申請書の提出までどのくらいかかりますか？',
        a: '支払い確認と必要書類の受領後24営業時間以内にIMPIへ提出します。',
      },
      {
        q: '複数の区分を同時に申請できますか？',
        a: 'はい。1つの出願で複数の区分を申請できます。価格は1区分あたりUSD $270です。',
      },
      {
        q: 'IMPIから拒絶理由通知が届いた場合はどうなりますか？',
        a: '拒絶理由通知への対応は基本サービスに含まれていません。通知が届いた場合、ダッシュボード経由でお知らせし、別途対応費用のお見積りを提供します。',
      },
    ],
    finalCtaHeading: 'メキシコでのブランドを今すぐ守る',
    finalCtaSubtext: '数百社がすでに私たちと一緒に商標登録を完了しました。申請は数分で完了します。',
    finalCtaButton: '申請を開始する',
    chargedInLabel: '/区分 · USD請求',
    viewInLabel: 'JPYで見る',
    perClass: '/区分',
    socialProofLabel: '世界中の企業・ブランドに信頼されています',
    starLabel: '顧客評価',
  },
};

export const HREFLANG_ALTERNATES = Object.values(LANDING_PAGES).map(p => ({
  lang: p.bcp47,
  href: p.url,
}));
