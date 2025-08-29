<?php

declare(strict_types=1);

namespace App\Models\Chat;

use App\Enums\Chat\ChatRoomTypeEnum;
use App\Enums\Chat\MessageTypeEnum;
use App\Models\Users\User;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Collection;

/**
 * @mixin Builder
 */
class ChatMessage extends Model
{
    use SoftDeletes;

    public const TABLE = 'chat_messages';
    protected $table = self::TABLE;

    public const ID = 'id';
    public const CHAT_ROOM_ID = 'chat_room_id';
    public const USER_ID = 'user_id';
    public const REPLY_TO_ID = 'reply_to_id';
    public const MESSAGE = 'message';
    public const TYPE = 'type';
    public const ATTACHMENTS = 'attachments';
    public const METADATA = 'metadata';
    public const IS_EDITED = 'is_edited';
    public const IS_DELETED = 'is_deleted';
    public const EDITED_AT = 'edited_at';
    public const DELETED_AT = 'deleted_at';
    public const CREATED_AT = 'created_at';
    public const UPDATED_AT = 'updated_at';

    protected $fillable = [
        self::CHAT_ROOM_ID,
        self::USER_ID,
        self::REPLY_TO_ID,
        self::MESSAGE,
        self::TYPE,
        self::ATTACHMENTS,
        self::METADATA,
        self::IS_EDITED,
        self::IS_DELETED,
        self::EDITED_AT,
        self::DELETED_AT,
    ];

    protected $casts = [
        self::TYPE => MessageTypeEnum::class,
        self::ATTACHMENTS => 'array',
        self::METADATA => 'array',
        self::IS_EDITED => 'boolean',
        self::IS_DELETED => 'boolean',
        self::EDITED_AT => 'datetime',
        self::DELETED_AT => 'datetime',
        self::CREATED_AT => 'datetime',
        self::UPDATED_AT => 'datetime',
    ];

    protected $dates = [self::DELETED_AT];

    /** Relations */
    /** @see ChatMessage::chatRoomRelation() */
    public const CHAT_ROOM_RELATION = 'chatRoomRelation';
    /** @see ChatMessage::userRelation() */
    public const USER_RELATION = 'userRelation';
    /** @see ChatMessage::replyToRelation() */
    public const REPLY_TO_RELATION = 'replyToRelation';
    /** @see ChatMessage::repliesRelation() */
    public const REPLIES_RELATION = 'repliesRelation';
    /** @see ChatMessage::reactionsRelation() */
    public const REACTIONS_RELATION = 'reactionsRelation';

    public function chatRoomRelation(): BelongsTo
    {
        return $this->belongsTo(ChatRoom::class);
    }

    public function userRelation(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function replyToRelation(): BelongsTo
    {
        return $this->belongsTo(ChatMessage::class, self::REPLY_TO_ID);
    }

    public function repliesRelation(): HasMany
    {
        return $this->hasMany(ChatMessage::class, self::REPLY_TO_ID);
    }

    public function reactionsRelation(): HasMany
    {
        return $this->hasMany(MessageReaction::class, MessageReaction::MESSAGE_ID);
    }

    public function relatedChatRoom(): ChatRoom
    {
        return $this->{self::CHAT_ROOM_RELATION};
    }

    public function relatedUser(): User
    {
        return $this->{self::USER_RELATION};
    }

    public function relatedReplyTo(): ChatMessage
    {
        return $this->{self::REPLY_TO_RELATION};
    }

    /** @return Collection<ChatMessage> */
    public function relatedReplies(): Collection
    {
        return $this->{self::REPLIES_RELATION};
    }

    /** @return Collection<MessageReaction> */
    public function relatedReactions(): Collection
    {
        return $this->{self::REACTIONS_RELATION};
    }

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
        return $query->with(['replyToRelation.userRelation', 'repliesRelation.userRelation']);
    }

    public function scopeWithReactions($query)
    {
        return $query->with(['reactionsRelation.userRelation']);
    }


