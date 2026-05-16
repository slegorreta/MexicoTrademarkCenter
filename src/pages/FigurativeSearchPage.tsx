import { useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Upload, X, Image as ImageIcon, Search, Loader2, AlertTriangle, CheckCircle2, Info, FileText, ArrowRight, Shield, Tag, ChevronDown, ChevronUp } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { supabase } from '../lib/supabase';

type Lang = 'en' | 'zh' | 'es' | 'de' | 'fr' | 'hi' | 'pt' | 'ja';

function tr(key: string, lang: Lang): string {
  return (copy[key]?.[lang] ?? copy[key]?.['en'] ?? key);
}

const ALL_NICE_CLASSES: { num: number; title: string; titleEs: string }[] = [
  { num: 1,  title: 'Chemicals',                       titleEs: 'Productos Químicos' },
  { num: 2,  title: 'Paints & Varnishes',               titleEs: 'Pinturas y Barnices' },
  { num: 3,  title: 'Cosmetics & Cleaning',             titleEs: 'Cosméticos y Limpieza' },
  { num: 4,  title: 'Lubricants & Fuels',               titleEs: 'Lubricantes y Combustibles' },
  { num: 5,  title: 'Pharmaceuticals',                  titleEs: 'Productos Farmacéuticos' },
  { num: 6,  title: 'Metals & Hardware',                titleEs: 'Metales y Ferretería' },
  { num: 7,  title: 'Machinery',                        titleEs: 'Maquinaria' },
  { num: 8,  title: 'Hand Tools',                       titleEs: 'Herramientas Manuales' },
  { num: 9,  title: 'Electronics & Technology',         titleEs: 'Electrónica y Tecnología' },
  { num: 10, title: 'Medical Devices',                  titleEs: 'Dispositivos Médicos' },
  { num: 11, title: 'Lighting & Appliances',            titleEs: 'Iluminación y Aparatos' },
  { num: 12, title: 'Vehicles & Transport',             titleEs: 'Vehículos y Transporte' },
  { num: 13, title: 'Firearms & Fireworks',             titleEs: 'Armas y Pirotecnia' },
  { num: 14, title: 'Jewelry & Watches',                titleEs: 'Joyería y Relojes' },
  { num: 15, title: 'Musical Instruments',              titleEs: 'Instrumentos Musicales' },
  { num: 16, title: 'Paper & Print',                    titleEs: 'Papel e Impresos' },
  { num: 17, title: 'Rubber & Plastics',                titleEs: 'Goma y Plásticos' },
  { num: 18, title: 'Leather Goods & Bags',             titleEs: 'Artículos de Piel y Bolsos' },
  { num: 19, title: 'Building Materials',               titleEs: 'Materiales de Construcción' },
  { num: 20, title: 'Furniture',                        titleEs: 'Mobiliario' },
  { num: 21, title: 'Kitchenware & Household',          titleEs: 'Utensilios de Cocina y Hogar' },
  { num: 22, title: 'Ropes, Tents & Textiles',          titleEs: 'Cuerdas, Tiendas y Textiles' },
  { num: 23, title: 'Yarn & Thread',                    titleEs: 'Hilos y Fibras' },
  { num: 24, title: 'Fabrics & Textiles',               titleEs: 'Telas y Tejidos' },
  { num: 25, title: 'Clothing & Footwear',              titleEs: 'Ropa y Calzado' },
  { num: 26, title: 'Lace, Embroidery & Buttons',       titleEs: 'Encajes, Bordados y Botones' },
  { num: 27, title: 'Carpets & Floor Coverings',        titleEs: 'Alfombras y Suelos' },
  { num: 28, title: 'Games, Toys & Sports',             titleEs: 'Juegos, Juguetes y Deportes' },
  { num: 29, title: 'Meat, Fish & Dairy',               titleEs: 'Carnes, Pescados y Lácteos' },
  { num: 30, title: 'Coffee, Flour & Baked Goods',      titleEs: 'Café, Harinas y Panadería' },
  { num: 31, title: 'Agriculture & Live Animals',       titleEs: 'Agricultura y Animales Vivos' },
  { num: 32, title: 'Beer, Soft Drinks & Juice',        titleEs: 'Cervezas y Bebidas' },
  { num: 33, title: 'Wines & Spirits',                  titleEs: 'Vinos y Bebidas Espirituosas' },
  { num: 34, title: 'Tobacco & Smoking',                titleEs: 'Tabaco' },
  { num: 35, title: 'Advertising & Business',           titleEs: 'Publicidad y Negocios' },
  { num: 36, title: 'Insurance & Finance',              titleEs: 'Seguros y Finanzas' },
  { num: 37, title: 'Construction & Repair',            titleEs: 'Construcción y Reparación' },
  { num: 38, title: 'Telecommunications',               titleEs: 'Telecomunicaciones' },
  { num: 39, title: 'Transport & Travel',               titleEs: 'Transporte y Viajes' },
  { num: 40, title: 'Material Treatment',               titleEs: 'Tratamiento de Materiales' },
  { num: 41, title: 'Education & Entertainment',        titleEs: 'Educación y Entretenimiento' },
  { num: 42, title: 'Science & Technology',             titleEs: 'Ciencia y Tecnología' },
  { num: 43, title: 'Food & Drink Services',            titleEs: 'Servicios de Alimentos' },
  { num: 44, title: 'Medical & Beauty Services',        titleEs: 'Servicios Médicos y Estéticos' },
  { num: 45, title: 'Legal & Security Services',        titleEs: 'Servicios Legales y Seguridad' },
];

