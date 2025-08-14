<?php

declare(strict_types=1);

namespace App\Http\Requests\Families;

use App\Models\Families\Family;
use App\Models\Families\FamilyMember;
use App\Services\Validation\ValidationRuleHelper;
use Illuminate\Foundation\Http\FormRequest;

class DeleteFamilyMemberRequest extends FormRequest
{
    private const FAMILY_ID_ROUTE_KEY = 'family_id';
    private const MEMBER_ID_ROUTE_KEY = 'member_id';

    public function rules(): array
    {
        return [
            self::FAMILY_ID_ROUTE_KEY => [
                ValidationRuleHelper::existsOnDatabase(Family::class, Family::ID),
                ValidationRuleHelper::REQUIRED
            ],
            self::MEMBER_ID_ROUTE_KEY => [
                ValidationRuleHelper::existsOnDatabase(FamilyMember::class, FamilyMember::ID),
                ValidationRuleHelper::REQUIRED
            ]
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            self::FAMILY_ID_ROUTE_KEY => $this->getFamilyId(),
            self::MEMBER_ID_ROUTE_KEY => $this->getMemberId(),
        ]);
    }

    public function getFamilyId(): int
    {
        return (int) $this->route(self::FAMILY_ID_ROUTE_KEY);
    }

    public function getMemberId(): int
    {
        return (int) $this->route(self::MEMBER_ID_ROUTE_KEY);
    }
}
