<?php

declare(strict_types=1);

namespace App\Services\Repositories\Families;

use App\DataTransferObjects\Families\CreateFamilyRequestData;
use App\Models\Families\Family;
use App\Models\Users\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;

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

    public function createFamily(CreateFamilyRequestData $data): Family
    {
        $owner = Auth::user();

        $payload = [
            Family::NAME => $data->name,
            Family::SLUG => $data->slug,
            Family::DESCRIPTION => $data->description,
            Family::PRIVACY => $data->privacy,
            Family::LANGUAGE => $data->language,
            Family::TIMEZONE => $data->timezone,
            Family::MAX_MEMBERS => $data->maxMembers,
            Family::OWNER_ID => $owner->getId(),
        ];


    }

    /**
     * @return Collection<Family>
     */
    public function getMyFamilies(): Collection
    {
        /** @var User $user */
        $user = Auth::user();

        $relatedMembers = $user->relatedFamilyMembers();

        $families = Collection::make();

        foreach ($relatedMembers as $relatedMember) {
            $families->add($relatedMember->relatedFamily());
        }

        return $families;
    }

    public function getFamilyBySlug(string $slug): Family
    {
        return $this->family->where(Family::SLUG, $slug)
            ->first();
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
