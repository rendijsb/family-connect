<?php

declare(strict_types=1);

namespace App\Http\Requests\Families\Members;

use App\Http\Resources\Families\Members\FamilyMemberResource;
use App\Http\Resources\Families\Members\FamilyMemberResourceCollection;
use App\Models\Families\Family;
use App\Models\Families\FamilyMember;
use App\Services\Validation\ValidationRuleHelper;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Collection;

class GetAllFamilyMembersRequest extends FormRequest
{
    private const FAMILY_SLUG = 'family_slug';

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            self::FAMILY_SLUG => [
                ValidationRuleHelper::REQUIRED,
                ValidationRuleHelper::STRING,
                ValidationRuleHelper::existsOnDatabase(Family::class, Family::SLUG)
            ]
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            self::FAMILY_SLUG => $this->getFamilySlug()
        ]);
    }

    public function getFamilySlug(): string
    {
        return (string)$this->route(self::FAMILY_SLUG);
    }

    public function responseResource(Collection $familyMembers): FamilyMemberResourceCollection
    {
        return FamilyMemberResourceCollection::make($familyMembers);
    }
}
