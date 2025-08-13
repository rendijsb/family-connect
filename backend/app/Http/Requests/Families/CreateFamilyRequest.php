<?php

declare(strict_types=1);

namespace App\Http\Requests\Families;

use App\DataTransferObjects\Families\CreateFamilyRequestData;
use App\Http\Resources\Families\FamilyResource;
use App\Models\Families\Family;
use App\Services\Validation\ValidationRuleHelper;
use Illuminate\Foundation\Http\FormRequest;

class CreateFamilyRequest extends FormRequest
{
    private const NAME = 'name';
    private const DESCRIPTION = 'description';
    private const PRIVACY_LEVEL = 'privacyLevel';
    private const SETTINGS = 'settings';

    public function rules(): array
    {
        return [
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
                ValidationRuleHelper::STRING
            ],
            self::SETTINGS => [
                ValidationRuleHelper::NULLABLE,
                ValidationRuleHelper::ARRAY
            ]
        ];
    }

    public function dto(): CreateFamilyRequestData
    {
        return new CreateFamilyRequestData(
            name: $this->input(self::NAME),
            description: $this->input(self::DESCRIPTION),
            privacyLevel: $this->input(self::PRIVACY_LEVEL),
            settings: $this->array(self::SETTINGS),
        );
    }

    public function responseResource(Family $family): FamilyResource
    {
        return new FamilyResource($family);
    }
}
