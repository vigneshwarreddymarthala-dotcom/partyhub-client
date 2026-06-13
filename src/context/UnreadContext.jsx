import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

const UnreadContext = createContext({ unreadSet: new Set(), markRead: () => {}, totalUnread: 0 });

const lsKey = (uid) => `ph_lr_${uid}`;

function getLastRead(uid) {
  try { return JSON.parse(localStorage.getItem(lsKey(uid)) ?? '{}'); } catch { return {}; }
}
function saveLastRead(uid, map) {
  localStorage.setItem(lsKey(uid), JSON.stringify(map));
}

export function UnreadProvider({ children }) {
  const { session } = useAuth();
  const [unreadSet, setUnreadSet] = useState(new Set());

  useEffect(() => {
    if (!session) { setUnreadSet(new Set()); return; }
    const uid = session.user.id;

    async function init() {
      const lastRead = getLastRead(uid);
      const { data: rooms } = await supabase.from('chat_rooms').select('id');
      if (!rooms?.length) return;

      const results = await Promise.all(
        rooms.map(async (room) => {
          const { data } = await supabase
            .from('messages')
            .select('created_at, user_id')
            .eq('room_id', room.id)
            .order('created_at', { ascending: false })
            .limit(1);
          if (!data?.length) return null;
          // Skip if the only message is from this user — they "already read" it by sending
          if (data[0].user_id === uid) return null;
          const lr = lastRead[room.id];
          if (!lr || new Date(data[0].created_at) > new Date(lr)) return room.id;
          return null;
        })
      );

      setUnreadSet(new Set(results.filter(Boolean)));
    }

    init();

    const channel = supabase
      .channel(`unread_${uid}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          if (payload.new.user_id === uid) return;
          setUnreadSet(prev => new Set([...prev, payload.new.room_id]));
        }
      ).subscribe();

    return () => supabase.removeChannel(channel);
  }, [session?.user.id]);

  function markRead(roomId) {
    if (!session) return;
    const uid = session.user.id;
    const lr = getLastRead(uid);
    lr[roomId] = new Date().toISOString();
    saveLastRead(uid, lr);
    setUnreadSet(prev => { const n = new Set(prev); n.delete(roomId); return n; });
  }

  return (
    <UnreadContext.Provider value={{ unreadSet, markRead, totalUnread: unreadSet.size }}>
      {children}
    </UnreadContext.Provider>
  );
}

export const useUnread = () => useContext(UnreadContext);
