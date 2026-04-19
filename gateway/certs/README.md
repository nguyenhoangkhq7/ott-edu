# LAN TLS Certificates (Development)

This folder stores local TLS cert/key for gateway HTTPS in LAN development.

## Generate cert using mkcert (Windows PowerShell)

1. Install mkcert and local CA trust (run as admin once):

```powershell
winget install FiloSottile.mkcert
mkcert -install
```

2. Generate cert for LAN IP and localhost from repository root:

```powershell
mkcert -cert-file gateway/certs/dev.crt -key-file gateway/certs/dev.key 192.168.0.103 localhost 127.0.0.1 ::1
```

3. Restart gateway:

```powershell
docker compose up -d --force-recreate gateway
```

4. Verify:

```powershell
docker exec gateway nginx -t
curl.exe -k -I https://192.168.0.103:8443
curl.exe -I http://192.168.0.103:8000
```

Expected:
- HTTP on 8000 redirects to HTTPS on 8443.
- HTTPS returns gateway/web response.

## Trust on other laptops

Each laptop accessing LAN HTTPS must trust your mkcert root CA.

Quick export path:

```powershell
mkcert -CAROOT
```

Copy rootCA.pem from that directory to other laptop and import into Trusted Root Certification Authorities.

Notes:
- This setup is for local development only.
- Do not commit private keys.
