<?php

use App\Models\Chat\ChatRoom;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

// Chat room channels
Broadcast::channel('chat-room.{roomId}', function ($user, $roomId) {
    $chatRoom = ChatRoom::find($roomId);
    
    if (!$chatRoom) {
        return false;
    }
    
    // Check if user is a member of the chat room
    return $chatRoom->isMember($user);
});
