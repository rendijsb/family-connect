<?php

declare(strict_types=1);

namespace App\Http\Requests\Families;

use App\Models\Families\Family;
use App\Services\Validation\ValidationRuleHelper;
use Illuminate\Foundation\Http\FormRequest;

class GenerateJoinCodeRequest extends FormRequest
{
    private const FAMILY_SLUG_ROUTE_KEY = 'family_slug';

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            self::FAMILY_SLUG_ROUTE_KEY => [
                ValidationRuleHelper::REQUIRED,
                ValidationRuleHelper::STRING,
                ValidationRuleHelper::existsOnDatabase(Family::class, Family::SLUG),
            ]
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            self::FAMILY_SLUG_ROUTE_KEY => $this->getFamilySlug(),
        ]);
    }

    public function getFamilySlug(): string
    {
        return $this->route('family_slug');
    }
}
