import { useEffect, useState } from 'react';
import { Save, Settings } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function AdminSettings() {
  const [settings, setSettings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from('settings')
      .select('*')
      .order('setting_key')
      .then(({ data }) => {
        setSettings(data || []);
        setLoading(false);
      });
  }, []);

  const updateSetting = async (id: string, key: string, value: string) => {
    setSaving(id);
    await supabase.from('settings').update({ setting_value: value }).eq('id', id);
    setSaving(null);
    setSaved(id);
    setTimeout(() => setSaved(null), 2000);
  };

  const groups = [
    { title: 'Pricing', keys: ['price_tier_1_usd','price_tier_2_usd','price_tier_3_usd','price_tier_1_max','price_tier_2_max'] },
    { title: 'Government Fees', keys: ['government_fee_usd','government_fee_mxn'] },
    { title: 'Operations', keys: ['filing_target_hours','supported_file_types','max_file_size_mb','reminder_days'] },
    { title: 'Email', keys: ['email_sender_name','email_sender_address'] },
    { title: 'Stripe', keys: ['stripe_publishable_key'] },
  ];

  const settingMap = Object.fromEntries(settings.map(s => [s.setting_key, s]));

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Settings size={20} className="text-navy-900" />
        <h1 className="text-xl font-bold text-navy-900">Settings</h1>
      </div>

      <div className="space-y-4">
        {groups.map(group => (
          <div key={group.title} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
              <span className="font-semibold text-navy-900 text-sm">{group.title}</span>
            </div>
            <div className="divide-y divide-gray-100">
              {group.keys.map(key => {
                const s = settingMap[key];
                if (!s) return null;
                return (
                  <div key={key} className="flex items-center gap-4 px-5 py-4">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-800">{s.setting_key.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}</div>
                      {s.description && <div className="text-xs text-gray-400 mt-0.5">{s.description}</div>}
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        defaultValue={s.setting_value}
                        key={s.id}
                        className="border border-gray-200 rounded-lg text-sm px-3 py-1.5 w-48 focus:outline-none focus:ring-1 focus:ring-gold-400"
                        onBlur={e => updateSetting(s.id, s.setting_key, e.target.value)}
                      />
                      <button
                        onClick={() => {
                          const input = document.querySelector(`[data-id="${s.id}"]`) as HTMLInputElement;
                          updateSetting(s.id, s.setting_key, input?.value || s.setting_value);
                        }}
                        className={`p-1.5 rounded-lg transition-colors ${
                          saved === s.id ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        {saving === s.id ? (
                          <div className="w-3.5 h-3.5 border border-gray-400 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Save size={13} />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
