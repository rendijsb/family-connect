<?php

declare(strict_types=1);

namespace App\Models\Chat;

use App\Enums\Chat\ChatRoomTypeEnum;
use App\Models\Families\Family;
use App\Models\Users\User;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Support\Collection;

/**
 * @mixin Builder
 */
class ChatRoom extends Model
{
    public const TABLE = 'chat_rooms';
    protected $table = self::TABLE;

    public const ID = 'id';
    public const FAMILY_ID = 'family_id';
    public const NAME = 'name';
    public const TYPE = 'type';
    public const DESCRIPTION = 'description';
    public const CREATED_BY = 'created_by';
    public const IS_PRIVATE = 'is_private';
    public const IS_ARCHIVED = 'is_archived';
    public const SETTINGS = 'settings';
    public const LAST_MESSAGE_AT = 'last_message_at';
    public const LAST_MESSAGE_ID = 'last_message_id';
    public const CREATED_AT = 'created_at';
    public const UPDATED_AT = 'updated_at';

    protected $fillable = [
        self::FAMILY_ID,
        self::NAME,
        self::TYPE,
        self::DESCRIPTION,
        self::CREATED_BY,
        self::IS_PRIVATE,
        self::IS_ARCHIVED,
        self::SETTINGS,
        self::LAST_MESSAGE_AT,
        self::LAST_MESSAGE_ID,
    ];

    protected $casts = [
        self::TYPE => ChatRoomTypeEnum::class,
        self::IS_PRIVATE => 'boolean',
        self::IS_ARCHIVED => 'boolean',
        self::SETTINGS => 'array',
        self::LAST_MESSAGE_AT => 'datetime',
        self::CREATED_AT => 'datetime',
        self::UPDATED_AT => 'datetime',
    ];

    /** Relations */
    /** @see ChatRoom::membersRelation() */
    public const MEMBERS_RELATION = 'membersRelation';
    /** @see ChatRoom::familyRelation() */
    public const FAMILY_RELATION = 'familyRelation';
    /** @see ChatRoom::creatorRelation() */
    public const CREATOR_RELATION = 'creatorRelation';
    /** @see ChatRoom::messagesRelation() */
    public const MESSAGES_RELATION = 'messagesRelation';
    /** @see ChatRoom::lastMessageRelation() */
    public const LAST_MESSAGE_RELATION = 'lastMessageRelation';

    public function familyRelation(): BelongsTo
    {
        return $this->belongsTo(Family::class);
    }

    public function creatorRelation(): BelongsTo
    {
        return $this->belongsTo(User::class, self::CREATED_BY);
    }

    public function messagesRelation(): HasMany
    {
        return $this->hasMany(ChatMessage::class);
    }

    public function membersRelation(): HasMany
    {
        return $this->hasMany(ChatRoomMember::class);
    }

    public function relatedFamily(): Family
    {
        return $this->{self::MEMBERS_RELATION};
    }

    /** @return Collection<ChatRoomMember> */
    public function relatedMembers(): Collection
    {
        return $this->{self::MEMBERS_RELATION};
    }

    public function relatedCreator(): User
    {
        return $this->{self::CREATOR_RELATION};
    }

