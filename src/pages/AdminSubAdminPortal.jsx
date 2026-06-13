import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export default function AdminSubAdminPortal() {
  const { session, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [view, setView] = useState('login'); // 'login' | 'register'

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [regForm, setRegForm] = useState({ email: '', full_name: '', company_name: '', password: '' });

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Already logged in as sub-admin → go straight to dashboard
  useEffect(() => {
    if (!loading && session && (profile?.role === 'sub_admin' || profile?.role === 'admin')) {
      navigate('/admin/dashboard');
    }
  }, [session, profile, loading]);

  function switchView(v) {
    setView(v);
    setError('');
  }

  // ── Login ──────────────────────────────────────────────
  async function handleLogin(e) {
    e.preventDefault();
    setError(''); setSubmitting(true);

    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) {
      setError('Wrong email or password. Please try again.');
      setSubmitting(false); return;
    }

    const { data: prof } = await supabase
      .from('profiles').select('role').eq('id', data.user.id).maybeSingle();

    if (!prof || prof.role !== 'sub_admin') {
      await supabase.auth.signOut();
      setError('No sub-admin account found for this email. Create one below, or contact your admin.');
      setSubmitting(false); return;
    }

    navigate('/admin/dashboard');
  }

  // ── Register ───────────────────────────────────────────
  async function handleRegister(e) {
    e.preventDefault();
    setError(''); setSubmitting(true);

    const emailVal = regForm.email.trim().toLowerCase();

    // Check if admin approved this email
    const { data: invite, error: inviteError } = await supabase
      .from('admin_invites')
      .select('id')
      .eq('invited_email', emailVal)
      .maybeSingle();

    if (inviteError && inviteError.code !== 'PGRST116') {
      // Column might not exist yet — skip check gracefully
    } else if (!inviteError && !invite) {
      setError('This email is not approved by the admin. Contact your admin to get access.');
      setSubmitting(false); return;
    }

    const { data: adminProfile } = await supabase
      .from('profiles').select('id').eq('role', 'admin').limit(1).maybeSingle();

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: emailVal, password: regForm.password,
    });
    if (authError) { setError(authError.message); setSubmitting(false); return; }

    const uid = authData.user?.id;
    if (!uid) { setError('Account creation failed. Please try again.'); setSubmitting(false); return; }

    const username = emailVal.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 20) || 'user';

    const { error: profileError } = await supabase.from('profiles').insert({
      id: uid,
      full_name: regForm.full_name.trim(),
      username,
      role: 'sub_admin',
      parent_admin_id: adminProfile?.id ?? null,
      company_name: regForm.company_name.trim() || null,
    });

    if (profileError) { setError(profileError.message); setSubmitting(false); return; }

    navigate('/admin/dashboard');
  }

  if (loading) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 p-4">
      <div className="w-full max-w-sm">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-purple-900 border border-purple-700 mb-4">
            <span className="text-2xl">🛡️</span>
          </div>
          <h1 className="text-2xl font-bold text-white">
            {view === 'login' ? 'Sub-Admin Login' : 'Create Sub-Admin Account'}
          </h1>
          <p className="text-gray-500 text-sm mt-1">PartyHub sub-admin portal</p>
        </div>

        {/* ── LOGIN FORM ── */}
        {view === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Email</label>
              <input
                type="email" required autoFocus
                value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Password</label>
              <input
                type="password" required
                value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
              />
            </div>

            {error && (
              <div className="bg-red-900/20 border border-red-800/40 rounded-xl px-4 py-3">
                <p className="text-red-400 text-xs">{error}</p>
              </div>
            )}

            <button type="submit" disabled={submitting}
              className="w-full py-3 rounded-xl bg-purple-700 hover:bg-purple-600 text-sm font-semibold text-white transition-colors disabled:opacity-60">
              {submitting ? 'Signing in…' : 'Sign In'}
            </button>

            <p className="text-center text-sm text-gray-500 pt-1">
              Don't have an account?{' '}
              <button type="button" onClick={() => switchView('register')}
                className="text-purple-400 hover:text-purple-300 font-medium transition-colors">
                Create Account
              </button>
            </p>
          </form>
        )}

        {/* ── REGISTER FORM ── */}
        {view === 'register' && (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Email *</label>
              <input
                required type="email"
                value={regForm.email} onChange={e => setRegForm(f => ({ ...f, email: e.target.value }))}
                placeholder="you@example.com"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Full Name *</label>
              <input
                required
                value={regForm.full_name} onChange={e => setRegForm(f => ({ ...f, full_name: e.target.value }))}
                placeholder="Jane Smith"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Company <span className="text-gray-600">(optional)</span></label>
              <input
                value={regForm.company_name} onChange={e => setRegForm(f => ({ ...f, company_name: e.target.value }))}
                placeholder="Acme Events"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Password *</label>
              <input
                required type="password" minLength={6}
                value={regForm.password} onChange={e => setRegForm(f => ({ ...f, password: e.target.value }))}
                placeholder="Min. 6 characters"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
              />
            </div>

            {error && (
              <div className="bg-red-900/20 border border-red-800/40 rounded-xl px-4 py-3">
                <p className="text-red-400 text-xs">{error}</p>
              </div>
            )}

            <button type="submit" disabled={submitting}
              className="w-full py-3 rounded-xl bg-purple-700 hover:bg-purple-600 text-sm font-semibold text-white transition-colors disabled:opacity-60">
              {submitting ? 'Creating account…' : 'Create Account'}
            </button>

            <p className="text-center text-sm text-gray-500 pt-1">
              Already have an account?{' '}
              <button type="button" onClick={() => switchView('login')}
                className="text-purple-400 hover:text-purple-300 font-medium transition-colors">
                Sign In
              </button>
            </p>
          </form>
        )}

        <p className="text-center text-xs text-gray-700 mt-8">
          <Link to="/" className="text-gray-500 hover:text-gray-400 transition-colors">← Back to PartyHub</Link>
        </p>
      </div>
    </div>
  );
}
