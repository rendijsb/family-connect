<?php

declare(strict_types=1);

namespace App\Http\Resources\Families;

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
            'joinedAt' => $this->resource->getJoinedAt(),
            'status' => $this->resource->getStatus(),
            'permissions' => $this->resource->getPermissions(),
            'lastActiveAt' => $this->resource->getLastActiveAt(),

            'user' => UserResource::make($this->resource->relatedUser()),
            'family' => FamilyResource::make($this->resource->relatedFamily()),

            'createdAt' => $this->resource->getCreatedAt(),
            'updateAt' => $this->resource->getUpdatedAt(),
        ];
    }
}
