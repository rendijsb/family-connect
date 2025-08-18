<?php

declare(strict_types=1);

namespace App\Models\Images;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;

class Image extends Model
{
    const ID = 'id';
    const RELATED_ID = 'related_id';
    const IMAGE_LINK = 'image_link';
    const TYPE = 'type';
    const IS_PRIMARY = 'is_primary';
    const CREATED_AT = 'created_at';
    const UPDATED_AT = 'updated_at';

    protected $fillable = [
        self::RELATED_ID,
        self::IMAGE_LINK,
        self::TYPE,
        self::IS_PRIMARY
    ];

    protected $casts = [
        self::IS_PRIMARY => 'boolean',
    ];

    public function getId(): int
    {
        return $this->getAttribute(self::ID);
    }

    public function getRelatedId(): int
    {
        return $this->getAttribute(self::RELATED_ID);
    }

    public function getImageLink(): string
    {
        return $this->getAttribute(self::IMAGE_LINK);
    }

    public function getType(): string
    {
        return $this->getAttribute(self::TYPE);
    }

    public function getIsPrimary(): bool
    {
        return $this->getAttribute(self::IS_PRIMARY);
    }

    public function getCreatedAt(): Carbon
    {
        return $this->getAttribute(self::CREATED_AT);
    }
}
