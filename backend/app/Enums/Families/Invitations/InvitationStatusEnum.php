<?php

declare(strict_types=1);

namespace App\Enums\Families\Invitations;

enum InvitationStatusEnum: string
{
    case PENDING = 'pending';
    case ACCEPTED = 'accepted';
    case DECLINED = 'declined';
    case EXPIRED = 'expired';

    /**
     * Get the display name
     */
    public function getDisplayName(): string
    {
        return match($this) {
            self::PENDING => 'Pending',
            self::ACCEPTED => 'Accepted',
            self::DECLINED => 'Declined',
            self::EXPIRED => 'Expired',
        };
    }

    /**
     * Get status color for UI
     */
    public function getColor(): string
    {
        return match($this) {
            self::PENDING => '#f59e0b',
            self::ACCEPTED => '#22c55e',
            self::DECLINED => '#ef4444',
            self::EXPIRED => '#6b7280',
        };
    }
}
