<?php

declare(strict_types=1);

namespace App\Http\Requests\Families\Invitations;

use App\Services\Validation\ValidationRuleHelper;
use Illuminate\Foundation\Http\FormRequest;

class DeclineInvitationRequest extends FormRequest
{
    private const TOKEN_ROUTE_KEY = 'token';

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            self::TOKEN_ROUTE_KEY => [
                ValidationRuleHelper::REQUIRED,
                ValidationRuleHelper::STRING,
                ValidationRuleHelper::min(32),
                ValidationRuleHelper::max(64),
            ]
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            self::TOKEN_ROUTE_KEY => $this->getToken(),
        ]);
    }

    public function getToken(): string
    {
        return $this->route('token');
    }
}
