/**
 * Post-build static pre-renderer for language landing pages.
 *
 * For each language route (/es/, /en/, /zh/, /pt/, /de/, /fr/, /hi/, /ja/)
 * this script:
 *   1. Reads the Vite-built dist/index.html shell.
 *   2. Replaces the generic <title>, <meta description>, and <html lang> with
 *      the correct per-language values from landingPages data (inlined below).
 *   3. Injects the full hreflang block.
 *   4. Writes the full pre-rendered page body as static HTML inside #root so
 *      crawlers see localized content without executing JavaScript.
 *   5. Saves to dist/{lang}/index.html.
 *
 * The client-side React app will hydrate on top of this HTML.
 *
 * Run: node scripts/prerender.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.resolve(__dirname, '../dist');
const BASE_URL = 'https://www.mexicotrademarkcenter.com';

// ---------- Inline page data (mirrors src/data/landingPages.ts) ----------
// Kept as plain JS so this script has zero dependencies at build time.

const PAGES = {
  es: {
    bcp47: 'es',
    ogLocale: 'es_MX',
    ogImageAlt: 'Registro de marca asequible en México — MexicoTrademarkCenter',
    title: 'Registro de Marca en México | MexicoTrademarkCenter',
    desc: 'Registro de marca asequible en México ante el IMPI, 100% en línea. Desde USD $299 por clase, todo incluido. Presentación en 24 horas hábiles.',
    h1: 'Registra tu marca en México ante el IMPI',
    valueProp: 'La forma más rápida y asequible de registrar tu marca en México: IA para clasificación, presentación en 24 horas hábiles y precios todo incluido.',
    cta: 'Registrar mi marca ahora',
    bodyH1: '¿Qué es el registro de marca en México y por qué importa?',
    bodyP1: 'Una marca registrada ante el Instituto Mexicano de la Propiedad Industrial (IMPI) te otorga el derecho exclusivo de uso en todo el territorio nacional por 10 años renovables. Sin ese registro, cualquier tercero puede usar tu nombre comercial, tu logotipo o tu slogan en el mercado mexicano sin consecuencias legales. Para empresas mexicanas, emprendedores y marcas que venden en plataformas como Mercado Libre o Amazon México, el registro es la primera línea de defensa contra la piratería y el uso indebido.',
    bodyH2: '¿Por qué usar MexicoTrademarkCenter para registrar tu marca?',
    bullets: [
      'IA de clasificación de Nice: describe tus productos o servicios en español y nuestra IA selecciona automáticamente la clase correcta.',
      'Precio todo incluido: USD $299 por clase cubre honorarios de servicio y tasas oficiales del IMPI. Sin sorpresas.',
      'Presentación en 24 horas hábiles: tu solicitud se presenta ante el IMPI dentro de las 24 horas hábiles siguientes a la confirmación del pago.',
      'Acuse de recibo válido para Amazon Brand Registry.',
    ],
    bodyH3: 'El proceso IMPI explicado de forma simple',
    bodyP3: 'El IMPI recibe tu solicitud, la examina formalmente y, si todo está en orden, la publica en la Gaceta de la Propiedad Industrial durante un período de oposición de 30 días hábiles. El tiempo total hasta el certificado de registro es de 12 a 24 meses.',
    testimonials: [
      { quote: 'Registré mi marca para mi línea de cosméticos en menos de una semana. El proceso fue clarísimo.', author: 'Valentina R.', role: 'Fundadora, marca de cosméticos — Guadalajara, México' },
      { quote: 'Vendo en Mercado Libre y necesitaba el registro. MexicoTrademarkCenter lo hizo más sencillo de lo que esperaba.', author: 'Carlos M.', role: 'Vendedor en línea — Ciudad de México, México' },
      { quote: 'Excelente relación calidad-precio. Por USD $299 obtuve un servicio profesional que en un despacho me hubiera costado el triple.', author: 'Sofía L.', role: 'Directora de operaciones — Monterrey, México' },
    ],
    faqs: [
      { q: '¿Puedo registrar una marca en México si soy extranjero?', a: 'Sí. Personas físicas y empresas de cualquier nacionalidad pueden presentar solicitudes de marca directamente ante el IMPI.' },
      { q: '¿Cuánto cuesta registrar una marca en México?', a: 'Nuestro precio es de USD $299 por clase, todo incluido: honorarios de servicio (USD $129) y tasas oficiales del IMPI (USD $170).' },
      { q: '¿Cuánto tiempo tarda el registro?', a: 'El proceso completo ante el IMPI toma entre 12 y 24 meses.' },
      { q: '¿El acuse del IMPI sirve para Amazon Brand Registry?', a: 'Sí. El acuse oficial es aceptado por Amazon para activar Amazon Brand Registry México.' },
    ],
    finalH: 'Protege tu marca en México hoy',
    finalSub: 'Cientos de empresas ya han registrado su marca con nosotros.',
    finalBtn: 'Comenzar mi solicitud',
    price: 'USD $299 por clase',
  },
  en: {
    bcp47: 'en',
    ogLocale: 'en_US',
    ogImageAlt: 'Affordable trademark registration in Mexico — MexicoTrademarkCenter',
    title: 'Mexico Trademark Registration | MexicoTrademarkCenter',
    desc: 'Affordable trademark registration in Mexico with IMPI — all fees included from USD $299 per class. AI-powered classification, 24-hour filing, no hidden charges.',
    h1: 'Register a Trademark in Mexico with IMPI',
    valueProp: 'The most affordable way to file a Mexico trademark — AI-powered classification, all fees included from USD $299 per class, 24-hour IMPI submission.',
    cta: 'Start My Application',
    bodyH1: 'Why Register a Trademark in Mexico?',
    bodyP1: 'Mexico is the 15th largest economy in the world and a gateway to Latin America under the USMCA trade agreement. A trademark registered with IMPI gives you the exclusive right to use your brand name, logo, or slogan across the entire Mexican territory for 10 renewable years. For Amazon sellers on Amazon.com.mx, exporters, and businesses expanding into Mexico, trademark registration is the foundation of your brand protection strategy.',
    bodyH2: 'Why Choose MexicoTrademarkCenter?',
    bullets: [
      'AI-powered Nice Classification: describe your goods and services in plain English and our AI maps them to the correct class.',
      'All-inclusive pricing: USD $299 per class covers service fees and official IMPI government fees. No hidden charges.',
      '24-hour IMPI submission: your application is filed within 24 business hours of payment confirmation.',
      'Amazon Brand Registry ready: the official IMPI receipt is accepted by Amazon to activate Amazon Brand Registry Mexico.',
    ],
    bodyH3: 'How the IMPI Process Works',
    bodyP3: 'Once filed, IMPI conducts a formal examination. If it passes, it is published for a 30-business-day opposition period. After that, IMPI examines the mark on its merits. Total time to certificate: 12 to 24 months.',
    testimonials: [
      { quote: 'I sell on Amazon Mexico and needed the IMPI filing receipt for Brand Registry. The whole process took under a week. Incredibly smooth.', author: 'James T.', role: 'Amazon Seller — Austin, TX, USA' },
      { quote: 'As a US brand expanding into Mexico, we needed trademark protection fast. Filed within 24 hours and the dashboard made tracking easy.', author: 'Michelle K.', role: 'Brand Director — New York, USA' },
      { quote: 'The AI classification tool saved me hours of research. I described my software and it immediately identified the right Nice classes.', author: 'David O.', role: 'SaaS Founder — San Francisco, CA, USA' },
    ],
    faqs: [
      { q: 'Can foreign companies file a trademark in Mexico?', a: 'Yes. Foreign individuals and companies of any nationality can file directly with IMPI without a Mexican subsidiary.' },
      { q: 'How much does it cost to register a trademark in Mexico?', a: 'USD $299 per class, all-inclusive: service fee USD $129 plus IMPI government fees USD $170.' },
      { q: 'How long does Mexico trademark registration take?', a: '12 to 24 months depending on IMPI\'s workload.' },
      { q: 'Can I use the IMPI filing receipt for Amazon Brand Registry?', a: 'Yes. The official IMPI receipt is accepted by Amazon to activate Amazon Brand Registry Mexico.' },
    ],
    finalH: 'Protect Your Brand in Mexico Today',
    finalSub: 'Join hundreds of businesses that have already filed with us.',
    finalBtn: 'Start My Application',
    price: 'USD $299 per class',
  },
  zh: {
    bcp47: 'zh-Hans',
    ogLocale: 'zh_CN',
    ogImageAlt: '墨西哥商标注册低价全包 — MexicoTrademarkCenter',
    title: '墨西哥商标注册 | MexicoTrademarkCenter',
    desc: '墨西哥商标注册费用低廉，每类仅USD $299全包含官费，IMPI官方在线申请，24工作小时内提交。AI智能分类，中文服务。',
    h1: '墨西哥商标注册 — IMPI在线申请',
    valueProp: '专为中国跨境卖家打造：费用低廉全透明，AI智能分类、24小时内向IMPI提交申请、含全部官费。',
    cta: '立即申请商标注册',
    bodyH1: '为什么在墨西哥注册商标？',
    bodyP1: '墨西哥是全球第15大经济体，也是亚马逊跨境电商进入拉丁美洲的重要门户。在Amazon.com.mx销售的中国卖家需要向墨西哥工业产权局（IMPI）注册商标，才能激活Amazon品牌注册，从而有效防止仿冒和跟卖。商标注册成功后可享有10年独占使用权。',
    bodyH2: '为什么选择MexicoTrademarkCenter？',
    bullets: [
      'AI智能尼斯分类：用中文描述您的商品或服务，AI自动从45个国际分类中选出正确类别。',
      '全包价格透明：每类USD $299，含服务费（USD $129）和IMPI官方注册费（USD $170）。',
      '24工作小时内提交：付款确认后24工作小时内向IMPI提交申请。',
      'IMPI受理回执可用于Amazon品牌注册。',
    ],
    bodyH3: 'IMPI申请流程简介',
    bodyP3: 'IMPI收到申请后进行形式审查，通过后在《工业产权公报》上公告30个工作日。从提交到拿到注册证书通常需要12至24个月。',
    testimonials: [
      { quote: '我们是深圳的3C卖家，在Amazon MX开店需要IMPI受理回执做品牌注册。MexicoTrademarkCenter一周内就搞定了，效率非常高。', author: '张先生', role: '跨境电商运营，3C品牌卖家 — 深圳，中国' },
      { quote: 'AI分类工具太好用了，输入产品描述就自动给出了正确的尼斯类别，省去了大量查询时间。', author: '李女士', role: '品牌经理，家居用品 — 广州，中国' },
      { quote: '客服响应很快，中英文都可以沟通。墨西哥商标申请一次性通过，强烈推荐。', author: '王先生', role: '外贸出口，义乌 — 浙江，中国' },
    ],
    faqs: [
      { q: '中国公司或个人可以在墨西哥注册商标吗？', a: '可以。任何国籍的个人和企业均可直接向IMPI提交商标申请，无需在墨西哥设立子公司。' },
      { q: '墨西哥商标注册费用是多少？', a: '我们的全包价格为每类USD $299，包含服务费USD $129和IMPI官方注册费USD $170。' },
      { q: 'IMPI受理回执可以用于Amazon品牌注册吗？', a: '可以。我们出具的IMPI官方受理回执是Amazon品牌注册中国卖家最常用的申请证明文件。' },
      { q: '从提交到拿到注册证书需要多长时间？', a: '完整流程通常需要12至24个月。' },
    ],
    finalH: '立即保护您在墨西哥的品牌',
    finalSub: '数百家企业已经通过我们完成了墨西哥商标申请。',
    finalBtn: '开始申请',
    price: 'USD $299 每类',
  },
  pt: {
    bcp47: 'pt',
    ogLocale: 'pt_BR',
    ogImageAlt: 'Registro de marca acessível no México — MexicoTrademarkCenter',
    title: 'Registro de Marca no México | MexicoTrademarkCenter',
    desc: 'Registro de marca acessível no México junto ao IMPI — a partir de USD $299 por classe, tudo incluído. Protocolo em 24 horas úteis, classificação por IA, sem taxas ocultas.',
    h1: 'Registro de Marca no México — Protocolo IMPI Online',
    valueProp: 'A forma mais acessível de registrar sua marca no México: classificação por IA, todos os impostos inclusos a partir de USD $299 por classe, protocolo em 24 horas úteis.',
    cta: 'Registrar Minha Marca',
    bodyH1: 'Por que registrar uma marca no México?',
    bodyP1: 'O México é o principal parceiro comercial do Brasil na América do Norte e representa uma oportunidade crescente para exportadores brasileiros. O registro junto ao IMPI garante o direito exclusivo de uso da sua marca em todo o território mexicano por 10 anos renováveis.',
    bodyH2: 'Por que escolher a MexicoTrademarkCenter?',
    bullets: [
      'Classificação por IA: descreva seus produtos em português e nossa IA seleciona automaticamente a classe correta.',
      'Preço com tudo incluído: USD $299 por classe cobre honorários e taxas oficiais do IMPI. Sem surpresas.',
      'Protocolo em 24 horas úteis: sua solicitação é protocolada no IMPI dentro de 24 horas úteis.',
      'Comprovante aceito pelo Amazon Brand Registry México.',
    ],
    bodyH3: 'Como funciona o processo no IMPI',
    bodyP3: 'Após o protocolo, o IMPI realiza um exame formal. Se aprovada, a marca é publicada por 30 dias úteis para eventual oposição. O prazo total até o certificado é de 12 a 24 meses.',
    testimonials: [
      { quote: 'Expandimos nossa linha de suplementos para o México e o protocolo saiu em menos de 24 horas.', author: 'Rodrigo F.', role: 'Diretor comercial, suplementos — São Paulo, Brasil' },
      { quote: 'Vendo no Amazon México há dois anos. A MexicoTrademarkCenter cuidou de tudo, sem complicação.', author: 'Camila S.', role: 'Empreendedora digital, moda — Rio de Janeiro, Brasil' },
      { quote: 'O melhor custo-benefício que encontrei. O preço todo incluído sem letras miúdas foi o que me convenceu.', author: 'André M.', role: 'CEO, empresa de tecnologia — Florianópolis, Brasil' },
    ],
    faqs: [
      { q: 'Empresas brasileiras podem registrar marca no México?', a: 'Sim. Pessoas físicas e empresas de qualquer nacionalidade podem protocolar pedidos diretamente no IMPI.' },
      { q: 'Quanto custa o registro de marca no México?', a: 'USD $299 por classe, tudo incluído: honorários (USD $129) e taxas oficiais do IMPI (USD $170).' },
      { q: 'O comprovante do IMPI serve para o Amazon Brand Registry?', a: 'Sim. O comprovante oficial é aceito pelo Amazon para ativar o Amazon Brand Registry México.' },
      { q: 'Qual o prazo para o certificado de registro?', a: 'O processo completo leva de 12 a 24 meses.' },
    ],
    finalH: 'Proteja sua marca no México hoje mesmo',
    finalSub: 'Centenas de empresas já protocolaram conosco.',
    finalBtn: 'Iniciar Minha Solicitação',
    price: 'USD $299 por classe',
  },
  de: {
    bcp47: 'de',
    ogLocale: 'de_DE',
    ogImageAlt: 'Günstige Markenanmeldung in Mexiko — MexicoTrademarkCenter',
    title: 'Markenanmeldung in Mexiko | MexicoTrademarkCenter',
    desc: 'Günstige Markenanmeldung in Mexiko beim IMPI — Komplettpreis ab USD $299 pro Klasse, alle Gebühren inklusive. Einreichung innerhalb von 24 Geschäftsstunden, vollständig online.',
    h1: 'Markenanmeldung in Mexiko beim IMPI',
    valueProp: 'Die günstigste Markenanmeldung in Mexiko: KI-gestützte Klassifizierung, Einreichung innerhalb von 24 Geschäftsstunden, Komplettpreis inklusive aller IMPI-Gebühren.',
    cta: 'Marke jetzt anmelden',
    bodyH1: 'Warum eine Marke in Mexiko schützen?',
    bodyP1: 'Mexiko ist die größte spanischsprachige Volkswirtschaft der Welt und ein zentraler Markt im USMCA-Freihandelsabkommen. Die IMPI-Eintragung gewährt ein 10-jähriges, verlängerbares Ausschließlichkeitsrecht für das gesamte mexikanische Staatsgebiet.',
    bodyH2: 'Warum MexicoTrademarkCenter wählen?',
    bullets: [
      'KI-gestützte Nizza-Klassifizierung: Beschreiben Sie Ihre Waren auf Deutsch und unsere KI wählt automatisch die korrekte Klasse.',
      'Komplettpreis: USD $299 pro Klasse deckt Service- und IMPI-Gebühren. Keine versteckten Kosten.',
      'Einreichung innerhalb von 24 Geschäftsstunden nach Zahlungsbestätigung.',
      'Amazon Brand Registry: Der IMPI-Eingangsbeleg wird von Amazon als Nachweis akzeptiert.',
    ],
    bodyH3: 'Das IMPI-Verfahren einfach erklärt',
    bodyP3: 'Nach der Einreichung prüft der IMPI die Anmeldung formell. Bei positivem Ergebnis wird die Marke für 30 Geschäftstage veröffentlicht. Die Gesamtdauer bis zum Eintragungszertifikat beträgt 12 bis 24 Monate.',
    testimonials: [
      { quote: 'Wir exportieren Maschinenbauteile nach Mexiko. Der Prozess war unkompliziert, die Einreichung erfolgte innerhalb eines Tages.', author: 'Thomas B.', role: 'Geschäftsführer, Maschinenbau-KMU — Stuttgart, Deutschland' },
      { quote: 'Die KI-Klassifizierung hat mir die mühsame Recherche erspart. Einfach Produktbeschreibung eingeben und fertig.', author: 'Katharina W.', role: 'Markenmanagerin, Konsumgüter — München, Deutschland' },
      { quote: 'Für ein Unternehmen im USMCA-Raum ist der mexikanische Markenschutz unverzichtbar. Bestes Preis-Leistungs-Verhältnis.', author: 'Erik S.', role: 'Exportleiter, Pharmazeutika — Hamburg, Deutschland' },
    ],
    faqs: [
      { q: 'Können ausländische Unternehmen eine Marke in Mexiko anmelden?', a: 'Ja. Personen jeder Nationalität können Markenanmeldungen direkt beim IMPI einreichen.' },
      { q: 'Was kostet eine Markenanmeldung in Mexiko?', a: 'USD $299 pro Klasse (Servicegebühr USD $129 + IMPI-Gebühren USD $170).' },
      { q: 'Wie lange dauert die Eintragung?', a: '12 bis 24 Monate, abhängig von der Arbeitslast des IMPI.' },
      { q: 'Wie schnell wird meine Anmeldung eingereicht?', a: 'Innerhalb von 24 Geschäftsstunden nach Zahlungsbestätigung.' },
    ],
    finalH: 'Schützen Sie Ihre Marke in Mexiko jetzt',
    finalSub: 'Hunderte Unternehmen haben bereits mit uns angemeldet.',
    finalBtn: 'Jetzt Anmeldung starten',
    price: 'USD $299 pro Klasse',
  },
  fr: {
    bcp47: 'fr',
    ogLocale: 'fr_FR',
    ogImageAlt: 'Enregistrement de marque abordable au Mexique — MexicoTrademarkCenter',
    title: 'Enregistrement de Marque au Mexique | MexicoTrademarkCenter',
    desc: "Enregistrement de marque abordable au Mexique auprès de l'IMPI — à partir de USD $299 par classe, tous frais inclus. Dépôt en 24 heures ouvrées, sans frais cachés.",
    h1: 'Enregistrement de marque au Mexique — Dépôt IMPI en ligne',
    valueProp: 'La solution la plus abordable pour enregistrer votre marque au Mexique : classification par IA, tous frais inclus dès USD $299 par classe, dépôt en 24 heures ouvrées.',
    cta: 'Déposer ma marque maintenant',
    bodyH1: 'Pourquoi enregistrer une marque au Mexique ?',
    bodyP1: "Le Mexique est le 15e PIB mondial. L'enregistrement d'une marque auprès de l'IMPI confère un droit exclusif d'utilisation sur l'ensemble du territoire mexicain pour 10 ans renouvelables. Pour les exportateurs francophones, la marque IMPI est le fondement de la protection commerciale.",
    bodyH2: 'Pourquoi choisir MexicoTrademarkCenter ?',
    bullets: [
      "Classification par IA : décrivez vos produits en français et notre IA sélectionne la classe correcte parmi les 45 de la Classification de Nice.",
      "Tarif tout compris : USD $299 par classe couvre les honoraires et les taxes officielles de l'IMPI. Aucun frais caché.",
      "Dépôt en 24 heures ouvrées suivant la confirmation du paiement.",
      "Accusé de réception valable pour Amazon Brand Registry Mexique.",
    ],
    bodyH3: "Comment fonctionne la procédure IMPI ?",
    bodyP3: "Après le dépôt, l'IMPI procède à un examen formel. Si recevable, la marque est publiée pendant 30 jours ouvrables. Le délai total jusqu'au certificat est de 12 à 24 mois.",
    testimonials: [
      { quote: "Nous exportons des cosmétiques bio vers le Mexique. Le dépôt a été effectué en moins de 24 heures. Service impeccable.", author: 'Aminata D.', role: "Fondatrice, cosmétiques naturels — Abidjan, Côte d'Ivoire" },
      { quote: "En tant que PME française présente sur le marché nord-américain, la protection de notre marque au Mexique était indispensable.", author: 'Laurent P.', role: 'Directeur export, agroalimentaire — Lyon, France' },
      { quote: "L'outil de classification par IA m'a épargné des heures de recherche dans les classes de Nice.", author: 'Marie-Claire B.', role: 'Consultante en propriété intellectuelle — Montréal, Canada' },
    ],
    faqs: [
      { q: "Les entreprises étrangères peuvent-elles déposer une marque au Mexique ?", a: "Oui. Les personnes physiques et morales de toute nationalité peuvent déposer des demandes directement auprès de l'IMPI." },
      { q: "Quel est le coût d'enregistrement d'une marque au Mexique ?", a: "USD $299 par classe : honoraires (USD $129) + taxes IMPI (USD $170)." },
      { q: "Quel est le délai d'enregistrement ?", a: "12 à 24 mois selon la charge de travail de l'IMPI." },
      { q: "Dans quel délai ma demande est-elle déposée ?", a: "Dans les 24 heures ouvrées suivant la confirmation du paiement." },
    ],
    finalH: "Protégez votre marque au Mexique dès aujourd'hui",
    finalSub: "Des centaines d'entreprises ont déjà déposé avec nous.",
    finalBtn: 'Commencer ma demande',
    price: 'USD $299 par classe',
  },
  hi: {
    bcp47: 'hi',
    ogLocale: 'hi_IN',
    ogImageAlt: 'मेक्सिको में किफायती ट्रेडमार्क पंजीकरण — MexicoTrademarkCenter',
    title: 'मेक्सिको में ट्रेडमार्क पंजीकरण | MexicoTrademarkCenter',
    desc: 'मेक्सिको में किफायती ट्रेडमार्क पंजीकरण — USD $299 प्रति वर्ग, सभी शुल्क सहित। IMPI के साथ 24 व्यावसायिक घंटों में दाखिल। Amazon Brand Registry के लिए मान्य।',
    h1: 'मेक्सिको में ट्रेडमार्क पंजीकरण — IMPI ऑनलाइन',
    valueProp: 'भारतीय Amazon विक्रेताओं और निर्यातकों के लिए किफायती समाधान: AI-संचालित वर्गीकरण, USD $299 प्रति वर्ग सर्व-समावेशी, 24 घंटे में IMPI दाखिलगी।',
    cta: 'अभी आवेदन करें',
    bodyH1: 'मेक्सिको में ट्रेडमार्क पंजीकरण क्यों आवश्यक है?',
    bodyP1: 'मेक्सिको विश्व की 15वीं सबसे बड़ी अर्थव्यवस्था है। Amazon Global Selling के तहत मेक्सिको में व्यापार करने वाले भारतीय विक्रेताओं को Amazon Brand Registry के लिए IMPI पंजीकरण की आवश्यकता होती है। पंजीकृत ट्रेडमार्क 10 वर्षों के लिए वैध होता है।',
    bodyH2: 'MexicoTrademarkCenter क्यों चुनें?',
    bullets: [
      'AI-संचालित Nice वर्गीकरण: हिंदी में वर्णन करें और AI सही वर्ग स्वचालित रूप से चुनती है।',
      'सर्व-समावेशी मूल्य: USD $299 प्रति वर्ग में सेवा शुल्क और IMPI आधिकारिक शुल्क दोनों शामिल हैं।',
      '24 व्यावसायिक घंटों में दाखिलगी: भुगतान की पुष्टि के बाद।',
      'Amazon Brand Registry के लिए IMPI रसीद मान्य है।',
    ],
    bodyH3: 'IMPI प्रक्रिया की सरल व्याख्या',
    bodyP3: 'दाखिल होने के बाद IMPI औपचारिक जांच करता है। पंजीकरण प्रमाणपत्र प्राप्त होने में 12 से 24 महीने लगते हैं।',
    testimonials: [
      { quote: 'मैं Amazon Global Selling के तहत मेक्सिको में इलेक्ट्रॉनिक्स बेचता हूँ। MexicoTrademarkCenter ने एक सप्ताह में सब कुछ व्यवस्थित कर दिया।', author: 'राहुल एस.', role: 'Amazon विक्रेता, इलेक्ट्रॉनिक्स — मुंबई, भारत' },
      { quote: 'AI वर्गीकरण टूल बेहद उपयोगी है। उत्पाद विवरण डाला और सही Nice वर्ग तुरंत मिल गया।', author: 'प्रिया के.', role: 'ब्रांड मैनेजर, हस्तशिल्प — जयपुर, भारत' },
      { quote: 'मेक्सिको में ट्रेडमार्क दाखिल करने का यह सबसे किफायती और पारदर्शी तरीका है।', author: 'अनिल वी.', role: 'निर्यातक, कपड़ा — सूरत, भारत' },
    ],
    faqs: [
      { q: 'क्या भारतीय कंपनियाँ मेक्सिको में ट्रेडमार्क पंजीकरण करा सकती हैं?', a: 'हाँ। किसी भी राष्ट्रीयता के व्यक्ति और कंपनियाँ IMPI में सीधे आवेदन दाखिल कर सकती हैं।' },
      { q: 'मेक्सिको में ट्रेडमार्क पंजीकरण की लागत कितनी है?', a: 'USD $299 प्रति वर्ग: सेवा शुल्क USD $129 + IMPI आधिकारिक शुल्क USD $170।' },
      { q: 'क्या IMPI रसीद Amazon Brand Registry के लिए मान्य है?', a: 'हाँ। IMPI आधिकारिक रसीद Amazon Brand Registry Mexico के लिए स्वीकृत है।' },
      { q: 'पंजीकरण में कितना समय लगता है?', a: '12 से 24 महीने।' },
    ],
    finalH: 'आज ही मेक्सिको में अपने ब्रांड की सुरक्षा करें',
    finalSub: 'सैकड़ों व्यवसायों ने हमारे साथ आवेदन किया है।',
    finalBtn: 'आवेदन शुरू करें',
    price: 'USD $299 प्रति वर्ग',
  },
  ja: {
    bcp47: 'ja',
    ogLocale: 'ja_JP',
    ogImageAlt: 'メキシコ商標登録 低価格・全費用込み — MexicoTrademarkCenter',
    title: 'メキシコ商標登録 | MexicoTrademarkCenter',
    desc: 'メキシコ商標登録が低価格・全費用込みでUSD $299/区分から。IMPIにオンラインで申請、AIによる区分分類、24営業時間以内の提出。Amazon Brand Registryにも対応。',
    h1: 'メキシコ商標登録 — IMPI オンライン申請',
    valueProp: '日本企業・ブランドのための低コストなメキシコ商標登録：AIによる区分分類、全費用込みUSD $299/区分、24営業時間以内のIMPI申請提出。',
    cta: '今すぐ商標登録を申請する',
    bodyH1: 'なぜメキシコで商標登録が必要なのか？',
    bodyP1: 'メキシコは世界第15位の経済大国であり、USMCA（米国・メキシコ・カナダ協定）の一員として北米市場への重要な入口です。IMPI（メキシコ工業所有権庁）への商標登録により、メキシコ全土での独占使用権を10年間（更新可能）取得できます。',
    bodyH2: 'MexicoTrademarkCenterを選ぶ理由',
    bullets: [
      'AIによるニース分類：日本語で説明するだけで、AIが45の国際分類から正しい区分を自動選択。',
      '全費用込み価格：1区分USD $299でサービス料とIMPI公式登録費用がすべて含まれます。',
      '24営業時間以内の申請提出：支払い確認後。',
      'Amazon Brand Registry対応：申請時発行のIMPI受理書を使用可。',
    ],
    bodyH3: 'IMPI申請手続きの流れ',
    bodyP3: '申請書が提出されると、IMPIは形式審査を実施。商標は30営業日間公告されます。登録証書の取得までには12〜24ヶ月かかります。',
    testimonials: [
      { quote: 'Amazon MexicoでBrand Registry申請のためにIMPI受理書が必要でした。1週間以内に対応してくれました。', author: '田中 H.', role: 'Amazonセラー、家電ブランド — 東京、日本' },
      { quote: 'メキシコでのライセンス展開に備えて商標を登録。AI区分分類ツールのおかげでニース分類の手間が省けました。', author: '鈴木 A.', role: 'ライセンス担当、消費財メーカー — 大阪、日本' },
      { quote: '全費用込みのUSD $299という価格は非常に透明で、代理人を使った場合の数分の1のコストです。', author: '山本 K.', role: 'IP担当マネージャー、化粧品会社 — 名古屋、日本' },
    ],
    faqs: [
      { q: '日本企業や個人はメキシコで商標登録できますか？', a: 'はい。いかなる国籍の個人・法人もIMPIに直接出願できます。' },
      { q: 'メキシコ商標登録の費用はいくらですか？', a: '1区分あたりUSD $299（全費用込み）：サービス料USD $129 + IMPI公式登録費USD $170。' },
      { q: 'IMPI受理書はAmazon Brand Registryに使えますか？', a: 'はい。申請時に発行するIMPI公式受理書は、Amazon Brand Registry Mexicoの有効化に使用可能です。' },
      { q: '登録証書の取得までどのくらいかかりますか？', a: '12〜24ヶ月です。' },
    ],
    finalH: 'メキシコでのブランドを今すぐ守る',
    finalSub: '数百社がすでに私たちと一緒に商標登録を完了しました。',
    finalBtn: '申請を開始する',
    price: 'USD $299 /区分',
  },
};

// Full hreflang block — same on every language page
const HREFLANG = `
    <link rel="alternate" hreflang="es" href="${BASE_URL}/es/" />
    <link rel="alternate" hreflang="en" href="${BASE_URL}/en/" />
    <link rel="alternate" hreflang="zh-Hans" href="${BASE_URL}/zh/" />
    <link rel="alternate" hreflang="pt" href="${BASE_URL}/pt/" />
    <link rel="alternate" hreflang="de" href="${BASE_URL}/de/" />
    <link rel="alternate" hreflang="fr" href="${BASE_URL}/fr/" />
    <link rel="alternate" hreflang="hi" href="${BASE_URL}/hi/" />
    <link rel="alternate" hreflang="ja" href="${BASE_URL}/ja/" />
    <link rel="alternate" hreflang="x-default" href="${BASE_URL}/" />`;

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderPage(lang, p) {
  const bullets = p.bullets.map(b => `<li>${esc(b)}</li>`).join('\n            ');
  const testimonials = p.testimonials.map(t => `
          <div class="testimonial-card">
            <p class="testimonial-quote">&ldquo;${esc(t.quote)}&rdquo;</p>
            <p class="testimonial-author"><strong>${esc(t.author)}</strong></p>
            <p class="testimonial-role">${esc(t.role)}</p>
          </div>`).join('');
  const faqs = p.faqs.map(f => `
          <div class="faq-item">
            <h3 class="faq-q">${esc(f.q)}</h3>
            <p class="faq-a">${esc(f.a)}</p>
          </div>`).join('');

  return `
    <div id="prerender-content" style="font-family:sans-serif;max-width:900px;margin:0 auto;padding:24px 16px">
      <h1>${esc(p.h1)}</h1>
      <p>${esc(p.valueProp)}</p>
      <p><strong>${esc(p.price)}</strong></p>
      <a href="/apply">${esc(p.cta)}</a>

      <h2>${esc(p.bodyH1)}</h2>
      <p>${esc(p.bodyP1)}</p>

      <h2>${esc(p.bodyH2)}</h2>
      <ul>${bullets}</ul>

      <h2>${esc(p.bodyH3)}</h2>
      <p>${esc(p.bodyP3)}</p>

      <section>
        ${testimonials}
      </section>

      <section>
        ${faqs}
      </section>

      <h2>${esc(p.finalH)}</h2>
      <p>${esc(p.finalSub)}</p>
      <a href="/apply">${esc(p.finalBtn)}</a>
    </div>`;
}

const ORGANIZATION_SCHEMA = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'MexicoTrademarkCenter',
  url: BASE_URL,
  logo: `${BASE_URL}/favicon.svg`,
  description: 'Mexico trademark registration service filing with IMPI for international businesses. All-inclusive price of $299 USD per class, filed within 24 business hours. Available in 8 languages.',
  foundingLocation: { '@type': 'Place', name: 'Mexico' },
  serviceArea: { '@type': 'AdministrativeArea', name: 'Mexico' },
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
  provider: { '@type': 'Organization', name: 'MexicoTrademarkCenter', url: BASE_URL },
  serviceType: 'Trademark Registration',
  description: 'All-inclusive Mexico trademark filing service with IMPI. Includes AI-powered availability search, Nice classification, government fees, and filing certificate — all for $299 USD per class.',
  areaServed: { '@type': 'Country', name: 'Mexico' },
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

const HOMEPAGE_FAQS = [
  { q: 'Can foreign companies or individuals file a trademark in Mexico?', a: 'Yes. Foreign individuals and companies of any nationality can file trademark applications directly before IMPI without needing a Mexican subsidiary or local company.' },
  { q: 'Do I need a Mexican company to file?', a: 'No. You do not need a Mexican company to file a trademark in Mexico. Foreign individuals and companies can apply directly.' },
  { q: 'Can I submit information in my own language?', a: 'You can submit information in your own language or in English. We translate the application into Spanish, which is required for IMPI filing.' },
  { q: 'What if my logo contains non-Latin characters or script?', a: 'Logos with non-Latin scripts (Arabic, Cyrillic, Devanagari, Chinese, etc.) can be filed in Mexico. We provide a transliteration and Spanish description of the mark for the IMPI application.' },
  { q: 'What are government fees?', a: 'IMPI charges official government fees per class filed. These are included in our total price. Current fees are USD $170 per class. Our prices already include all applicable taxes.' },
  { q: 'Is classification automatic?', a: 'We provide a keyword-based classification suggestion based on your goods/services description. All suggested classifications are reviewed by our team before filing.' },
  { q: 'Is filing guaranteed within 24 business hours?', a: 'We target filing within 24 business hours after receiving complete information and confirmed payment. Delays may occur if information is incomplete or payment is pending.' },
  { q: 'Does this guarantee trademark registration?', a: 'No. Filing an application does not guarantee registration. IMPI examines all applications and may issue office actions or refuse registration.' },
  { q: 'What happens if IMPI issues an office action?', a: 'Office action responses are not included in the base filing service. If IMPI issues an office action, we will notify you and can provide a separate quote for the response.' },
  { q: 'How long does registration take?', a: 'Mexican trademark registration typically takes 12 to 24 months, depending on the backlog at IMPI and whether office actions are issued.' },
  { q: 'Can I file multiple trademarks at once?', a: 'Yes. You can file multiple trademarks and multiple classes in a single order. Volume pricing applies automatically based on the total number of classes filed.' },
  { q: 'What is the difference between a Filing Certificate and a Registration Certificate?', a: 'The Filing Certificate (Constancia de Presentación) is issued by IMPI immediately upon submission and establishes your official filing date. The Registration Certificate (Título de Registro de Marca) is issued after IMPI completes examination and approves your mark — typically 12 to 24 months later.' },
  { q: 'What is an IMPI anticipation (anterioridad)?', a: 'An anterioridad is a prior trademark on the IMPI register that is identical or confusingly similar to your mark. If found during examination, IMPI issues an office action citing it as a barrier to registration.' },
  { q: 'What is a trademark opposition?', a: 'After IMPI approves your application, it is published in the Official Gazette (Diario Oficial de la Federación) for a mandatory opposition period — typically 30 business days — during which third parties can file a formal opposition.' },
];

function buildFaqSchema(faqs) {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(f => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  });
}

function buildPage(lang, p, shellHtml) {
  let html = shellHtml;

  // 1. Set <html lang="...">
  html = html.replace(/<html([^>]*)lang="[^"]*"/, `<html$1lang="${p.bcp47}"`);

  // 2. Replace <title>
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${esc(p.title)}</title>`);

  // 3. Replace meta description
  html = html.replace(
    /(<meta\s+name="description"\s+content=")[^"]*(")/,
    `$1${p.desc.replace(/"/g, '&quot;')}$2`
  );

  // 4. Replace og:title and og:description
  html = html.replace(
    /(<meta\s+property="og:title"\s+content=")[^"]*(")/,
    `$1${esc(p.title)}$2`
  );
  html = html.replace(
    /(<meta\s+property="og:description"\s+content=")[^"]*(")/,
    `$1${p.desc.replace(/"/g, '&quot;')}$2`
  );

  // 5. Replace og:url to point to language-specific URL
  const pageUrl = `${BASE_URL}/${lang}/`;
  html = html.replace(
    /(<meta\s+property="og:url"\s+content=")[^"]*(")/,
    `$1${pageUrl}$2`
  );

  // 5a. Inject or replace og:locale
  const ogLocaleTag = `<meta property="og:locale" content="${p.ogLocale}" />`;
  if (html.includes('property="og:locale"')) {
    html = html.replace(/(<meta\s+property="og:locale"\s+content=")[^"]*(")/,
      `$1${p.ogLocale}$2`);
  } else {
    html = html.replace('property="og:url"', `property="og:url"`); // no-op anchor
    html = html.replace(/(<meta\s+property="og:url"[^>]*>)/, `$1\n    ${ogLocaleTag}`);
  }

  // 5b. Inject or replace og:image:alt
  const ogImageAltEsc = p.ogImageAlt.replace(/"/g, '&quot;');
  if (html.includes('property="og:image:alt"')) {
    html = html.replace(/(<meta\s+property="og:image:alt"\s+content=")[^"]*(")/,
      `$1${ogImageAltEsc}$2`);
  } else {
    html = html.replace(
      /(<meta\s+property="og:image:height"[^>]*>)/,
      `$1\n    <meta property="og:image:alt" content="${ogImageAltEsc}" />`
    );
  }

  // 5c. Inject or replace twitter:image:alt
  const twitterImageAltEsc = p.ogImageAlt.replace(/"/g, '&quot;');
  if (html.includes('name="twitter:image:alt"')) {
    html = html.replace(/(<meta\s+name="twitter:image:alt"\s+content=")[^"]*(")/,
      `$1${twitterImageAltEsc}$2`);
  } else {
    html = html.replace(
      /(<meta\s+name="twitter:image"[^>]*>)/,
      `$1\n    <meta name="twitter:image:alt" content="${twitterImageAltEsc}" />`
    );
  }

  // 6. Replace twitter:title and twitter:description
  html = html.replace(
    /(<meta\s+name="twitter:title"\s+content=")[^"]*(")/,
    `$1${esc(p.title)}$2`
  );
  html = html.replace(
    /(<meta\s+name="twitter:description"\s+content=")[^"]*(")/,
    `$1${p.desc.replace(/"/g, '&quot;')}$2`
  );

  // 7. Inject hreflang block before </head>
  // Remove any existing hreflang links first to avoid duplicates
  html = html.replace(/<link[^>]+hreflang[^>]+>\s*/g, '');
  html = html.replace('</head>', `${HREFLANG}\n  </head>`);

  // 8. Inject the canonical link for this language page before </head>
  html = html.replace('</head>', `    <link rel="canonical" href="${pageUrl}" />\n  </head>`);

  // 9. Inject JSON-LD structured data before </head>
  const faqSchema = buildFaqSchema(HOMEPAGE_FAQS);
  const jsonLdBlock = [
    `    <script type="application/ld+json">${ORGANIZATION_SCHEMA}</script>`,
    `    <script type="application/ld+json">${OFFER_SCHEMA}</script>`,
    `    <script type="application/ld+json">${faqSchema}</script>`,
  ].join('\n');
  html = html.replace('</head>', `${jsonLdBlock}\n  </head>`);

  // 10. Inject pre-rendered body content into #root
  const preRendered = renderPage(lang, p);
  html = html.replace(
    '<div id="root"></div>',
    `<div id="root">${preRendered}</div>`
  );

  return html;
}

