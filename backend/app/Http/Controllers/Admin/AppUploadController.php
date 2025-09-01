<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Apps\AppUpload;
use App\Services\Apps\AppUploadService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\View\View;

class AppUploadController extends Controller
{
    public function __construct(
        private readonly AppUploadService $appUploadService
    ) {}

    public function index(): View
    {
        $statistics = $this->appUploadService->getStatistics();

        $platforms = [
            'android' => [
                'active_version' => AppUpload::getActiveVersion(AppUpload::PLATFORM_ANDROID),
                'all_versions' => AppUpload::getVersionsForPlatform(AppUpload::PLATFORM_ANDROID)->take(10),
                'total_downloads' => AppUpload::platform(AppUpload::PLATFORM_ANDROID)->sum('download_count'),
            ],
            'ios' => [
                'active_version' => AppUpload::getActiveVersion(AppUpload::PLATFORM_IOS),
                'all_versions' => AppUpload::getVersionsForPlatform(AppUpload::PLATFORM_IOS)->take(10),
                'total_downloads' => AppUpload::platform(AppUpload::PLATFORM_IOS)->sum('download_count'),
            ],
        ];

        return view('admin.s3-app-uploads', compact('platforms', 'statistics'));
    }

    public function uploadAndroid(Request $request): JsonResponse
    {
        return $this->handleUpload($request, AppUpload::PLATFORM_ANDROID, 'apk_file');
    }

    public function uploadIOS(Request $request): JsonResponse
    {
        return $this->handleUpload($request, AppUpload::PLATFORM_IOS, 'ipa_file');
    }

