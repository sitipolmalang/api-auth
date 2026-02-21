<?php

use App\Http\Controllers\GoogleAuthController;
use Illuminate\Support\Facades\Route;

Route::get('/me', [GoogleAuthController::class, 'me'])
    ->middleware(['auth:sanctum', 'throttle:auth-me', 'auth.monitor']);
Route::get('/auth/session', [GoogleAuthController::class, 'session'])
    ->middleware(['auth:sanctum', 'throttle:auth-session', 'auth.monitor']);
Route::post('/auth/refresh', [GoogleAuthController::class, 'refresh'])
    ->middleware(['auth:sanctum', 'throttle:auth-refresh', 'auth.monitor']);
Route::get('/me/activity', [GoogleAuthController::class, 'myActivity'])->middleware('auth:sanctum');
Route::get('/admin/overview', [GoogleAuthController::class, 'adminOverview'])
    ->middleware(['auth:sanctum', 'role:admin']);
Route::post('/logout', [GoogleAuthController::class, 'logout'])
    ->middleware(['throttle:auth-logout', 'auth.monitor']);
