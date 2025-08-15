<?php

declare(strict_types=1);

namespace App\Http\Resources\Families\Invitations;

use Illuminate\Http\Resources\Json\ResourceCollection;

class FamilyInvitationResourceCollection extends ResourceCollection
{
    public $collects = FamilyInvitationResource::class;
}
