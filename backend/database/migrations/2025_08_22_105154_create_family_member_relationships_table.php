<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('family_member_relationships', function (Blueprint $table) {
            $table->id();
            $table->foreignId('family_id')->constrained('families')->cascadeOnDelete();
            $table->foreignId('member_id')->constrained('family_members')->cascadeOnDelete();
            $table->foreignId('related_member_id')->constrained('family_members')->cascadeOnDelete();
            $table->string('relationship_type'); // parent, child, sibling, spouse, etc.
            $table->boolean('is_guardian')->default(false);
            $table->timestamps();

            $table->unique(['family_id', 'member_id', 'related_member_id'], 'fmr_family_member_related_unique');
            $table->index('family_id');
            $table->index('relationship_type');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('family_member_relationships');
    }
};
