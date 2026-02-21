<?php

use App\Http\Controllers\GoogleAuthController;
use Illuminate\Support\Facades\Route;

Route::get('/me', [GoogleAuthController::class, 'me'])->middleware('auth:sanctum');
Route::get('/auth/session', [GoogleAuthController::class, 'session'])->middleware('auth:sanctum');
Route::get('/me/activity', [GoogleAuthController::class, 'myActivity'])->middleware('auth:sanctum');
Route::get('/admin/overview', [GoogleAuthController::class, 'adminOverview'])
    ->middleware(['auth:sanctum', 'role:admin']);
Route::post('/logout', [GoogleAuthController::class, 'logout']);
