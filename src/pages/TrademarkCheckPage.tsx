import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ArrowRight, Shield, Sparkles, CheckCircle2 } from 'lucide-react';
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
    en: 'Review Your Trademark for Free',
    zh: '免费检索您的商标',
    es: 'Revisa tu Marca Gratis',
    de: 'Ihre Marke kostenlos prüfen',
    fr: 'Vérifiez votre marque gratuitement',
    hi: 'अपना ट्रेडमार्क मुफ़्त में जांचें',
    pt: 'Verifique sua Marca Gratuitamente',
  },
  sub: {
    en: 'Instantly search the official IMPI MARCia database, scan the web for existing uses, and check domain availability — all in one click.',
    zh: '即时搜索IMPI MARCia官方数据库，扫描网络上的现有使用，并检查域名可用性 — 一键完成。',
    es: 'Busca al instante en la base de datos oficial IMPI MARCia, escanea la web en busca de usos existentes y verifica la disponibilidad de dominios — todo en un clic.',
    de: 'Durchsuchen Sie sofort die offizielle IMPI MARCia-Datenbank, scannen Sie das Web nach bestehenden Nutzungen und prüfen Sie die Domainverfügbarkeit — alles mit einem Klick.',
    fr: 'Recherchez instantanément dans la base officielle IMPI MARCia, scannez le web pour les usages existants et vérifiez la disponibilité des domaines — en un seul clic.',
    hi: 'आधिकारिक IMPI MARCia डेटाबेस तुरंत खोजें, मौजूदा उपयोगों के लिए वेब स्कैन करें, और डोमेन उपलब्धता जांचें — एक क्लिक में सब कुछ।',
    pt: 'Pesquise instantaneamente na base de dados oficial IMPI MARCia, verifique usos existentes na web e cheque a disponibilidade de domínios — tudo em um clique.',
  },
  inputLabel: {
    en: 'Enter your trademark name',
    zh: '输入您的商标名称',
    es: 'Ingresa el nombre de tu marca',
    de: 'Geben Sie Ihren Markennamen ein',
    fr: 'Entrez le nom de votre marque',
    hi: 'अपना ट्रेडमार्क नाम दर्ज करें',
    pt: 'Digite o nome da sua marca',
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
  searchBtn: {
    en: 'Run Free Search',
    zh: '开始免费检索',
    es: 'Buscar Gratis',
    de: 'Kostenlose Suche starten',
    fr: 'Lancer la recherche gratuite',
    hi: 'मुफ़्त खोज चलाएं',
    pt: 'Iniciar Pesquisa Gratuita',
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
    en: 'IMPI MARCia Database · Web Presence Scan · Domain Availability',
    zh: 'IMPI MARCia数据库 · 网络存在扫描 · 域名可用性',
    es: 'Base de datos IMPI MARCia · Escaneo web · Disponibilidad de dominio',
    de: 'IMPI MARCia-Datenbank · Webpräsenz-Scan · Domainverfügbarkeit',
    fr: 'Base IMPI MARCia · Scan de présence web · Disponibilité des domaines',
    hi: 'IMPI MARCia डेटाबेस · वेब स्कैन · डोमेन उपलब्धता',
    pt: 'Base IMPI MARCia · Varredura web · Disponibilidade de domínio',
  },
};

export default function TrademarkCheckPage() {
  const { language } = useLanguage();
  const lang = (language as Lang) in copy.headline ? (language as Lang) : 'en';
  const tr = (key: string) => copy[key]?.[lang] ?? copy[key]?.['en'] ?? '';

  const [inputValue, setInputValue] = useState('');
  const [searchName, setSearchName] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  const runSearch = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    setSearchName(trimmed);
    setHasSearched(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') runSearch();
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

          {/* Search input */}
          <div className="flex gap-3 flex-col sm:flex-row">
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={tr('placeholder')}
                className="w-full bg-white/10 border border-white/20 text-white placeholder-gray-400 rounded-xl pl-11 pr-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent transition-all"
              />
            </div>
            <button
              type="button"
              onClick={runSearch}
              disabled={!inputValue.trim()}
              className="inline-flex items-center justify-center gap-2 bg-gold-500 hover:bg-gold-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-6 py-3.5 rounded-xl transition-colors shadow-lg whitespace-nowrap"
            >
              {tr('searchBtn')}
              <ArrowRight size={16} />
            </button>
          </div>

          {/* AI idea nudge */}
          <div className="mt-4 flex items-center gap-2 text-sm text-gray-400">
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
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-lg font-bold text-navy-900">{searchName}</h2>
                <span className="text-xs bg-navy-100 text-navy-600 font-medium px-2.5 py-0.5 rounded-full">
                  {lang === 'zh' ? '检索中' : lang === 'es' ? 'Revisando' : lang === 'de' ? 'Wird geprüft' : lang === 'fr' ? 'En cours' : lang === 'hi' ? 'जांच हो रही है' : lang === 'pt' ? 'Verificando' : 'Checking'}
                </span>
              </div>
              <TrademarkClearancePanel
                markName={searchName}
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

            {/* Try another search */}
            <div className="flex gap-3 flex-col sm:flex-row">
              <div className="flex-1 relative">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={tr('placeholder')}
                  className="w-full border border-gray-300 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent"
                />
              </div>
              <button
                type="button"
                onClick={runSearch}
                disabled={!inputValue.trim()}
                className="inline-flex items-center gap-2 bg-navy-900 hover:bg-navy-800 disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm"
              >
                {tr('searchBtn')}
                <Search size={14} />
              </button>
            </div>
          </div>
        ) : (
          /* Empty state */
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-navy-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Search size={28} className="text-navy-400" />
            </div>
            <p className="text-gray-500 text-sm max-w-xs mx-auto leading-relaxed">
              {lang === 'zh' ? '在上方输入您的商标名称开始免费检索。'
                : lang === 'es' ? 'Ingresa el nombre de tu marca arriba para comenzar la búsqueda gratuita.'
                : lang === 'de' ? 'Geben Sie oben Ihren Markennamen ein, um die kostenlose Recherche zu starten.'
                : lang === 'fr' ? 'Entrez le nom de votre marque ci-dessus pour lancer la recherche gratuite.'
                : lang === 'hi' ? 'मुफ़्त खोज शुरू करने के लिए ऊपर अपना ट्रेडमार्क नाम दर्ज करें।'
                : lang === 'pt' ? 'Digite o nome da sua marca acima para iniciar a pesquisa gratuita.'
                : 'Enter your trademark name above to run the free search.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
