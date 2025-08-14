<?php

declare(strict_types=1);

namespace App\Http\Requests\Families;

use App\Models\Families\FamilyInvitation;
use App\Services\Validation\ValidationRuleHelper;
use Illuminate\Foundation\Http\FormRequest;

class DeleteInvitationRequest extends FormRequest
{
    private const INVITATION_ID_ROUTE_KEY = 'invitation_id';

    public function rules(): array
    {
        return [
            self::INVITATION_ID_ROUTE_KEY => [
                ValidationRuleHelper::REQUIRED,
                ValidationRuleHelper::existsOnDatabase(FamilyInvitation::class, FamilyInvitation::ID),
            ],
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            self::INVITATION_ID_ROUTE_KEY => $this->getInvitationId(),
        ]);
    }

    public function getInvitationId(): int
    {
        return (int)$this->route(self::INVITATION_ID_ROUTE_KEY);
    }
}
