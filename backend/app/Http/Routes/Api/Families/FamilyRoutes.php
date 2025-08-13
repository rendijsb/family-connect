<?php

declare(strict_types=1);

namespace App\Http\Routes\Api\Families;

use App\Contracts\Http\Routes\RouteContract;
use Illuminate\Support\Facades\Route;

class FamilyRoutes implements RouteContract
{
    public static function api(): void
    {
        Route::middleware(['auth:sanctum'])->group(function () {
            // Family management
            Route::apiResource('families', FamilyController::class);
            Route::post('families/{family}/join/{code}', [FamilyController::class, 'joinByCode']);
            Route::post('families/{family}/regenerate-code', [FamilyController::class, 'regenerateInviteCode']);

            // Member management
            Route::get('families/{family}/members', [FamilyMemberController::class, 'index']);
            Route::post('families/{family}/members/{user}/role', [FamilyMemberController::class, 'updateRole']);
            Route::delete('families/{family}/members/{user}', [FamilyMemberController::class, 'remove']);

            // Invitations
            Route::post('families/{family}/invite', [FamilyInvitationController::class, 'invite']);
            Route::get('families/{family}/invitations', [FamilyInvitationController::class, 'index']);
            Route::post('invitations/{token}/accept', [FamilyInvitationController::class, 'accept']);
            Route::post('invitations/{token}/decline', [FamilyInvitationController::class, 'decline']);
            Route::delete('invitations/{invitation}', [FamilyInvitationController::class, 'cancel']);
        });
    }
}
