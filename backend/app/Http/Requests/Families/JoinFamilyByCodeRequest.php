<?php

declare(strict_types=1);

namespace App\Http\Requests\Families;

use App\DataTransferObjects\Families\JoinFamilyRequestData;
use App\Http\Resources\Families\FamilyResource;
use App\Models\Families\Family;
use App\Services\Validation\ValidationRuleHelper;
use Illuminate\Foundation\Http\FormRequest;

class JoinFamilyByCodeRequest extends FormRequest
{
    private const JOIN_CODE = 'joinCode';

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            self::JOIN_CODE => [
                ValidationRuleHelper::REQUIRED,
                ValidationRuleHelper::STRING,
                ValidationRuleHelper::min(6),
                ValidationRuleHelper::max(8)
            ]
        ];
    }

    public function dto(): JoinFamilyRequestData
    {
        return new JoinFamilyRequestData(
            joinCode: strtoupper($this->input(self::JOIN_CODE))
        );
    }

    public function responseResource(Family $family): FamilyResource
    {
        return new FamilyResource($family);
    }
}
