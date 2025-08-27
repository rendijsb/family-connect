<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class TestBroadcasting extends Command
{
    protected $signature = 'test:broadcast';
    protected $description = 'Test if broadcasting is working';

    public function handle()
    {
        $this->info('🔍 Testing broadcasting configuration...');

        try {
            // Test basic connection
            $config = config('broadcasting.connections.reverb');
            $this->info('📊 Reverb Config:');
            $this->line('  - Host: ' . $config['options']['host']);
            $this->line('  - Port: ' . $config['options']['port']);
            $this->line('  - Scheme: ' . $config['options']['scheme']);

            // Test simple broadcast using existing event
            $this->info('📡 Testing connection to WebSocket service...');

            // Test HTTP connection to WebSocket service
            $client = new \GuzzleHttp\Client();
            try {
                $response = $client->get('http://websocket:8080/health', ['timeout' => 5]);
                $this->info('✅ WebSocket service is reachable: ' . $response->getStatusCode());
            } catch (\Exception $e) {
                $this->error('❌ Cannot reach WebSocket service: ' . $e->getMessage());
                return 1;
            }

            $this->info('📡 Testing Reverb API endpoint...');

            // Test Reverb API endpoint that Laravel uses for broadcasting
            try {
                $reverb_url = 'http://websocket:8080/apps/' . config('broadcasting.connections.reverb.app_id') . '/events';
                $this->info('Testing URL: ' . $reverb_url);

                // This will test the same endpoint Laravel uses
                $response = $client->get($reverb_url . '?info', ['timeout' => 5]);
                $this->info('✅ Reverb API endpoint accessible');
            } catch (\Exception $e) {
                $this->error('❌ Reverb API endpoint failed: ' . $e->getMessage());
            }

            $this->info('✅ Broadcast test completed successfully!');

        } catch (\Exception $e) {
            $this->error('❌ Broadcasting test failed: ' . $e->getMessage());
            Log::error('Broadcasting test failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return 1;
        }

        return 0;
    }
}
