<?php

declare(strict_types=1);

namespace App\DataTransferObjects\Families\Members;

use App\Enums\Families\FamilyRoleEnum;
use Spatie\LaravelData\Data;

class UpdateFamilyMemberRoleRequestData extends Data
{
    public function __construct(
        public FamilyRoleEnum $role,
        public string $familySlug,
        public int $memberId
    )
    {
    }
}
