import { useState, useEffect, useRef } from 'react';
import { Shield, Loader2, ChevronDown, ChevronUp, ExternalLink, AlertTriangle, CheckCircle2, AlertCircle, Info, Globe, Scale } from 'lucide-react';

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

interface ClearanceResult {
  risk: 'low' | 'medium' | 'high';
  webFindings: string[];
  marciaFindings: MarciaFinding[];
  marciaTotalCount?: number;
  marciaUrl: string;
  domainResults: DomainResult[];
  registrabilityFlags?: RegistrabilityFlag[];
  registrabilityRisk?: 'low' | 'medium' | 'high';
  disclaimer: string;
}

interface Props {
  markName: string;
  classes: number[];
  language: 'en' | 'zh' | 'es' | 'de' | 'fr' | 'hi' | 'pt';
  autoRun?: boolean;
  onResult?: (result: ClearanceResult) => void;
}

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
  },
  medium: {
    label: { en: 'Medium Risk', zh: '中等风险', es: 'Riesgo Medio', de: 'Mittleres Risiko', fr: 'Risque modéré', hi: 'मध्यम जोखिम', pt: 'Risco Médio' },
    desc: { en: 'Some similar marks found — review recommended', zh: '发现一些相似商标，建议进一步审查', es: 'Se encontraron marcas similares — se recomienda revisión', de: 'Ähnliche Marken gefunden — Überprüfung empfohlen', fr: 'Marques similaires trouvées — révision recommandée', hi: 'कुछ समान ट्रेडमार्क मिले — समीक्षा की सलाह है', pt: 'Marcas similares encontradas — revisão recomendada' },
    icon: AlertTriangle,
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-700',
    badge: 'bg-amber-100 text-amber-700',
  },
  high: {
    label: { en: 'High Risk', zh: '高风险', es: 'Riesgo Alto', de: 'Hohes Risiko', fr: 'Risque élevé', hi: 'उच्च जोखिम', pt: 'Alto Risco' },
    desc: { en: 'Potential conflict detected — legal review advised', zh: '检测到潜在冲突，建议法律审查', es: 'Conflicto potencial detectado — se recomienda revisión legal', de: 'Potenzieller Konflikt erkannt — rechtliche Prüfung empfohlen', fr: 'Conflit potentiel détecté — révision juridique conseillée', hi: 'संभावित विरोध पाया गया — कानूनी समीक्षा की सलाह है', pt: 'Conflito potencial detectado — revisão jurídica aconselhada' },
    icon: AlertCircle,
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-700',
    badge: 'bg-red-100 text-red-700',
  },
};

