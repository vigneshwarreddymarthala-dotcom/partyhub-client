import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import ImageUpload from '../components/ImageUpload';

export default function AdminEventDetail() {
  const { eventId } = useParams();
  const { session, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [form, setForm] = useState({
    title: '', description: '', date: '', time: '',
    venue: '', city: '', capacity: '', price: '', status: 'active', image_url: '', maps_url: '', meet_link: '', recurrence: 'none',
    publish_date: '', publish_time: '',
  });
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [saveMsgType, setSaveMsgType] = useState('success'); // 'success' | 'error'
  const [guests, setGuests] = useState([]);
  const [guestsLoading, setGuestsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [kickingId, setKickingId] = useState(null);
  const [mobilePanel, setMobilePanel] = useState('guests');

  useEffect(() => {
    if (authLoading) return;
    const role = profile?.role;
    if (!session || (role !== 'admin' && role !== 'sub_admin')) { navigate('/admin/login'); return; }
    fetchEvent(); fetchGuests(); fetchCities();
  }, [eventId, authLoading, profile]);

  useEffect(() => {
    if (!eventId) return;
    const channel = supabase
      .channel(`admin_rsvps_${eventId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rsvps', filter: `event_id=eq.${eventId}` }, () => fetchGuests())
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [eventId]);

  async function fetchCities() {
    const { data } = await supabase.from('events').select('city');
    const unique = [...new Set((data ?? []).map(e => e.city).filter(Boolean))].sort();
    setCitySuggestions(unique);
  }

  async function fetchEvent() {
    const { data } = await supabase.from('events').select('*').eq('id', eventId).maybeSingle();
    if (!data) { navigate('/admin/dashboard'); return; }
    // Sub-admins can only manage their own events
    if (profile?.role === 'sub_admin' && data.created_by !== session.user.id) { navigate('/admin/dashboard'); return; }
    setEvent(data);
    const date = new Date(data.date);
    setForm({
      title: data.title ?? '',
      description: data.description ?? '',
      date: date.toISOString().split('T')[0],
      time: date.toTimeString().slice(0, 5),
      venue: data.venue ?? '',
      city: data.city ?? '',
      capacity: String(data.capacity ?? ''),
      status: data.status ?? 'active',
      image_url: data.image_url ?? '',
      image_url_2: data.image_url_2 ?? '',
      image_url_3: data.image_url_3 ?? '',
      price: data.price != null ? String(data.price) : '',
      maps_url: data.maps_url ?? '',
      meet_link: data.meet_link ?? '',
      recurrence: data.recurrence ?? 'none',
      publish_date: data.scheduled_at ? new Date(data.scheduled_at).toISOString().split('T')[0] : '',
      publish_time: data.scheduled_at ? new Date(data.scheduled_at).toTimeString().slice(0, 5) : '',
    });
  }

  async function fetchGuests() {
    setGuestsLoading(true);
    const { data } = await supabase
      .from('rsvps')
      .select('id, checked_in, created_at, user_id, profiles(full_name, username)')
      .eq('event_id', eventId)
      .order('created_at', { ascending: true });
    setGuests(data ?? []);
    setGuestsLoading(false);
  }

  async function saveEvent(e) {
    e.preventDefault();
    setSaving(true); setSaveMsg('');

    const datetime = new Date(`${form.date}T${form.time}`).toISOString();
    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      date: datetime,
      venue: form.venue.trim(),
      city: form.city.trim() || null,
      capacity: parseInt(form.capacity),
      status: form.status,
      image_url: form.image_url || null,
      image_url_2: form.image_url_2 || null,
      image_url_3: form.image_url_3 || null,
      recurrence: form.recurrence,
      scheduled_at: form.status === 'scheduled' && form.publish_date && form.publish_time
        ? new Date(`${form.publish_date}T${form.publish_time}`).toISOString()
        : null,
    };
    if (form.maps_url !== undefined) payload.maps_url = form.maps_url.trim() || null;
    if (form.meet_link !== undefined) payload.meet_link = form.meet_link.trim() || null;
    payload.price = form.price !== '' ? parseFloat(form.price) : null;

    const { error } = await supabase.from('events').update(payload).eq('id', eventId);

    if (error) {
      // If maps_url column doesn't exist yet, retry without it
      if (error.message?.includes('maps_url')) {
        const { error: error2 } = await supabase.from('events')
          .update({ ...payload, maps_url: undefined })
          .eq('id', eventId);
        if (error2) {
          setSaveMsgType('error');
          setSaveMsg(error2.message);
          setSaving(false);
          return;
        }
      } else {
        setSaveMsgType('error');
        setSaveMsg(error.message);
        setSaving(false);
        return;
      }
    }

    // Update event title shown in header without re-mounting the form
    setEvent(prev => ({ ...prev, title: form.title.trim() }));
    setSaveMsgType('success');
    setSaveMsg('✓ Changes saved!');
    setSaving(false);
    setTimeout(() => setSaveMsg(''), 3000);
  }

  async function toggleCheckIn(rsvpId, current) {
    await supabase.from('rsvps').update({ checked_in: !current }).eq('id', rsvpId);
    setGuests(prev => prev.map(g => g.id === rsvpId ? { ...g, checked_in: !current } : g));
  }

  async function kickGuest(rsvpId, name) {
    if (!confirm(`Remove ${name} from this event?`)) return;
    setKickingId(rsvpId);
    await supabase.from('rsvps').delete().eq('id', rsvpId);
    setGuests(prev => prev.filter(g => g.id !== rsvpId));
    setKickingId(null);
  }

  const filteredGuests = guests.filter(g =>
    !search ||
    (g.profiles?.full_name ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (g.profiles?.username ?? '').toLowerCase().includes(search.toLowerCase())
  );

  if (authLoading || !event) return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-4">
      <div className="h-8 w-40 rounded bg-gray-800 animate-pulse" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-96 rounded-2xl bg-gray-800 animate-pulse" />
        <div className="h-96 rounded-2xl bg-gray-800 animate-pulse" />
      </div>
    </div>
  );

  // ── Edit form JSX (inlined — NOT a sub-component, to keep ImageUpload mounted) ──
  const editFormJsx = (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 sm:p-5">
      <h2 className="font-semibold text-gray-400 text-xs uppercase tracking-wide mb-4">Edit Event</h2>
      <form onSubmit={saveEvent} className="space-y-3">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Title</label>
          <input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500" />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Description</label>
          <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            rows={2} maxLength={500}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500 resize-none" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Date</label>
            <input required type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Time</label>
            <input required type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500" />
          </div>
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Venue</label>
          <input required value={form.venue} onChange={e => setForm(f => ({ ...f, venue: e.target.value }))}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500" />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">City</label>
          <input list="city-suggestions-edit" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
            placeholder="e.g. Berlin, Munich"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500" />
          <datalist id="city-suggestions-edit">
            {citySuggestions.map(c => <option key={c} value={c} />)}
          </datalist>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Capacity</label>
            <input required type="number" min={1} value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Status</label>
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500">
              <option value="active">Active</option>
              <option value="scheduled">Scheduled</option>
              <option value="ended">Ended</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Ticket Price (€) <span className="text-gray-600">— leave blank for free</span></label>
          <input type="number" min={0} step="0.01" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500"
            placeholder="0.00" />
        </div>
        {form.status === 'scheduled' && (
          <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-yellow-900/10 border border-yellow-800/30">
            <div>
              <label className="block text-xs text-yellow-400 mb-1">🕐 Publish Date</label>
              <input required type="date" value={form.publish_date} onChange={e => setForm(f => ({ ...f, publish_date: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500" />
            </div>
            <div>
              <label className="block text-xs text-yellow-400 mb-1">Publish Time</label>
              <input required type="time" value={form.publish_time} onChange={e => setForm(f => ({ ...f, publish_time: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500" />
            </div>
          </div>
        )}
        <div>
          <label className="block text-xs text-gray-400 mb-1">Google Maps Link <span className="text-gray-600">(optional)</span></label>
          <input type="text" value={form.maps_url} onChange={e => setForm(f => ({ ...f, maps_url: e.target.value }))}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
            placeholder="Paste any map link…" />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">
            <span className="inline-flex items-center gap-1.5">
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor"><path d="M17 10.5V7a1 1 0 00-1-1H4a1 1 0 001 1v10a1 1 0 001 1h12a1 1 0 001-1v-3.5l4 4v-11l-4 4z"/></svg>
              Google Meet Link <span className="text-gray-600">(RSVPed guests only)</span>
            </span>
          </label>
          <input type="url" value={form.meet_link} onChange={e => setForm(f => ({ ...f, meet_link: e.target.value }))}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
            placeholder="https://meet.google.com/xxx-xxxx-xxx" />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Recurrence <span className="text-gray-600">(auto-reposts after event ends)</span></label>
          <select value={form.recurrence} onChange={e => setForm(f => ({ ...f, recurrence: e.target.value }))}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500">
            <option value="none">One-time event</option>
            <option value="hourly_1">Every 1 hour</option>
            <option value="hourly_2">Every 2 hours</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
        <div className="space-y-2">
          <p className="text-xs text-gray-400">Event Photos <span className="text-gray-600">(up to 3)</span></p>
          <ImageUpload label="Photo 1 (Cover)" currentUrl={form.image_url} onUpload={(url) => setForm(f => ({ ...f, image_url: url }))} />
          <ImageUpload label="Photo 2" currentUrl={form.image_url_2} onUpload={(url) => setForm(f => ({ ...f, image_url_2: url }))} />
          <ImageUpload label="Photo 3" currentUrl={form.image_url_3} onUpload={(url) => setForm(f => ({ ...f, image_url_3: url }))} />
        </div>
        {saveMsg && (
          <p className={`text-xs rounded-lg px-3 py-2 ${saveMsgType === 'success' ? 'text-green-400 bg-green-900/20 border border-green-800/40' : 'text-red-400 bg-red-900/20 border border-red-800/40'}`}>
            {saveMsg}
          </p>
        )}
        <button type="submit" disabled={saving}
          className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-sm font-semibold text-white transition-colors disabled:opacity-60">
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </form>
    </div>
  );

  // ── Guest roster JSX (also inlined) ──
  const guestRosterJsx = (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 sm:p-5 flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-gray-400 text-xs uppercase tracking-wide">Live Guest Roster</h2>
        <span className="text-xs text-gray-500">{guests.length} / {event.capacity}</span>
      </div>
      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search guests…"
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-500 mb-3" />
      <div className="flex-1 overflow-y-auto space-y-1.5 scrollbar-hide min-h-0">
        {guestsLoading
          ? [...Array(4)].map((_, i) => <div key={i} className="h-10 rounded-lg bg-gray-800 animate-pulse" />)
          : filteredGuests.length === 0
            ? <p className="text-gray-600 text-sm text-center py-6">No guests found</p>
            : filteredGuests.map((g) => (
              <div key={g.id} className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-gray-800">
                <button onClick={() => toggleCheckIn(g.id, g.checked_in)}
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors text-xs ${g.checked_in ? 'bg-green-500 border-green-500 text-white' : 'border-gray-600 text-transparent hover:border-green-500'}`}>
                  ✓
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{g.profiles?.full_name ?? 'Unknown'}</p>
                  <p className="text-xs text-gray-500">@{g.profiles?.username ?? '—'}</p>
                </div>
                <button onClick={() => kickGuest(g.id, g.profiles?.full_name ?? 'this guest')} disabled={kickingId === g.id}
                  className="px-2 py-1 rounded-md text-xs text-red-400 hover:bg-red-900/30 transition-colors disabled:opacity-50 shrink-0">
                  Kick
                </button>
              </div>
            ))}
      </div>
      <div className="mt-3 pt-3 border-t border-gray-800 flex items-center gap-2">
        <div className="flex-1 h-1.5 rounded-full bg-gray-800 overflow-hidden">
          <div className="h-full rounded-full bg-green-500"
            style={{ width: guests.length ? `${(guests.filter(g => g.checked_in).length / guests.length) * 100}%` : '0%' }} />
        </div>
        <span className="text-xs text-gray-500 shrink-0">{guests.filter(g => g.checked_in).length} checked in</span>
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
      <div className="flex items-center justify-between mb-4 gap-3">
        <button onClick={() => navigate('/admin/dashboard')} className="text-sm text-gray-500 hover:text-white flex items-center gap-1 transition-colors">
          ← Back to Admin
        </button>
        <button
          onClick={async () => {
            const { data } = await supabase.from('chat_rooms').select('id').eq('event_id', eventId).maybeSingle();
            if (data) navigate(`/admin/rooms?room=${data.id}`);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-700 hover:bg-brand-600 text-xs font-medium text-white transition-colors"
        >
          💬 Open Chat Room
        </button>
      </div>
      <h1 className="text-lg sm:text-xl font-bold text-white mb-5 truncate">{event.title}</h1>

      {/* Mobile toggle */}
      <div className="flex lg:hidden gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1 mb-4">
        {['guests', 'edit'].map((p) => (
          <button key={p} onClick={() => setMobilePanel(p)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${mobilePanel === p ? 'bg-brand-600 text-white' : 'text-gray-400 hover:text-white'}`}>
            {p === 'guests' ? '👥 Guest Roster' : '✏️ Edit Event'}
          </button>
        ))}
      </div>

      {/* Mobile: single panel */}
      <div className="lg:hidden">
        {mobilePanel === 'guests'
          ? <div className="h-[60vh]">{guestRosterJsx}</div>
          : editFormJsx}
      </div>

      {/* Desktop: split view */}
      <div className="hidden lg:grid lg:grid-cols-2 gap-6">
        {editFormJsx}
        <div className="h-[600px] flex flex-col">{guestRosterJsx}</div>
      </div>
    </div>
  );
}
