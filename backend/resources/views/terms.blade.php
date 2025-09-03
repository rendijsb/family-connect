<!-- backend/resources/views/terms.blade.php -->
@extends('layouts.app')

@section('title', 'Terms of Service - ' . config('app.name'))

@section('content')
    <section class="py-20 bg-white">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 class="text-4xl font-bold text-gray-900 mb-8">Terms of Service</h1>

            <div class="prose prose-lg max-w-none">
                <p class="text-gray-600 mb-6">Last updated: {{ date('F j, Y') }}</p>

                <h2>Acceptance of Terms</h2>
                <p>By accessing and using {{ config('app.name') }}, you accept and agree to be bound by the terms and provision of this agreement.</p>

                <h2>Use License</h2>
                <p>Permission is granted to temporarily use {{ config('app.name') }} for personal, non-commercial transitory viewing only.</p>

                <h2>User Accounts</h2>
                <p>When you create an account with us, you must provide information that is accurate, complete, and current at all times.</p>

                <h2>Prohibited Uses</h2>
                <p>You may not use our service for any unlawful purpose or to solicit others to perform or participate in any unlawful acts.</p>

                <h2>Termination</h2>
                <p>We may terminate or suspend your account and bar access to the service immediately, without prior notice or liability.</p>

                <h2>Contact Us</h2>
                <p>If you have questions about these Terms, please contact us at <a href="mailto:legal@yourapp.com" class="text-blue-600">legal@yourapp.com</a>.</p>
            </div>
        </div>
    </section>
@endsection
