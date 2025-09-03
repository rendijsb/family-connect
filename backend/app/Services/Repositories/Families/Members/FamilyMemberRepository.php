<?php

declare(strict_types=1);

namespace App\Services\Repositories\Families\Members;

use App\DataTransferObjects\Families\Members\InviteFamilyMemberRequestData;
use App\DataTransferObjects\Families\Members\SetRelationshipRequestData;
use App\DataTransferObjects\Families\Members\UpdateFamilyMemberRequestData;
use App\DataTransferObjects\Families\Members\UpdateFamilyMemberRoleRequestData;
use App\Enums\Families\RelationshipTypeEnum;
use App\Models\Families\Family;
use App\Models\Families\FamilyInvitation;
use App\Models\Families\FamilyMember;
use App\Models\Families\FamilyMemberRelationship;
use App\Models\Users\User;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class FamilyMemberRepository
{
    public function __construct(
        private readonly FamilyMember $familyMember,
        private readonly FamilyMemberRelationship $familyMemberRelationship,
        private readonly FamilyInvitation $familyInvitation,
        private readonly Family $family
    )
    {
    }

    public function getAllFamilyMembers(string $slug): Collection
    {
        /** @var Family $family */
        $family = $this->family
            ->where(Family::SLUG, $slug)
            ->where(Family::IS_ACTIVE, true)
            ->firstOrFail();

        return $family->relatedMembers()
            ->where(FamilyMember::IS_ACTIVE, true)
            ->with([FamilyMember::USER_RELATION])
            ->orderBy(FamilyMember::ROLE, 'asc')
            ->orderBy(FamilyMember::CREATED_AT, 'asc')
            ->get();
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

    public function inviteFamilyMember(InviteFamilyMemberRequestData $data): void
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

    public function updateFamilyMember(UpdateFamilyMemberRequestData $data): FamilyMember
    {
        /** @var Family $family */
        $family = $this->family->where(Family::SLUG, $data->familySlug)->firstOrFail();

        /** @var FamilyMember $member */
        $member = $family->relatedMembers()->where(FamilyMember::ID, $data->memberId)->firstOrFail();

        $updateData = array_filter([
            FamilyMember::NICKNAME => $data->nickname,
            FamilyMember::PHONE => $data->phone,
            FamilyMember::BIRTHDAY => $data->birthday,
            FamilyMember::AVATAR => $data->avatar,
            FamilyMember::NOTIFICATIONS_ENABLED => $data->notificationsEnabled,
        ], fn($value) => $value !== null);

        $member->update($updateData);

        return $member->refresh();
    }

    public function setRelationship(SetRelationshipRequestData $data): void
    {
        /** @var Family $family */
        $family = $this->family->where(Family::SLUG, $data->familySlug)->firstOrFail();

        // Check if both members exist in the family
        $member1 = $family->relatedMembers()->where(FamilyMember::ID, $data->memberId)->firstOrFail();
        $member2 = $family->relatedMembers()->where(FamilyMember::ID, $data->relatedMemberId)->firstOrFail();

        // Remove existing relationship if any
        $this->familyMemberRelationship
            ->where(function ($query) use ($data) {
                $query->where(FamilyMemberRelationship::MEMBER_ID, $data->memberId)
                      ->where(FamilyMemberRelationship::RELATED_MEMBER_ID, $data->relatedMemberId);
            })
            ->orWhere(function ($query) use ($data) {
                $query->where(FamilyMemberRelationship::MEMBER_ID, $data->relatedMemberId)
                      ->where(FamilyMemberRelationship::RELATED_MEMBER_ID, $data->memberId);
            })
            ->delete();

        // Create new relationship
        $this->familyMemberRelationship->create([
            FamilyMemberRelationship::FAMILY_ID => $family->getId(),
            FamilyMemberRelationship::MEMBER_ID => $data->memberId,
            FamilyMemberRelationship::RELATED_MEMBER_ID => $data->relatedMemberId,
            FamilyMemberRelationship::RELATIONSHIP_TYPE => $data->relationshipType,
            FamilyMemberRelationship::IS_GUARDIAN => $data->isGuardian,
        ]);

        // Create reciprocal relationship if needed
        $reciprocalType = $this->getReciprocalRelationshipType($data->relationshipType);
        if ($reciprocalType) {
            $this->familyMemberRelationship->create([
                FamilyMemberRelationship::FAMILY_ID => $family->getId(),
                FamilyMemberRelationship::MEMBER_ID => $data->relatedMemberId,
                FamilyMemberRelationship::RELATED_MEMBER_ID => $data->memberId,
                FamilyMemberRelationship::RELATIONSHIP_TYPE => $reciprocalType,
                FamilyMemberRelationship::IS_GUARDIAN => false, // Only one direction can be guardian
            ]);
        }
    }

    private function getReciprocalRelationshipType(RelationshipTypeEnum $relationshipType): ?RelationshipTypeEnum
    {
        return match ($relationshipType) {
            RelationshipTypeEnum::PARENT => RelationshipTypeEnum::CHILD,
            RelationshipTypeEnum::CHILD => RelationshipTypeEnum::PARENT,
            RelationshipTypeEnum::SIBLING => RelationshipTypeEnum::SIBLING,
            RelationshipTypeEnum::SPOUSE => RelationshipTypeEnum::SPOUSE,
            RelationshipTypeEnum::GRANDPARENT => RelationshipTypeEnum::GRANDCHILD,
            RelationshipTypeEnum::GRANDCHILD => RelationshipTypeEnum::GRANDPARENT,
            RelationshipTypeEnum::AUNT_UNCLE => RelationshipTypeEnum::NEPHEW_NIECE,
            RelationshipTypeEnum::NEPHEW_NIECE => RelationshipTypeEnum::AUNT_UNCLE,
            RelationshipTypeEnum::COUSIN => RelationshipTypeEnum::COUSIN,
            default => null,
        };
    }
}
