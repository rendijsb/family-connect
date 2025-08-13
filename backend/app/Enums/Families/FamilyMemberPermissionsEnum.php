<?php

declare(strict_types=1);

namespace App\Enums\Families;

enum FamilyMemberPermissionsEnum: string
{
    case MANAGE_FAMILY_PERMISSION = 'manage_family';
    case INVITE_MEMBERS_PERMISSION = 'invite_members';
    case REMOVE_MEMBERS_PERMISSION = 'remove_members';
    case MANAGE_SETTINGS_PERMISSION = 'manage_settings';
    case CREATE_EVENTS_PERMISSION = 'create_events';
    case UPLOAD_PHOTOS_PERMISSION = 'upload_photos';
    case SEND_MESSAGES_PERMISSION = 'send_messages';
    case VIEW_LOCATIONS_PERMISSION = 'view_locations';
    case VIEW_EXPENSES_PERMISSION = 'view_expenses';

    public function getAllPermissions(): array
    {
        return [
            self::MANAGE_FAMILY_PERMISSION->value,
            self::INVITE_MEMBERS_PERMISSION->value,
            self::REMOVE_MEMBERS_PERMISSION->value,
            self::MANAGE_SETTINGS_PERMISSION->value,
            self::CREATE_EVENTS_PERMISSION->value,
            self::UPLOAD_PHOTOS_PERMISSION->value,
            self::SEND_MESSAGES_PERMISSION->value,
            self::VIEW_LOCATIONS_PERMISSION->value,
            self::VIEW_EXPENSES_PERMISSION->value,
        ];
    }
}
