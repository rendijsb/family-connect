<?php

declare(strict_types=1);

namespace App\Http\Resources\Chat;

use App\Http\Resources\Users\UserResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ChatRoomResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $user = $request->user();
        
        return [
            'id' => $this->id,
            'familyId' => $this->family_id,
            'name' => $this->name,
            'type' => $this->type->value,
            'description' => $this->description,
            'createdBy' => $this->created_by,
            'isPrivate' => $this->is_private,
            'isArchived' => $this->is_archived,
            'settings' => $this->settings,
            'lastMessageAt' => $this->last_message_at?->toISOString(),
            'createdAt' => $this->created_at->toISOString(),
            'updatedAt' => $this->updated_at->toISOString(),

            // Computed fields
            'memberCount' => $this->whenLoaded('members', fn() => $this->members->count()),
            'unreadCount' => $this->when($user, fn() => $this->getUnreadCount($user)),
            'isCurrentUserAdmin' => $this->when($user, fn() => $this->isAdmin($user)),
            'isCurrentUserMuted' => $this->when($user, fn() => $this->isMuted($user)),

            // Relations
            'creator' => $this->whenLoaded('creator', fn() => new UserResource($this->creator)),
            'lastMessage' => $this->whenLoaded('lastMessage', fn() => new ChatMessageResource($this->lastMessage)),
            'members' => $this->whenLoaded('members', fn() => ChatRoomMemberResource::collection($this->members)),
        ];
    }
}
