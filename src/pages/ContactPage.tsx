import { useState } from 'react';
import { Mail, MessageSquare, Clock, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function ContactPage() {
  const { t } = useLanguage();
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    setSubmitted(true);
    setLoading(false);
  };

  return (
    <div className="bg-white">
      {/* Header */}
      <section className="bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800 text-white py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="text-gold-400 font-semibold text-sm uppercase tracking-wider mb-3">
            {t('contact.eyebrow')}
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold mb-4">{t('contact.title')}</h1>
          <p className="text-gray-300 max-w-xl mx-auto">{t('contact.sub')}</p>
        </div>
      </section>

      <section className="py-16 lg:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-10">
            {/* Info */}
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-navy-900 mb-4">
                  {t('contact.info.title')}
                </h2>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 bg-gold-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Mail size={16} className="text-gold-600" />
                    </div>
                    <div>
                      <div className="text-xs font-medium text-gray-500 mb-0.5">
                        {t('contact.info.email')}
                      </div>
                      <div className="text-sm text-navy-900">info@mexicotrademarkcenter.com</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 bg-gold-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Clock size={16} className="text-gold-600" />
                    </div>
                    <div>
                      <div className="text-xs font-medium text-gray-500 mb-0.5">
                        {t('contact.info.responseTime')}
                      </div>
                      <div className="text-sm text-navy-900">
                        {t('contact.info.responseValue')}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 bg-gold-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <MessageSquare size={16} className="text-gold-600" />
                    </div>
                    <div>
                      <div className="text-xs font-medium text-gray-500 mb-0.5">
                        {t('contact.info.languages')}
                      </div>
                      <div className="text-sm text-navy-900">{t('contact.info.languageList')}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-navy-50 rounded-xl p-4 border border-navy-100">
                <div className="text-sm font-semibold text-navy-900 mb-2">
                  {t('contact.ready.title')}
                </div>
                <p className="text-xs text-gray-600">
                  {t('contact.ready.desc')}
                </p>
              </div>
            </div>

            {/* Form */}
            <div className="lg:col-span-2">
              {submitted ? (
                <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle2 size={32} className="text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-navy-900 mb-2">{t('contact.success')}</h3>
                  <p className="text-gray-600 text-sm">
                    {t('contact.respond')}
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('contact.name')}</label>
                      <input
                        type="text"
                        required
                        className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent"
                        value={form.name}
                        onChange={e => setForm({ ...form, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('contact.email')}</label>
                      <input
                        type="email"
                        required
                        className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent"
                        value={form.email}
                        onChange={e => setForm({ ...form, email: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      {t('contact.subject')}
                    </label>
                    <input
                      type="text"
                      className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent"
                      value={form.subject}
                      onChange={e => setForm({ ...form, subject: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('contact.message')}</label>
                    <textarea
                      required
                      rows={5}
                      className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent resize-none"
                      value={form.message}
                      onChange={e => setForm({ ...form, message: e.target.value })}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gold-500 hover:bg-gold-600 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-70"
                  >
                    {loading ? t('common.loading') : t('contact.send')}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
