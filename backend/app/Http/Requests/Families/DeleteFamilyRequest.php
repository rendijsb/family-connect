<?php

declare(strict_types=1);

namespace App\Http\Requests\Families;

use App\Http\Resources\Families\FamilyResource;
use App\Models\Families\Family;
use App\Services\Validation\ValidationRuleHelper;
use Illuminate\Foundation\Http\FormRequest;

class DeleteFamilyRequest extends FormRequest
{
    private const FAMILY_ID_ROUTE_KEY = 'family_id';

    public function rules(): array
    {
        return [
            self::FAMILY_ID_ROUTE_KEY => [
                ValidationRuleHelper::existsOnDatabase(Family::class, Family::ID),
                ValidationRuleHelper::REQUIRED,
                ValidationRuleHelper::INTEGER
            ],
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            self::FAMILY_ID_ROUTE_KEY => $this->getFamilyId(),
        ]);
    }

    public function getFamilyId(): int
    {
        return (int) $this->route(self::FAMILY_ID_ROUTE_KEY);
    }
}
