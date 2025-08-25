<?php

declare(strict_types=1);

namespace App\Http\Resources\Chat;

use App\Http\Resources\Users\UserResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MessageReactionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'messageId' => $this->message_id,
            'userId' => $this->user_id,
            'emoji' => $this->emoji,
            'createdAt' => $this->created_at->toISOString(),

            // Relations
            'user' => $this->whenLoaded('user', fn() => new UserResource($this->user)),
        ];
    }
}
