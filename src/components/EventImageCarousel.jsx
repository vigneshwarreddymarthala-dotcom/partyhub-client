import { useState, useEffect, useRef } from 'react';

export default function EventImageCarousel({ images }) {
  const [idx, setIdx] = useState(0);
  const [touchStartX, setTouchStartX] = useState(null);
  const timerRef = useRef(null);
  const count = images.length;

  function startTimer() {
    clearInterval(timerRef.current);
    if (count > 1) {
      timerRef.current = setInterval(() => setIdx(i => (i + 1) % count), 10000);
    }
  }

  useEffect(() => {
    startTimer();
    return () => clearInterval(timerRef.current);
  }, [count]);

  function go(dir) {
    setIdx(i => (i + dir + count) % count);
    startTimer();
  }

  function goTo(i) { setIdx(i); startTimer(); }

  function onTouchStart(e) { setTouchStartX(e.touches[0].clientX); }
  function onTouchEnd(e) {
    if (touchStartX === null) return;
    const dx = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(dx) > 40) go(dx > 0 ? 1 : -1);
    setTouchStartX(null);
  }

  if (count === 0) return null;

  if (count === 1) return (
    <img src={images[0]} alt="Event" className="w-full h-full object-cover" />
  );

  return (
    <div className="relative w-full h-full select-none overflow-hidden"
      onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>

      {/* Slides */}
      {images.map((src, i) => (
        <div key={i}
          className={`absolute inset-0 transition-opacity duration-700 ${i === idx ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
          <img src={src} alt={`Event photo ${i + 1}`} className="w-full h-full object-cover" />
        </div>
      ))}

      {/* Left arrow */}
      <button onClick={() => go(-1)}
        className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm text-white text-lg font-bold flex items-center justify-center hover:bg-black/70 transition-colors">
        ‹
      </button>

      {/* Right arrow */}
      <button onClick={() => go(1)}
        className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm text-white text-lg font-bold flex items-center justify-center hover:bg-black/70 transition-colors">
        ›
      </button>

      {/* Dot indicators */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-2 items-center">
        {images.map((_, i) => (
          <button key={i} onClick={() => goTo(i)}
            className={`rounded-full transition-all duration-300 ${i === idx ? 'w-5 h-2 bg-white' : 'w-2 h-2 bg-white/50 hover:bg-white/80'}`} />
        ))}
      </div>

      {/* Counter badge */}
      <div className="absolute top-2.5 right-2.5 z-20 px-2 py-0.5 rounded-full bg-black/50 backdrop-blur-sm text-white text-xs font-medium">
        {idx + 1} / {count}
      </div>
    </div>
  );
}
