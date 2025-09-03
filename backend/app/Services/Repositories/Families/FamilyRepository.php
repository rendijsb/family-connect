<?php

declare(strict_types=1);

namespace App\Services\Repositories\Families;

use App\DataTransferObjects\Families\CreateFamilyRequestData;
use App\DataTransferObjects\Families\InviteMemberRequestData;
use App\DataTransferObjects\Families\JoinFamilyRequestData;
use App\DataTransferObjects\Families\UpdateFamilyRequestData;
use App\Enums\Families\FamilyRoleEnum;
use App\Models\Families\Family;
use App\Models\Families\FamilyInvitation;
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
        private readonly FamilyMember $familyMember,
        private readonly FamilyInvitation $familyInvitation
    )
    {
    }

    public function getAllFamilies(): Collection
    {
        return $this->family->with([
            Family::OWNER_RELATION,
            Family::MEMBERS_RELATION . '.' . FamilyMember::USER_RELATION
        ])->where(Family::IS_ACTIVE, true)
        ->get()
        ->map(fn(Family $family) => $this->enrichFamilyWithUserRole($family));
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
            ->whereHas(FamilyMember::FAMILY_RELATION, function ($query) {
                $query->where(Family::IS_ACTIVE, true);
            })
            ->get();

        return $familyMembers->map(fn(FamilyMember $member) =>
            $this->enrichFamilyWithUserRole($member->relatedFamily(), $member->getRole())
        );
    }

    public function getFamilyBySlug(string $slug): Family
    {
        /** @var Family $family */
        $family = $this->family
            ->where(Family::SLUG, $slug)
            ->where(Family::IS_ACTIVE, true)
            ->with([
                Family::OWNER_RELATION,
                Family::MEMBERS_RELATION . '.' . FamilyMember::USER_RELATION
            ])
            ->firstOrFail();

        return $this->enrichFamilyWithUserRole($family);
    }

    public function updateFamily(UpdateFamilyRequestData $data): Family
    {
        /** @var Family $family */
        $family = $this->family->where(Family::SLUG, $data->familySlug)->firstOrFail();

        $updateData = array_filter([
            Family::NAME => $data->name,
            Family::DESCRIPTION => $data->description,
            Family::PRIVACY => $data->privacy,
            Family::LANGUAGE => $data->language,
            Family::TIMEZONE => $data->timezone,
            Family::MAX_MEMBERS => $data->maxMembers,
        ], fn($value) => $value !== null);

        if ($data->name && $data->name !== $family->getName()) {
            $updateData[Family::JOIN_CODE] = $this->generateUniqueJoinCode();
        }

        $family->update($updateData);

        return $this->getFamilyBySlug($family->getSlug());
    }

    public function deleteFamily(string $slug): void
    {
        /** @var Family $family */
        $family = $this->family->where(Family::SLUG, $slug)->firstOrFail();

        $this->familyMember->where(FamilyMember::FAMILY_ID, $family->getId())->delete();

        $family->delete();
    }

    public function leaveFamily(string $slug): void
    {
        /** @var User $user */
        $user = Auth::user();

        /** @var Family $family */
        $family = $this->family->where(Family::SLUG, $slug)->firstOrFail();

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

        /** @var Family $family */
        $family = $this->family
            ->where(Family::JOIN_CODE, $data->joinCode)
            ->where(Family::IS_ACTIVE, true)
            ->firstOrFail();

        $existingMember = $this->familyMember
            ->where(FamilyMember::FAMILY_ID, $family->getId())
            ->where(FamilyMember::USER_ID, $user->getId())
            ->first();

        if ($existingMember) {
            if ($existingMember->getIsActive()) {
                throw new \InvalidArgumentException('You are already a member of this family.');
            }

            $existingMember->update([
                FamilyMember::IS_ACTIVE => true,
                FamilyMember::JOINED_AT => Carbon::now(),
                FamilyMember::LAST_SEEN_AT => Carbon::now(),
            ]);
        } else {
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

    public function generateJoinCode(string $slug): string
    {
        /** @var Family $family */
        $family = $this->family->where(Family::SLUG, $slug)->firstOrFail();

        $newCode = $this->generateUniqueJoinCode();

        $family->update([
            Family::JOIN_CODE => $newCode
        ]);

        return $newCode;
    }

    public function generateJoinCodeAndRefreshFamily(string $slug): Family
    {
        /** @var Family $family */
        $family = $this->family->where(Family::SLUG, $slug)->firstOrFail();

        $newCode = $this->generateUniqueJoinCode();

        $family->update([
            Family::JOIN_CODE => $newCode
        ]);

        // Return the updated family with all relationships
        return $this->getFamilyBySlug($slug);
    }

    public function inviteMember(InviteMemberRequestData $data): void
    {
        /** @var User $inviter */
        $inviter = Auth::user();

        /** @var Family $family */
        $family = $this->family->where(Family::SLUG, $data->familySlug)->firstOrFail();

        // Check if user is already a member
        $existingMember = $this->familyMember
            ->where(FamilyMember::FAMILY_ID, $family->getId())
            ->whereHas(FamilyMember::USER_RELATION, function ($query) use ($data) {
                $query->where(User::EMAIL, $data->email);
            })
            ->where(FamilyMember::IS_ACTIVE, true)
            ->first();

        if ($existingMember) {
            throw new \InvalidArgumentException('This person is already a member of the family.');
        }

        // Check if there's already a pending invitation
        $existingInvitation = $this->familyInvitation
            ->where(FamilyInvitation::FAMILY_ID, $family->getId())
            ->where(FamilyInvitation::EMAIL, $data->email)
            ->where(FamilyInvitation::STATUS, 'pending')
            ->where(FamilyInvitation::EXPIRES_AT, '>', Carbon::now())
            ->first();

        if ($existingInvitation) {
            throw new \InvalidArgumentException('An invitation has already been sent to this email address.');
        }

        // Create new invitation
        $token = Str::random(64);
        $expiresAt = Carbon::now()->addDays(7); // Invitation expires in 7 days

        $this->familyInvitation->create([
            FamilyInvitation::FAMILY_ID => $family->getId(),
            FamilyInvitation::INVITED_BY => $inviter->getId(),
            FamilyInvitation::EMAIL => $data->email,
            FamilyInvitation::TOKEN => $token,
            FamilyInvitation::ROLE => $data->role,
            FamilyInvitation::MESSAGE => $data->message,
            FamilyInvitation::STATUS => 'pending',
            FamilyInvitation::EXPIRES_AT => $expiresAt,
        ]);

        // TODO: Send invitation email
        // For now, we'll just create the invitation record
        // In a real application, you would send an email with the invitation link
        // Mail::to($data->email)->send(new FamilyInvitationMail($family, $inviter, $token, $data->message));
    }

    private function enrichFamilyWithUserRole(Family $family, ?FamilyRoleEnum $userRole = null): Family
    {
        /** @var User $user */
        $user = Auth::user();

        if (!$userRole) {
            $member = $family->relatedMembers()->firstWhere(FamilyMember::USER_ID, $user->getId());
            $userRole = $member?->getRole();
        }

        $family->setAttribute('currentUserRole', $userRole);
        $family->setAttribute('memberCount', $family->relatedMembers()->where(Family::IS_ACTIVE, true)->count());

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
