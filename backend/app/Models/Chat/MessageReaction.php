<?php

declare(strict_types=1);

namespace App\Models\Chat;

use App\Models\Users\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MessageReaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'message_id',
        'user_id',
        'emoji',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function message(): BelongsTo
    {
        return $this->belongsTo(ChatMessage::class, 'message_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // Scopes
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
            ->groupBy('emoji')
            ->orderByDesc('count')
            ->pluck('count', 'emoji')
            ->toArray();
    }

    public static function getUserReactions(int $messageId, int $userId): array
    {
        return self::forMessage($messageId)
            ->byUser($userId)
            ->pluck('emoji')
            ->toArray();
    }
}
