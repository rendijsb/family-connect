<?php

declare(strict_types=1);

namespace App\Services\Repositories\Families\Members;

use App\DataTransferObjects\Families\Members\UpdateFamilyMemberRoleRequestData;
use App\Models\Families\Family;
use App\Models\Families\FamilyMember;
use App\Models\Families\FamilyMemberRelationship;
use Illuminate\Support\Collection;

class FamilyMemberRepository
{
    public function __construct(
        private readonly FamilyMember $familyMember,
        private readonly FamilyMemberRelationship $familyMemberRelationship,
        private readonly Family $family
    )
    {
    }

    public function getAllFamilyMembers(string $slug): Collection
    {
        /** @var Family $family */
        $family = $this->family->where(Family::SLUG, $slug)->firstOrFail();

        return $family->relatedMembers();
    }

    public function updateFamilyMemberRole(UpdateFamilyMemberRoleRequestData $data): FamilyMember
    {
        /** @var Family $family */
        $family = $this->family->where(Family::SLUG, '=', $data->familySlug)->firstOrFail();

        /** @var FamilyMember $member */
        $member = $family->relatedMembers()->where(FamilyMember::ID, '=', $data->memberId)->firstOrFail();

        $member->update([
            FamilyMember::ROLE => $data->role,
        ]);

        return $member->refresh();
    }

    public function deleteFamilyMember(string $familySlug, int $memberId): void
    {
        /** @var Family $family */
        $family = $this->family->where(Family::SLUG, '=', $familySlug)->firstOrFail();

        /** @var FamilyMember $member */
        $member = $family->relatedMembers()->where(FamilyMember::ID, '=', $memberId)->firstOrFail();

        $member->delete();
    }
}
