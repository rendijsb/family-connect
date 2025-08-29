<?php

declare(strict_types=1);

namespace App\Models\Chat;

use App\Models\Users\User;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ChatRoomMember extends Model
{
    public const TABLE = 'chat_room_members';
    protected $table = self::TABLE;

    public const ID = 'id';
    public const CHAT_ROOM_ID = 'chat_room_id';
    public const USER_ID = 'user_id';
    public const IS_ADMIN = 'is_admin';
    public const IS_MUTED = 'is_muted';
    public const LAST_READ_AT = 'last_read_at';
    public const UNREAD_COUNT = 'unread_count';
    public const MUTED_UNTIL = 'muted_until';
    public const CREATED_AT = 'created_at';
    public const UPDATED_AT = 'updated_at';

    protected $fillable = [
        self::CHAT_ROOM_ID,
        self::USER_ID,
        self::IS_ADMIN,
        self::IS_MUTED,
        self::LAST_READ_AT,
        self::UNREAD_COUNT,
        self::MUTED_UNTIL,
    ];

    protected $casts = [
        self::IS_ADMIN => 'boolean',
        self::IS_MUTED => 'boolean',
        self::LAST_READ_AT => 'datetime',
        self::UNREAD_COUNT => 'integer',
        self::MUTED_UNTIL => 'datetime',
        self::CREATED_AT => 'datetime',
        self::UPDATED_AT => 'datetime',
    ];

    /** Relations */
    /** @see ChatRoomMember::chatRoomRelation() */
    public const CHAT_ROOM_RELATION = 'chatRoomRelation';
    /** @see ChatRoomMember::userRelation() */
    public const USER_RELATION = 'userRelation';

    public function chatRoomRelation(): BelongsTo
    {
        return $this->belongsTo(ChatRoom::class);
    }

    public function userRelation(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function relatedChatRoom(): ChatRoom
    {
        return $this->{self::CHAT_ROOM_RELATION}();
    }

    public function relatedUser(): User
    {
        return $this->{self::USER_RELATION};
    }

    // Helper methods
    public function markAsRead(): void
    {
        $this->update([
            self::LAST_READ_AT => now(),
            self::UNREAD_COUNT => 0,
        ]);
    }

    public function incrementUnreadCount(): void
    {
        $this->increment(self::UNREAD_COUNT);
    }

    public function mute(?int $minutes = null): void
    {
        $this->update([
            self::IS_MUTED => true,
            self::MUTED_UNTIL => $minutes ? now()->addMinutes($minutes) : null,
        ]);
    }

    public function unmute(): void
    {
        $this->update([
            self::IS_MUTED => false,
            self::MUTED_UNTIL => null,
        ]);
    }

    public function makeAdmin(): void
    {
        $this->update([self::IS_ADMIN => true]);
    }

    public function removeAdmin(): void
    {
        $this->update([self::IS_ADMIN => false]);
    }

    public function isMutedNow(): bool
    {
        if (!$this->is_muted) {
            return false;
        }

        if ($this->muted_until && $this->muted_until->isPast()) {
            $this->unmute();
            return false;
        }

        return true;
    }

    public function hasUnreadMessages(): bool
    {
        return $this->unread_count > 0;
    }

    public function getTimeUntilUnmute(): ?int
    {
        if (!$this->is_muted || !$this->muted_until) {
            return null;
        }

        return $this->muted_until->diffInMinutes(now());
    }

    public function getUnreadCount(): int
    {
        return $this->getAttribute(self::UNREAD_COUNT);
    }

    public function getId(): int
    {
        return $this->getAttribute(self::ID);
    }

    public function getIsAdmin(): bool
    {
        return $this->getAttribute(self::IS_ADMIN);
    }

    public function getIsMuted(): bool
    {
        return $this->getAttribute(self::IS_MUTED);
    }

    public function getChatRoomId(): int
    {
        return $this->getAttribute(self::CHAT_ROOM_ID);
    }

    public function getUserId(): int
    {
        return $this->getAttribute(self::USER_ID);
    }

    public function getLastReadAt(): ?Carbon
    {
        return $this->getAttribute(self::LAST_READ_AT);
    }

    public function getMutedUntil(): ?Carbon
    {
        return $this->getAttribute(self::UNREAD_COUNT);
    }

    public function getCreatedAt(): ?Carbon
    {
        return $this->getAttribute(self::CREATED_AT);
    }
}
