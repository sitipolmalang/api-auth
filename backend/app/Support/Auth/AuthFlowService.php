<?php

namespace App\Support\Auth;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class AuthFlowService
{
    public function redirectWithError(string $errorCode, ?string $requestId = null): RedirectResponse
    {
        $query = ['error' => $errorCode];

        if ($requestId) {
            $query['request_id'] = $requestId;
        }

        return redirect($this->frontendUrl() . '/auth/callback?' . http_build_query($query));
    }

    public function redirectWithSuccess(): RedirectResponse
    {
        return redirect($this->frontendUrl() . '/auth/callback?login=success');
    }

    public function refreshSession(Request $request): void
    {
        $request->session()->regenerate();
        $request->session()->regenerateToken();
    }

    public function logoutSession(Request $request): void
    {
        $request->session()->invalidate();
        $request->session()->regenerateToken();
    }

    private function frontendUrl(): string
    {
        return rtrim((string) env('FRONTEND_URL', 'http://localhost:3000'), '/');
    }
}