// ── Translations ──────────────────────────────────────────────────────────────
const copy: Record<string, Partial<Record<Lang, string>>> = {
  pageTitle: {
    en: 'Figurative Trademark Search',
    es: 'Búsqueda de Marca Figurativa',
    zh: '图形商标检索',
    de: 'Bildmarkenrecherche',
    fr: 'Recherche de marque figurative',
    hi: 'चित्रात्मक ट्रेडमार्क खोज',
    pt: 'Pesquisa de Marca Figurativa',
    ja: '図形商標調査',
  },
  pageSubtitle: {
    en: 'Upload your logo or design to search the IMPI MARCia database for visually similar registered trademarks using AI-powered Vienna Classification analysis.',
    es: 'Sube tu logotipo o diseño para buscar marcas registradas visualmente similares en la base de datos IMPI MARCia, utilizando análisis de Clasificación de Viena potenciado por IA.',
    zh: '上传您的标志或设计，使用AI驱动的维也纳分类分析，在IMPI MARCia数据库中搜索视觉上相似的注册商标。',
    de: 'Laden Sie Ihr Logo oder Design hoch, um mit KI-gestützter Wiener Klassifikationsanalyse in der IMPI MARCia-Datenbank nach visuell ähnlichen eingetragenen Marken zu suchen.',
    fr: "Téléchargez votre logo ou design pour rechercher des marques déposées visuellement similaires dans la base IMPI MARCia, grâce à une analyse par classification de Vienne assistée par IA.",
    hi: 'AI-संचालित वियना वर्गीकरण विश्लेषण का उपयोग करके IMPI MARCia डेटाबेस में दृश्य रूप से समान पंजीकृत ट्रेडमार्क खोजने के लिए अपना लोगो या डिज़ाइन अपलोड करें।',
    pt: 'Faça upload do seu logotipo ou design para pesquisar marcas registradas visualmente similares na base IMPI MARCia, usando análise de Classificação de Viena com IA.',
    ja: 'ロゴやデザインをアップロードして、AI搭載のウィーン分類分析を使用してIMPI MARCiaデータベースで視覚的に類似した登録商標を検索します。',
  },
  step1Title: { en: 'Upload Your Design', es: 'Sube tu Diseño', zh: '上传您的设计', de: 'Design hochladen', fr: 'Télécharger votre design', hi: 'अपना डिज़ाइन अपलोड करें', pt: 'Fazer upload do Design', ja: 'デザインをアップロード' },
  step1Hint: { en: 'PNG, JPG, SVG or WebP · Max 10 MB', es: 'PNG, JPG, SVG o WebP · Máx. 10 MB', zh: 'PNG、JPG、SVG 或 WebP · 最大 10 MB', de: 'PNG, JPG, SVG oder WebP · Max. 10 MB', fr: 'PNG, JPG, SVG ou WebP · Max. 10 Mo', hi: 'PNG, JPG, SVG या WebP · अधिकतम 10 MB', pt: 'PNG, JPG, SVG ou WebP · Máx. 10 MB', ja: 'PNG、JPG、SVG、WebP · 最大10MB' },
  dropHere: { en: 'Drop your logo here, or click to browse', es: 'Suelta tu logotipo aquí, o haz clic para explorar', zh: '将您的标志拖放到此处，或点击浏览', de: 'Logo hier ablegen oder klicken zum Durchsuchen', fr: 'Déposez votre logo ici ou cliquez pour parcourir', hi: 'अपना लोगो यहाँ छोड़ें, या ब्राउज़ करने के लिए क्लिक करें', pt: 'Solte seu logotipo aqui ou clique para procurar', ja: 'ここにロゴをドロップするかクリックして参照' },
  textMarkLabel: { en: 'Does your mark include any text or words? (optional)', es: '¿Tu marca incluye algún texto o palabras? (opcional)', zh: '您的商标是否包含文字？（可选）', de: 'Enthält Ihre Marke Text oder Wörter? (optional)', fr: 'Votre marque comprend-elle du texte ou des mots ? (facultatif)', hi: 'क्या आपके मार्क में कोई टेक्स्ट या शब्द शामिल हैं? (वैकल्पिक)', pt: 'Sua marca inclui algum texto ou palavras? (opcional)', ja: 'マークにテキストや言葉が含まれていますか？（任意）' },
  textMarkPlaceholder: { en: 'e.g. ACME, Wild Roots, 野兔...', es: 'p.ej. ACME, Wild Roots, Mi Marca...', zh: '例如：ACME、野兔、品牌名...', de: 'z.B. ACME, Wild Roots, Meine Marke...', fr: 'ex. ACME, Wild Roots, Ma Marque...', hi: 'उदा. ACME, Wild Roots, मेरा ब्रांड...', pt: 'ex. ACME, Wild Roots, Minha Marca...', ja: '例：ACME、Wild Roots、私のブランド...' },
  step2Title: { en: 'Goods & Services', es: 'Productos y Servicios', zh: '商品与服务', de: 'Waren und Dienstleistungen', fr: 'Produits et services', hi: 'सामान और सेवाएं', pt: 'Produtos e Serviços', ja: '商品・サービス' },
  goodsPlaceholder: { en: 'Describe your products or services...', es: 'Describe tus productos o servicios...', zh: '描述您的产品或服务...', de: 'Beschreiben Sie Ihre Waren oder Dienstleistungen...', fr: 'Décrivez vos produits ou services...', hi: 'अपने उत्पाद या सेवाओं का वर्णन करें...', pt: 'Descreva seus produtos ou serviços...', ja: '商品・サービスを説明してください...' },
  classesLabel: { en: 'Nice Classification Classes', es: 'Clases de Clasificación Niza', zh: '尼斯分类类别', de: 'Nizza-Klassifikationsklassen', fr: 'Classes de classification de Nice', hi: 'नाइस वर्गीकरण कक्षाएं', pt: 'Classes de Classificação de Nice', ja: 'ニース分類クラス' },
  searchBtn: { en: 'Search for Similar Marks', es: 'Buscar Marcas Similares', zh: '搜索相似商标', de: 'Ähnliche Marken suchen', fr: 'Rechercher des marques similaires', hi: 'समान मार्क खोजें', pt: 'Pesquisar Marcas Similares', ja: '類似商標を検索' },
  analyzing: { en: 'Analyzing your design...', es: 'Analizando tu diseño...', zh: '正在分析您的设计...', de: 'Design wird analysiert...', fr: 'Analyse de votre design...', hi: 'आपके डिज़ाइन का विश्लेषण हो रहा है...', pt: 'Analisando seu design...', ja: 'デザインを分析中...' },
  analyzingStep1: { en: 'AI Vision is identifying design elements and Vienna codes...', es: 'La IA de visión está identificando elementos del diseño y códigos de Viena...', zh: 'AI视觉正在识别设计元素和维也纳代码...', de: 'KI-Vision identifiziert Designelemente und Wien-Codes...', fr: "L'IA de vision identifie les éléments du design et les codes de Vienne...", hi: 'AI विज़न डिज़ाइन तत्वों और वियना कोड की पहचान कर रहा है...', pt: 'A IA de visão está identificando elementos de design e códigos de Viena...', ja: 'AI ビジョンがデザイン要素とウィーンコードを識別中...' },
  analyzingStep2: { en: 'Searching IMPI MARCia database for visually similar marks...', es: 'Buscando marcas visualmente similares en la base de datos IMPI MARCia...', zh: '在IMPI MARCia数据库中搜索视觉上相似的商标...', de: 'IMPI MARCia-Datenbank wird nach visuell ähnlichen Marken durchsucht...', fr: 'Recherche de marques visuellement similaires dans la base IMPI MARCia...', hi: 'IMPI MARCia डेटाबेस में दृश्य रूप से समान मार्क खोज रहे हैं...', pt: 'Pesquisando marcas visualmente similares na base IMPI MARCia...', ja: 'IMPI MARCiaデータベースで視覚的に類似した商標を検索中...' },
  analyzingStep3: { en: 'Generating risk assessment...', es: 'Generando evaluación de riesgo...', zh: '正在生成风险评估...', de: 'Risikobewertung wird erstellt...', fr: "Génération de l'évaluation des risques...", hi: 'जोखिम मूल्यांकन तैयार हो रहा है...', pt: 'Gerando avaliação de risco...', ja: 'リスク評価を生成中...' },
  viennaSectionTitle: { en: 'Design Elements Identified (Vienna Classification)', es: 'Elementos del Diseño Identificados (Clasificación de Viena)', zh: '已识别的设计元素（维也纳分类）', de: 'Erkannte Designelemente (Wiener Klassifikation)', fr: 'Éléments de design identifiés (Classification de Vienne)', hi: 'पहचाने गए डिज़ाइन तत्व (वियना वर्गीकरण)', pt: 'Elementos de Design Identificados (Classificação de Viena)', ja: '識別されたデザイン要素（ウィーン分類）' },
  findingsSectionTitle: { en: 'Similar Marks Found in IMPI Registry', es: 'Marcas Similares Encontradas en el Registro del IMPI', zh: '在IMPI注册中发现的相似商标', de: 'Ähnliche Marken im IMPI-Register gefunden', fr: 'Marques similaires trouvées dans le registre IMPI', hi: 'IMPI रजिस्ट्री में मिले समान मार्क', pt: 'Marcas Similares Encontradas no Registro IMPI', ja: 'IMPI登録で見つかった類似商標' },
  noFindings: { en: 'No visually similar marks found in the searched classes. This is a positive indicator for registrability.', es: 'No se encontraron marcas visualmente similares en las clases buscadas. Esto es un indicador positivo para el registro.', zh: '在搜索的类别中未找到视觉上相似的商标。这是可注册性的积极指标。', de: 'Keine visuell ähnlichen Marken in den gesuchten Klassen gefunden. Dies ist ein positiver Indikator für die Eintragungsfähigkeit.', fr: 'Aucune marque visuellement similaire trouvée dans les classes recherchées. Ceci est un indicateur positif pour la déposabilité.', hi: 'खोजी गई कक्षाओं में कोई दृश्य रूप से समान मार्क नहीं मिले। यह पंजीकरण योग्यता के लिए एक सकारात्मक संकेत है।', pt: 'Nenhuma marca visualmente similar encontrada nas classes pesquisadas. Isso é um indicador positivo para a registrabilidade.', ja: '検索したクラスで視覚的に類似した商標は見つかりませんでした。これは登録可能性の良い指標です。' },
  riskLow: { en: 'Low Risk', es: 'Riesgo Bajo', zh: '低风险', de: 'Niedriges Risiko', fr: 'Risque faible', hi: 'कम जोखिम', pt: 'Baixo Risco', ja: '低リスク' },
  riskMedium: { en: 'Medium Risk', es: 'Riesgo Medio', zh: '中等风险', de: 'Mittleres Risiko', fr: 'Risque moyen', hi: 'मध्यम जोखिम', pt: 'Risco Médio', ja: '中リスク' },
  riskHigh: { en: 'High Risk', es: 'Riesgo Alto', zh: '高风险', de: 'Hohes Risiko', fr: 'Risque élevé', hi: 'उच्च जोखिम', pt: 'Alto Risco', ja: '高リスク' },
  markTypeFigurative: { en: 'Figurative / Logo Mark', es: 'Marca Figurativa / Logotipo', zh: '图形/标志商标', de: 'Bildmarke / Logo', fr: 'Marque figurative / Logo', hi: 'आलंकारिक / लोगो मार्क', pt: 'Marca Figurativa / Logo', ja: '図形/ロゴ商標' },
  markTypeMixed: { en: 'Mixed Mark (Design + Text)', es: 'Marca Mixta (Diseño + Texto)', zh: '混合商标（图形+文字）', de: 'Kombinierte Marke (Design + Text)', fr: 'Marque mixte (design + texte)', hi: 'मिश्रित मार्क (डिज़ाइन + टेक्स्ट)', pt: 'Marca Mista (Design + Texto)', ja: '結合商標（図形＋文字）' },
  searchAgain: { en: 'Search Again', es: 'Buscar de Nuevo', zh: '重新搜索', de: 'Erneut suchen', fr: 'Rechercher à nouveau', hi: 'फिर से खोजें', pt: 'Pesquisar Novamente', ja: '再検索' },
  startFiling: { en: 'Start Trademark Filing', es: 'Iniciar Registro de Marca', zh: '开始商标注册', de: 'Markenanmeldung starten', fr: 'Déposer ma marque', hi: 'अभी आवेदन करें', pt: 'Iniciar Registro de Marca', ja: '商標出願を開始' },
  designDesc: { en: 'Design Description', es: 'Descripción del Diseño', zh: '设计描述', de: 'Designbeschreibung', fr: 'Description du design', hi: 'डिज़ाइन विवरण', pt: 'Descrição do Design', ja: 'デザインの説明' },
  total: { en: 'total in database', es: 'total en la base de datos', zh: '数据库总计', de: 'Gesamt in der Datenbank', fr: 'total dans la base de données', hi: 'डेटाबेस में कुल', pt: 'total no banco de dados', ja: 'データベース合計' },
  goodsSection: { en: 'Goods & Services', es: 'Productos & Servicios', zh: '商品与服务', de: 'Waren & DL', fr: 'Produits & services', hi: 'सामान और सेवाएं', pt: 'Produtos & Serviços', ja: '商品・サービス' },
  uploadNew: { en: 'Upload a different image', es: 'Subir una imagen diferente', zh: '上传不同的图片', de: 'Anderes Bild hochladen', fr: 'Télécharger une autre image', hi: 'एक अलग छवि अपलोड करें', pt: 'Fazer upload de outra imagem', ja: '別の画像をアップロード' },
  confidence: { en: 'confidence', es: 'confianza', zh: '置信度', de: 'Konfidenz', fr: 'confiance', hi: 'विश्वास', pt: 'confiança', ja: '信頼度' },
  errorTitle: { en: 'Search Failed', es: 'Búsqueda Fallida', zh: '搜索失败', de: 'Suche fehlgeschlagen', fr: 'Recherche échouée', hi: 'खोज विफल', pt: 'Pesquisa Falhou', ja: '検索失敗' },
  errorBody: { en: 'An error occurred while analyzing your design. Please try again.', es: 'Ocurrió un error al analizar tu diseño. Por favor intenta de nuevo.', zh: '分析您的设计时发生错误。请重试。', de: 'Beim Analysieren des Designs ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.', fr: "Une erreur s'est produite lors de l'analyse de votre design. Veuillez réessayer.", hi: 'आपके डिज़ाइन का विश्लेषण करते समय एक त्रुटि हुई। कृपया पुनः प्रयास करें।', pt: 'Ocorreu um erro ao analisar seu design. Por favor, tente novamente.', ja: 'デザインの分析中にエラーが発生しました。もう一度お試しください。' },
  showClasses: { en: 'Show all Nice classes', es: 'Mostrar todas las clases Niza', zh: '显示所有尼斯类别', de: 'Alle Nizza-Klassen anzeigen', fr: 'Afficher toutes les classes de Nice', hi: 'सभी नाइस कक्षाएं दिखाएं', pt: 'Mostrar todas as classes de Nice', ja: '全ニースクラスを表示' },
  hideClasses: { en: 'Hide class list', es: 'Ocultar lista de clases', zh: '隐藏类别列表', de: 'Klassenliste ausblenden', fr: 'Masquer la liste des classes', hi: 'कक्षा सूची छुपाएं', pt: 'Ocultar lista de classes', ja: 'クラスリストを非表示' },
  disclaimer: { en: 'Preliminary automated screening only. Not legal advice. Consult a trademark attorney before filing.', es: 'Solo una verificación preliminar automatizada. No es asesoría legal. Consulte a un especialista antes de presentar su solicitud.', zh: '仅为自动初步筛查，不构成法律建议。提交前请咨询商标代理人。', de: 'Nur automatisierte Vorprüfung. Keine Rechtsberatung. Konsultieren Sie vor der Anmeldung einen Markenanwalt.', fr: "Dépistage préliminaire automatisé uniquement. Pas de conseil juridique. Consultez un avocat spécialisé avant de déposer.", hi: 'केवल स्वचालित प्रारंभिक जांच। कानूनी सलाह नहीं। दाखिल करने से पहले ट्रेडमार्क वकील से सलाह लें।', pt: 'Apenas triagem preliminar automatizada. Não é aconselhamento jurídico. Consulte um advogado antes de protocolar.', ja: '自動化された予備的スクリーニングのみ。法的助言ではありません。出願前に商標弁護士に相談してください。' },
  viennaExplain: { en: 'The Vienna Classification system organizes figurative marks by visual elements. Our AI identified these categories in your design.', es: 'El sistema de Clasificación de Viena organiza las marcas figurativas por elementos visuales. Nuestra IA identificó estas categorías en tu diseño.', zh: '维也纳分类系统按视觉元素对图形商标进行分类。我们的AI在您的设计中识别出了这些类别。', de: 'Das Wiener Klassifikationssystem ordnet Bildmarken nach visuellen Elementen. Unsere KI hat diese Kategorien in Ihrem Design identifiziert.', fr: "Le système de classification de Vienne organise les marques figuratives par éléments visuels. Notre IA a identifié ces catégories dans votre design.", hi: 'वियना वर्गीकरण प्रणाली दृश्य तत्वों द्वारा आलंकारिक मार्कों को व्यवस्थित करती है। हमारी AI ने आपके डिज़ाइन में इन श्रेणियों की पहचान की।', pt: 'O sistema de Classificação de Viena organiza marcas figurativas por elementos visuais. Nossa IA identificou essas categorias no seu design.', ja: 'ウィーン分類システムは視覚的要素によって図形商標を分類します。AI がデザイン内のこれらのカテゴリーを識別しました。' },
};

