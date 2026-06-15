import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (session) {
    navigate('/');
    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (mode === 'login') {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      // Check if profile exists — if not, send them to create one
      const { data: prof } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', data.user.id)
        .maybeSingle();
      navigate(prof ? '/' : '/profile');

    } else {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      if (!data.session) {
        // Email confirmation still ON — show instructions
        setError('');
        setLoading(false);
        setMode('confirm');
        return;
      }
      // Session created immediately (email confirm disabled) — go set up profile
      navigate('/profile');
    }
  }

  // Waiting-for-email-confirmation state
  if (mode === 'confirm') {
    return (
      <div className="min-h-[calc(100dvh-56px)] flex items-center justify-center p-4">
        <div className="w-full max-w-sm text-center">
          <div className="text-5xl mb-4">📬</div>
          <h2 className="text-xl font-bold text-white mb-2">Check your email</h2>
          <p className="text-gray-400 text-sm">
            We sent a confirmation link to <span className="text-white">{email}</span>.
            Click it, then come back to sign in.
          </p>
          <button
            onClick={() => setMode('login')}
            className="mt-6 text-brand-400 text-sm hover:underline"
          >
            Back to sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100dvh-56px)] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link to="/" className="text-3xl font-extrabold text-brand-400">PartyHub</Link>
          <p className="text-gray-400 text-sm mt-1">
            {mode === 'login' ? 'Welcome back!' : 'Create your account'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Email</label>
            <input
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-500"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-500"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-red-400 text-xs bg-red-900/20 border border-red-800/40 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-sm font-semibold text-white transition-colors disabled:opacity-60"
          >
            {loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          {mode === 'login' ? (
            <>Don't have an account?{' '}
              <button onClick={() => { setMode('register'); setError(''); }} className="text-brand-400 hover:underline">
                Sign up
              </button>
            </>
          ) : (
            <>Already have an account?{' '}
              <button onClick={() => { setMode('login'); setError(''); }} className="text-brand-400 hover:underline">
                Sign in
              </button>
            </>
          )}
        </p>

        {/* Admin portal link */}
        <div className="mt-8 text-center">
          <Link
            to="/admin/login"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-700 text-sm text-gray-400 hover:text-white hover:border-brand-600 transition-colors"
          >
            <span>🛡️</span> Admin Portal
          </Link>
        </div>
      </div>
    </div>
  );
}
