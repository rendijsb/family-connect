<?php

declare(strict_types=1);

namespace App\Events\Chat;

use App\Http\Resources\Chat\MessageReactionResource;
use App\Models\Chat\MessageReaction;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ReactionAdded implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public MessageReaction $reaction
    ) {
        $this->reaction->load([
            'user:id,name,email',
            'message'
        ]);
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel("chat-room.{$this->reaction->message->chat_room_id}"),
        ];
    }

    public function broadcastAs(): string
    {
        return 'reaction.added';
    }

    public function broadcastWith(): array
    {
        return [
            'reaction' => new MessageReactionResource($this->reaction),
            'messageId' => $this->reaction->message_id,
        ];
    }
}
