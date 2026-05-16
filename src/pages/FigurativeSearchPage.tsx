import { useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Upload, X, Image as ImageIcon, Search, Loader2, AlertTriangle,
  CheckCircle2, Info, FileText, ArrowRight, Shield, Tag,
  ChevronDown, ChevronUp, Type, Layers,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { supabase } from '../lib/supabase';

type Lang = 'en' | 'zh' | 'es' | 'de' | 'fr' | 'hi' | 'pt' | 'ja';
type SearchMode = 'image-only' | 'mixed' | 'text-only';

function tr(key: string, lang: Lang): string {
  return copy[key]?.[lang] ?? copy[key]?.['en'] ?? key;
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

// ── Translations ───────────────────────────────────────────────────────────────
const copy: Record<string, Partial<Record<Lang, string>>> = {
  pageTitle: { en: 'Figurative & Design Trademark Search', es: 'Búsqueda de Marca Figurativa y de Diseño', zh: '图形与设计商标检索', de: 'Bild- und Designmarkenrecherche', fr: 'Recherche de marque figurative et de design', hi: 'चित्रात्मक और डिज़ाइन ट्रेडमार्क खोज', pt: 'Pesquisa de Marca Figurativa e de Design', ja: '図形・デザイン商標調査' },
  pageSubtitle: { en: 'Search the IMPI MARCia database using your logo, a text mark, or both — powered by GPT-5.4 vision and the IMPI playbook analytical framework.', es: 'Busca en la base de datos IMPI MARCia usando tu logotipo, una marca de texto, o ambos — impulsado por visión GPT-5.4 y el marco analítico del reglamento IMPI.', zh: '使用您的标志、文字商标或两者在IMPI MARCia数据库中搜索 — 由GPT-5.4视觉和IMPI分析框架驱动。', de: 'Durchsuchen Sie die IMPI MARCia-Datenbank mit Ihrem Logo, einer Wortmarke oder beidem — unterstützt von GPT-5.4 Vision und dem IMPI-Analyserahmen.', fr: "Recherchez dans la base IMPI MARCia en utilisant votre logo, une marque textuelle, ou les deux — propulsé par la vision GPT-5.4 et le cadre analytique IMPI.", hi: 'GPT-5.4 विज़न और IMPI विश्लेषणात्मक ढांचे द्वारा संचालित — अपने लोगो, टेक्स्ट मार्क, या दोनों का उपयोग करके IMPI MARCia डेटाबेस खोजें।', pt: 'Pesquise na base IMPI MARCia usando seu logotipo, uma marca textual, ou ambos — impulsionado por visão GPT-5.4 e o framework analítico IMPI.', ja: 'GPT-5.4ビジョンとIMPIフレームワークを活用して、ロゴ・文字商標・またはその両方でIMPI MARCiaデータベースを検索します。' },

  modeImageOnly: { en: 'Logo / Image Only', es: 'Solo Logo / Imagen', zh: '仅图形', de: 'Nur Logo / Bild', fr: 'Logo / Image seulement', hi: 'केवल लोगो / छवि', pt: 'Apenas Logo / Imagem', ja: 'ロゴ/画像のみ' },
  modeMixed: { en: 'Image + Text (Mixed Mark)', es: 'Imagen + Texto (Marca Mixta)', zh: '图形+文字（混合商标）', de: 'Bild + Text (Kombinierte Marke)', fr: 'Image + Texte (Marque mixte)', hi: 'छवि + टेक्स्ट (मिश्रित मार्क)', pt: 'Imagem + Texto (Marca Mista)', ja: '画像＋文字（結合商標）' },
  modeTextOnly: { en: 'Text / Word Mark Only', es: 'Solo Texto / Marca Denominativa', zh: '仅文字商标', de: 'Nur Text / Wortmarke', fr: 'Texte / Marque verbale seulement', hi: 'केवल टेक्स्ट / शब्द मार्क', pt: 'Apenas Texto / Marca Nominativa', ja: '文字商標のみ' },
  modeImageDesc: { en: 'Upload your logo and search by Vienna Classification codes', es: 'Sube tu logotipo y busca por códigos de Clasificación de Viena', zh: '上传标志并按维也纳分类代码搜索', de: 'Logo hochladen und nach Wiener Klassifikationscodes suchen', fr: 'Téléchargez votre logo et recherchez par codes de classification de Vienne', hi: 'अपना लोगो अपलोड करें और वियना वर्गीकरण कोड द्वारा खोजें', pt: 'Faça upload do logo e pesquise por códigos de Classificação de Viena', ja: 'ロゴをアップロードしてウィーン分類コードで検索' },
  modeMixedDesc: { en: 'Upload logo + enter text component for complete mixed mark analysis', es: 'Sube logotipo + ingresa texto para análisis completo de marca mixta', zh: '上传标志+输入文字进行完整混合商标分析', de: 'Logo hochladen + Text eingeben für vollständige kombinierte Markenanalyse', fr: 'Logo + texte pour une analyse complète de marque mixte', hi: 'पूर्ण मिश्रित मार्क विश्लेषण के लिए लोगो अपलोड + टेक्स्ट दर्ज करें', pt: 'Faça upload do logo + insira texto para análise completa de marca mista', ja: 'ロゴをアップロード＋テキストを入力して混合商標の完全分析' },
  modeTextDesc: { en: 'Enter a word mark and search MARCia by text query', es: 'Ingresa una marca denominativa y busca en MARCia por texto', zh: '输入文字商标并通过文本查询搜索MARCia', de: 'Wortmarke eingeben und MARCia per Textsuche durchsuchen', fr: 'Entrez une marque verbale et recherchez dans MARCia par texte', hi: 'एक शब्द मार्क दर्ज करें और टेक्स्ट क्वेरी द्वारा MARCia खोजें', pt: 'Digite uma marca nominativa e pesquise no MARCia por texto', ja: '文字商標を入力してテキストクエリでMARCiaを検索' },

  step1Upload: { en: 'Upload Your Design', es: 'Sube tu Diseño', zh: '上传您的设计', de: 'Design hochladen', fr: 'Télécharger votre design', hi: 'अपना डिज़ाइन अपलोड करें', pt: 'Fazer upload do Design', ja: 'デザインをアップロード' },
  step1Hint: { en: 'PNG, JPG, SVG or WebP · Max 10 MB', es: 'PNG, JPG, SVG o WebP · Máx. 10 MB', zh: 'PNG、JPG、SVG 或 WebP · 最大 10 MB', de: 'PNG, JPG, SVG oder WebP · Max. 10 MB', fr: 'PNG, JPG, SVG ou WebP · Max. 10 Mo', hi: 'PNG, JPG, SVG या WebP · अधिकतम 10 MB', pt: 'PNG, JPG, SVG ou WebP · Máx. 10 MB', ja: 'PNG、JPG、SVG、WebP · 最大10MB' },
  dropHere: { en: 'Drop your logo here, or click to browse', es: 'Suelta tu logotipo aquí, o haz clic para explorar', zh: '将标志拖放到此处，或点击浏览', de: 'Logo hier ablegen oder klicken', fr: 'Déposez votre logo ici ou cliquez', hi: 'लोगो यहाँ छोड़ें या क्लिक करें', pt: 'Solte o logo aqui ou clique', ja: 'ロゴをドロップまたはクリック' },
  uploadNew: { en: 'Use a different image', es: 'Usar una imagen diferente', zh: '使用不同图片', de: 'Anderes Bild verwenden', fr: 'Utiliser une autre image', hi: 'अलग छवि उपयोग करें', pt: 'Usar outra imagem', ja: '別の画像を使用' },

  textMarkLabel: { en: 'Text / Word component of mark', es: 'Componente de texto de la marca', zh: '商标文字部分', de: 'Text-/Wortbestandteil der Marke', fr: 'Composante textuelle de la marque', hi: 'मार्क का टेक्स्ट/शब्द भाग', pt: 'Componente textual da marca', ja: '商標のテキスト/文字部分' },
  textMarkLabelTextOnly: { en: 'Trademark Name', es: 'Nombre de la Marca', zh: '商标名称', de: 'Markenname', fr: 'Nom de la marque', hi: 'ट्रेडमार्क नाम', pt: 'Nome da Marca', ja: '商標名' },
  textMarkPlaceholder: { en: 'e.g. ACME, Wild Roots...', es: 'p.ej. ACME, Wild Roots, Mi Marca...', zh: '例如：ACME、野兔...', de: 'z.B. ACME, Wild Roots...', fr: 'ex. ACME, Wild Roots...', hi: 'उदा. ACME, Wild Roots...', pt: 'ex. ACME, Wild Roots...', ja: '例：ACME、Wild Roots...' },

  step2Title: { en: 'Goods & Services + Classes', es: 'Productos, Servicios y Clases', zh: '商品、服务和类别', de: 'Waren, Dienstleistungen und Klassen', fr: 'Produits, services et classes', hi: 'सामान, सेवाएं और कक्षाएं', pt: 'Produtos, Serviços e Classes', ja: '商品・サービスとクラス' },
  goodsPlaceholder: { en: 'Describe your products or services...', es: 'Describe tus productos o servicios...', zh: '描述您的产品或服务...', de: 'Waren oder Dienstleistungen beschreiben...', fr: 'Décrivez vos produits ou services...', hi: 'अपने उत्पाद या सेवाओं का वर्णन करें...', pt: 'Descreva seus produtos ou serviços...', ja: '商品・サービスを説明...' },
  showClasses: { en: 'Select Nice classes', es: 'Seleccionar clases Niza', zh: '选择尼斯类别', de: 'Nizza-Klassen wählen', fr: 'Sélectionner les classes de Nice', hi: 'नाइस कक्षाएं चुनें', pt: 'Selecionar classes de Nice', ja: 'ニースクラスを選択' },
  hideClasses: { en: 'Hide class list', es: 'Ocultar clases', zh: '隐藏类别', de: 'Klassen ausblenden', fr: 'Masquer les classes', hi: 'कक्षाएं छुपाएं', pt: 'Ocultar classes', ja: 'クラスを非表示' },

  searchBtn: { en: 'Run Clearance Search', es: 'Ejecutar Búsqueda de Disponibilidad', zh: '运行可用性搜索', de: 'Recherche starten', fr: 'Lancer la recherche', hi: 'क्लीयरेंस खोज चलाएं', pt: 'Executar Pesquisa de Disponibilidade', ja: 'クリアランス検索を実行' },
  analyzing: { en: 'Analyzing...', es: 'Analizando...', zh: '分析中...', de: 'Wird analysiert...', fr: 'Analyse en cours...', hi: 'विश्लेषण हो रहा है...', pt: 'Analisando...', ja: '分析中...' },
  stepVision: { en: 'GPT-5.4 Vision identifying design elements & Vienna codes...', es: 'GPT-5.4 Vision identificando elementos de diseño y códigos de Viena...', zh: 'GPT-5.4视觉识别设计元素和维也纳代码...', de: 'GPT-5.4 Vision identifiziert Designelemente und Wien-Codes...', fr: 'GPT-5.4 Vision identifie les éléments de design et codes de Vienne...', hi: 'GPT-5.4 विज़न डिज़ाइन तत्वों और वियना कोड की पहचान कर रहा है...', pt: 'GPT-5.4 Vision identificando elementos de design e códigos de Viena...', ja: 'GPT-5.4ビジョンがデザイン要素とウィーンコードを識別中...' },
  stepMarcia: { en: 'Searching IMPI MARCia database...', es: 'Buscando en base de datos IMPI MARCia...', zh: '搜索IMPI MARCia数据库...', de: 'IMPI MARCia-Datenbank wird durchsucht...', fr: 'Recherche dans la base IMPI MARCia...', hi: 'IMPI MARCia डेटाबेस खोज रहे हैं...', pt: 'Pesquisando na base IMPI MARCia...', ja: 'IMPI MARCiaデータベースを検索中...' },
  stepRisk: { en: 'Generating playbook risk analysis & scores...', es: 'Generando análisis de riesgo y puntuaciones del reglamento...', zh: '生成规则手册风险分析和评分...', de: 'Risikoanalyse und Bewertungen werden generiert...', fr: "Génération de l'analyse de risque et des scores...", hi: 'प्लेबुक जोखिम विश्लेषण और स्कोर तैयार हो रहे हैं...', pt: 'Gerando análise de risco e pontuações do manual...', ja: 'プレイブックリスク分析とスコアを生成中...' },

  // Scorecard
  scoreDistinctiveness: { en: 'Distinctiveness', es: 'Distintividad', zh: '显著性', de: 'Unterscheidungskraft', fr: 'Distinctivité', hi: 'विशिष्टता', pt: 'Distintividade', ja: '識別力' },
  scoreSimilarityRisk: { en: 'Similarity Risk', es: 'Riesgo de Similitud', zh: '相似风险', de: 'Ähnlichkeitsrisiko', fr: 'Risque de similarité', hi: 'समानता जोखिम', pt: 'Risco de Similaridade', ja: '類似リスク' },
  scoreRegistrability: { en: 'Registrability', es: 'Registrabilidad', zh: '可注册性', de: 'Eintragungsfähigkeit', fr: 'Registrabilité', hi: 'पंजीकरण योग्यता', pt: 'Registrabilidade', ja: '登録可能性' },
  scoreObjection: { en: 'IMPI Objection Risk', es: 'Riesgo de Objeción IMPI', zh: 'IMPI异议风险', de: 'IMPI-Einspruchsrisiko', fr: "Risque d'objection IMPI", hi: 'IMPI आपत्ति जोखिम', pt: 'Risco de Objeção IMPI', ja: 'IMPI異議リスク' },

  riskLevelLow: { en: 'Low Risk', es: 'Riesgo Bajo', zh: '低风险', de: 'Niedriges Risiko', fr: 'Risque faible', hi: 'कम जोखिम', pt: 'Baixo Risco', ja: '低リスク' },
  riskLevelModerate: { en: 'Moderate Risk', es: 'Riesgo Moderado', zh: '中等风险', de: 'Moderates Risiko', fr: 'Risque modéré', hi: 'मध्यम जोखिम', pt: 'Risco Moderado', ja: '中リスク' },
  riskLevelHigh: { en: 'High Risk', es: 'Riesgo Alto', zh: '高风险', de: 'Hohes Risiko', fr: 'Risque élevé', hi: 'उच्च जोखिम', pt: 'Alto Risco', ja: '高リスク' },
  riskLevelSevere: { en: 'Severe Risk', es: 'Riesgo Severo', zh: '严重风险', de: 'Schwerwiegendes Risiko', fr: 'Risque sévère', hi: 'गंभीर जोखिम', pt: 'Risco Grave', ja: '重大リスク' },

  escalationAlert: { en: 'Attorney Review Recommended', es: 'Se Recomienda Revisión de Abogado', zh: '建议律师审核', de: 'Anwaltsüberprüfung empfohlen', fr: "Révision par un avocat recommandée", hi: 'वकील समीक्षा की अनुशंसा', pt: 'Revisão por Advogado Recomendada', ja: '弁護士によるレビューを推奨' },
  escalationBody: { en: 'This analysis triggered mandatory human review criteria. An attorney should assess before filing.', es: 'Este análisis activó criterios de revisión humana obligatoria. Un abogado debe evaluar antes de presentar.', zh: '此分析触发了强制人工审核标准。提交前应由律师评估。', de: 'Diese Analyse hat Kriterien für eine obligatorische Überprüfung durch Fachleute ausgelöst. Ein Anwalt sollte vor der Anmeldung prüfen.', fr: "Cette analyse a déclenché des critères de révision humaine obligatoire. Un avocat doit évaluer avant le dépôt.", hi: 'इस विश्लेषण ने अनिवार्य मानव समीक्षा मानदंड को सक्रिय किया। दाखिल करने से पहले एक वकील को मूल्यांकन करना चाहिए।', pt: 'Esta análise acionou critérios de revisão humana obrigatória. Um advogado deve avaliar antes do protocolo.', ja: 'この分析は必須の人間によるレビュー基準を引き起こしました。出願前に弁護士が評価すべきです。' },

  viennaTitle: { en: 'Design Elements — Vienna Classification', es: 'Elementos de Diseño — Clasificación de Viena', zh: '设计元素 — 维也纳分类', de: 'Designelemente — Wiener Klassifikation', fr: 'Éléments de design — Classification de Vienne', hi: 'डिज़ाइन तत्व — वियना वर्गीकरण', pt: 'Elementos de Design — Classificação de Viena', ja: 'デザイン要素 — ウィーン分類' },
  designDescLabel: { en: 'Design Description', es: 'Descripción del Diseño', zh: '设计描述', de: 'Designbeschreibung', fr: 'Description du design', hi: 'डिज़ाइन विवरण', pt: 'Descrição do Design', ja: 'デザインの説明' },
  silhouetteLabel: { en: 'Silhouette Analysis', es: 'Análisis de Silueta', zh: '轮廓分析', de: 'Silhouettenanalyse', fr: 'Analyse de silhouette', hi: 'सिल्हूट विश्लेषण', pt: 'Análise de Silhueta', ja: 'シルエット分析' },
  dominantLabel: { en: 'Dominant Elements', es: 'Elementos Dominantes', zh: '主导元素', de: 'Dominante Elemente', fr: 'Éléments dominants', hi: 'प्रमुख तत्व', pt: 'Elementos Dominantes', ja: '支配的要素' },
  styleLabel: { en: 'Visual Style', es: 'Estilo Visual', zh: '视觉风格', de: 'Visueller Stil', fr: 'Style visuel', hi: 'दृश्य शैली', pt: 'Estilo Visual', ja: 'ビジュアルスタイル' },
  saturationLabel: { en: 'Industry Saturation', es: 'Saturación del Sector', zh: '行业饱和度', de: 'Branchensättigung', fr: 'Saturation du secteur', hi: 'उद्योग संतृप्ति', pt: 'Saturação do Setor', ja: '業界飽和度' },
  riskFactorsLabel: { en: 'Risk Factors', es: 'Factores de Riesgo', zh: '风险因素', de: 'Risikofaktoren', fr: 'Facteurs de risque', hi: 'जोखिम कारक', pt: 'Fatores de Risco', ja: 'リスク要因' },
  recommendationLabel: { en: 'Recommendation', es: 'Recomendación', zh: '建议', de: 'Empfehlung', fr: 'Recommandation', hi: 'सिफारिश', pt: 'Recomendação', ja: '推奨事項' },

  findingsTitle: { en: 'Similar Marks Found in IMPI Registry', es: 'Marcas Similares en el Registro IMPI', zh: 'IMPI注册中发现的相似商标', de: 'Ähnliche Marken im IMPI-Register', fr: 'Marques similaires dans le registre IMPI', hi: 'IMPI रजिस्ट्री में मिले समान मार्क', pt: 'Marcas Similares no Registro IMPI', ja: 'IMPI登録で見つかった類似商標' },
  noFindings: { en: 'No similar marks found in the searched classes. This is a positive indicator for registrability.', es: 'No se encontraron marcas similares en las clases buscadas. Esto es un indicador positivo para el registro.', zh: '在搜索的类别中未找到相似商标。这是可注册性的积极指标。', de: 'Keine ähnlichen Marken in den gesuchten Klassen gefunden. Dies ist ein positiver Indikator für die Eintragungsfähigkeit.', fr: 'Aucune marque similaire trouvée dans les classes recherchées. Ceci est un indicateur positif pour la déposabilité.', hi: 'खोजी गई कक्षाओं में कोई समान मार्क नहीं मिले। यह पंजीकरण योग्यता के लिए सकारात्मक है।', pt: 'Nenhuma marca similar encontrada nas classes pesquisadas. Isso é um indicador positivo para a registrabilidade.', ja: '検索したクラスで類似商標は見つかりませんでした。これは登録可能性の良い指標です。' },
  totalInDB: { en: 'total in database', es: 'total en la base de datos', zh: '数据库总计', de: 'Gesamt in der Datenbank', fr: 'total dans la base de données', hi: 'डेटाबेस में कुल', pt: 'total no banco de dados', ja: 'データベース合計' },

  searchAgain: { en: 'New Search', es: 'Nueva Búsqueda', zh: '新搜索', de: 'Neue Suche', fr: 'Nouvelle recherche', hi: 'नई खोज', pt: 'Nova Pesquisa', ja: '新しい検索' },
  startFiling: { en: 'Start Trademark Filing', es: 'Iniciar Registro de Marca', zh: '开始商标注册', de: 'Markenanmeldung starten', fr: 'Déposer ma marque', hi: 'अभी आवेदन करें', pt: 'Iniciar Registro de Marca', ja: '商標出願を開始' },

  errorTitle: { en: 'Search Failed', es: 'Búsqueda Fallida', zh: '搜索失败', de: 'Suche fehlgeschlagen', fr: 'Recherche échouée', hi: 'खोज विफल', pt: 'Pesquisa Falhou', ja: '検索失敗' },
  errorBody: { en: 'An error occurred. Please try again.', es: 'Ocurrió un error. Por favor intenta de nuevo.', zh: '发生错误，请重试。', de: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.', fr: "Une erreur s'est produite. Veuillez réessayer.", hi: 'एक त्रुटि हुई। कृपया पुनः प्रयास करें।', pt: 'Ocorreu um erro. Por favor, tente novamente.', ja: 'エラーが発生しました。もう一度お試しください。' },
};

// ── Types mirroring edge function output ───────────────────────────────────────
interface ViennaCode { code: string; description: string; confidence: 'high' | 'medium' | 'low' }
interface FigurativeFinding { name: string; status: string; classNum: string; holder: string; imageUrl?: string }
interface PlaybookScores {
  distinctivenessScore: number;
  similarityRiskScore: number;
  registrabilityProbability: number;
  impiObjectionProbability: number;
  riskLevel: 'Low' | 'Moderate' | 'High' | 'Severe';
  dominantElements: string[];
  visualStyle: string;
  silhouetteDescription: string;
  industrySaturation: 'low' | 'medium' | 'high';
  isDecorativeRisk: boolean;
  riskFactors: string[];
  escalationRequired: boolean;
  recommendation: string;
  riskSummary: string;
  riskSummary_en: string;
}
interface FigurativeResult {
  markType: 'image-only' | 'mixed' | 'text-only';
  viennaCodes: ViennaCode[];
  designDescription: string;
  designDescription_en: string;
  scores: PlaybookScores;
  marciaFindings: FigurativeFinding[];
  marciaTotalCount: number;
  marciaUrl: string;
  disclaimer: string;
  textMarkName?: string;
}

// ── Visual helpers ─────────────────────────────────────────────────────────────
const RISK_STYLES = {
  Low:      { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-500', bar: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-700' },
  Moderate: { bg: 'bg-amber-50',   border: 'border-amber-200',   text: 'text-amber-700',   dot: 'bg-amber-500',   bar: 'bg-amber-500',   badge: 'bg-amber-100 text-amber-700' },
  High:     { bg: 'bg-orange-50',  border: 'border-orange-200',  text: 'text-orange-700',  dot: 'bg-orange-500',  bar: 'bg-orange-500',  badge: 'bg-orange-100 text-orange-700' },
  Severe:   { bg: 'bg-red-50',     border: 'border-red-200',     text: 'text-red-700',     dot: 'bg-red-500',     bar: 'bg-red-500',     badge: 'bg-red-100 text-red-700' },
};
const CONFIDENCE_COLORS = { high: 'bg-emerald-100 text-emerald-700', medium: 'bg-amber-100 text-amber-700', low: 'bg-gray-100 text-gray-500' };
const SAT_COLORS = { low: 'bg-emerald-100 text-emerald-700', medium: 'bg-amber-100 text-amber-700', high: 'bg-red-100 text-red-700' };

// Score bar: color depends on whether higher is better or worse
function ScoreBar({ value, higherIsGood = true }: { value: number; higherIsGood?: boolean }) {
  const pct = Math.min(100, Math.max(0, value));
  let color = 'bg-gray-300';
  if (higherIsGood) {
    color = pct >= 66 ? 'bg-emerald-500' : pct >= 33 ? 'bg-amber-500' : 'bg-red-500';
  } else {
    color = pct <= 33 ? 'bg-emerald-500' : pct <= 66 ? 'bg-amber-500' : 'bg-red-500';
  }
  return (
    <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1.5">
      <div className={`h-1.5 rounded-full transition-all duration-700 ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ── Component ──────────────────────────────────────────────────────────────────
export default function FigurativeSearchPage() {
  const { language } = useLanguage();
  const lang = language as Lang;

  const [mode, setMode] = useState<SearchMode>('image-only');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [textMarkName, setTextMarkName] = useState('');
  const [goodsServices, setGoodsServices] = useState('');
  const [selectedClasses, setSelectedClasses] = useState<number[]>([]);
  const [showAllClasses, setShowAllClasses] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [loadingStep, setLoadingStep] = useState<'idle' | 'vision' | 'marcia' | 'risk' | 'done' | 'error'>('idle');
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
    setLoadingStep('idle');
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

  const handleModeChange = (m: SearchMode) => {
    setMode(m);
    setResult(null);
    setLoadingStep('idle');
    setErrorMsg('');
  };

  const toggleClass = (num: number) =>
    setSelectedClasses(prev => prev.includes(num) ? prev.filter(c => c !== num) : [...prev, num]);

  const canSearch = () => {
    if (mode === 'image-only') return !!imageFile;
    if (mode === 'mixed') return !!imageFile && textMarkName.trim().length > 0;
    return textMarkName.trim().length > 0;
  };

  const handleSearch = async () => {
    if (!canSearch()) return;
    setErrorMsg('');
    setResult(null);

    try {
      const hasImage = mode !== 'text-only' && imageFile;
      if (hasImage) setLoadingStep('vision');
      else setLoadingStep('marcia');

      const base64 = hasImage ? await fileToBase64(imageFile!) : '';
      if (hasImage) setLoadingStep('marcia');

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
          mimeType: imageFile?.type ?? 'image/png',
          classes: selectedClasses,
          language: lang,
          goodsServices,
          textMarkName: textMarkName.trim(),
        }),
      });

      setLoadingStep('risk');

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error((errData as { error?: string }).error ?? `HTTP ${res.status}`);
      }

      const data: FigurativeResult = await res.json();
      setResult(data);
      setLoadingStep('done');
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unknown error');
      setLoadingStep('error');
    }
  };

  const isLoading = ['vision', 'marcia', 'risk'].includes(loadingStep);
  const goodsClasses = ALL_NICE_CLASSES.filter(c => c.num <= 34);
  const servicesClasses = ALL_NICE_CLASSES.filter(c => c.num >= 35);

  const riskLabel = (level: PlaybookScores['riskLevel']) =>
    tr(`riskLevel${level}` as keyof typeof copy, lang);

  const TABS: { mode: SearchMode; icon: React.ReactNode; label: string; desc: string }[] = [
    { mode: 'image-only', icon: <ImageIcon size={14} />, label: tr('modeImageOnly', lang), desc: tr('modeImageDesc', lang) },
    { mode: 'mixed',      icon: <Layers size={14} />,    label: tr('modeMixed', lang),     desc: tr('modeMixedDesc', lang) },
    { mode: 'text-only',  icon: <Type size={14} />,      label: tr('modeTextOnly', lang),  desc: tr('modeTextDesc', lang) },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section className="bg-[#1a2e1a] text-white pt-12 pb-10 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-3 py-1 mb-4">
            <ImageIcon size={11} className="text-emerald-300" />
            <span className="text-[11px] font-bold text-emerald-300 tracking-widest uppercase">
              {lang === 'es' ? 'Búsqueda Figurativa · GPT-5.4' : lang === 'zh' ? '图形商标 · GPT-5.4' : lang === 'de' ? 'Bildmarkensuche · GPT-5.4' : lang === 'fr' ? 'Recherche figurative · GPT-5.4' : lang === 'pt' ? 'Pesquisa Figurativa · GPT-5.4' : lang === 'ja' ? '図形商標 · GPT-5.4' : lang === 'hi' ? 'चित्रात्मक खोज · GPT-5.4' : 'Figurative Search · GPT-5.4'}
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-3 leading-tight">{tr('pageTitle', lang)}</h1>
          <p className="text-sm sm:text-base text-white/70 max-w-2xl mx-auto leading-relaxed">{tr('pageSubtitle', lang)}</p>
          <div className="flex flex-wrap justify-center gap-2 mt-5">
            {(['Distinctiveness §3', 'Silhouette §4', 'Dominant Elements §5', 'Consumer Perception §7', 'Industry Saturation §9'] as const).map(chip => (
              <span key={chip} className="text-[10px] bg-white/10 text-white/70 rounded-full px-2.5 py-1">{chip}</span>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-5">

        {/* ── Mode selector tabs ───────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="grid grid-cols-3 divide-x divide-gray-100">
            {TABS.map(tab => (
              <button
                key={tab.mode}
                type="button"
                onClick={() => handleModeChange(tab.mode)}
                className={`flex flex-col items-center gap-1.5 px-3 py-4 transition-colors text-center ${
                  mode === tab.mode
                    ? 'bg-[#1a2e1a] text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span className={mode === tab.mode ? 'text-emerald-300' : 'text-gray-400'}>{tab.icon}</span>
                <span className="text-[11px] font-bold leading-tight">{tab.label}</span>
                <span className={`text-[9px] leading-tight hidden sm:block ${mode === tab.mode ? 'text-white/60' : 'text-gray-400'}`}>{tab.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Step 1: Upload (image modes) ─────────────────────────────── */}
        {mode !== 'text-only' && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-full bg-[#1a2e1a] text-white text-xs font-bold flex items-center justify-center flex-shrink-0">1</span>
              <h2 className="text-sm font-semibold text-gray-800">{tr('step1Upload', lang)}</h2>
            </div>
            <div className="p-5 space-y-4">
              {!imageFile ? (
                <div
                  className={`relative border-2 border-dashed rounded-xl transition-colors cursor-pointer ${
                    isDragging ? 'border-emerald-500 bg-emerald-50' : 'border-gray-300 hover:border-emerald-400 hover:bg-gray-50'
                  }`}
                  style={{ minHeight: 150 }}
                  onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={onDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
                  <div className="flex flex-col items-center justify-center py-9 px-4 text-center">
                    <div className="w-11 h-11 rounded-xl bg-gray-100 flex items-center justify-center mb-3">
                      <Upload size={20} className="text-gray-400" />
                    </div>
                    <p className="text-sm font-medium text-gray-700 mb-1">{tr('dropHere', lang)}</p>
                    <p className="text-xs text-gray-400">{tr('step1Hint', lang)}</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="w-20 h-20 rounded-lg border border-gray-200 bg-white overflow-hidden flex items-center justify-center flex-shrink-0 shadow-sm">
                    <img src={imagePreviewUrl!} alt="Preview" className="max-w-full max-h-full object-contain p-1" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{imageFile.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{imageFile.type.replace('image/', '').toUpperCase()} · {(imageFile.size / 1024).toFixed(0)} KB</p>
                    <button type="button" onClick={() => { setImageFile(null); setImagePreviewUrl(null); }} className="mt-2 text-xs text-gray-400 hover:text-red-500 flex items-center gap-1 transition-colors">
                      <X size={10} /> {tr('uploadNew', lang)}
                    </button>
                  </div>
                </div>
              )}

              {/* Text component for mixed mode */}
              {mode === 'mixed' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">{tr('textMarkLabel', lang)}</label>
                  <input
                    type="text"
                    value={textMarkName}
                    onChange={e => setTextMarkName(e.target.value)}
                    placeholder={tr('textMarkPlaceholder', lang)}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-colors"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Text mark input (text-only mode) ────────────────────────── */}
        {mode === 'text-only' && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-full bg-[#1a2e1a] text-white text-xs font-bold flex items-center justify-center flex-shrink-0">1</span>
              <h2 className="text-sm font-semibold text-gray-800">{tr('textMarkLabelTextOnly', lang)}</h2>
            </div>
            <div className="p-5">
              <input
                type="text"
                value={textMarkName}
                onChange={e => setTextMarkName(e.target.value)}
                placeholder={tr('textMarkPlaceholder', lang)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-colors"
              />
            </div>
          </div>
        )}

        {/* ── Step 2: Goods & Services ─────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-full bg-[#1a2e1a] text-white text-xs font-bold flex items-center justify-center flex-shrink-0">2</span>
            <h2 className="text-sm font-semibold text-gray-800">{tr('step2Title', lang)}</h2>
          </div>
          <div className="p-5 space-y-4">
            <textarea
              value={goodsServices}
              onChange={e => setGoodsServices(e.target.value)}
              placeholder={tr('goodsPlaceholder', lang)}
              rows={2}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-colors resize-none"
            />

            {selectedClasses.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {selectedClasses.map(num => {
                  const cls = ALL_NICE_CLASSES.find(c => c.num === num);
                  return (
                    <span key={num} className="inline-flex items-center gap-1 bg-[#1a2e1a]/10 text-[#1a2e1a] text-[11px] font-semibold px-2 py-0.5 rounded-full">
                      <Tag size={8} />{lang === 'es' ? `Cl. ${num} · ${cls?.titleEs}` : `Cl. ${num} · ${cls?.title}`}
                      <button type="button" onClick={() => toggleClass(num)} className="ml-0.5 hover:text-red-600 transition-colors"><X size={8} /></button>
                    </span>
                  );
                })}
              </div>
            )}

            <button type="button" onClick={() => setShowAllClasses(v => !v)} className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold hover:text-emerald-600 transition-colors">
              {showAllClasses ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              {showAllClasses ? tr('hideClasses', lang) : tr('showClasses', lang)}
            </button>

            {showAllClasses && (
              <div className="space-y-3">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">{lang === 'es' ? 'Productos (Cl. 1–34)' : 'Goods (Cl. 1–34)'}</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
                    {goodsClasses.map(cls => (
                      <button key={cls.num} type="button" onClick={() => toggleClass(cls.num)}
                        className={`text-left px-2 py-1.5 rounded-lg border text-[11px] transition-colors ${selectedClasses.includes(cls.num) ? 'border-emerald-500 bg-emerald-50 text-emerald-800 font-semibold' : 'border-gray-200 hover:border-emerald-300 text-gray-600'}`}>
                        <span className="font-bold">{cls.num}</span> · {lang === 'es' ? cls.titleEs : cls.title}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">{lang === 'es' ? 'Servicios (Cl. 35–45)' : 'Services (Cl. 35–45)'}</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
                    {servicesClasses.map(cls => (
                      <button key={cls.num} type="button" onClick={() => toggleClass(cls.num)}
                        className={`text-left px-2 py-1.5 rounded-lg border text-[11px] transition-colors ${selectedClasses.includes(cls.num) ? 'border-emerald-500 bg-emerald-50 text-emerald-800 font-semibold' : 'border-gray-200 hover:border-emerald-300 text-gray-600'}`}>
                        <span className="font-bold">{cls.num}</span> · {lang === 'es' ? cls.titleEs : cls.title}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Search button ────────────────────────────────────────────── */}
        <button
          type="button"
          onClick={handleSearch}
          disabled={!canSearch() || isLoading}
          className="w-full flex items-center justify-center gap-2 bg-[#1a2e1a] hover:bg-[#243d24] disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold px-6 py-3.5 rounded-xl transition-colors shadow-md text-sm"
        >
          {isLoading ? <><Loader2 size={15} className="animate-spin" />{tr('analyzing', lang)}</> : <><Search size={14} />{tr('searchBtn', lang)}</>}
        </button>

        {/* ── Loading progress ─────────────────────────────────────────── */}
        {isLoading && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <div className="space-y-3">
              {[
                { step: 'vision', label: tr('stepVision', lang), show: mode !== 'text-only' },
                { step: 'marcia', label: tr('stepMarcia', lang), show: true },
                { step: 'risk',   label: tr('stepRisk', lang),   show: true },
              ].filter(s => s.show).map(({ step, label }) => {
                const order = mode === 'text-only' ? ['marcia', 'risk'] : ['vision', 'marcia', 'risk'];
                const ci = order.indexOf(loadingStep);
                const ti = order.indexOf(step);
                const isDone = ti < ci;
                const isActive = ti === ci;
                return (
                  <div key={step} className={`flex items-center gap-3 transition-opacity ${!isDone && !isActive ? 'opacity-30' : ''}`}>
                    <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center">
                      {isDone ? <CheckCircle2 size={17} className="text-emerald-500" /> : isActive ? <Loader2 size={15} className="text-emerald-600 animate-spin" /> : <div className="w-4 h-4 rounded-full border-2 border-gray-200" />}
                    </div>
                    <p className="text-xs text-gray-600">{label}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Error ────────────────────────────────────────────────────── */}
        {loadingStep === 'error' && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex items-start gap-3">
            <AlertTriangle size={17} className="text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-700">{tr('errorTitle', lang)}</p>
              <p className="text-xs text-red-600 mt-0.5">{errorMsg || tr('errorBody', lang)}</p>
              <button type="button" onClick={() => { setLoadingStep('idle'); setErrorMsg(''); }} className="mt-2 text-xs font-semibold text-red-700 underline">{tr('searchAgain', lang)}</button>
            </div>
          </div>
        )}

        {/* ── Results ──────────────────────────────────────────────────── */}
        {result && (
          <div ref={resultsRef} className="space-y-4">

            {/* Escalation banner */}
            {result.scores.escalationRequired && (
              <div className="flex items-start gap-3 bg-amber-50 border border-amber-300 rounded-2xl p-4">
                <AlertTriangle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-amber-800">{tr('escalationAlert', lang)}</p>
                  <p className="text-xs text-amber-700 mt-0.5">{tr('escalationBody', lang)}</p>
                </div>
              </div>
            )}

            {/* Risk summary banner */}
            {(() => {
              const s = RISK_STYLES[result.scores.riskLevel];
              return (
                <div className={`rounded-2xl border ${s.border} ${s.bg} p-5`}>
                  <div className="flex items-center gap-3 mb-3 flex-wrap">
                    <div className={`w-3 h-3 rounded-full ${s.dot} flex-shrink-0`} />
                    <span className={`text-sm font-bold ${s.text}`}>{riskLabel(result.scores.riskLevel)}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ml-auto ${
                      result.markType === 'mixed' ? 'bg-blue-100 text-blue-700'
                      : result.markType === 'text-only' ? 'bg-gray-100 text-gray-600'
                      : 'bg-slate-100 text-slate-600'
                    }`}>
                      {result.markType === 'mixed' ? tr('modeMixed', lang) : result.markType === 'text-only' ? tr('modeTextOnly', lang) : tr('modeImageOnly', lang)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{result.scores.riskSummary}</p>
                </div>
              );
            })()}

            {/* 4-score scorecard */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">IMPI Playbook Scores</p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { key: 'scoreDistinctiveness', value: result.scores.distinctivenessScore, higherIsGood: true },
                  { key: 'scoreSimilarityRisk',  value: result.scores.similarityRiskScore,  higherIsGood: false },
                  { key: 'scoreRegistrability',  value: result.scores.registrabilityProbability, higherIsGood: true },
                  { key: 'scoreObjection',        value: result.scores.impiObjectionProbability, higherIsGood: false },
                ].map(({ key, value, higherIsGood }) => (
                  <div key={key}>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-gray-600">{tr(key, lang)}</span>
                      <span className="text-sm font-bold text-gray-800">{value}</span>
                    </div>
                    <ScoreBar value={value} higherIsGood={higherIsGood} />
                  </div>
                ))}
              </div>
            </div>

            {/* Design analysis (only for image modes) */}
            {result.markType !== 'text-only' && (result.viennaCodes.length > 0 || result.designDescription || result.scores.dominantElements.length > 0) && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-5 py-3.5 border-b border-gray-100">
                  <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wide">{tr('viennaTitle', lang)}</h3>
                </div>
                <div className="p-5 space-y-4">
                  {result.designDescription && (
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">{tr('designDescLabel', lang)}</p>
                      <p className="text-xs text-gray-600 leading-relaxed">{result.designDescription}</p>
                    </div>
                  )}
                  {result.scores.silhouetteDescription && (
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">{tr('silhouetteLabel', lang)}</p>
                      <p className="text-xs text-gray-600 leading-relaxed">{result.scores.silhouetteDescription}</p>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-3">
                    {result.scores.dominantElements.length > 0 && (
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">{tr('dominantLabel', lang)}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {result.scores.dominantElements.map((el, i) => (
                            <span key={i} className="text-[11px] bg-[#1a2e1a]/10 text-[#1a2e1a] font-semibold px-2 py-0.5 rounded-full">{el}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {result.scores.visualStyle && result.scores.visualStyle !== 'Unknown' && (
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">{tr('styleLabel', lang)}</p>
                        <span className="text-[11px] bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded-full">{result.scores.visualStyle}</span>
                      </div>
                    )}
                    {result.scores.industrySaturation && (
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">{tr('saturationLabel', lang)}</p>
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${SAT_COLORS[result.scores.industrySaturation]}`}>
                          {result.scores.industrySaturation}
                        </span>
                      </div>
                    )}
                  </div>
                  {result.viennaCodes.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Vienna Codes</p>
                      <div className="flex flex-wrap gap-1.5">
                        {result.viennaCodes.map((vc, i) => (
                          <div key={i} className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5">
                            <span className="text-[11px] font-bold text-[#1a2e1a] font-mono">{vc.code}</span>
                            <span className="text-[11px] text-gray-500">{vc.description}</span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${CONFIDENCE_COLORS[vc.confidence]}`}>{vc.confidence}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Risk factors */}
            {(result.scores.riskFactors.length > 0 || result.scores.recommendation) && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-3">
                {result.scores.riskFactors.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">{tr('riskFactorsLabel', lang)}</p>
                    <ul className="space-y-1">
                      {result.scores.riskFactors.map((f, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0 mt-1.5" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {result.scores.recommendation && (
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">{tr('recommendationLabel', lang)}</p>
                    <p className="text-xs text-gray-700 leading-relaxed">{result.scores.recommendation}</p>
                  </div>
                )}
              </div>
            )}

            {/* MARCia findings */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wide">{tr('findingsTitle', lang)}</h3>
                {result.marciaTotalCount > 0 && (
                  <span className="text-[10px] text-gray-400">{result.marciaTotalCount} {tr('totalInDB', lang)}</span>
                )}
              </div>
              <div className="p-4">
                {result.marciaFindings.length === 0 ? (
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 size={15} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-gray-600 leading-relaxed">{tr('noFindings', lang)}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {result.marciaFindings.slice(0, 10).map((f, i) => (
                      <div key={i} className="flex items-start gap-3 p-2.5 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                        {f.imageUrl ? (
                          <img src={f.imageUrl} alt={f.name} className="w-8 h-8 object-contain rounded border border-gray-100 flex-shrink-0" />
                        ) : (
                          <div className="w-8 h-8 rounded border border-gray-100 bg-gray-50 flex items-center justify-center flex-shrink-0">
                            <Shield size={11} className="text-gray-300" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-800 truncate">{f.name}</p>
                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            {f.classNum && <span className="text-[9px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-mono">Cl. {f.classNum}</span>}
                            <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${f.status.toLowerCase().includes('reg') ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{f.status}</span>
                            {f.holder && <span className="text-[9px] text-gray-400 truncate max-w-[100px]">{f.holder}</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                    {result.marciaFindings.length > 10 && (
                      <p className="text-[10px] text-gray-400 text-center pt-1">+ {result.marciaFindings.length - 10} {lang === 'es' ? 'más resultados' : 'more results'}</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* CTA row */}
            <div className="flex flex-wrap gap-3 items-center justify-between">
              <button type="button" onClick={() => { setResult(null); setLoadingStep('idle'); }}
                className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-800 border border-gray-200 rounded-xl px-4 py-2.5 transition-colors">
                <Search size={13} />{tr('searchAgain', lang)}
              </button>
              <Link
                to={`/apply${result.textMarkName ? `?mark=${encodeURIComponent(result.textMarkName)}` : ''}`}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors shadow-md text-sm ring-2 ring-emerald-400 ring-offset-2"
              >
                <FileText size={13} />{tr('startFiling', lang)}<ArrowRight size={13} />
              </Link>
            </div>

            {/* Disclaimer */}
            <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-xl border border-gray-100">
              <Info size={11} className="text-gray-400 flex-shrink-0 mt-0.5" />
              <p className="text-[10px] text-gray-400 leading-relaxed">{result.disclaimer}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
