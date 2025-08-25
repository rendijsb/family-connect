<?php

declare(strict_types=1);

namespace App\Http\Resources\Families\Invitations;

use App\Http\Resources\Families\FamilyResource;
use App\Http\Resources\Users\UserResource;
use App\Models\Families\FamilyInvitation;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FamilyInvitationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        /** @var FamilyInvitation $invitation */
        $invitation = $this->resource;

        return [
            'id' => $invitation->getId(),
            'email' => $invitation->getEmail(),
            'role' => $invitation->getRole()->value,
            'roleName' => $invitation->getRole()->name,
            'message' => $invitation->getMessage(),
            'status' => $invitation->getStatus(),
            'expiresAt' => $invitation->getExpiresAt(),
            'acceptedAt' => $invitation->getAcceptedAt(),
            'declinedAt' => $invitation->getDeclinedAt(),
            'createdAt' => $invitation->getCreatedAt(),
            'token' => $invitation->getToken(), // Only include token for the invited user
            'family' => $invitation->relationLoaded('familyRelation') ? 
                new FamilyResource($invitation->relatedFamily()) : null,
            'invitedBy' => $invitation->relationLoaded('invitedByRelation') ? 
                new UserResource($invitation->relatedInvitedBy()) : null,
        ];
    }
}
