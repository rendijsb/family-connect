<?php

declare(strict_types=1);

namespace App\Events\Chat;

use App\Http\Resources\Chat\ChatMessageResource;
use App\Models\Chat\ChatMessage;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MessageUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public ChatMessage $message
    ) {
        $this->message->load([
            'user:id,name,email',
            'replyTo.user:id,name,email',
            'reactions.user:id,name,email'
        ]);
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel("chat-room.{$this->message->chat_room_id}"),
        ];
    }

    public function broadcastAs(): string
    {
        return 'message.updated';
    }

    public function broadcastWith(): array
    {
        return [
            'message' => new ChatMessageResource($this->message),
        ];
    }
}
