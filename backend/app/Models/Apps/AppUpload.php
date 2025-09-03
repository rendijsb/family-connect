<?php

declare(strict_types=1);

namespace App\Models\Apps;

use App\Models\Users\User;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class AppUpload extends Model
{
    public const TABLE = 'app_uploads';
    protected $table = self::TABLE;

    public const PLATFORM_ANDROID = 'android';
    public const PLATFORM_IOS = 'ios';

    public const ID = 'id';
    public const PLATFORM = 'platform';
    public const VERSION = 'version';
    public const BUILD_NUMBER = 'build_number';
    public const FILE_NAME = 'file_name';
    public const S3_KEY = 's3_key';
    public const S3_URL = 's3_url';
    public const FILE_SIZE = 'file_size';
    public const FILE_HASH = 'file_hash';
    public const IS_ACTIVE = 'is_active';
    public const METADATA = 'metadata';
    public const DOWNLOAD_COUNT = 'download_count';
    public const UPLOADED_BY = 'uploaded_by';
    public const UPLOADED_AT = 'uploaded_at';
    public const CREATED_AT = 'created_at';
    public const UPDATED_AT = 'updated_at';

    protected $fillable = [
        self::PLATFORM,
        self::VERSION,
        self::BUILD_NUMBER,
        self::FILE_NAME,
        self::S3_KEY,
        self::S3_URL,
        self::FILE_SIZE,
        self::FILE_HASH,
        self::IS_ACTIVE,
        self::METADATA,
        self::DOWNLOAD_COUNT,
        self::UPLOADED_BY,
        self::UPLOADED_AT,
    ];

    protected $casts = [
        self::IS_ACTIVE => 'boolean',
        self::FILE_SIZE => 'integer',
        self::DOWNLOAD_COUNT => 'integer',
        self::METADATA => 'array',
        self::UPLOADED_AT => 'datetime',
    ];

    public const UPLOADER_RELATION = 'uploader';

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, self::UPLOADED_BY, User::ID);
    }

    public function getId(): int
    {
        return $this->getAttribute(self::ID);
    }

    public function getPlatform(): string
    {
        return $this->getAttribute(self::PLATFORM);
    }

    public function getVersion(): string
    {
        return $this->getAttribute(self::VERSION);
    }

    public function getBuildNumber(): ?string
    {
        return $this->getAttribute(self::BUILD_NUMBER);
    }

    public function getFileName(): string
    {
        return $this->getAttribute(self::FILE_NAME);
    }

    public function getS3Key(): string
    {
        return $this->getAttribute(self::S3_KEY);
    }

    public function getS3Url(): string
    {
        return $this->getAttribute(self::S3_URL);
    }

    public function getFileSize(): int
    {
        return $this->getAttribute(self::FILE_SIZE);
    }

    public function getFileHash(): ?string
    {
        return $this->getAttribute(self::FILE_HASH);
    }

    public function getIsActive(): bool
    {
        return $this->getAttribute(self::IS_ACTIVE);
    }

    public function getMetadata(): ?array
    {
        return $this->getAttribute(self::METADATA);
    }

    public function getDownloadCount(): int
    {
        return $this->getAttribute(self::DOWNLOAD_COUNT);
    }

    public function getUploadedBy(): int
    {
        return $this->getAttribute(self::UPLOADED_BY);
    }

    public function getUploadedAt(): Carbon
    {
        return $this->getAttribute(self::UPLOADED_AT);
    }

    public function getCreatedAt(): Carbon
    {
        return $this->getAttribute(self::CREATED_AT);
    }

    public function getUpdatedAt(): Carbon
    {
        return $this->getAttribute(self::UPDATED_AT);
    }


    /**
     * Get formatted file size
     */
    public function getFormattedFileSize(): string
    {
        $bytes = $this->getFileSize();
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];

        for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
            $bytes /= 1024;
        }

        return round($bytes, 2) . ' ' . $units[$i];
    }

    /**
     * Get full version string
     */
    public function getFullVersion(): string
    {
        $version = $this->getVersion();
        $buildNumber = $this->getBuildNumber();

        return $buildNumber ? "{$version} ({$buildNumber})" : $version;
    }

    /**
     * Check if file exists in S3
     */
    public function fileExists(): bool
    {
        return Storage::disk('s3')->exists($this->getS3Key());
    }

    /**
     * Get direct download URL (signed for security)
     */
    public function getDownloadUrl(int $expirationMinutes = 60): string
    {
        return Storage::disk('s3')->temporaryUrl(
            $this->getS3Key(),
            now()->addMinutes($expirationMinutes)
        );
    }

    /**
     * Increment download counter
     */
    public function incrementDownloadCount(): void
    {
        $this->increment(self::DOWNLOAD_COUNT);
    }

    /**
     * Delete file from S3
     */
    public function deleteFile(): bool
    {
        return Storage::disk('s3')->delete($this->getS3Key());
    }

    // Static Methods

    /**
     * Get active version for platform
     */
    public static function getActiveVersion(string $platform): ?self
    {
        return static::where(self::PLATFORM, $platform)
            ->where(self::IS_ACTIVE, true)
            ->first();
    }

    /**
     * Get all versions for platform
     */
    public static function getVersionsForPlatform(string $platform): \Illuminate\Database\Eloquent\Collection
    {
        return static::where(self::PLATFORM, $platform)
            ->orderBy(self::UPLOADED_AT, 'desc')
            ->get();
    }

    /**
     * Deactivate all versions for platform
     */
    public static function deactivateAllForPlatform(string $platform): void
    {
        static::where(self::PLATFORM, $platform)
            ->where(self::IS_ACTIVE, true)
            ->update([self::IS_ACTIVE => false]);
    }

    /**
     * Generate S3 key for upload
     */
    public static function generateS3Key(string $platform, string $version, string $fileName): string
    {
        $extension = pathinfo($fileName, PATHINFO_EXTENSION);
        $timestamp = now()->format('Y-m-d_H-i-s');

        return "apps/{$platform}/{$version}/{$timestamp}.{$extension}";
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where(self::IS_ACTIVE, true);
    }

    public function scopePlatform($query, string $platform)
    {
        return $query->where(self::PLATFORM, $platform);
    }

    public function scopeVersion($query, string $version)
    {
        return $query->where(self::VERSION, $version);
    }
}
