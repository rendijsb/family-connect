<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('families', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->foreignId('owner_id')->constrained('users')->onDelete('cascade');
            $table->json('settings')->nullable(); // Privacy controls, preferences, etc.
            $table->string('invite_code', 8)->unique()->nullable(); // For easy family joining
            $table->boolean('is_active')->default(true);
            $table->timestamp('archived_at')->nullable();
            $table->timestamps();

            $table->index(['owner_id', 'is_active']);
            $table->index('invite_code');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('families');
    }
};
