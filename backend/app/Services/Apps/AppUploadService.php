<?php

declare(strict_types=1);

namespace App\Services\Apps;

use App\Models\Apps\AppUpload;
use App\Models\Users\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class AppUploadService
{
    private const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB
    private const ALLOWED_EXTENSIONS = ['apk', 'ipa'];

    /**
     * Upload app file to S3 and create database record
     */
    public function uploadApp(
        UploadedFile $file,
        string $platform,
        string $version,
        ?string $buildNumber = null,
        ?array $metadata = null,
        ?User $uploader = null
    ): AppUpload {
        $this->validateFile($file, $platform);
        $this->validateVersion($platform, $version, $buildNumber);

        return DB::transaction(function () use ($file, $platform, $version, $buildNumber, $metadata, $uploader) {
            // Generate S3 key and upload file
            $s3Key = $this->generateS3Key($platform, $version, $file->getClientOriginalName());
            $fileHash = hash_file('sha256', $file->getPathname());

            // Upload to S3
            $uploaded = Storage::disk('s3')->putFileAs(
                dirname($s3Key),
                $file,
                basename($s3Key)
            );

            if (!$uploaded) {
                throw new \Exception('Failed to upload file to S3');
            }

            // Get S3 URL
            $s3Url = Storage::disk('s3')->url($s3Key);

            // Deactivate previous active versions for this platform
            AppUpload::deactivateAllForPlatform($platform);

            // Create database record
            $appUpload = AppUpload::create([
                AppUpload::PLATFORM => $platform,
                AppUpload::VERSION => $version,
                AppUpload::BUILD_NUMBER => $buildNumber,
                AppUpload::FILE_NAME => $file->getClientOriginalName(),
                AppUpload::S3_KEY => $s3Key,
                AppUpload::S3_URL => $s3Url,
                AppUpload::FILE_SIZE => $file->getSize(),
                AppUpload::FILE_HASH => $fileHash,
                AppUpload::IS_ACTIVE => true,
                AppUpload::METADATA => array_merge($metadata ?? [], [
                    'original_filename' => $file->getClientOriginalName(),
                    'mime_type' => $file->getMimeType(),
                    'upload_ip' => request()->ip(),
                    'user_agent' => request()->userAgent(),
                ]),
                AppUpload::UPLOADED_BY => $uploader?->getId() ?? auth()->id(),
                AppUpload::UPLOADED_AT => now(),
            ]);

            Log::info('App uploaded successfully', [
                'platform' => $platform,
                'version' => $version,
                'build_number' => $buildNumber,
                'file_size' => $file->getSize(),
                'uploader' => $uploader?->getEmail() ?? auth()->user()?->getEmail(),
                's3_key' => $s3Key,
            ]);

            return $appUpload;
        });
    }

    /**
     * Set a specific version as active
     */
    public function setActiveVersion(int $uploadId): AppUpload
    {
        return DB::transaction(function () use ($uploadId) {
            $upload = AppUpload::findOrFail($uploadId);

            // Deactivate all versions for this platform
            AppUpload::deactivateAllForPlatform($upload->getPlatform());

            // Activate this version
            $upload->update([AppUpload::IS_ACTIVE => true]);

            Log::info('Active version changed', [
                'platform' => $upload->getPlatform(),
                'version' => $upload->getFullVersion(),
                'upload_id' => $uploadId,
            ]);

            return $upload->fresh();
        });
    }

    /**
     * Delete app upload and file from S3
     */
    public function deleteUpload(int $uploadId): bool
    {
        return DB::transaction(function () use ($uploadId) {
            $upload = AppUpload::findOrFail($uploadId);

            // Delete from S3
            $deleted = Storage::disk('s3')->delete($upload->getS3Key());

            if ($deleted) {
                $upload->delete();

                Log::info('App upload deleted', [
                    'platform' => $upload->getPlatform(),
                    'version' => $upload->getFullVersion(),
                    's3_key' => $upload->getS3Key(),
                ]);

                return true;
            }

            return false;
        });
    }

    /**
     * Get download URL with tracking
     */
    public function getDownloadUrl(int $uploadId, int $expirationMinutes = 60): string
    {
        $upload = AppUpload::findOrFail($uploadId);
        $upload->incrementDownloadCount();

        return $upload->getDownloadUrl($expirationMinutes);
    }

    /**
     * Get active download URL for platform
     */
    public function getActiveDownloadUrl(string $platform, int $expirationMinutes = 60): ?string
    {
        $activeUpload = AppUpload::getActiveVersion($platform);

        if (!$activeUpload) {
            return null;
        }

        $activeUpload->incrementDownloadCount();
        return $activeUpload->getDownloadUrl($expirationMinutes);
    }

    /**
     * Get upload statistics
     */
    public function getStatistics(): array
    {
        return [
            'total_uploads' => AppUpload::count(),
            'android_uploads' => AppUpload::platform(AppUpload::PLATFORM_ANDROID)->count(),
            'ios_uploads' => AppUpload::platform(AppUpload::PLATFORM_IOS)->count(),
            'total_downloads' => AppUpload::sum(AppUpload::DOWNLOAD_COUNT),
            'total_storage_size' => AppUpload::sum(AppUpload::FILE_SIZE),
            'active_versions' => [
                'android' => AppUpload::getActiveVersion(AppUpload::PLATFORM_ANDROID)?->getFullVersion(),
                'ios' => AppUpload::getActiveVersion(AppUpload::PLATFORM_IOS)?->getFullVersion(),
            ],
            'recent_uploads' => AppUpload::with('uploader')
                ->orderBy(AppUpload::UPLOADED_AT, 'desc')
                ->limit(5)
                ->get()
                ->map(fn($upload) => [
                    'platform' => $upload->getPlatform(),
                    'version' => $upload->getFullVersion(),
                    'size' => $upload->getFormattedFileSize(),
                    'uploader' => $upload->uploader->getName(),
                    'uploaded_at' => $upload->getUploadedAt()->diffForHumans(),
                ])
        ];
    }

    /**
     * Clean up old uploads (keep last N versions per platform)
     */
    public function cleanupOldUploads(int $keepVersionsPerPlatform = 5): array
    {
        $cleaned = ['android' => 0, 'ios' => 0];

        foreach ([AppUpload::PLATFORM_ANDROID, AppUpload::PLATFORM_IOS] as $platform) {
            $uploads = AppUpload::platform($platform)
                ->orderBy(AppUpload::UPLOADED_AT, 'desc')
                ->get();

            if ($uploads->count() > $keepVersionsPerPlatform) {
                $toDelete = $uploads->skip($keepVersionsPerPlatform);

                foreach ($toDelete as $upload) {
                    if (!$upload->getIsActive()) { // Never delete active version
                        $this->deleteUpload($upload->getId());
                        $cleaned[$platform]++;
                    }
                }
            }
        }

        Log::info('Cleanup completed', $cleaned);

        return $cleaned;
    }

    /**
     * Validate uploaded file
     */
    private function validateFile(UploadedFile $file, string $platform): void
    {
        if (!$file->isValid()) {
            throw new \InvalidArgumentException('Invalid file upload');
        }

        if ($file->getSize() > self::MAX_FILE_SIZE) {
            throw new \InvalidArgumentException('File size exceeds maximum allowed size of ' . (self::MAX_FILE_SIZE / 1024 / 1024) . 'MB');
        }

        $extension = strtolower($file->getClientOriginalExtension());
        $expectedExtension = $platform === AppUpload::PLATFORM_ANDROID ? 'apk' : 'ipa';

        if ($extension !== $expectedExtension) {
            throw new \InvalidArgumentException("File must be a {$expectedExtension} file for {$platform} platform");
        }

        if (!in_array($extension, self::ALLOWED_EXTENSIONS)) {
            throw new \InvalidArgumentException('File type not allowed');
        }
    }

    /**
     * Validate version doesn't already exist
     */
    private function validateVersion(string $platform, string $version, ?string $buildNumber): void
    {
        $exists = AppUpload::where(AppUpload::PLATFORM, $platform)
            ->where(AppUpload::VERSION, $version)
            ->when($buildNumber, function ($query, $buildNumber) {
                return $query->where(AppUpload::BUILD_NUMBER, $buildNumber);
            })
            ->exists();

        if ($exists) {
            $versionString = $buildNumber ? "{$version} ({$buildNumber})" : $version;
            throw new \InvalidArgumentException("Version {$versionString} already exists for {$platform}");
        }
    }

    /**
     * Generate S3 key for upload
     */
    private function generateS3Key(string $platform, string $version, string $fileName): string
    {
        $extension = pathinfo($fileName, PATHINFO_EXTENSION);
        $timestamp = now()->format('Y-m-d_H-i-s');
        $uuid = Str::uuid()->toString();

        return "apps/{$platform}/{$version}/{$timestamp}_{$uuid}.{$extension}";
    }
}
