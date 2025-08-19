<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {

    public function up(): void
    {
        Schema::create('images', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('related_id');
            $table->string('image_link');
            $table->string('type');
            $table->boolean('is_primary')->default(false);
            $table->timestamps();

            $table->index(['related_id', 'type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('images');
    }
};
