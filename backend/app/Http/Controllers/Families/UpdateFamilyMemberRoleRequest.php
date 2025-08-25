<?php

declare(strict_types=1);

namespace App\Http\Controllers\Families;

use App\DataTransferObjects\Families\Members\UpdateFamilyMemberRoleRequestData;
use App\Enums\Families\FamilyRoleEnum;
use App\Http\Resources\Families\Members\FamilyMemberResource;
use App\Models\Families\Family;
use App\Models\Families\FamilyMember;
use App\Services\Validation\ValidationRuleHelper;
use Illuminate\Foundation\Http\FormRequest;

class UpdateFamilyMemberRoleRequest extends FormRequest
{
    private const ROLE = 'role';
    private const FAMILY_SLUG_ROUTE_KEY = 'family_slug';
    private const FAMILY_MEMBER_ID = 'member_id';

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            self::ROLE => [
                ValidationRuleHelper::REQUIRED,
                ValidationRuleHelper::INTEGER,
                ValidationRuleHelper::enum(FamilyRoleEnum::class),
            ],
            self::FAMILY_SLUG_ROUTE_KEY => [
                ValidationRuleHelper::REQUIRED,
                ValidationRuleHelper::STRING,
                ValidationRuleHelper::existsOnDatabase(Family::class, Family::SLUG),
            ],
            self::FAMILY_MEMBER_ID => [
                ValidationRuleHelper::REQUIRED,
                ValidationRuleHelper::INTEGER,
                ValidationRuleHelper::existsOnDatabase(FamilyMember::class, FamilyMember::ID),
            ]
        ];
    }

    public function dto(): UpdateFamilyMemberRoleRequestData
    {
        return new UpdateFamilyMemberRoleRequestData(
            role: FamilyRoleEnum::tryFrom((int)$this->input(self::ROLE)),
            familySlug: $this->getFamilySlug(),
            memberId: $this->getFamilyMemberId()
        );
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            self::FAMILY_SLUG_ROUTE_KEY => $this->getFamilySlug(),
            self::FAMILY_MEMBER_ID => $this->getFamilyMemberId(),
        ]);
    }

    public function getFamilySlug(): string
    {
        return (string)$this->route(self::FAMILY_SLUG_ROUTE_KEY);
    }

    public function getFamilyMemberId(): int
    {
        return (int)$this->route(self::FAMILY_MEMBER_ID);
    }

    public function responseResource(FamilyMember $familyMember): FamilyMemberResource
    {
        return new FamilyMemberResource($familyMember);
    }
}
