<?php

declare(strict_types=1);

namespace App\Enums\Families\Activities;

enum ActivityTypeEnum: string
{
    case EVENT = 'event';
    case MILESTONE = 'milestone';
    case ACHIEVEMENT = 'achievement';
    case MEMORY = 'memory';
    case ANNOUNCEMENT = 'announcement';

    /**
     * Get the display name
     */
    public function getDisplayName(): string
    {
        return match($this) {
            self::EVENT => 'Event',
            self::MILESTONE => 'Milestone',
            self::ACHIEVEMENT => 'Achievement',
            self::MEMORY => 'Memory',
            self::ANNOUNCEMENT => 'Announcement',
        };
    }

    /**
     * Get the description
     */
    public function getDescription(): string
    {
        return match($this) {
            self::EVENT => 'Planned family events and gatherings',
            self::MILESTONE => 'Important family milestones and celebrations',
            self::ACHIEVEMENT => 'Family member achievements and accomplishments',
            self::MEMORY => 'Shared family memories and moments',
            self::ANNOUNCEMENT => 'Family announcements and updates',
        };
    }

    /**
     * Get icon for UI
     */
    public function getIcon(): string
    {
        return match($this) {
            self::EVENT => '📅',
            self::MILESTONE => '🎉',
            self::ACHIEVEMENT => '🏆',
            self::MEMORY => '💭',
            self::ANNOUNCEMENT => '📢',
        };
    }

    /**
     * Get color for UI
     */
    public function getColor(): string
    {
        return match($this) {
            self::EVENT => '#3b82f6',
            self::MILESTONE => '#f59e0b',
            self::ACHIEVEMENT => '#10b981',
            self::MEMORY => '#8b5cf6',
            self::ANNOUNCEMENT => '#ef4444',
        };
    }
}
