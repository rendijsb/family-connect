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
    private const SETTINGS = 'settings';

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
        ];
    }

    public function responseResource(Family $family): FamilyResource
    {
        return new FamilyResource::($family);
    }

    public function dto(): CreateFamilyRequestData
    {
        return new CreateFamilyRequestData(
            name: $this->input(self::NAME),
            description: $this->input(self::DESCRIPTION),
            settings: $this->input(self::SETTINGS, [])
        );
    }
}
