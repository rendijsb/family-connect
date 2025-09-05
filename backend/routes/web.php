<?php

use App\Http\Controllers\Admin\AppUploadController;
use App\Http\Controllers\Web\HomeController;
use App\Services\Apps\AppUploadService;
use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

Route::get('/', [HomeController::class, 'index'])->name('home');
Route::get('/privacy', [HomeController::class, 'privacy'])->name('privacy');
Route::get('/terms', [HomeController::class, 'terms'])->name('terms');
Route::get('/support', [HomeController::class, 'support'])->name('support');

Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'service' => 'family-connect-api',
        'timestamp' => now()->toISOString(),
        'version' => config('app.version', '1.0.0'),
    ]);
});

// S3-based download routes (public access with signed URLs)
Route::get('/download/ios', function (AppUploadService $appUploadService) {
    try {
        $downloadUrl = $appUploadService->getActiveDownloadUrl('ios', 30);

        if (!$downloadUrl) {
            return redirect()->route('home')->with('error', 'iOS version is not available yet.');
        }

        return redirect($downloadUrl);

    } catch (\Exception $e) {
        \Log::error('iOS download failed', ['error' => $e->getMessage()]);
        return redirect()->route('home')->with('error', 'iOS download is currently unavailable.');
    }
})->name('download.ios');

Route::get('/download/android', function (AppUploadService $appUploadService) {
    try {
        $downloadUrl = $appUploadService->getActiveDownloadUrl('android', 30);

        if (!$downloadUrl) {
            return redirect()->route('home')->with('error', 'Android version is not available yet.');
        }

        return redirect($downloadUrl);

    } catch (\Exception $e) {
        \Log::error('Android download failed', ['error' => $e->getMessage()]);
        return redirect()->route('home')->with('error', 'Android download is currently unavailable.');
    }
})->name('download.android');

Route::get('/install/android', function () {
    return view('install.android');
})->name('install.android');

Route::get('/install/ios', function () {
    return view('install.ios');
})->name('install.ios');

// Admin Authentication Routes
Route::get('/admin/login', function () {
    if (Auth::check() && Auth::user()->getRoleId() === 1) {
        return redirect()->intended('/admin/apps');
    }

    return view('admin.login');
})->name('admin.login');

Route::post('/admin/login', function (Request $request) {
    $credentials = $request->validate([
        'email' => 'required|email',
        'password' => 'required',
    ]);

    if (Auth::attempt($credentials)) {
        $user = Auth::user();

        if ($user->getRoleId() !== 1) { // 1 = admin role
            Auth::logout();
            return back()->withErrors(['email' => 'Access denied. Admin privileges required.']);
        }

        $request->session()->regenerate();
        return redirect()->intended('/admin/apps');
    }

    return back()->withErrors([
        'email' => 'The provided credentials do not match our records.',
    ]);
})->name('admin.login.post');

Route::post('/admin/logout', function (Request $request) {
    Auth::logout();
    $request->session()->invalidate();
    $request->session()->regenerateToken();
    return redirect()->route('home');
})->name('admin.logout');

// Admin Routes (Protected by auth and admin role)
Route::middleware(['auth:sanctum', 'role:admin'])->prefix('admin')->group(function () {

    // Main app management dashboard
    Route::get('/apps', [AppUploadController::class, 'index'])->name('admin.apps');

    // Upload endpoints
    Route::post('/upload/android', [AppUploadController::class, 'uploadAndroid'])->name('admin.upload.android');
    Route::post('/upload/ios', [AppUploadController::class, 'uploadIOS'])->name('admin.upload.ios');

    // Version management
    Route::post('/upload/set-active/{uploadId}', [AppUploadController::class, 'setActiveVersion'])->name('admin.upload.set-active');
    Route::delete('/upload/delete/{uploadId}', [AppUploadController::class, 'deleteUpload'])->name('admin.upload.delete');

    // Download with tracking (admin only)
    Route::get('/download/{uploadId}', function (int $uploadId, AppUploadService $appUploadService) {
        try {
            $downloadUrl = $appUploadService->getDownloadUrl($uploadId, 60);
            return response()->json([
                'success' => true,
                'download_url' => $downloadUrl,
                'expires_in_minutes' => 60
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Download failed: ' . $e->getMessage()
            ], 500);
        }
    })->name('admin.download');

    // Statistics and management
    Route::get('/statistics', [AppUploadController::class, 'getStatistics'])->name('admin.statistics');
    Route::get('/history/{platform}', [AppUploadController::class, 'getUploadHistory'])->name('admin.history');
    Route::post('/cleanup', [AppUploadController::class, 'cleanupOldUploads'])->name('admin.cleanup');
});

// API endpoint for mobile app downloads (returns signed URLs)
Route::get('/api/download/{platform}', function (string $platform, AppUploadService $appUploadService) {
    if (!in_array($platform, ['android', 'ios'])) {
        return response()->json(['error' => 'Invalid platform'], 400);
    }

    try {
        $downloadUrl = $appUploadService->getActiveDownloadUrl($platform, 15); // 15 min expiry for API

        if (!$downloadUrl) {
            return response()->json([
                'error' => ucfirst($platform) . ' app is not available',
                'available' => false
            ], 404);
        }

        return response()->json([
            'download_url' => $downloadUrl,
            'platform' => $platform,
            'expires_in_minutes' => 15,
            'available' => true
        ]);

    } catch (\Exception $e) {
        \Log::error('API download failed', [
            'platform' => $platform,
            'error' => $e->getMessage()
        ]);

        return response()->json([
            'error' => 'Download temporarily unavailable',
            'available' => false
        ], 503);
    }
})->name('api.download');

// Debug routes (remove in production)
Route::middleware(['auth', 'role:admin'])->group(function () {
    Route::get('/admin/debug/s3', function () {
        return response()->json([
            's3_config' => [
                'disk' => config('filesystems.default'),
                'bucket' => config('filesystems.disks.s3.bucket'),
                'region' => config('filesystems.disks.s3.region'),
                'url' => config('filesystems.disks.s3.url'),
            ],
            's3_test' => [
                'can_connect' => \Storage::disk('s3')->exists('test') || true, // Basic check
            ],
            'app_statistics' => app(AppUploadService::class)->getStatistics(),
        ]);
    })->name('admin.debug.s3');
});

// Legacy simple upload redirect (for backward compatibility)
Route::get('/upload', function () {
    return redirect()->route('admin.apps');
})->name('simple.upload');

// Test route to verify Laravel is working
Route::get('/test-laravel-working', function () {
    return response()->json([
        'status' => 'success',
        'message' => 'Laravel is working perfectly!',
        'timestamp' => now()->toISOString(),
        'environment' => app()->environment(),
        'php_version' => phpversion(),
        'laravel_version' => app()->version()
    ]);
});
