<?php

declare(strict_types=1);

namespace App\Http\Resources\Images;

use Illuminate\Http\Resources\Json\ResourceCollection;

class ImageResourceCollection extends ResourceCollection
{
    public $collects = ImageResource::class;
}
