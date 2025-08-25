<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('chat_rooms', function (Blueprint $table) {
            $table->id();
            $table->foreignId('family_id')->constrained('families')->cascadeOnDelete();
            $table->string('name');
            $table->string('type')->default('group'); // group, direct, announcement
            $table->text('description')->nullable();
            $table->foreignId('created_by')->constrained('users');
            $table->boolean('is_private')->default(false);
            $table->boolean('is_archived')->default(false);
            $table->json('settings')->nullable();
            $table->timestamp('last_message_at')->nullable();
            $table->timestamps();

            $table->index('family_id');
            $table->index('type');
            $table->index('is_archived');
            $table->index('last_message_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('chat_rooms');
    }
};
