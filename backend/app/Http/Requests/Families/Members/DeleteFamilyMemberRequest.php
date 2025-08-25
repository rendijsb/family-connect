<?php

declare(strict_types=1);

namespace App\Http\Requests\Families\Members;

use App\Models\Families\Family;
use App\Models\Families\FamilyMember;
use App\Services\Validation\ValidationRuleHelper;
use Illuminate\Foundation\Http\FormRequest;

class DeleteFamilyMemberRequest extends FormRequest
{
    private const FAMILY_SLUG_ROUTE_KEY = 'family_slug';
    private const FAMILY_MEMBER_ID = 'member_id';

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            self::FAMILY_SLUG_ROUTE_KEY => [
                ValidationRuleHelper::REQUIRED,
                ValidationRuleHelper::STRING,
                ValidationRuleHelper::existsOnDatabase(Family::class, Family::SLUG),
            ],
            self::FAMILY_MEMBER_ID => [
                ValidationRuleHelper::REQUIRED,
                ValidationRuleHelper::INTEGER,
                ValidationRuleHelper::existsOnDatabase(FamilyMember::class, FamilyMember::ID),
            ]
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            self::FAMILY_SLUG_ROUTE_KEY => $this->getFamilySlug(),
            self::FAMILY_MEMBER_ID => $this->getFamilyMemberId(),
        ]);
    }

    public function getFamilySlug(): string
    {
        return (string)$this->route(self::FAMILY_SLUG_ROUTE_KEY);
    }

    public function getFamilyMemberId(): int
    {
        return (int)$this->route(self::FAMILY_MEMBER_ID);
    }
}
