<?php

declare(strict_types=1);

namespace App\Events\Chat;

use App\Http\Resources\Chat\ChatMessageResource;
use App\Models\Chat\ChatMessage;
use App\Models\Chat\ChatRoomMember;
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

class MessageUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public ChatMessage $message
    ) {
        $this->message->load([
            ChatMessage::USER_RELATION . ':' . User::ID . ',' . User::NAME . ',' . User::EMAIL,
            ChatMessage::REPLY_TO_RELATION . '.' . ChatMessage::USER_RELATION . ':' . User::ID . ',' . User::NAME . ',' . User::EMAIL,
            ChatMessage::REACTIONS_RELATION . '.' . MessageReaction::USER_RELATION . ':' . User::ID . ',' . User::NAME . ',' . User::EMAIL,
        ]);
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel("chat-room.{$this->message->getChatRoomId()}"),
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

    public function shouldQueue(): bool
    {
        return false;
    }
}
