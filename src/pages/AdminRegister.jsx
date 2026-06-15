import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function AdminRegister() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', full_name: '', company_name: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleRegister(e) {
    e.preventDefault();
    setLoading(true); setError('');
    const email = form.email.trim().toLowerCase();

    // Find the main admin to set as parent
    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'admin')
      .limit(1)
      .maybeSingle();

    const { data: authData, error: authError } = await supabase.auth.signUp({ email, password: form.password });
    if (authError) { setError(authError.message); setLoading(false); return; }

    const uid = authData.user?.id;
    if (!uid) { setError('Account creation failed. Try again.'); setLoading(false); return; }

    const username = email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 20) || 'user';

    const { error: profileError } = await supabase.from('profiles').insert({
      id: uid,
      full_name: form.full_name.trim(),
      username,
      role: 'sub_admin',
      parent_admin_id: adminProfile?.id ?? null,
      company_name: form.company_name.trim() || null,
    });
    if (profileError) { setError(profileError.message); setLoading(false); return; }

    navigate('/admin/dashboard');
  }

  return (
    <div className="min-h-[100dvh] bg-gray-950 flex flex-col items-center justify-center px-4 py-10 pt-safe">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-full bg-brand-700 flex items-center justify-center text-2xl mx-auto mb-4">🛡️</div>
          <h1 className="text-2xl font-bold text-white">Create Sub-Admin Account</h1>
          <p className="text-sm text-gray-400 mt-1">Fill in your details to get started</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Email *</label>
            <input required type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-500"
              placeholder="you@example.com" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Full Name *</label>
            <input required value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-500"
              placeholder="Jane Smith" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Company / Organisation <span className="text-gray-600">(optional)</span></label>
            <input value={form.company_name} onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-500"
              placeholder="Acme Events" />
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
            {loading ? 'Creating account…' : 'Create Account'}
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
