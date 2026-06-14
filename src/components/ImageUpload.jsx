import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

export default function ImageUpload({ currentUrl, onUpload, label = 'Event Photo' }) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(currentUrl || null);
  const inputRef = useRef(null);

  useEffect(() => {
    setPreview(currentUrl || null);
  }, [currentUrl]);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { alert('Please select an image file.'); return; }

    setUploading(true);
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `events/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

    const { data, error } = await supabase.storage
      .from('event-images')
      .upload(path, file, { upsert: true });

    if (error) { alert('Upload failed: ' + error.message); setUploading(false); return; }

    const { data: { publicUrl } } = supabase.storage.from('event-images').getPublicUrl(data.path);
    setPreview(publicUrl);
    onUpload(publicUrl);
    setUploading(false);
    // Reset input so same file can be re-selected
    if (inputRef.current) inputRef.current.value = '';
  }

  return (
    <div>
      <label className="block text-xs text-gray-400 mb-1">{label}</label>

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
        disabled={uploading}
      />

      {/* Preview */}
      {preview && (
        <div className="relative mb-2 rounded-xl overflow-hidden h-36 bg-gray-800">
          <img src={preview} alt="Event" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={() => { setPreview(null); onUpload(''); }}
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/70 text-white text-xs flex items-center justify-center hover:bg-black/90 transition-colors"
          >
            ✕
          </button>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="absolute bottom-2 right-2 px-2.5 py-1 rounded-lg bg-black/70 text-white text-xs hover:bg-black/90 transition-colors"
          >
            Change
          </button>
        </div>
      )}

      {/* Upload tap area */}
      {!preview && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className={`w-full py-5 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1.5 transition-colors touch-manipulation
            ${uploading
              ? 'border-gray-700 text-gray-600 cursor-not-allowed'
              : 'border-gray-700 active:border-brand-500 hover:border-brand-600 text-gray-400 hover:text-brand-400 active:text-brand-400 cursor-pointer'
            }`}
        >
          {uploading ? (
            <>
              <span className="text-2xl animate-spin">⏳</span>
              <span className="text-sm">Uploading…</span>
            </>
          ) : (
            <>
              <span className="text-2xl">📷</span>
              <span className="text-sm font-medium">Tap to upload photo</span>
              <span className="text-xs text-gray-600">Camera or gallery</span>
            </>
          )}
        </button>
      )}

      {uploading && preview && (
        <p className="text-xs text-brand-400 mt-1 text-center animate-pulse">Uploading…</p>
      )}
    </div>
  );
}
