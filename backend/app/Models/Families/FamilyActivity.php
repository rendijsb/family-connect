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
class FamilyActivity extends Model
{
    use HasFactory;

    public const TABLE = 'family_activities';
    protected $table = self::TABLE;

    public const ID = 'id';
    public const FAMILY_ID = 'family_id';
    public const USER_ID = 'user_id';
    public const TYPE = 'type';
    public const TITLE = 'title';
    public const DESCRIPTION = 'description';
    public const METADATA = 'metadata';
    public const IS_VISIBLE = 'is_visible';
    public const CREATED_AT = 'created_at';
    public const UPDATED_AT = 'updated_at';

    protected $fillable = [
        self::FAMILY_ID,
        self::USER_ID,
        self::TYPE,
        self::TITLE,
        self::DESCRIPTION,
        self::METADATA,
        self::IS_VISIBLE,
    ];

    protected $casts = [
        self::METADATA => 'array',
        self::IS_VISIBLE => 'boolean',
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
    public function scopeVisible(Builder $query): Builder
    {
        return $query->where(self::IS_VISIBLE, true);
    }

    public function scopeByType(Builder $query, string $type): Builder
    {
        return $query->where(self::TYPE, $type);
    }

    public function scopeRecent(Builder $query, int $days = 30): Builder
    {
        return $query->where(self::CREATED_AT, '>=', now()->subDays($days));
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

    public function getType(): string
    {
        return $this->getAttribute(self::TYPE);
    }

    public function getTitle(): string
    {
        return $this->getAttribute(self::TITLE);
    }

    public function getDescription(): ?string
    {
        return $this->getAttribute(self::DESCRIPTION);
    }

    public function getMetadata(): array
    {
        return $this->getAttribute(self::METADATA) ?? [];
    }

    public function getIsVisible(): bool
    {
        return $this->getAttribute(self::IS_VISIBLE);
    }

    public function getCreatedAt(): Carbon
    {
        return $this->getAttribute(self::CREATED_AT);
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
}
