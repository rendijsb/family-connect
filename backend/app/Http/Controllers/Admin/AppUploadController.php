<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\View\View;

class AppUploadController extends Controller
{
    public function index(): View
    {
        $downloads = [
            'android' => [
                'exists' => file_exists(public_path('downloads/family-connect.apk')),
                'size' => file_exists(public_path('downloads/family-connect.apk'))
                    ? $this->formatBytes(filesize(public_path('downloads/family-connect.apk')))
                    : null,
                'modified' => file_exists(public_path('downloads/family-connect.apk'))
                    ? date('Y-m-d H:i:s', filemtime(public_path('downloads/family-connect.apk')))
                    : null,
            ],
            'ios' => [
                'exists' => file_exists(public_path('downloads/family-connect.ipa')),
                'size' => file_exists(public_path('downloads/family-connect.ipa'))
                    ? $this->formatBytes(filesize(public_path('downloads/family-connect.ipa')))
                    : null,
                'modified' => file_exists(public_path('downloads/family-connect.ipa'))
                    ? date('Y-m-d H:i:s', filemtime(public_path('downloads/family-connect.ipa')))
                    : null,
            ]
        ];

        return view('admin.app-uploads', compact('downloads'));
    }

    public function uploadAndroid(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'apk_file' => [
                'required',
                'file',
                'mimes:apk',
                'max:204800', // 200MB max
            ],
            'version' => 'required|string|max:20'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $file = $request->file('apk_file');
            $downloadsPath = public_path('downloads');

            // Create directory if it doesn't exist
            if (!file_exists($downloadsPath)) {
                mkdir($downloadsPath, 0755, true);
            }

            // Backup existing file
            $existingFile = $downloadsPath . '/family-connect.apk';
            if (file_exists($existingFile)) {
                $backupName = 'family-connect-backup-' . date('Y-m-d-H-i-s') . '.apk';
                rename($existingFile, $downloadsPath . '/' . $backupName);
            }

            // Move new file
            $file->move($downloadsPath, 'family-connect.apk');

            // Log the upload
            \Log::info('Android APK uploaded', [
                'version' => $request->input('version'),
                'file_size' => $file->getSize(),
                'uploaded_by' => auth()->user()->email ?? 'system'
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Android APK uploaded successfully',
                'version' => $request->input('version'),
                'size' => $this->formatBytes($file->getSize())
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Upload failed: ' . $e->getMessage()
            ], 500);
        }
    }

    public function uploadIOS(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'ipa_file' => [
                'required',
                'file',
                'mimes:ipa',
                'max:204800', // 200MB max
            ],
            'version' => 'required|string|max:20'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $file = $request->file('ipa_file');
            $downloadsPath = public_path('downloads');

            // Create directory if it doesn't exist
            if (!file_exists($downloadsPath)) {
                mkdir($downloadsPath, 0755, true);
            }

            // Backup existing file
            $existingFile = $downloadsPath . '/family-connect.ipa';
            if (file_exists($existingFile)) {
                $backupName = 'family-connect-backup-' . date('Y-m-d-H-i-s') . '.ipa';
                rename($existingFile, $downloadsPath . '/' . $backupName);
            }

            // Move new file
            $file->move($downloadsPath, 'family-connect.ipa');

            // Log the upload
            \Log::info('iOS IPA uploaded', [
                'version' => $request->input('version'),
                'file_size' => $file->getSize(),
                'uploaded_by' => auth()->user()->email ?? 'system'
            ]);

            return response()->json([
                'success' => true,
                'message' => 'iOS IPA uploaded successfully',
                'version' => $request->input('version'),
                'size' => $this->formatBytes($file->getSize())
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Upload failed: ' . $e->getMessage()
            ], 500);
        }
    }

    public function deleteFile(Request $request, string $platform): JsonResponse
    {
        if (!in_array($platform, ['android', 'ios'])) {
            return response()->json(['success' => false, 'message' => 'Invalid platform'], 400);
        }

        $filename = $platform === 'android' ? 'family-connect.apk' : 'family-connect.ipa';
        $filepath = public_path('downloads/' . $filename);

        if (!file_exists($filepath)) {
            return response()->json(['success' => false, 'message' => 'File not found'], 404);
        }

        try {
            // Create backup before deletion
            $backupName = 'deleted-' . pathinfo($filename, PATHINFO_FILENAME) . '-' . date('Y-m-d-H-i-s') . '.' . pathinfo($filename, PATHINFO_EXTENSION);
            rename($filepath, public_path('downloads/' . $backupName));

            return response()->json([
                'success' => true,
                'message' => ucfirst($platform) . ' app file deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Deletion failed: ' . $e->getMessage()
            ], 500);
        }
    }

    private function formatBytes($size, $precision = 2): string
    {
        $base = log($size, 1024);
        $suffixes = ['B', 'KB', 'MB', 'GB', 'TB'];

        return round(pow(1024, $base - floor($base)), $precision) .' '. $suffixes[floor($base)];
    }
}
