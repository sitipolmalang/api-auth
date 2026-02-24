<?php

namespace App\Providers;

use App\Support\Auth\AuthSecurityConfigChecker;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

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
        app(AuthSecurityConfigChecker::class)->assertProductionSafe();

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
}
