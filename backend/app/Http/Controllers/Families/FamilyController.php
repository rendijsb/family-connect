<?php

declare(strict_types=1);

namespace App\Http\Controllers\Families;

use App\Http\Requests\Families\GetAllFamiliesRequest;
use App\Http\Resources\Families\FamilyResource;
use App\Http\Resources\Families\FamilyResourceCollection;
use App\Services\Repositories\Families\FamilyRepository;

class FamilyController
{
    public function __construct(
        private FamilyRepository $familyRepository,
    )
    {
    }

    public function getAllFamilies(GetAllFamiliesRequest $request): FamilyResourceCollection
    {
        return $request->responseResource(
            $this->familyRepository->getAllFamilies()
        );
    }

    public function createFamily(CreateFamilyRequest $request): FamilyResource
    {
        return $request->responseResource(
            $this->familyRepository->createFamily()
        );
    }

    public function getMyFamilies()
    {

    }

    public function getFamilyBySlug()
    {

    }

    public function updateFamily()
    {

    }

    public function deleteFamily()
    {

    }

    public function leaveFamily()
    {

    }

    public function joinFamilyByCode()
    {

    }
}
