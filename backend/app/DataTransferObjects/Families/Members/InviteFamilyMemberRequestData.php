<?php

declare(strict_types=1);

namespace App\DataTransferObjects\Families\Members;

use App\Enums\Families\FamilyRoleEnum;
use Spatie\LaravelData\Data;

class InviteFamilyMemberRequestData extends Data
{
    public function __construct(
        public readonly string $email,
        public readonly FamilyRoleEnum $role,
        public readonly ?string $message,
        public readonly string $familySlug
    )
    {
    }
}
