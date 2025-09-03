<!-- backend/resources/views/install/ios.blade.php -->
@extends('layouts.app')

@section('title', 'How to Install iOS IPA - ' . config('app.name'))

@section('content')
    <section class="py-20 bg-white">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="text-center mb-12">
                <h1 class="text-4xl font-bold text-gray-900 mb-4">Installing the iOS App</h1>
                <p class="text-xl text-gray-600">Follow these steps to install {{ config('app.name') }} on your iPhone or iPad</p>
            </div>

            <!-- Important Notice -->
            <div class="mb-8 bg-red-50 border border-red-200 rounded-lg p-6">
                <div class="flex items-start">
                    <svg class="w-6 h-6 text-red-600 mr-3 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
                    </svg>
                    <div>
                        <h3 class="text-lg font-semibold text-red-800 mb-2">Important Notice</h3>
                        <p class="text-red-700">Installing IPA files on iOS requires special tools and is more complex than Android. We recommend waiting for our TestFlight beta or App Store release for the best experience.</p>
                    </div>
                </div>
            </div>

            <!-- Download Button -->
            <div class="text-center mb-12">
                <a href="{{ route('download.ios') }}" class="inline-flex items-center px-8 py-4 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-lg shadow-lg transition-all duration-300 hover:shadow-xl">
                    <svg class="w-6 h-6 mr-3" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.09997 22C7.78997 22.05 6.79997 20.68 5.95997 19.47C4.24997 17 2.93997 12.45 4.69997 9.39C5.56997 7.87 7.13997 6.91 8.85997 6.88C10.15 6.86 11.38 7.75 12.10 7.75C12.81 7.75 14.24 6.65 15.82 6.82C16.5 6.85 18.27 7.15 19.35 8.83C19.27 8.88 17.97 9.71 17.98 11.53C18 13.83 20.24 14.65 20.26 14.66C20.23 14.75 19.86 16.07 18.71 19.5ZM13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z"/>
                    </svg>
                    Download IPA File
                </a>
            </div>

            <!-- Installation Methods -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                <!-- Method 1: AltStore -->
                <div class="border border-gray-200 rounded-lg p-6">
                    <h3 class="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                        <span class="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm mr-3">1</span>
                        AltStore (Recommended)
                    </h3>
                    <div class="space-y-3 text-sm text-gray-600">
                        <p>AltStore is a free alternative app store for iOS that doesn't require jailbreaking.</p>
                        <div class="bg-gray-50 p-4 rounded">
                            <p class="font-medium mb-2">Steps:</p>
                            <ol class="space-y-1 list-decimal list-inside">
                                <li>Download AltStore from <code>altstore.io</code></li>
                                <li>Install AltStore on your computer</li>
                                <li>Connect your iPhone to your computer</li>
                                <li>Install AltStore on your iPhone</li>
                                <li>Use AltStore to install the IPA file</li>
                            </ol>
                        </div>
                    </div>
                </div>

                <!-- Method 2: Sideloadly -->
                <div class="border border-gray-200 rounded-lg p-6">
                    <h3 class="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                        <span class="bg-purple-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm mr-3">2</span>
                        Sideloadly
                    </h3>
                    <div class="space-y-3 text-sm text-gray-600">
                        <p>Sideloadly is another tool for installing IPA files without jailbreaking.</p>
                        <div class="bg-gray-50 p-4 rounded">
                            <p class="font-medium mb-2">Steps:</p>
                            <ol class="space-y-1 list-decimal list-inside">
                                <li>Download Sideloadly from <code>sideloadly.io</code></li>
                                <li>Install Sideloadly on your computer</li>
                                <li>Connect your iPhone with a cable</li>
                                <li>Sign in with your Apple ID</li>
                                <li>Drag the IPA file to install it</li>
                            </ol>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Requirements -->
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
                <h3 class="text-lg font-semibold text-blue-800 mb-3">Requirements</h3>
                <ul class="space-y-2 text-sm text-blue-700">
                    <li class="flex items-start">
                        <span class="inline-block w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        <strong>Computer:</strong> Windows, Mac, or Linux computer
                    </li>
                    <li class="flex items-start">
                        <span class="inline-block w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        <strong>Cable:</strong> Lightning or USB-C cable to connect your iPhone
                    </li>
                    <li class="flex items-start">
                        <span class="inline-block w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        <strong>Apple ID:</strong> Your Apple ID credentials
                    </li>
                    <li class="flex items-start">
                        <span class="inline-block w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        <strong>iOS Version:</strong> iOS 12.0 or later
                    </li>
                </ul>
            </div>

            <!-- Alternative: TestFlight -->
            <div class="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
                <h3 class="text-lg font-semibold text-green-800 mb-3">Easier Alternative: TestFlight Beta</h3>
                <p class="text-green-700 mb-4">
                    For a simpler installation process, join our TestFlight beta program when available.
                    TestFlight is Apple's official beta testing platform.
                </p>
                <div class="text-sm text-green-600">
                    <p><strong>Benefits:</strong> No computer required, automatic updates, official Apple process</p>
                    <p><strong>How to join:</strong> We'll send you a TestFlight invitation link when beta testing begins.</p>
                </div>
            </div>

            <!-- Troubleshooting -->
            <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <h3 class="text-lg font-semibold text-yellow-800 mb-3">Troubleshooting</h3>
                <div class="space-y-3 text-sm text-yellow-700">
                    <p><strong>Installation fails?</strong> Make sure you trust the developer certificate in Settings → General → Device Management.</p>
                    <p><strong>App crashes on launch?</strong> Try restarting your iPhone and launching the app again.</p>
                    <p><strong>Certificate expired?</strong> Free Apple accounts require reinstalling apps every 7 days.</p>
                    <p><strong>Need help?</strong> <a href="{{ route('support') }}" class="text-yellow-800 underline">Contact our support team</a> for assistance.</p>
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
