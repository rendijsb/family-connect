<?php

declare(strict_types=1);

namespace App\Services\Repositories\Families;

use App\DataTransferObjects\Families\CreateFamilyRequestData;
use App\DataTransferObjects\Families\UpdateFamilyRequestData;
use App\Models\Families\Family;
use App\Models\Users\User;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

readonly class FamilyRepository
{
    public function __construct(
        private Family                 $family,
        private Auth                   $auth,
        private FamilyMemberRepository $familyMemberRepository,
    )
    {
    }

    public function createFamily(CreateFamilyRequestData $data): Family
    {
        /** @var User $authUser */
        $authUser = $this->auth->user();

        $payload = [
            Family::NAME => $data->name,
            Family::DESCRIPTION => $data->description,
            Family::SETTINGS => $data->settings,
            Family::OWNER_ID => $authUser->getId(),
            Family::IS_ACTIVE => true,
            Family::INVITE_CODE => $this->makeInviteCode(),
        ];

        /** @var Family $family */
        $family = $this->family->create($payload);

        $this->familyMemberRepository->createFamilyLeader($family->getId(), $authUser->getId());

        return $family;
    }

    public function makeInviteCode(): string
    {
        return Str::random(8);
    }

    /**
     * @throws ModelNotFoundException
     */
    public function updateFamily(UpdateFamilyRequestData $data): Family
    {
        $family = $this->findOrFail($data->familyId);

        $payload = [
            Family::NAME => $data->name,
            Family::DESCRIPTION => $data->description,
            Family::SETTINGS => $data->settings,
            Family::IS_ACTIVE => $data->isActive,
        ];

        $family->update($payload);

        return $family->refresh();
    }

    /**
     * @throws ModelNotFoundException
     */
    public function findOrFail(int $familyId): Family
    {
        return $this->family->findOrFail($familyId);
    }
}
