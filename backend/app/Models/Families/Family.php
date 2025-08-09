<?php

declare(strict_types=1);

namespace App\Models\Families;

use App\Models\Users\User;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

/**
 * @mixin Builder
 */
class Family extends Model
{
    use HasFactory, SoftDeletes;

    public const TABLE = 'families';
    protected $table = self::TABLE;

    public const ID = 'id';
    public const NAME = 'name';
    public const DESCRIPTION = 'description';
    public const OWNER_ID = 'owner_id';
    public const SETTINGS = 'settings';
    public const INVITE_CODE = 'invite_code';
    public const IS_ACTIVE = 'is_active';
    public const ARCHIVED_AT = 'archived_at';
    public const CREATED_AT = 'created_at';
    public const UPDATED_AT = 'updated_at';
    public const DELETED_AT = 'deleted_at';

    protected $fillable = [
        self::NAME,
        self::DESCRIPTION,
        self::OWNER_ID,
        self::SETTINGS,
        self::INVITE_CODE,
        self::IS_ACTIVE,
        self::ARCHIVED_AT,
    ];

    protected $casts = [
        self::SETTINGS => 'array',
        self::IS_ACTIVE => 'boolean',
        self::ARCHIVED_AT => 'datetime',
        self::CREATED_AT => 'datetime',
        self::UPDATED_AT => 'datetime',
        self::DELETED_AT => 'datetime',
    ];

    /** Relations */
    /** @see Family::ownerRelation() */
    const OWNER_RELATION = 'ownerRelation';
    /** @see Family::membersRelation() */
    const MEMBERS_RELATION = 'membersRelation';
    /** @see Family::invitationsRelation() */
    const INVITATIONS_RELATION = 'invitationsRelation';
    /** @see Family::activitiesRelation() */
    const ACTIVITIES_RELATION = 'activitiesRelation';

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

    public function activitiesRelation(): HasMany
    {
        return $this->hasMany(FamilyActivity::class, FamilyActivity::FAMILY_ID, self::ID);
    }

