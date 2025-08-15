<?php

declare(strict_types=1);

namespace App\Models\Families\Members;

use App\Enums\Families\FamilyRoleEnum;
use App\Models\Families\Family;
use App\Models\Users\User;
use Carbon\Carbon;
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
    public const JOINED_AT = 'joined_at';
    public const STATUS = 'status';
    public const PERMISSIONS = 'permissions';
    public const LAST_ACTIVE_AT = 'last_active_at';
    public const CREATED_AT = 'created_at';
    public const UPDATED_AT = 'updated_at';

    protected $fillable = [
        self::FAMILY_ID,
        self::USER_ID,
        self::ROLE,
        self::NICKNAME,
        self::JOINED_AT,
        self::STATUS,
        self::PERMISSIONS,
        self::LAST_ACTIVE_AT,
    ];

    protected $casts = [
        self::FAMILY_ID => 'integer',
        self::USER_ID => 'integer',
        self::ROLE => FamilyRoleEnum::class,
        self::JOINED_AT => 'datetime',
        self::PERMISSIONS => 'array',
        self::LAST_ACTIVE_AT => 'datetime',
    ];

    /** Relations */
    /** @see FamilyMember::familyRelation() */
    const FAMILY_RELATION = 'familyRelation';
    /** @see FamilyMember::userRelation() */
    const USER_RELATION = 'userRelation';

    public function familyRelation(): BelongsTo
    {
        return $this->belongsTo(Family::class, self::FAMILY_ID, Family::ID);
    }

    public function userRelation(): BelongsTo
    {
        return $this->belongsTo(User::class, self::USER_ID, User::ID);
    }

    // Getters
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

    public function getJoinedAt(): Carbon
    {
        return $this->getAttribute(self::JOINED_AT);
    }

    public function getStatus(): string
    {
        return $this->getAttribute(self::STATUS);
    }

    public function getPermissions(): ?array
    {
        return $this->getAttribute(self::PERMISSIONS);
    }

    public function getLastActiveAt(): ?Carbon
    {
        return $this->getAttribute(self::LAST_ACTIVE_AT);
    }

    public function getCreatedAt(): Carbon
    {
        return $this->getAttribute(self::CREATED_AT);
    }

    public function getUpdatedAt(): Carbon
    {
        return $this->getAttribute(self::UPDATED_AT);
    }

    // Related models
    public function relatedFamily(): Family
    {
        return $this->{self::FAMILY_RELATION};
    }

    public function relatedUser(): User
    {
        return $this->{self::USER_RELATION};
    }

    // Utility methods
    public function getDisplayName(): string
    {
        return $this->getNickname() ?: $this->relatedUser()->getName();
    }

    public function isActive(): bool
    {
        return $this->getStatus() === 'active';
    }

    public function isOnline(): bool
    {
        if (!$this->getLastActiveAt()) {
            return false;
        }

        return $this->getLastActiveAt()->gt(now()->subMinutes(5));
    }

    public function canManageMembers(): bool
    {
        return in_array($this->getRole(), [FamilyRoleEnum::OWNER, FamilyRoleEnum::ADMIN]);
    }
}
