<!-- backend/resources/views/privacy.blade.php -->
@extends('layouts.app')

@section('title', 'Privacy Policy - ' . config('app.name'))

@section('content')
    <section class="py-20 bg-white">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 class="text-4xl font-bold text-gray-900 mb-8">Privacy Policy</h1>

            <div class="prose prose-lg max-w-none">
                <p class="text-gray-600 mb-6">Last updated: {{ date('F j, Y') }}</p>

                <h2>Information We Collect</h2>
                <p>{{ config('app.name') }} collects information you provide directly to us when you create an account, use our services, or communicate with us.</p>

                <h2>How We Use Your Information</h2>
                <p>We use the information we collect to provide, maintain, and improve our services, including family communication features and account management.</p>

                <h2>Information Sharing</h2>
                <p>We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as described in this policy.</p>

                <h2>Data Security</h2>
                <p>We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.</p>

                <h2>Contact Us</h2>
                <p>If you have questions about this Privacy Policy, please contact us at <a href="mailto:privacy@yourapp.com" class="text-blue-600">privacy@yourapp.com</a>.</p>
            </div>
        </div>
    </section>
@endsection
