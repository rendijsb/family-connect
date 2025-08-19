<?php

declare(strict_types=1);

namespace App\Http\Controllers\Families;

use App\Http\Requests\Families\GetAllFamilyRequest;
use App\Services\Repositories\Families\FamilyRepository;

class FamilyController
{
    public function __construct(
        private FamilyRepository $familyRepository,
    )
    {
    }

    public function getAllFamilies(GetAllFamilyRequest $request): FamilyResourceCollection
    {
        return $request->responseResource(
            $this->familyRepository->getAllFamilies()
        );
    }

    public function createFamily()
    {

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
