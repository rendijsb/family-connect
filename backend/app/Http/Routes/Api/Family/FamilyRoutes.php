<?php

declare(strict_types=1);

namespace App\Http\Routes\Api\Family;

use App\Contracts\Http\Routes\RouteContract;
use App\Http\Controllers\Families\FamilyController;
use Illuminate\Support\Facades\Route;

class FamilyRoutes implements RouteContract
{
    public static function api(): void
    {
        Route::prefix('families')->middleware('auth:sanctum')->group(function () {
            Route::get('/', [FamilyController::class, 'getAllFamilies']);
            Route::post('/', [FamilyController::class, 'createFamily']);
            Route::get('/my-families', [FamilyController::class, 'getMyFamilies']);
            Route::post('/join', [FamilyController::class, 'joinFamilyByCode']);

            Route::middleware('family.access')->group(function () {
                Route::get('/{family_slug}', [FamilyController::class, 'getFamilyBySlug']);
                Route::put('/{family_slug}', [FamilyController::class, 'updateFamily']);
                Route::delete('/{family_slug}', [FamilyController::class, 'deleteFamily']);
                Route::post('/{family_slug}/leave', [FamilyController::class, 'leaveFamily']);
                Route::post('/{family_slug}/generate-code', [FamilyController::class, 'generateJoinCode']);
                Route::post('/{family_slug}/invite', [FamilyController::class, 'inviteMember']);
            });
        });
    }
}
