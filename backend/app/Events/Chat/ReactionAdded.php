<?php

declare(strict_types=1);

namespace App\Events\Chat;

use App\Http\Resources\Chat\MessageReactionResource;
use App\Models\Chat\MessageReaction;
use App\Models\Users\User;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ReactionAdded implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public MessageReaction $reaction
    ) {
        $this->reaction->load([
            MessageReaction::USER_RELATION . ':' . User::ID . ',' . User::NAME . ',' . User::EMAIL,
            MessageReaction::MESSAGE_RELATION,
        ]);
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel("chat-room.{$this->reaction->relatedMessage()->getChatRoomId()}"),
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
            'messageId' => $this->reaction->getMessageId(),
        ];
    }

    public function shouldQueue(): bool
    {
        return false;
    }
}
