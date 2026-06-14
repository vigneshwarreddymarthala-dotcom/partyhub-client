import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

function Lightbox({ images, startIdx, onClose }) {
  const [idx, setIdx] = useState(startIdx);
  const [touchStartX, setTouchStartX] = useState(null);
  const count = images.length;

  function go(dir) { setIdx(i => (i + dir + count) % count); }

  function onTouchStart(e) { setTouchStartX(e.touches[0].clientX); }
  function onTouchEnd(e) {
    if (touchStartX === null) return;
    const dx = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(dx) > 40) go(dx > 0 ? 1 : -1);
    setTouchStartX(null);
  }

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [touchStartX]);

  return createPortal(
    <div
      className="fixed inset-0 z-[999] bg-black/95 flex items-center justify-center"
      onClick={onClose}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white text-xl flex items-center justify-center transition-colors"
      >
        ✕
      </button>

      {/* Counter */}
      {count > 1 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 px-3 py-1 rounded-full bg-white/10 text-white text-sm font-medium">
          {idx + 1} / {count}
        </div>
      )}

      {/* Image */}
      <img
        src={images[idx]}
        alt={`Photo ${idx + 1}`}
        className="max-w-full max-h-full object-contain select-none"
        style={{ maxHeight: '90vh', maxWidth: '95vw' }}
        onClick={e => e.stopPropagation()}
      />

      {/* Left arrow */}
      {count > 1 && (
        <button
          onClick={e => { e.stopPropagation(); go(-1); }}
          className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 text-white text-2xl font-bold flex items-center justify-center transition-colors"
        >
          ‹
        </button>
      )}

      {/* Right arrow */}
      {count > 1 && (
        <button
          onClick={e => { e.stopPropagation(); go(1); }}
          className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 text-white text-2xl font-bold flex items-center justify-center transition-colors"
        >
          ›
        </button>
      )}

      {/* Dot indicators */}
      {count > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex gap-2 items-center">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={e => { e.stopPropagation(); setIdx(i); }}
              className={`rounded-full transition-all duration-300 ${i === idx ? 'w-5 h-2 bg-white' : 'w-2 h-2 bg-white/40 hover:bg-white/70'}`}
            />
          ))}
        </div>
      )}
    </div>,
    document.body
  );
}

export default function EventImageCarousel({ images }) {
  const [idx, setIdx] = useState(0);
  const [touchStartX, setTouchStartX] = useState(null);
  const [lightbox, setLightbox] = useState(false);
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

  function go(dir) { setIdx(i => (i + dir + count) % count); startTimer(); }
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
    <>
      <img
        src={images[0]}
        alt="Event"
        className="w-full h-full object-cover cursor-zoom-in"
        onClick={() => setLightbox(true)}
      />
      {lightbox && <Lightbox images={images} startIdx={0} onClose={() => setLightbox(false)} />}
    </>
  );

  return (
    <>
      <div
        className="relative w-full h-full select-none overflow-hidden cursor-zoom-in"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* Slides */}
        {images.map((src, i) => (
          <div key={i}
            className={`absolute inset-0 transition-opacity duration-700 ${i === idx ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
            onClick={() => setLightbox(true)}
          >
            <img src={src} alt={`Event photo ${i + 1}`} className="w-full h-full object-cover" />
          </div>
        ))}

        {/* Left arrow */}
        <button onClick={e => { e.stopPropagation(); go(-1); }}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm text-white text-lg font-bold flex items-center justify-center hover:bg-black/70 transition-colors">
          ‹
        </button>

        {/* Right arrow */}
        <button onClick={e => { e.stopPropagation(); go(1); }}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm text-white text-lg font-bold flex items-center justify-center hover:bg-black/70 transition-colors">
          ›
        </button>

        {/* Expand hint */}
        <div className="absolute top-2.5 left-2.5 z-20 w-7 h-7 rounded-full bg-black/50 backdrop-blur-sm text-white flex items-center justify-center pointer-events-none">
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
          </svg>
        </div>

        {/* Dot indicators */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-2 items-center">
          {images.map((_, i) => (
            <button key={i} onClick={e => { e.stopPropagation(); goTo(i); }}
              className={`rounded-full transition-all duration-300 ${i === idx ? 'w-5 h-2 bg-white' : 'w-2 h-2 bg-white/50 hover:bg-white/80'}`} />
          ))}
        </div>

        {/* Counter badge */}
        <div className="absolute top-2.5 right-2.5 z-20 px-2 py-0.5 rounded-full bg-black/50 backdrop-blur-sm text-white text-xs font-medium">
          {idx + 1} / {count}
        </div>
      </div>

      {lightbox && <Lightbox images={images} startIdx={idx} onClose={() => setLightbox(false)} />}
    </>
  );
}
