<?php

declare(strict_types=1);

namespace App\Models\Families;

use App\Enums\Families\FamilyPrivacyEnum;
use App\Models\Users\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Collection;

/**
 * @mixin Builder
 */
class Family extends Model
{
    public const TABLE = 'families';
    protected $table = self::TABLE;

    public const ID = 'id';
    public const NAME = 'name';
    public const SLUG = 'slug';
    public const DESCRIPTION = 'description';
    public const OWNER_ID = 'owner_id';
    public const PRIVACY = 'privacy';
    public const JOIN_CODE = 'join_code';
    public const SETTINGS = 'settings';
    public const TIMEZONE = 'timezone';
    public const LANGUAGE = 'language';
    public const MAX_MEMBERS = 'max_members';
    public const IS_ACTIVE = 'is_active';
    public const LAST_ACTIVITY_AT = 'last_activity_at';
    public const CREATED_AT = 'created_at';
    public const UPDATED_AT = 'updated_at';

    protected $fillable = [
        self::NAME,
        self::SLUG,
        self::DESCRIPTION,
        self::OWNER_ID,
        self::PRIVACY,
        self::JOIN_CODE,
        self::SETTINGS,
        self::TIMEZONE,
        self::LANGUAGE,
        self::MAX_MEMBERS,
        self::IS_ACTIVE,
    ];

    protected $casts = [
        self::SETTINGS => 'array',
        self::IS_ACTIVE => 'boolean',
        self::LAST_ACTIVITY_AT => 'datetime',
        self::PRIVACY => FamilyPrivacyEnum::class,
        self::CREATED_AT => 'datetime',
        self::UPDATED_AT => 'datetime',
    ];

    /** Relations */
    /** @see Family::ownerRelation() */
    const OWNER_RELATION = 'ownerRelation';
    /** @see Family::membersRelation() */
    const MEMBERS_RELATION = 'membersRelation';

    public function ownerRelation(): BelongsTo
    {
        return $this->belongsTo(User::class, self::OWNER_ID, User::ID);
    }

    public function membersRelation(): HasMany
    {
        return $this->hasMany(FamilyMember::class, FamilyMember::FAMILY_ID, self::ID);
    }

    public function relatedOwner(): User
    {
        return $this->{self::OWNER_RELATION};
    }

    /** @return Collection<FamilyMember> */
    public function relatedMembers(): Collection
    {
        return $this->{self::MEMBERS_RELATION};
    }

    public function getId(): int
    {
        return $this->getAttribute(self::ID);
    }

    public function getName(): string
    {
        return $this->getAttribute(self::NAME);
    }

    public function getSlug(): string
    {
        return $this->getAttribute(self::SLUG);
    }

    public function getDescription(): ?string
    {
        return $this->getAttribute(self::DESCRIPTION);
    }

    public function getOwnerId(): int
    {
        return $this->getAttribute(self::OWNER_ID);
    }

    public function getPrivacy(): FamilyPrivacyEnum
    {
        return $this->getAttribute(self::PRIVACY);
    }

    public function getJoinCode(): ?string
    {
        return $this->getAttribute(self::JOIN_CODE);
    }

    public function getSettings(): array
    {
        return $this->getAttribute(self::SETTINGS) ?? [];
    }

    public function getTimezone(): ?string
    {
        return $this->getAttribute(self::TIMEZONE);
    }

    public function getLanguage(): ?string
    {
        return $this->getAttribute(self::LANGUAGE);
    }

    public function getMaxMembers(): ?int
    {
        return $this->getAttribute(self::MAX_MEMBERS);
    }

    public function getIsActive(): ?bool
    {
        return $this->getAttribute(self::IS_ACTIVE);
    }

    public function getLastActivityAt(): ?\DateTime
    {
        return $this->getAttribute(self::LAST_ACTIVITY_AT);
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
