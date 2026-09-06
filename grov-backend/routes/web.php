<?php

use App\Http\Controllers\Web\AdminWebController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return redirect('/admin');
});

// Professional PHP Native Web Admin Suite Routes
Route::prefix('admin')->group(function () {
    Route::get('/', [AdminWebController::class, 'showLogin']);
    Route::post('/login', [AdminWebController::class, 'processLogin']);
    Route::get('/dashboard', [AdminWebController::class, 'dashboard']);

    // User Management CRUD & Roles
    Route::post('/users/create', [AdminWebController::class, 'createUser']);
    Route::post('/users/{id}/role', [AdminWebController::class, 'updateUserRole']);
    Route::post('/users/{id}/reset-password', [AdminWebController::class, 'resetUserPassword']);
    Route::post('/users/{id}/delete', [AdminWebController::class, 'deleteUser']);

    // AQI Control & Google Air Quality API Key Manager
    Route::post('/aqi', [AdminWebController::class, 'updateAqi']);
    Route::post('/google-aqi-key', [AdminWebController::class, 'updateGoogleAqiKey']);

    // Species Catalogue CRUD
    Route::post('/species/create', [AdminWebController::class, 'createSpecies']);
    Route::post('/species/{id}/delete', [AdminWebController::class, 'deleteSpecies']);

    // Community Drives
    Route::post('/drives/create', [AdminWebController::class, 'createDrive']);

    // Activity Verification Queue
    Route::post('/activities/{id}/verify', [AdminWebController::class, 'verifyActivity']);

    // Monthly Goals & Broadcast
    Route::post('/goals', [AdminWebController::class, 'updateGoals']);
    Route::post('/broadcast', [AdminWebController::class, 'broadcastNotification']);

    // Reports Resolution
    Route::post('/reports/{id}/resolve', [AdminWebController::class, 'resolveReport']);

    // Dual-SMTP Settings & HTML Test Email
    Route::post('/smtp/update', [AdminWebController::class, 'updateSmtp']);
    Route::post('/smtp/test', [AdminWebController::class, 'sendTestEmail']);

    Route::get('/logout', [AdminWebController::class, 'logout']);
});
