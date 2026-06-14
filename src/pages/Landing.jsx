import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import EventCard from '../components/EventCard';

export default function Landing() {
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
  useEffect(() => { fetchEvents(); }, [filter, cityFilter]);

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
      .neq('status', 'scheduled');
    if (filter === 'active') query = query.eq('status', 'active');
    if (cityFilter !== 'all') query = query.eq('city', cityFilter);
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
    <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
      {/* Hero */}
      <div className="flex flex-col lg:flex-row items-center gap-10 mb-10 sm:mb-14">

        {/* Text */}
        <div className="flex-1 text-center lg:text-left">
          <span className="inline-block text-xs font-semibold tracking-widest text-brand-400 uppercase mb-3 px-3 py-1 rounded-full bg-brand-900/50 border border-brand-800/60">
            🇩🇪 For Expats in Germany
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white mb-4 tracking-tight leading-tight">
            Find your next <span className="text-brand-400">party</span>
          </h1>
          <p className="text-gray-400 text-base sm:text-lg max-w-lg mx-auto lg:mx-0">
            The community platform for expats across Germany — discover local events, meet new people, RSVP instantly, and chat with guests. <span className="text-white font-medium">Never feel far from home.</span>
          </p>

          {/* Trust badges */}
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 mt-6 text-sm text-gray-500">
            <span className="flex items-center gap-1.5">✅ Free to join</span>
            <span className="flex items-center gap-1.5">💬 Live chat rooms</span>
            <span className="flex items-center gap-1.5">📍 All German cities</span>
          </div>
        </div>

        {/* Visual */}
        <div className="shrink-0 w-full lg:w-auto flex justify-center">
          <div className="relative w-72 h-64 sm:w-80 sm:h-72">

            {/* Background glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-brand-900/60 via-purple-900/40 to-pink-900/30 rounded-3xl blur-2xl" />

            {/* Card */}
            <div className="relative bg-gray-900/80 border border-gray-800 rounded-3xl p-6 h-full flex flex-col justify-between backdrop-blur">

              {/* People row */}
              <div className="flex items-end justify-center gap-3">
                {[
                  { emoji: '👩', color: 'bg-pink-800',   label: 'Sofia', city: 'Berlin' },
                  { emoji: '🧑', color: 'bg-brand-800',  label: 'Lucas', city: 'Munich' },
                  { emoji: '👨', color: 'bg-purple-800', label: 'Arjun', city: 'Hamburg' },
                  { emoji: '👩', color: 'bg-orange-800', label: 'Mia',   city: 'Cologne' },
                ].map((p, i) => (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full ${p.color} border-2 border-gray-700 flex items-center justify-center text-2xl`}>
                      {p.emoji}
                    </div>
                    <p className="text-[10px] text-gray-400 font-medium">{p.label}</p>
                  </div>
                ))}
              </div>

              {/* Party banner */}
              <div className="bg-gradient-to-r from-brand-600 to-purple-600 rounded-2xl px-4 py-3 text-center">
                <p className="text-white font-bold text-sm">🎉 Summer Expat Meetup</p>
                <p className="text-brand-200 text-xs mt-0.5">Berlin · 42 going · Tonight</p>
              </div>

              {/* Chat bubbles */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-pink-800 flex items-center justify-center text-xs">👩</div>
                  <div className="bg-gray-800 rounded-xl rounded-tl-sm px-2.5 py-1 text-xs text-gray-300">So excited for tonight! 🥂</div>
                </div>
                <div className="flex items-center gap-2 justify-end">
                  <div className="bg-brand-700 rounded-xl rounded-tr-sm px-2.5 py-1 text-xs text-white">See you there! 🙌</div>
                  <div className="w-5 h-5 rounded-full bg-brand-800 flex items-center justify-center text-xs">🧑</div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Filters — sticky on mobile */}
      <div className="sticky top-14 z-10 bg-gray-950/95 backdrop-blur -mx-4 px-4 pt-3 pb-2 mb-3 sm:relative sm:top-auto sm:bg-transparent sm:mx-0 sm:px-0 sm:pt-0 sm:backdrop-blur-none">

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
              <div className="max-h-52 overflow-y-auto">
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
