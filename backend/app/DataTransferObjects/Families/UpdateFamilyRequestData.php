<?php

declare(strict_types=1);

namespace App\DataTransferObjects\Families;

use Spatie\LaravelData\Data;

class UpdateFamilyRequestData extends Data
{
    public function __construct(
        public string  $name,
        public ?string $description,
        public ?array  $settings,
        public ?bool   $isActive,
        public int     $familyId,
    )
    {
    }
}
