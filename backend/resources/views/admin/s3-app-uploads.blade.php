@extends('layouts.app')

@section('title', 'App Management Dashboard - ' . config('app.name'))

@section('content')
    <div class="min-h-screen bg-gray-100 py-8">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <!-- Header -->
            <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
                <div class="flex justify-between items-center">
                    <div>
                        <h1 class="text-3xl font-bold text-gray-900">App Management Dashboard</h1>
                        <p class="text-gray-600 mt-2">Manage mobile app uploads with AWS S3 integration</p>
                    </div>
                    <div class="flex space-x-4">
                        <button onclick="refreshStatistics()" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                            <i class="fas fa-sync-alt mr-2"></i>Refresh Stats
                        </button>
                        <button onclick="cleanupOldUploads()" class="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors">
                            <i class="fas fa-trash-alt mr-2"></i>Cleanup Old
                        </button>
                    </div>
                </div>
            </div>

            <!-- Statistics Cards -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div class="bg-white rounded-lg shadow-sm p-6">
                    <div class="flex items-center">
                        <div class="p-3 bg-blue-100 rounded-lg">
                            <i class="fas fa-mobile-alt text-blue-600 text-xl"></i>
                        </div>
                        <div class="ml-4">
                            <p class="text-sm text-gray-600">Total Apps</p>
                            <p class="text-2xl font-bold text-gray-900" id="stat-total">{{ $statistics['total_uploads'] }}</p>
                        </div>
                    </div>
                </div>

                <div class="bg-white rounded-lg shadow-sm p-6">
                    <div class="flex items-center">
                        <div class="p-3 bg-green-100 rounded-lg">
                            <i class="fas fa-download text-green-600 text-xl"></i>
                        </div>
                        <div class="ml-4">
                            <p class="text-sm text-gray-600">Total Downloads</p>
                            <p class="text-2xl font-bold text-gray-900" id="stat-downloads">{{ number_format($statistics['total_downloads']) }}</p>
                        </div>
                    </div>
                </div>

                <div class="bg-white rounded-lg shadow-sm p-6">
                    <div class="flex items-center">
                        <div class="p-3 bg-purple-100 rounded-lg">
                            <i class="fas fa-hdd text-purple-600 text-xl"></i>
                        </div>
                        <div class="ml-4">
                            <p class="text-sm text-gray-600">Storage Used</p>
                            <p class="text-2xl font-bold text-gray-900" id="stat-storage">{{ number_format($statistics['total_storage_size'] / 1024 / 1024, 1) }}MB</p>
                        </div>
                    </div>
                </div>

                <div class="bg-white rounded-lg shadow-sm p-6">
                    <div class="flex items-center">
                        <div class="p-3 bg-yellow-100 rounded-lg">
                            <i class="fas fa-cloud text-yellow-600 text-xl"></i>
                        </div>
                        <div class="ml-4">
                            <p class="text-sm text-gray-600">AWS S3</p>
                            <p class="text-xl font-bold text-green-600">Connected</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Platform Sections -->
            <div class="grid grid-cols-1 xl:grid-cols-2 gap-8">

                <!-- Android Section -->
                <div class="bg-white rounded-lg shadow-sm overflow-hidden">
                    <div class="bg-green-50 p-6 border-b">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center">
                                <i class="fab fa-android text-green-600 text-3xl mr-4"></i>
                                <div>
                                    <h2 class="text-2xl font-bold text-gray-900">Android</h2>
                                    <p class="text-gray-600">APK Management</p>
                                </div>
                            </div>
                            <div class="text-right">
                                <p class="text-sm text-gray-600">Active Version</p>
                                <p class="text-lg font-semibold text-green-600">
                                    {{ $platforms['android']['active_version']?->getFullVersion() ?? 'None' }}
                                </p>
                            </div>
                        </div>
                    </div>

                    <!-- Upload Form -->
                    <div class="p-6">
                        <form id="android-upload-form" enctype="multipart/form-data" class="space-y-4">
                            @csrf
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label for="android-version" class="block text-sm font-medium text-gray-700 mb-1">Version *</label>
                                    <input type="text" id="android-version" name="version" placeholder="e.g., 1.2.0" required
                                           class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500">
                                </div>
                                <div>
                                    <label for="android-build" class="block text-sm font-medium text-gray-700 mb-1">Build Number</label>
                                    <input type="text" id="android-build" name="build_number" placeholder="e.g., 42"
                                           class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500">
                                </div>
                            </div>

                            <div>
                                <label for="android-notes" class="block text-sm font-medium text-gray-700 mb-1">Release Notes</label>
                                <textarea id="android-notes" name="notes" rows="2" placeholder="Optional release notes..."
                                          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"></textarea>
                            </div>

                            <div>
                                <label for="android-file" class="block text-sm font-medium text-gray-700 mb-1">APK File *</label>
                                <input type="file" id="android-file" name="apk_file" accept=".apk" required
                                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500">
                                <p class="text-xs text-gray-500 mt-1">Maximum file size: 500MB • Stored securely in AWS S3</p>
                            </div>

                            <button type="submit" class="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 focus:ring-2 focus:ring-green-500 transition-colors disabled:opacity-50">
                                <i class="fas fa-upload mr-2"></i>Upload Android APK
                            </button>
                        </form>

                        <!-- Version History -->
                        <div class="mt-6">
                            <div class="flex justify-between items-center mb-3">
                                <h3 class="text-lg font-semibold text-gray-900">Recent Versions</h3>
                                <button onclick="showVersionHistory('android')" class="text-green-600 hover:text-green-700 text-sm">
                                    View All
                                </button>
                            </div>
                            <div id="android-versions" class="space-y-2">
                                @foreach($platforms['android']['all_versions'] as $version)
                                    <div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg {{ $version->getIsActive() ? 'border-2 border-green-200' : '' }}">
                                        <div>
                                            <div class="flex items-center">
                                                <span class="font-medium">{{ $version->getFullVersion() }}</span>
                                                @if($version->getIsActive())
                                                    <span class="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Active</span>
                                                @endif
                                            </div>
                                            <p class="text-sm text-gray-600">{{ $version->getFormattedFileSize() }} • {{ $version->getDownloadCount() }} downloads</p>
                                        </div>
                                        <div class="flex space-x-2">
                                            @if(!$version->getIsActive())
                                                <button onclick="setActiveVersion({{ $version->getId() }})"
                                                        class="text-blue-600 hover:text-blue-700 text-sm">Activate</button>
                                            @endif
                                            <button onclick="downloadVersion({{ $version->getId() }})"
                                                    class="text-green-600 hover:text-green-700 text-sm">Download</button>
                                            @if(!$version->getIsActive())
                                                <button onclick="deleteVersion({{ $version->getId() }})"
                                                        class="text-red-600 hover:text-red-700 text-sm">Delete</button>
                                            @endif
                                        </div>
                                    </div>
                                @endforeach
                            </div>
                        </div>
                    </div>
                </div>

                <!-- iOS Section -->
                <div class="bg-white rounded-lg shadow-sm overflow-hidden">
                    <div class="bg-gray-50 p-6 border-b">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center">
                                <i class="fab fa-apple text-gray-800 text-3xl mr-4"></i>
                                <div>
                                    <h2 class="text-2xl font-bold text-gray-900">iOS</h2>
                                    <p class="text-gray-600">IPA Management</p>
                                </div>
                            </div>
                            <div class="text-right">
                                <p class="text-sm text-gray-600">Active Version</p>
                                <p class="text-lg font-semibold text-gray-800">
                                    {{ $platforms['ios']['active_version']?->getFullVersion() ?? 'None' }}
                                </p>
                            </div>
                        </div>
                    </div>

                    <!-- Upload Form -->
                    <div class="p-6">
                        <form id="ios-upload-form" enctype="multipart/form-data" class="space-y-4">
                            @csrf
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label for="ios-version" class="block text-sm font-medium text-gray-700 mb-1">Version *</label>
                                    <input type="text" id="ios-version" name="version" placeholder="e.g., 1.2.0" required
                                           class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500">
                                </div>
                                <div>
                                    <label for="ios-build" class="block text-sm font-medium text-gray-700 mb-1">Build Number</label>
                                    <input type="text" id="ios-build" name="build_number" placeholder="e.g., 42"
                                           class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500">
                                </div>
                            </div>

                            <div>
                                <label for="ios-notes" class="block text-sm font-medium text-gray-700 mb-1">Release Notes</label>
                                <textarea id="ios-notes" name="notes" rows="2" placeholder="Optional release notes..."
                                          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"></textarea>
                            </div>

                            <div>
                                <label for="ios-file" class="block text-sm font-medium text-gray-700 mb-1">IPA File *</label>
                                <input type="file" id="ios-file" name="ipa_file" accept=".ipa" required
                                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500">
                                <p class="text-xs text-gray-500 mt-1">Maximum file size: 500MB • Stored securely in AWS S3</p>
                            </div>

                            <button type="submit" class="w-full bg-gray-900 text-white py-3 px-4 rounded-md hover:bg-gray-800 focus:ring-2 focus:ring-gray-500 transition-colors disabled:opacity-50">
                                <i class="fas fa-upload mr-2"></i>Upload iOS IPA
                            </button>
                        </form>

                        <!-- Version History -->
                        <div class="mt-6">
                            <div class="flex justify-between items-center mb-3">
                                <h3 class="text-lg font-semibold text-gray-900">Recent Versions</h3>
                                <button onclick="showVersionHistory('ios')" class="text-gray-700 hover:text-gray-900 text-sm">
                                    View All
                                </button>
                            </div>
                            <div id="ios-versions" class="space-y-2">
                                @foreach($platforms['ios']['all_versions'] as $version)
                                    <div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg {{ $version->getIsActive() ? 'border-2 border-gray-300' : '' }}">
                                        <div>
                                            <div class="flex items-center">
                                                <span class="font-medium">{{ $version->getFullVersion() }}</span>
                                                @if($version->getIsActive())
                                                    <span class="ml-2 px-2 py-1 bg-gray-200 text-gray-800 text-xs rounded-full">Active</span>
                                                @endif
                                            </div>
                                            <p class="text-sm text-gray-600">{{ $version->getFormattedFileSize() }} • {{ $version->getDownloadCount() }} downloads</p>
                                        </div>
                                        <div class="flex space-x-2">
                                            @if(!$version->getIsActive())
                                                <button onclick="setActiveVersion({{ $version->getId() }})"
                                                        class="text-blue-600 hover:text-blue-700 text-sm">Activate</button>
                                            @endif
                                            <button onclick="downloadVersion({{ $version->getId() }})"
                                                    class="text-gray-700 hover:text-gray-900 text-sm">Download</button>
                                            @if(!$version->getIsActive())
                                                <button onclick="deleteVersion({{ $version->getId() }})"
                                                        class="text-red-600 hover:text-red-700 text-sm">Delete</button>
                                            @endif
                                        </div>
                                    </div>
                                @endforeach
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Toast Notification -->
    <div id="toast" class="fixed top-4 right-4 transform transition-all duration-300 translate-x-full opacity-0 z-50">
        <div class="bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-sm">
            <div class="flex items-center">
                <div id="toast-icon" class="mr-3"></div>
                <div>
                    <div id="toast-title" class="font-semibold"></div>
                    <div id="toast-message" class="text-sm text-gray-600"></div>
                </div>
            </div>
        </div>
    </div>

    <!-- Include Font Awesome for icons -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">

    <script>
        // Toast notification system
        function showToast(title, message, type = 'success') {
            const toast = document.getElementById('toast');
            const icon = document.getElementById('toast-icon');
            const titleEl = document.getElementById('toast-title');
            const messageEl = document.getElementById('toast-message');

            titleEl.textContent = title;
            messageEl.textContent = message;

            if (type === 'success') {
                toast.className = 'fixed top-4 right-4 transform transition-all duration-300 translate-x-0 opacity-100 z-50';
                toast.querySelector('.bg-white').className = 'bg-green-50 border border-green-300 rounded-lg shadow-lg p-4 max-w-sm';
                icon.innerHTML = '<i class="fas fa-check-circle text-green-600 text-xl"></i>';
            } else if (type === 'error') {
                toast.className = 'fixed top-4 right-4 transform transition-all duration-300 translate-x-0 opacity-100 z-50';
                toast.querySelector('.bg-green-50, .bg-white').className = 'bg-red-50 border border-red-300 rounded-lg shadow-lg p-4 max-w-sm';
                icon.innerHTML = '<i class="fas fa-exclamation-circle text-red-600 text-xl"></i>';
            } else if (type === 'info') {
                toast.className = 'fixed top-4 right-4 transform transition-all duration-300 translate-x-0 opacity-100 z-50';
                toast.querySelector('.bg-green-50, .bg-red-50, .bg-white').className = 'bg-blue-50 border border-blue-300 rounded-lg shadow-lg p-4 max-w-sm';
                icon.innerHTML = '<i class="fas fa-info-circle text-blue-600 text-xl"></i>';
            }

            setTimeout(() => {
                toast.className = 'fixed top-4 right-4 transform transition-all duration-300 translate-x-full opacity-0 z-50';
            }, 5000);
        }

        // Android upload form
        document.getElementById('android-upload-form').addEventListener('submit', async function(e) {
            e.preventDefault();
            await handleUpload(this, '/admin/upload/android', 'Android APK');
        });

        // iOS upload form
        document.getElementById('ios-upload-form').addEventListener('submit', async function(e) {
            e.preventDefault();
            await handleUpload(this, '/admin/upload/ios', 'iOS IPA');
        });

        // Generic upload handler
        async function handleUpload(form, url, appType) {
            const formData = new FormData(form);
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;

            // Validation
            const version = formData.get('version');
            const fileInput = form.querySelector('input[type="file"]');

            if (!version || !version.trim()) {
                showToast('Error', 'Please enter a version number', 'error');
                return;
            }

            if (!fileInput.files[0]) {
                showToast('Error', 'Please select a file', 'error');
                return;
            }

            const file = fileInput.files[0];
            if (file.size > 500 * 1024 * 1024) { // 500MB
                showToast('Error', 'File size must not exceed 500MB', 'error');
                return;
            }

            // Start upload
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Uploading...';

            try {
                const response = await fetch(url, {
                    method: 'POST',
                    body: formData,
                });

                const result = await response.json();

                if (result.success) {
                    showToast('Success', result.message, 'success');
                    form.reset();
                    setTimeout(() => window.location.reload(), 2000);
                } else {
                    let errorMessage = result.message;
                    if (result.errors) {
                        const errorList = Object.values(result.errors).flat();
                        errorMessage = errorList.join(', ');
                    }
                    showToast('Error', errorMessage, 'error');
                }
            } catch (error) {
                console.error('Upload error:', error);
                showToast('Error', 'Upload failed: ' + error.message, 'error');
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
        }

        // Set active version
        async function setActiveVersion(uploadId) {
            if (!confirm('Set this version as the active download?')) return;

            try {
                const response = await fetch(`/admin/upload/set-active/${uploadId}`, {
                    method: 'POST',
                    headers: {
                        'X-CSRF-TOKEN': document.querySelector('input[name="_token"]').value,
                        'Content-Type': 'application/json'
                    }
                });

                const result = await response.json();

                if (result.success) {
                    showToast('Success', result.message, 'success');
                    setTimeout(() => window.location.reload(), 1500);
                } else {
                    showToast('Error', result.message, 'error');
                }
            } catch (error) {
                showToast('Error', 'Failed to set active version', 'error');
            }
        }

        // Download version
        async function downloadVersion(uploadId) {
            try {
                showToast('Info', 'Generating download link...', 'info');

                const response = await fetch(`/admin/download/${uploadId}`);
                const result = await response.json();

                if (result.success) {
                    window.open(result.download_url, '_blank');
                    showToast('Success', 'Download started', 'success');
                } else {
                    showToast('Error', result.message, 'error');
                }
            } catch (error) {
                showToast('Error', 'Failed to generate download link', 'error');
            }
        }

        // Delete version
        async function deleteVersion(uploadId) {
            if (!confirm('Are you sure you want to delete this version? This action cannot be undone.')) return;

            try {
                const response = await fetch(`/admin/upload/delete/${uploadId}`, {
                    method: 'DELETE',
                    headers: {
                        'X-CSRF-TOKEN': document.querySelector('input[name="_token"]').value,
                        'Content-Type': 'application/json'
                    }
                });

                const result = await response.json();

                if (result.success) {
                    showToast('Success', result.message, 'success');
                    setTimeout(() => window.location.reload(), 1500);
                } else {
                    showToast('Error', result.message, 'error');
                }
            } catch (error) {
                showToast('Error', 'Failed to delete version', 'error');
            }
        }

        // Refresh statistics
        async function refreshStatistics() {
            try {
                const response = await fetch('/admin/statistics');
                const result = await response.json();

                if (result.success) {
                    const stats = result.data;
                    document.getElementById('stat-total').textContent = stats.total_uploads;
                    document.getElementById('stat-downloads').textContent = stats.total_downloads.toLocaleString();
                    document.getElementById('stat-storage').textContent = (stats.total_storage_size / 1024 / 1024).toFixed(1) + 'MB';

                    showToast('Success', 'Statistics refreshed', 'success');
                }
            } catch (error) {
                showToast('Error', 'Failed to refresh statistics', 'error');
            }
        }

        // Cleanup old uploads
        async function cleanupOldUploads() {
            if (!confirm('This will delete old versions (keeping last 5 per platform). Continue?')) return;

            try {
                const response = await fetch('/admin/cleanup', {
                    method: 'POST',
                    headers: {
                        'X-CSRF-TOKEN': document.querySelector('input[name="_token"]').value,
                        'Content-Type': 'application/json'
                    }
                });

                const result = await response.json();

                if (result.success) {
                    const cleaned = result.data;
                    const message = `Cleaned up ${cleaned.android + cleaned.ios} old uploads`;
                    showToast('Success', message, 'success');
                    setTimeout(() => window.location.reload(), 2000);
                } else {
                    showToast('Error', result.message, 'error');
                }
            } catch (error) {
                showToast('Error', 'Cleanup failed', 'error');
            }
        }

        // Show version history modal (placeholder)
        function showVersionHistory(platform) {
            // You can implement a modal here to show full version history
            showToast('Info', `${platform} version history feature coming soon`, 'info');
        }
    </script>
@endsection
