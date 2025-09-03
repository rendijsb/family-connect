<?php

declare(strict_types=1);

namespace App\Http\Requests\Families\Invitations;

use App\Models\Families\FamilyInvitation;
use App\Services\Validation\ValidationRuleHelper;
use Illuminate\Foundation\Http\FormRequest;

class CancelInvitationRequest extends FormRequest
{
    private const INVITATION_ROUTE_KEY = 'invitation';

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            self::INVITATION_ROUTE_KEY => [
                ValidationRuleHelper::REQUIRED,
                ValidationRuleHelper::INTEGER,
                ValidationRuleHelper::existsOnDatabase(FamilyInvitation::class, FamilyInvitation::ID),
            ]
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            self::INVITATION_ROUTE_KEY => $this->getInvitationId(),
        ]);
    }

    public function getInvitationId(): int
    {
        return (int)$this->route('invitation');
    }
}
