<?php

declare(strict_types=1);

namespace App\Http\Requests\Families;

use App\DataTransferObjects\Families\UpdateFamilyRequestData;
use App\Enums\Families\FamilyPrivacyLevelEnum;
use App\Http\Resources\Families\FamilyResource;
use App\Models\Families\Family;
use App\Services\Validation\ValidationRuleHelper;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateFamilyRequest extends FormRequest
{
    private const FAMILY_ID_ROUTE_KEY = 'family_id';
    private const NAME = 'name';
    private const DESCRIPTION = 'description';
    private const PRIVACY_LEVEL = 'privacyLevel';
    private const SETTINGS = 'settings';

    public function rules(): array
    {
        return [
            self::FAMILY_ID_ROUTE_KEY => [
                ValidationRuleHelper::existsOnDatabase(Family::class, Family::ID),
                ValidationRuleHelper::REQUIRED,
                ValidationRuleHelper::INTEGER
            ],
            self::NAME => [
                ValidationRuleHelper::REQUIRED,
                ValidationRuleHelper::STRING
            ],
            self::DESCRIPTION => [
                ValidationRuleHelper::STRING,
                ValidationRuleHelper::NULLABLE
            ],
            self::PRIVACY_LEVEL => [
                ValidationRuleHelper::REQUIRED,
                Rule::enum(FamilyPrivacyLevelEnum::class)
            ],
            self::SETTINGS => [
                ValidationRuleHelper::NULLABLE,
                ValidationRuleHelper::ARRAY
            ]
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            self::FAMILY_ID_ROUTE_KEY => $this->getFamilyId(),
        ]);
    }

    public function dto(): UpdateFamilyRequestData
    {
        $privacyLevel = $this->input(self::PRIVACY_LEVEL);

        return new UpdateFamilyRequestData(
            name: $this->input(self::NAME),
            description: $this->input(self::DESCRIPTION),
            privacyLevel: FamilyPrivacyLevelEnum::from($privacyLevel),
            settings: $this->array(self::SETTINGS),
            familyId: $this->getFamilyId(),
        );
    }

    public function responseResource(Family $family): FamilyResource
    {
        return new FamilyResource($family);
    }

    public function getFamilyId(): int
    {
        return (int) $this->route(self::FAMILY_ID_ROUTE_KEY);
    }
}
