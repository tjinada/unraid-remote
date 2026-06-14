import { useRef, useState, type PointerEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ChevronDown, ChevronUp, Maximize2, Minimize2 } from 'lucide-react';
import { FilePane } from '@/features/files/FilePane';
import { moveEntry, copyEntry } from '@/features/files/useFiles';
import { TerminalView, type TerminalHandle } from '@/features/terminal/TerminalView';
import { useFilesStore } from '@/stores/filesStore';

// Attach window listeners for a pointer drag; cleans up on release.
function beginDrag(onMove: (e: globalThis.PointerEvent) => void): void {
  const move = (e: globalThis.PointerEvent) => onMove(e);
  const up = () => {
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', up);
    document.body.style.userSelect = '';
  };
  document.body.style.userSelect = 'none';
  window.addEventListener('pointermove', move);
  window.addEventListener('pointerup', up);
}

const basename = (path: string) => path.split('/').filter(Boolean).pop() ?? path;

export function WorkspacePage() {
  const qc = useQueryClient();
  const { leftPath, rightPath, setLeftPath, setRightPath } = useFilesStore();

  const wsRef = useRef<HTMLDivElement>(null);
  const explorerRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<TerminalHandle>(null);

  const [leftWidth, setLeftWidth] = useState(50);
  const [dockOpen, setDockOpen] = useState(true);
  const [dockHeight, setDockHeight] = useState(280);
  const [fullscreen, setFullscreen] = useState(false);
  const [pendingDrop, setPendingDrop] = useState<{ from: string; toDir: string } | null>(null);

  const openTerminalHere = (path: string) => {
    setFullscreen(false);
    setDockOpen(true);
    requestAnimationFrame(() => terminalRef.current?.cd(path));
  };

  const onDropEntry = (from: string, toDir: string) => setPendingDrop({ from, toDir });

  const doDrop = async (mode: 'move' | 'copy') => {
    if (!pendingDrop) return;
    const { from, toDir } = pendingDrop;
    setPendingDrop(null);
    try {
      if (mode === 'move') await moveEntry(from, toDir);
      else await copyEntry(from, toDir);
      qc.invalidateQueries({ queryKey: ['files', leftPath] });
      qc.invalidateQueries({ queryKey: ['files', rightPath] });
    } catch (e) {
      window.alert((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Operation failed');
    }
  };

  const startPaneDrag = (e: PointerEvent) => {
    e.preventDefault();
    beginDrag((ev) => {
      const r = explorerRef.current?.getBoundingClientRect();
      if (!r) return;
      setLeftWidth(Math.min(85, Math.max(15, ((ev.clientX - r.left) / r.width) * 100)));
    });
  };

  const startDockDrag = (e: PointerEvent) => {
    if (!dockOpen || fullscreen) return;
    e.preventDefault();
    beginDrag((ev) => {
      const r = wsRef.current?.getBoundingClientRect();
      if (!r) return;
      setDockHeight(Math.min(r.height - 80, Math.max(80, r.bottom - ev.clientY)));
    });
  };

  return (
    <div ref={wsRef} className="flex h-full flex-col">
      {/* Explorer (dual pane on desktop, single on mobile) */}
      <div ref={explorerRef} className={`min-h-0 ${fullscreen ? 'hidden' : 'flex flex-1'}`}>
        <div className="w-full min-w-0 lg:w-[var(--lw)]" style={{ ['--lw' as string]: `${leftWidth}%` } as React.CSSProperties}>
          <FilePane path={leftPath} setPath={setLeftPath} onOpenTerminalHere={openTerminalHere} onDropEntry={onDropEntry} />
        </div>
        <div className="hidden w-1 cursor-col-resize bg-border hover:bg-primary-600 lg:block" onPointerDown={startPaneDrag} />
        <div className="hidden min-w-0 flex-1 lg:block">
          <FilePane path={rightPath} setPath={setRightPath} onOpenTerminalHere={openTerminalHere} onDropEntry={onDropEntry} />
        </div>
      </div>

      {/* Terminal dock */}
      <div className={`flex flex-col border-t border-border ${fullscreen ? 'min-h-0 flex-1' : ''}`} style={fullscreen ? undefined : { height: dockOpen ? dockHeight : undefined }}>
        <div
          onPointerDown={startDockDrag}
          className={`flex items-center gap-2 bg-surface px-3 py-1 text-xs text-gray-400 ${dockOpen && !fullscreen ? 'cursor-row-resize' : ''}`}
        >
          <button type="button" onClick={() => setDockOpen((o) => !o)} aria-label="Toggle terminal" className="flex h-6 w-6 items-center justify-center rounded hover:bg-border">
            {dockOpen || fullscreen ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </button>
          <span>Terminal</span>
          <button type="button" onClick={() => { setFullscreen((f) => !f); setDockOpen(true); }} aria-label="Fullscreen" className="ml-auto flex h-6 w-6 items-center justify-center rounded hover:bg-border">
            {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
        <div className="min-h-0 flex-1" style={{ display: dockOpen || fullscreen ? 'block' : 'none' }}>
          <TerminalView ref={terminalRef} />
        </div>
      </div>

      {/* Move / Copy chooser on drop */}
      {pendingDrop && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-4">
            <p className="mb-4 text-sm text-gray-300">
              <span className="font-mono text-primary-500">{basename(pendingDrop.from)}</span> →{' '}
              <span className="font-mono text-gray-400">{pendingDrop.toDir}</span>
            </p>
            <div className="flex gap-2">
              <button type="button" onClick={() => doDrop('move')} className="flex-1 rounded-lg bg-primary-600 py-2 text-sm font-medium text-white hover:bg-primary-700">Move</button>
              <button type="button" onClick={() => doDrop('copy')} className="flex-1 rounded-lg border border-border py-2 text-sm text-gray-200 hover:border-primary-500">Copy</button>
              <button type="button" onClick={() => setPendingDrop(null)} className="rounded-lg border border-border px-4 py-2 text-sm text-gray-400">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
