# Deployment Checklist (SaaS Production)

Checklist ini fokus pada auth/session-first Sanctum untuk monorepo ini.

## 1. Pre-Deploy Config

Backend (`backend/.env`):

```env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://api.example.com
FRONTEND_URL=https://app.example.com
TRUSTED_FRONTEND_ORIGINS=https://app.example.com
SANCTUM_STATEFUL_DOMAINS=app.example.com

SESSION_DRIVER=database
SESSION_COOKIE=laravel-session
SESSION_SECURE_COOKIE=true
SESSION_SAME_SITE=lax
SESSION_DOMAIN=.example.com

CSRF_GUARD_HEADER_NAME=X-CSRF-Guard
CSRF_GUARD_HEADER_VALUE=1
```

Frontend (`frontend/.env`):

```env
NEXT_PUBLIC_API_URL=https://api.example.com
NEXT_PUBLIC_FRONTEND_URL=https://app.example.com
NEXT_PUBLIC_SESSION_COOKIE_NAME=laravel-session
```

## 2. Build and App Checks

1. Backend:
```bash
cd backend
composer install --no-dev --optimize-autoloader
php artisan config:clear
php artisan auth:config-check --strict
php artisan migrate --force
php artisan optimize
```

2. Frontend:
```bash
cd frontend
npm ci
npm run lint
npm run build
```

## 3. Runtime Verification

1. Login flow:
- `/login` -> Google -> `/auth/callback?login=success` -> `/dashboard/users`

2. Session auth:
- `GET /api/auth/session` harus `204` saat login
- `GET /api/me` harus `200` dan field minimal sesuai kontrak

3. Logout flow:
- klik logout -> status sukses
- cookie session hilang
- akses `/dashboard/*` redirect ke `/401`

4. Admin guard:
- user biasa ke `/dashboard/admin` -> `/403`
- user admin tetap bisa akses `/dashboard/admin`

## 4. Security Smoke Checks

1. Pastikan cookie session:
- `HttpOnly=true`
- `Secure=true`
- `SameSite=lax` (atau `none` jika cross-site + HTTPS)

2. Cek header request mutasi auth (`refresh/logout`):
- ada `Origin` valid (trusted)
- ada header CSRF guard

3. Cek endpoint sensitif:
- rate limit aktif
- audit log auth bertambah sesuai event

## 5. Rollback Plan

1. Simpan release tag:
```bash
git tag -a vX.Y.Z -m "Release vX.Y.Z"
git push origin vX.Y.Z
```

2. Jika rollback:
- deploy image/build sebelumnya
- restore env sebelumnya
- jalankan smoke test login/logout minimum
