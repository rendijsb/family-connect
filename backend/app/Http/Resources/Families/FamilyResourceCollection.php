<?php

declare(strict_types=1);

namespace App\Http\Resources\Families;

use Illuminate\Http\Resources\Json\ResourceCollection;

class FamilyResourceCollection extends ResourceCollection
{
    public $collects = FamilyResource::class;
}
