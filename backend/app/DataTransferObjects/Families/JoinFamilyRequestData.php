<?php

declare(strict_types=1);

namespace App\DataTransferObjects\Families;

use Spatie\LaravelData\Data;

class JoinFamilyRequestData extends Data
{
    public function __construct(
        public string $joinCode
    )
    {
    }
}
