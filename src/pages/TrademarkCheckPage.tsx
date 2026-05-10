import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ArrowRight, Shield, Sparkles, CheckCircle2, FileText } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import TrademarkClearancePanel from '../components/TrademarkClearancePanel';

type Lang = 'en' | 'zh' | 'es' | 'de' | 'fr' | 'hi' | 'pt';

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

export default function TrademarkCheckPage() {
  const { language } = useLanguage();
  const lang = (language as Lang) in copy.headline ? (language as Lang) : 'en';
  const tr = (key: string) => copy[key]?.[lang] ?? copy[key]?.['en'] ?? '';

  const [markInput, setMarkInput] = useState('');
  const [goodsInput, setGoodsInput] = useState('');
  const [searchName, setSearchName] = useState('');
  const [searchGoods, setSearchGoods] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  const canSearch = markInput.trim().length > 0 && goodsInput.trim().length > 0;

  const runSearch = () => {
    if (!canSearch) return;
    setSearchName(markInput.trim());
    setSearchGoods(goodsInput.trim());
    setHasSearched(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && canSearch) runSearch();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800 text-white">
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
                {tr('inputLabel')}
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
                <span className="flex items-center gap-1.5">
                  <FileText size={13} className="text-gold-400" />
                  {tr('goodsLabel')}
                  <span className="text-gold-400 font-semibold">*</span>
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
              <p className="text-xs text-gold-300/70 mt-1.5">{tr('goodsRequired')}</p>
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
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
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
            <div className="bg-gradient-to-r from-navy-900 to-navy-800 rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-4">
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
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-3">{tr('searchAgain')}</p>
              <div className="space-y-3">
                <div className="relative">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    value={markInput}
                    onChange={e => setMarkInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={tr('placeholder')}
                    className="w-full border border-gray-300 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent"
                  />
                </div>
                <textarea
                  value={goodsInput}
                  onChange={e => setGoodsInput(e.target.value)}
                  placeholder={tr('goodsPlaceholder')}
                  rows={2}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent resize-none"
                />
                <button
                  type="button"
                  onClick={runSearch}
                  disabled={!canSearch}
                  className="inline-flex items-center gap-2 bg-navy-900 hover:bg-navy-800 disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm"
                >
                  {tr('searchBtn')}
                  <Search size={14} />
                </button>
              </div>
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
