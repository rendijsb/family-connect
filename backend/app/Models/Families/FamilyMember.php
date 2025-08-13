<?php

declare(strict_types=1);

namespace App\Models\Families;

use App\Models\Users\User;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @mixin Builder
 */
class FamilyMember extends Model
{
    use HasFactory;

    public const TABLE = 'family_members';
    protected $table = self::TABLE;

    public const ID = 'id';
    public const FAMILY_ID = 'family_id';
    public const USER_ID = 'user_id';
    public const ROLE = 'role';
    public const STATUS = 'status';
    public const JOINED_AT = 'joined_at';
    public const LAST_ACTIVITY_AT = 'last_activity_at';
    public const PERMISSIONS = 'permissions';
    public const PREFERENCES = 'preferences';
    public const CREATED_AT = 'created_at';
    public const UPDATED_AT = 'updated_at';

    protected $fillable = [
        self::FAMILY_ID,
        self::USER_ID,
        self::ROLE,
        self::STATUS,
        self::JOINED_AT,
        self::LAST_ACTIVITY_AT,
        self::PERMISSIONS,
        self::PREFERENCES,
    ];

    protected $casts = [
        self::PERMISSIONS => 'array',
        self::PREFERENCES => 'array',
        self::JOINED_AT => 'datetime',
        self::LAST_ACTIVITY_AT => 'datetime',
        self::CREATED_AT => 'datetime',
        self::UPDATED_AT => 'datetime',
    ];

    /** Relations */
    const FAMILY_RELATION = 'familyRelation';
    const USER_RELATION = 'userRelation';

    public function familyRelation(): BelongsTo
    {
        return $this->belongsTo(Family::class, self::FAMILY_ID, Family::ID);
    }

    public function userRelation(): BelongsTo
    {
        return $this->belongsTo(User::class, self::USER_ID, User::ID);
    }

    /** Scopes */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where(self::STATUS, 'active');
    }

    public function scopeByRole(Builder $query, string $role): Builder
    {
        return $query->where(self::ROLE, $role);
    }

    public function scopeRecentlyActive(Builder $query, int $days = 7): Builder
    {
        return $query->where(self::LAST_ACTIVITY_AT, '>=', now()->subDays($days));
    }

    /** Getters */
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

    public function getRole(): string
    {
        return $this->getAttribute(self::ROLE);
    }

    public function getStatus(): string
    {
        return $this->getAttribute(self::STATUS);
    }

    public function getJoinedAt(): Carbon
    {
        return $this->getAttribute(self::JOINED_AT);
    }

    public function getLastActivityAt(): ?Carbon
    {
        return $this->getAttribute(self::LAST_ACTIVITY_AT);
    }

    public function getPermissions(): array
    {
        return $this->getAttribute(self::PERMISSIONS) ?? [];
    }

    public function getPreferences(): array
    {
        return $this->getAttribute(self::PREFERENCES) ?? [];
    }

    /** Related models */
    public function relatedFamily(): Family
    {
        return $this->{self::FAMILY_RELATION};
    }

    public function relatedUser(): User
    {
        return $this->{self::USER_RELATION};
    }

    /** Business methods */
    public function updateActivity(): bool
    {
        return $this->update([self::LAST_ACTIVITY_AT => now()]);
    }

    public function hasPermission(string $permission): bool
    {
        $permissions = $this->getPermissions();
        return in_array($permission, $permissions);
    }

    public function grantPermission(string $permission): bool
    {
        $permissions = $this->getPermissions();
        if (!in_array($permission, $permissions)) {
            $permissions[] = $permission;
            return $this->update([self::PERMISSIONS => $permissions]);
        }
        return true;
    }

    public function revokePermission(string $permission): bool
    {
        $permissions = $this->getPermissions();
        $permissions = array_filter($permissions, fn($p) => $p !== $permission);
        return $this->update([self::PERMISSIONS => array_values($permissions)]);
    }

    public function isOwner(): bool
    {
        return $this->getRole() === 'owner';
    }

    public function isAdmin(): bool
    {
        return in_array($this->getRole(), ['owner', 'admin']);
    }

    public function canManageFamily(): bool
    {
        return $this->isAdmin();
    }
}
