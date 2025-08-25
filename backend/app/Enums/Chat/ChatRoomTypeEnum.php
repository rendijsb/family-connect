<?php

declare(strict_types=1);

namespace App\Enums\Chat;

enum ChatRoomTypeEnum: string
{
    case GROUP = 'group';
    case DIRECT = 'direct';
    case ANNOUNCEMENT = 'announcement';
    case EMERGENCY = 'emergency';
}
