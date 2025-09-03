<?php

declare(strict_types=1);

namespace App\DataTransferObjects\Auth;

use Spatie\LaravelData\Data;

class LoginRequestData extends Data
{
    public function __construct(
        public string $email,
        public string $password,
        public bool   $remember,
    )
    {
    }
}
