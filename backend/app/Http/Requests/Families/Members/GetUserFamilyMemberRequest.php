<?php

declare(strict_types=1);

namespace App\Http\Requests\Families\Members;

use App\Http\Resources\Families\Members\FamilyMemberResource;
use App\Models\Families\Family;
use App\Models\Families\Members\FamilyMember;
use App\Services\Validation\ValidationRuleHelper;
use Illuminate\Foundation\Http\FormRequest;

class GetUserFamilyMemberRequest extends FormRequest
{
    private const FAMILY_ID_ROUTE_KEY = 'family_id';


    public function rules(): array
    {
        return [
            self::FAMILY_ID_ROUTE_KEY => [
                ValidationRuleHelper::existsOnDatabase(Family::class, Family::ID),
                ValidationRuleHelper::REQUIRED
            ],
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            self::FAMILY_ID_ROUTE_KEY => $this->getFamilyId(),
        ]);
    }

    public function responseResource(FamilyMember $familyMember): FamilyMemberResource
    {
        return new FamilyMemberResource($familyMember);
    }

    public function getFamilyId(): int
    {
        return (int) $this->route(self::FAMILY_ID_ROUTE_KEY);
    }
}
