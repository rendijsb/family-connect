<?php

declare(strict_types=1);

namespace App\Http\Resources\Chat;

use App\Http\Resources\Users\UserResource;
use App\Models\Chat\ChatRoom;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ChatRoomResource extends JsonResource
{
    /** @var ChatRoom */
    public $resource;

    public function toArray(Request $request): array
    {
        $user = $request->user();

        return [
            'id' => $this->resource->getId(),
            'familyId' => $this->resource->getFamilyId(),
            'name' => $this->resource->getName(),
            'type' => $this->resource->getType()->value,
            'description' => $this->resource->getDescription(),
            'createdBy' => $this->resource->getCreatedBy(),
            'isPrivate' => $this->resource->getIsPrivate(),
            'isArchived' => $this->resource->getIsArchived(),
            'settings' => $this->resource->getSettings(),
            'lastMessageAt' => $this->resource->getLastMessageAt()?->toISOString(),
            'createdAt' => $this->resource->getCreatedAt()->toISOString(),
            'updatedAt' => $this->resource->getUpdatedAt()->toISOString(),

            // Computed fields
            'memberCount' => $this->whenLoaded('members', fn() => $this->resource->relatedMembers()->count()),
            'unreadCount' => $this->when($user, fn() => $this->resource->getUnreadCount($user)),
            'isCurrentUserAdmin' => $this->when($user, fn() => $this->resource->isAdmin($user)),
            'isCurrentUserMuted' => $this->when($user, fn() => $this->resource->isMuted($user)),

            // Relations
            'creator' => $this->whenLoaded('creator', fn() => new UserResource($this->resource->relatedCreator())),
            'lastMessage' => $this->whenLoaded('lastMessage', fn() => new ChatMessageResource($this->resource->relatedLastMessage())),
            'members' => $this->whenLoaded('members', fn() => ChatRoomMemberResource::collection($this->resource->relatedMembers())),
        ];
    }
}
