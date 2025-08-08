<?php

declare(strict_types=1);

namespace App\Http\Requests\Auth;

use App\DataTransferObjects\Auth\AuthResponseData;
use App\DataTransferObjects\Auth\LoginRequestData;
use App\Http\Resources\Auth\AuthResource;
use App\Services\Validation\ValidationRuleHelper;
use Illuminate\Foundation\Http\FormRequest;

class LoginRequest extends FormRequest
{
    private const EMAIL = 'email';
    private const PASSWORD = 'password';
    private const REMEMBER = 'remember';

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            self::EMAIL => [
                ValidationRuleHelper::REQUIRED,
                ValidationRuleHelper::STRING,
                ValidationRuleHelper::EMAIL
            ],
            self::PASSWORD => [
                ValidationRuleHelper::REQUIRED,
                ValidationRuleHelper::STRING
            ],
            self::REMEMBER => [
                ValidationRuleHelper::SOMETIMES,
                ValidationRuleHelper::BOOLEAN
            ]
        ];
    }

    public function dto(): LoginRequestData
    {
        return new LoginRequestData(
            email: $this->input(self::EMAIL),
            password: $this->input(self::PASSWORD),
            remember: $this->boolean(self::REMEMBER) ?? false,
        );
    }

    public function responseResource(AuthResponseData $authResponse): AuthResource
    {
        return new AuthResource($authResponse);
    }
}