    private function handleUpload(Request $request, string $platform, string $fileField): JsonResponse
    {
        // Log request info for debugging
        \Log::info('Upload attempt', [
            'platform' => $platform,
            'field' => $fileField,
            'has_file' => $request->hasFile($fileField),
            'content_length' => $request->header('Content-Length'),
            'php_limits' => [
                'upload_max_filesize' => ini_get('upload_max_filesize'),
                'post_max_size' => ini_get('post_max_size'),
                'memory_limit' => ini_get('memory_limit'),
            ]
        ]);

        // Check if file exists in request
        $allFiles = $request->allFiles();
        $hasFile = $request->hasFile($fileField);

        if (!$hasFile) {
            // File exists but hasFile() returns false - let's see why
            $fileFromRequest = $request->file($fileField);

            return response()->json([
                'success' => false,
                'message' => 'File upload failed validation',
                'debug' => [
                    'expected_field' => $fileField,
                    'available_files' => array_keys($allFiles),
                    'content_length' => $request->header('Content-Length'),
                    'hasFile_result' => $hasFile,
                    'file_exists_in_request' => isset($allFiles[$fileField]),
                    'file_object_details' => $fileFromRequest ? [
                        'original_name' => $fileFromRequest->getClientOriginalName(),
                        'size' => $fileFromRequest->getSize(),
                        'mime_type' => $fileFromRequest->getPathname() ? $fileFromRequest->getMimeType() : 'file_missing',
                        'is_valid' => $fileFromRequest->isValid(),
                        'error_code' => $fileFromRequest->getError(),
                        'temp_path' => $fileFromRequest->getPathname(),
                        'temp_exists' => $fileFromRequest->getPathname() ? file_exists($fileFromRequest->getPathname()) : false,
                    ] : 'No file object',
                    'php_settings' => [
                        'upload_max_filesize' => ini_get('upload_max_filesize'),
                        'post_max_size' => ini_get('post_max_size'),
                        'file_uploads' => ini_get('file_uploads') ? 'enabled' : 'disabled',
                        'max_file_uploads' => ini_get('max_file_uploads'),
                    ],
                    'server_info' => [
                        'tmp_dir' => sys_get_temp_dir(),
                        'tmp_writable' => is_writable(sys_get_temp_dir()),
                        'disk_free_mb' => round(disk_free_space(sys_get_temp_dir()) / 1024 / 1024, 2),
                    ]
                ]
            ], 422);
        }

        $file = $request->file($fileField);

        // CRITICAL: Check upload error immediately
        if (!$file->isValid()) {
            $error = $file->getError();
            $errorMessages = [
                UPLOAD_ERR_OK => 'No error',
                UPLOAD_ERR_INI_SIZE => 'File exceeds upload_max_filesize in php.ini',
                UPLOAD_ERR_FORM_SIZE => 'File exceeds MAX_FILE_SIZE in form',
                UPLOAD_ERR_PARTIAL => 'File was only partially uploaded',
                UPLOAD_ERR_NO_FILE => 'No file was uploaded',
                UPLOAD_ERR_NO_TMP_DIR => 'Missing temporary folder',
                UPLOAD_ERR_CANT_WRITE => 'Failed to write file to disk',
                UPLOAD_ERR_EXTENSION => 'A PHP extension stopped the upload',
            ];

            $message = $errorMessages[$error] ?? 'Unknown upload error';

            return response()->json([
                'success' => false,
                'message' => "Upload failed: {$message}",
                'debug' => [
                    'error_code' => $error,
                    'file_size_mb' => $file->getSize() ? round($file->getSize() / 1024 / 1024, 2) : 'unknown',
                    'php_settings' => [
                        'upload_max_filesize' => ini_get('upload_max_filesize'),
                        'post_max_size' => ini_get('post_max_size'),
                        'memory_limit' => ini_get('memory_limit'),
                        'file_uploads' => ini_get('file_uploads') ? 'enabled' : 'disabled',
                    ],
                    'server' => [
                        'tmp_dir' => sys_get_temp_dir(),
                        'tmp_writable' => is_writable(sys_get_temp_dir()),
                        'disk_free_gb' => round(disk_free_space(sys_get_temp_dir()) / 1024 / 1024 / 1024, 2),
                    ]
                ]
            ], 422);
        }

        // Enhanced file validation with specific error messages
        $validator = Validator::make($request->all(), [
            $fileField => [
                'required',
                'file',
                'max:512000', // 500MB in KB
                function ($attribute, $value, $fail) use ($platform) {
                    if (!$value instanceof \Illuminate\Http\UploadedFile) {
                        $fail('Invalid file upload.');
                        return;
                    }

                    // Check if upload was successful
                    if (!$value->isValid()) {
                        $error = $value->getError();
                        $errorMessages = [
                            UPLOAD_ERR_INI_SIZE => 'File exceeds upload_max_filesize directive in php.ini',
                            UPLOAD_ERR_FORM_SIZE => 'File exceeds MAX_FILE_SIZE directive in HTML form',
                            UPLOAD_ERR_PARTIAL => 'File was only partially uploaded',
                            UPLOAD_ERR_NO_FILE => 'No file was uploaded',
                            UPLOAD_ERR_NO_TMP_DIR => 'Missing temporary folder',
                            UPLOAD_ERR_CANT_WRITE => 'Failed to write file to disk',
                            UPLOAD_ERR_EXTENSION => 'A PHP extension stopped the file upload',
                        ];

                        $message = $errorMessages[$error] ?? 'Unknown upload error';
                        $fail("Upload failed: {$message} (Error code: {$error})");
                        return;
                    }

                    // Check file extension
                    $extension = strtolower($value->getClientOriginalExtension());
                    $expectedExtension = $platform === AppUpload::PLATFORM_ANDROID ? 'apk' : 'ipa';

                    if ($extension !== $expectedExtension) {
                        $fail("File must be a {$expectedExtension} file for {$platform} platform");
                    }

                    // Check file size against our limit
                    if ($value->getSize() > 500 * 1024 * 1024) { // 500MB
                        $fail('File size exceeds 500MB limit');
                    }
                }
            ],
            'version' => 'required|string|max:50',
            'build_number' => 'nullable|string|max:50',
            'notes' => 'nullable|string|max:1000',
        ]);

        if ($validator->fails()) {
            \Log::warning('Upload validation failed', [
                'platform' => $platform,
                'errors' => $validator->errors()->toArray(),
                'file_info' => $file ? [
                    'size' => $file->getSize(),
                    'original_name' => $file->getClientOriginalName(),
                    'mime_type' => $file->getMimeType(),
                    'extension' => $file->getClientOriginalExtension(),
                    'is_valid' => $file->isValid(),
                    'error' => $file->getError(),
                ] : null
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
                'debug' => $file ? [
                    'file_size_mb' => round($file->getSize() / 1024 / 1024, 2),
                    'upload_error_code' => $file->getError(),
                    'php_max_upload' => ini_get('upload_max_filesize'),
                    'php_max_post' => ini_get('post_max_size'),
                ] : null
            ], 422);
        }

        try {
            $version = trim($request->input('version'));
            $buildNumber = $request->input('build_number') ? trim($request->input('build_number')) : null;
            $notes = $request->input('notes');

            $metadata = [];
            if ($notes) {
                $metadata['notes'] = $notes;
            }

            $appUpload = $this->appUploadService->uploadApp(
                $file,
                $platform,
                $version,
                $buildNumber,
                $metadata,
                auth()->user()
            );

            \Log::info('Upload successful', [
                'platform' => $platform,
                'version' => $version,
                'build_number' => $buildNumber,
                'file_size' => $file->getSize(),
                'upload_id' => $appUpload->getId(),
            ]);

            return response()->json([
                'success' => true,
                'message' => ucfirst($platform) . ' app uploaded successfully!',
                'data' => [
                    'id' => $appUpload->getId(),
                    'version' => $appUpload->getFullVersion(),
                    'size' => $appUpload->getFormattedFileSize(),
                    'download_url' => $appUpload->getDownloadUrl(60),
                    'uploaded_at' => $appUpload->getUploadedAt()->format('Y-m-d H:i:s'),
                ]
            ]);

        } catch (\InvalidArgumentException $e) {
            \Log::warning('Upload validation error', [
                'platform' => $platform,
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 400);
        } catch (\Exception $e) {
            \Log::error('App upload failed', [
                'platform' => $platform,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'user' => auth()->user()?->getEmail(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Upload failed: ' . $e->getMessage()
            ], 500);
        }
    }

    public function setActiveVersion(Request $request, int $uploadId): JsonResponse
    {
        try {
            $activeUpload = $this->appUploadService->setActiveVersion($uploadId);

            return response()->json([
                'success' => true,
                'message' => 'Active version updated successfully',
                'data' => [
                    'platform' => $activeUpload->getPlatform(),
                    'version' => $activeUpload->getFullVersion(),
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update active version: ' . $e->getMessage()
            ], 500);
        }
    }

    public function deleteUpload(int $uploadId): JsonResponse
    {
        try {
            $upload = AppUpload::findOrFail($uploadId);

            if ($upload->getIsActive()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot delete the active version. Please set another version as active first.'
                ], 400);
            }

            $deleted = $this->appUploadService->deleteUpload($uploadId);

            if ($deleted) {
                return response()->json([
                    'success' => true,
                    'message' => 'App upload deleted successfully'
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to delete the upload'
                ], 500);
            }
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Deletion failed: ' . $e->getMessage()
            ], 500);
        }
    }

    public function downloadApp(string $platform): JsonResponse
    {
        try {
            $downloadUrl = $this->appUploadService->getActiveDownloadUrl($platform, 30); // 30 min expiry

            if (!$downloadUrl) {
                return response()->json([
                    'success' => false,
                    'message' => ucfirst($platform) . ' app is not available for download'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'download_url' => $downloadUrl,
                'expires_in_minutes' => 30
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate download URL: ' . $e->getMessage()
            ], 500);
        }
    }

    public function getUploadHistory(string $platform): JsonResponse
    {
        try {
            $uploads = AppUpload::getVersionsForPlatform($platform)
                ->load('uploader')
                ->map(function ($upload) {
                    return [
                        'id' => $upload->getId(),
                        'version' => $upload->getFullVersion(),
                        'size' => $upload->getFormattedFileSize(),
                        'downloads' => $upload->getDownloadCount(),
                        'is_active' => $upload->getIsActive(),
                        'uploader' => $upload->uploader->getName(),
                        'uploaded_at' => $upload->getUploadedAt()->format('Y-m-d H:i:s'),
                        'metadata' => $upload->getMetadata(),
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $uploads
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch upload history: ' . $e->getMessage()
            ], 500);
        }
    }

    public function getStatistics(): JsonResponse
    {
        try {
            $stats = $this->appUploadService->getStatistics();
            return response()->json([
                'success' => true,
                'data' => $stats
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch statistics: ' . $e->getMessage()
            ], 500);
        }
    }

    public function cleanupOldUploads(): JsonResponse
    {
        try {
            $cleaned = $this->appUploadService->cleanupOldUploads(5); // Keep last 5 versions

            return response()->json([
                'success' => true,
                'message' => 'Cleanup completed successfully',
                'data' => $cleaned
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Cleanup failed: ' . $e->getMessage()
            ], 500);
        }
    }
}
