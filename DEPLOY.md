# Deployment — Personal Progress OS (V1.0)

Model yang didukung V1.0: **satu instance Node.js + SQLite pada filesystem persisten**.
SQLite membutuhkan disk yang sama antarpanggilan, jadi **jangan** deploy ke runtime
serverless stateless (lambda/functions) — data tidak dijamin sama antarinstance.

> Sebelum deploy (wajib): buat **`AUTH_SECRET`** dan **`AUTH_ACCESS_CODE`** baru.
> Jangan pernah meng-commit nilai secret. Lihat bagian "Secret Rotation".

## Opsi A — VM / server langsung (tanpa container)

Prasyarat: Node.js 22.

```bash
cd personal-progress-os
npm ci
npx prisma generate

# Env (atau export manual di systemd/supervisor):
export DATABASE_URL="file:/var/lib/personal-progress-os/app.db"   # lokasi persisten
export AUTH_SECRET="$(openssl rand -hex 24)"
export AUTH_ACCESS_CODE="passphrase-panjang-anda"
export NODE_ENV="production"

npx prisma migrate deploy
npm run build
npm start   # bind 3000
```

Akses publik via reverse proxy + HTTPS, contoh (Caddy, auto-cert):

```bash
caddy reverse-proxy --domain progress.example.com --to localhost:3000
```

## Opsi B — Docker Compose (disarankan)

Prasyarat: Docker dengan Docker Compose.

```bash
git pull                                          # ambil versi terbaru
docker compose up -d --build
```

- Database SQLite tersimpan di volume `ppos-data` → `/app/data/app.db` (persisten di host).
- Migrasi dijalankan otomatis saat container start (`prisma migrate deploy`).
- `AUTH_SECRET`, `AUTH_ACCESS_CODE`, `DATABASE_URL` dibaca dari `.env` host via `env_file`.

Log & status:

```bash
docker compose logs -f web
docker compose ps
```

Backup volume (crontab harian misalnya):

```bash
docker run --rm -v ppos-data:/data -v /srv/backups:/backup alpine \
  tar czf /backup/ppos-$(date +%F).tgz -C /data .
```

Update versi baru:

```bash
git pull && docker compose up -d --build
```

## Rotasi Secret (sebelum rilis pertama)

1. Generate nilai baru:

   ```bash
   openssl rand -hex 24          # AUTH_SECRET
   ```

   dan pilih passphrase kuat untuk `AUTH_ACCESS_CODE` (ini satu-satunya gerbang login).

2. Tulis ke `.env` di host (file ini TIDAK pernah masuk Git):

   ```env
   DATABASE_URL="file:./prisma/dev.db"
   AUTH_SECRET=<hex-baru>
   AUTH_ACCESS_CODE=<passphrase-baru>
   ```

3. Restart:

   ```bash
   docker compose up -d         # atau restart service Node Anda
   ```

4. (Docker) Volume `ppos-data` bukan lagi `/app/data/app.db` bila Anda tetap memakai
   `file:./prisma/dev.db` — pastikan `DATABASE_URL` di compose mengarah ke `/app/data`.

## Smoke Test

- Buka `https://domain-anda` → harus redirect ke halaman login.
- Login dengan `AUTH_ACCESS_CODE` baru.
- Pastikan bisa membuat goal → install stage → task → mulai sesi fokus.
- Cek `/api/auth/me` tetap 200 setelah login dan menolak (401) saat cookie dihapus.

## Ringkasan Latihan Menjaga

- Satu instance saja untuk V1.0 (SQLite).
- Back up volume SQLite secara berkala.
- Jangan taruh secret di file apa pun yang masuk Git/CI.
- Batasi akses port 3000 ke reverse proxy saja (firewall).