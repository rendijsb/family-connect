<?php

use Illuminate\Support\Facades\Route;

Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'service' => 'websocket',
        'timestamp' => now()->toISOString(),
        'reverb_config' => [
            'app_id' => config('reverb.apps.apps.0.id'),
            'key' => config('reverb.apps.apps.0.key'),
        ]
    ]);
});
