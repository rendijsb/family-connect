<?php

declare(strict_types=1);

namespace App\Http\Routes\Api\Chat;

use App\Contracts\Http\Routes\RouteContract;
use App\Http\Controllers\Chat\ChatRoomController;
use App\Http\Controllers\Chat\ChatMessageController;
use App\Http\Controllers\Chat\MessageReactionController;
use Illuminate\Support\Facades\Route;

class ChatRoutes implements RouteContract
{
    public static function api(): void
    {
        Route::prefix('families/{family_slug}/chat')->middleware(['auth:sanctum', 'family.access'])->group(function () {
            Route::get('/rooms', [ChatRoomController::class, 'index']);
            Route::post('/rooms', [ChatRoomController::class, 'store']);
            Route::post('/rooms/direct', [ChatRoomController::class, 'findOrCreateDirectMessage']);
            Route::get('/rooms/{room}', [ChatRoomController::class, 'show']);
            Route::put('/rooms/{room}', [ChatRoomController::class, 'update']);
            Route::delete('/rooms/{room}', [ChatRoomController::class, 'destroy']);

            Route::get('/rooms/{room}/messages', [ChatMessageController::class, 'index']);
            Route::post('/rooms/{room}/messages', [ChatMessageController::class, 'store']);
            Route::put('/messages/{message}', [ChatMessageController::class, 'update']);
            Route::delete('/messages/{message}', [ChatMessageController::class, 'destroy']);

            Route::post('/messages/{message}/reactions', [MessageReactionController::class, 'store']);
            Route::delete('/messages/{message}/reactions/{emoji}', [MessageReactionController::class, 'destroy']);

            Route::post('/rooms/{room}/read', [ChatRoomController::class, 'markAsRead']);
            Route::post('/rooms/{room}/typing', [ChatRoomController::class, 'typing']);
        });
    }
}
