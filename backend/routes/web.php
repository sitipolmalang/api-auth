<?php

use App\Http\Controllers\GoogleAuthController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/auth/google/redirect', [GoogleAuthController::class, 'redirect'])
    ->middleware(['throttle:oauth-google', 'auth.monitor']);

Route::get('/auth/google/callback', [GoogleAuthController::class, 'callback'])
    ->middleware(['throttle:oauth-google', 'auth.monitor']);
