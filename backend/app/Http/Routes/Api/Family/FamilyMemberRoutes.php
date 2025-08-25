<?php

declare(strict_types=1);

namespace App\Http\Routes\Api\Family;

use App\Contracts\Http\Routes\RouteContract;
use App\Http\Controllers\Families\FamilyMemberController;
use App\Http\Controllers\Families\InvitationController;
use Illuminate\Support\Facades\Route;

class FamilyMemberRoutes implements RouteContract
{
    public static function api(): void
    {
        Route::prefix('families/{family_slug}/members')->middleware(['auth:sanctum', 'family.access'])->group(function () {
            Route::get('/', [FamilyMemberController::class, 'getAllFamilyMembers']);
            Route::post('/invite', [FamilyMemberController::class, 'inviteFamilyMember']);
            Route::put('/{member_id}', [FamilyMemberController::class, 'updateFamilyMember']);
            Route::delete('/{member_id}', [FamilyMemberController::class, 'deleteFamilyMember']);
            Route::post('/{member_id}/role', [FamilyMemberController::class, 'updateFamilyMemberRole']);
            Route::post('/{member_id}/relationship', [FamilyMemberController::class, 'setRelationship']);
        });

        Route::prefix('invitations')->middleware('auth:sanctum')->group(function () {
            Route::get('/pending', [InvitationController::class, 'pending']);
            Route::post('/{token}/accept', [InvitationController::class, 'accept']);
            Route::post('/{token}/decline', [InvitationController::class, 'decline']);
            Route::delete('/{invitation}', [InvitationController::class, 'cancel']);
        });
    }
}
