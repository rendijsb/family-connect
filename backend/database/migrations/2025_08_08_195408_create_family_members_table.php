<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('family_members', function (Blueprint $table) {
            $table->id();
            $table->foreignId('family_id')->constrained('families')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->enum('role', ['owner', 'admin', 'member', 'child'])->default('member');
            $table->enum('status', ['active', 'inactive', 'blocked', 'pending'])->default('active');
            $table->timestamp('joined_at')->useCurrent();
            $table->timestamp('last_activity_at')->nullable();
            $table->json('permissions')->nullable(); // Custom permissions for this family
            $table->json('preferences')->nullable(); // Member-specific preferences
            $table->timestamps();

            $table->unique(['family_id', 'user_id']);

            $table->index(['family_id', 'status']);
            $table->index(['user_id', 'status']);
            $table->index('role');
            $table->index('last_activity_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('family_members');
    }
};
