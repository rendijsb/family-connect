<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('family_activities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('family_id')->constrained('family')->onDelete('cascade');
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
            $table->string('title');
            $table->text('description')->nullable();
            $table->enum('type', ['event', 'milestone', 'achievement', 'memory', 'announcement'])->default('event');
            $table->enum('status', ['planned', 'active', 'completed', 'cancelled'])->default('planned');
            $table->timestamp('activity_date')->nullable();
            $table->timestamp('start_time')->nullable();
            $table->timestamp('end_time')->nullable();
            $table->string('location')->nullable();
            $table->json('attendees')->nullable();
            $table->json('metadata')->nullable();
            $table->boolean('is_private')->default(false);
            $table->timestamps();

            $table->index(['family_id', 'type']);
            $table->index(['family_id', 'activity_date']);
            $table->index(['family_id', 'status']);
            $table->index(['created_by']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('family_activities');
    }
};
