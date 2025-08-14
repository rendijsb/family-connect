<?php

declare(strict_types=1);

namespace App\Services\Repositories\Families;

use App\DataTransferObjects\Families\CreateFamilyRequestData;
use App\DataTransferObjects\Families\UpdateFamilyRequestData;
use App\Models\Families\Family;
use App\Models\Families\FamilyMember;
use App\Models\Users\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;

class FamilyRepository
{
    public function __construct(
        private Family $family,
        private FamilyMemberRepository $familyMemberRepository,
    )
    {
    }

    public function getAllFamilies(): Collection
    {
        return $this->family->all();
    }

    public function createFamily(CreateFamilyRequestData $data): Family
    {
        /** @var User $owner */
        $owner = Auth::user();
        $ownerId = $owner->getId();

        $payload = [
            Family::NAME => $data->name,
            Family::DESCRIPTION => $data->description,
            Family::PRIVACY_LEVEL => $data->privacyLevel,
            Family::SETTINGS => $data->settings,
            Family::OWNER_ID => $ownerId,
        ];

        $family = $this->family->create($payload);

        $this->familyMemberRepository->createFamilyOwner($family, $owner);

        return $family->load([
            Family::MEMBERS_RELATION,
            Family::OWNER_RELATION
        ]);
    }

    public function getFamilyById(int $familyId): Family
    {
        /** @var Family */
        return $this->family->findOrFail($familyId)
            ->with([
                Family::MEMBERS_RELATION,
                Family::OWNER_RELATION
            ]);
    }

    public function updateFamily(UpdateFamilyRequestData $data): Family
    {
        /** @var Family $family */
        $family = $this->family->findOrFail($data->familyId);

        $payload = [
            Family::NAME => $data->name,
            Family::DESCRIPTION => $data->description,
            Family::PRIVACY_LEVEL => $data->privacyLevel,
            Family::SETTINGS => $data->settings,
        ];

        $family->update($payload);

        return $family->refresh();
    }

    public function deleteFamily(int $familyId): JsonResponse
    {
        $this->family->findOrFail($familyId)->delete();

        return response()->json([
            'success' => true,
            'message' => 'Family deleted successfully. All associated data has been removed.'
        ]);
    }

    public function getUserFamilies(): Collection
    {
        /** @var User $user */
        $user = Auth::user();
        $userId = $user->getId();

        return $this->family
            ->whereHas(Family::MEMBERS_RELATION, function ($query) use ($userId) {
                $query->where(FamilyMember::USER_ID, $userId)
                    ->where(FamilyMember::STATUS, 'active');
            })
            ->with([
                Family::MEMBERS_RELATION,
                Family::OWNER_RELATION
            ])
            ->orderBy(Family::CREATED_AT, 'desc')
            ->get();
    }

    public function leaveFamily(int $familyId): JsonResponse
    {
        /** @var Family $family */
        $family = $this->family->findOrFail($familyId);

        /** @var User $user */
        $user = Auth::user();

        return $this->familyMemberRepository->deleteFamilyMember($family, $user);
    }

    public function findOrFail(int $familyId): Family
    {
        /** @var Family */
        return $this->family->findOrFail($familyId);
    }
}
