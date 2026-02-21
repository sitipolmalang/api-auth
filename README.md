# API Auth (Laravel + Next.js)

Starter SaaS authentication project using:
- `backend/` = Laravel 12 API + Socialite (Google OAuth) + Sanctum
- `frontend/` = Next.js 16 App Router

This project implements Google Sign-In, session cookie auth, protected dashboard, and production-oriented hardening basics.

## 1. Architecture Overview

Authentication flow:
1. User opens `frontend` page `/login`
2. Frontend redirects to backend: `GET /auth/google/redirect`
3. Google authenticates user and redirects to backend callback
4. Backend callback:
   - upserts user in DB
   - issues Sanctum personal access token
   - sets token into HTTP-only cookie (`auth_token`)
   - redirects to frontend `/auth/callback?login=success`
5. Frontend callback routes user to `/dashboard`
6. Dashboard fetches user data from backend `GET /api/me`

## 2. Main Routes

### Frontend (Next.js)
- `/` Home/Landing
- `/login` Sign-in page
- `/auth/callback` OAuth transit page
- `/dashboard` Protected page

### Backend (Laravel)
- `GET /auth/google/redirect`
- `GET /auth/google/callback`
- `GET /api/me` (requires `auth:sanctum`)
- `POST /api/logout` (revokes token + clears auth cookie)

## 3. Project Structure

```txt
api-auth/
├─ backend/
│  ├─ app/
│  │  ├─ Http/Controllers/GoogleAuthController.php
│  │  ├─ Http/Middleware/AuthenticateWithTokenCookie.php
│  │  └─ Support/Auth/
│  │     ├─ AuthFlowService.php
│  │     └─ GoogleUserService.php
│  ├─ routes/
│  │  ├─ web.php
│  │  └─ api.php
│  └─ tests/Feature/AuthFlowTest.php
└─ frontend/
   ├─ app/
   │  ├─ page.tsx
   │  ├─ login/page.tsx
   │  ├─ auth/callback/page.tsx
   │  └─ dashboard/
   │     ├─ page.tsx
   │     ├─ loading.tsx
   │     └─ LogoutButton.tsx
   └─ lib/
      ├─ ui.tsx
      └─ env.ts
```

## 4. Prerequisites

- PHP `^8.2`
- Composer
- Node.js (LTS)
- PostgreSQL (or adjust DB driver)
- Google Cloud OAuth 2.0 credentials

## 5. Environment Setup

## Backend `.env` (important keys)

```env
APP_URL=http://localhost:8000
FRONTEND_URL=http://localhost:3000

GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=http://localhost:8000/auth/google/callback

AUTH_COOKIE_NAME=auth_token
AUTH_TOKEN_TTL_MINUTES=10080
AUTH_COOKIE_DOMAIN=
AUTH_COOKIE_SAME_SITE=lax
AUTH_COOKIE_SECURE=false
SANCTUM_EXPIRATION=10080
```

## Frontend `.env`

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Google Cloud Console

For OAuth Client ID used by your backend:
- Authorized JavaScript origins:
  - `http://localhost:3000`
- Authorized redirect URIs:
  - `http://localhost:8000/auth/google/callback`

Must match exactly.

## 6. Run Locally

### Backend

```bash
cd backend
composer install
php artisan key:generate
php artisan migrate
php artisan optimize:clear
php artisan serve
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open:
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000`

## 7. Security Notes

- Do not commit `.env`
- Rotate `GOOGLE_CLIENT_SECRET` if ever exposed
- For production:
  - `APP_ENV=production`
  - `APP_DEBUG=false`
  - `AUTH_COOKIE_SECURE=true`
  - set `AUTH_COOKIE_DOMAIN` to your domain
  - use HTTPS

## 8. Tests & Lint

### Frontend lint

```bash
cd frontend
npm run lint
```

### Backend auth tests

```bash
cd backend
vendor/bin/pest --filter AuthFlowTest
```

## 9. Troubleshooting

### `redirect_uri_mismatch`
- Ensure Google redirect URI exactly equals:
  - `http://localhost:8000/auth/google/callback`

### `oauth_failed`
- Check backend logs:
  - `backend/storage/logs/laravel.log`
- Use `request_id` from callback URL to trace specific failure

### Login success but still cannot access dashboard
- Run:
  - `php artisan optimize:clear`
- Verify cookie settings (`AUTH_COOKIE_*`) and CORS configuration

### Logout seems not working
- Confirm `POST /api/logout` returns `Set-Cookie` expiration for `auth_token`
- Hard refresh browser

## 10. Learning Path (Recommended)

1. Understand flow in `GoogleAuthController`
2. Follow service abstractions in `app/Support/Auth`
3. Study protected route behavior in `frontend/proxy.ts`
4. Read auth tests in `backend/tests/Feature/AuthFlowTest.php`

