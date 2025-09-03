<?php

declare(strict_types=1);

namespace App\Http\Requests\Families\Members;

use App\DataTransferObjects\Families\Members\InviteFamilyMemberRequestData;
use App\Enums\Families\FamilyRoleEnum;
use App\Http\Resources\Families\FamilyResource;
use App\Models\Families\Family;
use App\Services\Validation\ValidationRuleHelper;
use Illuminate\Foundation\Http\FormRequest;

class InviteFamilyMemberRequest extends FormRequest
{
    private const EMAIL = 'email';
    private const ROLE = 'role';
    private const MESSAGE = 'message';
    private const FAMILY_SLUG_ROUTE_KEY = 'family_slug';

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            self::EMAIL => [
                ValidationRuleHelper::REQUIRED,
                ValidationRuleHelper::STRING,
                ValidationRuleHelper::max(100)
            ],
            self::ROLE => [
                ValidationRuleHelper::REQUIRED,
                ValidationRuleHelper::INTEGER,
                ValidationRuleHelper::enum(FamilyRoleEnum::class),
            ],
            self::MESSAGE => [
                ValidationRuleHelper::NULLABLE,
                ValidationRuleHelper::STRING,
                ValidationRuleHelper::max(255)
            ],
        ];
    }

    public function dto(): InviteFamilyMemberRequestData
    {
        return new InviteFamilyMemberRequestData(
            email: $this->input(self::EMAIL),
            role: FamilyRoleEnum::tryFrom((int)$this->input(self::ROLE)),
            message: $this->input(self::MESSAGE),
            familySlug: $this->getFamilySlug()
        );
    }

    public function getFamilySlug(): string
    {
        return (string)$this->route(self::FAMILY_SLUG_ROUTE_KEY);
    }

    public function responseResource(Family $family): FamilyResource
    {
        return new FamilyResource($family);
    }
}
