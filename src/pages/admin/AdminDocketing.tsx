import { useEffect, useState } from 'react';
import { Plus, Calendar, List, LayoutGrid, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { format, addDays, parseISO, differenceInDays } from 'date-fns';

type ViewMode = 'list' | 'kanban' | 'calendar';

const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-gray-100 text-gray-500',
  normal: 'bg-blue-100 text-blue-600',
  high: 'bg-orange-100 text-orange-600',
  critical: 'bg-red-100 text-red-700',
};

const STATUS_COLORS: Record<string, string> = {
  open: 'bg-blue-100 text-blue-700',
  upcoming: 'bg-yellow-100 text-yellow-700',
  due_soon: 'bg-orange-100 text-orange-700',
  overdue: 'bg-red-100 text-red-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-500',
};

function computeStatus(dueDate: string, currentStatus: string): string {
  if (currentStatus === 'completed' || currentStatus === 'cancelled') return currentStatus;
  const days = differenceInDays(parseISO(dueDate), new Date());
  if (days < 0) return 'overdue';
  if (days <= 3) return 'due_soon';
  if (days <= 15) return 'upcoming';
  return 'open';
}

export default function AdminDocketing() {
  const { user } = useAuth();
  const [deadlines, setDeadlines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [showAdd, setShowAdd] = useState(false);
  const [newDeadline, setNewDeadline] = useState({
    application_id: '',
    title: '',
    deadline_type: 'custom',
    due_date: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
    priority: 'normal',
    description: '',
  });
  const [applications, setApplications] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      supabase.from('docket_deadlines').select('*, applications(case_number)').order('due_date'),
      supabase.from('applications').select('id, case_number').order('created_at', { ascending: false }),
    ]).then(([dlRes, appsRes]) => {
      setDeadlines(dlRes.data || []);
      setApplications(appsRes.data || []);
      setLoading(false);
    });
  }, []);

  const addDeadline = async () => {
    if (!newDeadline.application_id || !newDeadline.title || !user) return;
    const { data } = await supabase.from('docket_deadlines').insert({
      ...newDeadline,
      created_by: user.id,
      status: 'open',
    }).select('*, applications(case_number)').maybeSingle();
    if (data) setDeadlines(prev => [...prev, data].sort((a, b) => a.due_date.localeCompare(b.due_date)));
    setShowAdd(false);
  };

  const markComplete = async (id: string) => {
    await supabase.from('docket_deadlines').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', id);
    setDeadlines(prev => prev.map(d => d.id === id ? { ...d, status: 'completed' } : d));
  };

  const KANBAN_STATUSES = ['open', 'upcoming', 'due_soon', 'overdue', 'completed'];

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-navy-900">Docketing</h1>
        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="flex border border-gray-200 rounded-lg overflow-hidden bg-white">
            {([['list', List], ['kanban', LayoutGrid], ['calendar', Calendar]] as const).map(([mode, Icon]) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`p-2 text-sm transition-colors ${viewMode === mode ? 'bg-navy-900 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                <Icon size={15} />
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 bg-gold-500 hover:bg-gold-600 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
          >
            <Plus size={15} /> Add Deadline
          </button>
        </div>
      </div>

      {/* Add deadline modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="font-bold text-navy-900 mb-5">Add Deadline</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Case</label>
                <select
                  className="w-full border border-gray-200 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gold-400"
                  value={newDeadline.application_id}
                  onChange={e => setNewDeadline(d => ({ ...d, application_id: e.target.value }))}
                >
                  <option value="">Select application...</option>
                  {applications.map(a => (
                    <option key={a.id} value={a.id}>{a.case_number}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Deadline Title</label>
                <input
                  type="text"
                  className="w-full border border-gray-200 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gold-400"
                  value={newDeadline.title}
                  onChange={e => setNewDeadline(d => ({ ...d, title: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Type</label>
                  <select
                    className="w-full border border-gray-200 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gold-400"
                    value={newDeadline.deadline_type}
                    onChange={e => setNewDeadline(d => ({ ...d, deadline_type: e.target.value }))}
                  >
                    <option value="filing_target">Filing Target</option>
                    <option value="impi_publication">IMPI Publication</option>
                    <option value="opposition_deadline">Opposition</option>
                    <option value="office_action_response">Office Action Response</option>
                    <option value="renewal_deadline">Renewal</option>
                    <option value="declaration_of_use">Declaration of Use</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Priority</label>
                  <select
                    className="w-full border border-gray-200 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gold-400"
                    value={newDeadline.priority}
                    onChange={e => setNewDeadline(d => ({ ...d, priority: e.target.value }))}
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Due Date</label>
                <input
                  type="date"
                  className="w-full border border-gray-200 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gold-400"
                  value={newDeadline.due_date}
                  onChange={e => setNewDeadline(d => ({ ...d, due_date: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowAdd(false)} className="flex-1 border border-gray-200 text-gray-600 text-sm py-2.5 rounded-xl">Cancel</button>
              <button onClick={addDeadline} className="flex-1 bg-gold-500 hover:bg-gold-600 text-white text-sm font-semibold py-2.5 rounded-xl">Add Deadline</button>
            </div>
          </div>
        </div>
      )}

      {viewMode === 'list' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {['Case','Title','Type','Due Date','Days Left','Priority','Status','Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {deadlines.map(d => {
                  const status = computeStatus(d.due_date, d.status);
                  const daysLeft = differenceInDays(parseISO(d.due_date), new Date());
                  return (
                    <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <span className="text-xs font-mono text-navy-900">{d.applications?.case_number || '—'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-800">{d.title}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-gray-500">{d.deadline_type.replace(/_/g, ' ')}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-700">{format(parseISO(d.due_date), 'MMM d, yyyy')}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-sm font-medium ${daysLeft < 0 ? 'text-red-600' : daysLeft <= 7 ? 'text-orange-600' : 'text-gray-600'}`}>
                          {daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : daysLeft === 0 ? 'Today' : `${daysLeft}d`}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_COLORS[d.priority]}`}>{d.priority}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[status]}`}>{status.replace('_', ' ')}</span>
                      </td>
                      <td className="px-4 py-3">
                        {status !== 'completed' && (
                          <button
                            onClick={() => markComplete(d.id)}
                            className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700 font-medium"
                          >
                            <CheckCircle2 size={12} /> Done
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {deadlines.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-gray-400 text-sm">No deadlines added yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {viewMode === 'kanban' && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {KANBAN_STATUSES.map(status => {
            const cols = deadlines.filter(d => computeStatus(d.due_date, d.status) === status);
            return (
              <div key={status} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className={`px-3 py-2.5 border-b border-gray-100 flex items-center justify-between ${STATUS_COLORS[status]}`}>
                  <span className="text-xs font-semibold uppercase tracking-wide">{status.replace('_', ' ')}</span>
                  <span className="text-xs font-bold">{cols.length}</span>
                </div>
                <div className="p-2 space-y-2 min-h-24">
                  {cols.map(d => (
                    <div key={d.id} className="bg-gray-50 rounded-lg p-2.5 border border-gray-100">
                      <div className="text-xs font-medium text-navy-900 mb-0.5">{d.title}</div>
                      <div className="text-xs text-gray-400">{d.applications?.case_number}</div>
                      <div className="text-xs text-gray-500 mt-1">{format(parseISO(d.due_date), 'MMM d')}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {viewMode === 'calendar' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h3 className="font-semibold text-navy-900 mb-4">Upcoming Deadlines</h3>
          <div className="space-y-2">
            {deadlines.filter(d => d.status !== 'completed').slice(0, 20).map(d => {
              const daysLeft = differenceInDays(parseISO(d.due_date), new Date());
              const status = computeStatus(d.due_date, d.status);
              return (
                <div key={d.id} className={`flex items-center gap-3 p-3 rounded-xl border ${
                  status === 'overdue' ? 'border-red-200 bg-red-50' :
                  status === 'due_soon' ? 'border-orange-200 bg-orange-50' :
                  'border-gray-200 bg-gray-50'
                }`}>
                  {status === 'overdue' ? <AlertCircle size={16} className="text-red-500 flex-shrink-0" /> :
                   status === 'due_soon' ? <Clock size={16} className="text-orange-500 flex-shrink-0" /> :
                   <Clock size={16} className="text-gray-400 flex-shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-800">{d.title}</div>
                    <div className="text-xs text-gray-500">{d.applications?.case_number}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-xs font-semibold text-gray-700">{format(parseISO(d.due_date), 'MMM d, yyyy')}</div>
                    <div className={`text-xs ${daysLeft < 0 ? 'text-red-600' : daysLeft <= 7 ? 'text-orange-600' : 'text-gray-500'}`}>
                      {daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : daysLeft === 0 ? 'Today' : `${daysLeft}d left`}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
