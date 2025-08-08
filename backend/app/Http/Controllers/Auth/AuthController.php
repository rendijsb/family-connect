<?php

declare(strict_types=1);

namespace App\Http\Controllers\Auth;

use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Resources\Auth\AuthResource;
use App\Services\Repositories\Auth\AuthRepository;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class AuthController
{
    public function __construct(
        private readonly AuthRepository $authRepository,
    )
    {
    }

    public function register(RegisterRequest $request): AuthResource
    {
        return $request->responseResource(
            $this->authRepository->register($request->dto())
        );
    }

    /**
     * @throws ValidationException
     */
    public function login(LoginRequest $request): AuthResource
    {
        return $request->responseResource(
            $this->authRepository->login($request->dto())
        );
    }

    public function logout(Request $request): JsonResponse
    {
        try {
            $user = $request->user();

            if ($user) {
                $user->tokens()->delete();
            }

            return response()->json([
                'success' => true,
                'message' => 'Successfully logged out.'
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Logout failed.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User not found.'
            ], 404);
        }

        $user->load('roleRelation');

        return response()->json([
            'success' => true,
            'data' => $user
        ]);
    }
}
