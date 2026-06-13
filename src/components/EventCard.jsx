import { Link } from 'react-router-dom';

export default function EventCard({ event, rsvpCount }) {
  const date = new Date(event.date);
  const isFull = rsvpCount >= event.capacity;
  const isEnded = event.status === 'ended' || event.status === 'cancelled';

  return (
    <Link to={`/event/${event.id}`} className="group block">
      <div className="rounded-2xl overflow-hidden bg-gray-900 border border-gray-800 hover:border-brand-600 transition-all duration-200 hover:shadow-lg hover:shadow-brand-900/30">
        {/* Image */}
        <div className="h-40 bg-gradient-to-br from-brand-800 to-purple-900 relative overflow-hidden">
          {event.image_url ? (
            <img
              src={event.image_url}
              alt={event.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-5xl opacity-40">
              🎉
            </div>
          )}
          {/* Status badge */}
          {isEnded && (
            <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-800/90 text-gray-400">
              Ended
            </span>
          )}
          {isFull && !isEnded && (
            <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-xs font-medium bg-red-900/90 text-red-300">
              Full
            </span>
          )}
        </div>

        {/* Info */}
        <div className="p-4">
          <h3 className="font-semibold text-white text-base leading-tight mb-1 group-hover:text-brand-300 transition-colors line-clamp-1">
            {event.title}
          </h3>
          <p className="text-xs text-gray-400 mb-3 line-clamp-2">{event.description}</p>

          <div className="flex items-center justify-between text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <span>📍</span> {event.venue}
            </span>
            <span>
              {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              {' · '}
              {date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
            </span>
          </div>

          {/* Capacity bar */}
          <div className="mt-3">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>{rsvpCount} going</span>
              <span>{event.capacity} spots</span>
            </div>
            <div className="h-1 rounded-full bg-gray-800 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${isFull ? 'bg-red-500' : 'bg-brand-500'}`}
                style={{ width: `${Math.min(100, (rsvpCount / event.capacity) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
