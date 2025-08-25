<?php

declare(strict_types=1);

namespace App\Http\Resources\Chat;

use App\Http\Resources\Users\UserResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ChatRoomMemberResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'chatRoomId' => $this->chat_room_id,
            'userId' => $this->user_id,
            'isAdmin' => $this->is_admin,
            'isMuted' => $this->isMutedNow(),
            'lastReadAt' => $this->last_read_at?->toISOString(),
            'unreadCount' => $this->unread_count,
            'mutedUntil' => $this->muted_until?->toISOString(),
            'joinedAt' => $this->created_at->toISOString(),

            // Computed fields
            'timeUntilUnmute' => $this->when($this->is_muted, fn() => $this->getTimeUntilUnmute()),
            'hasUnreadMessages' => $this->hasUnreadMessages(),

            // Relations
            'user' => $this->whenLoaded('user', fn() => new UserResource($this->user)),
        ];
    }
}
