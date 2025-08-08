<?php

declare(strict_types=1);

namespace App\Services\Repositories\Auth;

use App\DataTransferObjects\Auth\AuthResponseData;
use App\DataTransferObjects\Auth\RegisterRequestData;
use App\Enums\Roles\RoleEnum;
use App\Models\Users\User;
use Illuminate\Support\Facades\Hash;

readonly class AuthRepository
{
    public function __construct(
        private User $user,
    )
    {
    }

    public function register(RegisterRequestData $data): AuthResponseData
    {
            $user = $this->user->create([
                User::NAME => $data->name,
                User::EMAIL => $data->email,
                User::PASSWORD => Hash::make($data->password),
                User::ROLE_ID => RoleEnum::CLIENT->value,
                User::PHONE => $data->phone,
                User::DATE_OF_BIRTH => $data->dateOfBirth,
                User::EMAIL_VERIFIED_AT => null,
            ]);

            $user->load(User::ROLE_RELATION);

            $token = $user->createToken(
                name: 'family-connect-token',
                expiresAt: now()->addDays(30)
            )->plainTextToken;

            return new AuthResponseData(
                user: $user,
                token: $token,
                tokenType: 'Bearer'
            );
    }
}
