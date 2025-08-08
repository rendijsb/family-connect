<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('family_activities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('family_id')->constrained('families')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('type');
            $table->string('title');
            $table->text('description')->nullable();
            $table->json('metadata')->nullable();
            $table->boolean('is_visible')->default(true);
            $table->timestamps();

            $table->index(['family_id', 'created_at']);
            $table->index(['family_id', 'type']);
            $table->index(['user_id', 'created_at']);
            $table->index(['family_id', 'is_visible', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('family_activities');
    }
};
