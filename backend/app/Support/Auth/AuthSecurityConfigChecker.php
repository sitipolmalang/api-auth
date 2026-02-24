<?php

namespace App\Support\Auth;

use RuntimeException;

class AuthSecurityConfigChecker
{
    /**
     * @return array{issues: list<string>, warnings: list<string>}
     */
    public function inspect(bool $strict = false): array
    {
        $issues = [];
        $warnings = [];

        $isProduction = app()->environment('production');
        $shouldEnforceProductionRules = $isProduction || $strict;

        $appUrl = (string) config('app.url');
        $sessionSecure = (bool) config('session.secure');
        $sameSite = strtolower((string) config('session.same_site', 'lax'));
        $trustedOrigins = $this->parseCsv((string) env('TRUSTED_FRONTEND_ORIGINS', ''));
        $statefulDomains = array_values(array_filter(array_map(
            static fn (string $domain): string => trim($domain),
            (array) config('sanctum.stateful', [])
        )));

        if ($shouldEnforceProductionRules && ! str_starts_with($appUrl, 'https://')) {
            $issues[] = 'APP_URL wajib https:// di production.';
        } elseif (! str_starts_with($appUrl, 'https://')) {
            $warnings[] = 'APP_URL belum https://.';
        }

        if ($shouldEnforceProductionRules && ! $sessionSecure) {
            $issues[] = 'SESSION_SECURE_COOKIE wajib true di production.';
        } elseif (! $sessionSecure) {
            $warnings[] = 'SESSION_SECURE_COOKIE masih false.';
        }

        if ($sameSite === 'none' && ! $sessionSecure) {
            $issues[] = 'SESSION_SAME_SITE=none mewajibkan SESSION_SECURE_COOKIE=true.';
        }

        if ($trustedOrigins === []) {
            $issues[] = 'TRUSTED_FRONTEND_ORIGINS tidak boleh kosong.';
        }

        if ($statefulDomains === []) {
            $issues[] = 'SANCTUM_STATEFUL_DOMAINS tidak boleh kosong.';
        }

        foreach ($trustedOrigins as $origin) {
            if (! str_starts_with($origin, 'https://') && $shouldEnforceProductionRules) {
                $issues[] = sprintf('Trusted origin harus https:// (%s).', $origin);
            }
        }

        return [
            'issues' => array_values(array_unique($issues)),
            'warnings' => array_values(array_unique($warnings)),
        ];
    }

    public function assertProductionSafe(): void
    {
        $result = $this->inspect();

        if (! app()->environment('production') || $result['issues'] === []) {
            return;
        }

        throw new RuntimeException(
            "Konfigurasi security production tidak valid:\n- ".implode("\n- ", $result['issues'])
        );
    }

    /**
     * @return list<string>
     */
    private function parseCsv(string $value): array
    {
        return array_values(array_filter(array_map(
            static fn (string $item): string => trim($item),
            explode(',', $value)
        )));
    }
}
