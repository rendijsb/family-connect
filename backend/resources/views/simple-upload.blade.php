<!-- backend/resources/views/simple-upload.blade.php -->
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Upload Apps - {{ config('app.name') }}</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-100">
<div class="min-h-screen py-12">
    <div class="max-w-4xl mx-auto px-4">
        <div class="bg-white rounded-lg shadow-md p-6 mb-6">
            <h1 class="text-3xl font-bold text-center mb-2">Upload Mobile App Files</h1>
            <p class="text-center text-gray-600 mb-4">Upload APK and IPA files for your mobile app downloads</p>

            <div class="text-center text-sm text-gray-500">
                <p>Current downloads:</p>
                <a href="{{ route('download.android') }}" class="text-blue-600 hover:underline mr-4">Android APK</a>
                <a href="{{ route('download.ios') }}" class="text-blue-600 hover:underline">iOS IPA</a>
            </div>
        </div>

        @if(session('success'))
            <div class="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <div class="flex items-center">
                    <svg class="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                    </svg>
                    <span class="text-green-800">{{ session('success') }}</span>
                </div>
            </div>
        @endif

        @if($errors->any())
            <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                @foreach($errors->all() as $error)
                    <div class="flex items-center text-red-800 mb-2">
                        <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
                        </svg>
                        {{ $error }}
                    </div>
                @endforeach
            </div>
        @endif

        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <!-- Android Upload -->
            <div class="bg-white rounded-lg shadow-md p-6">
                <h2 class="text-xl font-bold text-gray-900 mb-4 flex items-center">
                    <svg class="w-6 h-6 text-green-600 mr-2" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.523 15.3414c-.5665 0-.9311-.4314-.9311-.9669 0-.5378.3646-.9692.9311-.9692s.9311.4314.9311.9692c0 .5355-.3646.9669-.9311.9669zm-5.965-8.7512L8.891 4.8292c-.1785-.2128-.4524-.2925-.6855-.1792-.2331.1133-.3317.3907-.2331.6035L10.638 7.284c-1.4524.4314-2.6818 1.2935-3.5129 2.4069H18.874c-.8311-1.1134-2.0605-1.9755-3.5129-2.4069l2.6759-2.0315c.0986-.2128 0-.4902-.2331-.6035-.2331-.1133-.507-.0336-.6855.1792L14.558 6.59z"/>
                    </svg>
                    Upload Android APK
                </h2>

                <!-- Current file status -->
                @php
                    $androidExists = file_exists(public_path('downloads/family-connect.apk'));
                    $androidSize = $androidExists ? filesize(public_path('downloads/family-connect.apk')) : 0;
                    $androidModified = $androidExists ? date('Y-m-d H:i:s', filemtime(public_path('downloads/family-connect.apk'))) : null;
                @endphp

                <div class="mb-4 p-3 bg-gray-50 rounded border-l-4 {{ $androidExists ? 'border-green-500' : 'border-red-500' }}">
                    <strong>Current Status:</strong>
                    @if($androidExists)
                        <div class="text-green-600 mt-1">
                            ✅ APK Available ({{ number_format($androidSize / 1024 / 1024, 1) }}MB)
                        </div>
                        <div class="text-xs text-gray-600 mt-1">Modified: {{ $androidModified }}</div>
                        <div class="mt-2">
                            <a href="{{ route('download.android') }}" target="_blank" class="text-blue-600 hover:underline text-sm">Test Download</a>
                        </div>
                    @else
                        <div class="text-red-600 mt-1">❌ No APK uploaded</div>
                    @endif
                </div>

                <form action="{{ route('simple.upload.post') }}" method="POST" enctype="multipart/form-data">
                    @csrf
                    <input type="hidden" name="type" value="android">
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-700 mb-2">APK File</label>
                        <input type="file" name="file" accept=".apk" required
                               class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500">
                        <p class="text-xs text-gray-500 mt-1">Max size: 200MB • File will replace current APK</p>
                    </div>
                    <button type="submit" class="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors">
                        Upload Android APK
                    </button>
                </form>
            </div>

            <!-- iOS Upload -->
            <div class="bg-white rounded-lg shadow-md p-6">
                <h2 class="text-xl font-bold text-gray-900 mb-4 flex items-center">
                    <svg class="w-6 h-6 text-gray-900 mr-2" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.09997 22C7.78997 22.05 6.79997 20.68 5.95997 19.47C4.24997 17 2.93997 12.45 4.69997 9.39C5.56997 7.87 7.13997 6.91 8.85997 6.88C10.15 6.86 11.38 7.75 12.10 7.75C12.81 7.75 14.24 6.65 15.82 6.82C16.5 6.85 18.27 7.15 19.35 8.83C19.27 8.88 17.97 9.71 17.98 11.53C18 13.83 20.24 14.65 20.26 14.66C20.23 14.75 19.86 16.07 18.71 19.5ZM13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z"/>
                    </svg>
                    Upload iOS IPA
                </h2>

                <!-- Current file status -->
                @php
                    $iosExists = file_exists(public_path('downloads/family-connect.ipa'));
                    $iosSize = $iosExists ? filesize(public_path('downloads/family-connect.ipa')) : 0;
                    $iosModified = $iosExists ? date('Y-m-d H:i:s', filemtime(public_path('downloads/family-connect.ipa'))) : null;
                @endphp

                <div class="mb-4 p-3 bg-gray-50 rounded border-l-4 {{ $iosExists ? 'border-green-500' : 'border-red-500' }}">
                    <strong>Current Status:</strong>
                    @if($iosExists)
                        <div class="text-green-600 mt-1">
                            ✅ IPA Available ({{ number_format($iosSize / 1024 / 1024, 1) }}MB)
                        </div>
                        <div class="text-xs text-gray-600 mt-1">Modified: {{ $iosModified }}</div>
                        <div class="mt-2">
                            <a href="{{ route('download.ios') }}" target="_blank" class="text-blue-600 hover:underline text-sm">Test Download</a>
                        </div>
                    @else
                        <div class="text-red-600 mt-1">❌ No IPA uploaded</div>
                    @endif
                </div>

                <form action="{{ route('simple.upload.post') }}" method="POST" enctype="multipart/form-data">
                    @csrf
                    <input type="hidden" name="type" value="ios">
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-700 mb-2">IPA File</label>
                        <input type="file" name="file" accept=".ipa" required
                               class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500">
                        <p class="text-xs text-gray-500 mt-1">Max size: 200MB • File will replace current IPA</p>
                    </div>
                    <button type="submit" class="w-full bg-gray-900 text-white py-2 px-4 rounded-md hover:bg-gray-800 transition-colors">
                        Upload iOS IPA
                    </button>
                </form>
            </div>
        </div>

        <!-- Navigation -->
        <div class="mt-8 text-center bg-white rounded-lg shadow-md p-4">
            <div class="flex justify-center space-x-4">
                <a href="{{ route('home') }}" class="text-blue-600 hover:underline">← Back to Home</a>
                <span class="text-gray-300">|</span>
                <form action="{{ route('admin.logout') }}" method="POST" class="inline">
                    @csrf
                    <button type="submit" class="text-red-600 hover:underline">Logout</button>
                </form>
            </div>
        </div>
    </div>
