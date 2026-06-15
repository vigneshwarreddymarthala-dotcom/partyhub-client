import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import EventCard from '../components/EventCard';

export default function Landing() {
  const { profile } = useAuth();
  const [events, setEvents] = useState([]);
  const [rsvpCounts, setRsvpCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('active');
  const [cityFilter, setCityFilter] = useState('all');
  const [cities, setCities] = useState([]);
  const [citySearch, setCitySearch] = useState('');
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);

  // Fetch cities once on mount
  useEffect(() => { fetchCities(); }, []);
  useEffect(() => { fetchEvents(); }, [filter, cityFilter, profile]);

  async function fetchCities() {
    const { data } = await supabase
      .from('events').select('city').neq('status', 'scheduled');
    const unique = [...new Set((data ?? []).map(e => e.city).filter(Boolean))].sort();
    setCities(unique);
  }

  async function fetchEvents() {
    setLoading(true);
    await supabase.rpc('publish_due_scheduled_events');
    let query = supabase.from('events').select('*').order('date', { ascending: true })
      .neq('status', 'scheduled').is('deleted_at', null);
    if (filter === 'active') query = query.eq('status', 'active');
    if (cityFilter !== 'all') query = query.eq('city', cityFilter);
    // Country filter: show global events + events targeted to user's country
    if (profile?.country) {
      query = query.or(`target_country.is.null,target_country.eq.${profile.country}`);
    }
    const { data } = await query;
    if (!data) { setLoading(false); return; }
    setEvents(data);
    const counts = {};
    await Promise.all(data.map(async (e) => {
      const { count } = await supabase.from('rsvps').select('*', { count: 'exact', head: true }).eq('event_id', e.id);
      counts[e.id] = count ?? 0;
    }));
    setRsvpCounts(counts);
    setLoading(false);
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:py-12">
      {/* Hero */}
      <div className="text-center mb-6 sm:mb-14 max-w-2xl mx-auto">
        <span className="inline-block text-xs font-semibold tracking-widest text-brand-400 uppercase mb-4 px-3 py-1.5 rounded-full bg-brand-900/50 border border-brand-800/60">
          For Expats in Germany
        </span>

        {/* Party people illustration */}
        <div className="flex justify-center mb-4">
          <svg viewBox="0 0 220 90" className="w-36 sm:w-56 h-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Confetti dots */}
            <circle cx="18" cy="18" r="3" fill="#a855f7" opacity="0.7"/>
            <circle cx="200" cy="14" r="2.5" fill="#f472b6" opacity="0.7"/>
            <circle cx="35" cy="10" r="2" fill="#60a5fa" opacity="0.6"/>
            <circle cx="185" cy="28" r="3" fill="#34d399" opacity="0.6"/>
            <circle cx="110" cy="8" r="2" fill="#fbbf24" opacity="0.7"/>
            <circle cx="155" cy="10" r="2.5" fill="#f87171" opacity="0.6"/>
            <circle cx="65" cy="12" r="2" fill="#a78bfa" opacity="0.6"/>

            {/* Person 1 - left, arms up */}
            <circle cx="42" cy="30" r="9" fill="#7c3aed"/>
            <rect x="37" y="40" width="10" height="22" rx="5" fill="#7c3aed"/>
            {/* left arm raised */}
            <line x1="42" y1="46" x2="28" y2="32" stroke="#7c3aed" strokeWidth="5" strokeLinecap="round"/>
            {/* right arm */}
            <line x1="42" y1="46" x2="54" y2="38" stroke="#7c3aed" strokeWidth="5" strokeLinecap="round"/>

            {/* Person 2 - centre-left, raising glass */}
            <circle cx="82" cy="28" r="10" fill="#2563eb"/>
            <rect x="76" y="39" width="12" height="24" rx="6" fill="#2563eb"/>
            {/* arm up with glass */}
            <line x1="82" y1="46" x2="68" y2="30" stroke="#2563eb" strokeWidth="5" strokeLinecap="round"/>
            <circle cx="65" cy="27" r="4" fill="#93c5fd" opacity="0.9"/>
            {/* other arm */}
            <line x1="82" y1="46" x2="96" y2="36" stroke="#2563eb" strokeWidth="5" strokeLinecap="round"/>

            {/* Person 3 - centre, tallest, both arms up */}
            <circle cx="120" cy="24" r="11" fill="#db2777"/>
            <rect x="113" y="36" width="14" height="26" rx="7" fill="#db2777"/>
            <line x1="120" y1="44" x2="104" y2="28" stroke="#db2777" strokeWidth="5.5" strokeLinecap="round"/>
            <line x1="120" y1="44" x2="136" y2="28" stroke="#db2777" strokeWidth="5.5" strokeLinecap="round"/>

            {/* Person 4 - centre-right */}
            <circle cx="158" cy="28" r="10" fill="#059669"/>
            <rect x="152" y="39" width="12" height="24" rx="6" fill="#059669"/>
            <line x1="158" y1="46" x2="144" y2="34" stroke="#059669" strokeWidth="5" strokeLinecap="round"/>
            <line x1="158" y1="46" x2="172" y2="30" stroke="#059669" strokeWidth="5" strokeLinecap="round"/>
            <circle cx="175" cy="27" r="4" fill="#6ee7b7" opacity="0.9"/>

            {/* Person 5 - right */}
            <circle cx="194" cy="30" r="9" fill="#d97706"/>
            <rect x="189" y="40" width="10" height="22" rx="5" fill="#d97706"/>
            <line x1="194" y1="46" x2="180" y2="34" stroke="#d97706" strokeWidth="5" strokeLinecap="round"/>
            <line x1="194" y1="46" x2="207" y2="32" stroke="#d97706" strokeWidth="5" strokeLinecap="round"/>

            {/* Ground line */}
            <line x1="20" y1="74" x2="200" y2="74" stroke="#374151" strokeWidth="1.5" strokeLinecap="round"/>

            {/* Music notes */}
            <text x="8" y="55" fontSize="10" fill="#a78bfa" opacity="0.8">♪</text>
            <text x="205" y="50" fontSize="10" fill="#f9a8d4" opacity="0.8">♫</text>
          </svg>
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight leading-tight">
          Find your next <span className="text-brand-400">party</span>
        </h1>
        <p className="text-gray-400 text-base sm:text-lg leading-relaxed px-2">
          The community platform for expats across Germany — discover local events, meet new people, and RSVP instantly.
          <span className="text-white font-medium"> Never feel far from home.</span>
        </p>

        {/* Trust badges */}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-7">
          {[
            { label: 'Free to join',      bg: 'bg-green-900/30',  border: 'border-green-800/40',  text: 'text-green-400' },
            { label: 'Live chat rooms',   bg: 'bg-brand-900/30',  border: 'border-brand-800/40',  text: 'text-brand-400' },
            { label: 'All German cities', bg: 'bg-purple-900/30', border: 'border-purple-800/40', text: 'text-purple-400' },
          ].map(b => (
            <span key={b.label} className={`px-3 py-1.5 rounded-full text-xs font-medium border ${b.bg} ${b.border} ${b.text}`}>
              {b.label}
            </span>
          ))}
        </div>
      </div>

      {/* Filters — sticky on mobile */}
      <div
        className="sticky z-10 bg-gray-950/95 backdrop-blur -mx-4 px-4 pt-3 pb-2 mb-3 sm:relative sm:top-auto sm:bg-transparent sm:mx-0 sm:px-0 sm:pt-0 sm:backdrop-blur-none"
        style={{ top: 'calc(3.5rem + env(safe-area-inset-top))' }}
      >

      {/* Status filter tabs */}
      <div className="flex gap-2 mb-3 overflow-x-auto scrollbar-hide pb-1">
        {['active', 'all'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors shrink-0 ${
              filter === f ? 'bg-brand-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {f === 'active' ? 'Upcoming' : 'All events'}
          </button>
        ))}
      </div>

      {/* Location filter */}
      {cities.length > 0 && (
        <div className="relative mb-6">
          {/* Search input */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-xs">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">📍</span>
              <input
                type="text"
                value={citySearch}
                onChange={e => { setCitySearch(e.target.value); setCityDropdownOpen(true); }}
                onFocus={() => setCityDropdownOpen(true)}
                onBlur={() => setTimeout(() => setCityDropdownOpen(false), 150)}
                placeholder="Search city…"
                className="w-full pl-9 pr-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
              />
              {citySearch && (
                <button onClick={() => { setCitySearch(''); setCityFilter('all'); setCityDropdownOpen(false); }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white text-xs">✕</button>
              )}
            </div>
            {cityFilter !== 'all' && (
              <button onClick={() => { setCityFilter('all'); setCitySearch(''); }}
                className="px-3 py-2 rounded-xl bg-purple-600 text-white text-xs font-medium flex items-center gap-1.5">
                {cityFilter} <span>✕</span>
              </button>
            )}
          </div>

          {/* Dropdown results */}
          {cityDropdownOpen && (
            <div className="absolute top-full left-0 mt-1 w-full max-w-xs bg-gray-900 border border-gray-700 rounded-xl shadow-xl z-20 overflow-hidden">
              <div className="max-h-40 sm:max-h-52 overflow-y-auto">
                {/* All cities option */}
                <button
                  onMouseDown={() => { setCityFilter('all'); setCitySearch(''); setCityDropdownOpen(false); }}
                  className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm text-left transition-colors ${cityFilter === 'all' ? 'bg-purple-700 text-white' : 'text-gray-300 hover:bg-gray-800'}`}>
                  🌍 All Cities
                </button>
                {cities
                  .filter(c => c.toLowerCase().includes(citySearch.toLowerCase()))
                  .map(city => (
                    <button key={city}
                      onMouseDown={() => { setCityFilter(city); setCitySearch(city); setCityDropdownOpen(false); }}
                      className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm text-left transition-colors ${cityFilter === city ? 'bg-purple-700 text-white' : 'text-gray-300 hover:bg-gray-800'}`}>
                      📍 {city}
                    </button>
                  ))
                }
                {cities.filter(c => c.toLowerCase().includes(citySearch.toLowerCase())).length === 0 && (
                  <p className="px-4 py-3 text-sm text-gray-500">No cities found for "{citySearch}"</p>
                )}
              </div>
            </div>
          )}

          {/* City chips row (always visible) */}
          <div className="flex gap-2 mt-2 overflow-x-auto scrollbar-hide pb-1">
            <button onClick={() => { setCityFilter('all'); setCitySearch(''); }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors shrink-0 ${cityFilter === 'all' ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
              All
            </button>
            {cities.map(city => (
              <button key={city} onClick={() => { setCityFilter(city); setCitySearch(city); }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors shrink-0 ${cityFilter === city ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
                {city}
              </button>
            ))}
          </div>
        </div>
      )}

      </div>{/* end sticky wrapper */}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-64 rounded-2xl bg-gray-800 animate-pulse" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <p className="text-5xl mb-4">🎈</p>
          <p className="font-medium text-gray-400">
            {cityFilter !== 'all' ? `No events in ${cityFilter}` : 'No events yet'}
          </p>
          <p className="text-sm mt-1">
            {cityFilter !== 'all'
              ? <button onClick={() => setCityFilter('all')} className="text-brand-400 hover:underline">Show all cities</button>
              : 'Check back soon!'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {events.map((event) => (
            <EventCard key={event.id} event={event} rsvpCount={rsvpCounts[event.id] ?? 0} />
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="mt-16 pt-6 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-600">
        <div className="flex items-center gap-4">
          <p>© 2026 SpielFinder. All rights reserved.</p>
          <Link to="/impressum" className="text-gray-600 hover:text-gray-400 transition-colors underline underline-offset-2">
            Impressum
          </Link>
        </div>
        <Link
          to="/admin/login"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-800 text-gray-600 hover:text-gray-400 hover:border-gray-700 transition-colors"
        >
          🛡️ Admin Portal
        </Link>
      </div>
    </div>
  );
}
