<?php

declare(strict_types=1);

namespace App\Enums\Families;

enum FamilyPrivacyLevelEnum: string
{
    case PUBLIC = 'public';
    case PRIVATE = 'private';
    case INVITE_ONLY = 'invite_only';

    /**
     * Get the display name
     */
    public function getDisplayName(): string
    {
        return match($this) {
            self::PUBLIC => 'Public',
            self::PRIVATE => 'Private',
            self::INVITE_ONLY => 'Invite Only',
        };
    }

    /**
     * Get the description
     */
    public function getDescription(): string
    {
        return match($this) {
            self::PUBLIC => 'Visible to everyone and searchable',
            self::PRIVATE => 'Only visible to family members',
            self::INVITE_ONLY => 'Only accessible through invitations',
        };
    }
}
