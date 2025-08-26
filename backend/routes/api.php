<?php

use App\Http\Controllers\Broadcasting\BroadcastController;
use App\Http\Routes\Api\Auth\AuthRoutes;
use App\Http\Routes\Api\Chat\ChatRoutes;
use App\Http\Routes\Api\Family\FamilyMemberRoutes;
use App\Http\Routes\Api\Family\FamilyRoutes;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    $user = $request->user();
    $user->load('roleRelation');

    return response()->json([
        'success' => true,
        'data' => $user
    ]);
});

// Broadcasting Authentication Route - MUST be before Broadcast::routes()
Route::post('/broadcasting/auth', [BroadcastController::class, 'authenticate'])
    ->middleware(['auth:sanctum', 'cors']);

// Standard broadcast routes (this registers the default Laravel broadcasting auth route)
// We're overriding it above with our custom controller
//Broadcast::routes(['middleware' => ['auth:sanctum']]);

AuthRoutes::api();
FamilyRoutes::api();
FamilyMemberRoutes::api();
ChatRoutes::api();
