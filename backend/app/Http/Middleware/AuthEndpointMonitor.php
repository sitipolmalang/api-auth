<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class AuthEndpointMonitor
{
    public function handle(Request $request, Closure $next): Response
    {
        $requestId = $request->header('X-Request-Id') ?: (string) Str::uuid();
        $start = microtime(true);

        /** @var Response $response */
        $response = $next($request);

        $durationMs = (int) round((microtime(true) - $start) * 1000);
        $statusCode = $response->getStatusCode();

        $logContext = [
            'request_id' => $requestId,
            'method' => $request->method(),
            'path' => $request->path(),
            'status_code' => $statusCode,
            'duration_ms' => $durationMs,
            'user_id' => $request->user()?->id,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ];

        if ($statusCode >= 500) {
            Log::error('Auth endpoint request failed', $logContext);
        } elseif ($statusCode === 429) {
            Log::warning('Auth endpoint rate limit hit', $logContext);
        } else {
            Log::info('Auth endpoint request', $logContext);
        }

        $response->headers->set('X-Request-Id', $requestId);

        return $response;
    }
}
