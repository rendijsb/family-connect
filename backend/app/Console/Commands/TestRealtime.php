<?php

namespace App\Console\Commands;

use App\Events\Chat\MessageSent;
use App\Models\Chat\ChatMessage;
use App\Models\Chat\ChatRoom;
use App\Models\Users\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class TestRealtime extends Command
{
    protected $signature = 'test:realtime {--room_id=5}';
    protected $description = 'Test real-time broadcasting with a test message';

    public function handle()
    {
        $roomId = $this->option('room_id');

        $this->info("🔍 Looking for chat room with ID: {$roomId}");

        $room = ChatRoom::find($roomId);
        if (!$room) {
            $this->error("❌ Chat room with ID {$roomId} not found.");

            // Show available rooms
            $rooms = ChatRoom::all();
            if ($rooms->count() > 0) {
                $this->info("Available rooms:");
                foreach ($rooms as $r) {
                    $this->line("  - ID: {$r->id}, Name: {$r->name}");
                }
            } else {
                $this->warning("No chat rooms found in database.");
            }
            return 1;
        }

        $user = User::first();
        if (!$user) {
            $this->error("❌ No users found in database.");
            return 1;
        }

        $this->info("✅ Found room: {$room->name}");
        $this->info("✅ Using user: {$user->name}");

        // Create a test message
        $testMessage = 'Test real-time message - ' . now()->format('H:i:s');

        $message = ChatMessage::create([
            'chat_room_id' => $room->id,
            'user_id' => $user->id,
            'message' => $testMessage,
            'type' => 'text',
        ]);

        $message->load(['user:id,name,email']);

        $this->info("📝 Created test message: {$testMessage}");
        $this->info("🚀 Broadcasting message...");

        // Broadcast the event
        try {
            $event = new MessageSent($message);
            broadcast($event);

            $this->info('✅ Test message broadcasted successfully!');
            $this->info("📊 Details:");
            $this->line("  - Message ID: {$message->id}");
            $this->line("  - Room ID: {$room->id}");
            $this->line("  - Channel: chat-room.{$room->id}");
            $this->line("  - User: {$user->name}");
            $this->line("  - Content: {$message->message}");

            $this->newLine();
            $this->info("🔍 Check your browser tabs - the message should appear in real-time!");
            $this->info("💡 If you have the chat room open in two browser tabs, you should see this message appear immediately.");

        } catch (\Exception $e) {
            $this->error('❌ Broadcasting failed: ' . $e->getMessage());
            Log::error('Test realtime broadcasting failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return 1;
        }

        return 0;
    }
}
