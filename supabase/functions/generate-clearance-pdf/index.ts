import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { PDFDocument, rgb, StandardFonts, PDFFont, PDFPage } from "npm:pdf-lib@1.17.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// ─── Colors ──────────────────────────────────────────────────────────────────
const C = {
  darkGreen: rgb(0.102, 0.18, 0.102),   // #1a2e1a
  gold: rgb(0.788, 0.659, 0.298),        // #c9a84c
  white: rgb(1, 1, 1),
  black: rgb(0, 0, 0),
  gray: rgb(0.4, 0.4, 0.4),
  lightGray: rgb(0.92, 0.92, 0.90),
  red: rgb(0.78, 0.18, 0.18),
  amber: rgb(0.85, 0.55, 0.1),
  green: rgb(0.15, 0.55, 0.15),
  blue: rgb(0.1, 0.35, 0.7),
};

const PAGE_W = 612;  // US Letter
const PAGE_H = 792;
const MARGIN = 56;
const CONTENT_W = PAGE_W - MARGIN * 2;

// ─── Types ───────────────────────────────────────────────────────────────────
interface DupontFactor {
  factor: string;
  verdict: string;
  reasoning: string;
  reasoning_en?: string;
}
interface DistinctivenessAssessment {
  tier: string;
  score: number;
  explanation: string;
  explanation_en?: string;
}
interface RegistrabilityFlag {
  category: string;
  severity: string;
  explanation: string;
  explanation_en?: string;
}
interface MarciaFinding { name: string; status: string; classNum: string; holder: string; }
interface DomainResult { domain: string; status: string; }
interface TranslationFlag {
  languageCode: string;
  languageName: string;
  translatedForm: string;
  risk: "none" | "low" | "medium" | "high";
  issueCategory: string | null;
  details: string;
  details_en: string;
}

interface ClearanceResult {
  risk: "low" | "medium" | "high";
  riskSummary?: string;
  riskSummary_en?: string;
  searchLanguage?: string;
  distinctiveness?: DistinctivenessAssessment;
  dupont?: DupontFactor[];
  registrabilityFlags?: RegistrabilityFlag[];
  marciaFindings?: MarciaFinding[];
  marciaTotalCount?: number;
  marciaUrl?: string;
  webFindings?: string[];
  domainResults?: DomainResult[];
  translationAnalysis?: TranslationFlag[];
  disclaimer?: string;
}

// ─── Section labels (native-language translations) ───────────────────────────
type Lang = "en" | "es" | "zh" | "de" | "fr" | "hi" | "pt" | "ja";

