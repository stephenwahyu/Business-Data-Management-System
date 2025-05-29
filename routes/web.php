<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\PlaceController;
use App\Http\Controllers\MapController;
use App\Http\Controllers\HistoryController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\ProfileController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Redirect root to dashboard
Route::redirect('/', '/dashboard');

// Guest routes (only accessible when not logged in)
Route::middleware(['guest'])->group(function () {
    Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
    Route::post('/login', [AuthController::class, 'login']);
});

// Protected routes (only accessible when logged in)
Route::middleware(['auth'])->group(function () {
    // Auth - logout
    Route::post('/logout', [AuthController::class, 'logout'])->name('logout');
    
    // Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    
    // Profile routes
    Route::prefix('settings')->name('profile.')->controller(ProfileController::class)->group(function () {
        Route::get('/profile', 'edit')->name('edit');
        Route::patch('/profile', 'update')->name('update');
        Route::get('/password', 'editPassword')->name('password.edit');
        Route::put('/password', 'updatePassword')->name('password.update');
    });

    // Settings - appearance
    Route::get('/settings/appearance', function () {
        return Inertia::render('settings/appearance');
    })->name('settings.appearance');
    
    // Redirect /settings to appearance by default
    Route::redirect('/settings', '/settings/appearance');
    
    // Places routes - ETL implementation
    Route::middleware(['role:1'])->group(function () {
        Route::controller(PlaceController::class)->group(function () {
            Route::get('/places', 'index')->name('places.index');
            Route::post('/places', 'store')->name('places.store');
            Route::put('/places/{id}', 'update')->name('places.update');
            Route::get('/places/history/{placeId}', 'history')->name('places.history');
            Route::post('/places/check-exists', 'checkExists')->name('places.check-exists');
            Route::get('/places/export', 'export')->name('places.export');
        });

    // Global History routes - all historical records
    Route::get('/places/history', [HistoryController::class, 'index'])->name('history.index');
    });
    
    Route::redirect('/places/{placeId}', '/places');
    
    // Map routes
    Route::get('/map', [MapController::class, 'index'])->name('map.index');
    
    // User management routes - restricted to admin role (role_id = 1)
    Route::middleware(['role:1'])->group(function () {
        Route::controller(UserController::class)->group(function () {
            Route::get('/users', 'index')->name('users.index');
            Route::post('/users', 'store')->name('users.store');
            Route::put('/users/{user}', 'update')->name('users.update');
            Route::delete('/users/{user}', 'destroy')->name('users.destroy');
        });
    });
});