<?php

declare(strict_types=1);

namespace App\Enums\Roles;

enum RoleEnum: int
{
    case ADMIN = 1;
    case MODERATOR = 2;
    case FAMILY_OWNER = 3;
    case FAMILY_MEMBER = 4;
    case CLIENT = 5;

    /**
     * Get the role name
     */
    public function getName(): string
    {
        return match($this) {
            self::ADMIN => 'admin',
            self::MODERATOR => 'moderator',
            self::FAMILY_OWNER => 'family_owner',
            self::FAMILY_MEMBER => 'family_member',
            self::CLIENT => 'client',
        };
    }

    /**
     * Get the display name
     */
    public function getDisplayName(): string
    {
        return match($this) {
            self::ADMIN => 'System Administrator',
            self::MODERATOR => 'System Moderator',
            self::FAMILY_OWNER => 'Family Owner',
            self::FAMILY_MEMBER => 'Family Member',
            self::CLIENT => 'Client',
        };
    }

    /**
     * Get the description
     */
    public function getDescription(): string
    {
        return match($this) {
            self::ADMIN => 'Full system access and management capabilities',
            self::MODERATOR => 'Limited system management and moderation capabilities',
            self::FAMILY_OWNER => 'Creator and administrator of a family group',
            self::FAMILY_MEMBER => 'Member of a family group with standard permissions',
            self::CLIENT => 'General user with basic access permissions',
        };
    }
}
