<?php

use App\Http\Controllers\Auth\AuthController;
use App\Http\Routes\Api\Auth\AuthRoutes;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

AuthRoutes::api();
