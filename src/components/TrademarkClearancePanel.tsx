import { useState, useEffect, useRef } from 'react';
import {
  Shield, Loader2, ChevronDown, ChevronUp, ExternalLink,
  AlertTriangle, CheckCircle2, AlertCircle, Info, Globe,
  Scale, ArrowRight, TrendingUp, FileSearch, Minus,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface MarciaFinding {
  name: string;
  status: string;
  classNum: string;
  holder: string;
}

interface DomainResult {
  domain: string;
  available: boolean | null;
  status: 'available' | 'taken' | 'unknown';
}

export interface RegistrabilityFlag {
  category: string;
  severity: 'low' | 'medium' | 'high';
  explanation: string;
}

export interface DupontFactor {
  factor: string;
  verdict: 'favors_registration' | 'neutral' | 'against_registration';
  reasoning: string;
}

export interface DistinctivenessAssessment {
  tier: 'generic' | 'descriptive' | 'suggestive' | 'arbitrary' | 'fanciful';
  score: number;
  explanation: string;
}

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

interface Props {
  markName: string;
  goodsServices?: string;
  classes: number[];
  language: 'en' | 'zh' | 'es' | 'de' | 'fr' | 'hi' | 'pt';
  autoRun?: boolean;
  onResult?: (result: ClearanceResult) => void;
  onSelectDespiteRisk?: (markName: string) => void;
}

export type { ClearanceResult };

// ─── Constants ───────────────────────────────────────────────────────────────

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const riskConfig = {
  low: {
    label: { en: 'Low Risk', zh: '低风险', es: 'Riesgo Bajo', de: 'Niedriges Risiko', fr: 'Risque faible', hi: 'कम जोखिम', pt: 'Baixo Risco' },
    desc: { en: 'No obvious conflicts found', zh: '未发现明显冲突', es: 'Sin conflictos evidentes', de: 'Keine offensichtlichen Konflikte gefunden', fr: 'Aucun conflit évident trouvé', hi: 'कोई स्पष्ट विरोध नहीं मिला', pt: 'Nenhum conflito evidente encontrado' },
    icon: CheckCircle2,
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-700',
    badge: 'bg-emerald-100 text-emerald-700',
    summaryBorder: 'border-l-emerald-400',
    summaryBg: 'bg-emerald-50/60',
  },
  medium: {
    label: { en: 'Medium Risk', zh: '中等风险', es: 'Riesgo Medio', de: 'Mittleres Risiko', fr: 'Risque modéré', hi: 'मध्यम जोखिम', pt: 'Risco Médio' },
    desc: { en: 'Some similar marks found — review recommended', zh: '发现一些相似商标，建议进一步审查', es: 'Se encontraron marcas similares — se recomienda revisión', de: 'Ähnliche Marken gefunden — Überprüfung empfohlen', fr: 'Marques similaires trouvées — révision recommandée', hi: 'कुछ समान ट्रेडमार्क मिले — समीक्षा की सलाह है', pt: 'Marcas similares encontradas — revisão recomendada' },
    icon: AlertTriangle,
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-700',
    badge: 'bg-amber-100 text-amber-700',
    summaryBorder: 'border-l-amber-400',
    summaryBg: 'bg-amber-50/60',
  },
  high: {
    label: { en: 'High Risk', zh: '高风险', es: 'Riesgo Alto', de: 'Hohes Risiko', fr: 'Risque élevé', hi: 'उच्च जोखिम', pt: 'Alto Risco' },
    desc: { en: 'Potential conflict detected — legal review advised', zh: '检测到潜在冲突，建议法律审查', es: 'Conflicto potencial detectado — se recomienda revisión legal', de: 'Potenzieller Konflikt erkannt — rechtliche Prüfung empfohlen', fr: 'Conflit potentiel détecté — révision juridique conseillée', hi: 'संभावित विरोध पाया गया — कानूनी समीक्षा की सलाह है', pt: 'Conflito potencial detectado — revisão jurídica aconselhada' },
    icon: AlertCircle,
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-700',
    badge: 'bg-red-100 text-red-700',
    summaryBorder: 'border-l-red-400',
    summaryBg: 'bg-red-50/60',
  },
};

const CATEGORY_LABELS: Record<string, Record<string, string>> = {
  generic_descriptive: { en: 'Generic or Descriptive', zh: '通用或描述性词汇', es: 'Genérico o Descriptivo', de: 'Generisch oder Beschreibend', fr: 'Générique ou Descriptif', hi: 'सामान्य या वर्णनात्मक', pt: 'Genérico ou Descritivo' },
  functional_shape: { en: 'Functional Shape', zh: '功能性形状', es: 'Forma Funcional', de: 'Funktionelle Form', fr: 'Forme Fonctionnelle', hi: 'कार्यात्मक आकार', pt: 'Forma Funcional' },
  deceptive: { en: 'Deceptive or Misleading', zh: '欺骗性或误导性', es: 'Engañoso o Equívoco', de: 'Täuschend oder Irreführend', fr: 'Trompeur ou Induit en Erreur', hi: 'भ्रामक या गुमराह करने वाला', pt: 'Enganoso ou Ilusório' },
  official_emblems: { en: 'Official Emblems / Flags', zh: '官方徽章/国旗', es: 'Emblemas Oficiales / Banderas', de: 'Offizielle Embleme / Flaggen', fr: 'Emblèmes Officiels / Drapeaux', hi: 'आधिकारिक प्रतीक/ध्वज', pt: 'Emblemas Oficiais / Bandeiras' },
  personal_identity: { en: 'Personal Identity Without Consent', zh: '未经许可的个人身份', es: 'Identidad Personal Sin Consentimiento', de: 'Persönliche Identität Ohne Einwilligung', fr: 'Identité Personnelle Sans Consentement', hi: 'बिना अनुमति व्यक्तिगत पहचान', pt: 'Identidade Pessoal Sem Consentimento' },
  confusingly_similar: { en: 'Confusingly Similar to Existing Mark', zh: '与现有商标混淆相似', es: 'Confusamente Similar a Marca Existente', de: 'Verwechslungsgefahr mit Bestehender Marke', fr: 'Similaire à une Marque Existante', hi: 'मौजूदा ट्रेडमार्क से भ्रामक रूप से समान', pt: 'Confusamente Similar a Marca Existente' },
  famous_mark: { en: 'Famous or Notorious Mark', zh: '知名或著名商标', es: 'Marca Famosa o Notoriamente Conocida', de: 'Bekannte oder Berühmte Marke', fr: 'Marque Célèbre ou Notoirement Connue', hi: 'प्रसिद्ध या विख्यात ट्रेडमार्क', pt: 'Marca Famosa ou Notoriamente Conhecida' },
  protected_characters: { en: 'Protected Characters / Titles', zh: '受保护的角色/标题', es: 'Personajes / Títulos Protegidos', de: 'Geschützte Figuren / Titel', fr: 'Personnages / Titres Protégés', hi: 'संरक्षित पात्र/शीर्षक', pt: 'Personagens / Títulos Protegidos' },
  geographic_indication: { en: 'Protected Geographic Indication', zh: '受保护的地理标志', es: 'Indicación Geográfica Protegida', de: 'Geschützte Geografische Angabe', fr: 'Indication Géographique Protégée', hi: 'संरक्षित भौगोलिक संकेत', pt: 'Indicação Geográfica Protegida' },
  immoral_offensive: { en: 'Contrary to Public Order / Morality', zh: '违反公共秩序/道德', es: 'Contrario al Orden Público / Moral', de: 'Gegen Öffentliche Ordnung / Moral', fr: "Contraire à l'Ordre Public / Moralité", hi: 'सार्वजनिक व्यवस्था/नैतिकता के विरुद्ध', pt: 'Contrário à Ordem Pública / Moralidade' },
  isolated_color: { en: 'Isolated Color (Not Distinctive)', zh: '单一颜色（缺乏显著性）', es: 'Color Aislado (No Distintivo)', de: 'Einzelfarbe (Nicht Unterscheidungskräftig)', fr: 'Couleur Isolée (Non Distinctive)', hi: 'अकेला रंग (विशिष्ट नहीं)', pt: 'Cor Isolada (Não Distintiva)' },
  non_distinctive_nontrad: { en: 'Non-Distinctive Non-Traditional Mark', zh: '缺乏显著性的非传统标志', es: 'Marca No Tradicional Sin Distintividad', de: 'Nicht Unterscheidungskräftiges Nicht-Traditionelles Zeichen', fr: 'Marque Non Traditionnelle Non Distinctive', hi: 'गैर-विशिष्ट अपारंपरिक चिह्न', pt: 'Marca Não Tradicional Sem Distintividade' },
  bad_faith: { en: 'Bad Faith Filing', zh: '恶意申请', es: 'Solicitud de Mala Fe', de: 'Bösgläubige Anmeldung', fr: 'Dépôt de Mauvaise Foi', hi: 'बुरे इरादे से दाखिल', pt: 'Depósito de Má-fé' },
};

const DUPONT_LABELS: Record<string, Record<string, string>> = {
  similarity_of_marks: { en: 'Similarity of Marks', zh: '商标相似性', es: 'Similitud de Marcas', de: 'Ähnlichkeit der Marken', fr: 'Similitude des marques', hi: 'चिह्नों की समानता', pt: 'Similaridade das Marcas' },
  relatedness_of_goods: { en: 'Relatedness of Goods/Services', zh: '商品/服务关联性', es: 'Relación de Productos/Servicios', de: 'Verwandtschaft der Waren/Dienstl.', fr: 'Proximité des produits/services', hi: 'माल/सेवाओं की संबद्धता', pt: 'Relação dos Produtos/Serviços' },
  channels_of_trade: { en: 'Channels of Trade', zh: '贸易渠道', es: 'Canales de Distribución', de: 'Vertriebskanäle', fr: 'Circuits de distribution', hi: 'व्यापार के चैनल', pt: 'Canais de Distribuição' },
  purchasing_conditions: { en: 'Purchaser Sophistication', zh: '购买者专业程度', es: 'Sofisticación del Comprador', de: 'Käufersophistikation', fr: 'Sophistication des acheteurs', hi: 'क्रेता की समझदारी', pt: 'Sofisticação do Comprador' },
  strength_of_cited_mark: { en: 'Strength of Cited Mark', zh: '引证商标的强度', es: 'Fuerza de la Marca Citada', de: 'Stärke der zitierten Marke', fr: 'Force de la marque citée', hi: 'उद्धृत चिह्न की ताकत', pt: 'Força da Marca Citada' },
  actual_confusion: { en: 'Actual Confusion', zh: '实际混淆证据', es: 'Confusión Real', de: 'Tatsächliche Verwechslung', fr: 'Confusion effective', hi: 'वास्तविक भ्रम', pt: 'Confusão Real' },
  number_of_similar_marks: { en: 'Crowding of Similar Marks', zh: '相似商标数量', es: 'Saturación de Marcas Similares', de: 'Anzahl ähnlicher Marken', fr: 'Nombre de marques similaires', hi: 'समान चिह्नों की संख्या', pt: 'Número de Marcas Similares' },
  length_of_use: { en: 'Length of Use', zh: '使用时长', es: 'Duración de Uso', de: 'Nutzungsdauer', fr: "Durée d'utilisation", hi: 'उपयोग की अवधि', pt: 'Duração de Uso' },
  variety_of_goods: { en: 'Variety of Goods Covered', zh: '涵盖商品的多样性', es: 'Variedad de Productos Cubiertos', de: 'Warenvielfalt', fr: 'Variété des produits couverts', hi: 'शामिल माल की विविधता', pt: 'Variedade de Produtos Cobertos' },
  market_interface: { en: 'Market Interface / Consent', zh: '市场界面/同意', es: 'Interfaz de Mercado / Consentimiento', de: 'Marktschnittstelle / Zustimmung', fr: 'Interface de marché / Consentement', hi: 'बाजार इंटरफ़ेस / सहमति', pt: 'Interface de Mercado / Consentimento' },
  right_to_exclude: { en: 'Right to Exclude Others', zh: '排他权利', es: 'Derecho de Exclusión', de: 'Ausschlussrecht', fr: "Droit d'exclusion", hi: 'अन्य को बाहर करने का अधिकार', pt: 'Direito de Exclusão' },
  extent_of_confusion: { en: 'Extent of Potential Confusion', zh: '潜在混淆程度', es: 'Alcance de la Confusión Potencial', de: 'Ausmaß potenzieller Verwechslung', fr: 'Étendue de la confusion potentielle', hi: 'संभावित भ्रम की सीमा', pt: 'Extensão da Confusão Potencial' },
  other_factors: { en: 'Other Relevant Factors', zh: '其他相关因素', es: 'Otros Factores Relevantes', de: 'Weitere relevante Faktoren', fr: 'Autres facteurs pertinents', hi: 'अन्य प्रासंगिक कारक', pt: 'Outros Fatores Relevantes' },
};

const DISTINCTIVENESS_LABELS: Record<string, Record<string, string>> = {
  generic: { en: 'Generic', zh: '通用', es: 'Genérico', de: 'Generisch', fr: 'Générique', hi: 'सामान्य', pt: 'Genérico' },
  descriptive: { en: 'Descriptive', zh: '描述性', es: 'Descriptivo', de: 'Beschreibend', fr: 'Descriptif', hi: 'वर्णनात्मक', pt: 'Descritivo' },
  suggestive: { en: 'Suggestive', zh: '暗示性', es: 'Sugestivo', de: 'Andeutend', fr: 'Suggestif', hi: 'सुझावात्मक', pt: 'Sugestivo' },
  arbitrary: { en: 'Arbitrary', zh: '任意性', es: 'Arbitrario', de: 'Willkürlich', fr: 'Arbitraire', hi: 'मनमाना', pt: 'Arbitrário' },
  fanciful: { en: 'Fanciful', zh: '创造性', es: 'Fantasioso', de: 'Fantasievoll', fr: 'Fantaisiste', hi: 'काल्पनिक', pt: 'Fantasioso' },
};

const TIER_ORDER: Array<'generic' | 'descriptive' | 'suggestive' | 'arbitrary' | 'fanciful'> = [
  'generic', 'descriptive', 'suggestive', 'arbitrary', 'fanciful',
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function TrademarkClearancePanel({
  markName, goodsServices = '', classes, language, autoRun = true, onResult, onSelectDespiteRisk,
}: Props) {
  const [status, setStatus] = useState<'idle' | 'checking' | 'done' | 'error'>('idle');
  const [result, setResult] = useState<ClearanceResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [webExpanded, setWebExpanded] = useState(false);
  const [marciaExpanded, setMarciaExpanded] = useState(false);
  const [domainExpanded, setDomainExpanded] = useState(false);
  const [registrabilityExpanded, setRegistrabilityExpanded] = useState(true);
  const [dupontExpanded, setDupontExpanded] = useState(false);
  const [showSelectModal, setShowSelectModal] = useState(false);
  const runningRef = useRef(false);

  const lang = language as 'en' | 'zh' | 'es' | 'de' | 'fr' | 'hi' | 'pt';

  const t = (en: string, zh: string, es: string, de?: string, fr?: string, hi?: string, pt?: string) =>
    lang === 'zh' ? zh
    : lang === 'es' ? es
    : lang === 'de' ? (de ?? en)
    : lang === 'fr' ? (fr ?? en)
    : lang === 'hi' ? (hi ?? en)
    : lang === 'pt' ? (pt ?? en)
    : en;

  const runCheck = async () => {
    if (runningRef.current || !markName.trim()) return;
    runningRef.current = true;
    setStatus('checking');
    setResult(null);
    setErrorMsg('');

    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/verify-trademark`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ markName: markName.trim(), goodsServices, classes, language }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Check failed');
      const r = data as ClearanceResult;
      setResult(r);
      setStatus('done');
      onResult?.(r);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Check failed');
      setStatus('error');
    } finally {
      runningRef.current = false;
    }
  };

  useEffect(() => {
    if (autoRun && markName.trim()) {
      const timer = setTimeout(runCheck, 600);
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markName, goodsServices, classes.join(',')]);

  // ── Idle ─────────────────────────────────────────────────────────────────────
  if (status === 'idle') {
    return (
      <div className="mt-3 rounded-xl border border-gold-200 bg-gold-50 px-4 py-3 flex items-start gap-3">
        <Shield size={15} className="text-gold-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gold-700">
            {t('Trademark & Domain Check', '商标及域名检索', 'Verificación de Marca y Dominio', undefined, undefined, 'ट्रेडमार्क और डोमेन जांच', 'Verificação de Marca e Domínio')}
          </p>
          <p className="text-xs text-gold-600 mt-0.5">
            {t("We'll run a full DuPont analysis, distinctiveness assessment, and domain check.", '我们将进行完整的杜邦因素分析、显著性评估和域名检查。', 'Realizaremos un análisis DuPont completo, evaluación de distintividad y verificación de dominios.', undefined, undefined, 'हम पूर्ण DuPont विश्लेषण, विशिष्टता मूल्यांकन और डोमेन जांच करेंगे।', 'Realizaremos uma análise DuPont completa, avaliação de distintividade e verificação de domínios.')}
          </p>
        </div>
        <button type="button" onClick={runCheck} className="flex-shrink-0 text-xs font-semibold bg-gold-500 hover:bg-gold-600 text-white px-3 py-1.5 rounded-lg transition-colors">
          {t('Check Now', '立即检索', 'Verificar', undefined, undefined, 'अभी जांचें', 'Verificar Agora')}
        </button>
      </div>
    );
  }

  // ── Checking ─────────────────────────────────────────────────────────────────
  if (status === 'checking') {
    return (
      <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-5 flex flex-col items-center gap-3">
        <Loader2 size={22} className="text-[#2d5a2d] animate-spin" />
        <div className="text-center">
          <p className="text-xs font-medium text-gray-700">
            {t('Running full clearance analysis…', '正在运行完整检索分析…', 'Ejecutando análisis de disponibilidad completo…', undefined, undefined, 'पूर्ण क्लीयरेंस विश्लेषण चल रहा है…', 'Executando análise completa de disponibilidade…')}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {t('IMPI MARCia · DuPont factors · Distinctiveness · Web · Domains', 'IMPI MARCia · 杜邦因素 · 显著性 · 网络 · 域名', 'IMPI MARCia · Factores DuPont · Distintividad · Web · Dominios', undefined, undefined, 'IMPI MARCia · DuPont कारक · विशिष्टता · वेब · डोमेन', 'IMPI MARCia · Fatores DuPont · Distintividade · Web · Domínios')}
          </p>
        </div>
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────────
  if (status === 'error') {
    return (
      <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 flex items-start gap-3">
        <AlertCircle size={15} className="text-red-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-xs text-red-700">{errorMsg || t('Clearance check failed.', '检索失败。', 'La verificación falló.', undefined, undefined, 'क्लीयरेंस जांच विफल हुई।', 'A verificação falhou.')}</p>
        </div>
        <button type="button" onClick={() => { runningRef.current = false; runCheck(); }} className="flex-shrink-0 text-xs text-red-600 hover:text-red-800 font-medium underline">
          {t('Retry', '重试', 'Reintentar', undefined, undefined, 'पुनः प्रयास करें', 'Tentar Novamente')}
        </button>
      </div>
    );
  }

  if (!result) return null;

  const cfg = riskConfig[result.risk];
  const RiskIcon = cfg.icon;
  const domainResults = result.domainResults || [];
  const availableCount = domainResults.filter(d => d.status === 'available').length;
  const takenCount = domainResults.filter(d => d.status === 'taken').length;
  const regFlags = result.registrabilityFlags ?? [];
  const highFlags = regFlags.filter(f => f.severity === 'high');
  const mediumFlags = regFlags.filter(f => f.severity === 'medium');
  const lowFlags = regFlags.filter(f => f.severity === 'low');
  const dupont = result.dupont ?? [];
  const dupontFavor = dupont.filter(f => f.verdict === 'favors_registration').length;
  const dupontNeutral = dupont.filter(f => f.verdict === 'neutral').length;
  const dupontAgainst = dupont.filter(f => f.verdict === 'against_registration').length;
  const distinctiveness = result.distinctiveness;

  // Top conflicts: registered/active marks first, then exact name matches
  const topConflicts = [...result.marciaFindings]
    .sort((a, b) => {
      const aActive = /registrada|vigente|registered|active/i.test(a.status) ? 0 : 1;
      const bActive = /registrada|vigente|registered|active/i.test(b.status) ? 0 : 1;
      if (aActive !== bActive) return aActive - bActive;
      const aExact = a.name.toLowerCase() === markName.toLowerCase() ? 0 : 1;
      const bExact = b.name.toLowerCase() === markName.toLowerCase() ? 0 : 1;
      return aExact - bExact;
    })
    .slice(0, 3);

  return (
    <div className={`mt-3 rounded-xl border ${cfg.border} ${cfg.bg} overflow-hidden`}>

      {/* ── Risk header ──────────────────────────────────────────────────────── */}
      <div className="px-4 py-3 flex items-center gap-3">
        <RiskIcon size={16} className={`${cfg.text} flex-shrink-0`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs font-bold ${cfg.text}`}>
              {t('Clearance Analysis: ', '检索分析：', 'Análisis de Disponibilidad: ', undefined, undefined, 'क्लीयरेंस विश्लेषण: ', 'Análise de Disponibilidade: ')}
            </span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.badge}`}>
              {cfg.label[lang]}
            </span>
          </div>
          <p className={`text-xs mt-0.5 ${cfg.text} opacity-80`}>{cfg.desc[lang]}</p>
        </div>
        <button type="button" onClick={() => { runningRef.current = false; runCheck(); }} className={`flex-shrink-0 text-xs ${cfg.text} opacity-70 hover:opacity-100 font-medium underline`}>
          {t('Re-run', '重新检索', 'Repetir', undefined, undefined, 'पुनः चलाएं', 'Repetir')}
        </button>
      </div>

      {/* ── Risk Summary ─────────────────────────────────────────────────────── */}
      {result.riskSummary && (
        <div className={`border-t border-gray-100 ${cfg.summaryBg} px-4 py-3 border-l-4 ${cfg.summaryBorder}`}>
          <div className="flex items-center gap-1.5 mb-1.5">
            <FileSearch size={12} className={cfg.text} />
            <span className={`text-xs font-semibold ${cfg.text}`}>
              {t('Risk Summary', '风险摘要', 'Resumen de Riesgo', 'Risikozusammenfassung', 'Résumé des risques', 'जोखिम सारांश', 'Resumo de Risco')}
            </span>
          </div>
          <p className="text-xs text-gray-700 leading-relaxed">{result.riskSummary}</p>
          <p className="text-[10px] text-gray-400 mt-1.5 flex items-center gap-1">
            <Info size={9} className="flex-shrink-0" />
            {t('AI-generated summary — not legal advice.', 'AI生成摘要——非法律建议。', 'Resumen generado por IA — no constituye asesoría legal.', undefined, undefined, 'AI-निर्मित सारांश — कानूनी सलाह नहीं।', 'Resumo gerado por IA — não constitui assessoria jurídica.')}
          </p>
        </div>
      )}

      {/* ── Distinctiveness Assessment ───────────────────────────────────────── */}
      {distinctiveness && (
        <div className="border-t border-gray-100 bg-white/60 px-4 py-3">
          <div className="flex items-center gap-1.5 mb-2">
            <TrendingUp size={12} className="text-[#2d5a2d]" />
            <span className="text-xs font-semibold text-gray-700">
              {t('Distinctiveness Assessment', '显著性评估', 'Evaluación de Distintividad', 'Unterscheidungskraft-Bewertung', 'Évaluation de la distinctivité', 'विशिष्टता मूल्यांकन', 'Avaliação de Distintividade')}
            </span>
          </div>

          {/* Spectrum bar */}
          <div className="flex items-stretch gap-0 mb-2 rounded-lg overflow-hidden border border-gray-200">
            {TIER_ORDER.map((tier) => {
              const isActive = distinctiveness.tier === tier;
              const tierColors: Record<string, string> = {
                generic: isActive ? 'bg-red-500 text-white' : 'bg-red-50 text-red-400',
                descriptive: isActive ? 'bg-orange-500 text-white' : 'bg-orange-50 text-orange-400',
                suggestive: isActive ? 'bg-amber-500 text-white' : 'bg-amber-50 text-amber-400',
                arbitrary: isActive ? 'bg-emerald-500 text-white' : 'bg-emerald-50 text-emerald-400',
                fanciful: isActive ? 'bg-[#2d5a2d] text-white' : 'bg-[#2d5a2d]/5 text-[#2d5a2d]/40',
              };
              return (
                <div
                  key={tier}
                  className={`flex-1 text-center py-1.5 text-[10px] font-semibold ${tierColors[tier]} ${isActive ? 'ring-1 ring-inset ring-white/30' : ''}`}
                >
                  {DISTINCTIVENESS_LABELS[tier]?.[lang] ?? tier}
                </div>
              );
            })}
          </div>

          <p className="text-xs text-gray-600 leading-relaxed">{distinctiveness.explanation}</p>

          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  distinctiveness.score <= 1 ? 'bg-red-400' :
                  distinctiveness.score <= 2 ? 'bg-orange-400' :
                  distinctiveness.score <= 3 ? 'bg-amber-400' :
                  distinctiveness.score <= 4 ? 'bg-emerald-400' : 'bg-[#2d5a2d]'
                }`}
                style={{ width: `${(distinctiveness.score / 5) * 100}%` }}
              />
            </div>
            <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap">
              {distinctiveness.score}/5 {t('strength', '强度', 'fortaleza', 'Stärke', 'force', 'ताकत', 'força')}
            </span>
          </div>
        </div>
      )}

      {/* ── DuPont Factors ───────────────────────────────────────────────────── */}
      {dupont.length > 0 && (
        <div className="border-t border-gray-100 bg-white/60">
          <button
            type="button"
            onClick={() => setDupontExpanded(v => !v)}
            className="w-full flex items-center justify-between px-4 py-2 text-xs font-medium text-gray-600 hover:bg-white/80 transition-colors"
          >
            <span className="flex items-center gap-1.5 flex-wrap">
              <Scale size={12} className="text-[#2d5a2d]" />
              {t('DuPont Analysis', '杜邦因素分析', 'Análisis DuPont', 'DuPont-Analyse', 'Analyse DuPont', 'DuPont विश्लेषण', 'Análise DuPont')}
              <span className="text-[10px] text-gray-400 font-normal">
                — {dupontFavor} {t('favoring', '利好', 'favorables', 'günstig', 'favorables', 'अनुकूल', 'favoráveis')},&nbsp;
                {dupontNeutral} {t('neutral', '中立', 'neutros', 'neutral', 'neutres', 'तटस्थ', 'neutros')},&nbsp;
                {dupontAgainst} {t('against', '不利', 'desfavorables', 'ungünstig', 'défavorables', 'प्रतिकूल', 'desfavoráveis')}
              </span>
            </span>
            {dupontExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
          {dupontExpanded && (
            <div className="px-4 pb-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {dupont.map((f, i) => {
                  const dotColor =
                    f.verdict === 'favors_registration' ? 'bg-emerald-400' :
                    f.verdict === 'against_registration' ? 'bg-red-400' : 'bg-gray-300';
                  const verdictText =
                    f.verdict === 'favors_registration'
                      ? t('Favors', '利好', 'Favorable', 'Günstig', 'Favorable', 'अनुकूल', 'Favorável')
                      : f.verdict === 'against_registration'
                      ? t('Against', '不利', 'Desfavorable', 'Ungünstig', 'Défavorable', 'प्रतिकूल', 'Desfavorável')
                      : t('Neutral', '中立', 'Neutral', 'Neutral', 'Neutre', 'तटस्थ', 'Neutro');
                  const verdictBadge =
                    f.verdict === 'favors_registration' ? 'text-emerald-700 bg-emerald-50' :
                    f.verdict === 'against_registration' ? 'text-red-700 bg-red-50' : 'text-gray-500 bg-gray-100';
                  return (
                    <div key={i} className="rounded-lg border border-gray-100 bg-white px-3 py-2.5">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dotColor}`} />
                        <span className="text-[11px] font-semibold text-gray-700 flex-1 min-w-0 leading-tight">
                          {DUPONT_LABELS[f.factor]?.[lang] ?? f.factor}
                        </span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide flex-shrink-0 ${verdictBadge}`}>
                          {verdictText}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 leading-relaxed">{f.reasoning}</p>
                    </div>
                  );
                })}
              </div>
              <p className="text-[10px] text-gray-400 mt-2 flex items-center gap-1">
                <Info size={9} className="flex-shrink-0" />
                {t(
                  'DuPont analysis based on In re E.I. DuPont DeNemours & Co. (1973), applied to Mexican trademark law context.',
                  '杜邦分析基于In re E.I. DuPont DeNemours & Co. (1973)，适用于墨西哥商标法语境。',
                  'Análisis DuPont basado en In re E.I. DuPont DeNemours & Co. (1973), aplicado al contexto de la ley de marcas mexicana.',
                  undefined, undefined,
                  'DuPont विश्लेषण In re E.I. DuPont DeNemours & Co. (1973) पर आधारित, मैक्सिकन ट्रेडमार्क कानून के संदर्भ में लागू।',
                  'Análise DuPont baseada em In re E.I. DuPont DeNemours & Co. (1973), aplicada ao contexto da lei de marcas mexicana.'
                )}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Registrability (LFPPI) ───────────────────────────────────────────── */}
      <div className="border-t border-gray-100 bg-white/60">
        <button
          type="button"
          onClick={() => setRegistrabilityExpanded(v => !v)}
          className="w-full flex items-center justify-between px-4 py-2 text-xs font-medium text-gray-600 hover:bg-white/80 transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <Scale size={12} className="text-[#2d5a2d]" />
            {regFlags.length === 0
              ? t('Registrability Analysis (LFPPI) — No issues', '可注册性分析（LFPPI）— 无问题', 'Análisis de Registrabilidad (LFPPI) — Sin problemas', undefined, undefined, 'पंजीकरण योग्यता विश्लेषण (LFPPI) — कोई समस्या नहीं', 'Análise de Registrabilidade (LFPPI) — Sem problemas')
              : t(
                  `Registrability Analysis (LFPPI) — ${regFlags.length} issue${regFlags.length !== 1 ? 's' : ''} detected`,
                  `可注册性分析（LFPPI）— 检测到${regFlags.length}个问题`,
                  `Análisis de Registrabilidad (LFPPI) — ${regFlags.length} problema${regFlags.length !== 1 ? 's' : ''} detectado${regFlags.length !== 1 ? 's' : ''}`,
                  undefined, undefined,
                  `पंजीकरण योग्यता विश्लेषण (LFPPI) — ${regFlags.length} समस्या${regFlags.length !== 1 ? 'एं' : ''} मिलीं`,
                  `Análise de Registrabilidade (LFPPI) — ${regFlags.length} problema${regFlags.length !== 1 ? 's' : ''} detectado${regFlags.length !== 1 ? 's' : ''}`
                )}
          </span>
          {registrabilityExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>
        {registrabilityExpanded && (
          <div className="px-4 pb-3">
            {regFlags.length === 0 ? (
              <div className="flex items-center gap-2 text-xs text-emerald-700">
                <CheckCircle2 size={13} className="text-emerald-500 flex-shrink-0" />
                <span>{t('No absolute grounds for refusal under the LFPPI were detected for this mark.', '根据LFPPI，未检测到该商标存在绝对驳回事由。', 'No se detectaron causales absolutas de negativa bajo la LFPPI para esta marca.', undefined, undefined, 'इस चिह्न के लिए LFPPI के तहत कोई पूर्ण अस्वीकृति का आधार नहीं मिला।', 'Nenhuma causa absoluta de recusa sob a LFPPI foi detectada para esta marca.')}</span>
              </div>
            ) : (
              <div className="space-y-2">
                {[...highFlags, ...mediumFlags, ...lowFlags].map((flag, i) => {
                  const sc = { high: 'bg-red-50 border-red-200 text-red-800', medium: 'bg-amber-50 border-amber-200 text-amber-800', low: 'bg-blue-50 border-blue-200 text-blue-800' }[flag.severity];
                  const sb = { high: 'bg-red-100 text-red-700', medium: 'bg-amber-100 text-amber-700', low: 'bg-blue-100 text-blue-700' }[flag.severity];
                  const sl = { high: t('High', '高', 'Alto', undefined, undefined, 'उच्च', 'Alto'), medium: t('Medium', '中', 'Medio', undefined, undefined, 'मध्यम', 'Médio'), low: t('Low', '低', 'Bajo', undefined, undefined, 'कम', 'Baixo') }[flag.severity];
                  return (
                    <div key={i} className={`border rounded-lg px-3 py-2.5 ${sc}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide ${sb}`}>{sl}</span>
                        <span className="text-xs font-semibold">{CATEGORY_LABELS[flag.category]?.[lang] ?? flag.category}</span>
                      </div>
                      <p className="text-xs leading-relaxed opacity-90">{flag.explanation}</p>
                    </div>
                  );
                })}
                <p className="text-xs text-gray-500 leading-relaxed mt-1 flex items-start gap-1">
                  <Info size={11} className="flex-shrink-0 mt-0.5 text-gray-400" />
                  {t('These issues may lead to IMPI refusing the application. Filing is still allowed — you assume full registrability risk.', '这些问题可能导致IMPI驳回申请。仍允许提交申请，但您自行承担可注册性风险。', 'Estos problemas pueden llevar a que el IMPI rechace la solicitud. El trámite sigue permitido — usted asume todo el riesgo de registrabilidad.', undefined, undefined, 'ये समस्याएं IMPI द्वारा आवेदन अस्वीकार करने का कारण बन सकती हैं। दाखिल करना अभी भी अनुमत है — आप पूर्ण पंजीकरण योग्यता जोखिम वहन करते हैं।', 'Esses problemas podem levar o IMPI a recusar o pedido. O protocolo ainda é permitido — você assume todo o risco de registrabilidade.')}
                </p>
              </div>
            )}
            <p className="text-xs text-gray-400 mt-2 leading-relaxed flex items-start gap-1">
              <Info size={10} className="flex-shrink-0 mt-0.5" />
              {t("AI analysis based on Mexico's Ley Federal de Protección a la Propiedad Industrial (LFPPI). Not legal advice.", '基于墨西哥《联邦工业产权保护法》(LFPPI)的AI分析，不构成法律建议。', 'Análisis de IA basado en la Ley Federal de Protección a la Propiedad Industrial (LFPPI) de México. No constituye asesoría legal.', undefined, undefined, 'मेक्सिको की Ley Federal de Protección a la Propiedad Industrial (LFPPI) पर आधारित AI विश्लेषण। यह कानूनी सलाह नहीं है।', 'Análise de IA baseada na Ley Federal de Protección a la Propiedad Industrial (LFPPI) do México. Não constitui assessoria jurídica.')}
            </p>
          </div>
        )}
      </div>

      {/* ── MARCia findings + Top Conflicts ──────────────────────────────────── */}
      <div className="border-t border-gray-100 bg-white/60">
        <button
          type="button"
          onClick={() => setMarciaExpanded(v => !v)}
          className="w-full flex items-center justify-between px-4 py-2 text-xs font-medium text-gray-600 hover:bg-white/80 transition-colors"
        >
          <span>
            {(() => {
              const total = result.marciaTotalCount ?? result.marciaFindings.length;
              const shown = result.marciaFindings.length;
              const suffix = total > shown ? ` — ${t('showing', '显示', 'mostrando')} ${shown}` : '';
              return t(
                `IMPI MARCia results (${total} match${total !== 1 ? 'es' : ''}${suffix})`,
                `IMPI MARCia结果（共${total}条匹配${total > shown ? `，显示${shown}条` : ''}）`,
                `Resultados IMPI MARCia (${total} coincidencia${total !== 1 ? 's' : ''}${suffix})`,
                undefined, undefined,
                `IMPI MARCia परिणाम (${total} मिलान${suffix})`,
                `Resultados IMPI MARCia (${total} correspondência${total !== 1 ? 's' : ''}${suffix})`
              );
            })()}
          </span>
          {marciaExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>
        {marciaExpanded && (
          <div className="px-4 pb-3">
            {result.marciaFindings.length === 0 ? (
              <p className="text-xs text-gray-500 italic">
                {t('No matching marks found in MARCia database.', '在MARCia数据库中未找到匹配商标。', 'No se encontraron marcas coincidentes en la base de datos MARCia.', undefined, undefined, 'MARCia डेटाबेस में कोई मिलान ट्रेडमार्क नहीं मिला।', 'Nenhuma marca correspondente encontrada na base de dados MARCia.')}
              </p>
            ) : (
              <>
                {/* Top conflicts */}
                {topConflicts.length > 0 && (
                  <div className="mb-3">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">
                      {t('Top Conflicts', '主要冲突', 'Principales Conflictos', 'Hauptkonflikte', 'Conflits principaux', 'मुख्य विरोध', 'Principais Conflitos')}
                    </p>
                    <div className="space-y-2">
                      {topConflicts.map((f, i) => {
                        const isRegistered = /registrada|vigente|registered|active/i.test(f.status);
                        const isExact = f.name.toLowerCase().trim() === markName.toLowerCase().trim();
                        return (
                          <div key={i} className={`rounded-lg border px-3 py-2.5 flex items-start gap-3 ${isExact ? 'border-red-200 bg-red-50' : 'border-amber-100 bg-amber-50/60'}`}>
                            <AlertTriangle size={13} className={`flex-shrink-0 mt-0.5 ${isExact ? 'text-red-500' : 'text-amber-500'}`} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                <span className="text-xs font-bold text-gray-800">{f.name}</span>
                                {isExact && (
                                  <span className="text-[9px] font-bold bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full uppercase tracking-wide">
                                    {t('Exact Match', '完全匹配', 'Coincidencia Exacta', 'Exakte Übereinstimmung', 'Correspondance exacte', 'सटीक मिलान', 'Correspondência Exata')}
                                  </span>
                                )}
                                <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${isRegistered ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                                  {f.status}
                                </span>
                              </div>
                              <p className="text-[11px] text-gray-500">
                                {f.holder && <span className="font-medium">{f.holder}</span>}
                                {f.classNum && <span className="text-gray-400"> · {t('Class', '类', 'Clase', 'Klasse', 'Classe', 'वर्ग', 'Classe')} {f.classNum}</span>}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-3 pt-2.5 border-t border-gray-100">
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">
                        {t('All MARCia Results', '所有MARCia结果', 'Todos los Resultados MARCia', 'Alle MARCia-Ergebnisse', 'Tous les résultats MARCia', 'सभी MARCia परिणाम', 'Todos os Resultados MARCia')}
                      </p>
                    </div>
                  </div>
                )}

                {/* Full table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-gray-400 border-b border-gray-100">
                        <th className="text-left pb-1 font-medium pr-3">{t('Name', '名称', 'Nombre', undefined, undefined, 'नाम', 'Nome')}</th>
                        <th className="text-left pb-1 font-medium pr-3">{t('Class', '类别', 'Clase', undefined, undefined, 'वर्ग', 'Classe')}</th>
                        <th className="text-left pb-1 font-medium pr-3">{t('Status', '状态', 'Estado', undefined, undefined, 'स्थिति', 'Status')}</th>
                        <th className="text-left pb-1 font-medium">{t('Holder', '持有人', 'Titular', undefined, undefined, 'धारक', 'Titular')}</th>
                      </tr>
                    </thead>
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
              </>
            )}
            <a
              href={result.marciaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 mt-2 text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              <ExternalLink size={11} />
              {t('Open full MARCia results', '查看完整MARCia结果', 'Ver resultados completos en MARCia', undefined, undefined, 'पूरे MARCia परिणाम देखें', 'Ver resultados completos no MARCia')}
            </a>
          </div>
        )}
      </div>

      {/* ── Web findings ─────────────────────────────────────────────────────── */}
      {result.webFindings.length > 0 && (
        <div className="border-t border-gray-100 bg-white/60">
          <button
            type="button"
            onClick={() => setWebExpanded(v => !v)}
            className="w-full flex items-center justify-between px-4 py-2 text-xs font-medium text-gray-600 hover:bg-white/80 transition-colors"
          >
            <span>{t(`Web findings (${result.webFindings.length})`, `网络检索结果（${result.webFindings.length}）`, `Resultados web (${result.webFindings.length})`, undefined, undefined, `वेब परिणाम (${result.webFindings.length})`, `Resultados web (${result.webFindings.length})`)}</span>
            {webExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
          {webExpanded && (
            <ul className="px-4 pb-3 space-y-1">
              {result.webFindings.map((f, i) => (
                <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                  <span className="text-gray-400 flex-shrink-0 mt-0.5">•</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* ── Domain availability ───────────────────────────────────────────────── */}
      {domainResults.length > 0 && (
        <div className="border-t border-gray-100 bg-white/60">
          <button
            type="button"
            onClick={() => setDomainExpanded(v => !v)}
            className="w-full flex items-center justify-between px-4 py-2 text-xs font-medium text-gray-600 hover:bg-white/80 transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <Globe size={12} className="text-blue-500" />
              {t(`Domain availability (${availableCount} available, ${takenCount} taken)`, `域名可用性（${availableCount} 可用，${takenCount} 已占用）`, `Disponibilidad de dominio (${availableCount} disponible, ${takenCount} tomado)`, undefined, undefined, `डोमेन उपलब्धता (${availableCount} उपलब्ध, ${takenCount} लिया गया)`, `Disponibilidade de domínio (${availableCount} disponível, ${takenCount} ocupado)`)}
            </span>
            {domainExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
          {domainExpanded && (
            <div className="px-4 pb-3">
              <div className="grid grid-cols-1 gap-1">
                {domainResults.map((d) => (
                  <div key={d.domain} className="flex items-center justify-between py-1 border-b border-gray-50 last:border-0">
                    <span className="text-xs font-mono text-gray-700">{d.domain}</span>
                    {d.status === 'available' && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                        <CheckCircle2 size={10} />
                        {t('Available', '可用', 'Disponible', undefined, undefined, 'उपलब्ध', 'Disponível')}
                      </span>
                    )}
                    {d.status === 'taken' && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                        <AlertCircle size={10} />
                        {t('Taken', '已占用', 'Tomado', undefined, undefined, 'लिया गया', 'Ocupado')}
                      </span>
                    )}
                    {d.status === 'unknown' && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-full">
                        <Minus size={10} />
                        {t('Unknown', '未知', 'Desconocido', undefined, undefined, 'अज्ञात', 'Desconhecido')}
                      </span>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                {t('DNS-based availability check. A domain showing "Available" may still be purchasable through a registrar.', '基于DNS的域名可用性检查。显示"可用"的域名仍可通过注册商购买。', 'Verificación de disponibilidad basada en DNS. Un dominio "Disponible" aún puede comprarse a través de un registrador.', undefined, undefined, 'DNS-आधारित उपलब्धता जांच। "उपलब्ध" दिखने वाला डोमेन फिर भी रजिस्ट्रार से खरीदा जा सकता है।', 'Verificação de disponibilidade baseada em DNS. Um domínio "Disponível" ainda pode ser comprado através de um registrador.')}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Disclaimer ───────────────────────────────────────────────────────── */}
      <div className="border-t border-gray-100 bg-white/40 px-4 py-2 flex items-start gap-1.5">
        <Info size={11} className="text-gray-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-gray-400 leading-relaxed">{result.disclaimer}</p>
      </div>

      {/* ── Use this mark anyway ─────────────────────────────────────────────── */}
      {onSelectDespiteRisk && (result.risk === 'medium' || result.risk === 'high') && (
        <div className="border-t border-gray-100 bg-white/60 px-4 py-3">
          <button
            type="button"
            onClick={() => setShowSelectModal(true)}
            className="w-full flex items-center justify-center gap-2 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 hover:border-amber-300 px-4 py-2.5 rounded-xl transition-all duration-150"
          >
            <ArrowRight size={13} />
            {t('Use this mark anyway →', '仍使用此商标继续 →', 'Continuar con esta marca de todos modos →', 'Diese Marke trotzdem verwenden →', 'Utiliser cette marque quand même →', 'फिर भी यह ट्रेडमार्क उपयोग करें →', 'Usar esta marca mesmo assim →')}
          </button>
        </div>
      )}

      {/* ── Confirmation modal ───────────────────────────────────────────────── */}
      {showSelectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={20} className="text-amber-600" />
              </div>
              <div>
                <h3 className="font-bold text-navy-900 text-base leading-snug">
                  {t(`Proceed with "${markName}" despite risks?`, `尽管存在风险，仍要使用"${markName}"吗？`, `¿Continuar con "${markName}" a pesar de los riesgos?`, `Mit „${markName}" trotz Risiken fortfahren?`, `Continuer avec « ${markName} » malgré les risques ?`, `जोखिमों के बावजूद "${markName}" के साथ आगे बढ़ें?`, `Prosseguir com "${markName}" apesar dos riscos?`)}
                </h3>
                <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                  {t('The clearance analysis identified potential conflicts or registrability issues. Filing does not guarantee registration — IMPI may refuse this mark. You assume full responsibility for the filing decision.', '本次检索分析发现该商标存在潜在冲突或可注册性问题。提交申请并不保证获准注册——IMPI可能驳回该商标。您将自行承担申请决定的全部责任。', 'El análisis de disponibilidad identificó posibles conflictos o problemas de registrabilidad. Presentar la solicitud no garantiza el registro — el IMPI puede rechazar esta marca. Usted asume plena responsabilidad.', 'Die Clearance-Analyse hat potenzielle Konflikte oder Registrierbarkeitsprobleme festgestellt. Die Anmeldung garantiert keine Eintragung. Sie übernehmen die volle Verantwortung.', "L'analyse a identifié des conflits potentiels. Le dépôt ne garantit pas l'enregistrement. Vous assumez l'entière responsabilité.", 'क्लीयरेंस विश्लेषण ने संभावित विरोध या पंजीकरण योग्यता समस्याओं की पहचान की। दाखिल करना पंजीकरण की गारंटी नहीं देता। आप पूरी जिम्मेदारी वहन करते हैं।', 'A análise identificou conflitos potenciais. O protocolo não garante o registro. Você assume total responsabilidade.')}
                </p>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button type="button" onClick={() => setShowSelectModal(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                {t('Review findings', '返回查看', 'Revisar hallazgos', 'Befunde überprüfen', 'Revoir les résultats', 'निष्कर्ष देखें', 'Revisar resultados')}
              </button>
              <button type="button" onClick={() => { setShowSelectModal(false); onSelectDespiteRisk(markName); }} className="flex-1 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold transition-colors">
                {t('Yes, use this mark', '是的，使用此商标', 'Sí, usar esta marca', 'Ja, diese Marke verwenden', 'Oui, utiliser cette marque', 'हाँ, यह ट्रेडमार्क उपयोग करें', 'Sim, usar esta marca')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
