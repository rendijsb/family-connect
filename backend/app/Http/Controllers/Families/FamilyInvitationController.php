<?php

declare(strict_types=1);

namespace App\Http\Controllers\Families;

use App\Http\Requests\Families\CreateFamilyInvitationRequest;
use App\Http\Requests\Families\DeleteInvitationRequest;
use App\Http\Requests\Families\GetAllFamilyInvitationsRequest;
use App\Http\Requests\Families\GetUserInvitationsRequest;
use App\Http\Resources\Families\FamilyInvitationResource;
use App\Http\Resources\Families\FamilyInvitationResourceCollection;
use App\Services\Repositories\Families\FamilyInvitationRepository;
use Illuminate\Http\JsonResponse;

readonly class FamilyInvitationController
{
    public function __construct(
        private FamilyInvitationRepository $familyInvitationRepository
    )
    {
    }

    public function getAllInvitations(GetAllFamilyInvitationsRequest $request): FamilyInvitationResourceCollection
    {
        return $request->responseResource(
            $this->familyInvitationRepository->getAllFamilyInvitations($request->getFamilyId())
        );
    }

    public function createInvitation(CreateFamilyInvitationRequest $request): FamilyInvitationResource
    {
        return $request->responseResource(
            $this->familyInvitationRepository->createInvitation($request->dto())
        );
    }

    public function deleteInvitation(DeleteInvitationRequest $request): JsonResponse
    {
        return $this->familyInvitationRepository->deleteInvitation($request->getInvitationId());
    }

    public function getUserInvitations(GetUserInvitationsRequest $request): FamilyInvitationResourceCollection
    {
        return $request->responseResource(
            $this->familyInvitationRepository->getUserInvitations()
        );
    }
}
