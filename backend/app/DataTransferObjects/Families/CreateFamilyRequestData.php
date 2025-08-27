<?php

declare(strict_types=1);

namespace App\DataTransferObjects\Families;

use App\Enums\Families\FamilyPrivacyEnum;
use Spatie\LaravelData\Data;

class CreateFamilyRequestData extends Data
{
    public function __construct(
        public string $name,
        public ?string $description = null,
        public FamilyPrivacyEnum $privacy,
        public ?string $timezone = null,
        public ?string $language = null,
        public ?int $maxMembers = null,
    )
    {
    }
}
