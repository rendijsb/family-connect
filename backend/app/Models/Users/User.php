<?php

declare(strict_types=1);

namespace App\Models\Users;

use App\Enums\Roles\RoleEnum;
use App\Models\Roles\Role;
use Carbon\Carbon;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Laravel\Sanctum\HasApiTokens;

/**
 * @mixin Builder
 */
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable, HasApiTokens;

    public const TABLE = 'users';
    protected $table = self::TABLE;

    public const ID = 'id';
    public const NAME = 'name';
    public const EMAIL = 'email';
    public const PASSWORD = 'password';
    public const ROLE_ID = 'role_id';
    public const PHONE = 'phone';
    public const DATE_OF_BIRTH = 'date_of_birth';
    public const EMAIL_VERIFIED_AT = 'email_verified_at';
    public const CREATED_AT = 'created_at';
    public const UPDATED_AT = 'updated_at';
    public const REMEMBER_TOKEN = 'remember_token';

    protected $fillable = [
        self::NAME,
        self::EMAIL,
        self::PHONE,
        self::DATE_OF_BIRTH,
        self::PASSWORD,
        self::ROLE_ID,
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        self::PASSWORD,
        self::REMEMBER_TOKEN,
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            self::EMAIL_VERIFIED_AT => 'datetime',
            self::PASSWORD => 'hashed',
        ];
    }

    /** Relations */
    /** @see User::roleRelation() */
    const ROLE_RELATION = 'roleRelation';

    public function roleRelation(): BelongsTo
    {
        return $this->belongsTo(Role::class, Role::ID, self::ROLE_ID);
    }

    /**
     * Check if user can manage family
     */
    public function canManageFamily(): bool
    {
        return in_array($this->getRoleId(), [
            RoleEnum::ADMIN->value,
            RoleEnum::MODERATOR->value,
            RoleEnum::FAMILY_OWNER->value
        ]);
    }

    public function getId(): int
    {
        return $this->getAttribute(self::ID);
    }

    public function getRoleId(): string
    {
        return $this->getAttribute(self::ROLE_ID);
    }

    public function getName(): string
    {
        return $this->getAttribute(self::NAME);
    }

    public function getEmail(): string
    {
        return $this->getAttribute(self::EMAIL);
    }

    public function getPhone(): ?string
    {
        return $this->getAttribute(self::PHONE);
    }

    public function getDateOfBirth(): ?Carbon
    {
        return $this->getAttribute(self::DATE_OF_BIRTH);
    }

    public function getEmailVerifiedAt(): ?Carbon
    {
        return $this->getAttribute(self::EMAIL_VERIFIED_AT);
    }

    public function getCreatedAt(): Carbon
    {
        return $this->getAttribute(self::CREATED_AT);
    }

    public function getUpdatedAt(): Carbon
    {
        return $this->getAttribute(self::UPDATED_AT);
    }

    public function relatedRole(): Role
    {
        return $this->{self::ROLE_RELATION};
    }
}
