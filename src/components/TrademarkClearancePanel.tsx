import { useState, useEffect, useRef } from 'react';
import { Shield, Loader2, ChevronDown, ChevronUp, ExternalLink, AlertTriangle, CheckCircle2, AlertCircle, Info, Globe } from 'lucide-react';

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

interface ClearanceResult {
  risk: 'low' | 'medium' | 'high';
  webFindings: string[];
  marciaFindings: MarciaFinding[];
  marciaTotalCount?: number;
  marciaUrl: string;
  domainResults: DomainResult[];
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

export type { ClearanceResult };

export default function TrademarkClearancePanel({ markName, classes, language, autoRun = true, onResult }: Props) {
  const [status, setStatus] = useState<'idle' | 'checking' | 'done' | 'error'>('idle');
  const [result, setResult] = useState<ClearanceResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [webExpanded, setWebExpanded] = useState(false);
  const [marciaExpanded, setMarciaExpanded] = useState(false);
  const [domainExpanded, setDomainExpanded] = useState(true);
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
            'Searching IMPI MARCia, web, and checking domain availability…',
            '正在搜索IMPI MARCia、网络并检查域名可用性…',
            'Buscando en IMPI MARCia, web y verificando disponibilidad de dominio…',
            undefined,
            undefined,
            'IMPI MARCia, वेब पर खोज हो रही है और डोमेन उपलब्धता जांची जा रही है…',
            'Pesquisando no IMPI MARCia, na web e verificando disponibilidade de domínio…'
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

      {/* MARCia findings — first */}
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

      {/* Web findings — second */}
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

      {/* Domain availability — third */}
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
