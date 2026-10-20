<?php

use App\Http\Controllers\Api\AuthController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/health', function () {
    return response()->json([
        'success' => true,
        'message' => 'SPK Magang API is running',
        'service' => 'backend',
    ]);
});

Route::post('/auth/login', [AuthController::class, 'login'])
    ->middleware('throttle:5,1');

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/auth/me', [AuthController::class, 'me']);

    Route::post('/auth/logout', [AuthController::class, 'logout']);

    Route::middleware('role:admin')->prefix('admin')->group(function () {
        Route::get('/access-check', function (Request $request) {
            return response()->json([
                'success' => true,
                'message' => 'Akses admin diberikan.',
                'role' => $request->user()->role,
            ]);
        });
    });

    Route::middleware('role:mahasiswa')->prefix('mahasiswa')->group(function () {
        Route::get('/access-check', function (Request $request) {
            return response()->json([
                'success' => true,
                'message' => 'Akses mahasiswa diberikan.',
                'role' => $request->user()->role,
            ]);
        });
    });

    Route::middleware('role:dpm')->prefix('dpm')->group(function () {
        Route::get('/access-check', function (Request $request) {
            return response()->json([
                'success' => true,
                'message' => 'Akses DPM diberikan.',
                'role' => $request->user()->role,
            ]);
        });
    });
});