// ---------- Main ----------

const shellPath = path.join(DIST, 'index.html');
if (!fs.existsSync(shellPath)) {
  console.error('ERROR: dist/index.html not found. Run `npm run build` first.');
  process.exit(1);
}

const shell = fs.readFileSync(shellPath, 'utf-8');

let successCount = 0;
for (const [lang, pageData] of Object.entries(PAGES)) {
  const outDir = path.join(DIST, lang);
  fs.mkdirSync(outDir, { recursive: true });

  const html = buildPage(lang, pageData, shell);
  const outPath = path.join(outDir, 'index.html');
  fs.writeFileSync(outPath, html, 'utf-8');

  // Quick smoke-test: verify h1 and title are in the output
  const h1Present = html.includes(pageData.h1);
  const titlePresent = html.includes(pageData.title);
  const hreflangPresent = html.includes('hreflang="es"');
  const status = h1Present && titlePresent && hreflangPresent ? '✓' : '✗';
  console.log(`${status}  dist/${lang}/index.html  [title: ${titlePresent ? 'ok' : 'MISSING'}] [h1: ${h1Present ? 'ok' : 'MISSING'}] [hreflang: ${hreflangPresent ? 'ok' : 'MISSING'}]`);
  if (h1Present && titlePresent && hreflangPresent) successCount++;
}

console.log(`\nPre-rendered ${successCount}/${Object.keys(PAGES).length} pages successfully.`);
if (successCount < Object.keys(PAGES).length) process.exit(1);

// ── Inject JSON-LD into root dist/index.html ──────────────────────────────
// The "/" route (HomePage) renders schemas via react-helmet at runtime, but
// crawlers need them in the static shell before JS executes.
{
  const faqSchema = buildFaqSchema(HOMEPAGE_FAQS);
  const jsonLdBlock = [
    `    <script type="application/ld+json">${ORGANIZATION_SCHEMA}</script>`,
    `    <script type="application/ld+json">${OFFER_SCHEMA}</script>`,
    `    <script type="application/ld+json">${faqSchema}</script>`,
  ].join('\n');
  let rootHtml = fs.readFileSync(shellPath, 'utf-8');
  if (!rootHtml.includes('application/ld+json')) {
    rootHtml = rootHtml.replace('</head>', `${jsonLdBlock}\n  </head>`);
    fs.writeFileSync(shellPath, rootHtml, 'utf-8');
    console.log('✓  dist/index.html  [json-ld: injected]');
  } else {
    console.log('✓  dist/index.html  [json-ld: already present]');
  }
}
