<?php

declare(strict_types=1);

namespace App\DataTransferObjects\Auth;

use App\Models\Users\User;
use Spatie\LaravelData\Data;

class AuthResponseData extends Data
{
    public function __construct(
        public User   $user,
        public string $token,
        public string $tokenType,
    )
    {
    }
}
