import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Search, ArrowRight, Shield, Sparkles, CheckCircle2, FileText, HelpCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import TrademarkClearancePanel from '../components/TrademarkClearancePanel';

type Lang = 'en' | 'zh' | 'es' | 'de' | 'fr' | 'hi' | 'pt' | 'ja';

const copy: Record<string, Record<Lang, string>> = {
  badge: {
    en: 'Free Pre-Clearance Search',
    zh: '免费商标预检索',
    es: 'Búsqueda de Pre-Autorización Gratuita',
    de: 'Kostenlose Vorabrecherche',
    fr: 'Recherche préliminaire gratuite',
    hi: 'मुफ़्त प्री-क्लीयरेंस खोज',
    pt: 'Pesquisa Gratuita de Pré-Autorização',
  },
  headline: {
    en: 'Review Your Trademark for Free and Get Your Registrability Report',
    zh: '免费检索您的商标并获取可注册性报告',
    es: 'Revisa tu Marca Gratis y Obtén tu Reporte de Registrabilidad',
    de: 'Ihre Marke kostenlos prüfen und Ihren Registrierbarkeitsbericht erhalten',
    fr: 'Vérifiez votre marque gratuitement et obtenez votre rapport de disponibilité',
    hi: 'अपना ट्रेडमार्क मुफ़्त जांचें और अपनी पंजीयनीयता रिपोर्ट प्राप्त करें',
    pt: 'Verifique sua marca gratuitamente e obtenha seu Relatório de Registrabilidade',
  },
  sub: {
    en: 'Get a structured clearance analysis including DuPont factor breakdown, distinctiveness assessment, and conflicting marks — powered by AI and the official IMPI MARCia database.',
    zh: '获取结构化的商标检索分析，包括杜邦因素分解、显著性评估和冲突商标识别——由AI和官方IMPI MARCia数据库提供支持。',
    es: 'Obtén un análisis de disponibilidad estructurado que incluye el análisis de factores DuPont, evaluación de distintividad y marcas en conflicto — impulsado por IA y la base de datos oficial IMPI MARCia.',
    de: 'Erhalten Sie eine strukturierte Recherche-Analyse mit DuPont-Faktor-Aufschlüsselung, Unterscheidungskraft-Bewertung und konfliktierenden Marken — powered by KI und der offiziellen IMPI MARCia-Datenbank.',
    fr: "Obtenez une analyse de disponibilité structurée incluant l'analyse des facteurs DuPont, l'évaluation de la distinctivité et les marques conflictuelles — propulsée par l'IA et la base officielle IMPI MARCia.",
    hi: 'एक संरचित क्लीयरेंस विश्लेषण प्राप्त करें जिसमें DuPont कारक विश्लेषण, विशिष्टता मूल्यांकन और विरोधाभासी चिह्न शामिल हैं — AI और आधिकारिक IMPI MARCia डेटाबेस द्वारा संचालित।',
    pt: 'Obtenha uma análise de disponibilidade estruturada incluindo análise dos fatores DuPont, avaliação de distintividade e marcas conflitantes — desenvolvida por IA e pela base oficial IMPI MARCia.',
  },
  inputLabel: {
    en: 'Proposed trademark name',
    zh: '拟注册商标名称',
    es: 'Nombre de marca propuesto',
    de: 'Vorgeschlagener Markenname',
    fr: 'Nom de marque proposé',
    hi: 'प्रस्तावित ट्रेडमार्क नाम',
    pt: 'Nome de marca proposto',
  },
  placeholder: {
    en: 'e.g. Nexora, BluePeak, AeroFit…',
    zh: '例如：Nexora、BluePeak、AeroFit…',
    es: 'ej. Nexora, BluePeak, AeroFit…',
    de: 'z. B. Nexora, BluePeak, AeroFit…',
    fr: 'ex. Nexora, BluePeak, AeroFit…',
    hi: 'उदा. Nexora, BluePeak, AeroFit…',
    pt: 'ex. Nexora, BluePeak, AeroFit…',
  },
  goodsLabel: {
    en: 'Goods or services covered',
    zh: '涵盖的商品或服务',
    es: 'Productos o servicios cubiertos',
    de: 'Erfasste Waren oder Dienstleistungen',
    fr: 'Produits ou services couverts',
    hi: 'शामिल माल या सेवाएं',
    pt: 'Produtos ou serviços cobertos',
  },
  goodsPlaceholder: {
    en: 'e.g. athletic footwear, sports apparel, and fitness accessories…',
    zh: '例如：运动鞋、运动服装及健身配件…',
    es: 'ej. calzado deportivo, ropa deportiva y accesorios de fitness…',
    de: 'z. B. Sportschuhe, Sportbekleidung und Fitnessaccessoires…',
    fr: 'ex. chaussures de sport, vêtements de sport et accessoires de fitness…',
    hi: 'उदा. खेल जूते, खेल परिधान और फिटनेस एक्सेसरीज़…',
    pt: 'ex. calçados esportivos, roupas esportivas e acessórios de fitness…',
  },
  goodsRequired: {
    en: 'Required for DuPont likelihood-of-confusion analysis',
    zh: '杜邦混淆可能性分析所必需',
    es: 'Requerido para el análisis de probabilidad de confusión DuPont',
    de: 'Erforderlich für die DuPont-Verwechslungswahrscheinlichkeits-Analyse',
    fr: "Requis pour l'analyse DuPont de probabilité de confusion",
    hi: 'DuPont भ्रम संभावना विश्लेषण के लिए आवश्यक',
    pt: 'Necessário para a análise DuPont de probabilidade de confusão',
    ja: 'DuPont混同可能性分析に必要',
  },
  trademarkNameTooltip: {
    en: 'The word, phrase, or combination of letters you want to register as a trademark in Mexico. This is the name that will appear on your registration certificate and that you will have exclusive rights to use for your goods or services.',
    zh: '您希望在墨西哥注册为商标的单词、短语或字母组合。这是将出现在您注册证书上的名称，您将对其在商品或服务上的使用拥有专属权利。',
    es: 'La palabra, frase o combinación de letras que deseas registrar como marca en México. Este es el nombre que aparecerá en tu certificado de registro y sobre el cual tendrás derechos exclusivos de uso para tus productos o servicios.',
    de: 'Das Wort, der Satz oder die Buchstabenkombination, die Sie als Marke in Mexiko registrieren möchten. Dies ist der Name, der auf Ihrer Registrierungsurkunde erscheint und den Sie exklusiv für Ihre Waren oder Dienstleistungen nutzen dürfen.',
    fr: 'Le mot, la phrase ou la combinaison de lettres que vous souhaitez enregistrer comme marque au Mexique. C\'est le nom qui figurera sur votre certificat d\'enregistrement et sur lequel vous aurez des droits exclusifs d\'utilisation pour vos produits ou services.',
    hi: 'वह शब्द, वाक्यांश या अक्षरों का संयोजन जिसे आप मेक्सिको में ट्रेडमार्क के रूप में पंजीकृत करना चाहते हैं। यही वह नाम है जो आपके पंजीकरण प्रमाणपत्र पर दिखेगा और जिसका उपयोग आप अपने माल या सेवाओं के लिए विशेष रूप से कर सकेंगे।',
    pt: 'A palavra, frase ou combinação de letras que você deseja registrar como marca no México. Este é o nome que constará no seu certificado de registro e sobre o qual você terá direitos exclusivos de uso para seus produtos ou serviços.',
    ja: 'メキシコで商標として登録したい単語、フレーズ、または文字の組み合わせです。これは登録証明書に記載され、あなたの商品やサービスに対して独占的に使用する権利を持つ名称です。',
  },
  goodsTooltip: {
    en: 'A description of the products or services your trademark will be used with. In Mexico, trademarks are registered in one or more of 45 international Nice Classification classes. A clear and specific description helps the examiner assess conflicts with existing marks and determines the scope of your protection.',
    zh: '您的商标将用于的商品或服务的描述。在墨西哥，商标在45个国际尼斯分类类别中的一个或多个中注册。清晰具体的描述有助于审查员评估与现有商标的冲突，并确定您的保护范围。',
    es: 'Una descripción de los productos o servicios con los que se usará tu marca. En México, las marcas se registran en una o más de las 45 clases de la Clasificación Internacional de Niza. Una descripción clara y específica ayuda al examinador a evaluar conflictos con marcas existentes y determina el alcance de tu protección.',
    de: 'Eine Beschreibung der Waren oder Dienstleistungen, mit denen Ihre Marke verwendet wird. In Mexiko werden Marken in einer oder mehreren der 45 internationalen Nizza-Klassifikationsklassen eingetragen. Eine klare und spezifische Beschreibung hilft dem Prüfer, Konflikte mit bestehenden Marken zu bewerten, und bestimmt den Umfang Ihres Schutzes.',
    fr: 'Une description des produits ou services avec lesquels votre marque sera utilisée. Au Mexique, les marques sont enregistrées dans une ou plusieurs des 45 classes de la Classification internationale de Nice. Une description claire et précise aide l\'examinateur à évaluer les conflits avec les marques existantes et détermine l\'étendue de votre protection.',
    hi: 'आपके ट्रेडमार्क के साथ उपयोग की जाने वाली वस्तुओं या सेवाओं का विवरण। मेक्सिको में, ट्रेडमार्क 45 अंतर्राष्ट्रीय नाइस वर्गीकरण वर्गों में से एक या अधिक में पंजीकृत होते हैं। एक स्पष्ट और विशिष्ट विवरण परीक्षक को मौजूदा चिह्नों के साथ टकराव का आकलन करने में मदद करता है और आपकी सुरक्षा के दायरे को निर्धारित करता है।',
    pt: 'Uma descrição dos produtos ou serviços com os quais sua marca será usada. No México, as marcas são registradas em uma ou mais das 45 classes da Classificação Internacional de Nice. Uma descrição clara e específica ajuda o examinador a avaliar conflitos com marcas existentes e determina o escopo da sua proteção.',
    ja: '商標が使用される商品またはサービスの説明です。メキシコでは、商標は45のニース国際分類クラスの1つ以上に登録されます。明確で具体的な説明は、審査官が既存の商標との競合を評価するのに役立ち、保護の範囲を決定します。',
  },
  searchBtn: {
    en: 'Run Full Clearance Analysis',
    zh: '开始完整检索分析',
    es: 'Ejecutar Análisis Completo',
    de: 'Vollständige Analyse starten',
    fr: 'Lancer l\'analyse complète',
    hi: 'पूर्ण क्लीयरेंस विश्लेषण चलाएं',
    pt: 'Executar Análise Completa',
  },
  readyToFile: {
    en: 'Ready to protect your mark?',
    zh: '准备好保护您的商标了吗？',
    es: '¿Listo para proteger tu marca?',
    de: 'Bereit, Ihre Marke zu schützen?',
    fr: 'Prêt à protéger votre marque ?',
    hi: 'अपनी मार्क सुरक्षित करने के लिए तैयार हैं?',
    pt: 'Pronto para proteger sua marca?',
  },
  startFiling: {
    en: 'Start Trademark Filing — $270/class',
    zh: '开始商标注册 — $270/类',
    es: 'Iniciar Registro de Marca — $270/clase',
    de: 'Markenanmeldung starten — $270/Klasse',
    fr: 'Déposer ma marque — $270/classe',
    hi: 'ट्रेडमार्क दाखिल करना शुरू करें — $270/वर्ग',
    pt: 'Iniciar Registro — $270/classe',
  },
  noName: {
    en: "Don't have a name yet?",
    zh: '还没有商标名称？',
    es: '¿Aún no tienes un nombre?',
    de: 'Noch keinen Markennamen?',
    fr: "Vous n'avez pas encore de nom ?",
    hi: 'अभी तक नाम नहीं है?',
    pt: 'Ainda não tem um nome?',
  },
  tryAI: {
    en: 'Generate ideas with AI',
    zh: '用AI生成商标创意',
    es: 'Generar ideas con IA',
    de: 'Ideen mit KI generieren',
    fr: "Générer des idées avec l'IA",
    hi: 'AI से विचार उत्पन्न करें',
    pt: 'Gerar ideias com IA',
  },
  features: {
    en: 'IMPI MARCia Database · DuPont Analysis · Distinctiveness Score · Domain Availability',
    zh: 'IMPI MARCia数据库 · 杜邦因素分析 · 显著性评分 · 域名可用性',
    es: 'Base IMPI MARCia · Análisis DuPont · Puntuación de Distintividad · Disponibilidad de Dominio',
    de: 'IMPI MARCia-Datenbank · DuPont-Analyse · Unterscheidungskraft · Domainverfügbarkeit',
    fr: 'Base IMPI MARCia · Analyse DuPont · Score de distinctivité · Disponibilité des domaines',
    hi: 'IMPI MARCia डेटाबेस · DuPont विश्लेषण · विशिष्टता स्कोर · डोमेन उपलब्धता',
    pt: 'Base IMPI MARCia · Análise DuPont · Pontuação de Distintividade · Disponibilidade de Domínio',
  },
  searchAgain: {
    en: 'Search another mark',
    zh: '搜索另一个商标',
    es: 'Buscar otra marca',
    de: 'Weitere Marke suchen',
    fr: 'Rechercher une autre marque',
    hi: 'एक और ट्रेडमार्क खोजें',
    pt: 'Pesquisar outra marca',
  },
};

