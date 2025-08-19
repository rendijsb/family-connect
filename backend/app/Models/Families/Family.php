<?php

declare(strict_types=1);

namespace App\Models\Families;

use App\Enums\Families\FamilyPrivacyEnum;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

/**
 * @mixin Builder
 */
class Family extends Model
{
    public const TABLE = 'families';
    protected $table = self::TABLE;

    public const ID = 'id';
    public const NAME = 'name';
    public const SLUG = 'slug';
    public const DESCRIPTION = 'description';
    public const OWNER_ID = 'owner_id';
    public const PRIVACY = 'privacy';
    public const JOIN_CODE = 'join_code';
    public const SETTINGS = 'settings';
    public const TIMEZONE = 'timezone';
    public const LANGUAGE = 'language';
    public const MAX_MEMBERS = 'max_members';
    public const IS_ACTIVE = 'is_active';
    public const LAST_ACTIVITY_AT = 'last_activity_at';
    public const CREATED_AT = 'created_at';
    public const UPDATED_AT = 'updated_at';

    protected $fillable = [
        self::NAME,
        self::SLUG,
        self::DESCRIPTION,
        self::OWNER_ID,
        self::PRIVACY,
        self::JOIN_CODE,
        self::SETTINGS,
        self::TIMEZONE,
        self::LANGUAGE,
        self::MAX_MEMBERS,
        self::IS_ACTIVE,
    ];

    protected $casts = [
        self::SETTINGS => 'array',
        self::IS_ACTIVE => 'boolean',
        self::LAST_ACTIVITY_AT => 'datetime',
        self::PRIVACY => FamilyPrivacyEnum::class,
        self::CREATED_AT => 'datetime',
        self::UPDATED_AT => 'datetime',
    ];
}
