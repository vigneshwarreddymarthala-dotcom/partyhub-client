import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export default function AdminLogin() {
  const { session, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('signin'); // 'signin' | 'create-admin'

  // Sign in fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Create main-admin fields
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regName, setRegName] = useState('');
  const [regUsername, setRegUsername] = useState('');

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && session && profile?.role === 'admin') navigate('/admin/dashboard');
    // Sub-admins trying to access this page get redirected to their own portal
    if (!loading && session && profile?.role === 'sub_admin') navigate('/admin/sub-admin');
  }, [session, profile, loading]);

  async function handleLogin(e) {
    e.preventDefault();
    setError(''); setSubmitting(true);

    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) { setError('Invalid email or password.'); setSubmitting(false); return; }

    const { data: prof } = await supabase.from('profiles').select('role').eq('id', data.user.id).maybeSingle();
    if (prof?.role !== 'admin') {
      await supabase.auth.signOut();
      setError('This portal is for main admins only. Sub-admins sign in at /admin/sub-admin');
      setSubmitting(false); return;
    }
    navigate('/admin/dashboard');
  }

  async function handleCreateAdmin(e) {
    e.preventDefault();
    setError(''); setSubmitting(true);

    const { data, error: signUpError } = await supabase.auth.signUp({ email: regEmail, password: regPassword });
    if (signUpError) { setError(signUpError.message); setSubmitting(false); return; }
    if (!data.session) {
      setError('Email confirmation is on — disable it in Supabase → Auth → Providers → Email.');
      setSubmitting(false); return;
    }

    const { error: profileError } = await supabase.from('profiles').insert({
      id: data.user.id,
      full_name: regName.trim(),
      username: regUsername.trim(),
      role: 'admin',
    });
    if (profileError) {
      setError(profileError.message.includes('unique') ? 'Username already taken.' : profileError.message);
      setSubmitting(false); return;
    }
    navigate('/admin/dashboard');
  }

  if (loading) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 p-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-900 border border-brand-700 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25H4.5a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5H4.5a2.25 2.25 0 00-2.25 2.25m19.5 0-9.75 6.75L2.25 6.75" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-white">Admin Portal</h1>
          <p className="text-gray-500 text-sm mt-1">PartyHub — restricted access</p>
        </div>

        {/* ── Sign In (admin + sub-admin) ── */}
        <form onSubmit={handleLogin} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4 mb-4">
          <h2 className="text-sm font-semibold text-white">Sign In</h2>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Email</label>
            <input type="email" required autoFocus value={email} onChange={e => setEmail(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-500"
              placeholder="you@example.com" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Password</label>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-500"
              placeholder="••••••••" />
          </div>
          {error && tab === 'signin' && <p className="text-red-400 text-xs bg-red-900/20 border border-red-800/40 rounded-lg px-3 py-2">{error}</p>}
          <button type="submit" disabled={submitting} onClick={() => setTab('signin')}
            className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-sm font-semibold text-white transition-colors disabled:opacity-60">
            {submitting && tab === 'signin' ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        {/* ── Sub-Admin redirect notice ── */}
        <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-4 mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-white">Sub-Admin?</p>
            <p className="text-xs text-gray-500 mt-0.5">Use the dedicated sub-admin portal</p>
          </div>
          <Link to="/admin/sub-admin"
            className="shrink-0 px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-600 text-sm font-medium text-white transition-colors">
            Sub-Admin Portal
          </Link>
        </div>

        {/* ── Create main admin (collapsible) ── */}
        <div className="border border-gray-800 rounded-2xl overflow-hidden">
          <button
            onClick={() => { setTab(tab === 'create-admin' ? 'signin' : 'create-admin'); setError(''); }}
            className="w-full flex items-center justify-between px-4 py-3 text-xs text-gray-500 hover:text-gray-400 transition-colors">
            <span>First time? Create main admin account</span>
            <span>{tab === 'create-admin' ? '▲' : '▼'}</span>
          </button>
          {tab === 'create-admin' && (
            <form onSubmit={handleCreateAdmin} className="px-4 pb-4 space-y-3 border-t border-gray-800 pt-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Full Name *</label>
                <input required value={regName} onChange={e => setRegName(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-500"
                  placeholder="Jane Doe" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Username *</label>
                <input required value={regUsername} onChange={e => setRegUsername(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-500"
                  placeholder="janedoe" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Email *</label>
                <input type="email" required value={regEmail} onChange={e => setRegEmail(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-500"
                  placeholder="admin@example.com" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Password *</label>
                <input type="password" required minLength={6} value={regPassword} onChange={e => setRegPassword(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-500"
                  placeholder="Min. 6 characters" />
              </div>
              {error && tab === 'create-admin' && <p className="text-red-400 text-xs bg-red-900/20 border border-red-800/40 rounded-lg px-3 py-2">{error}</p>}
              <button type="submit" disabled={submitting}
                className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-sm font-semibold text-white transition-colors disabled:opacity-60">
                {submitting && tab === 'create-admin' ? 'Creating…' : 'Create Admin Account'}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-gray-700 mt-6">
          <Link to="/" className="text-gray-500 hover:text-gray-400 transition-colors">← Back to PartyHub</Link>
        </p>
      </div>
    </div>
  );
}
