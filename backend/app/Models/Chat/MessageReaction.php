<?php

declare(strict_types=1);

namespace App\Models\Chat;

use App\Models\Users\User;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MessageReaction extends Model
{
    public const TABLE = 'message_reactions';
    protected $table = self::TABLE;

    public const ID = 'id';
    public const MESSAGE_ID = 'message_id';
    public const USER_ID = 'user_id';
    public const EMOJI = 'emoji';
    public const COUNT = 'count';
    public const CREATED_AT = 'created_at';
    public const UPDATED_AT = 'updated_at';

    protected $fillable = [
        self::MESSAGE_ID,
        self::USER_ID,
        self::EMOJI,
    ];

    protected $casts = [
        self::CREATED_AT => 'datetime',
        self::UPDATED_AT => 'datetime',
    ];

    /** Relations */
    /** @see MessageReaction::messageRelation() */
    public const MESSAGE_RELATION = 'messageRelation';
    /** @see MessageReaction::userRelation() */
    public const USER_RELATION = 'userRelation';

    public function messageRelation(): BelongsTo
    {
        return $this->belongsTo(ChatMessage::class, self::MESSAGE_ID);
    }

    public function userRelation(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function relatedMessage(): ChatMessage
    {
        return $this->{self::MESSAGE_RELATION};
    }

    public function relatedUser(): User
    {
        return $this->{self::USER_RELATION};
    }

    public function scopeForMessage($query, int $messageId)
    {
        return $query->where('message_id', $messageId);
    }

    public function scopeByUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function scopeByEmoji($query, string $emoji)
    {
        return $query->where('emoji', $emoji);
    }

    // Helper methods
    public static function getPopularEmojis(): array
    {
        return [
            '👍', '❤️', '😂', '😊', '😢', '😮', '😡', '👏', '🙏', '🔥',
            '💯', '👌', '✨', '💜', '🎉', '😍', '🤔', '😘', '👀', '💪'
        ];
    }

    public static function getEmojiCounts(int $messageId): array
    {
        return self::forMessage($messageId)
            ->selectRaw('emoji, COUNT(*) as count')
            ->groupBy(self::EMOJI)
            ->orderByDesc(self::COUNT)
            ->pluck(self::COUNT, self::EMOJI)
            ->toArray();
    }

    public static function getUserReactions(int $messageId, int $userId): array
    {
        return self::forMessage($messageId)
            ->byUser($userId)
            ->pluck(self::EMOJI)
            ->toArray();
    }

    public function getMessageId(): int
    {
        return $this->getAttribute(self::MESSAGE_ID);
    }

    public function getId(): int
    {
        return $this->getAttribute(self::ID);
    }

    public function getEmoji(): string
    {
        return $this->getAttribute(self::EMOJI);
    }

    public function getCreatedAt(): ?Carbon
    {
        return $this->getAttribute(self::CREATED_AT);
    }

    public function getUserId(): int
    {
        return $this->getAttribute(self::USER_ID);
    }
}
