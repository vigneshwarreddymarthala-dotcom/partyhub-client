import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function ImageUpload({ currentUrl, onUpload }) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(currentUrl || null);

  // Sync preview when parent re-fetches the event (e.g. after save)
  useEffect(() => {
    setPreview(currentUrl || null);
  }, [currentUrl]);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type and size (max 5MB)
    if (!file.type.startsWith('image/')) return;
    if (file.size > 5 * 1024 * 1024) { alert('Image must be under 5MB'); return; }

    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `events/${Date.now()}.${ext}`;

    const { data, error } = await supabase.storage
      .from('event-images')
      .upload(path, file, { upsert: true });

    if (error) { alert('Upload failed: ' + error.message); setUploading(false); return; }

    const { data: { publicUrl } } = supabase.storage.from('event-images').getPublicUrl(data.path);
    setPreview(publicUrl);
    onUpload(publicUrl);
    setUploading(false);
  }

  return (
    <div>
      <label className="block text-xs text-gray-400 mb-1">Event Photo</label>

      {/* Preview */}
      {preview && (
        <div className="relative mb-2 rounded-xl overflow-hidden h-36 bg-gray-800">
          <img src={preview} alt="Event" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={() => { setPreview(null); onUpload(''); }}
            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 text-white text-xs flex items-center justify-center hover:bg-black/80 transition-colors"
          >
            ✕
          </button>
        </div>
      )}

      {/* Upload button */}
      <label className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border-2 border-dashed cursor-pointer transition-colors
        ${uploading ? 'border-gray-700 text-gray-600' : 'border-gray-700 hover:border-brand-600 text-gray-400 hover:text-brand-400'}`}>
        <input type="file" accept="image/*" className="hidden" onChange={handleFile} disabled={uploading} />
        {uploading ? (
          <><span className="animate-spin">⏳</span> Uploading…</>
        ) : (
          <><span>📷</span> {preview ? 'Change photo' : 'Upload photo'}</>
        )}
      </label>
      <p className="text-xs text-gray-600 mt-1">JPG, PNG, WebP · max 5MB</p>
    </div>
  );
}