const L: Record<string, Record<Lang, string>> = {
  coverTitle: {
    en: "TRADEMARK CLEARANCE REPORT",
    es: "INFORME DE DISPONIBILIDAD DE MARCA",
    zh: "商标检索报告",
    de: "MARKENRECHERCHE-BERICHT",
    fr: "RAPPORT DE DISPONIBILITE DE MARQUE",
    hi: "TRADEMARK CLEARANCE REPORT",
    pt: "RELATORIO DE DISPONIBILIDADE DE MARCA",
    ja: "TRADEMARK CLEARANCE REPORT",
  },
  coverSubtitle: {
    en: "AI-Assisted Preliminary Clearance Analysis",
    es: "Analisis Preliminar de Disponibilidad Asistido por IA",
    zh: "AI辅助初步检索分析",
    de: "KI-gestuetzte vorlaeufige Rechercheanalyse",
    fr: "Analyse preliminaire de disponibilite assistee par IA",
    hi: "AI-Assisted Preliminary Clearance Analysis",
    pt: "Analise preliminar de disponibilidade assistida por IA",
    ja: "AI-Assisted Preliminary Clearance Analysis",
  },
  proposedTrademark: {
    en: "PROPOSED TRADEMARK",
    es: "MARCA PROPUESTA",
    zh: "拟注册商标",
    de: "VORGESCHLAGENE MARKE",
    fr: "MARQUE PROPOSEE",
    hi: "PROPOSED TRADEMARK",
    pt: "MARCA PROPOSTA",
    ja: "PROPOSED TRADEMARK",
  },
  goodsServices: {
    en: "GOODS / SERVICES COVERED",
    es: "PRODUCTOS / SERVICIOS CUBIERTOS",
    zh: "涵盖的商品/服务",
    de: "WAREN / DIENSTLEISTUNGEN",
    fr: "PRODUITS / SERVICES COUVERTS",
    hi: "GOODS / SERVICES COVERED",
    pt: "BENS / SERVICOS COBERTOS",
    ja: "GOODS / SERVICES COVERED",
  },
  overallRisk: {
    en: "OVERALL RISK LEVEL",
    es: "NIVEL DE RIESGO GENERAL",
    zh: "总体风险级别",
    de: "GESAMTRISIKOSTUFE",
    fr: "NIVEAU DE RISQUE GLOBAL",
    hi: "OVERALL RISK LEVEL",
    pt: "NIVEL DE RISCO GERAL",
    ja: "OVERALL RISK LEVEL",
  },
  riskHigh: {
    en: "HIGH RISK",
    es: "RIESGO ALTO",
    zh: "高风险",
    de: "HOHES RISIKO",
    fr: "RISQUE ELEVE",
    hi: "HIGH RISK",
    pt: "ALTO RISCO",
    ja: "HIGH RISK",
  },
  riskMedium: {
    en: "MEDIUM RISK",
    es: "RIESGO MEDIO",
    zh: "中等风险",
    de: "MITTLERES RISIKO",
    fr: "RISQUE MODERE",
    hi: "MEDIUM RISK",
    pt: "RISCO MEDIO",
    ja: "MEDIUM RISK",
  },
  riskLow: {
    en: "LOW RISK",
    es: "RIESGO BAJO",
    zh: "低风险",
    de: "NIEDRIGES RISIKO",
    fr: "RISQUE FAIBLE",
    hi: "LOW RISK",
    pt: "BAIXO RISCO",
    ja: "LOW RISK",
  },
  reportGenerated: {
    en: "Report Generated",
    es: "Reporte Generado",
    zh: "报告生成时间",
    de: "Bericht erstellt",
    fr: "Rapport genere",
    hi: "Report Generated",
    pt: "Relatorio Gerado",
    ja: "Report Generated",
  },
  orderRef: {
    en: "Order Reference",
    es: "Referencia de Orden",
    zh: "订单编号",
    de: "Bestellreferenz",
    fr: "Reference de commande",
    hi: "Order Reference",
    pt: "Referencia do Pedido",
    ja: "Order Reference",
  },
  reportType: {
    en: "Report Type",
    es: "Tipo de Reporte",
    zh: "报告类型",
    de: "Berichtstyp",
    fr: "Type de rapport",
    hi: "Report Type",
    pt: "Tipo de Relatorio",
    ja: "Report Type",
  },
  reportTypeValue: {
    en: "AI-Assisted Preliminary Clearance",
    es: "Disponibilidad Preliminar Asistida por IA",
    zh: "AI辅助初步检索",
    de: "KI-gestuetzte vorlaeufige Recherche",
    fr: "Disponibilite preliminaire assistee par IA",
    hi: "AI-Assisted Preliminary Clearance",
    pt: "Disponibilidade preliminar assistida por IA",
    ja: "AI-Assisted Preliminary Clearance",
  },
  importantDisclaimer: {
    en: "IMPORTANT DISCLAIMER",
    es: "AVISO LEGAL IMPORTANTE",
    zh: "重要免责声明",
    de: "WICHTIGER HAFTUNGSAUSSCHLUSS",
    fr: "AVERTISSEMENT IMPORTANT",
    hi: "IMPORTANT DISCLAIMER",
    pt: "AVISO LEGAL IMPORTANTE",
    ja: "IMPORTANT DISCLAIMER",
  },
  execSummary: {
    en: "EXECUTIVE SUMMARY",
    es: "RESUMEN EJECUTIVO",
    zh: "执行摘要",
    de: "ZUSAMMENFASSUNG",
    fr: "RESUME EXECUTIF",
    hi: "EXECUTIVE SUMMARY",
    pt: "RESUMO EXECUTIVO",
    ja: "EXECUTIVE SUMMARY",
  },
  riskAssessmentSummary: {
    en: "Risk Assessment Summary",
    es: "Resumen de Evaluacion de Riesgo",
    zh: "风险评估摘要",
    de: "Risikobewertungszusammenfassung",
    fr: "Resume d'evaluation des risques",
    hi: "Risk Assessment Summary",
    pt: "Resumo de Avaliacao de Risco",
    ja: "Risk Assessment Summary",
  },
  quickScorecard: {
    en: "Quick Scorecard",
    es: "Cuadro de Puntaje",
    zh: "快速评分",
    de: "Kurzuebersicht",
    fr: "Tableau de bord rapide",
    hi: "Quick Scorecard",
    pt: "Quadro de Pontuacao",
    ja: "Quick Scorecard",
  },
  distinctivenessTier: {
    en: "Distinctiveness Tier",
    es: "Nivel de Distintividad",
    zh: "显著性级别",
    de: "Unterscheidungskraftstufe",
    fr: "Niveau de distinctivite",
    hi: "Distinctiveness Tier",
    pt: "Nivel de Distintividade",
    ja: "Distinctiveness Tier",
  },
  dupontOutlook: {
    en: "DuPont Outlook (13 factors)",
    es: "Perspectiva DuPont (13 factores)",
    zh: "杜邦因素展望（13项）",
    de: "DuPont-Aussichten (13 Faktoren)",
    fr: "Analyse DuPont (13 facteurs)",
    hi: "DuPont Outlook (13 factors)",
    pt: "Perspectiva DuPont (13 fatores)",
    ja: "DuPont Outlook (13 factors)",
  },
  lfppiIssues: {
    en: "LFPPI Registrability Issues",
    es: "Problemas de Registrabilidad LFPPI",
    zh: "LFPPI可注册性问题",
    de: "LFPPI-Registrierbarkeitsprobleme",
    fr: "Problemes de registrabilite LFPPI",
    hi: "LFPPI Registrability Issues",
    pt: "Problemas de Registrabilidade LFPPI",
    ja: "LFPPI Registrability Issues",
  },
  noneDetected: {
    en: "None detected",
    es: "Ninguno detectado",
    zh: "未检测到",
    de: "Keine erkannt",
    fr: "Aucun detecte",
    hi: "None detected",
    pt: "Nenhum detectado",
    ja: "None detected",
  },
  marciaMatches: {
    en: "IMPI MARCia Matches",
    es: "Coincidencias IMPI MARCia",
    zh: "IMPI MARCia匹配数",
    de: "IMPI MARCia-Treffer",
    fr: "Correspondances IMPI MARCia",
    hi: "IMPI MARCia Matches",
    pt: "Correspondencias IMPI MARCia",
    ja: "IMPI MARCia Matches",
  },
  distinctivenessTitle: {
    en: "Section 1 - Distinctiveness Assessment",
    es: "Seccion 1 - Evaluacion de Distintividad",
    zh: "第1节 - 显著性评估",
    de: "Abschnitt 1 - Unterscheidungskraftbewertung",
    fr: "Section 1 - Evaluation de la distinctivite",
    hi: "Section 1 - Distinctiveness Assessment",
    pt: "Secao 1 - Avaliacao de Distintividade",
    ja: "Section 1 - Distinctiveness Assessment",
  },
  distinctivenessScore: {
    en: "Distinctiveness Score",
    es: "Puntuacion de Distintividad",
    zh: "显著性得分",
    de: "Unterscheidungskraft-Score",
    fr: "Score de distinctivite",
    hi: "Distinctiveness Score",
    pt: "Pontuacao de Distintividade",
    ja: "Distinctiveness Score",
  },
  whatThisMeans: {
    en: "What this means:",
    es: "Que significa esto:",
    zh: "含义：",
    de: "Was das bedeutet:",
    fr: "Ce que cela signifie :",
    hi: "What this means:",
    pt: "O que isso significa:",
    ja: "What this means:",
  },
  trademarkSpectrum: {
    en: "Trademark Distinctiveness Spectrum",
    es: "Espectro de Distintividad de Marca",
    zh: "商标显著性谱系",
    de: "Marken-Unterscheidungskraft-Spektrum",
    fr: "Spectre de distinctivite des marques",
    hi: "Trademark Distinctiveness Spectrum",
    pt: "Espectro de Distintividade de Marca",
    ja: "Trademark Distinctiveness Spectrum",
  },
  dupontTitle: {
    en: "Section 2 - DuPont Likelihood-of-Confusion Analysis (13 Factors)",
    es: "Seccion 2 - Analisis DuPont de Confusion (13 Factores)",
    zh: "第2节 - 杜邦混淆可能性分析（13项因素）",
    de: "Abschnitt 2 - DuPont-Verwechslungsanalyse (13 Faktoren)",
    fr: "Section 2 - Analyse DuPont (13 facteurs)",
    hi: "Section 2 - DuPont Likelihood-of-Confusion Analysis (13 Factors)",
    pt: "Secao 2 - Analise DuPont (13 Fatores)",
    ja: "Section 2 - DuPont Likelihood-of-Confusion Analysis (13 Factors)",
  },
  dupontCont: {
    en: "Section 2 - DuPont Analysis (continued)",
    es: "Seccion 2 - Analisis DuPont (continuacion)",
    zh: "第2节 - 杜邦分析（续）",
    de: "Abschnitt 2 - DuPont-Analyse (Fortsetzung)",
    fr: "Section 2 - Analyse DuPont (suite)",
    hi: "Section 2 - DuPont Analysis (continued)",
    pt: "Secao 2 - Analise DuPont (continuacao)",
    ja: "Section 2 - DuPont Analysis (continued)",
  },
  lfppiTitle: {
    en: "Section 3 - LFPPI Registrability Analysis",
    es: "Seccion 3 - Analisis de Registrabilidad LFPPI",
    zh: "第3节 - LFPPI可注册性分析",
    de: "Abschnitt 3 - LFPPI-Registrierbarkeitsanalyse",
    fr: "Section 3 - Analyse de registrabilite LFPPI",
    hi: "Section 3 - LFPPI Registrability Analysis",
    pt: "Secao 3 - Analise de Registrabilidade LFPPI",
    ja: "Section 3 - LFPPI Registrability Analysis",
  },
  lfppiSubtitle: {
    en: "Evaluation against Mexico's Ley Federal de Proteccion a la Propiedad Industrial (LFPPI)",
    es: "Evaluacion frente a la Ley Federal de Proteccion a la Propiedad Industrial de Mexico (LFPPI)",
    zh: "依据墨西哥《联邦工业产权保护法》（LFPPI）评估",
    de: "Bewertung nach Mexikos LFPPI",
    fr: "Evaluation selon la LFPPI mexicaine",
    hi: "Evaluation against Mexico's Ley Federal de Proteccion a la Propiedad Industrial (LFPPI)",
    pt: "Avaliacao conforme a LFPPI mexicana",
    ja: "Evaluation against Mexico's LFPPI",
  },
  noLfppiIssues: {
    en: "No absolute grounds for refusal detected under the LFPPI.",
    es: "No se detectaron causales absolutas de negativa bajo la LFPPI.",
    zh: "未检测到LFPPI项下的绝对驳回事由。",
    de: "Keine absoluten Verweigerungsgruende nach LFPPI festgestellt.",
    fr: "Aucune cause absolue de refus detectable sous la LFPPI.",
    hi: "No absolute grounds for refusal detected under the LFPPI.",
    pt: "Nenhuma causa absoluta de recusa detectada sob a LFPPI.",
    ja: "No absolute grounds for refusal detected under the LFPPI.",
  },
  noLfppiSub: {
    en: "The mark does not appear to trigger any of the 13 LFPPI absolute refusal grounds.",
    es: "La marca no parece activar ninguna de las 13 causales de negativa absoluta de la LFPPI.",
    zh: "该商标似乎未触及LFPPI的13项绝对驳回事由中的任何一项。",
    de: "Die Marke scheint keinen der 13 absoluten Verweigerungsgruende der LFPPI auszuloesen.",
    fr: "La marque ne semble pas declencher l'un des 13 motifs absolus de refus de la LFPPI.",
    hi: "The mark does not appear to trigger any of the 13 LFPPI absolute refusal grounds.",
    pt: "A marca nao parece acionar nenhum dos 13 fundamentos absolutos de recusa da LFPPI.",
    ja: "The mark does not appear to trigger any of the 13 LFPPI absolute refusal grounds.",
  },
  translationTitle: {
    en: "Section 4 - Translation & Transliteration Analysis",
    es: "Seccion 4 - Analisis de Traduccion y Transliteracion",
    zh: "第4节 - 翻译与音译分析",
    de: "Abschnitt 4 - Uebersetzungs- und Transliterationsanalyse",
    fr: "Section 4 - Analyse de traduction et translitteration",
    hi: "Section 4 - Translation & Transliteration Analysis",
    pt: "Secao 4 - Analise de Traducao e Transliteracao",
    ja: "Section 4 - Translation & Transliteration Analysis",
  },
  translationSubtitle: {
    en: "Cross-language trademark conflict check across 8 languages",
    es: "Verificacion de conflictos en 8 idiomas",
    zh: "跨8种语言的商标冲突检查",
    de: "Sprachuebergreifende Markenkonfliktpruefung in 8 Sprachen",
    fr: "Verification des conflits dans 8 langues",
    hi: "Cross-language trademark conflict check across 8 languages",
    pt: "Verificacao de conflitos em 8 idiomas",
    ja: "Cross-language trademark conflict check across 8 languages",
  },
  noTranslationConflicts: {
    en: "No translation or transliteration conflicts detected across all 8 languages.",
    es: "No se detectaron conflictos de traduccion o transliteracion en los 8 idiomas.",
    zh: "在全部8种语言中均未检测到翻译或音译冲突。",
    de: "Keine Uebersetzungs- oder Transliterationskonflikte in 8 Sprachen gefunden.",
    fr: "Aucun conflit de traduction ou translitteration detecte dans les 8 langues.",
    hi: "No translation or transliteration conflicts detected across all 8 languages.",
    pt: "Nenhum conflito de traducao ou transliteracao detectado nos 8 idiomas.",
    ja: "No translation or transliteration conflicts detected across all 8 languages.",
  },
  translatedAs: {
    en: "Translated/Transliterated as",
    es: "Traducido/Transliterado como",
    zh: "翻译/音译为",
    de: "Uebersetzt/Transliteriert als",
    fr: "Traduit/Translittere en",
    hi: "Translated/Transliterated as",
    pt: "Traduzido/Transliterado como",
    ja: "Translated/Transliterated as",
  },
  marciaTitle: {
    en: "Section 5 - Conflicting Registrations (IMPI MARCia)",
    es: "Seccion 5 - Registros Conflictivos (IMPI MARCia)",
    zh: "第5节 - 冲突注册（IMPI MARCia）",
    de: "Abschnitt 5 - Kollidierende Marken (IMPI MARCia)",
    fr: "Section 5 - Enregistrements conflictuels (IMPI MARCia)",
    hi: "Section 5 - Conflicting Registrations (IMPI MARCia)",
    pt: "Secao 5 - Registros Conflitantes (IMPI MARCia)",
    ja: "Section 5 - Conflicting Registrations (IMPI MARCia)",
  },
  totalMarciaMatches: {
    en: "Total matches found in IMPI MARCia database",
    es: "Total de coincidencias en la base de datos IMPI MARCia",
    zh: "IMPI MARCia数据库中的匹配总数",
    de: "Gesamttreffer in IMPI MARCia-Datenbank",
    fr: "Total de correspondances dans la base MARCia",
    hi: "Total matches found in IMPI MARCia database",
    pt: "Total de correspondencias na base de dados IMPI MARCia",
    ja: "Total matches found in IMPI MARCia database",
  },
  noMarciaFindings: {
    en: "No matching marks found in the MARCia database for the searched classes.",
    es: "No se encontraron marcas coincidentes en la base de datos MARCia para las clases buscadas.",
    zh: "在搜索的类别中，MARCia数据库中未找到匹配的商标。",
    de: "Keine uebereinstimmenden Marken in der MARCia-Datenbank fuer die gesuchten Klassen.",
    fr: "Aucune marque correspondante trouvee dans MARCia pour les classes recherchees.",
    hi: "No matching marks found in the MARCia database for the searched classes.",
    pt: "Nenhuma marca correspondente encontrada no MARCia para as classes pesquisadas.",
    ja: "No matching marks found in the MARCia database for the searched classes.",
  },
  webTitle: {
    en: "Section 6 - Web Presence Findings",
    es: "Seccion 6 - Hallazgos de Presencia Web",
    zh: "第6节 - 网络存在发现",
    de: "Abschnitt 6 - Web-Praesenz-Ergebnisse",
    fr: "Section 6 - Resultats de presence web",
    hi: "Section 6 - Web Presence Findings",
    pt: "Secao 6 - Resultados de Presenca Web",
    ja: "Section 6 - Web Presence Findings",
  },
  noWebFindings: {
    en: "No significant web presence findings for this mark.",
    es: "No se encontraron hallazgos significativos de presencia web para esta marca.",
    zh: "未发现该商标有显著的网络存在。",
    de: "Keine signifikanten Web-Praesenz-Funde fuer diese Marke.",
    fr: "Aucune presence web significative trouvee pour cette marque.",
    hi: "No significant web presence findings for this mark.",
    pt: "Nenhum resultado significativo de presenca web para esta marca.",
    ja: "No significant web presence findings for this mark.",
  },
  domainTitle: {
    en: "Section 7 - Domain Availability",
    es: "Seccion 7 - Disponibilidad de Dominios",
    zh: "第7节 - 域名可用性",
    de: "Abschnitt 7 - Domainverfuegbarkeit",
    fr: "Section 7 - Disponibilite des domaines",
    hi: "Section 7 - Domain Availability",
    pt: "Secao 7 - Disponibilidade de Dominios",
    ja: "Section 7 - Domain Availability",
  },
  noDomainCheck: {
    en: "Domain availability check was not performed.",
    es: "La verificacion de disponibilidad de dominios no fue realizada.",
    zh: "未执行域名可用性检查。",
    de: "Die Domainverfuegbarkeitspruefung wurde nicht durchgefuehrt.",
    fr: "La verification de disponibilite des domaines n'a pas ete effectuee.",
    hi: "Domain availability check was not performed.",
    pt: "A verificacao de disponibilidade de dominios nao foi realizada.",
    ja: "Domain availability check was not performed.",
  },
  available: {
    en: "Available", es: "Disponible", zh: "可用", de: "Verfuegbar", fr: "Disponible", hi: "Available", pt: "Disponivel", ja: "Available",
  },
  taken: {
    en: "Taken", es: "Tomado", zh: "已占用", de: "Vergeben", fr: "Pris", hi: "Taken", pt: "Ocupado", ja: "Taken",
  },
  unknown: {
    en: "Unknown", es: "Desconocido", zh: "未知", de: "Unbekannt", fr: "Inconnu", hi: "Unknown", pt: "Desconhecido", ja: "Unknown",
  },
  favors: {
    en: "FAVORS", es: "FAVORABLE", zh: "有利", de: "GUENSTIG", fr: "FAVORABLE", hi: "FAVORS", pt: "FAVORAVEL", ja: "FAVORS",
  },
  against: {
    en: "AGAINST", es: "DESFAVORABLE", zh: "不利", de: "UNGUENSTIG", fr: "DEFAVORABLE", hi: "AGAINST", pt: "CONTRA", ja: "AGAINST",
  },
  neutral: {
    en: "NEUTRAL", es: "NEUTRO", zh: "中立", de: "NEUTRAL", fr: "NEUTRE", hi: "NEUTRAL", pt: "NEUTRO", ja: "NEUTRAL",
  },
  source: {
    en: "Source", es: "Fuente", zh: "来源", de: "Quelle", fr: "Source", hi: "Source", pt: "Fonte", ja: "Source",
  },
  markName: {
    en: "Mark Name", es: "Nombre de Marca", zh: "商标名称", de: "Markenname", fr: "Nom de la marque", hi: "Mark Name", pt: "Nome da Marca", ja: "Mark Name",
  },
  class_: {
    en: "Class", es: "Clase", zh: "类别", de: "Klasse", fr: "Classe", hi: "Class", pt: "Classe", ja: "Class",
  },
  status: {
    en: "Status", es: "Estado", zh: "状态", de: "Status", fr: "Statut", hi: "Status", pt: "Status", ja: "Status",
  },
  holder: {
    en: "Holder", es: "Titular", zh: "持有人", de: "Inhaber", fr: "Titulaire", hi: "Holder", pt: "Titular", ja: "Holder",
  },
  domain: {
    en: "Domain", es: "Dominio", zh: "域名", de: "Domain", fr: "Domaine", hi: "Domain", pt: "Dominio", ja: "Domain",
  },
  language: {
    en: "Language", es: "Idioma", zh: "语言", de: "Sprache", fr: "Langue", hi: "Language", pt: "Idioma", ja: "Language",
  },
  risk_: {
    en: "Risk", es: "Riesgo", zh: "风险", de: "Risiko", fr: "Risque", hi: "Risk", pt: "Risco", ja: "Risk",
  },
  issue: {
    en: "Issue", es: "Problema", zh: "问题", de: "Problem", fr: "Probleme", hi: "Issue", pt: "Problema", ja: "Issue",
  },
  dupontNote: {
    en: "Based on In re E.I. DuPont DeNemours & Co. (1973), applied to Mexican trademark law.",
    es: "Basado en In re E.I. DuPont DeNemours & Co. (1973), aplicado a la ley de marcas mexicana.",
    zh: "基于In re E.I. DuPont DeNemours & Co.（1973年），应用于墨西哥商标法。",
    de: "Basierend auf In re E.I. DuPont DeNemours & Co. (1973), angepasst an mexikanisches Markenrecht.",
    fr: "Base sur In re E.I. DuPont DeNemours & Co. (1973), applique au droit des marques mexicain.",
    hi: "Based on In re E.I. DuPont DeNemours & Co. (1973), applied to Mexican trademark law.",
    pt: "Baseado em In re E.I. DuPont DeNemours & Co. (1973), aplicado ao direito de marcas mexicano.",
    ja: "Based on In re E.I. DuPont DeNemours & Co. (1973), applied to Mexican trademark law.",
  },
  issueCount: {
    en: "issue(s)",
    es: "problema(s)",
    zh: "个问题",
    de: "Problem(e)",
    fr: "probleme(s)",
    hi: "issue(s)",
    pt: "problema(s)",
    ja: "issue(s)",
  },
  highSeverity: {
    en: "high", es: "alto", zh: "高", de: "hoch", fr: "eleve", hi: "high", pt: "alto", ja: "high",
  },
  medSeverity: {
    en: "medium", es: "medio", zh: "中", de: "mittel", fr: "modere", hi: "medium", pt: "medio", ja: "medium",
  },
  // English-language section divider for bilingual reports
  englishSection: {
    en: "ENGLISH VERSION",
    es: "ENGLISH VERSION",
    zh: "ENGLISH VERSION",
    de: "ENGLISH VERSION",
    fr: "ENGLISH VERSION",
    hi: "ENGLISH VERSION",
    pt: "ENGLISH VERSION",
    ja: "ENGLISH VERSION",
  },
  nativeSection: {
    en: "ENGLISH VERSION",
    es: "VERSION EN ESPANOL",
    zh: "中文版本",
    de: "DEUTSCHE VERSION",
    fr: "VERSION FRANCAISE",
    hi: "HINDI VERSION",
    pt: "VERSAO EM PORTUGUES",
    ja: "JAPANESE VERSION",
  },
};

