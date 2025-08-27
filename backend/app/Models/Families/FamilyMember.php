<?php

declare(strict_types=1);

namespace App\Models\Families;

use App\Enums\Families\FamilyRoleEnum;
use App\Models\Users\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @mixin Builder
 */
class FamilyMember extends Model
{
    public const TABLE = 'family_members';
    protected $table = self::TABLE;

    public const ID = 'id';
    public const FAMILY_ID = 'family_id';
    public const USER_ID = 'user_id';
    public const ROLE = 'role';
    public const NICKNAME = 'nickname';
    public const RELATIONSHIP = 'relationship';
    public const PERMISSIONS = 'permissions';
    public const NOTIFICATIONS_ENABLED = 'notifications_enabled';
    public const IS_ACTIVE = 'is_active';
    public const JOINED_AT = 'joined_at';
    public const LAST_SEEN_AT = 'last_seen_at';
    public const CREATED_AT = 'created_at';
    public const UPDATED_AT = 'updated_at';

    protected $fillable = [
        self::FAMILY_ID,
        self::USER_ID,
        self::ROLE,
        self::NICKNAME,
        self::RELATIONSHIP,
        self::PERMISSIONS,
        self::NOTIFICATIONS_ENABLED,
        self::IS_ACTIVE,
        self::JOINED_AT,
        self::LAST_SEEN_AT,
    ];

    protected $casts = [
        self::ROLE => FamilyRoleEnum::class,
        self::PERMISSIONS => 'array',
        self::NOTIFICATIONS_ENABLED => 'boolean',
        self::IS_ACTIVE => 'boolean',
        self::JOINED_AT => 'datetime',
        self::LAST_SEEN_AT => 'datetime',
        self::CREATED_AT => 'datetime',
        self::UPDATED_AT => 'datetime',
    ];

    /** Relations */
    /** @see FamilyMember::userRelation() */
    const USER_RELATION = 'userRelation';
    /** @see FamilyMember::familyRelation() */
    const FAMILY_RELATION = 'familyRelation';

    /**
     * Get the user that belongs to this family member.
     */
    public function userRelation(): BelongsTo
    {
        return $this->belongsTo(User::class, self::USER_ID, User::ID);
    }

    /**
     * Get the family that this member belongs to.
     */
    public function familyRelation(): BelongsTo
    {
        return $this->belongsTo(Family::class, self::FAMILY_ID, Family::ID);
    }

    public function relatedUser(): User
    {
        return $this->{self::USER_RELATION};
    }

    public function relatedFamily(): Family
    {
        return $this->{self::FAMILY_RELATION};
    }

    public function getId(): int
    {
        return $this->getAttribute(self::ID);
    }

    public function getFamilyId(): int
    {
        return $this->getAttribute(self::FAMILY_ID);
    }

    public function getUserId(): int
    {
        return $this->getAttribute(self::USER_ID);
    }

    public function getRole(): FamilyRoleEnum
    {
        return $this->getAttribute(self::ROLE);
    }

    public function getNickname(): ?string
    {
        return $this->getAttribute(self::NICKNAME);
    }

    public function getRelationship(): ?string
    {
        return $this->getAttribute(self::RELATIONSHIP);
    }

    public function getPermissions(): array
    {
        return $this->getAttribute(self::PERMISSIONS) ?? [];
    }

    public function getNotificationsEnabled(): bool
    {
        return $this->getAttribute(self::NOTIFICATIONS_ENABLED);
    }

    public function getIsActive(): bool
    {
        return $this->getAttribute(self::IS_ACTIVE);
    }

    public function getJoinedAt(): ?\DateTime
    {
        return $this->getAttribute(self::JOINED_AT);
    }

    public function getLastSeenAt(): ?\DateTime
    {
        return $this->getAttribute(self::LAST_SEEN_AT);
    }

    public function getCreatedAt(): \DateTime
    {
        return $this->getAttribute(self::CREATED_AT);
    }

    public function getUpdatedAt(): \DateTime
    {
        return $this->getAttribute(self::UPDATED_AT);
    }
}
