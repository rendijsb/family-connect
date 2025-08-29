<?php

use App\Http\Controllers\Web\HomeController;
use Illuminate\Support\Facades\Route;

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
