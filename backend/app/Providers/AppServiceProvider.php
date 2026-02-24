<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use RuntimeException;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->enforceProductionSecurityConfig();

        RateLimiter::for('oauth-google', function (Request $request): Limit {
            return Limit::perMinute((int) env('RATE_LIMIT_OAUTH_GOOGLE', 20))
                ->by($request->ip());
        });

        RateLimiter::for('auth-session', function (Request $request): Limit {
            $identifier = $request->user()?->id ?: $request->ip();

            return Limit::perMinute((int) env('RATE_LIMIT_AUTH_SESSION', 120))
                ->by('auth-session:'.$identifier);
        });

        RateLimiter::for('auth-me', function (Request $request): Limit {
            $identifier = $request->user()?->id ?: $request->ip();

            return Limit::perMinute((int) env('RATE_LIMIT_AUTH_ME', 60))
                ->by('auth-me:'.$identifier);
        });

        RateLimiter::for('auth-logout', function (Request $request): Limit {
            $identifier = $request->user()?->id ?: $request->ip();

            return Limit::perMinute((int) env('RATE_LIMIT_AUTH_LOGOUT', 30))
                ->by('auth-logout:'.$identifier);
        });

        RateLimiter::for('auth-refresh', function (Request $request): Limit {
            $identifier = $request->user()?->id ?: $request->ip();

            return Limit::perMinute((int) env('RATE_LIMIT_AUTH_REFRESH', 20))
                ->by('auth-refresh:'.$identifier);
        });
    }

    private function enforceProductionSecurityConfig(): void
    {
        if (! $this->app->environment('production')) {
            return;
        }

        $issues = [];
        $appUrl = (string) config('app.url');
        $sessionSecure = (bool) config('session.secure');
        $sameSite = strtolower((string) config('session.same_site', 'lax'));
        $trustedOrigins = array_values(array_filter(array_map(
            static fn (string $origin): string => trim($origin),
            explode(',', (string) env('TRUSTED_FRONTEND_ORIGINS', ''))
        )));
        $statefulDomains = array_values(array_filter(array_map(
            static fn (string $domain): string => trim($domain),
            (array) config('sanctum.stateful', [])
        )));

        if (! str_starts_with($appUrl, 'https://')) {
            $issues[] = 'APP_URL wajib https:// di production.';
        }

        if (! $sessionSecure) {
            $issues[] = 'SESSION_SECURE_COOKIE wajib true di production.';
        }

        if ($sameSite === 'none' && ! $sessionSecure) {
            $issues[] = 'SESSION_SAME_SITE=none mewajibkan SESSION_SECURE_COOKIE=true.';
        }

        if ($trustedOrigins === []) {
            $issues[] = 'TRUSTED_FRONTEND_ORIGINS tidak boleh kosong di production.';
        }

        if ($statefulDomains === []) {
            $issues[] = 'SANCTUM_STATEFUL_DOMAINS tidak boleh kosong di production.';
        }

        foreach ($trustedOrigins as $origin) {
            if (! str_starts_with($origin, 'https://')) {
                $issues[] = sprintf('Trusted origin harus https:// (%s).', $origin);
            }
        }

        if ($issues === []) {
            return;
        }

        throw new RuntimeException(
            "Konfigurasi security production tidak valid:\n- ".implode("\n- ", $issues)
        );
    }
}
