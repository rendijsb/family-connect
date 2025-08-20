<?php

declare(strict_types=1);

namespace App\Services\Repositories\Families;

use App\DataTransferObjects\Families\CreateFamilyRequestData;
use App\DataTransferObjects\Families\JoinFamilyRequestData;
use App\DataTransferObjects\Families\UpdateFamilyRequestData;
use App\Enums\Families\FamilyRoleEnum;
use App\Models\Families\Family;
use App\Models\Families\FamilyMember;
use App\Models\Users\User;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class FamilyRepository
{
    public function __construct(
        private readonly Family $family,
        private readonly FamilyMember $familyMember
    )
    {
    }

    public function getAllFamilies(): Collection
    {
        return $this->family->get();
    }

    public function createFamily(CreateFamilyRequestData $data): Family
    {
        /** @var User $owner */
        $owner = Auth::user();

        $slug = Str::slug($data->name);
        $code = Str::random(8);

        $payload = [
            Family::NAME => $data->name,
            Family::SLUG => $slug,
            Family::JOIN_CODE => $code,
            Family::DESCRIPTION => $data->description,
            Family::PRIVACY => $data->privacy,
            Family::LANGUAGE => $data->language,
            Family::TIMEZONE => $data->timezone,
            Family::MAX_MEMBERS => $data->maxMembers,
            Family::OWNER_ID => $owner->getId(),
            Family::IS_ACTIVE => true,
        ];

        /** @var Family $family */
        $family = $this->family->create($payload);

        $payload = [
            FamilyMember::FAMILY_ID => $family->getId(),
            FamilyMember::USER_ID => $owner->getId(),
            FamilyMember::ROLE => FamilyRoleEnum::OWNER,
            FamilyMember::JOINED_AT => Carbon::now(),
            FamilyMember::LAST_SEEN_AT => Carbon::now(),
            FamilyMember::IS_ACTIVE => false,
            FamilyMember::NOTIFICATIONS_ENABLED => true,
            FamilyMember::PERMISSIONS => FamilyRoleEnum::OWNER->getPermissions(),
        ];

        $this->familyMember->create($payload);

        $family->load([
            Family::OWNER_RELATION,
            Family::MEMBERS_RELATION . '.userRelation'
        ]);

        return $family->refresh();
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

    public function updateFamily(UpdateFamilyRequestData $data): Family
    {
        $code = Str::random(8);

        $payload = [
            Family::NAME => $data->name,
            Family::JOIN_CODE => $code,
            Family::DESCRIPTION => $data->description,
            Family::PRIVACY => $data->privacy,
            Family::LANGUAGE => $data->language,
            Family::TIMEZONE => $data->timezone,
            Family::MAX_MEMBERS => $data->maxMembers,
        ];

        /** @var Family $family */
        $family = $this->family->where(Family::SLUG, $data->familySlug)
            ->first();

        $family->update($payload);

        return $family->refresh();
    }

    public function deleteFamily(string $slug): void
    {
        $family = $this->family->where(Family::SLUG, $slug)
            ->firstOrFail();

        $family->delete();
    }

    public function leaveFamily()
    {

    }

    public function joinFamilyByCode(JoinFamilyRequestData $data): Family
    {
        /** @var User $user */
        $user = Auth::user();

        /** @var Family $family */
        $family = $this->family->where(Family::JOIN_CODE, '=', $data->joinCode)->firstOrFail();

        $payload = [
            FamilyMember::FAMILY_ID => $family->getId(),
            FamilyMember::USER_ID => $user->getId(),
            FamilyMember::ROLE => FamilyRoleEnum::MEMBER,
            FamilyMember::JOINED_AT => Carbon::now(),
            FamilyMember::LAST_SEEN_AT => Carbon::now(),
            FamilyMember::IS_ACTIVE => false,
            FamilyMember::NOTIFICATIONS_ENABLED => true,
        ];

        $this->familyMember->create($payload);

        return $family->refresh();
    }
}
