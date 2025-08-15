<?php

declare(strict_types=1);

namespace App\Http\Controllers\Families\Invitations;

use App\Http\Requests\Families\Invitations\CreateFamilyInvitationRequest;
use App\Http\Requests\Families\Invitations\DeleteInvitationRequest;
use App\Http\Requests\Families\Invitations\GetAllFamilyInvitationsRequest;
use App\Http\Requests\Families\Invitations\GetUserInvitationsRequest;
use App\Http\Resources\Families\Invitations\FamilyInvitationResource;
use App\Http\Resources\Families\Invitations\FamilyInvitationResourceCollection;
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
