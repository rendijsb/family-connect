<?php

declare(strict_types=1);

namespace App\Http\Requests\Families;

use App\DataTransferObjects\Families\UpdateFamilyRequestData;
use App\Http\Resources\Families\FamilyResource;
use App\Models\Families\Family;
use App\Services\Validation\ValidationRuleHelper;
use Illuminate\Foundation\Http\FormRequest;

class UpdateFamilyRequest extends FormRequest
{
    private const NAME = 'name';
    private const DESCRIPTION = 'description';
    private const SETTINGS = 'settings';
    private const IS_ACTIVE = 'isActive';
    private const FAMILY_ID_ROUTE_KEY = 'id';

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
                ValidationRuleHelper::MAX . ':255',
            ],
            self::DESCRIPTION => [
                ValidationRuleHelper::NULLABLE,
                ValidationRuleHelper::STRING,
                ValidationRuleHelper::MAX . ':1000',
            ],
            self::SETTINGS => [
                ValidationRuleHelper::NULLABLE,
                ValidationRuleHelper::ARRAY
            ],
            self::SETTINGS . '.*' => [
                ValidationRuleHelper::STRING,
                ValidationRuleHelper::MAX . ':255'
            ],
            self::IS_ACTIVE => [
                ValidationRuleHelper::REQUIRED,
                ValidationRuleHelper::BOOLEAN,
            ],
            self::FAMILY_ID_ROUTE_KEY => [
                ValidationRuleHelper::REQUIRED,
                ValidationRuleHelper::INTEGER,
                ValidationRuleHelper::EXISTS . ':' . Family::TABLE . ',' . Family::ID,
            ],
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([self::FAMILY_ID_ROUTE_KEY => $this->getFamilyId()]);
    }

    public function dto(): UpdateFamilyRequestData
    {
        return new UpdateFamilyRequestData(
            name: $this->input(self::NAME),
            description: $this->input(self::DESCRIPTION),
            settings: $this->input(self::SETTINGS, []),
            isActive: $this->input(self::IS_ACTIVE),
            familyId: $this->getFamilyId()
        );
    }

    public function responseResource(Family $family): FamilyResource
    {
        return new FamilyResource($family);
    }

    private function getFamilyId(): int
    {
        return (int)$this->route(self::FAMILY_ID_ROUTE_KEY);
    }
}
