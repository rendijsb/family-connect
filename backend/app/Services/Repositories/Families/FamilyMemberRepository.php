<?php

declare(strict_types=1);

namespace App\Services\Repositories\Families;

use App\Enums\Families\FamilyMemberPermissionsEnum;
use App\Enums\Families\FamilyMemberStatusEnum;
use App\Models\Families\FamilyMember;
use App\Services\Repositories\Users\UserRepository;

readonly class FamilyMemberRepository
{
    public function __construct(
        private FamilyMember                $familyMember,
        private UserRepository              $userRepository,
        private FamilyMemberPermissionsEnum $familyMemberPermissions
    )
    {
    }

    public function createFamilyLeader(int $familyId, $leaderId): FamilyMember
    {
        $payload = [
            FamilyMember::FAMILY_ID => $familyId,
            FamilyMember::USER_ID => $leaderId,
            FamilyMember::STATUS => FamilyMemberStatusEnum::ACTIVE,
            FamilyMember::PERMISSIONS => $this->familyMemberPermissions->getAllPermissions(),
        ];

        $this->userRepository->updateToFamilyLeader($leaderId);

        return $this->familyMember->create($payload);
    }
}
