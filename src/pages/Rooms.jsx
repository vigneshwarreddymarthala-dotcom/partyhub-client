import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export default function Rooms() {
  const { session } = useAuth();
  const navigate = useNavigate();

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
    if (!session) { navigate('/login'); return; }
    fetchRooms();
  }, [session]);

  useEffect(() => {
    if (!activeRoom) return;
    fetchMessages(activeRoom.id);
    const channel = supabase
      .channel(`room:${activeRoom.id}`)
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
    const { data } = await supabase
      .from('chat_rooms')
      .select('id, event_id, events(id, title, date, status)')
      .order('created_at', { ascending: false });
    setRooms(data ?? []);
    if (data?.length > 0) setActiveRoom(data[0]);
    setLoading(false);
  }

  async function fetchMessages(roomId) {
    const { data } = await supabase
      .from('messages')
      .select('id, content, created_at, user_id, profiles(full_name)')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true })
      .limit(100);
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

  const isEnded = activeRoom?.events?.status === 'ended';

  // Loading skeleton
  if (loading) return (
    <div className="h-[calc(100vh-56px)] flex items-center justify-center">
      <div className="text-gray-600 text-sm">Loading rooms…</div>
    </div>
  );

  // Empty state
  if (rooms.length === 0) return (
    <div className="h-[calc(100vh-56px)] flex flex-col items-center justify-center px-6 text-center">
      <p className="text-5xl mb-4">💬</p>
      <p className="font-semibold text-gray-300 text-lg">No rooms yet</p>
      <p className="text-gray-500 text-sm mt-1 max-w-xs">RSVP to an event to unlock its private chat room.</p>
    </div>
  );

  return (
    /* Full-height container — no page padding, fills viewport below navbar */
    <div className="flex h-[calc(100vh-56px)] overflow-hidden">

      {/* ─── LEFT: Rooms list ─────────────────────────────────── */}
      <div className={`
        flex flex-col bg-gray-900 border-r border-gray-800
        w-full sm:w-72 lg:w-80 shrink-0
        ${screen === 'chat' ? 'hidden sm:flex' : 'flex'}
      `}>
        {/* Header */}
        <div className="px-4 py-4 border-b border-gray-800">
          <h1 className="text-lg font-bold text-white">Chats</h1>
          <p className="text-xs text-gray-500 mt-0.5">{rooms.length} room{rooms.length !== 1 ? 's' : ''}</p>
        </div>

        {/* Room list */}
        <div className="flex-1 overflow-y-auto">
          {rooms.map((room) => {
            const ev = room.events;
            const isActive = activeRoom?.id === room.id;
            return (
              <button
                key={room.id}
                onClick={() => openRoom(room)}
                className={`w-full flex items-center gap-3 px-4 py-3 border-b border-gray-800/60 text-left transition-colors active:bg-gray-800 ${isActive ? 'bg-gray-800' : 'hover:bg-gray-800/50'}`}
              >
                {/* Avatar circle */}
                <div className={`w-11 h-11 rounded-full shrink-0 flex items-center justify-center text-lg font-bold ${isActive ? 'bg-brand-600' : 'bg-gray-700'}`}>
                  🎉
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-white truncate">{ev?.title ?? 'Event'}</p>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">
                    {ev?.status === 'ended'
                      ? '🔴 Ended'
                      : `📅 ${new Date(ev?.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                  </p>
                </div>
                {isActive && <div className="w-2 h-2 rounded-full bg-brand-400 shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── RIGHT: Chat area ─────────────────────────────────── */}
      <div className={`
        flex-1 flex flex-col min-w-0
        ${screen === 'list' ? 'hidden sm:flex' : 'flex'}
      `}
        style={{ background: 'radial-gradient(ellipse at top, #1a0a2e 0%, #0a0a0f 100%)' }}
      >
        {activeRoom ? (
          <>
            {/* Chat header */}
            <div className="flex items-center gap-3 px-4 py-3 bg-gray-900/80 backdrop-blur border-b border-gray-800 shrink-0">
              {/* Mobile back button */}
              <button
                onClick={() => setScreen('list')}
                className="sm:hidden p-1.5 -ml-1 text-gray-400 hover:text-white transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <div className="w-9 h-9 rounded-full bg-brand-700 flex items-center justify-center text-base shrink-0">
                🎉
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{activeRoom.events?.title}</p>
                <p className="text-xs text-gray-500">
                  {isEnded ? 'Event ended — read only' : 'Tap to chat'}
                </p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-4 space-y-1 scrollbar-hide">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center px-6 pb-10">
                  <p className="text-3xl mb-2">👋</p>
                  <p className="text-gray-500 text-sm">No messages yet. Say hi!</p>
                </div>
              )}

              {messages.map((msg, i) => {
                const isMe = msg.user_id === session.user.id;
                const prevMsg = messages[i - 1];
                const sameUser = prevMsg?.user_id === msg.user_id;
                const time = new Date(msg.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} ${sameUser ? 'mt-0.5' : 'mt-3'}`}>
                    <div className={`max-w-[78%] sm:max-w-[65%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                      {/* Sender name (first message in group) */}
                      {!isMe && !sameUser && (
                        <span className="text-xs text-brand-400 font-medium px-1 mb-0.5">
                          {msg.profiles?.full_name ?? 'User'}
                        </span>
                      )}
                      {/* Bubble */}
                      <div className={`relative px-3 py-2 rounded-2xl text-sm leading-relaxed break-words shadow-sm ${
                        isMe
                          ? 'bg-brand-600 text-white rounded-tr-sm'
                          : 'bg-gray-800 text-gray-100 rounded-tl-sm'
                      }`}>
                        {msg.content}
                        <span className={`text-[10px] ml-2 float-right mt-1 ${isMe ? 'text-brand-200' : 'text-gray-500'}`}>
                          {time}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} className="h-2" />
            </div>

            {/* Input bar */}
            {isEnded ? (
              <div className="px-4 py-3 bg-gray-900/80 border-t border-gray-800 text-center text-xs text-gray-600 shrink-0">
                This event has ended. Chat is read-only.
              </div>
            ) : (
              <form
                onSubmit={sendMessage}
                className="flex items-end gap-2 px-3 py-3 bg-gray-900/80 border-t border-gray-800 shrink-0"
              >
                <input
                  ref={inputRef}
                  value={newMsg}
                  onChange={(e) => setNewMsg(e.target.value)}
                  placeholder="Message…"
                  maxLength={1000}
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-2xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-600 min-w-0"
                />
                <button
                  type="submit"
                  disabled={sending || !newMsg.trim()}
                  className="w-10 h-10 rounded-full bg-brand-600 hover:bg-brand-500 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors shrink-0"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.269 20.876L5.999 12zm0 0h7.5" />
                  </svg>
                </button>
              </form>
            )}
          </>
        ) : (
          // Desktop empty state when no room selected
          <div className="flex-1 flex items-center justify-center text-center px-8">
            <div>
              <p className="text-5xl mb-4">💬</p>
              <p className="text-gray-400 font-medium">Select a room to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
