<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CorsMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        // Handle preflight requests
        if ($request->getMethod() === 'OPTIONS') {
            $response = response('', 200);
        } else {
            $response = $next($request);
        }

        // Determine allowed origins
        $origin = (string) $request->headers->get('Origin', '');
        $allowedOrigins = [
            'http://localhost:4200',
            'http://localhost:8100', // Ionic dev server
            'capacitor://localhost', // Capacitor iOS/Android
            'ionic://localhost',
        ];
        $allowOriginHeader = in_array($origin, $allowedOrigins, true) ? $origin : $allowedOrigins[0];

        // Add CORS headers
        $response->headers->set('Access-Control-Allow-Origin', $allowOriginHeader);
        $response->headers->set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        $response->headers->set('Access-Control-Allow-Headers',
            'Content-Type, Accept, Authorization, X-Requested-With, X-Socket-Id, Socket-Id, Channel-Name, X-Channel-Name'
        );
        $response->headers->set('Access-Control-Allow-Credentials', 'true');
        $response->headers->set('Access-Control-Expose-Headers', 'X-Socket-Id');
        $response->headers->set('Access-Control-Max-Age', '86400');

        return $response;
    }
}