function InfoTooltip({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-flex items-center">
      <button
        type="button"
        aria-label="More information"
        onClick={() => setOpen(v => !v)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className="inline-flex items-center justify-center text-gray-400 hover:text-gold-300 transition-colors focus:outline-none ml-1"
      >
        <HelpCircle size={14} />
      </button>
      {open && (
        <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 z-50 w-72 bg-navy-900 text-gray-100 text-xs leading-relaxed rounded-xl px-3.5 py-3 shadow-xl border border-white/10 pointer-events-none">
          {text}
          <span className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-[6px] border-x-transparent border-t-[6px] border-t-navy-900" />
        </span>
      )}
    </span>
  );
}

export default function TrademarkCheckPage() {
  const { language } = useLanguage();
  const lang = (language as Lang) in copy.headline ? (language as Lang) : 'en';
  const tr = (key: string) => copy[key]?.[lang] ?? copy[key]?.['en'] ?? '';

  const [markInput, setMarkInput] = useState('');
  const [goodsInput, setGoodsInput] = useState('');
  const [searchName, setSearchName] = useState(() => sessionStorage.getItem('tcpSearchName') ?? '');
  const [searchGoods, setSearchGoods] = useState(() => sessionStorage.getItem('tcpSearchGoods') ?? '');
  const [hasSearched, setHasSearched] = useState(() => !!sessionStorage.getItem('tcpSearchName'));
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);

  const canSearch = markInput.trim().length > 0 && goodsInput.trim().length > 0;

  const runSearch = () => {
    if (!canSearch) return;
    const name = markInput.trim();
    const goods = goodsInput.trim();
    setSearchName(name);
    setSearchGoods(goods);
    setHasSearched(true);
    sessionStorage.setItem('tcpSearchName', name);
    sessionStorage.setItem('tcpSearchGoods', goods);
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && canSearch) runSearch();
  };

  const handleSearchAnother = () => setShowClearConfirm(true);
  const confirmClear = () => {
    sessionStorage.removeItem('tcpSearchName');
    sessionStorage.removeItem('tcpSearchGoods');
    setSearchName('');
    setSearchGoods('');
    setMarkInput('');
    setGoodsInput('');
    setHasSearched(false);
    setShowClearConfirm(false);
    setTimeout(() => {
      heroRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section ref={heroRef} className="bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800 text-white print-hide">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gold-500/20 border border-gold-500/30 flex items-center justify-center">
              <Shield size={20} className="text-gold-400" />
            </div>
            <span className="text-gold-300 text-sm font-medium tracking-wide uppercase">
              {tr('badge')}
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-4">
            {tr('headline')}
          </h1>
          <p className="text-lg text-gray-300 leading-relaxed mb-8 max-w-2xl">
            {tr('sub')}
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2 mb-8">
            {tr('features').split(' · ').map((f, i) => (
              <span key={i} className="inline-flex items-center gap-1.5 bg-white/10 border border-white/15 rounded-full px-3 py-1 text-xs text-gray-200 font-medium">
                <CheckCircle2 size={11} className="text-gold-400" />
                {f}
              </span>
            ))}
          </div>

          {/* Two-field search form */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1.5">
                <span className="inline-flex items-center gap-0.5">
                  {tr('inputLabel')}
                  <InfoTooltip text={tr('trademarkNameTooltip')} />
                </span>
              </label>
              <div className="relative">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  value={markInput}
                  onChange={e => setMarkInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={tr('placeholder')}
                  className="w-full bg-white/10 border border-white/20 text-white placeholder-gray-400 rounded-xl pl-11 pr-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1.5">
                <span className="inline-flex items-center gap-1.5">
                  <FileText size={13} className="text-gold-400" />
                  {tr('goodsLabel')}
                  <InfoTooltip text={tr('goodsTooltip')} />
                </span>
              </label>
              <textarea
                value={goodsInput}
                onChange={e => setGoodsInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={tr('goodsPlaceholder')}
                rows={2}
                className="w-full bg-white/10 border border-white/20 text-white placeholder-gray-400 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent transition-all resize-none"
              />
            </div>

            <button
              type="button"
              onClick={runSearch}
              disabled={!canSearch}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gold-500 hover:bg-gold-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-6 py-3.5 rounded-xl transition-colors shadow-lg"
            >
              {tr('searchBtn')}
              <ArrowRight size={16} />
            </button>
          </div>

          {/* AI idea nudge */}
          <div className="mt-5 flex items-center gap-2 text-sm text-gray-400">
            <Sparkles size={14} className="text-gold-400 flex-shrink-0" />
            <span>{tr('noName')}</span>
            <Link to="/trademark-ideas" className="text-gold-300 hover:text-gold-200 font-medium underline underline-offset-2 transition-colors">
              {tr('tryAI')}
            </Link>
          </div>
        </div>
      </section>

      {/* Results */}
      <div ref={resultsRef} className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {hasSearched && searchName ? (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-start gap-3 mb-1 flex-wrap">
                <h2 className="text-lg font-bold text-navy-900">{searchName}</h2>
                <span className="text-xs bg-navy-100 text-navy-600 font-medium px-2.5 py-0.5 rounded-full self-center">
                  {lang === 'zh' ? '检索中' : lang === 'es' ? 'Revisando' : lang === 'de' ? 'Wird geprüft' : lang === 'fr' ? 'En cours' : lang === 'hi' ? 'जांच हो रही है' : lang === 'pt' ? 'Verificando' : 'Checking'}
                </span>
              </div>
              {searchGoods && (
                <p className="text-xs text-gray-400 mb-3 flex items-center gap-1.5">
                  <FileText size={11} className="text-gray-300 flex-shrink-0" />
                  {searchGoods}
                </p>
              )}
              <TrademarkClearancePanel
                markName={searchName}
                goodsServices={searchGoods}
                classes={[]}
                language={lang}
                autoRun={true}
              />
            </div>

            {/* CTA to file */}
            <div className="bg-gradient-to-r from-navy-900 to-navy-800 rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-4 print-hide">
              <div className="flex-1 text-center sm:text-left">
                <p className="text-white font-semibold text-base">{tr('readyToFile')}</p>
              </div>
              <Link
                to={`/apply?mark=${encodeURIComponent(searchName)}`}
                className="inline-flex items-center gap-2 bg-gold-500 hover:bg-gold-400 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors shadow-md whitespace-nowrap text-sm"
              >
                {tr('startFiling')}
                <ArrowRight size={15} />
              </Link>
            </div>

            {/* Search another mark */}
            <div className="text-center print-hide">
              {!showClearConfirm ? (
                <button
                  type="button"
                  onClick={handleSearchAnother}
                  className="text-sm text-gray-500 hover:text-navy-800 underline underline-offset-2 transition-colors"
                >
                  {tr('searchAgain')}
                </button>
              ) : (
                <div className="inline-flex flex-col items-center gap-3 bg-white border border-amber-200 rounded-2xl px-5 py-4 shadow-sm">
                  <p className="text-sm text-gray-700 font-medium">
                    {lang === 'es' ? 'Esto eliminará el reporte actual. ¿Continuar?' : lang === 'zh' ? '这将清除当前搜索报告。是否继续？' : lang === 'de' ? 'Aktueller Bericht wird gelöscht. Fortfahren?' : lang === 'fr' ? 'Cela effacera le rapport actuel. Continuer ?' : lang === 'hi' ? 'यह वर्तमान खोज रिपोर्ट हटा देगा। जारी रखें?' : lang === 'pt' ? 'Isso excluirá o relatório atual. Continuar?' : 'This will clear the current search report. Continue?'}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={confirmClear}
                      className="text-sm font-semibold bg-navy-900 hover:bg-navy-800 text-white px-4 py-1.5 rounded-xl transition-colors"
                    >
                      {lang === 'es' ? 'Confirmar' : lang === 'zh' ? '确认' : lang === 'de' ? 'Bestätigen' : lang === 'fr' ? 'Confirmer' : lang === 'hi' ? 'पुष्टि करें' : lang === 'pt' ? 'Confirmar' : 'Confirm'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowClearConfirm(false)}
                      className="text-sm text-gray-500 hover:text-gray-700 px-4 py-1.5 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors"
                    >
                      {lang === 'es' ? 'Cancelar' : lang === 'zh' ? '取消' : lang === 'de' ? 'Abbrechen' : lang === 'fr' ? 'Annuler' : lang === 'hi' ? 'रद्द करें' : lang === 'pt' ? 'Cancelar' : 'Cancel'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-navy-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Search size={28} className="text-navy-400" />
            </div>
            <p className="text-gray-500 text-sm max-w-xs mx-auto leading-relaxed">
              {lang === 'zh' ? '在上方输入商标名称和商品/服务说明，开始完整检索分析。'
                : lang === 'es' ? 'Ingresa el nombre de tu marca y la descripción de productos/servicios para comenzar el análisis completo.'
                : lang === 'de' ? 'Geben Sie Ihren Markennamen und die Waren-/Dienstleistungsbeschreibung ein, um die vollständige Analyse zu starten.'
                : lang === 'fr' ? "Entrez le nom de votre marque et la description des produits/services pour lancer l'analyse complète."
                : lang === 'hi' ? 'पूर्ण विश्लेषण शुरू करने के लिए ऊपर ट्रेडमार्क नाम और माल/सेवाओं का विवरण दर्ज करें।'
                : lang === 'pt' ? 'Digite o nome da marca e a descrição de produtos/serviços acima para iniciar a análise completa.'
                : 'Enter your trademark name and goods/services description above to run the full clearance analysis.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
