<?php

declare(strict_types=1);

namespace App\Http\Resources\Families\Invitations;

use App\Http\Resources\Families\FamilyResource;
use App\Http\Resources\Families\Members\FamilyMemberResource;
use App\Models\Families\Invitations\FamilyInvitation;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FamilyInvitationResource extends JsonResource
{
    /** @var FamilyInvitation */
    public $resource;

    public function toArray(Request $request): array
    {
        return [
            'id' => $this->resource->getId(),
            'familyId' => $this->resource->getFamilyId(),
            'email' => $this->resource->getEmail(),
            'invitedBy' => $this->resource->getInvitedBy(),
            'token' => $this->resource->getToken(),
            'role' => $this->resource->getRole(),
            'message' => $this->resource->getMessage(),
            'expiresAt' => $this->resource->getExpiresAt(),
            'status' => $this->resource->getStatus(),
            'createdAt' => $this->resource->getCreatedAt(),
            'updateAt' => $this->resource->getUpdatedAt(),

            'family' => FamilyResource::make($this->resource->relatedFamily()),
            'inviter' => FamilyMemberResource::make($this->resource->relatedInviter()),
        ];
    }
}
