import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import '@xterm/xterm/css/xterm.css';
import { Command, Loader2, ServerCog } from 'lucide-react';
import type { ApiResponse, SshStatus } from '@unraidpwa/shared';
import { api } from '@/api/client';
import { useAuthStore } from '@/stores/authStore';
import { connectTerminal, type TerminalConnection } from './terminalSocket';
import { AccessoryBar } from './AccessoryBar';
import { ShortcutsDrawer } from '@/features/shortcuts/ShortcutsDrawer';

export interface TerminalHandle {
  cd: (path: string) => void;
  focus: () => void;
}

type Conn = 'connecting' | 'connected' | 'closed' | 'error';

const STATUS_STYLE: Record<Conn, { dot: string; label: string }> = {
  connecting: { dot: 'bg-yellow-400', label: 'Connecting' },
  connected: { dot: 'bg-green-400', label: 'Connected' },
  closed: { dot: 'bg-gray-500', label: 'Disconnected' },
  error: { dot: 'bg-red-500', label: 'Error' },
};

const cdCommand = (path: string) => `cd '${path.replace(/'/g, "'\\''")}'\r`;

const TerminalScreen = forwardRef<TerminalHandle>(function TerminalScreen(_props, ref) {
  const containerRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<Terminal | null>(null);
  const connRef = useRef<TerminalConnection | null>(null);
  const connectedRef = useRef(false);
  const queuedCd = useRef<string | null>(null);
  const [status, setStatus] = useState<Conn>('connecting');
  const [drawerOpen, setDrawerOpen] = useState(false);

  useImperativeHandle(ref, () => ({
    cd: (path: string) => {
      if (connectedRef.current && connRef.current) connRef.current.sendInput(cdCommand(path));
      else queuedCd.current = path;
    },
    focus: () => termRef.current?.focus(),
  }));

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const term = new Terminal({
      cursorBlink: true,
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
      fontSize: 13,
      theme: { background: '#0d1117', foreground: '#e6edf3', cursor: '#f15a2b' },
    });
    const fit = new FitAddon();
    term.loadAddon(fit);
    term.loadAddon(new WebLinksAddon());
    term.open(container);
    termRef.current = term;
    requestAnimationFrame(() => fit.fit());

    const token = useAuthStore.getState().token ?? '';
    const conn = connectTerminal({
      token,
      cols: term.cols,
      rows: term.rows,
      onOutput: (d) => term.write(d),
      onStatus: (st) => {
        setStatus(st);
        if (st === 'connected') {
          connectedRef.current = true;
          const q = queuedCd.current;
          if (q) {
            queuedCd.current = null;
            conn.sendInput(cdCommand(q));
          }
        }
      },
      onError: (m) => {
        setStatus('error');
        term.write(`\r\n\x1b[31m[${m}]\x1b[0m\r\n`);
      },
      onExit: () => term.write('\r\n\x1b[90m[session ended]\x1b[0m\r\n'),
      onClose: () => {
        connectedRef.current = false;
        setStatus((s) => (s === 'error' ? s : 'closed'));
      },
    });
    connRef.current = conn;

    const onData = term.onData((d) => conn.sendInput(d));
    const observer = new ResizeObserver(() => {
      fit.fit();
      conn.resize(term.cols, term.rows);
    });
    observer.observe(container);

    return () => {
      observer.disconnect();
      onData.dispose();
      conn.close();
      term.dispose();
      termRef.current = null;
      connRef.current = null;
      connectedRef.current = false;
    };
  }, []);

  const s = STATUS_STYLE[status];

  return (
    <div className="relative flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-border bg-surface px-3 py-1.5 text-xs text-gray-400">
        <span className={`h-2 w-2 rounded-full ${s.dot}`} />
        {s.label}
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="ml-auto flex items-center gap-1 rounded-md px-2 py-1 text-gray-300 hover:bg-border"
        >
          <Command className="h-3.5 w-3.5" /> Shortcuts
        </button>
      </div>
      <div ref={containerRef} className="min-h-0 flex-1 bg-base px-1" onClick={() => termRef.current?.focus()} />
      <div className="lg:hidden">
        <AccessoryBar onKey={(seq) => { connRef.current?.sendInput(seq); termRef.current?.focus(); }} />
      </div>
      <ShortcutsDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onUse={(command, run) => {
          connRef.current?.sendInput(run ? `${command}\r` : command);
          termRef.current?.focus();
        }}
      />
    </div>
  );
});

export const TerminalView = forwardRef<TerminalHandle>(function TerminalView(_props, ref) {
  const [ssh, setSsh] = useState<SshStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<ApiResponse<SshStatus>>('/ssh/status')
      .then((res) => setSsh(res.data.data ?? { configured: false, target: null }))
      .catch(() => setSsh({ configured: false, target: null }))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
      </div>
    );
  }

  if (!ssh?.configured) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
        <ServerCog className="h-10 w-10 text-gray-500" />
        <h2 className="font-semibold">SSH not configured</h2>
        <p className="max-w-sm text-sm text-gray-400">
          Set <code className="text-primary-500">SSH_HOST</code>, <code className="text-primary-500">SSH_USER</code>,
          and <code className="text-primary-500">SSH_PASS</code> or <code className="text-primary-500">SSH_KEY</code>{' '}
          in the server environment, then restart.
        </p>
      </div>
    );
  }

  return <TerminalScreen ref={ref} />;
});
