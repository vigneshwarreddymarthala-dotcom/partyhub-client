import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export default function ProfilePage() {
  const { session, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? '');
      setUsername(profile.username ?? '');
      setBio(profile.bio ?? '');
    }
  }, [profile]);

  if (!session) {
    navigate('/login');
    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    const payload = {
      id: session.user.id,
      full_name: fullName.trim(),
      username: username.trim(),
      bio: bio.trim(),
      role: profile?.role ?? 'user',
    };

    const { error } = await supabase.from('profiles').upsert(payload);
    if (error) {
      setError(error.message.includes('unique') ? 'Username is already taken.' : error.message);
      setLoading(false);
      return;
    }

    await refreshProfile();
    setSuccess(true);
    setLoading(false);
    // If this is a new profile (no existing profile), send them home to browse events
    if (!profile) {
      setTimeout(() => navigate('/'), 900);
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-white mb-1">
        {profile ? 'Edit Profile' : 'Complete Your Profile'}
      </h1>
      <p className="text-gray-400 text-sm mb-8">
        {profile ? 'Update your details.' : 'Set up your profile to start RSVPing to events.'}
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Full Name *</label>
          <input
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500"
            placeholder="Jane Doe"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">Username *</label>
          <input
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500"
            placeholder="janedoe"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            maxLength={200}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500 resize-none"
            placeholder="Tell people a bit about yourself…"
          />
        </div>

        {error && (
          <p className="text-red-400 text-xs bg-red-900/20 border border-red-800/40 rounded-lg px-3 py-2">
            {error}
          </p>
        )}
        {success && (
          <p className="text-green-400 text-xs bg-green-900/20 border border-green-800/40 rounded-lg px-3 py-2">
            {profile ? 'Profile saved!' : 'Profile created! Taking you to events…'}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-sm font-semibold text-white transition-colors disabled:opacity-60"
        >
          {loading ? 'Saving…' : 'Save Profile'}
        </button>
      </form>
    </div>
  );
}
