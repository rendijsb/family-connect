<?php

declare(strict_types=1);

namespace App\Models\Chat;

use App\Enums\Chat\MessageTypeEnum;
use App\Models\Users\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class ChatMessage extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'chat_room_id',
        'user_id',
        'reply_to_id',
        'message',
        'type',
        'attachments',
        'metadata',
        'is_edited',
        'is_deleted',
        'edited_at',
        'deleted_at',
    ];

    protected $casts = [
        'type' => MessageTypeEnum::class,
        'attachments' => 'array',
        'metadata' => 'array',
        'is_edited' => 'boolean',
        'is_deleted' => 'boolean',
        'edited_at' => 'datetime',
        'deleted_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    protected $dates = ['deleted_at'];

    public function chatRoom(): BelongsTo
    {
        return $this->belongsTo(ChatRoom::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function replyTo(): BelongsTo
    {
        return $this->belongsTo(ChatMessage::class, 'reply_to_id');
    }

    public function replies(): HasMany
    {
        return $this->hasMany(ChatMessage::class, 'reply_to_id');
    }

    public function reactions(): HasMany
    {
        return $this->hasMany(MessageReaction::class, 'message_id');
    }

    // Scopes
    public function scopeForRoom($query, int $roomId)
    {
        return $query->where('chat_room_id', $roomId);
    }

    public function scopeByUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function scopeByType($query, MessageTypeEnum $type)
    {
        return $query->where('type', $type);
    }

    public function scopeNotDeleted($query)
    {
        return $query->where('is_deleted', false);
    }

    public function scopeRecent($query, int $hours = 24)
    {
        return $query->where('created_at', '>=', now()->subHours($hours));
    }

    public function scopeWithReplies($query)
    {
        return $query->with(['replyTo.user', 'replies.user']);
    }

    public function scopeWithReactions($query)
    {
        return $query->with(['reactions.user']);
    }

    // Helper methods
    public function canEdit(User $user): bool
    {
        if ($this->user_id !== $user->id) {
            return false;
        }

        if ($this->is_deleted) {
            return false;
        }

        // Allow editing within 24 hours
        return $this->created_at->diffInHours(now()) < 24;
    }

    public function canDelete(User $user): bool
    {
        // User can delete their own messages
        if ($this->user_id === $user->id) {
            return true;
        }

        // Room admins can delete any message
        return $this->chatRoom->isAdmin($user);
    }

    public function markAsEdited(): void
    {
        $this->update([
            'is_edited' => true,
            'edited_at' => now(),
        ]);
    }

    public function softDelete(): void
    {
        $this->update([
            'is_deleted' => true,
            'deleted_at' => now(),
            'message' => '[This message was deleted]',
            'attachments' => null,
            'metadata' => null,
        ]);
    }

    public function addReaction(User $user, string $emoji): MessageReaction
    {
        return $this->reactions()->updateOrCreate(
            [
                'user_id' => $user->id,
                'emoji' => $emoji,
            ]
        );
    }

    public function removeReaction(User $user, string $emoji): bool
    {
        return $this->reactions()
            ->where('user_id', $user->id)
            ->where('emoji', $emoji)
            ->delete() > 0;
    }

    public function getReactionCounts(): array
    {
        return $this->reactions()
            ->selectRaw('emoji, COUNT(*) as count')
            ->groupBy('emoji')
            ->pluck('count', 'emoji')
            ->toArray();
    }

    public function hasUserReacted(User $user, string $emoji): bool
    {
        return $this->reactions()
            ->where('user_id', $user->id)
            ->where('emoji', $emoji)
            ->exists();
    }

    public function isReply(): bool
    {
        return $this->reply_to_id !== null;
    }

    public function hasAttachments(): bool
    {
        return !empty($this->attachments);
    }

    public function getAttachmentUrls(): array
    {
        if (!$this->hasAttachments()) {
            return [];
        }

        return array_map(function ($attachment) {
            return $attachment['url'] ?? '';
        }, $this->attachments);
    }

    public function getFormattedMessage(): string
    {
        if ($this->is_deleted) {
            return '[This message was deleted]';
        }

        return $this->message;
    }
}
