<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\View\View;

class HomeController extends Controller
{
    public function index(): View
    {
        return view('welcome', [
            'appName' => config('app.name'),
            'appVersion' => env('APP_VERSION', '1.0.0'),
            'features' => [
                'Family Chat & Communication',
                'Real-time Messaging',
                'Photo & Memory Sharing',
                'Family Calendar & Events',
                'Safe & Secure',
            ],
        ]);
    }

    public function privacy(): View
    {
        return view('privacy');
    }

    public function terms(): View
    {
        return view('terms');
    }

    public function support(): View
    {
        return view('support');
    }
}
