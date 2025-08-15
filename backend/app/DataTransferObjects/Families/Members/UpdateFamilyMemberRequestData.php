<?php

declare(strict_types=1);

namespace App\DataTransferObjects\Families\Members;

use App\Enums\Families\FamilyRoleEnum;

class UpdateFamilyMemberRequestData
{
    public function __construct(
        public ?FamilyRoleEnum $role,
        public ?string         $nickname,
        public ?array          $permissions,
        public int             $familyId,
        public int             $memberId,
    )
    {
    }
}
