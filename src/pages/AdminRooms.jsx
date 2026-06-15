import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export default function AdminRooms() {
  const { session, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselect = searchParams.get('room');   // ?room=<roomId>
  const preselectEvent = searchParams.get('event'); // ?event=<eventId> from Events tab

  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [screen, setScreen] = useState('list'); // mobile: 'list' | 'chat'
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (authLoading) return;
    const role = profile?.role;
    if (!session || (role !== 'admin' && role !== 'sub_admin')) { navigate('/admin/login'); return; }
    fetchRooms();
  }, [authLoading, profile]);

  useEffect(() => {
    if (!activeRoom) return;
    fetchMessages(activeRoom.id);

    const channel = supabase
      .channel(`admin_room:${activeRoom.id}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `room_id=eq.${activeRoom.id}` },
        (payload) => {
          setMessages(prev => [...prev, payload.new]);
          setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
        }
      ).subscribe();
    return () => supabase.removeChannel(channel);
  }, [activeRoom]);

  async function fetchRooms() {
    setLoading(true);
    let roomList = []; // must be let — may be extended when auto-creating a room

    if (profile?.role === 'sub_admin') {
      // Sub-admin: only rooms belonging to their events
      const { data: myEvents } = await supabase.from('events').select('id').eq('created_by', session.user.id);
      const ids = (myEvents ?? []).map(e => e.id);
      if (ids.length > 0) {
        const { data } = await supabase
          .from('chat_rooms')
          .select('id, event_id, events(id, title, date, status)')
          .in('event_id', ids)
          .order('created_at', { ascending: false });
        roomList = data ?? [];
      }
    } else {
      const { data } = await supabase
        .from('chat_rooms')
        .select('id, event_id, events(id, title, date, status)')
        .order('created_at', { ascending: false });
      roomList = data ?? [];
    }
    setRooms(roomList);

    // Auto-select room: by room id, or by event id, or fallback to first
    if (preselect) {
      const target = roomList.find(r => r.id === preselect);
      if (target) { setActiveRoom(target); setScreen('chat'); }
      else if (roomList.length > 0) { setActiveRoom(roomList[0]); setScreen('chat'); }
    } else if (preselectEvent) {
      const target = roomList.find(r => r.event_id === preselectEvent);
      if (target) { setActiveRoom(target); setScreen('chat'); }
      else {
        // Room doesn't exist yet — create it then select it
        const { data } = await supabase
          .from('chat_rooms')
          .insert({ event_id: preselectEvent })
          .select('id, event_id, events(id, title, date, status)')
          .single();
        if (data) { roomList = [...roomList, data]; setRooms(roomList); setActiveRoom(data); setScreen('chat'); }
      }
    } else if (roomList.length > 0) {
      setActiveRoom(roomList[0]);
    }
    setLoading(false);
  }

  async function fetchMessages(roomId) {
    const { data } = await supabase
      .from('messages')
      .select('id, content, created_at, user_id, profiles(full_name)')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true })
      .limit(200);
    setMessages(data ?? []);
    setTimeout(() => bottomRef.current?.scrollIntoView(), 80);
  }

  function openRoom(room) {
    setActiveRoom(room);
    setScreen('chat');
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  async function sendMessage(e) {
    e.preventDefault();
    if (!newMsg.trim() || !activeRoom) return;
    setSending(true);
    await supabase.from('messages').insert({
      room_id: activeRoom.id,
      user_id: session.user.id,
      content: newMsg.trim(),
    });
    setNewMsg('');
    setSending(false);
    inputRef.current?.focus();
  }

  if (authLoading || loading) return (
    <div className="h-[100dvh] flex items-center justify-center bg-gray-950">
      <p className="text-gray-600 text-sm">Loading rooms…</p>
    </div>
  );

  return (
    <div className="flex h-[100dvh] bg-gray-950 overflow-hidden">

      {/* ─── LEFT: Rooms sidebar ──────────────────────────────── */}
      <div className={`
        flex flex-col bg-gray-900 border-r border-gray-800
        w-full sm:w-72 lg:w-80 shrink-0
        ${screen === 'chat' ? 'hidden sm:flex' : 'flex'}
      `}>
        {/* Header */}
        <div className="px-4 py-4 border-b border-gray-800 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <button onClick={() => navigate('/admin/dashboard')} className="text-gray-500 hover:text-white transition-colors text-sm">←</button>
              <h1 className="text-base font-bold text-white">All Rooms</h1>
            </div>
            <p className="text-xs text-gray-600 mt-0.5">{rooms.length} event{rooms.length !== 1 ? 's' : ''}</p>
          </div>
          <span className="text-xs px-2 py-1 rounded-full bg-brand-900/60 text-brand-400 border border-brand-800/50">Admin</span>
        </div>

        {/* Empty */}
        {rooms.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
            <p className="text-3xl mb-2">💬</p>
            <p className="text-gray-500 text-sm">No rooms yet.</p>
            <p className="text-gray-600 text-xs mt-1">Create an event to generate a room.</p>
            <button onClick={() => navigate('/admin/dashboard')}
              className="mt-4 text-xs text-brand-400 hover:underline">Create an event →</button>
          </div>
        )}

        {/* Room list */}
        <div className="flex-1 overflow-y-auto">
          {rooms.map((room) => {
            const ev = room.events;
            const isActive = activeRoom?.id === room.id;
            const isExpired = ev && new Date(ev.date) < new Date();
            const isEnded = ev?.status !== 'active';
            return (
              <button key={room.id} onClick={() => openRoom(room)}
                className={`w-full flex items-center gap-3 px-4 py-3 border-b border-gray-800/40 text-left transition-colors ${isActive ? 'bg-gray-800' : 'hover:bg-gray-800/40'}`}>
                <div className={`w-11 h-11 rounded-full shrink-0 flex items-center justify-center text-sm font-bold ${isActive ? 'bg-brand-600 text-white' : 'bg-gray-800 text-gray-400'}`}>
                  {ev?.title?.[0]?.toUpperCase() ?? '?'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white truncate">{ev?.title ?? 'Unnamed Event'}</p>
                  <p className="text-xs mt-0.5 truncate">
                    {isExpired
                      ? <span className="text-orange-400">⏰ Expired</span>
                      : isEnded
                        ? <span className="text-gray-600">Ended</span>
                        : <span className="text-green-500">● Live</span>}
                    <span className="text-gray-600 ml-2">
                      {new Date(ev?.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </p>
                </div>
                {isActive && <div className="w-1.5 h-1.5 rounded-full bg-brand-400 shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── RIGHT: Chat ──────────────────────────────────────── */}
      <div className={`flex-1 flex flex-col min-w-0 overflow-x-hidden ${screen === 'list' ? 'hidden sm:flex' : 'flex'}`}
        style={{ background: 'radial-gradient(ellipse at top, #1a0a2e 0%, #070710 100%)' }}>

        {!activeRoom ? (
          <div className="flex-1 flex items-center justify-center text-center px-8">
            <div>
              <p className="text-5xl mb-3">💬</p>
              <p className="text-gray-500 font-medium">Select a room to open the chat</p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="flex items-center gap-3 px-4 py-3 bg-gray-900/90 backdrop-blur border-b border-gray-800 shrink-0">
              {/* Mobile back */}
              <button onClick={() => setScreen('list')} className="sm:hidden p-1.5 -ml-1 text-gray-400 hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="w-9 h-9 rounded-full bg-brand-700 flex items-center justify-center text-sm font-bold text-white shrink-0">
                {activeRoom.events?.title?.[0]?.toUpperCase() ?? '?'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{activeRoom.events?.title}</p>
                <p className="text-xs text-gray-500">
                  {activeRoom.events && new Date(activeRoom.events.date) < new Date()
                    ? '⏰ Expired'
                    : activeRoom.events?.status === 'active' ? '● Live event' : 'Event ended'} · Admin chat
                </p>
              </div>
              {/* Link to event manage page */}
              <button
                onClick={() => navigate(`/admin/event/${activeRoom.event_id}`)}
                className="shrink-0 text-xs text-gray-500 hover:text-gray-300 border border-gray-700 px-2.5 py-1.5 rounded-lg transition-colors"
              >
                Manage
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-3 sm:px-5 py-4 space-y-1 scrollbar-hide">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center pb-10">
                  <p className="text-3xl mb-2">👋</p>
                  <p className="text-gray-600 text-sm">No messages yet in this room.</p>
                </div>
              )}
              {messages.map((msg, i) => {
                const isMe = msg.user_id === session.user.id;
                const sameUser = messages[i - 1]?.user_id === msg.user_id;
                const time = new Date(msg.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} ${sameUser ? 'mt-0.5' : 'mt-3'}`}>
                    <div className={`max-w-[75%] sm:max-w-[60%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      {!isMe && !sameUser && (
                        <span className="text-xs text-brand-400 font-medium px-1 mb-0.5">
                          {msg.profiles?.full_name ?? 'User'}
                        </span>
                      )}
                      <div className={`px-3 py-2 rounded-2xl text-sm leading-relaxed break-words ${isMe ? 'bg-brand-600 text-white rounded-tr-sm' : 'bg-gray-800 text-gray-100 rounded-tl-sm'}`}>
                        {msg.content}
                        <span className={`text-[10px] ml-2 float-right mt-1 ${isMe ? 'text-brand-200' : 'text-gray-500'}`}>{time}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} className="h-2" />
            </div>

            {/* Input — admin can always type */}
            <form onSubmit={sendMessage} className="flex items-end gap-2 px-3 bg-gray-900/90 border-t border-gray-800 shrink-0 w-full min-w-0 overflow-hidden" style={{ paddingTop: '0.75rem', paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
              <input
                ref={inputRef}
                value={newMsg}
                onChange={e => setNewMsg(e.target.value)}
                placeholder="Message as admin…"
                maxLength={1000}
                className="flex-1 bg-gray-800 border border-gray-700 rounded-2xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-600 min-w-0"
              />
              <button type="submit" disabled={sending || !newMsg.trim()}
                className="w-10 h-10 rounded-full bg-brand-600 hover:bg-brand-500 disabled:opacity-40 flex items-center justify-center transition-colors shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.269 20.876L5.999 12zm0 0h7.5" />
                </svg>
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
