<?php

declare(strict_types=1);

namespace App\Http\Resources\Families;

use App\Models\Families\Family;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FamilyResource extends JsonResource
{
    /** @var Family */
    public $resource;

    public function toArray(Request $request): array
    {
        return [
            'id' => $this->resource->getId(),
            'name' => $this->resource->getName(),
            'description' => $this->resource->getDescription(),
            'avatar' => $this->resource->getAvatar(),
            'ownerId' => $this->resource->getOwnerId(),
            'privacyLevel' => $this->resource->getPrivacyLevel(),
            'settings' => $this->resource->getSettings(),
            'memberCount' => $this->resource->getMemberCount(),
            'createdAt' => $this->resource->getCreatedAt(),
            'updateAt' => $this->resource->getUpdatedAt(),

            'owner' => FamilyMemberResource::make($this->resource->relatedOwner()),
            'members' => FamilyMemberResourceCollection::make($this->resource->relatedMembers()),
            'invitations' => FamilyInvitationResourceCollection::make($this->resource->relatedInvitations()),
        ];
    }
}
