export default function CancelModal({ event, onConfirm, onClose, loading }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-white mb-1">Cancel RSVP?</h2>
        <p className="text-gray-400 text-sm mb-5">
          Are you sure you want to cancel your spot at{' '}
          <span className="text-white font-medium">{event.title}</span>?
        </p>

        <p className="text-xs text-yellow-500/80 bg-yellow-500/10 rounded-lg p-3 mb-5">
          You'll lose access to the event's chat room and your spot may be taken by someone else.
        </p>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl border border-gray-700 text-sm text-gray-300 hover:bg-gray-800 transition-colors"
          >
            Keep RSVP
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-red-700 hover:bg-red-600 text-sm font-semibold text-white transition-colors disabled:opacity-60"
          >
            {loading ? 'Cancelling…' : 'Yes, Cancel'}
          </button>
        </div>
      </div>
    </div>
  );
}
