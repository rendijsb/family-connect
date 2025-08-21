<?php

declare(strict_types=1);

namespace App\Http\Controllers\Families;

use App\Http\Requests\Families\CreateFamilyRequest;
use App\Http\Requests\Families\DeleteFamilyRequest;
use App\Http\Requests\Families\GetAllFamiliesRequest;
use App\Http\Requests\Families\GetFamilyBySlugRequest;
use App\Http\Requests\Families\GetMyFamiliesRequest;
use App\Http\Requests\Families\JoinFamilyByCodeRequest;
use App\Http\Requests\Families\UpdateFamilyRequest;
use App\Http\Resources\Families\FamilyResource;
use App\Http\Resources\Families\FamilyResourceCollection;
use App\Models\Families\Family;
use App\Models\Families\FamilyMember;
use App\Services\Repositories\Families\FamilyRepository;
use Illuminate\Http\JsonResponse;

class FamilyController
{
    public function __construct(
        private readonly FamilyRepository $familyRepository,
    )
    {
    }

    public function getAllFamilies(GetAllFamiliesRequest $request): FamilyResourceCollection
    {
        return $request->responseResource(
            $this->familyRepository->getAllFamilies()
        );
    }

    public function createFamily(CreateFamilyRequest $request): FamilyResource
    {
        return $request->responseResource(
            $this->familyRepository->createFamily($request->dto())
        );
    }

    public function getMyFamilies(GetMyFamiliesRequest $request): FamilyResourceCollection
    {
        return $request->responseResource(
            $this->familyRepository->getMyFamilies()
        );
    }

    public function getFamilyBySlug(GetFamilyBySlugRequest $request): FamilyResource
    {
        return $request->responseResource(
            $this->familyRepository->getFamilyBySlug($request->getFamilySlug())
        );
    }

    public function updateFamily(UpdateFamilyRequest $request): FamilyResource
    {
        $familyMember = $request->get('_family_member');

        if (!$familyMember || !$this->canManageFamily($familyMember)) {
            abort(403, 'You do not have permission to update this family.');
        }

        return $request->responseResource(
            $this->familyRepository->updateFamily($request->dto())
        );
    }

    public function deleteFamily(DeleteFamilyRequest $request): JsonResponse
    {
        $family = $request->get('_family');
        $familyMember = $request->get('_family_member');

        if (!$family || !$familyMember || !$this->isOwner($family, $familyMember)) {
            abort(403, 'Only the family owner can delete the family.');
        }

        $this->familyRepository->deleteFamily($request->getFamilySlug());

        return response()->json([
            'success' => true,
            'message' => 'Family deleted successfully.',
        ], 200);
    }

    public function leaveFamily(): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => 'Not implemented yet.',
        ], 501);
    }

    public function joinFamilyByCode(JoinFamilyByCodeRequest $request): FamilyResource
    {
        return $request->responseResource(
            $this->familyRepository->joinFamilyByCode($request->dto())
        );
    }

    private function canManageFamily(FamilyMember $member): bool
    {
        return in_array($member->getRole(), [
            \App\Enums\Families\FamilyRoleEnum::OWNER,
            \App\Enums\Families\FamilyRoleEnum::MODERATOR,
        ]);
    }

    private function isOwner(Family $family, FamilyMember $member): bool
    {
        return $family->getOwnerId() === $member->getUserId() &&
            $member->getRole() === \App\Enums\Families\FamilyRoleEnum::OWNER;
    }
}
