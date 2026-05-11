import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import {
  Shield, Loader2, ChevronDown, ChevronUp, ExternalLink,
  AlertTriangle, CheckCircle2, AlertCircle, Info, Globe,
  Scale, ArrowRight, TrendingUp, FileSearch, Minus, Lock,
  FileText, Mail, Tag, Download, Sparkles, Eye, Printer, HelpCircle, X,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface MarciaFinding { name: string; status: string; classNum: string; holder: string; }
interface DomainResult { domain: string; available: boolean | null; status: 'available' | 'taken' | 'unknown'; }
export interface RegistrabilityFlag { category: string; severity: 'low' | 'medium' | 'high'; explanation: string; explanation_en?: string; }
export interface DupontFactor { factor: string; verdict: 'favors_registration' | 'neutral' | 'against_registration'; reasoning: string; reasoning_en?: string; }
export interface DistinctivenessAssessment { tier: 'generic' | 'descriptive' | 'suggestive' | 'arbitrary' | 'fanciful'; score: number; explanation: string; explanation_en?: string; }
export interface TranslationFlag { languageCode: string; languageName: string; translatedForm: string; risk: 'none' | 'low' | 'medium' | 'high'; issueCategory: string | null; details: string; details_en: string; }

interface ClearanceResult {
  risk: 'low' | 'medium' | 'high';
  webFindings: string[];
  marciaFindings: MarciaFinding[];
  marciaTotalCount?: number;
  marciaUrl: string;
  domainResults: DomainResult[];
  registrabilityFlags?: RegistrabilityFlag[];
  registrabilityRisk?: 'low' | 'medium' | 'high';
  dupont?: DupontFactor[];
  distinctiveness?: DistinctivenessAssessment;
  riskSummary?: string;
  riskSummary_en?: string;
  translationAnalysis?: TranslationFlag[];
  searchLanguage?: string;
  disclaimer: string;
}

export type { ClearanceResult };

interface Props {
  markName: string;
  goodsServices?: string;
  classes: number[];
  language: 'en' | 'zh' | 'es' | 'de' | 'fr' | 'hi' | 'pt';
  autoRun?: boolean;
  onResult?: (result: ClearanceResult) => void;
  onSelectDespiteRisk?: (markName: string) => void;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
const STRIPE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string;

const stripePromise = STRIPE_KEY ? loadStripe(STRIPE_KEY) : null;

const RISK_CFG = {
  low: { label: { en: 'High Chances', es: 'Altas Probabilidades', zh: '高注册概率', de: 'Hohe Chancen', fr: 'Bonnes chances', hi: 'उच्च संभावना', pt: 'Altas Chances', ja: '登録可能性：高' }, icon: CheckCircle2, bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-700', bar: 'bg-emerald-500', summaryBg: 'bg-emerald-50/60', summaryBorder: 'border-l-emerald-400' },
  medium: { label: { en: 'Medium Chances', es: 'Probabilidades Medias', zh: '中等注册概率', de: 'Mittlere Chancen', fr: 'Chances modérées', hi: 'मध्यम संभावना', pt: 'Chances Médias', ja: '登録可能性：中' }, icon: AlertTriangle, bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-700', bar: 'bg-amber-500', summaryBg: 'bg-amber-50/60', summaryBorder: 'border-l-amber-400' },
  high: { label: { en: 'Low Chances', es: 'Pocas Probabilidades', zh: '低注册概率', de: 'Geringe Chancen', fr: 'Faibles chances', hi: 'कम संभावना', pt: 'Baixas Chances', ja: '登録可能性：低' }, icon: AlertCircle, bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', badge: 'bg-red-100 text-red-700', bar: 'bg-red-500', summaryBg: 'bg-red-50/60', summaryBorder: 'border-l-red-400' },
};

const DUPONT_LABELS: Record<string, string> = {
  similarity_of_marks: 'Similarity of Marks', relatedness_of_goods: 'Relatedness of Goods/Services',
  channels_of_trade: 'Channels of Trade', purchasing_conditions: 'Purchaser Sophistication',
  strength_of_cited_mark: 'Strength of Cited Mark', actual_confusion: 'Actual Confusion',
  number_of_similar_marks: 'Crowding of Similar Marks', length_of_use: 'Length of Use',
  variety_of_goods: 'Variety of Goods Covered', market_interface: 'Market Interface / Consent',
  right_to_exclude: 'Right to Exclude Others', extent_of_confusion: 'Extent of Potential Confusion',
  other_factors: 'Other Relevant Factors',
};

const CATEGORY_LABELS: Record<string, string> = {
  generic_descriptive: 'Generic or Descriptive', functional_shape: 'Functional Shape',
  deceptive: 'Deceptive or Misleading', official_emblems: 'Official Emblems / Flags',
  personal_identity: 'Personal Identity Without Consent', confusingly_similar: 'Confusingly Similar to Existing Mark',
  famous_mark: 'Famous or Notorious Mark', protected_characters: 'Protected Characters / Titles',
  geographic_indication: 'Protected Geographic Indication', immoral_offensive: 'Contrary to Public Order / Morality',
  isolated_color: 'Isolated Color (Not Distinctive)', non_distinctive_nontrad: 'Non-Distinctive Non-Traditional Mark',
  bad_faith: 'Bad Faith Filing',
};

const TIER_ORDER = ['generic', 'descriptive', 'suggestive', 'arbitrary', 'fanciful'] as const;
const TIER_COLORS: Record<string, string> = { generic: 'bg-red-500', descriptive: 'bg-orange-500', suggestive: 'bg-amber-500', arbitrary: 'bg-emerald-500', fanciful: 'bg-[#1a2e1a]' };
const TIER_INACTIVE: Record<string, string> = { generic: 'bg-red-50 text-red-300', descriptive: 'bg-orange-50 text-orange-300', suggestive: 'bg-amber-50 text-amber-300', arbitrary: 'bg-emerald-50 text-emerald-300', fanciful: 'bg-[#1a2e1a]/5 text-[#1a2e1a]/30' };

// ─── Translation helper ───────────────────────────────────────────────────────

type Lang = 'en' | 'zh' | 'es' | 'de' | 'fr' | 'hi' | 'pt' | 'ja';

const UI: Record<string, Record<string, string>> = {
  // Executive summary
  clearanceAnalysis: { en: 'Clearance Analysis', es: 'Análisis de Disponibilidad', zh: '检索分析', de: 'Rechercheanalyse', fr: 'Analyse de disponibilité', hi: 'क्लीयरेंस विश्लेषण', pt: 'Análise de Disponibilidade' },
  riskSummaryTitle: { en: 'Risk Summary', es: 'Resumen de Riesgo', zh: '风险摘要', de: 'Risikozusammenfassung', fr: 'Résumé des risques', hi: 'जोखिम सारांश', pt: 'Resumo de Risco' },
  printReport: { en: 'Print', es: 'Imprimir', zh: '打印', de: 'Drucken', fr: 'Imprimer', hi: 'प्रिंट', pt: 'Imprimir' },
  // Scorecard
  distinctivenessTier: { en: 'Distinctiveness', es: 'Distintividad', zh: '显著性', de: 'Unterscheidungskraft', fr: 'Distinctivité', hi: 'विशिष्टता', pt: 'Distintividade' },
  dupontOutlook: { en: 'DuPont Outlook', es: 'Perspectiva DuPont', zh: '杜邦因素', de: 'DuPont-Aussichten', fr: 'Analyse DuPont', hi: 'DuPont दृष्टिकोण', pt: 'Perspectiva DuPont' },
  lfppiStatus: { en: 'LFPPI Status', es: 'Estado LFPPI', zh: 'LFPPI状态', de: 'LFPPI-Status', fr: 'Statut LFPPI', hi: 'LFPPI स्थिति', pt: 'Status LFPPI' },
  marciaHits: { en: 'IMPI MARCia Hits', es: 'Coincidencias MARCia', zh: 'MARCia匹配数', de: 'MARCia-Treffer', fr: 'Résultats MARCia', hi: 'MARCia परिणाम', pt: 'Resultados MARCia' },
  noIssues: { en: 'No issues', es: 'Sin problemas', zh: '无问题', de: 'Keine Probleme', fr: 'Aucun problème', hi: 'कोई समस्या नहीं', pt: 'Sem problemas' },
  issueDetected: { en: 'issue detected', es: 'problema detectado', zh: '个问题', de: 'Problem erkannt', fr: 'problème détecté', hi: 'समस्या मिली', pt: 'problema detectado' },
  issuesDetected: { en: 'issues detected', es: 'problemas detectados', zh: '个问题', de: 'Probleme erkannt', fr: 'problèmes détectés', hi: 'समस्याएं मिलीं', pt: 'problemas detectados' },
  favoring: { en: 'favoring', es: 'favorables', zh: '利好', de: 'günstig', fr: 'favorables', hi: 'अनुकूल', pt: 'favoráveis' },
  neutral: { en: 'neutral', es: 'neutros', zh: '中立', de: 'neutral', fr: 'neutres', hi: 'तटस्थ', pt: 'neutros' },
  against: { en: 'against', es: 'desfavorables', zh: '不利', de: 'ungünstig', fr: 'défavorables', hi: 'प्रतिकूल', pt: 'desfavoráveis' },
  matches: { en: 'matches', es: 'coincidencias', zh: '条匹配', de: 'Treffer', fr: 'correspondances', hi: 'मिलान', pt: 'correspondências' },
  // Teaser / locked
  inFullReport: { en: 'Included in Full Report', es: 'Incluido en el Reporte Completo', zh: '完整报告中包含', de: 'Im vollständigen Bericht enthalten', fr: 'Inclus dans le rapport complet', hi: 'पूर्ण रिपोर्ट में शामिल', pt: 'Incluído no Relatório Completo' },
  andMore: { en: 'and {n} more — see full report', es: 'y {n} más — ver reporte completo', zh: '及另{n}条 — 见完整报告', de: 'und {n} weitere — vollständiger Bericht', fr: 'et {n} de plus — voir le rapport complet', hi: 'और {n} और — पूरी रिपोर्ट देखें', pt: 'e mais {n} — ver relatório completo' },
  // CTA card
  ctaTitle: { en: 'Get the Full Trademark Clearance Report', es: 'Obtén el Reporte Completo de Disponibilidad de Marca', zh: '获取完整商标检索报告', de: 'Vollständigen Markenrecherche-Bericht erhalten', fr: 'Obtenir le rapport complet de disponibilité de marque', hi: 'पूर्ण ट्रेडमार्क क्लीयरेंस रिपोर्ट प्राप्त करें', pt: 'Obter o Relatório Completo de Disponibilidade de Marca' },
  ctaDesc: {
    en: 'Professional AI-powered analysis with attorney-reviewed recommendations. Delivered in English and your language. Timestamped PDF ready to share with your team or attorney. Covers all 13 DuPont factors, full LFPPI absolute-grounds review, all IMPI MARCia results, translation conflicts, and 13 domain TLDs.',
    es: 'Análisis profesional impulsado por IA con recomendaciones revisadas por abogados. Entregado en español e inglés. PDF con sello de tiempo listo para compartir con tu equipo o abogado. Cubre los 13 factores DuPont, revisión completa LFPPI, todos los resultados MARCia, conflictos de traducción y 13 dominios.',
    zh: '专业AI驱动分析，经律师审核推荐。以中文和英文交付。带时间戳的PDF，可直接与您的团队或律师分享。涵盖所有13个杜邦因素、完整LFPPI绝对理由审查、所有MARCia结果、翻译冲突和13个域名。',
    de: 'Professionelle KI-gestützte Analyse mit anwaltlich geprüften Empfehlungen. Auf Deutsch und Englisch. Zeitgestempeltes PDF zum Teilen. Alle 13 DuPont-Faktoren, LFPPI-Analyse, alle MARCia-Ergebnisse, Übersetzungskonflikte und 13 Domains.',
    fr: "Analyse professionnelle IA avec recommandations validées par des juristes. Livrée en français et anglais. PDF horodaté prêt à partager. Couvre les 13 facteurs DuPont, l'analyse LFPPI, tous les résultats MARCia, les conflits de traduction et 13 domaines.",
    hi: 'वकील-समीक्षित सिफारिशों के साथ पेशेवर AI-संचालित विश्लेषण। हिंदी और अंग्रेजी में प्रदान। टाइमस्टैम्प PDF अपनी टीम या वकील के साथ शेयर करें। सभी 13 DuPont कारक, LFPPI समीक्षा, सभी MARCia परिणाम और 13 डोमेन।',
    pt: 'Análise profissional com IA e recomendações revisadas por advogados. Entregue em português e inglês. PDF com carimbo de data pronto para compartilhar. Cobre 13 fatores DuPont, análise LFPPI, todos os resultados MARCia, conflitos de tradução e 13 domínios.',
  },
  ctaPrice: { en: 'Full Report — USD $4.99', es: 'Reporte Completo — USD $4.99', zh: '完整报告 — USD $4.99', de: 'Vollständiger Bericht — USD $4.99', fr: 'Rapport complet — USD $4.99', hi: 'पूर्ण रिपोर्ट — USD $4.99', pt: 'Relatório Completo — USD $4.99' },
  ctaItems: {
    en: 'Professional AI analysis + attorney-reviewed recommendations · Report in your language AND in English · 13 DuPont likelihood-of-confusion factors · Full LFPPI absolute-grounds analysis · All IMPI MARCia registry results · Translation & transliteration conflicts · 13 domain TLDs checked · Timestamped PDF — ready to share',
    es: 'Análisis IA profesional + recomendaciones de abogado · Reporte en español Y en inglés · 13 factores DuPont · Análisis LFPPI completo · Todos los resultados MARCia · Conflictos de traducción · 13 dominios verificados · PDF con sello de tiempo',
    zh: '专业AI分析 + 律师审核建议 · 报告以中文和英文提供 · 13个杜邦因素 · 完整LFPPI分析 · 全部MARCia结果 · 翻译冲突 · 13个域名 · 带时间戳PDF',
    de: 'Professionelle KI-Analyse + Anwaltsempfehlungen · Bericht auf Deutsch UND Englisch · 13 DuPont-Faktoren · LFPPI-Analyse · Alle MARCia-Ergebnisse · Übersetzungskonflikte · 13 Domains · PDF mit Zeitstempel',
    fr: 'Analyse IA pro + recommandations juridiques · Rapport en français ET anglais · 13 facteurs DuPont · Analyse LFPPI · Tous les résultats MARCia · Conflits de traduction · 13 domaines · PDF horodaté',
    hi: 'पेशेवर AI विश्लेषण + वकील की सिफारिशें · रिपोर्ट हिंदी और अंग्रेजी में · 13 DuPont कारक · LFPPI विश्लेषण · सभी MARCia परिणाम · अनुवाद संघर्ष · 13 डोमेन · टाइमस्टैम्प PDF',
    pt: 'Análise IA profissional + recomendações jurídicas · Relatório em português E inglês · 13 fatores DuPont · Análise LFPPI · Todos os resultados MARCia · Conflitos de tradução · 13 domínios · PDF com carimbo',
  },
  ctaPriceTooltip: {
    en: 'Traditional IP law firms charge over $500 USD for a clearance report of this depth. We provide it for USD $4.99 by combining artificial intelligence, proprietary algorithms, and advanced legal technologies.',
    es: 'Los despachos de PI tradicionales cobran más de $500 USD por un reporte de esta profundidad. Lo ofrecemos por USD $4.99 gracias a la inteligencia artificial, algoritmos propietarios y tecnologías legales avanzadas.',
    zh: '传统知识产权律师事务所收取超过500美元的此类检索报告费用。我们通过人工智能、专有算法和先进法律技术，以USD $4.99提供相同深度的报告。',
    de: 'Traditionelle IP-Kanzleien berechnen über 500 USD für einen Bericht dieser Tiefe. Wir bieten ihn für USD $4,99 durch KI, proprietäre Algorithmen und fortschrittliche Rechtstechnologien.',
    fr: "Les cabinets PI traditionnels facturent plus de 500 USD pour un rapport de cette profondeur. Nous le fournissons à USD $4,99 grâce à l'IA, nos algorithmes propriétaires et des technologies juridiques avancées.",
    hi: 'पारंपरिक IP कानून फर्में इस गहराई की रिपोर्ट के लिए $500 USD से अधिक लेती हैं। हम इसे USD $4.99 में कृत्रिम बुद्धिमत्ता, मालिकाना एल्गोरिदम और उन्नत कानूनी तकनीकों के माध्यम से प्रदान करते हैं।',
    pt: 'Escritórios tradicionais de PI cobram mais de $500 USD por um relatório desta profundidade. Nós o fornecemos por USD $4,99 combinando inteligência artificial, algoritmos proprietários e tecnologias jurídicas avançadas.',
  },
  tooltipDistinctiveness: {
    en: 'Distinctiveness measures how unique and protectable your mark is. Marks are classified into 5 tiers — from Generic (not protectable) to Fanciful (strongest protection). The higher the tier, the better your chances of registration and the broader the scope of protection you receive.',
    es: 'La distintividad mide qué tan única y protegible es tu marca. Las marcas se clasifican en 5 niveles, desde Genérica (no protegible) hasta de Fantasía (mayor protección). Cuanto más alto sea el nivel, mayores serán tus posibilidades de registro.',
    zh: '显著性衡量您的商标有多独特且可受保护。商标分为5个等级，从通用（不可保护）到臆造（最强保护）。等级越高，注册成功的可能性越大，获得的保护范围也越广。',
    de: 'Unterscheidungskraft misst, wie einzigartig und schutzfähig Ihre Marke ist. Marken werden in 5 Stufen eingeteilt — von Generisch (nicht schutzfähig) bis Frei erfunden (stärkster Schutz). Je höher die Stufe, desto besser die Registrierungschancen.',
    fr: "La distinctivité mesure à quel point votre marque est unique et protégeable. Les marques sont classées en 5 niveaux — de Générique (non protégeable) à Fantaisie (protection maximale). Plus le niveau est élevé, meilleures sont vos chances d'enregistrement.",
    hi: 'विशिष्टता मापती है कि आपका चिह्न कितना अनोखा और संरक्षणयोग्य है। चिह्नों को 5 स्तरों में वर्गीकृत किया जाता है — सामान्य (संरक्षणयोग्य नहीं) से लेकर काल्पनिक (सबसे मजबूत संरक्षण) तक। स्तर जितना ऊंचा, पंजीकरण की संभावना उतनी अधिक।',
    pt: 'A distintividade mede o quão única e protegível é a sua marca. As marcas são classificadas em 5 níveis — de Genérica (não protegível) a Fantasia (proteção máxima). Quanto mais alto o nível, melhores as chances de registro.',
  },
  tooltipDupont: {
    en: 'The DuPont Analysis applies the 13 factors established in In re E.I. DuPont de Nemours & Co. (1973) — the leading legal standard for trademark confusion analysis. Each factor evaluates a dimension of potential conflict (similarity of marks, relatedness of goods, trade channels, etc.). Factors "favoring registration" support your application; those "against" signal risk. The balance of factors predicts the likelihood a trademark examiner will find confusion with existing marks.',
    es: 'El Análisis DuPont aplica los 13 factores establecidos en In re E.I. DuPont de Nemours & Co. (1973), el estándar legal principal para análisis de confusión de marcas. Cada factor evalúa una dimensión del posible conflicto. Los factores "favorables" apoyan tu solicitud; los "desfavorables" señalan riesgo.',
    zh: 'DuPont分析应用了In re E.I. DuPont de Nemours & Co.（1973年）确立的13个因素——商标混淆分析的主要法律标准。每个因素评估潜在冲突的一个维度。"有利于注册"的因素支持您的申请，"不利于"的因素表明风险。',
    de: 'Die DuPont-Analyse wendet die 13 in In re E.I. DuPont de Nemours & Co. (1973) festgelegten Faktoren an — den führenden Rechtsstandard für die Verwechslungsanalyse. Jeder Faktor bewertet eine Dimension des potenziellen Konflikts. "Günstige" Faktoren unterstützen Ihre Anmeldung; "ungünstige" signalisieren Risiko.',
    fr: "L'analyse DuPont applique les 13 facteurs établis dans In re E.I. DuPont de Nemours & Co. (1973) — la norme juridique de référence pour l'analyse de confusion de marques. Chaque facteur évalue une dimension du conflit potentiel. Les facteurs \"favorables\" soutiennent votre demande; les \"défavorables\" signalent un risque.",
    hi: 'DuPont विश्लेषण In re E.I. DuPont de Nemours & Co. (1973) में स्थापित 13 कारकों को लागू करता है — ट्रेडमार्क भ्रम विश्लेषण का प्रमुख कानूनी मानक। प्रत्येक कारक संभावित संघर्ष का एक आयाम मूल्यांकन करता है। "पंजीकरण के अनुकूल" कारक आपके आवेदन का समर्थन करते हैं; "प्रतिकूल" कारक जोखिम का संकेत देते हैं।',
    pt: 'A Análise DuPont aplica os 13 fatores estabelecidos em In re E.I. DuPont de Nemours & Co. (1973) — o principal padrão legal para análise de confusão de marcas. Cada fator avalia uma dimensão do potencial conflito. Fatores "favoráveis" apoiam seu pedido; os "contrários" sinalizam risco.',
  },
  tooltipLfppi: {
    en: "The LFPPI (Ley Federal de Protección a la Propiedad Industrial) is Mexico's industrial property law. It defines absolute grounds for refusal — characteristics that make a mark unregistrable regardless of other marks (e.g., generic terms, deceptive marks, official emblems). A flag here means the mark itself may face objection at IMPI, independent of any conflicting prior registration.",
    es: 'La LFPPI (Ley Federal de Protección a la Propiedad Industrial) es la ley mexicana de propiedad industrial. Define causales absolutas de negativa — características que hacen que una marca no sea registrable independientemente de otras marcas. Una alerta aquí significa que la marca puede enfrentar objeción en el IMPI.',
    zh: 'LFPPI（联邦工业产权保护法）是墨西哥的工业产权法。它定义了绝对拒绝理由——无论其他商标如何，都会使商标无法注册的特征（例如通用词汇、欺骗性标志、官方徽章）。此处的标记表示商标本身可能在IMPI面临异议。',
    de: 'Das LFPPI (Ley Federal de Protección a la Propiedad Industrial) ist Mexikos Industrieeigentumsgesetz. Es definiert absolute Verweigerungsgründe — Merkmale, die eine Marke unabhängig von anderen Marken nicht eintragungsfähig machen. Ein Flag hier bedeutet, dass die Marke selbst beim IMPI auf Widerspruch stoßen kann.',
    fr: "Le LFPPI (Ley Federal de Protección a la Propiedad Industrial) est la loi mexicaine sur la propriété industrielle. Il définit les causes absolues de refus — des caractéristiques rendant une marque non enregistrable indépendamment des autres marques. Un signal ici signifie que la marque peut faire l'objet d'une objection à l'IMPI.",
    hi: 'LFPPI (Ley Federal de Protección a la Propiedad Industrial) मेक्सिको का औद्योगिक संपत्ति कानून है। यह पूर्ण अस्वीकृति के आधार परिभाषित करता है — जो विशेषताएं किसी चिह्न को अन्य चिह्नों की परवाह किए बिना अपंजीकरणयोग्य बनाती हैं। यहां कोई चिह्न IMPI में आपत्ति का सामना कर सकता है।',
    pt: 'O LFPPI (Ley Federal de Protección a la Propiedad Industrial) é a lei de propriedade industrial do México. Define causas absolutas de recusa — características que tornam uma marca não registrável independentemente de outras marcas. Um alerta aqui significa que a própria marca pode enfrentar objeção no IMPI.',
  },
  tooltipDomains: {
    en: 'Domain availability checks whether key web addresses matching your trademark are already registered. While domain ownership does not create trademark rights, a third party holding a matching .com or .mx domain may complicate brand rollout and coexistence. We check 13 TLDs including .com, .mx, .net, .io, .co, .store, .brand, and more.',
    es: 'La disponibilidad de dominios verifica si las direcciones web clave que coinciden con tu marca ya están registradas. Aunque la titularidad del dominio no crea derechos de marca, un tercero con un dominio .com o .mx coincidente puede complicar el lanzamiento de la marca. Verificamos 13 TLDs.',
    zh: '域名可用性检查与您商标匹配的关键网址是否已被注册。虽然域名所有权不创建商标权，但持有匹配.com或.mx域名的第三方可能会使品牌推广复杂化。我们检查13个顶级域名，包括.com、.mx、.net、.io等。',
    de: 'Die Domainverfügbarkeit prüft, ob Webadressen, die Ihrer Marke entsprechen, bereits registriert sind. Obwohl Domainbesitz keine Markenrechte schafft, kann ein Dritter mit einer übereinstimmenden .com- oder .mx-Domain die Markteinführung erschweren. Wir prüfen 13 TLDs.',
    fr: "La disponibilité des domaines vérifie si les adresses web correspondant à votre marque sont déjà enregistrées. Bien que la propriété d'un domaine ne crée pas de droits de marque, un tiers détenant un domaine .com ou .mx correspondant peut compliquer le déploiement de la marque. Nous vérifions 13 TLD.",
    hi: 'डोमेन उपलब्धता जांच करती है कि आपके ट्रेडमार्क से मेल खाते वेब पते पहले से पंजीकृत हैं या नहीं। हालांकि डोमेन स्वामित्व ट्रेडमार्क अधिकार नहीं बनाता, एक तृतीय पक्ष का मेल खाता .com या .mx डोमेन ब्रांड लॉन्च को जटिल बना सकता है। हम .com, .mx, .net, .io सहित 13 TLD जांचते हैं।',
    pt: 'A disponibilidade de domínios verifica se endereços web correspondentes à sua marca já estão registrados. Embora a propriedade de domínio não crie direitos de marca, um terceiro com um domínio .com ou .mx correspondente pode complicar o lançamento da marca. Verificamos 13 TLDs.',
  },
  fullReportNotice: {
    en: 'Full details available in the paid clearance report.',
    es: 'Detalles completos disponibles en el reporte de disponibilidad pagado.',
    zh: '完整详情请见付费检索报告。',
    de: 'Vollständige Details im kostenpflichtigen Recherchebericht.',
    fr: 'Détails complets disponibles dans le rapport payant.',
    hi: 'पूर्ण विवरण भुगतान किए गए क्लीयरेंस रिपोर्ट में उपलब्ध है।',
    pt: 'Detalhes completos disponíveis no relatório pago.',
  },
  // Email step
  emailStepTitle: { en: 'Enter your email to receive the report', es: 'Ingresa tu email para recibir el reporte', zh: '输入您的邮箱以接收报告', de: 'E-Mail-Adresse für den Berichtsempfang', fr: 'Entrez votre e-mail pour recevoir le rapport', hi: 'रिपोर्ट प्राप्त करने के लिए अपना ईमेल दर्ज करें', pt: 'Insira seu e-mail para receber o relatório' },
  emailLabel: { en: 'Email address', es: 'Correo electrónico', zh: '电子邮件地址', de: 'E-Mail-Adresse', fr: 'Adresse e-mail', hi: 'ईमेल पता', pt: 'Endereço de e-mail' },
  emailConfirmLabel: { en: 'Confirm email address', es: 'Confirmar correo electrónico', zh: '确认电子邮件地址', de: 'E-Mail-Adresse bestätigen', fr: 'Confirmer l\'adresse e-mail', hi: 'ईमेल पता की पुष्टि करें', pt: 'Confirmar endereço de e-mail' },
  emailMismatch: { en: 'Email addresses do not match', es: 'Los correos electrónicos no coinciden', zh: '电子邮件地址不匹配', de: 'E-Mail-Adressen stimmen nicht überein', fr: 'Les adresses e-mail ne correspondent pas', hi: 'ईमेल पते मेल नहीं खाते', pt: 'Os endereços de e-mail não correspondem' },
  emailInvalid: { en: 'Please enter a valid email address', es: 'Por favor ingresa un correo electrónico válido', zh: '请输入有效的电子邮件地址', de: 'Bitte geben Sie eine gültige E-Mail-Adresse ein', fr: 'Veuillez entrer une adresse e-mail valide', hi: 'कृपया एक वैध ईमेल पता दर्ज करें', pt: 'Por favor insira um endereço de e-mail válido' },
  continueToPayment: { en: 'Continue to Payment', es: 'Continuar al Pago', zh: '继续付款', de: 'Weiter zur Zahlung', fr: 'Continuer vers le paiement', hi: 'भुगतान जारी रखें', pt: 'Continuar para Pagamento' },
  // Coupon step
  couponTitle: { en: 'Review & Pay', es: 'Revisar y Pagar', zh: '确认并付款', de: 'Überprüfen & Bezahlen', fr: 'Vérifier et payer', hi: 'समीक्षा करें और भुगतान करें', pt: 'Revisar e Pagar' },
  haveCoupon: { en: 'Have a discount code?', es: '¿Tienes un código de descuento?', zh: '有优惠码？', de: 'Haben Sie einen Rabattcode?', fr: 'Vous avez un code de réduction ?', hi: 'डिस्काउंट कोड है?', pt: 'Tem um código de desconto?' },
  couponPlaceholder: { en: 'Enter code', es: 'Ingresar código', zh: '输入代码', de: 'Code eingeben', fr: 'Saisir le code', hi: 'कोड दर्ज करें', pt: 'Inserir código' },
  applyCode: { en: 'Apply', es: 'Aplicar', zh: '应用', de: 'Anwenden', fr: 'Appliquer', hi: 'लागू करें', pt: 'Aplicar' },
  invalidCoupon: { en: 'Invalid or expired coupon code', es: 'Código de cupón inválido o expirado', zh: '无效或过期的优惠码', de: 'Ungültiger oder abgelaufener Gutscheincode', fr: 'Code de réduction invalide ou expiré', hi: 'अमान्य या समाप्त कूपन कोड', pt: 'Código de cupão inválido ou expirado' },
  discountApplied: { en: 'Discount applied!', es: '¡Descuento aplicado!', zh: '折扣已应用！', de: 'Rabatt angewendet!', fr: 'Réduction appliquée !', hi: 'छूट लागू!', pt: 'Desconto aplicado!' },
  originalPrice: { en: 'Original price', es: 'Precio original', zh: '原价', de: 'Originalpreis', fr: 'Prix original', hi: 'मूल मूल्य', pt: 'Preço original' },
  afterDiscount: { en: 'After discount', es: 'Después del descuento', zh: '折扣后', de: 'Nach Rabatt', fr: 'Après réduction', hi: 'छूट के बाद', pt: 'Após desconto' },
  minCharge: { en: '(Stripe minimum $0.50 applies)', es: '(Se aplica el mínimo de Stripe $0.50)', zh: '（Stripe最低收费$0.50）', de: '(Stripe-Mindestbetrag $0.50 gilt)', fr: '(Minimum Stripe $0.50 applicable)', hi: '(Stripe न्यूनतम $0.50 लागू)', pt: '(Mínimo Stripe $0.50 aplicável)' },
  proceedPayment: { en: 'Proceed to Payment', es: 'Proceder al Pago', zh: '进行付款', de: 'Zur Zahlung fortfahren', fr: 'Procéder au paiement', hi: 'भुगतान आगे बढ़ें', pt: 'Prosseguir para Pagamento' },
  // Payment step
  securedByStripe: { en: 'Secured by Stripe', es: 'Pago seguro vía Stripe', zh: '由Stripe保护', de: 'Gesichert durch Stripe', fr: 'Sécurisé par Stripe', hi: 'Stripe द्वारा सुरक्षित', pt: 'Protegido pelo Stripe' },
  processing: { en: 'Processing…', es: 'Procesando…', zh: '处理中…', de: 'Wird verarbeitet…', fr: 'Traitement en cours…', hi: 'प्रसंस्करण…', pt: 'Processando…' },
  // Post-payment
  confirmed: { en: 'Report Confirmed!', es: '¡Reporte Confirmado!', zh: '报告已确认！', de: 'Bericht bestätigt!', fr: 'Rapport confirmé !', hi: 'रिपोर्ट की पुष्टि!', pt: 'Relatório Confirmado!' },
  sentTo: { en: 'Your full report has been sent to', es: 'Tu reporte completo fue enviado a', zh: '您的完整报告已发送至', de: 'Ihr vollständiger Bericht wurde gesendet an', fr: 'Votre rapport complet a été envoyé à', hi: 'आपकी पूर्ण रिपोर्ट भेजी गई', pt: 'Seu relatório completo foi enviado para' },
  downloadPdf: { en: 'Download PDF Report', es: 'Descargar Reporte PDF', zh: '下载PDF报告', de: 'PDF-Bericht herunterladen', fr: 'Télécharger le rapport PDF', hi: 'PDF रिपोर्ट डाउनलोड करें', pt: 'Baixar Relatório PDF' },
  generatingPdf: { en: 'Generating your PDF…', es: 'Generando tu PDF…', zh: '正在生成PDF…', de: 'PDF wird erstellt…', fr: 'Génération du PDF en cours…', hi: 'PDF तैयार हो रहा है…', pt: 'Gerando seu PDF…' },
  fullReportBelow: { en: 'Full detailed analysis below', es: 'Análisis detallado completo a continuación', zh: '完整详细分析如下', de: 'Vollständige Detailanalyse unten', fr: 'Analyse détaillée complète ci-dessous', hi: 'पूर्ण विस्तृत विश्लेषण नीचे', pt: 'Análise detalhada completa abaixo' },
  // Detail sections
  distinctivenessTitle: { en: 'Distinctiveness Assessment', es: 'Evaluación de Distintividad', zh: '显著性评估', de: 'Unterscheidungskraft-Bewertung', fr: 'Évaluation de la distinctivité', hi: 'विशिष्टता मूल्यांकन', pt: 'Avaliação de Distintividade' },
  dupontTitle: { en: 'DuPont Analysis (13 Factors)', es: 'Análisis DuPont (13 Factores)', zh: '杜邦因素分析（13项）', de: 'DuPont-Analyse (13 Faktoren)', fr: 'Analyse DuPont (13 facteurs)', hi: 'DuPont विश्लेषण (13 कारक)', pt: 'Análise DuPont (13 Fatores)' },
  lfppiTitle: { en: 'LFPPI Registrability Analysis', es: 'Análisis de Registrabilidad LFPPI', zh: 'LFPPI可注册性分析', de: 'LFPPI-Registrierbarkeitsanalyse', fr: 'Analyse de registrabilité LFPPI', hi: 'LFPPI पंजीकरण योग्यता विश्लेषण', pt: 'Análise de Registrabilidade LFPPI' },
  translationTitle: { en: 'Translation & Transliteration Analysis', es: 'Análisis de Traducción y Transliteración', zh: '翻译与音译分析', de: 'Übersetzungs- & Transliterationsanalyse', fr: 'Analyse de traduction et translittération', hi: 'अनुवाद और लिप्यंतरण विश्लेषण', pt: 'Análise de Tradução e Transliteração' },
  translationNoConflicts: { en: 'No conflicts detected across 8 languages', es: 'Sin conflictos en 8 idiomas', zh: '8种语言中未发现冲突', de: 'Keine Konflikte in 8 Sprachen', fr: 'Aucun conflit détecté dans 8 langues', hi: '8 भाषाओं में कोई संघर्ष नहीं', pt: 'Nenhum conflito detectado em 8 idiomas' },
  translationConflicts: { en: 'conflict(s) found in translation/transliteration', es: 'conflicto(s) en traducción/transliteración', zh: '个翻译/音译冲突', de: 'Konflikt(e) bei Übersetzung/Transliteration', fr: 'conflit(s) en traduction/translittération', hi: 'अनुवाद/लिप्यंतरण में संघर्ष', pt: 'conflito(s) em tradução/transliteração' },
  translatedAs: { en: 'Translated as', es: 'Traducido como', zh: '翻译为', de: 'Übersetzt als', fr: 'Traduit en', hi: 'इस रूप में अनुवादित', pt: 'Traduzido como' },
  marciaTitle: { en: 'IMPI MARCia Results', es: 'Resultados IMPI MARCia', zh: 'IMPI MARCia结果', de: 'IMPI MARCia-Ergebnisse', fr: 'Résultats IMPI MARCia', hi: 'IMPI MARCia परिणाम', pt: 'Resultados IMPI MARCia' },
  webTitle: { en: 'Web Presence Findings', es: 'Hallazgos de Presencia Web', zh: '网络检索结果', de: 'Web-Präsenz-Ergebnisse', fr: 'Résultats de présence web', hi: 'वेब उपस्थिति निष्कर्ष', pt: 'Resultados de Presença Web' },
  domainsTitle: { en: 'Domain Availability', es: 'Disponibilidad de Dominios', zh: '域名可用性', de: 'Domainverfügbarkeit', fr: 'Disponibilité des domaines', hi: 'डोमेन उपलब्धता', pt: 'Disponibilidade de Domínios' },
  openMarciaFull: { en: 'Open full MARCia results', es: 'Ver resultados completos en MARCia', zh: '查看完整MARCia结果', de: 'Vollständige MARCia-Ergebnisse öffnen', fr: 'Ouvrir les résultats complets MARCia', hi: 'पूरे MARCia परिणाम देखें', pt: 'Abrir resultados completos MARCia' },
  noMarciaFindings: { en: 'No matching marks found in MARCia database.', es: 'No se encontraron marcas coincidentes en MARCia.', zh: '在MARCia数据库中未找到匹配商标。', de: 'Keine übereinstimmenden Marken in der MARCia-Datenbank gefunden.', fr: 'Aucune marque correspondante trouvée dans MARCia.', hi: 'MARCia में कोई मिलान ट्रेडमार्क नहीं मिला।', pt: 'Nenhuma marca correspondente encontrada no MARCia.' },
  noLfppiIssues: { en: 'No absolute grounds for refusal detected.', es: 'No se detectaron causales absolutas de negativa.', zh: '未检测到绝对驳回事由。', de: 'Keine absoluten Verweigerungsgründe festgestellt.', fr: "Aucune cause absolue de refus détectée.", hi: 'कोई पूर्ण अस्वीकृति का आधार नहीं मिला।', pt: 'Nenhuma causa absoluta de recusa detectada.' },
  aiNote: { en: 'AI analysis — not legal advice.', es: 'Análisis de IA — no es asesoría legal.', zh: 'AI分析——非法律建议。', de: 'KI-Analyse — keine Rechtsberatung.', fr: "Analyse IA — pas un avis juridique.", hi: 'AI विश्लेषण — कानूनी सलाह नहीं।', pt: 'Análise de IA — não é aconselhamento jurídico.' },
  available: { en: 'Available', es: 'Disponible', zh: '可用', de: 'Verfügbar', fr: 'Disponible', hi: 'उपलब्ध', pt: 'Disponível' },
  taken: { en: 'Taken', es: 'Tomado', zh: '已占用', de: 'Vergeben', fr: 'Pris', hi: 'लिया गया', pt: 'Ocupado' },
  unknown: { en: 'Unknown', es: 'Desconocido', zh: '未知', de: 'Unbekannt', fr: 'Inconnu', hi: 'अज्ञात', pt: 'Desconhecido' },
  exactMatch: { en: 'Exact Match', es: 'Coincidencia Exacta', zh: '完全匹配', de: 'Exakte Übereinstimmung', fr: 'Correspondance exacte', hi: 'सटीक मिलान', pt: 'Correspondência Exata' },
  favors: { en: 'Favors', es: 'Favorable', zh: '利好', de: 'Günstig', fr: 'Favorable', hi: 'अनुकूल', pt: 'Favorável' },
  againstReg: { en: 'Against', es: 'Desfavorable', zh: '不利', de: 'Ungünstig', fr: 'Défavorable', hi: 'प्रतिकूल', pt: 'Desfavorável' },
  back: { en: 'Back', es: 'Volver', zh: '返回', de: 'Zurück', fr: 'Retour', hi: 'वापस', pt: 'Voltar' },
  strength: { en: 'strength', es: 'fortaleza', zh: '强度', de: 'Stärke', fr: 'force', hi: 'ताकत', pt: 'força' },
};

function tr(key: string, lang: Lang): string {
  return UI[key]?.[lang] ?? UI[key]?.['en'] ?? key;
}

// ─── Inline Stripe checkout ───────────────────────────────────────────────────

interface CheckoutProps {
  lang: Lang;
  finalAmount: number;
  clientSecret: string;
  paymentIntentId: string;
  reportOrderId: string;
  userId?: string;
  onSuccess: () => void;
  onBack: () => void;
}

function InlineCheckout({ lang, finalAmount, clientSecret, paymentIntentId, reportOrderId, userId, onSuccess, onBack }: CheckoutProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setPaying(true);
    setError('');
    const { error: confirmError } = await stripe.confirmPayment({ elements, redirect: 'if_required' });
    if (confirmError) {
      setError(confirmError.message ?? 'Payment failed. Please try again.');
      setPaying(false);
      return;
    }
    try {
      await fetch(`${SUPABASE_URL}/functions/v1/confirm-report-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
        body: JSON.stringify({ paymentIntentId, reportOrderId, userId }),
      });
    } catch (e) { console.error('confirm-report-payment failed:', e); }
    onSuccess();
  };

  return (
    <form onSubmit={handlePay} className="space-y-4">
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <PaymentElement options={{ layout: 'tabs' }} />
      </div>
      {error && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3">
          <AlertCircle size={14} className="text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
      <button type="submit" disabled={!stripe || !elements || paying}
        className="w-full flex items-center justify-center gap-2 bg-[#c9a84c] hover:bg-[#b8963e] disabled:opacity-60 text-white font-bold py-3.5 rounded-xl text-sm transition-colors shadow-md">
        <Lock size={14} />
        {paying ? tr('processing', lang) : `Pay USD $${finalAmount.toFixed(2)}`}
      </button>
      <p className="text-center text-xs text-gray-400 flex items-center justify-center gap-1">
        <Lock size={10} />{tr('securedByStripe', lang)}
      </p>
      <button type="button" onClick={onBack} className="w-full text-xs text-gray-400 hover:text-gray-600 underline">
        {tr('back', lang)}
      </button>
    </form>
  );
}

// ─── Clearance loading steps ─────────────────────────────────────────────────

const LOADING_STEPS: Record<Lang, { label: string; detail: string }[]> = {
  en: [
    { label: 'Querying IMPI MARCia database', detail: 'Scanning official registry for identical and confusingly similar marks…' },
    { label: 'Analyzing phonetic & visual similarity', detail: 'Comparing sound, appearance and meaning with existing marks…' },
    { label: 'Evaluating DuPont factors', detail: 'Assessing all 13 likelihood-of-confusion criteria under Mexican law…' },
    { label: 'Assessing distinctiveness (LFPPI)', detail: 'Classifying mark tier: generic, descriptive, suggestive, arbitrary or fanciful…' },
    { label: 'Scanning web & marketplace presence', detail: 'Checking for unregistered brands in commerce that may conflict…' },
    { label: 'Checking domain availability', detail: 'Querying .com, .mx, .net and 10 other TLDs…' },
    { label: 'Analyzing translations & transliterations', detail: 'Reviewing mark meaning across 8 languages for cross-border conflicts…' },
    { label: 'Compiling clearance report', detail: 'Aggregating all signals and computing final registrability score…' },
  ],
  es: [
    { label: 'Consultando base de datos IMPI MARCia', detail: 'Escaneando el registro oficial en busca de marcas idénticas o similares…' },
    { label: 'Analizando similitud fonética y visual', detail: 'Comparando sonido, apariencia y significado con marcas existentes…' },
    { label: 'Evaluando factores DuPont', detail: 'Analizando los 13 criterios de probabilidad de confusión bajo la ley mexicana…' },
    { label: 'Evaluando distintividad (LFPPI)', detail: 'Clasificando el nivel de la marca: genérica, descriptiva, sugestiva, arbitraria o de fantasía…' },
    { label: 'Rastreando presencia web y comercial', detail: 'Verificando marcas no registradas en el comercio que puedan generar conflicto…' },
    { label: 'Verificando disponibilidad de dominios', detail: 'Consultando .com, .mx, .net y 10 TLDs más…' },
    { label: 'Analizando traducciones y transliteraciones', detail: 'Revisando el significado de la marca en 8 idiomas para detectar conflictos internacionales…' },
    { label: 'Compilando reporte de registrabilidad', detail: 'Integrando todas las señales y calculando la puntuación final…' },
  ],
  zh: [
    { label: '查询IMPI MARCia数据库', detail: '扫描官方注册表，查找相同或近似商标…' },
    { label: '分析语音和视觉相似性', detail: '与现有商标比较发音、外观和含义…' },
    { label: '评估DuPont因素', detail: '根据墨西哥法律评估所有13项混淆可能性标准…' },
    { label: '评估显著性 (LFPPI)', detail: '对商标进行分类：通用、描述性、暗示性、任意性或臆造性…' },
    { label: '扫描网络和市场存在', detail: '检查可能产生冲突的未注册品牌…' },
    { label: '检查域名可用性', detail: '查询 .com、.mx、.net 和其他10个顶级域名…' },
    { label: '分析翻译和音译', detail: '检查8种语言中的商标含义以发现跨境冲突…' },
    { label: '编制注册可行性报告', detail: '汇总所有信号并计算最终注册可行性评分…' },
  ],
  de: [
    { label: 'IMPI MARCia-Datenbank abfragen', detail: 'Amtliches Register nach identischen und ähnlichen Marken durchsuchen…' },
    { label: 'Phonetische und visuelle Ähnlichkeit analysieren', detail: 'Klang, Erscheinung und Bedeutung mit bestehenden Marken vergleichen…' },
    { label: 'DuPont-Faktoren bewerten', detail: 'Alle 13 Verwechslungskriterien nach mexikanischem Recht prüfen…' },
    { label: 'Unterscheidungskraft bewerten (LFPPI)', detail: 'Markenstufe klassifizieren: generisch, beschreibend, suggestiv, willkürlich oder frei erfunden…' },
    { label: 'Web- und Marktpräsenz prüfen', detail: 'Nicht eingetragene Marken im Handel auf Konflikte untersuchen…' },
    { label: 'Domain-Verfügbarkeit prüfen', detail: '.com, .mx, .net und 10 weitere TLDs abfragen…' },
    { label: 'Übersetzungen und Transliterationen analysieren', detail: 'Markenbedeutung in 8 Sprachen auf grenzüberschreitende Konflikte prüfen…' },
    { label: 'Registrierbarkeitsbericht erstellen', detail: 'Alle Signale zusammenführen und endgültige Bewertung berechnen…' },
  ],
  fr: [
    { label: 'Interrogation de la base IMPI MARCia', detail: 'Analyse du registre officiel pour les marques identiques ou similaires…' },
    { label: 'Analyse de similarité phonétique et visuelle', detail: 'Comparaison du son, de l\'apparence et du sens avec les marques existantes…' },
    { label: 'Évaluation des facteurs DuPont', detail: 'Examen des 13 critères de risque de confusion selon le droit mexicain…' },
    { label: 'Évaluation du caractère distinctif (LFPPI)', detail: 'Classification : générique, descriptif, suggestif, arbitraire ou de fantaisie…' },
    { label: 'Analyse de la présence web et commerciale', detail: 'Recherche de marques non déposées susceptibles de créer un conflit…' },
    { label: 'Vérification de la disponibilité des domaines', detail: 'Interrogation de .com, .mx, .net et 10 autres TLD…' },
    { label: 'Analyse des traductions et translittérations', detail: 'Vérification du sens de la marque dans 8 langues pour les conflits internationaux…' },
    { label: 'Compilation du rapport de disponibilité', detail: 'Agrégation de tous les signaux et calcul du score final…' },
  ],
  hi: [
    { label: 'IMPI MARCia डेटाबेस क्वेरी', detail: 'आधिकारिक रजिस्ट्री में समान और भ्रामक रूप से समान चिह्न खोजे जा रहे हैं…' },
    { label: 'ध्वन्यात्मक और दृश्य समानता विश्लेषण', detail: 'मौजूदा चिह्नों के साथ ध्वनि, रूप और अर्थ की तुलना…' },
    { label: 'DuPont कारकों का मूल्यांकन', detail: 'मेक्सिकन कानून के तहत सभी 13 भ्रम-संभावना मानदंड…' },
    { label: 'विशिष्टता मूल्यांकन (LFPPI)', detail: 'चिह्न स्तर वर्गीकरण: सामान्य, वर्णनात्मक, सुझावात्मक, मनमाना या काल्पनिक…' },
    { label: 'वेब और बाज़ार उपस्थिति स्कैन', detail: 'संघर्ष पैदा कर सकने वाले गैर-पंजीकृत ब्रांड की जांच…' },
    { label: 'डोमेन उपलब्धता जांच', detail: '.com, .mx, .net और 10 अन्य TLD क्वेरी…' },
    { label: 'अनुवाद और लिप्यंतरण विश्लेषण', detail: '8 भाषाओं में चिह्न के अर्थ की समीक्षा…' },
    { label: 'क्लीयरेंस रिपोर्ट तैयार करना', detail: 'सभी संकेतों को एकत्रित करके अंतिम स्कोर की गणना…' },
  ],
  pt: [
    { label: 'Consultando base IMPI MARCia', detail: 'Verificando o registro oficial por marcas idênticas ou confusamente similares…' },
    { label: 'Analisando similaridade fonética e visual', detail: 'Comparando som, aparência e significado com marcas existentes…' },
    { label: 'Avaliando fatores DuPont', detail: 'Examinando todos os 13 critérios de probabilidade de confusão pela lei mexicana…' },
    { label: 'Avaliando distintividade (LFPPI)', detail: 'Classificando a marca: genérica, descritiva, sugestiva, arbitrária ou de fantasia…' },
    { label: 'Verificando presença web e comercial', detail: 'Checando marcas não registradas que possam gerar conflito…' },
    { label: 'Verificando disponibilidade de domínios', detail: 'Consultando .com, .mx, .net e outros 10 TLDs…' },
    { label: 'Analisando traduções e transliterações', detail: 'Revisando o significado da marca em 8 idiomas para conflitos internacionais…' },
    { label: 'Compilando relatório de registrabilidade', detail: 'Agregando todos os sinais e calculando a pontuação final…' },
  ],
  ja: [
    { label: 'IMPI MARCiaデータベース照会', detail: '公式登録簿で同一または混同を招く類似商標を検索中…' },
    { label: '音声的・視覚的類似性の分析', detail: '既存商標との音、外観、意味の比較…' },
    { label: 'DuPont要素の評価', detail: 'メキシコ法の下で13の混同可能性基準を検討中…' },
    { label: '識別力の評価 (LFPPI)', detail: '商標の段階分類：普通名称、記述的、示唆的、任意的または造語…' },
    { label: 'ウェブ・市場調査', detail: '未登録ブランドで競合する可能性のあるものを確認中…' },
    { label: 'ドメイン利用可能性確認', detail: '.com、.mx、.netおよび他10のTLDを照会中…' },
    { label: '翻訳・転記分析', detail: '8言語での商標の意味を確認し、越境衝突を調査中…' },
    { label: 'クリアランスレポート作成', detail: 'すべての情報を集約し、最終的な登録可能性スコアを算出中…' },
  ],
};

function ClearanceLoadingSteps({ lang }: { lang: Lang }) {
  const steps = LOADING_STEPS[lang] ?? LOADING_STEPS.en;
  const [activeIndex, setActiveIndex] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);

  useEffect(() => {
    const durations = [1600, 1400, 1800, 1500, 1300, 1100, 1400, 999999];
    let elapsed = 0;
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (let i = 0; i < steps.length - 1; i++) {
      elapsed += durations[i] ?? 1500;
      const idx = i;
      timers.push(setTimeout(() => {
        setCompletedCount(idx + 1);
        setActiveIndex(idx + 1);
      }, elapsed));
    }
    return () => timers.forEach(clearTimeout);
  }, [steps.length]);

  return (
    <div className="mt-3 rounded-xl border border-gray-200 bg-white overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
        <Loader2 size={14} className="text-gold-600 animate-spin flex-shrink-0" />
        <p className="text-xs font-semibold text-gray-700">
          {lang === 'es' ? 'Análisis en curso…' : lang === 'zh' ? '分析进行中…' : lang === 'de' ? 'Analyse läuft…' : lang === 'fr' ? 'Analyse en cours…' : lang === 'hi' ? 'विश्लेषण जारी…' : lang === 'pt' ? 'Análise em andamento…' : lang === 'ja' ? '分析中…' : 'Running full clearance analysis…'}
        </p>
      </div>
      <div className="px-4 py-3 space-y-2.5">
        {steps.map((step, i) => {
          const done = i < completedCount;
          const active = i === activeIndex && !done;
          return (
            <div key={i} className={`flex items-start gap-3 transition-opacity duration-300 ${i > activeIndex ? 'opacity-30' : 'opacity-100'}`}>
              <div className="flex-shrink-0 mt-0.5">
                {done ? (
                  <div className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center">
                    <CheckCircle2 size={11} className="text-emerald-600" />
                  </div>
                ) : active ? (
                  <div className="w-4 h-4 rounded-full bg-gold-100 flex items-center justify-center">
                    <Loader2 size={10} className="text-gold-600 animate-spin" />
                  </div>
                ) : (
                  <div className="w-4 h-4 rounded-full bg-gray-100 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-medium leading-tight ${done ? 'text-emerald-700' : active ? 'text-gray-800' : 'text-gray-400'}`}>
                  {step.label}
                </p>
                {active && (
                  <p className="text-[10px] text-gray-400 mt-0.5 leading-relaxed">{step.detail}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Locked teaser row ────────────────────────────────────────────────────────

function LockedRow({ lang }: { lang: Lang }) {
  return (
    <div className="flex items-center gap-2 py-1.5 px-2 rounded-lg bg-gray-50 border border-gray-100">
      <Lock size={10} className="text-gray-300 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="h-2 bg-gray-200 rounded-full w-3/4 blur-[2px]" />
      </div>
      <span className="text-[9px] text-gray-400 whitespace-nowrap font-medium">{tr('inFullReport', lang)}</span>
    </div>
  );
}

// ─── Info Tooltip ─────────────────────────────────────────────────────────────

function InfoTooltip({ text, className = '' }: { text: string; className?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={e => { e.stopPropagation(); setOpen(true); }}
        className={`inline-flex items-center justify-center w-4 h-4 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-500 hover:text-gray-700 transition-colors flex-shrink-0 print:hidden ${className}`}
        aria-label="More info"
      >
        <HelpCircle size={10} />
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 print:hidden" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-5 z-10" onClick={e => e.stopPropagation()}>
            <button type="button" onClick={() => setOpen(false)}
              className="absolute top-3 right-3 w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors">
              <X size={14} />
            </button>
            <div className="flex items-start gap-3 pr-6">
              <div className="w-8 h-8 rounded-xl bg-[#1a2e1a]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Info size={15} className="text-[#1a2e1a]" />
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">{text}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function TrademarkClearancePanel({
  markName, goodsServices = '', classes, language, autoRun = true, onResult, onSelectDespiteRisk,
}: Props) {
  const lang = (language in (UI.clearanceAnalysis)) ? language : 'en' as Lang;
  const { user } = useAuth();

  const [status, setStatus] = useState<'idle' | 'checking' | 'done' | 'error'>('idle');
  const [result, setResult] = useState<ClearanceResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const runningRef = useRef(false);

  // Purchase flow state
  type PurchaseStep = 'cta' | 'email' | 'coupon' | 'payment' | 'done';
  const [purchaseStep, setPurchaseStep] = useState<PurchaseStep>('cta');
  const [email, setEmail] = useState('');
  const [emailConfirm, setEmailConfirm] = useState('');
  const [emailError, setEmailError] = useState('');
  const [couponInput, setCouponInput] = useState('');
  const [couponValidating, setCouponValidating] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [finalAmount, setFinalAmount] = useState(4.99);
  const [clientSecret, setClientSecret] = useState('');
  const [paymentIntentId, setPaymentIntentId] = useState('');
  const [reportOrderId, setReportOrderId] = useState('');
  const [piLoading, setPiLoading] = useState(false);
  const [piError, setPiError] = useState('');
  const [pdfUrl, setPdfUrl] = useState('');

  // Detail section toggles (unlocked after payment)
  const [paid, setPaid] = useState(false);
  const [dupontExpanded, setDupontExpanded] = useState(false);
  const [lfppiExpanded, setLfppiExpanded] = useState(true);
  const [translationExpanded, setTranslationExpanded] = useState(true);
  const [marciaExpanded, setMarciaExpanded] = useState(false);
  const [webExpanded, setWebExpanded] = useState(false);
  const [domainExpanded, setDomainExpanded] = useState(false);

  const runCheck = async () => {
    if (runningRef.current || !markName.trim()) return;
    runningRef.current = true;
    setStatus('checking');
    setResult(null);
    setErrorMsg('');
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/verify-trademark`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
        body: JSON.stringify({ markName: markName.trim(), goodsServices, classes, language: lang }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Check failed');
      setResult(data as ClearanceResult);
      setStatus('done');
      onResult?.(data as ClearanceResult);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Check failed');
      setStatus('error');
    } finally {
      runningRef.current = false;
    }
  };

  useEffect(() => {
    if (autoRun && markName.trim()) {
      const t = setTimeout(runCheck, 600);
      return () => clearTimeout(t);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markName, goodsServices, classes.join(',')]);

  // ── Fetch PDF URL after payment ───────────────────────────────────────────
  useEffect(() => {
    if (!paid || !reportOrderId || pdfUrl) return;
    let attempts = 0;
    const poll = async () => {
      attempts++;
      try {
        const res = await fetch(`${SUPABASE_URL}/functions/v1/get-report-download-url`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
          body: JSON.stringify({ reportOrderId }),
        });
        if (res.ok) {
          const d = await res.json();
          if (d.url) { setPdfUrl(d.url); return; }
        }
      } catch {/* ignore */}
      if (attempts < 12) setTimeout(poll, 5000);
    };
    setTimeout(poll, 4000);
  }, [paid, reportOrderId, pdfUrl]);

  // ── Idle / Checking / Error states ───────────────────────────────────────
  if (status === 'idle') {
    return (
      <div className="mt-3 rounded-xl border border-[#c9a84c]/30 bg-[#c9a84c]/5 px-4 py-3 flex items-start gap-3">
        <Shield size={15} className="text-[#c9a84c] flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-[#b8963e]">Trademark Clearance Analysis</p>
          <p className="text-xs text-[#c9a84c]/80 mt-0.5">Full DuPont, distinctiveness, IMPI MARCia, web &amp; domain check</p>
        </div>
        <button type="button" onClick={runCheck}
          className="flex-shrink-0 text-xs font-semibold bg-[#c9a84c] hover:bg-[#b8963e] text-white px-3 py-1.5 rounded-lg transition-colors">
          Check
        </button>
      </div>
    );
  }
  if (status === 'checking') {
    return <ClearanceLoadingSteps lang={lang} />;
  }
  if (status === 'error') {
    return (
      <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 flex items-start gap-3">
        <AlertCircle size={15} className="text-red-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-red-700 flex-1">{errorMsg}</p>
        <button type="button" onClick={() => { runningRef.current = false; runCheck(); }}
          className="flex-shrink-0 text-xs text-red-600 hover:text-red-800 font-medium underline">Retry</button>
      </div>
    );
  }
  if (!result) return null;

  const cfg = RISK_CFG[result.risk];
  const RiskIcon = cfg.icon;
  const dupont = result.dupont ?? [];
  const dupontFavor = dupont.filter(f => f.verdict === 'favors_registration').length;
  const dupontNeutral = dupont.filter(f => f.verdict === 'neutral').length;
  const dupontAgainst = dupont.filter(f => f.verdict === 'against_registration').length;
  const regFlags = result.registrabilityFlags ?? [];
  const domainResults = result.domainResults ?? [];
  const topConflicts = [...result.marciaFindings]
    .sort((a, b) => {
      const aA = /registrada|vigente|registered|active/i.test(a.status) ? 0 : 1;
      const bA = /registrada|vigente|registered|active/i.test(b.status) ? 0 : 1;
      if (aA !== bA) return aA - bA;
      return (a.name.toLowerCase() === markName.toLowerCase() ? 0 : 1) - (b.name.toLowerCase() === markName.toLowerCase() ? 0 : 1);
    })
    .slice(0, 2);
  const totalMarcia = result.marciaTotalCount ?? result.marciaFindings.length;
  const comDomain = domainResults.find(d => d.domain.endsWith('.com'));
  const comMxDomain = domainResults.find(d => d.domain.endsWith('.com.mx'));

  // ── Email validation ──────────────────────────────────────────────────────
  const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const handleEmailContinue = () => {
    if (!isValidEmail(email)) { setEmailError(tr('emailInvalid', lang)); return; }
    if (email.toLowerCase() !== emailConfirm.toLowerCase()) { setEmailError(tr('emailMismatch', lang)); return; }
    setEmailError('');
    setPurchaseStep('coupon');
  };

  // ── Coupon validation ─────────────────────────────────────────────────────
  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    setCouponValidating(true);
    setCouponError('');
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/validate-coupon`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
        body: JSON.stringify({ couponCode: couponInput.trim().toUpperCase() }),
      });
      const d = await res.json();
      if (!res.ok || d.error) { setCouponError(tr('invalidCoupon', lang)); return; }
      const pct: number = d.discountPercent ?? d.discount_percent ?? 0;
      setDiscountPercent(pct);
      const final = pct > 0 ? Math.max(0.50, 4.99 * (1 - pct / 100)) : 4.99;
      setFinalAmount(parseFloat(final.toFixed(2)));
      setCouponApplied(true);
    } catch { setCouponError(tr('invalidCoupon', lang)); }
    finally { setCouponValidating(false); }
  };

  // ── Create PaymentIntent ──────────────────────────────────────────────────
  const handleProceedToPayment = async () => {
    setPiLoading(true);
    setPiError('');
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/create-report-payment-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
        body: JSON.stringify({
          markName: markName.trim(),
          goodsServices,
          language: lang,
          clearanceResult: result,
          email: email.trim().toLowerCase(),
          couponCode: couponApplied ? couponInput.trim().toUpperCase() : undefined,
          userId: user?.id ?? undefined,
        }),
      });
      const d = await res.json();
      if (!res.ok) { setPiError(d.message || 'Payment setup failed'); setPiLoading(false); return; }
      setClientSecret(d.clientSecret);
      setPaymentIntentId(d.paymentIntentId);
      setReportOrderId(d.reportOrderId);
      setFinalAmount(d.finalAmountUsd);
      setDiscountPercent(d.discountPercent);
      setPurchaseStep('payment');
    } catch { setPiError('Payment setup failed. Please try again.'); }
    finally { setPiLoading(false); }
  };

  const handlePaymentSuccess = () => {
    setPurchaseStep('done');
    setPaid(true);
  };

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div className={`mt-3 rounded-xl border ${cfg.border} ${cfg.bg} overflow-hidden`}>

      {/* ── Risk header ────────────────────────────────────────────────────── */}
      <div className="px-4 py-3 flex items-center gap-3">
        <RiskIcon size={16} className={`${cfg.text} flex-shrink-0`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs font-bold ${cfg.text}`}>{tr('clearanceAnalysis', lang)}:</span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.badge}`}>{cfg.label[lang]}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          title={tr('printReport', lang)}
          className={`flex-shrink-0 p-1.5 rounded-lg hover:bg-white/60 transition-colors ${cfg.text} opacity-60 hover:opacity-100 print:hidden`}
        >
          <Printer size={14} />
        </button>
      </div>

      {/* ── Risk Summary ───────────────────────────────────────────────────── */}
      {result.riskSummary && (
        <div className={`border-t border-gray-100 ${cfg.summaryBg} px-4 py-3 border-l-4 ${cfg.summaryBorder}`}>
          <div className="flex items-center gap-1.5 mb-1.5">
            <FileSearch size={12} className={cfg.text} />
            <span className={`text-xs font-semibold ${cfg.text}`}>{tr('riskSummaryTitle', lang)}</span>
          </div>
          <p className="text-xs text-gray-700 leading-relaxed">{result.riskSummary}</p>
          <p className="text-[10px] text-gray-400 mt-1.5 flex items-center gap-1">
            <Info size={9} className="flex-shrink-0" />{tr('aiNote', lang)}
          </p>
        </div>
      )}

      {/* ── Quick scorecard ─────────────────────────────────────────────────── */}
      <div className="border-t border-gray-100 bg-white/60 px-4 py-3">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {/* Distinctiveness */}
          {result.distinctiveness && (
            <div className="rounded-lg border border-gray-100 bg-white px-3 py-2">
              <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wide mb-1">{tr('distinctivenessTier', lang)}</p>
              <div className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full text-white ${TIER_COLORS[result.distinctiveness.tier] ?? 'bg-gray-400'}`}>
                {result.distinctiveness.tier.charAt(0).toUpperCase() + result.distinctiveness.tier.slice(1)}
              </div>
              <div className="mt-1.5 h-1 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full ${TIER_COLORS[result.distinctiveness.tier] ?? 'bg-gray-400'}`}
                  style={{ width: `${(result.distinctiveness.score / 5) * 100}%` }} />
              </div>
              <p className="text-[9px] text-gray-400 mt-0.5">{result.distinctiveness.score}/5 {tr('strength', lang)}</p>
            </div>
          )}
          {/* DuPont */}
          {dupont.length > 0 && (
            <div className="rounded-lg border border-gray-100 bg-white px-3 py-2">
              <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wide mb-1">{tr('dupontOutlook', lang)}</p>
              <div className="flex items-center gap-1 flex-wrap">
                <span className="text-[10px] font-bold text-emerald-600">{dupontFavor} {tr('favoring', lang)}</span>
                <span className="text-[10px] text-gray-400">·</span>
                <span className="text-[10px] text-gray-500">{dupontNeutral} {tr('neutral', lang)}</span>
                <span className="text-[10px] text-gray-400">·</span>
                <span className="text-[10px] font-bold text-red-600">{dupontAgainst} {tr('against', lang)}</span>
              </div>
              {!paid && (
                <p className="text-[9px] text-gray-300 mt-1.5 flex items-center gap-0.5">
                  <Lock size={8} />{tr('inFullReport', lang)}
                </p>
              )}
            </div>
          )}
          {/* LFPPI */}
          <div className="rounded-lg border border-gray-100 bg-white px-3 py-2">
            <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wide mb-1">{tr('lfppiStatus', lang)}</p>
            {regFlags.length === 0
              ? <span className="text-[10px] font-bold text-emerald-600">{tr('noIssues', lang)}</span>
              : <span className="text-[10px] font-bold text-red-600">{regFlags.length} {regFlags.length === 1 ? tr('issueDetected', lang) : tr('issuesDetected', lang)}</span>
            }
            {!paid && regFlags.length > 0 && (
              <p className="text-[9px] text-gray-300 mt-1.5 flex items-center gap-0.5">
                <Lock size={8} />{tr('inFullReport', lang)}
              </p>
            )}
          </div>
          {/* MARCia */}
          <div className="rounded-lg border border-gray-100 bg-white px-3 py-2">
            <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wide mb-1">{tr('marciaHits', lang)}</p>
            <span className={`text-[10px] font-bold ${totalMarcia > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>{totalMarcia} {tr('matches', lang)}</span>
            {!paid && totalMarcia > 1 && (
              <p className="text-[9px] text-gray-300 mt-1.5 flex items-center gap-0.5">
                <Lock size={8} />{tr('inFullReport', lang)}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Teaser previews (free, always visible) ─────────────────────────── */}
      {!paid && (
        <div className="border-t border-gray-100 bg-white/40 px-4 py-3 space-y-3">

          {/* 1 — MARCia teaser */}
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <FileSearch size={11} className="text-[#1a2e1a]" />
              <span className="text-[10px] font-semibold text-gray-600">{tr('marciaTitle', lang)}</span>
            </div>
            {topConflicts.length === 0 ? (
              <p className="text-[10px] text-gray-400 italic">{tr('noMarciaFindings', lang)}</p>
            ) : (
              <>
                {topConflicts.slice(0, 1).map((f, i) => {
                  const isExact = f.name.toLowerCase().trim() === markName.toLowerCase().trim();
                  return (
                    <div key={i} className={`rounded-lg border px-2.5 py-1.5 mb-1 flex items-start gap-2 ${isExact ? 'border-red-200 bg-red-50' : 'border-amber-100 bg-amber-50/50'}`}>
                      <AlertTriangle size={11} className={`flex-shrink-0 mt-0.5 ${isExact ? 'text-red-500' : 'text-amber-500'}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-bold text-gray-800">{f.name}</span>
                          {isExact && <span className="text-[8px] font-bold bg-red-100 text-red-700 px-1 py-0.5 rounded-full uppercase">{tr('exactMatch', lang)}</span>}
                        </div>
                        <p className="text-[9px] text-gray-500">{f.status}{f.classNum ? ` · Cl. ${f.classNum}` : ''}</p>
                      </div>
                    </div>
                  );
                })}
                {totalMarcia > 1 && <LockedRow lang={lang} />}
              </>
            )}
            {totalMarcia > 1 && (
              <p className="text-[9px] text-gray-400 mt-0.5 flex items-center gap-1">
                <Lock size={8} className="flex-shrink-0" />{tr('fullReportNotice', lang)}
              </p>
            )}
          </div>

          {/* 2 — LFPPI teaser */}
          {regFlags.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Scale size={11} className="text-[#1a2e1a]" />
                <span className="text-[10px] font-semibold text-gray-600">{tr('lfppiTitle', lang)}</span>
                <InfoTooltip text={tr('tooltipLfppi', lang)} className="ml-0.5" />
                <Lock size={9} className="text-gray-300 ml-auto" />
              </div>
              {regFlags.slice(0, 1).map((f, i) => (
                <div key={i} className={`rounded-lg border px-2.5 py-1.5 mb-1 ${f.severity === 'high' ? 'border-red-100 bg-red-50/50' : f.severity === 'medium' ? 'border-amber-100 bg-amber-50/50' : 'border-blue-100 bg-blue-50/50'}`}>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className={`text-[9px] font-bold px-1 py-0.5 rounded ${f.severity === 'high' ? 'bg-red-100 text-red-700' : f.severity === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>{f.severity.toUpperCase()}</span>
                    <span className="text-[10px] font-semibold text-gray-700">{CATEGORY_LABELS[f.category] ?? f.category}</span>
                  </div>
                  <p className="text-[10px] text-gray-400 blur-[2px] select-none">{f.explanation?.slice(0, 60) ?? 'explanation locked'}...</p>
                </div>
              ))}
              {regFlags.length > 1 && <LockedRow lang={lang} />}
              <p className="text-[9px] text-gray-400 mt-0.5 flex items-center gap-1">
                <Lock size={8} className="flex-shrink-0" />{tr('fullReportNotice', lang)}
              </p>
            </div>
          )}

          {/* 3 — DuPont teaser */}
          {dupont.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Scale size={11} className="text-[#1a2e1a]" />
                <span className="text-[10px] font-semibold text-gray-600">{tr('dupontTitle', lang)}</span>
                <InfoTooltip text={tr('tooltipDupont', lang)} className="ml-0.5" />
                <Lock size={9} className="text-gray-300 ml-auto" />
              </div>
              {dupont.slice(0, 2).map((f, i) => (
                <div key={i} className="rounded-lg border border-gray-100 bg-white px-2.5 py-1.5 mb-1 flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${f.verdict === 'favors_registration' ? 'bg-emerald-400' : f.verdict === 'against_registration' ? 'bg-red-400' : 'bg-gray-300'}`} />
                  <span className="text-[10px] font-semibold text-gray-600 flex-1 min-w-0">{DUPONT_LABELS[f.factor] ?? f.factor}</span>
                  <span className="text-[9px] text-gray-300 blur-[2px] flex-shrink-0">reasoning locked</span>
                </div>
              ))}
              <LockedRow lang={lang} />
              <p className="text-[9px] text-gray-400 mt-0.5 flex items-center gap-1">
                <Lock size={8} className="flex-shrink-0" />{tr('fullReportNotice', lang)}
              </p>
            </div>
          )}

          {/* 4 — Distinctiveness teaser */}
          {result.distinctiveness && (
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <TrendingUp size={11} className="text-[#1a2e1a]" />
                <span className="text-[10px] font-semibold text-gray-600">{tr('distinctivenessTitle', lang)}</span>
                <InfoTooltip text={tr('tooltipDistinctiveness', lang)} className="ml-0.5" />
                <Lock size={9} className="text-gray-300 ml-auto" />
              </div>
              <div className="flex items-stretch gap-0 rounded-lg overflow-hidden border border-gray-100">
                {TIER_ORDER.map(tier => {
                  const isActive = result.distinctiveness?.tier === tier;
                  return (
                    <div key={tier}
                      className={`flex-1 text-center py-1.5 text-[9px] font-semibold ${isActive ? TIER_COLORS[tier] + ' text-white' : TIER_INACTIVE[tier]}`}>
                      {tier.charAt(0).toUpperCase() + tier.slice(1).slice(0, 5)}
                    </div>
                  );
                })}
              </div>
              <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                <Lock size={8} className="flex-shrink-0" />
                <span className="blur-[3px] select-none">{result.distinctiveness.explanation?.slice(0, 60) ?? 'Full explanation available in report'}...</span>
              </p>
              <p className="text-[9px] text-gray-400 mt-0.5 flex items-center gap-1">
                <Lock size={8} className="flex-shrink-0" />{tr('fullReportNotice', lang)}
              </p>
            </div>
          )}

          {/* 5 — Domain teaser */}
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <Globe size={11} className="text-[#1a2e1a]" />
              <span className="text-[10px] font-semibold text-gray-600">{tr('domainsTitle', lang)}</span>
              <InfoTooltip text={tr('tooltipDomains', lang)} className="ml-0.5" />
            </div>
            <div className="space-y-1">
              {[comDomain, comMxDomain].filter(Boolean).map(d => d && (
                <div key={d.domain} className="flex items-center justify-between py-0.5">
                  <span className="text-[10px] font-mono text-gray-600">{d.domain}</span>
                  {d.status === 'available' && <span className="text-[9px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full flex items-center gap-0.5"><CheckCircle2 size={8} />{tr('available', lang)}</span>}
                  {d.status === 'taken' && <span className="text-[9px] font-semibold text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-full flex items-center gap-0.5"><AlertCircle size={8} />{tr('taken', lang)}</span>}
                  {d.status === 'unknown' && <span className="text-[9px] font-semibold text-gray-500 bg-gray-50 border border-gray-200 px-1.5 py-0.5 rounded-full flex items-center gap-0.5"><Minus size={8} />{tr('unknown', lang)}</span>}
                </div>
              ))}
              <p className="text-[9px] text-gray-400 flex items-center gap-0.5 py-0.5">
                <Lock size={8} className="flex-shrink-0" />{tr('fullReportNotice', lang)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── POST-PAYMENT: Full detail sections ─────────────────────────────── */}
      {paid && (
        <div className="border-t border-gray-100 bg-white/50">

          {/* 1 — MARCia full */}
          <div className="border-b border-gray-100">
            <button type="button" onClick={() => setMarciaExpanded(v => !v)}
              className="w-full flex items-center justify-between px-4 py-2 text-xs font-medium text-gray-600 hover:bg-white/80 transition-colors">
              <span className="flex flex-col items-start text-left gap-0.5">
                <span className="flex items-center gap-1.5">
                  <FileSearch size={12} className="text-[#1a2e1a]" />
                  {tr('marciaTitle', lang)} ({totalMarcia} {tr('matches', lang)})
                </span>
                <span className="text-[9px] text-gray-400 font-normal pl-5">
                  {lang === 'es' ? 'Búsqueda en la base de datos oficial de marcas del IMPI para detectar marcas conflictivas.' : lang === 'zh' ? '在IMPI官方商标数据库中搜索冲突商标。' : lang === 'de' ? 'Suche in der offiziellen IMPI-Markendatenbank nach kollidierenden Marken.' : lang === 'fr' ? 'Recherche dans la base officielle de marques IMPI pour détecter les marques conflictuelles.' : lang === 'hi' ? 'IMPI की आधिकारिक ट्रेडमार्क डेटाबेस में विरोधाभासी चिह्नों की खोज।' : lang === 'pt' ? 'Busca na base oficial de marcas do IMPI para detectar marcas conflitantes.' : 'Search of the official IMPI trademark registry to detect conflicting marks.'}
                </span>
              </span>
              {marciaExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
            {marciaExpanded && (
              <div className="px-4 pb-3">
                {result.marciaFindings.length === 0 ? (
                  <p className="text-xs text-gray-500 italic">{tr('noMarciaFindings', lang)}</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead><tr className="text-gray-400 border-b border-gray-100">
                        <th className="text-left pb-1 font-medium pr-3">Name</th>
                        <th className="text-left pb-1 font-medium pr-3">Class</th>
                        <th className="text-left pb-1 font-medium pr-3">Status</th>
                        <th className="text-left pb-1 font-medium">Holder</th>
                      </tr></thead>
                      <tbody>
                        {result.marciaFindings.map((f, i) => (
                          <tr key={i} className="border-b border-gray-50 last:border-0">
                            <td className="py-1 pr-3 font-medium text-gray-700">{f.name}</td>
                            <td className="py-1 pr-3 text-gray-500">{f.classNum}</td>
                            <td className="py-1 pr-3 text-gray-500">{f.status}</td>
                            <td className="py-1 text-gray-500 truncate max-w-24">{f.holder}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <a href={result.marciaUrl} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 mt-2 text-xs text-blue-600 hover:text-blue-800 font-medium">
                  <ExternalLink size={11} />{tr('openMarciaFull', lang)}
                </a>
              </div>
            )}
          </div>

          {/* 2 — LFPPI full */}
          <div className="border-b border-gray-100">
            <button type="button" onClick={() => setLfppiExpanded(v => !v)}
              className="w-full flex items-center justify-between px-4 py-2 text-xs font-medium text-gray-600 hover:bg-white/80 transition-colors">
              <span className="flex flex-col items-start text-left gap-0.5">
                <span className="flex items-center gap-1.5">
                  <Scale size={12} className="text-[#1a2e1a]" />
                  {tr('lfppiTitle', lang)}
                  <InfoTooltip text={tr('tooltipLfppi', lang)} />
                  {regFlags.length === 0 ? <span className="text-[10px] text-emerald-600 font-medium">— {tr('noIssues', lang)}</span> : <span className="text-[10px] text-red-600 font-medium">— {regFlags.length} {regFlags.length === 1 ? tr('issueDetected', lang) : tr('issuesDetected', lang)}</span>}
                </span>
                <span className="text-[9px] text-gray-400 font-normal pl-5">
                  {lang === 'es' ? 'Análisis de causales absolutas de negativa conforme a la Ley Federal de Protección a la Propiedad Industrial.' : lang === 'zh' ? '依据《联邦工业产权保护法》分析绝对驳回事由。' : lang === 'de' ? 'Analyse absoluter Verweigerungsgründe gemäß LFPPI.' : lang === 'fr' ? "Analyse des causes absolues de refus selon la LFPPI." : lang === 'hi' ? 'LFPPI के अनुसार पूर्ण अस्वीकृति के आधारों का विश्लेषण।' : lang === 'pt' ? 'Análise de causas absolutas de recusa conforme LFPPI.' : 'Analysis of absolute grounds for refusal under Mexico\'s LFPPI industrial property law.'}
                </span>
              </span>
              {lfppiExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
            {lfppiExpanded && (
              <div className="px-4 pb-3">
                {regFlags.length === 0 ? (
                  <div className="flex items-center gap-2 text-xs text-emerald-700">
                    <CheckCircle2 size={13} className="text-emerald-500" />
                    <span>{tr('noLfppiIssues', lang)}</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {[...regFlags].sort((a, b) => ({ high: 0, medium: 1, low: 2 }[a.severity] - ({ high: 0, medium: 1, low: 2 }[b.severity]))).map((f, i) => {
                      const sc = { high: 'bg-red-50 border-red-200 text-red-800', medium: 'bg-amber-50 border-amber-200 text-amber-800', low: 'bg-blue-50 border-blue-200 text-blue-800' }[f.severity];
                      const sb = { high: 'bg-red-100 text-red-700', medium: 'bg-amber-100 text-amber-700', low: 'bg-blue-100 text-blue-700' }[f.severity];
                      return (
                        <div key={i} className={`border rounded-lg px-3 py-2.5 ${sc}`}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide ${sb}`}>{f.severity}</span>
                            <span className="text-xs font-semibold">{CATEGORY_LABELS[f.category] ?? f.category}</span>
                          </div>
                          <p className="text-xs leading-relaxed opacity-90">{f.explanation}</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 3 — DuPont full */}
          {dupont.length > 0 && (
            <div className="border-b border-gray-100">
              <button type="button" onClick={() => setDupontExpanded(v => !v)}
                className="w-full flex items-center justify-between px-4 py-2 text-xs font-medium text-gray-600 hover:bg-white/80 transition-colors">
                <span className="flex flex-col items-start text-left gap-0.5">
                  <span className="flex items-center gap-1.5">
                    <Scale size={12} className="text-[#1a2e1a]" />
                    {tr('dupontTitle', lang)}
                    <InfoTooltip text={tr('tooltipDupont', lang)} />
                    <span className="text-[10px] text-gray-400 font-normal">— {dupontFavor} {tr('favoring', lang)}, {dupontNeutral} {tr('neutral', lang)}, {dupontAgainst} {tr('against', lang)}</span>
                  </span>
                  <span className="text-[9px] text-gray-400 font-normal pl-5">
                    {lang === 'es' ? 'Evaluación de los 13 factores DuPont de probabilidad de confusión aplicados al derecho de marcas mexicano.' : lang === 'zh' ? '依据墨西哥商标法评估13项杜邦混淆可能性因素。' : lang === 'de' ? 'Bewertung der 13 DuPont-Verwechslungsfaktoren nach mexikanischem Markenrecht.' : lang === 'fr' ? "Évaluation des 13 facteurs DuPont de probabilité de confusion appliqués au droit des marques mexicain." : lang === 'hi' ? 'मेक्सिकन ट्रेडमार्क कानून के तहत भ्रम की 13 DuPont कारकों का मूल्यांकन।' : lang === 'pt' ? 'Avaliação dos 13 fatores DuPont de probabilidade de confusão aplicados ao direito de marcas mexicano.' : 'Evaluation of all 13 DuPont likelihood-of-confusion factors applied to Mexican trademark law.'}
                  </span>
                </span>
                {dupontExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </button>
              {dupontExpanded && (
                <div className="px-4 pb-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {dupont.map((f, i) => {
                      const dot = f.verdict === 'favors_registration' ? 'bg-emerald-400' : f.verdict === 'against_registration' ? 'bg-red-400' : 'bg-gray-300';
                      const badge = f.verdict === 'favors_registration' ? 'text-emerald-700 bg-emerald-50' : f.verdict === 'against_registration' ? 'text-red-700 bg-red-50' : 'text-gray-500 bg-gray-100';
                      const label = f.verdict === 'favors_registration' ? tr('favors', lang) : f.verdict === 'against_registration' ? tr('againstReg', lang) : tr('neutral', lang);
                      return (
                        <div key={i} className="rounded-lg border border-gray-100 bg-white px-3 py-2.5">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dot}`} />
                            <span className="text-[11px] font-semibold text-gray-700 flex-1 min-w-0 leading-tight">{DUPONT_LABELS[f.factor] ?? f.factor}</span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide flex-shrink-0 ${badge}`}>{label}</span>
                          </div>
                          <p className="text-[11px] text-gray-500 leading-relaxed">{f.reasoning}</p>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-gray-400 mt-2 flex items-center gap-1">
                    <Info size={9} className="flex-shrink-0" />Based on In re E.I. DuPont DeNemours &amp; Co. (1973), applied to Mexican trademark law.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* 4 — Distinctiveness full */}
          {result.distinctiveness && (
            <div className="border-b border-gray-100 px-4 py-3">
              <div className="flex items-center gap-1.5 mb-1">
                <TrendingUp size={12} className="text-[#1a2e1a]" />
                <span className="text-xs font-semibold text-gray-700">{tr('distinctivenessTitle', lang)}</span>
                <InfoTooltip text={tr('tooltipDistinctiveness', lang)} />
              </div>
              <p className="text-[9px] text-gray-400 mb-2 pl-5">
                {lang === 'es' ? 'Clasificación de la distintividad de la marca en 5 niveles según la ley mexicana.' : lang === 'zh' ? '依据墨西哥法律将商标显著性分为5个等级。' : lang === 'de' ? 'Klassifizierung der Markenstärke in 5 Stufen nach mexikanischem Recht.' : lang === 'fr' ? "Classification de la distinctivité de la marque en 5 niveaux selon le droit mexicain." : lang === 'hi' ? 'मेक्सिकन कानून के अनुसार विशिष्टता को 5 स्तरों में वर्गीकृत करना।' : lang === 'pt' ? 'Classificação da distintividade da marca em 5 níveis conforme a lei mexicana.' : 'Classification of trademark distinctiveness across 5 tiers under Mexican law.'}
              </p>
              <div className="flex items-stretch gap-0 rounded-lg overflow-hidden border border-gray-200 mb-2">
                {TIER_ORDER.map(tier => {
                  const isActive = result.distinctiveness?.tier === tier;
                  return (
                    <div key={tier}
                      className={`flex-1 text-center py-1.5 text-[10px] font-semibold ${isActive ? TIER_COLORS[tier] + ' text-white' : TIER_INACTIVE[tier]}`}>
                      {tier.charAt(0).toUpperCase() + tier.slice(1).slice(0, 6)}
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">{result.distinctiveness.explanation}</p>
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${TIER_COLORS[result.distinctiveness.tier] ?? 'bg-gray-400'}`}
                    style={{ width: `${(result.distinctiveness.score / 5) * 100}%` }} />
                </div>
                <span className="text-[10px] text-gray-400 font-medium">{result.distinctiveness.score}/5</span>
              </div>
            </div>
          )}

          {/* 5 — Translation & Transliteration Analysis */}
          {result.translationAnalysis && result.translationAnalysis.length >= 0 && (() => {
            const tflags = result.translationAnalysis!;
            const conflictFlags = tflags.filter(f => f.risk !== 'none');
            const hasConflicts = conflictFlags.length > 0;
            return (
              <div className="border-b border-gray-100">
                <button type="button" onClick={() => setTranslationExpanded(v => !v)}
                  className="w-full flex items-center justify-between px-4 py-2 text-xs font-medium text-gray-600 hover:bg-white/80 transition-colors">
                  <span className="flex flex-col items-start text-left gap-0.5">
                    <span className="flex items-center gap-1.5">
                      <Globe size={12} className="text-[#1a2e1a]" />
                      {tr('translationTitle', lang)}
                      {!hasConflicts
                        ? <span className="text-[10px] text-emerald-600 font-medium">— {tr('noConflicts', lang) ?? 'No conflicts'}</span>
                        : <span className="text-[10px] text-amber-600 font-medium">— {conflictFlags.length} {tr('translationConflicts', lang)}</span>
                      }
                    </span>
                    <span className="text-[9px] text-gray-400 font-normal pl-5">
                      {lang === 'es' ? 'Análisis del significado e implicaciones de la marca en 8 idiomas.' : lang === 'zh' ? '分析商标在8种语言中的含义和影响。' : lang === 'de' ? 'Analyse der Bedeutung der Marke in 8 Sprachen.' : lang === 'fr' ? "Analyse de la signification et des implications de la marque dans 8 langues." : lang === 'hi' ? '8 भाषाओं में चिह्न के अर्थ और निहितार्थ का विश्लेषण।' : lang === 'pt' ? 'Análise do significado e implicações da marca em 8 idiomas.' : 'Analysis of the mark\'s meaning and implications across 8 languages.'}
                    </span>
                  </span>
                  {translationExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                </button>
                {translationExpanded && (
                  <div className="px-4 pb-3">
                    {!hasConflicts ? (
                      <div className="flex items-center gap-2 text-xs text-emerald-700">
                        <CheckCircle2 size={13} className="text-emerald-500" />
                        <span>{tr('translationNoConflicts', lang)}</span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {conflictFlags.map((f, i) => {
                          const sc = { high: 'bg-red-50 border-red-200 text-red-800', medium: 'bg-amber-50 border-amber-200 text-amber-800', low: 'bg-blue-50 border-blue-200 text-blue-800', none: 'bg-gray-50 border-gray-200 text-gray-700' }[f.risk];
                          const sb = { high: 'bg-red-100 text-red-700', medium: 'bg-amber-100 text-amber-700', low: 'bg-blue-100 text-blue-700', none: 'bg-gray-100 text-gray-500' }[f.risk];
                          return (
                            <div key={i} className={`border rounded-lg px-3 py-2.5 ${sc}`}>
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide ${sb}`}>{f.risk}</span>
                                <span className="text-xs font-semibold">{f.languageName}</span>
                                <span className="text-[10px] text-gray-500 font-mono bg-white/60 px-1.5 py-0.5 rounded border border-current/10">{tr('translatedAs', lang)}: &ldquo;{f.translatedForm}&rdquo;</span>
                              </div>
                              {f.issueCategory && <p className="text-[10px] font-medium opacity-70 mb-0.5 uppercase tracking-wide">{f.issueCategory}</p>}
                              <p className="text-xs leading-relaxed opacity-90">{f.details}</p>
                            </div>
                          );
                        })}
                        <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                          <Info size={9} className="flex-shrink-0" />Full translation conflict details are included in the purchased PDF report.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })()}

          {/* 6 — Web findings */}
          {result.webFindings.length > 0 && (
            <div className="border-b border-gray-100">
              <button type="button" onClick={() => setWebExpanded(v => !v)}
                className="w-full flex items-center justify-between px-4 py-2 text-xs font-medium text-gray-600 hover:bg-white/80 transition-colors">
                <span className="flex items-center gap-1.5"><Eye size={12} className="text-[#1a2e1a]" />{tr('webTitle', lang)} ({result.webFindings.length})</span>
                {webExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </button>
              {webExpanded && (
                <ul className="px-4 pb-3 space-y-1">
                  {result.webFindings.map((f, i) => (
                    <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                      <span className="text-gray-400 flex-shrink-0">•</span><span>{f}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* 7 — All domains */}
          {domainResults.length > 0 && (
            <div className="border-b border-gray-100">
              <button type="button" onClick={() => setDomainExpanded(v => !v)}
                className="w-full flex items-center justify-between px-4 py-2 text-xs font-medium text-gray-600 hover:bg-white/80 transition-colors">
                <span className="flex flex-col items-start text-left gap-0.5">
                  <span className="flex items-center gap-1.5">
                    <Globe size={12} className="text-blue-500" />
                    {tr('domainsTitle', lang)}
                    <InfoTooltip text={tr('tooltipDomains', lang)} />
                  </span>
                  <span className="text-[9px] text-gray-400 font-normal pl-5">
                    {lang === 'es' ? 'Disponibilidad de dominios en 13 TLDs incluyendo .com, .mx, .net, .io y más.' : lang === 'zh' ? '检查包括.com、.mx、.net、.io等13个顶级域名的可用性。' : lang === 'de' ? 'Domainverfügbarkeit für 13 TLDs inkl. .com, .mx, .net, .io u.a.' : lang === 'fr' ? "Disponibilité des domaines sur 13 TLD dont .com, .mx, .net, .io et plus." : lang === 'hi' ? '.com, .mx, .net, .io और अन्य सहित 13 TLD में डोमेन उपलब्धता।' : lang === 'pt' ? 'Disponibilidade de domínios em 13 TLDs incluindo .com, .mx, .net, .io e mais.' : 'Domain availability across 13 TLDs including .com, .mx, .net, .io, and more.'}
                  </span>
                </span>
                {domainExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </button>
              {domainExpanded && (
                <div className="px-4 pb-3 space-y-0.5">
                  {domainResults.map(d => (
                    <div key={d.domain} className="flex items-center justify-between py-1 border-b border-gray-50 last:border-0">
                      <span className="text-xs font-mono text-gray-700">{d.domain}</span>
                      {d.status === 'available' && <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full flex items-center gap-0.5"><CheckCircle2 size={9} />{tr('available', lang)}</span>}
                      {d.status === 'taken' && <span className="text-[10px] font-semibold text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-full flex items-center gap-0.5"><AlertCircle size={9} />{tr('taken', lang)}</span>}
                      {d.status === 'unknown' && <span className="text-[10px] font-semibold text-gray-500 bg-gray-50 border border-gray-200 px-1.5 py-0.5 rounded-full flex items-center gap-0.5"><Minus size={9} />{tr('unknown', lang)}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Purchase / Post-payment flow ───────────────────────────────────── */}
      <div className="border-t border-gray-100">

        {/* POST-PAYMENT state */}
        {paid && purchaseStep === 'done' && (
          <div className="px-4 py-4 bg-emerald-50 border-t border-emerald-100">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 size={16} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-emerald-800">{tr('confirmed', lang)}</p>
                <p className="text-xs text-emerald-700 mt-0.5">{tr('sentTo', lang)} <strong>{email}</strong></p>
                <p className="text-xs text-emerald-600 mt-0.5">{tr('fullReportBelow', lang)}</p>
              </div>
            </div>
            {pdfUrl ? (
              <a href={pdfUrl} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#1a2e1a] hover:bg-[#2d4a2d] text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors">
                <Download size={13} />{tr('downloadPdf', lang)}
              </a>
            ) : (
              <div className="inline-flex items-center gap-2 text-xs text-emerald-600">
                <Loader2 size={13} className="animate-spin" />{tr('generatingPdf', lang)}
              </div>
            )}
          </div>
        )}

        {/* CTA card */}
        {!paid && purchaseStep === 'cta' && (
          <div className="px-4 py-4 bg-gradient-to-br from-[#1a2e1a] to-[#2d4a2d]">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-[#c9a84c]/20 border border-[#c9a84c]/30 flex items-center justify-center flex-shrink-0">
                <Sparkles size={16} className="text-[#c9a84c]" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-bold text-white leading-tight">{tr('ctaTitle', lang)}</p>
                  <InfoTooltip text={tr('ctaPriceTooltip', lang)} className="bg-white/20 text-white hover:bg-white/30" />
                </div>
                <p className="text-xs text-[#9db89d] mt-1 leading-relaxed">{tr('ctaDesc', lang)}</p>
              </div>
            </div>
            {/* Feature list */}
            <div className="space-y-1 mb-4">
              {tr('ctaItems', lang).split(' · ').map((item, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <CheckCircle2 size={10} className="text-[#c9a84c] flex-shrink-0" />
                  <span className="text-[11px] text-[#b8d0b8]">{item}</span>
                </div>
              ))}
            </div>
            <button type="button" onClick={() => setPurchaseStep('email')}
              className="w-full flex items-center justify-center gap-2 bg-[#c9a84c] hover:bg-[#b8963e] text-white font-bold px-5 py-3 rounded-xl transition-colors shadow-md text-sm">
              <FileText size={14} />
              {tr('ctaPrice', lang)}
              <ArrowRight size={14} />
            </button>
          </div>
        )}

        {/* Step 1: Email */}
        {!paid && purchaseStep === 'email' && (
          <div className="px-4 py-4 bg-white">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-full bg-[#1a2e1a] text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">1</div>
              <p className="text-sm font-bold text-gray-800">{tr('emailStepTitle', lang)}</p>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  <Mail size={11} className="inline mr-1" />{tr('emailLabel', lang)}
                </label>
                <input type="email" value={email} onChange={e => { setEmail(e.target.value); setEmailError(''); }}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#c9a84c] focus:border-transparent"
                  placeholder="you@example.com" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  <Mail size={11} className="inline mr-1" />{tr('emailConfirmLabel', lang)}
                </label>
                <input type="email" value={emailConfirm} onChange={e => { setEmailConfirm(e.target.value); setEmailError(''); }}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#c9a84c] focus:border-transparent"
                  placeholder="you@example.com" />
              </div>
              {emailError && (
                <p className="text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle size={11} className="flex-shrink-0" />{emailError}
                </p>
              )}
              <button type="button" onClick={handleEmailContinue}
                disabled={!email || !emailConfirm}
                className="w-full flex items-center justify-center gap-2 bg-[#1a2e1a] hover:bg-[#2d4a2d] disabled:opacity-50 text-white font-semibold px-4 py-3 rounded-xl transition-colors text-sm">
                {tr('continueToPayment', lang)}<ArrowRight size={14} />
              </button>
              <button type="button" onClick={() => setPurchaseStep('cta')}
                className="w-full text-xs text-gray-400 hover:text-gray-600 underline">{tr('back', lang)}</button>
            </div>
          </div>
        )}

        {/* Step 2: Coupon + price review */}
        {!paid && purchaseStep === 'coupon' && (
          <div className="px-4 py-4 bg-white">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-full bg-[#1a2e1a] text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">2</div>
              <p className="text-sm font-bold text-gray-800">{tr('couponTitle', lang)}</p>
            </div>
            {/* Price display */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 mb-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-500">{tr('originalPrice', lang)}</span>
                <span className={`text-xs font-medium ${couponApplied ? 'line-through text-gray-400' : 'text-gray-800'}`}>USD $4.99</span>
              </div>
              {couponApplied && (
                <>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-emerald-600 font-medium">{tr('discountApplied', lang)} ({discountPercent}%)</span>
                    <span className="text-xs text-emerald-600 font-medium">−USD ${(4.99 - finalAmount).toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-gray-200 pt-1.5 mt-1.5">
                    <span className="text-xs font-semibold text-gray-700">{tr('afterDiscount', lang)}</span>
                    <span className="text-sm font-bold text-[#1a2e1a]">USD ${finalAmount.toFixed(2)}</span>
                  </div>
                  {discountPercent >= 99 && (
                    <p className="text-[10px] text-gray-400 mt-1">{tr('minCharge', lang)}</p>
                  )}
                </>
              )}
            </div>
            {/* Coupon input */}
            <div className="mb-4">
              <p className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1"><Tag size={11} />{tr('haveCoupon', lang)}</p>
              <div className="flex gap-2">
                <input type="text" value={couponInput} onChange={e => { setCouponInput(e.target.value.toUpperCase()); setCouponError(''); setCouponApplied(false); }}
                  placeholder={tr('couponPlaceholder', lang)}
                  className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-[#c9a84c] focus:border-transparent"
                  disabled={couponApplied} />
                <button type="button" onClick={handleApplyCoupon} disabled={couponValidating || couponApplied || !couponInput.trim()}
                  className="px-3 py-2 bg-[#1a2e1a] hover:bg-[#2d4a2d] disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition-colors whitespace-nowrap">
                  {couponValidating ? <Loader2 size={13} className="animate-spin" /> : tr('applyCode', lang)}
                </button>
              </div>
              {couponError && <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1"><AlertCircle size={11} />{couponError}</p>}
              {couponApplied && <p className="text-xs text-emerald-600 mt-1.5 flex items-center gap-1"><CheckCircle2 size={11} />{tr('discountApplied', lang)}</p>}
            </div>
            {piError && <p className="text-xs text-red-600 mb-2 flex items-center gap-1"><AlertCircle size={11} />{piError}</p>}
            <button type="button" onClick={handleProceedToPayment} disabled={piLoading}
              className="w-full flex items-center justify-center gap-2 bg-[#c9a84c] hover:bg-[#b8963e] disabled:opacity-60 text-white font-bold px-4 py-3 rounded-xl transition-colors text-sm">
              {piLoading ? <Loader2 size={14} className="animate-spin" /> : <Lock size={14} />}
              {tr('proceedPayment', lang)} — USD ${finalAmount.toFixed(2)}
            </button>
            <button type="button" onClick={() => setPurchaseStep('email')}
              className="w-full text-xs text-gray-400 hover:text-gray-600 underline mt-2">{tr('back', lang)}</button>
          </div>
        )}

        {/* Step 3: Stripe payment */}
        {!paid && purchaseStep === 'payment' && clientSecret && stripePromise && (
          <div className="px-4 py-4 bg-white">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-full bg-[#1a2e1a] text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">3</div>
              <p className="text-sm font-bold text-gray-800">Secure Payment — USD ${finalAmount.toFixed(2)}</p>
            </div>
            <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe' } }}>
              <InlineCheckout
                lang={lang}
                finalAmount={finalAmount}
                clientSecret={clientSecret}
                paymentIntentId={paymentIntentId}
                reportOrderId={reportOrderId}
                userId={user?.id}
                onSuccess={handlePaymentSuccess}
                onBack={() => setPurchaseStep('coupon')}
              />
            </Elements>
          </div>
        )}
      </div>

      {/* ── Disclaimer ─────────────────────────────────────────────────────── */}
      <div className="border-t border-gray-100 bg-white/40 px-4 py-2 flex items-start gap-1.5">
        <Info size={11} className="text-gray-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-gray-400 leading-relaxed">{result.disclaimer}</p>
      </div>

      {/* ── Use this mark anyway (when caller provides handler) ─────────────── */}
      {onSelectDespiteRisk && (result.risk === 'medium' || result.risk === 'high') && !paid && (
        <div className="border-t border-gray-100 bg-white/60 px-4 py-2">
          <button type="button" onClick={() => onSelectDespiteRisk(markName)}
            className="text-xs text-gray-400 hover:text-gray-600 underline flex items-center gap-1">
            <ArrowRight size={11} />Use this mark anyway despite risks →
          </button>
        </div>
      )}
    </div>
  );
}
