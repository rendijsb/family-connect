<?php

declare(strict_types=1);

namespace App\Models\Families;

use App\Enums\Families\FamilyRoleEnum;
use App\Models\Users\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FamilyInvitation extends Model
{
    public const TABLE = 'family_invitations';
    protected $table = self::TABLE;

    public const ID = 'id';
    public const FAMILY_ID = 'family_id';
    public const INVITED_BY = 'invited_by';
    public const EMAIL = 'email';
    public const TOKEN = 'token';
    public const ROLE = 'role';
    public const MESSAGE = 'message';
    public const STATUS = 'status';
    public const EXPIRES_AT = 'expires_at';
    public const ACCEPTED_AT = 'accepted_at';
    public const DECLINED_AT = 'declined_at';
    public const CREATED_AT = 'created_at';
    public const UPDATED_AT = 'updated_at';

    protected $fillable = [
        self::FAMILY_ID,
        self::INVITED_BY,
        self::EMAIL,
        self::TOKEN,
        self::ROLE,
        self::MESSAGE,
        self::STATUS,
        self::EXPIRES_AT,
        self::ACCEPTED_AT,
        self::DECLINED_AT,
    ];

    protected $casts = [
        self::ROLE => FamilyRoleEnum::class,
        self::EXPIRES_AT => 'datetime',
        self::ACCEPTED_AT => 'datetime',
        self::DECLINED_AT => 'datetime',
        self::UPDATED_AT => 'datetime',
        self::CREATED_AT => 'datetime',
    ];

    /** Relations */
    /** @see FamilyInvitation::familyRelation() */
    public const FAMILY_RELATION = 'familyRelation';
    /** @see FamilyInvitation::invitedByRelation() */
    public const INVITED_BY_RELATION = 'invitedByRelation';

    public function familyRelation(): BelongsTo
    {
        return $this->belongsTo(Family::class, self::FAMILY_ID, Family::ID);
    }

    public function invitedByRelation(): BelongsTo
    {
        return $this->belongsTo(User::class, self::INVITED_BY, User::ID);
    }

    public function relatedInvitedBy(): ?User
    {
        return $this->{self::INVITED_BY_RELATION};
    }

    public function relatedFamily(): ?Family
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

    public function getInvitedBy(): int
    {
        return $this->getAttribute(self::INVITED_BY);
    }

    public function getEmail(): string
    {
        return $this->getAttribute(self::EMAIL);
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

    public function getStatus(): string
    {
        return $this->getAttribute(self::STATUS);
    }

    public function getExpiresAt(): ?string
    {
        return $this->getAttribute(self::EXPIRES_AT);
    }

    public function getAcceptedAt(): ?string
    {
        return $this->getAttribute(self::ACCEPTED_AT);
    }

    public function getDeclinedAt(): ?string
    {
        return $this->getAttribute(self::DECLINED_AT);
    }

    public function getCreatedAt(): ?string
    {
        return $this->getAttribute(self::CREATED_AT);
    }

    public function getUpdatedAt(): ?string
    {
        return $this->getAttribute(self::UPDATED_AT);
    }
}

