<?php

declare(strict_types=1);

namespace App\Http\Resources\Chat;

use App\Http\Resources\Users\UserResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ChatMessageResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'chatRoomId' => $this->chat_room_id,
            'userId' => $this->user_id,
            'replyToId' => $this->reply_to_id,
            'message' => $this->getFormattedMessage(),
            'type' => $this->type->value,
            'attachments' => $this->attachments,
            'metadata' => $this->metadata,
            'isEdited' => $this->is_edited,
            'isDeleted' => $this->is_deleted,
            'editedAt' => $this->edited_at?->toISOString(),
            'deletedAt' => $this->deleted_at?->toISOString(),
            'createdAt' => $this->created_at->toISOString(),
            'updatedAt' => $this->updated_at->toISOString(),

            // Computed fields
            'canEdit' => $this->when($request->user(), fn() => $this->canEdit($request->user())),
            'canDelete' => $this->when($request->user(), fn() => $this->canDelete($request->user())),
            'reactionCounts' => $this->whenLoaded('reactions', fn() => $this->getReactionCounts()),
            'userReactions' => $this->when($request->user() && $this->relationLoaded('reactions'), 
                fn() => $this->reactions->where('user_id', $request->user()->id)->pluck('emoji')->toArray()
            ),

            // Relations
            'user' => $this->whenLoaded('user', fn() => new UserResource($this->user)),
            'replyTo' => $this->whenLoaded('replyTo', fn() => new self($this->replyTo)),
            'reactions' => $this->whenLoaded('reactions', fn() => MessageReactionResource::collection($this->reactions)),
        ];
    }
}
