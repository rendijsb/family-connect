<?php

declare(strict_types=1);

namespace App\Services\Repositories\Auth;

use App\DataTransferObjects\Auth\AuthResponseData;
use App\DataTransferObjects\Auth\LoginRequestData;
use App\DataTransferObjects\Auth\RegisterRequestData;
use App\Enums\Roles\RoleEnum;
use App\Models\Users\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

readonly class AuthRepository
{
    public function __construct(
        private User $user,
    )
    {
    }

    private const TOKEN_NAME = 'family-connect-token';
    private const TOKEN_TYPE = 'Bearer';

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
            name: self::TOKEN_NAME,
            expiresAt: now()->addDays(30)
        )->plainTextToken;

        return new AuthResponseData(
            user: $user,
            token: $token,
            tokenType: self::TOKEN_TYPE,
        );
    }

    /**
     * @throws ValidationException
     */
    public function login(LoginRequestData $data): AuthResponseData
    {
        $user = $this->findByEmail($data->email);

        if (!$user || !Hash::check($data->password, $user->getPassword())) {
            throw ValidationException::withMessages([
                'error' => ['The provided credentials are incorrect.'],
            ]);
        }

        $user->load(User::ROLE_RELATION);

        if (!$data->remember) {
            $user->tokens()->delete();
        }

        $token = $user->createToken(self::TOKEN_NAME)->plainTextToken;

        return new AuthResponseData(
            user: $user,
            token: $token,
            tokenType: self::TOKEN_TYPE,
        );
    }

    public function findByEmail(string $email): ?User
    {
        return $this->user->where(User::EMAIL, $email)->first();
    }
}
