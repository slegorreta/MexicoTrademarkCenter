import { useState } from 'react';
import {
  AlertCircle, AlertTriangle, CheckCircle2, ChevronDown, ChevronUp,
  ExternalLink, Globe, Info, Scale, Shield, Sparkles, Star, Tag,
  TrendingUp, Zap, X, FileText, Clock, Users, Building2, MapPin,
  BarChart2, Layers, Target, BookOpen, ArrowRight,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

type Lang = 'en' | 'es';
type Tier = 'generic' | 'descriptive' | 'suggestive' | 'arbitrary' | 'fanciful';
type ConflictStatus = 'registrado' | 'en_tramite' | 'caducado';
type Verdict = 'favorable' | 'neutral' | 'desfavorable' | 'na';
type FraccionVerdict = 'pass' | 'caution' | 'fail' | 'na';

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
  whyItMatters: { en: string; es: string };
}

interface ElementDecomp {
  element: string;
  meaning: { en: string; es: string };
  etymology: { en: string; es: string };
  saturationClass: number;
  saturationAll: number;
  tier: Tier;
  contribution: { en: string; es: string };
}

interface ConfundibilidadCriterion {
  id: string;
  title: { en: string; es: string };
  question: { en: string; es: string };
  verdict: Verdict;
  cite: string;
  analysis: { en: string; es: string };
  consequence: { en: string; es: string };
}

interface FraccionCard {
  num: string;
  question: { en: string; es: string };
  verdict: FraccionVerdict;
  statuteEs: string;
  analysis: { en: string; es: string };
  consequence: { en: string; es: string };
}

interface Strategy {
  id: string;
  title: { en: string; es: string };
  viability: number;
  description: { en: string; es: string };
  feesMxn: string;
  timeline: { en: string; es: string };
  successRange: string;
  pros: { en: string; es: string }[];
  cons: { en: string; es: string }[];
  cta: { en: string; es: string };
  alternatives?: { name: string; quickScore: number }[];
}

interface ReportData {
  markName: string;
  classes: number[];
  goodsServices: { en: string; es: string };
  overallRisk: 'critical' | 'high' | 'moderate' | 'low' | 'clear';
  registrabilityScore: number;
  distinctivenessTier: Tier;
  distinctivenessScore: number;
  distinctivenessExplanation: { en: string; es: string };
  headlineReason: { en: string; es: string };
  topConflict: ConflictMark;
  criticalConflicts: ConflictMark[];
  significantConflicts: ConflictMark[];
  backgroundConflicts: ConflictMark[];
  holderClusters: Array<{ holder: string; marks: string[]; note: { en: string; es: string } }>;
  elementDecomposition: ElementDecomp[];
  axisScores: {
    distintividadInherente: number;
    disponibilidadRegistral: number;
    saturacionCampo: number;
    cumplimientoArt173: number;
    riesgoOposicion: number;
  };
  confundibilidad: ConfundibilidadCriterion[];
  fracciones: FraccionCard[];
  malaFeIndicators: Array<{ label: { en: string; es: string }; present: boolean }>;
  malaFeVerdict: 'low' | 'medium' | 'high';
  malaFeRationale: { en: string; es: string };
  translationAnalysis: Array<{ lang: string; langName: string; form: string; risk: 'none' | 'low' | 'medium' | 'high'; note: string }>;
  domains: Array<{ domain: string; status: 'available' | 'taken' | 'unknown' }>;
  famousMarks: Array<{ name: string; holder: string; sector: string; threat: string }>;
  strategies: Strategy[];
}

// ─── Sample Vitafit / Class 5 Data ───────────────────────────────────────────

