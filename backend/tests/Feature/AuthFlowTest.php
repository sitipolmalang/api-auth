<?php

use App\Models\AuthAuditLog;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Laravel\Socialite\Facades\Socialite;

uses(RefreshDatabase::class);

function csrfGuardHeaderName(): string
{
    return (string) env('CSRF_GUARD_HEADER_NAME', 'X-CSRF-Guard');
}

function csrfGuardHeaderValue(): string
{
    return (string) env('CSRF_GUARD_HEADER_VALUE', '1');
}

function trustedFrontendOrigin(): string
{
    $configured = collect(explode(',', (string) env('TRUSTED_FRONTEND_ORIGINS', '')))
        ->map(fn (string $value) => trim($value))
        ->first(fn (string $value) => $value !== '');

    if (is_string($configured) && $configured !== '') {
        return $configured;
    }

    return (string) env('FRONTEND_URL', 'http://localhost:3000');
}

it('authenticates /api/me for authenticated user', function () {
    $user = User::factory()->create();
    Sanctum::actingAs($user);

    $response = $this->getJson('/api/me');

    $response
        ->assertOk()
        ->assertJson([
            'id' => $user->id,
            'email' => $user->email,
        ]);
});

it('returns 204 for a valid auth session', function () {
    $user = User::factory()->create();
    Sanctum::actingAs($user);

    $this->getJson('/api/auth/session')
        ->assertNoContent();
});

it('returns 401 for an invalid auth session', function () {
    $this->getJson('/api/auth/session')
        ->assertUnauthorized();
});

it('logs out authenticated user session', function () {
    $user = User::factory()->create();
    Sanctum::actingAs($user);

    $response = $this
        ->withHeader('Origin', trustedFrontendOrigin())
        ->withHeader(csrfGuardHeaderName(), csrfGuardHeaderValue())
        ->postJson('/api/logout');

    $response
        ->assertOk()
        ->assertJson(['message' => 'Logged out']);

    expect(AuthAuditLog::query()->where('event', 'logout')->exists())->toBeTrue();
});

it('returns 401 on logout without auth', function () {
    $response = $this->postJson('/api/logout');

    $response
        ->assertUnauthorized();
});

it('refreshes authenticated user session', function () {
    $user = User::factory()->create();
    Sanctum::actingAs($user);

    $response = $this
        ->withHeader('Origin', trustedFrontendOrigin())
        ->withHeader(csrfGuardHeaderName(), csrfGuardHeaderValue())
        ->postJson('/api/auth/refresh');

    $response
        ->assertOk()
        ->assertJson(['message' => 'Session refreshed']);

    expect(AuthAuditLog::query()->where('event', 'token_refreshed')->exists())->toBeTrue();
});

it('returns 419 when csrf guard header is missing on refresh', function () {
    $user = User::factory()->create();
    Sanctum::actingAs($user);

    $this
        ->withHeader('Origin', trustedFrontendOrigin())
        ->postJson('/api/auth/refresh')
        ->assertStatus(419)
        ->assertJson(['message' => 'CSRF guard header missing or invalid.']);
});

it('returns 403 when request origin is not trusted on refresh', function () {
    $user = User::factory()->create();
    Sanctum::actingAs($user);

    $this
        ->withHeader('Origin', 'https://evil.example')
        ->withHeader(csrfGuardHeaderName(), csrfGuardHeaderValue())
        ->postJson('/api/auth/refresh')
        ->assertForbidden()
        ->assertJson(['message' => 'Request origin is not trusted.']);
});

it('redirects with structured error and request id when oauth callback fails', function () {
    Socialite::shouldReceive('driver')
        ->once()
        ->with('google')
        ->andReturnSelf();

    Socialite::shouldReceive('user')
        ->once()
        ->andThrow(new RuntimeException('oauth fail'));

    $response = $this->get('/auth/google/callback');

    $response->assertRedirect();

    $redirectUrl = (string) $response->headers->get('Location');

    expect($redirectUrl)->toContain('/auth/callback?');
    expect($redirectUrl)->toContain('error=oauth_failed');
    expect($redirectUrl)->toContain('request_id=');
    expect(AuthAuditLog::query()->where('event', 'oauth_failed')->exists())->toBeTrue();
});

it('forbids non-admin user from admin overview endpoint', function () {
    $user = User::factory()->create(['role' => User::ROLE_USER]);
    Sanctum::actingAs($user);

    $this->getJson('/api/admin/overview')
        ->assertForbidden()
        ->assertJson(['message' => 'Forbidden.']);
});

it('allows admin user to access admin overview endpoint', function () {
    $admin = User::factory()->create(['role' => User::ROLE_ADMIN]);
    Sanctum::actingAs($admin);

    $this->getJson('/api/admin/overview')
        ->assertOk()
        ->assertJsonStructure([
            'users_total',
            'admins_total',
            'auth_events_total',
            'auth_events_today',
            'auth_events_last_7_days',
            'auth_events_last_30_days',
            'auth_events_by_type',
        ]);
});
