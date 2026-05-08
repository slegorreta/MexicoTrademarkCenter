import { useEffect, useState } from 'react';
import { Search, Users, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

export default function AdminClients() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    supabase
      .from('clients')
      .select('*, applications(id)')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setClients(data || []);
        setLoading(false);
      });
  }, []);

  const filtered = clients.filter(c => {
    const q = search.toLowerCase();
    return !q || c.legal_name?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q) || c.country?.toLowerCase().includes(q);
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-navy-900">Clients</h1>
        <div className="text-sm text-gray-500">{clients.length} total clients</div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-3 mb-4">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search clients..."
            className="pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm w-full max-w-sm focus:outline-none focus:ring-1 focus:ring-gold-400"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48"><div className="w-7 h-7 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <Users size={28} className="mb-2" />
            <p className="text-sm">{clients.length === 0 ? 'No clients yet.' : 'No matching clients.'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {['Name','Type','Country','Email','Phone/WeChat','Language','Applications','Since'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors cursor-pointer">
                    <td className="px-4 py-3">
                      <Link to={`/admin/clients/${c.id}`} className="flex items-center gap-1 group">
                        <div>
                          <div className="text-sm font-medium text-navy-900 group-hover:text-gold-600 transition-colors">{c.legal_name}</div>
                          {c.contact_person && <div className="text-xs text-gray-400">{c.contact_person}</div>}
                        </div>
                        <ChevronRight size={14} className="text-gray-300 group-hover:text-gold-500 ml-1 flex-shrink-0" />
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs capitalize text-gray-600">{c.applicant_type}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-600">{c.country || '—'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-600">{c.email}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-gray-500">{c.phone || c.wechat || '—'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs uppercase text-gray-500">{c.preferred_language}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-sm text-gray-700">{c.applications?.length || 0}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-gray-500">{new Date(c.created_at).toLocaleDateString()}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
