<?php

declare(strict_types=1);

namespace App\DataTransferObjects\Families;

use App\Enums\Families\FamilyPrivacyLevelEnum;
use Spatie\LaravelData\Data;

class CreateFamilyRequestData extends Data
{
    public function __construct(
        public string                 $name,
        public string                 $description,
        public FamilyPrivacyLevelEnum $privacyLevel,
        public array                  $settings,
    )
    {
    }
}
