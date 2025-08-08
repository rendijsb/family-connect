<?php

declare(strict_types=1);

namespace App\Services\Repositories\Auth;

use App\Models\Users\User;

class AuthRepository
{
    public function __construct(
        User $user,
    )
    {
    }
}
