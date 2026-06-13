import { useEffect, useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import ImageUpload from '../components/ImageUpload';

const VIEWS = [
  { label: '📊 Analytics', short: 'Stats' },
  { label: '➕ Create', short: 'Create' },
  { label: '🗂 Events', short: 'Events' },
  { label: '👤 Profile', short: 'Profile' },
];

export default function Admin() {
  const { session, profile, loading: authLoading, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [view, setView] = useState(0);
  const [stats, setStats] = useState({ activeEvents: 0, totalUsers: 0, totalRSVPs: 0 });
  const [form, setForm] = useState({ title: '', description: '', date: '', time: '', venue: '', capacity: '', image_url: '', maps_url: '' });
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [profileForm, setProfileForm] = useState({ full_name: '', company_name: '' });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');
  const [profileMsgType, setProfileMsgType] = useState('success');

  useEffect(() => {
    if (authLoading) return;
    if (!session || profile?.role !== 'admin') navigate('/admin/login');
  }, [session, profile, authLoading]);

  useEffect(() => {
    if (profile?.role === 'admin') {
      fetchStats(); fetchEvents();
      setProfileForm({ full_name: profile.full_name ?? '', company_name: profile.company_name ?? '' });
    }
  }, [profile]);

  async function saveProfile(e) {
    e.preventDefault(); setProfileSaving(true); setProfileMsg('');
    const { error } = await supabase.from('profiles').update({
      full_name: profileForm.full_name.trim(),
      company_name: profileForm.company_name.trim() || null,
    }).eq('id', session.user.id);
    if (error) { setProfileMsgType('error'); setProfileMsg(error.message); }
    else { await refreshProfile(); setProfileMsgType('success'); setProfileMsg('✓ Profile updated!'); setTimeout(() => setProfileMsg(''), 3000); }
    setProfileSaving(false);
  }

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
    const { data } = await supabase
      .from('events')
      .select('*, rsvps(id), chat_rooms(id)')
      .order('date', { ascending: false });
    setEvents(data ?? []);
    setEventsLoading(false);
  }

  async function handleCreateEvent(e) {
    e.preventDefault();
    setFormError(''); setFormSuccess(''); setFormLoading(true);
    const datetime = new Date(`${form.date}T${form.time}`).toISOString();
    const { error } = await supabase.from('events').insert({
      title: form.title.trim(),
      description: form.description.trim() || null,
      date: datetime,
      venue: form.venue.trim(),
      capacity: parseInt(form.capacity),
      image_url: form.image_url || null,
      maps_url: form.maps_url.trim() || null,
      created_by: session.user.id,
    });
    if (error) { setFormError(error.message); setFormLoading(false); return; }
    setForm({ title: '', description: '', date: '', time: '', venue: '', capacity: '', image_url: '', maps_url: '' });
    await Promise.all([fetchStats(), fetchEvents()]);
    setFormSuccess('✓ Event created!');
    setFormLoading(false);
    setTimeout(() => setFormSuccess(''), 3000);
  }

  async function deleteEvent(id) {
    if (!confirm('Delete this event? This will remove the chat room and all RSVPs.')) return;
    await supabase.from('events').delete().eq('id', id);
    fetchEvents(); fetchStats();
  }

  if (authLoading || !profile) return null;
  if (profile.role !== 'admin') return null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Admin Console</h1>
          <p className="text-xs text-gray-500 mt-0.5">Logged in as {profile.full_name}</p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Link to="/admin/rooms"
            className="flex items-center gap-1.5 text-xs text-brand-400 hover:text-brand-300 border border-brand-800 hover:border-brand-600 px-3 py-1.5 rounded-lg transition-colors">
            💬 Rooms
          </Link>
          <button onClick={async () => { await supabase.auth.signOut(); navigate('/'); }}
            className="text-xs text-gray-500 hover:text-white border border-gray-700 px-3 py-1.5 rounded-lg transition-colors">
            Sign out
          </button>
        </div>
      </div>

      {/* Tabs — horizontal scroll on mobile */}
      <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1 mb-6 overflow-x-auto scrollbar-hide">
        {VIEWS.map((v, i) => (
          <button key={v.label} onClick={() => setView(i)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap flex-1 min-w-[80px] ${view === i ? 'bg-brand-600 text-white' : 'text-gray-400 hover:text-white'}`}>
            <span className="hidden sm:inline">{v.label}</span>
            <span className="sm:hidden">{v.short}</span>
          </button>
        ))}
      </div>

      {/* ── View 1: Analytics ── */}
      {view === 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {[
            { label: 'Active Parties', value: stats.activeEvents, icon: '🎉' },
            { label: 'Total Sign-ups', value: stats.totalUsers, icon: '👥' },
            { label: 'Total RSVPs', value: stats.totalRSVPs, icon: '✅' },
          ].map(({ label, value, icon }) => (
            <div key={label} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 sm:p-6 flex items-center gap-4">
              <span className="text-3xl">{icon}</span>
              <div>
                <p className="text-3xl sm:text-4xl font-extrabold text-white">{value}</p>
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
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-3 text-sm text-white focus:outline-none focus:border-brand-500"
                placeholder="Summer Rooftop Party" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Description</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={3} maxLength={500}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-3 text-sm text-white focus:outline-none focus:border-brand-500 resize-none"
                placeholder="Tell guests what to expect…" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Date *</label>
                <input required type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-3 text-sm text-white focus:outline-none focus:border-brand-500" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Time *</label>
                <input required type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-3 text-sm text-white focus:outline-none focus:border-brand-500" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Venue *</label>
              <input required value={form.venue} onChange={e => setForm(f => ({ ...f, venue: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-3 text-sm text-white focus:outline-none focus:border-brand-500"
                placeholder="123 Main St, City" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Capacity *</label>
              <input required type="number" min={1} value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-3 text-sm text-white focus:outline-none focus:border-brand-500"
                placeholder="50" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Google Maps Link</label>
              <input type="text" value={form.maps_url} onChange={e => setForm(f => ({ ...f, maps_url: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-3 text-sm text-white focus:outline-none focus:border-brand-500"
                placeholder="Paste any map link…" />
              <p className="text-xs text-gray-600 mt-1">Google Maps, short links, Apple Maps — any URL works</p>
            </div>
            <ImageUpload
              currentUrl={form.image_url}
              onUpload={(url) => setForm(f => ({ ...f, image_url: url }))}
            />
            {formError && <p className="text-red-400 text-xs bg-red-900/20 border border-red-800/40 rounded-lg px-3 py-2">{formError}</p>}
            {formSuccess && <p className="text-green-400 text-xs bg-green-900/20 border border-green-800/40 rounded-lg px-3 py-2">{formSuccess}</p>}
            <button type="submit" disabled={formLoading}
              className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-sm font-semibold text-white transition-colors disabled:opacity-60">
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
            <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-16 rounded-xl bg-gray-800 animate-pulse" />)}</div>
          ) : events.length === 0 ? (
            <p className="text-gray-500 text-sm">No events yet.</p>
          ) : (
            <div className="space-y-3">
              {events.map((ev) => {
                const rsvpCount = ev.rsvps?.length ?? 0;
                const roomId = ev.chat_rooms?.[0]?.id;
                return (
                  <div key={ev.id} className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-white text-sm truncate">{ev.title}</p>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                        <span className="text-xs text-gray-500">
                          {new Date(ev.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        <span className="text-gray-700">·</span>
                        <span className="text-xs text-gray-500 truncate max-w-[140px]">{ev.venue}</span>
                        <span className="text-gray-700">·</span>
                        <span className={`text-xs font-medium ${ev.status === 'active' ? 'text-green-400' : 'text-gray-500'}`}>{ev.status}</span>
                        <span className="text-gray-700">·</span>
                        <span className="text-xs text-brand-400 font-medium">👥 {rsvpCount} / {ev.capacity}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      {roomId && (
                        <button
                          onClick={() => navigate(`/admin/rooms?room=${roomId}`)}
                          className="flex items-center justify-center w-9 h-9 rounded-lg bg-brand-900/50 hover:bg-brand-800/60 text-brand-400 transition-colors"
                          title="Open chat room"
                        >
                          💬
                        </button>
                      )}
                      <Link to={`/admin/event/${ev.id}`}
                        className="flex-1 sm:flex-none text-center px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-xs text-gray-300 transition-colors">
                        Manage
                      </Link>
                      <button onClick={() => deleteEvent(ev.id)}
                        className="flex-1 sm:flex-none px-3 py-2 rounded-lg bg-red-900/30 hover:bg-red-900/60 text-xs text-red-400 transition-colors">
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── View 4: Organiser Profile ── */}
      {view === 3 && (
        <div className="max-w-md">
          <h2 className="text-lg font-semibold text-white mb-1">Organiser Profile</h2>
          <p className="text-xs text-gray-500 mb-5">This info is shown on event pages so attendees know who's hosting.</p>
          <form onSubmit={saveProfile} className="space-y-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Person Name *</label>
              <input required value={profileForm.full_name} onChange={e => setProfileForm(f => ({ ...f, full_name: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-3 text-sm text-white focus:outline-none focus:border-brand-500"
                placeholder="Your full name" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Company / Organisation Name <span className="text-gray-600">(optional)</span></label>
              <input value={profileForm.company_name} onChange={e => setProfileForm(f => ({ ...f, company_name: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-3 text-sm text-white focus:outline-none focus:border-brand-500"
                placeholder="e.g. Expat Stuttgart e.V." />
            </div>
            <div className="pt-1 pb-2 border-t border-gray-800">
              <p className="text-xs text-gray-600 mt-2">Email: <span className="text-gray-400">{session?.user?.email}</span></p>
            </div>
            {profileMsg && (
              <p className={`text-xs rounded-lg px-3 py-2 ${profileMsgType === 'success' ? 'text-green-400 bg-green-900/20 border border-green-800/40' : 'text-red-400 bg-red-900/20 border border-red-800/40'}`}>
                {profileMsg}
              </p>
            )}
            <button type="submit" disabled={profileSaving}
              className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-sm font-semibold text-white transition-colors disabled:opacity-60">
              {profileSaving ? 'Saving…' : 'Save Profile'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
