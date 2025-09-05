<?php

declare(strict_types=1);

namespace App\Enums\Families;

enum FamilyPrivacyEnum: string
{
    case PUBLIC = 'public';
    case PRIVATE = 'private';
    case INVITE_ONLY = 'invite_only';
}
