import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export default function MyEvents() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [rsvps, setRsvps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all' | 'upcoming' | 'ended'

  useEffect(() => {
    if (!session) { navigate('/login'); return; }
    fetchMyEvents();
  }, [session]);

  async function fetchMyEvents() {
    setLoading(true);
    const { data } = await supabase
      .from('rsvps')
      .select('id, checked_in, created_at, events(id, title, description, date, venue, capacity, status, image_url)')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });
    setRsvps(data ?? []);
    setLoading(false);
  }

  async function cancelRSVP(rsvpId, eventTitle) {
    if (!confirm(`Cancel your RSVP for "${eventTitle}"?`)) return;
    await supabase.from('rsvps').delete().eq('id', rsvpId);
    setRsvps(prev => prev.filter(r => r.id !== rsvpId));
  }

  const isEventExpired = (ev) => !ev || new Date(ev.date) < new Date();
  const isEventEnded = (ev) => !ev || ev.status !== 'active' || isEventExpired(ev);

  const upcomingCount = rsvps.filter(r => !isEventEnded(r.events)).length;
  const endedCount = rsvps.filter(r => isEventEnded(r.events)).length;

  const filtered = rsvps.filter(r => {
    if (filter === 'upcoming') return !isEventEnded(r.events);
    if (filter === 'ended') return isEventEnded(r.events);
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">My Events</h1>
        <p className="text-gray-400 text-sm mt-1">All the parties you've joined</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide pb-1">
        {[
          { key: 'all', label: `All (${rsvps.length})` },
          { key: 'upcoming', label: `Upcoming (${upcomingCount})` },
          { key: 'ended', label: `Ended (${endedCount})` },
        ].map(({ key, label }) => (
          <button key={key} onClick={() => setFilter(key)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap shrink-0 transition-colors ${filter === key ? 'bg-brand-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-28 rounded-2xl bg-gray-800 animate-pulse" />)}
        </div>
      )}

      {/* Empty */}
      {!loading && filtered.length === 0 && (
        <div className="text-center py-20">
          <p className="text-5xl mb-4">🎈</p>
          <p className="text-gray-300 font-semibold text-lg">
            {filter === 'all' ? "You haven't joined any events yet" : `No ${filter} events`}
          </p>
          <p className="text-gray-500 text-sm mt-1 mb-6">Browse events and hit RSVP to join!</p>
          <Link to="/" className="inline-flex px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-sm font-semibold text-white transition-colors">
            Browse Events
          </Link>
        </div>
      )}

      {/* Events list */}
      {!loading && filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map(({ id: rsvpId, checked_in, events: ev }) => {
            if (!ev) return null;
            const date = new Date(ev.date);
            const expired = isEventExpired(ev);
            const ended = isEventEnded(ev);
            return (
              <div key={rsvpId}
                className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden hover:border-gray-700 transition-colors">
                <div className="flex gap-0">
                  {/* Color strip */}
                  <div className={`w-2 shrink-0 ${ended ? 'bg-gray-700' : 'bg-brand-500'}`} />

                  <div className="flex-1 px-4 py-4 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="font-semibold text-white text-base truncate">{ev.title}</h3>
                          {checked_in && (
                            <span className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-green-900/60 text-green-400 border border-green-800/50">
                              ✓ Checked in
                            </span>
                          )}
                          {expired && (
                            <span className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-orange-900/40 text-orange-400 border border-orange-800/40">
                              ⏰ Expired
                            </span>
                          )}
                          {!expired && ev.status !== 'active' && (
                            <span className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-500">
                              Ended
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            📅 {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                            {' · '}
                            {date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                          </span>
                          <span className="flex items-center gap-1">📍 {ev.venue}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 shrink-0 flex-wrap sm:flex-nowrap">
                        {!ended && (
                          <Link to={`/rooms`}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-xs font-semibold text-white transition-colors">
                            💬 Chat
                          </Link>
                        )}
                        <Link to={`/event/${ev.id}`}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-xs text-gray-300 transition-colors">
                          View
                        </Link>
                        {!ended && (
                          <button onClick={() => cancelRSVP(rsvpId, ev.title)}
                            className="px-3 py-2 rounded-xl border border-red-900/50 text-xs text-red-400 hover:bg-red-900/20 transition-colors">
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
