<?php

declare(strict_types=1);

namespace App\Http\Resources\Chat;

use App\Http\Resources\Users\UserResource;
use App\Models\Chat\MessageReaction;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MessageReactionResource extends JsonResource
{
    /** @var MessageReaction */
    public $resource;

    public function toArray(Request $request): array
    {
        return [
            'id' => $this->resource->getId(),
            'messageId' => $this->resource->getMessageId(),
            'userId' => $this->resource->getUserId(),
            'emoji' => $this->resource->getEmoji(),
            'createdAt' => $this->resource->getCreatedAt()->toISOString(),

            // Relations
            'user' => $this->whenLoaded('user', fn() => new UserResource($this->resource->relatedUser())),
        ];
    }
}
