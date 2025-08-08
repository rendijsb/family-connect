<?php

declare(strict_types=1);

namespace App\Http\Controllers\Auth;

use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Resources\Auth\AuthResource;
use App\Services\Repositories\Auth\AuthRepository;
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
}
