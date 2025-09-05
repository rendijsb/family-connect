<!-- backend/resources/views/layouts/app.blade.php -->
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="Family Connect - Stay connected with your family through secure messaging, photo sharing, and more.">
    <title>@yield('title', config('app.name'))</title>

    <!-- Favicon -->
    <link rel="icon" type="image/png" href="/favicon.png">

    <!-- SEO Meta Tags -->
    <meta property="og:title" content="@yield('title', config('app.name'))">
    <meta property="og:description" content="@yield('description', 'Stay connected with your family through secure messaging, photo sharing, and more.')">
    <meta property="og:type" content="website">
    <meta property="og:url" content="{{ url()->current() }}">
    <meta property="og:image" content="{{ asset('images/og-image.png') }}">

    <!-- Tailwind CSS via CDN (for quick setup) -->
    <script src="https://cdn.tailwindcss.com"></script>

    <style>
        .gradient-bg {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .feature-card {
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .feature-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }
        .app-store-btn {
            transition: all 0.3s ease;
        }
        .app-store-btn:hover {
            transform: scale(1.05);
        }
    </style>
</head>
<body class="bg-gray-50">
<!-- Navigation -->
<nav class="bg-white shadow-sm fixed w-full top-0 z-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
            <div class="flex-shrink-0">
                <h1 class="text-2xl font-bold text-gray-900">{{ config('app.name') }}</h1>
            </div>
            <div class="hidden md:block">
                <div class="ml-10 flex items-baseline space-x-4">
                    <a href="{{ route('home') }}" class="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium">Home</a>
                    <a href="{{ route('support') }}" class="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium">Support</a>
                    <a href="{{ route('privacy') }}" class="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium">Privacy</a>
                    <a href="{{ route('terms') }}" class="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium">Terms</a>
                </div>
            </div>
            <!-- Mobile menu button -->
            <div class="md:hidden">
                <button type="button" class="text-gray-600 hover:text-gray-900" onclick="toggleMobileMenu()">
                    <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
                    </svg>
                </button>
            </div>
        </div>
        <!-- Mobile menu -->
        <div id="mobile-menu" class="md:hidden hidden">
            <div class="px-2 pt-2 pb-3 space-y-1">
                <a href="{{ route('home') }}" class="text-gray-600 hover:text-gray-900 block px-3 py-2 text-base font-medium">Home</a>
                <a href="{{ route('support') }}" class="text-gray-600 hover:text-gray-900 block px-3 py-2 text-base font-medium">Support</a>
                <a href="{{ route('privacy') }}" class="text-gray-600 hover:text-gray-900 block px-3 py-2 text-base font-medium">Privacy</a>
                <a href="{{ route('terms') }}" class="text-gray-600 hover:text-gray-900 block px-3 py-2 text-base font-medium">Terms</a>
            </div>
        </div>
    </div>
</nav>

<!-- Main Content -->
<main class="pt-16">
    @yield('content')
</main>

<!-- Footer -->
<footer class="bg-gray-900 text-white">
    <div class="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div class="col-span-1 md:col-span-2">
                <h3 class="text-2xl font-bold mb-4">{{ config('app.name') }}</h3>
                <p class="text-gray-400 mb-4">
                    Bringing families closer together through secure communication and shared memories.
                </p>
                <div class="flex space-x-4">
                    <!-- Download buttons -->
                    <a href="{{ route('download.android') }}" class="app-store-btn inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-md transition-colors">
                        <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.523 15.3414c-.5665 0-.9311-.4314-.9311-.9669 0-.5378.3646-.9692.9311-.9692s.9311.4314.9311.9692c0 .5355-.3646.9669-.9311.9669zm-5.965-8.7512L8.891 4.8292c-.1785-.2128-.4524-.2925-.6855-.1792-.2331.1133-.3317.3907-.2331.6035L10.638 7.284c-1.4524.4314-2.6818 1.2935-3.5129 2.4069H18.874c-.8311-1.1134-2.0605-1.9755-3.5129-2.4069l2.6759-2.0315c.0986-.2128 0-.4902-.2331-.6035-.2331-.1133-.507-.0336-.6855.1792L14.558 6.59z"/>
                        </svg>
                        Android
                    </a>
                    <a href="{{ route('download.ios') }}" class="app-store-btn inline-flex items-center px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium rounded-md transition-colors">
                        <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.09997 22C7.78997 22.05 6.79997 20.68 5.95997 19.47C4.24997 17 2.93997 12.45 4.69997 9.39C5.56997 7.87 7.13997 6.91 8.85997 6.88C10.15 6.86 11.38 7.75 12.10 7.75C12.81 7.75 14.24 6.65 15.82 6.82C16.5 6.85 18.27 7.15 19.35 8.83C19.27 8.88 17.97 9.71 17.98 11.53C18 13.83 20.24 14.65 20.26 14.66C20.23 14.75 19.86 16.07 18.71 19.5ZM13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z"/>
                        </svg>
                        iOS
                    </a>
                </div>
            </div>
            <div>
                <h4 class="text-lg font-semibold mb-4">Support</h4>
                <ul class="space-y-2">
                    <li><a href="{{ route('support') }}" class="text-gray-400 hover:text-white">Help Center</a></li>
                    <li><a href="mailto:support@yourapp.com" class="text-gray-400 hover:text-white">Contact Us</a></li>
                    <li><a href="#" class="text-gray-400 hover:text-white">FAQ</a></li>
                </ul>
            </div>
            <div>
                <h4 class="text-lg font-semibold mb-4">Legal</h4>
                <ul class="space-y-2">
                    <li><a href="{{ route('privacy') }}" class="text-gray-400 hover:text-white">Privacy Policy</a></li>
                    <li><a href="{{ route('terms') }}" class="text-gray-400 hover:text-white">Terms of Service</a></li>
                </ul>
            </div>
        </div>
        <div class="mt-8 pt-8 border-t border-gray-800 text-center">
            <p class="text-gray-400">&copy; {{ date('Y') }} {{ config('app.name') }}. All rights reserved.</p>
        </div>
    </div>
</footer>

<script>
    function toggleMobileMenu() {
        const menu = document.getElementById('mobile-menu');
        menu.classList.toggle('hidden');
    }
</script>
</body>
</html>