function lbl(key: string, lang: Lang): string {
  return L[key]?.[lang] ?? L[key]?.["en"] ?? key;
}

// ─── Label maps ──────────────────────────────────────────────────────────────
const DUPONT_EN: Record<string, string> = {
  similarity_of_marks: "Similarity of Marks",
  relatedness_of_goods: "Relatedness of Goods/Services",
  channels_of_trade: "Channels of Trade",
  purchasing_conditions: "Purchaser Sophistication",
  strength_of_cited_mark: "Strength of Cited Mark",
  actual_confusion: "Actual Confusion",
  number_of_similar_marks: "Crowding of Similar Marks",
  length_of_use: "Length of Use",
  variety_of_goods: "Variety of Goods Covered",
  market_interface: "Market Interface / Consent",
  right_to_exclude: "Right to Exclude Others",
  extent_of_confusion: "Extent of Potential Confusion",
  other_factors: "Other Relevant Factors",
};

const CATEGORY_EN: Record<string, string> = {
  generic_descriptive: "Generic or Descriptive",
  functional_shape: "Functional Shape",
  deceptive: "Deceptive or Misleading",
  official_emblems: "Official Emblems / Flags",
  personal_identity: "Personal Identity Without Consent",
  confusingly_similar: "Confusingly Similar to Existing Mark",
  famous_mark: "Famous or Notorious Mark",
  protected_characters: "Protected Characters / Titles",
  geographic_indication: "Protected Geographic Indication",
  immoral_offensive: "Contrary to Public Order / Morality",
  isolated_color: "Isolated Color (Not Distinctive)",
  non_distinctive_nontrad: "Non-Distinctive Non-Traditional Mark",
  bad_faith: "Bad Faith Filing",
};

