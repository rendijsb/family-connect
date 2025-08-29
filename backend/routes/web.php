<?php

use App\Http\Controllers\Admin\AppUploadController;
use App\Http\Controllers\Web\HomeController;
use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;  // <-- ADD THIS
use Illuminate\Support\Facades\Auth;  // <-- ADD THIS

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

Route::get('/download/ios', function () {
    $ipaFile = public_path('downloads/family-connect.ipa');

    if (!file_exists($ipaFile)) {
        return redirect()->route('home')->with('error', 'iOS version is not available yet.');
    }

    return response()->download($ipaFile, 'FamilyConnect.ipa', [
        'Content-Type' => 'application/octet-stream',
    ]);
})->name('download.ios');

Route::get('/download/android', function () {
    $apkFile = public_path('downloads/family-connect.apk');

    if (!file_exists($apkFile)) {
        return redirect()->route('home')->with('error', 'Android version is not available yet.');
    }

    return response()->download($apkFile, 'FamilyConnect.apk', [
        'Content-Type' => 'application/vnd.android.package-archive',
    ]);
})->name('download.android');

Route::get('/install/android', function () {
    return view('install.android');
})->name('install.android');

Route::get('/install/ios', function () {
    return view('install.ios');
})->name('install.ios');

// Simple upload route (temporary solution)
Route::get('/upload', function () {
    return view('simple-upload');
})->name('simple.upload');

Route::post('/upload', function (Request $request) {
    $request->validate([
        'file' => 'required|file|max:204800', // 200MB
        'type' => 'required|in:android,ios'
    ]);

    $file = $request->file('file');
    $type = $request->input('type');

    $filename = $type === 'android' ? 'family-connect.apk' : 'family-connect.ipa';
    $destinationPath = public_path('downloads');

    // Create directory if it doesn't exist
    if (!file_exists($destinationPath)) {
        mkdir($destinationPath, 0755, true);
    }

    // Move the file
    $file->move($destinationPath, $filename);

    return back()->with('success', ucfirst($type) . ' file uploaded successfully!');
})->name('simple.upload.post');

// Admin routes (commented out until you create the controller)
Route::middleware(['auth:sanctum', 'role:admin'])->prefix('admin')->group(function () {
    Route::get('/uploads', [AppUploadController::class, 'index'])->name('admin.uploads');
    Route::post('/upload/android', [AppUploadController::class, 'uploadAndroid'])->name('admin.upload.android');
    Route::post('/upload/ios', [AppUploadController::class, 'uploadIOS'])->name('admin.upload.ios');
    Route::delete('/upload/delete/{platform}', [AppUploadController::class, 'deleteFile'])->name('admin.upload.delete');
});

Route::get('/admin/login', function () {
    return view('admin.login');
})->name('admin.login');

// Admin login handler
Route::post('/admin/login', function (Request $request) {
    $credentials = $request->validate([
        'email' => 'required|email',
        'password' => 'required',
    ]);

    if (Auth::attempt($credentials)) {
        $user = Auth::user();

        // Check if user is admin
        if ($user->getRoleId() !== 1) { // 1 = admin role
            Auth::logout();
            return back()->withErrors(['email' => 'Access denied. Admin privileges required.']);
        }

        $request->session()->regenerate();
        return redirect()->route('simple.upload'); // Redirect to simple upload for now
    }

    return back()->withErrors([
        'email' => 'The provided credentials do not match our records.',
    ]);
})->name('admin.login.post');

// Admin logout
Route::post('/admin/logout', function (Request $request) {
    Auth::logout();
    $request->session()->invalidate();
    $request->session()->regenerateToken();
    return redirect()->route('home');
})->name('admin.logout');
