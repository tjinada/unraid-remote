import path from 'node:path';

const nodeEnv = process.env.NODE_ENV ?? 'development';

export const config = {
  nodeEnv,
  isDevelopment: nodeEnv === 'development',
  isProduction: nodeEnv === 'production',
  port: Number(process.env.PORT ?? 3000),

  // Single-user auth
  appUser: process.env.APP_USER ?? 'admin',
  appPass: process.env.APP_PASS ?? '',
  jwtSecret: process.env.JWT_SECRET ?? 'dev-insecure-secret-change-me',
  tokenTtl: '12h',
  refreshTtl: '30d',

  // Local JSON state
  dataDir: path.resolve(process.env.DATA_DIR ?? './data'),

  // SSH target (Phase 2)
  sshHost: process.env.SSH_HOST ?? '',
  sshPort: Number(process.env.SSH_PORT ?? 22),
  sshUser: process.env.SSH_USER ?? '',
  sshPass: process.env.SSH_PASS ?? '',
  sshKeyPath: process.env.SSH_KEY ?? '',

  // File explorer (Phase 4) — sandbox for all SFTP operations
  allowedRoots: (process.env.ALLOWED_ROOTS ?? '/mnt/user,/boot')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
} as const;

/** True when enough SSH settings are present to attempt a connection. */
export function isSshConfigured(): boolean {
  return Boolean(config.sshHost && config.sshUser && (config.sshPass || config.sshKeyPath));
}

/** Warn loudly if running with insecure defaults outside development. */
export function assertConfig(): void {
  if (config.isProduction) {
    if (!config.appPass) {
      console.warn('[config] APP_PASS is empty — login will be impossible.');
    }
    if (config.jwtSecret === 'dev-insecure-secret-change-me') {
      console.warn('[config] JWT_SECRET is using the insecure default. Set a real one.');
    }
  }
}
