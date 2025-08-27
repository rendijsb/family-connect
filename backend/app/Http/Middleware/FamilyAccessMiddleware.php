<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Models\Families\Family;
use App\Models\Families\FamilyMember;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class FamilyAccessMiddleware
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

        $familySlug = $request->route('family_slug');

        if (!$familySlug) {
            return response()->json([
                'success' => false,
                'message' => 'Family not specified.'
            ], 400);
        }

        // Find the family
        $family = Family::where(Family::SLUG, $familySlug)->first();

        if (!$family) {
            return response()->json([
                'success' => false,
                'message' => 'Family not found.'
            ], 404);
        }

        // Check if user is a member of this family
        $familyMember = FamilyMember::where(FamilyMember::FAMILY_ID, $family->getId())
            ->where(FamilyMember::USER_ID, $user->getId())
            ->where(FamilyMember::IS_ACTIVE, true)
            ->first();

        if (!$familyMember) {
            return response()->json([
                'success' => false,
                'message' => 'You are not a member of this family.'
            ], 403);
        }

        // Add family and member to request for use in controllers
        $request->merge([
            '_family' => $family,
            '_family_member' => $familyMember
        ]);

        return $next($request);
    }
}
