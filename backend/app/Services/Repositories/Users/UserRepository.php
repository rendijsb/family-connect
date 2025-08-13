<?php

declare(strict_types=1);

namespace App\Services\Repositories\Users;

use App\Enums\Roles\RoleEnum;
use App\Models\Users\User;
use Illuminate\Database\Eloquent\ModelNotFoundException;

readonly class UserRepository
{
    public function __construct(
        private User $user,
    )
    {
    }

    /**
     * @throws ModelNotFoundException
     */
    public function findOrFail(int $userId): User
    {
        return $this->user->findOrFail($userId);
    }

    /**
     * @throws ModelNotFoundException
     */
    public function updateToFamilyLeader(int $userId): User
    {
        $user = $this->findOrFail($userId);

        $payload = [
            User::ROLE_ID => RoleEnum::FAMILY_OWNER
        ];

        $user->update($payload);

        return $user->refresh();
    }
}