</div>

<script>
    // Add some basic file validation
    document.querySelectorAll('input[type="file"]').forEach(input => {
        input.addEventListener('change', function() {
            const file = this.files[0];
            if (file) {
                const maxSize = 200 * 1024 * 1024; // 200MB
                if (file.size > maxSize) {
                    alert('File is too large! Maximum size is 200MB.');
                    this.value = '';
                    return;
                }

                const fileName = file.name.toLowerCase();
                const type = this.closest('form').querySelector('input[name="type"]').value;

                if (type === 'android' && !fileName.endsWith('.apk')) {
                    alert('Please select an APK file for Android upload.');
                    this.value = '';
                    return;
                }

                if (type === 'ios' && !fileName.endsWith('.ipa')) {
                    alert('Please select an IPA file for iOS upload.');
                    this.value = '';
                    return;
                }
            }
        });
    });

    // Add upload progress (basic)
    document.querySelectorAll('form').forEach(form => {
        form.addEventListener('submit', function() {
            const button = this.querySelector('button[type="submit"]');
            const originalText = button.textContent;
            button.disabled = true;
            button.textContent = 'Uploading...';

            // Re-enable after 30 seconds (fallback)
            setTimeout(() => {
                button.disabled = false;
                button.textContent = originalText;
            }, 30000);
        });
    });
</script>
</body>
</html>
