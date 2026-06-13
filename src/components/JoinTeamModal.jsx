import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export default function JoinTeamModal({ onClose }) {
  const { session, profile } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    full_name: profile?.full_name ?? '',
    email: session?.user?.email ?? '',
    contact: '',
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true); setError('');

    const { error: err } = await supabase.from('team_applications').insert({
      user_id: session.user.id,
      full_name: form.full_name.trim(),
      email: form.email.trim().toLowerCase(),
      contact: form.contact.trim() || null,
      description: form.description.trim(),
    });

    if (err) {
      setError(err.message);
      setLoading(false); return;
    }

    setSuccess(true);
    setLoading(false);
  }

  // Not logged in — prompt to sign in
  if (!session) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-sm text-center" onClick={e => e.stopPropagation()}>
          <p className="text-3xl mb-3">🔐</p>
          <h2 className="text-lg font-bold text-white mb-2">Sign in to apply</h2>
          <p className="text-sm text-gray-400 mb-5">You need an account to join the team.</p>
          <div className="flex flex-col gap-2">
            <button onClick={() => { navigate('/login'); onClose(); }}
              className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-sm font-semibold text-white transition-colors">
              Sign In
            </button>
            <button onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-sm text-gray-300 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <div>
            <h2 className="text-base font-bold text-white">Join Our Team</h2>
            <p className="text-xs text-gray-500 mt-0.5">Fill in your details and we'll get back to you</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-white hover:bg-gray-800 transition-colors">
            ✕
          </button>
        </div>

        {success ? (
          <div className="px-5 py-10 text-center">
            <p className="text-4xl mb-3">🎉</p>
            <h3 className="text-white font-bold text-lg mb-2">Application Sent!</h3>
            <p className="text-gray-400 text-sm mb-5">We've received your application and will get back to you soon.</p>
            <button onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-sm font-semibold text-white transition-colors">
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Full Name *</label>
              <input required value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                placeholder="Your full name"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Email *</label>
              <input required type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="you@example.com"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Phone / Contact <span className="text-gray-600">(optional)</span></label>
              <input value={form.contact} onChange={e => setForm(f => ({ ...f, contact: e.target.value }))}
                placeholder="+49 123 456789"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Why do you want to join? *</label>
              <textarea required rows={4} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Tell us about yourself and what you'd like to contribute..."
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-500 resize-none" />
            </div>

            {error && <p className="text-red-400 text-xs bg-red-900/20 border border-red-800/40 rounded-lg px-3 py-2">{error}</p>}

            <div className="flex gap-2 pt-1">
              <button type="button" onClick={onClose}
                className="flex-1 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-sm text-gray-300 transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={loading}
                className="flex-1 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-sm font-semibold text-white transition-colors disabled:opacity-60">
                {loading ? 'Sending…' : 'Send Application'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
