<?php

declare(strict_types=1);

namespace App\Http\Resources\Families\Invitations;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\ResourceCollection;

class FamilyInvitationResourceCollection extends ResourceCollection
{
    public $collects = FamilyInvitationResource::class;

    public function toArray(Request $request): array
    {
        return [
            'success' => true,
            'data' => $this->collection,
            'meta' => [
                'total' => $this->collection->count(),
            ],
        ];
    }
}
