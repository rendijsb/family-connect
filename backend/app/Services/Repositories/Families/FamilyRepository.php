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
        return $this->family->with([
            Family::OWNER_RELATION,
            Family::MEMBERS_RELATION . '.' . FamilyMember::USER_RELATION
        ])->get()->map(function (Family $family) {
            return $this->enrichFamilyWithUserRole($family);
        });
    }

    public function createFamily(CreateFamilyRequestData $data): Family
    {
        /** @var User $owner */
        $owner = Auth::user();

        $slug = $this->generateUniqueSlug($data->name);
        $code = $this->generateUniqueJoinCode();

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

        $this->familyMember->create([
            FamilyMember::FAMILY_ID => $family->getId(),
            FamilyMember::USER_ID => $owner->getId(),
            FamilyMember::ROLE => FamilyRoleEnum::OWNER,
            FamilyMember::JOINED_AT => Carbon::now(),
            FamilyMember::LAST_SEEN_AT => Carbon::now(),
            FamilyMember::IS_ACTIVE => true,
            FamilyMember::NOTIFICATIONS_ENABLED => true,
            FamilyMember::PERMISSIONS => FamilyRoleEnum::OWNER->getPermissions(),
        ]);

        $family->load([
            Family::OWNER_RELATION,
            Family::MEMBERS_RELATION . '.' . FamilyMember::USER_RELATION
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

        $familyMembers = $this->familyMember
            ->where(FamilyMember::USER_ID, $user->getId())
            ->where(FamilyMember::IS_ACTIVE, true)
            ->with([
                FamilyMember::FAMILY_RELATION . '.' . Family::OWNER_RELATION,
                FamilyMember::FAMILY_RELATION . '.' . Family::MEMBERS_RELATION . '.' . FamilyMember::USER_RELATION
            ])
            ->get();

        return $familyMembers->map(function (FamilyMember $member) {
            $family = $member->relatedFamily();
            return $this->enrichFamilyWithUserRole($family, $member->getRole());
        });
    }

    public function getFamilyBySlug(string $slug): Family
    {
        $family = $this->family
            ->where(Family::SLUG, $slug)
            ->with([
                Family::OWNER_RELATION,
                Family::MEMBERS_RELATION . '.' . FamilyMember::USER_RELATION
            ])
            ->firstOrFail();

        return $this->enrichFamilyWithUserRole($family);
    }

    public function updateFamily(UpdateFamilyRequestData $data): Family
    {
        $family = $this->family->where(Family::SLUG, $data->familySlug)->firstOrFail();

        $updateData = array_filter([
            Family::NAME => $data->name,
            Family::DESCRIPTION => $data->description,
            Family::PRIVACY => $data->privacy,
            Family::LANGUAGE => $data->language,
            Family::TIMEZONE => $data->timezone,
            Family::MAX_MEMBERS => $data->maxMembers,
        ], fn($value) => $value !== null);

        // Generate new join code if name changed
        if ($data->name && $data->name !== $family->getName()) {
            $updateData[Family::JOIN_CODE] = $this->generateUniqueJoinCode();
        }

        $family->update($updateData);

        return $this->getFamilyBySlug($family->getSlug());
    }

    public function deleteFamily(string $slug): void
    {
        $family = $this->family->where(Family::SLUG, $slug)->firstOrFail();

        // Delete all family members first (cascade should handle this, but being explicit)
        $this->familyMember->where(FamilyMember::FAMILY_ID, $family->getId())->delete();

        $family->delete();
    }

    public function leaveFamily(string $slug): void
    {
        /** @var User $user */
        $user = Auth::user();

        $family = $this->family->where(Family::SLUG, $slug)->firstOrFail();

        // Owner cannot leave, they must delete the family
        if ($family->getOwnerId() === $user->getId()) {
            throw new \InvalidArgumentException('Family owner cannot leave. Delete the family instead.');
        }

        $this->familyMember
            ->where(FamilyMember::FAMILY_ID, $family->getId())
            ->where(FamilyMember::USER_ID, $user->getId())
            ->delete();
    }

    public function joinFamilyByCode(JoinFamilyRequestData $data): Family
    {
        /** @var User $user */
        $user = Auth::user();

        $family = $this->family
            ->where(Family::JOIN_CODE, $data->joinCode)
            ->where(Family::IS_ACTIVE, true)
            ->firstOrFail();

        // Check if user is already a member
        $existingMember = $this->familyMember
            ->where(FamilyMember::FAMILY_ID, $family->getId())
            ->where(FamilyMember::USER_ID, $user->getId())
            ->first();

        if ($existingMember) {
            if ($existingMember->getIsActive()) {
                throw new \InvalidArgumentException('You are already a member of this family.');
            }

            // Reactivate membership
            $existingMember->update([
                FamilyMember::IS_ACTIVE => true,
                FamilyMember::JOINED_AT => Carbon::now(),
                FamilyMember::LAST_SEEN_AT => Carbon::now(),
            ]);
        } else {
            // Create new membership
            $this->familyMember->create([
                FamilyMember::FAMILY_ID => $family->getId(),
                FamilyMember::USER_ID => $user->getId(),
                FamilyMember::ROLE => FamilyRoleEnum::MEMBER,
                FamilyMember::JOINED_AT => Carbon::now(),
                FamilyMember::LAST_SEEN_AT => Carbon::now(),
                FamilyMember::IS_ACTIVE => true,
                FamilyMember::NOTIFICATIONS_ENABLED => true,
                FamilyMember::PERMISSIONS => FamilyRoleEnum::MEMBER->getPermissions(),
            ]);
        }

        return $this->getFamilyBySlug($family->getSlug());
    }

    private function enrichFamilyWithUserRole(Family $family, ?FamilyRoleEnum $userRole = null): Family
    {
        /** @var User $user */
        $user = Auth::user();

        if (!$userRole) {
            $member = $family->relatedMembers()->firstWhere('user_id', $user->getId());
            $userRole = $member?->getRole();
        }

        // Add current user role and member count to family
        $family->setAttribute('currentUserRole', $userRole);
        $family->setAttribute('memberCount', $family->relatedMembers()->where('is_active', true)->count());

        return $family;
    }

    private function generateUniqueSlug(string $name): string
    {
        $baseSlug = Str::slug($name);
        $slug = $baseSlug;
        $counter = 1;

        while ($this->family->where(Family::SLUG, $slug)->exists()) {
            $slug = $baseSlug . '-' . $counter;
            $counter++;
        }

        return $slug;
    }

    private function generateUniqueJoinCode(): string
    {
        do {
            $code = strtoupper(Str::random(8));
        } while ($this->family->where(Family::JOIN_CODE, $code)->exists());

        return $code;
    }
}
