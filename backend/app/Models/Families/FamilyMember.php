<?php

declare(strict_types=1);

namespace App\Models\Families;

use App\Enums\Families\FamilyRoleEnum;
use Illuminate\Database\Eloquent\Model;

class FamilyMember extends Model
{
    public const TABLE = 'family_members';
    protected $table = self::TABLE;

    public const ID = 'id';
    public const FAMILY_ID = 'family_id';
    public const USER_ID = 'user_id';
    public const ROLE = 'role';
    public const NICKNAME = 'nickname';
    public const RELATIONSHIP = 'relationship';
    public const PERMISSIONS = 'permissions';
    public const NOTIFICATIONS_ENABLED = 'notifications_enabled';
    public const IS_ACTIVE = 'is_active';
    public const JOINED_AT = 'joined_at';
    public const LAST_SEEN_AT = 'last_seen_at';
    public const CREATED_AT = 'created_at';
    public const UPDATED_AT = 'updated_at';

    protected $fillable = [
        self::FAMILY_ID,
        self::USER_ID,
        self::ROLE,
        self::NICKNAME,
        self::RELATIONSHIP,
        self::PERMISSIONS,
        self::NOTIFICATIONS_ENABLED,
        self::IS_ACTIVE,
        self::JOINED_AT,
        self::LAST_SEEN_AT,
    ];

    protected $casts = [
        self::ROLE => FamilyRoleEnum::class,
        self::PERMISSIONS => 'array',
        self::NOTIFICATIONS_ENABLED => 'boolean',
        self::IS_ACTIVE => 'boolean',
        self::JOINED_AT => 'datetime',
        self::LAST_SEEN_AT => 'datetime',
        self::CREATED_AT => 'datetime',
        self::UPDATED_AT => 'datetime',
    ];
}
