<?php

declare(strict_types=1);

namespace App\Services\Repositories\Families\Invitations;

use App\Enums\Families\FamilyRoleEnum;
use App\Models\Families\Family;
use App\Models\Families\FamilyInvitation;
use App\Models\Families\FamilyMember;
use App\Models\Users\User;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;

class InvitationRepository
{
    public function __construct(
        private readonly FamilyInvitation $familyInvitation,
        private readonly FamilyMember $familyMember,
        private readonly Family $family,
        private readonly User $user
    )
    {
    }

    public function getPendingInvitations(): Collection
    {
        /** @var User $user */
        $user = Auth::user();

        return $this->familyInvitation
            ->where(FamilyInvitation::EMAIL, $user->getEmail())
            ->where(FamilyInvitation::STATUS, 'pending')
            ->where(FamilyInvitation::EXPIRES_AT, '>', Carbon::now())
            ->with([
                FamilyInvitation::FAMILY_RELATION,
                FamilyInvitation::INVITED_BY_RELATION
            ])
            ->get();
    }

    public function acceptInvitation(string $token): Family
    {
        /** @var User $user */
        $user = Auth::user();

        /** @var FamilyInvitation $invitation */
        $invitation = $this->familyInvitation
            ->where(FamilyInvitation::TOKEN, $token)
            ->where(FamilyInvitation::EMAIL, $user->getEmail())
            ->where(FamilyInvitation::STATUS, 'pending')
            ->where(FamilyInvitation::EXPIRES_AT, '>', Carbon::now())
            ->firstOrFail();

        $family = $invitation->relatedFamily();

        if (!$family || !$family->getIsActive()) {
            throw new \InvalidArgumentException('This family is no longer active.');
        }

        // Check if user is already a member
        $existingMember = $this->familyMember
            ->where(FamilyMember::FAMILY_ID, $family->getId())
            ->where(FamilyMember::USER_ID, $user->getId())
            ->where(FamilyMember::IS_ACTIVE, true)
            ->first();

        if ($existingMember) {
            throw new \InvalidArgumentException('You are already a member of this family.');
        }

        // Create family member
        $this->familyMember->create([
            FamilyMember::FAMILY_ID => $family->getId(),
            FamilyMember::USER_ID => $user->getId(),
            FamilyMember::ROLE => $invitation->getRole(),
            FamilyMember::JOINED_AT => Carbon::now(),
            FamilyMember::LAST_SEEN_AT => Carbon::now(),
            FamilyMember::IS_ACTIVE => true,
            FamilyMember::NOTIFICATIONS_ENABLED => true,
            FamilyMember::PERMISSIONS => $invitation->getRole()->getPermissions(),
        ]);

        // Update invitation status
        $invitation->update([
            FamilyInvitation::STATUS => 'accepted',
            FamilyInvitation::ACCEPTED_AT => Carbon::now(),
        ]);

        // Load family with relationships and return
        return $family->load([
            Family::OWNER_RELATION,
            Family::MEMBERS_RELATION . '.' . FamilyMember::USER_RELATION
        ]);
    }

    public function declineInvitation(string $token): void
    {
        /** @var User $user */
        $user = Auth::user();

        /** @var FamilyInvitation $invitation */
        $invitation = $this->familyInvitation
            ->where(FamilyInvitation::TOKEN, $token)
            ->where(FamilyInvitation::EMAIL, $user->getEmail())
            ->where(FamilyInvitation::STATUS, 'pending')
            ->where(FamilyInvitation::EXPIRES_AT, '>', Carbon::now())
            ->firstOrFail();

        $invitation->update([
            FamilyInvitation::STATUS => 'declined',
            FamilyInvitation::DECLINED_AT => Carbon::now(),
        ]);
    }

    public function cancelInvitation(int $invitationId): void
    {
        /** @var User $user */
        $user = Auth::user();

        /** @var FamilyInvitation $invitation */
        $invitation = $this->familyInvitation
            ->where(FamilyInvitation::ID, $invitationId)
            ->where(FamilyInvitation::STATUS, 'pending')
            ->with([FamilyInvitation::FAMILY_RELATION])
            ->firstOrFail();

        $family = $invitation->relatedFamily();

        if (!$family) {
            throw new \InvalidArgumentException('Family not found.');
        }

        // Check if user has permission to cancel (must be the inviter or family owner/moderator)
        $familyMember = $this->familyMember
            ->where(FamilyMember::FAMILY_ID, $family->getId())
            ->where(FamilyMember::USER_ID, $user->getId())
            ->where(FamilyMember::IS_ACTIVE, true)
            ->first();

        $canCancel = $invitation->getInvitedBy() === $user->getId() || 
                     ($familyMember && in_array($familyMember->getRole(), [
                         FamilyRoleEnum::OWNER,
                         FamilyRoleEnum::MODERATOR,
                     ]));

        if (!$canCancel) {
            throw new \InvalidArgumentException('You do not have permission to cancel this invitation.');
        }

        $invitation->update([
            FamilyInvitation::STATUS => 'expired',
        ]);
    }
}
