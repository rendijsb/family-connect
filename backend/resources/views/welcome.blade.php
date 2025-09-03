<!-- backend/resources/views/welcome.blade.php -->
@extends('layouts.app')

@section('title', $appName . ' - Stay Connected with Family')
@section('description', 'Download the Family Connect app for iOS and Android. Secure family messaging, photo sharing, and more.')

@section('content')
    <!-- Hero Section -->
    <section class="gradient-bg text-white">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <div class="text-center">
                <h1 class="text-4xl md:text-6xl font-bold mb-6">
                    Stay Connected<br>with Your Family
                </h1>
                <p class="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
                    {{ $appName }} brings your family together with secure messaging, photo sharing,
                    and real-time communication - all in one beautiful app.
                </p>

                <!-- Download Buttons -->
                <div class="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4 mb-8">
                    <a href="{{ route('download.android') }}" class="app-store-btn inline-flex items-center px-8 py-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg shadow-lg transition-all duration-300 hover:shadow-xl">
                        <svg class="w-6 h-6 mr-3" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.523 15.3414c-.5665 0-.9311-.4314-.9311-.9669 0-.5378.3646-.9692.9311-.9692s.9311.4314.9311.9692c0 .5355-.3646.9669-.9311.9669zm-5.965-8.7512L8.891 4.8292c-.1785-.2128-.4524-.2925-.6855-.1792-.2331.1133-.3317.3907-.2331.6035L10.638 7.284c-1.4524.4314-2.6818 1.2935-3.5129 2.4069H18.874c-.8311-1.1134-2.0605-1.9755-3.5129-2.4069l2.6759-2.0315c.0986-.2128 0-.4902-.2331-.6035-.2331-.1133-.507-.0336-.6855.1792L14.558 6.59z"/>
                        </svg>
                        Download for Android
                        <span class="ml-2 text-sm opacity-75">(APK)</span>
                    </a>
                    <a href="{{ route('download.ios') }}" class="app-store-btn inline-flex items-center px-8 py-4 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-lg shadow-lg transition-all duration-300 hover:shadow-xl">
                        <svg class="w-6 h-6 mr-3" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.09997 22C7.78997 22.05 6.79997 20.68 5.95997 19.47C4.24997 17 2.93997 12.45 4.69997 9.39C5.56997 7.87 7.13997 6.91 8.85997 6.88C10.15 6.86 11.38 7.75 12.10 7.75C12.81 7.75 14.24 6.65 15.82 6.82C16.5 6.85 18.27 7.15 19.35 8.83C19.27 8.88 17.97 9.71 17.98 11.53C18 13.83 20.24 14.65 20.26 14.66C20.23 14.75 19.86 16.07 18.71 19.5ZM13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z"/>
                        </svg>
                        Download for iOS
                        <span class="ml-2 text-sm opacity-75">(IPA)</span>
                    </a>
                </div>

                <!-- Beta Notice -->
                <div class="bg-yellow-100 border border-yellow-400 text-yellow-800 px-6 py-3 rounded-lg max-w-2xl mx-auto mb-8">
                    <div class="flex items-center">
                        <svg class="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
                        </svg>
                        <div>
                            <p class="font-medium">Beta Version Available</p>
                            <p class="text-sm">This is a pre-release version for testing. Installation instructions provided after download.</p>
                        </div>
                    </div>
                </div>

                <!-- Installation Help Links -->
                <div class="flex flex-col sm:flex-row justify-center items-center space-y-2 sm:space-y-0 sm:space-x-6 text-sm">
                    <a href="{{ route('install.android') }}" class="text-white/80 hover:text-white underline">
                        📱 How to install APK files
                    </a>
                    <a href="{{ route('install.ios') }}" class="text-white/80 hover:text-white underline">
                        🍎 How to install IPA files
                    </a>
                </div>
            </div>
        </div>

        <!-- Wave divider -->
        <div class="relative">
            <svg class="w-full h-12 text-gray-50" preserveAspectRatio="none" viewBox="0 0 1200 120" fill="currentColor">
                <path d="M1200 0L0 0 598.97 114.72 1200 0z"></path>
            </svg>
        </div>
    </section>

    <!-- Features Section -->
    <section class="py-20 bg-gray-50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="text-center mb-16">
                <h2 class="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                    Everything Your Family Needs
                </h2>
                <p class="text-xl text-gray-600 max-w-2xl mx-auto">
                    Connect, share, and stay organized with features designed specifically for families.
                </p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                @foreach($features as $index => $feature)
                    <div class="feature-card bg-white p-8 rounded-xl shadow-md">
                        <div class="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center mb-6">
                            @switch($index)
                                @case(0)
                                    <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path fill-rule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z" clip-rule="evenodd"></path>
                                    </svg>
                                    @break
                                @case(1)
                                    <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z"></path>
                                        <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z"></path>
                                    </svg>
                                    @break
                                @case(2)
                                    <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd"></path>
                                    </svg>
                                    @break
                                @case(3)
                                    <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"></path>
                                    </svg>
                                    @break
                                @default
                                    <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd"></path>
                                    </svg>
                            @endswitch
                        </div>
                        <h3 class="text-xl font-semibold text-gray-900 mb-3">{{ $feature }}</h3>
                        <p class="text-gray-600">
                            @switch($index)
                                @case(0)
                                    Create group chats, send direct messages, and stay in touch with all family members in one secure space.
                                    @break
                                @case(1)
                                    Instant notifications and real-time messaging ensure you never miss important family moments.
                                    @break
                                @case(2)
                                    Share photos, videos, and create lasting memories with your family's private photo albums.
                                    @break
                                @case(3)
                                    Coordinate family schedules, plan events, and never miss important dates with shared calendars.
                                    @break
                                @default
                                    Your family's privacy is our priority. End-to-end encryption keeps your conversations secure.
                            @endswitch
                        </p>
                    </div>
                @endforeach
            </div>
        </div>
    </section>

    <!-- CTA Section -->
    <section class="py-20 bg-white">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 class="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Ready to Connect Your Family?
            </h2>
            <p class="text-xl text-gray-600 mb-8">
                Join thousands of families who are already staying connected with {{ $appName }}.
            </p>

            <!-- Download buttons repeated -->
            <div class="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4 mb-6">
                <a href="{{ route('download.android') }}" class="inline-flex items-center px-8 py-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg shadow-lg transition-all duration-300 hover:shadow-xl">
                    <svg class="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.523 15.3414c-.5665 0-.9311-.4314-.9311-.9669 0-.5378.3646-.9692.9311-.9692s.9311.4314.9311.9692c0 .5355-.3646.9669-.9311.9669zm-5.965-8.7512L8.891 4.8292c-.1785-.2128-.4524-.2925-.6855-.1792-.2331.1133-.3317.3907-.2331.6035L10.638 7.284c-1.4524.4314-2.6818 1.2935-3.5129 2.4069H18.874c-.8311-1.1134-2.0605-1.9755-3.5129-2.4069l2.6759-2.0315c.0986-.2128 0-.4902-.2331-.6035-.2331-.1133-.507-.0336-.6855.1792L14.558 6.59z"/>
                    </svg>
                    Download for Android
                </a>
                <a href="{{ route('download.ios') }}" class="inline-flex items-center px-8 py-4 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-lg shadow-lg transition-all duration-300 hover:shadow-xl">
                    <svg class="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.09997 22C7.78997 22.05 6.79997 20.68 5.95997 19.47C4.24997 17 2.93997 12.45 4.69997 9.39C5.56997 7.87 7.13997 6.91 8.85997 6.88C10.15 6.86 11.38 7.75 12.10 7.75C12.81 7.75 14.24 6.65 15.82 6.82C16.5 6.85 18.27 7.15 19.35 8.83C19.27 8.88 17.97 9.71 17.98 11.53C18 13.83 20.24 14.65 20.26 14.66C20.23 14.75 19.86 16.07 18.71 19.5ZM13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z"/>
                    </svg>
                    Download for iOS
                </a>
            </div>

            <div class="mt-8 text-sm text-gray-500">
                <p>Version {{ $appVersion }} • Available worldwide • Free to download</p>
            </div>
        </div>
    </section>

    <!-- Stats Section -->
    <section class="py-16 bg-gray-900 text-white">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                <div>
                    <div class="text-4xl font-bold text-blue-400 mb-2">10K+</div>
                    <div class="text-gray-300">Active Families</div>
                </div>
                <div>
                    <div class="text-4xl font-bold text-purple-400 mb-2">50K+</div>
                    <div class="text-gray-300">Messages Sent Daily</div>
                </div>
                <div>
                    <div class="text-4xl font-bold text-green-400 mb-2">99.9%</div>
                    <div class="text-gray-300">Uptime Reliability</div>
                </div>
            </div>
        </div>
    </section>
@endsection
