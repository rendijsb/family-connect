<?php

declare(strict_types=1);

namespace App\Http\Resources\Chat;

use App\Http\Resources\Users\UserResource;
use App\Models\Chat\ChatMessage;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ChatMessageResource extends JsonResource
{
    /** @var ChatMessage */
    public $resource;

    public function toArray(Request $request): array
    {
        return [
            'id' => $this->resource->getId(),
            'chatRoomId' => $this->resource->getChatRoomId(),
            'userId' => $this->resource->getUserId(),
            'replyToId' => $this->resource->getReplyToId(),
            'message' => $this->resource->getFormattedMessage(),
            'type' => $this->resource->getType()->value,
            'attachments' => $this->resource->getAttachments(),
            'metadata' => $this->resource->getMetadata(),
            'isEdited' => $this->resource->getIsEdited(),
            'isDeleted' => $this->resource->getIsDeleted(),
            'editedAt' => $this->resource->getEditedAt()?->toISOString(),
            'deletedAt' => $this->resource->getDeletedAt()?->toISOString(),
            'createdAt' => $this->resource->getCreatedAt()->toISOString(),
            'updatedAt' => $this->resource->getUpdatedAt()->toISOString(),

            // Computed fields
            'canEdit' => $this->when($request->user(), fn() => $this->resource->canEdit($request->user())),
            'canDelete' => $this->when($request->user(), fn() => $this->resource->canDelete($request->user())),
            'reactionCounts' => $this->whenLoaded('reactions', fn() => $this->resource->getReactionCounts()),
            'userReactions' => $this->when($request->user() && $this->resource->relationLoaded('reactions'),
                fn() => $this->resource->relatedReactions()->where('user_id', $request->user()->getId())->pluck('emoji')->toArray()
            ),

            // Relations
            'user' => $this->whenLoaded('user', fn() => new UserResource($this->resource->relatedUser())),
            'replyTo' => $this->whenLoaded('replyTo', fn() => new self($this->resource->relatedReplyTo())),
            'reactions' => $this->whenLoaded('reactions', fn() => MessageReactionResource::collection($this->resource->relatedReactions())),
        ];
    }
}
