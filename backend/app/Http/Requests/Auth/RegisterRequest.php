<?php

declare(strict_types=1);

namespace App\Http\Requests\Auth;

use App\DataTransferObjects\Auth\RegisterRequestData;
use App\Http\Resources\Auth\AuthResource;
use App\Services\Validation\ValidationRuleHelper;
use Illuminate\Foundation\Http\FormRequest;

class RegisterRequest extends FormRequest
{
    private const NAME = 'name';
    private const EMAIL = 'email';
    private const PASSWORD = 'password';
    private const PASSWORD_CONFIRMATION = 'password_confirmation';
    private const PHONE = 'phone';
    private const DATE_OF_BIRTH = 'date_of_birth';

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            self::NAME => [
                ValidationRuleHelper::REQUIRED,
                ValidationRuleHelper::STRING,
                ValidationRuleHelper::min(2),
                ValidationRuleHelper::max(255)
            ],
            self::EMAIL => [
                ValidationRuleHelper::REQUIRED,
                ValidationRuleHelper::STRING,
                ValidationRuleHelper::EMAIL,
                ValidationRuleHelper::max(255),
                ValidationRuleHelper::unique(User::class, 'email')
            ],
            self::PASSWORD => [
                ValidationRuleHelper::REQUIRED,
                ValidationRuleHelper::STRING,
                ValidationRuleHelper::min(8),
                ValidationRuleHelper::CONFIRMED
            ],
            self::PASSWORD_CONFIRMATION => [
                ValidationRuleHelper::REQUIRED,
                ValidationRuleHelper::STRING
            ],
            self::PHONE => [
                ValidationRuleHelper::NULLABLE,
                ValidationRuleHelper::STRING,
            ],
            self::DATE_OF_BIRTH => [
                ValidationRuleHelper::NULLABLE,
            ],
        ];
    }

    public function data(): RegisterRequestData
    {
        return new RegisterRequestData(
            name: $this->input(self::NAME),
            email: $this->input(self::EMAIL),
            password: $this->input(self::PASSWORD),
            phone: $this->input(self::PHONE),
            dateOfBirth: $this->input(self::DATE_OF_BIRTH),
        );
    }

    public function responseResource(User $user): AuthResource
    {
        return new AuthResource($user);
    }

    protected function prepareForValidation(): void
    {
        if ($this->has(self::PHONE)) {
            $this->merge([
                self::PHONE => preg_replace('/[^\d+\-()\s]/', '', $this->input(self::PHONE)),
            ]);
        }
    }
}
