<?php

declare(strict_types=1);

namespace App\DataTransferObjects\Families\Members;

use Spatie\LaravelData\Data;

class UpdateFamilyMemberRequestData extends Data
{
    public function __construct(
        public ?string $nickname,
        public ?string $phone,
        public ?string $birthday,
        public ?string $avatar,
        public ?bool $notificationsEnabled,
        public string $familySlug,
        public int $memberId
    )
    {
    }
}