// Human-readable LFPPI category names per language
const CATEGORY_LABELS: Record<string, Record<string, string>> = {
  generic_descriptive: {
    en: 'Generic or Descriptive',
    zh: '通用或描述性词汇',
    es: 'Genérico o Descriptivo',
    de: 'Generisch oder Beschreibend',
    fr: 'Générique ou Descriptif',
    hi: 'सामान्य या वर्णनात्मक',
    pt: 'Genérico ou Descritivo',
  },
  functional_shape: {
    en: 'Functional Shape',
    zh: '功能性形状',
    es: 'Forma Funcional',
    de: 'Funktionelle Form',
    fr: 'Forme Fonctionnelle',
    hi: 'कार्यात्मक आकार',
    pt: 'Forma Funcional',
  },
  deceptive: {
    en: 'Deceptive or Misleading',
    zh: '欺骗性或误导性',
    es: 'Engañoso o Equívoco',
    de: 'Täuschend oder Irreführend',
    fr: 'Trompeur ou Induit en Erreur',
    hi: 'भ्रामक या गुमराह करने वाला',
    pt: 'Enganoso ou Ilusório',
  },
  official_emblems: {
    en: 'Official Emblems / Flags',
    zh: '官方徽章/国旗',
    es: 'Emblemas Oficiales / Banderas',
    de: 'Offizielle Embleme / Flaggen',
    fr: 'Emblèmes Officiels / Drapeaux',
    hi: 'आधिकारिक प्रतीक/ध्वज',
    pt: 'Emblemas Oficiais / Bandeiras',
  },
  personal_identity: {
    en: 'Personal Identity Without Consent',
    zh: '未经许可的个人身份',
    es: 'Identidad Personal Sin Consentimiento',
    de: 'Persönliche Identität Ohne Einwilligung',
    fr: 'Identité Personnelle Sans Consentement',
    hi: 'बिना अनुमति व्यक्तिगत पहचान',
    pt: 'Identidade Pessoal Sem Consentimento',
  },
  confusingly_similar: {
    en: 'Confusingly Similar to Existing Mark',
    zh: '与现有商标混淆相似',
    es: 'Confusamente Similar a Marca Existente',
    de: 'Verwechslungsgefahr mit Bestehender Marke',
    fr: 'Similaire à une Marque Existante',
    hi: 'मौजूदा ट्रेडमार्क से भ्रामक रूप से समान',
    pt: 'Confusamente Similar a Marca Existente',
  },
  famous_mark: {
    en: 'Famous or Notorious Mark',
    zh: '知名或著名商标',
    es: 'Marca Famosa o Notoriamente Conocida',
    de: 'Bekannte oder Berühmte Marke',
    fr: 'Marque Célèbre ou Notoirement Connue',
    hi: 'प्रसिद्ध या विख्यात ट्रेडमार्क',
    pt: 'Marca Famosa ou Notoriamente Conhecida',
  },
  protected_characters: {
    en: 'Protected Characters / Titles',
    zh: '受保护的角色/标题',
    es: 'Personajes / Títulos Protegidos',
    de: 'Geschützte Figuren / Titel',
    fr: 'Personnages / Titres Protégés',
    hi: 'संरक्षित पात्र/शीर्षक',
    pt: 'Personagens / Títulos Protegidos',
  },
  geographic_indication: {
    en: 'Protected Geographic Indication',
    zh: '受保护的地理标志',
    es: 'Indicación Geográfica Protegida',
    de: 'Geschützte Geografische Angabe',
    fr: 'Indication Géographique Protégée',
    hi: 'संरक्षित भौगोलिक संकेत',
    pt: 'Indicação Geográfica Protegida',
  },
  immoral_offensive: {
    en: 'Contrary to Public Order / Morality',
    zh: '违反公共秩序/道德',
    es: 'Contrario al Orden Público / Moral',
    de: 'Gegen Öffentliche Ordnung / Moral',
    fr: 'Contraire à l\'Ordre Public / Moralité',
    hi: 'सार्वजनिक व्यवस्था/नैतिकता के विरुद्ध',
    pt: 'Contrário à Ordem Pública / Moralidade',
  },
  isolated_color: {
    en: 'Isolated Color (Not Distinctive)',
    zh: '单一颜色（缺乏显著性）',
    es: 'Color Aislado (No Distintivo)',
    de: 'Einzelfarbe (Nicht Unterscheidungskräftig)',
    fr: 'Couleur Isolée (Non Distinctive)',
    hi: 'अकेला रंग (विशिष्ट नहीं)',
    pt: 'Cor Isolada (Não Distintiva)',
  },
  non_distinctive_nontrad: {
    en: 'Non-Distinctive Non-Traditional Mark',
    zh: '缺乏显著性的非传统标志',
    es: 'Marca No Tradicional Sin Distintividad',
    de: 'Nicht Unterscheidungskräftiges Nicht-Traditionelles Zeichen',
    fr: 'Marque Non Traditionnelle Non Distinctive',
    hi: 'गैर-विशिष्ट अपारंपरिक चिह्न',
    pt: 'Marca Não Tradicional Sem Distintividade',
  },
  bad_faith: {
    en: 'Bad Faith Filing',
    zh: '恶意申请',
    es: 'Solicitud de Mala Fe',
    de: 'Bösgläubige Anmeldung',
    fr: 'Dépôt de Mauvaise Foi',
    hi: 'बुरे इरादे से दाखिल',
    pt: 'Depósito de Má-fé',
  },
};

export type { ClearanceResult };