    // Helper methods
    public function canEdit(User $user): bool
    {
        if ($this->getUserId() !== $user->getId()) {
            return false;
        }

        if ($this->getIsDeleted()) {
            return false;
        }

        return $this->getCreatedAt()->diffInHours(now()) < 24;
    }

    public function canDelete(User $user): bool
    {
        if ($this->getUserId() === $user->getId()) {
            return true;
        }

        return $this->relatedChatRoom()->isAdmin($user);
    }

    public function markAsEdited(): void
    {
        $this->update([
            self::IS_EDITED => true,
            self::EDITED_AT => now(),
        ]);
    }

    public function softDelete(): void
    {
        $this->update([
            self::IS_DELETED => true,
            self::DELETED_AT => now(),
            self::MESSAGE => '[This message was deleted]',
            self::ATTACHMENTS => null,
            self::METADATA => null,
        ]);
    }

    public function addReaction(User $user, string $emoji): MessageReaction
    {
        /** @var MessageReaction */
        return $this->reactionsRelation()->updateOrCreate([
            MessageReaction::USER_ID => $user->getId(),
            MessageReaction::EMOJI => $emoji,
        ]);
    }

    public function removeReaction(User $user, string $emoji): bool
    {
        return $this->reactionsRelation()
            ->where(MessageReaction::USER_ID, $user->getId())
                ->where(MessageReaction::EMOJI, $emoji)
                ->delete() > 0;
    }

    public function getReactionCounts(): array
    {
        if ($this->relationLoaded('reactionsRelation')) {
            return $this->relatedReactions()
                ->groupBy('emoji')
                ->map->count()
                ->toArray();
        }

        return $this->reactionsRelation()
            ->selectRaw('emoji, COUNT(*) as count')
            ->groupBy('emoji')
            ->pluck('count', 'emoji')
            ->toArray();
    }

    public function hasUserReacted(User $user, string $emoji): bool
    {
        return $this->reactionsRelation()
        ->where(MessageReaction::USER_ID, $user->getId())
            ->where(MessageReaction::EMOJI, $emoji)
            ->exists();
    }

    public function isReply(): bool
    {
        return $this->getReplyToId() !== null;
    }

    public function hasAttachments(): bool
    {
        return !empty($this->getAttachments());
    }

    public function getAttachmentUrls(): array
    {
        if (!$this->hasAttachments()) {
            return [];
        }

        return array_map(function ($attachment) {
            return $attachment['url'] ?? '';
        }, $this->getAttachments());
    }

    public function getFormattedMessage(): string
    {
        if ($this->getIsDeleted()) {
            return '[This message was deleted]';
        }

        return $this->getMessage();
    }

    public function getUserId(): int
    {
        return $this->getAttribute(self::USER_ID);
    }

    public function getReplyToId(): ?int
    {
        return $this->getAttribute(self::REPLY_TO_ID);
    }

    public function getAttachments(): ?array
    {
        return $this->getAttribute(self::ATTACHMENTS);
    }

    public function getMessage(): string
    {
        return $this->getAttribute(self::MESSAGE);
    }

    public function getIsDeleted(): bool
    {
        $isDeleted = $this->getAttribute(self::IS_DELETED);
        return (bool)($isDeleted ?? false);
    }

    public function getCreatedAt(): Carbon
    {
        return $this->getAttribute(self::CREATED_AT);
    }

    public function getChatRoomId(): int
    {
        return $this->getAttribute(self::CHAT_ROOM_ID);
    }

    public function getId(): int
    {
        return $this->getAttribute(self::ID);
    }

    public function getType(): MessageTypeEnum
    {
        return $this->getAttribute(self::TYPE);
    }

    public function getUpdatedAt(): ?Carbon
    {
        return $this->getAttribute(self::UPDATED_AT);
    }

    public function getEditedAt(): ?Carbon
    {
        return $this->getAttribute(self::EDITED_AT);
    }

    public function getDeletedAt(): ?Carbon
    {
        return $this->getAttribute(self::DELETED_AT);
    }

    public function getMetadata(): ?array
    {
        return $this->getAttribute(self::METADATA);
    }

    public function getIsEdited(): ?bool
    {
        return $this->getAttribute(self::IS_EDITED);
    }
}
