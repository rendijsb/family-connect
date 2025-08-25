<?php

declare(strict_types=1);

namespace App\Events\Chat;

use App\Models\Users\User;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class UserTyping implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public User $user,
        public int $chatRoomId,
        public bool $isTyping = true
    ) {}

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel("chat-room.{$this->chatRoomId}"),
        ];
    }

    public function broadcastAs(): string
    {
        return 'user.typing';
    }

    public function broadcastWith(): array
    {
        return [
            'userId' => $this->user->id,
            'userName' => $this->user->name,
            'chatRoomId' => $this->chatRoomId,
            'isTyping' => $this->isTyping,
        ];
    }
}
