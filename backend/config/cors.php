<?php

$frontendOrigins = collect(explode(',', (string) env('FRONTEND_URLS', '')))
    ->map(fn (string $origin) => trim($origin))
    ->filter(fn (string $origin) => $origin !== '')
    ->values()
    ->all();

$fallbackFrontendOrigin = trim((string) env('FRONTEND_URL', 'http://localhost:3000'));

if (empty($frontendOrigins) && $fallbackFrontendOrigin !== '') {
    $frontendOrigins = [$fallbackFrontendOrigin];
}

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods' => ['*'],
    'allowed_origins' => $frontendOrigins,
    'allowed_origins_patterns' => [],
    'allowed_headers' => [
        'Accept',
        'Authorization',
        'Content-Type',
        'Origin',
        'X-Requested-With',
        'X-CSRF-TOKEN',
    ],
    'exposed_headers' => [],
    'max_age' => (int) env('CORS_MAX_AGE', 600),
    'supports_credentials' => true,
];
