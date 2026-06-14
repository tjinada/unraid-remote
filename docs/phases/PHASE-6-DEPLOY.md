# Phase 6 — Running on unraid (Docker)

A single container serves the frontend (static) and backend (API + terminal
WebSocket) on port 3000. Because the app reaches the host over SSH/SFTP, the
container needs **no host path mounts** — only network access to the unraid
box's SSH and a small volume for its JSON state.

## Prerequisites

- SSH enabled on unraid (Settings → Management Access → Use SSH = Yes).
- The repo reachable by the box (public GitHub, a token, or built elsewhere).

## Build & run on the box (via SSH)

```bash
# 1. Get the source onto the array (not /root — that's RAM on unraid)
mkdir -p /mnt/user/appdata/unraidpwa && cd /mnt/user/appdata/unraidpwa
wget -O src.tgz https://github.com/tjinada/unraid-remote/archive/refs/heads/main.tar.gz
tar xzf src.tgz && cd unraid-remote-main

# 2. Build the image
docker build -t unraidpwa:latest .

# 3. Run it
docker run -d --name unraidpwa --restart unless-stopped \
  -p 3000:3000 \
  -e APP_USER=admin \
  -e APP_PASS='choose-a-strong-password' \
  -e JWT_SECRET="$(openssl rand -hex 32)" \
  -e SSH_HOST=<unraid-LAN-IP> \
  -e SSH_PORT=22 \
  -e SSH_USER=root \
  -e SSH_PASS='your-root-password' \
  -e ALLOWED_ROOTS=/mnt/user,/boot \
  -e DATA_DIR=/data \
  -v /mnt/user/appdata/unraidpwa/data:/data \
  unraidpwa:latest
```

Then open `http://<unraid-LAN-IP>:3000`.

## Notes

- `SSH_HOST` is the unraid box's own LAN IP — the container connects back to
  the host's sshd. (Alternatively use `--network host` with
  `SSH_HOST=127.0.0.1` and drop `-p`.)
- `ALLOWED_ROOTS` are **host** paths (read via SFTP), not container paths.
- A key is cleaner than a password: mount it read-only and set
  `SSH_KEY=/run/secrets/id` instead of `SSH_PASS`.
- The container appears in the Docker tab; set it to autostart there. You can
  also recreate it as a UI template (Repository `unraidpwa:latest`, port 3000,
  the env vars above, and the `/data` path mapping) for nicer management.

## Updating

```bash
cd /mnt/user/appdata/unraidpwa && rm -rf unraid-remote-main \
  && wget -O src.tgz https://github.com/tjinada/unraid-remote/archive/refs/heads/main.tar.gz \
  && tar xzf src.tgz && cd unraid-remote-main \
  && docker build -t unraidpwa:latest . \
  && docker rm -f unraidpwa && <re-run the docker run command>
```
