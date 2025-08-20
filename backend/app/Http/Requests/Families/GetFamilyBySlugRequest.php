<?php

declare(strict_types=1);

namespace App\Http\Requests\Families;

use App\Http\Resources\Families\FamilyResource;
use App\Models\Families\Family;
use App\Services\Validation\ValidationRuleHelper;
use Illuminate\Foundation\Http\FormRequest;

class GetFamilyBySlugRequest extends FormRequest
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

    public function responseResource(Family $family): FamilyResource
    {
        return FamilyResource::make($family);
    }
}
