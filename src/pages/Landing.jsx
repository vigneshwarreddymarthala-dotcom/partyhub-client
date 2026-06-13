import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import EventCard from '../components/EventCard';

export default function Landing() {
  const [events, setEvents] = useState([]);
  const [rsvpCounts, setRsvpCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('active');

  useEffect(() => { fetchEvents(); }, [filter]);

  async function fetchEvents() {
    setLoading(true);
    let query = supabase.from('events').select('*').order('date', { ascending: true });
    if (filter === 'active') query = query.eq('status', 'active');
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
      <div className="text-center mb-8 sm:mb-12">
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white mb-3 tracking-tight leading-tight">
          Find your next <span className="text-brand-400">party</span>
        </h1>
        <p className="text-gray-400 text-base sm:text-lg max-w-xl mx-auto px-2">
          RSVP, connect with guests in private chat rooms, and never miss a moment.
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide pb-1">
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
          <p className="font-medium text-gray-400">No events yet</p>
          <p className="text-sm mt-1">Check back soon!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {events.map((event) => (
            <EventCard key={event.id} event={event} rsvpCount={rsvpCounts[event.id] ?? 0} />
          ))}
        </div>
      )}
    </div>
  );
}
