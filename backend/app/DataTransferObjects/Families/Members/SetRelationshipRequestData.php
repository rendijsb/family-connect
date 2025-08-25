<?php

declare(strict_types=1);

namespace App\DataTransferObjects\Families\Members;

use App\Enums\Families\RelationshipTypeEnum;
use Spatie\LaravelData\Data;

class SetRelationshipRequestData extends Data
{
    public function __construct(
        public int $relatedMemberId,
        public RelationshipTypeEnum $relationshipType,
        public bool $isGuardian,
        public string $familySlug,
        public int $memberId
    )
    {
    }
}
