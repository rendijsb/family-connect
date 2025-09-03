<?php

namespace App\Providers;

use Illuminate\Support\Facades\Gate;
use Laravel\Telescope\IncomingEntry;
use Laravel\Telescope\Telescope;
use Laravel\Telescope\TelescopeApplicationServiceProvider;

class TelescopeServiceProvider extends TelescopeApplicationServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Enable Telescope in production
        Telescope::night();

        $this->hideSensitiveRequestDetails();

        // Allow all entries in production for debugging
        Telescope::filter(function (IncomingEntry $entry) {
            return true; // Log everything for admin debugging
        });
    }

    /**
     * Prevent sensitive request details from being logged by Telescope.
     */
    protected function hideSensitiveRequestDetails(): void
    {
        Telescope::hideRequestParameters([
            '_token',
            'password',
            'password_confirmation',
        ]);

        Telescope::hideRequestHeaders([
            'cookie',
            'x-csrf-token',
            'x-xsrf-token',
        ]);
    }

    /**
     * Register the Telescope gate.
     */
    protected function gate(): void
    {
        Gate::define('viewTelescope', function ($user = null) {
            // Allow access if user is authenticated and is admin
            if (!$user) {
                return false;
            }

            // Check if user has admin role (role_id = 1)
            if (method_exists($user, 'getRoleId')) {
                return $user->getRoleId() === 1;
            }

            // Fallback: check by email for specific admin users
            return in_array($user->email, [
                'test@admin.com',
                // Add more admin emails here if needed
            ]);
        });
    }
}
