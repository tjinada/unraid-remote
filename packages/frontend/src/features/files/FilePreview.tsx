import { useEffect, useState } from 'react';
import { X, Download, Loader2 } from 'lucide-react';
import { previewFile, downloadFile } from './useFiles';

interface Props {
  path: string;
  filename: string;
  onClose: () => void;
}

export function FilePreview({ path, filename, onClose }: Props) {
  const [content, setContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    previewFile(path)
      .then((r) => active && setContent(r.content))
      .catch((e) => active && setError(e?.response?.data?.message ?? 'Cannot preview this file'))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [path]);

  return (
    <div className="fixed inset-0 z-30 flex flex-col bg-black/70 p-3">
      <div className="flex min-h-0 flex-1 flex-col rounded-2xl border border-border bg-surface">
        <div className="flex items-center gap-2 border-b border-border px-3 py-2">
          <span className="min-w-0 flex-1 truncate font-mono text-sm">{filename}</span>
          <button type="button" onClick={() => downloadFile(path, filename)} aria-label="Download" className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-300 hover:bg-border">
            <Download className="h-4 w-4" />
          </button>
          <button type="button" onClick={onClose} aria-label="Close" className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-300 hover:bg-border">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-auto p-3">
          {loading && <Loader2 className="mx-auto mt-8 h-6 w-6 animate-spin text-gray-500" />}
          {error && (
            <div className="mt-8 flex flex-col items-center gap-3 text-center">
              <p className="text-sm text-gray-400">{error}</p>
              <button type="button" onClick={() => downloadFile(path, filename)} className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm text-white">
                <Download className="h-4 w-4" /> Download
              </button>
            </div>
          )}
          {content !== null && <pre className="whitespace-pre-wrap break-words font-mono text-xs text-gray-200">{content}</pre>}
        </div>
      </div>
    </div>
  );
}
