<?php

declare(strict_types=1);

namespace App\Http\Controllers\Families;

use App\Http\Requests\Families\Invitations\AcceptInvitationRequest;
use App\Http\Requests\Families\Invitations\CancelInvitationRequest;
use App\Http\Requests\Families\Invitations\DeclineInvitationRequest;
use App\Http\Requests\Families\Invitations\GetPendingInvitationsRequest;
use App\Http\Resources\Families\Invitations\FamilyInvitationResource;
use App\Http\Resources\Families\Invitations\FamilyInvitationResourceCollection;
use App\Http\Resources\Families\FamilyResource;
use App\Services\Repositories\Families\Invitations\InvitationRepository;
use Illuminate\Http\JsonResponse;

class InvitationController
{
    public function __construct(
        private readonly InvitationRepository $invitationRepository
    )
    {
    }

    public function pending(GetPendingInvitationsRequest $request): FamilyInvitationResourceCollection
    {
        return $request->responseResource(
            $this->invitationRepository->getPendingInvitations()
        );
    }

    public function accept(AcceptInvitationRequest $request): FamilyResource
    {
        return $request->responseResource(
            $this->invitationRepository->acceptInvitation($request->getToken())
        );
    }

    public function decline(DeclineInvitationRequest $request): JsonResponse
    {
        $this->invitationRepository->declineInvitation($request->getToken());

        return response()->json([
            'success' => true,
            'message' => 'Invitation declined successfully.'
        ], 200);
    }

    public function cancel(CancelInvitationRequest $request): JsonResponse
    {
        $this->invitationRepository->cancelInvitation($request->getInvitationId());

        return response()->json([
            'success' => true,
            'message' => 'Invitation cancelled successfully.'
        ], 200);
    }
}
