<?php

use App\Models\AuthAuditLog;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\PersonalAccessToken;
use Laravel\Sanctum\Sanctum;
use Laravel\Socialite\Facades\Socialite;

uses(RefreshDatabase::class);

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

it('logs out and revokes token from bearer token', function () {
    $user = User::factory()->create();
    $plainTextToken = $user->createToken('auth-token')->plainTextToken;
    $token = PersonalAccessToken::findToken($plainTextToken);

    expect($token)->not->toBeNull();

    $response = $this
        ->withHeader('Authorization', 'Bearer ' . $plainTextToken)
        ->postJson('/api/logout');

    $response
        ->assertOk()
        ->assertJson(['message' => 'Logged out'])
        ->assertCookieExpired('auth_token');

    expect(PersonalAccessToken::query()->find($token->id))->toBeNull();
    expect(AuthAuditLog::query()->where('event', 'logout')->exists())->toBeTrue();
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
        ]);
});
