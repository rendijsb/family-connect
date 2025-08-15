<?php

declare(strict_types=1);

namespace App\Http\Routes\Api\Families;

use App\Contracts\Http\Routes\RouteContract;
use App\Http\Controllers\Families\FamilyController;
use App\Http\Controllers\Families\Invitations\FamilyInvitationController;
use App\Http\Controllers\Families\Members\FamilyMemberController;
use Illuminate\Support\Facades\Route;

class FamiliesRoutes implements RouteContract
{
    public static function api(): void
    {

        Route::middleware('auth:sanctum')->group(function () {

            Route::prefix('families')->group(function () {
                Route::get('/', [FamilyController::class, 'getAllFamilies']);
                Route::post('/', [FamilyController::class, 'createFamily']);
//                Route::get('/search', [FamilyController::class, 'searchFamily']);
//                Route::post('/join', [FamilyController::class, 'joinFamilyByToken']);

                Route::middleware('family-member')->group(function () {
                    Route::get('/{family_id}', [FamilyController::class, 'getFamily']);
//                    Route::get('/{family_id}/stats', [FamilyController::class, 'getFamilyStats']);
                    Route::get('/{family_id}/activities', [FamilyController::class, 'getFamilyActivities']);
                    Route::delete('/{family_id}/leave', [FamilyController::class, 'leaveFamily']);

                    // Member routes
                    Route::get('/{family_id}/members', [FamilyMemberController::class, 'getFamilyMembers']);
                    Route::get('/{family_id}/my-membership', [FamilyMemberController::class, 'getUserFamilyMember']);
//                    Route::get('/{family_id}/members/online', [FamilyMemberController::class, 'getOnlineMembers']);
//                    Route::post('/{family_id}/members/activity', [FamilyMemberController::class, 'updateActivity']);
//                    Route::get('/{family_id}/members/search', [FamilyMemberController::class, 'searchMembers']);
//                    Route::get('/{family_id}/members/{member_id}', [FamilyMemberController::class, 'getMember']);
                });

                Route::middleware('family-admin')->group(function () {
                    Route::put('/{family_id}', [FamilyController::class, 'updateFamily']);
                    Route::put('/{family_id}/members/{member_id}', [FamilyMemberController::class, 'updateFamilyMember']);
                    Route::delete('/{family_id}/members/{member_id}', [FamilyMemberController::class, 'deleteFamilyMember']);

                    // Invitation routes
                    Route::get('/{family_id}/invitations', [FamilyInvitationController::class, 'getAllInvitations']);
                    Route::post('/{family_id}/invitations', [FamilyInvitationController::class, 'createInvitation']);
//                    Route::post('/{family_id}/invitations/batch', [FamilyInvitationController::class, 'createMultipleInvites']);
//                    Route::post('/invitations/{invitation_id}/resend', [FamilyInvitationController::class, 'resendInvite']);
                    Route::delete('/invitations/{invitation_id}', [FamilyInvitationController::class, 'deleteInvitation']);
                });

                Route::middleware('family-owner')->group(function () {
                    Route::delete('/{family_id}', [FamilyController::class, 'deleteFamily']);
                });
            });

            // User-specific routes
            Route::prefix('user')->group(function () {
                Route::get('/family', [FamilyController::class, 'getUserFamilies']);
                Route::get('/invitations', [FamilyInvitationController::class, 'getUserInvitations']);
            });

            // Public invitation routes
            Route::prefix('invitations')->group(function () {
//                Route::get('/{token}', [FamilyInvitationController::class, 'getInvitesByToken'])->withoutMiddleware('auth:sanctum');
//                Route::put('/{invitation_id}/accept', [FamilyInvitationController::class, 'acceptInvite']);
//                Route::put('/{invitation_id}/decline', [FamilyInvitationController::class, 'declineInvite']);
            });
        });
    }
}
