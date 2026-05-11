import { useState, useRef } from 'react';
import { Upload, CheckCircle2, AlertCircle, Film, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const BUCKET = 'landing-videos';

export default function AdminVideoUpload() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [filename, setFilename] = useState('zh-hero.mp4');
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle');
  const [publicUrl, setPublicUrl] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [dragging, setDragging] = useState(false);

  function pickFile(f: File) {
    setFile(f);
    setStatus('idle');
    setProgress(0);
    setPublicUrl('');
    setErrorMsg('');
  }

  async function upload() {
    if (!file) return;
    setStatus('uploading');
    setProgress(0);
    setErrorMsg('');

    try {
      // Upload in chunks to track progress manually via XHR
      const arrayBuffer = await file.arrayBuffer();
      const total = arrayBuffer.byteLength;

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        const url = `${supabaseUrl}/storage/v1/object/${BUCKET}/${filename}`;

        xhr.open('POST', url);
        xhr.setRequestHeader('Authorization', `Bearer ${anonKey}`);
        xhr.setRequestHeader('Content-Type', 'video/mp4');
        xhr.setRequestHeader('x-upsert', 'true');

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
        };

        xhr.onload = () => {
          if (xhr.status === 200 || xhr.status === 201) {
            resolve();
          } else {
            reject(new Error(`Upload failed: ${xhr.status} ${xhr.responseText}`));
          }
        };
        xhr.onerror = () => reject(new Error('Network error during upload'));
        xhr.send(arrayBuffer);
      });

      const { data } = supabase.storage.from(BUCKET).getPublicUrl(filename);
      setPublicUrl(data.publicUrl);
      setStatus('done');
      setProgress(100);
    } catch (err) {
      setStatus('error');
      setErrorMsg(String(err));
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="bg-navy-900 px-6 py-5">
          <div className="flex items-center gap-3">
            <Film size={20} className="text-gold-400" />
            <div>
              <h1 className="text-white font-bold text-lg leading-tight">Landing Video Upload</h1>
              <p className="text-gray-400 text-sm">Upload a video to the Supabase storage bucket</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Filename */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Storage filename
            </label>
            <input
              type="text"
              value={filename}
              onChange={e => setFilename(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent"
              placeholder="zh-hero.mp4"
            />
            <p className="text-xs text-gray-400 mt-1">This becomes the public URL path in the bucket.</p>
          </div>

          {/* Drop zone */}
          <div
            onClick={() => inputRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={e => {
              e.preventDefault();
              setDragging(false);
              const f = e.dataTransfer.files[0];
              if (f) pickFile(f);
            }}
            className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-colors duration-150 ${
              dragging
                ? 'border-navy-400 bg-navy-50'
                : file
                ? 'border-emerald-300 bg-emerald-50'
                : 'border-gray-200 hover:border-gray-300 bg-gray-50 hover:bg-gray-100'
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) pickFile(f); }}
            />
            {file ? (
              <div className="flex flex-col items-center gap-2">
                <Film size={32} className="text-emerald-500" />
                <p className="text-sm font-semibold text-gray-800">{file.name}</p>
                <p className="text-xs text-gray-400">{(file.size / 1024 / 1024).toFixed(1)} MB — click to change</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload size={32} className="text-gray-300" />
                <p className="text-sm font-semibold text-gray-600">Drop your video here, or click to browse</p>
                <p className="text-xs text-gray-400">MP4, MOV, WebM — any size</p>
              </div>
            )}
          </div>

          {/* Progress bar */}
          {status === 'uploading' && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-gray-500">
                <span className="flex items-center gap-1.5">
                  <Loader2 size={12} className="animate-spin" /> Uploading…
                </span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                <div
                  className="h-2 bg-navy-600 rounded-full transition-all duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Success */}
          {status === 'done' && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-emerald-700 font-semibold text-sm">
                <CheckCircle2 size={16} /> Upload complete
              </div>
              <p className="text-xs text-gray-500 break-all">{publicUrl}</p>
            </div>
          )}

          {/* Error */}
          {status === 'error' && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-2">
              <AlertCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-red-700 break-all">{errorMsg}</p>
            </div>
          )}

          {/* Upload button */}
          <button
            onClick={upload}
            disabled={!file || status === 'uploading'}
            className="w-full flex items-center justify-center gap-2 bg-navy-900 hover:bg-navy-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors text-sm"
          >
            {status === 'uploading' ? (
              <><Loader2 size={16} className="animate-spin" /> Uploading…</>
            ) : (
              <><Upload size={16} /> Upload to Supabase</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
