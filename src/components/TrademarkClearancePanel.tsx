import { useState, useEffect, useRef } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import {
  Shield, Loader2, ChevronDown, ChevronUp, ExternalLink,
  AlertTriangle, CheckCircle2, AlertCircle, Info, Globe,
  Scale, ArrowRight, TrendingUp, FileSearch, Minus, Lock,
  FileText, Mail, Tag, Download, Sparkles, Eye,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface MarciaFinding { name: string; status: string; classNum: string; holder: string; }
interface DomainResult { domain: string; available: boolean | null; status: 'available' | 'taken' | 'unknown'; }
export interface RegistrabilityFlag { category: string; severity: 'low' | 'medium' | 'high'; explanation: string; }
export interface DupontFactor { factor: string; verdict: 'favors_registration' | 'neutral' | 'against_registration'; reasoning: string; }
export interface DistinctivenessAssessment { tier: 'generic' | 'descriptive' | 'suggestive' | 'arbitrary' | 'fanciful'; score: number; explanation: string; }

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
  low: { label: { en: 'Low Risk', es: 'Riesgo Bajo', zh: '低风险', de: 'Niedriges Risiko', fr: 'Risque faible', hi: 'कम जोखिम', pt: 'Baixo Risco' }, icon: CheckCircle2, bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-700', bar: 'bg-emerald-500', summaryBg: 'bg-emerald-50/60', summaryBorder: 'border-l-emerald-400' },
  medium: { label: { en: 'Medium Risk', es: 'Riesgo Medio', zh: '中等风险', de: 'Mittleres Risiko', fr: 'Risque modéré', hi: 'मध्यम जोखिम', pt: 'Risco Médio' }, icon: AlertTriangle, bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-700', bar: 'bg-amber-500', summaryBg: 'bg-amber-50/60', summaryBorder: 'border-l-amber-400' },
  high: { label: { en: 'High Risk', es: 'Riesgo Alto', zh: '高风险', de: 'Hohes Risiko', fr: 'Risque élevé', hi: 'उच्च जोखिम', pt: 'Alto Risco' }, icon: AlertCircle, bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', badge: 'bg-red-100 text-red-700', bar: 'bg-red-500', summaryBg: 'bg-red-50/60', summaryBorder: 'border-l-red-400' },
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

type Lang = 'en' | 'zh' | 'es' | 'de' | 'fr' | 'hi' | 'pt';

const UI: Record<string, Record<Lang, string>> = {
  // Executive summary
  clearanceAnalysis: { en: 'Clearance Analysis', es: 'Análisis de Disponibilidad', zh: '检索分析', de: 'Rechercheanalyse', fr: 'Analyse de disponibilité', hi: 'क्लीयरेंस विश्लेषण', pt: 'Análise de Disponibilidade' },
  riskSummaryTitle: { en: 'Risk Summary', es: 'Resumen de Riesgo', zh: '风险摘要', de: 'Risikozusammenfassung', fr: 'Résumé des risques', hi: 'जोखिम सारांश', pt: 'Resumo de Risco' },
  rerun: { en: 'Re-run', es: 'Repetir', zh: '重新检索', de: 'Erneut ausführen', fr: 'Relancer', hi: 'पुनः चलाएं', pt: 'Repetir' },
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
  ctaDesc: { en: 'Professional PDF report with all 13 DuPont factors, full LFPPI registrability analysis, complete MARCia results, and domain availability — timestamped and ready to share.', es: 'Reporte PDF profesional con los 13 factores DuPont, análisis completo de registrabilidad LFPPI, resultados completos de MARCia y disponibilidad de dominios — con sello de tiempo y listo para compartir.', zh: '专业PDF报告，包含全部13个杜邦因素、完整LFPPI可注册性分析、完整MARCia结果和域名可用性——带时间戳，可直接分享。', de: 'Professioneller PDF-Bericht mit allen 13 DuPont-Faktoren, vollständiger LFPPI-Registrierbarkeitsanalyse, vollständigen MARCia-Ergebnissen und Domainverfügbarkeit — zeitgestempelt.', fr: "Rapport PDF professionnel avec les 13 facteurs DuPont, l'analyse complète de registrabilité LFPPI, les résultats MARCia complets et la disponibilité des domaines — horodaté.", hi: 'सभी 13 DuPont कारकों, पूर्ण LFPPI पंजीकरण योग्यता विश्लेषण, पूर्ण MARCia परिणाम और डोमेन उपलब्धता के साथ पेशेवर PDF रिपोर्ट — टाइमस्टैम्प सहित।', pt: 'Relatório PDF profissional com todos os 13 fatores DuPont, análise completa de registrabilidade LFPPI, resultados completos do MARCia e disponibilidade de domínios — com carimbo de data.' },
  ctaPrice: { en: 'Full Report — USD $4.99', es: 'Reporte Completo — USD $4.99', zh: '完整报告 — USD $4.99', de: 'Vollständiger Bericht — USD $4.99', fr: 'Rapport complet — USD $4.99', hi: 'पूर्ण रिपोर्ट — USD $4.99', pt: 'Relatório Completo — USD $4.99' },
  ctaItems: { en: '13 DuPont likelihood-of-confusion factors · Full LFPPI analysis · All IMPI MARCia results · All domain TLDs · Web presence findings · Professional PDF with timestamp', es: '13 factores DuPont · Análisis LFPPI completo · Todos los resultados MARCia · Todos los dominios · Hallazgos web · PDF profesional con sello de tiempo', zh: '13个杜邦因素 · 完整LFPPI分析 · 全部MARCia结果 · 全部域名 · 网络检索 · 带时间戳的专业PDF', de: '13 DuPont-Faktoren · Vollständige LFPPI-Analyse · Alle MARCia-Ergebnisse · Alle Domains · Web-Recherche · PDF mit Zeitstempel', fr: '13 facteurs DuPont · Analyse LFPPI complète · Tous les résultats MARCia · Tous les domaines · Recherche web · PDF professionnel horodaté', hi: '13 DuPont कारक · पूर्ण LFPPI विश्लेषण · सभी MARCia परिणाम · सभी डोमेन · वेब खोज · टाइमस्टैम्प PDF', pt: '13 fatores DuPont · Análise LFPPI completa · Todos os resultados MARCia · Todos os domínios · Pesquisa web · PDF profissional com carimbo' },
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
  couponPlaceholder: { en: 'e.g. AYRTON', es: 'ej. AYRTON', zh: '例如 AYRTON', de: 'z.B. AYRTON', fr: 'ex. AYRTON', hi: 'उदा. AYRTON', pt: 'ex. AYRTON' },
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
  onSuccess: () => void;
  onBack: () => void;
}

function InlineCheckout({ lang, finalAmount, clientSecret, paymentIntentId, reportOrderId, onSuccess, onBack }: CheckoutProps) {
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
        body: JSON.stringify({ paymentIntentId, reportOrderId }),
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

// ─── Locked teaser row ────────────────────────────────────────────────────────

function LockedRow({ label, lang }: { label: string; lang: Lang }) {
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

// ─── Main component ───────────────────────────────────────────────────────────

export default function TrademarkClearancePanel({
  markName, goodsServices = '', classes, language, autoRun = true, onResult, onSelectDespiteRisk,
}: Props) {
  const lang = (language in (UI.clearanceAnalysis)) ? language : 'en' as Lang;

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
    return (
      <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-5 flex flex-col items-center gap-3">
        <Loader2 size={22} className="text-[#1a2e1a] animate-spin" />
        <div className="text-center">
          <p className="text-xs font-medium text-gray-700">Running full clearance analysis…</p>
          <p className="text-xs text-gray-400 mt-0.5">IMPI MARCia · DuPont factors · Distinctiveness · Web · Domains</p>
        </div>
      </div>
    );
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
        body: JSON.stringify({ code: couponInput.trim().toUpperCase() }),
      });
      const d = await res.json();
      if (!res.ok || d.error) { setCouponError(tr('invalidCoupon', lang)); return; }
      const pct: number = d.discount_percent ?? 0;
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
        <button type="button" onClick={() => { runningRef.current = false; runCheck(); }}
          className={`flex-shrink-0 text-xs ${cfg.text} opacity-60 hover:opacity-100 font-medium underline`}>
          {tr('rerun', lang)}
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

          {/* Distinctiveness teaser */}
          {result.distinctiveness && (
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <TrendingUp size={11} className="text-[#1a2e1a]" />
                <span className="text-[10px] font-semibold text-gray-600">{tr('distinctivenessTitle', lang)}</span>
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
                <Lock size={8} />
                <span className="blur-[3px] select-none">{result.distinctiveness.explanation?.slice(0, 60) ?? 'Full explanation available in report'}...</span>
              </p>
            </div>
          )}

          {/* DuPont teaser */}
          {dupont.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Scale size={11} className="text-[#1a2e1a]" />
                <span className="text-[10px] font-semibold text-gray-600">{tr('dupontTitle', lang)}</span>
                <Lock size={9} className="text-gray-300 ml-auto" />
              </div>
              {dupont.slice(0, 2).map((f, i) => (
                <div key={i} className="rounded-lg border border-gray-100 bg-white px-2.5 py-1.5 mb-1 flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${f.verdict === 'favors_registration' ? 'bg-emerald-400' : f.verdict === 'against_registration' ? 'bg-red-400' : 'bg-gray-300'}`} />
                  <span className="text-[10px] font-semibold text-gray-600 flex-1 min-w-0">{DUPONT_LABELS[f.factor] ?? f.factor}</span>
                  <span className="text-[9px] text-gray-300 blur-[2px] flex-shrink-0">reasoning locked</span>
                </div>
              ))}
              <LockedRow label={tr('andMore', lang).replace('{n}', String(dupont.length - 2))} lang={lang} />
            </div>
          )}

          {/* LFPPI teaser */}
          {regFlags.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Scale size={11} className="text-[#1a2e1a]" />
                <span className="text-[10px] font-semibold text-gray-600">{tr('lfppiTitle', lang)}</span>
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
              {regFlags.length > 1 && <LockedRow label={tr('andMore', lang).replace('{n}', String(regFlags.length - 1))} lang={lang} />}
            </div>
          )}

          {/* MARCia teaser — show top 1, blur rest */}
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
                {totalMarcia > 1 && <LockedRow label={tr('andMore', lang).replace('{n}', String(totalMarcia - 1))} lang={lang} />}
              </>
            )}
          </div>

          {/* Domain teaser — show .com and .com.mx, lock rest */}
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <Globe size={11} className="text-[#1a2e1a]" />
              <span className="text-[10px] font-semibold text-gray-600">{tr('domainsTitle', lang)}</span>
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
              <p className="text-[9px] text-gray-300 flex items-center gap-0.5 py-0.5">
                <Lock size={8} />{tr('andMore', lang).replace('{n}', String(domainResults.length - 2 > 0 ? domainResults.length - 2 : 11))}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── POST-PAYMENT: Full detail sections ─────────────────────────────── */}
      {paid && (
        <div className="border-t border-gray-100 bg-white/50">

          {/* Distinctiveness full */}
          {result.distinctiveness && (
            <div className="border-b border-gray-100 px-4 py-3">
              <div className="flex items-center gap-1.5 mb-2">
                <TrendingUp size={12} className="text-[#1a2e1a]" />
                <span className="text-xs font-semibold text-gray-700">{tr('distinctivenessTitle', lang)}</span>
              </div>
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

          {/* DuPont full */}
          {dupont.length > 0 && (
            <div className="border-b border-gray-100">
              <button type="button" onClick={() => setDupontExpanded(v => !v)}
                className="w-full flex items-center justify-between px-4 py-2 text-xs font-medium text-gray-600 hover:bg-white/80 transition-colors">
                <span className="flex items-center gap-1.5">
                  <Scale size={12} className="text-[#1a2e1a]" />
                  {tr('dupontTitle', lang)}
                  <span className="text-[10px] text-gray-400 font-normal">— {dupontFavor} {tr('favoring', lang)}, {dupontNeutral} {tr('neutral', lang)}, {dupontAgainst} {tr('against', lang)}</span>
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
                    <Info size={9} className="flex-shrink-0" />Based on In re E.I. DuPont DeNemours & Co. (1973), applied to Mexican trademark law.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* LFPPI full */}
          <div className="border-b border-gray-100">
            <button type="button" onClick={() => setLfppiExpanded(v => !v)}
              className="w-full flex items-center justify-between px-4 py-2 text-xs font-medium text-gray-600 hover:bg-white/80 transition-colors">
              <span className="flex items-center gap-1.5">
                <Scale size={12} className="text-[#1a2e1a]" />
                {tr('lfppiTitle', lang)}
                {regFlags.length === 0 ? <span className="text-[10px] text-emerald-600 font-medium">— {tr('noIssues', lang)}</span> : <span className="text-[10px] text-red-600 font-medium">— {regFlags.length} {regFlags.length === 1 ? tr('issueDetected', lang) : tr('issuesDetected', lang)}</span>}
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

          {/* MARCia full */}
          <div className="border-b border-gray-100">
            <button type="button" onClick={() => setMarciaExpanded(v => !v)}
              className="w-full flex items-center justify-between px-4 py-2 text-xs font-medium text-gray-600 hover:bg-white/80 transition-colors">
              <span>{tr('marciaTitle', lang)} ({totalMarcia} {tr('matches', lang)})</span>
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

          {/* Web findings */}
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

          {/* All domains */}
          {domainResults.length > 0 && (
            <div className="border-b border-gray-100">
              <button type="button" onClick={() => setDomainExpanded(v => !v)}
                className="w-full flex items-center justify-between px-4 py-2 text-xs font-medium text-gray-600 hover:bg-white/80 transition-colors">
                <span className="flex items-center gap-1.5"><Globe size={12} className="text-blue-500" />{tr('domainsTitle', lang)}</span>
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
                <p className="text-sm font-bold text-white leading-tight">{tr('ctaTitle', lang)}</p>
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
