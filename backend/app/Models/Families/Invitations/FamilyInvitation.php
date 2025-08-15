<?php

declare(strict_types=1);

namespace App\Models\Families\Invitations;

use App\Enums\Families\FamilyRoleEnum;
use App\Enums\Families\Invitations\InvitationStatusEnum;
use App\Models\Families\Family;
use App\Models\Users\User;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

/**
 * @mixin Builder
 */
class FamilyInvitation extends Model
{
    public const TABLE = 'family_invitations';
    protected $table = self::TABLE;

    public const ID = 'id';
    public const FAMILY_ID = 'family_id';
    public const EMAIL = 'email';
    public const INVITED_BY = 'invited_by';
    public const TOKEN = 'token';
    public const ROLE = 'role';
    public const MESSAGE = 'message';
    public const EXPIRES_AT = 'expires_at';
    public const STATUS = 'status';
    public const CREATED_AT = 'created_at';
    public const UPDATED_AT = 'updated_at';

    protected $fillable = [
        self::FAMILY_ID,
        self::EMAIL,
        self::INVITED_BY,
        self::TOKEN,
        self::ROLE,
        self::MESSAGE,
        self::EXPIRES_AT,
        self::STATUS,
    ];

    protected $casts = [
        self::FAMILY_ID => 'integer',
        self::INVITED_BY => 'integer',
        self::ROLE => FamilyRoleEnum::class,
        self::EXPIRES_AT => 'datetime',
        self::STATUS => InvitationStatusEnum::class,
    ];

    /** Relations */
    /** @see FamilyInvitation::familyRelation() */
    const FAMILY_RELATION = 'familyRelation';
    /** @see FamilyInvitation::inviterRelation() */
    const INVITER_RELATION = 'inviterRelation';

    public function familyRelation(): BelongsTo
    {
        return $this->belongsTo(Family::class, self::FAMILY_ID, Family::ID);
    }

    public function inviterRelation(): BelongsTo
    {
        return $this->belongsTo(User::class, self::INVITED_BY, User::ID);
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

    public function getEmail(): string
    {
        return $this->getAttribute(self::EMAIL);
    }

    public function getInvitedBy(): int
    {
        return $this->getAttribute(self::INVITED_BY);
    }

    public function getToken(): string
    {
        return $this->getAttribute(self::TOKEN);
    }

    public function getRole(): FamilyRoleEnum
    {
        return $this->getAttribute(self::ROLE);
    }

    public function getMessage(): ?string
    {
        return $this->getAttribute(self::MESSAGE);
    }

    public function getExpiresAt(): Carbon
    {
        return $this->getAttribute(self::EXPIRES_AT);
    }

    public function getStatus(): InvitationStatusEnum
    {
        return $this->getAttribute(self::STATUS);
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

    public function relatedInviter(): User
    {
        return $this->{self::INVITER_RELATION};
    }

    // Utility methods
    public function isExpired(): bool
    {
        return now()->gt($this->getExpiresAt());
    }

    public function isPending(): bool
    {
        return $this->getStatus() === InvitationStatusEnum::PENDING && !$this->isExpired();
    }

    public function canResend(): bool
    {
        return $this->getStatus() === InvitationStatusEnum::PENDING || $this->isExpired();
    }

    // Events
    protected static function boot(): void
    {
        parent::boot();

        static::creating(function ($invitation) {
            if (empty($invitation->getToken())) {
                $invitation->{self::TOKEN} = Str::random(64);
            }

            if (empty($invitation->getExpiresAt())) {
                $invitation->{self::EXPIRES_AT} = now()->addDays(7);
            }
        });
    }
}
