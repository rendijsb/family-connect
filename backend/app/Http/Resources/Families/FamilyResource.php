<?php

declare(strict_types=1);

namespace App\Http\Resources\Families;

use App\Http\Resources\Families\Members\FamilyMemberResourceCollection;
use App\Http\Resources\Users\UserResource;
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
            'slug' => $this->resource->getSlug(),
            'description' => $this->resource->getDescription(),
            'ownerId' => $this->resource->getOwnerId(),
            'privacy' => $this->resource->getPrivacy(),
            'joinCode' => $this->resource->getJoinCode(),
            'settings' => $this->resource->getSettings(),
            'timezone' => $this->resource->getTimezone(),
            'language' => $this->resource->getLanguage(),
            'maxMembers' => $this->resource->getMaxMembers(),
            'isActive' => $this->resource->getIsActive(),
            'lastActivityAt' => $this->resource->getLastActivityAt(),
            'createdAt' => $this->resource->getCreatedAt(),
            'updatedAt' => $this->resource->getUpdatedAt(),

            'memberCount' => $this->resource->getAttribute('memberCount') ?? 0,
            'currentUserRole' => $this->resource->getAttribute('currentUserRole')?->value,

            'members' => FamilyMemberResourceCollection::make($this->resource->relatedMembers()),
            'owner' => UserResource::make($this->resource->relatedOwner()),
        ];
    }
}
