<?php

declare(strict_types=1);

namespace App\Http\Controllers\Families;

use App\Http\Requests\Families\CreateFamilyRequest;
use App\Http\Requests\Families\DeleteFamilyRequest;
use App\Http\Requests\Families\GetAllFamiliesRequest;
use App\Http\Requests\Families\GetFamilyRequest;
use App\Http\Requests\Families\UpdateFamilyRequest;
use App\Http\Resources\Families\FamilyResource;
use App\Http\Resources\Families\FamilyResourceCollection;
use App\Services\Repositories\Families\FamilyRepository;
use Illuminate\Http\JsonResponse;

readonly class FamilyController
{
    public function __construct(
        private FamilyRepository $familyRepository
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

    public function getFamily(GetFamilyRequest $request): FamilyResource
    {
        return $request->responseResource(
            $this->familyRepository->getFamilyById($request->getFamilyId())
        );
    }

    public function updateFamily(UpdateFamilyRequest $request): FamilyResource
    {
        return $request->responseResource(
            $this->familyRepository->updateFamily($request->dto())
        );
    }

    public function deleteFamily(DeleteFamilyRequest $request): JsonResponse
    {
        return $this->familyRepository->deleteFamily($request->getFamilyId());
    }

    public function getUserFamilies(GetAllFamiliesRequest $request): FamilyResourceCollection
    {
        return $request->responseResource(
            $this->familyRepository->getUserFamilies()
        );
    }

    public function leaveFamily(GetFamilyRequest $request): JsonResponse
    {
        return $this->familyRepository->leaveFamily($request->getFamilyId());
    }
}
