# Frontend (Next.js 16 App Router)

Frontend mengelola UI login, halaman publik/privat, guard route, dan tampilan dashboard.

## Halaman Utama

- `app/page.tsx` -> homepage
- `app/login/page.tsx` -> halaman login Google
- `app/auth/callback/page.tsx` -> halaman transit setelah OAuth
- `app/dashboard/page.tsx` -> halaman private user
- `app/dashboard/admin/page.tsx` -> halaman admin
- `app/dashboard/loading.tsx` -> loading state dashboard
- `app/dashboard/LogoutButton.tsx` -> tombol logout
- `app/dashboard/SessionRefresher.tsx` -> auto refresh sesi (sliding session)
- `app/api/auth/session/revalidate/route.ts` -> invalidasi cache tag sesi
- `app/401/page.tsx` -> unauthorized
- `app/403/page.tsx` -> forbidden
- `app/500/page.tsx` -> server/runtime error
- `app/not-found.tsx` -> 404
- `app/error.tsx` -> global error boundary

## Guard Route

File: `proxy.ts`

Aturan utama:
- user belum login + akses `/dashboard` => redirect ke `/401`
- user sudah login + akses `/login` => redirect ke `/dashboard`
- guard admin tetap ditegakkan di server component page (`requireAdminUser`)

Proxy menggunakan keberadaan session cookie untuk gate awal, lalu data user/role diverifikasi ulang melalui backend pada server component.

## Komponen Reusable

- `lib/ui.tsx`
  - `AppLinkButton`
  - `AppAnchorButton`
  - `AppPanel`
  - `InfoTile`
- `lib/env.ts`
  - `getApiBaseUrl()` untuk validasi URL API dari env
- `lib/auth-session.ts`
  - `checkSession()`
  - `checkAdminRole()`
- `lib/api-auth.ts`
  - helper fetch auth endpoint (`/api/me`, `/api/me/activity`, `/api/admin/overview`)

## Alur Frontend

1. Klik login di `/login`.
2. Browser diarahkan ke backend `/auth/google/redirect`.
3. Setelah callback backend sukses, frontend menerima redirect ke `/auth/callback?login=success`.
4. Halaman callback mengarahkan user ke `/dashboard`.
5. Dashboard menampilkan profil (`/api/me`) dan activity (`/api/me/activity`, max 5).
6. Saat user aktif di dashboard, frontend akan refresh sesi berkala via `/api/auth/refresh`.

## Environment

`frontend/.env`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_FRONTEND_URL=http://localhost:3000
NEXT_PUBLIC_SESSION_COOKIE_NAME=laravel-session
```

## Menjalankan Frontend

```bash
npm install
npm run dev
```

Akses: `http://localhost:3000`

## Quality Check

```bash
npm run lint
```

## Troubleshooting

### Berhenti di `/auth/callback`
- cek URL mengandung `?login=success`
- cek cookie sesi backend berhasil dibuat (`SESSION_COOKIE`), misalnya `laravel-session`
- pastikan `NEXT_PUBLIC_SESSION_COOKIE_NAME` sama dengan `SESSION_COOKIE` backend

### Selalu redirect ke `/401`
- pastikan backend `/api/auth/session` dan `/api/me` bisa diakses saat cookie valid
- cek konfigurasi cookie backend (`SESSION_*`)
- pastikan `NEXT_PUBLIC_API_URL` benar

### Role admin tidak muncul di dashboard
- role berasal dari response `/api/me`
- cek `users.role` di backend
- cek variabel `ADMIN_EMAILS` untuk auto-admin

### Logout terasa tidak konsisten
- pastikan `POST /api/logout` mengembalikan `200`
- pastikan cookie session backend dan `NEXT_PUBLIC_SESSION_COOKIE_NAME` sinkron

### Warning preload font di browser
- konfigurasi font utama sudah diset `preload: false` untuk mencegah warning preload yang tidak terpakai
