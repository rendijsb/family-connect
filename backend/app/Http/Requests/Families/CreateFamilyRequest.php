<?php

declare(strict_types=1);

namespace App\Http\Requests\Families;

use App\DataTransferObjects\Families\CreateFamilyRequestData;
use App\Enums\Families\FamilyPrivacyEnum;
use App\Http\Resources\Families\FamilyResource;
use App\Models\Families\Family;
use App\Services\Validation\ValidationRuleHelper;
use Illuminate\Foundation\Http\FormRequest;

class CreateFamilyRequest extends FormRequest
{
    private const NAME = 'name';
    private const DESCRIPTION = 'description';
    private const PRIVACY = 'privacy';
    private const TIMEZONE = 'timezone';
    private const LANGUAGE = 'language';
    private const MAX_MEMBERS = 'maxMembers';

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
                ValidationRuleHelper::max(100),
            ],
            self::DESCRIPTION => [
                ValidationRuleHelper::STRING,
                ValidationRuleHelper::max(255),
            ],
            self::PRIVACY => [
                ValidationRuleHelper::REQUIRED,
                ValidationRuleHelper::enum(FamilyPrivacyEnum::class)
            ],
            self::TIMEZONE => [
                ValidationRuleHelper::STRING,
                ValidationRuleHelper::NULLABLE
            ],
            self::LANGUAGE => [
                ValidationRuleHelper::STRING,
                ValidationRuleHelper::max(40),
                ValidationRuleHelper::NULLABLE,
            ],
            self::MAX_MEMBERS => [
                ValidationRuleHelper::INTEGER,
                ValidationRuleHelper::min(1),
                ValidationRuleHelper::max(100),
                ValidationRuleHelper::NULLABLE
            ]
        ];
    }

    public function dto(): CreateFamilyRequestData
    {
        return new CreateFamilyRequestData(
            name: $this->input(self::NAME),
            description: $this->input(self::DESCRIPTION),
            privacy: FamilyPrivacyEnum::tryFrom((string)$this->input(self::PRIVACY)),
            timezone: $this->input(self::TIMEZONE),
            language: $this->input(self::LANGUAGE),
            maxMembers: $this->integer(self::MAX_MEMBERS, 10)
        );
    }

    public function responseResource(Family $family): FamilyResource
    {
        return FamilyResource::make($family);
    }
}
