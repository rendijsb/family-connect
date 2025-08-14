<?php

declare(strict_types=1);

namespace App\Http\Requests\Families;

use App\DataTransferObjects\Families\CreateFamilyInvitationRequestData;
use App\Enums\Families\FamilyRoleEnum;
use App\Http\Resources\Families\FamilyInvitationResource;
use App\Models\Families\FamilyInvitation;
use App\Services\Validation\ValidationRuleHelper;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CreateFamilyInvitationRequest extends FormRequest
{
    private const EMAIL = 'email';
    private const ROLE = 'role';
    private const MESSAGE = 'message';
    private const FAMILY_ID_ROUTE_KEY = 'family_id';

    public function rules(): array
    {
        return [
            self::EMAIL => [
                ValidationRuleHelper::EMAIL,
                ValidationRuleHelper::REQUIRED,
            ],
            self::ROLE => [
                ValidationRuleHelper::STRING,
                Rule::enum(FamilyRoleEnum::class)
            ],
            self::MESSAGE => [
                ValidationRuleHelper::STRING,
                ValidationRuleHelper::NULLABLE
            ]
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            self::FAMILY_ID_ROUTE_KEY => $this->getFamilyId(),
        ]);
    }

    public function responseResource(FamilyInvitation $familyInvitation): FamilyInvitationResource
    {
        return new FamilyInvitationResource($familyInvitation);
    }

    public function dto(): CreateFamilyInvitationRequestData
    {
        $role = $this->input(self::ROLE);

        return new CreateFamilyInvitationRequestData(
            email: $this->input(self::EMAIL),
            role: FamilyRoleEnum::from($role),
            message: $this->input(self::MESSAGE),
            familyId: $this->getFamilyId(),
        );
    }

    public function getFamilyId(): int
    {
        return (int)$this->route(self::FAMILY_ID_ROUTE_KEY);
    }
}
