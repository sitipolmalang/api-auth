<?php

use App\Support\Auth\AuthSecurityConfigChecker;
use App\Models\User;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('auth:role {email} {role}', function (string $email, string $role) {
    $normalizedRole = strtolower(trim($role));

    if (! in_array($normalizedRole, [User::ROLE_USER, User::ROLE_ADMIN], true)) {
        $this->error('Role tidak valid. Gunakan: user atau admin');
        return self::FAILURE;
    }

    $user = User::query()->where('email', $email)->first();

    if (! $user) {
        $this->error("User dengan email {$email} tidak ditemukan.");
        return self::FAILURE;
    }

    $user->update(['role' => $normalizedRole]);

    $this->info("Role {$email} berhasil diubah menjadi {$normalizedRole}.");
    return self::SUCCESS;
})->purpose('Set role user berdasarkan email (user/admin)');

Artisan::command('auth:config-check {--strict}', function () {
    /** @var AuthSecurityConfigChecker $checker */
    $checker = app(AuthSecurityConfigChecker::class);
    $result = $checker->inspect((bool) $this->option('strict'));

    if ($result['warnings'] !== []) {
        $this->warn('Warnings:');
        foreach ($result['warnings'] as $warning) {
            $this->line("- {$warning}");
        }
    }

    if ($result['issues'] !== []) {
        $this->error('Issues:');
        foreach ($result['issues'] as $issue) {
            $this->line("- {$issue}");
        }
        return self::FAILURE;
    }

    $this->info('Auth/security configuration check passed.');
    return self::SUCCESS;
})->purpose('Validasi konfigurasi auth/security (gunakan --strict untuk aturan production)');
