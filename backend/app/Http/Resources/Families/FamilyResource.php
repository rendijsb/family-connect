<?php

declare(strict_types=1);

namespace App\Http\Resources\Families;

use App\Enums\Families\FamilyRoleEnum;
use App\Models\Families\Family;
use App\Models\Families\FamilyMember;
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

            'owner' => $this->when(
                $this->includeRelations && $this->resource->relationLoaded('membersRelation'),
                function () {
                    $owner = $this->resource->relatedMembers()->where(FamilyMember::ROLE, '=', FamilyRoleEnum::OWNER)->first();
                    return $owner ? FamilyMemberResource::makeWithoutFamily($owner) : null;
                }
            ),

            'members' => $this->when(
                $this->includeRelations && $this->resource->relationLoaded('membersRelation'),
                function () {
                    return FamilyMemberResourceCollection::makeWithoutFamily($this->resource->relatedMembers());
                }
            ),

            'invitations' => $this->when(
                $this->includeRelations && $this->resource->relationLoaded('invitationsRelation'),
                function () {
                    return FamilyInvitationResourceCollection::makeWithoutFamily($this->resource->relatedInvitations());
                }
            ),
        ];
    }
}
