import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function AdminRegister() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const inviteCode = params.get('invite');

  const [invite, setInvite] = useState(null);
  const [checking, setChecking] = useState(true);
  const [form, setForm] = useState({ full_name: '', company_name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!inviteCode) { setChecking(false); return; }
    supabase
      .from('admin_invites')
      .select('id, code, parent_admin_id, used, profiles!admin_invites_parent_admin_id_fkey(full_name, company_name)')
      .eq('code', inviteCode.toUpperCase())
      .maybeSingle()
      .then(({ data }) => { setInvite(data); setChecking(false); });
  }, [inviteCode]);

  async function handleRegister(e) {
    e.preventDefault();
    setLoading(true); setError('');

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: form.email.trim().toLowerCase(),
      password: form.password,
    });
    if (authError) { setError(authError.message); setLoading(false); return; }

    const uid = authData.user?.id;
    if (!uid) { setError('Account creation failed. Try again.'); setLoading(false); return; }

    // Derive a safe username from email
    const username = form.email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 20) || 'user';

    const { error: profileError } = await supabase.from('profiles').insert({
      id: uid,
      full_name: form.full_name.trim(),
      username,
      role: 'sub_admin',
      parent_admin_id: invite.parent_admin_id,
      company_name: form.company_name.trim() || null,
    });
    if (profileError) { setError(profileError.message); setLoading(false); return; }

    // Mark invite as used
    await supabase.from('admin_invites').update({ used: true }).eq('code', inviteCode.toUpperCase());

    navigate('/admin/dashboard');
  }

  if (checking) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <p className="text-gray-500 text-sm">Checking invite…</p>
    </div>
  );

  if (!inviteCode || !invite) return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-4 text-center">
      <p className="text-5xl mb-4">🚫</p>
      <p className="text-white font-semibold text-lg mb-2">Invalid invite link</p>
      <p className="text-gray-500 text-sm">Ask your admin for a valid registration link.</p>
      <Link to="/admin/login" className="mt-5 text-brand-400 text-sm hover:underline">← Back to sign in</Link>
    </div>
  );

  if (invite.used) return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-4 text-center">
      <p className="text-5xl mb-4">⚠️</p>
      <p className="text-white font-semibold text-lg mb-2">Invite already used</p>
      <p className="text-gray-500 text-sm">This link has already been claimed. Ask your admin for a new one.</p>
      <Link to="/admin/login" className="mt-5 text-brand-400 text-sm hover:underline">← Sign in instead</Link>
    </div>
  );

  const hostName = invite.profiles?.company_name || invite.profiles?.full_name || 'your admin';

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-full bg-brand-700 flex items-center justify-center text-2xl mx-auto mb-4">🛡️</div>
          <h1 className="text-2xl font-bold text-white">Create Sub-Admin Account</h1>
          <p className="text-sm text-gray-400 mt-1">Invited by <span className="text-brand-400">{hostName}</span></p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Your Full Name *</label>
            <input required value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-500"
              placeholder="Jane Smith" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Company / Organisation <span className="text-gray-600">(optional)</span></label>
            <input value={form.company_name} onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-500"
              placeholder="Acme Events GmbH" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Email *</label>
            <input required type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-500"
              placeholder="you@example.com" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Password *</label>
            <input required type="password" minLength={6} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-500"
              placeholder="Min. 6 characters" />
          </div>
          {error && <p className="text-red-400 text-xs bg-red-900/20 border border-red-800/40 rounded-lg px-3 py-2">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-sm font-semibold text-white transition-colors disabled:opacity-60">
            {loading ? 'Creating account…' : 'Create Account & Join'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-600 mt-6">
          Already have an account?{' '}
          <Link to="/admin/login" className="text-brand-400 hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
