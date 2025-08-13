<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Enums\Families\FamilyRoleEnum;
use App\Models\Families\Family;
use App\Models\Families\FamilyMember;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class FamilyOwnerMiddleware
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

        // Check if user is the owner of this family
        if ($family->getOwnerId() !== $user->getId()) {
            return response()->json([
                'success' => false,
                'message' => 'Only the family owner can perform this action.'
            ], 403);
        }

        // Get user's membership for additional context
        $membership = FamilyMember::where(FamilyMember::FAMILY_ID, $familyId)
            ->where(FamilyMember::USER_ID, $user->getId())
            ->where(FamilyMember::STATUS, 'active')
            ->first();

        if (!$membership) {
            return response()->json([
                'success' => false,
                'message' => 'Family membership not found.'
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
        $familyId = $request->route('family') ?? $request->route('familyId');

        if ($familyId instanceof Family) {
            return $familyId->getId();
        }

        return $familyId ? (int) $familyId : null;
    }
}
