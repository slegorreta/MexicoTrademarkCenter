import { useState, useRef } from 'react';
import { Upload, CheckCircle2, AlertCircle, Film, Loader2 } from 'lucide-react';
import * as tus from 'tus-js-client';

const BUCKET = 'landing-videos';
const PROJECT_ID = import.meta.env.VITE_SUPABASE_URL?.match(/https:\/\/([^.]+)/)?.[1] ?? '';
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
// Use direct storage hostname for large file performance
const TUS_ENDPOINT = `https://${PROJECT_ID}.storage.supabase.co/storage/v1/upload/resumable`;
const PUBLIC_BASE = `https://${PROJECT_ID}.supabase.co/storage/v1/object/public/${BUCKET}`;

export default function AdminVideoUpload() {
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadRef = useRef<tus.Upload | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [filename, setFilename] = useState('zh-hero.mp4');
  const [progress, setProgress] = useState(0);
  const [uploaded, setUploaded] = useState(0);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'paused' | 'done' | 'error'>('idle');
  const [publicUrl, setPublicUrl] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [dragging, setDragging] = useState(false);

  function pickFile(f: File) {
    setFile(f);
    setStatus('idle');
    setProgress(0);
    setUploaded(0);
    setTotal(0);
    setPublicUrl('');
    setErrorMsg('');
    uploadRef.current = null;
  }

  function formatMB(bytes: number) {
    return (bytes / 1024 / 1024).toFixed(1);
  }

  function startUpload(f: File) {
    const upload = new tus.Upload(f, {
      endpoint: TUS_ENDPOINT,
      retryDelays: [0, 3000, 5000, 10000, 20000],
      headers: {
        authorization: `Bearer ${ANON_KEY}`,
        'x-upsert': 'true',
      },
      uploadDataDuringCreation: true,
      removeFingerprintOnSuccess: true,
      metadata: {
        bucketName: BUCKET,
        objectName: filename,
        contentType: f.type || 'video/mp4',
        cacheControl: '3600',
      },
      chunkSize: 6 * 1024 * 1024, // 6 MB chunks as required by Supabase
      onError(error) {
        console.error('TUS upload error', error);
        setStatus('error');
        setErrorMsg(String(error));
      },
      onProgress(bytesUploaded, bytesTotal) {
        setUploaded(bytesUploaded);
        setTotal(bytesTotal);
        setProgress(Math.round((bytesUploaded / bytesTotal) * 100));
      },
      onSuccess() {
        setPublicUrl(`${PUBLIC_BASE}/${filename}`);
        setStatus('done');
        setProgress(100);
      },
    });

    upload.findPreviousUploads().then((prev) => {
      if (prev.length) upload.resumeFromPreviousUpload(prev[0]);
      upload.start();
    });

    uploadRef.current = upload;
  }

  function handleUpload() {
    if (!file) return;
    setStatus('uploading');
    setErrorMsg('');
    startUpload(file);
  }

  function handlePause() {
    uploadRef.current?.abort();
    setStatus('paused');
  }

  function handleResume() {
    if (!file) return;
    setStatus('uploading');
    uploadRef.current?.start();
  }

  function handleCancel() {
    uploadRef.current?.abort();
    uploadRef.current = null;
    setStatus('idle');
    setProgress(0);
    setUploaded(0);
    setTotal(0);
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
              <p className="text-gray-400 text-sm">Resumable upload — large files fully supported</p>
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
              disabled={status === 'uploading' || status === 'paused'}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent disabled:opacity-50"
              placeholder="zh-hero.mp4"
            />
            <p className="text-xs text-gray-400 mt-1">The file will be publicly accessible at this path in the bucket.</p>
          </div>

          {/* Drop zone */}
          <div
            onClick={() => status === 'idle' && inputRef.current?.click()}
            onDragOver={e => { e.preventDefault(); if (status === 'idle') setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={e => {
              e.preventDefault();
              setDragging(false);
              if (status !== 'idle') return;
              const f = e.dataTransfer.files[0];
              if (f) pickFile(f);
            }}
            className={`border-2 border-dashed rounded-2xl p-10 text-center transition-colors duration-150 ${
              status !== 'idle'
                ? 'border-gray-200 bg-gray-50 cursor-default'
                : dragging
                ? 'border-navy-400 bg-navy-50 cursor-pointer'
                : file
                ? 'border-emerald-300 bg-emerald-50 cursor-pointer'
                : 'border-gray-200 hover:border-gray-300 bg-gray-50 hover:bg-gray-100 cursor-pointer'
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
                <Film size={32} className={status === 'uploading' ? 'text-navy-400' : 'text-emerald-500'} />
                <p className="text-sm font-semibold text-gray-800">{file.name}</p>
                <p className="text-xs text-gray-400">
                  {formatMB(file.size)} MB
                  {status === 'idle' && ' — click to change'}
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload size={32} className="text-gray-300" />
                <p className="text-sm font-semibold text-gray-600">Drop your video here, or click to browse</p>
                <p className="text-xs text-gray-400">MP4, MOV, WebM — any size, resumable</p>
              </div>
            )}
          </div>

          {/* Progress */}
          {(status === 'uploading' || status === 'paused') && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-gray-500">
                <span className="flex items-center gap-1.5">
                  {status === 'uploading'
                    ? <><Loader2 size={12} className="animate-spin" /> Uploading…</>
                    : '⏸ Paused'}
                </span>
                <span>
                  {total > 0 ? `${formatMB(uploaded)} / ${formatMB(total)} MB` : `${progress}%`}
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className={`h-2.5 rounded-full transition-all duration-300 ${status === 'paused' ? 'bg-amber-400' : 'bg-navy-600'}`}
                  style={{ width: `${progress}%` }}
                />
              </div>
              {status === 'uploading' && (
                <p className="text-xs text-gray-400 text-center">
                  Keep this tab open. If interrupted, you can resume from where it left off.
                </p>
              )}
            </div>
          )}

          {/* Success */}
          {status === 'done' && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-emerald-700 font-semibold text-sm">
                <CheckCircle2 size={16} /> Upload complete
              </div>
              <p className="text-xs text-gray-500 break-all font-mono">{publicUrl}</p>
            </div>
          )}

          {/* Error */}
          {status === 'error' && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-2">
              <AlertCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-red-700 break-all">{errorMsg}</p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3">
            {status === 'idle' || status === 'done' || status === 'error' ? (
              <button
                onClick={handleUpload}
                disabled={!file || status === 'uploading'}
                className="flex-1 flex items-center justify-center gap-2 bg-navy-900 hover:bg-navy-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors text-sm"
              >
                <Upload size={16} />
                {status === 'error' ? 'Retry Upload' : 'Upload to Supabase'}
              </button>
            ) : status === 'uploading' ? (
              <>
                <button
                  onClick={handlePause}
                  className="flex-1 flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
                >
                  Pause
                </button>
                <button
                  onClick={handleCancel}
                  className="px-5 py-3 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-semibold transition-colors"
                >
                  Cancel
                </button>
              </>
            ) : status === 'paused' ? (
              <>
                <button
                  onClick={handleResume}
                  className="flex-1 flex items-center justify-center gap-2 bg-navy-900 hover:bg-navy-800 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
                >
                  <Loader2 size={16} /> Resume
                </button>
                <button
                  onClick={handleCancel}
                  className="px-5 py-3 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-semibold transition-colors"
                >
                  Cancel
                </button>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
