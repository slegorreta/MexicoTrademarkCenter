import { useState, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Sparkles, Upload, X, ArrowRight, RefreshCw, Loader2, Image as ImageIcon, CheckCircle2, Lightbulb } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { supabase } from '../lib/supabase';
import TrademarkClearancePanel from '../components/TrademarkClearancePanel';

interface IdeaCard {
  name: string;
  style: string;
  rationale: string;
  rationaleZh: string;
}

interface InspirationImage {
  file: File;
  preview: string;
  base64: string;
  mimeType: string;
}

type Phase = 'input' | 'ideas';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const styleColors: Record<string, string> = {
  'Invented word':    'bg-blue-100 text-blue-700',
  'Evocative':        'bg-teal-100 text-teal-700',
  'Compound':         'bg-violet-100 text-violet-700',
  'Foreign word':     'bg-orange-100 text-orange-700',
  'Adapted spelling': 'bg-rose-100 text-rose-700',
  'Metaphorical':     'bg-green-100 text-green-700',
  // German equivalents returned by AI
  'Erfundenes Wort':     'bg-blue-100 text-blue-700',
  'Evokativ':            'bg-teal-100 text-teal-700',
  'Zusammengesetzt':     'bg-violet-100 text-violet-700',
  'Fremdwort':           'bg-orange-100 text-orange-700',
  'Angepasste Schreibweise': 'bg-rose-100 text-rose-700',
  'Metaphorisch':        'bg-green-100 text-green-700',
  // French equivalents returned by AI
  'Mot inventé':         'bg-blue-100 text-blue-700',
  'Évocateur':           'bg-teal-100 text-teal-700',
  'Composé':             'bg-violet-100 text-violet-700',
  'Mot étranger':        'bg-orange-100 text-orange-700',
  'Orthographe adaptée': 'bg-rose-100 text-rose-700',
  'Métaphorique':        'bg-green-100 text-green-700',
  // Hindi equivalents returned by AI
  'आविष्कृत शब्द':      'bg-blue-100 text-blue-700',
  'उद्बोधक':            'bg-teal-100 text-teal-700',
  'संयुक्त शब्द':       'bg-violet-100 text-violet-700',
  'विदेशी शब्द':        'bg-orange-100 text-orange-700',
  'अनुकूलित वर्तनी':   'bg-rose-100 text-rose-700',
  'रूपक':               'bg-green-100 text-green-700',
  // Portuguese equivalents returned by AI
  'Palavra inventada':   'bg-blue-100 text-blue-700',
  'Evocativo':           'bg-teal-100 text-teal-700',
  'Composto':            'bg-violet-100 text-violet-700',
  'Palavra estrangeira': 'bg-orange-100 text-orange-700',
  'Ortografia adaptada': 'bg-rose-100 text-rose-700',
  'Metafórico':          'bg-green-100 text-green-700',
};

function styleClass(style: string): string {
  return styleColors[style] || 'bg-gray-100 text-gray-600';
}

