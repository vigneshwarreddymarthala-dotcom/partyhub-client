import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  const [notFound, setNotFound] = useState(false);

  useEffect(() => { fetchAll(); }, [userId]);

  async function fetchAll() {
    setLoading(true);

    const { data: prof } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (!prof || (prof.role !== 'admin' && prof.role !== 'sub_admin')) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    setOrganizer(prof);

    const { data: events } = await supabase
      .from('events')
      .select('*')
      .eq('created_by', userId)
      .is('deleted_at', null)
      .neq('status', 'scheduled')
      .order('date', { ascending: false });

    const allEvents = events ?? [];
    const now = new Date();
    setUpcoming(allEvents.filter(e => e.status === 'active' && new Date(e.date) >= now));
    setPast(allEvents.filter(e => e.status === 'ended' || e.status === 'cancelled' || (e.status === 'active' && new Date(e.date) < now)));

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
      <div className="rounded-2xl overflow-hidden border border-gray-800 bg-gray-900 animate-pulse">
        <div className="h-48 sm:h-64 bg-gray-800" />
        <div className="px-5 sm:px-8 pb-6 pt-14">
          <div className="h-6 w-48 rounded bg-gray-800 mb-2" />
          <div className="h-4 w-32 rounded bg-gray-800" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => <div key={i} className="h-64 rounded-2xl bg-gray-800 animate-pulse" />)}
      </div>
    </div>
  );

  if (notFound) return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      <p className="text-5xl mb-4">🔍</p>
      <p className="text-white font-semibold text-lg mb-2">Organiser not found</p>
      <p className="text-gray-500 text-sm mb-6">This page doesn't exist or the organiser has been removed.</p>
      <button onClick={() => navigate('/')} className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-sm font-medium text-white transition-colors">
        Browse events
      </button>
    </div>
  );

  const initials = organizer.full_name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() ?? '?';
  const totalEvents = upcoming.length + past.length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-10">

      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-gray-500 hover:text-white transition-colors mb-5">
        ← Back
      </button>

      {/* Profile card */}
      <div className="rounded-2xl overflow-hidden border border-gray-800 bg-gray-900 mb-8 shadow-xl">

        {/* Cover banner */}
        <div className="relative h-40 sm:h-56 md:h-64 bg-gradient-to-br from-brand-800 via-purple-900 to-gray-900">
          {organizer.cover_url && (
            <img
              src={organizer.cover_url}
              alt="Cover"
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}
          {/* Gradient overlay for readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 to-transparent" />
        </div>

        {/* Info section — avatar overlaps cover */}
        <div className="relative px-5 sm:px-8 pb-6 sm:pb-8">
          {/* Avatar */}
          <div className="absolute -top-10 sm:-top-12 left-5 sm:left-8">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full ring-4 ring-gray-900 overflow-hidden bg-gradient-to-br from-brand-600 to-purple-700 flex items-center justify-center shrink-0 shadow-lg">
              {organizer.avatar_url
                ? <img src={organizer.avatar_url} alt={organizer.full_name} className="w-full h-full object-cover" />
                : <span className="text-2xl sm:text-3xl font-extrabold text-white select-none">{initials}</span>
              }
            </div>
          </div>

          {/* Name & meta — pushed down to clear avatar */}
          <div className="pt-12 sm:pt-14">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white leading-tight">{organizer.full_name}</h1>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-brand-900/60 text-brand-300 border border-brand-700/50 shrink-0">
                    {organizer.role === 'admin' ? '🛡️ Organiser' : '🎉 Host'}
                  </span>
                </div>
                {organizer.company_name && (
                  <p className="text-sm sm:text-base text-brand-400 font-medium mb-2">{organizer.company_name}</p>
                )}
              </div>
            </div>

            {organizer.bio && (
              <p className="text-sm sm:text-base text-gray-300 leading-relaxed mb-4 max-w-2xl">{organizer.bio}</p>
            )}

            {/* Stats row */}
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-500">
              {organizer.country && (
                <span className="flex items-center gap-1.5">
                  <span>🌍</span><span>{organizer.country}</span>
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <span>🎉</span>
                <span><span className="text-white font-semibold">{totalEvents}</span> event{totalEvents !== 1 ? 's' : ''} hosted</span>
              </span>
              {upcoming.length > 0 && (
                <span className="flex items-center gap-1.5 text-green-400">
                  <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
                  <span><span className="font-semibold">{upcoming.length}</span> upcoming</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming events */}
      <section className="mb-10">
        <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
          Upcoming Events
          <span className="text-sm text-gray-500 font-normal">({upcoming.length})</span>
        </h2>

        {upcoming.length === 0 ? (
          <div className="text-center py-10 bg-gray-900/50 border border-gray-800 rounded-2xl">
            <p className="text-3xl mb-2">📭</p>
            <p className="text-gray-500 text-sm">No upcoming events right now — check back soon!</p>
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
          <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-gray-600 inline-block" />
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
