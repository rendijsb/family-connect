<!-- backend/resources/views/install/android.blade.php -->
@extends('layouts.app')

@section('title', 'How to Install Android APK - ' . config('app.name'))

@section('content')
    <section class="py-20 bg-white">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="text-center mb-12">
                <h1 class="text-4xl font-bold text-gray-900 mb-4">Installing the Android App</h1>
                <p class="text-xl text-gray-600">Follow these simple steps to install {{ config('app.name') }} on your Android device</p>
            </div>

            <!-- Download Button -->
            <div class="text-center mb-12">
                <a href="{{ route('download.android') }}" class="inline-flex items-center px-8 py-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg shadow-lg transition-all duration-300 hover:shadow-xl">
                    <svg class="w-6 h-6 mr-3" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.523 15.3414c-.5665 0-.9311-.4314-.9311-.9669 0-.5378.3646-.9692.9311-.9692s.9311.4314.9311.9692c0 .5355-.3646.9669-.9311.9669zm-5.965-8.7512L8.891 4.8292c-.1785-.2128-.4524-.2925-.6855-.1792-.2331.1133-.3317.3907-.2331.6035L10.638 7.284c-1.4524.4314-2.6818 1.2935-3.5129 2.4069H18.874c-.8311-1.1134-2.0605-1.9755-3.5129-2.4069l2.6759-2.0315c.0986-.2128 0-.4902-.2331-.6035-.2331-.1133-.507-.0336-.6855.1792L14.558 6.59z"/>
                    </svg>
                    Download APK File
                </a>
            </div>

            <!-- Installation Steps -->
            <div class="space-y-8">
                <!-- Step 1 -->
                <div class="flex items-start space-x-4">
                    <div class="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">1</div>
                    <div>
                        <h3 class="text-xl font-semibold text-gray-900 mb-2">Enable "Unknown Sources"</h3>
                        <p class="text-gray-600 mb-4">Before installing the APK, you need to allow installations from unknown sources:</p>
                        <div class="bg-gray-50 p-4 rounded-lg">
                            <ul class="space-y-2 text-sm text-gray-700">
                                <li class="flex items-start">
                                    <span class="inline-block w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                    Go to <strong>Settings</strong> → <strong>Security</strong> (or <strong>Apps & notifications</strong>)
                                </li>
                                <li class="flex items-start">
                                    <span class="inline-block w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                    Find and enable <strong>"Install unknown apps"</strong> or <strong>"Unknown sources"</strong>
                                </li>
                                <li class="flex items-start">
                                    <span class="inline-block w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                    Select your browser (Chrome/Firefox) and allow it to install unknown apps
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                <!-- Step 2 -->
                <div class="flex items-start space-x-4">
                    <div class="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">2</div>
                    <div>
                        <h3 class="text-xl font-semibold text-gray-900 mb-2">Download the APK</h3>
                        <p class="text-gray-600 mb-4">Tap the download button above or use this direct link:</p>
                        <div class="bg-gray-50 p-4 rounded-lg">
                            <code class="text-sm text-gray-700 break-all">{{ url('/download/android') }}</code>
                        </div>
                    </div>
                </div>

                <!-- Step 3 -->
                <div class="flex items-start space-x-4">
                    <div class="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">3</div>
                    <div>
                        <h3 class="text-xl font-semibold text-gray-900 mb-2">Install the App</h3>
                        <p class="text-gray-600 mb-4">Once the APK file is downloaded:</p>
                        <div class="bg-gray-50 p-4 rounded-lg">
                            <ul class="space-y-2 text-sm text-gray-700">
                                <li class="flex items-start">
                                    <span class="inline-block w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                    Open your <strong>Downloads</strong> folder or notification panel
                                </li>
                                <li class="flex items-start">
                                    <span class="inline-block w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                    Tap on <strong>"FamilyConnect.apk"</strong>
                                </li>
                                <li class="flex items-start">
                                    <span class="inline-block w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                    Tap <strong>"Install"</strong> when prompted
                                </li>
                                <li class="flex items-start">
                                    <span class="inline-block w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                    Wait for installation to complete
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                <!-- Step 4 -->
                <div class="flex items-start space-x-4">
                    <div class="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">4</div>
                    <div>
                        <h3 class="text-xl font-semibold text-gray-900 mb-2">Open the App</h3>
                        <p class="text-gray-600">Find {{ config('app.name') }} in your app drawer and start connecting with your family!</p>
                    </div>
                </div>
            </div>

            <!-- Troubleshooting -->
            <div class="mt-12 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <h3 class="text-lg font-semibold text-yellow-800 mb-3">Troubleshooting</h3>
                <div class="space-y-3 text-sm text-yellow-700">
                    <p><strong>Installation blocked?</strong> Make sure you've enabled "Unknown sources" for your browser in Settings.</p>
                    <p><strong>Can't find the APK?</strong> Check your Downloads folder or browser's download manager.</p>
                    <p><strong>App won't open?</strong> Ensure your Android version is 6.0 (API 23) or higher.</p>
                    <p><strong>Still having issues?</strong> <a href="{{ route('support') }}" class="text-yellow-800 underline">Contact our support team</a> for help.</p>
                </div>
            </div>

            <!-- Back to Home -->
            <div class="text-center mt-8">
                <a href="{{ route('home') }}" class="text-blue-600 hover:text-blue-700 font-medium">
                    ← Back to Home
                </a>
            </div>
        </div>
    </section>
@endsection