export default function TrademarkIdeaPage() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const zh = language === 'zh';
  const es = language === 'es';
  const de = language === 'de';
  const fr = language === 'fr';
  const hi = language === 'hi';
  const pt = language === 'pt';
  const tri = (enStr: string, zhStr: string, esStr: string, deStr?: string, frStr?: string, hiStr?: string, ptStr?: string) =>
    zh ? zhStr : es ? esStr : de ? (deStr ?? enStr) : fr ? (frStr ?? enStr) : hi ? (hiStr ?? enStr) : pt ? (ptStr ?? enStr) : enStr;

  const [phase, setPhase] = useState<Phase>('input');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<InspirationImage[]>([]);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState('');
  const [ideas, setIdeas] = useState<IdeaCard[]>([]);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Restore session from URL param
  const sessionParam = searchParams.get('session');
  const sessionRestored = useRef(false);
  if (sessionParam && !sessionRestored.current) {
    sessionRestored.current = true;
    supabase
      .from('trademark_idea_sessions')
      .select('description, ideas')
      .eq('session_token', sessionParam)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setDescription(data.description);
          setIdeas(data.ideas as IdeaCard[]);
          setPhase('ideas');
        }
      });
  }

  const readFileAsBase64 = (file: File): Promise<{ base64: string; preview: string }> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        const base64 = dataUrl.split(',')[1];
        resolve({ base64, preview: dataUrl });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleImageAdd = useCallback(async (files: FileList | null) => {
    if (!files) return;
    const remaining = 3 - images.length;
    const toAdd = Array.from(files).slice(0, remaining);
    const newImages: InspirationImage[] = [];
    for (const file of toAdd) {
      if (!file.type.match(/^image\//)) continue;
      const { base64, preview } = await readFileAsBase64(file);
      newImages.push({ file, preview, base64, mimeType: file.type });
    }
    setImages(prev => [...prev, ...newImages]);
  }, [images.length]);

  const removeImage = (idx: number) => {
    setImages(prev => prev.filter((_, i) => i !== idx));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleImageAdd(e.dataTransfer.files);
  };

  const generate = async () => {
    if (!description.trim()) return;
    setGenerating(true);
    setGenError('');

    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/generate-trademark-ideas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          description: description.trim(),
          inspirationImages: images.map(img => ({ base64: img.base64, mimeType: img.mimeType })),
          language,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ideas) throw new Error(data.error || 'Generation failed');

      const generatedIdeas: IdeaCard[] = data.ideas;
      setIdeas(generatedIdeas);
      setCheckedIds(new Set());
      setSelectedName(null);
      setPhase('ideas');

      // Persist session
      const token = crypto.randomUUID();
      sessionStorage.setItem('ideaSessionToken', token);
      await supabase.from('trademark_idea_sessions').insert({
        session_token: token,
        description: description.trim(),
        ideas: generatedIdeas,
      });
    } catch (err) {
      setGenError(err instanceof Error ? err.message : tri(
        'Something went wrong. Please try again.',
        '出错了，请再试一次。',
        'Algo salió mal. Inténtalo de nuevo.',
        'Etwas ist schiefgelaufen. Bitte erneut versuchen.',
        'Une erreur s\'est produite. Veuillez réessayer.',
        'कुछ गलत हुआ। कृपया पुनः प्रयास करें।'
      ));
    } finally {
      setGenerating(false);
    }
  };

  const useIdea = (name: string) => {
    sessionStorage.setItem('suggestedMarkName', name);
    navigate('/apply');
  };

  const toggleCheck = (name: string) => {
    setCheckedIds(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-4">
            {tri(
              'Trademark Idea Generator',
              '商标创意生成器',
              'Generador de Ideas para Marcas',
              'Markenideen-Generator',
              'Générateur d\'idées de marques',
              'ट्रेडमार्क विचार जनरेटर'
            )}
          </h1>
          <p className="text-lg text-gray-300 max-w-2xl leading-relaxed">
            {tri(
              "Describe your business and upload inspiration marks. Our AI will suggest creative, distinctive trademark names — then verify they're not already taken.",
              '描述您的业务并上传灵感商标图片，我们的AI将为您建议独特的商标名称，并自动验证是否已被注册。',
              'Describe tu negocio y sube marcas de inspiración. Nuestra IA sugerirá nombres creativos y distintivos — y verificará si ya están registrados.',
              'Beschreiben Sie Ihr Unternehmen und laden Sie Inspirationsmarken hoch. Unsere KI schlägt kreative, unverwechselbare Markennamen vor — und prüft, ob sie bereits vergeben sind.',
              'Décrivez votre activité et téléchargez des marques d\'inspiration. Notre IA suggère des noms créatifs et distinctifs — puis vérifie s\'ils sont déjà pris.',
              'अपने व्यवसाय का वर्णन करें और प्रेरणा मार्क अपलोड करें। हमारी AI रचनात्मक, विशिष्ट ट्रेडमार्क नाम सुझाएगी — फिर जांचेगी कि वे पहले से पंजीकृत हैं या नहीं।'
            )}
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {phase === 'input' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 lg:p-8">
            <div className="space-y-6">
              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  {tri(
                    'Describe your products or services *',
                    '描述您的产品或服务 *',
                    'Describe tus productos o servicios *',
                    'Beschreiben Sie Ihre Produkte oder Dienstleistungen *',
                    'Décrivez vos produits ou services *',
                    'अपने उत्पाद या सेवाओं का वर्णन करें *'
                  )}
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  {tri(
                    'Tell us what you sell, who your customers are, and any style or feeling you want the brand to convey.',
                    '告诉我们您销售什么，客户是谁，以及您希望品牌传达的风格或感受。',
                    'Cuéntanos qué vendes, quiénes son tus clientes y el estilo o sensación que quieres que transmita tu marca.',
                    'Teilen Sie uns mit, was Sie verkaufen, wer Ihre Kunden sind und welchen Stil oder welches Gefühl die Marke vermitteln soll.',
                    'Dites-nous ce que vous vendez, qui sont vos clients et le style ou l\'image que vous souhaitez que la marque véhicule.',
                    'हमें बताएं कि आप क्या बेचते हैं, आपके ग्राहक कौन हैं, और ब्रांड से आप कौन सी शैली या भावना व्यक्त करना चाहते हैं।'
                  )}
                </p>
                <textarea
                  rows={5}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent resize-none"
                  placeholder={tri(
                    'e.g. We sell premium wireless earbuds targeting young professionals who commute. Clean, modern, tech-forward feel...',
                    '例如：我们销售高端无线耳机，面向通勤的年轻专业人士，风格简洁、现代、科技感强……',
                    'Ej. Vendemos audífonos inalámbricos premium para jóvenes profesionales. Estilo limpio, moderno y tecnológico...',
                    'z. B. Wir verkaufen Premium-Funkkopfhörer für berufstätige Pendler. Klares, modernes, technologisches Design...',
                    'ex. Nous vendons des écouteurs sans fil premium pour les jeunes actifs en déplacement. Style épuré, moderne et technologique...',
                    'उदा. हम कामकाजी युवा पेशेवरों के लिए प्रीमियम वायरलेस ईयरबड बेचते हैं। साफ, आधुनिक, तकनीक-केंद्रित शैली...'
                  )}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
              </div>

              {/* Inspiration images */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  {tri(
                    'Upload inspiration marks (optional, up to 3)',
                    '上传灵感商标图片（可选，最多3张）',
                    'Sube marcas de inspiración (opcional, hasta 3)',
                    'Inspirationsmarken hochladen (optional, max. 3)',
                    'Télécharger des marques d\'inspiration (optionnel, max. 3)',
                    'प्रेरणा मार्क अपलोड करें (वैकल्पिक, अधिकतम 3)'
                  )}
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  {tri(
                    'Upload logos or marks whose visual style you admire. The AI will use them to inspire naming choices.',
                    '上传您喜欢风格的商标或标志，AI将从中汲取灵感来建议名称。',
                    'Sube logos o marcas cuyo estilo visual admiras. La IA los usará para inspirar las sugerencias de nombres.',
                    'Laden Sie Logos oder Marken hoch, deren visuellen Stil Sie schätzen. Die KI verwendet sie als Inspiration für Namensvorschläge.',
                    'Téléchargez des logos ou marques dont vous aimez le style visuel. L\'IA s\'en inspirera pour proposer des noms.',
                    'ऐसे लोगो या मार्क अपलोड करें जिनकी दृश्य शैली आप पसंद करते हैं। AI उन्हें नाम सुझाव के लिए प्रेरणा के रूप में उपयोग करेगी।'
                  )}
                </p>

                {images.length < 3 && (
                  <div
                    onDrop={handleDrop}
                    onDragOver={e => e.preventDefault()}
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 hover:border-gold-400 rounded-xl p-6 text-center cursor-pointer transition-colors group"
                  >
                    <Upload size={24} className="mx-auto text-gray-400 group-hover:text-gold-500 mb-2 transition-colors" />
                    <p className="text-sm text-gray-500 group-hover:text-gray-700">
                      {tri(
                        'Click or drag images here',
                        '点击或拖拽图片到此处',
                        'Haz clic o arrastra imágenes aquí',
                        'Klicken oder Bilder hierher ziehen',
                        'Cliquer ou glisser des images ici',
                        'यहाँ क्लिक करें या छवियाँ खींचें'
                      )}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">JPG, PNG, SVG</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={e => handleImageAdd(e.target.files)}
                    />
                  </div>
                )}

                {images.length > 0 && (
                  <div className="flex gap-3 mt-3 flex-wrap">
                    {images.map((img, i) => (
                      <div key={i} className="relative group">
                        <img
                          src={img.preview}
                          alt={`Inspiration ${i + 1}`}
                          className="w-20 h-20 object-cover rounded-xl border border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(i)}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {genError && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
                  <X size={15} className="flex-shrink-0" />
                  {genError}
                </div>
              )}

              <button
                type="button"
                onClick={generate}
                disabled={generating || !description.trim()}
                className="w-full flex items-center justify-center gap-2 bg-gold-500 hover:bg-gold-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl text-base transition-colors shadow-md"
              >
                {generating
                  ? <><Loader2 size={18} className="animate-spin" />{tri('Generating ideas…', '正在生成创意…', 'Generando ideas…', 'Ideen werden generiert…', 'Génération des idées…', 'विचार उत्पन्न हो रहे हैं…')}</>
                  : <><Sparkles size={18} />{tri('Generate Trademark Ideas', '生成商标创意', 'Generar Ideas para mi Marca', 'Markenideen generieren', 'Générer des idées de marques', 'ट्रेडमार्क विचार उत्पन्न करें')}</>
                }
              </button>
            </div>
          </div>
        )}

        {phase === 'ideas' && (
          <div className="space-y-6">
            {/* Controls */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h2 className="text-xl font-bold text-navy-900">
                  {tri('Your Trademark Ideas', '您的商标创意', 'Ideas para tu Marca', 'Ihre Markenideen', 'Vos idées de marques', 'आपके ट्रेडमार्क विचार')}
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  {tri(
                    'Click "Check Availability" on any idea, then "Use This Name" to start filing.',
                    '点击"检索可用性"查看任何创意，然后点击"使用此名称"开始申请。',
                    'Haz clic en "Verificar disponibilidad" y luego en "Usar este nombre" para iniciar tu registro.',
                    'Klicken Sie auf "Verfügbarkeit prüfen" und dann auf "Diesen Namen verwenden", um die Anmeldung zu starten.',
                    'Cliquez sur "Vérifier la disponibilité" puis sur "Utiliser ce nom" pour démarrer le dépôt.',
                    '"उपलब्धता जांचें" पर क्लिक करें, फिर आवेदन शुरू करने के लिए "इस नाम का उपयोग करें" दबाएं।'
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPhase('input');
                  setIdeas([]);
                  setCheckedIds(new Set());
                }}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-navy-900 border border-gray-200 hover:border-gray-300 px-4 py-2 rounded-lg transition-colors"
              >
                <RefreshCw size={14} />
                {tri('Try new description', '重新描述', 'Intentar nueva descripción', 'Neue Beschreibung versuchen', 'Essayer une nouvelle description', 'नया विवरण आज़माएं')}
              </button>
            </div>

            {/* Ideas grid */}
            <div className="grid sm:grid-cols-2 gap-4">
              {ideas.map((idea) => {
                const isChecked = checkedIds.has(idea.name);
                const rationaleText = (de || fr || hi || pt) && idea.rationale
                  ? idea.rationale
                  : zh && idea.rationaleZh
                  ? idea.rationaleZh
                  : idea.rationale;
                return (
                  <div
                    key={idea.name}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
                  >
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <h3 className="text-xl font-bold text-navy-900 leading-tight">{idea.name}</h3>
                          <span className={`inline-block mt-1.5 text-xs font-medium px-2.5 py-0.5 rounded-full ${styleClass(idea.style)}`}>
                            {idea.style}
                          </span>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-navy-50 flex items-center justify-center flex-shrink-0">
                          <Lightbulb size={18} className="text-navy-400" />
                        </div>
                      </div>

                      <p className="text-sm text-gray-600 leading-relaxed">
                        {rationaleText}
                      </p>

                      {/* Clearance panel */}
                      {isChecked && (
                        <TrademarkClearancePanel
                          markName={idea.name}
                          classes={[]}
                          language={(language === 'zh' ? 'zh' : language === 'es' ? 'es' : language === 'de' ? 'de' : language === 'fr' ? 'fr' : language === 'hi' ? 'hi' : language === 'pt' ? 'pt' : 'en') as 'en' | 'zh' | 'es' | 'de' | 'fr' | 'hi' | 'pt'}
                          autoRun={true}
                        />
                      )}
                    </div>

                    <div className="border-t border-gray-50 px-5 py-3 flex gap-2 bg-gray-50/50">
                      {!isChecked ? (
                        <button
                          type="button"
                          onClick={() => toggleCheck(idea.name)}
                          className="flex-1 text-sm font-medium text-gray-600 hover:text-navy-900 border border-gray-200 hover:border-gray-300 px-3 py-2 rounded-lg transition-colors"
                        >
                          {tri('Check Availability', '检索可用性', 'Verificar disponibilidad', 'Verfügbarkeit prüfen', 'Vérifier la disponibilité', 'उपलब्धता जांचें')}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => toggleCheck(idea.name)}
                          className="flex-1 text-sm font-medium text-emerald-600 border border-emerald-200 bg-emerald-50 px-3 py-2 rounded-lg flex items-center justify-center gap-1.5"
                        >
                          <CheckCircle2 size={13} />
                          {tri('Checking…', '检索中…', 'Verificando…', 'Wird geprüft…', 'Vérification…', 'जांच हो रही है…')}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => { setSelectedName(idea.name); useIdea(idea.name); }}
                        className="flex-1 flex items-center justify-center gap-1.5 text-sm font-semibold bg-gold-500 hover:bg-gold-600 text-white px-3 py-2 rounded-lg transition-colors"
                      >
                        {tri('Use This Name', '使用此名称', 'Usar este nombre', 'Diesen Namen verwenden', 'Utiliser ce nom', 'इस नाम का उपयोग करें')}
                        <ArrowRight size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Re-generate */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={generate}
                disabled={generating}
                className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-navy-900 transition-colors"
              >
                {generating
                  ? <><Loader2 size={14} className="animate-spin" />{tri('Generating…', '生成中…', 'Generando…', 'Wird generiert…', 'Génération…', 'उत्पन्न हो रहा है…')}</>
                  : <><RefreshCw size={14} />{tri('Generate different ideas with same description', '使用相同描述生成不同创意', 'Generar ideas diferentes con la misma descripción', 'Andere Ideen mit gleicher Beschreibung generieren', 'Générer des idées différentes avec la même description', 'उसी विवरण से अलग विचार उत्पन्न करें')}</>
                }
              </button>
            </div>

            {/* Disclaimer */}
            <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
              <ImageIcon size={14} className="text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-600 leading-relaxed">
                {tri(
                  'Availability checks are preliminary and do not constitute a formal clearance search. Always consult a trademark attorney before filing.',
                  '可用性检索仅为初步筛查，不构成正式检索意见。在提交申请前，请务必咨询商标代理人。',
                  'Las verificaciones de disponibilidad son preliminares y no constituyen una búsqueda formal. Consulta a un especialista en marcas antes de presentar tu solicitud.',
                  'Verfügbarkeitsprüfungen sind vorläufig und stellen keine formelle Recherche dar. Konsultieren Sie vor der Anmeldung stets einen Markenanwalt.',
                  'Les vérifications de disponibilité sont préliminaires et ne constituent pas une recherche d\'antériorité formelle. Consultez toujours un avocat spécialisé en marques avant de déposer.',
                  'उपलब्धता जांच प्रारंभिक है और औपचारिक क्लीयरेंस खोज नहीं है। आवेदन करने से पहले हमेशा ट्रेडमार्क वकील से परामर्श लें।'
                )}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
