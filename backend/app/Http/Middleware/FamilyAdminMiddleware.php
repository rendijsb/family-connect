<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Enums\Families\FamilyRoleEnum;
use App\Models\Families\Family;
use App\Models\Families\Members\FamilyMember;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class FamilyAdminMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Authentication required.'
            ], 401);
        }

        // Get family ID from route parameters
        $familyId = $this->getFamilyIdFromRequest($request);

        if (!$familyId) {
            return response()->json([
                'success' => false,
                'message' => 'Family not specified in request.'
            ], 400);
        }

        // Check if family exists
        $family = Family::find($familyId);
        if (!$family) {
            return response()->json([
                'success' => false,
                'message' => 'Family not found.'
            ], 404);
        }

        // Get user's membership in this family
        $membership = FamilyMember::where(FamilyMember::FAMILY_ID, $familyId)
            ->where(FamilyMember::USER_ID, $user->getId())
            ->where(FamilyMember::STATUS, 'active')
            ->first();

        if (!$membership) {
            return response()->json([
                'success' => false,
                'message' => 'You are not a member of this family.'
            ], 403);
        }

        // Check if user has admin privileges (owner or admin role)
        $userRole = $membership->getRole();
        $allowedRoles = [FamilyRoleEnum::OWNER, FamilyRoleEnum::ADMIN];

        if (!in_array($userRole, $allowedRoles)) {
            return response()->json([
                'success' => false,
                'message' => 'You need admin privileges to perform this action.'
            ], 403);
        }

        // Add family and membership to request for controllers to use
        $request->merge([
            'family' => $family,
            'membership' => $membership
        ]);

        return $next($request);
    }

    private function getFamilyIdFromRequest(Request $request): ?int
    {
        // Try to get family ID from route parameters
        $familyId = $request->route('family_id') ?? $request->route('familyId');

        if ($familyId instanceof Family) {
            return $familyId->getId();
        }

        return $familyId ? (int) $familyId : null;
    }
}
