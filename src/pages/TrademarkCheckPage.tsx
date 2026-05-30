import { useState, useRef, useEffect, lazy, Suspense } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ArrowRight, ArrowLeft, Sparkles, CheckCircle2, FileText, HelpCircle, Loader2, Plus, X, Tag, ChevronDown, Send, CreditCard as Edit2, AlertTriangle, ChevronRight, Upload, Image as ImageIcon, Type } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const TrademarkClearancePanel = lazy(() => import('../components/TrademarkClearancePanel'));

type Lang = 'en' | 'zh' | 'es' | 'de' | 'fr' | 'hi' | 'pt' | 'ja';

// All 45 Nice Classification classes
const ALL_NICE_CLASSES: { num: number; title: string; titleEs: string; category: 'goods' | 'services' }[] = [
  { num: 1,  title: 'Chemicals',                       titleEs: 'Productos Químicos',           category: 'goods' },
  { num: 2,  title: 'Paints & Varnishes',               titleEs: 'Pinturas y Barnices',          category: 'goods' },
  { num: 3,  title: 'Cosmetics & Cleaning',             titleEs: 'Cosméticos y Limpieza',        category: 'goods' },
  { num: 4,  title: 'Lubricants & Fuels',               titleEs: 'Lubricantes y Combustibles',   category: 'goods' },
  { num: 5,  title: 'Pharmaceuticals',                  titleEs: 'Productos Farmacéuticos',      category: 'goods' },
  { num: 6,  title: 'Metals & Hardware',                titleEs: 'Metales y Ferretería',         category: 'goods' },
  { num: 7,  title: 'Machinery',                        titleEs: 'Maquinaria',                   category: 'goods' },
  { num: 8,  title: 'Hand Tools',                       titleEs: 'Herramientas Manuales',        category: 'goods' },
  { num: 9,  title: 'Electronics & Technology',         titleEs: 'Electrónica y Tecnología',     category: 'goods' },
  { num: 10, title: 'Medical Devices',                  titleEs: 'Dispositivos Médicos',         category: 'goods' },
  { num: 11, title: 'Lighting & Appliances',            titleEs: 'Iluminación y Aparatos',       category: 'goods' },
  { num: 12, title: 'Vehicles & Transport',             titleEs: 'Vehículos y Transporte',       category: 'goods' },
  { num: 13, title: 'Firearms & Fireworks',             titleEs: 'Armas y Pirotecnia',           category: 'goods' },
  { num: 14, title: 'Jewelry & Watches',                titleEs: 'Joyería y Relojes',            category: 'goods' },
  { num: 15, title: 'Musical Instruments',              titleEs: 'Instrumentos Musicales',       category: 'goods' },
  { num: 16, title: 'Paper & Print',                    titleEs: 'Papel e Impresos',             category: 'goods' },
  { num: 17, title: 'Rubber & Plastics',                titleEs: 'Goma y Plásticos',             category: 'goods' },
  { num: 18, title: 'Leather Goods & Bags',             titleEs: 'Artículos de Piel y Bolsos',   category: 'goods' },
  { num: 19, title: 'Building Materials',               titleEs: 'Materiales de Construcción',   category: 'goods' },
  { num: 20, title: 'Furniture',                        titleEs: 'Mobiliario',                   category: 'goods' },
  { num: 21, title: 'Kitchenware & Household',          titleEs: 'Utensilios de Cocina y Hogar', category: 'goods' },
  { num: 22, title: 'Ropes, Tents & Textiles',          titleEs: 'Cuerdas, Tiendas y Textiles',  category: 'goods' },
  { num: 23, title: 'Yarn & Thread',                    titleEs: 'Hilos y Fibras',               category: 'goods' },
  { num: 24, title: 'Fabrics & Textiles',               titleEs: 'Telas y Tejidos',              category: 'goods' },
  { num: 25, title: 'Clothing & Footwear',              titleEs: 'Ropa y Calzado',               category: 'goods' },
  { num: 26, title: 'Lace, Embroidery & Buttons',       titleEs: 'Encajes, Bordados y Botones',  category: 'goods' },
  { num: 27, title: 'Carpets & Floor Coverings',        titleEs: 'Alfombras y Suelos',           category: 'goods' },
  { num: 28, title: 'Games, Toys & Sports',             titleEs: 'Juegos, Juguetes y Deportes',  category: 'goods' },
  { num: 29, title: 'Meat, Fish & Dairy',               titleEs: 'Carnes, Pescados y Lácteos',   category: 'goods' },
  { num: 30, title: 'Coffee, Flour & Baked Goods',      titleEs: 'Café, Harinas y Panadería',    category: 'goods' },
  { num: 31, title: 'Agriculture & Live Animals',       titleEs: 'Agricultura y Animales Vivos', category: 'goods' },
  { num: 32, title: 'Beer, Soft Drinks & Juice',        titleEs: 'Cervezas y Bebidas',           category: 'goods' },
  { num: 33, title: 'Wines & Spirits',                  titleEs: 'Vinos y Bebidas Espirituosas', category: 'goods' },
  { num: 34, title: 'Tobacco & Smoking',                titleEs: 'Tabaco',                       category: 'goods' },
  { num: 35, title: 'Advertising & Business',           titleEs: 'Publicidad y Negocios',        category: 'services' },
  { num: 36, title: 'Insurance & Finance',              titleEs: 'Seguros y Finanzas',           category: 'services' },
  { num: 37, title: 'Construction & Repair',            titleEs: 'Construcción y Reparación',    category: 'services' },
  { num: 38, title: 'Telecommunications',               titleEs: 'Telecomunicaciones',           category: 'services' },
  { num: 39, title: 'Transport & Travel',               titleEs: 'Transporte y Viajes',          category: 'services' },
  { num: 40, title: 'Material Treatment',               titleEs: 'Tratamiento de Materiales',    category: 'services' },
  { num: 41, title: 'Education & Entertainment',        titleEs: 'Educación y Entretenimiento',  category: 'services' },
  { num: 42, title: 'Science & Technology',             titleEs: 'Ciencia y Tecnología',         category: 'services' },
  { num: 43, title: 'Food & Drink Services',            titleEs: 'Servicios de Alimentos',       category: 'services' },
  { num: 44, title: 'Medical & Beauty Services',        titleEs: 'Servicios Médicos y Estéticos',category: 'services' },
  { num: 45, title: 'Legal & Security Services',        titleEs: 'Servicios Legales y Seguridad',category: 'services' },
];