// ─── Text helpers ─────────────────────────────────────────────────────────────

// Helvetica (WinAnsi encoding) cannot render characters outside Latin-1 supplement.
// Normalize to closest ASCII equivalent to prevent pdf-lib from throwing.
function safeText(text: string): string {
  return text
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d\u201e\u201f]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u2026/g, '...')
    .replace(/[^\x00-\xFF]/g, '?')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // strip markdown links
    .replace(/[()[\]]/g, ' ')
    .replace(/  +/g, ' ')
    .trim();
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  text = safeText(text);
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(test, size) <= maxWidth) {
      current = test;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function drawWrappedText(
  page: PDFPage,
  text: string,
  x: number,
  y: number,
  font: PDFFont,
  size: number,
  maxWidth: number,
  color = C.black,
  lineHeight = size * 1.5,
): number {
  const lines = wrapText(safeText(text), font, size, maxWidth);
  for (const line of lines) {
    page.drawText(line, { x, y, size, font, color });
    y -= lineHeight;
  }
  return y;
}

// ─── Page scaffold ────────────────────────────────────────────────────────────

function addFooter(page: PDFPage, font: PDFFont, orderId: string, pageNum: number, totalPages: number, timestamp: string) {
  const shortId = orderId.slice(0, 8).toUpperCase();
  page.drawLine({ start: { x: MARGIN, y: 42 }, end: { x: PAGE_W - MARGIN, y: 42 }, thickness: 0.5, color: C.lightGray });
  page.drawText(`Mexico Trademark Center | NOT LEGAL ADVICE | Order: ${shortId} | ${timestamp}`, { x: MARGIN, y: 28, size: 7, font, color: C.gray });
  page.drawText(`Page ${pageNum} of ${totalPages}`, { x: PAGE_W - MARGIN - 48, y: 28, size: 7, font, color: C.gray });
}

function addSectionHeader(page: PDFPage, bold: PDFFont, title: string, y: number): number {
  page.drawRectangle({ x: MARGIN, y: y - 4, width: CONTENT_W, height: 22, color: C.darkGreen });
  page.drawText(safeText(title).toUpperCase(), { x: MARGIN + 10, y: y + 3, size: 9, font: bold, color: C.gold });
  return y - 32;
}

// ─── Section renderers ────────────────────────────────────────────────────────

function renderDistinctivenessSection(
  pdfDoc: PDFDocument, pages: PDFPage[], bold: PDFFont, regular: PDFFont,
  d: DistinctivenessAssessment, lang: Lang, useEnglish: boolean, sectionNum: number,
) {
  const p = pdfDoc.addPage([PAGE_W, PAGE_H]);
  pages.push(p);
  let y = PAGE_H - MARGIN;

  const title = useEnglish
    ? `Section ${sectionNum} - Distinctiveness Assessment`
    : safeText(lbl("distinctivenessTitle", lang));
  y = addSectionHeader(p, bold, title, y);
  y -= 10;

  const tiers = ["Generic", "Descriptive", "Suggestive", "Arbitrary", "Fanciful"];
  const tierColors = [C.red, C.amber, rgb(0.8, 0.6, 0.1), C.green, C.darkGreen];
  const tierW = CONTENT_W / 5;
  for (let i = 0; i < 5; i++) {
    const isActive = tiers[i].toLowerCase() === d.tier.toLowerCase();
    p.drawRectangle({ x: MARGIN + i * tierW, y: y - 24, width: tierW - 2, height: 28, color: isActive ? tierColors[i] : C.lightGray });
    const label = tiers[i].slice(0, 10);
    const lw = regular.widthOfTextAtSize(label, 8);
    p.drawText(label, { x: MARGIN + i * tierW + (tierW - lw) / 2, y: y - 12, size: 8, font: isActive ? bold : regular, color: isActive ? C.white : C.gray });
  }
  y -= 44;

  const scoreLabel = useEnglish ? "Distinctiveness Score" : safeText(lbl("distinctivenessScore", lang));
  p.drawText(`${scoreLabel}: ${d.score}/5`, { x: MARGIN, y, size: 11, font: bold, color: C.darkGreen });
  y -= 18;
  p.drawRectangle({ x: MARGIN, y: y - 10, width: CONTENT_W, height: 10, color: C.lightGray });
  const scoreColor = d.score <= 1 ? C.red : d.score <= 2 ? C.amber : d.score <= 3 ? rgb(0.8, 0.6, 0.1) : d.score <= 4 ? C.green : C.darkGreen;
  p.drawRectangle({ x: MARGIN, y: y - 10, width: (d.score / 5) * CONTENT_W, height: 10, color: scoreColor });
  y -= 24;

  const meansLabel = useEnglish ? "What this means:" : safeText(lbl("whatThisMeans", lang));
  p.drawText(meansLabel, { x: MARGIN, y, size: 10, font: bold, color: C.darkGreen });
  y -= 16;

  const explanationText = useEnglish ? (d.explanation_en ?? d.explanation) : d.explanation;
  y = drawWrappedText(p, explanationText || "", MARGIN, y, regular, 10, CONTENT_W, C.black);
  y -= 20;

  const tierExplanations: Array<[string, string]> = [
    ["Generic", "The word is the common name for the goods/services. Virtually impossible to register."],
    ["Descriptive", "Describes a characteristic of the goods/services. Requires acquired distinctiveness to register."],
    ["Suggestive", "Suggests a quality without directly describing it. Registrable, but weaker protection."],
    ["Arbitrary", "A real word with no logical connection to the goods/services. Strong protection."],
    ["Fanciful", "An invented word with no prior meaning. Strongest possible trademark protection."],
  ];

  const spectrumLabel = useEnglish ? "Trademark Distinctiveness Spectrum" : safeText(lbl("trademarkSpectrum", lang));
  p.drawText(spectrumLabel, { x: MARGIN, y, size: 10, font: bold, color: C.darkGreen });
  y -= 16;
  for (const [tier, exp] of tierExplanations) {
    const isActive = tier.toLowerCase() === d.tier.toLowerCase();
    if (isActive) {
      p.drawRectangle({ x: MARGIN, y: y - 4, width: CONTENT_W, height: 36, color: rgb(0.9, 0.96, 0.9) });
      p.drawText(">> " + tier + " (Your mark)", { x: MARGIN + 8, y: y + 8, size: 9, font: bold, color: C.darkGreen });
    } else {
      p.drawText("  " + tier, { x: MARGIN + 8, y: y + 8, size: 9, font: bold, color: C.gray });
    }
    y = drawWrappedText(p, "   " + exp, MARGIN + 8, y - 4, regular, 9, CONTENT_W - 16, isActive ? C.darkGreen : C.gray);
    y -= 4;
  }
}

function renderDupontSection(
  pdfDoc: PDFDocument, pages: PDFPage[], bold: PDFFont, regular: PDFFont,
  factors: DupontFactor[], lang: Lang, useEnglish: boolean, sectionNum: number,
) {
  let p = pdfDoc.addPage([PAGE_W, PAGE_H]);
  pages.push(p);
  let y = PAGE_H - MARGIN;

  const title = useEnglish
    ? `Section ${sectionNum} - DuPont Likelihood-of-Confusion Analysis (13 Factors)`
    : safeText(lbl("dupontTitle", lang));
  y = addSectionHeader(p, bold, title, y);
  y -= 6;

  const noteText = useEnglish ? lbl("dupontNote", "en") : safeText(lbl("dupontNote", lang));
  p.drawText(safeText(noteText), { x: MARGIN, y, size: 8, font: regular, color: C.gray });
  y -= 24;

  for (let i = 0; i < factors.length; i++) {
    const f = factors[i];
    const verdictColor = f.verdict === "favors_registration" ? C.green : f.verdict === "against_registration" ? C.red : C.amber;
    const verdictLabel = useEnglish
      ? (f.verdict === "favors_registration" ? "FAVORS" : f.verdict === "against_registration" ? "AGAINST" : "NEUTRAL")
      : safeText(lbl(f.verdict === "favors_registration" ? "favors" : f.verdict === "against_registration" ? "against" : "neutral", lang));
    const label = DUPONT_EN[f.factor] ?? f.factor;

    if (y < 120) {
      p = pdfDoc.addPage([PAGE_W, PAGE_H]);
      pages.push(p);
      y = PAGE_H - MARGIN;
      const contTitle = useEnglish
        ? `Section ${sectionNum} - DuPont Analysis (continued)`
        : safeText(lbl("dupontCont", lang));
      y = addSectionHeader(p, bold, contTitle, y);
      y -= 10;
    }

    const reasoningText = useEnglish ? (f.reasoning_en ?? f.reasoning) : f.reasoning;
    const rowLines = wrapText(reasoningText || "", regular, 9, CONTENT_W - 90);
    const rowH = Math.max(38, rowLines.length * 14 + 18);

    p.drawRectangle({ x: MARGIN, y: y - rowH + 10, width: CONTENT_W, height: rowH, color: i % 2 === 0 ? C.lightGray : C.white });
    p.drawText(`${i + 1}. ${label}`, { x: MARGIN + 8, y: y - 4, size: 9, font: bold, color: C.darkGreen });
    p.drawRectangle({ x: PAGE_W - MARGIN - 60, y: y - 20, width: 56, height: 16, color: verdictColor });
    p.drawText(verdictLabel, { x: PAGE_W - MARGIN - 56, y: y - 14, size: 7, font: bold, color: C.white });

    let ry = y - 18;
    for (const line of rowLines) {
      p.drawText(line, { x: MARGIN + 8, y: ry, size: 9, font: regular, color: C.black });
      ry -= 13;
    }
    y -= rowH + 4;
  }
}

function renderLfppiSection(
  pdfDoc: PDFDocument, pages: PDFPage[], bold: PDFFont, regular: PDFFont,
  flags: RegistrabilityFlag[], lang: Lang, useEnglish: boolean, sectionNum: number,
) {
  const p = pdfDoc.addPage([PAGE_W, PAGE_H]);
  pages.push(p);
  let y = PAGE_H - MARGIN;

  const title = useEnglish
    ? `Section ${sectionNum} - LFPPI Registrability Analysis`
    : safeText(lbl("lfppiTitle", lang));
  y = addSectionHeader(p, bold, title, y);
  y -= 8;

  const subtitleText = safeText(lbl("lfppiSubtitle", useEnglish ? "en" : lang));
  p.drawText(subtitleText, { x: MARGIN, y, size: 8, font: regular, color: C.gray });
  y -= 24;

  if (flags.length === 0) {
    p.drawRectangle({ x: MARGIN, y: y - 30, width: CONTENT_W, height: 40, color: rgb(0.9, 0.97, 0.9) });
    p.drawText(safeText(lbl("noLfppiIssues", useEnglish ? "en" : lang)), { x: MARGIN + 16, y: y - 8, size: 11, font: bold, color: C.green });
    p.drawText(safeText(lbl("noLfppiSub", useEnglish ? "en" : lang)), { x: MARGIN + 16, y: y - 22, size: 9, font: regular, color: C.green });
  } else {
    const sorted = [...flags].sort((a, b) => {
      const sv = { high: 0, medium: 1, low: 2 };
      return (sv[a.severity as "high" | "medium" | "low"] ?? 2) - (sv[b.severity as "high" | "medium" | "low"] ?? 2);
    });
    for (const flag of sorted) {
      const sColor = flag.severity === "high" ? C.red : flag.severity === "medium" ? C.amber : C.blue;
      const sLabel = flag.severity.toUpperCase();
      const catLabel = CATEGORY_EN[flag.category] ?? flag.category;
      const explanationText = useEnglish ? (flag.explanation_en ?? flag.explanation) : flag.explanation;
      const flagLines = wrapText(explanationText || "", regular, 9, CONTENT_W - 90);
      const flagH = Math.max(38, flagLines.length * 14 + 20);

      if (y - flagH < 80) break;

      p.drawRectangle({ x: MARGIN, y: y - flagH, width: CONTENT_W, height: flagH + 4, color: rgb(0.99, 0.97, 0.96), borderColor: sColor, borderWidth: 1 });
      p.drawRectangle({ x: MARGIN, y: y - 18, width: 56, height: 18, color: sColor });
      p.drawText(sLabel, { x: MARGIN + 10, y: y - 12, size: 8, font: bold, color: C.white });
      p.drawText(catLabel, { x: MARGIN + 64, y: y - 10, size: 9, font: bold, color: C.black });

      let ry = y - 24;
      for (const line of flagLines) {
        p.drawText(line, { x: MARGIN + 8, y: ry, size: 9, font: regular, color: C.black });
        ry -= 13;
      }
      y -= flagH + 12;
    }
  }
}

function renderTranslationSection(
  pdfDoc: PDFDocument, pages: PDFPage[], bold: PDFFont, regular: PDFFont,
  translationFlags: TranslationFlag[], lang: Lang, useEnglish: boolean, sectionNum: number,
) {
  const p = pdfDoc.addPage([PAGE_W, PAGE_H]);
  pages.push(p);
  let y = PAGE_H - MARGIN;

  const title = useEnglish
    ? `Section ${sectionNum} - Translation & Transliteration Analysis`
    : safeText(lbl("translationTitle", lang));
  y = addSectionHeader(p, bold, title, y);
  y -= 8;

  const subtitleText = safeText(lbl("translationSubtitle", useEnglish ? "en" : lang));
  p.drawText(subtitleText, { x: MARGIN, y, size: 8, font: regular, color: C.gray });
  y -= 24;

  const conflictFlags = translationFlags.filter(f => f.risk !== "none");

  if (conflictFlags.length === 0) {
    p.drawRectangle({ x: MARGIN, y: y - 30, width: CONTENT_W, height: 40, color: rgb(0.9, 0.97, 0.9) });
    p.drawText(safeText(lbl("noTranslationConflicts", useEnglish ? "en" : lang)), { x: MARGIN + 16, y: y - 16, size: 10, font: bold, color: C.green });
    return;
  }

  // Table header
  p.drawRectangle({ x: MARGIN, y: y - 14, width: CONTENT_W, height: 20, color: C.darkGreen });
  const langLabel = safeText(lbl("language", useEnglish ? "en" : lang));
  const transLabel = safeText(lbl("translatedAs", useEnglish ? "en" : lang));
  const riskLabel = safeText(lbl("risk_", useEnglish ? "en" : lang));
  p.drawText(langLabel, { x: MARGIN + 6, y: y - 8, size: 8, font: bold, color: C.white });
  p.drawText(transLabel, { x: MARGIN + 110, y: y - 8, size: 8, font: bold, color: C.white });
  p.drawText(riskLabel, { x: MARGIN + 280, y: y - 8, size: 8, font: bold, color: C.white });
  y -= 26;

  for (const tf of translationFlags) {
    if (y < 80) break;
    const rColor = tf.risk === "high" ? C.red : tf.risk === "medium" ? C.amber : tf.risk === "low" ? C.blue : C.green;
    const bgColor = tf.risk === "none" ? rgb(0.9, 0.97, 0.9) : rgb(0.99, 0.97, 0.95);
    const detailText = useEnglish ? (tf.details_en || tf.details) : tf.details;
    const detailLines = wrapText(detailText || "", regular, 8, CONTENT_W - 20);
    const rowH = Math.max(36, detailLines.length * 12 + 20);

    p.drawRectangle({ x: MARGIN, y: y - rowH, width: CONTENT_W, height: rowH + 4, color: bgColor });
    p.drawText(safeText(tf.languageName), { x: MARGIN + 6, y: y - 4, size: 8, font: bold, color: C.darkGreen });
    p.drawText(safeText(tf.translatedForm).slice(0, 22), { x: MARGIN + 110, y: y - 4, size: 8, font: regular, color: C.black });
    p.drawRectangle({ x: MARGIN + 278, y: y - 16, width: 52, height: 14, color: rColor });
    p.drawText(tf.risk.toUpperCase(), { x: MARGIN + 282, y: y - 10, size: 7, font: bold, color: C.white });

    if (tf.issueCategory) {
      p.drawText(safeText(tf.issueCategory).slice(0, 40), { x: MARGIN + 6, y: y - 16, size: 7, font: bold, color: C.gray });
    }

    let dy = y - (tf.issueCategory ? 26 : 18);
    for (const line of detailLines) {
      if (dy < 80) break;
      p.drawText(line, { x: MARGIN + 8, y: dy, size: 8, font: regular, color: C.black });
      dy -= 12;
    }
    y -= rowH + 8;
  }
}

function renderMarciaSection(
  pdfDoc: PDFDocument, pages: PDFPage[], bold: PDFFont, regular: PDFFont,
  findings: MarciaFinding[], totalCount: number, marciaUrl: string | undefined,
  markName: string, lang: Lang, useEnglish: boolean, sectionNum: number,
) {
  const p = pdfDoc.addPage([PAGE_W, PAGE_H]);
  pages.push(p);
  let y = PAGE_H - MARGIN;

  const title = useEnglish
    ? `Section ${sectionNum} - Conflicting Registrations (IMPI MARCia)`
    : safeText(lbl("marciaTitle", lang));
  y = addSectionHeader(p, bold, title, y);
  y -= 8;

  const totalLabel = safeText(lbl("totalMarciaMatches", useEnglish ? "en" : lang));
  p.drawText(`${totalLabel}: ${totalCount}`, { x: MARGIN, y, size: 9, font: bold, color: C.darkGreen });
  if (marciaUrl) {
    const srcLabel = safeText(lbl("source", useEnglish ? "en" : lang));
    p.drawText(`${srcLabel}: ${marciaUrl}`, { x: MARGIN, y: y - 14, size: 8, font: regular, color: C.blue });
    y -= 14;
  }
  y -= 24;

  if (findings.length === 0) {
    p.drawText(safeText(lbl("noMarciaFindings", useEnglish ? "en" : lang)), { x: MARGIN, y, size: 10, font: regular, color: C.gray });
  } else {
    const nameH = safeText(lbl("markName", useEnglish ? "en" : lang));
    const classH = safeText(lbl("class_", useEnglish ? "en" : lang));
    const statH = safeText(lbl("status", useEnglish ? "en" : lang));
    const holderH = safeText(lbl("holder", useEnglish ? "en" : lang));

    p.drawRectangle({ x: MARGIN, y: y - 14, width: CONTENT_W, height: 20, color: C.darkGreen });
    p.drawText(nameH, { x: MARGIN + 6, y: y - 8, size: 8, font: bold, color: C.white });
    p.drawText(classH, { x: MARGIN + 230, y: y - 8, size: 8, font: bold, color: C.white });
    p.drawText(statH, { x: MARGIN + 280, y: y - 8, size: 8, font: bold, color: C.white });
    p.drawText(holderH, { x: MARGIN + 360, y: y - 8, size: 8, font: bold, color: C.white });
    y -= 26;

    for (let i = 0; i < findings.length && y > 80; i++) {
      const f = findings[i];
      const isExact = f.name.toLowerCase().trim() === markName.toLowerCase().trim();
      p.drawRectangle({ x: MARGIN, y: y - 14, width: CONTENT_W, height: 18, color: isExact ? rgb(0.99, 0.92, 0.92) : i % 2 === 0 ? C.lightGray : C.white });
      if (isExact) p.drawRectangle({ x: MARGIN, y: y - 14, width: 3, height: 18, color: C.red });
      p.drawText(safeText(f.name).slice(0, 32), { x: MARGIN + 6, y: y - 8, size: 8, font: isExact ? bold : regular, color: isExact ? C.red : C.black });
      p.drawText(safeText(f.classNum).slice(0, 8), { x: MARGIN + 230, y: y - 8, size: 8, font: regular, color: C.black });
      p.drawText(safeText(f.status).slice(0, 14), { x: MARGIN + 280, y: y - 8, size: 8, font: regular, color: C.black });
      p.drawText(safeText(f.holder).slice(0, 22), { x: MARGIN + 360, y: y - 8, size: 8, font: regular, color: C.black });
      y -= 20;
    }
  }
}

function renderWebSection(
  pdfDoc: PDFDocument, pages: PDFPage[], bold: PDFFont, regular: PDFFont,
  webFindings: string[], lang: Lang, useEnglish: boolean, sectionNum: number,
) {
  const p = pdfDoc.addPage([PAGE_W, PAGE_H]);
  pages.push(p);
  let y = PAGE_H - MARGIN;

  const title = useEnglish
    ? `Section ${sectionNum} - Web Presence Findings`
    : safeText(lbl("webTitle", lang));
  y = addSectionHeader(p, bold, title, y);
  y -= 10;

  if (webFindings.length === 0) {
    p.drawText(safeText(lbl("noWebFindings", useEnglish ? "en" : lang)), { x: MARGIN, y, size: 10, font: regular, color: C.gray });
  } else {
    for (const finding of webFindings) {
      if (y < 80) break;
      p.drawText("-", { x: MARGIN, y, size: 10, font: bold, color: C.darkGreen });
      y = drawWrappedText(p, finding, MARGIN + 14, y, regular, 10, CONTENT_W - 14, C.black);
      y -= 6;
    }
  }
}

function renderDomainSection(
  pdfDoc: PDFDocument, pages: PDFPage[], bold: PDFFont, regular: PDFFont,
  domains: DomainResult[], lang: Lang, useEnglish: boolean, sectionNum: number,
) {
  const p = pdfDoc.addPage([PAGE_W, PAGE_H]);
  pages.push(p);
  let y = PAGE_H - MARGIN;

  const title = useEnglish
    ? `Section ${sectionNum} - Domain Availability`
    : safeText(lbl("domainTitle", lang));
  y = addSectionHeader(p, bold, title, y);
  y -= 10;

  if (domains.length === 0) {
    p.drawText(safeText(lbl("noDomainCheck", useEnglish ? "en" : lang)), { x: MARGIN, y, size: 10, font: regular, color: C.gray });
  } else {
    const domainH = safeText(lbl("domain", useEnglish ? "en" : lang));
    const statH = safeText(lbl("status", useEnglish ? "en" : lang));

    p.drawRectangle({ x: MARGIN, y: y - 14, width: CONTENT_W, height: 20, color: C.darkGreen });
    p.drawText(domainH, { x: MARGIN + 6, y: y - 8, size: 8, font: bold, color: C.white });
    p.drawText(statH, { x: MARGIN + 300, y: y - 8, size: 8, font: bold, color: C.white });
    y -= 26;

    for (let i = 0; i < domains.length && y > 80; i++) {
      const d = domains[i];
      const statusColor = d.status === "available" ? C.green : d.status === "taken" ? C.red : C.gray;
      const statusLabel = safeText(lbl(d.status === "available" ? "available" : d.status === "taken" ? "taken" : "unknown", useEnglish ? "en" : lang));
      p.drawRectangle({ x: MARGIN, y: y - 14, width: CONTENT_W, height: 18, color: i % 2 === 0 ? C.lightGray : C.white });
      p.drawText(safeText(d.domain), { x: MARGIN + 6, y: y - 8, size: 9, font: regular, color: C.black });
      p.drawRectangle({ x: MARGIN + 298, y: y - 14, width: 72, height: 18, color: statusColor });
      p.drawText(statusLabel, { x: MARGIN + 308, y: y - 8, size: 8, font: bold, color: C.white });
      y -= 20;
    }
  }
}

function addDividerPage(pdfDoc: PDFDocument, pages: PDFPage[], bold: PDFFont, regular: PDFFont, dividerLabel: string) {
  const p = pdfDoc.addPage([PAGE_W, PAGE_H]);
  pages.push(p);
  p.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: PAGE_H, color: C.darkGreen });
  const labelW = bold.widthOfTextAtSize(dividerLabel, 22);
  p.drawText(dividerLabel, { x: (PAGE_W - labelW) / 2, y: PAGE_H / 2 + 10, size: 22, font: bold, color: C.gold });
  const subLabel = "Mexico Trademark Center";
  const subW = regular.widthOfTextAtSize(subLabel, 11);
  p.drawText(subLabel, { x: (PAGE_W - subW) / 2, y: PAGE_H / 2 - 18, size: 11, font: regular, color: rgb(0.75, 0.85, 0.75) });
}