const VITAFIT_DATA: ReportData = {
  markName: 'VITAFIT',
  classes: [5],
  goodsServices: {
    en: 'Dietary supplements, vitamins, mineral supplements, protein powders, weight-loss preparations, health foods for medical use.',
    es: 'Suplementos alimenticios, vitaminas, suplementos minerales, proteínas en polvo, preparaciones para adelgazar, alimentos para uso médico.',
  },
  overallRisk: 'high',
  registrabilityScore: 22,
  distinctivenessTier: 'descriptive',
  distinctivenessScore: 2,
  distinctivenessExplanation: {
    en: '"VITA" (Latin for "life") and "FIT" (English for "physically fit / in good shape") each directly describe attributes of dietary supplements and health products in class 5. Together they communicate "life + fitness" immediately and without mental effort — the very test for descriptiveness under LFPPI Art. 173 Fr. IV. IMPI examiners routinely refuse marks of this type for class 5 goods on absolute grounds.',
    es: '"VITA" (del latín "vida") y "FIT" (del inglés, "en forma") describen directamente atributos de suplementos alimenticios y productos de salud de la clase 5. Juntos comunican "vida + forma física" de manera inmediata y sin esfuerzo mental, lo que configura el supuesto de descriptividad bajo el Art. 173 Fr. IV LFPPI. El IMPI rechaza rutinariamente marcas de este tipo para productos de la clase 5.',
  },
  headlineReason: {
    en: 'Identical mark VITAFIT already registered in class 5 by LIDL STIFTUNG & CO. KG (Germany). Descriptive combination under Art. 173 Fr. IV also creates an absolute bar.',
    es: 'La marca idéntica VITAFIT ya está registrada en la clase 5 por LIDL STIFTUNG & CO. KG (Alemania). La combinación descriptiva bajo el Art. 173 Fr. IV también constituye un impedimento absoluto.',
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
    goodsServices: 'Dietary supplements, vitamins, mineral preparations, protein supplements, slimming preparations.',
    marciaUrl: 'https://marcia.impi.gob.mx/marcas/search/quick',
    whyItMatters: {
      en: 'Phonetically, visually, and conceptually identical mark held by a German multinational with significant legal enforcement resources. This is a direct Art. 173 Fr. XVIII / XIX conflict that will almost certainly result in refusal or, post-registration, nullity.',
      es: 'Marca idéntica en fonética, grafía y concepto, titular de una multinacional alemana con amplios recursos legales. Conflicto directo bajo Art. 173 Fr. XVIII / XIX que casi con certeza resultará en negativa o, post-registro, en nulidad.',
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
      goodsServices: 'Dietary supplements, vitamins, mineral preparations, protein supplements, slimming preparations.',
      marciaUrl: 'https://marcia.impi.gob.mx/marcas/search/quick',
      whyItMatters: {
        en: 'Identical mark, same class, multinational holder with enforcement resources.',
        es: 'Marca idéntica, misma clase, titular multinacional con recursos de enforcement.',
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
      goodsServices: 'Nutritional supplements, dietary preparations, vitamins.',
      marciaUrl: 'https://marcia.impi.gob.mx/marcas/search/quick',
      whyItMatters: {
        en: 'Contains VITAFIT as the dominant component. Same class 5 goods. Part of a defensive trademark cluster held by the same individual.',
        es: 'Contiene VITAFIT como elemento dominante. Misma clase 5. Parte de un clúster de marcas defensivas del mismo titular.',
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
      filingDate: '2018-07-22',
      registrationDate: '2020-01-15',
      similarityScore: 88,
      expediente: 'MX/E/2018/034213',
      registrationNumber: '1689341',
      goodsServices: 'Nutritional supplements, dietary preparations, vitamins.',
      marciaUrl: 'https://marcia.impi.gob.mx/marcas/search/quick',
      whyItMatters: {
        en: 'Phonetically and conceptually near-identical. VITAL–FIT evokes the same "life + fitness" concept in class 5.',
        es: 'Fonéticamente y conceptualmente casi idéntico. VITAL–FIT evoca el mismo concepto "vida + forma" en clase 5.',
      },
    },
    {
      id: 'cc4',
      name: 'VIVA-FIT',
      holder: 'ALFONSO VILLANUEVA VALENCIANO',
      holderCountry: 'Mexico',
      holderType: 'persona_fisica_mx',
      classNum: 5,
      status: 'registrado',
      filingDate: '2019-02-10',
      registrationDate: '2020-08-20',
      similarityScore: 82,
      expediente: 'MX/E/2019/008100',
      registrationNumber: '1712540',
      goodsServices: 'Dietary supplements, nutraceuticals.',
      marciaUrl: 'https://marcia.impi.gob.mx/marcas/search/quick',
      whyItMatters: {
        en: 'Third mark in the Villanueva cluster. Strong phonetic similarity to VITAFIT. Pattern suggests aggressive defensive filings in this namespace.',
        es: 'Tercera marca del clúster Villanueva. Fuerte similitud fonética con VITAFIT. El patrón sugiere solicitudes defensivas agresivas en este espacio.',
      },
    },
  ],
  significantConflicts: [
    { id: 'sc1', name: 'VITAMFIT', holder: 'LABORATORIOS BIOPHARMA S.A. DE C.V.', holderCountry: 'Mexico', holderType: 'persona_moral_mx', classNum: 5, status: 'registrado', similarityScore: 78, goodsServices: 'Pharmaceutical preparations, vitamins.', marciaUrl: 'https://marcia.impi.gob.mx/marcas/search/quick', whyItMatters: { en: 'High phonetic similarity; class 5 overlap.', es: 'Alta similitud fonética; coincidencia en clase 5.' } },
    { id: 'sc2', name: 'VITA FIT PLUS', holder: 'NUTRICIÓN INTEGRAL DEL NORTE S.A. DE C.V.', holderCountry: 'Mexico', holderType: 'persona_moral_mx', classNum: 5, status: 'en_tramite', similarityScore: 74, goodsServices: 'Nutritional supplements, weight management.', marciaUrl: 'https://marcia.impi.gob.mx/marcas/search/quick', whyItMatters: { en: 'Pending application containing VITA FIT as dominant element.', es: 'Solicitud en trámite con VITA FIT como elemento dominante.' } },
    { id: 'sc3', name: 'VITAFORCE', holder: 'HEALTH PRODUCTS INC.', holderCountry: 'United States', holderType: 'extranjera', classNum: 5, status: 'registrado', similarityScore: 68, goodsServices: 'Nutritional supplements.', marciaUrl: 'https://marcia.impi.gob.mx/marcas/search/quick', whyItMatters: { en: 'Shares VITA prefix in same class.', es: 'Comparte el prefijo VITA en la misma clase.' } },
    { id: 'sc4', name: 'FITVITA', holder: 'GRUPO NUTRISA S.A. DE C.V.', holderCountry: 'Mexico', holderType: 'persona_moral_mx', classNum: 5, status: 'registrado', similarityScore: 65, goodsServices: 'Dietary supplements, health food products.', marciaUrl: 'https://marcia.impi.gob.mx/marcas/search/quick', whyItMatters: { en: 'Inverted elements VITA + FIT; class 5.', es: 'Elementos invertidos VITA + FIT; clase 5.' } },
  ],
  backgroundConflicts: [
    { id: 'bg1', name: 'VITACARE', holder: 'PRODUCTOS NATURALES DEL NORTE S.A. DE C.V.', holderCountry: 'Mexico', holderType: 'persona_moral_mx', classNum: 5, status: 'registrado', similarityScore: 45, whyItMatters: { en: 'Shares VITA prefix only.', es: 'Solo comparte el prefijo VITA.' } },
    { id: 'bg2', name: 'FITMAX', holder: 'SPORTS NUTRITION LLC', holderCountry: 'United States', holderType: 'extranjera', classNum: 5, status: 'registrado', similarityScore: 38, whyItMatters: { en: 'Shares FIT only.', es: 'Solo comparte FIT.' } },
    { id: 'bg3', name: 'VITAGREEN', holder: 'HERBAL SOLUTIONS S.A. DE C.V.', holderCountry: 'Mexico', holderType: 'persona_moral_mx', classNum: 5, status: 'caducado', similarityScore: 40, whyItMatters: { en: 'VITA prefix, expired.', es: 'Prefijo VITA, caducada.' } },
    { id: 'bg4', name: 'FITPRO', holder: 'NUTRICIÓN DEPORTIVA S.A.', holderCountry: 'Mexico', holderType: 'persona_moral_mx', classNum: 5, status: 'registrado', similarityScore: 35, whyItMatters: { en: 'FIT prefix, different concept.', es: 'Prefijo FIT, concepto diferente.' } },
    { id: 'bg5', name: 'VITABEST', holder: 'COMPLEMENTOS ALIMENTICIOS S.A. DE C.V.', holderCountry: 'Mexico', holderType: 'persona_moral_mx', classNum: 5, status: 'registrado', similarityScore: 42, whyItMatters: { en: 'VITA prefix in class 5.', es: 'Prefijo VITA en clase 5.' } },
  ],
  holderClusters: [
    {
      holder: 'ALFONSO VILLANUEVA VALENCIANO',
      marks: ['VITAL VITAFIT', 'VITAL-FIT', 'VIVA-FIT'],
      note: {
        en: 'Holds 3 marks in the critical conflict set (VITAL VITAFIT, VITAL-FIT, VIVA-FIT). This pattern suggests a deliberate defensive trademark family in class 5, significantly elevating opposition risk from this holder.',
        es: 'Titular de 3 marcas en el conjunto de conflictos críticos (VITAL VITAFIT, VITAL-FIT, VIVA-FIT). Este patrón sugiere una familia de marcas defensiva deliberada en la clase 5, lo que eleva significativamente el riesgo de oposición por parte de este titular.',
      },
    },
    {
      holder: 'LIDL STIFTUNG & CO. KG',
      marks: ['VITAFIT'],
      note: {
        en: 'LIDL STIFTUNG & CO. KG is a German multinational retailer (LIDL supermarkets) with significant legal enforcement resources. An identical-mark conflict with a multinational carries elevated litigation risk — expect a well-funded opposition.',
        es: 'LIDL STIFTUNG & CO. KG es un retailer multinacional alemán (supermercados LIDL) con amplios recursos legales. Un conflicto de marca idéntica con una multinacional conlleva riesgo de litigio elevado — se puede esperar una oposición bien financiada.',
      },
    },
  ],
  elementDecomposition: [
    {
      element: 'VITA',
      meaning: { en: 'Life (Latin). Commonly used prefix in health/wellness product names.', es: 'Vida (latín). Prefijo de uso común en nombres de productos de salud y bienestar.' },
      etymology: { en: 'From Latin vita (life), Proto-Italic *gʷīta-.', es: 'Del latín vita (vida), protoitálico *gʷīta-.' },
      saturationClass: 247,
      saturationAll: 1843,
      tier: 'descriptive',
      contribution: { en: 'Dominant element by position, but weak by distinctiveness. Describes the health/life benefit orientation of the goods.', es: 'Elemento dominante por posición, pero débil en distintividad. Describe la orientación de beneficio de salud/vida de los productos.' },
    },
    {
      element: 'FIT',
      meaning: { en: 'Physically fit, in good shape (English). Standard wellness descriptor.', es: 'En buena forma física (inglés). Descriptor estándar de bienestar.' },
      etymology: { en: 'Middle English fit, of uncertain origin. Entered Mexican brand register heavily from 2000s.', es: 'Inglés medio fit, de origen incierto. Entró masivamente al registro mexicano desde los años 2000.' },
      saturationClass: 318,
      saturationAll: 2971,
      tier: 'descriptive',
      contribution: { en: 'Secondary element. Reinforces the "fitness" positioning of class 5 goods. Adds no distinctive character to VITA.', es: 'Elemento secundario. Refuerza el posicionamiento de "forma física" de los productos de clase 5. No agrega carácter distintivo a VITA.' },
    },
    {
      element: 'VITAFIT',
      meaning: { en: 'Compound of VITA + FIT. Communicates "life fitness" or "fit life" — an immediate, direct description of health supplement benefits.', es: 'Compuesto de VITA + FIT. Comunica "vida en forma" o "vida fit" — descripción inmediata y directa de beneficios de suplementos de salud.' },
      etymology: { en: 'Marketing coinage blending Latin vita with English fit. The combination is not fanciful — both elements are commonly understood by Mexican consumers.', es: 'Acuñación de marketing combinando el latín vita con el inglés fit. La combinación no es de fantasía: ambos elementos son de uso común entre consumidores mexicanos.' },
      saturationClass: 43,
      saturationAll: 89,
      tier: 'descriptive',
      contribution: { en: 'As a whole, the mark is descriptive. The combination of two descriptive elements does not create distinctiveness — it reinforces the descriptive character (LFPPI Art. 173 Fr. IV). The mark sits squarely in the "dead zone" of the health supplement namespace.', es: 'En su conjunto, la marca es descriptiva. La combinación de dos elementos descriptivos no crea distintividad, sino que refuerza el carácter descriptivo (LFPPI Art. 173 Fr. IV). La marca se ubica claramente en la "zona muerta" del espacio de suplementos de salud.' },
    },
  ],
  axisScores: {
    distintividadInherente: 15,
    disponibilidadRegistral: 5,
    saturacionCampo: 8,
    cumplimientoArt173: 12,
    riesgoOposicion: 5,
  },
  confundibilidad: [
    {
      id: 'fon',
      title: { en: 'Phonetic Similarity', es: 'Similitud Fonética' },
      question: { en: 'Does the mark sound confusingly similar to existing marks when spoken aloud?', es: '¿La marca suena de manera confusamente similar a marcas existentes cuando se pronuncia en voz alta?' },
      verdict: 'desfavorable',
      cite: 'LFPPI Art. 173 Fr. XVIII; Tesis TFJA 2019 "Similitud Fonética"',
      analysis: { en: 'VITAFIT is phonetically identical (100%) to the registered mark VITAFIT (LIDL). Phonetic similarity to VITAL-FIT and VITAL VITAFIT exceeds 85%. The syllabic stress pattern (vi-TA-fit) is shared by all three prior marks. Mexican courts (TFJA) consistently hold that phonetic identity creates a strong presumption of confusion risk for mass-market goods.', es: 'VITAFIT es fonéticamente idéntica (100%) a la marca registrada VITAFIT (LIDL). La similitud fonética con VITAL-FIT y VITAL VITAFIT supera el 85%. El patrón de acento silábico (vi-TA-fit) es compartido por las tres marcas previas. Los tribunales mexicanos (TFJA) sostienen consistentemente que la identidad fonética crea una presunción fuerte de riesgo de confusión para bienes de consumo masivo.' },
      consequence: { en: 'This criterion alone is sufficient for refusal under Art. 173 Fr. XVIII against the LIDL registration.', es: 'Este criterio por sí solo es suficiente para la negativa bajo el Art. 173 Fr. XVIII frente al registro de LIDL.' },
    },
    {
      id: 'graf',
      title: { en: 'Visual / Graphic Similarity', es: 'Similitud Gráfica / Visual' },
      question: { en: 'Does the mark look visually similar to existing marks?', es: '¿La marca tiene apariencia visual similar a marcas existentes?' },
      verdict: 'desfavorable',
      cite: 'LFPPI Art. 173 Fr. XVIII; Criterios IMPI de similitud gráfica',
      analysis: { en: 'VITAFIT shares 7 of 7 characters with LIDL\'s VITAFIT (100% character overlap). Against VITAL-FIT: 6 of 8 meaningful characters match (75%). The letter sequence V-I-T-A-F-I-T is distinctive and immediately recognizable. Visual identity with the LIDL mark is complete.', es: 'VITAFIT comparte 7 de 7 caracteres con el VITAFIT de LIDL (100% de coincidencia de caracteres). Con VITAL-FIT: 6 de 8 caracteres significativos coinciden (75%). La secuencia de letras V-I-T-A-F-I-T es distintiva e inmediatamente reconocible. La identidad visual con la marca de LIDL es total.' },
      consequence: { en: 'Visual identity reinforces the phonetic identity finding. Two independent grounds for refusal under Art. 173 Fr. XVIII.', es: 'La identidad visual refuerza el hallazgo de identidad fonética. Dos fundamentos independientes para la negativa bajo el Art. 173 Fr. XVIII.' },
    },
    {
      id: 'conc',
      title: { en: 'Conceptual / Ideological Similarity', es: 'Similitud Conceptual / Ideológica' },
      question: { en: 'Do the marks evoke the same idea or concept?', es: '¿Las marcas evocan la misma idea o concepto?' },
      verdict: 'desfavorable',
      cite: 'LFPPI Art. 173 Fr. XVIII; Tesis TFJA "Semejanza ideológica"',
      analysis: { en: 'VITAFIT, VITAL-FIT, and VIVA-FIT all evoke the same concept: "life + physical fitness." The descriptive nature of the compound amplifies this: all consumers exposed to these marks will immediately understand "health supplement for a fit lifestyle." There is no conceptual space between VITAFIT and its closest three conflicts.', es: 'VITAFIT, VITAL-FIT y VIVA-FIT evocan el mismo concepto: "vida + forma física". El carácter descriptivo del compuesto amplifica esto: todos los consumidores expuestos a estas marcas entenderán inmediatamente "suplemento de salud para un estilo de vida saludable". No existe espacio conceptual entre VITAFIT y sus tres conflictos más cercanos.' },
      consequence: { en: 'Conceptual identity compounds the phonetic and visual findings. Three convergent similarity axes create an overwhelming case for confusion.', es: 'La identidad conceptual refuerza los hallazgos fonéticos y visuales. Tres ejes de similitud convergentes crean un caso abrumador de confusión.' },
    },
    {
      id: 'prod',
      title: { en: 'Product / Service Identity', es: 'Identidad de Productos / Servicios' },
      question: { en: 'Are the goods/services identical or closely related to those covered by prior marks?', es: '¿Los productos/servicios son idénticos o estrechamente relacionados con los cubiertos por marcas previas?' },
      verdict: 'desfavorable',
      cite: 'LFPPI Art. 173 Fr. XVIII; Clasificación de Niza, Clase 5',
      analysis: { en: 'The applicant\'s specification (dietary supplements, vitamins, protein powders) is identical to the goods covered by LIDL\'s VITAFIT registration (class 5: dietary supplements, vitamins, mineral preparations, protein supplements). The Nice class subheading is the same. Commercial channels (pharmacies, health stores, online) overlap completely.', es: 'La especificación del solicitante (suplementos alimenticios, vitaminas, proteínas en polvo) es idéntica a los productos cubiertos por el registro VITAFIT de LIDL (clase 5: suplementos alimenticios, vitaminas, preparaciones minerales, suplementos proteicos). El subtítulo de la clase Niza es el mismo. Los canales comerciales (farmacias, tiendas de salud, en línea) coinciden completamente.' },
      consequence: { en: 'Product identity is the strongest aggravating factor in the confusion analysis. Identical goods in identical class eliminates any trade channel argument.', es: 'La identidad de productos es el factor agravante más fuerte del análisis de confusión. Productos idénticos en clase idéntica elimina cualquier argumento de canal comercial.' },
    },
    {
      id: 'dom',
      title: { en: 'Dominant Element', es: 'Elemento Dominante' },
      question: { en: 'What is the dominant element of the proposed mark, and is it already owned by a third party?', es: '¿Cuál es el elemento dominante de la marca propuesta y ya está en manos de un tercero?' },
      verdict: 'desfavorable',
      cite: 'LFPPI Art. 173 Fr. XVIII; Tesis aislada SCJN 2022 "Elemento dominante en marcas compuestas"',
      analysis: { en: 'The dominant element of VITAFIT is the compound itself — neither VITA nor FIT is individually dominant because both are equally descriptive. However, VITAFIT as a compound is the dominant element registered by LIDL, and that compound appears in full within the applicant\'s proposed mark. Under SCJN doctrine on compound marks, a prior registrant\'s dominant compound blocks registration of identical compounds even when embedded in a longer mark.', es: 'El elemento dominante de VITAFIT es el compuesto en sí: ni VITA ni FIT es individualmente dominante porque ambos son igualmente descriptivos. Sin embargo, VITAFIT como compuesto es el elemento dominante registrado por LIDL, y ese compuesto aparece íntegramente en la marca propuesta. Bajo la doctrina de la SCJN en marcas compuestas, el compuesto dominante del registrante previo bloquea el registro de compuestos idénticos aunque estén insertados en una marca más larga.' },
      consequence: { en: 'The LIDL registration blocks the proposed VITAFIT on the dominant-element doctrine alone, independent of phonetic/visual analysis.', es: 'El registro de LIDL bloquea el VITAFIT propuesto únicamente por la doctrina del elemento dominante, con independencia del análisis fonético/visual.' },
    },
    {
      id: 'cons',
      title: { en: 'Relevant Consumer', es: 'Consumidor Medio' },
      question: { en: 'Who is the relevant consumer and how carefully do they select these goods?', es: '¿Quién es el consumidor relevante y qué nivel de atención presta al seleccionar estos productos?' },
      verdict: 'neutral',
      cite: 'LFPPI Art. 173 Fr. XVIII; Criterios IMPI sobre consumidor medio',
      analysis: { en: 'Dietary supplements in class 5 are purchased by a broad mass-market consumer with medium-to-low purchasing sophistication. While some buyers are health-conscious and may read labels carefully, the product category is frequently purchased by impulse in pharmacies and supermarkets. Mexican courts apply a "consumidor medio" standard of moderate care — not a specialist. This moderately attentive consumer is easily confused by phonetically identical marks.', es: 'Los suplementos alimenticios de la clase 5 son adquiridos por un consumidor masivo con sofisticación de compra media-baja. Aunque algunos compradores son conscientes de la salud y pueden leer etiquetas con cuidado, la categoría de productos se adquiere frecuentemente por impulso en farmacias y supermercados. Los tribunales mexicanos aplican un estándar de "consumidor medio" con atención moderada, no de especialista. Este consumidor moderadamente atento se confunde fácilmente con marcas fonéticamente idénticas.' },
      consequence: { en: 'Moderate-care consumer profile means that phonetic identity alone is sufficient for confusion — no aggravating factors needed.', es: 'El perfil de consumidor con atención moderada significa que la identidad fonética por sí sola es suficiente para la confusión: no se necesitan factores agravantes.' },
    },
    {
      id: 'coex',
      title: { en: 'Coexistence or Saturation', es: 'Coexistencia Previa o Saturación' },
      question: { en: 'Does the prior landscape show genuine peaceful coexistence, or does saturation narrow protection?', es: '¿El panorama previo muestra coexistencia pacífica genuina o la saturación estrecha la protección?' },
      verdict: 'neutral',
      cite: 'LFPPI Art. 173 Fr. XVIII; Doctrina de campo saturado IMPI',
      analysis: { en: 'The class 5 VITA- and FIT- namespace is saturated: 247 VITA marks and 318 FIT marks in class 5. This saturation narrows the scope of any individual registration (each has a thin monopoly), BUT it also means the applicant cannot claim the space is open. Saturation does not justify new descriptive registrations — it confirms that the namespace is congested and new entrants face heightened scrutiny.', es: 'El espacio de marcas VITA- y FIT- en clase 5 está saturado: 247 marcas VITA y 318 marcas FIT en clase 5. Esta saturación estrecha el alcance de cada registro individual (monopolio delgado), PERO también significa que el solicitante no puede alegar que el espacio está libre. La saturación no justifica nuevos registros descriptivos, sino que confirma que el espacio está congestionado y los nuevos entrantes enfrentan mayor escrutinio.' },
      consequence: { en: 'Saturation hurts the applicant two ways: (1) existing marks narrow the available space, and (2) IMPI applies heightened scrutiny to further descriptive filings in saturated fields.', es: 'La saturación perjudica al solicitante de dos maneras: (1) las marcas existentes estrechan el espacio disponible y (2) el IMPI aplica mayor escrutinio a nuevas solicitudes descriptivas en campos saturados.' },
    },
  ],
  fracciones: [
    { num: 'I', question: { en: 'Is the mark the common name of the product?', es: '¿Es el nombre común del producto?' }, verdict: 'caution', statuteEs: 'No serán registrables como marca los signos que sean de uso común en el lenguaje corriente o en las prácticas comerciales del país.', analysis: { en: 'VITA and FIT are not the common name for dietary supplements, but they are extremely common prefix/suffix elements in the category — borderline caution.', es: 'VITA y FIT no son el nombre común de los suplementos alimenticios, pero son elementos de prefijo/sufijo extremadamente comunes en la categoría — precaución limítrofe.' }, consequence: { en: 'Caution: not an outright bar, but reinforces the descriptiveness finding.', es: 'Precaución: no es un impedimento absoluto, pero refuerza el hallazgo de descriptividad.' } },
    { num: 'II', question: { en: 'Is it merely a technical name or scientific term?', es: '¿Es únicamente una denominación técnica o término científico?' }, verdict: 'pass', statuteEs: 'No serán registrables los signos que sean denominación técnica o común de los productos o servicios.', analysis: { en: 'VITAFIT is not a scientific or technical term. N/A.', es: 'VITAFIT no es un término científico ni técnico. N/A.' }, consequence: { en: 'No issue.', es: 'Sin problema.' } },
    { num: 'III', question: { en: 'Does it lack distinctiveness as a sign?', es: '¿Carece de distintividad como signo?' }, verdict: 'caution', statuteEs: 'No serán registrables los signos que no sean suficientemente distintivos.', analysis: { en: 'VITAFIT is a compound of two descriptive elements. On its own it lacks sufficient distinctiveness for class 5 health goods.', es: 'VITAFIT es un compuesto de dos elementos descriptivos. Por sí sola carece de distintividad suficiente para productos de salud de clase 5.' }, consequence: { en: 'Caution: overlaps with the Fr. IV descriptiveness finding.', es: 'Precaución: se solapa con el hallazgo de descriptividad de Fr. IV.' } },
    { num: 'IV', question: { en: 'Does the mark directly describe the goods or their characteristics?', es: '¿La marca describe directamente los productos o sus características?' }, verdict: 'fail', statuteEs: 'No serán registrables los signos que reproduzcan o imiten el nombre de los productos o servicios que se pretendan amparar, o que contengan palabras descriptivas que se hayan convertido en el uso genérico de los mismos.', analysis: { en: 'VITA (life) + FIT (physically fit) directly and immediately communicates "health supplement for a fit lifestyle" to a Mexican class 5 consumer. No mental effort is required. This is the paradigmatic descriptive bar under LFPPI Art. 173 Fr. IV.', es: 'VITA (vida) + FIT (en forma) comunica directa e inmediatamente "suplemento de salud para un estilo de vida saludable" al consumidor mexicano de clase 5. No se requiere esfuerzo mental. Este es el impedimento descriptivo paradigmático bajo el Art. 173 Fr. IV LFPPI.' }, consequence: { en: 'FAIL — absolute bar. Unless the applicant can demonstrate acquired distinctiveness (uso prolongado + exclusividad reconocida), IMPI will refuse on this ground alone.', es: 'FALLA — impedimento absoluto. A menos que el solicitante pueda demostrar distintividad adquirida (uso prolongado + exclusividad reconocida), el IMPI negará por este fundamento solo.' } },
    { num: 'V', question: { en: 'Is it likely to mislead consumers about the nature of the goods?', es: '¿Puede inducir a error al consumidor sobre la naturaleza de los productos?' }, verdict: 'caution', statuteEs: 'No serán registrables los signos que puedan inducir a error o engaño por indicar una falsa procedencia, cualidad o naturaleza del producto.', analysis: { en: 'If the product does not actually confer "vital fitness" benefits as implied, the mark could be considered misleading. Low to moderate risk depending on product formulation.', es: 'Si el producto no confiere efectivamente los beneficios de "forma vital" implícitos, la marca podría considerarse engañosa. Riesgo bajo a moderado según la formulación del producto.' }, consequence: { en: 'Caution: secondary ground. Investigate whether product claims are substantiated.', es: 'Precaución: fundamento secundario. Investigar si las afirmaciones del producto están sustentadas.' } },
    { num: 'VI', question: { en: 'Is the mark a translation or orthographic variation of a descriptive term?', es: '¿Es la marca una traducción o variación ortográfica de un término descriptivo?' }, verdict: 'fail', statuteEs: 'No serán registrables los signos que sean la traducción a otros idiomas, la variación ortográfica o la transliteración de signos no registrables conforme a las fracciones anteriores.', analysis: { en: 'VITA is the Latin/Spanish word for "life" and is recognizable to Mexican consumers. FIT is the English word for "in good physical condition" and is widely understood in Mexico. Both elements are therefore non-registrable translations/recognizable foreign terms, making VITAFIT a compound of two non-registrable foreign-language descriptors.', es: 'VITA es la palabra latina/española para "vida" y es reconocible para los consumidores mexicanos. FIT es la palabra inglesa para "en buena condición física" y es ampliamente entendida en México. Ambos elementos son por tanto traducciones no registrables / términos extranjeros reconocibles, haciendo de VITAFIT un compuesto de dos descriptores no registrables en idioma extranjero.' }, consequence: { en: 'FAIL — Fr. VI compounds the Fr. IV finding. Double absolute bar.', es: 'FALLA — Fr. VI agrava el hallazgo de Fr. IV. Doble impedimento absoluto.' } },
    { num: 'VII', question: { en: 'Does it reproduce or imitate a national coat of arms, flag, or official emblem?', es: '¿Reproduce o imita escudos de armas, banderas o símbolos oficiales?' }, verdict: 'pass', statuteEs: 'No serán registrables los signos que reproduzcan o imiten los escudos de armas, banderas, emblemas, signos y punzones oficiales de los estados.', analysis: { en: 'N/A — no official emblems present.', es: 'N/A — no se presentan emblemas oficiales.' }, consequence: { en: 'No issue.', es: 'Sin problema.' } },
    { num: 'VIII', question: { en: 'Does it reproduce symbols of international intergovernmental organizations?', es: '¿Reproduce símbolos de organizaciones intergubernamentales internacionales?' }, verdict: 'na', statuteEs: 'No serán registrables los signos que reproduzcan o imiten los nombres, siglas, emblemas y denominaciones de cualquier organización internacional intergubernamental.', analysis: { en: 'N/A.', es: 'N/A.' }, consequence: { en: 'No issue.', es: 'Sin problema.' } },
    { num: 'IX', question: { en: 'Does it reproduce official control or warranty seals?', es: '¿Reproduce sellos oficiales de control o garantía?' }, verdict: 'na', statuteEs: 'No serán registrables los signos que reproduzcan o imiten los sellos, estampillas y marcas oficiales.', analysis: { en: 'N/A.', es: 'N/A.' }, consequence: { en: 'No issue.', es: 'Sin problema.' } },
    { num: 'X', question: { en: 'Does it reproduce a protected geographical indication or denomination of origin?', es: '¿Reproduce una indicación geográfica o denominación de origen protegida?' }, verdict: 'pass', statuteEs: 'No serán registrables los signos que reproduzcan o imiten indicaciones geográficas protegidas.', analysis: { en: 'N/A — VITAFIT does not reference a geographical area.', es: 'N/A — VITAFIT no hace referencia a un área geográfica.' }, consequence: { en: 'No issue.', es: 'Sin problema.' } },
    { num: 'XI', question: { en: 'Does it reproduce the common name of a geographic region used for specific goods?', es: '¿Reproduce el nombre común de una región geográfica para productos específicos?' }, verdict: 'na', statuteEs: 'No serán registrables los signos que sean el nombre de una región geográfica del país cuando puedan indicar procedencia.', analysis: { en: 'N/A.', es: 'N/A.' }, consequence: { en: 'No issue.', es: 'Sin problema.' } },
    { num: 'XII', question: { en: 'Is the mark contrary to public order or accepted morality?', es: '¿La marca es contraria al orden público o a la moral aceptada?' }, verdict: 'pass', statuteEs: 'No serán registrables los signos que sean contrarios al orden público o a la moral.', analysis: { en: 'N/A — VITAFIT is not immoral or contrary to public order.', es: 'N/A — VITAFIT no es inmoral ni contraria al orden público.' }, consequence: { en: 'No issue.', es: 'Sin problema.' } },
    { num: 'XIII', question: { en: 'Does it reproduce the name or portrait of a real person without consent?', es: '¿Reproduce el nombre o retrato de una persona real sin su consentimiento?' }, verdict: 'pass', statuteEs: 'No serán registrables los signos que reproduzcan el nombre, firma, retrato de una persona física.', analysis: { en: 'N/A.', es: 'N/A.' }, consequence: { en: 'No issue.', es: 'Sin problema.' } },
    { num: 'XIV', question: { en: 'Does it reproduce a protected literary or artistic work title (INDAUTOR)?', es: '¿Reproduce el título de una obra literaria o artística protegida (INDAUTOR)?' }, verdict: 'pass', statuteEs: 'No serán registrables los títulos de obras protegidas sin autorización del titular de los derechos.', analysis: { en: 'No known INDAUTOR registration for VITAFIT.', es: 'No se conoce registro en INDAUTOR para VITAFIT.' }, consequence: { en: 'No issue based on available data.', es: 'Sin problema basado en datos disponibles.' } },
    { num: 'XV', question: { en: 'Is the mark deceptive about a product characteristic?', es: '¿La marca es engañosa sobre una característica del producto?' }, verdict: 'caution', statuteEs: 'No serán registrables los signos que sean susceptibles de engañar al público o inducirlo a error.', analysis: { en: 'Overlaps with Fr. V — if the product does not genuinely deliver "vita + fit" benefits, the mark may be found deceptive by IMPI or COFEPRIS.', es: 'Se solapa con Fr. V — si el producto no entrega genuinamente beneficios de "vita + fit", la marca puede ser considerada engañosa por el IMPI o COFEPRIS.' }, consequence: { en: 'Secondary caution. Ensure product claims are substantiated.', es: 'Precaución secundaria. Asegurarse de que las afirmaciones del producto estén sustentadas.' } },
    { num: 'XVI', question: { en: 'Does it reproduce a plant variety denomination?', es: '¿Reproduce una denominación de variedad vegetal?' }, verdict: 'na', statuteEs: 'No serán registrables los signos que sean idénticos o semejantes a una variedad vegetal.', analysis: { en: 'N/A.', es: 'N/A.' }, consequence: { en: 'No issue.', es: 'Sin problema.' } },
    { num: 'XVII', question: { en: 'Does it reproduce an animal breed designation?', es: '¿Reproduce una denominación de raza animal?' }, verdict: 'na', statuteEs: 'No serán registrables los signos que sean idénticos o semejantes a una raza animal protegida.', analysis: { en: 'N/A.', es: 'N/A.' }, consequence: { en: 'No issue.', es: 'Sin problema.' } },
    { num: 'XVIII', question: { en: 'Is it identical or confusingly similar to a prior-registered mark in the same class?', es: '¿Es idéntica o confusamente similar a una marca registrada previamente en la misma clase?' }, verdict: 'fail', statuteEs: 'No serán registrables los signos que sean idénticos o semejantes en grado de confusión a una marca que esté en trámite de registro o ya registrada, para los mismos o similares productos o servicios.', analysis: { en: 'VITAFIT is identical (100%) to LIDL STIFTUNG & CO. KG\'s registered VITAFIT (Reg. No. 1523890, class 5). This is a textbook Art. 173 Fr. XVIII bar. No additional analysis is required — identity is absolute.', es: 'VITAFIT es idéntica (100%) al VITAFIT registrado de LIDL STIFTUNG & CO. KG (Reg. No. 1523890, clase 5). Este es el impedimento textbook del Art. 173 Fr. XVIII. No se requiere análisis adicional: la identidad es absoluta.' }, consequence: { en: 'FAIL — automatic refusal ground. The IMPI examiner has no discretion when the marks are identical in the same class.', es: 'FALLA — causal de negativa automática. El examinador del IMPI no tiene discreción cuando las marcas son idénticas en la misma clase.' } },
    { num: 'XIX', question: { en: 'Is it identical to a mark with a pending prior application in the same class?', es: '¿Es idéntica a una marca con solicitud anterior en trámite en la misma clase?' }, verdict: 'caution', statuteEs: 'No serán registrables los signos que sean idénticos a una marca cuyo trámite de registro se encuentre pendiente.', analysis: { en: 'VITA FIT PLUS (in tramite, class 5) contains the VITAFIT combination as its dominant component. While not identical, the pending mark\'s compound overlaps significantly.', es: 'VITA FIT PLUS (en trámite, clase 5) contiene la combinación VITAFIT como componente dominante. Si bien no es idéntico, el compuesto de la solicitud pendiente se superpone significativamente.' }, consequence: { en: 'Caution: not an absolute bar, but creates additional examination complexity.', es: 'Precaución: no es un impedimento absoluto, pero crea complejidad adicional en el examen.' } },
    { num: 'XX', question: { en: 'Could it be confused with a trade name already in use?', es: '¿Puede confundirse con un nombre comercial ya en uso?' }, verdict: 'caution', statuteEs: 'No serán registrables los signos que sean idénticos o semejantes a un nombre comercial aplicado a una empresa que opere en el mismo giro.', analysis: { en: 'VITAFIT may be in use as a trade name by the LIDL subsidiary that sells the product. Investigation required before filing.', es: 'VITAFIT puede estar en uso como nombre comercial por la subsidiaria de LIDL que comercializa el producto. Se requiere investigación antes de presentar.' }, consequence: { en: 'Caution: conduct due diligence on Mexican trade name registrations.', es: 'Precaución: realizar due diligence sobre registros de nombres comerciales en México.' } },
    { num: 'XXI', question: { en: 'Does it reproduce or imitate a protected appellation of origin?', es: '¿Reproduce o imita una denominación de origen protegida?' }, verdict: 'na', statuteEs: 'No serán registrables los signos que reproduzcan o imiten una denominación de origen protegida.', analysis: { en: 'N/A — no appellation of origin involved.', es: 'N/A — no involucra denominación de origen.' }, consequence: { en: 'No issue.', es: 'Sin problema.' } },
    { num: 'XXII', question: { en: 'Was the application filed in bad faith?', es: '¿Fue presentada la solicitud de mala fe?' }, verdict: 'caution', statuteEs: 'No serán registrables los signos cuyo registro se solicite de mala fe.', analysis: { en: 'No evidence of bad faith in this specific application. However, if the applicant knew of the LIDL registration at time of filing, this could be argued. Risk is low to medium depending on applicant\'s prior knowledge and market conduct.', es: 'No hay evidencia de mala fe en esta solicitud específica. Sin embargo, si el solicitante conocía el registro de LIDL al momento de la presentación, esto podría alegarse. El riesgo es bajo a medio dependiendo del conocimiento previo del solicitante y su conducta en el mercado.' }, consequence: { en: 'Caution: document good faith at time of filing. No affirmative bad-faith finding.', es: 'Precaución: documentar buena fe al momento de la presentación. Sin hallazgo afirmativo de mala fe.' } },
  ],
  malaFeIndicators: [
    { label: { en: 'Identical to a pre-existing registered mark', es: 'Idéntica a una marca registrada preexistente' }, present: true },
    { label: { en: 'Multiple prior identical registrations in different classes', es: 'Múltiples registros idénticos previos en diferentes clases' }, present: false },
    { label: { en: 'Historical pattern of conflicting applications by applicant', es: 'Patrón histórico de solicitudes conflictivas por el solicitante' }, present: false },
    { label: { en: 'Prior relationship between applicant and holder (distributor, agent, ex-partner)', es: 'Relación previa entre el solicitante y el titular (distribuidor, agente, ex-socio)' }, present: false },
    { label: { en: 'Identical commercial sectors', es: 'Sectores comerciales idénticos' }, present: true },
  ],
  malaFeVerdict: 'medium',
  malaFeRationale: {
    en: 'The applicant filed for an identical mark (VITAFIT) in the identical class (5) covering identical goods as an existing IMPI registration held by a well-known German multinational (LIDL). Whether or not the applicant had actual knowledge of the LIDL registration, IMPI examiners and opposing counsel may infer constructive knowledge from the MARCia database. Bad faith risk is low to medium — not automatically inferred, but an affirmative showing of independent creation and good faith is advisable.',
    es: 'El solicitante presentó una solicitud para una marca idéntica (VITAFIT) en la clase idéntica (5) cubriendo productos idénticos a los de un registro IMPI existente de una multinacional alemana de renombre (LIDL). Independientemente de si el solicitante tenía conocimiento real del registro de LIDL, los examinadores del IMPI y los abogados oponentes pueden inferir conocimiento constructivo de la base de datos MARCia. El riesgo de mala fe es bajo a medio: no se infiere automáticamente, pero se recomienda demostrar afirmativamente creación independiente y buena fe.',
  },
  translationAnalysis: [
    { lang: 'es', langName: 'Spanish', form: 'VITAFIT (VITA = vida, FIT = en forma)', risk: 'high', note: 'Directly translates as "life fitness" in Spanish — descriptive for class 5 health goods.' },
    { lang: 'en', langName: 'English', form: 'VITAFIT (vita = life, fit = physically fit)', risk: 'high', note: 'Immediately descriptive to English-speaking consumers in Mexico (significant demographic).' },
    { lang: 'pt', langName: 'Portuguese', form: 'VITAFIT (vita = vida, fit = em forma)', risk: 'medium', note: 'Descriptive in Portuguese; relevant for cross-border filings.' },
    { lang: 'fr', langName: 'French', form: 'VITAFIT (vita = vie, fit = en forme)', risk: 'low', note: 'Recognizable as "life fitness" by French speakers; not a primary concern for Mexico.' },
    { lang: 'de', langName: 'German', form: 'VITAFIT', risk: 'high', note: 'LIDL (German company) already holds VITAFIT — directly relevant for international rights.' },
    { lang: 'zh', langName: 'Chinese', form: '维他菲 (Wéitā fēi)', risk: 'none', note: 'No Chinese-language conflict identified.' },
    { lang: 'hi', langName: 'Hindi', form: 'विटाफिट (Vitāphiṭ)', risk: 'none', note: 'No Hindi-language conflict identified.' },
    { lang: 'ja', langName: 'Japanese', form: 'バイタフィット (Baitafitto)', risk: 'none', note: 'No Japanese-language conflict identified.' },
  ],
  domains: [
    { domain: 'vitafit.com.mx', status: 'taken' },
    { domain: 'vitafit.mx', status: 'taken' },
    { domain: 'vitafit.com', status: 'taken' },
    { domain: 'vitafit.ai', status: 'taken' },
    { domain: 'vitafit.net', status: 'taken' },
    { domain: 'vitafit.store', status: 'available' },
    { domain: 'vitafit.health', status: 'available' },
    { domain: 'vitafitmx.com', status: 'available' },
  ],
  famousMarks: [
    { name: 'VITAFIT', holder: 'LIDL STIFTUNG & CO. KG', sector: 'Retail / health supplements', threat: 'Identical mark. LIDL has IMPI-registered mark + European trademark portfolio. Potential for cross-border enforcement under LFPPI Art. 173 Fr. XVI (notorious marks).' },
  ],
  strategies: [
    {
      id: 'a',
      title: { en: 'Rebrand with a coined/fanciful mark', es: 'Rebrandear con una marca acuñada (fanciful)' },
      viability: 90,
      description: { en: 'Create a completely invented word with no descriptive meaning. Eliminates both the Art. 173 Fr. IV absolute bar and all Fr. XVIII relative conflicts. The only viable path to a strong registration.', es: 'Crear una palabra completamente inventada sin significado descriptivo. Elimina tanto el impedimento absoluto del Art. 173 Fr. IV como todos los conflictos relativos del Fr. XVIII. El único camino viable hacia un registro sólido.' },
      feesMxn: 'MXN $3,055 (IMPI, 1 clase) + honorarios profesionales',
      timeline: { en: '12–18 months', es: '12–18 meses' },
      successRange: '75–90%',
      pros: [{ en: 'Strongest possible registration.', es: 'Registro más sólido posible.' }, { en: 'No conflict with LIDL or the Villanueva cluster.', es: 'Sin conflicto con LIDL ni el clúster Villanueva.' }],
      cons: [{ en: 'Requires abandoning VITAFIT brand investment.', es: 'Requiere abandonar la inversión en la marca VITAFIT.' }],
      cta: { en: 'Generate alternatives with MTC', es: 'Generar alternativas con MTC' },
      alternatives: [
        { name: 'VITALOOM', quickScore: 82 },
        { name: 'BIOLUMEN', quickScore: 87 },
        { name: 'VIVANTIA', quickScore: 79 },
        { name: 'NUTRIVEX', quickScore: 84 },
      ],
    },
    {
      id: 'b',
      title: { en: 'File as mixed mark (logo + word) with distinctive design element', es: 'Presentar como marca mixta con elemento gráfico distintivo' },
      viability: 45,
      description: { en: 'Adding a distinctive logo element can shift examination toward the visual presentation and reduce the Fr. IV descriptiveness objection. However, it does NOT resolve the Art. 173 Fr. XVIII identical-mark conflict with LIDL. This path is only viable if the design element is truly distinctive.', es: 'Agregar un elemento gráfico distintivo puede desplazar el examen hacia la presentación visual y reducir la objeción de descriptividad del Fr. IV. Sin embargo, NO resuelve el conflicto de marca idéntica del Art. 173 Fr. XVIII con LIDL. Este camino es viable solo si el elemento de diseño es verdaderamente distintivo.' },
      feesMxn: 'MXN $3,055 (IMPI, 1 clase) + diseño gráfico + honorarios profesionales',
      timeline: { en: '14–22 months (higher examination complexity)', es: '14–22 meses (mayor complejidad de examen)' },
      successRange: '25–45%',
      pros: [{ en: 'Preserves some brand equity in the VITAFIT word.', es: 'Preserva algo del capital de marca en la palabra VITAFIT.' }],
      cons: [{ en: 'Does not resolve the LIDL identical-mark conflict.', es: 'No resuelve el conflicto de marca idéntica con LIDL.' }, { en: 'Only the logo is protected, not the word alone.', es: 'Solo el logo está protegido, no la palabra sola.' }],
      cta: { en: 'Consult MTC on logo strategy', es: 'Consultar con MTC sobre estrategia de logo' },
    },
    {
      id: 'c',
      title: { en: 'Reclassify to an adjacent class', es: 'Reclasificar a una clase adyacente' },
      viability: 35,
      description: { en: 'If the product specification can be narrowed or repositioned to class 29 (food preparations), 30 (food seasonings), or 32 (beverages), the class 5 LIDL conflict does not directly apply. However, many supplement products must be filed in class 5, and IMPI may still cite the LIDL mark as a related-class conflict.', es: 'Si la especificación del producto puede restringirse o reposicionarse a la clase 29 (preparaciones alimenticias), 30 (condimentos alimenticios) o 32 (bebidas), el conflicto de LIDL en clase 5 no aplica directamente. Sin embargo, muchos productos de suplementos deben presentarse en clase 5, y el IMPI puede aún citar la marca de LIDL como conflicto en clase relacionada.' },
      feesMxn: 'MXN $3,055 por clase adicional',
      timeline: { en: '12–18 months', es: '12–18 meses' },
      successRange: '30–50% (depends on product reformulation)',
      pros: [{ en: 'Avoids the direct class 5 LIDL conflict.', es: 'Evita el conflicto directo de LIDL en clase 5.' }],
      cons: [{ en: 'May not cover core supplement product category.', es: 'Puede no cubrir la categoría de producto de suplemento principal.' }, { en: 'IMPI may still cite LIDL under related-class doctrine.', es: 'El IMPI puede aún citar a LIDL bajo la doctrina de clase relacionada.' }],
      cta: { en: 'Review product specification with MTC', es: 'Revisar especificación de producto con MTC' },
    },
    {
      id: 'd',
      title: { en: 'Demonstrate acquired distinctiveness (secondary meaning)', es: 'Acreditar distintividad adquirida (secondary meaning)' },
      viability: 20,
      description: { en: 'If the mark has been in continuous, exclusive, and widespread use in Mexico for a significant period, the applicant can submit evidence of acquired distinctiveness to overcome the Art. 173 Fr. IV objection. This does NOT resolve the Art. 173 Fr. XVIII identical-mark conflict with LIDL — that is a relative bar not curable by use evidence.', es: 'Si la marca ha sido de uso continuo, exclusivo y generalizado en México durante un período significativo, el solicitante puede presentar evidencia de distintividad adquirida para superar la objeción del Art. 173 Fr. IV. Esto NO resuelve el conflicto de marca idéntica del Art. 173 Fr. XVIII con LIDL — ese es un impedimento relativo que no puede subsanarse con evidencia de uso.' },
      feesMxn: 'Costos de preparación de evidencia + honorarios profesionales',
      timeline: { en: '18–30 months (additional evidence review phase)', es: '18–30 meses (fase adicional de revisión de evidencia)' },
      successRange: '10–25%',
      pros: [{ en: 'Could overcome the descriptiveness bar if evidence is strong.', es: 'Podría superar el impedimento de descriptividad si la evidencia es sólida.' }],
      cons: [{ en: 'Does not remove the LIDL identical-mark conflict.', es: 'No elimina el conflicto de marca idéntica con LIDL.' }, { en: 'High evidentiary burden; expensive.', es: 'Carga probatoria alta; costoso.' }],
      cta: { en: 'Consult attorney on use evidence', es: 'Consultar con abogado sobre evidencia de uso' },
    },
    {
      id: 'e',
      title: { en: 'Withdraw and rebrand — consult a licensed Mexican IP attorney', es: 'Desistir y rebrandear — consultar con un abogado de PI mexicano certificado' },
      viability: 95,
      description: { en: 'Given two independent absolute bars (Fr. IV + Fr. VI) and one definitive relative bar (Fr. XVIII against LIDL), the most cost-effective path is to withdraw, rebrand with a coined mark, and file with expert guidance. This is not a failure — it is the commercially rational decision when the legal obstacles are this severe.', es: 'Dados dos impedimentos absolutos independientes (Fr. IV + Fr. VI) y un impedimento relativo definitivo (Fr. XVIII frente a LIDL), el camino más rentable es desistir, rebrandear con una marca acuñada y presentar con orientación experta. Esto no es un fracaso, es la decisión comercialmente racional cuando los obstáculos legales son tan graves.' },
      feesMxn: 'USD $500–2,000 honorarios de abogado + MXN $3,055 nueva solicitud',
      timeline: { en: 'New filing: 12–18 months', es: 'Nueva solicitud: 12–18 meses' },
      successRange: '75–90% with coined mark',
      pros: [{ en: 'Highest long-term success probability.', es: 'Mayor probabilidad de éxito a largo plazo.' }, { en: 'Avoids wasted filing fees on a refusable mark.', es: 'Evita cuotas de solicitud desperdiciadas en una marca rechazable.' }],
      cons: [{ en: 'Requires brand investment in a new name.', es: 'Requiere inversión de marca en un nuevo nombre.' }],
      cta: { en: 'Connect with a Mexican IP attorney', es: 'Conectar con un abogado de PI mexicano' },
    },
  ],
};

// ─── Utility ─────────────────────────────────────────────────────────────────

const t = (obj: { en: string; es: string }, lang: Lang) => lang === 'es' ? obj.es : obj.en;

const TIER_ORDER: Tier[] = ['generic', 'descriptive', 'suggestive', 'arbitrary', 'fanciful'];
const TIER_COLORS: Record<Tier, string> = {
  generic: '#dc2626', descriptive: '#ea580c', suggestive: '#d97706', arbitrary: '#16a34a', fanciful: '#0f2a44',
};
const TIER_BG: Record<Tier, string> = {
  generic: 'bg-red-100 text-red-800', descriptive: 'bg-orange-100 text-orange-800', suggestive: 'bg-amber-100 text-amber-800', arbitrary: 'bg-emerald-100 text-emerald-800', fanciful: 'bg-[#0f2a44] text-white',
};
const TIER_LABEL: Record<Tier, { en: string; es: string }> = {
  generic: { en: 'Generic', es: 'Genérica' },
  descriptive: { en: 'Descriptive', es: 'Descriptiva' },
  suggestive: { en: 'Suggestive', es: 'Sugestiva' },
  arbitrary: { en: 'Arbitrary', es: 'Arbitraria' },
  fanciful: { en: 'Fanciful', es: 'Fantasía' },
};

const STATUS_PILL: Record<ConflictStatus, { label: { en: string; es: string }; cls: string; icon: string }> = {
  registrado:  { label: { en: 'Registered', es: 'Registrado' },     cls: 'bg-emerald-100 text-emerald-800 border-emerald-300', icon: '●' },
  en_tramite:  { label: { en: 'Pending',    es: 'En Trámite' },      cls: 'bg-amber-100 text-amber-800 border-amber-300',       icon: '◐' },
  caducado:    { label: { en: 'Lapsed',     es: 'Caducado' },        cls: 'bg-gray-100 text-gray-600 border-gray-300',          icon: '○' },
};

const HOLDER_TYPE_LABEL: Record<ConflictMark['holderType'], { en: string; es: string }> = {
  persona_fisica_mx: { en: 'Mexican individual', es: 'Persona física mexicana' },
  persona_moral_mx:  { en: 'Mexican company', es: 'Persona moral mexicana' },
  extranjera:        { en: 'Foreign entity', es: 'Persona moral extranjera' },
  multinacional:     { en: 'Multinational', es: 'Multinacional' },
};

const VERDICT_CFG: Record<Verdict, { label: { en: string; es: string }; cls: string; dot: string }> = {
  favorable:    { label: { en: 'Favorable', es: 'Favorable' },       cls: 'border-emerald-200 bg-emerald-50', dot: 'bg-emerald-500' },
  neutral:      { label: { en: 'Neutral', es: 'Neutral' },           cls: 'border-amber-200 bg-amber-50',    dot: 'bg-amber-500' },
  desfavorable: { label: { en: 'Unfavorable', es: 'Desfavorable' },  cls: 'border-red-200 bg-red-50',        dot: 'bg-red-500' },
  na:           { label: { en: 'N/A', es: 'N/A' },                   cls: 'border-gray-100 bg-gray-50',      dot: 'bg-gray-300' },
};

const FRAC_CFG: Record<FraccionVerdict, { icon: string; cls: string; badge: string }> = {
  pass:    { icon: '✓', cls: 'border-emerald-200 bg-emerald-50',  badge: 'bg-emerald-100 text-emerald-700' },
  caution: { icon: '!', cls: 'border-amber-200 bg-amber-50',      badge: 'bg-amber-100 text-amber-700' },
  fail:    { icon: '✗', cls: 'border-red-300 bg-red-50 ring-2 ring-red-200', badge: 'bg-red-100 text-red-700' },
  na:      { icon: '—', cls: 'border-gray-100 bg-gray-50',        badge: 'bg-gray-100 text-gray-400' },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle?: string }) {
  return (
    <div className="flex items-start gap-3 mb-4">
      <div className="w-8 h-8 rounded-lg bg-[#0f2a44]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
        {icon}
      </div>
      <div>
        <h2 className="text-base font-bold text-[#0f2a44]">{title}</h2>
        {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

function StatusPill({ status, lang }: { status: ConflictStatus; lang: Lang }) {
  const cfg = STATUS_PILL[status];
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.cls}`}>
      <span>{cfg.icon}</span>
      {t(cfg.label, lang)}
    </span>
  );
}

function SimilarityRing({ score, size = 48 }: { score: number; size?: number }) {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const fill = (score / 100) * circ;
  const color = score >= 90 ? '#dc2626' : score >= 70 ? '#f59e0b' : score >= 50 ? '#d97706' : '#6b7280';
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f3f4f6" strokeWidth="5" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="5"
          strokeDasharray={`${fill} ${circ}`} strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[10px] font-bold" style={{ color }}>{score}%</span>
      </div>
    </div>
  );
}

function RegistrabilityGauge({ score }: { score: number }) {
  const angle = (score / 100) * 180 - 90;
  const color = score >= 70 ? '#16a34a' : score >= 45 ? '#f59e0b' : '#dc2626';
  return (
    <div className="relative w-32 h-16 flex-shrink-0">
      <svg viewBox="0 0 128 64" className="w-full h-full">
        <path d="M 8 56 A 56 56 0 0 1 120 56" fill="none" stroke="#f3f4f6" strokeWidth="10" strokeLinecap="round" />
        <path d="M 8 56 A 56 56 0 0 1 120 56" fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={`${(score / 100) * 175.9} 175.9`} />
        <g transform={`translate(64,56) rotate(${angle})`}>
          <line x1="0" y1="0" x2="-36" y2="0" stroke="#0f2a44" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="0" cy="0" r="3" fill="#0f2a44" />
        </g>
        <text x="8" y="63" className="text-[8px]" fontSize="8" fill="#9ca3af">0</text>
        <text x="112" y="63" className="text-[8px]" fontSize="8" fill="#9ca3af">100</text>
      </svg>
      <div className="absolute bottom-0 left-0 right-0 text-center">
        <span className="text-sm font-black" style={{ color }}>{score}</span>
        <span className="text-[9px] text-gray-400">/100</span>
      </div>
    </div>
  );
}

function CollapsibleSection({ title, subtitle, badge, defaultOpen = false, children }: {
  title: string; subtitle?: string; badge?: React.ReactNode; defaultOpen?: boolean; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm">
      <button type="button" onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-[#0f2a44]">{title}</span>
            {badge}
          </div>
          {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
        {open ? <ChevronUp size={16} className="text-gray-400 flex-shrink-0" /> : <ChevronDown size={16} className="text-gray-400 flex-shrink-0" />}
      </button>
      {open && <div className="border-t border-gray-100">{children}</div>}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ClearanceReportV2Page() {
  const [lang, setLang] = useState<Lang>('en');
  const data = VITAFIT_DATA;
  const [holderFilter, setHolderFilter] = useState<string | null>(null);
  const [bgOpen, setBgOpen] = useState(false);

  const RISK_CFG = {
    critical: { label: { en: 'CRITICAL', es: 'CRÍTICO' }, bg: 'bg-red-600', text: 'text-white' },
    high:     { label: { en: 'HIGH RISK', es: 'RIESGO ALTO' }, bg: 'bg-orange-500', text: 'text-white' },
    moderate: { label: { en: 'MODERATE', es: 'MODERADO' }, bg: 'bg-amber-500', text: 'text-white' },
    low:      { label: { en: 'LOW RISK', es: 'RIESGO BAJO' }, bg: 'bg-emerald-500', text: 'text-white' },
    clear:    { label: { en: 'CLEAR', es: 'SIN OBSTÁCULOS' }, bg: 'bg-emerald-700', text: 'text-white' },
  };
  const riskCfg = RISK_CFG[data.overallRisk];

  const axes = [
    { key: 'distintividadInherente' as const, label: { en: 'Inherent Distinctiveness', es: 'Distintividad Inherente' }, desc: { en: 'How protectable is the mark on its own merits?', es: '¿Qué tan protegible es la marca por sus propios méritos?' } },
    { key: 'disponibilidadRegistral' as const, label: { en: 'Registry Availability', es: 'Disponibilidad Registral' }, desc: { en: 'How free is the registry of identical/near-identical priors?', es: '¿Qué tan libre está el registro de previas idénticas o casi idénticas?' } },
    { key: 'saturacionCampo' as const, label: { en: 'Field Saturation', es: 'Saturación del Campo' }, desc: { en: 'How crowded is the namespace around the mark\'s elements?', es: '¿Qué tan saturado está el espacio alrededor de los elementos de la marca?' } },
    { key: 'cumplimientoArt173' as const, label: { en: 'Art. 173 LFPPI Compliance', es: 'Cumplimiento Art. 173 LFPPI' }, desc: { en: 'How well does the mark pass all 22 absolute/relative grounds?', es: '¿Qué tan bien supera la marca las 22 causales absolutas/relativas?' } },
    { key: 'riesgoOposicion' as const, label: { en: 'Opposition & Nullity Risk', es: 'Riesgo de Oposición y Nulidad' }, desc: { en: 'How likely is a funded opposition or post-registration nullity action?', es: '¿Qué probabilidad hay de una oposición financiada o nulidad post-registro?' } },
  ];

  const failCount = data.fracciones.filter(f => f.verdict === 'fail').length;
  const cautionCount = data.fracciones.filter(f => f.verdict === 'caution').length;

  const allConflicts = [...data.criticalConflicts, ...data.significantConflicts, ...data.backgroundConflicts];
  const filteredCritical = holderFilter ? data.criticalConflicts.filter(c => c.holder === holderFilter) : data.criticalConflicts;
  const filteredSignificant = holderFilter ? data.significantConflicts.filter(c => c.holder === holderFilter) : data.significantConflicts;
  const uniqueHolders = Array.from(new Set(allConflicts.map(c => c.holder)));

  const maxSat = Math.max(...data.elementDecomposition.map(e => e.saturationClass));

  return (
    <div className="min-h-screen bg-gray-50 font-sans print:bg-white">
      {/* ── Top bar ── */}
      <div className="bg-[#0f2a44] print:hidden">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded bg-[#e07a3f] flex items-center justify-center flex-shrink-0">
              <Shield size={14} className="text-white" />
            </div>
            <span className="text-white text-sm font-bold">Mexico Trademark Center</span>
            <span className="text-white/40 text-xs">— {lang === 'es' ? 'Reporte de Registrabilidad' : 'Clearance Report'} v2</span>
          </div>
          <div className="flex items-center gap-1 bg-white/10 rounded-lg p-0.5">
            {(['en', 'es'] as Lang[]).map(l => (
              <button key={l} type="button" onClick={() => setLang(l)}
                className={`text-xs font-bold px-3 py-1.5 rounded-md transition-all ${lang === l ? 'bg-white text-[#0f2a44]' : 'text-white/70 hover:text-white'}`}>
                {l.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6 print:py-4 print:space-y-4">

        {/* ── § 1  Hero verdict card ── */}
        <div className="rounded-2xl bg-[#0f2a44] overflow-hidden shadow-xl print:shadow-none">
          <div className="px-6 py-6">
            <div className="flex items-start justify-between gap-4 flex-wrap mb-5">
              <div>
                <p className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-1">
                  {lang === 'es' ? 'Reporte de Registrabilidad IMPI' : 'IMPI Registrability Report'}
                </p>
                <h1 className="text-4xl font-black text-white tracking-tight leading-none">{data.markName}</h1>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  {data.classes.map(c => (
                    <span key={c} className="text-xs font-bold bg-white/20 text-white px-2.5 py-1 rounded-full">
                      {lang === 'es' ? `Clase ${c} Niza` : `Nice Class ${c}`}
                    </span>
                  ))}
                  <span className="text-xs text-white/60">{t(data.goodsServices, lang).slice(0, 60)}…</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-3">
                <span className={`text-sm font-black px-4 py-2 rounded-xl uppercase tracking-wide ${riskCfg.bg} ${riskCfg.text}`}>
                  {t(riskCfg.label, lang)}
                </span>
                <RegistrabilityGauge score={data.registrabilityScore} />
              </div>
            </div>
            {/* Headline reason */}
            <div className="bg-red-500/20 border border-red-400/30 rounded-xl p-3 mb-4">
              <p className="text-white text-xs leading-relaxed">
                <span className="font-bold text-red-300">⚠ {lang === 'es' ? 'Diagnóstico principal:' : 'Key finding:'} </span>
                {t(data.headlineReason, lang)}
              </p>
            </div>
            {/* KPI tiles */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
              {[
                { label: { en: 'Registrability', es: 'Registrabilidad' }, value: `${data.registrabilityScore}/100`, color: 'text-red-400' },
                { label: { en: 'Critical conflicts', es: 'Conflictos críticos' }, value: String(data.criticalConflicts.length), color: 'text-red-400' },
                { label: { en: 'LFPPI fails', es: 'Fracciones fallidas' }, value: `${failCount}/22`, color: 'text-orange-400' },
                { label: { en: 'Distinctiveness', es: 'Distintividad' }, value: t(TIER_LABEL[data.distinctivenessTier], lang), color: 'text-amber-400' },
              ].map((kpi, i) => (
                <div key={i} className="bg-white/10 rounded-xl px-3 py-2.5 text-center">
                  <p className="text-white/50 text-[9px] font-semibold uppercase tracking-wide mb-1">{t(kpi.label, lang)}</p>
                  <p className={`text-sm font-black ${kpi.color}`}>{kpi.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Top conflict spotlight */}
          <div className="bg-white/5 border-t border-white/10 px-6 py-4">
            <div className="flex items-center gap-2 mb-3">
              <Star size={13} className="text-[#e07a3f]" />
              <span className="text-white/80 text-xs font-bold uppercase tracking-wide">
                {lang === 'es' ? 'Conflicto Principal Detectado' : 'Top Conflict Detected'}
              </span>
            </div>
            <div className="bg-white/10 rounded-xl p-4 flex items-start gap-4 flex-wrap">
              <SimilarityRing score={data.topConflict.similarityScore} size={56} />
              <div className="flex-1 min-w-[160px]">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-white font-black text-lg">{data.topConflict.name}</span>
                  <StatusPill status={data.topConflict.status} lang={lang} />
                  <span className="text-xs font-bold bg-white/20 text-white px-2 py-0.5 rounded-full">
                    {lang === 'es' ? `Clase ${data.topConflict.classNum}` : `Class ${data.topConflict.classNum}`}
                  </span>
                </div>
                <p className="text-white/80 text-xs font-semibold">{data.topConflict.holder}</p>
                <div className="flex items-center gap-3 mt-1 text-white/60 text-[10px] flex-wrap">
                  <span className="flex items-center gap-1"><MapPin size={9} />{data.topConflict.holderCountry}</span>
                  <span className="flex items-center gap-1"><Building2 size={9} />{t(HOLDER_TYPE_LABEL[data.topConflict.holderType], lang)}</span>
                  {data.topConflict.registrationDate && <span className="flex items-center gap-1"><Clock size={9} />{lang === 'es' ? `Reg. ${data.topConflict.registrationDate}` : `Reg. ${data.topConflict.registrationDate}`}</span>}
                  {data.topConflict.registrationNumber && <span className="font-mono">#{data.topConflict.registrationNumber}</span>}
                </div>
                <p className="text-white/70 text-[10px] mt-2 leading-relaxed">{t(data.topConflict.whyItMatters, lang)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── § 2  Five-axis risk scorecard ── */}
        <CollapsibleSection
          title={lang === 'es' ? '§2. Perfil de Riesgo — 5 Ejes LFPPI' : '§2. Risk Profile — 5 LFPPI Axes'}
          subtitle={lang === 'es' ? 'Puntuaciones específicas a la ley mexicana. Mayor puntuación = menor riesgo.' : 'Mexico-law-specific scores. Higher score = lower risk.'}
          defaultOpen
        >
          <div className="px-5 py-4 space-y-3">
            {axes.map(ax => {
              const score = data.axisScores[ax.key];
              const color = score >= 70 ? '#16a34a' : score >= 40 ? '#f59e0b' : '#dc2626';
              return (
                <details key={ax.key} className="group">
                  <summary className="list-none cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-28 flex-shrink-0">
                        <p className="text-[11px] font-bold text-gray-700 leading-tight">{t(ax.label, lang)}</p>
                      </div>
                      <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${score}%`, backgroundColor: color }} />
                      </div>
                      <span className="text-xs font-black w-8 text-right flex-shrink-0" style={{ color }}>{score}</span>
                      <ChevronDown size={12} className="text-gray-400 group-open:rotate-180 transition-transform flex-shrink-0" />
                    </div>
                  </summary>
                  <div className="mt-2 ml-[7.5rem] pl-3 border-l-2 border-gray-100">
                    <p className="text-[11px] text-gray-600 leading-relaxed">{t(ax.desc, lang)}</p>
                  </div>
                </details>
              );
            })}
          </div>
        </CollapsibleSection>

        {/* ── § 3  Distinctiveness spectrum ── */}
        <CollapsibleSection
          title={lang === 'es' ? '§3. Espectro de Distintividad' : '§3. Distinctiveness Spectrum'}
          subtitle={lang === 'es' ? 'Evaluación única que alimenta todas las secciones del reporte.' : 'Single-source verdict powering all sections of this report.'}
          defaultOpen
          badge={<span className={`text-xs font-bold px-2 py-0.5 rounded-full ${TIER_BG[data.distinctivenessTier]}`}>{t(TIER_LABEL[data.distinctivenessTier], lang)}</span>}
        >
          <div className="px-5 py-5">
            {/* Gradient bar */}
            <div className="relative mb-6">
              <div className="h-6 rounded-lg overflow-hidden"
                style={{ background: 'linear-gradient(to right, #dc2626, #ea580c, #d97706, #16a34a, #0f2a44)' }} />
              {/* Pointer */}
              {(() => {
                const idx = TIER_ORDER.indexOf(data.distinctivenessTier);
                const pct = (idx / (TIER_ORDER.length - 1)) * 100;
                return (
                  <div className="absolute top-full mt-1" style={{ left: `${pct}%`, transform: 'translateX(-50%)' }}>
                    <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-b-[8px] border-l-transparent border-r-transparent border-b-[#0f2a44] mx-auto" />
                    <div className="bg-[#0f2a44] text-white text-[9px] font-bold px-2 py-0.5 rounded mt-0.5 whitespace-nowrap">
                      {data.markName} — {t(TIER_LABEL[data.distinctivenessTier], lang)}
                    </div>
                  </div>
                );
              })()}
              <div className="flex justify-between mt-1">
                {TIER_ORDER.map(tier => (
                  <span key={tier} className="text-[9px] text-gray-500 font-semibold">
                    {t(TIER_LABEL[tier], lang)}
                  </span>
                ))}
              </div>
            </div>
            {/* Examples row */}
            <div className="flex gap-2 flex-wrap mt-8 mb-4">
              {[
                { tier: 'generic' as Tier, mark: 'SUPLEMENTO', example: { en: 'for supplements', es: 'para suplementos' } },
                { tier: 'descriptive' as Tier, mark: 'VITAFIT', example: { en: '← Your mark', es: '← Tu marca' } },
                { tier: 'suggestive' as Tier, mark: 'NUTREVAL', example: { en: 'suggests nutrition value', es: 'sugiere valor nutricional' } },
                { tier: 'arbitrary' as Tier, mark: 'APPLE (computers)', example: { en: 'unrelated word', es: 'palabra no relacionada' } },
                { tier: 'fanciful' as Tier, mark: 'XEROX', example: { en: 'invented word', es: 'palabra inventada' } },
              ].map(ex => (
                <div key={ex.tier} className={`flex-1 min-w-[90px] rounded-lg p-2 border ${ex.tier === data.distinctivenessTier ? 'ring-2 ring-[#0f2a44]' : ''}`}
                  style={{ borderColor: TIER_COLORS[ex.tier] + '40', backgroundColor: TIER_COLORS[ex.tier] + '10' }}>
                  <p className="text-[10px] font-black" style={{ color: TIER_COLORS[ex.tier] }}>{ex.mark}</p>
                  <p className="text-[9px] text-gray-500 mt-0.5">{t(ex.example, lang)}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-600 leading-relaxed mt-2">{t(data.distinctivenessExplanation, lang)}</p>
          </div>
        </CollapsibleSection>

        {/* ── § 4  Element decomposition ── */}
        <CollapsibleSection
          title={lang === 'es' ? '§4. Descomposición de Elementos' : '§4. Element Decomposition'}
          subtitle={lang === 'es' ? 'Análisis morfema por morfema de la marca propuesta.' : 'Morpheme-by-morpheme analysis of the proposed mark.'}
          defaultOpen
        >
          <div className="px-5 py-4 space-y-3">
            {data.elementDecomposition.map((el, i) => {
              const isComposite = i === data.elementDecomposition.length - 1 && data.elementDecomposition.length > 1;
              return (
                <div key={i} className={`rounded-xl border p-4 ${isComposite ? 'bg-[#0f2a44]/5 border-[#0f2a44]/20' : 'bg-white border-gray-200'}`}>
                  <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      {isComposite && <Layers size={14} className="text-[#0f2a44] flex-shrink-0" />}
                      <span className={`text-lg font-black ${isComposite ? 'text-[#0f2a44]' : 'text-gray-800'}`}>{el.element}</span>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${TIER_BG[el.tier]}`}>
                      {t(TIER_LABEL[el.tier], lang)}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-gray-700 mb-0.5">{t(el.meaning, lang)}</p>
                  <p className="text-[10px] text-gray-500 italic mb-2">{t(el.etymology, lang)}</p>
                  {!isComposite && (
                    <div className="flex gap-4 text-[10px] mb-2">
                      <div className="flex items-center gap-1.5">
                        <Tag size={9} className="text-gray-400" />
                        <span className="text-gray-500">{lang === 'es' ? 'Saturación Cl. 5:' : 'Class 5 saturation:'}</span>
                        <span className="font-bold text-gray-700">{el.saturationClass.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Globe size={9} className="text-gray-400" />
                        <span className="text-gray-500">{lang === 'es' ? 'Todas las clases:' : 'All classes:'}</span>
                        <span className="font-bold text-gray-700">{el.saturationAll.toLocaleString()}</span>
                      </div>
                    </div>
                  )}
                  <p className="text-[11px] text-gray-600 leading-relaxed">{t(el.contribution, lang)}</p>
                </div>
              );
            })}
          </div>
        </CollapsibleSection>

        {/* ── § 5  Saturation visualization ── */}
        <CollapsibleSection
          title={lang === 'es' ? '§5. Visualización de Saturación del Campo' : '§5. Field Saturation Visualization'}
          subtitle={lang === 'es' ? '¿Qué tan congestionado está el espacio de nombres que estás intentando ocupar?' : 'How crowded is the namespace you\'re trying to enter?'}
        >
          <div className="px-5 py-4">
            {/* Proportional bars */}
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              {lang === 'es' ? 'Registros en IMPI MARCia (Clase 5) por elemento' : 'IMPI MARCia registrations (Class 5) by element'}
            </p>
            <div className="space-y-2 mb-6">
              {data.elementDecomposition.filter(e => e.element !== data.markName).map(el => (
                <div key={el.element} className="flex items-center gap-3">
                  <span className="text-xs font-black text-gray-700 w-16 flex-shrink-0">{el.element}</span>
                  <div className="flex-1 h-5 bg-gray-100 rounded-lg overflow-hidden">
                    <div className="h-full rounded-lg bg-orange-400 transition-all duration-700 flex items-center pl-2"
                      style={{ width: `${(el.saturationClass / maxSat) * 100}%` }}>
                      <span className="text-[9px] font-bold text-white whitespace-nowrap">{el.saturationClass.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
              {data.elementDecomposition.filter(e => e.element === data.markName).map(el => (
                <div key={el.element} className="flex items-center gap-3">
                  <span className="text-xs font-black text-[#0f2a44] w-16 flex-shrink-0">{el.element}</span>
                  <div className="flex-1 h-5 bg-gray-100 rounded-lg overflow-hidden">
                    <div className="h-full rounded-lg bg-[#0f2a44] transition-all duration-700 flex items-center pl-2"
                      style={{ width: `${Math.max(4, (el.saturationClass / maxSat) * 100)}%` }}>
                      <span className="text-[9px] font-bold text-white whitespace-nowrap">{el.saturationClass.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {/* Zona muerta / zona distintiva axis */}
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              {lang === 'es' ? 'Zona muerta vs Zona distintiva (LFPPI Art. 173 Fr. IV)' : 'Dead zone vs Distinctive zone (LFPPI Art. 173 Fr. IV)'}
            </p>
            <div className="relative h-8 rounded-xl overflow-hidden mb-1"
              style={{ background: 'linear-gradient(to right, #dc2626 0%, #f59e0b 50%, #16a34a 100%)' }}>
              {/* Mark position — descriptive = ~20% */}
              <div className="absolute inset-y-0" style={{ left: '20%', transform: 'translateX(-50%)' }}>
                <div className="h-full w-0.5 bg-white/80" />
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 bg-white text-[#0f2a44] text-[9px] font-black px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap">
                  {data.markName}
                </div>
              </div>
            </div>
            <div className="flex justify-between text-[9px] text-gray-500 font-semibold">
              <span>← {lang === 'es' ? 'Zona muerta (descriptivo/genérico)' : 'Dead zone (descriptive/generic)'}</span>
              <span>{lang === 'es' ? 'Zona distintiva (arbitrario/fantasía)' : 'Distinctive zone (arbitrary/fanciful)'} →</span>
            </div>
          </div>
        </CollapsibleSection>

        {/* ── § 6  Análisis de Confundibilidad ── */}
        <CollapsibleSection
          title={lang === 'es' ? '§6. Análisis de Confundibilidad (LFPPI)' : '§6. Confusability Analysis (LFPPI)'}
          subtitle={lang === 'es' ? 'Marco jurídico mexicano — sin DuPont. Basado en LFPPI Arts. 171–174 y jurisprudencia TFJA/SCJN.' : 'Mexican legal framework — no DuPont. Based on LFPPI Arts. 171–174 and TFJA/SCJN case law.'}
          defaultOpen
          badge={<span className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">{data.confundibilidad.filter(c => c.verdict === 'desfavorable').length} {lang === 'es' ? 'desfavorables' : 'unfavorable'}</span>}
        >
          <div className="px-5 py-4 space-y-3">
            {data.confundibilidad.map(crit => {
              const cfg = VERDICT_CFG[crit.verdict];
              return (
                <details key={crit.id} className={`rounded-xl border overflow-hidden ${cfg.cls}`}>
                  <summary className="list-none cursor-pointer px-4 py-3 flex items-start gap-3 select-none">
                    <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1 ${cfg.dot}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className="text-xs font-bold text-gray-800">{t(crit.title, lang)}</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide ${cfg.dot === 'bg-emerald-500' ? 'bg-emerald-100 text-emerald-700' : cfg.dot === 'bg-amber-500' ? 'bg-amber-100 text-amber-700' : cfg.dot === 'bg-red-500' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'}`}>
                          {t(cfg.label, lang)}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-600">{t(crit.question, lang)}</p>
                    </div>
                    <ChevronDown size={12} className="text-gray-400 flex-shrink-0 mt-0.5 group-open:rotate-180 transition-transform" />
                  </summary>
                  <div className="px-4 pb-4 pt-1 border-t border-gray-100 bg-white/60 space-y-2">
                    <div className="flex items-center gap-1.5">
                      <BookOpen size={10} className="text-gray-400" />
                      <span className="text-[10px] font-semibold text-[#0f2a44]">{crit.cite}</span>
                    </div>
                    <p className="text-[11px] text-gray-700 leading-relaxed">{t(crit.analysis, lang)}</p>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                      <p className="text-[10px] text-amber-800"><span className="font-bold">{lang === 'es' ? 'Consecuencia: ' : 'Consequence: '}</span>{t(crit.consequence, lang)}</p>
                    </div>
                  </div>
                </details>
              );
            })}
          </div>
        </CollapsibleSection>

        {/* ── § 7  Art. 173 LFPPI dashboard ── */}
        <CollapsibleSection
          title={lang === 'es' ? '§7. Art. 173 LFPPI — Las 22 Fracciones + Art. 12' : '§7. Art. 173 LFPPI — All 22 Grounds + Art. 12'}
          subtitle={lang === 'es' ? `${failCount} fallidos · ${cautionCount} con precaución · ${22 - failCount - cautionCount} pasados` : `${failCount} failed · ${cautionCount} caution · ${22 - failCount - cautionCount} passed`}
          badge={failCount > 0 ? <span className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">{failCount} {lang === 'es' ? 'fallidos' : 'failed'}</span> : undefined}
        >
          <div className="px-5 py-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 mb-2">
              {data.fracciones.map(frac => {
                const cfg = FRAC_CFG[frac.verdict];
                return (
                  <details key={frac.num} className={`rounded-xl border cursor-pointer ${cfg.cls} transition-all`}>
                    <summary className="list-none px-3 py-2 select-none">
                      <div className="flex items-start gap-2">
                        <span className={`text-[11px] font-black w-4 text-center flex-shrink-0 mt-0.5 ${frac.verdict === 'fail' ? 'text-red-600' : frac.verdict === 'caution' ? 'text-amber-600' : frac.verdict === 'pass' ? 'text-emerald-600' : 'text-gray-400'}`}>{cfg.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1 flex-wrap">
                            <span className="text-[9px] font-bold text-gray-500">Fr. {frac.num}</span>
                            <span className={`text-[8px] font-bold px-1 py-0.5 rounded uppercase ${cfg.badge}`}>
                              {frac.verdict === 'pass' ? (lang === 'es' ? 'OK' : 'Pass') : frac.verdict === 'caution' ? (lang === 'es' ? 'Precaución' : 'Caution') : frac.verdict === 'fail' ? (lang === 'es' ? 'Falla' : 'Fail') : 'N/A'}
                            </span>
                          </div>
                          <p className="text-[9px] text-gray-600 mt-0.5 leading-tight">{t(frac.question, lang)}</p>
                        </div>
                      </div>
                    </summary>
                    <div className="px-3 pb-3 pt-2 border-t border-gray-100 space-y-2">
                      <div className="bg-gray-100 rounded-lg px-2 py-1.5">
                        <p className="text-[9px] text-gray-600 italic leading-relaxed">{frac.statuteEs}</p>
                      </div>
                      <p className="text-[10px] text-gray-700 leading-relaxed">{t(frac.analysis, lang)}</p>
                      <div className={`rounded-lg px-2 py-1.5 ${frac.verdict === 'fail' ? 'bg-red-50 border border-red-200' : frac.verdict === 'caution' ? 'bg-amber-50 border border-amber-200' : 'bg-emerald-50 border border-emerald-200'}`}>
                        <p className="text-[9px] font-semibold leading-relaxed">{t(frac.consequence, lang)}</p>
                      </div>
                    </div>
                  </details>
                );
              })}
              {/* Art. 12 card */}
              <details className="rounded-xl border border-gray-100 bg-gray-50 cursor-pointer">
                <summary className="list-none px-3 py-2 select-none">
                  <div className="flex items-start gap-2">
                    <span className="text-[11px] font-black w-4 text-center flex-shrink-0 mt-0.5 text-emerald-600">✓</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className="text-[9px] font-bold text-gray-500">Art. 12</span>
                        <span className="text-[8px] font-bold px-1 py-0.5 rounded uppercase bg-emerald-100 text-emerald-700">{lang === 'es' ? 'OK' : 'Pass'}</span>
                      </div>
                      <p className="text-[9px] text-gray-600 mt-0.5 leading-tight">{lang === 'es' ? '¿Viola el orden público o las buenas costumbres?' : 'Does it violate public order or accepted morality?'}</p>
                    </div>
                  </div>
                </summary>
                <div className="px-3 pb-3 pt-2 border-t border-gray-100">
                  <p className="text-[10px] text-gray-600">{lang === 'es' ? 'VITAFIT no viola el orden público ni las buenas costumbres. Sin problema.' : 'VITAFIT does not violate public order or morality. No issue.'}</p>
                </div>
              </details>
            </div>
          </div>
        </CollapsibleSection>

        {/* ── § 8  Conflicting marks ── */}
        <CollapsibleSection
          title={lang === 'es' ? '§8. Marcas en Conflicto' : '§8. Conflicting Marks'}
          subtitle={lang === 'es' ? `${data.criticalConflicts.length} críticos · ${data.significantConflicts.length} significativos · ${data.backgroundConflicts.length} de fondo` : `${data.criticalConflicts.length} critical · ${data.significantConflicts.length} significant · ${data.backgroundConflicts.length} background`}
          defaultOpen
        >
          <div className="px-5 py-4 space-y-4">
            {/* Holder pattern callouts */}
            {data.holderClusters.map((cluster, i) => (
              <div key={i} className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-2">
                <AlertTriangle size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-amber-800 mb-0.5">
                    {lang === 'es' ? 'Clúster detectado:' : 'Cluster detected:'} {cluster.holder}
                  </p>
                  <p className="text-[11px] text-amber-700 leading-relaxed">{t(cluster.note, lang)}</p>
                  <div className="flex gap-1 mt-1.5 flex-wrap">
                    {cluster.marks.map(m => (
                      <span key={m} className="text-[9px] font-bold bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full">{m}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}

            {/* Holder filter */}
            {uniqueHolders.length > 1 && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">{lang === 'es' ? 'Filtrar por titular:' : 'Filter by holder:'}</span>
                <button type="button" onClick={() => setHolderFilter(null)}
                  className={`text-[9px] font-bold px-2 py-0.5 rounded-full border transition-all ${!holderFilter ? 'bg-[#0f2a44] text-white border-[#0f2a44]' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'}`}>
                  {lang === 'es' ? 'Todos' : 'All'}
                </button>
                {uniqueHolders.slice(0, 6).map(h => (
                  <button key={h} type="button" onClick={() => setHolderFilter(holderFilter === h ? null : h)}
                    className={`text-[9px] font-bold px-2 py-0.5 rounded-full border transition-all ${holderFilter === h ? 'bg-[#0f2a44] text-white border-[#0f2a44]' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'}`}>
                    {h.length > 25 ? h.slice(0, 24) + '…' : h}
                  </button>
                ))}
              </div>
            )}

            {/* Critical */}
            {filteredCritical.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-black text-red-700 uppercase tracking-wide">{lang === 'es' ? 'Conflictos Críticos' : 'Critical Conflicts'} — ≥80%</span>
                  <div className="flex-1 h-px bg-red-100" />
                  <span className="text-[9px] text-red-500 font-bold">{filteredCritical.length}</span>
                </div>
                <div className="space-y-3">
                  {filteredCritical.map((c, i) => (
                    <div key={c.id} className={`rounded-xl border bg-white shadow-sm overflow-hidden ${c.id === data.topConflict.id ? 'border-red-300 ring-2 ring-red-200' : 'border-red-200'}`}>
                      {c.id === data.topConflict.id && (
                        <div className="bg-red-50 border-b border-red-200 px-4 py-1.5 flex items-center gap-1.5">
                          <Star size={11} className="text-red-500" />
                          <span className="text-[10px] font-black text-red-700 uppercase tracking-wide">{lang === 'es' ? 'Conflicto Principal' : 'Top Conflict'}</span>
                        </div>
                      )}
                      <div className="flex items-start gap-3 px-4 py-3">
                        <SimilarityRing score={c.similarityScore} size={48} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 flex-wrap mb-1">
                            <div>
                              {c.marciaUrl
                                ? <a href={c.marciaUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-black text-gray-900 hover:text-[#0f2a44] underline flex items-center gap-1">{c.name} <ExternalLink size={10} /></a>
                                : <span className="text-sm font-black text-gray-900">{c.name}</span>
                              }
                            </div>
                            <div className="flex items-center gap-1.5 flex-shrink-0 flex-wrap">
                              <StatusPill status={c.status} lang={lang} />
                              <span className="text-[10px] font-bold bg-[#0f2a44]/10 text-[#0f2a44] px-2 py-0.5 rounded-full">
                                {lang === 'es' ? `Cl. ${c.classNum}` : `Cl. ${c.classNum}`}
                              </span>
                            </div>
                          </div>
                          <p className="text-xs font-semibold text-gray-700">{c.holder}</p>
                          <div className="flex items-center gap-3 mt-0.5 text-[10px] text-gray-500 flex-wrap">
                            <span className="flex items-center gap-1"><MapPin size={9} />{c.holderCountry}</span>
                            <span className="flex items-center gap-1"><Users size={9} />{t(HOLDER_TYPE_LABEL[c.holderType], lang)}</span>
                            {c.filingDate && <span>{lang === 'es' ? `Solicitud: ${c.filingDate}` : `Filed: ${c.filingDate}`}</span>}
                            {c.registrationDate && <span>{lang === 'es' ? `Registro: ${c.registrationDate}` : `Reg.: ${c.registrationDate}`}</span>}
                            {c.registrationNumber && <span className="font-mono">#{c.registrationNumber}</span>}
                            {c.expediente && <span className="font-mono">{c.expediente}</span>}
                          </div>
                          {c.goodsServices && <p className="text-[10px] text-gray-400 mt-1 line-clamp-1">{c.goodsServices}</p>}
                          <div className="mt-2 bg-red-50 rounded-lg px-2.5 py-1.5 text-[10px] text-red-700">
                            {t(c.whyItMatters, lang)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Significant */}
            {filteredSignificant.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-black text-amber-700 uppercase tracking-wide">{lang === 'es' ? 'Conflictos Significativos' : 'Significant Conflicts'} — 50–79%</span>
                  <div className="flex-1 h-px bg-amber-100" />
                  <span className="text-[9px] text-amber-600 font-bold">{filteredSignificant.length}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {filteredSignificant.map(c => (
                    <div key={c.id} className="rounded-xl border border-amber-200 bg-white p-3">
                      <div className="flex items-start gap-2 mb-1">
                        <SimilarityRing score={c.similarityScore} size={36} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-bold text-gray-800">{c.name}</span>
                            <StatusPill status={c.status} lang={lang} />
                          </div>
                          <p className="text-[10px] text-gray-600 break-words">{c.holder}</p>
                        </div>
                      </div>
                      <p className="text-[9px] text-amber-700 bg-amber-50 rounded px-2 py-1">{t(c.whyItMatters, lang)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Background */}
            <div>
              <button type="button" onClick={() => setBgOpen(v => !v)}
                className="flex items-center gap-2 w-full">
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-wide">{lang === 'es' ? 'Ruido de Fondo' : 'Background Noise'} — &lt;50%</span>
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-[9px] text-gray-400 font-bold">{data.backgroundConflicts.length}</span>
                {bgOpen ? <ChevronUp size={10} className="text-gray-400" /> : <ChevronDown size={10} className="text-gray-400" />}
              </button>
              {bgOpen && (
                <div className="mt-2 space-y-1">
                  {data.backgroundConflicts.map(c => (
                    <div key={c.id} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-100 bg-gray-50/50 text-[10px]">
                      <span className="font-bold text-gray-600 flex-1 truncate">{c.name}</span>
                      <span className="text-gray-500 break-words max-w-[160px]">{c.holder}</span>
                      <StatusPill status={c.status} lang={lang} />
                      <span className="text-gray-400 flex-shrink-0">{c.similarityScore}%</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CollapsibleSection>

        {/* ── § 9  Análisis de mala fe ── */}
        <CollapsibleSection
          title={lang === 'es' ? '§9. Análisis de Mala Fe (Art. 173 Fr. XXII)' : '§9. Bad-Faith Analysis (Art. 173 Fr. XXII)'}
          badge={<span className={`text-xs font-bold px-2 py-0.5 rounded-full ${data.malaFeVerdict === 'high' ? 'bg-red-100 text-red-700' : data.malaFeVerdict === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>{data.malaFeVerdict.toUpperCase()}</span>}
        >
          <div className="px-5 py-4">
            <div className="space-y-2 mb-4">
              {data.malaFeIndicators.map((ind, i) => (
                <div key={i} className={`flex items-center gap-3 px-3 py-2 rounded-lg border ${ind.present ? 'border-amber-200 bg-amber-50' : 'border-gray-100 bg-gray-50'}`}>
                  {ind.present
                    ? <AlertCircle size={12} className="text-amber-600 flex-shrink-0" />
                    : <CheckCircle2 size={12} className="text-emerald-500 flex-shrink-0" />}
                  <span className="text-xs text-gray-700">{t(ind.label, lang)}</span>
                  <span className={`ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full ${ind.present ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'}`}>
                    {ind.present ? (lang === 'es' ? 'Presente' : 'Present') : (lang === 'es' ? 'Ausente' : 'Absent')}
                  </span>
                </div>
              ))}
            </div>
            <div className={`rounded-xl p-4 border ${data.malaFeVerdict === 'high' ? 'border-red-200 bg-red-50' : data.malaFeVerdict === 'medium' ? 'border-amber-200 bg-amber-50' : 'border-emerald-200 bg-emerald-50'}`}>
              <p className="text-xs font-bold mb-1">{lang === 'es' ? 'Evaluación AI de riesgo de mala fe:' : 'AI assessment of bad-faith risk:'} <span className="uppercase">{data.malaFeVerdict}</span></p>
              <p className="text-xs text-gray-700 leading-relaxed">{t(data.malaFeRationale, lang)}</p>
            </div>
          </div>
        </CollapsibleSection>

        {/* ── § 10  Riesgo de oposición y nulidad ── */}
        <CollapsibleSection
          title={lang === 'es' ? '§10. Riesgo de Oposición y Nulidad' : '§10. Opposition & Nullity Risk'}
          subtitle={lang === 'es' ? 'Procedimiento IMPI y ventana de nulidad post-registro.' : 'IMPI procedure and post-registration nullity window.'}
        >
          <div className="px-5 py-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Opposition */}
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Scale size={14} className="text-amber-700" />
                <span className="text-xs font-bold text-amber-900">{lang === 'es' ? 'Procedimiento de Oposición' : 'Opposition Procedure'}</span>
              </div>
              <div className="space-y-2 text-[10px] text-amber-800">
                {[
                  { label: lang === 'es' ? 'Publicación en Gaceta IMPI' : 'Publication in IMPI Gazette', sub: lang === 'es' ? 'Tras aprobación del examen formal' : 'After formal examination approval' },
                  { label: lang === 'es' ? 'Ventana de oposición' : 'Opposition window', sub: lang === 'es' ? '1 mes desde publicación (LFPPI Art. 196)' : '1 month from publication (LFPPI Art. 196)' },
                  { label: lang === 'es' ? 'Examen de oposición IMPI' : 'IMPI opposition examination', sub: lang === 'es' ? '3–12 meses' : '3–12 months' },
                  { label: lang === 'es' ? 'Resolución' : 'Resolution', sub: lang === 'es' ? 'Registro concedido / negado' : 'Registration granted / refused' },
                ].map((step, i) => (
                  <div key={i} className="flex gap-2">
                    <div className="flex flex-col items-center">
                      <div className="w-5 h-5 rounded-full bg-amber-300 text-amber-900 flex items-center justify-center text-[9px] font-black flex-shrink-0">{i + 1}</div>
                      {i < 3 && <div className="w-px flex-1 bg-amber-300 my-0.5" style={{ minHeight: 12 }} />}
                    </div>
                    <div className="pb-2">
                      <p className="font-bold">{step.label}</p>
                      <p className="opacity-70">{step.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3">
                <p className="text-[10px] font-bold text-amber-900 mb-1">{lang === 'es' ? 'Posibles opositores:' : 'Likely opposers:'}</p>
                {data.criticalConflicts.slice(0, 3).map(c => (
                  <div key={c.id} className="text-[9px] text-amber-800 flex items-center gap-1 mb-0.5">
                    <span className="font-black">·</span>{c.holder} ({c.name})
                  </div>
                ))}
              </div>
            </div>
            {/* Nullity */}
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <div className="flex items-center gap-2 mb-3">
                <X size={14} className="text-red-700" />
                <span className="text-xs font-bold text-red-900">{lang === 'es' ? 'Acción de Nulidad' : 'Nullity Action'}</span>
              </div>
              <p className="text-[11px] text-red-800 leading-relaxed mb-3">
                {lang === 'es'
                  ? 'Aun si el IMPI concede el registro, cualquier titular de un registro previo conflictivo puede iniciar una acción de nulidad bajo el Art. 258 LFPPI dentro de los 5 años siguientes al registro.'
                  : 'Even if IMPI grants registration, any holder of a prior conflicting mark may initiate a nullity action under LFPPI Art. 258 within 5 years of registration.'}
              </p>
              <div className="text-[10px] text-red-700 space-y-1">
                {[
                  { label: lang === 'es' ? 'Fundamento:' : 'Basis:', val: 'LFPPI Art. 258' },
                  { label: lang === 'es' ? 'Ventana:' : 'Window:', val: lang === 'es' ? '5 años desde el registro' : '5 years from registration' },
                  { label: lang === 'es' ? 'Posibles accionantes:' : 'Potential plaintiffs:', val: 'LIDL STIFTUNG & CO. KG, ALFONSO VILLANUEVA VALENCIANO' },
                ].map((row, i) => (
                  <div key={i} className="flex gap-2">
                    <span className="font-bold w-28 flex-shrink-0">{row.label}</span>
                    <span>{row.val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CollapsibleSection>

        {/* ── § 11  Marcas notorias ── */}
        <CollapsibleSection
          title={lang === 'es' ? '§11. Marcas Notorias y Famosas (Art. 173 Fr. XVI–XVII)' : '§11. Notorious & Famous Marks (Art. 173 Fr. XVI–XVII)'}
          badge={data.famousMarks.length > 0 ? <span className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">{data.famousMarks.length} {lang === 'es' ? 'detectada(s)' : 'detected'}</span> : undefined}
        >
          <div className="px-5 py-4">
            {data.famousMarks.map((fm, i) => (
              <div key={i} className="rounded-xl border border-red-200 bg-red-50 p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle size={14} className="text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-red-800">{fm.name} — {fm.holder}</p>
                    <p className="text-[10px] text-red-600 mt-0.5">{lang === 'es' ? 'Sector:' : 'Sector:'} {fm.sector}</p>
                    <p className="text-[11px] text-red-700 mt-1.5 leading-relaxed">{fm.threat}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CollapsibleSection>

        {/* ── § 12  Translation analysis ── */}
        <CollapsibleSection
          title={lang === 'es' ? '§12. Análisis Lingüístico Cruzado' : '§12. Cross-Language Analysis'}
          subtitle={lang === 'es' ? '8 idiomas analizados: ES, EN, PT, FR, DE, ZH, HI, JA' : '8 languages checked: ES, EN, PT, FR, DE, ZH, HI, JA'}
        >
          <div className="px-5 py-4">
            <div className="overflow-x-auto">
              <table className="w-full text-[10px] border-collapse">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-1.5 pr-3 text-[9px] font-bold text-gray-400 uppercase tracking-wide w-24">{lang === 'es' ? 'Idioma' : 'Language'}</th>
                    <th className="text-left py-1.5 pr-3 text-[9px] font-bold text-gray-400 uppercase tracking-wide">{lang === 'es' ? 'Forma' : 'Form'}</th>
                    <th className="text-left py-1.5 pr-3 text-[9px] font-bold text-gray-400 uppercase tracking-wide w-16">{lang === 'es' ? 'Riesgo' : 'Risk'}</th>
                    <th className="text-left py-1.5 text-[9px] font-bold text-gray-400 uppercase tracking-wide">{lang === 'es' ? 'Observación' : 'Note'}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.translationAnalysis.map((ta, i) => {
                    const riskBadge = { high: 'bg-red-100 text-red-700', medium: 'bg-amber-100 text-amber-700', low: 'bg-blue-100 text-blue-700', none: 'bg-emerald-50 text-emerald-600' }[ta.risk];
                    const riskLabel = { high: lang === 'es' ? 'Alto' : 'High', medium: lang === 'es' ? 'Medio' : 'Med', low: lang === 'es' ? 'Bajo' : 'Low', none: lang === 'es' ? 'Ninguno' : 'None' }[ta.risk];
                    return (
                      <tr key={i} className={`border-b border-gray-50 last:border-0 ${ta.risk !== 'none' ? 'bg-amber-50/30' : ''}`}>
                        <td className="py-2 pr-3 font-semibold text-gray-700 align-top">{ta.langName}</td>
                        <td className="py-2 pr-3 font-mono text-gray-700 align-top">{ta.form}</td>
                        <td className="py-2 pr-3 align-top"><span className={`inline-block text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase ${riskBadge}`}>{riskLabel}</span></td>
                        <td className="py-2 text-gray-500 align-top leading-relaxed">{ta.note}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </CollapsibleSection>

        {/* ── § 13  Otros impedimentos absolutos ── */}
        <CollapsibleSection
          title={lang === 'es' ? '§13. Otros Impedimentos Absolutos' : '§13. Other Absolute Grounds'}
          subtitle={lang === 'es' ? 'Todos explícitamente evaluados. N/A indica que no aplica a esta marca.' : 'All explicitly evaluated. N/A means does not apply to this mark.'}
        >
          <div className="px-5 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                { label: { en: 'Fr. I — Genericity / common use', es: 'Fr. I — Genericidad / uso común' }, verdict: 'caution' as FraccionVerdict, note: { en: 'VITA and FIT are not generic but are extremely common in class 5.', es: 'VITA y FIT no son genéricos pero son extremadamente comunes en clase 5.' } },
                { label: { en: 'Fr. V — Misleading characteristics', es: 'Fr. V — Características engañosas' }, verdict: 'caution' as FraccionVerdict, note: { en: 'Risk if product doesn\'t deliver implied benefits.', es: 'Riesgo si el producto no cumple los beneficios implícitos.' } },
                { label: { en: 'Fr. VI — Translation / orthographic variation', es: 'Fr. VI — Traducción y variación ortográfica' }, verdict: 'fail' as FraccionVerdict, note: { en: 'VITA (Latin/Spanish) + FIT (English) = non-registrable translated compound.', es: 'VITA (latín/español) + FIT (inglés) = compuesto de traducciones no registrables.' } },
                { label: { en: 'Fr. VII–IX — Official symbols and emblems', es: 'Fr. VII–IX — Signos oficiales y emblemas' }, verdict: 'na' as FraccionVerdict, note: { en: 'No official symbols or emblems present.', es: 'No hay símbolos ni emblemas oficiales.' } },
                { label: { en: 'Fr. X–XII — Geographic indications & appellations', es: 'Fr. X–XII — Indicaciones geográficas y denominaciones de origen' }, verdict: 'na' as FraccionVerdict, note: { en: 'VITAFIT has no geographic reference.', es: 'VITAFIT no tiene referencia geográfica.' } },
                { label: { en: 'Fr. XIII — Personal names', es: 'Fr. XIII — Nombres propios' }, verdict: 'pass' as FraccionVerdict, note: { en: 'Not a personal name.', es: 'No es un nombre propio.' } },
                { label: { en: 'Fr. XIV — Protected works (INDAUTOR)', es: 'Fr. XIV — Obras protegidas (INDAUTOR)' }, verdict: 'pass' as FraccionVerdict, note: { en: 'No known INDAUTOR registration.', es: 'Sin registro conocido en INDAUTOR.' } },
                { label: { en: 'Fr. XV — Deceptive signs', es: 'Fr. XV — Signos engañosos' }, verdict: 'caution' as FraccionVerdict, note: { en: 'Secondary risk; substantiate product claims.', es: 'Riesgo secundario; sustanciar afirmaciones del producto.' } },
                { label: { en: 'Fr. XXI — Plant varieties / animal breeds', es: 'Fr. XXI — Variedades vegetales y razas animales' }, verdict: 'na' as FraccionVerdict, note: { en: 'N/A.', es: 'N/A.' } },
                { label: { en: 'Art. 12 — Public order / good morals', es: 'Art. 12 — Orden público y buenas costumbres' }, verdict: 'pass' as FraccionVerdict, note: { en: 'No violation.', es: 'Sin infracción.' } },
              ].map((item, i) => {
                const cfg = FRAC_CFG[item.verdict];
                return (
                  <div key={i} className={`rounded-lg border px-3 py-2.5 ${cfg.cls}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-black ${item.verdict === 'fail' ? 'text-red-600' : item.verdict === 'caution' ? 'text-amber-600' : item.verdict === 'pass' ? 'text-emerald-600' : 'text-gray-400'}`}>{cfg.icon}</span>
                      <span className="text-[10px] font-bold text-gray-800">{t(item.label, lang)}</span>
                      <span className={`ml-auto text-[8px] font-bold px-1 py-0.5 rounded uppercase ${cfg.badge}`}>
                        {item.verdict === 'na' ? 'N/A' : item.verdict === 'pass' ? (lang === 'es' ? 'OK' : 'Pass') : item.verdict === 'caution' ? (lang === 'es' ? 'Precaución' : 'Caution') : (lang === 'es' ? 'Falla' : 'Fail')}
                      </span>
                    </div>
                    <p className="text-[9px] text-gray-600">{t(item.note, lang)}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </CollapsibleSection>

        {/* ── § 14  Strategy ── */}
        <CollapsibleSection
          title={lang === 'es' ? '§14. Estrategia Recomendada — Matriz de Decisión' : '§14. Strategy Recommendations — Decision Matrix'}
          subtitle={lang === 'es' ? `${data.strategies.length} caminos ordenados por viabilidad` : `${data.strategies.length} paths ranked by viability`}
          defaultOpen
        >
          <div className="px-5 py-4 space-y-3">
            {[...data.strategies].sort((a, b) => b.viability - a.viability).map((s, i) => (
              <div key={s.id} className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                <div className="px-4 py-3 flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-white flex-shrink-0 ${s.viability >= 80 ? 'bg-emerald-500' : s.viability >= 50 ? 'bg-amber-500' : 'bg-gray-400'}`}>{i + 1}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap mb-1">
                      <p className="text-sm font-bold text-gray-900">{t(s.title, lang)}</p>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full flex-shrink-0 ${s.viability >= 80 ? 'bg-emerald-100 text-emerald-700' : s.viability >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'}`}>
                        {lang === 'es' ? 'Viabilidad' : 'Viability'}: {s.viability}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden mb-2">
                      <div className="h-full rounded-full" style={{ width: `${s.viability}%`, backgroundColor: s.viability >= 80 ? '#16a34a' : s.viability >= 50 ? '#f59e0b' : '#9ca3af' }} />
                    </div>
                    <p className="text-[11px] text-gray-600 leading-relaxed mb-2">{t(s.description, lang)}</p>
                    {s.alternatives && s.alternatives.length > 0 && (
                      <div className="mb-2">
                        <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wide mb-1">{lang === 'es' ? 'Alternativas sugeridas:' : 'Suggested alternatives:'}</p>
                        <div className="flex gap-2 flex-wrap">
                          {s.alternatives.map(alt => (
                            <div key={alt.name} className="flex items-center gap-1.5 bg-[#0f2a44]/5 border border-[#0f2a44]/20 rounded-lg px-2.5 py-1.5">
                              <span className="text-[11px] font-black text-[#0f2a44]">{alt.name}</span>
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${alt.quickScore >= 80 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{alt.quickScore}/100</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-3 mb-2 text-[9px]">
                      <div>
                        <p className="font-bold text-gray-400 uppercase tracking-wide mb-1">{lang === 'es' ? 'A favor' : 'Pros'}</p>
                        {s.pros.map((p, j) => <p key={j} className="text-emerald-700 mb-0.5 flex items-start gap-1"><span className="text-emerald-500 flex-shrink-0">+</span>{t(p, lang)}</p>)}
                      </div>
                      <div>
                        <p className="font-bold text-gray-400 uppercase tracking-wide mb-1">{lang === 'es' ? 'En contra' : 'Cons'}</p>
                        {s.cons.map((c, j) => <p key={j} className="text-red-600 mb-0.5 flex items-start gap-1"><span className="flex-shrink-0">−</span>{t(c, lang)}</p>)}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-[9px] text-gray-500 border-t border-gray-50 pt-2">
                      <span><span className="font-semibold text-gray-400">{lang === 'es' ? 'Cuotas:' : 'Fees:'}</span> {s.feesMxn}</span>
                      <span><span className="font-semibold text-gray-400">{lang === 'es' ? 'Plazo:' : 'Timeline:'}</span> {t(s.timeline, lang)}</span>
                      <span><span className="font-semibold text-gray-400">{lang === 'es' ? 'Prob. éxito:' : 'Success:'}</span> {s.successRange}</span>
                    </div>
                  </div>
                </div>
                <div className="border-t border-gray-50 px-4 py-2 bg-gray-50/50 flex items-center justify-between">
                  <button type="button" className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#0f2a44] hover:text-[#e07a3f] transition-colors">
                    <ArrowRight size={12} />{t(s.cta, lang)}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </CollapsibleSection>

        {/* ── § 15  Cost & Timeline ── */}
        <CollapsibleSection
          title={lang === 'es' ? '§15. Costo y Cronograma IMPI' : '§15. IMPI Cost & Timeline'}
          subtitle={lang === 'es' ? '12–18 meses sin oposición · MXN $3,055 cuota oficial (1 clase)' : '12–18 months uncontested · MXN $3,055 official fee (1 class)'}
        >
          <div className="px-5 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Uncontested */}
              <div>
                <p className="text-xs font-bold text-emerald-700 mb-3 flex items-center gap-1"><CheckCircle2 size={12} />{lang === 'es' ? 'Sin oposición' : 'Uncontested'}</p>
                <div className="space-y-2">
                  {[
                    { label: { en: 'Filing', es: 'Presentación' }, time: { en: 'Day 0', es: 'Día 0' }, cost: 'MXN $3,055' },
                    { label: { en: 'Formal exam', es: 'Examen formal' }, time: { en: '1–3 mo.', es: '1–3 meses' }, cost: '' },
                    { label: { en: 'Substantive exam', es: 'Examen de fondo' }, time: { en: '4–10 mo.', es: '4–10 meses' }, cost: '' },
                    { label: { en: 'Gazette publication', es: 'Publicación en Gaceta' }, time: { en: '10–14 mo.', es: '10–14 meses' }, cost: '' },
                    { label: { en: '1-month opposition window', es: 'Ventana de oposición (1 mes)' }, time: { en: '1 mo.', es: '1 mes' }, cost: '' },
                    { label: { en: 'Certificate issued', es: 'Certificado expedido' }, time: { en: '12–18 mo. total', es: '12–18 meses total' }, cost: 'Incl.' },
                  ].map((step, i, arr) => (
                    <div key={i} className="flex gap-2">
                      <div className="flex flex-col items-center">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black text-white flex-shrink-0 ${i === arr.length - 1 ? 'bg-emerald-500' : 'bg-[#0f2a44]'}`}>{i + 1}</div>
                        {i < arr.length - 1 && <div className="w-px flex-1 bg-gray-200 my-0.5" style={{ minHeight: 10 }} />}
                      </div>
                      <div className="pb-1 flex-1">
                        <p className="text-[10px] font-bold text-gray-700">{t(step.label, lang)}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] text-gray-400">{t(step.time, lang)}</span>
                          {step.cost && <span className="text-[9px] font-bold text-[#0f2a44] bg-[#0f2a44]/10 px-1.5 py-0.5 rounded">{step.cost}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Contested */}
              <div>
                <p className="text-xs font-bold text-red-700 mb-3 flex items-center gap-1"><AlertCircle size={12} />{lang === 'es' ? 'Con oposición (scenario LIDL)' : 'Contested (LIDL scenario)'}</p>
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-[10px] text-red-800 space-y-1.5">
                  {[
                    { k: lang === 'es' ? 'Examen formal:' : 'Formal exam:', v: lang === 'es' ? '1–3 meses' : '1–3 months' },
                    { k: lang === 'es' ? 'Publicación en Gaceta:' : 'Gazette publication:', v: lang === 'es' ? '10–14 meses' : '10–14 months' },
                    { k: lang === 'es' ? 'Oposición de LIDL:' : 'LIDL opposition:', v: lang === 'es' ? 'Esperada — 1 mes desde pub.' : 'Expected — 1 month from pub.' },
                    { k: lang === 'es' ? 'Examen de oposición:' : 'Opposition exam:', v: lang === 'es' ? '6–18 meses adicionales' : '6–18 additional months' },
                    { k: lang === 'es' ? 'Probable resultado:' : 'Likely outcome:', v: lang === 'es' ? 'NEGATIVA (Art. 173 Fr. XVIII)' : 'REFUSAL (Art. 173 Fr. XVIII)' },
                    { k: lang === 'es' ? 'Costo de defensa:' : 'Defense cost:', v: 'USD $3,000–15,000+' },
                  ].map((row, i) => (
                    <div key={i} className="flex gap-2">
                      <span className="font-bold w-36 flex-shrink-0">{row.k}</span>
                      <span>{row.v}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl p-3 text-[10px] text-amber-800">
                  <p className="font-bold mb-1">{lang === 'es' ? 'Nota sobre cuotas IMPI:' : 'Note on IMPI fees:'}</p>
                  <p>{lang === 'es' ? 'Las cuotas se actualizan anualmente conforme al UMA. El monto de MXN $3,055 es orientativo. Verificar en gob.mx antes de presentar.' : 'Fees are updated annually based on the UMA unit. MXN $3,055 is indicative. Verify at gob.mx before filing.'}</p>
                </div>
              </div>
            </div>
          </div>
        </CollapsibleSection>

        {/* ── § 16  Domains ── */}
        <CollapsibleSection
          title={lang === 'es' ? '§16. Disponibilidad de Dominios' : '§16. Domain Availability'}
          subtitle={lang === 'es' ? 'México primero (.com.mx, .mx), luego .com, .ai, y otros.' : 'Mexico first (.com.mx, .mx), then .com, .ai, and others.'}
        >
          <div className="px-5 py-4">
            <div className="space-y-1">
              {data.domains.map(d => (
                <div key={d.domain} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                  <span className="text-xs font-mono text-gray-700">{d.domain}</span>
                  <div className="flex items-center gap-2">
                    {d.status === 'available' && (
                      <>
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1"><CheckCircle2 size={9} />{lang === 'es' ? 'Disponible' : 'Available'}</span>
                        <button type="button" className="text-[9px] font-bold text-[#e07a3f] hover:underline">{lang === 'es' ? 'Registrar →' : 'Register →'}</button>
                      </>
                    )}
                    {d.status === 'taken' && <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full flex items-center gap-1"><X size={9} />{lang === 'es' ? 'No disponible' : 'Taken'}</span>}
                    {d.status === 'unknown' && <span className="text-[10px] font-bold text-gray-500 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-full">{lang === 'es' ? 'Desconocido' : 'Unknown'}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CollapsibleSection>

        {/* ── § 17  Methodology & disclaimer ── */}
        <CollapsibleSection
          title={lang === 'es' ? '§17. Metodología y Avisos Legales' : '§17. Methodology & Disclaimers'}
        >
          <div className="px-5 py-4 space-y-4 text-xs text-gray-600">
            <div>
              <p className="font-bold text-gray-800 mb-1">{lang === 'es' ? 'Fuentes de datos' : 'Data sources'}</p>
              <ul className="space-y-0.5 list-disc list-inside text-gray-500">
                {['MARCia — base de datos pública del IMPI (Instituto Mexicano de la Propiedad Industrial)', 'Gaceta de la Propiedad Industrial (IMPI)', 'Registro de INDAUTOR', 'WIPO Global Brand Database', 'Análisis asistido por IA (modelo de lenguaje de gran escala)'].map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
            <div>
              <p className="font-bold text-gray-800 mb-1">{lang === 'es' ? 'Metodología' : 'Methodology'}</p>
              <p className="text-gray-500 leading-relaxed">
                {lang === 'es'
                  ? 'La confundibilidad se evalúa conforme a LFPPI Arts. 171–174 mediante criterios de similitud fonética, gráfica y conceptual, identidad de productos, elemento dominante, consumidor medio y saturación del campo. La puntuación de registrabilidad (0–100) pondera: distintividad inherente (30%), disponibilidad registral (35%), saturación del campo (20%) y cumplimiento del Art. 173 (15%). Las alternativas de marca se generan mediante búsqueda en el corpus MARCia para la misma clase y productos.'
                  : 'Confusability is assessed under LFPPI Arts. 171–174 using phonetic, visual, and conceptual similarity criteria, product identity, dominant element doctrine, relevant consumer profile, and field saturation. The registrability score (0–100) weights: inherent distinctiveness (30%), registry availability (35%), field saturation (20%), and Art. 173 compliance (15%). Mark alternatives are generated by searching the MARCia corpus for the same class and goods.'}
              </p>
            </div>
            <div>
              <p className="font-bold text-gray-800 mb-1">{lang === 'es' ? 'Limitaciones' : 'Limitations'}</p>
              <ul className="space-y-0.5 list-disc list-inside text-gray-500">
                {(lang === 'es' ? [
                  'El análisis IA puede no detectar todas las marcas conflictivas.',
                  'Solo incluye datos disponibles a la fecha de búsqueda.',
                  'Las cuotas IMPI se actualizan anualmente.',
                  'El WIPO Global Brand Database puede tener cobertura incompleta.',
                ] : [
                  'AI analysis may not detect all conflicting marks.',
                  'Only includes data available as of the search date.',
                  'IMPI fees are updated annually.',
                  'WIPO Global Brand Database may have incomplete coverage.',
                ]).map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <div className="flex items-start gap-2">
                <Info size={13} className="text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 leading-relaxed">
                  <strong>{lang === 'es' ? 'Aviso legal: ' : 'Legal notice: '}</strong>
                  {lang === 'es'
                    ? 'Análisis preliminar asistido por IA. No sustituye la revisión por un abogado mexicano de propiedad industrial antes de presentar una solicitud. Mexico Trademark Center no es un despacho de abogados.'
                    : 'Preliminary AI-assisted analysis. Not a substitute for review by a licensed Mexican IP attorney before filing. Mexico Trademark Center is not a law firm.'}
                </p>
              </div>
            </div>
          </div>
        </CollapsibleSection>

        {/* Bottom CTA */}
        <div className="rounded-2xl bg-[#0f2a44] px-6 py-6 flex items-start justify-between gap-4 flex-wrap shadow-xl print:hidden">
          <div>
            <p className="text-white font-bold text-base mb-1">{lang === 'es' ? '¿Necesitas orientación experta?' : 'Need expert guidance?'}</p>
            <p className="text-white/70 text-sm">{lang === 'es' ? 'Conecta con un abogado de PI mexicano certificado para una estrategia personalizada.' : 'Connect with a licensed Mexican IP attorney for a personalized strategy.'}</p>
          </div>
          <div className="flex items-center gap-3">
            <button type="button" className="inline-flex items-center gap-2 bg-[#e07a3f] hover:bg-[#c96830] text-white font-bold px-5 py-3 rounded-xl text-sm transition-colors">
              <FileText size={14} />
              {lang === 'es' ? 'Consultar abogado' : 'Consult attorney'}
              <ArrowRight size={14} />
            </button>
            <button type="button" className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold px-5 py-3 rounded-xl text-sm transition-colors">
              <Sparkles size={14} />
              {lang === 'es' ? 'Nueva búsqueda' : 'New search'}
            </button>
          </div>
        </div>

      </div>

      {/* Print stylesheet */}
      <style>{`
        @media print {
          body { font-size: 11px; }
          .print\\:hidden { display: none !important; }
          .print\\:bg-white { background: white !important; }
          .print\\:shadow-none { box-shadow: none !important; }
          .print\\:py-4 { padding-top: 1rem !important; padding-bottom: 1rem !important; }
          .print\\:space-y-4 > * + * { margin-top: 1rem !important; }
          details { break-inside: avoid; }
          h1, h2, .section-header { break-after: avoid; }
          @page { margin: 1.5cm; }
        }
      `}</style>
    </div>
  );
}
