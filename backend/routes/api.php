<?php

use App\Http\Routes\Api\Auth\AuthRoutes;
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

AuthRoutes::api();
FamilyRoutes::api();
FamilyMemberRoutes::api();
