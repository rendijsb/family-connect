// 2025_08_19_100001_create_families_table.php
<?php

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
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->foreignId('owner_id')->constrained('users')->cascadeOnDelete();
            $table->string('privacy')->default('private');
            $table->string('join_code', 8)->unique()->nullable();
            $table->json('settings')->nullable();
            $table->string('timezone')->default('UTC');
            $table->string('language')->default('en');
            $table->integer('max_members')->default(20);
            $table->boolean('is_active')->default(true);
            $table->timestamp('last_activity_at')->nullable();
            $table->timestamps();

            $table->index('slug');
            $table->index('join_code');
            $table->index('owner_id');
            $table->index('is_active');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('families');
    }
};
