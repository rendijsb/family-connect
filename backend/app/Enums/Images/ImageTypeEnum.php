<?php

declare(strict_types=1);

namespace App\Enums\Images;

enum ImageTypeEnum: string
{
    case FAMILY = 'family';
    case PROFILE = 'profile';

    public static function getRegexPattern(): string
    {
        return implode('|', array_column(self::cases(), 'value'));
    }
}
