import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export default function AdminSubAdminDetail() {
  const { userId } = useParams();
  const { session, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [subAdmin, setSubAdmin] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!session || profile?.role !== 'admin') { navigate('/admin/login'); return; }
    fetchData();
  }, [authLoading, profile]);

  async function fetchData() {
    setLoading(true);
    const [{ data: sa }, { data: evs }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
      supabase.from('events').select('*, rsvps(id), chat_rooms(id)').eq('created_by', userId).order('date', { ascending: false }),
    ]);
    if (!sa || sa.parent_admin_id !== session.user.id) { navigate('/admin/dashboard'); return; }
    setSubAdmin(sa);
    setEvents(evs ?? []);
    setLoading(false);
  }

  if (authLoading || loading) return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-4">
      <div className="h-8 w-40 bg-gray-800 rounded animate-pulse" />
      <div className="h-28 bg-gray-800 rounded-2xl animate-pulse" />
      <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-gray-800 rounded-xl animate-pulse" />)}</div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
      <button onClick={() => navigate('/admin/dashboard')}
        className="text-sm text-gray-500 hover:text-white transition-colors mb-5 flex items-center gap-1">
        ← Back to Admin
      </button>

      {/* Sub-admin profile card */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mb-6 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-brand-700 flex items-center justify-center text-xl font-bold text-white shrink-0">
          {subAdmin.full_name?.[0]?.toUpperCase() ?? '?'}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-lg font-bold text-white">{subAdmin.full_name}</p>
            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-900/50 text-purple-300 border border-purple-800/50">Sub-Admin</span>
          </div>
          {subAdmin.company_name && <p className="text-sm text-brand-400 mt-0.5">{subAdmin.company_name}</p>}
          <p className="text-xs text-gray-500 mt-0.5">@{subAdmin.username}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-2xl font-bold text-white">{events.length}</p>
          <p className="text-xs text-gray-500">events</p>
        </div>
      </div>

      {/* Their events */}
      <h2 className="text-base font-semibold text-white mb-3">
        Events by {subAdmin.full_name}
      </h2>

      {events.length === 0 ? (
        <div className="text-center py-12 text-gray-500 text-sm">
          <p className="text-3xl mb-2">📭</p>
          No events created yet.
        </div>
      ) : (
        <div className="space-y-3">
          {events.map(ev => {
            const rsvpCount = ev.rsvps?.length ?? 0;
            const roomId = ev.chat_rooms?.[0]?.id;
            return (
              <div key={ev.id} className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-white text-sm truncate">{ev.title}</p>
                  <div className="flex flex-wrap items-center gap-x-2 mt-0.5">
                    <span className="text-xs text-gray-500">
                      {new Date(ev.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    <span className="text-gray-700">·</span>
                    <span className="text-xs text-gray-500 truncate max-w-[160px]">{ev.venue}</span>
                    <span className="text-gray-700">·</span>
                    <span className={`text-xs font-medium ${ev.status === 'active' ? 'text-green-400' : 'text-gray-500'}`}>{ev.status}</span>
                    <span className="text-gray-700">·</span>
                    <span className="text-xs text-brand-400 font-medium">👥 {rsvpCount} / {ev.capacity}</span>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  {roomId && (
                    <button onClick={() => navigate(`/admin/rooms?room=${roomId}`)}
                      className="w-9 h-9 rounded-lg bg-brand-900/50 hover:bg-brand-800/60 text-brand-400 flex items-center justify-center transition-colors"
                      title="Open chat room">
                      💬
                    </button>
                  )}
                  <Link to={`/admin/event/${ev.id}`}
                    className="px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-xs text-gray-300 transition-colors">
                    Manage
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
