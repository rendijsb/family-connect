<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('chat_room_members', function (Blueprint $table) {
            $table->id();
            $table->foreignId('chat_room_id')->constrained('chat_rooms')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->boolean('is_admin')->default(false);
            $table->boolean('is_muted')->default(false);
            $table->timestamp('last_read_at')->nullable();
            $table->integer('unread_count')->default(0);
            $table->timestamp('muted_until')->nullable();
            $table->timestamps();

            $table->unique(['chat_room_id', 'user_id']);
            $table->index('chat_room_id');
            $table->index('user_id');
            $table->index('last_read_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('chat_room_members');
    }
};
