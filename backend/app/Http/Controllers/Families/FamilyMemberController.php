<?php

declare(strict_types=1);

namespace App\Http\Controllers\Families;


use App\DataTransferObjects\Families\Members\SetRelationshipRequestData;
use App\Enums\Families\FamilyRoleEnum;
use App\Http\Requests\Families\Members\DeleteFamilyMemberRequest;
use App\Http\Requests\Families\Members\GetAllFamilyMembersRequest;
use App\Http\Requests\Families\Members\InviteFamilyMemberRequest;
use App\Http\Requests\Families\Members\SetRelationshipRequest;
use App\Http\Requests\Families\Members\UpdateFamilyMemberRequest;
use App\Models\Families\FamilyMember;
use App\Http\Resources\Families\Members\FamilyMemberResource;
use App\Http\Resources\Families\Members\FamilyMemberResourceCollection;
use App\Services\Repositories\Families\Members\FamilyMemberRepository;
use Illuminate\Http\JsonResponse;

class FamilyMemberController
{
    public function __construct(
        private readonly FamilyMemberRepository $familyMemberRepository
    )
    {
    }

    public function getAllFamilyMembers(GetAllFamilyMembersRequest $request): FamilyMemberResourceCollection
    {
        return $request->responseResource(
            $this->familyMemberRepository->getAllFamilyMembers($request->getFamilySlug())
        );
    }

    public function inviteFamilyMember(InviteFamilyMemberRequest $request): JsonResponse
    {
        $family = $request->get('_family');
        $familyMember = $request->get('_family_member');

        if (!$family || !$familyMember || !$this->canInviteMembers($familyMember)) {
            abort(403, 'You do not have permission to invite members to this family.');
        }

        try {
            $this->familyMemberRepository->inviteFamilyMember($request->dto());

            return response()->json([
                'success' => true,
                'message' => 'Invitation sent successfully.'
            ], 200);
        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 422);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to send invitation. Please try again.'
            ], 500);
        }
    }

    public function updateFamilyMemberRole(UpdateFamilyMemberRoleRequest $request): FamilyMemberResource
    {
        return $request->responseResource(
            $this->familyMemberRepository->updateFamilyMemberRole($request->dto())
        );
    }

    public function deleteFamilyMember(DeleteFamilyMemberRequest $request): JsonResponse
    {
        $this->familyMemberRepository->deleteFamilyMember($request->getFamilySlug(), $request->getFamilyMemberId());

        return response()->json([
            'success' => true,
            'message' => 'Family member deleted successfully.',
        ], 200);
    }

    public function updateFamilyMember(UpdateFamilyMemberRequest $request): FamilyMemberResource
    {
        $family = $request->get('_family');
        $familyMember = $request->get('_family_member');

        if (!$family || !$familyMember || !$this->canManageMembers($familyMember)) {
            abort(403, 'You do not have permission to update family members.');
        }

        return $request->responseResource(
            $this->familyMemberRepository->updateFamilyMember($request->dto())
        );
    }

    public function setRelationship(SetRelationshipRequest $request): JsonResponse
    {
        $family = $request->get('_family');
        $familyMember = $request->get('_family_member');

        if (!$family || !$familyMember) {
            abort(403, 'You do not have access to this family.');
        }

        // Allow any family member to set relationships involving themselves
        // Or allow moderators/owners to set any relationships
        if (!$this->canSetRelationship($familyMember, $request->dto())) {
            abort(403, 'You do not have permission to set this relationship.');
        }

        $this->familyMemberRepository->setRelationship($request->dto());

        return response()->json([
            'success' => true,
            'message' => 'Relationship updated successfully.'
        ], 200);
    }

    private function canInviteMembers(FamilyMember $member): bool
    {
        return in_array($member->getRole(), [
            FamilyRoleEnum::OWNER,
            FamilyRoleEnum::MODERATOR,
        ]);
    }

    private function canManageMembers(FamilyMember $member): bool
    {
        return in_array($member->getRole(), [
            FamilyRoleEnum::OWNER,
            FamilyRoleEnum::MODERATOR,
        ]);
    }

    private function canSetRelationship(FamilyMember $currentMember, SetRelationshipRequestData $data): bool
    {
        // Owners and moderators can set any relationships
        if (in_array($currentMember->getRole(), [FamilyRoleEnum::OWNER, FamilyRoleEnum::MODERATOR])) {
            return true;
        }

        // Any member can set relationships involving themselves
        return $data->memberId === $currentMember->getId() || $data->relatedMemberId === $currentMember->getId();
    }
}
