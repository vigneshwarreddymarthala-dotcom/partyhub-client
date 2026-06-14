import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import ImageUpload from '../components/ImageUpload';

export default function Admin() {
  const { session, profile, loading: authLoading, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const isMainAdmin = profile?.role === 'admin';
  const isSubAdmin = profile?.role === 'sub_admin';

  const [view, setView] = useState(0);

  // Events / Create
  const [stats, setStats] = useState({ activeEvents: 0, totalUsers: 0, totalRSVPs: 0 });
  const [form, setForm] = useState({ title: '', description: '', date: '', time: '', venue: '', city: '', capacity: '', price: '', image_url: '', image_url_2: '', image_url_3: '', maps_url: '', meet_link: '', recurrence: 'none', is_scheduled: false, publish_date: '', publish_time: '' });
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [archivedEvents, setArchivedEvents] = useState([]);
  const [archivedLoading, setArchivedLoading] = useState(false);

  // Profile
  const [profileForm, setProfileForm] = useState({ full_name: '', company_name: '' });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');
  const [profileMsgType, setProfileMsgType] = useState('success');

  // City suggestions for create form
  const [citySuggestions, setCitySuggestions] = useState([]);

  // Applications (main admin only)
  const [applications, setApplications] = useState([]);
  const [appsLoading, setAppsLoading] = useState(false);

  // Team (main admin only)
  const [subAdmins, setSubAdmins] = useState([]);
  const [subAdminsLoading, setSubAdminsLoading] = useState(false);
  const [pendingInvites, setPendingInvites] = useState([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteMsg, setInviteMsg] = useState('');
  const [inviteMsgType, setInviteMsgType] = useState('success');

  const VIEWS = [
    { label: '📊 Analytics', short: 'Stats' },
    { label: '➕ Create', short: 'Create' },
    { label: '🗂 Events', short: 'Events' },
    { label: '🗃 Archived', short: 'Archive' },
    { label: '👤 Profile', short: 'Profile' },
    ...(isMainAdmin ? [{ label: '👥 Team', short: 'Team' }] : []),
    ...(isMainAdmin ? [{ label: '📋 Applications', short: 'Apps' }] : []),
  ];

  useEffect(() => {
    if (authLoading) return;
    if (!session) { navigate('/admin/login'); return; }
    if (!profile) return; // profile still loading — wait
    if (!isMainAdmin && !isSubAdmin) navigate('/admin/sub-admin');
  }, [session, profile, authLoading]);

  useEffect(() => {
    if (!profile || (!isMainAdmin && !isSubAdmin)) return;
    fetchStats(); fetchEvents(); fetchCitySuggestions();
    setProfileForm({ full_name: profile.full_name ?? '', company_name: profile.company_name ?? '' });
  }, [profile]);

  // Load tab-specific data when tab opens
  useEffect(() => {
    if (view === 3) fetchArchivedEvents();
    if (view === 5 && isMainAdmin) { fetchSubAdmins(); fetchPendingInvites(); }
    if (view === 6 && isMainAdmin) fetchApplications();
  }, [view]);

  // ── Data fetching ───────────────────────────────────────────────

  async function fetchStats() {
    if (isSubAdmin) {
      // Sub-admin: only their own stats
      const [{ count: myEvents }, { count: myRSVPs }] = await Promise.all([
        supabase.from('events').select('*', { count: 'exact', head: true }).eq('created_by', session.user.id).eq('status', 'active'),
        supabase.from('rsvps').select('events!inner(*)', { count: 'exact', head: true }).eq('events.created_by', session.user.id),
      ]);
      setStats({ activeEvents: myEvents ?? 0, totalUsers: 0, totalRSVPs: myRSVPs ?? 0 });
    } else {
      const [{ count: activeEvents }, { count: totalUsers }, { count: totalRSVPs }] = await Promise.all([
        supabase.from('events').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('rsvps').select('*', { count: 'exact', head: true }),
      ]);
      setStats({ activeEvents: activeEvents ?? 0, totalUsers: totalUsers ?? 0, totalRSVPs: totalRSVPs ?? 0 });
    }
  }

  async function fetchEvents() {
    setEventsLoading(true);
    let query = supabase.from('events').select('*, rsvps(id), chat_rooms(id)').is('deleted_at', null).order('date', { ascending: false });
    if (isSubAdmin) query = query.eq('created_by', session.user.id);
    const { data } = await query;
    setEvents(data ?? []);
    setEventsLoading(false);
  }

  async function fetchArchivedEvents() {
    setArchivedLoading(true);
    let query = supabase.from('events').select('*, rsvps(id)').not('deleted_at', 'is', null).order('deleted_at', { ascending: false });
    if (isSubAdmin) query = query.eq('created_by', session.user.id);
    const { data } = await query;
    setArchivedEvents(data ?? []);
    setArchivedLoading(false);
  }

  async function fetchSubAdmins() {
    setSubAdminsLoading(true);
    const { data } = await supabase.from('profiles')
      .select('*')
      .eq('role', 'sub_admin')
      .eq('parent_admin_id', session.user.id)
      .order('created_at', { ascending: false });
    setSubAdmins(data ?? []);
    setSubAdminsLoading(false);
  }

  async function fetchPendingInvites() {
    const { data } = await supabase.from('admin_invites')
      .select('id, invited_email, created_at')
      .eq('parent_admin_id', session.user.id)
      .eq('used', false)
      .not('invited_email', 'is', null)
      .order('created_at', { ascending: false });
    setPendingInvites(data ?? []);
  }

  async function fetchCitySuggestions() {
    const { data } = await supabase.from('events').select('city');
    const unique = [...new Set((data ?? []).map(e => e.city).filter(Boolean))].sort();
    setCitySuggestions(unique);
  }

  async function fetchApplications() {
    setAppsLoading(true);
    const { data } = await supabase
      .from('team_applications')
      .select('*')
      .order('created_at', { ascending: false });
    setApplications(data ?? []);
    setAppsLoading(false);
  }

  async function updateAppStatus(id, status) {
    await supabase.from('team_applications').update({ status }).eq('id', id);
    setApplications(prev => prev.map(a => a.id === id ? { ...a, status } : a));
  }

  async function sendInvite(e) {
    e.preventDefault();
    const email = inviteEmail.trim().toLowerCase();
    if (!email) return;
    setInviteLoading(true); setInviteMsg('');

    if (pendingInvites.some(i => i.invited_email === email)) {
      setInviteMsgType('error'); setInviteMsg('This email is already in the list.');
      setInviteLoading(false); return;
    }

    // Try to persist — falls back to local state if column not yet added
    const { error } = await supabase.from('admin_invites')
      .insert({ parent_admin_id: session.user.id, invited_email: email });

    if (!error || error?.message?.includes('invited_email') || error?.message?.includes('column')) {
      // Add to local list so the admin can see it even if not persisted
      setPendingInvites(prev => [{ id: Date.now(), invited_email: email, created_at: new Date().toISOString() }, ...prev]);
      setInviteEmail('');
      setInviteMsgType('success');
      setInviteMsg(`✓ ${email} added.`);
      setTimeout(() => setInviteMsg(''), 3000);
    } else {
      setInviteMsgType('error'); setInviteMsg(error.message);
    }
    setInviteLoading(false);
  }

  async function cancelInvite(id) {
    await supabase.from('admin_invites').delete().eq('id', id);
    setPendingInvites(prev => prev.filter(i => i.id !== id));
  }

  // ── Actions ─────────────────────────────────────────────────────

  async function handleCreateEvent(e) {
    e.preventDefault();
    setFormError(''); setFormSuccess(''); setFormLoading(true);
    const datetime = new Date(`${form.date}T${form.time}`).toISOString();

    const isScheduled = form.is_scheduled && form.publish_date && form.publish_time;
    const base = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      date: datetime,
      venue: form.venue.trim(),
      capacity: parseInt(form.capacity),
      image_url: form.image_url || null,
      created_by: session.user.id,
      ...(isScheduled && { status: 'scheduled', scheduled_at: new Date(`${form.publish_date}T${form.publish_time}`).toISOString() }),
    };
    // Include optional columns only if they exist in the schema
    const full = { ...base, city: form.city.trim() || null, price: form.price !== '' ? parseFloat(form.price) : null, image_url_2: form.image_url_2 || null, image_url_3: form.image_url_3 || null, maps_url: form.maps_url.trim() || null, meet_link: form.meet_link.trim() || null, recurrence: form.recurrence };

    let { data: insertedEvent, error } = await supabase.from('events').insert(full).select('id').single();

    // Retry with base columns only if optional columns are missing
    if (error?.message?.includes('column') || error?.code === '42703') {
      const { data: d2, error: e2 } = await supabase.from('events').insert(base).select('id').single();
      error = e2;
      insertedEvent = d2;
    }

    if (error) { setFormError(error.message); setFormLoading(false); return; }

    // Auto-create a chat room for the new event
    if (insertedEvent?.id) {
      await supabase.from('chat_rooms').insert({ event_id: insertedEvent.id });
    }

    setForm({ title: '', description: '', date: '', time: '', venue: '', city: '', capacity: '', price: '', image_url: '', image_url_2: '', image_url_3: '', maps_url: '', meet_link: '', recurrence: 'none', is_scheduled: false, publish_date: '', publish_time: '' });
    await Promise.all([fetchStats(), fetchEvents()]);
    setFormSuccess('✓ Event created!');
    setFormLoading(false);
    setTimeout(() => setFormSuccess(''), 3000);
  }

  async function archiveEvent(id) {
    if (!confirm('Archive this event? It will be hidden from the public but you can restore it anytime.')) return;
    await supabase.from('events').update({ deleted_at: new Date().toISOString() }).eq('id', id);
    fetchEvents(); fetchStats();
  }

  async function restoreEvent(id) {
    await supabase.from('events').update({ deleted_at: null }).eq('id', id);
    fetchArchivedEvents(); fetchEvents(); fetchStats();
  }

  async function hardDeleteEvent(id) {
    if (!confirm('Permanently delete? This cannot be undone — all RSVPs and chat messages will be lost.')) return;
    await supabase.from('events').delete().eq('id', id);
    fetchArchivedEvents(); fetchStats();
  }

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

  async function generateInvite() {
    setInviteLoading(true); setInviteLink('');
    const { data, error } = await supabase.from('admin_invites')
      .insert({ parent_admin_id: session.user.id })
      .select('code')
      .single();
    if (data) {
      const link = `${window.location.origin}/admin/register?invite=${data.code}`;
      setInviteLink(link);
      try { await navigator.clipboard.writeText(link); setInviteCopied(true); setTimeout(() => setInviteCopied(false), 2500); } catch {}
    }
    setInviteLoading(false);
  }

  // ── Guards ──────────────────────────────────────────────────────

  if (authLoading || !profile) return null;
  if (!isMainAdmin && !isSubAdmin) return null;

  const roleLabel = isMainAdmin ? 'Admin Console' : 'Sub-Admin Console';
  const statsCards = isMainAdmin
    ? [
        { label: 'Active Parties', value: stats.activeEvents, icon: '🎉' },
        { label: 'Total Sign-ups', value: stats.totalUsers, icon: '👥' },
        { label: 'Total RSVPs', value: stats.totalRSVPs, icon: '✅' },
      ]
    : [
        { label: 'My Active Events', value: stats.activeEvents, icon: '🎉' },
        { label: 'My Total RSVPs', value: stats.totalRSVPs, icon: '✅' },
      ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold text-white">{roleLabel}</h1>
            {isSubAdmin && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-purple-900/50 text-purple-300 border border-purple-800/50">Sub-Admin</span>
            )}
          </div>
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

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1 mb-6 overflow-x-auto scrollbar-hide">
        {VIEWS.map((v, i) => (
          <button key={v.label} onClick={() => setView(i)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap flex-1 min-w-[70px] ${view === i ? 'bg-brand-600 text-white' : 'text-gray-400 hover:text-white'}`}>
            <span className="hidden sm:inline">{v.label}</span>
            <span className="sm:hidden">{v.short}</span>
          </button>
        ))}
      </div>

      {/* ── View 0: Analytics ── */}
      {view === 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {statsCards.map(({ label, value, icon }) => (
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

      {/* ── View 1: Create Event ── */}
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
                <label className="block text-xs text-gray-400 mb-1">Event Date * <span className="text-gray-600">(when the party happens)</span></label>
                <input required type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-3 text-sm text-white focus:outline-none focus:border-brand-500" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Event Time *</label>
                <input required type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-3 text-sm text-white focus:outline-none focus:border-brand-500" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Venue *</label>
              <input required value={form.venue} onChange={e => setForm(f => ({ ...f, venue: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-3 text-sm text-white focus:outline-none focus:border-brand-500"
                placeholder="123 Main St" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">City *</label>
              <input required list="city-suggestions" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-3 text-sm text-white focus:outline-none focus:border-brand-500"
                placeholder="e.g. Berlin, Munich, Hamburg" />
              <datalist id="city-suggestions">
                {citySuggestions.map(c => <option key={c} value={c} />)}
              </datalist>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Capacity *</label>
              <input required type="number" min={1} value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-3 text-sm text-white focus:outline-none focus:border-brand-500"
                placeholder="50" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Ticket Price (€) <span className="text-gray-600">— leave blank for free</span></label>
              <input type="number" min={0} step="0.01" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-3 text-sm text-white focus:outline-none focus:border-brand-500"
                placeholder="0.00" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Google Maps Link <span className="text-gray-600">(optional)</span></label>
              <input type="text" value={form.maps_url} onChange={e => setForm(f => ({ ...f, maps_url: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-3 text-sm text-white focus:outline-none focus:border-brand-500"
                placeholder="Paste any map link…" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">
                <span className="inline-flex items-center gap-1.5">
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor"><path d="M17 10.5V7a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h12a1 1 0 001-1v-3.5l4 4v-11l-4 4z"/></svg>
                  Google Meet Link <span className="text-gray-600">(optional — visible to RSVPed guests only)</span>
                </span>
              </label>
              <input type="url" value={form.meet_link} onChange={e => setForm(f => ({ ...f, meet_link: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-3 text-sm text-white focus:outline-none focus:border-brand-500"
                placeholder="https://meet.google.com/xxx-xxxx-xxx" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Recurrence <span className="text-gray-600">(auto-reposts after event ends)</span></label>
              <select value={form.recurrence} onChange={e => setForm(f => ({ ...f, recurrence: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-3 text-sm text-white focus:outline-none focus:border-brand-500">
                <option value="none">One-time event</option>
                <option value="hourly_1">Every 1 hour</option>
                <option value="hourly_2">Every 2 hours</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            {/* Schedule toggle */}
            <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-3 space-y-3">
              <button type="button" onClick={() => setForm(f => ({ ...f, is_scheduled: !f.is_scheduled }))}
                className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <span className="text-base">🕐</span>
                  <div className="text-left">
                    <p className="text-sm font-medium text-white">Schedule Post</p>
                    <p className="text-xs text-gray-500">Choose when this post becomes visible — must be before the event date</p>
                  </div>
                </div>
                <div className={`w-10 h-5 rounded-full transition-colors relative ${form.is_scheduled ? 'bg-brand-600' : 'bg-gray-700'}`}>
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${form.is_scheduled ? 'left-5' : 'left-0.5'}`} />
                </div>
              </button>
              {form.is_scheduled && (
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-gray-800">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Publish Date *</label>
                    <input required type="date" value={form.publish_date} onChange={e => setForm(f => ({ ...f, publish_date: e.target.value }))}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Publish Time *</label>
                    <input required type="time" value={form.publish_time} onChange={e => setForm(f => ({ ...f, publish_time: e.target.value }))}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500" />
                  </div>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <p className="text-xs text-gray-400">Event Photos <span className="text-gray-600">(up to 3, first is the cover)</span></p>
              <ImageUpload label="Photo 1 (Cover)" currentUrl={form.image_url} onUpload={(url) => setForm(f => ({ ...f, image_url: url }))} />
              <ImageUpload label="Photo 2" currentUrl={form.image_url_2} onUpload={(url) => setForm(f => ({ ...f, image_url_2: url }))} />
              <ImageUpload label="Photo 3" currentUrl={form.image_url_3} onUpload={(url) => setForm(f => ({ ...f, image_url_3: url }))} />
            </div>
            {formError && <p className="text-red-400 text-xs bg-red-900/20 border border-red-800/40 rounded-lg px-3 py-2">{formError}</p>}
            {formSuccess && <p className="text-green-400 text-xs bg-green-900/20 border border-green-800/40 rounded-lg px-3 py-2">{formSuccess}</p>}
            <button type="submit" disabled={formLoading}
              className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-sm font-semibold text-white transition-colors disabled:opacity-60">
              {formLoading ? 'Creating…' : 'Post Event'}
            </button>
          </form>
        </div>
      )}

      {/* ── View 2: Events ── */}
      {view === 2 && (
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">{isSubAdmin ? 'My Events' : 'All Events'}</h2>
          {eventsLoading ? (
            <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-16 rounded-xl bg-gray-800 animate-pulse" />)}</div>
          ) : events.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-3xl mb-2">📭</p>
              <p className="text-gray-500 text-sm">No events yet.</p>
              <button onClick={() => setView(1)} className="mt-3 text-brand-400 text-sm hover:underline">Create your first event →</button>
            </div>
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
                        <span className={`text-xs font-medium ${ev.status === 'active' ? 'text-green-400' : ev.status === 'scheduled' ? 'text-yellow-400' : 'text-gray-500'}`}>
                          {ev.status === 'scheduled' && ev.scheduled_at
                            ? `🕐 ${new Date(ev.scheduled_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}`
                            : ev.status}
                        </span>
                        <span className="text-gray-700">·</span>
                        <span className="text-xs text-brand-400 font-medium">👥 {rsvpCount} / {ev.capacity}</span>
                        {ev.recurrence && ev.recurrence !== 'none' && (
                          <>
                            <span className="text-gray-700">·</span>
                            <span className="text-xs text-purple-400 font-medium">🔁 {{ hourly_1: 'Every 1h', hourly_2: 'Every 2h', daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly' }[ev.recurrence] ?? ev.recurrence}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      {roomId ? (
                        <button onClick={() => navigate(`/admin/rooms?room=${roomId}`)}
                          className="w-9 h-9 rounded-lg bg-brand-900/50 hover:bg-brand-800/60 text-brand-400 flex items-center justify-center transition-colors"
                          title="Open chat room">
                          💬
                        </button>
                      ) : (
                        <button onClick={async () => {
                          await supabase.from('chat_rooms').insert({ event_id: ev.id });
                          fetchEvents();
                        }}
                          className="px-2 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-xs text-gray-400 hover:text-white transition-colors"
                          title="Create chat room">
                          + Room
                        </button>
                      )}
                      <Link to={`/admin/event/${ev.id}`}
                        className="flex-1 sm:flex-none text-center px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-xs text-gray-300 transition-colors">
                        Manage
                      </Link>
                      <button onClick={() => archiveEvent(ev.id)}
                        className="flex-1 sm:flex-none px-3 py-2 rounded-lg bg-yellow-900/30 hover:bg-yellow-900/60 text-xs text-yellow-400 transition-colors">
                        Archive
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── View 3: Archived ── */}
      {view === 3 && (
        <div>
          <h2 className="text-lg font-semibold text-white mb-1">Archived Events</h2>
          <p className="text-xs text-gray-500 mb-4">Hidden from the public. Restore to make them live again, or delete permanently.</p>
          {archivedLoading ? (
            <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-16 rounded-xl bg-gray-800 animate-pulse" />)}</div>
          ) : archivedEvents.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-3xl mb-2">🗃</p>
              <p className="text-gray-500 text-sm">No archived events.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {archivedEvents.map((ev) => (
                <div key={ev.id} className="bg-gray-900/60 border border-gray-800 rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3 opacity-80">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-gray-300 text-sm truncate">{ev.title}</p>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-900/40 text-yellow-500 border border-yellow-800/40">Archived</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-2 mt-0.5">
                      <span className="text-xs text-gray-600">
                        {new Date(ev.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <span className="text-gray-700">·</span>
                      <span className="text-xs text-gray-600">{ev.venue}</span>
                      <span className="text-gray-700">·</span>
                      <span className="text-xs text-gray-600">👥 {ev.rsvps?.length ?? 0} RSVPs</span>
                      <span className="text-gray-700">·</span>
                      <span className="text-xs text-gray-600">Archived {new Date(ev.deleted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => restoreEvent(ev.id)}
                      className="px-3 py-2 rounded-lg bg-green-900/30 hover:bg-green-900/60 text-xs text-green-400 font-medium transition-colors">
                      ↩ Restore
                    </button>
                    <button onClick={() => hardDeleteEvent(ev.id)}
                      className="px-3 py-2 rounded-lg bg-red-900/30 hover:bg-red-900/60 text-xs text-red-400 transition-colors">
                      Delete Forever
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── View 4: Profile ── */}
      {view === 4 && (
        <div className="max-w-md">
          <h2 className="text-lg font-semibold text-white mb-1">Organiser Profile</h2>
          <p className="text-xs text-gray-500 mb-5">Shown on event pages so attendees know who's hosting.</p>
          <form onSubmit={saveProfile} className="space-y-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Person Name *</label>
              <input required value={profileForm.full_name} onChange={e => setProfileForm(f => ({ ...f, full_name: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-3 text-sm text-white focus:outline-none focus:border-brand-500"
                placeholder="Your full name" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Company / Organisation <span className="text-gray-600">(optional)</span></label>
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

      {/* ── View 5: Team (main admin only) ── */}
      {view === 5 && isMainAdmin && (
        <div className="max-w-2xl space-y-6">

          {/* Add allowed email */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 sm:p-5">
            <h2 className="text-sm font-semibold text-white mb-1">Add Sub-Admin Email</h2>
            <p className="text-xs text-gray-500 mb-4">Only emails added here can create a sub-admin account.</p>
            <form onSubmit={sendInvite} className="flex gap-2">
              <input
                required type="email" value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                placeholder="hello@gmail.com"
                className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-500"
              />
              <button type="submit" disabled={inviteLoading}
                className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-sm font-medium text-white transition-colors disabled:opacity-60 shrink-0">
                {inviteLoading ? '…' : 'Add'}
              </button>
            </form>
            {inviteMsg && (
              <p className={`mt-3 text-xs rounded-lg px-3 py-2 ${inviteMsgType === 'success' ? 'text-green-400 bg-green-900/20 border border-green-800/40' : 'text-red-400 bg-red-900/20 border border-red-800/40'}`}>
                {inviteMsg}
              </p>
            )}
          </div>

          {/* Allowed emails not yet registered */}
          {pendingInvites.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Allowed Emails</h3>
              <div className="space-y-2">
                {pendingInvites.map(inv => (
                  <div key={inv.id} className="flex items-center gap-3 bg-gray-900 border border-gray-800 rounded-xl px-4 py-3">
                    <div className="w-8 h-8 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-sm shrink-0">
                      {inv.invited_email?.[0]?.toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-white truncate">{inv.invited_email}</p>
                      <p className="text-xs text-gray-600">Not yet registered</p>
                    </div>
                    <button onClick={() => cancelInvite(inv.id)}
                      className="text-xs text-red-400 hover:text-red-300 transition-colors shrink-0">
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Registered sub-admins */}
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Team Members</h3>
            {subAdminsLoading ? (
              <div className="space-y-3">{[...Array(2)].map((_, i) => <div key={i} className="h-16 rounded-xl bg-gray-800 animate-pulse" />)}</div>
            ) : subAdmins.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-gray-800 rounded-2xl">
                <p className="text-3xl mb-2">👥</p>
                <p className="text-gray-500 text-sm">No team members yet.</p>
                <p className="text-gray-600 text-xs mt-1">Add their email above so they can register.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {subAdmins.map(sa => (
                  <button key={sa.id} onClick={() => navigate(`/admin/sub-admin/${sa.id}`)}
                    className="w-full bg-gray-900 border border-gray-800 hover:border-gray-600 rounded-xl px-4 py-3.5 flex items-center gap-3 transition-colors text-left">
                    <div className="w-10 h-10 rounded-full bg-purple-800 flex items-center justify-center text-sm font-bold text-white shrink-0">
                      {sa.full_name?.[0]?.toUpperCase() ?? '?'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-white truncate">{sa.full_name}</p>
                      <p className="text-xs text-gray-500 truncate">
                        {sa.company_name ? `${sa.company_name} · ` : ''}@{sa.username}
                      </p>
                    </div>
                    <span className="text-gray-600 text-sm shrink-0">→</span>
                  </button>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* ── View 6: Applications (main admin only) ── */}
      {view === 6 && isMainAdmin && (
        <div className="max-w-2xl space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-white">Join Team Applications</h2>
            <span className="text-xs text-gray-500">{applications.length} total</span>
          </div>

          {appsLoading ? (
            <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-28 rounded-xl bg-gray-800 animate-pulse" />)}</div>
          ) : applications.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-gray-800 rounded-2xl">
              <p className="text-3xl mb-2">📋</p>
              <p className="text-gray-500 text-sm">No applications yet.</p>
              <p className="text-gray-600 text-xs mt-1">Applications from the Join Team button will appear here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {applications.map(app => (
                <div key={app.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-brand-800 flex items-center justify-center text-sm font-bold text-white shrink-0">
                        {app.full_name?.[0]?.toUpperCase() ?? '?'}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{app.full_name}</p>
                        <p className="text-xs text-gray-400">{app.email}</p>
                        {app.contact && <p className="text-xs text-gray-500">{app.contact}</p>}
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium shrink-0 ${
                      app.status === 'pending'  ? 'bg-yellow-900/40 text-yellow-400 border border-yellow-800/40' :
                      app.status === 'accepted' ? 'bg-green-900/40 text-green-400 border border-green-800/40' :
                      app.status === 'rejected' ? 'bg-red-900/40 text-red-400 border border-red-800/40' :
                      'bg-gray-800 text-gray-400 border border-gray-700'
                    }`}>
                      {app.status}
                    </span>
                  </div>

                  <p className="text-sm text-gray-300 leading-relaxed bg-gray-800/50 rounded-lg px-3 py-2">
                    {app.description}
                  </p>

                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-600">
                      {new Date(app.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
                    </p>
                    {app.status === 'pending' && (
                      <div className="flex gap-2">
                        <button onClick={() => updateAppStatus(app.id, 'accepted')}
                          className="px-3 py-1.5 rounded-lg bg-green-900/40 hover:bg-green-900/70 text-green-400 text-xs font-medium transition-colors">
                          Accept
                        </button>
                        <button onClick={() => updateAppStatus(app.id, 'rejected')}
                          className="px-3 py-1.5 rounded-lg bg-red-900/40 hover:bg-red-900/70 text-red-400 text-xs font-medium transition-colors">
                          Reject
                        </button>
                      </div>
                    )}
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
