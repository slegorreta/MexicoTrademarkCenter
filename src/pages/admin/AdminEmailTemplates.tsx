import { useEffect, useState } from 'react';
import { Save, Mail } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function AdminEmailTemplates() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any | null>(null);
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
    await supabase.from('email_templates').update({
      subject_en: selected.subject_en,
      body_en: selected.body_en,
      subject_zh: selected.subject_zh,
      body_zh: selected.body_zh,
      is_active: selected.is_active,
    }).eq('id', selected.id);
    setTemplates(prev => prev.map(t => t.id === selected.id ? selected : t));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" /></div>;
  }

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
            {templates.map(t => (
              <button
                key={t.id}
                onClick={() => setSelected({ ...t })}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                  selected?.id === t.id ? 'bg-gold-50 border-r-2 border-gold-500' : 'hover:bg-gray-50'
                }`}
              >
                <Mail size={14} className={selected?.id === t.id ? 'text-gold-600' : 'text-gray-400'} />
                <div>
                  <div className="text-xs font-medium text-gray-800">{t.name_en}</div>
                  <div className="text-xs text-gray-400">{t.template_key}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Editor */}
        {selected ? (
          <div className="lg:col-span-3 bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
              <div>
                <span className="font-semibold text-navy-900 text-sm">{selected.name_en}</span>
                <span className="ml-2 text-xs text-gray-400">{selected.template_key}</span>
              </div>
              <div className="flex items-center gap-3">
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
                  {saved ? 'Saved!' : saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
            <div className="p-5 space-y-5">
              <div className="p-3 bg-amber-50 rounded-lg text-xs text-amber-700 border border-amber-200">
                Available variables: <code>{'{{client_name}}'}</code>, <code>{'{{case_number}}'}</code>, <code>{'{{trademark_name}}'}</code>, <code>{'{{impi_number}}'}</code>, <code>{'{{filing_date}}'}</code>, <code>{'{{amount}}'}</code>, <code>{'{{payment_id}}'}</code>, <code>{'{{class_count}}'}</code>
              </div>
              <div className="grid lg:grid-cols-2 gap-5">
                <div>
                  <div className="text-sm font-semibold text-navy-900 mb-3">English</div>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Subject</label>
                      <input
                        type="text"
                        className="w-full border border-gray-200 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gold-400"
                        value={selected.subject_en}
                        onChange={e => setSelected((s: any) => ({ ...s, subject_en: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Body</label>
                      <textarea
                        rows={10}
                        className="w-full border border-gray-200 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gold-400 resize-none font-mono"
                        value={selected.body_en}
                        onChange={e => setSelected((s: any) => ({ ...s, body_en: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <div className="text-sm font-semibold text-navy-900 mb-3">中文 (Chinese)</div>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Subject (主题)</label>
                      <input
                        type="text"
                        className="w-full border border-gray-200 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gold-400"
                        value={selected.subject_zh}
                        onChange={e => setSelected((s: any) => ({ ...s, subject_zh: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Body (正文)</label>
                      <textarea
                        rows={10}
                        className="w-full border border-gray-200 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gold-400 resize-none font-mono"
                        value={selected.body_zh}
                        onChange={e => setSelected((s: any) => ({ ...s, body_zh: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
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
