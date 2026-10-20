<?php

use Illuminate\Support\Facades\Route;

Route::get('/health', function () {
    return response()->json([
        'success' => true,
        'message' => 'SPK Magang API is running',
        'service' => 'backend',
    ]);
});
