export default function RSVPModal({ event, onConfirm, onClose, loading }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-white mb-1">Confirm RSVP</h2>
        <p className="text-gray-400 text-sm mb-5">
          You're reserving a spot at <span className="text-white font-medium">{event.title}</span>.
        </p>

        <div className="space-y-2 text-sm text-gray-300 mb-6">
          <div className="flex items-center gap-2">
            <span className="text-gray-500">📅</span>
            {new Date(event.date).toLocaleString('en-US', {
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
              hour: 'numeric', minute: '2-digit',
            })}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-500">📍</span> {event.venue}
          </div>
        </div>

        <p className="text-xs text-gray-500 mb-5">
          After confirming, you'll get access to the event's private chat room.
        </p>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl border border-gray-700 text-sm text-gray-300 hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-sm font-semibold text-white transition-colors disabled:opacity-60"
          >
            {loading ? 'Confirming…' : 'Confirm RSVP'}
          </button>
        </div>
      </div>
    </div>
  );
}
