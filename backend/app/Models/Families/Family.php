<?php

declare(strict_types=1);

namespace App\Models\Families;

use App\Enums\Families\FamilyPrivacyLevelEnum;
use App\Models\Families\Invitations\FamilyInvitation;
use App\Models\Families\Members\FamilyMember;
use App\Models\Users\User;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @mixin Builder
 */
class Family extends Model
{
    public const TABLE = 'family';
    protected $table = self::TABLE;

    public const ID = 'id';
    public const NAME = 'name';
    public const DESCRIPTION = 'description';
    public const AVATAR = 'avatar';
    public const OWNER_ID = 'owner_id';
    public const PRIVACY_LEVEL = 'privacy_level';
    public const SETTINGS = 'settings';
    public const CREATED_AT = 'created_at';
    public const UPDATED_AT = 'updated_at';

    protected $fillable = [
        self::NAME,
        self::DESCRIPTION,
        self::AVATAR,
        self::OWNER_ID,
        self::PRIVACY_LEVEL,
        self::SETTINGS,
    ];

    protected $casts = [
        self::OWNER_ID => 'integer',
        self::PRIVACY_LEVEL => FamilyPrivacyLevelEnum::class,
        self::SETTINGS => 'array',
    ];

    /** Relations */
    /** @see Family::ownerRelation() */
    const OWNER_RELATION = 'ownerRelation';
    /** @see Family::membersRelation() */
    const MEMBERS_RELATION = 'membersRelation';
    /** @see Family::invitationsRelation() */
    const INVITATIONS_RELATION = 'invitationsRelation';

    public function ownerRelation(): BelongsTo
    {
        return $this->belongsTo(User::class, self::OWNER_ID, User::ID);
    }

    public function membersRelation(): HasMany
    {
        return $this->hasMany(FamilyMember::class, FamilyMember::FAMILY_ID, self::ID);
    }

    public function invitationsRelation(): HasMany
    {
        return $this->hasMany(FamilyInvitation::class, FamilyInvitation::FAMILY_ID, self::ID);
    }

    // Getters
    public function getId(): int
    {
        return $this->getAttribute(self::ID);
    }

    public function getName(): string
    {
        return $this->getAttribute(self::NAME);
    }

    public function getDescription(): ?string
    {
        return $this->getAttribute(self::DESCRIPTION);
    }

    public function getAvatar(): ?string
    {
        return $this->getAttribute(self::AVATAR);
    }

    public function getOwnerId(): int
    {
        return $this->getAttribute(self::OWNER_ID);
    }

    public function getPrivacyLevel(): FamilyPrivacyLevelEnum
    {
        return $this->getAttribute(self::PRIVACY_LEVEL);
    }

    public function getSettings(): ?array
    {
        return $this->getAttribute(self::SETTINGS);
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
    public function relatedOwner(): User
    {
        return $this->{self::OWNER_RELATION};
    }

    /** @return Collection<FamilyMember> */
    public function relatedMembers(): Collection
    {
        return $this->{self::MEMBERS_RELATION};
    }

    /** @return Collection<FamilyInvitation> */
    public function relatedInvitations(): Collection
    {
        return $this->{self::INVITATIONS_RELATION};
    }

    // Utility methods
    public function getMemberCount(): int
    {
        return $this->membersRelation()->where(FamilyMember::STATUS, 'active')->count();
    }

    public function isOwner(int $userId): bool
    {
        return $this->getOwnerId() === $userId;
    }

    public function hasMember(int $userId): bool
    {
        return $this->membersRelation()
            ->where(FamilyMember::USER_ID, $userId)
            ->where(FamilyMember::STATUS, 'active')
            ->exists();
    }
}
