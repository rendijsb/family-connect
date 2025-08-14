<?php

declare(strict_types=1);

namespace App\Http\Controllers\Families;

use App\Http\Requests\Families\DeleteFamilyMemberRequest;
use App\Http\Requests\Families\GetFamilyMembersRequest;
use App\Http\Requests\Families\GetUserFamilyMemberRequest;
use App\Http\Requests\Families\UpdateFamilyMemberRequest;
use App\Http\Resources\Families\FamilyMemberResource;
use App\Http\Resources\Families\FamilyMemberResourceCollection;
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
