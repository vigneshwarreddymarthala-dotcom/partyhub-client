import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export default function Rooms() {
  const { session, profile } = useAuth();
  const navigate = useNavigate();

  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!session) { navigate('/login'); return; }
    fetchRooms();
  }, [session]);

  useEffect(() => {
    if (!activeRoom) return;

    fetchMessages(activeRoom.id);

    const channel = supabase
      .channel(`room:${activeRoom.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `room_id=eq.${activeRoom.id}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new]);
          setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [activeRoom]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function fetchRooms() {
    setLoading(true);
    // Get chat rooms for events the user has RSVP'd to
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
      .select('id, content, created_at, user_id, profiles(full_name, username)')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true })
      .limit(100);

    setMessages(data ?? []);
    setTimeout(() => bottomRef.current?.scrollIntoView(), 100);
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
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="h-96 rounded-2xl bg-gray-800 animate-pulse" />
      </div>
    );
  }

  if (rooms.length === 0) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 text-center text-gray-500">
        <p className="text-4xl mb-3">💬</p>
        <p className="font-medium text-gray-300">No chat rooms yet</p>
        <p className="text-sm mt-1">RSVP to an event to unlock its private chat room.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-white mb-5">My Rooms</h1>

      <div className="flex gap-4 h-[70vh] min-h-[400px]">
        {/* Sidebar: room list */}
        <div className="w-56 shrink-0 flex flex-col gap-2 overflow-y-auto scrollbar-hide">
          {rooms.map((room) => {
            const event = room.events;
            const isActive = activeRoom?.id === room.id;
            return (
              <button
                key={room.id}
                onClick={() => setActiveRoom(room)}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-colors ${
                  isActive
                    ? 'bg-brand-700 text-white'
                    : 'bg-gray-900 text-gray-300 hover:bg-gray-800'
                }`}
              >
                <p className="font-medium line-clamp-1">{event?.title ?? 'Event'}</p>
                <p className={`text-xs mt-0.5 ${isActive ? 'text-brand-200' : 'text-gray-500'}`}>
                  {event?.status === 'ended' ? 'Ended' : new Date(event?.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </p>
              </button>
            );
          })}
        </div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-800">
            <p className="font-semibold text-white text-sm">{activeRoom?.events?.title}</p>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
            {messages.map((msg) => {
              const isMe = msg.user_id === session.user.id;
              return (
                <div key={msg.id} className={`flex gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                  <div className={`flex flex-col max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
                    {!isMe && (
                      <span className="text-xs text-gray-500 mb-0.5 px-1">
                        {msg.profiles?.full_name ?? 'User'}
                      </span>
                    )}
                    <div
                      className={`px-3 py-2 rounded-2xl text-sm leading-snug ${
                        isMe
                          ? 'bg-brand-600 text-white rounded-tr-sm'
                          : 'bg-gray-800 text-gray-200 rounded-tl-sm'
                      }`}
                    >
                      {msg.content}
                    </div>
                    <span className="text-xs text-gray-600 mt-0.5 px-1">
                      {new Date(msg.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          {activeRoom?.events?.status === 'ended' ? (
            <div className="px-4 py-3 border-t border-gray-800 text-center text-xs text-gray-600">
              This event has ended. Chat is read-only.
            </div>
          ) : (
            <form onSubmit={sendMessage} className="px-4 py-3 border-t border-gray-800 flex gap-2">
              <input
                value={newMsg}
                onChange={(e) => setNewMsg(e.target.value)}
                placeholder="Type a message…"
                maxLength={1000}
                className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-500"
              />
              <button
                type="submit"
                disabled={sending || !newMsg.trim()}
                className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-sm font-medium text-white transition-colors disabled:opacity-50"
              >
                Send
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