    /** Scopes */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where(self::IS_ACTIVE, true);
    }

    public function scopeOwnedBy(Builder $query, int $userId): Builder
    {
        return $query->where(self::OWNER_ID, $userId);
    }

    public function scopeWithActiveMembers(Builder $query): Builder
    {
        return $query->with([
            self::MEMBERS_RELATION => function ($query) {
                $query->where(FamilyMember::STATUS, 'active');
            }
        ]);
    }

    /** Boot methods */
    protected static function boot(): void
    {
        parent::boot();

        static::creating(function (Family $family) {
            if (empty($family->getAttribute(self::INVITE_CODE))) {
                $family->setAttribute(self::INVITE_CODE, $family->generateInviteCode());
            }
        });

        static::created(function (Family $family) {
            // Automatically add the owner as a family member
            $family->addMember($family->getOwnerId(), 'owner');

            // Log activity
            $family->logActivity(
                $family->getOwnerId(),
                'family_created',
                'Family created',
                "Family '{$family->getName()}' was created"
            );
        });
    }

    /** Getters */
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

    public function getOwnerId(): int
    {
        return $this->getAttribute(self::OWNER_ID);
    }

    public function getSettings(): array
    {
        return $this->getAttribute(self::SETTINGS) ?? [];
    }

    public function getInviteCode(): ?string
    {
        return $this->getAttribute(self::INVITE_CODE);
    }

    public function getIsActive(): bool
    {
        return $this->getAttribute(self::IS_ACTIVE);
    }

    public function getArchivedAt(): ?Carbon
    {
        return $this->getAttribute(self::ARCHIVED_AT);
    }

    public function getCreatedAt(): Carbon
    {
        return $this->getAttribute(self::CREATED_AT);
    }

    public function getUpdatedAt(): Carbon
    {
        return $this->getAttribute(self::UPDATED_AT);
    }

    /** Related models */
    public function relatedOwner(): User
    {
        return $this->{self::OWNER_RELATION};
    }

    public function relatedMembers(): Collection
    {
        return $this->{self::MEMBERS_RELATION};
    }

    public function relatedInvitations(): Collection
    {
        return $this->{self::INVITATIONS_RELATION};
    }

    public function relatedActivities(): Collection
    {
        return $this->{self::ACTIVITIES_RELATION};
    }

    /** Business methods */
    public function addMember(int $userId, string $role = 'member'): FamilyMember
    {
        return $this->membersRelation()->create([
            FamilyMember::USER_ID => $userId,
            FamilyMember::ROLE => $role,
            FamilyMember::STATUS => 'active',
            FamilyMember::JOINED_AT => now(),
        ]);
    }

    public function removeMember(int $userId): bool
    {
        return $this->membersRelation()
                ->where(FamilyMember::USER_ID, $userId)
                ->delete() > 0;
    }

    public function isMember(int $userId): bool
    {
        return $this->membersRelation()
            ->where(FamilyMember::USER_ID, $userId)
            ->where(FamilyMember::STATUS, 'active')
            ->exists();
    }

    public function isOwner(int $userId): bool
    {
        return $this->getOwnerId() === $userId;
    }

    public function canManage(int $userId): bool
    {
        if ($this->isOwner($userId)) {
            return true;
        }

        $member = $this->membersRelation()
            ->where(FamilyMember::USER_ID, $userId)
            ->where(FamilyMember::STATUS, 'active')
            ->first();

        return $member && in_array($member->getRole(), ['owner', 'admin']);
    }

    public function getMemberCount(): int
    {
        return $this->membersRelation()
            ->where(FamilyMember::STATUS, 'active')
            ->count();
    }

    public function getActiveMembersCount(): int
    {
        return $this->membersRelation()
            ->where(FamilyMember::STATUS, 'active')
            ->whereNotNull(FamilyMember::LAST_ACTIVITY_AT)
            ->where(FamilyMember::LAST_ACTIVITY_AT, '>=', now()->subDays(7))
            ->count();
    }

    public function inviteMember(string $email, int $invitedBy, string $role = 'member'): FamilyInvitation
    {
        return $this->invitationsRelation()->create([
            FamilyInvitation::EMAIL => $email,
            FamilyInvitation::INVITED_BY => $invitedBy,
            FamilyInvitation::ROLE => $role,
            FamilyInvitation::TOKEN => Str::random(64),
            FamilyInvitation::STATUS => 'pending',
            FamilyInvitation::EXPIRES_AT => now()->addDays(7),
        ]);
    }

    public function logActivity(int $userId, string $type, string $title, string $description = null, array $metadata = null): FamilyActivity
    {
        return $this->activitiesRelation()->create([
            FamilyActivity::USER_ID => $userId,
            FamilyActivity::TYPE => $type,
            FamilyActivity::TITLE => $title,
            FamilyActivity::DESCRIPTION => $description,
            FamilyActivity::METADATA => $metadata,
        ]);
    }

    public function generateInviteCode(): string
    {
        do {
            $code = strtoupper(Str::random(8));
        } while (self::where(self::INVITE_CODE, $code)->exists());

        return $code;
    }

    public function regenerateInviteCode(): string
    {
        $newCode = $this->generateInviteCode();
        $this->update([self::INVITE_CODE => $newCode]);
        return $newCode;
    }

    public function updateSettings(array $settings): bool
    {
        $currentSettings = $this->getSettings();
        $newSettings = array_merge($currentSettings, $settings);

        return $this->update([self::SETTINGS => $newSettings]);
    }

    public function archive(): bool
    {
        return $this->update([
            self::IS_ACTIVE => false,
            self::ARCHIVED_AT => now(),
        ]);
    }

    public function restore(): bool
    {
        return $this->update([
            self::IS_ACTIVE => true,
            self::ARCHIVED_AT => null,
        ]);
    }
}
