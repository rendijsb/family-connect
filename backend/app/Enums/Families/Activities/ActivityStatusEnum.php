<?php

declare(strict_types=1);

namespace App\Enums\Families\Activities;

enum ActivityStatusEnum: string
{
    case PLANNED = 'planned';
    case ACTIVE = 'active';
    case COMPLETED = 'completed';
    case CANCELLED = 'cancelled';

    /**
     * Get the display name
     */
    public function getDisplayName(): string
    {
        return match($this) {
            self::PLANNED => 'Planned',
            self::ACTIVE => 'Active',
            self::COMPLETED => 'Completed',
            self::CANCELLED => 'Cancelled',
        };
    }

    /**
     * Get the description
     */
    public function getDescription(): string
    {
        return match($this) {
            self::PLANNED => 'Activity is planned for the future',
            self::ACTIVE => 'Activity is currently ongoing',
            self::COMPLETED => 'Activity has been completed',
            self::CANCELLED => 'Activity has been cancelled',
        };
    }

    /**
     * Get status color for UI
     */
    public function getColor(): string
    {
        return match($this) {
            self::PLANNED => '#f59e0b',
            self::ACTIVE => '#3b82f6',
            self::COMPLETED => '#22c55e',
            self::CANCELLED => '#ef4444',
        };
    }

    /**
     * Check if activity can be edited
     */
    public function canBeEdited(): bool
    {
        return match($this) {
            self::PLANNED, self::ACTIVE => true,
            self::COMPLETED, self::CANCELLED => false,
        };
    }

    /**
     * Check if activity can be cancelled
     */
    public function canBeCancelled(): bool
    {
        return match($this) {
            self::PLANNED, self::ACTIVE => true,
            self::COMPLETED, self::CANCELLED => false,
        };
    }
}
