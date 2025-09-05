<?php

// Update app/Http/Routes/Api/Chat/ChatRoutes.php

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
            // Chat Room routes
            Route::get('/rooms', [ChatRoomController::class, 'getAll']);
            Route::post('/rooms', [ChatRoomController::class, 'createChatRoom']);
            Route::post('/rooms/direct', [ChatRoomController::class, 'findOrCreateDirectMessage']);
            Route::get('/rooms/{room}', [ChatRoomController::class, 'show']);
            Route::put('/rooms/{room}', [ChatRoomController::class, 'update']);
            Route::delete('/rooms/{room}', [ChatRoomController::class, 'destroy']);

            // Room member management
            Route::post('/rooms/{room}/members', [ChatRoomController::class, 'addMember']);
            Route::delete('/rooms/{room}/members/{member}', [ChatRoomController::class, 'removeMember']);
            Route::post('/rooms/{room}/members/{member}/toggle-admin', [ChatRoomController::class, 'toggleMemberAdmin']);
            Route::post('/rooms/{room}/leave', [ChatRoomController::class, 'leaveRoom']);

            // Message routes
            Route::get('/rooms/{room}/messages', [ChatMessageController::class, 'index']);
            Route::post('/rooms/{room}/messages', [ChatMessageController::class, 'store']);
            Route::put('/messages/{message}', [ChatMessageController::class, 'update']);
            Route::delete('/messages/{message}', [ChatMessageController::class, 'destroy']);

            // Reaction routes
            Route::post('/messages/{message}/reactions', [MessageReactionController::class, 'store']);
            Route::delete('/messages/{message}/reactions/{emoji}', [MessageReactionController::class, 'destroy']);

            // Room utilities
            Route::post('/rooms/{room}/read', [ChatRoomController::class, 'markAsRead']);
            Route::post('/rooms/{room}/typing', [ChatRoomController::class, 'typing']);
        });
    }
}
