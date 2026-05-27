import { useState } from 'react';
import {
  AlertCircle, AlertTriangle, CheckCircle2, ChevronDown, ChevronUp,
  ExternalLink, Globe, Info, Scale, Shield, Star, Tag,
  Clock, Users, Building2, MapPin,
  BarChart2, Layers, Target, BookOpen, ArrowRight, FileText,
  XCircle, CheckCircle, MinusCircle, HelpCircle, Printer,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type Lang = 'en' | 'es';
type Tier = 'generic' | 'descriptive' | 'suggestive' | 'arbitrary' | 'fanciful';
type ConflictStatus = 'registrado' | 'en_tramite' | 'caducado';
type Verdict = 'favorable' | 'neutral' | 'desfavorable' | 'na';
type FraccionVerdict = 'pass' | 'caution' | 'fail' | 'na';
type OverallRisk = 'critical' | 'high' | 'moderate' | 'low' | 'clear';

interface Bi { en: string; es: string }

interface ConflictMark {
  id: string;
  name: string;
  holder: string;
  holderCountry: string;
  holderType: 'persona_fisica_mx' | 'persona_moral_mx' | 'extranjera' | 'multinacional';
  classNum: number;
  status: ConflictStatus;
  filingDate?: string;
  registrationDate?: string;
  similarityScore: number;
  expediente?: string;
  registrationNumber?: string;
  goodsServices?: string;
  marciaUrl?: string;
  whyItMatters: Bi;
}

interface ElementDecomp {
  element: string;
  meaning: Bi;
  etymology: Bi;
  saturationClass: number;
  saturationAll: number;
  tier: Tier;
  contribution: Bi;
}

interface ConfundibilidadCriterion {
  id: string;
  title: Bi;
  question: Bi;
  verdict: Verdict;
  cite: string;
  analysis: Bi;
  consequence: Bi;
}

interface FraccionCard {
  num: string;
  question: Bi;
  verdict: FraccionVerdict;
  statuteEs: string;
  analysis: Bi;
  consequence: Bi;
}

interface Strategy {
  id: string;
  title: Bi;
  viability: number;
  description: Bi;
  feesMxn: string;
  timeline: Bi;
  successRange: string;
  pros: Bi[];
  cons: Bi[];
  cta: Bi;
  alternatives?: { name: string; quickScore: number }[];
}

interface OtherGround {
  id: string;
  label: Bi;
  cite: string;
  verdict: FraccionVerdict;
  note: Bi;
}

interface ReportData {
  markName: string;
  classes: number[];
  goodsServices: Bi;
  overallRisk: OverallRisk;
  registrabilityScore: number;
  distinctivenessTier: Tier;
  distinctivenessScore: number;
  distinctivenessExplanation: Bi;
  headlineReason: Bi;
  topConflict: ConflictMark;
  criticalConflicts: ConflictMark[];
  significantConflicts: ConflictMark[];
  backgroundConflicts: ConflictMark[];
  holderClusters: Array<{ holder: string; marks: string[]; clusterType: 'individual_mx' | 'multinational'; note: Bi }>;
  elementDecomposition: ElementDecomp[];
  combinedVerdictNote: Bi;
  axisScores: {
    distintividadInherente: number;
    disponibilidadRegistral: number;
    saturacionCampo: number;
    cumplimientoArt173: number;
    riesgoOposicion: number;
  };
  confundibilidad: ConfundibilidadCriterion[];
  fracciones: FraccionCard[];
  malaFeIndicators: Array<{ label: Bi; present: boolean; note: Bi }>;
  malaFeVerdict: 'low' | 'medium' | 'high';
  malaFeRationale: Bi;
  famousMarks: Array<{ name: string; holder: string; sector: string; threat: Bi; detected: boolean }>;
  translationAnalysis: Array<{ lang: string; langName: string; form: string; risk: 'none' | 'low' | 'medium' | 'high'; note: string }>;
  otherGrounds: OtherGround[];
  domains: Array<{ domain: string; status: 'available' | 'taken' | 'unknown' }>;
  strategies: Strategy[];
  impiSteps: Array<{ step: number; label: Bi; duration: Bi; note?: Bi }>;
  totalFeesMxn: number;
}

// ─── Static config ─────────────────────────────────────────────────────────────

const TIER_ORDER: Tier[] = ['generic', 'descriptive', 'suggestive', 'arbitrary', 'fanciful'];

const TIER_LABEL: Record<Tier, Bi> = {
  generic:      { en: 'Generic',      es: 'Genérica' },
  descriptive:  { en: 'Descriptive',  es: 'Descriptiva' },
  suggestive:   { en: 'Suggestive',   es: 'Sugestiva' },
  arbitrary:    { en: 'Arbitrary',    es: 'Arbitraria' },
  fanciful:     { en: 'Fanciful',     es: 'De Fantasía' },
};

const TIER_EXAMPLE: Record<Tier, string> = {
  generic:     'VITAMINAS → vitamins',
  descriptive: 'VITAFIT → vita + fit',
  suggestive:  'NETFLIX → internet + flicks',
  arbitrary:   'APPLE → tech company',
  fanciful:    'XEROX → coined word',
};

const TIER_COLORS: Record<Tier, string> = {
  generic:    '#dc2626',
  descriptive:'#ea580c',
  suggestive: '#d97706',
  arbitrary:  '#16a34a',
  fanciful:   '#0f2a44',
};

const TIER_BG: Record<Tier, string> = {
  generic:    'bg-red-100 text-red-700 border border-red-200',
  descriptive:'bg-orange-100 text-orange-700 border border-orange-200',
  suggestive: 'bg-amber-100 text-amber-700 border border-amber-200',
  arbitrary:  'bg-emerald-100 text-emerald-700 border border-emerald-200',
  fanciful:   'bg-[#0f2a44]/10 text-[#0f2a44] border border-[#0f2a44]/20',
};

const STATUS_PILL: Record<ConflictStatus, { label: Bi; bg: string; text: string; dot: string }> = {
  registrado: { label: { en: 'REGISTERED', es: 'REGISTRADO' }, bg: 'bg-emerald-50 border-emerald-300', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  en_tramite: { label: { en: 'PENDING', es: 'EN TRÁMITE' }, bg: 'bg-amber-50 border-amber-300', text: 'text-amber-700', dot: 'bg-amber-500' },
  caducado:   { label: { en: 'LAPSED', es: 'CADUCADO' }, bg: 'bg-gray-100 border-gray-300', text: 'text-gray-500', dot: 'bg-gray-400' },
};

const HOLDER_TYPE_LABEL: Record<ConflictMark['holderType'], Bi> = {
  persona_fisica_mx: { en: 'Mexican individual', es: 'Persona física mexicana' },
  persona_moral_mx:  { en: 'Mexican company', es: 'Persona moral mexicana' },
  extranjera:        { en: 'Foreign entity', es: 'Persona moral extranjera' },
  multinacional:     { en: 'Multinational', es: 'Multinacional' },
};

const VERDICT_CFG: Record<Verdict, { label: Bi; cls: string; dot: string; icon: React.ReactNode }> = {
  favorable:    { label: { en: 'Favorable', es: 'Favorable' }, cls: 'border-emerald-200 bg-emerald-50/40', dot: 'bg-emerald-500', icon: <CheckCircle size={13} className="text-emerald-500 flex-shrink-0 mt-0.5" /> },
  neutral:      { label: { en: 'Neutral', es: 'Neutral' }, cls: 'border-amber-200 bg-amber-50/40', dot: 'bg-amber-500', icon: <MinusCircle size={13} className="text-amber-500 flex-shrink-0 mt-0.5" /> },
  desfavorable: { label: { en: 'Unfavorable', es: 'Desfavorable' }, cls: 'border-red-200 bg-red-50/40', dot: 'bg-red-500', icon: <XCircle size={13} className="text-red-500 flex-shrink-0 mt-0.5" /> },
  na:           { label: { en: 'N/A', es: 'N/A' }, cls: 'border-gray-200 bg-gray-50/40', dot: 'bg-gray-300', icon: <HelpCircle size={13} className="text-gray-400 flex-shrink-0 mt-0.5" /> },
};

const FRAC_CFG: Record<FraccionVerdict, { icon: string; cls: string; badge: string }> = {
  pass:    { icon: '✓', cls: 'border-emerald-100 bg-emerald-50/50',  badge: 'bg-emerald-100 text-emerald-700' },
  caution: { icon: '!', cls: 'border-amber-200 bg-amber-50/50',      badge: 'bg-amber-100 text-amber-700' },
  fail:    { icon: '✗', cls: 'border-red-200 bg-red-50/60 ring-1 ring-red-200', badge: 'bg-red-100 text-red-700' },
  na:      { icon: '—', cls: 'border-gray-100 bg-gray-50/50',        badge: 'bg-gray-100 text-gray-500' },
};

function t(obj: Bi, lang: Lang): string { return obj[lang]; }

// ─── Vitafit / Class 5 Sample Data ────────────────────────────────────────────

const VITAFIT_DATA: ReportData = {
  markName: 'VITAFIT',
  classes: [5],
  goodsServices: {
    en: 'Dietary supplements; vitamins; mineral supplements; protein powders; weight-loss preparations; health foods for medical use; nutraceuticals.',
    es: 'Suplementos alimenticios; vitaminas; suplementos minerales; proteínas en polvo; preparaciones para adelgazar; alimentos para uso médico; nutracéuticos.',
  },
  overallRisk: 'high',
  registrabilityScore: 19,
  distinctivenessTier: 'descriptive',
  distinctivenessScore: 2,
  distinctivenessExplanation: {
    en: '"VITA" (Latin: life) and "FIT" (English: physically fit) each directly describe characteristics of dietary supplements and health products in class 5. Together they communicate "life + fitness" immediately, without any mental effort — the exact test for descriptiveness under LFPPI Art. 173 Fr. IV. IMPI examiners routinely refuse marks of this composition for class 5 goods on absolute grounds. No secondary meaning evidence has been submitted.',
    es: '"VITA" (latín: vida) y "FIT" (inglés: en forma/aptitud física) describen directamente las características de suplementos alimenticios y productos de salud de la clase 5. Juntos comunican "vida + forma física" de manera inmediata, sin esfuerzo mental, lo que configura el supuesto de descriptividad del Art. 173 Fr. IV LFPPI. El IMPI rechaza rutinariamente marcas de esta composición para la clase 5. No se ha presentado evidencia de distintividad adquirida.',
  },
  headlineReason: {
    en: 'Mark VITAFIT is already registered in class 5 by LIDL STIFTUNG & CO. KG (Germany — multinational). Identical phonetic, visual, and conceptual overlap constitutes a direct Art. 173 Fr. XVIII conflict. A secondary absolute barrier exists under Art. 173 Fr. IV (descriptiveness). Registration probability is critically low.',
    es: 'La marca VITAFIT ya está registrada en la clase 5 por LIDL STIFTUNG & CO. KG (Alemania — multinacional). La coincidencia idéntica en fonética, grafía y concepto constituye un conflicto directo bajo el Art. 173 Fr. XVIII. Existe un impedimento absoluto secundario bajo el Art. 173 Fr. IV (descriptividad). La probabilidad de registro es críticamente baja.',
  },
  topConflict: {
    id: 'tc1',
    name: 'VITAFIT',
    holder: 'LIDL STIFTUNG & CO. KG',
    holderCountry: 'Germany',
    holderType: 'multinacional',
    classNum: 5,
    status: 'registrado',
    filingDate: '2015-03-12',
    registrationDate: '2016-08-04',
    similarityScore: 100,
    expediente: 'MX/E/2015/012847',
    registrationNumber: '1523890',
    goodsServices: 'Dietary supplements; vitamins; mineral preparations; protein supplements; slimming preparations; health foods for medical use.',
    marciaUrl: 'https://marcia.impi.gob.mx/marcas/search/quick',
    whyItMatters: {
      en: 'Phonetically, visually, and conceptually identical mark held by LIDL STIFTUNG & CO. KG, a German multinational retail conglomerate with extensive legal enforcement resources. This constitutes a direct Art. 173 Fr. XVIII conflict covering goods that are substantially identical in class 5. Near-certain IMPI refusal; post-registration nullity is also available to this holder under Art. 258 LFPPI.',
      es: 'Marca idéntica en fonética, grafía y concepto, titularidad de LIDL STIFTUNG & CO. KG, conglomerado multinacional alemán con amplios recursos legales. Constituye un conflicto directo bajo el Art. 173 Fr. XVIII con cobertura de productos sustancialmente idénticos en la clase 5. Rechazo IMPI prácticamente garantizado; acción de nulidad post-registro también disponible bajo el Art. 258 LFPPI.',
    },
  },
  criticalConflicts: [
    {
      id: 'cc1',
      name: 'VITAFIT',
      holder: 'LIDL STIFTUNG & CO. KG',
      holderCountry: 'Germany',
      holderType: 'multinacional',
      classNum: 5,
      status: 'registrado',
      filingDate: '2015-03-12',
      registrationDate: '2016-08-04',
      similarityScore: 100,
      expediente: 'MX/E/2015/012847',
      registrationNumber: '1523890',
      goodsServices: 'Dietary supplements; vitamins; mineral preparations; protein supplements; slimming preparations.',
      marciaUrl: 'https://marcia.impi.gob.mx/marcas/search/quick',
      whyItMatters: {
        en: 'Identical mark, same class 5, multinational holder with enforcement budget. Art. 173 Fr. XVIII direct conflict — highest priority obstacle.',
        es: 'Marca idéntica, misma clase 5, titular multinacional con presupuesto de enforcement. Conflicto directo Art. 173 Fr. XVIII — obstáculo de máxima prioridad.',
      },
    },
    {
      id: 'cc2',
      name: 'VITAL VITAFIT',
      holder: 'ALFONSO VILLANUEVA VALENCIANO',
      holderCountry: 'Mexico',
      holderType: 'persona_fisica_mx',
      classNum: 5,
      status: 'registrado',
      filingDate: '2018-07-22',
      registrationDate: '2020-01-15',
      similarityScore: 91,
      expediente: 'MX/E/2018/034212',
      registrationNumber: '1689340',
      goodsServices: 'Nutritional supplements; dietary preparations; vitamins; health beverages.',
      marciaUrl: 'https://marcia.impi.gob.mx/marcas/search/quick',
      whyItMatters: {
        en: 'VITAFIT appears as the dominant element within VITAL VITAFIT. Class 5 goods overlap substantially. This mark is part of a 3-mark defensive portfolio held by the same individual — signals active trademark protection strategy.',
        es: 'VITAFIT es el elemento dominante dentro de VITAL VITAFIT. Superposición sustancial de productos en clase 5. Esta marca forma parte de un portafolio defensivo de 3 marcas del mismo titular — señal de estrategia activa de protección marcaria.',
      },
    },
    {
      id: 'cc3',
      name: 'VITAL-FIT',
      holder: 'ALFONSO VILLANUEVA VALENCIANO',
      holderCountry: 'Mexico',
      holderType: 'persona_fisica_mx',
      classNum: 5,
      status: 'registrado',
      filingDate: '2017-04-10',
      registrationDate: '2019-03-28',
      similarityScore: 87,
      expediente: 'MX/E/2017/019845',
      registrationNumber: '1654210',
      goodsServices: 'Nutritional supplements; dietary preparations; protein powders.',
      marciaUrl: 'https://marcia.impi.gob.mx/marcas/search/quick',
      whyItMatters: {
        en: 'Phonetically near-identical (VITAL-FIT ≈ VITAFIT). Same holder as VITAL VITAFIT — part of the same defensive cluster in class 5.',
        es: 'Fonéticamente casi idéntica (VITAL-FIT ≈ VITAFIT). Mismo titular que VITAL VITAFIT — parte del mismo clúster defensivo en clase 5.',
      },
    },
    {
      id: 'cc4',
      name: 'VIVA-FIT',
      holder: 'ALFONSO VILLANUEVA VALENCIANO',
      holderCountry: 'Mexico',
      holderType: 'persona_fisica_mx',
      classNum: 5,
      status: 'en_tramite',
      filingDate: '2023-09-14',
      similarityScore: 82,
      expediente: 'MX/E/2023/087631',
      goodsServices: 'Dietary supplements; nutritional preparations.',
      marciaUrl: 'https://marcia.impi.gob.mx/marcas/search/quick',
      whyItMatters: {
        en: 'Third mark in the same individual\'s class 5 cluster. Still pending, but demonstrates ongoing defensive filing behavior. VITA/FIT phonetic core shared.',
        es: 'Tercera marca del mismo clúster individual en clase 5. Aún en trámite, pero demuestra conducta continua de registro defensivo. Comparte el núcleo fonético VITA/FIT.',
      },
    },
  ],
  significantConflicts: [
    {
      id: 'sc1',
      name: 'VITAFORM',
      holder: 'PRODUCTOS NATURALES DEL SURESTE S.A. DE C.V.',
      holderCountry: 'Mexico',
      holderType: 'persona_moral_mx',
      classNum: 5,
      status: 'registrado',
      filingDate: '2016-11-03',
      registrationDate: '2018-04-20',
      similarityScore: 74,
      expediente: 'MX/E/2016/055221',
      registrationNumber: '1612345',
      goodsServices: 'Dietary supplements; vitamins; health preparations.',
      marciaUrl: 'https://marcia.impi.gob.mx/marcas/search/quick',
      whyItMatters: {
        en: 'Shares the VITA- prefix in class 5. Phonetically close; visual composition structurally similar. Mexican company — lower but real enforcement risk.',
        es: 'Comparte el prefijo VITA- en clase 5. Fonéticamente próxima; composición visual estructuralmente similar. Empresa mexicana — riesgo de enforcement menor pero real.',
      },
    },
    {
      id: 'sc2',
      name: 'FIT & HEALTH',
      holder: 'GRUPO FARMACÉUTICO ALPES S.A. DE C.V.',
      holderCountry: 'Mexico',
      holderType: 'persona_moral_mx',
      classNum: 5,
      status: 'registrado',
      filingDate: '2019-02-18',
      registrationDate: '2021-06-07',
      similarityScore: 63,
      expediente: 'MX/E/2019/011234',
      registrationNumber: '1741230',
      goodsServices: 'Dietary supplements; protein powders; sports nutrition.',
      marciaUrl: 'https://marcia.impi.gob.mx/marcas/search/quick',
      whyItMatters: {
        en: 'Shares FIT element in class 5. Conceptual overlap — both marks reference fitness and health in the nutraceutical space.',
        es: 'Comparte el elemento FIT en clase 5. Superposición conceptual — ambas marcas aluden a fitness y salud en el espacio nutracéutico.',
      },
    },
    {
      id: 'sc3',
      name: 'VITASPORT',
      holder: 'NUTRICIÓN DEPORTIVA AZTECA S.A. DE C.V.',
      holderCountry: 'Mexico',
      holderType: 'persona_moral_mx',
      classNum: 5,
      status: 'registrado',
      filingDate: '2014-08-30',
      registrationDate: '2016-03-12',
      similarityScore: 58,
      expediente: 'MX/E/2014/043211',
      registrationNumber: '1489320',
      goodsServices: 'Sports nutrition supplements; protein powders; vitamins; mineral supplements.',
      marciaUrl: 'https://marcia.impi.gob.mx/marcas/search/quick',
      whyItMatters: {
        en: 'VITA- prefix shared. Class 5 sports nutrition overlap. Conceptual field (vita + active lifestyle) partially overlaps VITAFIT.',
        es: 'Comparte prefijo VITA-. Superposición en nutrición deportiva clase 5. Campo conceptual (vita + estilo de vida activo) se superpone parcialmente con VITAFIT.',
      },
    },
  ],
  backgroundConflicts: [
    { id: 'bg1', name: 'VITAPLUS', holder: 'LABORATORIOS OMEGA S.A. DE C.V.', holderCountry: 'Mexico', holderType: 'persona_moral_mx', classNum: 5, status: 'registrado', similarityScore: 44, whyItMatters: { en: 'VITA- prefix; different suffix. Lower risk.', es: 'Prefijo VITA-; sufijo diferente. Riesgo menor.' } },
    { id: 'bg2', name: 'FITMAX', holder: 'DISTRIBUIDORA NUTRIFIT S.A. DE C.V.', holderCountry: 'Mexico', holderType: 'persona_moral_mx', classNum: 5, status: 'registrado', similarityScore: 38, whyItMatters: { en: 'FIT element shared; distinct prefix. Background noise.', es: 'Elemento FIT compartido; prefijo diferente. Ruido de fondo.' } },
    { id: 'bg3', name: 'BIOFITA', holder: 'COSMÉTICOS NATURALES S.A.', holderCountry: 'Mexico', holderType: 'persona_moral_mx', classNum: 3, status: 'registrado', similarityScore: 32, whyItMatters: { en: 'FIT(A) phonetic fragment in class 3; different goods.', es: 'Fragmento fonético FIT(A) en clase 3; productos distintos.' } },
    { id: 'bg4', name: 'VITALIFE', holder: 'GRUPO SALUD INTEGRAL S.A. DE C.V.', holderCountry: 'Mexico', holderType: 'persona_moral_mx', classNum: 5, status: 'caducado', similarityScore: 28, whyItMatters: { en: 'VITA- prefix; lapsed — no current block.', es: 'Prefijo VITA-; caducada — sin bloqueo actual.' } },
    { id: 'bg5', name: 'FITNATION', holder: 'SERVICIOS DE SALUD Y BIENESTAR S.A.', holderCountry: 'Mexico', holderType: 'persona_moral_mx', classNum: 41, status: 'registrado', similarityScore: 22, whyItMatters: { en: 'FIT element; class 41 services — different field.', es: 'Elemento FIT; servicios clase 41 — campo distinto.' } },
  ],
  holderClusters: [
    {
      holder: 'ALFONSO VILLANUEVA VALENCIANO',
      marks: ['VITAL VITAFIT', 'VITAL-FIT', 'VIVA-FIT'],
      clusterType: 'individual_mx',
      note: {
        en: 'This Mexican individual holds 3 marks in this conflict set across class 5 (VITAL VITAFIT reg. 1689340, VITAL-FIT reg. 1654210, VIVA-FIT pending). This pattern strongly suggests a deliberate defensive trademark family built around the VITA/FIT lexical field in class 5, creating elevated opposition risk from multiple angles.',
        es: 'Este titular mexicano posee 3 marcas en este conjunto de conflictos dentro de la clase 5 (VITAL VITAFIT reg. 1689340, VITAL-FIT reg. 1654210, VIVA-FIT en trámite). Este patrón indica fuertemente una familia de marcas defensivas construida intencionalmente alrededor del campo léxico VITA/FIT en clase 5, generando un riesgo de oposición elevado desde múltiples frentes.',
      },
    },
    {
      holder: 'LIDL STIFTUNG & CO. KG',
      marks: ['VITAFIT'],
      clusterType: 'multinational',
      note: {
        en: 'LIDL STIFTUNG & CO. KG is one of Germany\'s largest retail conglomerates, with annual revenues exceeding €130 billion and an active global trademark enforcement program. Its ownership of an identical VITAFIT registration in class 5 (reg. 1523890) means any attempt to register this mark in Mexico will almost certainly face both IMPI refusal and a funded opposition or nullity action.',
        es: 'LIDL STIFTUNG & CO. KG es uno de los conglomerados minoristas más grandes de Alemania, con ingresos anuales superiores a €130 mil millones y un programa activo de enforcement de marcas a nivel global. Su titularidad de un registro idéntico de VITAFIT en clase 5 (reg. 1523890) significa que cualquier intento de registrar esta marca en México casi con certeza enfrentará tanto el rechazo del IMPI como una oposición o acción de nulidad financiada.',
      },
    },
  ],
  elementDecomposition: [
    {
      element: 'VITA',
      meaning: { en: '"Life" — from Latin vita (life, vitality, living being)', es: '"Vida" — del latín vita (vida, vitalidad, ser vivo)' },
      etymology: { en: 'Latin root vita → Spanish vida / Italian vita. Used extensively in pharmaceutical and supplement branding since the early 20th century.', es: 'Raíz latina vita → español vida / italiano vita. De uso extensivo en marcas farmacéuticas y de suplementos desde principios del siglo XX.' },
      saturationClass: 94,
      saturationAll: 312,
      tier: 'descriptive',
      contribution: { en: 'Strongly descriptive for class 5 health goods. Provides minimal distinctiveness. IMPI routinely discounts VITA- as a common prefix in this class.', es: 'Fuertemente descriptivo para bienes de salud de clase 5. Aporta distintividad mínima. El IMPI descuenta rutinariamente VITA- como prefijo común en esta clase.' },
    },
    {
      element: 'FIT',
      meaning: { en: '"Physically fit / in good shape" — from English fit, also used in Spanish slang for fitness', es: '"En forma / apto físicamente" — del inglés fit, también usado en español coloquial para referirse a la condición física' },
      etymology: { en: 'Old English fitt (well-suited); modern English/Spanish blend now common in fitness branding. Widely adopted in health and supplement marks globally.', es: 'Inglés antiguo fitt (bien adaptado); mezcla moderno inglés/español ahora común en marcas de fitness. Ampliamente adoptado en marcas de salud y suplementos globalmente.' },
      saturationClass: 78,
      saturationAll: 247,
      tier: 'descriptive',
      contribution: { en: 'Descriptive of a key function (fitness) of class 5 dietary supplements. When combined with VITA, the combined descriptiveness is additive, not diluted.', es: 'Descriptivo de una función clave (aptitud física) de los suplementos alimenticios de clase 5. Al combinarse con VITA, la descriptividad combinada es aditiva, no se diluye.' },
    },
  ],
  combinedVerdictNote: {
    en: 'The additive effect of VITA + FIT renders the combined mark more descriptive than either element alone. Rather than creating a "new impression" that might generate distinctiveness, the compound directly and unambiguously communicates "life-fitness supplements." This is the paradigmatic descriptive compound that IMPI refuses under Art. 173 Fr. IV, and the field is further saturated by 94 class-5 registrations containing VITA and 78 containing FIT.',
    es: 'El efecto aditivo de VITA + FIT hace que la marca combinada sea más descriptiva que cualquiera de sus elementos por sí solo. En lugar de crear una "nueva impresión" que pudiera generar distintividad, el compuesto comunica directa e inequívocamente "suplementos de vida y forma física". Este es el tipo paradigmático de compuesto descriptivo que el IMPI rechaza bajo el Art. 173 Fr. IV, y el campo está adicionalmente saturado con 94 registros de clase 5 que contienen VITA y 78 que contienen FIT.',
  },
  axisScores: {
    distintividadInherente: 18,
    disponibilidadRegistral: 5,
    saturacionCampo: 12,
    cumplimientoArt173: 35,
    riesgoOposicion: 8,
  },
  confundibilidad: [
    {
      id: 'cf1',
      title: { en: 'a. Phonetic Similarity', es: 'a. Similitud Fonética' },
      question: { en: 'Does the proposed mark sound like any existing mark in the same class?', es: '¿La marca propuesta suena como alguna marca existente en la misma clase?' },
      verdict: 'desfavorable',
      cite: 'LFPPI Art. 173 Fr. XVIII; TFJA tesis aislada VIII-P-1aS-471 (fonética como criterio primario)',
      analysis: {
        en: 'VITAFIT is phonetically identical to the registered mark VITAFIT (LIDL STIFTUNG, reg. 1523890). Top-3 closest sounding marks in class 5: (1) VITAFIT — 100% match; (2) VITAL-FIT — ~87% phonetic similarity (VITAL = /vɪtəl/ vs VITA = /viːtə/, FIT identical); (3) VIVA-FIT — ~78% (VIVA ≈ VITA in rapid speech). Mexican examiners apply a "global impression" test under LFPPI, giving primary weight to phonetic identity. Identity on this criterion alone is sufficient for refusal.',
        es: 'VITAFIT es fonéticamente idéntico a la marca registrada VITAFIT (LIDL STIFTUNG, reg. 1523890). Las 3 marcas de clase 5 fonéticamente más próximas: (1) VITAFIT — 100% de coincidencia; (2) VITAL-FIT — ~87% de similitud fonética (VITAL = /vɪtəl/ vs VITA = /viːtə/, FIT idéntico); (3) VIVA-FIT — ~78% (VIVA ≈ VITA en el habla rápida). Los examinadores mexicanos aplican el criterio de "impresión global" bajo la LFPPI, otorgando peso primario a la identidad fonética. La identidad en este criterio es por sí sola suficiente para la negativa.',
      },
      consequence: {
        en: 'IMPI will identify phonetic identity with LIDL\'s VITAFIT as a standalone ground for refusal under Art. 173 Fr. XVIII. No further analysis required to trigger refusal.',
        es: 'El IMPI identificará la identidad fonética con el VITAFIT de LIDL como causal autónoma de negativa bajo el Art. 173 Fr. XVIII. No se requiere análisis adicional para activar la negativa.',
      },
    },
    {
      id: 'cf2',
      title: { en: 'b. Visual / Graphic Similarity', es: 'b. Similitud Gráfica/Visual' },
      question: { en: 'Does the proposed mark look like any existing mark in the same class?', es: '¿La marca propuesta se parece visualmente a alguna marca existente en la misma clase?' },
      verdict: 'desfavorable',
      cite: 'LFPPI Art. 173 Fr. XVIII; criterio morfológico IMPI (composición, longitud, estructura silábica)',
      analysis: {
        en: 'Proposed VITAFIT: 7 characters, 3 syllables (VI-TA-FIT), single word block. Prior VITAFIT (LIDL): identical. Character-by-character: V-I-T-A-F-I-T = 100% graphical overlap on the word mark. Even if the proposed mark is filed as a mixed mark with design elements, the word component VITAFIT remains identical and IMPI will still apply the Fr. XVIII bar. Compared to VITAL VITAFIT: the string "VITAFIT" appears verbatim as the second component — dominant element doctrine applies.',
        es: 'VITAFIT propuesto: 7 caracteres, 3 sílabas (VI-TA-FIT), bloque de una sola palabra. VITAFIT anterior (LIDL): idéntico. Comparación carácter por carácter: V-I-T-A-F-I-T = 100% de coincidencia gráfica en la marca denominativa. Incluso si la marca propuesta se presenta como marca mixta con elementos de diseño, el componente denominativo VITAFIT permanece idéntico y el IMPI seguirá aplicando la barrera Fr. XVIII. Comparado con VITAL VITAFIT: la cadena "VITAFIT" aparece literalmente como segundo componente — aplica la doctrina del elemento dominante.',
      },
      consequence: {
        en: 'Graphically identical to LIDL\'s registered mark. A design element can reduce descriptiveness risk (Fr. IV) but cannot cure graphic identity with a prior registration (Fr. XVIII).',
        es: 'Gráficamente idéntico a la marca registrada de LIDL. Un elemento de diseño puede reducir el riesgo de descriptividad (Fr. IV) pero no puede subsanar la identidad gráfica con un registro previo (Fr. XVIII).',
      },
    },
    {
      id: 'cf3',
      title: { en: 'c. Conceptual / Ideological Similarity', es: 'c. Similitud Conceptual/Ideológica' },
      question: { en: 'Do the marks evoke the same idea or meaning in the consumer\'s mind?', es: '¿Las marcas evocan la misma idea o significado en la mente del consumidor?' },
      verdict: 'desfavorable',
      cite: 'LFPPI Art. 173 Fr. XVIII; TFJA tesis 2a./J. 22/2012 (similitud ideológica)',
      analysis: {
        en: 'Both VITAFIT marks evoke an identical concept: "life (vita) + physical fitness (fit)" = a lifestyle supplement that promotes vitality and fitness. No conceptual distance separates the marks. The TFJA has held that conceptual identity between marks covering the same goods constitutes confusing similarity even absent phonetic or visual identity. Here, all three similarity types converge, making the conceptual finding superfluous but confirmatory.',
        es: 'Ambas marcas VITAFIT evocan un concepto idéntico: "vida (vita) + condición física (fit)" = un suplemento de estilo de vida que promueve la vitalidad y la aptitud física. No existe distancia conceptual entre las marcas. El TFJA ha sostenido que la identidad conceptual entre marcas que cubren los mismos bienes constituye similitud confundible incluso sin identidad fonética o visual. Aquí, los tres tipos de similitud convergen, haciendo que el hallazgo conceptual sea superfluo pero confirmatorio.',
      },
      consequence: {
        en: 'Conceptual identity adds a third independent ground for refusal under Fr. XVIII in addition to phonetic and visual identity.',
        es: 'La identidad conceptual añade una tercera causal independiente de negativa bajo Fr. XVIII, además de la identidad fonética y visual.',
      },
    },
    {
      id: 'cf4',
      title: { en: 'd. Products / Services Identity', es: 'd. Identidad de Productos/Servicios' },
      question: { en: 'Are the proposed goods in the same Nice class and commercial channel as the prior mark\'s goods?', es: '¿Los productos propuestos están en la misma clase Niza y canal comercial que los de la marca anterior?' },
      verdict: 'desfavorable',
      cite: 'LFPPI Art. 173 Fr. XVIII (identidad de productos); Niza Classification 12th ed. Cl. 5',
      analysis: {
        en: 'Both the proposed application and LIDL\'s registration cover class 5 dietary supplements, vitamins, mineral preparations, and protein/slimming products. The goods are not merely in the same class — they are substantively identical at the product level. Commercial channel overlap is complete: both marks would compete in pharmacies, health-food stores, gyms, and online supplement retailers targeting Mexican consumers.',
        es: 'Tanto la solicitud propuesta como el registro de LIDL cubren suplementos alimenticios de clase 5, vitaminas, preparaciones minerales y productos de proteínas/adelgazamiento. Los bienes no son meramente de la misma clase — son sustancialmente idénticos a nivel de producto. La superposición de canales comerciales es total: ambas marcas competirían en farmacias, tiendas naturistas, gimnasios y minoristas de suplementos en línea dirigidos a consumidores mexicanos.',
      },
      consequence: {
        en: 'Class identity combined with product-level identity eliminates any "different field" defense. This is the strongest possible product proximity scenario.',
        es: 'La identidad de clase combinada con la identidad a nivel de producto elimina cualquier defensa de "campo diferente". Este es el escenario de proximidad de productos más sólido posible.',
      },
    },
    {
      id: 'cf5',
      title: { en: 'e. Dominant Element', es: 'e. Elemento Dominante' },
      question: { en: 'What is the dominant element of the proposed mark, and does it coincide with the dominant element of prior marks?', es: '¿Cuál es el elemento dominante de la marca propuesta y coincide con el elemento dominante de las marcas anteriores?' },
      verdict: 'desfavorable',
      cite: 'TFJA tesis VIII-P-SS-303 (elemento dominante); SCJN 1a./J. 78/2015 (impresión global); LFPPI Art. 173 Fr. XVIII',
      analysis: {
        en: 'The dominant element of VITAFIT is the entire word VITAFIT — it is a single-word mark with no secondary elements. Under Mexican dominant-element doctrine (TFJA tesis VIII-P-SS-303), the analysis focuses on the component that most strongly distinguishes the mark from others or most strongly anchors consumer memory. Here, the entire word is the dominant element. For marks like VITAL VITAFIT, the dominant element is the second word VITAFIT because it is placed last and carries the highest recall weight. The SCJN\'s "impresión global" (global impression) doctrine leads to the same result: a consumer seeing both VITAFIT marks would form a single, indistinguishable overall impression.',
        es: 'El elemento dominante de VITAFIT es la palabra completa VITAFIT — es una marca de una sola palabra sin elementos secundarios. Bajo la doctrina mexicana del elemento dominante (TFJA tesis VIII-P-SS-303), el análisis se centra en el componente que más fuertemente distingue la marca de otras o más fuertemente ancla la memoria del consumidor. Aquí, toda la palabra es el elemento dominante. Para marcas como VITAL VITAFIT, el elemento dominante es la segunda palabra VITAFIT porque se coloca al final y tiene el mayor peso de recuperación. La doctrina de "impresión global" de la SCJN lleva al mismo resultado: un consumidor que vea ambas marcas VITAFIT formaría una única e indistinguible impresión global.',
      },
      consequence: {
        en: 'The dominant element of the proposed mark is identical to the dominant element in three critical prior marks. This is a textbook dominant-element conflict under LFPPI Art. 173 Fr. XVIII.',
        es: 'El elemento dominante de la marca propuesta es idéntico al elemento dominante en tres marcas anteriores críticas. Este es un caso de manual de conflicto por elemento dominante bajo el Art. 173 Fr. XVIII LFPPI.',
      },
    },
    {
      id: 'cf6',
      title: { en: 'f. Relevant Consumer Standard', es: 'f. Consumidor Medio' },
      question: { en: 'Who is the relevant consumer and how carefully do they purchase these goods?', es: '¿Quién es el consumidor relevante y con qué nivel de atención compra estos bienes?' },
      verdict: 'desfavorable',
      cite: 'TFJA tesis 2a./J. 22/2012 (consumidor medio razonablemente atento); LFPPI Art. 173 Fr. XVIII',
      analysis: {
        en: 'Class 5 dietary supplements in Mexico are sold to the general mass-market consumer — not medical professionals. The standard consumer purchases at pharmacies (Farmacias Guadalajara, Farmacias del Ahorro), gyms, and online platforms. Mexican courts and IMPI apply the "consumidor medio razonablemente atento" (reasonably attentive average consumer) standard, which is not a medical specialist or expert. For VITAFIT-type marks, the relevant consumer would pay moderate attention at point of sale but is unlikely to scrutinize all prior registrations before purchase. This is a low-attention purchase context that favors finding of confusion.',
        es: 'Los suplementos alimenticios de clase 5 en México se venden al consumidor masivo general — no a profesionales médicos. El consumidor estándar compra en farmacias (Farmacias Guadalajara, Farmacias del Ahorro), gimnasios y plataformas en línea. Los tribunales mexicanos y el IMPI aplican el estándar del "consumidor medio razonablemente atento", que no es un especialista o experto médico. Para marcas tipo VITAFIT, el consumidor relevante prestaría atención moderada en el punto de venta, pero es poco probable que escudriñe todos los registros anteriores antes de comprar. Este es un contexto de compra de baja atención que favorece el hallazgo de confusión.',
      },
      consequence: {
        en: 'A mass-market consumer standard applies. Lower consumer attention heightens confusion risk and weighs against registrability.',
        es: 'Aplica el estándar del consumidor masivo. Menor atención del consumidor aumenta el riesgo de confusión y pesa en contra de la registrabilidad.',
      },
    },
    {
      id: 'cf7',
      title: { en: 'g. Prior Coexistence or Saturation', es: 'g. Coexistencia Previa o Saturación' },
      question: { en: 'Does the prior register show genuine peaceful coexistence, or does saturation actually harm the applicant?', es: '¿El registro previo muestra coexistencia pacífica genuina, o la saturación perjudica al solicitante?' },
      verdict: 'desfavorable',
      cite: 'LFPPI Art. 173 Fr. IV (campo saturado como factor agravante); doctrina IMPI sobre saturación',
      analysis: {
        en: 'IMPI records show 94 class-5 registrations containing VITA and 78 containing FIT — a heavily saturated namespace. However, saturation in this context works against the applicant, not for it. When an element is saturated (common in the field), it cannot function as a distinctive badge of origin, weakening the applicant\'s ability to argue secondary meaning. Furthermore, multiple active registrants in this space (LIDL, Villanueva Valenciano, Nutrición Deportiva Azteca) each have independent motivation to oppose. Peaceful coexistence cannot be argued because the identical mark (LIDL\'s VITAFIT) has not been abandoned.',
        es: 'Los registros del IMPI muestran 94 registros de clase 5 que contienen VITA y 78 que contienen FIT — un espacio de nombres altamente saturado. Sin embargo, la saturación en este contexto trabaja en contra del solicitante, no a su favor. Cuando un elemento está saturado (común en el campo), no puede funcionar como indicador distintivo de origen, debilitando la capacidad del solicitante para argumentar distintividad adquirida. Además, múltiples titulares activos en este espacio (LIDL, Villanueva Valenciano, Nutrición Deportiva Azteca) tienen motivación independiente para oponerse. No se puede argumentar coexistencia pacífica porque la marca idéntica (VITAFIT de LIDL) no ha sido abandonada.',
      },
      consequence: {
        en: 'Field saturation in this case compounds both the Fr. IV absolute bar and the Fr. XVIII relative bar. It cannot be used as a coexistence argument.',
        es: 'La saturación del campo en este caso agrava tanto el impedimento absoluto Fr. IV como el impedimento relativo Fr. XVIII. No puede utilizarse como argumento de coexistencia.',
      },
    },
  ],
  fracciones: [
    { num: 'I', question: { en: 'Is the mark a generic name for the goods?', es: '¿La marca es un nombre genérico de los productos?' }, verdict: 'caution', statuteEs: 'Art. 173 Fr. I: Las denominaciones genéricas de los productos o servicios, o las meramente descriptivas de la naturaleza, calidad, cantidad, composición, destino, valor, lugar de origen o época de producción.', analysis: { en: 'VITAFIT is not purely generic (VITAMINAS would be), but the combination of two generic-adjacent terms (vita = life, fit = fitness) places it at the descriptive/generic border. An IMPI examiner could characterize it as a generic-adjacent compound for class 5 health goods.', es: 'VITAFIT no es puramente genérico (VITAMINAS lo sería), pero la combinación de dos términos adyacentes a lo genérico (vita = vida, fit = aptitud) lo sitúa en la frontera descriptivo/genérico. Un examinador del IMPI podría caracterizarlo como compuesto adyacente a lo genérico para bienes de salud de clase 5.' }, consequence: { en: 'Caution: borderline with Fr. IV descriptiveness. IMPI may cite both grounds.', es: 'Precaución: limítrofe con la descriptividad Fr. IV. El IMPI puede citar ambas causales.' } },
    { num: 'II', question: { en: 'Is the mark a technical or common trade name for the goods?', es: '¿La marca es denominación técnica o usual de los productos?' }, verdict: 'pass', statuteEs: 'Art. 173 Fr. II: Las denominaciones técnicas o de uso común de los productos o servicios para los que se pretende registrar la marca.', analysis: { en: 'VITAFIT is not an established technical trade name or common commercial name in the dietary supplement industry. Passes this ground.', es: 'VITAFIT no es un nombre técnico ni denominación usual establecida en la industria de suplementos alimenticios. Supera esta causal.' }, consequence: { en: 'No issue under Fr. II.', es: 'Sin problema bajo Fr. II.' } },
    { num: 'III', question: { en: 'Is the mark a three-dimensional form that is functional or ornamental?', es: '¿La marca es una forma tridimensional funcional u ornamental?' }, verdict: 'na', statuteEs: 'Art. 173 Fr. III: La forma tridimensional que sea del dominio público, o que se haya hecho de uso común.', analysis: { en: 'Not applicable — VITAFIT is a word mark, not a 3D form.', es: 'No aplica — VITAFIT es una marca denominativa, no una forma tridimensional.' }, consequence: { en: 'N/A — word mark.', es: 'N/A — marca denominativa.' } },
    { num: 'IV', question: { en: 'Does the mark describe the goods\' nature, quality, destination, or other characteristic?', es: '¿La marca describe la naturaleza, calidad, destino u otras características de los productos?' }, verdict: 'fail', statuteEs: 'Art. 173 Fr. IV: Las que reproduzcan o imiten, sin autorización, escudos de armas, banderas o emblemas de cualquier país, estado, municipio o división política equivalente, o las denominaciones, siglas, símbolos o emblemas de organizaciones internacionales intergubernamentales.', analysis: { en: 'VITA (life/vitality) + FIT (physical fitness) directly and unambiguously describe the primary attributes and purpose of class 5 dietary supplements and nutraceuticals. The composite communicates the product\'s nature (life-enhancing, fitness-promoting supplement) without any intermediate mental step. This is the paradigmatic descriptive compound that IMPI refuses under Art. 173 Fr. IV. Secondary meaning evidence would be required to overcome this bar, and no such evidence has been submitted.', es: 'VITA (vida/vitalidad) + FIT (aptitud física) describen directa e inequívocamente los atributos principales y el propósito de los suplementos alimenticios y nutracéuticos de clase 5. El compuesto comunica la naturaleza del producto (suplemento potenciador de la vida y promotor de la aptitud física) sin ningún paso mental intermedio. Este es el compuesto descriptivo paradigmático que el IMPI rechaza bajo el Art. 173 Fr. IV. Se requeriría evidencia de distintividad adquirida para superar esta barrera, y no se ha presentado tal evidencia.' }, consequence: { en: 'FAIL: Direct absolute bar. This ground alone is sufficient for IMPI to refuse the application.', es: 'FALLA: Impedimento absoluto directo. Esta causal por sí sola es suficiente para que el IMPI rechace la solicitud.' } },
    { num: 'V', question: { en: 'Is the mark deceptive about the nature or origin of the goods?', es: '¿La marca induce a engaño sobre la naturaleza u origen de los productos?' }, verdict: 'caution', statuteEs: 'Art. 173 Fr. V: Las que sean susceptibles de engañar al público o inducirlo a error, entendiéndose por tales las que constituyan falsas indicaciones sobre la naturaleza, composición, cualidades o aptitud para el empleo de los productos o servicios de que se trate.', analysis: { en: 'If the applicant\'s product does not actually improve fitness or vitality, the name VITAFIT could be considered deceptive (falsely implying health benefits). A caution flag, not outright fail, as IMPI typically gives the applicant the benefit of the doubt on product function claims unless there is specific evidence of deception.', es: 'Si el producto del solicitante no mejora realmente la aptitud física o la vitalidad, el nombre VITAFIT podría considerarse engañoso (implicando falsamente beneficios para la salud). Es una señal de precaución, no una falla directa, ya que el IMPI normalmente da al solicitante el beneficio de la duda sobre las afirmaciones de función del producto, a menos que exista evidencia específica de engaño.' }, consequence: { en: 'Caution: flag for substantive examination if product claims are unsubstantiated.', es: 'Precaución: señalado para examen sustantivo si las afirmaciones del producto no están sustentadas.' } },
    { num: 'VI', question: { en: 'Is the mark a translation or phonetic variant of a prior well-known mark?', es: '¿La marca es traducción o variante fonética de una marca notoria preexistente?' }, verdict: 'pass', statuteEs: 'Art. 173 Fr. VI: Las traducciones a otros idiomas, la variación ortográfica caprichosa o la construcción artificial de palabras no registrables.', analysis: { en: 'VITAFIT is not a translation of another registered mark. VITA is a Latin root, not a translation of an existing brand. Passes this ground.', es: 'VITAFIT no es traducción de otra marca registrada. VITA es una raíz latina, no una traducción de una marca existente. Supera esta causal.' }, consequence: { en: 'No issue under Fr. VI.', es: 'Sin problema bajo Fr. VI.' } },
    { num: 'VII', question: { en: 'Does the mark reproduce the name of a living known person without consent?', es: '¿La marca reproduce el nombre de una persona conocida viva sin su consentimiento?' }, verdict: 'na', statuteEs: 'Art. 173 Fr. VII: Los nombres civiles y sus seudónimos, caricaturas o retratos de personas, sin su consentimiento, o el de sus herederos hasta en cuarto grado.', analysis: { en: 'VITAFIT is not a personal name or portrait. N/A.', es: 'VITAFIT no es un nombre personal ni un retrato. N/A.' }, consequence: { en: 'N/A.', es: 'N/A.' } },
    { num: 'VIII', question: { en: 'Does the mark reproduce the name of a deceased person without heir consent?', es: '¿La marca reproduce el nombre de una persona fallecida sin consentimiento de sus herederos?' }, verdict: 'na', statuteEs: 'Art. 173 Fr. VIII: Los nombres, seudónimos, figuras o retratos de personas cuya fama sea tal que su empleo pueda interpretarse como una indicación del origen de los productos o servicios.', analysis: { en: 'Not applicable — VITAFIT does not reference any historical person.', es: 'No aplicable — VITAFIT no hace referencia a ninguna persona histórica.' }, consequence: { en: 'N/A.', es: 'N/A.' } },
    { num: 'IX', question: { en: 'Does the mark reproduce the national flag, coat of arms, or official emblems?', es: '¿La marca reproduce la bandera nacional, escudo de armas o emblemas oficiales?' }, verdict: 'na', statuteEs: 'Art. 173 Fr. IX: Las denominaciones, figuras o formas tridimensionales, iguales o semejantes a las que el gobierno tenga la obligación de reservar para uso oficial.', analysis: { en: 'No official emblems or flags present. N/A.', es: 'Sin emblemas oficiales ni banderas. N/A.' }, consequence: { en: 'N/A.', es: 'N/A.' } },
    { num: 'X', question: { en: 'Does the mark reproduce official symbols or insignia of international organizations?', es: '¿La marca reproduce símbolos o insignias de organizaciones internacionales?' }, verdict: 'na', statuteEs: 'Art. 173 Fr. X: Los signos o sellos oficiales de control y garantía adoptados por el Estado.', analysis: { en: 'No international organization symbols present. N/A.', es: 'Sin símbolos de organizaciones internacionales. N/A.' }, consequence: { en: 'N/A.', es: 'N/A.' } },
    { num: 'XI', question: { en: 'Does the mark reproduce a protected geographical indication?', es: '¿La marca reproduce una indicación geográfica protegida?' }, verdict: 'na', statuteEs: 'Art. 173 Fr. XI: Las denominaciones de origen protegidas, así como las que puedan crear confusión con ellas.', analysis: { en: 'VITA and FIT are not protected geographical indications. N/A.', es: 'VITA y FIT no son indicaciones geográficas protegidas. N/A.' }, consequence: { en: 'N/A.', es: 'N/A.' } },
    { num: 'XII', question: { en: 'Does the mark violate public order or accepted morality?', es: '¿La marca viola el orden público o las buenas costumbres?' }, verdict: 'pass', statuteEs: 'Art. 173 Fr. XII: Las contrarias al orden público, a la moral o a las buenas costumbres.', analysis: { en: 'VITAFIT does not violate public order, morality, or accepted customs. Passes.', es: 'VITAFIT no viola el orden público, la moral ni las buenas costumbres. Supera.' }, consequence: { en: 'No issue under Fr. XII.', es: 'Sin problema bajo Fr. XII.' } },
    { num: 'XIII', question: { en: 'Is the mark an isolated color without distinctive form?', es: '¿La marca es un color aislado sin forma distintiva?' }, verdict: 'na', statuteEs: 'Art. 173 Fr. XIII: Los colores aislados, a no ser que estén combinados o acompañados de elementos, como signos, diseños o denominaciones, que les den un carácter distintivo.', analysis: { en: 'Word mark — no color-only element. N/A.', es: 'Marca denominativa — sin elemento de color aislado. N/A.' }, consequence: { en: 'N/A.', es: 'N/A.' } },
    { num: 'XIV', question: { en: 'Does the mark lack distinctiveness for the non-traditional mark type claimed?', es: '¿La marca carece de distintividad para el tipo de marca no tradicional solicitado?' }, verdict: 'na', statuteEs: 'Art. 173 Fr. XIV: Los sonidos, olores, sabores, texturas y otros signos perceptibles por los sentidos que no sean susceptibles de ser representados en el registro.', analysis: { en: 'Word mark — no non-traditional sensory element. N/A.', es: 'Marca denominativa — sin elemento sensorial no tradicional. N/A.' }, consequence: { en: 'N/A.', es: 'N/A.' } },
    { num: 'XV', question: { en: 'Is the mark a plant variety name or animal breed registered by a competent authority?', es: '¿La marca es el nombre de una variedad vegetal o raza animal registrada?' }, verdict: 'na', statuteEs: 'Art. 173 Fr. XV: Las denominaciones de variedades vegetales y razas animales.', analysis: { en: 'Not a plant variety or animal breed name. N/A.', es: 'No es nombre de variedad vegetal ni raza animal. N/A.' }, consequence: { en: 'N/A.', es: 'N/A.' } },
    { num: 'XVI', question: { en: 'Does the mark reproduce a famous or notorious mark?', es: '¿La marca reproduce una marca notoria o famosa?' }, verdict: 'pass', statuteEs: 'Art. 173 Fr. XVI: Los signos que sean idénticos o semejantes en grado de confusión a una marca notoriamente conocida o famosa, independientemente de la clase.', analysis: { en: 'VITAFIT (LIDL) has not been officially declared a "notorious mark" by IMPI as of this search date. However, LIDL itself is a globally known retail brand. The specific VITAFIT sub-brand lacks a public notorious/famous mark declaration in Mexico.', es: 'VITAFIT (LIDL) no ha sido declarada oficialmente "marca notoria" por el IMPI a la fecha de esta búsqueda. Sin embargo, LIDL en sí es una marca minorista mundialmente conocida. La sub-marca específica VITAFIT carece de una declaración pública de marca notoria/famosa en México.' }, consequence: { en: 'No Fr. XVI issue for VITAFIT specifically, but monitor for LIDL\'s cross-class dilution claims.', es: 'Sin problema Fr. XVI para VITAFIT específicamente, pero monitorear posibles reclamaciones de dilución entre clases de LIDL.' } },
    { num: 'XVII', question: { en: 'Does the mark dilute or tarnish a famous mark across classes?', es: '¿La marca diluye o perjudica la reputación de una marca famosa en distintas clases?' }, verdict: 'pass', statuteEs: 'Art. 173 Fr. XVII: Los signos que constituyan una reproducción, imitación, traducción, transliteración o transcripción, total o parcial, de un signo distintivo notoriamente conocido en México o en el extranjero.', analysis: { en: 'Similar analysis to Fr. XVI — no formal famous-mark declaration found for VITAFIT (LIDL) in Mexico. Passes with the same caveat about monitoring LIDL\'s cross-class enforcement posture.', es: 'Análisis similar al Fr. XVI — no se encontró declaración formal de marca famosa para VITAFIT (LIDL) en México. Supera con la misma advertencia sobre monitorear la postura de enforcement entre clases de LIDL.' }, consequence: { en: 'No current Fr. XVII issue. Monitor.', es: 'Sin problema Fr. XVII actual. Monitorear.' } },
    { num: 'XVIII', question: { en: 'Is the mark confusingly similar to an existing registered mark for the same goods/services?', es: '¿La marca es confundiblemente similar con una marca registrada existente para los mismos productos/servicios?' }, verdict: 'fail', statuteEs: 'Art. 173 Fr. XVIII: Los signos que sean idénticos o semejantes en grado de confusión a otro previamente solicitado o registrado por un tercero, que ampare los mismos o similares productos o servicios.', analysis: { en: 'VITAFIT is phonetically, visually, and conceptually identical to VITAFIT (LIDL STIFTUNG & CO. KG, reg. 1523890, class 5). This is a textbook Fr. XVIII conflict. Additionally, VITAL VITAFIT (Villanueva Valenciano, reg. 1689340) and VITAL-FIT (reg. 1654210) create further Fr. XVIII conflicts where the dominant element VITAFIT/FIT is shared. The IMPI examiner will identify all three registrations and issue a refusal citing Fr. XVIII with respect to at least the LIDL registration.', es: 'VITAFIT es fonéticamente, visualmente y conceptualmente idéntico a VITAFIT (LIDL STIFTUNG & CO. KG, reg. 1523890, clase 5). Este es un conflicto Fr. XVIII de manual. Adicionalmente, VITAL VITAFIT (Villanueva Valenciano, reg. 1689340) y VITAL-FIT (reg. 1654210) generan conflictos Fr. XVIII adicionales donde el elemento dominante VITAFIT/FIT es compartido. El examinador del IMPI identificará los tres registros y emitirá una negativa citando Fr. XVIII con respecto al menos al registro de LIDL.' }, consequence: { en: 'FAIL: This is the primary registrability bar. Refusal is virtually certain under Fr. XVIII alone.', es: 'FALLA: Este es el impedimento de registrabilidad principal. La negativa es prácticamente segura bajo Fr. XVIII solo.' } },
    { num: 'XIX', question: { en: 'Is the mark similar to a previously applied-for mark (priority right) in the same class?', es: '¿La marca es similar a una marca previamente solicitada (derecho de preferencia) en la misma clase?' }, verdict: 'fail', statuteEs: 'Art. 173 Fr. XIX: Los signos que sean idénticos o semejantes en grado de confusión con una marca que ampare los mismos o similares productos o servicios cuyo registro haya sido solicitado con anterioridad.', analysis: { en: 'VIVA-FIT (Villanueva Valenciano, expediente MX/E/2023/087631) is currently pending for class 5 goods. If filed after this application\'s filing date, it would not take priority — but if filed before, its pending status gives it a preferential right under Fr. XIX. Also, any other pending VITA/FIT applications would create additional Fr. XIX bars.', es: 'VIVA-FIT (Villanueva Valenciano, expediente MX/E/2023/087631) está actualmente en trámite para productos de clase 5. Si se presentó después de la fecha de presentación de esta solicitud, no tendría prioridad — pero si se presentó antes, su estado pendiente le otorga un derecho preferente bajo Fr. XIX. Además, cualquier otra solicitud pendiente de VITA/FIT crearía barreras adicionales Fr. XIX.' }, consequence: { en: 'FAIL: Pending VIVA-FIT (Villanueva Valenciano) may constitute a Fr. XIX prior-right conflict depending on relative filing dates.', es: 'FALLA: El VIVA-FIT pendiente (Villanueva Valenciano) puede constituir un conflicto de derecho preferente Fr. XIX dependiendo de las fechas de presentación relativas.' } },
    { num: 'XX', question: { en: 'Does the mark reproduce a commercial name or trade name that is already in use?', es: '¿La marca reproduce un nombre comercial o denominación de origen ya en uso?' }, verdict: 'caution', statuteEs: 'Art. 173 Fr. XX: Los nombres comerciales y denominaciones o razones sociales que sean semejantes en grado de confusión a una marca solicitada o registrada por un tercero.', analysis: { en: 'If LIDL or any of the Mexican holders operate under a commercial name containing VITAFIT in Mexico, this would create a separate Fr. XX bar. Caution — commercial name registrations were not exhaustively checked in this search.', es: 'Si LIDL o cualquiera de los titulares mexicanos opera bajo un nombre comercial que contenga VITAFIT en México, esto crearía una barrera Fr. XX separada. Precaución — los registros de nombres comerciales no fueron comprobados exhaustivamente en esta búsqueda.' }, consequence: { en: 'Caution: conduct commercial-name search in IMPI before filing.', es: 'Precaución: realizar búsqueda de nombre comercial en el IMPI antes de presentar.' } },
    { num: 'XXI', question: { en: 'Does the mark contain a protected appellation of origin or geographical indication?', es: '¿La marca contiene una denominación de origen o indicación geográfica protegida?' }, verdict: 'na', statuteEs: 'Art. 173 Fr. XXI: Las denominaciones de origen y las indicaciones geográficas nacionales o extranjeras.', analysis: { en: 'VITA and FIT have no geographical association. N/A.', es: 'VITA y FIT no tienen asociación geográfica. N/A.' }, consequence: { en: 'N/A.', es: 'N/A.' } },
    { num: 'XXII', question: { en: 'Is there evidence that this application was filed in bad faith?', es: '¿Existe evidencia de que esta solicitud fue presentada de mala fe?' }, verdict: 'caution', statuteEs: 'Art. 173 Fr. XXII: Las que se pretendan registrar de mala fe, entendiéndose por ésta la solicitud de registro presentada con el conocimiento de que existe un signo idéntico o semejante en grado de confusión, previamente usado en el territorio nacional o en el extranjero.', analysis: { en: 'The proposed mark is identical to LIDL\'s registered VITAFIT. If the applicant was aware of LIDL\'s prior registration (which is publicly available in MARCia), filing nonetheless constitutes potential bad faith under Fr. XXII. Mexico adopted an explicit bad-faith fracción (XXII) in the 2020 LFPPI reform. The fact that the mark is also descriptive (Fr. IV) slightly reduces the bad-faith inference — but not if the applicant\'s goal is to benefit from LIDL\'s brand recognition.', es: 'La marca propuesta es idéntica al VITAFIT registrado de LIDL. Si el solicitante tenía conocimiento del registro previo de LIDL (que está públicamente disponible en MARCia), presentar la solicitud igualmente constituye potencial mala fe bajo Fr. XXII. México adoptó una fracción explícita de mala fe (XXII) en la reforma LFPPI de 2020. El hecho de que la marca también sea descriptiva (Fr. IV) reduce ligeramente la inferencia de mala fe — pero no si el objetivo del solicitante es beneficiarse del reconocimiento de marca de LIDL.' }, consequence: { en: 'Caution (medium risk): if IMPI or a tribunal determines bad faith, the application can be refused and any resulting registration can be nullified without a limitation period under Art. 258 LFPPI.', es: 'Precaución (riesgo medio): si el IMPI o un tribunal determina mala fe, la solicitud puede ser rechazada y cualquier registro resultante puede ser anulado sin período de limitación bajo el Art. 258 LFPPI.' } },
  ],
  malaFeIndicators: [
    { label: { en: 'Identity with pre-existing registered mark', es: 'Identidad con marca preexistente registrada' }, present: true, note: { en: 'VITAFIT (LIDL reg. 1523890) is identical.', es: 'VITAFIT (LIDL reg. 1523890) es idéntico.' } },
    { label: { en: 'Multiple prior identical registrations in same class', es: 'Múltiples registros idénticos previos en misma clase' }, present: true, note: { en: '4 critical conflicts in class 5 including 3 by same individual.', es: '4 conflictos críticos en clase 5 incluyendo 3 del mismo titular.' } },
    { label: { en: 'Historical pattern of conflicting filings by applicant', es: 'Patrón histórico de solicitudes conflictivas del solicitante' }, present: false, note: { en: 'No prior conflicting filings by proposed applicant found in MARCia.', es: 'No se encontraron solicitudes conflictivas previas del solicitante propuesto en MARCia.' } },
    { label: { en: 'Prior commercial relationship (distributor / agent / ex-partner)', es: 'Relación comercial previa (distribuidor / agente / ex-socio)' }, present: false, note: { en: 'No documented relationship between applicant and LIDL or Villanueva Valenciano found.', es: 'No se encontró relación documentada entre el solicitante y LIDL o Villanueva Valenciano.' } },
    { label: { en: 'Identical commercial sectors', es: 'Sectores comerciales idénticos' }, present: true, note: { en: 'Applicant and all critical holders operate in class 5 dietary supplement sector.', es: 'El solicitante y todos los titulares críticos operan en el sector de suplementos alimenticios clase 5.' } },
  ],
  malaFeVerdict: 'medium',
  malaFeRationale: {
    en: 'Bad-faith risk is assessed as MEDIUM. The mark is identical to a publicly available prior registration (LIDL, class 5), and the applicant operates in the same commercial sector. However, no evidence of a prior commercial relationship between the applicant and LIDL/Villanueva Valenciano has been found, and no pattern of predatory trademark filing by the applicant exists in IMPI records. The risk escalates to HIGH if there is any evidence the applicant was aware of LIDL\'s VITAFIT when filing. Under Art. 173 Fr. XXII and Art. 258 LFPPI, a successful bad-faith finding would enable nullification without time limit.',
    es: 'El riesgo de mala fe se evalúa como MEDIO. La marca es idéntica a un registro previo disponible públicamente (LIDL, clase 5), y el solicitante opera en el mismo sector comercial. Sin embargo, no se ha encontrado evidencia de relación comercial previa entre el solicitante y LIDL/Villanueva Valenciano, y no existe patrón de presentación predatoria de marcas por parte del solicitante en los registros del IMPI. El riesgo escala a ALTO si hay alguna evidencia de que el solicitante conocía el VITAFIT de LIDL al presentar. Bajo el Art. 173 Fr. XXII y el Art. 258 LFPPI, un hallazgo exitoso de mala fe permitiría la nulificación sin limitación de tiempo.',
  },
  famousMarks: [
    {
      name: 'VITAFIT',
      holder: 'LIDL STIFTUNG & CO. KG',
      sector: 'Retail / Dietary Supplements (Class 5)',
      threat: {
        en: 'LIDL\'s VITAFIT has not been formally declared a "notorious mark" (marca notoria) by IMPI as of this search date. However, LIDL as a corporate brand is widely recognized in Europe and is expanding in Latin America. Monitor for cross-class dilution claims under Art. 173 Fr. XVI–XVII as LIDL\'s Mexican market presence grows.',
        es: 'El VITAFIT de LIDL no ha sido declarado formalmente "marca notoria" por el IMPI a la fecha de esta búsqueda. Sin embargo, LIDL como marca corporativa es ampliamente reconocida en Europa y está expandiéndose en América Latina. Monitorear posibles reclamaciones de dilución entre clases bajo Art. 173 Fr. XVI–XVII a medida que crece la presencia de LIDL en el mercado mexicano.',
      },
      detected: false,
    },
  ],
  translationAnalysis: [
    { lang: 'es', langName: 'Spanish', form: 'VITAFIT / vita = vida, fit = en forma', risk: 'high', note: 'Direct meaning in Spanish-speaking market: "vida en forma." The Mexican consumer market is primarily Spanish-speaking. Descriptiveness risk highest here.' },
    { lang: 'en', langName: 'English', form: 'VITAFIT (vita = life, fit = physically fit)', risk: 'high', note: '"Vita" and "fit" are both understood in English. "Life-fit" compound. Descriptive for health supplements in English-speaking markets too.' },
    { lang: 'pt', langName: 'Portuguese', form: 'vita = vida (PT), fit = em forma', risk: 'medium', note: 'Transparent meaning in Portuguese. Relevant for MERCOSUR expansion. No specific Portuguese-language conflict found.' },
    { lang: 'fr', langName: 'French', form: 'vita = vie (similar), fit = en forme', risk: 'low', note: 'Partially understood by French speakers. No major French-market conflict identified.' },
    { lang: 'de', langName: 'German', form: 'vita = Leben (similar), fit = fit (borrowed)', risk: 'high', note: 'LIDL is a German company — the mark VITAFIT in German context will be recognized by LIDL\'s legal team. "Fit" is borrowed into German (fitnessstudio). Elevated risk for German-language markets.' },
    { lang: 'zh', langName: 'Chinese (Mandarin)', form: 'VITAFIT (transliteration: 维塔菲特)', risk: 'low', note: 'No direct semantic meaning in Mandarin. Phonetic transliteration carries no conflict risk detected.' },
    { lang: 'hi', langName: 'Hindi', form: 'VITAFIT (transliteration: विटाफ़िट)', risk: 'low', note: 'No direct semantic meaning in Hindi. No conflicts identified in Hindi-language markets.' },
    { lang: 'ja', langName: 'Japanese', form: 'VITAFIT (katakana: ヴィタフィット)', risk: 'low', note: 'No direct semantic meaning in Japanese. "Fit" (フィット) is a borrowed word but in different context. No specific conflicts identified.' },
  ],
  otherGrounds: [
    { id: 'og1', label: { en: 'Fr. I — Genericidad / Uso Común', es: 'Fr. I — Genericidad / Uso Común' }, cite: 'Art. 173 Fr. I LFPPI', verdict: 'caution', note: { en: 'VITAFIT borders on generic for class 5 health supplements. Not purely generic, but examiner may invoke Fr. I alongside Fr. IV.', es: 'VITAFIT roza lo genérico para suplementos de salud clase 5. No puramente genérico, pero el examinador puede invocar Fr. I junto con Fr. IV.' } },
    { id: 'og2', label: { en: 'Fr. V — Carácter Engañoso', es: 'Fr. V — Carácter Engañoso' }, cite: 'Art. 173 Fr. V LFPPI', verdict: 'caution', note: { en: 'If product does not deliver on vita/fit promise, deception risk applies.', es: 'Si el producto no cumple la promesa vita/fit, aplica riesgo de engaño.' } },
    { id: 'og3', label: { en: 'Fr. VI — Traducción / Variación Ortográfica', es: 'Fr. VI — Traducción / Variación Ortográfica' }, cite: 'Art. 173 Fr. VI LFPPI', verdict: 'pass', note: { en: 'Not a translation of any registered mark. Passes.', es: 'No es traducción de ninguna marca registrada. Supera.' } },
    { id: 'og4', label: { en: 'Fr. VII–IX — Signos Oficiales y Emblemas', es: 'Fr. VII–IX — Signos Oficiales y Emblemas' }, cite: 'Art. 173 Fr. VII–IX LFPPI', verdict: 'na', note: { en: 'No official emblems, state flags, or international organization symbols detected. N/A.', es: 'Sin emblemas oficiales, banderas estatales o símbolos de organizaciones internacionales. N/A.' } },
    { id: 'og5', label: { en: 'Fr. X–XII — Indicaciones Geográficas y Denominaciones de Origen', es: 'Fr. X–XII — Indicaciones Geográficas y Denominaciones de Origen' }, cite: 'Art. 173 Fr. X–XII LFPPI', verdict: 'na', note: { en: 'VITA and FIT have no geographic reference. N/A.', es: 'VITA y FIT no tienen referencia geográfica. N/A.' } },
    { id: 'og6', label: { en: 'Fr. XIII — Nombres Propios / Colores Aislados', es: 'Fr. XIII — Nombres Propios / Colores Aislados' }, cite: 'Art. 173 Fr. XIII LFPPI', verdict: 'na', note: { en: 'Word mark; no isolated color. N/A.', es: 'Marca denominativa; sin color aislado. N/A.' } },
    { id: 'og7', label: { en: 'Fr. XIV — Obras Protegidas e INDAUTOR', es: 'Fr. XIV — Obras Protegidas e INDAUTOR' }, cite: 'Art. 173 Fr. XIV LFPPI', verdict: 'na', note: { en: 'VITAFIT does not reproduce any copyright-protected work or INDAUTOR-registered title. N/A.', es: 'VITAFIT no reproduce ninguna obra protegida por derechos de autor ni título registrado en INDAUTOR. N/A.' } },
    { id: 'og8', label: { en: 'Fr. XV — Signos Engañosos (Productos/Servicios)', es: 'Fr. XV — Signos Engañosos (Productos/Servicios)' }, cite: 'Art. 173 Fr. XV LFPPI', verdict: 'pass', note: { en: 'Mark does not suggest a geographic origin that the goods do not have. Passes.', es: 'La marca no sugiere un origen geográfico que los bienes no tengan. Supera.' } },
    { id: 'og9', label: { en: 'Fr. XXI — Variedades Vegetales y Razas Animales', es: 'Fr. XXI — Variedades Vegetales y Razas Animales' }, cite: 'Art. 173 Fr. XXI LFPPI', verdict: 'na', note: { en: 'Not a plant variety or animal breed name. N/A.', es: 'No es nombre de variedad vegetal ni raza animal. N/A.' } },
    { id: 'og10', label: { en: 'Art. 12 — Orden Público y Buenas Costumbres', es: 'Art. 12 — Orden Público y Buenas Costumbres' }, cite: 'Art. 12 LFPPI', verdict: 'pass', note: { en: 'VITAFIT does not offend public order or morality. Passes.', es: 'VITAFIT no ofende el orden público ni la moral. Supera.' } },
  ],
  domains: [
    { domain: 'vitafit.com.mx', status: 'taken' },
    { domain: 'vitafit.mx', status: 'taken' },
    { domain: 'vitafit.com', status: 'taken' },
    { domain: 'vitafit.ai', status: 'taken' },
    { domain: 'vitafit.io', status: 'taken' },
    { domain: 'vitafitmx.com', status: 'available' },
    { domain: 'mivitafit.com', status: 'available' },
    { domain: 'vitafitmexico.com', status: 'available' },
    { domain: 'vitafitsuplementos.mx', status: 'available' },
  ],
  strategies: [
    {
      id: 'strat1',
      title: { en: 'A. Modify the Mark (Coined Alternatives)', es: 'A. Modificar la Marca (Alternativas Acuñadas)' },
      viability: 88,
      description: { en: 'Replace VITAFIT with a coined (fanciful) mark that occupies the same brand space without triggering descriptiveness or conflict bars. The alternatives below were generated against the same MARCia corpus and show substantially higher quick-clearance scores.', es: 'Reemplazar VITAFIT por una marca acuñada (de fantasía) que ocupe el mismo espacio de marca sin activar los impedimentos de descriptividad o conflicto. Las alternativas a continuación fueron generadas contra el mismo corpus de MARCia y muestran puntuaciones de claridad rápida sustancialmente más altas.' },
      feesMxn: 'MXN 3,055 (filing, 1 class)',
      timeline: { en: '12–18 months (uncontested)', es: '12–18 meses (sin oposición)' },
      successRange: '75–90%',
      pros: [
        { en: 'Eliminates Fr. IV absolute bar completely.', es: 'Elimina completamente el impedimento absoluto Fr. IV.' },
        { en: 'Coined mark gets inherently strong protection.', es: 'La marca acuñada obtiene protección inherentemente fuerte.' },
        { en: 'Avoids LIDL conflict entirely with a distinct name.', es: 'Evita el conflicto con LIDL completamente con un nombre distinto.' },
      ],
      cons: [
        { en: 'Brand investment required for consumer recognition of a new mark.', es: 'Se requiere inversión en marca para el reconocimiento del consumidor de una nueva marca.' },
        { en: 'New name may reduce intuitive product communication.', es: 'El nuevo nombre puede reducir la comunicación intuitiva del producto.' },
      ],
      cta: { en: 'File this alternative with MTC', es: 'Presentar esta alternativa con MTC' },
      alternatives: [
        { name: 'VITALOOM', quickScore: 81 },
        { name: 'NUTRIVIDA', quickScore: 74 },
        { name: 'BIOLUMEN', quickScore: 78 },
        { name: 'VIVANTIA', quickScore: 85 },
        { name: 'ZELVI', quickScore: 91 },
      ],
    },
    {
      id: 'strat2',
      title: { en: 'B. File as Mixed Mark with Distinctive Logo', es: 'B. Presentar como Marca Mixta con Logotipo Distintivo' },
      viability: 45,
      description: { en: 'Add a strong distinctive graphic element (logo/device) to create a mixed mark. The design element may reduce Fr. IV descriptiveness risk by adding non-descriptive visual distinctiveness. However, it does NOT cure the Fr. XVIII identity conflict with LIDL\'s registered VITAFIT word mark.', es: 'Agregar un elemento gráfico distintivo fuerte (logo/diseño) para crear una marca mixta. El elemento de diseño puede reducir el riesgo de descriptividad Fr. IV al agregar distintividad visual no descriptiva. Sin embargo, NO subsana el conflicto de identidad Fr. XVIII con la marca denominativa VITAFIT registrada de LIDL.' },
      feesMxn: 'MXN 3,055 (filing, 1 class)',
      timeline: { en: '12–24 months (contested likely)', es: '12–24 meses (probable oposición)' },
      successRange: '20–35%',
      pros: [
        { en: 'Preserves the VITAFIT name for brand continuity.', es: 'Preserva el nombre VITAFIT para continuidad de marca.' },
        { en: 'Design element adds a layer of distinctiveness.', es: 'El elemento de diseño agrega una capa de distintividad.' },
      ],
      cons: [
        { en: 'Does not cure the Fr. XVIII conflict with LIDL — identical word component remains.', es: 'No subsana el conflicto Fr. XVIII con LIDL — el componente denominativo idéntico persiste.' },
        { en: 'LIDL will likely oppose regardless of logo addition.', es: 'LIDL probablemente se opondrá independientemente de la adición del logotipo.' },
        { en: 'Protection would cover only the specific design, not the word VITAFIT.', es: 'La protección cubriría solo el diseño específico, no la palabra VITAFIT.' },
      ],
      cta: { en: 'Consult MTC on logo design strategy', es: 'Consultar a MTC sobre estrategia de diseño de logo' },
    },
    {
      id: 'strat3',
      title: { en: 'C. Reclassify to Adjacent Class', es: 'C. Reclasificar a Clase Adyacente' },
      viability: 38,
      description: { en: 'Dietary supplement product specifications can sometimes accommodate filing in class 29 (protein foods, dairy), class 30 (food preparations), or class 32 (beverages with health claims). However, LIDL\'s VITAFIT registration and the Villanueva cluster are concentrated in class 5 — which is exactly where dietary supplements belong. Adjacent-class filing would provide incomplete protection.', es: 'Las especificaciones de productos de suplementos alimenticios a veces pueden acomodar la presentación en la clase 29 (alimentos proteicos, lácteos), clase 30 (preparaciones alimenticias) o clase 32 (bebidas con declaraciones de salud). Sin embargo, el registro VITAFIT de LIDL y el clúster Villanueva están concentrados en la clase 5 — que es exactamente donde pertenecen los suplementos alimenticios. La presentación en clase adyacente proporcionaría protección incompleta.' },
      feesMxn: 'MXN 3,055 per class filed',
      timeline: { en: '12–18 months (lower opposition risk)', es: '12–18 meses (menor riesgo de oposición)' },
      successRange: '40–60%',
      pros: [
        { en: 'Lower conflict density in classes 29/30/32.', es: 'Menor densidad de conflictos en clases 29/30/32.' },
        { en: 'May capture a niche product formulation outside class 5.', es: 'Puede capturar una formulación de producto nicho fuera de la clase 5.' },
      ],
      cons: [
        { en: 'Does not protect core dietary supplement goods.', es: 'No protege los bienes básicos de suplementos alimenticios.' },
        { en: 'LIDL may still oppose citing cross-class confusion.', es: 'LIDL puede aún oponerse citando confusión entre clases.' },
        { en: 'Incomplete protection for the brand portfolio.', es: 'Protección incompleta para el portafolio de marca.' },
      ],
      cta: { en: 'Review product specs with MTC for class fit', es: 'Revisar especificaciones de producto con MTC para adecuación de clase' },
    },
    {
      id: 'strat4',
      title: { en: 'D. Prove Acquired Distinctiveness (Secondary Meaning)', es: 'D. Acreditar Distintividad Adquirida (Secondary Meaning)' },
      viability: 25,
      description: { en: 'Under LFPPI Art. 173 Fr. IV, if the applicant can demonstrate that the mark has acquired secondary meaning in Mexico through intensive prior use (sales data, advertising spend, consumer surveys, press coverage), IMPI may register an otherwise descriptive mark. This path requires substantial prior use evidence and is typically only viable for marks with years of commercial presence.', es: 'Bajo el Art. 173 Fr. IV LFPPI, si el solicitante puede demostrar que la marca ha adquirido distintividad secundaria en México mediante uso previo intensivo (datos de ventas, inversión en publicidad, encuestas de consumidores, cobertura de prensa), el IMPI puede registrar una marca de otro modo descriptiva. Esta vía requiere evidencia sustancial de uso previo y generalmente solo es viable para marcas con años de presencia comercial.' },
      feesMxn: 'MXN 3,055 (filing) + evidence preparation costs',
      timeline: { en: '18–36 months (evidence-intensive)', es: '18–36 meses (intensivo en evidencia)' },
      successRange: '10–25%',
      pros: [
        { en: 'Preserves VITAFIT name if prior use is extensive.', es: 'Preserva el nombre VITAFIT si el uso previo es extensivo.' },
      ],
      cons: [
        { en: 'Does NOT cure the Fr. XVIII identity conflict with LIDL — separate obstacle.', es: 'NO subsana el conflicto de identidad Fr. XVIII con LIDL — obstáculo separado.' },
        { en: 'Requires years of documented use, sales data, and consumer recognition evidence.', es: 'Requiere años de uso documentado, datos de ventas y evidencia de reconocimiento del consumidor.' },
        { en: 'Very low success probability against an identical prior registration.', es: 'Probabilidad de éxito muy baja frente a un registro previo idéntico.' },
      ],
      cta: { en: 'Submit prior use documentation to MTC', es: 'Enviar documentación de uso previo a MTC' },
    },
    {
      id: 'strat5',
      title: { en: 'E. Abandon & Rebrand with Fanciful Mark (Recommended)', es: 'E. Desistir y Rebrandear con Marca Acuñada (Recomendado)' },
      viability: 92,
      description: { en: 'The safest and most commercially sound path. Abandon the VITAFIT mark entirely and invest brand resources in a fanciful (coined) mark with no descriptiveness risk and no prior conflicts. This strategy avoids years of contested prosecution, LIDL opposition costs, and the risk of a final refusal after significant brand investment. Use strategy A\'s alternatives as starting points.', es: 'La vía más segura y comercialmente sólida. Abandonar la marca VITAFIT por completo e invertir los recursos de marca en una marca acuñada (de fantasía) sin riesgo de descriptividad y sin conflictos previos. Esta estrategia evita años de tramitación contestada, costos de oposición de LIDL y el riesgo de una negativa final después de una inversión significativa en marca. Utilizar las alternativas de la estrategia A como punto de partida.' },
      feesMxn: 'MXN 3,055 (new filing, 1 class)',
      timeline: { en: '12–18 months (uncontested scenario)', es: '12–18 meses (escenario sin oposición)' },
      successRange: '80–95%',
      pros: [
        { en: 'Eliminates all identified registrability bars simultaneously.', es: 'Elimina todos los impedimentos de registrabilidad identificados simultáneamente.' },
        { en: 'Strong inherent distinctiveness from day one.', es: 'Fuerte distintividad inherente desde el primer día.' },
        { en: 'No LIDL enforcement risk on the new mark.', es: 'Sin riesgo de enforcement de LIDL sobre la nueva marca.' },
        { en: 'No wasted prosecution or opposition defense costs.', es: 'Sin costos desperdiciados de tramitación o defensa de oposición.' },
      ],
      cons: [
        { en: 'Requires brand rebuild — existing VITAFIT brand equity is lost.', es: 'Requiere reconstrucción de marca — el valor de marca VITAFIT existente se pierde.' },
      ],
      cta: { en: 'Start rebrand process with MTC', es: 'Iniciar proceso de rebranding con MTC' },
      alternatives: [
        { name: 'VITALOOM', quickScore: 81 },
        { name: 'NUTRIVIDA', quickScore: 74 },
        { name: 'BIOLUMEN', quickScore: 78 },
        { name: 'VIVANTIA', quickScore: 85 },
        { name: 'ZELVI', quickScore: 91 },
      ],
    },
  ],
  impiSteps: [
    { step: 1, label: { en: 'Filing of application', es: 'Presentación de solicitud' }, duration: { en: 'Day 1', es: 'Día 1' }, note: { en: 'MXN 3,055 filing fee (1 class). Applicant receives an expediente number.', es: 'Cuota de presentación MXN 3,055 (1 clase). El solicitante recibe un número de expediente.' } },
    { step: 2, label: { en: 'IMPI formal examination', es: 'Examen formal IMPI' }, duration: { en: '1–2 months', es: '1–2 meses' }, note: { en: 'Formal completeness check. Deficiencies generate an Office Action (requerimiento).', es: 'Verificación de completud formal. Las deficiencias generan un requerimiento.' } },
    { step: 3, label: { en: 'Publication in Gaceta de la Propiedad Industrial', es: 'Publicación en Gaceta de la Propiedad Industrial' }, duration: { en: '3–6 months post-filing', es: '3–6 meses post-presentación' }, note: { en: 'Third parties notified. Opposition window opens on publication date.', es: 'Terceros notificados. La ventana de oposición se abre en la fecha de publicación.' } },
    { step: 4, label: { en: 'Opposition window', es: 'Período de oposición' }, duration: { en: '1 month (30 calendar days)', es: '1 mes (30 días calendario)' }, note: { en: 'Any interested third party (e.g., LIDL) may file opposition. VITAFIT is at HIGH risk of opposition from LIDL STIFTUNG.', es: 'Cualquier tercero interesado (ej., LIDL) puede presentar oposición. VITAFIT está en ALTO riesgo de oposición de LIDL STIFTUNG.' } },
    { step: 5, label: { en: 'IMPI substantive examination', es: 'Examen sustantivo IMPI' }, duration: { en: '6–12 months', es: '6–12 meses' }, note: { en: 'IMPI examiner reviews absolute grounds (Fr. IV, Fr. I) and relative grounds (Fr. XVIII). Office Actions possible.', es: 'El examinador del IMPI revisa impedimentos absolutos (Fr. IV, Fr. I) y relativos (Fr. XVIII). Posibles requerimientos.' } },
    { step: 6, label: { en: 'Resolution (grant or refusal)', es: 'Resolución (otorgamiento o negativa)' }, duration: { en: '12–18 months total (uncontested) / 24–36 months (contested)', es: '12–18 meses totales (sin oposición) / 24–36 meses (con oposición)' }, note: { en: 'For VITAFIT: refusal expected citing Fr. IV and Fr. XVIII. Appeal possible to TFJA within 15 business days.', es: 'Para VITAFIT: se espera negativa citando Fr. IV y Fr. XVIII. Apelación posible al TFJA dentro de 15 días hábiles.' } },
  ],
  totalFeesMxn: 3055,
};

// ─── Sub-components ────────────────────────────────────────────────────────────

function SectionHeader({ icon, title, subtitle, badge }: { icon?: React.ReactNode; title: string; subtitle?: string; badge?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-gray-100">
      <div className="flex items-start gap-3">
        {icon && <div className="w-7 h-7 rounded-lg bg-[#0f2a44]/8 flex items-center justify-center flex-shrink-0 mt-0.5">{icon}</div>}
        <div>
          <h2 className="text-sm font-black text-[#0f2a44] tracking-tight">{title}</h2>
          {subtitle && <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">{subtitle}</p>}
        </div>
      </div>
      {badge}
    </div>
  );
}

function StatusPill({ status, lang }: { status: ConflictStatus; lang: Lang }) {
  const cfg = STATUS_PILL[status];
  return (
    <span className={`inline-flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
      {t(cfg.label, lang)}
    </span>
  );
}

function SimilarityRing({ score, size = 52 }: { score: number; size?: number }) {
  const r = (size / 2) - 5;
  const circ = 2 * Math.PI * r;
  const color = score >= 80 ? '#dc2626' : score >= 50 ? '#f59e0b' : '#16a34a';
  return (
    <div className="flex-shrink-0 flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e5e7eb" strokeWidth="3.5" />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="3.5"
          strokeDasharray={`${(score / 100) * circ} ${circ}`} strokeLinecap="round" />
      </svg>
      <span className="absolute text-[10px] font-black" style={{ color }}>{score}%</span>
    </div>
  );
}

function RegistrabilityGauge({ score }: { score: number }) {
  const color = score >= 60 ? '#16a34a' : score >= 35 ? '#f59e0b' : '#dc2626';
  const size = 64;
  const r = 26;
  const circ = Math.PI * r;
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size / 2 + 8 }}>
        <svg width={size} height={size / 2 + 8} viewBox={`0 0 ${size} ${size/2+8}`}>
          <path d={`M 6 ${size/2} A ${r} ${r} 0 0 1 ${size-6} ${size/2}`} fill="none" stroke="#1f3a54" strokeWidth="5" />
          <path d={`M 6 ${size/2} A ${r} ${r} 0 0 1 ${size-6} ${size/2}`} fill="none" stroke={color} strokeWidth="5"
            strokeDasharray={`${(score / 100) * circ} ${circ}`} strokeLinecap="round" />
        </svg>
        <div className="absolute bottom-0 w-full text-center">
          <span className="text-lg font-black text-white leading-none">{score}</span>
          <span className="text-white/60 text-[9px] block">/100</span>
        </div>
      </div>
    </div>
  );
}

function CollapsibleSection({ title, subtitle, badge, defaultOpen = false, children }: {
  title: string; subtitle?: string; badge?: React.ReactNode; defaultOpen?: boolean; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl bg-white border border-gray-200 shadow-sm overflow-hidden print:shadow-none print:border-gray-300">
      <button type="button" onClick={() => setOpen(o => !o)}
        className="w-full text-left flex items-start justify-between gap-3 px-5 py-4 border-b border-gray-100 hover:bg-gray-50/60 transition-colors">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div>
            <h2 className="text-sm font-black text-[#0f2a44] tracking-tight leading-tight">{title}</h2>
            {subtitle && <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">{subtitle}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
          {badge}
          {open ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
        </div>
      </button>
      {open && <div className="print:block">{children}</div>}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function ClearanceReportV2Page() {
  const [lang, setLang] = useState<Lang>('en');
  const data = VITAFIT_DATA;
  const [holderFilter, setHolderFilter] = useState<string | null>(null);
  const [bgOpen, setBgOpen] = useState(false);

  const RISK_CFG: Record<OverallRisk, { label: Bi; bg: string; text: string }> = {
    critical: { label: { en: 'CRITICAL', es: 'CRÍTICO' }, bg: 'bg-red-600', text: 'text-white' },
    high:     { label: { en: 'HIGH RISK', es: 'RIESGO ALTO' }, bg: 'bg-orange-500', text: 'text-white' },
    moderate: { label: { en: 'MODERATE', es: 'MODERADO' }, bg: 'bg-amber-500', text: 'text-white' },
    low:      { label: { en: 'LOW RISK', es: 'RIESGO BAJO' }, bg: 'bg-emerald-500', text: 'text-white' },
    clear:    { label: { en: 'CLEAR', es: 'SIN OBSTÁCULOS' }, bg: 'bg-emerald-700', text: 'text-white' },
  };
  const riskCfg = RISK_CFG[data.overallRisk];

  const axes = [
    { key: 'distintividadInherente' as const, label: { en: 'Inherent Distinctiveness', es: 'Distintividad Inherente' }, desc: { en: 'How inherently protectable is the mark under LFPPI Art. 173 Fr. IV? Higher = more distinctive.', es: '¿Qué tan protegible es la marca bajo el Art. 173 Fr. IV LFPPI? Mayor = más distintiva.' } },
    { key: 'disponibilidadRegistral' as const, label: { en: 'Registry Availability', es: 'Disponibilidad Registral' }, desc: { en: 'How clear is the IMPI registry of identical or near-identical prior marks? Higher = fewer conflicts.', es: '¿Qué tan libre está el registro del IMPI de marcas anteriores idénticas o casi idénticas? Mayor = menos conflictos.' } },
    { key: 'saturacionCampo' as const, label: { en: 'Field Saturation', es: 'Saturación del Campo' }, desc: { en: 'How densely populated is the namespace around the mark\'s elements? Higher = less saturated, more space available.', es: '¿Qué tan densamente poblado está el espacio alrededor de los elementos de la marca? Mayor = menos saturado, más espacio disponible.' } },
    { key: 'cumplimientoArt173' as const, label: { en: 'Art. 173 LFPPI Compliance', es: 'Cumplimiento Art. 173 LFPPI' }, desc: { en: 'How well does the mark pass all 22 fracciones of Art. 173? Higher = more compliant.', es: '¿Qué tan bien supera la marca las 22 fracciones del Art. 173? Mayor = más conforme.' } },
    { key: 'riesgoOposicion' as const, label: { en: 'Opposition & Nullity Risk', es: 'Riesgo de Oposición y Nulidad' }, desc: { en: 'How likely is a funded opposition during examination or nullity after registration? Higher = lower risk.', es: '¿Qué probable es una oposición financiada durante el examen o nulidad post-registro? Mayor = menor riesgo.' } },
  ];

  const failCount = data.fracciones.filter(f => f.verdict === 'fail').length;
  const cautionCount = data.fracciones.filter(f => f.verdict === 'caution').length;
  const passCount = data.fracciones.filter(f => f.verdict === 'pass').length;

  const allConflicts = [...data.criticalConflicts, ...data.significantConflicts, ...data.backgroundConflicts];
  const filteredCritical = holderFilter ? data.criticalConflicts.filter(c => c.holder === holderFilter) : data.criticalConflicts;
  const filteredSignificant = holderFilter ? data.significantConflicts.filter(c => c.holder === holderFilter) : data.significantConflicts;
  const uniqueHolders = Array.from(new Set(allConflicts.map(c => c.holder)));

  const maxSat = Math.max(...data.elementDecomposition.map(e => e.saturationClass));

  const malaFeCfg = { low: { label: { en: 'Low', es: 'Bajo' }, cls: 'text-emerald-700 bg-emerald-50 border-emerald-200' }, medium: { label: { en: 'Medium', es: 'Medio' }, cls: 'text-amber-700 bg-amber-50 border-amber-200' }, high: { label: { en: 'High', es: 'Alto' }, cls: 'text-red-700 bg-red-50 border-red-200' } };

  const riskPct = (r: 'none' | 'low' | 'medium' | 'high') => ({ none: 0, low: 25, medium: 55, high: 90 })[r];
  const riskColor = (r: 'none' | 'low' | 'medium' | 'high') => ({ none: '#16a34a', low: '#65a30d', medium: '#f59e0b', high: '#dc2626' })[r];

  return (
    <div className="min-h-screen bg-gray-50 font-sans print:bg-white">

      {/* Print styles */}
      <style>{`
        @media print {
          @page { margin: 18mm 14mm; size: A4; }
          .print\\:hidden { display: none !important; }
          .print\\:break-before { page-break-before: always; }
          body, * { -webkit-print-color-adjust: exact; print-color-adjust: exact; font-family: system-ui, sans-serif; }
          details { display: block; }
          details summary { display: none; }
          .print\\:shadow-none { box-shadow: none; }
          h1, h2, h3 { orphans: 3; widows: 3; }
          section, .card { page-break-inside: avoid; }
        }
      `}</style>

      {/* ── Top bar ── */}
      <div className="bg-[#0f2a44] print:hidden sticky top-0 z-40 shadow-lg">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-[#e07a3f] flex items-center justify-center flex-shrink-0">
              <Shield size={14} className="text-white" />
            </div>
            <div>
              <span className="text-white text-sm font-black">Mexico Trademark Center</span>
              <span className="text-white/40 text-[10px] ml-2 hidden sm:inline">Clearance Report v2</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => window.print()}
              className="flex items-center gap-1.5 text-white/70 hover:text-white text-[11px] font-semibold transition-colors">
              <Printer size={13} />
              <span className="hidden sm:inline">{lang === 'es' ? 'Imprimir PDF' : 'Print / PDF'}</span>
            </button>
            <div className="flex items-center gap-0.5 bg-white/10 rounded-lg p-0.5">
              {(['en', 'es'] as Lang[]).map(l => (
                <button key={l} type="button" onClick={() => setLang(l)}
                  className={`text-xs font-black px-3 py-1.5 rounded-md transition-all ${lang === l ? 'bg-white text-[#0f2a44]' : 'text-white/60 hover:text-white'}`}>
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-5 print:py-4 print:space-y-4">

        {/* ─────────────────────────────────────────────────────────────────
            § 1  Hero verdict card
        ───────────────────────────────────────────────────────────────── */}
        <div className="rounded-2xl bg-[#0f2a44] overflow-hidden shadow-xl print:shadow-none" id="s1">
          <div className="px-6 py-6">
            <div className="flex items-start justify-between gap-4 flex-wrap mb-5">
              <div>
                <p className="text-white/50 text-[10px] font-bold uppercase tracking-widest mb-1.5">
                  {lang === 'es' ? 'Reporte de Registrabilidad IMPI · México' : 'IMPI Registrability Report · Mexico'}
                </p>
                <h1 className="text-5xl font-black text-white tracking-tight leading-none">{data.markName}</h1>
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  {data.classes.map(c => (
                    <span key={c} className="text-xs font-bold bg-white/15 text-white/90 px-2.5 py-1 rounded-full">
                      {lang === 'es' ? `Clase ${c} Niza` : `Nice Class ${c}`}
                    </span>
                  ))}
                  <span className="text-white/50 text-[10px]">·</span>
                  <span className="text-white/60 text-[10px] max-w-xs">{t(data.goodsServices, lang).slice(0, 72)}…</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-3">
                <span className={`text-sm font-black px-4 py-2 rounded-xl uppercase tracking-wide shadow-sm ${riskCfg.bg} ${riskCfg.text}`}>
                  {t(riskCfg.label, lang)}
                </span>
                <RegistrabilityGauge score={data.registrabilityScore} />
              </div>
            </div>

            {/* Headline reason */}
            <div className="bg-red-500/15 border border-red-400/25 rounded-xl p-4 mb-5">
              <div className="flex items-start gap-2">
                <AlertCircle size={14} className="text-red-300 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-200 text-[10px] font-bold uppercase tracking-wide mb-1">
                    {lang === 'es' ? 'Diagnóstico principal' : 'Key Finding'}
                  </p>
                  <p className="text-white/90 text-xs leading-relaxed">{t(data.headlineReason, lang)}</p>
                </div>
              </div>
            </div>

            {/* KPI tiles */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { label: { en: 'Registrability Score', es: 'Puntuación' }, value: `${data.registrabilityScore}/100`, color: 'text-red-400', sub: { en: 'Critically low', es: 'Críticamente bajo' } },
                { label: { en: 'Critical Conflicts', es: 'Conflictos Críticos' }, value: String(data.criticalConflicts.length), color: 'text-red-400', sub: { en: 'Identical/near-identical', es: 'Idénticos/casi idénticos' } },
                { label: { en: 'LFPPI Art. 173 Fails', es: 'Fracciones Fallidas' }, value: `${failCount} of 22`, color: 'text-orange-400', sub: { en: `+ ${cautionCount} caution`, es: `+ ${cautionCount} precaución` } },
                { label: { en: 'Distinctiveness', es: 'Distintividad' }, value: t(TIER_LABEL[data.distinctivenessTier], lang), color: 'text-amber-400', sub: { en: 'Art. 173 Fr. IV bar', es: 'Impedimento Fr. IV' } },
              ].map((kpi, i) => (
                <div key={i} className="bg-white/8 rounded-xl px-3 py-3 text-center">
                  <p className="text-white/40 text-[8px] font-bold uppercase tracking-wider mb-1">{t(kpi.label, lang)}</p>
                  <p className={`text-base font-black ${kpi.color}`}>{kpi.value}</p>
                  <p className="text-white/35 text-[8px] mt-0.5">{t(kpi.sub, lang)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Top conflict spotlight */}
          <div className="bg-white/6 border-t border-white/10 px-6 py-5">
            <div className="flex items-center gap-2 mb-3">
              <Star size={12} className="text-[#e07a3f] fill-[#e07a3f]" />
              <span className="text-white/70 text-[10px] font-black uppercase tracking-widest">
                {lang === 'es' ? 'Conflicto Principal Detectado' : 'Top Conflict Spotlight'}
              </span>
            </div>
            <div className="bg-white/8 border border-white/15 rounded-xl p-4">
              <div className="flex items-start gap-4 flex-wrap">
                <div className="relative flex-shrink-0">
                  <SimilarityRing score={data.topConflict.similarityScore} size={64} />
                </div>
                <div className="flex-1 min-w-[180px]">
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    <span className="text-white font-black text-xl tracking-tight">{data.topConflict.name}</span>
                    <StatusPill status={data.topConflict.status} lang={lang} />
                    <span className="text-[9px] font-bold bg-white/15 text-white/80 px-2 py-0.5 rounded-full">
                      {lang === 'es' ? `Clase ${data.topConflict.classNum}` : `Class ${data.topConflict.classNum}`}
                    </span>
                  </div>
                  <p className="text-white/90 text-xs font-bold">{data.topConflict.holder}</p>
                  <div className="flex items-center gap-3 mt-1.5 text-white/55 text-[10px] flex-wrap">
                    <span className="flex items-center gap-1"><MapPin size={9} className="flex-shrink-0" />{data.topConflict.holderCountry}</span>
                    <span className="flex items-center gap-1"><Building2 size={9} className="flex-shrink-0" />{t(HOLDER_TYPE_LABEL[data.topConflict.holderType], lang)}</span>
                    {data.topConflict.registrationDate && (
                      <span className="flex items-center gap-1"><Clock size={9} className="flex-shrink-0" />
                        {lang === 'es' ? `Reg. ${data.topConflict.registrationDate}` : `Reg. ${data.topConflict.registrationDate}`}
                      </span>
                    )}
                    {data.topConflict.registrationNumber && (
                      <span className="font-mono text-white/40">#{data.topConflict.registrationNumber}</span>
                    )}
                  </div>
                  <p className="text-white/65 text-[10px] mt-2.5 leading-relaxed border-t border-white/10 pt-2.5">{t(data.topConflict.whyItMatters, lang)}</p>
                  {data.topConflict.marciaUrl && (
                    <a href={data.topConflict.marciaUrl} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[#e07a3f] text-[9px] font-bold mt-2 hover:text-orange-300 transition-colors">
                      <ExternalLink size={9} /> {lang === 'es' ? 'Ver en MARCia IMPI' : 'View in MARCia IMPI'}
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────────
            § 2  Five-axis risk scorecard
        ───────────────────────────────────────────────────────────────── */}
        <CollapsibleSection
          title={lang === 'es' ? '§2. Perfil de Riesgo — 5 Ejes LFPPI' : '§2. Risk Profile — 5 LFPPI Axes'}
          subtitle={lang === 'es' ? 'Ejes específicos a la ley mexicana. Mayor puntuación = menor riesgo. Barras coloreadas: rojo <40, ámbar 40–69, verde ≥70.' : 'Mexico-law-specific axes. Higher score = lower risk. Color code: red <40, amber 40–69, green ≥70.'}
          defaultOpen
        >
          <div className="px-5 py-5 space-y-3.5">
            {axes.map(ax => {
              const score = data.axisScores[ax.key];
              const color = score >= 70 ? '#16a34a' : score >= 40 ? '#f59e0b' : '#dc2626';
              return (
                <details key={ax.key} className="group">
                  <summary className="list-none cursor-pointer select-none">
                    <div className="flex items-center gap-3">
                      <div className="w-40 flex-shrink-0">
                        <p className="text-[11px] font-black text-gray-800 leading-tight">{t(ax.label, lang)}</p>
                      </div>
                      <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${score}%`, backgroundColor: color }} />
                      </div>
                      <span className="text-xs font-black w-8 text-right flex-shrink-0" style={{ color }}>{score}</span>
                      <ChevronDown size={12} className="text-gray-400 group-open:rotate-180 transition-transform flex-shrink-0" />
                    </div>
                  </summary>
                  <div className="mt-2 ml-[10.5rem] pl-3 border-l-2 border-gray-100">
                    <p className="text-[11px] text-gray-600 leading-relaxed">{t(ax.desc, lang)}</p>
                  </div>
                </details>
              );
            })}
          </div>
        </CollapsibleSection>

        {/* ─────────────────────────────────────────────────────────────────
            § 3  Distinctiveness spectrum
        ───────────────────────────────────────────────────────────────── */}
        <CollapsibleSection
          title={lang === 'es' ? '§3. Espectro de Distintividad' : '§3. Distinctiveness Spectrum'}
          subtitle={lang === 'es' ? `Fuente única de verdad: "${t(TIER_LABEL[data.distinctivenessTier], lang)}" — alimenta todas las secciones de este reporte.` : `Single source of truth: "${t(TIER_LABEL[data.distinctivenessTier], lang)}" — powers all sections of this report.`}
          defaultOpen
          badge={<span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${TIER_BG[data.distinctivenessTier]}`}>{t(TIER_LABEL[data.distinctivenessTier], lang)}</span>}
        >
          <div className="px-5 py-6">
            {/* Gradient bar with pointer */}
            <div className="relative mb-10">
              <div className="h-7 rounded-xl overflow-hidden shadow-inner"
                style={{ background: 'linear-gradient(to right, #dc2626 0%, #ea580c 25%, #d97706 50%, #16a34a 75%, #0f2a44 100%)' }} />
              {(() => {
                const idx = TIER_ORDER.indexOf(data.distinctivenessTier);
                const pct = (idx / (TIER_ORDER.length - 1)) * 100;
                return (
                  <div className="absolute top-full mt-1" style={{ left: `calc(${pct}% - 0px)`, transform: 'translateX(-50%)' }}>
                    <div className="w-0 h-0 border-l-[7px] border-r-[7px] border-b-[9px] border-l-transparent border-r-transparent border-b-[#0f2a44] mx-auto" />
                    <div className="bg-[#0f2a44] text-white text-[9px] font-black px-2.5 py-1 rounded-lg mt-0.5 whitespace-nowrap shadow-md">
                      {data.markName} — {t(TIER_LABEL[data.distinctivenessTier], lang)}
                    </div>
                  </div>
                );
              })()}
            </div>
            {/* Tier labels + examples */}
            <div className="grid grid-cols-5 gap-1 mb-5">
              {TIER_ORDER.map(tier => {
                const isActive = tier === data.distinctivenessTier;
                return (
                  <div key={tier}
                    className={`rounded-xl p-3 text-center transition-all ${isActive ? TIER_BG[tier] + ' shadow-sm ring-2 ring-offset-1 ring-current/20' : 'bg-gray-50 border border-gray-100'}`}>
                    <div className="text-[10px] font-black leading-tight mb-1" style={{ color: isActive ? undefined : TIER_COLORS[tier] }}>
                      {t(TIER_LABEL[tier], lang)}
                    </div>
                    <div className="text-[8px] text-gray-500 leading-tight">{TIER_EXAMPLE[tier]}</div>
                  </div>
                );
              })}
            </div>
            {/* Explanation */}
            <div className={`rounded-xl border p-4 ${TIER_BG[data.distinctivenessTier]}`}>
              <p className="text-xs leading-relaxed">{t(data.distinctivenessExplanation, lang)}</p>
            </div>
          </div>
        </CollapsibleSection>

        {/* ─────────────────────────────────────────────────────────────────
            § 4  Element decomposition
        ───────────────────────────────────────────────────────────────── */}
        <CollapsibleSection
          title={lang === 'es' ? '§4. Descomposición de Elementos' : '§4. Element Decomposition'}
          subtitle={lang === 'es' ? 'Análisis morfema por morfema — saturación en MARCia, nivel de distinción, contribución.' : 'Morpheme-by-morpheme breakdown — MARCia saturation, distinctiveness tier, contribution.'}
          defaultOpen
        >
          <div className="px-5 py-5 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              {data.elementDecomposition.map(el => (
                <div key={el.element} className="rounded-xl border border-gray-200 bg-gray-50 overflow-hidden">
                  <div className="px-4 py-3 bg-[#0f2a44] flex items-center justify-between">
                    <span className="text-2xl font-black text-white tracking-wider">{el.element}</span>
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${TIER_BG[el.tier]}`}>{t(TIER_LABEL[el.tier], lang)}</span>
                  </div>
                  <div className="px-4 py-3 space-y-3">
                    <div>
                      <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wide mb-0.5">{lang === 'es' ? 'Significado y Etimología' : 'Meaning & Etymology'}</p>
                      <p className="text-[11px] text-gray-700 font-semibold">{t(el.meaning, lang)}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">{t(el.etymology, lang)}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-white rounded-lg border border-gray-100 px-3 py-2 text-center">
                        <p className="text-[8px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">{lang === 'es' ? 'Saturación Cl. 5' : 'Saturation Cl. 5'}</p>
                        <p className="text-lg font-black text-red-600">{el.saturationClass}</p>
                        <div className="mt-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-red-400 rounded-full" style={{ width: `${Math.min((el.saturationClass / maxSat) * 100, 100)}%` }} />
                        </div>
                      </div>
                      <div className="bg-white rounded-lg border border-gray-100 px-3 py-2 text-center">
                        <p className="text-[8px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">{lang === 'es' ? 'Saturación Total' : 'All Classes'}</p>
                        <p className="text-lg font-black text-orange-600">{el.saturationAll}</p>
                        <div className="mt-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-orange-400 rounded-full" style={{ width: `${Math.min((el.saturationAll / 400) * 100, 100)}%` }} />
                        </div>
                      </div>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wide mb-0.5">{lang === 'es' ? 'Contribución a la Marca' : 'Contribution to Mark'}</p>
                      <p className="text-[10px] text-gray-700 leading-relaxed">{t(el.contribution, lang)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {/* Combined verdict */}
            <div className="rounded-xl border border-orange-200 bg-orange-50 p-4">
              <div className="flex items-start gap-2">
                <Layers size={14} className="text-orange-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] font-black text-orange-800 uppercase tracking-wide mb-1">{lang === 'es' ? 'Efecto Combinado — Veredicto Final' : 'Combined Effect — Final Verdict'}</p>
                  <p className="text-[11px] text-orange-900 leading-relaxed">{t(data.combinedVerdictNote, lang)}</p>
                </div>
              </div>
            </div>
          </div>
        </CollapsibleSection>

        {/* ─────────────────────────────────────────────────────────────────
            § 5  Field Saturation Visualization
        ───────────────────────────────────────────────────────────────── */}
        <CollapsibleSection
          title={lang === 'es' ? '§5. Saturación del Campo y Zona Distintiva' : '§5. Field Saturation & Distinctive Zone'}
          subtitle={lang === 'es' ? 'Huella de MARCia por elemento vs. espacio disponible para la marca propuesta. Doctrina IMPI: Zona muerta / Zona distintiva.' : 'MARCia footprint per element vs. available space for the proposed mark. IMPI doctrine: Dead Zone / Distinctive Zone.'}
        >
          <div className="px-5 py-5 space-y-5">
            {/* Proportional element bars */}
            <div>
              <p className="text-[10px] font-black text-gray-600 uppercase tracking-wide mb-3">{lang === 'es' ? 'Peso Relativo en MARCia (Clase 5)' : 'Relative MARCia Footprint (Class 5)'}</p>
              <div className="space-y-3">
                {data.elementDecomposition.map(el => {
                  const pct = Math.min((el.saturationClass / 120) * 100, 95);
                  return (
                    <div key={el.element} className="flex items-center gap-3">
                      <div className="w-12 flex-shrink-0 text-center">
                        <span className="text-sm font-black text-gray-800">{el.element}</span>
                      </div>
                      <div className="flex-1 h-6 bg-gray-100 rounded-lg overflow-hidden relative">
                        <div className="h-full rounded-lg flex items-center transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: TIER_COLORS[el.tier] }}>
                          <span className="text-white text-[9px] font-black pl-2 whitespace-nowrap">{el.saturationClass} {lang === 'es' ? 'registros' : 'registrations'}</span>
                        </div>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-2">
                          <span className="text-[8px] text-gray-400 font-semibold">{lang === 'es' ? 'Espacio libre' : 'Free space'}: {100 - Math.round(pct)}%</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div className="flex items-center gap-3">
                  <div className="w-12 flex-shrink-0 text-center">
                    <span className="text-[10px] font-black text-[#0f2a44]">{data.markName}</span>
                  </div>
                  <div className="flex-1 h-6 bg-gray-100 rounded-lg overflow-hidden relative">
                    <div className="h-full rounded-lg flex items-center transition-all duration-700"
                      style={{ width: `${Math.min((data.criticalConflicts.length + data.significantConflicts.length) * 12, 90)}%`, backgroundColor: '#dc2626' }}>
                      <span className="text-white text-[9px] font-black pl-2 whitespace-nowrap">{data.criticalConflicts.length} {lang === 'es' ? 'conflictos directos' : 'direct conflicts'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Zona muerta / Zona distintiva */}
            <div>
              <p className="text-[10px] font-black text-gray-600 uppercase tracking-wide mb-3">
                {lang === 'es' ? 'Zona Muerta vs. Zona Distintiva' : 'Dead Zone vs. Distinctive Zone'}
              </p>
              <div className="relative">
                <div className="flex h-10 rounded-xl overflow-hidden shadow-inner">
                  <div className="flex items-center justify-center bg-red-500" style={{ width: '78%' }}>
                    <span className="text-white text-[9px] font-black uppercase tracking-wide">
                      {lang === 'es' ? 'ZONA MUERTA — VITA/FIT saturados' : 'DEAD ZONE — VITA/FIT saturated'}
                    </span>
                  </div>
                  <div className="flex items-center justify-center bg-emerald-500" style={{ width: '22%' }}>
                    <span className="text-white text-[8px] font-black uppercase">
                      {lang === 'es' ? 'ZONA DIST.' : 'DIST. ZONE'}
                    </span>
                  </div>
                </div>
                {/* Mark pointer */}
                <div className="absolute top-full mt-1" style={{ left: '82%', transform: 'translateX(-50%)' }}>
                  <div className="w-0 h-0 border-l-[5px] border-r-[5px] border-b-[7px] border-l-transparent border-r-transparent border-b-[#0f2a44] mx-auto" />
                  <div className="bg-[#0f2a44] text-white text-[8px] font-black px-2 py-0.5 rounded mt-0.5 whitespace-nowrap">
                    {data.markName}
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-gray-500 mt-6 leading-relaxed">
                {lang === 'es'
                  ? 'La "Zona Muerta" es el espacio del registro donde los elementos son tan comunes que no pueden servir como origen de marca. El IMPI aplica esta doctrina para rechazar marcas cuyos elementos centrales ya están saturados en el campo. VITAFIT, compuesto íntegramente por VITA y FIT — ambos en zona muerta para la clase 5 — cae dentro de este impedimento.'
                  : 'The "Dead Zone" is the register space where elements are so common they cannot serve as source indicators. IMPI applies this doctrine to refuse marks whose core elements are already saturated in the field. VITAFIT, composed entirely of VITA and FIT — both in the dead zone for class 5 — falls squarely within this doctrine.'
                }
              </p>
            </div>
          </div>
        </CollapsibleSection>

        {/* ─────────────────────────────────────────────────────────────────
            § 6  Análisis de Confundibilidad
        ───────────────────────────────────────────────────────────────── */}
        <CollapsibleSection
          title={lang === 'es' ? '§6. Análisis de Confundibilidad (LFPPI)' : '§6. Confusability Analysis (LFPPI)'}
          subtitle={lang === 'es' ? 'Marco jurídico mexicano exclusivo — sin DuPont. Basado en LFPPI Arts. 171–174 y jurisprudencia TFJA / SCJN.' : 'Mexican legal framework only — no DuPont. Based on LFPPI Arts. 171–174 and TFJA / SCJN case law.'}
          defaultOpen
          badge={
            <span className="text-[10px] font-black text-red-600 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full">
              {data.confundibilidad.filter(c => c.verdict === 'desfavorable').length} {lang === 'es' ? 'desfavorables' : 'unfavorable'}
            </span>
          }
        >
          <div className="px-5 py-4 space-y-2.5">
            {data.confundibilidad.map(crit => {
              const cfg = VERDICT_CFG[crit.verdict];
              return (
                <details key={crit.id} className={`rounded-xl border overflow-hidden ${cfg.cls}`}>
                  <summary className="list-none cursor-pointer px-4 py-3 flex items-start gap-3 select-none hover:bg-black/5 transition-colors">
                    {cfg.icon}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className="text-xs font-black text-gray-800">{t(crit.title, lang)}</span>
                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wide border ${cfg.cls}`}>
                          {t(cfg.label, lang)}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-600 leading-snug">{t(crit.question, lang)}</p>
                    </div>
                    <ChevronDown size={12} className="text-gray-400 flex-shrink-0 mt-0.5" />
                  </summary>
                  <div className="px-4 pb-4 pt-3 border-t border-gray-100 bg-white/70 space-y-3">
                    <div className="flex items-center gap-1.5 bg-[#0f2a44]/5 rounded-lg px-3 py-1.5">
                      <BookOpen size={10} className="text-[#0f2a44] flex-shrink-0" />
                      <span className="text-[10px] font-bold text-[#0f2a44]">{crit.cite}</span>
                    </div>
                    <p className="text-[11px] text-gray-700 leading-relaxed">{t(crit.analysis, lang)}</p>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
                      <p className="text-[10px] text-amber-900">
                        <span className="font-black">{lang === 'es' ? 'Consecuencia para la solicitud: ' : 'Consequence for the application: '}</span>
                        {t(crit.consequence, lang)}
                      </p>
                    </div>
                  </div>
                </details>
              );
            })}
          </div>
        </CollapsibleSection>

        {/* ─────────────────────────────────────────────────────────────────
            § 7  Art. 173 LFPPI Dashboard
        ───────────────────────────────────────────────────────────────── */}
        <CollapsibleSection
          title={lang === 'es' ? '§7. Art. 173 LFPPI — Las 22 Fracciones + Art. 12' : '§7. Art. 173 LFPPI — All 22 Grounds + Art. 12'}
          subtitle={lang === 'es'
            ? `${failCount} ${lang === 'es' ? 'fallidas' : 'failed'} · ${cautionCount} precaución · ${passCount} aprobadas · ${22 - failCount - cautionCount - passCount} N/A`
            : `${failCount} failed · ${cautionCount} caution · ${passCount} passed · ${22 - failCount - cautionCount - passCount} N/A`}
          badge={failCount > 0
            ? <span className="text-[10px] font-black text-red-600 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full">{failCount} {lang === 'es' ? 'fallidas' : 'failed'}</span>
            : undefined}
        >
          <div className="px-5 py-4">
            {/* Summary bar */}
            <div className="flex rounded-xl overflow-hidden h-3 mb-5">
              <div className="bg-red-500 transition-all" style={{ width: `${(failCount / 22) * 100}%` }} title={`${failCount} fail`} />
              <div className="bg-amber-400 transition-all" style={{ width: `${(cautionCount / 22) * 100}%` }} title={`${cautionCount} caution`} />
              <div className="bg-emerald-500 transition-all" style={{ width: `${(passCount / 22) * 100}%` }} title={`${passCount} pass`} />
              <div className="bg-gray-200 transition-all flex-1" title="N/A" />
            </div>
            <div className="flex gap-4 mb-4 text-[9px] font-semibold text-gray-500">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" />{lang === 'es' ? 'Falla' : 'Fail'}: {failCount}</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />{lang === 'es' ? 'Precaución' : 'Caution'}: {cautionCount}</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />{lang === 'es' ? 'OK' : 'Pass'}: {passCount}</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-300 inline-block" />N/A: {22 - failCount - cautionCount - passCount}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {data.fracciones.map(frac => {
                const cfg = FRAC_CFG[frac.verdict];
                return (
                  <details key={frac.num} className={`rounded-xl border cursor-pointer overflow-hidden ${cfg.cls} transition-all`}>
                    <summary className="list-none px-3 py-2.5 select-none hover:bg-black/5 transition-colors">
                      <div className="flex items-start gap-2">
                        <span className={`text-xs font-black w-4 text-center flex-shrink-0 mt-0.5
                          ${frac.verdict === 'fail' ? 'text-red-600' : frac.verdict === 'caution' ? 'text-amber-600' : frac.verdict === 'pass' ? 'text-emerald-600' : 'text-gray-400'}`}>
                          {cfg.icon}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                            <span className="text-[9px] font-black text-gray-500">Fr. {frac.num}</span>
                            <span className={`text-[7px] font-black px-1 py-0.5 rounded uppercase tracking-wide ${cfg.badge}`}>
                              {frac.verdict === 'pass' ? (lang === 'es' ? 'OK' : 'Pass') : frac.verdict === 'caution' ? (lang === 'es' ? 'Precaución' : 'Caution') : frac.verdict === 'fail' ? (lang === 'es' ? 'Falla' : 'Fail') : 'N/A'}
                            </span>
                          </div>
                          <p className="text-[9px] text-gray-600 leading-tight">{t(frac.question, lang)}</p>
                        </div>
                      </div>
                    </summary>
                    <div className="px-3 pb-3 pt-2.5 border-t border-gray-100/80 space-y-2 bg-white/60">
                      <div className="bg-[#0f2a44]/6 rounded-lg px-2.5 py-2">
                        <p className="text-[9px] text-gray-600 italic leading-relaxed">{frac.statuteEs}</p>
                      </div>
                      <p className="text-[10px] text-gray-700 leading-relaxed">{t(frac.analysis, lang)}</p>
                      <div className={`rounded-lg px-2.5 py-2 ${frac.verdict === 'fail' ? 'bg-red-50 border border-red-200' : frac.verdict === 'caution' ? 'bg-amber-50 border border-amber-200' : 'bg-emerald-50 border border-emerald-100'}`}>
                        <p className={`text-[9px] font-semibold leading-relaxed ${frac.verdict === 'fail' ? 'text-red-800' : frac.verdict === 'caution' ? 'text-amber-800' : 'text-emerald-800'}`}>
                          {t(frac.consequence, lang)}
                        </p>
                      </div>
                    </div>
                  </details>
                );
              })}
              {/* Art. 12 card */}
              <details className="rounded-xl border border-emerald-100 bg-emerald-50/50 cursor-pointer overflow-hidden">
                <summary className="list-none px-3 py-2.5 select-none hover:bg-black/5 transition-colors">
                  <div className="flex items-start gap-2">
                    <span className="text-xs font-black w-4 text-center flex-shrink-0 mt-0.5 text-emerald-600">✓</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                        <span className="text-[9px] font-black text-gray-500">Art. 12</span>
                        <span className="text-[7px] font-black px-1 py-0.5 rounded uppercase tracking-wide bg-emerald-100 text-emerald-700">{lang === 'es' ? 'OK' : 'Pass'}</span>
                      </div>
                      <p className="text-[9px] text-gray-600 leading-tight">{lang === 'es' ? '¿Viola el orden público o las buenas costumbres?' : 'Does it violate public order or morality?'}</p>
                    </div>
                  </div>
                </summary>
                <div className="px-3 pb-3 pt-2.5 border-t border-emerald-100 bg-white/60">
                  <p className="text-[10px] text-gray-700 leading-relaxed">
                    {lang === 'es' ? 'VITAFIT no viola el orden público ni las buenas costumbres. Sin problemas bajo Art. 12 LFPPI.' : 'VITAFIT does not violate public order or morality. No issues under Art. 12 LFPPI.'}
                  </p>
                </div>
              </details>
            </div>
          </div>
        </CollapsibleSection>

        {/* ─────────────────────────────────────────────────────────────────
            § 8  Conflicting marks
        ───────────────────────────────────────────────────────────────── */}
        <CollapsibleSection
          title={lang === 'es' ? '§8. Marcas en Conflicto' : '§8. Conflicting Marks'}
          subtitle={lang === 'es'
            ? `${data.criticalConflicts.length} críticos (≥80%) · ${data.significantConflicts.length} significativos (50–79%) · ${data.backgroundConflicts.length} de fondo (<50%)`
            : `${data.criticalConflicts.length} critical (≥80%) · ${data.significantConflicts.length} significant (50–79%) · ${data.backgroundConflicts.length} background (<50%)`}
          defaultOpen
        >
          <div className="px-5 py-4 space-y-5">

            {/* Holder pattern callouts */}
            {data.holderClusters.map((cluster, i) => (
              <div key={i} className={`rounded-xl border px-4 py-3.5 flex items-start gap-3 ${cluster.clusterType === 'multinational' ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
                <AlertTriangle size={15} className={`flex-shrink-0 mt-0.5 ${cluster.clusterType === 'multinational' ? 'text-red-600' : 'text-amber-600'}`} />
                <div className="flex-1">
                  <p className={`text-xs font-black mb-1 ${cluster.clusterType === 'multinational' ? 'text-red-800' : 'text-amber-800'}`}>
                    {lang === 'es' ? 'Clúster detectado:' : 'Cluster detected:'}{' '}
                    <button type="button" onClick={() => setHolderFilter(holderFilter === cluster.holder ? null : cluster.holder)}
                      className="underline hover:no-underline transition-all">
                      {cluster.holder}
                    </button>
                  </p>
                  <p className={`text-[11px] leading-relaxed ${cluster.clusterType === 'multinational' ? 'text-red-700' : 'text-amber-700'}`}>
                    {t(cluster.note, lang)}
                  </p>
                  <div className="flex gap-1.5 mt-2 flex-wrap">
                    {cluster.marks.map(m => (
                      <span key={m} className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${cluster.clusterType === 'multinational' ? 'bg-red-200 text-red-900' : 'bg-amber-200 text-amber-900'}`}>{m}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}

            {/* Holder filter bar */}
            {uniqueHolders.length > 1 && (
              <div className="flex items-center gap-2 flex-wrap bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-100">
                <span className="text-[9px] font-black text-gray-500 uppercase tracking-wide">{lang === 'es' ? 'Filtrar titular:' : 'Filter by holder:'}</span>
                <button type="button" onClick={() => setHolderFilter(null)}
                  className={`text-[9px] font-bold px-2.5 py-1 rounded-full border transition-all ${!holderFilter ? 'bg-[#0f2a44] text-white border-[#0f2a44]' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'}`}>
                  {lang === 'es' ? 'Todos' : 'All'}
                </button>
                {uniqueHolders.slice(0, 6).map(h => (
                  <button key={h} type="button" onClick={() => setHolderFilter(holderFilter === h ? null : h)}
                    className={`text-[9px] font-bold px-2.5 py-1 rounded-full border transition-all ${holderFilter === h ? 'bg-[#0f2a44] text-white border-[#0f2a44]' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'}`}>
                    {h.length > 28 ? h.slice(0, 27) + '…' : h}
                  </button>
                ))}
              </div>
            )}

            {/* Critical conflicts */}
            {filteredCritical.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    <span className="text-[10px] font-black text-red-700 uppercase tracking-wide">
                      {lang === 'es' ? 'Conflictos Críticos' : 'Critical Conflicts'} — ≥80%
                    </span>
                  </div>
                  <div className="flex-1 h-px bg-red-100" />
                  <span className="text-[9px] font-black text-red-500 bg-red-50 border border-red-100 px-1.5 py-0.5 rounded-full">{filteredCritical.length}</span>
                </div>
                <div className="space-y-3">
                  {filteredCritical.map((c) => (
                    <div key={c.id} className={`rounded-xl border bg-white shadow-sm overflow-hidden ${c.id === data.topConflict.id ? 'border-red-300 ring-2 ring-red-100' : 'border-red-200'}`}>
                      {c.id === data.topConflict.id && (
                        <div className="bg-red-50 border-b border-red-200 px-4 py-1.5 flex items-center gap-1.5">
                          <Star size={10} className="text-red-500 fill-red-500" />
                          <span className="text-[9px] font-black text-red-700 uppercase tracking-widest">{lang === 'es' ? 'Conflicto Principal — Obstáculo #1' : 'Top Conflict — Primary Obstacle'}</span>
                        </div>
                      )}
                      <div className="flex items-start gap-3 px-4 py-4">
                        <div className="relative flex-shrink-0">
                          <SimilarityRing score={c.similarityScore} size={52} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 flex-wrap mb-1.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              {c.marciaUrl
                                ? <a href={c.marciaUrl} target="_blank" rel="noopener noreferrer"
                                    className="text-sm font-black text-gray-900 hover:text-[#0f2a44] flex items-center gap-1 underline decoration-gray-300 hover:decoration-[#0f2a44] transition-all">
                                    {c.name} <ExternalLink size={10} />
                                  </a>
                                : <span className="text-sm font-black text-gray-900">{c.name}</span>
                              }
                            </div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <StatusPill status={c.status} lang={lang} />
                              <span className="text-[9px] font-bold bg-[#0f2a44]/8 text-[#0f2a44] px-2 py-0.5 rounded-full">
                                {lang === 'es' ? `Cl. ${c.classNum}` : `Cl. ${c.classNum}`}
                              </span>
                            </div>
                          </div>
                          <p className="text-xs font-bold text-gray-700">{c.holder}</p>
                          <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-500 flex-wrap">
                            <span className="flex items-center gap-1"><MapPin size={9} className="flex-shrink-0" />{c.holderCountry}</span>
                            <span className="flex items-center gap-1"><Users size={9} className="flex-shrink-0" />{t(HOLDER_TYPE_LABEL[c.holderType], lang)}</span>
                            {c.filingDate && <span>{lang === 'es' ? `Solicitado: ${c.filingDate}` : `Filed: ${c.filingDate}`}</span>}
                            {c.registrationDate && <span className="font-semibold text-gray-600">{lang === 'es' ? `Reg.: ${c.registrationDate}` : `Reg.: ${c.registrationDate}`}</span>}
                            {c.registrationNumber && <span className="font-mono text-gray-400">#{c.registrationNumber}</span>}
                            {c.expediente && <span className="font-mono text-gray-400 text-[8px]">{c.expediente}</span>}
                          </div>
                          {c.goodsServices && <p className="text-[9px] text-gray-400 mt-1.5 leading-snug line-clamp-2">{c.goodsServices}</p>}
                          <div className="mt-2.5 bg-red-50 border border-red-100 rounded-lg px-3 py-2 text-[10px] text-red-700 leading-relaxed">
                            {t(c.whyItMatters, lang)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Significant conflicts */}
            {filteredSignificant.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span className="text-[10px] font-black text-amber-700 uppercase tracking-wide">
                      {lang === 'es' ? 'Conflictos Significativos' : 'Significant Conflicts'} — 50–79%
                    </span>
                  </div>
                  <div className="flex-1 h-px bg-amber-100" />
                  <span className="text-[9px] font-black text-amber-600 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded-full">{filteredSignificant.length}</span>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  {filteredSignificant.map(c => (
                    <div key={c.id} className="rounded-xl border border-amber-200 bg-white shadow-sm overflow-hidden">
                      <div className="flex items-start gap-3 px-3 py-3">
                        <div className="relative flex-shrink-0">
                          <SimilarityRing score={c.similarityScore} size={44} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap mb-1">
                            {c.marciaUrl
                              ? <a href={c.marciaUrl} target="_blank" rel="noopener noreferrer"
                                  className="text-xs font-black text-gray-900 hover:text-[#0f2a44] flex items-center gap-0.5 underline decoration-gray-300">
                                  {c.name} <ExternalLink size={9} />
                                </a>
                              : <span className="text-xs font-black text-gray-900">{c.name}</span>
                            }
                            <StatusPill status={c.status} lang={lang} />
                          </div>
                          <p className="text-[10px] font-semibold text-gray-700">{c.holder}</p>
                          <div className="flex items-center gap-2 mt-0.5 text-[9px] text-gray-500 flex-wrap">
                            <span>{c.holderCountry}</span>
                            {c.registrationNumber && <span className="font-mono text-gray-400">#{c.registrationNumber}</span>}
                          </div>
                          <p className="text-[9px] text-amber-700 mt-1.5 leading-snug">{t(c.whyItMatters, lang)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Background conflicts */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-gray-400" />
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-wide">
                    {lang === 'es' ? 'Ruido de Fondo' : 'Background Noise'} — &lt;50%
                  </span>
                </div>
                <div className="flex-1 h-px bg-gray-100" />
                <button type="button" onClick={() => setBgOpen(o => !o)}
                  className="text-[9px] font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 px-2.5 py-1 rounded-full transition-colors flex items-center gap-1">
                  {bgOpen ? lang === 'es' ? 'Ocultar' : 'Hide' : lang === 'es' ? `Ver ${data.backgroundConflicts.length}` : `View ${data.backgroundConflicts.length}`}
                  {bgOpen ? <ChevronUp size={9} /> : <ChevronDown size={9} />}
                </button>
              </div>
              {bgOpen && (
                <div className="rounded-xl border border-gray-200 overflow-hidden">
                  <table className="w-full text-[10px]">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-3 py-2 text-left font-black text-gray-600">{lang === 'es' ? 'Marca' : 'Mark'}</th>
                        <th className="px-3 py-2 text-left font-black text-gray-600">{lang === 'es' ? 'Titular' : 'Holder'}</th>
                        <th className="px-3 py-2 text-center font-black text-gray-600">{lang === 'es' ? 'Cl.' : 'Cl.'}</th>
                        <th className="px-3 py-2 text-center font-black text-gray-600">{lang === 'es' ? 'Estado' : 'Status'}</th>
                        <th className="px-3 py-2 text-center font-black text-gray-600">%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.backgroundConflicts.map((c, i) => (
                        <tr key={c.id} className={`border-b border-gray-100 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                          <td className="px-3 py-2 font-bold text-gray-800">{c.name}</td>
                          <td className="px-3 py-2 text-gray-600">{c.holder}</td>
                          <td className="px-3 py-2 text-center text-gray-500">{c.classNum}</td>
                          <td className="px-3 py-2 text-center"><StatusPill status={c.status} lang={lang} /></td>
                          <td className="px-3 py-2 text-center font-black text-gray-500">{c.similarityScore}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </CollapsibleSection>

        {/* ─────────────────────────────────────────────────────────────────
            § 9  Mala Fe
        ───────────────────────────────────────────────────────────────── */}
        <CollapsibleSection
          title={lang === 'es' ? '§9. Análisis de Mala Fe (Art. 173 Fr. XXII)' : '§9. Bad-Faith Analysis (Art. 173 Fr. XXII)'}
          subtitle={lang === 'es' ? 'Indicadores según la fracción XXII introducida en la reforma LFPPI 2020.' : 'Indicators under Fr. XXII introduced in the 2020 LFPPI reform.'}
          badge={<span className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${malaFeCfg[data.malaFeVerdict].cls}`}>{lang === 'es' ? 'Riesgo' : 'Risk'}: {t(malaFeCfg[data.malaFeVerdict].label, lang)}</span>}
        >
          <div className="px-5 py-5 space-y-4">
            <div className="space-y-2">
              {data.malaFeIndicators.map((ind, i) => (
                <div key={i} className={`flex items-start gap-3 rounded-xl px-4 py-3 border ${ind.present ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-100'}`}>
                  {ind.present
                    ? <XCircle size={15} className="text-red-500 flex-shrink-0 mt-0.5" />
                    : <CheckCircle2 size={15} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                  }
                  <div>
                    <p className={`text-[11px] font-bold ${ind.present ? 'text-red-800' : 'text-gray-600'}`}>{t(ind.label, lang)}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">{t(ind.note, lang)}</p>
                  </div>
                  <span className={`ml-auto text-[8px] font-black px-1.5 py-0.5 rounded-full flex-shrink-0 ${ind.present ? 'bg-red-200 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {ind.present ? (lang === 'es' ? 'Presente' : 'Present') : (lang === 'es' ? 'Ausente' : 'Absent')}
                  </span>
                </div>
              ))}
            </div>
            <div className={`rounded-xl border p-4 ${malaFeCfg[data.malaFeVerdict].cls}`}>
              <div className="flex items-center gap-2 mb-2">
                <Scale size={14} className="flex-shrink-0" />
                <p className="text-xs font-black uppercase tracking-wide">
                  {lang === 'es' ? `Evaluación IA de mala fe: ${t(malaFeCfg[data.malaFeVerdict].label, lang).toUpperCase()}` : `AI bad-faith assessment: ${t(malaFeCfg[data.malaFeVerdict].label, lang).toUpperCase()}`}
                </p>
              </div>
              <p className="text-[11px] leading-relaxed">{t(data.malaFeRationale, lang)}</p>
            </div>
          </div>
        </CollapsibleSection>

        {/* ─────────────────────────────────────────────────────────────────
            § 10  Riesgo de Oposición y Nulidad
        ───────────────────────────────────────────────────────────────── */}
        <CollapsibleSection
          title={lang === 'es' ? '§10. Riesgo de Oposición y Nulidad' : '§10. Opposition & Nullity Risk'}
          subtitle={lang === 'es' ? 'Procedimiento de oposición (Arts. 178–191 LFPPI) y acción de nulidad (Art. 258 LFPPI).' : 'Opposition procedure (Arts. 178–191 LFPPI) and nullity action (Art. 258 LFPPI).'}
        >
          <div className="px-5 py-5 grid sm:grid-cols-2 gap-4">
            {/* Opposition panel */}
            <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={14} className="text-amber-600" />
                <h3 className="text-xs font-black text-amber-800">{lang === 'es' ? 'Procedimiento de Oposición' : 'Opposition Procedure'}</h3>
              </div>
              {/* Mini timeline */}
              <div className="space-y-2 mb-4">
                {[
                  { label: { en: 'Publication in IMPI Gaceta', es: 'Publicación en Gaceta IMPI' }, sub: { en: '~3–6 months post-filing', es: '~3–6 meses post-presentación' } },
                  { label: { en: 'Opposition window opens', es: 'Apertura ventana de oposición' }, sub: { en: '30 calendar days', es: '30 días calendario' } },
                  { label: { en: 'Applicant response to opposition', es: 'Respuesta del solicitante' }, sub: { en: '1 month', es: '1 mes' } },
                  { label: { en: 'IMPI examiner decision', es: 'Resolución del examinador IMPI' }, sub: { en: 'Variable; 3–12 months', es: 'Variable; 3–12 meses' } },
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className="w-4 h-4 rounded-full bg-amber-200 border border-amber-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-[7px] font-black text-amber-700">{i + 1}</span>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-amber-900">{t(step.label, lang)}</p>
                      <p className="text-[9px] text-amber-600">{t(step.sub, lang)}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[10px] font-black text-amber-800 mb-1">{lang === 'es' ? 'Posibles opositores:' : 'Likely opposers:'}</p>
              {data.criticalConflicts.map(c => (
                <div key={c.id} className="flex items-center gap-1.5 mb-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                  <span className="text-[10px] font-semibold text-amber-900">{c.holder}</span>
                  <span className="text-[9px] text-amber-600">({c.name})</span>
                </div>
              ))}
            </div>

            {/* Nullity panel */}
            <div className="rounded-xl border border-red-200 bg-red-50/60 p-4">
              <div className="flex items-center gap-2 mb-3">
                <XCircle size={14} className="text-red-600" />
                <h3 className="text-xs font-black text-red-800">{lang === 'es' ? 'Acción de Nulidad' : 'Nullity Action'}</h3>
              </div>
              <div className="space-y-3 text-[10px] text-red-800 leading-relaxed">
                <p>
                  <strong>{lang === 'es' ? 'Fundamento:' : 'Legal basis:'}</strong>{' '}
                  {lang === 'es'
                    ? 'Art. 258 LFPPI. Cualquier tercero con interés jurídico puede solicitar la nulidad de un registro obtenido en contravención a las disposiciones legales.'
                    : 'Art. 258 LFPPI. Any interested third party may petition for nullity of a registration obtained in contravention of legal provisions.'}
                </p>
                <p>
                  <strong>{lang === 'es' ? 'Plazo:' : 'Time limit:'}</strong>{' '}
                  {lang === 'es'
                    ? '5 años desde la fecha de publicación del otorgamiento. Sin plazo si se obtiene de mala fe (Art. 258 Fr. VI).'
                    : '5 years from publication of grant date. No time limit if obtained in bad faith (Art. 258 Fr. VI).'}
                </p>
                <p>
                  <strong>{lang === 'es' ? 'Marcas que podrían usarse:' : 'Marks deployable for nullity:'}</strong>
                </p>
                {data.criticalConflicts.filter(c => c.status === 'registrado').map(c => (
                  <div key={c.id} className="flex items-start gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0 mt-1" />
                    <span>{c.holder} — {c.name} (#{c.registrationNumber})</span>
                  </div>
                ))}
                <div className="bg-red-100 border border-red-200 rounded-lg px-3 py-2 mt-2">
                  <p className="font-black">
                    {lang === 'es'
                      ? '⚠ LIDL STIFTUNG tiene base para nulidad absoluta si se otorga el registro, con o sin plazo dado que existe identidad de marca y mala fe potencial.'
                      : '⚠ LIDL STIFTUNG has grounds for absolute nullity if registration is granted — no time limit given mark identity and potential bad faith.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CollapsibleSection>

        {/* ─────────────────────────────────────────────────────────────────
            § 11  Marcas Notorias y Famosas
        ───────────────────────────────────────────────────────────────── */}
        <CollapsibleSection
          title={lang === 'es' ? '§11. Marcas Notorias y Famosas (Art. 173 Fr. XVI–XVII)' : '§11. Notorious & Famous Marks (Art. 173 Fr. XVI–XVII)'}
          subtitle={lang === 'es' ? 'Dilución, confusión y aprovechamiento de reputación ajena — verificación IMPI.' : 'Dilution, blurring, tarnishment check against IMPI-declared notorious marks.'}
          badge={<span className="text-[10px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">{lang === 'es' ? 'Sin declaración formal detectada' : 'No formal declaration detected'}</span>}
        >
          <div className="px-5 py-5 space-y-3">
            {data.famousMarks.map((fm, i) => (
              <div key={i} className={`rounded-xl border p-4 ${fm.detected ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex items-start gap-3">
                  {fm.detected
                    ? <AlertCircle size={15} className="text-red-600 flex-shrink-0 mt-0.5" />
                    : <Info size={15} className="text-gray-500 flex-shrink-0 mt-0.5" />
                  }
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs font-black text-gray-800">{fm.name}</span>
                      <span className="text-[9px] text-gray-500">·</span>
                      <span className="text-[10px] text-gray-600 font-semibold">{fm.holder}</span>
                      <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full ${fm.detected ? 'bg-red-200 text-red-800' : 'bg-gray-200 text-gray-600'}`}>
                        {fm.detected ? (lang === 'es' ? 'DETECTADA' : 'DETECTED') : (lang === 'es' ? 'NO DECLARADA' : 'NOT DECLARED')}
                      </span>
                    </div>
                    <p className="text-[9px] text-gray-500 mb-2">{fm.sector}</p>
                    <p className="text-[10px] text-gray-700 leading-relaxed">{t(fm.threat, lang)}</p>
                  </div>
                </div>
              </div>
            ))}
            <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
              <p className="text-[10px] text-blue-800 leading-relaxed">
                <span className="font-black">{lang === 'es' ? 'Nota: ' : 'Note: '}</span>
                {lang === 'es'
                  ? 'La ausencia de declaración formal de marca notoria/famosa no elimina el riesgo de una acción de dilución. LIDL podría solicitar la declaración de notoriedad en el contexto de una oposición. Monitorear la Gaceta de la Propiedad Industrial.'
                  : 'The absence of a formal notorious/famous mark declaration does not eliminate dilution action risk. LIDL could seek a notoriety declaration in the context of an opposition. Monitor the Gaceta de la Propiedad Industrial.'}
              </p>
            </div>
          </div>
        </CollapsibleSection>

        {/* ─────────────────────────────────────────────────────────────────
            § 12  Cross-Language Analysis
        ───────────────────────────────────────────────────────────────── */}
        <CollapsibleSection
          title={lang === 'es' ? '§12. Análisis Lingüístico Cruzado' : '§12. Cross-Language Analysis'}
          subtitle={lang === 'es' ? 'Traducción y transliteración en 8 idiomas — detección de conflictos inter-idiomáticos.' : 'Translation and transliteration in 8 languages — cross-language conflict detection.'}
        >
          <div className="px-5 py-4 space-y-2">
            {data.translationAnalysis.map(ta => {
              const rColor = riskColor(ta.risk);
              const rPct = riskPct(ta.risk);
              return (
                <div key={ta.lang} className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                  <div className="w-6 h-6 rounded-lg bg-[#0f2a44] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-[8px] font-black uppercase">{ta.lang}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className="text-[11px] font-black text-gray-800">{ta.langName}</span>
                      <span className="text-[10px] font-mono text-gray-600">{ta.form}</span>
                    </div>
                    <p className="text-[10px] text-gray-600 leading-relaxed">{ta.note}</p>
                  </div>
                  <div className="flex-shrink-0 text-right w-16">
                    <div className="h-1.5 bg-gray-200 rounded-full mb-1">
                      <div className="h-full rounded-full" style={{ width: `${rPct}%`, backgroundColor: rColor }} />
                    </div>
                    <span className="text-[8px] font-black uppercase tracking-wide" style={{ color: rColor }}>
                      {ta.risk === 'none' ? (lang === 'es' ? 'Ninguno' : 'None') : ta.risk === 'low' ? (lang === 'es' ? 'Bajo' : 'Low') : ta.risk === 'medium' ? (lang === 'es' ? 'Medio' : 'Medium') : (lang === 'es' ? 'Alto' : 'High')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </CollapsibleSection>

        {/* ─────────────────────────────────────────────────────────────────
            § 13  Otros Impedimentos Absolutos
        ───────────────────────────────────────────────────────────────── */}
        <CollapsibleSection
          title={lang === 'es' ? '§13. Otros Impedimentos Absolutos' : '§13. Other Absolute Grounds'}
          subtitle={lang === 'es' ? 'Todos los impedimentos adicionales evaluados — N/A explícito para transparencia del análisis.' : 'All additional grounds evaluated — explicit N/A for analytical transparency.'}
        >
          <div className="px-5 py-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {data.otherGrounds.map(og => {
              const cfg = FRAC_CFG[og.verdict];
              return (
                <div key={og.id} className={`rounded-xl border px-3 py-3 flex items-start gap-2 ${cfg.cls}`}>
                  <span className={`text-xs font-black flex-shrink-0 mt-0.5
                    ${og.verdict === 'fail' ? 'text-red-600' : og.verdict === 'caution' ? 'text-amber-600' : og.verdict === 'pass' ? 'text-emerald-600' : 'text-gray-400'}`}>
                    {cfg.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                      <span className="text-[10px] font-black text-gray-800">{t(og.label, lang)}</span>
                      <span className={`text-[7px] font-black px-1 py-0.5 rounded uppercase tracking-wide ${cfg.badge}`}>
                        {og.verdict === 'pass' ? (lang === 'es' ? 'OK' : 'Pass') : og.verdict === 'caution' ? (lang === 'es' ? 'Precaución' : 'Caution') : og.verdict === 'fail' ? (lang === 'es' ? 'Falla' : 'Fail') : 'N/A'}
                      </span>
                    </div>
                    <p className="text-[9px] text-gray-500 font-mono">{og.cite}</p>
                    <p className="text-[10px] text-gray-600 leading-snug mt-1">{t(og.note, lang)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CollapsibleSection>

        {/* ─────────────────────────────────────────────────────────────────
            § 14  Estrategia — Decision Matrix
        ───────────────────────────────────────────────────────────────── */}
        <CollapsibleSection
          title={lang === 'es' ? '§14. Estrategia Recomendada — Matriz de Decisión' : '§14. Recommended Strategy — Decision Matrix'}
          subtitle={lang === 'es' ? '5 vías de acción. Mayor viabilidad = menor riesgo de fracaso. Estrategia E recomendada.' : '5 action paths. Higher viability = lower failure risk. Strategy E recommended.'}
          defaultOpen
          badge={<span className="text-[10px] font-black text-[#0f2a44] bg-[#0f2a44]/8 border border-[#0f2a44]/15 px-2.5 py-1 rounded-full">{lang === 'es' ? 'Recomendado: Opción E' : 'Recommended: Option E'}</span>}
        >
          <div className="px-5 py-5 space-y-3">
            {data.strategies.map(strat => {
              const isRecommended = strat.viability >= 88;
              return (
                <details key={strat.id} className={`rounded-xl border overflow-hidden ${isRecommended ? 'border-emerald-300 ring-2 ring-emerald-100' : 'border-gray-200'}`}>
                  <summary className={`list-none cursor-pointer px-4 py-4 flex items-start gap-3 select-none hover:bg-black/5 transition-colors ${isRecommended ? 'bg-emerald-50' : 'bg-white'}`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        {isRecommended && <Star size={11} className="text-emerald-600 fill-emerald-200 flex-shrink-0" />}
                        <span className="text-sm font-black text-gray-900">{t(strat.title, lang)}</span>
                        {isRecommended && <span className="text-[8px] font-black bg-emerald-200 text-emerald-800 px-1.5 py-0.5 rounded-full uppercase tracking-wide">{lang === 'es' ? 'Recomendada' : 'Recommended'}</span>}
                      </div>
                      {/* Viability bar */}
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${strat.viability}%`, backgroundColor: strat.viability >= 70 ? '#16a34a' : strat.viability >= 40 ? '#f59e0b' : '#dc2626' }} />
                        </div>
                        <span className="text-[10px] font-black text-gray-600 w-24 flex-shrink-0">
                          {lang === 'es' ? 'Éxito:' : 'Success:'} {strat.successRange}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="text-right">
                        <p className="text-[9px] font-bold text-gray-500">{lang === 'es' ? 'Cuotas' : 'Fees'}</p>
                        <p className="text-[10px] font-black text-gray-700">{strat.feesMxn}</p>
                      </div>
                      <ChevronDown size={12} className="text-gray-400 flex-shrink-0" />
                    </div>
                  </summary>
                  <div className="px-4 pb-4 pt-3 border-t border-gray-100 bg-white space-y-3">
                    <p className="text-[11px] text-gray-700 leading-relaxed">{t(strat.description, lang)}</p>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div>
                        <p className="text-[9px] font-black text-emerald-700 uppercase tracking-wide mb-1.5">{lang === 'es' ? 'Ventajas' : 'Pros'}</p>
                        <div className="space-y-1">
                          {strat.pros.map((p, i) => (
                            <div key={i} className="flex items-start gap-1.5">
                              <CheckCircle2 size={10} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                              <p className="text-[10px] text-gray-700">{t(p, lang)}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-red-700 uppercase tracking-wide mb-1.5">{lang === 'es' ? 'Desventajas' : 'Cons'}</p>
                        <div className="space-y-1">
                          {strat.cons.map((c, i) => (
                            <div key={i} className="flex items-start gap-1.5">
                              <XCircle size={10} className="text-red-500 flex-shrink-0 mt-0.5" />
                              <p className="text-[10px] text-gray-700">{t(c, lang)}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
                      <Clock size={11} className="text-gray-400 flex-shrink-0" />
                      <span><strong>{lang === 'es' ? 'Plazo:' : 'Timeline:'}</strong> {t(strat.timeline, lang)}</span>
                    </div>
                    {strat.alternatives && strat.alternatives.length > 0 && (
                      <div>
                        <p className="text-[9px] font-black text-gray-600 uppercase tracking-wide mb-2">{lang === 'es' ? 'Alternativas generadas' : 'Generated alternatives'}</p>
                        <div className="flex gap-2 flex-wrap">
                          {strat.alternatives.map(alt => (
                            <div key={alt.name} className="bg-[#0f2a44] text-white rounded-lg px-3 py-1.5 text-center min-w-[80px]">
                              <p className="text-[10px] font-black">{alt.name}</p>
                              <p className="text-[8px] text-white/60 mt-0.5">{lang === 'es' ? 'Puntuación:' : 'Score:'} {alt.quickScore}/100</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <button type="button" className="flex items-center gap-1.5 text-[11px] font-black text-[#0f2a44] bg-[#0f2a44]/8 hover:bg-[#0f2a44]/15 px-4 py-2 rounded-lg transition-colors">
                      {t(strat.cta, lang)} <ArrowRight size={11} />
                    </button>
                  </div>
                </details>
              );
            })}
          </div>
        </CollapsibleSection>

        {/* ─────────────────────────────────────────────────────────────────
            § 15  Cost & Timeline
        ───────────────────────────────────────────────────────────────── */}
        <CollapsibleSection
          title={lang === 'es' ? '§15. Costos y Plazos IMPI' : '§15. IMPI Cost & Timeline'}
          subtitle={lang === 'es' ? '6 etapas del proceso de registro — escenarios sin oposición vs. con oposición.' : '6-step registration process — uncontested vs. contested scenarios.'}
        >
          <div className="px-5 py-5 space-y-5">
            {/* Steps */}
            <div className="space-y-3">
              {data.impiSteps.map((step, i) => (
                <div key={step.step} className="flex gap-3">
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0
                      ${step.step === 6 ? 'bg-[#0f2a44] text-white' : 'bg-[#0f2a44]/10 text-[#0f2a44]'}`}>
                      {step.step}
                    </div>
                    {i < data.impiSteps.length - 1 && <div className="w-0.5 h-6 bg-gray-200 mt-1" />}
                  </div>
                  <div className="flex-1 pb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-xs font-black text-gray-800">{t(step.label, lang)}</p>
                      <span className="text-[9px] font-bold text-[#e07a3f] bg-orange-50 border border-orange-200 px-1.5 py-0.5 rounded-full">{t(step.duration, lang)}</span>
                    </div>
                    {step.note && <p className="text-[10px] text-gray-600 leading-relaxed mt-0.5">{t(step.note, lang)}</p>}
                  </div>
                </div>
              ))}
            </div>

            {/* Fee summary + scenarios */}
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-[9px] font-black text-emerald-700 uppercase tracking-wide mb-1">{lang === 'es' ? 'Escenario Sin Oposición' : 'Uncontested Scenario'}</p>
                <p className="text-2xl font-black text-emerald-800">MXN {data.totalFeesMxn.toLocaleString()}</p>
                <p className="text-[10px] text-emerald-600 mt-0.5">{lang === 'es' ? '1 clase · 12–18 meses' : '1 class · 12–18 months'}</p>
                <p className="text-[9px] text-emerald-600 mt-2">{lang === 'es' ? 'Cuota de presentación oficial IMPI (sujeta a actualización anual).' : 'Official IMPI filing fee (subject to annual adjustment).'}</p>
              </div>
              <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                <p className="text-[9px] font-black text-red-700 uppercase tracking-wide mb-1">{lang === 'es' ? 'Escenario Con Oposición (LIDL)' : 'Contested Scenario (LIDL)'}</p>
                <p className="text-2xl font-black text-red-800">MXN {(data.totalFeesMxn + 45000).toLocaleString()}+</p>
                <p className="text-[10px] text-red-600 mt-0.5">{lang === 'es' ? '1 clase · 24–36+ meses' : '1 class · 24–36+ months'}</p>
                <p className="text-[9px] text-red-600 mt-2">{lang === 'es' ? 'Incluye honorarios de defensa de oposición estimados. Alta probabilidad de negativa final.' : 'Includes estimated opposition defense fees. High probability of final refusal.'}</p>
              </div>
            </div>
          </div>
        </CollapsibleSection>

        {/* ─────────────────────────────────────────────────────────────────
            § 16  Domain Availability
        ───────────────────────────────────────────────────────────────── */}
        <CollapsibleSection
          title={lang === 'es' ? '§16. Disponibilidad de Dominios' : '§16. Domain Availability'}
          subtitle={lang === 'es' ? 'TLDs mexicanos primero (.com.mx, .mx), luego internacionales.' : 'Mexican TLDs first (.com.mx, .mx), then international.'}
        >
          <div className="px-5 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {data.domains.map(d => (
                <div key={d.domain} className={`flex items-center justify-between px-4 py-3 rounded-xl border ${d.status === 'available' ? 'bg-emerald-50 border-emerald-200' : d.status === 'taken' ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex items-center gap-2">
                    <Globe size={12} className={d.status === 'available' ? 'text-emerald-600' : d.status === 'taken' ? 'text-red-500' : 'text-gray-400'} />
                    <span className="text-[11px] font-bold font-mono text-gray-800">{d.domain}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[8px] font-black px-2 py-0.5 rounded-full ${d.status === 'available' ? 'bg-emerald-200 text-emerald-800' : d.status === 'taken' ? 'bg-red-200 text-red-800' : 'bg-gray-200 text-gray-600'}`}>
                      {d.status === 'available' ? (lang === 'es' ? 'DISPONIBLE' : 'AVAILABLE') : d.status === 'taken' ? (lang === 'es' ? 'TOMADO' : 'TAKEN') : (lang === 'es' ? 'DESCONOCIDO' : 'UNKNOWN')}
                    </span>
                    {d.status === 'available' && (
                      <button type="button" className="text-[8px] font-black text-[#e07a3f] hover:text-orange-600 transition-colors">
                        {lang === 'es' ? 'Registrar →' : 'Register →'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CollapsibleSection>

        {/* ─────────────────────────────────────────────────────────────────
            § 17  Methodology & Disclaimers
        ───────────────────────────────────────────────────────────────── */}
        <CollapsibleSection
          title={lang === 'es' ? '§17. Metodología y Limitaciones' : '§17. Methodology & Limitations'}
          subtitle={lang === 'es' ? 'Fuentes, metodología, limitaciones y aviso legal.' : 'Sources, methodology, limitations, and legal notice.'}
        >
          <div className="px-5 py-5 space-y-4 text-[10px] text-gray-600 leading-relaxed">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <p className="font-black text-gray-800 mb-2 uppercase tracking-wide text-[9px]">{lang === 'es' ? 'Fuentes de Datos' : 'Data Sources'}</p>
                <div className="space-y-1.5">
                  {[
                    { label: 'MARCia (IMPI)', desc: lang === 'es' ? 'Base de datos pública de marcas mexicanas.' : 'IMPI public trademark database.' },
                    { label: 'Gaceta de la Propiedad Industrial', desc: lang === 'es' ? 'Publicación oficial IMPI.' : 'IMPI official publication.' },
                    { label: 'INDAUTOR', desc: lang === 'es' ? 'Registro de derechos de autor México.' : 'Mexico copyright register.' },
                    { label: 'WIPO Global Brand Database', desc: lang === 'es' ? 'Base de datos global de marcas OMPI.' : 'WIPO global trademark database.' },
                    { label: 'AI-assisted analysis', desc: lang === 'es' ? 'Análisis asistido por modelo de IA (familia Claude, Anthropic).' : 'AI-model-assisted analysis (Claude family, Anthropic).' },
                  ].map(s => (
                    <div key={s.label} className="flex items-start gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#0f2a44]/30 flex-shrink-0 mt-1.5" />
                      <p><strong className="text-gray-700">{s.label}:</strong> {s.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="font-black text-gray-800 mb-2 uppercase tracking-wide text-[9px]">{lang === 'es' ? 'Metodología' : 'Methodology'}</p>
                <div className="space-y-1.5">
                  <p><strong className="text-gray-700">{lang === 'es' ? 'Puntuación de similitud:' : 'Similarity scoring:'}</strong> {lang === 'es' ? 'Combinación ponderada de distancia de Levenshtein, fonética Soundex y análisis semántico IA.' : 'Weighted combination of Levenshtein distance, Soundex phonetics, and AI semantic analysis.'}</p>
                  <p><strong className="text-gray-700">{lang === 'es' ? 'Saturación:' : 'Saturation:'}</strong> {lang === 'es' ? 'Conteo de registros activos en MARCia que contienen el elemento evaluado en la clase objetivo.' : 'Count of active MARCia registrations containing the evaluated element in the target class.'}</p>
                  <p><strong className="text-gray-700">{lang === 'es' ? 'Alternativas:' : 'Alternatives:'}</strong> {lang === 'es' ? 'Generadas por IA contra el mismo corpus MARCia. Los puntajes rápidos son estimativos.' : 'AI-generated against the same MARCia corpus. Quick scores are estimates.'}</p>
                  <p><strong className="text-gray-700">{lang === 'es' ? 'Marco legal:' : 'Legal framework:'}</strong> {lang === 'es' ? 'Exclusivamente LFPPI Arts. 12, 171–174, 178–191, 258 y práctica examinadora IMPI. Sin referencias a ley extranjera.' : 'Exclusively LFPPI Arts. 12, 171–174, 178–191, 258 and IMPI examiner practice. No foreign law references.'}</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-[#0f2a44]/5 border border-[#0f2a44]/10 px-4 py-3">
              <p className="text-[10px] text-[#0f2a44] leading-relaxed">
                <strong>{lang === 'es' ? 'Limitaciones: ' : 'Limitations: '}</strong>
                {lang === 'es'
                  ? 'La IA puede omitir coincidencias; solo incluye datos vigentes a la fecha de búsqueda; las cuotas IMPI están sujetas a actualización; esta herramienta no constituye asesoría jurídica.'
                  : 'AI may miss matches; only includes data current as of search date; IMPI fees are subject to change; this tool does not constitute legal advice.'}
              </p>
            </div>

            <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
              <p className="text-[10px] text-amber-900 font-semibold leading-relaxed">
                {lang === 'es'
                  ? 'Análisis preliminar asistido por IA. No sustituye la revisión por un abogado mexicano especializado en propiedad industrial antes de presentar cualquier solicitud.'
                  : 'Preliminary AI-assisted analysis. Not a substitute for review by a Mexican IP attorney before filing any trademark application.'}
              </p>
            </div>

            <p className="text-[9px] text-gray-400 text-center pt-2">
              {lang === 'es' ? 'Generado por' : 'Generated by'} Mexico Trademark Center · {new Date().toLocaleDateString(lang === 'es' ? 'es-MX' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })} · {lang === 'es' ? 'Solo para uso interno del cliente' : 'For client internal use only'}
            </p>
          </div>
        </CollapsibleSection>

      </div>
    </div>
  );
}
