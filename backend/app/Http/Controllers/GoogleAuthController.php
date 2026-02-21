<?php

namespace App\Http\Controllers;

use App\Models\AuthAuditLog;
use App\Models\User;
use App\Support\Auth\AuthAuditLogger;
use App\Support\Auth\AuthFlowService;
use App\Support\Auth\GoogleUserService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Throwable;
use Laravel\Socialite\Facades\Socialite;

class GoogleAuthController extends Controller
{
    public function __construct(
        private readonly AuthFlowService $authFlow,
        private readonly GoogleUserService $googleUserService,
        private readonly AuthAuditLogger $auditLogger,
    ) {
    }

    public function redirect()
    {
        return Socialite::driver('google')->redirect();
    }

    public function callback(Request $request)
    {
        try {
            $googleUser = Socialite::driver('google')->user();
        } catch (Throwable $exception) {
            $requestId = (string) Str::uuid();

            Log::error('Google OAuth callback failed', [
                'request_id' => $requestId,
                'error_code' => 'oauth_failed',
                'message' => $exception->getMessage(),
                'exception' => get_class($exception),
            ]);

            $this->auditLogger->log(
                event: 'oauth_failed',
                request: $request,
                requestId: $requestId,
                context: ['exception' => get_class($exception)]
            );

            return $this->authFlow->redirectWithError('oauth_failed', $requestId);
        }

        $email = $googleUser->getEmail();

        if (! $email) {
            $this->auditLogger->log(
                event: 'email_not_available',
                request: $request
            );

            return $this->authFlow->redirectWithError('email_not_available');
        }

        $user = $this->googleUserService->upsert(
            $email,
            $googleUser->getId(),
            $googleUser->getName() ?: $googleUser->getNickname() ?: 'Google User'
        );

        $token = $this->authFlow->issueAuthToken($user);

        $this->auditLogger->log(
            event: 'login_success',
            request: $request,
            userId: $user->id,
            email: $user->email,
            context: ['provider' => 'google']
        );

        return $this->authFlow->redirectWithSuccess()
            ->withCookie($this->authFlow->authCookie($token));
    }

    public function logout(Request $request)
    {
        $userId = $request->user()?->id;
        $email = $request->user()?->email;

        $this->authFlow->revokeCurrentToken($request);

        $this->auditLogger->log(
            event: 'logout',
            request: $request,
            userId: $userId,
            email: $email
        );

        return response()->json([
            'message' => 'Logged out',
        ])->withCookie($this->authFlow->forgetAuthCookie());
    }

    public function me(Request $request)
    {
        return response()->json($request->user());
    }

    public function session(Request $request)
    {
        if (! $request->user()) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        return response()->noContent();
    }

    public function adminOverview()
    {
        return response()->json([
            'users_total' => User::query()->count(),
            'admins_total' => User::query()->where('role', User::ROLE_ADMIN)->count(),
            'auth_events_total' => AuthAuditLog::query()->count(),
        ]);
    }

    public function myActivity(Request $request)
    {
        $user = $request->user();

        $activity = AuthAuditLog::query()
            ->where('user_id', $user?->id)
            ->latest('created_at')
            ->limit(5) // Only fetch the latest 5 activities for performance
            ->get([
                'event',
                'ip_address',
                'user_agent',
                'request_id',
                'created_at',
            ]);

        return response()->json($activity);
    }
}
