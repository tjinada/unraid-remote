import type { Shortcut } from '@unraidpwa/shared';

/**
 * Seeded on first run (when no shortcuts file exists yet). Intentionally
 * non-destructive — no reboot/shutdown/format commands by default. Users
 * can add their own, including dangerous ones, deliberately.
 */
export const DEFAULT_SHORTCUTS: Shortcut[] = [
  { id: 'seed-docker-ps', label: 'List containers', command: 'docker ps', category: 'Docker', runImmediately: true },
  { id: 'seed-docker-stats', label: 'Container stats', command: 'docker stats --no-stream', category: 'Docker', runImmediately: true },
  { id: 'seed-disk-usage', label: 'Disk usage', command: 'df -h', category: 'Disks', runImmediately: true },
  { id: 'seed-array-status', label: 'Array status', command: 'mdcmd status', category: 'Disks', runImmediately: true },
  { id: 'seed-mover-status', label: 'Mover status', command: 'mover status', category: 'Mover', runImmediately: true },
  { id: 'seed-uptime', label: 'Uptime', command: 'uptime', category: 'System', runImmediately: true },
  { id: 'seed-mem', label: 'Memory', command: 'free -h', category: 'System', runImmediately: true },
  { id: 'seed-syslog', label: 'Tail syslog', command: 'tail -f /var/log/syslog', category: 'Logs', runImmediately: true },
];
