import { useLanguage } from '../context/LanguageContext';

export default function TrustStatsBar() {
  const { t } = useLanguage();

  const stats = [
    { value: '+100 / mo', label: t('stats.desc1') },
    { value: '24 hrs', label: t('stats.desc2') },
    { value: '$299 USD', label: t('stats.desc3') },
    { value: '5.0 ★', label: t('stats.desc4') },
  ];

  return (
    <section className="bg-[#1a3a2a] py-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-white/5 px-6 py-6 grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-0">
          {stats.map((stat, i) => (
            <div
              key={i}
              className={`flex flex-col items-center text-center gap-1.5 ${
                i < stats.length - 1 ? 'lg:border-r lg:border-white/10' : ''
              } lg:px-6`}
            >
              <span className="text-3xl font-extrabold text-amber-400 leading-none tracking-tight">
                {stat.value}
              </span>
              <span className="text-white/75 text-xs leading-snug max-w-[140px]">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
