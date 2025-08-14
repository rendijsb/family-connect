<?php

declare(strict_types=1);

namespace App\Services\Repositories\Families;

use App\DataTransferObjects\Families\UpdateFamilyMemberRequestData;
use App\Enums\Families\FamilyRoleEnum;
use App\Models\Families\Family;
use App\Models\Families\FamilyMember;
use App\Models\Users\User;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

readonly class FamilyMemberRepository
{
    public function __construct(
        private FamilyMember $familyMember,
        private FamilyRepository $familyRepository,
        private Auth $auth
    )
    {
    }

    public function createFamilyOwner(Family $family, User $owner): FamilyMember
    {
        $payload = [
            FamilyMember::FAMILY_ID => $family->getId(),
            FamilyMember::USER_ID => $owner->getId(),
            FamilyMember::ROLE => FamilyRoleEnum::OWNER,
            FamilyMember::JOINED_AT => Carbon::now(),
            FamilyMember::STATUS => 'active',
            FamilyMember::PERMISSIONS => $this->getOwnerPermissions(),
            FamilyMember::LAST_ACTIVE_AT => Carbon::now(),
        ];

        return $this->familyMember->create($payload);
    }

    public function deleteFamilyMember(Family $family, User $user): JsonResponse
    {
        /** @var FamilyMember $familyMember */
        $familyMember = $this->familyMember
            ->where(FamilyMember::FAMILY_ID, $family->getId())
            ->where(FamilyMember::USER_ID, $user->getId())
            ->first();

        return $this->checkIfDeletingOwner($familyMember, $family);
    }

    private function getOwnerPermissions(): array
    {
        return [
            'canInviteMembers' => true,
            'canRemoveMembers' => true,
            'canEditFamilyInfo' => true,
            'canManageEvents' => true,
            'canSharePhotos' => true,
            'canViewLocations' => true,
            'canModerateChat' => true,
            'canManageRoles' => true,
            'canDeleteFamily' => true,
        ];
    }

    public function updateFamilyMember(UpdateFamilyMemberRequestData $data): FamilyMember
    {
        /** @var FamilyMember $familyMember */
        $familyMember = $this->familyMember
            ->where(FamilyMember::ID, '=', $data->memberId)
            ->where(FamilyMember::FAMILY_ID, '=', $data->familyId)
            ->first();

        $payload = [
            FamilyMember::ROLE => $data->role,
            FamilyMember::PERMISSIONS => $data->permissions,
            FamilyMember::NICKNAME => $data->nickname,
        ];

        $familyMember->update($payload);

        return $familyMember->refresh();
    }

    public function getFamilyMembers(int $familyId): Collection
    {
        $family = $this->familyRepository->findOrFail($familyId);

        return $family->relatedMembers();
    }

    public function getUserFamilyMember(int $familyId): FamilyMember
    {
        /** @var User $user */
        $user = $this->auth->user();
        $userId = $user->getId();

        return $this->familyMember
            ->where(FamilyMember::FAMILY_ID, '=', $familyId)
            ->where(FamilyMember::USER_ID, '=', $userId)
            ->first();
    }

    public function deleteFamilyMemberWithMemberAndFamilyId(int $familyId, int $memberId): JsonResponse
    {
        /** @var FamilyMember $familyMember */
        $familyMember = $this->familyMember
            ->where(FamilyMember::FAMILY_ID, $familyId)
            ->where(FamilyMember::ID, $memberId)
            ->first();

        $family = $this->familyRepository->findOrFail($familyId);

        return $this->checkIfDeletingOwner($familyMember, $family);
    }

    /**
     * @param FamilyMember $familyMember
     * @param Family $family
     * @return JsonResponse
     */
    public function checkIfDeletingOwner(FamilyMember $familyMember, Family $family): JsonResponse
    {
        $isFamilyOwner = $familyMember->getRole() === FamilyRoleEnum::OWNER;

        if ($isFamilyOwner) {
            /** @var Collection<FamilyMember> $members */
            $membersCount = $family->relatedMembers()->count();

            $familyMember->delete();
            if ($membersCount === 1) {
                $family->delete();
            } else {
                /** @var FamilyMember $familyMemberNewOwner */
                $familyMemberNewOwner = $family->relatedMembers()->first();

                $payload = [
                    FamilyMember::ROLE => FamilyRoleEnum::OWNER,
                ];

                $familyMemberNewOwner->update($payload);
            }
        } else {
            $familyMember->delete();
        }

        return response()->json([
            'success' => true,
            'message' => 'Family has been left'
        ]);
    }
}
