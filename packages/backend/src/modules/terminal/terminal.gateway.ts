import type { Server } from 'node:http';
import { WebSocketServer, WebSocket } from 'ws';
import type { TerminalClientMessage, TerminalServerMessage } from '@unraidpwa/shared';
import { verifyAccessToken } from '../../middleware/index.js';
import { createShellSession } from '../ssh/index.js';
import { logger } from '../../utils/logger.js';

const PATH = '/ws/terminal';

function send(ws: WebSocket, msg: TerminalServerMessage): void {
  if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg));
}

function clampSize(value: string | null, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 && n < 1000 ? Math.floor(n) : fallback;
}

/** Attach the terminal WebSocket gateway to the HTTP server's upgrade event. */
export function attachTerminalGateway(server: Server): void {
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (req, socket, head) => {
    const url = new URL(req.url ?? '', 'http://localhost');
    if (url.pathname !== PATH) {
      socket.destroy();
      return;
    }

    // Browsers can't set Authorization on WebSockets, so the JWT is passed as
    // a query param. Validated here before the connection is accepted.
    try {
      verifyAccessToken(url.searchParams.get('token') ?? '');
    } catch {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }

    const cols = clampSize(url.searchParams.get('cols'), 80);
    const rows = clampSize(url.searchParams.get('rows'), 24);

    wss.handleUpgrade(req, socket, head, (ws) => handleConnection(ws, { cols, rows }));
  });

  logger.info(`Terminal gateway listening on ${PATH}`, 'Terminal');
}

async function handleConnection(ws: WebSocket, size: { cols: number; rows: number }): Promise<void> {
  send(ws, { type: 'status', status: 'connecting' });

  let session;
  try {
    session = await createShellSession(size);
  } catch (err) {
    send(ws, { type: 'error', message: (err as Error).message || 'SSH connection failed' });
    ws.close();
    return;
  }

  const { client, stream } = session;
  send(ws, { type: 'status', status: 'connected' });

  stream.on('data', (chunk: Buffer) => send(ws, { type: 'output', data: chunk.toString('utf8') }));
  stream.stderr.on('data', (chunk: Buffer) => send(ws, { type: 'output', data: chunk.toString('utf8') }));

  stream.on('close', (code: number | null) => {
    send(ws, { type: 'exit', code: code ?? null });
    ws.close();
    client.end();
  });

  ws.on('message', (raw) => {
    let msg: TerminalClientMessage;
    try {
      msg = JSON.parse(raw.toString()) as TerminalClientMessage;
    } catch {
      return;
    }
    if (msg.type === 'input') {
      stream.write(msg.data);
    } else if (msg.type === 'resize') {
      stream.setWindow(msg.rows, msg.cols, 0, 0);
    }
  });

  ws.on('close', () => {
    stream.end();
    client.end();
  });
}
