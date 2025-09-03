<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class TelescopeAuthMiddleware
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (!Auth::check()) {
            session(['url.intended' => $request->url()]);

            return redirect()->route('admin.login')
                ->with('message', 'Please login as admin to access Telescope.');
        }

        $user = Auth::user();

        if (method_exists($user, 'getRoleId')) {
            if ($user->getRoleId() !== 1) {
                abort(403, 'Access denied. Admin privileges required to access Telescope.');
            }
        } else {
            if (!in_array($user->email, ['test@admin.com'])) {
                abort(403, 'Access denied. Admin privileges required to access Telescope.');
            }
        }

        return $next($request);
    }
}