// ─── PDF builder ──────────────────────────────────────────────────────────────

async function buildPdf(
  markName: string,
  goodsServices: string,
  orderId: string,
  result: ClearanceResult,
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const timestamp = new Date().toISOString().replace("T", " ").slice(0, 19) + " UTC";
  const shortId = orderId.slice(0, 8).toUpperCase();
  const riskColor = result.risk === "high" ? C.red : result.risk === "medium" ? C.amber : C.green;

  const searchLang = (result.searchLanguage ?? "en") as Lang;
  const isBilingual = searchLang !== "en";

  const pages: PDFPage[] = [];

  const newPage = () => {
    const p = pdfDoc.addPage([PAGE_W, PAGE_H]);
    pages.push(p);
    return p;
  };

  // Helper to get translated risk label
  const getRiskLabel = (lang: Lang) => {
    return result.risk === "high" ? safeText(lbl("riskHigh", lang))
      : result.risk === "medium" ? safeText(lbl("riskMedium", lang))
      : safeText(lbl("riskLow", lang));
  };

  // ── COVER PAGE ─────────────────────────────────────────────────────────────
  {
    const p = newPage();
    p.drawRectangle({ x: 0, y: PAGE_H - 200, width: PAGE_W, height: 200, color: C.darkGreen });
    p.drawText("MEXICO TRADEMARK CENTER", { x: MARGIN, y: PAGE_H - 60, size: 11, font: bold, color: C.gold });

    const coverTitle = isBilingual ? safeText(lbl("coverTitle", searchLang)) : "TRADEMARK CLEARANCE REPORT";
    p.drawText(coverTitle, { x: MARGIN, y: PAGE_H - 88, size: isBilingual ? 16 : 22, font: bold, color: C.white });
    if (isBilingual) {
      p.drawText("TRADEMARK CLEARANCE REPORT", { x: MARGIN, y: PAGE_H - 108, size: 13, font: regular, color: rgb(0.75, 0.85, 0.75) });
    }
    p.drawText(safeText(lbl("coverSubtitle", searchLang)), { x: MARGIN, y: PAGE_H - 128, size: 10, font: regular, color: rgb(0.75, 0.85, 0.75) });

    p.drawRectangle({ x: MARGIN, y: PAGE_H - 208, width: CONTENT_W, height: 3, color: C.gold });

    let y = PAGE_H - 260;

    p.drawRectangle({ x: MARGIN, y: y - 40, width: CONTENT_W, height: 60, color: C.lightGray, borderColor: C.gold, borderWidth: 1 });
    p.drawText(safeText(lbl("proposedTrademark", searchLang)), { x: MARGIN + 16, y: y + 4, size: 8, font: bold, color: C.gray });
    p.drawText(safeText(markName).slice(0, 60), { x: MARGIN + 16, y: y - 18, size: 20, font: bold, color: C.darkGreen });
    y -= 72;

    if (goodsServices) {
      p.drawText(safeText(lbl("goodsServices", searchLang)), { x: MARGIN, y, size: 8, font: bold, color: C.gray });
      y -= 16;
      y = drawWrappedText(p, goodsServices.slice(0, 300), MARGIN, y, regular, 11, CONTENT_W, C.black) + 4;
    }

    y -= 20;

    p.drawRectangle({ x: MARGIN, y: y - 28, width: 160, height: 40, color: riskColor });
    p.drawText(safeText(lbl("overallRisk", searchLang)), { x: MARGIN + 10, y: y - 8, size: 7, font: bold, color: C.white });
    p.drawText(getRiskLabel(searchLang), { x: MARGIN + 10, y: y - 22, size: 12, font: bold, color: C.white });

    y -= 64;

    const metaRows: Array<[string, string]> = [
      [safeText(lbl("reportGenerated", searchLang)), timestamp],
      [safeText(lbl("orderRef", searchLang)), shortId],
      [safeText(lbl("reportType", searchLang)), safeText(lbl("reportTypeValue", searchLang))],
    ];
    for (const [label, val] of metaRows) {
      p.drawText(label, { x: MARGIN, y, size: 9, font: bold, color: C.gray });
      p.drawText(val, { x: MARGIN + 160, y, size: 9, font: regular, color: C.black });
      y -= 18;
    }

    if (isBilingual) {
      y -= 10;
      p.drawRectangle({ x: MARGIN, y: y - 20, width: CONTENT_W, height: 26, color: rgb(0.95, 0.97, 0.95), borderColor: C.gold, borderWidth: 0.5 });
      const bilingualNote = `This report is presented first in ${result.searchLanguage?.toUpperCase() ?? "native"} language, followed by the complete report in English.`;
      p.drawText(bilingualNote, { x: MARGIN + 8, y: y - 10, size: 8, font: regular, color: C.darkGreen });
    }
  }

  // ── DISCLAIMER ─────────────────────────────────────────────────────────────
  {
    const p = newPage();
    let y = PAGE_H - MARGIN;
    y = addSectionHeader(p, bold, lbl("importantDisclaimer", searchLang), y);
    y -= 10;

    const disclaimerParagraphs = [
      "NOT LEGAL ADVICE - This report is generated by artificial intelligence and is provided for informational purposes only. It does not constitute legal advice, a formal trademark clearance opinion, or an attorney-client relationship.",
      "",
      "PRELIMINARY SCREENING ONLY - The analysis contained in this report is a preliminary automated screening. It is not a substitute for a comprehensive clearance search conducted by a qualified trademark attorney.",
      "",
      "AI LIMITATIONS - Artificial intelligence systems may produce incomplete, inaccurate, or outdated information. The trademark landscape changes continuously as new marks are filed and registered.",
      "",
      "IMPI DATABASE - MARCia database results are sourced directly from IMPI's public database. Mexico Trademark Center does not guarantee the completeness or accuracy of this data.",
      "",
      "DUPONT ANALYSIS - The DuPont likelihood-of-confusion analysis applies the 13 factors from In re E.I. DuPont DeNemours & Co. (1973) as adapted for Mexican trademark law context.",
      "",
      "TRANSLATION ANALYSIS - Translation and transliteration conflict analysis is AI-generated and may not identify all potential conflicts. Always consult a qualified attorney.",
      "",
      "CONSULT AN ATTORNEY - Before filing any trademark application, consult a qualified trademark attorney. Mexico Trademark Center offers professional trademark filing services.",
      "",
      "Contact: tm@mexicotrademarkcenter.com | mexicotrademarkcenter.com",
    ];

    for (const para of disclaimerParagraphs) {
      if (!para) { y -= 10; continue; }
      y = drawWrappedText(p, para, MARGIN, y, regular, 10, CONTENT_W, C.black, 16);
      y -= 4;
    }
  }

  // ── NATIVE LANGUAGE PART ──────────────────────────────────────────────────
  // When bilingual, render all sections in native language first

  const renderAllSections = (lang: Lang, useEnglish: boolean, sectionOffset: number) => {
    // Executive Summary
    {
      const p = newPage();
      let y = PAGE_H - MARGIN;
      y = addSectionHeader(p, bold, lbl("execSummary", useEnglish ? "en" : lang), y);
      y -= 10;

      p.drawRectangle({ x: MARGIN, y: y - 28, width: CONTENT_W, height: 40, color: riskColor });
      p.drawText(safeText(lbl("overallRisk", useEnglish ? "en" : lang)), { x: MARGIN + 16, y: y - 8, size: 8, font: bold, color: C.white });
      p.drawText(getRiskLabel(useEnglish ? "en" : lang), { x: MARGIN + 16, y: y - 22, size: 14, font: bold, color: C.white });
      y -= 56;

      const summary = useEnglish
        ? (result.riskSummary_en ?? result.riskSummary)
        : result.riskSummary;
      if (summary) {
        p.drawText(safeText(lbl("riskAssessmentSummary", useEnglish ? "en" : lang)), { x: MARGIN, y, size: 11, font: bold, color: C.darkGreen });
        y -= 20;
        y = drawWrappedText(p, summary, MARGIN, y, regular, 11, CONTENT_W, C.black);
        y -= 10;
      }

      y -= 10;
      p.drawText(safeText(lbl("quickScorecard", useEnglish ? "en" : lang)), { x: MARGIN, y, size: 11, font: bold, color: C.darkGreen });
      y -= 20;

      const scoreItems: Array<[string, string]> = [];
      if (result.distinctiveness) {
        const tierStr = result.distinctiveness.tier.charAt(0).toUpperCase() + result.distinctiveness.tier.slice(1) + ` (${result.distinctiveness.score}/5)`;
        scoreItems.push([safeText(lbl("distinctivenessTier", useEnglish ? "en" : lang)), tierStr]);
      }
      if (result.dupont) {
        const favor = result.dupont.filter(f => f.verdict === "favors_registration").length;
        const against = result.dupont.filter(f => f.verdict === "against_registration").length;
        const neutral = result.dupont.filter(f => f.verdict === "neutral").length;
        scoreItems.push([safeText(lbl("dupontOutlook", useEnglish ? "en" : lang)), `${favor} favoring | ${neutral} neutral | ${against} against`]);
      }
      if (result.registrabilityFlags !== undefined) {
        const high = result.registrabilityFlags.filter(f => f.severity === "high").length;
        const med = result.registrabilityFlags.filter(f => f.severity === "medium").length;
        const lfppiVal = result.registrabilityFlags.length === 0
          ? safeText(lbl("noneDetected", useEnglish ? "en" : lang))
          : `${result.registrabilityFlags.length} ${lbl("issueCount", useEnglish ? "en" : lang)} - ${high} ${lbl("highSeverity", useEnglish ? "en" : lang)}, ${med} ${lbl("medSeverity", useEnglish ? "en" : lang)}`;
        scoreItems.push([safeText(lbl("lfppiIssues", useEnglish ? "en" : lang)), lfppiVal]);
      }
      scoreItems.push([safeText(lbl("marciaMatches", useEnglish ? "en" : lang)), String(result.marciaTotalCount ?? result.marciaFindings?.length ?? 0)]);

      for (const [label, val] of scoreItems) {
        p.drawRectangle({ x: MARGIN, y: y - 14, width: CONTENT_W, height: 26, color: C.lightGray });
        p.drawText(label, { x: MARGIN + 10, y: y - 4, size: 9, font: bold, color: C.darkGreen });
        p.drawText(safeText(val), { x: MARGIN + 10, y: y - 15, size: 9, font: regular, color: C.black });
        y -= 32;
      }
    }

    let sn = sectionOffset;

    // Distinctiveness
    if (result.distinctiveness) {
      renderDistinctivenessSection(pdfDoc, pages, bold, regular, result.distinctiveness, lang, useEnglish, sn++);
    }

    // DuPont
    if (result.dupont && result.dupont.length > 0) {
      renderDupontSection(pdfDoc, pages, bold, regular, result.dupont, lang, useEnglish, sn++);
    }

    // LFPPI
    renderLfppiSection(pdfDoc, pages, bold, regular, result.registrabilityFlags ?? [], lang, useEnglish, sn++);

    // Translation
    if (result.translationAnalysis) {
      renderTranslationSection(pdfDoc, pages, bold, regular, result.translationAnalysis, lang, useEnglish, sn++);
    }

    // MARCia
    renderMarciaSection(pdfDoc, pages, bold, regular, result.marciaFindings ?? [], result.marciaTotalCount ?? result.marciaFindings?.length ?? 0, result.marciaUrl, markName, lang, useEnglish, sn++);

    // Web
    renderWebSection(pdfDoc, pages, bold, regular, result.webFindings ?? [], lang, useEnglish, sn++);

    // Domains
    renderDomainSection(pdfDoc, pages, bold, regular, result.domainResults ?? [], lang, useEnglish, sn++);
  };

  if (isBilingual) {
    // Native language part
    addDividerPage(pdfDoc, pages, bold, regular, safeText(lbl("nativeSection", searchLang)));
    renderAllSections(searchLang, false, 1);

    // English part
    addDividerPage(pdfDoc, pages, bold, regular, "ENGLISH VERSION");
    renderAllSections("en", true, 1);
  } else {
    renderAllSections("en", true, 1);
  }

  // ── Add footers to all pages ───────────────────────────────────────────────
  const totalPages = pages.length;
  for (let i = 0; i < pages.length; i++) {
    addFooter(pages[i], regular, orderId, i + 1, totalPages, timestamp);
  }

  return pdfDoc.save();
}

