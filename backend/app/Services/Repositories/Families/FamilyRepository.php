<?php

declare(strict_types=1);

namespace App\Services\Repositories\Families;

use App\Models\Families\Family;
use Illuminate\Support\Collection;

class FamilyRepository
{
    public function __construct(
        private readonly Family $family
    )
    {
    }

    public function getAllFamilies(): Collection
    {
        return $this->family->get();
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
