<!-- backend/resources/views/admin/app-uploads.blade.php -->
@extends('layouts.app')

@section('title', 'App Upload Management - ' . config('app.name'))

@section('content')
    <div class="min-h-screen bg-gray-100 py-12">
        <div class="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <div class="bg-white overflow-hidden shadow-xl sm:rounded-lg">
                <div class="p-6 bg-white border-b border-gray-200">
                    <h2 class="text-2xl font-bold text-gray-900">Mobile App File Management</h2>
                    <p class="text-gray-600 mt-2">Upload and manage APK and IPA files for mobile app downloads</p>
                </div>

                <div class="p-6">
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">

                        <!-- Android Section -->
                        <div class="bg-green-50 rounded-lg p-6">
                            <div class="flex items-center mb-4">
                                <svg class="w-8 h-8 text-green-600 mr-3" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M17.523 15.3414c-.5665 0-.9311-.4314-.9311-.9669 0-.5378.3646-.9692.9311-.9692s.9311.4314.9311.9692c0 .5355-.3646.9669-.9311.9669zm-5.965-8.7512L8.891 4.8292c-.1785-.2128-.4524-.2925-.6855-.1792-.2331.1133-.3317.3907-.2331.6035L10.638 7.284c-1.4524.4314-2.6818 1.2935-3.5129 2.4069H18.874c-.8311-1.1134-2.0605-1.9755-3.5129-2.4069l2.6759-2.0315c.0986-.2128 0-.4902-.2331-.6035-.2331-.1133-.507-.0336-.6855.1792L14.558 6.59z"/>
                                </svg>
                                <h3 class="text-xl font-semibold text-gray-900">Android APK</h3>
                            </div>

                            <!-- Current File Status -->
                            <div class="mb-6 p-4 bg-white rounded-lg border">
                                <h4 class="font-medium text-gray-900 mb-2">Current Status</h4>
                                @if($downloads['android']['exists'])
                                    <div class="flex items-center text-green-600 mb-2">
                                        <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                                        </svg>
                                        APK file available
                                    </div>
                                    <p class="text-sm text-gray-600">Size: {{ $downloads['android']['size'] }}</p>
                                    <p class="text-sm text-gray-600">Modified: {{ $downloads['android']['modified'] }}</p>
                                    <div class="mt-2">
                                        <a href="{{ route('download.android') }}" class="text-blue-600 hover:text-blue-800 text-sm mr-4">Download Current</a>
                                        <button onclick="deleteFile('android')" class="text-red-600 hover:text-red-800 text-sm">Delete</button>
                                    </div>
                                @else
                                    <div class="flex items-center text-red-600">
                                        <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
                                        </svg>
                                        No APK file uploaded
                                    </div>
                                @endif
                            </div>

                            <!-- Upload Form -->
                            <form id="android-upload-form" enctype="multipart/form-data">
                                @csrf
                                <div class="mb-4">
                                    <label for="android-version" class="block text-sm font-medium text-gray-700 mb-2">Version</label>
                                    <input type="text" id="android-version" name="version" placeholder="e.g., 1.0.0"
                                           class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500">
                                </div>
                                <div class="mb-4">
                                    <label for="android-file" class="block text-sm font-medium text-gray-700 mb-2">APK File</label>
                                    <input type="file" id="android-file" name="apk_file" accept=".apk"
                                           class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500">
                                    <p class="text-xs text-gray-500 mt-1">Maximum file size: 200MB</p>
                                </div>
                                <button type="submit" class="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:ring-2 focus:ring-green-500 disabled:opacity-50">
                                    Upload Android APK
                                </button>
                            </form>
                        </div>

                        <!-- iOS Section -->
                        <div class="bg-gray-50 rounded-lg p-6">
                            <div class="flex items-center mb-4">
                                <svg class="w-8 h-8 text-gray-800 mr-3" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.09997 22C7.78997 22.05 6.79997 20.68 5.95997 19.47C4.24997 17 2.93997 12.45 4.69997 9.39C5.56997 7.87 7.13997 6.91 8.85997 6.88C10.15 6.86 11.38 7.75 12.10 7.75C12.81 7.75 14.24 6.65 15.82 6.82C16.5 6.85 18.27 7.15 19.35 8.83C19.27 8.88 17.97 9.71 17.98 11.53C18 13.83 20.24 14.65 20.26 14.66C20.23 14.75 19.86 16.07 18.71 19.5ZM13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z"/>
                                </svg>
                                <h3 class="text-xl font-semibold text-gray-900">iOS IPA</h3>
                            </div>

                            <!-- Current File Status -->
                            <div class="mb-6 p-4 bg-white rounded-lg border">
                                <h4 class="font-medium text-gray-900 mb-2">Current Status</h4>
                                @if($downloads['ios']['exists'])
                                    <div class="flex items-center text-green-600 mb-2">
                                        <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                                        </svg>
                                        IPA file available
                                    </div>
                                    <p class="text-sm text-gray-600">Size: {{ $downloads['ios']['size'] }}</p>
                                    <p class="text-sm text-gray-600">Modified: {{ $downloads['ios']['modified'] }}</p>
                                    <div class="mt-2">
                                        <a href="{{ route('download.ios') }}" class="text-blue-600 hover:text-blue-800 text-sm mr-4">Download Current</a>
                                        <button onclick="deleteFile('ios')" class="text-red-600 hover:text-red-800 text-sm">Delete</button>
                                    </div>
                                @else
                                    <div class="flex items-center text-red-600">
                                        <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
                                        </svg>
                                        No IPA file uploaded
                                    </div>
                                @endif
                            </div>

                            <!-- Upload Form -->
                            <form id="ios-upload-form" enctype="multipart/form-data">
                                @csrf
                                <div class="mb-4">
                                    <label for="ios-version" class="block text-sm font-medium text-gray-700 mb-2">Version</label>
                                    <input type="text" id="ios-version" name="version" placeholder="e.g., 1.0.0"
                                           class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500">
                                </div>
                                <div class="mb-4">
                                    <label for="ios-file" class="block text-sm font-medium text-gray-700 mb-2">IPA File</label>
                                    <input type="file" id="ios-file" name="ipa_file" accept=".ipa"
                                           class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500">
                                    <p class="text-xs text-gray-500 mt-1">Maximum file size: 200MB</p>
                                </div>
                                <button type="submit" class="w-full bg-gray-900 text-white py-2 px-4 rounded-md hover:bg-gray-800 focus:ring-2 focus:ring-gray-500 disabled:opacity-50">
                                    Upload iOS IPA
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Toast Notification -->
    <div id="toast" class="fixed top-4 right-4 bg-white border border-gray-300 rounded-lg shadow-lg p-4 transform transition-transform translate-x-full opacity-0 duration-300 z-50">
        <div class="flex items-center">
            <div id="toast-icon" class="mr-3"></div>
            <div>
                <div id="toast-title" class="font-semibold"></div>
                <div id="toast-message" class="text-sm text-gray-600"></div>
            </div>
        </div>
    </div>

    <script>
        function showToast(title, message, type = 'success') {
            const toast = document.getElementById('toast');
            const icon = document.getElementById('toast-icon');
            const titleEl = document.getElementById('toast-title');
            const messageEl = document.getElementById('toast-message');

            titleEl.textContent = title;
            messageEl.textContent = message;

            if (type === 'success') {
                toast.className = toast.className.replace('bg-white border-gray-300', 'bg-green-50 border-green-300');
                icon.innerHTML = '<svg class="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>';
            } else {
                toast.className = toast.className.replace('bg-white border-gray-300', 'bg-red-50 border-red-300');
                icon.innerHTML = '<svg class="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path></svg>';
            }

            toast.classList.remove('translate-x-full', 'opacity-0');

            setTimeout(() => {
                toast.classList.add('translate-x-full', 'opacity-0');
            }, 5000);
        }

        // Android upload
        document.getElementById('android-upload-form').addEventListener('submit', async function(e) {
            e.preventDefault();

            const formData = new FormData(this);
            const submitBtn = this.querySelector('button[type="submit"]');

            submitBtn.disabled = true;
            submitBtn.textContent = 'Uploading...';

            try {
                const response = await fetch('/admin/upload/android', {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'X-CSRF-TOKEN': document.querySelector('input[name="_token"]').value
                    }
                });

                const result = await response.json();

                if (result.success) {
                    showToast('Success', result.message, 'success');
                    setTimeout(() => location.reload(), 2000);
                } else {
                    showToast('Error', result.message, 'error');
                }
            } catch (error) {
                showToast('Error', 'Upload failed: ' + error.message, 'error');
            }

            submitBtn.disabled = false;
            submitBtn.textContent = 'Upload Android APK';
        });

        // iOS upload
        document.getElementById('ios-upload-form').addEventListener('submit', async function(e) {
            e.preventDefault();

            const formData = new FormData(this);
            const submitBtn = this.querySelector('button[type="submit"]');

            submitBtn.disabled = true;
            submitBtn.textContent = 'Uploading...';

            try {
                const response = await fetch('/admin/upload/ios', {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'X-CSRF-TOKEN': document.querySelector('input[name="_token"]').value
                    }
                });

                const result = await response.json();

                if (result.success) {
                    showToast('Success', result.message, 'success');
                    setTimeout(() => location.reload(), 2000);
                } else {
                    showToast('Error', result.message, 'error');
                }
            } catch (error) {
                showToast('Error', 'Upload failed: ' + error.message, 'error');
            }

            submitBtn.disabled = false;
            submitBtn.textContent = 'Upload iOS IPA';
        });

        // Delete file
        async function deleteFile(platform) {
            if (!confirm(`Are you sure you want to delete the ${platform} app file?`)) {
                return;
            }

            try {
                const response = await fetch(`/admin/upload/delete/${platform}`, {
                    method: 'DELETE',
                    headers: {
                        'X-CSRF-TOKEN': document.querySelector('input[name="_token"]').value,
                        'Content-Type': 'application/json'
                    }
                });

                const result = await response.json();

                if (result.success) {
                    showToast('Success', result.message, 'success');
                    setTimeout(() => location.reload(), 2000);
                } else {
                    showToast('Error', result.message, 'error');
                }
            } catch (error) {
                showToast('Error', 'Deletion failed: ' + error.message, 'error');
            }
        }
    </script>
@endsection
