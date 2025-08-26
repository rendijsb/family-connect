<?php

use App\Models\Chat\ChatRoom;
use App\Models\Families\FamilyMember;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Log;

/*
|--------------------------------------------------------------------------
| Broadcast Channels
|--------------------------------------------------------------------------
|
| Here you may register all of the event broadcasting channels that your
| application supports. The given channel authorization callbacks are
| used to check if an authenticated user can listen to the channel.
|
*/

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

// Chat room channels - Use the BroadcastController for authorization
Broadcast::channel('chat-room.{roomId}', function ($user, $roomId) {
    try {
        Log::info('Channel authorization attempt', [
            'user_id' => $user->id,
            'room_id' => $roomId,
            'channel' => "chat-room.{$roomId}"
        ]);

        // Find the chat room
        $chatRoom = ChatRoom::find($roomId);

        if (!$chatRoom) {
            Log::warning('Chat room not found for channel authorization', [
                'user_id' => $user->id,
                'room_id' => $roomId
            ]);
            return false;
        }

        // Check if user is a member of the family that owns this room
        $familyMember = FamilyMember::where('family_id', $chatRoom->family_id)
            ->where('user_id', $user->id)
            ->where('is_active', true)
            ->first();

        if (!$familyMember) {
            Log::warning('User is not a family member for chat room', [
                'user_id' => $user->id,
                'room_id' => $roomId,
                'family_id' => $chatRoom->family_id
            ]);
            return false;
        }

        // Check if user is a member of the chat room
        $isMember = $chatRoom->isMember($user);

        if (!$isMember) {
            Log::warning('User is not a member of chat room', [
                'user_id' => $user->id,
                'room_id' => $roomId
            ]);
            return false;
        }

        Log::info('Channel authorization successful', [
            'user_id' => $user->id,
            'room_id' => $roomId,
            'user_name' => $user->name
        ]);

        // Return user data for presence information
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
        ];

    } catch (\Exception $e) {
        Log::error('Channel authorization error', [
            'user_id' => $user->id ?? 'unknown',
            'room_id' => $roomId,
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ]);

        return false;
    }
});

// Family presence channel
Broadcast::channel('family.{familyId}', function ($user, $familyId) {
    try {
        Log::info('Family channel authorization attempt', [
            'user_id' => $user->id,
            'family_id' => $familyId
        ]);

        // Check if user is a member of this family
        $familyMember = FamilyMember::where('family_id', $familyId)
            ->where('user_id', $user->id)
            ->where('is_active', true)
            ->first();

        if (!$familyMember) {
            Log::warning('User is not a family member', [
                'user_id' => $user->id,
                'family_id' => $familyId
            ]);
            return false;
        }

        Log::info('Family channel authorization successful', [
            'user_id' => $user->id,
            'family_id' => $familyId,
            'role' => $familyMember->role
        ]);

        return [
            'id' => $user->id,
            'name' => $user->name,
            'role' => $familyMember->role,
        ];

    } catch (\Exception $e) {
        Log::error('Family channel authorization error', [
            'user_id' => $user->id ?? 'unknown',
            'family_id' => $familyId,
            'error' => $e->getMessage()
        ]);

        return false;
    }
});
