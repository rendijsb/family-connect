<?php

declare(strict_types=1);

namespace App\DataTransferObjects\Auth;

use Carbon\Carbon;
use Spatie\LaravelData\Data;

class RegisterRequestData extends Data
{
    public function __construct(
        public string  $name,
        public string  $email,
        public string  $password,
        public ?string $phone,
        public ?Carbon $dateOfBirth,
    )
    {
    }
}
