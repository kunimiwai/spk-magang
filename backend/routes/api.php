<?php

use App\Http\Controllers\Api\AdminAcceptanceLetterController;
use App\Http\Controllers\Api\AdminAnalyticsController;
use App\Http\Controllers\Api\AdminApplicationCommunicationController;
use App\Http\Controllers\Api\AdminApplicationController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CourseController;
use App\Http\Controllers\Api\CriterionController;
use App\Http\Controllers\Api\CriterionScoreController;
use App\Http\Controllers\Api\DpmActivityController;
use App\Http\Controllers\Api\DpmApplicationController;
use App\Http\Controllers\Api\DpmPlacementController;
use App\Http\Controllers\Api\PartnerController;
use App\Http\Controllers\Api\RecommendationController;
use App\Http\Controllers\Api\StudentAcceptanceLetterController;
use App\Http\Controllers\Api\StudentApplicationController;
use App\Http\Controllers\Api\StudentController;
use App\Http\Controllers\Api\StudentGradeController;
use App\Http\Controllers\Api\StudentProfileController;
use App\Http\Controllers\Api\SystemSettingController;
use App\Http\Controllers\Api\UserController;
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

Route::post('/auth/register', [AuthController::class, 'register'])
    ->middleware('throttle:5,1');

Route::post('/password/email', [AuthController::class, 'forgotPassword'])
    ->middleware('throttle:5,1');

Route::post('/password/reset', [AuthController::class, 'resetPassword'])
    ->middleware('throttle:5,1');

Route::get('/password/reset/{token}', function ($token) {
    $frontendUrl = rtrim(env('FRONTEND_URL', 'http://localhost:5173'), '/');

    return redirect("{$frontendUrl}/reset-password?token={$token}");
})->name('password.reset');

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/auth/me', [AuthController::class, 'me']);

    Route::post('/auth/logout', [AuthController::class, 'logout']);

    Route::middleware('role:admin,prodi')->prefix('admin')->group(function () {
        Route::get('/analytics', [AdminAnalyticsController::class, 'index']);

        Route::get('/partner-options', [PartnerController::class, 'options']);

        Route::apiResource('criteria', CriterionController::class);

        Route::apiResource('courses', CourseController::class);

        Route::get('/applications', [AdminApplicationController::class, 'index']);

        Route::get(
            '/applications/{application}',
            [AdminApplicationController::class, 'show'],
        );

        Route::patch(
            '/applications/{application}/status',
            [AdminApplicationController::class, 'updateStatus'],
        );

        Route::get(
            '/applications/{application}/communications',
            [AdminApplicationCommunicationController::class, 'index'],
        );
        Route::post(
            '/applications/{application}/communications',
            [AdminApplicationCommunicationController::class, 'store'],
        );

        Route::get(
            '/applications/{application}/acceptance-letter',
            [AdminAcceptanceLetterController::class, 'show'],
        );

        Route::get('/dpm-options', [DpmPlacementController::class, 'options']);

        Route::put(
            '/applications/{application}/dpm',
            [DpmPlacementController::class, 'store'],
        );

        Route::get(
            '/dpm/activities',
            [DpmActivityController::class, 'index'],
        );

        Route::get(
            '/partners/{partner}/scores',
            [CriterionScoreController::class, 'index'],
        );
        Route::put(
            '/partners/{partner}/scores',
            [CriterionScoreController::class, 'update'],
        );
        Route::delete(
            '/partners/{partner}/scores/{criterion}',
            [CriterionScoreController::class, 'destroy'],
        );

        Route::get('/system-settings', [SystemSettingController::class, 'index']);
        Route::get(
            '/system-settings/grouped',
            [SystemSettingController::class, 'byGroup'],
        );
        Route::post('/system-settings', [SystemSettingController::class, 'store']);
        Route::get(
            '/system-settings/{system_setting}',
            [SystemSettingController::class, 'show'],
        );
        Route::put(
            '/system-settings/{system_setting}',
            [SystemSettingController::class, 'update'],
        );
        Route::delete(
            '/system-settings/{system_setting}',
            [SystemSettingController::class, 'destroy'],
        );
    });

    Route::middleware('role:admin')->prefix('admin')->group(function () {
        Route::get('/access-check', function (Request $request) {
            return response()->json([
                'success' => true,
                'message' => 'Akses admin diberikan.',
                'role' => $request->user()->role,
            ]);
        });

        Route::apiResource('partners', PartnerController::class);

        Route::get('/users', [UserController::class, 'index']);
        Route::post('/users', [UserController::class, 'store']);
        Route::get('/users/{user}', [UserController::class, 'show']);
        Route::put('/users/{user}', [UserController::class, 'update']);
        Route::delete('/users/{user}', [UserController::class, 'destroy']);
    });

    Route::middleware('role:admin')->prefix('admin')->group(function () {
        Route::get('/access-check', function (Request $request) {
            return response()->json([
                'success' => true,
                'message' => 'Akses admin diberikan.',
                'role' => $request->user()->role,
            ]);
        });

        Route::apiResource('partners', PartnerController::class);
    });

    Route::middleware('role:mahasiswa')->prefix('mahasiswa')->group(function () {
        Route::get('/access-check', function (Request $request) {
            return response()->json([
                'success' => true,
                'message' => 'Akses mahasiswa diberikan.',
                'role' => $request->user()->role,
            ]);
        });

        Route::get('/peminatan', [StudentController::class, 'peminatan']);

        Route::get('/profile', [StudentProfileController::class, 'show']);
        Route::put('/profile', [StudentProfileController::class, 'update']);

        Route::get('/grades', [StudentGradeController::class, 'index']);
        Route::put('/grades', [StudentGradeController::class, 'update']);

        Route::get('/partner-options', [PartnerController::class, 'options']);
        Route::get('/partners', [PartnerController::class, 'studentIndex']);

        Route::get('/applications', [StudentApplicationController::class, 'index']);
        Route::post('/applications', [StudentApplicationController::class, 'store']);
        Route::get(
            '/applications/{application}',
            [StudentApplicationController::class, 'show'],
        );

        Route::post(
            '/applications/{application}/acceptance-letter',
            [StudentAcceptanceLetterController::class, 'store'],
        );
        Route::get(
            '/applications/{application}/acceptance-letter',
            [StudentAcceptanceLetterController::class, 'show'],
        );

        Route::get('/recommendations', [RecommendationController::class, 'index']);

        Route::get(
            '/acceptance-letter/limit',
            [StudentAcceptanceLetterController::class, 'limit'],
        );
    });

    Route::middleware('role:dpm')->prefix('dpm')->group(function () {
        Route::get('/access-check', function (Request $request) {
            return response()->json([
                'success' => true,
                'message' => 'Akses DPM diberikan.',
                'role' => $request->user()->role,
            ]);
        });

        Route::get('/applications', [DpmApplicationController::class, 'index']);
        Route::get(
            '/applications/{application}',
            [DpmApplicationController::class, 'show'],
        );

        Route::get('/activities', [DpmActivityController::class, 'index']);
        Route::get(
            '/activities/{dpm_activity}',
            [DpmActivityController::class, 'show'],
        );
        Route::put(
            '/activities/{dpm_activity}',
            [DpmActivityController::class, 'update'],
        );
        Route::delete(
            '/activities/{dpm_activity}',
            [DpmActivityController::class, 'destroy'],
        );

        Route::post(
            '/placements/{dpm_placement}/activities',
            [DpmActivityController::class, 'store'],
        );
    });
});