    /** @return Collection<ChatMessage> */
    public function relatedMessages(): Collection
    {
        return $this->{self::MESSAGES_RELATION};
    }

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, ChatRoomMember::TABLE)
            ->withPivot([
                ChatRoomMember::IS_ADMIN,
                ChatRoomMember::IS_MUTED,
                ChatRoomMember::LAST_READ_AT,
                ChatRoomMember::UNREAD_COUNT,
                ChatRoomMember::MUTED_UNTIL,
                ChatRoomMember::CREATED_AT,
                ChatRoomMember::UPDATED_AT,
            ])
            ->withTimestamps();
    }

    public function lastMessageRelation(): BelongsTo
    {
        return $this->belongsTo(ChatMessage::class, self::LAST_MESSAGE_ID);
    }

    public function relatedLastMessage(): ChatMessage
    {
        return $this->{self::LAST_MESSAGE_RELATION};
    }

    // Custom methods
    public static function findDirectMessageRoom(int $familyId, int $userId1, int $userId2): ?self
    {
        return self::query()
            ->where(self::FAMILY_ID, $familyId)
            ->where(self::TYPE, ChatRoomTypeEnum::DIRECT)
            ->whereHas(self::MEMBERS_RELATION, function ($query) use ($userId1) {
                $query->where(ChatRoomMember::USER_ID, $userId1);
            })
            ->whereHas(self::MEMBERS_RELATION, function ($query) use ($userId2) {
                $query->where(ChatRoomMember::USER_ID, $userId2);
            })
            ->first();
    }

    // Scopes
    public function scopeForFamily($query, int $familyId)
    {
        return $query->where('family_id', $familyId);
    }

    public function scopeActive($query)
    {
        return $query->where('is_archived', false);
    }

    public function scopePublic($query)
    {
        return $query->where('is_private', false);
    }

    public function scopePrivate($query)
    {
        return $query->where('is_private', true);
    }

    public function scopeByType($query, ChatRoomTypeEnum $type)
    {
        return $query->where('type', $type);
    }

    // Helper methods
    public function isAdmin(User $user): bool
    {
        return $this->relatedMembers()
            ->contains(function ($member) use ($user) {
                return $member->getUserId() === $user->getId() && $member->getIsAdmin();
            });
    }

    public function isMember(User $user): bool
    {
        return $this->relatedMembers()
            ->contains(ChatRoomMember::USER_ID, $user->getId());
    }

    public function isMuted(User $user): bool
    {
        /** @var ChatRoomMember $member */
        $member = $this->relatedMembers()->where(ChatRoomMember::USER_ID, $user->getId())->first();

        if (!$member) {
            return false;
        }

        if (!$member->getIsMuted()) {
            return false;
        }

        if ($member->getIsMuted() && $member->muted_until->isPast()) {
            $member->update([ChatRoomMember::IS_MUTED => false, ChatRoomMember::MUTED_UNTIL => null]);
            return false;
        }

        return true;
    }

    public function getUnreadCount(User $user): int
    {
        /** @var ChatRoomMember $member */
        $member = $this->relatedMembers()->where(ChatRoomMember::USER_ID, $user->getId())->first();

        return $member ? $member->getUnreadCount() : 0;
    }

    public function addMember(User $user, bool $isAdmin = false): ChatRoomMember
    {
        return $this->membersRelation()->create([
            ChatRoomMember::USER_ID => $user->getId(),
            ChatRoomMember::IS_ADMIN => $isAdmin,
        ]);
    }

    public function removeMember(User $user): bool
    {
        return $this->membersRelation()  // ← Use relation, not collection
            ->where(ChatRoomMember::USER_ID, $user->getId())
                ->delete() > 0;
    }

    public function markAsRead(User $user): void
    {
        $this->membersRelation()  // ← Use relation, not collection
        ->where(ChatRoomMember::USER_ID, $user->getId())
            ->update([
                ChatRoomMember::LAST_READ_AT => now(),
                ChatRoomMember::UNREAD_COUNT => 0,
            ]);
    }

    public function updateLastMessageAt(): void
    {
        $this->update([self::LAST_MESSAGE_AT => now()]);
    }

    public function toggleMemberAdmin(User $user): bool
    {
        $member = $this->membersRelation()
        ->where(ChatRoomMember::USER_ID, $user->getId())
            ->first();
        if (!$member) {
            return false;
        }

        $member->update([ChatRoomMember::IS_ADMIN => !$member->getIsAdmin()]);
        return true;
    }

    public function canUserManage(User $user): bool
    {
        if ($this->getCreatedBy() === $user->getId()) {
            return true;
        }

        return $this->isAdmin($user);
    }

    public function getCreatedBy(): int
    {
        return $this->getAttribute(self::CREATED_BY);
    }

    public function getFamilyId(): int
    {
        return $this->getAttribute(self::FAMILY_ID);
    }

    public function getId(): int
    {
        return $this->getAttribute(self::ID);
    }

    public function getSettings(): ?array
    {
        return $this->getAttribute(self::SETTINGS);
    }

    public function getIsPrivate(): bool
    {
        return $this->getAttribute(self::IS_PRIVATE);
    }

    public function getIsArchived(): ?bool
    {
        return $this->getAttribute(self::IS_ARCHIVED);
    }

    public function getCreatedAt(): ?Carbon
    {
        return $this->getAttribute(self::CREATED_AT);
    }

    public function getUpdatedAt(): ?Carbon
    {
        return $this->getAttribute(self::UPDATED_AT);
    }

    public function getLastMessageAt(): ?Carbon
    {
        return $this->getAttribute(self::LAST_MESSAGE_AT);
    }

    public function getDescription(): ?string
    {
        return $this->getAttribute(self::DESCRIPTION);
    }

    public function getType(): ChatRoomTypeEnum
    {
        return $this->getAttribute(self::TYPE);
    }

    public function getName(): string
    {
        return $this->getAttribute(self::NAME);
    }
}
