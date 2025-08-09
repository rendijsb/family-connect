<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('family_invitations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('family_id')->constrained('families')->onDelete('cascade');
            $table->foreignId('invited_by')->constrained('users')->onDelete('cascade');
            $table->string('email');
            $table->string('token', 64)->unique();
            $table->enum('role', ['admin', 'member', 'child'])->default('member');
            $table->enum('status', ['pending', 'accepted', 'declined', 'expired', 'cancelled'])->default('pending');
            $table->timestamp('expires_at');
            $table->timestamp('sent_at')->useCurrent();
            $table->timestamp('responded_at')->nullable();
            $table->json('invitation_data')->nullable();
            $table->timestamps();

            $table->index(['family_id', 'status']);
            $table->index(['email', 'status']);
            $table->index('token');
            $table->index('expires_at');
            $table->index(['family_id', 'email', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('family_invitations');
    }
};
