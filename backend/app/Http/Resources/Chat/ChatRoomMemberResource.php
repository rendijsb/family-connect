<?php

declare(strict_types=1);

namespace App\Http\Resources\Chat;

use App\Http\Resources\Users\UserResource;
use App\Models\Chat\ChatRoomMember;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ChatRoomMemberResource extends JsonResource
{
    /** @var ChatRoomMember */
    public $resource;

    public function toArray(Request $request): array
    {
        return [
            'id' => $this->resource->getId(),
            'chatRoomId' => $this->resource->getChatRoomId(),
            'userId' => $this->resource->getUserId(),
            'isAdmin' => $this->resource->getIsAdmin(),
            'isMuted' => $this->resource->isMutedNow(),
            'lastReadAt' => $this->resource->getLastReadAt()?->toISOString(),
            'unreadCount' => $this->resource->getUnreadCount(),
            'mutedUntil' => $this->resource->getMutedUntil()?->toISOString(),
            'joinedAt' => $this->resource->getCreatedAt()->toISOString(),

            // Computed fields
            'timeUntilUnmute' => $this->when($this->resource->getIsMuted(), fn() => $this->resource->getTimeUntilUnmute()),
            'hasUnreadMessages' => $this->resource->hasUnreadMessages(),

            // Relations
            'user' => $this->whenLoaded('user', fn() => new UserResource($this->resource->relatedUser())),
        ];
    }
}
