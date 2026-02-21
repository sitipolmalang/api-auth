# Backend (Laravel 12)

Backend ini bertanggung jawab untuk:
- OAuth Google (Socialite)
- Manajemen user login Google
- Penerbitan token Sanctum
- Kuki sesi `auth_token` (httpOnly)
- API endpoint `me` dan `logout`

## 1. Alur Backend

1. `GET /auth/google/redirect`  
   Arahkan pengguna ke OAuth Google.

2. `GET /auth/google/callback`  
   Terima callback dari Google, ambil profil pengguna, simpan/perbarui pengguna, buat token autentikasi, set kuki, lalu arahkan ke callback frontend.

3. `GET /api/me`  
   Ambil data pengguna yang sedang login (`auth:sanctum`).

4. `POST /api/logout`  
   Cabut token dan hapus kuki autentikasi.

## 2. Berkas Penting untuk Dipelajari

- `app/Http/Controllers/GoogleAuthController.php`  
  Orkestrasi endpoint autentikasi.

- `app/Support/Auth/AuthFlowService.php`  
  Layanan reusable untuk:
  - redirect sukses/gagal
  - terbitkan/cabut token
  - buat/hapus kuki autentikasi

- `app/Support/Auth/GoogleUserService.php`  
  Layanan reusable untuk upsert pengguna Google.

- `app/Http/Middleware/AuthenticateWithTokenCookie.php`  
  Menyisipkan bearer token dari kuki `auth_token` ke request API.

- `routes/web.php`  
  Route OAuth (`/auth/google/redirect`, `/auth/google/callback`) + throttle.

- `routes/api.php`  
  Route API autentikasi (`/api/me`, `/api/logout`).

## 3. Variabel Environment Penting

Contoh:

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

## 4. Menjalankan Backend

```bash
composer install
php artisan key:generate
php artisan migrate
php artisan optimize:clear
php artisan serve
```

## 5. Pengujian

Pengujian utama autentikasi ada di:
- `tests/Feature/AuthFlowTest.php`

Jalankan:

```bash
vendor/bin/pest --filter AuthFlowTest
```

## 6. Catatan Produksi

- Set `APP_ENV=production`, `APP_DEBUG=false`
- Gunakan HTTPS
- Set `AUTH_COOKIE_SECURE=true`
- Set `AUTH_COOKIE_DOMAIN` untuk domain produksi
- Lakukan rotasi `GOOGLE_CLIENT_SECRET` jika pernah terekspos

## 7. Pemecahan Masalah Cepat

### `redirect_uri_mismatch`
- Cek Google Cloud Console:
  - `http://localhost:8000/auth/google/callback` harus sama persis

### `oauth_failed`
- Cek `storage/logs/laravel.log`
- Gunakan `request_id` dari query callback untuk melacak log

### Logout tidak efektif
- Cek response `POST /api/logout` mengirim kuki expired untuk `auth_token`
