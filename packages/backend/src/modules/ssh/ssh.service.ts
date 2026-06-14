import { promises as fs } from 'node:fs';
import { Client, type ClientChannel, type ConnectConfig } from 'ssh2';
import { config, isSshConfigured } from '../../config/index.js';
import { AppError } from '../../middleware/index.js';
import { logger } from '../../utils/logger.js';

/**
 * Builds the ssh2 connection config from env. Prefers a private key over a
 * password when both are present. Throws a client-facing error if SSH is not
 * configured.
 *
 * Note (KISS, documented): host-key verification is left at ssh2's default
 * (accept) for now — intended for trusted LAN use. Host-key pinning is a
 * future hardening step.
 */
async function buildConnectConfig(): Promise<ConnectConfig> {
  if (!isSshConfigured()) {
    throw new AppError('SSH is not configured on the server', 503);
  }
  const cfg: ConnectConfig = {
    host: config.sshHost,
    port: config.sshPort,
    username: config.sshUser,
    keepaliveInterval: 15_000,
  };
  if (config.sshKeyPath) {
    cfg.privateKey = await fs.readFile(config.sshKeyPath);
  } else {
    cfg.password = config.sshPass;
  }
  return cfg;
}

/** Open and return a ready SSH client. Shared by the terminal and SFTP. */
export async function connectClient(): Promise<Client> {
  const cfg = await buildConnectConfig();
  return new Promise<Client>((resolve, reject) => {
    const client = new Client();
    client.on('ready', () => resolve(client));
    client.on('error', (err) => {
      logger.error('SSH connection error', 'SSH', err);
      reject(err);
    });
    client.connect(cfg);
  });
}

export interface ShellSession {
  client: Client;
  stream: ClientChannel;
}

/** Open an SSH connection and an interactive shell channel (a PTY). */
export async function createShellSession(size: { cols: number; rows: number }): Promise<ShellSession> {
  const client = await connectClient();
  return new Promise<ShellSession>((resolve, reject) => {
    client.shell({ term: 'xterm-256color', cols: size.cols, rows: size.rows }, (err, stream) => {
      if (err) {
        client.end();
        reject(err);
        return;
      }
      resolve({ client, stream });
    });
  });
}

/** Non-secret summary for the client (never returns credentials). */
export function getSshStatus(): { configured: boolean; target: string | null } {
  return {
    configured: isSshConfigured(),
    target: isSshConfigured() ? `${config.sshUser}@${config.sshHost}:${config.sshPort}` : null,
  };
}
