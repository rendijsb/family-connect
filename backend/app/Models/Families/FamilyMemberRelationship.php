<?php

declare(strict_types=1);

namespace App\Models\Families;

use App\Enums\Families\RelationshipTypeEnum;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FamilyMemberRelationship extends Model
{
    public const TABLE = 'family_member_relationships';
    protected $table = self::TABLE;

    public const ID = 'id';
    public const FAMILY_ID = 'family_id';
    public const MEMBER_ID = 'member_id';
    public const RELATED_MEMBER_ID = 'related_member_id';
    public const RELATIONSHIP_TYPE = 'relationship_type';
    public const IS_GUARDIAN = 'is_guardian';
    public const CREATED_AT = 'created_at';
    public const UPDATED_AT = 'updated_at';

    protected $fillable = [
        self::FAMILY_ID,
        self::MEMBER_ID,
        self::RELATED_MEMBER_ID,
        self::RELATIONSHIP_TYPE,
        self::IS_GUARDIAN,
    ];

    protected $casts = [
        self::RELATIONSHIP_TYPE => RelationshipTypeEnum::class,
        self::IS_GUARDIAN => 'boolean',
        self::CREATED_AT => 'datetime',
        self::UPDATED_AT => 'datetime',
    ];

    /** Relations */
    /** @see FamilyMemberRelationship::familyRelation() */
    public const FAMILY_RELATION = 'familyRelation';
    /** @see FamilyMemberRelationship::memberRelation() */
    public const MEMBER_RELATION = 'memberRelation';
    /** @see FamilyMemberRelationship::relatedMemberRelation() */
    public const RELATED_MEMBER_RELATION = 'relatedMemberRelation';

    public function familyRelation(): BelongsTo
    {
        return $this->belongsTo(Family::class, self::FAMILY_ID, Family::ID);
    }

    public function memberRelation(): BelongsTo
    {
        return $this->belongsTo(FamilyMember::class, self::MEMBER_ID, FamilyMember::ID);
    }

    public function relatedMemberRelation(): BelongsTo
    {
        return $this->belongsTo(FamilyMember::class, self::RELATED_MEMBER_ID, FamilyMember::ID);
    }

    public function relatedMember(): FamilyMember
    {
        return $this->{self::RELATED_MEMBER_RELATION};
    }

    public function relatedFamily(): Family
    {
        return $this->{self::FAMILY_RELATION};
    }

    public function relatedRelatedFamilyMember(): FamilyMember
    {
        return $this->{self::RELATED_MEMBER_RELATION};
    }

    public function getId(): int
    {
        return $this->getAttribute(self::ID);
    }

    public function getFamilyId(): int
    {
        return $this->getAttribute(self::FAMILY_ID);
    }

    public function getMemberId(): int
    {
        return $this->getAttribute(self::MEMBER_ID);
    }

    public function getRelatedMemberId(): int
    {
        return $this->getAttribute(self::RELATED_MEMBER_ID);
    }

    public function getRelationshipType(): RelationshipTypeEnum
    {
        return $this->getAttribute(self::RELATIONSHIP_TYPE);
    }

    public function isGuardian(): bool
    {
        return $this->getAttribute(self::IS_GUARDIAN);
    }

    public function getCreatedAt(): ?Carbon
    {
        return $this->getAttribute(self::CREATED_AT);
    }

    public function getUpdatedAt(): ?Carbon
    {
        return $this->getAttribute(self::UPDATED_AT);
    }
}