// ─── Main handler ─────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(JSON.stringify({ error: "Service not configured" }), { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { reportOrderId } = await req.json() as { reportOrderId: string };
    if (!reportOrderId) {
      return new Response(JSON.stringify({ error: "reportOrderId is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: order } = await supabase
      .from("clearance_report_orders")
      .select("*")
      .eq("id", reportOrderId)
      .maybeSingle();

    if (!order) {
      return new Response(JSON.stringify({ error: "Order not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Generate PDF
    const pdfBytes = await buildPdf(
      order.mark_name,
      order.goods_services,
      order.id,
      order.clearance_result as ClearanceResult,
    );

    // Ensure storage bucket exists
    await supabase.storage.createBucket("clearance-reports", { public: false }).catch(() => {/* already exists */});

    // Upload to Storage
    const storagePath = `${reportOrderId}.pdf`;
    const { error: uploadError } = await supabase.storage
      .from("clearance-reports")
      .upload(storagePath, pdfBytes, { contentType: "application/pdf", upsert: true });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return new Response(JSON.stringify({ error: "Failed to store PDF" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Update order with storage path
    await supabase
      .from("clearance_report_orders")
      .update({ pdf_storage_path: storagePath })
      .eq("id", reportOrderId);

    // Send email
    try {
      await fetch(`${supabaseUrl}/functions/v1/send-clearance-report-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${supabaseServiceKey}` },
        body: JSON.stringify({ reportOrderId }),
      });
    } catch (e) {
      console.error("Email send error:", e);
    }

    return new Response(JSON.stringify({ success: true, storagePath }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("generate-clearance-pdf error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
