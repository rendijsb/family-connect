<?php

declare(strict_types=1);

namespace App\Http\Requests\Families;

use App\DataTransferObjects\Families\InviteMemberRequestData;
use App\Enums\Families\FamilyRoleEnum;
use App\Models\Families\Family;
use App\Services\Validation\ValidationRuleHelper;
use Illuminate\Foundation\Http\FormRequest;

class InviteMemberRequest extends FormRequest
{
    private const EMAIL = 'email';
    private const ROLE = 'role';
    private const MESSAGE = 'message';
    private const FAMILY_SLUG_ROUTE_KEY = 'family_slug';

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            self::EMAIL => [
                ValidationRuleHelper::REQUIRED,
                ValidationRuleHelper::EMAIL,
                ValidationRuleHelper::STRING,
                ValidationRuleHelper::max(255),
            ],
            self::ROLE => [
                ValidationRuleHelper::REQUIRED,
                ValidationRuleHelper::INTEGER,
                ValidationRuleHelper::enum(FamilyRoleEnum::class),
            ],
            self::MESSAGE => [
                ValidationRuleHelper::NULLABLE,
                ValidationRuleHelper::STRING,
                ValidationRuleHelper::max(500),
            ],
            self::FAMILY_SLUG_ROUTE_KEY => [
                ValidationRuleHelper::REQUIRED,
                ValidationRuleHelper::STRING,
                ValidationRuleHelper::existsOnDatabase(Family::class, Family::SLUG),
            ]
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            self::FAMILY_SLUG_ROUTE_KEY => $this->getFamilySlug(),
        ]);
    }

    public function dto(): InviteMemberRequestData
    {
        return new InviteMemberRequestData(
            email: $this->input(self::EMAIL),
            role: FamilyRoleEnum::tryFrom((int)$this->input(self::ROLE)),
            message: $this->input(self::MESSAGE),
            familySlug: $this->getFamilySlug()
        );
    }

    public function getFamilySlug(): string
    {
        return $this->route('family_slug');
    }
}
