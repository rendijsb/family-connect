<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Enums\Roles\RoleEnum;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Authentication required.'
            ], 401);
        }

        if (!$user->relationLoaded('roleRelation')) {
            $user->load('roleRelation');
        }

        $userRole = $user->relatedRole();

        if (!$userRole || !$userRole->getIsActive()) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid user role.'
            ], 403);
        }

        $allowedRoleIds = [];
        foreach ($roles as $role) {
            $roleEnum = $this->getRoleEnum($role);
            if ($roleEnum) {
                $allowedRoleIds[] = $roleEnum->value;
            }
        }

        if (empty($allowedRoleIds) || !in_array($userRole->getId(), $allowedRoleIds)) {
            return response()->json([
                'success' => false,
                'message' => 'Insufficient permissions to access this resource.'
            ], 403);
        }

        return $next($request);
    }

    private function getRoleEnum(string $role): ?RoleEnum
    {
        return match(strtolower($role)) {
            'admin' => RoleEnum::ADMIN,
            'moderator' => RoleEnum::MODERATOR,
            'client' => RoleEnum::CLIENT,
            default => null,
        };
    }
}
