<?php

declare(strict_types=1);

namespace App\Http\Resources\Families;

use Illuminate\Http\Resources\Json\ResourceCollection;

class FamilyInvitationResourceCollection extends ResourceCollection
{
    public $collects = FamilyInvitationResource::class;
}