interface ViennaCode {
  code: string;
  description: string;
  confidence: 'high' | 'medium' | 'low';
}

interface FigurativeFinding {
  name: string;
  status: string;
  classNum: string;
  holder: string;
  imageUrl?: string;
}

interface FigurativeResult {
  viennaCodes: ViennaCode[];
  designDescription: string;
  designDescription_en: string;
  marciaFindings: FigurativeFinding[];
  marciaTotalCount: number;
  marciaUrl: string;
  riskLevel: 'low' | 'medium' | 'high';
  riskSummary: string;
  riskSummary_en: string;
  markType: 'figurative' | 'mixed';
  disclaimer: string;
  textMarkName?: string;
}

type AnalysisStep = 'idle' | 'vision' | 'marcia' | 'risk' | 'done' | 'error';

const RISK_COLORS = {
  low: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-700' },
  medium: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', dot: 'bg-amber-500', badge: 'bg-amber-100 text-amber-700' },
  high: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', dot: 'bg-red-500', badge: 'bg-red-100 text-red-700' },
};

const CONFIDENCE_COLORS = {
  high: 'bg-emerald-100 text-emerald-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-gray-100 text-gray-500',
};

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip data URL prefix → keep only base64 payload
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function FigurativeSearchPage() {
  const { language } = useLanguage();
  const lang = language as Lang;

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [textMarkName, setTextMarkName] = useState('');
  const [goodsServices, setGoodsServices] = useState('');
  const [selectedClasses, setSelectedClasses] = useState<number[]>([]);
  const [showAllClasses, setShowAllClasses] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [analysisStep, setAnalysisStep] = useState<AnalysisStep>('idle');
  const [result, setResult] = useState<FigurativeResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;
    if (file.size > 10 * 1024 * 1024) return;
    setImageFile(file);
    setImagePreviewUrl(URL.createObjectURL(file));
    setResult(null);
    setAnalysisStep('idle');
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const toggleClass = (num: number) => {
    setSelectedClasses(prev =>
      prev.includes(num) ? prev.filter(c => c !== num) : [...prev, num]
    );
  };

  const handleSearch = async () => {
    if (!imageFile) return;
    setErrorMsg('');
    setResult(null);

    try {
      setAnalysisStep('vision');
      const base64 = await fileToBase64(imageFile);

      setAnalysisStep('marcia');
      const { data: { session } } = await supabase.auth.getSession();
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

      const res = await fetch(`${supabaseUrl}/functions/v1/verify-figurative`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token ?? supabaseAnonKey}`,
          'Apikey': supabaseAnonKey,
        },
        body: JSON.stringify({
          imageBase64: base64,
          mimeType: imageFile.type,
          classes: selectedClasses,
          language: lang,
          goodsServices,
          textMarkName: textMarkName.trim(),
        }),
      });

      setAnalysisStep('risk');

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error ?? `HTTP ${res.status}`);
      }

      const data: FigurativeResult = await res.json();
      setResult(data);
      setAnalysisStep('done');
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err) {
      console.error(err);
      setErrorMsg(err instanceof Error ? err.message : 'Unknown error');
      setAnalysisStep('error');
    }
  };

  const handleReset = () => {
    setResult(null);
    setAnalysisStep('idle');
    setErrorMsg('');
  };

  const isLoading = analysisStep === 'vision' || analysisStep === 'marcia' || analysisStep === 'risk';

  const goodsClasses = ALL_NICE_CLASSES.filter(c => c.num <= 34);
  const servicesClasses = ALL_NICE_CLASSES.filter(c => c.num >= 35);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="bg-[#1a2e1a] text-white pt-12 pb-10 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-3 py-1 mb-4">
            <ImageIcon size={12} className="text-emerald-300" />
            <span className="text-xs font-semibold text-emerald-300 tracking-wide uppercase">
              {lang === 'es' ? 'Nuevo · Búsqueda Figurativa' : lang === 'zh' ? '新功能 · 图形搜索' : lang === 'de' ? 'Neu · Bildmarkensuche' : lang === 'fr' ? 'Nouveau · Recherche figurative' : lang === 'pt' ? 'Novo · Pesquisa Figurativa' : lang === 'ja' ? '新機能 · 図形検索' : lang === 'hi' ? 'नया · चित्रात्मक खोज' : 'New · Figurative Search'}
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-3 leading-tight">
            {tr('pageTitle', lang)}
          </h1>
          <p className="text-sm sm:text-base text-white/70 max-w-2xl mx-auto leading-relaxed">
            {tr('pageSubtitle', lang)}
          </p>

          {/* How it works chips */}
          <div className="flex flex-wrap justify-center gap-2 mt-6">
            {[
              { icon: '🔍', label: lang === 'es' ? 'IA analiza tu diseño' : lang === 'zh' ? 'AI分析设计' : 'AI analyzes your design' },
              { icon: '🏷️', label: lang === 'es' ? 'Extrae códigos de Viena' : lang === 'zh' ? '提取维也纳代码' : 'Extracts Vienna codes' },
              { icon: '📋', label: lang === 'es' ? 'Busca en IMPI MARCia' : lang === 'zh' ? '搜索IMPI MARCia' : 'Searches IMPI MARCia' },
              { icon: '⚖️', label: lang === 'es' ? 'Evalúa el riesgo' : lang === 'zh' ? '评估风险' : 'Assesses risk' },
            ].map((chip, i) => (
              <div key={i} className="flex items-center gap-1.5 bg-white/10 rounded-full px-3 py-1 text-xs text-white/80">
                <span>{chip.icon}</span>
                <span>{chip.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">

        {/* ── Step 1: Upload ─────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-full bg-[#1a2e1a] text-white text-xs font-bold flex items-center justify-center flex-shrink-0">1</span>
            <h2 className="text-sm font-semibold text-gray-800">{tr('step1Title', lang)}</h2>
          </div>
          <div className="p-5 space-y-4">
            {/* Drop zone */}
            {!imageFile ? (
              <div
                className={`relative border-2 border-dashed rounded-xl transition-colors cursor-pointer ${
                  isDragging ? 'border-emerald-500 bg-emerald-50' : 'border-gray-300 hover:border-emerald-400 hover:bg-gray-50'
                }`}
                style={{ minHeight: 160 }}
                onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={onFileChange}
                />
                <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                  <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mb-3">
                    <Upload size={22} className="text-gray-400" />
                  </div>
                  <p className="text-sm font-medium text-gray-700 mb-1">{tr('dropHere', lang)}</p>
                  <p className="text-xs text-gray-400">{tr('step1Hint', lang)}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div className="w-24 h-24 rounded-lg border border-gray-200 bg-white overflow-hidden flex items-center justify-center flex-shrink-0 shadow-sm">
                  <img src={imagePreviewUrl!} alt="Preview" className="max-w-full max-h-full object-contain p-1" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{imageFile.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {imageFile.type.replace('image/', '').toUpperCase()} · {(imageFile.size / 1024).toFixed(0)} KB
                  </p>
                  <button
                    type="button"
                    onClick={() => { setImageFile(null); setImagePreviewUrl(null); setResult(null); setAnalysisStep('idle'); }}
                    className="mt-2 text-xs text-gray-500 hover:text-red-500 flex items-center gap-1 transition-colors"
                  >
                    <X size={11} /> {tr('uploadNew', lang)}
                  </button>
                </div>
              </div>
            )}

            {/* Optional text mark */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                {tr('textMarkLabel', lang)}
              </label>
              <input
                type="text"
                value={textMarkName}
                onChange={e => setTextMarkName(e.target.value)}
                placeholder={tr('textMarkPlaceholder', lang)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* ── Step 2: Goods & Services + Classes ───────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-full bg-[#1a2e1a] text-white text-xs font-bold flex items-center justify-center flex-shrink-0">2</span>
            <h2 className="text-sm font-semibold text-gray-800">{tr('step2Title', lang)}</h2>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                {tr('goodsSection', lang)}
              </label>
              <textarea
                value={goodsServices}
                onChange={e => setGoodsServices(e.target.value)}
                placeholder={tr('goodsPlaceholder', lang)}
                rows={2}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-colors resize-none"
              />
            </div>

            {/* Selected class chips */}
            {selectedClasses.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {selectedClasses.map(num => {
                  const cls = ALL_NICE_CLASSES.find(c => c.num === num);
                  return (
                    <span key={num} className="inline-flex items-center gap-1 bg-[#1a2e1a]/10 text-[#1a2e1a] text-xs font-semibold px-2 py-0.5 rounded-full">
                      <Tag size={9} />
                      {lang === 'es' ? `Cl. ${num} · ${cls?.titleEs}` : `Cl. ${num} · ${cls?.title}`}
                      <button type="button" onClick={() => toggleClass(num)} className="ml-0.5 hover:text-red-600 transition-colors"><X size={9} /></button>
                    </span>
                  );
                })}
              </div>
            )}

            {/* Class selector toggle */}
            <button
              type="button"
              onClick={() => setShowAllClasses(v => !v)}
              className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold hover:text-emerald-600 transition-colors"
            >
              {showAllClasses ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              {showAllClasses ? tr('hideClasses', lang) : tr('showClasses', lang)}
            </button>

            {showAllClasses && (
              <div className="space-y-3">
                {/* Goods */}
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                    {lang === 'es' ? 'Productos (Clases 1–34)' : 'Goods (Classes 1–34)'}
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
                    {goodsClasses.map(cls => (
                      <button
                        key={cls.num}
                        type="button"
                        onClick={() => toggleClass(cls.num)}
                        className={`text-left px-2 py-1.5 rounded-lg border text-[11px] transition-colors ${
                          selectedClasses.includes(cls.num)
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-800 font-semibold'
                            : 'border-gray-200 hover:border-emerald-300 hover:bg-gray-50 text-gray-600'
                        }`}
                      >
                        <span className="font-bold">{cls.num}</span> · {lang === 'es' ? cls.titleEs : cls.title}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Services */}
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                    {lang === 'es' ? 'Servicios (Clases 35–45)' : 'Services (Classes 35–45)'}
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
                    {servicesClasses.map(cls => (
                      <button
                        key={cls.num}
                        type="button"
                        onClick={() => toggleClass(cls.num)}
                        className={`text-left px-2 py-1.5 rounded-lg border text-[11px] transition-colors ${
                          selectedClasses.includes(cls.num)
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-800 font-semibold'
                            : 'border-gray-200 hover:border-emerald-300 hover:bg-gray-50 text-gray-600'
                        }`}
                      >
                        <span className="font-bold">{cls.num}</span> · {lang === 'es' ? cls.titleEs : cls.title}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Search button ─────────────────────────────────────────────── */}
        <button
          type="button"
          onClick={handleSearch}
          disabled={!imageFile || isLoading}
          className="w-full flex items-center justify-center gap-2 bg-[#1a2e1a] hover:bg-[#243d24] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-6 py-3.5 rounded-xl transition-colors shadow-md text-sm"
        >
          {isLoading ? (
            <><Loader2 size={16} className="animate-spin" />{tr('analyzing', lang)}</>
          ) : (
            <><Search size={15} />{tr('searchBtn', lang)}</>
          )}
        </button>

        {/* ── Loading progress ──────────────────────────────────────────── */}
        {isLoading && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <div className="space-y-3">
              {[
                { step: 'vision', label: tr('analyzingStep1', lang) },
                { step: 'marcia', label: tr('analyzingStep2', lang) },
                { step: 'risk',   label: tr('analyzingStep3', lang) },
              ].map(({ step, label }) => {
                const stepOrder = ['vision', 'marcia', 'risk'];
                const currentIdx = stepOrder.indexOf(analysisStep);
                const thisIdx = stepOrder.indexOf(step);
                const isDone = thisIdx < currentIdx;
                const isActive = thisIdx === currentIdx;
                return (
                  <div key={step} className={`flex items-center gap-3 transition-opacity ${!isDone && !isActive ? 'opacity-30' : 'opacity-100'}`}>
                    <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center">
                      {isDone ? (
                        <CheckCircle2 size={18} className="text-emerald-500" />
                      ) : isActive ? (
                        <Loader2 size={16} className="text-emerald-600 animate-spin" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border-2 border-gray-200" />
                      )}
                    </div>
                    <p className="text-xs text-gray-600">{label}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Error ─────────────────────────────────────────────────────── */}
        {analysisStep === 'error' && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex items-start gap-3">
            <AlertTriangle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-700">{tr('errorTitle', lang)}</p>
              <p className="text-xs text-red-600 mt-0.5">{errorMsg || tr('errorBody', lang)}</p>
              <button type="button" onClick={handleReset} className="mt-2 text-xs font-semibold text-red-700 underline">
                {tr('searchAgain', lang)}
              </button>
            </div>
          </div>
        )}

        {/* ── Results ───────────────────────────────────────────────────── */}
        {result && (
          <div ref={resultsRef} className="space-y-4">

            {/* Risk banner */}
            {(() => {
              const c = RISK_COLORS[result.riskLevel];
              return (
                <div className={`rounded-2xl border ${c.border} ${c.bg} p-5`}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-3 h-3 rounded-full ${c.dot} flex-shrink-0`} />
                    <span className={`text-sm font-bold ${c.text}`}>
                      {tr(`risk${result.riskLevel.charAt(0).toUpperCase() + result.riskLevel.slice(1)}` as keyof typeof copy, lang)}
                    </span>
                    <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full ${result.markType === 'mixed' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                      {result.markType === 'mixed' ? tr('markTypeMixed', lang) : tr('markTypeFigurative', lang)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{result.riskSummary}</p>
                </div>
              );
            })()}

            {/* Vienna codes */}
            {result.viennaCodes.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-5 py-3.5 border-b border-gray-100">
                  <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wide">{tr('viennaSectionTitle', lang)}</h3>
                  <p className="text-[11px] text-gray-500 mt-0.5">{tr('viennaExplain', lang)}</p>
                </div>
                <div className="p-4">
                  {/* Design description */}
                  {result.designDescription && (
                    <div className="mb-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{tr('designDesc', lang)}</p>
                      <p className="text-xs text-gray-600 leading-relaxed">{result.designDescription}</p>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {result.viennaCodes.map((vc, i) => (
                      <div key={i} className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                        <span className="text-xs font-bold text-[#1a2e1a] font-mono">{vc.code}</span>
                        <span className="text-xs text-gray-600">{vc.description}</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${CONFIDENCE_COLORS[vc.confidence]}`}>
                          {vc.confidence}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* MARCia findings */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wide">{tr('findingsSectionTitle', lang)}</h3>
                {result.marciaTotalCount > 0 && (
                  <span className="text-[10px] text-gray-400">
                    {result.marciaTotalCount} {tr('total', lang)}
                  </span>
                )}
              </div>
              <div className="p-4">
                {result.marciaFindings.length === 0 ? (
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-gray-600 leading-relaxed">{tr('noFindings', lang)}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {result.marciaFindings.slice(0, 8).map((f, i) => (
                      <div key={i} className="flex items-start gap-3 p-2.5 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                        {f.imageUrl ? (
                          <img src={f.imageUrl} alt={f.name} className="w-8 h-8 object-contain rounded border border-gray-100 flex-shrink-0" />
                        ) : (
                          <div className="w-8 h-8 rounded border border-gray-100 bg-gray-50 flex items-center justify-center flex-shrink-0">
                            <Shield size={12} className="text-gray-300" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-800 truncate">{f.name}</p>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            {f.classNum && (
                              <span className="text-[9px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-mono">
                                Cl. {f.classNum}
                              </span>
                            )}
                            <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${
                              f.status.toLowerCase().includes('reg') ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                            }`}>
                              {f.status}
                            </span>
                            {f.holder && <span className="text-[9px] text-gray-400 truncate max-w-[120px]">{f.holder}</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                    {result.marciaFindings.length > 8 && (
                      <p className="text-[10px] text-gray-400 text-center pt-1">
                        + {result.marciaFindings.length - 8} {lang === 'es' ? 'más resultados' : lang === 'zh' ? '更多结果' : 'more results'}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3 items-center justify-between">
              <button
                type="button"
                onClick={handleReset}
                className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-800 border border-gray-200 rounded-xl px-4 py-2.5 transition-colors"
              >
                <Search size={14} />
                {tr('searchAgain', lang)}
              </button>
              <Link
                to={`/apply${textMarkName ? `?mark=${encodeURIComponent(textMarkName)}` : ''}`}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors shadow-md text-sm animate-pulse hover:animate-none ring-2 ring-emerald-400 ring-offset-2"
              >
                <FileText size={14} />
                {tr('startFiling', lang)}
                <ArrowRight size={14} />
              </Link>
            </div>

            {/* Disclaimer */}
            <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-xl border border-gray-100">
              <Info size={12} className="text-gray-400 flex-shrink-0 mt-0.5" />
              <p className="text-[10px] text-gray-400 leading-relaxed">{result.disclaimer || tr('disclaimer', lang)}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
