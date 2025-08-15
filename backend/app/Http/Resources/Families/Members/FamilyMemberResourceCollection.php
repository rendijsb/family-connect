<?php

declare(strict_types=1);

namespace App\Http\Resources\Families\Members;

use Illuminate\Http\Resources\Json\ResourceCollection;

class FamilyMemberResourceCollection extends ResourceCollection
{
    public $collects = FamilyMemberResource::class;
}
