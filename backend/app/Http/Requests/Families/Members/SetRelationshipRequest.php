<?php

declare(strict_types=1);

namespace App\Http\Requests\Families\Members;

use App\DataTransferObjects\Families\Members\SetRelationshipRequestData;
use App\Enums\Families\RelationshipTypeEnum;
use App\Models\Families\Family;
use App\Models\Families\FamilyMember;
use App\Services\Validation\ValidationRuleHelper;
use Illuminate\Foundation\Http\FormRequest;

class SetRelationshipRequest extends FormRequest
{
    private const RELATED_MEMBER_ID = 'relatedMemberId';
    private const RELATIONSHIP_TYPE = 'relationshipType';
    private const IS_GUARDIAN = 'isGuardian';
    private const FAMILY_SLUG_ROUTE_KEY = 'family_slug';
    private const FAMILY_MEMBER_ID = 'member_id';

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            self::RELATED_MEMBER_ID => [
                ValidationRuleHelper::REQUIRED,
                ValidationRuleHelper::INTEGER,
                ValidationRuleHelper::existsOnDatabase(FamilyMember::class, FamilyMember::ID),
            ],
            self::RELATIONSHIP_TYPE => [
                ValidationRuleHelper::REQUIRED,
                ValidationRuleHelper::STRING,
                ValidationRuleHelper::enum(RelationshipTypeEnum::class),
            ],
            self::IS_GUARDIAN => [
                ValidationRuleHelper::NULLABLE,
                ValidationRuleHelper::BOOLEAN,
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

    public function dto(): SetRelationshipRequestData
    {
        return new SetRelationshipRequestData(
            relatedMemberId: (int)$this->input(self::RELATED_MEMBER_ID),
            relationshipType: RelationshipTypeEnum::from($this->input(self::RELATIONSHIP_TYPE)),
            isGuardian: $this->boolean(self::IS_GUARDIAN),
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
        return $this->route('family_slug');
    }

    public function getFamilyMemberId(): int
    {
        return (int)$this->route('member_id');
    }
}
