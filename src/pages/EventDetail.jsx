import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import RSVPModal from '../components/RSVPModal';
import CancelModal from '../components/CancelModal';

export default function EventDetail() {
  const { eventId } = useParams();
  const { session, profile } = useAuth();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [rsvpCount, setRsvpCount] = useState(0);
  const [myRsvp, setMyRsvp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { fetchEvent(); }, [eventId, session]);

  async function fetchEvent() {
    setLoading(true);
    const { data: evt } = await supabase.from('events').select('*').eq('id', eventId).maybeSingle();
    if (!evt) { navigate('/'); return; }
    setEvent(evt);
    const { count } = await supabase.from('rsvps').select('*', { count: 'exact', head: true }).eq('event_id', eventId);
    setRsvpCount(count ?? 0);
    if (session) {
      const { data: rsvp } = await supabase.from('rsvps').select('*').eq('event_id', eventId).eq('user_id', session.user.id).maybeSingle();
      setMyRsvp(rsvp);
    }
    setLoading(false);
  }

  function handleRSVPClick() {
    if (!session) { navigate('/login'); return; }
    if (!profile) { navigate('/profile'); return; }
    setModal('rsvp');
  }

  async function confirmRSVP() {
    setActionLoading(true); setError('');
    const { error } = await supabase.from('rsvps').insert({ event_id: eventId, user_id: session.user.id });
    if (error) { setError(error.message); setActionLoading(false); return; }
    setModal(null); await fetchEvent(); setActionLoading(false);
  }

  async function confirmCancel() {
    setActionLoading(true); setError('');
    const { error } = await supabase.from('rsvps').delete().eq('id', myRsvp.id);
    if (error) { setError(error.message); setActionLoading(false); return; }
    setModal(null); setMyRsvp(null); await fetchEvent(); setActionLoading(false);
  }

  if (loading) return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
      <div className="h-48 sm:h-64 rounded-2xl bg-gray-800 animate-pulse" />
      <div className="h-8 w-2/3 rounded-lg bg-gray-800 animate-pulse" />
      <div className="h-4 w-full rounded bg-gray-800 animate-pulse" />
    </div>
  );

  const isFull = rsvpCount >= event.capacity;
  const isEnded = event.status !== 'active';
  const date = new Date(event.date);
  const mapsHref = event.maps_url
    ? /^https?:\/\//i.test(event.maps_url) ? event.maps_url : `https://${event.maps_url}`
    : null;

  return (
    <>
      <div className="max-w-2xl mx-auto px-4 py-6 sm:py-10">
        {/* Back button */}
        <button onClick={() => navigate('/')} className="flex items-center gap-1 text-sm text-gray-500 hover:text-white transition-colors mb-4">
          ← Back
        </button>

        {/* Hero */}
        <div className="h-48 sm:h-64 rounded-2xl overflow-hidden bg-gradient-to-br from-brand-800 to-purple-900 mb-5 relative">
          {event.image_url && <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />}
          {isEnded && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="px-4 py-2 rounded-full bg-gray-800 text-gray-300 font-medium text-sm">Event Ended</span>
            </div>
          )}
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-3 leading-tight">{event.title}</h1>

        {/* Meta info */}
        <div className="space-y-2 text-sm text-gray-400 mb-4">
          <div className="flex items-start gap-2">
            <span className="shrink-0">📅</span>
            <span>
              {date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              {' at '}
              {date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="shrink-0">📍</span>
            {mapsHref ? (
              <a href={mapsHref} target="_blank" rel="noopener noreferrer"
                className="text-brand-400 hover:text-brand-300 hover:underline transition-colors">
                {event.venue} ↗
              </a>
            ) : (
              <span>{event.venue}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span>👥</span>
            <span>{rsvpCount} / {event.capacity} going</span>
          </div>
        </div>

        {event.description && (
          <p className="text-gray-300 leading-relaxed mb-5 text-sm sm:text-base">{event.description}</p>
        )}

        {/* Capacity bar */}
        <div className="mb-5">
          <div className="h-2 rounded-full bg-gray-800 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${isFull ? 'bg-red-500' : 'bg-brand-500'}`}
              style={{ width: `${Math.min(100, (rsvpCount / event.capacity) * 100)}%` }}
            />
          </div>
        </div>

        {error && <p className="text-red-400 text-sm bg-red-900/20 border border-red-800/40 rounded-lg px-3 py-2 mb-4">{error}</p>}

        {/* Maps button */}
        {mapsHref && (
          <a href={mapsHref} target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-gray-700 hover:border-brand-600 text-sm text-gray-300 hover:text-white transition-colors mb-4">
            🗺️ Open in Maps
          </a>
        )}

        {/* Action buttons — full width on mobile */}
        <div className="flex flex-col sm:flex-row gap-3">
          {isEnded ? (
            <span className="w-full text-center px-5 py-3 rounded-xl bg-gray-800 text-gray-500 text-sm font-medium">
              Event has ended
            </span>
          ) : myRsvp ? (
            <>
              <Link to="/rooms" className="flex-1 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-sm font-semibold text-white text-center transition-colors">
                Open Chat Room
              </Link>
              <button onClick={() => setModal('cancel')} className="flex-1 py-3 rounded-xl border border-red-800 text-red-400 hover:bg-red-900/20 text-sm font-medium transition-colors">
                Cancel RSVP
              </button>
            </>
          ) : (
            <button
              onClick={handleRSVPClick}
              disabled={isFull}
              className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:bg-gray-700 disabled:text-gray-500 text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed"
            >
              {isFull ? 'Event is Full' : 'RSVP Now'}
            </button>
          )}
        </div>
      </div>

      {modal === 'rsvp' && <RSVPModal event={event} onConfirm={confirmRSVP} onClose={() => setModal(null)} loading={actionLoading} />}
      {modal === 'cancel' && <CancelModal event={event} onConfirm={confirmCancel} onClose={() => setModal(null)} loading={actionLoading} />}
    </>
  );
}
