<?php

declare(strict_types=1);

namespace App\Http\Resources\Families;

use App\Models\Families\Family;
use Illuminate\Http\Resources\Json\JsonResource;

class FamilyResource extends JsonResource
{
    /** @var Family */
    public $resource;

    public function toArray($request): array
    {
        return [
            'id' => $this->resource->getId(),
            'name' => $this->resource->getName(),
            'description' => $this->resource->getDescription(),
            'settings' => $this->resource->getSettings(),
            'created_at' => $this->resource->getCreatedAt(),
            'updated_at' => $this->resource->getUpdatedAt(),
            'familyMembers' => FamilyMemberResource::make($this->resource->relatedMembers()),
        ];
    }
}
