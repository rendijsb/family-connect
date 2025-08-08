<?php

declare(strict_types=1);

namespace App\Http\Controllers\Families;

use App\Http\Requests\Families\CreateFamilyRequest;
use App\Http\Requests\Families\UpdateFamilyRequest;
use App\Http\Resources\Families\FamilyResource;
use App\Services\Repositories\Families\FamilyRepository;

readonly class FamilyController
{
    public function __construct(
        private FamilyRepository $familyRepository,
    )
    {
    }

    public function store(CreateFamilyRequest $request): FamilyResource
    {
        return $request->responseResource(
            $this->familyRepository->createFamily(
                $request->dto(),
            )
        );
    }

    public function update(UpdateFamilyRequest $request): FamilyResource
    {
        return $request->responseResource(
            $this->familyRepository->updateFamily(
                $request->dto(),
            )
        );
    }
}
