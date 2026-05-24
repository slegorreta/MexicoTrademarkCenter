import { useEffect, useState } from 'react';
import { Save, Mail, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const LANGUAGES = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'zh', label: 'Chinese', native: '中文' },
  { code: 'es', label: 'Spanish', native: 'Español' },
  { code: 'de', label: 'German', native: 'Deutsch' },
  { code: 'fr', label: 'French', native: 'Français' },
  { code: 'hi', label: 'Hindi', native: 'हिंदी' },
  { code: 'pt', label: 'Portuguese', native: 'Português' },
  { code: 'ja', label: 'Japanese', native: '日本語' },
];

function translatedCount(template: any): number {
  return LANGUAGES.filter(l => template?.[`subject_${l.code}`] && template?.[`body_${l.code}`]).length;
}

export default function AdminEmailTemplates() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any | null>(null);
  const [activeLang, setActiveLang] = useState('en');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    supabase
      .from('email_templates')
      .select('*')
      .order('template_key')
      .then(({ data }) => {
        setTemplates(data || []);
        if (data && data.length > 0) setSelected(data[0]);
        setLoading(false);
      });
  }, []);

  const saveTemplate = async () => {
    if (!selected) return;
    setSaving(true);

    const updatePayload: Record<string, unknown> = { is_active: selected.is_active };
    for (const l of LANGUAGES) {
      updatePayload[`subject_${l.code}`] = selected[`subject_${l.code}`] ?? null;
      updatePayload[`body_${l.code}`] = selected[`body_${l.code}`] ?? null;
    }

    await supabase.from('email_templates').update(updatePayload).eq('id', selected.id);
    setTemplates(prev => prev.map(t => t.id === selected.id ? { ...selected } : t));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" /></div>;
  }

  const subjectKey = `subject_${activeLang}`;
  const bodyKey = `body_${activeLang}`;
  const count = selected ? translatedCount(selected) : 0;

  return (
    <div>
      <h1 className="text-xl font-bold text-navy-900 mb-6">Email Templates</h1>
      <div className="grid lg:grid-cols-4 gap-4">
        {/* Template list */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Templates</span>
          </div>
          <div className="divide-y divide-gray-100">
            {templates.map(t => {
              const tc = translatedCount(t);
              return (
                <button
                  key={t.id}
                  onClick={() => { setSelected({ ...t }); setActiveLang('en'); }}
                  className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors ${
                    selected?.id === t.id ? 'bg-gold-50 border-r-2 border-gold-500' : 'hover:bg-gray-50'
                  }`}
                >
                  <Mail size={14} className={`mt-0.5 flex-shrink-0 ${selected?.id === t.id ? 'text-gold-600' : 'text-gray-400'}`} />
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-gray-800 truncate">{t.name_en}</div>
                    <div className="text-xs text-gray-400 truncate">{t.template_key}</div>
                    <div className="flex items-center gap-1 mt-1">
                      <div className="flex gap-0.5">
                        {LANGUAGES.map(l => (
                          <div
                            key={l.code}
                            title={l.label}
                            className={`w-1.5 h-1.5 rounded-full ${t[`subject_${l.code}`] && t[`body_${l.code}`] ? 'bg-green-500' : 'bg-gray-200'}`}
                          />
                        ))}
                      </div>
                      <span className="text-[10px] text-gray-400">{tc}/8</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Editor */}
        {selected ? (
          <div className="lg:col-span-3 bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <span className="font-semibold text-navy-900 text-sm">{selected.name_en}</span>
                <span className="ml-2 text-xs text-gray-400">{selected.template_key}</span>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                {/* Completeness badge */}
                <div className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-full ${count === 8 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                  {count === 8 && <CheckCircle2 size={11} />}
                  <span>{count}/8 languages</span>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selected.is_active}
                    onChange={e => setSelected((s: any) => ({ ...s, is_active: e.target.checked }))}
                    className="rounded border-gray-300 text-gold-500"
                  />
                  <span className="text-xs text-gray-600">Active</span>
                </label>
                <button
                  onClick={saveTemplate}
                  disabled={saving}
                  className="flex items-center gap-1.5 bg-gold-500 hover:bg-gold-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Save size={12} />
                  {saved ? 'Saved!' : saving ? 'Saving…' : 'Save All'}
                </button>
              </div>
            </div>

            {/* Variables hint */}
            <div className="px-5 pt-4 pb-0">
              <div className="p-3 bg-amber-50 rounded-lg text-xs text-amber-700 border border-amber-200">
                Variables: <code>{'{{client_name}}'}</code> <code>{'{{case_number}}'}</code> <code>{'{{trademark_name}}'}</code> <code>{'{{filing_date}}'}</code> <code>{'{{amount}}'}</code> <code>{'{{class_count}}'}</code> <code>{'{{reset_link}}'}</code> <code>{'{{payment_link}}'}</code> <code>{'{{update_title}}'}</code> <code>{'{{update_description}}'}</code>
              </div>
            </div>

            {/* Language tabs */}
            <div className="px-5 pt-4">
              <div className="flex gap-1 flex-wrap border-b border-gray-100 pb-0">
                {LANGUAGES.map(l => {
                  const hasContent = !!(selected[`subject_${l.code}`] && selected[`body_${l.code}`]);
                  return (
                    <button
                      key={l.code}
                      onClick={() => setActiveLang(l.code)}
                      className={`relative px-3 py-2 text-xs font-medium rounded-t-lg transition-colors border-b-2 ${
                        activeLang === l.code
                          ? 'border-gold-500 text-navy-900 bg-white'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span>{l.native}</span>
                      {hasContent && (
                        <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-green-500 rounded-full" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Editor fields */}
            <div className="p-5 space-y-4 flex-1">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-gray-500 uppercase tracking-wide">
                    Subject — {LANGUAGES.find(l => l.code === activeLang)?.label}
                  </label>
                  {!selected[subjectKey] && (
                    <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">Not translated</span>
                  )}
                </div>
                <input
                  type="text"
                  className="w-full border border-gray-200 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gold-400"
                  value={selected[subjectKey] ?? ''}
                  onChange={e => setSelected((s: any) => ({ ...s, [subjectKey]: e.target.value }))}
                  placeholder={`Email subject in ${LANGUAGES.find(l => l.code === activeLang)?.label}…`}
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-gray-500 uppercase tracking-wide">
                    Body — {LANGUAGES.find(l => l.code === activeLang)?.label}
                  </label>
                  {!selected[bodyKey] && (
                    <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">Not translated</span>
                  )}
                </div>
                <textarea
                  rows={14}
                  className="w-full border border-gray-200 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gold-400 resize-y font-mono"
                  value={selected[bodyKey] ?? ''}
                  onChange={e => setSelected((s: any) => ({ ...s, [bodyKey]: e.target.value }))}
                  placeholder={`HTML email body in ${LANGUAGES.find(l => l.code === activeLang)?.label}…`}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-3 flex items-center justify-center bg-gray-50 rounded-xl border border-dashed border-gray-300 h-48 text-gray-400 text-sm">
            Select a template to edit
          </div>
        )}
      </div>
    </div>
  );
}
