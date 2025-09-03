<!-- backend/resources/views/support.blade.php -->
@extends('layouts.app')

@section('title', 'Support - ' . config('app.name'))

@section('content')
    <section class="py-20 bg-white">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 class="text-4xl font-bold text-gray-900 mb-8 text-center">How Can We Help?</h1>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                <!-- FAQ Section -->
                <div class="bg-gray-50 p-6 rounded-lg">
                    <h2 class="text-2xl font-semibold text-gray-900 mb-4">Frequently Asked Questions</h2>

                    <div class="space-y-4">
                        <div>
                            <h3 class="font-medium text-gray-900">How do I create a family group?</h3>
                            <p class="text-gray-600 text-sm mt-1">Open the app, tap "Create Family" and invite members using their email addresses or phone numbers.</p>
                        </div>

                        <div>
                            <h3 class="font-medium text-gray-900">Is my data secure?</h3>
                            <p class="text-gray-600 text-sm mt-1">Yes, all messages are encrypted end-to-end and we never share your personal information with third parties.</p>
                        </div>

                        <div>
                            <h3 class="font-medium text-gray-900">Can I use the app on multiple devices?</h3>
                            <p class="text-gray-600 text-sm mt-1">Yes, you can sign in to your account on multiple devices and sync your family conversations.</p>
                        </div>

                        <div>
                            <h3 class="font-medium text-gray-900">How do I report a problem?</h3>
                            <p class="text-gray-600 text-sm mt-1">Use the contact form below or email us directly at support@yourapp.com</p>
                        </div>
                    </div>
                </div>

                <!-- Contact Form -->
                <div class="bg-blue-50 p-6 rounded-lg">
                    <h2 class="text-2xl font-semibold text-gray-900 mb-4">Contact Support</h2>

                    <form action="#" method="POST" class="space-y-4">
                        @csrf
                        <div>
                            <label for="name" class="block text-sm font-medium text-gray-700">Name</label>
                            <input type="text" id="name" name="name" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                        </div>

                        <div>
                            <label for="email" class="block text-sm font-medium text-gray-700">Email</label>
                            <input type="email" id="email" name="email" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                        </div>

                        <div>
                            <label for="subject" class="block text-sm font-medium text-gray-700">Subject</label>
                            <select id="subject" name="subject" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                                <option>Account Issues</option>
                                <option>Technical Problems</option>
                                <option>Feature Requests</option>
                                <option>Bug Reports</option>
                                <option>Other</option>
                            </select>
                        </div>

                        <div>
                            <label for="message" class="block text-sm font-medium text-gray-700">Message</label>
                            <textarea id="message" name="message" rows="4" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"></textarea>
                        </div>

                        <button type="submit" class="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                            Send Message
                        </button>
                    </form>
                </div>
            </div>

            <!-- Download Section -->
            <div class="text-center bg-gray-900 text-white p-8 rounded-xl">
                <h2 class="text-2xl font-bold mb-4">Don't Have the App Yet?</h2>
                <p class="text-gray-300 mb-6">Download {{ config('app.name') }} to start connecting with your family today.</p>

                <div class="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4">
                    <a href="{{ route('download.android') }}" class="inline-flex items-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors">
                        <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.523 15.3414c-.5665 0-.9311-.4314-.9311-.9669 0-.5378.3646-.9692.9311-.9692s.9311.4314.9311.9692c0 .5355-.3646.9669-.9311.9669zm-5.965-8.7512L8.891 4.8292c-.1785-.2128-.4524-.2925-.6855-.1792-.2331.1133-.3317.3907-.2331.6035L10.638 7.284c-1.4524.4314-2.6818 1.2935-3.5129 2.4069H18.874c-.8311-1.1134-2.0605-1.9755-3.5129-2.4069l2.6759-2.0315c.0986-.2128 0-.4902-.2331-.6035-.2331-.1133-.507-.0336-.6855.1792L14.558 6.59z"/>
                        </svg>
                        Download for Android
                    </a>
                    <a href="{{ route('download.ios') }}" class="inline-flex items-center px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-lg transition-colors">
                        <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.09997 22C7.78997 22.05 6.79997 20.68 5.95997 19.47C4.24997 17 2.93997 12.45 4.69997 9.39C5.56997 7.87 7.13997 6.91 8.85997 6.88C10.15 6.86 11.38 7.75 12.10 7.75C12.81 7.75 14.24 6.65 15.82 6.82C16.5 6.85 18.27 7.15 19.35 8.83C19.27 8.88 17.97 9.71 17.98 11.53C18 13.83 20.24 14.65 20.26 14.66C20.23 14.75 19.86 16.07 18.71 19.5ZM13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z"/>
                        </svg>
                        Download for iOS
                    </a>
                </div>
            </div>
        </div>
    </section>
@endsection
