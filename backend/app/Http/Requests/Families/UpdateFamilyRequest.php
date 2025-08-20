<?php

declare(strict_types=1);

namespace App\Http\Requests\Families;

use App\DataTransferObjects\Families\UpdateFamilyRequestData;
use App\Enums\Families\FamilyPrivacyEnum;
use App\Http\Resources\Families\FamilyResource;
use App\Models\Families\Family;
use App\Services\Validation\ValidationRuleHelper;
use Illuminate\Foundation\Http\FormRequest;

class UpdateFamilyRequest extends FormRequest
{
    private const NAME = 'name';
    private const DESCRIPTION = 'description';
    private const PRIVACY = 'privacy';
    private const TIMEZONE = 'timezone';
    private const LANGUAGE = 'language';
    private const MAX_MEMBERS = 'maxMembers';
    private const FAMILY_SLUG_ROUTE_KEY = 'family_slug';

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            self::NAME => [
                ValidationRuleHelper::SOMETIMES,
                ValidationRuleHelper::STRING,
                ValidationRuleHelper::min(2),
                ValidationRuleHelper::max(50)
            ],
            self::DESCRIPTION => [
                ValidationRuleHelper::NULLABLE,
                ValidationRuleHelper::STRING,
                ValidationRuleHelper::max(500)
            ],
            self::PRIVACY => [
                ValidationRuleHelper::SOMETIMES,
                ValidationRuleHelper::STRING,
                ValidationRuleHelper::enum(FamilyPrivacyEnum::class),
            ],
            self::TIMEZONE => [
                ValidationRuleHelper::NULLABLE,
                ValidationRuleHelper::STRING,
                ValidationRuleHelper::max(50)
            ],
            self::LANGUAGE => [
                ValidationRuleHelper::NULLABLE,
                ValidationRuleHelper::STRING,
                ValidationRuleHelper::max(10)
            ],
            self::MAX_MEMBERS => [
                ValidationRuleHelper::NULLABLE,
                ValidationRuleHelper::INTEGER,
                ValidationRuleHelper::min(2),
                ValidationRuleHelper::max(100)
            ]
        ];
    }

    public function dto(): UpdateFamilyRequestData
    {
        return new UpdateFamilyRequestData(
            name: $this->input(self::NAME),
            description: $this->input(self::DESCRIPTION),
            privacy: $this->input(self::PRIVACY),
            timezone: $this->input(self::TIMEZONE),
            language: $this->input(self::LANGUAGE),
            maxMembers: $this->input(self::MAX_MEMBERS),
            familySlug: $this->getFamilySlug()
        );
    }

    private function getFamilySlug(): string
    {
        return (string)$this->route(self::FAMILY_SLUG_ROUTE_KEY);
    }

    public function responseResource(Family $family): FamilyResource
    {
        return new FamilyResource($family);
    }
}
