import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useUnread } from '../context/UnreadContext';
import { supabase } from '../lib/supabase';
import JoinTeamModal from './JoinTeamModal';

export default function Navbar() {
  const { session, profile } = useAuth();
  const { totalUnread } = useUnread();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);

  async function handleSignOut() {
    setMenuOpen(false);
    await supabase.auth.signOut();
    navigate('/');
  }

  const initial = profile?.full_name?.[0]?.toUpperCase() ?? '?';

  return (
    <>
    <nav className="sticky top-0 z-50 border-b border-gray-800 overflow-hidden pt-safe" style={{ background: 'rgba(17,24,39,0.92)' }}>

      {/* Party lights */}
      <div className="absolute inset-0 pointer-events-none">
        {[
          { color: '#ff3cac', left: '5%',  size: 80,  dur: 3.2, delay: 0 },
          { color: '#784ba0', left: '15%', size: 60,  dur: 2.8, delay: 0.5 },
          { color: '#2b86c5', left: '27%', size: 90,  dur: 3.6, delay: 1.0 },
          { color: '#ff6b6b', left: '40%', size: 70,  dur: 2.5, delay: 0.3 },
          { color: '#ffd93d', left: '53%', size: 85,  dur: 3.9, delay: 0.8 },
          { color: '#6bcb77', left: '65%', size: 65,  dur: 2.7, delay: 1.4 },
          { color: '#ff3cac', left: '76%', size: 75,  dur: 3.1, delay: 0.2 },
          { color: '#2b86c5', left: '87%', size: 55,  dur: 2.9, delay: 0.9 },
          { color: '#ffd93d', left: '95%', size: 70,  dur: 3.4, delay: 0.6 },
        ].map((light, i) => (
          <div
            key={i}
            className="absolute -top-6 rounded-full opacity-30"
            style={{
              left: light.left,
              width: light.size,
              height: light.size,
              background: `radial-gradient(circle, ${light.color} 0%, transparent 70%)`,
              animation: `partyPulse ${light.dur}s ease-in-out ${light.delay}s infinite alternate`,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes partyPulse {
          0%   { transform: translateY(0px) scale(1);   opacity: 0.25; }
          100% { transform: translateY(8px) scale(1.2); opacity: 0.45; }
        }
      `}</style>

      <div className="relative max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="text-xl font-bold text-brand-400 tracking-tight shrink-0">
          PartyHub 🎉
        </Link>

        {/* Desktop nav */}
        <div className="hidden sm:flex items-center gap-3">
          <button onClick={() => setJoinOpen(true)}
            className="px-3 py-1.5 rounded-full border border-brand-600 text-brand-400 hover:bg-brand-600 hover:text-white text-sm font-medium transition-colors">
            Join Team
          </button>
          {session ? (
            <>
              <Link to="/my-events"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${pathname === '/my-events' ? 'bg-brand-700 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`}>
                🎟️ My Events
              </Link>
              <Link to="/rooms"
                className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${pathname === '/rooms' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
                💬 Rooms
                {totalUnread > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1 leading-none">
                    {totalUnread > 9 ? '9+' : totalUnread}
                  </span>
                )}
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
          <button onClick={() => { setMenuOpen(false); setJoinOpen(true); }}
            className="px-3 py-2.5 rounded-lg text-sm font-medium text-brand-400 hover:bg-brand-900/40 transition-colors text-left">
            🤝 Join Team
          </button>
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
                className="relative px-3 py-2.5 rounded-lg text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors flex items-center justify-between">
                <span>💬 Rooms</span>
                {totalUnread > 0 && (
                  <span className="min-w-[20px] h-5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center px-1.5">
                    {totalUnread > 9 ? '9+' : totalUnread}
                  </span>
                )}
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

    {joinOpen && <JoinTeamModal onClose={() => setJoinOpen(false)} />}
  </>
  );
}
