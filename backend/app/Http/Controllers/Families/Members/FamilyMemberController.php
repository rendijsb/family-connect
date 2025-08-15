<?php

declare(strict_types=1);

namespace App\Http\Controllers\Families\Members;

use App\Http\Requests\Families\Members\DeleteFamilyMemberRequest;
use App\Http\Requests\Families\Members\GetFamilyMembersRequest;
use App\Http\Requests\Families\Members\GetUserFamilyMemberRequest;
use App\Http\Requests\Families\Members\UpdateFamilyMemberRequest;
use App\Http\Resources\Families\Members\FamilyMemberResource;
use App\Http\Resources\Families\Members\FamilyMemberResourceCollection;
use App\Services\Repositories\Families\FamilyMemberRepository;
use Illuminate\Http\JsonResponse;

readonly class FamilyMemberController
{
    public function __construct(
        private FamilyMemberRepository $familyMemberRepository
    )
    {
    }

    public function updateFamilyMember(UpdateFamilyMemberRequest $request): FamilyMemberResource
    {
        return $request->responseResource(
            $this->familyMemberRepository->updateFamilyMember($request->dto())
        );
    }

    public function getFamilyMembers(GetFamilyMembersRequest $request): FamilyMemberResourceCollection
    {
        return $request->responseResource(
            $this->familyMemberRepository->getFamilyMembers($request->getFamilyId())
        );
    }

    public function getUserFamilyMember(GetUserFamilyMemberRequest $request): FamilyMemberResource
    {
        return $request->responseResource(
            $this->familyMemberRepository->getUserFamilyMember($request->getFamilyId())
        );
    }

    public function deleteFamilyMember(DeleteFamilyMemberRequest $request): JsonResponse
    {
        return $this->familyMemberRepository->deleteFamilyMemberWithMemberAndFamilyId($request->getFamilyId(), $request->getMemberId());
    }
}
