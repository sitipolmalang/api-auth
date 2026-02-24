import { cookies } from "next/headers";
import { AppLinkButton, AppPanel } from "@/lib/ui";
import { hasValidSession } from "@/lib/auth-session";
import { getSessionCookieNames } from "@/lib/env";

export default async function HomePage() {
  const cookieStore = await cookies();
  const hasSessionCookie = getSessionCookieNames().some(
    (cookieName) => Boolean(cookieStore.get(cookieName)?.value),
  );
  const cookieHeader = cookieStore
    .getAll()
    .map(({ name, value }) => `${name}=${value}`)
    .join("; ");
  const isLoggedIn = hasSessionCookie ? await hasValidSession(cookieHeader) : false;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#f5f7ff,_#f8fafc_45%,_#ffffff_80%)]">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <p className="text-sm font-semibold tracking-wide text-zinc-800">
          Laranext Auth
        </p>
        <div className="flex items-center gap-2">
          {!isLoggedIn ? (
            <AppLinkButton href="/login" className="rounded-full" variant="outline">
              Login
            </AppLinkButton>
          ) : null}
          {isLoggedIn ? (
            <AppLinkButton
              href="/dashboard/users"
              className="rounded-full"
              variant="primary"
            >
              Dashboard
            </AppLinkButton>
          ) : null}
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-6xl gap-8 px-6 pb-20 pt-10 md:grid-cols-2 md:items-center">
        <section>
          <p className="inline-flex rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-600">
            SaaS-ready authentication
          </p>
          <h1 className="mt-5 text-4xl font-semibold leading-tight text-zinc-900 md:text-5xl">
            Login Google cepat untuk produk SaaS kamu.
          </h1>
          <p className="mt-4 max-w-xl text-base text-zinc-600">
            Landing page publik di sini, login dipisah di halaman khusus, dan
            dashboard diproteksi dengan sesi berbasis cookie httpOnly.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            {!isLoggedIn ? (
              <AppLinkButton href="/login" variant="primary" className="rounded-xl px-5 py-3">
                Mulai Login
              </AppLinkButton>
            ) : null}
            {isLoggedIn ? (
              <AppLinkButton
                href="/dashboard/users"
                variant="outline"
                className="rounded-xl px-5 py-3"
              >
                Lihat Dashboard
              </AppLinkButton>
            ) : null}
          </div>
        </section>

        <AppPanel className="rounded-3xl p-8 shadow-[0_20px_80px_-48px_rgba(15,23,42,0.55)]">
          <h2 className="text-lg font-semibold text-zinc-900">
            Arsitektur saat ini
          </h2>
          <ul className="mt-4 space-y-3 text-sm text-zinc-600">
            <li>Laravel Socialite untuk OAuth Google</li>
            <li>Sanctum session-first dengan stateful cookie</li>
            <li>Next.js route `/dashboard` diproteksi proxy</li>
          </ul>
        </AppPanel>
      </main>
    </div>
  );
}
