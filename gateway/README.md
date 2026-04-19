# Gateway Setup Guide (All Hosts)

This guide explains how to run and troubleshoot the Nginx gateway so any host machine (Windows/macOS/Linux) can set up quickly.

## 1. What Gateway Does

Gateway is the single entry point for web/mobile clients.

- HTTPS entry: `https://<HOST_OR_LAN_IP>:8000`
- HTTP compatibility entry: `http://<HOST_OR_LAN_IP>:8088` (dev-friendly path for mobile/Expo)
- Routes:
  - `/` -> web-app
  - `/api/core/*` -> core-service
  - `/api/chat/*` -> chat-service
  - `/socket.io/*` -> chat-service Socket.IO

Main config file: `gateway/nginx.conf`

## 2. Prerequisites

- Docker Desktop + Docker Compose
- A valid `.env` in repository root
- Optional (recommended for HTTPS on LAN): `mkcert`

## 3. Environment Variables Checklist

In root `.env`, verify:

- `GATEWAY_PORT=8000`
- `GATEWAY_COMPAT_HTTP_PORT=8088`
- `WEB_PORT=3000`
- `CORE_PORT=8080`
- `CHAT_PORT=3001`

For mobile app (Expo), also verify in root `.env`:

- `EXPO_PUBLIC_API_URL=http://<YOUR_LAN_IP>:8088`
- `EXPO_PUBLIC_CHAT_SERVICE_URL=http://<YOUR_LAN_IP>:3001` (or via gateway strategy if your mobile chat client is configured that way)
- `EXPO_PUBLIC_ENABLE_WEBRTC=false` for Expo Go

## 4. Certificates (HTTPS)

Gateway expects these files:

- `gateway/certs/dev.crt`
- `gateway/certs/dev.key`

If files are missing, generate certificates.

### Windows (PowerShell)

```powershell
winget install FiloSottile.mkcert
mkcert -install
mkcert -cert-file gateway/certs/dev.crt -key-file gateway/certs/dev.key localhost 127.0.0.1 ::1 <YOUR_LAN_IP>
```

### macOS (zsh/bash)

```bash
brew install mkcert nss
mkcert -install
mkcert -cert-file gateway/certs/dev.crt -key-file gateway/certs/dev.key localhost 127.0.0.1 ::1 <YOUR_LAN_IP>
```

### Linux (Ubuntu example)

```bash
sudo apt update
sudo apt install libnss3-tools
curl -JLO "https://dl.filippo.io/mkcert/latest?for=linux/amd64"
chmod +x mkcert-v*-linux-amd64
sudo mv mkcert-v*-linux-amd64 /usr/local/bin/mkcert
mkcert -install
mkcert -cert-file gateway/certs/dev.crt -key-file gateway/certs/dev.key localhost 127.0.0.1 ::1 <YOUR_LAN_IP>
```

## 5. Start Services

From repository root:

```bash
docker compose up -d --build
```

If you only changed gateway config/certs:

```bash
docker compose restart gateway
```

## 6. Validate Gateway Quickly

### Check container status

```bash
docker compose ps
```

Expected: `gateway`, `web-app`, `core-service`, `chat-service`, DB containers are Up.

### Check Nginx config inside container

```bash
docker compose exec gateway nginx -t
```

### Check endpoints

```bash
curl -k -I https://localhost:8000
curl -I http://localhost:8088
curl -i http://localhost:8088/api/chat/me
```

Notes:

- `401` for `/api/chat/me` without token is normal.
- `502` means upstream service is not reachable/healthy.

## 7. Host-to-Host (LAN) Setup

To allow other machines to access your host:

1. Use your host LAN IP in URLs and mobile env vars.
2. Open firewall for ports `8000` and `8088`.
3. If using HTTPS, trust mkcert root CA on client machine.

Get mkcert CA root path:

```bash
mkcert -CAROOT
```

Import `rootCA.pem` into trusted root certificate store on the client machine.

## 8. Common Issues and Fixes

### A. 502 Bad Gateway on `/api/chat/*`

Symptoms:

- Browser/network shows `502`
- Gateway logs contain `connect() failed ... while connecting to upstream`

Checks:

```bash
docker compose logs --tail=200 chat-service
docker compose logs --tail=200 gateway
```

Fixes:

- Ensure MongoDB is healthy before chat-service starts.
- Restart chat-service after DB is healthy:

```bash
docker compose restart chat-service
```

### B. `Cannot GET /api/api/me` or `/api/api/conversations`

Cause: client base URL duplicates `/api` segment.

Fix: verify mobile/web chat API client base URL is not constructing `.../api/chat/api/...` unless the route layer explicitly requires it.

### C. HTTPS certificate warning on another laptop

Cause: client machine does not trust your local CA.

Fix: import `rootCA.pem` from `mkcert -CAROOT` into trusted root store on that laptop.

### D. Mobile device cannot call host API

Checks:

- Phone and host are on same LAN.
- `EXPO_PUBLIC_API_URL` points to host LAN IP and port `8088`.
- Host firewall allows inbound on `8088`.

## 9. Recommended Team Workflow

When host IP changes:

1. Update root `.env` values using new LAN IP.
2. Re-generate cert with new IP SAN.
3. Restart gateway and mobile Expo process.
4. Validate with curl before testing on app UI.

## 10. Related Files

- `gateway/nginx.conf`
- `gateway/certs/README.md`
- `docker-compose.yml`
- `.env`
