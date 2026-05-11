import { useState, useRef, useEffect } from 'react';
import {
  Sparkles, Send, RefreshCw, CheckCircle2,
  AlertTriangle, Loader2, MessageSquare, Pencil, X
} from 'lucide-react';
import { classifyGoods, type ClassSuggestion } from '../lib/classifier';

interface AIClass {
  classNumber: number;
  titleEn: string;
  titleLocalized?: string;
  confidence: number;
  reasoning: string;
  descriptionEn: string;
  descriptionEs: string;
}

interface AIResponse {
  status: 'needs_clarification' | 'classified';
  questions?: string[];
  classes?: AIClass[];
  summary?: string;
}

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface RelatedClass {
  classNumber: number;
  titleEn: string;
}

type Lang = 'en' | 'zh' | 'es' | 'de' | 'fr' | 'hi' | 'pt' | 'ja';

interface Props {
  language: Lang;
  initialDescription: string;
  onDescriptionChange: (desc: string) => void;
  onClassesAccepted: (classNumbers: number[], descriptionsEn: Record<number, string>, descriptionsEs: Record<number, string>) => void;
  onFallbackSuggestions: (suggestions: ClassSuggestion[]) => void;
  selectedClasses: number[];
  onToggleClass: (num: number) => void;
  relatedClasses?: RelatedClass[];
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

type AssistantMode = 'idle' | 'analyzing' | 'questions' | 'classified' | 'fallback';

const ui: Record<string, Record<Lang, string>> = {
  relatedClassesNote: {
    en: 'Based on your existing classes, our AI will suggest complementary goods or services.',
    zh: '根据您已有的类别，我们的AI将建议互补的商品或服务。',
    es: 'Basado en tus clases existentes, nuestra IA sugerirá bienes o servicios complementarios.',
    de: 'Basierend auf Ihren bestehenden Klassen schlägt unsere KI ergänzende Waren oder Dienstleistungen vor.',
    fr: 'Sur la base de vos classes existantes, notre IA suggérera des biens ou services complémentaires.',
    hi: 'आपकी मौजूदा कक्षाओं के आधार पर, हमारी AI पूरक वस्तुओं या सेवाओं का सुझाव देगी।',
    pt: 'Com base nas suas classes existentes, nossa IA sugerirá bens ou serviços complementares.',
    ja: '既存のクラスを基に、AIが補完的な商品またはサービスを提案します。',
  },
  describeLabel: {
    en: 'Describe Your Goods or Services *',
    zh: '描述您的商品或服务 *',
    es: 'Describe tus Bienes o Servicios *',
    de: 'Beschreiben Sie Ihre Waren oder Dienstleistungen *',
    fr: 'Décrivez vos Produits ou Services *',
    hi: 'अपनी वस्तुओं या सेवाओं का वर्णन करें *',
    pt: 'Descreva seus Bens ou Serviços *',
    ja: '商品またはサービスを説明してください *',
  },
  aiPowered: {
    en: 'AI-Powered Classification',
    zh: 'AI智能分类',
    es: 'Clasificación con IA',
    de: 'KI-gestützte Klassifizierung',
    fr: 'Classification par IA',
    hi: 'AI-संचालित वर्गीकरण',
    pt: 'Classificação por IA',
    ja: 'AI分類',
  },
  descPlaceholder: {
    en: 'Describe your goods or services in detail — the more specific, the better. Write in any language...',
    zh: '请详细描述您的商品或服务——越详细越好。可以用中文、英文或西班牙文...',
    es: 'Describe tus bienes o servicios con detalle — cuanto más específico, mejor...',
    de: 'Beschreiben Sie Ihre Waren oder Dienstleistungen detailliert — je spezifischer, desto besser...',
    fr: 'Décrivez vos produits ou services en détail — plus c\'est précis, mieux c\'est...',
    hi: 'अपनी वस्तुओं या सेवाओं का विस्तार से वर्णन करें — जितना विशिष्ट, उतना बेहतर...',
    pt: 'Descreva seus bens ou serviços em detalhes — quanto mais específico, melhor...',
    ja: '商品やサービスを詳しく説明してください — 具体的であるほど良いです。どの言語でも入力できます...',
  },
  industryLabel: {
    en: 'Business Industry',
    zh: '商业行业',
    es: 'Industria del Negocio',
    de: 'Geschäftsbranche',
    fr: 'Secteur d\'activité',
    hi: 'व्यवसाय उद्योग',
    pt: 'Setor do Negócio',
    ja: 'ビジネス業種',
  },
  industryPlaceholder: {
    en: 'e.g. Consumer Electronics',
    zh: '例如：消费电子',
    es: 'ej. Electrónica de consumo',
    de: 'z. B. Unterhaltungselektronik',
    fr: 'ex. Électronique grand public',
    hi: 'उदा. उपभोक्ता इलेक्ट्रॉनिक्स',
    pt: 'ex. Eletrônicos de consumo',
    ja: '例：コンシューマーエレクトロニクス',
  },
  analyzing: {
    en: 'Analyzing...',
    zh: '分析中...',
    es: 'Analizando...',
    de: 'Analysiere...',
    fr: 'Analyse en cours...',
    hi: 'विश्लेषण हो रहा है...',
    pt: 'Analisando...',
    ja: '分析中...',
  },
  reAnalyze: {
    en: 'Re-analyze',
    zh: '重新分析',
    es: 'Volver a analizar',
    de: 'Erneut analysieren',
    fr: 'Ré-analyser',
    hi: 'पुनः विश्लेषण करें',
    pt: 'Reanalisar',
    ja: '再分析',
  },
  analyzeWithAI: {
    en: 'Let AI classify your trademark',
    zh: '让AI为您的商标分类',
    es: 'Dejar que la IA clasifique tu marca',
    de: 'KI Ihre Marke klassifizieren lassen',
    fr: 'Laisser l\'IA classer votre marque',
    hi: 'AI को आपके ट्रेडमार्क को वर्गीकृत करने दें',
    pt: 'Deixar a IA classificar sua marca',
    ja: 'AIに商標を分類させる',
  },
  classifyingTitle: {
    en: 'Classifying your goods & services...',
    zh: '正在对您的商品和服务进行分类...',
    es: 'Clasificando tus bienes y servicios...',
    de: 'Klassifizierung Ihrer Waren und Dienstleistungen...',
    fr: 'Classification de vos produits et services...',
    hi: 'आपकी वस्तुओं और सेवाओं का वर्गीकरण हो रहा है...',
    pt: 'Classificando seus bens e serviços...',
    ja: '商品・サービスを分類中...',
  },
  classifyingSubtitle: {
    en: 'Our AI is reviewing all 45 Nice Classification classes against your description',
    zh: '我们的AI正在根据您的描述审查所有45个尼斯分类类别',
    es: 'Nuestra IA está revisando las 45 clases de la Clasificación de Niza',
    de: 'Unsere KI prüft alle 45 Nizza-Klassifikationsklassen anhand Ihrer Beschreibung',
    fr: 'Notre IA examine les 45 classes de la Classification de Nice',
    hi: 'हमारी AI आपके विवरण के आधार पर सभी 45 नाइस वर्गीकरण कक्षाओं की समीक्षा कर रही है',
    pt: 'Nossa IA está revisando todas as 45 classes da Classificação de Nice em relação à sua descrição',
    ja: 'AIがあなたの説明に対して全45ニース分類クラスを確認しています',
  },
  clarifyingTitle: {
    en: 'A few clarifying questions',
    zh: '几个澄清问题',
    es: 'Algunas preguntas aclaratorias',
    de: 'Ein paar Klärungsfragen',
    fr: 'Quelques questions de clarification',
    hi: 'कुछ स्पष्टीकरण प्रश्न',
    pt: 'Algumas perguntas de esclarecimento',
    ja: 'いくつかの確認事項',
  },
  round: {
    en: 'Round',
    zh: '第',
    es: 'Ronda',
    de: 'Runde',
    fr: 'Tour',
    hi: 'चक्र',
    pt: 'Rodada',
    ja: 'ラウンド',
  },
  clarifyingIntro: {
    en: 'To identify the most precise Nice class(es) for your filing, please answer these questions:',
    zh: '为了确定您申请的最精确尼斯类别，请回答以下问题：',
    es: 'Para identificar las clases de Niza más precisas para tu solicitud, responde estas preguntas:',
    de: 'Um die präzisesten Nizza-Klassen für Ihre Anmeldung zu bestimmen, beantworten Sie bitte diese Fragen:',
    fr: 'Pour identifier les classes de Nice les plus précises pour votre dépôt, veuillez répondre à ces questions :',
    hi: 'आपके आवेदन के लिए सबसे सटीक नाइस कक्षाएं पहचानने के लिए, कृपया इन प्रश्नों का उत्तर दें:',
    pt: 'Para identificar as classes de Nice mais precisas para o seu registro, por favor responda estas perguntas:',
    ja: '出願に最適なニース分類クラスを特定するため、以下の質問にお答えください：',
  },
  yourAnswer: {
    en: 'Your answer...',
    zh: '您的回答...',
    es: 'Tu respuesta...',
    de: 'Ihre Antwort...',
    fr: 'Votre réponse...',
    hi: 'आपका उत्तर...',
    pt: 'Sua resposta...',
    ja: '回答を入力...',
  },
  submitAnswers: {
    en: 'Submit Answers & Classify',
    zh: '提交回答并分类',
    es: 'Enviar respuestas y clasificar',
    de: 'Antworten einreichen und klassifizieren',
    fr: 'Soumettre les réponses et classer',
    hi: 'उत्तर जमा करें और वर्गीकृत करें',
    pt: 'Enviar Respostas e Classificar',
    ja: '回答を送信して分類する',
  },
  aiResultsTitle: {
    en: 'AI Classification Results',
    zh: 'AI分类结果',
    es: 'Resultados de clasificación IA',
    de: 'KI-Klassifizierungsergebnisse',
    fr: 'Résultats de classification IA',
    hi: 'AI वर्गीकरण परिणाम',
    pt: 'Resultados da Classificação por IA',
    ja: 'AI分類結果',
  },
  classesFound: {
    en: 'class(es) found',
    zh: '个类别',
    es: 'clase(s) encontrada(s)',
    de: 'Klasse(n) gefunden',
    fr: 'classe(s) trouvée(s)',
    hi: 'कक्षा(एं) मिली',
    pt: 'classe(s) encontrada(s)',
    ja: 'クラス見つかりました',
  },
  acceptAll: {
    en: 'Accept All',
    zh: '全部接受',
    es: 'Aceptar todo',
    de: 'Alle akzeptieren',
    fr: 'Tout accepter',
    hi: 'सभी स्वीकार करें',
    pt: 'Aceitar Tudo',
    ja: 'すべて承認',
  },
  accepted: {
    en: 'Accepted',
    zh: '已接受',
    es: 'Aceptado',
    de: 'Akzeptiert',
    fr: 'Accepté',
    hi: 'स्वीकृत',
    pt: 'Aceito',
    ja: '承認済み',
  },
  accept: {
    en: 'Accept',
    zh: '接受',
    es: 'Aceptar',
    de: 'Akzeptieren',
    fr: 'Accepter',
    hi: 'स्वीकार करें',
    pt: 'Aceitar',
    ja: '承認',
  },
  editDescriptions: {
    en: 'You can edit these descriptions:',
    zh: '您可以编辑这些描述：',
    es: 'Puedes editar estas descripciones:',
    de: 'Sie können diese Beschreibungen bearbeiten:',
    fr: 'Vous pouvez modifier ces descriptions :',
    hi: 'आप इन विवरणों को संपादित कर सकते हैं:',
    pt: 'Você pode editar estas descrições:',
    ja: 'これらの説明を編集できます：',
  },
  descriptionEn: {
    en: 'Description (English)',
    zh: '描述（英文）',
    es: 'Descripción (Inglés)',
    de: 'Beschreibung (Englisch)',
    fr: 'Description (Anglais)',
    hi: 'विवरण (अंग्रेज़ी)',
    pt: 'Descrição (Inglês)',
    ja: '説明（英語）',
  },
  descriptionEs: {
    en: 'Description (Spanish — for IMPI filing)',
    zh: '描述（西班牙语——用于IMPI申请）',
    es: 'Descripción (Español — para tramitación IMPI)',
    de: 'Beschreibung (Spanisch — für IMPI-Einreichung)',
    fr: 'Description (Espagnol — pour le dépôt IMPI)',
    hi: 'विवरण (स्पेनिश — IMPI आवेदन के लिए)',
    pt: 'Descrição (Espanhol — para protocolo IMPI)',
    ja: '説明（スペイン語 — IMPI出願用）',
  },
  classificationPreliminary: {
    en: 'Classification is preliminary and subject to professional review before IMPI filing. Final classification is confirmed by our team.',
    zh: '分类为初步建议，在IMPI申请前须经专业审查。最终分类由我们的团队确认。',
    es: 'La clasificación es preliminar y está sujeta a revisión profesional antes de la presentación ante el IMPI.',
    de: 'Die Klassifizierung ist vorläufig und unterliegt vor der IMPI-Einreichung einer professionellen Prüfung.',
    fr: 'La classification est préliminaire et soumise à un examen professionnel avant le dépôt à l\'IMPI.',
    hi: 'वर्गीकरण प्रारंभिक है और IMPI आवेदन से पहले पेशेवर समीक्षा के अधीन है।',
    pt: 'A classificação é preliminar e sujeita a revisão profissional antes do protocolo no IMPI.',
    ja: '分類は暫定的であり、IMPI出願前に専門的な審査を受けます。最終分類は当チームが確認します。',
  },
  keywordResults: {
    en: 'Keyword Classification Results',
    zh: '关键词分类结果',
    es: 'Resultados de clasificación por palabras clave',
    de: 'Schlüsselwort-Klassifizierungsergebnisse',
    fr: 'Résultats de classification par mots-clés',
    hi: 'कीवर्ड वर्गीकरण परिणाम',
    pt: 'Resultados da Classificação por Palavras-chave',
    ja: 'キーワード分類結果',
  },
  aiUnavailable: {
    en: 'AI unavailable — using keyword matching',
    zh: 'AI不可用——使用关键词匹配',
    es: 'IA no disponible — usando coincidencia de palabras clave',
    de: 'KI nicht verfügbar — Schlüsselwortabgleich wird verwendet',
    fr: 'IA indisponible — utilisation de la correspondance par mots-clés',
    hi: 'AI उपलब्ध नहीं — कीवर्ड मिलान का उपयोग हो रहा है',
    pt: 'IA indisponível — usando correspondência por palavras-chave',
    ja: 'AI利用不可 — キーワードマッチングを使用中',
  },
  classificationPreliminaryShort: {
    en: 'Classification is preliminary and subject to professional review.',
    zh: '分类为初步建议，须经专业审查。',
    es: 'La clasificación es preliminar y sujeta a revisión profesional.',
    de: 'Die Klassifizierung ist vorläufig und bedarf einer professionellen Prüfung.',
    fr: 'La classification est préliminaire et soumise à révision professionnelle.',
    hi: 'वर्गीकरण प्रारंभिक है और पेशेवर समीक्षा के अधीन है।',
    pt: 'A classificação é preliminar e sujeita a revisão profissional.',
    ja: '分類は暫定的であり、専門的な審査を受けます。',
  },
  browseAllClasses: {
    en: 'or Select your classes manually from the 45 Nice Classification',
    zh: '或从45个尼斯分类中手动选择类别',
    es: 'o Selecciona tus clases manualmente de las 45 Clases de Niza',
    de: 'oder Wählen Sie Ihre Klassen manuell aus den 45 Nizza-Klassen',
    fr: 'ou Sélectionner vos classes manuellement parmi les 45 classes de Nice',
    hi: 'या 45 नाइस वर्गीकरण से अपनी कक्षाएं मैन्युअल रूप से चुनें',
    pt: 'ou Selecione suas classes manualmente das 45 classes de Nice',
    ja: 'または45のニース分類から手動でクラスを選択する',
  },
  classModalTitle: {
    en: 'Select Nice Classification Classes',
    zh: '选择尼斯分类类别',
    es: 'Seleccionar Clases de la Clasificación de Niza',
    de: 'Nizza-Klassen auswählen',
    fr: 'Sélectionner les classes de la Classification de Nice',
    hi: 'नाइस वर्गीकरण कक्षाएं चुनें',
    pt: 'Selecionar Classes da Classificação de Nice',
    ja: 'ニース分類クラスを選択',
  },
  classModalSubtitle: {
    en: 'Select all classes that apply to your goods or services. Each class covers a different category.',
    zh: '选择适用于您商品或服务的所有类别。每个类别涵盖不同的产品或服务范围。',
    es: 'Selecciona todas las clases que apliquen a tus bienes o servicios. Cada clase cubre una categoría diferente.',
    de: 'Wählen Sie alle Klassen aus, die für Ihre Waren oder Dienstleistungen zutreffen.',
    fr: 'Sélectionnez toutes les classes qui s\'appliquent à vos produits ou services.',
    hi: 'अपनी वस्तुओं या सेवाओं पर लागू सभी कक्षाएं चुनें।',
    pt: 'Selecione todas as classes que se aplicam aos seus bens ou serviços.',
    ja: '商品やサービスに該当するすべてのクラスを選択してください。各クラスは異なるカテゴリをカバーします。',
  },
  classModalConfirm: {
    en: 'Confirm Selection',
    zh: '确认选择',
    es: 'Confirmar Selección',
    de: 'Auswahl bestätigen',
    fr: 'Confirmer la sélection',
    hi: 'चयन की पुष्टि करें',
    pt: 'Confirmar Seleção',
    ja: '選択を確認',
  },
  goods: {
    en: 'Goods',
    zh: '商品',
    es: 'Bienes',
    de: 'Waren',
    fr: 'Produits',
    hi: 'वस्तुएं',
    pt: 'Bens',
    ja: '商品',
  },
  services: {
    en: 'Services',
    zh: '服务',
    es: 'Servicios',
    de: 'Dienstleistungen',
    fr: 'Services',
    hi: 'सेवाएं',
    pt: 'Serviços',
    ja: 'サービス',
  },
  classesSelected: {
    en: 'class(es) selected',
    zh: '个类别已选择',
    es: 'clase(s) seleccionada(s)',
    de: 'Klasse(n) ausgewählt',
    fr: 'classe(s) sélectionnée(s)',
    hi: 'कक्षा(एं) चुनी गई',
    pt: 'classe(s) selecionada(s)',
    ja: 'クラス選択済み',
  },
  highConfidence: {
    en: 'High confidence',
    zh: '高置信度',
    es: 'Alta confianza',
    de: 'Hohe Sicherheit',
    fr: 'Haute confiance',
    hi: 'उच्च विश्वास',
    pt: 'Alta confiança',
    ja: '高い確信度',
  },
  moderateConfidence: {
    en: 'Moderate confidence',
    zh: '中等置信度',
    es: 'Confianza moderada',
    de: 'Mittlere Sicherheit',
    fr: 'Confiance modérée',
    hi: 'मध्यम विश्वास',
    pt: 'Confiança moderada',
    ja: '中程度の確信度',
  },
  lowConfidence: {
    en: 'Low confidence',
    zh: '低置信度',
    es: 'Baja confianza',
    de: 'Geringe Sicherheit',
    fr: 'Faible confiance',
    hi: 'कम विश्वास',
    pt: 'Baixa confiança',
    ja: '低い確信度',
  },
};

export default function AIDescriptionAssistant({
  language,
  initialDescription,
  onDescriptionChange,
  onClassesAccepted,
  onFallbackSuggestions,
  selectedClasses,
  onToggleClass,
  relatedClasses = [],
}: Props) {
  const [description, setDescription] = useState(initialDescription);
  const industry = '';
  const [mode, setMode] = useState<AssistantMode>('idle');
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [aiResponse, setAiResponse] = useState<AIResponse | null>(null);
  const [fallbackSuggestions, setFallbackSuggestions] = useState<ClassSuggestion[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [acceptedClasses, setAcceptedClasses] = useState<Set<number>>(new Set());
  const [classDescriptionsEn, setClassDescriptionsEn] = useState<Record<number, string>>({});
  const [classDescriptionsEs, setClassDescriptionsEs] = useState<Record<number, string>>({});
  const [showClassModal, setShowClassModal] = useState(false);
  const [round, setRound] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const s = (key: string) => ui[key]?.[language] ?? ui[key]?.['en'] ?? key;

  useEffect(() => {
    if (initialDescription && !description) setDescription(initialDescription);
  }, [initialDescription]);

  const buildUserMessage = (): string => {
    const parts: string[] = [];
    if (description.trim()) parts.push(`Goods/Services Description: ${description.trim()}`);
    if (industry.trim()) parts.push(`Industry: ${industry.trim()}`);
    if (relatedClasses.length > 0) {
      const list = relatedClasses.map(c => `Class ${c.classNumber} — ${c.titleEn}`).join(', ');
      parts.push(`Already accepted classes for this mark: ${list}. Please suggest related goods/services in complementary classes that are not yet covered.`);
    }
    return parts.join('\n');
  };

  const callAI = async (messages: ConversationMessage[]) => {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/classify-goods`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ messages, language }),
    });
    if (!res.ok) throw new Error('AI service unavailable');
    const data = await res.json();
    if (data.fallback || data.error) throw new Error(data.error || 'Fallback');
    return data as AIResponse;
  };

  const runFallback = () => {
    const suggestions = classifyGoods(description, industry, [], 8);
    setFallbackSuggestions(suggestions);
    onFallbackSuggestions(suggestions);
    setMode('fallback');
  };

  const handleAnalyze = async () => {
    if (!description.trim()) return;
    onDescriptionChange(description);

    setMode('analyzing');
    setAiResponse(null);
    setAnswers({});
    setAcceptedClasses(new Set());
    setRound(0);

    const userMsg = buildUserMessage();
    const newConversation: ConversationMessage[] = [{ role: 'user', content: userMsg }];
    setConversation(newConversation);

    try {
      const response = await callAI(newConversation);
      setAiResponse(response);
      setConversation(prev => [
        ...prev,
        { role: 'assistant', content: JSON.stringify(response) },
      ]);
      setMode(response.status === 'needs_clarification' ? 'questions' : 'classified');
    } catch {
      runFallback();
    }
  };

  const handleSubmitAnswers = async () => {
    const questions = aiResponse?.questions || [];
    const answersText = questions
      .map((q, i) => `Q: ${q}\nA: ${answers[i] || '(no answer)'}`)
      .join('\n\n');

    const newUserMsg: ConversationMessage = { role: 'user', content: answersText };
    const newConversation = [...conversation, newUserMsg];
    setConversation(newConversation);
    setMode('analyzing');
    setRound(r => r + 1);

    try {
      const response = await callAI(newConversation);
      setAiResponse(response);
      setConversation(prev => [
        ...prev,
        { role: 'assistant', content: JSON.stringify(response) },
      ]);
      setAnswers({});
      setMode(response.status === 'needs_clarification' ? 'questions' : 'classified');
    } catch {
      runFallback();
    }
  };

  const handleAcceptClass = (cls: AIClass) => {
    const updated = new Set(acceptedClasses).add(cls.classNumber);
    setAcceptedClasses(updated);

    const newEn = { ...classDescriptionsEn, [cls.classNumber]: cls.descriptionEn };
    const newEs = { ...classDescriptionsEs, [cls.classNumber]: cls.descriptionEs };
    setClassDescriptionsEn(newEn);
    setClassDescriptionsEs(newEs);

    onToggleClass(cls.classNumber);
    onClassesAccepted([...updated], newEn, newEs);
  };

  const handleAcceptAll = () => {
    const classes = aiResponse?.classes || [];
    const newAccepted = new Set(classes.map(c => c.classNumber));
    setAcceptedClasses(newAccepted);

    const newEn: Record<number, string> = {};
    const newEs: Record<number, string> = {};
    classes.forEach(c => {
      newEn[c.classNumber] = c.descriptionEn;
      newEs[c.classNumber] = c.descriptionEs;
      if (!selectedClasses.includes(c.classNumber)) onToggleClass(c.classNumber);
    });
    setClassDescriptionsEn(newEn);
    setClassDescriptionsEs(newEs);
    onClassesAccepted([...newAccepted], newEn, newEs);
  };

  const handleReset = () => {
    setMode('idle');
    setAiResponse(null);
    setConversation([]);
    setAnswers({});
    setAcceptedClasses(new Set());
    setClassDescriptionsEn({});
    setClassDescriptionsEs({});
    setFallbackSuggestions([]);
    setRound(0);
  };

  const confidenceColor = (c: number) =>
    c >= 0.85 ? 'text-emerald-600 bg-emerald-50 border-emerald-200' :
    c >= 0.65 ? 'text-yellow-700 bg-yellow-50 border-yellow-200' :
    'text-gray-600 bg-gray-50 border-gray-200';

  const confidenceLabel = (c: number) =>
    c >= 0.85 ? s('highConfidence') :
    c >= 0.65 ? s('moderateConfidence') :
    s('lowConfidence');

  const inputCls = 'w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent';

  return (
    <div className="space-y-4">
      {relatedClasses.length > 0 && (
        <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
          <Sparkles size={14} className="text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700">
            {language === 'en'
              ? `Based on your existing classes (${relatedClasses.map(c => `Class ${c.classNumber}`).join(', ')}), our AI will suggest complementary goods or services.`
              : language === 'zh'
              ? `根据您已有的类别（${relatedClasses.map(c => `第${c.classNumber}类`).join('、')}），我们的AI将建议互补的商品或服务。`
              : `${s('relatedClassesNote')} (${relatedClasses.map(c => `Class ${c.classNumber}`).join(', ')})`}
          </p>
        </div>
      )}

      {/* Description textarea + analyze button */}
      <div className="space-y-3">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-sm font-medium text-gray-700">
              {s('describeLabel')}
            </label>
            <div className="flex items-center gap-1.5 text-xs text-gold-600 font-medium">
              <Sparkles size={12} />
              {s('aiPowered')}
            </div>
          </div>
          <textarea
            ref={textareaRef}
            rows={5}
            required
            className={inputCls}
            placeholder={s('descPlaceholder')}
            value={description}
            onChange={e => {
              setDescription(e.target.value);
              onDescriptionChange(e.target.value);
              if (mode !== 'idle') setMode('idle');
            }}
          />
        </div>

        <button
          type="button"
          onClick={mode === 'idle' || mode === 'fallback' ? handleAnalyze : handleReset}
          disabled={!description.trim() || mode === 'analyzing'}
          className={`w-full flex items-center justify-center gap-2 font-semibold py-2.5 rounded-xl text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
            mode === 'classified' || mode === 'questions'
              ? 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200'
              : 'bg-navy-900 hover:bg-navy-800 text-white shadow-sm'
          }`}
        >
          {mode === 'analyzing' ? (
            <>
              <Loader2 size={15} className="animate-spin" />
              {s('analyzing')}
            </>
          ) : mode === 'classified' || mode === 'questions' ? (
            <>
              <RefreshCw size={14} />
              {s('reAnalyze')}
            </>
          ) : (
            <>
              <Sparkles size={15} />
              {s('analyzeWithAI')}
            </>
          )}
        </button>
      </div>

      {/* Analyzing skeleton */}
      {mode === 'analyzing' && (
        <div className="bg-gradient-to-r from-navy-50 to-gold-50 border border-navy-100 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 bg-navy-900 rounded-xl flex items-center justify-center flex-shrink-0">
              <Sparkles size={16} className="text-gold-400 animate-pulse" />
            </div>
            <div>
              <div className="text-sm font-semibold text-navy-900">
                {s('classifyingTitle')}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">
                {s('classifyingSubtitle')}
              </div>
            </div>
          </div>
          <div className="space-y-2.5">
            {[100, 80, 90].map((w, i) => (
              <div key={i} className="flex gap-3 items-center">
                <div className="w-14 h-5 bg-navy-100 rounded animate-pulse flex-shrink-0" />
                <div className={`h-5 bg-navy-100 rounded animate-pulse`} style={{ width: `${w}%` }} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Clarifying questions */}
      {mode === 'questions' && aiResponse?.questions && (
        <div className="bg-white border border-gold-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="bg-gradient-to-r from-gold-500 to-gold-600 px-5 py-3 flex items-center gap-2">
            <MessageSquare size={16} className="text-white" />
            <span className="text-white font-semibold text-sm">
              {s('clarifyingTitle')}
            </span>
            {round > 0 && (
              <span className="ml-auto text-white/70 text-xs">
                {s('round')} {round + 1}
              </span>
            )}
          </div>
          <div className="p-5 space-y-4">
            <p className="text-sm text-gray-600">
              {s('clarifyingIntro')}
            </p>
            {aiResponse.questions.map((q, i) => (
              <div key={i} className="space-y-1.5">
                <label className="text-sm font-medium text-navy-900 flex items-start gap-2">
                  <span className="bg-gold-100 text-gold-700 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  {q}
                </label>
                <textarea
                  rows={2}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent resize-none"
                  placeholder={s('yourAnswer')}
                  value={answers[i] || ''}
                  onChange={e => setAnswers(prev => ({ ...prev, [i]: e.target.value }))}
                />
              </div>
            ))}
            <button
              type="button"
              onClick={handleSubmitAnswers}
              className="w-full flex items-center justify-center gap-2 bg-gold-500 hover:bg-gold-600 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
            >
              <Send size={14} />
              {s('submitAnswers')}
            </button>
          </div>
        </div>
      )}

      {/* Classified result */}
      {mode === 'classified' && aiResponse?.classes && (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="bg-gradient-to-r from-navy-900 to-navy-800 px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles size={15} className="text-gold-400" />
              <span className="text-white font-semibold text-sm">
                {s('aiResultsTitle')}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gold-300 text-xs">
                {aiResponse.classes.length} {s('classesFound')}
              </span>
              {aiResponse.classes.length > 1 && (
                <button
                  type="button"
                  onClick={handleAcceptAll}
                  className="text-xs bg-gold-500 hover:bg-gold-400 text-white px-3 py-1 rounded-lg font-medium transition-colors"
                >
                  {s('acceptAll')}
                </button>
              )}
            </div>
          </div>

          {aiResponse.summary && (
            <div className="px-5 py-3 bg-navy-50 border-b border-gray-100 text-xs text-navy-700">
              {aiResponse.summary}
            </div>
          )}

          <div className="p-4 space-y-3">
            {aiResponse.classes.map(cls => {
              const accepted = acceptedClasses.has(cls.classNumber);
              return (
                <div
                  key={cls.classNumber}
                  className={`rounded-xl border-2 overflow-hidden transition-all ${
                    accepted ? 'border-emerald-400' : 'border-gray-200 hover:border-gold-300'
                  }`}
                >
                  <div className={`px-4 py-3 flex items-start gap-3 ${accepted ? 'bg-emerald-50' : 'bg-gray-50'}`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-navy-900">
                          Class {cls.classNumber}
                        </span>
                        <span className="text-sm text-gray-600">—</span>
                        <span className="text-sm text-gray-700">{cls.titleLocalized || cls.titleEn}</span>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${confidenceColor(cls.confidence)}`}>
                          {confidenceLabel(cls.confidence)} · {Math.round(cls.confidence * 100)}%
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{cls.reasoning}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => accepted ? undefined : handleAcceptClass(cls)}
                      className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        accepted
                          ? 'bg-emerald-500 text-white cursor-default'
                          : 'bg-navy-900 hover:bg-navy-700 text-white'
                      }`}
                    >
                      <CheckCircle2 size={12} />
                      {accepted ? s('accepted') : s('accept')}
                    </button>
                  </div>

                  {accepted && (
                    <div className="px-4 py-3 border-t border-gray-100 space-y-3">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Pencil size={11} className="text-gray-400" />
                        <span className="text-xs text-gray-400">{s('editDescriptions')}</span>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500 mb-1 block">
                          {s('descriptionEn')}
                        </label>
                        <textarea
                          rows={2}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-gold-400 resize-none"
                          value={classDescriptionsEn[cls.classNumber] || cls.descriptionEn}
                          onChange={e => {
                            const newEn = { ...classDescriptionsEn, [cls.classNumber]: e.target.value };
                            setClassDescriptionsEn(newEn);
                            onClassesAccepted([...acceptedClasses], newEn, classDescriptionsEs);
                          }}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500 mb-1 block">
                          {s('descriptionEs')}
                        </label>
                        <textarea
                          rows={2}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-gold-400 resize-none font-mono"
                          value={classDescriptionsEs[cls.classNumber] || cls.descriptionEs}
                          onChange={e => {
                            const newEs = { ...classDescriptionsEs, [cls.classNumber]: e.target.value };
                            setClassDescriptionsEs(newEs);
                            onClassesAccepted([...acceptedClasses], classDescriptionsEn, newEs);
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="px-4 pb-4">
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3">
              <AlertTriangle size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700">
                {s('classificationPreliminary')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Fallback keyword results */}
      {mode === 'fallback' && fallbackSuggestions.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-700">
              {s('keywordResults')}
            </span>
            <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
              {s('aiUnavailable')}
            </span>
          </div>
          <div className="p-4 space-y-2">
            {fallbackSuggestions.map(sub => (
              <div
                key={sub.classNumber}
                onClick={() => onToggleClass(sub.classNumber)}
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                  selectedClasses.includes(sub.classNumber)
                    ? 'border-gold-400 bg-gold-50'
                    : 'border-gray-200 hover:border-gold-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedClasses.includes(sub.classNumber)}
                  onChange={() => {}}
                  className="mt-0.5 rounded border-gray-300 text-gold-500"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-navy-900">Class {sub.classNumber}</span>
                    <span className="text-xs text-gray-600">{sub.titleEn}</span>
                    <span className={`ml-auto text-xs font-medium ${
                      sub.confidence > 0.7 ? 'text-green-600' : sub.confidence > 0.4 ? 'text-yellow-600' : 'text-gray-500'
                    }`}>
                      {Math.round(sub.confidence * 100)}%
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">{sub.reasons[0]}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="px-4 pb-4">
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3">
              <AlertTriangle size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700">
                {s('classificationPreliminaryShort')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Browse all classes — opens modal */}
      {(mode === 'classified' || mode === 'fallback' || mode === 'idle') && (
        <div>
          <button
            type="button"
            onClick={() => setShowClassModal(true)}
            className="flex items-center gap-1.5 text-xs text-gold-600 hover:text-gold-700 font-medium underline underline-offset-2"
          >
            {s('browseAllClasses')}
          </button>
        </div>
      )}

      {/* Selected classes summary */}
      {selectedClasses.length > 0 && (
        <div className="bg-navy-50 rounded-xl p-4 border border-navy-100">
          <div className="text-sm font-semibold text-navy-900 mb-2">
            {selectedClasses.length} {s('classesSelected')}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {selectedClasses.sort((a, b) => a - b).map(cn => {
              const nc = NICE_CLASSES_DESC.find(c => c.num === cn);
              return (
                <button
                  key={cn}
                  type="button"
                  onClick={() => onToggleClass(cn)}
                  className="bg-gold-100 hover:bg-red-100 text-gold-700 hover:text-red-600 text-xs px-2.5 py-0.5 rounded-full font-medium transition-colors flex items-center gap-1"
                >
                  Class {cn}{nc ? ` — ${nc.title}` : ''} ×
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Class selection modal */}
      {showClassModal && (
        <ClassSelectionModal
          language={language}
          selectedClasses={selectedClasses}
          onToggle={onToggleClass}
          onConfirm={() => setShowClassModal(false)}
          s={s}
        />
      )}
    </div>
  );
}

// ─── Nice class descriptions ──────────────────────────────────────────────────
interface NiceClassDesc { num: number; title: string; desc: string; category: 'goods' | 'services'; }
const NICE_CLASSES_DESC: NiceClassDesc[] = [
  { num: 1,  category: 'goods',    title: 'Chemicals',                          desc: 'Chemical substances for industry, science, photography; unprocessed plastics and artificial resins; adhesives for industrial use; manures and fertilizers.' },
  { num: 2,  category: 'goods',    title: 'Paints & Varnishes',                 desc: 'Paints, varnishes, lacquers; preservatives against rust and wood decay; colorants and dyes; inks for printing.' },
  { num: 3,  category: 'goods',    title: 'Cosmetics & Cleaning Products',       desc: 'Non-medicated cosmetics and toiletry preparations; cleaning, polishing and abrasive preparations; soaps, perfumery, essential oils.' },
  { num: 4,  category: 'goods',    title: 'Fuels & Lubricants',                 desc: 'Industrial oils and greases, wax; lubricants; fuels (including motor spirit) and illuminants; candles.' },
  { num: 5,  category: 'goods',    title: 'Pharmaceuticals',                    desc: 'Pharmaceutical and veterinary preparations; dietary supplements and meal replacements; disinfectants; pest control products.' },
  { num: 6,  category: 'goods',    title: 'Metal Goods',                        desc: 'Common metals and their alloys; metal building materials; metallic hardware and fittings; non-electric cables and wires of metal.' },
  { num: 7,  category: 'goods',    title: 'Machinery & Machine Tools',          desc: 'Machines, machine tools, motors and engines (not for land vehicles); machine parts; hand tools (power-operated).' },
  { num: 8,  category: 'goods',    title: 'Hand Tools',                         desc: 'Hand tools and implements (hand-operated); cutlery; side arms; razors.' },
  { num: 9,  category: 'goods',    title: 'Electronics & Technology',           desc: 'Computers, smartphones, tablets and software; electrical and scientific apparatus; audio-visual equipment; measuring instruments; downloadable content.' },
  { num: 10, category: 'goods',    title: 'Medical Devices',                    desc: 'Surgical, medical, dental and veterinary apparatus and instruments; prosthetics and implants; therapeutic devices; massage apparatus.' },
  { num: 11, category: 'goods',    title: 'Lighting, Heating & Appliances',     desc: 'Lighting, heating, cooling, cooking and ventilating apparatus; water supply and sanitary installations; household appliances.' },
  { num: 12, category: 'goods',    title: 'Vehicles & Transport',               desc: 'Vehicles; apparatus for locomotion by land, air or water; electric and hybrid vehicles, bicycles, aircraft, boats.' },
  { num: 13, category: 'goods',    title: 'Firearms & Ammunition',              desc: 'Firearms; ammunition and projectiles; explosives; fireworks.' },
  { num: 14, category: 'goods',    title: 'Jewelry & Watches',                  desc: 'Precious metals and alloys; jewelry, gemstones; horological and chronometric instruments.' },
  { num: 15, category: 'goods',    title: 'Musical Instruments',                desc: 'Musical instruments and accessories; music stands and holders; conductors\' batons.' },
  { num: 16, category: 'goods',    title: 'Paper & Printed Matter',             desc: 'Paper, cardboard; printed matter; bookbinding material; photographs; stationery and office requisites; instructional and educational material.' },
  { num: 17, category: 'goods',    title: 'Rubber & Insulating Materials',      desc: 'Rubber, gutta-percha, gum, asbestos and mica; semi-finished rubber/plastic goods; packing, stopping and insulating materials; pipes (not of metal).' },
  { num: 18, category: 'goods',    title: 'Leather & Bags',                     desc: 'Leather and imitations of leather; animal skins and hides; luggage and carrying bags; handbags, wallets, purses; umbrellas.' },
  { num: 19, category: 'goods',    title: 'Building Materials',                 desc: 'Non-metallic building and construction materials; non-metallic rigid pipes for building; asphalt, pitch, bitumen; non-metallic transportable structures.' },
  { num: 20, category: 'goods',    title: 'Furniture & Household Articles',     desc: 'Furniture, mirrors, picture frames; containers not of metal; unworked or semi-worked bone, horn, ivory, or shell; household decorative objects.' },
  { num: 21, category: 'goods',    title: 'Household Utensils',                 desc: 'Household and kitchen utensils and containers; cookware, tableware; glassware, porcelain and earthenware; cleaning equipment.' },
  { num: 22, category: 'goods',    title: 'Ropes & Cordage',                    desc: 'Ropes, string, nets, tents, awnings, tarpaulins, sails; sacks and bags for the transport/storage of bulk materials; padding and stuffing materials.' },
  { num: 23, category: 'goods',    title: 'Yarns & Threads',                    desc: 'Yarns and threads for textile use.' },
  { num: 24, category: 'goods',    title: 'Textiles & Fabrics',                 desc: 'Textiles and substitutes for textiles; bed covers, table covers; woven/knitted/non-woven fabrics; household linen.' },
  { num: 25, category: 'goods',    title: 'Clothing & Footwear',                desc: 'Clothing, footwear, headwear; sportswear, uniforms, lingerie, outerwear; shoes, boots, sandals; hats, caps.' },
  { num: 26, category: 'goods',    title: 'Lace & Trimmings',                   desc: 'Lace, braid, embroidery and other textile trimmings; buttons, hooks, pins, needles; artificial flowers, hair decorations.' },
  { num: 27, category: 'goods',    title: 'Carpets & Floor Coverings',          desc: 'Carpets, rugs, mats and matting; linoleum and other materials for covering existing floors; wallpapers.' },
  { num: 28, category: 'goods',    title: 'Toys & Sporting Goods',              desc: 'Games, toys and playthings; video game apparatus; gymnastic and sporting articles; Christmas tree decorations.' },
  { num: 29, category: 'goods',    title: 'Meat, Fish & Dairy Foods',           desc: 'Meat, fish, poultry and game; meat extracts; preserved, frozen, dried and cooked fruits and vegetables; eggs; milk and dairy products.' },
  { num: 30, category: 'goods',    title: 'Coffee, Tea, Bakery & Condiments',   desc: 'Coffee, tea, cocoa, sugar, rice, flour; bread, pastries, confectionery; pasta, cereals; sauces, condiments, spices.' },
  { num: 31, category: 'goods',    title: 'Fresh Fruits & Vegetables',          desc: 'Raw and unprocessed agricultural, aquacultural, horticultural and forestry products; fresh fruits and vegetables; live animals; seeds.' },
  { num: 32, category: 'goods',    title: 'Beers & Non-Alcoholic Beverages',    desc: 'Beers; non-alcoholic beverages; mineral and aerated waters; fruit and vegetable juices; energy drinks; sports drinks.' },
  { num: 33, category: 'goods',    title: 'Wines & Spirits',                    desc: 'Alcoholic beverages (except beers); wine, spirits, liqueurs, cider.' },
  { num: 34, category: 'goods',    title: 'Tobacco & Smoking Articles',         desc: 'Tobacco and tobacco substitutes; cigarettes; cigars; electronic cigarettes; smokers\' articles; matches.' },
  { num: 35, category: 'services', title: 'Advertising & Business Services',    desc: 'Advertising and marketing services; business management, organization and administration; office and clerical services; retail and wholesale services; e-commerce.' },
  { num: 36, category: 'services', title: 'Insurance & Financial Services',     desc: 'Insurance services; financial and monetary affairs; banking; real estate; cryptocurrency and digital asset services.' },
  { num: 37, category: 'services', title: 'Construction & Repair Services',     desc: 'Construction services; installation and repair services; maintenance of buildings and machines; cleaning services.' },
  { num: 38, category: 'services', title: 'Telecommunications',                 desc: 'Telecommunications services; broadcasting; internet and data communication; messaging and online platform services.' },
  { num: 39, category: 'services', title: 'Transport & Logistics',              desc: 'Transport and shipping; packaging and storage of goods; travel arrangement; courier and delivery services; logistics.' },
  { num: 40, category: 'services', title: 'Material Treatment & Manufacturing', desc: 'Treatment of materials; recycling; printing; food processing and transformation.' },
  { num: 41, category: 'services', title: 'Education & Entertainment',          desc: 'Education and training; entertainment; sporting and cultural activities; content publishing; gaming services.' },
  { num: 42, category: 'services', title: 'Scientific & Technology Services',   desc: 'Scientific research; software design and development; IT and cloud services; artificial intelligence; cybersecurity; SaaS.' },
  { num: 43, category: 'services', title: 'Food & Beverage Services',           desc: 'Services for providing food and drink; restaurant, café and catering services; hotel and temporary accommodation.' },
  { num: 44, category: 'services', title: 'Medical & Beauty Services',          desc: 'Medical, dental and veterinary services; health care; beauty and cosmetic treatment; spa and wellness services.' },
  { num: 45, category: 'services', title: 'Legal & Security Services',          desc: 'Legal services; intellectual property services; trademark and patent services; security and investigation services; personal and social services.' },
];

interface ClassModalProps {
  language: Lang;
  selectedClasses: number[];
  onToggle: (num: number) => void;
  onConfirm: () => void;
  s: (key: string) => string;
}

function ClassSelectionModal({ language: _lang, selectedClasses, onToggle, onConfirm, s }: ClassModalProps) {
  const [filter, setFilter] = useState<'all' | 'goods' | 'services'>('all');
  const visible = filter === 'all' ? NICE_CLASSES_DESC : NICE_CLASSES_DESC.filter(c => c.category === filter);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-navy-900 px-6 py-4 rounded-t-2xl flex items-start justify-between gap-4">
          <div>
            <h3 className="text-white font-bold text-base">{s('classModalTitle')}</h3>
            <p className="text-navy-300 text-xs mt-0.5">{s('classModalSubtitle')}</p>
          </div>
          <button type="button" onClick={onConfirm} className="text-navy-400 hover:text-white transition-colors mt-0.5 flex-shrink-0">
            <X size={18} />
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex bg-gray-50 border-b border-gray-100 px-4 pt-3 gap-2">
          {(['all', 'goods', 'services'] as const).map(f => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors ${filter === f ? 'border-gold-500 text-gold-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              {f === 'all' ? 'All 45' : f === 'goods' ? `${s('goods')} (1–34)` : `${s('services')} (35–45)`}
            </button>
          ))}
          {selectedClasses.length > 0 && (
            <span className="ml-auto pb-2.5 text-xs font-semibold text-gold-700 self-end">
              {selectedClasses.length} {s('classesSelected')}
            </span>
          )}
        </div>

        {/* Class list */}
        <div className="overflow-y-auto flex-1 p-4 space-y-2">
          {visible.map(nc => {
            const selected = selectedClasses.includes(nc.num);
            return (
              <div
                key={nc.num}
                onClick={() => onToggle(nc.num)}
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  selected ? 'border-gold-400 bg-gold-50' : 'border-gray-200 hover:border-gold-300 hover:bg-gold-50/30'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={() => {}}
                  className="mt-0.5 rounded border-gray-300 text-gold-500 focus:ring-gold-400 flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-navy-900 bg-navy-100 px-1.5 py-0.5 rounded">
                      Class {nc.num}
                    </span>
                    <span className="text-sm font-semibold text-navy-800">{nc.title}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${nc.category === 'goods' ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'}`}>
                      {nc.category === 'goods' ? s('goods') : s('services')}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">{nc.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 px-6 py-4 flex items-center justify-between gap-3">
          <span className="text-sm text-gray-500">
            {selectedClasses.length} {s('classesSelected')}
          </span>
          <button
            type="button"
            onClick={onConfirm}
            className="flex items-center gap-2 bg-gold-500 hover:bg-gold-600 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors text-sm"
          >
            <CheckCircle2 size={15} />
            {s('classModalConfirm')}
          </button>
        </div>
      </div>
    </div>
  );
}
