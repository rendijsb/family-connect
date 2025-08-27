<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class DebugBroadcasting extends Command
{
    protected $signature = 'debug:broadcast';
    protected $description = 'Debug broadcasting configuration and connectivity';

    public function handle()
    {
        $this->info('🔧 Debugging Broadcasting Configuration...');
        $this->line('');

        // 1. Check environment variables
        $this->checkEnvironmentVariables();

        // 2. Check configuration
        $this->checkConfiguration();

        // 3. Test connectivity
        $this->testConnectivity();

        // 4. Test Reverb health endpoint
        $this->testReverbHealth();

        $this->line('');
        $this->info('✅ Broadcasting debug completed!');

        return 0;
    }

    private function checkEnvironmentVariables()
    {
        $this->info('📊 Environment Variables:');

        $vars = [
            'BROADCAST_DRIVER',
            'REVERB_APP_ID',
            'REVERB_APP_KEY',
            'REVERB_APP_SECRET',
            'REVERB_HOST',
            'REVERB_PORT',
            'REVERB_SCHEME'
        ];

        foreach ($vars as $var) {
            $value = env($var);
            if ($var === 'REVERB_APP_SECRET') {
                $value = $value ? str_repeat('*', strlen($value)) : 'NOT SET';
            }

            $status = $value ? '✅' : '❌';
            $this->line("  {$status} {$var}: " . ($value ?: 'NOT SET'));
        }
        $this->line('');
    }

    private function checkConfiguration()
    {
        $this->info('⚙️  Laravel Configuration:');

        // Broadcasting default
        $default = config('broadcasting.default');
        $this->line("  - Default driver: {$default}");

        // Reverb config
        $reverbConfig = config('broadcasting.connections.reverb');
        $this->line("  - Reverb app_id: " . ($reverbConfig['app_id'] ?? 'NOT SET'));
        $this->line("  - Reverb key: " . ($reverbConfig['key'] ?? 'NOT SET'));
        $this->line("  - Reverb host: " . ($reverbConfig['options']['host'] ?? 'NOT SET'));
        $this->line("  - Reverb port: " . ($reverbConfig['options']['port'] ?? 'NOT SET'));

        // Reverb apps config (vendor format expects 'app_id')
        $apps = config('reverb.apps.apps');
        if (!empty($apps)) {
            $app = $apps[0];
            $this->line("  - Reverb apps config:");
            $this->line("    * App ID: " . ($app['app_id'] ?? 'NOT SET'));
            $this->line("    * App Key: " . ($app['key'] ?? 'NOT SET'));
            // 'name' may not be defined in vendor config; print options host/port instead
            $options = $app['options'] ?? [];
            $this->line("    * Host: " . ($options['host'] ?? 'NOT SET'));
            $this->line("    * Port: " . ($options['port'] ?? 'NOT SET'));
        } else {
            $this->line("  ❌ No Reverb apps configured!");
        }

        $this->line('');
    }

    private function testConnectivity()
    {
        $this->info('🔌 Testing Connectivity:');

        $config = config('broadcasting.connections.reverb');
        $host = $config['options']['host'] ?? 'localhost';
        $port = $config['options']['port'] ?? 8080;
        $scheme = $config['options']['scheme'] ?? 'http';

        // Test basic connection to WebSocket service
        $client = new \GuzzleHttp\Client([
            'timeout' => 5,
            'http_errors' => false
        ]);

        try {
            $response = $client->get("{$scheme}://{$host}:{$port}/");
            $statusCode = $response->getStatusCode();

            if ($statusCode === 200) {
                $this->line("  ✅ WebSocket server is running on {$host}:{$port}");
            } else {
                $this->line("  ⚠️  WebSocket server responded with status: {$statusCode}");
            }

        } catch (\Exception $e) {
            $this->line("  ❌ Cannot reach WebSocket server: " . $e->getMessage());
        }

        $this->line('');
    }

    private function testReverbHealth()
    {
        $this->info('🏥 Testing Reverb Health Endpoint:');

        $config = config('broadcasting.connections.reverb');
        $host = $config['options']['host'] ?? 'localhost';
        $port = $config['options']['port'] ?? 8080;
        $scheme = $config['options']['scheme'] ?? 'http';

        $client = new \GuzzleHttp\Client([
            'timeout' => 5,
            'http_errors' => false
        ]);

        try {
            $response = $client->get("{$scheme}://{$host}:{$port}/health");
            $statusCode = $response->getStatusCode();
            $body = $response->getBody()->getContents();

            if ($statusCode === 200) {
                $this->line("  ✅ Reverb health check passed");

                try {
                    $data = json_decode($body, true);
                    if ($data) {
                        $this->line("  📊 Health data: " . json_encode($data, JSON_PRETTY_PRINT));
                    }
                } catch (\Exception $e) {
                    $this->line("  📊 Raw response: {$body}");
                }
            } else {
                $this->line("  ❌ Health endpoint returned status: {$statusCode}");
                $this->line("  📊 Response: {$body}");
            }

        } catch (\Exception $e) {
            $this->line("  ❌ Cannot reach health endpoint: " . $e->getMessage());
        }
    }
}
