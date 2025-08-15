<?php

declare(strict_types=1);

namespace App\Http\Requests\Families\Members;

use App\DataTransferObjects\Families\Members\UpdateFamilyMemberRequestData;
use App\Enums\Families\FamilyRoleEnum;
use App\Http\Resources\Families\Members\FamilyMemberResource;
use App\Models\Families\Family;
use App\Models\Families\Members\FamilyMember;
use App\Services\Validation\ValidationRuleHelper;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateFamilyMemberRequest extends FormRequest
{
    private const ROLE = 'role';
    private const NICKNAME = 'nickname';
    private const PERMISSIONS = 'permissions';
    private const FAMILY_ID_ROUTE_KEY = 'family_id';
    private const MEMBER_ID_ROUTE_KEY = 'member_id';


    public function rules(): array
    {
        return [
            self::ROLE => [
                ValidationRuleHelper::NULLABLE,
                Rule::enum(FamilyRoleEnum::class)
            ],
            self::NICKNAME => [
                ValidationRuleHelper::STRING,
                ValidationRuleHelper::NULLABLE
            ],
            self::PERMISSIONS => [
                ValidationRuleHelper::NULLABLE,
                ValidationRuleHelper::ARRAY
            ],
            self::FAMILY_ID_ROUTE_KEY => [
                ValidationRuleHelper::existsOnDatabase(Family::class, Family::ID),
                ValidationRuleHelper::REQUIRED
            ],
            self::MEMBER_ID_ROUTE_KEY => [
                ValidationRuleHelper::existsOnDatabase(FamilyMember::class, FamilyMember::ID),
                ValidationRuleHelper::REQUIRED
            ]
        ];
    }

    public function dto(): UpdateFamilyMemberRequestData
    {
        $role = $this->input(self::ROLE);

        return new UpdateFamilyMemberRequestData(
            role: $role ? FamilyRoleEnum::from($role) : null,
            nickname: $this->input(self::NICKNAME),
            permissions: $this->array(self::PERMISSIONS),
            familyId: $this->getFamilyId(),
            memberId: $this->getMemberId(),
        );
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            self::FAMILY_ID_ROUTE_KEY => $this->getFamilyId(),
            self::MEMBER_ID_ROUTE_KEY => $this->getMemberId(),
        ]);
    }

    public function responseResource(FamilyMember $familyMember): FamilyMemberResource
    {
        return new FamilyMemberResource($familyMember);
    }

    public function getFamilyId(): int
    {
        return (int) $this->route(self::FAMILY_ID_ROUTE_KEY);
    }

    public function getMemberId(): int
    {
        return (int) $this->route(self::MEMBER_ID_ROUTE_KEY);
    }
}