export default function TrademarkClearancePanel({ markName, classes, language, autoRun = true, onResult }: Props) {
  const [status, setStatus] = useState<'idle' | 'checking' | 'done' | 'error'>('idle');
  const [result, setResult] = useState<ClearanceResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [webExpanded, setWebExpanded] = useState(false);
  const [marciaExpanded, setMarciaExpanded] = useState(false);
  const [domainExpanded, setDomainExpanded] = useState(false);
  const [registrabilityExpanded, setRegistrabilityExpanded] = useState(true);
  const runningRef = useRef(false);

  const lang = (language === 'es' ? 'es' : language === 'zh' ? 'zh' : language === 'de' ? 'de' : language === 'fr' ? 'fr' : language === 'hi' ? 'hi' : language === 'pt' ? 'pt' : 'en') as 'en' | 'zh' | 'es' | 'de' | 'fr' | 'hi' | 'pt';

  const t = (en: string, zh: string, es: string, de?: string, fr?: string, hi?: string, pt?: string) =>
    lang === 'zh' ? zh : lang === 'es' ? es : lang === 'de' ? (de ?? en) : lang === 'fr' ? (fr ?? en) : lang === 'hi' ? (hi ?? en) : lang === 'pt' ? (pt ?? en) : en;

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
        body: JSON.stringify({ markName: markName.trim(), classes, language }),
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
  }, [markName, classes.join(',')]);

  if (status === 'idle') {
    return (
      <div className="mt-3 rounded-xl border border-gold-200 bg-gold-50 px-4 py-3 flex items-start gap-3">
        <Shield size={15} className="text-gold-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gold-700">
            {t('Trademark & Domain Check', '商标及域名检索', 'Verificación de Marca y Dominio', undefined, undefined, 'ट्रेडमार्क और डोमेन जांच', 'Verificação de Marca e Domínio')}
          </p>
          <p className="text-xs text-gold-600 mt-0.5">
            {t(
              "We'll search IMPI MARCia, the web, and check domain availability.",
              '我们将在IMPI MARCia数据库、网络上搜索类似商标，并检查域名可用性。',
              'Buscaremos en IMPI MARCia, la web, y verificaremos la disponibilidad del dominio.',
              undefined,
              undefined,
              'हम IMPI MARCia, वेब पर खोज करेंगे और डोमेन उपलब्धता जांचेंगे।',
              'Pesquisaremos no IMPI MARCia, na web e verificaremos a disponibilidade do domínio.'
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={runCheck}
          className="flex-shrink-0 text-xs font-semibold bg-gold-500 hover:bg-gold-600 text-white px-3 py-1.5 rounded-lg transition-colors"
        >
          {t('Check Now', '立即检索', 'Verificar', undefined, undefined, 'अभी जांचें', 'Verificar Agora')}
        </button>
      </div>
    );
  }

  if (status === 'checking') {
    return (
      <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 flex items-center gap-3">
        <Loader2 size={15} className="text-gray-400 animate-spin flex-shrink-0" />
        <p className="text-xs text-gray-500">
          {t(
            'Analyzing mark, searching IMPI MARCia, web, and checking domain availability…',
            '正在分析商标、搜索IMPI MARCia、网络并检查域名可用性…',
            'Analizando marca, buscando en IMPI MARCia, web y verificando disponibilidad de dominio…',
            undefined,
            undefined,
            'चिह्न का विश्लेषण हो रहा है, IMPI MARCia, वेब पर खोज हो रही है और डोमेन उपलब्धता जांची जा रही है…',
            'Analisando marca, pesquisando no IMPI MARCia, na web e verificando disponibilidade de domínio…'
          )}
        </p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 flex items-start gap-3">
        <AlertCircle size={15} className="text-red-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-xs text-red-700">{errorMsg || t('Clearance check failed.', '检索失败。', 'La verificación falló.', undefined, undefined, 'क्लीयरेंस जांच विफल हुई।', 'A verificação falhou.')}</p>
        </div>
        <button
          type="button"
          onClick={() => { runningRef.current = false; runCheck(); }}
          className="flex-shrink-0 text-xs text-red-600 hover:text-red-800 font-medium underline"
        >
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

  return (
    <div className={`mt-3 rounded-xl border ${cfg.border} ${cfg.bg} overflow-hidden`}>
      {/* Risk header */}
      <div className="px-4 py-3 flex items-center gap-3">
        <RiskIcon size={16} className={`${cfg.text} flex-shrink-0`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs font-bold ${cfg.text}`}>
              {t('Clearance Check: ', '商标检索：', 'Verificación: ', undefined, undefined, 'क्लीयरेंस जांच: ', 'Verificação: ')}
            </span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.badge}`}>
              {cfg.label[lang]}
            </span>
          </div>
          <p className={`text-xs mt-0.5 ${cfg.text} opacity-80`}>{cfg.desc[lang]}</p>
        </div>
        <button
          type="button"
          onClick={() => { runningRef.current = false; runCheck(); }}
          className={`flex-shrink-0 text-xs ${cfg.text} opacity-70 hover:opacity-100 font-medium underline`}
        >
          {t('Re-run', '重新检索', 'Repetir', undefined, undefined, 'पुनः चलाएं', 'Repetir')}
        </button>
      </div>

      {/* Registrability analysis (LFPPI) — first, most actionable */}
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
                <span>
                  {t(
                    'No absolute grounds for refusal under the LFPPI were detected for this mark.',
                    '根据LFPPI，未检测到该商标存在绝对驳回事由。',
                    'No se detectaron causales absolutas de negativa bajo la LFPPI para esta marca.',
                    undefined, undefined,
                    'इस चिह्न के लिए LFPPI के तहत कोई पूर्ण अस्वीकृति का आधार नहीं मिला।',
                    'Nenhuma causa absoluta de recusa sob a LFPPI foi detectada para esta marca.'
                  )}
                </span>
              </div>
            ) : (
              <div className="space-y-2">
                {[...highFlags, ...mediumFlags, ...lowFlags].map((flag, i) => {
                  const severityClasses = {
                    high: 'bg-red-50 border-red-200 text-red-800',
                    medium: 'bg-amber-50 border-amber-200 text-amber-800',
                    low: 'bg-blue-50 border-blue-200 text-blue-800',
                  }[flag.severity];
                  const severityBadge = {
                    high: 'bg-red-100 text-red-700',
                    medium: 'bg-amber-100 text-amber-700',
                    low: 'bg-blue-100 text-blue-700',
                  }[flag.severity];
                  const severityLabel = {
                    high: t('High', '高', 'Alto', undefined, undefined, 'उच्च', 'Alto'),
                    medium: t('Medium', '中', 'Medio', undefined, undefined, 'मध्यम', 'Médio'),
                    low: t('Low', '低', 'Bajo', undefined, undefined, 'कम', 'Baixo'),
                  }[flag.severity];
                  const categoryLabel = CATEGORY_LABELS[flag.category]?.[lang] ?? flag.category;
                  return (
                    <div key={i} className={`border rounded-lg px-3 py-2.5 ${severityClasses}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide ${severityBadge}`}>
                          {severityLabel}
                        </span>
                        <span className="text-xs font-semibold">{categoryLabel}</span>
                      </div>
                      <p className="text-xs leading-relaxed opacity-90">{flag.explanation}</p>
                    </div>
                  );
                })}
                <p className="text-xs text-gray-500 leading-relaxed mt-1 flex items-start gap-1">
                  <Info size={11} className="flex-shrink-0 mt-0.5 text-gray-400" />
                  {t(
                    'These issues may lead to IMPI refusing the application. Filing is still allowed — you assume full registrability risk.',
                    '这些问题可能导致IMPI驳回申请。仍允许提交申请，但您自行承担可注册性风险。',
                    'Estos problemas pueden llevar a que el IMPI rechace la solicitud. El trámite sigue permitido — usted asume todo el riesgo de registrabilidad.',
                    undefined, undefined,
                    'ये समस्याएं IMPI द्वारा आवेदन अस्वीकार करने का कारण बन सकती हैं। दाखिल करना अभी भी अनुमत है — आप पूर्ण पंजीकरण योग्यता जोखिम वहन करते हैं।',
                    'Esses problemas podem levar o IMPI a recusar o pedido. O protocolo ainda é permitido — você assume todo o risco de registrabilidade.'
                  )}
                </p>
              </div>
            )}
            <p className="text-xs text-gray-400 mt-2 leading-relaxed flex items-start gap-1">
              <Info size={10} className="flex-shrink-0 mt-0.5" />
              {t(
                'AI analysis based on Mexico\'s Ley Federal de Protección a la Propiedad Industrial (LFPPI). Not legal advice.',
                '基于墨西哥《联邦工业产权保护法》(LFPPI)的AI分析，不构成法律建议。',
                'Análisis de IA basado en la Ley Federal de Protección a la Propiedad Industrial (LFPPI) de México. No constituye asesoría legal.',
                undefined, undefined,
                'मेक्सिको की Ley Federal de Protección a la Propiedad Industrial (LFPPI) पर आधारित AI विश्लेषण। यह कानूनी सलाह नहीं है।',
                'Análise de IA baseada na Ley Federal de Protección a la Propiedad Industrial (LFPPI) do México. Não constitui assessoria jurídica.'
              )}
            </p>
          </div>
        )}
      </div>

      {/* MARCia findings — second */}
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

      {/* Web findings — third */}
      {result.webFindings.length > 0 && (
        <div className="border-t border-gray-100 bg-white/60">
          <button
            type="button"
            onClick={() => setWebExpanded(v => !v)}
            className="w-full flex items-center justify-between px-4 py-2 text-xs font-medium text-gray-600 hover:bg-white/80 transition-colors"
          >
            <span>
              {t(
                `Web findings (${result.webFindings.length})`,
                `网络检索结果（${result.webFindings.length}）`,
                `Resultados web (${result.webFindings.length})`,
                undefined,
                undefined,
                `वेब परिणाम (${result.webFindings.length})`,
                `Resultados web (${result.webFindings.length})`
              )}
            </span>
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

      {/* Domain availability — fourth */}
      {domainResults.length > 0 && (
        <div className="border-t border-gray-100 bg-white/60">
          <button
            type="button"
            onClick={() => setDomainExpanded(v => !v)}
            className="w-full flex items-center justify-between px-4 py-2 text-xs font-medium text-gray-600 hover:bg-white/80 transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <Globe size={12} className="text-blue-500" />
              {t(
                `Domain availability (${availableCount} available, ${takenCount} taken)`,
                `域名可用性（${availableCount} 可用，${takenCount} 已占用）`,
                `Disponibilidad de dominio (${availableCount} disponible, ${takenCount} tomado)`,
                undefined,
                undefined,
                `डोमेन उपलब्धता (${availableCount} उपलब्ध, ${takenCount} लिया गया)`,
                `Disponibilidade de domínio (${availableCount} disponível, ${takenCount} ocupado)`
              )}
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
                        <Info size={10} />
                        {t('Unknown', '未知', 'Desconocido', undefined, undefined, 'अज्ञात', 'Desconhecido')}
                      </span>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                {t(
                  'DNS-based availability check. A domain showing "Available" may still be purchasable through a registrar.',
                  '基于DNS的域名可用性检查。显示"可用"的域名仍可通过注册商购买。',
                  'Verificación de disponibilidad basada en DNS. Un dominio "Disponible" aún puede comprarse a través de un registrador.',
                  undefined,
                  undefined,
                  'DNS-आधारित उपलब्धता जांच। "उपलब्ध" दिखने वाला डोमेन फिर भी रजिस्ट्रार से खरीदा जा सकता है।',
                  'Verificação de disponibilidade baseada em DNS. Um domínio "Disponível" ainda pode ser comprado através de um registrador.'
                )}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Disclaimer */}
      <div className="border-t border-gray-100 bg-white/40 px-4 py-2 flex items-start gap-1.5">
        <Info size={11} className="text-gray-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-gray-400 leading-relaxed">{result.disclaimer}</p>
      </div>
    </div>
  );
}
