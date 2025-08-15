<?php

declare(strict_types=1);

namespace App\Http\Requests\Families\Invitations;

use App\Http\Resources\Families\Invitations\FamilyInvitationResourceCollection;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Collection;

class GetUserInvitationsRequest extends FormRequest
{
    public function rules(): array
    {
        return [

        ];
    }

    public function responseResource(Collection $familyInvitations): FamilyInvitationResourceCollection
    {
        return new FamilyInvitationResourceCollection($familyInvitations);
    }
}
