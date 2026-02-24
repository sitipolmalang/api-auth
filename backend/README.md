# Backend (Laravel 12)

Backend bertanggung jawab untuk OAuth Google, manajemen session Sanctum, role, audit log autentikasi, rate limit, dan monitoring endpoint auth.

## Arsitektur Ringkas

- `app/Http/Controllers/GoogleAuthController.php`
  - endpoint OAuth (`redirect`, `callback`)
  - endpoint auth API (`session`, `refresh`, `me`, `myActivity`, `logout`, `adminOverview`)
- `app/Support/Auth/AuthFlowService.php`
  - lifecycle session auth (refresh/logout)
  - redirect sukses/gagal auth
- `app/Support/Auth/GoogleUserService.php`
  - sinkronisasi data user Google ke tabel `users`
  - auto-assign role admin berdasar `ADMIN_EMAILS`
- `app/Support/Auth/AuthAuditLogger.php`
  - pencatatan event auth ke `auth_audit_logs`
  - deteksi lonjakan `oauth_failed` berbasis cache window
  - retensi otomatis: simpan hanya 5 data terbaru per scope
- `app/Http/Middleware/EnsureRole.php`
  - middleware `role:admin` untuk endpoint admin
- `app/Http/Middleware/AuthEndpointMonitor.php`
  - monitoring endpoint auth + logging request_id/status/duration
- `app/Http/Middleware/SecurityHeaders.php`
  - security headers backend (CSP, HSTS production, XFO, Referrer Policy, dll)

## Route

### `routes/web.php`
- `GET /auth/google/redirect` (`throttle:oauth-google`, `auth.monitor`)
- `GET /auth/google/callback` (`throttle:oauth-google`, `auth.monitor`)

### `routes/api.php`
- `GET /api/auth/session` (`auth:sanctum`, `throttle:auth-session`, `auth.monitor`)
- `POST /api/auth/refresh` (`auth:sanctum`, `trusted.frontend`, `csrf.guard`, `throttle:auth-refresh`, `auth.monitor`)
- `GET /api/me` (`auth:sanctum`, `throttle:auth-me`, `auth.monitor`)
- `GET /api/me/activity` (`auth:sanctum`, max 5 data)
- `GET /api/admin/overview` (`auth:sanctum`, `role:admin`)
- `POST /api/logout` (`auth:sanctum`, `trusted.frontend`, `csrf.guard`, `throttle:auth-logout`, `auth.monitor`)

## Role Admin

### Otomatis via `.env`
```env
ADMIN_EMAILS=admin1@domain.com,admin2@domain.com
```

Email yang ada pada daftar ini akan mendapat role `admin` saat login Google.

### Manual via command
```bash
php artisan auth:role user@email.com admin
php artisan auth:role user@email.com user
```

## Audit Log

Tabel: `auth_audit_logs`

Event utama:
- `login_success`
- `logout`
- `oauth_failed`
- `email_not_available`
- `token_refreshed`

Kolom penting:
- `event`, `user_id`, `email`, `request_id`, `ip_address`, `user_agent`, `context`, `created_at`

Retensi:
- backend menjaga hanya 5 record terakhir agar tabel tidak menumpuk.

Monitoring tambahan:
- alert lonjakan `oauth_failed` akan ditulis ke log level `critical` saat melewati threshold dalam window waktu tertentu.

## Konfigurasi Environment

`backend/.env`:

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

ADMIN_EMAILS=
RATE_LIMIT_OAUTH_GOOGLE=20
RATE_LIMIT_AUTH_SESSION=120
RATE_LIMIT_AUTH_ME=60
RATE_LIMIT_AUTH_LOGOUT=30
RATE_LIMIT_AUTH_REFRESH=20
ALERT_OAUTH_FAILED_THRESHOLD=5
ALERT_OAUTH_FAILED_WINDOW_SECONDS=300
ALERT_OAUTH_FAILED_COOLDOWN_SECONDS=120
```

## Menjalankan Backend

```bash
composer install
php artisan key:generate
php artisan migrate
php artisan optimize:clear
php artisan serve
```

## Test

```bash
vendor/bin/pest --filter AuthFlowTest
php artisan auth:config-check
php artisan auth:config-check --strict
```

## Hardening Production

Set minimum berikut saat deploy:

```env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://api.example.com
SESSION_SECURE_COOKIE=true
SESSION_SAME_SITE=lax
SESSION_DOMAIN=.example.com
TRUSTED_FRONTEND_ORIGINS=https://app.example.com
SANCTUM_STATEFUL_DOMAINS=app.example.com
```

Catatan:
- aplikasi akan fail-fast saat boot di production jika `APP_URL` belum HTTPS, `SESSION_SECURE_COOKIE=false`, atau whitelist origin/stateful domain kosong.
- endpoint web frontend tetap session-first (cookie + CSRF), bukan bearer token.

## Troubleshooting

### Error `redirect_uri_mismatch`
- pastikan URL callback di Google Cloud Console sama persis dengan:
  - `http://localhost:8000/auth/google/callback`
- cek juga `.env` `GOOGLE_REDIRECT_URI` harus identik.

### Error `oauth_failed`
- cek `storage/logs/laravel.log`
- gunakan `request_id` untuk melacak event callback dan audit.

### Endpoint admin selalu `403`
- cek nilai `users.role`
- cek `ADMIN_EMAILS`
- atau set manual menggunakan command `auth:role`.
