import type { TerminalClientMessage, TerminalServerMessage } from '@unraidpwa/shared';

export interface TerminalConnection {
  sendInput: (data: string) => void;
  resize: (cols: number, rows: number) => void;
  close: () => void;
}

interface ConnectOptions {
  token: string;
  cols: number;
  rows: number;
  onOutput: (data: string) => void;
  onStatus: (status: 'connecting' | 'connected') => void;
  onError: (message: string) => void;
  onExit: (code: number | null) => void;
  onClose: () => void;
}

/**
 * Opens the terminal WebSocket and bridges it to xterm via callbacks.
 * The JWT is passed as a query param because browsers can't set headers
 * on WebSocket connections.
 */
export function connectTerminal(opts: ConnectOptions): TerminalConnection {
  const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
  const params = new URLSearchParams({
    token: opts.token,
    cols: String(opts.cols),
    rows: String(opts.rows),
  });
  const ws = new WebSocket(`${proto}://${window.location.host}/ws/terminal?${params}`);

  const send = (msg: TerminalClientMessage) => {
    if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg));
  };

  ws.onmessage = (event) => {
    let msg: TerminalServerMessage;
    try {
      msg = JSON.parse(event.data as string) as TerminalServerMessage;
    } catch {
      return;
    }
    switch (msg.type) {
      case 'output':
        opts.onOutput(msg.data);
        break;
      case 'status':
        opts.onStatus(msg.status);
        break;
      case 'error':
        opts.onError(msg.message);
        break;
      case 'exit':
        opts.onExit(msg.code);
        break;
    }
  };

  ws.onclose = () => opts.onClose();
  ws.onerror = () => opts.onError('Connection error');

  return {
    sendInput: (data) => send({ type: 'input', data }),
    resize: (cols, rows) => send({ type: 'resize', cols, rows }),
    close: () => ws.close(),
  };
}
