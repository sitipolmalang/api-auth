# API Auth SaaS (Laravel + Next.js)

Monorepo autentikasi berbasis Google OAuth untuk kebutuhan SaaS.

- `backend/`: Laravel 12 + Socialite + Sanctum
- `frontend/`: Next.js 16 (App Router)

## Fitur Utama

- Login Google OAuth
- Session-first Sanctum via cookie httpOnly (`laravel-session`)
- Sliding session refresh (`POST /api/auth/refresh`)
- Halaman private `/dashboard`
- Halaman admin `/dashboard/admin`
- Role `user` dan `admin`
- Endpoint admin terproteksi middleware role + guard frontend
- Audit log autentikasi (retensi 5 data terbaru)
- Monitoring endpoint auth + request id
- Alert lonjakan `oauth_failed` berbasis cache window
- Rate limiting endpoint auth sensitif
- Security headers frontend dan backend (CSP, HSTS, XFO, Referrer Policy, dll)
- Halaman status/error: `401`, `403`, `404`, `500`

## Alur Login

1. User buka `/login` di frontend.
2. Frontend arahkan ke backend `GET /auth/google/redirect`.
3. Google callback ke backend `GET /auth/google/callback`.
4. Backend:
   - upsert user,
   - login user ke session Sanctum (stateful),
   - redirect ke frontend `/auth/callback?login=success`.
5. Frontend callback memvalidasi status login lalu redirect ke `/dashboard`.

## Route Ringkas

### Frontend
- `/` homepage
- `/login` halaman login
- `/auth/callback` halaman transit setelah OAuth
- `/dashboard` halaman private
- `/dashboard/admin` halaman admin
- `/401`, `/403`, `/500`, serta `not-found` untuk 404

### Backend
- `GET /auth/google/redirect`
- `GET /auth/google/callback`
- `GET /api/auth/session` (`auth:sanctum`)
- `POST /api/auth/refresh` (`auth:sanctum`, `trusted.frontend`, `csrf.guard`)
- `GET /api/me` (`auth:sanctum`)
- `GET /api/me/activity` (`auth:sanctum`, max 5 data)
- `GET /api/admin/overview` (`auth:sanctum`, `role:admin`)
- `POST /api/logout` (`auth:sanctum`, `trusted.frontend`, `csrf.guard`)

## Quick Start

### 1) Backend
```bash
cd backend
composer install
php artisan key:generate
php artisan migrate
php artisan optimize:clear
php artisan serve
```

### 2) Frontend
```bash
cd frontend
npm install
npm run dev
```

## Environment Penting

### Backend (`backend/.env`)
```env
APP_URL=http://localhost:8000
FRONTEND_URL=http://localhost:3000
TRUSTED_FRONTEND_ORIGINS=http://localhost:3000

GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=http://localhost:8000/auth/google/callback

CSRF_GUARD_HEADER_NAME=X-CSRF-Guard
CSRF_GUARD_HEADER_VALUE=1
SESSION_COOKIE=laravel-session
SESSION_SECURE_COOKIE=false
SESSION_SAME_SITE=lax
SANCTUM_STATEFUL_DOMAINS=localhost:3000,localhost,127.0.0.1:3000,127.0.0.1

ADMIN_EMAILS=admin1@domain.com,admin2@domain.com
RATE_LIMIT_OAUTH_GOOGLE=20
RATE_LIMIT_AUTH_SESSION=120
RATE_LIMIT_AUTH_ME=60
RATE_LIMIT_AUTH_LOGOUT=30
RATE_LIMIT_AUTH_REFRESH=20
ALERT_OAUTH_FAILED_THRESHOLD=5
ALERT_OAUTH_FAILED_WINDOW_SECONDS=300
ALERT_OAUTH_FAILED_COOLDOWN_SECONDS=120
```

### Frontend (`frontend/.env`)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_FRONTEND_URL=http://localhost:3000
NEXT_PUBLIC_SESSION_COOKIE_NAME=laravel-session
```

## Validasi Lokal

### Backend test
```bash
cd backend
vendor/bin/pest --filter AuthFlowTest
```

### Frontend lint
```bash
cd frontend
npm run lint
```

## Catatan Produksi

- Gunakan `APP_ENV=production` dan `APP_DEBUG=false`.
- Jalankan backend/frontend di HTTPS.
- Set `SESSION_SECURE_COOKIE=true`.
- Isi `SESSION_DOMAIN` sesuai domain produksi.
- Gunakan secret OAuth yang aman dan lakukan rotasi jika pernah terekspos.
- Batasi CORS hanya untuk origin frontend produksi.

## Dokumentasi Detail

- Backend: `backend/README.md`
- Frontend: `frontend/README.md`
- Deployment checklist: `docs/DEPLOYMENT_CHECKLIST.md`
- Riwayat perubahan: `CHANGELOG.md`

## CI Gate

Workflow GitHub Actions tersedia di `.github/workflows/ci.yml` dengan 3 gate:
- backend auth tests (`AuthFlowTest`)
- frontend lint + build
- strict auth security config (`php artisan auth:config-check --strict`)

## Panduan Rilis Singkat

1. Pindahkan item selesai dari `Unreleased` ke versi baru di `CHANGELOG.md` (mis. `v0.5.0`).
2. Commit dengan pesan jelas sesuai scope perubahan.
3. Buat tag git versi:
```bash
git tag -a v0.5.0 -m "Release v0.5.0"
git push origin v0.5.0
```
