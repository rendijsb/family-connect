<?php

declare(strict_types=1);

namespace App\Services\Repositories\Families;

use App\DataTransferObjects\Families\CreateFamilyInvitationRequestData;
use App\Models\Families\Family;
use App\Models\Families\FamilyInvitation;
use App\Models\Users\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;

readonly class FamilyInvitationRepository
{
    public function __construct(
        private FamilyInvitation $familyInvitation,
        private Family $family,
    )
    {
    }

    public function getAllFamilyInvitations(int $familyId): Collection
    {
        /** @var Family $family */
        $family = $this->family->findOrFail($familyId);

        return $family->relatedInvitations();
    }

    public function createInvitation(CreateFamilyInvitationRequestData $data): FamilyInvitation
    {
        /** @var User $user */
        $user = Auth::user();

        $payload = [
            FamilyInvitation::FAMILY_ID => $data->familyId,
            FamilyInvitation::INVITED_BY => $user->getId(),
            FamilyInvitation::MESSAGE => $data->message,
            FamilyInvitation::EMAIL => $data->email,
            FamilyInvitation::ROLE => $data->role,
        ];

        return $this->familyInvitation->create($payload);
    }

    public function deleteInvitation(int $invitationId): JsonResponse
    {
        $this->findOrFail($invitationId)->delete();

        return response()->json([
            'success' => true,
            'message' => 'Invite has been canceled'
        ]);
    }

    public function findOrFail(int $invitationId): FamilyInvitation
    {
        /** @var FamilyInvitation */
        return $this->familyInvitation->findOrFail($invitationId);
    }

    public function getUserInvitations(): Collection
    {
        /** @var User $user */
        $user = Auth::user();

        return $this->familyInvitation
            ->where(FamilyInvitation::EMAIL, $user->getEmail())
            ->get();
    }
}
