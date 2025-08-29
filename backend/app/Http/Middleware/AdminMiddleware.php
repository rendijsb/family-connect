<?php
// backend/app/Http/Middleware/AdminMiddleware.php - Create this if you don't have role middleware

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AdminMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        if (!auth()->check()) {
            return redirect()->route('admin.login');
        }

        $user = auth()->user();

        // Check if user has admin role (role_id = 1)
        if ($user->getRoleId() !== 1) {
            abort(403, 'Access denied. Admin privileges required.');
        }

        return $next($request);
    }
}
