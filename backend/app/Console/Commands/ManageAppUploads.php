<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\Apps\AppUpload;
use App\Models\Users\User;
use App\Services\Apps\AppUploadService;
use Illuminate\Console\Command;
use Illuminate\Http\UploadedFile;
use Symfony\Component\HttpFoundation\File\File;

class ManageAppUploads extends Command
{
    protected $signature = 'app:manage-uploads
                            {action : Action to perform (upload|list|activate|delete|cleanup|stats)}
                            {--platform= : Platform (android|ios)}
                            {--file= : File path for upload}
                            {--version= : Version number}
                            {--build= : Build number}
                            {--notes= : Release notes}
                            {--id= : Upload ID for activation/deletion}
                            {--keep= : Number of versions to keep during cleanup (default: 5)}';

    protected $description = 'Manage mobile app uploads via CLI';

    public function __construct(
        private readonly AppUploadService $appUploadService
    ) {
        parent::__construct();
    }

    public function handle(): int
    {
        $action = $this->argument('action');

        return match ($action) {
            'upload' => $this->handleUpload(),
            'list' => $this->handleList(),
            'activate' => $this->handleActivate(),
            'delete' => $this->handleDelete(),
            'cleanup' => $this->handleCleanup(),
            'stats' => $this->handleStats(),
            default => $this->handleInvalidAction(),
        };
    }

    private function handleUpload(): int
    {
        $platform = $this->option('platform');
        $filePath = $this->option('file');
        $version = $this->option('version');

        if (!$platform || !in_array($platform, ['android', 'ios'])) {
            $this->error('Please specify a valid platform: --platform=android or --platform=ios');
            return 1;
        }

        if (!$filePath || !file_exists($filePath)) {
            $this->error('Please specify a valid file path: --file=/path/to/app.apk');
            return 1;
        }

        if (!$version) {
            $this->error('Please specify a version: --version=1.2.0');
            return 1;
        }

        try {
            // Create an UploadedFile instance from the local file
            $file = new UploadedFile(
                $filePath,
                basename($filePath),
                mime_content_type($filePath),
                null,
                true // test mode - don't validate upload
            );

            // Get admin user for upload attribution
            $adminUser = User::where('role_id', 1)->first();
            if (!$adminUser) {
                $this->error('No admin user found. Please create an admin user first.');
                return 1;
            }

            $metadata = [];
            if ($notes = $this->option('notes')) {
                $metadata['notes'] = $notes;
            }
            $metadata['uploaded_via'] = 'cli';

            $this->info("Uploading {$platform} app...");
            $this->info("File: {$filePath}");
            $this->info("Version: {$version}");

            if ($buildNumber = $this->option('build')) {
                $this->info("Build: {$buildNumber}");
            }

            $upload = $this->appUploadService->uploadApp(
                $file,
                $platform,
                $version,
                $this->option('build'),
                $metadata,
                $adminUser
            );

            $this->info('✅ Upload successful!');
            $this->table(
                ['Property', 'Value'],
                [
                    ['ID', $upload->getId()],
                    ['Platform', ucfirst($upload->getPlatform())],
                    ['Version', $upload->getFullVersion()],
                    ['File Size', $upload->getFormattedFileSize()],
                    ['S3 Key', $upload->getS3Key()],
                    ['Active', $upload->getIsActive() ? 'Yes' : 'No'],
                    ['Uploaded At', $upload->getUploadedAt()->format('Y-m-d H:i:s')],
                ]
            );

            return 0;

        } catch (\Exception $e) {
            $this->error('Upload failed: ' . $e->getMessage());
            return 1;
        }
    }

    private function handleList(): int
    {
        $platform = $this->option('platform');

        if ($platform && !in_array($platform, ['android', 'ios'])) {
            $this->error('Invalid platform. Use android or ios.');
            return 1;
        }

        $query = AppUpload::with('uploader')->orderBy('uploaded_at', 'desc');

        if ($platform) {
            $query->where('platform', $platform);
            $this->info("📱 {$platform} App Uploads:");
        } else {
            $this->info("📱 All App Uploads:");
        }

        $uploads = $query->get();

        if ($uploads->isEmpty()) {
            $this->info('No uploads found.');
            return 0;
        }

        $this->table(
            ['ID', 'Platform', 'Version', 'Size', 'Downloads', 'Active', 'Uploader', 'Uploaded'],
            $uploads->map(function ($upload) {
                return [
                    $upload->getId(),
                    ucfirst($upload->getPlatform()),
                    $upload->getFullVersion(),
                    $upload->getFormattedFileSize(),
                    $upload->getDownloadCount(),
                    $upload->getIsActive() ? '✅' : '❌',
                    $upload->uploader->getName(),
                    $upload->getUploadedAt()->format('Y-m-d H:i'),
                ];
            })->toArray()
        );

        return 0;
    }

