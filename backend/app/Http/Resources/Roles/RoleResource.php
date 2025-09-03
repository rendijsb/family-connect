<?php

declare(strict_types=1);

namespace App\Http\Resources\Roles;

use App\Models\Roles\Role;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RoleResource extends JsonResource
{
    /**
     * @var Role $resource
     */
    public $resource;

    public function toArray(Request $request): array
    {
        return [
            'id' => $this->resource->getId(),
            'name' => $this->resource->getName(),
            'displayName' => $this->resource->getDisplayName(),
            'description' => $this->resource->getDescription(),
            'isActive' => $this->resource->getIsActive(),
            'createdAt' => $this->resource->getCreatedAt(),
            'updatedAt' => $this->resource->getUpdatedAt(),
        ];
    }
}
