import { useState } from 'react';
import { Upload, CheckCircle2, AlertCircle, Film, Loader2, ExternalLink, Link } from 'lucide-react';

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/upload-landing-video`;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

type Mode = 'gdrive' | 'direct';

function extractGDriveFileId(input: string): string {
  const match = input.match(/\/d\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : input;
}

export default function AdminVideoUpload() {
  const [mode, setMode] = useState<Mode>('gdrive');
  const [fileId, setFileId] = useState('');
  const [directUrl, setDirectUrl] = useState('');
  const [filename, setFilename] = useState('zh-hero.mp4');
  const [status, setStatus] = useState<'idle' | 'running' | 'done' | 'error'>('idle');
  const [publicUrl, setPublicUrl] = useState('');
  const [sizeBytes, setSizeBytes] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');

  const isReady = mode === 'gdrive' ? !!fileId.trim() : !!directUrl.trim();

  async function handleTrigger() {
    if (!isReady) return;
    setStatus('running');
    setErrorMsg('');
    setPublicUrl('');

    const body: Record<string, string> = { filename };
    if (mode === 'gdrive') body.fileId = fileId.trim();
    else body.directUrl = directUrl.trim();

    try {
      const res = await fetch(FUNCTION_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || `Server error ${res.status}`);
      }

      setPublicUrl(json.url);
      setSizeBytes(json.sizeBytes ?? 0);
      setStatus('done');
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
              <p className="text-gray-400 text-sm">Server-side upload — no browser size limit</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Mode tabs */}
          <div className="flex rounded-xl border border-gray-200 overflow-hidden text-sm font-semibold">
            <button
              onClick={() => setMode('gdrive')}
              className={`flex-1 py-2.5 transition-colors ${mode === 'gdrive' ? 'bg-navy-900 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              Google Drive
            </button>
            <button
              onClick={() => setMode('direct')}
              className={`flex-1 py-2.5 transition-colors ${mode === 'direct' ? 'bg-navy-900 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              Direct URL
            </button>
          </div>

          {mode === 'gdrive' && (
            <>
              <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-xs text-amber-800 leading-relaxed">
                <strong>Note:</strong> For files over ~100 MB, Google Drive may block server-side downloads due to its virus scan warning. If this fails, use the <strong>Direct URL</strong> tab instead — generate a direct link from Drive's share menu or use a service like Dropbox.
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Google Drive share link or file ID
                </label>
                <input
                  type="text"
                  value={fileId}
                  onChange={e => setFileId(extractGDriveFileId(e.target.value))}
                  disabled={status === 'running'}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent disabled:opacity-50 font-mono"
                  placeholder="https://drive.google.com/file/d/…  or  1w1CTtuf…"
                />
                {fileId && (
                  <p className="text-xs text-gray-400 mt-1">
                    File ID: <span className="font-mono text-gray-600">{fileId}</span>
                  </p>
                )}
              </div>
            </>
          )}

          {mode === 'direct' && (
            <>
              <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-xs text-blue-700 leading-relaxed">
                <strong>How to get a direct URL from Google Drive:</strong> Open the file in Drive → click the 3-dot menu → <em>Open in new window</em> → replace <code>/view</code> with <code>/uc?export=download&confirm=t</code> in the URL. Or use Dropbox, S3, or any direct-download link.
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                  <Link size={14} /> Direct download URL
                </label>
                <input
                  type="url"
                  value={directUrl}
                  onChange={e => setDirectUrl(e.target.value)}
                  disabled={status === 'running'}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent disabled:opacity-50"
                  placeholder="https://…/video.mp4"
                />
              </div>
            </>
          )}

          {/* Storage filename */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Storage filename
            </label>
            <input
              type="text"
              value={filename}
              onChange={e => setFilename(e.target.value)}
              disabled={status === 'running'}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent disabled:opacity-50"
              placeholder="zh-hero.mp4"
            />
          </div>

          {/* Running */}
          {status === 'running' && (
            <div className="bg-navy-50 border border-navy-100 rounded-xl p-4 flex items-center gap-3">
              <Loader2 size={18} className="text-navy-600 animate-spin flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-navy-800">Uploading on the server…</p>
                <p className="text-xs text-navy-500 mt-0.5">The server is downloading and storing the file. This may take a few minutes for large videos. Do not close this tab.</p>
              </div>
            </div>
          )}

          {/* Success */}
          {status === 'done' && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-emerald-700 font-semibold text-sm">
                <CheckCircle2 size={16} /> Upload complete
                {sizeBytes > 0 && (
                  <span className="font-normal text-emerald-600 ml-1">
                    ({(sizeBytes / 1024 / 1024).toFixed(1)} MB)
                  </span>
                )}
              </div>
              <a
                href={publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-emerald-700 hover:underline break-all font-mono"
              >
                {publicUrl} <ExternalLink size={11} />
              </a>
            </div>
          )}

          {/* Error */}
          {status === 'error' && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-2">
              <AlertCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-red-700 break-all">{errorMsg}</p>
            </div>
          )}

          {/* Button */}
          <button
            onClick={handleTrigger}
            disabled={!isReady || status === 'running'}
            className="w-full flex items-center justify-center gap-2 bg-navy-900 hover:bg-navy-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors text-sm"
          >
            {status === 'running' ? (
              <><Loader2 size={16} className="animate-spin" /> Uploading…</>
            ) : (
              <><Upload size={16} /> {status === 'error' ? 'Retry Upload' : 'Upload Video'}</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
