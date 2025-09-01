<?php

declare(strict_types=1);

namespace App\Http\Requests\Families;

use App\Http\Resources\Families\FamilyResourceCollection;
use Illuminate\Support\Collection;

class GetMyFamiliesRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [];
    }

    public function responseResource(Collection $familyList): FamilyResourceCollection
    {
        return new FamilyResourceCollection($familyList);
    }
}
