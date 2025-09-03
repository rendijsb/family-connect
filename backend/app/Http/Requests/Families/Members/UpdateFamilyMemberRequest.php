<?php

declare(strict_types=1);

namespace App\Http\Requests\Families\Members;

use App\DataTransferObjects\Families\Members\UpdateFamilyMemberRequestData;
use App\Http\Resources\Families\Members\FamilyMemberResource;
use App\Models\Families\Family;
use App\Models\Families\FamilyMember;
use App\Services\Validation\ValidationRuleHelper;
use Illuminate\Foundation\Http\FormRequest;

class UpdateFamilyMemberRequest extends FormRequest
{
    private const NICKNAME = 'nickname';
    private const PHONE = 'phone';
    private const BIRTHDAY = 'birthday';
    private const AVATAR = 'avatar';
    private const NOTIFICATIONS_ENABLED = 'notificationsEnabled';
    private const FAMILY_SLUG_ROUTE_KEY = 'family_slug';
    private const FAMILY_MEMBER_ID = 'member_id';

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            self::NICKNAME => [
                ValidationRuleHelper::NULLABLE,
                ValidationRuleHelper::STRING,
                ValidationRuleHelper::max(100),
            ],
            self::PHONE => [
                ValidationRuleHelper::NULLABLE,
                ValidationRuleHelper::STRING,
                ValidationRuleHelper::max(20),
            ],
            self::BIRTHDAY => [
                ValidationRuleHelper::NULLABLE,
                ValidationRuleHelper::DATE,
            ],
            self::AVATAR => [
                ValidationRuleHelper::NULLABLE,
                ValidationRuleHelper::STRING,
                ValidationRuleHelper::max(255),
            ],
            self::NOTIFICATIONS_ENABLED => [
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

    public function dto(): UpdateFamilyMemberRequestData
    {
        return new UpdateFamilyMemberRequestData(
            nickname: $this->input(self::NICKNAME),
            phone: $this->input(self::PHONE),
            birthday: $this->input(self::BIRTHDAY),
            avatar: $this->input(self::AVATAR),
            notificationsEnabled: $this->boolean(self::NOTIFICATIONS_ENABLED),
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

    public function responseResource(FamilyMember $familyMember): FamilyMemberResource
    {
        return new FamilyMemberResource($familyMember);
    }
}
