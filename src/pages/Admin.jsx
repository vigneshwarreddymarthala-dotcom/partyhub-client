import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const VIEWS = ['Analytics', 'Create Event', 'Manage Events'];

export default function Admin() {
  const { session, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [view, setView] = useState(0);

  // Analytics
  const [stats, setStats] = useState({ activeEvents: 0, totalUsers: 0, totalRSVPs: 0 });

  // Event form
  const [form, setForm] = useState({ title: '', description: '', date: '', time: '', venue: '', capacity: '' });
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  // Events list
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!session || profile?.role !== 'admin') {
      navigate('/');
    }
  }, [session, profile, authLoading]);

  useEffect(() => {
    if (profile?.role === 'admin') {
      fetchStats();
      fetchEvents();
    }
  }, [profile]);

  async function fetchStats() {
    const [{ count: activeEvents }, { count: totalUsers }, { count: totalRSVPs }] = await Promise.all([
      supabase.from('events').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('rsvps').select('*', { count: 'exact', head: true }),
    ]);
    setStats({ activeEvents: activeEvents ?? 0, totalUsers: totalUsers ?? 0, totalRSVPs: totalRSVPs ?? 0 });
  }

  async function fetchEvents() {
    setEventsLoading(true);
    const { data } = await supabase.from('events').select('*').order('date', { ascending: false });
    setEvents(data ?? []);
    setEventsLoading(false);
  }

  async function handleCreateEvent(e) {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    setFormLoading(true);

    const datetime = new Date(`${form.date}T${form.time}`).toISOString();
    const { error } = await supabase.from('events').insert({
      title: form.title.trim(),
      description: form.description.trim() || null,
      date: datetime,
      venue: form.venue.trim(),
      capacity: parseInt(form.capacity),
      created_by: session.user.id,
    });

    if (error) { setFormError(error.message); setFormLoading(false); return; }

    setFormSuccess('Event created!');
    setForm({ title: '', description: '', date: '', time: '', venue: '', capacity: '' });
    fetchStats();
    fetchEvents();
    setFormLoading(false);
  }

  async function deleteEvent(id) {
    if (!confirm('Delete this event? This will remove the chat room and all RSVPs.')) return;
    await supabase.from('events').delete().eq('id', id);
    fetchEvents();
    fetchStats();
  }

  if (authLoading || !profile) return null;
  if (profile.role !== 'admin') return null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Admin Console</h1>
        <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1">
          {VIEWS.map((v, i) => (
            <button
              key={v}
              onClick={() => setView(i)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                view === i ? 'bg-brand-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* ── View 1: Analytics ── */}
      {view === 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Active Parties', value: stats.activeEvents, icon: '🎉' },
            { label: 'Total Sign-ups', value: stats.totalUsers, icon: '👥' },
            { label: 'Total RSVPs', value: stats.totalRSVPs, icon: '✅' },
          ].map(({ label, value, icon }) => (
            <div key={label} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 flex items-center gap-4">
              <span className="text-3xl">{icon}</span>
              <div>
                <p className="text-3xl font-extrabold text-white">{value}</p>
                <p className="text-sm text-gray-400">{label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── View 2: Create Event ── */}
      {view === 1 && (
        <div className="max-w-lg">
          <h2 className="text-lg font-semibold text-white mb-4">New Event</h2>
          <form onSubmit={handleCreateEvent} className="space-y-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Title *</label>
              <input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500"
                placeholder="Summer Rooftop Party" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Description</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={3} maxLength={500}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500 resize-none"
                placeholder="Tell guests what to expect…" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Date *</label>
                <input required type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Time *</label>
                <input required type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Venue *</label>
              <input required value={form.venue} onChange={e => setForm(f => ({ ...f, venue: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500"
                placeholder="123 Main St, City" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Capacity *</label>
              <input required type="number" min={1} value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500"
                placeholder="50" />
            </div>

            {formError && <p className="text-red-400 text-xs bg-red-900/20 border border-red-800/40 rounded-lg px-3 py-2">{formError}</p>}
            {formSuccess && <p className="text-green-400 text-xs bg-green-900/20 border border-green-800/40 rounded-lg px-3 py-2">{formSuccess}</p>}

            <button type="submit" disabled={formLoading}
              className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-sm font-semibold text-white transition-colors disabled:opacity-60">
              {formLoading ? 'Creating…' : 'Post Event'}
            </button>
          </form>
        </div>
      )}

      {/* ── View 3: Manage Events ── */}
      {view === 2 && (
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">All Events</h2>
          {eventsLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => <div key={i} className="h-16 rounded-xl bg-gray-800 animate-pulse" />)}
            </div>
          ) : events.length === 0 ? (
            <p className="text-gray-500 text-sm">No events yet. Create one in the Create Event tab.</p>
          ) : (
            <div className="space-y-3">
              {events.map((ev) => (
                <div key={ev.id} className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-white text-sm truncate">{ev.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {new Date(ev.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      {' · '}
                      {ev.venue}
                      {' · '}
                      <span className={ev.status === 'active' ? 'text-green-400' : 'text-gray-500'}>
                        {ev.status}
                      </span>
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Link
                      to={`/admin/event/${ev.id}`}
                      className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-xs text-gray-300 transition-colors"
                    >
                      Manage
                    </Link>
                    <button
                      onClick={() => deleteEvent(ev.id)}
                      className="px-3 py-1.5 rounded-lg bg-red-900/30 hover:bg-red-900/60 text-xs text-red-400 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
