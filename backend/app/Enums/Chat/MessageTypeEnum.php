<?php

declare(strict_types=1);

namespace App\Enums\Chat;

enum MessageTypeEnum: string
{
    case TEXT = 'text';
    case IMAGE = 'image';
    case VIDEO = 'video';
    case AUDIO = 'audio';
    case FILE = 'file';
    case LOCATION = 'location';
    case POLL = 'poll';
    case EVENT = 'event';
    case SYSTEM = 'system';

    public function getMaxSize(): int
    {
        return match($this) {
            self::TEXT => 5000, // characters
            self::IMAGE => 10 * 1024 * 1024, // 10MB
            self::VIDEO => 100 * 1024 * 1024, // 100MB
            self::AUDIO => 20 * 1024 * 1024, // 20MB
            self::FILE => 50 * 1024 * 1024, // 50MB
            default => 0,
        };
    }
}
