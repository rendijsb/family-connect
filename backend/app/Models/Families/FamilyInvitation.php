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
class FamilyInvitation extends Model
{
    use HasFactory;

    public const TABLE = 'family_invitations';
    protected $table = self::TABLE;

    public const ID = 'id';
    public const FAMILY_ID = 'family_id';
    public const INVITED_BY = 'invited_by';
    public const EMAIL = 'email';
    public const TOKEN = 'token';
    public const ROLE = 'role';
    public const STATUS = 'status';
    public const EXPIRES_AT = 'expires_at';
    public const SENT_AT = 'sent_at';
    public const RESPONDED_AT = 'responded_at';
    public const INVITATION_DATA = 'invitation_data';
    public const CREATED_AT = 'created_at';
    public const UPDATED_AT = 'updated_at';

    protected $fillable = [
        self::FAMILY_ID,
        self::INVITED_BY,
        self::EMAIL,
        self::TOKEN,
        self::ROLE,
        self::STATUS,
        self::EXPIRES_AT,
        self::SENT_AT,
        self::RESPONDED_AT,
        self::INVITATION_DATA,
    ];

    protected $casts = [
        self::INVITATION_DATA => 'array',
        self::EXPIRES_AT => 'datetime',
        self::SENT_AT => 'datetime',
        self::RESPONDED_AT => 'datetime',
        self::CREATED_AT => 'datetime',
        self::UPDATED_AT => 'datetime',
    ];

    /** Relations */
    const FAMILY_RELATION = 'familyRelation';
    const INVITER_RELATION = 'inviterRelation';

    public function familyRelation(): BelongsTo
    {
        return $this->belongsTo(Family::class, self::FAMILY_ID, Family::ID);
    }

    public function inviterRelation(): BelongsTo
    {
        return $this->belongsTo(User::class, self::INVITED_BY, User::ID);
    }

    /** Scopes */
    public function scopePending(Builder $query): Builder
    {
        return $query->where(self::STATUS, 'pending')
            ->where(self::EXPIRES_AT, '>', now());
    }

    public function scopeExpired(Builder $query): Builder
    {
        return $query->where(self::STATUS, 'pending')
            ->where(self::EXPIRES_AT, '<=', now());
    }

    public function scopeByEmail(Builder $query, string $email): Builder
    {
        return $query->where(self::EMAIL, $email);
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

    public function getRole(): string
    {
        return $this->getAttribute(self::ROLE);
    }

    public function getStatus(): string
    {
        return $this->getAttribute(self::STATUS);
    }

    public function getExpiresAt(): Carbon
    {
        return $this->getAttribute(self::EXPIRES_AT);
    }

    public function getSentAt(): Carbon
    {
        return $this->getAttribute(self::SENT_AT);
    }

    public function getRespondedAt(): ?Carbon
    {
        return $this->getAttribute(self::RESPONDED_AT);
    }

    public function getInvitationData(): array
    {
        return $this->getAttribute(self::INVITATION_DATA) ?? [];
    }

    /** Related models */
    public function relatedFamily(): Family
    {
        return $this->{self::FAMILY_RELATION};
    }

    public function relatedInviter(): User
    {
        return $this->{self::INVITER_RELATION};
    }

    /** Business methods */
    public function isExpired(): bool
    {
        return $this->getExpiresAt()->isPast();
    }

    public function isPending(): bool
    {
        return $this->getStatus() === 'pending' && !$this->isExpired();
    }

    public function accept(): bool
    {
        if (!$this->isPending()) {
            return false;
        }

        return $this->update([
            self::STATUS => 'accepted',
            self::RESPONDED_AT => now(),
        ]);
    }

    public function decline(): bool
    {
        if (!$this->isPending()) {
            return false;
        }

        return $this->update([
            self::STATUS => 'declined',
            self::RESPONDED_AT => now(),
        ]);
    }

    public function cancel(): bool
    {
        if (!$this->isPending()) {
            return false;
        }

        return $this->update([
            self::STATUS => 'cancelled',
            self::RESPONDED_AT => now(),
        ]);
    }

    public function markAsExpired(): bool
    {
        return $this->update([self::STATUS => 'expired']);
    }
}
