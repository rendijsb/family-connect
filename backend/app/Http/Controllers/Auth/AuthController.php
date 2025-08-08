<?php

declare(strict_types=1);

namespace App\Http\Controllers\Auth;

use App\Http\Requests\Auth\RegisterRequest;
use App\Services\Repositories\Auth\AuthRepository;

class AuthController
{
    public function __construct(
        AuthRepository $authRepository,
    )
    {
    }

    public function register(RegisterRequest $request): AuthResource
    {
        return $request->responseResource(
            $this->authRepository->register($request->getData())
        );
    }
}
