<?php

declare(strict_types=1);

namespace App\Enums\Families;

enum FamilyRoleEnum: string
{
    case OWNER = 'owner';
    case ADMIN = 'admin';
    case MEMBER = 'member';

    /**
     * Get the display name
     */
    public function getDisplayName(): string
    {
        return match($this) {
            self::OWNER => 'Owner',
            self::ADMIN => 'Admin',
            self::MEMBER => 'Member',
        };
    }

    /**
     * Get the description
     */
    public function getDescription(): string
    {
        return match($this) {
            self::OWNER => 'Creator and administrator of the family with full permissions',
            self::ADMIN => 'Administrator with elevated permissions to manage family members',
            self::MEMBER => 'Standard family member with basic permissions',
        };
    }

    /**
     * Get role color for UI
     */
    public function getColor(): string
    {
        return match($this) {
            self::OWNER => '#dc2626',
            self::ADMIN => '#3b82f6',
            self::MEMBER => '#22c55e',
        };
    }
}
