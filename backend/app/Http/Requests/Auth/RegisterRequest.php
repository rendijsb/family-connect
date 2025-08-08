<?php

declare(strict_types=1);

namespace App\Http\Requests\Auth;

use App\DataTransferObjects\Auth\AuthResponseData;
use App\DataTransferObjects\Auth\RegisterRequestData;
use App\Http\Resources\Auth\AuthResource;
use App\Models\Users\User;
use App\Services\Validation\ValidationRuleHelper;
use Illuminate\Foundation\Http\FormRequest;

class RegisterRequest extends FormRequest
{
    private const NAME = 'name';
    private const EMAIL = 'email';
    private const PASSWORD = 'password';
    private const PASSWORD_CONFIRMATION = 'password_confirmation';
    private const PHONE = 'phone';
    private const DATE_OF_BIRTH = 'dateOfBirth';
    private const AGREE_TO_TERMS = 'agreeToTerms';

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
            self::AGREE_TO_TERMS => [
                ValidationRuleHelper::REQUIRED,
                'accepted'
            ],
            self::DATE_OF_BIRTH => [
                ValidationRuleHelper::NULLABLE,
                'date',
                'before:' . now()->subYears(10)->format('Y-m-d'),
                'after:' . now()->subYears(120)->format('Y-m-d')
            ],
        ];
    }

    public function dto(): RegisterRequestData
    {
        return new RegisterRequestData(
            name: $this->input(self::NAME),
            email: $this->input(self::EMAIL),
            password: $this->input(self::PASSWORD),
            phone: $this->input(self::PHONE),
            dateOfBirth: $this->input(self::DATE_OF_BIRTH),
        );
    }

    public function responseResource(AuthResponseData $data): AuthResource
    {
        return new AuthResource($data);
    }

    protected function prepareForValidation(): void
    {
        if ($this->input(self::PHONE)) {
            $this->merge([
                self::PHONE => preg_replace('/[^\d+\-()\s]/', '', $this->input(self::PHONE)),
            ]);
        }

        if ($this->has(self::AGREE_TO_TERMS)) {
            $agreeToTerms = $this->input(self::AGREE_TO_TERMS);
            $this->merge([
                self::AGREE_TO_TERMS => $this->convertToBoolean($agreeToTerms),
            ]);
        }
    }

    private function convertToBoolean($value): bool
    {
        if (is_bool($value)) {
            return $value;
        }

        if (is_string($value)) {
            return in_array(strtolower($value), ['true', '1', 'yes', 'on'], true);
        }

        return (bool) $value;
    }
}
