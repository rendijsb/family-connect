<?php

declare(strict_types=1);

namespace App\Enums\Families;

enum FamilyRoleEnum: int
{
    case OWNER = 1;
    case MODERATOR = 2;
    case MEMBER = 3;
    case CHILD = 4;

    public function getName(): string
    {
        return match($this) {
            self::OWNER => 'owner',
            self::MODERATOR => 'moderator',
            self::MEMBER => 'member',
            self::CHILD => 'child',
        };
    }

    public function getDisplayName(): string
    {
        return match($this) {
            self::OWNER => 'Family Owner',
            self::MODERATOR => 'Family Moderator',
            self::MEMBER => 'Family Member',
            self::CHILD => 'Child Member',
        };
    }

    public function getPermissions(): array
    {
        return match($this) {
            self::OWNER => ['all'],
            self::MODERATOR => ['manage_members', 'manage_events', 'manage_photos', 'manage_chat'],
            self::MEMBER => ['view_all', 'create_events', 'upload_photos', 'chat'],
            self::CHILD => ['view_limited', 'chat_limited'],
        };
    }
}
