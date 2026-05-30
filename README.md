# Smart Quiz Generator

Aplikasi web kuis/tryout end-to-end untuk admin, pembuat kuis, dan peserta.

## Stack

- Backend: Node.js Express
- Frontend: React.js + Vite
- Database: PostgreSQL + Prisma ORM
- Auth: JWT, bcrypt password hashing, role-based middleware
- Upload: PDF, DOCX, TXT dengan validasi ukuran dan tipe file

## Cara Menjalankan Lokal

1. Jalankan database:

   ```bash
   docker compose up -d
   ```

2. Install dan siapkan backend:

   ```bash
   cd backend
   cp .env.example .env
   npm install
   npm run migrate
   npm run seed
   npm run dev
   ```

3. Install dan jalankan frontend:

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. Buka:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:4000/api`
- PostgreSQL: `localhost:5433`

## Akun Seed

- Super Admin: `superadmin@smartquiz.test` / `password123`
- Admin: `admin@smartquiz.test` / `password123`
- Pembuat kuis: `guru@smartquiz.test` / `password123`
- Peserta: `peserta@smartquiz.test` / `password123`

## Alur End-to-End

1. Pembuat kuis login.
2. Upload materi PDF/DOCX/TXT.
3. Pilih jumlah soal 50, 75, atau 100 dan tipe soal.
4. Sistem mengekstrak teks dan membuat soal otomatis.
5. Pembuat kuis mengedit soal, durasi, passing grade, lalu publish.
6. Peserta login, mulai tryout, jawaban tersimpan otomatis.
7. Submit manual atau otomatis saat waktu habis.
8. Sistem menghitung nilai dan menampilkan pembahasan lengkap.

## API Documentation

## Deploy Railway

Panduan production Railway ada di [RAILWAY.md](./RAILWAY.md). Aplikasi disiapkan sebagai 1 service aplikasi plus PostgreSQL Railway. Frontend React disajikan oleh backend Express pada domain yang sama, dan API tetap tersedia di `/api`.

Base URL: `http://localhost:4000/api`

Auth header untuk endpoint privat:

```http
Authorization: Bearer <token>
```

### Auth

- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`
- `POST /auth/reset-password`
- `PUT /auth/profile`

### Users

- `GET /users`
- `POST /users`
- `PUT /users/:id`
- `DELETE /users/:id`

### Categories

- `GET /categories`
- `POST /categories`
- `PUT /categories/:id`
- `DELETE /categories/:id`

### Materials

- `GET /materials`
- `POST /materials/upload`
- `GET /materials/:id`
- `POST /materials/:id/generate`

### Quizzes

- `GET /quizzes`
- `POST /quizzes`
- `GET /quizzes/:id`
- `PUT /quizzes/:id`
- `POST /quizzes/:id/publish`
- `DELETE /quizzes/:id`

### Questions

- `GET /questions?quizId=&categoryId=&difficulty=&creatorId=&materialId=`
- `POST /questions`
- `PUT /questions/:id`
- `DELETE /questions/:id`
- `GET /questions/export.csv`

### Tryout

- `POST /quizzes/:id/start`
- `POST /attempts/:id/answer`
- `POST /attempts/:id/submit`
- `GET /attempts/:id/result`
- `GET /attempts/:id/explanations`

### Reports

- `GET /reports/summary`
- `GET /reports/quizzes/:id`
- `GET /reports/export.csv`
- `GET /reports/export.pdf`

## AIQuestionGenerator

Service berada di `backend/src/services/AIQuestionGenerator.js`.

Input:

```json
{
  "materialText": "...",
  "questionCount": 50,
  "difficulty": "sedang",
  "questionType": "multiple_choice",
  "language": "id"
}
```

Output:

```json
[
  {
    "question": "...",
    "options": ["A", "B", "C", "D"],
    "correct_answer": "A",
    "explanation": "...",
    "option_explanations": {
      "A": "...",
      "B": "...",
      "C": "...",
      "D": "..."
    },
    "difficulty": "sedang",
    "topic": "..."
  }
]
```

Implementasi saat ini memakai generator lokal deterministik agar aplikasi langsung berjalan tanpa API key. Modul ini sengaja dipisah agar mudah diganti dengan provider AI.
