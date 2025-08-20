<?php

declare(strict_types=1);

namespace App\Http\Resources\Families\Members;

use App\Http\Resources\Families\FamilyResource;
use App\Http\Resources\Users\UserResource;
use App\Models\Families\FamilyMember;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FamilyMemberResource extends JsonResource
{
    /** @var FamilyMember */
    public $resource;

    public function toArray(Request $request): array
    {
        return [
            'id' => $this->resource->getId(),
            'familyId' => $this->resource->getFamilyId(),
            'userId' => $this->resource->getUserId(),
            'role' => $this->resource->getRole(),
            'nickname' => $this->resource->getNickname(),
            'relationship' => $this->resource->getRelationship(),
            'permissions' => $this->resource->getPermissions(),
            'notificationsEnabled' => $this->resource->getNotificationsEnabled(),
            'isActive' => $this->resource->getIsActive(),
            'joinedAt' => $this->resource->getJoinedAt(),
            'lastSeenAt' => $this->resource->getLastSeenAt(),
            'createdAt' => $this->resource->getCreatedAt(),
            'updatedAt' => $this->resource->getUpdatedAt(),

//            'user' => UserResource::make($this->resource->relatedUser()),
//            'family' => FamilyResource::make($this->resource->relatedFamily()),
        ];
    }
}
