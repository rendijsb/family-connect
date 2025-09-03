<?php

declare(strict_types=1);

namespace App\DataTransferObjects\Families;

use App\Enums\Families\FamilyRoleEnum;
use Spatie\LaravelData\Data;

class InviteMemberRequestData extends Data
{
    public function __construct(
        public string $email,
        public FamilyRoleEnum $role,
        public ?string $message,
        public string $familySlug
    )
    {
    }
}
