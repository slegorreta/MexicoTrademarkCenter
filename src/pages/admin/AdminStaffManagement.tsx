import { useEffect, useState } from 'react';
import { UserPlus, User, Shield, ShieldOff, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

const ROLES = [
  { value: 'admin', label: 'Administrator' },
  { value: 'docketing_staff', label: 'Docketing Staff' },
  { value: 'filing_staff', label: 'Filing Staff' },
  { value: 'read_only', label: 'Read Only' },
];

const ROLE_COLORS: Record<string, string> = {
  super_admin: 'bg-amber-100 text-amber-800',
  admin: 'bg-blue-100 text-blue-800',
  docketing_staff: 'bg-teal-100 text-teal-800',
  filing_staff: 'bg-green-100 text-green-800',
  read_only: 'bg-gray-100 text-gray-600',
};

interface StaffMember {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

export default function AdminStaffManagement() {
  const { profile, session } = useAuth();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('filing_staff');

  const loadStaff = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, email, full_name, role, is_active, created_at')
      .in('role', ['super_admin', 'admin', 'docketing_staff', 'filing_staff', 'read_only'])
      .order('created_at', { ascending: false });
    setStaff((data as StaffMember[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { loadStaff(); }, []);

  const createStaff = async () => {
    if (!newEmail || !newName || !newRole) { setError('All fields are required.'); return; }
    setSubmitting(true);
    setError('');
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const res = await fetch(`${supabaseUrl}/functions/v1/create-staff-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({ email: newEmail, full_name: newName, role: newRole }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? 'Failed to create staff member.');
    } else {
      setSuccess(`Account created for ${newEmail}. A welcome email with password setup link has been sent.`);
      setNewEmail(''); setNewName(''); setNewRole('filing_staff');
      setShowModal(false);
      await loadStaff();
    }
    setSubmitting(false);
  };

  const updateRole = async (id: string, role: string) => {
    await supabase.from('profiles').update({ role }).eq('id', id);
    setStaff(prev => prev.map(s => s.id === id ? { ...s, role } : s));
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from('profiles').update({ is_active: !current }).eq('id', id);
    setStaff(prev => prev.map(s => s.id === id ? { ...s, is_active: !current } : s));
  };

  if (profile?.role !== 'super_admin') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Shield size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Only super admins can access staff management.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Staff Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">Create and manage staff portal accounts</p>
        </div>
        <button
          onClick={() => { setShowModal(true); setError(''); setSuccess(''); }}
          className="flex items-center gap-2 bg-navy-900 hover:bg-navy-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <UserPlus size={16} /> Add Staff Member
        </button>
      </div>

      {success && (
        <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 flex items-center justify-between">
          {success}
          <button onClick={() => setSuccess('')}><X size={14} /></button>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-7 h-7 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Staff Member</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Role</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Joined</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {staff.map(member => (
                <tr key={member.id} className={`hover:bg-gray-50 transition-colors ${!member.is_active ? 'opacity-50' : ''}`}>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-navy-100 flex items-center justify-center text-xs font-bold text-navy-700">
                        {(member.full_name || member.email).slice(0, 1).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{member.full_name || '—'}</p>
                        <p className="text-xs text-gray-500">{member.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    {member.role === 'super_admin' ? (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[member.role] ?? 'bg-gray-100 text-gray-600'}`}>
                        Super Admin
                      </span>
                    ) : (
                      <select
                        value={member.role}
                        onChange={e => updateRole(member.id, e.target.value)}
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-gold-400"
                      >
                        {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                      </select>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${member.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {member.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-xs text-gray-500">{new Date(member.created_at).toLocaleDateString()}</span>
                  </td>
                  <td className="px-5 py-4">
                    {member.role !== 'super_admin' && (
                      <button
                        onClick={() => toggleActive(member.id, member.is_active)}
                        className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors ${
                          member.is_active
                            ? 'border border-red-200 text-red-600 hover:bg-red-50'
                            : 'border border-green-200 text-green-600 hover:bg-green-50'
                        }`}
                      >
                        {member.is_active ? <><ShieldOff size={12} /> Deactivate</> : <><Shield size={12} /> Reactivate</>}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Staff Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Add Staff Member</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {error && (
                <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
              )}
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1">Full Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="Jane Smith"
                  className="w-full border border-gray-200 rounded-lg text-sm px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-gold-400"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1">Email Address</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  placeholder="jane@example.com"
                  className="w-full border border-gray-200 rounded-lg text-sm px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-gold-400"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1">Role</label>
                <select
                  value={newRole}
                  onChange={e => setNewRole(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg text-sm px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-gold-400"
                >
                  {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              <p className="text-xs text-gray-400">A welcome email with a password setup link will be sent to the staff member automatically.</p>
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
              <button onClick={() => setShowModal(false)} className="flex-1 border border-gray-200 text-gray-600 text-sm font-medium py-2 rounded-lg hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={createStaff} disabled={submitting} className="flex-1 bg-navy-900 hover:bg-navy-800 text-white text-sm font-medium py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                <UserPlus size={14} />{submitting ? 'Creating…' : 'Create Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
