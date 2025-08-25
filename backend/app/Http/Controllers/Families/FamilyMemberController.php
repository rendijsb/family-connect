<?php

declare(strict_types=1);

namespace App\Http\Controllers\Families;


use App\Http\Requests\Families\DeleteFamilyRequest;
use App\Http\Requests\Families\Members\DeleteFamilyMemberRequest;
use App\Http\Requests\Families\Members\GetAllFamilyMembersRequest;
use App\Http\Requests\Families\Members\InviteFamilyMemberRequest;
use App\Http\Resources\Families\Members\FamilyMemberResource;
use App\Http\Resources\Families\Members\FamilyMemberResourceCollection;
use App\Services\Repositories\Families\Members\FamilyMemberRepository;
use Illuminate\Http\JsonResponse;

class FamilyMemberController
{
    public function __construct(
        private readonly FamilyMemberRepository $familyMemberRepository
    )
    {
    }

    public function getAllFamilyMembers(GetAllFamilyMembersRequest $request): FamilyMemberResourceCollection
    {
        return $request->responseResource(
            $this->familyMemberRepository->getAllFamilyMembers($request->getFamilySlug())
        );
    }

    public function inviteFamilyMember(InviteFamilyMemberRequest $request): JsonResponse
    {
        $this->familyMemberRepository->getAllFamilyMembers($request->getFamilySlug());

        return response()->json(200);
    }

    public function updateFamilyMemberRole(UpdateFamilyMemberRoleRequest $request): FamilyMemberResource
    {
        return $request->responseResource(
            $this->familyMemberRepository->updateFamilyMemberRole($request->dto())
        );
    }

    public function deleteFamilyMember(DeleteFamilyMemberRequest $request): JsonResponse
    {
        $this->familyMemberRepository->deleteFamilyMember($request->getFamilySlug(), $request->getFamilyMemberId());

        return response()->json([
            'success' => true,
            'message' => 'Family member deleted successfully.',
        ], 200);
    }
}
