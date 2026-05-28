import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { trackEvent } from '../lib/analytics';
import { supabase } from '../lib/supabase';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import {
  Shield, Loader2, ChevronDown, ChevronUp, ExternalLink,
  AlertTriangle, CheckCircle2, AlertCircle, Info, Globe,
  Scale, ArrowRight, TrendingUp, FileSearch, Minus, Lock,
  FileText, Mail, Tag, Download, Sparkles, Eye, Printer, HelpCircle, X,
  Filter, BarChart2, List, Zap, AlertOctagon,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface MarciaFinding { name: string; status: string; classNum: string; holder: string; imageUrl?: string; goodsServices?: string; expediente?: string; registrationNumber?: string; filingDate?: string; registrationDate?: string; expiryDate?: string; }
interface ElementDecomposition { element: string; distinctivenessTier: 'generic' | 'descriptive' | 'suggestive' | 'arbitrary' | 'fanciful'; role: 'dominant' | 'secondary' | 'descriptive_modifier' | 'filler'; note?: string; }
interface FamousMarkConflict { famousMark: string; similarity: number; lfppiArticle: string; }
interface DomainResult { domain: string; available: boolean | null; status: 'available' | 'taken' | 'unknown'; }
export interface RegistrabilityFlag { category: string; severity: 'low' | 'medium' | 'high'; explanation: string; explanation_en?: string; explanation_user?: string; }
export interface DupontFactor { factor: string; verdict: 'favors_registration' | 'neutral' | 'against_registration'; reasoning: string; reasoning_en?: string; reasoning_user?: string; }
export interface DistinctivenessAssessment { tier: 'generic' | 'descriptive' | 'suggestive' | 'arbitrary' | 'fanciful'; score: number; explanation: string; explanation_en?: string; explanation_user?: string; }
export interface TranslationFlag { languageCode: string; languageName: string; translatedForm: string; romanization?: string; risk: 'none' | 'low' | 'medium' | 'high'; issueCategory: string | null; details: string; details_en: string; }

interface AlternativeName {
  name: string;
  score: number;
  rationale: string;
  rationale_en: string;
}

interface ClearanceResult {
  risk: 'low' | 'medium' | 'high';
  riskColor?: 'VERDE' | 'AMARILLO' | 'NARANJA' | 'ROJO';
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
  riskSummary_user?: string;
  translationAnalysis?: TranslationFlag[];
  elementDecomposition?: ElementDecomposition[];
  famousMarkConflicts?: FamousMarkConflict[];
  malaFe?: { detected: boolean; riskLevel: 'none' | 'low' | 'medium' | 'high'; explanation: string; explanation_en: string; indicators: string[] };
  variantsSearched?: string[];
  searchLanguage?: string;
  disclaimer: string;
  alternativeNames?: AlternativeName[];
}

export type { ClearanceResult };

interface Props {
  markName: string;
  goodsServices?: string;
  classes: number[];
  language: 'en' | 'zh' | 'es' | 'de' | 'fr' | 'hi' | 'pt';
  autoRun?: boolean;
  showFilingCta?: boolean;
  onStartFiling?: () => void;
  onResult?: (result: ClearanceResult) => void;
  onSelectDespiteRisk?: (markName: string) => void;
  onRiskAcknowledgedChange?: (acknowledged: boolean) => void;
  imageBase64?: string;
  imageMimeType?: string;
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
  generic: 'Generic (Art. 173 Fr. I LFPPI)',
  descriptive: 'Descriptive (Art. 173 Fr. II LFPPI)',
  generic_descriptive: 'Generic or Descriptive (Art. 173 Fr. I–II LFPPI)',
  functional_shape: 'Functional Shape (Art. 173 Fr. IV LFPPI)',
  deceptive: 'Deceptive or Misleading (Art. 173 Fr. V LFPPI)',
  official_emblems: 'Official Emblems / Flags (Art. 173 Fr. VI LFPPI)',
  personal_identity: 'Personal Identity Without Consent (Art. 173 Fr. VII LFPPI)',
  famous_mark: 'Famous or Notorious Mark (Art. 173 Fr. IX LFPPI)',
  protected_characters: 'Protected Characters / Titles (Art. 173 Fr. X LFPPI)',
  geographic_indication: 'Protected Geographic Indication (Art. 173 Fr. XI LFPPI)',
  immoral_offensive: 'Contrary to Public Order / Morality (Art. 173 Fr. XII LFPPI)',
  isolated_color: 'Isolated Color (Art. 173 Fr. XIII LFPPI)',
  non_distinctive_nontrad: 'Non-Distinctive Non-Traditional Mark (Art. 173 Fr. XIV LFPPI)',
  confusingly_similar: 'Confusingly Similar to Existing Mark (Art. 173 Fr. XVIII LFPPI)',
  bad_faith: 'Bad Faith Filing (Art. 173 Fr. XXII LFPPI)',
};

const TIER_ORDER = ['generic', 'descriptive', 'suggestive', 'arbitrary', 'fanciful'] as const;
const TIER_COLORS: Record<string, string> = { generic: 'bg-red-500', descriptive: 'bg-orange-500', suggestive: 'bg-amber-500', arbitrary: 'bg-emerald-500', fanciful: 'bg-[#1a2e1a]' };
const TIER_INACTIVE: Record<string, string> = { generic: 'bg-red-50 text-red-300', descriptive: 'bg-orange-50 text-orange-300', suggestive: 'bg-amber-50 text-amber-300', arbitrary: 'bg-emerald-50 text-emerald-300', fanciful: 'bg-[#1a2e1a]/5 text-[#1a2e1a]/30' };

// ─── Translation helper ───────────────────────────────────────────────────────

type Lang = 'en' | 'zh' | 'es' | 'de' | 'fr' | 'hi' | 'pt' | 'ja';

const UI: Record<string, Record<string, string>> = {
  // Executive summary
  clearanceAnalysis: { en: 'Clearance Analysis', es: 'Análisis de Disponibilidad', zh: '检索分析', de: 'Rechercheanalyse', fr: 'Analyse de disponibilité', hi: 'क्लीयरेंस विश्लेषण', pt: 'Análise de Disponibilidade' },
  idleTitle: { en: 'Trademark Clearance Analysis', es: 'Análisis de Disponibilidad de Marca', zh: '商标检索分析', de: 'Markenrecherche-Analyse', fr: 'Analyse de disponibilité de marque', hi: 'ट्रेडमार्क क्लीयरेंस विश्लेषण', pt: 'Análise de Disponibilidade de Marca' },
  idleDesc: { en: 'Full DuPont, distinctiveness, IMPI MARCia, web & domain check', es: 'DuPont completo, distintividad, IMPI MARCia, búsqueda web y dominios', zh: '完整杜邦分析、显著性、IMPI MARCia、网络和域名检查', de: 'Vollständige DuPont-Analyse, Unterscheidungskraft, IMPI MARCia, Web & Domains', fr: 'Analyse DuPont complète, distinctivité, IMPI MARCia, web & domaines', hi: 'पूर्ण DuPont, विशिष्टता, IMPI MARCia, वेब और डोमेन जांच', pt: 'DuPont completo, distintividade, IMPI MARCia, web e domínios' },
  checkBtn: { en: 'Check', es: 'Verificar', zh: '检索', de: 'Prüfen', fr: 'Vérifier', hi: 'जांचें', pt: 'Verificar' },
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
  inFullReport: { en: 'More info in Full Report', es: 'Más info en el Reporte Completo', zh: '完整报告中有更多信息', de: 'Mehr Info im vollständigen Bericht', fr: 'Plus d\'info dans le rapport complet', hi: 'पूर्ण रिपोर्ट में अधिक जानकारी', pt: 'Mais info no Relatório Completo' },
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
    en: 'More information available in the Full Report.',
    es: 'Más información disponible en el Reporte Completo.',
    zh: '完整报告中有更多信息。',
    de: 'Im vollständigen Bericht sind weitere Informationen verfügbar.',
    fr: 'Plus d\'informations disponibles dans le rapport complet.',
    hi: 'पूर्ण रिपोर्ट में अधिक जानकारी उपलब्ध है।',
    pt: 'Mais informações disponíveis no Relatório Completo.',
  },
  fullReportTooltip: {
    en: 'The Full Clearance Report includes: all 13 DuPont likelihood-of-confusion factors with detailed reasoning, full LFPPI absolute-grounds analysis, all IMPI MARCia registry results, translation and transliteration conflicts in 8 languages, 13 domain TLDs, web presence findings, and professional PDF delivered in your language and in English — timestamped and ready to share.',
    es: 'El Reporte Completo incluye: los 13 factores DuPont con razonamiento detallado, análisis LFPPI completo, todos los resultados MARCia, conflictos de traducción en 8 idiomas, 13 dominios, hallazgos web y PDF profesional en español e inglés con sello de tiempo.',
    zh: '完整报告包括：13个杜邦因素（含详细推理）、完整LFPPI分析、所有MARCia结果、8种语言的翻译冲突、13个域名、网络检索结果，以及中英文专业PDF（带时间戳）。',
    de: 'Der vollständige Bericht umfasst: alle 13 DuPont-Faktoren mit detaillierter Begründung, vollständige LFPPI-Analyse, alle MARCia-Ergebnisse, Übersetzungskonflikte in 8 Sprachen, 13 Domains, Web-Recherche und professionelles PDF auf Deutsch und Englisch.',
    fr: 'Le rapport complet comprend : les 13 facteurs DuPont avec raisonnement détaillé, analyse LFPPI complète, tous les résultats MARCia, conflits de traduction en 8 langues, 13 domaines, recherche web et PDF professionnel en français et anglais.',
    hi: 'पूर्ण रिपोर्ट में शामिल हैं: 13 DuPont कारक (विस्तृत तर्क के साथ), पूर्ण LFPPI विश्लेषण, सभी MARCia परिणाम, 8 भाषाओं में अनुवाद संघर्ष, 13 डोमेन, वेब खोज और हिंदी व अंग्रेजी में PDF।',
    pt: 'O Relatório Completo inclui: todos os 13 fatores DuPont com raciocínio detalhado, análise LFPPI completa, todos os resultados MARCia, conflitos de tradução em 8 idiomas, 13 domínios, pesquisa web e PDF profissional em português e inglês.',
  },
  // Change 1+2+3: Filing CTA and alternative names
  ctaFileThisName: { en: 'File this trademark now — $299 USD', es: 'Registrar esta marca ahora — $299 USD', fr: 'Déposer cette marque maintenant — 299 $ USD', pt: 'Registrar esta marca agora — US$ 299', de: 'Marke jetzt anmelden — 299 $ USD', it: 'Deposita questo marchio ora — 299 $ USD', zh: '立即注册此商标 — $299 USD', ja: 'この商標を今すぐ出願 — $299 USD', hi: 'इस ट्रेडमार्क को अभी दाखिल करें — $299 USD' },
  getPdfReport: { en: 'Get PDF Report', es: 'Obtener PDF', fr: 'Obtenir le PDF', pt: 'Obter PDF', de: 'PDF erhalten', it: 'Ottieni PDF', zh: '获取PDF报告', ja: 'PDFを取得', hi: 'PDF रिपोर्ट प्राप्त करें' },
  pdfModalTitle: { en: 'Get your PDF Report', es: 'Obtener su Reporte PDF', fr: 'Obtenir votre rapport PDF', pt: 'Obtenha seu Relatório PDF', de: 'Ihr PDF-Bericht', it: 'Ottieni il tuo Report PDF', zh: '获取您的PDF报告', ja: 'PDFレポートを取得', hi: 'अपनी PDF रिपोर्ट प्राप्त करें' },
  pdfModalDesc: { en: 'Enter your email and we\'ll generate a timestamped PDF of this full report and send it to your inbox.', es: 'Ingresa tu correo y generaremos un PDF con sello de tiempo de este reporte completo y lo enviaremos a tu bandeja.', fr: 'Entrez votre e-mail et nous générerons un PDF horodaté de ce rapport complet.', pt: 'Insira seu e-mail e geraremos um PDF com carimbo de tempo deste relatório completo.', de: 'Geben Sie Ihre E-Mail ein und wir erstellen ein zeitgestempeltes PDF dieses vollständigen Berichts.', it: 'Inserisci la tua e-mail e genereremo un PDF con timestamp di questo report completo.', zh: '输入您的邮箱，我们将生成此完整报告的带时间戳PDF并发送到您的邮箱。', ja: 'メールアドレスを入力してください。このレポートのタイムスタンプ付きPDFを生成してお送りします。', hi: 'अपना ईमेल दर्ज करें और हम इस पूरी रिपोर्ट का टाइमस्टैम्प PDF तैयार करके आपके इनबॉक्स में भेजेंगे।' },
  pdfGenerating: { en: 'Generating your PDF…', es: 'Generando tu PDF…', fr: 'Génération du PDF…', pt: 'Gerando PDF…', de: 'PDF wird erstellt…', it: 'Generazione PDF in corso…', zh: '正在生成PDF…', ja: 'PDF生成中…', hi: 'PDF तैयार हो रहा है…' },
  pdfSent: { en: 'PDF sent! Check your inbox.', es: '¡PDF enviado! Revisa tu bandeja.', fr: 'PDF envoyé ! Vérifiez votre boîte.', pt: 'PDF enviado! Verifique sua caixa.', de: 'PDF gesendet! Prüfen Sie Ihren Posteingang.', it: 'PDF inviato! Controlla la tua casella.', zh: 'PDF已发送！请查收邮件。', ja: 'PDF送信済み！受信トレイをご確認ください。', hi: 'PDF भेज दिया! अपना इनबॉक्स देखें।' },
  downloadPdfNow: { en: 'Download PDF', es: 'Descargar PDF', fr: 'Télécharger le PDF', pt: 'Baixar PDF', de: 'PDF herunterladen', it: 'Scarica PDF', zh: '下载PDF', ja: 'PDFをダウンロード', hi: 'PDF डाउनलोड करें' },
  pdfModalCloseSafe: { en: 'You can close this window — your PDF will still be sent.', es: 'Puedes cerrar esta ventana — tu PDF se enviará de todos modos.', fr: 'Vous pouvez fermer cette fenêtre — votre PDF sera envoyé quand même.', pt: 'Você pode fechar esta janela — seu PDF ainda será enviado.', de: 'Sie können dieses Fenster schließen — Ihr PDF wird trotzdem gesendet.', it: 'Puoi chiudere questa finestra — il tuo PDF verrà comunque inviato.', zh: '您可以关闭此窗口——您的PDF仍会发送给您。', ja: 'このウィンドウを閉じても構いません。PDFは送信されます。', hi: 'आप इस विंडो को बंद कर सकते हैं — आपका PDF फिर भी भेजा जाएगा।' },
  ctaStrongerNames: { en: 'Three stronger names you can file instead →', es: 'Tres nombres más sólidos que puede registrar →', fr: 'Trois noms plus solides que vous pouvez déposer →', pt: 'Três nomes mais sólidos que você pode registrar →', de: 'Drei stärkere Namen, die Sie stattdessen anmelden können →', it: 'Tre nomi più solidi che puoi depositare →', zh: '三个更稳妥、可改为注册的名称 →', ja: '代わりに出願できる、より強力な3つの名称 →', hi: 'इसके बजाय दाखिल करने योग्य तीन मज़बूत नाम →' },
  // Change 4: Scope statement
  scopeStatement: {
    en: 'MTC files your mark with IMPI as submitted. The clearance report is automated and informational, not legal advice. IMPI alone determines registration. Government fees are non-refundable.',
    es: 'MTC presenta su marca ante el IMPI tal como usted la somete. El informe es automatizado e informativo, no es asesoría legal. Solo el IMPI determina el registro. Las tarifas oficiales no son reembolsables.',
    fr: "MTC dépose votre marque auprès de l'IMPI telle que vous la soumettez. Le rapport est automatisé et informatif, il ne constitue pas un avis juridique. Seul l'IMPI décide de l'enregistrement. Les taxes officielles ne sont pas remboursables.",
    pt: 'A MTC deposita sua marca no IMPI tal como você a submete. O relatório é automatizado e informativo, não é assessoria jurídica. Somente o IMPI determina o registro. As taxas oficiais não são reembolsáveis.',
    de: 'MTC meldet Ihre Marke beim IMPI so an, wie Sie sie einreichen. Der Bericht ist automatisiert und informativ, keine Rechtsberatung. Allein das IMPI entscheidet über die Eintragung. Amtliche Gebühren sind nicht erstattungsfähig.',
    it: "MTC deposita il tuo marchio presso l'IMPI così come lo invii. Il rapporto è automatizzato e informativo, non è consulenza legale. Solo l'IMPI determina la registrazione. Le tasse ufficiali non sono rimborsabili.",
    zh: 'MTC 按您提交的内容向 IMPI 申请您的商标。本报告由自动化分析生成，仅供参考，不构成法律意见。是否核准注册完全由 IMPI 决定。官方规费一经缴纳，恕不退还。',
    ja: 'MTC はお客様が提出された内容のまま商標を IMPI に出願します。本レポートは自動生成された参考情報であり、法的助言ではありません。登録の可否は IMPI のみが決定します。公的手数料は返金されません。',
    hi: 'MTC आपके चिह्न को आपके द्वारा प्रस्तुत रूप में IMPI के समक्ष दाखिल करता है। यह रिपोर्ट स्वचालित और सूचनात्मक है, कानूनी सलाह नहीं। पंजीकरण का निर्णय केवल IMPI करता है। सरकारी शुल्क वापस नहीं किया जाता।',
  },
  // Change 4c: Attorney review offer
  attorneyReviewOffer: {
    en: 'Want certainty before you file? Have a Mexican IP attorney review this mark for $9.99.',
    es: '¿Quiere certeza antes de presentar? Un abogado mexicano en marcas revisa esta marca por $9.99.',
    fr: 'Vous voulez une certitude avant de déposer ? Faites examiner cette marque par un avocat mexicain en PI pour 9,99 $.',
    pt: 'Quer certeza antes de registrar? Um advogado mexicano de PI revisa esta marca por US$ 9,99.',
    de: 'Sicherheit vor der Anmeldung? Lassen Sie diese Marke von einem mexikanischen IP-Anwalt für 9,99 $ prüfen.',
    it: 'Vuoi certezza prima di depositare? Fai esaminare questo marchio da un avvocato messicano in PI per 9,99 $.',
    zh: '申请前想更有把握？由墨西哥知识产权律师审核此商标，仅需 $9.99。',
    ja: '出願前に確実性が欲しいですか？メキシコの知財弁護士がこの商標を $9.99 で確認します。',
    hi: 'दाखिल करने से पहले निश्चितता चाहते हैं? एक मैक्सिकन IP वकील से इस चिह्न की समीक्षा कराएं — $9.99 में।',
  },
  // Change 0: Optional email capture card
  emailCaptureHeading: { en: 'Get this report by email', es: 'Reciba este informe por correo', fr: 'Recevez ce rapport par e-mail', pt: 'Receba este relatório por e-mail', de: 'Diesen Bericht per E-Mail erhalten', it: 'Ricevi questo rapporto via e-mail', zh: '通过电子邮件获取本报告', ja: 'このレポートをメールで受け取る', hi: 'यह रिपोर्ट ईमेल पर प्राप्त करें' },
  freePdfCta: { en: 'Get your free PDF report', es: 'Obtener tu reporte PDF gratis', fr: 'Obtenir votre rapport PDF gratuit', pt: 'Obter seu relatório PDF gratuito', de: 'Kostenlosen PDF-Bericht erhalten', it: 'Ottieni il tuo report PDF gratuito', zh: '获取免费PDF报告', ja: '無料PDFレポートを取得', hi: 'मुफ़्त PDF रिपोर्ट प्राप्त करें' },
  emailCaptureSub: {
    en: "The full report is shown below and free to download — no email required. Add your email only if you'd like a copy sent to your inbox.",
    es: 'El informe completo se muestra abajo y puede descargarlo gratis, sin necesidad de correo. Agregue su correo solo si desea recibir una copia.',
    fr: 'Le rapport complet s\'affiche ci-dessous et est téléchargeable gratuitement, sans e-mail. Indiquez votre e-mail uniquement si vous souhaitez en recevoir une copie.',
    pt: 'O relatório completo aparece abaixo e pode ser baixado gratuitamente, sem e-mail. Informe seu e-mail apenas se quiser receber uma cópia.',
    de: 'Der vollständige Bericht wird unten angezeigt und ist kostenlos herunterladbar – ohne E-Mail. Geben Sie Ihre E-Mail nur an, wenn Sie eine Kopie möchten.',
    it: 'Il rapporto completo è mostrato qui sotto ed è scaricabile gratuitamente, senza e-mail. Inserisci la tua e-mail solo se desideri riceverne una copia.',
    zh: '完整报告已显示在下方，可免费下载，无需邮箱。如希望收到副本，再填写邮箱即可。',
    ja: '完全なレポートは下に表示されており、メールアドレスなしで無料でダウンロードできます。コピーの送付を希望される場合のみご入力ください。',
    hi: 'पूरी रिपोर्ट नीचे दिखाई गई है और बिना ईमेल के मुफ़्त डाउनलोड की जा सकती है। प्रति प्राप्त करना चाहें तभी अपना ईमेल जोड़ें।',
  },
  emailCaptureSend: { en: 'Send me a copy', es: 'Enviarme una copia', fr: 'M\'envoyer une copie', pt: 'Enviar uma cópia', de: 'Kopie senden', it: 'Inviami una copia', zh: '发送副本', ja: 'コピーを送る', hi: 'मुझे एक प्रति भेजें' },
  emailCaptureSent: { en: 'Sent! Check your inbox.', es: '¡Enviado! Revisa tu bandeja.', fr: 'Envoyé ! Vérifiez votre boîte.', pt: 'Enviado! Verifique sua caixa.', de: 'Gesendet! Prüfen Sie Ihren Posteingang.', it: 'Inviato! Controlla la tua casella.', zh: '已发送！请查收邮件。', ja: '送信済み！受信トレイをご確認ください。', hi: 'भेज दिया! अपना इनबॉक्स देखें।' },
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
  // Free order
  freeOrder: { en: 'Free Report — $0.00', es: 'Reporte Gratuito — $0.00', zh: '免费报告 — $0.00', de: 'Kostenloser Bericht — $0.00', fr: 'Rapport gratuit — $0.00', hi: 'निःशुल्क रिपोर्ट — $0.00', pt: 'Relatório Gratuito — $0.00', ja: '無料レポート — $0.00' },
  freeOrderMsg: { en: '100% discount applied — no payment required. Click below to receive your report.', es: 'Descuento del 100% aplicado — no se requiere pago. Haz clic abajo para recibir tu reporte.', zh: '已应用100%折扣，无需付款。点击下方接收您的报告。', de: '100% Rabatt angewendet — keine Zahlung erforderlich. Klicken Sie unten, um Ihren Bericht zu erhalten.', fr: 'Remise de 100% appliquée — aucun paiement requis. Cliquez ci-dessous pour recevoir votre rapport.', hi: '100% छूट लागू — कोई भुगतान आवश्यक नहीं। अपनी रिपोर्ट प्राप्त करने के लिए नीचे क्लिक करें।', pt: 'Desconto de 100% aplicado — nenhum pagamento necessário. Clique abaixo para receber seu relatório.', ja: '100%割引適用 — お支払い不要。レポートを受け取るには以下をクリックしてください。' },
  confirmFree: { en: 'Get My Free Report', es: 'Obtener Reporte Gratuito', zh: '获取免费报告', de: 'Kostenlosen Bericht erhalten', fr: 'Obtenir mon rapport gratuit', hi: 'निःशुल्क रिपोर्ट प्राप्त करें', pt: 'Obter Relatório Gratuito', ja: '無料レポートを取得' },
  // Payment step
  securedByStripe: { en: 'Secured by Stripe', es: 'Pago seguro vía Stripe', zh: '由Stripe保护', de: 'Gesichert durch Stripe', fr: 'Sécurisé par Stripe', hi: 'Stripe द्वारा सुरक्षित', pt: 'Protegido pelo Stripe' },
  processing: { en: 'Processing…', es: 'Procesando…', zh: '处理中…', de: 'Wird verarbeitet…', fr: 'Traitement en cours…', hi: 'प्रसंस्करण…', pt: 'Processando…' },
  // Post-payment
  confirmed: { en: 'Report Confirmed!', es: '¡Reporte Confirmado!', zh: '报告已确认！', de: 'Bericht bestätigt!', fr: 'Rapport confirmé !', hi: 'रिपोर्ट की पुष्टि!', pt: 'Relatório Confirmado!' },
  sentTo: { en: 'Your full report has been sent to', es: 'Tu reporte completo fue enviado a', zh: '您的完整报告已发送至', de: 'Ihr vollständiger Bericht wurde gesendet an', fr: 'Votre rapport complet a été envoyé à', hi: 'आपकी पूर्ण रिपोर्ट भेजी गई', pt: 'Seu relatório completo foi enviado para' },
  downloadPdf: { en: 'Download PDF Report', es: 'Descargar Reporte PDF', zh: '下载PDF报告', de: 'PDF-Bericht herunterladen', fr: 'Télécharger le rapport PDF', hi: 'PDF रिपोर्ट डाउनलोड करें', pt: 'Baixar Relatório PDF' },
  generatingPdf: { en: 'Generating your PDF…', es: 'Generando tu PDF…', zh: '正在生成PDF…', de: 'PDF wird erstellt…', fr: 'Génération du PDF en cours…', hi: 'PDF तैयार हो रहा है…', pt: 'Gerando seu PDF…' },
  pdfDelayed: { en: 'Your report is taking longer than expected. It will be sent to your email shortly. If you do not receive it within 10 minutes, please contact support at contacto@mexicotrademarkscenter.com', es: 'Tu reporte está tardando más de lo esperado. Se enviará a tu correo en breve. Si no lo recibes en 10 minutos, escríbenos a contacto@mexicotrademarkscenter.com', zh: 'Your report is taking longer than expected. It will be sent to your email shortly. Contact support at contacto@mexicotrademarkscenter.com', de: 'Ihr Bericht benötigt mehr Zeit als erwartet. Er wird Ihnen per E-Mail zugesandt. Bei Fragen wenden Sie sich an contacto@mexicotrademarkscenter.com', fr: 'Votre rapport prend plus de temps que prévu. Il vous sera envoyé par e-mail sous peu. Contactez le support à contacto@mexicotrademarkscenter.com', hi: 'आपकी रिपोर्ट में अधिक समय लग रहा है। इसे जल्द ही आपके ईमेल पर भेजा जाएगा। संपर्क करें: contacto@mexicotrademarkscenter.com', pt: 'Seu relatório está demorando mais do que o esperado. Será enviado ao seu e-mail em breve. Contate o suporte em contacto@mexicotrademarkscenter.com' },
  fullReportBelow: { en: 'Full detailed analysis below', es: 'Análisis detallado completo a continuación', zh: '完整详细分析如下', de: 'Vollständige Detailanalyse unten', fr: 'Analyse détaillée complète ci-dessous', hi: 'पूर्ण विस्तृत विश्लेषण नीचे', pt: 'Análise detalhada completa abaixo' },
  // Alternative names
  seeAlternatives: { en: 'See fileable alternatives →', es: 'Ver alternativas registrables →', zh: '查看可注册替代名称 →', de: 'Registrierbare Alternativen anzeigen →', fr: 'Voir les alternatives déposables →', hi: 'पंजीकरण योग्य विकल्प देखें →', pt: 'Ver alternativas registráveis →', ja: '登録可能な代替案を見る →' },
  alternativeNamesTitle: { en: 'Fileable Alternatives', es: 'Alternativas Registrables', zh: '可注册替代名称', de: 'Registrierbare Alternativen', fr: 'Alternatives déposables', hi: 'पंजीकरण योग्य विकल्प', pt: 'Alternativas Registráveis', ja: '登録可能な代替案' },
  alternativeNamesSubtitle: { en: 'These coined marks avoid the conflicts found and are positioned for high registrability in Mexico.', es: 'Estas marcas de fantasía evitan los conflictos encontrados y tienen alta viabilidad de registro en México.', zh: '这些杜撰商标避免了发现的冲突，在墨西哥具有较高的注册可行性。', de: 'Diese Fantasiemarken vermeiden die gefundenen Konflikte und haben in Mexiko eine hohe Registrierbarkeit.', fr: 'Ces marques de fantaisie évitent les conflits trouvés et sont positionnées pour une haute enregistrabilité au Mexique.', hi: 'ये काल्पनिक मार्क मिले हुए विवादों से बचते हैं और मेक्सिको में उच्च पंजीकरण योग्यता के लिए स्थित हैं।', pt: 'Estas marcas de fantasia evitam os conflitos encontrados e estão posicionadas para alta registrabilidade no México.', ja: 'これらの造語商標は、発見された競合を回避し、メキシコでの高い登録可能性があります。' },
  fileThisMark: { en: 'File this mark — USD $299', es: 'Registrar esta marca — USD $299', zh: '申请此商标 — USD $299', de: 'Diese Marke anmelden — USD $299', fr: 'Déposer cette marque — USD $299', hi: 'यह मार्क दर्ज करें — USD $299', pt: 'Protocolar esta marca — USD $299', ja: 'この商標を出願 — USD $299' },
  registrabilityScore: { en: 'Registrability', es: 'Viabilidad', zh: '注册可能性', de: 'Registrierbarkeit', fr: 'Enregistrabilité', hi: 'पंजीकरण योग्यता', pt: 'Registrabilidade', ja: '登録可能性' },
  // Attorney review add-on
  attorneyReviewTitle: { en: 'Add Attorney Review', es: 'Agregar Revisión de Abogado', zh: '添加律师审核', de: 'Anwaltsüberprüfung hinzufügen', fr: 'Ajouter une révision juridique', hi: 'वकील समीक्षा जोड़ें', pt: 'Adicionar Revisão Jurídica', ja: '弁護士レビューを追加' },
  attorneyReviewDesc: { en: 'A licensed Mexican trademark attorney will personally review this report, validate the AI analysis, and provide a written legal opinion before filing.', es: 'Un abogado de marcas mexicano certificado revisará personalmente este reporte, validará el análisis de IA y emitirá una opinión legal escrita antes de presentar.', zh: '一位持牌墨西哥商标律师将亲自审核此报告，验证AI分析，并在申请前提供书面法律意见。', de: 'Ein zugelassener mexikanischer Markenanwalt überprüft diesen Bericht persönlich, validiert die KI-Analyse und gibt vor der Anmeldung eine schriftliche Rechtsberatung ab.', fr: 'Un avocat mexicain spécialisé en marques examinera ce rapport personnellement, validera l\'analyse IA et fournira une opinion juridique écrite avant le dépôt.', hi: 'एक लाइसेंस प्राप्त मैक्सिकन ट्रेडमार्क वकील इस रिपोर्ट की व्यक्तिगत रूप से समीक्षा करेंगे, AI विश्लेषण को मान्य करेंगे, और दाखिल करने से पहले एक लिखित कानूनी राय प्रदान करेंगे।', pt: 'Um advogado mexicano de marcas licenciado revisará pessoalmente este relatório, validará a análise de IA e fornecerá uma opinião jurídica escrita antes do protocolo.', ja: 'メキシコの商標弁護士がこのレポートを個人的にレビューし、AI分析を検証し、出願前に書面による法的意見を提供します。' },
  attorneyReviewCheckbox: { en: 'Add attorney review (+$9.99) — we\'ll confirm and bill this separately before filing.', es: 'Agregar revisión de abogado (+$9.99) — confirmamos y cobramos por separado antes de presentar.', zh: '添加律师审核（+$9.99）— 我们将在申请前单独确认并收费。', de: 'Anwaltsüberprüfung hinzufügen (+$9,99) — wir bestätigen und berechnen dies separat vor der Anmeldung.', fr: 'Ajouter une révision juridique (+9,99 $) — nous confirmerons et facturerons séparément avant le dépôt.', hi: 'वकील समीक्षा जोड़ें (+$9.99) — हम दाखिल करने से पहले अलग से पुष्टि और बिल करेंगे।', pt: 'Adicionar revisão jurídica (+$9,99) — confirmaremos e cobraremos separadamente antes do protocolo.', ja: '弁護士レビューを追加（+$9.99）— 出願前に個別に確認・請求します。' },
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
  // Risk acknowledgment
  riskAckTitle: {
    en: 'Proceed despite identified risks',
    es: 'Continuar a pesar de los riesgos identificados',
    zh: '尽管存在风险，仍继续申请',
    de: 'Trotz identifizierter Risiken fortfahren',
    fr: 'Continuer malgré les risques identifiés',
    hi: 'पहचाने गए जोखिमों के बावजूद आगे बढ़ें',
    pt: 'Prosseguir apesar dos riscos identificados',
    ja: '特定されたリスクにもかかわらず続行する',
  },
  riskAckCheckbox: {
    en: 'I understand the risks identified in this clearance report. I acknowledge that conflicts or registrability issues may affect my application and I choose to proceed with filing.',
    es: 'Entiendo los riesgos identificados en este informe de disponibilidad. Reconozco que los conflictos o problemas de registrabilidad pueden afectar mi solicitud y elijo continuar con la presentación.',
    zh: '我了解本检索报告中识别的风险。我确认冲突或可注册性问题可能影响我的申请，并选择继续提交申请。',
    de: 'Ich verstehe die in diesem Recherchebericht identifizierten Risiken. Ich bestätige, dass Konflikte oder Eintragungsprobleme meine Anmeldung beeinflussen können, und entscheide mich, mit der Einreichung fortzufahren.',
    fr: 'Je comprends les risques identifiés dans ce rapport de disponibilité. Je reconnais que des conflits ou des problèmes de registrabilité peuvent affecter ma demande et je choisis de procéder au dépôt.',
    hi: 'मैं इस क्लीयरेंस रिपोर्ट में पहचाने गए जोखिमों को समझता/समझती हूं। मैं स्वीकार करता/करती हूं कि विरोध या पंजीकरण योग्यता संबंधी समस्याएं मेरे आवेदन को प्रभावित कर सकती हैं और मैं दाखिल करना जारी रखने का चुनाव करता/करती हूं।',
    pt: 'Entendo os riscos identificados neste relatório de disponibilidade. Reconheço que conflitos ou problemas de registrabilidade podem afetar meu pedido e escolho prosseguir com o depósito.',
    ja: 'この調査報告書で特定されたリスクを理解しています。競合や登録可能性の問題が私の出願に影響する可能性があることを認識した上で、出願を続行することを選択します。',
  },
  riskAckWarning: {
    en: 'You must check this box to continue to the next step.',
    es: 'Debes marcar esta casilla para continuar al siguiente paso.',
    zh: '您必须勾选此框才能继续下一步。',
    de: 'Sie müssen dieses Kästchen ankreuzen, um mit dem nächsten Schritt fortzufahren.',
    fr: 'Vous devez cocher cette case pour passer à l\'étape suivante.',
    hi: 'अगले चरण पर जाने के लिए आपको यह बॉक्स चेक करना होगा।',
    pt: 'Você deve marcar esta caixa para continuar para a próxima etapa.',
    ja: '次のステップに進むには、このボックスにチェックを入れる必要があります。',
  },
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

function InlineCheckout({ lang, finalAmount, clientSecret: _clientSecret, paymentIntentId, reportOrderId, userId, onSuccess, onBack }: CheckoutProps) {
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
  const [elapsed, setElapsed] = useState(0);

  const durations = [1600, 1400, 1800, 1500, 1300, 1100, 1400, 999999];
  const totalEstimated = durations.slice(0, -1).reduce((a, b) => a + b, 0);

  useEffect(() => {
    let elapsedMs = 0;
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (let i = 0; i < steps.length - 1; i++) {
      elapsedMs += durations[i] ?? 1500;
      const idx = i;
      timers.push(setTimeout(() => {
        setCompletedCount(idx + 1);
        setActiveIndex(idx + 1);
      }, elapsedMs));
    }
    return () => timers.forEach(clearTimeout);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [steps.length]);

  useEffect(() => {
    const interval = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  // Circular progress gauge
  const progress = Math.min(1, completedCount / (steps.length - 1));
  const gaugeR = 28; const gaugeCx = 36; const gaugeCy = 36;
  const gaugeCirc = 2 * Math.PI * gaugeR;
  const gaugeDash = progress * gaugeCirc;
  const gaugeColor = progress >= 0.8 ? '#10b981' : progress >= 0.4 ? '#c9a84c' : '#1a2e1a';

  const elapsedLabel = elapsed < 60
    ? `${elapsed}s`
    : `${Math.floor(elapsed / 60)}m ${elapsed % 60}s`;

  return (
    <div className="mt-3 rounded-xl border border-gray-200 bg-white overflow-hidden">
      {/* Header with circular gauge */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3">
        {/* Circular progress */}
        <div className="relative flex-shrink-0">
          <svg width="72" height="72" viewBox="0 0 72 72" className="-rotate-90">
            <circle cx={gaugeCx} cy={gaugeCy} r={gaugeR} fill="none" stroke="#f0f0f0" strokeWidth={5} />
            <circle
              cx={gaugeCx} cy={gaugeCy} r={gaugeR} fill="none"
              stroke={gaugeColor} strokeWidth={5}
              strokeDasharray={`${gaugeDash} ${gaugeCirc}`}
              strokeLinecap="round"
              style={{ transition: 'stroke-dasharray 0.6s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ transform: 'none' }}>
            <span className="text-[11px] font-bold text-gray-800">{Math.round(progress * 100)}%</span>
            <span className="text-[9px] text-gray-400">{elapsedLabel}</span>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-gray-700">
            {lang === 'es' ? 'Análisis en curso…' : lang === 'zh' ? '分析进行中…' : lang === 'de' ? 'Analyse läuft…' : lang === 'fr' ? 'Analyse en cours…' : lang === 'hi' ? 'विश्लेषण जारी…' : lang === 'pt' ? 'Análise em andamento…' : lang === 'ja' ? '分析中…' : 'Running full clearance analysis…'}
          </p>
          <p className="text-[10px] text-gray-400 mt-0.5">
            {steps[activeIndex]?.label ?? ''}
          </p>
          {/* Linear progress bar */}
          <div className="mt-1.5 w-full h-1 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${progress * 100}%`, backgroundColor: gaugeColor }}
            />
          </div>
          <p className="text-[9px] text-gray-400 mt-0.5">
            {lang === 'es' ? `Est. ${Math.max(0, Math.round((totalEstimated / 1000) - elapsed))}s restantes` : `Est. ${Math.max(0, Math.round((totalEstimated / 1000) - elapsed))}s remaining`}
          </p>
        </div>
      </div>
      {/* Step list */}
      <div className="px-4 py-3 space-y-2">
        {steps.map((step, i) => {
          const done = i < completedCount;
          const active = i === activeIndex && !done;
          return (
            <div key={i} className={`flex items-start gap-2.5 transition-all duration-300 ${i > activeIndex ? 'opacity-25' : 'opacity-100'}`}>
              <div className="flex-shrink-0 mt-0.5">
                {done ? (
                  <div className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center">
                    <CheckCircle2 size={10} className="text-emerald-600" />
                  </div>
                ) : active ? (
                  <div className="w-4 h-4 rounded-full bg-[#c9a84c]/20 flex items-center justify-center">
                    <Loader2 size={9} className="text-[#c9a84c] animate-spin" />
                  </div>
                ) : (
                  <div className="w-4 h-4 rounded-full bg-gray-100 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-[11px] font-medium leading-tight ${done ? 'text-emerald-700' : active ? 'text-gray-800' : 'text-gray-400'}`}>
                  {step.label}
                </p>
                {active && (
                  <p className="text-[9px] text-gray-400 mt-0.5 leading-relaxed">{step.detail}</p>
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

function LockedRow({ lang: _lang }: { lang: Lang }) {
  return (
    <div className="flex items-center gap-2 py-1.5 px-2 rounded-lg bg-gray-50 border border-gray-100">
      <Lock size={10} className="text-gray-300 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="h-2 bg-gray-200 rounded-full w-3/4 blur-[2px]" />
      </div>
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

function FullReportNotice({ lang }: { lang: Lang }) {
  return (
    <p className="text-[9px] text-gray-500 mt-1 flex items-center gap-1">
      <span>{tr('fullReportNotice', lang)}</span>
      <InfoTooltip text={tr('fullReportTooltip', lang)} />
    </p>
  );
}

// ─── Similarity Gauge (SVG donut arc) ────────────────────────────────────────

function SimilarityGauge({ score, size = 48 }: { score: number; size?: number }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(1, Math.max(0, score / 100));
  const dash = pct * circ;
  const color = score >= 75 ? '#ef4444' : score >= 50 ? '#f59e0b' : '#10b981';
  const cx = size / 2;
  const cy = size / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="flex-shrink-0 -rotate-90">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f0f0f0" strokeWidth={5} />
      <circle
        cx={cx} cy={cy} r={r} fill="none"
        stroke={color} strokeWidth={5}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 0.5s ease' }}
      />
      <text
        x={cx} y={cy}
        textAnchor="middle" dominantBaseline="middle"
        fontSize={size < 44 ? 9 : 11} fontWeight="700"
        fill={color}
        style={{ transform: `rotate(90deg)`, transformOrigin: `${cx}px ${cy}px` }}
      >
        {score}%
      </text>
    </svg>
  );
}

// ─── Composite Registrability Score Gauge ────────────────────────────────────

function RegistrabilityGauge({ score }: { score: number }) {
  const color = score >= 70 ? '#10b981' : score >= 45 ? '#f59e0b' : '#ef4444';
  const label = score >= 70 ? 'Strong' : score >= 45 ? 'Moderate' : 'Weak';
  const r = 32;
  const cx = 40;
  const cy = 40;
  // Half-circle gauge: sweep from 180° to 360° (bottom left to bottom right via top)
  // We use a full circle arc trick: show 50% of circumference as track, fill proportionally
  const trackAngle = Math.PI; // 180 degrees
  const fillAngle = (score / 100) * Math.PI;
  const toCoord = (angle: number) => ({
    x: cx + r * Math.cos(Math.PI + angle),
    y: cy + r * Math.sin(Math.PI + angle),
  });
  const start = toCoord(0);
  const trackEnd = toCoord(trackAngle);
  const fillEnd = toCoord(fillAngle);
  const trackD = `M ${start.x} ${start.y} A ${r} ${r} 0 1 1 ${trackEnd.x} ${trackEnd.y}`;
  const fillD = fillAngle > 0
    ? `M ${start.x} ${start.y} A ${r} ${r} 0 ${fillAngle > Math.PI / 2 ? 1 : 0} 1 ${fillEnd.x} ${fillEnd.y}`
    : '';

  return (
    <div className="flex flex-col items-center">
      <svg width="80" height="48" viewBox="0 0 80 48">
        <path d={trackD} fill="none" stroke="#f0f0f0" strokeWidth={7} strokeLinecap="round" />
        {fillD && <path d={fillD} fill="none" stroke={color} strokeWidth={7} strokeLinecap="round" style={{ transition: 'all 0.6s ease' }} />}
        <text x={cx} y={cy + 4} textAnchor="middle" fontSize={13} fontWeight="800" fill={color}>{score}</text>
      </svg>
      <span className="text-[9px] font-semibold mt-0.5" style={{ color }}>{label}</span>
    </div>
  );
}

// ─── Pentagon Radar Chart (Feature 3) ────────────────────────────────────────

interface PentagonData { label: string; value: number; }

function PentagonChart({ data }: { data: PentagonData[] }) {
  const cx = 80; const cy = 80; const r = 60;
  const n = data.length;
  const angleOffset = -Math.PI / 2;
  const toPoint = (i: number, radius: number) => {
    const angle = angleOffset + (2 * Math.PI * i) / n;
    return { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) };
  };
  // Grid rings
  const rings = [0.25, 0.5, 0.75, 1.0];
  // Filled area points
  const filledPts = data.map((d, i) => toPoint(i, (d.value / 100) * r));
  const filledPath = filledPts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ') + ' Z';

  return (
    <svg width="160" height="160" viewBox="0 0 160 160" className="overflow-visible">
      {/* Grid rings */}
      {rings.map((ring, ri) => {
        const pts = data.map((_, i) => toPoint(i, ring * r));
        const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ') + ' Z';
        return <path key={ri} d={path} fill="none" stroke="#e5e7eb" strokeWidth={0.75} />;
      })}
      {/* Axis lines */}
      {data.map((_, i) => {
        const outer = toPoint(i, r);
        return <line key={i} x1={cx} y1={cy} x2={outer.x.toFixed(1)} y2={outer.y.toFixed(1)} stroke="#e5e7eb" strokeWidth={0.75} />;
      })}
      {/* Filled area */}
      <path d={filledPath} fill="rgba(26,46,26,0.15)" stroke="#1a2e1a" strokeWidth={1.5} strokeLinejoin="round" />
      {/* Data points */}
      {filledPts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={3} fill="#1a2e1a" />
      ))}
      {/* Labels */}
      {data.map((d, i) => {
        const labelPt = toPoint(i, r + 14);
        return (
          <text key={i} x={labelPt.x.toFixed(1)} y={labelPt.y.toFixed(1)}
            textAnchor="middle" dominantBaseline="middle"
            fontSize={8} fontWeight="600" fill="#374151">
            {d.label}
          </text>
        );
      })}
    </svg>
  );
}

const PENTAGON_LABELS: Record<string, { originality: string; distinctiveness: string; compliance: string; opposition: string; dilution: string }> = {
  en: { originality: 'Originality',        distinctiveness: 'Distinctiveness', compliance: 'Compliance',     opposition: 'Opposition',    dilution: 'Dilution'       },
  es: { originality: 'Originalidad',       distinctiveness: 'Distintividad',   compliance: 'Cumplimiento',   opposition: 'Oposición',     dilution: 'Dilución'       },
  zh: { originality: '独创性',              distinctiveness: '显著性',           compliance: '合规性',          opposition: '异议风险',       dilution: '淡化风险'        },
  de: { originality: 'Originalität',       distinctiveness: 'Unterscheidungsk.', compliance: 'Konformität',  opposition: 'Widerspruch',   dilution: 'Verwässerung'   },
  fr: { originality: 'Originalité',        distinctiveness: 'Distinctivité',   compliance: 'Conformité',     opposition: 'Opposition',    dilution: 'Dilution'       },
  hi: { originality: 'मौलिकता',            distinctiveness: 'विशिष्टता',        compliance: 'अनुपालन',        opposition: 'विरोध',          dilution: 'तनुकरण'         },
  pt: { originality: 'Originalidade',      distinctiveness: 'Distintividade',  compliance: 'Conformidade',   opposition: 'Oposição',      dilution: 'Diluição'       },
  ja: { originality: '独自性',              distinctiveness: '識別力',           compliance: 'コンプライアンス', opposition: '異議申立',       dilution: '希釈化'          },
};

function computePentagonScores(result: ClearanceResult, lang: string): PentagonData[] {
  const d = result.distinctiveness;
  const dupont = result.dupont ?? [];
  const flags = result.registrabilityFlags ?? [];
  const marcia = result.marciaFindings ?? [];
  const translations = result.translationAnalysis ?? [];
  const labels = PENTAGON_LABELS[lang] ?? PENTAGON_LABELS['en'];

  const tierScore = d?.score ?? 3;
  const originality = Math.round(((tierScore - 1) / 4) * 100);

  const total = result.marciaTotalCount ?? marcia.length;
  const dilution = Math.max(0, 100 - Math.min(100, total * 5));

  const conflictCount = marcia.filter(f => (f as MarciaFinding & { classOverlap?: string }).classOverlap === 'same' || (f as MarciaFinding & { classOverlap?: string }).classOverlap === 'related').length;
  const opposition = Math.max(0, 100 - Math.min(100, conflictCount * 20));

  const highFlags = flags.filter(f => f.severity === 'high').length;
  const medFlags = flags.filter(f => f.severity === 'medium').length;
  const transHigh = translations.filter(t => t.risk === 'high').length;
  const compliance = Math.max(0, 100 - highFlags * 25 - medFlags * 10 - transHigh * 10);

  const favor = dupont.filter(f => f.verdict === 'favors_registration').length;
  const against = dupont.filter(f => f.verdict === 'against_registration').length;
  const total13 = dupont.length || 13;
  const distinctiveness = Math.round(((favor - against + total13) / (2 * total13)) * 100);

  return [
    { label: labels.originality,      value: Math.max(0, Math.min(100, originality))    },
    { label: labels.distinctiveness,  value: Math.max(0, Math.min(100, distinctiveness)) },
    { label: labels.compliance,       value: Math.max(0, Math.min(100, compliance))      },
    { label: labels.opposition,       value: Math.max(0, Math.min(100, opposition))      },
    { label: labels.dilution,         value: Math.max(0, Math.min(100, dilution))        },
  ];
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function TrademarkClearancePanel({
  markName, goodsServices = '', classes, language, autoRun = true, showFilingCta = false, onStartFiling, onResult, onSelectDespiteRisk, onRiskAcknowledgedChange, imageBase64, imageMimeType,
}: Props) {
  const lang = (language in (UI.clearanceAnalysis)) ? language : 'en' as Lang;
  const { user } = useAuth();

  const [status, setStatus] = useState<'idle' | 'checking' | 'done' | 'error'>('idle');
  const [result, setResult] = useState<ClearanceResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [riskAcknowledged, setRiskAcknowledged] = useState(false);
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
  const [isFreeOrder, setIsFreeOrder] = useState(false);
  const [freeConfirming, setFreeConfirming] = useState(false);
  const [piLoading, setPiLoading] = useState(false);
  const [piError, setPiError] = useState('');
  const [pdfUrl, setPdfUrl] = useState('');
  const [pdfFailed, setPdfFailed] = useState(false);
  const [wantsAttorneyReview, setWantsAttorneyReview] = useState(false);

  // The full report is always free. `paid` kept as a compat flag but always true.
  // Gate legacy paid UI behind ENABLE_PAID_FULL_REPORT env flag (default off).
  const PAID_REPORT_ENABLED = import.meta.env.VITE_ENABLE_PAID_FULL_REPORT === 'true';
  const [paid, setPaid] = useState(!PAID_REPORT_ENABLED); // free by default
  // Optional email capture (non-blocking)
  const [captureEmail, setCaptureEmail] = useState('');
  const [captureSent, setCaptureSent] = useState(false);
  const [captureSending, setCaptureSending] = useState(false);

  // PDF report modal
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [pdfModalEmail, setPdfModalEmail] = useState('');
  const [pdfModalLoading, setPdfModalLoading] = useState(false);
  const [pdfModalDone, setPdfModalDone] = useState(false);
  const [pdfModalUrl, setPdfModalUrl] = useState('');
  // Tracks a committed delivery that continues even if the modal is closed
  const pendingDeliveryRef = useRef<{ email: string; orderId: string } | null>(null);

  // Background pre-generation: order + PDF kicked off as soon as result arrives
  const [bgOrderId, setBgOrderId] = useState('');
  const [bgPdfUrl, setBgPdfUrl] = useState('');
  const bgGeneratingRef = useRef(false);

  // Detail section toggles
  const [dupontExpanded, setDupontExpanded] = useState(false);
  const [lfppiExpanded, setLfppiExpanded] = useState(true);
  const [translationExpanded, setTranslationExpanded] = useState(true);
  const [marciaExpanded, setMarciaExpanded] = useState(false);
  const [webExpanded, setWebExpanded] = useState(false);
  const [domainExpanded, setDomainExpanded] = useState(false);
  const [lfppiDashExpanded, setLfppiDashExpanded] = useState(false);
  const [conflictTiersExpanded, setConflictTiersExpanded] = useState(true);
  const [stratExpanded, setStratExpanded] = useState(false);
  const [timelineExpanded, setTimelineExpanded] = useState(false);

  // Filter & tab state
  type StatusFilter = 'all' | 'active' | 'inactive' | 'registered' | 'pending';
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [classFilter, setClassFilter] = useState<number | null>(null);
  const [resultsTab, setResultsTab] = useState<'analysis' | 'raw'>('analysis');
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());
  const [showFilters, setShowFilters] = useState(false);

  // Per-mark lazy AI analysis cache: key = cardKey, value = { analysis, riskVerdict, loading }
  const [markAnalysisCache, setMarkAnalysisCache] = useState<Record<number, { analysis: string; riskVerdict: string; loading: boolean }>>({});

  const runCheck = async () => {
    if (runningRef.current || (!markName.trim() && !imageBase64)) return;
    runningRef.current = true;
    setStatus('checking');
    setResult(null);
    setBgOrderId('');
    setBgPdfUrl('');
    bgGeneratingRef.current = false;
    setErrorMsg('');
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/verify-trademark`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
        body: JSON.stringify({ markName: markName.trim(), goodsServices, classes, language: lang, ...(imageBase64 ? { imageBase64, imageMimeType } : {}) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Check failed');
      setResult(data as ClearanceResult);
      setStatus('done');
      onResult?.(data as ClearanceResult);
      trackEvent('report_viewed', { risk: (data as ClearanceResult).risk, riskColor: (data as ClearanceResult).riskColor }, lang);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Check failed');
      setStatus('error');
    } finally {
      runningRef.current = false;
    }
  };

  useEffect(() => {
    if (autoRun && (markName.trim() || imageBase64)) {
      const t = setTimeout(runCheck, 600);
      return () => clearTimeout(t);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markName, goodsServices, classes.join(','), imageBase64]);

  // Background PDF pre-generation: fires as soon as the clearance result is ready.
  // By the time the user opens the modal and types their email, the PDF is usually done.
  useEffect(() => {
    if (!result || bgGeneratingRef.current) return;
    bgGeneratingRef.current = true;
    setBgOrderId('');
    setBgPdfUrl('');

    (async () => {
      try {
        const piRes = await fetch(`${SUPABASE_URL}/functions/v1/create-report-payment-intent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
          body: JSON.stringify({
            markName: markName.trim(),
            goodsServices,
            language: lang,
            clearanceResult: result,
            email: 'prefetch@mexicotrademarkcenter.com',
            isFreeOverride: true,
            userId: user?.id ?? undefined,
          }),
        });
        if (!piRes.ok) return;
        const piData = await piRes.json();
        const orderId: string = piData.reportOrderId ?? '';
        if (!orderId) return;
        setBgOrderId(orderId);

        // Poll until PDF is ready (up to ~2 minutes)
        let attempts = 0;
        const pollUrl = async (): Promise<void> => {
          attempts++;
          try {
            const r = await fetch(`${SUPABASE_URL}/functions/v1/get-report-download-url`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
              body: JSON.stringify({ reportOrderId: orderId }),
            });
            if (r.ok) {
              const d = await r.json();
              if (d.url) { setBgPdfUrl(d.url); return; }
            }
          } catch {/* ignore */}
          if (attempts < 30) {
            await new Promise(res => setTimeout(res, 4000));
            await pollUrl();
          }
        };
        await pollUrl();
      } catch {/* silent — never block user */} finally {
        bgGeneratingRef.current = false;
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);

  // ── Fetch PDF URL after payment ───────────────────────────────────────────
  useEffect(() => {
    if (!paid || !reportOrderId || pdfUrl) return;
    let attempts = 0;
    const MAX_ATTEMPTS = 24; // 24 × 5s = 2 min
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
      if (attempts < MAX_ATTEMPTS) {
        setTimeout(poll, 5000);
      } else {
        setPdfFailed(true);
      }
    };
    setTimeout(poll, 4000);
  }, [paid, reportOrderId, pdfUrl]);

  // ── Idle / Checking / Error states ───────────────────────────────────────
  if (status === 'idle') {
    return (
      <div className="mt-3 rounded-xl border border-[#c9a84c]/30 bg-[#c9a84c]/5 px-4 py-3 flex items-start gap-3">
        <Shield size={15} className="text-[#c9a84c] flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-[#b8963e]">{tr('idleTitle', lang)}</p>
          <p className="text-xs text-[#c9a84c]/80 mt-0.5">{tr('idleDesc', lang)}</p>
        </div>
        <button type="button" onClick={runCheck}
          className="flex-shrink-0 text-xs font-semibold bg-[#c9a84c] hover:bg-[#b8963e] text-white px-3 py-1.5 rounded-lg transition-colors">
          {tr('checkBtn', lang)}
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

  // Filter helpers
  const matchesStatusFilter = (status: string) => {
    const s = status.toLowerCase();
    if (statusFilter === 'all') return true;
    if (statusFilter === 'active') return /registrada|vigente|registered|active/i.test(s);
    if (statusFilter === 'inactive') return /cancelada|expirada|abandoned|expired|cancelled/i.test(s);
    if (statusFilter === 'registered') return /registrada|vigente|registered/i.test(s) && !/tram|pend|proc/i.test(s);
    if (statusFilter === 'pending') return /tram|pend|proc|solicitud/i.test(s);
    return true;
  };
  const filteredFindings = result.marciaFindings.filter(f =>
    matchesStatusFilter(f.status) &&
    (classFilter === null || String(f.classNum) === String(classFilter))
  );

  // ── Composite Registrability Score ──────────────────────────────────────
  const computeRegistrabilityScore = (res: ClearanceResult): number => {
    let score = 100;
    const d = res.distinctiveness;
    if (d) {
      if (d.tier === 'generic') score -= 40;
      else if (d.tier === 'descriptive') score -= 25;
      else if (d.tier === 'suggestive') score -= 10;
    }
    const flags = res.registrabilityFlags ?? [];
    for (const f of flags) {
      if (f.severity === 'high') score -= 20;
      else if (f.severity === 'medium') score -= 10;
      else score -= 5;
    }
    const against = (res.dupont ?? []).filter(f => f.verdict === 'against_registration').length;
    score -= against * 4;
    const total = res.marciaTotalCount ?? res.marciaFindings.length;
    const exactSame = res.marciaFindings.some(f => f.name.toLowerCase().trim() === markName.toLowerCase().trim() && (f as MarciaFinding & { classOverlap?: string }).classOverlap === 'same');
    if (exactSame) score -= 30;
    else if (total >= 5) score -= 15;
    else if (total > 0) score -= 8;
    const transHigh = (res.translationAnalysis ?? []).some(t => t.risk === 'high');
    const transMed = (res.translationAnalysis ?? []).some(t => t.risk === 'medium');
    if (transHigh) score -= 10;
    else if (transMed) score -= 5;
    return Math.max(0, Math.min(100, Math.round(score)));
  };

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
  const regScore = computeRegistrabilityScore(result);
  const elementDecomp = result.elementDecomposition ?? [];
  const weakElements = elementDecomp.filter(e => e.role === 'descriptive_modifier' || e.distinctivenessTier === 'generic' || e.distinctivenessTier === 'descriptive');
  const distinctScore = result.distinctiveness?.score ?? 4;
  const showDontUseWarning = distinctScore <= 2 && weakElements.length > 0;

  // Derive similarity score heuristic (0-100) for a finding vs search mark
  const getSimilarityScore = (findingName: string): number => {
    if (!markName) return 0;
    const n = findingName.toLowerCase().trim();
    const m = markName.toLowerCase().trim();
    if (n === m) return 97;
    if (n.includes(m) || m.includes(n)) return 82;
    // Levenshtein-style quick heuristic
    const longer = n.length > m.length ? n : m;
    const shorter = n.length > m.length ? m : n;
    if (longer.length === 0) return 100;
    let matches = 0;
    for (let i = 0; i < shorter.length; i++) {
      if (longer.includes(shorter[i])) matches++;
    }
    return Math.round((matches / longer.length) * 75);
  };

  // Unique class numbers present in findings
  const presentClasses = Array.from(new Set(result.marciaFindings.map(f => f.classNum).filter(Boolean))).sort();

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
      const final = pct === 100 ? 0 : pct > 0 ? Math.max(0.50, 4.99 * (1 - pct / 100)) : 4.99;
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
          attorneyReviewRequested: wantsAttorneyReview,
        }),
      });
      const d = await res.json();
      if (!res.ok) { setPiError(d.message || 'Payment setup failed'); setPiLoading(false); return; }
      setPaymentIntentId(d.paymentIntentId);
      setReportOrderId(d.reportOrderId);
      setFinalAmount(d.finalAmountUsd);
      setDiscountPercent(d.discountPercent);
      if (d.isFree) {
        setIsFreeOrder(true);
        setPurchaseStep('payment');
      } else {
        setClientSecret(d.clientSecret);
        setPurchaseStep('payment');
      }
      trackEvent('payment_started', { markName: markName.trim() }, lang, d.reportOrderId?.slice(0, 8));
    } catch { setPiError('Payment setup failed. Please try again.'); }
    finally { setPiLoading(false); }
  };

  const handleConfirmFreeOrder = async () => {
    setFreeConfirming(true);
    try {
      await fetch(`${SUPABASE_URL}/functions/v1/confirm-report-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
        body: JSON.stringify({ paymentIntentId, reportOrderId, userId: user?.id }),
      });
      handlePaymentSuccess();
    } catch (e) {
      console.error('confirm-report-payment failed:', e);
      setFreeConfirming(false);
    }
  };

  const handlePaymentSuccess = () => {
    setPurchaseStep('done');
    setPaid(true);
    if (reportOrderId) {
      sessionStorage.setItem('tcpOrderId', reportOrderId);
    }
    trackEvent('payment_succeeded', { markName: markName.trim() }, lang, reportOrderId?.slice(0, 8));
  };

  const handleEmailCapture = async () => {
    if (!captureEmail.trim() || captureSent || captureSending) return;
    const emailVal = captureEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) return;
    setCaptureSending(true);
    try {
      await supabase.from('report_email_captures').insert({ email: emailVal, language: lang ?? null, order_ref: reportOrderId ? reportOrderId.slice(0, 8) : null });
      trackEvent('report_emailed', { email: emailVal }, lang, reportOrderId?.slice(0, 8));
      // TODO: call send-clearance-report-email edge function once report email delivery is wired
      setCaptureSent(true);
    } catch {/* never block UI */}
    finally { setCaptureSending(false); }
  };

  // ── PDF report generation via edge function ───────────────────────────────
  const handleRequestPdfReport = async () => {
    if (!pdfModalEmail.trim() || pdfModalLoading) return;
    const emailVal = pdfModalEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) return;
    setPdfModalLoading(true);

    // Mark this delivery as committed so work continues even if modal closes
    const capturedOrderId = bgOrderId;
    pendingDeliveryRef.current = { email: emailVal, orderId: capturedOrderId };

    // Transition to "done" state immediately so user sees confirmation and can close
    setPdfModalDone(true);
    setPdfModalLoading(false);

    // Continue all async work in the background — independent of modal visibility
    (async () => {
      try {
        let orderId = capturedOrderId;
        let url = bgPdfUrl;

        if (!orderId) {
          const piRes = await fetch(`${SUPABASE_URL}/functions/v1/create-report-payment-intent`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
            body: JSON.stringify({
              markName: markName.trim(),
              goodsServices,
              language: lang,
              clearanceResult: result,
              email: emailVal,
              isFreeOverride: true,
              userId: user?.id ?? undefined,
            }),
          });
          const piData = await piRes.json();
          orderId = piData.reportOrderId ?? '';
          pendingDeliveryRef.current = { email: emailVal, orderId };
        }

        // Update order to the user's real email
        if (orderId && emailVal !== 'prefetch@mexicotrademarkcenter.com') {
          supabase.from('clearance_report_orders').update({ email: emailVal }).eq('id', orderId).then(() => {});
        }

        if (!url && orderId) {
          let attempts = 0;
          const poll = async (): Promise<string | null> => {
            attempts++;
            try {
              const r = await fetch(`${SUPABASE_URL}/functions/v1/get-report-download-url`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
                body: JSON.stringify({ reportOrderId: orderId }),
              });
              if (r.ok) {
                const d = await r.json();
                if (d.url) return d.url;
              }
            } catch {/* ignore */}
            if (attempts < 30) {
              await new Promise(res => setTimeout(res, 3000));
              return poll();
            }
            return null;
          };
          url = (await poll()) ?? '';
        }

        if (url) {
          // Update PDF URL — visible both in modal (if still open) and in the CTA banner
          setPdfModalUrl(url);
          fetch(`${SUPABASE_URL}/functions/v1/send-clearance-report-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
            body: JSON.stringify({ reportOrderId: orderId, email: emailVal, pdfUrl: url }),
          }).catch(() => {});
        }
        trackEvent('report_emailed', { email: emailVal }, lang);
      } catch {/* never block UI */}
    })();
  };

  // ── Per-mark lazy AI analysis fetch (Improvement 1) ──────────────────────
  const fetchMarkAnalysis = async (cardKey: number, finding: MarciaFinding) => {
    if (markAnalysisCache[cardKey]) return;
    setMarkAnalysisCache(prev => ({ ...prev, [cardKey]: { analysis: '', riskVerdict: 'medium', loading: true } }));
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/analyze-mark-conflict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
        body: JSON.stringify({
          applicantMark: markName,
          conflictMark: finding.name,
          conflictHolder: finding.holder,
          conflictStatus: finding.status,
          conflictClass: finding.classNum,
          conflictGoodsServices: finding.goodsServices,
          applicantClasses: classes,
          applicantGoodsServices: goodsServices,
          language: lang,
          similarityScore: getSimilarityScore(finding.name),
        }),
      });
      const data = await res.json();
      setMarkAnalysisCache(prev => ({ ...prev, [cardKey]: { analysis: data.analysis ?? '', riskVerdict: data.riskVerdict ?? 'medium', loading: false } }));
    } catch {
      setMarkAnalysisCache(prev => ({ ...prev, [cardKey]: { analysis: lang === 'es' ? 'Error al cargar el análisis.' : 'Failed to load analysis.', riskVerdict: 'medium', loading: false } }));
    }
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
            {result.riskColor ? (
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                result.riskColor === 'VERDE'    ? 'bg-emerald-100 text-emerald-700 border-emerald-300' :
                result.riskColor === 'AMARILLO' ? 'bg-amber-100 text-amber-700 border-amber-300' :
                result.riskColor === 'NARANJA'  ? 'bg-orange-100 text-orange-700 border-orange-300' :
                                                  'bg-red-100 text-red-700 border-red-300'
              }`}>
                {result.riskColor === 'VERDE'    ? 'High Chances' :
                 result.riskColor === 'AMARILLO' ? 'Some obstacles found' :
                 result.riskColor === 'NARANJA'  ? 'Important obstacles found' :
                                                   'Extremely low chances'}
              </span>
            ) : (
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.badge}`}>{cfg.label[lang as keyof typeof cfg.label] ?? cfg.label['en']}</span>
            )}
            {(result.riskColor === 'NARANJA' || result.riskColor === 'ROJO') && (result.alternativeNames?.length ?? 0) > 0 && (
              <button
                type="button"
                onClick={() => {
                  trackEvent('report_cta_clicked', { source: 'cta_stronger_names', mark: markName }, lang);
                  setStratExpanded(true);
                  setTimeout(() => {
                    document.getElementById('first-alternative')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }, 80);
                }}
                className="text-[10px] font-semibold text-orange-600 hover:text-orange-800 underline underline-offset-2 transition-colors"
              >
                {tr('ctaStrongerNames', lang)}
              </button>
            )}
          </div>
        </div>
        {/* Part 6: Action buttons */}
        <div className="flex items-center gap-1.5 flex-shrink-0 print:hidden">
          <button
            type="button"
            onClick={() => window.print()}
            title={tr('printReport', lang)}
            className={`p-1.5 rounded-lg hover:bg-white/60 transition-colors ${cfg.text} opacity-60 hover:opacity-100`}
          >
            <Printer size={14} />
          </button>
          <button
            type="button"
            onClick={() => setShowPdfModal(true)}
            className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-lg border transition-colors border-[#1a2e1a] text-[#1a2e1a] hover:bg-[#1a2e1a]/10"
          >
            <Download size={11} />
            {tr('getPdfReport', lang)}
          </button>
        </div>
      </div>

      {/* ── Above-fold filing CTA (Change 1) — visible for ALL verdicts ─────── */}
      <div className="border-t border-gray-100 bg-white px-4 py-3 print:hidden">
        <a
          href={`/apply?mark=${encodeURIComponent(markName)}&fromClearance=1`}
          onClick={() => {
            if (result) {
              sessionStorage.setItem('clrMark', markName);
              sessionStorage.setItem('clrGoods', goodsServices ?? '');
              sessionStorage.setItem('clrResult', JSON.stringify(result));
            }
            trackEvent('report_cta_clicked', { source: 'above_fold', mark: markName }, lang);
          }}
          className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-bold px-5 py-3 rounded-xl transition-colors shadow-md text-sm"
        >
          <FileText size={14} />
          {tr('ctaFileThisName', lang)}
          <ArrowRight size={14} />
        </a>
      </div>

      {/* ── Part 7: Search summary panel ──────────────────────────────────── */}
      <div className="border-t border-gray-100 bg-white/70 px-4 py-2.5">
        <div className="flex items-start gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-wide flex-shrink-0">
              {lang === 'es' ? 'Denominación' : lang === 'zh' ? '商标名' : lang === 'de' ? 'Bezeichnung' : lang === 'fr' ? 'Dénomination' : lang === 'pt' ? 'Denominação' : 'Mark'}:
            </span>
            <span className="text-xs font-bold text-gray-800 truncate max-w-[120px]">
              {imageBase64 ? (lang === 'es' ? '[Marca Figurativa]' : '[Design Mark]') : markName}
            </span>
          </div>
          {classes.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-wide flex-shrink-0">
                {lang === 'es' ? 'Clase' : lang === 'zh' ? '类' : lang === 'de' ? 'Klasse' : lang === 'fr' ? 'Classe' : 'Class'}:
              </span>
              {classes.slice(0, 5).map(n => (
                <span key={n} className="text-[9px] font-bold bg-[#1a2e1a]/10 text-[#1a2e1a] px-1.5 py-0.5 rounded-full">
                  {lang === 'zh' ? `第${n}类` : `Cl. ${n}`}
                </span>
              ))}
              {classes.length > 5 && <span className="text-[9px] text-gray-400">+{classes.length - 5}</span>}
            </div>
          )}
          {goodsServices && (
            <div className="flex items-start gap-1.5 flex-1 min-w-0">
              <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-wide flex-shrink-0 mt-0.5">
                {lang === 'es' ? 'Desc.' : 'Desc.'}:
              </span>
              <span className="text-[9px] text-gray-500 line-clamp-1 min-w-0">{goodsServices}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Class scope banner ─────────────────────────────────────────────── */}
      {classes.length > 0 && (
        <div className="border-t border-gray-100 bg-white/40 px-4 py-2 flex items-center gap-2 flex-wrap">
          <Tag size={11} className="text-gray-400 flex-shrink-0" />
          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
            {lang === 'zh' ? '检索范围：' : lang === 'es' ? 'Alcance:' : lang === 'de' ? 'Umfang:' : lang === 'fr' ? 'Périmètre :' : lang === 'hi' ? 'दायरा:' : lang === 'pt' ? 'Escopo:' : 'Scope:'}
          </span>
          {classes.slice(0, 8).map(num => (
            <span key={num} className="inline-flex items-center text-[10px] font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
              {lang === 'zh' ? `第${num}类` : lang === 'ja' ? `第${num}類` : `Cl. ${num}`}
            </span>
          ))}
          {classes.length > 8 && (
            <span className="text-[10px] text-gray-400">+{classes.length - 8}</span>
          )}
        </div>
      )}

      {/* ── Part 1: Distinctiveness & Saturation Warning ─────────────────── */}
      {result.distinctiveness && (
        <div className="border-t border-gray-100 bg-white/50 px-4 py-3">
          <div className="flex items-start gap-3">
            {/* Left: tier bar & badge */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <TrendingUp size={12} className="text-[#1a2e1a] flex-shrink-0" />
                <span className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide">
                  {lang === 'es' ? 'Dilución y Distintividad' : lang === 'zh' ? '商标显著性' : lang === 'de' ? 'Unterscheidungskraft' : lang === 'fr' ? 'Distinctivité' : lang === 'pt' ? 'Distintividade' : 'Distinctiveness'}
                </span>
                <InfoTooltip text={tr('tooltipDistinctiveness', lang)} />
                {/* Marca fuerte / débil badge */}
                <span className={`ml-auto text-[9px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 flex-shrink-0 ${
                  result.distinctiveness.score >= 4
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    : result.distinctiveness.score >= 3
                    ? 'bg-amber-50 border-amber-200 text-amber-700'
                    : 'bg-red-50 border-red-200 text-red-700'
                }`}>
                  <Shield size={9} />
                  {result.distinctiveness.score >= 4
                    ? (lang === 'es' ? 'Marca fuerte' : 'Strong mark')
                    : result.distinctiveness.score >= 3
                    ? (lang === 'es' ? 'Marca media' : 'Medium mark')
                    : (lang === 'es' ? 'Marca débil' : 'Weak mark')}
                </span>
              </div>
              {/* Tier spectrum bar */}
              <div className="flex items-stretch gap-px rounded-md overflow-hidden h-5 mb-1.5">
                {TIER_ORDER.map(tier => {
                  const isActive = result.distinctiveness?.tier === tier;
                  return (
                    <div key={tier} title={tier.charAt(0).toUpperCase() + tier.slice(1)}
                      className={`flex-1 flex items-center justify-center text-[8px] font-semibold transition-all ${isActive ? TIER_COLORS[tier] + ' text-white' : TIER_INACTIVE[tier]}`}>
                      {isActive ? tier.slice(0, 4).toUpperCase() : ''}
                    </div>
                  );
                })}
              </div>
              {/* Saturation bar (Improvement 3: count + example chips) */}
              <div className="mb-1.5">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[9px] text-gray-400 flex-shrink-0">
                    {lang === 'es' ? 'Saturación de clase' : lang === 'zh' ? '类别饱和度' : 'Class saturation'}:
                  </span>
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${totalMarcia > 20 ? 'bg-red-400' : totalMarcia > 10 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                      style={{ width: `${Math.min(100, (totalMarcia / 30) * 100)}%` }}
                    />
                  </div>
                  <span className={`text-[9px] font-semibold flex-shrink-0 ${totalMarcia > 20 ? 'text-red-600' : totalMarcia > 10 ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {totalMarcia} {lang === 'es' ? 'marcas' : lang === 'zh' ? '个商标' : 'marks'}
                  </span>
                </div>
                {result.marciaFindings.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {result.marciaFindings.slice(0, 4).map((f, i) => (
                      <span key={i} className="text-[8px] font-medium bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full border border-gray-200 truncate max-w-[80px]" title={f.name}>
                        {f.name.length > 10 ? f.name.slice(0, 9) + '…' : f.name}
                      </span>
                    ))}
                    {totalMarcia > 4 && (
                      <span className="text-[8px] text-gray-400 px-1 py-0.5">+{totalMarcia - 4}</span>
                    )}
                  </div>
                )}
              </div>
              {/* Feature 2: Variants searched tag */}
              {(result.variantsSearched ?? []).length > 0 && (
                <div className="mb-1.5">
                  <details className="group">
                    <summary className="flex items-center gap-1 text-[9px] text-gray-400 hover:text-gray-600 cursor-pointer list-none select-none">
                      <span className="inline-flex items-center gap-1 bg-blue-50 border border-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full font-semibold">
                        <Sparkles size={8} />
                        {lang === 'es' ? `${(result.variantsSearched ?? []).length} variantes fonéticas buscadas` : lang === 'zh' ? `已搜索${(result.variantsSearched ?? []).length}个语音变体` : `${(result.variantsSearched ?? []).length} phonetic variants searched`}
                      </span>
                      <ChevronDown size={9} className="group-open:rotate-180 transition-transform" />
                    </summary>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(result.variantsSearched ?? []).map((v, i) => (
                        <span key={i} className="text-[8px] font-mono bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-100">{v}</span>
                      ))}
                    </div>
                  </details>
                </div>
              )}
              {/* AI narrative */}
              <p className="text-[10px] leading-relaxed text-gray-600">
                {result.distinctiveness.explanation_user ?? (lang === 'en' ? result.distinctiveness.explanation_en : result.distinctiveness.explanation) ?? result.distinctiveness.explanation}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Composite Registrability Score ─────────────────────────────────── */}
      <div className="border-t border-gray-100 bg-white/60 px-4 py-3">
        <div className="flex items-center gap-3">
          <RegistrabilityGauge score={regScore} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <Zap size={11} className="text-[#c9a84c] flex-shrink-0" />
              <span className="text-[10px] font-bold text-gray-700 uppercase tracking-wide">
                {lang === 'es' ? 'Puntuación de Registrabilidad' : lang === 'zh' ? '注册可能性评分' : lang === 'de' ? 'Registrierbarkeitsscore' : lang === 'fr' ? 'Score de registrabilité' : lang === 'pt' ? 'Pontuação de Registrabilidade' : 'Registrability Score'}
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2 mb-1 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${regScore}%`, backgroundColor: regScore >= 70 ? '#10b981' : regScore >= 45 ? '#f59e0b' : '#ef4444' }}
              />
            </div>
            <p className="text-[9px] text-gray-400 leading-snug">
              {lang === 'es'
                ? `Puntuación compuesta basada en distintividad, motivos LFPPI y conflictos MARCia.`
                : lang === 'zh' ? `基于显著性、LFPPI动因和MARCia冲突的综合评分。`
                : `Composite score based on distinctiveness, LFPPI grounds, and MARCia conflicts.`}
            </p>
          </div>
        </div>
      </div>

      {/* ── Risk Summary ───────────────────────────────────────────────────── */}
      {result.riskSummary && (
        <div className={`border-t border-gray-100 ${cfg.summaryBg} px-4 py-3 border-l-4 ${cfg.summaryBorder}`}>
          <div className="flex items-center gap-1.5 mb-1.5">
            <FileSearch size={12} className={cfg.text} />
            <span className={`text-xs font-semibold ${cfg.text}`}>{tr('riskSummaryTitle', lang)}</span>
          </div>
          <p className="text-xs text-gray-700 leading-relaxed">
            {lang === 'es'
              ? (result.riskSummary_user ?? result.riskSummary)
              : (result.riskSummary_user ?? result.riskSummary_en ?? result.riskSummary)}
          </p>
          <p className="text-[10px] text-gray-400 mt-1.5 flex items-center gap-1">
            <Info size={9} className="flex-shrink-0" />{tr('aiNote', lang)}
          </p>
        </div>
      )}

      {/* ── Element Decomposition Badges (Improvement 2) ───────────────────── */}
      {elementDecomp.length > 0 && (
        <div className="border-t border-gray-100 bg-white/50 px-4 py-2.5">
          <div className="flex items-center gap-1.5 mb-2">
            <Tag size={11} className="text-[#1a2e1a] flex-shrink-0" />
            <span className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide">
              {lang === 'es' ? 'Elementos de la Marca' : lang === 'zh' ? '商标元素分析' : lang === 'de' ? 'Markenelemente' : lang === 'fr' ? 'Éléments de la marque' : lang === 'pt' ? 'Elementos da Marca' : 'Mark Elements'}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {elementDecomp.map((el, i) => {
              const tierColor = el.distinctivenessTier === 'fanciful' ? 'bg-[#1a2e1a] text-white border-[#1a2e1a]'
                : el.distinctivenessTier === 'arbitrary' ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                : el.distinctivenessTier === 'suggestive' ? 'bg-amber-100 text-amber-800 border-amber-300'
                : el.distinctivenessTier === 'descriptive' ? 'bg-orange-100 text-orange-800 border-orange-300'
                : 'bg-red-100 text-red-800 border-red-300';
              const roleDot = el.role === 'dominant' ? 'bg-[#c9a84c]'
                : el.role === 'secondary' ? 'bg-blue-400'
                : el.role === 'descriptive_modifier' ? 'bg-orange-400'
                : 'bg-gray-300';
              return (
                <div key={i} title={el.note ?? el.role}
                  className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full border ${tierColor}`}>
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${roleDot}`} />
                  {el.element}
                  <span className="font-normal opacity-70 ml-0.5 text-[8px] uppercase tracking-wide">{el.distinctivenessTier.slice(0, 4)}</span>
                </div>
              );
            })}
          </div>
          <p className="text-[9px] text-gray-400 mt-1.5 flex items-center gap-1">
            <span className="inline-flex items-center gap-0.5"><span className="w-1.5 h-1.5 rounded-full bg-[#c9a84c] inline-block" /> {lang === 'es' ? 'dominante' : 'dominant'}</span>
            <span className="mx-1 text-gray-300">·</span>
            <span className="inline-flex items-center gap-0.5"><span className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block" /> {lang === 'es' ? 'secundario' : 'secondary'}</span>
            <span className="mx-1 text-gray-300">·</span>
            <span className="inline-flex items-center gap-0.5"><span className="w-1.5 h-1.5 rounded-full bg-orange-400 inline-block" /> {lang === 'es' ? 'descriptivo' : 'descriptive'}</span>
          </p>
        </div>
      )}

      {/* ── "Don't Use These Words" warning (Improvement 5) ────────────────── */}
      {showDontUseWarning && (
        <div className="border-t border-orange-100 bg-orange-50 px-4 py-2.5">
          <div className="flex items-start gap-2">
            <AlertOctagon size={13} className="text-orange-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-orange-800 mb-1">
                {lang === 'es' ? 'Advertencia: Palabras de Baja Distintividad' : lang === 'zh' ? '警告：低显著性词汇' : lang === 'de' ? 'Warnung: Schwach unterscheidungskräftige Wörter' : lang === 'fr' ? 'Avertissement : mots peu distinctifs' : lang === 'pt' ? 'Aviso: Palavras de Baixa Distintividade' : 'Warning: Low-Distinctiveness Words'}
              </p>
              <p className="text-[9px] text-orange-700 leading-relaxed mb-1.5">
                {lang === 'es'
                  ? 'Los siguientes elementos de tu marca tienen baja distintividad. Evita usarlos como elementos principales en futuras marcas ya que dificultan el registro:'
                  : lang === 'zh' ? '以下商标元素显著性较低。避免将其作为未来商标的主要元素，因为这会增加注册难度：'
                  : 'The following elements of your mark have low distinctiveness. Avoid relying on them as primary elements in future marks as they hinder registration:'}
              </p>
              <div className="flex flex-wrap gap-1">
                {weakElements.map((el, i) => (
                  <span key={i} className="text-[9px] font-bold bg-orange-200 text-orange-900 px-2 py-0.5 rounded-full border border-orange-300 line-through decoration-orange-500">
                    {el.element}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Feature 3: Pentagon Risk Profile Chart ─────────────────────────── */}
      {(() => {
        const pentagonData = computePentagonScores(result, lang);
        return (
          <div className="border-t border-gray-100 bg-white/50 px-4 py-3">
            <div className="flex items-center gap-1.5 mb-2">
              <TrendingUp size={11} className="text-[#1a2e1a]" />
              <span className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide">
                {lang === 'es' ? 'Perfil de Riesgo (5 Ejes)' : lang === 'zh' ? '风险雷达图（5轴）' : lang === 'de' ? 'Risikoprofil (5 Achsen)' : lang === 'fr' ? 'Profil de risque (5 axes)' : 'Risk Profile (5 Axes)'}
              </span>
            </div>
            <div className="flex items-start gap-4 flex-wrap">
              <div className="flex-shrink-0">
                <PentagonChart data={pentagonData} />
              </div>
              <div className="flex-1 min-w-[140px] space-y-1.5 pt-2">
                {pentagonData.map((d, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-[9px] font-semibold text-gray-500 w-20 flex-shrink-0">{d.label}</span>
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${d.value}%`, backgroundColor: d.value >= 70 ? '#10b981' : d.value >= 40 ? '#f59e0b' : '#ef4444' }}
                      />
                    </div>
                    <span className="text-[9px] font-bold w-6 text-right flex-shrink-0" style={{ color: d.value >= 70 ? '#10b981' : d.value >= 40 ? '#f59e0b' : '#ef4444' }}>{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Famous & Notorious Marks Check (Art. 173 Fr. XV LFPPI) ─────────── */}
      {(() => {
        const famousConflicts = result.famousMarkConflicts ?? [];
        if (famousConflicts.length === 0) return null;
        const topConflict = famousConflicts[0];
        return (
          <div className="border-t border-red-100 bg-red-50/60 px-4 py-3">
            <div className="flex items-start gap-2 mb-2">
              <AlertOctagon size={13} className="text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-bold text-red-800 uppercase tracking-wide">
                    {lang === 'es' ? 'Marcas Famosas y Notorias Detectadas' : lang === 'zh' ? '检测到知名商标冲突' : lang === 'de' ? 'Bekannte & berühmte Marken gefunden' : lang === 'fr' ? 'Marques notoires détectées' : lang === 'pt' ? 'Marcas Famosas Detectadas' : 'Famous & Notorious Marks Detected'}
                  </span>
                  <span className="text-[9px] font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full border border-red-200">
                    {topConflict.lfppiArticle}
                  </span>
                </div>
                <p className="text-[9px] text-red-700 mt-0.5 leading-snug">
                  {lang === 'es'
                    ? `Tu marca presenta similitud con ${famousConflicts.length} marca(s) famosa(s) o notoria(s). Las marcas famosas tienen protección transclase bajo la LFPPI.`
                    : lang === 'zh' ? `您的商标与${famousConflicts.length}个知名商标存在相似性。知名商标在LFPPI下享有跨类保护。`
                    : `Your mark shows similarity to ${famousConflicts.length} famous/notorious mark(s). Famous marks have cross-class protection under LFPPI.`}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-1.5">
              {famousConflicts.map((c, i) => (
                <div key={i} className={`flex items-center gap-1 text-[9px] font-semibold px-2 py-1 rounded-lg border ${c.similarity >= 90 ? 'bg-red-100 text-red-800 border-red-200' : c.similarity >= 70 ? 'bg-orange-100 text-orange-800 border-orange-200' : 'bg-amber-100 text-amber-800 border-amber-200'}`}>
                  <span>{c.famousMark}</span>
                  <span className="opacity-60 text-[8px]">{c.similarity}%</span>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

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
            </div>
          )}
          {/* LFPPI */}
          <div className="rounded-lg border border-gray-100 bg-white px-3 py-2">
            <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wide mb-1">{tr('lfppiStatus', lang)}</p>
            {regFlags.length === 0
              ? <span className="text-[10px] font-bold text-emerald-600">{tr('noIssues', lang)}</span>
              : <span className="text-[10px] font-bold text-red-600">{regFlags.length} {regFlags.length === 1 ? tr('issueDetected', lang) : tr('issuesDetected', lang)}</span>
            }
          </div>
          {/* MARCia */}
          <div className="rounded-lg border border-gray-100 bg-white px-3 py-2">
            <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wide mb-1">{tr('marciaHits', lang)}</p>
            <span className={`text-[10px] font-bold ${totalMarcia > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>{totalMarcia} {tr('matches', lang)}</span>
          </div>
        </div>
      </div>

      {/* ── MARCia quick results (always visible) ──────────────────────────── */}
      <div className="border-t border-gray-100 bg-white/40 px-4 py-3 space-y-3">

          {/* Part 5: Results tabs + counter + filters toggle */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-0.5 bg-gray-100 rounded-lg p-0.5">
              <button
                type="button"
                onClick={() => setResultsTab('analysis')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-semibold transition-all ${resultsTab === 'analysis' ? 'bg-white text-[#1a2e1a] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <BarChart2 size={10} />
                {lang === 'es' ? 'Análisis' : lang === 'zh' ? '分析' : lang === 'de' ? 'Analyse' : lang === 'fr' ? 'Analyse' : 'Analysis'}
              </button>
              <button
                type="button"
                onClick={() => setResultsTab('raw')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-semibold transition-all ${resultsTab === 'raw' ? 'bg-white text-[#1a2e1a] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <List size={10} />
                {lang === 'es' ? 'Resultados MARCia' : lang === 'zh' ? 'MARCia结果' : 'MARCia Results'}
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${totalMarcia > 0 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                {totalMarcia} {tr('matches', lang)}
              </span>
              {result.marciaFindings.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowFilters(v => !v)}
                  className={`flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-lg border transition-all ${showFilters ? 'bg-[#1a2e1a] text-white border-[#1a2e1a]' : 'text-gray-500 border-gray-200 hover:border-gray-300'}`}
                >
                  <Filter size={10} />
                  {lang === 'es' ? 'Filtros' : lang === 'zh' ? '筛选' : 'Filters'}
                  {(statusFilter !== 'all' || classFilter !== null) && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#c9a84c] flex-shrink-0" />
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Part 3: Filter panel */}
          {showFilters && (
            <div className="bg-white border border-gray-200 rounded-xl p-3 space-y-3">
              {/* Status filter */}
              <div>
                <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
                  {lang === 'es' ? 'Estado' : 'Status'}
                </p>
                <div className="flex flex-wrap gap-1">
                  {(['all', 'active', 'inactive', 'registered', 'pending'] as const).map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setStatusFilter(s)}
                      className={`text-[9px] font-semibold px-2 py-1 rounded-full border transition-all ${
                        statusFilter === s
                          ? 'bg-[#1a2e1a] text-white border-[#1a2e1a]'
                          : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {s === 'all' ? (lang === 'es' ? 'Todas' : 'All')
                       : s === 'active' ? (lang === 'es' ? 'Activas' : 'Active')
                       : s === 'inactive' ? (lang === 'es' ? 'Inactivas' : 'Inactive')
                       : s === 'registered' ? (lang === 'es' ? 'Registradas' : 'Registered')
                       : (lang === 'es' ? 'En trámite' : 'Pending')}
                    </button>
                  ))}
                </div>
              </div>
              {/* Class filter */}
              {presentClasses.length > 0 && (
                <div>
                  <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
                    {lang === 'es' ? 'Clase Nice' : lang === 'zh' ? '尼斯类' : 'Nice Class'}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    <button
                      type="button"
                      onClick={() => setClassFilter(null)}
                      className={`text-[9px] font-semibold px-2 py-1 rounded-full border transition-all ${classFilter === null ? 'bg-[#1a2e1a] text-white border-[#1a2e1a]' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}
                    >
                      {lang === 'es' ? 'Todas' : 'All'}
                    </button>
                    {presentClasses.slice(0, 15).map(cls => (
                      <button
                        key={cls}
                        type="button"
                        onClick={() => setClassFilter(classFilter === Number(cls) ? null : Number(cls))}
                        className={`text-[9px] font-semibold px-2 py-1 rounded-full border transition-all ${classFilter === Number(cls) ? 'bg-[#1a2e1a] text-white border-[#1a2e1a]' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}
                      >
                        {lang === 'zh' ? `第${cls}类` : `Cl. ${cls}`}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {(statusFilter !== 'all' || classFilter !== null) && (
                <button
                  type="button"
                  onClick={() => { setStatusFilter('all'); setClassFilter(null); }}
                  className="text-[9px] text-gray-400 hover:text-gray-600 underline"
                >
                  {lang === 'es' ? 'Limpiar filtros' : 'Clear filters'}
                </button>
              )}
            </div>
          )}

          {/* Feature 5: Similarity Distribution Bar Chart */}
          {result.marciaFindings.length > 0 && (() => {
            const identical = result.marciaFindings.filter(f => getSimilarityScore(f.name) >= 90).length;
            const verySimilar = result.marciaFindings.filter(f => { const s = getSimilarityScore(f.name); return s >= 70 && s < 90; }).length;
            const similar = result.marciaFindings.filter(f => { const s = getSimilarityScore(f.name); return s >= 60 && s < 70; }).length;
            const total = result.marciaFindings.length;
            if (total === 0) return null;
            const bars = [
              { label: lang === 'es' ? 'Idénticas' : 'Identical', labelSub: '≥90%', count: identical, color: 'bg-red-500' },
              { label: lang === 'es' ? 'Muy similares' : 'Very similar', labelSub: '70–89%', count: verySimilar, color: 'bg-orange-400' },
              { label: lang === 'es' ? 'Similares' : 'Similar', labelSub: '60–69%', count: similar, color: 'bg-amber-400' },
            ];
            return (
              <div className="bg-white border border-gray-100 rounded-xl px-3 py-2.5">
                <div className="flex items-center gap-1.5 mb-2">
                  <BarChart2 size={11} className="text-[#1a2e1a]" />
                  <span className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide">
                    {lang === 'es' ? 'Distribución de Similitud' : lang === 'zh' ? '相似度分布' : 'Similarity Distribution'}
                  </span>
                </div>
                <div className="space-y-1.5">
                  {bars.map((b, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-20 flex-shrink-0">
                        <p className="text-[9px] font-semibold text-gray-600 leading-tight">{b.label}</p>
                        <p className="text-[8px] text-gray-400">{b.labelSub}</p>
                      </div>
                      <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${b.color}`}
                          style={{ width: total > 0 ? `${Math.max(b.count > 0 ? 8 : 0, (b.count / total) * 100)}%` : '0%' }}
                        />
                      </div>
                      <span className={`text-[10px] font-bold w-4 text-right flex-shrink-0 ${b.count > 0 ? 'text-gray-700' : 'text-gray-300'}`}>{b.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* 1 — MARCia teaser (Part 2: enhanced cards) */}
          <div>
            {filteredFindings.length === 0 && result.marciaFindings.length > 0 ? (
              <p className="text-[10px] text-gray-400 italic py-2 text-center">
                {lang === 'es' ? 'No hay resultados para los filtros seleccionados.' : 'No results match the selected filters.'}
              </p>
            ) : topConflicts.length === 0 ? (
              <p className="text-[10px] text-gray-400 italic">{tr('noMarciaFindings', lang)}</p>
            ) : (
              <>
                {(resultsTab === 'analysis' ? topConflicts.slice(0, 3) : filteredFindings.slice(0, 3)).map((f, i) => {
                  const isExact = f.name.toLowerCase().trim() === markName.toLowerCase().trim();
                  const isDesignResult = !!imageBase64;
                  const simScore = getSimilarityScore(f.name);
                  const statusLower = f.status.toLowerCase();
                  const isRegistered = /registrada|vigente|registered|active/i.test(statusLower) && !/tram|pend|proc/i.test(statusLower);
                  const isPending = /tram|pend|proc|solicitud/i.test(statusLower);
                  const isExpanded = expandedCards.has(i);
                  const aiData = markAnalysisCache[i];

                  const statusBadge = isRegistered
                    ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                    : isPending
                    ? 'bg-amber-100 text-amber-700 border-amber-200'
                    : 'bg-gray-100 text-gray-600 border-gray-200';
                  const statusLabel = isRegistered
                    ? (lang === 'es' ? 'Registrada' : 'Registered')
                    : isPending
                    ? (lang === 'es' ? 'En Trámite' : 'Pending')
                    : f.status;

                  return (
                    <div key={i} className={`rounded-xl border mb-2 overflow-hidden transition-all ${isExact ? 'border-red-200' : 'border-gray-200'} bg-white shadow-sm`}>
                      <div className="flex items-start gap-3 px-3 py-2.5">
                        {/* Similarity gauge */}
                        <div className="flex-shrink-0 flex flex-col items-center gap-0.5">
                          <SimilarityGauge score={isExact ? 97 : simScore} size={44} />
                          <span className="text-[8px] text-gray-400 text-center leading-tight">
                            {lang === 'es' ? 'Similitud' : lang === 'zh' ? '相似度' : 'Similarity'}
                          </span>
                        </div>
                        {/* Logo thumbnail */}
                        <div className="flex-shrink-0 w-10 h-10 rounded-lg border border-gray-100 bg-gray-50 overflow-hidden flex items-center justify-center self-center">
                          {isDesignResult && f.imageUrl
                            ? <img src={f.imageUrl} alt={f.name} className="w-full h-full object-contain" />
                            : isDesignResult
                            ? <Shield size={12} className="text-gray-300" />
                            : <span className="text-[8px] font-bold text-gray-400 text-center leading-tight px-0.5">{f.name.slice(0, 3).toUpperCase()}</span>
                          }
                        </div>
                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <span className="text-xs font-bold text-gray-800 leading-tight">{f.name || '—'}</span>
                            <div className="flex flex-col items-end gap-1 flex-shrink-0">
                              <span className={`text-[9px] font-bold border rounded-full px-1.5 py-0.5 ${statusBadge}`}>{statusLabel}</span>
                              {isExact && <span className="text-[8px] font-bold bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full uppercase">{tr('exactMatch', lang)}</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {f.classNum && (
                              <span className="text-[9px] font-semibold bg-[#1a2e1a]/10 text-[#1a2e1a] px-1.5 py-0.5 rounded-full">
                                {lang === 'zh' ? `第${f.classNum}类` : `Cl. ${f.classNum}`}
                              </span>
                            )}
                            {f.holder && (
                              <span className="text-[9px] text-gray-500 truncate max-w-[140px]">{f.holder}</span>
                            )}
                          </div>
                          {f.goodsServices && (
                            <p className="text-[9px] text-gray-400 mt-0.5 line-clamp-1 leading-snug">{f.goodsServices}</p>
                          )}
                          {/* Improvement 4: Expediente / Reg # / dates */}
                          {(f.expediente || f.registrationNumber || f.filingDate) && (
                            <div className="flex flex-wrap gap-x-2 gap-y-0.5 mt-1">
                              {f.expediente && (
                                <span className="text-[8px] text-gray-400 font-mono">
                                  {lang === 'es' ? 'Exp.' : 'Exp.'} {f.expediente}
                                </span>
                              )}
                              {f.registrationNumber && (
                                <span className="text-[8px] text-gray-400 font-mono">
                                  {lang === 'es' ? 'Reg.' : 'Reg.'} {f.registrationNumber}
                                </span>
                              )}
                              {f.filingDate && (
                                <span className="text-[8px] text-gray-400">
                                  {lang === 'es' ? 'Solicitud:' : 'Filed:'} {f.filingDate}
                                </span>
                              )}
                              {f.expiryDate && (
                                <span className="text-[8px] text-gray-400">
                                  {lang === 'es' ? 'Vence:' : 'Exp:'} {f.expiryDate}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      {/* Expandable AI analysis row (Improvement 1: lazy load) */}
                      <div className="border-t border-gray-50">
                        <button
                          type="button"
                          onClick={() => {
                            setExpandedCards(prev => {
                              const next = new Set(prev);
                              if (next.has(i)) next.delete(i); else next.add(i);
                              return next;
                            });
                            if (!markAnalysisCache[i]) fetchMarkAnalysis(i, f);
                          }}
                          className="w-full flex items-center justify-between px-3 py-1.5 text-[9px] font-medium text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                          <span className="flex items-center gap-1">
                            <Sparkles size={9} className="text-[#c9a84c]" />
                            {lang === 'es' ? 'Ver análisis IA' : lang === 'zh' ? '查看AI分析' : 'View AI analysis'}
                          </span>
                          {isExpanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                        </button>
                        {isExpanded && (
                          <div className="px-3 pb-2.5 pt-1 bg-gray-50/50">
                            {aiData?.loading ? (
                              <div className="flex items-center gap-1.5 text-[9px] text-gray-400">
                                <Loader2 size={9} className="animate-spin flex-shrink-0" />
                                <span>{lang === 'es' ? 'Analizando…' : 'Analyzing…'}</span>
                              </div>
                            ) : aiData?.analysis ? (
                              <p className="text-[10px] text-gray-600 leading-relaxed">{aiData.analysis}</p>
                            ) : (
                              <p className="text-[10px] text-gray-600 leading-relaxed">
                                {lang === 'es'
                                  ? `La marca "${f.name}" presenta ${isExact ? 'coincidencia exacta' : 'similitud'} con tu solicitud. Estado: ${f.status}.${f.classNum ? ` Clase ${f.classNum}.` : ''}`
                                  : `"${f.name}" shows ${isExact ? 'exact' : 'notable'} similarity. Status: ${f.status}.${f.classNum ? ` Class ${f.classNum}.` : ''}`}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>

          {/* 2 — LFPPI flags (full, unblurred) */}
          {regFlags.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Scale size={11} className="text-[#1a2e1a]" />
                <span className="text-[10px] font-semibold text-gray-600">{tr('lfppiTitle', lang)}</span>
                <InfoTooltip text={tr('tooltipLfppi', lang)} className="ml-0.5" />
              </div>
              {regFlags.map((f, i) => (
                <div key={i} className={`rounded-lg border px-2.5 py-1.5 mb-1 ${f.severity === 'high' ? 'border-red-100 bg-red-50/50' : f.severity === 'medium' ? 'border-amber-100 bg-amber-50/50' : 'border-blue-100 bg-blue-50/50'}`}>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className={`text-[9px] font-bold px-1 py-0.5 rounded ${f.severity === 'high' ? 'bg-red-100 text-red-700' : f.severity === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>{f.severity.toUpperCase()}</span>
                    <span className="text-[10px] font-semibold text-gray-700">{CATEGORY_LABELS[f.category] ?? f.category}</span>
                  </div>
                  <p className="text-[10px] text-gray-600 leading-relaxed">
                    {f.explanation_user ?? (lang === 'en' ? f.explanation_en : f.explanation) ?? f.explanation}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* 3 — DuPont summary (full, unblurred) */}
          {dupont.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Scale size={11} className="text-[#1a2e1a]" />
                <span className="text-[10px] font-semibold text-gray-600">{tr('dupontTitle', lang)}</span>
                <InfoTooltip text={tr('tooltipDupont', lang)} className="ml-0.5" />
              </div>
              {dupont.slice(0, 5).map((f, i) => (
                <div key={i} className="rounded-lg border border-gray-100 bg-white px-2.5 py-1.5 mb-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${f.verdict === 'favors_registration' ? 'bg-emerald-400' : f.verdict === 'against_registration' ? 'bg-red-400' : 'bg-gray-300'}`} />
                    <span className="text-[10px] font-semibold text-gray-600">{DUPONT_LABELS[f.factor] ?? f.factor}</span>
                  </div>
                  <p className="text-[10px] text-gray-500 leading-relaxed pl-3">
                    {f.reasoning_user ?? (lang === 'en' ? f.reasoning_en : f.reasoning) ?? f.reasoning}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* 4 — Distinctiveness (full, unblurred) */}
          {result.distinctiveness && (
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <TrendingUp size={11} className="text-[#1a2e1a]" />
                <span className="text-[10px] font-semibold text-gray-600">{tr('distinctivenessTitle', lang)}</span>
                <InfoTooltip text={tr('tooltipDistinctiveness', lang)} className="ml-0.5" />
              </div>
              <div className="flex items-stretch gap-0 rounded-lg overflow-hidden border border-gray-100 mb-1.5">
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
              <p className="text-[10px] text-gray-600 leading-relaxed">
                {result.distinctiveness.explanation_user ?? (lang === 'en' ? result.distinctiveness.explanation_en : result.distinctiveness.explanation) ?? result.distinctiveness.explanation}
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
            </div>
          </div>
        </div>

      {/* ── Full detail sections (always visible — report is free) ──────────── */}
      <div className="border-t border-gray-100 bg-white/50">

          {/* 1 — MARCia full (enhanced cards with similarity gauge) */}
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
              <div className="px-4 pb-4">
                {/* Filters for paid view */}
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  {(['all', 'registered', 'pending', 'inactive'] as const).map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setStatusFilter(s)}
                      className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border transition-all ${statusFilter === s ? 'bg-[#1a2e1a] text-white border-[#1a2e1a]' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}
                    >
                      {s === 'all' ? (lang === 'es' ? 'Todas' : 'All')
                       : s === 'registered' ? (lang === 'es' ? 'Registradas' : 'Registered')
                       : s === 'pending' ? (lang === 'es' ? 'En trámite' : 'Pending')
                       : (lang === 'es' ? 'Inactivas' : 'Inactive')}
                    </button>
                  ))}
                  {presentClasses.length > 0 && presentClasses.slice(0, 8).map(cls => (
                    <button
                      key={cls}
                      type="button"
                      onClick={() => setClassFilter(classFilter === Number(cls) ? null : Number(cls))}
                      className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border transition-all ${classFilter === Number(cls) ? 'bg-[#1a2e1a] text-white border-[#1a2e1a]' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}
                    >
                      {lang === 'zh' ? `第${cls}类` : `Cl. ${cls}`}
                    </button>
                  ))}
                </div>
                {filteredFindings.length === 0 ? (
                  <p className="text-xs text-gray-500 italic">{result.marciaFindings.length === 0 ? tr('noMarciaFindings', lang) : (lang === 'es' ? 'Sin resultados para los filtros seleccionados.' : 'No results match the selected filters.')}</p>
                ) : (
                  <div className="space-y-2 mt-1">
                    {filteredFindings.map((f, i) => {
                      const isDesignResult = !!imageBase64;
                      const statusLower = f.status.toLowerCase();
                      const isRegistered = /registrada|vigente|registered|active/i.test(statusLower) && !/tram|pend|proc/i.test(statusLower);
                      const isPending = /tram|pend|proc|solicitud/i.test(statusLower);
                      const isExact = f.name.toLowerCase().trim() === markName.toLowerCase().trim();
                      const simScore = getSimilarityScore(f.name);
                      const cardKey = 1000 + i;
                      const isExpPaid = expandedCards.has(cardKey);
                      const aiDataPaid = markAnalysisCache[cardKey];
                      const statusBadge = isRegistered
                        ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                        : isPending
                        ? 'bg-amber-100 text-amber-700 border-amber-200'
                        : 'bg-gray-100 text-gray-600 border-gray-200';
                      const statusLabel = isRegistered
                        ? (lang === 'es' ? 'Registrada' : 'Registered')
                        : isPending
                        ? (lang === 'es' ? 'En Trámite' : 'Pending')
                        : f.status;
                      return (
                        <div key={i} className={`bg-white border rounded-xl overflow-hidden shadow-sm ${isExact ? 'border-red-200' : 'border-gray-100'}`}>
                          <div className="flex items-start gap-3 px-3 py-2.5">
                            <SimilarityGauge score={isExact ? 97 : simScore} size={44} />
                            <div className="flex-shrink-0 w-10 h-10 rounded-lg border border-gray-200 bg-gray-50 overflow-hidden flex items-center justify-center self-center">
                              {isDesignResult && f.imageUrl
                                ? <img src={f.imageUrl} alt={f.name} className="w-full h-full object-contain" />
                                : isDesignResult
                                ? <Shield size={14} className="text-gray-300" />
                                : <span className="text-[9px] font-bold text-gray-400 text-center leading-tight px-0.5">{f.name.slice(0, 3).toUpperCase()}</span>
                              }
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-0.5">
                                <span className="text-xs font-bold text-gray-800 leading-tight">{f.name || '—'}</span>
                                <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                                  <span className={`text-[9px] font-bold border rounded-full px-1.5 py-0.5 ${statusBadge}`}>{statusLabel}</span>
                                  {isExact && <span className="text-[8px] font-bold bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full uppercase">{tr('exactMatch', lang)}</span>}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 flex-wrap">
                                {f.classNum && (
                                  <span className="text-[10px] font-semibold bg-[#1a2e1a]/10 text-[#1a2e1a] px-1.5 py-0.5 rounded-full">
                                    {lang === 'zh' ? `第${f.classNum}类` : `Cl. ${f.classNum}`}
                                  </span>
                                )}
                                {f.holder && (
                                  <span className="text-[10px] text-gray-500 truncate max-w-[160px]">{f.holder}</span>
                                )}
                              </div>
                              {f.goodsServices && (
                                <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-2 leading-snug">{f.goodsServices}</p>
                              )}
                              {/* Improvement 4: Expediente / Reg # / dates */}
                              {(f.expediente || f.registrationNumber || f.filingDate || f.registrationDate || f.expiryDate) && (
                                <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5 pt-1.5 border-t border-gray-50">
                                  {f.expediente && (
                                    <span className="text-[9px] text-gray-500 font-mono flex items-center gap-0.5">
                                      <span className="font-semibold text-gray-400">{lang === 'es' ? 'Exp.' : 'App.'}</span> {f.expediente}
                                    </span>
                                  )}
                                  {f.registrationNumber && (
                                    <span className="text-[9px] text-gray-500 font-mono flex items-center gap-0.5">
                                      <span className="font-semibold text-gray-400">Reg.</span> {f.registrationNumber}
                                    </span>
                                  )}
                                  {f.filingDate && (
                                    <span className="text-[9px] text-gray-500 flex items-center gap-0.5">
                                      <span className="font-semibold text-gray-400">{lang === 'es' ? 'Solicitud:' : 'Filed:'}</span> {f.filingDate}
                                    </span>
                                  )}
                                  {f.registrationDate && (
                                    <span className="text-[9px] text-gray-500 flex items-center gap-0.5">
                                      <span className="font-semibold text-gray-400">{lang === 'es' ? 'Registro:' : 'Reg. date:'}</span> {f.registrationDate}
                                    </span>
                                  )}
                                  {f.expiryDate && (
                                    <span className="text-[9px] text-gray-500 flex items-center gap-0.5">
                                      <span className="font-semibold text-gray-400">{lang === 'es' ? 'Vencimiento:' : 'Expiry:'}</span> {f.expiryDate}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          {/* Expandable AI analysis (Improvement 1: lazy load) */}
                          <div className="border-t border-gray-50">
                            <button
                              type="button"
                              onClick={() => {
                                setExpandedCards(prev => {
                                  const next = new Set(prev);
                                  if (next.has(cardKey)) next.delete(cardKey); else next.add(cardKey);
                                  return next;
                                });
                                if (!markAnalysisCache[cardKey]) fetchMarkAnalysis(cardKey, f);
                              }}
                              className="w-full flex items-center justify-between px-3 py-1.5 text-[9px] font-medium text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
                            >
                              <span className="flex items-center gap-1"><Sparkles size={9} className="text-[#c9a84c]" />{lang === 'es' ? 'Ver análisis IA' : 'View AI analysis'}</span>
                              {isExpPaid ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                            </button>
                            {isExpPaid && (
                              <div className="px-3 pb-2.5 pt-1 bg-gray-50/50">
                                {aiDataPaid?.loading ? (
                                  <div className="flex items-center gap-1.5 text-[9px] text-gray-400">
                                    <Loader2 size={9} className="animate-spin flex-shrink-0" />
                                    <span>{lang === 'es' ? 'Analizando…' : 'Analyzing…'}</span>
                                  </div>
                                ) : aiDataPaid?.analysis ? (
                                  <p className="text-[10px] text-gray-600 leading-relaxed">{aiDataPaid.analysis}</p>
                                ) : (
                                  <p className="text-[10px] text-gray-600 leading-relaxed">
                                    {lang === 'es'
                                      ? `"${f.name}" — ${isExact ? 'Coincidencia exacta.' : `Similitud estimada ${simScore}%.`} Estado: ${f.status}.${f.classNum ? ` Clase ${f.classNum}.` : ''}${f.holder ? ` Titular: ${f.holder}.` : ''}`
                                      : `"${f.name}" — ${isExact ? 'Exact match.' : `Est. similarity ${simScore}%.`} Status: ${f.status}.${f.classNum ? ` Class ${f.classNum}.` : ''}${f.holder ? ` Holder: ${f.holder}.` : ''}`}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                <a href={result.marciaUrl} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 mt-3 text-xs text-blue-600 hover:text-blue-800 font-medium">
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
                          <p className="text-xs leading-relaxed opacity-90">
                            {f.explanation_user ?? (lang === 'en' ? f.explanation_en : f.explanation) ?? f.explanation}
                          </p>
                          {lang !== 'es' && f.explanation && (
                            <p className="text-[11px] text-gray-400 mt-1 italic">
                              <span className="not-italic font-semibold text-[10px]">ES: </span>{f.explanation}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mala Fe Registral row (Feature 4) */}
          {result.malaFe && result.malaFe.detected && (
            <div className={`mx-4 mb-3 rounded-lg border px-3 py-2.5 ${result.malaFe.riskLevel === 'high' ? 'border-red-200 bg-red-50' : result.malaFe.riskLevel === 'medium' ? 'border-orange-200 bg-orange-50' : 'border-amber-200 bg-amber-50'}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide ${result.malaFe.riskLevel === 'high' ? 'bg-red-100 text-red-700' : result.malaFe.riskLevel === 'medium' ? 'bg-orange-100 text-orange-700' : 'bg-amber-100 text-amber-700'}`}>{result.malaFe.riskLevel.toUpperCase()}</span>
                <span className="text-xs font-semibold text-gray-700">
                  {lang === 'es' ? 'Mala Fe Registral' : 'Bad-Faith Registration'} — Art. 173 Fr. XXII LFPPI
                </span>
              </div>
              <p className="text-xs leading-relaxed text-gray-700">
                {lang === 'en' ? result.malaFe.explanation_en : result.malaFe.explanation}
              </p>
              {result.malaFe.indicators.length > 0 && (
                <ul className="mt-1.5 space-y-0.5">
                  {result.malaFe.indicators.map((ind, i) => (
                    <li key={i} className="text-[10px] text-gray-500 flex items-start gap-1">
                      <span className="text-gray-400 flex-shrink-0 mt-0.5">•</span>{ind}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

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
                          <p className="text-[11px] text-gray-500 leading-relaxed">
                            {f.reasoning_user ?? (lang === 'en' ? f.reasoning_en : f.reasoning) ?? f.reasoning}
                          </p>
                          {lang !== 'es' && f.reasoning && (
                            <p className="text-[10px] text-gray-400 mt-1 italic">
                              <span className="not-italic font-semibold text-[9px]">ES: </span>{f.reasoning}
                            </p>
                          )}
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
              <p className="text-xs text-gray-600 leading-relaxed">
                {result.distinctiveness.explanation_user ?? (lang === 'en' ? result.distinctiveness.explanation_en : result.distinctiveness.explanation) ?? result.distinctiveness.explanation}
              </p>
              {lang !== 'es' && result.distinctiveness.explanation && (
                <p className="text-[11px] text-gray-400 leading-relaxed mt-1.5 italic">
                  <span className="not-italic font-semibold text-[10px]">ES: </span>{result.distinctiveness.explanation}
                </p>
              )}
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${TIER_COLORS[result.distinctiveness.tier] ?? 'bg-gray-400'}`}
                    style={{ width: `${(result.distinctiveness.score / 5) * 100}%` }} />
                </div>
                <span className="text-[10px] text-gray-400 font-medium">{result.distinctiveness.score}/5</span>
              </div>
            </div>
          )}

          {/* 4b — LFPPI Art. 173 Full Dashboard (22 fracciones) */}
          {(() => {

            // Map each fracción to its plain-English question + what category covers it
            const FRACCIONES: Array<{
              num: string;
              question: { en: string; es: string };
              category?: string;
              alwaysNA?: boolean;
            }> = [
              { num: 'I',    question: { en: 'Is the mark the common name for the product/service?', es: '¿Es el nombre común del producto o servicio?' }, category: 'generic' },
              { num: 'II',   question: { en: 'Does it directly describe the product\'s characteristics?', es: '¿Describe directamente características del producto?' }, category: 'descriptive' },
              { num: 'III',  question: { en: 'Is it a 3D shape that is the natural or technical form of the goods?', es: '¿Es una forma tridimensional natural o técnica del producto?' }, category: 'functional_shape' },
              { num: 'IV',   question: { en: 'Is it a shape that gives a technical advantage to the product?', es: '¿Es una forma que da ventaja técnica al producto?' }, category: 'functional_shape' },
              { num: 'V',    question: { en: 'Could it deceive consumers about the product\'s origin or quality?', es: '¿Puede engañar al consumidor sobre el origen o calidad?' }, category: 'deceptive' },
              { num: 'VI',   question: { en: 'Does it reproduce official state symbols or emblems?', es: '¿Reproduce símbolos o emblemas oficiales del Estado?' }, category: 'official_emblems' },
              { num: 'VII',  question: { en: 'Does it use a person\'s identity without their consent?', es: '¿Usa la identidad de una persona sin su consentimiento?' }, category: 'personal_identity' },
              { num: 'VIII', question: { en: 'Is it identical or similar to a plant variety denomination?', es: '¿Es idéntica o similar a una denominación de variedad vegetal?' }, alwaysNA: true },
              { num: 'IX',   question: { en: 'Is it identical or similar to a famous or notorious mark?', es: '¿Es idéntica o similar a una marca famosa o notoria?' }, category: 'famous_mark' },
              { num: 'X',    question: { en: 'Does it reproduce a protected literary/artistic work title?', es: '¿Reproduce el título de una obra literaria o artística protegida?' }, category: 'protected_characters' },
              { num: 'XI',   question: { en: 'Does it reproduce a protected geographical indication?', es: '¿Reproduce una denominación de origen o indicación geográfica protegida?' }, category: 'geographic_indication' },
              { num: 'XII',  question: { en: 'Is it contrary to public order or accepted morality?', es: '¿Es contraria al orden público o a la moral aceptada?' }, category: 'immoral_offensive' },
              { num: 'XIII', question: { en: 'Is it an isolated color without distinctive character?', es: '¿Es un color aislado sin carácter distintivo?' }, category: 'isolated_color' },
              { num: 'XIV',  question: { en: 'Is it a non-traditional mark lacking distinctiveness?', es: '¿Es una marca no tradicional sin distintividad?' }, category: 'non_distinctive_nontrad' },
              { num: 'XV',   question: { en: 'Is it a translation of a famous foreign mark?', es: '¿Es la traducción de una marca famosa extranjera?' }, category: 'famous_mark' },
              { num: 'XVI',  question: { en: 'Does it reproduce a protected plant variety or animal breed?', es: '¿Reproduce una variedad vegetal o raza animal protegida?' }, alwaysNA: true },
              { num: 'XVII', question: { en: 'Is it a geographical indication for wines/spirits from another region?', es: '¿Es una indicación geográfica para vinos/licores de otra región?' }, alwaysNA: true },
              { num: 'XVIII',question: { en: 'Is it confusingly similar to an already-registered mark?', es: '¿Es confusamente similar a una marca ya registrada?' }, category: 'confusingly_similar' },
              { num: 'XIX',  question: { en: 'Is it identical to a mark registered by someone else in the same class?', es: '¿Es idéntica a una marca registrada por otro en la misma clase?' }, category: 'confusingly_similar' },
              { num: 'XX',   question: { en: 'Could it be confused with a trade name already in use?', es: '¿Puede confundirse con un nombre comercial ya en uso?' }, category: 'confusingly_similar' },
              { num: 'XXI',  question: { en: 'Is it identical to a mark with a pending earlier application?', es: '¿Es idéntica a una marca con solicitud anterior en trámite?' }, category: 'confusingly_similar' },
              { num: 'XXII', question: { en: 'Was the application filed in bad faith?', es: '¿Fue presentada la solicitud de mala fe?' }, category: 'bad_faith' },
            ];

            // Determine verdict per fracción from the result
            const getVerdict = (frac: typeof FRACCIONES[0]): 'pass' | 'caution' | 'fail' | 'na' => {
              if (frac.alwaysNA) return 'na';
              if (!frac.category) return 'na';
              const matchingFlag = regFlags.find(f => f.category === frac.category);
              if (!matchingFlag) {
                // Special: confusingly_similar — check marcia findings
                if (frac.category === 'confusingly_similar') {
                  const hasExact = result.marciaFindings.some(f =>
                    (f as MarciaFinding & { classOverlap?: string }).classOverlap === 'same'
                  );
                  const hasRelated = result.marciaFindings.some(f =>
                    (f as MarciaFinding & { classOverlap?: string }).classOverlap === 'related'
                  );
                  if (hasExact && (frac.num === 'XVIII' || frac.num === 'XIX' || frac.num === 'XXI')) return 'fail';
                  if (hasRelated && frac.num === 'XVIII') return 'caution';
                  return 'pass';
                }
                if (frac.category === 'famous_mark') {
                  if ((result.famousMarkConflicts ?? []).length > 0) return 'caution';
                }
                if (frac.category === 'bad_faith') {
                  const mf = result.malaFe;
                  if (mf?.detected && mf.riskLevel === 'high') return 'fail';
                  if (mf?.detected) return 'caution';
                }
                return 'pass';
              }
              if (matchingFlag.severity === 'high') return 'fail';
              if (matchingFlag.severity === 'medium') return 'caution';
              return 'caution';
            };

            const verdicts = FRACCIONES.map(f => ({ ...f, verdict: getVerdict(f) }));
            const failCount = verdicts.filter(v => v.verdict === 'fail').length;
            const cautionCount = verdicts.filter(v => v.verdict === 'caution').length;

            return (
              <div className="border-b border-gray-100">
                <button type="button" onClick={() => setLfppiDashExpanded(v => !v)}
                  className="w-full flex items-center justify-between px-4 py-2 text-xs font-medium text-gray-600 hover:bg-white/80 transition-colors">
                  <span className="flex flex-col items-start text-left gap-0.5">
                    <span className="flex items-center gap-1.5">
                      <Scale size={12} className="text-[#1a2e1a]" />
                      {lang === 'es' ? 'Art. 173 LFPPI — Las 22 Fracciones' : 'Art. 173 LFPPI — All 22 Grounds'}
                      {failCount > 0 && <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-full">{failCount} {lang === 'es' ? 'fallido(s)' : 'failed'}</span>}
                      {cautionCount > 0 && <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full">{cautionCount} {lang === 'es' ? 'precaución' : 'caution'}</span>}
                    </span>
                    <span className="text-[9px] text-gray-400 font-normal pl-5">
                      {lang === 'es' ? 'Revisión completa de todas las causales absolutas de negativa. Haz clic en cualquier casilla para ver el análisis.' : 'Full review of all absolute grounds for refusal. Click any card to expand analysis.'}
                    </span>
                  </span>
                  {lfppiDashExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                </button>
                {lfppiDashExpanded && (
                  <div className="px-4 pb-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 mt-1">
                      {verdicts.map((frac) => {
                        const verdictStyles = {
                          pass:    { ring: 'border-emerald-200 bg-emerald-50',   icon: '✓', iconColor: 'text-emerald-600', label: lang === 'es' ? 'OK' : 'Pass' },
                          caution: { ring: 'border-amber-200 bg-amber-50',       icon: '!', iconColor: 'text-amber-600',   label: lang === 'es' ? 'Precaución' : 'Caution' },
                          fail:    { ring: 'border-red-300 bg-red-50 ring-1 ring-red-300', icon: '✗', iconColor: 'text-red-600', label: lang === 'es' ? 'Falla' : 'Fail' },
                          na:      { ring: 'border-gray-100 bg-gray-50',          icon: '—', iconColor: 'text-gray-300',   label: 'N/A' },
                        }[frac.verdict];
                        const matchingFlag = frac.category ? regFlags.find(f => f.category === frac.category) : undefined;
                        return (
                          <details key={frac.num} className={`rounded-lg border px-2.5 py-2 cursor-pointer ${verdictStyles.ring} transition-all`}>
                            <summary className="list-none flex items-start gap-1.5 select-none">
                              <span className={`text-[11px] font-bold flex-shrink-0 mt-0.5 w-4 text-center ${verdictStyles.iconColor}`}>{verdictStyles.icon}</span>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1 flex-wrap">
                                  <span className="text-[9px] font-bold text-gray-500 flex-shrink-0">Fr. {frac.num}</span>
                                  <span className={`text-[8px] font-semibold px-1 py-0.5 rounded uppercase tracking-wide flex-shrink-0 ${
                                    frac.verdict === 'fail' ? 'bg-red-100 text-red-700' :
                                    frac.verdict === 'caution' ? 'bg-amber-100 text-amber-700' :
                                    frac.verdict === 'na' ? 'bg-gray-100 text-gray-400' :
                                    'bg-emerald-100 text-emerald-700'
                                  }`}>{verdictStyles.label}</span>
                                </div>
                                <p className="text-[9px] text-gray-600 mt-0.5 leading-tight">
                                  {lang === 'es' ? frac.question.es : frac.question.en}
                                </p>
                              </div>
                            </summary>
                            <div className="mt-2 pt-2 border-t border-gray-100">
                              {matchingFlag ? (
                                <p className="text-[10px] text-gray-600 leading-relaxed">
                                  {matchingFlag.explanation_user ?? (lang === 'en' ? matchingFlag.explanation_en : matchingFlag.explanation) ?? matchingFlag.explanation}
                                </p>
                              ) : frac.verdict === 'na' ? (
                                <p className="text-[10px] text-gray-400 italic">{lang === 'es' ? 'No aplica a este tipo de marca.' : 'Does not apply to this type of mark.'}</p>
                              ) : frac.verdict === 'pass' ? (
                                <p className="text-[10px] text-emerald-700">{lang === 'es' ? 'Sin problemas identificados bajo esta fracción.' : 'No issues identified under this ground.'}</p>
                              ) : (
                                <p className="text-[10px] text-amber-700">{lang === 'es' ? 'Posible conflicto — revisa los hallazgos arriba.' : 'Possible conflict — review findings above.'}</p>
                              )}
                            </div>
                          </details>
                        );
                      })}
                    </div>
                    <p className="text-[9px] text-gray-400 mt-2 flex items-center gap-1">
                      <Info size={9} className="flex-shrink-0" />
                      {lang === 'es' ? 'Basado en LFPPI Art. 173 (Decreto publicado DOF). Esta evaluación es orientativa y no constituye asesoría legal.' : 'Based on LFPPI Art. 173 as published in the DOF. This assessment is indicative and does not constitute legal advice.'}
                    </p>
                  </div>
                )}
              </div>
            );
          })()}

          {/* 4c — Conflict Tiers: Critical / Significant / Background */}
          {(() => {
            const allFindings = result.marciaFindings;
            const critical = allFindings.filter(f => {
              const sim = getSimilarityScore(f.name);
              const overlap = (f as MarciaFinding & { classOverlap?: string }).classOverlap;
              return sim >= 80 || overlap === 'same';
            });
            const significant = allFindings.filter(f => {
              const sim = getSimilarityScore(f.name);
              const overlap = (f as MarciaFinding & { classOverlap?: string }).classOverlap;
              return sim >= 50 && sim < 80 && overlap !== 'same';
            });
            const background = allFindings.filter(f => {
              const sim = getSimilarityScore(f.name);
              const overlap = (f as MarciaFinding & { classOverlap?: string }).classOverlap;
              return sim < 50 && overlap !== 'same';
            });
            if (allFindings.length === 0) return null;

            const ConflictCard = ({ f, tier }: { f: MarciaFinding & { classOverlap?: string }, tier: 'critical' | 'significant' | 'background' }) => {
              const statusLower = f.status.toLowerCase();
              const isRegistered = /registrada|vigente|registered|active/i.test(statusLower) && !/tram|pend|proc/i.test(statusLower);
              const isPending = /tram|pend|proc|solicitud/i.test(statusLower);
              const isExact = f.name.toLowerCase().trim() === markName.toLowerCase().trim();
              const sim = getSimilarityScore(f.name);
              const statusBadge = isRegistered ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : isPending ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-gray-100 text-gray-500 border-gray-200';
              const statusLabel = isRegistered ? (lang === 'es' ? 'Registrada' : 'Registered') : isPending ? (lang === 'es' ? 'En Trámite' : 'Pending') : f.status;
              const whyItMatters = tier === 'critical'
                ? (lang === 'es' ? `Similitud ${sim}% con tu marca${f.classOverlap === 'same' ? ' en la misma clase' : ''}. Obstáculo directo al registro.` : `${sim}% similar to your mark${f.classOverlap === 'same' ? ' in the same class' : ''}. Direct obstacle to registration.`)
                : tier === 'significant'
                ? (lang === 'es' ? `Similitud ${sim}%. Riesgo moderado de confusión.` : `${sim}% similar. Moderate confusion risk.`)
                : (lang === 'es' ? `Similitud ${sim}%. Ruido de fondo — riesgo bajo.` : `${sim}% similar. Background noise — low risk.`);

              return (
                <div className={`rounded-xl border p-3 bg-white shadow-sm ${tier === 'critical' ? 'border-red-200' : tier === 'significant' ? 'border-amber-200' : 'border-gray-100'}`}>
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <SimilarityGauge score={isExact ? 97 : sim} size={36} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-800 leading-tight truncate">{f.name || '—'}</p>
                        <p className="text-[9px] text-gray-500 truncate">{f.holder || ''}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className={`text-[9px] font-bold border rounded-full px-1.5 py-0.5 ${statusBadge}`}>{statusLabel}</span>
                      {isExact && <span className="text-[8px] font-bold bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full uppercase">{tr('exactMatch', lang)}</span>}
                      {f.classNum && <span className="text-[9px] font-semibold bg-[#1a2e1a]/10 text-[#1a2e1a] px-1.5 py-0.5 rounded-full">Cl. {f.classNum}</span>}
                    </div>
                  </div>
                  {f.goodsServices && <p className="text-[9px] text-gray-400 line-clamp-1 mb-1">{f.goodsServices}</p>}
                  <div className={`text-[9px] px-2 py-1 rounded-lg ${tier === 'critical' ? 'bg-red-50 text-red-700' : tier === 'significant' ? 'bg-amber-50 text-amber-700' : 'bg-gray-50 text-gray-500'}`}>
                    {whyItMatters}
                  </div>
                  {(f.expediente || f.filingDate) && (
                    <div className="flex gap-2 mt-1.5 text-[8px] text-gray-400 font-mono">
                      {f.expediente && <span>Exp. {f.expediente}</span>}
                      {f.filingDate && <span>{lang === 'es' ? 'Solicitud:' : 'Filed:'} {f.filingDate}</span>}
                    </div>
                  )}
                </div>
              );
            };

            return (
              <div className="border-b border-gray-100">
                <button type="button" onClick={() => setConflictTiersExpanded(v => !v)}
                  className="w-full flex items-center justify-between px-4 py-2 text-xs font-medium text-gray-600 hover:bg-white/80 transition-colors">
                  <span className="flex flex-col items-start text-left gap-0.5">
                    <span className="flex items-center gap-1.5">
                      <AlertCircle size={12} className="text-[#1a2e1a]" />
                      {lang === 'es' ? 'Conflictos por Nivel de Riesgo' : 'Conflicts by Risk Tier'}
                      {critical.length > 0 && <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-full">{critical.length} {lang === 'es' ? 'críticos' : 'critical'}</span>}
                      {significant.length > 0 && <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full">{significant.length} {lang === 'es' ? 'significativos' : 'significant'}</span>}
                    </span>
                    <span className="text-[9px] text-gray-400 font-normal pl-5">
                      {lang === 'es' ? 'Conflictos clasificados por nivel de amenaza para el registro.' : 'Conflicts ranked by threat level to your registration.'}
                    </span>
                  </span>
                  {conflictTiersExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                </button>
                {conflictTiersExpanded && (
                  <div className="px-4 pb-4 space-y-4">
                    {critical.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[10px] font-bold text-red-700 uppercase tracking-wide">{lang === 'es' ? 'Críticos' : 'Critical'} — {lang === 'es' ? 'Similitud ≥80% o misma clase' : 'Similarity ≥80% or same class'}</span>
                          <div className="flex-1 h-px bg-red-100" />
                          <span className="text-[9px] text-red-500 font-semibold">{critical.length}</span>
                        </div>
                        <div className="space-y-2">
                          {critical.map((f, i) => <ConflictCard key={i} f={f as MarciaFinding & { classOverlap?: string }} tier="critical" />)}
                        </div>
                      </div>
                    )}
                    {significant.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wide">{lang === 'es' ? 'Significativos' : 'Significant'} — {lang === 'es' ? 'Similitud 50–79%' : 'Similarity 50–79%'}</span>
                          <div className="flex-1 h-px bg-amber-100" />
                          <span className="text-[9px] text-amber-500 font-semibold">{significant.length}</span>
                        </div>
                        <div className="space-y-2">
                          {significant.map((f, i) => <ConflictCard key={i} f={f as MarciaFinding & { classOverlap?: string }} tier="significant" />)}
                        </div>
                      </div>
                    )}
                    {background.length > 0 && (
                      <details className="group">
                        <summary className="flex items-center gap-2 cursor-pointer list-none select-none">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{lang === 'es' ? 'Ruido de Fondo' : 'Background Noise'} — {lang === 'es' ? 'Similitud &lt;50%' : 'Similarity <50%'}</span>
                          <div className="flex-1 h-px bg-gray-100" />
                          <span className="text-[9px] text-gray-400 font-semibold">{background.length}</span>
                          <ChevronDown size={10} className="text-gray-400 group-open:rotate-180 transition-transform" />
                        </summary>
                        <div className="mt-2 space-y-1">
                          {background.map((f, i) => (
                            <div key={i} className="flex items-center gap-2 px-2 py-1.5 rounded-lg border border-gray-100 bg-gray-50/50 text-[10px]">
                              <span className="font-semibold text-gray-600 flex-1 min-w-0 truncate">{f.name}</span>
                              {f.classNum && <span className="text-[9px] text-gray-400 flex-shrink-0">Cl. {f.classNum}</span>}
                              <span className="text-[9px] text-gray-400 flex-shrink-0">{getSimilarityScore(f.name)}%</span>
                            </div>
                          ))}
                        </div>
                      </details>
                    )}
                  </div>
                )}
              </div>
            );
          })()}

          {/* 4d — Strategy Recommendations */}
          {(() => {
            const riskLevel = result.risk;
            const distinctTier = result.distinctiveness?.tier ?? 'suggestive';
            const hasExactSameClass = result.marciaFindings.some(f =>
              (f as MarciaFinding & { classOverlap?: string }).classOverlap === 'same'
            );

            type Strategy = { title: { en: string; es: string }; viability: number; pros: { en: string; es: string }[]; cons: { en: string; es: string }[]; fee: string; timeline: { en: string; es: string }; probability: { en: string; es: string } };

            const strategies: Strategy[] = [];

            if (!hasExactSameClass && (distinctTier === 'arbitrary' || distinctTier === 'fanciful')) {
              strategies.push({
                title: { en: 'File as-is with supporting evidence', es: 'Presentar tal cual con evidencia de uso' },
                viability: 80,
                pros: [{ en: 'Fast — no reformulation needed.', es: 'Rápido — sin reformulación.' }, { en: 'Preserves brand equity already built.', es: 'Preserva el capital de marca ya construido.' }],
                cons: [{ en: 'Some opposition risk remains.', es: 'Subsiste riesgo de oposición.' }],
                fee: 'USD $170 (IMPI official fee) + professional fees',
                timeline: { en: '12–18 months to registration', es: '12–18 meses al registro' },
                probability: { en: 'High (70–85%)', es: 'Alta (70–85%)' },
              });
            }

            if (distinctTier === 'descriptive' || distinctTier === 'generic') {
              strategies.push({
                title: { en: 'Add a distinctive design element (logo)', es: 'Agregar elemento gráfico distintivo (logo)' },
                viability: 60,
                pros: [{ en: 'Reduces descriptiveness objection under Fr. II.', es: 'Reduce objeción por descriptividad bajo Fr. II.' }, { en: 'Visually differentiates from conflicting marks.', es: 'Diferencia visualmente de marcas conflictivas.' }],
                cons: [{ en: 'Protects only the composite, not the word alone.', es: 'Protege solo el conjunto, no la palabra sola.' }, { en: 'Requires additional design cost.', es: 'Requiere costo adicional de diseño.' }],
                fee: 'USD $170 (IMPI official fee) + professional fees',
                timeline: { en: '14–20 months', es: '14–20 meses' },
                probability: { en: 'Moderate (50–65%)', es: 'Moderada (50–65%)' },
              });
            }

            if (hasExactSameClass || riskLevel === 'high') {
              strategies.push({
                title: { en: 'Reformulate with a coined/fanciful element', es: 'Reformular con un elemento de fantasía' },
                viability: 85,
                pros: [{ en: 'Eliminates the Fr. XVIII confusing similarity problem.', es: 'Elimina el problema de similitud confusoria bajo Fr. XVIII.' }, { en: 'Strongest possible distinctiveness score.', es: 'Mayor puntuación posible de distintividad.' }],
                cons: [{ en: 'Requires abandoning existing brand investment.', es: 'Requiere abandonar la inversión en marca existente.' }, { en: 'New mark needs its own clearance search.', es: 'La nueva marca necesita su propio estudio.' }],
                fee: 'USD $170 (IMPI official fee) + professional fees',
                timeline: { en: '12–18 months (new mark)', es: '12–18 meses (nueva marca)' },
                probability: { en: 'Very high (80–90%) if coined', es: 'Muy alta (80–90%) si es de fantasía' },
              });
              strategies.push({
                title: { en: 'Seek coexistence agreement with the conflicting holder', es: 'Negociar acuerdo de coexistencia con el titular en conflicto' },
                viability: 40,
                pros: [{ en: 'Preserves your exact mark.', es: 'Conserva tu marca exacta.' }, { en: 'Removes the opposition risk from that specific party.', es: 'Elimina el riesgo de oposición de esa parte.' }],
                cons: [{ en: 'Requires holder cooperation — may be refused.', es: 'Requiere cooperación del titular — puede ser rechazado.' }, { en: 'IMPI not bound by coexistence agreements.', es: 'El IMPI no está vinculado por acuerdos de coexistencia.' }],
                fee: 'Negotiation costs vary',
                timeline: { en: '3–12 months for negotiation', es: '3–12 meses de negociación' },
                probability: { en: 'Variable (30–60%)', es: 'Variable (30–60%)' },
              });
            }

            strategies.push({
              title: { en: 'Consult a licensed Mexican trademark attorney', es: 'Consultar con un abogado de marcas mexicano certificado' },
              viability: 95,
              pros: [{ en: 'Personalized legal strategy based on full facts.', es: 'Estrategia legal personalizada basada en todos los hechos.' }, { en: 'Can negotiate oppositions and file responses.', es: 'Puede negociar oposiciones y presentar respuestas.' }],
              cons: [{ en: 'Additional professional fees.', es: 'Honorarios profesionales adicionales.' }],
              fee: 'USD $500–$2,000+ attorney fees',
              timeline: { en: 'Consultation within days', es: 'Consulta en días' },
              probability: { en: 'Best outcome possible', es: 'El mejor resultado posible' },
            });

            return (
              <div className="border-b border-gray-100">
                <button type="button" onClick={() => setStratExpanded(v => !v)}
                  className="w-full flex items-center justify-between px-4 py-2 text-xs font-medium text-gray-600 hover:bg-white/80 transition-colors">
                  <span className="flex flex-col items-start text-left gap-0.5">
                    <span className="flex items-center gap-1.5">
                      <Sparkles size={12} className="text-[#c9a84c]" />
                      {lang === 'es' ? 'Estrategias Recomendadas' : 'Strategy Recommendations'}
                    </span>
                    <span className="text-[9px] text-gray-400 font-normal pl-5">
                      {lang === 'es' ? `${strategies.length} caminos posibles, ordenados por viabilidad.` : `${strategies.length} possible paths, ranked by viability.`}
                    </span>
                  </span>
                  {stratExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                </button>
                {stratExpanded && (
                  <div className="px-4 pb-4 space-y-3">
                    {/* ── Alternative Name Cards ──────────────────────────── */}
                    {(result.alternativeNames?.length ?? 0) > 0 && (
                      <div className="mb-1">
                        <div className="flex items-center gap-2 mb-2 mt-1">
                          <Sparkles size={11} className="text-[#c9a84c] flex-shrink-0" />
                          <span className="text-[10px] font-bold text-gray-700 uppercase tracking-wide">{tr('alternativeNamesTitle', lang)}</span>
                        </div>
                        <p className="text-[10px] text-gray-500 mb-3 leading-relaxed">{tr('alternativeNamesSubtitle', lang)}</p>
                        <div className="space-y-2.5">
                          {result.alternativeNames!.map((alt, i) => {
                            const scoreColor = alt.score >= 85 ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
                              : alt.score >= 70 ? 'bg-amber-100 text-amber-700 border-amber-300'
                              : 'bg-gray-100 text-gray-600 border-gray-300';
                            const rationale = (lang === 'es') ? alt.rationale : alt.rationale_en;
                            return (
                              <div
                                key={i}
                                id={i === 0 ? 'first-alternative' : undefined}
                                className="rounded-xl border-2 border-[#c9a84c]/30 bg-gradient-to-br from-[#faf8f0] to-white p-3 shadow-sm"
                              >
                                <div className="flex items-start justify-between gap-2 mb-2">
                                  <div>
                                    <p className="text-base font-black text-[#1a2e1a] tracking-wide leading-tight">{alt.name}</p>
                                    <p className="text-[10px] text-gray-500 mt-1 leading-relaxed">{rationale}</p>
                                  </div>
                                  <span className={`flex-shrink-0 text-[9px] font-bold px-2 py-1 rounded-full border ${scoreColor}`}>
                                    {tr('registrabilityScore', lang)} {alt.score}%
                                  </span>
                                </div>
                                <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden mb-3">
                                  <div className="h-full rounded-full transition-all" style={{ width: `${alt.score}%`, backgroundColor: alt.score >= 85 ? '#10b981' : alt.score >= 70 ? '#f59e0b' : '#9ca3af' }} />
                                </div>
                                <a
                                  href={`/apply?mark=${encodeURIComponent(alt.name)}&fromClearance=1&ref=alternative`}
                                  onClick={() => {
                                    if (result) {
                                      sessionStorage.setItem('clrMark', alt.name);
                                      sessionStorage.setItem('clrGoods', goodsServices ?? '');
                                      sessionStorage.setItem('clrResult', JSON.stringify(result));
                                    }
                                    trackEvent('report_cta_clicked', { source: 'alternative_card', mark: alt.name }, lang);
                                  }}
                                  className="flex items-center justify-center gap-1.5 w-full bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold py-2 rounded-lg transition-colors"
                                >
                                  <ArrowRight size={11} />
                                  {tr('fileThisMark', lang)}
                                </a>
                              </div>
                            );
                          })}
                        </div>
                        <div className="border-t border-gray-100 my-3" />
                      </div>
                    )}
                    {/* ── Strategy Path Cards ─────────────────────────────── */}
                    {strategies.sort((a, b) => b.viability - a.viability).map((s, i) => (
                      <div key={i} className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 ${s.viability >= 80 ? 'bg-emerald-500' : s.viability >= 55 ? 'bg-amber-500' : 'bg-gray-400'}`}>{i + 1}</div>
                            <p className="text-xs font-bold text-gray-800 leading-tight">{lang === 'es' ? s.title.es : s.title.en}</p>
                          </div>
                          <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${s.viability >= 80 ? 'bg-emerald-100 text-emerald-700' : s.viability >= 55 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'}`}>
                              {lang === 'es' ? 'Viabilidad' : 'Viability'}: {s.viability}%
                            </span>
                          </div>
                        </div>
                        <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden mb-2">
                          <div className="h-full rounded-full" style={{ width: `${s.viability}%`, backgroundColor: s.viability >= 80 ? '#10b981' : s.viability >= 55 ? '#f59e0b' : '#9ca3af' }} />
                        </div>
                        <div className="grid grid-cols-2 gap-3 mb-2 text-[9px]">
                          <div>
                            <p className="font-semibold text-gray-400 uppercase tracking-wide mb-1">{lang === 'es' ? 'A favor' : 'Pros'}</p>
                            {s.pros.map((p, j) => (
                              <p key={j} className="text-emerald-700 flex items-start gap-1 mb-0.5"><span className="text-emerald-500 flex-shrink-0">+</span>{lang === 'es' ? p.es : p.en}</p>
                            ))}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-400 uppercase tracking-wide mb-1">{lang === 'es' ? 'En contra' : 'Cons'}</p>
                            {s.cons.map((c, j) => (
                              <p key={j} className="text-red-600 flex items-start gap-1 mb-0.5"><span className="flex-shrink-0">−</span>{lang === 'es' ? c.es : c.en}</p>
                            ))}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-gray-50 pt-2 text-[9px] text-gray-500">
                          <span><span className="font-semibold text-gray-400">{lang === 'es' ? 'Costo est.:' : 'Est. cost:'}</span> {s.fee}</span>
                          <span><span className="font-semibold text-gray-400">{lang === 'es' ? 'Plazo:' : 'Timeline:'}</span> {lang === 'es' ? s.timeline.es : s.timeline.en}</span>
                          <span><span className="font-semibold text-gray-400">{lang === 'es' ? 'Prob. éxito:' : 'Success prob.:'}</span> {lang === 'es' ? s.probability.es : s.probability.en}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}

          {/* 4e — Cost & Timeline Panel */}
          {(() => {
            const steps: Array<{ label: { en: string; es: string }; duration: { en: string; es: string }; cost: string; note: { en: string; es: string } }> = [
              { label: { en: 'Filing', es: 'Presentación' }, duration: { en: 'Day 0', es: 'Día 0' }, cost: 'USD $170 (IMPI official fee, 1 class)', note: { en: 'Application submitted to IMPI. Filing date establishes priority.', es: 'Solicitud presentada ante el IMPI. La fecha establece prioridad.' } },
              { label: { en: 'Formal examination', es: 'Examen formal' }, duration: { en: '1–3 months', es: '1–3 meses' }, cost: 'No additional fee', note: { en: 'IMPI checks that all required documents are in order.', es: 'El IMPI verifica que la documentación esté en orden.' } },
              { label: { en: 'Substantive examination', es: 'Examen de fondo' }, duration: { en: '4–10 months', es: '4–10 meses' }, cost: 'No additional fee', note: { en: 'IMPI evaluates the mark for absolute and relative grounds.', es: 'El IMPI evalúa la marca por motivos absolutos y relativos.' } },
              { label: { en: 'Publication in Gazette', es: 'Publicación en Gaceta' }, duration: { en: '10–14 months', es: '10–14 meses' }, cost: 'No additional fee', note: { en: 'Mark published for 1-month opposition window.', es: 'Marca publicada por ventana de oposición de 1 mes.' } },
              { label: { en: 'Opposition window', es: 'Periodo de oposición' }, duration: { en: '1 month', es: '1 mes' }, cost: 'Defense costs if opposed', note: { en: 'Third parties may file oppositions. High-risk marks are more likely to be opposed.', es: 'Terceros pueden presentar oposiciones. Marcas de alto riesgo son más propensas.' } },
              { label: { en: 'Registration & certificate', es: 'Registro y certificado' }, duration: { en: '12–18 months total', es: '12–18 meses total' }, cost: 'Included in initial fee', note: { en: 'Certificate issued. Registration valid for 10 years, renewable.', es: 'Se expide el certificado. Registro vigente por 10 años, renovable.' } },
            ];

            return (
              <div className="border-b border-gray-100">
                <button type="button" onClick={() => setTimelineExpanded(v => !v)}
                  className="w-full flex items-center justify-between px-4 py-2 text-xs font-medium text-gray-600 hover:bg-white/80 transition-colors">
                  <span className="flex flex-col items-start text-left gap-0.5">
                    <span className="flex items-center gap-1.5">
                      <Zap size={12} className="text-[#c9a84c]" />
                      {lang === 'es' ? 'Costo y Cronograma IMPI' : 'IMPI Cost & Timeline'}
                    </span>
                    <span className="text-[9px] text-gray-400 font-normal pl-5">
                      {lang === 'es' ? '12–18 meses · USD $170 cuota oficial IMPI por clase · Ventana de oposición: 1 mes' : '12–18 months · USD $170 IMPI official fee per class · 1-month opposition window'}
                    </span>
                  </span>
                  {timelineExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                </button>
                {timelineExpanded && (
                  <div className="px-4 pb-4">
                    <div className="relative mt-2">
                      {steps.map((step, i) => (
                        <div key={i} className="flex gap-3 mb-3 last:mb-0">
                          <div className="flex flex-col items-center">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0 ${i === steps.length - 1 ? 'bg-emerald-500' : i === steps.length - 2 ? 'bg-amber-500' : 'bg-[#1a2e1a]'}`}>{i + 1}</div>
                            {i < steps.length - 1 && <div className="w-px flex-1 bg-gray-200 my-1" style={{ minHeight: '16px' }} />}
                          </div>
                          <div className="flex-1 min-w-0 pb-1">
                            <div className="flex items-center gap-2 flex-wrap mb-0.5">
                              <p className="text-[11px] font-bold text-gray-800">{lang === 'es' ? step.label.es : step.label.en}</p>
                              <span className="text-[9px] font-semibold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">{lang === 'es' ? step.duration.es : step.duration.en}</span>
                              {step.cost !== 'No additional fee' && step.cost !== 'Included in initial fee' && (
                                <span className="text-[9px] font-semibold text-[#1a2e1a] bg-[#1a2e1a]/10 px-1.5 py-0.5 rounded-full">{step.cost}</span>
                              )}
                            </div>
                            <p className="text-[9px] text-gray-500 leading-relaxed">{lang === 'es' ? step.note.es : step.note.en}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 p-2.5 rounded-xl bg-amber-50 border border-amber-200">
                      <p className="text-[10px] text-amber-800 font-semibold mb-0.5">{lang === 'es' ? 'Nota sobre la tasa IMPI' : 'Note on IMPI fee'}</p>
                      <p className="text-[9px] text-amber-700">{lang === 'es' ? 'Las cuotas del IMPI se actualizan anualmente conforme al UMA. El monto indicado es orientativo. Verifica la tarifa vigente en gob.mx antes de presentar.' : 'IMPI fees are updated annually based on the UMA unit. The amount shown is indicative. Verify the current fee at gob.mx before filing.'}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

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
                    {/* Improvement 7: Always show all 8 languages in a table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-[10px] border-collapse">
                        <thead>
                          <tr className="border-b border-gray-100">
                            <th className="text-left py-1.5 pr-2 font-semibold text-gray-400 uppercase tracking-wide text-[9px] w-24">{lang === 'es' ? 'Idioma' : 'Language'}</th>
                            <th className="text-left py-1.5 pr-2 font-semibold text-gray-400 uppercase tracking-wide text-[9px]">{lang === 'es' ? 'Forma' : 'Form'}</th>
                            <th className="text-left py-1.5 pr-2 font-semibold text-gray-400 uppercase tracking-wide text-[9px] w-16">{lang === 'es' ? 'Riesgo' : 'Risk'}</th>
                            <th className="text-left py-1.5 font-semibold text-gray-400 uppercase tracking-wide text-[9px]">{lang === 'es' ? 'Nota' : 'Note'}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {tflags.map((f, i) => {
                            const riskBadge = { high: 'bg-red-100 text-red-700', medium: 'bg-amber-100 text-amber-700', low: 'bg-blue-100 text-blue-700', none: 'bg-emerald-50 text-emerald-600' }[f.risk];
                            const riskLabel = { high: lang === 'es' ? 'Alto' : 'High', medium: lang === 'es' ? 'Medio' : 'Med', low: lang === 'es' ? 'Bajo' : 'Low', none: lang === 'es' ? 'Ninguno' : 'None' }[f.risk];
                            return (
                              <tr key={i} className={`border-b border-gray-50 last:border-0 ${f.risk !== 'none' ? 'bg-amber-50/30' : ''}`}>
                                <td className="py-1.5 pr-2 font-semibold text-gray-700 align-top">{f.languageName}</td>
                                <td className="py-1.5 pr-2 align-top">
                                  <span className="font-mono text-gray-700">{f.translatedForm}</span>
                                  {f.romanization && (
                                    <span className="block text-[9px] text-gray-400 italic">{f.romanization}</span>
                                  )}
                                </td>
                                <td className="py-1.5 pr-2 align-top">
                                  <span className={`inline-block text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase ${riskBadge}`}>{riskLabel}</span>
                                </td>
                                <td className="py-1.5 text-gray-500 align-top leading-relaxed">
                                  {f.risk !== 'none' ? f.details : (
                                    <span className="text-emerald-600">{lang === 'es' ? 'Sin conflictos' : 'No conflicts'}</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    {hasConflicts && (
                      <p className="text-[10px] text-gray-400 mt-2 flex items-center gap-1">
                        <Info size={9} className="flex-shrink-0" />{lang === 'es' ? 'Detalles completos incluidos en el PDF.' : 'Full conflict details are included in the purchased PDF report.'}
                      </p>
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

      {/* ── Scope statement / disclaimer ───────────────────────────────────── */}
      <div className="border-t border-gray-100 px-4 py-3 bg-gray-50/60 print:block">
        <p className="text-[10px] text-gray-400 leading-relaxed">
          {tr('scopeStatement', lang)}
        </p>
      </div>

      {/* ── Free PDF report CTA ──────────────────────────────────────────────── */}
      {!pdfModalDone ? (
        <div className="border-t border-gray-100 px-4 py-4 bg-orange-50 print:hidden">
          <button
            type="button"
            onClick={() => setShowPdfModal(true)}
            className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-bold px-5 py-3 rounded-xl transition-colors shadow-md text-sm"
          >
            <Download size={14} />
            {tr('freePdfCta', lang)}
            <ArrowRight size={14} />
          </button>
        </div>
      ) : (
        <div className="border-t border-gray-100 px-4 py-4 bg-emerald-50 print:hidden">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 size={14} className="text-emerald-600 flex-shrink-0" />
            <p className="text-xs font-semibold text-emerald-800">{tr('emailCaptureSent', lang)}</p>
          </div>
          {pdfModalUrl ? (
            <a
              href={pdfModalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl transition-colors text-sm"
            >
              <Download size={14} />{tr('downloadPdfNow', lang)}
            </a>
          ) : (
            <p className="text-xs text-emerald-600 flex items-center gap-1.5">
              <Loader2 size={11} className="animate-spin flex-shrink-0" />{tr('pdfGenerating', lang)}
            </p>
          )}
        </div>
      )}

      {/* ── Purchase / Post-payment flow (only shown when PAID_REPORT_ENABLED=true) ── */}
      {PAID_REPORT_ENABLED && <div className="border-t border-gray-100 print:hidden">

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
            ) : pdfFailed ? (
              <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 max-w-sm">
                <AlertTriangle size={13} className="flex-shrink-0 mt-0.5 text-amber-500" />
                <span>{tr('pdfDelayed', lang)}</span>
              </div>
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
            {/* Attorney review add-on */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => setWantsAttorneyReview(v => !v)}
              onKeyDown={e => e.key === 'Enter' && setWantsAttorneyReview(v => !v)}
              className={`mb-4 rounded-xl border-2 p-3 cursor-pointer transition-colors select-none ${wantsAttorneyReview ? 'border-[#c9a84c] bg-[#faf8f0]' : 'border-gray-200 bg-gray-50 hover:border-[#c9a84c]/50'}`}
            >
              <div className="flex items-start gap-2.5">
                <div className={`flex-shrink-0 mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${wantsAttorneyReview ? 'bg-[#c9a84c] border-[#c9a84c]' : 'border-gray-300 bg-white'}`}>
                  {wantsAttorneyReview && <CheckCircle2 size={10} className="text-white" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <Scale size={11} className="text-[#c9a84c] flex-shrink-0" />
                    <span className="text-xs font-bold text-gray-800">{tr('attorneyReviewTitle', lang)} <span className="text-[#c9a84c]">+$9.99</span></span>
                  </div>
                  <p className="text-[10px] text-gray-500 leading-relaxed">{tr('attorneyReviewCheckbox', lang)}</p>
                </div>
              </div>
            </div>
            {piError && <p className="text-xs text-red-600 mb-2 flex items-center gap-1"><AlertCircle size={11} />{piError}</p>}
            <button type="button" onClick={handleProceedToPayment} disabled={piLoading}
              className="w-full flex items-center justify-center gap-2 bg-[#c9a84c] hover:bg-[#b8963e] disabled:opacity-60 text-white font-bold px-4 py-3 rounded-xl transition-colors text-sm">
              {piLoading ? <Loader2 size={14} className="animate-spin" /> : <Lock size={14} />}
              {finalAmount === 0 ? tr('confirmFree', lang) : `${tr('proceedPayment', lang)} — USD $${finalAmount.toFixed(2)}`}
            </button>
            <button type="button" onClick={() => setPurchaseStep('email')}
              className="w-full text-xs text-gray-400 hover:text-gray-600 underline mt-2">{tr('back', lang)}</button>
          </div>
        )}

        {/* Step 3: Payment — either free confirmation or Stripe */}
        {!paid && purchaseStep === 'payment' && (isFreeOrder || (clientSecret && stripePromise)) && (
          <div className="px-4 py-4 bg-white">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-full bg-[#1a2e1a] text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">3</div>
              <p className="text-sm font-bold text-gray-800">
                {isFreeOrder ? tr('freeOrder', lang) : `Secure Payment — USD $${finalAmount.toFixed(2)}`}
              </p>
            </div>
            {isFreeOrder ? (
              <div className="space-y-4">
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
                  <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-emerald-800 font-medium">
                    {tr('freeOrderMsg', lang)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleConfirmFreeOrder}
                  disabled={freeConfirming}
                  className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl text-sm transition-colors shadow-md"
                >
                  <CheckCircle2 size={14} />
                  {freeConfirming ? tr('processing', lang) : tr('confirmFree', lang)}
                </button>
                <button type="button" onClick={() => setPurchaseStep('coupon')} className="w-full text-xs text-gray-400 hover:text-gray-600 underline">
                  {tr('back', lang)}
                </button>
              </div>
            ) : (
              <Elements stripe={stripePromise!} options={{ clientSecret, appearance: { theme: 'stripe' } }}>
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
            )}
          </div>
        )}
      </div>}

      {/* ── Step 5 — File Your Trademark (shown in TrademarkCheckPage only) ── */}
      {showFilingCta && (
        <div className="border-t-2 border-emerald-200 bg-emerald-50 px-4 py-4 print:hidden">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0 text-white font-bold text-sm shadow-sm flex-none">
              5
            </div>
            <div>
              <p className="text-sm font-bold text-emerald-900 leading-tight">
                {lang === 'es' ? 'Registra tu Marca' :
                 lang === 'zh' ? '提交商标申请' :
                 lang === 'de' ? 'Marke Anmelden' :
                 lang === 'fr' ? 'Déposer la Marque' :
                 lang === 'hi' ? 'ट्रेडमार्क दर्ज करें' :
                 lang === 'pt' ? 'Registrar a Marca' :
                 'File Your Trademark'}
              </p>
              <p className="text-xs text-emerald-700 mt-0.5">
                {lang === 'es' ? '100% en línea · USD$299 por clase · Revisado por expertos' :
                 lang === 'zh' ? '100%在线 · 每类USD$299 · 专家审核' :
                 lang === 'de' ? '100% online · USD$299 pro Klasse · Expertengeprüft' :
                 lang === 'fr' ? '100% en ligne · USD$299 par classe · Révisé par des experts' :
                 lang === 'hi' ? '100% ऑनलाइन · प्रति वर्ग USD$299 · विशेषज्ञ समीक्षित' :
                 lang === 'pt' ? '100% online · USD$299 por classe · Revisado por especialistas' :
                 '100% online · USD$299 per class · Expert-reviewed'}
              </p>
            </div>
          </div>
          {onStartFiling ? (
            <button
              type="button"
              onClick={onStartFiling}
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors shadow-md text-sm animate-pulse hover:animate-none ring-2 ring-emerald-400 ring-offset-2"
            >
              <FileText size={14} />
              {lang === 'es' ? 'Iniciar Registro de Marca' :
               lang === 'zh' ? '开始商标注册' :
               lang === 'de' ? 'Markenanmeldung starten' :
               lang === 'fr' ? 'Déposer ma marque' :
               lang === 'hi' ? 'अभी आवेदन करें' :
               lang === 'pt' ? 'Iniciar Registro de Marca' :
               'Start Trademark Filing'}
              <ArrowRight size={14} />
            </button>
          ) : (
            <a
              href={`/apply?mark=${encodeURIComponent(markName)}`}
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors shadow-md text-sm animate-pulse hover:animate-none ring-2 ring-emerald-400 ring-offset-2"
            >
              <FileText size={14} />
              {lang === 'es' ? 'Iniciar Registro de Marca' :
               lang === 'zh' ? '开始商标注册' :
               lang === 'de' ? 'Markenanmeldung starten' :
               lang === 'fr' ? 'Déposer ma marque' :
               lang === 'hi' ? 'अभी आवेदन करें' :
               lang === 'pt' ? 'Iniciar Registro de Marca' :
               'Start Trademark Filing'}
              <ArrowRight size={14} />
            </a>
          )}
        </div>
      )}

      {/* ── Disclaimer ─────────────────────────────────────────────────────── */}
      <div className="border-t border-gray-100 bg-white/40 px-4 py-2 flex items-start gap-1.5">
        <Info size={11} className="text-gray-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-gray-400 leading-relaxed">{result.disclaimer}</p>
      </div>

      {/* ── PDF Report Modal ────────────────────────────────────────────────── */}
      {showPdfModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 print:hidden" onClick={() => setShowPdfModal(false)}>
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 z-10" onClick={e => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setShowPdfModal(false)}
              className="absolute top-3 right-3 w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors"
            >
              <X size={14} />
            </button>

            {!pdfModalDone ? (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[#1a2e1a]/10 flex items-center justify-center flex-shrink-0">
                    <FileText size={18} className="text-[#1a2e1a]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">{tr('pdfModalTitle', lang)}</h3>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mb-4 leading-relaxed">{tr('pdfModalDesc', lang)}</p>
                <input
                  type="email"
                  value={pdfModalEmail}
                  onChange={e => setPdfModalEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleRequestPdfReport()}
                  placeholder="you@example.com"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-[#c9a84c] focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={handleRequestPdfReport}
                  disabled={!pdfModalEmail.trim()}
                  className="w-full flex items-center justify-center gap-2 bg-[#1a2e1a] hover:bg-[#2d4a2d] disabled:opacity-50 text-white font-bold py-3 rounded-xl text-sm transition-colors"
                >
                  <Download size={14} />{tr('getPdfReport', lang)}
                </button>
                <p className="text-[10px] text-gray-400 text-center mt-2">{tr('pdfModalCloseSafe', lang)}</p>
              </>
            ) : (
              <div className="text-center">
                <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 size={28} className="text-emerald-600" />
                </div>
                <h3 className="text-sm font-bold text-gray-900 mb-1">{tr('pdfSent', lang)}</h3>
                <p className="text-xs text-gray-500 mb-4">{pdfModalEmail}</p>
                {pdfModalUrl ? (
                  <a
                    href={pdfModalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-[#1a2e1a] hover:bg-[#2d4a2d] text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors mb-3"
                  >
                    <Download size={13} />{tr('downloadPdfNow', lang)}
                  </a>
                ) : (
                  <p className="text-xs text-gray-400 flex items-center justify-center gap-1.5 mb-3">
                    <Loader2 size={11} className="animate-spin" />{tr('pdfGenerating', lang)}
                  </p>
                )}
                <p className="text-[10px] text-gray-400">{tr('pdfModalCloseSafe', lang)}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Risk acknowledgment (when caller provides handler and risk is medium/high) ── */}
      {onSelectDespiteRisk && (result.risk === 'medium' || result.risk === 'high') && (
        <div className={`border-t-2 ${riskAcknowledged ? 'border-amber-300 bg-amber-50' : 'border-amber-400 bg-amber-50'} px-4 py-4`}>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={15} className="text-amber-600 flex-shrink-0" />
            <span className="text-sm font-bold text-amber-800">{tr('riskAckTitle', lang)}</span>
          </div>
          <label className="flex items-start gap-3 cursor-pointer group">
            <div className="relative flex-shrink-0 mt-0.5">
              <input
                type="checkbox"
                checked={riskAcknowledged}
                onChange={e => {
                  const checked = e.target.checked;
                  setRiskAcknowledged(checked);
                  onRiskAcknowledgedChange?.(checked);
                  if (checked) onSelectDespiteRisk(markName);
                }}
                className="sr-only"
              />
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                riskAcknowledged
                  ? 'bg-amber-500 border-amber-500'
                  : 'bg-white border-amber-400 group-hover:border-amber-500'
              }`}>
                {riskAcknowledged && (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
            </div>
            <span className={`text-xs leading-relaxed transition-colors ${riskAcknowledged ? 'text-amber-800' : 'text-amber-700 group-hover:text-amber-900'}`}>
              {tr('riskAckCheckbox', lang)}
            </span>
          </label>
          {!riskAcknowledged && (
            <p className="mt-2 text-xs font-semibold text-amber-600 flex items-center gap-1.5">
              <AlertCircle size={12} className="flex-shrink-0" />
              {tr('riskAckWarning', lang)}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