interface SuggestedClass {
  classNumber: number;
  titleEn: string;
  titleLocalized: string;
  confidence: number;
  reasoning?: string;
  descriptionEn?: string;
  descriptionEs?: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

type WizardStep = 1 | 2 | 3 | 4 | 5;

// ─── Translations ─────────────────────────────────────────────────────────────

const copy: Record<string, Partial<Record<Lang, string>>> = {
  backLabel: {
    en: 'Back',
    zh: '返回',
    es: 'Volver',
    de: 'Zurück',
    fr: 'Retour',
    hi: 'वापस',
    pt: 'Voltar',
    ja: '戻る',
  },
  pageTitle: {
    en: 'Free Trademark Clearance Search',
    zh: '免费商标预检索',
    es: 'Búsqueda de Disponibilidad de Marca Gratuita',
    de: 'Kostenlose Markenrecherche',
    fr: 'Recherche de disponibilité de marque gratuite',
    hi: 'मुफ़्त ट्रेडमार्क क्लीयरेंस खोज',
    pt: 'Pesquisa Gratuita de Disponibilidade de Marca',
    ja: '無料商標調査',
  },
  pageSubtitle: {
    en: 'Follow the four steps below to get a structured clearance analysis powered by AI and the official IMPI MARCia database.',
    zh: '按照以下四个步骤，获取由AI和官方IMPI MARCia数据库支持的结构化检索分析。',
    es: 'Sigue los cuatro pasos a continuación para obtener un análisis de disponibilidad estructurado, impulsado por IA y la base de datos oficial IMPI MARCia.',
    de: 'Folgen Sie den vier Schritten unten, um eine strukturierte Rechercheanalyse zu erhalten, die von KI und der offiziellen IMPI MARCia-Datenbank unterstützt wird.',
    fr: "Suivez les quatre étapes ci-dessous pour obtenir une analyse de disponibilité structurée, propulsée par l'IA et la base officielle IMPI MARCia.",
    hi: 'AI और आधिकारिक IMPI MARCia डेटाबेस द्वारा समर्थित संरचित क्लीयरेंस विश्लेषण प्राप्त करने के लिए नीचे दिए गए चार चरणों का पालन करें।',
    pt: 'Siga os quatro passos abaixo para obter uma análise de disponibilidade estruturada, desenvolvida por IA e pela base oficial IMPI MARCia.',
    ja: 'AIとIMPI MARCia公式データベースを活用した体系的な調査分析を得るために、以下の4つのステップに従ってください。',
  },
  step1Title: {
    en: 'Trademark Name',
    zh: '商标名称',
    es: 'Nombre de la Marca',
    de: 'Markenname',
    fr: 'Nom de la marque',
    hi: 'ट्रेडमार्क नाम',
    pt: 'Nome da Marca',
    ja: '商標名',
  },
  step1Subtitle: {
    en: 'What is the trademark you want to register?',
    zh: '您想注册什么商标？',
    es: '¿Cuál es la marca que deseas registrar?',
    de: 'Welche Marke möchten Sie registrieren?',
    fr: 'Quelle est la marque que vous souhaitez enregistrer ?',
    hi: 'आप कौन सा ट्रेडमार्क पंजीकृत करना चाहते हैं?',
    pt: 'Qual é a marca que você deseja registrar?',
    ja: '登録したい商標は何ですか？',
  },
  step2Title: {
    en: 'Goods & Services',
    zh: '商品与服务',
    es: 'Productos y Servicios',
    de: 'Waren & Dienstleistungen',
    fr: 'Produits et services',
    hi: 'माल और सेवाएं',
    pt: 'Produtos e Serviços',
    ja: '商品・サービス',
  },
  step2Subtitle: {
    en: 'What goods or services will this trademark cover?',
    zh: '此商标将涵盖哪些商品或服务？',
    es: '¿Qué productos o servicios cubrirá esta marca?',
    de: 'Welche Waren oder Dienstleistungen soll diese Marke abdecken?',
    fr: 'Quels produits ou services cette marque couvrira-t-elle ?',
    hi: 'यह ट्रेडमार्क किन माल या सेवाओं को कवर करेगा?',
    pt: 'Quais produtos ou serviços esta marca vai cobrir?',
    ja: 'この商標はどの商品・サービスをカバーしますか？',
  },
  step3Title: {
    en: 'Confirm Classification',
    zh: '确认分类',
    es: 'Confirmar Clasificación',
    de: 'Klassifikation bestätigen',
    fr: 'Confirmer la classification',
    hi: 'वर्गीकरण की पुष्टि करें',
    pt: 'Confirmar Classificação',
    ja: '分類を確認',
  },
  step3Subtitle: {
    en: 'Review and agree on the applicable Nice Classification classes.',
    zh: '审阅并同意适用的尼斯分类类别。',
    es: 'Revisa y acepta las clases de Clasificación de Niza aplicables.',
    de: 'Überprüfen und bestätigen Sie die anwendbaren Nizza-Klassifikationsklassen.',
    fr: "Examinez et acceptez les classes de classification de Nice applicables.",
    hi: 'लागू नाइस वर्गीकरण कक्षाओं की समीक्षा करें और सहमति दें।',
    pt: 'Revise e concorde com as classes da Classificação de Nice aplicáveis.',
    ja: '適用されるニース分類クラスを確認して同意してください。',
  },
  step4Title: {
    en: 'Clearance Analysis',
    zh: '检索分析',
    es: 'Análisis de Disponibilidad',
    de: 'Rechercheanalyse',
    fr: 'Analyse de disponibilité',
    hi: 'क्लीयरेंस विश्लेषण',
    pt: 'Análise de Disponibilidade',
    ja: '調査分析',
  },
  step4Subtitle: {
    en: 'AI-powered search and analysis.',
    zh: 'AI驱动的IMPI MARCia数据库检索。',
    es: 'Búsqueda impulsada por IA contra la base de datos IMPI MARCia.',
    de: 'KI-gestützte Suche in der IMPI MARCia-Datenbank.',
    fr: "Recherche propulsée par l'IA dans la base IMPI MARCia.",
    hi: 'IMPI MARCia डेटाबेस के विरुद्ध AI-संचालित खोज।',
    pt: 'Busca com IA na base de dados IMPI MARCia.',
    ja: 'IMPIMARCiaデータベースに対するAI検索。',
  },
  step5Title: {
    en: 'File Your Trademark',
    zh: '提交商标申请',
    es: 'Registra tu Marca',
    de: 'Marke Anmelden',
    fr: 'Déposer la Marque',
    hi: 'ट्रेडमार्क दर्ज करें',
    pt: 'Registrar a Marca',
    ja: '商標を出願する',
  },
  trademarkLabel: {
    en: 'Proposed trademark name',
    zh: '拟注册商标名称',
    es: 'Nombre de marca propuesto',
    de: 'Vorgeschlagener Markenname',
    fr: 'Nom de marque proposé',
    hi: 'प्रस्तावित ट्रेडमार्क नाम',
    pt: 'Nome de marca proposto',
    ja: '商標名（案）',
  },
  trademarkPlaceholder: {
    en: 'e.g. Nexora, BluePeak, AeroFit…',
    zh: '例如：Nexora、BluePeak、AeroFit…',
    es: 'ej. Nexora, BluePeak, AeroFit…',
    de: 'z. B. Nexora, BluePeak, AeroFit…',
    fr: 'ex. Nexora, BluePeak, AeroFit…',
    hi: 'उदा. Nexora, BluePeak, AeroFit…',
    pt: 'ex. Nexora, BluePeak, AeroFit…',
    ja: '例: Nexora、BluePeak、AeroFit…',
  },
  trademarkTooltip: {
    en: 'The word, phrase, or combination of letters you want to register as a trademark in Mexico.',
    zh: '您希望在墨西哥注册为商标的单词、短语或字母组合。',
    es: 'La palabra, frase o combinación de letras que deseas registrar como marca en México.',
    de: 'Das Wort, der Satz oder die Buchstabenkombination, die Sie als Marke in Mexiko registrieren möchten.',
    fr: 'Le mot, la phrase ou la combinaison de lettres que vous souhaitez enregistrer comme marque au Mexique.',
    hi: 'वह शब्द, वाक्यांश या अक्षरों का संयोजन जिसे आप मेक्सिको में ट्रेडमार्क के रूप में पंजीकृत करना चाहते हैं।',
    pt: 'A palavra, frase ou combinação de letras que você deseja registrar como marca no México.',
    ja: 'メキシコで商標として登録したい単語、フレーズ、または文字の組み合わせ。',
  },
  goodsLabel: {
    en: 'Describe your goods or services',
    zh: '描述您的商品或服务',
    es: 'Describe tus productos o servicios',
    de: 'Beschreiben Sie Ihre Waren oder Dienstleistungen',
    fr: 'Décrivez vos produits ou services',
    hi: 'अपने माल या सेवाओं का वर्णन करें',
    pt: 'Descreva seus produtos ou serviços',
    ja: '商品またはサービスを説明してください',
  },
  goodsPlaceholder: {
    en: 'e.g. athletic footwear, sports apparel, and fitness accessories…',
    zh: '例如：运动鞋、运动服装及健身配件…',
    es: 'ej. calzado deportivo, ropa deportiva y accesorios de fitness…',
    de: 'z. B. Sportschuhe, Sportbekleidung und Fitnessaccessoires…',
    fr: 'ex. chaussures de sport, vêtements de sport et accessoires de fitness…',
    hi: 'उदा. खेल जूते, खेल परिधान और फिटनेस एक्सेसरीज़…',
    pt: 'ex. calçados esportivos, roupas esportivas e acessórios de fitness…',
    ja: '例: スポーツシューズ、スポーツウェア、フィットネス用品…',
  },
  goodsTooltip: {
    en: 'Describe the products or services your trademark will be used with. The AI will classify them into the applicable Nice Classification classes and may ask clarifying questions.',
    zh: '描述您的商标将用于的商品或服务。AI将把它们分类到适用的尼斯分类类别中，并可能提出澄清问题。',
    es: 'Describe los productos o servicios con los que se usará tu marca. La IA los clasificará en las clases de Clasificación de Niza aplicables y puede hacer preguntas aclaratorias.',
    de: 'Beschreiben Sie die Waren oder Dienstleistungen, mit denen Ihre Marke verwendet wird. Die KI klassifiziert diese in die anwendbaren Nizza-Klassifikationsklassen und kann Klärungsfragen stellen.',
    fr: 'Décrivez les produits ou services avec lesquels votre marque sera utilisée. L\'IA les classifiera dans les classes de classification de Nice applicables et peut poser des questions de clarification.',
    hi: 'उन वस्तुओं या सेवाओं का वर्णन करें जिनके साथ आपका ट्रेडमार्क उपयोग किया जाएगा। AI उन्हें लागू नाइस वर्गीकरण कक्षाओं में वर्गीकृत करेगा और स्पष्टीकरण प्रश्न पूछ सकता है।',
    pt: 'Descreva os produtos ou serviços com os quais sua marca será usada. A IA os classificará nas classes aplicáveis da Classificação de Nice e pode fazer perguntas de esclarecimento.',
    ja: '商標が使用される商品またはサービスを説明してください。AIが適用されるニース分類クラスに分類し、確認の質問をする場合があります。',
  },
  classifyBtn: {
    en: 'Classify with AI',
    zh: '用AI分类',
    es: 'Clasificar con IA',
    de: 'Mit KI klassifizieren',
    fr: "Classifier avec l'IA",
    hi: 'AI से वर्गीकृत करें',
    pt: 'Classificar com IA',
    ja: 'AIで分類する',
  },
  classifyingLabel: {
    en: 'Classifying…',
    zh: '分类中…',
    es: 'Clasificando…',
    de: 'Klassifizierung…',
    fr: 'Classification…',
    hi: 'वर्गीकृत हो रहा है…',
    pt: 'Classificando…',
    ja: '分類中…',
  },
  aiQuestionsLabel: {
    en: 'We have some questions to better pinpoint the applicable classes:',
    zh: '我们有一些问题以更精确地确定适用类别：',
    es: 'Tenemos algunas preguntas para precisar mejor las clases aplicables:',
    de: 'Wir haben einige Fragen, um die anwendbaren Klassen besser zu bestimmen:',
    fr: 'Nous avons quelques questions pour mieux cibler les classes applicables :',
    hi: 'हमारे पास लागू कक्षाओं को बेहतर ढंग से निर्धारित करने के लिए कुछ प्रश्न हैं:',
    pt: 'Temos algumas perguntas para identificar melhor as classes aplicáveis:',
    ja: '適用されるクラスをより正確に特定するためにいくつか質問があります:',
  },
  replyPlaceholder: {
    en: 'Your answer…',
    zh: '您的回答…',
    es: 'Tu respuesta…',
    de: 'Ihre Antwort…',
    fr: 'Votre réponse…',
    hi: 'आपका उत्तर…',
    pt: 'Sua resposta…',
    ja: '回答…',
  },
  sendReply: {
    en: 'Send',
    zh: '发送',
    es: 'Enviar',
    de: 'Senden',
    fr: 'Envoyer',
    hi: 'भेजें',
    pt: 'Enviar',
    ja: '送信',
  },
  skipManual: {
    en: 'Skip — select classes manually',
    zh: '跳过 — 手动选择类别',
    es: 'Omitir — seleccionar clases manualmente',
    de: 'Überspringen — Klassen manuell auswählen',
    fr: 'Ignorer — sélectionner les classes manuellement',
    hi: 'छोड़ें — कक्षाएं मैन्युअल रूप से चुनें',
    pt: 'Pular — selecionar classes manualmente',
    ja: 'スキップ — クラスを手動で選択',
  },
  aiConcludes: {
    en: 'AI recommends the following Nice Classification classes for',
    zh: 'AI为以下商标推荐以下尼斯分类类别：',
    es: 'La IA recomienda las siguientes clases de Clasificación de Niza para',
    de: 'Die KI empfiehlt die folgenden Nizza-Klassifikationsklassen für',
    fr: 'L\'IA recommande les classes de classification de Nice suivantes pour',
    hi: 'AI निम्नलिखित ट्रेडमार्क के लिए निम्नलिखित नाइस वर्गीकरण कक्षाएं सुझाता है:',
    pt: 'A IA recomenda as seguintes classes da Classificação de Nice para',
    ja: 'AIが推奨するニース分類クラス:',
  },
  impiDescription: {
    en: 'IMPI Description (Spanish)',
    zh: 'IMPI说明（西班牙语）',
    es: 'Descripción IMPI (Español)',
    de: 'IMPI-Beschreibung (Spanisch)',
    fr: 'Description IMPI (Espagnol)',
    hi: 'IMPI विवरण (स्पेनिश)',
    pt: 'Descrição IMPI (Espanhol)',
    ja: 'IMPI説明（スペイン語）',
  },
  agreeAndRun: {
    en: 'Agree & Run Clearance Analysis',
    zh: '同意并开始检索分析',
    es: 'Aceptar y Ejecutar Análisis de Disponibilidad',
    de: 'Zustimmen & Rechercheanalyse starten',
    fr: "Accepter et lancer l'analyse de disponibilité",
    hi: 'सहमत हों और क्लीयरेंस विश्लेषण चलाएं',
    pt: 'Concordar e Executar Análise de Disponibilidade',
    ja: '同意して調査分析を実行',
  },
  addClass: {
    en: 'Add a class',
    zh: '添加类别',
    es: 'Agregar una clase',
    de: 'Klasse hinzufügen',
    fr: 'Ajouter une classe',
    hi: 'एक कक्षा जोड़ें',
    pt: 'Adicionar uma classe',
    ja: 'クラスを追加',
  },
  addClassBrowseTab: {
    en: 'Browse Classes',
    zh: '浏览类别',
    es: 'Explorar Clases',
    de: 'Klassen durchsuchen',
    fr: 'Parcourir les classes',
    hi: 'कक्षाएं ब्राउज़ करें',
    pt: 'Explorar Classes',
    ja: 'クラスを検索',
  },
  addClassDescribeTab: {
    en: 'Describe Goods/Services',
    zh: '描述商品/服务',
    es: 'Describir Bienes/Servicios',
    de: 'Waren/Dienstleistungen beschreiben',
    fr: 'Décrire les produits/services',
    hi: 'माल/सेवाओं का वर्णन करें',
    pt: 'Descrever Produtos/Serviços',
    ja: '商品・サービスを説明',
  },
  addClassDescPlaceholder: {
    en: 'e.g. online tutoring for children, educational apps and e-learning platforms…',
    zh: '例如：儿童在线辅导、教育应用程序和电子学习平台…',
    es: 'ej. tutoría en línea para niños, aplicaciones educativas y plataformas de e-learning…',
    de: 'z. B. Online-Nachhilfe für Kinder, Lern-Apps und E-Learning-Plattformen…',
    fr: 'ex. cours particuliers en ligne pour enfants, applications éducatives et plateformes e-learning…',
    hi: 'उदा. बच्चों के लिए ऑनलाइन ट्यूटरिंग, शैक्षिक ऐप्स और ई-लर्निंग प्लेटफ़ॉर्म…',
    pt: 'ex. tutoria online para crianças, aplicativos educacionais e plataformas de e-learning…',
    ja: '例: 子供向けオンライン家庭教師、教育アプリ、eラーニングプラットフォーム…',
  },
  addClassClassifyBtn: {
    en: 'Classify with AI',
    zh: '用AI分类',
    es: 'Clasificar con IA',
    de: 'Mit KI klassifizieren',
    fr: "Classifier avec l'IA",
    hi: 'AI से वर्गीकृत करें',
    pt: 'Classificar com IA',
    ja: 'AIで分類する',
  },
  addClassAddSelected: {
    en: 'Add Selected Classes',
    zh: '添加已选类别',
    es: 'Agregar Clases Seleccionadas',
    de: 'Ausgewählte Klassen hinzufügen',
    fr: 'Ajouter les classes sélectionnées',
    hi: 'चुनी गई कक्षाएं जोड़ें',
    pt: 'Adicionar Classes Selecionadas',
    ja: '選択したクラスを追加',
  },
  addClassNoResults: {
    en: 'No new classes found for this description.',
    zh: '未找到新类别。',
    es: 'No se encontraron nuevas clases para esta descripción.',
    de: 'Keine neuen Klassen für diese Beschreibung gefunden.',
    fr: 'Aucune nouvelle classe trouvée pour cette description.',
    hi: 'इस विवरण के लिए कोई नई कक्षा नहीं मिली।',
    pt: 'Nenhuma nova classe encontrada para esta descrição.',
    ja: 'この説明に対する新しいクラスが見つかりませんでした。',
  },
  confirmClassesBanner: {
    en: 'Check the classes below — deselect any that do not apply before running the search.',
    zh: '检查下方类别 — 在运行搜索前取消选择不适用的类别。',
    es: 'Revisa las clases a continuación — deselecciona las que no apliquen antes de ejecutar la búsqueda.',
    de: 'Überprüfen Sie die Klassen unten — entfernen Sie nicht zutreffende Klassen vor der Suche.',
    fr: 'Vérifiez les classes ci-dessous — désélectionnez celles qui ne s\'appliquent pas avant de lancer la recherche.',
    hi: 'नीचे की कक्षाएं जांचें — खोज चलाने से पहले जो लागू न हो उन्हें हटाएं।',
    pt: 'Verifique as classes abaixo — desmarque as que não se aplicam antes de executar a busca.',
    ja: '以下のクラスを確認してください — 検索を実行する前に該当しないクラスの選択を外してください。',
  },
  editLabel: {
    en: 'Edit',
    zh: '编辑',
    es: 'Editar',
    de: 'Bearbeiten',
    fr: 'Modifier',
    hi: 'संपादित करें',
    pt: 'Editar',
    ja: '編集',
  },
  editConfirmMsg: {
    en: 'Editing this step will clear your progress below. Continue?',
    zh: '编辑此步骤将清除下方的进度。是否继续？',
    es: '¿Editar este paso borrará el progreso a continuación. ¿Continuar?',
    de: 'Das Bearbeiten dieses Schritts löscht Ihren Fortschritt unten. Fortfahren?',
    fr: 'Modifier cette étape effacera votre progression ci-dessous. Continuer ?',
    hi: 'इस चरण को संपादित करने से नीचे की प्रगति हट जाएगी। जारी रखें?',
    pt: 'Editar este passo irá apagar seu progresso abaixo. Continuar?',
    ja: 'このステップを編集すると、以下の進捗がリセットされます。続けますか？',
  },
  confirmYes: {
    en: 'Yes, edit',
    zh: '是，编辑',
    es: 'Sí, editar',
    de: 'Ja, bearbeiten',
    fr: 'Oui, modifier',
    hi: 'हाँ, संपादित करें',
    pt: 'Sim, editar',
    ja: 'はい、編集する',
  },
  confirmNo: {
    en: 'Cancel',
    zh: '取消',
    es: 'Cancelar',
    de: 'Abbrechen',
    fr: 'Annuler',
    hi: 'रद्द करें',
    pt: 'Cancelar',
    ja: 'キャンセル',
  },
  startOver: {
    en: 'Start over',
    zh: '重新开始',
    es: 'Comenzar de nuevo',
    de: 'Neu starten',
    fr: 'Recommencer',
    hi: 'फिर से शुरू करें',
    pt: 'Recomeçar',
    ja: '最初からやり直す',
  },
  readyToFile: {
    en: 'Ready to protect your mark?',
    zh: '准备好保护您的商标了吗？',
    es: '¿Listo para proteger tu marca?',
    de: 'Bereit, Ihre Marke zu schützen?',
    fr: 'Prêt à protéger votre marque ?',
    hi: 'अपनी मार्क सुरक्षित करने के लिए तैयार हैं?',
    pt: 'Pronto para proteger sua marca?',
    ja: '商標を保護する準備ができましたか？',
  },
  startFiling: {
    en: 'Start Trademark Filing — $299/class',
    zh: '开始商标注册 — $299/类',
    es: 'Iniciar Registro de Marca — $299/clase',
    de: 'Markenanmeldung starten — $299/Klasse',
    fr: 'Déposer ma marque — $299/classe',
    hi: 'ट्रेडमार्क दाखिल करना शुरू करें — $299/वर्ग',
    pt: 'Iniciar Registro — $299/classe',
    ja: '商標出願を開始 — $299/区分',
  },
  noName: {
    en: "Don't have a name yet?",
    zh: '还没有商标名称？',
    es: '¿Aún no tienes un nombre?',
    de: 'Noch keinen Markennamen?',
    fr: "Vous n'avez pas encore de nom ?",
    hi: 'अभी तक नाम नहीं है?',
    pt: 'Ainda não tem um nome?',
    ja: 'まだ名前が決まっていませんか？',
  },
  tryAI: {
    en: 'Generate ideas with AI',
    zh: '用AI生成商标创意',
    es: 'Generar ideas con IA',
    de: 'Ideen mit KI generieren',
    fr: "Générer des idées avec l'IA",
    hi: 'AI से विचार उत्पन्न करें',
    pt: 'Gerar ideias com IA',
    ja: 'AIでアイデアを生成',
  },
  tabWord: {
    en: 'Word / Combined Mark',
    zh: '文字 / 组合商标',
    es: 'Marca Denominativa / Mixta',
    de: 'Wort- / Kombinationsmarke',
    fr: 'Marque verbale / Mixte',
    hi: 'शब्द / संयुक्त चिह्न',
    pt: 'Marca Denominativa / Mista',
    ja: '文字 / 結合商標',
  },
  tabDesign: {
    en: 'Design / Logo Mark',
    zh: '图形 / 标志商标',
    es: 'Marca Figurativa / Logo',
    de: 'Bildmarke / Logo',
    fr: 'Marque figurative / Logo',
    hi: 'डिज़ाइन / लोगो चिह्न',
    pt: 'Marca Figurativa / Logo',
    ja: '図形 / ロゴ商標',
  },
  designUploadLabel: {
    en: 'Upload your logo or design file',
    zh: '上传您的徽标或设计文件',
    es: 'Sube tu logo o archivo de diseño',
    de: 'Laden Sie Ihr Logo oder Designdatei hoch',
    fr: 'Téléversez votre logo ou fichier de design',
    hi: 'अपना लोगो या डिज़ाइन फ़ाइल अपलोड करें',
    pt: 'Envie seu logo ou arquivo de design',
    ja: 'ロゴまたはデザインファイルをアップロード',
  },
  designUploadHint: {
    en: 'PNG, JPG, SVG or WebP · Max 10 MB',
    zh: 'PNG、JPG、SVG 或 WebP · 最大 10 MB',
    es: 'PNG, JPG, SVG o WebP · Máx. 10 MB',
    de: 'PNG, JPG, SVG oder WebP · Max. 10 MB',
    fr: 'PNG, JPG, SVG ou WebP · Max 10 Mo',
    hi: 'PNG, JPG, SVG या WebP · अधिकतम 10 MB',
    pt: 'PNG, JPG, SVG ou WebP · Máx. 10 MB',
    ja: 'PNG・JPG・SVG・WebP · 最大10MB',
  },
  designUploadDrag: {
    en: 'Drag & drop here, or click to browse',
    zh: '拖拽到此处，或点击浏览',
    es: 'Arrastra y suelta aquí, o haz clic para explorar',
    de: 'Hierher ziehen oder klicken zum Durchsuchen',
    fr: 'Glissez-déposez ici, ou cliquez pour parcourir',
    hi: 'यहाँ खींचें और छोड़ें, या ब्राउज़ करने के लिए क्लिक करें',
    pt: 'Arraste e solte aqui, ou clique para navegar',
    ja: 'ここにドラッグ&ドロップ、またはクリックして参照',
  },
  designOptionalName: {
    en: 'Word element (optional)',
    zh: '文字元素（可选）',
    es: 'Elemento denominativo (opcional)',
    de: 'Wortelement (optional)',
    fr: 'Élément verbal (facultatif)',
    hi: 'शब्द तत्व (वैकल्पिक)',
    pt: 'Elemento denominativo (opcional)',
    ja: '文字要素（任意）',
  },
  designOptionalNameHint: {
    en: 'If your design includes a word element, enter it here for more thorough analysis.',
    zh: '如果您的设计包含文字元素，请在此处输入以进行更彻底的分析。',
    es: 'Si tu diseño incluye un elemento denominativo, ingrésalo aquí para un análisis más exhaustivo.',
    de: 'Falls Ihr Design ein Wortelement enthält, geben Sie es hier für eine gründlichere Analyse ein.',
    fr: "Si votre design contient un élément verbal, saisissez-le ici pour une analyse plus approfondie.",
    hi: 'यदि आपके डिज़ाइन में कोई शब्द तत्व है, तो अधिक संपूर्ण विश्लेषण के लिए इसे यहाँ दर्ज करें।',
    pt: 'Se o seu design inclui um elemento denominativo, insira-o aqui para uma análise mais completa.',
    ja: 'デザインに文字要素が含まれる場合は、より詳細な分析のためにここに入力してください。',
  },
  designFileSizeError: {
    en: 'File exceeds 10 MB. Please choose a smaller file.',
    zh: '文件超过 10 MB，请选择较小的文件。',
    es: 'El archivo supera 10 MB. Por favor elige un archivo más pequeño.',
    de: 'Datei überschreitet 10 MB. Bitte wählen Sie eine kleinere Datei.',
    fr: 'Le fichier dépasse 10 Mo. Veuillez choisir un fichier plus petit.',
    hi: 'फ़ाइल 10 MB से अधिक है। कृपया एक छोटी फ़ाइल चुनें।',
    pt: 'O arquivo excede 10 MB. Por favor, escolha um arquivo menor.',
    ja: 'ファイルが10MBを超えています。より小さなファイルを選択してください。',
  },
  designFileTypeError: {
    en: 'Unsupported file type. Please upload PNG, JPG, SVG, or WebP.',
    zh: '不支持的文件类型。请上传 PNG、JPG、SVG 或 WebP。',
    es: 'Tipo de archivo no compatible. Por favor sube PNG, JPG, SVG o WebP.',
    de: 'Nicht unterstützter Dateityp. Bitte PNG, JPG, SVG oder WebP hochladen.',
    fr: "Type de fichier non pris en charge. Veuillez téléverser PNG, JPG, SVG ou WebP.",
    hi: 'असमर्थित फ़ाइल प्रकार। कृपया PNG, JPG, SVG, या WebP अपलोड करें।',
    pt: 'Tipo de arquivo não suportado. Por favor envie PNG, JPG, SVG ou WebP.',
    ja: 'サポートされていないファイル形式です。PNG・JPG・SVG・WebPをアップロードしてください。',
  },
  changeFile: {
    en: 'Change file',
    zh: '更换文件',
    es: 'Cambiar archivo',
    de: 'Datei ändern',
    fr: 'Changer le fichier',
    hi: 'फ़ाइल बदलें',
    pt: 'Trocar arquivo',
    ja: 'ファイルを変更',
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

function InfoTooltip({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-flex items-center">
      <button
        type="button"
        aria-label="More information"
        onClick={() => setOpen(v => !v)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className="inline-flex items-center justify-center text-gray-400 hover:text-navy-600 transition-colors focus:outline-none ml-1"
      >
        <HelpCircle size={14} />
      </button>
      {open && (
        <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 z-50 w-72 bg-navy-900 text-gray-100 text-xs leading-relaxed rounded-xl px-3.5 py-3 shadow-xl border border-white/10 pointer-events-none">
          {text}
          <span className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-[6px] border-x-transparent border-t-[6px] border-t-navy-900" />
        </span>
      )}
    </span>
  );
}

// ─── Stepper component ────────────────────────────────────────────────────────

function StepperBar({
  current, maxReached, labels, onFilingTabClick,
}: {
  current: WizardStep;
  maxReached: WizardStep;
  labels: string[];
  onFilingTabClick?: () => void;
}) {
  return (
    <div className="flex items-start gap-0 w-full">
      {labels.map((label, i) => {
        const step = (i + 1) as WizardStep;
        const isFilingStep = step === 5;
        const done = step < current;
        const active = step === current;
        const reachable = step <= maxReached;
        const filingClickable = isFilingStep && reachable && !active && !!onFilingTabClick;

        const circleCls = isFilingStep
          ? done
            ? 'bg-emerald-600 border-emerald-600 text-white'
            : active
            ? 'bg-white border-emerald-500 text-emerald-600 shadow-md'
            : 'bg-emerald-50 border-emerald-300 text-emerald-500'
          : done
          ? 'bg-navy-800 border-navy-800 text-white'
          : active
          ? 'bg-white border-navy-800 text-navy-800 shadow-md'
          : 'bg-white border-gray-200 text-gray-400';

        const labelCls = isFilingStep
          ? done || active ? 'text-emerald-700 font-semibold' : 'text-emerald-500'
          : active ? 'text-navy-800' : done ? 'text-navy-600' : 'text-gray-400';

        const connectorLeft = reachable ? (isFilingStep ? 'bg-emerald-300' : 'bg-navy-700') : 'bg-gray-200';
        const connectorRight = step < maxReached ? (step >= 4 ? 'bg-emerald-300' : 'bg-navy-700') : 'bg-gray-200';

        const inner = (
          <>
            {i > 0 && (
              <div className={`absolute left-0 top-5 w-1/2 h-0.5 -translate-y-1/2 ${connectorLeft}`} />
            )}
            {i < labels.length - 1 && (
              <div className={`absolute right-0 top-5 w-1/2 h-0.5 -translate-y-1/2 ${connectorRight}`} />
            )}
            <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${circleCls} ${filingClickable ? 'ring-2 ring-emerald-300 ring-offset-1' : ''}`}>
              {done ? <CheckCircle2 size={16} className="text-white" /> : isFilingStep && !active ? <FileText size={15} /> : step}
            </div>
            <p className={`mt-2 text-[10px] sm:text-xs font-medium text-center leading-tight px-1 ${labelCls}`}>{label}</p>
          </>
        );

        return filingClickable ? (
          <button
            key={step}
            type="button"
            onClick={onFilingTabClick}
            className="flex-1 flex flex-col items-center relative cursor-pointer"
            title={label}
          >
            {inner}
          </button>
        ) : (
          <div key={step} className="flex-1 flex flex-col items-center relative">
            {inner}
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TrademarkCheckPage() {
  const { language } = useLanguage();
  const lang = (language as Lang) in copy.pageTitle ? (language as Lang) : 'en';
  const tr = (key: string) => copy[key]?.[lang] ?? copy[key]?.['en'] ?? '';
  const navigate = useNavigate();

  // ── persisted state ────────────────────────────────────────────────────────
  const [markName, setMarkName]           = useState(() => sessionStorage.getItem('tcpMark') ?? '');
  const [goodsInput, setGoodsInput]       = useState(() => sessionStorage.getItem('tcpGoods') ?? '');
  const [chatHistory, setChatHistory]     = useState<ChatMessage[]>(() => {
    try { return JSON.parse(sessionStorage.getItem('tcpChat') ?? '[]'); } catch { return []; }
  });
  const [suggestedClasses, setSuggestedClasses] = useState<SuggestedClass[]>(() => {
    try { return JSON.parse(sessionStorage.getItem('tcpSuggested') ?? '[]'); } catch { return []; }
  });
  const [selectedNums, setSelectedNums]   = useState<number[]>(() => {
    try { return JSON.parse(sessionStorage.getItem('tcpSelected') ?? '[]'); } catch { return []; }
  });
  const [currentStep, setCurrentStep]     = useState<WizardStep>(() => {
    const s = Number(sessionStorage.getItem('tcpStep'));
    return (s >= 1 && s <= 4 ? s : 1) as WizardStep;
  });
  const [maxReached, setMaxReached]       = useState<WizardStep>(() => {
    const s = Number(sessionStorage.getItem('tcpMaxStep'));
    return (s >= 1 && s <= 4 ? s : 1) as WizardStep;
  });

  // ── design mark state ─────────────────────────────────────────────────────
  const [markType, setMarkType]             = useState<'word' | 'design'>(() =>
    sessionStorage.getItem('tcpMarkType') === 'design' ? 'design' : 'word'
  );
  const [designFile, setDesignFile]         = useState<File | null>(null);
  const [designPreviewUrl, setDesignPreviewUrl] = useState<string | null>(null);
  const [designBase64, setDesignBase64]     = useState(() => sessionStorage.getItem('tcpDesignB64') ?? '');
  const [designMime, setDesignMime]         = useState(() => sessionStorage.getItem('tcpDesignMime') ?? '');
  const [designFileError, setDesignFileError] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const designInputRef = useRef<HTMLInputElement>(null);

  // ── ephemeral UI state ─────────────────────────────────────────────────────
  const [markInputLocal, setMarkInputLocal] = useState(markName);
  const [goodsInputLocal, setGoodsInputLocal] = useState(goodsInput);
  const [replyInputs, setReplyInputs] = useState<Record<number, string>>({});
  const [classifying, setClassifying] = useState(false);
  const [classifyError, setClassifyError] = useState<string | null>(null);
  const [pendingQuestions, setPendingQuestions] = useState<string[]>(() => {
    try { return JSON.parse(sessionStorage.getItem('tcpQuestions') ?? '[]'); } catch { return []; }
  });
  const [showAddPicker, setShowAddPicker] = useState(false);
  const [pickerSearch, setPickerSearch]   = useState('');
  const [addPanelTab, setAddPanelTab]     = useState<'browse' | 'describe'>('browse');
  const [addDescInput, setAddDescInput]   = useState('');
  const [addDescClassifying, setAddDescClassifying] = useState(false);
  const [addDescSuggested, setAddDescSuggested]     = useState<SuggestedClass[]>([]);
  const [addDescSelected, setAddDescSelected]       = useState<number[]>([]);
  const [addDescError, setAddDescError]             = useState<string | null>(null);
  const [editConfirmStep, setEditConfirmStep] = useState<WizardStep | null>(null);
  const [startOverConfirm, setStartOverConfirm] = useState(false);

  const pageTopRef = useRef<HTMLDivElement>(null);
  const step2Ref   = useRef<HTMLDivElement>(null);
  const step3Ref   = useRef<HTMLDivElement>(null);
  const step4Ref   = useRef<HTMLDivElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const questionsRef  = useRef<HTMLDivElement>(null);

  // ── clear session on unmount so next visit starts fresh ──────────────────
  useEffect(() => {
    return () => {
      ['tcpMark','tcpMarkType','tcpDesignB64','tcpDesignMime','tcpGoods','tcpChat','tcpSuggested','tcpSelected','tcpQuestions','tcpStep','tcpMaxStep','tcpOrderId'].forEach(k => sessionStorage.removeItem(k));
    };
  }, []);

  // ── scroll to questions when AI questions arrive ──────────────────────────
  useEffect(() => {
    if (pendingQuestions.length > 0) {
      questionsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [pendingQuestions]);

  // ── persist helpers ────────────────────────────────────────────────────────
  const persist = (updates: Record<string, string>) => {
    Object.entries(updates).forEach(([k, v]) => sessionStorage.setItem(k, v));
  };
  const advanceTo = (step: WizardStep) => {
    const next = Math.max(step, maxReached) as WizardStep;
    setCurrentStep(step);
    setMaxReached(next);
    persist({ tcpStep: String(step), tcpMaxStep: String(next) });
    setTimeout(() => {
      const refs: Record<number, React.RefObject<HTMLDivElement | null>> = {
        2: step2Ref, 3: step3Ref, 4: step4Ref,
      };
      refs[step]?.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  };

  // ── Design file helpers ────────────────────────────────────────────────────
  const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'];
  const MAX_BYTES = 10 * 1024 * 1024;

  const processDesignFile = (file: File) => {
    setDesignFileError(null);
    if (!ALLOWED_TYPES.includes(file.type)) {
      setDesignFileError(tr('designFileTypeError'));
      return;
    }
    if (file.size > MAX_BYTES) {
      setDesignFileError(tr('designFileSizeError'));
      return;
    }
    setDesignFile(file);
    const url = URL.createObjectURL(file);
    setDesignPreviewUrl(url);
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const b64 = result.split(',')[1] ?? '';
      setDesignBase64(b64);
      setDesignMime(file.type);
      persist({ tcpDesignB64: b64, tcpDesignMime: file.type });
    };
    reader.readAsDataURL(file);
  };

  const clearDesignFile = () => {
    setDesignFile(null);
    if (designPreviewUrl) URL.revokeObjectURL(designPreviewUrl);
    setDesignPreviewUrl(null);
    setDesignBase64('');
    setDesignMime('');
    setDesignFileError(null);
    sessionStorage.removeItem('tcpDesignB64');
    sessionStorage.removeItem('tcpDesignMime');
  };

  // ── Step 1: confirm mark name / design ─────────────────────────────────────
  const submitStep1 = () => {
    if (markType === 'design' && !designBase64) return;
    const name = markInputLocal.trim();
    if (markType === 'word' && !name) return;
    setMarkName(name);
    persist({ tcpMark: name, tcpMarkType: markType });
    advanceTo(2);
  };

  // ── Step 2: call classify-goods ────────────────────────────────────────────
  const runClassify = async (messages: ChatMessage[]) => {
    setClassifying(true);
    setClassifyError(null);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/classify-goods`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ messages, language: lang }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Classification failed');

      if (data.status === 'needs_clarification' && Array.isArray(data.questions) && data.questions.length > 0) {
        setPendingQuestions(data.questions);
        sessionStorage.setItem('tcpQuestions', JSON.stringify(data.questions));
      } else if (data.status === 'classified' && Array.isArray(data.classes) && data.classes.length > 0) {
        const classes: SuggestedClass[] = data.classes;
        const nums = classes.map(c => c.classNumber).sort((a, b) => a - b);
        setSuggestedClasses(classes);
        setSelectedNums(nums);
        setPendingQuestions([]);
        sessionStorage.setItem('tcpSuggested', JSON.stringify(classes));
        sessionStorage.setItem('tcpSelected', JSON.stringify(nums));
        sessionStorage.setItem('tcpQuestions', '[]');
        advanceTo(3);
        setTimeout(() => step3Ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
      } else {
        // fallback — go to step 3 with no suggestions
        setPendingQuestions([]);
        advanceTo(3);
      }
    } catch {
      setClassifyError(
        lang === 'zh' ? '分类失败，请重试。'
        : lang === 'es' ? 'La clasificación falló. Por favor, inténtalo de nuevo.'
        : lang === 'de' ? 'Klassifizierung fehlgeschlagen. Bitte erneut versuchen.'
        : lang === 'fr' ? 'La classification a échoué. Veuillez réessayer.'
        : lang === 'hi' ? 'वर्गीकरण विफल हुआ। कृपया पुनः प्रयास करें।'
        : lang === 'pt' ? 'A classificação falhou. Por favor, tente novamente.'
        : 'Classification failed. Please try again.'
      );
    } finally {
      setClassifying(false);
    }
  };

  const submitStep2 = () => {
    const goods = goodsInputLocal.trim();
    if (!goods) return;
    setGoodsInput(goods);
    persist({ tcpGoods: goods });
    const firstMessage: ChatMessage = { role: 'user', content: goods };
    const newHistory = [firstMessage];
    setChatHistory(newHistory);
    sessionStorage.setItem('tcpChat', JSON.stringify(newHistory));
    setPendingQuestions([]);
    runClassify(newHistory);
  };

  const submitReply = () => {
    if (pendingQuestions.length === 0) return;
    const allFilled = pendingQuestions.every((_, i) => (replyInputs[i] ?? '').trim());
    if (!allFilled) return;

    // Combine Q&A pairs into a single user message
    const combinedReply = pendingQuestions
      .map((q, i) => `Q: ${q}\nA: ${(replyInputs[i] ?? '').trim()}`)
      .join('\n\n');

    const aiContent = pendingQuestions.join('\n');
    const newHistory: ChatMessage[] = [
      ...chatHistory,
      { role: 'assistant', content: aiContent },
      { role: 'user', content: combinedReply },
    ];
    setChatHistory(newHistory);
    sessionStorage.setItem('tcpChat', JSON.stringify(newHistory));
    setPendingQuestions([]);
    setReplyInputs({});
    runClassify(newHistory);
  };

  const skipToManual = () => {
    setSuggestedClasses([]);
    setSelectedNums([]);
    sessionStorage.setItem('tcpSuggested', '[]');
    sessionStorage.setItem('tcpSelected', '[]');
    advanceTo(3);
  };

  // ── Step 3: toggle / add classes ───────────────────────────────────────────
  const toggleClass = (num: number) => {
    setSelectedNums(prev => {
      const next = prev.includes(num) ? prev.filter(n => n !== num) : [...prev, num].sort((a, b) => a - b);
      sessionStorage.setItem('tcpSelected', JSON.stringify(next));
      return next;
    });
  };

  const submitStep3 = () => {
    if (selectedNums.length === 0) return;
    advanceTo(4);
    setTimeout(() => step4Ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
  };

  // ── Edit step (with confirmation) ──────────────────────────────────────────
  const requestEdit = (step: WizardStep) => {
    if (step >= currentStep) return;
    setEditConfirmStep(step);
  };

  const confirmEdit = () => {
    if (!editConfirmStep) return;
    const step = editConfirmStep;
    setEditConfirmStep(null);

    // Reset everything downstream of the edited step
    if (step <= 1) {
      setMarkInputLocal(markName);
    }
    if (step <= 2) {
      setGoodsInputLocal(goodsInput);
      setChatHistory([]);
      setPendingQuestions([]);
      sessionStorage.setItem('tcpChat', '[]');
      sessionStorage.setItem('tcpQuestions', '[]');
    }
    if (step <= 3) {
      setSuggestedClasses([]);
      setSelectedNums([]);
      sessionStorage.setItem('tcpSuggested', '[]');
      sessionStorage.setItem('tcpSelected', '[]');
    }

    const newMax = (step - 1) as WizardStep;
    const safeMax = Math.max(1, newMax) as WizardStep;
    setCurrentStep(step);
    setMaxReached(step);
    persist({ tcpStep: String(step), tcpMaxStep: String(step) });
    void safeMax; // used only for clarity
    setTimeout(() => {
      const refs: Record<number, React.RefObject<HTMLDivElement | null>> = {
        2: step2Ref, 3: step3Ref, 4: step4Ref,
      };
      refs[step]?.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  };

  // ── Navigate to filing flow, passing clearance data via transfer keys ─────
  const handleStartFiling = () => {
    sessionStorage.setItem('clrMark', markName);
    sessionStorage.setItem('clrGoods', goodsInput);
    sessionStorage.setItem('clrSuggested', sessionStorage.getItem('tcpSuggested') ?? '[]');
    sessionStorage.setItem('clrSelected', sessionStorage.getItem('tcpSelected') ?? '[]');
    if (markType === 'design' && designBase64) {
      sessionStorage.setItem('clrDesignB64', designBase64);
      sessionStorage.setItem('clrDesignMime', designMime);
    }
    navigate(`/apply?mark=${encodeURIComponent(markName)}&fromClearance=1`);
  };

  // ── Start over ─────────────────────────────────────────────────────────────
  const doStartOver = () => {
    ['tcpMark','tcpMarkType','tcpDesignB64','tcpDesignMime','tcpGoods','tcpChat','tcpSuggested','tcpSelected','tcpQuestions','tcpStep','tcpMaxStep'].forEach(k => sessionStorage.removeItem(k));
    setMarkName(''); setMarkInputLocal('');
    setMarkType('word');
    clearDesignFile();
    setGoodsInput(''); setGoodsInputLocal('');
    setChatHistory([]); setPendingQuestions([]);
    setSuggestedClasses([]); setSelectedNums([]);
    setCurrentStep(1); setMaxReached(1);
    setStartOverConfirm(false);
    setTimeout(() => pageTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
  };

  // ── Derived ────────────────────────────────────────────────────────────────
  const stepLabels = [tr('step1Title'), tr('step2Title'), tr('step3Title'), tr('step4Title'), tr('step5Title')];

  // Classes shown in Step 3: all selected (includes manually added)
  const confirmClasses = ALL_NICE_CLASSES.filter(c => selectedNums.includes(c.num));
  const availableToAdd = ALL_NICE_CLASSES.filter(
    c => !selectedNums.includes(c.num) &&
      (pickerSearch === '' || `${c.num} ${c.title} ${c.titleEs}`.toLowerCase().includes(pickerSearch.toLowerCase()))
  );

  const classLabel = (n: number) =>
    lang === 'zh' ? `第${n}类` : lang === 'ja' ? `第${n}類` : `Class ${n}`;

  // ── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50" ref={pageTopRef}>

      {/* ── Page header ──────────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800 text-white print-hide">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-10 lg:pb-12">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-white/60 hover:text-white text-sm font-medium mb-5 transition-colors group"
          >
            <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
            {tr('backLabel')}
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold leading-tight mb-2">{tr('pageTitle')}</h1>
          <p className="text-sm text-gray-300 leading-relaxed max-w-xl">{tr('pageSubtitle')}</p>
        </div>
      </section>

      {/* ── Stepper bar ───────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-30 print-hide">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <StepperBar current={currentStep} maxReached={maxReached} labels={stepLabels} onFilingTabClick={maxReached >= 4 ? handleStartFiling : undefined} />
        </div>
      </div>

      {/* ── Steps body ───────────────────────────────────────────────────────── */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-5">

        {/* ════════════════════════════════════════════════════════════════════ */}
        {/* STEP 1 — Trademark Name                                             */}
        {/* ════════════════════════════════════════════════════════════════════ */}
        <StepCard
          step={1}
          title={tr('step1Title')}
          subtitle={tr('step1Subtitle')}
          current={currentStep}
          maxReached={maxReached}
          completedSummary={
            markType === 'design'
              ? (designFile ? designFile.name : markName || tr('tabDesign'))
              : markName
          }
          onEditRequest={() => requestEdit(1)}
          editLabel={tr('editLabel')}
        >
          <div className="space-y-4">
            {/* Mark type tabs */}
            <div className="flex rounded-xl border border-gray-200 overflow-hidden">
              <button
                type="button"
                onClick={() => { setMarkType('word'); setDesignFileError(null); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors ${
                  markType === 'word'
                    ? 'bg-navy-900 text-white'
                    : 'bg-white text-gray-500 hover:bg-gray-50'
                }`}
              >
                <Type size={14} />
                {tr('tabWord')}
              </button>
              <button
                type="button"
                onClick={() => { setMarkType('design'); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors border-l border-gray-200 ${
                  markType === 'design'
                    ? 'bg-navy-900 text-white'
                    : 'bg-white text-gray-500 hover:bg-gray-50'
                }`}
              >
                <ImageIcon size={14} />
                {tr('tabDesign')}
              </button>
            </div>

            {/* Word mark input */}
            {markType === 'word' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  <span className="inline-flex items-center gap-0.5">
                    {tr('trademarkLabel')}
                    <InfoTooltip text={tr('trademarkTooltip')} />
                  </span>
                </label>
                <div className="relative">
                  <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    value={markInputLocal}
                    onChange={e => setMarkInputLocal(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && markInputLocal.trim()) submitStep1(); }}
                    placeholder={tr('trademarkPlaceholder')}
                    className="w-full border border-gray-300 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>
            )}

            {/* Design mark upload */}
            {markType === 'design' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {tr('designUploadLabel')}
                  </label>
                  {designPreviewUrl ? (
                    <div className="flex items-center gap-4 bg-gray-50 border border-gray-200 rounded-xl p-4">
                      <img
                        src={designPreviewUrl}
                        alt="Design preview"
                        className="w-20 h-20 object-contain rounded-lg bg-white border border-gray-100 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{designFile?.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {designFile ? `${(designFile.size / 1024).toFixed(0)} KB` : ''}
                        </p>
                        <button
                          type="button"
                          onClick={clearDesignFile}
                          className="mt-2 text-xs text-red-500 hover:text-red-700 font-medium transition-colors"
                        >
                          {tr('changeFile')}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onDragOver={e => { e.preventDefault(); setIsDraggingOver(true); }}
                      onDragLeave={() => setIsDraggingOver(false)}
                      onDrop={e => {
                        e.preventDefault();
                        setIsDraggingOver(false);
                        const file = e.dataTransfer.files?.[0];
                        if (file) processDesignFile(file);
                      }}
                      onClick={() => designInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-xl px-5 py-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all ${
                        isDraggingOver
                          ? 'border-navy-500 bg-navy-50'
                          : 'border-gray-300 bg-gray-50 hover:border-navy-400 hover:bg-gray-100'
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${isDraggingOver ? 'bg-navy-100' : 'bg-white border border-gray-200'}`}>
                        <Upload size={22} className={isDraggingOver ? 'text-navy-600' : 'text-gray-400'} />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-700">{tr('designUploadDrag')}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{tr('designUploadHint')}</p>
                      </div>
                      <input
                        ref={designInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/svg+xml,image/webp"
                        className="sr-only"
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) processDesignFile(file);
                          e.target.value = '';
                        }}
                      />
                    </div>
                  )}
                  {designFileError && (
                    <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                      <AlertTriangle size={12} />
                      {designFileError}
                    </p>
                  )}
                </div>

                {/* Optional word element */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {tr('designOptionalName')}
                  </label>
                  <p className="text-xs text-gray-500 mb-1.5">{tr('designOptionalNameHint')}</p>
                  <div className="relative">
                    <Type size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input
                      type="text"
                      value={markInputLocal}
                      onChange={e => setMarkInputLocal(e.target.value)}
                      placeholder="e.g. APEX, BluePeak…"
                      className="w-full border border-gray-300 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={submitStep1}
              disabled={markType === 'word' ? !markInputLocal.trim() : !designBase64}
              className="inline-flex items-center gap-2 bg-navy-900 hover:bg-navy-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold px-5 py-2.5 rounded-xl transition-colors shadow-sm text-sm"
            >
              {tr('step2Title')} <ChevronRight size={15} />
            </button>
          </div>
        </StepCard>

        {/* ════════════════════════════════════════════════════════════════════ */}
        {/* STEP 2 — Goods & Services                                           */}
        {/* ════════════════════════════════════════════════════════════════════ */}
        <div ref={step2Ref}>
          <StepCard
            step={2}
            title={tr('step2Title')}
            subtitle={tr('step2Subtitle')}
            current={currentStep}
            maxReached={maxReached}
            completedSummary={goodsInput}
            onEditRequest={() => requestEdit(2)}
            editLabel={tr('editLabel')}
          >
            <div className="space-y-4">
              {/* Goods input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  <span className="inline-flex items-center gap-1.5">
                    <FileText size={13} className="text-navy-500" />
                    {tr('goodsLabel')}
                    <InfoTooltip text={tr('goodsTooltip')} />
                  </span>
                </label>
                <textarea
                  value={goodsInputLocal}
                  onChange={e => setGoodsInputLocal(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && goodsInputLocal.trim()) { e.preventDefault(); submitStep2(); } }}
                  placeholder={tr('goodsPlaceholder')}
                  rows={3}
                  disabled={classifying || pendingQuestions.length > 0}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent transition-all resize-none disabled:bg-gray-50 disabled:text-gray-400"
                />
              </div>

              {/* Classify button */}
              {pendingQuestions.length === 0 && !classifying && (
                <button
                  type="button"
                  onClick={submitStep2}
                  disabled={!goodsInputLocal.trim()}
                  className="inline-flex items-center gap-2 bg-navy-900 hover:bg-navy-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold px-5 py-2.5 rounded-xl transition-colors shadow-sm text-sm"
                >
                  {tr('classifyBtn')} <ArrowRight size={15} />
                </button>
              )}

              {/* Classifying spinner */}
              {classifying && (
                <div className="flex items-center gap-3 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                  <Loader2 size={16} className="animate-spin text-amber-500 flex-shrink-0" />
                  <p className="text-sm text-amber-800 font-medium">{tr('classifyingLabel')}</p>
                </div>
              )}

              {/* Error */}
              {classifyError && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                  <AlertTriangle size={15} className="text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{classifyError}</p>
                </div>
              )}

              {/* AI question bubble */}
              {pendingQuestions.length > 0 && (
                <div className="space-y-3" ref={questionsRef}>
                  {/* Conversation so far (user turns) */}
                  {chatHistory.filter(m => m.role === 'user').length > 1 && (
                    <div className="space-y-2">
                      {chatHistory.map((msg, i) => (
                        msg.role === 'user' && i > 0 ? (
                          <div key={i} className="flex justify-end">
                            <div className="max-w-[85%] bg-navy-800 text-white text-sm rounded-2xl rounded-br-sm px-4 py-2.5">
                              {msg.content}
                            </div>
                          </div>
                        ) : null
                      ))}
                    </div>
                  )}

                  {/* AI bubble with per-question answer boxes */}
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-navy-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Sparkles size={14} className="text-navy-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-navy-700 mb-3">{tr('aiQuestionsLabel')}</p>
                      <div className="space-y-4">
                        {pendingQuestions.map((q, i) => (
                          <div key={i} className="bg-navy-50 border border-navy-100 rounded-xl overflow-hidden">
                            <div className="flex items-start gap-3 px-4 py-3">
                              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-navy-200 text-navy-700 text-[10px] font-bold flex items-center justify-center mt-0.5">
                                {i + 1}
                              </span>
                              <p className="text-sm text-navy-900 leading-relaxed">{q}</p>
                            </div>
                            <div className="border-t border-navy-100 bg-white px-4 py-2.5">
                              <textarea
                                value={replyInputs[i] ?? ''}
                                onChange={e => setReplyInputs(prev => ({ ...prev, [i]: e.target.value }))}
                                placeholder={tr('replyPlaceholder')}
                                rows={2}
                                className="w-full text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none resize-none bg-transparent"
                              />
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={skipToManual}
                          className="text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2 transition-colors"
                        >
                          {tr('skipManual')}
                        </button>
                        <button
                          type="button"
                          onClick={submitReply}
                          disabled={!pendingQuestions.every((_, i) => (replyInputs[i] ?? '').trim())}
                          className="flex items-center gap-2 bg-navy-900 hover:bg-navy-800 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
                        >
                          <Send size={13} />
                          {tr('replyPlaceholder') ? (lang === 'es' ? 'Enviar respuestas' : lang === 'zh' ? '提交回答' : lang === 'de' ? 'Antworten senden' : lang === 'fr' ? 'Envoyer les réponses' : lang === 'hi' ? 'उत्तर भेजें' : lang === 'pt' ? 'Enviar respostas' : 'Submit answers') : 'Submit answers'}
                        </button>
                      </div>
                    </div>
                  </div>
                  <div ref={chatBottomRef} />
                </div>
              )}
            </div>
          </StepCard>
        </div>

        {/* ════════════════════════════════════════════════════════════════════ */}
        {/* STEP 3 — Confirm Classification                                     */}
        {/* ════════════════════════════════════════════════════════════════════ */}
        <div ref={step3Ref}>
          <StepCard
            step={3}
            title={tr('step3Title')}
            subtitle={tr('step3Subtitle')}
            current={currentStep}
            maxReached={maxReached}
            completedSummary={selectedNums.length > 0
              ? selectedNums.map(n => classLabel(n)).join(' · ')
              : ''}
            onEditRequest={() => requestEdit(3)}
            editLabel={tr('editLabel')}
          >
            <div className="space-y-4">
              {/* AI concludes heading */}
              {suggestedClasses.length > 0 && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex items-start gap-2.5">
                  <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-emerald-800 font-medium leading-relaxed">
                    {tr('aiConcludes')} <span className="font-bold">«{markName}»</span>:&nbsp;
                    {suggestedClasses.map((c, i) => (
                      <span key={c.classNumber}>
                        {i > 0 && ', '}
                        <span className="font-bold">{classLabel(c.classNumber)}</span> ({c.titleLocalized || c.titleEn})
                      </span>
                    ))}
                  </p>
                </div>
              )}

              {/* Confirmation banner when 2+ classes */}
              {confirmClasses.length >= 2 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 flex items-center gap-2.5">
                  <AlertTriangle size={14} className="text-amber-500 flex-shrink-0" />
                  <p className="text-xs text-amber-800 leading-relaxed">{tr('confirmClassesBanner')}</p>
                </div>
              )}

              {/* Class list */}
              <div className="space-y-2">
                {confirmClasses.length > 0 ? (
                  confirmClasses.map(cls => {
                    const suggested = suggestedClasses.find(s => s.classNumber === cls.num);
                    const isSelected = selectedNums.includes(cls.num);
                    return (
                      <div
                        key={cls.num}
                        className={`border rounded-xl overflow-hidden transition-all ${isSelected ? 'border-emerald-300 bg-white shadow-sm' : 'border-gray-200 bg-gray-50 opacity-60'}`}
                      >
                        {/* Class header row */}
                        <div className="flex items-start gap-3 px-4 py-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${isSelected ? 'bg-navy-100 text-navy-700' : 'bg-gray-200 text-gray-500'}`}>
                                {classLabel(cls.num)}
                              </span>
                              <span className="text-sm font-semibold text-gray-900">
                                {suggested?.titleLocalized || suggested?.titleEn || cls.title}
                              </span>
                              <span className="text-xs text-gray-400">({cls.titleEs})</span>
                            </div>
                            {suggested?.reasoning && (
                              <p className="text-xs text-gray-500 mt-1 italic leading-relaxed">{suggested.reasoning}</p>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => toggleClass(cls.num)}
                            title={isSelected ? 'Deselect class' : 'Select class'}
                            className={`flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                              isSelected
                                ? 'bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 hover:border-red-300'
                                : 'bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-300'
                            }`}
                          >
                            {isSelected ? (
                              <><X size={12} strokeWidth={2.5} />{lang === 'es' ? 'Quitar' : lang === 'zh' ? '移除' : lang === 'de' ? 'Entf.' : lang === 'fr' ? 'Retirer' : lang === 'pt' ? 'Remover' : 'Remove'}</>
                            ) : (
                              <><CheckCircle2 size={12} strokeWidth={2.5} />{lang === 'es' ? 'Añadir' : lang === 'zh' ? '添加' : lang === 'de' ? 'Hinzuf.' : lang === 'fr' ? 'Ajouter' : lang === 'pt' ? 'Adicionar' : 'Add'}</>
                            )}
                          </button>
                        </div>
                        {/* IMPI description */}
                        {suggested?.descriptionEs && isSelected && (
                          <div className="border-t border-gray-100 bg-gray-50 px-4 py-2.5">
                            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">
                              {tr('impiDescription')}
                            </p>
                            <p className="text-xs text-gray-700 font-mono leading-relaxed">{suggested.descriptionEs}</p>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-gray-400 text-center py-6">
                    {lang === 'zh' ? '尚未选择任何类别' : lang === 'es' ? 'No hay clases seleccionadas aún' : lang === 'de' ? 'Noch keine Klassen ausgewählt' : lang === 'fr' ? 'Aucune classe sélectionnée' : lang === 'hi' ? 'अभी तक कोई कक्षा नहीं चुनी गई' : lang === 'pt' ? 'Nenhuma classe selecionada' : 'No classes selected yet'}
                  </p>
                )}
              </div>

              {/* Add a class — two-tab panel */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    const next = !showAddPicker;
                    setShowAddPicker(next);
                    if (next) { setPickerSearch(''); setAddPanelTab('browse'); setAddDescInput(''); setAddDescSuggested([]); setAddDescSelected([]); setAddDescError(null); }
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-navy-700 hover:text-navy-900 border border-dashed border-navy-300 hover:border-navy-500 rounded-xl px-3 py-2 transition-colors"
                >
                  <Plus size={13} />
                  {tr('addClass')}
                  <ChevronDown size={12} className={`transition-transform ${showAddPicker ? 'rotate-180' : ''}`} />
                </button>

                {showAddPicker && (
                  <div className="mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                    {/* Tabs */}
                    <div className="flex border-b border-gray-100">
                      <button
                        type="button"
                        onClick={() => setAddPanelTab('browse')}
                        className={`flex-1 text-xs font-semibold py-2.5 px-3 transition-colors ${addPanelTab === 'browse' ? 'text-navy-800 border-b-2 border-navy-700 bg-navy-50/50' : 'text-gray-500 hover:text-gray-700'}`}
                      >
                        {tr('addClassBrowseTab')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setAddPanelTab('describe')}
                        className={`flex-1 text-xs font-semibold py-2.5 px-3 transition-colors flex items-center justify-center gap-1.5 ${addPanelTab === 'describe' ? 'text-navy-800 border-b-2 border-navy-700 bg-navy-50/50' : 'text-gray-500 hover:text-gray-700'}`}
                      >
                        <Sparkles size={11} />
                        {tr('addClassDescribeTab')}
                      </button>
                    </div>

                    {/* Tab: Browse */}
                    {addPanelTab === 'browse' && (
                      <>
                        <div className="p-2 border-b border-gray-100">
                          <input
                            type="text"
                            value={pickerSearch}
                            onChange={e => setPickerSearch(e.target.value)}
                            placeholder={lang === 'zh' ? '搜索类别…' : lang === 'es' ? 'Buscar clase…' : lang === 'de' ? 'Klasse suchen…' : lang === 'fr' ? 'Rechercher une classe…' : lang === 'hi' ? 'कक्षा खोजें…' : lang === 'pt' ? 'Pesquisar classe…' : 'Search classes…'}
                            className="w-full text-xs border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-navy-400"
                            autoFocus
                          />
                        </div>
                        <div className="max-h-56 overflow-y-auto">
                          {availableToAdd.length === 0 ? (
                            <p className="text-xs text-gray-400 text-center py-4">
                              {lang === 'zh' ? '未找到结果' : lang === 'es' ? 'Sin resultados' : lang === 'de' ? 'Keine Ergebnisse' : lang === 'fr' ? 'Aucun résultat' : lang === 'hi' ? 'कोई परिणाम नहीं' : lang === 'pt' ? 'Sem resultados' : 'No results'}
                            </p>
                          ) : (
                            availableToAdd.map(cls => (
                              <button
                                key={cls.num}
                                type="button"
                                onClick={() => { toggleClass(cls.num); setShowAddPicker(false); setPickerSearch(''); }}
                                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 text-left transition-colors border-b border-gray-50 last:border-0"
                              >
                                <span className="text-[10px] font-bold bg-navy-100 text-navy-700 px-2 py-0.5 rounded-full flex-shrink-0">
                                  {lang === 'zh' ? `第${cls.num}类` : lang === 'ja' ? `第${cls.num}類` : `Cl. ${cls.num}`}
                                </span>
                                <div className="min-w-0">
                                  <p className="text-xs font-medium text-gray-800 truncate">{cls.title}</p>
                                  <p className="text-[10px] text-gray-400 truncate">{cls.titleEs}</p>
                                </div>
                              </button>
                            ))
                          )}
                        </div>
                      </>
                    )}

                    {/* Tab: Describe */}
                    {addPanelTab === 'describe' && (
                      <div className="p-3 space-y-3">
                        <textarea
                          value={addDescInput}
                          onChange={e => { setAddDescInput(e.target.value); setAddDescSuggested([]); setAddDescSelected([]); setAddDescError(null); }}
                          placeholder={tr('addClassDescPlaceholder')}
                          rows={3}
                          className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-navy-400 resize-none placeholder-gray-400"
                        />
                        {addDescError && (
                          <p className="text-xs text-red-500 flex items-center gap-1"><AlertTriangle size={11} />{addDescError}</p>
                        )}
                        {/* AI suggested classes from describe tab */}
                        {addDescSuggested.length > 0 && (
                          <div className="space-y-2">
                            {addDescSuggested.map(s => {
                              const isChecked = addDescSelected.includes(s.classNumber);
                              const niceInfo = ALL_NICE_CLASSES.find(c => c.num === s.classNumber);
                              return (
                                <div
                                  key={s.classNumber}
                                  className={`border rounded-xl overflow-hidden transition-all ${isChecked ? 'border-emerald-300 bg-white shadow-sm' : 'border-gray-200 bg-gray-50 opacity-70'}`}
                                >
                                  <div className="flex items-start gap-3 px-3 py-2.5">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isChecked ? 'bg-navy-100 text-navy-700' : 'bg-gray-200 text-gray-500'}`}>
                                          {classLabel(s.classNumber)}
                                        </span>
                                        <span className="text-xs font-semibold text-gray-900">{s.titleLocalized || s.titleEn}</span>
                                        {niceInfo?.titleEs && <span className="text-[10px] text-gray-400">({niceInfo.titleEs})</span>}
                                      </div>
                                      {s.reasoning && <p className="text-[10px] text-gray-500 mt-0.5 italic leading-relaxed">{s.reasoning}</p>}
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => setAddDescSelected(prev =>
                                        prev.includes(s.classNumber) ? prev.filter(n => n !== s.classNumber) : [...prev, s.classNumber]
                                      )}
                                      className={`flex-shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold transition-all ${
                                        isChecked
                                          ? 'bg-red-50 border border-red-200 text-red-600 hover:bg-red-100'
                                          : 'bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                                      }`}
                                    >
                                      {isChecked ? <><X size={10} strokeWidth={2.5} />Remove</> : <><CheckCircle2 size={10} strokeWidth={2.5} />Add</>}
                                    </button>
                                  </div>
                                  {s.descriptionEs && isChecked && (
                                    <div className="border-t border-gray-100 bg-gray-50 px-3 py-2">
                                      <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">{tr('impiDescription')}</p>
                                      <p className="text-[10px] text-gray-700 font-mono leading-relaxed">{s.descriptionEs}</p>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                            <button
                              type="button"
                              disabled={addDescSelected.length === 0}
                              onClick={() => {
                                addDescSelected.forEach(n => { if (!selectedNums.includes(n)) toggleClass(n); });
                                setShowAddPicker(false);
                                setAddDescInput('');
                                setAddDescSuggested([]);
                                setAddDescSelected([]);
                              }}
                              className="w-full mt-1 bg-navy-800 hover:bg-navy-700 disabled:opacity-40 text-white text-xs font-semibold py-2 rounded-lg transition-colors"
                            >
                              {tr('addClassAddSelected')} {addDescSelected.length > 0 && `(${addDescSelected.length})`}
                            </button>
                          </div>
                        )}
                        {addDescSuggested.length === 0 && (
                          <button
                            type="button"
                            disabled={!addDescInput.trim() || addDescClassifying}
                            onClick={async () => {
                              setAddDescClassifying(true);
                              setAddDescError(null);
                              setAddDescSuggested([]);
                              setAddDescSelected([]);
                              try {
                                const contextNote = selectedNums.length > 0
                                  ? `\n\nAlready selected classes for this mark: ${selectedNums.map(n => `Class ${n}`).join(', ')}. Please suggest complementary classes not already covered.`
                                  : '';
                                const res = await fetch(`${SUPABASE_URL}/functions/v1/classify-goods`, {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
                                  body: JSON.stringify({ messages: [{ role: 'user', content: addDescInput.trim() + contextNote }], language: lang, directClassify: true }),
                                });
                                if (!res.ok) throw new Error('Service unavailable');
                                const data = await res.json();
                                if (!Array.isArray(data.classes) || data.classes.length === 0) {
                                  setAddDescError(tr('addClassNoResults'));
                                  return;
                                }
                                const fresh = (data.classes as SuggestedClass[]).filter(c => !selectedNums.includes(c.classNumber));
                                if (fresh.length === 0) {
                                  setAddDescError(tr('addClassNoResults'));
                                } else {
                                  setAddDescSuggested(fresh);
                                  setAddDescSelected(fresh.map(c => c.classNumber));
                                }
                              } catch {
                                setAddDescError(lang === 'es' ? 'Error al clasificar. Intenta de nuevo.' : 'Classification failed. Please try again.');
                              } finally {
                                setAddDescClassifying(false);
                              }
                            }}
                            className="w-full flex items-center justify-center gap-1.5 bg-navy-800 hover:bg-navy-700 disabled:opacity-40 text-white text-xs font-semibold py-2 rounded-lg transition-colors"
                          >
                            {addDescClassifying ? <><Loader2 size={12} className="animate-spin" />{tr('classifyingLabel')}</> : <><Sparkles size={12} />{tr('addClassClassifyBtn')}</>}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Agree & run */}
              <button
                type="button"
                onClick={submitStep3}
                disabled={selectedNums.length === 0}
                className="w-full flex items-center justify-center gap-2 bg-gold-500 hover:bg-gold-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors shadow-md text-sm"
              >
                <CheckCircle2 size={16} />
                {tr('agreeAndRun')}
                {selectedNums.length > 0 && (
                  <span className="text-xs bg-white/25 px-2 py-0.5 rounded-full">
                    {selectedNums.length} {selectedNums.length === 1
                      ? (lang === 'zh' ? '类' : lang === 'es' ? 'clase' : lang === 'de' ? 'Klasse' : lang === 'fr' ? 'classe' : lang === 'hi' ? 'वर्ग' : lang === 'pt' ? 'classe' : lang === 'ja' ? '区分' : 'class')
                      : (lang === 'zh' ? '类' : lang === 'es' ? 'clases' : lang === 'de' ? 'Klassen' : lang === 'fr' ? 'classes' : lang === 'hi' ? 'वर्ग' : lang === 'pt' ? 'classes' : lang === 'ja' ? '区分' : 'classes')}
                  </span>
                )}
              </button>
            </div>
          </StepCard>
        </div>

        {/* ════════════════════════════════════════════════════════════════════ */}
        {/* STEP 4 — Clearance Analysis                                         */}
        {/* ════════════════════════════════════════════════════════════════════ */}
        <div ref={step4Ref}>
          <StepCard
            step={4}
            title={tr('step4Title')}
            subtitle={tr('step4Subtitle')}
            current={currentStep}
            maxReached={maxReached}
            completedSummary=""
            onEditRequest={() => {}} // step 4 is terminal
            editLabel={tr('editLabel')}
          >
            <Suspense fallback={<div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-gold-500" /></div>}>
              <TrademarkClearancePanel
                markName={markName}
                goodsServices={goodsInput}
                classes={selectedNums}
                language={lang as 'en' | 'zh' | 'es' | 'de' | 'fr' | 'hi' | 'pt'}
                autoRun={true}
                showFilingCta={true}
                onStartFiling={handleStartFiling}
                imageBase64={markType === 'design' ? designBase64 : undefined}
                imageMimeType={markType === 'design' ? designMime : undefined}
              />
            </Suspense>
          </StepCard>
        </div>

        {/* ── Start over ──────────────────────────────────────────────────── */}
        {currentStep > 1 && (
          <div className="text-center print-hide pb-4">
            {!startOverConfirm ? (
              <button
                type="button"
                onClick={() => setStartOverConfirm(true)}
                className="text-sm text-gray-400 hover:text-gray-600 underline underline-offset-2 transition-colors"
              >
                {tr('startOver')}
              </button>
            ) : (
              <div className="inline-flex flex-col items-center gap-3 bg-white border border-amber-200 rounded-2xl px-5 py-4 shadow-sm">
                <p className="text-sm text-gray-700 font-medium">
                  {lang === 'zh' ? '这将清除所有进度。是否继续？'
                    : lang === 'es' ? '¿Seguro que quieres comenzar de nuevo? Se borrará todo el progreso.'
                    : lang === 'de' ? 'Alle Fortschritte werden gelöscht. Fortfahren?'
                    : lang === 'fr' ? 'Toute la progression sera effacée. Continuer ?'
                    : lang === 'hi' ? 'यह सभी प्रगति मिटा देगा। क्या आप निश्चित हैं?'
                    : lang === 'pt' ? 'Todo o progresso será apagado. Tem certeza?'
                    : 'All progress will be cleared. Are you sure?'}
                </p>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={doStartOver} className="text-sm font-semibold bg-navy-900 hover:bg-navy-800 text-white px-4 py-1.5 rounded-xl transition-colors">
                    {lang === 'zh' ? '确认' : lang === 'es' ? 'Sí, comenzar de nuevo' : lang === 'de' ? 'Bestätigen' : lang === 'fr' ? 'Confirmer' : lang === 'hi' ? 'पुष्टि करें' : lang === 'pt' ? 'Confirmar' : 'Confirm'}
                  </button>
                  <button type="button" onClick={() => setStartOverConfirm(false)} className="text-sm text-gray-500 hover:text-gray-700 px-4 py-1.5 rounded-xl border border-gray-200 transition-colors">
                    {tr('confirmNo')}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Edit confirmation modal ──────────────────────────────────────────── */}
      {editConfirmStep !== null && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setEditConfirmStep(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Edit2 size={18} className="text-amber-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">{tr('editLabel')} {tr(`step${editConfirmStep}Title`)}</p>
                <p className="text-xs text-gray-500 mt-0.5">{tr('editConfirmMsg')}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={confirmEdit} className="flex-1 bg-navy-900 hover:bg-navy-800 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors">
                {tr('confirmYes')}
              </button>
              <button type="button" onClick={() => setEditConfirmStep(null)} className="flex-1 border border-gray-200 hover:border-gray-300 text-gray-600 text-sm font-medium py-2.5 rounded-xl transition-colors">
                {tr('confirmNo')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── StepCard sub-component ───────────────────────────────────────────────────

interface StepCardProps {
  step: WizardStep;
  title: string;
  subtitle: string;
  current: WizardStep;
  maxReached: WizardStep;
  completedSummary: string;
  onEditRequest: () => void;
  editLabel: string;
  children?: React.ReactNode;
}

function StepCard({
  step, title, subtitle, current, completedSummary,
  onEditRequest, editLabel, children,
}: StepCardProps) {
  const isActive    = step === current;
  const isCompleted = step < current;
  const isLocked    = step > current;

  return (
    <div className={`rounded-2xl border transition-all ${
      isActive    ? 'border-navy-200 bg-white shadow-md'
      : isCompleted ? 'border-gray-200 bg-white shadow-sm'
      : 'border-gray-100 bg-gray-50 opacity-60'
    }`}>
      {/* Card header */}
      <div className={`flex items-center gap-3 px-5 py-4 ${isActive ? 'border-b border-navy-100' : isCompleted ? 'border-b border-gray-100' : ''}`}>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
          isCompleted ? 'bg-navy-800 text-white'
          : isActive   ? 'bg-navy-900 text-white ring-4 ring-navy-100'
          : 'bg-gray-200 text-gray-400'
        }`}>
          {isCompleted ? <CheckCircle2 size={15} className="text-white" /> : step}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-bold truncate ${isActive ? 'text-navy-900' : isCompleted ? 'text-gray-700' : 'text-gray-400'}`}>{title}</p>
          {isCompleted && completedSummary ? (
            <p className="text-xs text-gray-500 truncate mt-0.5">{completedSummary}</p>
          ) : !isCompleted && (
            <p className={`text-xs mt-0.5 truncate ${isActive ? 'text-gray-500' : 'text-gray-400'}`}>{subtitle}</p>
          )}
        </div>
        {isCompleted && step > 1 && (
          <button
            type="button"
            onClick={onEditRequest}
            className="flex-shrink-0 inline-flex items-center gap-1 text-xs text-gray-400 hover:text-navy-700 transition-colors border border-gray-200 hover:border-navy-300 rounded-lg px-2.5 py-1"
          >
            <Edit2 size={11} />
            {editLabel}
          </button>
        )}
        {isLocked && (
          <div className="flex-shrink-0 text-gray-300">
            <ChevronRight size={16} />
          </div>
        )}
      </div>

      {/* Card body (active only) */}
      {isActive && (
        <div className="px-5 py-5">
          {children}
        </div>
      )}
    </div>
  );
}
