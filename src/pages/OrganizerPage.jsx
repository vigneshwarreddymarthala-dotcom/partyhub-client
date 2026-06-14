import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import EventCard from '../components/EventCard';

export default function OrganizerPage() {
  const { userId } = useParams();
  const navigate = useNavigate();

  const [organizer, setOrganizer] = useState(null);
  const [upcoming, setUpcoming] = useState([]);
  const [past, setPast] = useState([]);
  const [rsvpCounts, setRsvpCounts] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAll(); }, [userId]);

  async function fetchAll() {
    setLoading(true);

    // Fetch organizer profile
    const { data: prof } = await supabase
      .from('profiles')
      .select('id, full_name, company_name, bio, country, role')
      .eq('id', userId)
      .in('role', ['admin', 'sub_admin'])
      .maybeSingle();

    if (!prof) { navigate('/'); return; }
    setOrganizer(prof);

    // Fetch their events (not archived)
    const { data: events } = await supabase
      .from('events')
      .select('*')
      .eq('created_by', userId)
      .is('deleted_at', null)
      .neq('status', 'scheduled')
      .order('date', { ascending: false });

    const allEvents = events ?? [];

    // Split into upcoming (active) and past (ended/cancelled)
    const now = new Date();
    const upcomingList = allEvents.filter(e => e.status === 'active' && new Date(e.date) >= now);
    const pastList = allEvents.filter(e => e.status === 'ended' || e.status === 'cancelled' || (e.status === 'active' && new Date(e.date) < now));

    setUpcoming(upcomingList);
    setPast(pastList);

    // Fetch RSVP counts for all events
    const counts = {};
    await Promise.all(allEvents.map(async (e) => {
      const { count } = await supabase.from('rsvps').select('*', { count: 'exact', head: true }).eq('event_id', e.id);
      counts[e.id] = count ?? 0;
    }));
    setRsvpCounts(counts);
    setLoading(false);
  }

  if (loading) return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-20 h-20 rounded-full bg-gray-800 animate-pulse" />
        <div className="space-y-2">
          <div className="h-6 w-40 rounded bg-gray-800 animate-pulse" />
          <div className="h-4 w-24 rounded bg-gray-800 animate-pulse" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => <div key={i} className="h-64 rounded-2xl bg-gray-800 animate-pulse" />)}
      </div>
    </div>
  );

  const initials = organizer.full_name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() ?? '?';

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">

      {/* Back */}
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-gray-500 hover:text-white transition-colors mb-6">
        ← Back
      </button>

      {/* Organizer header */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 sm:p-7 mb-8">
        <div className="flex items-start gap-4 sm:gap-6">
          {/* Avatar */}
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-brand-600 to-purple-700 flex items-center justify-center text-xl sm:text-2xl font-extrabold text-white shrink-0">
            {initials}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-xl sm:text-2xl font-extrabold text-white">{organizer.full_name}</h1>
              <span className="text-xs px-2 py-0.5 rounded-full bg-brand-900/50 text-brand-400 border border-brand-800/50">
                {organizer.role === 'admin' ? '🛡️ Organiser' : '🎉 Host'}
              </span>
            </div>
            {organizer.company_name && (
              <p className="text-sm text-brand-400 font-medium mb-2">{organizer.company_name}</p>
            )}
            {organizer.bio && (
              <p className="text-sm text-gray-400 leading-relaxed mb-3">{organizer.bio}</p>
            )}
            <div className="flex flex-wrap gap-3 text-xs text-gray-500">
              {organizer.country && (
                <span className="flex items-center gap-1">🌍 {organizer.country}</span>
              )}
              <span className="flex items-center gap-1">🎉 {upcoming.length + past.length} events hosted</span>
              {upcoming.length > 0 && (
                <span className="flex items-center gap-1 text-green-400">● {upcoming.length} upcoming</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming events */}
      <section className="mb-10">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-400 inline-block"></span>
          Upcoming Events
          <span className="text-sm text-gray-500 font-normal">({upcoming.length})</span>
        </h2>

        {upcoming.length === 0 ? (
          <div className="text-center py-10 bg-gray-900/50 border border-gray-800 rounded-2xl">
            <p className="text-3xl mb-2">📭</p>
            <p className="text-gray-500 text-sm">No upcoming events right now.</p>
            <p className="text-gray-600 text-xs mt-1">Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcoming.map(event => (
              <EventCard key={event.id} event={event} rsvpCount={rsvpCounts[event.id] ?? 0} />
            ))}
          </div>
        )}
      </section>

      {/* Past events */}
      {past.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-gray-500 inline-block"></span>
            Past Events
            <span className="text-sm text-gray-500 font-normal">({past.length})</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 opacity-70">
            {past.map(event => (
              <EventCard key={event.id} event={event} rsvpCount={rsvpCounts[event.id] ?? 0} />
            ))}
          </div>
        </section>
      )}

    </div>
  );
}
