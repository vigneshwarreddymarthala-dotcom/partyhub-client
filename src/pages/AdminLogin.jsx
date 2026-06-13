import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export default function AdminLogin() {
  const { session, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('login'); // 'login' | 'register'

  // Sign in fields
  const [email, setEmail] = useState('test@gmail.com');
  const [password, setPassword] = useState('1234567');

  // Register fields
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regName, setRegName] = useState('');
  const [regUsername, setRegUsername] = useState('');

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && session && profile?.role === 'admin') {
      navigate('/admin/dashboard');
    }
  }, [session, profile, loading]);

  // ── Sign In ──────────────────────────────────────────────────
  async function handleLogin(e) {
    e.preventDefault();
    setError(''); setSubmitting(true);

    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) { setError('Invalid email or password.'); setSubmitting(false); return; }

    const { data: prof } = await supabase.from('profiles').select('role').eq('id', data.user.id).maybeSingle();
    if (prof?.role !== 'admin') {
      await supabase.auth.signOut();
      setError('Access denied. This portal is for administrators only.');
      setSubmitting(false); return;
    }
    navigate('/admin/dashboard');
  }

  // ── Register ─────────────────────────────────────────────────
  async function handleRegister(e) {
    e.preventDefault();
    setError(''); setSubmitting(true);

    // Create auth user
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: regEmail, password: regPassword,
    });
    if (signUpError) { setError(signUpError.message); setSubmitting(false); return; }

    if (!data.session) {
      setError('Email confirmation is still on. Please disable it in Supabase → Auth → Providers → Email.');
      setSubmitting(false); return;
    }

    // Create admin profile
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

        {/* Tab toggle */}
        <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1 mb-5">
          <button
            onClick={() => { setMode('login'); setError(''); }}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${mode === 'login' ? 'bg-brand-600 text-white' : 'text-gray-400 hover:text-white'}`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setMode('register'); setError(''); }}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${mode === 'register' ? 'bg-brand-600 text-white' : 'text-gray-400 hover:text-white'}`}
          >
            Create Account
          </button>
        </div>

        {/* ── Login form ── */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Email</label>
              <input type="email" required autoFocus value={email} onChange={e => setEmail(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-500"
                placeholder="admin@example.com" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Password</label>
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-500"
                placeholder="••••••••" />
            </div>
            {error && <p className="text-red-400 text-xs bg-red-900/20 border border-red-800/40 rounded-lg px-3 py-2">{error}</p>}
            <button type="submit" disabled={submitting}
              className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-sm font-semibold text-white transition-colors disabled:opacity-60">
              {submitting ? 'Signing in…' : 'Sign in to Admin'}
            </button>
          </form>
        )}

        {/* ── Register form ── */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
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
            {error && <p className="text-red-400 text-xs bg-red-900/20 border border-red-800/40 rounded-lg px-3 py-2">{error}</p>}
            <button type="submit" disabled={submitting}
              className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-sm font-semibold text-white transition-colors disabled:opacity-60">
              {submitting ? 'Creating account…' : 'Create Admin Account'}
            </button>
          </form>
        )}

        <p className="text-center text-xs text-gray-700 mt-6">
          <Link to="/" className="text-gray-500 hover:text-gray-400 transition-colors">← Back to PartyHub</Link>
        </p>
      </div>
    </div>
  );
}
