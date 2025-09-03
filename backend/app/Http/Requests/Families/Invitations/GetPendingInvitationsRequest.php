<?php

declare(strict_types=1);

namespace App\Http\Requests\Families\Invitations;

use App\Http\Resources\Families\Invitations\FamilyInvitationResourceCollection;
use App\Models\Families\FamilyInvitation;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Collection;

class GetPendingInvitationsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [];
    }

    public function responseResource(Collection $invitations): FamilyInvitationResourceCollection
    {
        return new FamilyInvitationResourceCollection($invitations);
    }
}
