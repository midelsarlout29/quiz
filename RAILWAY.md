# Deploy Smart Quiz Generator ke Railway

Deploy sebagai 3 service dalam 1 project Railway:

1. PostgreSQL
2. Backend API
3. Frontend Web

## 1. PostgreSQL

Tambahkan plugin PostgreSQL di Railway. Railway akan menyediakan `DATABASE_URL`.

## 2. Backend API

Buat service baru dari GitHub repo ini, lalu set:

- Root Directory: `backend`
- Build: Nixpacks
- Start Command: `npm start`
- Healthcheck Path: `/api/health`

Environment variables:

```env
DATABASE_URL=${{Postgres.DATABASE_URL}}
JWT_SECRET=isi-dengan-random-secret-panjang
JWT_EXPIRES_IN=7d
CLIENT_URL=https://frontend-domain-railway.up.railway.app
ALLOWED_ORIGINS=https://frontend-domain-railway.up.railway.app
MAX_UPLOAD_MB=10
UPLOAD_DIR=/data/uploads
```

Jika memakai Railway Volume untuk upload, mount volume ke:

```text
/data
```

Backend menjalankan `prisma migrate deploy` otomatis saat start.

Untuk seed data production, jalankan sekali dari Railway shell:

```bash
npm run seed
```

## 3. Frontend Web

Buat service baru dari GitHub repo yang sama, lalu set:

- Root Directory: `frontend`
- Build: Nixpacks
- Build Command: `npm run build`
- Start Command: `npm start`
- Healthcheck Path: `/health`

Environment variables:

```env
VITE_API_URL=https://backend-domain-railway.up.railway.app/api
```

Setelah backend dan frontend punya domain Railway, update:

- Backend `CLIENT_URL`
- Backend `ALLOWED_ORIGINS`
- Frontend `VITE_API_URL`

Redeploy kedua service setelah env final disimpan.

## Catatan Produksi

- Jangan commit `.env`; gunakan Railway Variables.
- Upload file di Railway filesystem biasa bersifat sementara. Gunakan Railway Volume untuk `UPLOAD_DIR=/data/uploads`.
- Jika pakai custom domain, tambahkan domain tersebut ke `ALLOWED_ORIGINS`.
- `JWT_SECRET` wajib diganti dari contoh lokal.