    private function handleActivate(): int
    {
        $uploadId = $this->option('id');

        if (!$uploadId) {
            $this->error('Please specify an upload ID: --id=123');
            return 1;
        }

        try {
            $upload = AppUpload::findOrFail($uploadId);

            $this->info("Setting version {$upload->getFullVersion()} as active for {$upload->getPlatform()}...");

            $activeUpload = $this->appUploadService->setActiveVersion($uploadId);

            $this->info('✅ Version activated successfully!');
            $this->info("Active {$activeUpload->getPlatform()} version: {$activeUpload->getFullVersion()}");

            return 0;

        } catch (\Exception $e) {
            $this->error('Activation failed: ' . $e->getMessage());
            return 1;
        }
    }

    private function handleDelete(): int
    {
        $uploadId = $this->option('id');

        if (!$uploadId) {
            $this->error('Please specify an upload ID: --id=123');
            return 1;
        }

        try {
            $upload = AppUpload::findOrFail($uploadId);

            if ($upload->getIsActive()) {
                $this->error('Cannot delete the active version. Please activate another version first.');
                return 1;
            }

            $platform = $upload->getPlatform();
            $version = $upload->getFullVersion();

            if (!$this->confirm("Delete {$platform} version {$version}? This cannot be undone.")) {
                $this->info('Deletion cancelled.');
                return 0;
            }

            $deleted = $this->appUploadService->deleteUpload($uploadId);

            if ($deleted) {
                $this->info('✅ Upload deleted successfully!');
            } else {
                $this->error('Failed to delete upload.');
                return 1;
            }

            return 0;

        } catch (\Exception $e) {
            $this->error('Deletion failed: ' . $e->getMessage());
            return 1;
        }
    }

    private function handleCleanup(): int
    {
        $keepVersions = (int) ($this->option('keep') ?? 5);

        $this->info("Cleaning up old uploads (keeping last {$keepVersions} versions per platform)...");

        try {
            $cleaned = $this->appUploadService->cleanupOldUploads($keepVersions);

            $this->info('✅ Cleanup completed!');
            $this->table(
                ['Platform', 'Deleted Versions'],
                [
                    ['Android', $cleaned['android']],
                    ['iOS', $cleaned['ios']],
                    ['Total', $cleaned['android'] + $cleaned['ios']],
                ]
            );

            return 0;

        } catch (\Exception $e) {
            $this->error('Cleanup failed: ' . $e->getMessage());
            return 1;
        }
    }

    private function handleStats(): int
    {
        try {
            $stats = $this->appUploadService->getStatistics();

            $this->info('📊 App Upload Statistics:');
            $this->newLine();

            $this->table(
                ['Metric', 'Value'],
                [
                    ['Total Uploads', $stats['total_uploads']],
                    ['Android Uploads', $stats['android_uploads']],
                    ['iOS Uploads', $stats['ios_uploads']],
                    ['Total Downloads', number_format($stats['total_downloads'])],
                    ['Storage Used', number_format($stats['total_storage_size'] / 1024 / 1024, 1) . ' MB'],
                ]
            );

            $this->newLine();
            $this->info('🔴 Active Versions:');
            $this->line('Android: ' . ($stats['active_versions']['android'] ?? 'None'));
            $this->line('iOS: ' . ($stats['active_versions']['ios'] ?? 'None'));

            if (!empty($stats['recent_uploads'])) {
                $this->newLine();
                $this->info('📅 Recent Uploads:');
                $this->table(
                    ['Platform', 'Version', 'Size', 'Uploader', 'Uploaded'],
                    collect($stats['recent_uploads'])->map(function ($upload) {
                        return [
                            ucfirst($upload['platform']),
                            $upload['version'],
                            $upload['size'],
                            $upload['uploader'],
                            $upload['uploaded_at'],
                        ];
                    })->toArray()
                );
            }

            return 0;

        } catch (\Exception $e) {
            $this->error('Failed to fetch statistics: ' . $e->getMessage());
            return 1;
        }
    }

    private function handleInvalidAction(): int
    {
        $this->error('Invalid action. Available actions:');
        $this->line('  upload   - Upload a new app version');
        $this->line('  list     - List all uploads or for specific platform');
        $this->line('  activate - Set a version as active');
        $this->line('  delete   - Delete a specific upload');
        $this->line('  cleanup  - Remove old versions');
        $this->line('  stats    - Show upload statistics');
        $this->newLine();
        $this->line('Examples:');
        $this->line('  php artisan app:manage-uploads upload --platform=android --file=/path/to/app.apk --version=1.2.0');
        $this->line('  php artisan app:manage-uploads list --platform=android');
        $this->line('  php artisan app:manage-uploads activate --id=123');
        $this->line('  php artisan app:manage-uploads stats');

        return 1;
    }
}
