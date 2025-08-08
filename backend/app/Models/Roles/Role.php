<?php

declare(strict_types=1);

namespace App\Models\Roles;

use App\Models\Users\User;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @mixin Builder
 */
class Role extends Model
{
    use HasFactory;

    public const TABLE = 'roles';
    protected $table = self::TABLE;

    public const ID = 'id';
    public const NAME = 'name';
    public const DISPLAY_NAME = 'display_name';
    public const DESCRIPTION = 'description';
    public const IS_ACTIVE = 'is_active';
    public const CREATED_AT = 'created_at';
    public const UPDATED_AT = 'updated_at';

    protected $fillable = [
        self::NAME,
        self::DISPLAY_NAME,
        self::DESCRIPTION,
        self::IS_ACTIVE,
    ];

    protected $casts = [
        self::IS_ACTIVE => 'boolean',
    ];

    /** Relations */
    /** @see Role::usersRelation() */
    const USERS_RELATION = 'usersRelation';

    public function usersRelation(): HasMany
    {
        return $this->hasMany(User::class, User::ROLE_ID, self::ID);
    }

    public function getId(): int
    {
        return $this->getAttribute(self::ID);
    }

    public function getName(): string
    {
        return $this->getAttribute(self::NAME);
    }

    public function getDisplayName(): string
    {
        return $this->getAttribute(self::DISPLAY_NAME);
    }

    public function getDescription(): string
    {
        return $this->getAttribute(self::DESCRIPTION);
    }

    public function getIsActive(): bool
    {
        return (bool) $this->getAttribute(self::IS_ACTIVE);
    }

    public function getCreatedAt(): Carbon
    {
        return $this->getAttribute(self::CREATED_AT);
    }

    public function getUpdatedAt(): Carbon
    {
        return $this->getAttribute(self::UPDATED_AT);
    }

    public function relatedUser(): User
    {
        return $this->{self::USERS_RELATION};
    }
}
