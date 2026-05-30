# Deploy Smart Quiz Generator ke Railway

Konfigurasi terbaru mendukung deploy sebagai **1 service aplikasi** plus **1 service PostgreSQL**.

Domain service aplikasi akan menampilkan frontend React di `/` dan backend API tetap tersedia di `/api`.

## 1. PostgreSQL

Tambahkan database PostgreSQL di Railway:

```text
New -> Database -> Add PostgreSQL
```

Railway akan menyediakan variable `DATABASE_URL`.

## 2. Service Aplikasi

Buat service dari GitHub repo ini.

Pengaturan service yang disarankan:

```text
Root Directory: kosongkan / repo root
Build Command: npm run build
Start Command: npm start
Healthcheck Path: /api/health
```

Repo ini juga menyediakan `nixpacks.toml`, jadi Railway dari root repo akan otomatis:

1. Install dependency backend.
2. Install dependency frontend.
3. Build React.
4. Menyalin hasil build ke `backend/public`.
5. Menjalankan backend Express yang menyajikan frontend di `/` dan API di `/api`.

Jika tetap ingin memakai root directory `backend`, gunakan:

```text
Root Directory: backend
Build Command: npm run build
Start Command: npm start
Healthcheck Path: /api/health
```

Start backend akan otomatis:

1. Menjalankan `prisma migrate deploy`.
2. Menjalankan API Express.

## 3. Variables Backend

Isi variable di service aplikasi:

```env
DATABASE_URL=${{Postgres.DATABASE_URL}}
JWT_SECRET=isi-dengan-random-secret-panjang-minimal-32-karakter
JWT_EXPIRES_IN=7d
CLIENT_URL=https://domain-service-app.up.railway.app
ALLOWED_ORIGINS=https://domain-service-app.up.railway.app
MAX_UPLOAD_MB=10
UPLOAD_DIR=/data/uploads
VITE_API_URL=/api
```

Jika nama database service bukan `Postgres`, sesuaikan referensinya. Contoh:

```env
DATABASE_URL=${{postgresql.DATABASE_URL}}
```

## 4. Volume Upload

Upload file perlu persistent storage. Tambahkan Railway Volume dan mount ke:

```text
/data
```

Lalu gunakan:

```env
UPLOAD_DIR=/data/uploads
```

## 5. Seed Data

Setelah deploy sukses, jalankan sekali dari Railway shell service aplikasi:

```bash
npm run seed
```

## 6. URL Production

Gunakan URL service aplikasi:

```text
https://domain-service-app.up.railway.app
```

Endpoint API:

```text
https://domain-service-app.up.railway.app/api/health
```

## Troubleshooting

Jika root domain menampilkan:

```json
{"message":"Endpoint tidak ditemukan"}
```

Berarti frontend belum ikut ter-build/tersalin. Pastikan:

- Root Directory service adalah `backend`.
- Build Command adalah `npm run build`.
- Log build menampilkan `Frontend build copied to .../backend/public`.
- Variable `VITE_API_URL=/api` sudah ada.

Jika login mengirim request ke `/api/auth/login` tetapi statusnya `404` dan response `Content-Type` adalah `text/html`, berarti Railway sedang menjalankan service frontend/static saja, bukan backend API. Perbaiki service menjadi:

```text
Root Directory: kosongkan / repo root
Build Command: npm run build
Start Command: npm start
```

atau deploy ulang service dengan `Root Directory: backend`.

Jika healthcheck gagal karena Prisma:

- Pastikan PostgreSQL service sudah dibuat.
- Pastikan `DATABASE_URL` mengarah ke `${{Postgres.DATABASE_URL}}`.
