import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export default function Navbar() {
  const { session, profile } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate('/');
  }

  return (
    <nav className="sticky top-0 z-50 bg-gray-900/80 backdrop-blur border-b border-gray-800">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold text-brand-400 tracking-tight">
          PartyHub
        </Link>

        <div className="flex items-center gap-3">
          {session ? (
            <>
              <Link
                to="/rooms"
                className="text-sm text-gray-300 hover:text-white transition-colors"
              >
                My Rooms
              </Link>
              {profile?.role === 'admin' && (
                <Link
                  to="/admin"
                  className="text-sm text-brand-400 hover:text-brand-300 font-medium transition-colors"
                >
                  Admin
                </Link>
              )}
              <Link to="/profile" className="flex items-center gap-2 group">
                <div className="w-8 h-8 rounded-full bg-brand-700 flex items-center justify-center text-sm font-semibold text-white">
                  {profile?.full_name?.[0]?.toUpperCase() ?? '?'}
                </div>
              </Link>
              <button
                onClick={handleSignOut}
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Sign out
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="px-4 py-1.5 rounded-full bg-brand-600 hover:bg-brand-500 text-sm font-medium transition-colors"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
