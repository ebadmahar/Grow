<?php

use App\Http\Controllers\Api\ActivityController;
use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\AqiController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CommunityTaskController;
use App\Http\Controllers\Api\GoalController;
use App\Http\Controllers\Api\LeaderboardController;
use App\Http\Controllers\Api\MapController;
use App\Http\Controllers\Api\MonitoringController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\PingController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\SpeciesController;
use App\Http\Controllers\Api\UserController;
use App\Http\Middleware\AdminMiddleware;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes — Grōv Restoration Platform API v1
|--------------------------------------------------------------------------
*/

Route::prefix('v1')->group(function () {

    // Public System Routes
    Route::get('/ping', PingController::class);
    Route::get('/weather/aqi', [AqiController::class, 'getIslamabadAqi']);

    // Authentication Routes
    Route::prefix('auth')->group(function () {
        Route::post('/register', [AuthController::class, 'register']);
        Route::post('/login', [AuthController::class, 'login']);
        Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
        Route::post('/reset-password', [AuthController::class, 'resetPassword']);

        Route::middleware('auth:sanctum')->group(function () {
            Route::post('/logout', [AuthController::class, 'logout']);
        });
    });

    // User Profile Routes (Protected)
    Route::middleware('auth:sanctum')->prefix('user')->group(function () {
        Route::get('/profile', [UserController::class, 'profile']);
        Route::put('/profile', [UserController::class, 'updateProfile']);
        Route::post('/avatar', [UserController::class, 'uploadAvatar']);
        Route::get('/interests', [UserController::class, 'getInterests']);
        Route::put('/interests', [UserController::class, 'updateInterests']);
        Route::put('/settings', [UserController::class, 'updateSettings']);
        Route::delete('/account', [UserController::class, 'deleteAccount']);
    });

    // Species Catalogue Routes
    Route::prefix('species')->group(function () {
        Route::get('/', [SpeciesController::class, 'index']);
        Route::get('/{id}', [SpeciesController::class, 'show']);
    });

    // Activity Routes (Protected for Logging)
    Route::prefix('activities')->group(function () {
        Route::get('/map', [MapController::class, 'mapPins']);

        Route::middleware('auth:sanctum')->group(function () {
            Route::get('/my-activities', [ActivityController::class, 'myActivities']);
            Route::post('/plantation', [ActivityController::class, 'storePlantation']);
            Route::post('/seeding', [ActivityController::class, 'storeSeeding']);
            Route::get('/{id}', [ActivityController::class, 'show']);
            Route::get('/{activity_id}/monitoring', [MonitoringController::class, 'forActivity']);
        });
    });

    // Monitoring System Routes (Protected)
    Route::middleware('auth:sanctum')->prefix('monitoring')->group(function () {
        Route::get('/records', [MonitoringController::class, 'index']);
        Route::post('/records', [MonitoringController::class, 'store']);
    });

    // Community Hub & Tasks
    Route::prefix('community/tasks')->group(function () {
        Route::get('/', [CommunityTaskController::class, 'index']);
        Route::get('/{id}', [CommunityTaskController::class, 'show']);

        Route::middleware('auth:sanctum')->group(function () {
            Route::post('/', [CommunityTaskController::class, 'store']);
            Route::put('/{id}', [CommunityTaskController::class, 'update']);
            Route::delete('/{id}', [CommunityTaskController::class, 'destroy']);
            Route::post('/{id}/join', [CommunityTaskController::class, 'join']);
            Route::post('/{id}/leave', [CommunityTaskController::class, 'leave']);
        });
    });

    // Leaderboard Routes
    Route::prefix('leaderboard')->group(function () {
        Route::get('/', [LeaderboardController::class, 'index']);
        Route::middleware('auth:sanctum')->get('/my-ranking', [LeaderboardController::class, 'myRanking']);
    });

    // Notifications Routes (Protected)
    Route::middleware('auth:sanctum')->prefix('notifications')->group(function () {
        Route::get('/', [NotificationController::class, 'index']);
        Route::patch('/{id}/read', [NotificationController::class, 'markRead']);
        Route::patch('/mark-all-read', [NotificationController::class, 'markAllRead']);
    });

    // Environmental Issue & Bug Reports Routes (Protected)
    Route::middleware('auth:sanctum')->prefix('reports')->group(function () {
        Route::get('/my-reports', [ReportController::class, 'myReports']);
        Route::post('/', [ReportController::class, 'store']);
    });

    // Admin & Coordinator Moderation Panel Routes
    Route::middleware('auth:sanctum')->prefix('admin')->group(function () {
        Route::get('/dashboard', [AdminController::class, 'dashboard']);
        Route::get('/activities', [AdminController::class, 'activities']);
        Route::patch('/activities/{id}/verify', [AdminController::class, 'verifyActivity']);
        Route::get('/reports', [AdminController::class, 'reports']);
        Route::patch('/reports/{id}/resolve', [AdminController::class, 'resolveReport']);
        Route::put('/goals/monthly', [GoalController::class, 'updateMonthlyGoal']);
        Route::post('/notifications/broadcast', [AdminController::class, 'broadcastNotification']);
        Route::get('/users', [AdminController::class, 'users']);
        Route::put('/users/{id}/role', [AdminController::class, 'updateUserRole']);
        Route::put('/users/{id}', [AdminController::class, 'updateUser']);
        Route::delete('/users/{id}', [AdminController::class, 'deleteUser']);
        Route::get('/smtp', [AdminController::class, 'getSmtpSettings']);
        Route::put('/smtp', [AdminController::class, 'updateSmtpSettings']);
        Route::post('/smtp/test', [AdminController::class, 'sendTestEmail']);
    });

    // Monthly Community Goals
    Route::get('/goals/monthly', [GoalController::class, 'monthlyGoal']);

    Route::get('/locations/explore', [MapController::class, 'exploreStats']);
});
