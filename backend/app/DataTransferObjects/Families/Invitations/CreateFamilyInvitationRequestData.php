<?php

declare(strict_types=1);

namespace App\DataTransferObjects\Families\Invitations;

use App\Enums\Families\FamilyRoleEnum;
use Spatie\LaravelData\Data;

class CreateFamilyInvitationRequestData extends Data
{
    public function __construct(
        public string         $email,
        public FamilyRoleEnum $role,
        public ?string        $message,
        public int            $familyId
    )
    {
    }
}
