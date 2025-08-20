<?php

declare(strict_types=1);

namespace App\Http\Controllers\Families;

use App\Http\Requests\Families\CreateFamilyRequest;
use App\Http\Requests\Families\GetAllFamiliesRequest;
use App\Http\Requests\Families\GetFamilyBySlugRequest;
use App\Http\Requests\Families\GetMyFamiliesRequest;
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
            $this->familyRepository->createFamily($request->dto())
        );
    }

    public function getMyFamilies(GetMyFamiliesRequest $request): FamilyResourceCollection
    {
        return $request->responseResource(
            $this->familyRepository->getMyFamilies()
        );
    }

    public function getFamilyBySlug(GetFamilyBySlugRequest $request): FamilyResource
    {
        return $request->responseResource(
            $this->familyRepository->getFamilyBySlug($request->getFamilySlug())
        );
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
