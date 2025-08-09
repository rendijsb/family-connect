<?php

declare(strict_types=1);

namespace App\Enums\Families;

enum FamilyMemberStatusEnum: string
{
    case ACTIVE = 'active';
    case INACTIVE = 'inactive';
    case BLOCKED = 'blocked';
    case PENDING = 'pending';
}
