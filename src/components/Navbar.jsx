import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export default function Navbar() {
  const { session, profile } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleSignOut() {
    setMenuOpen(false);
    await supabase.auth.signOut();
    navigate('/');
  }

  const initial = profile?.full_name?.[0]?.toUpperCase() ?? '?';

  return (
    <nav className="sticky top-0 z-50 bg-gray-900/90 backdrop-blur border-b border-gray-800">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="text-xl font-bold text-brand-400 tracking-tight shrink-0">
          PartyHub 🎉
        </Link>

        {/* Desktop nav */}
        <div className="hidden sm:flex items-center gap-3">
          {session ? (
            <>
              <Link to="/my-events"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${pathname === '/my-events' ? 'bg-brand-700 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`}>
                🎟️ My Events
              </Link>
              <Link to="/rooms"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${pathname === '/rooms' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
                💬 Rooms
              </Link>
              <Link to="/profile">
                <div className="w-8 h-8 rounded-full bg-brand-700 flex items-center justify-center text-sm font-semibold text-white hover:bg-brand-600 transition-colors">
                  {initial}
                </div>
              </Link>
              <button onClick={handleSignOut} className="text-sm text-gray-400 hover:text-white transition-colors">
                Sign out
              </button>
            </>
          ) : (
            <Link to="/login" className="px-4 py-1.5 rounded-full bg-brand-600 hover:bg-brand-500 text-sm font-medium transition-colors">
              Sign in
            </Link>
          )}
        </div>

        {/* Mobile: avatar + hamburger */}
        <div className="flex sm:hidden items-center gap-2">
          {session && (
            <Link to="/profile">
              <div className="w-8 h-8 rounded-full bg-brand-700 flex items-center justify-center text-sm font-semibold text-white">
                {initial}
              </div>
            </Link>
          )}
          <button
            onClick={() => setMenuOpen(o => !o)}
            className="w-9 h-9 flex flex-col items-center justify-center gap-1.5 rounded-lg hover:bg-gray-800 transition-colors"
            aria-label="Toggle menu"
          >
            <span className={`block w-5 h-0.5 bg-gray-300 transition-all duration-200 ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
            <span className={`block w-5 h-0.5 bg-gray-300 transition-all duration-200 ${menuOpen ? 'opacity-0' : ''}`} />
            <span className={`block w-5 h-0.5 bg-gray-300 transition-all duration-200 ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="sm:hidden border-t border-gray-800 bg-gray-900 px-4 py-3 flex flex-col gap-1">
          {session ? (
            <>
              <Link to="/" onClick={() => setMenuOpen(false)}
                className="px-3 py-2.5 rounded-lg text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors">
                🏠 Home
              </Link>
              <Link to="/my-events" onClick={() => setMenuOpen(false)}
                className="px-3 py-2.5 rounded-lg text-sm font-medium text-white bg-brand-700/50 hover:bg-brand-700 transition-colors">
                🎟️ My Events
              </Link>
              <Link to="/rooms" onClick={() => setMenuOpen(false)}
                className="px-3 py-2.5 rounded-lg text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors">
                💬 Rooms
              </Link>
              <Link to="/profile" onClick={() => setMenuOpen(false)}
                className="px-3 py-2.5 rounded-lg text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors">
                👤 Profile
              </Link>
              <div className="border-t border-gray-800 mt-1 pt-2">
                <button onClick={handleSignOut}
                  className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-red-400 hover:bg-gray-800 transition-colors">
                  Sign out
                </button>
              </div>
            </>
          ) : (
            <Link to="/login" onClick={() => setMenuOpen(false)}
              className="px-3 py-2.5 rounded-lg text-sm bg-brand-600 text-white font-medium text-center">
              Sign in
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
